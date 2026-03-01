# Implement jidoka/Andon-cord detection

> Task ID: t15
> Model: claude-opus-4-6:adaptive:max
> Duration: 145094ms
> Output chars: 22432
> Timestamp: 2026-03-01T12:08:48.831Z

---

# Jidoka/Andon-Cord Hallucination Detection — Analysis & Design (t15)

## 1. Executive Summary

This analysis defines the hallucination detection mechanism (FR-15) for Codex Signum, mapping Toyota Production System jidoka principles to an automated quality gate that detects fabricated, inconsistent, or unfounded outputs. The mechanism must function as an Andon cord — halting the pipeline and escalating when output integrity cannot be verified — rather than silently passing suspect content downstream.

---

## 2. Problem Statement

### 2.1 What Constitutes "Hallucination" in Codex Signum

In the Codex Signum context, hallucination manifests across three distinct layers:

| Layer | Hallucination Type | Example |
|-------|-------------------|---------|
| **Signal Layer** | Phantom alerts from pipeline stages producing statistically unfounded detections | CUSUM alarm triggered by numeric drift in floating-point accumulation rather than genuine process shift |
| **Content Layer** | AI-generated outputs containing fabricated references, invented file paths, or claims unsupported by context | Citing a function that doesn't exist in the codebase, referencing a non-existent axiom |
| **Structural Layer** | Pipeline producing outputs that violate internal consistency invariants | Smoothed value outside the theoretical bounds of the input domain; trend projection contradicting CUSUM direction |

### 2.2 Current State — No Detection Exists

The current `SignalPipeline.process()` method (lines 68–146) passes all computed values through to the `ConditionedSignal` output without any cross-stage consistency validation. Specifically:

- **No output bounds checking**: `smoothedValue` is never validated against domain constraints (e.g., health metrics should be in [0, 1])
- **No cross-stage coherence check**: CUSUM can alarm "upper shift" while trend projects downward — these contradictions propagate unchecked
- **No input provenance validation**: The pipeline accepts any `SignalEvent` without verifying the `agentId` or `dimension` are registered entities
- **No output confidence scoring**: Consumers receive alerts with no indication of detection confidence or evidence strength

### 2.3 Evidence from M-7B and M-8A Runs

Based on the consolidated findings path referenced (`docs/pipeline-output/2026-03-01T08-19-52/`):

- **Gap G-NEW-1**: Pipeline outputs lack self-verification, meaning downstream consumers (graph nodes per FR-12, Thompson learners per FR-13) would ingest unvalidated signals
- **Gap G-NEW-2**: The axiom review process (FR-14) cannot evaluate its own outputs for hallucination — creating a self-referential blind spot
- **Gap G-NEW-3**: No mechanism exists to distinguish common-cause variation (noise inherent in the measurement system) from special-cause variation (genuine process shift) at the _output_ layer — the Nelson Rules and CUSUM detect shifts in _input_ signals but nobody watches the watchmen

---

## 3. Lean/Jidoka Mapping

### 3.1 Toyota Production System Principles Applied

| TPS Concept | Codex Signum Mapping |
|------------|---------------------|
| **Jidoka (autonomation)** | Each pipeline stage must self-inspect its output before passing downstream. If output violates invariants, the stage halts and raises an Andon signal. |
| **Andon cord** | A `HallucinationAndon` event type that stops pipeline processing, tags the output as `quarantined`, and emits a structured escalation with evidence. |
| **Poka-yoke (mistake-proofing)** | Input validation contracts that make it structurally impossible to feed malformed events into the pipeline. |
| **Go/No-Go gauge** | Binary pass/fail checks at each stage boundary — analogous to the hysteresis gate but for _internal consistency_ rather than signal level. |
| **5 Whys for root cause** | Structured evidence chain in every Andon event: what was detected → what invariant was violated → what upstream condition caused it → what input contributed → what systemic factor enabled it. |

### 3.2 Value Stream Position

In the value stream from user intent to committed output:

```
User Intent → DISPATCH → DECOMPOSE → [Pipeline Processing] → [Hallucination Gate] → Graph Node Output → Commit
                                                    ↑
                                            FR-15 inserts HERE
```

The hallucination gate sits between pipeline processing completion and output consumption. This is the **last responsible moment** — catching defects before they contaminate downstream graph nodes (FR-12) or Thompson learning state (FR-13).

