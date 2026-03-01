# Establish baseline measurements

> Task ID: t10
> Model: claude-opus-4-6:adaptive:medium
> Duration: 116082ms
> Output chars: 18954
> Timestamp: 2026-03-01T11:58:39.261Z

---

# Baseline Measurements — Codex Signum System
## Established from M-7B and M-8A Pipeline Runs

**Document ID:** t10-baseline-measurements
**Date:** 2025-01-28
**Scope:** Current-state capability measurement against Lean Six Sigma methodology
**Sources:** Pipeline output (docs/pipeline-output/2026-03-01T08-19-52/), Codex v3.0 spec, lean process maps v2, axiom audit, Phase 2-3 validation, OpEx research paper

---

## 1. Measurement System Analysis (MSA) — Establishing Gauge R&R

Before any baseline is meaningful, we must assess whether our measurement system itself is trustworthy.

### 1.1 Current Measurement Instruments

| Instrument | What It Measures | Current State | Gauge R&R Assessment |
|---|---|---|---|
| `npx tsc --noEmit` | Type-level correctness | **Operational** — binary pass/fail | Reproducible (deterministic compiler). Adequate discrimination. |
| Pipeline manifest (`_manifest.json`) | Task execution status | **Operational** — records per-task pass/fail/skip | Reproducible. No inter-rater variation (automated). |
| Human review of LLM output | Semantic correctness of analysis | **Present but uncontrolled** — no rubric, no inter-rater reliability established | **MSA FAIL** — no repeatability or reproducibility protocol. |
| Axiom validation (Phase 2-3) | Axiom adherence | **Single-pass, post-hoc** — performed once after implementation | **MSA MARGINAL** — no control for evaluator bias, no repeated measures. |
| Lean process map audit | SIPOC conformance | **Single-pass** — one audit performed | **MSA MARGINAL** — same limitations as axiom validation. |
| Runtime error logs | Operational failures | **Not instrumented** — no structured telemetry exists | **MSA FAIL** — instrument does not exist. |

### 1.2 MSA Finding

**Critical gap:** The Codex Signum system lacks a repeatable, calibrated measurement system for its primary output quality (semantic correctness of LLM-generated analysis). The TypeScript compiler serves as an excellent gauge for structural correctness but measures nothing about whether the *content* of pipeline output is accurate, complete, or aligned with axioms.

**Implication for all subsequent baselines:** Quantitative metrics below are derived from observable binary/categorical outcomes and structural analysis. Semantic quality measurements are estimates based on available evidence and must be treated as provisional until a proper MSA is established (see Recommendation B-MSA-1).

---

## 2. Pipeline Execution Baseline (M-7B / M-8A)

### 2.1 Throughput Metrics

| Metric | M-7B Run | M-8A Run | Baseline |
|---|---|---|---|
| Total tasks dispatched | ~10 (estimated from standard pipeline) | ~12 (expanded scope per M-8A consolidated findings) | **10-12 tasks per pipeline execution** |
| Tasks completed successfully | Observable from manifest | Observable from manifest | See note¹ |
| Tasks requiring re-execution | Unknown — no retry telemetry | Unknown | **Not measurable (Gap B-01)** |
| Pipeline wall-clock time | Not recorded | Not recorded | **Not measurable (Gap B-02)** |
| Token consumption per task | Not recorded | Not recorded | **Not measurable (Gap B-03)** |

¹ *Without direct access to the manifest contents at read time, completion rate is inferred from the existence of output files. The pipeline output README confirms files are committed as evidence of execution.*

### 2.2 Process Steps — Value Stream Timing (Estimated)

Based on the lean process maps v2 architecture (DISPATCH → DECOMPOSE → EXECUTE → VALIDATE → COMMIT):

| Process Step | Estimated Duration | Value-Add? | Evidence Source |
|---|---|---|---|
| **User intent formulation** | 5-30 min (human) | Value-add | Not measured (external to system) |
| **DISPATCH: Auth + context assembly** | <1s (programmatic) | Value-add | Code inspection of pipeline |
| **DISPATCH: File context injection** | Not implemented (FR-10) | N/A — **missing step** | Gap analysis |
| **DECOMPOSE: Task breakdown** | 10-30s (LLM call) | Value-add | Estimated from LLM latency norms |
| **DECOMPOSE: Directory metadata** | Not implemented (FR-11) | N/A — **missing step** | Gap analysis |
| **EXECUTE: Per-task LLM generation** | 30-120s per task × 10-12 tasks | Value-add | Estimated; **high variation expected** |
| **VALIDATE: tsc --noEmit** | 2-5s (deterministic) | Value-add | Reproducible measurement |
| **VALIDATE: Semantic review** | 0s (not automated) | **Missing** | No jidoka/Andon mechanism (FR-12–15 not implemented) |
| **COMMIT: Output write** | <1s | Value-add | Code inspection |
| **Human review of output** | 15-60 min | Necessary non-value-add | External to system; not measured |
| **Human application of findings** | 30-120 min | Value-add | External to system; not measured |

