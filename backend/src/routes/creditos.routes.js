/**
 * BANCOSOL - Routes: Créditos
 * Gestión de créditos y amortizaciones
 */

const express = require('express');
const router = express.Router();
const creditosController = require('../controllers/creditos.controller');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditoria } = require('../middleware/auditoria');

router.use(authMiddleware);

// GET /api/creditos - Listar (oficial solo los suyos, otros ven todos)
router.get('/', authorize(['oficial_credito', 'analista', 'gerente', 'admin']), creditosController.listar);

// POST /api/creditos - Crear (oficial+, admin)
router.post('/', authorize(['oficial_credito', 'admin']), auditoria('creditos', 'CREDITO'), creditosController.crear);

// GET /api/creditos/:id - Detalle completo
router.get('/:id', authorize(['oficial_credito', 'analista', 'gerente', 'admin']), creditosController.obtener);

// PUT /api/creditos/:id/estado - Cambiar estado (analista+, admin)
router.put('/:id/estado', authorize(['analista', 'gerente', 'admin']), auditoria('creditos', 'ESTADO'), creditosController.cambiarEstado);

// POST /api/creditos/:id/documentos - Subir documentos (oficial, admin)
const upload = require('../middleware/upload');
const documentosController = require('../controllers/documentos.controller');
router.post('/:id/documentos', authorize(['oficial_credito', 'admin']), upload.single('archivo'), auditoria('creditos', 'UPLOAD'), documentosController.subirDocumentoCredito);

module.exports = router;
