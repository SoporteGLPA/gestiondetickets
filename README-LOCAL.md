
# Sistema de Tickets - Instalación Local

Este documento describe cómo instalar y configurar el sistema de tickets para funcionar con una base de datos PostgreSQL local.

## Requisitos Previos

- Node.js (versión 18 o superior)
- PostgreSQL (versión 13 o superior)
- npm o yarn

## Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd ticket-system
```

### 2. Instalar dependencias

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias adicionales para PostgreSQL
npm install pg @types/pg express cors bcryptjs jsonwebtoken
```

### 3. Configurar PostgreSQL

#### Crear base de datos

```sql
-- Conectarse a PostgreSQL como superusuario
psql -U postgres

-- Crear base de datos
CREATE DATABASE tickets_db;

-- Crear usuario (opcional)
CREATE USER tickets_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE tickets_db TO tickets_user;
```

#### Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tickets_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
JWT_SECRET=tu_jwt_secret_aqui
NODE_ENV=development
```

### 4. Configurar el esquema de la base de datos

```bash
# Ejecutar script de configuración
node scripts/setup-database.js
```

### 5. (Opcional) Migrar datos desde Supabase

Si tienes datos en Supabase que quieres migrar:

```bash
node scripts/migrate-from-supabase.js
```

## Ejecutar la aplicación

### Modo desarrollo

```bash
# Terminal 1: Servidor backend
npm run server:start

# Terminal 2: Aplicación frontend
npm run dev
```

### Modo producción

```bash
# Construir aplicación
npm run build

# Ejecutar servidor (sirve backend + frontend)
NODE_ENV=production npm run server:start
```

## Configuración en la aplicación

1. Abrir la aplicación en el navegador
2. Ir a Configuración → Base de Datos
3. Activar el modo "PostgreSQL Local"
4. Ingresar los datos de conexión:
   - Host: localhost
   - Puerto: 5432
   - Base de datos: tickets_db
   - Usuario: postgres
   - Contraseña: postgres
5. Hacer clic en "Probar Conexión"
6. Si la conexión es exitosa, hacer clic en "Guardar Configuración"

## Estructura del proyecto

```
├── src/
│   ├── config/
│   │   └── database.ts          # Configuración de base de datos
│   ├── integrations/
│   │   └── database/
│   │       └── client.ts        # Cliente unificado
│   ├── components/
│   │   └── database/
│   │       └── DatabaseConfig.tsx # Componente de configuración
│   └── database/
│       └── schema.sql           # Esquema de PostgreSQL
├── server/
│   └── index.js                 # Servidor Express
├── scripts/
│   ├── setup-database.js        # Script de configuración
│   └── migrate-from-supabase.js # Script de migración
└── README-LOCAL.md              # Este archivo
```

## Características

- ✅ Conexión a PostgreSQL local
- ✅ Interfaz de configuración en la aplicación
- ✅ Autenticación JWT
- ✅ API REST para consultas
- ✅ Migración desde Supabase
- ✅ Modo desarrollo y producción
- ✅ Esquema completo de base de datos

## Solución de problemas

### Error de conexión a PostgreSQL

1. Verificar que PostgreSQL esté ejecutándose
2. Verificar credenciales en el archivo `.env`
3. Verificar que la base de datos exista
4. Verificar permisos del usuario

### Error "relation does not exist"

Ejecutar nuevamente el script de configuración:

```bash
node scripts/setup-database.js
```

### Error de autenticación

1. Verificar que el JWT_SECRET esté configurado
2. Verificar que el usuario administrador exista en la base de datos
3. Por defecto, el usuario es `admin@tickets.com` con contraseña `admin`

## Usuarios por defecto

El sistema crea un usuario administrador por defecto:
- Email: `admin@tickets.com`
- Contraseña: `admin`
- Rol: `admin`

## Respaldo y restauración

### Crear respaldo

```bash
pg_dump -U postgres tickets_db > backup.sql
```

### Restaurar respaldo

```bash
psql -U postgres -d tickets_db < backup.sql
```

## Despliegue en servidor

1. Configurar PostgreSQL en el servidor
2. Ajustar variables de entorno
3. Ejecutar scripts de configuración
4. Construir y ejecutar la aplicación

```bash
npm run build
NODE_ENV=production npm run server:start
```

## Soporte

Para problemas o dudas, revisar:
1. Logs del servidor en la consola
2. Logs de PostgreSQL
3. Consola del navegador para errores frontend
