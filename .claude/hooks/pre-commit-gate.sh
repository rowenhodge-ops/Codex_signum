#!/bin/bash
# Pre-commit gate — full verification before every commit
# MUST pass before any commit is allowed

echo "=== PRE-COMMIT GATE ==="

# 1. Type check
echo "Running tsc..."
npx tsc --noEmit 2>&1
if [ $? -ne 0 ]; then
  echo "✗ GATE FAILED: tsc has errors. Fix before committing."
  exit 1
fi
echo "✓ tsc clean"

# 2. Check staged files for anti-patterns
STAGED=$(git diff --cached --name-only)

# Check for Firebase references in staged files
if echo "$STAGED" | xargs grep -l "firebase\|firestore" 2>/dev/null | grep -q .; then
  echo "✗ GATE FAILED: Staged files contain Firebase/Firestore references."
  exit 1
fi
echo "✓ No Firebase references"

# Check for prepare script
if echo "$STAGED" | grep -q "package.json"; then
  if git diff --cached -- package.json | grep -qE '^\+.*"prepare"'; then
    echo "✗ GATE FAILED: prepare script being added to package.json."
    exit 1
  fi
fi
echo "✓ No prepare script"

# Check for consumer imports in src/
CONSUMER_IMPORTS=$(echo "$STAGED" | grep "^src/" | xargs grep -l "from.*agent/\|from.*DND\|from.*dnd-manager" 2>/dev/null)
if [ -n "$CONSUMER_IMPORTS" ]; then
  echo "✗ GATE FAILED: Consumer app imports in core files: $CONSUMER_IMPORTS"
  exit 1
fi
echo "✓ No consumer imports in core"

# 3. Check dist/ is included if src/ files changed
SRC_CHANGED=$(echo "$STAGED" | grep "^src/" | head -1)
DIST_STAGED=$(echo "$STAGED" | grep "^dist/" | head -1)
if [ -n "$SRC_CHANGED" ] && [ -z "$DIST_STAGED" ]; then
  echo "⚠ WARNING: src/ files changed but dist/ not staged. Run: npm run build && git add dist/"
fi

# 4. Check pipeline test coverage if src/signals/ was modified
SIGNALS_CHANGED=$(echo "$STAGED" | grep "^src/signals/" | head -1)
if [ -n "$SIGNALS_CHANGED" ]; then
  PIPELINE_TESTS=$(find tests/pipeline -name "*.test.ts" 2>/dev/null | head -1)
  if [ -z "$PIPELINE_TESTS" ]; then
    echo "⚠ WARNING: src/signals/ modified but tests/pipeline/ has no *.test.ts files."
    echo "  Pipeline tests are Level 3 (Engineering Bridge §Part 4). See tests/pipeline/signal-conditioning.test.ts"
  fi
fi

echo "=== GATE PASSED ==="
exit 0
