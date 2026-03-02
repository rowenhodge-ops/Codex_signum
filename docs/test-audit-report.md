# Test Audit Report — Codex Signum Core

**Date:** 2026-03-02
**Baseline:** 841 tests passing, 50 test files, 214 barrel exports
**Commit:** `d08c864`

## Test Coverage Matrix

### Axioms (A1 excluded per instruction)

| Axiom | Existing Tests | Level(s) | Gap |
|-------|---------------|----------|-----|
| A2. Transparency | constitutional-engine (evaluateAxioms checks factors/weights/effective presence), type-conformance (PhiL structure) | L1, L2 | No structural test that every computed signal has a human-readable explanation path. No test that Thompson `selectModel()` result has `reasoning`. No test that pipeline stages expose intermediate contributions. |
| A3. Fidelity | constitutional-engine (phiL.effective in [0,1]), state-dimensions (computePhiL/PsiH determinism) | L1 | No determinism test (run 100x, verify identical). No test that signal pipeline has no hidden mutable state. No test that `Math.random()` is absent from computation modules. |
| A4. Visible State | constitutional-engine (checks phiL+psiH+epsilonR presence), write-observation (healthBand), phi-l (composite structure), type-conformance (PhiL/PsiH/EpsilonR type shapes) | L1, L2, L5 | No structural test that health lives in graph nodes, not logs/separate DB. No anti-test that console.log is never the primary output destination. |
| A5. Minimal Authority | constitutional-engine (returns true — structural invariant) | L1 | No test that pattern stages import only declared dependencies. No test that writeObservation accepts context as parameter, not fetching internally. |
| A6. Provenance | constitutional-engine (provenanceClarity > 0), data-provenance (arm stats from graph, decision records selectedSeedId), write-observation (raw value preserved) | L1, L2 | No test that ObservationProps requires sourceBloomId. No test that HumanFeedback has complete provenance. No anti-test that empty sourceBloomId fails. |
| A7. Reversibility | constitutional-engine (returns true — structural invariant) | L1 | No test that ThresholdEvents are CREATE not MERGE. No test that Observations are append-only. No test that ΦL ring buffer preserves history. |
| A8. Semantic Stability | constitutional-engine (returns true — types enforce), constitutional-evolution (amendment lifecycle), type-conformance (morpheme kinds = 6) | L1, L2, L5 | No test that deprecated aliases exist for renamed entities. No test that barrel exports only grow. |
| A9. Comprehension Primacy | constitutional-engine (memory flow validation), phi-l (composite not scalar), type-conformance (PhiL decomposed fields) | L1, L2 | No test that every exported health function returns structured objects (not bare numbers). |
| A10. Adaptive Pressure | constitutional-engine (epsilonR.value > 0), epsilon-r (floor enforcement, warnings), patterns (DEFAULT_ROUTER_CONFIG eR > 0), thompson-sampling (L4 exploration-exploitation) | L1, L4, L5 | No integration test that Thompson posteriors actually shift after outcome sequence. |

### Grammar Rules

| Rule | Existing Tests | Level(s) | Gap |
|------|---------------|----------|-----|
| G1. Proximity | write-observation (OBSERVED_IN relationship explicit), decision-lifecycle (ROUTED_TO explicit) | L2 | No test that all schema relationships are typed (no generic CONNECTED_TO). No integration test that writeObservation creates only named relationships. |
| G2. Orientation | architect-pipeline (7-stage ordering), devagent-cli (stage sequence) | L3 | No test that dispatch cannot run before gate. No test that writeObservation flow is strictly sequential (raw→conditioned→ΦL→band→threshold→cascade). |
| G3. Containment | cascade-limit (depth 2), subcriticality (γ ≤ 0.7), dampening (propagation BFS), algedonic-bypass (full propagation at ΦL < 0.1) | L1, L5 | No test for cross-pattern import isolation. No test that writeObservation affects only target Bloom plus explicit cascade neighbors. |
| G4. Flow | No direct tests of dormant/active state enforcement | — | No test that dormant Blooms reject observations. No test that Thompson routing excludes dormant Seeds. |
| G5. Resonance | psi-h (friction from divergent health), aggregation (PsiH from subgraph) | L1, L5 | No integration test demonstrating friction relationship across varying node health combinations. |

### Morphemes

