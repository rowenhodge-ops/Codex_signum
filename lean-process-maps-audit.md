# Lean Process Maps — Axiom & Anti-Pattern Audit

**Auditing:** `codex-signum-lean-process-maps.md`
**Against:** 10 Axioms, 5 Grammar Rules, Anti-Pattern Table (CLAUDE.md rows 1-10)
**Date:** 2026-02-27

---

## Violations Found

### VIOLATION 1: Observer Pattern Is Anti-Pattern #1
**Section:** 2.4 (Observer SIPOC), 3.1-3.4 (Flow Maps), Section 6 (Dependency Matrix)
**Anti-pattern:** #1 — Observation pipelines / monitoring overlays
**Axiom violated:** 4 (Visible State) — "Health must be available in the pattern's own structure. External monitoring systems may mirror this data but never be the sole source of it."

**The problem:** The document treats Observer as a pattern — a separate Bloom that sits between execution and the graph, collecting observations, routing them through conditioning, and writing results. This is textbook monitoring overlay. The Observer SIPOC describes a 7-step receive→validate→route→compute→write→check→fire pipeline that interposes between executing patterns and the graph.

**The reality:** Observations are intrinsic to execution. When DevAgent completes a stage, the graph-feeder writes the observation inline. When Thompson selects a model, the Decision node is written inline during `selectModel()`. Signal conditioning is a function call in the write path, not a separate system. Health recomputation is triggered by the write, not by a collector.

**Fix:** Delete Observer as a pattern entirely. Its responsibilities dissolve into:
- **Graph-feeder hook** (consumer adapter) — afterPipeline persistence, already exists
- **Inline signal conditioning** — functions called during graph write, not a routed pipeline
- **Inline health recomputation** — triggered by new observation, not scheduled by a collector
- **ThresholdEvent writes** — part of health recomputation, not a separate fire-and-notify system

**Severity:** Critical. This is the anti-pattern the project has corrected 6+ times across sessions.

---

### VIOLATION 2: Signal Pipeline as Separate Infrastructure
**Section:** 1 (Pattern Inventory — "Supporting infrastructure"), 3.1-3.2 (Flow Maps)
**Anti-pattern:** #2 — Dashboard wrapper functions between graph and consumers
**Axiom violated:** 4 (Visible State) — state is in the structure, not routed through intermediaries

**The problem:** The document lists "Signal Pipeline" as separate supporting infrastructure, consumed by the Observer. The flow maps show data flowing: Pattern → Observer → Signal Pipeline → Health Computation → Graph. This creates 3 intermediary layers between execution and the graph.

**The reality:** Signal conditioning is a set of pure functions called inline when writing an observation to the graph. It's not a pipeline that data flows "through" — it's computation that happens at write time. The 7 stages (validity gate, EWMA smoothing, Hampel filter, etc.) are function calls, not routing stages.

**Fix:** Remove Signal Pipeline from the infrastructure table. Describe it as: "Observation values are conditioned inline during graph writes via 7 pure functions (validity → EWMA → Hampel → trend → Nelson → SPC → composite). No separate pipeline entity exists."

**Severity:** Moderate. Creates the wrong mental model even though the implementation is correct.

---

### VIOLATION 3: Health Computation as Separate Infrastructure
**Section:** 1 (Pattern Inventory), 3.1-3.2 (Flow Maps), Section 6 (Dependency Matrix)
**Anti-pattern:** #3 — Computed views / aggregation functions duplicating graph queries
**Axiom violated:** 4 (Visible State)

**The problem:** "Health Computation" appears as a separate box in flow maps — a standalone system that computes ΦL/ΨH/εR after observations flow through Signal Pipeline. The dependency matrix has it as a row and column that other patterns depend on.

**The reality:** Health computation is a set of pure functions (`computePhiL`, `computePsiH`, `computeEpsilonR`) called inline after a conditioned observation is written. The result is SET on the Pattern node directly. There is no separate "Health Computation" system that patterns query — they read `pattern.phiL` from the graph.

**Fix:** Remove from infrastructure table and dependency matrix. Describe as: "After conditioned observation write, health functions recompute ΦL/ΨH/εR and SET the values directly on the Pattern node. Consumers read Pattern node properties via Cypher."

**Severity:** Moderate. Same mental model issue as Violation 2.

---

