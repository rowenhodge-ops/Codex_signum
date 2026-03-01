# Document Aspirational Feature Identification Results

> Task ID: t10
> Model: claude-opus-4-6:adaptive:medium
> Duration: 116123ms
> Output chars: 18780
> Timestamp: 2026-03-01T01:53:36.873Z

---

# Codex Signum — Aspirational Feature Identification Results (t10)

**Document:** `docs/specs/codex-signum-review-report-t10.md`
**Parent report:** `docs/specs/codex-signum-review-report.md` (Section 6)
**Scope:** All 8 specification documents listed in the review charter
**Date:** 2025-01-28
**Status:** Complete — Pending Resolution

---

## 1. Purpose & Method

This document catalogues every instance where a Codex Signum specification document describes a feature, mechanism, or capability using **present-tense declarative language** ("the system does X", "morpheme Ω records Y") when the feature in question either:

- **(A)** Has no corresponding implementation artefact (code, test, configuration).
- **(B)** Is partially prototyped but described at full operational maturity.
- **(C)** Depends on infrastructure or subsystems that do not yet exist.

Each finding includes the **source document**, the **specific language pattern** that creates the false impression, a **justification** explaining why the feature is classified as aspirational, and a **proposed clarification**.

Findings are assigned identifiers in the series `ASP-XX` for cross-referencing with the parent review report.

---

## 2. Summary of Findings

| ID | Feature | Source Spec | Severity | Category |
|---|---|---|---|---|
| ASP-01 | Adaptive Imperative Boundary Runtime | `02_…adaptive-imperative-boundaries.md` | **High** | A — No implementation |
| ASP-02 | Witness (Ω) Audit Persistence & Replay | `01_…v3_0.md`, `05_…engineering-bridge-v2_0.md` | **High** | B — Partial prototype |
| ASP-03 | Attunement Feedback Loop | `08_…attunement-v0_2.md` | **High** | A — No implementation |
| ASP-04 | Lean Process Map Automation | `03_…lean-process-maps-v2.md` | **Medium** | B — Partial prototype |
| ASP-05 | OpEx Metric Collection Pipeline | `04_…opex-addendum-v2.md` | **Medium** | C — Missing infrastructure |
| ASP-06 | Architect & Research Pattern Instantiation | `06_…architect-pattern-design.md`, `07_…research-pattern-design.md` | **Medium** | B — Partial prototype |
| ASP-07 | Engineering Bridge Composite Health Score | `05_…engineering-bridge-v2_0.md` | **High** | C — Missing infrastructure |

Seven findings total — exceeding the initial estimate of 4 from the executive summary, which was scoped only to the core spec. The expanded 8-document corpus reveals additional instances.

---

## 3. Detailed Findings

### ASP-01 — Adaptive Imperative Boundary Runtime

**Source:** `docs/specs/02_codex-signum-v3_1-adaptive-imperative-boundaries.md`

**Observed Language Pattern:**
The specification describes a runtime mechanism that dynamically adjusts the strictness of axiom enforcement based on operational context. Language such as "boundaries shift in response to trust signals" and "the system relaxes Parsimony constraints when Resilience risk exceeds threshold τ" implies a live, functioning control loop.

**Why This Is Aspirational:**

1. **No runtime controller exists.** There is no implemented component that reads trust signals, evaluates threshold conditions, or modifies constraint enforcement levels at runtime. The mechanism described requires a policy engine, a trust-signal ingestion pipeline, and a constraint-weighting system — none of which are present in the codebase.
2. **No threshold values are calibrated.** The spec references thresholds (τ, δ) but provides no empirical basis, default values, or calibration procedure. These are design placeholders, not operational parameters.
3. **Dependency on Axiom Priority Resolution (AX-04).** The adaptive boundary mechanism presupposes a resolved axiom priority ordering for tiebreaking. As documented in finding AX-04 of the parent report, this ordering does not yet exist in the spec itself, let alone in implementation.

**Impact of Misrepresentation:**
An implementor reading this spec would attempt to build an adaptive control loop before the foundational axiom priority system is defined, leading to wasted effort and architectural misalignment.

**Proposed Clarification:**
Relabel the entire document as `STATUS: Design Proposal`. Replace present-tense declarative statements with future-conditional language ("the system **would** adjust…", "boundaries **will** shift when the following prerequisites are met: …"). Add a "Prerequisites" section listing AX-04 resolution, trust-signal schema definition, and threshold calibration as blockers.

