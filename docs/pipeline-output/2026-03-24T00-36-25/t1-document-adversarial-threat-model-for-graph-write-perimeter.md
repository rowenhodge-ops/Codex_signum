# Document adversarial threat model for graph write perimeter

> Task ID: t1
> Model: claude-opus-4-6:adaptive:medium
> Duration: 312532ms
> Output chars: 40951
> Timestamp: 2026-03-24T00:56:54.466Z

> **⚠️ Hallucination flags (2):**
> - [content/warning] References eliminated entity "monitoring overlay"
> - [content/warning] Task t1 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Adversarial Threat Model: Graph Write Perimeter

**Document:** codex-signum-threat-model-write-perimeter-v1.md
**Status:** Analysis — Architect Review Required
**Task:** t1 — Document adversarial threat model for graph write perimeter
**References:** cs-v5.0.md (Constitutional Coupling, A6 Minimal Authority), codex-signum-morpheme-identity-map-v2.md, codex-signum-engineering-bridge-v3_0.md

---

## 1. Adversary Capability Model

The threat model distinguishes two adversary classes. The distinction determines which defensive mechanisms remain operative.

### 1.1 Adversary Class A — Neo4j Write Access (Non-Admin)

**Capabilities:**
- Execute `CREATE`, `MERGE`, `SET`, `REMOVE`, `DELETE` on nodes and relationships
- Create nodes with arbitrary labels including all six morpheme labels
- Create relationships of any type including `INSTANTIATES`, `CONTAINS`, `FLOWS_TO`, `SERVES`
- Modify properties on any accessible node (ΦL, ΨH, εR, content, provenance, Merkle signature)
- Read the full graph topology including the Constitutional Bloom's structure

**Cannot:**
- Modify database schema (constraints, indexes, uniqueness constraints)
- Modify Neo4j security roles or user access
- Install, remove, or configure plugins/procedures (including APOC)
- Modify database-layer triggers (if configured)
- Alter Neo4j configuration

**Acquisition path:** Compromised application credentials, leaked connection strings, compromised CI/CD pipeline, insider with database connection, compromised DevAgent session, supply-chain injection into any dependency that holds a Neo4j driver reference.

### 1.2 Adversary Class B — Neo4j Admin Access

**Additional capabilities beyond Class A:**
- Drop or modify property constraints, uniqueness constraints, existence constraints
- Drop or modify indexes
- Modify APOC trigger configuration
- Modify roles and fine-grained access control
- Import/export full database dumps
- Modify Neo4j server configuration

**Acquisition path:** Compromised DBA credentials, infrastructure-level compromise, cloud provider IAM escalation.

**Scope of this document:** The primary threat model addresses Class A. Class B is noted where it nullifies a specific defence. A system that cannot defend against Class A has no meaningful perimeter. Defence against Class B requires operational security controls (HSM-backed credentials, infrastructure audit, access tiering) that are outside the structural enforcement domain.

---

## 2. The Three Enforcement Layers and Their Application-Layer Dependency

The Codex Signum governance model relies on three enforcement layers, each designed to make ungoverned morphemes structurally inert:

| Layer | Mechanism | What It Enforces | Where It Executes |
|---|---|---|---|
| **L1: INSTANTIATES wiring** | Every morpheme instance has an `INSTANTIATES` relationship to its definition Seed in the Constitutional Bloom | Constitutional identity — the node is a governed instance of a defined morpheme type | Application layer (Instantiation Resonator) |
| **L2: CONTAINS placement** | Every morpheme instance is placed within its containing Bloom via a `CONTAINS` relationship | Containment scope (G3) — the node belongs to a governed boundary and is subject to that boundary's authority constraints | Application layer (Instantiation Resonator + pattern composition) |
| **L3: Observation recording** | Every operation on a morpheme produces observation Seeds in the appropriate Grid, linked by temporal Lines | Provenance (A4), Fidelity (A1) — the system's operational history is complete and unforgeable | Application layer (Mutation Resonator, pipeline execution logic) |

**The structural problem:** All three layers execute at the application layer. The Instantiation Resonator, Mutation Resonator, and Line Creation Resonator are described as "sole entry points" (identity-map-v2 §II), but this is an application-layer invariant, not a database-layer constraint. Neo4j does not know that these Resonators exist. It accepts any syntactically valid Cypher regardless of whether it originated from a governed Resonator or a raw terminal session.

**v5.0 §A6 Minimal Authority states:** "A pattern requests only the resources its purpose requires. Containment (G3) enforces this: a Resonator's input Lines define its authority scope. It cannot read what it is not connected to. It cannot write outside its containing Bloom."

This is true at the semantic level. It is false at the database level. A raw Cypher statement is not a pattern. It is not contained within a Bloom. It has no input Lines defining authority scope. G3 containment is a grammar rule enforced by the application. The database has no concept of Bloom boundaries as access controls.

---

## 3. Complete Morpheme Label Bypass Taxonomy

The following enumerates every morpheme label defined in the identity map v2, the domain concepts mapped to each, and the specific bypass potential when that label is used in an ungoverned write.

