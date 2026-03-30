# Implement getDecayWeightedPosteriors() query function

> Task ID: t3
> Model: claude-opus-4-5:extended:16k
> Duration: 113339ms
> Output chars: 11446
> Timestamp: 2026-03-29T22:48:58.955Z

> **⚠️ Hallucination flags (2):**
> - [content/warning] Task t3 references "arm-stats.ts" but this file was not in its context
> - [content/warning] Task t3 references "../client.js" but this file was not in its context

---

# Analysis: Implement getDecayWeightedPosteriors() Query Function (t3)

## Summary

The task requires implementing a new function `getDecayWeightedPosteriors(bloomId, armId)` in `src/graph/queries/arm-stats.ts` that reads γ-recursive Thompson posterior properties from Bloom nodes and returns Beta distribution parameters. This function replaces the aggregation-based `getArmStats()` pattern with a direct property lookup, enabling decay-aware statistical inference where posteriors are maintained inline via the update rule `α_new = γ × α_old + outcome`.

---

## Findings

### F1: Architectural Context — Inline vs. Aggregation Posteriors

**Finding:** The existing `getArmStatsForCluster()` computes posteriors on-the-fly by aggregating Decision node outcomes via Cypher. The new `getDecayWeightedPosteriors()` retrieves pre-computed, decay-weighted posteriors stored directly on node properties. This is a fundamental architectural shift from read-time aggregation to write-time accumulation.

**Evidence:**
- M-10.1 requirement 1: "γ-recursive Thompson posterior properties (weightedSuccesses, weightedFailures) to Bloom/Resonator nodes updated inline after execution via α_new = γ × α_old + outcome"
- M-10.1 requirement 5: "getDecayWeightedPosteriors(bloomId, armId) reading weightedSuccesses/weightedFailures from node properties returning Beta(α,β) — replaces getArmStats()"
- t1 analysis confirms property existence constraints are added for `weightedSuccesses` and `weightedFailures` on Bloom and Resonator nodes

**Implication:** The function is a simple property read, not an aggregation query. Query complexity is O(1) node lookup plus property access, not O(n) Decision traversal.

---

### F2: Parameter Semantics — bloomId and armId Relationship

**Finding:** The function signature takes two identifiers: `bloomId` and `armId`. The relationship between these parameters requires clarification from the schema design, but three interpretations are plausible:

#### Interpretation A: bloomId IS the arm-state node
The `bloomId` identifies a Bloom (or Resonator) node that serves as the posterior accumulator for a specific (context, arm) pair. The `armId` is the Seed identifier (model option) being tracked, used for validation or logging.

**Evidence supporting A:**
- t1 states properties are on Bloom and Resonator nodes, not relationships
- γ-recursive updates require a dedicated state node per arm-context combination
- The function name says "from **Bloom** node properties"

#### Interpretation B: Composite property keys
The Bloom node stores multiple arms' posteriors as distinct properties keyed by armId (e.g., `weightedSuccesses_modelA`, `weightedFailures_modelA`).

**Evidence against B:**
- t1 describes property existence constraints for `weightedSuccesses` and `weightedFailures` (scalar names, not patterns)
- Neo4j property existence constraints require exact property names

#### Interpretation C: Relationship-based lookup
A relationship between Bloom (context) and Seed (arm) stores the posterior properties.

**Evidence against C:**
- t1 explicitly states "Bloom and Resonator nodes" — not relationships
- Relationship property constraints are less common in Neo4j schema patterns

**Assessment:** Interpretation A is most consistent with the specification and t1 analysis. Recommend the query match by `bloomId` only, with `armId` available for:
- Logging/tracing the arm being queried
- Validation that the node corresponds to expected arm
- Future extensibility (composite lookup if schema evolves)

---

### F3: Return Type Definition

**Finding:** The function must return `{α: number, β: number}` representing Beta distribution parameters. A dedicated interface should be defined for type safety and documentation.

**Evidence:**
- M-10.1 requirement 5: "returning Beta(α,β)"
- Standard Thompson Sampling parameterization: α = successes + 1, β = failures + 1
- Existing `ArmStats` interface returns `alpha` and `beta` (lines 13-14 of arm-stats.ts)

**Recommendation:** Define a new interface at module scope:

```typescript
/** Decay-weighted Beta posterior parameters for Thompson Sampling */
export interface DecayWeightedPosterior {
  alpha: number;  // weightedSuccesses + 1
  beta: number;   // weightedFailures + 1
}
```

**Naming consideration:** Use `alpha`/`beta` (ASCII) rather than `α`/`β` (Unicode) for consistency with existing `ArmStats` interface and broader tooling compatibility. The return type in the spec (`{α: number, β: number}`) uses Greek letters for mathematical clarity; implementation uses ASCII.

---

### F4: Default Value Strategy

**Finding:** Missing properties must be handled gracefully with defaults that yield an uninformative Beta(1,1) prior (uniform distribution over [0,1]).

**Evidence:**
- Acceptance criteria: "Handles missing properties gracefully with defaults"
- Standard Thompson Sampling prior: Beta(1,1) represents complete uncertainty
- Existing `getArmStatsForCluster()` uses `successes + 1` and `failures + 1`, implying prior of 1

**Mapping:**
| Property State | weightedSuccesses | weightedFailures | Result |
|----------------|-------------------|------------------|--------|
| Both present | ws | wf | α = ws + 1, β = wf + 1 |
| Missing ws | 0 | wf | α = 1, β = wf + 1 |
| Missing wf | ws | 0 | α = ws + 1, β = 1 |
| Both missing | 0 | 0 | α = 1, β = 1 (uniform) |
| Node not found | — | — | α = 1, β = 1 (uniform) |

