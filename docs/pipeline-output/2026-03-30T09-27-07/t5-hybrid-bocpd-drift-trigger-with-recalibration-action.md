# Hybrid BOCPD drift trigger with recalibration action

> Task ID: t5
> Model: claude-opus-4-6:adaptive:high
> Duration: 146560ms
> Output chars: 22129
> Timestamp: 2026-03-30T09:48:17.689Z

> **⚠️ Hallucination flags (11):**
> - [content/warning] Task t5 references "src/signals/BOCPDRegistry.ts" but this file was not in its context
> - [content/warning] Task t5 references "structural-triggers.ts" but this file was not in its context
> - [content/warning] Task t5 references "./dampening.js" but this file was not in its context
> - [content/warning] Task t5 references "src/signals/types.ts" but this file was not in its context
> - [content/warning] Task t5 references "../signals/types.js" but this file was not in its context
> - [content/warning] Task t5 references "tests/conformance/structural-triggers.test.ts" but this file was not in its context
> - [content/warning] Task t5 references "BOCPDRegistry.ts" but this file was not in its context
> - [content/warning] Task t5 references "src/computation/" but this file was not in its context
> - [content/warning] Task t5 references "src/signals/" but this file was not in its context
> - [content/warning] Task t5 references "../signals/BOCPDRegistry.js" but this file was not in its context
> - [content/warning] Task t5 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Analysis: Hybrid BOCPD Drift Trigger with Recalibration Action

## 1. Integration Point — BOCPDRegistry Import

### 1.1 Import Path

**Finding**: The acceptance criteria explicitly require `src/computation/structural-triggers.ts` to import `BOCPDRegistry` from `src/signals/BOCPDRegistry.ts`. The relative path from the `computation/` directory to the `signals/` directory is:

```
import { BOCPDRegistry } from "../signals/BOCPDRegistry.js";
```

**Risk**: This import creates a **new cross-module dependency** — `computation/` depending on `signals/`. The existing `structural-triggers.ts` only imports from `./dampening.js` (within its own directory). The new import breaks the implicit boundary that computation modules are self-contained.

**Mitigation**: This is architecturally intentional. The hybrid trigger layers BOCPD (a signal-processing concept) onto structural review (a computation concept). The dependency direction is `computation → signals`, which is acceptable — signals are a lower-level primitive consumed by higher-level computation. The reverse direction would be problematic but is not present.

**Evidence**: The t3 analysis identifies BOCPDRegistry as having methods `getOrCreate(metricName, config?)`, `detect(metricName, value)`, `reset(metricName)`, and `resetAll()`. The trigger only requires `detect()` and `reset()`, both of which are guaranteed by the t3 contract.

### 1.2 Type Dependencies

**Finding**: The function must call `registry.detect(metricName, value)` which returns a `BOCPDSignal` (defined in `src/signals/types.ts` per t1). The `BOCPDSignal` type need not be directly imported by `structural-triggers.ts` if the function only reads `.changePointProbability` from the return value — TypeScript's structural typing resolves this without an explicit import. However, importing it explicitly improves readability and enables the return type to carry BOCPDSignal fields.

**Recommendation**: Import `BOCPDSignal` from `../signals/types.js` as well, to annotate the return type's internal fields. Alternatively, rely on inference and avoid the extra import. Either approach passes `tsc --noEmit`.

---

## 2. TriggerResult Type Design

### 2.1 Current Type Landscape

**Finding**: The existing trigger functions in `structural-triggers.ts` return `TriggeredEvent | null`. There is **no `TriggerResult` type** in the current codebase. The acceptance criteria require `evaluateBOCPDTrigger` to return "a TriggerResult-compatible object", which implies this type must be **defined as part of this task**.

### 2.2 Required Shape

From the acceptance criteria:

| Property | Requirement | Source |
|----------|-------------|--------|
| `fired` | `boolean` — true when CP probability ≥ threshold | "result.fired is true" / "result.fired is false" |
| Recalibration payload | Present when fired | "emits a recalibration event payload" |
| Change-point data | Implied — otherwise the result is opaque | Diagnostic utility |

**Recommendation**: Define the following interface:

```typescript
export interface TriggerResult {
  fired: boolean;
  changePointProbability: number;
  runLength: number;
  metricName: string;
  recalibrated: boolean;
  detail: string;
}
```

