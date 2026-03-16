# SCOPE (claude-sonnet-4-6:adaptive:low)

Quality: 0.70 | Duration: 58066ms

## SCOPE ANALYSIS

### 1. Scope Boundaries

**IN SCOPE:**
- Add `createPipelineOutputSeed` function + supporting interface to `src/graph/queries.ts`
- Add `linkSeedToPipelineRun` function to `src/graph/queries.ts`
- Write one ingestion script (e.g. `scripts/seed-pipeline-m17-2026-03-06.ts`) that reads the manifest and drives all graph writes
- 13 Seed nodes (`seedType: 'pipeline-output'`), 1 Bloom node for the run, 13 `CONTAINS` edges — all via MERGE
- Non-fatal try/catch on every write, console.warn on failure

**OUT OF SCOPE:**
- `src/graph/schema.ts` — `seed_seed_type` index already exists; no schema changes needed
- `TaskOutput` nodes — the manifest maps naturally to Seed + Bloom, not `TaskOutput`
- Modifying any computation, routing, or Thompson-sampling code
- Reading the 13 `.md` output files (manifest metadata is sufficient)

---

### 2. Key Requirements

| # | Requirement | Source |
|---|---|---|
| R1 | Seed `id` must be globally unique — use `${runId}_${taskId}` | idempotency / MERGE |
| R2 | Every Seed carries `seedType: 'pipeline-output'` | task spec |
| R3 | `createPipelineOutputSeed` uses MERGE — safe to re-run | task spec |
| R4 | Bloom `id` = `run:${runId}`; captures `intent`, `startedAt`, `completedAt`, `taskCount` | manifest |
| R5 | `linkSeedToPipelineRun(bloomId, seedId)` MERGEs a `CONTAINS` relationship | task spec + `RELATIONSHIP_TYPES.CONTAINS` |
| R6 | Every `writeTransaction` call wrapped in `try/catch`; failures `console.warn`, do not throw | task spec |
| R7 | `thinkingMode` must be typed `"adaptive" \| "extended" \| "none" \| "default"` to satisfy existing `SeedProps` constraints | `SeedProps` interface |
| R8 | `baseModelId` required by `SeedProps` — derive by stripping parameter suffix from `model` (e.g. `claude-opus-4-6:adaptive:medium` → `claude-opus-4-6`) | `SeedProps` interface |
| R9 | Script is TypeScript-only; imports `writeTransaction` from `./src/graph/client.js` path convention | task spec |

---

### 3. Risk Factors

**HIGH — Missing functions, file truncated at 32 000 chars**
`createPipelineOutputSeed` and `linkSeedToPipelineRun` are not visible in the reference file. The file is explicitly truncated. They may already exist further down. **Mitigation:** add them inside a clearly guarded block (e.g. `// ADDED: pipeline-output helpers`) and name them distinctly enough that a grep check before commit is low-effort.

**MEDIUM — `SeedProps` interface mismatch**
`seedType` is indexed in the schema but absent from `SeedProps`. A narrow `PipelineOutputSeedProps` interface must be defined — either extending `SeedProps` or standalone — and the MERGE query must set `s.seedType` explicitly. If a future function relies on `SeedProps` being exhaustive, adding `seedType?` to it is the cleanest fix.

**MEDIUM — `thinkingParameter` contains both token budgets (`"16k"`, `"32k"`, `"8k"`) and qualitative labels (`"low"`, `"medium"`, `"high"`)**
Both forms appear in the manifest. The field is `string` in `SeedProps` so type safety is fine, but any downstream consumer that parses it numerically will need to handle both. Flag with a comment; do not normalize.

**LOW — `baseModelId` must be derived at write time**
The manifest stores compound model strings (e.g. `claude-opus-4-5:extended:16k`). Deriving `baseModelId` by splitting on `:` is simple but must be consistent with however the Thompson router registered these seeds. If those seeds already exist in the graph, MERGE ON MATCH will overwrite `baseModelId` only if the derivation matches. Confirm split-on-first-colon convention.

**LOW — Windows path separators in `outputFile`**
Manifest stores `outputFile` with backslashes (`docs\\pipeline-output\\...`). Store as-is (the field is informational); do not normalize unless a path-aware consumer exists.

**LOW — Bloom for run vs. existing PipelineRun node type**
The schema has a `PipelineRun` label with its own constraints. The task explicitly asks for a **Bloom** node. These are different labels — no constraint collision — but it means the run is represented twice if `createPipelineRun` was also called. The Bloom is the graph-native view; note this in a comment.