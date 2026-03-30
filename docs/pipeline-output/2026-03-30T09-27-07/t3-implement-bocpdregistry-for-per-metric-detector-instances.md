# Implement BOCPDRegistry for per-metric detector instances

> Task ID: t3
> Model: claude-opus-4-6:adaptive:medium
> Duration: 71016ms
> Output chars: 11262
> Timestamp: 2026-03-30T09:43:24.331Z

> **⚠️ Hallucination flags (2):**
> - [content/warning] Task t3 references "src/signals/index.ts" but this file was not in its context
> - [content/warning] Task t3 references "BOCPDRegistry class exported as named export from src/signals/BOCPDRegistry.ts" but this file was not in its context

---

# Analysis: BOCPDRegistry for Per-Metric Detector Instances

## 1. Architectural Role

### 1.1 Purpose Within the BOCPD Subsystem

The `BOCPDRegistry` is the **coordination layer** between the per-metric `BOCPDDetector` instances (t2) and the upstream consumers (hybrid trigger, `updateMorpheme` wiring). Its primary invariant is **posterior isolation**: each metric's run-length distribution evolves independently, so drift detected on metric A cannot contaminate the posterior of metric B.

**Evidence**: The spec (cs-v5.0.md) describes BOCPD as operating on individual signal dimensions (ΦL, ΨH, εR). Each dimension produces its own time series. Without isolation, a change point in ΦL could artificially inflate change-point probability in εR — a statistical cross-contamination that would produce false positives in the hybrid trigger.

### 1.2 Pattern Classification

This is a straightforward **Registry / Factory pattern** — a keyed collection with lazy construction. The design is intentionally simple: a `Map<string, BOCPDDetector>` with no eviction, no concurrency control, and no lifecycle hooks beyond `reset()`. This is appropriate given that:

- The number of distinct metric names is small and bounded (three state dimensions × N agents, or in practice a handful of named streams).
- Detector instances are lightweight (arrays that grow linearly with observations between resets).
- The registry lives within a single JS event loop — no thread-safety concern.

## 2. API Surface Analysis

### 2.1 `getOrCreate(metricName: string, config?: Partial<BOCPDConfig>): BOCPDDetector`

**Finding**: The `config` parameter must only be applied at **creation time**. On subsequent calls for the same `metricName`, the config argument should be ignored (the existing detector is returned as-is). This is the canonical lazy-initialization semantic.

**Risk**: If a caller passes a *different* config on a second call, they may expect reconfiguration but will silently get the original detector. Two mitigation options exist:

| Option | Trade-off |
|--------|-----------|
| Ignore silently (recommended) | Simple; matches Map-based registry conventions; caller can explicitly `reset()` + `getOrCreate()` |
| Throw if config differs | Defensive but expensive to compare; adds complexity without clear benefit |
| Warn via console | Side-effect in a library; inappropriate |

**Recommendation**: Ignore the config on subsequent calls. Document this behaviour in the JSDoc. The acceptance criteria ("returns the identical BOCPDDetector instance on repeated calls for the same metricName") directly mandates this — identity equality (`===`) must hold.

### 2.2 `detect(metricName: string, value: number): BOCPDSignal`

**Finding**: This method must implicitly call `getOrCreate(metricName)` if no detector exists yet, using default config. This follows from the "route observations" requirement — callers should not be forced to call `getOrCreate` before `detect`.

**Evidence**: The acceptance criterion states `detect(metricName, value) delegates to the correct per-metric detector and returns its BOCPDSignal`. The word "delegates" implies the registry is a thin router; the actual BOCPD logic remains in `BOCPDDetector.detect()`.

**Design question**: Should `detect` accept an optional config for auto-creation? **No** — this overloads the method's purpose and muddies the API. If custom config is needed, the caller should call `getOrCreate(name, config)` first. The `detect` method should use `getOrCreate(metricName)` with no config (triggering default construction).

### 2.3 `reset(metricName: string): void`

**Finding**: Must call `detector.reset()` on the named detector only. If the metric name does not exist in the map, the method has two reasonable behaviours:

| Behaviour | Rationale |
|-----------|-----------|
| No-op (recommended) | Defensive; resetting a non-existent metric is a vacuous operation |
| Throw | Strict; catches typos but adds error-handling burden on callers |

**Recommendation**: No-op with early return. The acceptance criterion ("calls detector.reset() for that metric only; other metrics are unaffected") does not require a throw on missing keys, and the hybrid trigger's recalibration action may speculatively reset metrics that haven't been observed yet.

**Critical invariant to verify in tests**: After `reset(metricA)`, `metricB`'s detector must have **identical internal state** to what it had before the reset call. This is the "other metrics are unaffected" criterion. The simplest verification is to snapshot `metricB`'s `detect()` output before and after `reset(metricA)` and assert equality.

### 2.4 `resetAll(): void`

**Finding**: Iterates `this.detectors.values()` and calls `reset()` on each. Straightforward. The map entries are **preserved** (not deleted) — `resetAll` means "recalibrate all detectors to their initial priors", not "destroy all detectors". This is important because:

1. Subsequent `detect()` calls should still route to the same (now-recalibrated) instances.
2. Any external references obtained via `getOrCreate()` remain valid.

## 3. Internal State Design

### 3.1 Map Type and Key Strategy

```
private readonly detectors: Map<string, BOCPDDetector>
```

