# Codex Signum â€” Engineering Bridge

## Implementation Constraints and Parameter Guide

**Version:** 2.0
**Companion to:** Codex Signum v3.0 (Consolidated Specification)
**Audience:** Implementors, coding agents, deployment engineers
**Date:** 2026-02-14

---

## What This Document Is

This document translates the Codex Signum specification into concrete engineering rules, parameter values, and safety constraints. If you are building an implementation, follow this document. If you need to understand *why* a rule exists, read the Codex â€” but you should never need to read the Codex to know *what* to build.

The Codex defines the grammar. This document tells you how to compute the grammar's properties in practice.

**What changed from v1.0:** This version absorbs parameter corrections and safety constraints derived from ten research papers (see companion Research Index). Key changes: topology-aware dampening replaces fixed Î³=0.7; hysteresis ratio increased from 1.5Ã— to 2.5Ã—; Î¨H computation replaced entirely; signal conditioning pipeline added; pulsation frequency safety limits added; seven CAS vulnerability watchpoints added; visual encoding constraints formalised.

---

## Part 1: Foundational Principle

**State Is Structural.** Every component's health, activity, and relationships must be derivable from properties stored in the same graph where its relationships live. Health is not computed *about* the system in a separate monitoring layer â€” it is expressed *in* the system's own structure.

**In practice:** Your graph database (Neo4j, or whatever serves) is the single source of truth for both component relationships and component health. Do not create separate health databases, monitoring tables, or status caches. The graph *is* the state.

**What this means:**

- When recording an execution outcome, write it to the graph, not to a separate log file.
- When querying a component's health, derive it from structural properties in the graph â€” not from a cached score in a JSON file.
- When a component degrades, its structural properties change in-graph. That change *is* the degradation signal.

**Perceptual advantage, not information-theoretic:** The advantage of structural encoding is perceptual â€” pre-attentive parallel processing enables faster anomaly detection than serial text-log reading. It is not an information-theoretic compression advantage. Shannon entropy applies regardless of representation. Implementations should maintain full-precision backing stores alongside any visual encoding, with the visual layer serving human observation and the backing store serving machine processing and audit.

---

## Part 2: Computing the Three State Dimensions

### Î¦L â€” Health Score

A composite score from 0.0 to 1.0. Computed as:

```
Î¦L = wâ‚ Ã— axiom_compliance +
     wâ‚‚ Ã— provenance_clarity +
     wâ‚ƒ Ã— usage_success_rate +
     wâ‚„ Ã— temporal_stability

where wâ‚ + wâ‚‚ + wâ‚ƒ + wâ‚„ = 1.0
```

**Recommended weights:** wâ‚ = 0.4, wâ‚‚ = 0.2, wâ‚ƒ = 0.2, wâ‚„ = 0.2

**Factor definitions:**

| Factor | How to compute | Notes |
|---|---|---|
| axiom_compliance | Fraction of 10 axioms satisfied (binary per axiom) | Includes grammar rule adherence (the former `grammar_alignment_factor` now lives here) |
| provenance_clarity | 0.0 = unknown origin, 1.0 = full chain documented | Can you trace any output back to its input, model, and execution context? |
| usage_success_rate | Fraction of invocations completing without error | From sliding window of recent observations |
| temporal_stability | Consistency of Î¦L over the observation window | Low variance = stable |

**Maturity modifier:**

```
Î¦L_effective = Î¦L_raw Ã— maturity_factor

maturity_factor = (1 - e^(-0.05 Ã— observations)) Ã— (1 - e^(-0.5 Ã— connections))
```

At 50+ observations and 3+ connections, maturity_factor approaches 1.0. At 0 observations or 0 connections, it approaches 0.

**Recency weighting:**

```
observation_weight = e^(-Î» Ã— age)
```

Set Î» based on rate of change. Model performance: half-life of days to weeks. Schema definitions: half-life of months. Compaction threshold: discard raw observations when weight < 0.01 (statistical contribution already absorbed into running averages).

**Sliding window implementation:** Use count-based ring buffers with subtract-on-evict for O(1) snapshot retrieval. Window sizes should be topology-dependent:

