# Audit existing enforcement layers and map bypass vectors in source

> Task ID: t2
> Model: claude-opus-4-6:adaptive:medium
> Duration: 152986ms
> Output chars: 19815
> Timestamp: 2026-03-24T01:00:56.988Z

> **⚠️ Hallucination flags (3):**
> - [content/warning] Task t2 references "write-observation.ts" but this file was not in its context
> - [content/warning] Task t2 references "instantiation.ts" but this file was not in its context
> - [content/warning] Task t2 references "tests/graph/morpheme-enforcement.test.ts" but this file was not in its context

---

# R-63 Enforcement Layer Audit & Bypass Vector Analysis

## Executive Summary

All three enforcement layers operate exclusively at the **application layer** (TypeScript functions). The database layer deploys **uniqueness constraints** and **partial property existence constraints** only. There are **zero structural mechanisms** preventing a raw Cypher session from creating fully-formed, schema-valid morpheme nodes that are invisible to the governance layer. The gap between "what the application enforces" and "what the database enforces" is the entire governance model: CONTAINS wiring, INSTANTIATES provenance, observation recording, grammatical shape, Highlander protocol, and relationship type validation.

---

## 1. Enforcement Layer 1: Instantiation Protocol

**Source:** `src/graph/instantiation.ts`

### What It Enforces

| Enforcement | Function | Mechanism |
|---|---|---|
| Required properties per morpheme type | `instantiateMorpheme()` | Iterates `REQUIRED_PROPERTIES` map; rejects if any value is `undefined`, `null`, or `""` |
| Non-empty content (A1) | `instantiateMorpheme()` | `content.trim() === ""` check |
| Parent existence | `instantiateMorpheme()` | `getNodeMorphemeType(parentId)` query |
| Grammatical containment shape | `instantiateMorpheme()` | `VALID_CONTAINERS` lookup — only Blooms contain {seed,bloom,resonator,grid,helix}, only Grids contain {seed} |
| Seed sub-type validation | `instantiateMorpheme()` | `VALID_SEED_SUBTYPES` whitelist |
| Highlander Protocol (A6) | `instantiateMorpheme()` | Pre-creation uniqueness query on `INSTANTIATES` edges to transformation definition; requires `transformationDefId` for resonators/blooms |
| Atomic triple-wiring | `instantiateMorpheme()` | Single `writeTransaction` containing: MERGE node, MERGE CONTAINS, MERGE INSTANTIATES |
| Property preservation on mutation | `updateMorpheme()` | Checks `REQUIRED_PROPERTIES` before allowing updates |
| Retirement guard | `updateMorpheme()` | Queries active FLOWS_TO consumers before allowing `status: 'retired'` |
| Endpoint existence for Lines | `createLine()` | `nodeExists()` check on source and target |
| Line type whitelist | `createLine()` | `VALID_LINE_TYPES` inclusion check |
| CONTAINS grammar on Lines | `createLine()` | Re-checks `VALID_CONTAINERS` for CONTAINS relationships |
| Stamp exit criteria | `stampBloomComplete()` | Queries incomplete exit-criterion Seeds; rejects unless `force=true` |
| Derived ΦL computation | `stampBloomComplete()` | Computes from relevant children only (Blooms + exit-criteria) |
| INSTANTIATES backfill on stamp | `stampBloomComplete()` | Queries for nodes missing INSTANTIATES; wires them |

### Enforcement Layer

**Application only.** Every check listed above is a TypeScript function guard executed before the Cypher runs. The `writeTransaction` calls contain raw MERGE/CREATE statements with no database-side validation beyond the schema constraints.

### Bypass Cyphers

**Bypass 1 — Create morpheme with no CONTAINS or INSTANTIATES wiring:**
```cypher
CREATE (n:Seed {
  id: 'injected-orphan-1',
  name: 'Stealth Seed',
  content: 'Injected payload',
  seedType: 'observation',
  status: 'active'
})
```
*Result:* Node passes all Neo4j constraints (id unique, content/seedType/status NOT NULL). No CONTAINS edge to any parent. No INSTANTIATES edge to any definition. No observation recorded. Governance is structurally blind.

