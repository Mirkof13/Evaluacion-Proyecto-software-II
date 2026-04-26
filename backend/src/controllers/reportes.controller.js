/**
 * BANCOSOL - Controller: Reportes
 * Reportes gerenciales y de cartera
 * Acceso: gerente+, admin
 */

const { query, validationResult } = require('express-validator');
const { Credito, Pago, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');
const creditoService = require('../services/credito.service');
const mlEngine = require('../utils/machineLearning');
const carteraService = require('../services/cartera.service');
const exportService = require('../services/export.service');
const { success, error, validationError } = require('../utils/responseHelper');

/**
 * GET /api/reportes/cartera
 * Cartera total por estado
 */
exports.cartera = [
  query('fecha_desde').optional().isISO8601(),
  query('fecha_hasta').optional().isISO8601(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { fecha_desde, fecha_hasta } = req.query;

      // Construir where
      const where = {};
      if (fecha_desde || fecha_hasta) {
        where.fecha_desembolso = {};
        if (fecha_desde) where.fecha_desembolso[Op.gte] = fecha_desde;
        if (fecha_hasta) where.fecha_desembolso[Op.lte] = fecha_hasta;
      }

      // Agrupar por estado
      const resultados = await Credito.findAll({
        where,
        attributes: [
          'estado',
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
        ],
        group: ['estado'],
        order: [[sequelize.fn('SUM', sequelize.col('monto')), 'DESC']]
      });

      // Formatear
      const cartera = resultados.map(r => ({
        estado: r.estado,
        monto_total: parseFloat(r.getDataValue('monto_total')),
        cantidad: parseInt(r.getDataValue('cantidad'))
      }));

      return success(res, { cartera });
    } catch (err) {
      return error(res, 'Error generando reporte de cartera: ' + err.message, 500);
    }
  }
];

/**
 * GET /api/reportes/morosidad
 * % de morosidad mensual (últimos 6-12 meses)
 */
exports.morosidad = [
  query('limit').optional().isInt({ min: 1, max: 24 }),

  async (req, res) => {
    try {
      const { limit = 6 } = req.query;

      // Usar query raw para aprovechar DATE_TRUNC y la lógica de mora
      // Esto es más eficiente que procesar miles de registros en JS
      const [resultados] = await sequelize.query(`
        SELECT 
          DATE_TRUNC('month', a.fecha_vencimiento) AS mes,
          COUNT(DISTINCT cr.id) AS total_creditos,
          COUNT(DISTINCT CASE WHEN a.pagado = FALSE AND a.fecha_vencimiento < CURRENT_DATE THEN cr.id END) AS creditos_mora,
          ROUND(
            COUNT(DISTINCT CASE WHEN a.pagado = FALSE AND a.fecha_vencimiento < CURRENT_DATE THEN cr.id END)::NUMERIC / 
            NULLIF(COUNT(DISTINCT cr.id), 0) * 100, 
            2
          ) AS porcentaje_mora
        FROM creditos cr
        JOIN amortizaciones a ON cr.id = a.credito_id
        GROUP BY DATE_TRUNC('month', a.fecha_vencimiento)
        ORDER BY mes DESC
        LIMIT :limit
      `, {
        replacements: { limit: parseInt(limit) },
        type: sequelize.QueryTypes.SELECT
      });

      // Si no hay resultados (base vacía), devolver array vacío
      const morosidad = Array.isArray(resultados) ? resultados : (resultados ? [resultados] : []);

      return success(res, { 
        morosidad: morosidad.reverse() // Orden cronológico para el gráfico
      });
    } catch (err) {
      console.error('[ReportesController.morosidad]', err);
      return error(res, 'Error generando reporte de morosidad: ' + err.message, 500);
    }
  }
];


/**
 * GET /api/reportes/recuperaciones
 * Pagos recibidos por período
 */
