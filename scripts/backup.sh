#!/bin/sh
# Backup script for Control Horario database
# Retains backups for 4 years (1460 days)

BACKUP_DIR="/backups"
DB_NAME="control_horario"
DB_USER="control_user"
DB_HOST="db"
RETENTION_DAYS=1460

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).dump"
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_FILE" 2>> "$BACKUP_DIR/backup.log"

if [ $? -eq 0 ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup created successfully: $BACKUP_FILE" >> "$BACKUP_DIR/backup.log"
  
  # Compress the backup
  gzip "$BACKUP_FILE"
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup compressed" >> "$BACKUP_DIR/backup.log"
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup failed!" >> "$BACKUP_DIR/backup.log"
  exit 1
fi

# Clean up old backups (older than 4 years / 1460 days)
find "$BACKUP_DIR" -name "backup_*.dump.gz" -mtime +$RETENTION_DAYS -delete 2>> "$BACKUP_DIR/backup.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Cleaned old backups (older than $RETENTION_DAYS days)" >> "$BACKUP_DIR/backup.log"

exit 0
