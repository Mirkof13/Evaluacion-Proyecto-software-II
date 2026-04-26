
const { Usuario } = require('./src/models/index');
const { sequelize } = require('./src/config/database');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
  try {
    console.log('Buscando usuario admin...');
    const admin = await Usuario.findOne({ where: { email: 'admin@bancosol.bo' } });
    
    if (admin) {
      console.log('Usuario encontrado. Hasheando nueva contraseña...');
      const saltRounds = 12;
      admin.password_hash = await bcrypt.hash('Admin123!', saltRounds);
      admin.intentos_fallidos = 0;
      admin.bloqueado_hasta = null;
      admin.activo = true;
      await admin.save();
      console.log('✅ Contraseña de Admin reseteada a Admin123!');
    } else {
      console.error('❌ Usuario admin no encontrado.');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await sequelize.close();
  }
}

resetAdminPassword();
