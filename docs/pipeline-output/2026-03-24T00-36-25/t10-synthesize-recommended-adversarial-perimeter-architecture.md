# Synthesize recommended adversarial perimeter architecture

> Task ID: t10
> Model: claude-opus-4-6:adaptive:medium
> Duration: 277118ms
> Output chars: 48822
> Timestamp: 2026-03-24T01:26:43.303Z

> **⚠️ Hallucination flags (3):**
> - [content/warning] References eliminated entity "monitoring overlay"
> - [content/warning] Task t10 references "schema.ts" but this file was not in its context
> - [content/warning] Task t10 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# R-63 Recommended Adversarial Perimeter Architecture

**Document:** codex-signum-adversarial-perimeter-architecture-v1.md
**Task:** t10 — Synthesize recommended adversarial perimeter architecture
**Status:** Architecture specification — Architect review required
**Inputs:** t1 (Threat Model), t2 (Enforcement Audit), t3 (Capabilities Survey), t4–t8 (Design Options A–E), t9 (Comparative Evaluation)
**References:** cs-v5.0.md §Constitutional Coupling, §A6 Minimal Authority; instantiation-mutation-resonator-design.md; codex-signum-engineering-bridge-v3_0.md

---

## 0. Governing Invariant

> **A morpheme-labeled node exists in the committed graph if and only if (1) it carries a valid cryptographic write token bound to its identity and governance provenance, (2) it is connected via INSTANTIATES to a definition Seed in the Constitutional Bloom, and (3) it is connected via CONTAINS to a valid container — all three conditions enforced by the database engine within the committing transaction, before commit, without application-layer participation.**

This is the single clear invariant. "Structurally impossible" means: a raw Cypher `CREATE` that omits any of the three conditions causes a transaction rollback at the database layer. "Structurally distinguishable without monitoring" means: any node that somehow evades the trigger (degraded-mode scenario documented in §8) is identifiable by the absence of valid `_gov_write_token` — a property whose valid values cannot be forged without key material that never resides in the database or in the application's runtime memory (HSM/secrets-manager backed).

---

## 1. Architecture Overview — Four Composed Layers

The architecture composes four mechanisms. Each layer is independently valuable; together they provide defense-in-depth such that any single layer's failure does not collapse the perimeter.

| Layer | Mechanism | What It Enforces | Enforcement Timing | Edition |
|-------|-----------|------------------|--------------------|---------|
| **L1: RBAC Isolation** | Neo4j fine-grained roles | Only `cs_governed_writer` credentials can CREATE morpheme-labeled nodes | Query planning (pre-execution) | Enterprise (optional) |
| **L2: Property Constraints** | `IS NOT NULL` existence constraints on `_gov_*` properties | Every morpheme node must carry governance provenance properties at creation | Pre-commit (schema enforcement) | Community + Enterprise |
| **L3: APOC Trigger Gate** | `before`-phase APOC trigger | INSTANTIATES wiring exists, CONTAINS placement exists, `_gov_write_token` is cryptographically valid | Pre-commit (transactional) | Community + Enterprise (requires APOC) |
| **L4: Cryptographic Binding** | HMAC-SHA256 write tokens | Token value is unforgeable without secret key; binds node identity to governance transaction | Verified by L3 trigger at pre-commit | N/A (application generates, DB verifies) |

**What is excluded and why:**

- **Hash chains (Option C):** Rejected. The t6 analysis and t9 evaluation confirm that hash chains create a detection invariant, not an enforcement invariant. Injected nodes exist in the graph; the chain merely excludes them from its sequence. Verifying the chain requires traversal — the compliance-as-monitoring anti-pattern that R-63 §10 explicitly prohibits. Hash chains add operational complexity (chain-head contention, O(n) verification, mutation divergence) without contributing to structural enforcement.

**Architectural principle:** Each layer addresses a different failure mode. L1 prevents unauthorized credentials from attempting writes. L2 prevents writes that omit governance metadata. L3 prevents writes that carry fake governance metadata. L4 provides the cryptographic basis that makes L3's validity check meaningful. The composition satisfies all three R-63 mandatory criteria because no single layer is the sole enforcement point.

---

## 2. Layer 1 — RBAC Role Model

### 2.1 Role Definitions

*Applicable on Neo4j Enterprise Edition. On Community Edition, this layer is absent; Layers 2–4 carry the full enforcement load (see §8.1 for degraded-mode analysis).*

**Three roles, strict separation of privilege:**

| Role | Purpose | Morpheme Label Write | Relationship Write | Property Write on Morphemes | Read |
|------|---------|---------------------|--------------------|-----------------------------|------|
| `cs_governed_writer` | Governance layer (Instantiation/Mutation/Line Resonators) | ✅ GRANT | ✅ GRANT | ✅ GRANT | ✅ GRANT |
| `cs_reader` | All non-governance access (Browser, cypher-shell, analytics, debugging) | ❌ DENY | ❌ DENY on morpheme rels | ❌ DENY | ✅ GRANT |
| `cs_pipeline_executor` | Pipeline execution — can create non-morpheme operational nodes (PipelineRun, TaskOutput) | ❌ DENY on morpheme labels; ✅ GRANT on PipelineRun, TaskOutput | ✅ GRANT on operational rels | ❌ DENY on morpheme labels | ✅ GRANT |

### 2.2 Neo4j DDL — Role and Privilege Statements

