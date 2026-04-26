/**
 * BANCOSOL - Modelo Notificación
 * Alertas proactivas para Oficiales y Gerentes
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Notificacion = sequelize.define('Notificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // null para notificaciones globales
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  titulo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(20),
    defaultValue: 'info', // 'info', 'warning', 'danger', 'success'
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  vinculo_url: {
    type: DataTypes.STRING(200),
    allowNull: true
  }
}, {
  tableName: 'notificaciones',
  timestamps: true,
  underscored: true
});

module.exports = Notificacion;
