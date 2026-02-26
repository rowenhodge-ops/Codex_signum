# Codex Signum Reference Patterns: Design Specification

## Thompson Sampling Router & DevAgent

**Date:** 2026-02-14
**Status:** Pattern design specification — pre-implementation
**Depends on:** Codex Signum v3.0, Engineering Bridge v2.0, OpEx Addendum v2
**Purpose:** These are the first two patterns built after the Codex core. They serve as **reference implementations** demonstrating how operational excellence principles manifest naturally in Codex-governed patterns — without the Codex prescribing any of them.

---

## Design Philosophy

These patterns exist to prove a thesis: **a pattern that applies Lean Six Sigma, Shingo, and Business Architecture principles will naturally thrive under Codex governance, and one that doesn't will naturally degrade.** The Codex creates the selective pressure. The patterns demonstrate the response.

Neither pattern is mandated by the Codex. Both are sentences written in the Codex's grammar. They can be forked, replaced, or allowed to dim. Their value is proven by their ΦL, not by their pedigree.

### The OpEx Items These Patterns Demonstrate

From the OpEx Addendum v2, ten mechanisms were classified as pattern-level. Both patterns incorporate them — not because the Codex requires it, but because patterns that incorporate them will be structurally healthier:

| OpEx Mechanism | Router | DevAgent | How Demonstrated |
|---|---|---|---|
| Rolled Throughput Yield | — | ✓ | Pipeline RTY computation across SCOPE→EXECUTE→REVIEW→VALIDATE |
| %C&A per stage | — | ✓ | Per-stage first-pass success rate tracked |
| Context-blocked exploration | ✓ | — | Separate posteriors per context type |
| Poka-yoke classification | ✓ | ✓ | Error handling classified as prevention/detection/mitigation/escape |
| CTQ tree decomposition | ✓ | ✓ | Meta-imperatives traced to measurable specifications |
| Kano decay monitoring | — | ✓ | Capability tracking for delighter→satisfier transitions |
| Anti-hallucination metrics | — | ✓ | Confidence scoring, cross-validation, conflation detection |
| Architecture Decision Records | ✓ | ✓ | Constitutional change rationale logged structurally |
| FMEA-style failure mode analysis | ✓ | ✓ | Proactive failure mode enumeration with structural signals |
| Gemba-depth inspection | — | ✓ | Deep graph inspection before high-consequence pipeline decisions |

---

# Pattern 1: Thompson Sampling Router

## Identity in Codex Terms

The router is a **Resonator (Δ)** — it transforms task requests into model selections. It is contained within its own **Bloom (○)** boundary. It connects via **Lines (→)** to Agent nodes (substrate compute) and to the constitutional layer. Its learning happens through a **Learning Helix (🌀)** spanning a **Grid (□)** of execution records.

The router is not an agent. It is a stateless transformation with learned state stored in the graph. Each routing decision is a Seed (•) — an atomic event with provenance.

## Morpheme Composition

```
○ Bloom (router boundary)
  │
  ├── • (task request input)
  │     → Δ (context classifier — what kind of task is this?)
  │         → Δ (sampler — draw from posterior, select model)
  │             → Δ (constitutional gate — validate selection against rules)
  │                 → • (routing decision output)
  │
  ├── □ Grid (execution history — Stratum 2 observations)
  │     🌀 Helix (Learning — Bayesian posterior updates)
  │
  └── □ Grid (distilled knowledge — Stratum 3)
        🌀 Helix (Learning — context cluster refinement)
```

## Core Mechanism: Context-Blocked Thompson Sampling

### The DOE Principle Applied

The whitepaper identified that Thompson Sampling without blocking by context type produces confounded estimates — model capability is conflated with context difficulty. The router implements **separate posterior distributions per context cluster**, following the DOE principle that experimental blocks should be homogeneous.

### Context Classification

The context classifier (first Resonator) categorises incoming tasks into context types. These are not hard-coded categories — they emerge from clustering observed task characteristics:

