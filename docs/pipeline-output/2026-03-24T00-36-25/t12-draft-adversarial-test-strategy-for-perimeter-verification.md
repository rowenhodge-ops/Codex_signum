# Draft adversarial test strategy for perimeter verification

> Task ID: t12
> Model: claude-opus-4-6:adaptive:medium
> Duration: 277679ms
> Output chars: 52894
> Timestamp: 2026-03-24T01:36:12.834Z

> **⚠️ Hallucination flags (21):**
> - [content/warning] Task t12 references "tests/graph/perimeter-injection.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/graph/perimeter-partial-property.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/graph/perimeter-label-grafting.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/safety/perimeter-rbac.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/graph/perimeter-token-forgery.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/safety/perimeter-token-verification.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/conformance/perimeter-provenance.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/safety/perimeter-composed.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "tests/graph/perimeter-regression-r63.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "perimeter-injection.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "perimeter-partial-property.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "perimeter-label-grafting.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "perimeter-rbac.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "perimeter-token-verification.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "perimeter-token-forgery.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "perimeter-provenance.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "perimeter-composed.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "perimeter-regression-r63.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "morpheme-enforcement.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "algedonic-bypass.test.ts" but this file was not in its context
> - [content/warning] Task t12 references "cross-task-injection.test.ts" but this file was not in its context

---

# Adversarial Test Strategy: Perimeter Verification

**Document:** codex-signum-adversarial-test-strategy-v1.md
**Task:** t12 — Draft adversarial test strategy for perimeter verification
**Status:** Test specification — Architect review required
**Inputs:** t1 (Threat Model), t2 (Enforcement Audit), t10 (Recommended Architecture), t11 (Migration Spec)
**References:** cs-v5.0.md §Constitutional Coupling, §A6 Minimal Authority; R-63 §10 compliance kills

---

## 0. Test Strategy Principles

### 0.1 Structural Verification, Not Monitoring

Every test in this strategy asserts one thing: **did the database reject the transaction?** No test polls for injected nodes after the fact. No test walks a chain looking for orphans. No test counts nodes before and after. The assertion pattern is:

```
GIVEN  the perimeter is installed (constraints + triggers + roles)
WHEN   an adversarial Cypher statement executes
THEN   the transaction fails with a specific, predictable error
```

If the transaction commits, the test fails. There is no second pass. This is the structural verification criterion from R-63: the defence either prevents the write or it does not.

### 0.2 Threat Model Coverage Matrix

Each test maps to a specific attack vector from t1 and a specific defence layer from t10. The matrix ensures no vector is tested by only one layer and no layer is tested by only one vector.

| Attack Vector (from t1) | L1: RBAC | L2: Constraints | L3: Trigger | L4: Crypto | Test Category |
|---|:---:|:---:|:---:|:---:|---|
| V1: Raw CREATE with morpheme label, no gov properties | ✓ | ✓ | ✓ | — | Injection |
| V2: CREATE with some but not all _gov_* properties | — | ✓ | ✓ | — | Partial-property |
| V3: CREATE with all _gov_* properties but fake values | — | — | ✓ | ✓ | Token forgery |
| V4: SET morpheme label on existing unprotected node | ✓ | ✓ | ✓ | — | Label-grafting |
| V5: Write from non-governed role | ✓ | — | — | — | RBAC bypass |
| V6: CREATE with valid-format but invalid-HMAC token | — | — | ✓ | ✓ | Token forgery |
| V7: CREATE morpheme without INSTANTIATES wiring | — | — | ✓ | — | Injection |
| V8: CREATE morpheme without CONTAINS placement | — | — | ✓ | — | Injection |
| V9: Grammatical containment violation (Resonator in Grid) | — | — | ✓ | — | Injection |
| V10: Highlander violation (duplicate resonator instance) | — | — | ✓ | — | Injection |
| V11: Property mutation to empty string | — | — | ✓ | — | Partial-property |
| V12: Arbitrary relationship type creation | ✓ | — | ✓ | — | Injection |
| V13: Replay of token from legitimate node onto new node | — | — | ✓ | ✓ | Token forgery |
| V14: Token with wrong key version prefix | — | — | ✓ | ✓ | Token forgery |
| V15: Composed attack — valid constraints, no wiring | — | — | ✓ | ✓ | Composed |

### 0.3 Test Environment Requirements

| Environment | What It Tests | Required Infrastructure | Test Runner |
|---|---|---|---|
| **Unit (no Neo4j)** | Token generation/verification logic, canonical input construction, property validation helpers, constraint DDL string assertions | None — pure function tests | `vitest` |
| **Integration (live Neo4j)** | Constraint rejection, trigger rejection, RBAC privilege denial, composed layer behaviour | Neo4j 5.x instance with APOC, schema v6 applied, roles configured | `vitest` with Neo4j test container or dedicated test instance |
| **Adversarial (live Neo4j, multi-session)** | Cross-session attacks, role impersonation, concurrent injection attempts | Neo4j 5.x Enterprise (for RBAC tests), multiple authenticated sessions | `vitest` with explicit session management |

**Critical distinction:** The integration and adversarial tests are **not** the compliance-as-monitoring anti-pattern. They are *construction-time verification* — they run during development and CI to confirm the perimeter rejects adversarial writes. They do not run in production scanning for injected nodes. The test asserts "this write was rejected," not "the graph is clean." This is the same structural verification pattern used in `tests/graph/morpheme-enforcement.test.ts` for R-39 (Layer 3 schema constraint assertions).

---

## 1. Injection Tests

These tests attempt raw Cypher `CREATE` statements with morpheme labels, expecting the database to reject the transaction. They target the original R-63 vulnerability: ungoverned node injection.

### Test Directory: `tests/graph/perimeter-injection.test.ts`

---

#### T-INJ-01: Bare Seed creation — no governance properties, no wiring

**Attack vector:** V1
**Defence layers tested:** L2 (property constraints), L3 (trigger — if constraints somehow bypassed)
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied. All `_gov_*` NOT NULL constraints active on Seed label. APOC triggers registered.

**Attack Cypher:**
```cypher
CREATE (s:Seed {
  id: 'adversarial-bare-seed-001',
  name: 'Injected Seed',
  content: 'Payload content',
  seedType: 'observation',
  status: 'active'
})
```

**Expected failure mode:** Transaction rolls back with constraint violation error. Specifically: `Neo.ClientError.Schema.ConstraintValidationFailed` referencing one of `seed_gov_instantiation_id_required`, `seed_gov_provenance_epoch_required`, `seed_gov_contains_path_required`, `seed_gov_schema_version_required`, or `seed_gov_write_token_required`. The constraint engine evaluates all five but reports the first violation.

**Verification assertion:** (1) Transaction throws. (2) Error message contains `_gov_` or `ConstraintValidation`. (3) Post-transaction query `MATCH (s:Seed {id: 'adversarial-bare-seed-001'}) RETURN s` returns zero rows — the node does not exist in the committed graph.