**Rationale**:
- `fired` satisfies the boolean gate required by acceptance criteria.
- `changePointProbability` and `runLength` carry the BOCPDSignal data forward, enabling downstream consumers (dashboards, logging) to inspect drift severity without re-querying the registry.
- `metricName` identifies which metric triggered, supporting multi-metric environments.
- `recalibrated` indicates whether `reset()` was called, distinguishing "fired and recalibrated" from a hypothetical future "fired but suppressed" mode.
- `detail` mirrors the existing `TriggeredEvent.detail` pattern, providing a human-readable summary.

### 2.3 Compatibility with TriggeredEvent

**Finding**: `TriggerResult` and `TriggeredEvent` are **distinct types** serving different purposes. `TriggeredEvent` is the return type of the original six triggers (with `trigger` discriminant and `severity`). `TriggerResult` is the return type of the hybrid BOCPD trigger (with `fired` boolean and recalibration context). These types do not need to be structurally compatible — the BOCPD trigger operates outside the `checkStructuralTriggers` aggregation function.

**Evidence**: The acceptance criteria say "TriggerResult-compatible object" not "TriggeredEvent-compatible object". The combined `checkStructuralTriggers` function is not modified. The BOCPD trigger is invoked independently via `evaluateBOCPDTrigger`.

**Risk**: Future work may want to unify these types under a common discriminated union. The current design does not preclude this — `TriggerResult` could later gain an optional `trigger` discriminant and `severity` field.

---

## 3. BOCPDTriggerConfig Interface

### 3.1 Required Fields

The acceptance criteria are explicit:

```typescript
export interface BOCPDTriggerConfig {
  metricName: string;
  changePointThreshold: number;
  registry: BOCPDRegistry;
}
```

### 3.2 Threshold Semantics

**Finding**: `changePointThreshold` is compared against `BOCPDSignal.changePointProbability`, which is in the range `[0.0, 1.0]` (guaranteed by normalisation in the detector per t2 analysis). Therefore `changePointThreshold` should also be in `[0.0, 1.0]`.

**Question**: Should the interface enforce this bound at the type level (branded type) or at runtime (validation in `evaluateBOCPDTrigger`)?

| Approach | Trade-off |
|----------|-----------|
| No validation | Simplest; caller responsibility; follows existing pattern (no validation in `checkLambda2Drop` etc.) |
| Runtime clamp/throw | Defensive; catches misconfiguration; adds code |
| Branded type | TypeScript-only enforcement; adds complexity; unusual for config interfaces |

**Recommendation**: No validation — consistent with the existing trigger functions, which accept any `number` inputs without bounds checking. Document the expected range in JSDoc.

### 3.3 Optional Fields Consideration

**Finding**: The task does not require optional fields. However, two candidates exist:

- `hazardRate?: number` — to override the registry's default detector config when auto-creating.
- `suppressRecalibration?: boolean` — to allow "detect but don't reset" mode.

**Recommendation**: Do not add optional fields. The task explicitly scopes the interface to three fields. Additional fields can be added in a future task without breaking changes.

---

## 4. evaluateBOCPDTrigger Function Logic

### 4.1 Core Algorithm

The function performs three sequential operations:

1. **Observe**: `const signal = config.registry.detect(config.metricName, value)` — delegates the observation to the per-metric detector via the registry.
2. **Evaluate**: `const fired = signal.changePointProbability >= config.changePointThreshold` — threshold comparison.
3. **Recalibrate (conditional)**: If `fired`, call `config.registry.reset(config.metricName)`.

**Evidence**: The acceptance criteria state "when changePointProbability >= changePointThreshold the trigger fires, calls registry.reset(config.metricName)". The `>=` comparison (not `>`) is explicitly specified.

### 4.2 Observation-Before-Evaluation Order

**Critical finding**: The `detect()` call **must precede** the threshold evaluation. This seems obvious but has a subtle implication: the observation that triggers the reset is **included** in the posterior before the reset occurs. After the reset, the detector returns to its prior state and the next observation starts a fresh run.

This is correct behaviour: the change point is detected *because* the observation was anomalous relative to the current posterior. The reset then recalibrates the detector so it can adapt to the new regime.

### 4.3 Return Value Construction

