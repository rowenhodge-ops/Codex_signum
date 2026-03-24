# Design Option E — Neo4j RBAC with label-restricted write roles

> Task ID: t8
> Model: claude-opus-4-5:extended:8k
> Duration: 159191ms
> Output chars: 30680
> Timestamp: 2026-03-24T01:18:43.271Z

> **⚠️ Hallucination flags (2):**
> - [content/warning] References eliminated entity "monitoring overlay"
> - [content/warning] Task t8 references "docs/NEO4J_CONNECTION.md" but this file was not in its context

---

# Design Option E — Neo4j RBAC with Label-Restricted Write Roles

**Document:** R-63 Design Option E Analysis
**Task:** t8
**Status:** Design analysis — Architect review required
**References:** cs-v5.0.md (Constitutional Coupling, A6 Minimal Authority), t1 (Threat Model), t2 (Enforcement Audit), t3 (Capabilities Survey), t4-t7 (Options A-D)

---

## 1. Core Concept

Neo4j Enterprise Edition provides fine-grained Role-Based Access Control (RBAC) that can restrict which database users may create nodes with specific labels. By creating a `governed_writer` role that holds exclusive `CREATE` privileges on morpheme labels (Seed, Bloom, Resonator, Grid, Helix), and ensuring all other access uses a `reader` role without these privileges, the database itself becomes the enforcement boundary.

**The structural thesis:** If only one set of credentials can create morpheme nodes, and those credentials are held exclusively by the governance layer, then raw Cypher access using other credentials cannot inject ungoverned nodes — the `CREATE` statement fails with a privilege error at the database layer, before commit, regardless of whether the application layer is involved.

**The central question this document must answer honestly:** The credential-holder is the governance layer. If the application layer is compromised, are the governed_writer credentials exfiltrable? If so, the RBAC boundary collapses to the same level as the application boundary. This analysis must quantify the exfiltration risk and evaluate whether RBAC provides defense-in-depth even if it does not provide defense-in-isolation.

---

## 2. Neo4j 5.x Fine-Grained RBAC Architecture

### 2.1 Privilege Hierarchy

Neo4j 5.x security operates on a hierarchy:

```
DBMS Privileges (server-wide)
  └── Database Privileges (per database)
        └── Graph Privileges (labels, relationship types, properties)
```

**Graph-level privileges** are the mechanism for label-restricted writes. These include:

| Privilege | Scope | Effect |
|---|---|---|
| `CREATE` | Label(s) | Permission to create nodes with specified labels |
| `DELETE` | Label(s) | Permission to delete nodes with specified labels |
| `SET LABEL` | Label(s) | Permission to add labels to existing nodes |
| `REMOVE LABEL` | Label(s) | Permission to remove labels from existing nodes |
| `SET PROPERTY` | Property(s) on label(s) | Permission to set/modify specific properties |
| `MERGE` | Label(s) | Combines CREATE and MATCH privileges |
| `MATCH` | Label(s) | Permission to read nodes with specified labels |
| `TRAVERSE` | Relationship type(s) | Permission to traverse relationships |

**Key insight:** A role with `MATCH` but not `CREATE` on a label can read nodes of that label but cannot create them. This is the foundation of the Option E scheme.

### 2.2 GRANT/DENY Semantics

Neo4j uses a "most specific wins, DENY beats GRANT at same specificity" model:

1. Privileges accumulate across all roles assigned to a user
2. More specific grants override less specific ones
3. At the same specificity level, DENY takes precedence over GRANT
4. Privileges are evaluated at query planning time (pre-execution)

**Critical implication:** If a user has multiple roles and any role has DENY on a privilege, the user cannot exercise that privilege. This affects multi-role architectures (see §4).

---

## 3. Role Definitions — Cypher GRANT/DENY Specification

### 3.1 Role: `cs_reader`

The read-only role for all non-governance database access. This role is used by:
- Direct Cypher access (Neo4j Browser, cypher-shell, ad-hoc queries)
- Application read paths that do not require writes
- Reporting and analytics queries
- Development/debugging sessions