| Node type | Window size N | Rationale |
|---|---|---|
| Leaf / function | 10â€“20 | Fast local response |
| Intermediate / pattern | 30â€“50 | Balance sensitivity with stability |
| Root / coordinator | 50â€“100 | Stability against individual child fluctuations |

**Adaptive thresholds â€” maturity-indexed:**

```
maturity_index = min(1.0,
    0.25 Ã— normalize(mean_observation_depth) +
    0.25 Ã— normalize(connection_density) +
    0.25 Ã— normalize(mean_component_age) +
    0.25 Ã— normalize(mean_Î¦L_ecosystem)
)
```

| Threshold | Young (MI < 0.3) | Maturing (0.3â€“0.7) | Mature (MI > 0.7) |
|---|---|---|---|
| Î¦L healthy | > 0.6 | > 0.7 | > 0.8 |
| Î¦L degraded | < 0.4 | < 0.5 | < 0.6 |
| ÎµR stable range | 0.10â€“0.40 | 0.05â€“0.30 | 0.01â€“0.15 |
| Î¨H dissonance | > 0.25 | > 0.20 | > 0.15 |

**Threshold learning:** Thresholds themselves are learnable parameters. Track false positives (healthy things that failed), false negatives (sick things rated healthy), and oscillation events (components flapping near a threshold). Feed these into a calibration process operating monthly to quarterly.

### Î¨H â€” Harmonic Signature (Two-Component)

**This replaces the v1.0 `grammar_alignment_factor` approach entirely.**

Î¨H is computed from two independent components of the composition's graph:

**Component 1 â€” Structural Coherence (Î»â‚‚):**

```
L = D - A    (graph Laplacian)
Î»â‚‚ = second-smallest eigenvalue of L
```

For typical compositions of 3â€“20 components, this is a few milliseconds of computation. Use any standard linear algebra library (NumPy, LAPACK, etc.).

| Î»â‚‚ | State | Meaning |
|---|---|---|
| Near 0 | Fragile | Single point of failure in connectivity |
| Moderate | Connected | Multiple paths; can sustain connection loss |
| High | Robust | Densely connected; structurally over-determined |

"Near 0" / "moderate" / "high" are relative to composition size. Normalise by dividing by the expected Î»â‚‚ for a composition of that size and maturity.

**Component 2 â€” Runtime Friction (TV_G):**

```
TV_G(x) = Î£(i,j)âˆˆE  aáµ¢â±¼ Ã— (xáµ¢ - xâ±¼)Â²

friction = mean([TV_G(x) / max_TV_G(x) for x in monitored_signals])
```

Compute per signal (latency, confidence, success rate, Î¦L). Normalise to [0, 1].

| Friction | State | Action |
|---|---|---|
| < 0.2 | Resonant | Normal operation |
| 0.2â€“0.5 | Working | Monitor |
| 0.5â€“0.8 | Strained | Investigate; flag for structural review |
| > 0.8 | Dissonant | Composition is fighting itself; redesign |

**Composite Î¨H:**

```
Î¨H = 0.4 Ã— normalize(Î»â‚‚) + 0.6 Ã— (1 - friction)
```

Runtime friction weighted higher because it reflects actual operational coherence.

**Pre-composition resonance check:** Before committing to a new composition, compute Î»â‚‚ of the proposed subgraph. If it falls below the maturity-indexed threshold, flag as structurally fragile. This is not a gate â€” it is a visible warning. Cost: trivial (single eigenvalue of a small matrix).

**Key diagnostic signal:** High Î»â‚‚ + high friction = the most informative dissonance. The graph says components *should* work together but operationally they don't. Investigate: different processing speeds, incompatible output formats, semantic drift.

### ÎµR â€” Exploration Rate

```
ÎµR = exploratory_decisions / total_decisions
```

Over a rolling observation window.

| ÎµR | Status | Action |
|---|---|---|
| 0.0 | Rigid | **Warning.** Force minimum exploration. |
| 0.01â€“0.10 | Stable | Normal. Light exploration. |
| 0.10â€“0.30 | Adaptive | Active learning. Expected when environment changes. |
| > 0.30 | Unstable | Confidence collapsed or system is very new. Investigate. |

