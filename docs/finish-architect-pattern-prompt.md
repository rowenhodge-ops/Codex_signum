# Finish Building the Architect Pattern

## READ CLAUDE.md FIRST

Two sequential sessions. Part A runs in `Codex_signum`. Part B runs in `DND-Manager`. Do NOT start Part B until Part A is committed and pushed.

---

# PART A — Codex_signum Core: Phase 3 Fixes + Build

**Working directory:** `Codex_signum` repo  
**Branch:** `main` (commit directly — these are spec-mandated corrections)

## Step 0: Verify Starting State

```bash
git status
git log --oneline -5
# EXPECTED HEAD: de8fb78 or later

# Check for uncommitted work from prior sessions
git stash list

# Verify test baseline
npm test 2>&1 | tail -5
# Record the test count. Expected: 329+ passing (may be higher if G-10 was committed locally)

npx tsc --noEmit
```

If there are uncommitted changes, STOP and list them. Do not proceed without a clean working tree.

---

## Step 1: Budget-Capped Dampening (SAFETY-CRITICAL)

**File:** `src/computation/dampening.ts`

This is the highest priority fix. The current hub dampening formula `γ_base/√k` produces supercritical cascades (μ > 1) for branching factor k ≥ 3. 

**Read the file first:**
```bash
cat src/computation/dampening.ts
```

**Required change:** Replace ALL dampening computation with budget-capped formula:

```
γ_effective(k) = min(γ_base, s / k)    where s = 0.8 (safety budget)
```

This applies to ALL nodes — there is no longer a separate "hub dampening" vs "standard dampening" distinction. Budget-capped dampening handles both cases correctly:
- k=1: min(0.7, 0.8/1) = 0.7 (standard)
- k=2: min(0.7, 0.8/2) = 0.4 (safe)
- k=5: min(0.7, 0.8/5) = 0.16 (very damped)
- k=10: min(0.7, 0.8/10) = 0.08 (heavily damped)

**Implementation:**
1. Add `SAFETY_BUDGET = 0.8` constant
2. Replace `computeGammaEffective()` body with: `Math.min(gammaBase, SAFETY_BUDGET / k)`
3. If `computeHubDampening()` exists as a separate function, deprecate it — route to the same budget-capped formula
4. Keep algedonic bypass: `if (phiL < 0.1) return 1.0` — this MUST remain

**Update tests:**
```bash
grep -rn "computeGammaEffective\|computeHubDampening\|dampening" tests/ --include="*.ts" | head -20
```

Update existing dampening tests to expect `min(γ_base, 0.8/k)`. Add a test proving subcriticality:

```typescript
it('guarantees μ < 1 for all practical branching factors', () => {
  for (let k = 1; k <= 20; k++) {
    const gamma = computeGammaEffective(k, 0.7);
    const spectralRadius = k * gamma;
    expect(spectralRadius).toBeLessThan(1.0);
  }
});
```

Also update `cascade-prevention.ts` if it calls the old hub dampening function directly.

```bash
grep -rn "computeHubDampening\|gammaBase.*sqrt\|√k" src/ --include="*.ts"
```

Fix all call sites.

**Verify:**
```bash
npx tsc --noEmit
npm test
```

**Commit:** `fix(safety): budget-capped dampening min(γ_base, s/k) replaces √k formula — guarantees subcriticality`

---

## Step 2: Cascade Probability Documentation

**Files:** Any file referencing "28.6%" cascade probability.

```bash
grep -rn "28\.6" src/ docs/ tests/ --include="*.ts" --include="*.md"
```

The correct cascade probability for γ=0.7, k=2, depth=2 is **81.6%** (binomial model), not 28.6% (geometric — wrong model). Update any references. If none found, move on.

**Commit (if changes):** `docs: correct cascade probability 28.6% → 81.6% (binomial, not geometric)`

---

## Step 3: Constitutional Evolution Lifecycle

**Check current state:**
```bash
cat src/constitutional/evolution.ts 2>/dev/null || echo "FILE DOES NOT EXIST"
cat src/types/constitutional.ts | grep -A 5 "AmendmentTier"
```