```typescript
interface RoutingContext {
  task_type: string;           // e.g., "code_generation", "analysis", "review"
  complexity: "low" | "medium" | "high";
  domain: string;              // e.g., "typescript", "python", "architecture"
  quality_requirement: number; // 0.0–1.0 — how critical is output quality
  latency_budget_ms: number;   // max acceptable response time
  cost_ceiling: number;        // max cost for this decision
}

// Context clusters are derived, not assigned
interface ContextCluster {
  id: string;
  centroid: RoutingContext;     // representative context
  member_count: number;        // how many tasks have been assigned here
  models: Map<string, BetaDistribution>; // per-model posterior per cluster
}
```

### Posterior Maintenance

Each model maintains a Beta(α, β) distribution **per context cluster**, not globally:

```typescript
interface ModelPosterior {
  agent_id: string;
  context_cluster_id: string;
  alpha: number;               // successes + prior
  beta: number;                // failures + prior
  observations: number;        // total observations in this cluster
  last_updated: Date;
  recency_weighted_alpha: number; // after decay applied
  recency_weighted_beta: number;
}
```

**Decay:** Old observations lose weight at rate 0.99 per observation. This prevents lock-in from historical performance that no longer reflects current capability — addressing the **lock-in and path dependence** CAS vulnerability (Bridge §Part 6.4).

**Prior:** Uninformative Beta(1, 1) for new model-cluster combinations. The prior ensures εR > 0 for any model that hasn't been conclusively proven inadequate.

### Sampling Process

```
1. Classify task → context cluster
2. For each active model in this cluster:
   a. Draw θ ~ Beta(α_weighted, β_weighted)
3. Apply constitutional constraints as filters (not modifiers):
   a. Remove models exceeding cost_ceiling
   b. Remove models below min_quality_threshold (from ConstitutionalRule)
   c. Remove models below min_ΦL (quarantine threshold)
4. Select model with highest θ from remaining candidates
5. If no candidates remain after filtering → escalate (circuit breaker)
6. Record decision BEFORE execution
7. Execute
8. Record outcome
9. Update posterior for selected model in this cluster
```

### εR Tracking

```typescript
// εR = exploratory_decisions / total_decisions
// A decision is "exploratory" if the selected model was NOT the 
// maximum-likelihood-estimate best model for this context cluster.
// i.e., the model selected by Thompson sampling differs from 
// argmax(α / (α + β)) across models in this cluster.

function isExploratory(selected: string, cluster: ContextCluster): boolean {
  const mle_best = argmax(cluster.models, (m) => m.alpha / (m.alpha + m.beta));
  return selected !== mle_best;
}
```

## Poka-Yoke Error Classification

The router classifies every error by the poka-yoke hierarchy:

| Level | What the Router Catches | Response | Graph Signal |
|---|---|---|---|
| **Prevention** | Invalid task request (missing required fields, nonsensical parameters) | Reject at Bloom boundary before any model is invoked | Observation node: type="prevention", no model cost incurred |
| **Detection** | Constitutional rule violation in model selection (cost exceeded, quality below threshold) | Re-sample from posterior excluding the violating model | Observation node: type="detection", correction applied |
| **Mitigation** | Model returns error or timeout | Record failure, update posterior, re-route to next-best model via Thompson re-sample | Observation node: type="mitigation", εR incremented |
| **Escape** | Model returns output that passes router but fails downstream (DevAgent REVIEW rejects) | Feedback from downstream pattern's Observation → update this model's posterior in this context cluster | Observation node: type="escape", delayed feedback |

**Key insight:** Prevention-level errors have zero cost. Detection-level errors have routing cost but no execution cost. Mitigation-level errors have partial execution cost. Escape-level errors have full execution cost plus downstream rework cost. A pattern that pushes errors left (toward prevention) is structurally cheaper to operate — this shows up as higher ΦL through better usage_success_rate.

## CTQ Tree: From Meta-Imperatives to Router Specifications

The router traces its measurable specifications back to the meta-imperatives:

```
Ω₁ (Reduce Suffering)
  └─ Driver: Prevent harm from model failures
       └─ CTQ: Cascade frequency from router decisions
            └─ Spec: < 1 cascade event per 100 routing decisions
       └─ CTQ: Mean time to detect model degradation  
            └─ Spec: < 20 observations after onset of degradation
  └─ Driver: Minimise wasted compute
       └─ CTQ: Escape-level error rate
            └─ Spec: < 5% of decisions result in escape-level errors

Ω₂ (Increase Prosperity)
  └─ Driver: Optimise cost-quality ratio
       └─ CTQ: Cost per quality-unit delivered
            └─ Spec: Monotonically improving over 30-day windows
       └─ CTQ: Model diversity (no single model > 80% of decisions in any cluster)
            └─ Spec: Shannon entropy of model selection > 0.5 per cluster
  └─ Driver: Enable capability distribution
       └─ CTQ: Context cluster coverage
            └─ Spec: No context cluster with < 2 viable models

Ω₃ (Increase Understanding)
  └─ Driver: Routing decisions are interpretable
       └─ CTQ: Decision traceability
            └─ Spec: 100% of decisions have full provenance in graph
       └─ CTQ: Posterior transparency
            └─ Spec: Any observer can query current posteriors per model per cluster
```

These CTQ specs are not constitutional rules — they are the router pattern's own quality targets. They become structural: if the router fails to meet them, its ΦL degrades because its usage_success_rate and axiom_compliance decline.

## FMEA: Proactive Failure Mode Enumeration

| Failure Mode | Severity | Occurrence | Detection | RPN | Structural Signal | Mitigation |
|---|---|---|---|---|---|---|
| **Model API outage** | High (8) | Medium (5) | High — immediate timeout (2) | 80 | ΦL drops on Agent node; εR spikes as router explores alternatives | Circuit breaker after N consecutive failures; re-sample excludes down model |
| **Posterior convergence to wrong model** | High (9) | Low (2) | Low — no immediate signal (7) | 126 | Slow ΦL decline in downstream patterns; friction increase in ΨH | Minimum εR floor prevents full convergence; context re-clustering on ΨH friction spike |
| **Context misclassification** | Medium (5) | Medium (4) | Medium — visible as within-cluster variance (5) | 100 | High variance in per-cluster success rates; temporal_stability drops | Periodic context cluster recomputation from observation data; cluster split when within-cluster variance exceeds threshold |
| **Constitutional rule too restrictive** | Medium (6) | Low (3) | High — visible as frequent filtering (2) | 36 | High rate of constitutional filter rejections; few models pass gate | ADR logged; constitutional amendment proposal if rejection rate > 50% |
| **Cost ceiling too low for quality target** | High (7) | Medium (4) | Medium — visible as quality-cost tension (4) | 112 | Quality CTQ failing while cost CTQ passing; Pareto frontier visible in decision data | Escalation signal; human review of cost ceiling vs. quality target trade-off |
| **Decay rate miscalibrated** | Medium (5) | Medium (4) | Low — gradual, invisible (8) | 160 | Either: old data biasing decisions (low decay) or valid history discarded too fast (high decay); detectable via Cp/Cpk equivalent on posterior stability | Track posterior stability over time; if posteriors oscillate excessively, decay too high; if posteriors don't adapt to known model changes, decay too low |

**Note:** RPN (Risk Priority Number) = Severity × Occurrence × Detection. Higher = more urgent. The router should track which failure modes have actually occurred and update occurrence scores from observed data — making the FMEA a living document expressed in Stratum 3 memory, not a static table.

## Architecture Decision Records (Structural)

Every constitutional rule change affecting the router is recorded as a graph structure:

```typescript
interface ArchitectureDecisionRecord {
  decision_id: string;
  timestamp: Date;
  context: string;               // What prompted this change
  alternatives_considered: string[]; // What else was evaluated
  selected: string;              // What was chosen
  rationale: string;             // Why
  affected_rules: string[];      // Which ConstitutionalRule nodes
  expected_impact: {
    phi_l: "improve" | "neutral" | "degrade";
    psi_h: "improve" | "neutral" | "degrade";
    epsilon_r: "increase" | "neutral" | "decrease";
  };
  observed_impact?: {            // Filled in after minimum stability period
    phi_l_delta: number;
    psi_h_delta: number;
    epsilon_r_delta: number;
    assessment: "confirmed" | "neutral" | "reverted";
  };
}
```

This is stored as a Decision node with EVOLVED_FROM relationships to ConstitutionalRule nodes. Not a report. Not a document. A graph structure. State is structural.

## Router ΦL Composition

The router's own ΦL is computed from:

| Factor | Source | Weight |
|---|---|---|
| axiom_compliance | Constitutional rule evaluation pass rate | 0.4 |
| provenance_clarity | % of decisions with full provenance chain | 0.2 |
| usage_success_rate | % of routing decisions where selected model succeeded | 0.2 |
| temporal_stability | Variance of ΦL over observation window | 0.2 |