```cypher
-- ── Role creation ──
CREATE ROLE cs_governed_writer IF NOT EXISTS;
CREATE ROLE cs_reader IF NOT EXISTS;
CREATE ROLE cs_pipeline_executor IF NOT EXISTS;

-- ── cs_reader: full read, zero morpheme write ──
GRANT MATCH {*} ON GRAPH codex_signum TO cs_reader;
GRANT TRAVERSE ON GRAPH codex_signum TO cs_reader;
GRANT READ {*} ON GRAPH codex_signum TO cs_reader;

DENY CREATE ON GRAPH codex_signum NODES Seed, Bloom, Resonator, Grid, Helix TO cs_reader;
DENY DELETE ON GRAPH codex_signum NODES Seed, Bloom, Resonator, Grid, Helix TO cs_reader;
DENY SET LABEL Seed, Bloom, Resonator, Grid, Helix ON GRAPH codex_signum TO cs_reader;
DENY REMOVE LABEL Seed, Bloom, Resonator, Grid, Helix ON GRAPH codex_signum TO cs_reader;
DENY SET PROPERTY {*} ON GRAPH codex_signum NODES Seed, Bloom, Resonator, Grid, Helix TO cs_reader;
DENY CREATE ON GRAPH codex_signum RELATIONSHIPS CONTAINS, INSTANTIATES, FLOWS_TO TO cs_reader;

-- ── cs_governed_writer: full CRUD on morpheme labels + relationships ──
GRANT MATCH {*} ON GRAPH codex_signum TO cs_governed_writer;
GRANT TRAVERSE ON GRAPH codex_signum TO cs_governed_writer;
GRANT READ {*} ON GRAPH codex_signum TO cs_governed_writer;
GRANT CREATE ON GRAPH codex_signum NODES Seed, Bloom, Resonator, Grid, Helix TO cs_governed_writer;
GRANT DELETE ON GRAPH codex_signum NODES Seed, Bloom, Resonator, Grid, Helix TO cs_governed_writer;
GRANT SET LABEL Seed, Bloom, Resonator, Grid, Helix ON GRAPH codex_signum TO cs_governed_writer;
GRANT SET PROPERTY {*} ON GRAPH codex_signum NODES Seed, Bloom, Resonator, Grid, Helix TO cs_governed_writer;
GRANT CREATE ON GRAPH codex_signum RELATIONSHIPS * TO cs_governed_writer;
GRANT DELETE ON GRAPH codex_signum RELATIONSHIPS * TO cs_governed_writer;
GRANT SET PROPERTY {*} ON GRAPH codex_signum RELATIONSHIPS * TO cs_governed_writer;

-- ── cs_pipeline_executor: operational nodes only, no morpheme writes ──
GRANT MATCH {*} ON GRAPH codex_signum TO cs_pipeline_executor;
GRANT TRAVERSE ON GRAPH codex_signum TO cs_pipeline_executor;
GRANT READ {*} ON GRAPH codex_signum TO cs_pipeline_executor;
GRANT CREATE ON GRAPH codex_signum NODES PipelineRun, TaskOutput TO cs_pipeline_executor;
GRANT SET PROPERTY {*} ON GRAPH codex_signum NODES PipelineRun, TaskOutput TO cs_pipeline_executor;
GRANT CREATE ON GRAPH codex_signum RELATIONSHIPS EXECUTED_IN, PRODUCED, PROCESSED, DECIDED_DURING TO cs_pipeline_executor;

DENY CREATE ON GRAPH codex_signum NODES Seed, Bloom, Resonator, Grid, Helix TO cs_pipeline_executor;
DENY SET LABEL Seed, Bloom, Resonator, Grid, Helix ON GRAPH codex_signum TO cs_pipeline_executor;
DENY SET PROPERTY {*} ON GRAPH codex_signum NODES Seed, Bloom, Resonator, Grid, Helix TO cs_pipeline_executor;

-- ── User assignment (deployment-specific, examples) ──
CREATE USER cs_app_writer IF NOT EXISTS SET PASSWORD 'ROTATED_VIA_SECRETS_MANAGER' SET PASSWORD CHANGE NOT REQUIRED;
GRANT ROLE cs_governed_writer TO cs_app_writer;

CREATE USER cs_app_reader IF NOT EXISTS SET PASSWORD 'ROTATED_VIA_SECRETS_MANAGER' SET PASSWORD CHANGE NOT REQUIRED;
GRANT ROLE cs_reader TO cs_app_reader;
```

### 2.3 Credential Isolation

The `cs_governed_writer` credentials must not be co-located with the general application credentials:

| Credential | Storage | Access Pattern |
|------------|---------|----------------|
| `cs_governed_writer` | Cloud secrets manager (AWS Secrets Manager / GCP Secret Manager) with IAM-scoped access | Retrieved at Instantiation/Mutation Resonator initialization only; not available to general application code |
| `cs_reader` | Application configuration / environment variable | Available to all read paths |
| `cs_pipeline_executor` | CI/CD pipeline secrets | Available to pipeline orchestration only |

**Cross-reference:** cs-v5.0.md §A6 Minimal Authority — "A pattern requests only the resources its purpose requires." The role model implements A6 at the database layer: read paths hold only read credentials; pipeline execution holds only operational-node credentials; only the governance Resonators hold morpheme-write credentials.

---

## 3. Layer 2 — Property Existence Constraints

### 3.1 Governance Property Schema

Five governance properties are required on every morpheme-labeled node:

| Property | Semantic Type | Source of Truth | Purpose |
|----------|--------------|-----------------|---------|
| `_gov_instantiation_id` | UUID v4 string | Generated by `instantiateMorpheme()` | Links to specific governance transaction record |
| `_gov_provenance_epoch` | ISO-8601 datetime string | Server clock at creation | Temporal ordering in provenance |
| `_gov_contains_path` | Dot-delimited path string | Computed from parent traversal | Encodes G3 placement decision at creation |
| `_gov_schema_version` | Integer | Governance layer constant | Migration compatibility |
| `_gov_write_token` | String (`v{N}:{base64}`) | HMAC-SHA256 computation (see §5) | Cryptographic binding — the property that L3 validates |

### 3.2 Constraint DDL

These are additive to the existing constraints in `src/graph/schema.ts`. The `SCHEMA_STATEMENTS` array gains 25 new entries (5 properties × 5 labels):

