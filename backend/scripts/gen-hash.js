const bcrypt = require('bcrypt');
const password = 'Admin123!';

bcrypt.hash(password, 12).then(hash => {
  console.log('New Hash:', hash);
});
