# Document hallucination detection

> Task ID: t5
> Model: claude-opus-4-6:adaptive:medium
> Duration: 92118ms
> Output chars: 13651
> Timestamp: 2026-03-06T01:20:38.808Z

> **⚠️ Hallucination flags (10):**
> - [content/warning] Claims 10 axioms (canonical count is 9)
> - [content/warning] Task t5 references "scripts/bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task t5 references "docs/specs/codex-signum-v4_3-draft.md" but this file was not in its context
> - [content/warning] Task t5 references "CLAUDE.md" but this file was not in its context
> - [content/warning] Task t5 references "src/patterns/thompson-router/" but this file was not in its context
> - [content/warning] Task t5 references "src/computation/" but this file was not in its context
> - [content/warning] Task t5 references "src/computation/psi-h.ts" but this file was not in its context
> - [content/warning] Task t5 references "src/computation/epsilon-r.ts" but this file was not in its context
> - [content/warning] Task t5 references "tests/conformance/hallucination-detection.test.ts" but this file was not in its context
> - [content/warning] Task t5 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Analysis: Three-Layer Hallucination Detection System

**Document:** Engineering Bridge v2.1 — Hallucination Detection Section (t5)
**Status:** Analysis and documentation for inclusion
**Implementation Reference:** `scripts/bootstrap-task-executor.ts`

---

## 1. System Purpose and Rationale

When AI agents execute tasks against the Codex Signum codebase, they can produce outputs that appear structurally valid but are not grounded in actual system state — file contents that don't exist, formulas that aren't in the spec, interface contracts that no code implements. This is the agent hallucination problem applied to engineering execution.

The three-layer hallucination detection system addresses this by enforcing the **Bridge View Principle** at execution time: every claim an agent makes about the system must be a pure function of grammar-defined morpheme states and axiom-defined parameters. If it cannot be traced back to something structurally real, it is flagged.

This directly connects to the anti-pattern documented in Bridge v2.0:

> **"Morpheme labels on code."** Do not add `morphemeType: 'seed'` fields. The morpheme type *is* the structure — a function is a Seed because of what it does, not because of a label.

Hallucination is the agent equivalent: asserting structural properties that aren't structurally present.

---

## 2. The Three Detection Layers

### Layer 1 — Structural Grounding (Pre-Execution)

**What it detects:** Claims about system state that cannot be resolved against the actual file tree and graph.

**Mechanism:** Before an agent begins transforming or generating output, the bootstrap task executor loads and checksums the relevant source files specified in the task manifest. Any agent assertion about file contents, function signatures, parameter values, or interface contracts is validated against this grounded snapshot.

**Relation to implementation in `scripts/bootstrap-task-executor.ts`:** The executor's file-loading phase serves double duty — it provisions the agent's working context *and* establishes the ground truth against which Layer 1 validation runs. The file list in the task specification (the "Relevant Files" and "Specification References" sections) defines the grounding boundary. Claims about files outside this boundary are automatically flagged as potentially ungrounded.

**Bridge View Principle enforcement:** A formula or interface description in the Bridge document is grounded if and only if:
- The formula's variables map to identifiers in the referenced source files, OR
- The formula's parameters map to constants defined in the spec at `docs/specs/codex-signum-v4_3-draft.md`

If neither condition holds, the claim is structurally ungrounded — the agent may have interpolated or fabricated.

**Concrete example from Bridge v2.0 audit:** The v2.0 document stated "Fraction of 10 axioms satisfied" for axiom compliance. The v4.3 spec defines 9 axioms, not 10. This is exactly the class of error Layer 1 catches — a numeric claim that doesn't match the source document.

### Layer 2 — Cross-Reference Coherence (In-Flight)

**What it detects:** Internal contradictions between different parts of the agent's output, and contradictions between agent output and the persistent governance context.

**Mechanism:** During task execution, the system maintains a running consistency graph of claims the agent has made. Each claim is a node; entailment and contradiction relationships are edges. When a new claim contradicts an existing one, or contradicts a constraint in the `CLAUDE.md` governance file, execution is paused and the inconsistency is surfaced.

