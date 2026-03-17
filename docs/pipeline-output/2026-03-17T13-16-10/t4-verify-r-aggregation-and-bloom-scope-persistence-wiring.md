# Verify εR aggregation and Bloom-scope persistence wiring

> Task ID: t4
> Model: claude-opus-4-6:adaptive:max
> Duration: 178988ms
> Output chars: 23258
> Timestamp: 2026-03-17T13:29:46.186Z

> **⚠️ Hallucination flags (10):**
> - [content/warning] Task t4 references "epsilon-r.ts" but this file was not in its context
> - [content/warning] Task t4 references "bloom.ts" but this file was not in its context
> - [content/warning] Task t4 references "bootstrap-executor.ts" but this file was not in its context
> - [content/warning] Task t4 references "types/state-dimensions.js" but this file was not in its context
> - [content/warning] Task t4 references "health.ts" but this file was not in its context
> - [content/warning] Task t4 references "src/patterns/thompson-router/select-model.js" but this file was not in its context
> - [content/warning] Task t4 references "src/patterns/architect/types.js" but this file was not in its context
> - [content/warning] Task t4 references "epsilon-r-orchestration.ts" but this file was not in its context
> - [content/warning] Task t4 references a document ("docs/specs/01_codex-signum-v3_0.md") that was not in its context
> - [content/warning] Task t4 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# εR Aggregation and Bloom-Scope Persistence Wiring Audit

**Task:** t4 — Verify εR aggregation wiring per M-22.4
**Scope:** `src/computation/epsilon-r.ts`, `src/graph/queries/bloom.ts`, `scripts/bootstrap-executor.ts`
**Spec Reference:** Engineering Bridge v3.0, Part 2 §εR, §Composition-Scope εR; M-22 Row 4
**Prior Task Cross-References:** t1 (requirements extraction), t2 (signal conditioning gaps), t3 (ΨH wiring — structural analogue)

---

## Executive Summary

The εR computation module (`epsilon-r.ts`) is **well-specified and internally correct**: the core `computeEpsilonR` function, the floor computation, spectral calibration, and warning checks are all sound implementations of the Engineering Bridge v3.0 specification. The persistence terminus (`updateBloomEpsilonR` in `bloom.ts`) correctly targets Bloom-scoped graph nodes with the full εR property set. However, the audit identifies **three critical wiring breaks** that prevent εR from actually flowing end-to-end: (1) no orchestration function bridges computation to persistence (unlike ΨH which has `computeAndPersistPsiH`), (2) no Bloom-scope aggregation query exists to collect exploratory decision counts from Thompson routing decisions, and (3) the bootstrap executor contains zero εR references and does not accumulate the `wasExploratory` flag it already receives into any queryable store. The result is a complete computation layer and a complete persistence layer with **no wiring between them**.

| Criterion | Status | Details |
|-----------|--------|---------|
| `computeEpsilonR` function traced through call graph | ✅ **PASS** | Pure function correctly computes εR from counts + floor |
| Bloom-scope aggregation boundaries verified | ❌ **FAIL** | No aggregation query or orchestration exists |
| Persistence writes to correct graph nodes confirmed | ✅ **PASS** | `updateBloomEpsilonR` targets `(:Bloom {id})` correctly |
| εR values propagate from pipeline runs to graph state | ❌ **FAIL** | No end-to-end data path exists in provided code |
| Floor computation per spec (spectral + gradient) | ✅ **PASS** | `computeEpsilonRFloor` implements both calibration sources |
| M-22.7 spike detection wired | ⚠️ **PARTIAL** | `isEpsilonRSpike` exists but no caller in provided files |
| Bootstrap executor integration | ❌ **FAIL** | Zero εR references in `bootstrap-executor.ts` |

---

## 1. `computeEpsilonR` Call Graph Trace

### Finding 1.1 — Core Computation Is Internally Correct

**Evidence (`epsilon-r.ts`, lines 36–56):**

```typescript
export function computeEpsilonR(
  exploratoryDecisions: number,
  totalDecisions: number,
  floor: number = EPSILON_R_THRESHOLDS.stableMin,
): EpsilonR {
  let value: number;
  if (totalDecisions === 0) {
    value = 0.15; // adaptive range midpoint
  } else {
    value = exploratoryDecisions / totalDecisions;
  }
  value = Math.max(value, floor);
  return {
    value,
    range: classifyEpsilonR(value),
    exploratoryDecisions,
    totalDecisions,
    floor,
    computedAt: new Date(),
  };
}
```