**Regression significance:** This is the *exact* Cypher from t2 Bypass 1 that currently succeeds against the v5 schema. This test is the primary regression gate for the original R-63 vulnerability.

---

#### T-INJ-02: Bare Bloom creation — no governance properties, no wiring

**Attack vector:** V1
**Defence layers tested:** L2, L3
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied.

**Attack Cypher:**
```cypher
CREATE (b:Bloom {
  id: 'adversarial-bare-bloom-001',
  name: 'Injected Bloom',
  type: 'milestone',
  status: 'active'
})
```

**Expected failure mode:** Constraint violation on `bloom_gov_instantiation_id_required` (or any `_gov_*` constraint). Transaction does not commit.

**Verification assertion:** Transaction throws. Node absent from committed graph.

---

#### T-INJ-03: Bare Resonator creation — exploiting pre-R-63 constraint gap

**Attack vector:** V1
**Defence layers tested:** L2 (both domain property gap closure AND governance properties)
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied — including the new domain property existence constraints on Resonator (`name`, `content`, `role`, `status` NOT NULL) identified in t2 as missing.

**Attack Cypher:**
```cypher
CREATE (r:Resonator {
  id: 'adversarial-bare-resonator-001'
})
```

**Expected failure mode:** Constraint violation. Pre-R-63, this Cypher *succeeds* (only `id` uniqueness enforced on Resonator). Post-R-63, it fails on the first missing NOT NULL property — either the new domain property `resonator_name_required` or governance property `resonator_gov_instantiation_id_required`.

**Verification assertion:** Transaction throws. This test specifically validates the domain property gap closure identified in t2 §2 and t11 §1.2.

**Regression significance:** The t2 audit identified that Resonator, Grid, and Helix had only uniqueness constraints on `id`. This test confirms the gap is closed.

---

#### T-INJ-04: Bare Grid creation — same gap as T-INJ-03

**Attack vector:** V1
**Defence layers tested:** L2
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied.

**Attack Cypher:**
```cypher
CREATE (g:Grid {
  id: 'adversarial-bare-grid-001'
})
```

**Expected failure mode:** Constraint violation on missing NOT NULL property.

---

#### T-INJ-05: Bare Helix creation — same gap as T-INJ-03

**Attack vector:** V1
**Defence layers tested:** L2
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied.

**Attack Cypher:**
```cypher
CREATE (h:Helix {
  id: 'adversarial-bare-helix-001'
})
```

**Expected failure mode:** Constraint violation on missing NOT NULL property.

---

#### T-INJ-06: Morpheme with governance properties but no INSTANTIATES wiring

**Attack vector:** V7
**Defence layers tested:** L3 (APOC trigger — `gov_enforce_instantiates`)
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied. APOC triggers active. Attacker knows the governance property schema and supplies syntactically plausible (but fake) values.

**Attack Cypher:**
```cypher
CREATE (s:Seed {
  id: 'adversarial-no-instantiates-001',
  name: 'Fake Governed Seed',
  content: 'Looks legitimate',
  seedType: 'observation',
  status: 'active',
  _gov_instantiation_id: 'fake-uuid-00000000-0000-0000-0000-000000000000',
  _gov_provenance_epoch: '2025-07-15T00:00:00.000Z',
  _gov_contains_path: 'constitutional-bloom.fake-path',
  _gov_schema_version: 6,
  _gov_write_token: 'v1:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
})
```

**Expected failure mode:** APOC trigger `gov_enforce_instantiates` fires. The trigger inspects `$createdNodes`, finds a Seed without an `INSTANTIATES` relationship to a definition node, calls `apoc.util.validate()`, and forces rollback. Error message contains `"R-63 GOVERNANCE VIOLATION"` and `"INSTANTIATES"`.

**Verification assertion:** Transaction throws with governance violation. Node absent. **This test is the critical boundary between L2 (which this attack passes) and L3 (which catches it).**

---

#### T-INJ-07: Morpheme with governance properties and fake INSTANTIATES, but no CONTAINS

**Attack vector:** V8
**Defence layers tested:** L3 (APOC trigger — `gov_enforce_contains`)
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied. Attacker wires a fake INSTANTIATES relationship to a legitimate definition Seed.

**Attack Cypher:**
```cypher
MATCH (def:Seed {id: 'def:morpheme:seed'})
CREATE (s:Seed {
  id: 'adversarial-no-contains-001',
  name: 'Has Instantiates But No Contains',
  content: 'Missing containment',
  seedType: 'observation',
  status: 'active',
  _gov_instantiation_id: 'fake-uuid-11111111-1111-1111-1111-111111111111',
  _gov_provenance_epoch: '2025-07-15T00:00:00.000Z',
  _gov_contains_path: 'nonexistent.path',
  _gov_schema_version: 6,
  _gov_write_token: 'v1:BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
})-[:INSTANTIATES]->(def)
```

**Expected failure mode:** Trigger `gov_enforce_contains` fires. Node has no incoming `CONTAINS` relationship from a valid container. Rollback with `"R-63 GOVERNANCE VIOLATION"` and `"CONTAINS"`.

**Verification assertion:** Transaction throws. Both the node and the INSTANTIATES relationship are absent from committed graph (full transaction rollback).

---

#### T-INJ-08: Grammatical containment violation — Resonator inside Grid

**Attack vector:** V9
**Defence layers tested:** L3 (APOC trigger — grammatical shape validation)
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied. Legitimate Grid exists.

**Attack Cypher:**
```cypher
MATCH (g:Grid {id: 'grid:instantiation-observations'})
MATCH (def:Seed {id: 'def:morpheme:resonator'})
CREATE (g)-[:CONTAINS]->(r:Resonator {
  id: 'adversarial-resonator-in-grid-001',
  name: 'Grammar violation',
  content: 'Resonators cannot live in Grids',
  role: 'injected',
  status: 'active',
  _gov_instantiation_id: 'fake-uuid-22222222',
  _gov_provenance_epoch: '2025-07-15T00:00:00.000Z',
  _gov_contains_path: 'grid:instantiation-observations',
  _gov_schema_version: 6,
  _gov_write_token: 'v1:CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC='
})-[:INSTANTIATES]->(def)
```

**Expected failure mode:** Trigger validates grammatical containment rules (`VALID_CONTAINERS` logic: Grids may only contain Seeds). Container type mismatch causes rollback. Error references grammatical shape violation.

**Regression significance:** This is the exact t2 Bypass 2 scenario.

---

#### T-INJ-09: Arbitrary relationship type injection

**Attack vector:** V12
**Defence layers tested:** L3 (APOC trigger — relationship type whitelist)
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied. Two legitimate nodes exist.

**Attack Cypher:**
```cypher
MATCH (a {id: 'legitimate-seed-001'}), (b {id: 'legitimate-bloom-001'})
CREATE (a)-[:CORRUPTS]->(b)
```

