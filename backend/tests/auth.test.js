/**
 * BANCOSOL - Tests: Autenticación
 * Pruebas de login, JWT, y protección de rutas
 */

const request = require('supertest');
const app = require('../server');
const { sequelize } = require('../src/config/database');
const { Usuario, Rol } = require('../src/models');

describe('Autenticación y Roles', () => {

  beforeAll(async () => {
    // Conectar a BD y crear datos de prueba
    await sequelize.sync({ force: true });
    await Rol.bulkCreate([
      { nombre: 'admin', permisos: { all: true } },
      { nombre: 'gerente', permisos: { reportes: true } },
      { nombre: 'analista', permisos: { creditos: { read: true } } },
      { nombre: 'oficial_credito', permisos: { clientes: { create: true } } }
    ]);

    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('Admin123!', 12);

    await Usuario.create({
      nombre: 'Admin Test',
      email: 'admin@bancosol.bo',
      password_hash: passwordHash,
      rol_id: 1,
      activo: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/login', () => {
    test('Login exitoso retorna token JWT y datos de usuario', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@bancosol.bo', password: 'Admin123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.usuario).toHaveProperty('rol', 'admin');
    });

    test('Login falla con password incorrecto', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@bancosol.bo', password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Login falla con email inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noexiste@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });

    test('Rechaza email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notanemail', password: 'password123' });

      expect(res.status).toBe(422);  // validation error
    });
  });

  describe('Protección de rutas', () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@bancosol.bo', password: 'Admin123!' });
      token = res.body.data.token;
    });

    test('Ruta protegida retorna 401 sin token', async () => {
      const res = await request(app).get('/api/clientes');
      expect(res.status).toBe(401);
    });

    test('Ruta protegida funciona con token válido', async () => {
      const res = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Ruta protegida rechaza token inválido', async () => {
      const res = await request(app)
        .get('/api/clientes')
        .set('Authorization', 'Bearer tokenno válido');

      expect(res.status).toBe(401);
    });
  });

  describe('Control de Acceso por Rol', () => {
    let tokenOficial, tokenAdmin;

    beforeAll(async () => {
      // Crear usuario oficial
      const bcrypt = require('bcrypt');
      const hashOficial = await bcrypt.hash('Oficial123!', 12);
      await Usuario.create({
        nombre: 'Oficial Test',
        email: 'oficial@test.com',
        password_hash: hashOficial,
        rol_id: 4,
        activo: true
      });

      // Login como oficial
      const resOficial = await request(app)
        .post('/api/auth/login')
        .send({ email: 'oficial@test.com', password: 'Oficial123!' });
      tokenOficial = resOficial.body.data.token;

      const resAdmin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@bancosol.bo', password: 'Admin123!' });
      tokenAdmin = resAdmin.body.data.token;
    });

    test('Oficial puede crear cliente (POST /clientes)', async () => {
      const res = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${tokenOficial}`)
        .send({
          ci: '98765432',
          nombre: 'Juan',
          apellido: 'Perez'
        });

      expect(res.status).toBe(201);  // Created
    });

    test('Oficial NO puede acceder a /reportes', async () => {
      const res = await request(app)
        .get('/api/reportes/cartera')
        .set('Authorization', `Bearer ${tokenOficial}`);

      expect(res.status).toBe(403);
    });

    test('Admin SI puede acceder a /reportes', async () => {
      const res = await request(app)
        .get('/api/reportes/cartera')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
    });
  });
});
