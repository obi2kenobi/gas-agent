#!/bin/bash

###############################################################################
# rollback.sh
#
# Rollback to previous production version
###############################################################################

set -e

COMMIT_SHA=${1:-""}

echo "⏪ Initiating rollback..."
echo ""

if [ -n "$COMMIT_SHA" ]; then
    echo "Rolling back to commit: $COMMIT_SHA"
    # Checkout previous version
    git checkout "$COMMIT_SHA" -- .
else
    echo "No commit specified, rolling back to last backup..."

    # Find most recent backup
    LATEST_BACKUP=$(ls -t backups/prod_backup_*.tar.gz 2>/dev/null | head -1)

    if [ -n "$LATEST_BACKUP" ]; then
        echo "Restoring from backup: $LATEST_BACKUP"
        tar -xzf "$LATEST_BACKUP"
    else
        echo "❌ No backups found"
        exit 1
    fi
fi

# Deploy the rolled-back version
echo "Deploying rolled-back version..."
clasp push --force

echo ""
echo "✅ Rollback complete"
echo "⚠️  Please verify the application is working correctly"