### 3.1 Seed (•) — Lifecycle/Datum

**Domain concepts mapped:** Task/work item, Decision record, Config parameter, Prompt template, CTQ requirement, Observation Seeds, Axiom Seeds, Grammar reference Seeds, Engagement findings, Sector insights, Diagnostic rubrics, Compensatory morpheme (when data-typed).

**Bypass potential: HIGH — Most numerous node type, broadest attack surface.**

Seeds are the atomic unit. They appear in every governance query, every observation Grid, every ΦL computation. Phantom Seeds injected without governance wiring have the highest probability of being silently consumed by legitimate Resonators that query by label.

| Sub-type | Injection Impact |
|---|---|
| `Seed {type: "task"}` | Enters task routing. Thompson Resonator may select it for model dispatch if it has plausible properties. |
| `Seed {type: "observation"}` | Poisons ΦL computation directly. Fabricated success/failure records skew posterior distributions. |
| `Seed {type: "decision"}` | Corrupts audit trail. Fabricated decision records create false provenance chains. |
| `Seed {type: "config"}` | Alters governance parameters if consumed by a Resonator reading config by label match. |
| `Seed {type: "axiom"}` | If placed in or near the Constitutional Bloom, could alter constitutional compliance checks. |
| `Seed {type: "ctq"}` | Injects false quality requirements. `SERVES` Lines from legitimate tasks to phantom CTQs redirect importance topology. |
| `Seed {type: "prompt_template"}` | Injects adversarial prompt content into stage Blooms if consumed by model Resonators querying templates by containment. |

### 3.2 Bloom (○) — Scope/Boundary

**Domain concepts mapped:** Pipeline/pattern, Pipeline execution, Pipeline stages (SURVEY, DECOMPOSE, CLASSIFY, SEQUENCE, GATE, DISPATCH, ADAPT, SCOPE, EXECUTE, REVIEW, VALIDATE), Assayer, Signal Conditioning Chain, Constitutional Bloom, Immune Memory System, Initium Pattern, Initium stages, Colophon Pattern, Federation Protocol, Milestone.

**Bypass potential: HIGH — Creates false containment hierarchies.**

A phantom Bloom is a shadow governance boundary. Legitimate nodes placed inside it (via `CONTAINS` injection) appear governed to queries that traverse containment. A phantom Bloom containing phantom Seeds creates an entire ungoverned sub-graph that mimics governed structure.

| Sub-type | Injection Impact |
|---|---|
| `Bloom {type: "execution"}` | Creates phantom pipeline runs. Observation history queries that count executions return inflated totals. |
| `Bloom {type: "stage"}` | Creates phantom pipeline stages. If wired into stage flow via `FLOWS_TO`, intercepts or duplicates data flow. |
| `Bloom {type: "pattern"}` | Creates phantom top-level patterns. The ecosystem topology includes ungoverned patterns. |
| `Bloom {type: "assayer"}` | Impersonates the governance evaluation function. Could produce phantom violation/compliance Seeds. |
| Constitutional Bloom clone | A second Bloom with `{type: "constitutional"}` creates ambiguity in INSTANTIATES targets. Governance queries that match constitutional definitions may hit the phantom. |

### 3.3 Resonator (Δ) — Transformation

**Domain concepts mapped:** LLM/AI model, Instantiation Resonator, Mutation Resonator, Line Creation Resonator, ΦL/ΨH/εR Computation, Escalation Mechanism, Ecosystem Stress, Signal Conditioning stages (7×), Compaction, Distillation, Threat Matching, Remedy Matching, Kano Classification, Statistical Assessment.

**Bypass potential: CRITICAL — Can impersonate governance mechanisms.**

Resonators are the active computation elements. A phantom Resonator placed in a legitimate Bloom via `CONTAINS` injection could intercept data flows. Most critically, phantom Resonators can impersonate the three sole-entry-point mechanisms:

| Sub-type | Injection Impact |
|---|---|
| `Resonator {type: "model"}` | Enters Thompson router's candidate pool if queried by label + properties. Adversary-controlled "model" selected for task execution. |
| `Resonator {type: "instantiation"}` | Impersonates the sole entry point for morpheme creation. If legitimate code queries for the Instantiation Resonator by type, it may find the phantom. |
| `Resonator {type: "mutation"}` | Impersonates the sole entry point for property updates. |
| `Resonator {type: "phi_computation"}` | Impersonates ΦL computation. Could produce fabricated health values. |
| `Resonator {type: "escalation"}` | Suppresses or fabricates escalation events. |
| Signal conditioning types | Injects into the conditioning chain, altering signal processing before it reaches governance. |

### 3.4 Grid (□) — Structure/Knowledge

**Domain concepts mapped:** Observation history, Memory Strata (Ephemeral, Observational, Distilled, Institutional), Threat Archive, Remedy Archive, Engagement History, Sector Knowledge, Diagnostic Frameworks.

**Bypass potential: MEDIUM-HIGH — Corrupts learning and memory.**

