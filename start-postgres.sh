#!/bin/bash

# Quick PostgreSQL Setup Script for Nomedia Production
# This script sets up and starts PostgreSQL with Docker

set -e

echo "🐘 Starting PostgreSQL setup for Nomedia Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop first."
        echo "Download from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Check if docker-compose.db.yml exists
check_compose_file() {
    if [ ! -f "docker-compose.db.yml" ]; then
        print_error "docker-compose.db.yml not found in current directory"
        print_status "Please ensure you're in the project root directory"
        exit 1
    fi
    print_success "Docker Compose file found"
}

# Create database init directory if it doesn't exist
setup_directories() {
    print_status "Setting up directories..."
    
    if [ ! -d "database" ]; then
        mkdir -p database/init
        print_status "Created database/init directory"
    fi
    
    if [ ! -d "database/init" ]; then
        mkdir -p database/init
        print_status "Created database/init directory"
    fi
    
    print_success "Directories ready"
}

# Start PostgreSQL containers
start_postgres() {
    print_status "Starting PostgreSQL containers..."
    
    # Stop any existing containers
    docker-compose -f docker-compose.db.yml down &> /dev/null || true
    
    # Start containers
    docker-compose -f docker-compose.db.yml up -d
    
    if [ $? -eq 0 ]; then
        print_success "PostgreSQL containers started successfully"
    else
        print_error "Failed to start PostgreSQL containers"
        exit 1
    fi
}

# Wait for PostgreSQL to be ready
wait_for_postgres() {
    print_status "Waiting for PostgreSQL to be ready..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec nomedia_postgres pg_isready -U nomedia_user -d nomedia_production &> /dev/null; then
            print_success "PostgreSQL is ready!"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "PostgreSQL failed to start within expected time"
            print_status "Check logs with: docker logs nomedia_postgres"
            exit 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
}

# Display connection information
show_connection_info() {
    echo ""
    echo "🎉 PostgreSQL is now running!"
    echo ""
    echo "📊 Connection Details:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: nomedia_production"
    echo "   Username: nomedia_user"
    echo "   Password: nomedia_secure_password_2024"
    echo ""
    echo "🌐 pgAdmin Web Interface:"
    echo "   URL: http://localhost:8081"
    echo "   Email: admin@nomedia.ma"
    echo "   Password: admin_pgadmin_2024"
    echo ""
    echo "🛠️  Useful Commands:"
    echo "   Stop:     docker-compose -f docker-compose.db.yml down"
    echo "   Logs:     docker-compose -f docker-compose.db.yml logs -f"
    echo "   Connect:  docker exec -it nomedia_postgres psql -U nomedia_user -d nomedia_production"
    echo "   Backup:   docker exec nomedia_postgres pg_dump -U nomedia_user nomedia_production > backup.sql"
    echo ""
}

# Update .env file
update_env_file() {
    print_status "Updating .env file..."
    
    ENV_FILE=".env"
    
    # Create .env if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        touch "$ENV_FILE"
    fi
    
    # Database configuration
    DB_CONFIG="
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://nomedia_user:nomedia_secure_password_2024@localhost:5432/nomedia_production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nomedia_production
DB_USER=nomedia_user
DB_PASSWORD=nomedia_secure_password_2024

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-nomedia-2024

# Server Configuration
PORT=3000
NODE_ENV=development
"
    
    # Check if database config already exists
    if grep -q "DATABASE_URL" "$ENV_FILE"; then
        print_warning ".env file already contains database configuration"
    else
        echo "$DB_CONFIG" >> "$ENV_FILE"
        print_success "Database configuration added to .env file"
    fi
}

# Main execution
main() {
    echo "🚀 Nomedia Production PostgreSQL Setup"
    echo "======================================="
    
    check_docker
    check_compose_file
    setup_directories
    start_postgres
    wait_for_postgres
    update_env_file
    show_connection_info
    
    print_success "Setup completed successfully!"
    print_status "You can now run your Nomedia Production application"
}

# Run main function
main "$@"