**Expected failure mode:** If L3 trigger includes relationship type whitelist enforcement (checking `$createdRelationships` against `VALID_LINE_TYPES`), the transaction rolls back. If L1 RBAC is active and the session uses `cs_reader`, the write is denied at privilege level.

**Design note:** Whether the trigger validates relationship types is an architecture decision from t10. If the trigger scope is limited to node creation, this attack succeeds at L3. The test documents the expected behaviour and flags it for architect review. At minimum, L1 RBAC should catch this for non-governed roles.

---

#### T-INJ-10: Highlander Protocol violation — duplicate resonator instance

**Attack vector:** V10
**Defence layers tested:** L3 (APOC trigger — Highlander check)
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied. A legitimate Resonator already exists with an `INSTANTIATES` relationship to a specific transformation definition Seed. Attacker creates a second Resonator pointing to the same definition.

**Attack Cypher:**
```cypher
MATCH (def:Seed {id: 'def:transformation:dampening-resonator'})
CREATE (r:Resonator {
  id: 'adversarial-duplicate-resonator-001',
  name: 'Second Instance',
  content: 'Duplicate of existing resonator',
  role: 'computation',
  status: 'active',
  _gov_instantiation_id: 'fake-uuid-33333333',
  _gov_provenance_epoch: '2025-07-15T00:00:00.000Z',
  _gov_contains_path: 'constitutional-bloom.M-5',
  _gov_schema_version: 6,
  _gov_write_token: 'v1:DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD='
})-[:INSTANTIATES]->(def)
```

**Expected failure mode:** If L3 trigger enforces Highlander (query for existing `INSTANTIATES` to same definition), the transaction rolls back. The token is also invalid (L4), providing a second rejection path.

**Regression significance:** This is t2 Bypass 3.

---

## 2. Partial-Property Tests

These tests attempt node creation with some but not all required properties, verifying that the constraint engine rejects incomplete writes even when the attacker knows part of the schema.

### Test Directory: `tests/graph/perimeter-partial-property.test.ts`

---

#### T-PP-01: Seed with domain properties but zero governance properties

**Attack vector:** V1 (subset of V2)
**Defence layers tested:** L2
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied.

**Attack Cypher:** (Same as T-INJ-01 — included here for systematic coverage)
```cypher
CREATE (s:Seed {
  id: 'adversarial-pp-01',
  content: 'Has domain props',
  seedType: 'test',
  status: 'active'
})
```

**Expected failure mode:** First `_gov_*` NOT NULL constraint violation.

---

#### T-PP-02: Seed with 4 of 5 governance properties — missing `_gov_write_token`

**Attack vector:** V2
**Defence layers tested:** L2 (specifically `seed_gov_write_token_required`)
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied.

**Attack Cypher:**
```cypher
CREATE (s:Seed {
  id: 'adversarial-pp-02',
  content: 'Almost complete',
  seedType: 'test',
  status: 'active',
  _gov_instantiation_id: 'fake-uuid',
  _gov_provenance_epoch: '2025-07-15T00:00:00.000Z',
  _gov_contains_path: 'fake.path',
  _gov_schema_version: 6
})
```

**Expected failure mode:** `seed_gov_write_token_required` constraint violation.

**Test design rationale:** The write token is likely the last property an attacker discovers (it requires understanding the HMAC scheme). This test verifies that omitting just the token — even when all other governance properties are present — still causes rejection.

---

#### T-PP-03: Seed with 4 of 5 governance properties — missing `_gov_instantiation_id`

**Attack vector:** V2
**Defence layers tested:** L2
**Environment:** Integration (live Neo4j)

**Attack Cypher:**
```cypher
CREATE (s:Seed {
  id: 'adversarial-pp-03',
  content: 'Missing instantiation id',
  seedType: 'test',
  status: 'active',
  _gov_provenance_epoch: '2025-07-15T00:00:00.000Z',
  _gov_contains_path: 'fake.path',
  _gov_schema_version: 6,
  _gov_write_token: 'v1:faketoken'
})
```

**Expected failure mode:** `seed_gov_instantiation_id_required` constraint violation.

---

#### T-PP-04: Seed with 4 of 5 governance properties — missing `_gov_provenance_epoch`

**Attack vector:** V2
**Defence layers tested:** L2
**Environment:** Integration (live Neo4j)

**Attack Cypher:**
```cypher
CREATE (s:Seed {
  id: 'adversarial-pp-04',
  content: 'Missing epoch',
  seedType: 'test',
  status: 'active',
  _gov_instantiation_id: 'fake-uuid',
  _gov_contains_path: 'fake.path',
  _gov_schema_version: 6,
  _gov_write_token: 'v1:faketoken'
})
```

**Expected failure mode:** `seed_gov_provenance_epoch_required` constraint violation.

---

#### T-PP-05: Seed with 4 of 5 governance properties — missing `_gov_contains_path`

**Attack vector:** V2
**Defence layers tested:** L2
**Environment:** Integration (live Neo4j)

**Attack Cypher:**
```cypher
CREATE (s:Seed {
  id: 'adversarial-pp-05',
  content: 'Missing contains path',
  seedType: 'test',
  status: 'active',
  _gov_instantiation_id: 'fake-uuid',
  _gov_provenance_epoch: '2025-07-15T00:00:00.000Z',
  _gov_schema_version: 6,
  _gov_write_token: 'v1:faketoken'
})
```

**Expected failure mode:** `seed_gov_contains_path_required` constraint violation.

---

#### T-PP-06: Seed with 4 of 5 governance properties — missing `_gov_schema_version`

**Attack vector:** V2
**Defence layers tested:** L2
**Environment:** Integration (live Neo4j)

**Attack Cypher:**
```cypher
CREATE (s:Seed {
  id: 'adversarial-pp-06',
  content: 'Missing schema version',
  seedType: 'test',
  status: 'active',
  _gov_instantiation_id: 'fake-uuid',
  _gov_provenance_epoch: '2025-07-15T00:00:00.000Z',
  _gov_contains_path: 'fake.path',
  _gov_write_token: 'v1:faketoken'
})
```

**Expected failure mode:** `seed_gov_schema_version_required` constraint violation.

---

#### T-PP-07: Resonator with id only — domain property gap verification

**Attack vector:** V2 (exploiting pre-R-63 gap)
**Defence layers tested:** L2 (domain property gap closure from t11 §1.2)
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied — Resonator now requires `name`, `content`, `role`, `status` NOT NULL.

**Attack Cypher:**
```cypher
CREATE (r:Resonator {
  id: 'adversarial-pp-07',
  name: 'Has name only'
})
```

**Expected failure mode:** Constraint violation on `resonator_content_required` or `resonator_role_required` or `resonator_status_required`.

---

#### T-PP-08: Property mutation — set required property to NULL

**Attack vector:** V11 (variant)
**Defence layers tested:** L2
**Environment:** Integration (live Neo4j)

