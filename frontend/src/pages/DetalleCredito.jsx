/**
 * BANCOSOL - Detalle de Crédito Premium
 * Visualización de 360° de la operación con trazabilidad total
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import {
  Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert, Modal, Form
} from 'react-bootstrap';
import { BiReceipt, BiChevronLeft, BiCalendar, BiDollarCircle, BiShield, BiTrendingUp } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';

const DetalleCredito = () => {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [credito, setCredito] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  useEffect(() => {
    cargarCredito();
  }, [id]);

  const cargarCredito = async () => {
    try {
      setCargando(true);
      const res = await axios.get(`/creditos/${id}`);
      // Backend: { success: true, data: creditoCompleto }
      setCredito(res.data.data);
      setNuevoEstado(res.data.data.estado);
      setError('');
    } catch (err) {
      console.error('Error cargando crédito:', err);
      setError(err.response?.status === 404 
        ? 'El crédito solicitado no existe o fue reindexado por el sistema.' 
        : 'Error al conectar con el servidor central.');
    } finally {
      setCargando(false);
    }
  };

  const handleCambiarEstado = async (e) => {
    e.preventDefault();
    setGuardandoEstado(true);
    try {
      await axios.put(`/creditos/${id}/estado`, { estado: nuevoEstado, motivo });
      setMostrarModal(false);
      setMotivo('');
      cargarCredito();
    } catch (err) {
      alert('Error en la transición de estado: ' + (err.response?.data?.error || err.message));
    } finally {
      setGuardandoEstado(false);
    }
  };

  if (cargando) return <div className="center-spinner"><Spinner animation="border" /></div>;

  if (error) {
    return (
      <Container className="py-5 text-center fade-in">
        <Alert variant="info" className="border-0 shadow-sm p-5 rounded-4">
          <h4 className="fw-bold text-dark mb-3">{error}</h4>
          <p className="text-muted">Por favor, regrese a la lista de créditos y seleccione uno vigente.</p>
          <Button as={Link} to="/creditos" variant="primary" className="mt-3 px-4">
            <BiChevronLeft /> Ir a Lista de Créditos
          </Button>
        </Alert>
      </Container>
    );
  }

  const { estadoFinanciero, analisisPredictivo } = credito;

  return (
    <div className="fade-in px-3 pb-5">
      {/* Header Premium */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-5 mt-3">
        <div>
          <div className="d-flex align-items-center mb-1">
             <Button as={Link} to="/creditos" variant="link" className="p-0 me-3 text-dark">
                <BiChevronLeft size={24} />
             </Button>
             <h2 className="fw-bold text-dark mb-0">Expediente {credito.numero_credito}</h2>
          </div>
          <p className="text-muted small mb-0 ms-5">Titular: <span className="fw-bold text-dark">{credito.cliente?.nombre} {credito.cliente?.apellido}</span> | CI: {credito.cliente?.ci}</p>
        </div>
        <div className="d-flex gap-3 align-items-center mt-3 mt-md-0">
          {['admin', 'analista', 'gerente'].includes(usuario?.rol) && (
            <Button variant="light" className="border shadow-sm px-4" onClick={() => setMostrarModal(true)}>
              Gestión de Estado
            </Button>
          )}
          <Badge bg={getEstadoColor(credito.estado)} className="p-3 fs-6 rounded-3 shadow-sm text-dark bg-opacity-25" style={{ minWidth: '120px', border: `1px solid ${getEstadoBorderColor(credito.estado)}` }}>
            {credito.estado.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <Row className="g-4">
        {/* Columna Lateral: Ficha Técnica */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4 overflow-hidden">
            <div className="bg-primary p-1"></div>
            <Card.Body className="p-4">
              <h6 className="fw-bold text-dark mb-4 d-flex align-items-center">
                <BiShield className="me-2 text-primary" /> Ficha de Operación
              </h6>
              <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span className="text-muted small">Monto Original</span>
                <span className="fw-bold text-dark">Bs. {parseFloat(credito.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span className="text-muted small">Tasa de Interés</span>
                <span className="fw-bold text-dark">{parseFloat(credito.tasa_interes * 100).toFixed(2)}% Anual</span>
              </div>
              <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span className="text-muted small">Plazo de Pago</span>
                <span className="fw-bold text-dark">{credito.plazo_meses} Meses</span>
              </div>
              <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span className="text-muted small">Destino</span>
                <span className="fw-bold text-dark">{credito.destino || 'Sin definir'}</span>
              </div>
              <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span className="text-muted small">Garantía</span>
                <span className="fw-bold text-dark text-end" style={{ maxWidth: '150px' }}>{credito.garantia || 'Personal'}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Categoría ASFI</span>
                <Badge bg={getCategoryColor(credito.categoria_asfi)} className="text-dark bg-opacity-25 border border-dark border-opacity-10">
                  Categoría {credito.categoria_asfi || 'A'}
                </Badge>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4 bg-light">
            <Card.Body className="p-4">
              <h6 className="fw-bold text-dark mb-4 d-flex align-items-center">
                <BiDollarCircle className="me-2 text-success" /> Balance Actual
              </h6>
              <div className="text-center py-3 mb-3 bg-white rounded-4 shadow-sm border border-light">
                <small className="text-muted d-block">Saldo de Capital Pendiente</small>
                <h3 className="fw-bold text-dark mb-0">Bs. {parseFloat(credito.saldo_pendiente).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</h3>
              </div>
              <Row className="g-2">
                <Col xs={6}>
                  <div className="bg-white p-3 rounded-4 border border-light text-center">
                    <small className="text-muted d-block">Mora</small>
                    <span className={`fw-bold ${credito.mora_acumulada > 0 ? 'text-danger' : 'text-success'}`}>Bs. {parseFloat(credito.mora_acumulada).toFixed(2)}</span>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="bg-white p-3 rounded-4 border border-light text-center">
                    <small className="text-muted d-block">Avance</small>
                    <span className="fw-bold text-primary">{estadoFinanciero?.porcentajePagado?.toFixed(1)}%</span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4 overflow-hidden" style={{ background: '#f8faff' }}>
            <div className={`p-1 bg-${analisisPredictivo?.riesgoColor || 'primary'}`}></div>
            <Card.Body className="p-4">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                <BiTrendingUp className="me-2 text-primary" /> Analítica de Riesgo
              </h6>
              <div className="d-flex align-items-center mb-4">
                <div className={`bg-${analisisPredictivo?.riesgoColor || 'primary'} text-white p-3 rounded-circle me-3 fw-bold fs-4 d-flex align-items-center justify-content-center`} style={{ width: '60px', height: '60px' }}>
                  {analisisPredictivo?.score || '0'}
                </div>
                <div>
                   <div className="fw-bold text-dark">Riesgo {analisisPredictivo?.riesgo || 'No Calculado'}</div>
                   <div className="text-muted small">Score de Cumplimiento</div>
                </div>
              </div>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Probabilidad de Default</span>
                <span className="fw-bold text-dark">{analisisPredictivo?.pd || '0.00%'}</span>
              </div>
            </Card.Body>
          </Card>

          {/* Gestión de Documentos (Files) */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold text-dark mb-3">Expediente Digital</h6>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">Subir Garantía/CI (PDF/JPG)</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control type="file" size="sm" className="bg-light border-0" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const formData = new FormData();
                      formData.append('archivo', file);
                      axios.post(`/creditos/${id}/documentos`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      }).then(() => {
                        alert('Archivo guardado en el servidor');
                        cargarCredito();
                      }).catch(err => alert('Error: ' + err.message));
                    }
                  }} />
                </div>
              </Form.Group>
              <div className="list-group list-group-flush">
                {credito.documentos?.length > 0 ? credito.documentos.map(doc => (
                  <div key={doc.id} className="list-group-item px-0 py-2 border-0 d-flex justify-content-between align-items-center">
                    <div>
                      <span className="small text-muted d-block">{doc.nombre}</span>
                      <small className="text-primary" style={{ fontSize: '0.65rem' }}>{doc.tipo.toUpperCase()} • {new Date(doc.createdAt).toLocaleDateString()}</small>
                    </div>
                    <Button variant="link" size="sm" className="p-0" onClick={() => window.open(axios.defaults.baseURL.replace('/api', '') + doc.path)}>
                      Ver
                    </Button>
                  </div>
                )) : (
                  <div className="text-center py-2 small text-muted italic">No hay archivos adjuntos</div>
                )}
              </div>
            </Card.Body>
          </Card>

          {['activo', 'en_mora', 'al_dia'].includes(credito.estado) && (
            <Button as={Link} to={`/creditos/${credito.id}/pagos/registrar`} variant="primary" className="w-100 py-3 rounded-4 shadow-sm fw-bold">
               <BiReceipt className="me-2" /> Registrar Cobro de Cuota
            </Button>
          )}
        </Col>

        {/* Columna Principal: Tablas */}
        <Col lg={8}>
          {/* Tabla Amortización */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
               <h6 className="fw-bold text-dark mb-0">Plan de Pagos (Amortización)</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="table-light">
                  <tr className="small text-muted">
                    <th className="px-4">N°</th>
                    <th>Vencimiento</th>
                    <th>Capital</th>
                    <th>Interés</th>
                    <th>Cuota Total</th>
                    <th className="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {credito.amortizaciones?.map(amort => (
                    <tr key={amort.id}>
                      <td className="px-4 fw-bold">{amort.numero_cuota}</td>
                      <td>{amort.fecha_vencimiento ? new Date(amort.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-BO') : '-'}</td>
                      <td>Bs. {parseFloat(amort.capital).toFixed(2)}</td>
                      <td>Bs. {parseFloat(amort.interes).toFixed(2)}</td>
                      <td className="fw-bold text-dark">Bs. {parseFloat(amort.cuota_total).toFixed(2)}</td>
                      <td className="text-center">
                        <Badge bg={amort.pagado ? 'success' : (new Date(amort.fecha_vencimiento) < new Date() ? 'danger' : 'warning')} 
                               className="fw-normal text-white bg-opacity-75">
                           {amort.pagado ? 'CUMPLIDO' : (new Date(amort.fecha_vencimiento) < new Date() ? 'MORA' : 'PENDIENTE')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Historial de Estados */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
               <h6 className="fw-bold text-dark mb-0">Historial de Trazabilidad Técnica</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="table-light">
                  <tr className="small text-muted">
                    <th className="px-4">Fecha y Hora</th>
                    <th>Transición</th>
                    <th>Responsable</th>
                    <th>Observación Técnica</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {credito.historial_estados?.map(hist => (
                    <tr key={hist.id}>
                      <td className="px-4">
                        <div className="fw-bold">{hist.created_at ? new Date(hist.created_at).toLocaleDateString('es-BO') : 'Fecha Base'}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{hist.created_at ? new Date(hist.created_at).toLocaleTimeString('es-BO') : '-'}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                           <Badge bg="light" className="text-muted border">{hist.estado_anterior || 'INICIO'}</Badge>
                           <span className="text-muted">→</span>
                           <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary border-opacity-25">{hist.estado_nuevo}</Badge>
                        </div>
                      </td>
                      <td>{hist.usuario?.nombre || 'SISTEMA'}</td>
                      <td className="text-muted">{hist.motivo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Cambio de Estado */}
      <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Gestión Normativa de Estado</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCambiarEstado}>
          <Modal.Body className="pt-4">
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Nuevo Estado de Operación</Form.Label>
              <Form.Select className="bg-light border-0 py-2" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} required>
                <option value="pendiente">Pendiente de Revisión</option>
                <option value="aprobado">Aprobado / Listo para Desembolso</option>
                <option value="activo">Activo (En Cartera)</option>
                <option value="al_dia">Vigente / Al Día</option>
                <option value="en_mora">Vencido / En Mora</option>
                <option value="cancelado">Cancelado / Liquidado</option>
                <option value="rechazado">Rechazado</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted">Justificación Técnica</Form.Label>
              <Form.Control as="textarea" rows={3} className="bg-light border-0" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Describa la razón del cambio para la auditoría..." required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setMostrarModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={guardandoEstado} className="px-4">
              {guardandoEstado ? 'Procesando...' : 'Confirmar Cambio'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

const getEstadoColor = (estado) => {
  const map = { pendiente: 'warning', aprobado: 'success', activo: 'primary', al_dia: 'success', en_mora: 'danger', cancelado: 'secondary', rechazado: 'danger' };
  return map[estado] || 'secondary';
};

const getEstadoBorderColor = (estado) => {
  const map = { pendiente: '#ffc107', aprobado: '#198754', activo: '#0d6efd', al_dia: '#198754', en_mora: '#dc3545', cancelado: '#6c757d', rechazado: '#dc3545' };
  return map[estado] || '#dee2e6';
};

const getCategoryColor = (cat) => {
  const map = { A: 'success', B: 'info', C: 'warning', D: 'danger', E: 'danger', F: 'dark' };
  return map[cat] || 'success';
};

export default DetalleCredito;