**Verification against spec:**

| Spec Requirement | Implementation | Status |
|------------------|---------------|--------|
| εR = exploratory / total | `exploratoryDecisions / totalDecisions` | ✅ |
| Floor enforcement (never exactly 0) | `Math.max(value, floor)` | ✅ |
| Default floor from thresholds | `EPSILON_R_THRESHOLDS.stableMin` | ✅ |
| Cold-start default (no decisions) | `0.15` (adaptive range midpoint) | ✅ |
| Classification into range bands | `classifyEpsilonR(value)` | ✅ |
| Timestamp recording | `computedAt: new Date()` | ✅ |

The function is pure (no side effects, no I/O), making it testable in isolation. The return type `EpsilonR` is imported from the shared type system (`types/state-dimensions.js`), consistent with ΦL and ΨH patterns.

**Verdict:** ✅ Core computation is spec-compliant.

### Finding 1.2 — Floor Computation Chain Is Complete

The εR floor computation implements a two-source maximum per the spec:

```
εR_floor = max(
  base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient)),
  min_εR_for_spectral_state(spectral_ratio),
  0.01  // absolute minimum
)
```

**`computeEpsilonRFloor` (lines 89–107):**

```typescript
export function computeEpsilonRFloor(
  baseFloor: number = 0.01,
  imperativeGradient: number = 1.0,
  spectralRatio?: number,
  gradientSensitivity: number = 0.1,
): number {
  const gradientFloor = baseFloor +
    gradientSensitivity * Math.max(0, -imperativeGradient);
  const spectralFloor = spectralRatio !== undefined
    ? minEpsilonRForSpectralState(spectralRatio) : 0;
  return Math.max(gradientFloor, spectralFloor, 0.01);
}
```

**`minEpsilonRForSpectralState` spectral calibration table (lines 69–74):**

| Spectral Ratio | Spec Min εR | Implementation | Status |
|:-:|:-:|:-:|:-:|
| > 0.9 | 0.05 | `return 0.05` | ✅ |
| 0.7 – 0.9 | 0.02 | `return 0.02` | ✅ |
| 0.5 – 0.7 | 0.01 | `return 0.01` | ✅ |
| < 0.5 | 0.0 | `return 0.0` | ✅ |

**Internal wiring:**
- `computeEpsilonRFloor` → calls `minEpsilonRForSpectralState` internally ✅
- `computeEpsilonR` accepts `floor` parameter → caller must supply result of `computeEpsilonRFloor` ✅
- Default floor in `computeEpsilonR` is `EPSILON_R_THRESHOLDS.stableMin`, **not** a call to `computeEpsilonRFloor`

**Implication:** The floor computation is correctly decoupled (caller computes floor, passes it in), but this means the **caller** is responsible for wiring the gradient and spectral inputs. No such caller exists in the provided files.

**Verdict:** ✅ Floor computation is spec-compliant. ⚠️ No caller wires the inputs.

### Finding 1.3 — Warning and Spike Detection Functions

**`checkEpsilonRWarnings` (lines 116–144):**

| Warning Condition | Spec Reference | Implementation | Status |
|-------------------|---------------|----------------|--------|
| εR = 0 on active pattern | Axiom 5 / Constitutional | `value === 0 && isPatternActive` → critical | ✅ |
| High ΦL + low εR | Over-optimization | `phiL > 0.8 && εR < 0.02` → warning | ✅ |
| Unstable range | εR > 0.30 | `range === "unstable"` → warning | ✅ |

**`isEpsilonRSpike` (lines 153–162):**

| Maturity | Upper Bound (Spec) | Implementation | Status |
|----------|:-:|:-:|:-:|
| Young (< 0.3) | 0.40 | `0.40` | ✅ |
| Maturing (0.3–0.7) | 0.30 | `0.30` | ✅ |
| Mature (> 0.7) | 0.15 | `0.15` | ✅ |

**Verdict:** ✅ Both functions are spec-compliant and ready for M-22.7 event-triggered structural review integration.

---

## 2. Bloom-Scope Aggregation Boundaries

### Finding 2.1 — ❌ No Aggregation Query Exists

**Critical gap.** The ΨH subsystem (audited in t3) has a clear Bloom-scope aggregation pattern:

