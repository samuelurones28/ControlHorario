# 🔒 HTTPS Setup Guide

## Option A: Using Let's Encrypt (Recommended for Production)

### Prerequisites
- Domain name pointing to your server
- Docker and Docker Compose installed
- Ports 80 and 443 accessible from the internet

### Step 1: Install Certbot
```bash
# On the server hosting Docker
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y
```

### Step 2: Generate Certificate
```bash
# First, stop Nginx to free port 80
docker-compose down nginx

# Generate certificate (standalone mode)
sudo certbot certonly \
  --standalone \
  --agree-tos \
  --no-eff-email \
  -m admin@controlhorario.es \
  -d controlhorario.es \
  -d www.controlhorario.es
```

This creates certificates in:
- `/etc/letsencrypt/live/controlhorario.es/fullchain.pem`
- `/etc/letsencrypt/live/controlhorario.es/privkey.pem`

### Step 3: Update Nginx Configuration
Replace the Nginx config with the HTTPS-enabled version (see below)

### Step 4: Start Services
```bash
docker-compose up -d
```

### Step 5: Verify HTTPS
```bash
curl https://controlhorario.es/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Step 6: Auto-Renewal
Let's Encrypt certificates expire in 90 days. Set up auto-renewal:

```bash
# Test renewal (dry-run)
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Option B: Self-Signed Certificate (Development Only)

**⚠️ DO NOT USE IN PRODUCTION - Browsers will show security warnings**

```bash
# Generate self-signed cert valid for 365 days
sudo openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout /etc/ssl/private/controlhorario-selfsigned.key \
  -out /etc/ssl/certs/controlhorario-selfsigned.crt \
  -subj "/C=ES/ST=Madrid/L=Madrid/O=ControlHorario/CN=localhost"

# Use in nginx.conf:
# ssl_certificate /etc/ssl/certs/controlhorario-selfsigned.crt;
# ssl_certificate_key /etc/ssl/private/controlhorario-selfsigned.key;
```

---

## Option C: AWS Certificate Manager (If Using AWS)

```bash
# In AWS console:
# 1. Request certificate in ACM for controlhorario.es
# 2. Validate domain ownership
# 3. Use ARN in Load Balancer (if using ALB/NLB)
```

---

## Nginx Configuration (HTTPS-Enabled)

Update your `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include mime.types;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name controlhorario.es www.controlhorario.es;

        # SSL Configuration
        ssl_certificate /etc/letsencrypt/live/controlhorario.es/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/controlhorario.es/privkey.pem;

        # Modern configuration (TLS 1.2 and 1.3)
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_session_tickets off;

        # HSTS (Strict-Transport-Security)
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

        # Security Headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

        # Content Security Policy (strict)
        add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" always;

        # API Proxy
        location /api/ {
            # Handle CORS preflight
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' 'https://controlhorario.es' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
                add_header 'Access-Control-Max-Age' 1728000;
                return 204;
            }

            proxy_pass http://api:3000/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $server_name;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }

        # Static Assets (cache long-term)
        location /assets/ {
            proxy_pass http://frontend:80/assets/;
            proxy_set_header Host $host;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }

        # Frontend (no cache)
        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires 0;
        }
    }
}
```

---

## Docker Compose Update

Update `docker-compose.yml` to expose both ports:

```yaml
nginx:
  image: nginx:alpine
  restart: unless-stopped
  ports:
    - "80:80"      # HTTP (redirects to HTTPS)
    - "443:443"    # HTTPS
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro  # Mount Let's Encrypt certs
  depends_on:
    - api
    - frontend
```

---

## Verification Checklist

```bash
# 1. Test HTTPS connection
curl -v https://controlhorario.es/health

# 2. Check certificate validity
echo | openssl s_client -servername controlhorario.es -connect controlhorario.es:443 2>/dev/null | grep -A 2 "subject="

# 3. Test certificate chain
openssl s_client -connect controlhorario.es:443 -showcerts

# 4. Verify HTTP → HTTPS redirect
curl -I http://controlhorario.es/
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://controlhorario.es/

# 5. Check SSL/TLS rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=controlhorario.es
```

---

## Troubleshooting

### Certificate not found
```
error: [emerg] open() "/etc/letsencrypt/live/controlhorario.es/fullchain.pem" failed
```
**Solution**: Ensure certificate is generated and path is correct in nginx.conf

### Port 443 already in use
```bash
sudo lsof -i :443
sudo kill -9 <PID>
```

### Certificate expired
```bash
sudo certbot renew --force-renewal
docker-compose restart nginx
```

### HSTS error after switching to HTTPS
If you previously tested with self-signed cert, browsers cache the error. Clear browser cache or wait for max-age to expire.

---

## Certificate Pinning (Optional - Advanced)

For maximum security, you can pin the certificate:

```nginx
# In Nginx config (requires client implementation)
add_header Public-Key-Pins 'pin-sha256="base64hash"; max-age=5184000; includeSubDomains' always;
```

---

## Compliance

After enabling HTTPS:
- ✅ RGPD Art. 32.1.b: Encryption in transit
- ✅ CLAUDEMD § 7: "HTTPS obligatorio"
- ✅ OWASP: Secure transport
- ✅ PCI DSS: TLS 1.2+ required

