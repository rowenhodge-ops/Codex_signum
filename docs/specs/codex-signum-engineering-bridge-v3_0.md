# Codex Signum — Engineering Bridge

## Implementation Constraints and Parameter Guide

**Version:** 3.0-draft
**Companion to:** Codex Signum v5.0 (canonised at `e1f6d88`)
**Audience:** Implementors, coding agents, deployment engineers
**Date:** 2026-03-14

---

## What This Document Is

This document translates the Codex Signum specification into concrete engineering rules, parameter values, and safety constraints. If you are building an implementation, follow this document. If you need to understand *why* a rule exists, read the Codex — but you should never need to read the Codex to know *what* to build.

The Codex defines the grammar. This document tells you how to compute the grammar's properties in practice. The Bridge View Principle (Part 1.1) constrains what may appear in these computations.

**What changed from v2.0:** This version codifies the Bridge View Principle — every formula must be a pure function of grammar-defined morpheme states and axiom-defined parameters. Seven formula corrections applied from the M-17.1 delta report, including the critical dampening safety fix (F-1). Writes against a live graph of 2,425 nodes with full morpheme identity, Constitutional Bloom, INSTANTIATES wiring, and governance Resonator enforcement. Structural reframing and new sections will land in M-17.3–M-17.6.
---

## Part 1: Foundational Principle

**State Is Structural.** Every component's health, activity, and relationships must be derivable from properties stored in the same graph where its relationships live. Health is not computed *about* the system in a separate monitoring layer — it is expressed *in* the system's own structure.

**In practice:** Your graph database (Neo4j, or whatever serves) is the single source of truth for both component relationships and component health. Do not create separate health databases, monitoring tables, or status caches. The graph *is* the state.

**What this means:**

- When recording an execution outcome, write it to the graph, not to a separate log file.
- When querying a component's health, derive it from structural properties in the graph — not from a cached score in a JSON file.
- When a component degrades, its structural properties change in-graph. That change *is* the degradation signal.

**Perceptual advantage, not information-theoretic:** The advantage of structural encoding is perceptual — pre-attentive parallel processing enables faster anomaly detection than serial text-log reading. It is not an information-theoretic compression advantage. Shannon entropy applies regardless of representation. Implementations should maintain full-precision backing stores alongside any visual encoding, with the visual layer serving human observation and the backing store serving machine processing and audit.

---

## Bridge View Principle

**Every Engineering Bridge formula MUST be expressible as a pure function of grammar-defined morpheme states and axiom-defined parameters.**

No Bridge formula may introduce state, thresholds, entities, or temporal behaviour not grounded in the symbolic grammar. If a formula references a quantity, that quantity must be:

1. **A morpheme property** defined in the grammar (ΦL, ΨH, εR, content, status, seedType, lineType, etc.)
2. **An axiom-defined parameter** with a fixed recommended value (γ_base, safety_budget, hysteresis_constant, cascade_depth_limit, etc.)
3. **A topological derivation** computable from the graph structure (branching factor k, containment depth, Line count, λ₂, etc.)

If a formula references anything else — an entity not in the grammar, a threshold without axiomatic grounding, temporal behaviour not derivable from observation Seeds — it fails the Bridge View Principle and must be either grounded or removed.

**Audit criterion:** For every formula `f` in this document, it must be possible to write:

```
f(morpheme_states, axiom_parameters, topology) → result
```

where `morpheme_states` are properties on nodes and relationships in the graph, `axiom_parameters` are constants defined in the Codex spec, and `topology` is derivable from graph structure via Cypher queries.

**Origin:** Discovered during M-8A (session t15). This single principle resolved nine M-8A recommendations (F-2, F-4, F-7, AI-03, AI-07, AI-09, C-03, C-07, C-10). Codified in M-17.2.

---

## Part 2: Computing the Three State Dimensions

### ΦL — Health Score

A composite score from 0.0 to 1.0. Computed as:

```
ΦL = wâ‚ × axiom_compliance +
     w₂ × provenance_clarity +
     w₃ × usage_success_rate +
     w₄ × temporal_stability

where wâ‚ + w₂ + w₃ + w₄ = 1.0
```

