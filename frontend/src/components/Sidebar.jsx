/**
 * BANCOSOL - Sidebar Component
 * Menú lateral con navegación por rol
 */

import { Nav } from 'react-bootstrap';
import { NavLink, useLocation } from 'react-router-dom';
import { BiGroup, BiCreditCard, BiMoney, BiLineChart, BiFile, BiShield, BiUserPlus } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { usuario, tieneRol } = useAuth();

  // Determinar ítems del menú según rol
  const menuItems = [];

  // Dashboard (todos)
  menuItems.push({
    path: '/dashboard',
    label: 'Dashboard',
    icon: <BiLineChart size={20} />
  });

  switch (usuario?.rol) {
    case 'admin':
      menuItems.push(
        { path: '/clientes', label: 'Clientes', icon: <BiGroup size={20} /> },
        { path: '/creditos/crear', label: 'Crear Crédito', icon: <BiCreditCard size={20} /> },
        { path: '/creditos', label: 'Lista Créditos', icon: <BiMoney size={20} /> },
        { path: '/caja/cierre', label: 'Cierre de Caja', icon: <BiShield size={20} /> },
        { path: '/reportes', label: 'Reportes', icon: <BiLineChart size={20} /> },
        { path: '/auditoria', label: 'Auditoría', icon: <BiShield size={20} /> },
        { path: '/usuarios', label: 'Usuarios', icon: <BiUserPlus size={20} /> }
      );
      break;

    case 'gerente':
      menuItems.push(
        { path: '/clientes', label: 'Clientes', icon: <BiGroup size={20} /> },
        { path: '/creditos', label: 'Créditos', icon: <BiMoney size={20} /> },
        { path: '/caja/cierre', label: 'Cierre de Caja', icon: <BiShield size={20} /> },
        { path: '/reportes', label: 'Reportes', icon: <BiLineChart size={20} /> },
        { path: '/auditoria', label: 'Auditoría', icon: <BiShield size={20} /> }
      );
      break;

    case 'analista':
      menuItems.push(
        { path: '/clientes', label: 'Clientes', icon: <BiGroup size={20} /> },
        { path: '/creditos', label: 'Créditos', icon: <BiMoney size={20} /> },
        { path: '/reportes', label: 'Reportes', icon: <BiLineChart size={20} /> }
      );
      break;

    case 'oficial_credito':
      menuItems.push(
        { path: '/clientes', label: 'Clientes', icon: <BiGroup size={20} /> },
        { path: '/creditos/crear', label: 'Crear Crédito', icon: <BiCreditCard size={20} /> },
        { path: '/creditos', label: 'Mis Créditos', icon: <BiMoney size={20} /> }
      );
      break;

    default:
      break;
  }

  return (
    <Nav
      className="sidebar-menu flex-column"
      activeKey={location.pathname}
      as="ul"
    >
      {menuItems.map((item, idx) => (
        <Nav.Item as="li" key={idx} className="mb-1">
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`
            }
          >
            <span className="me-3">{item.icon}</span>
            {item.label}
          </NavLink>
        </Nav.Item>
      ))}
    </Nav>
  );
};

export default Sidebar;
