
# Guía de Instalación en Ubuntu Server

Esta guía te llevará paso a paso para instalar y configurar el sistema de tickets en un servidor Ubuntu.

## Requisitos Previos

- Ubuntu Server 20.04 LTS o superior
- Acceso sudo al servidor
- Conexión a internet estable

## 1. Configuración Inicial del Servidor

### Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar dependencias básicas
```bash
sudo apt install -y curl wget git build-essential software-properties-common
```

### Configurar firewall básico
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # Puerto de la aplicación
sudo ufw allow 5432  # PostgreSQL (opcional si usas acceso remoto)
```

## 2. Instalación de Node.js

### Instalar Node.js 20.x LTS via NodeSource
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Verificar instalación
```bash
node --version  # Debe mostrar v20.x.x
npm --version   # Debe mostrar 10.x.x o superior
```

## 3. Instalación y Configuración de PostgreSQL

### Instalar PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### Configurar PostgreSQL
```bash
# Cambiar a usuario postgres
sudo -u postgres psql

-- Dentro de PostgreSQL, ejecutar:
CREATE DATABASE tickets_db;
CREATE USER tickets_user WITH ENCRYPTED PASSWORD 'tu_password_seguro_aqui';
GRANT ALL PRIVILEGES ON DATABASE tickets_db TO tickets_user;
ALTER USER tickets_user CREATEDB;
\q
```

### Configurar acceso local (opcional para desarrollo)
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Agregar/modificar la línea para permitir conexiones locales:
```
local   all             tickets_user                            md5
```

### Reiniciar PostgreSQL
```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

## 4. Crear Usuario para la Aplicación

### Crear usuario no-root
```bash
sudo adduser tickets --disabled-password --gecos ""
sudo usermod -aG sudo tickets
```

### Cambiar a usuario tickets
```bash
sudo su - tickets
```

## 5. Clonar y Configurar el Proyecto

### Clonar el repositorio
```bash
git clone <tu-repositorio-aqui> tickets-app
cd tickets-app
```

### Instalar dependencias
```bash
npm install
```

### Configurar variables de entorno
```bash
cp .env.example .env
nano .env
```

Configurar las siguientes variables:
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tickets_db
DB_USER=tickets_user
DB_PASSWORD=tu_password_seguro_aqui

# Aplicación
NODE_ENV=production
PORT=3000

# JWT (generar una clave secreta fuerte)
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro_aqui

# Configuración de correo (opcional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### Generar JWT Secret seguro
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 6. Configurar la Base de Datos

### Ejecutar el script de configuración
```bash
node scripts/setup-database.js
```

### Crear usuario administrador inicial
El script te preguntará por los datos del primer usuario administrador. Ingresa:
- Nombre completo
- Email
- Contraseña segura

## 7. Construir la Aplicación

### Generar build de producción
```bash
npm run build
```

### Probar que funciona localmente
```bash
npm start
```

Visita `http://tu-servidor:3000` para verificar que funciona.

## 8. Configurar como Servicio Systemd

### Crear archivo de servicio
```bash
sudo nano /etc/systemd/system/tickets-app.service
```

Contenido del archivo:
```ini
[Unit]
Description=Sistema de Tickets Node.js App
After=network.target postgresql.service

[Service]
Type=simple
User=tickets
WorkingDirectory=/home/tickets/tickets-app
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

# Logging
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=tickets-app

[Install]
WantedBy=multi-user.target
```

### Habilitar y iniciar el servicio
```bash
sudo systemctl daemon-reload
sudo systemctl enable tickets-app
sudo systemctl start tickets-app
```

### Verificar estado del servicio
```bash
sudo systemctl status tickets-app
```

## 9. Configurar Nginx como Proxy Reverso (Recomendado)

### Instalar Nginx
```bash
sudo apt install -y nginx
```

### Crear configuración del sitio
```bash
sudo nano /etc/nginx/sites-available/tickets-app
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # Reemplazar con tu dominio

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Habilitar el sitio
```bash
sudo ln -s /etc/nginx/sites-available/tickets-app /etc/nginx/sites-enabled/
sudo nginx -t  # Verificar configuración
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 10. Configurar SSL con Let's Encrypt (Recomendado)

### Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtener certificado SSL
```bash
sudo certbot --nginx -d tu-dominio.com
```

