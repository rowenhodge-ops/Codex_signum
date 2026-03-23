# Route :Decision creation in decision.ts through instantiateMorpheme

> Task ID: t3
> Model: claude-opus-4-6:adaptive:medium
> Duration: 101288ms
> Output chars: 18261
> Timestamp: 2026-03-23T23:37:14.402Z

> **⚠️ Hallucination flags (7):**
> - [content/warning] Task t3 references "scripts/bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task t3 references "bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task t3 references "graph-operations.ts" but this file was not in its context
> - [content/warning] Task t3 references "write-observation.ts" but this file was not in its context
> - [content/warning] Task t3 references "instantiation.ts" but this file was not in its context
> - [content/warning] Task t3 references "decision.ts" but this file was not in its context
> - [content/warning] Task t3 references "../../memory/graph-operations.js" but this file was not in its context

---

# Analysis: Routing :Decision Creation Through instantiateMorpheme

## 1. Current State Assessment

### 1.1 CREATE Statement Inventory

A thorough review of `src/graph/queries/decision.ts` reveals a single function containing raw node creation:

| Function | Statement | Target Label | Context |
|----------|-----------|--------------|---------|
| `recordDecision` | `CREATE (d:Decision {...})` | `:Decision` | Inside `writeTransaction`, followed by chained relationship creation |

All other functions are non-creative:

| Function | Operation Type | Modification Needed |
|----------|---------------|---------------------|
| `recordDecisionOutcome` | UPDATE (`SET`) on existing `:Decision` | No — operates on existing nodes |
| `getDecisionsForCluster` | READ | No |
| `updateDecisionQuality` | UPDATE (`SET`) | No |
| `findDecisionForTask` | READ | No |
| `linkDecisionToPipelineRun` | MERGE relationship only | No |
| `getDecisionsForRun` | READ | No |
| `ensureContextCluster` | MERGE on `:ContextCluster` (not `:Decision`) | No |

**Finding:** Only `recordDecision` requires modification. This is a cleaner surface area than it initially appears — the file is large but only one function creates Decision nodes.

### 1.2 Current Creation Pattern Analysis

The existing `recordDecision` function performs four operations in a single `writeTransaction`:

```cypher
CREATE (d:Decision { id, selectedSeedId, taskType, complexity, domain,
                     wasExploratory, qualityRequirement, costCeiling,
                     runId, taskId, timestamp: datetime(), status: 'pending' })
WITH d
MATCH (s:Seed { id: $selectedSeedId })
MERGE (d)-[:ROUTED_TO]->(s)
WITH d
OPTIONAL MATCH (b:Bloom { id: $madeByBloomId })
FOREACH (_ IN CASE WHEN b IS NOT NULL THEN [1] ELSE [] END |
  MERGE (d)-[:ORIGINATED_FROM]->(b)
)
WITH d
OPTIONAL MATCH (cc:ContextCluster { id: $contextClusterId })
FOREACH (_ IN CASE WHEN cc IS NOT NULL THEN [1] ELSE [] END |
  MERGE (d)-[:IN_CONTEXT]->(cc)
)
```

**Operations bundled:**
1. Node creation with 12 properties (10 from params + `timestamp` + `status`)
2. `ROUTED_TO` relationship to the selected Seed (model)
3. Conditional `ORIGINATED_FROM` relationship to Bloom (if `madeByBloomId` provided)
4. Conditional `IN_CONTEXT` relationship to ContextCluster (if `contextClusterId` provided)

**Evidence:** The `WITH d` chaining and `OPTIONAL MATCH` + `FOREACH` pattern handles optional relationships gracefully. This pattern is more complex than the Observation case (t2), which had only one mandatory domain relationship.

---

## 2. Property Schema Analysis

### 2.1 Current vs Required Properties