### VIOLATION 4: NFR-G5 Creates Shadow Monitoring Store
**Section:** 4.2 (Non-Functional Requirements — NFR-G5)
**Axiom violated:** 3 (Fidelity) — representation must match actual state
**Axiom violated:** 4 (Visible State) — health is in the structure, not in metadata
**Also conflicts with:** 7 (Reversibility)

**The problem:** NFR-G5 states: "Raw values are stored with `_raw` suffix." This creates two versions of every metric on Pattern nodes — `phiL` (conditioned) and `phiL_raw` (unconditioned). This IS a computed view stored alongside the actual state. It introduces the question "which value is real?" and creates a maintenance burden for keeping both in sync.

**The reality:** Raw observation values live on Observation nodes (they're immutable records of what was observed). Conditioned values live on Pattern nodes (they're the current health state). There's no need for `_raw` properties on Pattern nodes. If you want the raw value, query the Observation node: `MATCH (o:Observation)-[:OBSERVED_BY]->(p:Pattern) RETURN o.value`. That's a Cypher query, not a shadow store.

**Fix:** Rewrite NFR-G5: "Pattern node health properties (phiL, psiH, epsilonR) are ALWAYS conditioned values. Raw observation values are preserved on immutable Observation nodes. To reconstruct the conditioning path for any health value, query the Observation chain. No `_raw` suffix properties on Pattern nodes."

**Severity:** Moderate. Creates data model confusion and violates single-source-of-truth.

---

### VIOLATION 5: Dependency Matrix Encodes Phantom Dependencies
**Section:** 6 (Dependency Matrix)
**Axiom violated:** 5 (Minimal Authority) — patterns request only resources their purpose requires
**Grammar rule violated:** G1 (Proximity) — connections only exist where explicitly created

**The problem:** The matrix shows most patterns depending on "Observer", "Signal", and "Health" as separate entities. This overstates authority — these are inline functions, not services with their own identity. The matrix implies 6 patterns need permission from Observer to function. In reality, 0 patterns depend on Observer because Observer doesn't exist.

**Fix:** Remove Observer, Signal Pipeline, and Health Computation rows/columns from dependency matrix. The matrix should show: patterns depend on the Graph (for reading/writing state) and on other patterns (for delegation). Inline computation isn't a dependency — it's part of the write path.

**Severity:** Moderate. Inflates apparent system complexity and obscures real dependencies.

---

### VIOLATION 6: Observer in Cross-Pattern Flow Maps
**Section:** 3.1 (Value Stream), 3.2 (Learning Feedback Loop), 3.4 (Composition Map)
**Anti-pattern:** #1 — Observation pipeline
**Grammar rule violated:** G3 (Containment) — Observer reaches into every pattern's Bloom boundary to collect observations

**The problem:** Every flow map routes data through Observer as an intermediary. The value stream shows: Stage result → Observer → Signal Pipeline → Health Computation → Graph. This is 4 hops between execution and persistence. The composition map has Observer as a central hub.

**The correct flow:**
```
Stage completes
  → graph-feeder.afterStage() [consumer hook, inline]
    → conditionValue(raw) [pure function, inline]
    → session.run(MERGE observation, SET pattern.phiL) [single graph write]
```

One hop. Execution produces a graph write. That's it.

**Fix:** Redraw all flow maps without Observer.

**Severity:** Critical. Every flow map in the document teaches the wrong architecture.

---

### VIOLATION 7: Gap Analysis References Observer
**Section:** 7 (Gap Analysis)
**Anti-pattern:** #1

**The problem:** Three gaps reference Observer:
- "Observer not wired to Signal Pipeline" — Observer doesn't exist, Signal Pipeline isn't a separate thing
- "ThresholdEvent not written" — this is part of inline health recomputation
- "Human feedback CLI not connected" — human feedback writes directly to graph

**Fix:** Reframe these as:
- "Graph-feeder doesn't call conditioning functions inline" (the actual gap)
- "Health recomputation doesn't write ThresholdEvent on band crossing" (the actual gap)
- "Human feedback CLI doesn't write HumanFeedback node to graph" (the actual gap)

**Severity:** Minor (phrasing), but reinforces the wrong mental model if uncorrected.

---

### VIOLATION 8: Use Case UC-5 Routes Through Observer
**Section:** 5.1 (UC-5: Human Feedback Calibration)
**Anti-pattern:** #1

