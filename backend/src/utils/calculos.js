/**
 * BANCOSOL - Utilidades de Cálculos Financieros
 * Fórmulas para amortización francesa y cálculo de mora
 * Basado en matemáticas financieras del ASFI Bolivia
 */

const { Op } = require('sequelize');

// ============================================
// CONSTANTES (evitar magic numbers)
// ============================================
const FACTOR_TASA_MORA = 1.5;           // Tasa mora = 1.5x tasa normal
const DIAS_GRACIA = 3;                  // Días de gracia antes de mora
const DIAS_MES_BASE = 30;               // Días mes comercial (30/360)
const REDONDEO_DECIMALES = 4;          // Redondeo cálculos intermedios
const REDONDEO_MONTO = 2;              // Redondeo final (centavos)

/**
 * Calcular tasa mensual desde tasa anual
 * @param {number} tasaAnual - Tasa anual en decimal (ej: 0.12 = 12%)
 * @returns {number} Tasa mensual
 */
const tasaMensualDesdeAnual = (tasaAnual) => {
  if (tasaAnual >= 1) {
    throw new Error('La tasa anual debe estar en decimal (ej: 0.12 para 12%)');
  }
  // Fórmula: (1 + i_anual)^(1/12) - 1
  return Math.pow(1 + tasaAnual, 1 / 12) - 1;
};

/**
 * Calcular cuota mensual con sistema francés (amortización constante progresiva)
 * Fórmula: A = P * [i * (1+i)^n] / [(1+i)^n - 1]
 *
 * @param {number} monto - Monto del préstamo
 * @param {number} tasaMensual - Tasa de interés mensual (decimal)
 * @param {number} plazoMeses - Número de cuotas (meses)
 * @returns {number} Cuota mensual total
 */
const calcularCuotaFrancesa = (monto, tasaMensual, plazoMeses) => {
  if (monto <= 0 || tasaMensual <= 0 || plazoMeses <= 0) {
    throw new Error('Monto, tasa y plazo deben ser mayores a 0');
  }

  const { pow } = Math;

  // (1 + i)^n
  const factor = pow(1 + tasaMensual, plazoMeses);

  // Cuota = P * (i * factor) / (factor - 1)
  let cuota = monto * (tasaMensual * factor) / (factor - 1);

  // Redondear a 2 decimales
  return Math.round(cuota * 100) / 100;
};

/**
 * Generar tabla completa de amortización
 *
 * @param {number} monto - Monto del préstamo
 * @param {number} tasaInteresAnual - Tasa anual en decimal (ej: 0.12)
 * @param {number} plazoMeses - Plazo en meses
 * @param {Date} fechaPrimerVencimiento - Fecha de primera cuota
 * @returns {Array} Tabla de amortización
 *
 * Estructura de cada cuota:
 * {
 *   numeroCuota: 1,
 *   fechaVencimiento: '2024-02-15',
 *   capital: 1845.23,
 *   interes: 500.00,
 *   cuotaTotal: 2345.23,
 *   saldoCapital: 48154.77,
 *   pagado: false
 * }
 */
const calcularAmortizacionFrancesa = (monto, tasaInteresAnual, plazoMeses, fechaPrimerVencimiento) => {
  // Validaciones
  if (!monto || monto <= 0) throw new Error('Monto inválido');
  if (!tasaInteresAnual || tasaInteresAnual <= 0) throw new Error('Tasa de interés inválida');
  if (!plazoMeses || plazoMeses <= 0) throw new Error('Plazo inválido');
  if (!fechaPrimerVencimiento) throw new Error('Fecha de primer vencimiento requerida');

  // Convertir tasa anual a mensual
  const tasaMensual = tasaMensualDesdeAnual(tasaInteresAnual);

  // Calcular cuota fija mensual
  const cuotaMensual = calcularCuotaFrancesa(monto, tasaMensual, plazoMeses);

  const amortizacion = [];
  let saldoCapital = monto;
  const fechaBase = new Date(fechaPrimerVencimiento);

  for (let cuotaNum = 1; cuotaNum <= plazoMeses; cuotaNum++) {
    // Calcular interés del período: saldo * tasa
    const interes = Math.round(saldoCapital * tasaMensual * 100) / 100;

    // Capital = cuota - interés
    let capital = cuotaMensual - interes;

    // Ajuste última cuota (por redondeos)
    if (cuotaNum === plazoMeses) {
      capital = saldoCapital;
      const cuotaFinal = capital + interes;
      // Asegurar que no exceda saldo
      if (cuotaFinal > saldoCapital + interes) {
        capital = saldoCapital;
      }
    }

    // Actualizar saldo
    saldoCapital = Math.round((saldoCapital - capital) * 100) / 100;

    // Evitar saldo negativo por redondeo
    if (saldoCapital < 0) saldoCapital = 0;

    // Calcular fecha de vencimiento (sumar mes a mes)
    const fechaVencimiento = new Date(fechaBase);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (cuotaNum - 1));
    const fechaStr = fechaVencimiento.toISOString().split('T')[0];

    amortizacion.push({
      numeroCuota: cuotaNum,
      fechaVencimiento: fechaStr,
      capital: parseFloat(capital.toFixed(REDONDEO_MONTO)),
      interes: parseFloat(interes.toFixed(REDONDEO_MONTO)),
      cuotaTotal: parseFloat((capital + interes).toFixed(REDONDEO_MONTO)),
      saldoCapital: parseFloat(saldoCapital.toFixed(REDONDEO_MONTO)),
      pagado: false
    });
  }

  return amortizacion;
};

