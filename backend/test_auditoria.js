const { AuditoriaLog, Usuario, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function testAuditoria() {
  try {
    const { count, rows } = await AuditoriaLog.findAndCountAll({
      attributes: { exclude: ['datos_antes', 'datos_despues'] },
      order: [['created_at', 'DESC']],
      logging: console.log
    });
    console.log('Auditoria query success, results count:', count);
    process.exit(0);
  } catch (error) {
    console.error('Auditoria query failed:', error.message);
    process.exit(1);
  }
}

testAuditoria();
