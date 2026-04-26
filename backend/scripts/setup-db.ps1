# ============================================
# BANCOSOL - Instalación en Windows (PowerShell)
# ============================================
# Requisitos: PostgreSQL 15 instalado
# ============================================

# 1. Verificar PostgreSQL en PATH
Write-Host "=== Verificando PostgreSQL ===" -ForegroundColor Green
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    Write-Host "❌ psql no está en el PATH." -ForegroundColor Red
    Write-Host "   Agregue al PATH: C:\Program Files\PostgreSQL\15\bin"
    Write-Host "   O use pgAdmin para ejecutar database/schema.sql y database/seed.sql"
    pause
    exit 1
}

Write-Host "✅ PostgreSQL encontrado en PATH" -ForegroundColor Green

# 2. Parámetros de conexión
$dbName = "bancosol_db"
$dbUser = "postgres"
$dbPassword = Read-Host "Ingrese contraseña de PostgreSQL (postgres)" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

# 3. Crear base de datos
Write-Host "`n=== Creando base de datos $dbName ===" -ForegroundColor Green
try {
    # Crear BD
    & psql -U $dbUser -c "DROP DATABASE IF EXISTS $dbName;"
    & psql -U $dbUser -c "CREATE DATABASE $dbName;"
    Write-Host "✅ Base de datos creada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creando BD: $_" -ForegroundColor Red
    pause
    exit 1
}

# 4. Ejecutar schema.sql
Write-Host "`n=== Ejecutando schema.sql ===" -ForegroundColor Green
try {
    & psql -U $dbUser -d $dbName -f "database/schema.sql"
    Write-Host "✅ Schema creado" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en schema.sql: $_" -ForegroundColor Red
    pause
    exit 1
}

# 5. Ejecutar seed.sql
Write-Host "`n=== Ejecutando seed.sql ===" -ForegroundColor Green
try {
    & psql -U $dbUser -d $dbName -f "database/seed.sql"
    Write-Host "✅ Datos de prueba cargados" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en seed.sql: $_" -ForegroundColor Red
    pause
    exit 1
}

# 6. Mostrar resumen
Write-Host "`n=== Instalación completada ===" -ForegroundColor Green
Write-Host "Base de datos: $dbName"
Write-Host "Usuario BD: $dbUser"
Write-Host "`nUsuarios de prueba:"
Write-Host "  admin@bancosol.bo / Admin123!"
Write-Host "  gerente@bancosol.bo / Gerente123!"
Write-Host "  analista@bancosol.bo / Analista123!"
Write-Host "  oficial@bancosol.bo / Oficial123!"
Write-Host "`nSiguiente paso:"
Write-Host "1. En backend, copiar .env.example a .env"
Write-Host "2. Editar .env con su DB_PASSWORD"
Write-Host "3. Ejecutar: npm run dev" -ForegroundColor Yellow

pause
