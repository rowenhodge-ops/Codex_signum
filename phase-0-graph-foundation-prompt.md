# Phase 0: Graph Foundation — Coding Session Prompt

**Date:** 2026-02-27
**Scope:** Codex_signum (core) + DND-Manager (consumer)
**Reference:** `codex-signum-lean-process-maps-v2.md` §8 (Implementation Sequence, Phase 0)
**Depends on:** Nothing. This is the foundation everything else builds on.
**Estimated:** 1 session

---

## Context for the Coding Agent

You are working on two repositories:
1. **Codex_signum** — the core governance library (`@codex-signum/core`)
2. **DND-Manager** — the consumer application that uses the core

Phase 0 establishes the graph foundation that all subsequent phases depend on. Without this, nothing can route to live models, write observations, or learn from execution.

### What Already Exists (DO NOT recreate)

**In Codex_signum (`src/graph/queries.ts`):**
- `AgentProps` interface — comprehensive, includes all needed fields (capabilities, cost, sentinel, infrastructure)
- `createAgent()` — MERGE with ON CREATE/ON MATCH
- `listActiveAgents()` — WHERE status = 'active'
- `listActiveAgentsByCapability()` — filtered query
- `recordDecision()` / `recordDecisionOutcome()` — Decision node lifecycle
- `recordObservation()` — with [:OBSERVED_BY] relationship
- `getArmStatsForCluster()` — Thompson Sampling arm computation
- `ensureContextCluster()` — context cluster management
- `updatePatternPhiL()` — SET ΦL on Pattern node
- Full topology queries for containment hierarchy, adjacency, degree

**In Codex_signum (`src/graph/schema.ts`):**
- Schema creation for: Agent, Pattern, Decision, ConstitutionalRule, Observation, Distillation, Seed, Resonator, Grid, Helix, ContextCluster
- Indexes and constraints

**In DND-Manager (`agent/scripts/seedAgents.ts`):**
- Agent seeding script using `ensureAgentNodes()` — imports from models.ts
- Uses `createAgent` from `@codex-signum/core`

**In DND-Manager (`agent/routing/models.ts`):**
- Model registry with 20+ active models across 4 providers (Anthropic, Vertex Gemini, Vertex Mistral, DeepSeek)
- Single source of truth for model configuration

**In DND-Manager (`agent/graph/Tracer.ts`):**
- Legacy Neo4j tracer writing `Execution`, `Model`, `Stage`, `ToolCall`, `Hallucination` nodes (DND legacy schema)

**In DND-Manager (`agent/graph/client.ts`):**
- Neo4j driver initialization, may include legacy schema creation

---

## Task 1: Verify Agent Seeding (DND-Manager)

**Goal:** Confirm `seedAgents.ts` successfully populates Agent nodes using the core's `createAgent()`.

```bash
cd DND-Manager

# 1. Check seedAgents.ts imports and logic
cat agent/scripts/seedAgents.ts

# 2. Check what models.ts exports
cat agent/routing/models.ts | head -100

# 3. Verify the core dependency is installed
cat package.json | grep codex-signum

# 4. Run the seed script (requires Neo4j running)
npx tsx agent/scripts/seedAgents.ts
```

**Verify:**
```cypher
MATCH (a:Agent) RETURN count(a) AS total, 
  count(CASE WHEN a.status = 'active' THEN 1 END) AS active,
  count(CASE WHEN a.status = 'retired' THEN 1 END) AS retired
```

**Expected:** 20+ active agents, 5 retired agents. Every active Agent node has: `id`, `name`, `provider`, `model`, `status = 'active'`, `costPer1kInput`, `costPer1kOutput`, `capabilities`.

**If seedAgents.ts doesn't work or doesn't map all AgentProps fields:**
Fix the mapping. The `models.ts` config has fields like `costPer1kInput`, `costPer1kOutput`, `strengths`, `provider`, `model` (API string). Map them to the core's `AgentProps`:

```typescript
// Required mapping from models.ts → AgentProps
{
  id: config.id,                        // e.g., "claude-opus-4-6"
  name: config.displayName,             // e.g., "Claude Opus 4.6"
  provider: config.provider,            // "anthropic" | "vertex-gemini" | etc.
  model: config.model,                  // API model string
  baseModelId: config.baseModelId ?? config.id,
  thinkingMode: config.thinkingMode ?? "default",
  thinkingParameter: config.thinkingParameter,
  capabilities: config.strengths ?? [],
  supportsAdaptiveThinking: config.supportsAdaptiveThinking ?? false,
  supportsExtendedThinking: config.supportsExtendedThinking ?? false,
  supportsInterleavedThinking: config.supportsInterleavedThinking ?? false,
  supportsPrefilling: config.supportsPrefilling ?? true,
  supportsStructuredOutputs: config.supportsStructuredOutputs ?? false,
  maxContextWindow: config.maxContextWindow ?? 200000,
  maxOutputTokens: config.maxOutputTokens ?? 8192,
  costPer1kInput: config.costPer1kInput,
  costPer1kOutput: config.costPer1kOutput,
  avgLatencyMs: config.benchmarks?.avgTimeMs,
  status: config.retired ? "retired" : "active",
  region: config.region ?? "direct",
  endpoint: config.endpoint ?? "messages",
}
```