```cypher
-- Create the reader role
CREATE ROLE cs_reader IF NOT EXISTS;

-- Grant read access to all labels (morpheme and non-morpheme)
GRANT MATCH {*}
  ON GRAPH codex_signum
  TO cs_reader;

-- Grant traverse on all relationships
GRANT TRAVERSE
  ON GRAPH codex_signum
  TO cs_reader;

-- Grant read on all properties
GRANT READ {*}
  ON GRAPH codex_signum
  TO cs_reader;

-- Explicitly DENY all write operations on morpheme labels
DENY CREATE
  ON GRAPH codex_signum
  NODES Seed, Bloom, Resonator, Grid, Helix
  TO cs_reader;

DENY DELETE
  ON GRAPH codex_signum
  NODES Seed, Bloom, Resonator, Grid, Helix
  TO cs_reader;

DENY SET LABEL Seed, Bloom, Resonator, Grid, Helix
  ON GRAPH codex_signum
  TO cs_reader;

DENY REMOVE LABEL Seed, Bloom, Resonator, Grid, Helix
  ON GRAPH codex_signum
  TO cs_reader;

DENY SET PROPERTY {*}
  ON GRAPH codex_signum
  NODES Seed, Bloom, Resonator, Grid, Helix
  TO cs_reader;

-- Allow writes to non-morpheme labels (session state, temp nodes, etc.)
-- Omit explicit GRANT — inherits from default deny
```

### 3.2 Role: `cs_governed_writer`

The write role held exclusively by the governance layer (Instantiation Resonator, Mutation Resonator, pipeline execution). This role is the **sole holder of CREATE privileges** on morpheme labels.

```cypher
-- Create the governed writer role
CREATE ROLE cs_governed_writer IF NOT EXISTS;

-- Grant full CRUD on morpheme labels
GRANT CREATE
  ON GRAPH codex_signum
  NODES Seed, Bloom, Resonator, Grid, Helix
  TO cs_governed_writer;

GRANT DELETE
  ON GRAPH codex_signum
  NODES Seed, Bloom, Resonator, Grid, Helix
  TO cs_governed_writer;

GRANT SET LABEL Seed, Bloom, Resonator, Grid, Helix
  ON GRAPH codex_signum
  TO cs_governed_writer;

GRANT REMOVE LABEL Seed, Bloom, Resonator, Grid, Helix
  ON GRAPH codex_signum
  TO cs_governed_writer;

GRANT SET PROPERTY {*}
  ON GRAPH codex_signum
  NODES Seed, Bloom, Resonator, Grid, Helix
  TO cs_governed_writer;

-- Grant full CRUD on relationship types
GRANT CREATE
  ON GRAPH codex_signum
  RELATIONSHIPS *
  TO cs_governed_writer;

GRANT DELETE
  ON GRAPH codex_signum
  RELATIONSHIPS *
  TO cs_governed_writer;

GRANT SET PROPERTY {*}
  ON GRAPH codex_signum
  RELATIONSHIPS *
  TO cs_governed_writer;

-- Grant read access (inherited behavior, explicit for clarity)
GRANT MATCH {*}
  ON GRAPH codex_signum
  TO cs_governed_writer;

GRANT TRAVERSE
  ON GRAPH codex_signum
  TO cs_governed_writer;

GRANT READ {*}
  ON GRAPH codex_signum
  TO cs_governed_writer;
```

### 3.3 Role: `cs_admin`

Administrative role for schema operations, user management, and emergency access. This role should be held by human administrators, not application processes.

```cypher
-- Create the admin role
CREATE ROLE cs_admin IF NOT EXISTS;

-- Grant full database administration
GRANT ALL DATABASE PRIVILEGES
  ON DATABASE codex_signum
  TO cs_admin;

-- Grant graph-level administration
GRANT ALL GRAPH PRIVILEGES
  ON GRAPH codex_signum
  TO cs_admin;

-- Grant constraint and index management
GRANT CONSTRAINT MANAGEMENT
  ON DATABASE codex_signum
  TO cs_admin;

GRANT INDEX MANAGEMENT
  ON DATABASE codex_signum
  TO cs_admin;
```

### 3.4 User-Role Bindings

```cypher
-- Create database users
CREATE USER cs_app_reader SET PASSWORD $reader_password SET PASSWORD CHANGE NOT REQUIRED;
CREATE USER cs_app_governed SET PASSWORD $governed_password SET PASSWORD CHANGE NOT REQUIRED;
CREATE USER cs_dba SET PASSWORD $admin_password SET PASSWORD CHANGE NOT REQUIRED;

-- Assign roles
GRANT ROLE cs_reader TO cs_app_reader;
GRANT ROLE cs_governed_writer TO cs_app_governed;
GRANT ROLE cs_admin TO cs_dba;

-- Revoke PUBLIC role's default privileges if present
REVOKE ROLE PUBLIC FROM cs_app_reader, cs_app_governed, cs_dba;
```

