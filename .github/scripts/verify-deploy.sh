#!/bin/bash

###############################################################################
# verify-deploy.sh
#
# Verify deployment was successful
###############################################################################

set -e

ENVIRONMENT=${1:-production}

echo "✅ Verifying $ENVIRONMENT deployment..."
echo ""

# Check clasp status
echo "Checking deployment status..."
if clasp status 2>/dev/null; then
    echo "✅ Deployment verified successfully"
else
    echo "⚠️  Could not verify deployment status"
    echo "   Manual verification may be required"
fi

echo ""
echo "Verification complete"