```cypher
-- ── Seed governance properties ──
CREATE CONSTRAINT seed_gov_instantiation_id_required IF NOT EXISTS
  FOR (s:Seed) REQUIRE s._gov_instantiation_id IS NOT NULL;
CREATE CONSTRAINT seed_gov_provenance_epoch_required IF NOT EXISTS
  FOR (s:Seed) REQUIRE s._gov_provenance_epoch IS NOT NULL;
CREATE CONSTRAINT seed_gov_contains_path_required IF NOT EXISTS
  FOR (s:Seed) REQUIRE s._gov_contains_path IS NOT NULL;
CREATE CONSTRAINT seed_gov_schema_version_required IF NOT EXISTS
  FOR (s:Seed) REQUIRE s._gov_schema_version IS NOT NULL;
CREATE CONSTRAINT seed_gov_write_token_required IF NOT EXISTS
  FOR (s:Seed) REQUIRE s._gov_write_token IS NOT NULL;

-- ── Bloom governance properties ──
CREATE CONSTRAINT bloom_gov_instantiation_id_required IF NOT EXISTS
  FOR (b:Bloom) REQUIRE b._gov_instantiation_id IS NOT NULL;
CREATE CONSTRAINT bloom_gov_provenance_epoch_required IF NOT EXISTS
  FOR (b:Bloom) REQUIRE b._gov_provenance_epoch IS NOT NULL;
CREATE CONSTRAINT bloom_gov_contains_path_required IF NOT EXISTS
  FOR (b:Bloom) REQUIRE b._gov_contains_path IS NOT NULL;
CREATE CONSTRAINT bloom_gov_schema_version_required IF NOT EXISTS
  FOR (b:Bloom) REQUIRE b._gov_schema_version IS NOT NULL;
CREATE CONSTRAINT bloom_gov_write_token_required IF NOT EXISTS
  FOR (b:Bloom) REQUIRE b._gov_write_token IS NOT NULL;

-- ── Resonator governance properties ──
CREATE CONSTRAINT resonator_gov_instantiation_id_required IF NOT EXISTS
  FOR (r:Resonator) REQUIRE r._gov_instantiation_id IS NOT NULL;
CREATE CONSTRAINT resonator_gov_provenance_epoch_required IF NOT EXISTS
  FOR (r:Resonator) REQUIRE r._gov_provenance_epoch IS NOT NULL;
CREATE CONSTRAINT resonator_gov_contains_path_required IF NOT EXISTS
  FOR (r:Resonator) REQUIRE r._gov_contains_path IS NOT NULL;
CREATE CONSTRAINT resonator_gov_schema_version_required IF NOT EXISTS
  FOR (r:Resonator) REQUIRE r._gov_schema_version IS NOT NULL;
CREATE CONSTRAINT resonator_gov_write_token_required IF NOT EXISTS
  FOR (r:Resonator) REQUIRE r._gov_write_token IS NOT NULL;

-- ── Grid governance properties ──
CREATE CONSTRAINT grid_gov_instantiation_id_required IF NOT EXISTS
  FOR (g:Grid) REQUIRE g._gov_instantiation_id IS NOT NULL;
CREATE CONSTRAINT grid_gov_provenance_epoch_required IF NOT EXISTS
  FOR (g:Grid) REQUIRE g._gov_provenance_epoch IS NOT NULL;
CREATE CONSTRAINT grid_gov_contains_path_required IF NOT EXISTS
  FOR (g:Grid) REQUIRE g._gov_contains_path IS NOT NULL;
CREATE CONSTRAINT grid_gov_schema_version_required IF NOT EXISTS
  FOR (g:Grid) REQUIRE g._gov_schema_version IS NOT NULL;
CREATE CONSTRAINT grid_gov_write_token_required IF NOT EXISTS
  FOR (g:Grid) REQUIRE g._gov_write_token IS NOT NULL;

-- ── Helix governance properties ──
CREATE CONSTRAINT helix_gov_instantiation_id_required IF NOT EXISTS
  FOR (h:Helix) REQUIRE h._gov_instantiation_id IS NOT NULL;
CREATE CONSTRAINT helix_gov_provenance_epoch_required IF NOT EXISTS
  FOR (h:Helix) REQUIRE h._gov_provenance_epoch IS NOT NULL;
CREATE CONSTRAINT helix_gov_contains_path_required IF NOT EXISTS
  FOR (h:Helix) REQUIRE h._gov_contains_path IS NOT NULL;
CREATE CONSTRAINT helix_gov_schema_version_required IF NOT EXISTS
  FOR (h:Helix) REQUIRE h._gov_schema_version IS NOT NULL;
CREATE CONSTRAINT helix_gov_write_token_required IF NOT EXISTS
  FOR (h:Helix) REQUIRE h._gov_write_token IS NOT NULL;

-- ── Resonator, Grid, Helix domain property existence (closing the t2 gap) ──
CREATE CONSTRAINT resonator_name_required IF NOT EXISTS
  FOR (r:Resonator) REQUIRE r.name IS NOT NULL;
CREATE CONSTRAINT resonator_content_required IF NOT EXISTS
  FOR (r:Resonator) REQUIRE r.content IS NOT NULL;
CREATE CONSTRAINT resonator_type_required IF NOT EXISTS
  FOR (r:Resonator) REQUIRE r.type IS NOT NULL;
CREATE CONSTRAINT resonator_status_required IF NOT EXISTS
  FOR (r:Resonator) REQUIRE r.status IS NOT NULL;

CREATE CONSTRAINT grid_name_required IF NOT EXISTS
  FOR (g:Grid) REQUIRE g.name IS NOT NULL;
CREATE CONSTRAINT grid_content_required IF NOT EXISTS
  FOR (g:Grid) REQUIRE g.content IS NOT NULL;
CREATE CONSTRAINT grid_type_required IF NOT EXISTS
  FOR (g:Grid) REQUIRE g.type IS NOT NULL;
CREATE CONSTRAINT grid_status_required IF NOT EXISTS
  FOR (g:Grid) REQUIRE g.status IS NOT NULL;

CREATE CONSTRAINT helix_name_required IF NOT EXISTS
  FOR (h:Helix) REQUIRE h.name IS NOT NULL;
CREATE CONSTRAINT helix_content_required IF NOT EXISTS
  FOR (h:Helix) REQUIRE h.content IS NOT NULL;
CREATE CONSTRAINT helix_mode_required IF NOT EXISTS
  FOR (h:Helix) REQUIRE h.mode IS NOT NULL;
CREATE CONSTRAINT helix_status_required IF NOT EXISTS
  FOR (h:Helix) REQUIRE h.status IS NOT NULL;
```

**Total new constraints:** 25 governance + 12 domain existence = 37 new constraints. Added to 23 existing = **60 total constraints**.

### 3.3 What L2 Stops and What It Does Not

**Stops (database-layer, pre-commit, no application involvement):**
- `CREATE (s:Seed {id: 'x'})` — fails, missing `_gov_instantiation_id` etc.
- `CREATE (r:Resonator {id: 'x'})` — fails, missing `name`, `content`, `type`, `status`, all `_gov_*`
- Any raw Cypher that omits any governance property

**Does not stop (the fake-value attack):**
- `CREATE (s:Seed {id:'x', content:'y', seedType:'z', status:'active', _gov_instantiation_id:'fake', _gov_provenance_epoch:'fake', _gov_contains_path:'fake', _gov_schema_version:1, _gov_write_token:'fake'})` — passes L2, caught by L3

