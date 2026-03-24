# Design Option D — APOC trigger-based transaction rejection

> Task ID: t7
> Model: claude-opus-4-6:adaptive:high
> Duration: 258738ms
> Output chars: 45163
> Timestamp: 2026-03-24T01:15:52.893Z

> **⚠️ Hallucination flags (1):**
> - [content/warning] References eliminated entity "monitoring overlay"

---

# Design Option D — APOC Trigger-Based Transaction Rejection

**Document:** R-63 Design Option D Analysis
**Task:** t7
**Status:** Design analysis — Architect review required
**References:** cs-v5.0.md (Constitutional Coupling, A6 Minimal Authority), t1 (Threat Model), t2 (Enforcement Audit), t3 (Capabilities Survey), t4 (Option A), t5 (Option B), t6 (Option C)

---

## 1. Core Concept

An APOC trigger (or Neo4j 5.x transaction event handler) is installed in the database that intercepts every write transaction. When the trigger detects the creation of a morpheme-labeled node (Seed, Bloom, Resonator, Grid, Helix), it evaluates three governance invariants:

1. **INSTANTIATES wiring** — does the new node have a relationship to a valid definition Seed?
2. **CONTAINS placement** — does the new node have a CONTAINS relationship from a valid container?
3. **Governance property completeness** — does the new node carry the required `_gov_*` properties?

If any invariant fails, the trigger forces the transaction to roll back. The raw Cypher attacker's `CREATE` statement is syntactically valid, but the transaction never commits.

**The structural thesis:** By moving governance invariant checking into a database-resident trigger that executes *within* the transaction lifecycle (before commit), the enforcement runs at the database layer rather than the application layer. A compromised application that bypasses the Instantiation Resonator and issues raw Cypher still hits the trigger. The trigger is the governance layer's last structural line of defence.

**The central question this document must answer honestly:** Is a trigger-based enforcement mechanism *structural* in the same sense as a property constraint, or is it an active monitoring process that happens to have the power to reject?

---

## 2. Trigger Mechanism Specification

### 2.1 APOC Trigger Architecture

APOC triggers operate via `apoc.trigger.add()`, which registers a named Cypher statement to be executed in response to transaction events. The trigger Cypher receives transaction metadata — specifically, the sets of created, deleted, and modified nodes and relationships — and can inspect them. If the trigger Cypher calls `apoc.util.validate()` with a truthy condition, the transaction is rolled back with an error.

**Execution model:** APOC triggers execute **within the committing transaction's context**. They are not a post-hoc scan. They are not a separate monitoring process polling the database. They run synchronously as part of the transaction pipeline. This is architecturally distinct from a periodic compliance scan.

**Trigger phases available:**

| Phase | Timing | Use Case |
|---|---|---|
| `before` | Before transaction commit, within the transaction | **Enforcement** — can inspect proposed changes and reject |
| `after` | After transaction commit, in a new transaction | Detection/reaction — changes already committed |
| `afterAsync` | After commit, asynchronous | Notification/logging — no guarantee of timing |

**Only the `before` phase is relevant for enforcement.** The `after` and `afterAsync` phases are monitoring by definition — they observe committed state. The entire analysis below concerns `before`-phase triggers exclusively.

### 2.2 Trigger Cypher — Governance Invariant Checking

The following specifies the trigger logic for each governance invariant. These are **design-level Cypher specifications** showing the structural check, not production-ready code.

**Trigger 1: INSTANTIATES Wiring Enforcement**

```cypher
CALL apoc.trigger.add(
  'gov_enforce_instantiates',
  '
  // Collect all morpheme-labeled nodes created in this transaction
  UNWIND $createdNodes AS node
  WITH node
  WHERE node:Seed OR node:Bloom OR node:Resonator OR node:Grid OR node:Helix

  // Check: does this node have an INSTANTIATES relationship to a definition?
  // The relationship must also have been created in this transaction OR
  // already exist (for MERGE operations on existing nodes)
  OPTIONAL MATCH (node)-[:INSTANTIATES]->(def)

  // Reject if no INSTANTIATES target exists
  WITH node, def
  WHERE def IS NULL
  WITH collect(node.id) AS violators
  WHERE size(violators) > 0
  CALL apoc.util.validate(
    size(violators) > 0,
    "R-63 GOVERNANCE VIOLATION: Nodes created without INSTANTIATES wiring: %s",
    [apoc.text.join(violators, ", ")]
  )
  RETURN null
  ',
  {phase: "before"}
)
```

**Trigger 2: CONTAINS Placement Enforcement**

```cypher
CALL apoc.trigger.add(
  'gov_enforce_contains',
  '
  UNWIND $createdNodes AS node
  WITH node
  WHERE node:Seed OR node:Bloom OR node:Resonator OR node:Grid OR node:Helix

  // Whitelist: Constitutional-level nodes (the root Bloom, definition Seeds)
  // are exempt from CONTAINS — they ARE the containers
  WHERE NOT node.id STARTS WITH "constitutional:"
    AND NOT node.id STARTS WITH "def:"

  // Check: does a CONTAINS relationship point TO this node from a parent?
  OPTIONAL MATCH (parent)-[:CONTAINS]->(node)

  WITH node, parent
  WHERE parent IS NULL
  WITH collect(node.id) AS violators
  WHERE size(violators) > 0
  CALL apoc.util.validate(
    size(violators) > 0,
    "R-63 GOVERNANCE VIOLATION: Nodes created without CONTAINS placement: %s",
    [apoc.text.join(violators, ", ")]
  )
  RETURN null
  ',
  {phase: "before"}
)
```

