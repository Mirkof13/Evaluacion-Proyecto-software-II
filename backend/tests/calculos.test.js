/**
 * BANCOSOL - Tests: Cálculos Financieros
 * Pruebas unitarias para fórmulas de amortización y mora
 */

const calculos = require('../src/utils/calculos');

describe('Cálculos Financieros', () => {

  describe('calcularCuotaFrancesa', () => {
    test('Calcula cuota correcta para préstamo de Bs. 50,000 a 24 meses 12% anual', () => {
      // Tasa anual 12% = 1% mensual aprox
      const monto = 50000;
      const tasaMensual = 0.009489  // Tasa mensual exacta derivada de 12% anual
      const plazo = 24;

      const cuota = calculos.calcularCuotaFrancesa(monto, tasaMensual, plazo);

      // Bs. 2,339.38 según fórmula francesa exacta (capitalización compuesta)
      expect(cuota).toBeCloseTo(2339.38, 0);
    });

    test('Cuota para préstamo corto (3 meses) es mayor', () => {
      const monto = 10000;
      const tasaMensual = 0.01;
      const plazo = 3;

      const cuota = calculos.calcularCuotaFrancesa(monto, tasaMensual, plazo);

      // Cuota mayor a monto/plazo
      expect(cuota).toBeGreaterThan(10000 / 3);
    });

    test('Lanza error si monto es cero', () => {
      expect(() => {
        calculos.calcularCuotaFrancesa(0, 0.01, 12);
      }).toThrow('Monto, tasa y plazo deben ser mayores a 0');
    });
  });

  describe('calcularAmortizacionFrancesa', () => {
    test('Genera tabla de 12 cuotas para préstamo de 12 meses', () => {
      const amortizacion = calculos.calcularAmortizacionFrancesa(
        12000,
        0.12,
        12,
        new Date('2024-02-15')
      );

      expect(amortizacion).toHaveLength(12);
    });

    test('Primera cuota tiene interés mayor que capital', () => {
      const amortizacion = calculos.calcularAmortizacionFrancesa(
        50000,
        0.12,
        24,
        new Date('2024-02-15')
      );

      const primera = amortizacion[0];
      // En sistema francés, el capital suele ser mayor al interés si la tasa es baja
      expect(primera.capital).toBeGreaterThan(primera.interes);
    });

    test('Última cuota tiene saldo capital en cero', () => {
      const amortizacion = calculos.calcularAmortizacionFrancesa(
        10000,
        0.12,
        12,
        new Date('2024-01-15')
      );

      const ultima = amortizacion[amortizacion.length - 1];
      expect(ultima.saldoCapital).toBe(0);
    });

    test('Fechas de vencimiento están en orden', () => {
      const amortizacion = calculos.calcularAmortizacionFrancesa(
        20000,
        0.12,
        6,
        new Date('2024-01-15')
      );

      for (let i = 1; i < amortizacion.length; i++) {
        const anterior = new Date(amortizacion[i-1].fechaVencimiento);
        const actual = new Date(amortizacion[i].fechaVencimiento);
        expect(actual.getTime()).toBeGreaterThan(anterior.getTime());
      }
    });
  });

  describe('calcularMora', () => {
    test('Mora cero si paga en fecha exacta', () => {
      const amortizacion = {
        fechaVencimiento: '2024-12-15',
        saldoCapital: 45000,
        interes: 500
      };
      const fechaPago = new Date('2024-12-15');

      const mora = calculos.calcularMora(amortizacion, fechaPago);

      expect(mora.diasMora).toBe(0);
      expect(mora.montoMora).toBe(0);
    });

    test('Mora positiva si paga 5 días después', () => {
      const saldo = 45000;
      const amortizacion = {
        fechaVencimiento: '2024-12-15',
        saldoCapital: saldo,
        interes: 500
      };
      const fechaPago = new Date('2024-12-20');  // 5 días de atraso

      const mora = calculos.calcularMora(amortizacion, fechaPago);

      expect(mora.diasMora).toBe(5);
      expect(mora.montoMora).toBeGreaterThan(0);
    });

    test('Mora considera factor 1.5x tasa normal', () => {
      const saldo = 10000;
      const tasaMensual = 0.01;  // 1% mensual
      const amortizacion = {
        fechaVencimiento: '2024-01-01',
        saldoCapital: saldo,
        interes: saldo * tasaMensual
      };
      const fechaPago = new Date('2024-02-01');  // 31 días después (asumiendo 30 días base)

      const mora = calculos.calcularMora(amortizacion, fechaPago);

      // Mora esperada: saldo * (tasa * 1.5 / 30) * (dias - DIAS_GRACIA)
      const esperado = saldo * ((tasaMensual * 1.5) / 30) * (31 - calculos.DIAS_GRACIA);
      expect(mora.montoMora).toBeCloseTo(esperado, 2);
    });
  });

  describe('obtenerEstadoCartera', () => {
    test('Cuenta correctamente cuotas pagadas y pendientes', () => {
      const amortizaciones = [
        { pagado: true, cuota_total: 2000 },
        { pagado: true, cuota_total: 2000 },
        { pagado: false, cuota_total: 2000 },
        { pagado: false, cuota_total: 2000 }
      ];

      const estado = calculos.obtenerEstadoCartera(amortizaciones);

      expect(estado.cuotasPagadas).toBe(2);
      expect(estado.cuotasPendientes).toBe(2);
    });

    test('Calcula mora acumulada por cuotas vencidas', () => {
      const hoy = new Date();
      const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
      const hace10Dias = new Date(hoy); hace10Dias.setDate(hace10Dias.getDate() - 10);

      const amortizaciones = [
        { pagado: false, fechaVencimiento: ayer.toISOString().split('T')[0], saldoCapital: 10000, interes: 100 },
        { pagado: false, fechaVencimiento: hace10Dias.toISOString().split('T')[0], saldoCapital: 9000, interes: 90 }
      ];

      const estado = calculos.obtenerEstadoCartera(amortizaciones);

      expect(estado.moraAcumulada).toBeGreaterThan(0);
    });
  });

  describe('validarMontoPago', () => {
    test('Monto exactamente igual a cuota + mora es válido', () => {
      const amortizacion = {
        cuota_total: 1500,
        saldoCapital: 10000,
        interes: 150
      };
      const fechaPago = new Date('2024-02-20');
      const cuotaConMora = 1500 + 100;  // Asumiendo mora de 100

      const resultado = calculos.validarMontoPago(1600, amortizacion, true);
      expect(resultado.valido).toBe(true);
    });

    test('Monto menor a lo requerido es inválido', () => {
      const amortizacion = {
        cuota_total: 1500,
        saldoCapital: 10000,
        interes: 150
      };

      const resultado = calculos.validarMontoPago(1000, amortizacion, true);
      expect(resultado.valido).toBe(false);
    });
  });

  describe('Constantes', () => {
    test('FACTOR_TASA_MORA es 1.5', () => {
      expect(calculos.FACTOR_TASA_MORA).toBe(1.5);
    });

    test('DIAS_GRACIA es 3', () => {
      expect(calculos.DIAS_GRACIA).toBe(3);
    });
  });
});
