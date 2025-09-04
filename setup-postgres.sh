#!/bin/bash

# Nomedia Production - PostgreSQL Setup Script
echo "🐳 Setting up PostgreSQL for Nomedia Production..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Create init directory if it doesn't exist
mkdir -p init-postgres

# Start PostgreSQL container
echo "🚀 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker-compose exec postgres pg_isready -U nomedia_user -d nomedia_production &> /dev/null; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# Check if PostgreSQL is actually ready
if ! docker-compose exec postgres pg_isready -U nomedia_user -d nomedia_production &> /dev/null; then
    echo "❌ PostgreSQL failed to start properly"
    docker-compose logs postgres
    exit 1
fi

# Display connection info
echo ""
echo "🎉 PostgreSQL is now running!"
echo ""
echo "📊 Database Connection Info:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: nomedia_production"
echo "  Username: nomedia_user"
echo "  Password: nomedia_password123"
echo ""
echo "🔧 Environment Variables to set:"
echo "  DATABASE_TYPE=postgresql"
echo "  DB_HOST=localhost"
echo "  DB_PORT=5432"
echo "  DB_NAME=nomedia_production"
echo "  DB_USER=nomedia_user"
echo "  DB_PASSWORD=nomedia_password123"
echo ""
echo "📱 Optional pgAdmin (Database GUI):"
echo "  URL: http://localhost:8081"
echo "  Email: admin@nomedia.ma"
echo "  Password: admin123"
echo ""
echo "🚀 To start pgAdmin: docker-compose up -d pgadmin"
echo "🛑 To stop all: docker-compose down"
echo "📊 To view logs: docker-compose logs postgres"
echo ""
