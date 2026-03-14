#!/bin/bash

# Generate Secure Secrets for Production
# Usage: bash scripts/generate-secrets.sh

set -e

echo "🔐 Generating secure secrets for Control Horario..."
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: openssl not found. Install it and try again."
    exit 1
fi

# Generate JWT secrets (32 bytes = 256 bits = 64 hex chars)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
AUDIT_LOG_KEY=$(openssl rand -hex 32)

# Generate DB password (20 characters)
DB_PASSWORD=$(openssl rand -base64 20 | tr -d "=+/" | cut -c1-20)

echo "✅ Generated secrets:"
echo ""
echo "JWT_SECRET=\"$JWT_SECRET\""
echo "JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\""
echo "AUDIT_LOG_KEY=\"$AUDIT_LOG_KEY\""
echo "DB_PASSWORD=\"$DB_PASSWORD\""
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Copy the values above"
echo ""
echo "2. Create backend/.env.production or update backend/.env:"
echo "   DATABASE_URL=\"postgresql://control_user:${DB_PASSWORD}@db:5432/control_horario?schema=public\""
echo "   JWT_SECRET=\"${JWT_SECRET}\""
echo "   JWT_REFRESH_SECRET=\"${JWT_REFRESH_SECRET}\""
echo "   AUDIT_LOG_KEY=\"${AUDIT_LOG_KEY}\""
echo "   PORT=\"3000\""
echo "   NODE_ENV=\"production\""
echo "   CORS_ORIGIN=\"https://your-domain.com\""
echo ""
echo "3. Make sure .env files are NOT committed to git:"
echo "   cat .gitignore | grep -q '.env' && echo '✅ .env is in .gitignore' || echo '❌ Add .env to .gitignore'"
echo ""
echo "4. Deploy with: docker-compose --env-file backend/.env.production up -d"
echo ""
echo "⚠️  IMPORTANT: Store secrets securely!"
echo "   - DO NOT commit .env files to git"
echo "   - DO NOT share secrets via email or chat"
echo "   - Use a secrets manager (Vault, 1Password, AWS Secrets Manager, etc.)"
echo ""
