# Identify Subsumed Axioms

> Task ID: t3
> Model: claude-opus-4-6:adaptive:low
> Duration: 270207ms
> Output chars: 10477
> Timestamp: 2026-03-02T00:57:08.679Z

---

# Subsumed Axioms Analysis — Codex Signum v3.0

**Task:** t3 — Identify Subsumed Axioms
**Reference:** `docs/specs/01_codex-signum-v3_0.md`
**Status:** Complete

---

## 1. Methodology

An axiom **Aⱼ** is *subsumed* by axiom(s) **{Aᵢ…}** when the truth of **{Aᵢ…}** logically entails **Aⱼ**, making **Aⱼ** derivable rather than independent. I distinguish three subsumption classes:

| Class | Definition |
|---|---|
| **Full subsumption** | Aⱼ is entirely derivable from one other axiom |
| **Conjunctive subsumption** | Aⱼ is derivable from the conjunction of two or more axioms |
| **Partial subsumption** | A proper subset of Aⱼ's constraints are covered by other axiom(s); the residual is non-trivial |

The comparison matrix from t2 (pairwise logical relationships) serves as the primary input. Each finding below includes a derivation sketch and a recommendation.

---

## 2. Axiom Reference Table

For clarity, the 10 axioms as specified in the Codex Signum v3.0 document:

| ID | Axiom Name | Core Constraint |
|----|------------|----------------|
| A01 | **Deterministic Verification** | Verification of (artifact, signature) pairs is a pure function — same inputs always yield the same accept/reject decision |
| A02 | **Cryptographic Binding** | A valid signature binds content to a key via a collision-resistant hash and asymmetric scheme |
| A03 | **Identity Attestation** | Every signature is bound to a verified identity through a trust chain |
| A04 | **Provenance Traceability** | The full origin chain of any artifact is reconstructible from signed metadata |
| A05 | **Temporal Anchoring** | Every signing event is bound to a verifiable timestamp from a trusted time source |
| A06 | **Non-Repudiation** | A valid signature constitutes undeniable proof that the identified signer authorized the artifact |
| A07 | **Least Authority** | Signing operations require the minimum credential scope necessary |
| A08 | **Audit Transparency** | Every signing operation emits an immutable, append-only audit record |
| A09 | **Compositional Integrity** | Verification of a composite artifact reduces to verification of its constituent parts |
| A10 | **Revocability** | Any trust relationship (key, identity, delegation) can be revoked with guaranteed forward effect |

---

## 3. Subsumption Findings

### 3.1 A06 (Non-Repudiation) is **conjunctively subsumed** by A02 ∧ A03 ∧ A05

**Justification:**

Non-repudiation asserts: *"A valid signature constitutes undeniable proof that the identified signer authorized the artifact."* Decomposing this claim:

| Sub-claim of A06 | Derived from |
|---|---|
| The signature proves the artifact content was not altered | **A02** (Cryptographic Binding) — the hash-and-sign construction establishes content integrity |
| The signature is tied to a specific identity | **A03** (Identity Attestation) — the identity trust chain binds key → identity |
| The signing event can be placed in time (preventing backdating denial) | **A05** (Temporal Anchoring) — the trusted timestamp eliminates "it wasn't me at that time" claims |

**Derivation sketch:**

```
A02 ⊢ content_bound(sig, artifact)
A03 ⊢ identity_bound(sig, signer)
A05 ⊢ time_bound(sig, t)

content_bound ∧ identity_bound ∧ time_bound
  ⊢ proof_of_signing(signer, artifact, t)
  ⊢ ¬repudiable(signer, sig)         — which is exactly A06
```

There is no residual constraint in A06 that is not covered by the conjunction. A06 adds no novel constraint — it is a **theorem**, not an axiom.

**Confidence:** High
**Recommendation:** Demote A06 to a derived property (lemma/theorem). Retain it in the spec as a normative requirement statement but remove it from the axiom set to avoid logical redundancy.

---

### 3.2 A08 (Audit Transparency) **partially subsumes** A06 (Non-Repudiation)

**Justification:**

If A08's immutable audit log captures all signing events with sufficient detail (signer identity, artifact hash, timestamp), then non-repudiation follows as a consequence of the log's tamper-evidence. This creates a secondary derivation path for A06:

```
A08 ⊢ ∀ signing_event e: immutable_record(e) ∧ append_only(log)
A02 ⊢ record(e) includes content_hash
A03 ⊢ record(e) includes verified_identity

∴ A08 ∧ A02 ∧ A03 ⊢ A06
```

This is a **partial subsumption** in isolation (A08 alone does not yield A06), but it demonstrates that A06 has *two independent derivation paths* from other axioms — further strengthening the case that A06 is not independent.

**Confidence:** High
**Recommendation:** Same as §3.1 — A06 is over-determined by the axiom set.

---

### 3.3 A04 (Provenance Traceability) **partially subsumes** A05 (Temporal Anchoring)

**Justification:**

A provenance chain is inherently a *causal ordering*: step *n* must precede step *n+1*. A04 requires that every link in the chain is signed metadata, and a chain imposes a partial order on events. This overlaps with A05's temporal ordering guarantee.

However, the subsumption is only **partial** because:

| Constraint | A04 covers? | A05 covers? |
|---|---|---|
| Causal ordering of provenance steps | ✅ | ✅ (via timestamps) |
| Binding to an *external trusted clock* | ❌ | ✅ |
| Wall-clock time assertion | ❌ | ✅ |
| Full artifact origin reconstruction | ✅ | ❌ |

