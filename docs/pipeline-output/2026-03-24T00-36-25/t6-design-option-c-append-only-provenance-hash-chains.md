# Design Option C — Append-only provenance hash chains

> Task ID: t6
> Model: claude-opus-4-6:adaptive:medium
> Duration: 231877ms
> Output chars: 39183
> Timestamp: 2026-03-24T01:11:16.113Z

> **⚠️ Hallucination flags (1):**
> - [content/warning] References eliminated entity "monitoring overlay"

---

# Design Option C — Append-only Provenance Hash Chains

**Document:** R-63 Design Option C Analysis
**Task:** t6
**Status:** Design analysis — Architect review required
**References:** cs-v5.0.md (Constitutional Coupling, A6 Minimal Authority), t1 (Threat Model), t2 (Enforcement Audit), t3 (Capabilities Survey), t4 (Option A), t5 (Option B)

---

## 1. Core Concept

Every governed node, at creation time, is threaded into an append-only hash chain. Each node carries a `_node_hash` property (the cryptographic digest of its own identity + properties + provenance context) and a `_prev_hash` property (the `_node_hash` of the most recently created governed node in the same chain). Together these form a linked list whose integrity can be verified by traversal: if any node is inserted into the graph *outside* the governed write path, it will not appear in any chain, and the next legitimate governed write's `_prev_hash` will skip over it.

**The structural thesis:** The hash chain does not prevent injection. It creates a **structural invariant** — the complete ordered set of governed nodes — against which the actual graph state can be compared. Any injected node is, by definition, not in the chain. The chain is the canonical record of "writes that went through governance."

**The central question this document must answer honestly:** Is this structural invariant *enforcement* or *detection*? Does the chain prevent an injected node from participating in governance, or does it merely make injected nodes identifiable after the fact?

---

## 2. Hash Chain Structure Specification

### 2.1 Field Definitions

Every governed morpheme node carries three chain-related properties:

| Property | Type | Content | Source |
|---|---|---|---|
| `_node_hash` | String (64 hex chars) | `SHA-256(canonical_input)` — the cryptographic identity of this governed write | Computed by Instantiation Resonator at creation |
| `_prev_hash` | String (64 hex chars) | The `_node_hash` of the previous governed write in the same chain. Genesis node uses `"0000...0000"` (64 zeros). | Read from chain head at creation time |
| `_chain_id` | String | Identifier of the chain this node belongs to. Determines chain topology (see §3). | Determined by governance layer based on topology strategy |

### 2.2 Canonical Input Construction

```
canonical_input = _chain_id || "|" || label || "|" || node_id || "|" || sorted_property_pairs || "|" || _prev_hash
```

| Component | Content | Purpose |
|---|---|---|
| `_chain_id` | Chain identifier | Binds hash to specific chain, prevents cross-chain transplant |
| `label` | Primary Neo4j label (Seed, Bloom, etc.) | Prevents label-swap attacks |
| `node_id` | The `id` property | Binds hash to node identity |
| `sorted_property_pairs` | All non-governance properties sorted by key, formatted as `key=value` joined by `&` | Binds hash to node content at creation time |
| `_prev_hash` | Previous node's hash | Creates the chain linkage — this is what makes it a chain, not just a per-node digest |

**Delimiter and encoding:** Pipe (`|`) separates top-level components. Ampersand (`&`) separates property pairs within the sorted block. Property values are UTF-8 encoded and percent-escaped if they contain `|` or `&`. This prevents concatenation ambiguity (same rationale as Option B §2.1).

**Design note on property inclusion:** Including `sorted_property_pairs` means the hash commits to the node's state at creation time. Post-creation mutations (via `updateMorpheme()`) will cause the stored `_node_hash` to diverge from a recomputed hash of current properties. This is intentional — the chain records *creation provenance*, not current state. Mutation provenance is a separate concern (see §8.2).

### 2.3 Genesis Node

Every chain begins with a genesis entry. This is not a morpheme node — it is a dedicated `ChainGenesis` node:

| Property | Value |
|---|---|
| `_chain_id` | The chain identifier |
| `_node_hash` | `SHA-256(_chain_id + "|GENESIS|" + creation_timestamp)` |
| `_prev_hash` | `"0"` repeated 64 times |
| `_genesis_timestamp` | ISO-8601 creation time |
| `_created_by` | Identifier of the governance process that initialized the chain |

The genesis node is created during schema bootstrapping, not during normal operation. Its `_node_hash` becomes the `_prev_hash` of the first governed morpheme in the chain.

### 2.4 Example Chain Sequence