### 3.3 Lean Six Sigma Metrics

| Metric | Application to Hallucination Detection |
|--------|---------------------------------------|
| **Cp/Cpk** | Process capability of detection accuracy. Cp measures whether the detection mechanism's precision fits within acceptable false-positive/false-negative bounds. Cpk measures centering — whether we're biased toward over-detection or under-detection. Target: Cpk ≥ 1.33 (4σ equivalent). |
| **%C&A (Percent Complete and Accurate)** | Of all outputs passing the hallucination gate, what percentage are truly complete and accurate? This is the primary quality metric. |
| **RTY (Rolled Throughput Yield)** | Product of %C&A across all pipeline stages. Current RTY is unknown (baseline needed). Each hallucination check point is a yield gate. |
| **PCE (Process Cycle Efficiency)** | Value-added time / total lead time. Hallucination checks add processing time — must quantify and minimize. Target: <5% overhead on pipeline latency. |
| **Common-cause vs Special-cause** | The detection system must classify its own findings: Is this a systematic detection pattern (common-cause → fix the process) or an isolated anomaly (special-cause → investigate the instance)? |
| **MSA (Measurement System Analysis)** | Gage R&R for the hallucination detector itself. Can it consistently detect the same hallucination type across repeated trials? Is inter-rater reliability (if multiple checks exist) adequate? |

---

## 4. Functional Requirements for FR-15

### FR-15.1: Cross-Stage Coherence Validation

**Requirement**: After all 7 pipeline stages complete, validate that outputs are mutually consistent.

**Invariants to check**:
1. If `cusumResult.direction === "upper"` (positive shift) and `trendResult.slope < -ε`, flag as `INCOHERENT_DIRECTION` — CUSUM sees upward shift while trend sees downward movement
2. If `smoothedValue` is outside `[0, 1]` for health-metric dimensions, flag as `DOMAIN_VIOLATION`
3. If `alerts` contains both `cusum_shift` (warning) and `hysteresis_alarm` (critical) with opposing directional implications, flag as `CONTRADICTORY_ALERTS`
4. If `macdResult.histogram` magnitude exceeds `3σ` of historical histogram values for this key, flag as `EXTREME_MACD` — potential numeric instability

**Evidence**: Lines 94–103 of `SignalPipeline.ts` show CUSUM direction and lines 118–126 show trend slope are computed independently with no cross-check.

### FR-15.2: Output Bounds Enforcement (Poka-Yoke)

**Requirement**: Every `ConditionedSignal` must pass domain-specific bounds checks before being emitted.

**Checks**:
- `smoothedValue`: Must be within the valid range for the signal's dimension type
- `cusumStatistic`: Must be ≥ 0 (by CUSUM definition)
- `trendProjection`: Must be within physically realizable bounds
- `alerts.length`: Must not exceed a configured maximum (runaway alert generation indicates detector failure)

### FR-15.3: Input Provenance Validation

**Requirement**: `SignalEvent` inputs must reference registered agents and dimensions.

**Current gap**: `process()` at line 68 accepts any `SignalEvent` without verifying that `initializeAgent()` was called for the given `agentId`/`dimension` pair. Lines 73–74 show that `eventCounter` will silently start at 0 for unknown keys, and CUSUM will process with default (zero) baseline — producing meaningless statistics.

**Fix needed**: Reject or quarantine events for uninitialized agents. This is poka-yoke at the input boundary.

### FR-15.4: Andon Event Structure

**Requirement**: When hallucination is detected, emit a structured `AndonEvent`:

```
{
  type: "hallucination_detected",
  severity: "andon",           // New severity level above "critical"
  quarantined: true,           // Output must NOT be consumed
  evidence: {
    check: string,             // Which invariant was violated
    expected: string,          // What the invariant required
    actual: string,            // What was observed
    upstreamCause: string,     // Best-effort root cause attribution
    fiveWhys: string[]         // Structured 5-Whys chain
  },
  originalSignal: ConditionedSignal  // The quarantined output for inspection
}
```

### FR-15.5: Andon Cord — Pipeline Halt Behavior

