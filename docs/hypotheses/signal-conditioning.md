# Signal Conditioning Hypotheses

## H-020: ΦL as 4-Factor Composite Health Score

- **Source:** Parameter Validation §5.1, Engineering Bridge v2.0 §Part 2
- **Claim:** ΦL is computed from 4 weighted factors: axiom_compliance (0.4), provenance_clarity (0.2),
  usage_success_rate (0.2), temporal_stability (0.2)
- **Status:** validated
- **Evidence:**
  - `src/computation/phi-l.ts` — `computePhiL()` implementation with 4-factor weights
  - `tests/conformance/state-dimensions.test.ts` — composite structure tests
  - `tests/conformance/type-conformance.test.ts` — ΦL is never bare number
- **Notes:** ΦL must always be a structured composite, never a bare number (CLAUDE.md Rule 4)

## H-021: ΨH via λ₂ Structural Coherence + Runtime Friction

- **Source:** Harmonic Resonance paper, Engineering Bridge v2.0 §Part 2
- **Claim:** ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction), measuring structural coherence
  through spectral graph properties
- **Status:** validated
- **Evidence:**
  - `src/computation/psi-h.ts` — `computePsiH()` implementation
  - `tests/conformance/state-dimensions.test.ts` — composite computation tests
- **Notes:** Uses coefficient of variation of inter-arrival times for friction component

## H-022: εR Spectral Calibration Table

- **Source:** Parameter Validation §5.3, Engineering Bridge v2.0
- **Claim:** εR minimum floor depends on spectral ratio: >0.9→0.05, 0.7-0.9→0.02, 0.5-0.7→0.01, <0.5→0.0
- **Status:** validated
- **Evidence:**
  - `src/computation/epsilon-r.ts` — spectral calibration implementation
  - `tests/conformance/state-dimensions.test.ts` — spectral ratio tests
- **Notes:** Prevents over-exploitation in well-explored state spaces

## H-023: Algedonic Bypass at ΦL < 0.1

- **Source:** Safety Analysis §6, Engineering Bridge v2.0
- **Claim:** When ΦL drops below 0.1, normal dampening rules are bypassed (γ=1.0) to ensure
  critical degradation signals propagate without attenuation
- **Status:** validated
- **Evidence:**
  - `src/computation/dampening.ts` — algedonic check
  - `tests/safety/algedonic-bypass.test.ts` — algedonic bypass test
- **Notes:** This is the emergency signalling mechanism. Without it, deeply degraded patterns
  could be invisible due to dampening.
