# Codex Signum — Implementation README

## For the Developer (Human or Agent)

**What this is:** The build instructions for Codex Signum, a graph-native governance protocol where state is structural. If you are a coding agent (Copilot, Claude, etc.), this is your task list and rulebook. Read this first. Follow it exactly.

**What this is NOT:** This is not the theory. For theory, read `codex-signum-v3.0.md`. For engineering constraints, read `engineering-bridge-v2.0.md`. You will need both, but start here.

**Golden Rule:** The Neo4j graph is the single source of truth. Health is not computed *about* the system — it is expressed *in* the system's structure. If you find yourself creating a separate monitoring database, a health cache, a status JSON file, or any parallel state store — stop. You are violating the core principle. Write it to the graph.

---

## Architecture at a Glance

```
codex-signum/
├── core/                          # Codex infrastructure (the bootloader)
│   ├── graph/                     # Neo4j connection, schema, queries
│   │   ├── client.ts              # Neo4j driver setup
│   │   ├── schema.ts              # Node types, relationships, constraints
│   │   └── queries.ts             # Reusable Cypher query builders
│   │
│   ├── types/                     # TypeScript types encoding Codex constraints
│   │   ├── morphemes.ts           # Seed, Line, Bloom, Resonator, Grid, Helix
│   │   ├── state-dimensions.ts    # ΦL, ΨH, εR — composite types, never scalars
│   │   ├── constitutional.ts      # Rule types, amendment taxonomy
│   │   └── memory.ts              # Four-stratum memory topology types
│   │
│   ├── computation/               # State dimension calculators
│   │   ├── phi-l.ts               # Health score computation
│   │   ├── psi-h.ts               # Harmonic signature (λ₂ + TV_G)
│   │   ├── epsilon-r.ts           # Exploration rate tracking
│   │   ├── dampening.ts           # Topology-aware cascade dampening
│   │   └── maturity.ts            # Network maturity index
│   │
│   ├── constitutional/            # Constitutional governance layer
│   │   ├── rule-engine.ts         # Evaluate rules against decisions
│   │   ├── evolution.ts           # Amendment mechanism (parameter/structural/foundational)
│   │   └── cascade-prevention.ts  # Circuit breaker, hysteresis, dampening
│   │
│   └── memory/                    # Four-stratum memory operations
│       ├── ephemeral.ts           # Stratum 1: live execution state
│       ├── observational.ts       # Stratum 2: raw records (RETAINED)
│       ├── distilled.ts           # Stratum 3: extracted patterns
│       └── institutional.ts       # Stratum 4: proven knowledge
│
├── patterns/                      # Patterns that live in the Codex
│   ├── thompson-router/           # Model routing pattern
│   │   ├── RULES.md               # Routing-specific Codex constraints
│   │   ├── router.ts              # Core routing logic
│   │   ├── sampler.ts             # Thompson sampling implementation
│   │   └── config.ts              # Model registry, cost ceilings
│   │
│   ├── dev-agent/                 # Development agent pattern
│   │   ├── RULES.md               # DevAgent-specific Codex constraints
│   │   ├── agent.ts               # Agent orchestration
│   │   ├── workflows.ts           # Coding workflow definitions
│   │   └── pipeline.ts            # SCOPE → EXECUTE → REVIEW → VALIDATE
│   │
│   └── observer/                  # Validation & testing pattern
│       ├── RULES.md               # Observer-specific constraints
│       ├── collector.ts           # Observation collection from graph
│       ├── evaluator.ts           # Hypothesis evaluation
│       └── auditor.ts             # Constitutional amendment auditing
│
├── ui/                            # Dashboard / visualization
│   ├── dashboard/                 # System state overview
│   └── graph-viewer/              # Neo4j graph exploration
│
├── codex/                         # Reference documents (read-only)
│   ├── codex-signum-v3.0.md       # The specification
│   ├── engineering-bridge-v2.0.md # The engineering constraints
│   └── research-index.md          # Research provenance
│
├── tests/                         # Structural conformance + unit tests
│   ├── conformance/               # Does the graph match the Codex?
│   ├── unit/                      # Component tests
│   └── integration/               # Cross-pattern tests
│
├── .github/                       # CI/CD
│   └── workflows/
│       └── conformance.yml        # Run conformance checks on every push
│
├── package.json
├── tsconfig.json
└── README.md                      # This file
```

