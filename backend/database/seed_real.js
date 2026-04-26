/**
 * BANCOSOL - Seeder Real Idempotente
 * Genera 50 clientes y créditos con estados variados y persistencia ML
 */

const { Rol, Usuario, Cliente, Credito, Amortizacion, Pago, ModelML, Notificacion, AuditoriaLog, sequelize } = require('../src/models');
const bcrypt = require('bcrypt');
const calculos = require('../src/utils/calculos');

async function seed() {
  const transaction = await sequelize.transaction();
  try {
    console.log('🚀 Iniciando sembrado real e idempotente...');

    const now = new Date();
    const currentYear = 2024;

    // 1. Roles
    const rolesToCreate = [
      { nombre: 'admin', descripcion: 'Administrador total' },
      { nombre: 'gerente', descripcion: 'Gerente de riesgos' },
      { nombre: 'analista', descripcion: 'Analista de créditos' },
      { nombre: 'oficial_credito', descripcion: 'Oficial de captación' }
    ];
    
    for (const r of rolesToCreate) {
      await Rol.findOrCreate({ where: { nombre: r.nombre }, defaults: r, transaction });
    }
    
    const roles = await Rol.findAll({ transaction });
    const adminRolId = roles.find(r => r.nombre === 'admin').id;
    const oficialRolId = roles.find(r => r.nombre === 'oficial_credito').id;

    // 2. Usuarios
    const [adminUser] = await Usuario.findOrCreate({
      where: { email: 'admin@bancosol.com.bo' },
      defaults: {
        nombre: 'Administrador Sistema',
        password_hash: await bcrypt.hash('Admin123*', 10),
        rol_id: adminRolId
      },
      transaction
    });

    const [oficialUser] = await Usuario.findOrCreate({
      where: { email: 'juan.oficial@bancosol.com.bo' },
      defaults: {
        nombre: 'Juan Oficial',
        password_hash: await bcrypt.hash('Juan123*', 10),
        rol_id: oficialRolId
      },
      transaction
    });

    // 3. Clientes (50)
    const nombres = ['Carlos', 'Maria', 'Roberto', 'Ana', 'Luis', 'Jorge', 'Elena', 'Pedro', 'Lucia', 'Mario', 'Sofia', 'Ramiro', 'Ximena', 'Hugo', 'Paola'];
    const apellidos = ['Mamani', 'Quispe', 'Condori', 'Flores', 'Vargas', 'Guzman', 'Rojas', 'Villca', 'Copa', 'Blanco', 'Cruz', 'Mendoza', 'Soto', 'Poma'];
    
    const clientes = [];
    for (let i = 0; i < 50; i++) {
      const ci = String(1000000 + i);
      const [cliente] = await Cliente.findOrCreate({
        where: { ci },
        defaults: {
          nombre: nombres[i % nombres.length],
          apellido: apellidos[i % apellidos.length],
          telefono: String(70000000 + i),
          direccion: `Calle ${i + 1}, Zona Central`,
          fecha_nacimiento: '1985-05-15',
          email: `cliente${i}@gmail.com`
        },
        transaction
      });
      clientes.push(cliente);
    }

    // 4. ML Model State
    await ModelML.findOrCreate({
      where: { nombre_modelo: 'ScoringModel_v1' },
      defaults: {
        pesos_json: { init: true, layers: [64, 32, 16] },
        precision: 0.9820,
        registros_entrenamiento: 150000
      },
      transaction
    });

    // 5. Limpieza previa para datos frescos
    await Amortizacion.destroy({ where: {}, transaction });
    await Credito.destroy({ where: {}, transaction });

    const estados = ['activo', 'al_dia', 'en_mora', 'cancelado', 'pendiente', 'rechazado'];
      for (let i = 0; i < 50; i++) {
        const estado = estados[i % estados.length];
        const monto = 5000 + (Math.random() * 45000);
        // Generar fechas escalonadas para tener historia en los gráficos (últimos 6 meses)
        const mesesAtras = (i % 6);
        const fechaDesembolso = new Date(currentYear, now.getMonth() - mesesAtras - 1, 15);
        
        const credito = await Credito.create({
          numero_credito: `SOL-2024-${String(i + 1).padStart(4, '0')}`,
          cliente_id: clientes[i].id,
          oficial_id: (i % 2 === 0) ? adminUser.id : oficialUser.id,
          monto: monto,
          tasa_interes: 0.12,
          plazo_meses: 24,
          estado: estado,
          saldo_pendiente: estado === 'cancelado' ? 0 : monto,
          mora_acumulada: estado === 'en_mora' ? (200 + Math.random() * 1000) : 0,
          categoria_asfi: estado === 'en_mora' ? 'B' : 'A',
          fecha_desembolso: ['pendiente', 'rechazado'].includes(estado) ? null : fechaDesembolso,
          fecha_vencimiento: new Date(currentYear + 2, now.getMonth(), 15),
          created_at: fechaDesembolso
        }, { transaction });

        // Crear Amortizaciones para que los reportes de morosidad tengan data
        if (!['pendiente', 'rechazado'].includes(estado)) {
          for (let m = 1; m <= 6; m++) {
            const fechaVenc = new Date(fechaDesembolso);
            fechaVenc.setMonth(fechaVenc.getMonth() + m);
            
            // Simular algunas cuotas en mora (pagado = false y fecha pasada)
            const esMoraReal = estado === 'en_mora' && fechaVenc < now;
            
            await Amortizacion.create({
              credito_id: credito.id,
              numero_cuota: m,
              fecha_vencimiento: fechaVenc,
              capital: monto / 24,
              interes: (monto * 0.12) / 12,
              cuota_total: (monto / 24) + ((monto * 0.12) / 12),
              saldo_capital: monto - ((monto / 24) * m),
              pagado: !esMoraReal && (fechaVenc < now), // Si no es mora y ya pasó, está pagado
            }, { transaction });
          }
        }

        if (estado === 'en_mora') {
          await Notificacion.create({
            usuario_id: credito.oficial_id,
            titulo: 'Mora Detectada',
            mensaje: `El crédito ${credito.numero_credito} presenta cuotas impagas.`,
            tipo: 'danger'
          }, { transaction });
        }
      }

    // 6. Auditoría mock (para visibilidad inmediata)
    const logs = [
      {
        usuario_id: adminUser.id,
        usuario_email: 'admin@bancosol.com.bo',
        accion: 'LOGIN_EXITOSO',
        tabla_afectada: 'usuarios',
        ip_origen: '127.0.0.1',
        resultado: 'exitoso',
        codigo_respuesta: 200,
        endpoint: '/api/auth/login',
        metodo_http: 'POST'
      },
      {
        usuario_id: oficialUser.id,
        usuario_email: 'juan.oficial@bancosol.com.bo',
        accion: 'CREDITO_CREAR',
        tabla_afectada: 'creditos',
        ip_origen: '192.168.1.50',
        resultado: 'exitoso',
        codigo_respuesta: 201,
        endpoint: '/api/creditos',
        metodo_http: 'POST',
        datos_despues: { monto: 15000, cliente_id: 1 }
      }
    ];

    for (const log of logs) {
      await AuditoriaLog.create(log, { transaction });
    }

    await transaction.commit();
    console.log('✅ Sembrado masivo e inteligente completado.');
    process.exit(0);
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Error fatal en el sembrado:', err);
    process.exit(1);
  }
}

seed();
