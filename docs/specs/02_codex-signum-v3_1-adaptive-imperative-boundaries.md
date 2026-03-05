> **Superseded.** Content absorbed into v4.3 spec (`docs/specs/codex-signum-v4_3-draft.md`). This file is retained for historical reference.

# Codex Signum v3.1 Addendum Sketch: Adaptive Imperative Boundaries

## Evolving Boundary Conditions with Immune-Memory Learning

**Status:** Working sketch. Not yet integrated into canonical specification.

**Context:** The meta-imperatives (Ω₁–Ω₃) are currently operationalized as gradient signals — continuous derivatives that modulate εR when improvement stalls. This is necessary but insufficient. The gradients detect *ecosystem-wide deceleration*. They do not detect *actively harmful patterns* that may be extracting value faster than they degrade.

The existing defenses — ΦL dimming, natural selection pressure at Scale 3, adversarial resilience mechanics from v2.6 — assume harmful patterns will eventually reveal themselves through poor health metrics. But actively predatory patterns (e.g., crypto scams, extraction schemes, trust-parasites) can complete their damage cycle before the immune system responds. The topology sees the harm. The grammar needs a structural mechanism to act on it faster and to learn from each encounter.

This addendum introduces no new morphemes, axioms, grammar rules, or state dimensions. It extends the meta-imperatives from gradient signals into **evolving boundary conditions** — structural constraints on the coupling topology that adapt based on the ecosystem's accumulated experience with harmful patterns.

---

## The Problem: Harm Velocity Exceeds Degradation Velocity

The current architecture handles harmful patterns through several mechanisms:

| Mechanism | Operates At | Temporal Constant | Limitation |
|---|---|---|---|
| ΦL dimming | Pattern level | Hours to days | Requires observation history to accumulate |
| Selection pressure | Scale 3 (Evolution) | Weeks to months | Far too slow for acute extraction |
| Rate-of-change anomaly detection | Ecosystem level | Minutes to hours | Detects *dynamics*, not *intent signatures* |
| Bulkhead mechanics | Federation level | Minutes | Reactive — engages after damage detected |

The gap: a harmful pattern that maintains superficially healthy ΦL while systematically degrading connected patterns' vitality. Its own metrics look fine. The damage is visible only in the *topology* — in the vitality trajectories of everything it touches.

A crypto scam pattern, structurally: high initial ΦL (well-constructed), rapid connection formation (seeking coupling targets), asymmetric value flow through Lines (extraction), progressive vitality decline in connected patterns, and eventual disconnection once extraction is complete. By the time ΦL catches up, the damage is done and the pattern has moved on or dissolved.

---

## Mechanism 1: Coupling Effect Signatures

### The Principle

Every pattern's coupling with other patterns produces measurable effects on connected patterns' vitality trajectories. These effects compose into a **coupling effect signature** — a topological fingerprint of how a pattern affects its neighborhood.

This is not a new metric. It is a *derived view* of existing data: the ΦL trajectories of patterns within *n* hops of a given pattern, correlated with the timing and topology of coupling events.

### Computation

For any pattern *P*, its coupling effect signature over observation window *w*:

```
CES(P, w) = {
    Σ(ΔΦL_connected) / |connected_patterns|,     — mean vitality impact
    σ(ΔΦL_connected),                              — variance of impact
    skew(ΔΦL_connected),                           — asymmetry of impact
    Σ(value_outflow) / Σ(value_inflow),            — extraction ratio
    rate(new_connections) / rate(dissolved_connections)  — coupling churn
}
```

A healthy pattern's CES shows: near-zero or positive mean vitality impact, low variance, low skew, extraction ratio near 1.0 (balanced exchange), and low coupling churn.

A harmful pattern's CES shows: negative mean vitality impact, high variance (some connections exploited more than others), negative skew (heavy tail of severe harm), extraction ratio >> 1.0, and high coupling churn (connects, extracts, disconnects).

### Structural Role

The CES is not a judgment. It is a measurement. It feeds into the boundary condition mechanism described below. The Codex does not define "what is harmful" — the topology reveals what produces harm through its effects on connected patterns.

---

## Mechanism 2: Imperative Boundary Conditions

### The Principle

The meta-imperatives currently produce gradient signals that modulate εR. This addendum extends them to produce **boundary conditions on the coupling topology itself**.

Where the gradients say "the ecosystem is stalling, explore more," the boundary conditions say "coupling with this topological signature carries increasing structural cost."

### Formalization

Each meta-imperative generates a coupling cost function:

