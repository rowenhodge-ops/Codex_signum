# Audit src/index.ts root exports

> Task ID: t16
> Model: claude-opus-4-6:adaptive:low
> Duration: 157620ms
> Output chars: 15785
> Timestamp: 2026-03-01T23:14:09.460Z

> **⚠️ Hallucination flags (4):**
> - [content/warning] References eliminated entity "AgentProps"
> - [content/warning] References eliminated entity "PatternProps"
> - [content/warning] References eliminated entity "createAgent"
> - [content/warning] References eliminated entity "GraphObserver"

---

# Audit Report: `src/index.ts` Root Exports (t16)

## Executive Summary

The root entrypoint is **structurally sound** — it references all expected modules using correct post-refactor paths, and the explicit bootstrap section is the only module in the entire codebase that provides backward-compatibility aliases at the right granularity. However, the `export *` delegation pattern means the root package surface inherits every gap identified in the sub-module barrels. The net result is a **three-tier inconsistency**: the bootstrap layer is fully compliant, the graph layer has comprehensive aliases, the types layer has zero aliases, and the patterns layer exports pre-refactor names as primary exports with no post-refactor equivalents for several key types.

---

## Structural Overview

| Export Method | Module | Alias Strategy | Status |
|---|---|---|---|
| `export *` | `./types/index.js` | Relies on sub-module barrel | ⚠️ Aliases absent upstream (t3/t4) |
| `export *` | `./graph/index.js` | Relies on sub-module barrel | ✅ Comprehensive aliases (t7) |
| `export *` | `./computation/index.js` | Relies on sub-module barrel | ⚠️ Imports pre-refactor names from graph (t15) |
| `export *` | `./memory/index.js` | Relies on sub-module barrel | ⚠️ Hybrid state upstream (t14) |
| `export *` | `./constitutional/index.js` | Not audited in pipeline | ❓ Unknown |
| `export *` | `./signals/index.js` | Not audited in pipeline | ❓ Unknown |
| `export *` | `./resilience/index.js` | Not audited in pipeline | ❓ Unknown |
| `export *` | `./metrics/index.js` | Not audited in pipeline | ❓ Unknown |
| `export *` | `./patterns/index.js` | Relies on sub-module barrel | 🔴 Hybrid state upstream (t11/t12) |
| Named exports | `./bootstrap.js` | Explicit alias listing | ✅ Complete (t13) |

---

## Finding 1 — Seed/Bloom Types Reach Root Correctly

**Severity: None (acceptance criterion met)**

Via `export * from "./types/index.js"`, the canonical post-refactor morpheme types are available at the package entrypoint:

| Type | Reachable via Root? | Source Audit |
|---|---|---|
| `Seed` | ✅ Yes | t3 confirmed export |
| `Bloom` | ✅ Yes | t3 confirmed export |
| `BloomShape` | ✅ Yes | t3 confirmed export |
| `MorphemeKind` (includes `"seed"`, `"bloom"`) | ✅ Yes | t2 confirmed definition |
| `MorphemeBase`, `IntegrationState`, `Morpheme` | ✅ Yes | t3 confirmed export |
| All six morpheme interfaces (Seed, Line, Bloom, Resonator, Grid, Helix) | ✅ Yes | t3 confirmed export |

**Verdict:** The primary acceptance criterion — "Root exports include Seed/Bloom types" — **passes**.

---

## Finding 2 — Backward-Compat Type Aliases Never Reach Root

**Severity: High (acceptance criterion failure)**

The types barrel (`types/index.ts`) exports zero backward-compatibility aliases. Since `src/index.ts` delegates via `export *`, this gap propagates directly to the package surface:

| Consumer Import | Available at Root? | Expected? |
|---|---|---|
| `import { Agent } from "codex-signum-core"` | ❌ Compile error | ✅ Should be deprecated alias for Seed |
| `import { Pattern } from "codex-signum-core"` | ❌ Compile error | ✅ Should be deprecated alias for Bloom |
| `import { PatternShape } from "codex-signum-core"` | ❌ Compile error | ✅ Should be deprecated alias for BloomShape |

**Evidence:** t3 found "backward-compatibility aliases are entirely absent" from `types/index.ts`. t4 confirmed "no `Agent` type exists anywhere in the type files" and "no `Pattern` type exists anywhere."

