# Codex Signum Reference Pattern: Architect

## Planning, Decomposition & Orchestration

**Date:** 2026-02-21
**Status:** Pattern design specification — pre-implementation
**Depends on:** Codex Signum v3.0, Engineering Bridge v2.0, OpEx Addendum v2, Reference Patterns Design (Router & DevAgent)
**Consumes:** Retrospective Pattern (process improvement insights — see companion spec)
**Purpose:** The third reference pattern. The Architect formalises what a human operator currently does manually: reading system state, decomposing intent into dependency-aware task sequences, feeding them through the DevAgent pipeline, and adapting the plan when reality diverges from expectation. The Architect is a **lead indicator** pattern — it faces forward. Process improvement (facing backward) is the Retrospective pattern's responsibility.

---

## Design Philosophy

The Architect exists to answer a question the Router and DevAgent cannot: **"What should be built next, in what order, and why?"**

The Router selects models. The DevAgent executes single tasks through a quality-assured pipeline. Neither can take "implement the observer pattern" and produce the ordered sequence of sub-tasks, dependency declarations, phase boundaries, and decision gates that make the work tractable. That's the Architect's job.

This is not an orchestrator in the agentic-AI sense. It does not manage agents. It does not negotiate. It produces **plans** — structured, dependency-aware task graphs — and feeds them to the DevAgent one task at a time, adapting the plan based on outcomes. The Architect is a Bloom containing Resonators, not a controller containing agents.

### Why This Pattern Matters Now

Every Codex-governed coding session currently has a human performing the Architect role:

- Reading the codebase and specification to understand current state
- Decomposing high-level intent into ordered, dependency-aware tasks
- Distinguishing mechanical tasks (file moves, renames — where mistakes are caught by compilers) from generative tasks (new architecture — requiring full pipeline validation)
- Sequencing tasks so the DevAgent can execute them individually
- Adjusting the plan when a task reveals something unexpected
- Managing the git workflow (branches, PRs, commit messages)

Formalising this means: the planning quality itself gets tracked through ΦL. The Learning Helix captures what makes good task decomposition. The human stops being the bottleneck for plan creation — which is currently the highest-value activity but also the one that gates everything.

### The Abstraction Escalator

Each pattern formalised moves the human one abstraction layer up:

| Layer | Before Pattern | After Pattern |
|---|---|---|
| Model selection | Human picks model per task | Router learns optimal selections |
| Code generation | Human writes/reviews code | DevAgent pipelines with quality assurance |
| Process improvement | Human reviews what went wrong, changes approach | **Retrospective** detects systemic issues, proposes process changes |
| Planning & sequencing | Human decomposes work | **Architect** produces dependency-aware plans, informed by Retrospective insights |
| Strategic direction | Human decides what to build | *Human stays here* — for now |

The Architect doesn't eliminate human judgment. It moves human judgment to the layer where it's most valuable: strategic direction, architectural decisions, and the "should we build this at all?" questions that no pattern can answer.

**The Architect faces forward. The Retrospective faces backward.** These are fundamentally different cognitive modes — synthesis vs. analysis, lead vs. lag — and they are separate patterns because coupling them would compromise both. The Architect consumes Retrospective outputs the same way the DevAgent consumes Router outputs: through a Line to an external pattern's exposed Grid.

### OpEx Items This Pattern Demonstrates

| OpEx Mechanism | Architect | How Demonstrated |
|---|---|---|
| Rolled Throughput Yield | ✓ | Plan-level RTY: what fraction of plans execute without replanning |
| CTQ tree decomposition | ✓ | Intent decomposed into measurable task specifications |
| Poka-yoke classification | ✓ | Task classification (mechanical vs. generative) prevents wrong-process errors |
| Architecture Decision Records | ✓ | Plan rationale, decomposition choices, phase boundaries logged structurally |
| FMEA-style failure mode analysis | ✓ | Proactive identification of plan-level failure modes |
| Gemba-depth inspection | ✓ | Codebase and graph state inspection before plan generation |
| Anti-hallucination metrics | ✓ | Confidence scoring on decomposition completeness and dependency accuracy |
| Kano decay monitoring | ✓ | Tracking which planning capabilities transition from delighter to must-be |

---

## Identity in Codex Terms

The Architect is a **Bloom (○)** containing a multi-stage planning pipeline. Each stage is a **Resonator (Δ)** performing a transformation. The Bloom connects via **Lines (→)** to the DevAgent (task execution), the Thompson Router (model selection for its own stages), and to external tooling (git, filesystem). It maintains its own **Grid (□)** of plan history and a **Learning Helix (🌀)** for improving decomposition quality over time.

The Architect is not an autonomous agent. It is a pattern — a coherent flow of transformations that takes intent and produces executed, verified work. It has no identity beyond its configuration and observation history.

## Morpheme Composition

