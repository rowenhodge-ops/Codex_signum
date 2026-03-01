# Audit dev-agent and thompson-router patterns

> Task ID: t11
> Model: claude-opus-4-6:adaptive:low
> Duration: 102342ms
> Output chars: 8670
> Timestamp: 2026-03-01T22:51:51.407Z

---

# Audit Report: dev-agent & thompson-router Morpheme Terminology (t11)

## Executive Summary

The M-7C refactor has been **partially applied** to these patterns. The graph layer (`ArmStats.seedId`) and the higher-level `SelectModelResult.selectedSeedId` use post-refactor "Seed" naming, but the core router types and dev-agent types still carry pre-refactor "Model" and "Agent" morpheme terminology. This creates a **hybrid state** where old and new names coexist within the same call paths.

---

## Finding 1 — Hybrid State: `selectedModelId` vs `selectedSeedId`

**Severity: High (hybrid coexistence)**

The same semantic concept — "which model/seed was chosen" — is expressed with contradictory naming across two types in the same module:

| Type | Field | Terminology |
|------|-------|-------------|
| `RoutingDecision` (types.ts:30) | `selectedModelId` | Pre-refactor ("Model") |
| `SelectModelResult` (types.ts:73) | `selectedSeedId` | Post-refactor ("Seed") |

`RoutingDecision` is the core return type of `route()`. `SelectModelResult` is the higher-level API. Both are exported from `thompson-router/index.ts`. Any consumer that touches both types encounters the split directly.

**Evidence:**
```
// thompson-router/types.ts — RoutingDecision
selectedModelId: string;        // ← old

// thompson-router/types.ts — SelectModelResult
selectedSeedId: string;         // ← new
baseModelId: string;            // ← old (within same type!)
```

`SelectModelResult` is itself a hybrid: `selectedSeedId` (new) sits alongside `baseModelId` (old).

**Recommendation:** Align both to `selectedSeedId`. Add backward-compat alias `selectedModelId` with `@deprecated` JSDoc if external consumers exist.

---

## Finding 2 — Missed Renames: `RoutableModel` Interface

**Severity: High (missed rename, widely referenced)**

`RoutableModel` is the primary type representing an AI model entity available for routing. Per Agent→Seed rename, this should be `RoutableSeed`. The type is:
- Defined in `thompson-router/types.ts`
- Re-exported from `dev-agent/types.ts` (`export type { ArmStats, RoutableModel }`)
- Used as constructor parameter in `DevAgent`
- Referenced throughout `router.ts`

The graph layer already uses `seedId` in `ArmStats`, confirming the Seed morpheme is canonical at the data layer. The type layer has not caught up.

**Recommendation:** Rename to `RoutableSeed`. Add `export type RoutableModel = RoutableSeed` backward-compat alias in a `compat.ts` or at export boundary.

---

## Finding 3 — Missed Renames: `SelectModelRequest` / `SelectModelResult`

**Severity: Medium**

Both types use "Model" in their names:
- `SelectModelRequest` → should be `SelectSeedRequest`
- `SelectModelResult` → should be `SelectSeedResult`

These are the public API surface for callers invoking model selection. The names contradict the `selectedSeedId` field already present inside `SelectModelResult`.

---

## Finding 4 — Missed Rename: `callerPatternId` field

**Severity: Medium (Pattern→Bloom rename missed)**

```typescript
// thompson-router/types.ts — SelectModelRequest
callerPatternId?: string;
```

Per Pattern→Bloom rename, this should be `callerBloomId`. This is the only Pattern→Bloom instance found in these two pattern directories.

---

## Finding 5 — `StageResult.modelId` and `DevAgentModelExecutor`

**Severity: Medium (dev-agent internal types)**

| Location | Current | Expected |
|----------|---------|----------|
| `StageResult.modelId` (dev-agent/types.ts) | `modelId` | `seedId` |
| `DevAgentModelExecutor` type alias (dev-agent/types.ts) | `modelId` param name | `seedId` |
| `pipeline.ts` references | `routingDecision.selectedModelId` | `routingDecision.selectedSeedId` |

The dev-agent pipeline reads `selectedModelId` from `RoutingDecision` and passes `modelId` into `StageResult`. The entire chain uses pre-refactor naming.

---

## Finding 6 — `AgentTask` Interface Naming

**Severity: Low-Medium (needs spec clarification)**

`AgentTask` uses "Agent" which maps to the old morpheme name. Two interpretations:

1. **"Agent" here refers to the Codex morpheme** (now Seed) → should be `SeedTask`
2. **"DevAgent" is a proper noun** — the name of this Bloom pattern that happens to be an agent → `AgentTask` is fine as a pattern-internal name

