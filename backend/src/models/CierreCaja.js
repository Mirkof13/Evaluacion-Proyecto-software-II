/**
 * BANCOSOL - Modelo CierreCaja
 * Persistencia de conciliación diaria
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const CierreCaja = sequelize.define('CierreCaja', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true,
    defaultValue: DataTypes.NOW
  },
  total_teorico: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  total_fisico: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  diferencia: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  desglose_json: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  estado: {
    type: DataTypes.STRING(20),
    defaultValue: 'cerrado' // 'pendiente', 'cerrado'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'cierres_caja',
  timestamps: true,
  underscored: true
});

module.exports = CierreCaja;
