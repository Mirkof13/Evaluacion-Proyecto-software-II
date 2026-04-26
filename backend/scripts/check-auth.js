const bcrypt = require('bcrypt');
const password = 'Admin123!';
const hash = '$2b$12$5ebBvN3Ps2HoiptYJtKLwuilbGcz3uC.JMRft7FRaAPgm7v07C1ye';

bcrypt.compare(password, hash).then(res => {
  console.log('Match:', res);
}).catch(err => {
  console.error('Error:', err);
});