**Trigger 3: Governance Property Completeness**

```cypher
CALL apoc.trigger.add(
  'gov_enforce_properties',
  '
  UNWIND $createdNodes AS node
  WITH node
  WHERE node:Seed OR node:Bloom OR node:Resonator OR node:Grid OR node:Helix

  // Check for required governance properties
  WITH node,
    node._gov_instantiation_id IS NOT NULL AS has_inst_id,
    node._gov_provenance_epoch IS NOT NULL AS has_epoch,
    node._gov_contains_path IS NOT NULL AS has_path,
    node._gov_schema_version IS NOT NULL AS has_version,
    node._gov_write_token IS NOT NULL AS has_token

  WHERE NOT (has_inst_id AND has_epoch AND has_path AND has_version AND has_token)
  WITH collect(node.id) AS violators
  WHERE size(violators) > 0
  CALL apoc.util.validate(
    size(violators) > 0,
    "R-63 GOVERNANCE VIOLATION: Nodes missing governance properties: %s",
    [apoc.text.join(violators, ", ")]
  )
  RETURN null
  ',
  {phase: "before"}
)
```

**Design note on Trigger 3 overlap with Option A:** If Option A (property existence constraints) is also deployed, Trigger 3 becomes redundant for property presence checking — Neo4j's native constraints would reject the transaction before the trigger runs. The trigger adds value only if it checks *validity* beyond mere *presence* (e.g., verifying `_gov_write_token` format, verifying `_gov_instantiation_id` corresponds to an existing InstantiationRecord node). Pure presence checking is better handled by native constraints (Option A).

### 2.3 Combined Trigger (Single Trigger Alternative)

Multiple triggers incur per-trigger overhead. A consolidated single trigger may be preferable:

```cypher
CALL apoc.trigger.add(
  'gov_enforce_all_invariants',
  '
  UNWIND $createdNodes AS node
  WITH node
  WHERE node:Seed OR node:Bloom OR node:Resonator OR node:Grid OR node:Helix
    AND NOT node.id STARTS WITH "constitutional:"
    AND NOT node.id STARTS WITH "def:"

  // Check INSTANTIATES
  OPTIONAL MATCH (node)-[:INSTANTIATES]->(def)
  WITH node, def

  // Check CONTAINS
  OPTIONAL MATCH (parent)-[:CONTAINS]->(node)
  WITH node, def, parent

  // Evaluate all invariants
  WITH node,
    def IS NULL AS missing_instantiates,
    parent IS NULL AS missing_contains,
    node._gov_instantiation_id IS NULL AS missing_gov_inst,
    node._gov_write_token IS NULL AS missing_gov_token

  WHERE missing_instantiates OR missing_contains OR missing_gov_inst OR missing_gov_token

  WITH collect({
    id: node.id,
    label: labels(node)[0],
    missing_instantiates: missing_instantiates,
    missing_contains: missing_contains,
    missing_gov_inst: missing_gov_inst,
    missing_gov_token: missing_gov_token
  }) AS violations
  WHERE size(violations) > 0

  CALL apoc.util.validate(
    size(violations) > 0,
    "R-63 GOVERNANCE VIOLATION: %d nodes failed invariant check. First: %s",
    [size(violations), apoc.convert.toJson(violations[0])]
  )
  RETURN null
  ',
  {phase: "before"}
)
```

### 2.4 Transaction Metadata Alternative (Neo4j 5.x)

Neo4j 5.x supports transaction metadata via `tx.setMetadata()` in the driver. The trigger could check for a metadata key:

```cypher
// In trigger:
// If the transaction metadata does not contain a 'governed' flag, reject
// Note: $txMetadata is available in APOC trigger context in some versions
```

**Problem:** Transaction metadata is set by the driver/application. A compromised application layer can set arbitrary metadata. This reduces to the same problem as Option A's fake-value attack. Transaction metadata is not cryptographically bound. An attacker with driver access writes:

```javascript
session.executeWrite(tx => {
  tx.setMetadata({ governed: true }); // Lie
  tx.run('CREATE (s:Seed {id: "evil", ...})');
});
```

Transaction metadata is therefore **not suitable as a sole enforcement mechanism**. It is useful only as an optimization hint (skip trigger evaluation for definitely-governed transactions), never as a security boundary.

---

## 3. Analysis: Is This Enforcement or Monitoring?

This is the core philosophical question required by the acceptance criteria. The answer requires precise definitions.

### 3.1 Definitions

**Monitoring:** A process that *observes* system state — either continuously or periodically — and *reports* deviations. The system continues to operate in the deviant state until a separate corrective action is taken. The monitored system and the monitoring process are structurally independent: removing the monitor does not prevent the deviation.

**Enforcement:** A mechanism that *prevents* an invalid state from being realized. The enforcement mechanism is in the causal path of the state transition: the transition cannot complete unless the mechanism permits it. Removing the enforcement mechanism changes what state transitions are possible.

**Structural enforcement:** Enforcement that is embedded in the structure of the system itself, such that bypassing it requires modifying the system's fundamental architecture. A property constraint is structural: it is part of the database engine's transaction commit pipeline. Removing it requires DDL authority.

### 3.2 Where APOC Triggers Fall