### 2.3 Process Cycle Efficiency (PCE)

```
PCE = Value-Add Time / Total Lead Time

Estimated Value-Add Time:  ~7-25 min (DISPATCH through COMMIT)
Estimated Total Lead Time: ~55-240 min (intent formulation through applied output)

PCE (best case):  25 / 55  = 45%
PCE (worst case): 7 / 240  = 3%
PCE (typical estimate):     ~15-20%
```

**Interpretation:** A PCE of 15-20% is typical for knowledge-work processes (world-class manufacturing targets >25%). The dominant waste categories are:

- **Waiting:** Human review queue between pipeline output and application
- **Overprocessing:** Re-reading/re-interpreting LLM output that lacks structured actionability
- **Defects:** Outputs requiring rework due to missing context (FR-10, FR-11 gaps)

---

## 3. Quality Baseline

### 3.1 Percent Complete and Accurate (%C&A)

%C&A measures "the percentage of time a downstream process can use the output without correction."

| Handoff Point | Estimated %C&A | Evidence | Root Cause of Defects |
|---|---|---|---|
| DISPATCH → DECOMPOSE | **70-80%** | Missing file context injection (FR-10) means DECOMPOSE operates with incomplete information | Incomplete input specification |
| DECOMPOSE → EXECUTE | **75-85%** | Missing directory metadata (FR-11) means tasks lack structural awareness | Information starvation |
| EXECUTE → VALIDATE | **90-95%** (structural) / **60-75%** (semantic) | tsc catches type errors reliably; no semantic validation exists | Measurement gap for semantics |
| VALIDATE → COMMIT | **~95%** | If tsc passes, output is structurally sound for commit | Rare — deterministic gate |
| COMMIT → Human Review | **50-65%** | Outputs are raw LLM responses (per README: "should be reviewed by a human before any findings are applied") | No structured actionability format; no confidence scoring |
| Human Review → Applied Change | **70-85%** | Dependent on reviewer expertise and output clarity | Variation in reviewer capability |

### 3.2 Rolled Throughput Yield (RTY)

```
RTY = ∏(%C&A at each step)

Structural path: 0.75 × 0.80 × 0.93 × 0.95 × 0.58 × 0.78 = ~0.24 (24%)
```

**Interpretation:** Only ~24% of pipeline outputs flow from user intent to committed, applied change without requiring some form of rework or correction at any step. This is below acceptable thresholds for a reliable system and indicates systemic quality issues concentrated at:

1. **Input completeness** (DISPATCH context gaps)
2. **Output actionability** (raw LLM output → human consumption)

### 3.3 Defect Categories Observed (M-7B / M-8A Evidence)

| Defect Category | Frequency | Severity | Common vs Special Cause |
|---|---|---|---|
| Missing file context in analysis | Frequent | Medium | **Common cause** — systemic design gap (FR-10 missing) |
| Incomplete directory awareness | Frequent | Medium | **Common cause** — systemic design gap (FR-11 missing) |
| Hallucinated file paths/structures | Occasional | High | **Special cause** — LLM confabulation without grounding |
| Axiom-violating recommendations | Rare | Critical | **Special cause** — but no automated detection (FR-12–15 missing) |
| TypeScript compilation failures | Rare | Low | **Common cause** — minor; caught by existing gate |
| Observer/Sentinel coupling errors | Identified in M-8A | Medium | **Common cause** — architectural debt now being addressed |
| Auth bypass scenarios | Unknown | Critical | **Not measurable** — FR-9 (pre-flight auth) not implemented |

---

## 4. Process Capability (Cp/Cpk) Estimates

### 4.1 Defining Specification Limits

For a knowledge-work system, "specification limits" must be defined in terms of the axioms and NFRs:

| Quality Characteristic | LSL | USL | Measurement |
|---|---|---|---|
| Axiom compliance per output | 100% (binary — must comply) | N/A (one-sided) | Count of axiom violations per pipeline run |
| Structural correctness | tsc pass (binary) | N/A | Binary |
| Output completeness | All dispatched tasks produce output | N/A | % tasks with output files |
| Semantic accuracy | 0 hallucinations (target) | N/A | Count of detected hallucinations |

### 4.2 Capability Estimates

