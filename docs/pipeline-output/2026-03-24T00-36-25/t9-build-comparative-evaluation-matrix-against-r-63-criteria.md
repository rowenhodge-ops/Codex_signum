# Build comparative evaluation matrix against R-63 criteria

> Task ID: t9
> Model: claude-opus-4-5:extended:32k
> Duration: 180942ms
> Output chars: 25093
> Timestamp: 2026-03-24T01:21:55.044Z

> **⚠️ Hallucination flags (1):**
> - [content/warning] References eliminated entity "monitoring overlay"

---

# R-63 Comparative Evaluation Matrix: Design Options Analysis

**Document:** R-63 Evaluation Matrix
**Task:** t9
**Status:** Analysis complete — Architect review required
**References:** t1 (Threat Model), t2 (Enforcement Audit), t3 (Capabilities Survey), t4-t8 (Design Options A-E), cs-v5.0.md

---

## Executive Summary

This evaluation assesses five design options against R-63's three mandatory criteria and five secondary criteria. **No single option satisfies all mandatory criteria in isolation.** However, two options (D and E) provide genuine database-layer enforcement, and strategic composition of A+B+D yields the strongest defense architecture. Option C (hash chains) fails the structural enforcement criterion and should be rejected as a standalone approach.

---

## 1. Evaluation Matrix

### 1.1 Primary Evaluation Grid

| Criterion | Option A | Option B | Option C | Option D | Option E |
|-----------|:--------:|:--------:|:--------:|:--------:|:--------:|
| **(a) Structural enforcement not detection** | ⚠️ PARTIAL | ⚠️ PARTIAL | ❌ FAIL | ✅ PASS | ✅ PASS |
| **(b) No monitoring overlay** | ✅ PASS | ✅ PASS | ❌ FAIL | ⚠️ PARTIAL | ✅ PASS |
| **(c) Works when application layer compromised** | ❌ FAIL | ⚠️ PARTIAL | ❌ FAIL | ✅ PASS* | ⚠️ PARTIAL |
| **Mandatory Criteria Summary** | 1/3 | 1/3 | 0/3 | 2.5/3 | 2/3 |
| **(d) Neo4j Edition** | Community | Community | Community | Community† | Enterprise |
| **(e) Performance overhead** | Low | Low | High | Moderate | Low |
| **(f) Operational complexity** | Low | High | Very High | Moderate | Moderate |
| **(g) Defense-in-depth composability** | High | High | Low | High | Moderate |
| **(h) Recovery from breach** | Simple | Moderate | Complex | Simple | Simple |
| **Standalone Viability** | ❌ No | ❌ No | ❌ No | ⚠️ Conditional | ⚠️ Conditional |

*Legend:* ✅ = Pass | ⚠️ = Partial/Conditional | ❌ = Fail

*\* Option D passes criterion (c) against Class A attackers (Neo4j write access) but not Class B (admin access)*
*† APOC triggers require APOC plugin but work on Community Edition*

---

## 2. Detailed Criterion Assessments

### 2.1 Criterion (a): Structural Enforcement Not Detection

**Definition:** The mechanism must *prevent* ungoverned writes from committing, not *detect* them after the fact.