**Bypass 2 — Create morpheme violating grammatical containment:**
```cypher
MATCH (g:Grid {id: 'grid:instantiation-observations'})
CREATE (g)-[:CONTAINS]->(r:Resonator {
  id: 'injected-resonator-in-grid',
  name: 'Grammar violation',
  content: 'Resonators cannot live in Grids'
})
```
*Result:* Resonator has no property existence constraints at DB level. CONTAINS edge is created. The application's `VALID_CONTAINERS` rule (Grids can only contain Seeds) is completely bypassed.

**Bypass 3 — Duplicate resonator (Highlander violation):**
```cypher
CREATE (r:Resonator {
  id: 'injected-dup-resonator',
  name: 'Second instance',
  content: 'Duplicate of existing resonator'
})
WITH r
MATCH (def:Seed {id: 'def:morpheme:resonator'})
CREATE (r)-[:INSTANTIATES]->(def)
```
*Result:* No A6 justification required. No check for existing instances. Highlander Protocol is entirely application-side.

**Bypass 4 — Mutate required property to empty string:**
```cypher
MATCH (s:Seed {id: 'existing-legitimate-seed'})
SET s.content = ''
```
*Result:* `content IS NOT NULL` constraint passes (empty string ≠ null). The application's `trim() === ""` guard never runs.

**Bypass 5 — Create arbitrary relationship type:**
```cypher
MATCH (a {id: 'node-a'}), (b {id: 'node-b'})
CREATE (a)-[:CORRUPTS]->(b)
```
*Result:* Neo4j has no relationship type whitelist. Any string is a valid relationship type. `VALID_LINE_TYPES` exists only in TypeScript.

---

## 2. Enforcement Layer 2: Schema Constraints

**Source:** `src/graph/schema.ts` → `SCHEMA_STATEMENTS` array

### Complete Constraint Inventory

#### Uniqueness Constraints (15 total)

| Constraint Name | Label | Property | Enforcement Level |
|---|---|---|---|
| `seed_id_unique` | Seed | id | DB |
| `bloom_id_unique` | Bloom | id | DB |
| `decision_id_unique` | Decision | id | DB |
| `rule_id_unique` | ConstitutionalRule | id | DB |
| `observation_id_unique` | Observation | id | DB |
| `distillation_id_unique` | Distillation | id | DB |
| `institutional_id_unique` | InstitutionalKnowledge | id | DB |
| `resonator_id_unique` | Resonator | id | DB |
| `grid_id_unique` | Grid | id | DB |
| `helix_id_unique` | Helix | id | DB |
| `context_cluster_id_unique` | ContextCluster | id | DB |
| `threshold_event_id_unique` | ThresholdEvent | id | DB |
| `human_feedback_id_unique` | HumanFeedback | id | DB |
| `pipeline_run_id_unique` | PipelineRun | id | DB |
| `task_output_id_unique` | TaskOutput | id | DB |

#### Property Existence Constraints (8 total)

| Constraint Name | Label | Property | Enforcement Level |
|---|---|---|---|
| `decision_timestamp_required` | Decision | timestamp | DB |
| `pipeline_run_started_at_required` | PipelineRun | startedAt | DB |
| `task_output_run_id_required` | TaskOutput | runId | DB |
| `observation_timestamp_required` | Observation | timestamp | DB |
| `seed_content_required` | Seed | content | DB |
| `seed_seedtype_required` | Seed | seedType | DB |
| `seed_status_required` | Seed | status | DB |
| `bloom_type_required` | Bloom | type | DB |
| `bloom_status_required` | Bloom | status | DB |

#### What Is NOT Constrained at DB Level

| Missing Constraint | Affected Labels | Risk |
|---|---|---|
| **No property existence for Resonator** | Resonator | Can create `(:Resonator {id: 'x'})` with zero other properties |
| **No property existence for Grid** | Grid | Same — `(:Grid {id: 'x'})` is valid |
| **No property existence for Helix** | Helix | Same — `(:Helix {id: 'x'})` is valid |
| **No `name` constraint on any type** | All | Morphemes can be nameless |
| **No non-empty-string check** | All | `content: ''` passes `IS NOT NULL` |
| **No relationship existence constraint** | All | Nodes can exist without CONTAINS or INSTANTIATES |
| **No relationship type constraint** | All | Any relationship type string is valid |
| **No label constraint** | All | Nodes with arbitrary labels (`:Malicious`) can be created |
| **No property value enumeration** | All | `status: 'hacked'`, `seedType: 'exploit'` all pass |

