/**
 * BANCOSOL - Routes: Usuarios
 * CRUD de usuarios (solo admin)
 */

const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditoria } = require('../middleware/auditoria');
const { Rol } = require('../models');

router.use(authMiddleware);

// GET /api/usuarios/roles - Listar roles (para dropdown) - Público autenticado
router.get('/roles', async (req, res) => {
  try {
    const roles = await Rol.findAll({ attributes: ['id', 'nombre', 'descripcion'] });
    return res.status(200).json({
      success: true,
      data: roles
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener roles',
      error: err.message
    });
  }
});

// GET /api/usuarios/oficiales - Listar solo oficiales de crédito (para filtros)
// Acceso: oficial_credito+, admin, gerente, analista
router.get('/oficiales', authorize(['oficial_credito', 'analista', 'gerente', 'admin']), usuariosController.listarOficiales);

// Rutas de CRUD (solo admin)
router.use(authorize(['admin']));

// GET /api/usuarios
router.get('/', usuariosController.listar);

// POST /api/usuarios
router.post('/', auditoria('usuarios', 'USUARIO'), usuariosController.crear);

// PUT /api/usuarios/:id
router.put('/:id', auditoria('usuarios', 'USUARIO'), usuariosController.actualizar);

module.exports = router;