```
[Genesis]  _node_hash = "a1b2c3..."  _prev_hash = "000000..."
    ↓
[Seed:s1]  _node_hash = "d4e5f6..."  _prev_hash = "a1b2c3..."
    ↓
[Bloom:b1] _node_hash = "g7h8i9..."  _prev_hash = "d4e5f6..."
    ↓
[Seed:s2]  _node_hash = "j0k1l2..."  _prev_hash = "g7h8i9..."
```

If an attacker injects `[Seed:evil]` between `b1` and `s2` via raw Cypher:

```
[Genesis]  _node_hash = "a1b2c3..."  _prev_hash = "000000..."
    ↓
[Seed:s1]  _node_hash = "d4e5f6..."  _prev_hash = "a1b2c3..."
    ↓
[Bloom:b1] _node_hash = "g7h8i9..."  _prev_hash = "d4e5f6..."
    ↓                                  [Seed:evil]  ← no _prev_hash, or fake _prev_hash
[Seed:s2]  _node_hash = "j0k1l2..."  _prev_hash = "g7h8i9..."  ← skips evil, links to b1
```

The chain from `s2` back to genesis is intact and does not include `evil`. The injected node is **structurally orphaned from the provenance chain**.

---

## 3. Chain Topology Analysis

### 3.1 Option T1: Single Global Chain

All governed writes across the entire graph are appended to one chain.

| Dimension | Assessment |
|---|---|
| **Simplicity** | Maximal — one chain head to track, one genesis node, one sequence |
| **Concurrency** | **Fatal bottleneck.** Every governed write must read the current chain head, compute the hash, and write the new head — atomically. With multiple governance processes (pipeline runs, concurrent `instantiateMorpheme()` calls), this serializes all writes through a single contention point. |
| **Verification cost** | O(n) where n = total governed nodes in the entire graph. For a mature graph with thousands of nodes, full chain verification is expensive. |
| **Partition tolerance** | None. Any single chain break (corrupted node, deleted node) breaks verification for all subsequent nodes. |
| **Chain forking** | Single point of attack: corrupt the chain head and all subsequent writes build on the corruption. |

**Verdict:** Rejected. The serialization bottleneck violates the system's operational requirements. The Codex Signum graph involves concurrent pipeline runs, parallel DevAgent sessions, and batch operations. A single chain transforms a write-scalable database into a write-serial system.

### 3.2 Option T2: Per-Label Chains

One chain per morpheme label: `chain:Seed`, `chain:Bloom`, `chain:Resonator`, `chain:Grid`, `chain:Helix`.

| Dimension | Assessment |
|---|---|
| **Simplicity** | Moderate — five chains, five genesis nodes, five chain heads |
| **Concurrency** | Better than T1, but Seeds dominate (observation Seeds, task Seeds, decision Seeds). The Seed chain still serializes the most frequently created node type. |
| **Verification cost** | O(n_label) per chain. Seed chain remains the largest. |
| **Partition tolerance** | A break in the Seed chain does not affect the Bloom chain. Fault isolation by label. |
| **Chain forking** | Five independent attack surfaces, but each is still a single chain. |

**Verdict:** Marginal improvement. The Seed label is the workhorse of the system (observations, tasks, decisions, distillations — see t1 §3.1). Per-label chaining concentrates contention on the busiest label.

### 3.3 Option T3: Per-Container Chains

One chain per containing Bloom or Grid. The `_chain_id` is the `id` of the parent container.

| Dimension | Assessment |
|---|---|
| **Simplicity** | More complex — chain count equals the number of containers. Each container maintains its own chain head. New containers require genesis initialization. |
| **Concurrency** | **Excellent within the Codex Signum model.** Governed writes are always scoped to a parent (the `parentId` parameter in `instantiateMorpheme()`). Different containers are independent — writes to `M-9.7` don't contend with writes to `M-14.3`. Contention only occurs when multiple processes write to the *same* container simultaneously, which is the natural serialization boundary anyway. |
| **Verification cost** | O(n_container) per chain. For a Bloom with 5-20 children, verification is trivial. |
| **Partition tolerance** | Excellent. A break in one container's chain affects only that container. Other containers remain independently verifiable. |
| **Chain forking** | Per-container isolation means an attacker must fork each container's chain independently. Damage is contained. |
| **Alignment with governance model** | **Strong.** Containment (G3) is the primary organizational boundary. Per-container chains make the provenance chain follow the same boundary as the governance scope. A container's chain is its **structural manifest** — the ordered list of everything that was governed-placed within it. |

**Verdict: Recommended.** Per-container chains align with the G3 containment model, provide natural concurrency partitioning, limit blast radius, and keep verification cost proportional to container size.

