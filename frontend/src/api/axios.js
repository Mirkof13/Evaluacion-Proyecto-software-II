/**
 * BANCOSOL - Cliente HTTP (Axios)
 * Configuración centralizada de Axios con interceptores JWT
 */

import axios from 'axios';

// Base URL del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Crear instancia
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Interceptor: Agregar token JWT a cada request
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bancosol_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log en desarrollo
    // Log desactivado para limpiar consola del usuario
    /* if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    } */

    return config;
  },
  (error) => {
    console.error('[Axios Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor: Manejar respuestas globales
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response, message } = error;

    if (import.meta.env.DEV) {
      console.error('[Axios Response Error]', response?.status, message);
    }

    // Manejo específico de errores HTTP
    if (response) {
      const { status, data } = response;

      // 401: No autorizado - Redirect to login
      if (status === 401) {
        localStorage.removeItem('bancosol_token');
        localStorage.removeItem('bancosol_user');
        window.location.href = '/login';
        return Promise.reject(new Error('Sesión expirada'));
      }

      // 403: Forbidden
      if (status === 403) {
        return Promise.reject(new Error(data?.message || 'Acceso denegado'));
      }

      // 404: Not found
      if (status === 404) {
        return Promise.reject(new Error('Recurso no encontrado'));
      }

      // 422: Validación
      if (status === 422) {
        const mensajes = data?.errors?.map(e => e.message).join(', ') || 'Datos inválidos';
        return Promise.reject(new Error(mensajes));
      }

      // 500+: Error del servidor
      if (status >= 500) {
        return Promise.reject(new Error('Error interno del servidor'));
      }

      // Otros errores
      return Promise.reject(new Error(data?.message || message || 'Error desconocido'));
    }

    // Error de red/timeout
    return Promise.reject(new Error('Error de conexión al servidor'));
  }
);

export default axiosInstance;
