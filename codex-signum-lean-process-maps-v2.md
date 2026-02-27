# Codex Signum — Lean Process Maps, SIPOCs & Requirements

**Purpose:** Map all pattern interdependencies, flows, and requirements before implementation. Every compound error in this project traces to an unmapped dependency. This document eliminates that class of error.

**Date:** 2026-02-27
**Status:** Living document — update as patterns mature
**Audit:** Tested against 10 Axioms, 5 Grammar Rules, Anti-Pattern Table. See audit log for findings.

---

## 1. Pattern Inventory

Four patterns compose the system. Each is a Bloom (○) in Codex terms — a bounded scope with defined interfaces. Two additional patterns are in design phase.

| Pattern | Codex Morpheme | Core/Consumer | Status |
|---|---|---|---|
| Thompson Router | Resonator (Δ) | Core | Implemented, not live |
| DevAgent | Bloom (○) with Helix (🌀) | Core pipeline, DND executors | Implemented, not live |
| Architect | Bloom (○) with nested stages | Core pipeline, DND executors | Implemented, not live |
| Retrospective | Bloom (○) with Grids (□) | Design only | Not implemented |
| Model Sentinel | Resonator (Δ) | Design only | Not implemented |

**Note on observation, signal conditioning, and health computation:** These are NOT separate patterns, infrastructure, or systems. They are **inline functions in the graph write path**. When any pattern writes an observation to the graph, it calls conditioning functions inline and sets health properties directly on graph nodes. The graph IS the state. There is no intermediary. See §3 for how this flows.

---

## 2. Pattern SIPOCs

### 2.1 Thompson Router

**Purpose:** Select the optimal model for a given task via Bayesian learning.

| | Element | Detail |
|---|---|---|
| **S** Suppliers | Agent nodes (graph), Decision history (graph), Caller pattern |
| **I** Inputs | Task context (taskType, complexity, qualityRequirement, costCeiling), Caller pattern ID, Active agent list (from graph query) |
| **P** Process | 1. Query graph for active Agent nodes → 2. Filter by capability requirements → 3. Query arm stats (Beta distributions) per context cluster → 4. Thompson sample from posterior → 5. Write Decision node to graph BEFORE execution → 6. Return selection |
| **O** Outputs | RoutingDecision: { selectedAgentId, wasExploratory, confidence, decisionId } |
| **C** Customers | DevAgent (model selection for each stage), Architect (model selection for DECOMPOSE + DISPATCH), Any pattern needing LLM calls |

**Key interface:** `selectModel(context) → RoutingDecision`

