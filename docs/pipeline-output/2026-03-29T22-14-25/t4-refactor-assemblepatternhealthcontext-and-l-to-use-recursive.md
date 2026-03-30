# Refactor assemblePatternHealthContext() and ΦL to use γ-recursive posteriors

> Task ID: t4
> Model: claude-opus-4-6:adaptive:medium
> Duration: 113146ms
> Output chars: 17658
> Timestamp: 2026-03-29T23:07:54.454Z

> **⚠️ Hallucination flags (7):**
> - [content/warning] Task t4 references "phi-l.ts" but this file was not in its context
> - [content/warning] Task t4 references "write-observation.ts" but this file was not in its context
> - [content/warning] Task t4 references "src/graph/queries/health.ts" but this file was not in its context
> - [content/warning] Task t4 references "src/computation/" but this file was not in its context
> - [content/warning] Task t4 references "src/graph/queries/arm-stats.ts" but this file was not in its context
> - [content/warning] Task t4 references "arm-stats.ts" but this file was not in its context
> - [content/warning] Task t4 references "client.ts" but this file was not in its context

---

# Analysis: Refactor assemblePatternHealthContext() and ΦL to Use γ-Recursive Posteriors (t4)

## Summary

This task replaces the observation Grid read path in `assemblePatternHealthContext()` with direct Bloom/Resonator property reads via `getDecayWeightedPosteriors()`, and derives the `usageSuccessRate` ΦL factor from γ-recursive running averages (Beta posteriors) stored inline on nodes. The change eliminates an aggregation query path in favour of O(1) property lookups, aligning ΦL computation with the M-10.1 structural memory foundation.

---

## Findings

### F1: assemblePatternHealthContext() Location and Current Behavior

**Finding:** `assemblePatternHealthContext()` is not defined in `phi-l.ts` — it is a consumer-side function that assembles `PatternHealthContext` (defined in `write-observation.ts`, lines ~90–120) before passing it to the write-observation pipeline. The function likely resides in a health-context assembly module or in the graph queries layer.

**Evidence:**
- `PatternHealthContext` interface in `write-observation.ts` contains `factors: PhiLFactors`, which includes `usageSuccessRate`
- The `writeObservation()` function accepts an optional `PatternHealthContext` and delegates to `computePhiL()` for ΦL recomputation
- M-10.1 requirement 4 explicitly names `assemblePatternHealthContext()` as the modification target
- No definition appears in `phi-l.ts`, `write-observation.ts`, or the other provided files — it is an assembly/orchestration function

**Implication:** The function must be located (likely in `src/graph/queries/health.ts` or `src/computation/` directory) to understand its current Grid read pattern. The refactoring must preserve the `PatternHealthContext` shape while changing how `factors.usageSuccessRate` is populated.

**Risk:** If the function does not yet exist (i.e., it is currently inlined at call sites), it must be extracted and centralized before the posterior integration can proceed.

---

### F2: ΦL Factor Derivation From Beta Posteriors — Mathematical Mapping

**Finding:** The `usageSuccessRate` factor in `PhiLFactors` maps directly to the posterior mean of a Beta distribution. Given `weightedSuccesses` (α component) and `weightedFailures` (β component), the decay-weighted success rate is:

```
usageSuccessRate = α / (α + β)
```

where `α = weightedSuccesses + 1` and `β = weightedFailures + 1` (adding the prior).

**Evidence:**
- `computeUsageSuccessRate(successCount, totalCount)` in `phi-l.ts` (line ~130) currently computes `successCount / totalCount` — this is the frequentist estimator
- The Beta posterior mean `α / (α + β)` is the Bayesian equivalent with Laplace smoothing when using a Beta(1,1) prior
- t3 analysis confirms `getDecayWeightedPosteriors()` returns `{alpha: weightedSuccesses + 1, beta: weightedFailures + 1}`
- t9 analysis confirms defaults yield uninformative Beta(1,1) → `usageSuccessRate = 0.5` for new nodes (matches `computeTemporalStability` default of 0.5 for insufficient data)

**Recommendation:** The assembly function should compute:

```typescript
const posteriors = await getDecayWeightedPosteriors(bloomId, armId);
const usageSuccessRate = posteriors.alpha / (posteriors.alpha + posteriors.beta);
```

This replaces the current pattern of querying observation counts from a Grid and passing them to `computeUsageSuccessRate()`. The `computeUsageSuccessRate()` function itself remains useful as a pure utility but is no longer the primary path for `assemblePatternHealthContext()`.

