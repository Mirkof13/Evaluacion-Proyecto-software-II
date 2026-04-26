/**
 * BANCOSOL - App Component
 * Configuración principal de React Router y Layout
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Container } from 'react-bootstrap';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import CrearCredito from './pages/CrearCredito';
import ListaCreditos from './pages/ListaCreditos';
import DetalleCredito from './pages/DetalleCredito';
import RegistrarPago from './pages/RegistrarPago';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Auditoria from './pages/Auditoria';
import CierreCaja from './pages/CierreCaja';
import Notificaciones from './pages/Notificaciones';

// Estilos
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// QueryClient para React Query (caché de datos)
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="app">
            <Routes>
              {/* Ruta pública: Login */}
              <Route path="/login" element={<Login />} />

              {/* Rutas protegidas */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/clientes"
                element={
                  <ProtectedRoute roles={['oficial_credito', 'analista', 'gerente', 'admin']}>
                    <MainLayout>
                      <Clientes />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/creditos/crear"
                element={
                  <ProtectedRoute roles={['oficial_credito', 'admin']}>
                    <MainLayout>
                      <CrearCredito />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/creditos"
                element={
                  <ProtectedRoute roles={['oficial_credito', 'analista', 'gerente', 'admin']}>
                    <MainLayout>
                      <ListaCreditos />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/creditos/:id"
                element={
                  <ProtectedRoute roles={['oficial_credito', 'analista', 'gerente', 'admin']}>
                    <MainLayout>
                      <DetalleCredito />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/creditos/:id/pagos/registrar"
                element={
                  <ProtectedRoute roles={['oficial_credito', 'admin']}>
                    <MainLayout>
                      <RegistrarPago />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reportes"
                element={
                  <ProtectedRoute roles={['gerente', 'admin']}>
                    <MainLayout>
                      <Reportes />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <MainLayout>
                      <Usuarios />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/auditoria"
                element={
                  <ProtectedRoute roles={['gerente', 'admin']}>
                    <MainLayout>
                      <Auditoria />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/caja/cierre"
                element={
                  <ProtectedRoute roles={['gerente', 'admin']}>
                    <MainLayout>
                      <CierreCaja />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/notificaciones"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Notificaciones />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Ruta por defecto: redirect a dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Layout principal con navbar y sidebar
const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      {/* Sidebar (fijo en desktop) */}
      <div className="d-none d-md-block sidebar shadow-sm">
        <div className="sidebar-header d-flex align-items-center">
          <div className="bg-primary p-2 rounded-3 me-2 text-white d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
            <span className="fw-bold">B</span>
          </div>
          <div>
            <h5 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.5px' }}>BancoSol</h5>
            <div className="badge bg-light text-primary fw-normal" style={{ fontSize: '0.65rem' }}>Gestión de Cartera</div>
          </div>
        </div>
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <div className="main-content">
        <Navbar />
        <div className="p-2 p-md-4 fade-in">
          {children}
        </div>
      </div>
    </div>
  );
};

export default App;