**Graph reads:** Agent nodes (WHERE status = 'active'), arm stats per ContextCluster
**Graph writes:** Decision node (BEFORE execution), Decision outcome (AFTER execution via inline callback in the consumer's graph-feeder)

**Observation flow:** When the consumer records a Decision outcome, the graph-feeder calls `conditionValue()` inline and writes the conditioned Observation node + updates the Router pattern's health properties, all in the same graph transaction.

---

### 2.2 DevAgent Pipeline

**Purpose:** Execute coding tasks through a governed 4-stage pipeline with quality gates and recursive correction.

| | Element | Detail |
|---|---|---|
| **S** Suppliers | Thompson Router (model selection), Task definition (from Architect or human), Codebase (filesystem), Graph (pattern health — read directly from Pattern node properties) |
| **I** Inputs | AgentTask: { intent, sourceFiles, acceptanceCriteria, sourceAcceptanceCriteria }, Pipeline config (maxCorrections, stage hooks) |
| **P** Process | 1. SCOPE (understand task + context) → 2. EXECUTE (generate code via selected model) → 3. REVIEW (assess quality, detect hallucinations) → 4. VALIDATE (verify against acceptance criteria) → Correction Helix: if REVIEW fails, loop EXECUTE→REVIEW up to maxCorrections |
| **O** Outputs | PipelineResult: { success, stages[], provenanceCheck, corrections[], finalOutput, metrics: { rty, %C&A per stage, durationMs, cost } } |
| **C** Customers | Architect (receives task execution results in DISPATCH stage), Human (receives working code) |

**Key interface:** `runPipeline(task, config) → PipelineResult`

**Graph reads:** Pattern health (ΦL) from Pattern node properties, model arm stats (via Thompson Router)
**Graph writes (inline via consumer's graph-feeder):** After pipeline completes, graph-feeder writes Observation nodes per stage, PipelineRun node, and calls `conditionValue()` + `computePhiL()` inline to update Pattern node health. Thompson Decision outcome written inline as part of the same post-pipeline hook.

---

### 2.3 Architect Pipeline

**Purpose:** Transform high-level intent into a sequenced, quality-gated execution plan.

| | Element | Detail |
|---|---|---|
| **S** Suppliers | Human (intent), Codebase (filesystem + git), Graph (Pattern node health properties, prior plans), Thompson Router (model for DECOMPOSE), DevAgent (task execution in DISPATCH) |
| **I** Inputs | Intent string, Repository path, ArchitectConfig: { modelExecutor, taskExecutor, decomposeAttempts, autoGate, dryRun } |
| **P** Process | 1. SURVEY (inspect codebase + git + graph) → 2. DECOMPOSE (LLM: intent → TaskGraph, Best-of-N scoring) → 3. CLASSIFY (mechanical vs generative per task) → 4. SEQUENCE (topological sort + critical path) → 5. GATE (human approval — mandatory V1) → 6. DISPATCH (execute tasks — delegates to TaskExecutor which may call DevAgent) → 7. ADAPT (failure classification + replanning) |
| **O** Outputs | PlanResult: { planId, tasks[], results[], adaptations[], metrics: { totalDuration, tasksSucceeded, tasksFailed, rty } } |
| **C** Customers | Human (approved plan + execution results), DevAgent (receives individual tasks during DISPATCH) |

**Key interface:** `executePlan(intent, repoPath, config, surveyOutput?) → PlanResult`

**Graph reads:** Prior plan outcomes (for ADAPT learning), Pattern node health properties, Agent capabilities (via Survey)
**Graph writes (inline via consumer's graph-feeder):** Plan nodes, per-task Observation nodes, health recomputation — all inline in the post-execution hook.

---

### 2.4 Retrospective (Design Phase)

**Purpose:** Systematic post-execution learning — reads from the graph to identify process improvements and update standardised work. NOT an intermediary — it reads graph state that already exists from inline execution writes.

| | Element | Detail |
|---|---|---|
| **S** Suppliers | Graph (completed plans, pipeline metrics, health trends, historical observations — all already persisted by executing patterns) |
| **I** Inputs | Trigger event (plan completion, threshold crossing, scheduled), Time window for analysis |
| **P** Process | 1. GATHER (Cypher queries against graph: observations, plan outcomes, health trends) → 2. ANALYSE (identify patterns, root causes, improvement opportunities) → 3. BASELINE (compare against standardised work) → 4. RECOMMEND (generate process insights) → 5. VALIDATE (check recommendations don't regress existing metrics) |
| **O** Outputs | Process insights, Updated baselines, FMEA entries, Recommended constitutional amendments |
| **C** Customers | Memory (distilled insights flow to Stratum 3), Constitutional Engine (amendment proposals) |

**Key distinction:** Retrospective reads FROM the graph. It does not sit between executing patterns and the graph. Executing patterns write their own observations inline. Retrospective operates on the accumulated state after the fact — like a Lean kaizen event reviewing work already done.

---

### 2.5 Model Sentinel (Design Phase)

**Purpose:** Keep the model registry current by probing provider APIs and updating Agent nodes.

| | Element | Detail |
|---|---|---|
| **S** Suppliers | Provider APIs (Anthropic, Vertex AI, DeepSeek), Graph (current Agent nodes) |
| **I** Inputs | Trigger (scheduled every 6h or on-demand), Provider configs (API keys, endpoints) |
| **P** Process | 1. Read current Agent nodes → 2. For each provider: call discovery endpoint → 3. Probe each model with trivial prompt → 4. Create/update Agent nodes → 5. Mark unreachable models as degraded → 6. Write probe Observation nodes inline |
| **O** Outputs | Updated Agent nodes in graph, Probe results (latency, reachability, capability detection) |
| **C** Customers | Thompson Router (discovers new models automatically via graph), All patterns (model availability) |

**Key distinction:** Sentinel interacts with EXTERNAL systems (provider APIs) and writes results to the graph. It does not intercept internal execution flows.

---

## 3. Cross-Pattern Flow Maps

### 3.1 Primary Value Stream: "Human Intent → Working Code"

```
Human
  │
  ▼ intent string
┌─────────────┐
│  ARCHITECT   │
│  (7 stages)  │
└──────┬──────┘
       │
       │ SURVEY reads ──────────────────► Neo4j Graph
       │                                  (Pattern node .phiL, .psiH, .epsilonR
       │                                   prior Plan nodes, Agent nodes)
       │
       │ DECOMPOSE calls ──────────────► Thompson Router ──► Graph (Agent nodes)
       │                                      │
       │                                      ▼
       │                              selectModel() returns
       │                              RoutingDecision + writes
       │                              Decision node to graph
       │
       │ CLASSIFY + SEQUENCE (pure computation, no external deps)
       │
       │ GATE ──────────────────────────► Human (approval)
       │
       │ DISPATCH delegates tasks ─────► DevAgent Pipeline
       │     per task:                       │
       │                                     │ Each stage:
       │                                     │   selectModel() → Decision node
       │                                     │   Provider API call
       │                                     │   Stage result
       │                                     │
       │                                     │ After pipeline completes:
       │                                     │   graph-feeder.afterPipeline()
       │                                     │     └─ conditionValue() [inline]
       │                                     │     └─ MERGE Observation nodes
       │                                     │     └─ computePhiL() [inline]
       │                                     │     └─ SET pattern.phiL [inline]
       │                                     │     └─ checkThreshold() [inline]
       │                                     │     └─ MERGE ThresholdEvent if band crossed
       │                                     │     └─ record Decision outcome [inline]
       │                                     │
       │                              ┌──────┘
       │                              ▼
       │ ◄──── task result ──── DevAgent returns PipelineResult
       │
       │ ADAPT (if failures: classify + replan)
       │
       ▼
Human receives: executed plan with provenance
Graph contains: complete execution trace (queryable via Cypher)
Thompson arms: updated (quality signals from Decision outcomes)
```

**Key architectural point:** There is no intermediary between execution and the graph. The graph-feeder's afterPipeline hook does conditioning, health recomputation, threshold checking, and Decision outcome recording all inline in a single post-execution pass.

### 3.2 Learning Feedback Loop: "Execution → Improved Future Execution"

```
Execution completes
       │
       ▼
graph-feeder.afterPipeline() [inline in consumer]
       │
       ├─ conditionValue(rawMetric) [pure function, inline]
       │
       ├─ MERGE (:Observation {value: conditioned, raw: original}) [graph write]
       │
       ├─ computePhiL / computePsiH / computeEpsilonR [pure functions, inline]
       │
       ├─ SET (p:Pattern {phiL: new, psiH: new, epsilonR: new}) [graph write]
       │
       ├─ checkThreshold(oldPhiL, newPhiL) [pure function, inline]
       │    └─ if band crossed: MERGE (:ThresholdEvent) [graph write]
       │         └─ if cascade needed: propagateDegradation() [inline]
       │              └─ topology-aware dampening, max 2 levels
       │
       └─ recordDecisionOutcome(decisionId, quality) [graph write]
            └─ Thompson arm stats updated on ContextCluster
                 └─ Next selectModel() call reads updated posteriors
                      └─ Better model selection next time

[Separately, on schedule or trigger:]
Memory compaction reads Observation nodes → compacts old ones
Memory distillation reads compacted data → produces Stratum 3 profiles
Retrospective reads graph state → produces process insights
```

**No intermediary pattern.** The learning loop is: inline writes update graph state → subsequent reads from graph reflect the learning. Thompson doesn't need to be "told" about outcomes — it reads arm stats from the graph, which were updated inline by the consumer's graph-feeder.

### 3.3 Model Lifecycle: "New Model → Explored → Exploited or Dimmed"

```
Model Sentinel probes providers
       │
       ▼
New model discovered
       │
       ▼
Agent node created in graph
(status: active, alpha=1, beta=1)
       │
       ▼
Thompson Router includes in sampling
(high variance = gets explored)
       │
       ▼
Execution observations written inline by graph-feeder
       │
       ├──► Good results: alpha increases, model gets selected more
       │
       └──► Poor results: beta increases, model gets selected less
                 │
                 ▼ (if consistently poor)
            ΦL drops below threshold
            (detected inline during health recomputation)
                 │
                 ▼
            ThresholdEvent written inline
                 │
                 ▼
            Constitutional rule may set status: degraded
                 │
                 ▼
            Thompson Router excludes from active pool
            (Agent node persists — dim, don't delete)
```

### 3.4 Pattern Composition Map

Who calls whom, and through what interface:

```
                    ┌─────────────────────────┐
                    │    HUMAN (architect)      │
                    └───────────┬──────────────┘
                                │ intent
                                ▼
                    ┌─────────────────────────┐
                    │       ARCHITECT          │
                    │  executePlan()           │
                    └──┬──────────┬────────┬──┘
                       │          │        │
            DECOMPOSE  │   DISPATCH│  SURVEY│
            needs LLM  │   needs   │  reads │
                       │   coder   │  graph │
                       ▼          ▼        ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │ THOMPSON  │  │ DEVAGENT │  │  NEO4J   │
              │  ROUTER   │  │ pipeline │  │  GRAPH   │
              │selectModel│  │runPipeline│ │          │
              └─────┬─────┘  └────┬─────┘  │          │
                    │             │         │          │
                    │        each stage     │          │
                    │        calls router   │          │
                    │◄────────────┘         │          │
                    │                       │          │
                    │  queries agents       │          │
                    │──────────────────────►│          │
                    │                       │          │
                    │  writes decisions     │          │
                    │──────────────────────►│          │
                    │                       │          │
              ┌─────┴─────┐                │          │
              │ PROVIDER   │                │          │
              │   APIs     │                │          │
              │ (20+ models)│               │          │
              └─────┬─────┘                │          │
                    │ response              │          │
                    ▼                       │          │
              graph-feeder                  │          │
              (consumer hook)               │          │
                    │                       │          │
                    │ inline: condition     │          │
                    │ + compute health      │          │
                    │ + write observations  │          │
                    │ + record outcomes     │          │
                    │──────────────────────►│          │
                    │                       │          │
              ┌──────────┐                 │          │
              │  MEMORY   │◄── reads ──────│          │
              │ compact + │                │          │
              │ distill   │─── writes ────►│          │
              └──────────┘                 │          │
                                           │          │
              ┌──────────┐                 │          │
              │ SENTINEL  │─── reads/writes►│         │
              │ (probes)  │                │          │
              └──────────┘                 │          │
                                           │          │
              ┌──────────┐                 │          │
              │  RETRO    │◄── reads ──────│          │
              │ (learns)  │                │          │
              └──────────┘                 └──────────┘
```

**What's NOT in this diagram:** There is no Observer box, no Signal Pipeline box, no Health Computation box. These are inline functions called within the graph-feeder hook. The graph-feeder itself is a consumer adapter (DND-specific), not a pattern.

---

## 4. Graph Node Lifecycle & Integrity Rules

### 4.1 Node Types and Ownership

| Node Type | Created By | Updated By | Read By |
|---|---|---|---|
| Agent | Sentinel (bootstrap/probe) | Sentinel (probe), graph-feeder (health inline), Router (lastUsed inline) | Router, Survey, all patterns |
| Pattern | Bootstrap / pattern registration | graph-feeder (health recomputed inline after each observation batch) | All patterns via Cypher: `MATCH (p:Pattern) RETURN p.phiL` |
| Decision | Router (BEFORE execution, inline) | graph-feeder (outcome AFTER execution, inline) | Router (arm stats via Cypher), Retrospective |
| Observation | graph-feeder (inline, after stage/pipeline completes) | Never (immutable) | Retrospective, Memory compaction, Cypher queries |
| PipelineRun | graph-feeder (inline, after pipeline completes) | graph-feeder (human feedback) | Retrospective, Cypher queries |
| ThresholdEvent | graph-feeder (inline, during health recomputation when band crossed) | Never (immutable) | Retrospective, Cypher queries |
| HumanFeedback | Human (via feedback CLI, writes directly to graph) | Never (immutable) | Calibration queries (Cypher), Retrospective |
| ContextCluster | Router (auto-created on new context) | Router (arm stats update inline) | Router |
| ConstitutionalRule | Bootstrap / Amendment process | Evolution engine | All patterns (rule evaluation) |

### 4.2 Non-Functional Requirements: Graph Integrity

**NFR-G1: No orphaned Decision nodes.**
Every Decision node MUST have either an outcome (success/failure/abandoned) or be reconciled as ABANDONED within 24 hours. Orphaned decisions poison Thompson arm stats. Reconciliation: `MATCH (d:Decision) WHERE d.outcome IS NULL AND d.createdAt < datetime() - duration('PT24H') SET d.outcome = 'ABANDONED'`

**NFR-G2: No Agent nodes without provenance.**
Every Agent node MUST have: id, provider, model (API string), status, createdAt. An Agent with status=active MUST have been probed successfully within the last 24 hours (when Sentinel is running) or been manually verified.

**NFR-G3: Every Observation has a source pattern.**
Observation nodes MUST link to their source Pattern via `[:OBSERVED_BY]` relationship. Unlinked observations are data pollution.

**NFR-G4: Decision → Observation chain must be complete.**
If a Decision node exists (model was selected), there MUST be a corresponding Observation node recording the outcome. Missing links break Thompson learning.

**NFR-G5: Pattern nodes carry conditioned health only.**
Pattern node health properties (`phiL`, `psiH`, `epsilonR`) are ALWAYS the output of inline conditioning functions. Raw observation values are preserved on immutable Observation nodes. To reconstruct the conditioning path for any health value, query the Observation chain: `MATCH (o:Observation)-[:OBSERVED_BY]->(p:Pattern) RETURN o.rawValue, o.conditionedValue ORDER BY o.timestamp DESC`. No `_raw` suffix properties on Pattern nodes. One value per concept per node.

**NFR-G6: Threshold events are immutable audit trail.**
ThresholdEvent nodes are append-only. They record WHAT happened and WHEN. They are never updated or deleted. This is the constitutional audit trail.

**NFR-G7: Agent nodes are never deleted.**
Models that become unavailable get `status: 'retired'` or `status: 'degraded'`. Their Decision history persists. The principle: "dim, don't blacklist."

**NFR-G8: Schema convergence.**
There MUST be exactly ONE schema for Agent/Decision/Observation/Pattern nodes. DND-Manager's legacy schema (`Execution`, `Model`, `Stage` nodes) must be migrated to Codex schema. Two schemas on the same database is a data integrity violation.

---

## 5. Use Cases

### 5.1 Functional Use Cases

**UC-1: Quality Coding with Minimal Rework** (Primary)
*Actor:* Human (architect)
*Trigger:* Human provides intent string
*Flow:*
1. Architect surveys codebase (filesystem + git + graph Pattern node health)
2. Architect decomposes intent into TaskGraph (Best-of-N, N=3)
3. Tasks classified (mechanical/generative), sequenced (dependency-respecting), gated (human approves)
4. Each task dispatched to DevAgent
5. DevAgent selects model via Thompson Router (reasoning tier per task complexity)
6. DevAgent executes SCOPE→EXECUTE→REVIEW→VALIDATE with correction helix
7. Code committed and pushed per task
8. graph-feeder writes observations + updates health inline
9. Architect adapts if failures occur (replan or skip)
*Success:* All tasks complete with RTY > 0.8, zero rework loops beyond correction helix
*Measurable:* %C&A per stage, RTY, total corrections, cost per task — all queryable via Cypher on Observation/PipelineRun nodes

**UC-2: Self-Recursive Learning** (from Codex v3.0)
*Actor:* System (automatic, inline)
*Trigger:* Pipeline execution completes
*Flow:*
1. graph-feeder.afterPipeline() fires (consumer hook, inline)
2. Conditioning functions called inline: `conditionValue()` per metric
3. Health functions called inline: `computePhiL()`, `computePsiH()`, `computeEpsilonR()`
4. Pattern node health properties SET in graph
5. Thompson Decision outcome recorded inline (quality signal → Beta posterior)
6. Threshold check: if ΦL crossed band boundary, ThresholdEvent written inline
7. [Separately] Memory compaction aggregates old Observations (triggered by observation count, not schedule)
8. [Separately] Memory distillation extracts performance profiles (Stratum 3)
9. Next execution: Thompson reads updated posteriors from graph → better model selection
*Success:* Model selection quality improves over time (decreasing correction rate, increasing first-pass success)
*Measurable:* Thompson regret, %C&A trend, correction rate trend — all Cypher queries

**UC-3: Model Discovery and Integration**
*Actor:* Model Sentinel (pattern)
*Trigger:* Scheduled (every 6h) or on-demand
*Flow:*
1. Sentinel reads current Agent nodes from graph
2. Sentinel probes each provider's discovery endpoint
3. New models create Agent nodes (status: active, uniform prior)
4. Unreachable models marked degraded
5. Thompson Router automatically includes new agents (high variance → explored)
6. After 10-20 executions, Thompson has learned posterior → appropriate routing
*Success:* New model available for routing within 6 hours of provider release, zero manual config changes
*Measurable:* Time from model availability to first routing, probe success rate

**UC-4: Degradation Detection and Response**
*Actor:* System (inline during health recomputation)
*Trigger:* graph-feeder health recomputation detects ΦL crossing threshold boundary
*Flow:*
1. graph-feeder calls `checkThreshold(oldPhiL, newPhiL)` inline after health recomputation
2. Band crossing detected (e.g., trusted → healthy)
3. ThresholdEvent node written inline (immutable audit)
4. `propagateDegradation()` called inline if cascade needed
5. Topology-aware dampening applied (γ_effective ≤ 0.7, max depth 2)
6. If algedonic: ΦL < 0.1 → bypass all dampening (γ = 1.0, emergency escalation)
7. Affected Pattern nodes have updated health → subsequent reads reflect degradation
8. Recovery follows hysteresis (2.5× slower than degradation)
*Success:* Degradation contained within 2 levels, no supercritical cascade, recovery path exists
*Measurable:* Cascade depth, containment success rate, recovery time — Cypher queries on ThresholdEvent chain

**UC-5: Human Feedback Calibration**
*Actor:* Human
*Trigger:* Human reviews pipeline output
*Flow:*
1. Human runs `feedback.ts accept <runId>` or `feedback.ts reject <runId> "reason"`
2. CLI writes HumanFeedback node directly to graph, linked to PipelineRun
3. Calibration metrics (validator precision, recall) are computable via Cypher: `MATCH (fb:HumanFeedback)<-[:HAS_FEEDBACK]-(run:PipelineRun) RETURN fb.accepted, run.qualityScore`
4. Over time: false positive/negative rates become measurable from accumulated feedback
5. Thompson arm stats can incorporate human signal (stronger than automated quality score)
*Success:* Validator calibration improves over time, human feedback loop takes < 30 seconds
*Measurable:* Validator precision, validator recall — Cypher aggregations over HumanFeedback nodes

**UC-6: Process Improvement via Retrospective**
*Actor:* Retrospective pattern (reads from graph)
*Trigger:* Architect plan completes, or scheduled
*Flow:*
1. Retrospective queries graph: observations, plan outcomes, health trends (all Cypher)
2. Compares against standardised work baselines (stored as Grid nodes)
3. Identifies patterns (recurring failure modes, bottleneck stages, model-specific issues)
4. Generates recommendations (prompt changes, threshold adjustments, stage reordering)
5. Validates recommendations don't regress existing metrics
6. Writes distilled insights to graph (Memory Stratum 3)
7. May propose constitutional amendments (Tier 3: operational adjustments)
*Success:* Actionable insights produced, baselines updated, no regression
*Measurable:* Insight adoption rate, baseline improvement trend

---

### 5.2 Non-Functional Requirements

**NFR-1: Substrate Agnosticism**
Core MUST NOT know about specific providers, consumer applications, or business domains. All provider-specific logic lives in consumer adapters. A different consumer using a different set of models MUST be able to use the same core patterns.

**NFR-2: Single Source of Truth**
The Neo4j graph is the only persistent state. No JSON files, SQLite databases, log-based state stores, or in-memory caches that outlive a single function call. Thompson arm stats live in the graph. Health lives on Pattern nodes. Decision history lives as Decision nodes.

**NFR-3: State Is Structural**
There is no separate monitoring layer. Health is readable directly from Pattern node properties via Cypher. Decision traces are queryable. Observation history is queryable. No wrapper functions, no computed views, no dashboard-as-code. The graph is not a data source for instrumentation — it IS the instrumentation.

**NFR-4: Governance Persistence**
CLAUDE.md files and RULES.md provide structural constraints that persist across coding sessions. Constitutional rules are evaluated at runtime. Hooks prevent known anti-patterns. Governance survives context window reset.

**NFR-5: Graceful Degradation**
When a model becomes unavailable, the system routes around it. When a pattern degrades, cascade dampening contains the blast radius. When all models in a provider fail, the system uses remaining providers. No single point of failure.

**NFR-6: Compositional Complexity**
Each pattern works independently. Patterns compose through well-defined interfaces (`selectModel`, `runPipeline`, `executePlan`). Adding a new pattern requires: create the Bloom, define the SIPOC, connect via Lines to existing patterns. No modification of existing patterns required.

**NFR-7: Provenance at Every Level**
Every Decision traces to: who requested it, which model was selected, why (arm stats at time of selection), whether it was exploratory, and what the outcome was. Every Observation traces to: which pattern produced it, when, from which pipeline run. Every code change traces to: which Architect plan, which task, which model generated it. All provenance is in the graph, queryable via Cypher.

**NFR-8: Constitutional Immutability**
The six morphemes, ten axioms, three meta-imperatives, three state dimensions, and five grammar rules do not change except through constitutional amendment. Signal pipeline parameters, dampening factors, and operational thresholds may adjust through Tier 3 amendments.

**NFR-9: Recovery Over Restart**
The system recovers from degradation through the same structural paths — inline observation writes → health recomputation → Thompson learning → improved routing. It does not require restart, redeployment, or manual intervention for routine degradation. Hysteresis (2.5×) ensures recovery is earned, not bounced into.

**NFR-10: Cost Efficiency**
The RTR framework (Reasoning Tier Routing) ensures expensive models are used only for tasks that require deep reasoning. Mechanical tasks route to cheap/fast models. Planning tasks route to the strongest available model. Cost per quality-unit should monotonically improve over 30-day windows.

---

## 6. Dependency Matrix

Who depends on whom. Read as: "Row depends on Column."

| | Router | DevAgent | Architect | Graph | Sentinel | Retro | Memory |
|---|---|---|---|---|---|---|---|
| **Router** | — | | | ● | | | |
| **DevAgent** | ● | — | | ● | | | |
| **Architect** | ● | ● | — | ● | | | |
| **Sentinel** | | | | ● | — | | |
| **Retro** | ○ | | | ● | | — | ○ |
| **Memory** | | | | ● | | | — |

● = hard dependency (cannot function without)
○ = soft dependency (enhanced by, but can operate without)

**Critical path:** Architect → DevAgent → Thompson Router → Graph → Agent Nodes

**What's NOT in this matrix:** There are no rows for "Observer", "Signal Pipeline", or "Health Computation". These are inline functions in the graph write path, not entities with dependencies. They have no identity, no state, no authority. They're called, they compute, they return.

---

## 7. Gap Analysis: What's Missing

Based on the SIPOCs and flow maps, these are the unimplemented connections:

| Gap | Between | Impact | Priority |
|---|---|---|---|
| `selectModel()` doesn't exist as a unified API | Router ↔ all consumers | Nothing can route to live models | **P0** |
| Agent nodes not seeded in graph | Router ↔ Graph | Router has no models to select from | **P0** |
| Dual Neo4j schema | DND legacy ↔ Codex schema | Data pollution, broken joins | **P0** |
| DevAgent doesn't call Router | DevAgent → Router | Each stage hardcoded to one model | **P1** |
| graph-feeder doesn't call conditioning functions inline | Graph write path | Raw metrics written to graph (unconditioned) | **P1** |
| Decision outcome callback missing | Router → Graph | Thompson can't learn (no quality signal) | **P1** |
| Architect DISPATCH doesn't delegate to DevAgent | Architect → DevAgent | Tasks executed by naive executor | **P1** |
| Health recomputation doesn't write ThresholdEvent on band crossing | Graph write path | No audit trail for degradation | **P2** |
| Human feedback CLI doesn't write HumanFeedback node to graph | Human → Graph | No calibration signal | **P2** |
| Memory compaction not running | Memory → Graph | Unbounded observation growth | **P2** |
| Retrospective pattern not implemented | Retro → Graph | No systematic learning | **P3** |
| Model Sentinel not implemented | Sentinel → Graph | Manual model management | **P3** |
| Constitutional gate not in routing flow | Constit. → Router | Degraded models not blocked | **P3** |

**P0 must land before any live API testing. P1 enables meaningful live testing. P2 enables production operation. P3 enables autonomous improvement.**

---

## 8. Implementation Sequence (Revised)

Based on the dependency matrix and gap analysis:

**Phase 0: Graph Foundation** (1 session)
- Extend AgentProps schema
- Seed all 20+ models as Agent nodes
- Migrate DND legacy schema to Codex schema (Execution→Decision, Model→Agent)
- Verify: `MATCH (a:Agent) RETURN count(a)` = 20+

**Phase 1: selectModel() + Decision Loop** (1 session)
- Create `selectModel()` in core
- Wire Decision outcome callback (quality signal back to graph, inline in consumer's graph-feeder)
- Verify: call selectModel → Decision node written → outcome recorded → arm stats updated

**Phase 2: DevAgent Live** (1 session)
- Wire ModelExecutor to selectModel() (per-stage routing)
- Wire graph-feeder to call `conditionValue()` + `computePhiL()` inline during observation writes
- Wire graph-feeder to write Observation + PipelineRun nodes in Codex schema
- Verify: run single task → all stages route through Thompson → conditioned metrics in graph

**Phase 3: Architect Live** (1 session)
- Wire Architect's TaskExecutor to delegate to DevAgent
- Wire DECOMPOSE to use selectModel() via ModelExecutor
- Verify: full SURVEY→...→ADAPT with real APIs, provenance in graph

**Phase 4: Feedback + Threshold + Memory** (1 session)
- Wire ThresholdEvent write inline during health recomputation
- Wire human feedback CLI (writes directly to graph)
- Wire Memory compaction (Stratum 2)
- Verify: degradation → threshold event → cascade contained

**Phase 5: Sentinel + Retrospective** (future)
- Model Sentinel pattern
- Retrospective pattern
- Constitutional gate in routing flow

---

*This document is the lean pre-work. Every coding session from here forward should reference the relevant SIPOC and verify its work against the dependency matrix. If a session creates a connection not shown here, update this document first.*