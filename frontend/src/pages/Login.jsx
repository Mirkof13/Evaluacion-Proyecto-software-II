/**
 * BANCOSOL - Login Page
 * Autenticación con validación frontend
 */

import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { BiBuilding, BiLock, BiEnvelope } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Acceso denegado. Verifique sus credenciales.');
    }

    setCargando(false);
  };

  return (
    <div className="login-wrapper d-flex align-items-center justify-content-center vh-100" style={{ 
      backgroundImage: 'url(/bancosol_login_bg_1777186709144.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div className="login-overlay position-absolute w-100 h-100" style={{ background: 'rgba(0, 43, 91, 0.4)', backdropFilter: 'blur(3px)' }}></div>
      <Container className="w-100 position-relative" style={{ maxWidth: '420px', zIndex: 1 }}>
        <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="bg-primary p-2"></div>
          <Card.Body className="p-5 bg-white">
            {/* Logo */}
            <div className="text-center mb-4">
              <div className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 mb-3">
                <BiBuilding size={40} className="text-primary" />
              </div>
              <h2 className="fw-bold text-dark mb-0">BancoSol</h2>
              <p className="text-muted small">Plataforma de Cartera Profesional</p>
            </div>

            {/* Mensaje de error */}
            {error && (
              <Alert variant="danger" className="py-2 small border-0 shadow-sm" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Formulario */}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">ID de Usuario</Form.Label>
                <div className="input-group border rounded-3 bg-light">
                  <span className="input-group-text bg-transparent border-0 text-muted">
                    <BiEnvelope />
                  </span>
                  <Form.Control
                    type="email"
                    name="email"
                    className="bg-transparent border-0 py-2"
                    placeholder="usuario@bancosol.com.bo"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={cargando}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted">Contraseña</Form.Label>
                <div className="input-group border rounded-3 bg-light">
                  <span className="input-group-text bg-transparent border-0 text-muted">
                    <BiLock />
                  </span>
                  <Form.Control
                    type="password"
                    name="password"
                    className="bg-transparent border-0 py-2"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={cargando}
                  />
                </div>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 py-3 rounded-3 fw-bold shadow-sm"
                disabled={cargando}
              >
                {cargando ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Validando...</>
                ) : (
                  'Iniciar Sesión Segura'
                )}
              </Button>
            </Form>

            {/* Usuarios de prueba */}
            <div className="mt-4 pt-3 border-top">
              <p className="text-center small text-muted mb-2">Acceso de Demostración:</p>
              <div className="bg-light p-2 rounded-3 small">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Admin:</span>
                  <code className="text-primary">admin@bancosol.com.bo</code>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Pass:</span>
                  <code className="text-dark">Admin123*</code>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Login;
