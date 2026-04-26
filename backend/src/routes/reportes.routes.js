/**
 * BANCOSOL - Routes: Reportes
 * Reportes gerenciales
 * Acceso: gerente, admin
 */

const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(authMiddleware);
router.use(authorize(['gerente', 'admin']));

// GET /api/reportes/cartera
router.get('/cartera', reportesController.cartera);

// GET /api/reportes/morosidad
router.get('/morosidad', reportesController.morosidad);

// GET /api/reportes/recuperaciones
router.get('/recuperaciones', reportesController.recuperaciones);

// GET /api/reportes/mineria
router.get('/mineria', reportesController.mineria);

// GET /api/reportes/asfi
router.get('/asfi', reportesController.asfi);

// GET /api/reportes/seguridad
router.get('/seguridad', reportesController.seguridad);

// GET /api/reportes/alertas
router.get('/alertas', reportesController.alertas);

// GET /api/reportes/exportar/cartera
router.get('/exportar/cartera', reportesController.exportarCartera);

module.exports = router;