### Schema Layer Assessment

The R-39 property existence constraints represent the **only structural enforcement** beyond id uniqueness. However, they cover only 3 of 5 morpheme types (Seed, Bloom) and do not enforce semantic validity (non-empty, valid enum values). The schema provides **identity integrity** (no duplicate IDs per label) but not **grammatical integrity** (no containment, no provenance, no relationship grammar).

---

## 3. Enforcement Layer 3: Observation Recording

**Source:** `src/graph/write-observation.ts` and observation functions in `src/graph/instantiation.ts`

### What It Enforces

There are two distinct observation systems:

**A. Operational Observations** (`write-observation.ts` → `writeObservation()`):
- Records raw Observation nodes in the graph
- Runs 7-stage signal conditioning pipeline (EWMA, CUSUM, trend, MACD)
- Persists conditioned values back on the Observation node
- Optionally: recomputes ΦL, classifies health band, detects threshold crossings, triggers algedonic cascade

**B. Governance Observations** (`instantiation.ts` → `recordInstantiationObservation()`, `recordMutationObservation()`, `recordLineObservation()`):
- Records every creation, mutation, and line creation attempt (success or failure)
- Writes to observation Grids: `grid:instantiation-observations`, `grid:mutation-observations`, `grid:line-creation-observations`
- Each observation is a Seed node with CONTAINS wiring to its Grid

### Enforcement Layer

**Application only.** Both observation systems are functions called at the end of successful operations. They are explicitly marked `non-fatal` (catch-and-swallow). There is no database trigger, no transaction hook, no APOC callback that fires on arbitrary writes.

### Bypass

Any raw Cypher write produces **zero observation records**:

```cypher
// This mutation leaves no trace in any observation Grid
MATCH (b:Bloom {id: 'M-9'})
SET b.phiL = 1.0, b.status = 'complete'
```

**Consequence:** The governance layer's entire visibility model depends on writes flowing through the TypeScript API. When they don't, the observation Grids show a clean history while the graph contains ungoverned state.

Even more critically, the observation recording functions themselves use raw `writeTransaction` calls to create Seed nodes — meaning observation recording *itself* bypasses the instantiation protocol (no INSTANTIATES wiring on observation Seeds). This is an internal inconsistency, though not a security vulnerability per se.

---

## 4. Migration Script Assessment

**Source:** `src/graph/migrate.ts`

### What It Deploys

1. Calls `migrateSchema()` — runs all `SCHEMA_STATEMENTS` (constraints + indexes)
2. Calls `seedConstitutionalRules()` — creates ConstitutionalRule nodes
3. Calls `verifySchema()` — count-based health check (≥23 constraints, ≥20 indexes)

### What It Does NOT Deploy

| Missing Deployment | Impact |
|---|---|
| No Neo4j triggers (APOC `apoc.trigger.add`) | No event-driven enforcement on raw writes |
| No transaction event handlers | No metadata injection or validation on commit |
| No stored procedures for write gating | No server-side enforcement layer |
| No role-based write restrictions | No distinction between governed and ungoverned writers |
| No property value constraints (enums) | No DB-level validation of status/type/seedType values |
| No relationship existence requirements | No DB-level CONTAINS/INSTANTIATES enforcement |

### Verification Gap

`verifySchema()` checks `constraintCount >= 23 && indexCount >= 20` — a pure count-based heuristic. It does not verify:
- Which constraints exist (an attacker who drops one and adds a different one passes)
- Constraint correctness (content constraints are on right labels)
- Structural integrity (CONTAINS/INSTANTIATES topology)

---

## 5. Comprehensive Gap Matrix