**Recommended weights:** wâ‚ = 0.4, w₂ = 0.2, w₃ = 0.2, w₄ = 0.2

**Factor definitions:**

| Factor | How to compute | Notes |
|---|---|---|
| axiom_compliance | Fraction of 8 axioms satisfied (A1–A4, A6–A9) | Includes grammar rule adherence (the former `grammar_alignment_factor` now lives here) |
| provenance_clarity | 0.0 = unknown origin, 1.0 = full chain documented | Can you trace any output back to its input, model, and execution context? |
| usage_success_rate | Fraction of invocations completing without error | From sliding window of recent observations |
| temporal_stability | Consistency of ΦL over the observation window | Low variance = stable |

**Maturity modifier:**

```
ΦL_effective = ΦL_raw × maturity_factor

maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
```

At 50+ observations and 3+ connections, maturity_factor approaches 1.0. At 0 observations or 0 connections, it approaches 0.

**Recency weighting:**

```
observation_weight = e^(-λ × age)
```

Set λ based on rate of change. Model performance: half-life of days to weeks. Schema definitions: half-life of months. Compaction threshold: discard raw observations when weight < 0.01 (statistical contribution already absorbed into running averages).

**Sliding window implementation:** Use count-based ring buffers with subtract-on-evict for O(1) snapshot retrieval. Window sizes should be topology-dependent:

| Node type | Window size N | Rationale |
|---|---|---|
| Leaf / function | 10–20 | Fast local response |
| Intermediate / pattern | 30–50 | Balance sensitivity with stability |
| Root / coordinator | 50–100 | Stability against individual child fluctuations |

**Adaptive thresholds — maturity-indexed:**

```
maturity_index = min(1.0,
    0.25 × normalize(mean_observation_depth) +
    0.25 × normalize(connection_density) +
    0.25 × normalize(mean_component_age) +
    0.25 × normalize(mean_ΦL_ecosystem)
)
```

| Threshold | Young (MI < 0.3) | Maturing (0.3–0.7) | Mature (MI > 0.7) |
|---|---|---|---|
| ΦL healthy | > 0.6 | > 0.7 | > 0.8 |
| ΦL degraded | < 0.4 | < 0.5 | < 0.6 |
| εR stable range | 0.10–0.40 | 0.05–0.30 | 0.01–0.15 |
| ΨH dissonance | > 0.25 | > 0.20 | > 0.15 |

**Threshold learning:** Thresholds themselves are learnable parameters. Track false positives (healthy things that failed), false negatives (sick things rated healthy), and oscillation events (components flapping near a threshold). Feed these into a calibration process operating monthly to quarterly.

### ΨH — Harmonic Signature (Two-Component)

**This replaces the v1.0 `grammar_alignment_factor` approach entirely.**

ΨH is computed from two independent components of the composition's graph:

**Component 1 — Structural Coherence (λ₂):**

```
L = D - A    (graph Laplacian)
λ₂ = second-smallest eigenvalue of L
```

For typical compositions of 3–20 components, this is a few milliseconds of computation. Use any standard linear algebra library (NumPy, LAPACK, etc.).

| λ₂ | State | Meaning |
|---|---|---|
| Near 0 | Fragile | Single point of failure in connectivity |
| Moderate | Connected | Multiple paths; can sustain connection loss |
| High | Robust | Densely connected; structurally over-determined |

"Near 0" / "moderate" / "high" are relative to composition size. Normalise by dividing by the expected λ₂ for a composition of that size and maturity.

**Component 2 — Runtime Friction (TV_G):**

```
TV_G(x) = Σ(i,j)∈E  aᵢⱼ × (xᵢ - xⱼ)²

friction = mean([TV_G(x) / max_TV_G(x) for x in monitored_signals])
```

Compute per signal (latency, confidence, success rate, ΦL). Normalise to [0, 1].

| Friction | State | Action |
|---|---|---|
| < 0.2 | Resonant | Normal operation |
| 0.2–0.5 | Working | Monitor |
| 0.5–0.8 | Strained | Investigate; flag for structural review |
| > 0.8 | Dissonant | Composition is fighting itself; redesign |

**Composite ΨH:**

```
ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction)
```

Runtime friction weighted higher because it reflects actual operational coherence.