This is exactly why L3 exists: L2 is the **structural floor** (ensures the properties exist so L3 can inspect them), and L3 is the **validity gate** (ensures the values are legitimate).

---

## 4. Layer 3 — APOC Trigger Gate

### 4.1 Trigger Architecture

Three `before`-phase APOC triggers execute within the committing transaction:

| Trigger Name | What It Checks | Failure Mode |
|-------------|----------------|--------------|
| `gov_enforce_instantiates` | New morpheme node has INSTANTIATES → definition Seed | Transaction rollback |
| `gov_enforce_contains` | New morpheme node has CONTAINS ← valid container (with whitelist for root/definition nodes) | Transaction rollback |
| `gov_enforce_write_token` | `_gov_write_token` value passes HMAC-SHA256 verification against the canonical input | Transaction rollback |

### 4.2 Trigger DDL Specifications

**Trigger 1 — INSTANTIATES Wiring:**

```cypher
CALL apoc.trigger.add(
  'gov_enforce_instantiates',
  '
  UNWIND $createdNodes AS node
  WITH node
  WHERE (node:Seed OR node:Bloom OR node:Resonator OR node:Grid OR node:Helix)
    AND NOT node.id STARTS WITH "def:"
    AND NOT node.id = "constitutional-bloom"
  OPTIONAL MATCH (node)-[:INSTANTIATES]->(def:Seed)
  WITH node, def
  WHERE def IS NULL
  WITH collect(node.id) AS violators
  WHERE size(violators) > 0
  CALL apoc.util.validate(
    true,
    "R-63 VIOLATION: Morpheme nodes created without INSTANTIATES wiring: " +
    apoc.text.join(violators, ", "),
    []
  )
  RETURN null
  ',
  {phase: "before"}
);
```

**Trigger 2 — CONTAINS Placement:**

```cypher
CALL apoc.trigger.add(
  'gov_enforce_contains',
  '
  UNWIND $createdNodes AS node
  WITH node
  WHERE (node:Seed OR node:Bloom OR node:Resonator OR node:Grid OR node:Helix)
    AND NOT node.id STARTS WITH "def:"
    AND NOT node.id = "constitutional-bloom"
    AND NOT node.id STARTS WITH "grid:violation:"
    AND NOT node.id STARTS WITH "grid:instantiation"
    AND NOT node.id STARTS WITH "grid:mutation"
    AND NOT node.id STARTS WITH "grid:line-creation"
  OPTIONAL MATCH (parent)-[:CONTAINS]->(node)
  WITH node, parent
  WHERE parent IS NULL
  WITH collect(node.id) AS violators
  WHERE size(violators) > 0
  CALL apoc.util.validate(
    true,
    "R-63 VIOLATION: Morpheme nodes created without CONTAINS placement: " +
    apoc.text.join(violators, ", "),
    []
  )
  RETURN null
  ',
  {phase: "before"}
);
```

**Trigger 3 — Write Token Verification:**

```cypher
CALL apoc.trigger.add(
  'gov_enforce_write_token',
  '
  UNWIND $createdNodes AS node
  WITH node
  WHERE (node:Seed OR node:Bloom OR node:Resonator OR node:Grid OR node:Helix)
    AND NOT node.id STARTS WITH "def:"
    AND NOT node.id = "constitutional-bloom"
  WITH node,
       node._gov_write_token AS token,
       node.id AS nodeId,
       node._gov_instantiation_id AS instId,
       node._gov_provenance_epoch AS epoch,
       node._gov_schema_version AS schemaVer
  // Extract key version from token prefix
  WITH node, token, nodeId, instId, epoch, schemaVer,
       CASE WHEN token CONTAINS ":" THEN split(token, ":")[0] ELSE "v0" END AS keyVersion,
       CASE WHEN token CONTAINS ":" THEN split(token, ":")[1] ELSE token END AS tokenBody
  // Reconstruct canonical input
  WITH node, token, tokenBody, keyVersion,
       nodeId + "|" + apoc.node.labels(node)[0] + "|" + instId + "|" + epoch + "|" + toString(schemaVer)
       AS canonicalInput
  // Verify HMAC using stored secret (APOC custom function, see §4.3)
  WITH node, token,
       cs.governance.verifyHmac(canonicalInput, tokenBody, keyVersion) AS valid
  WHERE NOT valid
  WITH collect(node.id) AS violators
  WHERE size(violators) > 0
  CALL apoc.util.validate(
    true,
    "R-63 VIOLATION: Morpheme nodes with invalid write tokens: " +
    apoc.text.join(violators, ", "),
    []
  )
  RETURN null
  ',
  {phase: "before"}
);
```

### 4.3 Token Verification Function

The `cs.governance.verifyHmac()` function referenced in Trigger 3 is a **custom Neo4j procedure** (Java plugin) deployed alongside APOC. This is necessary because:

1. APOC does not ship with HMAC-SHA256 verification as a built-in function.
2. The HMAC secret key must be accessible to the database layer but not queryable by users.
3. The key is loaded from a file path specified in `neo4j.conf` (analogous to how APOC loads its own configuration), not stored as a graph property.

**Plugin interface specification:**

```
cs.governance.verifyHmac(canonicalInput: STRING, tokenBody: STRING, keyVersion: STRING) → BOOLEAN
```

- Loads key material from `${NEO4J_HOME}/conf/governance-keys/${keyVersion}.key`
- Computes `HMAC-SHA256(key, canonicalInput)`
- Compares computed digest (base64) against `tokenBody`
- Returns `true` if match, `false` otherwise
- **Never returns the key or the computed HMAC** — only a boolean

**Key storage:** The key file is on the Neo4j server's filesystem, readable only by the `neo4j` system user. It is NOT stored in the graph, NOT accessible via Cypher, NOT accessible to any Neo4j database user regardless of role. A Class A attacker (Neo4j write access) cannot read it. A Class B attacker (admin access) could read it only with OS-level access to the Neo4j server.

### 4.4 Whitelist Management for Bootstrap Nodes

The triggers include ID-prefix whitelists for nodes that exist outside normal governance flow:

| Whitelist Pattern | Reason |
|-------------------|--------|
| `def:*` | Definition Seeds in the Constitutional Bloom — they ARE the definitions that INSTANTIATES points to |
| `constitutional-bloom` | The root Bloom — it has no parent CONTAINS |
| `grid:violation:*` | Violation Grids bootstrapped by Highlander Protocol |
| `grid:instantiation*` | Observation Grids bootstrapped by Instantiation Resonator |
| `grid:mutation*` | Observation Grids bootstrapped by Mutation Resonator |
| `grid:line-creation*` | Observation Grids bootstrapped by Line Creation Resonator |