**Contrast with graph layer:** The graph barrel (`graph/index.ts`) correctly exports `AgentProps` as an alias for `SeedProps` and `PatternProps` as an alias for `BloomProps` (t7). This creates an asymmetry where function-level aliases exist but type-level aliases do not — a consumer can call `createAgent()` (which expects `AgentProps`), but cannot reference the `Agent` type itself.

**Impact:** Any downstream consumer or integration importing `Agent` or `Pattern` types from the package root will fail at compile time. The migration has no graceful degradation path for type-level consumers.

**Recommendation:** The fix must occur in `types/morphemes.ts` and `types/index.ts` (per t4 recommendations). Once those barrels export the aliases, they will automatically propagate through `src/index.ts` without modification to this file.

---

## Finding 3 — Bootstrap Backward-Compat Aliases: Model Implementation

**Severity: None (exemplary compliance)**

The bootstrap section is the **only explicit named-export block** in `src/index.ts`, and it correctly demonstrates the intended alias pattern:

```typescript
export {
  // Canonical exports
  CORE_BLOOMS,
  bootstrapSeeds,
  bootstrapBlooms,
  // Backward compatibility aliases (deprecated)
  bootstrapAgents,
  bootstrapPatterns,
  CORE_PATTERNS,
} from "./bootstrap.js";
```

| Post-Refactor | Backward-Compat Alias | Status |
|---|---|---|
| `bootstrapSeeds` | `bootstrapAgents` | ✅ Present |
| `bootstrapBlooms` | `bootstrapPatterns` | ✅ Present |
| `CORE_BLOOMS` | `CORE_PATTERNS` | ✅ Present |
| `ALL_ARMS` | — | ✅ N/A (bandit terminology, not a morpheme rename) |
| `seedAnalyticalPriors` | — | ✅ N/A (no rename) |
| `seedInformedPriors` | — | ✅ N/A (no rename) |

**Note:** This section should be the reference pattern for how other barrels should structure their alias exports. The comment `// Backward compatibility aliases (deprecated)` clearly delineates the boundary. What's missing are `@deprecated` JSDoc tags on each alias, which would enable IDE-level deprecation warnings.

---

## Finding 4 — Patterns Barrel Exports Pre-Refactor Names as Primary Exports

**Severity: High (hybrid state flows to root)**

Via `export * from "./patterns/index.js"`, the following pre-refactor type names are exported from the **package root as primary names** — not as backward-compat aliases, but as the only available form:

| Export | Terminology | Expected Post-Refactor Name | Status |
|---|---|---|---|
| `RoutableModel` | Pre-refactor "Model" | `RoutableSeed` | 🔴 Primary export uses old name |
| `SelectModelRequest` | Pre-refactor "Model" | `SelectSeedRequest` | 🔴 Primary export uses old name |
| `SelectModelResult` | Pre-refactor "Model" | `SelectSeedResult` | 🔴 Primary export uses old name |
| `DevAgentModelExecutor` | Pre-refactor "Model" | `DevAgentSeedExecutor` or `SeedExecutor` | 🔴 Primary export uses old name |
| `selectModel` (function) | Pre-refactor "Model" | `selectSeed` | 🔴 Primary export uses old name |
| `AgentTask` | Ambiguous (could be proper noun) | `SeedTask` (if morpheme) | ⚠️ Needs clarification |

**Source:** t11 identified all of these as missed renames in the thompson-router and dev-agent pattern modules. t12 confirmed the patterns barrel passes them through unchanged.

**Impact at root level:** Consumers importing from the package entrypoint will see `RoutableModel` alongside `Seed` and `Bloom` — morpheme-native and pre-refactor names coexisting in the same import namespace. This is the definition of hybrid state.

**Critical subtlety:** Because `src/index.ts` uses `export *`, it cannot independently fix this. The renames must happen in the pattern source files, then flow through `patterns/index.ts`, then reach `src/index.ts` automatically.

---

## Finding 5 — `FeedbackEvent` Not Exported; `ObservableEvent` Exported as Primary

**Severity: Medium (missing canonical name at root)**

The patterns barrel (t12) exports `ObservableEvent` from the feedback module but does **not** export `FeedbackEvent`:

