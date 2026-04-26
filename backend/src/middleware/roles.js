/**
 * BANCOSOL - Middleware de Control de Acceso (IAM)
 * Verifica que el usuario tenga el rol requerido
 * Implementa RBAC (Role-Based Access Control)
 */

const { ForbiddenError } = require('../utils/responseHelper');

/**
 * Middleware: verificar que el usuario tenga al menos UNO de los roles permitidos
 * @param {Array<string>} rolesPermitidos - roles que pueden acceder
 * Uso: authorize(['admin', 'gerente'])
 */
const authorize = (rolesPermitidos = []) => {
  return (req, res, next) => {
    // authMiddleware ya debe haberse ejecutado antes
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.rol;

    // Si no hay roles específicos requeridos, permitir acceso a cualquier usuario autenticado
    if (rolesPermitidos.length === 0) {
      return next();
    }

    // Verificar si el usuario tiene uno de los roles permitidos
    const tienePermiso = rolesPermitidos.some(rol => {
      // Coincidencia exacta
      if (rol === userRole) return true;

      // Comodín: '*' significa todos los roles autenticados
      if (rol === '*') return true;

      return false;
    });

    if (!tienePermiso) {
      // ASFI: Loguear intento de acceso no autorizado (Forense)
      const { AuditoriaLog } = require('../models');
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      
      AuditoriaLog.create({
        usuario_id: req.user.id,
        usuario_email: req.user.email,
        accion: 'ACCESO_DENEGADO',
        tabla_afectada: req.originalUrl,
        ip_origen: ip,
        user_agent: req.headers['user-agent'] || 'unknown',
        endpoint: req.originalUrl,
        metodo_http: req.method,
        resultado: 'fallido',
        codigo_respuesta: 403,
        datos_adicionales: { roles_requeridos: rolesPermitidos, rol_usuario: userRole }
      }).catch(err => console.error('[Seguridad] Error logueando acceso denegado:', err.message));

      return res.status(403).json({
        success: false,
        message: `Acceso denegado (ASFI Libro 3, Título VII). Se requiere rol: ${rolesPermitidos.join(' o ')}`,
        code: 'FORBIDDEN',
        userRole: userRole
      });
    }

    next();
  };
};

/**
 * Middleware: verificar permiso específico dentro de los permisos del rol
 * @param {string} modulo - módulo (ej: 'clientes', 'creditos')
 * @param {string} accion - acción (ej: 'create', 'read', 'update', 'delete')
 * Uso: authorizeAction('creditos', 'create')
 */
const authorizeAction = (modulo, accion) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin tiene todos los permisos
    if (req.user.rol === 'admin') {
      return next();
    }

    // Verificar permisos en el objeto permisos del usuario
    const permisos = req.user.permisos || {};

    // Ruta: permisos[modulo][accion]
    if (permisos[modulo] && permisos[modulo][accion]) {
      return next();
    }

    // También verificar permiso 'all' si existe
    if (permisos.all) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `No tiene permiso para ${accion} en ${modulo}`,
      code: 'ACTION_FORBIDDEN',
      required: `${modulo}.${accion}`
    });
  };
};

/**
 * Helper: verificarownership (solo sus propios registros)
 * Para oficial_credito: solo puede ver sus propios créditos
 * @param {string} fieldName - nombre del campo en req.params (ej: 'id')
 */
const isOwner = (fieldName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    // Admin ve todo
    if (req.user.rol === 'admin') {
      return next();
    }

    // Oficial solo ve sus propios registros
    if (req.user.rol === 'oficial_credito') {
      // Verificar que el recurso le pertenece
      // Se usa en rutas tipo GET /api/creditos/:id
      // El controller debe verificar ownership después de cargar el recurso
      req.checkOwnership = true;
    }

    next();
  };
};

/**
 * Middleware combinado: auth + rol
 * Uso: protectedRoute(['admin', 'gerente'])
 */
const protectedRoute = (roles = []) => {
  return [
    require('./auth').authMiddleware,
    authorize(roles)
  ];
};

module.exports = {
  authorize,
  authorizeAction,
  isOwner,
  protectedRoute
};
