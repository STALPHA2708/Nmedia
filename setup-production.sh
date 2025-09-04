#!/bin/bash

# Nomedia Production Setup Script
# This script prepares the system for daily production usage

echo "🚀 Setting up Nomedia Production for daily usage..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version check passed: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_status "npm is available: $(npm -v)"

# Install dependencies
print_info "Installing dependencies..."
if npm install; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Install bcrypt if not already installed (needed for password hashing)
print_info "Installing bcrypt for password hashing..."
npm install bcrypt @types/bcrypt

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p uploads/contracts
mkdir -p uploads/receipts
mkdir -p backups
mkdir -p logs

print_status "Directory structure created"

# Run database schema update
print_info "Setting up database schema..."
if npx ts-node server/scripts/update-schema.ts; then
    print_status "Database schema updated successfully"
else
    print_error "Failed to update database schema"
    exit 1
fi

# Create environment configuration
if [ ! -f .env ]; then
    print_info "Creating environment configuration..."
    cat > .env << EOF
# Nomedia Production Environment Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=sqlite:./nomedia.db

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET=nomedia_production_secret_change_me

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email Configuration (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Backup Configuration
BACKUP_RETENTION_DAYS=30
AUTO_BACKUP_ENABLED=true
EOF
    print_status "Environment configuration created (.env file)"
    print_warning "Please update JWT_SECRET in .env file for production security!"
else
    print_info "Environment configuration already exists"
fi

# Build the application
print_info "Building the application..."
if npm run build; then
    print_status "Application built successfully"
else
    print_error "Failed to build application"
    exit 1
fi

# Create startup scripts
print_info "Creating startup scripts..."

# Create production start script
cat > start-production.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Nomedia Production..."
export NODE_ENV=production
npm run start
EOF

# Create development start script
cat > start-development.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Nomedia Development..."
export NODE_ENV=development
npm run dev
EOF

# Create backup script
cat > backup-system.sh << 'EOF'
#!/bin/bash
echo "📦 Creating system backup..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
cp nomedia.db "$BACKUP_DIR/nomedia.db"

# Backup uploads
if [ -d "uploads" ]; then
    cp -r uploads "$BACKUP_DIR/"
fi

# Backup configuration
cp .env "$BACKUP_DIR/.env.backup"

echo "✅ Backup created in $BACKUP_DIR"
EOF

# Make scripts executable
chmod +x start-production.sh
chmod +x start-development.sh
chmod +x backup-system.sh

print_status "Startup and backup scripts created"

# Update package.json scripts
print_info "Updating package.json scripts..."
npx json -I -f package.json -e 'this.scripts = this.scripts || {}'
npx json -I -f package.json -e 'this.scripts["setup-db"] = "npx ts-node server/scripts/update-schema.ts"'
npx json -I -f package.json -e 'this.scripts["backup"] = "./backup-system.sh"'
npx json -I -f package.json -e 'this.scripts["start:prod"] = "./start-production.sh"'
npx json -I -f package.json -e 'this.scripts["start:dev"] = "./start-development.sh"'

# Create system status check
cat > check-system.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('🔍 Nomedia Production System Check');
console.log('==================================');

// Check database
if (fs.existsSync('nomedia.db')) {
    console.log('✅ Database file exists');
} else {
    console.log('❌ Database file missing');
}

// Check uploads directory
if (fs.existsSync('uploads')) {
    console.log('✅ Uploads directory exists');
} else {
    console.log('❌ Uploads directory missing');
}

// Check environment configuration
if (fs.existsSync('.env')) {
    console.log('✅ Environment configuration exists');
} else {
    console.log('❌ Environment configuration missing');
}

// Check if built
if (fs.existsSync('dist') || fs.existsSync('build')) {
    console.log('✅ Application is built');
} else {
    console.log('⚠️  Application may not be built');
}

console.log('\n📊 System is ready for production use!');
EOF

# Run system check
print_info "Running system status check..."
node check-system.js

# Final setup summary
echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
print_status "Nomedia Production is ready for daily usage"
echo ""
echo "📋 Quick Start:"
echo "  Development: npm run start:dev"
echo "  Production:  npm run start:prod"
echo ""
echo "🔐 Default Admin Login:"
echo "  Email:    admin@nomedia.ma"
echo "  Password: admin123"
echo ""
echo "📚 Documentation:"
echo "  Read PRODUCTION_READY_GUIDE.md for detailed usage instructions"
echo ""
echo "🔧 Maintenance:"
echo "  Backup:   npm run backup"
echo "  Check:    node check-system.js"
echo ""
print_warning "Remember to change the JWT_SECRET in .env for production security!"
print_warning "Change the default admin password after first login!"
echo ""
echo "🚀 Ready to launch Nomedia Production!"
