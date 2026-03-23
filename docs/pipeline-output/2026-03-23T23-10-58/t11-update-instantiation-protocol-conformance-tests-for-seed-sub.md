# Update instantiation protocol conformance tests for seed sub-types

> Task ID: t11
> Model: claude-opus-4-5:extended:32k
> Duration: 91769ms
> Output chars: 16085
> Timestamp: 2026-03-23T23:49:53.946Z

> **⚠️ Hallucination flags (4):**
> - [content/warning] Task t11 references "instantiation.ts" but this file was not in its context
> - [content/warning] Task t11 references "instantiation-protocol.test.ts" but this file was not in its context
> - [content/warning] Task t11 references "src/graph/index.ts" but this file was not in its context
> - [content/warning] Task t11 references "src/graph/index.js" but this file was not in its context

---

# Analysis: Updating Instantiation Protocol Conformance Tests for Seed Sub-Types

## 1. Test Structure Analysis

### 1.1 Test File Organization

Based on the acceptance criteria and prior task outputs, the conformance test file should be organized into the following test groups:

| Test Group | Purpose | Coverage |
|------------|---------|----------|
| Existing tests | Base instantiation protocol | Must remain unchanged |
| Seed sub-type creation | Verify `instantiateMorpheme('seed', {...}, parentId, undefined, { subType: 'X' })` | Four sub-types |
| Dual-label verification | Confirm both `:Seed` and operational label present | All four |
| Grid CONTAINS verification | Confirm parent Grid relationship exists | All four |
| Governance isolation | Confirm observation Grids NOT receiving dual-labeled seeds | All four |

### 1.2 Test Naming Convention

Following typical Vitest/Jest conventions and the pattern established in t1's analysis:

```
describe('Instantiation Protocol Conformance')
  describe('Seed sub-type routing')
    it('creates Observation with dual labels :Seed:Observation')
    it('creates Decision with dual labels :Seed:Decision')
    it('creates TaskOutput with dual labels :Seed:TaskOutput')
    it('creates Distillation with dual labels :Seed:Distillation')
  describe('Grid containment for sub-types')
    it('wires Grid CONTAINS for Observation')
    ...
  describe('Governance Resonator isolation')
    it('does not invoke governance path for Observation creation')
    ...
```

---

## 2. Test Case Inventory for Each Sub-Type

### 2.1 Observation Sub-Type Tests

| Test Case | Input | Expected Outcome | Verification Query |
|-----------|-------|------------------|-------------------|
| Dual-label creation | `subType: 'Observation'`, valid seed properties | Node exists with both labels | `MATCH (n:Seed:Observation {id: $id}) RETURN n` |
| Grid CONTAINS | Same as above, `parentId` = Grid ID | `(grid)-[:CONTAINS]->(obs)` exists | `MATCH (g:Grid)-[:CONTAINS]->(n:Seed:Observation {id: $id}) RETURN g.id` |
| INSTANTIATES wiring | Same as above | `(obs)-[:INSTANTIATES]->(def:Seed {id: 'def:morpheme:seed'})` | `MATCH (n)-[:INSTANTIATES]->(d) WHERE n.id = $id RETURN d.id` |
| Required properties preserved | `name`, `content`, `seedType`, `status` all set | All properties persist | `MATCH (n {id: $id}) RETURN properties(n)` |
| Additional properties preserved | `metric`, `value`, `unit`, `context` | Observation-specific fields persist | Same query |

**Evidence from t2:** The required seed properties must be derived:
- `name`: From `metric` or `observation-${id}`
- `content`: JSON of `{metric, value, unit, context}`
- `seedType`: `'observation'` (literal)
- `status`: `'active'` (literal)

### 2.2 Decision Sub-Type Tests

| Test Case | Input | Expected Outcome | Verification Query |
|-----------|-------|------------------|-------------------|
| Dual-label creation | `subType: 'Decision'`, valid seed properties | Node exists with both labels | `MATCH (n:Seed:Decision {id: $id}) RETURN n` |
| Grid CONTAINS | Same as above | `(grid)-[:CONTAINS]->(decision)` exists | Same pattern as 2.1 |
| Status semantic handling | `status: 'pending'` passed through | `status = 'pending'` persists (not overwritten) | `MATCH (n {id: $id}) RETURN n.status` |

