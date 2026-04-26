/**
 * BANCOSOL - Modelo Amortizacion
 * Tabla de amortización calculada (fórmula francesa)
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Amortizacion = sequelize.define('Amortizacion', {
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
  numero_cuota: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  capital: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'El capital no puede ser negativo' }
    }
  },
  interes: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'El interés no puede ser negativo' }
    }
  },
  cuota_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: { args: [0.01], msg: 'La cuota total debe ser mayor a 0' }
    }
  },
  saldo_capital: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'El saldo no puede ser negativo' }
    }
  },
  pagado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fecha_pago: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'amortizaciones',
  timestamps: true,
  updatedAt: false,
  underscored: true
});

module.exports = Amortizacion;