**Commit:** `fix(seed): ensure seedAgents maps all AgentProps fields from models.ts`

---

## Task 2: Schema Migration — Map DND Legacy to Codex (DND-Manager)

**Goal:** Eliminate the dual schema. DND-Manager's `Tracer.ts` writes `Execution`, `Model`, `Stage` nodes. These must become `Decision`, `Agent`, `Observation` nodes (Codex schema).

### Step 2a: Audit the legacy schema

```bash
# What node labels does Tracer.ts create?
grep -n "MERGE\|CREATE" agent/graph/Tracer.ts | head -30

# What does client.ts create?
grep -n "MERGE\|CREATE\|CONSTRAINT\|INDEX" agent/graph/client.ts
```

Document what you find. The expected legacy labels are: `Execution`, `Model`, `Stage`, `ToolCall`, `Hallucination`, `Hypothesis`, `Learning`, `TaskType`.

### Step 2b: Create migration Cypher

Create `agent/scripts/migrateSchema.ts`:

```typescript
/**
 * Schema Migration: DND Legacy → Codex Schema
 * 
 * Maps: Execution → Decision, Model → Agent, Stage → Observation
 * 
 * Run ONCE. Idempotent (safe to re-run).
 * Does NOT delete legacy nodes — adds Codex labels and relationships.
 * 
 * Reference: codex-signum-lean-process-maps-v2.md §4.2 (NFR-G8: Schema convergence)
 */

// Migration queries:
// 1. Add :Decision label to existing :Execution nodes
//    MATCH (e:Execution) WHERE NOT e:Decision SET e:Decision
//
// 2. Map Execution properties → Decision properties
//    MATCH (e:Execution) WHERE NOT exists(e.taskType)
//    SET e.taskType = COALESCE(e.type, 'code_generation'),
//        e.complexity = COALESCE(e.complexity, 'moderate'),
//        e.wasExploratory = COALESCE(e.wasExploratory, false),
//        e.selectedAgentId = e.modelId
//
// 3. Verify Agent nodes exist for all models referenced in legacy data
//    MATCH (e:Execution) WHERE e.modelId IS NOT NULL
//    WITH DISTINCT e.modelId AS modelId
//    MATCH (a:Agent {id: modelId}) RETURN modelId, a.status
//    // Any missing? Log them for manual resolution.
//
// 4. Create [:SELECTED] relationships from Decision → Agent
//    MATCH (d:Decision) WHERE d.selectedAgentId IS NOT NULL
//    MATCH (a:Agent {id: d.selectedAgentId})
//    MERGE (d)-[:SELECTED]->(a)
//
// 5. Remove legacy schema creation from client.ts
//    (After migration verified)
```

**IMPORTANT:** Do NOT delete legacy nodes. Add Codex labels alongside legacy labels. This preserves history and allows rollback.

**After migration, verify:**
```cypher
// All Execution nodes should also be Decision nodes
MATCH (e:Execution) WHERE NOT e:Decision RETURN count(e) AS unmigrated
// Should return 0

// All Decision nodes should have [:SELECTED] to an Agent
MATCH (d:Decision) WHERE NOT (d)-[:SELECTED]->(:Agent) RETURN count(d) AS unlinked
// Should be 0 (or log which ones have no matching Agent)
```

**Commit:** `feat(migration): add schema migration script — Execution→Decision, Model→Agent`

### Step 2c: Update Tracer.ts to write Codex schema

After migration is verified, update `agent/graph/Tracer.ts` to write Decision/Observation nodes instead of Execution/Stage nodes going forward. This is the consumer's graph-feeder — it should use the core's `recordDecision()` and `recordObservation()` functions.

**Key principle from lean-process-maps-v2.md §3:** Tracer.ts IS the graph-feeder. It writes observations and decisions inline. It does NOT route through an Observer pattern. It calls `conditionValue()` and `computePhiL()` as inline functions during writes.

For now (Phase 0), just switch to Codex node labels. Inline conditioning comes in Phase 2.