| Morpheme | Existing Tests | Level(s) | Gap |
|----------|---------------|----------|-----|
| Seed | arm-stats, decision-lifecycle, select-model, thompson-router, bootstrap | L1, L2 | Covered at type and routing level. No composition test. |
| Line | dampening (edges between nodes), morphemes type (LineDirection) | L1, L2 | No test that Line enforces direction semantics. |
| Bloom | aggregation, hierarchical-health, write-observation, decision-lifecycle (CORE_BLOOMS) | L1, L2 | Covered at aggregation level. No structural composition test. |
| Resonator | patterns (Thompson sampling), human-feedback (Thompson integration) | L1, L2 | No direct Resonator type test beyond type-conformance. |
| Grid | type-conformance (Grid shape) | L2 | Type shape only. No functional test. |
| Helix | memory-operations (EphemeralStore correction state) | L1 | Correction helix path tested. No learning/evolutionary mode test. |

### Anti-Patterns

| Anti-Pattern | Existing Tests | Level(s) | Gap |
|-------------|---------------|----------|-----|
| Dimensional Collapse | phi-l (PhiL always composite), type-conformance (PhiL/PsiH/EpsilonR structure), hallucination-detection (eliminated entities, wrong counts), cross-task-injection (canonical constants) | L1, L2, L5 | No grep-based test that no exported computation function returns bare `number`. |
| Shadow System (Observer) | hallucination-detection (flags "Observer pattern" reference) | L1 | No structural grep test that src/ contains no Observer/Sentinel/monitor infrastructure, no setInterval/setTimeout polling. |
| Fixed Dampening γ=0.7 | dampening, subcriticality | L1, L5 | Covered by safety tests. |
| Fixed Circuit Breaker Cooldown | circuit-breaker (exponential backoff + jitter) | L1, L5 | Covered. |
| Hysteresis 1.5× | hysteresis safety test (HYSTERESIS_RATIO = 2.5) | L5 | Covered. |
| Bare Number as Health | phi-l (always composite), type-conformance | L2, L5 | Covered at type level. |
| Static Retention Window | compaction, memory (exponential decay) | L1 | Covered. |
| Infrastructure-First | None | — | No test that src/ is free of Redis/Kafka/Firebase/LangChain imports. |
| Model-Centric Thinking | None | — | No test that selectModel treats models as interchangeable arms. No test that function signatures don't contain model names. |
| Manual Analysis Bypass | None (process anti-pattern, not testable structurally) | — | N/A |

### Patterns (Pipeline-level)

| Pattern | Existing Tests | Level(s) | Gap |
|---------|---------------|----------|-----|
| Architect (7-stage) | architect-pipeline (end-to-end with mocks), architect (individual stages) | L1, L2, L3 | No GATE rejection prevents DISPATCH test. No quality gate tests (acceptance_criteria non-empty, hallucination detection flags). No learning integration (Decision node shape, manifest shape). |
| DevAgent (4-stage) | dev-agent (config, mapping, shape), devagent-cli (presets, assessor, pipeline with mocks) | L1, L2, L3 | 7 todo tests unimplemented. No test for output-only safe default. No test for feedback.ts compatibility. |
| Thompson Router | thompson-router, thompson-sampling, patterns, arm-stats, select-model | L1, L2, L4 | No context-blocked posterior independence test. No test that capability requirements are respected. No HumanFeedback rejection penalty test at router level. |
| Retrospective | retrospective (convergence, worstBand, runRetrospective) | L1, L2 | No cross-pattern analysis test. No learning loop closure test (output consumable by Architect). |

## Level Distribution (Existing)

| Level | Count (describe blocks) | % |
|-------|------------------------|---|
| L1 Unit | ~75 | ~56% |
| L2 Contract | ~35 | ~26% |
| L3 Pipeline | ~8 | ~6% |
| L4 Outcome | ~2 | ~1.5% |
| L5 Invariant | ~14 | ~10.5% |

**Key finding:** The test suite is heavily weighted toward L1 (unit) and L2 (contract). Structural enforcement (L3-L5) accounts for only ~18% of describe blocks. The "nails are straight" but we need more tests that "the nails hold the house together."

## Critical Gaps Summary

1. **No axiom enforcement tests** — axioms are checked by the constitutional engine as boolean flags, but no test verifies the axiom is *structurally impossible to violate*
2. **Grammar rule G4 (Flow)** has zero test coverage — dormant state enforcement untested
3. **Anti-pattern structural impossibility** untested — we document anti-patterns but don't structurally verify they can't occur
4. **Pattern governance** — pipeline stage ordering is tested for Architect but quality gates, learning integration, and feedback loops lack structural tests
5. **Determinism** — A3 (Fidelity) has no multi-run determinism test
6. **Cross-pattern isolation** — G3 (Containment) import boundaries untested