| Current `DecisionProps` | Required by `instantiateMorpheme('seed')` | Status |
|-------------------------|-------------------------------------------|--------|
| `id: string` | `id` | ✅ Present |
| `taskType: string` | — | Extra (decision-specific) |
| `complexity: string` | — | Extra (decision-specific) |
| `domain?: string` | — | Extra (decision-specific) |
| `selectedSeedId: string` | — | Relationship target, not node property (but also stored as property) |
| `madeByBloomId?: string` | — | Relationship target only |
| `wasExploratory: boolean` | — | Extra (decision-specific) |
| `contextClusterId?: string` | — | Relationship target only |
| `qualityRequirement?: number` | — | Extra (decision-specific) |
| `costCeiling?: number` | — | Extra (decision-specific) |
| `runId?: string` | — | Extra (decision-specific) |
| `taskId?: string` | — | Extra (decision-specific) |
| — | `name` | ❌ Missing |
| — | `content` | ❌ Missing |
| — | `seedType` | ❌ Missing |
| — | `status` | ⚠️ Semantic conflict (see §2.3) |

**Finding:** Four required seed properties are absent or conflicted. Additionally, two inline-set properties exist in Cypher:
- `timestamp: datetime()` — set in Cypher, not in interface
- `status: 'pending'` — set in Cypher, **conflicts with seed `status` requirement**

### 2.2 Property Derivation Strategy

| Required Property | Derivation | Rationale |
|-------------------|------------|-----------|
| `name` | `decision-${id}` or `${taskType}-${complexity}-decision` | Provides human-readable identification; decisions lack a natural "name" field |
| `content` | JSON stringify of `{taskType, complexity, domain, selectedSeedId, wasExploratory}` | Captures the decision payload for content-based seed operations |
| `seedType` | `'decision'` (literal) | Matches the v5.0 grammar classification |
| `status` | `'active'` (literal) — see §2.3 | Required by instantiation protocol |

### 2.3 Status Field Semantic Conflict

**Critical finding:** The current code sets `status: 'pending'` on creation, and `recordDecisionOutcome` later updates it to `status: 'completed'`. The instantiation protocol requires a `status` property in the seed required-properties check.

**Conflict:** The decision lifecycle status (`'pending'` → `'completed'`) and the seed protocol status (`'active'`) serve different semantic purposes:
- **Seed status:** Indicates whether the morpheme instance is active, archived, etc. in the graph lifecycle.
- **Decision status:** Indicates whether the routing decision has been resolved with an outcome.

**Options:**

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| A | Use `status: 'active'` for seed protocol; add separate `decisionStatus: 'pending'` | Clean separation of concerns | Breaking change for `recordDecisionOutcome` and all queries that match on `d.status` |
| B | Pass `status: 'pending'` to protocol; let it satisfy required check | No downstream changes | Semantically overloaded — seed protocol may interpret 'pending' differently |
| C | Pass `status: 'active'` to protocol; immediately override with `d.status = 'pending'` post-creation | Protocol satisfied cleanly | Extra write; temporal inconsistency within transaction |

**Recommendation:** Option B is the pragmatic choice. The instantiation protocol's required-properties check only verifies **presence**, not specific values (evidence: the check is `["id", "name", "content", "seedType", "status"]` — a list check, not a value check). The existing `'pending'` value satisfies presence. Downstream queries on `d.status = 'completed'` and `d.status = 'pending'` continue to work unchanged. The value progresses naturally through the decision lifecycle.

**Risk:** If a future protocol version enforces allowed status values, this would need revisiting. Acceptable risk for now.

### 2.4 Relationship Target Properties on the Node

**Important nuance:** `selectedSeedId` is stored **both** as a node property and used as a relationship target:

```cypher
CREATE (d:Decision { ..., selectedSeedId: $selectedSeedId, ... })
...
MATCH (s:Seed { id: $selectedSeedId })
MERGE (d)-[:ROUTED_TO]->(s)
```

This denormalization is intentional — `findDecisionForTask` queries `d.selectedSeedId` directly without traversing the `ROUTED_TO` edge. It must be preserved as a node property.

