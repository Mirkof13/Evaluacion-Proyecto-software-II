/**
 * BANCOSOL - AlertMessage Component
 * Mensajes de alerta estilizados
 */

import { Alert, Button } from 'react-bootstrap';

const AlertMessage = ({ type = 'danger', message, onClose, dismissible = true }) => {
  return (
    <Alert
      variant={type}
      className="mb-3"
      dismissible={dismissible}
      onClose={onClose}
    >
      {message}
    </Alert>
  );
};

export default AlertMessage;
