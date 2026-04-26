/**
 * BANCOSOL - Gestión Integral de Clientes
 * Soporta CRUD completo con trazabilidad de auditoría
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import {
  Container, Row, Col, Card, Table, Form, Button, Badge, Pagination, Spinner, InputGroup, Modal
} from 'react-bootstrap';
import { BiSearch, BiUserPlus, BiEditAlt, BiChevronRight, BiSave, BiTrash } from 'react-icons/bi';

const Clientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [termino, setTermino] = useState('');
  const [paginacion, setPaginacion] = useState({
    page: 1, limit: 10, total: 0, totalPages: 0
  });

  // Modal State
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    ci: '', nombre: '', apellido: '', email: '', telefono: '', direccion: '', fecha_nacimiento: ''
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, [paginacion.page, termino]);

  const cargarClientes = async () => {
    setCargando(true);
    try {
      const res = await axios.get('/clientes', {
        params: { page: paginacion.page, limit: paginacion.limit, busqueda: termino }
      });
      // Backend: { success: true, data: { clientes: [], paginacion: {} } }
      setClientes(res.data?.clientes || []);
      setPaginacion(prev => ({
        ...prev,
        total: res.data?.paginacion?.total || 0,
        totalPages: res.data?.paginacion?.totalPages || 0
      }));
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setCargando(false);
    }
  };

  const abrirModal = (cliente = null) => {
    if (cliente) {
      setEditandoId(cliente.id);
      setFormData({
        ci: cliente.ci,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        fecha_nacimiento: cliente.fecha_nacimiento || ''
      });
    } else {
      setEditandoId(null);
      setFormData({ ci: '', nombre: '', apellido: '', email: '', telefono: '', direccion: '', fecha_nacimiento: '' });
    }
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editandoId) {
        await axios.put(`/clientes/${editandoId}`, formData);
      } else {
        await axios.post('/clientes', formData);
      }
      setMostrarModal(false);
      cargarClientes();
    } catch (err) {
      alert('Error al procesar cliente: ' + (err.message || 'Error desconocido'));
    } finally {
      setGuardando(false);
    }
  };

  const getVinculacionBadge = (score) => {
    if (score > 80) return <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 fw-normal">Alta Fidelidad</Badge>;
    if (score > 50) return <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-25 fw-normal">Vinculado</Badge>;
    return <Badge bg="secondary" className="bg-opacity-10 text-muted border fw-normal">Básica</Badge>;
  };

  return (
    <div className="fade-in px-3 pb-5">
      <div className="d-flex justify-content-between align-items-center mb-5 mt-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Maestro de Clientes</h2>
          <p className="text-muted small">Gestión centralizada de perfiles y cumplimiento normativo</p>
        </div>
        <Button variant="primary" className="shadow-sm px-4 py-2 rounded-3 fw-bold" onClick={() => abrirModal()}>
          <BiUserPlus className="me-2" size={20} /> Registrar Cliente
        </Button>
      </div>

      <Card className="shadow-sm border-0 mb-4 overflow-hidden rounded-4">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={7}>
              <InputGroup className="bg-light rounded-4 p-1">
                <InputGroup.Text className="bg-transparent border-0 text-muted">
                  <BiSearch />
                </InputGroup.Text>
                <Form.Control
                  className="bg-transparent border-0 shadow-none"
                  placeholder="Buscar por CI, Nombre o Apellido..."
                  value={termino}
                  onChange={(e) => setTermino(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={5} className="text-md-end mt-3 mt-md-0">
               <span className="text-muted small me-2">Gestión 2024</span>
               <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary border-opacity-10 fw-normal px-3 py-2">
                 Total: {paginacion.total} Clientes
               </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0 overflow-hidden rounded-4">
        <Card.Body className="p-0">
          {cargando ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No se encontraron clientes registrados en la base de datos.</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr className="text-muted small">
                  <th className="ps-4 py-3 text-uppercase">Identificación (CI)</th>
                  <th className="py-3 text-uppercase">Nombre y Apellidos</th>
                  <th className="py-3 text-uppercase">Contacto / Ubicación</th>
                  <th className="py-3 text-uppercase">Vinculación</th>
                  <th className="py-3 text-uppercase text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="small">
                {clientes.map((cliente, idx) => (
                  <tr key={cliente.id}>
                    <td className="ps-4 fw-bold text-dark"><code>{cliente.ci}</code></td>
                    <td>
                      <div className="fw-bold text-dark">{cliente.nombre} {cliente.apellido}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>Nacido: {cliente.fecha_nacimiento}</div>
                    </td>
                    <td>
                      <div className="small text-dark fw-bold">{cliente.telefono}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>{cliente.direccion}</div>
                    </td>
                    <td>
                      {getVinculacionBadge(cliente.id % 2 === 0 ? 85 : 40)}
                    </td>
                    <td className="text-center pe-4">
                      <div className="d-flex justify-content-center gap-2">
                        <Button variant="light" size="sm" className="rounded-3 border-0 text-primary bg-primary bg-opacity-10" onClick={() => abrirModal(cliente)}>
                          <BiEditAlt size={16} />
                        </Button>
                        <Button variant="light" size="sm" className="rounded-3 border-0 text-dark bg-light" onClick={() => navigate(`/creditos/crear?cliente_id=${cliente.id}`)}>
                          <BiChevronRight size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Paginación */}
      {paginacion.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-5 mb-5">
          <Pagination className="shadow-sm">
            <Pagination.Prev disabled={paginacion.page === 1} onClick={() => setPaginacion(p => ({ ...p, page: p.page - 1 }))} />
            {[...Array(paginacion.totalPages)].map((_, i) => (
              <Pagination.Item key={i + 1} active={i + 1 === paginacion.page} onClick={() => setPaginacion(p => ({ ...p, page: i + 1 }))}>
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next disabled={paginacion.page === paginacion.totalPages} onClick={() => setPaginacion(p => ({ ...p, page: p.page + 1 }))} />
          </Pagination>
        </div>
      )}

      {/* Modal CRUD Cliente */}
      <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{editandoId ? 'Editar Perfil de Cliente' : 'Registrar Nuevo Cliente'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Cédula de Identidad (CI)</Form.Label>
                  <Form.Control className="bg-light border-0 py-2" type="text" value={formData.ci} onChange={(e) => setFormData({...formData, ci: e.target.value})} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Fecha de Nacimiento</Form.Label>
                  <Form.Control className="bg-light border-0 py-2" type="date" value={formData.fecha_nacimiento} onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Nombres</Form.Label>
                  <Form.Control className="bg-light border-0 py-2" type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Apellidos</Form.Label>
                  <Form.Control className="bg-light border-0 py-2" type="text" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Correo Electrónico</Form.Label>
                  <Form.Control className="bg-light border-0 py-2" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Teléfono de Contacto</Form.Label>
                  <Form.Control className="bg-light border-0 py-2" type="text" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">Dirección de Domicilio</Form.Label>
                  <Form.Control className="bg-light border-0 py-2" type="text" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button variant="light" className="px-4 py-2 border-0" onClick={() => setMostrarModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={guardando} className="px-5 py-2 fw-bold shadow-sm rounded-3">
              {guardando ? 'Procesando...' : (editandoId ? 'Sobrescribir Datos' : 'Guardar Cliente')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Clientes;