```
getCompositionSubgraph(bloomId)  →  computePsiHWithState()  →  updateBloomPsiH()
```

For εR, the analogous pattern would be:

```
getExploratoryDecisionCounts(bloomId)  →  computeEpsilonR()  →  updateBloomEpsilonR()
```

**No such aggregation query exists in the provided files.** There is no function in `bloom.ts`, `health.ts`, or any other provided module that:

1. Takes a Bloom ID as input
2. Queries decisions scoped to that Bloom (or its children)
3. Counts exploratory vs. total decisions
4. Returns the counts for `computeEpsilonR` consumption

**Evidence by exhaustive search:**
- `bloom.ts`: Contains `updateBloomEpsilonR` (write-only) but no read/aggregation query for decision counts
- `epsilon-r.ts`: Pure computation, no graph access
- `bootstrap-executor.ts`: No εR imports or references whatsoever

### Finding 2.2 — ❌ No Orchestration Function Bridges Computation to Persistence

For ΨH, `health.ts` provides `computeAndPersistPsiH()` which:
1. Reads subgraph from Neo4j
2. Deserialises prior `PsiHState` from node properties
3. Calls `computePsiHWithState()`
4. Serialises updated state
5. Calls `updateBloomPsiH()` to persist

**No equivalent `computeAndPersistEpsilonR()` function exists for εR.** The computation and persistence layers are fully implemented but **disconnected** — there is no bridging function that:

- Reads prior εR state from the graph
- Gathers fresh exploratory decision counts
- Calls `computeEpsilonRFloor()` with current gradient and spectral inputs
- Calls `computeEpsilonR()` with the floor and counts
- Calls `updateBloomEpsilonR()` to persist the result

### Finding 2.3 — ⚠️ Bloom-Scope Boundary Definition Is Ambiguous

**Question:** What constitutes "Bloom scope" for εR aggregation?

For ΨH, the scope is clearly defined: `CONTAINS` edges from parent to children define the composition subgraph. The Fiedler eigenvalue measures coherence of that subgraph.

For εR, the scope must be the set of **decisions made in the context of a Bloom's execution**. This requires:

1. **Decision-to-Bloom linkage:** Each Thompson routing decision must be tagged with the Bloom it serves
2. **Exploratory flag storage:** The `wasExploratory` flag must be persisted with each decision record
3. **Temporal windowing:** The decision window for εR computation (how far back to look)

**Current state of decision-to-Bloom linkage in the bootstrap executor:**

```typescript
const selection = await selectModel({
  taskType,
  complexity,
  qualityRequirement: context?.qualityRequirement ?? 0.7,
  callerPatternId: "architect",   // ← Fixed string, not a Bloom ID
  runId: context?.runId,           // ← Potentially linkable
  taskId: context?.taskId,         // ← Potentially linkable
  requiredCapabilities: ["code_generation"],
});
```

- `callerPatternId` is hardcoded to `"architect"` — not a Bloom-scoped identifier
- `runId` and `taskId` are passed from context and *could* link to Blooms, but this linkage is not established in the provided files
- The `selection.wasExploratory` flag is returned to the caller but not aggregated

**Impact:** Even if the orchestration function existed, it would have no way to query "exploratory decisions for Bloom X" because decisions are not tagged with Bloom identifiers at the Thompson routing level.

---

## 3. Persistence Write Verification

### Finding 3.1 — ✅ `updateBloomEpsilonR` Correctly Targets Bloom Nodes

**Evidence (`bloom.ts`, lines 280–297):**