```
coupling_cost(P_new, P_existing) = base_cost + Σ(Ωᵢ_boundary_penalty(CES(P_new)))
```

Where:

```
Ω₁_boundary_penalty = f(negative_vitality_impact, harm_velocity)
Ω₂_boundary_penalty = f(extraction_ratio, capability_concentration)  
Ω₃_boundary_penalty = f(information_asymmetry, opacity_score)
```

The penalty functions are monotonically increasing — worse signatures produce higher coupling costs. Patterns with benign CES face zero additional cost. Patterns with harmful CES face exponentially increasing costs that make it structurally expensive to maintain or form connections.

### Key Properties

**Grammar-pure.** The Codex doesn't say "crypto scams are banned." It says "patterns whose coupling effects systematically degrade connected patterns' vitality face increasing coupling costs." The scam resolves structurally.

**Continuous, not binary.** There is no "harmful/not-harmful" classification. There is a continuous cost surface. Mildly extractive patterns face mild costs. Severely harmful patterns face prohibitive costs.

**Local, not global.** Coupling costs are computed per-connection based on the specific CES of the pattern seeking coupling. There is no global blacklist.

**Reversible.** If a pattern's CES improves (its coupling effects become benign), the boundary penalties decrease. Consistent with Axiom 7 (Reversibility). Recovery follows the existing hysteresis principle — penalty reduction is slower than penalty increase (2.5× ratio).

---

## Mechanism 3: Immune Memory — The Learned Topology

### The Problem Learning Solves

The first encounter with a novel harmful pattern type is expensive. The coupling effect signature takes time to develop. The boundary penalties ramp up gradually. Damage occurs in the gap.

Subsequent encounters with *structurally similar* harmful patterns should trigger faster boundary response — not because someone wrote a rule, but because the ecosystem has learned what those topological shapes lead to.

### The Signature Archive

When a pattern is phased out (ΦL drops to quarantine threshold) and its CES at time of phasing showed harmful characteristics, the CES is distilled into a **signature archetype** and stored in Stratum 3 (Distilled Memory) of the ecosystem's memory topology.

The archive stores:

```
SignatureArchetype = {
    structural_invariants:   — the deep features (extraction asymmetry, 
                               information opacity, vitality degradation 
                               gradient in connected patterns)
    surface_variants:        — the specific topological shapes observed
                               (for exact-match fast detection)
    confidence:              — how many instances contributed to this archetype
    last_updated:            — recency weighting applies
    severity_history:        — how much damage patterns matching this 
                               archetype typically caused before phasing
}
```

### Recognition and Accelerated Response

When a new pattern forms connections, its emerging CES is compared against the signature archive:

```
archetype_similarity = max(
    structural_match(CES(P_new), archetype.structural_invariants),
    surface_match(CES(P_new), archetype.surface_variants)
)
```

The structural match generalizes — it catches novel variations of known harm patterns. The surface match is fast — it catches repeat offenders immediately.

When similarity exceeds a threshold, the boundary penalty functions receive an **acceleration factor**:

```
accelerated_penalty = base_penalty × (1 + acceleration_factor × archetype_similarity × severity_history)
```

This means:
- First-ever crypto scam: penalties ramp at normal speed. Damage occurs. Ecosystem learns.
- Second crypto scam (similar surface topology): penalties ramp faster. Less damage.
- Novel extraction scheme (different surface, same structural invariants): penalties ramp at moderate speed. The ecosystem recognizes the *shape of harm* even in unfamiliar packaging.

### Adversarial Adaptation Resistance

Harmful patterns will evolve. The next scam won't look like the last one. The archive's defense against this is the **two-tier matching**:

The surface variants are easy to evade — change the topology and the exact match fails. But the structural invariants are much harder to evade because they encode the *functional requirements of harm*:

- To extract value, you need asymmetric flow (extraction_ratio >> 1.0)
- To avoid early detection, you need information opacity
- To maximize extraction, you need rapid coupling formation
- Harm *necessarily* produces negative vitality impact in connected patterns

These are structural necessities, not surface features. A pattern that doesn't exhibit these invariants isn't harmful. A pattern that does exhibit them but has found a novel topology to do so still gets caught by the structural match — just slightly slower than an exact match.

### Archive Maintenance

The signature archive is subject to the same principles as all Codex memory:

- **Recency weighting:** Old archetypes with no recent matches decay in confidence. The immune system doesn't maintain permanent paranoia about threats that no longer appear.
- **Distillation:** Surface variants are periodically distilled — if multiple surface variants map to the same structural invariants, they are consolidated.
- **Capacity limits:** The archive has finite capacity. Low-confidence, low-severity archetypes are evicted first.
- **No false memory:** An archetype can only be created from *observed* harmful patterns that were actually phased out. The system cannot pre-populate the archive with hypothetical threats.

