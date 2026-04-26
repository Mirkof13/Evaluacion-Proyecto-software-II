/**
 * BANCOSOL - Navbar Minimalista
 * Integrada con el sistema de diseño premium
 */

import { useEffect, useState } from 'react';
import { Navbar as BSNavbar, Nav, Button, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { BiLogOut, BiUser, BiBell, BiChevronDown } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { usuario, logout } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);

   useEffect(() => {
     const fetchNotif = async () => {
       try {
        const res = await axios.get('/notificaciones');
         // interceptor devuelve body: { success, data: [...] }, res.data es el array
         const lista = Array.isArray(res.data) ? res.data : (res.data || []);
         setNotificaciones(lista.filter(n => !n.leida).slice(0, 5));
       } catch (err) {
         console.error(err);
       }
     };
     if (usuario) fetchNotif();
   }, [usuario]);

  return (
    <BSNavbar bg="white" className="navbar border-0" expand="lg">
      <div className="container-fluid px-0">
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* Indicador de Conexión en Vivo */}
            <div className="d-flex align-items-center me-4 d-none d-lg-flex">
              <span className="pulse-dot me-2"></span>
              <span className="text-muted small fw-bold uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                Sistema Conectado
              </span>
            </div>

            <div className="d-flex align-items-center me-3 text-end d-none d-md-block">
              <div className="fw-bold text-dark small" style={{ lineHeight: '1.2' }}>{usuario?.nombre}</div>
              <div className="text-muted small" style={{ fontSize: '0.7rem' }}>{usuario?.rol?.toUpperCase()}</div>
            </div>

            <Dropdown align="end" className="me-3">
              <Dropdown.Toggle variant="light" className="border-0 bg-transparent shadow-none p-0 position-relative">
                <div className="text-muted p-2">
                   <BiBell size={22} />
                   {notificaciones.length > 0 && (
                     <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                       {notificaciones.length}
                     </span>
                   )}
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-0 mt-3 p-0 overflow-hidden" style={{ width: '300px' }}>
                <div className="bg-light p-3 border-bottom d-flex justify-content-between align-items-center">
                  <span className="fw-bold small">Notificaciones</span>
                  <span className="badge bg-primary rounded-pill small">Nuevas</span>
                </div>
                <div className="max-h-300 overflow-auto">
                  {notificaciones.length > 0 ? notificaciones.map(n => (
                    <Dropdown.Item key={n.id} as={Link} to={n.vinculo_url || '/notificaciones'} className="p-3 border-bottom">
                      <div className={`fw-bold small ${n.tipo === 'danger' ? 'text-danger' : 'text-primary'}`}>
                        {n.tipo === 'danger' ? '⚠️' : '🔔'} {n.titulo}
                      </div>
                      <div className="small text-muted text-wrap" style={{ maxWidth: '250px' }}>{n.mensaje}</div>
                    </Dropdown.Item>
                  )) : (
                    <div className="p-4 text-center small text-muted italic">No hay alertas nuevas</div>
                  )}
                </div>
                <div className="p-2 text-center bg-light border-top">
                  <Link to="/notificaciones" className="small text-decoration-none text-primary fw-bold">Ver todas las alertas</Link>
                </div>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown align="end">
              <Dropdown.Toggle variant="light" className="border-0 bg-transparent shadow-none p-0">
                <div className="bg-light p-2 rounded-circle text-primary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                   <BiUser size={20} />
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow-sm border-0 mt-2">
                <Dropdown.Header className="small fw-bold">Cuenta de Usuario</Dropdown.Header>
                <Dropdown.Item className="small py-2 text-muted" onClick={() => {}}>Configuración</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={logout} className="text-danger small py-2 d-flex align-items-center">
                  <BiLogOut className="me-2" /> Cerrar Sesión
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </BSNavbar.Collapse>
      </div>
    </BSNavbar>
  );
};

export default Navbar;