**Precondition:** A legitimate governed Seed exists with id `'legitimate-seed-for-mutation'`.

**Attack Cypher:**
```cypher
MATCH (s:Seed {id: 'legitimate-seed-for-mutation'})
SET s._gov_write_token = NULL
```

**Expected failure mode:** `seed_gov_write_token_required` constraint violation. The NOT NULL constraint fires on `SET ... = NULL` just as it fires on creation without the property.

---

#### T-PP-09: Property mutation — set content to empty string

**Attack vector:** V11
**Defence layers tested:** L3 (APOC trigger — empty string guard)
**Environment:** Integration (live Neo4j)

**Precondition:** Legitimate Seed exists.

**Attack Cypher:**
```cypher
MATCH (s:Seed {id: 'legitimate-seed-for-mutation'})
SET s.content = ''
```

**Expected failure mode:** If L3 trigger includes property value validation (not just existence), transaction rolls back. If trigger only validates on node creation (not update), this attack succeeds — the test documents whether the trigger covers mutation events. **At minimum, the NOT NULL constraint does not catch empty strings (empty string ≠ null).** This is a known gap from t2 Bypass 4 and t4 §5.1.

**Architect review note:** This test may initially FAIL (pass-through) if the trigger does not cover mutations. The test documents the expected *target* behaviour. If it fails, it identifies a gap for future work on mutation-path enforcement.

---

## 3. Label-Grafting Tests

These tests attempt to add morpheme labels to existing unprotected nodes, bypassing creation-time enforcement.

### Test Directory: `tests/graph/perimeter-label-grafting.test.ts`

---

#### T-LG-01: Add Seed label to existing unlabeled node

**Attack vector:** V4
**Defence layers tested:** L1 (RBAC — SET LABEL denied), L2 (constraints fire on label addition), L3 (trigger fires on label change)
**Environment:** Integration (live Neo4j)

**Precondition:** An unprotected node exists with no morpheme label: `CREATE (n:TempNode {id: 'graft-target-01', data: 'innocent'})`. Schema v6 applied.

**Attack Cypher:**
```cypher
MATCH (n:TempNode {id: 'graft-target-01'})
SET n:Seed
```

**Expected failure mode:** Two possible rejection paths:

1. **L2 (constraints):** When the `Seed` label is added, all `IS NOT NULL` constraints for Seed become active on this node. The node lacks `content`, `seedType`, `status`, and all five `_gov_*` properties. Constraint violation fires.
2. **L1 (RBAC):** If the session uses `cs_reader` role, the `SET LABEL Seed` privilege is denied.

**Verification assertion:** Transaction throws. Node retains only the `TempNode` label — `Seed` label was not applied.

**Critical design question this test answers:** Do Neo4j property existence constraints evaluate when a label is *added* to an existing node, or only when a node is *created* with that label? **Answer (from Neo4j 5.x documentation): constraints are evaluated on any transaction that results in a node having the constrained label. Adding a label via SET triggers constraint evaluation.** This test confirms that behaviour.

---

#### T-LG-02: Add Bloom label to existing node that has some Bloom-like properties

**Attack vector:** V4 (sophisticated variant)
**Defence layers tested:** L2, L3
**Environment:** Integration (live Neo4j)

**Precondition:** A node exists with some Bloom-compatible properties but no governance properties: `CREATE (n:TempNode {id: 'graft-target-02', type: 'milestone', status: 'active'})`.

**Attack Cypher:**
```cypher
MATCH (n:TempNode {id: 'graft-target-02'})
SET n:Bloom
```

**Expected failure mode:** Node passes Bloom's domain property constraints (`type` NOT NULL, `status` NOT NULL) but fails on missing `_gov_*` properties. Constraint violation.

**Test design rationale:** This is the more dangerous variant — the attacker pre-stages a node with the right domain properties and then adds the morpheme label. The governance properties are the defensive gap closure.

---

#### T-LG-03: Add Seed label to node that already carries governance properties (cross-label transplant)

**Attack vector:** V4 (advanced)
**Defence layers tested:** L3 (trigger), L4 (crypto — token binds to label)
**Environment:** Integration (live Neo4j)

**Precondition:** A legitimate Bloom exists with valid governance properties (including a valid `_gov_write_token` computed against `label = "Bloom"`). Attacker adds `Seed` label to this Bloom.

**Attack Cypher:**
```cypher
MATCH (b:Bloom {id: 'legitimate-bloom-for-crosslabel'})
SET b:Seed
```

**Expected failure mode:** The node now carries both `Bloom` and `Seed` labels. The L3 trigger (if it fires on label addition) should detect that the node's `_gov_write_token` was computed with `label = "Bloom"` but the node now also has `label = "Seed"`. The HMAC verification for the Seed label fails because the canonical input includes the label.

Additionally, the node may lack Seed-specific domain properties (`content`, `seedType` — these are NOT NULL on Seed). Constraint violation provides a second rejection path.

**Architect review note:** Whether the APOC trigger fires on `SET LABEL` events (not just node creation) depends on the trigger's `$assignedLabels` support. This test verifies that architectural assumption. If the trigger does not cover label assignment, L2 constraints are the sole defence layer for this vector.

---

#### T-LG-04: Remove Seed label and re-add to same node (label cycling attack)

**Attack vector:** V4 (evasion variant)
**Defence layers tested:** L1 (RBAC — REMOVE LABEL denied), L3
**Environment:** Integration (live Neo4j)

**Precondition:** Legitimate Seed exists. Attacker removes the Seed label (making the node unconstrained), modifies properties, then re-adds the label.

**Attack Cypher:**
```cypher
MATCH (s:Seed {id: 'legitimate-seed-for-cycling'})
REMOVE s:Seed
SET s._gov_write_token = 'v1:tampered-token'
SET s:Seed
```

**Expected failure mode:**
1. **L1:** `REMOVE LABEL Seed` denied for non-governed roles.
2. **L3:** When `Seed` is re-added, trigger evaluates the node. The tampered token fails HMAC verification.

**Test design rationale:** This tests whether the perimeter survives *modification* attacks, not just *creation* attacks. The label cycling pattern attempts to temporarily exit the constrained namespace to perform unmonitored modifications.

---

## 4. RBAC Bypass Tests

These tests verify that Neo4j Enterprise RBAC correctly denies morpheme writes to non-governed roles. **These tests require Neo4j Enterprise Edition.** On Community Edition, these tests should be skipped with a clear annotation that L1 is absent and L2-L4 carry the full load.

### Test Directory: `tests/safety/perimeter-rbac.test.ts`

---

#### T-RBAC-01: CREATE Seed from `cs_reader` role

**Attack vector:** V5
**Defence layers tested:** L1 (RBAC)
**Environment:** Adversarial (live Neo4j Enterprise, `cs_reader` session)

**Precondition:** User `test_reader` is assigned only `cs_reader` role. Schema v6 applied. RBAC privileges from t10 §2.2 applied.

