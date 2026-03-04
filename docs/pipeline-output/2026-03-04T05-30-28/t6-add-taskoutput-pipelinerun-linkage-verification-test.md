# Add TaskOutput→PipelineRun linkage verification test

> Task ID: t6
> Model: claude-opus-4-6:adaptive:low
> Duration: 117923ms
> Output chars: 21647
> Timestamp: 2026-03-04T05:44:31.281Z

> **⚠️ Hallucination flags (5):**
> - [content/warning] Task t6 references "pipeline-topology.test.ts" but this file was not in its context
> - [content/warning] Task t6 references "src/graph/queries.ts" but this file was not in its context
> - [content/warning] Task t6 references "queries.ts" but this file was not in its context
> - [content/warning] Task t6 references "dispatch.ts" but this file was not in its context
> - [content/warning] Task t6 references a document ("docs/specs/06_codex-signum-architect-pattern-design.md") that was not in its context

---

# TaskOutput→PipelineRun Linkage Verification Test — Design Analysis (t6)

## 1. Objective

Design a focused test (`t6`) within `tests/graph/pipeline-topology.test.ts` that verifies TaskOutput nodes are created for each decomposed task, linked to their parent PipelineRun via the `[:PRODUCED]` relationship, and that task metadata (id, status, output content) is persisted correctly — entirely without Neo4j, using a mocked graph session.

---

## 2. Current State Assessment

### 2.1 What Exists Today

| Aspect | State | Evidence |
|--------|-------|---------|
| `TaskOutputProps` interface | ✅ Defined and shape-tested | `pipeline-topology.test.ts` lines ~80-130: tests for fully-specified object and optional `qualityScore` |
| `createTaskOutput` function | ✅ Exported, export verified | `pipeline-topology.test.ts` exports block: `expect(typeof createTaskOutput).toBe("function")` |
| `getTaskOutputsForRun` function | ✅ Exported, export verified | `pipeline-topology.test.ts` exports block |
| `linkTaskOutputToStage` function | ✅ Exported, export verified | `pipeline-topology.test.ts` exports block |
| Behavioral test for TaskOutput creation | ❌ **Missing entirely** | t4 audit: "No tests verify `createTaskOutput` actually creates a node" |
| Behavioral test for PRODUCED relationship | ❌ **Missing entirely** | t4 relationship table: `PipelineRun -[PRODUCED]→ TaskOutput` — coverage marked ❌ |
| Behavioral test for metadata storage | ❌ **Missing entirely** | t4 function table: `createTaskOutput` — Behavior column marked ❌ |
| Mock graph session pattern | ❌ No precedent in codebase | t5 analysis: "No existing test mocks the Neo4j driver/session" |

### 2.2 What the Query Functions Actually Do

From the t2 CRUD audit of `src/graph/queries.ts`:

| Function | Cypher Pattern | Key Behavior |
|----------|---------------|--------------|
| `createTaskOutput` | `CREATE (to:TaskOutput { id: $id, runId: $runId, taskId: $taskId, ... })` then `MERGE (pr:PipelineRun { id: $runId })-[:PRODUCED]->(to)` | Non-idempotent creation; links to parent PipelineRun via `[:PRODUCED]` edge |
| `getTaskOutputsForRun` | `MATCH (pr:PipelineRun { id: $runId })-[:PRODUCED]->(to:TaskOutput) RETURN to ORDER BY to.taskId` | Traverses `[:PRODUCED]` relationship, returns ordered TaskOutput nodes |
| `linkTaskOutputToStage` | `MATCH (r:Resonator { id: $resonatorId }), (to:TaskOutput { id: $taskOutputId }) MERGE (r)-[:PROCESSED]->(to)` | Secondary linkage to Architect stage resonators |
| `queryTaskOutputsByModel` | `MATCH (to:TaskOutput) WHERE to.modelUsed CONTAINS $modelPattern ...` | Cross-run query, optional quality floor filter |

### 2.3 TaskOutput Identity Model

The composite ID pattern used in existing interface tests is `${runId}_${taskId}`:

```typescript
// From existing test, line ~82
const output: TaskOutputProps = {
  id: "run-001_t1",       // Composite: runId + "_" + taskId
  runId: "run-001",
  taskId: "t1",
  ...
};
```

**Finding:** `createTaskOutput` uses `CREATE` (not `MERGE`). This means calling it twice with the same `id` would produce **duplicate nodes** — the uniqueness constraint `task_output_id_unique` on `to.id` would catch this at the Neo4j level, but only if the constraint is enforced. In mock testing, this distinction matters: the mock must not hide the non-idempotent semantics.