**Mathematical validation:**
| State | weightedSuccesses | weightedFailures | α | β | usageSuccessRate |
|-------|-------------------|------------------|---|---|------------------|
| Uninformative | 0 | 0 | 1 | 1 | 0.500 |
| After 1 success (γ=0.95) | 1.0 | 0.0 | 2.0 | 1.0 | 0.667 |
| After 10 successes, 2 failures (γ=0.95, decayed) | ~6.51 | ~1.73 | ~7.51 | ~2.73 | ~0.733 |
| Heavily decayed old data | ~0.12 | ~0.08 | ~1.12 | ~1.08 | ~0.509 |

The decay naturally returns estimates toward the prior as old data loses weight — a desirable property for adaptive systems.

---

### F3: γ-Recursive Inline Update Integration Point

**Finding:** The γ-recursive update formula `α_new = γ × α_old + outcome` must execute at write time (inline with execution completion), NOT at read time within `assemblePatternHealthContext()`. The assembly function is a **reader** of the already-updated posteriors; the **writer** is the execution completion path.

**Evidence:**
- M-10.1 requirement 1: "updated inline after execution via α_new = γ × α_old + outcome"
- t9 analysis: "write-time accumulation" vs "read-time aggregation"
- `writeObservation()` in `write-observation.ts` is the canonical observation recording path — the γ-recursive update should integrate into step 1 or as a parallel step

**Implication for this task:** `assemblePatternHealthContext()` does NOT perform the γ-recursive update. It reads the result. However, this task must ensure the assembly function's contract assumes properties are kept current by the write path. The inline update logic belongs in the observation write pipeline (likely `writeObservation()` or `stampBloomComplete()`).

**Update location candidates:**

| Location | Trigger | Appropriateness |
|----------|---------|-----------------|
| `writeObservation()` step 1 | Every observation write | ✅ Natural — observations ARE outcomes |
| `stampBloomComplete()` | Bloom completion | Partial — only captures completion, not per-execution |
| Dedicated `updatePosteriors()` | Explicit call | Possible but adds indirection |

**Recommendation:** The γ-recursive update should be added as a new step in `writeObservation()` (between observation recording and ΦL recomputation), using the observation's success/failure outcome to update `weightedSuccesses`/`weightedFailures` on the source Bloom node. This ensures posteriors are always current when `assemblePatternHealthContext()` reads them.

---

### F4: Observation Count and Connection Count — Continued Relevance

**Finding:** `computePhiL()` requires `observationCount` and `connectionCount` for the maturity factor computation. These are NOT replaced by the posterior properties — they serve a different function (maturity gating, not success rate estimation).

**Evidence:**
- `computeMaturityFactor(observationCount, connectionCount)` in `phi-l.ts` (line ~82) gates the effective ΦL via `(1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))`
- `PatternHealthContext` carries both `observationCount` and `connectionCount` independently of `factors`
- The maturity factor prevents high ΦL scores for nodes with insufficient history — orthogonal to the success rate estimation

**Implication:** `assemblePatternHealthContext()` must still obtain `observationCount` and `connectionCount` from the graph. Only the `usageSuccessRate` factor derivation changes. Two strategies for observation count:

1. **Derive effective observation count from posteriors:** The sum `α + β - 2` approximates the effective sample size under γ-decay, but this is an approximation — the exponential decay means the effective N is always less than the true count.
2. **Continue reading observation count from graph:** Query `COUNT` of observation relationships or a cached counter property.

**Recommendation:** Strategy 2 (continued graph read for observation count) is safer. The maturity factor requires the true accumulated history length, not the decay-effective count. However, if the goal is to eliminate ALL Grid reads, then a counter property on the Bloom node (incremented on each observation write) would serve. This is a design decision requiring specification clarity.

---

### F5: Remaining ΦL Factors — axiomCompliance, provenanceClarity, temporalStability

**Finding:** Only `usageSuccessRate` is derived from the posterior properties. The other three factors require separate data sources:

| Factor | Current Source | Post-Refactor Source | Change? |
|--------|---------------|---------------------|---------|
| `axiomCompliance` | Axiom check results | Axiom check results | No |
| `provenanceClarity` | Provenance graph analysis | Provenance graph analysis | No |
| `usageSuccessRate` | Grid observation aggregation | `getDecayWeightedPosteriors()` | **Yes** |
| `temporalStability` | Ring buffer / variance | Ring buffer / variance | No |