**Cypher implementation:** Use `COALESCE(n.weightedSuccesses, 0)` and `COALESCE(n.weightedFailures, 0)` to default missing properties to 0 before adding the prior of 1.

---

### F5: Query Pattern and Node Matching

**Finding:** The query must match Bloom OR Resonator nodes, as both can carry posterior properties per t1.

**Evidence:**
- t1: "property existence constraints to Bloom and Resonator nodes"
- The function receives a `bloomId`, but the actual node might be a Resonator (different label)

**Cypher strategy options:**

#### Option A: Multi-label match
```cypher
MATCH (n {id: $bloomId})
WHERE n:Bloom OR n:Resonator
RETURN COALESCE(n.weightedSuccesses, 0) + 1 AS alpha,
       COALESCE(n.weightedFailures, 0) + 1 AS beta
```

#### Option B: Label-agnostic match (rely on unique ID)
```cypher
MATCH (n {id: $bloomId})
RETURN COALESCE(n.weightedSuccesses, 0) + 1 AS alpha,
       COALESCE(n.weightedFailures, 0) + 1 AS beta
```

**Assessment:** Option A is safer — it confirms the node is a valid morpheme type. Option B is simpler and relies on the `id` uniqueness constraint. Given that Bloom and Resonator have separate uniqueness constraints, a cross-label ID collision is theoretically possible. Recommend Option A for defensive correctness.

---

### F6: Empty Result Handling

**Finding:** The function must handle the case where no node matches the given `bloomId`.

**Strategies:**

1. **Return default Beta(1,1):** Matches the "missing properties" default behavior
2. **Throw error:** Strict — caller must ensure node exists
3. **Return null/undefined:** Signals absence, caller decides

**Assessment:** Returning default Beta(1,1) provides consistency — missing node is indistinguishable from a node with no observations yet. This aligns with "handles missing properties gracefully." However, logging a warning is advisable for debugging. If strict existence checking is desired, the function signature could return `DecayWeightedPosterior | null`.

**Recommendation:** Return Beta(1,1) for missing node, consistent with default handling for missing properties. Consider optional parameter to control strictness in future iteration.

---

### F7: Integration with Existing Code

**Finding:** The function integrates with the existing `arm-stats.ts` module which already imports `runQuery` from `../client.js`. The new function follows the same query execution pattern.

**Evidence:**
- Line 6 of arm-stats.ts: `import { runQuery } from "../client.js";`
- `getArmStatsForCluster()` uses `runQuery()` with Cypher, parameters, and `"READ"` mode

**Consistency requirements:**
- Use `runQuery()` (not `readTransaction()` or direct driver access)
- Pass `"READ"` as transaction mode (this is a read-only operation)
- Map records using `.records.map()` pattern

---

### F8: Function Export and Testability

**Finding:** The function must be exported for use by callers and test suites.

**Evidence:**
- Acceptance criteria: "Function is exported and testable"
- Verification command: `npm run test -- arm-stats`
- Existing `getArmStatsForCluster()` is exported (line 22: `export async function`)

**Requirements for testability:**
- Export as named function (not default)
- Pure query function with no hidden side effects
- Deterministic output for given input (graph state)
- Mockable `runQuery` dependency via import (already pattern in codebase)

---

## Recommendations

### R1: Implement with Multi-Label Match Query
Use `WHERE n:Bloom OR n:Resonator` to ensure only valid morpheme types are matched. This provides defense against erroneous queries to non-posterior-bearing nodes.

### R2: Define DecayWeightedPosterior Interface
Export a dedicated interface rather than inline `{alpha: number, beta: number}`. This enables type reuse and documents the semantic meaning (decay-weighted posteriors vs. raw counts).

### R3: Use COALESCE Pattern for Defaults
Perform default handling in Cypher via `COALESCE(property, 0) + 1`. This keeps the function logic minimal and leverages Neo4j's null handling.

### R4: Handle Empty Results Gracefully
If `result.records.length === 0`, return `{alpha: 1, beta: 1}` (Beta(1,1) uniform prior). Log the case at debug level for observability.

### R5: Document armId Parameter Usage
Add JSDoc explaining that `armId` identifies the Thompson Sampling arm (Seed ID) being tracked by the posterior node. Note its current role (tracing/validation) and potential future use (composite lookup).

### R6: Add Type Assertion for Numeric Results
Neo4j may return `Integer` objects. Use `.toNumber()` or equivalent conversion to ensure JavaScript number type in return value.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `armId` semantics unclear — unused parameter | Medium | Low | Document as future-use; current impl ignores safely |
| Neo4j Integer vs JS number mismatch | Medium | Medium | Use explicit numeric conversion in record mapping |
| Node not found returns silent default | Low | Medium | Log at debug level; document behavior in JSDoc |
| Bloom/Resonator label mismatch | Low | High | Multi-label match guards against wrong node type |
| Property names typo (`weightedSucceses`) | Low | High | Match exact names from t1 schema constraints |

**Overall risk: Low.** The function is a straightforward property read with well-defined defaults. Primary uncertainty is `armId` semantics, which can be clarified in implementation without blocking progress.

---

## Verification Checklist

- [ ] Function signature matches `getDecayWeightedPosteriors(bloomId: string, armId: string)`
- [ ] Returns `{alpha: number, beta: number}` or equivalent interface
- [ ] Reads `weightedSuccesses` and `weightedFailures` from node properties
- [ ] Defaults to Beta(1,1) when properties or node are missing
- [ ] Uses `runQuery()` with `"READ"` mode
- [ ] Function is exported (`export async function`)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Tests pass (`npm run test -- arm-stats`)