@echo off
REM 🚀 Quick Deploy to Render Script for Windows
REM This script prepares your app for Render deployment

echo 🚀 Preparing Nomedia for Render deployment...
echo.

REM Check if git is initialized
if not exist .git (
    echo ❌ Git not initialized. Run 'git init' first!
    exit /b 1
)

REM Add all changes
echo 📦 Adding files to git...
git add .

REM Commit with timestamp
echo 💾 Creating commit...
git commit -m "Production deployment - all bugs fixed %date%"

REM Check if remote exists
git remote | findstr "origin" >nul
if errorlevel 1 (
    echo ⚠️  No GitHub remote found!
    echo Please create a GitHub repo and run:
    echo git remote add origin https://github.com/YOUR_USERNAME/nomedia-production.git
    exit /b 1
)

REM Push to GitHub
echo ⬆️  Pushing to GitHub...
git push origin main

echo.
echo ✅ Code pushed to GitHub!
echo.
echo 📋 Next steps:
echo 1. Go to https://render.com
echo 2. Click 'New +' → 'Web Service'
echo 3. Connect your GitHub repo
echo 4. Use these settings:
echo    - Build Command: npm install ^&^& npm run build
echo    - Start Command: npm start
echo    - Add environment variables from DEPLOY_FREE.md
echo.
echo 5. Click 'Create Web Service'
echo.
echo 🎉 Your app will be live in 3-5 minutes!
echo.
echo 🔑 Your secrets (copy these to Render):
echo JWT_SECRET=5c639d48d7c92d433e4b4731b38af4093d5f8582a82d7236bb1475e7f9fd1964
echo SESSION_SECRET=85d1ea416ba1a3a2ee8c545b4777576f4df07342476688e7835ad134b0673dd9
echo.
pause
