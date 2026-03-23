# Add Bloom Definition documentation

> Task ID: t8
> Model: claude-opus-4-6:adaptive:high
> Duration: 124180ms
> Output chars: 19986
> Timestamp: 2026-03-23T18:06:09.510Z

> **⚠️ Hallucination flags (2):**
> - [content/warning] Task t8 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context
> - [content/warning] Task t8 references a document ("docs/specs/06_codex-signum-architect-pattern-design.md") that was not in its context

---

# Assayer Bloom Definition: Pattern Documentation Analysis (Cycle 8, t8)

## Executive Summary

This document consolidates findings from tasks t1–t5 into a unified documentation specification for the Assayer Bloom Definition — its structure, its relationships within the Architect Bloom topology, and the structural gaps that must be addressed for the definition to be fully integrated. The Assayer Bloom is not an ancillary governance ornament; it is the **primary compliance evaluation surface** within the Architect pattern. Every stage Bloom's output flows through it. Its definition must therefore be precise, well-connected, and verifiable.

---

## 1. Assayer Bloom Definition Structure

### 1.1 Identity

| Property | Value | Source |
|----------|-------|--------|
| Morpheme type | Bloom (○) | v5_0b §4: "Assayer Bloom" listed under Governance Morphemes |
| Constitutional role | Concurrent governance morpheme | v5_0b §1: listed alongside Refinement Helix, ΨH Resonator, Escalation Mechanism Resonator |
| Containment parent | Architect Bloom | v5_0b §4 Full Hierarchy |
| Definition seed type | `bloom-definition` | Inferred from t4/t5: structural survey matches `def.seedType IN ['transformation-definition', 'bloom-definition']` |

**Why a Bloom, not a Resonator:** The Assayer contains its own internal morphemes — an Evaluation Resonator, a planned Statistical Assessment Resonator, Config Seeds, a Violation Grid, and an Observation Grid. Per G3 (Containment), only Blooms contain other morphemes. A Resonator transforms; the Assayer **contains** transformations and their observation infrastructure. The constituent test (Identity Map v2.0) is satisfied.

### 1.2 Internal Composition

The Assayer Bloom Definition must declare the following internal morpheme slots:

| Morpheme | Type | Status | Purpose |
|----------|------|--------|---------|
| Evaluation Resonator | Δ (Resonator) | Active | Per-Seed grammar + axiom compliance checking |
| Statistical Assessment Resonator | Δ (Resonator) | Planned (R-60) | CI on adaptation_rate, ANOVA on stage quality variance, hypothesis tests on violation-to-correction ratio |
| Config Seeds | • (Seed) | Active | Evaluation rules, severity thresholds |
| Violation Grid | □ (Grid) | Active | Detected violations with severity, axiom reference, source stage |
| Observation Grid | □ (Grid) | Active | Evaluation execution records |

**Evidence** (v5_0b §4):
> The Assayer Bloom's evaluation Resonator evaluates each Seed as it appears in the graph. When a violation is detected, a Violation Seed is produced in the Violation Grid.

The Statistical Assessment Resonator is explicitly declared as "not yet instantiated" — its slot exists in the definition for forward compatibility, but M-8.INT must not implement it. This is a documented placeholder, not governance theatre: its absence is intentional and time-bound (R-60).

### 1.3 Operational Behaviour

The Evaluation Resonator performs two distinct write operations per evaluation cycle:

