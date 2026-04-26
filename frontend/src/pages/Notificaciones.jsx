import { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Container, Card, ListGroup, Badge, Button, Spinner, Row, Col } from 'react-bootstrap';
import { BiBell, BiCheckDouble, BiTrash, BiLinkExternal } from 'react-icons/bi';
import { Link } from 'react-router-dom';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const res = await axios.get('/notificaciones');
      // El backend devuelve { success: true, data: [...] }
      setNotificaciones(res.data.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  const marcarLeida = async (id) => {
    try {
      await axios.put(`/notificaciones/${id}/leer`);
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await axios.post('/notificaciones/leer-todas');
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (cargando) return <div className="center-spinner"><Spinner animation="border" /></div>;

  return (
    <Container className="py-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Centro de Notificaciones</h2>
          <p className="text-muted small mb-0">Alertas críticas y avisos del sistema</p>
        </div>
        <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={marcarTodasLeidas}>
          <BiCheckDouble className="me-1" /> Marcar todas como leídas
        </Button>
      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <ListGroup variant="flush">
          {notificaciones.length > 0 ? notificaciones.map(n => (
            <ListGroup.Item 
              key={n.id} 
              className={`p-4 border-bottom ${!n.leida ? 'bg-light border-start border-4 border-primary' : ''}`}
              style={{ transition: 'all 0.3s' }}
            >
              <Row className="align-items-center">
                <Col xs={1} className="text-center">
                  <div className={`p-3 rounded-circle bg-${n.tipo || 'info'} bg-opacity-10 text-${n.tipo || 'info'}`}>
                    <BiBell size={24} />
                  </div>
                </Col>
                <Col>
                  <div className="d-flex justify-content-between align-items-start">
                    <h6 className={`fw-bold mb-1 ${!n.leida ? 'text-dark' : 'text-muted'}`}>{n.titulo}</h6>
                    <small className="text-muted">{new Date(n.createdAt || n.created_at || new Date()).toLocaleString()}</small>
                  </div>
                  <p className={`mb-2 ${!n.leida ? 'text-dark' : 'text-muted text-opacity-75'}`}>{n.mensaje}</p>
                  <div className="d-flex gap-3 align-items-center">
                    {!n.leida && (
                      <Button variant="link" className="p-0 text-primary small text-decoration-none fw-bold" onClick={() => marcarLeida(n.id)}>
                        Marcar como leída
                      </Button>
                    )}
                    {n.vinculo_url && (
                      <Button as={Link} to={n.vinculo_url} variant="link" className="p-0 text-dark small text-decoration-none fw-bold">
                        <BiLinkExternal className="me-1" /> Ver detalle
                      </Button>
                    )}
                  </div>
                </Col>
                <Col xs="auto">
                  {!n.leida && <Badge bg="primary" pill>Nueva</Badge>}
                </Col>
              </Row>
            </ListGroup.Item>
          )) : (
            <div className="p-5 text-center">
              <div className="mb-3 text-muted opacity-25">
                <BiBell size={64} />
              </div>
              <h5 className="text-muted">No tienes notificaciones</h5>
              <p className="text-muted small">Te avisaremos cuando haya novedades importantes.</p>
            </div>
          )}
        </ListGroup>
      </Card>
    </Container>
  );
};

export default Notificaciones;
