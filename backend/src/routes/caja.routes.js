/**
 * BANCOSOL - Routes: Caja
 */

const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/caja.controller');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditoria } = require('../middleware/auditoria');

router.use(authMiddleware);

// GET /api/caja/resumen
router.get('/resumen', authorize(['gerente', 'admin']), cajaController.obtenerResumenCierre);

// POST /api/caja/cierre
router.post('/cierre', authorize(['gerente', 'admin']), auditoria('caja', 'CIERRE'), cajaController.ejecutarCierre);

module.exports = router;
