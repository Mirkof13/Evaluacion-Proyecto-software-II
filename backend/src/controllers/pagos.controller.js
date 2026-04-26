/**
 * BANCOSOL - Controller: Pagos
 * Registro y consulta de pagos
 * Acceso: oficial_credito (crear, read), admin (all)
 */

const { body, param, validationResult } = require('express-validator');
const { Credito } = require('../models');
const pagoService = require('../services/pago.service');
const { success, error, created, notFound, validationError, businessError } = require('../utils/responseHelper');

/**
 * GET /api/creditos/:id/pagos
 * Historial de pagos de un crédito
 */
exports.historial = async (req, res) => {
  try {
    // Verificar que el crédito existe
    const credito = await Credito.findByPk(req.params.id);
    if (!credito) {
      return notFound(res, 'Crédito');
    }

    // Verificar ownership para oficial
    if (req.user.rol === 'oficial_credito' && credito.oficial_id !== req.user.id) {
      return error(res, 'No autorizado', 403);
    }

    const pagos = await pagoService.obtenerHistorialPagos(req.params.id);

    return success(res, { pagos });
  } catch (err) {
    return error(res, 'Error al obtener historial: ' + err.message, 500);
  }
};

/**
 * POST /api/creditos/:id/pagos
 * Registrar nuevo pago
 * Acceso: oficial_credito+, admin
 */
exports.registrar = [
  body('monto_pagado').isFloat({ min: 0.01 }),
  body('tipo').optional().isIn(['cuota', 'anticipo', 'reprogramacion', 'castigo']),
  body('observacion').optional().isLength({ max: 500 }),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      // Verificar que el crédito existe
      const credito = await Credito.findByPk(req.params.id);
      if (!credito) {
        return notFound(res, 'Crédito');
      }

      // Verificar ownership
      if (req.user.rol === 'oficial_credito' && credito.oficial_id !== req.user.id) {
        return error(res, 'No autorizado para registrar pago en este crédito', 403);
      }

      // ASFI: Lógica de Autenticación Multifactor (MFA) para pagos altos
      // Simulando validación biométrica/TOTP requerida para transacciones mayores a 5000 Bs
      const montoPagado = parseFloat(req.body.monto_pagado);
      if (montoPagado > 5000) {
        const mfaToken = req.headers['x-mfa-token'] || req.body.mfa_token;
        if (!mfaToken) {
          // Generamos una excepción controlada para el cliente
          return res.status(403).json({
            success: false,
            message: 'ASFI: Las transacciones mayores a Bs. 5,000 requieren Autenticación Multifactor (MFA/Biometría).',
            requireMFA: true
          });
        }
        
        // Simular validación del token
        if (mfaToken !== 'bancosol-valid-mfa') {
          return error(res, 'Token MFA inválido o expirado.', 403);
        }
      }

      // Registrar pago
      const resultado = await pagoService.registrarPago({
        credito_id: credito.id,
        amortizacion_id: req.body.amortizacion_id || null,
        usuario_id: req.user.id,
        monto_pagado: parseFloat(req.body.monto_pagado),
        tipo: req.body.tipo || 'cuota',
        observacion: req.body.observacion,
        fecha_pago: req.body.fecha_pago || new Date()
      });

      return created(res, resultado, 'Pago registrado exitosamente');
    } catch (err) {
      if (err.message.includes('no encontrado')) {
        return notFound(res, 'Crédito');
      }
      if (err.message.includes('pendientes')) {
        return businessError(res, err.message);
      }
      return error(res, 'Error al registrar pago: ' + err.message, 500);
    }
  }
];

/**
 * GET /api/creditos/:id/pagos/proxima
 * Obtener próxima cuota a pagar
 */
exports.proximaCuota = async (req, res) => {
  try {
    const credito = await Credito.findByPk(req.params.id);
    if (!credito) {
      return notFound(res, 'Crédito');
    }

    // Ownership check
    if (req.user.rol === 'oficial_credito' && credito.oficial_id !== req.user.id) {
      return error(res, 'No autorizado', 403);
    }

    const proxima = await pagoService.proximaCuota(req.params.id);

    if (!proxima) {
      return success(res, { proximaCuota: null, message: 'No hay cuotas pendientes' });
    }

    return success(res, { proximaCuota: proxima });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  historial: exports.historial,
  registrar: exports.registrar,
  proximaCuota: exports.proximaCuota
};
