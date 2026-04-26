/**
 * BANCOSOL - Registro de Operación de Crédito
 * Wizard Minimalista con Validaciones y Cálculo de Cuota
 */

import { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
  Container, Row, Col, Card, Form, Button, Spinner, Alert, InputGroup, ListGroup
} from 'react-bootstrap';
import { BiSearch, BiCheckCircle, BiArrowBack, BiChevronRight, BiDollarCircle } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CrearCredito = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Paso 1: búsqueda de cliente
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Paso 2: datos del crédito
  const [formCredito, setFormCredito] = useState({
    monto: '',
    tasa_interes: '12',
    plazo_meses: '12',
    destino: '',
    garantia: ''
  });

  const [cuotaEstimada, setCuotaEstimada] = useState(null);

  useEffect(() => {
    const buscarClientes = async () => {
      if (busquedaCliente.length < 3 || (clienteSeleccionado && busquedaCliente.includes(clienteSeleccionado.ci))) {
        setClientesEncontrados([]);
        return;
      }
      try {
        const res = await axios.get(`/clientes?busqueda=${busquedaCliente}&limit=5`);
        setClientesEncontrados(res.data?.clientes || []);
      } catch (err) {
        console.error('Error buscando clientes:', err);
      }
    };
    const timer = setTimeout(buscarClientes, 300);
    return () => clearTimeout(timer);
  }, [busquedaCliente]);

  useEffect(() => {
    if (formCredito.monto && formCredito.tasa_interes && formCredito.plazo_meses) {
      const monto = parseFloat(formCredito.monto);
      const tasa = (parseFloat(formCredito.tasa_interes) / 100) / 12; // mensual
      const plazo = parseInt(formCredito.plazo_meses);

      if (monto > 0 && tasa > 0 && plazo > 0) {
        const cuota = (monto * tasa) / (1 - Math.pow(1 + tasa, -plazo));
        setCuotaEstimada(cuota);
      }
    } else {
      setCuotaEstimada(null);
    }
  }, [formCredito]);

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente(`${cliente.nombre} ${cliente.apellido} (${cliente.ci})`);
    setClientesEncontrados([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await axios.post('/creditos', {
        cliente_id: clienteSeleccionado.id,
        oficial_id: usuario.id,
        monto: parseFloat(formCredito.monto),
        tasa_interes: parseFloat(formCredito.tasa_interes) / 100,
        plazo_meses: parseInt(formCredito.plazo_meses),
        destino: formCredito.destino,
        garantia: formCredito.garantia
      });

      setSuccess('Operación registrada exitosamente');
      setTimeout(() => navigate('/creditos'), 1500);
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fade-in px-3">
      <div className="mb-5 mt-3">
        <h2 className="fw-bold text-dark mb-1">Registro de Operación</h2>
        <p className="text-muted small">Apertura de nuevo crédito en cartera</p>
      </div>

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm border-0 overflow-hidden mb-4">
            <div className="bg-primary p-1"></div>
            <Card.Body className="p-4 p-md-5">
              
              <div className="d-flex justify-content-between mb-5">
                <div className={`text-center flex-grow-1 ${paso >= 1 ? 'text-primary' : 'text-muted'}`}>
                  <div className={`mx-auto mb-2 rounded-circle d-flex align-items-center justify-content-center ${paso >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '32px', height: '32px' }}>1</div>
                  <small className="fw-bold">Vinculación</small>
                </div>
                <div className="flex-grow-1 border-bottom mb-4 mx-3"></div>
                <div className={`text-center flex-grow-1 ${paso >= 2 ? 'text-primary' : 'text-muted'}`}>
                  <div className={`mx-auto mb-2 rounded-circle d-flex align-items-center justify-content-center ${paso >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '32px', height: '32px' }}>2</div>
                  <small className="fw-bold">Configuración</small>
                </div>
              </div>

              {error && <Alert variant="danger" className="border-0 bg-danger bg-opacity-10 text-danger small mb-4">{error}</Alert>}
              {success && <Alert variant="success" className="border-0 bg-success bg-opacity-10 text-success small mb-4">{success}</Alert>}

              {paso === 1 && (
                <div className="fade-in">
                  <h5 className="fw-bold text-dark mb-4">Seleccionar Cliente</h5>
                  <Form.Group className="mb-4">
                    <InputGroup className="bg-light p-1 rounded-3">
                      <InputGroup.Text className="bg-transparent border-0 text-muted"><BiSearch /></InputGroup.Text>
                      <Form.Control 
                        className="bg-transparent border-0 shadow-none"
                        placeholder="Buscar por CI o nombre..." 
                        value={busquedaCliente}
                        onChange={(e) => setBusquedaCliente(e.target.value)}
                      />
                    </InputGroup>
                    {clientesEncontrados.length > 0 && (
                      <ListGroup className="position-absolute w-100 shadow-sm mt-1 z-index-modal border-0 rounded-3 overflow-hidden">
                        {clientesEncontrados.map(cli => (
                          <ListGroup.Item 
                            key={cli.id} 
                            action 
                            onClick={() => seleccionarCliente(cli)}
                            className="border-0 py-3"
                          >
                            <div className="fw-bold small">{cli.nombre} {cli.apellido}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>CI: {cli.ci}</div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </Form.Group>

                  {clienteSeleccionado && (
                    <Card className="bg-light border-0 mb-5 rounded-4">
                      <Card.Body className="p-4 d-flex align-items-center">
                        <div className="bg-white p-3 rounded-circle me-3 text-primary shadow-sm">
                          <BiCheckCircle size={24} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</div>
                          <div className="text-muted small">Vínculo verificado para CI {clienteSeleccionado.ci}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  <div className="text-end">
                    <Button 
                      variant="primary" 
                      className="px-5 py-2 rounded-3 shadow-sm" 
                      disabled={!clienteSeleccionado}
                      onClick={() => setPaso(2)}
                    >
                      Continuar <BiChevronRight size={20} />
                    </Button>
                  </div>
                </div>
              )}

              {paso === 2 && (
                <Form onSubmit={handleSubmit} className="fade-in">
                  <div className="d-flex align-items-center mb-4">
                    <Button variant="link" className="p-0 text-muted text-decoration-none me-3" onClick={() => setPaso(1)}>
                      <BiArrowBack size={20} />
                    </Button>
                    <h5 className="fw-bold text-dark mb-0">Detalles de Operación</h5>
                  </div>

                  <Row className="g-4 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted fw-bold">Monto del Crédito (Bs.)</Form.Label>
                        <Form.Control 
                          className="bg-light border-0 py-3 px-4 shadow-none"
                          type="number" 
                          placeholder="0.00"
                          value={formCredito.monto}
                          onChange={(e) => setFormCredito({...formCredito, monto: e.target.value})}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted fw-bold">Tasa Anual (%)</Form.Label>
                        <Form.Control 
                          className="bg-light border-0 py-3 px-4 shadow-none"
                          type="number" 
                          value={formCredito.tasa_interes}
                          onChange={(e) => setFormCredito({...formCredito, tasa_interes: e.target.value})}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted fw-bold">Plazo (Meses)</Form.Label>
                        <Form.Control 
                          className="bg-light border-0 py-3 px-4 shadow-none"
                          type="number" 
                          value={formCredito.plazo_meses}
                          onChange={(e) => setFormCredito({...formCredito, plazo_meses: e.target.value})}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted fw-bold">Destino de Fondos</Form.Label>
                        <Form.Select 
                          className="bg-light border-0 py-3 px-4 shadow-none"
                          value={formCredito.destino}
                          onChange={(e) => setFormCredito({...formCredito, destino: e.target.value})}
                          required
                        >
                          <option value="">Seleccionar...</option>
                          <option value="Consumo">Consumo</option>
                          <option value="Vivienda">Vivienda</option>
                          <option value="Capital de Trabajo">Capital de Trabajo</option>
                          <option value="Inversión">Inversión</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-5">
                    <Form.Label className="small text-muted fw-bold">Detalle de Garantía</Form.Label>
                    <Form.Control 
                      className="bg-light border-0 py-3 px-4 shadow-none"
                      type="text" 
                      placeholder="Ej. Hipotecaria, Personal, etc."
                      value={formCredito.garantia}
                      onChange={(e) => setFormCredito({...formCredito, garantia: e.target.value})}
                    />
                  </Form.Group>

                  {cuotaEstimada && (
                    <div className="bg-light p-4 rounded-4 mb-5 border-start border-success border-4 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-muted small fw-bold">Cuota Mensual Estimada</div>
                        <h4 className="fw-bold mb-0 text-dark">Bs. {cuotaEstimada.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</h4>
                      </div>
                      <BiDollarCircle className="text-success opacity-50" size={40} />
                    </div>
                  )}

                  <div className="d-flex justify-content-end gap-3">
                    <Button 
                      variant="outline-secondary" 
                      className="px-5 border-0 bg-light text-dark" 
                      onClick={() => setPaso(1)}
                    >
                      Atrás
                    </Button>
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="px-5 py-2 rounded-3 shadow-sm" 
                      disabled={cargando}
                    >
                      {cargando ? 'Procesando...' : 'Registrar Operación'}
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CrearCredito;