/**
 * Calcular mora para una amortización vencida
 *
 * @param {Object} amortizacion - Cuota vencida (con saldoCapital, fechaVencimiento, interes)
 * @param {Date} fechaPago - Fecha en que se realiza el pago
 * @returns {Object} { diasMora, tasaMora, montoMora }
 */
const calcularMora = (amortizacion, fechaPago) => {
  if (!amortizacion) {
    throw new Error('Amortización requerida');
  }

  const fechaVencimiento = new Date(amortizacion.fechaVencimiento);
  const fechaPagoDate = new Date(fechaPago);

  // Solo calcular mora si el pago es posterior al vencimiento
  if (fechaPagoDate <= fechaVencimiento) {
    return {
      diasMora: 0,
      tasaMora: 0,
      montoMora: 0
    };
  }

  // Días de mora (después de fecha vencimiento)
  const diffTime = fechaPagoDate - fechaVencimiento;
  let diasMora = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Seguridad contra fechas inválidas o resultados NaN
  if (isNaN(diasMora)) diasMora = 0;

  // Si hay días de gracia, descontarlos
  const diasEfectivosMora = Math.max(0, diasMora - DIAS_GRACIA);

  if (diasEfectivosMora === 0) {
    return {
      diasMora: 0,
      tasaMora: 0,
      montoMora: 0
    };
  }

  // Tasa de mora = 1.5x tasa nominal mensual del crédito
  const saldoNominal = parseFloat(amortizacion.saldoCapital) || 0;
  if (saldoNominal <= 0) return { diasMora, tasaMora: 0, montoMora: 0 };

  let tasaMensualNormal = parseFloat(amortizacion.interes) / saldoNominal;
  if (isNaN(tasaMensualNormal)) tasaMensualNormal = 0;
  
  const tasaMora = tasaMensualNormal * FACTOR_TASA_MORA;

  // Monto mora = saldo capital * tasa mora * (días / 30)
  let montoMora = saldoNominal * (tasaMora / DIAS_MES_BASE) * diasEfectivosMora;
  if (isNaN(montoMora)) montoMora = 0;

  return {
    diasMora: diasMora,
    tasaMora: parseFloat(tasaMora.toFixed(REDONDEO_DECIMALES)),
    montoMora: Math.round(montoMora * 100) / 100
  };
};

/**
 * Obtener estado actual de la cartera de un crédito
 *
 * @param {number} creditoId - ID del crédito
 * @param {Object} amortizaciones - Array de amortizaciones del crédito
 * @returns {Object} { cuotasPagadas, cuotasPendientes, moraAcumulada, saldoTotal }
 */
const obtenerEstadoCartera = (amortizaciones) => {
  if (!amortizaciones || !Array.isArray(amortizaciones)) {
    return {
      cuotasPagadas: 0,
      cuotasPendientes: 0,
      moraAcumulada: 0,
      saldoTotal: 0
    };
  }

  let cuotasPagadas = 0;
  let cuotasPendientes = 0;
  let moraAcumulada = 0;
  let saldoTotal = 0;

  const hoy = new Date();

  amortizaciones.forEach(cuota => {
    if (cuota.pagado) {
      cuotasPagadas++;
    } else {
      cuotasPendientes++;
      // Calcular mora si está vencida
      if (new Date(cuota.fechaVencimiento) < hoy) {
        const mora = calcularMora(cuota, hoy);
        moraAcumulada += mora.montoMora;
        cuota.mora = mora.montoMora;
        cuota.totalApagar = parseFloat(cuota.cuotaTotal) + parseFloat(mora.montoMora);
        cuota.diasMora = mora.diasMora;
      }
    }
    saldoTotal += cuota.saldoCapital;
  });

  return {
    cuotasPagadas,
    cuotasPendientes,
    moraAcumulada: Math.round(moraAcumulada * 100) / 100,
    saldoTotal: Math.round(saldoTotal * 100) / 100
  };
};

/**
 * Calcular número de cuotas vencidas y no pagadas
 */
const contarCuotasVencidas = (amortizaciones) => {
  if (!amortizaciones) return 0;

  const hoy = new Date();
  return amortizaciones.filter(cuota =>
    !cuota.pagado && new Date(cuota.fechaVencimiento) < hoy
  ).length;
};

/**
 * Validar que un monto de pago sea suficiente para la cuota
 */
const validarMontoPago = (montoPagado, amortizacion, incluirMora = true) => {
  const { montoMora } = calcularMora(amortizacion, new Date());
  const cuotaBase = parseFloat(amortizacion.cuotaTotal || amortizacion.cuota_total) || 0;
  const cuotaTotal = cuotaBase + (incluirMora ? montoMora : 0);

  if (montoPagado < cuotaTotal) {
    return {
      valido: false,
      mensaje: `Monto insuficiente. Cuota total: Bs. ${cuotaTotal.toFixed(2)}`
    };
  }

  return {
    valido: true,
    mensaje: 'Monto válido'
  };
};

module.exports = {
  // Constantes
  FACTOR_TASA_MORA,
  DIAS_GRACIA,
  DIAS_MES_BASE,

  // Funciones principales
  calcularCuotaFrancesa,
  calcularAmortizacionFrancesa,
  calcularMora,
  obtenerEstadoCartera,
  contarCuotasVencidas,
  validarMontoPago,

  // Helper
  tasaMensualDesdeAnual
};