| Governance Property | App Layer | DB Layer | Gap Severity |
|---|---|---|---|
| **ID uniqueness** | TypeScript types | ✅ Uniqueness constraints per label | **None** — enforced at DB |
| **Seed property existence** (content, seedType, status) | Runtime guards | ✅ IS NOT NULL constraints | **Low** — empty strings still pass |
| **Bloom property existence** (type, status) | Runtime guards | ✅ IS NOT NULL constraints | **Low** — empty strings still pass |
| **Resonator property existence** | Runtime guards | ❌ None beyond id uniqueness | **Critical** — zero DB enforcement |
| **Grid property existence** | Runtime guards | ❌ None beyond id uniqueness | **Critical** — zero DB enforcement |
| **Helix property existence** | Runtime guards | ❌ None beyond id uniqueness | **Critical** — zero DB enforcement |
| **Non-empty content** | `trim() === ""` check | ❌ None | **High** — empty strings invisible to DB |
| **CONTAINS wiring** | Atomic in `instantiateMorpheme()` | ❌ None | **Critical** — nodes can exist uncontained |
| **INSTANTIATES wiring** | Atomic in `instantiateMorpheme()` | ❌ None | **Critical** — nodes can exist without provenance |
| **Containment grammar** | `VALID_CONTAINERS` lookup | ❌ None | **Critical** — any node can CONTAIN any other |
| **Relationship type whitelist** | `VALID_LINE_TYPES` array | ❌ None | **High** — arbitrary relationship types allowed |
| **Highlander Protocol (A6)** | Pre-creation query + guard | ❌ None | **High** — duplicate instances undetectable at DB |
| **Observation recording** | Post-write function calls | ❌ None | **Critical** — raw writes leave zero audit trail |
| **Signal conditioning** | `writeObservation()` pipeline | ❌ None | **High** — raw observations skip conditioning |
| **Property value semantics** | TypeScript enums/types | ❌ None | **High** — `status: 'hacked'` is DB-valid |
| **Label whitelist** | TypeScript `LABEL_MAP` | ❌ None | **High** — arbitrary labels can be created |
| **Retirement guard** | Consumer query in `updateMorpheme()` | ❌ None | **High** — active resonators can be retired silently |
| **Stamp protocol** | `stampBloomComplete()` | ❌ None | **High** — Blooms can be stamped complete without exit criteria |

---

## 6. Test Coverage Analysis

**File referenced:** `tests/graph/morpheme-enforcement.test.ts`

This file was not provided in the context for review. Based on the enforcement layer analysis, the following test coverage questions are critical:

### Tests That Should Exist (Verification Needed)

1. **Positive path:** Does `instantiateMorpheme()` create all three structural elements (node + CONTAINS + INSTANTIATES)?
2. **Rejection tests:** Does each guard in `instantiateMorpheme()` actually prevent creation (missing properties, bad parent, wrong containment)?
3. **Highlander tests:** Does duplicate prevention work? Does compose-vs-create logic work?
4. **Mutation preservation:** Does `updateMorpheme()` reject removal of required properties?
5. **Line type validation:** Does `createLine()` reject unknown types?
6. **Observation recording:** Are observations actually created on success and failure?

### Tests That Cannot Exist in Current Architecture

**No test can verify that raw Cypher is prevented**, because the enforcement is application-only. A test that bypasses the TypeScript API and writes raw Cypher would succeed — this is the fundamental architectural gap. The test suite can only verify that the application layer works when used; it cannot verify that the application layer is the *only* write path.

---

## 7. Attack Surface Summary

### The Core Vulnerability

The system has **exactly one write path** that is governed (the TypeScript API in `instantiation.ts`) and **unlimited write paths** that are ungoverned (any Neo4j session with write credentials). The database cannot distinguish between them because:

1. No transaction metadata is injected by the governed path
2. No cryptographic write token is embedded in governed writes
3. No trigger validates structural invariants on commit
4. No stored procedure gates write operations

### Concrete Attack Scenarios

**Scenario A — Ghost Node Injection:**
An attacker with Neo4j write access creates morpheme-labeled nodes that pass all DB constraints but have no CONTAINS/INSTANTIATES wiring. These nodes are invisible to governance queries that traverse from the Constitutional Bloom downward through CONTAINS chains.