If `evolution.ts` doesn't exist or is just a type stub, build the full lifecycle.

**Read the types first** — `AmendmentTier` type should already exist in `src/types/constitutional.ts`.

**Create `src/constitutional/evolution.ts`:**

The amendment lifecycle has 8 states: proposed → experimenting → evaluating → voting → ratified → active (or rejected/reverted at any stage).

**Functions to implement:**

1. `proposeAmendment(tier, change, existingAmendments)` → Amendment | Error
   - Validates rate limits: max 5/3/1 simultaneous per Tier 1/2/3
   - Validates cooling periods: 0/3/12 months since last same-tier ratification
   - Returns the new Amendment in `proposed` state

2. `evaluateAmendment(amendment)` → { passed: boolean, reasons: string[] }
   - Checks minimum experiment duration: 3/6/12 months per Tier 1/2/3
   - Checks minimum sample size: proportional to network
   - Requires ALL three gradients positive: ΦL, ΨH, Ω

3. `checkConsensus(amendment, votes)` → { reached: boolean, approval: number }
   - Tier 1: 67% approval threshold
   - Tier 2: 80% approval threshold  
   - Tier 3: 90% approval threshold

4. `transitionAmendment(amendment, targetState)` → Amendment | Error
   - Validates state transitions (proposed → experimenting → evaluating → voting → ratified → active)
   - No skipping states

**Tier constants:**
```typescript
export const TIER_CONFIG = {
  1: { maxSimultaneous: 5, coolingMonths: 0, experimentMonths: 3, consensusThreshold: 0.67 },
  2: { maxSimultaneous: 3, coolingMonths: 3, experimentMonths: 6, consensusThreshold: 0.80 },
  3: { maxSimultaneous: 1, coolingMonths: 12, experimentMonths: 12, consensusThreshold: 0.90 },
} as const;
```

**Export from barrel:**
```bash
cat src/constitutional/index.ts
```
Add exports for the new functions and types.

**Tests** in `tests/conformance/constitutional-evolution.test.ts`:
- Tier 1 proposal succeeds
- Rate limit enforcement (5 active Tier 1 proposals → reject 6th)
- Cooling period enforcement for Tier 3
- Minimum experiment duration check
- All three gradient improvements required
- Consensus threshold per tier
- Valid state transitions only

```bash
npx tsc --noEmit
npm test
```

**Commit:** `feat(constitutional): amendment lifecycle — propose, evaluate, vote, ratify with tier thresholds`

---

> **SUPERSEDED:** Step 4 (GraphObserver interface) is no longer needed.
> Observer pattern eliminated. See `lean-process-maps-audit.md`.

## Step 4: Observer GraphObserver Interface

**Check current state:**
```bash
ls src/patterns/observer/
cat src/patterns/observer/*.ts
```

**Add `GraphObserver` interface** — this allows the Observer pattern to query state from the graph rather than in-memory:

```typescript
export interface GraphObserver {
  queryPhiLTrajectory(nodeId: string, windowSize: number): Promise<number[]>;
  queryEpsilonRDistribution(nodeId: string): Promise<number[]>;
  queryPsiH(subgraphId: string): Promise<{ psiH: number; eigengap: number }>;
  queryDecisionAggregation(patternId: string): Promise<Array<{ modelId: string; successRate: number; count: number }>>;
  queryCascadePaths(nodeId: string): Promise<Array<{ path: string[]; maxGamma: number }>>;
}

export type ObserverMode = 'in-memory' | 'graph-backed';
```

If an Observer class exists, add optional `GraphObserver` injection to its constructor with mode selection.

**Export from barrel.**

**Add basic tests** for interface existence and mode selection.

```bash
npx tsc --noEmit
npm test
```

**Commit:** `feat(observer): add GraphObserver interface for graph-backed observation mode`

---

## Step 5: False Positive Suppression in Reconcile

**File:** `scripts/reconcile.ts`

```bash
cat scripts/reconcile.ts | head -50
```

