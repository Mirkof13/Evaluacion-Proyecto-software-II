const { Usuario, Rol } = require('../src/models');

async function listUsers() {
  try {
    const users = await Usuario.findAll({
      include: [{ model: Rol, as: 'rol' }],
      attributes: ['id', 'email', 'activo', 'intentos_fallidos', 'bloqueado_hasta']
    });
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listUsers();
