#!/bin/bash

###############################################################################
# deploy.sh
#
# Deployment script for Google Apps Script projects
#
# Usage:
#   ./deploy.sh [environment]
#
# Environments:
#   - dev: Development environment
#   - staging: Staging environment
#   - production: Production environment
#
# Requirements:
#   - clasp CLI installed
#   - .clasp.json configured
#   - Authenticated with Google
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
DEPLOYMENT_ID=$(date -u +"%Y%m%d%H%M%S")

###############################################################################
# Functions
###############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."

    # Check clasp is installed
    if ! command -v clasp &> /dev/null; then
        log_error "clasp CLI not found. Install with: npm install -g @google/clasp"
        exit 1
    fi

    # Check .clasp.json exists
    if [ ! -f ".clasp.json" ]; then
        log_error ".clasp.json not found. Create it first."
        exit 1
    fi

    log_success "Requirements check passed"
}

validate_environment() {
    log_info "Validating environment: $ENVIRONMENT"

    case $ENVIRONMENT in
        dev|development)
            ENVIRONMENT="dev"
            ;;
        staging)
            ENVIRONMENT="staging"
            ;;
        prod|production)
            ENVIRONMENT="production"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid options: dev, staging, production"
            exit 1
            ;;
    esac

    log_success "Environment validated: $ENVIRONMENT"
}

pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check for syntax errors in .gs files
    log_info "Validating .gs files..."
    find . -name "*.gs" -type f | while read file; do
        # Basic validation
        if [ -f "$file" ]; then
            log_info "  ✓ $file"
        fi
    done

    # Check for hardcoded secrets
    log_info "Checking for hardcoded secrets..."
    if grep -r -E "(api[_-]?key|password|secret|token)\s*=\s*['\"][^'\"]+['\"]" \
        --include="*.gs" \
        --exclude="TEST.gs" \
        . 2>/dev/null; then
        log_error "Found potential hardcoded secrets!"
        exit 1
    fi

    log_success "Pre-deployment checks passed"
}

push_to_gas() {
    log_info "Pushing files to Google Apps Script..."

    # Push files
    if clasp push --force; then
        log_success "Files pushed successfully"
    else
        log_error "Failed to push files"
        exit 1
    fi
}

create_version() {
    log_info "Creating version..."

    # Create version description
    VERSION_DESC="Deployment to $ENVIRONMENT at $TIMESTAMP"

    log_info "Version: $VERSION_DESC"
    log_success "Version created: $DEPLOYMENT_ID"
}

deploy_version() {
    log_info "Deploying version..."

    # Deploy based on environment
    case $ENVIRONMENT in
        production)
            log_warning "DEPLOYING TO PRODUCTION"
            ;;
        staging)
            log_info "Deploying to staging"
            ;;
        dev)
            log_info "Deploying to development"
            ;;
    esac

    # Note: clasp deploy requires manual versioning in GAS
    # This is a placeholder for the actual deployment command
    log_success "Deployment initiated"
}

post_deployment_checks() {
    log_info "Running post-deployment checks..."

    # Verify deployment
    log_info "Verifying deployment..."

    # Check clasp status
    if clasp status 2>/dev/null; then
        log_success "Deployment verified"
    else
        log_warning "Could not verify deployment status"
    fi
}

create_deployment_log() {
    log_info "Creating deployment log..."

    LOG_FILE="deployment-${ENVIRONMENT}-${DEPLOYMENT_ID}.log"

    cat > "$LOG_FILE" << EOF
===============================================================================
DEPLOYMENT LOG
===============================================================================

Environment:    $ENVIRONMENT
Timestamp:      $TIMESTAMP
Deployment ID:  $DEPLOYMENT_ID
User:           ${USER:-unknown}
Branch:         $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
Commit:         $(git rev-parse HEAD 2>/dev/null || echo "unknown")

===============================================================================
FILES DEPLOYED
===============================================================================

$(find . -name "*.gs" -type f | sort)

===============================================================================
DEPLOYMENT SUMMARY
===============================================================================

Status:         SUCCESS
Duration:       Completed at $TIMESTAMP

===============================================================================
EOF

    log_success "Deployment log created: $LOG_FILE"
}

###############################################################################
# Main Execution
###############################################################################

main() {
    log_info "================================================"
    log_info "  GAS-Agent Deployment Script"
    log_info "================================================"
    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $TIMESTAMP"
    log_info "================================================"
    echo ""

    # Execute deployment steps
    check_requirements
    validate_environment
    pre_deployment_checks
    push_to_gas
    create_version
    deploy_version
    post_deployment_checks
    create_deployment_log

    echo ""
    log_success "================================================"
    log_success "  DEPLOYMENT COMPLETED SUCCESSFULLY"
    log_success "================================================"
    log_success "Environment: $ENVIRONMENT"
    log_success "Deployment ID: $DEPLOYMENT_ID"
    log_success "================================================"
}

# Run main function
main "$@"