```typescript
// BEFORE (legacy):
// MERGE (e:Execution {id: ...})
// MERGE (s:Stage {id: ...})

// AFTER (Codex):
import { recordDecision, recordDecisionOutcome, recordObservation } from '@codex-signum/core';
// Use core functions instead of raw Cypher
```

If this is too large a change for one task, create a thin adapter layer:
```typescript
// agent/graph/codexTracer.ts — new file, wraps core functions
// Tracer.ts → imports from codexTracer.ts instead of writing raw Cypher
```

**Commit:** `refactor(tracer): write Codex schema nodes (Decision/Observation) instead of legacy (Execution/Stage)`

### Step 2d: Remove legacy schema creation from client.ts

Once Tracer.ts writes Codex schema, remove the legacy CONSTRAINT/INDEX creation from `agent/graph/client.ts`. The core's `schema.ts` handles Codex schema creation.

```bash
# Check what client.ts creates
cat agent/graph/client.ts
```

Remove any `CREATE CONSTRAINT` or `CREATE INDEX` for legacy labels (Execution, Model, Stage, ToolCall, Hallucination, Hypothesis, Learning, TaskType). Keep the Neo4j driver initialization — that stays.

**Commit:** `chore(schema): remove legacy schema creation from DND client.ts`

---

## Task 3: Register Pattern Nodes (Codex_signum)

**Goal:** Ensure Pattern nodes exist in the graph for the four implemented patterns.

The core's `createPattern()` already handles this. Create a bootstrap that registers patterns:

```typescript
// In core: src/bootstrap/patterns.ts (or add to existing bootstrap)
import { createPattern } from '../graph/queries.js';

export async function bootstrapPatterns(): Promise<void> {
  const patterns = [
    {
      id: 'thompson-router',
      name: 'Thompson Router',
      description: 'Bayesian model selection via Thompson Sampling',
      morphemeKinds: ['resonator'],
      domain: 'core',
    },
    {
      id: 'dev-agent',
      name: 'DevAgent Pipeline',
      description: '4-stage coding pipeline with correction helix',
      morphemeKinds: ['bloom', 'helix'],
      domain: 'core',
    },
    {
      id: 'architect',
      name: 'Architect Pipeline',
      description: '7-stage intent-to-execution planning',
      morphemeKinds: ['bloom'],
      domain: 'core',
    },
    {
      id: 'model-sentinel',
      name: 'Model Sentinel',
      description: 'Provider API probing and model discovery',
      morphemeKinds: ['resonator'],
      domain: 'core',
      state: 'design',
    },
  ];

  for (const p of patterns) {
    await createPattern(p);
  }
}
```

**Verify:**
```cypher
MATCH (p:Pattern) RETURN p.id, p.name, p.morphemeKinds, p.domain
```

Expected: 4 Pattern nodes (thompson-router, dev-agent, architect, model-sentinel).

**Commit:** `feat(bootstrap): register core Pattern nodes in graph`

---

## Task 4: Verify ContextCluster Auto-Creation (Codex_signum)

**Goal:** Verify that `ensureContextCluster()` works and that Thompson Sampling can compute arm stats for a fresh cluster.

Write a simple integration test (or verify manually):

```typescript
// Test: create a cluster, record a decision + outcome, query arm stats
import { ensureContextCluster, recordDecision, recordDecisionOutcome, getArmStatsForCluster } from '@codex-signum/core';

// 1. Create cluster
await ensureContextCluster({
  id: 'test-code-generation-complex',
  taskType: 'code_generation',
  complexity: 'complex',
});

// 2. Record a decision
await recordDecision({
  id: 'test-dec-001',
  taskType: 'code_generation',
  complexity: 'complex',
  selectedAgentId: 'claude-opus-4-6',  // Must exist as Agent node
  wasExploratory: false,
  contextClusterId: 'test-code-generation-complex',
});

// 3. Record outcome
await recordDecisionOutcome({
  decisionId: 'test-dec-001',
  success: true,
  qualityScore: 0.85,
  durationMs: 12000,
  cost: 0.05,
});

// 4. Query arm stats
const stats = await getArmStatsForCluster('test-code-generation-complex');
// Should return: claude-opus-4-6 with alpha=2, beta=1, totalTrials=1
```

This validates the full Decision lifecycle: create → outcome → arm stats computation. Phase 1 wraps this in `selectModel()`.

**Commit:** `test(graph): verify Decision→outcome→arm-stats lifecycle`

---

## Task 5: Document Reconciliation Notes

**Goal:** Add supersession notices to documents that reference Observer as a pattern.