### 3.4 Per-Container Chain: Chain Head Tracking

Each container node carries an additional property:

| Property | Type | Content |
|---|---|---|
| `_chain_head` | String (64 hex chars) | The `_node_hash` of the most recently appended governed child in this container |

When `instantiateMorpheme()` creates a new child in container X:
1. Read `X._chain_head` (the current tip of X's chain)
2. Use it as `_prev_hash` for the new node
3. Compute `_node_hash` for the new node
4. In the same atomic transaction: create the node, update `X._chain_head` to the new node's `_node_hash`

The atomic transaction (already used in `instantiateMorpheme()` via `writeTransaction()`) ensures that chain head advancement and node creation are indivisible.

### 3.5 Topology Decision: Hierarchical Chains

A further refinement: per-container chains can themselves be chained. When a child Bloom is stamped complete, its final `_chain_head` is included in the parent container's chain as a **chain seal entry**. This creates a Merkle-tree-like structure:

```
[Root Bloom chain]
    ↓
    [Child Bloom A chain seal: _node_hash includes A._chain_head]
    ↓
    [Child Bloom B chain seal: _node_hash includes B._chain_head]
    ↓
    [Seed s3 in root]
```

This is noted as a future extension. The initial design should implement flat per-container chains. Hierarchical sealing adds complexity without changing the core enforcement analysis.

---

## 4. Verification Mechanism

### 4.1 What "Verification" Means for the Chain

Chain verification answers two questions:
1. **Chain integrity:** Does every node in the chain correctly reference its predecessor, and does the hash recompute correctly?
2. **Chain completeness:** Are there nodes in the container that are *not* in the chain?

Question 1 is internal chain consistency. Question 2 is the detection of injected nodes.

### 4.2 Can Verification Be Structural (Not Monitoring)?

**This is the critical analysis point.**

Chain integrity (question 1) can be checked *on-demand* — for instance, during `stampBloomComplete()`, which already performs a comprehensive pre-flight check on the container's contents. Adding chain verification to the stamp protocol makes it a **governance gate**, not a monitoring scan.

Chain completeness (question 2) requires comparing the set of nodes claimed by the chain against the set of nodes actually present with the container's label. This is inherently a **comparison operation** — it reads current state and compares it against expected state. The question is: when does this comparison run?

**Structural verification points (not monitoring):**

| Verification Point | Trigger | What It Checks | Nature |
|---|---|---|---|
| **Stamp-time verification** | `stampBloomComplete()` | Full chain integrity + completeness for the container being stamped | Gate — stamp fails if chain is broken or unchained nodes exist |
| **ΦL computation gate** | Any ΦL derivation query | Only count nodes that appear in the chain toward ΦL | Filter — unchained nodes are structurally excluded from health metrics |
| **Read-path filtering** | Any governance query (conductivity, health, topology) | Queries include `WHERE EXISTS(n._node_hash)` predicate | Filter — unchained nodes are invisible to governance reads |

### 4.3 Read-Path Filtering as Structural Enforcement

The most promising integration: **modify all governance read queries to include a chain-membership predicate.**

If every query that computes ΦL, ΨH, εR, conductivity, or any governance metric includes:

```cypher
WHERE n._node_hash IS NOT NULL AND n._prev_hash IS NOT NULL
```

Then injected nodes (which lack valid chain properties) are **structurally invisible** to the governance layer. They exist in the database but do not participate in any governance computation.

**This is closer to structural enforcement than monitoring** because:
- It does not require a separate scan process
- It does not require a monitoring schedule
- It is enforced at every read, not periodically
- It makes injected nodes inert *by default*, not after detection

**But it has a weakness:** An attacker who sets `_node_hash` and `_prev_hash` to arbitrary non-null strings satisfies the `IS NOT NULL` predicate. The read-path filter alone does not verify that the hash *values* are correct — only that they *exist*.

### 4.4 Strengthened Read-Path Filtering

To address the fake-hash problem, read-path queries could verify chain linkage:

```cypher
MATCH (parent)-[:CONTAINS]->(n)
WHERE n._prev_hash IS NOT NULL
  AND EXISTS {
    MATCH (parent)-[:CONTAINS]->(predecessor)
    WHERE predecessor._node_hash = n._prev_hash
  }
```

This verifies that each node's `_prev_hash` actually references a real predecessor in the same container. An injected node with a fabricated `_prev_hash` would fail this check (unless the attacker guesses or reads a real `_node_hash` from an existing node — see §6 on forking attacks).

**Performance cost:** This adds a sub-query per node in every governance read. For containers with 5-20 children, this is negligible. For containers with hundreds of children, it could be significant. Index on `_node_hash` mitigates this.

**Honest assessment:** This is becoming a **distributed verification overlay embedded in read paths** rather than a clean structural constraint. It is architecturally preferable to a monitoring scan, but it is more complex and fragile than a database-layer constraint (Option A) or a cryptographic token (Option B).

---

## 5. Concurrent Write Handling

### 5.1 The Concurrency Problem

Two governed processes simultaneously attempt to append to the same container's chain:

```
Process P1: Reads chain_head = "abc123"
Process P2: Reads chain_head = "abc123"
P1: Creates node with _prev_hash = "abc123", computes _node_hash = "def456"
P2: Creates node with _prev_hash = "abc123", computes _node_hash = "ghi789"
P1: Sets container._chain_head = "def456"
P2: Sets container._chain_head = "ghi789"  ← overwrites P1's advancement
```

Result: Both nodes reference the same predecessor. The chain has **forked**. Node `def456` is now orphaned — it is in the chain logically (its `_prev_hash` is valid) but no subsequent node references it. The chain head points to `ghi789`, and the next write will use `ghi789` as `_prev_hash`, skipping `def456`.

### 5.2 Resolution Strategies

#### Strategy C1: Optimistic Locking on Chain Head

The `writeTransaction()` in `instantiateMorpheme()` already provides Neo4j transaction isolation. The solution:

1. Within the write transaction, read `container._chain_head`
2. Compute the new node's hash
3. Create the node
4. Set `container._chain_head = new_hash` **with a conditional check:**

```cypher
MATCH (parent {id: $parentId})
WHERE parent._chain_head = $expected_prev_hash
SET parent._chain_head = $new_node_hash
RETURN parent._chain_head
```

If another process has already advanced the chain head between the read and the write, the `WHERE` clause matches zero rows, the `SET` does not execute, and the process must **retry** with the new chain head.

**Tradeoff:** Retry logic adds complexity. Under high concurrency on a single container, retry storms are possible. However, per-container chains (§3.3) distribute contention across containers, making same-container concurrent writes relatively rare in the Codex Signum model. Most containers accumulate children over minutes to hours, not milliseconds.

#### Strategy C2: Neo4j Write Locks (Implicit)

Neo4j's default transaction isolation (READ COMMITTED) acquires write locks on nodes being modified. When two transactions both attempt to `SET parent._chain_head`, Neo4j will serialize them: one acquires the lock, the other waits. The second transaction reads the *updated* chain head after the first commits.

**This means:** If the entire chain-append operation (read head, compute hash, create node, advance head) is within a single `writeTransaction()`, Neo4j's locking on the parent node provides natural serialization.

**Critical detail:** The `_prev_hash` must be read *inside* the write transaction, not before it. If the governance layer reads the chain head, then opens a write transaction, another transaction may have advanced the head in between.

**Current code review:** `instantiateMorpheme()` uses `writeTransaction(async (tx) => { ... })` which opens a single write transaction. If the chain head read is moved inside this callback, Neo4j's write lock on the parent node (acquired when `SET parent._chain_head` is executed) will serialize concurrent appenders.

**Recommended approach:** Strategy C2 — rely on Neo4j's implicit write locking within the existing `writeTransaction` scope. Read chain head, compute hash, create node, advance head — all in one transaction. If the transaction is retried due to a deadlock (Neo4j's default behavior), the retry reads the new chain head.

