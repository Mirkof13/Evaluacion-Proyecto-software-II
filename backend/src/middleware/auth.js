/**
 * BANCOSOL - Middleware de Autenticación JWT
 * Verifica token JWT en cabecera Authorization
 * Patrón: Middleware Pipeline (Express)
 */

const jwt = require('jsonwebtoken');
const { verifyToken } = require('../config/jwt');
const { Usuario, Rol } = require('../models');

/**
 * Middleware: verificar JWT y cargar usuario en req.user
 * Uso: app.use('/api/protegido', authMiddleware, ruta)
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Extraer token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar y decodificar token
    const decoded = verifyToken(token);

    // 3. Buscar usuario en BD (validar que existe y está activo)
    const usuario = await Usuario.findByPk(decoded.id, {
      include: [{
        model: Rol,
        as: 'rol',
        attributes: ['id', 'nombre', 'permisos']
      }],
      attributes: { exclude: ['password_hash'] }
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado',
        code: 'USER_INACTIVE'
      });
    }

    // 4. Verificar si está bloqueado
    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta temporalmente bloqueada',
        code: 'USER_LOCKED'
      });
    }

    // 5. Actualizar último login (async, no bloquear)
    await Usuario.update(
      { ultimo_login: new Date(), intentos_fallidos: 0 },
      { where: { id: usuario.id } }
    ).catch(() => {});  // Ignorar error en update

    // 6. Adjuntar usuario a request
    req.user = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol.nombre,
      rolId: usuario.rol_id,
      permisos: usuario.rol.permisos || {}
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Error en authMiddleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware: opcional (no bloquea si no hay token)
 * Para rutas que pueden funcionar con o sin autenticación
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);

      const usuario = await Usuario.findByPk(decoded.id, {
        include: [{ model: Rol, as: 'rol', attributes: ['nombre'] }],
        attributes: ['id', 'email', 'nombre', 'activo']
      });

      if (usuario && usuario.activo) {
        req.user = {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol.nombre,
          rolId: usuario.rol_id
        };
      }
    }

    next();
  } catch (error) {
    // Si hay token pero es inválido, continuar sin usuario
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuth
};