---

## Non-Negotiable Constraints

These are architectural invariants. Every piece of code must satisfy them. They are not guidelines.

### 1. State Is Structural

All pattern state lives in the Neo4j graph. No exceptions.

- Decision outcomes → graph nodes with relationships
- Health scores → computed from graph properties, stored as graph properties
- Constitutional rules → graph nodes with `GOVERNS` relationships
- Memory → graph nodes in the appropriate stratum
- NO separate health databases, JSON caches, SQLite tables, or log-file-as-state

### 2. ΦL Is Always a Composite

ΦL (health score) is NEVER a single number passed around. It is always this structure:

```typescript
interface PhiL {
  raw: {
    success_rate: number;       // 0.0–1.0
    axiom_compliance: number;   // 0.0–1.0
    provenance_clarity: number; // 0.0–1.0
  };
  weights: { success: number; compliance: number; provenance: number };
  maturity_factor: number;      // (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
  effective: number;            // weighted_raw × maturity_factor
}
```

If you see `health: number` or `phi_l: number` anywhere — it's wrong. Fix it.

### 3. ΨH Is Two Components

ΨH (harmonic signature) is NEVER a similarity score. It is:

```typescript
interface PsiH {
  lambda_2: number;  // Fiedler eigenvalue — algebraic connectivity of graph Laplacian
  tv_g: number;      // Graph Total Variation — signal smoothness across connections
  combined: number;  // λ₂ + TV_G
}
```

ΨH is a graph property, not a per-node property. It measures how well the ecosystem holds together.

### 4. Dampening Is Topology-Aware

NEVER use a fixed dampening factor. Always compute from local topology:

```typescript
// γ_effective = min(0.7, 0.8 / (k - 1))  where k = branching factor
// NOT γ = 0.7 everywhere
```

### 5. Hysteresis Ratio Is 2.5×

Recovery is 2.5× slower than degradation. Not 1.5×. This was corrected by the research corpus.

### 6. Cascade Limit Is 2 Levels

Degradation propagates at most 2 containment levels (Bloom boundaries). This is the primary safety mechanism. Never increase this without a foundational amendment.

### 7. Memory Is Retained

Stratum 2 (Observational) data is RETAINED. It is not ephemeral. It persists in the graph. Compaction to Stratum 3 (Distilled) summarises but does not delete raw observations until storage policy dictates. This is critical — we need historical data for hypothesis testing months from now.

### 8. Every Decision Is Logged Structurally

Every routing decision, constitutional check, and feedback outcome must be written to the graph with:
- Timestamp
- What alternatives existed
- What was selected and why
- Which constitutional rules were evaluated
- The outcome (when known)

This is not optional logging. This IS the system's memory.

---

## Morpheme → Code Mapping

When you see Codex terminology in comments or docs, this is what it means in code:

| Codex Term | What It Is In Code | Example |
|---|---|---|
| Seed (•) | Atomic component — function, service, data point | A model endpoint, a quality scorer |
| Line (→) | Connection — data flow, dependency, feedback path | A Neo4j relationship |
| Bloom (○) | Boundary — module scope, pipeline stage | A pattern's containment boundary |
| Resonator (Δ) | Transformation — routing decision, processing step | The Thompson sampler selecting a model |
| Grid (□) | Knowledge structure — graph, schema, storage | The Neo4j graph itself |
| Helix (🌀) | Feedback loop — retry, learning, evolution | Correction loop, Bayesian update cycle |

### Helix Modes (determined by context, not declared)

| Mode | Timescale | Example |
|---|---|---|
| Correction Helix | Within single execution | REVIEW → re-EXECUTE retry loop |
| Learning Helix | Across executions | Thompson sampling beta distribution updates |
| Evolutionary Helix | Across ecosystem | Constitutional rule evolution over weeks |