**The router pattern's health is self-referential**: if it routes well, its ΦL is high. If it routes poorly, its ΦL dims. The Codex doesn't need to check whether the router is working — the router's structural health tells anyone who looks.

---

# Pattern 2: DevAgent

## Identity in Codex Terms

The DevAgent is a **Bloom (○)** containing a four-stage pipeline. Each stage is a **Resonator (Δ)** performing a transformation. The pipeline connects to the Thompson Router for model selection (a Line to an external pattern). It maintains its own **Grid (□)** of execution history and a **Learning Helix (🌀)** for improvement over time.

The DevAgent is not an agent in the agentic-AI sense. It is a pattern — a coherent flow of transformations with structural health. It has no identity, no persistence beyond its configuration and observation history, and no autonomy beyond what the pipeline structure provides.

## Morpheme Composition

```
○ Bloom (DevAgent boundary)
  │
  ├── • (task input — coding request)
  │
  ├── Δ SCOPE (understand the task)
  │     → [via Line to Thompson Router] → model selection
  │     → • (scoped task definition output)
  │
  ├── Δ EXECUTE (produce the code)
  │     → [via Line to Thompson Router] → model selection
  │     → • (code output)
  │
  ├── Δ REVIEW (evaluate the code)
  │     → [via Line to Thompson Router] → model selection  
  │     → • (review assessment)
  │     │
  │     └── 🌀 Helix (Correction — REVIEW → EXECUTE retry, max 3)
  │           → [feedback Line back to EXECUTE]
  │
  ├── Δ VALIDATE (confirm quality)
  │     → [via Line to Thompson Router] → model selection
  │     → • (validated output)
  │
  ├── □ Grid (execution history — Stratum 2)
  │     🌀 Helix (Learning — pipeline performance over time)
  │
  └── □ Grid (distilled knowledge — Stratum 3)
        🌀 Helix (Learning — task type patterns, model preferences)
```

## Pipeline Detail: SCOPE → EXECUTE → REVIEW → VALIDATE

### SCOPE (Δ — Understanding)

**Purpose:** Transform a raw task request into a structured scope definition. This is where the pattern establishes what it will do, what it needs, and what success looks like.

**DMAIC mapping:** Absorbs Define + partial Measure. The "measurement system" for a coding task is: can we evaluate the output? If the task lacks testable acceptance criteria, SCOPE must either derive them or flag the task as under-specified (prevention-level poka-yoke).

**Inputs:** Raw task description, context from Grid (prior executions of similar tasks), constraints from constitutional rules.

**Outputs:** Structured scope with acceptance criteria, complexity estimate, domain classification, quality requirements.

**Model selection:** Via Thompson Router with context = {task_type: "scoping", complexity: estimated, domain: detected}

**Anti-hallucination mechanism:** SCOPE includes a **confidence score** on its own output. If the model is uncertain about the task's requirements, this uncertainty is explicit in the Seed output — not hidden. This is the epistemic honesty mechanism: the pattern structurally represents what it doesn't know.

```typescript
interface ScopeOutput {
  task_id: string;
  understanding: string;          // What the pattern thinks the task is
  acceptance_criteria: string[];   // Testable conditions for success
  complexity: "low" | "medium" | "high";
  domain: string;
  confidence: number;              // 0.0–1.0: how certain is this scoping
  ambiguities: string[];           // What remains unclear
  assumptions: string[];           // What was assumed without evidence
  estimated_stages: number;        // Expected correction helix iterations
}
```

If `confidence < 0.6`, the pattern should either request clarification (if interactive) or proceed with explicit degradation in its output ΦL — signalling that downstream stages are operating on uncertain ground.

### EXECUTE (Δ — Production)

**Purpose:** Produce the actual code artefact.

**Model selection:** Via Thompson Router with context derived from SCOPE output — this is where context-blocked exploration matters most. The router selects based on the *scoped* task, not the raw input.

**Outputs:**

```typescript
interface ExecuteOutput {
  task_id: string;
  code: string;                    // The produced artefact
  approach_description: string;    // How and why this approach was chosen
  known_limitations: string[];     // What this code does NOT handle
  confidence: number;              // Model's self-assessed confidence
  tokens_used: number;
  model_used: string;              // For provenance
  execution_time_ms: number;
}
```