Phantom Grids are less immediately dangerous than phantom Seeds or Resonators because Grids are passive data stores. However, a phantom Grid wired as a replacement for a legitimate observation Grid redirects all learning. A phantom Threat Archive could suppress immune pattern recognition. A phantom Remedy Archive could prescribe adversarial compensatory morphemes.

| Sub-type | Injection Impact |
|---|---|
| `Grid {type: "observation"}` | Redirects observation recording. Legitimate Resonators writing to this Grid instead of the governed one create a forked observation history. |
| `Grid {type: "stratum_2"}` | Corrupts the observational memory layer. Learning Helixes reading from it consume fabricated data. |
| `Grid {type: "stratum_3"}` | Corrupts distilled knowledge. Institutional decisions based on false lessons. |
| `Grid {type: "threat_archive"}` | Suppresses known threat signatures or injects false ones. |
| `Grid {type: "remedy_archive"}` | Prescribes adversarial remedies — the immune system itself becomes the attack vector. |

### 3.5 Helix (🌀) — Temporality/Iteration

**Domain concepts mapped:** Thompson Sampling Loop, Retry Logic, Calibration Process, Constitutional Amendment, Archive Helix.

**Bypass potential: MEDIUM — Requires sustained presence and temporal execution.**

Helixes govern iteration. A phantom Helix is inert unless the application layer's temporal scheduling mechanism discovers and activates it. The danger is indirect: a phantom Calibration Helix that modifies governance parameters, or a phantom Constitutional Amendment Helix that processes fabricated amendment proposals.

| Sub-type | Injection Impact |
|---|---|
| `Helix {type: "thompson"}` | Could produce fabricated posterior updates if application layer activates it. |
| `Helix {type: "calibration"}` | Modifies governance thresholds — ΦL weights, significance levels, dampening factors. |
| `Helix {type: "amendment"}` | Processes constitutional changes. If activated, could alter foundational rules. |

### 3.6 Line (→) — Connectivity (Relationships)

**Domain concepts mapped:** Data flows (`FLOWS_TO`), governance wiring (`INSTANTIATES`, `CONTAINS`), observation links, `SERVES`, similarity connections, temporal sequencing.

**Bypass potential: CRITICAL — Lines are the governance wiring itself.**

Lines are not merely data connections. `INSTANTIATES` and `CONTAINS` are the structural enforcement mechanisms. Injecting or deleting Lines directly attacks the governance topology. Unlike nodes (which can be phantom), Lines directly modify the relationships that governance queries traverse.

| Relationship Type | Injection Impact | Deletion Impact |
|---|---|---|
| `INSTANTIATES` | Makes phantom nodes appear constitutionally governed | Severs constitutional wiring; governed node becomes phantom |
| `CONTAINS` | Places phantom nodes inside governed Blooms; captures governed nodes into phantom Blooms | Orphans nodes from containment hierarchy; breaks G3 |
| `FLOWS_TO` | Redirects data flow; creates bypass paths around governance Resonators | Breaks pipeline flow; isolates stages |
| `SERVES` | Creates false importance topology; phantom CTQs attract legitimate work | Disconnects tasks from quality requirements |
| `OBSERVES` / temporal Lines | Injects nodes into observation Grids | Removes observation history; creates amnesia |

---

## 4. Attack Vectors in Detail

### 4.1 Vector V1 — Raw CREATE (Phantom Node Injection)

**Cypher:**
```cypher
CREATE (s:Seed {
  content: "adversarial payload",
  seedType: "task",
  status: "active",
  provenance: "fabricated-origin",
  phiL: 0.95
})
```

**Enforcement layers circumvented:**
- **L1 (INSTANTIATES):** No `INSTANTIATES` relationship created. Node has no constitutional identity.
- **L2 (CONTAINS):** No `CONTAINS` relationship. Node exists outside all Bloom boundaries.
- **L3 (Observation):** No observation Seed recorded in any Grid. The creation event is invisible to governance.

**Why it works:** Neo4j processes `CREATE` statements atomically. The database validates label syntax and property types. It does not validate the existence of specific outgoing relationships, required property completeness, or semantic constraints.

**Governance blind spot demonstrated:**

```cypher
// This governance query returns ONLY governed Seeds — it sees a "complete" world
MATCH (s:Seed)-[:INSTANTIATES]->(def)
WHERE def.type = 'seed_definition'
RETURN count(s) as governed_seed_count

// This operational query returns ALL Seeds — including phantoms
MATCH (s:Seed {seedType: "task", status: "active"})
RETURN s
ORDER BY s.phiL DESC
```

The governance query reports 100% compliance because it only counts the governed population. It has no reference to the total population. The operational query returns phantom nodes intermixed with governed nodes. The two queries produce disjoint views of the graph.

### 4.2 Vector V2 — MERGE with Partial Properties

**Cypher (creation path):**
```cypher
MERGE (s:Seed {content: "specific task description"})
ON CREATE SET s.seedType = "task", s.status = "active"
```

**Cypher (modification path — more dangerous):**
```cypher
MERGE (s:Seed {content: "legitimate existing task"})
ON MATCH SET s.phiL = 0.99, s.status = "trusted"
```

