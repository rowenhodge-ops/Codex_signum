#!/bin/bash
# On-stop summary — runs when Claude Code session ends
# Reports what happened during the session

echo ""
echo "=== SESSION SUMMARY ==="
echo ""

# Show commits from this session (last 20)
echo "--- Commits this session ---"
git log --oneline -20 2>/dev/null || echo "(no commits)"
echo ""

# Current branch
echo "--- Branch ---"
git branch --show-current 2>/dev/null
echo ""

# tsc status
echo "--- Type Check ---"
npx tsc --noEmit 2>&1 | tail -5
echo ""

# Test status (quick)
echo "--- Tests ---"
npm test 2>&1 | tail -3
echo ""

# Uncommitted changes
echo "--- Uncommitted Changes ---"
git status --short 2>/dev/null
if [ -z "$(git status --short 2>/dev/null)" ]; then
  echo "(clean working tree)"
fi
echo ""

# Unpushed commits
echo "--- Unpushed ---"
UNPUSHED=$(git log --oneline @{upstream}..HEAD 2>/dev/null)
if [ -n "$UNPUSHED" ]; then
  echo "$UNPUSHED"
  echo "⚠ Remember to push!"
else
  echo "(all pushed)"
fi

echo ""
echo "=== END SESSION ==="