---

## Mechanism 4: ΨH as Hypothetical Evaluator

### Connection to Existing Architecture

The v3.0 specification establishes that ΨH can be computed against *hypothetical* states, not just observed states. This is the structural hook for this addendum.

Before a coupling is formed, ΨH can be computed for the hypothetical composition. With the adaptive boundary conditions, this computation now includes:

```
ΨH_hypothetical(P_new + P_existing) = standard_ΨH_computation 
    + coupling_cost(P_new, P_existing)
    + archive_acceleration_if_any
```

A hypothetical composition that involves a pattern with harmful CES or archive similarity will produce a degraded ΨH — signaling dissonance *before* the coupling forms. This is preventive, not reactive.

The pattern is free to form the coupling anyway. The Codex doesn't forbid. But the degraded ΨH is visible (Axiom 4), and the coupling cost makes it structurally expensive to maintain (Axiom 9 — Parsimony).

---

## Integration with Existing Specification

| Addition | Extends | Mechanism |
|---|---|---|
| Coupling Effect Signatures | ΦL trajectories, Line flow metrics | Derived view of existing data — no new instrumentation |
| Imperative Boundary Conditions | Meta-Imperatives (Ω₁–Ω₃) | Extends imperatives from gradient signals to coupling constraints |
| Immune Memory (Signature Archive) | Stratum 3 (Distilled Memory), Pattern Hygiene | Distilled CES of phased harmful patterns |
| Archive-Accelerated Penalties | Degradation Cascade, Coupling Costs | Acceleration factor from archetype similarity |
| ΨH Hypothetical Integration | ΨH computation against hypothetical states | Coupling cost incorporated into pre-formation ΨH |

### What This Does NOT Change

- No new morphemes, axioms, grammar rules, or state dimensions
- ΦL computation unchanged — CES is derived *from* ΦL, not added to it
- Degradation cascade mechanics unchanged
- Constitutional evolution (v2.8) amendment tiers unchanged
- All existing adversarial resilience mechanics (v2.6) remain operative

### Tier Classification (per v2.8 Constitutional Evolution)

This addendum would constitute a **Tier 2 (Structural Refinement)**: it modifies how the meta-imperatives operate mechanistically without changing what they *mean* or what they *require*. The imperatives still reduce suffering, increase prosperity, increase understanding. This addendum gives them structural teeth and a memory.

---

## Open Questions for Refinement

1. **Threshold calibration:** What archetype_similarity threshold triggers acceleration? Too low produces false positives (healthy patterns penalized). Too high defeats the purpose. Likely needs maturity-indexed calibration consistent with v2.6 adaptive thresholds.

2. **Archive federation:** How do signature archetypes propagate across federated networks? A scam pattern phased in one ecosystem should inform another — but gossip poisoning is a risk (v2.6 adversarial resilience applies).

3. **Emergence vs. imposition:** The coupling cost functions need careful design to avoid becoming a backdoor for prescribed behavior. The test: "Does this penalty follow from measured coupling effects, or from a definition of what constitutes harm?" Only the former is grammar-pure.

4. **Computational cost:** CES computation across all patterns is O(n²) in the worst case. Practical implementations will need to scope observation to local neighborhoods (consistent with the 2-level cascade limit as a natural boundary).

5. **Learning rate vs. overreaction:** How quickly should the archive's acceleration factor increase with each confirmed harmful instance? Too slow and the immune system doesn't learn. Too fast and a single false positive cascades into permanent over-reaction. The hysteresis principle (2.5× recovery ratio) likely applies here too.

---

## Relationship to v2.6 Adversarial Resilience

The v2.6 addendum's adversarial resilience mechanics (rate-of-change anomaly detection, bulkhead mechanics, federation isolation) operate at the **ecosystem dynamics** level — they detect coordinated attacks through abnormal rates of change in graph topology.

This addendum operates at the **pattern coupling** level — it detects and responds to individual harmful patterns through their effects on connected patterns' vitality.

They are complementary:
- v2.6 handles **coordinated, rapid attacks** (many bad patterns simultaneously)
- v3.1 handles **individual, sophisticated harm** (single patterns that game the system)

Together they cover both attack vectors: the blitzkrieg and the infiltrator.

---

*This sketch is proposed for development toward inclusion in Codex Signum v3.1. The core remains stable. The immune system is learning to protect it.*
