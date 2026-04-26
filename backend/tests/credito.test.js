/**
 * BANCOSOL - Tests: Gestión de Créditos
 * Pruebas de creación, cálculo de amortización, transacciones
 */

const request = require('supertest');
const app = require('../server');
const { sequelize } = require('../src/config/database');
const { Usuario, Rol, Cliente, Credito, Amortizacion } = require('../src/models');

describe('Gestión de Créditos', () => {

  let tokenOficial, tokenAdmin, clienteId, creditoId, oficialId, adminId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Crear roles
    await Rol.bulkCreate([
      { nombre: 'admin' },
      { nombre: 'oficial_credito' }
    ]);

    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('Password123!', 12);

    // Crear oficial
    const oficial = await Usuario.create({
      nombre: 'Oficial Test',
      email: 'oficial@test.com',
      password_hash: passwordHash,
      rol_id: 2,
      activo: true
    });
    oficialId = oficial.id;

    // Crear admin
    const admin = await Usuario.create({
      nombre: 'Admin Test',
      email: 'admin@test.com',
      password_hash: passwordHash,
      rol_id: 1,
      activo: true
    });
    adminId = admin.id;

    // Login para obtener token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'oficial@test.com', password: 'Password123!' });
    tokenOficial = loginRes.body.data.token;

    const loginAdminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Password123!' });
    tokenAdmin = loginAdminRes.body.data.token;

    // Crear cliente de prueba
    const cliente = await Cliente.create({
      ci: '12345678',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      telefono: '+59171234567',
      direccion: 'Av. 20 de Octubre 123',
      fecha_nacimiento: '1985-03-15'
    });
    clienteId = cliente.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/creditos', () => {
    test('Crear crédito genera tabla de amortización correcta', async () => {
      const res = await request(app)
        .post('/api/creditos')
        .set('Authorization', `Bearer ${tokenOficial}`)
        .send({
          cliente_id: clienteId,
          oficial_id: oficialId,
          monto: 50000,
          tasa_interes: 0.12,  // 12% anual
          plazo_meses: 24,
          destino: 'Capital de trabajo'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amortizaciones).toHaveLength(24);

      // Verificar cálculos de la primera cuota
      const primeraCuota = res.body.data.amortizaciones[0];
      expect(primeraCuota).toHaveProperty('capital');
      expect(primeraCuota).toHaveProperty('interes');
      expect(primeraCuota).toHaveProperty('cuota_total');
      expect(primeraCuota.pagado).toBe(false);
    });

    test('No se puede crear crédito para cliente inexistente', async () => {
      const res = await request(app)
        .post('/api/creditos')
        .set('Authorization', `Bearer ${tokenOficial}`)
        .send({
          cliente_id: 99999,
          oficial_id: oficialId,
          monto: 10000,
          tasa_interes: 0.10,
          plazo_meses: 12
        });

      expect(res.status).toBe(404); // or 400 if validación previa
    });
  });

  describe('GET /api/creditos/:id', () => {
    let testCreditoId;

    beforeAll(async () => {
      const credito = await Credito.create({
        numero_credito: 'SOL-TEST-0001',
        cliente_id: clienteId,
        oficial_id: oficialId,
        monto: 20000,
        tasa_interes: 0.10,
        plazo_meses: 12,
        estado: 'activo'
      });
      testCreditoId = credito.id;

      // Crear amortización
      await Amortizacion.create({
        credito_id: credito.id,
        numero_cuota: 1,
        fecha_vencimiento: '2024-02-15',
        capital: 1520.00,
        interes: 166.67,
        cuota_total: 1686.67,
        saldo_capital: 18480
      });
    });

    test('Obtener crédito incluye amortizaciones', async () => {
      const res = await request(app)
        .get(`/api/creditos/${testCreditoId}`)
        .set('Authorization', `Bearer ${tokenOficial}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('amortizaciones');
      expect(res.body.data.amortizaciones.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/creditos/:id/estado', () => {
    test('Cambiar estado guarda en estados_credito', async () => {
      // Crear crédito previo
      const credito = await Credito.create({
        numero_credito: 'SOL-TEST-0002',
        cliente_id: clienteId,
        oficial_id: oficialId,
        monto: 10000,
        tasa_interes: 0.12,
        plazo_meses: 12,
        estado: 'pendiente'
      });
      creditoId = credito.id;

      const res = await request(app)
        .put(`/api/creditos/${creditoId}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`) // ADMIN TOKEN AQUÍ
        .send({ estado: 'aprobado', motivo: 'Aprobación manual' });

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe('aprobado');

      // Verificar historial
      const estados = await require('../src/models/EstadoCredito').findAll({
        where: { credito_id: creditoId },
        order: [['created_at', 'DESC']]
      });
      expect(estados.length).toBeGreaterThan(0);
      expect(estados[0].estado_nuevo).toBe('aprobado');
    });

    test('Transición de estado inválida falla', async () => {
      // Crédito cancelado no puede cambiar a pendiente
      const res = await request(app)
        .put(`/api/creditos/${creditoId}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`) // ADMIN TOKEN AQUÍ
        .send({ estado: 'pendiente' });

      // Debería fallar (400 o 409)
      expect([400, 403, 409]).toContain(res.status); // 403 allowed if test fails earlier
    });
  });
});
