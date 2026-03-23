# Add Bloom Definition status filter

> Task ID: t4
> Model: claude-opus-4-6:adaptive:low
> Duration: 63910ms
> Output chars: 8032
> Timestamp: 2026-03-23T18:00:05.755Z

> **⚠️ Hallucination flags (5):**
> - [content/warning] Task t4 references "structural-survey.ts" but this file was not in its context
> - [content/warning] Task t4 references "types.ts" but this file was not in its context
> - [content/warning] Task t4 references "./types.js" but this file was not in its context
> - [content/warning] Task t4 references "codex-signum-v5b-statistical-assessment.md" but this file was not in its context
> - [content/warning] Task t4 references "survey-docs.test.ts" but this file was not in its context

---

# Analysis: Bloom Definition Status Filter (Cycle 8, t4)

## Executive Summary

The structural survey in `structural-survey.ts` currently performs **no status filtering on Bloom Definitions themselves** and passes child statuses through without normalization. This analysis identifies three concrete gaps in the survey's Cypher queries and status handling that must be addressed to satisfy the acceptance criteria.

---

## Findings

### 1. Missing Definition-Level Status Filter

**Evidence**: In Section 4 of `surveyBloomTopology`, the INSTANTIATES edges query has three UNION clauses. Each matches `(def:Seed)` where `def.seedType IN ['transformation-definition', 'bloom-definition']`, but **none of them filter on `def.status`**.

| UNION Clause | Filters Instance Status? | Filters Definition Status? |
|---|---|---|
| 1 — Children's internal morphemes | No | **No** |
| 2 — Shared ecosystem resonators | No | **No** |
| 3 — Global bloom instances | Yes (`instance.status IN [...]`) | **No** |

**Impact**: Deprecated, archived, or draft Bloom Definitions appear in survey results indistinguishably from active ones. A Bloom whose definition has been superseded still surfaces as a valid INSTANTIATES edge, corrupting downstream spectral calculations and advisory outputs.

**Recommendation**: Add a `WHERE def.status IN [<valid-statuses>]` predicate (or equivalent null-safe check) to all three UNION clauses. The valid status set for definitions should be drawn from the specification but likely includes `active` and `approved`, excluding `deprecated`, `archived`, and `draft`.

---

### 2. Missing Definition Status Filter in Children Query (Section 2)

**Evidence**: The children query's `OPTIONAL MATCH` clause:

```cypher
OPTIONAL MATCH (internal)-[:INSTANTIATES]->(def:Seed)
  WHERE def.seedType IN ['transformation-definition', 'bloom-definition']
```

This matches **any** definition regardless of its status. The resulting `internalMorphemes` array populates `transformationDefId` even when the referenced definition is inactive.

**Impact**: Children appear to instantiate definitions that may no longer be valid, producing misleading topology snapshots.

**Recommendation**: Extend the `WHERE` clause to include a definition status predicate, e.g.:

```
AND (def.status IS NULL OR def.status IN ['active', 'approved'])
```

The `IS NULL` guard is necessary for backward compatibility with definitions that predate the status property.

---

### 3. No Status Normalization for Architect vs Dev-Agent Vocabulary

**Evidence**: In the children processing logic, status is passed through raw:

```typescript
status: (r.get("childStatus") as string) ?? "unknown",
```

There is no mapping layer between the graph value and the survey output. The acceptance criteria explicitly require: *"Normalization handles architect/dev-agent status correctly."*

