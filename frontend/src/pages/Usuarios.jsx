/**
 * BANCOSOL - Control de Acceso (Usuarios)
 * Gestión de Identidades y Accesos (IAM) con Auditoría
 */

import { useEffect, useState } from 'react';
import axios from '../api/axios';
import {
  Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge, Spinner
} from 'react-bootstrap';
import { BiUserPlus, BiKey, BiToggleLeft, BiToggleRight, BiShieldQuarter, BiEnvelope } from 'react-icons/bi';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modalModo, setModalModo] = useState('crear');
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '', rol_id: '', activo: true });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
  }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const res = await axios.get('/usuarios');
      // Backend: { success: true, data: { usuarios: [] } }
      setUsuarios(res.data?.usuarios || []);
    } catch (err) {
      console.error('Error IAM:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const res = await axios.get('/usuarios/roles');
      // Backend: { success: true, data: roles }
      setRoles(res.data || []);
    } catch (err) {
      setRoles([{ id: 1, nombre: 'admin' }, { id: 2, nombre: 'gerente' }, { id: 3, nombre: 'analista' }, { id: 4, nombre: 'oficial_credito' }]);
    }
  };

  const abrirModal = (u = null) => {
    if (u) {
      setModalModo('editar');
      setFormData({ nombre: u.nombre, email: u.email, password: '', rol_id: u.rol?.id || u.rol_id, activo: u.activo, id: u.id });
    } else {
      setModalModo('crear');
      setFormData({ nombre: '', email: '', password: '', rol_id: '', activo: true });
    }
    setMostrarModal(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      if (modalModo === 'crear') {
        await axios.post('/usuarios', formData);
      } else {
        await axios.put(`/usuarios/${formData.id}`, formData);
      }
      setSuccess(`Usuario ${modalModo === 'crear' ? 'creado' : 'actualizado'} exitosamente`);
      setMostrarModal(false);
      cargarUsuarios();
    } catch (err) {
      setError(err.message || 'Error al procesar identidad');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fade-in px-3 pb-5">
      <div className="d-flex justify-content-between align-items-center mb-5 mt-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Control de Identidades</h2>
          <p className="text-muted small">Gestión de privilegios y accesos al núcleo financiero</p>
        </div>
        <Button variant="primary" className="shadow-sm px-4 py-2 rounded-3 fw-bold" onClick={() => abrirModal()}>
          <BiUserPlus className="me-2" size={20} /> Nueva Identidad
        </Button>
      </div>

      <Card className="shadow-sm border-0 overflow-hidden rounded-4">
        <Card.Body className="p-0">
          {cargando && usuarios.length === 0 ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr className="text-muted small">
                  <th className="ps-4 py-3">USUARIO / EMAIL</th>
                  <th className="py-3">ROL ASIGNADO</th>
                  <th className="py-3">ESTADO</th>
                  <th className="py-3">ÚLTIMA ACTIVIDAD</th>
                  <th className="text-center py-3">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="small">
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td className="ps-4 py-3">
                      <div className="fw-bold text-dark">{u.nombre}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}><BiEnvelope className="me-1" />{u.email}</div>
                    </td>
                    <td>
                      <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary border-opacity-10 fw-normal px-2 py-1">
                        <BiShieldQuarter className="me-1" /> {u.rol?.nombre?.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={u.activo ? 'success' : 'secondary'} className="bg-opacity-10 text-dark border fw-normal">
                        {u.activo ? 'ACTIVO' : 'RESTRINGIDO'}
                      </Badge>
                    </td>
                    <td className="text-muted">
                      {u.ultimo_login ? new Date(u.ultimo_login).toLocaleString('es-BO') : 'Sin registros'}
                    </td>
                    <td className="text-center pe-4">
                      <div className="d-flex justify-content-center gap-2">
                        <Button variant="light" size="sm" className="rounded-3 border-0" onClick={() => abrirModal(u)}>Editar</Button>
                        <Button variant="light" size="sm" className="rounded-circle border-0 text-warning"><BiKey /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Configuración de Identidad</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Nombre Completo</Form.Label>
              <Form.Control className="bg-light border-0 py-2" type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Correo Institucional</Form.Label>
              <Form.Control className="bg-light border-0 py-2" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">{modalModo === 'crear' ? 'Contraseña' : 'Nueva Contraseña (opcional)'}</Form.Label>
              <Form.Control className="bg-light border-0 py-2" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={modalModo === 'crear'} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Perfil de Acceso (Rol)</Form.Label>
              <Form.Select className="bg-light border-0 py-2" value={formData.rol_id} onChange={(e) => setFormData({...formData, rol_id: e.target.value})} required>
                <option value="">Seleccionar...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre.toUpperCase()}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Check type="switch" label="Acceso Habilitado" checked={formData.activo} onChange={(e) => setFormData({...formData, activo: e.target.checked})} className="small fw-bold text-muted" />
          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button variant="light" onClick={() => setMostrarModal(false)}>Cerrar</Button>
            <Button variant="primary" type="submit" disabled={cargando} className="px-5 py-2 fw-bold shadow-sm rounded-3">
              {cargando ? 'Procesando...' : (modalModo === 'crear' ? 'Crear Identidad' : 'Guardar Cambios')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Usuarios;
