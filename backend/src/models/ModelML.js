/**
 * BANCOSOL - Modelo ML
 * Persistencia de cerebros (pesos y parámetros) de la IA
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const ModelML = sequelize.define('ModelML', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_modelo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'ScoringModel_v1'
  },
  pesos_json: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Almacena los coeficientes de la red neuronal'
  },
  precision: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false
  },
  registros_entrenamiento: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ultima_iteracion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  hiperparametros: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'modelos_ml',
  timestamps: true,
  underscored: true
});

module.exports = ModelML;