**Pre-composition resonance check:** Before committing to a new composition, compute λ₂ of the proposed subgraph. If it falls below the maturity-indexed threshold, flag as structurally fragile. This is not a gate — it is a visible warning. Cost: trivial (single eigenvalue of a small matrix).

**Key diagnostic signal:** High λ₂ + high friction = the most informative dissonance. The graph says components *should* work together but operationally they don't. Investigate: different processing speeds, incompatible output formats, semantic drift.

### εR — Exploration Rate

```
εR = exploratory_decisions / total_decisions
```

Over a rolling observation window.

| εR | Status | Action |
|---|---|---|
| 0.0 | Rigid | **Warning.** Force minimum exploration. |
| 0.01–0.10 | Stable | Normal. Light exploration. |
| 0.10–0.30 | Adaptive | Active learning. Expected when environment changes. |
| > 0.30 | Unstable | Confidence collapsed or system is very new. Investigate. |

**Critical rule:** High ΦL with zero εR is a warning, not a success.

**Imperative gradient modulation:**

```
εR_floor = base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient))
```

Recommended `gradient_sensitivity`: 0.05–0.15. When Ω gradients are positive, the correction term is zero.

**Spectral calibration (complementary signal):**

```
εR_floor = max(
    base_εR + (gradient_sensitivity × max(0, -Ω_aggregate_gradient)),
    min_εR_for_spectral_state(spectral_ratio)
)
```

| Spectral Ratio | Minimum εR |
|---|---|
| > 0.9 | 0.05 |
| 0.7–0.9 | 0.02 |
| 0.5–0.7 | 0.01 |
| < 0.5 | 0.0 |

---

## Part 3: Degradation Cascade — Parameters

### Topology-Aware Dampening

**This replaces the fixed γ=0.7 from v1.0.**

```
impact_at_container = component_ΦL_drop × component_weight × γ_effective(k)

γ_effective = min(γ_base, s / k)    where s = 0.8 (safety budget), γ_base = 0.7
```

Where k = degree of the receiving node (number of connections). The budget-capped formula guarantees spectral radius μ = k × γ ≤ s = 0.8 < 1 for ALL k ≥ 1, providing topology-independent subcriticality.

| Branching Factor (k) | γ_eff (s=0.8) | μ = k×γ | Status |
|---|---|---|---|
| 1 | 0.7 | 0.7 | Subcritical ✓ |
| 2 | 0.4 | 0.8 | Subcritical ✓ |
| 3 | 0.267 | 0.8 | Subcritical ✓ |
| 5 | 0.16 | 0.8 | Subcritical ✓ |
| 10 | 0.08 | 0.8 | Subcritical ✓ |

**Why this matters:** γ=0.7 is supercritical for all tree topologies with branching factor ≥ 2. The 2-level cascade limit is the system's primary safety mechanism — without it, failures propagate to root. The budget-capped formula ensures the system is intrinsically subcritical: failures attenuate faster than they accumulate. This single formula handles all topologies including high-degree nodes.

> **History:** Prior formulas (v1: `0.8/(k-1)`, v2: separate high-degree formula) were found supercritical for k ≥ 3. Budget-capped formula `min(γ_base, s/k)` is the only topology-independent subcriticality guarantee. See Safety Analysis paper and commit `ce0ef96`.
**Algedonic bypass:** Any agent with ΦL < 0.1 (emergency threshold) should propagate to root with γ = 1.0, bypassing all dampening. This preserves the cascade limit for normal operations while ensuring existential threats are never masked.

### Cascade Limit

**2 levels. This is not negotiable.** It is the primary safety mechanism, not a convenience.

A failing Seed dims its Bloom. A failing Bloom dims its containing Bloom. The parent Bloom recomputes from its own constituents with the dampened signal already attenuated. Without the 2-level limit at k=2, the expected cascade size converges to 5.0 nodes (geometric series with μ=0.8); with the depth limit, it drops to 1 + μ + μ² = 2.44 nodes. The formula guarantees convergence — cascade size is bounded for all topologies.

### Hysteresis

**Recovery is 2.5× slower than degradation.** (Changed from 1.5× in v1.0.)

If a model takes N observations to be marked degraded, it takes roughly 2.5N observations of sustained improvement to return to healthy. This prevents flapping (state chatter) near thresholds.

