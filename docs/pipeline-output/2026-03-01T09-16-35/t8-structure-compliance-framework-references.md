# Structure Compliance Framework References

> Task ID: t8
> Model: claude-opus-4-6:adaptive:max
> Duration: 78082ms
> Output chars: 11535
> Timestamp: 2026-03-01T09:21:39.482Z

---

# Analysis: Structuring the Compliance Framework (`src/compliance/framework.ts`)

## 1. Current State

The file `src/compliance/framework.ts` does not yet exist. This analysis defines the structural requirements, compliance considerations, and design decisions that must be resolved before implementation.

---

## 2. Structural Requirements

### 2.1 Verification Contract

The verification command constrains the top-level shape:

```
framework.axioms  → must be an object (not array) with exactly 10 enumerable keys
```

This implies the export must be a named export `framework` with at minimum an `axioms` property keyed by identifier (not indexed by position). This is a critical design signal — **keying by identifier rather than ordinal position insulates the structure from axiom-reordering changes**, which is directly relevant to one of the intent's flagged concerns.

### 2.2 Required Sections

| Section | Cardinality | Key Type | Purpose |
|---|---|---|---|
| `axioms` | Exactly 10 | String identifier (e.g., `"irreducibility"`) | Axiom definition + test predicate anchor |
| `grammarRules` | Exactly 5 | String identifier | Grammar rule definition + violation signature |
| `antiPatterns` | Exactly 10 (rows 1-10) | Numeric or string ID | Anti-pattern description + detection heuristic |

### 2.3 Per-Entry Schema (Recommended)

Each entry across all three sections should carry:

- **`id`**: Stable, order-independent identifier
- **`label`**: Human-readable name
- **`description`**: Normative statement of the principle
- **`testPredicate`**: A function signature or discriminant tag for programmatic compliance checks
- **`violationSignature`**: What a violation looks like (inverted form of the principle)

---

## 3. Key Findings and Compliance Testing

### Finding F-1: Axiom Ordering Must Not Be Load-Bearing

**Concern from Intent:** Axiom ordering changes were proposed in one of the M-7B spec reviews.

**Analysis:** If the data structure uses an array or depends on insertion order (e.g., `Object.keys()` iteration order matching axiom "rank"), then reordering axioms becomes a breaking change. The verification command checks `Object.keys(framework.axioms).length`, not order.

**Test against framework:**
- **Axiom: Irreducibility** — Each axiom is an independent, irreducible unit. Encoding order-dependence between them violates this.
- **Grammar Rule: Composition** — Axioms compose; they do not sequence.
- **Anti-pattern Row 3 (Implicit Ordering)** — Relying on implicit key order in JS objects is a known anti-pattern.

**Classification: VALIDATED (with constraint)**
The framework file MUST use an unordered record type (`Record<string, AxiomDefinition>`), not an array or `Map` with ordinal semantics. Any axiom ordering proposal is **rejected at the data-structure level** — order is a presentation concern, not a storage concern. If a canonical ordering is needed for documentation, it should be a separate computed view (a sorted array derived from the record), not baked into the source of truth.

**Timing:** Resolve NOW — it is foundational to the file's type signature.

---

### Finding F-2: Error Morpheme — Risk of Collapsing 3D State into Binary

**Concern from Intent:** One review recommended an "Error" morpheme. Does this collapse triadic (3D) state into binary (success/failure)?

**Analysis:** The Codex Signum framework operates on triadic structures (a core axiom). A simple `Error` morpheme that models state as `Ok | Error` is a binary decomposition. This is a direct violation:

**Test against framework:**
- **Axiom: Triadic Structure** — State must be representable in at least three dimensions. Binary error modeling collapses the third dimension (context/partial/indeterminate).
- **Anti-pattern Row 1 (Binary Reduction)** — Forcing multi-valued states into boolean discriminants.
- **Grammar Rule: Morpheme Integrity** — A morpheme must be self-contained and irreducible. "Error" as a catch-all is not irreducible; it conflates absence, failure, invalidity, and indeterminacy.

**Classification: REJECTED as stated → REFRAMED**

**Reframing:** Instead of a binary `Error` morpheme, the framework file should model compliance test outcomes as a triadic result:

| Dimension | Meaning |
|---|---|
| `compliant` | The item fully satisfies the principle |
| `non-compliant` | The item violates the principle with identifiable evidence |
| `indeterminate` | Compliance cannot be assessed (missing context, deferred dependency, ambiguous scope) |

This preserves triadic structure and avoids the binary collapse. The `antiPatterns` section should explicitly include "binary error reduction" as a detectable pattern.

**Timing:** Resolve NOW — the result type is used by every downstream compliance test.

---

### Finding F-3: Engineering Bridge Formulas as Computed Views

**Concern from Intent:** Some Engineering Bridge formula "fixes" may actually be computed views rather than stored data.

**Analysis:** The Engineering Bridge connects abstract axioms to concrete implementation. If "formula fixes" are stored as static data in the framework file, they become stale when the underlying axioms they derive from are updated. This violates:

**Test against framework:**
- **Axiom: Determinism** — Given the same axiom inputs, the bridge formula must always produce the same output. Storing the output separately creates a synchronization hazard.
- **Axiom: Observability** — Computed views are observable at any point; cached copies may be stale and unobservable.
- **Anti-pattern Row 6 (Derived Data as Source)** — Storing computed results as if they were source data.
- **Grammar Rule: Transformation Constraints** — Transformations should be functions, not snapshots.