If the reconciliation script flags core importing from itself as a "divergence," add suppression for self-imports. Also improve multi-line claim extraction if the character window is too narrow (increase from 8000 to 16000 chars for research papers).

This is a quality-of-life fix. If reconcile.ts doesn't exist or doesn't have this problem, skip.

**Commit (if changes):** `fix(reconcile): suppress self-import false positives, widen claim extraction window`

---

## Step 6: Duplicate Document Cleanup

```bash
ls docs/research/ | grep -i "parameter.*validation"
```

If there are two Parameter Validation documents, diff them. Keep the comprehensive one, delete the shorter one. Update any references.

**Commit (if changes):** `docs: remove duplicate Parameter Validation document`

---

## Step 7: SURVEY Pattern Improvement

**File:** `src/patterns/architect/survey.ts`

Read the `extractClaims()` function (or equivalent):
```bash
grep -n "extractClaims\|CRITICAL_TERM" src/patterns/architect/survey.ts | head -20
```

Add multi-line claim extraction for critical term pairs that span multiple lines:
- `['hub', '√k']` and `['hub', 'sqrt(k)']`
- `['supercritical', 'dampening']`
- `['cascade', 'probability']`

Two terms within 500 characters of each other → extract as a warning claim.

**Commit:** `feat(survey): multi-line claim extraction for critical term pairs`

---

## Step 8: Build, Verify, Push

```bash
# Full verification
npx tsc --noEmit
npm test
# Record test count — should be higher than baseline from Step 0

# Build dist
npm run build

# Commit dist
git add dist/
git commit -m "build: Phase 3 fixes — budget-capped dampening, constitutional evolution, observer interface"

# Push
git push origin main

# Record the HEAD SHA for Part B
git rev-parse HEAD
```

**GATE: Part A is complete when all tests pass, dist is committed, and main is pushed. Record the SHA.**

---
---

# PART B — DND-Manager: Integration + End-to-End Validation

**Working directory:** `DND-Manager` repo  
**Branch:** `main`

## Step 0: Verify Starting State

```bash
git status
git log --oneline -5
# EXPECTED HEAD: d4808e8 or later

# Verify remote is correct (origin → DND-Manager, NOT Codex_signum)
git remote -v
# If origin points to Codex_signum.git, fix:
# git remote set-url origin https://github.com/rowenhodge-ops/DND-Manager.git

npx tsc --noEmit
npm test 2>&1 | tail -5
# Record test count. Expected: 2204/2205 passing.
```

---

## Step 1: Update Core Dependency

```bash
# Install latest core (should include Part A's Phase 3 fixes)
npm install github:rowenhodge-ops/Codex_signum#main

# Verify the update
grep "codex-signum" node_modules/@codex-signum/core/package.json | head -3
cat node_modules/@codex-signum/core/dist/constitutional/evolution.js | head -5
# Should show the new constitutional evolution exports

# Type check
npx tsc --noEmit
```

If tsc fails, fix import issues. Common causes:
- New exports that changed type shapes
- Removed `computeHubDampening` that DND might reference
- New required parameters

```bash
grep -rn "computeHubDampening" agent/ --include="*.ts"
grep -rn "computeGammaEffective" agent/ --include="*.ts"
```

Fix any references to the old dampening API.

```bash
npx tsc --noEmit
npm test
```

**Commit:** `chore: update @codex-signum/core to latest (Phase 3 fixes)`

---

## Step 2: Validate Architect Components Individually

Before running the full pipeline, verify each component works in isolation.

### 2a. Survey

```bash
cat agent/patterns/architect/survey.ts
```

The survey does filesystem + git inspection. Test it:

```typescript
// Add to tests or run as a script:
import { survey } from './agent/patterns/architect/survey.js';
const result = await survey('test: verify survey output shape', process.cwd());
console.log(JSON.stringify(result, null, 2));
```

