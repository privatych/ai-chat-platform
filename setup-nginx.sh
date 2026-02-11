#!/bin/bash

# Nginx configuration for ai.itoq.ru

set -e

echo "🌐 Setting up Nginx for ai.itoq.ru..."

# Create Nginx config
cat > /etc/nginx/sites-available/ai-chat << 'NGINXCONF'
# API Server
server {
    listen 80;
    server_name api.ai.itoq.ru;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Web Frontend
server {
    listen 80;
    server_name ai.itoq.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Next.js specific
        proxy_buffering off;
    }
}
NGINXCONF

# Enable site
ln -sf /etc/nginx/sites-available/ai-chat /etc/nginx/sites-enabled/

# Test nginx config
echo "Testing Nginx configuration..."
nginx -t

# Reload nginx
echo "Reloading Nginx..."
systemctl reload nginx

echo "✅ Nginx configured!"
echo ""
echo "🌐 Your site will be available at:"
echo "   Frontend: http://ai.itoq.ru"
echo "   API: http://api.ai.itoq.ru"
echo ""
echo "⚠️  Note: DNS propagation may take 1-5 minutes"
echo "⚠️  Cloudflare will provide automatic SSL (HTTPS)"
