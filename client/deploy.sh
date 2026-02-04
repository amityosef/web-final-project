#!/bin/bash

# הגדרת נתיבים - וודא שהם נכונים עבורך
PROJECT_ROOT=$(pwd)
SERVER_DIR="$PROJECT_ROOT/server"
CLIENT_DIR="$PROJECT_ROOT/client"
NGINX_HTML="/var/www/html"

echo "🚀 Starting Deployment Process..."

# 1. עדכון והרצת ה-Server (Backend)
echo "📦 Setting up Backend..."
cd $SERVER_DIR
npm install
npm run build

# בדיקה אם ה-PM2 כבר רץ או שצריך להתחיל אותו
if pm2 show my-api > /dev/null 2>&1; then
    echo "🔄 Restarting existing PM2 process..."
    pm2 restart my-api
else
    echo "🚀 Starting new PM2 process..."
    pm2 start dist/src/server.js --name "my-api"
fi

# 2. עדכון והרצת ה-Client (Frontend)
echo "🎨 Setting up Frontend..."
cd $CLIENT_DIR
npm install
# התקנת הטיפוסים שפתרו לנו את הבעיה קודם
npm install -D @types/node 
npm run build

# 3. העברת קבצים ל-Nginx
echo "🚚 Moving files to Nginx directory..."
# שימוש ב-sudo כי התיקייה מוגנת
sudo rm -rf $NGINX_HTML/*
sudo cp -r dist/* $NGINX_HTML/

# 4. רענון Nginx
echo "🌐 Refreshing Nginx..."
sudo nginx -t && sudo systemctl restart nginx

echo "✅ Deployment Complete! Your site should be live."
pm2 list