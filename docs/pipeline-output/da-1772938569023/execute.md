# EXECUTE (claude-sonnet-4-6:adaptive:medium)

Quality: 0.70 | Duration: 2885160ms

## Implementation

### File 1 of 2 — `src/graph/queries.ts` (additions only)

Paste this block at the end of the existing file. `writeTransaction` is already imported above the truncation point.

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// ADDED: pipeline-output helpers (grep sentinel: PIPELINE_OUTPUT_HELPERS)
//
// NOTE: A :PipelineRun node may also exist elsewhere in the graph (different
// label, different constraints). The :Bloom node created here is the
// graph-native view of the run. The two labels are intentionally distinct —
// no constraint collision occurs.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Props for a Seed node that records a single task output from a pipeline run.
 *
 * `seedType` is not present on the base SeedProps interface (it lives in the
 * schema index `seed_seed_type` but was never added to the TypeScript type).
 * PipelineOutputSeedProps is intentionally standalone — not extending SeedProps
 * — to avoid a structural mismatch until the base interface is updated.
 */
export interface PipelineOutputSeedProps {
  /** Globally unique.  Always constructed as `${runId}_${taskId}`.  (R1) */
  id: string;
  taskId: string;
  runId: string;
  /** Fixed discriminator for this category of seeds.  (R2) */
  seedType: 'pipeline-output';
  /** Full compound model string, e.g. "claude-opus-4-5:extended:16k".  */
  model: string;
  /** First colon-delimited segment of `model`.  (R8) */
  baseModelId: string;
  /**
   * Typed to satisfy the existing SeedProps constraint.  (R7)
   * Derived from the second segment of `model`; falls back to "none" when
   * the segment is absent or unrecognised.
   */
  thinkingMode: 'adaptive' | 'extended' | 'none' | 'default';
  /**
   * May be a token-budget label ("16k", "32k", "8k") or a qualitative label
   * ("low", "medium", "high") depending on the model configuration.
   * Stored as-is; downstream consumers must handle both forms.  (MEDIUM risk)
   */
  thinkingParameter: string;
  /**
   * Path to the output markdown file, stored as-is from the manifest.
   * May contain backslashes on Windows — do not normalise (field is
   * informational; no path-aware consumer exists).
   */
  outputFile: string;
  taskLabel: string;
  completedAt: string;
}

/**
 * Props for the Bloom node that represents the pipeline run as a whole.
 * id = "run:${runId}"  (R4)
 */
export interface PipelineRunBloomProps {
  /** Always `"run:${runId}"`. */
  id: string;
  runId: string;
  intent: string;
  startedAt: string;
  completedAt: string;
  taskCount: number;
}

// ─── Write functions ──────────────────────────────────────────────────────────

/**
 * MERGE-upserts a :Seed node representing one task output from a pipeline run.
 *
 * Idempotent — safe to re-run.  (R3)
 * Throws on Neo4j error so the caller's try/catch can console.warn.  (R6)
 */
export async function createPipelineOutputSeed(
  props: PipelineOutputSeedProps,
): Promise<void> {
  const query = `
    MERGE (s:Seed { id: $id })
    ON CREATE SET
      s.taskId            = $taskId,
      s.runId             = $runId,
      s.seedType          = $seedType,
      s.model             = $model,
      s.baseModelId       = $baseModelId,
      s.thinkingMode      = $thinkingMode,
      s.thinkingParameter = $thinkingParameter,
      s.outputFile        = $outputFile,
      s.taskLabel         = $taskLabel,
      s.completedAt       = $completedAt,
      s.createdAt         = timestamp()
    ON MATCH SET
      s.seedType          = $seedType,
      s.model             = $model,
      s.baseModelId       = $baseModelId,
      s.thinkingMode      = $thinkingMode,
      s.thinkingParameter = $thinkingParameter,
      s.outputFile        = $outputFile,
      s.taskLabel         = $taskLabel,
      s.completedAt       = $completedAt,
      s.updatedAt         = timestamp()
  `;
  await writeTransaction(query, { ...props });
}

/**
 * MERGE-upserts a :Bloom node representing the pipeline run as a whole.
 *
 * Distinct from the :PipelineRun label — no schema constraint collision.
 * Idempotent — safe to re-run.
 * Throws on Neo4j error so the caller's try/catch can console.warn.  (R6)
 */
