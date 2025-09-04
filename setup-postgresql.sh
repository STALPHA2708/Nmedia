#!/bin/bash

echo "🚀 Setting up PostgreSQL Database for Nomedia..."
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql"
    echo "   Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Check if PostgreSQL service is running
if ! sudo service postgresql status &> /dev/null && ! brew services list | grep postgresql | grep started &> /dev/null; then
    echo "⚠️ PostgreSQL service is not running. Starting it..."
    
    # Try to start PostgreSQL service
    if command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    elif command -v service &> /dev/null; then
        sudo service postgresql start
    elif command -v brew &> /dev/null; then
        brew services start postgresql
    else
        echo "❌ Unable to start PostgreSQL service automatically."
        echo "Please start PostgreSQL manually and run this script again."
        exit 1
    fi
    
    sleep 2
fi

echo "1️⃣ Creating database and user..."

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE nomedia_production;" 2>/dev/null || echo "Database might already exist"
sudo -u postgres psql -c "CREATE USER nomedia_user WITH PASSWORD 'nomedia_password';" 2>/dev/null || echo "User might already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nomedia_production TO nomedia_user;" 2>/dev/null
sudo -u postgres psql -c "ALTER USER nomedia_user CREATEDB;" 2>/dev/null

echo ""
echo "2️⃣ Testing database connection..."

# Test the connection
if PGPASSWORD=nomedia_password psql -h localhost -U nomedia_user -d nomedia_production -c "SELECT 1;" &> /dev/null; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed. Please check PostgreSQL configuration."
    exit 1
fi

echo ""
echo "3️⃣ Initializing database schema..."

# Run the Node.js database initialization
if [ -f "package.json" ]; then
    npm install
    node -e "
    const { initializeDatabase } = require('./server/config/init-database.ts');
    initializeDatabase().then(() => {
        console.log('✅ Database schema initialized successfully!');
        process.exit(0);
    }).catch(err => {
        console.error('❌ Database schema initialization failed:', err);
        process.exit(1);
    });
    "
else
    echo "❌ package.json not found. Please run this script from the project root directory."
    exit 1
fi

echo ""
echo "🎉 PostgreSQL setup completed successfully!"
echo ""
echo "📋 Database Configuration:"
echo "   • Host: localhost"
echo "   • Port: 5432"
echo "   • Database: nomedia_production"
echo "   • User: nomedia_user"
echo "   • Password: nomedia_password"
echo ""
echo "🚀 You can now start the application:"
echo "   npm run dev"
echo ""