| Criterion | Property Constraint | APOC Trigger (before phase) | Periodic Scan |
|---|---|---|---|
| **In the causal path of writes?** | Yes — commit pipeline | Yes — commit pipeline | No — runs independently |
| **Prevents invalid state?** | Yes — transaction rolls back | Yes — transaction rolls back | No — reports after the fact |
| **System operates in deviant state?** | Never — state never realized | Never — state never realized | Yes — until scan detects and corrects |
| **Structurally independent from write path?** | No — embedded in engine | **Partially** — registered as plugin callback | Yes — separate process |
| **Removal requires DDL/admin authority?** | Yes — `DROP CONSTRAINT` | Yes — `apoc.trigger.remove()` or APOC config | N/A |
| **Removal observable to the engine?** | Yes — constraint metadata changes | **No** — engine does not track trigger presence as a health condition | N/A |

**Assessment:** A `before`-phase APOC trigger is **enforcement, not monitoring.** It satisfies the core criterion: invalid state is never realized. The transaction rolls back before commit. No deviant state exists for any duration. This is categorically different from a periodic scan.

However, it is **not structural enforcement in the same sense as a native constraint.** The distinction:

1. **A property constraint is part of the database engine's commit logic.** The constraint metadata is stored in the system catalog. The engine consults this metadata during every write. The constraint cannot be "unloaded" while the database is running — it must be explicitly dropped via DDL.

