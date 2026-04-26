/**
 * BANCOSOL - Explorador de Cartera (Lista de Créditos)
 * Interfaz premium con filtros dinámicos y exportación normativa
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import {
  Container, Row, Col, Card, Table, Form, Button, Badge, Pagination, Spinner, InputGroup
} from 'react-bootstrap';
import { BiFilter, BiDownload, BiSearch, BiChevronRight, BiCalendarAlt } from 'react-icons/bi';

const ListaCreditos = () => {
  const navigate = useNavigate();
  const [creditos, setCreditos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [paginacion, setPaginacion] = useState({
    page: 1, limit: 10, total: 0, totalPages: 0
  });

  const [filtros, setFiltros] = useState({
    estado: '',
    oficial_id: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  const [oficiales, setOficiales] = useState([]);

  useEffect(() => {
    cargarOficiales();
  }, []);

  useEffect(() => {
    cargarCreditos();
  }, [filtros, paginacion.page, paginacion.limit]);

  const cargarOficiales = async () => {
    try {
      const res = await axios.get('/usuarios/oficiales');
      setOficiales(res.data || []);
    } catch (err) {
      console.error('Error cargando oficiales:', err);
    }
  };

  const cargarCreditos = async () => {
    setCargando(true);
    try {
      const params = { page: paginacion.page, limit: paginacion.limit };
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== '') params[key] = filtros[key];
      });

      const res = await axios.get('/creditos', { params });
      // Backend: { success: true, data: { creditos: [], paginacion: {} } }
      setCreditos(res.data?.creditos || []);
      setPaginacion(prev => ({
        ...prev,
        total: res.data?.paginacion?.total || 0,
        totalPages: res.data?.paginacion?.totalPages || 0
      }));
    } catch (err) {
      console.error('Error en carga de cartera:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
    setPaginacion(prev => ({ ...prev, page: 1 }));
  };

  const exportarCSV = () => {
    const headers = ['Operación','Cliente','Oficial','Monto (Bs)','Estado','Fecha de Registro'];
    const rows = creditos.map(c => [
      c.numero_credito,
      `${c.cliente?.nombre} ${c.cliente?.apellido}`,
      c.oficial?.nombre,
      c.monto,
      c.estado,
      c.created_at ? new Date(c.created_at).toLocaleDateString('es-BO') : '-'
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CARTERA_BANCOSOL_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="fade-in px-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-5 mt-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Explorador de Cartera</h2>
          <p className="text-muted small">Gestión y control de operaciones de crédito vigentes</p>
        </div>
        <Button variant="light" className="border shadow-sm px-4 py-2 fw-bold" onClick={exportarCSV}>
          <BiDownload className="me-2" /> Descargar Reporte CSV
        </Button>
      </div>

      {/* Panel de Filtros Premium */}
      <Card className="border-0 shadow-sm mb-5 p-2 rounded-4">
        <Card.Body>
          <Row className="g-3 align-items-center">
            <Col md={3}>
              <div className="small fw-bold text-muted mb-2 ms-1">Estado de Operación</div>
              <Form.Select className="bg-light border-0 py-2 shadow-none" name="estado" value={filtros.estado} onChange={handleFiltroChange}>
                <option value="">Cualquier estado</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="activo">Activo</option>
                <option value="en_mora">En Mora</option>
                <option value="al_dia">Al Día</option>
                <option value="cancelado">Cancelado</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="small fw-bold text-muted mb-2 ms-1">Oficial Responsable</div>
              <Form.Select className="bg-light border-0 py-2 shadow-none" name="oficial_id" value={filtros.oficial_id} onChange={handleFiltroChange}>
                <option value="">Todos los oficiales</option>
                {oficiales.map(of => <option key={of.id} value={of.id}>{of.nombre}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="small fw-bold text-muted mb-2 ms-1">Desde (Fecha)</div>
              <Form.Control type="date" className="bg-light border-0 py-2 shadow-none" name="fecha_desde" value={filtros.fecha_desde} onChange={handleFiltroChange} />
            </Col>
            <Col md={3}>
              <div className="small fw-bold text-muted mb-2 ms-1">Hasta (Fecha)</div>
              <Form.Control type="date" className="bg-light border-0 py-2 shadow-none" name="fecha_hasta" value={filtros.fecha_hasta} onChange={handleFiltroChange} />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de Cartera */}
      <Card className="border-0 shadow-sm overflow-hidden rounded-4">
        <Card.Body className="p-0">
          {cargando ? (
            <div className="center-spinner"><Spinner animation="border" variant="primary" /></div>
          ) : creditos.length === 0 ? (
            <div className="text-center py-5">
               <BiSearch size={48} className="text-muted opacity-25 mb-3" />
               <p className="text-muted">No se encontraron operaciones con los filtros aplicados.</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr className="text-muted small">
                  <th className="px-4 py-3">OPERACIÓN</th>
                  <th className="py-3">CLIENTE</th>
                  <th className="py-3">OFICIAL</th>
                  <th className="py-3">MONTO (BS)</th>
                  <th className="py-3">ESTADO</th>
                  <th className="py-3">REGISTRO</th>
                  <th className="text-center py-3">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="small">
                {creditos.map((credito) => (
                  <tr key={credito.id}>
                    <td className="px-4 fw-bold"><code>{credito.numero_credito}</code></td>
                    <td>
                      <div className="fw-bold text-dark">{credito.cliente?.nombre} {credito.cliente?.apellido}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>CI: {credito.cliente?.ci}</div>
                    </td>
                    <td>{credito.oficial?.nombre}</td>
                    <td>
                      <div className="fw-bold text-dark">Bs. {parseFloat(credito.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td>
                      <Badge bg={getEstadoColor(credito.estado)} className="fw-normal bg-opacity-10 text-dark border" style={{ border: `1px solid ${getEstadoColor(credito.estado)}` }}>
                        {credito.estado.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <div className="text-dark">{credito.created_at ? new Date(credito.created_at).toLocaleDateString('es-BO') : '-'}</div>
                    </td>
                    <td className="text-center">
                      <Button variant="primary" size="sm" className="rounded-3 px-3 shadow-sm border-0" onClick={() => navigate(`/creditos/${credito.id}`)}>
                        Detalle <BiChevronRight />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Paginación Minimalista */}
      {paginacion.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-5 mb-5">
           <Pagination className="shadow-sm">
             <Pagination.Prev disabled={paginacion.page === 1} onClick={() => setPaginacion(p => ({ ...p, page: p.page - 1 }))} />
             {Array.from({ length: paginacion.totalPages }, (_, i) => i + 1).map(pag => (
               <Pagination.Item key={pag} active={pag === paginacion.page} onClick={() => setPaginacion(p => ({ ...p, page: pag }))}>
                 {pag}
               </Pagination.Item>
             ))}
             <Pagination.Next disabled={paginacion.page === paginacion.totalPages} onClick={() => setPaginacion(p => ({ ...p, page: p.page + 1 }))} />
           </Pagination>
        </div>
      )}
    </div>
  );
};

const getEstadoColor = (estado) => {
  const map = { pendiente: '#ffc107', aprobado: '#198754', activo: '#0d6efd', al_dia: '#198754', en_mora: '#dc3545', cancelado: '#6c757d', rechazado: '#dc3545' };
  return map[estado] || '#6c757d';
};

export default ListaCreditos;
