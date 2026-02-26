# Codex Signum is far more dangerous than its mathematics claim

**The system's flagship safety number is wrong by a factor of three.** At γ=0.7 on a binary tree, the claimed 28.6% cascade participation rate is derived from a formula that applies to the wrong probability distribution—the correct value is **81.6%**, making the system dramatically more hazardous than documented. Combined with a flawed hub dampening formula that fails for any branching factor above 2, the Codex Signum framework operates in a deeply supercritical regime where the 2-level cascade limit is not a safety margin but a load-bearing wall. Remove or weaken that wall, and catastrophic cascading is near-certain.

This report provides a rigorous percolation-theoretic analysis of health signal propagation through hierarchical agent networks, validates (or refutes) eight specific mathematical claims, and delivers quantitative recommendations for making the system intrinsically safe rather than extrinsically constrained.

---

## Percolation on trees is exact, and it confirms supercriticality

Bond percolation is the correct model for agent health propagation: randomness lives on edges (whether a health signal traverses a link), not on nodes. On a k-ary tree—where each agent supervises k children—every bond is independently "open" with probability γ. Because trees are loop-free, the self-consistent mean-field equations are exact, not approximate.

The percolation threshold for a k-ary tree is **pc = 1/k**, derived from the self-consistent equation for the probability Q that a branch fails to reach infinity: Q = (1 − p) + pQ^k. Linearizing near Q = 1 yields pc = 1/k exactly. For binary trees (k = 2), pc = 0.5. This result traces to Fisher and Essam (1961) and is proven rigorously in Grimmett's *Percolation* (1999) and Lyons (1990). The key fact: **this threshold is exact, not an approximation**, because the absence of loops makes the branching process analysis precise.

With γ = 0.7 and pc = 0.5, the system is supercritical. The absolute distance from threshold is ε = 0.2. The claim of "40% supercritical" uses the relative measure (γ − pc)/pc = 0.4, which is borrowed from thermal phase transitions (reduced temperature) rather than standard percolation terminology. The characterization is arithmetically correct but non-standard—the canonical measure is simply ε = p − pc = 0.2.