The acceptance criteria state "Dev-agent uses morpheme-native types." If this means the types *consumed* by DevAgent should use Seed/Bloom naming (e.g., `RoutableSeed`, `selectedSeedId`), then the class name `DevAgent` and `AgentTask` can remain as pattern proper nouns. If it means *all* types defined by the pattern, then `AgentTask` is a missed rename.

**Recommendation:** Clarify in the entity mapping whether "DevAgent" is a frozen proper noun. At minimum, the types it *references* from the router layer (`RoutableModel`, `selectedModelId`) must use native naming.

---

## Finding 7 — `createObservation` (observer→feedback rename)

**Severity: Medium (potential cross-module inconsistency)**

```typescript
// pipeline.ts
createObservation(`devagent:${stage}`, "execution_outcome", { ... });
```

Per the observer→feedback rename, this function may need to be `createFeedback` or `createFeedbackSignal`. This depends on whether the memory module completed its own rename. If `createObservation` still exists in `../../memory/index.js`, this is either:
- A backward-compat alias that should be migrated, or
- Evidence the memory module also has an incomplete rename

**Recommendation:** Cross-reference with `src/memory/` audit. If the canonical export is now `createFeedback`, update the import.

---

## Finding 8 — String Literals with Pre-Refactor Terminology

**Severity: Low (runtime identifiers, not type-level)**

```typescript
// pipeline.ts
this.memory.add("devagent:pipeline", { ... });
this.memory.add(`devagent:${stage}`, { ... });
createObservation(`devagent:${stage}`, "execution_outcome", { ... });
```

These are runtime namespace strings. If "devagent" is the pattern's proper noun, these are acceptable. If the memory/graph layer expects Bloom-native identifiers, they may need updating.

---

## Finding 9 — Pattern Export Consistency

**Severity: Low**

`dev-agent/types.ts` re-exports:
```typescript
export type { ArmStats, RoutableModel };
```

If `RoutableModel` is renamed to `RoutableSeed`, this re-export must be updated. The re-export boundary is where backward-compat aliases should be placed for downstream consumers.

---

## Summary Table

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| 1 | `selectedModelId` vs `selectedSeedId` in same module | **High** | Hybrid state |
| 2 | `RoutableModel` → `RoutableSeed` | **High** | Missed rename |
| 3 | `SelectModelRequest/Result` → `SelectSeedRequest/Result` | Medium | Missed rename |
| 4 | `callerPatternId` → `callerBloomId` | Medium | Missed rename (Pattern→Bloom) |
| 5 | `StageResult.modelId`, `DevAgentModelExecutor` param | Medium | Missed rename |
| 6 | `AgentTask` naming ambiguity | Low-Med | Needs spec ruling |
| 7 | `createObservation` → `createFeedback`? | Medium | Cross-module check needed |
| 8 | Runtime string literals ("devagent:") | Low | Cosmetic |
| 9 | Re-export of `RoutableModel` | Low | Follows from #2 |

---

## Verification Command Assessment

The provided verification command:
```bash
grep -E '(Agent|Pattern)' src/patterns/dev-agent/*.ts src/patterns/thompson-router/*.ts || echo 'Clean'
```

This will **not** return `Clean`. It will match:
- `AgentTask`, `DevAgent`, `DevAgentConfig`, `DevAgentModelExecutor` (many hits in dev-agent/)
- `callerPatternId` (in thompson-router/types.ts)

The command also misses `Model` occurrences (e.g., `RoutableModel`, `selectedModelId`, `SelectModelRequest`), which are equally important. A more complete check:

```bash
grep -En '(Agent|Pattern|[^a-z]Model[^s])' \
  src/patterns/dev-agent/*.ts \
  src/patterns/thompson-router/*.ts \
  | grep -v '// Copyright' | grep -v '^[[:space:]]*//'
```

---

## Backward-Compatibility Alias Checklist

| Old Name | New Name | Alias Exists? |
|----------|----------|---------------|
| `RoutableModel` | `RoutableSeed` | ❌ Not yet renamed |
| `selectedModelId` | `selectedSeedId` | ❌ Both exist in parallel, no alias |
| `SelectModelRequest` | `SelectSeedRequest` | ❌ Not yet renamed |
| `SelectModelResult` | `SelectSeedResult` | ❌ Not yet renamed |
| `callerPatternId` | `callerBloomId` | ❌ Not yet renamed |
| `StageResult.modelId` | `StageResult.seedId` | ❌ Not yet renamed |

No backward-compat aliases are in place for any of these. Once renames are applied, aliases should be added at the public export boundary (`index.ts` files) with `@deprecated` annotations.