---

### ASP-02 — Witness (Ω) Audit Persistence & Replay

**Source:** `docs/specs/01_codex-signum-v3_0.md` (morpheme definition, §3), `docs/specs/05_codex-signum-engineering-bridge-v2_0.md` (bridge formulas referencing Ω)

**Observed Language Pattern:**
The core spec defines morpheme Ω (Witness) as "an observation record proving a computation occurred" and states that witnesses "are persisted to an append-only audit store" and "support deterministic replay of any derivation chain." The engineering bridge references `Ω.replay(chain_id)` as an available operation.

**Why This Is Aspirational:**

1. **No append-only store exists.** The implementation contains an in-memory Witness data structure that is created during computation but is not persisted beyond process lifetime. There is no database, log, or file-based audit store.
2. **No replay mechanism exists.** The `replay(chain_id)` operation referenced in the engineering bridge has no corresponding function, method, or module in the codebase. Deterministic replay requires both persistence (missing) and a replay executor that can re-derive outputs from stored witness chains (also missing).
3. **Partial prototype scope.** What *does* exist is the ability to *create* Ω records and attach them to computation results in memory. This is a valid foundation, but it is approximately 20% of what the spec describes.

**Impact of Misrepresentation:**
Traceability (A7) compliance claims depend on Ω persistence. Without it, A7 is satisfied only for in-process, single-session auditing — a significantly weaker guarantee than the spec implies.

**Proposed Clarification:**
Split the Ω morpheme description into two tiers:
- **Tier 1 (Implemented):** "Ω records are created in-memory and attached to computation results for session-scoped auditability."
- **Tier 2 (Planned):** "Ω records will be persisted to an append-only store supporting cross-session replay. Status: Not Yet Implemented."

Update the engineering bridge to annotate `Ω.replay(chain_id)` with `[NYI]` (Not Yet Implemented).

---

### ASP-03 — Attunement Feedback Loop

**Source:** `docs/specs/08_codex-signum-attunement-v0_2.md`

**Observed Language Pattern:**
The attunement spec describes a closed-loop system in which the AI "continuously refines its model of human intent based on correction signals" and "adjusts comprehension strategies in real-time." It states that "attunement scores converge toward stable equilibria after N interaction cycles."

**Why This Is Aspirational:**

1. **The version number itself is a signal.** The document is versioned `v0.2`, which by conventional semver interpretation indicates pre-release, experimental status. Yet the body text uses present-tense declarative language indistinguishable from production-status specifications.
2. **No feedback ingestion pipeline exists.** Continuous refinement requires a mechanism to capture human correction signals, classify them, and feed them back into a comprehension model. No such pipeline is implemented.
3. **No convergence proof or empirical data.** The claim of convergence toward stable equilibria is a mathematical assertion that requires either a formal proof or empirical measurement. Neither is provided or referenced. The spec presents a hypothesis as a system property.
4. **Dependency on Comprehension Primacy (A3) infrastructure.** Attunement is framed as an extension of A3, but A3 itself has no runtime implementation beyond static prompt-engineering heuristics.

**Impact of Misrepresentation:**
This is arguably the most consequential aspirational misrepresentation because it claims a *learning* capability. Stakeholders reading this spec may believe the system self-improves through use, which is materially false at present.

**Proposed Clarification:**
Add a document-level banner: `⚠️ STATUS: Experimental Design — v0.2. No runtime implementation exists. All descriptions are design targets, not current capabilities.` Convert all present-tense claims to design-intent language. Remove or qualify the convergence claim with "hypothesised; requires formal verification."

---

### ASP-04 — Lean Process Map Automation

**Source:** `docs/specs/03_codex-signum-lean-process-maps-v2.md`

**Observed Language Pattern:**
The spec describes process maps that "automatically route work items through Transform chains based on type classification" and "trigger Gate evaluations without human initiation." It references "the orchestrator" as an active system component.

**Why This Is Aspirational:**