**Critical rule:** High Î¦L with zero ÎµR is a warning, not a success.

**Imperative gradient modulation:**

```
ÎµR_floor = base_ÎµR + (gradient_sensitivity Ã— max(0, -Î©_aggregate_gradient))
```

Recommended `gradient_sensitivity`: 0.05â€“0.15. When Î© gradients are positive, the correction term is zero.

**Spectral calibration (complementary signal):**

```
ÎµR_floor = max(
    base_ÎµR + (gradient_sensitivity Ã— max(0, -Î©_aggregate_gradient)),
    min_ÎµR_for_spectral_state(spectral_ratio)
)
```

| Spectral Ratio | Minimum ÎµR |
|---|---|
| > 0.9 | 0.05 |
| 0.7â€“0.9 | 0.02 |
| 0.5â€“0.7 | 0.01 |
| < 0.5 | 0.0 |

---

## Part 3: Degradation Cascade â€” Parameters

### Topology-Aware Dampening

**This replaces the fixed Î³=0.7 from v1.0.**

```
impact_at_container = component_Î¦L_drop Ã— component_weight Ã— Î³_effective(k)

Î³_effective = min(0.7, 0.8 / (k - 1))    for k > 1
Î³_effective = 0.7                          for k â‰¤ 1
```

Where k = branching factor (number of children whose health propagates to this node).

| Branching Factor (k) | Maximum Î³ | Recommended Î³ | 2-level attenuation |
|---|---|---|---|
| 1 | No constraint | 0.7 | 0.49 |
| 2 | < 1.0 | 0.7 | 0.49 |
| 3 | < 0.5 | 0.4 | 0.16 |
| 4 | < 0.33 | 0.27 | 0.07 |
| 5+ | < 0.25 | 0.2 | 0.04 |

**Why this matters:** Î³=0.7 is supercritical for all tree topologies with branching factor â‰¥ 2. The 2-level cascade limit is the system's primary safety mechanism â€” without it, failures propagate to root. The topology-aware formula ensures the system is intrinsically subcritical: failures attenuate faster than they accumulate.

**Hub dampening:** For high-degree hub nodes specifically, use Î³_base/âˆšk (not Î³_base/degree, which is over-aggressive). This maintains constant signal-to-noise ratio at the parent because k independent noise sources aggregate with standard deviation proportional to âˆšk.

| Hub degree | Î³_base/degree (too aggressive) | Î³_base/âˆšk (recommended) |
|---|---|---|
| 5 | 0.14 | 0.31 |
| 10 | 0.07 | 0.22 |
| 20 | 0.035 | 0.16 |

**Algedonic bypass:** Any agent with Î¦L < 0.1 (emergency threshold) should propagate to root with Î³ = 1.0, bypassing all dampening. This preserves the cascade limit for normal operations while ensuring existential threats are never masked.

### Cascade Limit

**2 levels. This is not negotiable.** It is the primary safety mechanism, not a convenience.

A failing Seed dims its Bloom. A failing Bloom dims its containing Grid. The Grid's container recomputes from its own constituents with the dampened signal already attenuated. Without the 2-level limit at Î³=0.7, expected cascade size for a binary tree is 4.36 nodes; with topology-aware dampening plus 2-level limit, it drops to 2.44 nodes.

### Hysteresis

**Recovery is 2.5Ã— slower than degradation.** (Changed from 1.5Ã— in v1.0.)

If a model takes N observations to be marked degraded, it takes roughly 2.5N observations of sustained improvement to return to healthy. This prevents flapping (state chatter) near thresholds.

**Why 2.5Ã—:** The 1.5Ã— ratio from v1.0 is below Schmitt trigger engineering standards. For Gaussian noise with EWMA smoothing (Î±=0.2) and Ïƒ=0.05, filtered noise V_pp â‰ˆ 0.10. The hysteresis band should be 0.20â€“0.30 (2â€“3Ã— V_pp). At 1.5Ã— V_pp = 0.15, the system is vulnerable to flapping under bursty or non-stationary noise. 2.5Ã— provides margin for real-world conditions.

**Implementation:** Use separate thresholds for degradation and recovery:

```
degradation_threshold = 0.50    (or maturity-indexed equivalent)
recovery_threshold = degradation_threshold Ã— 2.5 = 0.75
```

Additionally, require state persistence: N consecutive observations beyond threshold before state transition (recommended N = 3â€“5). This acts as debouncing.

### Recovery Model

Recovery dampening should be linear with a cap, not exponential:

```
recovery_delay = base_delay Ã— (1 + 0.2 Ã— failure_count)
capped at: 10 Ã— base_delay
```

Where failure_count is the number of degradation events for this component in the current observation window. Î± âˆˆ [0.15, 0.25] is the accumulation rate.

**Exponential backoff with jitter for retry timing:**

```
actual_delay = random(0, min(base Ã— 1.5^attempt, 300_seconds))
```

Full jitter is mandatory (reduces server load by >50% vs. synchronised backoff per AWS architecture guidance). Cap at 300 seconds (5 minutes) to prevent indefinite isolation.

**Half-open state for recovery:** After backoff period, run 5â€“10 trial probes before declaring recovery. This matches the circuit breaker pattern (Resilience4j).

---

## Part 4: Signal Conditioning Pipeline

Raw health events should be processed through this seven-stage pipeline before being used for threshold decisions:

| Stage | Purpose | Parameters |
|---|---|---|
| 1. **Debounce** | Suppress duplicate events | Within 100ms; require persistence for 2â€“3 event intervals |
| 2. **Hampel filter** | Reject outliers | 7-point window (k=3); flag where \|x âˆ’ median\| > 3 Ã— 1.4826 Ã— MAD; replace with local median |
| 3. **EWMA smoothing** | Noise reduction | S_t = Î±Â·x_t + (1âˆ’Î±)Â·S_{t-1}; Î± = 0.25 for leaves, 0.15 default, 0.08 for hubs |
| 4. **CUSUM monitoring** | Detect mean shifts | C_t = max(0, C_{t-1} + x_t âˆ’ Î¼â‚€ âˆ’ Î´/2); threshold h â‰ˆ 4â€“5 |
| 5. **MACD derivative** | Rate-of-change detection | Difference of fast EWMA (Î±=0.25) and slow EWMA (Î±=0.04) |
| 6. **Hysteresis threshold** | Prevent flapping | Alarm ON when S_t < T_low; OFF when S_t > T_high; band â‰¥ 2Ã— V_pp |
| 7. **Trend regression** | Predictive warning | Linear fit over 30â€“50 events; alarm if projected time-to-threshold < warning horizon |

**The derivative term (Stage 5) is critical.** Absolute thresholds detect degradation only after crossing a fixed level. Rate-of-change detection identifies rapid degradation *before* the threshold is reached. A system degrading from Î¦L = 0.9 to 0.6 in 5 events is far more alarming than one at steady Î¦L = 0.55.

**Early warning signals for cascading failure (from critical slowing down theory):**

- Variance increases â€” reduced recovery rate causes health fluctuations to grow
- Autocorrelation increases â€” health signals become more serially correlated
- Cross-agent correlation rises â€” previously independent failure signals begin correlating (strongest cascade predictor)

---

## Part 5: Visual Encoding Constraints

### Pulsation Frequency Safety

**SAFETY CRITICAL: All pulsation must be 0.5â€“3 Hz.** The 8â€“15 Hz range, while perceptually salient, overlaps with the peak epilepsy risk zone (5â€“30 Hz, peak at 15â€“20 Hz per Epilepsy Foundation). WCAG 2.3.1 mandates no more than 3 flashes per second. Section 508 prohibits flickering between 2â€“55 Hz. ISO 9241-391 harmonises with these standards.

| Urgency | Pulsation Rate |
|---|---|
| Low / heartbeat / normal | 0.5â€“1 Hz |
| Moderate / active | 1â€“2 Hz |
| Critical / alert | 2â€“3 Hz |

The "calming heartbeat" association at 1 Hz is design intuition (resting heart rate = 60â€“80 bpm = 1.0â€“1.3 Hz), not established science. Higher pulse rates increase perceived urgency â€” this is well-supported.

### Luminance and Color Channels

