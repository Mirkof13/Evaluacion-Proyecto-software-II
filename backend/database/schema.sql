-- ============================================
-- BANCOSOL - GESTIÓN DE CARTERA DE CRÉDITOS
-- Base de datos: PostgreSQL 15
-- Arquitectura: N-Capas con integridad ACID
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA 1: ROLES (Control de Acceso IAM)
-- ============================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas por nombre
CREATE INDEX idx_roles_nombre ON roles(nombre);

-- Roles del sistema
INSERT INTO roles (nombre, descripcion, permisos) VALUES
('admin', 'Administrador del sistema - Control total', '{"all": true}'),
('gerente', 'Gerente de sucursal - Reportes y auditoría', '{"reportes": true, "auditoria": true, "creditos": {"read": true}, "clientes": {"read": true}}'),
('analista', 'Analista de créditos - Aprobación y revisión', '{"creditos": {"read": true, "update_estado": true}, "clientes": {"read": true}}'),
('oficial_credito', 'Oficial de crédito - Operaciones de campo', '{"clientes": {"create": true, "read": true, "update": true}, "creditos": {"create": true, "read": true}, "pagos": {"create": true, "read": true}}');

-- ============================================
-- TABLA 2: USUARIOS (Autenticación + IAM)
-- ============================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraint: email válido
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- ============================================
-- TABLA 3: CLIENTES (Validación CI única)
-- ============================================
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    ci VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    email VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraint: CI formato boliviano (7-8 dígitos)
    CONSTRAINT chk_ci_format CHECK (ci ~ '^[0-9]{7,8}$'),

    -- Constraint: fecha nacimiento razonable
    CONSTRAINT chk_fecha_nacimiento CHECK (fecha_nacimiento <= CURRENT_DATE AND fecha_nacimiento > '1900-01-01')
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_clientes_ci ON clientes(ci);
CREATE INDEX idx_clientes_nombre ON clientes(nombre);
CREATE INDEX idx_clientes_activo ON clientes(activo);

-- ============================================
-- TABLA 4: CRÉDITOS (Integridad transaccional)
-- ============================================
CREATE TABLE creditos (
    id SERIAL PRIMARY KEY,
    numero_credito VARCHAR(50) UNIQUE NOT NULL,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    oficial_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    monto DECIMAL(15,2) NOT NULL CHECK (monto > 0),
    tasa_interes DECIMAL(5,4) NOT NULL CHECK (tasa_interes > 0 AND tasa_interes < 1),
    plazo_meses INTEGER NOT NULL CHECK (plazo_meses > 0 AND plazo_meses <= 360),
    destino VARCHAR(200),
    garantia VARCHAR(200),
    estado VARCHAR(30) DEFAULT 'pendiente' CHECK (
        estado IN ('pendiente', 'aprobado', 'rechazado', 'activo', 'al_dia', 'en_mora', 'cancelado', 'castigado')
    ),
    fecha_desembolso DATE,
    fecha_vencimiento DATE,
    saldo_pendiente DECIMAL(15,2) DEFAULT 0,
    mora_acumulada DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraint: fecha vencimiento posterior a desembolso
    CONSTRAINT chk_fechas_credito CHECK (
        fecha_vencimiento IS NULL OR
        fecha_desembolso IS NULL OR
        fecha_vencimiento > fecha_desembolso
    )
);

-- Índices críticos para reportes y búsquedas
CREATE INDEX idx_creditos_cliente ON creditos(cliente_id);
CREATE INDEX idx_creditos_oficial ON creditos(oficial_id);
CREATE INDEX idx_creditos_estado ON creditos(estado);
CREATE INDEX idx_creditos_fecha_vencimiento ON creditos(fecha_vencimiento);
CREATE INDEX idx_creditos_numero ON creditos(numero_credito);

-- ============================================
-- TABLA 5: AMORTIZACIONES (Cálculo automático auditable)
-- ============================================
CREATE TABLE amortizaciones (
    id SERIAL PRIMARY KEY,
    credito_id INTEGER NOT NULL REFERENCES creditos(id) ON DELETE CASCADE,
    numero_cuota INTEGER NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    capital DECIMAL(15,2) NOT NULL,
    interes DECIMAL(15,2) NOT NULL,
    cuota_total DECIMAL(15,2) NOT NULL,
    saldo_capital DECIMAL(15,2) NOT NULL,
    pagado BOOLEAN DEFAULT FALSE,
    fecha_pago DATE,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_cuota_positive CHECK (cuota_total > 0),
    CONSTRAINT chk_saldo_positive CHECK (saldo_capital >= 0)
);

-- Índices para consultas de amortización
CREATE INDEX idx_amortizaciones_credito ON amortizaciones(credito_id);
CREATE INDEX idx_amortizaciones_vencimiento ON amortizaciones(fecha_vencimiento);
CREATE UNIQUE INDEX uq_amortizacion_unica ON amortizaciones(credito_id, numero_cuota);

-- ============================================
-- TABLA 6: PAGOS (Trazabilidad financiera)
-- ============================================
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    credito_id INTEGER NOT NULL REFERENCES creditos(id) ON DELETE CASCADE,
    amortizacion_id INTEGER REFERENCES amortizaciones(id) ON DELETE SET NULL,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    monto_pagado DECIMAL(15,2) NOT NULL CHECK (monto_pagado > 0),
    monto_capital DECIMAL(15,2) DEFAULT 0,
    monto_interes DECIMAL(15,2) DEFAULT 0,
    monto_mora DECIMAL(15,2) DEFAULT 0,
    dias_mora INTEGER DEFAULT 0,
    fecha_pago TIMESTAMP DEFAULT NOW(),
    tipo VARCHAR(30) DEFAULT 'cuota' CHECK (tipo IN ('cuota', ' anticipo', 'reprogramacion', 'castigo')),
    observacion TEXT,
    comprobante_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para reportería de pagos