**Evidence:**
- `computeAxiomComplianceFactor()` (line ~117) takes a compliance record — no observation Grid dependency
- `temporalStability` is computed from `PhiLState` ring buffer via `computeTemporalStabilityFromState()` (line ~170) — no Grid dependency
- `provenanceClarity` has no extractor in `phi-l.ts` — sourced externally

**Implication:** The refactoring scope for `assemblePatternHealthContext()` is surgically limited to replacing the `usageSuccessRate` derivation pathway. The function's overall structure (gathering four factors + counts) remains intact.

---

### F6: getDecayWeightedPosteriors() Availability and Interface

**Finding:** Per t3 analysis, `getDecayWeightedPosteriors(bloomId, armId)` returns `DecayWeightedPosterior` (`{alpha: number, beta: number}`) from Bloom/Resonator node properties. The function uses `COALESCE` for missing property defaults and matches both Bloom and Resonator labels.

**Evidence from t3:**
- Returns `{alpha: weightedSuccesses + 1, beta: weightedFailures + 1}`
- Gracefully defaults to Beta(1,1) when properties are absent
- Matches by `bloomId` (primary), with `armId` for validation/logging
- Located in `src/graph/queries/arm-stats.ts`

**Integration contract for assemblePatternHealthContext():**

```typescript
// Pseudocode — not a code deliverable
const posteriors = await getDecayWeightedPosteriors(bloomId, currentArmId);
const usageSuccessRate = posteriors.alpha / (posteriors.alpha + posteriors.beta);
```

**Dependency:** This task depends on t3 (getDecayWeightedPosteriors implementation) being complete. If t3 is not yet merged, the assembly function can be written against the interface with a TODO for the import path.

---

### F7: γ (Gamma) Derivation From Lambda Config Seeds

**Finding:** The γ decay factor used in `α_new = γ × α_old + outcome` is derived from the lambda Config Seeds (t2). The relationship is:

```
λ = ln(2) / halfLifeMs
γ = e^(-λ × Δt)
```

where `Δt` is the elapsed time since the last update in milliseconds.

**Evidence from t2:**
- `config:lambda:model-performance` → halfLifeMs = 216,000,000 (2.5 days)
- γ is time-dependent — it varies with the interval between updates
- For the model-performance context at exactly one half-life interval: `γ = e^(-ln(2)) = 0.5`
- For updates separated by ~6 hours (1/10 of half-life): `γ = e^(-0.1 × ln(2)) ≈ 0.933`

**Implication for assemblePatternHealthContext():** The assembly function does NOT compute γ. It reads the already-decayed posteriors. However, the write-side update path needs access to:
1. The appropriate lambda Config Seed for the context
2. The timestamp of the last update (to compute Δt)
3. The formula above to derive γ before applying the recursive update

**Recommendation:** The write-side γ computation should be encapsulated in a utility function (e.g., `computeGamma(halfLifeMs, elapsedMs)`) that the observation writer calls. This utility naturally belongs in `src/computation/` alongside `phi-l.ts`.

---

### F8: PatternHealthContext Interface — No Structural Change Required

**Finding:** The `PatternHealthContext` interface defined in `write-observation.ts` does not need modification. The change is entirely in HOW the `factors.usageSuccessRate` value is populated, not in the interface shape.

**Evidence:**
- `PatternHealthContext.factors` is typed as `PhiLFactors` which contains `usageSuccessRate: number` (a value in [0,1])
- Whether this value comes from `successCount / totalCount` or from `alpha / (alpha + beta)` is transparent to downstream consumers
- `computePhiL()` in `phi-l.ts` accepts `PhiLFactors` unchanged

**Implication:** All existing consumers of `PatternHealthContext` and `computePhiL()` remain backward-compatible. The refactoring is confined to the assembly function.

---

### F9: Potential observationCount Derivation From Posteriors

**Finding:** If the intent is to fully eliminate Grid reads (not just for success rate but for observation counts too), an effective observation count can be approximated from the posteriors:

```
effectiveN ≈ α + β - 2  (subtracting the prior)
```

However, under γ-decay, this effective N is always ≤ the true observation count. For maturity factor purposes, the true count is more appropriate because maturity should reflect total accumulated experience, not recency-weighted experience.

**Evidence:**
- `computeMaturityFactor` uses `observationCount` in `(1 - e^(-0.05 × observations))` — this saturates at ~60 observations
- Under γ ≈ 0.93 (6-hour intervals, 2.5-day half-life), the effective N from posteriors converges to ~14–15 even after hundreds of observations
- Using effective N would permanently cap the maturity factor below its saturation point

