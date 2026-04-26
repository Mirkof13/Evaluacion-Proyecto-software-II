/**
 * BANCOSOL - Controller: Auditoría
 * Bitácora forense (ISO 27001)
 * Acceso: gerente+, admin
 */

const { query, validationResult } = require('express-validator');
const { AuditoriaLog, Usuario } = require('../models');
const { Op } = require('sequelize');
const { success, error, validationError, notFound } = require('../utils/responseHelper');

/**
 * GET /api/auditoria
 * Listar logs de auditoría con filtros
 */
exports.listar = [
  query('usuario_id').optional().isInt(),
  query('usuario_email').optional().isEmail(),
  query('accion').optional().isLength({ max: 50 }),
  query('tabla_afectada').optional().isLength({ max: 50 }),
  query('fecha_desde').optional().isISO8601(),
  query('fecha_hasta').optional().isISO8601(),
  query('resultado').optional().isIn(['exitoso', 'fallido']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      // Solo gerente y admin pueden ver auditoría
      if (!['admin', 'gerente'].includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Requiere rol gerente o admin',
          code: 'FORBIDDEN'
        });
      }

      const {
        usuario_id,
        usuario_email,
        accion,
        tabla_afectada,
        fecha_desde,
        fecha_hasta,
        resultado,
        page = 1,
        limit = 50
      } = req.query;

      // Construir where
      const where = {};

      if (usuario_id) where.usuario_id = usuario_id;
      if (usuario_email) where.usuario_email = { [Op.iLike]: `%${usuario_email}%` };
      if (accion) where.accion = { [Op.iLike]: `%${accion}%` };
      if (tabla_afectada) where.tabla_afectada = tabla_afectada;
      if (resultado) where.resultado = resultado;
      if (fecha_desde || fecha_hasta) {
        where.created_at = {};
        if (fecha_desde) where.created_at[Op.gte] = fecha_desde;
        if (fecha_hasta) where.created_at[Op.lte] = fecha_hasta;
      }

      const { count, rows } = await AuditoriaLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']],
        attributes: {
          exclude: ['datos_antes', 'datos_despues']
        },
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email'],
          required: false
        }]
      });

      // Formatear logs
      const logs = rows.map(log => {
        const logJson = log.toJSON();
        
        // Calcular edad del registro para UI forense
        const fecha = new Date(log.createdAt || log.created_at || new Date());
        const ahora = new Date();
        const diffMs = ahora - fecha;
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
        logJson.edad_horas = diffHoras;

        return logJson;
      });

      return success(res, {
        logs,
        paginacion: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count
        }
      });
    } catch (err) {
      console.error('[AuditoriaController.listar]', err);
      return error(res, 'Error al obtener auditoría: ' + err.message, 500);
    }
  }
];

/**
 * GET /api/auditoria/:id
 * Obtener log de auditoría específico con datos completos (diff)
 */
exports.obtener = async (req, res) => {
  try {
    if (!['admin', 'gerente'].includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado',
        code: 'FORBIDDEN'
      });
    }

    const log = await AuditoriaLog.findByPk(req.params.id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombre', 'email']
      }]
    });

    if (!log) {
      return notFound(res, 'Registro de auditoría');
    }

    return success(res, log);
  } catch (err) {
    console.error('[AuditoriaController.obtener]', err);
    return error(res, err.message, 500);
  }
};

