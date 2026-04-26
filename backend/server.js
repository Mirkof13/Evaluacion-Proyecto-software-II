/**
 * BANCOSOL - Servidor Principal
 * Arquitectura: N-Capas (3-Tier)
 * Patrones: MVC + Service Layer + Middleware Pipeline
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./src/config/database');
const authRoutes = require('./src/routes/auth.routes');
const clientesRoutes = require('./src/routes/clientes.routes');
const creditosRoutes = require('./src/routes/creditos.routes');
const pagosRoutes = require('./src/routes/pagos.routes');
const reportesRoutes = require('./src/routes/reportes.routes');
const usuariosRoutes = require('./src/routes/usuarios.routes');
const auditoriaRoutes = require('./src/routes/auditoria.routes');
const cajaRoutes = require('./src/routes/caja.routes');
const notificacionesRoutes = require('./src/routes/notificaciones.routes');
const mlEngine = require('./src/utils/machineLearning');
const { Credito } = require('./src/models');
const carteraService = require('./src/services/cartera.service');
const securityMiddleware = require('./src/middleware/security');

// Inicializar app
const app = express();

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// Seguridad HTTP (helmet) - Configuración endurecida ASFI
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:5000"]
    }
  },
  crossOriginEmbedderPolicy: false,
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true
}));

// Zero Trust Security Layer
app.use(securityMiddleware);

// CORS configurado para desarrollo y producción
const allowedOrigins = [

  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173', // Vite
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como apps móviles o curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Logging de peticiones (morgan)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev')); // Menos verboso que 'combined'
}

// Rate limiting (protección contra ataques de fuerza bruta)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Demasiadas peticiones desde esta IP, intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (Documentos de crédito, CI, etc.)
app.use('/uploads', express.static('uploads'));

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
app.use('/api/auth', authRoutes);

// ============================================
// RUTAS PROTEGIDAS (requieren JWT)
// ============================================
app.use('/api/clientes', clientesRoutes);
app.use('/api/creditos', creditosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

// ============================================
// HEALTH CHECK (monitoreo)
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} - ${err.message}`);
  console.error(err.stack);

  // No exponer detalles en producción
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    message: isDevelopment ? err.message : 'Error interno del servidor',
    error: isDevelopment ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// ============================================
// 404 - Ruta no encontrada
// ============================================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.originalUrl}`,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================
const PORT = process.env.PORT || 5000;

// Sincronizar BD de forma SEGURA (No usar force:true en producción)
const syncOptions = { 
  force: false, // JAMÁS usar true fuera de seeders específicos
  alter: false  // Desactivado: causaba duplicación de índices y errores de constraint
};

db.sequelize.sync(syncOptions)
  .then(() => {
    console.log('✅ Conexión a PostgreSQL establecida');
    console.log('✅ Modelos sincronizados');
    const server = app.listen(PORT, async () => {
      console.log('🚀 Servidor BancoSol ejecutándose');
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
      
      // Tareas de fondo escalonadas
      setTimeout(() => {
        mlEngine.entrenarModelo(Credito).catch(err => console.error('Error IA:', err));
      }, 5000);

      setTimeout(() => {
        carteraService.clasificarCartera().catch(err => console.error('Error ASFI:', err));
      }, 10000);
    });

    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`❌ Error: El puerto ${PORT} ya está en uso.`);
        console.error('💡 Intenta cerrar otros procesos de Node o usa: npm run kill-port');
        if (process.env.NODE_ENV !== 'test') process.exit(1);
      }
    });
  })
  .catch((error) => {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    if (process.env.NODE_ENV !== 'test') process.exit(1);
  });

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Señal SIGTERM recibida, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Señal SIGINT recibida, cerrando servidor...');
  process.exit(0);
});

module.exports = app;
