/**
 * BANCOSOL - Middleware de Auditoría Forense
 * CORAZÓN DEL SISTEMA DE CIBERSEGURIDAD
 *
 * Cumple: ISO 27001 - Principio de No Repudio
 * Registra: quién, cuándo, qué, cómo, desde dónde
 *
 * Implementación:
 * - Intercepta POST, PUT, DELETE
 * - Captura datos_antes (GET antes de modificar)
 * - Captura datos_despues (GET después)
 * - Registro asincrónico (no bloquea respuesta)
 * - Almacena diff en JSONB para consultas forenses
 */

const { AuditoriaLog } = require('../models');
const { Op } = require('sequelize');

/**
 * Factory: middleware de auditoría configurable
 * @param {string} tabla - Tabla afectada
 * @param {string} accionBase - Base de la acción (ej: 'CREDITO_ESTADO')
 * @returns {function} Express middleware
 *
 * USO:
 * router.post('/', auditoria('creditos', 'CREAR'), controller.crear);
 * router.put('/:id/estado', auditoria('creditos', 'ESTADO'), controller.cambiarEstado);
 */
const auditoria = (tabla, accionBase) => {
  return async (req, res, next) => {
    // Capturar datos básicos del request
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const endpoint = req.originalUrl;
    const metodo = req.method;
    const usuarioId = req.user?.id || null;
    const usuarioEmail = req.user?.email || 'sistema';

    // 1. Para PUT: capturar datos_antes (antes de modificar)
    let datosAntes = null;

    if (metodo === 'PUT' || metodo === 'PATCH' || metodo === 'DELETE') {
      if (req.params.id && tabla) {
        try {
          // Obtener registro ANTES de la modificación
          const Modelo = require('../models')[capitalizarTabla(tabla)];
          if (Modelo) {
            const registro = await Modelo.findByPk(req.params.id);
            if (registro) {
              datosAntes = registro.get({ plain: true });
              // Eliminar campos auditados automáticamente
              delete datosAntes.created_at;
              delete datosAntes.updated_at;
              delete datosAntes.deleted_at;
            }
          }
        } catch (error) {
          console.error(`[Auditoría] Error obteniendo datos_antes para ${tabla}:${req.params.id}`, error.message);
          // No fallar la petición si hay error en auditoría
        }
      }
    }

    // 2. Capturar datos_despues (request body para POST/PUT)
    let datosDespues = null;
    if (['POST', 'PUT', 'PATCH'].includes(metodo) && req.body) {
      // Clonar y limpiar datos sensibles
      datosDespues = JSON.parse(JSON.stringify(req.body));

      // No auditar passwords
      if (datosDespues.password) {
        datosDespues.password = '[HASHED]';
      }
      if (datosDespues.password_hash) {
        datosDespues.password_hash = '[HASHED]';
      }
      if (datosDespues.token) {
        datosDespues.token = '[TOKEN]';
      }
    }

    // 3. Determinar tipo de acción específica
    let accion = accionBase;
    if (metodo === 'POST') accion = `${accionBase}_CREAR`;
    if (metodo === 'PUT' || metodo === 'PATCH') accion = `${accionBase}_ACTUALIZAR`;
    if (metodo === 'DELETE') accion = `${accionBase}_ELIMINAR`;

    // 4. Registrar en BD de forma ASÍNCRONA (no bloquea respuesta)
    const registrarAuditoria = async () => {
      try {
        await AuditoriaLog.create({
          usuario_id: usuarioId,
          usuario_email: usuarioEmail,
          accion: accion,
          tabla_afectada: tabla,
          registro_id: req.params.id ? parseInt(req.params.id) : null,
          datos_antes: datosAntes,
          datos_despues: datosDespues,
          ip_origen: ip,
          user_agent: userAgent,
          endpoint: endpoint,
          metodo_http: metodo,
          resultado: 'exitoso',
          codigo_respuesta: res.statusCode || 200
        });
      } catch (error) {
        console.error('[Auditoría] Error guardando log:', error.message);
        // No propagar error - la auditoría no debe fallar la operación
      }
    };

    // 5. Interceptar respuesta para loggear resultado final
    const oldStatus = res.status;
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };

    const oldJson = res.json;
    res.json = function(body) {
      // Determinar resultado basado en código HTTP
      const codigo = this.statusCode;
      const resultado = codigo >= 200 && codigo < 300 ? 'exitoso' : 'fallido';

      // Intentar extraer el ID del registro si no estaba en params (para CREAR/POST)
      let idFinal = req.params.id ? parseInt(req.params.id) : null;
      if (!idFinal && body && resultado === 'exitoso') {
        // Buscar ID en el cuerpo de respuesta (ej: res.data.id o res.id)
        idFinal = body.id || (body.data && body.data.id) || (body.usuario && body.usuario.id) || (body.credito && body.credito.id);
      }

      // Actualizar registro de auditoría con resultado final y el ID capturado
      if (process.env.AUDIT_LOG_ENABLED === 'true') {
        AuditoriaLog.update(
          {
            resultado: resultado,
            codigo_respuesta: codigo,
            registro_id: idFinal // Actualizar con el ID real descubierto
          },
          {
            where: {
              usuario_id: usuarioId,
              endpoint: endpoint,
              resultado: 'exitoso'  // placeholder original
            },
            order: [['created_at', 'DESC']], // El más reciente
            limit: 1,
            silent: true
          }
        ).catch(() => {});
      }

      return oldJson.call(this, body);
    };

    // Ejecutar auditoría en background
    if (process.env.AUDIT_LOG_ASYNC !== 'false') {
      registrarAuditoria();
    } else {
      // Síncrono (solo desarrollo/depuración)
      await registrarAuditoria();
    }

    next();
  };
};