| Option | Rating | Justification |
|--------|--------|---------------|
| **A: Constraints** | ⚠️ PARTIAL | Property existence constraints ARE structural enforcement—the transaction fails pre-commit if properties are missing. However, the "fake value attack" (t4 §5.1) undermines this: an attacker can supply arbitrary garbage values for `_gov_*` properties. The constraint enforces *presence*, not *validity*. Structural but incomplete. |
| **B: Crypto Tokens** | ⚠️ PARTIAL | The database constraint enforces token presence; the cryptographic binding *intends* to ensure validity. But validity verification requires either: (1) application-layer check (fails if app compromised), or (2) trigger-based verification (then B becomes B+D). As standalone, B provides no mechanism to reject invalid tokens at database layer. |
| **C: Hash Chains** | ❌ FAIL | Hash chains create a *structural invariant* (the chain itself) but do NOT prevent injection. An ungoverned node is simply absent from the chain; it still exists in the graph. The chain enables *detection by traversal comparison*, which is the definition of monitoring. The t6 analysis explicitly acknowledges this: "the chain doesn't prevent injection." |
| **D: APOC Triggers** | ✅ PASS | Triggers execute *within* the transaction lifecycle, *before* commit. A trigger that calls `apoc.util.validate()` forces transaction rollback. This is enforcement, not detection—the ungoverned write never commits. The mechanism is active (code executes) rather than declarative (constraint checked), but the effect is structural: the transaction boundary is the enforcement boundary. |
| **E: RBAC** | ✅ PASS | Privilege checks occur at query planning time, before execution. A user without `CREATE` privilege on a label cannot create nodes with that label—the query fails with a privilege error. This is definitionally structural: the database's security model IS the enforcement mechanism. No code executes; the privilege matrix simply does not permit the operation. |

**Summary:** Only D and E provide genuine structural enforcement. A and B enforce presence but not validity. C is detection masquerading as structure.

---

### 2.2 Criterion (b): No Monitoring Overlay

**Definition:** The mechanism must not require a separate monitoring process, periodic scan, or compliance-as-observation pattern.

| Option | Rating | Justification |
|--------|--------|---------------|
| **A: Constraints** | ✅ PASS | Constraints are part of the database schema. They are evaluated inline during write transactions. No separate process, no polling, no scan. |
| **B: Crypto Tokens** | ✅ PASS | The constraint portion is identical to A. The token generation is part of the write path, not a monitoring overlay. However, if token *verification* requires a background process (e.g., periodic scan for invalid tokens), this would fail. As specified in t5, verification is intended to be inline or trigger-based. |
| **C: Hash Chains** | ❌ FAIL | Hash chains require *traversal verification* to detect ungoverned nodes—walking the chain and comparing against actual graph state. This is definitionally a monitoring pattern. The t6 analysis proposes verification Resonators that perform periodic or query-triggered chain walks. This IS the compliance-as-monitoring anti-pattern. |
| **D: APOC Triggers** | ⚠️ PARTIAL | Triggers execute transactionally, not as a polling process. They are not a "monitoring overlay" in the periodic-scan sense. However, they ARE an "overlay" in the architectural sense: they are code layered on top of the database's native constraint system. The R-63 spec is ambiguous on whether transactional enforcement code counts as "overlay." Conservative interpretation: PARTIAL. Liberal interpretation: PASS. |
| **E: RBAC** | ✅ PASS | RBAC is part of Neo4j's native security model. Privilege evaluation is inline with query planning. No separate process, no overlay. |

**Summary:** A, B, and E clearly pass. C clearly fails. D is architecturally borderline—triggers are inline enforcement but are additional code rather than declarative schema.

---

### 2.3 Criterion (c): Works When Application Layer Compromised

**Definition:** The mechanism must hold even if the attacker has full control of the application code and all secrets/credentials the application can access.

