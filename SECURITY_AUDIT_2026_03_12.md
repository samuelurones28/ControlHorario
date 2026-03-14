# 🔒 AUDITORÍA DE SEGURIDAD - Control Horario
**Fecha**: 12 de Marzo de 2026
**Alcance**: Backend Fastify + Frontend + Infraestructura (Docker + Nginx + PostgreSQL)
**Cumplimiento Legal**: RGPD + Ley 39/2015 + CLAUDE.md requirements

---

## 📊 RESUMEN EJECUTIVO

| Aspecto | Estado | Riesgo |
|---------|--------|--------|
| Autenticación | ✅ Bueno | Bajo |
| Autorización | ✅ Bueno | Bajo |
| Validación de Inputs | ✅ Excelente | Muy Bajo |
| Cifrado de Datos | ⚠️ Parcial | **Medio** |
| Headers de Seguridad | ⚠️ Incompleto | **Medio** |
| Gestión de Secretos | ❌ Crítico | **Alto** |
| HTTPS | ❌ No en producción | **Alto** |
| Logs de Auditoría | ✅ Bueno | Bajo |
| Rate Limiting | ✅ Implementado | Bajo |
| Backups | ✅ Operacional | Bajo |

**Puntuación General**: 6.5/10
**Recomendación**: Implementar correcciones críticas antes de producción.

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. Secretos Hardcodeados en `docker-compose.yml`
**Severidad**: 🔴 CRÍTICA
**Ubicación**: `docker-compose.yml` (líneas 10-12, 27-28)

**Problema**:
```yaml
DATABASE_URL=postgresql://control_user:control_pass@db:5432/control_horario
JWT_SECRET=super_secret_jwt_key
JWT_REFRESH_SECRET=super_secret_refresh_key
POSTGRES_PASSWORD=control_pass
```

**Riesgo**:
- Secretos en control de versiones (visible en git history)
- Si alguien accede al repo, accede a TODO (BD, JWT signing)
- Vulnerabilidad en nivel **production-ready**: invalidaría certificaciones de seguridad

**Cumplimiento Legal**:
- ❌ No cumple RGPD Art. 32 (medidas de seguridad técnicas)
- ❌ Viola CLAUDE.md § 7 (Seguridad)

**Solución**:
```bash
# 1. Cambiar secrets INMEDIATAMENTE
docker-compose.yml:
  - DATABASE_URL=postgresql://control_user:${DB_PASSWORD}@db:5432/control_horario
  - JWT_SECRET=${JWT_SECRET}
  - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
  - POSTGRES_PASSWORD=${DB_PASSWORD}

# 2. Crear .env.production (en servidor, NO en repo):
DB_PASSWORD=<generar con openssl rand -hex 32>
JWT_SECRET=<generar con openssl rand -hex 32>
JWT_REFRESH_SECRET=<generar con openssl rand -hex 32>

# 3. Actualizar .gitignore:
.env.production
.env.local
docker-compose.override.yml

# 4. Limpiar git history:
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all
```

---

### 2. HTTPS Deshabilitado (Solo HTTP)
**Severidad**: 🔴 CRÍTICA
**Ubicación**: `docker-compose.yml` (línea 46), `nginx/nginx.conf` (línea 9)