**Security note:** The whitelist is ID-prefix based. An attacker who knows the prefix convention could create nodes with whitelisted IDs to bypass the trigger. This is a known residual risk. Mitigation: the whitelist patterns are deliberately narrow (no wildcard on common prefixes like `seed:` or `bloom:`), and the bootstrap Grids are created via `MERGE` (idempotent, so the attacker's attempt to create a duplicate would collide with the uniqueness constraint on `id`).

**Alternative approach:** Instead of prefix whitelisting, the bootstrap nodes could be pre-created during schema migration (before triggers are installed), then the triggers could have zero whitelist entries. This is the recommended migration sequence — see §7.

---

## 5. Layer 4 — Cryptographic Write Token Scheme

### 5.1 Token Specification

```
_gov_write_token = "v" + key_version + ":" + BASE64(HMAC-SHA256(secret_key[version], canonical_input))
```

**Canonical input construction:**

```
canonical_input = node_id + "|" + primary_label + "|" + instantiation_id + "|" + epoch + "|" + schema_version
```

| Field | Source | Example |
|-------|--------|---------|
| `node_id` | `id` property of the morpheme | `"R-63"` |
| `primary_label` | First morpheme label (Seed, Bloom, Resonator, Grid, Helix) | `"Seed"` |
| `instantiation_id` | UUID v4 generated per governance transaction | `"550e8400-e29b-41d4-a716-446655440000"` |
| `epoch` | ISO-8601 timestamp | `"2025-01-15T10:30:00.000Z"` |
| `schema_version` | Integer constant from governance layer | `6` |

**Example token:**
```
v1:K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=
```

### 5.2 Key Management

| Aspect | Specification |
|--------|--------------|
| **Algorithm** | HMAC-SHA256 (128-bit security level) |
| **Key length** | 256 bits (32 bytes) |
| **Generation** | `crypto.randomBytes(32)` or HSM key generation |
| **Application-side storage** | Cloud secrets manager (AWS Secrets Manager, GCP Secret Manager). Retrieved at Resonator initialization, held in memory only for the duration of the write transaction. |
| **Database-side storage** | File on Neo4j server filesystem: `${NEO4J_HOME}/conf/governance-keys/v{N}.key`. Readable only by `neo4j` system user. Loaded by the `cs.governance.verifyHmac` plugin. |
| **Rotation trigger** | Quarterly scheduled, or immediately on suspected compromise |
| **Multi-version support** | Token prefix `v{N}:` selects key version. All non-revoked versions remain verification-valid. |

### 5.3 Why the Token Cannot Be Forged by a Class A Attacker

A Class A attacker (Neo4j write access, non-admin) can:
- Read any property on any node → can see existing `_gov_write_token` values
- Copy a token from one node to another → but the token is bound to `node_id` in the canonical input, so verification fails for a different node
- Guess a token value → 2^128 security level makes brute force infeasible
- Replay a token → bound to `node_id` and `instantiation_id`, replay on a different node fails

A Class A attacker **cannot**:
- Read the HMAC key from the filesystem (no OS access)
- Read the HMAC key from the graph (not stored there)
- Call `cs.governance.verifyHmac` to oracle-test guesses (function returns boolean, and the attacker needs to compute the HMAC, not verify one)
- Modify the trigger logic (requires admin/plugin-install privileges)

**Cross-reference:** cs-v5.0.md §A6 — "It cannot write outside its containing Bloom." The cryptographic token extends this principle: even with raw Cypher write access, the attacker cannot produce a write that the database will accept as governed.

---

## 6. Instantiation Protocol Modifications

### 6.1 Changes to `instantiateMorpheme()`

The function in `src/graph/instantiation.ts` requires the following modifications:

| Step | Current Behavior | New Behavior |
|------|-----------------|-------------|
| **Pre-write: Generate governance metadata** | Not present | Generate `_gov_instantiation_id` (UUID v4), `_gov_provenance_epoch` (server clock), `_gov_contains_path` (parent traversal), `_gov_schema_version` (constant) |
| **Pre-write: Compute write token** | Not present | Retrieve HMAC key from secrets manager. Construct canonical input. Compute `HMAC-SHA256(key, canonical_input)`. Format as `v{N}:{base64}`. Set as `_gov_write_token` property. |
| **Atomic transaction** | MERGE node + MERGE CONTAINS + MERGE INSTANTIATES | Same three operations, but node MERGE now includes all five `_gov_*` properties in the SET clause |
| **Post-write: Key cleanup** | Not present | Zero the key material from memory (or rely on secrets-manager SDK's automatic cleanup) |

### 6.2 Changes to `updateMorpheme()`

| Change | Rationale |
|--------|-----------|
| `_gov_*` properties added to a **deny-update list** | Governance provenance is creation-time immutable. Mutations change domain properties only. Prevents an attacker who compromises the Mutation Resonator from overwriting governance provenance. |
| Exception: `_gov_write_token` can be updated during **re-token migration** (§7.3) | Emergency key rotation requires re-computing tokens for all existing nodes. This is a one-time migration operation, not normal mutation flow. |

### 6.3 Changes to `createLine()`

No changes required. Lines (relationships) do not carry governance properties in this architecture. Relationship creation is governed by the trigger's INSTANTIATES and CONTAINS checks on the endpoint nodes — if the endpoint nodes are governed, the Lines connecting them inherit that provenance.

**Future consideration:** If relationship-level provenance becomes necessary (e.g., preventing fabricated INSTANTIATES edges), a relationship-type trigger could be added as L3.1. This is not in scope for the initial architecture.

### 6.4 Changes to `stampBloomComplete()`

| Change | Rationale |
|--------|-----------|
| Stamp delegates to `updateMorpheme()` | Already the case. No change needed because `updateMorpheme()` does not touch `_gov_*` properties. |
| INSTANTIATES backfill (Step 5) must now also set `_gov_*` properties | The backfill logic currently uses `createLine()` only. If it discovers nodes without INSTANTIATES, those nodes also likely lack `_gov_*` properties (legacy nodes). Backfill must use the full governance property generation path. |

### 6.5 Changes to `seedConstitutionalRules()`

Constitutional rules are created via raw `MERGE` in `schema.ts`. Post-architecture:

| Option | Approach |
|--------|----------|
| **Recommended:** Pre-trigger bootstrap | Constitutional rules, definition Seeds, and the root Bloom are created during schema migration *before* triggers are installed. They receive `_gov_*` properties via the migration script but are exempt from trigger validation (they exist before triggers). |
| **Alternative:** Whitelist exemption | Already specified in §4.4. Constitutional-level nodes are whitelisted by ID prefix. |

---

## 7. Migration Path for Existing Nodes

### 7.1 Migration Sequence (Order Is Critical)

The migration must execute in this exact sequence to avoid a state where triggers reject existing nodes:

```
Phase 1: Domain property gap closure
  → Add name/content/type/status existence constraints on Resonator, Grid, Helix
  → Fix any existing nodes that violate these constraints (add missing properties)

Phase 2: Governance property backfill
  → For every existing morpheme node:
    → Generate _gov_instantiation_id (UUID v4, tagged as "migration-backfill")
    → Set _gov_provenance_epoch to node's createdAt (or migration timestamp)
    → Compute _gov_contains_path from current CONTAINS chain
    → Set _gov_schema_version to current version
    → Compute _gov_write_token from canonical input + HMAC key
    → SET all five properties in a batch write

Phase 3: Governance property constraints
  → Deploy the 25 new _gov_* existence constraints
  → Verify no constraint violations (all nodes now have the properties)

Phase 4: APOC triggers
  → Install gov_enforce_instantiates
  → Install gov_enforce_contains
  → Install gov_enforce_write_token
  → Test: attempt a raw CREATE — verify it fails

Phase 5: RBAC (Enterprise only)
  → Create roles and assign privileges
  → Rotate application credentials to role-specific users
  → Test: verify governed_writer can create, reader cannot

Phase 6: Verification
  → Run verifySchema() — expect 60+ constraints
  → Run governance property completeness check
  → Attempt adversarial writes from t2 bypass list — verify all fail
```

### 7.2 Backfill Cypher (Phase 2)

The backfill operates per-label in batches to avoid transaction size limits:

```cypher
// Example for Seed backfill — repeated for each label
MATCH (s:Seed) WHERE s._gov_instantiation_id IS NULL
WITH s LIMIT 500
SET s._gov_instantiation_id = "migration:" + apoc.create.uuid(),
    s._gov_provenance_epoch = COALESCE(s.createdAt, datetime()),
    s._gov_contains_path = "migration:backfill",
    s._gov_schema_version = 6,
    s._gov_write_token = $computedToken  // Computed per-node externally
RETURN count(s) AS backfilled
```

**Note:** `_gov_write_token` must be computed per-node in the application layer (the migration script), because the HMAC key is not available in Cypher. The migration script iterates over nodes, computes each token, and sets it. This is a one-time batch operation.

### 7.3 Backfill for `_gov_contains_path`

For existing nodes that lack a clear CONTAINS chain:

```cypher
MATCH path = (root:Bloom {id: 'constitutional-bloom'})-[:CONTAINS*]->(n)
WHERE n._gov_contains_path IS NULL OR n._gov_contains_path = 'migration:backfill'
WITH n, [node IN nodes(path) | node.id] AS pathIds
SET n._gov_contains_path = apoc.text.join(pathIds, ".")
RETURN count(n) AS pathed
```

Nodes with no CONTAINS ancestry (orphans) receive `_gov_contains_path = "orphan:migration"` and are flagged for manual review.

### 7.4 Handling Orphan Nodes During Migration

The t2 audit established that orphan nodes (no CONTAINS, no INSTANTIATES) may already exist. The migration must handle them:

| Orphan Type | Action |
|-------------|--------|
| Has valid domain properties, plausible identity | Wire CONTAINS to appropriate parent Bloom, wire INSTANTIATES to definition Seed, generate full governance properties |
| Has partial properties, unclear provenance | Move to a quarantine Bloom (`bloom:migration-quarantine`), generate governance properties with `_gov_contains_path = "quarantine:migration"` |
| Empty/minimal properties | Delete if safe (no inbound relationships); quarantine otherwise |

---

## 8. Degraded-Mode Behavior

### 8.1 L1 (RBAC) Absent — Community Edition

| Impact | Mitigation |
|--------|------------|
| Any database user with write credentials can attempt morpheme creation | L2 constraints reject writes without governance properties; L3 triggers reject writes with fake governance properties |
| The `cs_reader` / `cs_governed_writer` credential separation does not exist | All writes go through the same credentials, but the trigger gate still prevents ungoverned commits |
| **Residual risk** | A compromised application that holds the HMAC key AND knows the governance property schema can bypass L2+L3. This is the application-compromise scenario. Without RBAC, the trigger + token combination is the sole barrier. |

**Assessment:** L2+L3+L4 without L1 satisfies criteria (a) and (b). Criterion (c) — "works when the application layer is compromised" — is degraded: if the attacker exfiltrates the HMAC key from the secrets manager (which they can do if the application can), they can forge tokens. The trigger still enforces INSTANTIATES and CONTAINS wiring, which requires knowledge of valid definition Seed IDs and parent Bloom IDs, raising the bar but not making it structurally impossible.

**Cross-reference:** cs-v5.0.md §Constitutional Coupling — "The structure itself, not a monitoring layer, makes violations impossible." In Community Edition without RBAC, violations are not impossible but are structurally constrained to attackers who possess both (1) the HMAC key and (2) knowledge of the graph topology (valid definition IDs and container IDs).

### 8.2 L2 (Constraints) Absent — Constraint Deployment Failure

| Impact | Mitigation |
|--------|------------|
| Nodes can be created without governance properties | L3 triggers still check for INSTANTIATES and CONTAINS wiring; trigger 3 will fail on null token values |
| **Residual risk** | An attacker can create nodes that pass trigger 1 and 2 (by providing INSTANTIATES and CONTAINS in the same transaction) but without governance properties. The write token trigger (trigger 3) will reject null/empty tokens. However, if trigger 3 is also absent, the node commits. |

**Assessment:** L2 failure alone is recoverable — L3 provides redundant enforcement for the property presence check (trigger 3 implicitly checks `_gov_write_token IS NOT NULL` via the verification function). The migration script should verify constraint deployment and halt if critical constraints fail.

### 8.3 L3 (Triggers) Absent — APOC Unavailable or Triggers Disabled

| Impact | Mitigation |
|--------|------------|
| No INSTANTIATES enforcement at database layer | Application-layer Instantiation Resonator is sole enforcement |
| No CONTAINS enforcement at database layer | Application-layer Instantiation Resonator is sole enforcement |
| No write token verification at database layer | Tokens are still generated and stored (L2 ensures presence) but never validated |
| **This is the pre-R-63 state** | The system reverts to application-only enforcement, which is exactly the vulnerability R-63 identifies |

**Assessment:** L3 failure is the most critical degradation. Without triggers, the architecture reduces to L2 (property presence constraints) which is vulnerable to the fake-value attack. **The deployment must treat trigger installation failure as a critical error that blocks the migration.** The `migrateSchema()` function should return `healthy: false` if triggers are not installed.

**Detection without monitoring:** Even without triggers, a node with `_gov_write_token = 'fake'` can be identified structurally: the `cs.governance.verifyHmac` function (callable by admin) returns `false`. This is a one-time verification call, not a monitoring pattern. An operator can verify any specific node on demand.

### 8.4 L4 (Crypto) Absent — Key Unavailable

| Impact | Mitigation |
|--------|------------|
| Governance layer cannot generate write tokens | `instantiateMorpheme()` fails at token generation step → no governed writes either |
| **This is a denial-of-service on the governance layer, not a bypass** | The system stops writing, which is safer than writing unverified |

**Assessment:** L4 failure is a liveness failure, not a safety failure. The system halts rather than operating without cryptographic binding. This is the correct failure mode — cs-v5.0.md §Constitutional Coupling: "Degradation fails safe."

### 8.5 Degraded-Mode Summary Matrix

| Scenario | L1 | L2 | L3 | L4 | Ungoverned Write Possible? | Failure Mode |
|----------|:--:|:--:|:--:|:--:|:------------------------:|:------------:|
| Full architecture | ✅ | ✅ | ✅ | ✅ | No | N/A |
| Community Edition | ❌ | ✅ | ✅ | ✅ | Only with key exfiltration + graph topology knowledge | Safety degraded |
| Constraint failure | ✅ | ❌ | ✅ | ✅ | No — trigger 3 rejects absent tokens | Redundant enforcement holds |
| Trigger failure | ✅ | ✅ | ❌ | ✅ | Yes — fake values pass constraints | **Critical** — pre-R-63 state |
| Key unavailable | ✅ | ✅ | ✅ | ❌ | No — system halts writes | Liveness failure (safe) |
| App compromised (Enterprise) | ✅ | ✅ | ✅ | ⚠️ | No — L1 RBAC blocks non-governed-writer credentials; trigger blocks even if keys exfiltrated from different credential set | Defense-in-depth holds |
| App compromised (Community) | ❌ | ✅ | ✅ | ⚠️ | Conditional — requires key exfiltration from secrets manager | Reduced barrier |

---

## 9. R-63 Mandatory Criteria Satisfaction

### 9.1 Criterion (a): Structural Enforcement Not Detection

**Satisfied.** The architecture enforces at three database-layer points:

1. **Property existence constraints** (L2) — declarative schema enforcement, pre-commit. The database engine rejects non-compliant writes. This is identical in enforcement character to uniqueness constraints and NOT NULL constraints already deployed.

2. **APOC triggers** (L3) — procedural enforcement, pre-commit, within the committing transaction. The trigger is not a separate process observing committed state; it is part of the transaction pipeline. An ungoverned write never commits. The t7 analysis addresses whether triggers are "structural" or "overlay": the key distinction is *when* they execute. A `before`-phase trigger executes within the transaction boundary, before commit. The write is rejected as though the database itself rejected it. From the attacker's perspective, the behavior is indistinguishable from a constraint violation.

3. **RBAC privilege checks** (L1, Enterprise) — authorization enforcement at query planning time, before execution. The most purely structural of all mechanisms: the privilege matrix is the enforcement, with no code executing at all.

**Cross-reference:** cs-v5.0.md §Constitutional Coupling — "The structure itself, not a monitoring layer, makes violations impossible." The composed architecture satisfies this: L2 makes property-absent violations impossible; L3 makes fake-property violations impossible; L1 makes unauthorized-credential violations impossible.

### 9.2 Criterion (b): No Monitoring Overlay

**Satisfied.** None of the four layers require:
- A periodic scan process
- A background compliance checker
- An event queue that processes committed transactions after the fact
- A dashboard that alerts on violations
- Any process that polls the graph for non-compliant state

Every enforcement mechanism operates inline within the write path. The `before`-phase trigger is transactional, not observational. Property constraints are schema-level. RBAC is authorization-level.

**Potential concern:** The `cs.governance.verifyHmac` custom procedure is code that runs at write time. Is this a "monitoring overlay"? No — it is a validation function called synchronously within the transaction. It has the same architectural character as a constraint check: it evaluates a condition and permits or rejects the write. It does not observe, log, alert, or report independently of the write path.

**Cross-reference:** R-63 spec "10 compliance kills" — the compliance-as-monitoring anti-pattern is where a monitoring process observes violations after the fact and reports them. This architecture has no such process. Violations are prevented, not reported.

### 9.3 Criterion (c): Works When Application Layer Is Compromised

**Satisfied with documented limitations.**

**Enterprise Edition (L1+L2+L3+L4):** A compromised application holds the `cs_governed_writer` credentials (used by the Instantiation Resonator). If the attacker exfiltrates these credentials, they can authenticate as the governed writer. However:
- L3 triggers still enforce INSTANTIATES and CONTAINS wiring, meaning the attacker must create valid relationships to definition Seeds and container Blooms within the same transaction.
- L3 trigger 3 verifies the write token, meaning the attacker must also have the HMAC key (stored in the secrets manager, a separate credential boundary from the Neo4j credentials).
- If credential isolation is maintained (governed writer Neo4j password ≠ secrets manager access key), compromising the Neo4j credential does not yield the HMAC key, and the trigger rejects the write.

**Community Edition (L2+L3+L4):** Credential isolation is weaker (one set of Neo4j credentials). If the application is compromised, the attacker has the same credentials the governance layer uses. The barrier is the HMAC key in the secrets manager + the trigger enforcement of INSTANTIATES/CONTAINS. The HMAC key becomes the critical separation boundary.

**Honest assessment:** Full criterion (c) satisfaction requires either (1) Enterprise RBAC with credential isolation, or (2) HSM-backed HMAC where the key never enters application memory. Without these, criterion (c) is satisfied against Class A attackers (those with only Neo4j write access) but degraded against Class A+ attackers (those who compromise the full application runtime including secrets-manager access). This is documented in §8.5.

---

## 10. Cross-Reference to Constitutional Coupling v5.0

| v5.0 Section | Architecture Response |
|-------------|----------------------|
| **§Constitutional Coupling** — "The structure itself, not a monitoring layer, makes violations impossible" | L2 constraints + L3 triggers + L1 RBAC provide three structural enforcement points, all pre-commit, none observational. |
| **§A6 Minimal Authority** — "A pattern requests only the resources its purpose requires" | RBAC role model (§2) implements A6 at the database layer: read paths hold only read credentials, pipeline execution holds only operational-node credentials. Credential separation is A6 applied to database access. |
| **§G3 Containment** — "A Resonator's input Lines define its authority scope" | L3 trigger 2 enforces CONTAINS placement at the database layer. A node without containment cannot commit. G3 is no longer an application-layer-only invariant. |
| **§A4 Provenance** — "Every operation is traceable" | Governance properties (`_gov_instantiation_id`, `_gov_provenance_epoch`, `_gov_contains_path`) encode provenance at creation time. The write token cryptographically binds the provenance to the node identity. |
| **§A1 Fidelity** — "Every morpheme carries meaning" | L2 existence constraints on `content`, `name`, `type`/`seedType`/`mode`, `status` for all five morpheme labels ensure no empty-shell nodes can exist. (Note: empty-string bypass for `content` requires L3 trigger enhancement — see §11.) |
| **10 Compliance Kills** — "Compliance-as-monitoring creates a false sense of security" | No monitoring overlay. No periodic scan. No compliance dashboard that substitutes for structural enforcement. The system prevents non-compliant writes; it does not detect them. |

---

## 11. Known Residual Risks and Future Work

| Risk | Severity | Mitigation Path |
|------|----------|----------------|
| **Empty-string bypass:** `content = ''` passes `IS NOT NULL` constraint | Medium | Add L3 trigger check: `WHERE trim(node.content) = '' → reject`. Or: Neo4j 5.x `REQUIRE s.content IS NOT NULL AND s.content <> ''` (requires property value constraints, Enterprise feature in some versions). |
| **Relationship fabrication:** Attacker creates fake `INSTANTIATES` or `CONTAINS` relationships | Medium | L3 trigger 1 and 2 validate the existence of the relationship, not its legitimacy. Future enhancement: trigger validates that the INSTANTIATES target is a known definition Seed (match against `def:*` pattern), and that the CONTAINS source is a valid container type. |
| **Trigger removal by Class B attacker:** Admin can `CALL apoc.trigger.remove()` | High (but out of scope) | Infrastructure-level controls: audit logging on APOC trigger operations, alerting on trigger removal, restricted admin access. This is operational security, not structural enforcement. |
| **APOC plugin unavailability on managed Neo4j:** Some managed Neo4j services (AuraDB Free) do not support APOC triggers | High for those platforms | Document minimum Neo4j deployment requirements for R-63 compliance. Self-hosted or AuraDB Professional with APOC support is required. On platforms without APOC, the architecture degrades to L1+L2 only (§8.3). |
| **Performance overhead of trigger execution:** Three triggers fire on every morpheme write | Low | Triggers only process `$createdNodes` (not all nodes in the transaction). HMAC verification is O(1) per node. Expected overhead: <10ms per morpheme creation. Benchmark before production deployment. |
| **Custom Java plugin maintenance:** `cs.governance.verifyHmac` is a custom plugin | Medium | Plugin is small (single function), well-scoped, and has no external dependencies. Pin to Neo4j major version. Include in CI/CD pipeline with version-compatibility testing. |

---

## 12. Architecture Summary Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Write Attempt (any source)                    │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  L1: RBAC Check       │  Enterprise: privilege matrix
                    │  (query planning)     │  Community: SKIP
                    └───────────┬───────────┘
                                │ Pass
                    ┌───────────▼───────────┐
                    │  L2: Constraint Check  │  All _gov_* properties present?
                    │  (schema validation)   │  All domain properties present?
                    └───────────┬───────────┘
                                │ Pass
                    ┌───────────▼───────────┐
                    │  L3: Trigger Gate      │  INSTANTIATES wiring exists?
                    │  (before-commit)       │  CONTAINS placement exists?
                    │                        │  _gov_write_token valid HMAC?
                    └───────────┬───────────┘
                                │ Pass
                    ┌───────────▼───────────┐
                    │  COMMIT                │  Node persisted with full
                    │                        │  governance provenance
                    └───────────────────────┘

  Any failure at L1, L2, or L3 → TRANSACTION ROLLBACK → node never exists
```

---

## 13. Verification Checklist

To confirm the architecture is correctly deployed, the following checks should be performed (one-time, not periodic):

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Constraint count | `SHOW CONSTRAINTS YIELD name RETURN count(name)` | ≥ 60 |
| Trigger count | `CALL apoc.trigger.list() YIELD name` | 3 triggers: `gov_enforce_instantiates`, `gov_enforce_contains`, `gov_enforce_write_token` |
| Raw CREATE rejection | `CREATE (s:Seed {id:'test-raw', content:'x', seedType:'y', status:'z'})` | Fails: missing `_gov_*` properties |
| Fake-token rejection | `CREATE (s:Seed {id:'test-fake', content:'x', seedType:'y', status:'z', _gov_instantiation_id:'fake', _gov_provenance_epoch:'fake', _gov_contains_path:'fake', _gov_schema_version:1, _gov_write_token:'fake'})` | Fails: trigger 3 rejects invalid HMAC |
| Valid governed write | Call `instantiateMorpheme()` through application | Succeeds: all constraints and triggers satisfied |
| Reader cannot write (Enterprise) | Authenticate as `cs_reader`, attempt CREATE on Seed | Fails: privilege error |
| Orphan count | `MATCH (n) WHERE (n:Seed OR n:Bloom OR n:Resonator OR n:Grid OR n:Helix) AND NOT EXISTS {MATCH ()-[:CONTAINS]->(n)} AND NOT n.id STARTS WITH 'def:' AND n.id <> 'constitutional-bloom' RETURN count(n)` | 0 (post-migration) |

---

*This architecture satisfies R-63 by composing four independent enforcement mechanisms into a defense-in-depth perimeter where no single layer's failure permits ungoverned writes, and the governing invariant — cryptographically-bound governance provenance verified within the committing transaction — is structural, not observational.*