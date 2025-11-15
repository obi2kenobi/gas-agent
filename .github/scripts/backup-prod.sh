#!/bin/bash

###############################################################################
# backup-prod.sh
#
# Create backup of production environment before deployment
###############################################################################

set -e

echo "💾 Creating production backup..."
echo ""

BACKUP_DIR="backups"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
BACKUP_NAME="prod_backup_${TIMESTAMP}"

mkdir -p "$BACKUP_DIR"

# Pull current production code
echo "Pulling current production code..."
if clasp pull 2>/dev/null; then
    # Create backup archive
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" ./*.gs 2>/dev/null || true

    echo "✅ Backup created: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
else
    echo "⚠️  Could not pull production code"
    echo "   (This may be expected if this is the first deployment)"
fi

echo ""
echo "Backup complete"