---

## 4. Role Separation Analysis

### 4.1 Can the Same User Have Multiple Roles?

**Yes.** Neo4j allows a single user to hold multiple roles. Privileges accumulate across roles with DENY taking precedence at equal specificity.

**Scenario analysis:**

| User Configuration | Effective Privilege on Morpheme CREATE | Assessment |
|---|---|---|
| User has only `cs_reader` | DENY (explicit) | ✓ Cannot create morphemes |
| User has only `cs_governed_writer` | GRANT | ✓ Can create morphemes |
| User has both `cs_reader` AND `cs_governed_writer` | **DENY wins** | ⚠️ DANGER — cannot create morphemes! |

**Critical finding:** If the governance layer's user is assigned both roles (accidentally or through misconfiguration), the DENY from `cs_reader` blocks the GRANT from `cs_governed_writer`. This is **not** an additive permission model.

**Mitigation:** The `cs_app_governed` user must be assigned **only** `cs_governed_writer`. Never assign `cs_reader` to the governed user. If read access is needed (it is — governance queries read before writing), the governed_writer role must include its own read grants (as specified in §3.2).

### 4.2 Role Inheritance Complexity

Neo4j does not support role inheritance in 5.x. Each role is independent. This simplifies the analysis but requires explicit privilege grants on each role.

### 4.3 Multi-User Application Architecture

The current `src/graph/client.ts` uses a single connection pool with one set of credentials. Implementing RBAC requires **architectural modification**:

**Current state (from client.ts):**
```typescript
// Single driver instance, single credential set
let _driver: Driver | null = null;
// getDriver() uses NEO4J_USER and NEO4J_PASSWORD from env
```

**Required state:**
```typescript
// Two driver instances with different credentials
let _readerDriver: Driver | null = null;  // cs_app_reader credentials
let _writerDriver: Driver | null = null;  // cs_app_governed credentials

// Governance layer uses _writerDriver exclusively
// All other code uses _readerDriver
```

**Implication:** The `runQuery()`, `writeTransaction()`, and `readTransaction()` helpers must be split or parameterized by credential context. This is a non-trivial refactor of the graph client layer.

---

## 5. Credential Isolation Architecture

### 5.1 Credential Separation Requirements

For RBAC to provide structural enforcement, the `cs_app_governed` credentials must be **unavailable** to any code path except the governance layer. If any compromised code can read the governed credentials, RBAC collapses.

**Credential isolation strategies:**

| Strategy | Isolation Level | Implementation Complexity | Codex Signum Fit |
|---|---|---|---|
| **A: Separate environment variables** | Low — same process address space | Low | Insufficient — `process.env` dump exposes both |
| **B: Separate secrets in cloud manager** | Moderate — requires separate API calls | Moderate | Partial — both secrets fetchable if app has manager access |
| **C: Separate service accounts with IAM scoping** | Higher — different IAM principals | High | Better — app components run as different principals |
| **D: Separate microservices** | High — network boundary | High | Strongest — governance is a distinct service with its own credentials |
| **E: Governance proxy with credential encapsulation** | High — API boundary | Moderate-High | Viable — governance exposes API, holds credentials internally |

