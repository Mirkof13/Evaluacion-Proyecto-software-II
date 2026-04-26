/**
 * BANCOSOL - Modelo Pago
 * Trazabilidad financiera completa
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Pago = sequelize.define('Pago', {
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
  amortizacion_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'amortizaciones',
      key: 'id'
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
  monto_pagado: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: { args: [0.01], msg: 'El monto pagado debe ser mayor a 0' }
    }
  },
  monto_capital: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'El monto de capital no puede ser negativo' }
    }
  },
  monto_interes: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'El monto de interés no puede ser negativo' }
    }
  },
  monto_mora: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'El monto de mora no puede ser negativo' }
    }
  },
  dias_mora: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Los días de mora no pueden ser negativos' }
    }
  },
  fecha_pago: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  tipo: {
    type: DataTypes.STRING(30),
    defaultValue: 'cuota',
    validate: {
      isIn: {
        args: [['cuota', 'anticipo', 'reprogramacion', 'castigo']],
        msg: 'Tipo de pago inválido'
      }
    }
  },
  observacion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  comprobante_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'pagos',
  timestamps: true,
  updatedAt: false,
  underscored: true
});

module.exports = Pago;
