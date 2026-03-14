FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL certificates (optional)
RUN mkdir -p /etc/letsencrypt /var/www/certbot

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