**Finding**: The function must return a `TriggerResult` in all cases — both fired and not-fired. There is no `null` return (unlike the existing trigger pattern). This is a deliberate design choice: the BOCPD trigger always provides diagnostic information (`changePointProbability`, `runLength`) regardless of whether it fires.

**Recommendation**: Construct the result object after the evaluate step:

```
return {
  fired,
  changePointProbability: signal.changePointProbability,
  runLength: signal.runLength,
  metricName: config.metricName,
  recalibrated: fired,
  detail: fired
    ? `BOCPD change point detected (p=${signal.changePointProbability.toFixed(4)} ≥ ${config.changePointThreshold}); recalibrated ${config.metricName}`
    : `BOCPD nominal (p=${signal.changePointProbability.toFixed(4)} < ${config.changePointThreshold})`
}
```

### 4.4 Edge Case: First Observation

**Finding**: From the t2 analysis, the first call to `detect()` always returns `changePointProbability ≈ hazardRate` (approximately 0.01 for default config). If the `changePointThreshold` is set below the hazard rate, the trigger will fire on the very first observation.

**Risk level**: Low. This is a configuration error by the caller, not a defect. The recommended threshold range is `[0.1, 0.5]` for practical use (well above the hazard rate).

**Recommendation**: No special handling needed. Document that thresholds near or below the hazard rate will produce frequent false positives.

### 4.5 Edge Case: Post-Reset Observation

**Finding**: After `reset()` is called (because the trigger fired), the *next* call to `evaluateBOCPDTrigger` with the same metric will observe against the reset prior. The first post-reset observation will again return `changePointProbability ≈ hazardRate`, which is almost certainly below any reasonable threshold. This means the trigger self-stabilises after firing — it cannot fire in consecutive rapid succession (unless the threshold is set extremely low).

**Evidence**: This self-stabilising property is desirable. It prevents the trigger from entering an infinite fire-reset-fire loop when the underlying process has genuinely shifted to a new regime. The reset allows the detector to "learn" the new regime without immediately re-triggering.

---

## 5. Purity and Side-Effect Considerations

### 5.1 Departure from Pure-Function Pattern

**Finding**: The existing file's module docstring states "Each is a pure function — takes current state, returns boolean." The new `evaluateBOCPDTrigger` is **impure** in two ways:

| Side Effect | Source |
|-------------|--------|
| Mutates detector state | `registry.detect()` updates the run-length distribution and NIG posteriors |
| Triggers recalibration | `registry.reset()` resets detector state when the trigger fires |

**Impact**: The module's "pure computation" characterisation becomes partially inaccurate. However:

1. The existing six trigger functions remain pure and unmodified.
2. The BOCPD trigger is a conceptually distinct addition — a "hybrid" that bridges signal processing and structural review.
3. The impurity is **contained** within the registry object passed by the caller — no global state is mutated.

**Recommendation**: Update the module-level docstring to acknowledge the hybrid trigger's statefulness, e.g., noting that the BOCPD trigger operates through a stateful registry while the original six triggers remain pure. This preserves documentation accuracy without requiring architectural changes.

### 5.2 Idempotency

**Finding**: `evaluateBOCPDTrigger` is **not idempotent**. Calling it twice with the same `(config, value)` pair produces different results because the first call mutates the detector state (and possibly triggers a reset). This is expected and correct for a streaming detector — each call represents a new observation in the time series.

**Risk**: If a caller accidentally double-invokes the function (e.g., a React effect running twice in development mode), the metric receives a duplicate observation. This is a general concern for any stateful API and is outside the scope of this task.

---

## 6. Recalibration Event Payload

### 6.1 Payload Content

**Finding**: The task requires the trigger to "emit a recalibration event payload" when fired. The word "emit" could mean:

| Interpretation | Implementation |
|----------------|----------------|
| Return a payload as part of the result | The `TriggerResult` includes recalibration data |
| Publish to an event bus | Requires an EventEmitter or callback mechanism |
| Log to console | Side-effect; inappropriate for a library |

**Evidence**: The acceptance criteria focus on the return value (`result.fired`) and the `reset()` call. There is no mention of an event bus, callback parameter, or EventEmitter. The simplest interpretation — and the one consistent with the function's signature `(config, value) → TriggerResult` — is that the recalibration payload is **embedded in the return value**.

