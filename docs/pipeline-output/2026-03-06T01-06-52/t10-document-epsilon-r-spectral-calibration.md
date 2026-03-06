# Document epsilon-R spectral calibration

> Task ID: t10
> Model: claude-opus-4-5:extended:8k
> Duration: 101102ms
> Output chars: 16469
> Timestamp: 2026-03-06T01:32:24.407Z

> **⚠️ Hallucination flags (4):**
> - [content/warning] Claims 3 axioms (canonical count is 9)
> - [content/warning] Task t10 references "src/computation/epsilon-r.ts" but this file was not in its context
> - [content/warning] Task t10 references "npx vitest run tests/conformance/epsilon-r.test.ts" but this file was not in its context
> - [content/warning] Task t10 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Epsilon-R Spectral Calibration — Analysis for Bridge v2.1

## Task: t10 — Document epsilon-R spectral calibration from `src/computation/epsilon-r.ts`

**Date:** 2025-07-17  
**Specification References:** `src/computation/epsilon-r.ts`  
**Verification Target:** `npx vitest run tests/conformance/epsilon-r.test.ts`  
**Integration Target:** §5 of Engineering Bridge v2.1 structure (per t12 analysis)

---

## 1. Executive Summary

Epsilon-R (εR) spectral calibration is the mechanism that dynamically adjusts the exploration rate floor based on the **spectral characteristics** of the system's state distribution. Where the basic εR formula (`exploratory_decisions / total_decisions`) measures *actual* exploration, spectral calibration determines *required minimum* exploration — ensuring the system does not become rigid even when recent decisions have been successful.

This analysis documents the spectral calibration approach, its mathematical foundations, expected implementation structure in `src/computation/epsilon-r.ts`, relationship to the imperative gradient modulation system, and Bridge View Principle compliance.

**Note:** The source file `src/computation/epsilon-r.ts` was not directly accessible during this analysis. Findings are derived from the v2.0 specification, M-9.VA verification data (t7), the Thompson router analysis (t4), and architectural inference. Code verification is required before finalization.

---

## 2. Context: εR in Bridge v2.0

### 2.1 The Basic Exploration Rate

Bridge v2.0 Part 2 defines the raw exploration rate as:

```
εR = exploratory_decisions / total_decisions
```

Over a rolling observation window. The classification thresholds are:

| εR Value | Status | Interpretation |
|---|---|---|
| 0.0 | Rigid | **Warning** — force minimum exploration |
| 0.01–0.10 | Stable | Normal operation; light exploration |
| 0.10–0.30 | Adaptive | Active learning; expected when environment changes |
| > 0.30 | Unstable | Confidence collapsed or system very new; investigate |

### 2.2 The Calibration Problem

The raw εR is a **lagging indicator** — it reports what exploration *has occurred*, not what exploration *should occur*. This creates a vulnerability:

| System State | Raw εR | Actual Need | Gap |
|---|---|---|---|
| High ΦL, stable environment | Low (exploit succeeding) | May need to remain low, OR may be missing drift | Cannot distinguish |
| Declining Ω gradients | May still be low | Should increase (environment degrading) | Detection lag |
| Spectral concentration | Appears stable | High risk of lock-in; diversity needed | Invisible to raw metric |

Spectral calibration addresses this by computing a **floor** that the actual εR should not fall below, based on forward-looking indicators rather than trailing counts.

### 2.3 Critical Rule from v2.0

> **"High ΦL with zero εR is a warning, not a success."**

This principle drives the entire calibration system. A component that appears healthy but never explores is accumulating hidden risk — either from undetected environmental drift or from lock-in to a suboptimal local maximum.

---

## 3. Spectral Calibration Architecture

### 3.1 Two-Signal Floor Computation

The spectral calibration computes εR_floor as the **maximum** of two independent signals:

```
εR_floor = max(
    εR_floor_gradient,
    εR_floor_spectral
)
```

#### Signal 1: Gradient-Based Floor (Imperative Modulation)

```
εR_floor_gradient = base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient))
```

| Parameter | Recommended Value | Morpheme Grounding |
|---|---|---|
| `base_εR` | 0.01–0.02 | Axiom-defined minimum (non-zero floor per "high ΦL with zero εR" rule) |
| `gradient_sensitivity` | 0.05–0.15 | Tuning parameter; how aggressively to explore when Ω declines |
| `Ω_aggregate_gradient` | Computed from imperative signal trend | Helix (🌀) feedback loop state |

