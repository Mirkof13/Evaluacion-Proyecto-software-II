/**
 * BANCOSOL - LoadingSpinner Component
 * Indicador de carga unificado
 */

import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ variant = 'primary', size = 'sm', text = 'Cargando...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <Spinner variant={variant} size={size} />
      {text && <span className="ms-2">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
