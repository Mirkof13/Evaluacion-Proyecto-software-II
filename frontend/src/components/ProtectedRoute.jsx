/**
 * BANCOSOL - ProtectedRoute Component
 * Restringe acceso basado en autenticación y roles
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { usuario, token, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  // Si no hay token, redirigir a login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay roles especificados, verificar
  if (roles.length > 0) {
    const tienePermiso = roles.includes(usuario?.rol);
    if (!tienePermiso) {
      return (
        <Container className="text-center py-5">
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta página.</p>
          <p>Role requerido: {roles.join(', ')}</p>
        </Container>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