```
○ Bloom (architect boundary)
  │
  ├── • (intent input — "what to build")
  │     → Δ (SURVEY — inspect codebase + graph state)
  │         → Δ (DECOMPOSE — produce dependency-aware task graph)
  │             → Δ (CLASSIFY — mechanical vs. generative per task)
  │                 → Δ (SEQUENCE — topological sort with phase boundaries)
  │                     → Δ (GATE — human approval checkpoint)
  │                         → Δ (DISPATCH — feed tasks to DevAgent)
  │                             → Δ (ADAPT — replan on failure/discovery)
  │                                 → • (completed work output)
  │
  ├── □ Grid (plan history — Stratum 2 observations)
  │     🌀 Helix (Learning — decomposition quality improvement)
  │
  ├── □ Grid (codebase model — Stratum 1 ephemeral, rebuilt per plan)
  │
  └── □ Grid (task templates — Stratum 3 distilled knowledge)
        🌀 Helix (Learning — template refinement from successful patterns)
```

### Interface Shape

```json
{
  "interface": {
    "inputs": [
      { "id": "intent", "type": "seed", "accepts": "text/intent_description" },
      { "id": "human_decision", "type": "seed", "accepts": "text/gate_response" },
      { "id": "process_insight", "type": "seed", "accepts": "text/process_improvement",
        "source": "retrospective_pattern", "note": "Event-driven, not guaranteed per plan" }
    ],
    "outputs": [
      { "id": "completed_work", "type": "seed", "produces": "code/deployed_feature" },
      { "id": "plan_report", "type": "seed", "produces": "text/plan_summary" }
    ],
    "exposes": [
      { "id": "plan-history", "type": "grid", "access": "read" },
      { "id": "active-plan", "type": "grid", "access": "read" },
      { "id": "task-templates", "type": "grid", "access": "read" }
    ]
  },
  "dependencies": {
    "requires_models": ["llm/planning", "llm/code_analysis"],
    "requires_grids": [],
    "requires_external": ["git", "filesystem"]
  }
}
```

**Note on Retrospective dependency:** The Architect does *not* hard-depend on the Retrospective pattern. Plans execute fine without process insights — they just don't benefit from systemic learning. When the Retrospective fires (event-triggered, not periodic), its outputs arrive as `process_insight` Seeds that the SURVEY and DECOMPOSE stages incorporate. If the Retrospective pattern's ΦL dims or it becomes dormant, the Architect continues operating — it simply loses the benefit of aggregated process intelligence. This is a soft dependency by design.

---

## Pipeline Stages

### SURVEY (Δ — Reconnaissance)

**Purpose:** Build a working model of current system state before planning. This is the gemba walk — look at the actual code, the actual graph state, the actual test results before making any plans.

**Inputs:** Intent description, repository path, relevant specification references, active process insights from Retrospective (if any).

**Activities:**
- Read the codebase structure (file tree, key files, recent changes)
- Query the Neo4j graph for current pattern health (ΦL of Router, DevAgent, any other active patterns)
- Check git status (current branch, uncommitted changes, recent commit history)
- Identify relevant specification sections (from codex docs, engineering bridge, pattern design specs)
- **Incorporate active Retrospective insights** — if the Retrospective has flagged systemic issues (e.g., "Neo4j schema changes consistently require 3+ adaptations"), these become constraints for the DECOMPOSE stage
- Assess gap between current state and intent

**Model selection:** Via Thompson Router with context = {task_type: "analysis", complexity: "high", domain: "codebase_survey"}

**Outputs:**

```typescript
interface SurveyOutput {
  intent_id: string;
  codebase_state: {
    structure: string;              // File tree summary
    recent_changes: string[];       // Last N commits relevant to intent
    test_status: "passing" | "failing" | "unknown";
    open_issues: string[];          // Known problems from graph or git
  };
  graph_state: {
    pattern_health: Map<string, number>;  // pattern_id → ΦL
    active_cascades: number;
    constitutional_alerts: string[];
  };
  process_insights: {
    active_advisories: string[];    // From Retrospective: current systemic issues
    applicable_learnings: string[]; // From Retrospective: relevant to this intent domain
    standardised_work_ref: string | null;  // Current baseline for this type of work
  };
  gap_analysis: {
    what_exists: string[];          // Components already built
    what_needs_building: string[];  // Components required by intent
    what_needs_changing: string[];  // Existing code that must be modified
    risks: string[];                // Identified risks or blockers
  };
  confidence: number;               // How well does the Architect understand the current state
  blind_spots: string[];            // What the survey couldn't determine
}
```

**Anti-hallucination:** The survey includes `blind_spots` — an explicit declaration of what the Architect does *not* know about the current state. A survey that claims perfect understanding of a complex codebase is conflating. The confidence score should correlate with codebase familiarity: first survey of a new domain should have lower confidence than a domain the Architect has planned for repeatedly.

### DECOMPOSE (Δ — Task Graph Generation)

**Purpose:** Transform the gap analysis into a dependency-aware task graph. This is the core intellectual work of the Architect.

**Inputs:** SurveyOutput, relevant specifications, task templates from Stratum 3 Grid.

**Outputs:**

