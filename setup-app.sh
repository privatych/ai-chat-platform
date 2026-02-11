#!/bin/bash

# Application Setup Script

set -e
cd /var/www/ai-chat-platform

echo "🔧 Setting up AI Chat Platform..."

# Step 1: Install dependencies
echo "[1/7] Installing dependencies..."
pnpm install --frozen-lockfile

# Step 2: Create .env for API
echo "[2/7] Creating API .env file..."
cat > services/api/.env << 'EOF'
# Database
DATABASE_URL=postgresql://aichatuser:aichat2026secure@localhost:5432/aichatdb

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2026

# OpenRouter API
OPENROUTER_API_KEY=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

# CORS
FRONTEND_URL=http://185.209.30.133:3000

# Server
PORT=3001
NODE_ENV=production
EOF

# Step 3: Create .env for Web
echo "[3/7] Creating Web .env file..."
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://185.209.30.133:3001
EOF

# Step 4: Run database migrations
echo "[4/7] Running database migrations..."
cd packages/database
pnpm db:push
cd ../..

# Step 5: Seed initial data (models, test users)
echo "[5/7] Seeding database..."
cd packages/database
node scripts/update-admin-role.ts 2>/dev/null || echo "Admin user creation skipped"
cd ../..

# Step 6: Build all packages
echo "[6/7] Building project..."
pnpm build

# Step 7: Start with PM2
echo "[7/7] Starting applications with PM2..."

# Stop existing processes if any
pm2 delete ai-chat-api 2>/dev/null || true
pm2 delete ai-chat-web 2>/dev/null || true

# Start API
cd services/api
pm2 start dist/server.js --name ai-chat-api
cd ../..

# Start Web
cd apps/web
pm2 start npm --name ai-chat-web -- start
cd ../..

# Save PM2 process list
pm2 save

# Setup PM2 startup
pm2 startup systemd -u root --hp /root

echo "✅ Application setup complete!"
echo ""
echo "🌐 Application URLs:"
echo "  Frontend: http://185.209.30.133:3000"
echo "  API: http://185.209.30.133:3001"
echo ""
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "💡 Useful commands:"
echo "  pm2 logs - View logs"
echo "  pm2 restart all - Restart services"
echo "  pm2 stop all - Stop services"
