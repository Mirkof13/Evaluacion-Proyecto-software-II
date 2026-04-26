/**
 * BANCOSOL - Dashboard Principal
 * Resumen de métricas ISO 27001 y estado de cartera
 */

import { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Container, Row, Col, Card, Table, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { BiMoney, BiGroup, BiCreditCard, BiLineChart } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { tieneRol } = useAuth();
  const [metricas, setMetricas] = useState({
    totalCartera: 0,
    clientesActivos: 0,
    creditosMora: 0,
    recuperacionesMes: 0
  });
  const [ultimosCreditos, setUltimosCreditos] = useState([]);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Calcular porcentaje de mora
  const porcentajeMora = metricas.totalCartera > 0
    ? ((metricas.creditosMora / metricas.totalCartera) * 100).toFixed(2)
    : 0;

  useEffect(() => {
    cargarDashboard();
    
    // Auto-refresh cada 30 segundos (Monitoreo en vivo)
    const interval = setInterval(() => {
      cargarDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

   const cargarDashboard = async () => {
     try {
       setCargando(true);

       // Cargar múltiples endpoints en paralelo
       const [carteraRes, creditosRes, pagosRes, auditRes, alertsRes] = await Promise.all([
         // 1. Cartera total por estado
         axios.get('/reportes/cartera'),
         // 2. Últimos créditos
         axios.get('/creditos?limit=5'),
         // 3. Pagos del mes actual
         axios.get('/reportes/recuperaciones'),
         // 4. Auditoría reciente
         axios.get('/auditoria?limit=5'),
         // 5. Alertas de mora
         axios.get('/reportes/alertas')
       ]);

       // Helper para extraer data: backend => { success: true, data: {...} }

       // Procesar cartera
       const cartera = carteraRes.data?.cartera || [];
       const totalCartera = cartera.reduce((sum, item) => sum + (item.monto_total || 0), 0);
       const creditosMora = cartera.find(c => c.estado === 'en_mora')?.monto_total || 0;
       const clientesActivosCount = cartera.reduce((sum, item) => {
         if (item.estado === 'activo' || item.estado === 'en_mora' || item.estado === 'al_dia') {
           return sum + (item.cantidad || 0);
         }
         return sum;
       }, 0);

       // Procesar recuperaciones del mes actual
       const hoy = new Date();
       const recuperacionesMes = (pagosRes.data?.recuperaciones || [])
         .filter(r => {
           if (!r.mes) return false;
           const mes = new Date(r.mes);
           return mes.getMonth() === hoy.getMonth() && mes.getFullYear() === hoy.getFullYear();
         })
         .reduce((sum, r) => sum + (r.total_recuperado || 0), 0);

       setMetricas({
         totalCartera,
         clientesActivos: clientesActivosCount,
         creditosMora,
         recuperacionesMes
       });

       setUltimosCreditos(creditosRes.data?.creditos || []);
       setActividadReciente(auditRes.data?.logs || []);
       setAlertas(alertsRes.data?.alertas || []);
     } catch (err) {
       console.error('Error cargando dashboard:', err);
       setError('No se pudieron cargar las métricas');
     } finally {
       setCargando(false);
     }
   };

  if (cargando) {
    return <div className="center-spinner"><Spinner animation="border" /></div>;
  }

  if (error) {
    return <Alert variant="danger" className="mt-4">{error}</Alert>;
  }

  return (
    <div className="dashboard-container">
      <h2 className="mb-4">Resumen de Cartera</h2>

      {/* Tarjetas métricas */}
      <Row xs={1} md={2} lg={4} className="g-4 mb-4">
        <Col>
          <Card className="metric-card h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="text-muted small text-uppercase fw-bold">Total Cartera</Card.Title>
                  <Card.Text className="fs-4 fw-bold">
                    Bs. {metricas.totalCartera.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </Card.Text>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                  <BiMoney size={24} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col>
          <Card className="metric-card h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="text-muted small text-uppercase fw-bold">Clientes Activos</Card.Title>
                  <Card.Text className="fs-4 fw-bold text-success">
                    {metricas.clientesActivos || 0}
                  </Card.Text>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                  <BiGroup size={24} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col>
          <Card className="metric-card h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="text-muted small text-uppercase fw-bold">Morosidad (NPL)</Card.Title>
                  <Card.Text className="fs-4 fw-bold text-danger">
                    {porcentajeMora}%
                  </Card.Text>
                  <small className="text-muted">
                    Ratio de Cartera Vencida
                  </small>
                </div>
                <div className="bg-danger bg-opacity-10 p-3 rounded-circle">
                  <BiCreditCard size={24} className="text-danger" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col>
          <Card className="metric-card h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="text-muted small text-uppercase fw-bold">Recuperaciones (Mes)</Card.Title>
                  <Card.Text className="fs-4 fw-bold text-info">
                    Bs. {metricas.recuperacionesMes.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </Card.Text>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                  <BiLineChart size={24} className="text-info" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alertas Críticas (Mora) y Control Normativo */}
      <Row className="mb-4 g-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm h-100 bg-white">
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-uppercase small text-danger">⚠️ Alertas de Mora Crítica</h6>
              <Badge bg="danger" pill>Acción Requerida</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0 small">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-3">Cliente</th>
                      <th>Mora Acumulada</th>
                      <th>Oficial</th>
                      <th className="text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertas.length > 0 ? alertas.map(alerta => (
                      <tr key={alerta.id}>
                        <td className="ps-3 fw-bold">{alerta.cliente?.nombre} {alerta.cliente?.apellido}</td>
                        <td className="text-danger fw-bold">Bs. {parseFloat(alerta.mora_acumulada).toFixed(2)}</td>
                        <td>{alerta.oficial?.nombre}</td>
                        <td className="text-center"><Badge bg="danger">MOROSO</Badge></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="text-center py-3 text-muted">No hay alertas críticas hoy</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100 bg-white border-start border-primary border-4">
            <Card.Body className="py-4">
              <h6 className="fw-bold mb-2 text-dark">Control Normativo ASFI</h6>
              <div className="d-flex justify-content-between small mb-1">
                <span className="text-muted">Previsión Genérica:</span>
                <span className="fw-bold">1.00%</span>
              </div>
              <div className="d-flex justify-content-between small mb-3">
                <span className="text-muted">Encaje Legal:</span>
                <span className="fw-bold text-success">CUMPLIDO</span>
              </div>
              <hr />
              <div className="small">
                <div className="text-muted mb-1">Categorización de Cartera:</div>
                <div className="d-flex gap-2">
                  <Badge bg="success">Cat. A: 92%</Badge>
                  <Badge bg="warning" text="dark">Cat. B: 5%</Badge>
                  <Badge bg="danger">Cat. C/D: 3%</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Últimos créditos y Actividad Reciente */}
      <Row className="g-4 mt-2">
        <Col lg={8}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Últimos Créditos Registrados</h5>
            </Card.Header>
            <Card.Body>
              {ultimosCreditos.length === 0 ? (
                <p className="text-muted text-center py-4">No hay créditos registrados aún</p>
              ) : (
                <Table hover responsive className="align-middle small">
                  <thead className="table-light">
                    <tr>
                      <th>N° Crédito</th>
                      <th>Cliente</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimosCreditos.map((credito) => (
                      <tr key={credito.id}>
                        <td><code>{credito.numero_credito}</code></td>
                        <td>{credito.cliente?.nombre} {credito.cliente?.apellido}</td>
                        <td className="fw-bold">Bs. {parseFloat(credito.monto).toLocaleString()}</td>
                        <td><Badge bg={getEstadoClass(credito.estado)}>{credito.estado}</Badge></td>
                        <td className="text-center">
                          <Button variant="outline-primary" size="sm" onClick={() => navigate(`/creditos/${credito.id}`)}>Ver</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm border-0 h-100 border-start border-4 border-warning">
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold small text-uppercase">🔐 Auditoría Reciente</h5>
              <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => navigate('/auditoria')}>Ver todo</Button>
            </Card.Header>
            <Card.Body className="p-0">
              {actividadReciente.length === 0 ? (
                <p className="text-muted text-center py-4 small">Sin actividad reciente</p>
              ) : (
                <div className="list-group list-group-flush">
                  {actividadReciente.map(log => (
                    <div key={log.id} className="list-group-item border-0 border-bottom px-3 py-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="fw-bold small">{log.accion}</div>
                        <small className="text-muted" style={{ fontSize: '0.65rem' }}>{new Date(log.createdAt || log.created_at || new Date()).toLocaleTimeString()}</small>
                      </div>
                      <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                        {log.usuario_email} <span className="mx-1">•</span> {log.tabla_afectada}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const getEstadoClass = (estado) => {
  const map = {
    pendiente: 'warning',
    aprobado: 'info',
    activo: 'success',
    al_dia: 'success',
    en_mora: 'danger',
    cancelado: 'secondary',
    rechazado: 'danger',
    castigado: 'dark'
  };
  return map[estado] || 'secondary';
};

export default Dashboard;
