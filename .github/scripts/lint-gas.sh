#!/bin/bash

###############################################################################
# lint-gas.sh
#
# Code quality checks for Google Apps Script files
###############################################################################

set -e

echo "🎨 Linting Google Apps Script files..."
echo ""

# Check for common issues
ISSUES_FOUND=0

# Check 1: Functions without JSDoc
echo "Checking for undocumented functions..."
UNDOCUMENTED=$(grep -r "^function " --include="*.gs" . | wc -l)
DOCUMENTED=$(grep -r -B1 "^function " --include="*.gs" . | grep -c "^\s*/\*\*" || echo "0")

if [ $UNDOCUMENTED -gt 0 ]; then
    DOC_RATE=$((DOCUMENTED * 100 / UNDOCUMENTED))
    echo "  Documentation rate: ${DOC_RATE}%"
    if [ $DOC_RATE -lt 60 ]; then
        echo "  ⚠️  Low documentation coverage"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

# Check 2: Naming conventions
echo "Checking naming conventions..."
if grep -r "^function [a-z]" --include="*.gs" . > /dev/null; then
    echo "  ✅ camelCase function names found"
fi

# Check 3: Code complexity (very long functions)
echo "Checking for overly complex functions..."
while IFS= read -r file; do
    if [ -f "$file" ]; then
        # Count lines in functions (simple heuristic)
        LINES=$(wc -l < "$file")
        if [ $LINES -gt 500 ]; then
            echo "  ⚠️  $file is very long ($LINES lines)"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    fi
done < <(find . -name "*.gs" -type f)

echo ""
if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ Linting passed with no issues"
    exit 0
else
    echo "⚠️  Found $ISSUES_FOUND potential issues"
    echo "   (These are warnings, not failures)"
    exit 0
fi
