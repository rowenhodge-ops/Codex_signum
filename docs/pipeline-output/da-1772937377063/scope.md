# SCOPE (claude-opus-4-6:adaptive:low)

Quality: 0.70 | Duration: 115523ms

# Scope Analysis: Pipeline Output Seed Nodes

## 1. Clear Scope Boundaries

### IN SCOPE

**A. New query infrastructure (`src/graph/queries.ts`)**
- New `PipelineOutputSeedProps` interface with the 11 specified fields (`id`, `name`, `seedType`, `content`, `qualityScore`, `modelId`, `charCount`, `durationMs`, `runId`, `taskId`, `order`)
- New `createPipelineOutputSeed(props)` function — follows the `createSeed` MERGE pattern but with pipeline-output-specific fields. Cannot reuse `createSeed` directly because `SeedProps` requires LLM-model-oriented fields (`provider`, `model`, `baseModelId`, `thinkingMode`) that are meaningless here
- New `linkSeedToPipelineRun(seedId, runId, order)` function — creates `(pr:PipelineRun {id})-[:CONTAINS {order}]->(s:Seed {id})` relationship, following the pattern in `connectBlooms` / `linkTaskOutputToStage`

**B. Bootstrap task executor (`scripts/bootstrap-task-executor.ts`)**
- Locate the `writeFileSync(outputPath, outputContent, "utf-8")` call in the success path (~line after "Output written to" log)
- Insert Seed creation + CONTAINS relationship **immediately after** the markdown write, inside the same outer `try` block, wrapped in its own inner `try/catch` with `console.warn` on failure
- Derive `order` from `manifestTasks.length` (the task was just pushed, so its 0-based index is `manifestTasks.length - 1`; or use a counter — current position is available since `manifestTasks` is populated right before this point)
- Repeat the same pattern in the **failure path** (the `catch` block that writes failed TaskOutput), creating a Seed with empty content and `qualityScore` from `failedQuality`
- `content` = `outputContent` (the full markdown including header, not just `result.text`) OR `result.text` (raw LLM output). Task says "full task output text" — use `result.text` to match

**C. DevAgent executor (`scripts/bootstrap-devagent-executor.ts`)**
- Inside the `executor` function, after `callModelDirect` returns successfully and before `return { output, durationMs, cost }`
- Problem: executor signature `(modelId, prompt, stage)` lacks `runId`, `taskId`, `order`. Solutions:
  - Add an optional `graphConfig` to the `createDevAgentExecutor` factory (closure-captured `runId` + a mutable counter for `order`)
  - The Seed `id` would be `${runId}:${stage}` (or `${runId}:${stage}:${order}` if stages repeat)
  - `taskId` = stage name; `name` = `DevAgent ${stage} output`
- Same non-fatal try/catch/console.warn pattern

**D. Tests (new test file, likely `tests/pipeline-output-seed.test.ts`)**
1. Verify Seed node created with all 11 correct properties after task completion
2. Verify CONTAINS relationship exists from PipelineRun to Seed with correct `order`
3. Verify graph write failure (mocked to throw) does not prevent pipeline execution — task outcome still returns successfully

