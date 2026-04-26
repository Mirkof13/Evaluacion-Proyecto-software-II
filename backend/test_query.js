const { Credito, Usuario, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function testQuery() {
  try {
    const results = await Credito.findAll({
      attributes: [
        'oficial_id',
        [sequelize.fn('SUM', sequelize.col('mora_acumulada')), 'mora_total'],
        [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
      ],
      include: [{ 
        model: Usuario, 
        as: 'oficial', 
        attributes: ['id', 'nombre'],
        required: false
      }],
      group: [
        sequelize.col('Credito.oficial_id'),
        sequelize.col('oficial.id'),
        sequelize.col('oficial.nombre')
      ],
      logging: console.log
    });
    console.log('Query success, results count:', results.length);
    process.exit(0);
  } catch (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }
}

testQuery();