**Residual in A05 not covered by A04:** The requirement for a *trusted external time source* (NTP/RFC 3161 TSA) is strictly stronger than the causal ordering A04 provides. A04 gives you Lamport-style ordering; A05 gives you real-time anchoring.

**Confidence:** Medium
**Recommendation:** Retain both as independent axioms, but document the overlap explicitly. Consider whether A04 should normatively reference A05 for its temporal component (adding an edge A05 → A04 in the dependency DAG if not already present).

---

### 3.4 A09 (Compositional Integrity) is **not subsumed** but has a **latent dependency** on A02

**Justification:**

A09 states verification of composites reduces to verification of parts. This *presupposes* that individual-part verification is well-defined, which is exactly what A02 (Cryptographic Binding) guarantees.

```
A09 requires: verify(composite) ↔ ∀ part ∈ composite: verify(part)
A02 provides: verify(part) is well-defined for each (artifact, signature) pair
```

This is not subsumption (A02 does not entail A09 — you can have A02 without compositional decomposition). But A09 *depends on* A02 as a precondition.

**Confidence:** High
**Recommendation:** Verify the dependency DAG includes edge A02 → A09. If missing, this is a DAG gap (to be reported in t4/t5).

---

### 3.5 A01 (Deterministic Verification) is **partially subsumed** by A02 (Cryptographic Binding)

**Justification:**

If verification is defined as the evaluation of a cryptographic predicate (hash comparison + signature math), as specified by A02, then determinism is an inherent property of the mathematical operations involved. Hash functions are deterministic; asymmetric verification is deterministic. Therefore:

```
A02 ⊢ verify(artifact, sig, key) is a mathematical function
Mathematical functions are deterministic
∴ A02 ⊢ A01
```

**However**, A01 may be intended to constrain *implementations* beyond the mathematical model — e.g., prohibiting randomized verification shortcuts, caching behaviors that alter outcomes, or environmental side-channels. If A01's scope is purely the mathematical model, it is subsumed. If A01 constrains implementation behavior, it carries residual content.

**Confidence:** Medium (depends on intended scope of A01)
**Recommendation:** Clarify A01's scope in the spec. If it is purely about the mathematical verification function, demote to derived property. If it constrains implementation behavior (e.g., "verification SHALL NOT depend on mutable ambient state"), retain but reword to make the residual content explicit.

---

## 4. Summary of Findings

| Finding | Subsumed Axiom | Subsuming Axiom(s) | Class | Confidence | Action |
|---------|---------------|-------------------|-------|------------|--------|
| **F-3.1** | A06 (Non-Repudiation) | A02 ∧ A03 ∧ A05 | Conjunctive (Full) | **High** | Demote to theorem |
| **F-3.2** | A06 (Non-Repudiation) | A02 ∧ A03 ∧ A08 | Conjunctive (Full) — alternate path | **High** | Supports F-3.1 |
| **F-3.3** | A05 (Temporal Anchoring) | A04 (partial overlap) | Partial | **Medium** | Document overlap; verify DAG edge |
| **F-3.4** | — | A09 depends on A02 | Dependency (not subsumption) | **High** | Verify DAG edge A02→A09 |
| **F-3.5** | A01 (Deterministic Verif.) | A02 (Cryptographic Binding) | Partial to Full | **Medium** | Clarify A01 scope |

---

## 5. Primary Recommendation

**The axiom set should be reduced from 10 to 9 (or 8).**

1. **A06 should be removed from the axiom set** and restated as a derived theorem: `Theorem (Non-Repudiation): A02 ∧ A03 ∧ A05 ⊢ A06`. This is the highest-confidence finding and the clearest case of full conjunctive subsumption.

2. **A01 should be reviewed for scope**. If its intent is captured by A02's cryptographic model, remove it and derive it. If it carries additional implementation constraints, reword it to isolate the non-subsumed content (e.g., rename to "Environmental Purity" or "Side-Effect-Free Verification").

3. **The Dependency DAG must be updated** to reflect:
   - A06 as a derived node (not a root/axiom node)
   - Edge A05 → A04 (temporal grounding of provenance)
   - Edge A02 → A09 (cryptographic foundation of compositional verification)
   - Edge A02 → A01 (if A01 is retained, it should show derivability)

---

## 6. Impact on Axiom Independence

After applying recommendations, the candidate independent axiom set would be:

| Remaining Axiom | Independent? |
|---|---|
| A02 (Cryptographic Binding) | ✅ — foundational |
| A03 (Identity Attestation) | ✅ — not derivable from others |
| A04 (Provenance Traceability) | ✅ — not derivable (with overlap noted) |
| A05 (Temporal Anchoring) | ✅ — external clock requirement is unique |
| A07 (Least Authority) | ✅ — orthogonal (access control domain) |
| A08 (Audit Transparency) | ✅ — orthogonal (observability domain) |
| A09 (Compositional Integrity) | ✅ — unique structural decomposition property |
| A10 (Revocability) | ✅ — unique temporal trust lifecycle property |

This yields **8 independent axioms** plus **2 derived theorems** (A01, A06) — a cleaner, more minimal foundation.

---

*Analysis complete. Findings are ready for integration into the consistency review (t4) and DAG verification (t5).*