**Enforcement layers circumvented:**
- **L1:** MERGE on creation produces a node without `INSTANTIATES`. MERGE on match modifies a governed node without going through the Mutation Resonator.
- **L2:** Creation path: no `CONTAINS`. Match path: node remains in its Bloom but properties are now ungoverned.
- **L3:** No observation Seed recorded for either the creation or the mutation. The property change is invisible to the learning system.

**Why it's worse than CREATE:** MERGE's `ON MATCH` clause allows property mutation of *governed* nodes. The node retains its `INSTANTIATES` and `CONTAINS` wiring — it passes all governance topology checks — but its properties are fabricated. This is a Fidelity (A1) violation that governance queries cannot distinguish from legitimate state.

**Governance blind spot:**
```cypher
// This query finds the node, sees valid wiring, reports it as governed
MATCH (s:Seed)-[:INSTANTIATES]->(def)
WHERE s.content = "legitimate existing task"
RETURN s.phiL, s.status
// Returns: phiL = 0.99, status = "trusted" — fabricated values, but structurally indistinguishable
```

### 4.3 Vector V3 — Label Grafting

**Cypher:**
```cypher
// Take an arbitrary node (perhaps a test node, an orphaned import, anything)
MATCH (n) WHERE elementId(n) = "4:xxx:42"
SET n:Seed:Resonator
SET n.seedType = "observation", n.phiL = 0.85
```

**Enforcement layers circumvented:**
- **L1:** The grafted node has no `INSTANTIATES` to any definition. Or worse: it may already have an `INSTANTIATES` to a different definition, creating a chimeric identity.
- **L2:** If the node was already inside a Bloom via `CONTAINS`, it now appears as a governed morpheme within that scope — but its semantic identity is wrong.
- **L3:** No observation of the label change.

**Why it's subtle:** Neo4j allows multiple labels on a single node. A node can simultaneously be `:Seed:Resonator:Bloom`. Queries matching any single label will find it. This creates chimeras that satisfy multiple governance queries simultaneously, each seeing a different facet of the same corrupted node.

**Governance blind spot:**
```cypher
// Seed governance query finds it
MATCH (s:Seed) WHERE s.seedType = "observation" RETURN s
// Resonator governance query also finds it
MATCH (r:Resonator) RETURN r
// Both queries believe they're seeing legitimate nodes. Neither detects the chimera.
```

### 4.4 Vector V4 — Relationship Spoofing (INSTANTIATES)

**Cypher:**
```cypher
// Create a phantom, then wire it to look governed
CREATE (s:Seed {content: "trojan", seedType: "task", status: "active", phiL: 0.92})
WITH s
MATCH (def:Seed {type: "seed_definition"})
WHERE (def)<-[:CONTAINS]-(:Bloom {type: "constitutional"})
CREATE (s)-[:INSTANTIATES]->(def)
```

**Enforcement layers circumvented:**
- **L1:** Spoofed. The `INSTANTIATES` relationship exists but was not created by the Instantiation Resonator. No Merkle signature computed. No creation provenance.
- **L2:** Still circumvented — no `CONTAINS` placement.
- **L3:** Still circumvented — no observation Seed.

**Why this is the most dangerous single-vector attack:** The phantom node now passes the most fundamental governance check — constitutional identity. Queries traversing `INSTANTIATES` will include it. If the attacker also injects `CONTAINS` (Vector V5 below), the node passes all three topology checks. The only remaining signals are the missing Merkle signature and the missing observation Seed — both of which are property-level checks, not topology-level checks, and both of which can also be fabricated.

**Governance blind spot:**
```cypher
// The standard compliance query now includes the phantom
MATCH (s:Seed)-[:INSTANTIATES]->(def:Seed {type: "seed_definition"})
RETURN s.content, s.phiL
// "trojan" appears alongside legitimate Seeds. Indistinguishable by topology.
```

### 4.5 Vector V5 — Relationship Spoofing (CONTAINS)

**Cypher:**
```cypher
MATCH (phantom:Seed {content: "trojan"})
MATCH (b:Bloom {type: "stage", name: "DECOMPOSE"})
CREATE (b)-[:CONTAINS]->(phantom)
```

**Enforcement layers circumvented:**
- **L2:** Spoofed. The phantom now appears inside the DECOMPOSE stage Bloom.
- ΦL propagation now includes the phantom in the Bloom's health computation.
- The phantom participates in the stage's scope.

**Combined with V4:** A phantom with both spoofed `INSTANTIATES` and spoofed `CONTAINS` passes all topology-based governance queries. It is indistinguishable from a governed node by graph traversal alone.

### 4.6 Vector V6 — Property Mutation (Governed Node Corruption)

**Cypher:**
```cypher
MATCH (s:Seed)-[:INSTANTIATES]->(def)
WHERE s.content = "critical governance config"
SET s.value = "adversarial_value",
    s.merkleSignature = "fabricated_hash",
    s.phiL = 0.99
```