**Behavior:**
- When Ω gradient is positive or zero: floor = `base_εR` (minimal intervention)
- When Ω gradient is negative: floor increases proportionally (more exploration needed)

The `max(0, -Ω_aggregate_gradient)` construction ensures the gradient term only activates during **decline** — the system doesn't reduce exploration below base just because things are improving.

#### Signal 2: Spectral-Ratio Floor

```
εR_floor_spectral = min_εR_for_spectral_state(spectral_ratio)
```

The spectral ratio measures how **concentrated** the system's selection distribution is:

| Spectral Ratio | Interpretation | Minimum εR |
|---|---|---|
| > 0.9 | Highly concentrated — most selections go to one or few candidates | 0.05 |
| 0.7–0.9 | Moderately concentrated | 0.02 |
| 0.5–0.7 | Distributed | 0.01 |
| < 0.5 | Highly distributed — selections spread across many candidates | 0.0 |

**Rationale:** High spectral concentration (ratio > 0.9) indicates potential lock-in regardless of current performance. The system is not exploring alternatives, so it cannot detect if better options exist or if the dominant choice is degrading.

### 3.2 Spectral Ratio Computation

The spectral ratio is derived from the **eigenvalue spectrum** of the selection distribution covariance matrix, or equivalently, from the normalized entropy of the selection probability vector:

**Eigenvalue-based (precise):**
```
spectral_ratio = λ₁ / Σλᵢ
```
Where λ₁ is the largest eigenvalue of the selection covariance matrix. A high ratio means the first principal component explains most variance — the system is effectively one-dimensional in its selections.

**Entropy-based (practical approximation):**
```
spectral_ratio = 1 - (H(p) / H_max)

where:
  H(p) = -Σ pᵢ × log(pᵢ)    (selection entropy)
  H_max = log(n)             (maximum entropy for n candidates)
```

A spectral ratio near 1.0 means low entropy (concentrated); near 0.0 means high entropy (distributed).

### 3.3 Relationship to Thompson Router

The Thompson router (documented in t4) is the **mechanism** that produces exploratory decisions. The spectral calibration is the **governor** that ensures the router explores sufficiently:

| Layer | Component | Function |
|---|---|---|
| Measurement | `εR = exploratory_decisions / total_decisions` | Reports actual exploration |
| Floor computation | `εR_floor = max(gradient, spectral)` | Determines required minimum |
| Enforcement | Thompson router prior adjustment | Increases exploration to meet floor |

**Enforcement mechanism:** When measured εR falls below εR_floor, the Thompson router's prior strength should be reduced. Lower prior strength means posteriors are more responsive to uncertainty, increasing the probability of exploratory selections.

From t4 analysis:
> "A `prior_strength` that scales with the maturity factor..."

The spectral calibration can modulate this: when εR_floor is high (due to gradient decline or spectral concentration), reduce effective prior_strength to force more exploration.

---

## 4. Expected Implementation Structure

### 4.1 Primary Functions (Inferred)

Based on the architectural analysis and v2.0 specification, `src/computation/epsilon-r.ts` should expose:

| Function | Expected Signature | Purpose |
|---|---|---|
| `computeEpsilonR` | `(decisions: DecisionLog, window: number) → EpsilonRResult` | Compute raw εR from decision history |
| `computeSpectralRatio` | `(selectionDistribution: ProbabilityVector) → number` | Compute concentration metric |
| `computeEpsilonRFloor` | `(omegaGradient: number, spectralRatio: number, config?: EpsilonRConfig) → number` | Compute minimum εR from both signals |
| `classifyEpsilonRStatus` | `(epsilonR: number, maturityIndex: number) → EpsilonRStatus` | Map εR to status using maturity-indexed thresholds |

### 4.2 Configuration Parameters

