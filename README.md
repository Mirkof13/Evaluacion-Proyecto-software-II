# BancoSol — Sistema de Gestión de Cartera de Créditos

**Ingeniería de Software II — Hito 3 — Proyecto Fullstack Completo**

Sistema bancario completo para gestión de cartera, implementando principios de ciberseguridad como **control de acceso IAM, auditoría forense (ISO 27001), e integridad transaccional (CAP/ACID)**.

---

## 📋 Contexto

BancoSolidario Bolivia (BancoSol) necesitaba reemplazar su sistema del 2005 que:

- No calculaba automáticamente moras (intereses sobre intereses)
- No generaba reportes para ASFI (Autoridad de Supervisión)
- No visualizaba estado de cartera por oficial
- No mantenía bitácora forense de quién modificó cada crédito

Este sistema resuelve todo eso implementando arquitectura N-Capas con Node.js + React + PostgreSQL.

---

## 🏗️ Arquitectura

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + Express.js v4 |
| Frontend | React 18 + Vite + React Router v6 |
| Base de Datos | PostgreSQL 15 |
| ORM | Sequelize v6 |
| Autenticación | JWT + bcrypt (salt rounds=12) |
| UI | Bootstrap 5.3 + React-Bootstrap |
| Gráficos | Chart.js + react-chartjs-2 |

### Estructura N-Capas (3-Tier)

```
bancosol-sistema/
├── backend/               # Capa de Negocio + Datos
│   ├── src/
│   │   ├── config/        # Configuración BD y JWT
│   │   ├── middleware/    # Auth, roles, auditoría
│   │   ├── models/        # Modelos Sequelize
│   │   ├── controllers/   # Controladores REST
│   │   ├── services/      # Lógica de negocio
│   │   └── utils/         # Cálculos financieros
│   └── database/          # Schema SQL y seed
└── frontend/              # Capa de Presentación
    └── src/
        ├── api/           # Cliente HTTP
        ├── context/       # Auth Context
        ├── components/    # Navbar, Sidebar, etc.
        └── pages/         # 10 pantallas
```

---

## 🔐 Características de Ciberseguridad

### 1. No Repudio (ISO 27001)

Bitácora forense inmutable (`auditoria_log`) que registra:

- Identidad del operador (usuario_id + email)
- Timestamp UTC con precisión de milisegundos
- IP de origen (x-forwarded-for)
- User-Agent completo
- **Diferencial JSON**: datos_antes vs datos_despues
- Método HTTP y endpoint
- Código de resultado HTTP

### 2. Control de Acceso (IAM)

4 roles granulares:

| Rol | Permisos |
|-----|----------|
| **admin** | Control total + gestión usuarios + bitácora completa |
| **gerente** | Reportes + bitácora |
| **analista** | Ver todos créditos + aprobar/rechazar |
| **oficial_credito** | Crear clientes, créditos, registrar pagos (solo propios) |

Implementado con:

- Middleware `auth.js`: valida JWT en cada request
- Middleware `roles.js`: verifica rol por endpoint
- Frontend: `ProtectedRoute.jsx` redirige si no autorizado

### 3. Integridad de Datos (CAP Theorem)

- **Consistencia Fuerte (CP)**: PostgreSQL con transacciones ACID
- **Isolation Level**: SERIALIZABLE para modificaciones concurrentes
- **Foreign Keys** con `ON DELETE RESTRICT` para integridad referencial
- **Check Constraints**: CI boliviano, tasas entre 0-100%, etc.

### 4. Confidencialidad

- Passwords hasheados con **bcrypt** (salt rounds=12)
- JWT firmados con secreto de 256+ bits (HMAC-SHA256)
- Tokens expiran en 8 horas
- Campos sensibles ocultados en respuestas (`password_hash` nunca se envía)

---

## 📊 Base de Datos — 8 Tablas

### Diagrama Relacional

```
roles (1) ────< usuarios >────(N) creditos
                         │
                         │
     clientes (1) ────< creditos >────(N) amortizaciones
                                     │
                                     ├───(N) pagos
                                     ├───(N) estados_credito
                                     └───(1) (dueño oficial)
                         │
auditoria_log >───(N) (todos)
```

### Tabla auditoria_log (Forence)

```sql
CREATE TABLE auditoria_log (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER,
  usuario_email VARCHAR(100),
  accion VARCHAR(50),           -- CREAR, ACTUALIZAR, ELIMINAR
  tabla_afectada VARCHAR(50),   -- creditos, clientes, etc.
  registro_id INTEGER,
  datos_antes JSONB,            -- Snapshot ANTES del cambio
  datos_despues JSONB,          -- Snapshot DESPUÉS del cambio
  ip_origen VARCHAR(45),
  user_agent TEXT,
  endpoint VARCHAR(200),
  metodo_http VARCHAR(10),
  resultado VARCHAR(20),        -- exitoso / fallido
  created_at TIMESTAMP DEFAULT NOW()
);
-- Índice GIST para búsquedas JSONB rápidas: (tabla_afectada, created_at)
```