| Option | Rating | Justification |
|--------|--------|---------------|
| **A: Constraints** | ❌ FAIL | A compromised application can issue raw Cypher with fake governance properties. The constraint is satisfied; the governance intent is defeated. The "fake value attack" requires only that the attacker knows the property names, which are discoverable from the schema. |
| **B: Crypto Tokens** | ⚠️ PARTIAL | If the HMAC key is stored in application memory or accessible via the application's secret management, a compromised app can compute valid tokens. **HSM-backed keys** (key never leaves hardware) would change this to PASS—the app can request signatures but cannot extract the key. Standard deployment (env var, secrets manager the app can call): FAIL. HSM deployment: PASS. Rating reflects typical deployment. |
| **C: Hash Chains** | ❌ FAIL | A compromised application can: (1) read the current chain head, (2) compute valid hashes using the same algorithm, (3) append nodes to the chain with valid provenance. The chain provides no defense against an attacker with the app's capabilities—the attacker IS the governance layer from the database's perspective. |
| **D: APOC Triggers** | ✅ PASS* | Against **Class A attackers** (Neo4j write access, not admin), triggers provide robust defense. The attacker cannot: modify trigger code, disable triggers, or bypass trigger execution. Their raw Cypher is intercepted and rejected. Against **Class B attackers** (admin access), triggers can be disabled via `apoc.trigger.remove()`. The rating assumes Class A threat model per t1 scope. |
| **E: RBAC** | ⚠️ PARTIAL | If the application's database credentials have the `cs_governed_writer` role (necessary for the app to create governed nodes), those credentials are exfiltrable when the app is compromised. The attacker inherits the app's privileges. **Credential separation architecture** (app uses reader role; writer role fetched per-write from HSM/vault with separate auth the attacker doesn't have) would change this to PASS but adds significant operational complexity. |

**Summary:** D is the only option that provides robust defense against Class A attackers without requiring special infrastructure (HSM, credential separation). B and E can achieve PASS with specific deployment architectures. A and C fundamentally fail.

---

### 2.4 Secondary Criteria Assessment

#### (d) Neo4j Edition Requirements

| Option | Requirement | Impact |
|--------|-------------|--------|
| **A** | Community | Property existence constraints available in all editions |
| **B** | Community | Constraints + HMAC computation (application-side) |
| **C** | Community | Hash computation is application-side; no special DB features |
| **D** | Community + APOC | APOC triggers work on Community; some APOC features need Enterprise |
| **E** | **Enterprise** | Fine-grained RBAC (label-level privileges) requires Enterprise Edition |

**Impact Assessment:** Option E has the highest barrier—Enterprise licensing is significant cost and operational commitment. Options A-D are viable for Community deployments.

#### (e) Performance Overhead

| Option | Overhead | Analysis |
|--------|----------|----------|
| **A** | Low | Property existence checks are O(1), highly optimized in Neo4j core |
| **B** | Low-Moderate | HMAC computation adds ~1-5ms per write; constraint check is O(1) |
| **C** | High | Chain append requires: read chain head, compute hash, write with contention. Single-chain topology serializes all writes. Per-Bloom chains reduce contention but increase verification complexity. |
| **D** | Moderate | Trigger Cypher executes within transaction; adds pattern matching overhead. Well-indexed triggers: ~5-20ms. Poorly designed triggers can cause significant latency. |
| **E** | Low | Privilege checks are part of query planning, highly optimized |

**Impact Assessment:** Option C's performance characteristics are problematic at scale. The serialization bottleneck for chain append fundamentally conflicts with concurrent governance operations.

#### (f) Operational Complexity

| Option | Complexity | Analysis |
|--------|------------|----------|
| **A** | Low | Deploy constraints via schema migration; no ongoing management |
| **B** | High | Key management lifecycle: generation, rotation, revocation, multi-version verification. Requires secrets infrastructure (Vault, HSM). Key compromise requires mass re-tokenization. |
| **C** | Very High | Chain initialization, topology decisions (global vs. per-Bloom), genesis nodes, verification Resonators, chain repair procedures, orphan reconciliation. The t6 analysis shows 6+ distinct operational procedures. |
| **D** | Moderate | Trigger deployment via schema migration. Testing requires transaction-level validation. Debugging trigger failures requires access to transaction metadata. |
| **E** | Moderate | Role design, user assignment, credential distribution. Requires operational discipline around credential separation to achieve (c). |

#### (g) Defense-in-Depth Composability

| Option | Composability | Analysis |
|--------|---------------|----------|
| **A** | High | Constraints compose with ANY other option; they are the foundation layer |
| **B** | High | Tokens are orthogonal to constraints, triggers, and RBAC; can layer freely |
| **C** | Low | Hash chains create their own verification requirement that doesn't integrate cleanly with other mechanisms; adds complexity without reinforcing other defenses |
| **D** | High | Triggers can VERIFY anything that other options CREATE (token validity, chain membership, property semantics); excellent as verification layer |
| **E** | Moderate | RBAC is access-tier focused; composes at network boundary but doesn't reinforce property-level or relationship-level invariants |

#### (h) Recovery From Breach

| Option | Recovery | Analysis |
|--------|----------|----------|
| **A** | Simple | Identify nodes missing/invalid governance properties; backfill or quarantine |
| **B** | Moderate | If key compromised: rotate key, identify tokens signed with old key, re-tokenize or quarantine. Multi-version verification simplifies ongoing operation but complicates breach response. |
| **C** | Complex | If chain corrupted: identify divergence point, rebuild chain from divergence, reconcile orphans, verify entire history. Chain repair is O(n) in chain length. |
| **D** | Simple | Triggers don't hold state; replace trigger code if compromised. Injected nodes (if trigger was bypassed via admin) identifiable by missing governance wiring. |
| **E** | Simple | Revoke compromised credentials; issue new credentials to governance layer. No data-level recovery needed—breach was access-tier. |

---

## 3. Mandatory Criteria Summary

| Option | (a) Structural | (b) No Overlay | (c) App Compromised | **Verdict** |
|--------|:--------------:|:--------------:|:-------------------:|-------------|
| **A** | ⚠️ | ✅ | ❌ | **FAIL** — fake value attack defeats enforcement |
| **B** | ⚠️ | ✅ | ⚠️ | **FAIL** — requires HSM for (c); verification gap for (a) |
| **C** | ❌ | ❌ | ❌ | **FAIL** — detection, not enforcement |
| **D** | ✅ | ⚠️ | ✅* | **CONDITIONAL PASS** — triggers are arguably overlay; passes (c) for Class A |
| **E** | ✅ | ✅ | ⚠️ | **CONDITIONAL PASS** — requires credential separation for (c) |

**Options that fail mandatory criteria outright:** A (standalone), B (standalone), C

**Options that fail mandatory criteria without composition:** A, B, C

**Options viable for further consideration:** D, E, and A+B in composition

---

## 4. Composition Analysis

### 4.1 Reinforcing Pairs

| Composition | Reinforcement Effect | Addresses Weaknesses |
|-------------|---------------------|----------------------|
| **A + B** | Constraints enforce presence; tokens ensure presence is meaningful | A's fake-value attack requires valid token (but B's verification gap remains) |
| **A + D** | Constraints enforce presence; triggers verify relational invariants (INSTANTIATES, CONTAINS) | A cannot enforce relationships; D can. Strong composition. |
| **B + D** | Tokens provide cryptographic binding; triggers verify token validity at DB layer | Closes B's verification gap—trigger rejects invalid tokens pre-commit |
| **A + E** | Constraints enforce property completeness; RBAC restricts who can write | Different failure modes—attacker needs both valid credentials AND valid properties |
| **D + E** | Triggers validate what is written; RBAC validates who can write | Strongest access+content enforcement; layered defense |
| **A + B + D** | Full stack: presence → cryptographic binding → relational+token verification | Most complete defense; addresses all identified weaknesses |