### 2.4 Relationship Direction and Type

From the t2 audit and the t10 relationship catalog:

| Relationship | Direction | Created By | Schema Declaration |
|-------------|-----------|------------|-------------------|
| `PRODUCED` | `(PipelineRun)-[:PRODUCED]->(TaskOutput)` | `createTaskOutput` | ❌ Not declared in schema.ts (t10 Gap G4) |
| `PROCESSED` | `(Resonator)-[:PROCESSED]->(TaskOutput)` | `linkTaskOutputToStage` | ❌ Not declared in schema.ts (t10 Gap G4) |

**Critical note:** The `PRODUCED` relationship is created in the *same transaction* as the TaskOutput node. The Cypher pattern is a two-statement sequence: first `CREATE` the node, then `MERGE` the relationship to the PipelineRun. The `MERGE` on the relationship means the PipelineRun node must already exist — if it doesn't, `MERGE` will create a bare `PipelineRun` node with only the `id` property. This is a potential data integrity concern but is outside the scope of this test.

---

## 3. Acceptance Criteria Decomposition

| Criterion | What Must Be Verified | Mock Requirement |
|-----------|----------------------|------------------|
| **TaskOutput node creation per task** | For N decomposed tasks, N calls to `createTaskOutput` produce N distinct Cypher `CREATE` statements, each with a unique `id` | Mock captures all `session.run()` invocations; test asserts exactly N `CREATE (to:TaskOutput ...)` calls |
| **Relationship to parent PipelineRun exists** | Each `createTaskOutput` call also executes a `MERGE (pr:PipelineRun { id: $runId })-[:PRODUCED]->(to)` | Mock captures the MERGE statement and verifies `$runId` parameter matches the parent run |
| **Task metadata stored (id, status, output)** | The `CREATE` statement includes `id`, `taskId`, `status`, `title`, `taskType`, `modelUsed`, `provider`, `outputLength`, `durationMs`, `qualityScore`, `hallucinationFlagCount` | Mock captures parameters; test asserts each field is present and correctly typed |
| **Passes without Neo4j** | No real database connection required | All session interactions are mocked; no environment variable checks for `NEO4J_URI` |

---

## 4. Mock Strategy

### 4.1 Session Mock Shape

Following the pattern established in the t5 analysis for PipelineRun lifecycle testing, the TaskOutput test requires an identical mock architecture:

| Mock Component | Purpose | Shape |
|---------------|---------|-------|
| `session.run(cypher, params)` | Intercept all Cypher executions | `vi.fn()` returning `Promise<{ records: FakeRecord[] }>` |
| `FakeRecord` | Simulate Neo4j Record API for `getTaskOutputsForRun` read-back | `{ get(key): props, toObject(): { [key]: { properties: props } } }` |
| Capture array | Record all `(cypher, params)` tuples for assertion | `{ cypher: string; params: Record<string, unknown> }[]` |

### 4.2 Mock Behavioral Requirements

