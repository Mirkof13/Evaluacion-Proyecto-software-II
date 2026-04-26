/**
 * BANCOSOL - Bitácora de Auditoría (Forense)
 * Visualización de logs forenses con diff JSON
 * Principio ISO 27001: No Repudio
 */

import { useEffect, useState } from 'react';
import axios from '../api/axios';
import {
  Container, Row, Col, Card, Table, Form, Badge, Spinner, Modal, Tabs, Tab, Button
} from 'react-bootstrap';
import { 
  BiShield, BiCalendar, BiUser, BiDesktop, BiSearch, BiReset, BiChevronRight 
} from 'react-icons/bi';

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState({
    usuario_email: '',
    accion: '',
    tabla_afectada: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  const [logSeleccionado, setLogSeleccionado] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    cargarLogs();
  }, []);

  const cargarLogs = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtros.usuario_email) params.append('usuario_email', filtros.usuario_email);
      if (filtros.accion) params.append('accion', filtros.accion);
      if (filtros.tabla_afectada) params.append('tabla_afectada', filtros.tabla_afectada);
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);

      const res = await axios.get(`/auditoria?${params.toString()}`);
      setLogs(res.data?.logs || []);
    } catch (err) {
      console.error('Error cargando logs:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = () => {
    cargarLogs();
  };

  const limpiarFiltros = () => {
    setFiltros({
      usuario_email: '',
      accion: '',
      tabla_afectada: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    cargarLogs();
  };

  const verDetalle = async (log) => {
    try {
      const res = await axios.get(`/auditoria/${log.id}`);
      // Backend: { success: true, data: logCompleto }
      setLogSeleccionado(res.data);
      setShowModal(true);
    } catch (err) {
      console.error('Error cargando detalle de log:', err);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-BO');
  };

  const getResultadoBadge = (resultado) => {
    return resultado === 'exitoso'
      ? { bg: 'success', text: 'Exitoso' }
      : { bg: 'danger', text: 'Fallido' };
  };

  return (
    <div className="auditoria-container">
      <div className="mb-4">
        <h2 className="d-flex align-items-center">
          <BiShield className="me-2 text-primary" />
          Bitácora Forense de Auditoría
        </h2>
        <p className="text-muted">
          Implementación del principio de <strong>No Repudio</strong> (ISO 27001).
          Cada acción administrativa y de negocio queda registrada con IP, User Agent y diferencial de datos.
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0 fw-bold">Filtros de Auditoría</h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Label className="small fw-bold">Usuario (Email)</Form.Label>
              <Form.Control
                type="text"
                name="usuario_email"
                placeholder="ej: admin@bancosol.bo"
                value={filtros.usuario_email}
                onChange={handleFiltroChange}
              />
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-bold">Acción</Form.Label>
              <Form.Select
                name="accion"
                value={filtros.accion}
                onChange={handleFiltroChange}
              >
                <option value="">Todas</option>
                <option value="CREAR">CREACIÓN</option>
                <option value="ACTUALIZAR">ACTUALIZACIÓN</option>
                <option value="ELIMINAR">ELIMINACIÓN</option>
                <option value="LOGIN">LOGIN</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-bold">Tabla</Form.Label>
              <Form.Select
                name="tabla_afectada"
                value={filtros.tabla_afectada}
                onChange={handleFiltroChange}
              >
                <option value="">Todas</option>
                <option value="creditos">Créditos</option>
                <option value="clientes">Clientes</option>
                <option value="pagos">Pagos</option>
                <option value="usuarios">Usuarios</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-bold">Desde</Form.Label>
              <Form.Control
                type="date"
                name="fecha_desde"
                value={filtros.fecha_desde}
                onChange={handleFiltroChange}
              />
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-bold">Hasta</Form.Label>
              <Form.Control
                type="date"
                name="fecha_hasta"
                value={filtros.fecha_hasta}
                onChange={handleFiltroChange}
              />
            </Col>
            <Col md={1} className="d-flex align-items-end">
              <Button variant="primary" className="w-100" onClick={aplicarFiltros}>
                <BiSearch />
              </Button>
            </Col>
          </Row>
          <div className="mt-3">
            <Button variant="link" size="sm" className="text-decoration-none p-0" onClick={limpiarFiltros}>
              <BiReset className="me-1" /> Limpiar filtros
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Tabla de logs */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {cargando ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : logs.length === 0 ? (
            <p className="text-muted text-center py-5">No se encontraron registros de auditoría</p>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>ID</th>
                  <th>IP Origen</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const res = getResultadoBadge(log.resultado);
                  const fecha = new Date(log.createdAt || log.created_at || new Date());
                  return (
                    <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => verDetalle(log)}>
                      <td>
                        <div className="fw-bold small text-dark">{fecha.toLocaleDateString('es-BO')}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{fecha.toLocaleTimeString('es-BO')}</div>
                      </td>
                      <td>
                        <div className="small fw-bold">{log.usuario_email || 'Sistema'}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>IP: {log.ip_origen}</div>
                      </td>
                      <td>
                        <Badge bg="outline-secondary" className="text-dark border small">{log.accion}</Badge>
                      </td>
                      <td>
                        <div className="small fw-bold text-uppercase">{log.tabla_afectada}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {log.registro_id ? `ID: #${log.registro_id}` : (
                            log.accion.includes('LOGIN') ? 'SESIÓN' : 
                            log.accion.includes('CREAR') ? 'NUEVO' : 'GLOBAL'
                          )}
                        </div>
                      </td>
                      <td>
                        <code className="small">{log.metodo_http} {log.endpoint.substring(0, 20)}...</code>
                      </td>
                      <td className="text-center"><Badge bg={res.bg} className="fw-normal">{res.text}</Badge></td>
                      <td className="text-center">
                        <Button variant="light" size="sm" className="rounded-circle border-0" onClick={(e) => { e.stopPropagation(); verDetalle(log); }}>
                           <BiChevronRight />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal detalle con diff JSON */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title className="h6">
            <BiShield className="me-2 text-warning" />
            Evidencia Forense - Registro #{logSeleccionado?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          {logSeleccionado && (
            <Tabs defaultActiveKey="resumen" id="auditoria-tabs" className="mb-3">
              <Tab eventKey="resumen" title="Resumen">
                <Row className="g-3 mt-1">
                  <Col md={6}>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="mb-1 text-muted small uppercase fw-bold">Usuario Responsable</p>
                      <p className="mb-3">{logSeleccionado.usuario_email || logSeleccionado.usuario?.email}</p>
                      
                      <p className="mb-1 text-muted small uppercase fw-bold">Operación</p>
                      <p className="mb-3"><Badge bg="info">{logSeleccionado.accion}</Badge> en <code>{logSeleccionado.tabla_afectada}</code></p>
                      
                      <p className="mb-1 text-muted small uppercase fw-bold">ID del Registro</p>
                      <p className="mb-0">
                        {logSeleccionado.registro_id 
                          ? `#${logSeleccionado.registro_id}` 
                          : (logSeleccionado.accion.includes('LOGIN') ? 'Sesión de Usuario' : 'Identificador de Sistema')}
                      </p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="mb-1 text-muted small uppercase fw-bold">Origen de la Petición</p>
                      <p className="mb-3">IP: <code>{logSeleccionado.ip_origen}</code></p>
                      
                      <p className="mb-1 text-muted small uppercase fw-bold">Endpoint</p>
                      <p className="mb-3"><Badge bg="light" className="text-dark border">{logSeleccionado.metodo_http}</Badge> {logSeleccionado.endpoint}</p>
                      
                      <p className="mb-1 text-muted small uppercase fw-bold">Timestamp</p>
                      <p className="mb-0">{formatearFecha(logSeleccionado.createdAt || logSeleccionado.created_at)}</p>
                    </div>
                  </Col>
                  <Col md={12}>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="mb-1 text-muted small uppercase fw-bold">User Agent (Navegador/Sistema)</p>
                      <p className="mb-0 small text-break">{logSeleccionado.user_agent}</p>
                    </div>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="cambios" title="Cambios en Datos">
                <Row className="g-3 mt-1">
                  <Col md={6}>
                    <h6 className="small fw-bold text-danger">Estado Anterior</h6>
                    <pre className="bg-dark text-white p-3 rounded shadow-sm overflow-auto" style={{ maxHeight: '400px', fontSize: '0.85rem' }}>
                      {logSeleccionado.datos_antes
                        ? JSON.stringify(logSeleccionado.datos_antes, null, 2)
                        : '// Sin datos (posible creación)'}
                    </pre>
                  </Col>
                  <Col md={6}>
                    <h6 className="small fw-bold text-success">Estado Posterior</h6>
                    <pre className="bg-dark text-white p-3 rounded shadow-sm overflow-auto" style={{ maxHeight: '400px', fontSize: '0.85rem' }}>
                      {logSeleccionado.datos_despues
                        ? JSON.stringify(logSeleccionado.datos_despues, null, 2)
                        : '// Sin datos (posible eliminación)'}
                    </pre>
                  </Col>
                </Row>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar Evidencia
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Auditoria;