### 5a: `codex-signum-implementation-README.md` (Codex_signum repo)

TASK 5 describes "Observer Pattern" with `collector.ts`, `evaluator.ts`, `auditor.ts`. Add a note at the top of that section:

```markdown
> **⚠️ SUPERSEDED:** The Observer Pattern described below has been eliminated.
> Observation, signal conditioning, and health computation are inline functions
> in the graph write path, not a separate pattern. See `lean-process-maps-audit.md`
> for the full analysis. The Retrospective pattern (§2.4 of lean-process-maps-v2.md)
> replaces the evaluator/auditor functions. The collector function is handled by
> the consumer's graph-feeder hook.
```

### 5b: `phase-3-reconciliation-fixes.md` (Codex_signum repo)

Fix 3 adds `GraphObserver` interface. Add note:

```markdown
> **⚠️ SUPERSEDED:** Fix 3 (Observer GraphObserver interface) is no longer needed.
> The Observer pattern was deleted as an anti-pattern violation (monitoring overlay).
> Graph-backed observation is now inline in the consumer's graph-feeder hook.
> See `lean-process-maps-audit.md` Violation 1.
```

### 5c: `finish-architect-pattern-prompt.md` (Codex_signum repo)

Step 4 adds `GraphObserver` interface. Add note:

```markdown
> **⚠️ SUPERSEDED:** Step 4 (GraphObserver interface) is no longer needed.
> Observer pattern eliminated. See `lean-process-maps-audit.md`.
```

### 5d: CLAUDE.md anti-pattern table

If CLAUDE.md exists in either repo, verify anti-pattern #1 explicitly names "Observer pattern" as an example. If not, add it:

```
| 1 | Observation pipelines / monitoring overlays (e.g., Observer pattern, separate Signal Pipeline, Health Computation as infrastructure) | State is structural. Graph-feeder writes observations inline. conditionValue() and computePhiL() are pure functions called during writes, not routed through intermediaries. |
```

**Commit:** `docs: add supersession notices for Observer pattern references`

---

## Verification Checklist (Phase 0 Complete When All Pass)

```
□ Agent nodes in graph: MATCH (a:Agent) RETURN count(a) ≥ 20
□ All active agents have: id, name, provider, model, status='active', costPer1kInput
□ Retired agents have: status='retired' (not deleted)
□ Pattern nodes in graph: MATCH (p:Pattern) RETURN count(p) = 4
□ Legacy Execution nodes have :Decision label added
□ Decision→Agent [:SELECTED] relationships exist
□ Tracer.ts writes Codex schema (or adapter in place)
□ Legacy schema creation removed from DND client.ts
□ ContextCluster can be created
□ Decision→outcome→arm-stats lifecycle works end-to-end
□ Observer pattern supersession notices added to 3 documents
□ CLAUDE.md anti-pattern table updated
□ npx tsc --noEmit passes in both repos
□ npm test passes in Codex_signum (125 tests)
```

---

## What NOT to Do

- **Do NOT create `selectModel()`** — that's Phase 1
- **Do NOT wire DevAgent to Thompson Router** — that's Phase 2
- **Do NOT add signal conditioning inline** — that's Phase 2
- **Do NOT delete legacy nodes** — add Codex labels alongside them
- **Do NOT create an Observer pattern, observer.ts, collector.ts, or evaluator.ts**
- **Do NOT create wrapper functions around graph queries** — consumers read Pattern node properties directly via Cypher
- **Do NOT store state in JSON files** — all state goes to Neo4j
- **Do NOT use LangChain imports** in any new code

---

## Files to Read First

Before starting, read these files in order:
1. `codex-signum-lean-process-maps-v2.md` §4 (Node Types), §4.2 (NFR-G8), §7 (Gap Analysis), §8 (Implementation Sequence)
2. `lean-process-maps-audit.md` — understand WHY Observer was eliminated
3. `src/graph/queries.ts` (Codex_signum) — understand what graph functions exist
4. `src/graph/schema.ts` (Codex_signum) — understand current schema
5. `agent/scripts/seedAgents.ts` (DND-Manager) — understand current seeding
6. `agent/routing/models.ts` (DND-Manager) — understand model registry
7. `agent/graph/Tracer.ts` (DND-Manager) — understand legacy schema writes
8. `agent/graph/client.ts` (DND-Manager) — understand legacy schema creation

---

*Phase 0 establishes the graph as the single source of truth. Every subsequent phase reads from and writes to this foundation. If Agent nodes aren't right, Thompson can't route. If Pattern nodes don't exist, health can't be tracked. If the dual schema persists, queries return garbage. Get this right first.*