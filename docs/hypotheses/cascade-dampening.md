# Cascade Dampening Hypotheses

## H-001: Subcriticality via Budget-Capped Dampening

- **Source:** Safety Analysis §4, Parameter Validation §3.2
- **Claim:** γ_eff = min(γ_base, 0.8/k) ensures k × γ < 1 for all k ≥ 1
- **Status:** validated
- **Evidence:**
  - `src/computation/dampening.ts` — `computeGammaEffective()` implements formula
  - `tests/safety/subcriticality.test.ts` — subcriticality test for k=1..20
  - Algedonic bypass (ΦL < 0.1 → γ=1.0) correctly overrides for emergency signalling
- **Notes:** 81.6% cascade magnitude reduction vs fixed γ=0.7 (Safety Analysis finding)

## H-002: Maximum Cascade Depth of 2

- **Source:** Engineering Bridge v2.0 §dampening, Safety Analysis §5
- **Claim:** Cascade propagation should be limited to depth 2 to prevent runaway effects
- **Status:** validated
- **Evidence:**
  - `src/computation/dampening.ts` — cascade limit constant
  - `tests/safety/cascade-limit.test.ts` — depth limit test
- **Notes:** Combined with budget cap, provides dual safety: structural (depth limit) + mathematical (subcriticality)

## H-003: Hub Scaling via √k

- **Source:** Parameter Validation §3.4
- **Claim:** Hub nodes (high-degree) should have γ_hub = γ_base/√k to prevent degree-correlated amplification
- **Status:** deferred
- **Evidence:** Not yet implemented — current propagation uses uniform dampening
- **Notes:** Requires degree-aware propagation. Low priority until graph has enough nodes for hub effects to matter.