Quick validation script:
```bash
npx tsx -e "
import { survey } from './agent/patterns/architect/survey.js';
survey('validate survey output', process.cwd())
  .then(r => {
    console.log('Survey returned:', Object.keys(r));
    console.log('Confidence:', r.confidence);
    console.log('Structure length:', r.codebase_state?.structure?.length ?? 'MISSING');
    console.log('Recent changes:', r.codebase_state?.recent_changes?.length ?? 'MISSING');
    console.log('Blind spots:', r.blind_spots);
  })
  .catch(e => console.error('SURVEY FAILED:', e.message));
"
```

If the survey fails (e.g., Neo4j not running, missing git config), diagnose and fix. The survey MUST work — it feeds DECOMPOSE.

If Neo4j is not available, add a graceful fallback:
- `graph_state` should be nullable in the DND `SurveyOutput` type
- When Neo4j is unavailable, survey should still return filesystem + git data with `graph_state: null` and a blind spot noting "Neo4j unavailable"

### 2b. Model Executor

The model executor needs API keys. Check what's configured:

```bash
# Check for environment variables
env | grep -i "ANTHROPIC\|OPENAI\|MISTRAL\|GOOGLE" | sed 's/=.*/=<set>/'

# Check for .env file
cat .env 2>/dev/null | grep -i "key" | sed 's/=.*/=<set>/'

# Check what models are available
cat agent/routing/models.ts | head -40
```

If no API keys are configured, the model executor will fail. This is expected for a first integration test. Create a **mock model executor** for testing:

Create `agent/patterns/architect/mock-model-executor.ts`:
```typescript
import type { ModelExecutor, ModelExecutorContext, ModelExecutorResult } from "@codex-signum/core";

/**
 * Mock ModelExecutor for integration testing without API keys.
 * Returns structured responses that the DECOMPOSE stage can parse.
 */
export function createMockModelExecutor(): ModelExecutor {
  return {
    async execute(prompt: string, _context?: ModelExecutorContext): Promise<ModelExecutorResult> {
      const start = Date.now();
      
      // Generate a plausible task decomposition response
      const response = generateMockDecomposition(prompt);
      
      return {
        text: response,
        modelId: "mock-model-v1",
        durationMs: Date.now() - start,
        wasExploratory: false,
      };
    },
  };
}

function generateMockDecomposition(prompt: string): string {
  // Return a JSON task graph that DECOMPOSE expects
  return JSON.stringify({
    tasks: [
      {
        task_id: "task_1",
        title: "Verify starting state",
        description: "Check git status, branch, and test baseline",
        type: "mechanical",
        estimated_complexity: "low",
        dependencies: [],
        files_affected: [],
        acceptance_criteria: ["Git status is clean", "All tests pass"],
        specification_refs: [],
        verification: "git status && npm test",
        commit_message: "chore: verify starting state",
      },
      {
        task_id: "task_2", 
        title: "Execute primary change",
        description: "Make the requested change based on intent",
        type: "generative",
        estimated_complexity: "medium",
        dependencies: ["task_1"],
        files_affected: ["src/placeholder.ts"],
        acceptance_criteria: ["Change compiles", "Tests pass"],
        specification_refs: [],
        verification: "npx tsc --noEmit && npm test",
        commit_message: "feat: execute primary change",
      },
    ],
  });
}
```

### 2c. Task Executor

Read the task executor:
```bash
cat agent/patterns/architect/dnd-task-executor.ts
```

The task executor calls the model executor then runs `tsc` and `git commit`. For integration testing, verify it handles:
- The prompt being correctly formed from a Task object
- `tsc --noEmit` running successfully
- Git commit with the task's commit message

### 2d. Pipeline Orchestrator Type Alignment

Read the DND orchestrator and verify the type chain:
```bash
# Check DND's SurveyOutput shape
cat agent/patterns/architect/types.ts

# Check core's PipelineSurveyOutput shape
grep -A 30 "PipelineSurveyOutput" node_modules/@codex-signum/core/dist/index.d.ts

# Check the conversion function compiles
npx tsc --noEmit
```

Verify every field in `toPipelineSurveyOutput()` actually exists on both types. This is the exact failure point that caused 24 assertion failures in G-10 — type assumptions without reading source.

---

## Step 3: End-to-End Integration Test

