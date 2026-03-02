#!/bin/bash
# Pre-commit gate — full verification before every commit
# MUST pass before any commit is allowed

echo "=== PRE-COMMIT GATE ==="

# Verify agent-agnostic hooks are active
HOOKS_PATH=$(git config core.hooksPath 2>/dev/null)
if [ "$HOOKS_PATH" != ".githooks" ]; then
  echo "⚠ NOTE: Agent-agnostic git hooks not active. Run: git config core.hooksPath .githooks"
fi

# 1. Type check
echo "Running tsc..."
npx tsc --noEmit 2>&1
if [ $? -ne 0 ]; then
  echo "✗ GATE FAILED: tsc has errors. Fix before committing."
  exit 1
fi
echo "✓ tsc clean"

# 2. Run tests (catch regressions before they land)
echo "Running tests..."
TEST_OUTPUT=$(npm test 2>&1)
TEST_EXIT=$?
TEST_COUNT=$(echo "$TEST_OUTPUT" | grep -oE "[0-9]+ tests?" | tail -1)

if [ $TEST_EXIT -ne 0 ]; then
  echo "✗ GATE FAILED: Tests are failing. Fix before committing."
  echo "$TEST_OUTPUT" | tail -20
  exit 1
fi
echo "✓ Tests passing ($TEST_COUNT)"

# 3. Check test count hasn't decreased (regression detection)
# Extract current passing count
CURRENT_COUNT=$(echo "$TEST_OUTPUT" | grep -oE "([0-9]+) passed" | grep -oE "[0-9]+" | tail -1)
if [ -n "$CURRENT_COUNT" ]; then
  # Read baseline from CLAUDE.md
  BASELINE=$(grep -oE "Tests passing \| [0-9]+" CLAUDE.md | grep -oE "[0-9]+" | tail -1)
  if [ -n "$BASELINE" ] && [ "$CURRENT_COUNT" -lt "$BASELINE" ]; then
    echo "✗ GATE FAILED: Test count decreased ($CURRENT_COUNT < baseline $BASELINE)."
    echo "  Tests must only go up. If tests were intentionally removed, update baseline in CLAUDE.md first."
    exit 1
  fi
  echo "✓ Test count stable ($CURRENT_COUNT ≥ baseline ${BASELINE:-unknown})"
fi

# 4. Check barrel export count hasn't decreased
if [ -d "dist" ]; then
  EXPORT_COUNT=$(node -e "try { const c = require('./dist'); console.log(Object.keys(c).length) } catch(e) { console.log(0) }" 2>/dev/null)
  EXPORT_BASELINE=$(grep -oE "Barrel exports \| [0-9]+" CLAUDE.md | grep -oE "[0-9]+" | tail -1)
  if [ -n "$EXPORT_BASELINE" ] && [ -n "$EXPORT_COUNT" ] && [ "$EXPORT_COUNT" -lt "$EXPORT_BASELINE" ]; then
    echo "✗ GATE FAILED: Export count decreased ($EXPORT_COUNT < baseline $EXPORT_BASELINE)."
    echo "  Exports must not decrease without @deprecated aliases. Update baseline in CLAUDE.md if intentional."
    exit 1
  fi
  echo "✓ Export count stable ($EXPORT_COUNT ≥ baseline ${EXPORT_BASELINE:-unknown})"
fi

# 5. Check staged files for anti-patterns
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

# 6. Check dist/ is included if src/ files changed
SRC_CHANGED=$(echo "$STAGED" | grep "^src/" | head -1)
DIST_STAGED=$(echo "$STAGED" | grep "^dist/" | head -1)
if [ -n "$SRC_CHANGED" ] && [ -z "$DIST_STAGED" ]; then
  echo "✗ GATE FAILED: src/ files changed but dist/ not staged."
  echo "  Run: npm run build && git add dist/"
  echo "  (Skip with --no-verify if this is a docs-only or test-only commit that incidentally touched src/)"
  exit 1
fi
echo "✓ dist/ staged with src/ changes"

# 7. Check pipeline test coverage if src/signals/ was modified
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