```typescript
interface TaskGraph {
  intent_id: string;
  tasks: Task[];
  dependencies: Dependency[];
  phases: Phase[];
  estimated_total_effort: "small" | "medium" | "large" | "epic";
  decomposition_confidence: number;   // How confident in the completeness of this graph
  assumptions: string[];              // What the decomposition assumes to be true
}

interface Task {
  task_id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];      // Testable conditions — fed directly to DevAgent SCOPE
  type: "mechanical" | "generative";  // Set by CLASSIFY stage
  phase: string;                      // Which phase this belongs to
  estimated_complexity: "trivial" | "low" | "medium" | "high";
  files_affected: string[];           // Known files this task will touch
  specification_refs: string[];       // Spec sections relevant to this task
  verification: string;               // How to verify completion (test command, manual check, etc.)
  commit_message: string;             // Pre-composed commit message
}

interface Dependency {
  from: string;   // task_id that must complete first
  to: string;     // task_id that depends on it
  type: "hard" | "soft";  // hard = must complete; soft = should complete but can proceed
}

interface Phase {
  phase_id: string;
  title: string;
  description: string;
  tasks: string[];                    // task_ids in this phase
  gate: "auto" | "human";            // Does this phase boundary require human approval?
  gate_criteria: string;              // What must be true to proceed past this gate
}
```

**Critical design principle: mechanical vs. generative separation.** This is the insight from the existing implementation plans — some tasks are pure file operations (renames, moves, import updates) where the compiler catches mistakes, while others require creative architecture work where the full DevAgent pipeline must validate quality. Separating them prevents over-engineering simple tasks and under-validating complex ones.

**Template matching:** The Learning Helix feeds distilled patterns from successful decompositions into the task templates Grid. Over time, the Architect recognises recurring decomposition shapes: "API endpoint addition" always involves route definition, handler, validation, tests, docs. "Refactor for modularity" always involves interface extraction, implementation migration, import updates, cleanup. Templates don't replace decomposition — they accelerate it and reduce omissions.

### CLASSIFY (Δ — Task Type Assignment)

**Purpose:** Assign each task its type (mechanical vs. generative) and determine the appropriate execution strategy.

**Classification criteria:**

| Indicator | Mechanical | Generative |
|---|---|---|
| File changes | Renames, moves, import updates | New files, architecture changes |
| Verification | Compiler (`tsc --noEmit`), build pass | Full DevAgent pipeline (SCOPE→VALIDATE) |
| Error recovery | Revert and retry | Correction Helix |
| Risk | Low — mistakes caught immediately | High — mistakes may propagate |
| Model requirement | Any capable model, low cost | Best available model via Router |
| Correction strategy | Simple retry (max 2) | DevAgent Correction Helix (max 3) |

**Output:** Updated TaskGraph with `type` field populated on each task.

### SEQUENCE (Δ — Topological Ordering)

**Purpose:** Produce an executable order from the task graph, respecting dependencies and phase boundaries.

**Algorithm:**
1. Topological sort of the task dependency graph
2. Group into phases (respecting declared phase assignments)
3. Within each phase, order by: hard dependencies first, then estimated complexity ascending (easy wins build momentum and catch environmental issues early)
4. Insert phase gates where declared
5. Validate: no circular dependencies, no orphaned tasks, all dependencies satisfiable

**Output:**

```typescript
interface ExecutionPlan {
  intent_id: string;
  ordered_tasks: string[];            // task_ids in execution order
  phase_boundaries: Map<string, number>;  // phase_id → index in ordered_tasks where phase starts
  critical_path: string[];            // task_ids on the longest dependency chain
  estimated_duration: string;         // Human-readable estimate
  parallelisable: string[][];         // Groups of tasks that could run concurrently (future)
}
```

### GATE (Δ — Human Decision Checkpoint)

**Purpose:** Present the plan to the human for approval before execution begins. This is not optional in the initial implementation — every plan requires human approval.

**Why mandatory gates initially:** The Architect pattern is new. Its decomposition quality is unproven. Executing an incorrect plan wastes more resources than pausing for human review. As the Architect's ΦL stabilises in the Trusted range and its plan success rate demonstrates reliability, the constitutional layer can evolve to make gates conditional:

```
IF architect.phi_l > 0.85 AND plan.estimated_total_effort = "small"
THEN gate = "auto"
ELSE gate = "human"
```

This is constitutional evolution — the governance adapts to demonstrated capability. The human doesn't decide to trust the Architect. The Architect earns trust through structural health.

**Gate presentation:**
- Plan summary (phases, task count, estimated effort)
- Critical path highlighted
- Risks and assumptions surfaced
- Blind spots from survey acknowledged
- Explicit question: "Proceed with this plan? / Modify? / Abort?"

**Gate responses:**
- **Approve** — proceed to DISPATCH
- **Modify** — human provides corrections, plan re-enters DECOMPOSE with modifications as constraints
- **Abort** — plan is archived with rationale, no execution

### DISPATCH (Δ — Task Execution Management)