```typescript
export type {
  FeedbackRecommendation,
  GraphFeedback,        // ✅ Post-refactor
  ObservableEvent,      // ⚠️ Old name — no FeedbackEvent canonical export
  FeedbackMode,         // ✅ Post-refactor  
  FeedbackState,        // ✅ Post-refactor
} from "./feedback/index.js";
```

Per t8, the corrected `feedback/types.ts` defines `FeedbackEvent` as the canonical type and `ObservableEvent` as a `@deprecated` alias. But the barrel chain (`feedback/index.ts` → `patterns/index.ts` → `src/index.ts`) does not surface the canonical name.

| Type | Available at Root? | Should Be? |
|---|---|---|
| `FeedbackEvent` | ❌ Not exported | ✅ Should be primary export |
| `ObservableEvent` | ✅ Exported as primary | Should be `@deprecated` alias |
| `ObserverState` | ❌ Not exported | ✅ Should be `@deprecated` alias for `FeedbackState` |
| `ObserverMode` | ❌ Not exported | ✅ Should be `@deprecated` alias for `FeedbackMode` |
| `GraphObserver` | ❌ Not exported | ✅ Should be `@deprecated` alias for `GraphFeedback` |

**Impact:** Consumers looking for the post-refactor `FeedbackEvent` type cannot find it. Consumers using the old `ObserverState`/`ObserverMode`/`GraphObserver` types will experience compile errors with no migration path.

---

## Finding 6 — `PatternHealthContext` Reaches Root Unrenamed

**Severity: Medium (hybrid state in graph types)**

t7 identified that `graph/index.ts` exports `PatternHealthContext` without renaming it to `BloomHealthContext`. Via `export * from "./graph/index.js"`, this pre-refactor type name reaches the package root.

| Export | Current Name | Expected Canonical | Expected Alias |
|---|---|---|---|
| Health context type | `PatternHealthContext` | `BloomHealthContext` | `PatternHealthContext` (deprecated) |

---

## Finding 7 — No Orphaned Exports Detected

**Severity: None (acceptance criterion met)**

All nine `export *` statements reference modules that exist in the codebase structure as confirmed by the pipeline audits. The explicit bootstrap exports reference items confirmed to exist by t13.

| Module Path | Confirmed Exists | Evidence |
|---|---|---|
| `./types/index.js` | ✅ | t2, t3 |
| `./graph/index.js` | ✅ | t5, t6, t7 |
| `./computation/index.js` | ✅ | t15 |
| `./memory/index.js` | ✅ | t14 |
| `./patterns/index.js` | ✅ | t12 |
| `./bootstrap.js` | ✅ | t13 |
| `./constitutional/index.js` | Assumed ✅ | Not audited, but no contrary evidence |
| `./signals/index.js` | Assumed ✅ | Not audited |
| `./resilience/index.js` | Assumed ✅ | Not audited |
| `./metrics/index.js` | Assumed ✅ | Not audited |

**Potential risk:** If any sub-module barrel exports a name that its own source files no longer define (due to incomplete refactoring), that would surface as a compile error — not an orphaned root export. The `export *` pattern makes this self-correcting at the root level.

---

## Finding 8 — Latent `export *` Collision Risk from Alias Proliferation

**Severity: Low (preemptive warning)**

When backward-compat aliases are added to the types barrel (as recommended by t4), there is a potential for name collisions between `export *` re-exports from different modules. Specific risk:

| Name | Potentially Exported From | Collision? |
|---|---|---|
| `AgentProps` | `graph/index.ts` (confirmed by t7) | Could collide if `types/index.ts` also exports `AgentProps` |
| `PatternProps` | `graph/index.ts` (confirmed by t7) | Same risk |

**TypeScript behavior:** With `export *`, if the same name is exported from two modules, TypeScript will not re-export it from either (silently drops it). The name becomes inaccessible without explicit disambiguation.

**Recommendation:** When adding type aliases, ensure the names don't collide with existing exports from other barrels. If `graph/index.ts` exports `AgentProps` as a type alias for `SeedProps`, the `types/index.ts` should export `Agent` (aliasing `Seed`) but NOT also define `AgentProps` — that belongs to the graph layer.

---

## Finding 9 — Four Unaudited Modules

