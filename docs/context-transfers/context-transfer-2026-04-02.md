# Context Transfer — 2026-04-02

**HEAD:** `63cb967` | **Tests:** 1,781/0 | **Exports:** 333+

---

## Session Summary

This session closed the autopoietic loop. Started with M-10 complete at `28f104c` and a Gnosis planning system that produced ephemeral console output. Ended with persistent intent Seeds, LLM enrichment via Thompson, cross-cycle delta tracking, memory-aware planning, and a `gnosis execute` command that bridges to the Architect. The first clean planning cycle produced 108 genuine intents from 42 unique structural gaps.

The path was not smooth — three failed planning runs produced snowball effects (645 → 1,482 → 2,152 intent Seeds) before root causes were identified and fixed. The root causes were all computation-layer bugs, not architectural issues.

---

## Session Commits (chronological)

| SHA | What |
|---|---|
| `80f3b8f` | **Gnosis Strategic Uplift Streams 0-5, 8** — violation coalesce, memory reads, cross-cycle delta, backlog awareness, BOCPD drift, intent persistence, CE scope detection |
| `a192542` | **Gnosis Streams 6-7** — LLM enrichment via Thompson, FLOWS_TO cognitive-bloom→architect, Architect SURVEY reads Gnosis context, `gnosis execute` command |
| `27d4d8e` | Prompt file: gnosis-intent-quality-fix.md |
| `56991ac` | **Intent Quality Fixes 1-4** — `retireDefinition()` + SUPERSEDED_BY, deterministic gap IDs, ecosystem-level dedup, gap clustering, def:bloom:assayer retired |
| `f0946f7` | Temporary gap diagnostic script (delete after analysis) |
| `63cb967` | **Section 3 spec-aligned fix** — missing-line check only for Bloom children (G1 alignment) |

---

## What Was Delivered

### Gnosis Strategic Planning Uplift (8 Streams)

| Stream | What | Status |
|---|---|---|
| 0-1 | Violation metadata coalesce (CE + A6 Highlander schemas) | ✅ |
| 2 | Planning reads LLM memory (posteriors, BOCPD, infra failures) | ✅ |
| 3a | Cross-cycle delta (previous planning observation) | ✅ |
| 3b | Backlog awareness (existing intent Seeds + R-items) | ✅ |
| 4 | BOCPD structural drift detection on ΦL/λ₂ | ✅ |
| 5 | ALL scored intents persist as Seeds in Gnosis Bloom | ✅ |
| 6 | Top-N intents enriched by Thompson-routed LLM | ✅ |
| 7a | FLOWS_TO cognitive-bloom → architect (idempotent) | ✅ |
| 7b | Architect SURVEY reads latest Gnosis planning context | ✅ |
| 7c | `gnosis execute` — reads top intent, writes projection, prints Architect cmd | ✅ |
| 8 | CE scope detection — unwired Blooms as governance intents | ✅ |

### Intent Quality Fixes

| Fix | What | Status |
|---|---|---|
| 1 | `retireDefinition()` — structural lifecycle operation for definition absorption/supersession. SUPERSEDED_BY Line type. | ✅ |
| 2 | Deterministic gap IDs — based on content (def ID, child ID), not survey context (bloom ID + counter) | ✅ |
| 3 | Ecosystem-level dedup in `computeScopedDelta()` — Map by gap ID | ✅ |
| 4 | Gap clustering — related missing-instance gaps grouped into composite intents | ✅ |
| 5 | Section 3 missing-line check — only Bloom children need inter-sibling FLOWS_TO (G1 spec-aligned) | ✅ |

### First Use: `def:bloom:assayer` Retired

Retired via `retireDefinition()` with SUPERSEDED_BY → `resonator:compliance-evaluation`. Reason: absorbed into Gnosis as CE faculty at M-25. Zero orphaned instances.

---

## First Clean Planning Cycle Results