**Purpose:** Feed tasks to the DevAgent one at a time, in sequence, collecting results and managing git workflow.

**Per-task workflow:**

```
For each task in execution_plan.ordered_tasks:
  1. Check preconditions (dependencies met?)
  2. IF task.type = "mechanical":
       → Execute directly (file operations + compiler verification)
       → On success: git commit with task.commit_message
       → On failure: retry once, then escalate to ADAPT
  3. IF task.type = "generative":
       → Feed task to DevAgent pipeline (task.description + task.acceptance_criteria)
       → Receive DevAgent output (ValidateOutput)
       → On approved: git commit with task.commit_message
       → On approved_with_caveats: log caveats, commit, continue
       → On rejected: escalate to ADAPT
  4. Update plan state Grid with task outcome
  5. At phase boundaries: execute gate (auto or human per plan)
```

**Git workflow management:**

```typescript
interface GitWorkflow {
  branch_strategy: "feature_branch" | "direct_to_main";
  branch_name: string;              // Generated from intent: "feat/implement-observer-pattern"
  commit_per_task: boolean;         // Default: true — one commit per completed task
  pr_on_completion: boolean;        // Default: true — create PR when plan completes
  pr_template: {
    title: string;                  // From intent
    body: string;                   // Auto-generated from plan + task outcomes
    labels: string[];
  };
}
```

### ADAPT (Δ — Replanning on Divergence)

**Purpose:** When task execution fails or reveals something the original plan didn't account for, the Architect replans rather than blindly retrying.

