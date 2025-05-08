#!/bin/bash

# Domain configuration
DOMAIN="findme.co.ua"

# Create necessary directories
mkdir -p nginx/ssl
mkdir -p data/media

# Move nginx.conf to the proper location
cat > nginx/nginx.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Redirect all HTTP requests to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate     /etc/nginx/ssl/$DOMAIN.crt;
    ssl_certificate_key /etc/nginx/ssl/$DOMAIN.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://findme-frontend:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://findme-backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend admin
    location /admin/ {
        proxy_pass http://findme-backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Backend static files
    location /static/ {
        proxy_pass http://findme-backend:8000;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend media files
    location /media/ {
        alias /data/media/;
        autoindex off;
    }

    # Enable gzip compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_types
        application/javascript
        application/json
        application/xml
        text/css
        text/plain
        text/xml;
}
EOF

echo "Nginx configuration created at nginx/nginx.conf"
echo "For production, replace the self-signed certificates with real ones."
echo "You can use Let's Encrypt with certbot to get free SSL certificates."

# Generate self-signed SSL certificate for development
echo "Generating self-signed SSL certificate for development..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/$DOMAIN.key \
  -out nginx/ssl/$DOMAIN.crt \
  -subj "/CN=$DOMAIN/O=My Company/C=US"

echo "Self-signed SSL certificate generated."
echo "To start the services, run: docker-compose up -d"