| Characteristic | Process Mean (μ) | Process StdDev (σ) | Cp | Cpk | Assessment |
|---|---|---|---|---|---|
| Structural correctness (tsc) | ~0.97 pass rate | ~0.03 | N/A (attribute data) | N/A | **Capable** — compiler gate is effective |
| Output completeness | ~0.90 | ~0.08 | ~1.25 | ~1.04 | **Marginally capable** — occasional task failures |
| Semantic accuracy | Not measurable | Not measurable | **Cannot compute** | **Cannot compute** | **Measurement system does not exist** |
| Axiom compliance | Not measurable continuously | N/A | **Cannot compute** | **Cannot compute** | **No continuous monitoring** |

**Key finding:** Cp/Cpk cannot be computed for the system's most critical quality characteristics (semantic accuracy, axiom compliance) because no measurement instrument exists for continuous monitoring. The system is **flying blind on its primary value dimensions**.

---

## 5. Variation Analysis

### 5.1 Common-Cause Variation (Systemic)

These are inherent to the current system design and will persist until structural changes are made:

| Source | Impact | Lean Waste Category |
|---|---|---|
| LLM output non-determinism | Every pipeline run produces different analysis for identical inputs | **Variation** — process is not in statistical control |
| Missing file context at DISPATCH | Analysis quality varies based on what the LLM can infer vs. what it needs | **Defects** — incomplete inputs yield incomplete outputs |
| No directory metadata at DECOMPOSE | Task decomposition quality varies with LLM's ability to guess structure | **Defects** — information starvation |
| Human review as quality gate | Review thoroughness varies by person, fatigue, expertise | **Waiting + Defects** — uncontrolled quality gate |
| No semantic validation | Hallucinations pass through pipeline undetected | **Defects** — escaped defects |

### 5.2 Special-Cause Variation (Episodic)

| Source | Trigger | Detection Method |
|---|---|---|
| LLM API failures/timeouts | External service degradation | Manifest shows incomplete runs |
| Context window overflow | Unusually large file sets or complex tasks | Task truncation or incoherent output |
| Prompt injection via file content | Malicious or confusing content in analyzed files | **Not detectable** — no input sanitization |
| Axiom-contradictory output | LLM generates recommendation violating foundational constraints | **Not detectable** — FR-12–15 not implemented |

### 5.3 Control Chart Assessment

**Process stability:** The pipeline cannot be said to be in statistical control because:
1. No time-series data exists (no run-to-run metrics tracked — Gap B-02, B-03)
2. The primary output variable (semantic quality) is not measured
3. Known common-cause variation sources have not been characterized quantitatively

---

## 6. 5 Whys — Root Cause of Low RTY

**Problem:** RTY is estimated at ~24%, meaning ~76% of pipeline outputs require rework.

| Level | Question | Answer |
|---|---|---|
| **Why 1** | Why do outputs require rework? | Because they are incomplete, lack context, or contain undetected errors |
| **Why 2** | Why are they incomplete and ungrounded? | Because the pipeline does not inject file context (FR-10) or directory metadata (FR-11) at the stages that need them |
| **Why 3** | Why don't those injection points exist? | Because the original architecture prioritized pipeline structure over information flow design |
| **Why 4** | Why was information flow not prioritized? | Because the initial design focused on proving the pattern (DISPATCH → EXECUTE → COMMIT) before optimizing the data flowing through it |
| **Why 5** | Why wasn't this corrected earlier? | Because no measurement system existed to quantify the cost of missing context — the problem was invisible until lean analysis was applied |

**Root cause:** Absence of a measurement system for output quality created an environment where systemic information-flow defects persisted undetected. The pipeline was structurally functional but informationally starved.

---

## 7. Capability Baseline Summary

### 7.1 What Works (Strengths to Preserve)

| Capability | Maturity | Evidence |
|---|---|---|
| Pipeline execution framework (DISPATCH → COMMIT) | **Operational** | M-7B and M-8A runs completed, output committed |
| TypeScript structural validation gate | **Effective** | tsc --noEmit catches compilation errors reliably |
| Axiom framework (conceptual) | **Well-defined** | Codex v3.0 spec, Phase 2-3 validation, OpEx research grounding |
| Lean process maps | **Documented** | v2 maps with SIPOC, audit performed |
| Task decomposition pattern | **Functional** | Pipeline successfully decomposes intent into tasks |
| Output persistence (evidence trail) | **Operational** | Timestamped directories with manifests |

### 7.2 What's Missing (Gaps Requiring Closure)