**Enforcement layers circumvented:**
- **L1:** Intact topologically — `INSTANTIATES` still exists. But Fidelity (A1) is violated: the representation no longer matches actual state.
- **L2:** Intact — `CONTAINS` unchanged.
- **L3:** Circumvented — no observation Seed records the mutation. The Mutation Resonator was not invoked. The mutation is invisible to the learning system.

**The Merkle signature problem:** v5.0 §Line Conductivity specifies "Merkle signature valid" as a morpheme hygiene check. But the Merkle signature is a property on the node. If the attacker can SET properties, they can set `merkleSignature` to any value. The application layer must recompute the expected Merkle from the node's other properties to detect tampering — but this is a detection mechanism, not a prevention mechanism. If the attacker knows the Merkle computation algorithm (which they do — v5.0 is a public specification), they can compute a valid Merkle for their fabricated properties.

### 4.7 Vector V7 — Governance Severing (Relationship Deletion)

**Cypher:**
```cypher
MATCH (s:Seed {content: "critical node"})-[r:INSTANTIATES]->()
DELETE r
```

**Enforcement layers circumvented:**
- **L1:** Destroyed. The node loses its constitutional identity.
- Line conductivity should detect this (morpheme hygiene fails → Lines go dark). But conductivity is an application-layer computation. If the application isn't actively re-evaluating conductivity, the severing is silent.

**Variant — selective CONTAINS deletion:**
```cypher
MATCH (b:Bloom {type: "stage"})-[r:CONTAINS]->(s:Seed)
WHERE s.content = "legitimate task"
DELETE r
```

This orphans a governed node from its scope boundary. The node retains `INSTANTIATES` (appears constitutionally valid) but loses containment (invisible to scope-based queries). It falls through every containment-hierarchy governance check.

### 4.8 Vector V8 — Observation Grid Poisoning

**Cypher:**
```cypher
MATCH (g:Grid {type: "observation"})
WHERE (g)<-[:CONTAINS]-(:Bloom {name: "model-gpt4"})
CREATE (obs:Seed {
  type: "observation",
  taskType: "reasoning",
  quality: 1.0,
  success: true,
  latency: 50,
  timestamp: datetime()
})
CREATE (g)-[:CONTAINS]->(obs)
WITH obs
MATCH (lastObs:Seed)<-[:CONTAINS]-(g)
WHERE lastObs <> obs AND lastObs.timestamp IS NOT NULL
WITH obs, lastObs ORDER BY lastObs.timestamp DESC LIMIT 1
CREATE (lastObs)-[:NEXT]->(obs)
```

**Enforcement layers circumvented:**
- **L3:** Inverted. Rather than missing observations, the attacker injects fabricated observations. The learning system is poisoned with false positive data.

**Impact on governance computations:**
- **ΦL:** Inflated by fabricated success observations. A degraded model appears healthy.
- **Thompson posteriors:** Beta distributions shift toward the poisoned model. Routing decisions favour the adversary-promoted option.
- **Learning Helixes:** Consume fabricated data. Convergence on false optima.
- **Immune memory:** Threat signatures computed from false data. Remedy archives prescribe based on fabricated friction profiles.

**Why this is structurally undetectable:** The fabricated observation Seeds are topologically identical to legitimate ones — same label, same properties, same relationship structure, same containment. The only missing element is that no Resonator actually produced the observation. There is no structural trace of the *absence* of a legitimate production process.

### 4.9 Vector V9 — Constitutional Bloom Tampering

**Cypher:**
```cypher
MATCH (def:Seed {type: "seed_definition"})
WHERE (def)<-[:CONTAINS]-(:Bloom {type: "constitutional"})
SET def.requiredProperties = ["content"],
    def.allowedTypes = ["any"]
```

**Enforcement layers circumvented:**
- **All three simultaneously.** If the attacker can modify the definitions that all instances point to, the constitutional identity itself is corrupted. All `INSTANTIATES` wiring now points to compromised definitions. Compliance checks against the compromised definitions pass. The entire governance model operates on a corrupted constitution.

**v5.0 §Semantic Stability (A7) states:** "A proposed change that alters a definition rather than composing from it triggers the constitutional amendment process. The Merkle signature of the Constitutional Bloom changes."

But the constitutional amendment process is an application-layer mechanism. A raw `SET` on a definition Seed bypasses it entirely. The Merkle signature will indeed be stale — but only if something recomputes and checks it. The stale Merkle is a detection signal, not a prevention mechanism.

### 4.10 Vector V10 — Shadow Governance Injection (Combined Attack)

The maximally effective attack combines multiple vectors to create a shadow governance infrastructure:

```cypher
// 1. Create a shadow Constitutional Bloom
CREATE (cb:Bloom {type: "constitutional", name: "shadow-constitution"})

// 2. Create shadow definitions inside it
CREATE (def:Seed {type: "seed_definition", name: "shadow-seed-def"})
CREATE (cb)-[:CONTAINS]->(def)

// 3. Create phantom nodes that INSTANTIATES the shadow definitions
CREATE (s:Seed {content: "shadow task", seedType: "task", status: "active", phiL: 0.95})
CREATE (s)-[:INSTANTIATES]->(def)
CREATE (cb)-[:CONTAINS]->(s)

// 4. Wire shadow nodes into legitimate topology
MATCH (stage:Bloom {type: "stage", name: "DECOMPOSE"})
CREATE (stage)-[:CONTAINS]->(s)
```

