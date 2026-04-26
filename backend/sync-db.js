/**
 * Script de Sincronización Forzada Controlada
 * Crea las nuevas tablas sin destruir datos existentes
 */

const { sequelize } = require('./src/models');

async function sync() {
  try {
    console.log('🚀 Sincronizando nuevas tablas (ModelML, Notificacion)...');
    // Usamos alter:true solo una vez para crear las nuevas tablas
    await sequelize.sync({ alter: true });
    console.log('✅ Sincronización completada con éxito.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error sincronizando:', err.message);
    process.exit(1);
  }
}

sync();
