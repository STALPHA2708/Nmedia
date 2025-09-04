#!/bin/bash

# =============================================================================
# Nomedia Production Deployment Script
# =============================================================================

set -e  # Exit on any error

# Configuration
APP_NAME="nomedia-production"
DEPLOYMENT_DIR="/opt/nomedia"
BACKUP_DIR="/backups"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

error_exit() {
    error "$1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    docker --version > /dev/null 2>&1 || error_exit "Docker is not installed or not running"
    
    # Check if Docker Compose is installed
    docker-compose --version > /dev/null 2>&1 || error_exit "Docker Compose is not installed"
    
    # Check if .env file exists
    [ -f ".env.production" ] || error_exit ".env.production file not found"
    
    success "Prerequisites check passed"
}

# Create backup before deployment
create_pre_deployment_backup() {
    log "Creating pre-deployment backup..."
    
    if docker-compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
        ./scripts/backup.sh || warning "Pre-deployment backup failed"
        success "Pre-deployment backup completed"
    else
        warning "Database not running, skipping backup"
    fi
}

# Pull latest code from Git
update_code() {
    log "Updating application code..."
    
    # Stash any local changes
    git stash --include-untracked || true
    
    # Pull latest changes
    git pull origin main || error_exit "Failed to pull latest code"
    
    success "Code updated successfully"
}

# Build application images
build_images() {
    log "Building application images..."
    
    # Build with no cache to ensure latest dependencies
    docker-compose -f $COMPOSE_FILE build --no-cache app || error_exit "Failed to build application image"
    
    success "Images built successfully"
}

# Stop existing services
stop_services() {
    log "Stopping existing services..."
    
    docker-compose -f $COMPOSE_FILE down --remove-orphans || warning "Some services were already stopped"
    
    success "Services stopped"
}

# Start database services first
start_database() {
    log "Starting database services..."
    
    docker-compose -f $COMPOSE_FILE up -d postgres redis || error_exit "Failed to start database services"
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    timeout 60 bash -c 'until docker-compose -f '$COMPOSE_FILE' exec -T postgres pg_isready -U $DB_USER -d $DB_NAME; do sleep 2; done' || error_exit "Database failed to start"
    
    success "Database services started"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Check if migration script exists and run it
    if [ -f "scripts/migrate.sh" ]; then
        ./scripts/migrate.sh || error_exit "Database migration failed"
    else
        warning "No migration script found, skipping migrations"
    fi
    
    success "Database migrations completed"
}

# Start application services
start_application() {
    log "Starting application services..."
    
    docker-compose -f $COMPOSE_FILE up -d app nginx || error_exit "Failed to start application services"
    
    success "Application services started"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Wait for application to be ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
            success "Health check passed"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error_exit "Health check failed after $max_attempts attempts"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if all services are running
    local services=("postgres" "redis" "app" "nginx")
    
    for service in "${services[@]}"; do
        if docker-compose -f $COMPOSE_FILE ps $service | grep -q "Up"; then
            success "$service is running"
        else
            error_exit "$service is not running"
        fi
    done
    
    # Check logs for any errors
    log "Checking application logs for errors..."
    if docker-compose -f $COMPOSE_FILE logs app | grep -i "error" | tail -5; then
        warning "Some errors found in logs, please review"
    fi
    
    success "Deployment verification completed"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker resources..."
    
    # Remove unused images
    docker image prune -f || true
    
    # Remove unused volumes (be careful with this in production)
    # docker volume prune -f || true
    
    success "Cleanup completed"
}

# Send deployment notification
send_notification() {
    if [ -n "$WEBHOOK_URL" ]; then
        log "Sending deployment notification..."
        
        local deployment_info=$(cat <<EOF
{
    "text": "🚀 Nomedia Production deployed successfully!",
    "attachments": [
        {
            "color": "good",
            "fields": [
                {"title": "Environment", "value": "Production", "short": true},
                {"title": "Timestamp", "value": "$(date)", "short": true},
                {"title": "Git Commit", "value": "$(git rev-parse --short HEAD)", "short": true},
                {"title": "Deployed By", "value": "$(whoami)", "short": true}
            ]
        }
    ]
}
EOF
)
        
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "$deployment_info" || warning "Failed to send notification"
        
        success "Deployment notification sent"
    fi
}

# Rollback function (in case of failure)
rollback() {
    error "Deployment failed, attempting rollback..."
    
    # Stop current services
    docker-compose -f $COMPOSE_FILE down || true
    
    # Start previous version (assuming images are still available)
    docker-compose -f $COMPOSE_FILE up -d || error_exit "Rollback failed"
    
    warning "Rollback completed, please check the application"
}

# Main deployment process
main() {
    log "=== Starting Nomedia Production Deployment ==="
    
    # Setup error handling for rollback
    trap 'rollback' ERR
    
    check_prerequisites
    create_pre_deployment_backup
    update_code
    build_images
    stop_services
    start_database
    run_migrations
    start_application
    health_check
    verify_deployment
    cleanup
    send_notification
    
    success "=== Deployment completed successfully! ==="
    
    # Show deployment summary
    echo
    log "Deployment Summary:"
    log "- Application URL: https://$(hostname -f)"
    log "- Git Commit: $(git rev-parse --short HEAD)"
    log "- Deployment Time: $(date)"
    log "- Container Status:"
    docker-compose -f $COMPOSE_FILE ps
    
    # Remove error trap
    trap - ERR
}

# Script arguments handling
case "${1:-}" in
    "health")
        health_check
        ;;
    "rollback")
        rollback
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        main "$@"
        ;;
esac
