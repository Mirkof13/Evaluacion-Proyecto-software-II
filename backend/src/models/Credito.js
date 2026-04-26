/**
 * BANCOSOL - Modelo Credito
 * Integridad transaccional con estados y referencias
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Credito = sequelize.define('Credito', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_credito: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'El número de crédito es obligatorio' }
    }
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'clientes',
      key: 'id'
    }
  },
  oficial_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  monto: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'El monto debe ser mayor a 0' }
    }
  },
  tasa_interes: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    validate: {
      min: { args: [0.0001], msg: 'La tasa debe ser mayor a 0' },
      max: { args: [1], msg: 'La tasa no puede superar el 100%' }
    }
  },
  plazo_meses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'El plazo debe ser al menos 1 mes' },
      max: { args: [360], msg: 'El plazo máximo es 360 meses (30 años)' }
    }
  },
  destino: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  garantia: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  estado: {
    type: DataTypes.STRING(30),
    defaultValue: 'pendiente',
    validate: {
      isIn: {
        args: [['pendiente', 'aprobado', 'rechazado', 'activo', 'al_dia', 'en_mora', 'cancelado', 'castigado']],
        msg: 'Estado de crédito inválido'
      }
    }
  },
  fecha_desembolso: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fecha_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  saldo_pendiente: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'El saldo no puede ser negativo' }
    }
  },
  mora_acumulada: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'La mora no puede ser negativa' }
    }
  },
  categoria_asfi: {
    type: DataTypes.STRING(2),
    defaultValue: 'A'
  }
}, {
  tableName: 'creditos',
  timestamps: true,
  underscored: true
});

module.exports = Credito;
