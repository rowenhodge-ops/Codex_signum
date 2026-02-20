# DevAgent Pipeline — Constitutional Constraints

## Tier 1 (Mandatory)
- Correction Helix: maximum 3 iterations, then pass best available + signal degraded ΦL
- Each stage traces execution through the graph (model, duration, tokens, quality, success/failure)
- Stages do not share mutable state — communication through pipeline data flow only
- A stage that fails signals degradation, does not silently pass garbage forward

## Tier 2 (Preferred)
- REVIEW model should differ from EXECUTE model
- Each stage output includes confidence score for calibration tracking