export async function createPipelineRunBloom(
  props: PipelineRunBloomProps,
): Promise<void> {
  const query = `
    MERGE (b:Bloom { id: $id })
    ON CREATE SET
      b.runId       = $runId,
      b.intent      = $intent,
      b.startedAt   = $startedAt,
      b.completedAt = $completedAt,
      b.taskCount   = $taskCount,
      b.createdAt   = timestamp()
    ON MATCH SET
      b.intent      = $intent,
      b.startedAt   = $startedAt,
      b.completedAt = $completedAt,
      b.taskCount   = $taskCount,
      b.updatedAt   = timestamp()
  `;
  await writeTransaction(query, { ...props });
}

/**
 * MERGE-upserts a [:CONTAINS] edge from a :Bloom node to a :Seed node.
 *
 * Uses RELATIONSHIP_TYPES.CONTAINS === 'CONTAINS' per graph conventions.
 * Idempotent — safe to re-run.  (R5)
 * Throws on Neo4j error so the caller's try/catch can console.warn.  (R6)
 *
 * @param bloomId  The Bloom node id, typically `"run:${runId}"`.
 * @param seedId   The Seed node id, typically `"${runId}_${taskId}"`.
 */
export async function linkSeedToPipelineRun(
  bloomId: string,
  seedId: string,
): Promise<void> {
  // RELATIONSHIP_TYPES.CONTAINS === 'CONTAINS'
  const query = `
    MATCH (b:Bloom { id: $bloomId })
    MATCH (s:Seed  { id: $seedId  })
    MERGE (b)-[:CONTAINS]->(s)
  `;
  await writeTransaction(query, { bloomId, seedId });
}

// ─────────────────────────────────────────────────────────────────────────────
// END ADDED: pipeline-output helpers
// ─────────────────────────────────────────────────────────────────────────────
```

---

### File 2 of 2 — `scripts/seed-pipeline-m17-2026-03-06.ts` (new file)

```typescript
#!/usr/bin/env npx ts-node --esm
/**
 * scripts/seed-pipeline-m17-2026-03-06.ts
 *
 * Ingests the M17 pipeline run (2026-03-06) into the graph.
 *
 * Writes — all via MERGE, safe to re-run:
 *   •  1 :Bloom node           id = "run:m17-2026-03-06"
 *   • 13 :Seed  nodes          seedType = "pipeline-output"
 *   • 13 [:CONTAINS] edges     Bloom → Seed
 *
 * Non-fatal error policy  (R6):
 *   Every graph write sits inside its own try/catch.
 *   Failures are console.warn'd; the script continues to the next write.
 *
 * Usage:
 *   npx ts-node --esm scripts/seed-pipeline-m17-2026-03-06.ts
 */

import {
  createPipelineOutputSeed,
  createPipelineRunBloom,
  linkSeedToPipelineRun,
  type PipelineOutputSeedProps,
  type PipelineRunBloomProps,
} from '../src/graph/queries.js'; // .js convention required for ESM  (R9)

// ─── Run constants ────────────────────────────────────────────────────────────

const RUN_ID   = 'm17-2026-03-06' as const;
const BLOOM_ID = `run:${RUN_ID}`  as const; // R4

// ─── Manifest types ───────────────────────────────────────────────────────────

/**
 * One task row from the M17 pipeline manifest.
 * Reading the 13 .md output files is out of scope; metadata is sufficient.
 */
interface ManifestTask {
  taskId: string;
  taskLabel: string;
  /**
   * Compound model string.
   * Format: "<baseModelId>[:<thinkingMode>[:<thinkingParameter>]]"
   * Examples:
   *   "claude-opus-4-5:extended:16k"    thinkingParameter is a token budget
   *   "claude-opus-4-6:adaptive:medium" thinkingParameter is a qualitative label
   *   "claude-opus-4-5:none"            thinkingParameter is absent → ""
   */
  model: string;
  /** Stored as-is from manifest; may contain backslashes. */
  outputFile: string;
  completedAt: string;
}

interface Manifest {
  runId: string;
  intent: string;
  startedAt: string;
  completedAt: string;
  taskCount: number;
  tasks: ManifestTask[];
}

// ─── Inline manifest ──────────────────────────────────────────────────────────

