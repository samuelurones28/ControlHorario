# Control Horario

Aplicación web progresiva (PWA) corporativa para el registro de jornada laboral, diseñada para cumplir con la normativa española de control horario (RDL 8/2019) y preparada estructuralmente para futuras integraciones digitales de la Inspección de Trabajo (reforma 2026).

## Características Principales

- 📱 **PWA para Empleados:** Interfaz rápida adaptada a dispositivos móviles. Modo de fichaje offline integrado y solicitudes de incidencias o correcciones manuales.
- 👨‍💼 **Panel de Administración B2B:** Dashboard en tiempo real, notificaciones de fichaje abierto u horas extenuantes.
- 📊 **Cálculo y Reportística:** Motores precisos de cálculo de horas netas laboradas y tiempo de pausas. Exportación CSV oficial validada.
- 🛡️ **Seguridad Nativa:** Modelo Zero-Trust de almacenamiento inmutable (`append-only` preferido en BD), autenticación JWT vía cookies httpOnly, contraseñas protegidas.

## Stack Tecnológico

- **Backend:** Node.js (TypeScript), Fastify, Prisma ORM, PostgreSQL. Funciones de background cron job para reportes diarios.
- **Frontend:** React, Vite (PWA), Tailwind CSS, Zustand para estados, React Router, y Axios interceptors.
- **Infraestructura:** Docker Compose multicontenedor, Proxy Nginx, Contenedor nativo de Backups pg_dump.

## Requisitos de Entorno

- Docker Engine 24+ y Docker Compose
- Puertos disponibles localmente: `80` (Proxy Inverso), `5432` (PostgreSQL de desarrollo)

## Despliegue en Producción o Staging

1. Configura el archivo `./backend/.env` y `./frontend/.env` con tus credenciales y rutas. (Se proveen versiones de ejemplo).
2. Construye y despliega toda la orquestación:
   ```bash
   docker-compose up -d --build
   ```
3. Docker Compose levantará 5 contenedores:
   - `db`: La base de datos Postgres.
   - `api`: API de Fastify (Ejecuta `prisma migrate deploy` en el boot).
   - `frontend`: HTML estáticos de la PWA compilados por Vite.
   - `nginx`: Reverse Proxy gestionando peticiones frontend (`/`) y backend (`/api`).
   - `backup`: Tarea Cron que hace backups automáticos de la info vital.

4. Acceso al sistema: Nginx escuchará en `localhost:80`. La API es inaccesible externamente salvo por el endpoint rutado en Nginx.

## Flujo de Trabajo

- **Fichajes Inmutables**: Para evitar la manipulación, las actualizaciones en `TimeEntry` están limitadas. Para alterar el tiempo, se generan `TimeEntryAmendment` que un Administrador aprueba.
- **Trabajo Offline**: La App intercepta errores de red y manda un status offline en el dashboard front. Cuando vuelve la red, la App podría sincronizar las peticiones cacheadas (parcialmente implementado usando Service Workers y colas manuales).
- **Mantenimiento**: Ver la carpeta `/backend/src/jobs` para procesos por lotes.