---

## Build Sequence

### Priority order. Do these in this order. Do not skip ahead.

---

### TASK 1: Neo4j Schema and Connection (Week 1)

**Goal:** Working Neo4j instance with the Codex schema, queryable from TypeScript.

**Deliverables:**
- `core/graph/client.ts` — Neo4j driver connection with health check
- `core/graph/schema.ts` — Schema creation/migration script
- `core/types/` — All TypeScript types from the constraints above

**Schema — Core Node Labels:**

```cypher
// Agents (models, services — the compute substrate)
CREATE CONSTRAINT FOR (a:Agent) REQUIRE a.id IS UNIQUE;
// Properties: id, name, provider, model_string, capabilities[], status

// Patterns (compositions of morphemes that do work)
CREATE CONSTRAINT FOR (p:Pattern) REQUIRE p.id IS UNIQUE;
// Properties: id, name, type, created_at, phi_l (composite JSON)

// Decisions (routing choices, governance evaluations)
CREATE CONSTRAINT FOR (d:Decision) REQUIRE d.id IS UNIQUE;
// Properties: id, timestamp, context, alternatives[], selected, reason, outcome

// Constitutional Rules (governance constraints)
CREATE CONSTRAINT FOR (r:ConstitutionalRule) REQUIRE r.id IS UNIQUE;
// Properties: id, name, type (parameter|structural|foundational), expression, status (active|deprecated), created_at

// Observations (Stratum 2 memory — RETAINED)
CREATE CONSTRAINT FOR (o:Observation) REQUIRE o.id IS UNIQUE;
// Properties: id, timestamp, source_pattern, observation_type, data (JSON), stratum (always 2)

// Distillations (Stratum 3 memory — extracted patterns)
CREATE CONSTRAINT FOR (di:Distillation) REQUIRE di.id IS UNIQUE;
// Properties: id, created_at, source_observations[], insight, confidence, stratum (always 3)
```

**Schema — Core Relationships:**

```cypher
// Pattern composition
(p:Pattern)-[:CONTAINS]->(s:Agent|Pattern)      // Containment (Bloom)
(p:Pattern)-[:CONNECTS_TO]->(p2:Pattern)         // Data flow (Line)
(p:Pattern)-[:GOVERNED_BY]->(r:ConstitutionalRule) // Constitutional governance

// Decision tracing
(d:Decision)-[:MADE_BY]->(p:Pattern)             // Which pattern decided
(d:Decision)-[:SELECTED]->(a:Agent)              // Which agent was chosen
(d:Decision)-[:EVALUATED]->(r:ConstitutionalRule) // Which rules were checked
(d:Decision)-[:RESULTED_IN]->(o:Observation)     // What happened

// Memory topology
(o:Observation)-[:OBSERVED_BY]->(p:Pattern)      // Which pattern recorded this
(di:Distillation)-[:DISTILLED_FROM]->(o:Observation) // Provenance chain

// Constitutional evolution
(r:ConstitutionalRule)-[:EVOLVED_FROM]->(r2:ConstitutionalRule) // Amendment chain
(r:ConstitutionalRule)-[:EVIDENCED_BY]->(di:Distillation)       // What justified the change
```

**Verification:**
- Can create all node types and relationships
- Can query nodes back with properties
- Schema constraints enforce uniqueness
- TypeScript types compile without errors

**Test:** Write a test that creates a dummy Decision node, links it to an Agent and a ConstitutionalRule, and queries it back. If this works, the foundation is solid.

---

### TASK 2: ΦL Computation (Week 1–2)

**Goal:** Compute health scores from graph state, not from external metrics.

**Deliverables:**
- `core/computation/phi-l.ts` — ΦL calculator
- `core/computation/maturity.ts` — Maturity factor calculator

**Implementation rules (from Engineering Bridge v2.0 §Part 2):**

