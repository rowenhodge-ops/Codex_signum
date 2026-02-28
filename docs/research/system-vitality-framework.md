# System Vitality framework: a comprehensive technical validation

The Codex Signum v2.6 System Vitality framework is **a theoretically grounded but partially novel synthesis** of well-established reinforcement learning principles. Its core mechanism — monitoring the rate of improvement dΩ/dt across Meta-Imperatives and using gradient flattening to trigger exploration — extends Schmidhuber's compression progress (1991/2009) and Oudeyer & Kaplan's learning progress motivation (2007) into a multi-objective meta-control architecture. Of the eight specific claims evaluated, five are validated with modifications, two require significant strengthening, and one (safety sufficiency) is refuted as stated. The framework's greatest strength is its principled integration of heterostatic drive theory with practical exploration mechanisms; its most critical gaps are the absence of formal safety guarantees, the limitations of weighted-sum scalarization for ethical objectives, and the lack of regret bounds for gradient-driven exploration control.

---

## 1. Intrinsic motivation foundations reveal dΩ/dt as a learning progress variant

The System Vitality framework's gradient monitoring mechanism is best understood as a **generalized, multi-objective variant of learning progress motivation** — a well-established intrinsic motivation paradigm with roots stretching back three decades.

Schmidhuber's 1991 paper "Curious model-building control systems" first proposed rewarding the **temporal derivative of prediction reliability**: r_int = E[dR(t)/dt]. His 2009 formalization sharpened this to **compression progress** — intrinsic reward equals the first derivative of subjective compressibility: r_int(t) = C(history, θ_t) − C(history, θ_{t+1}). Oudeyer and Kaplan (2007) independently developed learning progress motivation (LPM) where reward is proportional to −dε/dt, the rate of decrease in prediction error. Their Intelligent Adaptive Curiosity (IAC) system computed this as a moving average: r_int = (1/k)Σ(e_{t-i-τ} − e_{t-i}). SAGG-RIAC (Baranes & Oudeyer, 2013) extended this to competence progress in goal-space regions.

**The critical distinction** between classic learning progress and System Vitality lies in how the derivative signal is used. Classic approaches use dΩ/dt > 0 as a **positive intrinsic reward** — the agent seeks states where it learns fastest. The Vitality framework uses dΩ/dt < τ as a **meta-control trigger** to modulate exploration parameters. This is architecturally different: rather than shaping the reward function directly, the gradient signal operates at a higher abstraction level, modifying the exploration-exploitation balance itself. This meta-control architecture has closer parallels to **ReduceLROnPlateau** in deep learning optimization and **simulated annealing restarts** than to traditional intrinsic motivation.

The framework's novelty resides in three aspects not found in prior work. First, **multi-objective monitoring** — existing learning progress methods track a single prediction model; monitoring Ω as an aggregate across suffering, prosperity, and understanding objectives simultaneously is unexplored. Second, the **threshold-based stagnation detection** mechanism that triggers strategy changes rather than directly rewarding improvement. Third, the **system-level "vitality" framing** that integrates progress across multiple channels into a single health metric.

The dΩ/dt signal can be formalized information-theoretically as the **KL divergence rate** between successive posterior distributions over model parameters: dΩ/dt ≈ D_KL[p(θ_{t+Δt}|data) ‖ p(θ_t|data)] / Δt. This connects to VIME's information gain signal (Houthooft et al., 2017). Alternatively, it relates to the rate of change of mutual information I(model; environment), or to the Fisher information at the current parameter configuration — gradient flattening suggests the agent has reached a region of low Fisher information with limited extractable signal. No universal threshold τ exists in the literature; IAC uses windows of **k=10–50 episodes** with offsets of 50–200 steps, while SAGG-RIAC splits the last **ζ=50–100 goals** into halves for comparison.

---

## 2. Curiosity mechanisms and the noisy TV problem are well addressed