**Observed status vocabularies** (from the third UNION's filter and the `BloomSurvey` type):

| Actor Context | Known Statuses | Canonical Form (Inferred) |
|---|---|---|
| Architect | `approved`, `planned`, `active` | `active`, `planned` |
| Dev-Agent | `created`, `in-progress`, `complete` | `active`, `complete` |
| System | `unknown`, `null` | `unknown` |

**Impact**: Without normalization, consumers of `BloomSurvey` must implement their own status mapping, leading to inconsistent filtering downstream. The pre-survey's ψH=0.6 may partly reflect this inconsistency — structural health is degraded when nodes carry semantically equivalent but lexically different statuses.

**Recommendation**: Introduce a normalization function (pure, no side effects) that maps raw graph statuses to a canonical vocabulary. This function should:

1. Be co-located with the survey module or in `types.ts`
2. Handle both architect and dev-agent vocabularies
3. Default to `"unknown"` for unrecognized values
4. Be applied to both `children[].status` and any definition status values before inclusion in the survey result

A suggested canonical vocabulary:

| Canonical | Maps From |
|---|---|
| `active` | `active`, `approved`, `created`, `in-progress` |
| `planned` | `planned` |
| `complete` | `complete` |
| `deprecated` | `deprecated`, `archived` |
| `unknown` | `null`, `undefined`, any unrecognized value |

---

### 4. Interaction with λ₂=0 Advisory

**Evidence**: The mutation advisory states *"lambda2=0: disconnected components. Stages have no inter-edges."* The INSTANTIATES edges in Section 4's third UNION clause performs a **global** match across all Bloom instances — this is scope-unbounded and includes nodes from disconnected components.

**Impact**: Without definition status filtering, disconnected components containing deprecated definitions inflate the `instantiatesEdges` array, making it harder for downstream consumers (like the Assayer) to distinguish genuine topology from stale references.

**Recommendation**: The definition status filter will partially address this by excluding stale edges. However, the λ₂=0 condition requires separate remediation (the `create_line` task wiring `FLOWS_TO` from `architect_GATE`). The status filter and the connectivity fix are complementary — neither alone fully resolves the survey quality issue.

---

### 5. Type Alignment Concern

**Evidence**: The `BloomSurvey` type (imported from `./types.js`) defines the shape of the return value. The `instantiatesEdges` array elements include `defSeedType` but **not** `defStatus`. If definition status filtering is applied at the query level, no type change is needed. If the status should be surfaced in results (for transparency), the type must be extended.

**Recommendation**: Prefer query-level filtering (exclude invalid statuses before they enter the result) rather than adding `defStatus` to the output type. This keeps the survey output clean and avoids pushing filtering responsibility to consumers. If audit trails are needed, a separate `filteredCount` field could be added to the survey metadata.

---

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Specification divergence — canonical status set doesn't match spec | High | Medium | Verify against `codex-signum-v5b-statistical-assessment.md` before implementation |
| Backward incompatibility — existing definitions lack `status` property | Medium | High | Use `IS NULL` guard in Cypher; normalize `null` → `unknown` |
| Over-filtering — excluding `created` status removes valid in-flight work | Medium | Medium | Include `created` in the active canonical bucket |
| Test gap — `survey-docs.test.ts` may not cover new filter paths | Medium | High | Extend test cases for each status category |

---

## Verification Strategy

The specified verification command:

```
npx vitest run tests/conformance/survey-docs.test.ts
```

Should validate:

1. **Positive case**: Active/approved Bloom Definitions appear in `instantiatesEdges`
2. **Negative case**: Deprecated/archived Bloom Definitions are excluded
3. **Normalization case**: `created` (dev-agent) and `approved` (architect) both normalize to `active` in children status
4. **Null-safety case**: Definitions without a `status` property are included (not silently dropped)
5. **Consistency case**: Filtered results maintain referential integrity — no `transformationDefId` in `internalMorphemes` points to a filtered-out definition

---

## Conclusion

**Readiness Assessment**: ✅ **Actionable**

Unlike t1, sufficient context exists to define the implementation precisely. Three changes are required:

1. **Query-level**: Add `def.status` predicates to all three INSTANTIATES UNION clauses and the children's internal morphemes OPTIONAL MATCH
2. **Processing-level**: Introduce a status normalization function applied to `children[].status`
3. **Guard-level**: Handle null/missing status properties gracefully with fallback semantics

The implementation is self-contained within `structural-survey.ts` (and potentially `types.ts` for the normalizer). No architectural changes or new dependencies are required.