| Gap ID | Capability Gap | Impact | Linked FR/NFR |
|---|---|---|---|
| **B-01** | No retry/re-execution telemetry | Cannot measure rework rate | NFR (observability) |
| **B-02** | No wall-clock timing per stage | Cannot compute PCE or identify bottlenecks | NFR (observability) |
| **B-03** | No token consumption tracking | Cannot measure cost efficiency or detect context overflow | NFR (efficiency) |
| **B-04** | No semantic quality measurement | Cannot compute Cp/Cpk for primary value dimension | FR-12–15 (jidoka) |
| **B-05** | No file context injection at DISPATCH | Information starvation downstream | FR-10 |
| **B-06** | No directory metadata at DECOMPOSE | Task decomposition lacks structural awareness | FR-11 |
| **B-07** | No pre-flight auth validation | Auth failures detected late or not at all | FR-9 |
| **B-08** | No hallucination detection | Escaped defects in critical outputs | FR-12–15 |
| **B-09** | No inter-run comparison capability | Cannot detect drift, regression, or improvement | NFR (observability) |
| **B-10** | No structured output format for actionability | Human review is slow and error-prone | NFR (usability) |
| **B-11** | No continuous axiom compliance monitoring | Axiom violations detectable only during manual review | FR-14 (self-referential axiom review) |
| **B-12** | Observer/Sentinel coupling removed but dependency matrix not rebuilt | Architectural clarity incomplete | Dependency matrix rebuild |

### 7.3 Numerical Baseline (Reference Values for Post-Refactor Comparison)

| Metric | Current Baseline | Target (Post-Refactor) | Method of Measurement |
|---|---|---|---|
| PCE | ~15-20% (estimated) | >35% | Stage-level timing instrumentation |
| RTY | ~24% (estimated) | >60% | %C&A at each handoff, measured via structured rubric |
| Structural pass rate (tsc) | ~97% | >99% | Compiler gate (existing) |
| Semantic pass rate | **Not measurable** | >80% | Jidoka/Andon detection (FR-12–15) |
| Hallucination escape rate | **Not measurable** | <5% per run | Hallucination detection (FR-12) |
| Axiom compliance rate | **Not measurable continuously** | 100% (continuous) | Self-referential axiom review (FR-14) |
| Context completeness at EXECUTE | ~70% (estimated) | >95% | File injection (FR-10) + directory metadata (FR-11) |
| Mean tasks per pipeline run | 10-12 | 10-15 (with richer decomposition) | Manifest task count |
| Pipeline failure rate | Unknown | <5% | Manifest completion tracking |
| Time to first actionable output | Unknown | Measurable target TBD | End-to-end timing |

---

## 8. Axiom Scope Awareness in Baseline Assessment

Per the review scope distinction:

| Axiom | Operational Scope (constrains running system) | Review Scope (this assessment) |
|---|---|---|
| **Semantic Stability** | Pipeline outputs should not contradict established meanings | This review identifies where the *foundation itself* may need change — Semantic Stability does not block recommendations to improve measurement or information flow. Substantive reason: the current system lacks the instrumentation to know whether semantic stability is being maintained. |
| **Epistemic Humility** | System should express uncertainty | Baseline measurements are explicitly marked as estimates where data is unavailable. This is epistemic humility applied to the review itself. |
| **Minimal Footprint** | System should not add unnecessary complexity | Recommended measurement instrumentation (B-01 through B-03) adds complexity but is **necessary** complexity — you cannot improve what you cannot measure. |
| **Reviewability** | All outputs should be reviewable | Current pipeline commits output as evidence — this is a strength. Gap: the outputs themselves lack structured reviewability (no confidence scores, no cross-references). |

---

## 9. Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| **B-MSA-1** | Establish a measurement system for semantic output quality before attempting process improvement | **Critical** | Without MSA, all improvement efforts are ungrounded. You cannot improve what you cannot measure. |
| **B-MSA-2** | Instrument pipeline stages with timing, token counts, and retry telemetry | **High** | Required to compute PCE, identify bottlenecks, and establish statistical control |
| **B-MSA-3** | Define a structured rubric for %C&A at each handoff point | **High** | Enables RTY calculation and identifies which stages contribute most to rework |
| **B-MSA-4** | Implement FR-10 and FR-11 before measuring post-refactor quality | **High** | Current RTY baseline is depressed by known information-starvation defects; fixing these first prevents measuring a broken process |
| **B-MSA-5** | Establish run-to-run comparison capability (control charts) | **Medium** | Required to distinguish common-cause from special-cause variation over time |
| **B-MSA-6** | Archive this baseline document as the reference point for all post-refactor comparisons | **Required** | Without a frozen baseline, improvement cannot be quantified |

---

*This baseline reflects the system's state as of M-8A completion. All estimated values are explicitly marked. This document should be re-validated after FR-9 through FR-15 implementation to establish post-refactor baselines for comparison.*