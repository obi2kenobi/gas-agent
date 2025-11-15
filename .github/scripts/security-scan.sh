#!/bin/bash

###############################################################################
# security-scan.sh
#
# Security scanning for production deployments
###############################################################################

set -e

echo "🔐 Running security scan..."
echo ""

SECURITY_ISSUES=0

# Scan 1: Hardcoded credentials
echo "[1/4] Scanning for hardcoded credentials..."
if grep -r -i -E "(password|passwd|pwd)\s*=\s*['\"][^'\"]+['\"]" \
    --include="*.gs" . 2>/dev/null; then
    echo "  ❌ Found hardcoded passwords"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
    echo "  ✅ No hardcoded passwords"
fi

# Scan 2: API keys
echo "[2/4] Scanning for API keys..."
if grep -r -i -E "api[_-]?key\s*=\s*['\"][a-zA-Z0-9]{20,}['\"]" \
    --include="*.gs" \
    --exclude="TEST.gs" . 2>/dev/null; then
    echo "  ❌ Found hardcoded API keys"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
    echo "  ✅ No hardcoded API keys"
fi

# Scan 3: eval() usage
echo "[3/4] Scanning for dangerous functions..."
if grep -r "eval(" --include="*.gs" . 2>/dev/null; then
    echo "  ⚠️  Found eval() usage (security risk)"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
    echo "  ✅ No dangerous functions found"
fi

# Scan 4: PropertiesService usage
echo "[4/4] Verifying secure credential storage..."
if grep -r "PropertiesService" --include="*.gs" . > /dev/null 2>&1; then
    echo "  ✅ Uses PropertiesService for configuration"
else
    echo "  ⚠️  PropertiesService not used"
fi

echo ""
echo "================================"
echo "Security Scan Summary"
echo "================================"
echo "Issues found: $SECURITY_ISSUES"
echo "================================"

if [ $SECURITY_ISSUES -gt 0 ]; then
    echo ""
    echo "❌ Security issues found - deployment blocked"
    exit 1
else
    echo ""
    echo "✅ Security scan passed"
    exit 0
fi