**The problem:** UC-5 step 3: "Observer uses feedback to calibrate quality scoring." Observer is the intermediary again.

**Fix:** Rewrite: "Calibration metrics (validator precision, recall) are computable via Cypher query over HumanFeedback nodes joined with PipelineRun quality scores. No intermediary processes the feedback — the graph IS the calibration store."

**Severity:** Minor.

---

## Axiom-by-Axiom Assessment (Post-Violation Identification)

### 1. Symbiosis ✅ PASS
Patterns expose interpretable interfaces. SIPOCs define clear inputs/outputs. No opaque internal-only state described.

### 2. Transparency ✅ PASS (with caveat)
Every signal has a readable explanation path. **Caveat:** The Signal Pipeline abstraction (Violation 2) hides the individual conditioning stages. Once rewritten as inline functions, the conditioning path becomes transparent.

### 3. Fidelity ⚠️ PARTIAL VIOLATION
NFR-G5's `_raw` suffix (Violation 4) creates dual representations of the same metric. Fixed by storing raw on Observation nodes, conditioned on Pattern nodes.

### 4. Visible State ❌ VIOLATED
Observer, Signal Pipeline, and Health Computation as separate entities create a layer between patterns and their state. Fix: remove all intermediaries, state lives on graph nodes, readable via Cypher.

### 5. Minimal Authority ⚠️ PARTIAL VIOLATION
The Observer has ambient authority — it reaches into every pattern to collect observations. Removing Observer resolves this.

### 6. Provenance ✅ PASS
Strong throughout. The Observer intermediary actually *weakens* provenance by adding an extra hop — removing it strengthens the chain.

### 7. Reversibility ✅ PASS (once Violation 4 fixed)
Immutable ThresholdEvents, Agent nodes never deleted, immutable Observation nodes. Prior states reconstructable.

### 8. Semantic Stability ✅ PASS
Document uses morphemes correctly. No new morphemes invented. Composition extends the grammar.

### 9. Comprehension Primacy ✅ PASS
SIPOCs, flow maps, and use cases prioritise understanding over efficiency.

### 10. Adaptive Pressure ✅ PASS
UC-2 describes the complete learning loop. Thompson posteriors update. εR maintained system-wide.

---

## Grammar Rule Assessment

### G1. Proximity ⚠️ PARTIAL VIOLATION
Observer creates implicit coupling. Once removed, all connections are explicit Lines.

### G2. Orientation ✅ PASS
Flow directions correct throughout.

### G3. Containment ⚠️ PARTIAL VIOLATION
Observer reaches across every Bloom boundary. Once removed, each pattern handles its own scope.

### G4. Flow ✅ PASS
Active Lines carry data. Dormant Lines carry nothing.

### G5. Resonance ✅ PASS
Patterns with aligned interfaces compose naturally. No interface friction.

---

## Anti-Pattern Table Check

| Anti-Pattern | Violated? | Where | Fix |
|---|---|---|---|
| 1. Observation pipeline / monitoring overlay | ❌ YES | Observer pattern, all flow maps | Delete Observer, inline all writes |
| 2. Dashboard wrapper between graph and consumers | ❌ YES | Signal Pipeline as separate infra | Inline functions |
| 3. Computed views / aggregation functions | ❌ YES | Health Computation, NFR-G5 `_raw` | Inline functions, no dual storage |
| 4. codexStats grammar sections | ✅ No | — | — |
| 5. State stored in JSON files | ✅ No | NFR-2 explicitly forbids | — |
| 6-10 | ✅ No | — | — |

---

## Summary

**8 violations found.** All trace to one root cause: treating observation, signal conditioning, and health computation as separate entities rather than inline execution properties.

**The fix is structural, not cosmetic:**
1. Delete Observer as a pattern
2. Remove Signal Pipeline and Health Computation from infrastructure inventory
3. Describe observation writes as inline: `execution → conditionValue() → graph.write()`
4. Remove Observer from all flow maps, dependency matrix, gap analysis, and use cases
5. Fix NFR-G5: raw on Observation nodes, conditioned on Pattern nodes, no `_raw` suffix
6. Simplify dependency matrix to real dependencies only

All fixes applied in `codex-signum-lean-process-maps-v2.md`.