**Requirement**: When an Andon event fires:
1. The `ConditionedSignal` is tagged `quarantined: true` and must not update downstream state (graph nodes, Thompson learners)
2. A configurable response mode:
   - **STOP**: Halt processing for this agent/dimension key until manual review
   - **DEGRADE**: Continue processing but mark all subsequent outputs as `low_confidence` until coherence is restored
   - **LOG_ONLY**: Emit the Andon event but allow output through (for initial calibration phase only)
3. Counter increments for Andon events per key and globally — enabling MSA and Cp/Cpk calculation

### FR-15.6: Self-Referential Detection (Interaction with FR-14)

**Requirement**: The hallucination detector must be able to evaluate its own outputs for consistency — but this creates a halting-problem risk. Resolution:

- The detector operates on _pipeline outputs_, not on its own outputs
- FR-14 (self-referential axiom review) evaluates whether the _detector's configuration_ remains aligned with axioms
- These are separate concerns: FR-15 checks pipeline health, FR-14 checks detector health
- No infinite regress: FR-14 review is periodic (not per-event), FR-15 detection is per-event

---

## 5. Detection Algorithm Design

### 5.1 Multi-Check Architecture

The hallucination detector should be implemented as a post-processing stage (Stage 8) rather than embedded within existing stages, for separation of concerns:

```
Stage 1-7 (existing) → Stage 8: HallucinationDetector → Output
```

**Rationale**: Embedding checks within stages would violate the Single Responsibility principle of each stage and make it impossible to calculate MSA for the detector independently.

### 5.2 Check Categories

| Check ID | Category | Description | Severity |
|----------|----------|-------------|----------|
| HC-01 | Coherence | CUSUM direction vs Trend slope agreement | warning → andon if persistent |
| HC-02 | Bounds | Smoothed value within domain | andon (immediate) |
| HC-03 | Bounds | CUSUM statistic non-negative | andon (immediate) |
| HC-04 | Bounds | Alert count within configured maximum | warning |
| HC-05 | Provenance | Agent/dimension initialized | andon (immediate) |
| HC-06 | Stability | Smoothed value change rate within `6σ` of historical rate | warning |
| HC-07 | Numeric | NaN/Infinity/subnormal detection in any numeric output field | andon (immediate) |
| HC-08 | Temporal | Timestamp monotonicity — events must not arrive out of order for a given key | warning |

### 5.3 Confidence Scoring

Each output should receive a `confidence` score (0–1) based on the number and severity of checks passed:

- All checks pass: `confidence = 1.0`
- Warnings only: `confidence = 1.0 - (0.1 × warningCount)`
- Any andon: `confidence = 0.0`, output quarantined

This feeds into %C&A calculation: `%C&A = count(confidence === 1.0) / count(total outputs)`.

### 5.4 Numeric Stability — The Silent Hallucination

**Critical finding**: The EWMA, CUSUM, and MACD stages all use floating-point accumulation. Over thousands of events, accumulated rounding error can cause:
- EWMA drift (smoothed value slowly diverging from true mean)
- CUSUM never resetting properly (FIR head-start accumulating error)
- MACD histogram oscillating around a non-zero phantom value

**HC-07 (NaN/Infinity)** catches catastrophic failures, but sub-catastrophic numeric drift is the more insidious hallucination. The detector needs a **numeric hygiene check**: periodically (every N events), compare accumulated state against a fresh recomputation from the last M raw values. Divergence beyond `ε` triggers a warning.

---

## 6. Non-Functional Requirements for FR-15

| NFR | Requirement | Rationale |
|-----|-------------|-----------|
| **NFR-H1: Latency** | Hallucination checks must complete in < 1ms per signal (p99) | PCE impact: at ~10ms pipeline processing time, 1ms adds ~10% overhead. Must be < 5% target, so optimize to < 0.5ms. |
| **NFR-H2: Zero False Negatives on Bounds** | HC-02, HC-03, HC-07 must have 0% false negative rate | These are deterministic checks — no statistical threshold to tune. A NaN is a NaN. |
| **NFR-H3: Configurable Sensitivity** | Coherence checks (HC-01, HC-06) must have tunable thresholds | Different deployments have different noise profiles. Default config must be conservative (fewer false positives). |
| **NFR-H4: Stateless per Event** | The detector must not maintain unbounded state | All historical state needed for checks must be bounded (windowed). Memory: O(window_size × active_keys). |
| **NFR-H5: Testability** | Every check must be independently testable with deterministic inputs | MSA requires repeatable measurements. No randomness in detection logic. |
| **NFR-H6: Observability** | All Andon events must be structured, machine-parseable, and include the full evidence chain | Enables automated Cp/Cpk calculation and SPC charting. |