/**
 * Middleware para LOG (no modifica datos)
 * Para rutas GET que también queremos auditar
 */
const auditoriaLectura = (tabla, accion = 'CONSULTA') => {
  return async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const usuarioId = req.user?.id || null;
    const usuarioEmail = req.user?.email || 'sistema';

    // Registrar consulta (solo metadata, no datos)
    try {
      await AuditoriaLog.create({
        usuario_id: usuarioId,
        usuario_email: usuarioEmail,
        accion: accion,
        tabla_afectada: tabla,
        ip_origen: ip,
        user_agent: req.headers['user-agent'] || 'unknown',
        endpoint: req.originalUrl,
        metodo_http: req.method,
        resultado: 'exitoso',
        codigo_respuesta: 200
      });
    } catch (error) {
      console.error('[Auditoría Lectura] Error:', error.message);
    }

    next();
  };
};

/**
 * Helper: resolver nombre de modelo desde nombre de tabla
 */
function capitalizarTabla(tabla) {
  if (!tabla) return null;
  
  // Mapa de excepciones (Plural -> Singular)
  const mapa = {
    'creditos': 'Credito',
    'usuarios': 'Usuario',
    'clientes': 'Cliente',
    'pagos': 'Pago',
    'amortizaciones': 'Amortizacion',
    'roles': 'Rol',
    'estados_credito': 'EstadoCredito'
  };

  if (mapa[tabla]) return mapa[tabla];

  // Fallback: Capitalizar y quitar 's' final si existe
  let modelo = tabla.charAt(0).toUpperCase() + tabla.slice(1);
  if (modelo.endsWith('s')) modelo = modelo.slice(0, -1);
  
  return modelo;
}

/**
 * Middleware especial: capturar excepciones no manejadas
 * y registrarlas en auditoría
 */
const errorAuditor = (err, req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const usuarioId = req.user?.id || null;
  const usuarioEmail = req.user?.email || 'sistema';

  AuditoriaLog.create({
    usuario_id: usuarioId,
    usuario_email: usuarioEmail,
    accion: 'ERROR',
    tabla_afectada: req.method === 'GET' ? 'lecturas' : req.path.split('/')[2] || 'unknown',
    ip_origen: ip,
    user_agent: req.headers['user-agent'] || 'unknown',
    endpoint: req.originalUrl,
    metodo_http: req.method,
    resultado: 'fallido',
    codigo_respuesta: res.statusCode || 500,
    datos_adicionales: {
      mensaje_error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  }).catch(() => {});

  next(err);
};

module.exports = {
  auditoria,
  auditoriaLectura,
  errorAuditor
};
