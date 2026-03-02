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

# 9. Eliminated entities — things that USED to exist but were removed/renamed
# Source: ELIMINATED_ENTITIES in src/patterns/architect/survey.ts + M-7C renames
# These are the most common hallucination category for coding agents working on this repo.
# Skip eliminated entity check for files that are ABOUT eliminated entities
if [[ "$FILE" == *"hallucination-detection"* ]] || [[ "$FILE" == *"survey.ts"* ]]; then
  # These files define or test the eliminated entity list — they must reference the old names
  :  # no-op, skip this check
else
  ELIMINATED_PATTERNS=(
    # Pre-M-7C node labels (renamed in M-7C grammar refactor)
    "\\bAgent\\b.*label"       # Agent → Seed (Neo4j label)
    "\\bPattern\\b.*label"     # Pattern → Bloom (Neo4j label)
    ":Agent[^s]"               # Cypher :Agent label (but not "Agents" the word)
    ":Pattern[^E]"             # Cypher :Pattern label (but not "PatternExchange")

    # Pre-M-7C relationship types
    "SELECTED[^_]"             # SELECTED → ROUTED_TO (but not SELECTED_SEED)
    ":MADE_BY"                 # MADE_BY → ORIGINATED_FROM
    ":OBSERVED_BY"             # OBSERVED_BY → OBSERVED_IN

    # Pre-M-7C property names (in new code, not backward-compat aliases)
    "selectedAgentId"          # → selectedSeedId
    "madeByPatternId"          # → madeByBloomId
    "sourcePatternId"          # → sourceBloomId

    # Eliminated architectural patterns
    "class Observer"           # Observer pattern eliminated (ce0ef96)
    "new Observer"             # Observer pattern eliminated
    "ModelSentinel"            # Never existed — hallucinated entity
    "model.sentinel"           # Never existed — hallucinated entity
    "collector\\.ts"           # Anti-pattern: observation pipeline
    "evaluator\\.ts"           # Anti-pattern: separate evaluation layer
    "auditor\\.ts"             # Anti-pattern: monitoring overlay
  )

  for pattern in "${ELIMINATED_PATTERNS[@]}"; do
    if echo "$CONTENT" | grep -qE "$pattern"; then
      MATCH=$(echo "$CONTENT" | grep -nE "$pattern" | head -1)
      # Skip if it's in a @deprecated comment or backward-compat alias block
      LINE_CONTENT=$(echo "$MATCH" | cut -d: -f2-)
      if echo "$LINE_CONTENT" | grep -qiE "@deprecated|backward.compat|legacy|ELIMINATED_ENTITIES|Agent → Seed|Pattern → Bloom"; then
        continue
      fi
      ERRORS+=("WARNING: Eliminated entity reference: '$pattern' found. Check M-7C renames and ELIMINATED_ENTITIES list. Line: $MATCH")
    fi
  done
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