```typescript
// ΦL_effective = ΦL_raw × maturity_factor
//
// ΦL_raw = weighted combination of:
//   success_rate:       from Observation nodes (outcomes)
//   axiom_compliance:   from ConstitutionalRule evaluations
//   provenance_clarity: from traceability of Decision chains
//
// maturity_factor = (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
//
// Recency weighting on observations:
//   observation_weight = e^(-λ × age)
//   λ depends on rate of change (days for model perf, months for schema)

// Interpretation thresholds:
// ≥ 0.9  → Trusted   (prefer for routing)
// 0.7–0.9 → Healthy  (normal operation)
// 0.5–0.7 → Degraded (reduce frequency, investigate)
// < 0.5  → Unhealthy (quarantine)
```

**CRITICAL:** ΦL is computed FROM the graph. The function takes a node ID, queries its Observations, ConstitutionalRule evaluations, and connection count, and returns the composite PhiL type. It does NOT accept pre-computed numbers.

**Verification:**
- A new pattern with 0 observations returns low ΦL (maturity factor near 0)
- A pattern with many successful observations returns high ΦL
- Old observations contribute less than recent ones (recency decay)
- ΦL is stored back on the Pattern node after computation

---

### TASK 3: Thompson Router Pattern (Week 2–3)

**Goal:** Working model router that selects LLM models using Thompson Sampling, logs all decisions to the graph, and is governed by constitutional rules.

**Deliverables:**
- `patterns/thompson-router/router.ts`
- `patterns/thompson-router/sampler.ts`
- `patterns/thompson-router/config.ts`
- `patterns/thompson-router/RULES.md`

**RULES.md for Thompson Router:**

```markdown
# Thompson Router — Codex Constraints

## This pattern is a Resonator (Δ)
It transforms task requests into model selections. It is contained within
its own Bloom (module boundary). It connects via Lines to Agent nodes
(models) and to the constitutional layer.

## Routing constraints (from Engineering Bridge v2.0)
1. Selection is informed by history — query the graph, not a local cache
2. Selection is NEVER fully deterministic — εR > 0 always
3. Failed models are dimmed, not blacklisted — ΦL decreases, never hard-excluded
4. Every routing decision is recorded as a Decision node with full context
5. High ΦL with εR = 0 is a WARNING, not a success

## Constitutional checks before each decision
- Quality threshold: min acceptable quality score (from active ConstitutionalRule)
- Cost ceiling: max cost per decision (from active ConstitutionalRule)
- Reliability requirement: min success rate for selection (derived from Agent ΦL)
- Cascade prevention: max consecutive failures before circuit break

## Thompson Sampling specifics
- Maintain Beta(α, β) distributions per model per task type
- Decay factor: 0.99 (old observations lose weight)
- εR = exploratory_decisions / total_decisions (track explicitly)
- Separate posteriors per context type — do not use global posteriors only
```

**Implementation:**
1. Router receives task request with context (task type, complexity, budget)
2. Router queries graph for active Agents and their ΦL
3. Router queries active ConstitutionalRules
4. Thompson sampler draws from Beta distributions, selects model
5. Constitutional check validates selection against rules
6. Decision node written to graph BEFORE execution (with selected, alternatives, reason)
7. Execution happens (call the selected model)
8. Outcome written to graph as Observation node linked to Decision
9. Beta distributions updated (Learning Helix)
10. ΦL recomputed for affected Agent

**Verification:**
- Router selects models and logs decisions to graph
- Can query decision history and see which models were selected for which tasks
- εR is trackable (some decisions are exploratory)
- Constitutional rules actively constrain selection (e.g., cost ceiling enforced)
- A model with declining success rate gets selected less often over time

---

### TASK 4: DevAgent Pattern (Week 3–4)

**Goal:** Coding agent governed by the Codex that uses the Thompson router for model selection.

**Deliverables:**
- `patterns/dev-agent/agent.ts`
- `patterns/dev-agent/workflows.ts`
- `patterns/dev-agent/pipeline.ts`
- `patterns/dev-agent/RULES.md`

**Pipeline structure:**

```
SCOPE (Opus) → EXECUTE (Routed via Thompson) → REVIEW (Sonnet) → VALIDATE (Sonnet)
```

