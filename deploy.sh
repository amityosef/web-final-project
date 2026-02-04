#!/bin/bash
PROJECT_ROOT=$(pwd)
SERVER_DIR="$PROJECT_ROOT/server"
CLIENT_DIR="$PROJECT_ROOT/client"
NGINX_HTML="/var/www/html"

echo "🔄 Step 1: Pulling latest changes from Git..."
cd $PROJECT_ROOT
git pull origin main || git pull origin master

echo "📦 Step 2: Setting up Backend (Express)..."
cd $SERVER_DIR
npm install
npm run build

echo "🚀 Restarting PM2 process..."
pm2 restart my-api || pm2 start dist/src/server.js --name "my-api"

echo "🎨 Step 3: Setting up Frontend (React)..."
cd $CLIENT_DIR
npm install
npm run build

echo "🚚 Step 4: Moving files to Nginx and fixing permissions..."
sudo rm -rf $NGINX_HTML/*
sudo cp -r dist/* $NGINX_HTML/

sudo chown -R www-data:www-data $NGINX_HTML
sudo chmod -R 755 $NGINX_HTML

echo "🌐 Step 5: Refreshing Nginx..."
sudo systemctl restart nginx

echo "✅ DONE! Your app is updated and live."
pm2 list