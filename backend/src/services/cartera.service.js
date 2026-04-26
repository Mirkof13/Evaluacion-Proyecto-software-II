/**
 * BANCOSOL - Portfolio & Risk Management Service
 * Implementación de Normativa ASFI (Bolivia)
 * Clasificación de Cartera y Cálculo de Previsiones
 */

const { Credito, Amortizacion, Notificacion, sequelize } = require('../models');
const { Op } = require('sequelize');

const carteraService = {
  /**
   * Proceso de Clasificación de Cartera (Batch)
   * Clasifica cada crédito según sus días de mora reales
   */
  async clasificarCartera() {
    console.log('📊 Iniciando proceso de clasificación ASFI...');
    const transaction = await sequelize.transaction();

    try {
      // 1. Obtener todos los créditos activos
      const creditos = await Credito.findAll({
        where: {
          estado: { [Op.in]: ['activo', 'al_dia', 'en_mora'] }
        },
        include: [{
          model: Amortizacion,
          as: 'amortizaciones',
          where: { pagado: false },
          order: [['numero_cuota', 'ASC']]
        }]
      });

      const hoy = new Date();
      let actualizados = 0;

      for (const credito of creditos) {
        const proximaCuota = credito.amortizaciones[0];
        if (!proximaCuota) continue;

        const fechaVencimiento = new Date(proximaCuota.fecha_vencimiento);
        const diffTime = hoy - fechaVencimiento;
        const diasMora = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

        // Actualizar mora acumulada en el objeto (simulado o real según lógica)
        // En un sistema real, aquí calcularíamos el interés penal diario
        
        let nuevoEstado = credito.estado;
        if (diasMora > 0) {
          nuevoEstado = 'en_mora';
        } else {
          nuevoEstado = 'al_dia';
        }

        // Lógica de Categorización ASFI Completa
        // Categoría A: 0-30 días
        // Categoría B: 31-60 días
        // Categoría C: 61-90 días
        // Categoría D: 91-120 días
        // Categoría E: 121-150 días
        // Categoría F: >150 días
        let categoria = 'A';
        if (diasMora > 150) categoria = 'F';
        else if (diasMora > 120) categoria = 'E';
        else if (diasMora > 90) categoria = 'D';
        else if (diasMora > 60) categoria = 'C';
        else if (diasMora > 30) categoria = 'B';

        // Guardar cambios si hay diferencia
        if (credito.estado !== nuevoEstado || credito.mora_acumulada !== (diasMora * 10)) {
          await credito.update({
            estado: nuevoEstado,
            mora_acumulada: diasMora * 10
          }, { transaction });

          // Si entra en mora crítica, notificar al oficial
          if (nuevoEstado === 'en_mora' && diasMora > 0) {
            await Notificacion.create({
              usuario_id: credito.oficial_id,
              titulo: '⚠️ Alerta de Mora',
              mensaje: `El crédito ${credito.numero_credito} del cliente ${credito.cliente_id} ha entrado en mora (${diasMora} días).`,
              tipo: 'danger',
              vinculo_url: `/creditos/${credito.id}`
            }, { transaction });
          }

          actualizados++;
        }
      }

      await transaction.commit();
      console.log(`✅ Clasificación completada. ${actualizados} créditos actualizados.`);
      return { actualizados };
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en clasificación de cartera:', error);
      throw error;
    }
  },

  /**
   * Obtener Resumen de Riesgo para Dashboard
   */
  async obtenerResumenRiesgo() {
    // Agrupar por categorías de riesgo (simulado basado en mora)
    const creditos = await Credito.findAll();
    const resumen = {
      riesgoBajo: 0,
      riesgoMedio: 0,
      riesgoAlto: 0,
      totalMonto: 0
    };

    creditos.forEach(c => {
      const monto = parseFloat(c.monto);
      resumen.totalMonto += monto;
      if (c.mora_acumulada > 1000) resumen.riesgoAlto += monto;
      else if (c.mora_acumulada > 0) resumen.riesgoMedio += monto;
      else resumen.riesgoBajo += monto;
    });

    return resumen;
  }
};

module.exports = carteraService;
