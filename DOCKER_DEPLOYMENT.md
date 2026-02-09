# Docker Deployment Guide

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM
- At least 10GB disk space

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/privatych/ai-chat-platform.git
cd ai-chat-platform
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and set required variables:
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - DB_PASSWORD (set a secure password)
# - OPENROUTER_API_KEY (your OpenRouter API key)
nano .env
```

### 3. Start Services

```bash
# Start all services (database, redis, API, web)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Run Database Migrations

```bash
# Run migrations
docker-compose exec api pnpm --filter @ai-chat/database db:push

# Or manually
docker-compose exec postgres psql -U postgres -d ai_chat < packages/database/migrations/schema.sql
```

### 5. Access Application

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Docker Commands

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f [service_name]

# Example: view API logs
docker-compose logs -f api
```

### Database Operations

```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d ai_chat

# Backup database
docker-compose exec postgres pg_dump -U postgres ai_chat > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d ai_chat < backup.sql

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Redis Operations

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# View Redis stats
docker-compose exec redis redis-cli INFO

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

### Rebuilding Services

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build api

# Rebuild and start
docker-compose up -d --build
```

## Production Deployment

### 1. Environment Configuration

For production, update `.env`:

```bash
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# Use strong passwords
DB_PASSWORD=<strong_password>
JWT_SECRET=<generate_with_openssl_rand>

# Disable debug logging
LOG_LEVEL=warn
```

### 2. Security Hardening

```bash
# Update docker-compose.yml:
# - Remove port mappings for postgres and redis (use internal network only)
# - Add restart: always for all services
# - Configure proper logging limits
```

### 3. Reverse Proxy Setup

Use Nginx or Traefik as reverse proxy:

```nginx
# Nginx example
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. SSL/TLS with Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal is configured automatically
```

### 5. Monitoring

Add health checks to docker-compose.yml (already included):

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
  interval: 30s
  timeout: 3s
  retries: 3
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs [service_name]

# Check service health
docker-compose ps

# Restart service
docker-compose restart [service_name]
```

### Database Connection Issues

```bash
# Verify postgres is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec api node -e "require('pg').Client({connectionString: process.env.DATABASE_URL}).connect().then(() => console.log('OK')).catch(console.error)"
```

### Out of Memory

```bash
# Check container resources
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Or add to docker-compose.yml:
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3002
```

## Updating

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Run new migrations if any
docker-compose exec api pnpm --filter @ai-chat/database db:push
```

## Backup Strategy

### Automated Backups

Create backup script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup database
docker-compose exec -T postgres pg_dump -U postgres ai_chat > $BACKUP_DIR/db_$DATE.sql

# Backup volumes
docker run --rm -v ai-chat-platform_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres_data_$DATE.tar.gz /data

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Schedule with cron:

```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

## Performance Optimization

### 1. Enable Redis Caching

Update API to use Redis for:
- Session storage
- Rate limiting storage
- API response caching

### 2. Database Indexing

Already added in migrations:
- Index on `chats.user_id`
- Index on `chats.project_id`
- Index on `messages.chat_id`

### 3. Resource Limits

Set appropriate limits in docker-compose.yml:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          memory: 512M
```

## Monitoring & Logs

### Log Aggregation

Use Docker logging driver:

```yaml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Health Monitoring

All services include health checks. Monitor with:

```bash
# Check health status
docker-compose ps

# Get health details
docker inspect --format='{{.State.Health.Status}}' ai-chat-api
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/privatych/ai-chat-platform/issues
- Documentation: https://github.com/privatych/ai-chat-platform/docs