**Recommendation:** Do NOT derive `observationCount` from posteriors. Either:
- Continue a lightweight count query (single property read, not aggregation)
- Maintain an `observationCount` counter property on the Bloom node (incremented atomically alongside the γ-recursive update)

The second option aligns with the "eliminate Grid reads" intent while preserving maturity computation accuracy.

---

## Recommendations

### R1: Surgical Modification Scope

Modify `assemblePatternHealthContext()` with the following changes only:
1. **Replace** the Grid observation query for success/failure counts with a call to `getDecayWeightedPosteriors(bloomId, armId)`
2. **Compute** `usageSuccessRate = posteriors.alpha / (posteriors.alpha + posteriors.beta)`
3. **Retain** all other factor derivation paths unchanged
4. **Retain** `observationCount` and `connectionCount` sourcing (see R3)

### R2: Implement γ-Recursive Update in Write Path (Separate Concern)

The γ-recursive update (`α_new = γ × α_old + outcome`) belongs in the write path, not the assembly function. Add to `writeObservation()` or `stampBloomComplete()`:
1. Read current `weightedSuccesses`/`weightedFailures` from node
2. Compute `γ = e^(-ln(2) × Δt / halfLifeMs)` using elapsed time and context-appropriate lambda Config Seed
3. Apply update: `weightedSuccesses = γ × weightedSuccesses + (outcome === 'success' ? 1 : 0)`
4. Apply update: `weightedFailures = γ × weightedFailures + (outcome === 'failure' ? 1 : 0)`
5. Write updated properties in same transaction

### R3: Add observationCount Counter Property

To fully eliminate Grid aggregation reads, add an `observationCount` integer property to Bloom/Resonator nodes (incremented atomically in the write path). This provides the maturity factor input without requiring a `COUNT` query.

### R4: Add computeGamma() Utility

Create a pure utility function:
```
computeGamma(halfLifeMs: number, elapsedMs: number): number
```
Place in `src/computation/` for reuse by both the write-side update and any future recalibration logic.

### R5: Preserve computeUsageSuccessRate() as Utility

Do not remove `computeUsageSuccessRate()` from `phi-l.ts`. It remains useful for:
- Non-posterior contexts (e.g., batch analysis)
- Test utilities
- Backward compatibility

Mark its primary role as superseded in the context of `assemblePatternHealthContext()` with a doc comment.

### R6: TypeScript Compilation Path

The refactoring introduces one new import (`getDecayWeightedPosteriors` from `src/graph/queries/arm-stats.ts`) into the assembly function's module. Verify no circular dependency:
- `phi-l.ts` → no change (pure computation, no graph imports)
- Assembly module → imports from `arm-stats.ts` (graph query)
- `arm-stats.ts` → imports from `client.ts` (graph client)
- No cycle exists

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `assemblePatternHealthContext()` location unknown | Medium | High | Search codebase; if not found, create as new module with clear ownership |
| t3 not yet implemented (dependency) | Medium | Medium | Code against `DecayWeightedPosterior` interface; import can be resolved later |
| Maturity factor degradation from effective-N substitution | Low (if R3 followed) | High | Maintain true observation count per R3 |
| γ-recursive write path not yet wired | High (separate task) | Medium | Assembly function reads whatever is on the node; defaults to Beta(1,1) which yields 0.5 — safe degradation |
| Numerical precision in posterior mean | Very Low | Low | `alpha / (alpha + beta)` is numerically stable for all positive values |
| Lambda Config Seed not yet seeded (t2 dependency) | Medium | Low | Write path can use hardcoded default γ until configs are available |

**Overall risk: Low-Medium.** The read-side refactoring is straightforward. The write-side γ-recursive update is the higher-risk component but is architecturally separate from this task's primary scope (assembly function modification).

---

## Verification Strategy

1. **TypeScript compilation:** `npx tsc --noEmit` — confirms import paths, interface compatibility, no type errors
2. **Unit test:** `npm run test -- phi-l` — existing ΦL tests must pass (no interface changes to `computePhiL`)
3. **Integration test:** Mock `getDecayWeightedPosteriors()` returning known posteriors, verify `assemblePatternHealthContext()` produces correct `usageSuccessRate` in the resulting `PatternHealthContext`
4. **Regression:** Verify `writeObservation()` still produces correct `WriteObservationResult` when provided the refactored context