**Attack Cypher (executed as `test_reader`):**
```cypher
CREATE (s:Seed {
  id: 'rbac-bypass-attempt-01',
  content: 'Should be denied',
  seedType: 'test',
  status: 'active',
  _gov_instantiation_id: 'any-value',
  _gov_provenance_epoch: '2025-07-15T00:00:00.000Z',
  _gov_contains_path: 'any.path',
  _gov_schema_version: 6,
  _gov_write_token: 'v1:any-value'
})
```

**Expected failure mode:** `Neo.ClientError.Security.Forbidden` — privilege denied for CREATE on Seed label. The query fails at *planning time*, before any constraint or trigger evaluation.

**Verification assertion:** Error type is security/privilege error, not constraint error. The rejection happens at the RBAC layer, not the constraint layer.

---

#### T-RBAC-02: SET LABEL Seed from `cs_reader` role

**Attack vector:** V4 + V5
**Defence layers tested:** L1
**Environment:** Adversarial (live Neo4j Enterprise, `cs_reader` session)

**Attack Cypher (executed as `test_reader`):**
```cypher
MATCH (n:TempNode {id: 'rbac-graft-target'})
SET n:Seed
```

**Expected failure mode:** `Neo.ClientError.Security.Forbidden` — `SET LABEL Seed` denied for `cs_reader`.

---

#### T-RBAC-03: SET PROPERTY on morpheme node from `cs_reader` role

**Attack vector:** V5 + V11
**Defence layers tested:** L1
**Environment:** Adversarial (live Neo4j Enterprise, `cs_reader` session)

**Attack Cypher (executed as `test_reader`):**
```cypher
MATCH (s:Seed {id: 'legitimate-seed-001'})
SET s.content = 'Tampered content'
```

**Expected failure mode:** `Neo.ClientError.Security.Forbidden` — `SET PROPERTY` on Seed label denied for `cs_reader`.

---

#### T-RBAC-04: CREATE CONTAINS relationship from `cs_reader` role

**Attack vector:** V5 + V12
**Defence layers tested:** L1
**Environment:** Adversarial (live Neo4j Enterprise, `cs_reader` session)

**Attack Cypher (executed as `test_reader`):**
```cypher
MATCH (a {id: 'node-a'}), (b {id: 'node-b'})
CREATE (a)-[:CONTAINS]->(b)
```

**Expected failure mode:** `Neo.ClientError.Security.Forbidden` — `CREATE` on `CONTAINS` relationship type denied for `cs_reader`.

---

#### T-RBAC-05: `cs_pipeline_executor` cannot CREATE morpheme nodes

**Attack vector:** V5 (privilege escalation from operational to governance)
**Defence layers tested:** L1
**Environment:** Adversarial (live Neo4j Enterprise, `cs_pipeline_executor` session)

**Precondition:** User `test_pipeline` is assigned `cs_pipeline_executor` role. This role can create `PipelineRun` and `TaskOutput` but NOT morpheme-labeled nodes.

**Attack Cypher (executed as `test_pipeline`):**
```cypher
CREATE (s:Seed {
  id: 'pipeline-escalation-attempt-01',
  content: 'Pipeline executor trying to create Seed',
  seedType: 'observation',
  status: 'active',
  _gov_instantiation_id: 'any',
  _gov_provenance_epoch: '2025-07-15T00:00:00.000Z',
  _gov_contains_path: 'any',
  _gov_schema_version: 6,
  _gov_write_token: 'v1:any'
})
```

**Expected failure mode:** `Neo.ClientError.Security.Forbidden`. The `cs_pipeline_executor` role has `DENY CREATE` on morpheme labels.

---

#### T-RBAC-06: `cs_pipeline_executor` CAN create PipelineRun (positive control)

**Attack vector:** N/A — positive control test
**Defence layers tested:** L1 (confirms non-morpheme writes still work)
**Environment:** Adversarial (live Neo4j Enterprise, `cs_pipeline_executor` session)

**Cypher:**
```cypher
CREATE (p:PipelineRun {
  id: 'pipeline-run-positive-control',
  status: 'running',
  startTime: datetime()
})
```

**Expected result:** Transaction commits successfully. This positive control confirms that RBAC does not over-restrict — the `cs_pipeline_executor` role can perform its legitimate function.

**Test design rationale:** Without positive controls, we cannot distinguish "RBAC is correctly configured" from "RBAC is broken and denies everything."

---

## 5. Token Forgery Tests

These tests verify that the cryptographic write token (L4) rejects invalid, forged, replayed, and mis-versioned tokens at the L3 trigger layer.

### Test Directory: `tests/graph/perimeter-token-forgery.test.ts` (integration) and `tests/safety/perimeter-token-verification.test.ts` (unit)

---

### 5.1 Unit Tests (No Neo4j Required)

These test the token generation and verification logic in isolation.

#### Test Directory: `tests/safety/perimeter-token-verification.test.ts`

---

#### T-TF-UNIT-01: Valid token verifies successfully

**Environment:** Unit

**Precondition:** Known test secret key, known canonical input components.

**Test logic:** Generate a token using the production `computeWriteToken()` function with test inputs. Verify using `verifyWriteToken()` with the same inputs and key. Expect: verification returns `true`.

---

#### T-TF-UNIT-02: Token with wrong node_id fails verification

**Environment:** Unit

**Test logic:** Generate token for `node_id = "seed-001"`. Attempt verification with `node_id = "seed-002"`, all other inputs identical. Expect: verification returns `false`.

---

#### T-TF-UNIT-03: Token with wrong label fails verification

**Environment:** Unit

**Test logic:** Generate token for `label = "Seed"`. Attempt verification with `label = "Bloom"`, all other inputs identical. Expect: verification returns `false`.

**Significance:** Prevents the cross-label transplant attack (T-LG-03).

---

#### T-TF-UNIT-04: Token with wrong instantiation_id fails verification

**Environment:** Unit

**Test logic:** Generate token for `instantiation_id = "uuid-aaa"`. Verify with `instantiation_id = "uuid-bbb"`. Expect: `false`.

---

#### T-TF-UNIT-05: Token with wrong epoch fails verification

**Environment:** Unit

**Test logic:** Generate token for `epoch = "2025-07-15T10:00:00.000Z"`. Verify with `epoch = "2025-07-15T10:00:01.000Z"` (1 second difference). Expect: `false`.

**Significance:** Ensures millisecond-precision temporal binding. Prevents pre-computation attacks.

---

#### T-TF-UNIT-06: Token with wrong schema_version fails verification

**Environment:** Unit

**Test logic:** Generate token for `schema_version = 6`. Verify with `schema_version = 5`. Expect: `false`.

---

#### T-TF-UNIT-07: Token with wrong key fails verification

**Environment:** Unit

**Test logic:** Generate token with `key_A`. Verify with `key_B`. Expect: `false`.

---

#### T-TF-UNIT-08: Canonical input delimiter injection

**Environment:** Unit

