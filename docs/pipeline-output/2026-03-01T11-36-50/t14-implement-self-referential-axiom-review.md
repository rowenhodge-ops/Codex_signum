# Implement self-referential axiom review

> Task ID: t14
> Model: claude-opus-4-6:adaptive:low
> Duration: 127884ms
> Output chars: 21187
> Timestamp: 2026-03-01T12:06:21.887Z

---

# Self-Referential Axiom Review — Analysis & Design (t14)

## 1. Executive Summary

The Codex Signum constitutional engine (`src/constitutional/engine.ts`) currently evaluates axiom compliance in a **unidirectional, outward-facing** manner: it checks whether *pipeline actions* comply with the 10 axioms. It has no capability to evaluate whether *its own enforcement logic* faithfully represents the axioms it claims to enforce. This is the self-referential gap. Implementing FR-14 requires a meta-evaluation layer where the axiom engine becomes both subject and instrument of review — with explicit safeguards against circularity, tautology, and Semantic Stability misapplication.

---

## 2. Current State Assessment

### 2.1 What `evaluateAxioms()` Actually Does vs. What It Claims

| Axiom | Claimed Check | Actual Implementation | Self-Referential? |
|-------|---------------|----------------------|-------------------|
| A1 (Symbiosis) | Collaboration between intelligences | `return true` — hardcoded structural invariant | ❌ Never validated |
| A2 (Transparency) | Signal interpretability | Checks `phiL` has `factors`, `weights`, `effective` fields | ❌ Structural shape only |
| A3 (Fidelity) | Representation matches state | Checks `phiL.effective ∈ [0,1]` | ❌ Range check, not fidelity |
| A4 (Visible State) | Health/activity/connection expressed | Checks three state dimensions are non-undefined | ❌ Existence check only |
| A5 (Minimal Authority) | Request only needed resources | `return true` — "enforced at pattern level" | ❌ Deferred, never verified |
| A6 (Provenance) | Origin signature carried | Checks `provenanceClarity > 0` | ❌ Threshold only |
| A7 (Reversibility) | Transformations reversible | `return true` — structural invariant | ❌ Never validated |
| A8 (Semantic Stability) | Morpheme meanings fixed | `return true` — "types enforce this" | ❌ Circular claim |
| A9 (Comprehension Primacy) | Understanding over efficiency | Checks memory flow validity | ⚠️ Partial — validates flow syntax, not comprehension |
| A10 (Adaptive Pressure) | Evolution through feedback | Checks `εR.value > 0` | ❌ Existence check only |

**Finding F-1**: Four axioms (A1, A5, A7, A8) return hardcoded `true`. These are not evaluated — they are *assumed*. A self-referential review must be able to flag exactly this class of gap: the engine claims compliance but performs no verification.

**Finding F-2**: The A8 (Semantic Stability) check is particularly problematic. The comment says "types enforce this," but TypeScript types are erased at runtime and cannot enforce semantic invariants. This is a tautological compliance claim.

**Finding F-3**: A3 claims to check "fidelity" (representation matches actual state) but only performs a range check (`effective ∈ [0,1]`). A value of 0.5 always passes regardless of whether 0.5 faithfully represents the system's actual linguistic fidelity. The check validates *format*, not *fidelity*.

### 2.2 Scope Awareness Gap

The current engine conflates two scopes identified in the task intent:

- **Operational scope**: Axioms constrain the running system (e.g., "is this pipeline action compliant?")
- **Review scope**: The review evaluates whether the foundation is correct (e.g., "does our A3 check actually measure fidelity?")

The engine operates exclusively in operational scope. There is no review-scope capability. This means:
- The system cannot detect axiom drift (implementation diverging from spec definition)
- The system cannot detect enforcement gaps (axioms that exist in the spec but are not meaningfully checked)
- The system cannot detect tautological checks (axioms that pass by construction rather than measurement)

### 2.3 `checkRule()` Limitations

The `checkRule()` function maps rule expression targets to context values via a switch statement. Several branches return hardcoded passes:

```
case "hysteresis_ratio": return { passed: true, ... message: "Enforced by dampening module" }
case "quality_threshold": return { passed: true, ... message: "Checked at decision outcome" }
```

