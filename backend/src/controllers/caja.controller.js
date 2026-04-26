/**
 * BANCOSOL - Controller: Cierre de Caja
 * Gestión de ingresos diarios y conciliación bancaria
 */

const { Pago, Usuario, CierreCaja, sequelize } = require('../models');
const { Op } = require('sequelize');
const { success, error } = require('../utils/responseHelper');

exports.obtenerResumenCierre = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const pagosHoy = await Pago.findAll({
      where: {
        fecha_pago: { [Op.gte]: hoy }
      },
      include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }]
    });

    const totalCobrado = pagosHoy.reduce((sum, p) => sum + parseFloat(p.monto_pagado), 0);
    const desglose = {
      capital: pagosHoy.reduce((sum, p) => sum + parseFloat(p.monto_capital || 0), 0),
      interes: pagosHoy.reduce((sum, p) => sum + parseFloat(p.monto_interes || 0), 0),
      mora: pagosHoy.reduce((sum, p) => sum + parseFloat(p.monto_mora || 0), 0)
    };

    return success(res, {
      fecha: hoy,
      totalCobrado,
      desglose,
      cantidadPagos: pagosHoy.length,
      detalle: pagosHoy
    });
  } catch (err) {
    return error(res, 'Error al obtener resumen de caja: ' + err.message, 500);
  }
};

exports.ejecutarCierre = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { montoFisico, totalTeorico, desglose, observaciones } = req.body;
    const usuarioId = req.user.id;

    // Persistir el cierre
    const cierre = await CierreCaja.create({
      fecha: new Date(),
      total_teorico: totalTeorico,
      total_fisico: montoFisico,
      diferencia: parseFloat(montoFisico) - parseFloat(totalTeorico),
      desglose_json: desglose,
      usuario_id: usuarioId,
      observaciones
    }, { transaction });

    await transaction.commit();
    
    return success(res, cierre, 'Cierre de caja procesado exitosamente');
  } catch (err) {
    await transaction.rollback();
    return error(res, 'Error al ejecutar cierre: ' + err.message, 500);
  }
};

module.exports = {
  obtenerResumenCierre: exports.obtenerResumenCierre,
  ejecutarCierre: exports.ejecutarCierre
};