**Rules:**
1. Each stage traces execution through the graph (model, duration, tokens, quality, success/failure)
2. Each stage's output is traceable to its input (Axiom 6: Provenance)
3. A stage that fails signals degradation, does not silently pass garbage forward (Axiom 3: Fidelity)
4. Stages do not share mutable state — communication through defined pipeline data flow (Grammar Rule G3: Containment)
5. REVIEW → EXECUTE retry loop is a Correction Helix (max 3 iterations, then pass best available + signal degraded ΦL)

**CRITICAL:** The DevAgent uses the Thompson router from Task 3. It does not implement its own model selection. If the router is not working, the DevAgent cannot function. This is an intentional dependency — it forces the router to work before the agent can be built.

**Verification:**
- DevAgent can accept a coding task, route it through the pipeline, and return output
- All pipeline stages are logged as Decision + Observation nodes in the graph
- Retry loops (Correction Helix) are visible in the graph as linked Decision chains
- ΦL for the DevAgent pattern updates based on pipeline outcomes

---

### TASK 5: Observer Pattern (Week 4–5)

**Goal:** Pattern that monitors the graph, collects validation data, and evaluates hypotheses.

**Deliverables:**
- `patterns/observer/collector.ts`
- `patterns/observer/evaluator.ts`
- `patterns/observer/auditor.ts`
- `patterns/observer/RULES.md`

**The Observer reads from the graph. It does not receive events or callbacks.** It queries the graph on a schedule (or on-demand) and computes:

**Collector:**
- ΦL trajectories over time for all patterns
- εR distribution for the Thompson router
- ΨH between pattern pairs (once enough topology exists)
- Decision outcomes aggregated by model, task type, time window
- Cascade events (sequential failures, dampening activations)
- Memory stratum distribution (how much at each level)

**Evaluator (hypothesis testing):**
- H1: Compare ΦL trajectory before/after constitutional evolution events
- H3: Compare cost-quality ratio across routing strategies
- H5: Measure cascade depth and recovery time after failures
- Report: "Hypothesis X has N data points, needs M more for significance at p < 0.05"

**Auditor (constitutional monitoring):**
- Track every constitutional rule change (EVOLVED_FROM relationships)
- Measure ΦL/ΨH/εR before and after each amendment
- Flag amendments that produced transient improvement followed by regression

**CRITICAL:** The Observer has its own ΦL. If it stops working (fails to collect, produces incorrect analyses), it degrades. It is governed by the same Codex as everything else.

**Verification:**
- Observer can query the graph and produce summary statistics
- Observer correctly identifies ΦL trends (improving, stable, degrading)
- Observer reports data sufficiency for each hypothesis
- Observer's own ΦL is tracked

---

### TASK 6: Dashboard UI (Week 5–6)

**Goal:** Visual interface for the human operator to interpret system state.

**Deliverables:**
- `ui/dashboard/` — System overview (ΦL, εR, constitutional state, hypothesis progress)
- `ui/graph-viewer/` — Interactive Neo4j graph exploration

**Dashboard must show:**
1. Current ΦL for every pattern (with trend arrows)
2. εR for the Thompson router (current + 30-day average)
3. Constitutional rules: active, recently evolved, evidence thresholds
4. Hypothesis status: data points collected, significance levels, verdict
5. Memory health: distribution across strata, compaction activity
6. Recent cascade events (if any)

**Graph viewer must allow:**
1. Browse patterns and their relationships
2. Click a pattern to see its ΦL history, decision log, memory
3. Click a decision to see its full trace (alternatives, selection, rules evaluated, outcome)
4. Time-travel: view graph state at a previous point in time (from Stratum 2 observations)

**Technology:** Use whatever renders effectively in a browser. React + Neo4j Browser integration, or a lightweight custom viewer. The choice of UI framework is a pattern-level decision, not a Codex-level one.

---

### TASK 7: Structural Conformance Tests (Ongoing from Task 1)

**Goal:** Automated checks that the graph matches the Codex.

Build these incrementally as you build each task. Run them on every commit.