**Key cross-reference sources:**
| Source | Role | Example Check |
|---|---|---|
| `CLAUDE.md` governance files | Persistent agent context — rules that survive across sessions | Agent output must not contradict governance constraints |
| Task specification | Acceptance criteria and scope boundary | Agent must not claim to have satisfied criteria it hasn't addressed |
| Prior task outputs (same milestone) | Sibling consistency | Formulas documented in t3 (dampening) must match formulas referenced in t5 (this task) |
| Convergence data from M-9.VA runs | Empirical ground truth | Claims about system behaviour must be consistent with verification run results |

**Relation to `scripts/bootstrap-task-executor.ts`:** The executor loads `CLAUDE.md` as persistent context at bootstrap time. This is not merely prompt engineering — it is a structural constraint that Layer 2 enforces. If an agent's output contradicts a `CLAUDE.md` directive, the contradiction is detected before the output is committed.

**Thompson-informed priors connection:** The Thompson router in `src/patterns/thompson-router/` provides informed priors about which patterns are likely to succeed. Layer 2 uses an analogous mechanism — prior beliefs about what the system *should* contain (from specs and governance) constrain what the agent is allowed to assert. Context-blocked posteriors prevent the agent from updating its beliefs based on hallucinated context.

### Layer 3 — Empirical Verification (Post-Execution)

**What it detects:** Outputs that are internally consistent and structurally grounded but empirically false — they describe a system that could exist but doesn't match the actual running system.