**Finding**: The key is the raw `metricName` string. No canonicalization (lowercasing, trimming) is applied. This is correct — metric names are programmatic identifiers (e.g., `"phiL"`, `"psiH"`, `"epsilonR"`), not user-input strings. Canonicalization would add complexity without value.

### 3.2 Default Config Storage

**Finding**: The registry needs a way to construct detectors with a **default config** when `getOrCreate` is called without one. Two approaches:

| Approach | Trade-off |
|----------|-----------|
| Hardcode defaults in `getOrCreate` | Simple; mirrors BOCPDDetector's own defaults |
| Accept a registry-wide default in constructor | More flexible; allows all metrics to share a non-default baseline |

**Recommendation**: Accept an optional `defaultConfig?: Partial<BOCPDConfig>` in the `BOCPDRegistry` constructor and merge it when creating detectors. This supports the common case where all metrics in a Bloom share the same hazard rate but individual metrics can override. Falls back to BOCPDDetector's built-in defaults `(0, 1, 1, 1, 0.01)` when nothing is provided.

### 3.3 BOCPDDetector Import

The registry imports `BOCPDDetector` as a **default import** from `./BOCPDDetector` (per t2's `export default class BOCPDDetector`). It imports `BOCPDSignal` and `BOCPDConfig` as named imports from `./types` (per t1's type definitions).

**Risk**: If t2 changes from default to named export, the import breaks. However, the t2 output explicitly states `export default class BOCPDDetector`, and the barrel in `src/signals/index.ts` (t1) re-exports it as `export { default as BOCPDDetector } from './BOCPDDetector'`. The registry should import directly from `./BOCPDDetector`, not from the barrel, to avoid circular dependency risk.

## 4. Per-Metric Isolation Verification

### 4.1 What "Isolation" Means Formally

Two detectors `D_A` and `D_B` are isolated if and only if:

1. `D_A !== D_B` (distinct object identity)
2. For any sequence of operations `[detect(A, x₁), detect(A, x₂), …]` and `[detect(B, y₁), detect(B, y₂), …]`, the outputs of `D_B` are identical regardless of the operations applied to `D_A` (and vice versa).

**Finding**: Isolation is guaranteed by construction if `BOCPDDetector` instances share no mutable state. Since `BOCPDDetector` (t2) stores its hyperparameter arrays and run-length vector as instance properties (not module-level globals), and the NIG updates are purely internal, isolation holds automatically. The registry's `Map` ensures distinct instances per key.

### 4.2 Subtle Shared-State Risk: Config Object

If the registry passes the **same config object reference** to multiple `BOCPDDetector` constructors, and `BOCPDDetector` mutates that config internally (e.g., to store default values), the detectors would share mutable state through the config.

**Finding from t2 analysis**: `BOCPDDetector`'s constructor should spread the config into a new object (or store individual scalar fields). This is the standard defensive-copy pattern. The registry should **also** defensively copy the config before passing it:

```
new BOCPDDetector({ ...resolvedConfig })
```

This belt-and-suspenders approach eliminates the risk entirely.

## 5. Export and Module Integration

### 5.1 Named Export

The acceptance criteria require `BOCPDRegistry class exported as named export from src/signals/BOCPDRegistry.ts`. This means:

```typescript
export class BOCPDRegistry { ... }
```

**Not** a default export. This aligns with the barrel re-export in `src/signals/index.ts` (t1 output):

```typescript
export { BOCPDRegistry } from './BOCPDRegistry';
```

### 5.2 Dependency Graph

```
src/signals/index.ts  ──re-exports──▶  BOCPDRegistry
                                            │
                                            ├── imports BOCPDDetector (default) from ./BOCPDDetector
                                            └── imports BOCPDSignal, BOCPDConfig from ./types
```

No circular dependencies. The registry depends on the detector; the detector depends only on types. The barrel re-exports both but introduces no cycles since it's a leaf in the import graph.

## 6. Test Strategy Implications

While this analysis task does not implement tests, the following test scenarios are implied by the acceptance criteria and should inform the consolidated test task:

| Test Case | Acceptance Criterion | Key Assertion |
|-----------|---------------------|---------------|
| Identity stability | "identical BOCPDDetector instance on repeated calls" | `registry.getOrCreate('m') === registry.getOrCreate('m')` |
| Delegation correctness | "delegates to the correct per-metric detector" | `registry.detect('m', x)` produces same result as `registry.getOrCreate('m').detect(x)` |
| Single reset isolation | "reset(metricName) … other metrics are unaffected" | After `reset('A')`, detector B's next `detect()` output is unchanged |
| Reset all coverage | "resetAll() calls reset() on every registered detector" | All detectors' run-length posteriors return to priors |
| Cross-metric independence | "two detectors fed different distributions do not share internal state" | Feed metric A constant values, metric B volatile values; A's change-point probability stays low while B's spikes |

## 7. Summary of Recommendations

1. **`getOrCreate` ignores config on subsequent calls** — returns existing instance; document in JSDoc.
2. **`detect` auto-creates with defaults** — calls `getOrCreate(metricName)` internally; no config parameter on `detect`.
3. **`reset` on unknown metric is a no-op** — no throw, no side effects.
4. **`resetAll` preserves map entries** — resets state, does not delete detectors.
5. **Constructor accepts optional `defaultConfig`** — merged into per-metric config at creation time.
6. **Defensive config copy** — spread config before passing to `BOCPDDetector` constructor.
7. **Named export** — `export class BOCPDRegistry`, not default.
8. **Direct import from `./BOCPDDetector`** — avoid barrel import to prevent potential circular dependency.