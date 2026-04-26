/**
 * BANCOSOL - Modelo EstadoCredito
 * Historial de cambios de estado (principio No Repudio)
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const EstadoCredito = sequelize.define('EstadoCredito', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  credito_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'creditos',
      key: 'id'
    }
  },
  estado_anterior: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  estado_nuevo: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: {
      isIn: {
        args: [['pendiente', 'aprobado', 'rechazado', 'activo', 'al_dia', 'en_mora', 'cancelado', 'castigado']],
        msg: 'Estado inválido'
      }
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  datos_adicionales: {
    type: DataTypes.JSONB,
    defaultValue: {}
    // Datos extra: { "fecha_desembolso": "2024-01-15", "monto_aprobado": 50000 }
  }
}, {
  tableName: 'estados_credito',
  timestamps: true,
  updatedAt: false,
  underscored: true
});

module.exports = EstadoCredito;
