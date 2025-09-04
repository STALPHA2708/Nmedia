#!/bin/bash

echo "🚀 Setting up Nomedia Database..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root directory."
    exit 1
fi

echo "1️⃣ Installing dependencies..."
npm install

echo ""
echo "2️⃣ Setting up SQLite database..."
node setup-sqlite.js

echo ""
echo "3️⃣ Running contract fields migration..."
node migrate-contract-fields.js

echo ""
echo "4️⃣ Verifying database setup..."
if [ -f "nomedia.db" ]; then
    echo "✅ Database file created: nomedia.db"
    
    # Get database size
    db_size=$(du -h nomedia.db | cut -f1)
    echo "📊 Database size: $db_size"
    
    echo ""
    echo "🎉 Database setup completed successfully!"
    echo ""
    echo "📋 What's included:"
    echo "   • 5 Contract Types (CDI, CDD, Freelance, Stage, Consultant)"
    echo "   • 5 Departments (Production, Technique, Post-Production, Direction, Commercial)"
    echo "   • 4 Sample Employees"
    echo "   • 3 Sample Projects" 
    echo "   • Sample Invoices and Expenses"
    echo "   • Admin user (admin@nomedia.ma / admin123)"
    echo ""
    echo "🚀 You can now start the application:"
    echo "   npm run dev"
    echo ""
else
    echo "❌ Database setup failed. Please check the logs above."
    exit 1
fi
