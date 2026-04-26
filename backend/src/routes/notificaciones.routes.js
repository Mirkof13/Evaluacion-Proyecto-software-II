const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificaciones.controller');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, notificacionesController.listar);
router.put('/:id/leer', authMiddleware, notificacionesController.marcarLeida);
router.post('/leer-todas', authMiddleware, notificacionesController.marcarTodasLeidas);

module.exports = router;