1. **No orchestrator component exists.** The process maps are defined as static documentation artefacts (diagrams, markdown tables). There is no runtime orchestrator that reads these maps and executes them.
2. **Manual execution is the current reality.** In practice, the process maps serve as *human-readable guides* that developers follow manually. This is valuable, but it is fundamentally different from automated routing.
3. **Partial foundation present.** The morpheme definitions (Σ, Τ, Γ) provide the *vocabulary* for describing automated flows, and the grammar rules provide *structural validation*. But vocabulary and validation are not execution.

**Impact of Misrepresentation:**
Moderate. An implementor may skip building an orchestrator because the spec implies one already exists.

**Proposed Clarification:**
Distinguish between "Process Map Definition" (implemented — static structural descriptions) and "Process Map Execution" (planned — automated orchestration). Add a status marker to each section.

---

### ASP-05 — OpEx Metric Collection Pipeline

**Source:** `docs/specs/04_codex-signum-opex-addendum-v2.md`

**Observed Language Pattern:**
The addendum specifies operational metrics including "morpheme composition frequency," "Gate pass/fail ratios," "mean derivation chain length," and "Witness verification latency." It states these metrics "are collected and reported via the observability surface."

**Why This Is Aspirational:**

1. **No observability surface exists.** There is no metrics collection agent, no dashboard, no reporting endpoint, and no time-series store for these metrics.
2. **Metric definitions are sound but unimplemented.** The metrics themselves are well-defined and would be valuable. The problem is purely one of presentation: they are described as currently collected rather than as targets for future instrumentation.
3. **Dependency on Ω persistence (ASP-02).** Several metrics (mean derivation chain length, Witness verification latency) depend on the Witness audit store that ASP-02 identifies as unimplemented.

**Impact of Misrepresentation:**
Moderate. Operational planning based on this spec would assume metric availability that does not exist, potentially delaying the discovery of performance or reliability issues.

**Proposed Clarification:**
Add a "Metric Implementation Status" table showing each metric, its data source dependency, and its current status (Implemented / Instrumentable / Blocked).

---

### ASP-06 — Architect & Research Pattern Instantiation

**Source:** `docs/specs/06_codex-signum-architect-pattern-design.md`, `docs/specs/07_codex-signum-research-pattern-design.md`

**Observed Language Pattern:**
Both pattern specs describe reusable interaction templates: the Architect pattern "structures problem decomposition into Composite hierarchies" and the Research pattern "guides systematic evidence gathering through Transform chains." Both use language suggesting these patterns are instantiable system components: "invoke the Architect pattern," "the Research pattern produces."

**Why This Is Aspirational:**

1. **Patterns exist as documentation, not as instantiable objects.** There is no pattern registry, no instantiation API, and no runtime component that "invokes" a pattern. The patterns are conceptual frameworks documented in markdown.
2. **Partial embodiment in prompt engineering.** Some of the pattern guidance is reflected in system prompts and interaction heuristics, but this is informal embedding, not the structured instantiation the specs describe.
3. **Grammar rule coverage gap (related to GR-01/GR-02 in parent report).** The grammar rules do not include a production rule for "Pattern → Composite | Transform sequence," which would be necessary for patterns to be first-class structural entities.

**Impact of Misrepresentation:**
Moderate. The patterns are genuinely useful as design guidance. The risk is that developers treat the documentation as an API contract and look for invocation mechanisms that don't exist.

**Proposed Clarification:**
Add a "Maturity" field to each pattern document header. Distinguish between "Pattern as Design Guidance" (current) and "Pattern as Instantiable Component" (future). Rewrite imperative/invocation language to advisory language ("use this pattern to guide…" rather than "invoke this pattern to…").

---

### ASP-07 — Engineering Bridge Composite Health Score

**Source:** `docs/specs/05_codex-signum-engineering-bridge-v2_0.md`

**Observed Language Pattern:**
The engineering bridge defines a "Composite Health Score" formula:

> `H(Κ) = w₁·fidelity(Κ) + w₂·parsimony(Κ) + w₃·resilience(Κ)`

It states that this score "is computed for every Composite at validation time" and "Composites with H(Κ) below threshold θ are rejected."

**Why This Is Aspirational:**

