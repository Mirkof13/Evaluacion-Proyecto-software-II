/**
 * BANCOSOL - Modelo AuditoriaLog
 * Bitácora forense inmutable (ISO 27001 - No Repudio)
 * Todos los cambios POST/PUT/DELETE se registran aquí
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const AuditoriaLog = sequelize.define('AuditoriaLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  usuario_email: {
    type: DataTypes.STRING(100),
    allowNull: true
    // Se guarda por si el usuario es eliminado (borrado lógico)
  },
  accion: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // Ej: 'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'LOGIN', 'LOGOUT', 'ACCESO_DENEGADO'
    validate: {
      notEmpty: { msg: 'La acción es obligatoria' }
    }
  },
  tabla_afectada: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  registro_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  datos_antes: {
    type: DataTypes.JSONB,
    allowNull: true,
    get() {
      const raw = this.getDataValue('datos_antes');
      return raw ? JSON.parse(JSON.stringify(raw)) : null;
    },
    set(value) {
      this.setDataValue('datos_antes', value ? JSON.parse(JSON.stringify(value)) : null);
    }
    // CONTEXTO FORENSE: snapshot ANTES del cambio
  },
  datos_despues: {
    type: DataTypes.JSONB,
    allowNull: true,
    get() {
      const raw = this.getDataValue('datos_despues');
      return raw ? JSON.parse(JSON.stringify(raw)) : null;
    },
    set(value) {
      this.setDataValue('datos_despues', value ? JSON.parse(JSON.stringify(value)) : null);
    }
    // CONTEXTO FORENSE: snapshot DESPUÉS del cambio
  },
  ip_origen: {
    type: DataTypes.STRING(45),  // IPv6 max 45 chars
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  endpoint: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  metodo_http: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: {
        args: [['GET', 'POST', 'PUT', 'DELETE', 'PATCH']],
        msg: 'Método HTTP inválido'
      }
    }
  },
  resultado: {
    type: DataTypes.STRING(20),
    defaultValue: 'exitoso',
    validate: {
      isIn: {
        args: [['exitoso', 'fallido']],
        msg: 'Resultado inválido'
      }
    }
  },
  codigo_respuesta: {
    type: DataTypes.INTEGER,
    allowNull: true  // Código HTTP: 200, 404, 500, etc.
  },
  datos_adicionales: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  hash_verificacion: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'SHA-256 de la fila para detectar manipulaciones (ASFI)'
  }
}, {
  tableName: 'auditoria_log',
  timestamps: true,
  updatedAt: false, // No hay columna updated_at en la DB
  underscored: true,
  // Evitar que se borre el registro (archivo forense)
  // No implementar paranoid: mantener registros para siempre
  paranoid: false,
  hooks: {
    beforeSave: (instance) => {
      const crypto = require('crypto');
      const data = `${instance.usuario_id}${instance.accion}${instance.tabla_afectada}${instance.registro_id}${JSON.stringify(instance.datos_antes)}${JSON.stringify(instance.datos_despues)}${instance.ip_origen}`;
      instance.hash_verificacion = crypto.createHash('sha256').update(data).digest('hex');
    }
  }
});

module.exports = AuditoriaLog;