In contrast, `madeByBloomId` and `contextClusterId` are **not** stored as node properties in the current Cypher — they are only used for relationship creation. However, `madeByBloomId` **is** referenced in `findDecisionForTask`:

```cypher
AND ($bloomId IS NULL OR d.madeByBloomId IS NULL OR d.madeByBloomId = $bloomId)
```

**Wait — contradiction detected.** The current `CREATE` statement does **not** include `madeByBloomId` or `contextClusterId` as node properties, yet `findDecisionForTask` references `d.madeByBloomId`. This means either:
1. The property is set by the `ORIGINATED_FROM` relationship somehow (it's not — Neo4j relationships don't propagate properties)
2. There's a pre-existing bug where `findDecisionForTask` always falls through the `d.madeByBloomId IS NULL` branch
3. `madeByBloomId` is set elsewhere outside this file

**Finding:** This appears to be a pre-existing data integrity issue. The `findDecisionForTask` query's null-coalescing logic (`$bloomId IS NULL OR d.madeByBloomId IS NULL`) means it degrades gracefully — but `madeByBloomId` is never actually on the node per the current `CREATE` statement.

**Recommendation:** When constructing the properties object for `instantiateMorpheme`, consider including `madeByBloomId` as a node property to fix this latent issue. This is technically a scope expansion; flag it for the implementer to decide.

---

## 3. Relationship Architecture

### 3.1 Post-Migration Relationship Inventory

After routing through `instantiateMorpheme`, each Decision node requires:

| Relationship | Type | Source | Target | Origin | Conditionality |
|---|---|---|---|---|---|
| `CONTAINS` | Protocol | Grid | Decision | `instantiateMorpheme` | Always |
| `INSTANTIATES` | Protocol | Decision | `def:morpheme:seed` | `instantiateMorpheme` | Always |
| `ROUTED_TO` | Domain | Decision | Seed (model) | Post-protocol logic | Always (selectedSeedId is required) |
| `ORIGINATED_FROM` | Domain | Decision | Bloom | Post-protocol logic | Conditional (madeByBloomId) |
| `IN_CONTEXT` | Domain | Decision | ContextCluster | Post-protocol logic | Conditional (contextClusterId) |

**Observation vs Decision complexity:** The Observation migration (t2) had one mandatory domain relationship (`OBSERVED_IN`) plus one counter update. Decision has **three** domain relationships (one mandatory, two conditional). This is the most complex migration of the four node types.

### 3.2 Grid Parent Determination

Decisions need a Grid parent for the protocol's `CONTAINS` edge.

| Option | Grid ID | Evidence | Recommendation |
|--------|---------|----------|----------------|
| `grid:decisions` | Dedicated grid for routing decisions | Mirrors t2's `grid:observations` pattern | ✅ Recommended |
| `grid:operations` | Shared operational grid | Keeps operational nodes together | Possible but reduces query specificity |
| Caller-supplied `gridId` | Maximum flexibility | Breaking signature change | ❌ Unnecessary complexity |

**Recommendation:** Use `grid:decisions`. Ensure this Grid node exists in bootstrap (same pattern as `grid:observations` from t2 and `grid:instantiation-observations` from existing code). The bootstrap script (`scripts/bootstrap-task-executor.ts`) should be updated.

### 3.3 Domain Relationship Post-Protocol Creation

Since `instantiateMorpheme` manages its own `writeTransaction`, domain relationships must be created in a **separate subsequent transaction**. This matches the t2 analysis exactly.

**Sequence:**

1. Call `instantiateMorpheme('seed', properties, 'grid:decisions', undefined, { subType: 'Decision' })`
2. On success, open new `writeTransaction` for domain relationships:
   - `MATCH (d:Decision {id: $id}), (s:Seed {id: $selectedSeedId}) MERGE (d)-[:ROUTED_TO]->(s)`
   - Conditional `ORIGINATED_FROM` to Bloom
   - Conditional `IN_CONTEXT` to ContextCluster

