# Codex Signum v5.0b — Statistical Assessment Resonator

**Status:** Draft supplement to v5.0
**Date:** 2026-03-15
**Scope:** Reusable analytical Resonator for uncertainty quantification. Confidence intervals, hypothesis testing (Type I/II errors, power, P-values), ANOVA, and Design of Experiments — expressed as Codex-native morpheme operations.

---

## Design Constraint: Not a Calculation Abstraction Layer

The Statistical Assessment Resonator is a structural participant in the pattern, not an external observer. It reads from the observation Grid through Lines. It produces Seeds into the graph. It has its own ΦL. Downstream consumers (Thompson Helix, ADAPT Resonator, Calibration Helix) read its output Seeds through Lines and make their own decisions. The Resonator enriches — it does not validate, check, audit, or monitor.

The anti-pattern test from v5.0 §Anti-Patterns applied to this design:

| Anti-Pattern | Test | Result |
|---|---|---|
| **Monitoring Overlay** | Does it observe execution from outside and write derived results? | **No.** It reads from the observation Grid that already exists, transforms raw observations into statistical context, and writes output Seeds. It is a constituent of the stage Bloom, not an external observer. Its activation is data-dependent (new observations arrive on its input Line), not event-driven from outside the pattern. |
| **Intermediary Layer** | Does it sit between an operational pattern and the graph write layer, transforming data that the operational path could write directly? | **No.** It does not intercept the ΦL computation or the Thompson selection. Those paths remain unchanged. It produces *additional* Seeds that coexist alongside the existing computations. The ΦL Resonator could still compute without it. The Thompson Helix could still update posteriors without it. The statistical context is supplementary input, not a mandatory intermediary. |
| **Dimensional Collapse** | Does it reduce multi-dimensional signal to a single scalar? | **No.** Its outputs preserve full statistical dimensionality: confidence interval (lower bound, upper bound, width), hypothesis test results (test statistic, P-value, effect size, power, Type I/II error rates), ANOVA tables (between-group variance, within-group variance, F-statistic, degrees of freedom). These are Seeds with structured content, not collapsed scalars. |
| **Prescribed Behaviour** | Does it dictate what other patterns do? | **No.** It produces statistical context Seeds. The Thompson Helix reads them and decides whether to continue exploration or exploit. ADAPT reads them and decides intervention proportionality. The Calibration Helix reads them and decides whether to adjust thresholds. The Resonator does not command. It enriches. |
| **Governance Theatre** | Could it exist structurally without influencing decisions? | **Risk acknowledged.** If downstream consumers ignore statistical context Seeds, the Resonator becomes theatre — present but inert. Mitigation: the Lines connecting statistical context Seeds to consumers carry conductivity. If the Seeds are never read (no inbound signal on the consumer's input Line from the statistical context), the Line goes dark — structurally visible as an unused connection. The Assayer can flag this as a Governance Theatre signature: governance-labelled nodes with low signal flow. |
| **Shadow Operations** | Does it store state outside the graph? | **No.** All intermediate calculations (sample statistics, running sums, partition indices) are properties on the Resonator's internal Seeds within the stage Bloom. Nothing lives in TypeScript variables or external stores. |

---

## Axiom Compliance

### Foundation Layer

**A2 (Visible State):** The statistical assessment is expressed as Seeds with structured content in the graph. Confidence interval width IS visible health — a wide CI means the system's knowledge is uncertain, structurally visible to any Cypher query. Power estimates are graph-resident properties, not hidden computations. Every statistical finding is a node you can inspect.

**A3 (Transparency):** Every statistical computation is interpretable by its receiver. A P-value Seed contains the test statistic, the null hypothesis, the sample size, the degrees of freedom, and the conclusion — not just the number. The derivation path from raw observations through to the statistical finding is traceable through Lines: observation Grid → Statistical Assessment Resonator → finding Seed. A practitioner can inspect the Resonator's config Seeds (significance level α, minimum power threshold 1-β, blocking variables) and understand why a particular test was chosen and what it concluded.

**A6 (Minimal Authority):** The Resonator requests only the data its computation requires. Its input Lines connect to the observation Grid within its containing stage Bloom (or, for cross-stage analysis, to observation Grids in sibling stage Blooms within the same pattern Bloom — crossing at the Bloom boundary per G3). It does not read from the Constitutional Bloom, does not modify ΦL, does not alter Thompson posteriors. It reads observations. It writes statistical context. Nothing more.

### Structural Layer

**A1 (Fidelity):** The statistical findings must match actual state. A confidence interval that claims ±0.05 when the true uncertainty is ±0.20 is a fidelity violation. The Resonator's own ΦL tracks this: when downstream consumers make decisions based on its output and those decisions prove wrong at rates exceeding the stated confidence level, the Resonator's ΦL degrades. The assessment of the assessment is structural — the Resonator's predictions are falsifiable from subsequent observations.

### Derived Layer

**A4 (Provenance):** Every statistical finding Seed carries: which observation Seeds it was computed from (input Line provenance), which test was applied (method property), which configuration parameters governed the test (linked config Seeds), and which version of the Resonator produced it (Resonator ΦL at time of computation). The full chain from raw observation to statistical conclusion is traceable.

**A7 (Semantic Stability):** The Resonator uses the existing morpheme vocabulary. No new morpheme types. Observations are Seeds. Findings are Seeds. The Resonator transforms. The Grid stores. The Helix governs calibration. "Confidence interval" is content within a Seed, not a new structural primitive. "ANOVA table" is content within a Seed. The statistical vocabulary is domain content, not grammar extension.

**A8 (Adaptive Pressure):** The Resonator learns. Its own observation Grid accumulates: which tests it ran, what they concluded, whether downstream decisions based on those conclusions succeeded. The Calibration Helix governing the Resonator's parameters (significance level, minimum sample size, blocking strategy) reads from this Grid and adjusts. A Resonator that consistently recommends "insufficient sample size" when downstream decisions succeed anyway has its minimum sample size parameter recalibrated downward. A Resonator whose confidence intervals consistently exclude the true value has its methodology recalibrated. The Resonator is subject to the same adaptive pressure as everything else.

**A9 (Comprehension Primacy):** The statistical output must be comprehensible to its consumers. The Thompson Helix does not need to understand P-value theory to use the output — it reads a Seed that says "effect size: 0.12, power at current sample: 0.34, minimum observations for power 0.80: 47". The ADAPT Resonator reads a Seed that says "this run's quality is within normal variation (P = 0.38, common-cause)". The statistical rigour is in the computation; the output is expressed in operational terms. If the consumer Resonator cannot parse the output, the Line's conductivity check fails at the semantic layer — the signal doesn't propagate.

---

## Architecture

### Morpheme Identity

The Statistical Assessment Resonator is a **Resonator (Δ)** — a transformation. It reads structured observation data (input Lines from observation Grid), applies statistical methods (transformation), and produces statistical context Seeds (output Lines to consumers).

It is not a Grid (it doesn't store — it transforms). It is not a Helix (it doesn't govern iteration — it provides input to Helixes that do). It is not a Bloom (it doesn't define scope — it operates within one). It is not a Seed (it doesn't encode lifecycle — it produces Seeds that do).

**Shape:** Multiple inputs (observation Seeds from a Grid, config Seeds for test parameters) → multiple outputs (finding Seeds — one per statistical test performed). A distribution Resonator.

### Containment

The Resonator lives inside a stage Bloom. Its containing Bloom provides the scope — the observations it analyses are those within the same stage Bloom's observation Grid (or, for cross-stage analysis like ANOVA across stages, connected via explicit Lines at stage Bloom boundaries).

```
Stage Bloom (DECOMPOSE)
  ├─ CONTAINS → Model Resonator (generates TaskGraph)
  ├─ CONTAINS → Kano Classification Resonator (classifies CTQs)
  ├─ CONTAINS → Statistical Assessment Resonator (quantifies uncertainty)
  ├─ CONTAINS → Prompt Template Seed
  ├─ CONTAINS → Config Seed(s)
  │    ├─ Config Seed: α = 0.05 (significance level)
  │    ├─ Config Seed: 1-β = 0.80 (minimum power threshold)
  │    ├─ Config Seed: blocking_variables = ["task_type", "input_complexity"]
  │    └─ Config Seed: min_observations = 10 (minimum sample for any test)
  └─ CONTAINS → Observation Grid
       ├─ Observation Seed (run 1: model=sonnet, quality=0.72, latency=34s, ...)
       ├─ Observation Seed (run 2: model=opus, quality=0.81, latency=89s, ...)
       └─ ...
```

### Reusability

The Resonator is not hardwired to a specific stage or pattern. Any stage Bloom that needs uncertainty quantification can contain an instance. The Resonator's behaviour is governed by its config Seeds — the same Resonator design operates differently depending on what it's configured to analyse:

| Containing Bloom | What It Analyses | Primary Consumers |
|---|---|---|
| DECOMPOSE stage Bloom | Task quality variance, Kano classification confidence, CTQ derivation power | ADAPT Resonator, GATE (human reviewer) |
| REVIEW stage Bloom | Output quality assessment uncertainty, common vs. special cause distinction | ADAPT Resonator, Correction Helix |
| Pattern Bloom (Architect) | Cross-stage ΦL comparison (ANOVA), model × task-type interaction effects | Thompson Helix, Calibration Helix |
| Pattern Bloom (DevAgent) | Per-stage first-pass yield confidence, correction loop convergence assessment | ADAPT Resonator, Calibration Helix |
| Initium ANALYSE stage Bloom | Diagnostic finding significance, assessment inter-rater reliability | GATE (consultant reviewer), Colophon validation |
| Assayer evaluation scope | Axiom compliance score confidence, sample adequacy for compliance claims | Scale 2→3 escalation decision |

---

## Statistical Capabilities

Each capability is a transformation the Resonator can perform. Which transformations fire depends on the config Seeds and the observation Grid's contents.

### 1. Confidence Intervals

**What it does:** Takes a set of observation Seeds from the Grid and produces a finding Seed containing the point estimate, confidence interval bounds, and interval width for a specified metric.

**Input:** Observation Seeds (connected via temporal Lines in the Grid), metric to assess (property name on the observation Seeds), confidence level (from config Seed, default α = 0.05 → 95% CI).

**Output:** A Confidence Interval Seed:

```typescript
interface CIFindingSeed {
  seedType: "statistical:confidence_interval";
  content: string;  // Human-readable: "Model Sonnet quality on reasoning tasks: 0.74 [0.68, 0.80] (95% CI, n=23)"
  metric: string;
  pointEstimate: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
  sampleSize: number;
  method: "t-interval" | "bootstrap" | "wilson" | "bayesian-credible";
  // Provenance
  observationSeedIds: string[];  // Which observations went into this
  resonatorPhiL: number;         // ΦL of the Statistical Assessment Resonator at computation time
}
```

**Downstream consumption:**

- **Thompson Helix:** Reads CI width as uncertainty signal. If two models' CIs overlap substantially, exploration is statistically justified regardless of point estimate ordering. If CIs are disjoint, exploitation is justified with quantified confidence.
- **Calibration Helix:** Reads CI width trend over time. Narrowing CIs mean the system is learning. Widening CIs (after parameter changes) mean the change introduced instability.
- **GATE (human reviewer):** Sees CI width in the plan presentation. A plan where "task quality estimate: 0.71 [0.42, 0.99]" communicates very different confidence than "0.71 [0.68, 0.74]".

### 2. Hypothesis Testing (Type I/II, Power, P-values)

**What it does:** Formalises the decision points that currently operate on point estimates as proper hypothesis tests with quantified error rates.

**The four decision points and their null hypotheses:**

| Decision Point | Null Hypothesis (H₀) | Alternative (H₁) | Type I Error (false rejection) | Type II Error (false acceptance) | Asymmetric Cost |
|---|---|---|---|---|---|
| Thompson: model comparison | Models A and B have equal quality for this context | Model A is better than B | Select worse model (one bad execution) | Miss genuinely better model (ongoing quality loss) | Type II costlier — favours exploration |
| ΦL threshold crossing | Component is healthy (ΦL ≥ threshold) | Component is degraded | False alarm → unnecessary intervention | Missed degradation → cascade risk | Type II costlier — favours sensitivity |
| REVIEW quality gate | Output quality ≥ acceptance threshold | Output is substandard | False rejection → unnecessary correction loop | Pass bad output → downstream contamination | Context-dependent — safety-critical favours Type I caution |
| Calibration: parameter change | Current parameter is adequate | Parameter needs adjustment | Unnecessary adjustment → instability | Inadequate parameter persists → systematic bias | Type I costlier — favours conservatism |

**Output:** A Hypothesis Test Seed:

```typescript
interface HypothesisTestSeed {
  seedType: "statistical:hypothesis_test";
  content: string;  // "ΦL threshold test: component architect:decompose. H₀: healthy (ΦL ≥ 0.7). 
                     //  Result: fail to reject (P = 0.38, n=15). This run is within normal variation."
  nullHypothesis: string;
  alternativeHypothesis: string;
  testStatistic: number;
  pValue: number;
  effectSize: number;
  sampleSize: number;
  power: number;                 // Statistical power at observed effect size
  requiredSampleForPower80: number;  // How many more observations needed for 0.80 power
  typeIRate: number;             // α (from config)
  typeIIRate: number;            // β (computed: 1 - power)
  method: "t-test" | "mann-whitney" | "chi-square" | "permutation";
  conclusion: "reject" | "fail-to-reject" | "insufficient-power";
  // Provenance
  observationSeedIds: string[];
  resonatorPhiL: number;
}
```

**The "insufficient-power" conclusion is critical.** When sample size is too small to detect the effect size of interest at the required power level, the Resonator does not produce a "fail to reject" — it produces "insufficient power". This is the jidoka principle applied to statistical inference: the system stops and says "I cannot answer this question yet" rather than producing a false sense of confidence. The `requiredSampleForPower80` property tells downstream consumers exactly how many more observations are needed.

**Downstream consumption:**

- **Thompson Helix:** Reads the conclusion. "Insufficient power" means continue exploring — the posterior difference is not yet statistically resolvable. "Reject" (model A is better) means exploit with quantified confidence. The Helix does not need to understand the test — it reads the conclusion and the power estimate.
- **ADAPT Resonator:** Reads the ΦL threshold test. "Fail to reject" (within normal variation) → no intervention (common-cause variation — tampering would make it worse). "Reject" (degraded) → proportional intervention. "Insufficient power" → no intervention, but flag for monitoring (the system needs more data before it can decide).
- **Calibration Helix:** Reads the parameter adequacy test. "Insufficient power" at the calibration timescale (months of data) → the parameter's effect size is too small to measure, which means it probably doesn't matter — deprioritise.

### 3. ANOVA

**What it does:** Partitions variance to determine whether grouping variables (model, task type, stage, context) produce significantly different outcomes, or whether observed differences are within normal variation.

**Three ANOVA applications:**

**3a. One-way ANOVA: model performance by task type**

Reads observation Seeds, partitions by task_type property. If between-group variance is not significantly greater than within-group variance → model performs equivalently across task types → global posteriors suffice (Resolution III). If significant → statistical justification for context-blocked posteriors (Resolution IV+).

**3b. Two-way ANOVA: model × task type interaction**

The interaction effect is the formal justification for the Resolution upgrade the LSS crosswalk recommended. If interaction is significant → model A is relatively better at code than reasoning while model B shows the opposite → separate posterior distributions per context cluster are justified. If not significant → the simpler architecture wins.

**3c. Cross-stage ΦL comparison**

One-way ANOVA across stage Blooms within a pattern. Identifies whether inter-stage ΦL differences are significant or noise. Confirms or challenges the FSM's fidelity analysis from the observation data rather than from structural assessment alone.

**Output:** An ANOVA Seed:

```typescript
interface ANOVASeed {
  seedType: "statistical:anova";
  content: string;  // "Two-way ANOVA: model × task_type. Interaction F(6,84)=3.42, P=0.005. 
                     //  Significant interaction — context-specific routing justified."
  factors: string[];
  responseVariable: string;
  fStatistic: number;
  pValue: number;
  degreesOfFreedom: { between: number; within: number };
  effectSize: number;  // η² (eta-squared)
  // For two-way: main effects and interaction separately
  mainEffects?: { factor: string; fStatistic: number; pValue: number; effectSize: number }[];
  interaction?: { fStatistic: number; pValue: number; effectSize: number };
  // Conclusion
  conclusion: string;  // "Significant interaction effect. Context-specific posteriors justified."
  architecturalImplication: string;  // "Upgrade Thompson from Resolution III to Resolution IV."
  // Provenance
  observationSeedIds: string[];
  groupCounts: Record<string, number>;  // Sample size per group
  resonatorPhiL: number;
}
```

**Downstream consumption:**

- **Thompson Helix:** The ANOVA interaction finding is the structural justification for maintaining (or not maintaining) context-specific posteriors. The Helix reads the architectural implication and adjusts its own complexity accordingly. This is adaptive — the system adds routing complexity only when the data justifies it.
- **Calibration Helix:** Cross-stage ANOVA identifies which stages are statistically distinguishable in health. The Calibration Helix uses this to decide whether per-stage threshold calibration is justified or whether pattern-level thresholds suffice.

**Shewhart's insight, formalised:** The one-way ANOVA across runs is the formal common-cause / special-cause discriminator. A run whose quality is within the between-run variance is common-cause — intervention is tampering. A run whose quality exceeds the between-run variance (statistically significant outlier) is special-cause — investigation and correction are warranted. This is the statistical backbone of the SPC response protocol that the LSS crosswalk identified as needed.

### 4. Design of Experiments (DOE)

**What it does:** Structures the Thompson router's exploration budget as a principled experimental design rather than purely stochastic sampling.

**The current state:** Thompson sampling explores by drawing from posteriors. This is randomised but unstructured — it may cluster exploration trials in a burst, fail to block by context type, and operate at Resolution III (main effects only, interactions aliased).

**What DOE adds:**

**Blocking:** The Resonator reads the incoming task Seed's properties (task type, complexity, domain) and the Thompson Helix's exploration schedule. If the current block (defined by blocking variables in config Seeds) has not received exploration trials proportionally, the Resonator produces an Exploration Schedule Seed that recommends which factor combination to explore next. The Thompson Helix reads this recommendation — it is not compelled to follow it (no Prescribed Behaviour), but it has structured guidance available.

**Fractional factorial design:** When the factor space is large (4 models × 3 prompt templates × 2 temperature settings = 24 combinations), the Resonator computes a Resolution IV fractional factorial design that can estimate main effects and two-factor interactions from 8 runs. This design is expressed as an Exploration Design Seed — a Grid of factor-level combinations that maximises information per exploration trial.

```typescript
interface ExplorationDesignSeed {
  seedType: "statistical:doe_design";
  content: string;  // "Fractional factorial design: 2^(4-1) Resolution IV. 
                     //  8 runs covering 4 factors. Estimates main effects + 2FI."
  factors: { name: string; levels: string[] }[];
  designType: "full-factorial" | "fractional-factorial" | "optimal";
  resolution: number;  // III, IV, V
  runCount: number;
  designMatrix: { run: number; factors: Record<string, string> }[];
  aliasStructure?: string[];  // What's confounded at this resolution
  // Provenance
  currentObservationCount: number;
  informationGainPerRun: number;  // Expected reduction in posterior uncertainty
  resonatorPhiL: number;
}
```

**MSA equivalent (Gauge R&R):** The Resonator can perform a nested ANOVA to partition ΦL variance into repeatability (same conditions → same ΦL?) and reproducibility (different observation windows → consistent ΦL?). This is the measurement system validation that the LSS crosswalk identified as missing from SCOPE. If ΦL computed over the last 10 observations diverges significantly from ΦL computed over the last 50, the observation window parameter is a confound — and the Resonator produces a finding Seed that says so.

```typescript
interface MSASeed {
  seedType: "statistical:msa";
  content: string;  // "Gauge R&R on ΦL: repeatability σ=0.02, reproducibility σ=0.11. 
                     //  Measurement system variance is 73% reproducibility — 
                     //  observation window parameter dominates. ΦL is not stable across window sizes."
  repeatabilityVariance: number;
  reproducibilityVariance: number;
  totalMeasurementVariance: number;
  partVariance: number;   // True signal variance
  gaugeRR: number;        // Measurement variance / total variance
  conclusion: "acceptable" | "marginal" | "unacceptable";  
  // gauge R&R < 10% acceptable, 10-30% marginal, >30% unacceptable
  implication: string;
  resonatorPhiL: number;
}
```

---

## What This Does Not Do

These boundaries are non-negotiable. They prevent the Resonator from becoming an abstraction layer.

**It does not compute ΦL.** The ΦL Resonator computes ΦL. The Statistical Assessment Resonator produces confidence intervals *around* ΦL values, hypothesis tests *about* ΦL changes, and ANOVA *across* ΦL populations. It enriches the ΦL signal. It does not replace or intercept it.

**It does not update Thompson posteriors.** The Thompson Helix updates posteriors. The Statistical Assessment Resonator produces ANOVA findings about whether context-specific posteriors are justified, power analyses about whether the sample is large enough to distinguish models, and DOE schedules for structuring exploration. The Helix reads these Seeds and makes its own decisions.

**It does not trigger interventions.** The ADAPT Resonator triggers interventions. The Statistical Assessment Resonator produces common-cause/special-cause findings that ADAPT reads. ADAPT decides whether to intervene. The Resonator distinguishes signal from noise. ADAPT acts on signal.

**It does not gate execution.** No pipeline stage waits for statistical assessment before proceeding. The Resonator's output Seeds appear in the graph as observations accumulate. Consumers read them when they need to make decisions. This is consistent with v5.0's general approach: signals are continuous, not gating.

**It does not introduce new morphemes.** Every concept is expressed in the existing six morphemes. Confidence intervals, P-values, ANOVA tables, DOE matrices — all are content within Seeds. The statistical vocabulary is domain content, not grammar extension. The Resonator transforms. The Grid stores. The Helix calibrates. The Bloom contains. The Lines connect. No new structural primitives.

---

## ΦL of the Statistical Assessment Resonator

The Resonator itself has ΦL, computed from the same four factors as any other component:

| Factor | Source |
|---|---|
| **axiom_compliance** | Does the Resonator satisfy A1 (findings match reality), A3 (methods transparent), A4 (provenance complete), A6 (reads only what it needs)? |
| **provenance_clarity** | Can each finding be traced to its input observations, method, and config? |
| **usage_success_rate** | When downstream consumers act on findings, are outcomes consistent with the stated confidence? A CI that claims 95% but excludes the true value 20% of the time has poor success rate. |
| **temporal_stability** | Are the Resonator's outputs stable when re-computed on overlapping windows? High instability suggests the methods are sensitive to observation ordering. |

**The self-referential test:** The Statistical Assessment Resonator can compute confidence intervals on its own ΦL. This is legitimate self-reference (autopoietic closure), not paradox. The system that quantifies uncertainty has quantified uncertainty about its own reliability.

---

## Cascading Effects on Existing Architecture

### Thompson Router

Currently: samples from posteriors, updates Beta distributions from outcomes.
With statistical assessment: additionally reads CI Seeds to assess whether posterior differences are resolvable, ANOVA Seeds to determine whether context-specific routing is justified, DOE Seeds to structure exploration efficiently. Thompson's core mechanism is unchanged. Its informational input is enriched.

### ADAPT Resonator

Currently: reads coherence values from FLOWS_TO Lines, triggers intervention when below hysteresis-gated threshold.
With statistical assessment: additionally reads hypothesis test Seeds that classify low coherence as common-cause (don't intervene — tampering) or special-cause (investigate and correct). ADAPT's intervention logic gains the Shewhart discrimination that the LSS crosswalk identified as missing.

### Calibration Helix

Currently: operates on months-to-quarters timescale, adjusts thresholds and weights.
With statistical assessment: reads power analysis Seeds before adjusting parameters. If the sample is too small to detect the effect size of interest, the Calibration Helix defers adjustment rather than overfitting to noise. This prevents the governance system from chasing its own tail.

### Maturity Index

Currently: modulates thresholds by network maturity (young → permissive, mature → strict).
With statistical assessment: the maturity-indexed thresholds gain formal backing. In a young system, CIs are wide and power is low — aggressive thresholds would trigger on noise. The maturity index's permissive thresholds for young systems are now derivable from the statistical properties of the observation stream, not just heuristic.

### Signal Conditioning Chain

The seven signal conditioning Resonators (Debounce, Hampel, EWMA, CUSUM, MACD, Hysteresis, Trend) operate on the raw observation stream. The Statistical Assessment Resonator operates on the conditioned observation stream — it reads from the Grid *after* signal conditioning has removed noise. This is the correct sequencing: condition the signal first, then assess its statistical properties. The conditioning Resonators are upstream of the Statistical Assessment Resonator in the signal flow topology.

---

## Implementation Sequencing

This is not a milestone scope — it's a dependency map for when implementation occurs.

**Phase 1 (Minimum viable):** Confidence intervals on Thompson posteriors. This exists implicitly (Beta posteriors are distributions). Surface the CI as a Seed. Lowest effort, highest immediate value — tells the system when it doesn't have enough data to distinguish models.

**Phase 2:** Hypothesis testing on ΦL threshold crossings. Adds common-cause/special-cause discrimination to the ADAPT Resonator. Prevents the SPC cardinal sin (tampering with common-cause variation).

**Phase 3:** ANOVA across models and task types. Provides the formal justification for whether to maintain context-specific posteriors (Resolution upgrade). This is the architectural decision point — ANOVA tells you whether the added complexity of context-blocked Thompson sampling is worth it.

**Phase 4:** DOE for exploration scheduling. Structures the εR budget as fractional factorial design. Highest sophistication, requires sufficient observation volume to be meaningful.

**Phase 5:** MSA / Gauge R&R on ΦL computation. The meta-validation that the LSS crosswalk identified: is the measurement system itself reliable? Requires enough observation history to partition variance meaningfully.

---

## Document Lifecycle

This supplement extends v5.0 §Formal Calculations and §Morpheme Grounding. It does not modify existing computations — it adds statistical context that coexists alongside them. The Statistical Assessment Resonator is consumed by the same downstream decision-makers that currently consume raw point estimates, enriching their input without changing their interfaces.

When implemented, the Resonator's config Seeds live in the Constitutional Bloom (significance levels, minimum power thresholds, blocking variable definitions are governance parameters subject to the same calibration and amendment protocols as all constitutional content). The Resonator instances live in stage Blooms. The finding Seeds live in observation Grids.
