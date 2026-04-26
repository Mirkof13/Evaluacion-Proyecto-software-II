/**
 * BANCOSOL - Response Helper
 * Respuestas JSON estandarizadas para todos los controllers
 * Cumple principio Liskov: misma interfaz { success, data, message }
 */

const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501
};

/**
 * Respuesta exitosa estándar
 */
const success = (res, data, message = 'Operación exitosa', code = STATUS_CODES.SUCCESS) => {
  return res.status(code).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Respuesta de error estándar
 */
const error = (res, message, code = STATUS_CODES.SERVER_ERROR, details = null) => {
  const response = {
    success: false,
    message,
    error: {
      code,
      message,
      timestamp: new Date().toISOString()
    }
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.error.details = details;
  }

  return res.status(code).json(response);
};

/**
 * Respuesta para validación de datos (express-validator)
 */
const validationError = (res, errors) => {
  return res.status(STATUS_CODES.VALIDATION_ERROR).json({
    success: false,
    message: 'Error de validación de datos',
    errors: errors.map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    })),
    timestamp: new Date().toISOString()
  });
};

/**
 * Respuesta para recurso no encontrado
 */
const notFound = (res, resource = 'Recurso') => {
  return error(res, `${resource} no encontrado`, STATUS_CODES.NOT_FOUND);
};

/**
 * Respuesta para acceso no autorizado
 */
const unauthorized = (res, message = 'Acceso no autorizado') => {
  return error(res, message, STATUS_CODES.UNAUTHORIZED);
};

/**
 * Respuesta para acceso prohibido (rol insuficiente)
 */
const forbidden = (res, message = 'Acceso prohibido') => {
  return error(res, message, STATUS_CODES.FORBIDDEN);
};

/**
 * Respuesta para conflicto (ej: CI duplicado)
 */
const conflict = (res, message = 'Conflicto de datos') => {
  return error(res, message, STATUS_CODES.CONFLICT);
};

/**
 * Respuesta con paginación
 */
const paginated = (res, items, page, limit, total, message = 'Lista obtenida exitosamente') => {
  return success(res, {
    items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  }, message);
};

/**
 * Respuesta para creación exitosa
 */
const created = (res, data, message = 'Recurso creado exitosamente') => {
  return success(res, data, message, STATUS_CODES.CREATED);
};

/**
 * Respuesta para actualización exitosa
 */
const updated = (res, data, message = 'Recurso actualizado exitosamente') => {
  return success(res, data, message, STATUS_CODES.SUCCESS);
};

/**
 * Respuesta para eliminación exitosa
 */
const removed = (res, message = 'Recurso eliminado exitosamente') => {
  return success(res, null, message, STATUS_CODES.NO_CONTENT);
};

/**
 * Respuesta para error devalidación de negocio (ej: saldo insuficiente)
 */
const businessError = (res, message, details = null) => {
  return error(res, message, STATUS_CODES.BAD_REQUEST, details);
};

module.exports = {
  success,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  paginated,
  created,
  updated,
  removed,
  businessError,
  STATUS_CODES
};
