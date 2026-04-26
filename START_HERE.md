# 🚀 INICIO RÁPIDO - BancoSol en Windows

## Opción A: Usando PowerShell (recomendado)

1. **Abrir PowerShell como Administrador** (Click derecho → "Run as administrator")

2. **Navegar al proyecto:**
```powershell
cd "C:\Users\Miscar\Desktop\proyectos\software II\evlaucaon"
```

3. **Ejecutar instalador:**
```powershell
.\install.bat
```

4. **Configurar base de datos:**
```powershell
cd backend\scripts
powershell -ExecutionPolicy Bypass -File setup-db.ps1
```
*Ingrese su contraseña de PostgreSQL cuando la solicite*

5. **Editar archivo de configuración:**
```powershell
notepad backend\.env
```
Cambiar:
```
DB_PASSWORD=tu_password_real
JWT_SECRET=una_clave_secreta_muy_larga_minimo_32_caracteres
```

6. **Iniciar Backend:**
```powershell
cd ..
npm run dev
```
*Debería mostrar: 🚀 Servidor BancoSol ejecutándose en http://localhost:5000*

7. **Iniciar Frontend (nueva ventana PowerShell):**
```powershell
cd ..\frontend
npm run dev
```
*Frontend en http://localhost:3000*

---

## Opción B: Usando pgAdmin (GUI)

1. Abra **pgAdmin 4**

2. Conéctese a su servidor PostgreSQL (usuario: `postgres`)

3. Cree la base de datos:
   - Click derecho → "Create" → "Database"
   - Database: `bancosol_db`
   - Owner: `postgres`

4. **Ejecutar schema:**
   - Seleccionar `bancosol_db`
   - Click en "Query Tool"
   - Abrir archivo: `backend\database\schema.sql`
   - Click "Execute" (F5)

5. **Ejecutar seed:**
   - Abrir `backend\database\seed.sql`
   - Click "Execute" (F5)

6. Continuar con pasos 5-7 de Opción A.

---

## 🔐 Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@bancosol.bo | Admin123! | admin |
| gerente@bancosol.bo | Gerente123! | gerente |
| analista@bancosol.bo | Analista123! | analista |
| oficial@bancosol.bo | Oficial123! | oficial_credito |

---

## ⚠️ Solución de Problemas Comunes

### Error: "psql no se reconoce"
**Solución:** Agregar PostgreSQL al PATH:
1. Buscar "Variables de entorno del sistema"
2. Editar "Path" (variables de sistema)
3. Agregar: `C:\Program Files\PostgreSQL\15\bin`
4. Reiniciar PowerShell

### Error: "Connection refused" en backend
**Solución:** Verificar que PostgreSQL esté corriendo:
- En servicios (services.msc) buscar "postgresql-x64-15"
- Iniciarlo si está detenido

### Error: "Port 5000 already in use"
**Solución:** Cambiar puerto en `backend\.env`:
```
PORT=5001
```

### Error: " association alias 'usuarios' already used"
**Solución:** Ya corregido. Si persiste, eliminar `node_modules` y reinstalar:
```powershell
Remove-Item -Recurse -Force backend\node_modules
Remove-Item -Recurse -Force frontend\node_modules
cd backend && npm install
```

---

## 📁 Estructura del Proyecto

```
evlaucaon/
├── backend/
│   ├── src/
│   │   ├── config/        # BD y JWT
│   │   ├── middleware/    # Auth, roles, auditoría
│   │   ├── models/        # Sequelize models
│   │   ├── controllers/   # Lógica de endpoints
│   │   ├── services/      # Lógica de negocio
│   │   └── utils/         # Cálculos financieros
│   ├── database/
│   │   ├── schema.sql     # 8 tablas + vistas
│   │   └── seed.sql       # Datos de prueba
│   └── .env               # Sus credenciales
├── frontend/
│   └── src/
│       ├── pages/         # 10 pantallas
│       ├── components/    # Navbar, Sidebar
│       ├── context/       # Auth
│       └── api/           # Axios config
├── install.bat            # Instalador automático
└── START_HERE.md          # Este archivo
```

---

## 📞 Soporte

Si tiene problemas:
1. Verifique que PostgreSQL esté instalado: `psql --version`
2. Verifique Node.js: `node --version` (v18+)
3. Revise los logs en consola (errores en rojo)
4. Consulte el README.md completo en la raíz
