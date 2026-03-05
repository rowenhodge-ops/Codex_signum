# M-9.8 Ecosystem Schema Design

**Milestone:** M-9.8 — Ecosystem Bootstrap
**Date:** 2026-03-05
**Status:** Design document

---

## Morpheme Mapping

Every graph node maps to a Codex morpheme (v4.3 §The Six Morphemes) or an operational record.

### Roadmap Structure → Graph Morphemes

| Roadmap Element | Graph Node | Morpheme | Properties | Rationale |
|----------------|------------|----------|------------|-----------|
| The roadmap itself | `Bloom {type: "roadmap", id: "roadmap-v7"}` | Bloom (○) | version, status | Scoped boundary containing all milestones |
| Major milestone (M-9, M-16, ...) | `Bloom {type: "milestone", id: "M-9"}` | Bloom (○) | sequence, status, phiL | Scoped work with defined boundary |
| Sub-milestone (M-9.1, M-9.5, ...) | `Bloom {type: "sub-milestone", id: "M-9.5"}` | Bloom (○) | sequence, status, phiL, testCount, commitSha | Scoped work within parent |
| Test file | `Bloom {type: "test-suite", id: "test:dev-agent"}` | Bloom (○) | passCount, failCount, skipCount | Scoped collection of test Seeds |
| Individual @future test | `Seed {seedType: "test", id: "test:dev-agent:run-returns-result"}` | Seed (•) | status (pass/fail/skip/future), milestone | Atomic validation unit |
| Hypothesis | `Helix {type: "hypothesis", id: "H-1"}` | Helix (🌀) | claim, paper, status, evidenceStrength | Temporal/evolutionary iteration |

### Relationships

| From | Relationship | To | Morpheme | Grammar Rule |
|------|-------------|-----|----------|-------------|
| roadmap Bloom | CONTAINS | milestone Bloom | Line (→) | G3 Containment |
| milestone Bloom | CONTAINS | sub-milestone Bloom | Line (→) | G3 Containment |
| test-suite Bloom | CONTAINS | test Seed | Line (→) | G3 Containment |
| test Seed | SCOPED_TO | milestone Bloom | Line (→) | G1 Proximity (directional scope) |
| hypothesis Helix | OBSERVES | milestone Bloom | Line (→) | G5 Resonance (evidence accumulation) |

### New Relationship Types (added to RELATIONSHIP_TYPES registry)

| Type | Semantics |
|------|-----------|
| `SCOPED_TO` | Test Seed → Milestone Bloom. Encodes "this test validates requirements for this milestone." |
| `OBSERVES` | Hypothesis Helix → Milestone Bloom. Encodes "this hypothesis accumulates evidence from this milestone's execution." |

### Initial ΦL Values (by milestone status)

| Status Symbol | Status String | phiL |
|---------------|--------------|------|
| ✅ | complete | 0.9 |
| 🔄 | active | 0.5 |
| ⏳ | next | 0.5 |
| 📋 | planned | 0.3 |
| 💡 | vision | 0.1 |

---

## Grammar Rule Validation

- **G1 (Proximity):** All connections are explicit relationships, not implicit containment.
- **G3 (Containment):** Blooms contain their children via CONTAINS. Health propagates upward through containment.
- **G5 (Resonance):** Test Blooms scoped to the same milestone share coherence via SCOPED_TO topology.

---

## Schema Changes

### New indexes (for ecosystem queries)

```cypher
CREATE INDEX bloom_type IF NOT EXISTS FOR (b:Bloom) ON (b.type)
CREATE INDEX bloom_sequence IF NOT EXISTS FOR (b:Bloom) ON (b.sequence)
CREATE INDEX helix_type IF NOT EXISTS FOR (h:Helix) ON (h.type)
CREATE INDEX seed_seed_type IF NOT EXISTS FOR (s:Seed) ON (s.seedType)
```

### Existing constraints (no new constraints needed)

- `bloom_id_unique` — already covers all Bloom nodes including milestones
- `helix_id_unique` — already covers hypothesis Helixes
- `seed_id_unique` — already covers test Seeds

---

## Idempotency

All writes use `MERGE` (not `CREATE`). Running the bootstrap script multiple times produces the same graph state.