**Result:** A complete shadow governance hierarchy that passes topology checks. The shadow Constitutional Bloom has `CONTAINS` relationships to shadow definitions. Shadow nodes have `INSTANTIATES` relationships to those definitions. Shadow nodes are placed in legitimate Blooms via `CONTAINS` injection.

**Governance queries return hybrid results:** governed and ungoverned nodes intermixed, indistinguishable by topology alone. The governance layer is not merely blind — it is actively misinformed.

---

## 5. Governance Query Blind Spot Analysis

This section documents the precise queries that become structurally blind to ungoverned nodes, and the mechanism of blindness.

### 5.1 Inclusion Bias — The Fundamental Blind Spot

Every governance query in the current architecture is **inclusion-based**: it finds nodes WITH governance wiring. No governance query is **exclusion-based**: finding nodes WITHOUT governance wiring.

This is not a design oversight — it is a structural consequence of the query model. An inclusion query traverses existing relationships. An exclusion query requires enumerating all nodes and checking for the *absence* of a relationship. The former is a traversal. The latter is a scan. The spec correctly rejects scans as the "compliance-as-monitoring anti-pattern" (R-63).

But the consequence is that the governed population and the total population are never compared:

```cypher
// Governed population (what governance sees)
MATCH (n)-[:INSTANTIATES]->(:Seed {type: "seed_definition"})
RETURN count(n) as governed
// Returns: 847

// Total population (what actually exists)
MATCH (n:Seed) RETURN count(n) as total
// Returns: 863

// The 16-node gap is invisible to any query that only traverses INSTANTIATES
```

No governance query computes this delta. The governed count looks complete because there is no reference total.

### 5.2 Specific Blind Spots by Governance Function

| Governance Function | Query Pattern | Blind To |
|---|---|---|
| **Constitutional compliance** | `MATCH (n)-[:INSTANTIATES]->(def)` | All nodes without `INSTANTIATES` |
| **Containment verification** | `MATCH (b:Bloom)-[:CONTAINS]->(child)` | All nodes without `CONTAINS` placement; also blind to nodes with CONTAINS to phantom Blooms |
| **ΦL health propagation** | `MATCH (b:Bloom)-[:CONTAINS]->(child) RETURN avg(child.phiL)` | Phantom nodes WITH spoofed `CONTAINS` skew the average. Orphaned nodes without `CONTAINS` are excluded (silent omission). |
| **Thompson routing** | `MATCH (r:Resonator {type: "model"}) RETURN r ORDER BY r.phiL DESC` | Phantom model Resonators with fabricated high ΦL enter the candidate pool |
| **Observation completeness** | `MATCH (g:Grid)-[:CONTAINS]->(obs:Seed {type: "observation"})` | Fabricated observation Seeds are topologically indistinguishable from legitimate ones |
| **Immune threat matching** | `MATCH (g:Grid {type: "threat_archive"})-[:CONTAINS]->(sig)` | Fabricated threat signatures or deleted legitimate signatures |
| **Line conductivity (morpheme hygiene)** | `MATCH (n) WHERE n.phiL IS NOT NULL AND (n)-[:INSTANTIATES]->()` | All properties are settable by adversary. Merkle signature is forgeable if algorithm is known. |
| **Escalation detection** | `MATCH (s:Seed {type: "escalation_event"})` | Fabricated escalation events, or suppression of legitimate ones via property mutation |

### 5.3 The Fidelity Paradox

v5.0 A1 (Fidelity) states: "Representation must match actual state." The governance model enforces fidelity through Line conductivity — endpoints must pass morpheme hygiene for signal to flow.

But morpheme hygiene checks *properties on the node*:
- Required properties present → attacker includes them
- `INSTANTIATES` Line intact → attacker spoofs it
- Merkle signature valid → attacker computes it (algorithm is public)

Every hygiene check reads data that the attacker controls. The checks validate the representation against itself, not against external ground truth. This is a self-referential verification loop: the node claims to be healthy, and the health check reads the node's claim.

The only way to break this loop is to require information that the attacker cannot forge — information that originates from a trusted process and cannot be retroactively fabricated. This is the direction the design solution must take (explored in R-63 design options, not this document).

---

## 6. Morpheme-Specific Bypass Impact Matrix

The following matrix maps each domain concept from the identity map v2 to its bypass severity across the three enforcement layers and its downstream governance impact.

### 6.1 Seeds

