/**
 * BANCOSOL - Análisis Financiero y Estadístico
 * Gráficos con Chart.js + Analítica de Riesgo Real
 */

import { useEffect, useState, useRef } from 'react';
import axios from '../api/axios';
import { 
  Container, Row, Col, Card, Form, Button, Spinner, Badge, Alert, Tabs, Tab, Table 
} from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { BiDownload, BiBarChartAlt2, BiStats } from 'react-icons/bi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Reportes = () => {
  const [periodo, setPeriodo] = useState('2024');
  const [carteraData, setCarteraData] = useState([]);
  const [morosidadData, setMorosidadData] = useState([]);
  const [recuperacionesData, setRecuperacionesData] = useState([]);
  const [creditosData, setCreditosData] = useState([]);
  const [mineriaData, setMineriaData] = useState(null);
  const [seguridadData, setSeguridadData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [tabActiva, setTabActiva] = useState('cartera');

  const chartRefs = {
    cartera: useRef(null),
    morosidad: useRef(null),
    oficiales: useRef(null),
    riesgoIA: useRef(null)
  };

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

   const cargarDatos = async () => {
     setCargando(true);
     try {
       // Uso de Promise.allSettled para robustez: Si un endpoint falla, no rompe todo el dashboard
       const resultados = await Promise.allSettled([
         axios.get('/reportes/cartera'),
         axios.get('/reportes/morosidad'),
         axios.get('/reportes/recuperaciones'),
         axios.get('/creditos?limit=100'),
         axios.get('/reportes/mineria'),
         axios.get('/reportes/seguridad')
       ]);
       
       const obtenerData = (index, prop) => {
         const result = resultados[index];
         if (result.status !== 'fulfilled') return null;
         // El interceptor de Axios devuelve response.data (el body)
         // Body = { success: true, data: {...}, message: '...' }
         // result.value ya es ese body directamente
         const payload = result.value?.data || result.value;
         return prop ? (payload?.[prop] ?? null) : payload;
       };

       setCarteraData(obtenerData(0, 'cartera') || []);
       setMorosidadData(obtenerData(1, 'morosidad') || []);
       setRecuperacionesData(obtenerData(2, 'recuperaciones') || []);
       setCreditosData(obtenerData(3, 'creditos') || []);
       setMineriaData(obtenerData(4));
       setSeguridadData(obtenerData(5));
     } catch (err) {
       console.error('Error cargando reportes:', err);
     } finally {
       setCargando(false);
     }
   };

  const descargarGrafico = (ref, nombre) => {
    if (ref.current) {
      const link = document.createElement('a');
      link.download = `${nombre}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = ref.current.toBase64Image();
      link.click();
    }
  };

  // Colores Minimalistas
  const colors = {
    primary: '#1a1a1a',
    secondary: '#4a4a4a',
    accent: '#0056b3',
    success: '#2d5a27',
    danger: '#8b0000',
    warning: '#b8860b',
    info: '#4682b4',
    bg: '#f8f9fa'
  };

  const carteraChartData = {
    labels: carteraData.map(c => c.estado.toUpperCase()),
    datasets: [{
      label: 'Monto total (Bs.)',
      data: carteraData.map(c => parseFloat(c.monto_total)),
      backgroundColor: [colors.success, colors.danger, colors.secondary, colors.warning, colors.accent],
      borderWidth: 0,
      borderRadius: 4
    }]
  };

  const morosidadChartData = {
    labels: morosidadData.map(m => new Date(m.mes).toLocaleDateString('es-BO', { month: 'short' })),
    datasets: [{
      label: '% Morosidad Actual',
      data: morosidadData.map(m => parseFloat(m.porcentaje_mora)),
      borderColor: colors.danger,
      backgroundColor: 'rgba(139, 0, 0, 0.05)',
      tension: 0.2,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: colors.danger
    }]
  };

  const distribucionOficial = (() => {
    const map = {};
    creditosData?.forEach(c => {
      const nombre = c.oficial?.nombre || 'Sin oficial';
      map[nombre] = (map[nombre] || 0) + parseFloat(c.monto);
    });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  })();

  const distribucionChartData = {
    labels: distribucionOficial.map(d => d.label),
    datasets: [{
      data: distribucionOficial.map(d => d.value),
      backgroundColor: [colors.primary, colors.secondary, colors.accent, colors.info, colors.warning],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  return (
    <div className="fade-in px-3">
      <div className="d-flex justify-content-between align-items-center mb-5 mt-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Análisis de Cartera Real</h2>
          <p className="text-muted small">Estado financiero consolidado - Gestión {periodo}</p>
        </div>
        <div className="d-flex gap-3">
          <Button variant="success" className="shadow-sm px-4 d-flex align-items-center" onClick={async () => {
            const res = await axios.get('/reportes/exportar/cartera', { responseType: 'blob' });
            // res ya es el blob por el interceptor
            const url = window.URL.createObjectURL(new Blob([res]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Cartera_BancoSol.xlsx');
            document.body.appendChild(link);
            link.click();
          }}>
            <BiDownload className="me-2" /> Exportar Excel
          </Button>
          <Form.Select style={{ width: '160px' }} className="border-0 shadow-sm" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="2024">Gestión 2024</option>
            <option value="2025">Gestión 2025</option>
          </Form.Select>
        </div>
      </div>

      {cargando ? (
        <div className="center-spinner"><Spinner animation="border" variant="dark" /></div>
      ) : (
        <>
          <Tabs activeKey={tabActiva} onSelect={(k) => setTabActiva(k)} className="mb-4 custom-tabs">
            <Tab eventKey="cartera" title="Cartera y Morosidad">
              <Row className="mb-5 mt-4">
                <Col lg={4}>
                  <Card className="shadow-sm border-0 mb-4 h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3 border-0">
                      <h6 className="mb-0 fw-bold small text-uppercase">Volumen por Estado</h6>
                      <Button variant="link" size="sm" className="text-dark p-0" onClick={() => descargarGrafico(chartRefs.cartera, 'cartera')}><BiDownload /></Button>
                    </Card.Header>
                    <Card.Body>
                      <div style={{ height: '250px' }}>
                        <Bar ref={chartRefs.cartera} data={carteraChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { display: false } }, x: { grid: { display: false } } } }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={4}>
                  <Card className="shadow-sm border-0 mb-4 h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3 border-0">
                      <h6 className="mb-0 fw-bold small text-uppercase">Curva de Morosidad Real</h6>
                      <Button variant="link" size="sm" className="text-dark p-0" onClick={() => descargarGrafico(chartRefs.morosidad, 'morosidad')}><BiDownload /></Button>
                    </Card.Header>
                    <Card.Body>
                      <div style={{ height: '250px' }}>
                        <Line ref={chartRefs.morosidad} data={morosidadChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { borderDash: [5, 5] } }, x: { grid: { display: false } } } }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={4}>
                  <Card className="shadow-sm border-0 mb-4 h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3 border-0">
                      <h6 className="mb-0 fw-bold small text-uppercase">Distribución de Cartera</h6>
                      <Button variant="link" size="sm" className="text-dark p-0" onClick={() => descargarGrafico(chartRefs.oficiales, 'oficiales')}><BiDownload /></Button>
                    </Card.Header>
                    <Card.Body>
                      <div style={{ height: '250px' }}>
                        <Doughnut ref={chartRefs.oficiales} data={distribucionChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15, font: { size: 10 } } } } }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h5 className="mb-4 d-flex align-items-center fw-bold text-dark mt-4">
                <BiBarChartAlt2 className="me-2 text-primary" /> Detalle de Cartera Vigente
              </h5>
              <Card className="shadow-sm border-0 mb-5">
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0 small">
                      <thead className="bg-light">
                        <tr>
                          <th className="px-4 py-3">Código</th>
                          <th className="py-3">Cliente</th>
                          <th className="py-3 text-end">Monto (Bs)</th>
                          <th className="py-3 text-center">Estado</th>
                          <th className="py-3 text-center">Categoría ASFI</th>
                          <th className="px-4 py-3 text-end">Mora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {creditosData?.slice(0, 10).map(c => (
                          <tr key={c.id}>
                            <td className="px-4 fw-bold">{c.numero_credito}</td>
                            <td>{c.cliente?.nombre} {c.cliente?.apellido}</td>
                            <td className="text-end fw-bold">{parseFloat(c.monto).toLocaleString()}</td>
                            <td className="text-center">
                              <Badge bg={c.estado === 'al_dia' ? 'success' : 'danger'}>{c.estado.toUpperCase()}</Badge>
                            </td>
                            <td className="text-center">
                              <Badge pill bg="dark" className="bg-opacity-75">{c.categoria_asfi}</Badge>
                            </td>
                            <td className="px-4 text-end text-danger">{parseFloat(c.mora_acumulada) > 0 ? `Bs. ${parseFloat(c.mora_acumulada).toFixed(2)}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>


              <h5 className="mb-4 d-flex align-items-center fw-bold text-dark">
                <BiStats className="me-2 text-primary" /> Analítica Predictiva de Riesgo
              </h5>
              <Row className="mb-5">
                <Col lg={8}>
                  <Card className="shadow-sm border-0 bg-white overflow-hidden border-start border-primary border-4">
                    <Card.Body className="p-4">
                      <Row className="align-items-center">
                        <Col md={6}>
                          <div style={{ height: '280px' }}>
                            <Doughnut 
                              ref={chartRefs.riesgoIA}
                              data={{
                                labels: ['Riesgo Bajo', 'Moderado', 'Medio', 'Riesgo Alto'],
                                datasets: [{
                                  data: mineriaData?.distribucionRiesgoIA ? [
                                    mineriaData.distribucionRiesgoIA['Bajo'],
                                    mineriaData.distribucionRiesgoIA['Moderado'],
                                    mineriaData.distribucionRiesgoIA['Medio'],
                                    mineriaData.distribucionRiesgoIA['Alto']
                                  ] : [0,0,0,0],
                                  backgroundColor: [colors.success, colors.info, colors.warning, colors.danger],
                                  borderWidth: 0
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'right', labels: { padding: 20, font: { size: 11 } } } },
                                cutout: '70%'
                              }}
                            />
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="ps-md-4">
                            <div className="mb-4">
                              <h6 className="fw-bold text-dark mb-1">Clasificación de Cartera</h6>
                              <p className="small text-muted mb-0">Análisis basado en {mineriaData?.totalAnalizado} créditos vigentes.</p>
                            </div>
                            
                            <div className="mb-3">
                              <div className="d-flex justify-content-between mb-1 small text-uppercase fw-bold">
                                <span>Calidad de Activos</span>
                                <span className={mineriaData?.metricas?.calidadPorcentaje > 90 ? 'text-success' : 'text-warning'}>
                                  {mineriaData?.metricas?.calidadPorcentaje || 0}%
                                </span>
                              </div>
                              <div className="progress" style={{ height: '6px', borderRadius: '10px' }}>
                                <div 
                                  className={`progress-bar ${mineriaData?.metricas?.calidadPorcentaje > 90 ? 'bg-success' : 'bg-warning'}`} 
                                  style={{ width: `${mineriaData?.metricas?.calidadPorcentaje || 0}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="d-flex justify-content-between mb-1 small text-uppercase fw-bold">
                                <span>Estado Normativo ASFI</span>
                                <span className="text-primary">{mineriaData?.asfiStatus}</span>
                              </div>
                              <div className="progress" style={{ height: '6px', borderRadius: '10px' }}>
                                <div className="progress-bar bg-primary" style={{ width: '100%' }}></div>
                              </div>
                            </div>

                            <Alert variant="light" className="border-0 bg-light small mt-4 p-3 text-dark">
                              <div className="d-flex justify-content-between align-items-center">
                                <span>
                                  <BiBarChartAlt2 className="me-2 text-primary" /> 
                                  IA Core: <span className="fw-bold">{mineriaData?.iaModel?.nombre || 'ScoringModel_v1'}</span>
                                </span>
                                <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25">
                                  Precisión: {((mineriaData?.iaModel?.precision || 0.98) * 100).toFixed(2)}%
                                </Badge>
                              </div>
                              <div className="mt-2 text-muted" style={{ fontSize: '0.7rem' }}>
                                Último entrenamiento: {mineriaData?.iaModel?.ultima_iteracion ? new Date(mineriaData.iaModel.ultima_iteracion).toLocaleString() : 'Reciente'}
                              </div>
                            </Alert>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header className="bg-white py-3 border-0 fw-bold small text-uppercase">
                       Métricas de Control
                    </Card.Header>
                    <Card.Body className="d-flex flex-column justify-content-between">
                      <div className="mb-4 text-center p-4 bg-light rounded-4">
                        <label className="text-muted small text-uppercase d-block mb-1">Ticket Promedio</label>
                        <h3 className="fw-bold mb-0 text-dark">
                          Bs. {mineriaData?.metricas?.promedioTicket?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h3>
                      </div>
                      
                      <div className="mb-4">
                        <label className="text-muted small text-uppercase d-block mb-1">Volatilidad de Cartera</label>
                        <h5 className="fw-bold text-dark mb-2">
                          Bs. {mineriaData?.metricas?.stdDev?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h5>
                        <div className="progress" style={{ height: '4px' }}>
                          <div className="progress-bar bg-secondary" style={{ width: '45%' }}></div>
                        </div>
                      </div>

                      <div>
                        <label className="text-muted small text-uppercase d-block mb-1">Coeficiente de Riesgo</label>
                        <h5 className="fw-bold text-warning">
                          {mineriaData?.metricas?.nplRatio}%
                        </h5>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>Exposición actual sobre la media poblacional.</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="seguridad" title="Traceabilidad y Ciberseguridad">
              <Row className="mt-4 g-4">
                <Col lg={8}>
                  <Card className="shadow-sm border-0 border-start border-4 border-danger h-100">
                    <Card.Header className="bg-white py-3 border-0">
                      <h6 className="mb-0 fw-bold small text-uppercase text-danger">⚠️ Monitoreo de Amenazas (ISO 27001)</h6>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-4 mb-4">
                        <Col md={6}>
                          <div className="p-3 bg-light rounded-4 text-center">
                            <small className="text-muted uppercase fw-bold d-block mb-1">Intentos Fallidos (24h)</small>
                            <h2 className={`fw-bold mb-0 ${seguridadData?.metricas?.intentosFallidos24h > 5 ? 'text-danger' : 'text-dark'}`}>
                              {seguridadData?.metricas?.intentosFallidos24h || 0}
                            </h2>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="p-3 bg-light rounded-4 text-center">
                            <small className="text-muted uppercase fw-bold d-block mb-1">Nivel de Riesgo Actual</small>
                            <Badge bg={seguridadData?.metricas?.nivelRiesgoActual === 'CRÍTICO' || seguridadData?.metricas?.nivelRiesgoActual === 'ALTO' ? 'danger' : 'success'} className="fs-5 px-4 py-2">
                              {seguridadData?.metricas?.nivelRiesgoActual || 'BAJO'}
                            </Badge>
                          </div>
                        </Col>
                        <Col md={12}>
                          <div className="p-3 bg-white border border-light rounded-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                               <small className="text-muted fw-bold">ÍNDICE DE ANOMALÍAS (IA)</small>
                               <span className="fw-bold text-dark">{seguridadData?.metricas?.anomaliasScore || 0}%</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                               <div 
                                 className={`progress-bar ${seguridadData?.metricas?.anomaliasScore > 50 ? 'bg-danger' : 'bg-info'}`} 
                                 style={{ width: `${seguridadData?.metricas?.anomaliasScore || 0}%` }}
                               ></div>
                            </div>
                            <p className="mt-2 mb-0 small text-muted">
                               {seguridadData?.anomalias?.detalles?.fueraHorario ? '🔴 Detectada actividad fuera de horario bancario. ' : '🟢 Horario de operación normal. '}
                               {seguridadData?.anomalias?.detalles?.totalIPs > 1 ? `⚠️ Múltiples IPs (${seguridadData?.anomalias?.detalles?.totalIPs}) detectadas.` : ''}
                            </p>
                          </div>
                        </Col>
                      </Row>

                      <h6 className="fw-bold mb-3 small text-uppercase">Últimas Acciones Críticas</h6>
                      <div className="table-responsive">
                        <Table hover className="small">
                          <thead className="table-light">
                            <tr>
                              <th>Usuario</th>
                              <th>Operación</th>
                              <th>Fecha</th>
                              <th>Resultado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {seguridadData?.accionesCriticas?.map(log => (
                              <tr key={log.id}>
                                <td>{log.usuario_email}</td>
                                <td><Badge bg="dark">{log.accion}</Badge></td>
                                <td>{new Date(log.created_at).toLocaleString()}</td>
                                <td>
                                  <Badge bg={log.resultado === 'exitoso' ? 'success' : 'danger'}>
                                    {log.resultado}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  <Card className="shadow-sm border-0 h-100 bg-dark text-white">
                    <Card.Header className="bg-transparent py-3 border-0 text-white-50 small fw-bold">
                      IPs DE ORIGEN RECURRENTES
                    </Card.Header>
                    <Card.Body>
                      {seguridadData?.topIPs?.map((ip, idx) => (
                        <div key={idx} className="mb-3 d-flex justify-content-between align-items-center">
                          <span className="small font-monospace">{ip.ip}</span>
                          <Badge bg="secondary" pill>{ip.cantidad} peticiones</Badge>
                        </div>
                      ))}
                      <hr className="bg-white bg-opacity-25 my-4" />
                      <div className="small text-white-50">
                        <p className="mb-2 fw-bold text-white">RECOMENDACIÓN ISO 27001:</p>
                        <p>Se recomienda rotar claves cada 90 días y habilitar 2FA para roles con acceso a reportes ASFI.</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={12}>
                  <Card className="shadow-sm border-0 mt-2 bg-light border-start border-4 border-info">
                    <Card.Body className="p-4">
                      <h6 className="fw-bold text-info mb-4 text-uppercase small">Guía de Prevención contra Ingeniería Social</h6>
                      <Row className="g-4">
                        <Col md={4}>
                          <h6 className="fw-bold small">1. Métodos de Engaño</h6>
                          <ul className="small text-muted ps-3">
                            <li><strong>Phishing:</strong> Correos fraudulentos imitando al banco.</li>
                            <li><strong>Smishing:</strong> SMS con enlaces maliciosos.</li>
                            <li><strong>Vishing:</strong> Fraude por voz suplantando empleados.</li>
                          </ul>
                        </Col>
                        <Col md={4}>
                          <h6 className="fw-bold small">2. Malware y Fraude Técnico</h6>
                          <ul className="small text-muted ps-3">
                            <li><strong>Farming:</strong> Redirección a webs falsas mediante DNS.</li>
                            <li><strong>SIM Swapping:</strong> Duplicado ilegal de SIM para saltar 2FA.</li>
                            <li><strong>Ransomware:</strong> Cifrado de datos críticos por rescate.</li>
                          </ul>
                        </Col>
                        <Col md={4}>
                          <h6 className="fw-bold small">3. Tendencias IA</h6>
                          <ul className="small text-muted ps-3">
                            <li><strong>Deepfakes:</strong> Clonación de voz para ataques de vishing.</li>
                            <li><strong>IA Phishing:</strong> Correos generados sin errores gramaticales.</li>
                          </ul>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Reportes;