**Test logic:** Create a node_id containing the pipe delimiter: `node_id = "seed|Bloom|fake"`. Verify that the canonical input construction properly escapes or rejects this input, preventing concatenation ambiguity where `"seed|Bloom|fake" + "|" + "Seed"` could parse as `"seed" + "|" + "Bloom" + "|" + "fakeSeed"`.

**Expected result:** Either the token generation rejects the malformed node_id, or the escaping ensures the two canonical inputs are distinct and produce different HMACs.

---

#### T-TF-UNIT-09: Empty string token rejected

**Environment:** Unit

**Test logic:** Call `verifyWriteToken("")` with any inputs. Expect: `false` (or throws).

---

#### T-TF-UNIT-10: Token without version prefix rejected

**Environment:** Unit

**Test logic:** Call `verifyWriteToken("K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=")` (no `v1:` prefix). Expect: `false`.

---

### 5.2 Integration Tests (Live Neo4j)

These verify that the L3 trigger correctly rejects invalid tokens at the database layer.

#### Test Directory: `tests/graph/perimeter-token-forgery.test.ts`

---

#### T-TF-INT-01: Node with completely fabricated token — random base64

**Attack vector:** V3
**Defence layers tested:** L3 (trigger HMAC verification), L4
**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied. APOC triggers active. Attacker supplies all governance properties and wires INSTANTIATES + CONTAINS, but the token is random base64.

**Attack Cypher:**
```cypher
MATCH (def:Seed {id: 'def:morpheme:seed'})
MATCH (parent:Bloom {id: 'legitimate-bloom-001'})
CREATE (parent)-[:CONTAINS]->(s:Seed {
  id: 'adversarial-fake-token-001',
  name: 'Fake Token Seed',
  content: 'Everything correct except the token',
  seedType: 'observation',
  status: 'active',
  _gov_instantiation_id: '550e8400-e29b-41d4-a716-446655440000',
  _gov_provenance_epoch: '2025-07-15T10:30:00.000Z',
  _gov_contains_path: 'legitimate-bloom-001',
  _gov_schema_version: 6,
  _gov_write_token: 'v1:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
})-[:INSTANTIATES]->(def)
```

**Expected failure mode:** L3 trigger verifies `_gov_write_token` by recomputing HMAC from node properties and comparing. HMAC mismatch. Transaction rolls back with `"R-63 GOVERNANCE VIOLATION: Invalid write token"`.

**Critical significance:** This is the **apex test** of the entire perimeter architecture. This attack passes L2 (all properties present), creates INSTANTIATES and CONTAINS wiring (passes L3 structural checks), but fails L4 cryptographic verification (executed by L3 trigger). If this test passes, the perimeter's cryptographic layer is functional.

---

#### T-TF-INT-02: Token replayed from legitimate node to new node

**Attack vector:** V13
**Defence layers tested:** L3, L4
**Environment:** Integration (live Neo4j)

**Precondition:** A legitimate governed Seed exists with id `'legitimate-seed-with-real-token'` and a valid `_gov_write_token`. Attacker reads the token value and uses it on a new node.

**Attack Cypher:**
```cypher
// First, read the legitimate token
MATCH (legit:Seed {id: 'legitimate-seed-with-real-token'})
WITH legit._gov_write_token AS stolen_token,
     legit._gov_instantiation_id AS stolen_inst_id,
     legit._gov_provenance_epoch AS stolen_epoch,
     legit._gov_contains_path AS stolen_path,
     legit._gov_schema_version AS stolen_version

MATCH (def:Seed {id: 'def:morpheme:seed'})
MATCH (parent:Bloom {id: 'legitimate-bloom-001'})
CREATE (parent)-[:CONTAINS]->(s:Seed {
  id: 'adversarial-replay-001',
  name: 'Replay Attack Seed',
  content: 'Uses stolen token',
  seedType: 'observation',
  status: 'active',
  _gov_instantiation_id: stolen_inst_id,
  _gov_provenance_epoch: stolen_epoch,
  _gov_contains_path: stolen_path,
  _gov_schema_version: stolen_version,
  _gov_write_token: stolen_token
})-[:INSTANTIATES]->(def)
```

**Expected failure mode:** The HMAC canonical input includes `node_id`. The token was computed for `node_id = 'legitimate-seed-with-real-token'` but is now applied to `node_id = 'adversarial-replay-001'`. HMAC mismatch. Transaction rolls back.

**Secondary failure mode:** If the `_gov_instantiation_id` has a uniqueness constraint (see t11), the duplicated instantiation_id causes a uniqueness violation before the trigger even fires.

---

#### T-TF-INT-03: Token with wrong key version prefix

**Attack vector:** V14
**Defence layers tested:** L3, L4
**Environment:** Integration (live Neo4j)

**Attack Cypher:** (Same full governance setup as T-TF-INT-01 but token has nonexistent version)
```cypher
// ... full node creation with all governance properties ...
  _gov_write_token: 'v99:K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols='
// ...
```

**Expected failure mode:** L3 trigger parses version prefix `v99`, finds no corresponding key in the key registry, rejects the token. Transaction rolls back.

---

#### T-TF-INT-04: Token with valid HMAC from rotated-out (revoked) key

**Attack vector:** V6 (post-compromise key use)
**Defence layers tested:** L3, L4
**Environment:** Integration (live Neo4j)

**Precondition:** Key version `v1` was previously valid but has been revoked (marked verification-only or fully invalidated per t5 §2.4 rotation policy).

**Attack Cypher:** Node creation with token computed using the revoked key, prefixed `v1:`.

**Expected failure mode:** L3 trigger recognizes `v1` as revoked. Token rejected. Transaction rolls back.

**Architect review note:** This test's behaviour depends on the key rotation policy. If revoked keys remain "verification-only" (can verify existing nodes but cannot authorize new nodes), the trigger must distinguish "verify existing" from "authorize new creation." This is a design decision documented in t5 §2.4 that the test exposes.

---

## 6. Provenance Chain Integrity Tests

**Note on scope:** The t10 architecture *rejected* hash chains (Option C) as a standalone enforcement mechanism. However, the `_gov_instantiation_id` and `_gov_provenance_epoch` properties form a **lightweight provenance record** — not a hash chain, but a set of properties that link each node to its governance transaction. These tests verify that this provenance linkage is structurally sound.

### Test Directory: `tests/conformance/perimeter-provenance.test.ts`

---

#### T-PROV-01: Every governed node has a unique `_gov_instantiation_id`

**Environment:** Integration (live Neo4j)

**Precondition:** Multiple governed nodes created through the legitimate governance path.

**Verification query:**
```cypher
MATCH (n)
WHERE (n:Seed OR n:Bloom OR n:Resonator OR n:Grid OR n:Helix)
  AND n._gov_instantiation_id IS NOT NULL
WITH n._gov_instantiation_id AS inst_id, count(*) AS cnt
WHERE cnt > 1
RETURN inst_id, cnt
```