const MANIFEST: Manifest = {
  runId:       RUN_ID,
  intent:      'Evaluate multi-model pipeline outputs for M17 benchmark suite',
  startedAt:   '2026-03-06T08:00:00.000Z',
  completedAt: '2026-03-06T11:47:23.000Z',
  taskCount:   13,
  tasks: [
    {
      taskId:      'task-01',
      taskLabel:   'Repository structure analysis',
      model:       'claude-opus-4-5:extended:16k',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-01-repo-structure.md',
      completedAt: '2026-03-06T08:14:52.000Z',
    },
    {
      taskId:      'task-02',
      taskLabel:   'Dependency graph extraction',
      model:       'claude-opus-4-5:extended:16k',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-02-dependency-graph.md',
      completedAt: '2026-03-06T08:31:07.000Z',
    },
    {
      taskId:      'task-03',
      taskLabel:   'API surface documentation',
      model:       'claude-opus-4-6:adaptive:medium',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-03-api-surface.md',
      completedAt: '2026-03-06T08:52:44.000Z',
    },
    {
      taskId:      'task-04',
      taskLabel:   'Test coverage analysis',
      model:       'claude-opus-4-5:none',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-04-test-coverage.md',
      completedAt: '2026-03-06T09:04:18.000Z',
    },
    {
      taskId:      'task-05',
      taskLabel:   'Security vulnerability scan',
      model:       'claude-opus-4-6:extended:32k',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-05-security-scan.md',
      completedAt: '2026-03-06T09:28:55.000Z',
    },
    {
      taskId:      'task-06',
      taskLabel:   'Performance bottleneck identification',
      model:       'claude-opus-4-5:extended:8k',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-06-perf-bottlenecks.md',
      completedAt: '2026-03-06T09:49:31.000Z',
    },
    {
      taskId:      'task-07',
      taskLabel:   'Refactoring opportunity mapping',
      model:       'claude-opus-4-6:adaptive:high',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-07-refactor-map.md',
      completedAt: '2026-03-06T10:08:12.000Z',
    },
    {
      taskId:      'task-08',
      taskLabel:   'Code smell detection',
      model:       'claude-opus-4-5:none',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-08-code-smells.md',
      completedAt: '2026-03-06T10:22:47.000Z',
    },
    {
      taskId:      'task-09',
      taskLabel:   'Architecture diagram generation',
      model:       'claude-opus-4-6:extended:16k',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-09-architecture.md',
      completedAt: '2026-03-06T10:45:03.000Z',
    },
    {
      taskId:      'task-10',
      taskLabel:   'Migration path planning',
      model:       'claude-opus-4-6:adaptive:medium',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-10-migration-plan.md',
      completedAt: '2026-03-06T11:03:28.000Z',
    },
    {
      taskId:      'task-11',
      taskLabel:   'Dead code identification',
      model:       'claude-opus-4-5:none',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-11-dead-code.md',
      completedAt: '2026-03-06T11:16:59.000Z',
    },
    {
      taskId:      'task-12',
      taskLabel:   'Type safety audit',
      model:       'claude-opus-4-6:adaptive:low',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-12-type-audit.md',
      completedAt: '2026-03-06T11:33:41.000Z',
    },
    {
      taskId:      'task-13',
      taskLabel:   'Documentation gap analysis',
      model:       'claude-opus-4-6:extended:32k',
      outputFile:  'docs\\pipeline-output\\m17-2026-03-06\\task-13-doc-gaps.md',
      completedAt: '2026-03-06T11:47:23.000Z',
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_THINKING_MODES = ['adaptive', 'extended', 'none', 'default'] as const;
type ThinkingMode = (typeof VALID_THINKING_MODES)[number];

/**
 * Splits a compound model string into its constituent seed properties.
 *
 * Split convention: first colon delimiter.  (R8, LOW risk)
 * This must stay consistent with how the Thompson router originally registered
 * these seeds; MERGE ON MATCH will silently overwrite baseModelId if the
 * derivation drifts.
 *
 *   "claude-opus-4-5:extended:16k"   → baseModelId "claude-opus-4-5",
 *                                       thinkingMode "extended",
 *                                       thinkingParameter "16k"   (token budget)
 *
 *   "claude-opus-4-6:adaptive:medium" → baseModelId "claude-opus-4-6",
 *                                       thinkingMode "adaptive",
 *                                       thinkingParameter "medium" (qualitative)
 *
 *   "claude-opus-4-5:none"           → baseModelId "claude-opus-4-5",
 *                                       thinkingMode "none",
 *                                       thinkingParameter ""
 */
function parseModelString(model: string): {
  baseModelId: string;
  thinkingMode: ThinkingMode;
  thinkingParameter: string;
} {
  const parts = model.split(':');

  const baseModelId        = parts[0] ?? model;
  const rawMode            = parts[1] ?? 'none';
  const thinkingParameter  = parts[2] ?? '';

  const thinkingMode: ThinkingMode = (
    VALID_THINKING_MODES as readonly string[]
  ).includes(rawMode)
    ? (rawMode as ThinkingMode)
    : 'none';

  return { baseModelId, thinkingMode, thinkingParameter };
}

/** Assembles a fully-typed PipelineOutputSeedProps from one manifest task row. */
function buildSeedProps(task: ManifestTask): PipelineOutputSeedProps {
  const { baseModelId, thinkingMode, thinkingParameter } =
    parseModelString(task.model);

  return {
    id:                 `${RUN_ID}_${task.taskId}`, // R1
    taskId:             task.taskId,
    runId:              RUN_ID,
    seedType:           'pipeline-output',           // R2
    model:              task.model,
    baseModelId,                                     // R8
    thinkingMode,                                    // R7
    thinkingParameter,
    outputFile:         task.outputFile,
    taskLabel:          task.taskLabel,
    completedAt:        task.completedAt,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { tasks } = MANIFEST;

  console.log(
    `\n▶  Seeding pipeline run ${RUN_ID}` +
    `  (${tasks.length} tasks → ${tasks.length * 2 + 1} graph writes)\n`,
  );

  // ── Step 1: Upsert the Bloom node for the run ──────────────────────────────

  const bloomProps: PipelineRunBloomProps = {
    id:          BLOOM_ID,
    runId:       MANIFEST.runId,
    intent:      MANIFEST.intent,
    startedAt:   MANIFEST.startedAt,
    completedAt: MANIFEST.completedAt,
    taskCount:   MANIFEST.taskCount,
  };

  try {
    await createPipelineRunBloom(bloomProps);
    console.log(`  ✔  Bloom  ${BLOOM_ID}`);
  } catch (err) {
    // Non-fatal: note and continue.  The Seed writes are still attempted so
    // a subsequent re-run (once the DB recovers) will link them correctly.
    console.warn(`  ✘  Bloom  ${BLOOM_ID} — write failed, continuing:`, err);
  }

  // ── Step 2: Upsert each Seed node, then its CONTAINS edge ─────────────────

  for (const task of tasks) {
    const seedProps = buildSeedProps(task);
    const seedId    = seedProps.id;

    // 2a. Seed node
    try {
      await createPipelineOutputSeed(seedProps);
      console.log(
        `  ✔  Seed   ${seedId}` +
        `  [${seedProps.thinkingMode}:${seedProps.thinkingParameter || '—'}]` +
        `  model=${seedProps.baseModelId}`,
      );
    } catch (err) {
      console.warn(`  ✘  Seed   ${seedId} — write failed, continuing:`, err);
    }

    // 2b. CONTAINS edge  Bloom → Seed
    try {
      await linkSeedToPipelineRun(BLOOM_ID, seedId);
      console.log(`  ✔  Edge   ${BLOOM_ID} -[:CONTAINS]-> ${seedId}`);
    } catch (err) {
      console.warn(
        `  ✘  Edge   ${BLOOM_ID} → ${seedId} — write failed, continuing:`,
        err,
      );
    }
  }

  console.log(`\n✓  Done — ${RUN_ID} ingested.\n`);
}

main().catch((err) => {
  // Only reached for bugs in the script itself, not graph write failures.
  console.error('\nFatal error in seed script:', err);
  process.exit(1);
});
```

---

## Decision log

| Decision | Rationale |
|---|---|
| `PipelineOutputSeedProps` is standalone, not `extends SeedProps` | `seedType` absent from `SeedProps`; coupling would produce a structural mismatch until the base type is updated |
| `createPipelineRunBloom` added alongside the two named functions | Needed to fulfil R4; naming follows the `create*` convention already present in the file |
| `ON CREATE SET` carries `taskId`/`runId`; `ON MATCH SET` omits them | Identity fields are baked into `id` — no value in overwriting on re-run |
| `thinkingParameter = ''` when segment is absent | Preserves type consistency; `""` is unambiguously "not set" without a nullable field |
| `parseModelString` falls back to `'none'` for unrecognised mode segment | Future models may omit the segment; silent fallback is safer than throwing during an ingest run |
| Bloom write is non-fatal but logged as `✘` | Even if the Bloom write fails, Seed writes are attempted so a re-run after DB recovery can complete the graph without skipping seeds |