The framework's use of Aleatoric Mapping to suppress intrinsic reward for irreducible uncertainty is **well-grounded in the uncertainty decomposition literature** and represents one of the strongest components of the architecture.

Among major curiosity mechanisms — ICM (Pathak et al., 2017), RND (Burda et al., 2019), NGU (Badia et al., 2020), ensemble disagreement (Pathak et al., 2019), and BYOL-Explore (Guo et al., 2022) — none fully solves the noisy TV problem independently. ICM's inverse-dynamics features filter action-independent noise but fail on action-dependent stochastic traps. RND's deterministic target network bypasses stochastic dynamics but fails when noise generates many unique visual states, as demonstrated empirically by Mavor-Parker et al. (2022). Even ensemble disagreement, previously assumed robust, was shown to be "more susceptible than assumed" to high-entropy noise sources.

**Aleatoric Mapping Agents (AMA)**, introduced by Mavor-Parker et al. at ICML 2022, directly addresses this gap. AMA uses a heteroscedastic neural network (following Kendall & Gal, 2017) with dual output heads predicting both the mean μ̂ and variance Σ̂ of next-state transitions. The intrinsic reward formula — **r_int = ‖s_{t+1} − μ̂_{t+1}‖² − η·Tr(Σ̂_{t+1})** — subtracts predicted aleatoric variance from total prediction error, yielding an approximation of **epistemic uncertainty only**. This follows the decomposition: Total uncertainty ≈ Epistemic + Aleatoric, so Epistemic ≈ Total − Aleatoric. AMA was the only method that maintained robust exploration across all tested noisy TV variants, including CIFAR images, uniform random pixels, and natural game stochasticity in Bank Heist.

However, several caveats apply. Seitzer et al. (ICLR 2022) identified pitfalls in heteroscedastic uncertainty estimation, including premature convergence and compromised mean fits from inverse-variance weighting, recommending **β-NLL** as a more stable training loss. Aleatoric estimates may be unreliable for out-of-distribution states, and the hyperparameters λ (uncertainty budget) and η (uncertainty weighting) require careful tuning. A recent 2025 preprint by Hou et al. proposes **Learning Progress Monitoring (LPM)** as an alternative that achieves noise robustness without explicit uncertainty decomposition — by rewarding only when prediction error is actively decreasing, stochastic transitions with stable error naturally receive zero reward.

For graph-based knowledge, **Von Neumann entropy (VNE)** of the graph Laplacian offers a viable learning progress metric. The growth rate dH(G_t)/dt measures how quickly the knowledge graph gains structural complexity. This is naturally noise-robust: random edge additions do not produce meaningful structural growth, so dH/dt ≈ 0 for noise. Exact computation requires O(n³) eigendecomposition, but efficient approximations exist: the **quadratic approximation** Q(G) = 1 − Tr(L̃²)/n reduces cost to **O(m)** where m = |E|, and the **FINGER algorithm** (Chen et al., ICML 2019) enables O(n+m) incremental computation with provable error bounds.

---

## 3. Thompson Sampling with a dynamic variability floor is a novel integration

The exploration-exploitation mechanism in System Vitality — Thompson Sampling with a performance-dependent variability floor — combines **established techniques in a novel configuration**.

Standard Thompson Sampling achieves near-optimal regret bounds of **O(√(KT ln K))** for Gaussian priors (Agrawal & Goyal, 2012, 2013), matching the Lai-Robbins lower bound asymptotically. Posterior variance inflation is an active research area: **Stable Thompson Sampling** (Halder et al., 2025) inflates posterior variance by a logarithmic factor γ_T, with only O(log factor) regret increase. **Optimistic Posterior Sampling for RL** (Tiapkin et al., NeurIPS 2022) uses inflated posteriors to guarantee optimism, achieving Õ(√(HSAT)) regret. Chapelle & Li (2011) explored posterior widening by sampling from Beta(a/α, b/α) for α > 1.