**Alternative — Single combined Cypher post-protocol:**

All three domain relationships can be handled in one `writeTransaction` with the same `OPTIONAL MATCH` + `FOREACH` pattern currently used:

```cypher
MATCH (d:Decision { id: $id })
MATCH (s:Seed { id: $selectedSeedId })
MERGE (d)-[:ROUTED_TO]->(s)
WITH d
OPTIONAL MATCH (b:Bloom { id: $madeByBloomId })
FOREACH (_ IN CASE WHEN b IS NOT NULL THEN [1] ELSE [] END |
  MERGE (d)-[:ORIGINATED_FROM]->(b)
)
WITH d
OPTIONAL MATCH (cc:ContextCluster { id: $contextClusterId })
FOREACH (_ IN CASE WHEN cc IS NOT NULL THEN [1] ELSE [] END |
  MERGE (d)-[:IN_CONTEXT]->(cc)
)
```

**Recommendation:** Use the single combined post-protocol transaction. This preserves the existing relationship creation pattern almost verbatim, minimizing diff and behavioral risk.

---

## 4. Transaction Semantics

### 4.1 Atomicity Analysis

| Phase | Transaction | Operations | Failure Impact |
|-------|-------------|------------|----------------|
| 1 | `instantiateMorpheme` internal | Node creation, `:Decision` label, `CONTAINS`, `INSTANTIATES`, observation recording | Clean rollback; no orphan artifacts |
| 2 | Post-protocol `writeTransaction` | `ROUTED_TO`, `ORIGINATED_FROM`, `IN_CONTEXT` | Decision node exists without domain relationships |

**Risk:** If Phase 2 fails after Phase 1 succeeds, a Decision node exists in the graph with protocol relationships but without domain relationships. This is the same risk profile identified in t2 for Observations.

**Mitigation options (from t2 analysis):**
1. **Accept the risk** — downstream queries that `MATCH (d:Decision)-[:ROUTED_TO]->(s)` will not find the orphan, so it's effectively invisible to business logic.
2. **Wrap in try/catch with cleanup** — on Phase 2 failure, delete the node created in Phase 1.
3. **Compensating transaction pattern** — mark node as `status: 'failed-init'` on Phase 2 failure.

**Recommendation:** Accept the risk with logging. The same decision was made for Observations in t2. A Decision without `ROUTED_TO` is functionally inert — `getDecisionsForCluster`, `getDecisionsForRun`, and `findDecisionForTask` all require the node to have relationships or properties that would prevent it from polluting results.

### 4.2 No Counter Updates Required

Unlike the Observation case (which required `b.observationCount` increment), Decision creation has **no counter updates** on related nodes. This simplifies the post-protocol transaction.

---

## 5. Downstream Query Compatibility

### 5.1 Label-Based Query Audit

All queries in decision.ts use `MATCH (d:Decision ...)`. After migration, nodes carry both `:Seed` and `:Decision` labels. Neo4j label matching is additive — `MATCH (d:Decision)` will match nodes with labels `[:Seed, :Decision]`.

| Query | Pattern | Compatible? |
|-------|---------|-------------|
| `recordDecisionOutcome` | `MATCH (d:Decision { id: $decisionId })` | ✅ |
| `getDecisionsForCluster` | `MATCH (d:Decision)-[:IN_CONTEXT]->...` | ✅ |
| `updateDecisionQuality` | `MATCH (d:Decision { id: $decisionId })` | ✅ |
| `findDecisionForTask` | `MATCH (d:Decision) WHERE ...` | ✅ |
| `linkDecisionToPipelineRun` | `MATCH (d:Decision { id: $decisionId })` | ✅ |
| `getDecisionsForRun` | `MATCH (d:Decision)-[:DECIDED_DURING]->...` | ✅ |

**Finding:** All downstream queries are fully compatible. No changes needed outside `recordDecision`.

### 5.2 Cross-File Impact Assessment