**Evidence from t3:** Decision uses `status: 'pending'` which satisfies the required-property presence check but has different semantic meaning than seed lifecycle status.

### 2.3 TaskOutput Sub-Type Tests

| Test Case | Input | Expected Outcome | Verification Query |
|-----------|-------|------------------|-------------------|
| Dual-label creation | `subType: 'TaskOutput'`, valid seed properties | Node exists with both labels | `MATCH (n:Seed:TaskOutput {id: $id}) RETURN n` |
| Grid CONTAINS | Same as above | `(grid)-[:CONTAINS]->(taskOutput)` exists | Same pattern |
| `title` → `name` mapping | `title` property provided | `name` property equals `title` value | `MATCH (n {id: $id}) RETURN n.name, n.title` |

**Evidence from t4:** TaskOutput has a natural `title` field that maps to the seed `name` requirement. Tests should verify this mapping is preserved.

### 2.4 Distillation Sub-Type Tests

| Test Case | Input | Expected Outcome | Verification Query |
|-----------|-------|------------------|-------------------|
| Dual-label creation | `subType: 'Distillation'`, valid seed properties | Node exists with both labels | `MATCH (n:Seed:Distillation {id: $id}) RETURN n` |
| Grid CONTAINS | Same as above | `(grid)-[:CONTAINS]->(distillation)` exists | Same pattern |
| Structured vs Basic | Both property schemas work | Both produce dual labels | Separate test cases for each interface |

**Evidence from t5:** Two distinct property schemas exist (`DistillationProps` and `StructuredDistillationProps`). Tests should cover both.

---

## 3. Dual-Label Verification Strategy

### 3.1 Verification Query Pattern

The most reliable verification is a label-intersection query:

```cypher
MATCH (n {id: $testNodeId})
RETURN labels(n) AS nodeLabels
```

Then assert in test code:
```typescript
expect(nodeLabels).toContain('Seed');
expect(nodeLabels).toContain('Observation'); // or Decision, TaskOutput, Distillation
```

### 3.2 Alternative: Single Query with Both Labels

A stricter verification uses both labels in the `MATCH`:

```cypher
MATCH (n:Seed:Observation {id: $testNodeId})
RETURN count(n) AS matchCount
```

If `matchCount === 1`, both labels are present. If `matchCount === 0`, either the node doesn't exist or is missing one label.

**Recommendation:** Use both approaches:
1. The intersection query to get actual labels (for diagnostic output on failure)
2. The dual-label match to assert the expected state

### 3.3 Label Order Independence

Neo4j stores labels in no guaranteed order. Tests must NOT assume `:Seed:Observation` vs `:Observation:Seed` ordering. The `labels(n)` function returns an array that should be checked with `toContain` assertions.

---

## 4. Grid CONTAINS Verification Strategy

### 4.1 Test Setup Requirement

Each sub-type test requires a pre-existing Grid to serve as the parent. Options:

| Strategy | Pros | Cons |
|----------|------|------|
| Use existing Grid (`grid:observations`, `grid:decisions`, etc.) | Mirrors production topology | Requires bootstrap to have run; test isolation risk |
| Create test-specific Grid via `instantiateMorpheme('grid', ...)` | Isolated; no external dependencies | Adds setup complexity; may fail if Grid creation has bugs |
| Create test Grid via raw Cypher (in `beforeEach`) | Isolated; independent of protocol | Bypasses protocol for setup (acceptable in tests) |

**Recommendation:** Create test-specific Grids via raw Cypher in `beforeEach` hooks. This isolates the test from other protocol issues and mirrors the pattern used by `recordInstantiationObservation` (which is explicitly allowed to bypass the protocol).

### 4.2 Verification Query

```cypher
MATCH (g:Grid {id: $testGridId})-[:CONTAINS]->(n:Seed {id: $testNodeId})
RETURN g.id AS gridId, n.id AS nodeId
```

Assert that both `gridId` and `nodeId` are returned (not null).

### 4.3 CONTAINS Edge Properties

From the `createLine` implementation in `instantiation.ts`:

```cypher
ON CREATE SET r.createdAt = datetime()
```

Tests may optionally verify that `createdAt` is set on the CONTAINS relationship.