**Expected result:** Zero rows. If `_gov_instantiation_id` has a per-label uniqueness constraint (from t11), the database enforces this. If uniqueness is cross-label (a single instantiation id should never appear on two different nodes regardless of label), this test validates the application-layer guarantee.

---

#### T-PROV-02: Every governed node's `_gov_contains_path` traces to an existing ancestor

**Environment:** Integration (live Neo4j)

**Precondition:** Governed nodes exist with valid `_gov_contains_path` values.

**Verification logic:** For each governed node, parse `_gov_contains_path` (dot-delimited) and verify that each segment corresponds to a real node in the containment hierarchy. Example: if `_gov_contains_path = "constitutional-bloom.M-9.M-9.7"`, verify that nodes with ids matching `constitutional-bloom`, `M-9`, and `M-9.7` exist and form a valid CONTAINS chain.

**Expected result:** All paths resolve. Any orphaned path segment indicates a governance bug (not necessarily an adversarial injection, but a provenance integrity failure).

**Test type:** This is a conformance test, not an enforcement test. It validates that the governance layer produces structurally sound provenance, not that injected nodes are rejected.

---

#### T-PROV-03: Injected node cannot reference a valid `_gov_instantiation_id` from another node

**Environment:** Integration (live Neo4j)

**Precondition:** Legitimate node exists with known `_gov_instantiation_id`.

**Attack scenario:** Attacker creates a node with a copied `_gov_instantiation_id`.

**Expected failure mode:** If uniqueness constraint exists on `_gov_instantiation_id`, the CREATE fails with a uniqueness violation. If no uniqueness constraint, the HMAC verification still fails (the canonical input includes the node_id, so the token is bound to the original node, not the copy). This test validates the layered defence.

---

## 7. Composed Defence Layer Tests

These tests verify that the defence layers work correctly in composition — specifically testing scenarios where one layer alone would be insufficient.

### Test Directory: `tests/safety/perimeter-composed.test.ts`

---

#### T-COMP-01: Attack that passes L2 but fails at L3 — full properties, no wiring

**Attack vector:** V7 + V8 (combined)
**Layers:** L2 passes (all properties present), L3 rejects (no INSTANTIATES or CONTAINS)
**Environment:** Integration (live Neo4j)

**This is a superset of T-INJ-06. The specific assertion is:**

1. Confirm that no constraint violation fires (L2 satisfied).
2. Confirm that the L3 trigger fires and rejects.
3. Confirm the error message references the trigger, not a constraint.

**Test design rationale:** Proves that L3 provides enforcement beyond L2's capability. If L3 were removed, this attack would succeed.

---

#### T-COMP-02: Attack that passes L2 and L3-structural but fails at L4 — full properties, wiring present, bad token

**Attack vector:** V3
**Layers:** L2 passes, L3 structural checks pass (INSTANTIATES + CONTAINS present), L4 rejects (invalid HMAC)
**Environment:** Integration (live Neo4j)

**This is T-TF-INT-01 with the explicit layer decomposition assertion:**

1. Confirm all NOT NULL constraints satisfied.
2. Confirm INSTANTIATES and CONTAINS relationships present.
3. Confirm the rejection comes from HMAC verification within the trigger, not from structural checks.
4. Confirm the error message references "write token" specifically.

**Test design rationale:** Proves that L4 provides enforcement beyond L2+L3-structural. If the HMAC verification were removed from the trigger, this attack would succeed.

---

#### T-COMP-03: Community Edition degraded mode — L2+L3+L4 without L1

**Attack vector:** V1 (full attack from an unrestricted session)
**Layers:** L1 absent (Community Edition), L2+L3+L4 must carry full load
**Environment:** Integration (live Neo4j Community)

**Precondition:** No RBAC roles configured (Community Edition). Single unrestricted database user. Schema v6 applied. APOC triggers active.

**Attack Cypher:** Same as T-INJ-01.

**Expected failure mode:** L2 constraint violation. L1 is absent, but L2 catches the attack.

**Second attack (same test):** Same as T-INJ-06 (passes L2, hits L3).

**Third attack (same test):** Same as T-TF-INT-01 (passes L2, passes L3-structural, hits L4).

**Test design rationale:** Validates the t10 §8.1 degraded-mode claim that "on Community Edition, Layers 2–4 carry the full enforcement load." Each sub-attack within this test targets the next layer in the composition.

---

#### T-COMP-04: L3 trigger disabled — L2 holds, but L4 becomes unverified

**Attack vector:** V7 (no INSTANTIATES wiring)
**Layers:** L3 disabled (simulating APOC plugin failure or trigger removal), L2 active
**Environment:** Integration (live Neo4j, trigger deliberately removed)

**Precondition:** Remove APOC triggers: `CALL apoc.trigger.remove('gov_enforce_instantiates')` etc. Schema v6 constraints remain.

**Attack Cypher:** Same as T-INJ-06 (all governance properties, no wiring, fake token).

**Expected result:** Transaction **commits** (this is a known-failure test). The node exists in the graph with a fake token and no wiring.

**Verification assertion:** The test PASSES by asserting that the node exists — confirming that without L3, the perimeter is degraded. **This test is annotated as a degraded-mode characterization test, not a defence-success test.** Its purpose is to document the consequence of L3 failure and to serve as a canary: if this test ever starts *failing* (i.e., the node is rejected even without triggers), it means another layer has been added that the test strategy doesn't account for.

---

#### T-COMP-05: Governed write succeeds through all layers (positive control)

**Attack vector:** N/A — legitimate governance write
**Layers:** All four
**Environment:** Integration (live Neo4j)

**Precondition:** Governance layer operational. Valid secret key available. Constitutional Bloom and definition Seeds exist.

**Test logic:** Execute a legitimate `instantiateMorpheme()` call through the application layer. Verify:

1. Transaction commits successfully.
2. Node exists in the graph with all governance properties.
3. INSTANTIATES relationship exists.
4. CONTAINS relationship exists.
5. `_gov_write_token` verifies correctly.

**Test design rationale:** Without positive controls, we cannot distinguish "the perimeter correctly rejects adversarial writes" from "the perimeter rejects all writes." This test is the most important test in the suite — if it fails, the perimeter is not just secure, it is broken.

---

## 8. Regression Test for Original Vulnerability

### Test Directory: `tests/graph/perimeter-regression-r63.test.ts`

---

#### T-REG-01: The original ungoverned node injection (R-63 opening statement)

**This is the single test that directly instantiates the vulnerability described in R-63:**

> "Anyone with Neo4j write access can inject morpheme-labeled nodes via raw Cypher, bypassing all three enforcement layers."

**Environment:** Integration (live Neo4j)

**Precondition:** Schema v6 applied. All perimeter layers active.