What is novel is making the inflation factor **performance-dependent**: σ²_floor(t) = g(dΩ/dt) where stalling improvement increases the floor and positive improvement decreases it. Existing variance inflation methods use static schedules (γ_T = c·log T) or fixed per-arm computations. The bidirectional coupling — dΩ/dt simultaneously controlling both ε in ε-greedy and σ²_min in Thompson Sampling — has no exact precedent.

The closest precedent for adaptive ε is **VDBE** (Value-Difference Based Exploration, Tokic, 2010), which adapts ε based on TD error magnitude. However, VDBE and EGV operate in **opposite directions**: VDBE increases exploration when TD errors are large (rapid learning), while EGV increases exploration when improvement **stalls**. The EGV logic is closer to change-point detection in non-stationary bandits, plateau detection in optimization, and simulated annealing restarts. A 2025 paper (arXiv:2506.03324) optimizes ε directly via SGD on Bayesian regret, representing the most principled gradient-based approach to exploration scheduling.

**No formal regret bounds exist** for EGV-style methods. Convergence can be preserved if: (a) dΩ/dt → 0 implies gradual floor reduction, and (b) the floor decays at least as fast as 1/n^α for some α > 0. A time-based envelope — σ²_floor(t) ≤ C·log(T)/t — ensures bounded exploration even in worst-case stalling. A **minimum exploration floor (ε_min > 0)** is theoretically justified for non-stationary environments by Besbes, Gur & Zeevi (2014), who showed optimal regret of O(T^{2/3} · V_T^{1/3}) requiring perpetual re-exploration.

---

## 4. Heterostatic drive theory provides strong theoretical grounding

The framework's gradient-based vitality mechanism is **correctly identified as implementing a heterostatic drive**, with deep roots in computational neuroscience and developmental robotics.

The heterostatic concept originates with A. Harry Klopf's 1972 treatise "Brain Function and Adaptive Systems: A Heterostatic Theory," which posited that adaptive systems seek **maximal conditions rather than steady states**. Klopf's neurons-as-maximizers framework directly influenced Sutton and Barto's temporal-difference learning. Robert White's effectance motivation (1959) identified competence drives that are **never satisfied** — unlike biological drives that can be satiated. Oudeyer and Kaplan (2007) formalized the taxonomy: homeostatic motivations drive toward equilibrium and can be satiated; heterostatic motivations continuously push away from habitual states and **cannot be satiated**.

