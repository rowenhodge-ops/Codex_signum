> **Projection document.** This is a human-readable projection of constitutional
> structures in the Codex Signum graph. The graph is the source of truth.
> See: `def:governance:property-evolution`, `def:grammar:g7-molecule-principle`, LLM Bloom topology

# Engineering Bridge v3.0 Part 7 Delta — Memory Topology

## Summary of Changes

M-10 replaces the four-stratum memory model (Ephemeral → Observation → Distillation → Institutional) with structural memory on LLM Bloom nodes.

## Replaced Components

| Bridge v3.0 Part 7 Component | Status | Replacement |
|---|---|---|
| Stratum 1 (Ephemeral) | Retained | `EphemeralStore` in-memory cache unchanged |
| Stratum 2 (Observation Grid) | Replaced | gamma-recursive posteriors on Bloom properties |
| Stratum 3 (Distillation) | Replaced | Dimensional ΦL profiles on Bloom properties |
| Stratum 4 (Institutional) | Retained | Constitutional Bloom definitions unchanged |
| Compaction (exponential decay window) | Replaced | Temporal decay gamma = e^(-lambda * elapsed) applied inline |
| Upward flow (shouldDistill → checkAndDistill) | Replaced | `updateStructuralMemoryAfterExecution()` inline update |
| Downward flow (enrichment) | Retained | `computeDownwardFlow()` logic unchanged |

## New Components

| Component | Location | Bridge Reference |
|---|---|---|
| gamma-recursive posteriors | LLM Bloom properties | Part 7 §Memory Decay (updated) |
| BOCPD drift detection | `bocpdState` on LLM Bloom | Part 8 §Structural Triggers (new) |
| Dimensional ΦL profiles | `phiL_code`, etc. on LLM Bloom | Part 7 §Performance Profiles (updated) |
| Schema gate Config Seed | `config:schema-gate:learning` | Part 7 §Memory Typing (new) |
| Learning Grid ring buffer | Helix/Grid/Seed per LLM Bloom | Part 7 §Qualitative Context (new) |

## Key Parameter Changes

| Parameter | Bridge v3.0 | M-10 Value | Rationale |
|---|---|---|---|
| Compaction window | Exponential decay, configurable | Inline gamma decay, no deletion | A4 provenance preservation |
| Distillation threshold | Count-based (shouldDistill) | Not applicable (posteriors are continuous) | No batch processing needed |
| Half-life | Not specified | ~2.5 days (DEFAULT_HALF_LIFE_MS = 216,000,000) | Balance recency vs stability |
| BOCPD drift threshold | Not specified | 0.7 (hybrid trigger) | Engineering Bridge §Part 8 |
| Partial reset retention | Not specified | 0.3 (30%) | Retain enough signal to avoid cold restart |