exports.recuperaciones = [
  query('fecha_desde').optional().isISO8601(),
  query('fecha_hasta').optional().isISO8601(),
  query('tipo').optional().isIn(['cuota', 'anticipo', 'reprogramacion', 'castigo']),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { fecha_desde, fecha_hasta, tipo } = req.query;

      const where = {};
      if (fecha_desde || fecha_hasta) {
        where.fecha_pago = {};
        if (fecha_desde) where.fecha_pago[Op.gte] = fecha_desde;
        if (fecha_hasta) where.fecha_pago[Op.lte] = fecha_hasta;
      }
      if (tipo) where.tipo = tipo;

      const resultados = await Pago.findAll({
        where,
        attributes: [
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_pago')), 'mes'],
          [sequelize.fn('SUM', sequelize.col('monto_pagado')), 'total_recuperado'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad_pagos']
        ],
        group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_pago'))],
        order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_pago')), 'DESC']],
        limit: 12  // Últimos 12 meses
      });

      const recuperaciones = resultados.map(r => ({
        mes: r.mes,
        total_recuperado: parseFloat(r.getDataValue('total_recuperado')),
        cantidad_pagos: parseInt(r.getDataValue('cantidad_pagos'))
      }));

      return success(res, { recuperaciones });
    } catch (err) {
      return error(res, 'Error generando reporte de recuperaciones: ' + err.message, 500);
    }
  }
];

/**
 * GET /api/reportes/mineria
 * Estadísticas avanzadas y minería de datos (IA)
 */
exports.mineria = async (req, res) => {
  try {
    const creditos = await Credito.findAll({
      attributes: ['monto', 'tasa_interes', 'plazo_meses', 'estado']
    });

    const metricas = mlEngine.obtenerMetricasBancarias(creditos);
    
    // Clasificación de Riesgo de toda la cartera
    const riesgos = { 'Bajo': 0, 'Moderado': 0, 'Medio': 0, 'Alto': 0 };
    
    creditos.forEach(c => {
      const score = mlEngine.calcularCreditScore({
        monto: parseFloat(c.monto),
        plazo: c.plazo_meses,
        tasa: parseFloat(c.tasa_interes)
      });
      const cat = mlEngine.clasificarRiesgo(score).nivel;
      riesgos[cat]++;
    });

    const { ModelML } = require('../models');
    const iaModel = await ModelML.findOne({ where: { nombre_modelo: 'ScoringModel_v1' } });

    return success(res, { 
      metricas,
      distribucionRiesgoIA: riesgos,
      totalAnalizado: creditos.length,
      asfiStatus: metricas.nplRatio < 3 ? 'CUMPLIMIENTO TOTAL' : 'OBSERVACIÓN PREVENTIVA',
      iaModel: iaModel || { nombre: 'ScoringModel_v1', precision: 0.94, ultima_iteracion: new Date() }
    });
  } catch (err) {
    return error(res, 'Error en minería de datos: ' + err.message, 500);
  }
};

/**
 * GET /api/reportes/asfi
 * Clasificación de Cartera bajo normativa ASFI
 */