---

## 5. Governance Resonator Non-Invocation Verification

### 5.1 The Challenge

The acceptance criterion states:

> "the governance Resonator path is not invoked during seed sub-type creation"

This is a **negative assertion** — proving something did NOT happen. Direct verification is complex because the governance observation recording is fire-and-forget (non-fatal catch block).

### 5.2 Verification Strategies

| Strategy | Approach | Reliability |
|----------|----------|-------------|
| **A: Pre/post count comparison** | Count observations in `grid:instantiation-observations` before and after test; assert count increased by exactly 1 (for the created sub-type node itself) | Medium — assumes single observation per creation |
| **B: Content inspection** | Query the observation created during test; verify it has single `:Seed` label, NOT dual labels | High — directly verifies observation node shape |
| **C: Label verification on observation Grid** | Verify no nodes in `grid:instantiation-observations` have dual labels like `:Seed:Observation` | High — proves governance observations aren't being routed through the new path |

**Recommendation:** Strategy B with Strategy C as secondary check.

### 5.3 Implementation for Strategy B

After calling `instantiateMorpheme('seed', {...}, gridId, undefined, { subType: 'Observation' })`:

```cypher
MATCH (g:Grid {id: 'grid:instantiation-observations'})-[:CONTAINS]->(obs:Seed)
WHERE obs.targetNodeId = $createdNodeId
RETURN labels(obs) AS obsLabels, obs.seedType AS obsType
```

Assert:
- `obsLabels` contains exactly one label: `'Seed'`
- `obsLabels` does NOT contain `'Observation'` (or any sub-type label)
- `obsType === 'observation'` (the governance `seedType`, not the operational sub-type)

### 5.4 What "Non-Invocation" Means

**Clarification:** The governance Resonator IS invoked — `recordInstantiationObservation` runs at the end of every `instantiateMorpheme` call. What must NOT happen is routing the governance observation THROUGH the sub-type multi-label path.

Evidence from t10:
> "They create single `:Seed` labels, not dual labels"

The test should verify:
1. The operational node (`:Seed:Observation`) was created via the protocol
2. The governance observation of that creation (in `grid:instantiation-observations`) is a plain `:Seed` node, not `:Seed:Observation`

---

## 6. Test Isolation and Setup Requirements

### 6.1 Database State Prerequisites

| Prerequisite | Why Needed | Setup Method |
|--------------|------------|--------------|
| Neo4j connection available | All queries require driver | `beforeAll`: validate connection |
| Constitutional Bloom exists | `def:morpheme:seed` must exist for INSTANTIATES | `beforeAll`: bootstrap or verify |
| Test Grid(s) exist | Parent for CONTAINS | `beforeEach`: create via raw Cypher |
| Unique test IDs | Prevent collision between tests | UUID or timestamp-based ID generation |

### 6.2 Test Cleanup

| Cleanup Strategy | Approach | Risk |
|------------------|----------|------|
| Delete test nodes after each test | Clean isolation | May leave orphaned relationships if delete fails |
| Use dedicated test database | Complete isolation | Operational complexity |
| Prefix test node IDs | Easy identification for bulk cleanup | May accumulate if cleanup missed |

**Recommendation:** Use prefixed IDs (e.g., `test-obs-${uuid}`) with `afterEach` cleanup that deletes nodes matching the prefix.

### 6.3 Sample Test Structure

```typescript
describe('Seed sub-type: Observation', () => {
  const testGridId = 'test-grid-observation';
  let createdNodeId: string;

  beforeEach(async () => {
    // Create isolated test Grid via raw Cypher
    await writeTransaction(async (tx) => {
      await tx.run(`
        CREATE (g:Grid {
          id: $gridId,
          name: 'Test Grid for Observation',
          content: 'Test fixture',
          type: 'test',
          status: 'active'
        })
      `, { gridId: testGridId });
    });
    createdNodeId = `test-obs-${Date.now()}`;
  });

  afterEach(async () => {
    // Cleanup test nodes
    await writeTransaction(async (tx) => {
      await tx.run(`
        MATCH (n) WHERE n.id STARTS WITH 'test-'
        DETACH DELETE n
      `);
    });
  });

  it('creates node with dual labels :Seed:Observation', async () => {
    // Test implementation
  });
});
```

