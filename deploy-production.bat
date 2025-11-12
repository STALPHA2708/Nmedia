@echo off
REM Quick Production Deployment Script for Nomedia (Windows)

echo.
echo ========================================
echo 🚀 Nomedia Production Deployment Script
echo ========================================
echo.

REM Check Node.js
echo 📦 Checking Node.js version...
node -v
if errorlevel 1 (
    echo ❌ Node.js not found! Install from nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js found
echo.

REM Install dependencies
echo 📥 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Dependency installation failed
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Build frontend
echo 🏗️  Building frontend...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)
echo ✅ Frontend built successfully
echo.

REM Check database
echo 🗄️  Checking database...
if exist "nomedia.db" (
    echo ✅ Database found: nomedia.db
    REM Create backup
    if not exist "backups" mkdir backups
    copy nomedia.db "backups\nomedia_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.db" >nul
    echo ✅ Database backed up
) else (
    echo ⚠️  No database found - will be created on first run
)
echo.

REM Success
echo ======================================
echo ✅ Production build complete!
echo ======================================
echo.
echo 📋 What's Next?
echo.
echo 🧪 Test locally first:
echo    npm start
echo    Open: http://localhost:8000
echo.
echo 🚀 Deploy to Production:
echo.
echo    OPTION 1: Railway.app (EASIEST) ⭐
echo    ├─ Go to: https://railway.app
echo    ├─ Sign up with GitHub
echo    ├─ New Project → Deploy from GitHub
echo    ├─ Add PostgreSQL database
echo    └─ Auto-deploys! ✅
echo.
echo    OPTION 2: Render.com
echo    ├─ Go to: https://render.com
echo    ├─ Create PostgreSQL database
echo    ├─ Create Web Service
echo    └─ Deploy!
echo.
echo    OPTION 3: Vercel + Supabase
echo    ├─ Database: https://supabase.com
echo    ├─ Frontend: https://vercel.com
echo    └─ Connect and deploy!
echo.
echo 📖 Full guide: Open PRODUCTION_DEPLOYMENT.md
echo.
echo 🎉 Your app is production-ready!
echo.
pause