**Anti-conflation:** The EXECUTE output includes `known_limitations` — an explicit enumeration of what the code doesn't handle. This counteracts the tendency of models to present partial solutions as complete. A model that claims no limitations on a complex task is either correct (rare) or conflating — and the REVIEW stage will detect this, feeding back an escape-level error that degrades the model's posterior.

### REVIEW (Δ — Analysis)

**Purpose:** Evaluate the EXECUTE output against SCOPE acceptance criteria. This is where quality is assured at the source (jidoka principle).

**Model selection:** Via Thompson Router. Critically, the REVIEW model should generally differ from the EXECUTE model — cross-model validation is a structural anti-hallucination mechanism. The router can enforce this through a constitutional rule: `review_model ≠ execute_model` when multiple viable models exist.

**Correction Helix:** If REVIEW identifies issues, it feeds structured feedback back to EXECUTE:

```typescript
interface ReviewFeedback {
  passed: boolean;
  issues: Array<{
    severity: "critical" | "major" | "minor";
    description: string;
    location: string;              // Where in the code
    suggestion: string;            // Specific fix guidance
  }>;
  acceptance_criteria_met: boolean[];  // Per-criterion pass/fail
  iteration: number;                   // Which correction cycle (1, 2, or 3)
  recommendation: "fix" | "accept_with_caveats" | "reject";
}
```

**Bounded correction:** Maximum 3 iterations (Correction Helix bound). If correction fails to converge:
- Pass best available output forward
- Signal degraded ΦL on the output Seed
- Record the non-convergence as a Stratum 2 observation
- This becomes visible: a pattern that frequently exhausts its correction budget is structurally unhealthy

**Jidoka line-stop equivalent:** If REVIEW assessment is `reject` AND all 3 correction iterations are exhausted, the pattern **stops and signals** rather than passing garbage forward. This is the Fidelity axiom (A3) in action: a pattern that passes known-bad output is lying about its state. The stop is not a failure — it is quality assurance at the source.

### VALIDATE (Δ — Confirmation)

**Purpose:** Final quality gate. Confirms that the output meets standards and is safe to release.

**Model selection:** Via Thompson Router.

**Checks:**
- Acceptance criteria from SCOPE all met (or explicitly waived with rationale)
- Code is syntactically valid (prevention-level poka-yoke — structural check, no model needed)
- No known security vulnerabilities introduced (detection-level — can use automated scanning)
- Output is traceable to input (Provenance axiom)
- Confidence scores from upstream stages are within acceptable range

**Output:**

```typescript
interface ValidateOutput {
  task_id: string;
  verdict: "approved" | "approved_with_caveats" | "rejected";
  caveats: string[];
  quality_score: number;           // Composite quality assessment
  provenance_chain: string[];      // Full trace from input to output
  pipeline_metrics: {
    total_iterations: number;      // Correction Helix iterations used
    stages_passed_first_time: number; // For %C&A computation
    total_stages: number;
    time_elapsed_ms: number;
    total_tokens: number;
    total_cost: number;
  };
}
```

## Rolled Throughput Yield

RTY is computed per pipeline execution and tracked over time:

```typescript
function computeRTY(validate_output: ValidateOutput): number {
  // Per-stage first-pass yield
  // A stage "passes first time" if it did not trigger a correction helix iteration
  // or a re-routing decision
  
  const stage_results = [
    scope_passed_first_time,    // boolean
    execute_passed_first_time,  // boolean (REVIEW didn't reject on first pass)
    review_passed_first_time,   // boolean (no issues found OR only minor)
    validate_passed_first_time  // boolean
  ];
  
  const per_stage_yield = stage_results.map(passed => passed ? 1.0 : 0.0);
  
  // RTY = product of per-stage yields
  // But more usefully: track per-stage success RATES over a window
  const rty = per_stage_rates.reduce((acc, rate) => acc * rate, 1.0);
  
  return rty;
}
```

**What RTY reveals:** A 4-stage pipeline where each stage has 90% first-pass success has RTY = 0.656. Nearly 35% of executions involve at least one correction loop — hidden rework invisible to aggregate ΦL but structurally expensive. Tracking RTY makes this visible. A pattern with declining RTY is degrading even if its final output quality (aggregate ΦL) remains stable — it's working harder to achieve the same result.