These represent **deferred enforcement claims** — assertions that compliance is handled elsewhere without verifying that "elsewhere" actually performs the check. A self-referential review would trace these claims to their alleged enforcement points and verify the chain is complete.

---

## 3. Gap Analysis for Self-Referential Capability

### 3.1 Structural Gaps

| Gap ID | Description | Severity | Axiom Violated |
|--------|-------------|----------|---------------|
| SR-1 | No meta-evaluation interface — engine cannot inspect its own axiom checks | Critical | A3 (Fidelity), A6 (Provenance) |
| SR-2 | Hardcoded `true` returns create unfalsifiable compliance claims | Critical | A2 (Transparency), A10 (Adaptive Pressure) |
| SR-3 | No axiom-to-spec mapping — engine cannot compare its checks against the authoritative axiom definitions in `codex-signum-v3.0.md` | High | A3 (Fidelity), A8 (Semantic Stability) |
| SR-4 | No enforcement chain tracing — deferred checks cannot be verified end-to-end | High | A4 (Visible State) |
| SR-5 | No distinction between operational and review scope in the evaluation API | Medium | A9 (Comprehension Primacy) |
| SR-6 | `AxiomCompliance` type uses `boolean` — cannot express degree of compliance or confidence | Medium | A2 (Transparency) |
| SR-7 | No temporal dimension — cannot detect axiom drift over time | Medium | A10 (Adaptive Pressure) |
| SR-8 | `computeAxiomComplianceFraction` reduces 10-dimensional compliance to a scalar — information loss prevents self-diagnosis | Low | A2 (Transparency) |

### 3.2 Gaps Discovered During M-7B / M-8A (Context from Task Intent)

| Gap ID | Source | Description |
|--------|--------|-------------|
| SR-M7B-1 | M-7B | Observer/Sentinel removal leaves enforcement chain gaps that the current engine cannot detect |
| SR-M8A-1 | M-8A | Pipeline output lacks graph-node structure, preventing topology-aware self-review per A6 |
| SR-M8A-2 | M-8A | No pre-flight auth validation means the engine may evaluate contexts that should have been rejected upstream (relates to FR-9) |

---

## 4. Lean Six Sigma Analysis of Current Axiom Review

### 4.1 Value Stream: User Intent → Axiom Compliance Determination

| Step | Activity | Value-Add? | Waste Type |
|------|----------|-----------|------------|
| 1 | Construct `ComplianceContext` from pipeline state | VA | — |
| 2 | Call `evaluateAxioms(context)` | VA | — |
| 3 | Check A1 → `return true` | NVA | **Overprocessing** — work that produces no information |
| 4 | Check A2 → shape validation | BVA | **Underprocessing** — checks structure, not semantics |
| 5 | Check A3 → range validation | BVA | **Defect** — claims fidelity, delivers range check |
| 6 | Check A5 → `return true` | NVA | **Overprocessing** |
| 7 | Check A7 → `return true` | NVA | **Overprocessing** |
| 8 | Check A8 → `return true` | NVA | **Overprocessing** + **Defect** (tautological claim) |
| 9 | Aggregate into `AxiomCompliance` | BVA | **Information loss** — boolean flattening |
| 10 | Compute compliance fraction | VA | — |
| 11 | Return `ConstitutionalEvaluation` | VA | — |

**Process Cycle Efficiency (PCE)**:
- Total steps: 11
- Value-added steps: 4
- PCE = 4/11 = **36.4%** — below the Lean benchmark of 50% for knowledge work

**Rolled Throughput Yield (RTY)**:
- Steps with defect risk: A1, A3, A5, A7, A8 (5 of 10 axioms have hardcoded or tautological checks)
- If each hardcoded axiom has a 0% chance of detecting a real violation:
  - Percent-Complete-and-Accurate for those axioms = 0%
  - RTY = 1.0 × 1.0 × 1.0 × 1.0 × 1.0 × 0.0 × ... = **0%** for detecting violations across all axioms
