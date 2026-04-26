/**
 * BANCOSOL - Service de Lógica de Negocio: Pagos
 * Capa de Negocio para procesamiento de pagos
 *
 * Responsabilidades:
 * - Calcular mora automáticamente
 * - Distribuir pago entre capital, interés, mora
 * - Actualizar amortización y saldo del crédito
 * - Generar registro de auditoría
 */

const { sequelize } = require('../config/database');
const { Pago, Amortizacion, Credito, Usuario, EstadoCredito } = require('../models');
const calculos = require('../utils/calculos');
const creditoService = require('./credito.service');

const pagoService = {
  /**
   * Registrar pago para un crédito
   *
   * @param {Object} datos - { creditoId, amortizacionId, usuarioId, montoPagado, observacion }
   * @returns {Object} Pago creado + resumen actualizado
   */
  async registrarPago(datos) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Validar que el crédito existe
      const credito = await Credito.findByPk(datos.credito_id);
      if (!credito) {
        throw new Error('Crédito no encontrado');
      }

      // 2. Buscar amortización pendiente más próxima (si no se especifica)
      let amortizacion;
      if (datos.amortizacion_id) {
        amortizacion = await Amortizacion.findByPk(datos.amortizacion_id);
        if (!amortizacion || amortizacion.credito_id !== credito.id) {
          throw new Error('Amortización no válida para este crédito');
        }
      } else {
        // Buscar próxima cuota pendiente ordenada por número
        amortizacion = await Amortizacion.findOne({
          where: {
            credito_id: credito.id,
            pagado: false
          },
          order: [['numero_cuota', 'ASC']]
        });
      }

      if (!amortizacion) {
        throw new Error('No hay cuotas pendientes para este crédito');
      }

      // 3. Calcular mora
      const moraInfo = calculos.calcularMora(amortizacion, new Date());
      const cuotaTotalConMora = parseFloat(amortizacion.cuota_total) + parseFloat(moraInfo.montoMora);

      // 4. Validar monto pagado
      if (datos.monto_pagado < cuotaTotalConMora) {
        throw new Error(`Monto insuficiente. Cuota total: Bs. ${cuotaTotalConMora.toFixed(2)}`);
      }

      let saldoRestante = parseFloat(datos.monto_pagado);
      const montoMora = parseFloat(moraInfo.montoMora) || 0;
      const montoInteres = parseFloat(amortizacion.interes) || 0;
      let montoCapital = (parseFloat(amortizacion.cuota_total) || 0) - montoInteres;

      // Si el pago es mayor, se abona más a capital
      if (saldoRestante > cuotaTotalConMora) {
        montoCapital += (saldoRestante - cuotaTotalConMora);
      }

      // 6. Crear registro de pago
      const pago = await Pago.create({
        credito_id: credito.id,
        amortizacion_id: amortizacion.id,
        usuario_id: datos.usuario_id,
        monto_pagado: parseFloat(datos.monto_pagado) || 0,
        monto_capital: parseFloat(montoCapital) || 0,
        monto_interes: parseFloat(montoInteres) || 0,
        monto_mora: parseFloat(montoMora) || 0,
        dias_mora: parseInt(moraInfo.diasMora) || 0,
        fecha_pago: datos.fecha_pago || new Date(),
        tipo: datos.tipo || 'cuota',
        observacion: datos.observacion
      }, { transaction });

      // 7. Actualizar amortización como pagada
      amortizacion.pagado = true;
      amortizacion.fecha_pago = new Date().toISOString().split('T')[0];
      await amortizacion.save({ transaction });

      // 8. Actualizar saldo pendiente del crédito
      credito.saldo_pendiente = Math.max(0, parseFloat(credito.saldo_pendiente) - montoCapital);
      credito.mora_acumulada = Math.max(0, parseFloat(credito.mora_acumulada) - montoMora);

      // Determinar nuevo estado del crédito
      const cuotasPendientes = await Amortizacion.count({
        where: { credito_id: credito.id, pagado: false }
      });

      if (cuotasPendientes === 0) {
        credito.estado = 'cancelado';
      } else if (moraInfo.diasMora > 0) {
        credito.estado = 'en_mora';
      } else {
        credito.estado = 'al_dia';
      }

      await credito.save({ transaction });

      // 9. Registrar cambio de estado en historial
      await EstadoCredito.create({
        credito_id: credito.id,
        estado_anterior: credito.estado === 'cancelado' ? 'activo' : 'en_mora',  // simplificado
        estado_nuevo: credito.estado,
        usuario_id: datos.usuario_id,
        motivo: `Pago registrado: Bs. ${datos.monto_pagado.toFixed(2)}`
      }, { transaction });

      await transaction.commit();

      // 10. Retornar pago + estado actualizado
      const pagoCompleto = await Pago.findByPk(pago.id, {
        include: [{ model: Usuario, as: 'usuario' }]
      });

      const creditoActualizado = await this.obtenerEstadoCredito(credito.id);

      return {
        pago: pagoCompleto,
        credito: creditoActualizado
      };
    } catch (error) {
      await transaction.rollback();
      console.error('[registrarPago]', error);
      throw error;
    }
  },

  /**
   * Obtener historial de pagos de un crédito
   */
  async obtenerHistorialPagos(creditoId) {
    const pagos = await Pago.findAll({
      where: { credito_id: creditoId },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
        { model: Amortizacion, as: 'amortizacion' }
      ],
      order: [['fecha_pago', 'DESC']]
    });

    return pagos;
  },

  /**
   * Obtener resumen financiero de un crédito
   */
  async obtenerEstadoCredito(creditoId) {
    const credito = await Credito.findByPk(creditoId, {
      include: [{ model: Amortizacion, as: 'amortizaciones' }]
    });

    if (!credito) {
      throw new Error('Crédito no encontrado');
    }

    const estado = calculos.obtenerEstadoCartera(credito.amortizaciones);

    return {
      id: credito.id,
      numero_credito: credito.numero_credito,
      estado: credito.estado,
      monto_total: credito.monto,
      saldo_pendiente: credito.saldo_pendiente,
      mora_acumulada: credito.mora_acumulada,
      ...estado
    };
  },

  /**
   * Calcular próxima cuota a pagar
   */
  async proximaCuota(creditoId) {
    const credito = await Credito.findByPk(creditoId, {
      include: [{
        model: Amortizacion,
        as: 'amortizaciones',
        where: { pagado: false },
        order: [['numero_cuota', 'ASC']],
        limit: 1
      }]
    });

    if (!credito || credito.amortizaciones.length === 0) {
      return null;
    }

    const cuota = credito.amortizaciones[0];
    const mora = calculos.calcularMora(cuota, new Date());

    return {
      numeroCuota: cuota.numero_cuota,
      fechaVencimiento: cuota.fecha_vencimiento,
      capital: cuota.capital,
      interes: cuota.interes,
      cuotaTotal: parseFloat(cuota.cuota_total),
      mora: parseFloat(mora.montoMora),
      totalApagar: parseFloat(cuota.cuota_total) + parseFloat(mora.montoMora),
      diasMora: mora.diasMora
    };
  }
};

module.exports = pagoService;
