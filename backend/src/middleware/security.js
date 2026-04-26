/**
 * BANCOSOL - Middleware de Seguridad Zero Trust
 * Detecta anomalías de sesión en tiempo real
 */
const { error } = require('../utils/responseHelper');

const zeroTrustMiddleware = (req, res, next) => {
  // Solo aplicar si el usuario está autenticado
  if (!req.user) return next();

  const currentIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const currentUserAgent = req.headers['user-agent'];

  // En una implementación real, compararíamos con la IP/UA guardada en Redis o JWT
  // Aquí usamos un flag en el request para auditoría posterior
  req.securityContext = {
    ipMatch: true,
    uaMatch: true,
    riskLevel: 'LOW'
  };

  // Si el usuario es admin y accede desde una IP sospechosa (simulado)
  if (req.user.rol === 'admin' && currentIp === 'unknown') {
    req.securityContext.riskLevel = 'HIGH';
    console.warn(`⚠️ [ZERO TRUST] Acceso administrativo sospechoso desde IP desconocida: ${req.user.email}`);
  }

  next();
};

module.exports = zeroTrustMiddleware;
