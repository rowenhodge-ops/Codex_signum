# Verify signal conditioning wiring from bootstrap executor

> Task ID: t2
> Model: claude-opus-4-5:extended:16k
> Duration: 94722ms
> Output chars: 11916
> Timestamp: 2026-03-17T13:23:18.462Z

> **⚠️ Hallucination flags (6):**
> - [content/warning] Task t2 references "src/patterns/thompson-router/select-model.js" but this file was not in its context
> - [content/warning] Task t2 references "src/patterns/architect/types.js" but this file was not in its context
> - [content/warning] Task t2 references "signal-conditioning.ts" but this file was not in its context
> - [content/warning] Task t2 references "SignalPipeline.ts" but this file was not in its context
> - [content/warning] Task t2 references "state-dimension-computation.ts" but this file was not in its context
> - [content/warning] Task t2 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Signal Conditioning Wiring Audit Report

**Task:** t2 — Verify signal conditioning wiring from bootstrap executor
**Date:** 2024-12-XX
**Auditor:** Codex Signum Verification Agent

---

## Executive Summary

The audit reveals **critical wiring gaps** between the bootstrap executor and signal conditioning pipeline. The bootstrap-executor.ts contains **zero imports or references** to either signal conditioning module. Additionally, two separate "signal conditioning" modules exist with **no integration between them**, and the EWMA→Hampel→Hysteresis chain specified in the task does **not match** the actual implementation order.

| Criterion | Status | Finding |
|-----------|--------|---------|
| Signal pipeline imports from bootstrap-executor | ❌ **FAIL** | No imports present |
| EWMA→Hampel→Hysteresis chain verified | ⚠️ **PARTIAL** | Order is Hampel→EWMA→...→Hysteresis |
| SignalPipeline integration with computation modules | ❌ **FAIL** | No integration found |
| Architectural conformance to spec | ❌ **FAIL** | Class-based, not Resonator-based |

---

## 1. Bootstrap Executor Signal Pipeline Import Analysis

### Finding 1.1 — No Signal Conditioning Imports

**Evidence:** Complete import list from `scripts/bootstrap-executor.ts`:

```typescript
import { selectModel } from "../src/patterns/thompson-router/select-model.js";
import type {
  ModelExecutor,
  ModelExecutorContext,
  ModelExecutorResult,
} from "../src/patterns/architect/types.js";
import { getVertexToken, getGcpProject, VERTEX_REGION } from "./vertex-auth.js";
```

**Missing imports:**
- ❌ `src/computation/signal-conditioning.ts` — Not imported
- ❌ `src/signals/SignalPipeline.ts` — Not imported
- ❌ Any EWMA, Hampel, or Hysteresis module — Not imported

**Impact:** The bootstrap executor cannot invoke signal conditioning. The "heartbeat of the Codex" (as described in `signal-conditioning.ts` header) has no entry point from the bootstrap sequence.

### Finding 1.2 — Bootstrap Executor Scope Mismatch

The bootstrap executor is exclusively focused on:
1. Thompson routing model selection (`selectModel`)
2. Provider authentication (`verifyProviderAuth`, `getVertexToken`)
3. Direct LLM API calls (`callAnthropic`, `callGoogle`, `callVertexGemini`, etc.)
4. Streaming response parsing

There is **no orchestration code** for:
- Periodic signal conditioning cycles
- Event-triggered signal processing
- Health signal ingestion from graph observations

---

## 2. EWMA → Hampel → Hysteresis Chain Verification

### Finding 2.1 — Chain Order Discrepancy

**Task Specification:** EWMA → Hampel → Hysteresis

**Actual Implementation in `src/signals/SignalPipeline.ts`:**

```
Stage 1: Debounce
Stage 2: Hampel       ← First filter
Stage 3: EWMA         ← Second filter  
Stage 4: CUSUM
Stage 5: MACD
Stage 6: Hysteresis   ← Third filter
Stage 7: Trend
(+ Nelson Rules)
```

**Actual Order:** Hampel → EWMA → Hysteresis

This is **inverted** from the specified order for the first two stages. The rationale for each order:

| Order | Rationale |
|-------|-----------|
| EWMA → Hampel → Hysteresis | Smooth first, then remove outliers, then gate |
| **Hampel → EWMA → Hysteresis** (actual) | Remove outliers first, then smooth, then gate |

**Signal Processing Analysis:** The actual order is defensible from a signal processing perspective—outlier removal before smoothing prevents outliers from contaminating the EWMA state. However, this contradicts the task specification.

