/**
 * BANCOSOL - Controller: Autenticación
 * Capa de Presentación (REST API)
 * Endpoints: /api/auth/*
 */

const { body, validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const { success, error, unauthorized, validationError } = require('../utils/responseHelper');

/**
 * POST /api/auth/login
 * Login de usuario
 */
exports.login = [
  // Validaciones
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().isLength({ min: 6 }),

  async (req, res) => {
    try {
      // Validar errores
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { email, password } = req.body;

      // Autenticar
      const resultado = await authService.login(email, password);

      return success(res, resultado, 'Login exitoso');
    } catch (err) {
      return unauthorized(res, err.message);
    }
  }
];

/**
 * POST /api/auth/logout
 * Cerrar sesión (cliente elimina token)
 */
exports.logout = async (req, res) => {
  try {
    const resultado = authService.logout();
    return success(res, resultado, 'Sesión cerrada');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/auth/me
 * Obtener perfil del usuario actual
 */
exports.perfil = async (req, res) => {
  try {
    const userId = req.user.id;
    const usuario = await authService.perfil(userId);
    return success(res, usuario);
  } catch (err) {
    if (err.message === 'Usuario no encontrado') {
      return unauthorized(res, err.message);
    }
    return error(res, err.message, 500);
  }
};

module.exports = {
  login: exports.login,
  logout: exports.logout,
  perfil: exports.perfil
};