CREATE INDEX idx_pagos_credito ON pagos(credito_id);
CREATE INDEX idx_pagos_usuario ON pagos(usuario_id);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX idx_pagos_tipo ON pagos(tipo);

-- ============================================
-- TABLA 7: ESTADOS_CRÉDITO (Historial de cambios)
-- ============================================
CREATE TABLE estados_credito (
    id SERIAL PRIMARY KEY,
    credito_id INTEGER NOT NULL REFERENCES creditos(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30) NOT NULL,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    motivo TEXT,
    datos_adicionales JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para consultar historial por crédito
CREATE INDEX idx_estados_credito_credito ON estados_credito(credito_id);
CREATE INDEX idx_estados_credito_fecha ON estados_credito(created_at);

-- ============================================
-- TABLA 8: AUDITORIA_LOG (Corazón Forense - ISO 27001)
-- ============================================
CREATE TABLE auditoria_log (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_email VARCHAR(100),
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id INTEGER,
    datos_antes JSONB,
    datos_despues JSONB,
    ip_origen VARCHAR(45),
    user_agent TEXT,
    endpoint VARCHAR(200) NOT NULL,
    metodo_http VARCHAR(10) NOT NULL CHECK (metodo_http IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    resultado VARCHAR(20) DEFAULT 'exitoso' CHECK (resultado IN ('exitoso', 'fallido')),
    codigo_respuesta INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Constraint: al menos uno de usuario_id o usuario_email debe estar presente
    CONSTRAINT chk_usuario_presente CHECK (usuario_id IS NOT NULL OR usuario_email IS NOT NULL)
);

-- Índices para consultas forenses rápidas
CREATE INDEX idx_auditoria_usuario ON auditoria_log(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria_log(created_at);
CREATE INDEX idx_auditoria_tabla ON auditoria_log(tabla_afectada);
CREATE INDEX idx_auditoria_accion ON auditoria_log(accion);
CREATE INDEX idx_auditoria_ip ON auditoria_log(ip_origen);
CREATE INDEX idx_auditoria_general ON auditoria_log(usuario_id, tabla_afectada, created_at);

-- ============================================
-- TRIGGERS para actualización automática de timestamps
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas con updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creditos_updated_at BEFORE UPDATE ON creditos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VISTAS para reportes frecuentes
-- ============================================

-- Vista: Resumen de cartera por oficial
CREATE OR REPLACE VIEW vw_cartera_por_oficial AS
SELECT
    u.id AS oficial_id,
    u.nombre AS oficial_nombre,
    COUNT(cr.id) AS total_creditos,
    SUM(cr.monto) AS monto_total,
    SUM(CASE WHEN cr.estado = 'en_mora' THEN cr.monto ELSE 0 END) AS monto_mora,
    SUM(CASE WHEN cr.estado = 'activo' OR cr.estado = 'al_dia' THEN cr.monto ELSE 0 END) AS monto_activo
FROM usuarios u
LEFT JOIN creditos cr ON u.id = cr.oficial_id
WHERE u.rol_id = (SELECT id FROM roles WHERE nombre = 'oficial_credito')
GROUP BY u.id, u.nombre;

-- Vista: Resumen de morosidad mensual
CREATE OR REPLACE VIEW vw_morosidad_mensual AS
SELECT
    DATE_TRUNC('month', a.fecha_vencimiento) AS mes,
    COUNT(DISTINCT cr.id) AS total_creditos,
    COUNT(DISTINCT CASE WHEN a.pagado = FALSE AND a.fecha_vencimiento < CURRENT_DATE THEN cr.id END) AS creditos_mora,
    ROUND(
        COUNT(DISTINCT CASE WHEN a.pagado = FALSE AND a.fecha_vencimiento < CURRENT_DATE THEN cr.id END)::NUMERIC /
        NULLIF(COUNT(DISTINCT cr.id), 0) * 100,
        2
    ) AS porcentaje_mora
FROM creditos cr
JOIN amortizaciones a ON cr.id = a.credito_id
GROUP BY DATE_TRUNC('month', a.fecha_vencimiento)
ORDER BY mes DESC;

-- ============================================
-- COMENTARIOS en tablas (documentación integrada)
-- ============================================
COMMENT ON TABLE roles IS 'Catálogo de roles del sistema con permisos granulares (IAM)';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con autenticación JWT y control de acceso por rol';
COMMENT ON TABLE clientes IS 'Clientes del banco con validación de CI boliviano (7-8 dígitos)';
COMMENT ON TABLE creditos IS 'Créditos otorgados con integridad transaccional ACID';
COMMENT ON TABLE amortizaciones IS 'Tabla de amortización calculada con fórmula francesa (Auditable)';
COMMENT ON TABLE pagos IS 'Registro de pagos con desglose capital/interés/mora (Trazabilidad)';
COMMENT ON TABLE estados_credito IS 'Historial completo de cambios de estado (No Repudio)';
COMMENT ON TABLE auditoria_log IS 'Bitácora forense inmutable para cumplimiento ISO 27001 y ASFI';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Para ejecutar: psql -U postgres -d bancosol_db -f schema.sql
-- Verificar: SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