- If scoped to the 5 axioms that actually perform checks: PCA is reasonable (~80-90% for structural checks, lower for semantic fidelity), estimated RTY ≈ 0.85^5 = **44.4%**

**Cp/Cpk Analysis**:
- **Specification limits**: Each axiom either passes or fails (binary). The spec requires *meaningful* evaluation (not hardcoded).
- **Process capability**: 5/10 axioms have Cp = 0 (no measurement variation because the output is constant `true`). You cannot have process capability when there is no measurement.
- For the 5 active axioms, the process is centered (structural checks are deterministic) but narrow — Cpk is high for what they measure, but the measurement itself is a proxy, not the target specification.

**MSA (Measurement System Analysis)**:
- **Repeatability**: Perfect — deterministic code produces identical results.
- **Reproducibility**: Perfect — no human judgment involved.
- **Bias**: **Severe** — 5 axioms always read "compliant" regardless of actual state. This is analogous to a gauge that always reads 0.
- **Linearity**: Not applicable (binary output).
- **Resolution**: Inadequate — boolean output cannot distinguish degrees of compliance.

### 4.2 Variation Analysis

| Variation Type | Source | Impact |
|---------------|--------|--------|
| **Common-cause** | Boolean compliance type forces information into binary | Chronic underreporting of partial compliance |
| **Common-cause** | All deferred enforcement claims assumed valid | Systematic blind spots |
| **Special-cause** | A8 tautological claim (types enforce semantics) | One-time design error with persistent effect |
| **Special-cause** | A3 fidelity check substituted with range check | Specific implementation defect |

### 4.3 Five Whys: Why Can't the System Self-Review?

1. **Why** can't the engine review its own axiom checks?
   → Because it has no meta-evaluation interface that treats its own logic as a subject.

2. **Why** is there no meta-evaluation interface?
   → Because the engine was designed as a one-way constraint solver (operational scope only).

3. **Why** was it designed as one-way only?
   → Because the original architecture assumed axiom checks would be manually reviewed, not machine-validated.

4. **Why** was manual review assumed sufficient?
   → Because at design time, the system was small enough for a human to hold the full axiom-to-implementation mapping in working memory.

5. **Why** is that no longer sufficient?
   → Because the system has grown to 10 axioms × multiple enforcement points × tiered rules, and M-7B/M-8A revealed implementation drift that manual review missed (hardcoded `true` returns, tautological claims).

**Root Cause**: The constitutional engine lacks a **reflexive evaluation capability** — it can evaluate others against axioms but cannot evaluate itself against the same axioms.

---

## 5. Functional Requirements for Self-Referential Axiom Review (FR-14)

### FR-14.1: Axiom Enforcement Introspection

The engine SHALL expose a machine-readable registry of what each axiom check actually evaluates, including:
- The axiom ID and its specification definition (from `codex-signum-v3.0.md`)
- The implementation strategy (structural check, range check, deferred, hardcoded)
- The evidence type produced (measured value, boolean, constant)
- Whether the check is falsifiable (can it ever return `false` under any input?)

**Rationale**: Without introspection, self-review is impossible. The engine must be able to describe its own behavior before it can evaluate it.

### FR-14.2: Tautology Detection

The engine SHALL detect and flag axiom checks that are **unfalsifiable** — checks that return `true` for all possible inputs. Classification:
- `hardcoded`: Literal `return true`
- `tautological`: Check passes by construction (e.g., "types enforce this")
- `deferred`: Compliance claimed but enforcement delegated without verification
- `measured`: Actual runtime measurement performed

**Rationale**: Findings F-1 and F-2 demonstrate that unfalsifiable checks create false compliance signals.

### FR-14.3: Spec-Implementation Alignment Check

The engine SHALL compare each axiom check's actual behavior against the axiom's specification definition and produce an alignment score:
- `aligned`: Check measures what the axiom specifies
- `proxy`: Check measures a related but different property (e.g., A3 checks range, not fidelity)
- `absent`: No meaningful check exists
- `contradictory`: Check behavior contradicts axiom intent

**Rationale**: Finding F-3 demonstrates that a check can exist, pass, and still not evaluate what the axiom requires.