---

## 🔄 Flujo de Negocio

### 1. Crear Crédito (Wizard de 2 pasos)

```
Oficial → Buscar Cliente (por CI) → Seleccionar → Configurar (monto, tasa, plazo) → Calcular cuota en tiempo real → Guardar
   ↓
Backend: crearCrédito()
   → Generar número unique (SOL-2024-0001)
   → Calcular tabla amortización completa (fórmula francesa)
   → Insertar 24/36/60 registros en amortizaciones
   → Registrar en estados_credito (origen: 'pendiente')
   → Auditoría: INSERT en auditoria_log
```

### 2. Registrar Pago

```
Oficial → Ir a Detalle Crédito → Click "Registrar Pago"
   → Sistema calcula mora automáticamente
   → Monto pre-llenado: cuota + mora
   → Confirmar
   ↓
Backend: registrarPago()
   → Iniciar transacción
   → Calcular mora: días_retraso × (tasa × 1.5) / 30
   → Insertar registro en pagos
   → Marcar amortización como pagada
   → Actualizar saldo_pendiente del crédito
   → Cambiar estado: si todo pagado → 'cancelado', si atrasado → 'en_mora'
   → Commit
   → Auditoría: UPDATE con diff completo
```

### 3. Aprobación de Crédito

```
Analista/Gerente → Lista créditos en "pendiente" → Click "Aprobar"
   → Modal: ingresar motivo
   ↓
Backend: cambiarEstado('aprobado')
   → Validar transición válida (pendiente → aprobado ✓, rechazado ✓)
   → Insertar en estados_credito
   → Si 'activo', actualizar fecha_desembolso
   → Auditoría
```

---

## 📈 Reportes Gerenciales

### 1. Cartera por Estado (Barras)
**Query:**
```sql
SELECT estado, SUM(monto) AS total, COUNT(*) AS cantidad
FROM creditos
GROUP BY estado
ORDER BY total DESC;
```

### 2. Morosidad Mensual (Líneas)
**Cálculo:**
```sql
SELECT
  DATE_TRUNC('month', a.fecha_vencimiento) AS mes,
  COUNT(DISTINCT cr.id) AS total_creditos,
  COUNT(DISTINCT CASE WHEN a.pagado = FALSE AND a.fecha_vencimiento < NOW() THEN cr.id END) AS creditos_mora,
  ROUND( creditos_mora / total_creditos * 100, 2) AS %_mora
FROM creditos cr
JOIN amortizaciones a ON cr.id = a.credito_id
GROUP BY mes
ORDER BY mes DESC
LIMIT 6;
```

### 3. Distribución por Oficial (Dona)
**Query:**
```sql
SELECT
  u.nombre,
  SUM(cr.monto) AS monto_total
FROM usuarios u
JOIN creditos cr ON u.id = cr.oficial_id
GROUP BY u.id, u.nombre;
```

---

## 🛡️ Principios SOLID Aplicados

| Principio | Ejemplo en BancoSol |
|-----------|---------------------|
| **S** – Single Responsibility | `auditoria.middleware.js` solo graba logs. `credito.service.js` solo calcula financiero |
| **O** – Open/Closed | Sistema de permisos por JSON configurable. Agregar rol nuevo sin tocar middleware |
| **L** – Liskov Substitution | Todos los services retornan `{ success, data, message }`. Intercambiables |
| **I** – Interface Segregation | Routers separados por dominio (auth, clientes, creditos). Cada controller solo importa su service |
| **D** – Dependency Inversion | Controllers dependen de `creditoService` (abstracción), no de Sequelize directo |

---

## 🔧 Instalación y Ejecución

### Prerrequisitos

- Node.js v18+ (recomendado v20 LTS)
- PostgreSQL v15+
- Git

### Pasos

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd bancosol-sistema

# 2. Configurar backend
cd backend
npm install

# Crear base de datos PostgreSQL
createdb -U postgres bancosol_db

# Copiar variables de entorno
cp .env.example .env
# Editar .env:
#   DB_PASSWORD=tu_password_postgres
#   JWT_SECRET=clave_secreta_min_256_bits

# Ejecutar migraciones
npm run db:migrate

# Cargar datos de prueba
npm run db:seed

# Arrancar servidor (modo desarrollo)
npm run dev
# Servidor en http://localhost:5000
```

```bash
# 3. Configurar frontend
cd ../frontend
npm install

# Variables de entorno (opcional)
# VITE_API_URL=http://localhost:5000/api

# Arrancar frontend
npm run dev
# Frontend en http://localhost:3000
```

### Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@bancosol.bo | Admin123! | admin |
| gerente@bancosol.bo | Gerente123! | gerente |
| analista@bancosol.bo | Analista123! | analista |
| oficial@bancosol.bo | Oficial123! | oficial_credito |

---

## 🧪 Tests Automatizados

```bash
cd backend
npm test

