/**
 * BANCOSOL - Índice de Modelos y Asociaciones
 * Patrón: Repository Pattern centralizado
 */

const db = require('../config/database');
const { sequelize } = db;

// Importar modelos
const Rol = require('./Rol');
const Usuario = require('./Usuario');
const Cliente = require('./Cliente');
const Credito = require('./Credito');
const Amortizacion = require('./Amortizacion');
const Pago = require('./Pago');
const EstadoCredito = require('./EstadoCredito');
const AuditoriaLog = require('./AuditoriaLog');
const CierreCaja = require('./CierreCaja');
const ModelML = require('./ModelML');
const Notificacion = require('./Notificacion');
const Documento = require('./Documento');

// ============================================
// DEFINICIÓN DE ASOCIACIONES (Relaciones)
// ============================================

// Rol -> Usuarios (1:N)
Rol.hasMany(Usuario, {
  foreignKey: 'rol_id',
  as: 'usuarios',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Usuario.belongsTo(Rol, {
  foreignKey: 'rol_id',
  as: 'rol',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Cliente -> Créditos (1:N)
Cliente.hasMany(Credito, {
  foreignKey: 'cliente_id',
  as: 'creditos',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Credito.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
  as: 'cliente',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Usuario (Oficial) -> Créditos (1:N)
Usuario.hasMany(Credito, {
  foreignKey: 'oficial_id',
  as: 'creditos_asignados',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Credito.belongsTo(Usuario, {
  foreignKey: 'oficial_id',
  as: 'oficial',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Credito -> Amortizaciones (1:N)
Credito.hasMany(Amortizacion, {
  foreignKey: 'credito_id',
  as: 'amortizaciones',
  onDelete: 'CASCADE',  // Si eliminan crédito, eliminar amortizaciones
  onUpdate: 'CASCADE'
});
Amortizacion.belongsTo(Credito, {
  foreignKey: 'credito_id',
  as: 'credito',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Credito -> Pagos (1:N)
Credito.hasMany(Pago, {
  foreignKey: 'credito_id',
  as: 'pagos',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Pago.belongsTo(Credito, {
  foreignKey: 'credito_id',
  as: 'credito',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Usuario -> Pagos (1:N) (quien registra)
Usuario.hasMany(Pago, {
  foreignKey: 'usuario_id',
  as: 'pagos_registrados',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Pago.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Amortizacion -> Pagos (1:1 opcional)
Amortizacion.hasOne(Pago, {
  foreignKey: 'amortizacion_id',
  as: 'pago',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
Pago.belongsTo(Amortizacion, {
  foreignKey: 'amortizacion_id',
  as: 'amortizacion',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// Credito -> EstadoCredito (1:N) (historial)
Credito.hasMany(EstadoCredito, {
  foreignKey: 'credito_id',
  as: 'historial_estados',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
EstadoCredito.belongsTo(Credito, {
  foreignKey: 'credito_id',
  as: 'credito',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Usuario -> EstadoCredito (1:N) (quien cambia)
Usuario.hasMany(EstadoCredito, {
  foreignKey: 'usuario_id',
  as: 'cambios_estado',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
EstadoCredito.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Relaciones Auditoría (solo referencia, no borrado en cascada)
AuditoriaLog.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario',
  onDelete: 'SET NULL'
});

// Usuario -> Cierres de Caja (1:N)
Usuario.hasMany(CierreCaja, {
  foreignKey: 'usuario_id',
  as: 'cierres',
  onDelete: 'RESTRICT'
});
CierreCaja.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario',
  onDelete: 'RESTRICT'
});

// Usuario -> Notificaciones (1:N)
Usuario.hasMany(Notificacion, {
  foreignKey: 'usuario_id',
  as: 'notificaciones',
  onDelete: 'CASCADE'
});
Notificacion.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

// Credito -> Documentos (1:N)
Credito.hasMany(Documento, {
  foreignKey: 'credito_id',
  as: 'documentos',
  onDelete: 'CASCADE'
});
Documento.belongsTo(Credito, {
  foreignKey: 'credito_id',
  as: 'credito'
});

// Cliente -> Documentos (1:N)
Cliente.hasMany(Documento, {
  foreignKey: 'cliente_id',
  as: 'documentos',
  onDelete: 'CASCADE'
});
Documento.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
  as: 'cliente'
});

// ============================================
// EXPORTAR MODELOS Y SEQUELIZE
// ============================================

module.exports = {
  sequelize,
  Rol,
  Usuario,
  Cliente,
  Credito,
  Amortizacion,
  Pago,
  EstadoCredito,
  AuditoriaLog,
  CierreCaja,
  ModelML,
  Notificacion,
  Documento
};
