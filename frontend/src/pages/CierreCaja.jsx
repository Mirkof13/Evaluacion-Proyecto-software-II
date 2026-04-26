/**
 * BANCOSOL - Cierre de Caja
 * Conciliación diaria de ingresos
 */

import { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Container, Row, Col, Card, Table, Button, Spinner, Alert, Badge, Form } from 'react-bootstrap';
import { BiLock, BiPrinter, BiCheckDouble } from 'react-icons/bi';

const CierreCaja = () => {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [montoFisico, setMontoFisico] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarResumen();
  }, []);

  const cargarResumen = async () => {
    try {
      const res = await axios.get('/caja/resumen');
      // res es el body por el interceptor
      const data = res.data || res;
      setResumen(data);
    } catch (err) {
      setError('Error al obtener datos de caja');
    } finally {
      setCargando(false);
    }
  };

  const handleCierre = async (e) => {
    e.preventDefault();
    setProcesando(true);
    try {
      await axios.post('/caja/cierre', { 
        montoFisico: parseFloat(montoFisico),
        totalTeorico: resumen.totalCobrado,
        desglose: resumen.desglose
      });
      alert('Cierre de caja realizado con éxito');
      cargarResumen();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) return <div className="center-spinner"><Spinner animation="border" /></div>;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Cierre de Operaciones Diarias</h2>
        <Button variant="outline-dark" onClick={() => window.print()}><BiPrinter /> Imprimir Reporte</Button>
      </div>

      <Row>
        <Col md={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3 fw-bold">Detalle de Cobros del Día</Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Hora</th>
                    <th>N° Crédito</th>
                    <th>Oficial</th>
                    <th className="text-end">Monto Cobrado</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen?.detalle?.length > 0 ? resumen.detalle.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.fecha_pago).toLocaleTimeString()}</td>
                      <td><code>{p.credito_id}</code></td>
                      <td>{p.usuario?.nombre}</td>
                      <td className="text-end fw-bold">Bs. {parseFloat(p.monto_pagado).toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="text-center py-4 text-muted">No se registran cobros hoy</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm mb-4 bg-primary text-white">
            <Card.Body className="p-4">
              <h6 className="small text-uppercase">Arqueo Teórico</h6>
              <h2 className="fw-bold mb-0">Bs. {resumen?.totalCobrado?.toFixed(2) || '0.00'}</h2>
              <hr />
              <div className="small d-flex justify-content-between mb-1">
                <span>Capital:</span>
                <span>Bs. {resumen?.desglose?.capital?.toFixed(2)}</span>
              </div>
              <div className="small d-flex justify-content-between mb-1">
                <span>Interés:</span>
                <span>Bs. {resumen?.desglose?.interes?.toFixed(2)}</span>
              </div>
              <div className="small d-flex justify-content-between">
                <span>Mora:</span>
                <span>Bs. {resumen?.desglose?.mora?.toFixed(2)}</span>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">Ejecutar Conciliación</h6>
              <Form onSubmit={handleCierre}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Efectivo Físico en Bóveda</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    required 
                    value={montoFisico}
                    onChange={(e) => setMontoFisico(e.target.value)}
                  />
                </Form.Group>
                <Button variant="dark" className="w-100 py-2 d-flex align-items-center justify-content-center" type="submit" disabled={procesando}>
                  <BiLock className="me-2" /> {procesando ? 'Procesando...' : 'Cerrar Gestión Diaria'}
                </Button>
              </Form>
              <div className="mt-3 small text-center text-muted">
                <BiCheckDouble className="text-success" /> Al cerrar, los registros del día se bloquean para auditoría.
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CierreCaja;
