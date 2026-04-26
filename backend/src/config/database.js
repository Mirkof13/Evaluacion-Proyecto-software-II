/**
 * BANCOSOL - Configuración de Base de Datos
 * ORM: Sequelize v6 + PostgreSQL
 * Patrón: Repository Pattern (abstracción de datos)
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de pool de conexiones (ajustar para producción)
const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX) || 5,      // Conexiones máximas
  min: parseInt(process.env.DB_POOL_MIN) || 0,      // Conexiones mínimas
  acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,  // ms para adquirir
  idle: parseInt(process.env.DB_POOL_IDLE) || 10000          // ms antes de cerrar idle
};

// Crear instancia Sequelize
const dbName = process.env.NODE_ENV === 'test' 
  ? (process.env.DB_NAME || 'bancosol_db') + '_test'
  : (process.env.DB_NAME || 'bancosol_db');

const sequelize = new Sequelize(
  dbName,
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Desactivado para limpiar la consola del usuario
    pool: poolConfig,
    dialectOptions: {
      // Timeout de 5 segundos para queries
      statement_timeout: 5000
    },
    define: {
      // Snake_case en BD, camelCase en código
      underscored: true,
      // Timestamps automáticos (solo created_at por defecto)
      timestamps: true,
      updatedAt: false, 
      // Campo para deletedAt (si se usa) - no implementado
      paranoid: false,
      // Nombre personalizado de tabla (plural)
      freezeTableName: false
    },
    // Mantener conexión viva (para conexiones idle largas)
    keepDefaultTimezone: true,
    timezone: '+00:00'
  }
);

/**
 * Probar conexión a BD
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL exitosa');
    console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`   BD: ${process.env.DB_NAME}`);
  } catch (error) {
    console.error('❌ Error al conectar a PostgreSQL:', error.message);
    throw error;
  }
};

/**
 * Cerrar conexión
 */
const closeConnection = async () => {
  await sequelize.close();
  console.log('🔌 Conexión a BD cerrada');
};

module.exports = {
  sequelize,
  testConnection,
  closeConnection,
  Sequelize
};
