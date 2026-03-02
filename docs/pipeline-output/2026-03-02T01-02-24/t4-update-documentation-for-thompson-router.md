# Update Documentation for Thompson Router

> Task ID: t4
> Model: claude-sonnet-4-6:adaptive:low
> Duration: 83495ms
> Output chars: 11544
> Timestamp: 2026-03-02T01:08:11.557Z

---

# Documentation Update: Thompson Router Audit Findings

## Scope

This document records the audit findings from tasks t1–t3 and prescribes the corresponding updates to `docs/hypotheses/thompson-routing.md`. It serves as the authoritative reconciliation between the Engineering Bridge spec Part 2 and the Thompson router implementation.

---

## Audit Summary

Three audits were conducted against `src/patterns/thompson-router/` and `docs/specs/05_codex-signum-engineering-bridge-v2_0.md` Part 2:

| Audit | Subject | Outcome |
|---|---|---|
| t1 | `selectModel()` sampling algorithm orchestration | ⚠️ Partially verifiable; critical gaps in gradient and spectral integration |
| t2 | Context cluster granularity | ⚠️ Partial conformance; missing topology, maturity index, and spectral dimensions |
| t3 | Exploration floor implementation | ❌ Not implemented; complete absence of all three spec-mandated layers |

---

## Updated Hypotheses

### H-010: Context-Blocked Posteriors Exploit Bias-as-Strength

- **Source:** Self-Recursive Learning §2, Thompson Router Architecture
- **Claim:** Maintaining separate Beta distributions per (model, context_cluster) allows exploiting model specialisation — a model that's poor at coding but excellent at review gets routed to review tasks, not suppressed entirely
- **Status:** validated with qualification
- **Evidence:**
  - `src/patterns/thompson-router/select-model.ts` — `selectModel()` queries arm stats per context cluster
  - `src/patterns/thompson-router/router.ts` — Thompson sampling implementation
  - Live execution in DND-Manager confirms routing convergence
- **Audit Finding (t1, t2):** The per-cluster Beta distribution architecture is sound. However, the cluster dimensions used (`taskType:complexity:domain`) are incomplete relative to the Engineering Bridge spec Part 2. The spec requires granularity along three additional axes that are absent:

  | Spec-Required Dimension | Implementation Status | Impact |
  |---|---|---|
  | Node topology type (leaf / intermediate / root) | ❌ Absent | Window size cannot be topology-dependent per spec table |
  | Computed maturity index (four-factor formula) | ❌ Absent; `complexity` is a static input, not a computed MI | εR thresholds use wrong bands |
  | Spectral ratio | ❌ Absent | Spectral-calibrated εR floors cannot be applied per-cluster |

- **Spec Reference:** Part 2, εR section (spectral calibration table); Part 2, adaptive thresholds (maturity-indexed); Part 2, sliding window sizes (topology-dependent).
- **Qualification:** The bias-as-strength property holds architecturally. The routing correctly separates Beta distributions by context. The non-compliance is in *how finely* and *on what dimensions* clusters are defined, not in whether clustering occurs.
- **Notes:** Even models with 80% hallucination rates provide value when properly governed (Mistral finding). This finding remains valid.

---

### H-011: Thompson Exploration Rate Decays Naturally

- **Source:** Thompson Router Architecture §exploration
- **Claim:** Thompson sampling's exploration rate decreases naturally as evidence accumulates, without requiring an explicit exploration schedule
- **Status:** validated with critical caveat
- **Evidence:**
  - `src/patterns/thompson-router/router.ts` — Beta distribution convergence
  - Mathematical property of Beta(α, β): variance decreases as α+β increases
