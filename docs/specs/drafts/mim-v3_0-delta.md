> **Projection document.** This is a human-readable projection of constitutional
> structures in the Codex Signum graph. The graph is the source of truth.
> See: `def:grammar:g7-molecule-principle`, `def:governance:property-evolution`, LLM Bloom topology

# Morpheme Identity Map v3.0 Delta

## New Morpheme Classifications

### LLM Bloom (new in M-10.3)

| Field | Value |
|---|---|
| Morpheme Type | Bloom |
| ID Pattern | `llm:{base-model-id}` |
| Example | `llm:claude-opus-4-6` |
| Parent | Context-dependent (milestone or top-level) |
| Contains | Agent:Resonator arms, Learning Helix, Learning Grid, Config Seeds |
| Accumulated State | `weightedSuccesses`, `weightedFailures`, `bocpdState`, `phiL_*` dimensions |
| Governance Rule | G7 Molecule Principle |

### Learning Helix (new in M-10.3)

| Field | Value |
|---|---|
| Morpheme Type | Helix |
| ID Pattern | `learning-helix:{base-model-id}` |
| Example | `learning-helix:claude-opus-4-6` |
| Parent | LLM Bloom |
| Scale | 2 (cross-execution learning) |
| Contains | Learning Grid |
| FLOWS_TO | Receives from `config:schema-gate:learning` |

### Learning Grid (new in M-10.3)

| Field | Value |
|---|---|
| Morpheme Type | Grid |
| ID Pattern | `learning-grid:{base-model-id}` |
| Example | `learning-grid:claude-opus-4-6` |
| Parent | Learning Helix |
| Contains | Seed entries (failure-signature, calibration-event, capability-observation) |
| Ring Buffer | 50 entries max, FIFO eviction |

### Schema Gate Config Seed (new in M-10.5)

| Field | Value |
|---|---|
| Morpheme Type | Seed |
| Seed Type | config |
| ID | `config:schema-gate:learning` |
| Parent | Constitutional Bloom |
| Purpose | Typed entry requirements for Learning Grids |
| FLOWS_TO | All Learning Helixes |

## Updated Classifications

### Agent:Resonator (updated in M-10.3)

Previously top-level nodes with accumulated Thompson state. Now:

| Field | Change |
|---|---|
| Parent | Now CONTAINED by LLM Bloom (was: uncontained) |
| Accumulated State | Moved to parent LLM Bloom (was: on Resonator directly) |
| Role | Execution arm — configuration variant of parent model |

## New Grammar Rule

### G7: Molecule Principle (proposed)

A composition that accumulates structural self-knowledge requires a Bloom boundary. Self-knowledge: Thompson posteriors, dimensional affinities, failure signatures, drift state. Identity and derived properties are not self-knowledge. See `def:grammar:g7-molecule-principle`.

## New Governance Definition

### Property Evolution Governance

Dimensional properties governed by constitutional dimension set. New dimensions require amendment cycle. gamma-recursive update unifies memory decay with DTS. See `def:governance:property-evolution`.