**Luminance:** The primary health channel. Use 5â€“10 discriminable levels (Weber-Fechner limits discrimination to ~7â€“8 bits per channel, but practical discrimination with background variation is lower). Map linearly: bright = healthy, dim = degraded, dark = dead.

**Color (Hue):** Use for domain/type classification, not health encoding. 8â€“12 hue categories maximum (depends on display technology and ambient conditions). Color semantics are NOT culturally universal â€” pulsation and luminance have stronger cross-cultural grounding. Avoid relying on red/green distinctions (colour vision deficiency affects ~8% of males).

**Perceptual grounding strength by channel:**

| Channel | Grounding | Notes |
|---|---|---|
| Pulsation | Strong (innate) | Vertebrate "life detector"; no learning required |
| Spatial proximity | Strong (Gestalt) | "Close items go together" is near-universal |
| Luminance | Moderate | Brightness-positive valence is broadly cross-cultural; specific health mapping must be learned |
| Color | Weak | Highly culture-specific; never use as sole encoding channel |

### Working Memory Constraints

**Visual working memory is 3â€“4 integrated objects, not 7.** Miller's 7Â±2 applies to verbal short-term memory. Operators cannot actively hold more than ~4 glyph states in working memory simultaneously. For monitoring displays with dozens of elements, rely on pre-attentive pop-out to flag state changes rather than expecting operators to maintain continuous awareness.