### 4.2 Non-Reinforcing Pairs

| Composition | Why Non-Reinforcing |
|-------------|---------------------|
| **A + C** | C's detection doesn't prevent what A's gaps allow |
| **B + C** | C adds verification overhead without strengthening B's token mechanism |
| **C + D** | D can verify chain membership, but this is redundant—D already verifies governance invariants directly |
| **C + E** | C adds nothing RBAC doesn't already provide via access control |

### 4.3 Composition Viability Assessment

| Composition | All Mandatory Criteria? | Edition Requirement | Complexity |
|-------------|:-----------------------:|:-------------------:|:----------:|
| **D alone** | ✅ (Class A only) | Community + APOC | Moderate |
| **E alone** | ⚠️ (needs credential separation) | Enterprise | Moderate |
| **A + D** | ✅ (Class A only) | Community + APOC | Moderate |
| **A + B + D** | ✅ (Class A), ⚠️ (Class B needs HSM) | Community + APOC | High |
| **D + E** | ✅ (Class A), ✅ (Class B with credential separation) | Enterprise | High |
| **A + B + D + E** | ✅ (full defense-in-depth) | Enterprise | Very High |

---

## 5. Standalone vs. Composition-Required Classification

### 5.1 Standalone Viability

| Option | Standalone Viable? | Reason |
|--------|:------------------:|--------|
| **A** | ❌ No | Fake value attack defeats enforcement; cannot verify relational invariants |
| **B** | ❌ No | No mechanism to verify token validity at DB layer; key exfiltration risk |
| **C** | ❌ No | Detection, not enforcement; fundamentally fails (a) and (b) |
| **D** | ⚠️ Conditional | Viable against Class A attackers; fails against Class B (admin) |
| **E** | ⚠️ Conditional | Viable with credential separation architecture; fails with standard deployment |