1. **No scoring function is implemented.** The formula exists only in the spec. There is no code that computes `fidelity(Κ)`, `parsimony(Κ)`, or `resilience(Κ)` as numeric values.
2. **Component metrics are undefined.** For the formula to be computable, each sub-metric (fidelity, parsimony, resilience) must have an operational definition that produces a numeric value from a Composite instance. These operational definitions do not exist in any spec document or in code.
3. **Weight values and threshold are unspecified.** `w₁`, `w₂`, `w₃`, and `θ` have no default values, no calibration guidance, and no documented rationale for selection. They are free parameters with no binding.
4. **Cross-reference to stale formulas (parent report).** This is one of the 3 stale Engineering Bridge formulas identified in the parent report's Section 5. The other two (Ω.replay, Gate cascade cost) share similar characteristics.

**Impact of Misrepresentation:**
High. This formula gives the appearance of quantitative rigour without any implementable substance. An implementor who attempts to build this will immediately stall on the undefined sub-metrics, then question the credibility of the entire bridge document.

**Proposed Clarification:**
Mark the formula as `STATUS: Design Target`. Add stub definitions for each sub-metric with explicit `[TBD]` markers. Define a milestone for calibration. Consider whether the formula belongs in the main bridge spec or in a separate "Planned Metrics" appendix.

---

## 4. Cross-Cutting Patterns

Three systemic patterns emerge across the findings:

### Pattern 1: Present-Tense Declarative as Default Voice

All 8 spec documents use present-tense declarative language uniformly, whether describing implemented fundamentals (morpheme definitions) or unbuilt subsystems (attunement feedback loops). **The spec has no linguistic convention for distinguishing "is" from "will be."**

**Recommendation:** Adopt a status-marking convention. Every section or major claim should carry one of:
- `[IMPLEMENTED]` — Code exists, tests pass.
- `[PROTOTYPED]` — Partial code exists, not production-ready.
- `[DESIGNED]` — Specification complete, no code.
- `[PROPOSED]` — Under discussion, subject to change.

### Pattern 2: Dependency Chains Between Aspirational Features

Several aspirational features depend on *other* aspirational features:
- ASP-01 (Adaptive Boundaries) depends on AX-04 (Priority Resolution) — which is an unresolved action item.
- ASP-05 (OpEx Metrics) depends on ASP-02 (Ω Persistence) — which is itself aspirational.
- ASP-06 (Pattern Instantiation) depends on grammar rule extensions — which are identified gaps (GR-01/GR-02).

**Recommendation:** Build a dependency graph of aspirational features and resolve them bottom-up. No aspirational feature should be promoted to "Designed" status until its dependencies are at least "Prototyped."

### Pattern 3: Spec Version Numbers Contradict Body Maturity Claims

The attunement spec (v0.2) uses language identical in confidence to the core spec (v3.0). Version numbers are not correlated with feature maturity in any documented way.

**Recommendation:** Define a version-maturity mapping in the spec governance section (see also AX-03, which recommends creating such a section).

---

## 5. Consolidated Action Items

| ID | Action | Priority | Blocked By |
|---|---|---|---|
| ASP-01 | Relabel adaptive boundaries spec as Design Proposal | **P1** | — |
| ASP-02 | Split Ω description into Implemented/Planned tiers | **P1** | — |
| ASP-03 | Add experimental-status banner to attunement spec | **P1** | — |
| ASP-04 | Distinguish process map definition from execution | **P2** | — |
| ASP-05 | Add metric implementation status table to OpEx addendum | **P2** | ASP-02 |
| ASP-06 | Add maturity field to pattern documents | **P2** | — |
| ASP-07 | Mark composite health score as Design Target | **P1** | — |
| ASP-SYS-01 | Adopt spec-wide status-marking convention | **P0** | — |
| ASP-SYS-02 | Build aspirational feature dependency graph | **P2** | ASP-SYS-01 |
| ASP-SYS-03 | Define version-maturity mapping | **P2** | ASP-SYS-01 |

**Priority Legend:** P0 = systemic enabler (do first), P1 = high-severity individual fix, P2 = medium-severity individual fix.

---

## 6. Conclusion

The Codex Signum specification suite contains **7 distinct instances** of aspirational features presented as implemented capabilities, underpinned by **3 systemic patterns** in specification voice and structure. None of these findings indicate design flaws in the *intended* features themselves — the aspirational designs are generally sound and well-motivated. The problem is exclusively one of **status transparency**: the spec does not distinguish between what the system *does* and what the system *should eventually do*.

The single highest-leverage remediation is **ASP-SYS-01** (adopt a status-marking convention), which would prevent future recurrence and provide a framework for resolving all existing findings systematically.