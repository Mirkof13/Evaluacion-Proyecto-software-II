/**
 * BANCOSOL - Service de Lógica de Negocio: Créditos
 * Capa de Negocio (Business Logic Layer)
 */

const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const {
  Credito,
  Amortizacion,
  Pago,
  EstadoCredito,
  Cliente,
  Usuario,
  Documento
} = require('../models');
const calculos = require('../utils/calculos');
const mlEngine = require('../utils/machineLearning');

const creditoService = {
  /**
   * Crear nuevo crédito y generar tabla de amortización
   */
  async crearCredito(datos) {
    const transaction = await sequelize.transaction();

    try {
      // Validaciones
      if (!datos.cliente_id || !datos.oficial_id || !datos.monto || !datos.tasa_interes || !datos.plazo_meses) {
        throw new Error('Datos incompletos para crear crédito');
      }

      // Generar número de crédito
      const año = new Date().getFullYear();
      const ultimo = await Credito.count({
        where: { numero_credito: { [Op.iLike]: `SOL-${año}-%` } }
      });
      const numeroCredito = `SOL-${año}-${String(ultimo + 1).padStart(4, '0')}`;

      // Crear crédito
      const credito = await Credito.create({
        numero_credito: numeroCredito,
        cliente_id: datos.cliente_id,
        oficial_id: datos.oficial_id,
        monto: datos.monto,
        tasa_interes: datos.tasa_interes,
        plazo_meses: datos.plazo_meses,
        destino: datos.destino,
        garantia: datos.garantia,
        estado: 'pendiente',
        saldo_pendiente: datos.monto,
        fecha_vencimiento: calcularFechaVencimiento(datos.plazo_meses)
      }, { transaction });

      // Generar amortización
      const fechaPrimerVencimiento = new Date();
      fechaPrimerVencimiento.setMonth(fechaPrimerVencimiento.getMonth() + 1);
      fechaPrimerVencimiento.setDate(15);

      const amortizaciones = calculos.calcularAmortizacionFrancesa(
        datos.monto,
        datos.tasa_interes,
        datos.plazo_meses,
        fechaPrimerVencimiento
      );

      // Insertar amortizaciones
      for (const cuota of amortizaciones) {
        await Amortizacion.create({
          credito_id: credito.id,
          numero_cuota: cuota.numeroCuota,
          fecha_vencimiento: cuota.fechaVencimiento,
          capital: cuota.capital,
          interes: cuota.interes,
          cuota_total: cuota.cuotaTotal,
          saldo_capital: cuota.saldoCapital,
          pagado: false
        }, { transaction });
      }

      // Registrar historial de estado
      await EstadoCredito.create({
        credito_id: credito.id,
        estado_anterior: null,
        estado_nuevo: 'pendiente',
        usuario_id: datos.oficial_id,
        motivo: 'Crédito creado'
      }, { transaction });

      await transaction.commit();

      // Retornar crédito completo
      return await this.obtenerCredito(credito.id);
    } catch (error) {
      await transaction.rollback();
      console.error('[crearCredito]', error);
      throw error;
    }
  },

  /**
   * Obtener crédito con todas las relaciones
   */
  async obtenerCredito(creditoId) {
    const credito = await Credito.findByPk(creditoId, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'oficial' },
        { model: Documento, as: 'documentos' },
        {
          model: Amortizacion,
          as: 'amortizaciones',
          order: [['numero_cuota', 'ASC']]
        },
        {
          model: Pago,
          as: 'pagos',
          include: [{ model: Usuario, as: 'usuario' }],
          order: [['fecha_pago', 'DESC']]
        },
        {
          model: EstadoCredito,
          as: 'historial_estados',
          include: [{ model: Usuario, as: 'usuario' }],
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!credito) {
      throw new Error('Crédito no encontrado');
    }

    // Calcular estado financiero
    const estadoCartera = calculos.obtenerEstadoCartera(credito.amortizaciones);

    // Calcular ML Scoring y Riesgo Predictivo
    const fechaNacimiento = credito.cliente?.fecha_nacimiento;
    const edad = fechaNacimiento ? new Date().getFullYear() - new Date(fechaNacimiento).getFullYear() : 35;
    
    const score = mlEngine.calcularCreditScore({
      monto: parseFloat(credito.monto),
      plazo: credito.plazo_meses,
      tasa: parseFloat(credito.tasa_interes),
      edad: edad,
      moraHistorica: credito.mora_acumulada > 0 ? 1 : 0
    });

    const riesgo = mlEngine.clasificarRiesgo(score);
    const analitica = mlEngine.analisisRiesgoAvanzado(score, parseFloat(credito.monto));

    return {
      ...credito.toJSON(),
      estadoFinanciero: estadoCartera,
      analisisPredictivo: {
        score,
        pd: (analitica.pd * 100).toFixed(2) + '%',
        el: analitica.el,
        lgd: analitica.lgd,
        riesgo: riesgo.nivel,
        riesgoColor: riesgo.color,
        riesgoBadge: riesgo.badge
      }
    };
  },

  /**
   * Listar créditos con filtros
   */
  async listarCreditos(filtros = {}) {
    const where = {};
    const { page = 1, limit = 10 } = filtros;

    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.oficial_id) where.oficial_id = filtros.oficial_id;
    if (filtros.cliente_id) where.cliente_id = filtros.cliente_id;

    const { count, rows } = await Credito.findAndCountAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'apellido', 'ci'] },
        { model: Usuario, as: 'oficial', attributes: ['id', 'nombre'] }
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    return {
      creditos: rows,
      paginacion: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNextPage: page * limit < count,
        hasPrevPage: page > 1
      }
    };
  },

  /**
   * Cambiar estado de crédito
   */
  async cambiarEstado(creditoId, nuevoEstado, usuarioId, motivo = null) {
    const transaction = await sequelize.transaction();

    try {
      const credito = await Credito.findByPk(creditoId, { transaction });
      if (!credito) throw new Error('Crédito no encontrado');

      const estadoAnterior = credito.estado;

      if (!esTransicionValida(estadoAnterior, nuevoEstado)) {
        throw new Error(`Transición inválida: ${estadoAnterior} → ${nuevoEstado}`);
      }

      credito.estado = nuevoEstado;

      // Actualizar fechas según estado
      if (nuevoEstado === 'activo' && !credito.fecha_desembolso) {
        credito.fecha_desembolso = new Date();
      }
      if (nuevoEstado === 'cancelado') {
        credito.saldo_pendiente = 0;
        credito.mora_acumulada = 0;
      }

      await credito.save({ transaction });

      // Registrar historial
      await EstadoCredito.create({
        credito_id: creditoId,
        estado_anterior: estadoAnterior,
        estado_nuevo: nuevoEstado,
        usuario_id: usuarioId,
        motivo
      }, { transaction });

      await transaction.commit();

      return await this.obtenerCredito(creditoId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

// Helper
function esTransicionValida(actual, nuevo) {
  const mapa = {
    pendiente: ['aprobado', 'rechazado', 'cancelado'],
    aprobado: ['activo', 'rechazado', 'cancelado'],
    activo: ['en_mora', 'al_dia', 'cancelado', 'castigado'],
    en_mora: ['al_dia', 'activo', 'castigado'],
    al_dia: ['en_mora', 'cancelado'],
    cancelado: [],
    rechazado: [],
    castigado: ['cancelado']
  };
  return (mapa[actual] || []).includes(nuevo);
}

function calcularFechaVencimiento(plazoMeses) {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + plazoMeses);
  return fecha.toISOString().split('T')[0];
}

module.exports = creditoService;