Create `tests/integration/architect-pipeline.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import type { 
  ModelExecutor, 
  TaskExecutor, 
  PipelineSurveyOutput,
  ArchitectConfig,
  Task,
  TaskExecutionContext,
  TaskOutcome,
} from '@codex-signum/core';
import { executePlan as coreExecutePlan } from '@codex-signum/core';

// Mock executors that don't need API keys or filesystem
function createTestModelExecutor(): ModelExecutor {
  return {
    async execute(prompt) {
      return {
        text: JSON.stringify({
          tasks: [{
            task_id: 'test_1',
            title: 'Test task',
            description: 'A test task for integration',
            type: 'mechanical' as const,
            estimated_complexity: 'low' as const,
            dependencies: [],
            files_affected: ['test.ts'],
            acceptance_criteria: ['Compiles'],
            specification_refs: [],
            verification: 'npx tsc --noEmit',
            commit_message: 'test: integration test task',
          }],
        }),
        modelId: 'test-model',
        durationMs: 10,
        wasExploratory: false,
      };
    },
  };
}

function createTestTaskExecutor(): TaskExecutor {
  return {
    async execute(task: Task, context: TaskExecutionContext): Promise<TaskOutcome> {
      return {
        task_id: task.task_id,
        success: true,
        output: 'Test execution succeeded',
        adaptations_applied: 0,
      };
    },
  };
}

function createTestSurvey(): PipelineSurveyOutput {
  return {
    intent_id: 'test_intent_1',
    codebase_state: {
      structure: 'src/ tests/ package.json',
      recent_changes: ['test commit'],
      test_status: 'passing',
      open_issues: [],
    },
    graph_state: {
      pattern_health: {},
      active_cascades: 0,
      constitutional_alerts: [],
    },
    gap_analysis: {
      what_exists: ['existing code'],
      what_needs_building: ['test feature'],
      what_needs_changing: [],
      risks: [],
    },
    confidence: 0.8,
    blind_spots: [],
  };
}

describe('Architect Pipeline — End-to-End', () => {
  it('executes all 7 stages with mock executors', async () => {
    const config: ArchitectConfig = {
      modelExecutor: createTestModelExecutor(),
      taskExecutor: createTestTaskExecutor(),
      autoGate: true, // Skip human gate in test
    };

    const result = await coreExecutePlan(
      'test intent: add a feature',
      '/tmp/test-repo',
      config,
      createTestSurvey(),
    );

    // Pipeline completed
    expect(result.plan_id).toBeDefined();
    expect(result.intent).toBe('test intent: add a feature');
    
    // DECOMPOSE produced tasks
    expect(result.task_graph).toBeDefined();
    expect(result.task_graph!.length).toBeGreaterThan(0);
    
    // CLASSIFY assigned types
    const classifiedTask = result.task_graph![0];
    expect(classifiedTask.type).toBeDefined();
    
    // SEQUENCE produced execution plan
    expect(result.execution_plan).toBeDefined();
    
    // DISPATCH produced outcomes
    expect(result.task_outcomes.length).toBeGreaterThan(0);
    expect(result.task_outcomes[0].success).toBe(true);
    
    // Status is completed (all tasks succeeded)
    expect(['completed', 'dispatching']).toContain(result.status);
  });

  it('handles GATE abort correctly', async () => {
    // This test only works if we can mock the gate
    // For now, test with autoGate: true and verify the pipeline doesn't hang
    const config: ArchitectConfig = {
      modelExecutor: createTestModelExecutor(),
      taskExecutor: createTestTaskExecutor(),
      autoGate: true,
    };

    const result = await coreExecutePlan(
      'abort test',
      '/tmp/test-repo',
      config,
      createTestSurvey(),
    );

    expect(result).toBeDefined();
  });

  it('handles task failure → ADAPT', async () => {
    const failingExecutor: TaskExecutor = {
      async execute(task, context): Promise<TaskOutcome> {
        return {
          task_id: task.task_id,
          success: false,
          error: 'Simulated failure for adapt test',
          adaptations_applied: 0,
        };
      },
    };

    const config: ArchitectConfig = {
      modelExecutor: createTestModelExecutor(),
      taskExecutor: failingExecutor,
      autoGate: true,
    };

    const result = await coreExecutePlan(
      'test failure handling',
      '/tmp/test-repo',
      config,
      createTestSurvey(),
    );

    // ADAPT should have been triggered
    expect(result.task_outcomes.some(o => !o.success)).toBe(true);
  });

  it('DND survey conversion produces valid PipelineSurveyOutput', async () => {
    // Import DND's conversion function directly
    // This verifies the type bridge between DND and core
    const { default: architectModule } = await import('../../agent/patterns/architect/architect.js');
    
    // If toPipelineSurveyOutput is not exported, verify via the full orchestrator
    // The fact that it compiles with tsc is the primary validation
    expect(true).toBe(true); // Placeholder — real test is tsc --noEmit
  });
});
```

