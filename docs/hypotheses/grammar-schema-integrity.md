# Grammar & Schema Integrity Hypotheses

## H-013: Grammar-Governed Schema Naming Eliminates ID Drift Across Bootstrap Generations

- **Source:** M-7B Run 1 (2026-03-01), Codex Signum Grammar v3.0 §morpheme composition
- **Claim:** When the Codex grammar enforces Agent node ID composition rules at the schema
  level, stale/malformed agent IDs cannot persist across bootstrap generations — eliminating
  the class of bugs where Thompson samples agents that have no corresponding priors or
  capability mappings
- **Status:** proposed
- **Prediction:**
  - After M-7C grammar refactor, `bootstrapAgents()` no longer requires stale agent cleanup
    because the grammar enforces compound ID format (`{model}:{thinking-mode}:{parameter}`)
    at the MERGE level, preventing bare-ID agents from being created
  - ID format becomes a structural property of the graph, not a convention enforced by scripts
- **Falsification:**
  - If the grammar can only express ID format constraints as documentation (not enforceable
    at the Cypher/constraint level), stale agent cleanup code remains necessary and the
    hypothesis is invalidated
  - If Neo4j constraint syntax cannot express morpheme composition rules, the enforcement
    must occur in application code, which is weaker than structural enforcement but still
    an improvement over post-hoc cleanup
- **Test Protocol:**
  1. Run `seed-agents.ts --force` with agent list A (including bare IDs like `claude-opus-4`)
  2. Run `seed-agents.ts --force` with agent list B (compound IDs like `claude-opus-4:extended:16k`)
  3. Verify: zero orphan Agent nodes exist; all IDs conform to grammar morpheme rules
  4. Verify: Thompson routing confidence > 0.5 for all seeded clusters (no 0.10 fallbacks)
- **Evidence (incident):**
  - M-7B Run 1: 54 Agent nodes in graph, only 31 in ALL_ARMS — 23 stale nodes from prior bootstrap
  - Medium-complexity tasks routed at 0.10 confidence (uniform prior) because Thompson selected
    stale agents (e.g. `claude-opus-4`) that had no arm stats in analytical:moderate:general
  - High-complexity tasks routed at 0.94–0.95 confidence because those clusters happened to
    resolve to agents whose IDs matched the seeded priors
  - Fix applied: `bootstrapAgents(force=true)` now DETACH DELETEs agents not in ALL_ARMS
    (commit `480973d`) — this is the band-aid; grammar enforcement is the structural fix
- **Connection to Core Principles:**
  - "State is structural" — ID format should be a graph constraint, not a cleanup script
  - Grammar morpheme composition governs how node identifiers are constructed, which is
    precisely the same mechanism that governs how semantic signals are composed
  - If the grammar can't enforce identity constraints, it raises questions about whether
    it can enforce the more complex structural invariants it's designed for
- **Notes:**
  - The stale agent problem also revealed that `gemini-3-pro-preview` 404s are caused by
    Vertex AI requiring global endpoints for Gemini 3.x models (not regional `us-central1`).
    This is a separate infrastructure issue but compounds the routing noise.
  - Hypothesis connects to H-010 (context-blocked posteriors): even correct Thompson
    implementation fails when the identity layer beneath it is inconsistent
  - Priority: medium — blocked on M-7C grammar refactor milestone
