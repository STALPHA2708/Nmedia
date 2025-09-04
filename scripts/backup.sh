#!/bin/bash

# =============================================================================
# Nomedia Production Database Backup Script
# =============================================================================

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="nomedia_backup_${DATE}.sql"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# Database configuration
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-nomedia_production}
DB_USER=${DB_USER:-nomedia_user}

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check if database is accessible
check_database() {
    log "Checking database connectivity..."
    pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" || error_exit "Database is not accessible"
    log "Database is accessible"
}

# Create backup directory
setup_backup_dir() {
    log "Setting up backup directory..."
    mkdir -p "$BACKUP_DIR" || error_exit "Failed to create backup directory"
    log "Backup directory ready: $BACKUP_DIR"
}

# Create database backup
create_backup() {
    log "Starting database backup..."
    
    # Full database backup with verbose output
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --no-owner \
        --no-privileges \
        --create \
        --clean \
        > "${BACKUP_DIR}/${BACKUP_FILE}" || error_exit "Database backup failed"
    
    log "Database backup completed: ${BACKUP_FILE}"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    log "Backup file size: $BACKUP_SIZE"
}

# Compress backup
compress_backup() {
    log "Compressing backup file..."
    
    gzip "${BACKUP_DIR}/${BACKUP_FILE}" || error_exit "Backup compression failed"
    
    COMPRESSED_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)
    log "Compressed backup size: $COMPRESSED_SIZE"
    log "Backup compressed: ${BACKUP_FILE}.gz"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
    
    find "$BACKUP_DIR" -name "nomedia_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "nomedia_backup_*.sql.gz" | wc -l)
    log "Cleanup completed. Remaining backups: $REMAINING_BACKUPS"
}

# Upload to cloud storage (optional)
upload_to_cloud() {
    if [ -n "$AWS_S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
        log "Uploading backup to AWS S3..."
        
        aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" \
            "s3://${AWS_S3_BUCKET}/backups/${BACKUP_FILE}.gz" \
            --storage-class STANDARD_IA || log "WARNING: S3 upload failed"
        
        log "Backup uploaded to S3"
    fi
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    # Test if the compressed file is valid
    gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}.gz" || error_exit "Backup file is corrupted"
    
    # Check if backup contains expected content
    gunzip -c "${BACKUP_DIR}/${BACKUP_FILE}.gz" | head -n 20 | grep -q "PostgreSQL database dump" || error_exit "Backup content verification failed"
    
    log "Backup integrity verified"
}

# Send notification (optional)
send_notification() {
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"✅ Database backup completed successfully: ${BACKUP_FILE}.gz\"}" \
            || log "WARNING: Notification webhook failed"
    fi
}

# Main execution
main() {
    log "=== Starting Nomedia Database Backup ==="
    
    check_database
    setup_backup_dir
    create_backup
    compress_backup
    verify_backup
    cleanup_old_backups
    upload_to_cloud
    send_notification
    
    log "=== Backup completed successfully ==="
    log "Backup file: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
}

# Error handling
trap 'error_exit "Backup script interrupted"' INT TERM

# Run main function
main "$@"
