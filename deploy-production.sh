#!/bin/bash
# Quick Production Deployment Script for Nomedia

echo "🚀 Nomedia Production Deployment Script"
echo "=========================================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
node_version=$(node -v)
echo "Node.js version: $node_version"

if [[ ! "$node_version" =~ ^v1[8-9]\. ]] && [[ ! "$node_version" =~ ^v2[0-9]\. ]]; then
    echo "❌ Node.js 18+ required. Current: $node_version"
    exit 1
fi
echo "✅ Node.js version compatible"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Build frontend
echo "🏗️  Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Frontend built successfully"
echo ""

# Check environment variables
echo "🔐 Checking environment variables..."
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Creating .env from template..."

    cat > .env << 'EOF'
# Production Environment Variables
NODE_ENV=production
PORT=8000

# Database (UPDATE THIS!)
DATABASE_TYPE=sqlite
SQLITE_PATH=./nomedia.db

# Security (CHANGE THESE!)
JWT_SECRET=CHANGE-THIS-TO-A-LONG-RANDOM-STRING-32-CHARS-MIN
JWT_EXPIRES_IN=7d
SESSION_SECRET=ANOTHER-LONG-RANDOM-STRING-DIFFERENT-FROM-JWT
BCRYPT_ROUNDS=12

# API Configuration
API_BASE_URL=http://localhost:8000/api
FRONTEND_URL=http://localhost:8080

# For PostgreSQL production (uncomment and configure):
# DATABASE_URL=postgresql://user:password@host:5432/database
EOF

    echo "⚠️  IMPORTANT: Edit .env file and update the following:"
    echo "   1. JWT_SECRET - Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    echo "   2. SESSION_SECRET - Generate another random string"
    echo "   3. DATABASE_URL - If using PostgreSQL"
    echo ""
    echo "Press Enter after updating .env to continue, or Ctrl+C to exit..."
    read
fi
echo "✅ Environment configured"
echo ""

# Database check
echo "🗄️  Checking database..."
if [ -f "nomedia.db" ]; then
    db_size=$(du -h nomedia.db | cut -f1)
    echo "✅ SQLite database found (Size: $db_size)"

    # Create backup
    backup_name="nomedia_backup_$(date +%Y%m%d_%H%M%S).db"
    cp nomedia.db "backups/$backup_name" 2>/dev/null || mkdir -p backups && cp nomedia.db "backups/$backup_name"
    echo "✅ Database backed up to backups/$backup_name"
else
    echo "⚠️  No database found - will be created on first run"
fi
echo ""

# Security check
echo "🔐 Security check..."
if grep -q "CHANGE-THIS" .env 2>/dev/null; then
    echo "❌ ERROR: Default secrets detected in .env!"
    echo "   You MUST change JWT_SECRET and SESSION_SECRET before production!"
    echo "   Generate secrets with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    exit 1
fi
echo "✅ Security configuration looks good"
echo ""

# Test production build
echo "🧪 Testing production build..."
NODE_ENV=production timeout 5s npm start &
server_pid=$!
sleep 3

if kill -0 $server_pid 2>/dev/null; then
    echo "✅ Server started successfully"
    kill $server_pid 2>/dev/null
else
    echo "❌ Server failed to start"
    exit 1
fi
echo ""

# Success!
echo "======================================"
echo "✅ Production deployment check complete!"
echo "======================================"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. LOCAL TESTING:"
echo "   npm start"
echo "   Visit: http://localhost:8000"
echo ""
echo "2. DEPLOY TO RAILWAY (Recommended - Easiest):"
echo "   - Go to https://railway.app"
echo "   - Sign up with GitHub"
echo "   - Create new project from GitHub repo"
echo "   - Add PostgreSQL database"
echo "   - Set environment variables"
echo "   - Deploy automatically!"
echo ""
echo "3. DEPLOY TO RENDER:"
echo "   - Go to https://render.com"
echo "   - Create PostgreSQL database"
echo "   - Create Web Service from repo"
echo "   - Set environment variables"
echo "   - Deploy!"
echo ""
echo "4. DEPLOY TO VPS:"
echo "   - Install PM2: npm install -g pm2"
echo "   - Start: pm2 start npm --name nomedia -- start"
echo "   - Save: pm2 save && pm2 startup"
echo "   - Setup Nginx reverse proxy"
echo ""
echo "📖 Full guide: See PRODUCTION_DEPLOYMENT.md"
echo ""
echo "🎉 Your app is ready for production!"
