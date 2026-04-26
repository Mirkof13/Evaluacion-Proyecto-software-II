/**
 * BANCOSOL - Configuración JWT
 * Autenticación sin estado (stateless) con firma HMAC-SHA256
 * Cumplimiento: No Repudio + Confidencialidad (ISO 27001)
 */

const jwt = require('jsonwebtoken');

/**
 * Generar token JWT de acceso
 * @param {Object} payload - Datos del usuario (id, email, rol)
 * @param {string} rol - Rol del usuario (para incluir en token)
 * @returns {string} Token JWT firmado
 */
const generateToken = (payload, rol) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET no está configurado en .env');
  }

  // Validar longitud mínima del secreto (256 bits = 32 chars)
  if (secret.length < 32) {
    console.warn('⚠️  JWT_SECRET es muy corto (mínimo 32 caracteres para 256 bits)');
  }

  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      rol: rol,
      iat: Math.floor(Date.now() / 1000)  // Issued At
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      issuer: 'bancosol-api',
      audience: 'bancosol-frontend'
    }
  );
};

/**
 * Generar token de refresh (largo plazo)
 * @param {Object} payload - Datos del usuario
 * @returns {string} Refresh token
 */
const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET no está configurado');
  }

  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      type: 'refresh'
    },
    secret,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'bancosol-api'
    }
  );
};

/**
 * Verificar y decodificar token JWT
 * @param {string} token - Token JWT
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET no está configurado');
  }

  return jwt.verify(token, secret, {
    issuer: 'bancosol-api',
    audience: 'bancosol-frontend'
  });
};

/**
 * Decodificar token sin verificar (para extraer datos rápidos)
 * No usar para autenticación, solo para extracción de info
 */
const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken
};
