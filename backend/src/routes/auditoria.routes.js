/**
 * BANCOSOL - Routes: Auditoría
 * Bitácora forense
 * Acceso: gerente, admin
 */

const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoria.controller');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(authMiddleware);
router.use(authorize(['gerente', 'admin']));

// GET /api/auditoria - Listar logs
router.get('/', auditoriaController.listar);

// GET /api/auditoria/:id - Detalle log con diff
router.get('/:id', auditoriaController.obtener);

module.exports = router;