- **Audit Finding (t3):** The mathematical claim is correct — Beta distribution variance decreases as evidence accumulates. However, this property describes natural convergence toward exploitation, which the spec explicitly warns against. The Engineering Bridge spec Part 2 states:

  > "High ΦL with zero εR is a warning, not a success."
  > "εR = 0.0 → Warning. Force minimum exploration." (εR status table)

  The spec mandates three layers of exploration floor enforcement, none of which are implemented:

  | Layer | Spec Formula | Implementation Status |
  |---|---|---|
  | Base floor | `base_εR` (never zero, per CAS Watchpoint #4) | ❌ Not present in `sampler.ts` |
  | Gradient modulation | `εR_floor = base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient))` | ❌ No Ω gradient input path exists anywhere in the sampler |
  | Spectral calibration | `εR_floor = max(gradient_floor, min_εR_for_spectral_state(spectral_ratio))` | ❌ No spectral ratio input or lookup |

- **Risk:** Without a floor, the Thompson router can converge to selecting a single model across a context cluster. If that model degrades in ways not captured by the Beta update (subtle quality drift, latency creep), there is no mechanism to discover alternatives. This is exactly the Lock-In and Path Dependence failure mode described in Part 6, CAS Watchpoint #4.
- **Corrected Framing:** Thompson's natural decay is a feature during healthy exploitation. It requires a counterbalancing minimum floor to prevent pathological lock-in. Natural decay without a floor is incomplete, not sufficient.
- **Notes:** No ε-greedy schedule is needed — the spec agrees. What is needed is a minimum floor enforced structurally, not a schedule. The hypothesis as originally stated omits the floor requirement entirely.

---

### H-012: Minimum Trial Threshold Before Exploitation

- **Source:** Engineering Bridge v2.0
- **Claim:** Models need minimum N observations per context before Thompson can reliably exploit
- **Status:** proposed — and now further clarified by audit
- **Evidence:** Not formally tested — Thompson works from trial 1 but early routing is noisy
- **Audit Finding (t1):** The `decisionCount` passed to `route()` provides a partial proxy for observation depth within a cluster. However, the spec's maturity index formula requires four components, only one of which (`mean_observation_depth`) maps to `decisionCount`:

  ```
  maturity_index = min(1.0,
      0.25 × normalize(mean_observation_depth) +   ← partially captured by decisionCount
      0.25 × normalize(connection_density) +        ← not captured
      0.25 × normalize(mean_component_age) +        ← not captured
      0.25 × normalize(mean_ΦL_ecosystem)           ← not captured
  )
  ```

  The maturity factor also applies to ΦL computation via the maturity modifier formula:

  ```
  ΦL_effective = ΦL_raw × maturity_factor
  maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
  ```

  At zero observations or connections, `maturity_factor` approaches 0, meaning early routing decisions operate with very low effective health signal.

- **Notes:** Research question stands — empirical convergence point needs live data analysis. The N = 50+ observations / 3+ connections threshold from the spec's maturity modifier is a starting reference point for hypothesis testing.

---

## New Findings Requiring Documentation

### H-013: Exploration Floor Is a Safety Mechanism, Not an Optional Enhancement

- **Source:** Engineering Bridge v2.0 Part 2 (εR section), Part 6 (CAS Watchpoint #4)
- **Claim:** The exploration floor (minimum εR > 0) is a mandatory safety control against lock-in, not an optional tuning parameter
- **Status:** proposed (audit-derived)
- **Evidence:**
  - Spec Part 6, Watchpoint #4: "εR minimum floor (never zero); challenge seeds for mature networks" — listed as a required mitigation for Lock-In and Path Dependence vulnerability
  - Spec Part 2, εR table: εR = 0.0 → "Warning. Force minimum exploration." — normative language
  - t3 audit: No floor is implemented anywhere in the sampler or orchestration layer
- **Implication:** The current implementation violates a safety requirement, not merely a performance recommendation. Any context cluster can reach εR = 0.0 as Beta distributions concentrate with evidence accumulation.
- **Notes:** The two-component floor (gradient-modulated base + spectral calibration maximum) in the spec is designed to remain responsive to system state. The gradient modulation ensures the floor rises during degradation (negative Ω), providing active exploration pressure exactly when the system is most at risk of being stuck with a failing model.

---

### H-014: Gradient Modulation Requires an Ω Input Path

- **Source:** Engineering Bridge v2.0 Part 2 (εR imperative gradient modulation)
- **Claim:** Correct εR floor computation requires Ω aggregate gradient as an input to the routing decision
- **Status:** proposed (audit-derived)
- **Evidence:**
  - Spec formula: `εR_floor = base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient))`
  - t1 audit: No Ω gradient computation is visible in `selectModel()`
  - t3 audit: `sampleBeta(alpha, beta)` has no gradient input parameter; no calling code provisions for it
  - `gradient_sensitivity` recommended range 0.05–0.15 per spec; not present in any configuration
- **Implication:** The `route()` function call signature and `sampler.ts` API are missing a required input. Ω aggregate gradient must be computed from recent performance trends and passed through the call chain before gradient-modulated exploration floors can be implemented.
- **Notes:** When Ω gradients are positive (system improving), the correction term is zero — the gradient modulation is inactive and only the base floor applies. The cost of computing Ω gradient is therefore incurred most often precisely when the system needs it: during degradation.

---

## Specification Conformance Summary

| Spec Requirement (Part 2) | Status | Hypothesis |
|---|---|---|
| Per-cluster Beta distributions | ✅ Implemented | H-010 |
| Context cluster dimensions: taskType, domain | ✅ Implemented | H-010 |
| Context cluster dimensions: topology type | ❌ Missing | H-010 |
| Context cluster dimensions: computed maturity index | ❌ Missing (static complexity substituted) | H-010, H-012 |
| Context cluster dimensions: spectral ratio | ❌ Missing | H-010 |
| Natural exploration decay via Beta variance | ✅ Mathematically correct | H-011 |
| Base exploration floor (εR never zero) | ❌ Not implemented | H-011, H-013 |
| Gradient-modulated floor (Ω input) | ❌ Not implemented | H-013, H-014 |
| Spectral-calibrated floor (four-tier table) | ❌ Not implemented | H-013 |
| εR observability (exploratory/total tracking) | ✅ Decision recording present in selectModel() | H-011 |
| Maturity index (four-factor formula) | ❌ Only observation depth partially captured | H-012 |
| Maturity modifier on ΦL | ❌ Not visible | H-012 |

---

## Recommended Documentation Actions

The following changes to `docs/hypotheses/thompson-routing.md` are prescribed by this audit:

1. **H-010:** Change status from `validated` to `validated with qualification`. Add the cluster dimension gap findings and the spec conformance table above.

2. **H-011:** Change status from `validated` to `validated with critical caveat`. Add the floor requirement findings. Revise the notes to clarify that natural decay is necessary but not sufficient — the spec requires a counterbalancing floor. Remove the statement "No ε-greedy or UCB needed" — while accurate regarding scheduling, it can be misread as implying no floor is needed.

3. **H-012:** Retain `proposed` status. Add the `decisionCount` partial-capture finding and the four-factor maturity index breakdown showing which components are missing.

4. **Add H-013** as documented above with status `proposed`.

5. **Add H-014** as documented above with status `proposed`.

These updates bring the hypothesis document into alignment with what the audit found and correctly classify the exploration floor absence as a spec violation rather than a research question.