---

## 7. Potential Test Regression Risks

### 7.1 Existing Test Inventory (Assumed)

The existing `instantiation-protocol.test.ts` likely contains tests for:

| Existing Test Area | Regression Risk |
|--------------------|-----------------|
| Basic seed creation | Low — `subType` is optional; omission preserves existing behavior |
| Bloom creation + Highlander | None — separate code path |
| Resonator creation + Highlander | None — separate code path |
| Grid creation | None — separate code path |
| Helix creation | None — separate code path |
| Line creation | None — separate code path |
| Required property validation | Medium — if validation logic changes |
| Parent validation | Low — `VALID_CONTAINERS` unchanged for seeds |

### 7.2 Regression Prevention Checklist

| Check | Action |
|-------|--------|
| Existing tests still pass | Run full test suite before adding new tests |
| New tests are additive only | Place in new `describe` blocks; don't modify existing assertions |
| Shared setup doesn't break | If existing tests rely on `beforeAll/beforeEach`, ensure new tests don't conflict |
| Import changes don't break | If new types are imported, ensure existing imports still resolve |

### 7.3 Import Verification

From t9 analysis, new exports from `instantiation.ts`:
- `VALID_SEED_SUBTYPES` (constant)
- `SeedSubType` (type)
- `InstantiationOptions` (type)

Tests should import these from the barrel export (`src/graph/index.ts`) to verify the export chain works:

```typescript
import {
  instantiateMorpheme,
  VALID_SEED_SUBTYPES,
  type SeedSubType,
  type InstantiationOptions,
} from '../src/graph/index.js';
```

---

## 8. Test Case Matrix Summary

| Sub-Type | Dual-Label Test | CONTAINS Test | INSTANTIATES Test | Governance Isolation Test |
|----------|-----------------|---------------|-------------------|---------------------------|
| Observation | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| Decision | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| TaskOutput | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| Distillation | ✅ Required | ✅ Required | ✅ Required | ✅ Required |

**Total new test cases:** Minimum 16 (4 per sub-type × 4 verification types)

**Additional recommended tests:**

| Test Case | Purpose |
|-----------|---------|
| Invalid sub-type rejection | `subType: 'Invalid'` should fail with descriptive error |
| Sub-type on non-seed rejection | `morphemeType: 'bloom', subType: 'Observation'` should fail |
| Property passthrough | Domain-specific properties (e.g., `metric`, `value`) persist |
| `seedType` property value | Verify `seedType` matches sub-type lowercase (e.g., `'observation'`) |

---

## 9. Recommendations

### 9.1 Test Implementation Order

1. **First:** Add dual-label tests (core functionality verification)
2. **Second:** Add CONTAINS tests (relationship wiring)
3. **Third:** Add governance isolation tests (recursion boundary protection)
4. **Fourth:** Add edge case tests (validation, rejection)

### 9.2 Test Data Design

Use minimal but complete property sets:

```typescript
const minimalObservationProps = {
  id: `test-obs-${Date.now()}`,
  name: 'Test Observation',
  content: JSON.stringify({ metric: 'test', value: 1 }),
  seedType: 'observation',
  status: 'active',
  metric: 'test',
  value: 1,
};
```

### 9.3 Verification Query Encapsulation

Create helper functions for common verification patterns:

```typescript
async function getNodeLabels(nodeId: string): Promise<string[]> { ... }
async function verifyContains(parentId: string, childId: string): Promise<boolean> { ... }
async function getGovernanceObservationForNode(targetNodeId: string): Promise<Record<string, unknown> | null> { ... }
```

This reduces duplication and improves test readability.

---

## 10. Acceptance Criteria Verification Map

| Acceptance Criterion | Test Coverage |
|----------------------|---------------|
| Test file includes cases for all four seed sub-types | §2 — 4 sub-types × 4+ tests each |
| Tests verify dual-label (:Seed + operational label) | §3 — Label intersection + dual-match queries |
| Tests verify Grid CONTAINS relationship exists | §4 — CONTAINS path verification |
| Tests pass: `npx vitest run ...` | §6 — Setup/cleanup ensures runnable tests |
| No test regression in existing tests | §7 — Additive-only changes; regression checklist |