**Recommendation**: The `TriggerResult` object itself serves as the recalibration event payload. The `fired: true, recalibrated: true, metricName, changePointProbability, detail` fields collectively constitute the payload. The caller (e.g., a monitoring orchestrator) can inspect this result and propagate it to any event bus or logging system as needed.

### 6.2 Payload Sufficiency

**Finding**: The recommended `TriggerResult` fields provide enough information for downstream consumers to:

1. **Decide on escalation**: `changePointProbability` magnitude indicates drift severity.
2. **Identify the metric**: `metricName` enables targeted response.
3. **Distinguish detection from recalibration**: `fired` vs. `recalibrated` (currently identical, but separable if future modes suppress recalibration).
4. **Log diagnostically**: `detail` provides a human-readable summary.
5. **Correlate with run-length history**: `runLength` at the time of detection indicates how long the previous regime lasted.

---

## 7. Backward Compatibility

### 7.1 Existing Exports Preservation

**Finding**: The acceptance criteria state "No existing exported symbols from structural-triggers.ts are removed or renamed." The current exports are:

| Symbol | Type |
|--------|------|
| `TriggerInputState` | interface |
| `TriggeredEvent` | interface |
| `checkLambda2Drop` | function |
| `checkFrictionSpike` | function |
| `checkCascadeActivation` | function |
| `checkEpsilonRSpike` | function |
| `checkPhiLVelocityAnomaly` | function |
| `checkOmegaGradientInversion` | function |
| `checkStructuralTriggers` | function |

All nine symbols must remain exported with unchanged signatures. The new additions (`BOCPDTriggerConfig`, `TriggerResult`, `evaluateBOCPDTrigger`) are purely additive.

**Risk**: Near zero. The new code is appended to the file, and the new import (`BOCPDRegistry`) does not shadow any existing import. The only existing import is `CASCADE_LIMIT` from `./dampening.js`.

### 7.2 Combined Trigger Function Unchanged

**Finding**: `checkStructuralTriggers` must **not** be modified to include the BOCPD trigger. The BOCPD trigger is invoked separately via `evaluateBOCPDTrigger`. Reasons:

1. `checkStructuralTriggers` takes a `TriggerInputState` and returns `TriggeredEvent[]` — the BOCPD trigger requires a different input (`BOCPDTriggerConfig` + `value`) and returns a different type (`TriggerResult`).
2. Including it would break the pure-function contract of `checkStructuralTriggers`.
3. The acceptance criteria do not require modification of `checkStructuralTriggers`.

---

## 8. Test Strategy for Conformance

### 8.1 Required Test Cases

The verification command targets `tests/conformance/structural-triggers.test.ts`. This file likely already exists (testing the six original triggers). The BOCPD trigger tests must be added to this file without breaking existing tests.

**Test Case 1 — Trigger fires when CP probability ≥ threshold**:
- Create a mock or real `BOCPDRegistry`.
- Feed a sequence of values that produces a known change-point probability above the threshold.
- Assert `result.fired === true`.
- Assert `registry.reset(metricName)` was called (verify via spy or by checking detector state).

**Test Case 2 — Trigger does not fire when CP probability < threshold**:
- Feed values from a stationary distribution.
- Set threshold high enough (e.g., 0.5) that baseline CP probability (~0.01) doesn't reach it.
- Assert `result.fired === false`.
- Assert `reset` was not called.

**Test Case 3 — Recalibration resets detector state**:
- Trigger a fire.
- Verify that the next observation after reset returns low CP probability (detector is fresh).

### 8.2 Mocking vs. Real Registry

**Finding**: Two approaches for testing:

| Approach | Trade-off |
|----------|-----------|
| Real BOCPDRegistry + BOCPDDetector | Integration test; validates end-to-end; requires generating sequences that reliably trigger CP detection |
| Mock registry with controlled `detect()` return values | Unit test; isolates trigger logic; faster; deterministic |

