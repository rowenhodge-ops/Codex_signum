# Instantiation Resonator + Mutation Resonator — Design Specification

**Status:** Draft — reviewed, findings incorporated
**Grounded In:** Codex Signum v5.0
**Depends On:** M-16 Constitutional Bloom (must exist first)
**Purpose:** ALL morpheme creation and modification in the graph flows through exactly three Resonators. No exceptions. No backdoors. The structure enforces itself.

---

## Why Three Resonators, Not Three Functions

The M-16 prompt defines `instantiateMorpheme()` and `updateMorpheme()` as TypeScript functions. That's the implementation. But in Codex terms, these are Resonators — they read input, transform, and produce output. They have their own ΦL. They have their own observation Grids. They are morpheme instances in the graph, subject to the same governance as everything else.

If the creation layer is just a TypeScript function, it's invisible to the graph. The graph can't observe its own creation mechanism. It can't measure how well creation is working. It can't learn from creation failures. Making them Resonators means:

- The Assayer can evaluate their output (are the morphemes they create compliant?)
- Their ΦL dims if they create non-compliant morphemes (which shouldn't be possible, but if the definitions change...)
- Scale 2 learning can detect patterns in creation (which morpheme types fail most often? Which callers produce the most refinement cycles?)
- The immune memory can observe creation patterns (is a caller repeatedly trying to create morphemes that fail hygiene?)

The Resonators ARE the creation layer. There is no creation path that bypasses them.

---

## The Instantiation Resonator (Δ)

**Morpheme identity:** Resonator. Shape: many-to-one compression (many input properties → one new morpheme instance). Contained within the Constitutional Bloom.

### Input Lines

```
← Line from: Caller's request Seed
     (carries: morphemeType, properties, parentId)
← Line from: Constitutional Bloom → Morpheme Definition Seed
     (carries: required properties, grammar constraints, interaction rules)
← Line from: Constitutional Bloom → Grammar Rule Seeds
     (carries: G1-G5 for validation — especially G3 containment)
```

### Processing (Single Transaction)

The Instantiation Resonator performs in one atomic transaction:

**1. Morpheme hygiene check.**
Read the definition for the requested morpheme type from the Constitutional Bloom. Verify all required properties are present and non-empty. Required for ALL morpheme types:

| Property | Required For | Enforcement |
|---|---|---|
| id | All | Unique identifier. Reject empty. |
| name | All | Human-readable. Reject empty. |
| content | All | What this morpheme IS. Reject empty string. Every morpheme carries meaning. |
| status | All | Lifecycle state. Default: 'planned'. |
| seedType | Seed only | Sub-classification. Reject empty. |
| type | Bloom, Resonator, Grid | Sub-classification. Reject empty. |
| mode | Helix only | Refinement, Learning, or Evolutionary. |

If any required property is missing or empty: reject. Write a rejection event Seed to the Instantiation Resonator's observation Grid. Return error. No node created. Transaction rolled back.

**2. Grammatical shape check.**
Verify the containment is valid per the morpheme interaction rules (v5.0 §Constitutional Coupling):

| Container | May Contain |
|---|---|
| Bloom | Seeds, Lines, Resonators, Grids, Helixes, other Blooms |
| Grid | Seeds, Lines |
| Helix | Does not contain — it spans |
| Resonator | Does not contain — it transforms |
| Seed | Does not contain — it is atomic |
| Line | Does not contain — it connects |

If the caller requests a Resonator inside a Grid: reject. A Grid contains Seeds and Lines only. If the caller requests a Bloom inside a Helix: reject. A Helix spans, it doesn't contain.

Verify the parent Bloom (or Grid, for Seeds/Lines) exists. If not: reject.

**3. Create the node.**
MERGE the node with the correct Neo4j label (Seed, Bloom, Resonator, Grid, Helix) and all properties. Set createdAt and updatedAt to current timestamp.

**4. Wire CONTAINS.**
MERGE the CONTAINS relationship from parent Bloom to the new node. Parent→child direction (G3).

**5. Wire INSTANTIATES.**
MERGE the INSTANTIATES relationship from the new node to the appropriate morpheme definition Seed in the Constitutional Bloom. This is what makes the node a Codex morpheme instance rather than a bare graph node.

**6. Verify conductivity.**
After creation, verify the CONTAINS Line has valid conductivity: both endpoints (parent Bloom and new child) satisfy morpheme hygiene. This should always pass if steps 1-5 succeeded, but the check catches edge cases (parent Bloom may have been degraded between the start of the transaction and the creation).

**7. Record observation.**
Write an observation Seed to the Instantiation Resonator's own observation Grid: morpheme type created, caller, parent, timestamp, success/failure. This feeds Scale 2 learning about creation patterns.

### Output Lines

```
→ Line to: The newly created morpheme instance
     (carries: nodeId, morphemeType, all properties)
→ Line to: Instantiation Resonator's observation Grid
     (carries: creation event Seed)
```

### The Instantiation Resonator's Own Properties

```
Resonator {
  id: 'resonator:instantiation',
  name: 'Instantiation Resonator',
  content: 'The sole entry point for morpheme creation. Enforces morpheme hygiene, 
            grammatical shape, CONTAINS wiring, and INSTANTIATES wiring atomically.',
  type: 'governance',
  status: 'active'
}
```

Contained within the Constitutional Bloom. INSTANTIATES the Resonator Definition Seed. Has its own observation Grid (contained by the Constitutional Bloom, connected via Lines to this Resonator). Its ΦL reflects: how often creation succeeds vs fails, how often created morphemes subsequently pass Assayer evaluation, how often callers retry after rejection.

---

## The Mutation Resonator (Δ)

**Morpheme identity:** Resonator. Shape: many-to-one compression (existing morpheme + change request → updated morpheme). Contained within the Constitutional Bloom.

### Input Lines

```
← Line from: Caller's update request Seed
     (carries: nodeId, properties to update, optional newParentId)
← Line from: The target morpheme instance
     (carries: current properties, current relationships)
← Line from: Constitutional Bloom → Morpheme Definition Seed
     (carries: required properties — to verify update doesn't strip them)
```

### Processing (Single Transaction)

**1. Existence check.**
Verify the target node exists. If not: reject.

**2. Property preservation check.**
For every required property of this morpheme type, verify the update doesn't set it to null or empty string. If the update includes `content: ''`: reject. The caller can change content but cannot remove it.

**3. Relationship preservation check.**
Verify the update doesn't orphan the node. If `newParentId` is provided:
- Verify the new parent exists
- Verify the new parent is a valid container for this morpheme type (grammatical shape check)
- Add new CONTAINS from new parent
- Remove old CONTAINS only AFTER new CONTAINS is wired (never orphan, even transiently)

Verify INSTANTIATES is preserved. The Mutation Resonator cannot change a node's morpheme type. A Seed cannot become a Bloom. If morpheme type change is needed, the correct path is: create a new morpheme of the correct type, migrate the data, deprecate the old one.

**4. Apply update.**
SET only the declared properties. Preserve all undeclared properties. Update `updatedAt` timestamp.

**5. Propagate.**
If the update changes ΦL-affecting properties (status, content quality), the parent Bloom's ΦL recomputation is triggered through the standard parent-from-children derivation. This is not a separate step — it's a consequence of the CONTAINS Line's structural derivation property.

**6. Record observation.**
Write an observation Seed to the Mutation Resonator's own observation Grid: what was updated, by whom, what changed, timestamp. This is the provenance trail for every mutation in the graph.

### Output Lines

```
→ Line to: The updated morpheme instance
     (carries: updated properties)
→ Line to: Mutation Resonator's observation Grid
     (carries: mutation event Seed)
```

### The Mutation Resonator's Own Properties

```
Resonator {
  id: 'resonator:mutation',
  name: 'Mutation Resonator',
  content: 'The sole entry point for morpheme property updates. Preserves required 
            properties, prevents orphaning, maintains provenance trail.',
  type: 'governance',
  status: 'active'
}
```

Contained within the Constitutional Bloom alongside the Instantiation Resonator. Its own observation Grid (contained by the Constitutional Bloom, connected via Lines) records every mutation. Its ΦL reflects: how often updates succeed vs fail, how often updated morphemes subsequently pass Assayer evaluation.

---

## The Line Creation Resonator (Δ)

Lines are different from other morphemes. They connect two endpoints rather than being contained by a parent. But they still need the same enforcement.

### Input Lines

```
← Line from: Caller's line request Seed
     (carries: sourceId, targetId, lineType, direction, properties)
← Line from: Constitutional Bloom → Line Definition Seed
     (carries: required properties)
← Line from: Constitutional Bloom → Grammar Rule Seeds
     (carries: G2 direction rules, G4 flow rules)
```

### Processing (Single Transaction)

**1. Endpoint existence check.**
Both source and target must exist. If either doesn't: reject.

**2. Morpheme hygiene on both endpoints.**
Both endpoints must satisfy their morpheme contract (all required properties present). If either fails: reject. This IS Line conductivity Layer 1, enforced at creation time.

**3. Grammatical shape check.**
Verify this line type is valid between these morpheme types. A CONTAINS Line from a Grid to a Resonator: reject (Grids contain Seeds and Lines only). A FLOWS_TO Line from a Seed to a Seed with no Resonator between them: valid (data flows between Seeds).

**4. Direction check.**
Verify the direction matches G2:
- CONTAINS: parent→child
- FLOWS_TO: producer→consumer
- INSTANTIATES: instance→definition
- DEPENDS_ON: prerequisite→dependent

**5. Create the Line.**
MERGE the relationship with properties.

**6. Line type validation (in lieu of INSTANTIATES).**
Neo4j relationships cannot have relationships, so Lines cannot carry a real INSTANTIATES relationship. Instead, the Line Creation Resonator validates the Line's type against the grammatically valid types defined in the Constitutional Bloom. The grammatical shape check in step 3 IS the enforcement — a Line whose type is not in the grammar cannot be created. This is structural enforcement, not a simulated relationship stored as metadata.

**7. Evaluate initial conductivity.**
Compute the three-layer conductivity for the new Line:
- Layer 1 (morpheme hygiene): both endpoints complete? (Verified in step 2)
- Layer 2 (grammatical shape): connection type valid? (Verified in step 3)
- Layer 3 (contextual fitness): dimensional profile alignment between endpoints (computed from observation Grids if available, default to 1.0 for new Lines with no history)

Store conductivity as a property on the Line. Cache it until either endpoint changes.

**8. Record observation.**
Write to the Line Creation Resonator's observation Grid.

### The Line Creation Resonator's Own Properties

```
Resonator {
  id: 'resonator:line-creation',
  name: 'Line Creation Resonator',
  content: 'The sole entry point for Line creation. Enforces endpoint hygiene, 
            grammatical shape, direction rules, and computes initial conductivity.',
  type: 'governance',
  status: 'active'
}
```

Contained within the Constitutional Bloom. Its observation Grid (contained by the Constitutional Bloom, connected via Lines) records every Line creation event.

---

## Bootstrap Sequence

These Resonators can't exist before the Constitutional Bloom. But they ARE part of the Constitutional Bloom (governance Resonators contained within it). So:

1. **Phase A (M-16.1):** Bootstrap Constitutional Bloom with raw Cypher. Create the 41 definition Seeds. This is the first permitted raw write.

2. **Phase A.5:** Bootstrap the three governance Resonators with raw Cypher. Create the Instantiation Resonator, Mutation Resonator, and Line Creation Resonator nodes inside the Constitutional Bloom. Wire their INSTANTIATES Lines to the Resonator Definition Seed. Create their three observation Grids — each Grid is contained by the Constitutional Bloom (not by the Resonator — Resonators don't contain per the interaction rules), connected to its Resonator via Lines. This is the second (and last) permitted raw write.

3. **Phase B:** Implement the TypeScript functions that delegate to these Resonators. From this point forward, every graph write is a Resonator invocation.

4. **Phase C onwards:** Everything goes through the Resonators. No exceptions.

The bootstrap is two raw writes. Everything after that is governed.

### Phase A.5 Detail: Governance Resonator Bootstrap

Three Resonators + three observation Grids = 6 nodes, all contained by the Constitutional Bloom:

```
○ Constitutional Bloom
  │
  ├── (41 definition Seeds from Phase A)
  │
  ├── Δ Instantiation Resonator {id: 'resonator:instantiation', ...}
  │     ← INSTANTIATES → Seed {id: 'def:morpheme:resonator'}
  │     → OBSERVES → □ Grid {id: 'grid:instantiation-observations', type: 'observation'}
  │
  ├── Δ Mutation Resonator {id: 'resonator:mutation', ...}
  │     ← INSTANTIATES → Seed {id: 'def:morpheme:resonator'}
  │     → OBSERVES → □ Grid {id: 'grid:mutation-observations', type: 'observation'}
  │
  ├── Δ Line Creation Resonator {id: 'resonator:line-creation', ...}
  │     ← INSTANTIATES → Seed {id: 'def:morpheme:resonator'}
  │     → OBSERVES → □ Grid {id: 'grid:line-creation-observations', type: 'observation'}
  │
  ├── □ Grid {id: 'grid:instantiation-observations'} ← INSTANTIATES → Seed {id: 'def:morpheme:grid'}
  ├── □ Grid {id: 'grid:mutation-observations'} ← INSTANTIATES → Seed {id: 'def:morpheme:grid'}
  └── □ Grid {id: 'grid:line-creation-observations'} ← INSTANTIATES → Seed {id: 'def:morpheme:grid'}
```

All CONTAINS Lines flow from Constitutional Bloom → child (G3). OBSERVES Lines flow from Resonator → Grid (the Resonator writes to its Grid). INSTANTIATES Lines flow from instance → definition.

Total after Phase A + A.5: 1 Bloom + 41 Seeds + 3 Resonators + 3 Grids = **48 morpheme instances**, all contained, all INSTANTIATES'd.

---

## What This Prevents

| Threat | Prevention Mechanism |
|---|---|
| Bare stub nodes (no content) | Instantiation Resonator rejects empty content |
| Orphaned nodes (no parent) | Instantiation Resonator wires CONTAINS atomically |
| Missing INSTANTIATES | Instantiation Resonator wires INSTANTIATES atomically |
| Property stripping | Mutation Resonator rejects updates that remove required properties |
| Morpheme type change | Mutation Resonator preserves INSTANTIATES — can't change type |
| Invalid containment | Grammar shape check (Grid can't contain Resonator, etc.) |
| Invalid Line direction | Line Creation Resonator checks direction per G2 |
| Non-conductive Lines | Line Creation Resonator computes initial conductivity |
| Unobserved creation | Every creation/mutation is an observation Seed — provenance trail |
| Invisible governance | All three Resonators have their own ΦL — dim = governance failing |

---

## Relationship to Immune Memory

When the Remedy Matching Resonator needs to instantiate a compensatory morpheme at a friction site, it calls the Instantiation Resonator. Not raw Cypher. Not a direct MERGE. The Instantiation Resonator. This means:

- The compensatory morpheme is guaranteed to have all required properties
- It is guaranteed to have CONTAINS and INSTANTIATES
- The creation event is observed and feeds Scale 2 learning
- The Instantiation Resonator's ΦL reflects the quality of immune system repairs

The immune system doesn't bypass governance. It uses governance. The creation layer IS the governance.

---

## Relationship to Concurrent Pattern Topology

When a pattern Bloom activates and its Resonators begin producing output Seeds, each output is created through the Instantiation Resonator. The Assayer evaluates the output. But the Instantiation Resonator has already enforced morpheme hygiene and grammatical shape before the Assayer sees it. This is Line conductivity Layers 1 and 2 enforced at write time. The Assayer focuses on Layer 3 (contextual fitness) and anti-pattern detection — the analytical work that requires judgment rather than structural enforcement.

---

## Migration

Existing code that creates nodes (createContainedDataSeed, createContainedBloom, updateBloomStatus, etc.) delegates to the Resonators internally. The function signatures don't change. Callers don't break. But the enforcement is now structural — every path through the code hits the same Resonator, which means every creation event is observed, every mutation is provenance-traced, and every violation is impossible rather than detectable.

This is the seventh monitoring overlay killed. The first six were external systems checking the graph. This one is the creation layer itself — made structural so checking is unnecessary.