Dashboard modules beyond 9 simultaneously displayed elements overwhelm operators. Design for "overview first, zoom and filter, then details-on-demand" (Shneiderman's mantra).

**Multi-layered interpretation:** 2â€“3 layers is the practical ceiling for general users. Specialist systems can support 3â€“5 layers with trained operators. Implement adaptive display: novice mode with explicit labels and simpler states; expert mode with denser information. A single fixed display cannot optimally serve both populations (expertise reversal effect â€” Kalyuga et al. 2003).

---

## Part 6: Seven CAS Vulnerability Watchpoints

These are architectural vulnerabilities identified by the Complex Adaptive Systems literature review. They are not bugs to fix â€” they are structural risks to monitor.

### 1. HOT Fragility (Highly Optimised Tolerance)

Any optimised system is hypersensitive to unanticipated perturbations. **This is a mathematical inevitability of optimisation, not a risk to eliminate.** Explicitly catalogue what the system is robust to and what it is fragile to. Monitor for perturbation types outside the designed-for set.

### 2. Cascading Failures in Interdependent Subsystems

Interdependent networks undergo first-order (abrupt) phase transitions, not gradual degradation. Broader degree distributions *increase* vulnerability (opposite of isolated networks). **Mitigation:** Reduce coupling strength between subsystems. The topology-aware dampening and 2-level cascade limit are the primary defences. Monitor for correlated failures across subsystem boundaries.

### 3. Complexity Catastrophe

As epistatic interactions increase relative to system components in NK models, reachable fitness optima converge toward mean fitness. **Keep interaction complexity moderate.** Modular design (low inter-module coupling, higher intra-module coupling) preserves navigability. Monitor adaptive walk lengths: if improvements require increasingly many steps, the landscape is too rugged.

### 4. Lock-In and Path Dependence

Use-based selection without diversity-maintenance mechanisms is vulnerable to Matthew effects and premature convergence (demonstrated in MusicLab studies). **Mitigation:** ÎµR minimum floor (never zero); challenge seeds for mature networks; diversity metrics on pattern compositions.

### 5. Parasitic Pattern Propagation

Patterns that satisfy selection criteria (high Î¦L) without providing genuine utility. They game the metrics. **Detection:** High pattern turnover with no Î© gradient improvement. New patterns structurally similar to predecessors (Î¨H within 0.05). Rising compute cost without rising capability.

### 6. Inadequate Measurement

Emergence claims without measurement frameworks are unfalsifiable. **Required:** Power-law testing via Clauset et al. methodology before claiming scale-free properties. Critical slowing down indicators (Scheffer et al.) for cascade approach warning. Do not claim emergence without measurable evidence.

### 7. Emergence Inflation

The gap between CAS theory and CAS engineering remains unsolved. Holland's ECHO model failed to produce emergent hierarchical complexity. **Approach:** Build for utility at current scale. Do not design for hypothetical emergence. If emergence occurs, measure it. If it doesn't, the system is still useful.

---

## Part 7: Memory Sizing Guide

| Stratum | Records Per | Record Size | Growth Rate | Retention |
|---|---|---|---|---|
| 1. Ephemeral | Execution | 1â€“10 KB | Constant (replaced per execution) | Seconds to minutes |
| 2. Observational | Component | 100â€“500 bytes | ~N obs/day per component | Rolling window (~5Ã— half-life) |
| 3. Distilled | Composition | 1â€“5 KB per insight | ~1 per learning cycle | Months to years |
| 4. Institutional | Ecosystem | 5â€“50 KB per archetype | ~1 per evolution cycle | Years |

**Example sizing (100 active components, 20 compositions, 2-week half-life):**

- Stratum 2: ~100 Ã— 70 days Ã— 10 obs/day Ã— 300 bytes â‰ˆ 20 MB (rolling, not growing)
- Stratum 3: ~20 Ã— 50 insights Ã— 3 KB â‰ˆ 3 MB (growing slowly)
- Stratum 4: ~100 archetypes Ã— 25 KB â‰ˆ 2.5 MB (growing very slowly)

Total active memory: ~25 MB. Stratum 2 is bounded by the compaction window, not by time.

---

## Part 8: Structural Review Trigger Conditions

Structural reviews are event-triggered, not scheduled. Run one when any of these fire:

| Trigger | Threshold | What to compute |
|---|---|---|
| Î»â‚‚ drop on composition change | Below maturity-indexed threshold | Full spectral analysis |
| Friction spike | Sustained above 0.5 beyond Correction Helix temporal constant | Friction distribution across all compositions |
| Cascade activation | Degradation reaches 2nd containment level | Hub dependency analysis |
| ÎµR spike at composition level | Above maturity-indexed stable range | Spectral ratio and aligned/liberal energy |
| Î¦L velocity anomaly | > 0.05/day ecosystem-wide | Global Î»â‚‚ and spectral gap |
| Î© gradient inversion | Any gradient negative after sustained positive | Full review |

**Review outputs feed existing feedback, not new channels:** Hub dependency â†’ Scale 2 routing. Dampening recommendations â†’ Calibration. Friction hotspots â†’ Scale 2 evaluation. Global Î»â‚‚ trend â†’ Scale 3 ecosystem health.

---

## Part 9: Adversarial Resilience Parameters

### Anomaly Detection Thresholds

| Signal | Normal Range | Anomaly |
|---|---|---|
| Node creation rate | Seasonal/usage patterns | > 3Ïƒ spike above rolling mean |
| Connection formation rate | Proportional to node creation | Disproportionate to node creation |
| Mean Î¦L velocity | < 0.05/day | > 0.1/day |
| Î¨H distribution entropy | Stable or slowly increasing | Sudden collapse |
| Federation gossip volume | Proportional to activity | Disproportionate spike |

### Bulkhead Responses

When ecosystem stress index exceeds warning threshold:

| Response | Parameters | Recovery |
|---|---|---|
| Federation isolation | Quarantine gossip from anomalous nodes | Lift when behaviour returns to normal range |
| Acceptance rate limiting | Throttle new pattern acceptance; queue and absorb gradually | Ease back to normal over days, not hours |
| Cascade dampening override | Temporarily reduce Î³ (e.g., to 0.4) | Restore when stress index returns to normal |
| Provenance weighting increase | Temporarily increase wâ‚‚ in Î¦L calculation | Restore gradually |

**Recovery from attack is deliberately slow.** Match hysteresis principle: 2.5Ã— longer to restore normal operation than to engage defences. This prevents snap-back vulnerability to follow-up attacks.

---

## Part 10: Pattern-Level Guidance

These are pattern design considerations â€” guidance for building good patterns using the Codex grammar. They are NOT part of the Codex specification. They belong here because they inform implementation decisions.

### Rolled Throughput Yield (RTY)

For multi-stage patterns, track the product of per-stage success rates:

```
RTY = Î (stage_success_rate for each stage)
```

RTY reveals hidden rework. A 3-stage pipeline with 95% per-stage success has RTY = 0.857, not 0.95. If any stage requires correction loops, include correction success rate in the computation.

### Error Classification (Poka-Yoke Levels)

When implementing error handling in patterns, classify by severity and appropriate response:

| Level | Error Type | Pattern Response |
|---|---|---|
| Prevention | Invalid input detected before processing | Reject at Bloom boundary; emit validation failure |
| Detection | Error caught during transformation | Correction Helix retry with structured feedback |
| Mitigation | Error propagated but contained | Reduce Î¦L; route around via ÎµR sampling |
| Escape | Error reached output | Degradation signal; cascade to container |

### Failure Mode Analysis

For critical patterns, enumerate failure modes and their structural signals:

| Failure Mode | Î¦L Signal | ÎµR Signal | Î¨H Signal |
|---|---|---|---|
| Model degradation | usage_success_rate drops | May spike (exploring alternatives) | Friction increases on latency/quality |
| Data drift | temporal_stability drops | Should spike (environment changed) | Î»â‚‚ unchanged; friction increases |
| Integration failure | axiom_compliance drops | No change | Î»â‚‚ may drop; friction high |
| Capacity exhaustion | temporal_stability drops (latency variance) | Should remain stable | No change |

---

## Anti-Patterns

**Separate monitoring database.** Do not create a health-scores cache that is the source of truth. Caching is acceptable for performance; the graph is always authoritative.

**Morpheme labels on code.** Do not add `morphemeType: 'seed'` fields. The morpheme type *is* the structure â€” a function is a Seed because of what it does, not because of a label.

**Assigned resonance.** Do not set `Î¨H = 0.95` as a property. Resonance emerges from structural coherence (Î»â‚‚) and operational friction (TV_G). You compute it; you don't assign it.

**Silent routing around failure.** When a component fails and the router switches to an alternative, this must be a visible event. The system's users need to know adaptation is happening.

**Forced revival of archived components.** If a component has been dimming through disuse, do not forcibly revive it. Either reconnect it intentionally or let it archive naturally.

**Immediate blacklisting.** A single failure should not permanently exclude a component. Selection pressure (reduced Î¦L, lower sampling probability) achieves gradual quarantine.

**Fixed dampening for all topologies.** Do not use Î³=0.7 everywhere. Compute Î³_effective from the local branching factor. This is the single most important parameter correction from v1.0.

---

## Glossary

| Codex Term | Engineering Equivalent |
|---|---|
| Seed (â€¢) | Atomic component â€” function, service, data point |
| Line (â†’) | Connection â€” data flow, dependency, feedback path |
| Bloom (â—‹) | Boundary â€” pipeline stage, module scope, service boundary |
| Resonator (Î”) | Transformation â€” where input becomes output, routing decision |
| Grid (â–¡) | Knowledge structure â€” graph, schema, persistent storage |
| Helix (ðŸŒ€) | Feedback loop â€” correction retry, learning cycle, evolutionary selection |
| Î¦L | Health score â€” composite of success rate, compliance, provenance, stability |
| Î¨H | Harmonic signature â€” two-component: Î»â‚‚ (structural coherence) + TV_G (runtime friction) |
| ÎµR | Exploration rate â€” fraction of decisions sampling uncertain alternatives |
| Î³_effective | Topology-aware dampening â€” min(0.7, 0.8/(k-1)) where k is branching factor |
| Luminance | Health visibility â€” bright = healthy, dim = degraded, dark = dead |
| Dormant | Built but not connected â€” exists but not wired into active flow |
| Hysteresis | Recovery is 2.5Ã— slower than degradation â€” prevents flapping |
| Cascade limit | Degradation propagates at most 2 containment levels â€” primary safety mechanism |
| Maturity index | Network-wide experience metric â€” modulates thresholds |
| TV_G | Graph Total Variation â€” measures signal smoothness across connections |
| Î»â‚‚ | Fiedler value â€” algebraic connectivity of graph Laplacian |

---

*This document derives from Codex Signum v3.0. The Codex defines the grammar. This document defines how to compute the grammar's properties. When in doubt about implementation, follow this document. When in doubt about intent, read the Codex.*