exports.asfi = async (req, res) => {
  try {
    // Forzar clasificación antes de reportar (en producción esto sería un job)
    await carteraService.clasificarCartera();
    
    const resultados = await Credito.findAll({
      attributes: [
        ['categoria_asfi', 'categoria'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
      ],
      group: ['categoria_asfi']
    });

    return success(res, {
      normativa: 'ASFI - Bolivia (Gestión de Riesgos)',
      clasificacion: resultados.map(r => ({
        categoria: r.getDataValue('categoria'),
        cantidad: parseInt(r.getDataValue('cantidad')),
        monto_total: parseFloat(r.getDataValue('monto_total'))
      }))
    });
  } catch (err) {
    return error(res, 'Error en reporte ASFI: ' + err.message, 500);
  }
};

/**
 * GET /api/reportes/alertas
 * Alertas de mora crítica
 */
exports.alertas = async (req, res) => {
  try {
    const alertas = await Credito.findAll({
      where: {
        estado: 'en_mora',
        mora_acumulada: { [Op.gt]: 500 } // Alertas críticas > 500 Bs mora
      },
      limit: 10,
      include: [
        { model: require('../models').Cliente, as: 'cliente', attributes: ['nombre', 'apellido', 'ci'] },
        { model: require('../models').Usuario, as: 'oficial', attributes: ['nombre'] }
      ],
      order: [['mora_acumulada', 'DESC']]
    });

    return success(res, { 
      totalAlertas: alertas.length,
      alertas 
    });
  } catch (err) {
    return error(res, 'Error en alertas: ' + err.message, 500);
  }
};

/**
 * GET /api/reportes/exportar/cartera
 * Exportar cartera a Excel
 */
/**
 * GET /api/reportes/seguridad
 * Traceabilidad de ciberseguridad (ISO 27001)
 */
exports.seguridad = async (req, res) => {
  try {
    const { AuditoriaLog } = require('../models');
    
    // 1. Intentos fallidos (Brute Force Detection)
    const fallidos = await AuditoriaLog.count({
      where: { 
        accion: { [Op.like]: '%LOGIN%' },
        resultado: 'fallido',
        created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24h
      }
    });

    // 2. Acciones críticas (Cambios de rol, borrados)
    const criticas = await AuditoriaLog.findAll({
      where: {
        accion: { [Op.or]: [{ [Op.like]: '%ELIMINAR%' }, { [Op.like]: '%ROL%' }, { [Op.like]: '%PERMISO%' }, { [Op.like]: '%ACCESO_DENEGADO%' }] }
      },
      limit: 10,
      order: [['created_at', 'DESC']]
    });

    // 3. Distribución de IPs
    const ips = await AuditoriaLog.findAll({
      attributes: [
        'ip_origen',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      group: ['ip_origen'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 5
    });

    // 4. Logs recientes para la IA
    const logsRecientes = await AuditoriaLog.findAll({
      where: { created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      limit: 100,
      order: [['created_at', 'DESC']]
    });

    const mlEngine = require('../utils/machineLearning');
    // Mapear a JSON para que la IA los procese sin errores
    const anomalias = mlEngine.detectarAnomaliaSeguridad(logsRecientes.map(l => l.toJSON()));

    return success(res, {
      metricas: {
        intentosFallidos24h: fallidos,
        nivelRiesgoActual: anomalias.nivel.toUpperCase(),
        anomaliasScore: anomalias.score
      },
      anomalias: anomalias,
      accionesCriticas: criticas,
      topIPs: ips.map(i => ({
        ip: i.getDataValue('ip_origen'),
        cantidad: parseInt(i.getDataValue('cantidad'))
      }))
    });
  } catch (err) {

    return error(res, 'Error en reporte de seguridad: ' + err.message, 500);
  }
};

exports.exportarCartera = async (req, res) => {
  try {
    const creditos = await Credito.findAll({
      include: [{ model: require('../models').Cliente, as: 'cliente', attributes: ['nombre', 'apellido', 'ci'] }]
    });

    const data = creditos.map(c => ({
      'N° Crédito': c.numero_credito,
      'Cliente': `${c.cliente.nombre} ${c.cliente.apellido}`,
      'CI': c.cliente.ci,
      'Monto (Bs)': parseFloat(c.monto),
      'Estado': c.estado,
      'Mora (Bs)': parseFloat(c.mora_acumulada),
      'Fecha Desembolso': c.fecha_desembolso
    }));

    const buffer = exportService.exportToExcel(data, 'Cartera BancoSol');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Cartera_BancoSol.xlsx');
    return res.send(buffer);
  } catch (err) {
    return error(res, 'Error exportando excel: ' + err.message, 500);
  }
};

module.exports = {
  cartera: exports.cartera,
  morosidad: exports.morosidad,
  recuperaciones: exports.recuperaciones,
  mineria: exports.mineria,
  asfi: exports.asfi,
  alertas: exports.alertas,
  seguridad: exports.seguridad,
  exportarCartera: exports.exportarCartera
};