```typescript
export async function updateBloomEpsilonR(
  bloomId: string,
  epsilonR: number,
  range: string,
  exploratoryCount: number,
  totalCount: number,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (b:Bloom { id: $bloomId })
       SET b.epsilonR = $epsilonR,
           b.epsilonRRange = $range,
           b.epsilonRExploratory = $exploratoryCount,
           b.epsilonRTotal = $totalCount,
           b.epsilonRComputedAt = datetime()`,
      { bloomId, epsilonR, range, exploratoryCount, totalCount },
    );
  });
}
```

**Property mapping verification:**

| Property | Source | Graph Field | Type | Status |
|----------|--------|-------------|------|--------|
| εR value | `computeEpsilonR().value` | `b.epsilonR` | float | ✅ |
| Range classification | `computeEpsilonR().range` | `b.epsilonRRange` | string | ✅ |
| Exploratory count | `computeEpsilonR().exploratoryDecisions` | `b.epsilonRExploratory` | int | ✅ |
| Total count | `computeEpsilonR().totalDecisions` | `b.epsilonRTotal` | int | ✅ |
| Computation timestamp | Server-side `datetime()` | `b.epsilonRComputedAt` | datetime | ✅ |

**Observations:**
- Uses `writeTransaction` for atomicity — consistent with `updateBloomPhiL` and `updateBloomPsiH` patterns
- `MATCH` (not `MERGE`) ensures writes only to existing Bloom nodes — correct, avoids orphan creation
- Server-side `datetime()` for `epsilonRComputedAt` rather than client-side `new Date()` — this differs from `computeEpsilonR().computedAt` which is client-side, but server-side timestamps are more reliable for cross-machine consistency

### Finding 3.2 — ⚠️ Missing Properties Compared to `EpsilonR` Type

The `computeEpsilonR` function returns a full `EpsilonR` object with six fields:

| `EpsilonR` Field | Persisted in `updateBloomEpsilonR`? |
|------------------|:-:|
| `value` | ✅ (as `epsilonR`) |
| `range` | ✅ (as `epsilonRRange`) |
| `exploratoryDecisions` | ✅ (as `epsilonRExploratory`) |
| `totalDecisions` | ✅ (as `epsilonRTotal`) |
| `floor` | ❌ **Not persisted** |
| `computedAt` | ✅ (as server-side `epsilonRComputedAt`) |

**The `floor` value is not persisted.** This means:
- On read-back, the applied floor cannot be reconstructed
- Debugging floor-related εR behaviour requires recomputing from inputs
- Cross-run εR floor evolution (from changing spectral or gradient state) is not traceable

**Risk:** Low-to-moderate. The floor is derivable from gradient and spectral state, but persisting it would improve observability and align with the principle of explicit state capture.

### Finding 3.3 — ✅ Persistence Pattern Consistent With ΨH and ΦL

Comparing the three health dimension persistence functions:

| Dimension | Function | Pattern | Status |
|-----------|----------|---------|--------|
| ΦL | `updateBloomPhiL(bloomId, phiL, trend, healthBand?, phiLState?)` | MATCH + SET, writeTransaction | ✅ |
| ΨH | `updateBloomPsiH(bloomId, psiH, λ₂, friction, trend, state)` | MATCH + SET, writeTransaction | ✅ |
| εR | `updateBloomEpsilonR(bloomId, εR, range, exploratory, total)` | MATCH + SET, writeTransaction | ✅ |

All three follow the same structural pattern:
- `MATCH (b:Bloom { id: $bloomId })` — scoped to Bloom nodes
- `SET` with typed parameters — no string interpolation (injection-safe)
- `writeTransaction` wrapper — explicit write session
- Timestamp via `datetime()` — server-side Neo4j function

**Verdict:** ✅ Persistence layer is correctly implemented and architecturally consistent.

---

## 4. End-to-End Data Flow Analysis

### Finding 4.1 — ❌ Bootstrap Executor Contains Zero εR References

**Evidence:** Complete import and export analysis of `bootstrap-executor.ts`:

**Imports:**
```typescript
import { selectModel } from "../src/patterns/thompson-router/select-model.js";
import type { ModelExecutor, ModelExecutorContext, ModelExecutorResult } from "../src/patterns/architect/types.js";
import { getVertexToken, getGcpProject, VERTEX_REGION } from "./vertex-auth.js";
```

**Exports (εR-related):** None.

**Internal references to εR:** Zero occurrences of `epsilon`, `epsilonR`, `exploratoryDecisions`, `computeEpsilonR`, or `updateBloomEpsilonR` in the entire file.

This is consistent with findings from t2 (signal conditioning) and t3 (ΨH): the bootstrap executor is exclusively concerned with Thompson routing and LLM API dispatch, not health dimension computation.

### Finding 4.2 — `wasExploratory` Flag Is Available But Not Accumulated

The bootstrap executor **does receive** the exploratory flag:

```typescript
// In createBootstrapModelExecutor.execute():
return {
  text: result.text,
  modelId: selection.selectedSeedId,
  durationMs: result.durationMs,
  wasExploratory: selection.wasExploratory,  // ← Available here
  provider: selection.provider,
  // ...
};
```

This flag is:
- ✅ Returned to the caller of `execute()`
- ❌ Not counted or accumulated within the executor
- ❌ Not written to any graph store
- ❌ Not associated with a Bloom scope identifier

**The raw signal exists but is discarded at the executor boundary.** No downstream code aggregates `wasExploratory` into per-Bloom counts for εR computation.

### Finding 4.3 — Expected vs. Actual End-to-End Flow

**Expected flow per M-22.4 and spec (Part 2 §Composition-Scope εR):**

```
Thompson Router Decision
  ↓ wasExploratory = true/false