### FR-14.4: Enforcement Chain Verification

The engine SHALL trace deferred enforcement claims to their alleged enforcement points and verify:
- The enforcement point exists in the codebase
- The enforcement point is reachable from the claimed context
- The enforcement point performs a falsifiable check

**Rationale**: `checkRule()` contains multiple deferred claims ("Enforced by dampening module," "Checked at decision outcome") that are never verified.

### FR-14.5: Self-Review Report Generation

The engine SHALL produce a structured `SelfReviewReport` containing:
- Per-axiom introspection results (FR-14.1)
- Tautology findings (FR-14.2)
- Alignment assessment (FR-14.3)
- Enforcement chain status (FR-14.4)
- Overall self-review compliance score (not boolean — use continuous scale)
- Recommended actions with severity and affected axioms

### FR-14.6: Circularity Guard

The self-review process SHALL NOT use the axiom compliance result to validate the axiom compliance mechanism. Specifically:
- Self-review SHALL use an independent evaluation path
- Self-review results SHALL NOT be fed back into `evaluateAxioms()` during the same evaluation cycle
- The self-review function SHALL be callable externally (e.g., by CI, by the lean review process) without requiring a running pipeline

**Rationale**: If the broken engine evaluates itself using its own broken logic, it will conclude it is working. This is the fundamental circularity risk of self-referential systems.

### FR-14.7: Scope-Aware Evaluation

The engine SHALL distinguish between:
- **Operational evaluation**: "Is this pipeline action compliant?" (current capability)
- **Review evaluation**: "Is our compliance checking correct?" (new capability)

Review evaluation SHALL NOT be blocked by A8 (Semantic Stability) when it identifies foundational issues with axiom definitions or enforcement logic. Semantic Stability constrains *operational* morpheme usage; it does not grant immunity from *review* findings. (This implements the scope-awareness requirement from the task intent.)

**Substantive justification**: A8's purpose is to prevent meaning drift during operation. During review, the question is whether meanings were correctly established in the first place. Applying A8 to block review findings would create an unfalsifiable system — which violates A3 (Fidelity) and A10 (Adaptive Pressure).

---

## 6. Non-Functional Requirements for Self-Referential Review

| NFR ID | Requirement | Rationale |
|--------|-------------|-----------|
| NFR-SR-1 | Self-review SHALL complete in < 5 seconds for 10 axioms + all registered rules | Review must be fast enough for CI integration |
| NFR-SR-2 | Self-review SHALL produce deterministic output for identical engine state | Enables regression testing and drift detection |
| NFR-SR-3 | Self-review report SHALL be serializable to JSON | Enables pipeline output as graph nodes (FR-12) |
| NFR-SR-4 | Self-review SHALL not modify engine state | Pure observation — jidoka principle: stop and signal, don't self-modify |
| NFR-SR-5 | Self-review findings SHALL be expressible as `ArchitectureDecisionRecord` entries | Integration with existing ADR infrastructure |
| NFR-SR-6 | Self-review SHALL support incremental execution (review single axiom) | Enables targeted investigation |
| NFR-SR-7 | The self-review mechanism itself SHALL be reviewable by the same mechanism (second-order reflexivity) | Prevents the review layer from becoming a new blind spot |

---

## 7. Architectural Recommendations

### 7.1 Axiom Check Registry Pattern

Introduce a declarative registry where each axiom check declares:

```
AxiomCheckDescriptor {
  axiomId: "A1" .. "A10"
  specReference: string          // section in codex-signum-v3.0.md
  checkStrategy: "measured" | "structural" | "deferred" | "hardcoded"
  falsifiable: boolean
  measurementType: "continuous" | "binary" | "categorical"
  deferredTo?: string            // module path if deferred
  knownLimitations?: string[]
}
```

This registry becomes the input to FR-14.1 and FR-14.2. It is the engine's self-description.

### 7.2 Independent Review Path

The self-review function should:
1. Read the axiom check registry (not execute the checks)
2. Analyze each descriptor for tautology, alignment, and enforcement chain completeness
3. Optionally execute checks with synthetic edge-case contexts to verify falsifiability
4. Produce the `SelfReviewReport`

