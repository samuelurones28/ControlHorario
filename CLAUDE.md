# CLAUDE.md — App de Control Horario (España)

## Contexto del Proyecto
App de registro de jornada laboral para autónomos con empleados y PYMEs en España. Fichaje desde móvil. Self-hosted. Diseño escalable pero MVP primero.

---

## 1. Marco Legal Vigente

### Normativa aplicable
- **Art. 34.9 Estatuto de los Trabajadores** (RDL 8/2019): registro diario obligatorio desde 12/05/2019.
- **LISOS** (Ley de Infracciones y Sanciones en el Orden Social): régimen sancionador.
- **RGPD** (UE 2016/679) + **LOPDGDD** (LO 3/2018): protección de datos.
- **Ley 10/2021** (Art. 14): registro horario en teletrabajo.
- **Reforma 2026 (en tramitación)**: Real Decreto que impondrá registro digital obligatorio. Previsto primer semestre 2026, 20 días tras publicación BOE.

### Requisitos legales del registro (vigentes + previstos)
Cada asiento DEBE incluir:
- Identificación del trabajador
- Fecha
- Hora y minuto exactos de **inicio y fin** de jornada
- Pausas y tiempos de espera (reforma 2026)
- Modalidad: presencial / a distancia (reforma 2026)
- Naturaleza de horas: ordinarias, extraordinarias, complementarias (reforma 2026)
- Horas de conciliación/flexibilidad (reforma 2026)

### Conservación y acceso
- **Retención mínima: 4 años**
- Acceso inmediato para: el propio trabajador, representantes legales (RLT), Inspección de Trabajo (ITSS)
- La reforma 2026 exigirá acceso **remoto** para la ITSS

### Trazabilidad e inmutabilidad
- Los registros NO pueden ser editables libremente
- Cualquier modificación debe registrar: autoría, motivo, fecha/hora del cambio, y consentimiento del trabajador
- Prohibido: Excel editable, papel sin control, sistemas sin log de auditoría

### Sanciones (LISOS)
| Gravedad | Importe | Ejemplo |
|----------|---------|---------|
| Leve | 70 – 750 € | Falta puntual de información |
| Grave | 751 – 7.500 € | Ausencia de registro, sistema manipulable |
| Muy grave | 7.501 – 225.018 € | Falsificación, obstrucción a Inspección |

> La reforma 2026 prevé multas **por trabajador afectado**, no por empresa.

### Prohibiciones explícitas (reforma 2026)
- ❌ Registro en papel o Excel
- ❌ Biometría sin justificación legal proporcional
- ❌ Obligar al trabajador a usar su dispositivo personal sin alternativa ni compensación

---

## 2. Protección de Datos (RGPD/LOPDGDD)

### Obligaciones
- **Base legal**: cumplimiento de obligación legal (art. 6.1.c RGPD) para el registro básico
- **Minimización**: solo recoger datos estrictamente necesarios
- **Cifrado**: en tránsito (TLS 1.2+) y en reposo (AES-256)
- **Almacenamiento**: servidores dentro de la UE (o país con nivel equivalente)
- **Control de accesos**: roles diferenciados (admin, empleado). Principio de mínimo privilegio
- **Derecho de acceso**: cada trabajador accede SOLO a sus propios registros
- **Política de privacidad**: informar al trabajador del tratamiento antes de usarlo
- Si se usa **geolocalización**: requiere consentimiento informado o justificación proporcional. No almacenar tracking continuo, solo coordenadas en el momento del fichaje

---

## 3. Stack Técnico Recomendado

### Backend
- **Node.js + Express** o **Fastify** (ligero, buen ecosistema)
- **PostgreSQL** como BD principal (soporte JSON, integridad, escalable)
- **Prisma** o **Drizzle** como ORM
- API **REST** (más sencilla para MVP; migrar a GraphQL si escala)

### Frontend Móvil
- **PWA** (Progressive Web App) como MVP: funciona en cualquier móvil desde el navegador, no requiere stores
- Alternativa futura: React Native o Flutter para app nativa

### Frontend Admin (web)
- **Next.js** o **React + Vite** para panel de administración

