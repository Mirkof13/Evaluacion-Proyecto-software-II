/**
 * BANCOSOL - Routes: Pagos
 * Registro y consulta de pagos
 */

const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagos.controller');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditoria } = require('../middleware/auditoria');

router.use(authMiddleware);

// GET /api/pagos/:id - Historial
router.get('/:id', authorize(['oficial_credito', 'analista', 'gerente', 'admin']), pagosController.historial);

// POST /api/pagos/:id - Registrar pago
router.post('/:id', authorize(['oficial_credito', 'admin']), auditoria('pagos', 'PAGO'), pagosController.registrar);

// GET /api/pagos/:id/proxima - Próxima cuota
router.get('/:id/proxima', authorize(['oficial_credito', 'admin']), pagosController.proximaCuota);

module.exports = router;