2. **An APOC trigger is a plugin callback registered in a secondary store (APOC's internal metadata).** The database engine delegates to the APOC plugin, which manages its own trigger registry. The engine's core commit logic does not know about governance invariants — it knows only that "there is an APOC callback registered."

This means the trigger is **mechanistically enforcement** (it prevents invalid commits) but **architecturally a layer above the engine** (it depends on the APOC plugin being loaded, enabled, and configured).

### 3.3 The Monitoring Overlay Question (Criterion b)

Criterion (b) requires "no monitoring overlay." Does a trigger that runs on every transaction constitute a monitoring overlay?

**No, with a qualification.** A monitoring overlay is a separate process that observes system state. The trigger is not a separate process — it is a callback within the transaction's own execution context. It does not poll. It does not scan. It does not maintain its own state about what it has or has not observed. It fires only when a write occurs, as part of that write.

**The qualification:** If the trigger were to *log* violations without rejecting them (an `after`-phase trigger that records "violation detected"), that *would* be monitoring. The enforcement character derives entirely from the `before` phase + `apoc.util.validate()` rejection. The phase and the action are both load-bearing.

**Verdict on criterion (b):** A before-phase trigger that rejects invalid transactions is not a monitoring overlay. It is an active gatekeeper in the write path. It satisfies criterion (b).

### 3.4 The Honest Philosophical Assessment

The question "is a trigger that rejects writes structural enforcement?" has a nuanced answer:

**It is enforcement.** It prevents invalid state. This is not debatable. A transaction that would create an ungoverned node is rolled back. The invalid state never exists.

**It is not *structural* in the strongest sense.** A truly structural enforcement would be one where the database engine itself cannot represent the invalid state — analogous to how a relational database with a foreign key constraint cannot contain an orphaned row. Neo4j does not support mandatory relationship constraints as part of its schema DDL. The trigger is a workaround for this missing capability.

**The honest comparison:**

- **Property existence constraint:** "You cannot create a Seed without a `content` property." — This is structural. The engine itself enforces it.
- **APOC trigger:** "You cannot create a Seed without an INSTANTIATES relationship." — This is enforced by a registered callback. The engine does not understand INSTANTIATES. It delegates to APOC, which checks.

The trigger is **the closest approximation to structural enforcement that Neo4j's architecture permits** for relationship-level invariants. Native constraints cover property presence and uniqueness. No native mechanism covers mandatory relationship existence. The trigger fills that gap.

**Is this good enough?** It depends on the threat model. For Adversary Class A (non-admin write access, per t1 §1.1), yes — the trigger is fully operative and cannot be circumvented. For Adversary Class B (admin access), no — and this is analyzed in §4.

---

## 4. APOC Trigger Admin Bypass Analysis

### 4.1 Bypass Vector: Trigger Removal

```cypher
CALL apoc.trigger.remove('gov_enforce_all_invariants')
```

**Required authority:** APOC procedure execution privilege. In default Neo4j configurations, this requires the `admin` role or a role with `EXECUTE PROCEDURE apoc.trigger.*` granted.

**Detectability:** None at the database engine level. APOC does not emit system events when triggers are added or removed. No constraint metadata changes. No system log entry is generated by default (unless APOC's own logging is configured at DEBUG level, which is non-default).

**Impact:** Immediate and total. Once the trigger is removed, all subsequent writes bypass governance checking. The removal is effective on the next transaction — there is no caching or delayed propagation.

### 4.2 Bypass Vector: Trigger Disabling

```cypher
CALL apoc.trigger.pause('gov_enforce_all_invariants')
```

**Required authority:** Same as removal.

**Detectability:** Same — none at the engine level.

**Impact:** Same as removal but reversible. The trigger still exists in APOC metadata but is not invoked. `apoc.trigger.resume()` re-enables it.

**Subtle attack pattern:** Attacker pauses trigger → injects nodes → resumes trigger. No visible evidence unless trigger state is independently audited.

### 4.3 Bypass Vector: APOC Configuration Change

APOC triggers require `apoc.trigger.enabled=true` in `apoc.conf` (or `neo4j.conf` in some deployments). An admin-level actor can:

1. Modify the configuration file to set `apoc.trigger.enabled=false`
2. Restart the database (or, in some configurations, triggers stop on the next evaluation cycle)

**Required authority:** Server filesystem access or Neo4j configuration management access.

**Impact:** All triggers globally disabled. No per-trigger granularity.

### 4.4 Bypass Vector: APOC Plugin Removal

The APOC library is a JAR file in the `plugins` directory. An admin with filesystem access can:

1. Remove `apoc-*.jar` from the plugins directory
2. Restart Neo4j

**Impact:** All APOC functionality ceases, including triggers. The database operates normally without APOC — it is not a dependency of the core engine.

### 4.5 Bypass Vector: Trigger Query Subversion

If the trigger Cypher uses pattern matching (e.g., `WHERE node:Seed`), an attacker could create nodes with a novel label (e.g., `Seedling`) that is not covered by the trigger's label whitelist, then later relabel the node:

```cypher
// Phase 1: Create node with non-governed label
CREATE (n:Seedling {id: 'evil', content: 'injected', seedType: 'observation', status: 'active'})

// Phase 2: Add Seed label (triggers fire on SET, but APOC $createdNodes may not
// include nodes that are relabeled, only nodes created in this transaction)
MATCH (n:Seedling {id: 'evil'})
SET n:Seed
REMOVE n:Seedling
```

**Analysis:** Whether this bypass works depends on APOC's trigger event model. `$createdNodes` contains nodes created in the current transaction. A `SET n:Seed` in a separate transaction does not count as a node creation — it is a label modification. APOC triggers may expose `$assignedLabels` (some versions) or may not capture this case at all.

**This is a real and serious bypass vector.** The trigger must also intercept label assignment events, not just node creation events. APOC trigger documentation is inconsistent on whether `$assignedLabels` is reliably populated across versions.

**Mitigation:** An additional trigger on label assignment:

```cypher
CALL apoc.trigger.add(
  'gov_enforce_label_assignment',
  '
  UNWIND keys($assignedLabels) AS label
  WITH label
  WHERE label IN ["Seed", "Bloom", "Resonator", "Grid", "Helix"]
  UNWIND $assignedLabels[label] AS node
  // Same invariant checks as the creation trigger
  OPTIONAL MATCH (node)-[:INSTANTIATES]->(def)
  // ... reject if no INSTANTIATES ...
  ',
  {phase: "before"}
)
```

**Residual risk:** `$assignedLabels` behavior varies across APOC versions. Testing against the specific deployed version is required.

### 4.6 Summary: Admin Bypass Matrix

| Bypass Vector | Required Authority | Detectability | Reversibility | Mitigation |
|---|---|---|---|---|
| `apoc.trigger.remove()` | APOC admin | None (engine-level) | Irreversible (trigger gone) | RBAC: restrict `EXECUTE PROCEDURE apoc.trigger.*` to a dedicated governance role |
| `apoc.trigger.pause()` | APOC admin | None (engine-level) | Reversible | Same RBAC restriction + periodic state audit |
| Config file change | Server filesystem | OS-level audit logs | Requires restart | Immutable container deployment, read-only filesystem |
| Plugin removal | Server filesystem | OS-level audit logs | Requires reinstall + restart | Same as above |
| Label reassignment | Non-admin write access | None | N/A | Additional trigger on `$assignedLabels` (if reliable) |
| Trigger query crafting | Non-admin write access | None | N/A | Comprehensive trigger covering all event types |

**Key observation:** Bypass vectors 1–4 require Adversary Class B (admin access). Only vectors 5–6 are available to Adversary Class A. This means:

- **Against Class A:** Triggers are strong enforcement, *if* the trigger Cypher comprehensively covers all event types (creation + label assignment + property modification).
- **Against Class B:** Triggers offer zero structural resistance. An admin can disable the entire mechanism silently.

This exactly parallels the property constraint analysis from Option A: property constraints also require admin authority to drop. The trigger is not weaker than constraints against Class B — both are equally vulnerable. The trigger is weaker than constraints against Class A only if it fails to cover an event type.

---

## 5. Performance Impact Analysis

### 5.1 Trigger Execution Cost Model

Every write transaction that creates, modifies, or deletes nodes will invoke the registered trigger(s). The cost has three components:

**Component 1: Event Collection**

APOC collects the transaction's change sets (`$createdNodes`, `$deletedNodes`, `$assignedLabels`, etc.) and makes them available as parameters. This collection happens regardless of whether the trigger Cypher ultimately matches any nodes.

**Estimated cost:** Sub-millisecond for typical transactions (creating 1–10 nodes). Linear in the number of modified entities within the transaction.

**Component 2: Trigger Cypher Evaluation**

The trigger Cypher executes within the transaction context. The most expensive operations are the `OPTIONAL MATCH` patterns for INSTANTIATES and CONTAINS:

```cypher
OPTIONAL MATCH (node)-[:INSTANTIATES]->(def)
OPTIONAL MATCH (parent)-[:CONTAINS]->(node)
```

Each of these is a single-hop relationship traversal from the newly created node. With Neo4j's native graph storage, single-hop traversals are O(1) relative to graph size — they scan only the relationship chain of the specific node. For a newly created node with 0–2 relationships, this is effectively free.

**Estimated cost:** ~0.1–1ms per node checked, dominated by relationship chain inspection.

**Component 3: Per-Trigger Overhead**

Each registered trigger incurs a fixed invocation overhead (APOC callback dispatch, parameter marshalling). With a single consolidated trigger, this is paid once per transaction. With multiple triggers, it is paid per trigger.

**Estimated overhead:** ~0.5–2ms per trigger invocation (independent of graph size).

### 5.2 Impact on Write Transaction Latency

| Transaction Type | Nodes Created | Without Trigger | With Trigger (estimated) | Overhead |
|---|---|---|---|---|
| Single morpheme instantiation | 1 | ~5–15ms | ~7–18ms | ~2–3ms (~20–40%) |
| Pipeline run with 5 task outputs | 6–8 | ~20–40ms | ~25–48ms | ~5–8ms (~15–25%) |
| Bulk observation recording (20 seeds) | 20 | ~50–100ms | ~60–120ms | ~10–20ms (~15–20%) |
| Schema migration (60+ statements) | 0 (DDL only) | ~200–500ms | ~200–500ms | ~0ms (DDL does not create morpheme nodes) |
| Constitutional Bloom bootstrap | 20–50 | ~100–250ms | ~120–300ms | ~20–50ms (~15–20%) |

**Assessment:** The trigger adds 15–40% latency to write transactions. This is significant but not prohibitive. For comparison:

- Network round-trip to Neo4j (even local): 1–5ms
- Neo4j transaction commit (disk sync): 5–20ms
- LLM API call in a pipeline run: 500–30,000ms

The trigger overhead is dominated by network and LLM latency in all real-world workflows. It is noticeable only in micro-benchmarks of raw database writes.

### 5.3 Read Transaction Impact

**Zero.** Triggers fire only on write transactions. Read queries are completely unaffected.

### 5.4 Optimization Strategies

**Strategy 1: Early label filter.** The trigger's first operation is `WHERE node:Seed OR node:Bloom OR ...`. If the created nodes have no morpheme labels (e.g., `InstantiationRecord`, `ChainGenesis`, infrastructure nodes), the trigger short-circuits immediately.

**Strategy 2: Transaction metadata fast-path (defense-in-depth only).** If the governance layer sets a transaction metadata key (e.g., `{_governed: true, _trigger_bypass_token: <HMAC>}`), the trigger could verify the token and skip detailed checking. This is an optimization, not a security boundary — the full check remains for transactions without valid metadata. The bypass token would need to be HMAC-signed to prevent the fake-metadata attack described in §2.4.

**Strategy 3: Batching within trigger.** The consolidated trigger evaluates all created nodes in a single `UNWIND ... OPTIONAL MATCH` pattern, avoiding per-node trigger invocation. This is already reflected in the design in §2.3.

### 5.5 Worst-Case Scenario

A bulk import of 1,000 morpheme nodes in a single transaction:

- Trigger evaluates 1,000 nodes × (INSTANTIATES check + CONTAINS check) = 2,000 single-hop traversals
- Estimated overhead: 100–500ms
- Without trigger: 500–2,000ms (base write cost)
- Total: 600–2,500ms

This is acceptable for bulk operations. If not, bulk imports should use a governance-layer bulk instantiation function that can provide transaction metadata for fast-path optimization.

---

## 6. Neo4j Edition Requirements

### 6.1 APOC Trigger Availability

| Feature | Community Edition | Enterprise Edition | AuraDB Free | AuraDB Professional |
|---|---|---|---|---|
| APOC Core library | ✅ Available | ✅ Available | ⚠️ Subset only | ✅ Available |
| `apoc.trigger.add()` | ✅ Available (with config) | ✅ Available | ❌ Not available | ⚠️ May be restricted |
| `apoc.trigger.remove()` | ✅ Available | ✅ Available | ❌ N/A | ⚠️ May be restricted |
| `apoc.util.validate()` | ✅ Available | ✅ Available | ⚠️ Unclear | ✅ Available |
| Fine-grained RBAC on procedures | ❌ Not available | ✅ Available | ❌ N/A | ✅ Available |

**Critical finding:** APOC triggers require `apoc.trigger.enabled=true` in configuration. This is **not enabled by default** in most Neo4j installations. It must be explicitly set.

**AuraDB constraint:** Neo4j's managed cloud service (AuraDB) severely restricts APOC trigger functionality. The free tier does not support triggers at all. The professional tier may restrict them. This is a **deployment constraint**: the trigger-based defence is not portable to all Neo4j hosting environments.

### 6.2 RBAC Protection of Trigger Management

Neo4j Enterprise Edition supports fine-grained access control:

```cypher
// Restrict trigger management to a dedicated governance-admin role
DENY EXECUTE PROCEDURE apoc.trigger.* ON DBMS TO application_role
GRANT EXECUTE PROCEDURE apoc.trigger.* ON DBMS TO governance_admin_role
```

This prevents the application-level database user from modifying triggers, even if the application is compromised. Only the `governance_admin_role` can add, remove, pause, or resume triggers.

**Community Edition:** No fine-grained RBAC. Any user with `admin` role can manage triggers. This means the trigger protection against Adversary Class A depends on the application user *not* having admin role. This is a basic operational security requirement, not a structural one.

### 6.3 Transaction Event Handlers (Java Plugin Alternative)

Neo4j 5.x provides a Java SPI for transaction event handlers (`TransactionEventListener`). These are compiled Java classes deployed as plugins (JAR files in the `plugins` directory) that receive callbacks before and after transactions commit.

**Advantages over APOC triggers:**

| Dimension | APOC Trigger | Java Transaction Event Handler |
|---|---|---|
| Language | Cypher (limited control flow) | Java (full language) |
| Deployment | Runtime registration via Cypher | JAR deployment, requires restart |
| Removal | `apoc.trigger.remove()` — runtime, no restart | Delete JAR, requires restart |
| Performance | Cypher interpretation overhead | Compiled Java, potentially faster |
| Cryptographic operations | Limited (APOC hash functions only) | Full Java crypto library (HMAC verification possible) |
| Resistance to admin bypass | Low (runtime removal) | Higher (requires filesystem access + restart) |

**Recommendation:** For production deployments requiring maximum bypass resistance, a Java transaction event handler is preferable to an APOC trigger. The enforcement logic is identical; the deployment and removal characteristics provide marginally stronger resistance against Adversary Class B.

However, the Java plugin approach introduces its own complexity: compilation, testing, version compatibility with Neo4j releases, and deployment toolchain. The APOC trigger is operationally simpler and sufficient against Adversary Class A.

---

## 7. Trigger-as-Enforcement vs Trigger-as-Monitoring: A Taxonomy

The prior task outputs (t4, t5, t6) each proposed mechanisms that are primarily property-level or application-level. Option D is fundamentally different in *where* it operates. This section maps the landscape:

### 7.1 The Enforcement Spectrum

```
MOST STRUCTURAL                                                LEAST STRUCTURAL
      │                                                              │
      ▼                                                              ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐
│ Engine       │  │ Engine       │  │ Plugin       │  │ APOC       │  │ Application  │
│ Constraint   │  │ Transaction  │  │ Transaction  │  │ Trigger    │  │ Layer Guard  │
│ (native DDL) │  │ Event Handler│  │ Event Handler│  │ (Cypher)   │  │ (TypeScript) │
│              │  │ (if native)  │  │ (Java JAR)   │  │            │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘  └──────┬───────┘
       │                 │                 │                 │                │
 Cannot represent       Compiled into      Deployed as       Registered at   Exists only
 invalid state          engine binary      plugin, requires  runtime via     in application
                                           restart to remove Cypher call     process memory
```

**Option D (APOC trigger) sits at position 4.** It is enforcement (not monitoring), but it is the second-least structural option. It is categorically better than application-layer guards (position 5) because it survives application compromise. It is categorically weaker than native constraints (position 1) because it can be removed at runtime without engine awareness.

### 7.2 Why "Runs on Every Transaction" Is Not Monitoring

A common objection: "If it inspects every transaction, it's monitoring."

This conflates two meanings of "monitoring":

1. **Monitoring as observation:** A process that watches and records. It does not intervene. Its removal does not change system behavior.
2. **Monitoring as gatekeeping:** A checkpoint that evaluates and decides. Its removal changes what is permitted.

A firewall inspects every packet. A firewall is not a monitoring system — it is an enforcement system. An IDS (Intrusion Detection System) inspects every packet and *logs* anomalies — that is monitoring. The difference is not the inspection, but the consequence: rejection vs. logging.

**APOC triggers in `before` phase with `apoc.util.validate()` rejection are enforcement, not monitoring.** They are analogous to a firewall, not an IDS. They run on every transaction because enforcement requires evaluation of every transaction. The evaluation is not the monitoring — the monitoring anti-pattern is evaluation *without* rejection.

### 7.3 When a Trigger Becomes Monitoring

A trigger becomes monitoring (and thus violates criterion b) if:

- It runs in `after` phase (observes committed state, cannot reject)
- It logs violations but does not call `apoc.util.validate()` (observation without action)
- It runs asynchronously (`afterAsync`) and flags violations for later review
- It records violations in a separate "governance audit" node structure that is later scanned by a compliance process

All of these are the "compliance-as-monitoring anti-pattern" that R-63 explicitly rejects.

---

## 8. Limitations and Honest Assessment

### 8.1 The APOC Dependency Problem

The entire Option D defence depends on the APOC plugin being:
1. Installed
2. Configured with triggers enabled
3. Loaded at database startup
4. Not removed or disabled at runtime

This is a **four-link dependency chain**, and every link is breakable by Adversary Class B. Compared to native constraints (which have a zero-link dependency chain — they are the engine), this is structurally weaker.

**However:** This is the strongest option available for relationship-level invariants, which Neo4j does not support natively. The question is not "is it perfect?" but "is it better than the status quo?" The status quo is application-layer-only enforcement (t2 audit). Option D is categorically better.

### 8.2 The $createdNodes Completeness Question

APOC trigger documentation does not guarantee that `$createdNodes` captures all node creation scenarios:

- `CREATE (n:Seed ...)` — captured ✅
- `MERGE (n:Seed ...) ON CREATE SET ...` — captured for creation case ✅ (but verification needed per APOC version)
- `CALL apoc.create.node(["Seed"], {...})` — captured? **Unknown**
- `LOAD CSV ... CREATE ...` — captured? **Likely yes, but not explicitly documented**
- Node creation via Java stored procedures — captured? **Depends on whether the procedure uses the same transaction context**

**Risk:** If any node creation path does not populate `$createdNodes`, the trigger is silently bypassed for that path. This must be verified through integration testing against the specific Neo4j + APOC version deployed.

### 8.3 The Atomicity Challenge

The trigger checks INSTANTIATES and CONTAINS relationships. For these to exist, the governance layer must create the node AND the relationships in the **same transaction**. The current `instantiateMorpheme()` function does this (t2 audit confirms atomic triple-wiring in a single `writeTransaction`).

But the trigger enforces this atomicity for *all* writers. A raw Cypher session that creates a node in transaction T1 and adds INSTANTIATES in transaction T2 will be rejected in T1 — the node is created without INSTANTIATES, the trigger fires, the transaction rolls back. The attacker would need to create node + relationships in a single statement or transaction:

```cypher
// This would pass the trigger:
CREATE (s:Seed {id: 'evil', ...})-[:INSTANTIATES]->(def:Seed {id: 'def:morpheme:seed'})
// But this creates a NEW def node, not linking to the existing one.

// This would also pass:
MATCH (def:Seed {id: 'def:morpheme:seed'})
CREATE (s:Seed {id: 'evil', ...})-[:INSTANTIATES]->(def)
// But now the trigger's CONTAINS check also needs to pass...

MATCH (def:Seed {id: 'def:morpheme:seed'}), (parent:Bloom {id: 'some-bloom'})
CREATE (s:Seed {id: 'evil', ...})-[:INSTANTIATES]->(def),
       (parent)-[:CONTAINS]->(s)
```

**Analysis:** With both INSTANTIATES and CONTAINS checks, the attacker must provide valid wiring to pass the trigger. This means the injected node is:
- Linked to a real definition (INSTANTIATES)
- Placed in a real container (CONTAINS)
- Carrying governance properties

At this point, the node is *structurally governed* — it has all the wiring that the governance layer would have provided. The trigger has forced the attacker to produce a governed-looking node, which means the node participates in governance topology (ΦL queries, containment traversals, etc.) rather than being invisible.

**This is actually a desirable property.** The threat in t1 was "structurally blind" — governance cannot see injected nodes. If the trigger forces injected nodes to have full governance wiring, they are no longer invisible. They are visible to every governance query. The remaining attack surface is whether the *content* of the injected node is valid, which is a domain-level concern, not a structural one.

### 8.4 The Residual Fake-Wiring Attack

An attacker who can execute:

```cypher
MATCH (def:Seed {id: 'def:morpheme:seed'}), (parent:Bloom {id: 'legitimate-bloom'})
CREATE (parent)-[:CONTAINS]->(s:Seed {
  id: 'evil-seed',
  content: 'Malicious content',
  seedType: 'observation',
  status: 'active',
  _gov_instantiation_id: 'fake-uuid',
  _gov_provenance_epoch: datetime(),
  _gov_contains_path: 'constitutional-bloom.legitimate-bloom',
  _gov_schema_version: 5,
  _gov_write_token: 'garbage'
})-[:INSTANTIATES]->(def)
```

...passes the trigger. The node has INSTANTIATES, has CONTAINS, has all `_gov_*` properties. But `_gov_instantiation_id` points to nothing real, `_gov_write_token` is invalid, and no `InstantiationRecord` exists.

**This is the same fake-value problem identified in Option A (t4 §5).** The trigger can mitigate it by *also* checking:

```cypher
// In trigger: verify _gov_instantiation_id points to a real InstantiationRecord
OPTIONAL MATCH (ir:InstantiationRecord {id: node._gov_instantiation_id})
WITH node, ir
WHERE ir IS NULL
// ... reject ...
```

This raises the bar: the attacker must first create a plausible `InstantiationRecord`, then create the morpheme referencing it. But `InstantiationRecord` creation is itself triggerable...

**The defense-in-depth conclusion from t4–t6 applies here equally:** No single mechanism fully closes the fake-value gap. The trigger's primary value is enforcing *structural wiring* (relationships and properties), not *semantic validity* (whether the wiring points to real governance events). Semantic validity requires either:
- Cryptographic write tokens (Option B, t5) — raises the bar to key exfiltration
- Hash chain inclusion (Option C, t6) — makes ungoverned nodes structurally orphaned from provenance

Option D is most powerful when combined with Option B: the trigger enforces that the `_write_token` property exists AND is syntactically valid (correct format, correct key version prefix), while the token's cryptographic binding ensures only the governance layer with key access could have produced it.

---

## 9. Comparison with Prior Design Options

| Dimension | Option A (Constraints) | Option B (Crypto Tokens) | Option C (Hash Chains) | **Option D (Triggers)** |
|---|---|---|---|---|
| **Enforcement type** | Property presence | Property value (cryptographic) | Property value (hash linkage) | **Relationship + property presence** |
| **What it prevents** | Missing properties | Invalid token (without key) | Chain exclusion | **Missing wiring (INSTANTIATES, CONTAINS)** |
| **Fake-value resistance** | None (any string satisfies NOT NULL) | High (requires HMAC key) | High (requires chain head knowledge + hash computation) | **Low (any valid node ID satisfies relationship check)** |
| **Relationship enforcement** | ❌ Cannot enforce | ❌ Cannot enforce | ❌ Cannot enforce | **✅ Can enforce** |
| **Admin bypass** | DROP CONSTRAINT | DROP CONSTRAINT | DROP CONSTRAINT | **apoc.trigger.remove()** |
| **Performance** | Negligible | Low (HMAC computation) | Low–Moderate (hash + chain head update) | **Low–Moderate (relationship traversal per node)** |
| **Neo4j edition** | Community + Enterprise | Community + Enterprise | Community + Enterprise | **Requires APOC; RBAC requires Enterprise** |
| **AuraDB support** | ✅ Full | ✅ Full (property constraints) | ✅ Full (property constraints) | **❌ Limited (triggers restricted)** |
| **Criterion (a): structural** | ✅ | ✅ (property-level) | Debatable (detection via chain gap) | **✅ (before-phase rejection)** |
| **Criterion (b): no monitoring** | ✅ | ✅ | ⚠️ (chain verification is a scan) | **✅ (inline rejection, not observation)** |
| **Criterion (c): survives app compromise** | Partially (fake values) | ✅ (if key not in app memory) | ✅ (if chain head secured) | **✅ (trigger is DB-resident)** |

**Key unique contribution of Option D:** It is the **only option that can enforce relationship existence** (INSTANTIATES, CONTAINS). Options A, B, and C all operate at the property level. None of them can express "this node must have an outgoing INSTANTIATES relationship" as a constraint. Option D can, because trigger Cypher can traverse relationships.

**Key weakness unique to Option D:** APOC dependency and runtime removal. Options A, B, and C all use native Neo4j constraints, which are engine-level and require DDL authority to modify. Option D uses a plugin-registered callback, which is a softer enforcement point.

---

## 10. Recommended Deployment Architecture

### 10.1 Option D as Complementary Layer

Option D should not be deployed in isolation. It should be combined with:

- **Option A** (property existence constraints) — enforces governance property presence at the engine level
- **Option B** (cryptographic write tokens) — makes governance properties unforgeable without key material
- **Option D** (triggers) — enforces relationship wiring that Options A and B cannot express

This produces a three-layer defence:

```
Layer 1: Neo4j native constraints (Option A)
  → Enforce: governance properties exist on every morpheme node
  → Strength: engine-level, cannot be bypassed without DDL authority
  → Gap: does not verify property values, does not enforce relationships

Layer 2: APOC trigger (Option D)
  → Enforce: INSTANTIATES and CONTAINS relationships exist
  → Enforce: _gov_instantiation_id points to real InstantiationRecord
  → Strength: covers relationship invariants that constraints cannot
  → Gap: removable by APOC admin

Layer 3: Cryptographic write token (Option B, verified in trigger)
  → Enforce: _write_token is cryptographically valid
  → Strength: fake-value attack requires key exfiltration
  → Gap: key in application memory if app is the signer
```

### 10.2 Trigger Installation as Part of Schema Migration

The trigger should be installed in `migrateSchema()` alongside constraints:

```
migrateSchema() {
  1. Apply uniqueness constraints
  2. Apply property existence constraints (Option A)
  3. Install APOC governance trigger (Option D)
  4. Verify trigger is active
}
```

**Trigger verification** should query `apoc.trigger.list()` and confirm the governance trigger is present and not paused. If the trigger is missing or paused, `migrateSchema()` should fail or emit a critical warning.

### 10.3 Trigger Health Monitoring (Not a Monitoring Overlay)

A lightweight check — not a scan of graph state, but a check that the trigger itself is still installed — can run as part of the application's health check endpoint:

```
GET /health → includes: { triggers: { gov_enforce_all_invariants: "active" } }
```

This is not a "monitoring overlay" — it does not scan the graph for violations. It checks that the enforcement mechanism is still in place. This is analogous to checking that a firewall process is running, not inspecting packets.

---

## 11. Conclusions

### 11.1 Is Option D Structural Enforcement?

**Yes, with caveats.** A before-phase APOC trigger that rejects transactions is enforcement — it prevents invalid state from being realized. It is not monitoring — it does not observe and report; it intervenes and rejects. It satisfies criterion (b) (no monitoring overlay) and criterion (a) (structural enforcement, not detection).

The caveat: it is not structural in the *strongest* sense (engine-level, like a native constraint). It depends on the APOC plugin being installed and configured. It can be removed at runtime by an admin. Against Adversary Class A, it is robust. Against Adversary Class B, it is fragile.

### 11.2 Is Option D Sufficient Alone?

**No.** It enforces relationship presence but not property value validity. The fake-wiring attack (§8.4) means an attacker who creates syntactically correct wiring passes the trigger. Option D must be combined with Option B (cryptographic tokens) to raise the bar from "supply any relationship" to "supply a cryptographically valid token."

### 11.3 Is Option D Necessary?

**Yes.** It is the only mechanism that enforces relationship-level invariants. Options A, B, and C cannot express "this node must have an INSTANTIATES relationship." If relationship wiring is a governance invariant (and the v5.0 spec says it is), then some mechanism must enforce it at the database layer, and Option D is the only candidate in Neo4j's current architecture.

### 11.4 Deployment Recommendation

Deploy Option D as part of a layered defence with Options A and B. Accept that it is the weakest of the three layers (plugin-dependent vs. engine-native) and compensate with:

- Enterprise Edition RBAC restricting trigger management to a dedicated role
- Trigger presence verification in application health checks
- Immutable container deployment preventing APOC plugin file removal
- Integration tests that verify trigger rejection behavior on every deployment

This is the most comprehensive structural defence achievable within Neo4j's current architecture, acknowledging that Neo4j does not natively support mandatory relationship constraints and may never do so.