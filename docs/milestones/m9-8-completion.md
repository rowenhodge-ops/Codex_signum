# M-9.8 Completion Report — Ecosystem Bootstrap

**Milestone:** M-9.8 — Ecosystem Bootstrap: Operating in the Codex
**Date:** 2026-03-05
**Status:** Complete

---

## Summary

The project roadmap, hypotheses, and @future test seeds are now live structural data in Neo4j. The Architect SURVEY stage reads ecosystem state from the graph when a `graphClient` is provided. All writes are idempotent (MERGE-based) and non-fatal.

## What Was Built

### Task 1: Schema Design + Constraints
- Created [m9-8-ecosystem-schema.md](../specs/m9-8-ecosystem-schema.md) — morpheme mapping for all ecosystem nodes
- Added `SCOPED_TO` and `OBSERVES` to `RELATIONSHIP_TYPES` registry (10 → 12)
- Added 4 indexes: `bloom_type`, `bloom_sequence`, `helix_type`, `seed_seed_type`
- Commit: `f1f8015`

### Task 2: Bootstrap Script (Roadmap + Milestones + Hypotheses)
- Created `scripts/bootstrap-ecosystem.ts` — idempotent MERGE-based bootstrap
- 25 major milestones + 13 M-9 sub-milestones mapped from roadmap v7
- 3 hypothesis Helixes (H-1, H-2, H-5) with OBSERVES relationships
- ΦL values: complete=0.9, active/next=0.5, planned=0.3, vision=0.1
- Commit: `a3f52f4`

### Task 3: Test Seeds with SCOPED_TO
- 3 test-suite Blooms (dev-agent, hierarchical-health, immune-response)
- 18 test Seed nodes from @future tests (7→M-10, 6→M-9.V, 5→M-18)
- SCOPED_TO relationships: test Seed → milestone Bloom
- CONTAINS relationships: test-suite Bloom → test Seed
- Commit: `2b7ab21`

### Task 4: Architect SURVEY Reads from Neo4j
- Added `getMilestoneOverview()`, `getFutureTestsForMilestone()`, `getHypothesisStatus()` to `src/graph/queries.ts`
- Extended `SurveyOutput.graphState` with optional ecosystem fields: `milestoneOverview`, `futureTestsByMilestone`, `hypothesisStatuses`
- Wired `inspectGraphState()` in survey.ts — ecosystem queries are non-fatal (graceful degradation)
- Exported new types: `MilestoneOverviewEntry`, `FutureTestEntry`, `HypothesisStatusEntry`
- Commit: `67f588d`

### Task 5: Final Gate
- Fixed CONTAINS relationship bug (Bloom-only MATCH → Bloom|Seed WHERE clause)
- Verified all exit criteria against live Neo4j

## Graph State (Live Verification)

| Entity | Count | Source |
|--------|-------|--------|
| Milestone Blooms (major+sub) | 38 | Cypher: `MATCH (b:Bloom) WHERE b.type IN ["milestone","sub-milestone"]` |
| Roadmap Bloom | 1 | `roadmap-v7` |
| Test-suite Blooms | 3 | dev-agent, hierarchical-health, immune-response |
| Test Seeds | 18 | @future tests from 3 conformance files |
| Hypothesis Helixes | 3 | H-1, H-2, H-5 |
| CONTAINS (ecosystem) | 56 | 25 + 13 + 18 |
| SCOPED_TO | 18 | test Seed → milestone Bloom |
| OBSERVES | 3 | hypothesis Helix → milestone Bloom |

## Test Results

| Metric | Value | Source |
|--------|-------|--------|
| Tests passing | 1229 | `npm test` at HEAD |
| Tests skipped | 19 | 18 @future (gated) + 1 Neo4j-conditional |
| Test files | 77 | All passing |
| Ecosystem bootstrap tests | 33 | `tests/graph/ecosystem-bootstrap.test.ts` |
| Barrel exports | 257 | `node -e "const c = require('./dist'); console.log(Object.keys(c).length)"` |
| Type check | Clean | `npx tsc --noEmit` |

## Morpheme Mapping Compliance

Every graph node maps to a Codex morpheme (v4.3 §The Six Morphemes):

| Graph Entity | Morpheme | Grammar Rule |
|-------------|----------|-------------|
| Roadmap Bloom | Bloom (○) | Scoped boundary |
| Milestone Bloom | Bloom (○) | Scoped work unit |
| Sub-milestone Bloom | Bloom (○) | Scoped work within parent |
| Test-suite Bloom | Bloom (○) | Scoped test collection |
| Test Seed | Seed (•) | Atomic validation unit |
| Hypothesis Helix | Helix (🌀) | Temporal/evolutionary iteration |
| CONTAINS | Line (→) | G3 Containment |
| SCOPED_TO | Line (→) | G1 Proximity (directional scope) |
| OBSERVES | Line (→) | G5 Resonance (evidence accumulation) |

## Skipped Test Breakdown

All 19 skipped tests are accounted for:
- **7 @future(M-10)** — `tests/conformance/dev-agent.test.ts` — DevAgent pipeline integration
- **6 @future(M-9.V)** — `tests/conformance/hierarchical-health.test.ts` — Vertical compute flow
- **5 @future(M-18)** — `tests/conformance/immune-response.test.ts` — Event-triggered structural review
- **1 Neo4j-conditional** — `tests/conformance/decision-lifecycle.test.ts` — `.skipIf(!process.env.NEO4J_URI)`

These are real spec requirements tracked to milestones via `@future(M-N)` annotations, excluded from the main gate via `testNamePattern` in vitest.config.ts. Zero `.todo()` regressions from M-9.5.