---

## 7. Axiom Scope Awareness (Per Intent §9)

### 7.1 Operational Scope (Axioms Constrain Running System)

- **Semantic Stability**: Once the hallucination detector is deployed and baselined, its check definitions should not change without a version bump. The invariants (HC-01 through HC-08) become part of the system's semantic contract.
- **Structural Coherence**: The detector must not violate the pipeline's existing data flow — it receives a `ConditionedSignal` and emits an annotated version, not a different type.

### 7.2 Review Scope (This Analysis Evaluates the Foundation)

- **Semantic Stability does NOT block adding FR-15**: The current system has no hallucination detection. Adding it is a _gap closure_, not a semantic change. The absence of quality gates is a deficiency, not a stable feature to preserve.
- **Substantive reason for the recommendation**: Without FR-15, the system has no mechanism to detect when its own outputs are fabricated or inconsistent. This is a first-principles quality gap — Toyota would never ship a production line without jidoka. The Codex axioms require system integrity; silent propagation of invalid outputs violates that requirement.

---

## 8. Gap Analysis Updates (from M-7B and M-8A)

| Gap ID | Description | Severity | FR-15 Addresses? |
|--------|-------------|----------|-------------------|
| **G-15-01** | No cross-stage coherence validation in pipeline | High | Yes — HC-01 |
| **G-15-02** | No output domain bounds enforcement | Critical | Yes — HC-02, HC-03 |
| **G-15-03** | Uninitialized agents silently produce meaningless statistics | Critical | Yes — HC-05 |
| **G-15-04** | No numeric stability monitoring for accumulated floating-point state | High | Yes — HC-07 + periodic hygiene |
| **G-15-05** | No confidence scoring on pipeline outputs | Medium | Yes — confidence field |
| **G-15-06** | No Andon/escalation mechanism for detected anomalies beyond alert array | High | Yes — FR-15.4, FR-15.5 |
| **G-15-07** | Alert severity has only "warning" and "critical" — no "halt" level | Medium | Yes — "andon" severity level |
| **G-15-08** | `eventCounter` uses unbounded Map with no cleanup for deregistered agents | Low | Partially — HC-05 validates registration but doesn't address cleanup |

---

## 9. Dependency Matrix (Without Observer or Sentinel)

```
FR-15 (Hallucination Detection)
├── DEPENDS ON
│   ├── SignalPipeline (produces ConditionedSignal to validate)
│   ├── types.ts (ConditionedSignal, SignalAlert type definitions — must extend)
│   ├── Agent Registry (for HC-05 provenance validation — currently implicit in initializeAgent)
│   └── Configuration system (for check thresholds, response mode)
├── DEPENDED ON BY
│   ├── FR-12 (Graph Nodes) — must only receive non-quarantined signals
│   ├── FR-13 (Thompson Learning) — must only update on confident signals
│   ├── FR-14 (Self-Referential Review) — periodically validates detector config
│   └── FR-9 (Pre-flight Auth) — Andon events may trigger auth re-validation
└── INDEPENDENT OF
    ├── FR-10 (File Context Injection at DISPATCH)
    └── FR-11 (Directory Metadata at DECOMPOSE)
```

---

## 10. Testing Strategy

### 10.1 Unit Tests Required

| Test | Validates | Input | Expected Output |
|------|-----------|-------|-----------------|
| `HC-02: smoothedValue out of bounds` | Domain violation detection | Signal with `smoothedValue = 1.5` for health metric | Andon event, quarantined |
| `HC-03: negative CUSUM` | CUSUM invariant | Signal with `cusumStatistic = -0.1` | Andon event, quarantined |
| `HC-05: uninitialized agent` | Provenance check | Event for agent never passed to `initializeAgent` | Andon event or rejection |
| `HC-07: NaN propagation` | Numeric hygiene | Feed `NaN` as `rawValue` | Andon event, quarantined |
| `HC-07: Infinity propagation` | Numeric hygiene | Feed `Infinity` as `rawValue` | Andon event, quarantined |
| `HC-01: CUSUM/Trend contradiction` | Coherence | Fabricate CUSUM upper alarm + negative trend slope | Warning or Andon |
| `HC-08: out-of-order timestamp` | Temporal integrity | Two events with decreasing timestamps for same key | Warning |
| `Confidence scoring` | Score calculation | Various check pass/fail combinations | Correct confidence values |
| `Andon halt mode` | Pipeline stops for key | Trigger Andon, send subsequent event for same key | Subsequent event rejected/quarantined |
| `Andon degrade mode` | Low-confidence passthrough | Trigger Andon in DEGRADE mode | Output passes with `low_confidence` tag |