| Metric | Value |
|---|---|
| Total intents | 108 |
| After dedup | 42 gaps (from 262 raw) |
| Constitutional gaps | 17 |
| Topological gaps | 25 |
| Intents persisted | 107 Seeds |
| Top 10 enriched | Yes, via Thompson (Opus 4-5/4-6 selected) |
| Processing time | ~33 min (mostly AuraDB Free persistence) |

**Category breakdown:** governance 41 (38%), pattern-topology 36 (33%), infrastructure 29 (27%), substrate-grounding 2 (2%)

**Top intent:** Clustered composite — 11 missing transformation instances (thompson-selection, human-gate, compliance-evaluation, instantiation, mutation, line-creation, etc.). Score 40.

---

## Three Snowball Incidents and Root Causes

### Snowball 1: 645 intents (first run)

**Root cause:** `computeScopedDelta()` surveyed 33 Blooms independently. Each reported the same ecosystem-level gaps. Gap IDs were sequential per Bloom (`gap:bloom-id:1`, `gap:bloom-id:2`), so dedup couldn't catch them. 20 unique gaps × 33 Blooms ≈ 600 duplicates.

**Fix:** Deterministic gap IDs based on content + Map dedup in `computeScopedDelta()`.

### Snowball 2: 1,482 intents (second run)

**Root cause:** The 645 intents from run 1 were now in the backlog. Section 3 of `computeConstitutionalDelta()` detected each intent Seed as a "child with no sibling FLOWS_TO" — producing ~1,200 false positive gaps for intent/observation/config Seeds inside the cognitive-bloom.

**Fix:** Section 3 skip for non-Bloom children (initially `def:`/`config:` prefix check, then refined to `!child.labels.includes('Bloom')`).

### Snowball 3: 2,152 intents (third run)

**Root cause:** Same as #2 but with more Seeds accumulated from runs 1-2.

**Fix:** Spec-aligned Bloom label check eliminates all non-stage false positives. DETACH DELETE of all 1,847 accumulated intent Seeds. Clean slate.

### Lesson: Fix the computation, not the output

Each snowball was a computation-layer bug producing false positives. The correct response was always to fix the computation function, never to filter/deduplicate/limit the output. "Persist all intents" is correct when the computation produces correct intents.

---

## Architectural Decisions Made This Session

1. **`retireDefinition()` is a structural lifecycle operation** — like `stampBloomComplete()` for definition absorption/supersession. Creates SUPERSEDED_BY Line. The system needs structural operations for lifecycle transitions, not prose decisions.

2. **Section 3 missing-line check is Bloom-only** — G1 says connection requires intent. Only Bloom children (pipeline stages) have a structural expectation of inter-sibling FLOWS_TO. Seeds may be Dormant (valid per spec). Resonators, Grids, Helixes connect cross-boundary by design.

3. **Gap IDs must be deterministic from content** — same gap from different surveys = same ID. Ecosystem gaps use definition ID. Per-Bloom gaps use Bloom ID. This is what makes persistence idempotency work.

4. **Thompson poka-yoke is NOT "dead model cleanup"** — infrastructure failures (404/429/auth/timeout) must NOT update posteriors. Models dim but preserve learned quality. Fix at the source: `updateStructuralMemoryAfterExecution()` classifies failures before recording. This was persisted to memory after being lost across 4+ chats.

5. **Raw Cypher is acceptable for cleaning up computation bug artifacts** — not an ongoing Protocol bypass, but a one-time correction of garbage data.

6. **Workflow: this chat for judgment, PowerShell for scripts, Claude Code for multi-file implementation** — Claude Code lacks architectural context and falls on priors. Direct script execution is faster and safer for simple operations.

---

## Known Issues

1. **PipelineRun Blooms flagged as "missing sibling Lines"** — intents #6-7. They're temporal execution containers, not pipeline stages. Section 3 correctly identifies them as Blooms but they don't need inter-sibling wiring. Refinement for next cycle.