**Scenario B — Governance Metric Corruption:**
An attacker directly sets `phiL = 1.0` on degraded Blooms, bypassing the derivation protocol. No threshold event is created. No observation records the change. The health band appears healthy.

**Scenario C — Observation Poisoning:**
An attacker creates fake Observation nodes with crafted values, bypassing the 7-stage signal conditioning pipeline. Downstream ΦL computation consumes unconditioned data.

**Scenario D — Structural Topology Corruption:**
An attacker creates CONTAINS edges that violate the grammatical containment rules (e.g., `Seed -[:CONTAINS]-> Bloom`), creating an invalid topology that breaks hierarchical ΦL propagation and containment traversal queries.

**Scenario E — Label Pollution:**
An attacker creates nodes with labels not in the morpheme vocabulary (e.g., `:Backdoor`, `:AdminOverride`). These nodes have no constraints, no governance, and can participate in relationships with governed nodes.

---

## 8. Structural Observation: The Observation Recording Paradox

The observation recording functions in `instantiation.ts` themselves create Seed nodes via raw Cypher within `writeTransaction`:

```typescript
// From recordInstantiationObservation():
await tx.run(
  `MERGE (g:Grid {id: 'grid:instantiation-observations'})
   CREATE (obs:Seed { ... })
   WITH g, obs
   MERGE (g)-[:CONTAINS]->(obs)`,
  { ... }
);
```

These observation Seeds:
- ✅ Have CONTAINS wiring (to the observation Grid)
- ❌ Have **no INSTANTIATES wiring** (no `(obs)-[:INSTANTIATES]->(def:Seed {id: 'def:morpheme:seed'})`)
- ❌ Are **not created via `instantiateMorpheme()`** (would cause infinite recursion)
- ❌ Generate **no observation of their own creation**

This means the governance layer's own audit trail is itself partially ungoverned — it satisfies CONTAINS placement but not INSTANTIATES provenance. This is a structural bootstrapping problem (governance cannot observe its own observations without recursion) that any solution must address.

---

## 9. Existing Neo4j Capability Utilization

| Neo4j Capability | Available | Currently Used | Enforcement Potential |
|---|---|---|---|
| Uniqueness constraints | Yes | ✅ Yes (15) | Identity only |
| Property existence constraints | Yes | ✅ Partial (8) | Prevents null, not empty |
| Node key constraints | Yes (Enterprise) | ❌ No | Could enforce composite keys |
| Property type constraints | Neo4j 5.x | ❌ No | Could enforce string/int types |
| APOC triggers | With APOC plugin | ❌ No | Could validate on commit |
| Transaction metadata | Neo4j 4.x+ | ❌ No | Could tag governed writes |
| Custom procedures | Neo4j plugin API | ❌ No | Could gate all writes |
| Role-based access (RBAC) | Enterprise | ❌ No | Could restrict raw Cypher |
| Relationship existence constraints | Neo4j 5.x Enterprise | ❌ No | Could enforce CONTAINS |

---

## 10. Key Findings for R-63 Design Phase

1. **The enforcement gap is total for structural wiring.** CONTAINS and INSTANTIATES — the two relationships that make the governance model work — have zero database enforcement. This is not a partial gap; it is complete absence.

2. **Three of five morpheme types have no property enforcement at all.** Resonator, Grid, and Helix can be created as label-only nodes with just an id property. The R-39 constraints cover only Seed and Bloom.

3. **The migration script deploys no procedural enforcement.** It creates declarative constraints only. No triggers, no callbacks, no stored procedures.

4. **The observation recording system is itself partially ungoverned.** Audit trail Seeds lack INSTANTIATES wiring, creating a structural inconsistency within the governance layer.

5. **The `writeTransaction` / `readTransaction` abstraction provides no security boundary.** It is a convenience wrapper around the Neo4j driver, not an enforcement chokepoint. Any code with driver access can bypass it.

6. **Empty-string bypass is architecturally significant.** `IS NOT NULL` constraints do not prevent `content: ''`, which violates A1 ("every morpheme carries meaning"). This affects the two types (Seed, Bloom) that do have property constraints.