**Why 2.5×:** The 1.5× ratio from v1.0 is below Schmitt trigger engineering standards. For Gaussian noise with EWMA smoothing (α=0.2) and σ=0.05, filtered noise V_pp ≈ 0.10. The hysteresis band should be 0.20–0.30 (2–3× V_pp). At 1.5× V_pp = 0.15, the system is vulnerable to flapping under bursty or non-stationary noise. 2.5× provides margin for real-world conditions.

**Implementation:** Use separate thresholds for degradation and recovery:

```
degradation_threshold = 0.50    (or maturity-indexed equivalent)
recovery_threshold = degradation_threshold × 2.5 = 0.75
```

Additionally, require state persistence: N consecutive observations beyond threshold before state transition (recommended N = 3–5). This acts as debouncing.

### Recovery Model

Recovery dampening should be linear with a cap, not exponential:

```
recovery_delay = base_delay × (1 + 0.2 × failure_count)
capped at: 10 × base_delay
```

Where failure_count is the number of degradation events for this component in the current observation window. α ∈ [0.15, 0.25] is the accumulation rate.

**Exponential backoff with jitter for retry timing:**

```
actual_delay = random(0, min(base × 1.5^attempt, 300_seconds))
```

Full jitter is mandatory (reduces server load by >50% vs. synchronised backoff per AWS architecture guidance). Cap at 300 seconds (5 minutes) to prevent indefinite isolation.

**Half-open state for recovery:** After backoff period, run 5–10 trial probes before declaring recovery. This matches the circuit breaker pattern (Resilience4j).

---

## Part 4: Signal Conditioning Pipeline

Raw health events should be processed through this seven-stage pipeline before being used for threshold decisions:

| Stage | Purpose | Parameters |
|---|---|---|
| 1. **Debounce** | Suppress duplicate events | Within 100ms; require persistence for 2–3 event intervals |
| 2. **Hampel filter** | Reject outliers | 7-point window (k=3); flag where \|x − median\| > 3 × 1.4826 × MAD; replace with local median |
| 3. **EWMA smoothing** | Noise reduction | S_t = α·x_t + (1−α)·S_{t-1}; α = 0.25 for leaves, 0.15 default, 0.08 for hubs |
| 4. **CUSUM monitoring** | Detect mean shifts | C_t = max(0, C_{t-1} + x_t − μ₀ − δ/2); threshold h ≈ 4–5 |
| 5. **MACD derivative** | Rate-of-change detection | Difference of fast EWMA (α=0.25) and slow EWMA (α=0.04) |
| 6. **Hysteresis threshold** | Prevent flapping | Alarm ON when S_t < T_low; OFF when S_t > T_high; band ≥ 2× V_pp |
| 7. **Trend regression** | Predictive warning | Linear fit over 30–50 events; alarm if projected time-to-threshold < warning horizon |

**The derivative term (Stage 5) is critical.** Absolute thresholds detect degradation only after crossing a fixed level. Rate-of-change detection identifies rapid degradation *before* the threshold is reached. A system degrading from ΦL = 0.9 to 0.6 in 5 events is far more alarming than one at steady ΦL = 0.55.

**Early warning signals for cascading failure (from critical slowing down theory):**

- Variance increases — reduced recovery rate causes health fluctuations to grow
- Autocorrelation increases — health signals become more serially correlated
- Cross-agent correlation rises — previously independent failure signals begin correlating (strongest cascade predictor)

---

## Part 5: Visual Encoding Constraints

### Pulsation Frequency Safety

**SAFETY CRITICAL: All pulsation must be 0.5–3 Hz.** The 8–15 Hz range, while perceptually salient, overlaps with the peak epilepsy risk zone (5–30 Hz, peak at 15–20 Hz per Epilepsy Foundation). WCAG 2.3.1 mandates no more than 3 flashes per second. Section 508 prohibits flickering between 2–55 Hz. ISO 9241-391 harmonises with these standards.

| Urgency | Pulsation Rate |
|---|---|
| Low / heartbeat / normal | 0.5–1 Hz |
| Moderate / active | 1–2 Hz |
| Critical / alert | 2–3 Hz |