# Salida esperada:
# PASS  tests/calculos.test.js (12 tests)
# PASS  tests/auth.test.js (8 tests)
# PASS  tests/credito.test.js (6 tests)
# -------------|---------|----------|---------|---------|-------------------
# Total tests  |    26   |    26    |    0    |
```

**Cobertura mínima esperada:** 80% en servicios financieros.

---

## 📁 Archivos Clave

### Backend

| Archivo | Descripción |
|---------|-------------|
| `server.js` | Entry point Express (CORS, morgan, error handler) |
| `src/config/database.js` | Sequelize + pool (5 conexiones) |
| `src/config/jwt.js` | Generación y verificación de tokens |
| `src/middleware/auditoria.js` | ⭐ Pieza forense (captura diff) |
| `src/services/credito.service.js` | Amortización francesa + transacciones |
| `src/utils/calculos.js` | Fórmulas financieras (constantes claras) |
| `database/schema.sql` | 8 tablas + triggers + vistas |

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/context/AuthContext.jsx` | Estado global de autenticación |
| `src/api/axios.js` | Interceptors JWT (agrega token automáticamente) |
| `src/components/ProtectedRoute.jsx` | Verifica rol por página |
| `src/pages/Auditoria.jsx` | Tabla forense con modal de diff JSON |
| `src/pages/Reportes.jsx` | 3 gráficos Chart.js con export PNG |

---

## 🚀 API REST — 18 Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/auth/login` | * | Autenticación JWT |
| GET | `/api/auth/me` | * | Obtener perfil |
| GET | `/api/clientes` | oficial+ | Listar clientes (paginado) |
| POST | `/api/clientes` | oficial+ | Crear cliente (auditado) |
| PUT | `/api/clientes/:id` | oficial+ | Editar cliente (auditado) |
| GET | `/api/creditos` | oficial+ | Listar con filtros |
| POST | `/api/creditos` | oficial+ | Crear + generar amortización |
| GET | `/api/creditos/:id` | oficial+ | Detalle + amortización + pagos |
| PUT | `/api/creditos/:id/estado` | analista+ | Cambiar estado (auditado) |
| GET | `/api/creditos/:id/pagos` | oficial+ | Historial de pagos |
| POST | `/api/creditos/:id/pagos` | oficial+ | Registrar pago (auditado) |
| GET | `/api/reportes/cartera` | gerente+ | Cartera por estado |
| GET | `/api/reportes/morosidad` | gerente+ | % mora por oficial/mes |
| GET | `/api/reportes/recuperaciones` | gerente+ | Pagos por período |
| GET | `/api/usuarios` | admin | Listar usuarios |
| POST | `/api/usuarios` | admin | Crear usuario (auditado) |
| PUT | `/api/usuarios/:id` | admin | Editar usuario (auditado) |
| GET | `/api/auditoria` | gerente+ | Bitácora forense con filtros |

(*) = todos los usuarios autenticados

---

## 🏆 Cumplimiento Regulatorio (ASFI Bolivia)

| Requisito ASFI | Implementación |
|----------------|----------------|
| **Traza completa** | Tabla `auditoria_log` con diff JSON pre/post |
| **No repudio** | JWT firmado + logs inmutables (sin DELETE en auditoría) |
| **Control acceso** | 4 roles granulares + middleware verify en cada endpoint |
| **Integridad** | Foreign Keys + CHECK constraints + transacciones ACID |
| **Retención** | Auditoría no se purga (policy de 7+ años para cumplir normativa) |
| **Disponibilidad** | Pool de conexiones (max:5) + index en columnas críticas |

---

## 📚 Referencias Académicas

- **ISO/IEC 27001:2013** – A.12.4 Logging and monitoring
- **Teorema CAP (Brewer, 2000)** – BancoSol prioriza CP (Consistencia + Tolerancia a Particiones) sobre Disponibilidad
- **Principios SOLID** – Documentados en código y README
- **ASFI Normativa** – Resolución 089/2020 (Gestión de riesgos TI)

---

## 📝 Autores

**Proyecto para Universidad **[Nombre Universidad] — Ingeniería de Software II — Hito 3**

Desarrollado siguiendo:

- Metodologías ágiles (sprints de 1 semana)
-GitFlow conGit (feature branches → main)
- Documentación técnica completa (diagramas UML en `/docs/uml/`)
- Testing automatizado (Jest + Supertest)

---

## ⚠️ Notas de Producción

- **Cambiar `JWT_SECRET`** en `.env` por clave de 256 bits mínima (usar `openssl rand -hex 32`)
- **Configurar HTTPS** (expres behind Nginx)
- **Backup automático** de BD diario (pg_dump)
- **Monitoreo** de logs con Graylog/ELK
- **Rate limiting** ya configurado (100 req/15min por IP)
- **Helmet.js** headers de seguridad activos

---

## 📄 Licencia

MIT License — Proyecto académico, prohibido uso comercial sin autorización.
