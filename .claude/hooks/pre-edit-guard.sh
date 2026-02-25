#!/bin/bash
# Pre-edit guard — catches known anti-patterns BEFORE the edit lands
# Fires on: Edit, MultiEdit, Write operations

FILE="$1"
CONTENT="$2"

# Only check TypeScript files in src/
if [[ ! "$FILE" =~ \.ts$ ]] || [[ ! "$FILE" =~ ^src/ ]]; then
  exit 0
fi

ERRORS=()

# 1. Firebase/Firestore imports (wrong database — this project uses Neo4j)
if echo "$CONTENT" | grep -qiE "firebase|firestore"; then
  ERRORS+=("BLOCKED: Firebase/Firestore reference detected. This project uses Neo4j.")
fi

# 2. Consumer app imports (core must be substrate-agnostic)
if echo "$CONTENT" | grep -qE "from.*agent/|from.*DND|from.*dnd-manager"; then
  ERRORS+=("BLOCKED: Consumer app import detected. Core is substrate-agnostic — no DND-Manager imports.")
fi

# 3. Fixed dampening γ=0.7 without topology computation
if echo "$CONTENT" | grep -qE "gamma\s*=\s*0\.7[^/]|dampening\s*=\s*0\.7|γ\s*=\s*0\.7"; then
  ERRORS+=("WARNING: Fixed dampening γ=0.7 detected. Use γ_effective = min(0.7, 0.8/(k-1)) per Engineering Bridge §Part 3.")
fi

# 4. Bare number as health score
if echo "$CONTENT" | grep -qE "health:\s*number|phi_l:\s*number|phiL:\s*number[^[]"; then
  ERRORS+=("WARNING: Bare number as health score. ΦL must always be a composite structure (PhiLOutput), never a single number.")
fi

# 5. prepare script in package.json
if [[ "$FILE" == "package.json" ]]; then
  if echo "$CONTENT" | grep -qE '"prepare"'; then
    ERRORS+=("BLOCKED: prepare script detected in package.json. This breaks GitHub dependency installs. See commit 4cd0ecc.")
  fi
fi

# 6. Missing .js extension on relative imports
if echo "$CONTENT" | grep -qE "from\s+['\"]\.\.?/[^'\"]+[^.][^j][^s]['\"]" 2>/dev/null; then
  # More precise check: relative imports that don't end in .js
  MISSING=$(echo "$CONTENT" | grep -nE "from\s+['\"]\./" | grep -v "\.js['\"]" | grep -v "\.json['\"]" | head -3)
  if [ -n "$MISSING" ]; then
    ERRORS+=("WARNING: Relative import(s) may be missing .js extension. All relative imports must use .js extension.")
  fi
fi

# 7. Invented file paths
if echo "$CONTENT" | grep -qE "from.*src/health/|from.*src/agent/|from.*src/config/|from.*src/services/|from.*src/monitoring/|from.*src/utils/firebase"; then
  ERRORS+=("BLOCKED: Import from non-existent directory. Check CLAUDE.md for actual file paths.")
fi

# 8. Direct Neo4j Promise.all (concurrent session.run causes issues)
if echo "$CONTENT" | grep -qE "Promise\.all.*session\.run|Promise\.all.*tx\.run"; then
  ERRORS+=("WARNING: Promise.all with session.run detected. Neo4j sessions should be sequential, not concurrent.")
fi

# Report errors
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "=== PRE-EDIT GUARD ==="
  for err in "${ERRORS[@]}"; do
    echo "  ⚠ $err"
  done
  echo "======================"
  
  # Block on BLOCKED errors, warn on WARNING
  for err in "${ERRORS[@]}"; do
    if [[ "$err" == BLOCKED:* ]]; then
      exit 1
    fi
  done
fi

exit 0