**Classification: REFRAMED**

**Reframing:** The framework file should contain only **source-of-truth definitions** (axioms, grammar rules, anti-patterns). Any Engineering Bridge formulas that are derivable from these definitions must be implemented as **getter functions or computed properties**, not as static entries. The framework file's role is to be the single authoritative reference; derived compliance checks belong in a separate `src/compliance/bridge.ts` or similar module that imports `framework` and computes.

**Timing:** DEFERRED to Codex-native refactor. For t8, the framework file should include a `// COMPUTED — see bridge module` annotation on any placeholder entries, but should not embed derived formulas as static data.

---

### Finding F-4: Anti-Pattern Table Must Be Self-Testable

**Analysis:** If the framework file encodes anti-patterns, the file's own structure should not exhibit any of them. This is a meta-compliance requirement.

**Test against framework:**
- **Anti-pattern Row 2 (Untyped Collections)** — Each section must be strongly typed, not `any` or generic `Record<string, unknown>`.
- **Anti-pattern Row 4 (Stringly-Typed Keys)** — Axiom and rule IDs should be constrained to a union type or enum, not arbitrary strings.
- **Anti-pattern Row 7 (Missing Invariants)** — The file should export runtime validation (or at minimum, the type system should enforce cardinality at compile time).

**Classification: VALIDATED (with constraints)**

The implementation must:
1. Define a `const` assertion or enum for all axiom/rule/anti-pattern IDs
2. Use a mapped type to ensure every ID has a corresponding entry (compile-time completeness check)
3. The verification script in the acceptance criteria serves as a runtime invariant, but compile-time enforcement is preferred

**Timing:** Resolve NOW.

---

### Finding F-5: Export Shape and Module Boundary

**Analysis:** The verification command uses `import { framework }` (named export). The file must not use a default export.

**Test against framework:**
- **Axiom: Boundedness** — The module's public surface should be explicitly bounded. A single named export `framework` with a well-defined type is appropriately bounded.
- **Grammar Rule: Naming** — `framework` is a reasonable name for a singleton reference object, though `complianceFramework` would be more specific. Given the verification command is fixed, `framework` is the required name.

**Classification: VALIDATED**

**Timing:** Resolve NOW.

---

## 4. Consolidated Action Item List

| # | Item | Source | Classification | Timing | Notes |
|---|---|---|---|---|---|
| A1 | Use `Record<AxiomId, AxiomDef>` (unordered) for axioms | F-1, Intent (ordering) | **Validated** | NOW | Insulates from reorder proposals |
| A2 | Reject binary Error morpheme in compliance results | F-2, Intent (Error morpheme) | **Rejected → Reframed** | NOW | Use triadic `compliant / non-compliant / indeterminate` |
| A3 | Do not embed Engineering Bridge formulas as static data | F-3, Intent (computed views) | **Reframed** | DEFERRED | Annotate placeholders; implement as computed views in bridge module |
| A4 | Constrain IDs via union type or enum | F-4 (self-compliance) | **Validated** | NOW | Prevents anti-patterns Row 2, 4 |
| A5 | Export as named export `framework` | F-5 (verification contract) | **Validated** | NOW | Matches `import { framework }` |
| A6 | Ensure exactly 10 axiom keys at compile time | F-4, Acceptance Criteria | **Validated** | NOW | Mapped type or `satisfies` assertion |
| A7 | Ensure exactly 5 grammar rule keys | F-4, Spec ref | **Validated** | NOW | Same mechanism as A6 |
| A8 | Ensure exactly 10 anti-pattern entries | F-4, Spec ref | **Validated** | NOW | Same mechanism as A6 |
| A9 | Add `violationSignature` to each entry | §2.3 | **Validated** | DEFERRED | Useful but not required by acceptance criteria; complete during refactor |
| A10 | Add `testPredicate` function signatures | §2.3 | **Validated** | DEFERRED | Requires bridge module design first |

---

## 5. Items Requiring Resolution Before Implementation

### Must resolve NOW (blocking t8):
- **A1**: Type shape decision (Record, not Array)
- **A2**: Triadic result type definition
- **A4**: Enum/union for all IDs
- **A5**: Named export `framework`
- **A6/A7/A8**: Cardinality enforcement

### Defer to Codex-native refactor:
- **A3**: Bridge formula computation module
- **A9**: Violation signatures (content authoring)
- **A10**: Test predicate function signatures (requires bridge architecture)

---

## 6. Risk Summary

| Risk | Severity | Mitigation |
|---|---|---|
| Axiom content inaccuracy (wrong definitions) | High | Requires cross-reference with canonical spec (t4, t5, t6); implementor must not fabricate axiom text |
| Binary error creep in downstream consumers | Medium | Establish triadic result type in this file; all compliance modules import it |
| Stale derived data if bridge formulas leak in | Medium | Code review gate: no formula values in framework.ts |
| Key collision if IDs are free-form strings | Low | Enum constraint (A4) eliminates this entirely |

---

## 7. Conclusion

The framework file is a **foundational dependency** for all subsequent compliance work. Its design must embody the very principles it encodes — triadic state modeling, irreducible definitions, no implicit ordering, no derived-data-as-source. The six "resolve NOW" items define the minimum viable structure. The three "deferred" items represent capability that depends on architectural decisions not yet made (bridge module, predicate evaluation engine). The Error morpheme recommendation from the M-7B reviews is **rejected in its binary form** and reframed as a triadic compliance outcome, which is the only formulation consistent with the framework's own Axiom 2.