**Structural impact:** RTY feeds into the pipeline pattern's temporal_stability factor within ΦL. A pattern with volatile RTY has low temporal_stability, which dims its ΦL even if success_rate remains high. The Codex doesn't need to know about RTY — it creates the selective pressure through ΦL, and RTY is the mechanism by which the pattern responds.

## %C&A Per Stage

Percent Complete and Accurate tracks what fraction of each stage's outputs pass downstream without requiring rework:

```typescript
interface StageMetrics {
  stage: "SCOPE" | "EXECUTE" | "REVIEW" | "VALIDATE";
  total_executions: number;
  first_pass_success: number;
  correction_loops_triggered: number;
  percent_complete_and_accurate: number; // first_pass_success / total_executions
}
```

**Diagnostic value:** If %C&A at EXECUTE is 60% but %C&A at SCOPE is 95%, the problem is in code generation, not task understanding. If %C&A at SCOPE is low, the pattern is accepting poorly-defined tasks — a prevention-level poka-yoke failure. This stage-level granularity identifies exactly where in the pipeline quality breaks down, rather than treating the pipeline as a black box.

## Anti-Hallucination Metrics

Three structural mechanisms for epistemic honesty:

### 1. Confidence Scoring
Every stage output includes a confidence score. These are tracked:

```typescript
interface ConfidenceTrace {
  scope_confidence: number;
  execute_confidence: number;
  review_confidence: number;
  validate_confidence: number;
  
  // Calibration: are confidence scores actually predictive?
  calibration_data: Array<{
    stated_confidence: number;
    actual_outcome: boolean;  // did the stage's output survive downstream?
  }>;
}
```

**Calibration tracking** is the key insight. A model that says "90% confident" but is actually correct 60% of the time is poorly calibrated — overconfident. Tracking stated confidence vs. actual outcome over time produces a calibration curve. A well-calibrated pattern's curve matches the diagonal. An overconfident pattern's curve falls below it. This calibration data lives in Stratum 3 (distilled knowledge) and informs how the DevAgent interprets future confidence scores.

### 2. Cross-Model Validation
REVIEW should generally use a different model than EXECUTE. When two models agree, confidence is structurally higher. When they disagree, the disagreement is the signal — it indicates genuine uncertainty that a single model would have hidden.

Constitutional rule for the DevAgent:
```
IF viable_model_count >= 2 FOR context_cluster
THEN review_model ≠ execute_model
PRIORITY: preferred (not mandatory — single-model operation is degraded, not forbidden)
```

### 3. Conflation Detection
Track cases where EXECUTE claims completeness but REVIEW finds gaps:

```typescript
interface ConflationEvent {
  task_id: string;
  execute_known_limitations: string[];  // What EXECUTE said it didn't handle
  review_found_issues: string[];        // What REVIEW actually found
  
  // Issues found by REVIEW that weren't in EXECUTE's known_limitations
  // = conflation: the model presented partial work as complete
  conflation_items: string[];
  conflation_rate: number;  // |conflation_items| / |review_found_issues|
}
```

A pattern with high conflation rate has a model that doesn't know what it doesn't know — or won't admit it. This feeds back to the Thompson Router: the model's posterior in the relevant context cluster degrades because the downstream pattern (DevAgent) is reporting escape-level errors caused by conflation.

## Kano Decay Monitoring

The DevAgent tracks capability expectations over time:

```typescript
interface CapabilityExpectation {
  capability: string;              // e.g., "TypeScript type inference", "error handling"
  first_observed: Date;            // When this capability first appeared
  kano_classification: "must_be" | "one_dimensional" | "attractive";
  classification_history: Array<{
    date: Date;
    classification: string;
    evidence: string;              // What triggered reclassification
  }>;
}
```

**How decay is detected:** A capability that was initially "attractive" (delighter — its presence was surprising and valued) becomes "one_dimensional" (expected — satisfaction scales with quality) and eventually "must_be" (expected — its absence causes dissatisfaction). Detection:

- **Attractive → One-dimensional:** The capability appears in SCOPE acceptance criteria (previously it was a bonus; now it's expected)
- **One-dimensional → Must-be:** Pipeline failure when the capability is absent triggers correction loops (previously absence was tolerated; now it's a defect)

**Structural impact:** When a capability transitions to "must_be," the DevAgent's quality expectations ratchet — previous success at lower quality levels no longer maintains ΦL. The pattern must either deliver the capability consistently or its ΦL dims. This is the Codex's selective pressure expressing Kano's theory structurally.

## Gemba-Depth Inspection

Before high-consequence decisions, the DevAgent performs deep graph inspection:

```typescript
interface GembaInspection {
  trigger: "pipeline_halt" | "constitutional_change" | "pattern_decommission";
  depth: number;                   // How many hops into the graph
  findings: {
    upstream_health: Map<string, number>;    // ΦL of upstream patterns
    downstream_dependencies: string[];       // What depends on this output
    recent_cascade_events: number;           // In the local subgraph
    context_cluster_health: number;          // ΨH in the relevant cluster
    observation_depth: number;               // How many observations inform current state
  };
  recommendation: string;
}
```

**When to inspect deeply:**
- Before VALIDATE rejects a pipeline output (is the rejection justified or is the validator miscalibrated?)
- Before escalating a circuit breaker event (is this a genuine failure cascade or a transient blip?)
- Before proposing a constitutional rule change based on DevAgent data (is the evidence sufficient?)

The inspection reads from the graph — it doesn't create new state. It's the pattern equivalent of walking the gemba: looking at the actual structural state rather than relying on the aggregate ΦL score.

## FMEA: DevAgent Failure Modes

| Failure Mode | Severity | Occurrence | Detection | RPN | Structural Signal | Mitigation |
|---|---|---|---|---|---|---|
| **SCOPE misunderstands task** | High (8) | Medium (5) | Medium — REVIEW may catch (4) | 160 | Low %C&A at EXECUTE (cascading from bad scope); high correction loop count | Confidence scoring at SCOPE; reject tasks below confidence threshold |
| **EXECUTE produces non-functional code** | High (7) | Medium (5) | High — REVIEW + syntax check (2) | 70 | Correction Helix activates; normal operation | Standard correction loop; max 3 iterations then halt |
| **REVIEW and EXECUTE model agree on wrong answer** | Very High (9) | Low (2) | Low — no internal signal (8) | 144 | Only visible when output fails in production; delayed ΦL degradation | Cross-model validation; conflation detection; external test execution where possible |
| **Correction Helix oscillation** | Medium (6) | Medium (4) | High — visible as iteration count (2) | 48 | Pattern oscillates between REVIEW and EXECUTE; pulsation rate increases; ΦL dims | Iteration cap (3); structured feedback (not just "try again"); each iteration must address specific issues |
| **Pipeline WIP accumulation** | Medium (5) | Medium (4) | Medium — visible as latency increase (4) | 80 | Lead time increases while process time stays constant; PCE drops | Track pipeline timing metrics; alert on lead_time / process_time ratio degradation |
| **Conflation undetected** | High (8) | Medium (4) | Low — model doesn't know what it doesn't know (7) | 224 | Downstream failures from "complete" outputs; delayed ΦL impact | Conflation rate tracking; model-specific conflation profiles; escalate models with high conflation rates |
| **Constitutional rule prevents valid operations** | Medium (5) | Low (2) | High — visible as rejection rate (2) | 20 | High constitutional filter rejection rate | ADR logged; threshold review; amendment proposal if persistent |

**Highest RPN = Conflation undetected (224).** This is the pattern's most dangerous failure mode — the substrate (model) produces work it believes is complete, but isn't. The primary mitigations (cross-model validation, conflation tracking, confidence calibration) are all anti-hallucination mechanisms. A DevAgent pattern that invests in these mechanisms will have lower conflation rates, fewer escape-level errors, higher ΦL — and will outcompete patterns that don't, purely through the Codex's structural selective pressure.

## Architecture Decision Records (DevAgent)

Same structure as the router ADR, applied to DevAgent-specific constitutional changes:

- Pipeline stage model assignments (which stages use which model tiers)
- Correction Helix iteration limits
- Quality thresholds per stage
- Cross-model validation requirements
- Confidence score interpretation thresholds

All stored as graph structures, not documents.

## DevAgent ΦL Composition

The DevAgent's ΦL reflects the full pipeline:

| Factor | Source | Weight |
|---|---|---|
| axiom_compliance | Constitutional rule evaluation across all pipeline stages | 0.4 |
| provenance_clarity | % of pipeline executions with full input→output trace | 0.2 |
| usage_success_rate | % of pipeline executions producing approved output (including correction loops) | 0.2 |
| temporal_stability | Variance of ΦL + RTY stability over observation window | 0.2 |

**RTY integration:** The temporal_stability factor incorporates RTY volatility. A pattern whose RTY is stable at 0.70 is healthier than one whose RTY oscillates between 0.50 and 0.90, even if the average is the same. Stability matters.

---

## Cross-Pattern Integration

### Router → DevAgent Dependency

The DevAgent depends on the Router. This is intentional (per Implementation README Task 4). It means:

- Router ΦL directly affects DevAgent ΦL (if the router routes badly, the DevAgent suffers)
- Router εR affects DevAgent predictability (high exploration means more variance in model selection)
- Router context clusters should include DevAgent pipeline stages as distinct context types

### Feedback Loop

The DevAgent provides **delayed feedback** to the Router:

```
Router selects model for EXECUTE stage
  → EXECUTE produces output
    → REVIEW evaluates output
      → If REVIEW rejects: escape-level error fed back to Router
      → If REVIEW accepts: success fed back to Router
        → VALIDATE confirms or rejects
          → If VALIDATE rejects: late escape-level error fed back to Router
```

This delayed feedback is critical. The Router's posterior update from a DevAgent execution includes not just "did the model return a response" but "did the model's response survive the full pipeline." This is higher-quality signal than immediate success/failure — and it's only possible because both patterns share the same graph.

### ΨH Between Patterns

The Router and DevAgent have a measurable ΨH. High ΨH means the Router's model selections consistently produce good outcomes in the DevAgent pipeline. Low ΨH means the Router and DevAgent are misaligned — the Router is optimising for something the DevAgent doesn't value.

ΨH between patterns should improve over time as the Learning Helix tightens the relationship. If it degrades, something fundamental has changed — a new model, a new task type, a context cluster that doesn't match the DevAgent's needs.

---

## Implementation Notes

### What's Already in the Implementation README

Tasks 3 and 4 in the Implementation README define the build sequence for these patterns. This design specification provides the **OpEx-informed architecture** that the tasks should implement. Specifically:

- Task 3 (Thompson Router) should implement context-blocked exploration, poka-yoke error classification, and the CTQ tree as testable specifications
- Task 4 (DevAgent) should implement the full pipeline with RTY, %C&A, anti-hallucination metrics, and the correction helix with structural feedback

### What's Already in the Engineering Bridge

Part 10 of the Engineering Bridge v2.0 already contains RTY, poka-yoke levels, and failure mode analysis tables. This design specification extends those foundations with:

- Context-blocked Thompson Sampling (DOE principle)
- CTQ tree decomposition from meta-imperatives to measurable specs
- Anti-hallucination as a structural mechanism (confidence calibration, cross-model validation, conflation detection)
- Kano decay monitoring
- FMEA as living graph data (not static documentation)
- Gemba-depth inspection protocols

### Build Sequence

1. **Router first.** The DevAgent depends on it. Build context classification, posterior maintenance, sampling, constitutional gate. Verify εR > 0 and decisions logged.
2. **DevAgent pipeline structure.** SCOPE → EXECUTE → REVIEW → VALIDATE with correction helix. Verify pipeline executes end-to-end.
3. **Anti-hallucination.** Add confidence scoring, cross-model validation, conflation detection. Verify these metrics are tracked in graph.
4. **RTY and %C&A.** Add per-stage tracking. Verify RTY is computed and reflected in temporal_stability.
5. **FMEA as graph data.** Create failure mode nodes linked to pattern nodes. Track occurrence from observations. Verify RPN updates from actual data.
6. **Kano tracking.** Implement capability expectation tracking. This is a Learning Helix concern — runs across many executions.
7. **Gemba inspection.** Implement deep graph queries for high-consequence decisions. Verify inspection reads from graph only.

---

*These patterns prove the grammar. If they thrive, the grammar works. If they dim, something in the grammar needs strengthening. Either way, the answer is structural.*