**For `createTaskOutput` calls:**
- The mock must accept the Cypher string and parameter object
- It must return a minimal success response (empty records array is sufficient since `CREATE` doesn't return by default in the Cypher used)
- It must store the captured parameters for later assertion

**For `getTaskOutputsForRun` calls (verification read-back):**
- The mock must recognize the `MATCH (pr:PipelineRun { id: $runId })-[:PRODUCED]->(to:TaskOutput)` pattern
- It must return synthetic `FakeRecord` objects whose properties match what was previously "created"
- This requires the mock to maintain a minimal in-memory store of created TaskOutput properties, or use a conditional `vi.fn()` implementation that returns pre-constructed records

### 4.3 Mock Fidelity Boundaries

The mock does **NOT** need to:
- Parse or validate Cypher syntax
- Enforce the `task_output_id_unique` constraint
- Simulate `MERGE` vs `CREATE` semantics
- Return realistic Neo4j metadata (labels, identity, elementId)

The mock **DOES** need to:
- Distinguish between `CREATE` calls (for `createTaskOutput`) and `MATCH` calls (for `getTaskOutputsForRun`) to return appropriate responses
- Preserve the order of captured calls so the test can assert temporal sequencing
- Return records from `getTaskOutputsForRun` that include all metadata fields, enabling the test to verify round-trip property fidelity

### 4.4 Alternative: Pure Parameter Verification Without Read-Back

A simpler mock strategy avoids simulating `getTaskOutputsForRun` entirely:

1. Mock `session.run` to capture all calls
2. Call `createTaskOutput` for each of N tasks
3. Assert the captured parameters for each call contain the correct metadata
4. Assert the Cypher string for each call contains the `[:PRODUCED]` relationship pattern
5. Call `getTaskOutputsForRun` as a separate assertion group, verifying only that it invokes the correct Cypher with the correct `runId` parameter

**Recommendation:** Use this simpler strategy. It tests the *contract* between the query functions and Neo4j without attempting to simulate Neo4j's behavior. The acceptance criteria ask to verify that "TaskOutput nodes are created" and "relationship to parent PipelineRun exists" — this is satisfied by proving the correct Cypher and parameters are sent to the session. Attempting to round-trip through a simulated graph adds mock complexity without increasing confidence (the Cypher correctness is ultimately validated by integration tests against a real Neo4j instance, which is out of scope per the "no Neo4j" requirement).

---

## 5. Test Design Specification

### 5.1 Describe Block Placement

The new test should be added as a new top-level `describe` block in `tests/graph/pipeline-topology.test.ts`, following the existing pattern:

```
// ============ TASKOUTPUT→PIPELINERUN LINKAGE TESTS ============
describe("Pipeline Topology — TaskOutput→PipelineRun Linkage", () => { ... })
```

This follows the established convention: `Schema`, `Exports`, `Barrel re-exports`, `Schema statements` are the existing blocks.

### 5.2 Test Fixture: Decomposed Task Set

The test should define a realistic set of 3–4 decomposed tasks representing the output of the Architect DECOMPOSE stage. Using the task types from the spec (`generative`, `mechanical`, `analytical`):

| Task | taskId | title | taskType | modelUsed | provider | status |
|------|--------|-------|----------|-----------|----------|--------|
| T1 | `t1` | "Analyze API surface" | `analytical` | `claude-opus-4-6` | `anthropic` | `succeeded` |
| T2 | `t2` | "Generate migration script" | `generative` | `gemini-2.5-pro` | `google` | `succeeded` |
| T3 | `t3` | "Rename deprecated symbols" | `mechanical` | `gemini-2.0-flash` | `google` | `succeeded` |
| T4 | `t4` | "Review output coherence" | `generative` | `claude-opus-4-6` | `anthropic` | `failed` |

This fixture exercises:
- Multiple task types (all three canonical types)
- Multiple model providers (Anthropic, Google)
- Both success and failure statuses
- The composite ID pattern (`run-fixture_t1`, `run-fixture_t2`, etc.)

### 5.3 Test Cases — Seven Assertions

| # | Test Name | What It Verifies | Acceptance Criterion |
|---|-----------|-----------------|---------------------|
| 1 | "creates a TaskOutput node for each decomposed task" | `createTaskOutput` is called once per task; each call generates a `CREATE (to:TaskOutput ...)` Cypher statement | TaskOutput node creation per task |
| 2 | "assigns unique composite IDs to each TaskOutput" | Each captured `params.id` follows the `${runId}_${taskId}` pattern and all IDs are distinct | TaskOutput node creation per task |
| 3 | "links each TaskOutput to the parent PipelineRun via PRODUCED" | Each `createTaskOutput` Cypher contains `[:PRODUCED]` and the `$runId` parameter matches the parent run | Relationship to parent PipelineRun |
| 4 | "stores task identification metadata (taskId, title, taskType)" | Captured parameters include `taskId`, `title`, `taskType` with correct values per task | Task metadata stored |
| 5 | "stores execution metadata (modelUsed, provider, durationMs, outputLength)" | Captured parameters include model routing and performance metrics | Task metadata stored |
| 6 | "stores outcome metadata (status, qualityScore, hallucinationFlagCount)" | Captured parameters include success/failure status, quality score (including `null` for optional), and hallucination count | Task metadata stored |
| 7 | "getTaskOutputsForRun queries by runId through PRODUCED relationship" | `getTaskOutputsForRun` call sends Cypher with `[:PRODUCED]` traversal and `$runId` parameter matching the fixture run | Relationship to parent PipelineRun |

### 5.4 Assertion Detail

**Test 1 — Node creation count:**
- Create a `session.run` mock that captures calls
- Call `createTaskOutput(session, props)` four times (one per fixture task)
- Assert captured calls length includes exactly 4 `CREATE` operations (note: each `createTaskOutput` may issue 1 or 2 `session.run` calls depending on implementation — whether the `CREATE` and `MERGE` are in a single Cypher string or separate calls)
- If single Cypher string: assert 4 total captured calls, each containing `CREATE (to:TaskOutput`
- If separate statements: assert 8 calls (4 CREATE + 4 MERGE), with interleaved patterns

**Finding from t2:** The exact Cypher structure matters. The t2 audit describes `CREATE (to:TaskOutput { ... })` then `MERGE (pr)-[:PRODUCED]->(to)`. The word "then" is ambiguous — it could be a single multi-statement Cypher string or two separate `session.run` calls. **The test should not assume the number of `session.run` calls per `createTaskOutput` invocation.** Instead, it should filter captured calls by Cypher content:
- Count calls where `cypher.includes('CREATE')` and `cypher.includes('TaskOutput')` — expect 4
- Count calls where `cypher.includes('PRODUCED')` — expect ≥ 4

**Test 3 — PRODUCED relationship:**
- For each captured call containing `[:PRODUCED]`, assert the params object includes `runId` (or equivalent parameter name) matching the fixture PipelineRun ID
- Assert the Cypher references `PipelineRun` by ID: either `MATCH (pr:PipelineRun { id: $runId })` or `MERGE (pr:PipelineRun { id: $runId })`

**Test 4–6 — Metadata storage:**
- For each captured `CREATE` call, extract `params` and assert individual fields:
  - `params.taskId` matches the fixture task's `taskId`
  - `params.title` is a non-empty string
  - `params.taskType` is one of `"generative"`, `"mechanical"`, `"analytical"`
  - `params.modelUsed` is a non-empty string
  - `params.provider` is one of `"anthropic"`, `"google"`, `"openai"` (or any valid provider)
  - `params.status` is one of `"succeeded"`, `"failed"`
  - `params.qualityScore` is either a number in [0, 1] or `null`
  - `params.hallucinationFlagCount` is a non-negative integer
  - `params.outputLength` is a positive integer
  - `params.durationMs` is a positive number

---

## 6. Design Tensions and Risks

### 6.1 Single Cypher vs. Multi-Statement Uncertainty

**Tension:** The t2 audit describes the `createTaskOutput` function as executing `CREATE ... MERGE ...` but does not specify whether this is one `session.run` call or two. The test design must handle both possibilities.

**Recommendation:** Write the mock to capture all `session.run` invocations regardless of count. Write assertions against the *aggregated set* of captured Cypher strings and parameters rather than assuming a fixed call count per `createTaskOutput`.

### 6.2 Parameter Naming Convention

**Tension:** The Cypher parameters might use `$id`, `$runId`, `$taskId` directly, or they might use a wrapper object like `$props.id`. The test assertions on parameter names depend on the exact implementation in `queries.ts`.

**Recommendation:** The test should import and call the actual `createTaskOutput` function, passing the mock session. This means the function itself dictates the parameter naming. The mock captures whatever the function passes to `session.run`. No assumption about naming is required — the assertion verifies that the *values* in the captured params match the *values* in the fixture `TaskOutputProps`.

**Evidence:** The existing interface tests in `pipeline-topology.test.ts` already construct `TaskOutputProps` objects with explicit field names (`id`, `runId`, `taskId`, etc.), confirming the property naming convention.

### 6.3 Non-Idempotent CREATE Semantics

**Tension:** `createTaskOutput` uses `CREATE` not `MERGE`, meaning duplicate calls would fail in a real Neo4j with a uniqueness constraint violation. The mock won't enforce this.

**Recommendation:** The test should include an assertion noting this design characteristic — perhaps a comment or a separate test verifying that each fixture task has a distinct `id`. This documents the expectation without requiring the mock to simulate constraint enforcement.

### 6.4 Failed Task Inclusion

**Tension:** The acceptance criteria say "TaskOutput nodes are created for each decomposed task." This includes tasks that *failed* during execution (fixture task T4 with `status: "failed"`). The test must verify that failed tasks also produce TaskOutput nodes — the failure is recorded as metadata (`status: "failed"`) rather than by omitting the node.

**Recommendation:** Include at least one failed task in the fixture set and explicitly assert that a TaskOutput node is created for it with `status: "failed"`. This matches the t3 finding that `dispatch.ts` pushes outcomes for both success and failure paths.

### 6.5 Mock Shared with t5

**Tension:** The t5 analysis (PipelineRun lifecycle test) establishes a mock pattern. If both t5 and t6 are implemented, they should share the same mock infrastructure to avoid duplication.

**Recommendation:** Extract the mock session factory into a shared `beforeEach` or a utility function within the test file. Both `describe` blocks can use the same `createMockSession()` helper that returns `{ session, captured }`.

---

## 7. Relationship to Prior Findings

### 7.1 From t1 (Schema Audit)

The schema defines `task_output_id_unique` and indexes on `runId`, `modelUsed`, `status`. The test should verify that the `runId` property is always populated (echoing the t10 recommendation for a NOT NULL constraint on `TaskOutput.runId`). Specifically, test assertion #3 should verify `params.runId` is never `undefined` or `null`.

### 7.2 From t2 (CRUD Audit)

The `[:PRODUCED]` relationship type is the critical wiring tested here. t2 notes this is the *only* direct link between TaskOutput and PipelineRun (there is no `BELONGS_TO` or equivalent — the relationship *is* the linkage). The test correctly focuses on this single relationship type.

t2 also identifies the missing `updateTaskOutputQuality` function. The t6 test should document (via a `// TODO` comment or a future-proofing assertion on `qualityScore: null`) that quality scores may be backfilled after initial creation.

### 7.3 From t3 (Architect Pattern Audit)

t3 found that `dispatch.ts` does **not** call any graph functions — task outcomes are accumulated in memory only. This means the t6 test is validating the *query layer contract* (that `createTaskOutput` sends correct Cypher when called), not that the architect pipeline actually calls it. The gap between the query layer and the pattern layer is documented in t3 and is a separate remediation concern.

### 7.4 From t4 (Test Coverage Audit)

The coverage matrix shows TaskOutput at `⚪ Export` for both Create and Read. After t6 is implemented, this should advance to `✅ Tested (mock)` for Create and `⚪ Export + contract` for Read.

### 7.5 From t10 (Schema Gaps)

Gap G4 identifies `PRODUCED` as an undeclared relationship type. The t6 test implicitly validates that the relationship type name is `PRODUCED` (by asserting the Cypher contains this string). If the relationship type were ever renamed in `queries.ts` without updating the test, the assertion would catch the drift.

### 7.6 From t12 (Missing Queries)

The missing `getTaskOutput(taskOutputId)` single-node lookup could be exercised in a future extension of t6 to verify individual TaskOutput retrieval. For now, `getTaskOutputsForRun` provides sufficient coverage of the read path.

---

## 8. Implementation Sequence

| Step | Action | Dependency |
|------|--------|------------|
| 1 | Define mock session factory (shared with t5 if implemented) | None |
| 2 | Define fixture: one PipelineRun + four TaskOutputProps objects | TaskOutputProps interface (exists) |
| 3 | Implement tests 1–2 (creation count, unique IDs) | Mock session, `createTaskOutput` import |
| 4 | Implement test 3 (PRODUCED relationship) | Mock captures Cypher strings |
| 5 | Implement tests 4–6 (metadata assertions) | Mock captures parameter objects |
| 6 | Implement test 7 (getTaskOutputsForRun contract) | Mock returns synthetic records |
| 7 | Run verification: `npx vitest run tests/graph/pipeline-topology.test.ts --reporter=verbose` | All prior steps |

---

## 9. Verification Command

```bash
npx vitest run tests/graph/pipeline-topology.test.ts --reporter=verbose
```

Expected output after implementation:

```
✓ Pipeline Topology — Schema > ARCHITECT_STAGES constant > has exactly 7 canonical stages
✓ Pipeline Topology — Schema > ARCHITECT_STAGES constant > contains all canonical stage names in order
✓ Pipeline Topology — Schema > ARCHITECT_STAGES constant > is readonly
✓ Pipeline Topology — Schema > PipelineRunProps interface > ...
✓ Pipeline Topology — Schema > TaskOutputProps interface > ...
✓ Pipeline Topology — Exports > ...
✓ Pipeline Topology — Barrel re-exports > ...
✓ Pipeline Topology — Schema statements > ...
✓ Pipeline Topology — TaskOutput→PipelineRun Linkage > creates a TaskOutput node for each decomposed task
✓ Pipeline Topology — TaskOutput→PipelineRun Linkage > assigns unique composite IDs to each TaskOutput
✓ Pipeline Topology — TaskOutput→PipelineRun Linkage > links each TaskOutput to the parent PipelineRun via PRODUCED
✓ Pipeline Topology — TaskOutput→PipelineRun Linkage > stores task identification metadata (taskId, title, taskType)
✓ Pipeline Topology — TaskOutput→PipelineRun Linkage > stores execution metadata (modelUsed, provider, durationMs, outputLength)
✓ Pipeline Topology — TaskOutput→PipelineRun Linkage > stores outcome metadata (status, qualityScore, hallucinationFlagCount)
✓ Pipeline Topology — TaskOutput→PipelineRun Linkage > getTaskOutputsForRun queries by runId through PRODUCED relationship
```