**Attack Cypher (all five morpheme labels, one transaction):**
```cypher
CREATE (s:Seed {id: 'r63-regression-seed', content: 'injected', seedType: 'test', status: 'active'})
CREATE (b:Bloom {id: 'r63-regression-bloom', type: 'injected', status: 'active'})
CREATE (r:Resonator {id: 'r63-regression-resonator'})
CREATE (g:Grid {id: 'r63-regression-grid'})
CREATE (h:Helix {id: 'r63-regression-helix'})
```

**Expected failure mode:** Transaction rolls back. **All five** creation statements fail. No morpheme node from this transaction exists in the committed graph.

**Verification assertions:**
1. Transaction throws (constraint or trigger error).
2. `MATCH (n) WHERE n.id STARTS WITH 'r63-regression-' RETURN count(n)` returns 0.
3. The error is a structural rejection (constraint violation or trigger rollback), not a timeout, not a syntax error, not a driver error.

**Regression significance:** If this test ever passes (the five nodes are committed), the R-63 perimeter is broken. This is the CI gate. It should be in the critical path of every PR merge check.

---

## 9. Test Directory Mapping

| Test File | Directory | Test IDs | Environment | Layer Coverage |
|---|---|---|---|---|
| `perimeter-injection.test.ts` | `tests/graph/` | T-INJ-01 through T-INJ-10 | Integration | L2, L3, L4 |
| `perimeter-partial-property.test.ts` | `tests/graph/` | T-PP-01 through T-PP-09 | Integration | L2, L3 |
| `perimeter-label-grafting.test.ts` | `tests/graph/` | T-LG-01 through T-LG-04 | Integration | L1, L2, L3, L4 |
| `perimeter-rbac.test.ts` | `tests/safety/` | T-RBAC-01 through T-RBAC-06 | Adversarial (Enterprise) | L1 |
| `perimeter-token-verification.test.ts` | `tests/safety/` | T-TF-UNIT-01 through T-TF-UNIT-10 | Unit (no Neo4j) | L4 |
| `perimeter-token-forgery.test.ts` | `tests/graph/` | T-TF-INT-01 through T-TF-INT-04 | Integration | L3, L4 |
| `perimeter-provenance.test.ts` | `tests/conformance/` | T-PROV-01 through T-PROV-03 | Integration | Provenance integrity |
| `perimeter-composed.test.ts` | `tests/safety/` | T-COMP-01 through T-COMP-05 | Integration | Multi-layer |
| `perimeter-regression-r63.test.ts` | `tests/graph/` | T-REG-01 | Integration | All layers |

### Mapping Rationale

- **`tests/graph/`**: Tests that verify database-layer behaviour — constraints, triggers, node creation/rejection. Follows the pattern established by `morpheme-enforcement.test.ts`.
- **`tests/safety/`**: Tests that verify safety invariants that must never be violated — RBAC privilege denial, cryptographic token integrity, composed defence guarantees. Follows the pattern established by `algedonic-bypass.test.ts`.
- **`tests/conformance/`**: Tests that verify cross-component consistency — provenance path integrity, governance property coherence across nodes. Follows the pattern established by `cross-task-injection.test.ts`.

---

## 10. Test Infrastructure Requirements

### 10.1 Neo4j Test Container Configuration

Integration tests require a Neo4j instance with:

| Requirement | Configuration | Rationale |
|---|---|---|
| Neo4j 5.x | `neo4j:5.x-community` or `neo4j:5.x-enterprise` Docker image | Match production version |
| APOC plugin | Mount `apoc-5.x-core.jar` + `apoc-5.x-extended.jar` into `/plugins/` | L3 trigger support |
| APOC trigger enabled | `NEO4J_apoc_trigger_enabled=true` in container env | Required for `apoc.trigger.add()` |
| Schema v6 applied | Run migration DDL before tests | Constraints must be active |
| Triggers registered | Run trigger registration DDL before tests | L3 must be active |
| Test secret key | Known constant key for test environment (NOT production key) | L4 token generation/verification |
| Fresh database per suite | Drop and recreate database between test suites | Prevent cross-test contamination |

### 10.2 Enterprise-Only Test Gating

RBAC tests (T-RBAC-*) require Enterprise Edition. These should be:

1. **Annotated with `describe.skipIf(!isEnterprise)`** — auto-skip on Community.
2. **Clearly documented** as L1-only tests that do not affect L2-L4 coverage.
3. **Run in CI** if an Enterprise license is available, otherwise marked as manual verification.

### 10.3 Test Data Fixtures

Each test suite requires a known graph state. Fixtures should create:

| Fixture | Contents | Used By |
|---|---|---|
| `constitutional-bloom-fixture` | Constitutional Bloom with definition Seeds (`def:morpheme:seed`, `def:morpheme:bloom`, etc.) | T-INJ-06, T-INJ-07, T-INJ-08, T-INJ-10, T-TF-INT-* |
| `legitimate-nodes-fixture` | 2-3 governed Seeds and Blooms with valid governance properties and wiring | T-PP-08, T-PP-09, T-LG-03, T-LG-04, T-TF-INT-02, T-PROV-* |
| `unprotected-nodes-fixture` | TempNode instances without morpheme labels | T-LG-01, T-LG-02, T-RBAC-02 |
| `governed-write-fixture` | A known-good governance write result for positive control | T-COMP-05 |

Fixtures must be created using **direct Cypher with governance credentials** (bypassing the application layer in a controlled way) or via the legitimate `instantiateMorpheme()` path. The fixture creation itself must not be blocked by the perimeter — this requires the test harness to use the `cs_governed_writer` role or to apply fixtures before triggers are registered and then register triggers before adversarial tests run.

**Recommended fixture application order:**
1. Apply schema v6 constraints.
2. Create fixture data (using governed credentials — constraints are satisfied, triggers not yet active).
3. Register APOC triggers.
4. Run adversarial tests.

This ordering avoids the chicken-and-egg problem of needing governed data in a database that rejects all writes without governance.

---

## 11. Test Counting Summary

| Category | Test Count | Unit Tests | Integration Tests | Enterprise-Only |
|---|---|---|---|---|
| Injection | 10 | 0 | 10 | 0 |
| Partial-property | 9 | 0 | 9 | 0 |
| Label-grafting | 4 | 0 | 4 | 0 |
| RBAC bypass | 6 | 0 | 0 | 6 |
| Token forgery (unit) | 10 | 10 | 0 | 0 |
| Token forgery (integration) | 4 | 0 | 4 | 0 |
| Provenance | 3 | 0 | 3 | 0 |
| Composed layers | 5 | 0 | 5 | 0 |
| Regression | 1 | 0 | 1 | 0 |
| **Total** | **52** | **10** | **36** | **6** |

**Attack vectors from t1 covered:** V1–V15 (all 15).
**Defence layers tested:** L1 (6 tests), L2 (23 tests), L3 (25 tests), L4 (19 tests).
**Composed-layer tests:** 5 (including degraded-mode characterization and positive control).

---

## 12. Open Questions for Architect Review

1. **Trigger coverage on SET LABEL events:** Tests T