Decision Record (persisted, Bloom-scoped)
  ↓ aggregation query
Bloom-Scope Counts { exploratory: N, total: M }
  ↓ computeEpsilonRFloor(gradient, spectral)
Floor Value
  ↓ computeEpsilonR(N, M, floor)
EpsilonR Object
  ↓ updateBloomEpsilonR(bloomId, εR, range, N, M)
Neo4j Bloom Node ← εR persisted
```

**Actual state — what exists:**

```
Thompson Router Decision
  ↓ wasExploratory = true/false         ← EXISTS (selectModel returns it)
[BREAK — no accumulation/storage]

computeEpsilonRFloor()                  ← EXISTS (no caller)
computeEpsilonR()                       ← EXISTS (no caller)

[BREAK — no orchestration bridge]

updateBloomEpsilonR()                   ← EXISTS (no caller)
Neo4j Bloom Node                        ← Schema ready (properties defined)
```

**Three breaks in the chain:**

| Break | Location | What's Missing |
|-------|----------|---------------|
| **Break 1** | Thompson Router → Accumulator | No mechanism stores per-decision `wasExploratory` in a queryable, Bloom-scoped form |
| **Break 2** | Accumulator → Computation | No orchestration reads accumulated counts and calls `computeEpsilonR` with a computed floor |
| **Break 3** | Computation → Persistence | No bridge calls `updateBloomEpsilonR` with computed results |

---

## 5. Structural Comparison With ΨH Wiring (t3 Cross-Reference)

The t3 audit found that ΨH has a **complete but uncalled** pipeline: `getCompositionSubgraph → computePsiHWithState → updateBloomPsiH`, wired through `computeAndPersistPsiH` in `health.ts`. The εR subsystem is **less complete** than ΨH:

| Wiring Component | ΨH (t3) | εR (this audit) |
|------------------|:--------:|:----------------:|
| Pure computation function | ✅ `computePsiH` | ✅ `computeEpsilonR` |
| Stateful computation wrapper | ✅ `computePsiHWithState` | ❌ None (no temporal state) |
| Subgraph/aggregation query | ✅ `getCompositionSubgraph` | ❌ None |
| Orchestration bridge | ✅ `computeAndPersistPsiH` | ❌ None |
| Persistence function | ✅ `updateBloomPsiH` | ✅ `updateBloomEpsilonR` |
| Bootstrap executor call site | ❌ None | ❌ None |
| Type system integration | ✅ `PsiH`, `PsiHState` | ✅ `EpsilonR` |

**Assessment:** εR is approximately one layer behind ΨH in wiring completeness. ΨH is missing only the top-level call site; εR is missing the aggregation query, orchestration bridge, *and* the top-level call site.

---

## 6. Specification Conformance Detail

### Finding 6.1 — §Composition-Scope εR

The spec (t1, Row 4) requires εR to be computed at "Composition Scope" — meaning per-Bloom aggregation. The `computeEpsilonR` function accepts raw counts, which is correct — it delegates the scoping responsibility to the caller. But no caller performs this scoping.

**Conformance:** ❌ Not achievable without the aggregation query.

### Finding 6.2 — εR Floor with Imperative Gradient

The spec requires:
```
εR_floor = max(
  base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient)),
  min_εR_for_spectral_state(spectral_ratio)
)
```

`computeEpsilonRFloor` implements this exactly, with an additional `0.01` absolute minimum:
```typescript
return Math.max(gradientFloor, spectralFloor, 0.01);
```

The absolute minimum of `0.01` is **stricter** than the spec (which allows `0.0` for spectral_ratio < 0.5), but is justified by the code's own docstring: "εR must never fully collapse for active patterns." This is consistent with the Constitutional violation warning in `checkEpsilonRWarnings`.

**Conformance:** ✅ Implements spec with a defensible additional constraint.

### Finding 6.3 — High ΦL + Zero εR Warning

The spec states: "High ΦL with zero εR is a WARNING." The module header explicitly cites this, and `checkEpsilonRWarnings` implements two thresholds:

- **Critical:** `εR === 0 && isPatternActive` (Constitutional violation — stricter than WARNING)
- **Warning:** `ΦL > 0.8 && εR < 0.02` (over-optimization detection)

The critical threshold at exactly `0` plus the warning threshold at `< 0.02` together cover the spec requirement comprehensively — the critical catches true zero, and the warning catches near-zero with high ΦL.

**Conformance:** ✅ Meets and exceeds spec.

### Finding 6.4 — M-22.7 εR Spike Detection

`isEpsilonRSpike` implements the maturity-indexed upper bound table correctly. This function exists to feed the event-triggered structural review (M-22.7), but no caller in the provided files invokes it.

**Conformance:** ✅ Implementation correct, ⚠️ not wired to trigger.

---

## 7. Recommendations

### 7.1 — Critical: Implement εR Orchestration Bridge (Priority 1)

Create `computeAndPersistEpsilonR(bloomId: string)` in `health.ts` (or a dedicated `epsilon-r-orchestration.ts`) following the ΨH pattern:

1. Query exploratory decision counts for the Bloom scope
2. Retrieve current gradient and spectral state for floor computation
3. Call `computeEpsilonRFloor()` → `computeEpsilonR()` → `updateBloomEpsilonR()`

### 7.2 — Critical: Implement Decision Accumulation Store (Priority 1)

Create a Bloom-scoped decision accumulation mechanism that:
- Records each Thompson routing decision with its `wasExploratory` flag
- Tags decisions with the Bloom they serve (via `runId`/`taskId` → Bloom mapping, or by passing Bloom ID into `selectModel`)
- Supports windowed aggregation queries (e.g., "last N decisions" or "last T minutes")

### 7.3 — High: Persist εR Floor Value (Priority 2)

Add `b.epsilonRFloor = $floor` to the `updateBloomEpsilonR` Cypher query to enable:
- Cross-run floor evolution tracking
- Debugging of floor-driven εR inflation
- Complete state reconstruction on read-back

### 7.4 — High: Wire `isEpsilonRSpike` Into M-22.7 Structural Review (Priority 2)

The spike detection function is implemented but disconnected. It should be called after each εR persistence write, with the result feeding into the event-triggered structural review pipeline.

### 7.5 — Moderate: Add Temporal State to εR (Priority 3)

ΨH has `PsiHState` with EWMA tracking; ΦL has `PhiLState` with a ring buffer. εR has no temporal state — each computation is stateless from the prior. Consider adding:
- EWMA-smoothed εR for trend detection
- Ring buffer for εR spike pattern detection
- Serialised state property on Bloom nodes (`b.epsilonRState`)

### 7.6 — Moderate: Align `callerPatternId` With Bloom Scope (Priority 3)

In the bootstrap executor, `callerPatternId: "architect"` is a fixed string. This should be replaced with a dynamic Bloom ID derived from the execution context, enabling per-Bloom decision scoping in the Thompson router.

---

## 8. Summary of Wiring Integrity

```
         COMPUTATION LAYER              PERSISTENCE LAYER
         ─────────────────              ─────────────────
   ┌─ computeEpsilonRFloor ─┐     ┌─ updateBloomEpsilonR ─┐
   │  ✅ Implemented          │     │  ✅ Implemented         │
   │  ❌ No caller             │     │  ❌ No caller            │
   └──────────┬───────────────┘     └──────────▲──────────────┘
              │                                │
              ▼                          [BREAK 3]
   ┌── computeEpsilonR ──────┐                │
   │  ✅ Implemented          │          [BREAK 2]
   │  ❌ No caller             │                │
   └──────────▲───────────────┘                │
              │                                │
         [BREAK 1]                             │
              │                                │
   ┌── Thompson Router ───────────────── (no aggregation) ──┘
   │  ✅ wasExploratory emitted  │
   │  ❌ Not accumulated          │
   └──────────────────────────────┘
```

**Bottom line:** The εR subsystem has **correct leaves** (computation and persistence) but **no trunk** (aggregation, orchestration, invocation). Three wiring breaks must be resolved before εR can flow from pipeline runs to graph state as required by M-22.4.