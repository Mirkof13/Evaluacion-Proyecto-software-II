const creditoService = require('./src/services/credito.service');

async function testObtener() {
  try {
    const credito = await creditoService.obtenerCredito(8);
    console.log('ObtenerCredito success, ID:', credito.id);
    console.log('Amortizaciones count:', credito.amortizaciones.length);
    process.exit(0);
  } catch (error) {
    console.error('ObtenerCredito failed:', error.message);
    process.exit(1);
  }
}

testObtener();