Other files that may reference `:Decision`:

| File | Likely Usage | Impact |
|------|-------------|--------|
| `bootstrap-task-executor.ts` | Grid bootstrap; may need `grid:decisions` creation | Modification needed |
| `graph-operations.ts` | General graph ops; may query Decisions | Audit needed but likely compatible |
| `write-observation.ts` | Observation writing; unlikely to touch Decisions | No impact expected |
| Thompson Sampling router (caller) | Calls `recordDecision` | No change — same interface |

---

## 6. Interface Preservation

### 6.1 `DecisionProps` Interface

The external interface `DecisionProps` should **not change**. Callers pass the same properties they do today. The seed-required properties (`name`, `content`, `seedType`, `status`) should be **derived internally** within `recordDecision`, not imposed on callers.

**Evidence:** The acceptance criteria state "All existing properties are preserved on the node" and "TypeScript compiles without errors." Changing `DecisionProps` would break callers.

### 6.2 Properties Object Construction

Inside `recordDecision`, the properties object for `instantiateMorpheme` should be constructed as:

```typescript
{
  id: props.id,
  name: `decision-${props.id}`,
  content: JSON.stringify({
    taskType: props.taskType,
    complexity: props.complexity,
    domain: props.domain,
    selectedSeedId: props.selectedSeedId,
    wasExploratory: props.wasExploratory
  }),
  seedType: 'decision',
  status: 'pending',
  // Passthrough decision-specific properties:
  selectedSeedId: props.selectedSeedId,
  taskType: props.taskType,
  complexity: props.complexity,
  domain: props.domain ?? null,
  wasExploratory: props.wasExploratory,
  qualityRequirement: props.qualityRequirement ?? null,
  costCeiling: props.costCeiling ?? null,
  runId: props.runId ?? null,
  taskId: props.taskId ?? null,
  retained: true
}
```

**Note:** `timestamp` is currently set via `datetime()` in Cypher. If `instantiateMorpheme` sets a `createdAt` or `timestamp` field, this may be handled automatically. If not, `timestamp` must be set either as a property or in a post-protocol `SET`.

---

## 7. Recursion Boundary Verification

**Explicit check:** The `recordDecision` function is **not** one of the three governance observation functions identified in t1 (`recordInstantiationObservation`, `recordMutationObservation`, `recordLineObservation`). Those functions live in `instantiation.ts` and must not be touched.

`recordDecision` is a domain-level function in `decision.ts`. Routing it through `instantiateMorpheme` does not create a recursion risk:

```
recordDecision → instantiateMorpheme → recordInstantiationObservation (raw Cypher — recursion boundary)
```

The chain terminates at the observation recording step, which uses raw Cypher by design. **No recursion concern.**

---

## 8. Summary of Recommendations

| # | Recommendation | Rationale |
|---|----------------|-----------|
| 1 | Modify only `recordDecision` | Only function with raw `CREATE (d:Decision ...)` |
| 2 | Call `instantiateMorpheme('seed', props, 'grid:decisions', undefined, { subType: 'Decision' })` | Per t1 design: options bag fifth parameter |
| 3 | Derive `name`, `content`, `seedType` internally | Preserve `DecisionProps` interface unchanged |
| 4 | Pass `status: 'pending'` as the seed status | Satisfies protocol presence check; preserves decision lifecycle semantics |
| 5 | Create domain relationships in a single post-protocol `writeTransaction` | Preserves existing OPTIONAL MATCH + FOREACH pattern |
| 6 | Ensure `grid:decisions` Grid exists in bootstrap | Required for protocol CONTAINS edge |
| 7 | Include `madeByBloomId` as node property | Fixes latent issue where `findDecisionForTask` references `d.madeByBloomId` but it was never on the node |
| 8 | No changes to any other function in the file | All downstream queries compatible with dual-label nodes |
| 9 | Import `instantiateMorpheme` from `../../memory/graph-operations.js` | Matches import pattern established in t2 |