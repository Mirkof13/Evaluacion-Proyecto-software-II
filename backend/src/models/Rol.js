/**
 * BANCOSOL - Modelo Rol
 * Control de Acceso Basado en Roles (RBAC)
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Rol = sequelize.define('Rol', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'El nombre del rol es obligatorio' },
      len: [3, 50]
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  permisos: {
    type: DataTypes.JSONB,
    defaultValue: {},
    // Estructura esperada:
    // { "clientes": {"create": true, "read": true, "update": true, "delete": false}, ... }
    validate: {
      // JSONB handles basic validation
    }
  }
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true
});

module.exports = Rol;