**Adaptation triggers:**
- DevAgent rejects a task (pipeline halt after exhausting correction helix)
- A mechanical task fails compiler verification after retry
- A task reveals new dependencies not in the original plan
- Human feedback at a gate requests changes
- Graph state changes during execution (another pattern's ΦL drops, cascade event)

**Adaptation types:**

| Trigger | Response | Scope |
|---|---|---|
| Single task failure | Modify task, retry | Task-level replan |
| Dependency discovered | Insert new tasks, re-sequence | Phase-level replan |
| Fundamental assumption wrong | Re-survey, full redecompose | Plan-level replan |
| Human modification | Integrate feedback, re-sequence | Varies |
| External state change | Assess impact, pause or continue | Varies |

**Adaptation loop:**

```
ADAPT receives: failed_task + failure_reason + current_plan_state
  │
  ├── Classify failure scope (task / phase / plan)
  │
  ├── IF task-level:
  │     → Modify task description/acceptance criteria
  │     → Re-dispatch modified task
  │     → Max 2 adaptations per task, then escalate to phase-level
  │
  ├── IF phase-level:
  │     → Re-enter DECOMPOSE for remaining tasks in phase
  │     → Present modified plan to GATE
  │     → Resume DISPATCH with modified plan
  │
  └── IF plan-level:
        → Re-enter SURVEY
        → Full replan cycle
        → Mandatory human GATE
```

**Anti-thrashing:** Constitutional rule: `max_adaptations_per_plan = 5`. If a plan requires more than 5 adaptations, it's structurally flawed. The Architect should halt and signal to the human that the intent may need refinement. This prevents infinite replan loops where the Architect keeps trying different decompositions of an ill-defined intent.

---

## Learning Helix: How the Architect Improves

### What Gets Learned

The Architect's Learning Helix operates across two Grids:

**Plan History Grid (Stratum 2 → Stratum 3):**
- Raw observations: every plan, its tasks, outcomes, adaptations, final result
- Distilled knowledge: decomposition patterns that consistently succeed, failure patterns to avoid
- Metrics: plan success rate, adaptation rate, task estimation accuracy, phase gate outcomes

**Task Templates Grid (Stratum 3):**
- Recurring task shapes extracted from successful plans
- Template confidence: how often a template's tasks complete without adaptation
- Domain specialisation: templates tagged by domain (e.g., "TypeScript refactoring", "Neo4j schema change", "test infrastructure")

### Decomposition Quality Metrics

```typescript
interface PlanQualityMetrics {
  // Plan-level
  plan_success_rate: number;          // % of plans that complete without plan-level replan
  adaptation_rate: number;            // adaptations / total_tasks — lower is better
  estimation_accuracy: number;        // correlation between estimated and actual complexity
  
  // Task-level
  task_first_pass_rate: number;       // % of tasks that succeed on first DevAgent execution
  dependency_accuracy: number;        // % of declared dependencies that were actually needed
  missing_dependency_rate: number;    // % of tasks that revealed undeclared dependencies
  
  // Classification accuracy
  mechanical_correct_rate: number;    // % of "mechanical" tasks that truly needed no DevAgent
  generative_correct_rate: number;    // % of "generative" tasks that truly needed full pipeline
  
  // Temporal
  plan_duration_accuracy: number;     // estimated vs. actual plan completion time
}
```

### What Feeds Back to the Router

The Architect's stages go through the Router. This means the Router learns:
- Which models are good at codebase analysis (SURVEY stage)
- Which models are good at task decomposition (DECOMPOSE stage)
- Which models are good at classification and sequencing

This is a distinct context cluster from the DevAgent's code generation and review contexts. A model that's excellent at writing code might be poor at decomposing work — the Router needs separate posteriors to discover this.

---

## Cross-Pattern Integration

### Retrospective → Architect Dependency

The Architect consumes process improvement insights from the Retrospective pattern. This is a **soft dependency** — the Architect operates without it, but operates *better* with it. The Retrospective reads across all patterns (Router, DevAgent, Architect) and produces systemic insights that no single pattern can derive from its own observations.

**What the Architect receives from the Retrospective:**
- Active advisories: "acceptance criteria phrasing correlates with DevAgent correction loops — use testable assertions, not descriptions"
- Standardised work baselines: "current planning process for refactoring tasks has a 73% first-pass success rate; here's the current best-known decomposition shape"
- Process change recommendations: "classification heuristics should treat Neo4j schema tasks as generative, not mechanical — historical data shows 40% mechanical failure rate for these"
- Template updates: "task template for API endpoint addition should include validation step — plans that omit it require adaptation 60% of the time"

**How the Architect consumes these:**
- SURVEY incorporates active advisories and applicable learnings into its output
- DECOMPOSE uses standardised work baselines as starting points, then adapts
- CLASSIFY applies any reclassification guidance from process change recommendations
- Task templates Grid is updated when the Retrospective produces template improvements

**The relationship is asymmetric:** The Retrospective reads the Architect's plan history Grid (exposed, read-only). The Architect reads the Retrospective's insight Grid (exposed, read-only). Neither modifies the other's state. They communicate through the graph, not through direct invocation.

### Architect → DevAgent Dependency

The Architect depends on the DevAgent for generative task execution. This means:

- DevAgent ΦL directly affects Architect plan success (if the DevAgent can't execute tasks, plans fail)
- DevAgent RTY informs Architect estimation (a DevAgent with low RTY means plans take longer due to correction loops)
- Architect task descriptions become DevAgent SCOPE inputs — the interface between them is `Task.description + Task.acceptance_criteria → DevAgent input`

### Architect → Router Dependency

The Architect's own stages route through the Thompson Router. This creates a three-layer dependency:

```
Architect stages → Router (model selection) → LLM API (substrate)
Architect dispatches → DevAgent stages → Router (model selection) → LLM API
```

The Router serves both patterns but with different context clusters. The Architect's SURVEY stage is a different routing context than the DevAgent's EXECUTE stage. The Router's Learning Helix maintains separate posteriors for each.

### Feedback Loop

```
Architect produces plan
  → DISPATCH feeds tasks to DevAgent
    → DevAgent executes task through SCOPE→EXECUTE→REVIEW→VALIDATE
      → Task outcome (success/failure/caveats) returns to Architect
        → Architect updates plan state
          → If failure: ADAPT modifies plan
          → Plan outcomes feed Architect Learning Helix
            → Improved decomposition in future plans
              → Better task descriptions → DevAgent performs better
                → Router learns which models suit planning vs. coding

                          ↕ (graph reads — event-triggered)

Retrospective reads across Router + DevAgent + Architect observations
  → Detects systemic patterns invisible to individual pattern Learning Helixes
    → Produces process improvement insights
      → Architect SURVEY incorporates insights into next plan
        → Better plans from systemic learning, not just individual plan learning
```

The system-level feedback loop crosses all four patterns. The Retrospective adds the **cross-pattern learning dimension** — it sees what no individual pattern can see, because it reads across all of them. The Architect's per-plan Learning Helix handles "did this plan succeed?" The Retrospective handles "is our planning *process* improving?" These are different timescales and different questions.

### ΨH Between Architect and DevAgent

High ΨH means the Architect's task descriptions consistently produce successful DevAgent executions. Low ΨH means either:
- The Architect is producing ambiguous or incomplete task descriptions
- The DevAgent is struggling with the domain regardless of description quality
- The Router is misallocating models for the task types

The structural signal differentiates these: check adaptation_rate vs. DevAgent RTY vs. Router context cluster health. The Architect's ΨH with the DevAgent is the most important cross-pattern metric because it captures the entire planning-to-execution quality chain.

---

## FMEA: Architect Failure Modes

| Failure Mode | Severity | Occurrence | Detection | RPN | Structural Signal | Mitigation |
|---|---|---|---|---|---|---|
| **SURVEY misreads codebase state** | High (8) | Medium (4) | Medium — visible when tasks fail on preconditions (4) | 128 | Early task failures; dependency errors; adaptation spikes in first phase | Confidence scoring on survey; cross-reference git log with file tree; verify assumptions before DECOMPOSE |
| **Over-decomposition (too many tiny tasks)** | Medium (5) | Medium (5) | High — visible as excessive task count vs. intent scope (2) | 50 | High plan overhead; low value-per-task; human gate likely to request consolidation | Template matching limits minimum task scope; plan-level complexity estimation calibrated over time |
| **Under-decomposition (tasks too large for DevAgent)** | High (7) | Medium (4) | Medium — DevAgent fails or produces low-quality output (4) | 112 | DevAgent correction helix exhaustion; low first-pass rate; adaptation to split tasks | Template matching suggests appropriate granularity; DevAgent failure rate per task complexity tracked |
| **Incorrect dependency declaration** | High (7) | Medium (4) | Low — visible only when parallel execution fails or tasks fail on missing preconditions (6) | 168 | Tasks fail due to missing outputs from undeclared dependencies; sequence violations | Track missing_dependency_rate; improve dependency detection in DECOMPOSE from historical data |
| **Mechanical/generative misclassification** | Medium (6) | Medium (4) | High — mechanical task needs correction, or generative task was trivial (2) | 48 | Mechanical tasks failing compiler checks when they shouldn't; generative tasks passing first try consistently | Track classification accuracy; refine heuristics from outcomes |
| **Plan thrashing (excessive adaptation)** | High (8) | Low (3) | High — visible as adaptation count (2) | 48 | Adaptation count > 3; replanning more than executing; wasted tokens and time | Max 5 adaptations per plan constitutional rule; mandatory human gate on plan-level replan |
| **Intent ambiguity not caught** | High (8) | Medium (5) | Low — decomposition proceeds on wrong assumptions (7) | 280 | Plan executes but produces wrong result; late discovery at human review or integration | Survey confidence scoring; explicit assumption declaration; blind_spot acknowledgment; human gate catches major misunderstandings |
| **Stale codebase model** | Medium (5) | Medium (4) | Medium — visible when tasks encounter unexpected code (4) | 80 | Task failures on "file not found" or "unexpected structure"; survey data doesn't match reality | Re-survey on phase boundaries; verify git state before each task dispatch |

**Highest RPN = Intent ambiguity not caught (280).** This is the Architect's most dangerous failure mode — the human's intent is misunderstood, but the decomposition looks plausible enough to pass the gate. Primary mitigations: explicit confidence scoring on SURVEY and DECOMPOSE, mandatory assumption declarations, and the human gate. Over time, the Learning Helix captures which types of intent descriptions lead to misunderstandings, improving the Architect's ability to ask clarifying questions rather than guessing.

---

## Architect ΦL Composition

| Factor | Source | Weight |
|---|---|---|
| axiom_compliance | Constitutional rule evaluation across all pipeline stages | 0.3 |
| provenance_clarity | % of plans with full intent→survey→decompose→outcome trace | 0.2 |
| usage_success_rate | % of plans that complete without plan-level replanning | 0.25 |
| temporal_stability | Variance of ΦL + plan success rate over observation window | 0.25 |

**Plan RTY integration:** Similar to DevAgent RTY, the Architect tracks plan-level throughput yield. A plan where 4 of 5 phases complete without adaptation has higher RTY than one requiring adaptation in every phase. RTY volatility feeds temporal_stability.

**Adaptation rate integration:** usage_success_rate incorporates not just "did the plan complete" but "how much did it need to change." A plan that completes with 0 adaptations scores higher than one that completes with 4 adaptations, even though both "succeeded." This creates selective pressure toward better upfront decomposition.

---

## Constitutional Rules (Architect-Specific)

```
RULE: max_adaptations_per_plan
  VALUE: 5
  CONSEQUENCE: Plan halt + human escalation
  RATIONALE: Prevents infinite replan loops on ill-defined intent

RULE: mandatory_human_gate_initial
  VALUE: true (all plans require human gate approval)
  EVOLUTION: May relax to conditional when architect.phi_l > 0.85
  RATIONALE: Pattern is new; earn trust through demonstrated capability

RULE: survey_before_decompose
  VALUE: always
  CONSEQUENCE: Decomposition without survey is a constitutional violation
  RATIONALE: Planning without understanding current state is the primary failure mode

RULE: max_tasks_per_plan
  VALUE: 30
  CONSEQUENCE: Plans exceeding 30 tasks must be split into sub-plans
  RATIONALE: Overly large plans are harder to adapt and harder to track

RULE: task_description_minimum
  VALUE: description + acceptance_criteria + verification + commit_message
  CONSEQUENCE: Tasks missing required fields fail constitutional check
  RATIONALE: Incomplete task descriptions produce poor DevAgent outcomes

RULE: phase_gate_on_generative_boundary
  VALUE: required when transitioning from mechanical to generative phase
  CONSEQUENCE: Gate must be satisfied before generative tasks begin
  RATIONALE: Mechanical tasks establish foundations; generative tasks build on them

RULE: incorporate_active_advisories
  VALUE: SURVEY must check for active Retrospective advisories before DECOMPOSE
  CONSEQUENCE: Plans that ignore active advisories have reduced axiom_compliance
  RATIONALE: Systemic insights exist to prevent known failure modes from recurring
  NOTE: If Retrospective pattern is dormant or absent, this rule is satisfied vacuously
```

---

## CLI Interface

The Architect pattern is accessed through the `codex` CLI. This is the primary user interface until a visual UI is built.

```bash
# Plan a new piece of work
codex plan "implement the observer pattern per the implementation README"

# Plan with explicit specification references
codex plan "add spectral analysis" --refs engineering-bridge-v2.0.md,codex-signum-v3.0.md

# View the active plan
codex plan status

# View plan details
codex plan show

# Approve a plan at gate
codex plan approve
codex plan approve --with-modifications "split task 7 into two parts"

# Abort a plan
codex plan abort --reason "requirements changed"

# Resume a paused plan (e.g., after human review)
codex plan resume

# View plan history
codex plan history

# View Architect health
codex health architect

# View cross-pattern health
codex health --all
```

**IDE integration:** The `codex` CLI is designed for terminal access. VS Code Copilot, Cursor, or Claude Code invoke it through the terminal. The conversational IDE agent provides the natural language layer for refining intent before `codex plan` is called. The Codex handles structure; the IDE agent handles conversation.

---

## Implementation Notes

### What Must Exist Before Building This

1. **Core infrastructure** — Neo4j graph, constitutional layer, ΦL computation, memory strata
2. **Thompson Router** — functional, logging decisions, posteriors updating
3. **DevAgent** — functional end-to-end pipeline (SCOPE→EXECUTE→REVIEW→VALIDATE)
4. **CLI foundation** — basic `codex` command structure capable of being extended

**Not required but enhances:** The Retrospective pattern. The Architect is fully functional without it. Build the Retrospective after the Architect has accumulated enough plan history (10+ plans) to provide meaningful data for systemic analysis.

### Build Sequence

1. **CLI scaffolding.** `codex plan` command that accepts intent as a string argument. Returns "plan created" stub. This establishes the interface before the intelligence.

2. **SURVEY stage.** Read codebase (file tree, key files). Read graph state (pattern health). Read git status. Output structured SurveyOutput. Verify survey captures actual state — test by surveying the Codex repo itself.

3. **DECOMPOSE stage.** Take SurveyOutput + intent → produce TaskGraph. Start simple: flat task lists with sequential dependencies. No template matching yet. Verify: decomposition of a known task (e.g., "implement observer collector") produces reasonable tasks.

4. **CLASSIFY + SEQUENCE.** Task type assignment and topological ordering. Verify: mechanical tasks sorted before generative tasks within phases. Dependencies respected.

5. **GATE.** Present plan to terminal. Accept approve/modify/abort. Verify: plan is human-readable, modifications re-enter DECOMPOSE.

6. **DISPATCH.** Feed tasks to DevAgent one at a time. Manage git (branch creation, commits, PR). Verify: a small plan (3-5 tasks) executes end-to-end, producing committed code.

7. **ADAPT.** Handle task failures gracefully. Classify adaptation scope. Verify: a deliberately failing task triggers task-level replan, not plan-level abort.

8. **Learning Helix.** Plan quality metrics tracked. Task templates begin accumulating. Verify: after 10+ plans, decomposition quality metrics are populated and trending.

9. **Cross-pattern ΨH.** Measure Architect↔DevAgent resonance. Verify: ΨH is computable and correlates with plan success rate.

10. **Retrospective integration.** Wire process_insight input to SURVEY. Verify: when the Retrospective pattern produces an advisory, the next plan's SURVEY incorporates it. Verify: Architect operates normally when Retrospective is dormant/absent.

### Directory Structure

```
patterns/
├── architect/
│   ├── RULES.md              # Architect-specific constitutional constraints
│   ├── architect.ts          # Core orchestration — plan lifecycle management
│   ├── survey.ts             # SURVEY stage — codebase and graph state inspection
│   ├── decompose.ts          # DECOMPOSE stage — task graph generation
│   ├── classify.ts           # CLASSIFY stage — mechanical vs. generative
│   ├── sequence.ts           # SEQUENCE stage — topological ordering
│   ├── gate.ts               # GATE stage — human approval checkpoint
│   ├── dispatch.ts           # DISPATCH stage — task feeding to DevAgent + git
│   ├── adapt.ts              # ADAPT stage — replanning on divergence
│   ├── templates.ts          # Task template matching and management
│   └── types.ts              # Architect-specific type definitions
```

---

## Bloom Envelope (for Attunement)

When the Architect pattern matures enough to be shared via the Attunement protocol:

```json
{
  "identity": {
    "content_hash": "sha256:...",
    "codex_version": "3.0",
    "scale": "pattern",
    "created_at": "2026-02-21T00:00:00Z",
    "origin": "bloom:ro-origin"
  },
  "structure": {
    "morphemes": {
      "bloom": {
        "id": "architect-pipeline",
        "shape": "open",
        "contains": ["survey", "decompose", "classify", "sequence",
                     "gate", "dispatch", "adapt",
                     "plan-history", "codebase-model", "task-templates",
                     "decomposition-learning", "template-learning"]
      },
      "resonators": [
        { "id": "survey", "orientation": "down", "role": "codebase_analysis" },
        { "id": "decompose", "orientation": "up", "role": "task_decomposition" },
        { "id": "classify", "orientation": "down", "role": "task_classification" },
        { "id": "sequence", "orientation": "up", "role": "topological_ordering" },
        { "id": "gate", "orientation": "down", "role": "human_checkpoint" },
        { "id": "dispatch", "orientation": "up", "role": "task_execution" },
        { "id": "adapt", "orientation": "down", "role": "replanning" }
      ],
      "grids": [
        { "id": "plan-history", "type": "persistent", "schema_ref": "plan_trace_v1" },
        { "id": "codebase-model", "type": "ephemeral", "schema_ref": "codebase_state_v1" },
        { "id": "task-templates", "type": "persistent", "schema_ref": "task_template_v1" }
      ],
      "helixes": [
        { "id": "decomposition-learning", "mode": "learning",
          "feeds_into": "decompose", "source": "plan-history" },
        { "id": "template-learning", "mode": "learning",
          "feeds_into": "task-templates", "source": "plan-history" }
      ],
      "lines": [
        { "from": "intent", "to": "survey", "direction": "forward" },
        { "from": "survey", "to": "decompose", "direction": "forward" },
        { "from": "decompose", "to": "classify", "direction": "forward" },
        { "from": "classify", "to": "sequence", "direction": "forward" },
        { "from": "sequence", "to": "gate", "direction": "forward" },
        { "from": "gate", "to": "dispatch", "direction": "forward" },
        { "from": "dispatch", "to": "adapt", "direction": "forward",
          "condition": "task_failure" },
        { "from": "adapt", "to": "decompose", "direction": "return",
          "condition": "phase_or_plan_level_replan" },
        { "from": "adapt", "to": "dispatch", "direction": "return",
          "condition": "task_level_retry" },
        { "from": "dispatch", "to": "completed_work", "direction": "forward",
          "condition": "all_tasks_complete" },
        { "from": "dispatch", "to": "plan-history", "direction": "parallel" },
        { "from": "plan-history", "to": "decomposition-learning", "direction": "forward" },
        { "from": "plan-history", "to": "template-learning", "direction": "forward" }
      ]
    },
    "grammar_compliance": {
      "G1_proximity": true,
      "G2_orientation": true,
      "G3_containment": true,
      "G4_flow": true,
      "G5_resonance": true,
      "violations": []
    },
    "interface": {
      "inputs": [
        { "id": "intent", "type": "seed", "accepts": "text/intent_description" },
        { "id": "human_decision", "type": "seed", "accepts": "text/gate_response" },
        { "id": "process_insight", "type": "seed", "accepts": "text/process_improvement",
          "optional": true, "source": "retrospective_pattern" }
      ],
      "outputs": [
        { "id": "completed_work", "type": "seed", "produces": "code/deployed_feature" },
        { "id": "plan_report", "type": "seed", "produces": "text/plan_summary" }
      ],
      "exposes": [
        { "id": "plan-history", "type": "grid", "access": "read" },
        { "id": "active-plan", "type": "grid", "access": "read" },
        { "id": "task-templates", "type": "grid", "access": "read" }
      ]
    },
    "dependencies": {
      "requires_models": ["llm/planning", "llm/code_analysis"],
      "requires_grids": [],
      "requires_external": ["git", "filesystem"]
    }
  }
}
```

---

## What This Pattern Does NOT Do

**It does not do process improvement.** The Architect faces forward — it plans and executes work. Analysing what went wrong across multiple plans, identifying systemic issues, and recommending process changes is the Retrospective pattern's job. These are fundamentally different cognitive modes: synthesis (Architect) vs. analysis (Retrospective), lead (what to do next) vs. lag (what happened and why). Combining them would compromise both.

**It does not replace human strategic judgment.** The Architect takes intent and produces plans. It does not decide *what* should be built — that remains a human decision. The abstraction escalator has a ceiling: "what to build" is a values question, not a decomposition problem.

**It does not manage multiple concurrent plans.** V1 is sequential: one active plan at a time. Concurrent plan management is a future capability that would require plan-level ΨH measurement (do these plans interfere with each other?).

**It does not communicate directly with external services.** The Architect reads from the filesystem and git. It dispatches to the DevAgent. It does not call APIs, deploy to production, or manage infrastructure. Those would be separate patterns with their own interface shapes.

**It does not self-improve its own code.** The Architect can plan work on *other* patterns, including the DevAgent and Router. But it should not plan modifications to itself — that creates a recursive self-modification loop that requires careful constitutional constraints. Self-improvement of the Architect is a human-gated activity until the constitutional framework can safely govern it.

---

*The Architect formalises the rhythm. Every plan is a hypothesis about how to close the gap between intent and reality. The Codex measures whether the hypothesis was right. The Retrospective distils what worked and what didn't across many hypotheses. What the Architect learns per-plan, it teaches forward through better decomposition. What the Retrospective learns across plans, it teaches the Architect through better process. The human moves up. The patterns move forward.*