| Domain Concept | L1 (INSTANTIATES) Bypass | L2 (CONTAINS) Bypass | L3 (Observation) Bypass | Downstream Impact |
|---|---|---|---|---|
| Task / work item | Phantom task enters routing | Phantom task outside stage scope | No creation record | Thompson selects phantom tasks |
| Decision record | Phantom decision in audit trail | Decision outside execution Bloom | No decision provenance | False audit trail |
| Config parameter | Phantom config alters behaviour | Config outside Constitutional Bloom | No config change record | Governance parameters corrupted |
| Prompt template | Phantom template injected | Template in wrong stage Bloom | No template provenance | Adversarial prompts in pipeline |
| CTQ requirement | Phantom quality requirement | CTQ outside governed scope | No CTQ derivation record | False importance topology |
| Observation Seed | Phantom observation poisons learning | Observation in wrong Grid | **Inverted:** fabricated observation mimics L3 | ΦL, Thompson, Helix all poisoned |
| Axiom Seed | Phantom axiom in constitution | Axiom in Constitutional Bloom (spoofed) | No amendment record | Governance rule corruption |
| Grammar reference Seed | Phantom grammar rule | Grammar in Constitutional Bloom (spoofed) | No amendment record | Composition rule corruption |

### 6.2 Blooms

| Domain Concept | L1 Bypass | L2 Bypass | L3 Bypass | Downstream Impact |
|---|---|---|---|---|
| Pipeline / pattern | Phantom pattern in ecosystem | Pattern outside federation scope | No pattern creation record | Shadow pipeline executes |
| Pipeline execution | Phantom execution run | Execution outside pattern Bloom | No execution record | False execution history |
| Pipeline stage | Phantom stage in pipeline | Stage misplaced in hierarchy | No stage creation record | Flow hijacking |
| Assayer | Phantom governance evaluator | Assayer outside pattern Bloom | No Assayer provenance | False compliance/violation findings |
| Constitutional Bloom | Shadow constitution | N/A (top-level) | No creation record | Shadow governance hierarchy |
| Immune Memory | Phantom immune system | Outside ecosystem Bloom | No creation record | Shadow threat/remedy matching |

### 6.3 Resonators

| Domain Concept | L1 Bypass | L2 Bypass | L3 Bypass | Downstream Impact |
|---|---|---|---|---|
| LLM / AI model | Phantom model in routing pool | Model outside stage Bloom | No model registration record | Thompson routes to phantom model |
| Instantiation Resonator | Phantom sole-entry-point impersonator | Outside Constitutional Bloom | No creation record | All morpheme creation controlled by attacker |
| Mutation Resonator | Same | Same | Same | All property mutations controlled by attacker |
| ΦL Computation | Phantom health calculator | Outside pattern Bloom | No creation record | Fabricated health values |
| Escalation Mechanism | Phantom escalation suppressor | Outside pattern Bloom | No creation record | Escalation suppressed or fabricated |

### 6.4 Grids

| Domain Concept | L1 Bypass | L2 Bypass | L3 Bypass | Downstream Impact |
|---|---|---|---|---|
| Observation Grid | Phantom Grid captures writes | Grid outside containing Bloom | No Grid creation record | Forked observation history |
| Memory Strata (2-4) | Phantom knowledge store | Stratum outside governed scope | No creation record | Corrupted institutional memory |
| Threat Archive | Phantom threat store | Outside Immune Memory Bloom | No creation record | Immune system blinded |
| Remedy Archive | Phantom remedy store | Outside Immune Memory Bloom | No creation record | Adversarial remedies prescribed |

### 6.5 Helixes

| Domain Concept | L1 Bypass | L2 Bypass | L3 Bypass | Downstream Impact |
|---|---|---|---|---|
| Thompson Sampling Loop | Phantom learning governor | Outside pattern Bloom | No creation record | Fabricated posterior updates |
| Calibration Process | Phantom parameter tuner | Outside governance scope | No creation record | Governance parameters corrupted |
| Constitutional Amendment | Phantom amendment process | Outside Constitutional Bloom | No creation record | Ungoverned constitutional changes |

### 6.6 Lines (Relationships)

| Relationship Type | Injection Impact | Deletion Impact | Governance Blind Spot |
|---|---|---|---|
| `INSTANTIATES` | Phantom appears governed | Governed node becomes phantom | Queries traverse spoofed wiring as if legitimate |
| `CONTAINS` | Phantom enters governed scope; governed node captured by phantom scope | Node orphaned from containment hierarchy | Scope-based queries include/exclude incorrectly |
| `FLOWS_TO` | Data flow redirected; bypass paths created | Pipeline flow broken | Flow-based queries follow adversarial paths |
| `SERVES` | False importance topology | Tasks disconnected from quality requirements | Importance queries return adversarial rankings |
| `NEXT` (temporal) | Observation ordering corrupted | Temporal sequence broken | Grid traversal follows adversarial ordering |
| `SIMILAR_TO` | Archive clustering corrupted | Archive retrieval disrupted | Similarity-based matching returns adversarial results |

---

## 7. Attack Composition: Escalation Paths

Individual vectors compose. The adversary's optimal strategy is sequential:

### 7.1 Minimal Viable Attack (Single Vector)

**Goal:** Inject a single phantom that influences operational behaviour.

```
V1 (Raw CREATE: observation Seed) → V5 (CONTAINS into model's observation Grid)
```