For context, the square lattice bond percolation threshold pc = 1/2 is also exact (Kesten's theorem, 1980), established via self-duality. Comparison thresholds: triangular lattice bond pc ≈ 0.347, honeycomb bond pc ≈ 0.653, simple cubic bond pc ≈ 0.249. The Bethe lattice with coordination z gives pc = 1/(z−1), which for z = 3 (binary tree, z = k + 1) recovers pc = 1/2.

On random graphs, the **Molloy-Reed criterion** gives pc = ⟨k⟩/(⟨k²⟩ − ⟨k⟩). For Erdős-Rényi graphs with Poisson degree distribution, this reduces to the giant component emerging at mean degree c = 1. For scale-free networks with P(k) ~ k^(−α) and **α ≤ 3**, the second moment ⟨k²⟩ diverges, driving pc → 0—meaning any fixed γ > 0 is supercritical. This result, due to Cohen, Erez, ben-Avraham, and Havlin (2000), has devastating implications: if the agent network develops any degree heterogeneity with a heavy tail, no uniform dampening factor can ensure safety.

Clustering (horizontal links between agents at the same level) generally **increases** pc, as shown by Gleeson (2010). Redundant intra-cluster edges waste connectivity that could otherwise span the network. This is one of the few topology modifications that improves safety margins.

---

## The 28.6% claim is wrong—cascade participation is actually 81.6%

This is the most consequential error in the Codex Signum analysis. The claimed formula θ(p) = 1 − 1/(kp) yields θ = 1 − 1/1.4 = 0.286 for k = 2, p = 0.7. But this formula applies to a **Galton-Watson process with geometric offspring distribution**, not the Binomial(k, p) distribution that governs bond percolation on k-ary trees.

The correct derivation proceeds from the extinction probability equation for the Galton-Watson branching process. Each node transmits failure to each of its k = 2 children independently with probability γ = 0.7, giving offspring distribution X ~ Binomial(2, 0.7). The probability generating function is G(s) = (0.3 + 0.7s)². The extinction probability q satisfies q = G(q):

q = (0.3 + 0.7q)² = 0.09 + 0.42q + 0.49q²

Rearranging: 0.49q² − 0.58q + 0.09 = 0. The quadratic formula gives q = (0.58 ± 0.4)/0.98, yielding roots q = 1 and **q = 9/49 ≈ 0.1837**. For the supercritical process, the extinction probability is the smaller root. The survival probability—the fraction of cascades that would propagate indefinitely in an infinite tree—is:

**θ = 1 − 9/49 = 40/49 ≈ 0.8163**

Cross-verification via the recursive equation θ = 1 − (1 − pθ)^k: substituting k = 2, p = 0.7 gives θ = 1.4θ − 0.49θ², yielding θ(0.49θ − 0.4) = 0, so θ = 40/49 ✓. The error in the original claim underestimates cascade risk by a factor of **2.86×**. Where the system documentation suggests roughly one in four nodes participates in a cascade, the true figure is closer to **four in five**.

The formula θ = 1 − 1/(kp) = 1 − 1/μ is the survival probability for a process with geometric offspring distribution (P(X = n) = (1 − r)r^n with mean μ = r/(1 − r)), whose PGF f(s) = 1/(1 + μ − μs) yields the fixed point q = 1/μ. This is a fundamentally different stochastic model with heavier tails than the binomial, and it underestimates survival because the geometric distribution has more probability mass near zero.

---

## The correlation length sits right at the cascade boundary

The correlation length ξ governs how far spatial correlations extend in the system. On the Bethe lattice, ξ diverges at pc with critical exponent ν = 1/2 (the mean-field value, which is exact on trees). The scaling relation gives:

ξ ~ |p − pc|^(−1/2) = (0.2)^(−1/2) = √5 ≈ **2.236 levels**

This matches the claimed ξ ≈ 2.24 under the assumption of a unit proportionality constant. However, the exact correlation length on the Bethe lattice depends on which definition is used. The pair connectivity g(r) = p^r gives ξ = −1/ln(p) = −1/ln(0.7) ≈ **2.80**. The branch-based definition ξ = −1/ln(kp) gives ξ ≈ **2.97** for the subcritical approach. The scaling form with unit prefactor gives **2.24**. All three estimates fall in the range **2–3 levels**, confirming the qualitative picture: the correlation length is comparable to the 2-level cascade limit.

This near-coincidence is the central tension of the system design. The critical exponents for the mean-field universality class (which governs tree percolation) are β = 1 (order parameter), ν = 1/2 (correlation length), γ_exp = 1 (susceptibility), and τ = 5/2 (cluster size distribution at criticality). Below pc, the mean cluster size diverges as χ ~ |p − pc|^(−1), and the cluster size distribution follows n_s ~ s^(−5/2)exp(−s/s_ξ). These are exact for d ≥ 6 and on the Bethe lattice.

| Exponent | Mean-field (trees) | 2D lattice | Directed percolation (1+1)d |
|---|---|---|---|
| β | 1 | 5/36 | 0.2765 |
| ν | 1/2 | 4/3 | 1.097 (⊥), 1.734 (∥) |
| γ_exp | 1 | 43/18 | — |
| τ | 5/2 | 187/91 | — |

For directed percolation—relevant because health signals propagate toward the root in a preferred direction—the universality class differs from isotropic percolation on general lattices, with β ≈ 0.276 and ν_∥ ≈ 1.734 in (1+1) dimensions (Jensen 1999). However, **on trees, directed and undirected percolation share the same threshold** because there is only one path between any pair of nodes. Directionality affects dynamics but not the critical point.

---

## The 2-level truncation transforms the physics but doesn't eliminate the danger

Without the 2-level cascade limit, the system is catastrophic. The survival probability of 81.6% means more than four out of five failure events would propagate indefinitely. The expected cascade size in the infinite tree is E[S] = Σ(kγ)^n = 1/(1 − kγ), which diverges when kγ = 1.4 > 1. The 2-level truncation converts this divergence into the finite sum:

**E[S] = 1 + kγ + k²γ² = 1 + 1.4 + 1.96 = 4.36 nodes**

For ternary trees: E[S] = 1 + 2.1 + 4.41 = **7.51 nodes**. Without truncation at depth 3: E[S] = 7.10 (binary) and 16.77 (ternary). The truncation's value grows exponentially with each additional level prevented.

The complete cascade size distribution for k = 2, γ = 0.7 with 2-level truncation reveals the system's behavior:

| Cascade size | Probability | Cumulative |
|---|---|---|
| 1 (contained) | 9.0% | 9.0% |
| 2 | 3.8% | 12.8% |
| 3 | 18.0% | 30.8% |
| 4 | 24.3% | 55.1% |
| 5 | 13.0% | 68.1% |
| 6 | 20.2% | 88.2% |
| **7 (full saturation)** | **11.8%** | 100% |

The variance is Var(S) ≈ 3.01 with standard deviation ≈ 1.73. Nearly **45% of cascades affect 5 or more of the 7 possible nodes**, and full saturation occurs with probability γ⁶ = 0.7⁶ ≈ 11.8%. The 2-level limit keeps cascades finite, but the cascades are emphatically not small—they saturate most of the allowed neighborhood.

**Finite-size scaling theory** explains why the truncation works at all. For a system of size L near criticality, the sharp transition is rounded: pc(L) ≈ pc(∞) + C·L^(−1/ν). With ν = 1/2, pc(L = 2) ≈ 0.5 + C/4. For C ~ O(1), this suggests an effective threshold near 0.75, potentially above γ = 0.7. But this asymptotic analysis is unreliable at L = 2—the system is far too small for scaling theory to apply cleanly. Direct calculation (the table above) is the only reliable guide at this scale.

The truncation is correctly identified as the **primary safety mechanism**, but it functions as a hard engineering constraint, not an intrinsic stability property. Three failure modes threaten it: correlated failures (shared dependencies between sibling nodes break the independence assumption, producing heavier-tailed offspring distributions), overlapping cascades (multiple simultaneous failure sources whose 2-level neighborhoods intersect, effectively extending propagation depth), and mechanism failure (any bug in the truncation logic exposes the full supercritical regime where 81.6% of cascades diverge).

---

## Hub dampening with √k is dangerously inadequate

The proposed hub dampening formula γ_hub = γ_base/√k fails a basic safety test. The mean number of activated children is μ = k × γ_base/√k = γ_base√k, which **grows** with k:

| k (children) | γ_hub | μ = kγ_hub | Status |
|---|---|---|---|
| 2 | 0.495 | 0.990 | Critical (μ ≈ 1) |
| 3 | 0.404 | 1.213 | Supercritical |
| 5 | 0.313 | 1.565 | Supercritical |
| 10 | 0.221 | 2.214 | Highly supercritical |

For k = 2, the system sits almost exactly at criticality (μ = 0.99), where fluctuations are maximal and the mean cluster size diverges. For k ≥ 3, the system is unambiguously supercritical. The √k scaling originates from spectral normalization in graph theory—the symmetric normalized adjacency matrix uses entries A_ij/√(d_i·d_j), bounding the spectral radius to 1. This is the same normalization used in PageRank and graph convolutional networks. It controls spectral properties but **does not guarantee subcritical cascade dynamics**.

The budget-capped approach γ_eff = min(γ_base, s/k) with s ≤ 0.8 is the only proposed strategy that provides a **mathematical guarantee** of subcriticality for all topologies. With this cap, μ = k × (s/k) = s ≤ 0.8 < 1 regardless of k. The trade-off is signal fidelity: at k = 2, γ_eff = 0.4 yields only 16% signal strength at depth 2, compared to 49% with γ = 0.7.

| Strategy | 2-level cascade (k=2) | Signal at depth 2 | Subcritical for all k? |
|---|---|---|---|
| Uniform γ = 0.7 + circuit breaker | 4.36 | 49% | No |
| Budget-capped s = 0.8 | 2.44 | 16% | **Yes** |
| Hub √k dampening | 2.97 | 24.5% | No |
| Uniform γ = 0.45 | 2.71 | 20.3% | No (fails k ≥ 3) |

Budget capping reduces the 2-level cascade by **44%** while providing topology-independent safety. The information loss is substantial but can be mitigated through direct point-to-point health queries for critical monitoring paths.

---

## Early warning signals offer probabilistic detection but no guarantees

Critical slowing down (CSD) provides the theoretical basis for cascade prediction. As a system approaches a tipping point, the dominant eigenvalue λ₁ of the linearized dynamics approaches zero, causing the decorrelation time τ = −1/λ₁ to diverge. Observable consequences include rising lag-1 autocorrelation (AR(1) → 1), growing variance (σ² ~ 1/|λ₁|), slower recovery from perturbations, and increased spatial correlation between connected nodes.

The seminal framework by Scheffer et al. (2009) established these as generic early warning signals. Drake and Griffen (2010) provided the first controlled experimental demonstration, detecting CSD signals **~8 generations before** population collapse in *Daphnia magna*. Carpenter et al. (2011) demonstrated detection >1 year before a regime shift in a whole-lake experiment.

However, empirical performance is sobering. Burthe et al. (2016), analyzing 126 datasets across 55 taxa, found **true positive rates of only 9–13%** for variance and autocorrelation indicators, with false positives (47–53%) exceeding true detections. Boettiger and Hastings (2012, 2013) demonstrated fundamental limits: noise-induced transitions have no CSD precursors at all, and post-hoc analysis inflates apparent detection rates (the "prosecutor's fallacy"). Deep learning approaches (Bury et al. 2021, using CNN-LSTM architectures) show substantially better sensitivity and specificity, and can even predict bifurcation type.

For Codex Signum monitoring, the most actionable indicators are:

- **Recovery time** after perturbations—the most direct CSD measure; a >50% increase warrants investigation
- **Cascade size distribution**—any shift toward power-law behavior (away from the exponentially-truncated distribution expected subcritically) signals approaching criticality
- **Cross-node health correlation** (Moran's I)—increasing spatial correlation precedes cascade onset
- **AR(1) of node health** in sliding windows—a trend of Kendall τ > 0.5 over the monitoring period indicates concern

The 2σ consecutive-exceedance rule (flagging when an indicator exceeds 2 standard deviations above baseline on 2+ consecutive time points) balances false-positive reduction with detection power. For a system already operating at γ = 0.7 > pc = 0.5, the relevant monitoring question is not "are we approaching criticality?" (we are past it) but rather "is the effective γ drifting higher, or are correlations developing that would defeat the truncation mechanism?"

---

## Interdependent networks could collapse the safety margin entirely

Buldyrev et al. (2010) showed that interdependent networks exhibit **catastrophic first-order phase transitions**, fundamentally different from the continuous transitions in isolated networks. For two interdependent Erdős-Rényi networks with mean degree ⟨k⟩, the critical threshold jumps from pc = 1/⟨k⟩ (single network) to pc = 2.4554/⟨k⟩ (interdependent)—a **2.46× increase**. The transition is discontinuous: the giant mutually connected component collapses abruptly rather than shrinking gradually.

For Codex Signum, if agents depend on multiple layers (parent agent health, external service availability, shared computational resources), the interdependence amplifies fragility. Broader degree distributions, which aid resilience in isolated networks, **increase vulnerability** in interdependent ones—the opposite of intuition. Even scale-free networks with α ≤ 3 (essentially indestructible in isolation) develop finite, positive percolation thresholds under interdependence.

Albert, Jeong, and Barabási (2000) established the "robust-yet-fragile" property of scale-free networks: highly resilient to random failures (>95% of nodes can be randomly removed without fragmenting the network) but devastatingly vulnerable to targeted hub removal (<5–10% of hubs destroyed can cause complete fragmentation). In a hierarchical agent tree, the root is the ultimate hub; its failure under γ = 0.7 propagation triggers cascades affecting 4.36 expected nodes within the 2-level window, but the organizational impact extends far beyond the direct cascade through indirect dependencies.

---

## Concrete recommendations for making the system intrinsically safe

The fundamental design choice in Codex Signum—operating at γ = 0.7 with a hard cascade depth limit—is analogous to driving a car at highway speed with no brakes but a wall at the end of the road. The wall (2-level limit) prevents infinite travel, but you still hit it hard. A defense-in-depth architecture transforms the system from extrinsically constrained to intrinsically stable:

**Layer 1 — Budget-capped dampening (primary safety):** Set γ_eff = min(γ_base, s/k) with s = 0.8. This guarantees μ = kγ_eff ≤ 0.8 < 1 for all topologies, making the branching process subcritical. Expected cascade size converges to 1/(1 − s) = 5.0 nodes naturally, without any depth limit. The 2-level cascade with this dampening drops from 4.36 to **2.44 nodes**—a 44% reduction.

**Layer 2 — Circuit breaker (defense in depth):** Retain the 2-level propagation limit as a backup. With subcritical dampening, it rarely activates; its role is protecting against parameter misconfiguration or correlation-induced supercriticality.

**Layer 3 — Correlation monitoring:** Track the empirical offspring distribution. If observed child failure rates exceed the Binomial(k, γ_eff) prediction—particularly if sibling failures show positive correlation—inject additional dampening. The independence assumption is the foundation of the percolation analysis; its violation invalidates all safety guarantees.

**Layer 4 — Topology-aware scaling:** For any node with degree k, enforce γ_eff < 1/k strictly. This is stronger than budget capping (which allows μ up to s) but may sacrifice too much signal fidelity at high k. A compromise: use budget capping with s = 0.8 as the baseline, and add per-node monitoring that reduces γ_eff further if local cascade statistics exceed predictions.

**Layer 5 — Interdependency reduction:** Minimize one-to-one hard dependencies between network layers. Design agents for graceful degradation when external dependencies fail, breaking the strict interdependence that transforms continuous transitions into catastrophic first-order collapses.

## Conclusion

The Codex Signum framework's percolation analysis contains two critical mathematical errors that compound to dramatically underestimate cascade risk. The survival probability formula θ = 1 − 1/(kp) applies to geometric offspring distributions, not the binomial distribution governing bond percolation on trees; the correct survival probability at γ = 0.7 on binary trees is **81.6%**, not 28.6%. The hub dampening formula γ/√k fails to ensure subcriticality for any branching factor above 2, leaving hubs as amplification points rather than safety barriers.

The 2-level cascade limit does prevent infinite cascades, but it does so as a **hard external constraint on a system that is intrinsically unstable**. Within the 2-level window, cascades are large (62% of the neighborhood in expectation) and full saturation occurs 11.8% of the time. The correlation length ξ ≈ 2–3 levels sits right at the truncation boundary, meaning the system has no comfortable margin between its natural correlation scale and its artificial containment depth.

The path to genuine safety is budget-capped dampening (γ_eff = min(γ_base, s/k) with s < 1), which makes the branching process intrinsically subcritical for all topologies—including scale-free networks where any fixed dampening factor eventually becomes supercritical. This replaces dependence on a single mechanism (depth truncation) with mathematical guarantees rooted in branching process theory. The system should not need a wall at the end of the road; it should have brakes.