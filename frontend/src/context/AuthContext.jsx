/**
 * BANCOSOL - Auth Context
 * Context API para gestión global de autenticación
 * Proporciona: usuario, token, login, logout, roles
 */

import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from '../api/axios';

// Estado inicial
const initialState = {
  usuario: null,
  token: localStorage.getItem('bancosol_token') || null,
  cargando: true,
  error: null
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, cargando: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        cargando: false,
        usuario: action.payload.usuario,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        cargando: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...initialState,
        cargando: false
      };
    case 'SET_USUARIO':
      return {
        ...state,
        usuario: action.payload,
        cargando: false
      };
    default:
      return state;
  }
};

// Crear contexto
const AuthContext = createContext();

/**
 * Hook personalizado para usar auth
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

/**
 * Provider component
 */
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Al montar, validar token y obtener perfil
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('bancosol_token');

      if (!token) {
        dispatch({ type: 'SET_USUARIO', payload: null });
        return;
      }

      try {
        const response = await axios.get('/auth/me');
        // El backend devuelve { success: true, data: { ... } }
        const usuario = response.data.data;
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            usuario,
            token
          }
        });
      } catch (error) {
        localStorage.removeItem('bancosol_token');
        localStorage.removeItem('bancosol_user');
        dispatch({ type: 'LOGIN_ERROR', payload: 'Sesión inválida' });
      }
    };

    initAuth();
  }, []);

  // Login
  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await axios.post('/auth/login', { email, password });
      // El backend devuelve { success: true, data: { token, usuario } }
      const { token, usuario } = response.data.data;

      localStorage.setItem('bancosol_token', token);
      localStorage.setItem('bancosol_user', JSON.stringify(usuario));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, usuario }
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('bancosol_token');
      localStorage.removeItem('bancosol_user');
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Verificar si tiene rol
  const tieneRol = (rol) => {
    if (!state.usuario) return false;
    if (Array.isArray(rol)) {
      return rol.includes(state.usuario.rol);
    }
    return state.usuario.rol === rol;
  };

  // Verificar permiso específico
  const tienePermiso = (modulo, accion) => {
    if (!state.usuario) return false;
    const permisos = state.usuario.permisos || {};
    return permisos[modulo]?.[accion] || permisos.all || state.usuario.rol === 'admin';
  };

  const value = {
    ...state,
    login,
    logout,
    tieneRol,
    tienePermiso
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
