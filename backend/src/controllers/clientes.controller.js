/**
 * BANCOSOL - Controller: Clientes
 * CRUD de clientes
 * Permisos: oficial_credito (create, read, update), admin (all), gerente/analista (read)
 */

const { body, query, validationResult } = require('express-validator');
const { Cliente } = require('../models');
const { Op } = require('sequelize');
const { success, error, created, updated, notFound, validationError, conflict } = require('../utils/responseHelper');

/**
 * GET /api/clientes
 * Listar clientes (paginado y con búsqueda)
 * Acceso: oficial_credito+, admin, gerente, analista
 */
exports.listar = [
  // Validaciones query params
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('busqueda').optional().trim().isLength({ max: 100 }),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { page = 1, limit = 10, busqueda } = req.query;

      // Construir where
      const where = {};
      if (busqueda) {
        where[Op.or] = [
          { ci: { [Op.iLike]: `%${busqueda}%` } },
          { nombre: { [Op.iLike]: `%${busqueda}%` } },
          { apellido: { [Op.iLike]: `%${busqueda}%` } }
        ];
      }

      // Oficial solo ve sus propios clientes? No, puede ver todos
      // En futura versión con ownership, filtrar por usuario

      const { count, rows } = await Cliente.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      const securityUtils = require('../utils/securityUtils');
      const isAdminOrGerente = ['admin', 'gerente'].includes(req.user?.rol);

      // ASFI: Enmascaramiento de datos (Data Masking) para usuarios sin privilegios altos
      const clientesProcesados = rows.map(cliente => {
        const c = cliente.toJSON();
        if (!isAdminOrGerente) {
          c.ci = securityUtils.enmascararDato(c.ci, 4); // Solo ver últimos dígitos/primeros
          if (c.telefono) c.telefono = securityUtils.enmascararDato(c.telefono, 4);
        }
        return c;
      });

      return success(res, {
        clientes: clientesProcesados,
        paginacion: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (err) {
      return error(res, 'Error al listar clientes: ' + err.message, 500);
    }
  }
];

/**
 * GET /api/clientes/:id
 * Obtener cliente por ID
 */
exports.obtener = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return notFound(res, 'Cliente');
    }

    const c = cliente.toJSON();
    const securityUtils = require('../utils/securityUtils');
    const isAdminOrGerente = ['admin', 'gerente'].includes(req.user?.rol);

    if (!isAdminOrGerente) {
      c.ci = securityUtils.enmascararDato(c.ci, 4);
      if (c.telefono) c.telefono = securityUtils.enmascararDato(c.telefono, 4);
    }

    return success(res, c);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * POST /api/clientes
 * Crear nuevo cliente
 * Acceso: oficial_credito+, admin
 */
exports.crear = [
  // Validaciones
  body('ci')
    .notEmpty()
    .isLength({ min: 7, max: 20 })
    .matches(/^[0-9]+$/).withMessage('CI debe contener solo números'),
  body('nombre').notEmpty().isLength({ min: 2, max: 100 }),
  body('apellido').notEmpty().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail(),
  body('telefono').optional().matches(/^[0-9]+$/),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      // Verificar CI único
      const existeCI = await Cliente.findOne({ where: { ci: req.body.ci } });
      if (existeCI) {
        return conflict(res, 'Ya existe un cliente con ese CI');
      }

      // Crear cliente
      const cliente = await Cliente.create(req.body);

      return created(res, cliente, 'Cliente creado exitosamente');
    } catch (err) {
      if (err.message.includes('duplicate')) {
        return conflict(res, 'El CI ya está registrado');
      }
      return error(res, 'Error al crear cliente: ' + err.message, 500);
    }
  }
];

/**
 * PUT /api/clientes/:id
 * Actualizar cliente
 * Acceso: oficial_credito+, admin
 */
exports.actualizar = [
  body('nombre').optional().isLength({ min: 2, max: 100 }),
  body('apellido').optional().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail(),
  body('telefono').optional().matches(/^[0-9]+$/),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const cliente = await Cliente.findByPk(req.params.id);
      if (!cliente) {
        return notFound(res, 'Cliente');
      }

      // Si se actualiza CI, verificar que no exista
      if (req.body.ci && req.body.ci !== cliente.ci) {
        const existe = await Cliente.findOne({ where: { ci: req.body.ci } });
        if (existe) {
          return conflict(res, 'El CI ya está en uso');
        }
      }

      await cliente.update(req.body);

      return updated(res, cliente, 'Cliente actualizado');
    } catch (err) {
      return error(res, 'Error al actualizar cliente: ' + err.message, 500);
    }
  }
];

module.exports = {
  listar: exports.listar,
  obtener: exports.obtener,
  crear: exports.crear,
  actualizar: exports.actualizar
};
