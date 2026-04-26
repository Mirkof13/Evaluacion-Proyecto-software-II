/**
 * BANCOSOL - Modelo Usuario
 * Autenticación + Control de Acceso IAM
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database').sequelize;
const Rol = require('./Rol');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre es obligatorio' },
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'El email es obligatorio' },
      isEmail: { msg: 'Formato de email inválido' }
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La contraseña es obligatoria' },
      len: [60, 255]  // bcrypt hash length
    }
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ultimo_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  intentos_fallidos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Intentos no pueden ser negativos' }
    }
  },
  bloqueado_hasta: {
    type: DataTypes.DATE,
    allowNull: true
  },
  mfa_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  mfa_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  underscored: true,
  // Excluir password_hash de toJSON por defecto
  defaultsScope: {
    attributes: { exclude: ['password_hash'] }
  }
});

// Agregar métodos de instancia (Sequelize v6+)
Usuario.prototype.verifyPassword = async function(candidatePassword) {
  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

Usuario.prototype.hashPassword = async function(password) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

module.exports = Usuario;
