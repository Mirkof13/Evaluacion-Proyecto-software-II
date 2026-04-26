@echo off
REM ============================================
REM BANCOSOL - Instalador Automático Windows
REM ============================================
echo [BancoSol] Iniciando instalacion...

REM 1. Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no instalado. Descargar de https://nodejs.org/
    pause
    exit /b 1
)

REM 2. Instalar dependencias Backend
echo [1/4] Instalando dependencias Backend...
cd backend
if not exist "node_modules" (
    npm install
    if errorlevel 1 (
        echo [ERROR] Fallo npm install en backend
        pause
        exit /b 1
    )
)

REM 3. Instalar dependencias Frontend
echo [2/4] Instalando dependencias Frontend...
cd ../frontend
if not exist "node_modules" (
    npm install
    if errorlevel 1 (
        echo [ERROR] Fallo npm install en frontend
        pause
        exit /b 1
    )
)

REM 4. Configurar variables de entorno
echo [3/4] Configurando entorno...
cd ../backend
if not exist ".env" (
    copy .env.example .env
    echo [IMPORTANTE] Edite backend\.env con:
    echo   - DB_PASSWORD = su_password_postgres
    echo   - JWT_SECRET = clave_secreta_larga
)

REM 5. Instrucciones BD
echo.
echo [BASE DE DATOS]
echo   Opcion A (PowerShell - recomendado si tiene psql en PATH):
echo     cd backend\scripts
echo     powershell -ExecutionPolicy Bypass -File setup-db.ps1
echo.
echo   Opcion B (pgAdmin - GUI):
echo     1. Abra pgAdmin
echo     2. Conectese a su servidor PostgreSQL
echo     3. Abra base de datos 'bancosol_db' (o creela)
echo     4. Ejecute: backend\database\schema.sql
echo     5. Ejecute: backend\database\seed.sql
echo.

REM 6. Iniciar servicios
echo [4/4] Servicios listos para iniciar.
echo.
echo Para ejecutar:
echo   Backend:  cd backend && npm run dev   (http://localhost:5000)
echo   Frontend: cd frontend && npm run dev  (http://localhost:3000)
echo.
echo Usuarios de prueba:
echo   admin@bancosol.bo / Admin123!
echo   gerente@bancosol.bo / Gerente123!
echo   analista@bancosol.bo / Analista123!
echo   oficial@bancosol.bo / Oficial123!
echo.
pause