1. **Violation Seeds → Violation Grid** (operational output consumed by the Refinement Helix)
2. **Observation Seeds → Observation Grid** (execution records consumed by the Assayer's own ΦL computation)

These serve structurally different consumers and must not be collapsed into a single Grid. The Violation Grid is an **action trigger** (the Refinement Helix reads from it to decide whether to fire a correction). The Observation Grid is an **audit record** (ΦL assembly reads from it to assess evaluation quality over time).

**Detection signal for degradation** (v5_0b §Anti-Pattern Test 4): If the Violation Grid grows but the Refinement Helix's correction event count stays flat, governance theatre is emerging. The ratio of violations-to-corrections is the structural signature, formalised through the Statistical Assessment Resonator when present.

---

## 2. Relationship Topology

### 2.1 Inbound Lines (Evaluation Scope)

| Source | Relationship Type | Semantic | Count |
|--------|-------------------|----------|-------|
| Each stage Bloom's output Seeds | `FLOWS_TO` | Data consumed for evaluation | 7 (one per stage Bloom) |
| Constitutional Bloom axiom Seeds | `REFERENCES` | Read-only grammar reference | 1 |
| Constitutional Bloom anti-pattern catalogue | `REFERENCES` | Read-only detection rules | 1 |
| `architect_GATE` | `FLOWS_TO` | Process flow from gate stage | 1 (wired in t2) |

**Critical finding from t2:** The `FLOWS_TO` edge from `architect_GATE` is one of the edges that directly addresses the λ₂=0 condition. This edge bridges what was previously a disconnected component boundary.

**Containment invariant 5** (v5_0b §4): "The Assayer Bloom has FLOWS_TO Lines from every stage Bloom's output Seeds. If a stage Bloom produces output that the Assayer cannot reach, that output is outside governance — a structural gap, not a design choice." This invariant is testable via Cypher and must be part of the verification suite.

**REFERENCES vs FLOWS_TO vs INSTANTIATES distinction** (v5_0b §4, NOTE):

| Relationship | Semantic | Used For |
|---|---|---|
| `INSTANTIATES` | "What type am I?" | Constitutional identity — links instance to definition |
| `REFERENCES` | "What do I read?" | Read-only access to constitutional reference content |
| `FLOWS_TO` | "What data do I consume/produce?" | Operational data flow between morphemes |

The Assayer uses all three, for structurally distinct purposes. Conflating them would violate A7 (Semantic Stability).

### 2.2 Outbound Lines

| Target | Relationship Type | Semantic |
|--------|-------------------|----------|
| Violation Seeds (in Violation Grid) | `FLOWS_TO` (Evaluation Resonator → Violation Grid) | Operational output |
| Observation Seeds (in Observation Grid) | `FLOWS_TO` (Evaluation Resonator → Observation Grid) | Execution records |
| Refinement Helix (indirect — Helix reads from Violation Grid) | Read dependency | Correction cycle trigger |

The Assayer does **not** have outbound Lines to stage Bloom Config Seeds. It evaluates outputs, not configuration. This is a deliberate Minimal Authority (A6) constraint.

### 2.3 INSTANTIATES Wiring

**Evidence from t5:** Five concrete gaps exist in the current INSTANTIATES infrastructure:

| Gap | Impact on Assayer Bloom Definition |
|-----|-------------------------------------|
| No standalone wiring function | Cannot wire INSTANTIATES to pre-existing Bloom nodes |
| `createContainedBloom` lacks `definitionId` parameter | Cannot specify *which* Bloom Definition the Assayer instantiates |
| `verifyStamp` ignores INSTANTIATES | Post-creation verification provides no assurance the definitional link exists |
| INSTANTIATES invisible in topology visualization | Wiring cannot be confirmed through adjacency queries |
| No re-wiring path for superseded definitions | Definition lifecycle changes silently orphan instances |

**Recommendation:** The Assayer Bloom Definition's INSTANTIATES edge is not optional metadata — it is the constitutional identity link that makes the Assayer a governed morpheme rather than an ad-hoc node. All five gaps identified in t5 must be resolved before the Assayer Bloom Definition can be considered fully integrated.

---

## 3. Relationship to the λ₂=0 Condition

### 3.1 Causal Chain

The pre-survey's `lambda2=0` means the graph has disconnected components. The mutation advisory confirms: "Stages have no inter-edges." The Assayer Bloom Definition creation (t1) and its `FLOWS_TO` wiring from `architect_GATE` (t2) are designed to partially remediate this condition.

**Evidence from t3:** The Fiedler eigenvalue computation in `computeGlobalLambda2` is mathematically correct — the problem is the input topology, not the arithmetic. The function receives a graph with block-diagonal Laplacian structure because inter-stage `FLOWS_TO` edges are absent.

**Quantitative expectation:** A single `FLOWS_TO` edge from `architect_GATE` to the Assayer Bloom Definition, if it bridges two previously disconnected components, will make λ₂ > 0. However, a single bridge edge produces a small λ₂ — the algebraic connectivity will be positive but fragile. The full remediation requires all seven stage-to-Assayer `FLOWS_TO` edges specified in containment invariant 5 (§2.1 above).

### 3.2 Component Topology After Wiring

| Component | Members (pre-wiring) | Connected post-wiring? |
|-----------|----------------------|------------------------|
| Architect stage subgraph | SURVEY, DECOMPOSE, CLASSIFY, SEQUENCE, GATE, DISPATCH, ADAPT (if inter-stage FLOWS_TO exists) | Depends on existing inter-stage edges |
| Assayer governance subgraph | Assayer Bloom + internal morphemes | **Yes** — via FLOWS_TO from architect_GATE |
| Constitutional reference subgraph | Axiom Seeds, anti-pattern catalogue | Via REFERENCES edges (if included in λ₂ computation) |

**Open question from t3:** Does `computeGlobalLambda2` include `REFERENCES` edges in its edge set? If not, the Constitutional Bloom remains a disconnected component even after FLOWS_TO wiring. The `getSubgraphEdges` function excludes `CONTAINS` but not `REFERENCES` — this needs explicit verification.

---

## 4. Status Filtering Requirements

### 4.1 Definition-Level Status

**Evidence from t4:** The structural survey's INSTANTIATES queries match Bloom Definitions without filtering on `def.status`. This means deprecated, archived, or draft Bloom Definitions appear indistinguishably from active ones.

**Impact on Assayer Bloom Definition:** When the Assayer Bloom Definition is first created, it will presumably carry an `active` (or equivalent) status. However, if the definition is later superseded (e.g., when the Statistical Assessment Resonator is added in R-60, potentially creating a v2 definition), the original definition must transition to `deprecated` status, and the survey must exclude it.

**Recommendation:** The Assayer Bloom Definition must be created with an explicit `status` property from the canonical vocabulary:

| Status | Meaning | Queryable? |
|--------|---------|------------|
| `active` | Current authoritative definition | Yes — included in survey results |
| `draft` | Under construction, not yet authoritative | No — excluded from survey results |
| `deprecated` | Superseded by newer definition | No — excluded from survey results |

### 4.2 Instance-Level Status Normalization

**Evidence from t4:** No normalization layer exists between graph status values and survey output. Architect-context statuses (`approved`, `planned`, `active`) and dev-agent-context statuses (`created`, `in-progress`, `complete`) coexist without canonical mapping.

**Impact:** The Assayer Bloom instance's status must be normalized when it appears in survey results. The definition status and the instance status are independent dimensions — a `deprecated` definition can still have `active` instances (legacy debt), and an `active` definition can have `draft` instances (under construction). Both dimensions require filtering, and neither substitutes for the other.

---

## 5. Structural Invariants for the Assayer Bloom Definition

The following invariants must hold for the Assayer Bloom Definition to be structurally valid. Each is derived from v5_0b §4 containment invariants, adapted for the Assayer-specific topology, and is verifiable via Cypher.

### Invariant A1: Complete Evaluation Scope
```
Every stage Bloom's output Seeds have a FLOWS_TO edge to the Assayer Bloom.
```
**Rationale:** Containment invariant 5. Output outside the Assayer's reach is outside governance.

**Verification query pattern:**
```cypher
MATCH (architect:Bloom {id: $architectId})-[:CONTAINS]->(stage:Bloom)
WHERE stage.name IN ['SURVEY','DECOMPOSE','CLASSIFY','SEQUENCE','GATE','DISPATCH','ADAPT']
OPTIONAL MATCH (stage)-[:FLOWS_TO]->(assayer:Bloom {name: 'Assayer'})
RETURN stage.name, assayer IS NOT NULL AS hasAssayerEdge
```
Expected: all 7 rows return `hasAssayerEdge = true`.

### Invariant A2: Constitutional Reference Integrity
```
The Assayer Bloom has REFERENCES edges to Constitutional Bloom axiom Seeds
and anti-pattern catalogue Seeds, and these are distinct from FLOWS_TO edges.
```
**Rationale:** v5_0b §4 NOTE on REFERENCES vs INSTANTIATES. Mixed relationship semantics would violate A7.

### Invariant A3: Dual-Grid Output
```
The Evaluation Resonator has FLOWS_TO edges to both the Violation Grid
and the Observation Grid within the Assayer Bloom.
```
**Rationale:** Collapsing these into a single Grid conflates operational output with audit records, degrading the Refinement Helix's input signal.

### Invariant A4: INSTANTIATES Identity
```
The Assayer Bloom instance has an INSTANTIATES edge to the Assayer Bloom
Definition Seed, and that Definition Seed has status 'active'.
```
**Rationale:** t5 Gap 3 — without this, `verifyStamp` cannot confirm constitutional identity.

### Invariant A5: No Direct Internal Reach
```
No morpheme outside the Assayer Bloom has a direct FLOWS_TO or REFERENCES
edge to a morpheme inside the Assayer Bloom (Evaluation Resonator, Config
Seeds, internal Grids). All cross-boundary interaction uses Lines at the
Assayer Bloom boundary.
```
**Rationale:** BTM-G3b (v5_0b §4, containment invariant 9). The Refinement Helix reads Violation Seeds through a Line to the Assayer Bloom boundary, not by reaching into the Violation Grid directly.

---

## 6. Interaction with Concurrent Governance Morphemes

The Assayer Bloom does not operate in isolation. Its effectiveness depends on correct wiring to three sibling governance morphemes within the Architect Bloom.

### 6.1 Refinement Helix (Scale 1)

**Dependency direction:** Refinement Helix → reads from → Assayer Violation Grid

**Correction cycle** (v5_0b §6):
1. Assayer Evaluation Resonator detects violation → writes Violation Seed to Violation Grid
2. Refinement Helix reads Violation Seed → fires Return Line to producing stage Bloom boundary
3. Stage re-executes → produces revised output → revised Seed carries `CORRECTS` edge to original
4. Assayer re-evaluates revised output
5. Helix decides: iterate (back to step 1) or pass through with degraded ΦL

**Implication for definition:** The Assayer Bloom Definition must declare the Violation Grid as a structurally accessible output surface — not just an internal record store. The Refinement Helix's Line to the Violation Grid is the governance mechanism's operational backbone.

### 6.2 ΨH Resonator

**Dependency direction:** Indirect. The ΨH Resonator measures friction on FLOWS_TO Lines between stage Blooms. The Assayer's FLOWS_TO inputs (from stage outputs) contribute to the topology that ΨH measures. If the Assayer's inbound Lines carry high friction (stages producing low-quality output that requires repeated evaluation), this registers as elevated ΨH — which may trigger ADAPT.

### 6.3 Escalation Mechanism Resonator

**Dependency direction:** The Escalation Mechanism Resonator monitors for constitutional escalation signatures (Stagnation, Refinement Futility, Coherence Fracture, Phase Lock). The Assayer's Violation Grid and the Refinement Helix's correction history are primary inputs for the **Refinement Futility** signature — when the Helix exhausts its iteration bound without resolving violations.

---

## 7. Risk Assessment

| Risk | Severity | Evidence | Mitigation |
|------|----------|----------|------------|
| Assayer created without INSTANTIATES edge | **High** | t5 Gap 1: no standalone wiring function | Implement `wireInstantiates()` per t5 recommendation |
| FLOWS_TO from architect_GATE targets wrong node | **High** | t2: target node ID must come from t1 output | Enforce t1→t2 dependency; validate IDs before wiring |
| Single bridge edge produces fragile λ₂ | **Medium** | t3: one edge makes λ₂ > 0 but small | Wire all 7 stage-to-Assayer edges per invariant A1 |
| Definition status not set at creation | **Medium** | t4: no status filtering in survey queries | Set `status: 'active'` explicitly on the Definition Seed |
| Violation Grid and Observation Grid collapsed | **Medium** | Observed in systems that simplify "two Grids" to one | Enforce invariant A3 in creation and verification |
| Statistical Assessment Resonator prematurely implemented | **Low** | v5_0b §4: "do not implement as part of M-8.INT" | Definition declares the slot; implementation deferred to R-60 |

---

## 8. Verification Alignment

The acceptance criteria for t8 are:
1. **Documentation explains the Bloom Definition structure** — addressed in §1 (identity, composition, behaviour)
2. **Relationships to other components are clearly described** — addressed in §2 (topology), §3 (λ₂ relationship), §6 (governance interactions)

The specified verification command:
```
npx vitest run tests/spec-gaps/visible-state-graph-persistence.test.ts
```

This test targets **visible state graph persistence** (A2 — Visible State). For the Assayer Bloom Definition, the relevant visible state requirements are:

- The Definition Seed exists in the graph with correct properties (not in-memory only)
- The FLOWS_TO edge from `architect_GATE` persists across sessions
- The INSTANTIATES edge from the Assayer Bloom instance to its Definition persists
- The Violation Grid and Observation Grid are queryable graph entities, not ephemeral structures

Each of these is a persistence assertion — the test should fail if any of these morphemes exist only transiently or are reconstructed from code rather than read from the graph.

---

## 9. Synthesis Across Cycle 8 Tasks

| Task | Contribution to Assayer Bloom Definition | Status Dependency |
|------|------------------------------------------|-------------------|
| t1 | Creates the Definition Seed node | Blocked on missing type context (per t1 analysis) |
| t2 | Wires FLOWS_TO from architect_GATE → Definition | Requires t1 completion |
| t3 | Ensures λ₂ computation includes the new edge in its input set | Independent (computation fix) |
| t4 | Ensures the Definition's status is filtered in survey queries | Independent (query fix) |
| t5 | Ensures INSTANTIATES wiring is verifiable and visible | Independent (infrastructure fix) |
| **t8** | **Documents the above as a coherent pattern** | **Synthesises t1–t5** |

The mutation advisory ("lambda2=0: disconnected components. Stages have no inter-edges") is the unifying concern. The Assayer Bloom Definition, properly created (t1), wired (t2), made computable (t3), filterable (t4), identity-linked (t5), and documented (t8), addresses one disconnection pathway. The advisory's plural "stages" indicates that additional inter-stage edges beyond the GATE→Assayer connection remain unwired — this cycle's scope is partial remediation, not complete resolution.

---

## 10. Conclusion

The Assayer Bloom Definition is a structurally critical governance component — not because it is complex (5 internal morphemes, 9+ inbound Lines, 2 outbound paths), but because it is the **sole compliance evaluation surface** for all stage Bloom outputs within the Architect. Its definition must encode:

1. **What it contains** — Evaluation Resonator, planned Statistical Assessment Resonator slot, Config Seeds, Violation Grid, Observation Grid
2. **What reaches it** — FLOWS_TO from all 7 stage Blooms, REFERENCES from Constitutional Bloom, FLOWS_TO from architect_GATE
3. **What it produces** — Violation Seeds (operational, consumed by Refinement Helix), Observation Seeds (audit, consumed by ΦL assembly)
4. **How it is identified** — INSTANTIATES edge to its Definition Seed with `status: 'active'`
5. **What it does not do** — read stage config, prescribe stage behaviour, aggregate ΦL/ΨH/εR into a single scalar

Without the Assayer Bloom Definition properly instantiated and wired, the Architect pattern has governance morphemes declared in its specification but absent from its graph — the structural definition of Governance Theatre (Anti-Pattern Test 4). The documentation produced by this task serves as the verification reference against which that absence can be detected.