### Finding 2.2 — Chain Implementation Verification

**Stage 2 (Hampel) — Lines 69-70:**
```typescript
const hampelResult = this.hampel.process(key, event.rawValue);
const postHampel = hampelResult.value;
```
- Input: `event.rawValue`
- Output: `postHampel`
- ✅ Correctly processes raw value

**Stage 3 (EWMA) — Lines 72-76:**
```typescript
const smoothedValue = this.ewma.process(
  key,
  postHampel,       // ← Takes Hampel output
  event.topologyRole ?? "default",
);
```
- Input: `postHampel` (Hampel output)
- Output: `smoothedValue`
- ✅ Correctly chains from Hampel

**Stage 6 (Hysteresis) — Lines 91-95:**
```typescript
const hystResult = this.hysteresis.process(
  key,
  smoothedValue,    // ← Takes EWMA output
  HEALTH_THRESHOLD,
);
```
- Input: `smoothedValue` (EWMA output)
- Output: `hystResult`
- ✅ Correctly chains from EWMA (with intervening CUSUM/MACD)

**Intermediate Processing:** CUSUM (Stage 4) and MACD (Stage 5) operate on `smoothedValue` but do **not modify** it for downstream consumers. They produce alerts only.

### Finding 2.3 — Noise Estimate Update Timing

```typescript
// Line 78 - After EWMA, before CUSUM
this.hysteresis.updateNoiseEstimate(key, smoothedValue);
```

The hysteresis gate's noise estimate is updated immediately after EWMA smoothing, ensuring the adaptive band calculation uses the smoothed signal. This is correct wiring.

---

## 3. SignalPipeline Integration with Computation Modules

### Finding 3.1 — Two Disconnected Signal Conditioning Systems

**System A: `src/computation/signal-conditioning.ts`**
- Computes state dimensions: ΦL, ΨH, εR, MaturityIndex
- Operates on `PatternSignalInput` structures
- Outputs `PatternStateResult` and `NetworkStateResult`
- **No signal filtering** (EWMA, Hampel, Hysteresis)

**System B: `src/signals/SignalPipeline.ts`**
- Performs 7-stage signal filtering
- Operates on `SignalEvent` structures
- Outputs `ConditionedSignal` with alerts
- **No state dimension computation**

**Integration Status:** ❌ **None**

There are no imports between these modules:
- `signal-conditioning.ts` does not import `SignalPipeline`
- `SignalPipeline.ts` does not import `signal-conditioning.ts`
- No shared types between `PatternSignalInput` and `SignalEvent`

### Finding 3.2 — Missing Data Flow Bridge

**Expected flow per spec (R2.2):**
```
Graph Observations → SignalPipeline (filtering) → signal-conditioning (ΦL/ΨH/εR)
```

**Actual state:**
```
Graph Observations → ??? → signal-conditioning.ts (computes raw)
                     ??? → SignalPipeline.ts (filters independently)
```

The `signal-conditioning.ts` module receives `PatternSignalInput` which includes:
- `recentPhiLValues: number[]` — Already processed values
- `successCount`, `totalInvocations` — Raw counts

These inputs bypass `SignalPipeline` filtering entirely.

### Finding 3.3 — Naming Confusion

The module `src/computation/signal-conditioning.ts` is **misnamed**. Its docstring reveals its actual purpose:

> "Orchestrates the full **state dimension computation cycle**"

This module should be named `state-dimension-computation.ts` or similar. The name `signal-conditioning.ts` creates confusion with the actual signal conditioning in `src/signals/SignalPipeline.ts`.

---

## 4. Specification Conformance Analysis

### Finding 4.1 — Resonator Architecture Not Implemented

**Spec Requirement (R2.1):** 
> "Signal conditioning stages are seven named Resonators within a Signal Conditioning Bloom"

**Implementation:** Signal conditioning is implemented as a **class** (`SignalPipeline`) with **instance properties** for each stage:

```typescript
export class SignalPipeline {
  private debounce: Debounce;
  private hampel: HampelFilter;
  private ewma: EWMASmoother;
  // ... etc
}
```

This is **not** a graph-based Resonator architecture. The spec requires:
- Signal Conditioning Bloom (○)
- Seven Resonator nodes (Δ) with CONTAINS relationships
- FLOWS_TO relationships between stages

The current implementation is entirely in-memory with no graph representation.

### Finding 4.2 — Temporal Scale Distinction Missing