### Infraestructura (self-hosted)
- **Docker + Docker Compose** para despliegue reproducible
- **Nginx** como reverse proxy con HTTPS (Let's Encrypt)
- **Backups automáticos** de PostgreSQL (pg_dump cron)

### Autenticación
- **JWT** con refresh tokens (httpOnly cookies)
- PIN o contraseña por empleado para fichar
- Considerar 2FA para admin

---

## 4. Modelo de Datos (núcleo)

```
Company
  id, name, cif, address, created_at

Employee
  id, company_id (FK), name, dni_hash, email, pin_hash, role (admin|employee), contract_type, weekly_hours, active, created_at

TimeEntry
  id, employee_id (FK), entry_type (clock_in|clock_out|pause_start|pause_end), timestamp (UTC, precisión minutos), latitude?, longitude?, ip_address?, device_info?, created_at
  — INMUTABLE: no se borra ni edita

TimeEntryAmendment (para correcciones)
  id, original_entry_id (FK), new_timestamp, reason, requested_by, approved_by, created_at
  — Auditoría completa de cambios

DailyRecord (vista materializada o calculada)
  employee_id, date, clock_in, clock_out, total_worked, total_pause, overtime, entry_type (ordinaria|extra|complementaria)
```

### Reglas críticas
- `TimeEntry` es **append-only** (nunca UPDATE ni DELETE)
- Toda corrección va por `TimeEntryAmendment` con doble autorización
- Timestamps siempre en **UTC**, mostrar en zona horaria `Europe/Madrid`
- El `DailyRecord` se calcula; el dato fuente es `TimeEntry`

---

## 5. Funcionalidades MVP

### Empleado (móvil)
- Fichar entrada / salida / inicio pausa / fin pausa con un botón
- Ver estado actual (fichado/no fichado)
- Ver historial propio de fichajes del mes
- Solicitar corrección de un fichaje erróneo

### Admin (web)
- Alta/baja de empleados
- Ver fichajes de todos los empleados
- Aprobar/rechazar correcciones
- Exportar registros (PDF o CSV) — necesario para inspecciones
- Dashboard: horas trabajadas, horas extra, alertas

### Sistema
- Log de auditoría completo (quién hizo qué y cuándo)
- Backup automático diario
- API versionada (/api/v1/...)

---

## 6. Reglas de Negocio

- Jornada máxima legal: **40h semanales** (media anual). Vigilar la reforma de 37.5h si se aprueba.
- Horas extra máximo: **80h/año** por trabajador
- Descanso mínimo entre jornadas: **12 horas**
- Descanso mínimo semanal: **día y medio ininterrumpido**
- Si un fichaje de entrada no tiene salida al final del día → generar alerta, no inventar datos
- Pausas: registrar inicio y fin (la reforma 2026 lo exige)

---

## 7. Seguridad

- HTTPS obligatorio (sin excepciones)
- Contraseñas hasheadas con **bcrypt** (cost ≥ 12)
- DNI almacenado como hash (no en texto plano)
- Rate limiting en login y endpoints de fichaje
- CORS restrictivo
- Headers de seguridad: HSTS, CSP, X-Frame-Options
- Logs de acceso y de errores con rotación
- No exponer stack traces en producción

---

## 8. Convenciones de Código

- Lenguaje del código: **inglés** (variables, funciones, comentarios técnicos)
- Lenguaje de la UI: **español** (textos, labels, mensajes)
- Estructura de carpetas tipo modular: `/modules/auth`, `/modules/timeEntry`, `/modules/employee`...
- Cada módulo: `routes`, `controller`, `service`, `repository`
- Validación de inputs con **Zod** o **Joi**
- Tests: al menos para lógica de cálculo de horas y reglas de negocio
- Migraciones de BD versionadas

---

## 9. Consideraciones de Escalabilidad (futuro)

No implementar ahora, pero diseñar para que sea posible:
- Multi-empresa (SaaS): ya modelado con `company_id`
- Geolocalización al fichar
- Gestión de vacaciones y ausencias
- Turnos rotativos
- Integración con nóminas
- Notificaciones push
- App nativa (stores)
- API para la ITSS (acceso remoto cuando la reforma lo exija)

---

## 10. Checklist de Cumplimiento Legal

Antes de poner en producción, verificar:
- [ ] Registro incluye hora:minuto de entrada y salida
- [ ] Registros inmutables con sistema de enmiendas auditado
- [ ] Retención de 4 años funcional
- [ ] Cada empleado accede solo a sus datos
- [ ] Exportación disponible para inspecciones
- [ ] Política de privacidad redactada y accesible
- [ ] Cifrado en tránsito y en reposo
- [ ] Backups automatizados y probados
- [ ] Log de auditoría activo
