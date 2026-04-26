const { Usuario } = require('../src/models');

async function fixPasswords() {
  const users = [
    { email: 'admin@bancosol.bo', hash: '$2b$12$iuxJn2MjLxobxikhoc0nUeNXntWeySWXS0GJCmICbRnT0IOxfkQuG' },
    { email: 'gerente@bancosol.bo', hash: '$2b$12$odAGa5ek0jMWBmjJ4N5MQuazK8GIUF0qNgy0bnrwyTkeNyKaxoZEq' },
    { email: 'analista@bancosol.bo', hash: '$2b$12$Z6jereJxLH7cftCvTcWlNeyWp8MNVTT.J.wPCo2yaT73hrWA/pA5e' },
    { email: 'oficial@bancosol.bo', hash: '$2b$12$StfBkobE1HjIRtSng8JGNeQv.r5FTImhBUxV3/WM7YOH5moiKn9XO' }
  ];
  
  try {
    for (const u of users) {
      await Usuario.update(
        { 
          password_hash: u.hash,
          intentos_fallidos: 0,
          bloqueado_hasta: null,
          activo: true
        },
        { where: { email: u.email } }
      );
    }
    console.log('✅ Passwords updated specifically for each user.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating passwords:', err);
    process.exit(1);
  }
}

fixPasswords();