#### Strategy C3: Explicit Advisory Lock (APOC)

APOC provides `apoc.lock.nodes([node])` to acquire explicit locks. This could be used to lock the parent container before reading its chain head:

```cypher
MATCH (parent {id: $parentId})
CALL apoc.lock.nodes([parent])
// read chain head, compute hash, create node, advance head
```

**Assessment:** Adds APOC dependency for a capability that Neo4j's implicit locking already provides. Not recommended unless testing reveals that implicit locking is insufficient (e.g., if the read and write are separated across sub-queries in a way that Neo4j doesn't automatically serialize).

### 5.3 Concurrency Resolution Decision

**Recommended:** Strategy C2 (implicit write locking) with the chain head read moved inside `writeTransaction()`. Fallback to C1 (optimistic locking with retry) if testing reveals serialization gaps.

**Performance impact:** Per-container serialization means two processes writing to the *same Bloom* will serialize. This is acceptable — it matches the semantic reality that a Bloom's contents should be coherently ordered. Two processes writing to *different Blooms* are fully parallel.

---

## 6. Chain Forking Attack Analysis

### 6.1 Attack Surface

An attacker with Neo4j write access can read the current `_chain_head` from any container (the graph is readable). With this value, they can attempt to construct a node that appears to be part of the chain.

