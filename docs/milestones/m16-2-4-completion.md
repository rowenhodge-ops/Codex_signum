# M-16.2 + M-16.4 Completion Report

**Milestones:** M-16.2 (Axiom Canonicalization) + M-16.4 (Governance Updates)
**Date:** 2026-03-06
**Status:** Complete — pending governance gate

---

## Summary

Propagated the v4.3 canonical 9-axiom structure through all governance files, hallucination detection, documentation, and tests. The v4.3 spec removed Symbiosis (absorbed into A2 Visible State + A9 Comprehension Primacy), reducing axiom count from 10 to 9.

---

## Axiom List (Before → After)

**Before (v3.0, 10 axioms):**
1. Symbiosis, 2. Transparency, 3. Fidelity, 4. Visible State, 5. Minimal Authority, 6. Provenance, 7. Reversibility, 8. Semantic Stability, 9. Comprehension Primacy, 10. Adaptive Pressure

**After (v4.3, 9 axioms — DAG ordered):**
1. Fidelity, 2. Visible State, 3. Transparency, 4. Provenance, 5. Reversibility, 6. Minimal Authority, 7. Semantic Stability, 8. Adaptive Pressure, 9. Comprehension Primacy

---

## Files Changed

### Scripts
- `scripts/bootstrap-task-executor.ts` — `CANONICAL_AXIOM_NAMES` 10→9, `ELIMINATED_ENTITIES` +Symbiosis, `detectHallucinations` count 10→9, consistency checker comments

### Source (comments only — no interface changes)
- `src/types/state-dimensions.ts` — comment "10 axioms" → "9 axioms"
- `src/types/constitutional.ts` — comment updated with migration note
- `src/constitutional/engine.ts` — comments updated with migration note
- `src/computation/phi-l.ts` — comment "10 axioms" → generic

### Tests (3 files, 8 assertions updated)
- `tests/anti-patterns/dimensional-collapse.test.ts` — axiom count check 10→9
- `tests/conformance/hallucination-detection.test.ts` — 6 assertions updated (count, names, eliminated entity)
- `tests/conformance/cross-task-injection.test.ts` — axiom count 10→9

### Documentation
- `CLAUDE.md` — Dimensional Collapse anti-pattern, spec references, Assayer pattern, regression baselines (841→1369 tests, 214→264 exports), architecture tree
- `docs/specs/01_codex-signum-v3_0.md` — supersession notice
- `docs/specs/codex-signum-v3_0.md` — supersession notice
- `docs/specs/02_codex-signum-v3_1-adaptive-imperative-boundaries.md` — supersession notice
- `docs/specs/codex-signum-v3_1-adaptive-imperative-boundaries.md` — supersession notice

### Build
- `dist/` — rebuilt (constitutional, types changes)

---

## Stale References Fixed

| Location | Before | After |
|---|---|---|
| `CANONICAL_AXIOM_NAMES` | 10 entries with Symbiosis | 9 entries, v4.3 DAG order |
| `ELIMINATED_ENTITIES` | Missing Symbiosis | Added "Symbiosis" + "symbiosis" |
| `detectHallucinations` | `count !== 10` | `count !== 9` |
| `checkConsistency` | "canonical 10" | "canonical 9" |
| CLAUDE.md Dimensional Collapse | "9 axioms" flagged as hallucination | "10 axioms" flagged |
| CLAUDE.md baselines | 841 tests, 214 exports | 1369 tests, 264 exports |
| v3.0/v3.1 specs | No supersession notice | Supersession notice added |

**Total stale references fixed:** 15+

---

## ELIMINATED_ENTITIES Additions

- `"Symbiosis"` — former axiom A1, absorbed into A2+A9 at v4.0
- `"symbiosis"` — lowercase variant for case-insensitive detection

---

## Remaining Work (Out of Scope)

The `AxiomCompliance` interface in `src/types/constitutional.ts` still has 10 boolean fields (including `symbiosis`). The `evaluateAxioms()` function in `src/constitutional/engine.ts` still evaluates 10 axioms. This is a structural type change that would cascade into computation functions (`computeAxiomComplianceFactor`, phi-l.ts) and many tests. Migration notes have been added to both files. This should be a separate milestone.

---

## Verification

- `npx tsc --noEmit` — clean
- `npm test` — 1369 passed, 19 skipped, 0 failed (82 files)
- `node -e "..."` — 264 exports
- Stale reference grep — only legitimate references remain (interface fields, ELIMINATED_ENTITIES, migration notes)

---

## Commits

| SHA | Message |
|---|---|
| `225e0a0` | fix(governance): M-16.2 axiom canonicalization 10→9 + test updates |
| `f0b7781` | fix(governance): M-16.4 CLAUDE.md — axiom count, Assayer ref, baseline update |
| `2220fd7` | docs(governance): M-16.4 supersession notices on v3.0/v3.1 specs |
| (this) | docs(M-16.2+16.4): completion report |

---

**Note:** Pending governance gate. Milestone Blooms not stamped per policy.