**Recommendation**: Use **both** approaches:
- A unit test with a mocked registry (stub `detect` to return a specific `changePointProbability`) to verify the threshold logic and reset call in isolation.
- An integration test with the real registry and a mean-shift sequence (from t4's test strategy: 30 samples from N(0,1) then 30 from N(5,1)) to verify end-to-end behaviour.

The mock-based test is essential for determinism — the exact CP probability from the real detector depends on implementation details and may vary with minor algorithmic changes. The threshold comparison should be tested against **controlled** probability values.

### 8.3 Spy on reset()

**Finding**: To verify that `registry.reset(metricName)` is called when the trigger fires (and not called when it doesn't), use `vi.spyOn(registry, 'reset')` from vitest. This is the idiomatic approach in vitest/jest test suites.

**Alternative**: Check `detector.runLength` after the trigger fires — if reset was called, the run-length distribution should be `[1.0]` (back to prior). This is a behavioural verification that doesn't require spying.

**Recommendation**: Use `vi.spyOn` for explicit verification, supplemented by behavioural checks for confidence.

---

## 9. Risks and Mitigations

### 9.1 Import Resolution at Compile Time

**Risk**: If `BOCPDRegistry.ts` does not exist or exports a different symbol name when `tsc --noEmit` is run, the build fails.

**Mitigation**: The t3 task (BOCPDRegistry implementation) must be completed and committed before this task's `tsc --noEmit` verification can pass. The task pipeline ordering (t3 before t5) ensures this.

**Evidence**: The prior task outputs (t1, t3) confirm `BOCPDRegistry` is a named class export from `src/signals/BOCPDRegistry.ts`.

### 9.2 Circular Dependency

**Risk**: If `BOCPDRegistry` or its transitive dependencies import from `src/computation/`, a circular dependency would form.

**Finding**: `BOCPDRegistry` (in `src/signals/`) depends on `BOCPDDetector` (also in `src/signals/`) and types from `src/signals/types.ts`. It does **not** import from `src/computation/`. Therefore no circular dependency exists.

**Verification**: `tsc --noEmit` with `--strict` mode would catch circular dependency issues that cause type resolution failures.

### 9.3 Floating-Point Equality at Threshold Boundary

**Risk**: The `>=` comparison `signal.changePointProbability >= config.changePointThreshold` may behave unexpectedly if the probability is extremely close to the threshold due to floating-point representation.

**Finding**: This is a general floating-point concern, not specific to this implementation. The BOCPD posterior normalisation produces probabilities that are sums and products of floating-point numbers — they will rarely be *exactly* equal to a configured threshold. In practice, the change-point probability either spikes well above the threshold (during actual drift) or remains well below it (during stationarity). The boundary case is vanishingly unlikely in production.

**Mitigation**: None needed. The `>=` semantics are correct and consistent with the acceptance criteria.

### 9.4 Thread Safety / Reentrancy

**Risk**: If `evaluateBOCPDTrigger` is called from within a callback triggered by `registry.reset()`, reentrancy could corrupt state.

**Finding**: JavaScript is single-threaded. `registry.reset()` is synchronous (it just resets arrays). There is no mechanism for reentrancy. Risk is zero.

---

## 10. Recommended File-Level Organisation

**Finding**: The new code should be placed **after** the existing `checkStructuralTriggers` function, in a clearly delineated section. Suggested section header:

```
// ============ HYBRID BOCPD DRIFT TRIGGER ============
```

This follows the existing pattern of `// ============ TYPES ============`, `// ============ INDIVIDUAL TRIGGERS ============`, and `// ============ COMBINED CHECK ============` sections.

**Ordering within the new section**:
1. Import statement (at top of file, alongside existing import)
2. `BOCPDTriggerConfig` interface
3. `TriggerResult` interface
4. `evaluateBOCPDTrigger` function

This ordering mirrors the existing file's pattern of types-before-functions.

---

## 11. Summary of Recommendations

| Decision Point | Recommendation | Rationale |
|----------------|---------------|-----------|
| Import source | `../signals/BOCPDRegistry.js` | Direct module path per acceptance criteria |
| `TriggerResult` type | New exported interface with `fired`, `changePointProbability`, `runLength`, `metricName`, `recalibrated`, `detail` | Provides complete diagnostic payload |
| Threshold validation | None | Consistent with existing trigger pattern |
| Recalibration payload | Embedded in `TriggerResult` return value | No event bus required; simplest interpretation |
| `checkStructuralTriggers` modification | None | BOCPD trigger is independent; different type signatures |
| Module docstring update | Acknowledge hybrid trigger statefulness | Documentation accuracy |
| Test approach | Mock-based unit test + real-registry integration test | Determinism for threshold logic; confidence for end-to-end |
| Code placement | New section after `checkStructuralTriggers` | Follows existing file organisation pattern |