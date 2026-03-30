# Add Archived label to Gnosis A7 allowed label set

> Task ID: t8
> Model: claude-opus-4-6:adaptive:medium
> Duration: 29921ms
> Output chars: 4450
> Timestamp: 2026-03-29T22:35:53.412Z

---

# Analysis: Add 'Archived' to Gnosis A7 Allowed Label Set

## Summary

The change required is narrow and well-isolated: a single string addition to the `ALLOWED_LABELS` set constant in `src/patterns/cognitive/checks/axioms.ts`. This enables morphemes bearing the `Archived` label to pass the A7 Semantic Stability axiom check.

---

## Findings

### F1: Target Constant Identified

The `ALLOWED_LABELS` set on **line 18** is the sole gate for A7 validation. It currently contains 11 entries spanning the six grammar morphemes (`Seed`, `Bloom`, `Resonator`, `Grid`, `Helix`, `Stage`) plus five known specialisations (`PipelineRun`, `Observation`, `Decision`, `TaskOutput`, `Distillation`).

**Evidence:** The `checkA7()` function (starting ~line 202) filters `target.labels` against this exact set. Any label not present triggers a severity `"error"` failure. No secondary allowlist or override mechanism exists.

### F2: 'Archived' Is a Lifecycle/State Label, Not a Morpheme Type

Unlike the existing entries — which represent structural morpheme types or pipeline specialisations — `Archived` is a **lifecycle state label**. It marks a morpheme as no longer active rather than defining what it structurally is. This is a semantic category distinction worth noting but does not block inclusion; the set's docstring already says "known specialisations," and lifecycle labels fit that umbrella.

**Evidence:** M-10.1 requirement 7 specifies `updateMorpheme()` will apply `Archived` via an `addLabels` parameter with allowlist `['Archived']`. Requirement 8 explicitly mandates A7 accommodation.

### F3: No Other Axiom Is Affected

A review of all seven axiom checks confirms no side-effects:

| Axiom | Impact | Reasoning |
|-------|--------|-----------|
| A1 (Fidelity) | None | Checks `content` property, not labels |
| A2 (Visible State) | None | Checks relationship types |
| A3 (Transparency) | None | Checks required properties per `morphemeType` string; `Archived` is a label, not a morphemeType |
| A4 (Provenance) | None | Checks `createdAt`, `seedType`, `INSTANTIATES` edges |
| A6 (Minimal Authority) | None | Checks cross-Bloom `FLOWS_TO` counts |
| A7 (Semantic Stability) | **Direct** | Label allowlist — this is the target |
| A9 (Comprehension Primacy) | None | Checks content length thresholds |

**Evidence:** Each check function operates on orthogonal properties/relationships. Label membership is only consulted in `checkA7()`.

### F4: Placement Convention

The existing entries follow a logical grouping: core morphemes first, then specialisations. `Archived` should be appended after the specialisation group or placed in a clearly separated lifecycle-label section for readability.

### F5: TypeScript Compilation

The `ALLOWED_LABELS` set is typed as `Set<string>` (inferred). Adding another string literal has zero type-level impact. No generic constraints, discriminated unions, or exhaustive switches reference this set elsewhere in the file.

---

## Recommendations

1. **Add `"Archived"` to the `ALLOWED_LABELS` set.** Place it after the current specialisation entries. Consider adding a brief inline comment (e.g., `// lifecycle labels`) to distinguish it from morpheme-type labels for future maintainers.

2. **Verify with the prescribed command:** `npx tsc --noEmit && npm run test -- axioms` — compilation must pass, and existing A7 test cases must remain green while any new test asserting `Archived` passes.

3. **Future-proof consideration:** If additional lifecycle labels are anticipated (e.g., `Deprecated`, `Superseded`), consider extracting a separate `LIFECYCLE_LABELS` set and merging it into `ALLOWED_LABELS` at module load. This is not required for the current task but would improve extensibility.

4. **No changes needed to `checkA7()` logic itself.** The function's filtering against `ALLOWED_LABELS.has(l)` will automatically accept `Archived` once the set is updated.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Typo in label string causes silent mismatch | Low | High | Test with explicit `Archived`-labeled node in axiom test suite |
| Other axioms regress | Negligible | High | Full axiom test suite run confirms isolation |
| Unintended labels slip through | None | N/A | Only `Archived` is added; allowlist remains closed |

**Overall risk: Very Low.** This is a single-element set addition with no downstream logic changes.