2. **Topological gap descriptions are generic** — "lambda2=0: disconnected components" appears 7 times with no Bloom ID in the description. Gap IDs are per-Bloom but description text doesn't show which Bloom. Cosmetic.

3. **"Models: 0 active" display** — all 20 LLM models show as cold start (no posteriors from structural memory). Technically correct but misleading. Display issue.

4. **Staleness penalty not implemented** — prompt specified ×0.8 for intents proposed 3+ cycles. `proposedCycleCount` is tracked but penalty not applied in scoring. Data is there for future implementation.

5. **Dynamic `import()` for `createLine` in `persistIntents()`** — unnecessary overhead, `createLine` is already statically imported. Cleanup candidate.

6. **`scripts/diagnose-gaps.ts` and `scripts/cleanup-intents.ts`** — temporary diagnostic scripts, should be deleted.

7. **`scripts/resolve-snowball-batch.ts`** — temporary cleanup script, should be deleted.

---

## Graph State

| Metric | Value |
|---|---|
| HEAD | `63cb967` |
| Tests | 1,781 / 0 |
| Exports | 333+ (retireDefinition added, exact count pending build) |
| Intent Seeds | 107 proposed (clean, from first successful cycle) |
| Constitutional definitions | 28 active + 1 retired (def:bloom:assayer) |
| SUPERSEDED_BY Lines | 1 (def:bloom:assayer → resonator:compliance-evaluation) |
| FLOWS_TO cognitive-bloom → architect | 1 (created by Stream 7a) |
| LLM Blooms | 27 (20 active, 7 retired) |
| Compliance kills | 11 |

---

## API Signatures Added This Session

```typescript
// New in instantiation.ts
retireDefinition(defId: string, supersededById: string, reason: string): Promise<{ retired: boolean; orphanedInstances: string[] }>

// New Line type
VALID_LINE_TYPES now includes 'SUPERSEDED_BY'

// New in planning.ts
runPlanningCycle(modelExecutor?: ModelExecutor, enrichTopN?: number): Promise<PlanningReport>
enrichTopIntents(intents, bloomStates, modelExecutor, topN): Promise<number>
ensureGnosisToArchitectWiring(): Promise<boolean>
persistIntents(intents): Promise<PersistedIntentStats>
readLLMMemoryState(): Promise<{...}>
readExistingBacklog(): Promise<{...}>
detectStructuralDrift(bloomStates): Promise<Array<{...}>>
findUnwiredBlooms(): Promise<string[]>
clusterGapIntents(intents): PlanningIntent[]

// New CLI command
npx tsx scripts/cognitive.ts execute [--dry-run]
```

---

## What Needs To Happen Next

1. **Run `gnosis execute`** — pick the top intent (clustered missing transformation instances) and feed it to the Architect. This is the first intent-driven autopoietic cycle.

2. **Re-run `gnosis plan` after execution** — verify the delta shrinks (gaps should drop from 42, intents should update rather than recreate).

3. **Clean up temporary scripts** — `scripts/diagnose-gaps.ts`, `scripts/cleanup-intents.ts`, `scripts/resolve-snowball-batch.ts`.

4. **Roadmap v12.3** — record Gnosis strategic uplift, intent quality fixes, first clean planning cycle, `retireDefinition()`, SUPERSEDED_BY.

5. **Tier 2 improvements (emerge from cycle operation):**
   - PipelineRun Bloom exclusion from missing-line check
   - Topological gap descriptions include Bloom ID
   - Severity differentiation among constitutional gaps
   - Enrichment targeting (topology gaps over uniform constitutional gaps)
   - Staleness penalty for persistent proposed intents

6. **Thompson poka-yoke** — infrastructure failure classification in `updateStructuralMemoryAfterExecution()`. Should surface as a Gnosis intent once the system has run a few cycles with real pipeline execution data.