This path is independent of `evaluateAxioms()` — it inspects the engine's structure rather than invoking its runtime behavior.

### 7.3 Integration with Jidoka/Andon (FR-12)

When self-review detects a critical finding (unfalsifiable mandatory axiom, enforcement chain break), it should emit an Andon signal that:
- Halts pipeline execution if in operational mode (jidoka stop)
- Produces a visible alert if in review mode (Andon cord)
- Records the finding with full provenance (A6 compliance)

### 7.4 Integration with Thompson Learning (FR-13)

Self-review results should feed into the multi-dimensional Thompson learning system as a signal dimension. Axiom checks that self-review identifies as weak should receive lower confidence in the Thompson posterior, reducing their influence on routing decisions until they are strengthened.

---

## 8. Baseline Measurements (from M-7B / M-8A Context)

| Metric | Current Value | Target | Method |
|--------|--------------|--------|--------|
| Axioms with falsifiable checks | 5/10 (50%) | 10/10 (100%) | FR-14.2 |
| Axioms with spec-aligned checks | 3/10 (30%) | 9/10 (90%) | FR-14.3 — A2, A4, A6 are close |
| Deferred enforcement claims verified | 0/3 (0%) | 3/3 (100%) | FR-14.4 |
| Self-review capability | None | Full | FR-14.1–14.7 |
| Axiom review PCE | 36.4% | >60% | Lean value stream |
| RTY (all 10 axioms) | 0% | >80% | Fix hardcoded returns |
| RTY (5 active axioms) | ~44% | >80% | Improve check fidelity |
| MSA Bias | Severe (5 axioms) | None | Eliminate hardcoded `true` |

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Infinite regress**: Self-review of self-review of self-review... | Medium | Low | Cap at second-order reflexivity (NFR-SR-7). The second-order review uses the same registry introspection mechanism, which is finite and deterministic. |
| **False negatives in self-review**: Self-review misses a gap in its own logic | Medium | High | External validation — self-review results should be periodically validated by human review and by pipeline integration tests |
| **Semantic Stability misapplication**: A8 invoked to block findings about A8 itself | High | Critical | FR-14.7 scope separation. Substantive justification documented above. |
| **Performance impact**: Self-review adds latency to pipeline | Low | Medium | NFR-SR-1 time bound + optional execution (not on critical path) |
| **Overengineering**: Self-review becomes more complex than the engine it reviews | Medium | Medium | Keep the registry declarative and the analysis rules simple. Complexity should be in the axiom checks themselves, not in the meta-layer. |

---

## 10. Recommended Implementation Sequence

1. **Define `AxiomCheckDescriptor` type and registry** — pure data, no logic changes
2. **Annotate existing axiom checks** with descriptors (honest classification: mark hardcoded as hardcoded)
3. **Implement tautology detector** — scan registry for `hardcoded`, `falsifiable: false`
4. **Implement falsifiability prover** — generate synthetic contexts that should fail each axiom; verify the check actually returns `false`
5. **Implement spec-alignment scorer** — compare check descriptor against axiom definition
6. **Implement enforcement chain tracer** — for deferred checks, verify target module exists and contains a falsifiable check
7. **Implement `SelfReviewReport` generation** — aggregate all findings
8. **Add scope-aware evaluation mode** — `evaluateAxioms(context, { scope: 'operational' | 'review' })`
9. **Integrate with test suite** — `npm test` runs self-review and fails on critical findings
10. **Integrate with Andon** — critical self-review findings emit halt signals

---

## 11. Conclusion

The current constitutional engine contains a fundamental blind spot: it cannot distinguish between "we checked and it passed" and "we didn't actually check." Five of ten axioms fall into the latter category. Self-referential axiom review (FR-14) closes this gap by giving the engine the ability to describe, inspect, and critique its own enforcement logic — with explicit safeguards against circularity and scope confusion.

The Lean analysis reveals a system with high repeatability but severe measurement bias — the gauge always reads "compliant" for half the axioms. No amount of operational axiom evaluation can compensate for this; only a review-scope meta-evaluation can surface and correct these foundational gaps.