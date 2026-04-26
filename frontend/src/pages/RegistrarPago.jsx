/**
 * BANCOSOL - Registro de Recaudación (Pagos)
 * Interfaz premium para procesamiento de cobros de cartera
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import {
  Container, Row, Col, Card, Form, Button, Spinner, Alert, Badge
} from 'react-bootstrap';
import { BiChevronLeft, BiDollarCircle, BiCalendar, BiCheckShield, BiReceipt } from 'react-icons/bi';

const RegistrarPago = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credito, setCredito] = useState(null);
  const [proximaCuota, setProximaCuota] = useState(null);
  const [montoPagado, setMontoPagado] = useState('');
  const [observacion, setObservacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setCargandoDatos(true);
      const res = await axios.get(`/creditos/${id}`);
      // Backend: { success: true, data: creditoCompleto }
      setCredito(res.data.data);

      const pagoRes = await axios.get(`/pagos/${id}/proxima`);
      // Backend: { success: true, data: { proximaCuota: {...} } }
      const cuota = pagoRes.data?.data?.proximaCuota;
      setProximaCuota(cuota);

      if (cuota) {
        setMontoPagado(cuota.totalApagar.toFixed(2));
      }
    } catch (err) {
      setError(err.response?.status === 404 
        ? 'La operación de crédito no fue localizada.' 
        : 'Error de comunicación con el núcleo financiero.');
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      await axios.post(`/pagos/${id}`, {
        monto_pagado: parseFloat(montoPagado),
        observacion
      });

      setSuccess('Transacción de pago procesada correctamente');
      setTimeout(() => navigate(`/creditos/${id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la recaudación');
    } finally {
      setCargando(false);
    }
  };

  if (cargandoDatos) return <div className="center-spinner"><Spinner animation="border" /></div>;

  if (error && !credito) {
    return (
      <Container className="py-5 text-center fade-in">
        <Alert variant="danger" className="border-0 shadow-sm p-5 rounded-4">
          <h4 className="fw-bold mb-3">{error}</h4>
          <Button as={Link} to="/creditos" variant="primary" className="mt-3 px-4">
            <BiChevronLeft /> Volver a Lista
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="fade-in px-3 pb-5">
      <div className="d-flex align-items-center mb-5 mt-3">
        <Button as={Link} to={`/creditos/${id}`} variant="link" className="p-0 me-3 text-dark">
          <BiChevronLeft size={24} />
        </Button>
        <div>
          <h2 className="fw-bold text-dark mb-0">Procesar Recaudación</h2>
          <p className="text-muted small mb-0">Crédito {credito?.numero_credito} - {credito?.cliente?.nombre} {credito?.cliente?.apellido}</p>
        </div>
      </div>

      {success && <Alert variant="success" className="border-0 shadow-sm mb-4 py-3 fade-in">{success}</Alert>}
      {error && <Alert variant="danger" className="border-0 shadow-sm mb-4 py-3 fade-in">{error}</Alert>}

      <Row className="g-4">
        <Col lg={5}>
          <Card className="border-0 shadow-sm overflow-hidden mb-4 h-100">
            <div className="bg-primary p-1"></div>
            <Card.Body className="p-4 p-md-5">
              <h5 className="fw-bold text-dark mb-4 d-flex align-items-center">
                <BiReceipt className="me-2 text-primary" /> Detalle de Cuota #{proximaCuota?.numeroCuota || '-'}
              </h5>

              <div className="bg-light p-4 rounded-4 mb-4 border border-white shadow-sm">
                 <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted small fw-bold">FECHA DE VENCIMIENTO</span>
                    <Badge bg="white" className="text-dark border px-3 py-2 fw-normal">
                      <BiCalendar className="me-1 text-primary" /> 
                      {proximaCuota?.fechaVencimiento ? new Date(proximaCuota.fechaVencimiento + 'T12:00:00').toLocaleDateString('es-BO') : '-'}
                    </Badge>
                 </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Capital</span>
                  <span className="fw-bold text-dark">Bs. {proximaCuota?.capital?.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Interés Formulario</span>
                  <span className="fw-bold text-dark">Bs. {proximaCuota?.interes?.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                </div>
                {proximaCuota?.mora > 0 && (
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-danger fw-bold">Interés por Mora</span>
                    <span className="fw-bold text-danger">Bs. {proximaCuota?.mora?.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              <div className="border-top pt-4 text-center">
                <small className="text-muted d-block text-uppercase fw-bold ls-1" style={{ fontSize: '0.65rem' }}>Monto Total Exigible</small>
                <h2 className="fw-bold text-dark mt-1 mb-0">{proximaCuota?.totalApagar?.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bolivianos</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4 p-md-5">
              <h5 className="fw-bold text-dark mb-4">Registro de Pago en Ventanilla</h5>
              <Form onSubmit={handleSubmit}>
                <Row className="g-4 mb-4">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small text-muted fw-bold">Monto Recibido (Bs.)</Form.Label>
                      <div className="position-relative">
                        <BiDollarCircle className="position-absolute top-50 translate-middle-y ms-3 text-muted" size={20} />
                        <Form.Control 
                          className="bg-light border-0 py-3 ps-5 fs-5 fw-bold shadow-none rounded-4"
                          type="number" 
                          step="0.01"
                          value={montoPagado}
                          onChange={(e) => setMontoPagado(e.target.value)}
                          required
                        />
                      </div>
                      <Form.Text className="text-muted small">
                        * Ingrese el monto exacto o superior para abono a capital.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-5">
                  <Form.Label className="small text-muted fw-bold">Observación Técnica</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4} 
                    className="bg-light border-0 py-3 px-4 shadow-none rounded-4"
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder="Detalles del depósito, nro. de comprobante físico, etc."
                  />
                </Form.Group>

                <div className="bg-light p-4 rounded-4 mb-5 d-flex align-items-center">
                  <BiCheckShield className="text-success me-3" size={32} />
                  <div>
                    <div className="fw-bold text-dark small">Transacción Segura</div>
                    <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Esta operación generará un log de auditoría inmutable vinculado a su usuario.</div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-3">
                  <Button 
                    variant="light" 
                    className="px-5 py-3 border-0 bg-light text-dark fw-bold rounded-4" 
                    onClick={() => navigate(`/creditos/${id}`)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="px-5 py-3 rounded-4 shadow-sm fw-bold" 
                    disabled={cargando || parseFloat(montoPagado) <= 0}
                  >
                    {cargando ? 'Procesando...' : 'Confirmar Transacción'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RegistrarPago;