### 6.2 Attack Scenario: Valid-Looking Fork

```
Attacker reads container._chain_head = "g7h8i9..."

Attacker creates:
CREATE (evil:Seed {
  id: 'evil-seed-42',
  content: 'Malicious payload',
  seedType: 'observation',
  status: 'active',
  _chain_id: 'bloom:M-9.7',
  _prev_hash: 'g7h8i9...',          ← real chain head, read from graph
  _node_hash: 'x1y2z3...'           ← fabricated or correctly computed
})
```

**Can the attacker compute a correct `_node_hash`?**

If the hash is `SHA-256(canonical_input)` with no secret key (pure hash chain, no HMAC), then **yes**. The canonical input is constructed from the node's own properties plus the `_prev_hash`, all of which the attacker controls. The attacker can compute a perfectly valid `_node_hash`.

**Can the attacker advance the chain head?**

```cypher
MATCH (parent:Bloom {id: 'M-9.7'})
SET parent._chain_head = 'x1y2z3...'
```

If the attacker has write access: **yes**. The chain head is a node property. There is no constraint preventing its modification.

### 6.3 Fork Consequences

After the attack:
- The container's chain head now points to the attacker's node
- The next legitimate governed write reads the attacker's hash as `_prev_hash`
- The attacker's node is **inside the chain**, not outside it
- The chain integrity check passes because the hashes are valid
- The governance layer is **deceived**

### 6.4 Critical Finding: Hash Chains Without Secret Keys Provide No Forgery Resistance

