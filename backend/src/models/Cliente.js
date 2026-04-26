/**
 * BANCOSOL - Modelo Cliente
 * Validación: CI boliviano (7-8 dígitos), datos personales
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ci: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'El CI es obligatorio' },
      len: { args: [7, 20], msg: 'El CI debe tener 7-20 caracteres' },
      isNumeric: { msg: 'El CI debe contener solo números' }
    }
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre es obligatorio' },
      len: [2, 100]
    }
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El apellido es obligatorio' },
      len: [2, 100]
    }
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isNumeric: { msg: 'El teléfono debe contener solo números' }
    }
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: { msg: 'Fecha inválida' }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: { msg: 'Formato de email inválido' }
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'clientes',
  timestamps: true,
  underscored: true
});

module.exports = Cliente;
