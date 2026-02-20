# Observer Pattern — Constitutional Constraints

## Tier 1 (Mandatory)
- Observer reads from graph only — no event callbacks or side channels
- Observer has its own ΦL — if it stops working, it degrades
- Observations are written as graph nodes, not logged to files

## Tier 2 (Preferred)
- Three-scale feedback: correction (immediate), learning (session), evolutionary (cross-session)
- Hypothesis evaluations include required sample size for statistical significance