**CRITICAL:** Before writing these tests, READ the actual types:
```bash
# Core's Task type
grep -A 20 "export interface Task " node_modules/@codex-signum/core/dist/index.d.ts

# Core's PlanState type  
grep -A 20 "export interface PlanState" node_modules/@codex-signum/core/dist/index.d.ts

# Core's TaskOutcome type
grep -A 10 "export interface TaskOutcome" node_modules/@codex-signum/core/dist/index.d.ts

# Core's decompose return type
grep -A 10 "export.*function decompose" node_modules/@codex-signum/core/dist/index.d.ts
```

**Adapt the test code above to match the ACTUAL type shapes.** The mock model executor's JSON response MUST match what `decompose()` actually parses. Read `decompose.ts` to understand the expected LLM output format:

```bash
cat node_modules/@codex-signum/core/dist/patterns/architect/decompose.js | head -80
```

```bash
npx tsc --noEmit
npm test
```

**Commit:** `test(architect): end-to-end pipeline integration tests with mock executors`

---

## Step 4: Live Smoke Test (If API Keys Available)

If at least one LLM API key is configured (check Step 2b), run the actual CLI:

```bash
npx tsx agent/scripts/architect.ts plan "add a README.md health check section that documents current test count and coverage"
```

This is a deliberately simple, low-risk intent. Watch the output:

1. **SURVEY** should print confidence and blind spots
2. **DECOMPOSE** should produce 1-3 tasks via LLM
3. **CLASSIFY** should assign mechanical/generative
4. **SEQUENCE** should order them
5. **GATE** should prompt for human approval (do NOT auto-approve — type "approve" when prompted)
6. **DISPATCH** should execute each task
7. **ADAPT** should handle any failures

**If any stage fails:**
- Note which stage, the error message, and the stack trace
- Fix the immediate issue
- Re-run

**If API keys are NOT available:** Skip this step. The integration tests from Step 3 validate the pipeline logic. Live testing can happen when keys are configured.

**Commit any fixes:** `fix(architect): [description of what broke and how it was fixed]`

---

## Step 5: Add Mock Model Executor for Testing

If you created it in Step 2b, ensure `agent/patterns/architect/mock-model-executor.ts` is committed and exported from the barrel:

```bash
cat agent/patterns/architect/index.ts
```

Add export: `export { createMockModelExecutor } from "./mock-model-executor.js";`

This lets future tests and dry-run modes use a mock executor without needing API keys.

**Commit:** `feat(architect): add mock model executor for integration testing`

---

## Step 6: Verify DND Survey Graceful Degradation

The survey queries Neo4j for graph state. When Neo4j isn't running, it should degrade gracefully rather than crash.

```bash
cat agent/patterns/architect/survey.ts | grep -n "neo4j\|Neo4j\|graph_state\|driver" | head -20
```

If the survey has no error handling around Neo4j calls, add it:
- Wrap Neo4j queries in try/catch
- On failure: set `graph_state` to `{ pattern_health: {}, active_cascades: 0, constitutional_alerts: [] }`
- Add "Neo4j unavailable — graph state unknown" to `blind_spots`
- Log the error but don't crash

```bash
npx tsc --noEmit
npm test
```

**Commit (if changes):** `fix(survey): graceful degradation when Neo4j unavailable`

