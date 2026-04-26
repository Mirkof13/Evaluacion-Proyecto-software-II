/**
 * BANCOSOL - Routes: Clientes
 * CRUD de clientes
 * Permisos: oficial_credito (create, read, update), admin (all), gerente/analista (read)
 */

const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditoria } = require('../middleware/auditoria');

// Todas requieren autenticación
router.use(authMiddleware);

// GET /api/clientes - Lectura (oficial+, analista, gerente, admin)
router.get('/', authorize(['oficial_credito', 'analista', 'gerente', 'admin']), clientesController.listar);

// GET /api/clientes/:id - Lectura individual
router.get('/:id', authorize(['oficial_credito', 'analista', 'gerente', 'admin']), clientesController.obtener);

// POST /api/clientes - Crear (oficial+, admin)
router.post('/', authorize(['oficial_credito', 'admin']), auditoria('clientes', 'CLIENTE'), clientesController.crear);

// PUT /api/clientes/:id - Actualizar (oficial+, admin)
router.put('/:id', authorize(['oficial_credito', 'admin']), auditoria('clientes', 'CLIENTE'), clientesController.actualizar);

module.exports = router;