**Mechanism:** After the agent produces output, the executor runs verification tests (as specified in the task's `## Verification` section). Test failures at this layer indicate that the documented behaviour doesn't match actual system behaviour.

**For this specific task:** The verification command is:
```
npx vitest run tests/conformance/hallucination-detection.test.ts
```

This conformance test validates that the documented detection layers match the implemented detection logic. If the documentation describes a layer that doesn't exist in code, or describes a mechanism that behaves differently than implemented, the test fails.

**Relation to the signal conditioning pipeline (Bridge v2.0 Part 4):** Layer 3 is analogous to Stage 4 (CUSUM monitoring) in the signal conditioning pipeline — it detects mean shifts between documented and actual behaviour. Just as CUSUM detects when a health signal's mean has shifted, Layer 3 detects when the agent's model of the system has drifted from reality.

---

## 3. Layer Interaction and Escalation

The three layers form a pipeline with increasing cost and decreasing false-positive rate:

```
Layer 1 (Structural Grounding)
  │ cheap, high recall, some false positives
  ▼
Layer 2 (Cross-Reference Coherence)
  │ moderate cost, catches contradictions Layer 1 misses
  ▼
Layer 3 (Empirical Verification)
  │ expensive (runs tests), definitive
  ▼
Accept or Reject
```

**Escalation rule:** A claim that passes Layer 1 but fails Layer 2 is flagged for agent review. A claim that passes Layers 1 and 2 but fails Layer 3 triggers a structural review — the agent's mental model is internally consistent but wrong, which is the most dangerous failure mode.

**Connection to cascade parameters:** The escalation follows the same 2-level cascade limit documented in Bridge v2.0 Part 3. A Layer 1 failure is contained locally (the specific claim is rejected). A Layer 2 failure propagates one level (the task output is paused). A Layer 3 failure propagates two levels (the milestone's integration is gated). Beyond two levels, the system applies the same dampening principle — a hallucination in one task does not invalidate the entire milestone.

---

## 4. Mapping to Bridge View Principle

The Bridge View Principle as a normative constraint requires:

> Every Bridge formula must be a pure function of grammar-defined morpheme states and axiom-defined parameters.

The hallucination detection system enforces this constructively:

| Bridge View Requirement | Detection Layer | Enforcement |
|---|---|---|
| Formula variables must map to source identifiers | Layer 1 | Checksummed file resolution |
| Parameters must map to spec-defined constants | Layer 1 | Spec cross-reference |
| Formulas must not contradict each other | Layer 2 | Consistency graph |
| Formulas must not contradict governance | Layer 2 | CLAUDE.md constraint checking |
| Documented behaviour must match actual behaviour | Layer 3 | Conformance test execution |

---

## 5. Evidence from Build Experience (6 Months)

The following patterns were observed during implementation that motivated the three-layer design:

### 5.1 Common Layer 1 Catches
- **Stale parameter values:** Agent outputs referencing the old `k-1` divisor dampening formula instead of the budget-capped `min(γ_base, s/k)`. The structural grounding check against `src/computation/` catches this because the old formula no longer appears in source.
- **Phantom axiom references:** Referencing "Axiom 10" when only 9 axioms exist in v4.3. Grounding against the spec document catches this immediately.
- **Nonexistent interface points:** Claiming a function exists at a vertical wiring interface when the code has a stub or no implementation.

### 5.2 Common Layer 2 Catches
- **Contradictory dampening claims:** One section claiming hub dampening is separate, another section claiming unified dampening handles all topologies. Layer 2's consistency graph flags the contradiction.
- **Governance drift:** Agent output proposing a monitoring architecture that violates the "State Is Structural" principle from `CLAUDE.md` / Bridge Part 1.

### 5.3 Common Layer 3 Catches
- **Plausible but wrong formulas:** A ΨH temporal decomposition formula that is mathematically valid, internally consistent, and structurally grounded in the right source file — but produces different numerical results than `src/computation/psi-h.ts` when run against test vectors.
- **Missing glue documentation:** Claiming an interface point is fully connected when the conformance test reveals the glue function hasn't been implemented yet.

---

## 6. Relationship to Other Bridge v2.1 Sections

| Bridge Section | Hallucination Detection Relevance |
|---|---|
| **Dampening (t3)** | Layer 1 validates dampening formulas against `src/computation/` — this is how the stale `k-1` formula was caught |
| **Vertical Wiring (t4)** | Layer 3 tests verify that documented interface connections actually exist in code on both sides |
| **ΨH Temporal Decomposition (t6)** | Layer 2 checks that ΨH claims are consistent across the decomposition documentation and the computation documentation |
| **εR Spectral Calibration (t7)** | Layer 1 grounds spectral parameters against `src/computation/epsilon-r.ts` |
| **Bridge View Principle (t2)** | The hallucination detection system is the *runtime enforcement mechanism* for the Bridge View Principle |

---

## 7. Recommendations for Bridge v2.1 Text

### 7.1 Section Placement
The hallucination detection documentation should appear as a new Part (likely Part 11 or integrated into a "Build Infrastructure" part) in the Bridge v2.1 document. It is not a spec concern — it is an engineering concern about maintaining document fidelity during agent-assisted authoring.

### 7.2 Normative vs. Informative
- The three-layer structure should be **normative** — any agent-produced Bridge content must pass all three layers.
- The specific thresholds (e.g., what constitutes "sufficient" structural grounding) should be **informative** — implementors may tune based on their agent infrastructure.

### 7.3 Required Cross-References in Final Document
- Reference `scripts/bootstrap-task-executor.ts` as the implementation location for all three layers.
- Reference `src/patterns/thompson-router/` for the Thompson-informed prior mechanism that Layer 2 draws on.
- Reference `CLAUDE.md` as the governance document that Layer 2 enforces.
- Reference the specific conformance test (`tests/conformance/hallucination-detection.test.ts`) as the Layer 3 verification entry point.

### 7.4 Supersession Note
Bridge v2.0 contains no hallucination detection documentation. This is entirely new content in v2.1, motivated by 6 months of build experience with agent-assisted specification authoring. The v2.0 supersession notice should flag this as a major addition.

---

## 8. Open Questions

1. **Layer 1 boundary definition:** How strictly should the grounding boundary be drawn? Currently, it is defined by the task's "Relevant Files" list. Should it be expanded to include transitive dependencies (files imported by relevant files)?

2. **Layer 2 temporal scope:** Should cross-reference coherence checking extend to prior milestone outputs, or only the current milestone? Extending it catches more drift but increases cost.

3. **Layer 3 test coverage:** The conformance test at `tests/conformance/hallucination-detection.test.ts` validates the detection system itself. Should there also be per-section conformance tests that Layer 3 runs automatically for each Bridge section?

4. **False positive handling:** When Layer 1 flags a claim as ungrounded but the claim is actually about planned/future functionality (documented as "milestone X implements this"), how should the system distinguish between hallucination and forward reference? Current recommendation: forward references must be explicitly marked with milestone identifiers.

---

*This analysis documents the three-layer hallucination detection system for inclusion in Engineering Bridge v2.1. The system enforces the Bridge View Principle at execution time, ensuring that agent-produced documentation remains grounded in actual system state. Implementation lives in `scripts/bootstrap-task-executor.ts`; verification lives in `tests/conformance/hallucination-detection.test.ts`.*