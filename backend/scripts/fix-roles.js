const { Rol } = require('../src/models');

async function fixRoles() {
  try {
    const roles = [
      {
        nombre: 'admin',
        permisos: { all: true }
      },
      {
        nombre: 'gerente',
        permisos: { reportes: true, auditoria: true, creditos: { read: true }, clientes: { read: true } }
      },
      {
        nombre: 'analista',
        permisos: { creditos: { read: true, update_estado: true }, clientes: { read: true } }
      },
      {
        nombre: 'oficial_credito',
        permisos: { clientes: { create: true, read: true, update: true }, creditos: { create: true, read: true }, pagos: { create: true, read: true } }
      }
    ];

    for (const r of roles) {
      await Rol.update({ permisos: r.permisos }, { where: { nombre: r.nombre } });
    }
    
    console.log('✅ Roles permissions updated.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixRoles();