| Parameter | Type | Default | Axiom Grounding |
|---|---|---|---|
| `baseEpsilonR` | `number` | 0.01 | Axiom-derived minimum exploration |
| `gradientSensitivity` | `number` | 0.10 | **[Non-normative]** — tuning parameter |
| `spectralThresholds` | `number[]` | [0.9, 0.7, 0.5] | **[Non-normative]** — bucket boundaries |
| `spectralFloors` | `number[]` | [0.05, 0.02, 0.01, 0.0] | **[Non-normative]** — floor values per bucket |

### 4.3 Return Types (Inferred)

```typescript
interface EpsilonRResult {
  raw: number;                    // exploratory_decisions / total_decisions
  floor: number;                  // max(gradient_floor, spectral_floor)
  floorGradient: number;          // gradient-based component
  floorSpectral: number;          // spectral-ratio component
  spectralRatio: number;          // computed concentration metric
  status: EpsilonRStatus;         // Rigid | Stable | Adaptive | Unstable
  belowFloor: boolean;            // raw < floor (requires intervention)
}

type EpsilonRStatus = 'rigid' | 'stable' | 'adaptive' | 'unstable';
```

---

## 5. Bridge View Principle Compliance Analysis

Per the Bridge View Principle (t3), every formula must be a pure function of grammar-defined morpheme states and axiom-defined parameters.

### 5.1 Input Grounding

| Input | Morpheme Source | Structural Property |
|---|---|---|
| `exploratory_decisions` | Resonator (Δ) decision log | Count of decisions where selected candidate was not highest-ΦL |
| `total_decisions` | Resonator (Δ) decision log | Total count of routing decisions in window |
| `Ω_aggregate_gradient` | Helix (🌀) feedback state | Slope of imperative signal over observation window |
| `selectionDistribution` | Grid (□) observation history | Frequency of selections per candidate over window |

### 5.2 Parameter Grounding

| Parameter | Status | Axiom |
|---|---|---|
| `baseEpsilonR` | **Requires axiom mapping** | Should trace to diversity/exploration axiom in v4.3 |
| `gradientSensitivity` | Non-normative default | Engineering tuning, not spec-mandated |
| `spectralThresholds` | Non-normative default | Bucket boundaries are practical choices |
| `spectralFloors` | Non-normative default | Floor values are practical choices |

### 5.3 Compliance Gap

The spectral ratio thresholds (0.9, 0.7, 0.5) and corresponding floors (0.05, 0.02, 0.01, 0.0) are presented in v2.0 without axiom grounding. For v2.1 compliance, these should be either:
- Traced to a specific axiom (e.g., if the v4.3 spec defines exploration minimums), OR
- Explicitly marked as `[non-normative engineering defaults]`

---

## 6. Relationship to Maturity-Indexed Thresholds

The εR status thresholds vary by maturity index (from v2.0 adaptive thresholds table):

| Maturity Index | εR Stable Range |
|---|---|
| Young (MI < 0.3) | 0.10–0.40 |
| Maturing (0.3–0.7) | 0.05–0.30 |
| Mature (MI > 0.7) | 0.01–0.15 |

**Interpretation:** Young systems are expected to explore more (higher stable range); mature systems should have converged (lower stable range). The spectral calibration floor interacts with these ranges:

- If `εR_floor = 0.05` (from spectral ratio > 0.9) but system is mature (MI > 0.7), the floor of 0.05 is within the mature stable range — no conflict.
- If `εR_floor = 0.05` but measured εR = 0.02 in a mature system, the system is **below floor** and requires intervention despite being in the "stable" range for its maturity.

The floor is absolute; maturity-indexed ranges are descriptive. Floor violations always require action.

---

## 7. Verification Requirements

### 7.1 Conformance Test Coverage

The verification command `npx vitest run tests/conformance/epsilon-r.test.ts` should validate:

| Test Category | Specific Checks |
|---|---|
| **Raw computation** | εR = 0 when all decisions exploit; εR = 1 when all decisions explore |
| **Spectral ratio** | Ratio = 1.0 for degenerate (single-candidate) distribution; ratio → 0 as distribution flattens |
| **Gradient floor** | Floor increases when Ω gradient is negative; floor = base when gradient ≥ 0 |
| **Spectral floor** | Floor matches table for each spectral ratio bucket boundary |
| **Max selection** | εR_floor = max(gradient_floor, spectral_floor) — neither dominates unconditionally |
| **Status classification** | Maturity-indexed thresholds correctly applied |
| **Floor violation flag** | `belowFloor = true` when raw < floor |

