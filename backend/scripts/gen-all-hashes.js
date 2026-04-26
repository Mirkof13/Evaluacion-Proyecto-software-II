const bcrypt = require('bcrypt');

const passwords = {
  'admin@bancosol.bo': 'Admin123!',
  'gerente@bancosol.bo': 'Gerente123!',
  'analista@bancosol.bo': 'Analista123!',
  'oficial@bancosol.bo': 'Oficial123!'
};

async function gen() {
  for (const [email, pwd] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(pwd, 12);
    console.log(`${email}: ${hash}`);
  }
}

gen();