The "calming heartbeat" association at 1 Hz is design intuition (resting heart rate = 60–80 bpm = 1.0–1.3 Hz), not established science. Higher pulse rates increase perceived urgency — this is well-supported.

### Luminance and Color Channels

**Luminance:** The primary health channel. Use 5–10 discriminable levels (Weber-Fechner limits discrimination to ~7–8 bits per channel, but practical discrimination with background variation is lower). Map linearly: bright = healthy, dim = degraded, dark = dead.

**Color (Hue):** Use for domain/type classification, not health encoding. 8–12 hue categories maximum (depends on display technology and ambient conditions). Color semantics are NOT culturally universal — pulsation and luminance have stronger cross-cultural grounding. Avoid relying on red/green distinctions (colour vision deficiency affects ~8% of males).

**Perceptual grounding strength by channel:**

| Channel | Grounding | Notes |
|---|---|---|
| Pulsation | Strong (innate) | Vertebrate "life detector"; no learning required |
| Spatial proximity | Strong (Gestalt) | "Close items go together" is near-universal |
| Luminance | Moderate | Brightness-positive valence is broadly cross-cultural; specific health mapping must be learned |
| Color | Weak | Highly culture-specific; never use as sole encoding channel |

### Working Memory Constraints

**Visual working memory is 3–4 integrated objects, not 7.** Miller's 7±2 applies to verbal short-term memory. Operators cannot actively hold more than ~4 glyph states in working memory simultaneously. For monitoring displays with dozens of elements, rely on pre-attentive pop-out to flag state changes rather than expecting operators to maintain continuous awareness.

