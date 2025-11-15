#!/bin/bash

###############################################################################
# pre-deploy-check.sh
#
# Pre-deployment validation checks
###############################################################################

set -e

echo "🔍 Running pre-deployment checks..."
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Check 1: No hardcoded secrets
echo "[1/5] Checking for hardcoded secrets..."
if grep -r -i -E "(password|secret|api[_-]?key|token)\s*=\s*['\"][^'\"]+['\"]" \
    --include="*.gs" \
    --exclude="TEST.gs" \
    . 2>/dev/null; then
    echo "  ❌ FAILED: Found hardcoded secrets"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
else
    echo "  ✅ PASSED: No hardcoded secrets"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi

# Check 2: Valid .clasp.json
echo "[2/5] Validating .clasp.json..."
if [ -f ".clasp.json" ]; then
    if grep -q "scriptId" .clasp.json; then
        echo "  ✅ PASSED: .clasp.json is valid"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo "  ❌ FAILED: .clasp.json missing scriptId"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
else
    echo "  ❌ FAILED: .clasp.json not found"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 3: No console.log
echo "[3/5] Checking for console.log..."
CONSOLE_COUNT=$(grep -r "console\.log" --include="*.gs" . 2>/dev/null | wc -l)
if [ $CONSOLE_COUNT -eq 0 ]; then
    echo "  ✅ PASSED: No console.log found"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo "  ⚠️  WARNING: Found $CONSOLE_COUNT console.log statements"
    echo "     (Use Logger.log in Google Apps Script)"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi

# Check 4: Files exist
echo "[4/5] Checking for required files..."
FILE_COUNT=$(find . -name "*.gs" -type f | wc -l)
if [ $FILE_COUNT -gt 0 ]; then
    echo "  ✅ PASSED: Found $FILE_COUNT .gs files"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo "  ❌ FAILED: No .gs files found"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 5: Git status clean
echo "[5/5] Checking git status..."
if git diff --quiet 2>/dev/null; then
    echo "  ✅ PASSED: Working directory is clean"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo "  ⚠️  WARNING: Uncommitted changes found"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi

echo ""
echo "================================"
echo "Pre-deployment Check Summary"
echo "================================"
echo "✅ Passed: $CHECKS_PASSED"
echo "❌ Failed: $CHECKS_FAILED"
echo "================================"

if [ $CHECKS_FAILED -gt 0 ]; then
    echo ""
    echo "❌ Pre-deployment checks failed"
    exit 1
else
    echo ""
    echo "✅ All pre-deployment checks passed"
    exit 0
fi