**Problema**:
- Solo escucha en puerto 80 (HTTP sin cifrar)
- **TODOS los tokens JWT viajan en texto plano** sobre la red
- **TODOS los datos sensibles (DNI hash, PIN hash, GPSon bloqueados por cualquier MITM

**Riesgo en Producción**:
```
Cliente envía: POST /api/v1/auth/login/employee { identifier, pin }
→ Red sin cifrado → Capturado por atacante
→ Atacante obtiene PIN del empleado en texto plano
→ Multa RGPD: hasta €20M o 4% ingresos
→ Violación Art. 34.9 RDL 8/2019 (registro debe ser seguro)
```

**Cumplimiento Legal**:
- ❌ RGPD Art. 32.1.b (Encriptación obligatoria en tránsito)
- ❌ CLAUDE.md § 7: "HTTPS obligatorio (sin excepciones)"
- ❌ Inspección ITSS rechazaría el sistema

**Solución**:
```nginx
# nginx/nginx.conf - Activar HTTPS + Redirect HTTP → HTTPS
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domain/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS: Fuerza HTTPS durante 1 año
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # ... resto de config
}

# docker-compose.yml
ports:
  - "80:80"
  - "443:443"
volumes:
  - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  - /etc/letsencrypt:/etc/letsencrypt:ro  # Let's Encrypt certs
```

---

### 3. Validación de CORS Insuficiente en Producción
**Severidad**: 🔴 ALTA
**Ubicación**: `nginx/nginx.conf` (línea 15)

**Problema**:
```nginx
add_header 'Access-Control-Allow-Origin' '*' always;
```

**Riesgo**:
- Permite requests desde CUALQUIER dominio (incluido malicioso)
- Posibilita CSRF y acceso cross-origin no autorizado
- Si backend JWT_SECRET es débil, cada dominio puede forjar tokens

**Cumplimiento Legal**:
- ⚠️ No directamente violatorio, pero viola principio de "mínimo privilegio"

**Solución**:
```nginx
# Restringir CORS a dominio específico
map $http_origin $cors_origin {
    default "";
    "~^https://controlhorario\.es$" $http_origin;
    "~^https://admin\.controlhorario\.es$" $http_origin;
}

location /api/ {
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        return 204;
    }
    # ...
}
```

---

## 🟠 VULNERABILIDADES ALTAS

### 4. Headers de Seguridad Incompletos
**Severidad**: 🟠 ALTA
**Ubicación**: `backend/src/index.ts` (línea 35-37), `nginx/nginx.conf`

**Problema**: Helmet está activado pero:
- ❌ No hay `Content-Security-Policy` (CSP)
- ❌ No hay `X-Frame-Options`
- ❌ No hay `X-Content-Type-Options`
- ❌ Nginx no añade `Strict-Transport-Security` (HSTS)

**Riesgo**: Vulnerable a:
- Clickjacking (si frontend se embebiera en iframe malicioso)
- XSS (sin CSP)
- MIME sniffing

**Solución**:
```typescript
// backend/src/index.ts - Ampliar helmet config
app.register(helmet, {
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : []
    }
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
});
```

```nginx
# nginx/nginx.conf
add_header 'X-Frame-Options' 'DENY' always;
add_header 'X-Content-Type-Options' 'nosniff' always;
add_header 'Strict-Transport-Security' 'max-age=31536000; includeSubDomains; preload' always;
```

---

### 5. Tokens JWT con Expiración Larga
**Severidad**: 🟠 ALTA
**Ubicación**: `backend/src/modules/auth/auth.controller.ts` (línea 33, 72)

**Problema**:
```typescript
const refreshToken = request.server.jwt.sign(tokenPayload, {
  expiresIn: '7d',  // ⚠️ 7 días es muy largo
  key: config.JWT_REFRESH_SECRET
});
```

**Riesgo**:
- Si un token refresh es robado, atacante tiene acceso durante **7 días**
- Sin mecanismo de revocación de tokens (token blacklist)
- Incumple RGPD Art. 32 (medidas de seguridad adecuadas al riesgo)

**Solución**:
```typescript
// Reducir a 24-48 horas
expiresIn: '24h'

// Implementar token blacklist (cache en Redis)
// O usar JWT con `jti` (JWT ID) y verificar en tabla DB
```

---

### 6. Request.user vs Request.tenant Inconsistencia
**Severidad**: 🟠 MEDIA
**Ubicación**: `backend/src/modules/timeEntry/timeEntry.controller.ts` (línea 10, 24, 32)

**Problema**:
```typescript
// timeEntry.controller.ts usa request.user.id (línea 10)
const employeeId = (request as any).user.id;

// Pero authenticate.ts inyecta request.tenant (línea 17)
request.tenant = { companyId, userId, employeeId, role }

// Inconsistencia: en algunos sitios es request.tenant, en otros request.user
```

**Riesgo**:
- Bugs de seguridad: acceso a employeeId de otro usuario
- Runtime errors en producción
- Violación LGPD Art. 32 (controles de acceso inconsistentes)

**Solución**:
```typescript
// Usar SIEMPRE request.tenant (ya existe):
const employeeId = request.tenant?.employeeId;

// O crear helper consistente:
export function getEmployeeId(request: FastifyRequest): string {
  if (!request.tenant?.employeeId) {
    throw new Error('Unauthorized');
  }
  return request.tenant.employeeId;
}
```

---

### 7. Sin Rate Limiting por Endpoint (Solo Global)
**Severidad**: 🟠 MEDIA
**Ubicación**: `backend/src/index.ts` (línea 20-23)

**Problema**:
```typescript
app.register(rateLimit, {
  max: 100,  // Global: 100 req/minuto
  timeWindow: '1 minute',
});
```

**Riesgo**:
- Endpoint de login: 100 intentos/minuto = **brute force viable**
- Endpoint de fichaje: 100 accesos/minuto = OK
- Sin protección específica para login (existe en platform pero no en employee auth)

**Solución**:
```typescript
// Crear middleware de rate limit específico para login
app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Route-specific para login
app.post('/api/v1/auth/login/employee',
  { preHandler: rateLimit({ max: 5, timeWindow: '15m' }) },
  (request, reply) => { /* ... */ }
);
```

---

### 8. Base de Datos Expuesta a Red (puerto 5432)
**Severidad**: 🟠 ALTA
**Ubicación**: `docker-compose.yml` (línea 30)

**Problema**:
```yaml
db:
  ports:
    - "5432:5432"  # ⚠️ Expone PostgreSQL a localhost:5432
```

**Riesgo**:
- Cualquier proceso en la red Docker puede conectar a BD
- Si el servidor está en producción, alguien en la red interna accede a BD sin autenticar
- No hay password de BD fuerte (es "control_pass")

**Solución**:
```yaml
# Remover puertos - solo accesible internamente a través de 'db' hostname
# db:
#   ports:
#     - "5432:5432"  # ❌ ELIMINAR

# Si necesitas acceder desde host local en desarrollo:
# Use docker exec o tunel SSH, NO puertos expuestos
```

---

## 🟡 VULNERABILIDADES MEDIAS

### 9. Falta de Validación de Geolocalización
**Severidad**: 🟡 MEDIA
**Ubicación**: `backend/src/modules/timeEntry/timeEntry.service.ts` (línea 50-51)

**Problema**:
```typescript
const newEntry = await prisma.timeEntry.create({
  data: {
    // ...
    latitude: data.latitude,    // ⚠️ No validado rango
    longitude: data.longitude,  // ⚠️ No validado rango
  }
});
```

**Riesgo**:
- Aplicación acepta coordenadas inválidas (-999, 999)
- No valida si coinciden con ubicación de empresa
- RGPD: geolocalización requiere consentimiento específico (no hay evidencia)
- CLAUDE.md § 2: "Si se usa geolocalización: requiere consentimiento informado"

**Solución**:
```typescript
// En timeEntry.schemas.ts
const clockSchema = z.object({
  entryType: z.enum(['CLOCK_IN', 'CLOCK_OUT', 'PAUSE_START', 'PAUSE_END']),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// En timeEntry.service.ts
if (data.latitude !== undefined || data.longitude !== undefined) {
  // Verificar consentimiento RGPD de geolocalización
  const consent = await prisma.privacyConsent.findFirst({
    where: { employeeId, version: 'with_geolocation' }
  });
  if (!consent) {
    throw new Error('Geolocation consent required');
  }
}
```

---

### 10. Sin Validación de Integridad de Datos (TimeEntry Append-Only)
**Severidad**: 🟡 MEDIA
**Ubicación**: `backend/src/modules/timeEntry/`

**Problema**:
- ✅ TimeEntry usa `.create()` (append-only, bien)
- ❌ Pero NO hay constraint en BD que lo enforce
- ❌ No hay trigger que prevenga UPDATE/DELETE
- ❌ Podría alguien hacer UPDATE manual en BD

**Riesgo**:
- CLAUDE.md § 4: "TimeEntry es append-only (nunca UPDATE ni DELETE)"
- RGPD Art. 32 + LISOS: registro debe ser inmutable
- Auditarías fallirían si se detectara manipulación

**Solución**:
```sql
-- En Prisma migration
-- Crear POLICY o TRIGGER PostgreSQL para prevent UPDATE/DELETE
CREATE TRIGGER prevent_time_entry_modification
BEFORE UPDATE OR DELETE ON "TimeEntry"
FOR EACH ROW
EXECUTE FUNCTION reject_modification();

CREATE FUNCTION reject_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'TimeEntry records are immutable. Use TimeEntryAmendment instead.';
END;
$$ LANGUAGE plpgsql;

-- O usar Row Level Security (RLS)
ALTER TABLE "TimeEntry" ENABLE ROW LEVEL SECURITY;
CREATE POLICY time_entry_immutable ON "TimeEntry"
  FOR UPDATE USING (false);  -- Nunca permitir UPDATE
CREATE POLICY time_entry_no_delete ON "TimeEntry"
  FOR DELETE USING (false);   -- Nunca permitir DELETE
```

---

### 11. Logs de Auditoría Sin Encriptación
**Severidad**: 🟡 MEDIA
**Ubicación**: `backend/src/middleware/auditLogger.ts`

**Problema**:
- ✅ Se registran logs de auditoría
- ✅ Se maskean passwords/PIN
- ❌ Logs almacenados en BD **sin cifrado**
- ❌ Acceso a `AuditLog` no verificado en API lectura
- ⚠️ Podrían revelar patrones de trabajo de empleados

**Riesgo**:
- RGPD Art. 32: "Integridad y confidencialidad de datos"
- Logs contienen información sensible (IP, timestamps de fichajes)
- Violación de privacidad si alguien accede sin autorización

**Solución**:
```typescript
// 1. Encriptar fields sensibles en BD
// En schema.prisma:
model AuditLog {
  id String @id @default(uuid())
  // ...
  ipAddress String?  // Encriptado
  userAgent String?  // Encriptado
}

// 2. Middleware para encriptar antes de guardar
import crypto from 'crypto';
const ENCRYPTION_KEY = process.env.AUDIT_LOG_KEY; // AES-256

async function logAudit(data) {
  const encrypted = {
    ...data,
    ipAddress: encrypt(data.ipAddress, ENCRYPTION_KEY),
    userAgent: encrypt(data.userAgent, ENCRYPTION_KEY),
  };
  await prisma.auditLog.create({ data: encrypted });
}

// 3. Verificar acceso a GET /api/v1/audit-logs
// Actual: solo requiere ADMIN
// Mejorado: requiere ADMIN + companyId match
```

---

### 12. Sin Verificación de Integridad de Tareas en Background
**Severidad**: 🟡 MEDIA
**Ubicación**: `backend/src/jobs/cron.ts`

**Problema**:
- Se ejecutan cron jobs en background (checks de desconexión, etc.)
- No hay verificación de si el job se ejecutó correctamente
- No hay retry logic
- No hay alertas si un job falla

**Riesgo**:
- Si job falla silenciosamente, pueden no procesarse incidents críticos
- RGPD: responsabilidad de demostrar que se procesaron datos correctamente

**Solución**:
```typescript
// Implementar queue (Bull, RabbitMQ) en lugar de cron puro
import Bull from 'bull';

const auditQueue = new Bull('audit', {
  redis: { host: 'localhost', port: 6379 }
});

auditQueue.process(async (job) => {
  try {
    await logDisconnectionViolation(...);
    return { success: true };
  } catch (err) {
    console.error('Job failed:', job.id, err);
    throw err;  // Retry automático
  }
});

// Monitorear fallos
auditQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
  // Enviar alerta a admin
});
```

---

## 🟢 ÁREAS CORRECTAS (No Requieren Acción)

### ✅ Autenticación JWT
- Tokens con expiración (15 min access, 7 días refresh)
- Refresh tokens en httpOnly cookies
- Verificación HMAC-SHA256 de JWT_SECRET
- ✅ **Implementación correcta**

### ✅ Hashing de Passwords
```typescript
bcrypt.hash(password, 12)  // Cost factor 12
```
- ✅ Cumple OWASP
- ✅ Resistente a ataques de fuerza bruta

### ✅ Validación de Inputs con Zod
```typescript
registerCompanySchema, adminLoginSchema, employeeLoginSchema, etc.
```
- ✅ Todos los inputs validados antes de procesar
- ✅ Previene SQL injection, NoSQL injection, etc.
- ✅ **Excelente implementación**

### ✅ Separación de Scopes (Employee vs Platform)
```typescript
authenticate() // User/Employee
platformAuthenticate() // Platform Admin
```
- ✅ Los tokens tienen scopes diferenciados
- ✅ Platform admin no puede fichar como employee

### ✅ TOTP 2FA para Platform Admin
```typescript
speakeasy.generateSecret(), speakeasy.verifyToken()
```
- ✅ Códigos de backup hasheados
- ✅ Setup inicial genera QR
- ✅ Rate limiting en verificación
- ✅ **Buena implementación**

### ✅ Backups Automatizados
- Diarios a las 02:00 UTC
- Retención de 4 años (1460 días)
- Formato: PostgreSQL custom dump + gzip
- ✅ Cumple requisito legal CLAUDE.md § 5

### ✅ Privacy Policy Endpoint
```
GET /api/v1/privacy/policy (público)
POST /api/v1/privacy/accept (requiere auth)
```
- ✅ Informa de tratamiento de datos
- ✅ Registra consentimiento con IP y fecha
- ✅ Cumple RGPD Art. 14

---

## 📋 PLAN DE REMEDIACIÓN

### 🔴 CRÍTICO (Hacer ANTES de producción)
| # | Tarea | Prioridad | Esfuerzo | Plazo |
|---|-------|-----------|----------|-------|
| 1 | Mover secrets a .env (no en docker-compose.yml) | P0 | 30 min | Hoy |
| 2 | Activar HTTPS (Let's Encrypt + Nginx) | P0 | 2 horas | Hoy |
| 3 | Restringir CORS a dominio específico | P0 | 30 min | Hoy |
| 4 | Remover puerto 5432 de BD en producción | P0 | 15 min | Hoy |

### 🟠 ALTO (Hacer antes de lanzamiento al público)
| # | Tarea | Prioridad | Esfuerzo | Plazo |
|---|-------|-----------|----------|-------|
| 5 | Implementar CSP + X-Frame-Options headers | P1 | 1 hora | Semana 1 |
| 6 | Reducir JWT refresh token a 24h | P1 | 30 min | Semana 1 |
| 7 | Solucionar inconsistencia request.user vs request.tenant | P1 | 1 hora | Semana 1 |
| 8 | Rate limiting específico para endpoints de login | P1 | 1 hora | Semana 1 |

### 🟡 MEDIO (Hacer en próximas 4 semanas)
| # | Tarea | Prioridad | Esfuerzo | Plazo |
|---|-------|-----------|----------|-------|
| 9 | Validar rango de geolocalización (lat/lon) | P2 | 1 hora | Semana 2 |
| 10 | Implementar constraint de TimeEntry append-only en BD | P2 | 2 horas | Semana 2 |
| 11 | Encriptar campos sensibles en AuditLog | P2 | 3 horas | Semana 3 |
| 12 | Implementar queue (Bull) para cron jobs | P2 | 4 horas | Semana 4 |

---

## 📜 CHECKLIST FINAL

Antes de pasar a producción, verificar:

### Seguridad en Tránsito
- [ ] HTTPS activado en todos los endpoints
- [ ] HTTP redirige a HTTPS
- [ ] HSTS header configurado
- [ ] TLS 1.2+ obligatorio
- [ ] Certificado SSL válido para el dominio

### Seguridad en Reposo
- [ ] Secrets en .env (no en control de versiones)
- [ ] BD: contraseña fuerte (>20 caracteres)
- [ ] Backups encriptados
- [ ] Logs de auditoría encriptados

### Autenticación & Autorización
- [ ] JWT_SECRET > 32 caracteres
- [ ] JWT refresh token < 24h
- [ ] Platform admin requiere 2FA
- [ ] Employee login requiere PIN único
- [ ] CORS restrictivo (solo dominio específico)

### Validación & Prevención de Ataques
- [ ] Todos los inputs validados con Zod
- [ ] Rate limiting en endpoints críticos
- [ ] CSRF token en formularios (si aplica)
- [ ] CSP headers implementados
- [ ] SQL injection imposible (ORM Prisma)
- [ ] XSS mitigado (helmet + CSP)

### Datos Sensibles
- [ ] DNI almacenado como hash (no texto plano)
- [ ] PIN almacenado como hash (bcrypt)
- [ ] Passwords almacenados como hash (bcrypt cost 12)
- [ ] Geolocalización requiere consentimiento
- [ ] Logs no exponen PIHs (Personal Identifiable Information)

### Auditoría & Cumplimiento Legal
- [ ] Logs de auditoría registran: quién, qué, cuándo, desde dónde
- [ ] TimeEntry es immutable (no UPDATE/DELETE)
- [ ] Retención de backups >= 4 años
- [ ] Acceso a datos restringido por role
- [ ] Cada empleado accede solo a sus registros
- [ ] Política de privacidad disponible públicamente
- [ ] Admin puede exportar datos para inspecciones

### Infraestructura
- [ ] Docker: imágenes base actualizadas (Node 20-alpine, Postgres 16-alpine)
- [ ] Docker: no correr como root
- [ ] Nginx: configuración de seguridad hardened
- [ ] PostgreSQL: puerto 5432 NO expuesto en producción
- [ ] Backups: probados (restore test)
- [ ] Logs: rotación configurada

---

## 📞 CONTACTO PARA DUDAS

Si encuentras vulnerabilidades adicionales, reporta a:
- Security email: security@controlhorario.es
- GitHub Issues: [repo]/security/advisories

---

**Auditoría completada por**: Claude Code
**Próxima auditoría recomendada**: 3 meses (después de lanzamiento)
**Certificaciones a considerar**: ISO 27001, SOC 2 Type II