### 5.2 Recommended Architecture: Governance Service Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                           │
│  (Pipeline orchestration, user-facing code, DevAgent, etc.)     │
│                                                                 │
│  Credentials: NEO4J_READER_USER / NEO4J_READER_PASSWORD         │
│  Neo4j Role: cs_reader                                          │
│  Capability: READ-ONLY on all data                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ (HTTP/gRPC — not raw Neo4j)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Governance Service                            │
│  (Instantiation Resonator, Mutation Resonator, Line Resonator)  │
│                                                                 │
│  Credentials: NEO4J_GOVERNED_USER / NEO4J_GOVERNED_PASSWORD     │
│  Neo4j Role: cs_governed_writer                                 │
│  Capability: FULL CRUD on morpheme labels                       │
│                                                                 │
│  Runs as: Separate process / container / Lambda function        │
│  Credential source: Dedicated secrets manager path, IAM-scoped  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ (bolt+s:// with governed credentials)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      Neo4j Enterprise                            │
│  RBAC enforcement: cs_governed_writer is ONLY role with         │
│  CREATE on Seed, Bloom, Resonator, Grid, Helix                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key property:** The application layer **never holds** the governed credentials. It calls the Governance Service via an API (HTTP, gRPC, message queue). The Governance Service validates the request, applies governance logic, and then — and only then — executes the governed write using its isolated credentials.

### 5.3 Credential Storage Recommendation

| Environment | Reader Credentials | Governed Credentials |
|---|---|---|
| **Development** | Local `.env.reader` file | Local `.env.governed` file (separate) — developer workstation |
| **CI/CD** | GitHub Secrets (scoped to test jobs) | GitHub Secrets (scoped to deployment jobs only) |
| **Production** | Cloud Secrets Manager (path: `/codex/neo4j/reader`) | Cloud Secrets Manager (path: `/codex/neo4j/governed`) with IAM policy restricting access to Governance Service's execution role only |

---

## 6. Application Layer Compromise Analysis — Criterion (c)

**Criterion (c) from R-63:** "Works when the application layer is compromised."

This section analyzes whether Option E satisfies this criterion. The analysis distinguishes between **compromise scenarios** based on what the attacker has access to after compromising the application layer.

### 6.1 Compromise Scenario Matrix

| Scenario | Attacker Capability | RBAC Effect | Criterion (c) Satisfied? |
|---|---|---|---|
| **C1: Code execution in application process (reader credentials only)** | Can execute arbitrary code, read process memory, make Neo4j queries via reader driver | All morpheme CREATE attempts fail with privilege error at database layer | **YES** — RBAC structurally blocks injection |
| **C2: Code execution in application process + environment variable access** | Same as C1, plus can read `NEO4J_READER_*` env vars | Same as C1 — only reader credentials accessible | **YES** — governed credentials not in this process |
| **C3: Code execution in Governance Service process** | Can execute arbitrary code in governance service, read its memory | Can read governed credentials from process memory → can issue any governed write | **NO** — credential exfiltration possible |
| **C4: Secrets manager access (IAM escalation)** | Can call secrets manager API with escalated permissions | Can fetch governed credentials from secrets manager | **NO** — credential exfiltration possible |
| **C5: Network interception between app and governance service** | MITM on internal API calls | Can craft fake governance requests → governance service executes governed writes | **Partial** — depends on governance service authentication |

### 6.2 Honest Assessment: RBAC Alone Does Not Satisfy Criterion (c) Fully

**Finding:** RBAC provides structural enforcement against **Scenario C1 and C2** — the most common application compromise scenarios where an attacker gains code execution in the main application but does not escalate to the governance service or secrets manager.

**Finding:** RBAC **fails** against **Scenario C3 and C4**. If the attacker compromises the Governance Service itself or escalates to fetch its credentials, they obtain full morpheme write capability. At that point, RBAC provides no additional protection over the current single-credential architecture.

**Quantifying the improvement:**

| Architecture | Attack Surface for Governed Writes |
|---|---|
| **Current (single credential)** | Any code execution in application process |
| **RBAC with service isolation** | Code execution in Governance Service process OR IAM escalation to secrets manager |

RBAC **narrows the attack surface** from "any application code" to "specific governance code + specific IAM path". This is defense-in-depth, not defense-in-isolation.

### 6.3 Residual Risk: Credential Exfiltration

**Primary exfiltration vectors:**

1. **Memory dump of Governance Service process** — governed password in driver connection state
2. **Secrets manager API call** — if attacker can assume the governance service's IAM role
3. **Log leakage** — governed credentials accidentally logged during connection errors
4. **Configuration file exposure** — if credentials are in filesystem rather than secrets manager
5. **Container image inspection** — if credentials baked into image layers

**Mitigation for each:**

| Vector | Mitigation |
|---|---|
| Memory dump | Short-lived credentials (if Neo4j supports), memory encryption, crash dump sanitization |
| Secrets manager API | IAM policy with condition keys (source IP, VPC endpoint, time-of-day), secret access logging |
| Log leakage | Credential scrubbing in log pipeline, never log connection strings |
| Config file | Never store in filesystem — use secrets manager with runtime fetch |
| Container image | Runtime secrets injection, never build-time credentials |

---

## 7. Defense-in-Depth: Combining RBAC with Options A-D

RBAC's value increases significantly when combined with other options. The combination creates **multiple independent failure requirements** — an attacker must defeat all layers, not just one.

### 7.1 RBAC + Option A (Property Existence Constraints)

| Layer | What It Enforces | Bypass Requirement |
|---|---|---|
| RBAC | Only governed_writer role can CREATE morphemes | Exfiltrate governed credentials |
| Option A | Created nodes must have `_gov_*` properties | Know valid property values |

**Combined effect:** Even if the attacker exfiltrates governed credentials, they must also produce valid governance properties. The property existence constraint doesn't check property *values*, only presence, so this combination is weak against fake-value attacks. However, it does ensure that any injected node is structurally marked as requiring governance validation (has the `_gov_*` properties, even if fake).

**Assessment: Additive but not multiplicative.** Option A adds nuisance, not structural barrier, once RBAC is breached.

### 7.2 RBAC + Option B (Cryptographic Write Tokens)

| Layer | What It Enforces | Bypass Requirement |
|---|---|---|
| RBAC | Only governed_writer role can CREATE morphemes | Exfiltrate governed credentials |
| Option B | Created nodes must have valid `_write_token` | Exfiltrate HMAC secret key |

**Combined effect:** The attacker must exfiltrate **both** the Neo4j governed credentials **and** the HMAC secret key. If these are stored in different secrets (different secrets manager paths, different IAM access policies), the attack surface is genuinely multiplied.

**Assessment: Strong combination.** Two independent secrets, two independent exfiltration paths. If the HMAC key is in an HSM (per Option B recommendation), exfiltration is impossible — attacker could authenticate to Neo4j but cannot produce valid tokens.

**Recommended pairing:** RBAC + Option B with HSM-backed HMAC key.

### 7.3 RBAC + Option C (Hash Chains)

| Layer | What It Enforces | Bypass Requirement |
|---|---|---|
| RBAC | Only governed_writer role can CREATE morphemes | Exfiltrate governed credentials |
| Option C | Created nodes must link into provenance chain | Know current chain head hash |

**Combined effect:** If the attacker exfiltrates governed credentials but the hash chain is maintained correctly, injected nodes will either (a) have no chain linkage (detectable) or (b) require the attacker to also query the current chain head and compute a valid hash.

**Assessment: Weaker combination.** Once the attacker has governed credentials, they can query the chain head (read is permitted). Hash chain verification is detection, not prevention — it identifies orphaned nodes after the fact but does not block the initial CREATE. This combination doesn't multiply the barrier; it adds post-hoc auditability.

### 7.4 RBAC + Option D (APOC Triggers)

| Layer | What It Enforces | Bypass Requirement |
|---|---|---|
| RBAC | Only governed_writer role can CREATE morphemes | Exfiltrate governed credentials |
| Option D | Created nodes must pass INSTANTIATES/CONTAINS/property checks | Create required relationships in same transaction |

**Combined effect:** Even with governed credentials, the attacker's CREATE statement must satisfy the trigger invariants. They must create the morpheme node AND the INSTANTIATES relationship AND the CONTAINS relationship in a single transaction, or the trigger rejects.

**Assessment: Strong combination.** The trigger is oblivious to credentials — it checks structural invariants. An attacker with credentials but without knowledge of valid definition Seed IDs and valid container Bloom IDs cannot satisfy the trigger. This creates an **information barrier** in addition to the credential barrier.

**Caveat:** If the attacker can query the graph (they can — governed role has MATCH), they can discover valid definition IDs and container IDs. The trigger's effectiveness depends on the invariant checks being correct and comprehensive.

### 7.5 Recommended Defense-in-Depth Stack

**Tier 1 (Essential):**
- RBAC with credential isolation (Option E)
- Property existence constraints (Option A baseline — R-39 already implemented)

**Tier 2 (Strong):**
- APOC triggers enforcing INSTANTIATES + CONTAINS invariants (Option D)

**Tier 3 (Maximum):**
- Cryptographic write tokens with HSM-backed key (Option B)

**Rationale:** Tier 1 establishes the credential boundary. Tier 2 adds invariant enforcement that does not depend on additional secrets. Tier 3 adds a cryptographic barrier with key material that can be HSM-isolated, providing genuine defense against credential exfiltration.

---

## 8. Enterprise Edition Requirement

### 8.1 Feature Availability

| Feature | Community Edition | Enterprise Edition | AuraDB Professional | AuraDB Enterprise |
|---|---|---|---|---|
| Basic authentication | ✓ | ✓ | ✓ | ✓ |
| Native user management | ✓ | ✓ | ✓ | ✓ |
| Role-based access control | ✗ | ✓ | ✓ | ✓ |
| Fine-grained privileges (label-level) | ✗ | ✓ | ✗ | ✓ |
| Property-level privileges | ✗ | ✓ | ✗ | ✓ |
| DENY privileges | ✗ | ✓ | ✗ | ✓ |
| Subgraph access control | ✗ | ✓ | ✗ | ✓ |

**Conclusion:** Option E requires **Neo4j Enterprise Edition** or **AuraDB Enterprise**. It cannot be implemented on Community Edition or AuraDB Professional.

### 8.2 AuraDB Considerations

The current Codex Signum deployment uses AuraDB (per `src/graph/client.ts` connection handling and `docs/NEO4J_CONNECTION.md` references). AuraDB tier requirements:

| AuraDB Tier | Fine-Grained RBAC | Monthly Cost (Approximate) |
|---|---|---|
| AuraDB Free | ✗ | $0 |
| AuraDB Professional | ✗ | $65+ |
| AuraDB Enterprise | ✓ | Custom pricing (contact sales) |

**Implication:** Implementing Option E requires upgrading from AuraDB Free/Professional to AuraDB Enterprise, which involves a commercial agreement with Neo4j.

### 8.3 Self-Hosted Alternative

Neo4j Enterprise Edition can be self-hosted. License options:

| License | RBAC Included | Typical Use Case |
|---|---|---|
| Enterprise Subscription | ✓ | Production commercial use |
| Startup Program | ✓ | Qualifying startups (free or reduced cost) |
| Academic License | ✓ | Research and education |

**Self-hosting tradeoffs:**
- Infrastructure management overhead
- HA/clustering configuration responsibility  
- Backup/disaster recovery responsibility
- But: Full control over security configuration, no vendor dependency for RBAC

---

## 9. Admin Tool Access Model

### 9.1 Neo4j Browser

Neo4j Browser is the primary GUI tool for ad-hoc queries and database exploration. Access model under RBAC:

| User | Role | Browser Capabilities |
|---|---|---|
| Developer using `cs_app_reader` credentials | cs_reader | Full query capability, visual exploration. **Cannot** create/modify morpheme nodes — all write attempts fail with privilege error. |
| DBA using `cs_dba` credentials | cs_admin | Full capability including schema modification, user management. Can create morphemes (inherits all privileges). |
| Attacker with exfiltrated reader credentials | cs_reader | Same as developer — cannot inject morphemes. |

**Browser-specific considerations:**
- Browser connects with user-provided credentials at login
- Browser does not have access to governed credentials unless user enters them
- Recommendation: Do not store governed credentials in Browser's saved connections

### 9.2 cypher-shell

cypher-shell is the CLI tool for scripted and batch operations. Same RBAC enforcement applies:

```bash
# Reader access — can query, cannot write morphemes
cypher-shell -u cs_app_reader -p $READER_PASSWORD \
  -a neo4j+s://xxx.databases.neo4j.io \
  "CREATE (s:Seed {id: 'injected'}) RETURN s"
# Result: Neo.ClientError.Security.Forbidden

# Governed access — can write morphemes (if credentials are provided)
cypher-shell -u cs_app_governed -p $GOVERNED_PASSWORD \
  -a neo4j+s://xxx.databases.neo4j.io \
  "CREATE (s:Seed {id: 'governed'}) RETURN s"
# Result: Success (if other constraints are satisfied)
```

**Operational recommendation:** cypher-shell scripts for data operations should use reader credentials. Migration and governance scripts run by authorized processes may use governed credentials with explicit justification.

### 9.3 Neo4j Desktop

Neo4j Desktop (local development environment) typically connects to local or remote databases. RBAC enforcement is identical — the local tool has no bypass capability.

### 9.4 APOC and Other Plugins

APOC procedures execute with the privileges of the calling user. An APOC call from a reader session cannot escalate to governed_writer privileges.

**Specific concern:** `apoc.cypher.runFile()` and similar dynamic Cypher execution procedures. These execute with caller privileges, not elevated privileges. RBAC is preserved.

---

## 10. Summary: RBAC Assessment Against R-63 Criteria

| Criterion | Assessment | Evidence |
|---|---|---|
| **(a) Structural enforcement, not detection** | **SATISFIED** | RBAC denies the CREATE operation at privilege-check time, before any write occurs. This is enforcement — the transaction fails, the node is not created. Not monitoring. |
| **(b) No monitoring overlay** | **SATISFIED** | RBAC is evaluated as part of the query planner, not as a separate monitoring process. There is no scanner, no poller, no observer. The enforcement is inline in the transaction path. |
| **(c) Works when application layer is compromised** | **PARTIAL** | Works when application layer is compromised but governance service is not. Fails if attacker escalates to governance service or exfiltrates governed credentials. Defense-in-depth, not absolute isolation. |

**Honest conclusion:** Option E is the strongest single-mechanism option for R-63 because it provides **database-layer enforcement** without requiring triggers (which can be disabled) or cryptographic secrets (which can be exfiltrated from the same layer that holds the Neo4j credentials). Its weakness is that it shifts the trust boundary, not eliminates it — the new boundary is the Governance Service process and the governed credential storage. Combining Option E with Option B (cryptographic tokens) or Option D (APOC triggers) creates a genuinely defense-in-depth architecture where multiple independent barriers must fall for injection to succeed.

---

## 11. Recommendations

### 11.1 Adoption Decision

**If Codex Signum operates on AuraDB Enterprise or self-hosted Enterprise:** Implement Option E as the foundational perimeter defense. Layer Option D (APOC triggers) for invariant enforcement and Option B (write tokens) for cryptographic binding.

**If Codex Signum remains on AuraDB Free/Professional:** Option E is not available. Prioritize Option D (APOC triggers) + Option A (extended property constraints) + Option B (write tokens). Accept that the enforcement layer operates with application-layer privilege access.

### 11.2 Implementation Sequence

1. **Negotiate AuraDB Enterprise or deploy self-hosted Enterprise**
2. **Create RBAC roles** (cs_reader, cs_governed_writer, cs_admin) per §3
3. **Refactor `src/graph/client.ts`** to maintain separate driver pools for reader and governed connections
4. **Extract Governance Service** to a separate deployment unit with isolated credential access
5. **Configure IAM policies** to restrict governed credential access to Governance Service execution role only
6. **Verify enforcement** — attempt morpheme CREATE with reader credentials, confirm privilege error
7. **Layer Option D triggers** for invariant enforcement within governed writes
8. **Layer Option B tokens** with HSM-backed key for cryptographic defense-in-depth

### 11.3 Credential Management Checklist

- [ ] Governed credentials stored in dedicated secrets manager path
- [ ] IAM policy restricts access to Governance Service role only
- [ ] Reader credentials available to application components
- [ ] No process holds both credential sets simultaneously
- [ ] Credential rotation procedure documented and tested
- [ ] Secret access logging enabled for governed credentials
- [ ] Break-glass procedure documented for emergency admin access

---

## Appendix: Quick Reference — Cypher RBAC Commands

```cypher
-- Show current user and roles
SHOW CURRENT USER;
SHOW ROLES;
SHOW USERS;

-- Show privileges for a role
SHOW ROLE cs_reader PRIVILEGES;
SHOW ROLE cs_governed_writer PRIVILEGES;

-- Test privilege (without executing)
-- (Neo4j 5.x does not have explicit "test privilege" — attempt and observe error)

-- Revoke a privilege
REVOKE CREATE ON GRAPH codex_signum NODES Seed FROM cs_reader;

-- Drop a role (caution!)
DROP ROLE cs_reader;

-- Verify label-level privileges are effective
SHOW PRIVILEGES
  YIELD role, access, action, resource, segment
  WHERE segment CONTAINS 'NODE' AND resource CONTAINS 'Seed';
```

---

**Document Status:** Design analysis complete. Requires Architect review for:
1. AuraDB Enterprise upgrade decision
2. Governance Service isolation architecture approval
3. Defense-in-depth stack selection (E alone vs E+D vs E+D+B)