The most directly relevant framework is **Homeo-Heterostatic Value Gradients (HHVG)** (Yu, Chang & Kanai, 2019, Frontiers in Neurorobotics). HHVG formalizes two interacting components: a homeostatic **devaluation** mechanism (a meta-model Q learns to predict the forward model F, with KL divergence D_KL(Q||F) decreasing as Q assimilates F's predictions — this is boredom), and a heterostatic **devaluation progress** reward: **R_int = D_KL^(i)(Q||F) − D_KL^(i+1)(Q||F)** — reward for learning itself. This is structurally isomorphic to dΩ/dt monitoring. All three formulations — Schmidhuber's dC/dt, HHVG's ΔD_KL, and the Vitality framework's dΩ/dt — reward the **first derivative of capability** rather than capability level, which is definitionally heterostatic.

The critical insight from HHVG is that **pure heterostasis requires a homeostatic complement**. The homeostatic component (boredom/devaluation) ensures consolidation before outbound exploration; the heterostatic component (curiosity/progress) prevents stagnation. This creates boredom-curiosity cycles mimicking biological developmental trajectories. The System Vitality framework should incorporate this duality explicitly — the Risk Drive (Ω₁) partially serves this role by constraining unbounded growth-seeking, but a more principled consolidation mechanism following HHVG's devaluation architecture would strengthen the design.

Unbounded heterostatic drive raises stability concerns. Ecoffet, Clune & Lehman (2020) identified that open-ended AI is **inherently unpredictable** because it lacks a fixed objective. A system perpetually seeking dΩ/dt > 0 may pursue increasingly extreme strategies as simple improvements exhaust, potentially sacrificing safe behavior for exploration gains. Standard RL convergence proofs assume fixed rewards; dΩ/dt is non-stationary by construction. The recommended resolution follows Csikszentmihalyi's flow theory: soft bounds via **dynamic challenge matching**, where the threshold for "meaningful improvement" increases with capability, creating natural stabilization without hard caps.

---

## 5. The Free Energy Principle mapping is an inspired analogy, not a formal isomorphism

The relationship between System Vitality and the Free Energy Principle is **partially valid but should be characterized carefully** to avoid overclaiming formal equivalence.

In active inference, agents minimize **Expected Free Energy (EFE)**, which decomposes into **epistemic value** (expected information gain — drives exploration) and **pragmatic value** (expected preference satisfaction — drives exploitation). Precision γ controls the exploration-exploitation balance: high precision → deterministic policy selection; low precision → random exploration. Policy precision is itself inferred through Bayesian optimization, linked to dopaminergic signaling.

Three mappings between the frameworks have different validity levels:

**Strong mapping: Meta-Imperatives ↔ prior preferences.** In active inference, agents have prior preferences over observations p(o|C). The three Meta-Imperatives map naturally as multi-modal preference vectors — Ω₁ prefers low-suffering observations, Ω₂ prefers prosperity indicators, Ω₃ prefers high-understanding states. Multi-dimensional preferences are standard in POMDP active inference (implemented in pymdp by Heins et al., 2022). However, Ω₃ (understanding) is already captured by EFE's epistemic value component, creating potential double-counting if both preference and epistemic drive incentivize exploration.

**Moderate mapping: variability floor ↔ precision weighting.** Both are Bayesian mechanisms controlling exploration breadth. The formal connection through Control-as-Inference (Levine, 2018) is well-established: Thompson Sampling relates to K-learning, which is equivalent to RL-as-inference. However, active inference precision is **endogenously inferred**; a fixed variability floor is an **exogenous constraint**. The variability floor implements something like a bounded precision prior, preventing overconfidence — a valid engineering choice but not emergent from Bayesian principles.

**Weak mapping: dΩ/dt ↔ epistemic value.** These measure fundamentally different things. Epistemic value is **forward-looking and counterfactual** — expected information gain from a hypothetical action. dΩ/dt is **backward-looking and empirical** — observed rate of actual improvement. The better FEP analog for dΩ/dt is the **rate of VFE reduction** (dF/dt) or hierarchical meta-cognitive monitoring of learning progress. Millidge et al. (2021, Neural Computation) further complicate this mapping by showing that EFE does not derive straightforwardly from extending VFE into the future — the exploration bonus requires independent motivation, undermining claims that FEP "naturally" produces the exploration behavior Vitality seeks to replicate.

The most defensible framing: System Vitality implements a **computationally tractable approximation** to active inference, where Thompson Sampling approximates precision-weighted policy selection, dΩ/dt monitoring approximates hierarchical metacognitive inference, and Meta-Imperatives serve as prior preferences in a multi-objective generative model. The variability floor provides a safety guarantee that pure Bayesian precision inference cannot, since Bayesian precision can converge to infinity and eliminate exploration entirely.

---

## 6. Curriculum learning and knowledge graph metrics need refinement

The framework's use of Goal GAN + VDS for vitality-driven curriculum learning is defensible but **VDS alone is likely sufficient** and empirically superior.

**Value Disagreement Sampling** (Zhang et al., NeurIPS 2020) — selecting goals where ensemble Q-functions disagree maximally — outperformed Goal GAN on standard benchmarks (including Florensa et al.'s original Ant environments). VDS is simpler (no GAN training, no mode collapse risk), more modular (works with any goal-conditioned RL algorithm), and robust to ensemble size (even K=3 suffices). Combined with Hindsight Experience Replay (HER), VDS represents the current strongest goal-conditioned exploration approach. Goal GAN adds value only when the goal space itself must be **generated** beyond observed states — relevant for abstract/symbolic goals but unnecessary for state-based goals.

The vitality-driven curriculum integration is well-motivated. When dΩ/dt < τ signals stagnation, the system can expand the goal frontier by increasing sampling variance, sampling goals beyond current competence boundaries, and temporarily reducing difficulty thresholds. This maps directly to **dynamic difficulty adjustment's** flow channel concept: maintaining challenge-skill ratio near 50/50. When dΩ/dt > τ_high signals rapid improvement, the system shifts toward harder frontier goals, enabling progressive curriculum advancement. For graph-based goals ("learn concept X"), competence can be defined as prediction accuracy in the target concept's neighborhood, with GOID criterion adapted so "intermediate difficulty" means **40–60% of neighborhood edges predicted correctly**.

**Von Neumann entropy is the right practical choice** for measuring knowledge growth, but it cannot distinguish meaningful complexity from random connections alone. VNE measures structural complexity of the graph Laplacian: S(G) = −Tr(ρ ln ρ) where ρ = L/Tr(L). The metric ranges from 0 (empty graph) to ln(n) (complete graph), with increasing values indicating more evenly distributed connectivity. Kolmogorov complexity is theoretically superior but **incomputable in general** — practical approximations via compression or Block Decomposition Method only work for small graphs (<few hundred nodes) with no guaranteed error bounds.

The recommended composite metric combines: **Ω_graph = α·ΔS_VN + β·ΔCompressibility + γ·ΔModularity − δ·RandomnessEstimate**. This addresses the signal-vs-noise problem by tracking modularity evolution (meaningful knowledge forms community structure), compression progress (meaningful knowledge compresses better), and filtering randomness. For surprise edge formalization, **Bayesian information gain** I(e) = KL[P(KG|e) || P(KG)] quantifies how much a new edge changes beliefs about the knowledge graph, while **RIMIE** (Relation Importance Measurement based on Information Entropy) captures the inferential value of relation types. These are complementary: Bayesian gain measures surprisingness; RIMIE measures downstream utility.

---

## 7. The Risk Drive alone is insufficient — formal safety guarantees are required

The threshold-based Risk Drive (Ω₁ exceeding a threshold overrides curiosity) is **a valuable fast heuristic but is insufficient as a standalone safety mechanism** for any system operating in safety-critical domains.

Five critical failure modes undermine threshold-only safety. **Threshold miscalibration** — García & Fernández (2015) and Ray et al. (2019, Safety Gym) demonstrated that fixed trade-off parameters between reward and safety penalties have no invertible map between desired safety specifications and correct parameter settings. **Estimation errors** — Ω₁ depends on accurate state estimation; distributional shift, sensor noise, or partial observability can cause threshold evaluation on incorrect estimates. Probabilistic logic shields (Yang et al., 2023, IJCAI) specifically address noisy sensor readings that deterministic threshold checks cannot. **Delayed consequences** — instantaneous risk thresholds miss actions whose danger manifests multiple steps later; Constrained MDPs with cumulative constraints and temporal logic specifications (LTL) reason about future consequences. **No worst-case guarantees** — threshold crossing triggers only after risk detection; Shielding (Alshiekh et al., 2018) prevents unsafe actions before execution via pre-decision filtering. **Distributional shift** — learned Ω₁ estimates calibrated on training distributions may not generalize to deployment conditions.

The recommended architecture implements **defense-in-depth with four layers**:

- **Layer 1 (Formal):** Lightweight shield or safety layer for hard constraints (state boundaries, physical limits), providing pre-decision filtering via formal verification
- **Layer 2 (Risk-sensitive):** CVaR-based assessment using distributional RL (Tamar et al., 2015; Chow et al., 2017), providing tail-risk awareness for rare catastrophic outcomes
- **Layer 3 (Heuristic):** Adaptive Ω₁ threshold with **Bayesian confidence intervals** on estimates, using GP-based bounds (Berkenkamp et al., 2017) for PAC-style guarantees while remaining computationally tractable
- **Layer 4 (Recovery):** Maintained safe fallback policy using CQL-style pessimistic value estimation (Kumar et al., 2020), immediately activatable when safety layers trigger

**Bayesian safety bounds on Ω₁** are strongly recommended. Maintaining posterior uncertainty enables optimistic exploration where confidence intervals suggest safety, conservative retreat in novel states with high uncertainty, and principled threshold adaptation as data accumulates. PID-based Lagrangian methods (Stooke et al., 2020) can automatically adjust the safety-reward tradeoff based on constraint violation rate, avoiding the need for manual threshold tuning.

---

## 8. Weighted-sum scalarization fails to capture ethical priorities

The multi-objective formulation Σwᵢ Φᵢ is **a reasonable starting point** supported by recent theoretical results but has **critical failure modes** when applied to objectives with inherent ethical priority ordering.

Lu et al. (2023) showed that in static-environment MOMDPs, the value function range of stochastic stationary policies is **convex**, implying any Pareto-optimal point is achievable via linear scalarization. This is a positive result for the framework. However, five failure modes persist. **Reward scale mismatch** (HIGH risk): suffering reduction may yield large immediate rewards while understanding grows slowly over long horizons; Abdolmaleki et al. (2020, MO-MPO) demonstrated scalarized methods collapse when reward scales differ by 10×. **Weight sensitivity** (HIGH risk): small weight changes produce large, discontinuous policy changes when objectives conflict. **Inability to express ethical priorities** (CRITICAL): weighted sum cannot express "no amount of prosperity justifies increased suffering" — this is precisely what lexicographic ordering addresses. Skalse et al. (2022) proved lexicographic preferences cannot always be captured by scalar rewards. **No satisficing behavior**: weighted sum always maximizes, preventing specification of "sufficient" levels for higher-priority objectives.

The recommended approach uses **Thresholded Lexicographic Ordering (TLO)**: suffering reduction holds strict priority until threshold τ₁ is met; then prosperity is optimized until threshold τ₂; then understanding is maximized without constraint. This maps naturally to the ethical structure of the Meta-Imperatives while retaining computational tractability — Skalse et al. showed lexicographic MDPs retain desirable properties including existence of stationary, uniformly optimal policies. **Chebyshev scalarization** — min max_i w_i|Φᵢ* − Φᵢ| — should augment TLO as a fallback, since it can find all Pareto-optimal points regardless of front shape, unlike linear scalarization.

For gradient-based vitality monitoring under Pareto optimization, the **hypervolume indicator** provides a scalar summary of multi-objective progress: dHV/dt > 0 indicates the Pareto front is expanding. Alternatively, **Successor Features** (Barreto et al., 2017) naturally decompose Q(s,a) = ψ(s,a)ᵀw, aligning with the Σwᵢ Φᵢ structure and enabling zero-shot transfer to new weight configurations.

---

## 9. Continual learning requires a hybrid CLS-inspired architecture

Graph topology provides **structural resilience against catastrophic forgetting** — adding nodes and edges to a knowledge graph does not overwrite existing structure — but this resilience is **limited to the symbolic layer**. Neural parameters processing graph data (GNN weights, attention coefficients, message-passing functions) are equally susceptible to forgetting as any neural network. Carta et al. (2022) benchmarked catastrophic forgetting in deep graph networks and confirmed that GNNs suffer from it; Liu et al. (2021, AAAI) showed standard CNN-based continual learning methods are insufficient for GNNs because they ignore topological aggregation mechanisms.

The recommended architecture follows the **Complementary Learning Systems (CLS)** framework (McClelland et al., 1995): a fast learner (analogous to hippocampus) processes new experiences with high fidelity, storing them including Ω gradients; a slow learner (analogous to neocortex) gradually extracts statistical regularities via interleaved replay. **EWC + Experience Replay** together significantly outperform either alone — EWC alone achieves only 45.7% forgetting reduction on knowledge graph tasks. **TWP** (Topology-Aware Weight Preserving, Liu et al., 2021) is the most effective GNN-specific method, preserving both topological aggregation patterns and loss-important weights. Storing Ω gradients in the replay buffer enables the system to remember which states were dangerous even as the environment evolves, mirroring biological prioritization of emotionally salient memories for consolidation.

---

## 10. Transfer learning benefits from vitality-driven diversity

Vitality-driven exploration likely **enhances generalization**, but only with complementary mechanisms. The multi-objective nature of Ω = Σwᵢ Φᵢ creates diverse exploration pressure: when Φ₁ (suffering reduction) saturates, the agent must improve Φ₂ or Φ₃ to maintain dΩ/dt > 0, naturally producing behavioral diversity. **DIAYN** (Eysenbach et al., 2019) demonstrates that skill diversity — maximizing I(S;Z) between states and latent skill variables — serves as effective pretraining for downstream tasks. **Successor Features** (Barreto et al., 2017) provide a formal mechanism: if Ω decomposes linearly into features, SF+GPI enables zero-shot transfer with performance guarantees. The understanding imperative (Φ₃) directly incentivizes world model learning, and agents with better world models generalize better — the foundation of model-based transfer and dream-based planning (MuZero).

However, maintaining dΩ/dt > 0 indefinitely is **impossible in finite environments**, and scalarized vitality can obscure individual objective dynamics — dΩ/dt > 0 could mask degradation of one objective compensated by improvement in another. The framework should monitor individual dΦᵢ/dt signals alongside the aggregate, and explicitly optimize for skill diversity (DIAYN-style objective) to prevent mode collapse.

---

## Validation of the eight specific claims

### Claim 1: "Gradient-based vitality (dΩ/dt < τ) detects stagnation" — VALIDATED WITH PRECEDENT

This is a **variant of learning progress monitoring** (Schmidhuber, 1991/2009; Oudeyer & Kaplan, 2007), not a fundamentally new mechanism. The novelty lies in multi-objective aggregation, use as a meta-control trigger rather than direct reward, and the system-vitality framing. No universal τ values exist; adaptive thresholds based on running statistics — e.g., dΩ/dt < μ(dΩ/dt) − c·σ(dΩ/dt) — are recommended over fixed values. The mechanism should cite Schmidhuber (1991, 2009), Oudeyer & Kaplan (2007), and Baranes & Oudeyer (2013) as foundational precursors.

### Claim 2: "Thompson Sampling with dynamic variability floor" — PARTIALLY NOVEL

Variance inflation in Thompson Sampling is established (Stable TS, Halder et al., 2025; Optimistic TS, Chapelle & Li, 2011; OPSRL, Tiapkin et al., 2022). Making the floor **performance-dependent via dΩ/dt** is novel. However, no formal regret bounds exist for this configuration. Convergence can be preserved by adding a time-based envelope: σ²_floor(t) ≤ C·log(T)/t. Halder et al. showed variance inflation by log factors adds only O(log) regret increase — acceptable.

### Claim 3: "Aleatoric Mapping prevents noisy TV problem" — VALIDATED

AMA (Mavor-Parker et al., ICML 2022) is the **strongest single method** across all tested noisy TV variants, outperforming RND, ensemble disagreement, and ICM. The formula r_int = prediction_error − η·predicted_variance correctly approximates epistemic uncertainty. Recommendations: use **β-NLL** instead of standard NLL for more stable training (Seitzer et al., 2022), and consider combining with learning progress monitoring for additional robustness during early training when aleatoric estimates are unreliable.

### Claim 4: "Risk Drive (Ω₁ threshold) overrides curiosity for safety" — INSUFFICIENT AS STATED

A threshold-based override is a valuable fast heuristic but is **insufficient for safety-critical systems**. It fails under threshold miscalibration, estimation errors, delayed consequences, distributional shift, and provides no worst-case guarantees. A layered defense-in-depth architecture is required: formal shielding + CVaR risk assessment + Bayesian Ω₁ bounds + safe fallback policy. This is the framework's most critical gap.

### Claim 5: "Goal GAN + VDS targets vitality exploration efficiently" — PARTIALLY VALIDATED, SIMPLIFY

VDS alone is **empirically superior** to Goal GAN on standard benchmarks and is simpler, more modular, and more robust. Goal GAN adds value only when goal spaces must be generated beyond observed states. For graph-based goals, adapt VDS by measuring ensemble disagreement among graph prediction models about the value of exploring particular concepts. The vitality-curriculum integration (stagnation → frontier expansion) is well-motivated by dynamic difficulty adjustment and flow theory.

### Claim 6: "Von Neumann entropy growth measures understanding" — VALIDATED WITH CAVEATS

VNE is the **right practical choice** — Kolmogorov complexity is incomputable, and practical approximations lack guaranteed error bounds. However, VNE alone cannot distinguish meaningful complexity from random graph growth. A composite metric combining VNE growth, compression progress, modularity evolution, and randomness filtering is recommended. The quadratic approximation reduces computation to O(m), and FINGER enables O(n+m) incremental updates.

### Claim 7: "Heterostatic drive prevents stagnation at local optima" — VALIDATED

dΩ/dt monitoring correctly implements heterostatic drive, aligned with Schmidhuber's compression progress, HHVG's devaluation progress, Oudeyer & Kaplan's LPM, Klopf's heterostatic theory, and White's competence motivation. The critical insight from HHVG: **pure heterostasis requires a homeostatic complement**. The framework should implement explicit consolidation phases and boredom-curiosity cycles following HHVG's reconciliation architecture. Heterostatic drive should have soft bounds through flow-inspired dynamic challenge matching, not hard caps.

### Claim 8: "Multi-objective weighted sum (Σwᵢ Φᵢ) balances Meta-Imperatives" — INSUFFICIENT FOR ETHICAL OBJECTIVES

Weighted sum is computationally convenient and supported by Lu et al.'s convexity result, but it **cannot express ethical priority orderings**. The claim "no amount of prosperity justifies increased suffering" is inexpressible via linear scalarization. **Thresholded Lexicographic Ordering** with adaptive weights during training is recommended. Reward scale normalization is essential to prevent one imperative from dominating.

---

## Conclusion: a strong synthesis requiring targeted strengthening

The System Vitality framework is not a collection of ad hoc mechanisms but a **coherent architecture grounded in established RL theory**. Its core insight — that gradient-based vitality monitoring can serve as a meta-control signal for exploration — represents a genuine contribution that extends the learning progress paradigm into multi-objective meta-control. The heterostatic drive formalization, the Thompson Sampling integration, and the AMA-based noisy TV prevention all have solid theoretical foundations.

Three critical gaps require immediate attention. **Safety architecture** needs formal guarantees beyond threshold-based overrides — implementing a layered defense with shielding, CVaR, and Bayesian confidence bounds on Ω₁ is the highest priority. **Multi-objective formulation** should transition from weighted sum to thresholded lexicographic ordering to properly capture the ethical priority structure of the Meta-Imperatives. **Convergence guarantees** for the EGV/dynamic variability floor mechanism are absent — adding time-based regret envelopes and developing formal bounds for gradient-driven exploration control would significantly strengthen the theoretical foundations.

The framework would also benefit from explicitly incorporating HHVG's homeostatic complement (consolidation phases alongside heterostatic exploration), adopting Successor Features for natural multi-objective transfer, and implementing a composite knowledge metric that goes beyond VNE alone to filter meaningful complexity from noise. With these refinements, the System Vitality architecture represents a well-founded approach to the curiosity problem that synthesizes three decades of intrinsic motivation research into a practical, implementable system.