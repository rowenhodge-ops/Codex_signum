#!/bin/bash
# Post-edit typecheck — runs tsc --noEmit after every file edit
# Gives Claude immediate feedback on type errors

FILE="$1"

# Only check TypeScript files
if [[ ! "$FILE" =~ \.ts$ ]]; then
  exit 0
fi

echo "=== TYPE CHECK ==="
npx tsc --noEmit 2>&1 | head -20

TSC_EXIT=${PIPESTATUS[0]}
if [ $TSC_EXIT -ne 0 ]; then
  echo "⚠ Type errors detected. Fix before continuing."
  exit 1
fi

echo "✓ tsc clean"
exit 0