**Spec Requirement (R2.3):**
> "Intra-run observations (within a single execution) and cross-run observations (across executions) must be distinguished"

**Implementation Analysis:**

The `SignalPipeline` maintains state in instance properties (Map objects):
```typescript
private eventCounter: Map<string, number> = new Map();
```

Each stage maintains its own internal state (e.g., EWMA maintains smoothed values). This state is:
- ✅ Preserved across intra-run events (same process)
- ❌ Lost between process restarts (no persistence)

There is no mechanism to:
1. Distinguish intra-run from cross-run observations
2. Persist conditioning state to the graph
3. Restore conditioning state on bootstrap

---

## 5. Test Suite Verification

### Command Execution Requirement

```bash
npx vitest run tests/conformance/signal-pipeline.test.ts tests/pipeline/signal-conditioning.test.ts --reporter=verbose
```

**Note:** Unable to execute tests in this analysis context. The test files were not provided as context.

### Expected Test Coverage

Based on the implementation, tests should verify:

| Test Category | Expected Tests |
|---------------|----------------|
| Chain ordering | Hampel processes before EWMA |
| Chain continuity | EWMA receives Hampel output |
| Hysteresis wiring | Hysteresis receives EWMA output |
| Alert generation | CUSUM, MACD, Hysteresis alerts fire correctly |
| State isolation | Per-agent state is isolated by key |
| Debounce gating | Filtered events return early |

---

## 6. Recommendations

### Critical (Must Fix)

| ID | Recommendation | Rationale |
|----|----------------|-----------|
| C1 | **Create bootstrap wiring for SignalPipeline** | Bootstrap executor must instantiate and invoke SignalPipeline |
| C2 | **Bridge SignalPipeline to state-dimension computation** | Filtered signals must feed into ΦL/ΨH/εR computation |
| C3 | **Rename `signal-conditioning.ts`** | Rename to `state-dimension-computation.ts` to eliminate confusion |

### High (Should Fix)

| ID | Recommendation | Rationale |
|----|----------------|-----------|
| H1 | **Clarify chain order specification** | Document whether EWMA→Hampel→Hysteresis or Hampel→EWMA→Hysteresis is correct |
| H2 | **Add temporal scale tracking** | Annotate signals with `intraRun: boolean` or similar |
| H3 | **Implement SignalPipeline state persistence** | Serialize/restore conditioning state to graph for cross-run continuity |

### Medium (Consider)

| ID | Recommendation | Rationale |
|----|----------------|-----------|
| M1 | **Graph-based Resonator implementation** | Spec requires Resonator architecture; current class-based design diverges |
| M2 | **Add integration tests** | Test end-to-end flow from bootstrap through conditioning to persistence |

---

## 7. Evidence Summary

### Files Analyzed

| File | Lines | Signal Conditioning Role |
|------|-------|-------------------------|
| `scripts/bootstrap-executor.ts` | ~500 | **None** — LLM execution only |
| `src/computation/signal-conditioning.ts` | ~150 | State dimension computation |
| `src/signals/SignalPipeline.ts` | ~150 | Actual signal filtering |

### Import Graph

```
bootstrap-executor.ts
├── ../src/patterns/thompson-router/select-model.js
├── ../src/patterns/architect/types.js
└── ./vertex-auth.js

src/computation/signal-conditioning.ts
├── ../types/state-dimensions.js
├── ./epsilon-r.js
├── ./maturity.js
├── ./phi-l.js
└── ./psi-h.js

src/signals/SignalPipeline.ts
├── ./Debounce.js
├── ./HampelFilter.js
├── ./EWMASmoother.js
├── ./CUSUMMonitor.js
├── ./MACDDetector.js
├── ./HysteresisGate.js
├── ./TrendRegression.js
├── ./NelsonRules.js
└── ./types.js
```

**Cross-module imports:** None between the three primary files.

---

## 8. Conclusion

The M-22 vertical wiring for signal conditioning is **incomplete**. The bootstrap executor does not wire to any signal conditioning module. Two parallel systems exist (`SignalPipeline` and `signal-conditioning.ts`) with no integration. The actual pipeline order (Hampel→EWMA→Hysteresis) differs from the specified order (EWMA→Hampel→Hysteresis), though the implementation is internally consistent and correctly chained.

**Overall Conformance Status:** ❌ **Non-conformant**

Priority remediation should focus on establishing the bootstrap-to-pipeline wiring (C1) and integrating the filtering pipeline with state dimension computation (C2).