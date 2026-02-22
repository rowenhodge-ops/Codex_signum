# Pipeline Supercharge — Full Model Roster + Hallucination Wiring + Circuit Breaker + OpEx Metrics + Core Integration

## Context

**Repos:**
- `Codex_signum` (core) — main at `4cd0ecc`. **READ-ONLY for this session.**
- `DND-Manager` (consumer) — main at `d5ef6801`. Open PR #2 (`phase-2` → main).

**Branch:** Create `phase-4/pipeline-supercharge` from current main (or from phase-3/reconciliation head if it's ahead).

**What this session does:** Six phases, 35 tasks that transform the pipeline from a 4-model proof-of-concept into a 20+ model self-improving system with production-grade observability, circuit breaking, human feedback loops, and structural governance. Each phase builds on the previous. Do them in order.

---

## Hard Rules

1. **Neo4j with neo4j-driver. NO Firebase/Firestore.** `neo4j.int()` for all integer Cypher parameters.
2. **Do NOT modify the Codex_signum repo or node_modules.** The core is read-only. Import from `@codex-signum/core`.
3. **Do NOT add a prepare script to package.json.** The core's `dist/` is pre-committed. npm prepare breaks GitHub dependency installs.
4. **`npx tsc --noEmit` must pass before every commit.**
5. **Commit + push after each numbered task.** The commit log is the status report.
6. **One `mapToNativeModelId()` function, one location.** Do not create a second. Do not leave a second.
7. **No state in JSON files.** If it persists, it goes to Neo4j. `thompson-state.json`, `model-performance.json`, `session-state.json` are violations.
8. **`models.ts` is the single source of truth for model configuration.** `nativeClients.ts` derives from it, not vice versa.

---

## Architectural Context (inject into every Copilot session)

```
ARCHITECTURAL CONTEXT:
- This project uses Neo4j (neo4j-driver). There is NO Firebase/Firestore in the agent layer.
- All integer Cypher parameters MUST use neo4j.int().
- Health computation (ΦL, ΨH, εR) lives in @codex-signum/core, not in local files.
- The consumer app (DND-Manager) imports from @codex-signum/core via GitHub dependency.
- dist/ is committed in Codex_signum. There is no prepare script. Do not add one.
- Do NOT touch the Codex_signum repository unless explicitly instructed.
- The CodexBridge (agent/codex-bridge.ts) is the ONLY entry point from DND-Manager into core.
- models.ts is the SINGLE source of truth for model config. nativeClients.ts derives from it.
- Every task MUST commit and push to remote on completion.
```

---

See the full 1,460-line implementation prompt in the Claude project knowledge base under `pipeline-supercharge-v1.md`. This file in the repo serves as the reference copy and index.

For the complete task specifications including all code samples, Cypher queries, wiring instructions, and commit messages, refer to the project knowledge version.

---

## Phase Summary

### Phase 1: Fix the Model Registry (5 tasks)
Expand from 4 hardcoded models to 20+ confirmed roster. Single source of truth in models.ts.

### Phase 2: Wire Hallucination Detection (3 tasks)
OutputValidator → assessor adapter → HallucinationCollector → Neo4j persistence.

### Phase 3: Classify Infrastructure Errors + Circuit Breaker (3 tasks)
Error taxonomy. Infrastructure errors skip Thompson updates. Provider-level circuit breaker (Jidoka).

### Phase 4: OpEx Metrics (5 tasks)
RTY, %C&A per stage, context-blocked posteriors, cost forecasting (leading indicator), exploration floor.

### Phase 5: Wire Core Exports — Tier 1 Integration (8 tasks)
propagateDegradation, threshold events, feedback effectiveness, graph-native Thompson state, orphaned Decision reconciliation, human feedback signal, constitutional violations → ΦL.

### Phase 6: Final Verification + Contract Tests (6 tasks)
TypeScript check, contract tests for core dependency, SURVEY, codexStats, final commit.

---

## What This Unlocks (16 capabilities)

1. 20+ models available to Thompson sampling (was 4)
2. Per-stage hallucination detection with Neo4j persistence
3. Infrastructure vs quality error classification
4. Circuit breaker prevents cascading provider failures
5. RTY measures first-pass pipeline quality
6. %C&A per stage measures downstream acceptance
7. Context-blocked posteriors (stage-aware routing)
8. Cost forecasting (first leading indicator)
9. Exploration floor prevents cold-start convergence
10. Graph-backed Thompson state (no JSON files)
11. Threshold events with maturity-indexed boundaries
12. Feedback effectiveness tracking (Scale 1 Loop)
13. Human feedback signal enables validator calibration
14. Constitutional violations feed ΦL (structural governance)
15. Orphan reconciliation keeps graph clean
16. Contract tests catch core drift

---

## OpEx Lineage

| Mechanism | Principle | Source |
|---|---|---|
| Circuit breaker | Jidoka (autonomation) | TPS |
| Pre-filtering | Poka-yoke (mistake-proofing) | Shingo |
| Cost forecasting | Leading indicators | Balanced Scorecard |
| RTY | Rolled Throughput Yield | Six Sigma |
| %C&A | Percent Complete & Accurate | Lean |
| Exploration floor | Design of Experiments | DOE |
| Orphan reconciliation | 5S | Lean |
| Human feedback | Kaizen | TPS |
| Violations → ΦL | Structural governance | Codex Signum |
