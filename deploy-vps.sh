#!/bin/bash

# VPS Deployment Script for AI Chat Platform
# Ubuntu Server Setup

set -e  # Exit on error

echo "🚀 Starting VPS Deployment..."
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Update system
echo -e "${YELLOW}[1/10] Updating system...${NC}"
apt update && apt upgrade -y

# Step 2: Install Node.js 20.x LTS
echo -e "${YELLOW}[2/10] Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Step 3: Install pnpm
echo -e "${YELLOW}[3/10] Installing pnpm...${NC}"
npm install -g pnpm

# Step 4: Install PostgreSQL
echo -e "${YELLOW}[4/10] Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib

# Step 5: Install Nginx
echo -e "${YELLOW}[5/10] Installing Nginx...${NC}"
apt install -y nginx

# Step 6: Install PM2
echo -e "${YELLOW}[6/10] Installing PM2...${NC}"
npm install -g pm2

# Step 7: Install Git (if not present)
echo -e "${YELLOW}[7/10] Installing Git...${NC}"
apt install -y git

# Step 8: Create app directory
echo -e "${YELLOW}[8/10] Creating app directory...${NC}"
mkdir -p /var/www/ai-chat-platform
cd /var/www/ai-chat-platform

# Step 9: Clone repository
echo -e "${YELLOW}[9/10] Cloning repository...${NC}"
if [ -d ".git" ]; then
    echo "Repository exists, pulling latest..."
    git pull origin main
else
    git clone https://github.com/privatych/ai-chat-platform.git .
fi

# Step 10: Setup PostgreSQL database
echo -e "${YELLOW}[10/10] Setting up PostgreSQL...${NC}"
sudo -u postgres psql -c "CREATE DATABASE aichatdb;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER aichatuser WITH ENCRYPTED PASSWORD 'aichat2026secure';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aichatdb TO aichatuser;"
sudo -u postgres psql -c "ALTER DATABASE aichatdb OWNER TO aichatuser;"

echo -e "${GREEN}✅ Base setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure .env files"
echo "2. Install dependencies (pnpm install)"
echo "3. Run migrations"
echo "4. Build project"
echo "5. Start with PM2"
echo ""
echo "Database credentials:"
echo "  Database: aichatdb"
echo "  User: aichatuser"
echo "  Password: aichat2026secure"
echo "  Host: localhost"
echo "  Port: 5432"
