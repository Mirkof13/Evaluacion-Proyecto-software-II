/**
 * BANCOSOL - Routes: Autenticación
 * Rutas públicas (no requieren JWT para login/logout)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

const { auditoria } = require('../middleware/auditoria');

// POST /api/auth/login - Público
router.post('/login', auditoria('usuarios', 'LOGIN'), authController.login);

// POST /api/auth/logout - Público (elimina token en frontend)
router.post('/logout', auditoria('usuarios', 'LOGOUT'), authController.logout);

// GET /api/auth/me - Protegido
router.get('/me', require('../middleware/auth').authMiddleware, authController.perfil);

module.exports = router;
