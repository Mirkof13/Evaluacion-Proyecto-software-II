/**
 * BANCOSOL - Controller: Usuarios
 * Gestión de usuarios y roles
 * Acceso: Solo admin
 */

const { body, query, validationResult } = require('express-validator');
const { Usuario, Rol } = require('../models');
const { Op } = require('sequelize');
const authService = require('../services/auth.service');
const { success, error, created, updated, notFound, validationError, forbidden, conflict, businessError } = require('../utils/responseHelper');

/**
 * GET /api/usuarios
 * Listar usuarios (solo admin)
 */
exports.listar = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return forbidden(res, 'Solo administradores pueden ver usuarios');
    }

    const { page = 1, limit = 20, activo } = req.query;

    const where = {};
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const { count, rows } = await Usuario.findAndCountAll({
      where,
      include: [{ model: Rol, as: 'rol', attributes: ['id', 'nombre'] }],
      attributes: { exclude: ['password_hash'] },
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    return success(res, {
      usuarios: rows,
      paginacion: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (err) {
    return error(res, 'Error al listar usuarios: ' + err.message, 500);
  }
};

/**
 * POST /api/usuarios
 * Crear usuario (solo admin)
 */
exports.crear = [
  body('nombre').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('rol_id').isInt(),

  async (req, res) => {
    try {
      if (req.user.rol !== 'admin') {
        return forbidden(res, 'Solo administradores pueden crear usuarios');
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      // Verificar que el rol existe
      const rol = await Rol.findByPk(req.body.rol_id);
      if (!rol) {
        return notFound(res, 'Rol');
      }

      // Crear usuario
      const usuario = await authService.crearUsuario({
        nombre: req.body.nombre,
        email: req.body.email,
        password: req.body.password,
        rol_id: req.body.rol_id,
        activo: req.body.activo !== false
      });

      return created(res, usuario, 'Usuario creado exitosamente');
    } catch (err) {
      if (err.message.includes('ya registrado')) {
        return conflict(res, 'Email ya registrado');
      }
      return error(res, 'Error al crear usuario: ' + err.message, 500);
    }
  }
];

/**
 * PUT /api/usuarios/:id
 * Actualizar usuario (solo admin)
 */
exports.actualizar = [
  body('nombre').optional().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('rol_id').optional().isInt(),
  body('activo').optional().isBoolean(),

  async (req, res) => {
    try {
      if (req.user.rol !== 'admin') {
        return forbidden(res, 'Solo administradores pueden modificar usuarios');
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      // No permitir que se auto-desactive o auto-cambie rol crítico
      if (req.params.id == req.user.id && req.body.activo === false) {
        return businessError(res, 'No puede desactivar su propia cuenta');
      }

      const usuario = await authService.actualizarUsuario(req.params.id, req.body);

      return updated(res, usuario, 'Usuario actualizado');
    } catch (err) {
      if (err.message.includes('no encontrado')) {
        return notFound(res, 'Usuario');
      }
      return error(res, 'Error al actualizar usuario: ' + err.message, 500);
    }
  }
];
