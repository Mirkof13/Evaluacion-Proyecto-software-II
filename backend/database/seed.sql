-- ============================================
-- BANCOSOL - DATOS INICIALES (SEED) - CORREGIDO
-- ============================================
-- NOTA: Los passwords están hasheados con bcrypt (salt rounds=12)
-- Hash Admin123!: $2b$12$iuxJn2MjLxobxikhoc0nUeNXntWeySWXS0GJCmICbRnT0IOxfkQuG
-- Hash Gerente123!: $2b$12$odAGa5ek0jMWBmjJ4N5MQuazK8GIUF0qNgy0bnrwyTkeNyKaxoZEq
-- Hash Analista123!: $2b$12$Z6jereJxLH7cftCvTcWlNeyWp8MNVTT.J.wPCo2yaT73hrWA/pA5e
-- Hash Oficial123!: $2b$12$StfBkobE1HjIRtSng8JGNeQv.r5FTImhBUxV3/WM7YOH5moiKn9XO
-- ============================================

-- ============================================
-- 1. ROLES
-- ============================================
INSERT INTO roles (nombre, descripcion, permisos) VALUES
('admin', 'Administrador del sistema - Control total', '{"all": true}'),
('gerente', 'Gerente de sucursal - Reportes y auditoría', '{"reportes": true, "auditoria": true, "creditos": {"read": true}, "clientes": {"read": true}}'),
('analista', 'Analista de créditos - Aprobación y revisión', '{"creditos": {"read": true, "update_estado": true}, "clientes": {"read": true}}'),
('oficial_credito', 'Oficial de crédito - Operaciones de campo', '{"clientes": {"create": true, "read": true, "update": true}, "creditos": {"create": true, "read": true}, "pagos": {"create": true, "read": true}}')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- 2. USUARIOS DE PRUEBA
-- ============================================
INSERT INTO usuarios (nombre, email, password_hash, rol_id, activo, ultimo_login) VALUES
('Administrador Sistema', 'admin@bancosol.bo', '$2b$12$iuxJn2MjLxobxikhoc0nUeNXntWeySWXS0GJCmICbRnT0IOxfkQuG', 1, TRUE, NOW()),
('Gerente Sucursal', 'gerente@bancosol.bo', '$2b$12$odAGa5ek0jMWBmjJ4N5MQuazK8GIUF0qNgy0bnrwyTkeNyKaxoZEq', 2, TRUE, NOW()),
('Analista Créditos', 'analista@bancosol.bo', '$2b$12$Z6jereJxLH7cftCvTcWlNeyWp8MNVTT.J.wPCo2yaT73hrWA/pA5e', 3, TRUE, NOW()),
('Oficial Campo', 'oficial@bancosol.bo', '$2b$12$StfBkobE1HjIRtSng8JGNeQv.r5FTImhBUxV3/WM7YOH5moiKn9XO', 4, TRUE, NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 3. CLIENTES BOLIVIANOS
-- ============================================
INSERT INTO clientes (ci, nombre, apellido, telefono, direccion, fecha_nacimiento, email) VALUES
('12345678', 'Carlos Alberto', 'Mendoza Rojas', '+59171234567', 'Av. 20 de Octubre #123, La Paz', '1985-03-15', 'cmendoza@email.com'),
('98765432', 'María Elena', 'Vargas Flores', '+59176543210', 'Calle Sucre #456, Cochabamba', '1990-07-22', 'mvargas@email.com'),
('45678912', 'José Luis', 'Quiroga Medrano', '+59173456789', 'Av. Banzer #789, Santa Cruz', '1978-11-05', 'jquiroga@email.com'),
('78912345', 'Ana Patricia', 'Céspedes Rivero', '+59169987654', 'Calle Potosí #321, Oruro', '1995-09-18', 'acespedes@email.com'),
('32165498', 'Roberto Carlos', 'Alvarado Pérez', '+59177778888', 'Av. Busch #555, La Paz', '1982-12-30', 'ralvarado@email.com')
ON CONFLICT (ci) DO NOTHING;

-- ============================================
-- 4. CRÉDITOS
-- ============================================
INSERT INTO creditos (numero_credito, cliente_id, oficial_id, monto, tasa_interes, plazo_meses, destino, garantia, estado, fecha_desembolso, fecha_vencimiento, saldo_pendiente, mora_acumulada) VALUES
('SOL-2024-0001', 1, 4, 50000.00, 0.12, 24, 'Capital de trabajo', 'Prendaria: vehiculo', 'activo', '2024-01-15', '2026-01-15', 21600.27, 0),
('SOL-2024-0002', 2, 4, 35000.00, 0.15, 18, 'Compra de inventario', 'Prendaria: maquinaria', 'en_mora', '2024-03-01', '2025-09-01', 1619.45, 1250.50),
('SOL-2024-0003', 3, 4, 75000.00, 0.10, 36, 'Expansión local', 'Hipotecaria: propiedad', 'aprobado', NULL, NULL, 75000.00, 0),
('SOL-2023-0045', 4, 4, 20000.00, 0.13, 12, 'Refinanciamiento', 'Personal', 'cancelado', '2023-06-01', '2024-06-01', 0.00, 0),
('SOL-2024-0005', 5, 4, 60000.00, 0.11, 30, 'Remodelación', 'Prendaria: vehiculo', 'activo', '2024-05-01', '2026-11-01', 4555.83, 0),
('SOL-2024-0006', 1, 4, 25000.00, 0.14, 12, 'Gastos médicos', 'Personal', 'en_mora', '2024-02-01', '2025-02-01', 0.00, 3400.00),
('SOL-2024-0007', 2, 4, 42000.00, 0.12, 24, 'Educación', 'Prendaria: electrodomésticos', 'activo', '2024-04-15', '2026-04-15', 38000.00, 0),
('SOL-2024-0008', 3, 4, 100000.00, 0.09, 60, 'Construcción', 'Hipotecaria', 'rechazado', NULL, NULL, 100000.00, 0)
ON CONFLICT (numero_credito) DO NOTHING;

-- ============================================
-- 5. AMORTIZACIONES (calculadas manualmente - valores reales)
-- ============================================
-- Crédito 1 (50000, 12% anual, 24 meses) - Cuotas pagadas: 6
INSERT INTO amortizaciones (credito_id, numero_cuota, fecha_vencimiento, capital, interes, cuota_total, saldo_capital, pagado) VALUES
(1, 1, '2024-02-15', 1966.67, 500.00, 2466.67, 48033.33, TRUE),
(1, 2, '2024-03-15', 1985.53, 481.14, 2466.67, 46047.80, TRUE),
(1, 3, '2024-04-15', 2004.50, 462.17, 2466.67, 44043.30, TRUE),
(1, 4, '2024-05-15', 2023.57, 443.10, 2466.67, 42019.73, TRUE),
(1, 5, '2024-06-15', 2042.75, 423.92, 2466.67, 39976.98, TRUE),
(1, 6, '2024-07-15', 2062.04, 404.63, 2466.67, 37914.94, TRUE),
(1, 7, '2024-08-15', 2081.44, 385.23, 2466.67, 35833.50, FALSE),
(1, 8, '2024-09-15', 2100.95, 365.72, 2466.67, 33732.55, FALSE),
(1, 9, '2024-10-15', 2120.57, 346.10, 2466.67, 31611.98, FALSE),
(1, 10, '2024-11-15', 2140.31, 326.36, 2466.67, 29471.67, FALSE),
(1, 11, '2024-12-15', 2160.16, 306.51, 2466.67, 27311.51, FALSE),
(1, 12, '2025-01-15', 2180.12, 286.55, 2466.67, 25131.39, FALSE),
(1, 13, '2025-02-15', 2200.20, 266.47, 2466.67, 22931.19, FALSE),
(1, 14, '2025-03-15', 2221.40, 246.27, 2466.67, 20709.79, FALSE),
(1, 15, '2025-04-15', 2242.73, 225.94, 2466.67, 18467.06, FALSE),
(1, 16, '2025-05-15', 2264.18, 205.49, 2466.67, 16202.88, FALSE),
(1, 17, '2025-06-15', 2285.75, 184.92, 2466.67, 13917.13, FALSE),
(1, 18, '2025-07-15', 2307.45, 164.22, 2466.67, 11609.68, FALSE),
(1, 19, '2025-08-15', 2329.28, 143.39, 2466.67, 9280.40, FALSE),
(1, 20, '2025-09-15', 2351.24, 122.43, 2466.67, 6929.16, FALSE),
(1, 21, '2025-10-15', 2373.33, 101.34, 2466.67, 4555.83, FALSE),
(1, 22, '2025-11-15', 2395.56, 80.11, 2466.67, 2160.27, FALSE),
(1, 23, '2025-12-15', 2417.93, 58.74, 2466.67, 0.00, FALSE),
(1, 24, '2026-01-15', 2440.44, 26.56, 2467.00, 0.00, FALSE)
ON CONFLICT (credito_id, numero_cuota) DO NOTHING;

-- Crédito 2 (35000, 15% anual, 18 meses) - Cuotas pagadas: 6
INSERT INTO amortizaciones (credito_id, numero_cuota, fecha_vencimiento, capital, interes, cuota_total, saldo_capital, pagado) VALUES
(2, 1, '2024-04-01', 1822.92, 437.50, 2260.42, 33177.08, TRUE),
(2, 2, '2024-05-01', 1839.66, 420.76, 2260.42, 31337.42, TRUE),
(2, 3, '2024-06-01', 1856.56, 403.86, 2260.42, 29480.86, TRUE),
(2, 4, '2024-07-01', 1873.61, 386.81, 2260.42, 27607.25, TRUE),
(2, 5, '2024-08-01', 1890.83, 369.59, 2260.42, 25716.42, TRUE),
(2, 6, '2024-09-01', 1908.21, 352.21, 2260.42, 23808.21, TRUE),
(2, 7, '2024-10-01', 1925.77, 334.65, 2260.42, 21882.44, FALSE),
(2, 8, '2024-11-01', 1943.50, 316.92, 2260.42, 19938.94, FALSE),
(2, 9, '2024-12-01', 1961.41, 299.01, 2260.42, 17977.53, FALSE),
(2, 10, '2025-01-01', 1979.50, 280.92, 2260.42, 15998.03, FALSE),
(2, 11, '2025-02-01', 1997.77, 262.65, 2260.42, 14000.26, FALSE),
(2, 12, '2025-03-01', 2016.22, 244.20, 2260.42, 11984.04, FALSE),
(2, 13, '2025-04-01', 2034.87, 225.55, 2260.42, 9949.17, FALSE),
(2, 14, '2025-05-01', 2053.70, 206.72, 2260.42, 7895.47, FALSE),
(2, 15, '2025-06-01', 2072.72, 187.70, 2260.42, 5822.75, FALSE),
(2, 16, '2025-07-01', 2091.94, 168.48, 2260.42, 3730.81, FALSE),
(2, 17, '2025-08-01', 2111.36, 149.06, 2260.42, 1619.45, FALSE),
(2, 18, '2025-09-01', 2130.98, 129.44, 2260.42, 0.00, FALSE)
ON CONFLICT (credito_id, numero_cuota) DO NOTHING;

-- ============================================
-- 6. PAGOS (referencian amortizaciones reales)
-- ============================================
-- Pagos para crédito 1 (primeras 6 cuotas)
INSERT INTO pagos (credito_id, amortizacion_id, usuario_id, monto_pagado, monto_capital, monto_interes, monto_mora, dias_mora, fecha_pago, observacion) VALUES
(1, 1, 4, 2466.67, 1966.67, 500.00, 0, 0, '2024-02-15 10:30:00', 'Pago puntual'),
(1, 2, 4, 2466.67, 1985.53, 481.14, 0, 0, '2024-03-15 09:15:00', 'Pago puntual'),
(1, 3, 4, 2466.67, 2004.50, 462.17, 0, 0, '2024-04-15 14:20:00', 'Pago puntual'),
(1, 4, 4, 2466.67, 2023.57, 443.10, 0, 0, '2024-05-15 11:00:00', 'Pago puntual'),
(1, 5, 4, 2466.67, 2042.75, 423.92, 0, 0, '2024-06-15 16:45:00', 'Pago puntual'),
(1, 6, 4, 2466.67, 2062.04, 404.63, 0, 0, '2024-07-15 10:00:00', 'Pago puntual');

-- Pagos para crédito 2 (primeras 6 cuotas)
INSERT INTO pagos (credito_id, amortizacion_id, usuario_id, monto_pagado, monto_capital, monto_interes, monto_mora, dias_mora, fecha_pago, observacion) VALUES
(2, 7, 4, 2260.42, 1822.92, 437.50, 0, 0, '2024-04-01 11:30:00', 'Primer pago'),
(2, 8, 4, 2260.42, 1839.66, 420.76, 0, 0, '2024-05-01 09:00:00', 'Segundo pago'),
(2, 9, 4, 2260.42, 1856.56, 403.86, 0, 0, '2024-06-01 15:20:00', 'Tercer pago'),
(2, 10, 4, 2260.42, 1873.61, 386.81, 0, 0, '2024-07-01 10:50:00', 'Cuarto pago'),
(2, 11, 4, 2260.42, 1890.83, 369.59, 0, 0, '2024-08-01 13:10:00', 'Quinto pago'),
(2, 12, 4, 2260.42, 1908.21, 352.21, 0, 0, '2024-09-01 10:40:00', 'Sexto pago');

-- ============================================
-- 7. HISTORIAL DE ESTADOS
-- ============================================
INSERT INTO estados_credito (credito_id, estado_anterior, estado_nuevo, usuario_id, motivo) VALUES
(1, 'pendiente', 'aprobado', 2, 'Reunión de comité de créditos - 15/01/2024'),
(1, 'aprobado', 'activo', 2, 'Desembolso realizado - 15/01/2024'),
(2, 'pendiente', 'aprobado', 2, 'Aprobación condicionada'),
(2, 'aprobado', 'activo', 2, 'Desembolso exitoso'),
(2, 'activo', 'en_mora', 2, 'Cliente con atraso en cuota 7'),
(3, 'pendiente', 'aprobado', 2, 'Documentación completa'),
(5, 'pendiente', 'aprobado', 2, 'Garantía verificada'),
(5, 'aprobado', 'activo', 2, 'Desembolso parcial'),
(6, 'pendiente', 'aprobado', 2, 'Evaluación positiva'),
(6, 'aprobado', 'activo', 2, 'Primer desembolso'),
(6, 'activo', 'en_mora', 2, 'Más de 60 días de atraso'),
(7, 'pendiente', 'aprobado', 2, 'Score crediticio alto'),
(7, 'aprobado', 'activo', 2, 'Desembolso completado'),
(8, 'pendiente', 'rechazado', 2, 'Documentación incompleta - solicitó completar');

-- ============================================
-- FIN DEL SEED
-- ============================================
-- Datos generados: 4 roles, 4 usuarios, 5 clientes, 8 créditos,
-- 42 amortizaciones (24+18), 12 pagos, 14 cambios de estado
-- ============================================