### 5.2 Composition-Required Assessment

| Option | Role in Composition | Value Contribution |
|--------|--------------------|--------------------|
| **A** | Foundation layer | Property presence guarantee; enables B and D to assume baseline structure |
| **B** | Cryptographic binding layer | Transforms fake-value attack from trivial to key-exfiltration-required |
| **C** | **Not recommended** | Adds complexity and monitoring burden without reinforcing enforcement |
| **D** | Verification/enforcement layer | Only mechanism that can verify relational invariants at DB layer |
| **E** | Access tier layer | Restricts attack surface to credential holders; orthogonal to content validation |

---

## 6. Recommended Architectures for Phase 3

Based on the evaluation, three viable architectures emerge:

### Architecture 1: Minimal Viable Defense (Community Edition)

**Composition:** A + D

```
┌─────────────────────────────────────────────────┐
│  WRITE TRANSACTION                              │
│                                                 │
│  ┌──────────────────┐    ┌──────────────────┐  │
│  │ Property         │───▶│ APOC Trigger     │  │
│  │ Constraints (A)  │    │ Enforcement (D)  │  │
│  │                  │    │                  │  │
│  │ • _gov_* present │    │ • INSTANTIATES?  │  │
│  │ • Required props │    │ • CONTAINS?      │  │
│  │                  │    │ • Grammar valid? │  │
│  └──────────────────┘    └──────────────────┘  │
│         │                        │              │
│         ▼                        ▼              │
│    FAIL: missing          FAIL: governance     │
│    properties             violation            │
└─────────────────────────────────────────────────┘
```

**Criteria satisfaction:**
- (a) ✅ — Triggers enforce relational invariants
- (b) ⚠️ — Triggers are inline but architecturally "code"
- (c) ✅ — Against Class A; FAIL against Class B

**Recommended for:** Development environments, Community Edition deployments, teams without Enterprise licensing.

**Limitations:** No defense against Neo4j admin compromise; triggers are code that must be maintained.

---

### Architecture 2: Cryptographic Binding (Community Edition + HSM)

**Composition:** A + B + D