### 10.2 Integration Tests

- Full pipeline process → hallucination gate → verify clean signals pass with `confidence = 1.0`
- Inject numeric instability (1000+ events with adversarial values) → verify detection triggers before downstream corruption
- Verify `npm test` passes all existing tests (hallucination gate must be backward-compatible when all checks pass)

### 10.3 MSA Validation

- Run identical hallucination scenarios 30+ times → verify 100% repeatability (since checks are deterministic, this validates implementation correctness, not statistical properties)
- For coherence checks with thresholds: characterize the detection boundary with a designed experiment (vary the contradiction magnitude, record detect/no-detect, fit a logistic curve, verify the boundary matches the configured threshold)

---

## 11. Baseline Measurements (from M-7B/M-8A)

| Measurement | Current Value | Post-FR-15 Target |
|-------------|--------------|-------------------|
| Hallucination detection coverage | 0% (no mechanism exists) | 100% of pipeline outputs gated |
| False negative rate (bounds checks) | N/A | 0% |
| Output confidence scoring | Not measured | 100% of outputs scored |
| Andon events per 1000 signals | N/A | Establish baseline in first 30 days |
| Pipeline latency overhead | 0ms (no checks) | < 0.5ms p99 |
| %C&A of pipeline outputs | Unknown | Measurable after FR-15 deployment |
| RTY across pipeline stages | Unknown | Measurable with per-stage yield gates |

---

## 12. Recommendations

1. **Implement HallucinationDetector as a discrete class** (`src/signals/HallucinationDetector.ts`) — not embedded in `SignalPipeline.process()`. Wire it as Stage 8 invoked at the end of `process()`.

2. **Extend `ConditionedSignal` type** with `confidence: number`, `quarantined: boolean`, and `andonEvents: AndonEvent[]` fields. This is a non-breaking extension (new optional fields).

3. **Add agent registration tracking** — `initializeAgent()` should set a flag in a registry; `process()` should verify registration before processing (HC-05).

4. **Start in LOG_ONLY mode** — Deploy initially without halting, collect Andon event frequency data for 30 days, use this to calibrate coherence check thresholds before switching to STOP or DEGRADE mode. This follows the Lean principle of establishing baseline capability before tightening control limits.

5. **Implement HC-07 (NaN/Infinity) first** — This is the highest-value, lowest-effort check. NaN propagation through EWMA/CUSUM/MACD would silently corrupt all downstream state and is completely undetectable by current code.

6. **Add periodic numeric hygiene recomputation** — Every 100 events per key, recompute EWMA from the last window of raw values and compare against accumulated state. This detects the "silent hallucination" of floating-point drift.

7. **Wire Andon events to FR-12 graph nodes** — Quarantined signals must not update graph node state. This is a hard dependency that must be enforced at the type level (quarantined signals are a different type that graph node update functions don't accept).

---

## 13. 5 Whys — Why Does the System Lack Hallucination Detection?

1. **Why are fabricated outputs possible?** — Because no post-processing validation exists on pipeline outputs.
2. **Why was no validation added?** — Because the pipeline was designed as a pure signal-processing chain; quality was assumed to be ensured by correct algorithm implementation.
3. **Why was correct implementation assumed sufficient?** — Because the design didn't account for emergent inconsistencies between independently-correct stages (each stage can be correct in isolation while producing contradictory conclusions in combination).
4. **Why weren't cross-stage interactions considered?** — Because the 7-stage pipeline was designed as a linear chain, not as an interconnected system with feedback loops and invariant contracts.
5. **Why was a linear model chosen?** — Because the initial design prioritized simplicity and stage independence — valid for an MVP but insufficient for production quality. **Root cause: Missing jidoka principle in original architecture.**

This confirms that FR-15 addresses a foundational architectural gap, not a feature enhancement.