A pure SHA-256 hash chain is a **tamper-evidence** mechanism, not a **tamper-prevention** mechanism. It detects modifications to existing chain entries (changing a node's properties would break its hash). It does not prevent new entries from being appended by an unauthorized party, because the hash function is public and all inputs are readable.

**This is identical to the fake-value problem identified in Option A (t4 §5.1).** Without a secret, the structural invariant is computable by anyone with read access.

### 6.5 Mitigation: HMAC-Based Chain (Hybrid with Option B)

If the chain uses HMAC instead of plain SHA-256:

```
_node_hash = HMAC-SHA256(secret_key, canonical_input)
```

Then the attacker cannot compute a valid `_node_hash` without the secret key. They can still set `_prev_hash` to a real value and fabricate a `_node_hash`, but the fabricated hash will fail verification because it was not computed with the correct key.

**This makes Option C dependent on Option B's key management infrastructure.** The hash chain adds ordering and linkage semantics; the HMAC provides forgery resistance. Neither alone is sufficient against the Class A adversary (t1 §1.1).

### 6.6 Mitigation: Chain Head Protection

Even with HMAC, the attacker can modify `_chain_head` on the parent node (it's just a property). Protection options:

| Mechanism | Effectiveness | Feasibility |
|---|---|---|
| **Property existence constraint on `_chain_head`** | Prevents deletion but not modification | Available (Neo4j native) |
| **APOC trigger on `_chain_head` modification** | Can validate that the new value corresponds to a node whose `_prev_hash` equals the old value | Requires APOC, is a trigger (§7 evaluates whether this is monitoring) |
| **Chain head stored in a separate protected node** | Moves chain head to a node with additional constraints | Shifts the problem — the protected node's property is still writable |
| **Chain head as HMAC-signed value** | `_chain_head_sig = HMAC(secret, _chain_head)` — must match for governance layer to trust the head | Requires Option B infrastructure; attacker can overwrite both values without the key, but governance layer detects the mismatch on next write |

**Recommended:** Dual-field chain head with HMAC signature:

```
parent._chain_head = "g7h8i9..."
parent._chain_head_sig = HMAC-SHA256(secret_key, "g7h8i9..." + "|" + parent.id)
```

The governance layer reads both fields and verifies the signature before trusting the chain head. If the attacker modifies `_chain_head` without updating the signature (which requires the key), the next governed write detects the tampering and enters recovery (§7).

---

## 7. Recovery When Chain Is Broken

### 7.1 Chain Break Scenarios

| Scenario | Cause | Detection Point |
|---|---|---|
| **Deleted node in chain** | Attacker deletes a governed node via `DELETE` | Next governed write or stamp-time verification finds a gap: some node's `_prev_hash` references a non-existent hash |
| **Modified chain head** | Attacker overwrites `_chain_head` with an arbitrary value | Next governed write reads chain head, attempts to use it as `_prev_hash`, but the value doesn't correspond to any node the governance layer created. HMAC-signed chain head (§6.6) catches this immediately. |
| **Modified node properties** | Attacker modifies a governed node's properties (but not `_node_hash`) | Hash recomputation during stamp-time verification finds mismatch between stored `_node_hash` and recomputed hash of current properties |
| **Modified `_node_hash`** | Attacker directly overwrites `_node_hash` on a governed node | Successor node's `_prev_hash` no longer matches. Chain traversal finds a break. |
| **Injected fork node** | §6.2 scenario — attacker appends to chain and advances head | HMAC verification fails on the injected node (if HMAC is used). Without HMAC, this is undetectable. |

### 7.2 Recovery Protocol

When a chain break is detected at a governed write:

1. **Halt writes to the affected container.** The governed write that detected the break fails with a chain integrity error. No new nodes are appended.

2. **Record a Violation Seed** in the ecosystem violation Grid (reusing the existing `ensureViolationGrid()` infrastructure):
   ```
   Seed {
     seedType: 'violation',
     severity: 'critical',
     type: 'chain_integrity_breach',
     affectedContainer: parent.id,
     detectedAt: datetime(),
     lastKnownGoodHash: <last verified _node_hash>,
     currentChainHead: <the value found on the container>
   }
   ```

3. **Rebuild the chain.** The governance layer traverses all nodes in the container that have valid HMAC-signed `_node_hash` values, orders them by `_gov_provenance_epoch` (from Option A), and re-links the chain. Nodes with invalid or missing hashes are flagged as potentially injected.

4. **Resume writes** with the rebuilt chain head.

**Critical note:** Recovery is inherently a **response to detected compromise**, not prevention. This reinforces the finding in §8 that hash chains are a detection mechanism.

### 7.3 Blast Radius (Per-Container Chains)

Per-container chain topology (§3.3) limits recovery scope:
- Only the affected container's chain is rebuilt
- Other containers' chains are unaffected
- Governance computations for unaffected containers continue normally
- ΦL for the affected container is suspended until recovery completes

This is a significant advantage of per-container topology over single-chain or per-label topology.

---

## 8. Honest Assessment: Detection or Prevention?

### 8.1 The Core Question

Does the hash chain prevent an injected node from affecting governance, or does it detect injected nodes after the fact?

### 8.2 Analysis

| Criterion | Hash Chain Behavior | Classification |
|---|---|---|
| **Can an attacker create a node?** | Yes. The hash chain does not prevent `CREATE` statements. Even with existence constraints on `_node_hash` and `_prev_hash`, the attacker can supply fake values. | **Not prevention** |
| **Can an attacker make the node participate in governance queries?** | Depends on read-path filtering (§4.3). If all queries include `WHERE n._node_hash IS NOT NULL`, an attacker who supplies a fake hash passes the filter. Only HMAC verification at read time would exclude fake-hash nodes. | **Partial — depends on HMAC integration** |
| **Can an attacker forge a valid chain entry?** | Without HMAC: yes (§6.4). With HMAC: no (requires key). | **Prevention only with HMAC** |
| **Can an attacker advance the chain head?** | Yes — it's a writable property. HMAC-signed chain head detects but does not prevent. | **Detection, not prevention** |
| **Does chain breakage halt governance operations?** | If the governed write path checks chain integrity before appending (§7.2, step 1): yes, writes halt until recovery. This is a **circuit breaker**, not prevention. | **Reactive enforcement** — governance stops operating rather than continuing with compromised data |
| **Is there a monitoring process?** | Not if verification is embedded in governed write paths and stamp-time checks. But read-path HMAC verification on every query *is* verification-at-read-time, which is distributed monitoring. | **Borderline** |

### 8.3 Verdict

**The hash chain is fundamentally a detection and integrity-evidence mechanism, not a prevention mechanism.**

It provides:

1. **Tamper evidence** — modifications to existing governed nodes are detectable via hash recomputation
2. **Completeness evidence** — the chain is a manifest of governed writes, against which the actual node set can be compared
3. **Ordering evidence** — the chain records the order of governed writes, enabling audit and forensic analysis
4. **Circuit-breaker potential** — detection can trigger an operational halt, converting detection into delayed enforcement

It does not provide:

1. **Write prevention** — the database still accepts any valid Cypher
2. **Forgery prevention** — without HMAC, chain entries can be forged by anyone with read access
3. **Autonomous enforcement** — the chain does not enforce itself; something must verify it

**Classification against R-63 criteria:**

| R-63 Criterion | Hash Chain (alone) | Hash Chain + HMAC | Hash Chain + HMAC + Read-Path Filtering |
|---|---|---|---|
| (a) Structural enforcement not detection | ❌ Detection | ❌ Detection with forgery resistance | ⚠️ Partial — injected nodes excluded from reads but not prevented from existing |
| (b) No monitoring overlay | ✅ If verification is at write/stamp time only | ✅ Same | ⚠️ Read-path verification is distributed verification |
| (c) Works when application layer is compromised | ❌ Hash is computable without secret | ⚠️ Depends on key isolation | ⚠️ If application is compromised, read-path filters may be stripped |

### 8.4 Comparison with Options A and B

| Aspect | Option A (Constraints) | Option B (HMAC Tokens) | Option C (Hash Chains) |
|---|---|---|---|
| **Prevention mechanism** | Constraint failure prevents commit | None (existence constraint + fake value) | None (existence constraint + fake value) |
| **Forgery resistance** | None — fake values pass constraints | High — requires key to compute valid token | None without HMAC; high with HMAC |
| **Ordering/provenance** | None — each node is independently constrained | None — each token is independent | **Strong — chain creates ordered manifest** |
| **Tamper evidence** | None — properties can be silently modified | Per-node — token invalidated if properties change | **Chained — any modification breaks the chain forward** |
| **Application compromise resistance** | High (DB-layer only) | Moderate (key exfiltration = bypass) | Low without HMAC; moderate with HMAC |
| **Complexity** | Low | Moderate | **High** |

### 8.5 Where Hash Chains Add Unique Value

The hash chain provides something that neither Option A nor Option B provides: **ordered provenance with cascading tamper evidence**. If an attacker modifies node N in the middle of a chain, every subsequent node's `_prev_hash` references the *original* hash of N, which no longer matches. The break cascades forward, making selective tampering of individual nodes within the chain detectable even if the attacker can forge HMAC tokens for individual nodes (e.g., because they have temporary key access that is later revoked).

This is the blockchain-like property: the chain is stronger than the sum of its individual entries. It creates a **temporal integrity bond** across the entire sequence of governed writes.

However, this value is primarily **forensic and audit-oriented** — it helps answer "what was the original governed state?" after a suspected compromise. It does not prevent the compromise.

---

## 9. Integration Path with Existing Instantiation Protocol

### 9.1 Modifications to `instantiateMorpheme()`

Within the existing `writeTransaction()` callback in `instantiateMorpheme()`:

**New steps inserted between Step 2 (grammatical shape check) and Step 3 (atomic creation):**

1. **Read chain head** — inside the write transaction:
   ```
   Read parent._chain_head and parent._chain_head_sig
   Verify HMAC signature of chain head (requires secret key access)
   If signature invalid → chain integrity error → halt + violation recording
   ```

2. **Compute new node hash:**
   ```
   canonical_input = chain_id + "|" + label + "|" + node_id + "|" + sorted_props + "|" + prev_hash
   _node_hash = HMAC-SHA256(secret_key, canonical_input)
   _prev_hash = parent._chain_head (verified)
   _chain_id = parent.id
   ```

3. **Include chain properties in node creation MERGE:**
   ```
   Add _node_hash, _prev_hash, _chain_id to the property SET clause
   ```

4. **Advance chain head:**
   ```
   SET parent._chain_head = new_node_hash
   SET parent._chain_head_sig = HMAC-SHA256(secret_key, new_node_hash + "|" + parent.id)
   ```

All four operations occur within the existing `writeTransaction()` scope, maintaining atomicity.

### 9.2 Modifications to `stampBloomComplete()`

Add a chain verification step before the existing Step 3 (exit criteria check):

```
New Step 2.5: Chain integrity verification
  - Traverse all nodes in the container via _prev_hash links
  - Verify each node's _node_hash recomputes correctly (requires HMAC key)
  - Compare chain-walked node set against CONTAINS-walked node set
  - Any discrepancy → stamp rejection with chain integrity error
```

This makes stamp-time verification a structural gate: you cannot stamp a Bloom complete if its chain is broken or if ungoverned nodes have been injected into its container.

### 9.3 Modifications to `updateMorpheme()`

Mutation does **not** create a new chain entry (the chain records creation provenance). However, mutations should record a **mutation hash**:

```
_mutation_hash = HMAC-SHA256(secret_key, node_id + "|" + update_epoch + "|" + sorted_updates + "|" + _node_hash)
```

This creates a secondary provenance trail for mutations, linked to the original creation chain entry. The `_mutation_hash` property is overwritten on each update (or accumulated in a list property if full mutation history is needed).

### 9.4 Schema Changes Required

```cypher
-- Chain property existence constraints (per morpheme label)
CREATE CONSTRAINT seed_chain_id_required IF NOT EXISTS
  FOR (s:Seed) REQUIRE s._chain_id IS NOT NULL
CREATE CONSTRAINT seed_node_hash_required IF NOT EXISTS
  FOR (s:Seed) REQUIRE s._node_hash IS NOT NULL
CREATE CONSTRAINT seed_prev_hash_required IF NOT EXISTS
  FOR (s:Seed) REQUIRE s._prev_hash IS NOT NULL

-- (Repeat for Bloom, Resonator, Grid, Helix)

-- Chain head properties on container nodes
-- Note: Cannot constrain _chain_head existence on Bloom/Grid without
-- requiring it on ALL Blooms/Grids including leaf Blooms that never contain children.
-- This requires either: (a) all Blooms get a genesis chain head at creation,
-- or (b) _chain_head existence is not constrained (weaker).

-- Index for chain traversal
CREATE INDEX chain_hash_lookup IF NOT EXISTS FOR (n:Seed) ON (n._node_hash)
CREATE INDEX chain_hash_lookup_bloom IF NOT EXISTS FOR (n:Bloom) ON (n._node_hash)
-- (Repeat for other labels)
```

### 9.5 Migration Path for Existing Nodes

Existing governed nodes lack chain properties. Migration requires:

1. For each container, query all children ordered by `createdAt`
2. Thread them into a chain: compute `_node_hash` and `_prev_hash` for each, sequentially
3. Set `_chain_head` on the container

This is a one-time batch operation. It must run *before* existence constraints on chain properties are activated. Sequence:

```
1. Deploy code that writes chain properties on new nodes
2. Run migration batch to backfill chain properties on existing nodes
3. Verify all morpheme nodes have chain properties
4. Activate existence constraints
```

---

## 10. Composite Recommendation

Option C (hash chains) **should not be deployed alone**. As a standalone mechanism, it provides detection, not prevention — violating R-63 criterion (a).

However, hash chains provide unique value when **layered with Option B (HMAC tokens)**:

| Layer | Mechanism | What It Provides |
|---|---|---|
| **Option A** (Constraints) | DB-level existence constraints on governance properties | Raises the bar from "any Cypher" to "must supply governance-shaped properties" |
| **Option B** (HMAC) | Cryptographic write token per node | Makes fake-value supply infeasible without key access |
| **Option C** (Hash Chains) | HMAC-based ordered chain per container | Cascading tamper evidence, ordered provenance manifest, temporal integrity bond |

The recommended composite:

- Option A provides the **structural gate** (database rejects incomplete nodes)
- Option B provides the **forgery resistance** (cryptographic token per node)
- Option C provides the **integrity chain** (ordered provenance with cascading tamper evidence, stamp-time verification gate)

In this composite, Option C's HMAC key is the *same* key as Option B's — no additional key management. The `_node_hash` is effectively the `_write_token` extended with chain linkage. The per-node HMAC (Option B) and the chained HMAC (Option C) can be unified:

```
_write_token = HMAC-SHA256(key, node_id + "|" + label + "|" + instantiation_id + "|" + epoch)
_node_hash   = HMAC-SHA256(key, _chain_id + "|" + label + "|" + node_id + "|" + sorted_props + "|" + _prev_hash)
```

Both properties exist on every governed node. `_write_token` provides per-node forgery resistance. `_node_hash` provides chain linkage and tamper evidence. They serve complementary purposes with shared infrastructure.

---

## 11. Summary of Findings

| Analysis Area | Finding |
|---|---|
| **Hash chain structure** | Specified: `_node_hash`, `_prev_hash`, `_chain_id` with HMAC-SHA256 over canonical input including chain linkage |
| **Chain topology** | Per-container chains recommended — aligns with G3 containment, natural concurrency partitioning, limited blast radius |
| **Concurrent writes** | Neo4j implicit write locking within `writeTransaction()` serializes concurrent appenders to the same container. Per-container topology limits contention to same-container writes. |
| **Chain forking attack** | **Critical vulnerability without HMAC.** Pure SHA-256 chains can be forked by any reader. HMAC-signed chains + HMAC-signed chain heads resist forking. Chain head modification remains a property-level write that must be detected, not prevented. |
| **Recovery** | Per-container blast radius. Violation recording + chain rebuild from HMAC-verified nodes. Recovery is reactive. |
| **Detection vs. prevention** | **Hash chains are fundamentally a detection and tamper-evidence mechanism, not a prevention mechanism.** They become structurally valuable when combined with HMAC (Option B) for forgery resistance and read-path filtering for governance-layer invisibility of injected nodes. Alone, they do not satisfy R-63 criterion (a). |
| **Integration path** | Modifications scoped to `instantiateMorpheme()` (chain append), `stampBloomComplete()` (chain verification gate), `updateMorpheme()` (mutation hash). Shares HMAC infrastructure with Option B. Migration requires backfill batch before constraint activation. |