**Severity: Low (coverage gap, not a finding against src/index.ts)**

Four modules re-exported from `src/index.ts` were not covered by any task in this audit pipeline:

| Module | Audit Status | Risk Level |
|---|---|---|
| `./constitutional/index.js` | ❓ Unaudited | Medium — may contain "Pattern"/"Agent" in constitutional rules |
| `./signals/index.js` | ❓ Unaudited | Low — likely signal/event types, less morpheme-sensitive |
| `./resilience/index.js` | ❓ Unaudited | Low — likely circuit-breaker/retry patterns |
| `./metrics/index.js` | ❓ Unaudited | Medium — may reference Pattern/Agent in metric labels |

Any pre-refactor terminology in these modules would propagate to the root via `export *`.

---

## Acceptance Criteria Summary

| Criterion | Status | Evidence |
|---|---|---|
| Root exports include Seed/Bloom types | ✅ **PASS** | `Seed`, `Bloom`, `BloomShape` all reachable via types barrel (t3) |
| Pattern exports use new module names | 🔴 **FAIL** | `RoutableModel`, `SelectModelRequest`, `SelectModelResult`, `selectModel` use pre-refactor "Model" naming (t11, t12) |
| Backward-compat aliases exported | ⚠️ **PARTIAL** | Bootstrap: ✅ complete. Graph: ✅ comprehensive. Types: ❌ absent. Patterns: ❌ absent. Feedback: ❌ incomplete |
| No orphaned exports | ✅ **PASS** | All module paths valid; no exports reference removed entities |

---

## Consolidated Recommendations

### Actions Required in `src/index.ts` Itself

**None.** The file's structure is correct. All issues are inherited from upstream barrels via `export *`. Fixing the sub-module barrels will automatically fix the root surface.

The one consideration for a future structural change: if the team wants the root entrypoint to provide an explicit, curated export surface (rather than delegating entirely via `export *`), they could convert to named re-exports similar to the bootstrap section. This would provide explicit control over what reaches consumers and prevent unintended pre-refactor names from leaking through. However, this is a design decision, not a refactor bug.

### Actions Required in Upstream Modules (Ordered by Impact)

| Priority | Module | Action | Blocking Criterion |
|---|---|---|---|
| **P0** | `types/morphemes.ts` + `types/index.ts` | Add `Agent`, `Pattern`, `PatternShape` as `@deprecated` type aliases | Backward-compat aliases |
| **P0** | `patterns/thompson-router/types.ts` | Rename `RoutableModel` → `RoutableSeed`, `SelectModelRequest` → `SelectSeedRequest`, `SelectModelResult` → `SelectSeedResult`; add old names as deprecated aliases | Pattern exports use new names |
| **P1** | `patterns/dev-agent/types.ts` | Rename `DevAgentModelExecutor` → `DevAgentSeedExecutor`; add old name as alias | Pattern exports use new names |
| **P1** | `patterns/feedback/index.ts` + `patterns/index.ts` | Export `FeedbackEvent` as primary; re-export `ObservableEvent`, `ObserverState`, `ObserverMode`, `GraphObserver` as deprecated aliases | Backward-compat aliases |
| **P1** | `graph/write-observation.ts` + `graph/index.ts` | Rename `PatternHealthContext` → `BloomHealthContext`; add old name as alias | Backward-compat aliases |
| **P2** | `constitutional/`, `signals/`, `resilience/`, `metrics/` | Audit for pre-refactor terminology leaking to root | Coverage gap |
| **P2** | Bootstrap explicit exports | Add `@deprecated` JSDoc tags to alias lines | Documentation completeness |

---

## Architectural Observation

The `export *` delegation pattern in `src/index.ts` is a double-edged design: it ensures zero-maintenance when sub-modules add new exports, but it also means the root package surface is **the union of all sub-module decisions** — including their mistakes. The M-7C refactor exposed this clearly: the bootstrap section (with explicit named exports) is the only part of the root that achieved complete alias coverage, precisely because it was curated by hand. Every `export *` section inherits whatever hybrid state exists in its source barrel.

This is not a recommendation to change the architecture — `export *` is the practical choice for a core library with many types. But it does mean that **the root entrypoint audit is, by construction, a summary of all sub-module audits**, and fixing the root means fixing every barrel in the chain.