Dashboard modules beyond 9 simultaneously displayed elements overwhelm operators. Design for "overview first, zoom and filter, then details-on-demand" (Shneiderman's mantra).

**Multi-layered interpretation:** 2–3 layers is the practical ceiling for general users. Specialist systems can support 3–5 layers with trained operators. Implement adaptive display: novice mode with explicit labels and simpler states; expert mode with denser information. A single fixed display cannot optimally serve both populations (expertise reversal effect — Kalyuga et al. 2003).

---

## Part 6: Seven CAS Vulnerability Watchpoints

These are architectural vulnerabilities identified by the Complex Adaptive Systems literature review. They are not bugs to fix — they are structural risks to monitor.

### 1. HOT Fragility (Highly Optimised Tolerance)

Any optimised system is hypersensitive to unanticipated perturbations. **This is a mathematical inevitability of optimisation, not a risk to eliminate.** Explicitly catalogue what the system is robust to and what it is fragile to. Monitor for perturbation types outside the designed-for set.

### 2. Cascading Failures in Interdependent Subsystems

Interdependent networks undergo first-order (abrupt) phase transitions, not gradual degradation. Broader degree distributions *increase* vulnerability (opposite of isolated networks). **Mitigation:** Reduce coupling strength between subsystems. The topology-aware dampening and 2-level cascade limit are the primary defences. Monitor for correlated failures across subsystem boundaries.

### 3. Complexity Catastrophe

As epistatic interactions increase relative to system components in NK models, reachable fitness optima converge toward mean fitness. **Keep interaction complexity moderate.** Modular design (low inter-module coupling, higher intra-module coupling) preserves navigability. Monitor adaptive walk lengths: if improvements require increasingly many steps, the landscape is too rugged.

### 4. Lock-In and Path Dependence

Use-based selection without diversity-maintenance mechanisms is vulnerable to Matthew effects and premature convergence (demonstrated in MusicLab studies). **Mitigation:** εR minimum floor (never zero); challenge seeds for mature networks; diversity metrics on pattern compositions.

### 5. Parasitic Pattern Propagation

Patterns that satisfy selection criteria (high ΦL) without providing genuine utility. They game the metrics. **Detection:** High pattern turnover with no Ω gradient improvement. New patterns structurally similar to predecessors (ΨH within 0.05). Rising compute cost without rising capability.

### 6. Inadequate Measurement

Emergence claims without measurement frameworks are unfalsifiable. **Required:** Power-law testing via Clauset et al. methodology before claiming scale-free properties. Critical slowing down indicators (Scheffer et al.) for cascade approach warning. Do not claim emergence without measurable evidence.

### 7. Emergence Inflation

The gap between CAS theory and CAS engineering remains unsolved. Holland's ECHO model failed to produce emergent hierarchical complexity. **Approach:** Build for utility at current scale. Do not design for hypothetical emergence. If emergence occurs, measure it. If it doesn't, the system is still useful.

---

## Part 7: Memory Sizing Guide

| Stratum | Records Per | Record Size | Growth Rate | Retention |
|---|---|---|---|---|
| 1. Ephemeral | Execution | 1–10 KB | Constant (replaced per execution) | Seconds to minutes |
| 2. Observational | Component | 100–500 bytes | ~N obs/day per component | Rolling window (~5× half-life) |
| 3. Distilled | Composition | 1–5 KB per insight | ~1 per learning cycle | Months to years |
| 4. Institutional | Ecosystem | 5–50 KB per archetype | ~1 per evolution cycle | Years |

**Example sizing (100 active components, 20 compositions, 2-week half-life):**

- Stratum 2: ~100 × 70 days × 10 obs/day × 300 bytes ≈ 20 MB (rolling, not growing)
- Stratum 3: ~20 × 50 insights × 3 KB ≈ 3 MB (growing slowly)
- Stratum 4: ~100 archetypes × 25 KB ≈ 2.5 MB (growing very slowly)

Total active memory: ~25 MB. Stratum 2 is bounded by the compaction window, not by time.

---

## Part 8: Structural Review Trigger Conditions

Structural reviews are event-triggered, not scheduled. Run one when any of these fire:

| Trigger | Threshold | What to compute |
|---|---|---|
| λ₂ drop on composition change | Below maturity-indexed threshold | Full spectral analysis |
| Friction spike | Sustained above 0.5 beyond Correction Helix temporal constant | Friction distribution across all compositions |
| Cascade activation | Degradation reaches 2nd containment level | Hub dependency analysis |
| εR spike at composition level | Above maturity-indexed stable range | Spectral ratio and aligned/liberal energy |
| ΦL velocity anomaly | > 0.05/day ecosystem-wide | Global λ₂ and spectral gap |
| Ω gradient inversion | Any gradient negative after sustained positive | Full review |

**Review outputs feed existing feedback, not new channels:** Hub dependency → Scale 2 routing. Dampening recommendations → Calibration. Friction hotspots → Scale 2 evaluation. Global λ₂ trend → Scale 3 ecosystem health.

---

## Part 9: Adversarial Resilience Parameters

### Anomaly Detection Thresholds

| Signal | Normal Range | Anomaly |
|---|---|---|
| Node creation rate | Seasonal/usage patterns | > 3σ spike above rolling mean |
| Connection formation rate | Proportional to node creation | Disproportionate to node creation |
| Mean ΦL velocity | < 0.05/day | > 0.1/day |
| ΨH distribution entropy | Stable or slowly increasing | Sudden collapse |
| Federation gossip volume | Proportional to activity | Disproportionate spike |

### Bulkhead Responses

When ecosystem stress index exceeds warning threshold:

| Response | Parameters | Recovery |
|---|---|---|
| Federation isolation | Quarantine gossip from anomalous nodes | Lift when behaviour returns to normal range |
| Acceptance rate limiting | Throttle new pattern acceptance; queue and absorb gradually | Ease back to normal over days, not hours |
| Cascade dampening override | γ_override = γ_effective × stress_reduction_factor (stress_reduction_factor = 0.5 during stress) | Reduces propagation to half of topology-computed dampening
| Provenance weighting increase | Temporarily increase w₂ in ΦL calculation | Restore gradually |

**Recovery from attack is deliberately slow.** Match hysteresis principle: 2.5× longer to restore normal operation than to engage defences. This prevents snap-back vulnerability to follow-up attacks.

---

## Part 10: Pattern-Level Guidance

These are pattern design considerations — guidance for building good patterns using the Codex grammar. They are NOT part of the Codex specification. They belong here because they inform implementation decisions.

### Rolled Throughput Yield (RTY)

For multi-stage patterns, track the product of per-stage success rates:

```
RTY = Π(stage_success_rate for each stage)
```

RTY reveals hidden rework. A 3-stage pipeline with 95% per-stage success has RTY = 0.857, not 0.95. If any stage requires correction loops, include correction success rate in the computation.

### Error Classification (Poka-Yoke Levels)

When implementing error handling in patterns, classify by severity and appropriate response:

| Level | Error Type | Pattern Response |
|---|---|---|
| Prevention | Invalid input detected before processing | Reject at Bloom boundary; emit validation failure |
| Detection | Error caught during transformation | Correction Helix retry with structured feedback |
| Mitigation | Error propagated but contained | Reduce ΦL; route around via εR sampling |
| Escape | Error reached output | Degradation signal; cascade to container |

### Failure Mode Analysis

For critical patterns, enumerate failure modes and their structural signals:

| Failure Mode | ΦL Signal | εR Signal | ΨH Signal |
|---|---|---|---|
| Model degradation | usage_success_rate drops | May spike (exploring alternatives) | Friction increases on latency/quality |
| Data drift | temporal_stability drops | Should spike (environment changed) | λ₂ unchanged; friction increases |
| Integration failure | axiom_compliance drops | No change | λ₂ may drop; friction high |
| Capacity exhaustion | temporal_stability drops (latency variance) | Should remain stable | No change |

---

## Anti-Patterns

**Separate monitoring database.** Do not create a health-scores cache that is the source of truth. Caching is acceptable for performance; the graph is always authoritative.

**Morpheme labels on code.** Do not add `morphemeType: 'seed'` fields. The morpheme type *is* the structure — a function is a Seed because of what it does, not because of a label.

**Assigned resonance.** Do not set `ΨH = 0.95` as a property. Resonance emerges from structural coherence (λ₂) and operational friction (TV_G). You compute it; you don't assign it.

**Silent routing around failure.** When a component fails and the router switches to an alternative, this must be a visible event. The system's users need to know adaptation is happening.

**Forced revival of archived components.** If a component has been dimming through disuse, do not forcibly revive it. Either reconnect it intentionally or let it archive naturally.

**Immediate blacklisting.** A single failure should not permanently exclude a component. Selection pressure (reduced ΦL, lower sampling probability) achieves gradual quarantine.

**Fixed dampening for all topologies.** Do not use γ=0.7 everywhere. Compute γ_effective = min(γ_base, safety_budget/k) from the local branching factor. The general formula handles all topologies including hubs — do not create separate hub formulas.

---

## Glossary

| Codex Term | Engineering Equivalent |
|---|---|
| Seed (•) | Atomic component — function, service, data point |
| Line (→) | Connection — data flow, dependency, feedback path |
| Bloom (○) | Boundary — pipeline stage, module scope, service boundary |
| Resonator (Δ) | Transformation — where input becomes output, routing decision |
| Grid (□) | Knowledge structure — graph, schema, persistent storage |
| Helix (🌀) | Feedback loop — correction retry, learning cycle, evolutionary selection |
| ΦL | Health score — composite of success rate, compliance, provenance, stability |
| ΨH | Harmonic signature — two-component: λ₂ (structural coherence) + TV_G (runtime friction) |
| εR | Exploration rate — fraction of decisions sampling uncertain alternatives |
| γ_effective | Topology-aware dampening — min(γ_base, safety_budget/k) where γ_base=0.7, safety_budget=0.8, k=branching factor (CONTAINS Line count)
| Luminance | Health visibility — bright = healthy, dim = degraded, dark = dead |
| Dormant | Built but not connected — exists but not wired into active flow |
| Hysteresis | Recovery is 2.5× slower than degradation — prevents flapping |
| Cascade limit | Degradation propagates at most 2 containment levels — primary safety mechanism |
| Maturity index | Network-wide experience metric — modulates thresholds |
| TV_G | Graph Total Variation — measures signal smoothness across connections |
| λ₂ | Fiedler value — algebraic connectivity of graph Laplacian |

---

*This document derives from Codex Signum v5.0 (canonised at e1f6d88, 2026-03-12). The Bridge View Principle governs all formulas: every computation must be a pure function of grammar-defined morpheme states and axiom-defined parameters. The Codex defines the grammar. This document defines how to compute the grammar's properties. When in doubt about implementation, follow this document. When in doubt about intent, read the Codex.*