### Configurar renovación automática
```bash
sudo crontab -e
```

Agregar línea:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## 11. Configurar Backup Automatizado

### Crear script de backup
```bash
sudo nano /usr/local/bin/backup-tickets.sh
```

Contenido:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/tickets/backups"
DB_NAME="tickets_db"
DB_USER="tickets_user"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Backup de base de datos
PGPASSWORD="tu_password_aqui" pg_dump -h localhost -U $DB_USER $DB_NAME > "$BACKUP_DIR/db_backup_$DATE.sql"

# Comprimir backup
gzip "$BACKUP_DIR/db_backup_$DATE.sql"

# Mantener solo los últimos 7 backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completado: db_backup_$DATE.sql.gz"
```

### Hacer ejecutable y programar
```bash
sudo chmod +x /usr/local/bin/backup-tickets.sh
sudo crontab -e
```

Agregar línea para backup diario a las 2 AM:
```
0 2 * * * /usr/local/bin/backup-tickets.sh
```

## 12. Monitoreo y Logs

### Ver logs de la aplicación
```bash
# Ver logs en tiempo real
sudo journalctl -u tickets-app -f

# Ver logs recientes
sudo journalctl -u tickets-app --since "1 hour ago"

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitorear recursos del sistema
```bash
# Uso de recursos
htop

# Espacio en disco
df -h

# Uso de memoria
free -h

# Estado de servicios
sudo systemctl status tickets-app postgresql nginx
```

## 13. Comandos de Mantenimiento

### Reiniciar servicios
```bash
sudo systemctl restart tickets-app
sudo systemctl restart postgresql
sudo systemctl restart nginx
```

### Actualizar la aplicación
```bash
cd /home/tickets/tickets-app
git pull origin main
npm install
npm run build
sudo systemctl restart tickets-app
```

### Restaurar backup de base de datos
```bash
# Descomprimir backup
gunzip /home/tickets/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz

# Restaurar
PGPASSWORD="tu_password" psql -h localhost -U tickets_user tickets_db < /home/tickets/backups/db_backup_YYYYMMDD_HHMMSS.sql
```

## 14. Troubleshooting Común

### La aplicación no inicia
```bash
# Verificar logs
sudo journalctl -u tickets-app -n 50

# Verificar configuración
cd /home/tickets/tickets-app
npm run build
```

### Error de conexión a la base de datos
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Probar conexión manual
PGPASSWORD="tu_password" psql -h localhost -U tickets_user tickets_db
```

### Nginx devuelve 502 Bad Gateway
```bash
# Verificar que la app esté corriendo
sudo systemctl status tickets-app

# Verificar que escuche en el puerto 3000
sudo netstat -tlnp | grep 3000
```

### Problemas de permisos
```bash
# Asegurar permisos correctos
sudo chown -R tickets:tickets /home/tickets/tickets-app
sudo chmod -R 755 /home/tickets/tickets-app
```

### Aplicación lenta o con errores
```bash
# Reiniciar todos los servicios
sudo systemctl restart tickets-app postgresql nginx

# Limpiar logs antiguos
sudo journalctl --vacuum-time=7d
```

## 15. Configuración de Desarrollo (Opcional)

Si quieres configurar un entorno de desarrollo en el mismo servidor:

```bash
# Crear base de datos de desarrollo
sudo -u postgres createdb tickets_dev

# Usar puerto diferente
export PORT=3001

# Ejecutar en modo desarrollo
npm run dev
```

## Seguridad Adicional

### Configurar fail2ban para SSH
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### Configurar actualizaciones automáticas de seguridad
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Configurar monitoreo de archivos importantes
```bash
sudo apt install -y aide
sudo aideinit
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

## Mantenimiento Regular

1. **Semanal**: Revisar logs y métricas de rendimiento
2. **Mensual**: Aplicar actualizaciones de seguridad
3. **Trimestral**: Revisar y optimizar base de datos
4. **Anual**: Actualizar dependencias principales

## Soporte

Si encuentras problemas durante la instalación:

1. Revisa los logs específicos del servicio que falla
2. Verifica que todos los puertos necesarios estén abiertos
3. Asegúrate de que las credenciales de base de datos sean correctas
4. Comprueba que todos los servicios estén ejecutándose

Para soporte adicional, consulta la documentación del proyecto o abre un issue en el repositorio.
