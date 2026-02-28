# Thompson Routing Hypotheses

## H-010: Context-Blocked Posteriors Exploit Bias-as-Strength

- **Source:** Self-Recursive Learning §2, Thompson Router Architecture
- **Claim:** Maintaining separate Beta distributions per (model, context_cluster) allows exploiting
  model specialisation — a model that's poor at coding but excellent at review gets routed
  to review tasks, not suppressed entirely
- **Status:** validated
- **Evidence:**
  - `src/patterns/thompson-router/select-model.ts` — `selectModel()` queries arm stats per context cluster
  - `src/patterns/thompson-router/router.ts` — Thompson sampling implementation
  - Live execution in DND-Manager confirms routing convergence
- **Notes:** Even models with 80% hallucination rates provide value when properly governed (Mistral finding)

## H-011: Thompson Exploration Rate Decays Naturally

- **Source:** Thompson Router Architecture §exploration
- **Claim:** Thompson sampling's exploration rate decreases naturally as evidence accumulates,
  without requiring an explicit exploration schedule
- **Status:** validated
- **Evidence:**
  - `src/patterns/thompson-router/router.ts` — Beta distribution convergence
  - Mathematical property of Beta(α, β): variance decreases as α+β increases
- **Notes:** No ε-greedy or UCB needed. The Bayesian approach handles explore/exploit intrinsically.

## H-012: Minimum Trial Threshold Before Exploitation

- **Source:** Engineering Bridge v2.0
- **Claim:** Models need minimum N observations per context before Thompson can reliably exploit
- **Status:** proposed
- **Evidence:** Not formally tested — Thompson works from trial 1 but early routing is noisy
- **Notes:** Research question: what's the empirical convergence point? Needs live data analysis.
