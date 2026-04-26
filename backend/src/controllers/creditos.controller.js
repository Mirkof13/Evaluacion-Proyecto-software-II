/**
 * BANCOSOL - Controller: Créditos
 * Gestión de créditos y amortizaciones
 * Accesos: oficial_credito (create, read own), analista (read all + update estado), admin (all)
 */

const { body, query, param, validationResult } = require('express-validator');
const { Credito, Cliente } = require('../models');
const creditoService = require('../services/credito.service');
const pagoService = require('../services/pago.service');
const { success, error, created, updated, notFound, validationError, businessError } = require('../utils/responseHelper');

/**
 * GET /api/creditos
 * Listar créditos con filtros
 */
exports.listar = [
  query('estado').optional(),
  query('oficial_id').optional().isInt(),
  query('cliente_id').optional().isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { page = 1, limit = 10, ...queryFiltros } = req.query;
      
      // Limpiar filtros vacíos
      const filtros = {};
      Object.keys(queryFiltros).forEach(key => {
        if (queryFiltros[key] !== '' && queryFiltros[key] !== null && queryFiltros[key] !== undefined) {
          filtros[key] = queryFiltros[key];
        }
      });

      // Si es oficial_credito, mostrar solo sus créditos
      if (req.user.rol === 'oficial_credito' && !filtros.oficial_id) {
        filtros.oficial_id = req.user.id;
      }

      const resultado = await creditoService.listarCreditos({
        ...filtros,
        page,
        limit
      });

      return success(res, resultado);
    } catch (err) {
      return error(res, 'Error al listar créditos: ' + err.message, 500);
    }
  }
];

/**
 * POST /api/creditos
 * Crear nuevo crédito + generar amortización
 * Acceso: oficial_credito+, admin
 */
exports.crear = [
  body('cliente_id').isInt(),
  body('oficial_id').isInt(),
  body('monto').isFloat({ min: 1 }),
  body('tasa_interes').isFloat({ min: 0.0001, max: 1 }),
  body('plazo_meses').isInt({ min: 1, max: 360 }),
  body('destino').optional().isLength({ max: 200 }),
  body('garantia').optional().isLength({ max: 200 }),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      // Verificar que el cliente existe
      const cliente = await Cliente.findByPk(req.body.cliente_id);
      if (!cliente || !cliente.activo) {
        return notFound(res, 'Cliente');
      }

      // Crear crédito
      const credito = await creditoService.crearCredito({
        ...req.body,
        oficial_id: req.user.rol === 'oficial_credito' ? req.user.id : req.body.oficial_id
      });

      return created(res, credito, 'Crédito creado exitosamente');
    } catch (err) {
      return error(res, 'Error al crear crédito: ' + err.message, 500);
    }
  }
];

/**
 * GET /api/creditos/:id
 * Obtener crédito completo (amortizaciones, pagos, historial)
 */
exports.obtener = async (req, res) => {
  try {
    const credito = await creditoService.obtenerCredito(req.params.id);

    // Verificar ownership para oficial_credito
    if (req.user.rol === 'oficial_credito' && credito.oficial_id !== req.user.id) {
      return error(res, 'No autorizado para ver este crédito', 403);
    }

    return success(res, credito);
  } catch (err) {
    if (err.message === 'Crédito no encontrado') {
      return notFound(res, 'Crédito');
    }
    return error(res, err.message, 500);
  }
};

/**
 * PUT /api/creditos/:id/estado
 * Cambiar estado de crédito (aprobado/rechazado/activo/etc)
 * Acceso: analista+, admin
 */
exports.cambiarEstado = [
  body('estado')
    .notEmpty()
    .isIn(['pendiente', 'aprobado', 'rechazado', 'activo', 'al_dia', 'en_mora', 'cancelado', 'castigado']),
  body('motivo').optional().isLength({ max: 500 }),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { estado, motivo } = req.body;

      const credito = await creditoService.cambiarEstado(
        req.params.id,
        estado,
        req.user.id,
        motivo
      );

      return updated(res, credito, `Estado actualizado a '${estado}'`);
    } catch (err) {
      if (err.message.includes('no encontrado')) {
        return notFound(res, 'Crédito');
      }
      if (err.message.includes('inválida')) {
        return businessError(res, err.message);
      }
      return error(res, 'Error al cambiar estado: ' + err.message, 500);
    }
  }
];

module.exports = {
  listar: exports.listar,
  crear: exports.crear,
  obtener: exports.obtener,
  cambiarEstado: exports.cambiarEstado
};