### OUT OF SCOPE
- No changes to existing markdown file output logic
- No changes to existing `TaskOutput` node writes or `linkTaskOutputToStage`
- No changes to `SeedProps` interface (that type is for LLM model instances)
- No schema changes (`seed_seed_type` index already exists in `schema.ts`)
- No changes to `types.ts` `DevAgentModelExecutor` interface signature (use closure config instead)
- No changes to `client.ts`, `schema.ts`, or any spec files
- No changes to Thompson Sampling queries (they filter on `status = 'active'`, which pipeline-output Seeds won't carry)

---

## 2. Key Requirements

| # | Requirement | Rationale |
|---|-------------|-----------|
| R1 | Seed `id` = `${runId}:${taskId}` | Deterministic, idempotent via MERGE — retry-safe |
| R2 | `seedType = "pipeline-output"` | Disambiguates from LLM-model Seeds; schema already indexes `seedType` |
| R3 | `content` = full raw LLM output text | Graph is structural truth; markdown is human-readable cache |
| R4 | CONTAINS relationship carries `order` property | Preserves task sequence in graph topology |
| R5 | CONTAINS goes **from PipelineRun to Seed** (not Bloom) | PipelineRun is the execution instance node; task says "PipelineRun Bloom" but PipelineRun is its own label per schema |
| R6 | Non-fatal: `try { ... } catch (err) { console.warn(...) }` | Graph writes must never block pipeline execution — matches every existing graph write in the file |
| R7 | Placement: immediately after `writeFileSync` of markdown | Same try block scope; Seed write is logically coupled to output production |
| R8 | Additive only | Zero modifications to existing markdown or TaskOutput paths |
| R9 | DevAgent: closure-captured config for `runId` + auto-incrementing `order` | Avoids breaking the `DevAgentModelExecutor` type interface |
| R10 | All three test cases pass | Seed creation, CONTAINS relationship, failure isolation |

### Property Mapping (task executor success path)

```
id:           `${currentRunId}:${task.task_id}`
name:         task.title
seedType:     "pipeline-output"
content:      result.text
qualityScore: qualityScore  (from assessTaskQuality)
modelId:      result.modelId
charCount:    result.text.length
durationMs:   result.durationMs
runId:        currentRunId
taskId:       task.task_id
order:        manifestTasks.length - 1  (0-based sequence position)
```

---

## 3. Risk Factors

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Seed label overloading** — Same `:Seed` label now represents two concepts (LLM model vs pipeline output). Queries like `listActiveSeeds()` could return pipeline-output Seeds if they don't filter carefully. | **Medium** | `listActiveSeeds` filters on `status = 'active'`; pipeline-output Seeds won't set `status`. Add explicit `WHERE s.seedType IS NULL OR s.seedType <> 'pipeline-output'` guard to Thompson queries if paranoia warrants it. Document the two Seed subtypes. |
| **Content size in Neo4j** — Task outputs can be 10-40KB. Storing as a node property is valid but inflates node storage. | **Low** | Neo4j handles multi-KB string properties without issue. No index on `content`. If outputs grow to 100KB+, consider storing a hash + file path instead — but that's a future concern. |
| **PipelineRun node may not exist** — If `createPipelineRun` failed on first task (caught by existing warn), the CONTAINS relationship write will also fail (no target node). | **Low** | Already mitigated by the non-fatal pattern — CONTAINS failure just warns. The Seed node itself is still created (standalone). Could add a `MATCH (pr:PipelineRun)` guard, but unnecessary given the catch. |
| **DevAgent context gap** — Executor function signature lacks `runId`/`taskId`/`order`. Adding closure config changes the factory's API surface. | **Medium** | Keep config optional (`graphConfig?: { runId: string; graphEnabled: boolean; ... }`). When absent, skip Seed creation silently. Zero behavior change for existing callers. |
| **Order calculation race** — `manifestTasks.length - 1` assumes synchronous push-then-write. If execution were ever parallelized, order could be wrong. | **Low** | Current executor is strictly sequential (tasks run one at a time). Add a comment noting the sequential assumption. |
| **`createPipelineOutputSeed` vs `createSeed` divergence** — Two functions creating `:Seed` nodes with different property schemas. Future maintainers may not realize both exist. | **Medium** | Name the function distinctly (`createPipelineOutputSeed`), add JSDoc cross-referencing `createSeed`, and note that `seedType` discriminates the two variants. |
| **Test mocking depth** — Tests need to mock `writeTransaction` or the new query functions. If the test imports the real executor, transitive imports of `neo4j-driver` may fail in CI without a Neo4j instance. | **Medium** | Mock at the `src/graph/queries.js` module boundary (jest.mock / vitest.mock). Follow existing test patterns in the repo. Alternatively, test the Seed-creation logic in isolation by extracting a pure function that builds the props, and test the non-fatal wrapper separately. |

### Dependency Chain
```
scripts/bootstrap-task-executor.ts
  └─ imports createPipelineOutputSeed, linkSeedToPipelineRun  ← NEW
     └─ from src/graph/queries.ts                             ← MODIFIED
        └─ uses writeTransaction from src/graph/client.ts     ← UNCHANGED

scripts/bootstrap-devagent-executor.ts
  └─ imports createPipelineOutputSeed, linkSeedToPipelineRun  ← NEW
     └─ from src/graph/queries.ts                             ← same
```

No circular dependencies introduced. No schema migration required (existing `seed_seed_type` index covers the new usage).