Two Cypher statements. The phantom observation Seed enters ΦL computation. The model's health score changes. Thompson routing shifts. Total time: seconds.

### 7.2 Stealthy Persistent Attack (Multi-Vector)

**Goal:** Create an undetectable shadow governance layer.

```
V1 (CREATE shadow Constitutional Bloom)
→ V1 (CREATE shadow definition Seeds)
→ V5 (CONTAINS definitions in shadow Bloom)
→ V1 (CREATE phantom morphemes)
→ V4 (INSTANTIATES phantoms to shadow definitions)
→ V5 (CONTAINS phantoms in legitimate Blooms)
→ V8 (Inject observation Seeds to legitimise phantoms)
```

Seven operations. The shadow hierarchy is topologically indistinguishable from the legitimate one. Governance queries cannot differentiate.

### 7.3 Governance Sabotage (Destructive)

**Goal:** Disable governance without creating phantom nodes.

```
V7 (DELETE all INSTANTIATES from governance Resonators)
→ V6 (SET phiL = 0.0 on Assayer Bloom)
→ V7 (DELETE CONTAINS between Immune Memory Bloom and its Grids)
→ V6 (SET escalation threshold = 1.0 on Escalation Resonator — never triggers)
```

Four operations. The governance infrastructure remains present but structurally crippled. INSTANTIATES-traversing queries return empty sets for governance mechanisms. Health propagation shows the Assayer as dead. Immune memory is disconnected from its archives. Escalation is suppressed.

---

## 8. Root Cause Analysis

The governance model described in v5.0 makes a critical assumption:

> **All writes to the graph flow through the Instantiation Resonator, Mutation Resonator, and Line Creation Resonator.**

This assumption is stated in the identity map v2: "The sole entry point for morpheme creation" (Instantiation Resonator), "The sole entry point for morpheme property updates" (Mutation Resonator), "The sole entry point for Line creation" (Line Creation Resonator).

The word "sole" is an application-layer invariant. It is true when and only when:
1. All code paths that write to Neo4j go through these Resonators
2. No direct database access exists outside the application layer
3. No other application with write access to the same database exists

If any of these conditions fail — and they demonstrably fail when the adversary has direct Neo4j write access — the "sole entry point" guarantee collapses and all three enforcement layers become optional.

**The gap is between semantic authority and database authority.** The grammar defines authority through containment (G3) and minimal authority (A6). The database grants authority through connection credentials and role-based access control. These two authority models are disjoint. The grammar's authority model is invisible to the database. The database's authority model is invisible to the grammar.

This is precisely the structural coupling gap that v5.0 §Constitutional Coupling was designed to prevent: "When state is structural, governance behaviour follows without a separate governance system." The current implementation has a separate governance system (the application layer) that is structurally decoupled from the state store (Neo4j). The governance system can be bypassed because it is not the state.

**The fix must make governance state and database state the same thing.** This is the thesis of v5.0 applied to the database layer — the same argument that eliminates monitoring overlays must eliminate the gap between governed writes and ungoverned writes. The database must structurally distinguish the two, or it cannot enforce the distinction.

---

## 9. Summary of Findings

| Finding | Severity | Reference |
|---|---|---|
| All three enforcement layers (INSTANTIATES, CONTAINS, Observation) are application-layer mechanisms bypassed by direct Cypher | **Critical** | v5.0 §Constitutional Coupling; A6 Minimal Authority |
| Governance queries are inclusion-based, structurally blind to nodes lacking governance wiring | **Critical** | v5.0 §A2 Visible State — ungoverned nodes violate visible state |
| Merkle signatures are node properties writable by the adversary; verification is self-referential | **High** | v5.0 §A4 Provenance; §Line Conductivity (morpheme hygiene) |
| Observation Grid poisoning is topologically indistinguishable from legitimate observation | **High** | v5.0 §A1 Fidelity; §State Dimensions (ΦL computation) |
| "Sole entry point" Resonators are semantic constructs with no database-layer enforcement | **Critical** | identity-map-v2 §II (Instantiation/Mutation/Line Creation Resonators) |
| Multi-label grafting creates chimeric nodes satisfying multiple governance queries simultaneously | **Medium** | v5.0 §A7 Semantic Stability — fixed vocabulary violated |
| Shadow Constitutional Bloom injection creates parallel governance hierarchy | **Critical** | v5.0 §Constitutional Identity |
| Relationship deletion severs governance wiring silently if conductivity is not continuously re-evaluated | **High** | v5.0 §Line Conductivity (cached conductivity between re-evaluations) |
| Combined attack (V4 + V5 + V8) produces phantom nodes indistinguishable from governed nodes by topology alone | **Critical** | All three enforcement layers simultaneously circumvented |
| All morpheme labels defined in identity-map-v2 are injectable; no label has database-layer protection against ungoverned creation | **Critical** | identity-map-v2 §IX (all entries) |

---

*This threat model establishes the adversarial perimeter. The design options for structural enforcement at the database layer (Neo4j native constraints, cryptographic write tokens, append-only provenance chains) are addressed in the companion design document (R-63 design options).*