---

## Step 7: Final Verification + Push

```bash
# Full type check
npx tsc --noEmit

# Full test suite
npm test 2>&1 | tail -10

# Vite build (if applicable)
npx vite build 2>&1 | tail -5

# Commit any remaining changes
git add -A
git status
# If clean, move on. If changes, commit with descriptive message.

# Push
git push origin main
```

---

## Success Criteria

### Part A (Core):
- [ ] `computeGammaEffective(k)` returns `min(γ_base, 0.8/k)` for all k
- [ ] Subcriticality test passes: `k * γ < 1` for k = 1..20
- [ ] Algedonic bypass preserved: ΦL < 0.1 → γ = 1.0
- [ ] `src/constitutional/evolution.ts` exists with full lifecycle
- [ ] `proposeAmendment`, `evaluateAmendment`, `checkConsensus` exported from barrel
- [ ] `GraphObserver` interface exported from barrel
- [ ] All tests pass (count should increase from baseline)
- [ ] `dist/` committed and pushed

### Part B (DND):
- [ ] Core dependency updated to Part A's SHA
- [ ] `npx tsc --noEmit` passes (no type errors from updated core)
- [ ] `npm test` passes (no regressions)
- [ ] Integration test `architect-pipeline.test.ts` passes
- [ ] DND survey runs against real repo and returns valid output
- [ ] Survey degrades gracefully without Neo4j
- [ ] Mock model executor available for testing
- [ ] All changes pushed to `origin main`

### Stretch (if API keys available):
- [ ] `npx tsx agent/scripts/architect.ts plan "..."` runs all 7 stages
- [ ] Human gate prompts correctly and accepts input
- [ ] At least one task executes, verifies with tsc, and commits

---

## Anti-Patterns — Do NOT Do These

1. **Do NOT skip reading source files before writing tests.** Every mock must match actual type shapes. `grep` the `.d.ts` files.
2. **Do NOT assume API shapes from names.** `Task.type` might be `"mechanical" | "generative"` or something else. Read the type.
3. **Do NOT create monitoring overlays.** If you find yourself building a health dashboard or reactive monitor, stop. That's the wrong approach.
4. **Do NOT modify the signal conditioning pipeline** (src/computation/signals/). It's verified and locked.
5. **Do NOT add a `prepare` script to package.json** in either repo.
6. **Do NOT use bare number as health score.** ΦL is always a composite.
7. **Do NOT push DND-Manager to Codex_signum remote.** Verify `git remote -v` shows the correct URLs.

---

## Architecture After This Task

```
Codex_signum (core):
  src/computation/dampening.ts     ← Budget-capped: min(γ_base, 0.8/k)
  src/constitutional/evolution.ts  ← NEW: Full amendment lifecycle
  src/patterns/observer/           ← GraphObserver interface added
  src/patterns/architect/          ← 7 stages, executePlan orchestrator
  580+ tests passing

DND-Manager:
  agent/patterns/architect/
  ├── architect.ts                 ← Calls core's executePlan with DND adapters
  ├── dnd-model-executor.ts        ← Thompson-routed LLM calls → core interface
  ├── dnd-task-executor.ts         ← Task execution + tsc + git commit
  ├── mock-model-executor.ts       ← NEW: For testing without API keys
  ├── llm.ts                       ← DND-specific Thompson routing
  ├── survey.ts                    ← Filesystem + git + Neo4j (graceful degradation)
  ├── types.ts                     ← DND SurveyOutput type
  └── index.ts                     ← Barrel export

  tests/integration/
  └── architect-pipeline.test.ts   ← NEW: End-to-end pipeline tests

  agent/scripts/architect.ts       ← CLI entry point

Data flow (validated):
  CLI → DND survey → toPipelineSurveyOutput() → core executePlan
    → DECOMPOSE (LLM via ModelExecutor)
    → CLASSIFY (pure computation)
    → SEQUENCE (topological sort)
    → GATE (human approval, mandatory V1)
    → DISPATCH (TaskExecutor per task)
    → ADAPT (failure classification)
    → PlanState result
```
