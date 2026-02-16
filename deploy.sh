#!/bin/bash

PROJECT_ROOT="/home/node84/web-final-project"
SERVER_DIR="$PROJECT_ROOT/server"
CLIENT_DIR="$PROJECT_ROOT/client"
NGINX_HTML="/var/www/html"

chmod +x "$0"

echo "🔄 Step 1: Pulling latest changes from Git..."
cd "$PROJECT_ROOT" || exit
sudo chown -R node84:node84 "$PROJECT_ROOT"
git pull origin main || git pull origin master

echo "📦 Step 2: Setting up Backend (Express)..."
cd "$SERVER_DIR" || exit
npm ci
npm run build

echo "🚀 Restarting PM2 process..."
pm2 restart my-api --update-env || pm2 start dist/src/server.js --name "my-api"

echo "🎨 Step 3: Setting up Frontend (React)..."
cd "$CLIENT_DIR" || exit
npm ci
npm run build

echo "🚚 Step 4: Moving files to Nginx..."
sudo rm -rf ${NGINX_HTML:?}/*
sudo cp -r dist/* "$NGINX_HTML/"

sudo chown -R www-data:www-data "$NGINX_HTML"
sudo chmod -R 755 "$NGINX_HTML"

echo "🌐 Step 5: Refreshing Nginx..."
sudo systemctl reload nginx || sudo systemctl restart nginx

echo "✅ DONE! Your app is updated and live."
pm2 list