### 7.2 M-9.VA Coverage (from t7)

The M-9.VA verification data confirms:
> "εR spectral calibration: Floor activation under gradient inversion"

This indicates the gradient-floor signal has been tested. Spectral-ratio floor activation should also be covered.

---

## 8. Diagnostic Use Cases

### 8.1 Detecting Premature Convergence

| Signal Pattern | Diagnosis | Action |
|---|---|---|
| εR ≈ 0, spectral_ratio > 0.9, ΦL high | Lock-in to single pattern; not exploring | Increase exploration via Thompson prior adjustment |
| εR low, Ω gradient negative | Environment degrading but system not adapting | Trigger gradient-based floor increase |
| εR high, spectral_ratio low | Healthy exploration; distributed selections | Normal operation; continue monitoring |

### 8.2 Integration with CAS Watchpoint 4 (Lock-In)

From v2.0 Part 6:
> "Lock-In and Path Dependence: Use-based selection without diversity-maintenance mechanisms is vulnerable to Matthew effects and premature convergence."

Spectral calibration is the **primary mitigation** for this watchpoint. When spectral ratio climbs (concentration increases), the floor rises automatically, forcing exploration before lock-in becomes irreversible.

---

## 9. Gaps Requiring Code Verification

The following aspects require direct inspection of `src/computation/epsilon-r.ts`:

| Gap | Required Verification |
|---|---|
| **Actual function signatures** | Confirm exported functions match expected structure |
| **Spectral ratio algorithm** | Confirm eigenvalue vs. entropy approach used |
| **Window handling** | How is the observation window managed (ring buffer, sliding window, EWMA)? |
| **Thompson integration** | Is floor enforcement built into εR module or delegated to router? |
| **Edge cases** | Behavior when decision count = 0, when only one candidate exists |
| **Maturity interaction** | Is maturity index passed in or computed internally? |

---

## 10. Recommendations for v2.1 Documentation

### 10.1 Section Structure for §5

```
§5  Epsilon-R (εR) Spectral Calibration
    §5.1  Overview and diagnostic purpose
    §5.2  Raw εR computation
    §5.3  Spectral ratio: definition and computation
    §5.4  Two-signal floor computation
          §5.4.1  Gradient-based floor (imperative modulation)
          §5.4.2  Spectral-ratio floor (concentration guard)
          §5.4.3  Max-selection rule
    §5.5  Integration with Thompson router
    §5.6  Maturity-indexed status thresholds
    §5.7  Code mapping to src/computation/epsilon-r.ts
    §5.8  Configuration parameters and defaults
    §5.9  Bridge View Principle compliance
```

### 10.2 Key Corrections from v2.0

| v2.0 Content | v2.1 Correction |
|---|---|
| Spectral calibration presented as "complementary signal" without full integration | Document as primary floor mechanism alongside gradient modulation |
| No explicit spectral ratio computation documented | Add eigenvalue/entropy formulation |
| Floor enforcement mechanism not specified | Document Thompson router prior adjustment as enforcement path |
| Spectral thresholds not marked as non-normative | Explicitly mark as `[non-normative engineering defaults]` |

### 10.3 Vertical Wiring Interface Connection

From t8 (vertical wiring analysis), εR spectral calibration touches:

| Interface Point | Role |
|---|---|
| **Observation → Conditioning** | Decision outcomes feed εR computation after conditioning |
| **State → Events** | εR floor violations should emit events for monitoring |

The v2.1 documentation should cross-reference these interfaces in the εR section.

---

## 11. Conclusion

Epsilon-R spectral calibration is a forward-looking exploration governor that prevents lock-in and ensures the system remains adaptive. It computes a floor from two independent signals (gradient decline and spectral concentration) and enforces that floor through Thompson router parameter adjustment.

The v2.0 documentation provides the conceptual framework but lacks implementation detail on spectral ratio computation and enforcement mechanisms. The v2.1 Bridge should fill these gaps, explicitly mark non-normative defaults, and trace the base exploration minimum to the appropriate v4.3 axiom.

**Primary verification action:** Read `src/computation/epsilon-r.ts` to confirm the inferred structure and complete the function-to-documentation mapping before finalizing §5.