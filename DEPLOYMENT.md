# 🚀 Deployment Guide - Control Horario

## Pre-Deployment Checklist

### 1. Generate Secure Secrets
```bash
bash scripts/generate-secrets.sh
```

This will output secure values for:
- `JWT_SECRET` (256-bit)
- `JWT_REFRESH_SECRET` (256-bit)
- `AUDIT_LOG_KEY` (256-bit)
- `DB_PASSWORD` (20 chars alphanumeric)

### 2. Create Production Environment File
Create `backend/.env.production` (NOT in git):
```
DATABASE_URL="postgresql://control_user:GENERATED_DB_PASSWORD@db:5432/control_horario?schema=public"
JWT_SECRET="GENERATED_JWT_SECRET"
JWT_REFRESH_SECRET="GENERATED_JWT_REFRESH_SECRET"
AUDIT_LOG_KEY="GENERATED_AUDIT_LOG_KEY"
DB_USER="control_user"
DB_PASSWORD="GENERATED_DB_PASSWORD"
DB_NAME="control_horario"
PORT="3000"
NODE_ENV="production"
CORS_ORIGIN="https://your-domain.com"
```

### 3. Configure HTTPS
See [HTTPS_SETUP.md](./HTTPS_SETUP.md)

### 4. Update Nginx Configuration
See [nginx/nginx.conf](./nginx/nginx.conf) - HTTPS section must be configured

### 5. Deploy
```bash
# From the project root
docker-compose --env-file backend/.env.production up -d
```

## Security Checklist Before Going Live

- [ ] HTTPS enabled with valid certificate
- [ ] Secrets in .env (not in docker-compose.yml)
- [ ] CORS restricted to your domain
- [ ] Database port NOT exposed to internet
- [ ] HSTS header enabled
- [ ] Backup tests passing
- [ ] Logs rotation configured
- [ ] Rate limiting activated

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| DATABASE_URL | Yes | `postgresql://...` | Full connection string |
| JWT_SECRET | Yes | `abc123...` | Min 32 chars, use openssl rand -hex 32 |
| JWT_REFRESH_SECRET | Yes | `def456...` | Min 32 chars, use openssl rand -hex 32 |
| AUDIT_LOG_KEY | No | `ghi789...` | For encrypting audit logs (future) |
| DB_USER | No | `control_user` | Default: control_user |
| DB_PASSWORD | No | `pass123` | Default: control_pass (CHANGE!) |
| DB_NAME | No | `control_horario` | Default: control_horario |
| PORT | No | `3000` | Default: 3000 |
| NODE_ENV | Yes | `production` | Affects error messages, security headers |
| CORS_ORIGIN | Yes | `https://controlhorario.es` | Your frontend domain |

## Monitoring After Deployment

### Check logs
```bash
docker-compose logs -f api
docker-compose logs -f nginx
```

### Health check
```bash
curl https://your-domain.com/health
```

### Test JWT authentication
```bash
# Get access token
curl -X POST https://your-domain.com/api/v1/auth/login/admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"..."}'

# Use token to fetch user info
curl https://your-domain.com/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### "Database connection refused"
- Check `DATABASE_URL` in `.env.production`
- Verify `db` service is running: `docker-compose ps`
- Check DB logs: `docker-compose logs db`

### "Invalid JWT"
- Verify `JWT_SECRET` matches between backend and .env
- Check token hasn't expired
- Ensure `.env.production` is loaded, not `.env`

### "CORS blocked"
- Check `CORS_ORIGIN` matches your frontend domain
- Verify HTTPS if in production

### "HTTPS not working"
- Verify certificate files exist in `/etc/letsencrypt/`
- Check nginx logs: `docker-compose logs nginx`
- Ensure port 443 is not blocked

## Rotating Secrets

### JWT Secrets
1. Generate new secrets with `scripts/generate-secrets.sh`
2. Update `.env.production` with new values
3. Restart API: `docker-compose up -d api`
4. Old tokens will expire normally (within 7 days for refresh tokens)

### Database Password
1. Generate new password
2. Update both:
   - `DATABASE_URL` in `.env.production`
   - `POSTGRES_PASSWORD` in `.env.production`
3. Stop containers: `docker-compose down`
4. Delete postgres volume: `docker volume rm controlhorario_postgres_data`
5. Start with new password: `docker-compose up -d`

**WARNING**: Deleting postgres volume means losing all data. Restore from backup first if needed.

## Backup & Restore

### Automatic backups
- Run daily at 02:00 UTC
- Stored in `backup_data:/backups` (Docker volume)
- Retained for 4 years

### Manual backup
```bash
docker-compose exec db pg_dump -U control_user control_horario | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from backup
```bash
docker-compose exec -T db psql -U control_user control_horario < backup_YYYYMMDD_HHMMSS.sql
```

## Support

For security issues: security@controlhorario.es
For general support: support@controlhorario.es