```typescript
// conformance/schema.test.ts
// - Every Decision node has at least one EVALUATED relationship to a ConstitutionalRule
// - Every Pattern node has a composite ΦL (not a bare number)
// - Every Agent node is CONTAINED by at least one Pattern
// - No health data exists outside the graph (scan for JSON files, SQLite, etc.)
// - Every Observation has a timestamp and source_pattern
// - Memory stratum values are valid (1, 2, 3, or 4)

// conformance/constraints.test.ts
// - Dampening is topology-aware (no fixed 0.7 anywhere)
// - Hysteresis ratio is 2.5× (not 1.5×)
// - Cascade limit is ≤ 2 levels
// - εR is never exactly 0 for any active pattern
// - ΦL computation uses maturity_factor (new patterns can't have high ΦL)

// conformance/memory.test.ts
// - Stratum 2 observations are being retained (not deleted after compaction)
// - Distillation nodes have DISTILLED_FROM relationships to Observations
// - No orphaned Observations (all have OBSERVED_BY relationships)
```

---

## What NOT to Build

- **Separate monitoring infrastructure.** No Prometheus, Grafana, or external metrics stores for Codex state. The graph IS the monitoring. (External tools can READ from the graph later, but they are not the source of truth.)
- **A message bus or event system between patterns.** Patterns communicate through shared graph structure. If Pattern A needs to know about Pattern B's decisions, it queries the graph.
- **An AI agent framework.** This is not AutoGen or LangGraph. There is no agent orchestrator. Patterns are compositions of morphemes governed by the Codex. The Thompson router routes. The DevAgent pipelines. They don't "negotiate" or "collaborate" — they are structural.
- **Separate constitutional rule files.** Rules live in the graph as ConstitutionalRule nodes. Not in YAML, not in JSON config files. The RULES.md files in each pattern directory are documentation for you (the developer) — they describe what the rules ARE, but the rules themselves live in the graph.
- **Predictive AI for governance.** Don't add ML models to predict failures or optimise routing. The Thompson sampler IS the learning mechanism. Constitutional evolution IS the adaptation. Keep it simple. Add sophistication only after the basic loop works and produces data.

---

## When You're Stuck

1. **Check the RULES.md** in the relevant pattern directory — it has the specific constraints for that component.
2. **Check Engineering Bridge v2.0** — it has the parameter values, formulas, and safety limits.
3. **Check the types in `core/types/`** — if the types compile, the structure is probably right.
4. **Run conformance tests** — they'll tell you specifically what's wrong.
5. **When in doubt, write to the graph.** If you're unsure where something should go, it goes in Neo4j as a node with relationships. You can refine the schema later. You cannot recover data you never stored.

---

## Success Criteria

**Phase 1 complete (Tasks 1–3):**
- [ ] Neo4j has the schema and accepts/returns data correctly
- [ ] ΦL computes from graph state and updates on Pattern nodes
- [ ] Thompson router selects models, logs decisions, respects constitutional rules
- [ ] εR is tracked and > 0
- [ ] At least one constitutional rule is actively enforced

**Phase 2 complete (Tasks 4–5):**
- [ ] DevAgent pipelines coding tasks through SCOPE → EXECUTE → REVIEW → VALIDATE
- [ ] All pipeline stages logged structurally in the graph
- [ ] Observer pattern collects data and reports hypothesis status
- [ ] Memory strata 1–3 are populated and queryable

**Phase 3 complete (Tasks 6–7):**
- [ ] Dashboard renders current system state legibly
- [ ] Graph viewer allows exploration of patterns, decisions, memory
- [ ] Conformance tests pass on every commit
- [ ] At least one hypothesis has sufficient data for preliminary analysis

---

## Environment Setup

```bash
# Prerequisites
node >= 20
npm >= 10
Neo4j >= 5.x (local or Aura free tier)

# Setup
npm install
cp .env.example .env  # Add Neo4j connection string, API keys

# Verify Neo4j connection
npm run graph:check

# Run conformance tests
npm run test:conformance

# Run all tests
npm test
```

---

*The Codex defines the grammar. Patterns are the sentences. Build the grammar first, then write sentences with it. The grammar tests itself by governing the sentences that test it.*