```
┌───────────────────────────────────────────────────────────────┐
│  GOVERNANCE LAYER                                             │
│  ┌─────────────────┐                                          │
│  │ HSM / Key Vault │◀─── HMAC signing request                 │
│  └────────┬────────┘                                          │
│           │ signed token                                      │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ WRITE TRANSACTION                                       │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌───────────────┐  │  │
│  │  │ Constraints │──▶│ Trigger:    │──▶│ Trigger:      │  │  │
│  │  │ (A)         │   │ Token       │   │ Governance    │  │  │
│  │  │             │   │ Verify (B+D)│   │ Invariants(D) │  │  │
│  │  └─────────────┘   └─────────────┘   └───────────────┘  │  │
│  │        │                  │                  │          │  │
│  │        ▼                  ▼                  ▼          │  │
│  │   FAIL: missing     FAIL: invalid      FAIL: missing   │  │
│  │   properties        token              INSTANTIATES    │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

**Criteria satisfaction:**
- (a) ✅ — Triggers verify token validity AND relational invariants
- (b) ⚠️ — Triggers are inline but architecturally "code"
- (c) ✅ — With HSM, key cannot be exfiltrated; valid tokens require HSM access

**Recommended for:** Production deployments requiring defense against application compromise; organizations with existing HSM/secrets infrastructure.

**Limitations:** Higher operational complexity; HSM integration required for full (c) satisfaction.

---

### Architecture 3: Full Defense-in-Depth (Enterprise Edition)

**Composition:** A + B + D + E

```
┌─────────────────────────────────────────────────────────────────────┐
│  ACCESS TIER (E - RBAC)                                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ cs_reader: DENY CREATE on Seed, Bloom, Resonator, Grid, Helix│    │
│  │ cs_governed_writer: GRANT CREATE (held by governance layer) │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                      │
│                              ▼ (only governed_writer passes)        │
│  CONTENT VALIDATION TIER (A + B + D)                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ [Constraints A] → [Token Verify B+D] → [Invariants D]       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                      │
│                              ▼                                      │
│  COMMIT                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

**Criteria satisfaction:**
- (a) ✅ — RBAC + constraints + triggers provide layered structural enforcement
- (b) ✅ — RBAC and constraints are declarative; triggers are inline
- (c) ✅ — Attacker needs: governed_writer credentials + valid tokens + pass trigger checks

**Recommended for:** High-security deployments; regulated environments; production systems where breach has significant consequences.

**Deployment requirements:**
- Neo4j Enterprise Edition
- APOC plugin
- HSM or equivalent for token signing
- Credential separation (governance layer uses separate credential flow)

---

## 7. Recommendations Summary

### Immediate Actions for Phase 3

1. **Reject Option C (Hash Chains) as standalone or primary mechanism.** It fails structural enforcement and adds monitoring overhead without proportionate benefit.

2. **Implement Architecture 1 (A + D) as minimum baseline.** This provides genuine enforcement at the database layer using Community Edition features.

3. **Evaluate HSM availability for Architecture 2.** If HSM or cloud secrets manager with signing capability is available, Architecture 2 provides stronger defense against application compromise.

4. **Assess Enterprise Edition feasibility for Architecture 3.** If licensing is viable and threat model warrants it, Architecture 3 provides the most complete defense.

### Implementation Priority Order

| Priority | Component | Rationale |
|----------|-----------|-----------|
| **P0** | Property existence constraints (A) | Foundation layer; no dependencies; immediate value |
| **P1** | APOC trigger for INSTANTIATES/CONTAINS (D) | Closes the relational invariant gap that constraints cannot address |
| **P2** | Cryptographic write tokens (B) | Transforms fake-value attack; valuable if HSM available |
| **P3** | RBAC label restrictions (E) | Access tier defense; requires Enterprise + credential separation |

### What NOT to Do

- **Do not implement hash chains as primary enforcement.** They are detection, not enforcement.
- **Do not rely on Option A alone.** Fake value attack defeats standalone constraints.
- **Do not assume RBAC solves (c) without credential separation.** If the app has governed_writer credentials, compromise exfiltrates them.

---

## Appendix: Decision Matrix Quick Reference

| If your constraints are... | Recommended Architecture |
|---------------------------|-------------------------|
| Community Edition, no HSM, Class A threat model | **A + D** |
| Community Edition, HSM available, Class A threat model | **A + B + D** |
| Enterprise Edition, credential separation possible | **A + B + D + E** |
| Need to support Class B (admin compromise) | None of these options; requires infrastructure-level controls |