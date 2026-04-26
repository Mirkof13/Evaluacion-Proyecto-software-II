
const { Usuario } = require('./src/models/index');
const { sequelize } = require('./src/config/database');

async function unlockAdmin() {
  try {
    console.log('Buscando usuario admin...');
    const admin = await Usuario.findOne({ where: { email: 'admin@bancosol.bo' } });
    
    if (admin) {
      console.log('Usuario encontrado. Limpiando bloqueos...');
      admin.intentos_fallidos = 0;
      admin.bloqueado_hasta = null;
      admin.activo = true;
      await admin.save();
      console.log('✅ Admin desbloqueado exitosamente.');
    } else {
      console.error('❌ Usuario admin no encontrado.');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await sequelize.close();
  }
}

unlockAdmin();
