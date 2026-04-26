const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Documento = sequelize.define('Documento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(50), // 'contrato', 'garantia', 'ci', 'otros'
    allowNull: false
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  extension: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  credito_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'creditos',
      key: 'id'
    }
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id'
    }
  }
}, {
  tableName: 'documentos',
  timestamps: true,
  underscored: true
});

module.exports = Documento;
