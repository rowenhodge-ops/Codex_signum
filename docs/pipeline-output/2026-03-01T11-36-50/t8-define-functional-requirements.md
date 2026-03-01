# Define functional requirements

> Task ID: t8
> Model: claude-opus-4-6:adaptive:medium
> Duration: 166743ms
> Output chars: 29742
> Timestamp: 2026-03-01T11:54:26.058Z

---

# Functional Requirements: Codex Signum Topology Refactor

## FR-9 through FR-15

**Document Status:** Specification Draft
**Task Reference:** t8 — Define functional requirements
**Spec Anchor:** docs/specs/01_codex-signum-v3_0.md (Codex Signum v3.0)
**Date:** 2025-07-17

---

## 1. Context and Rationale

The M-7B and M-8A pipeline runs exposed structural gaps in the current Codex Signum implementation. The pipeline operates as a linear chain with implicit state, no pre-validation of execution prerequisites, incomplete context propagation, and no self-referential capability to evaluate its own axiom compliance. These gaps produce waste (muda) in the form of rework, waiting, defects, and unnecessary processing — measurable through the Lean Six Sigma value stream analysis conducted alongside this specification.

The topology refactor converts the pipeline from a linear sequential chain into a Codex-native graph topology where pipeline artifacts are first-class Codex patterns, learning is multi-dimensional, the system can audit its own foundations, and hallucination is detected structurally rather than post-hoc.

Each FR below is traced to:
- **Codex axioms** it operationalises
- **Gap(s)** it closes from the M-7B/M-8A gap analysis
- **SIPOC stage(s)** it modifies
- **Lean waste category** it eliminates

---

## 2. Functional Requirements

### FR-9: Pre-Flight Auth Validation

#### 2.1 Description

The pipeline SHALL validate all authentication credentials, API keys, model access tokens, and file-system permissions **before** any substantive processing begins. Validation occurs at the INTAKE stage boundary, before TRIAGE.

#### 2.2 Detailed Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-9.1 | The system SHALL enumerate all credentials required by the task's execution plan (model API keys, git credentials, file-system write paths) at INTAKE, before TRIAGE begins. | MUST |
| FR-9.2 | The system SHALL perform a live reachability check (not just presence-of-token check) for each external service credential. For API keys, this means a lightweight authenticated probe (e.g., model list endpoint, token introspection). | MUST |
| FR-9.3 | The system SHALL validate file-system write permissions for all output paths declared or implied by the task specification. | MUST |
| FR-9.4 | If any credential fails validation, the pipeline SHALL halt with a structured error report identifying: (a) which credential failed, (b) the validation method used, (c) suggested remediation, and (d) elapsed time before failure. | MUST |
| FR-9.5 | The system SHALL cache successful validation results for the duration of a single pipeline run, with an explicit TTL no greater than the expected pipeline duration. Cached validations SHALL be invalidatable. | SHOULD |
| FR-9.6 | Pre-flight validation SHALL complete within 10 seconds for up to 5 distinct credential types. If any single probe exceeds 5 seconds, it SHALL be reported as degraded (not failed) and the operator prompted. | SHOULD |
| FR-9.7 | The system SHALL log all pre-flight checks as a structured validation manifest attached to the pipeline run metadata, regardless of pass/fail outcome. | MUST |
| FR-9.8 | Pre-flight validation SHALL be idempotent — running it multiple times produces no side effects beyond log entries. | MUST |

#### 2.3 Traceability

- **Axiom alignment:** *Structural Coherence* (state is visible in structure — auth state must be visible, not assumed); *Feedback Directionality* (fail-fast is the shortest feedback loop); *Graceful Degradation* (dimming before darkness — degraded credential flagged before hard failure)
- **Gap closed:** M-8A observed pipeline failures at EXECUTE due to expired API tokens, wasting all upstream processing time. This is **muda of defects** (producing output that cannot be committed) and **muda of waiting** (entire pipeline blocks on late-discovered auth failure).
- **SIPOC impact:** New validation sub-process inserted between INTAKE(Output) and TRIAGE(Input). INTAKE SIPOC gains a new output: `auth-validation-manifest`.
- **Lean metrics:** Eliminates an estimated 15-25% of pipeline failures observed in M-8A that were attributable to credential/permission issues. Directly improves RTY by removing a common defect injection point.

---

### FR-10: File Context Injection at DISPATCH

#### 2.4 Description

The DISPATCH stage SHALL resolve, read, and inject all file contents referenced by a task specification before handing execution units to EXECUTE. Context injection is explicit, auditable, and bounded.

#### 2.5 Detailed Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10.1 | The DISPATCH stage SHALL parse all file references in the task specification (explicit paths, glob patterns, spec references) and resolve them to concrete file paths relative to the repository root. | MUST |
| FR-10.2 | For each resolved file, DISPATCH SHALL read its content and attach it as a structured context block to the execution unit, with metadata: file path, byte size, SHA-256 hash, last-modified timestamp. | MUST |
| FR-10.3 | The system SHALL enforce a configurable maximum context size per execution unit (default: 100KB aggregate file content). Files exceeding the limit SHALL be truncated with a structural marker indicating truncation point and total size. | MUST |
| FR-10.4 | The system SHALL support a `relevantFiles` declaration in task specifications that explicitly lists files to inject. When present, only declared files are injected. | MUST |
| FR-10.5 | When no `relevantFiles` declaration is present, DISPATCH SHALL infer context files from: (a) import/require statements in modified files, (b) spec references in the task body, (c) directory-level metadata (see FR-11). Inferred files SHALL be flagged as `inferred` vs `declared`. | SHOULD |
| FR-10.6 | File content injection SHALL be recorded in the execution unit's provenance chain, enabling downstream audit of "what context was the model given?" | MUST |
| FR-10.7 | If a declared file does not exist or is unreadable, DISPATCH SHALL: (a) log a warning, (b) include a placeholder with the error, (c) continue execution unless the file is marked `required`. Required missing files halt the execution unit. | MUST |
| FR-10.8 | The system SHALL deduplicate file content across execution units within the same pipeline run (content-addressed by SHA-256). | SHOULD |

#### 2.6 Traceability

- **Axiom alignment:** *Structural Coherence* (context is part of the execution structure, not a side-channel); *Provenance Tracing* (every input to a generation step is recorded); *Feedback Directionality* (model receives relevant context at the earliest useful moment)
- **Gap closed:** M-7B and M-8A showed execution units operating without file context, producing outputs that contradicted existing code or spec. This is **muda of defects** (hallucinated interfaces) and **muda of overprocessing** (model re-deriving information that exists in files).
- **SIPOC impact:** DISPATCH gains new inputs (`resolved-file-contents`) and new processing (`context-resolution`, `context-injection`). DISPATCH output gains `context-manifest`.
- **Lean metrics:** Estimated 30-40% reduction in rework cycles caused by context-ignorant generation. Directly improves %C&A (percent-complete-and-accurate) at the EXECUTE stage output.

---

### FR-11: Directory Metadata at DECOMPOSE

#### 2.7 Description

The DECOMPOSE stage SHALL generate and utilise directory-level metadata to inform task decomposition, routing, and context scoping. This metadata describes the semantic structure of the codebase — what each directory contains, owns, and depends on.

#### 2.8 Detailed Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-11.1 | The system SHALL maintain a directory metadata index that maps each directory to: (a) purpose/description, (b) primary language(s), (c) key exports/interfaces, (d) internal dependency list, (e) external dependency list, (f) file count and aggregate size. | MUST |
| FR-11.2 | The directory metadata index SHALL be regenerable from the repository state. The generation process SHALL be invocable as a standalone command. | MUST |
| FR-11.3 | DECOMPOSE SHALL consult the directory metadata index when splitting a composite task into execution units, using directory boundaries as natural decomposition seams. | MUST |
| FR-11.4 | Each execution unit produced by DECOMPOSE SHALL carry a `scopeDirectories` property listing the directories it is expected to read from or write to. | MUST |
| FR-11.5 | The directory metadata index SHALL include a `conventions` field per directory capturing local coding conventions, naming patterns, and architectural constraints (e.g., "this directory uses functional style, no classes"). | SHOULD |
| FR-11.6 | The directory metadata SHALL be versioned and diffable. Changes to directory structure across pipeline runs SHALL be detectable. | SHOULD |
| FR-11.7 | When a task references a directory not present in the metadata index, DECOMPOSE SHALL (a) log a warning, (b) generate on-the-fly metadata for that directory, (c) flag the execution unit as operating with `partial-metadata`. | MUST |
| FR-11.8 | The metadata index format SHALL be machine-readable (JSON or equivalent) and human-reviewable. | MUST |

#### 2.9 Traceability

- **Axiom alignment:** *Structural Coherence* (codebase structure is encoded, not implicit); *Bounded Autonomy* (execution units are scoped to known directories); *Provenance Tracing* (decomposition decisions are traceable to structural metadata)
- **Gap closed:** M-8A DECOMPOSE produced execution units with overlapping or incorrect scope, leading to merge conflicts and redundant work. This is **muda of overproduction** (multiple units modifying the same files) and **muda of motion** (unnecessary coordination to resolve conflicts).
- **SIPOC impact:** DECOMPOSE gains a new input (`directory-metadata-index`) and new processing (`scope-resolution`). Its output gains `scopeDirectories` per execution unit.
- **Lean metrics:** Reduces execution unit scope overlap (target: <5% of execution units per run have overlapping write directories). Improves first-pass yield at COMMIT by reducing merge conflicts.

---

### FR-12: Pipeline Output as Graph Nodes

#### 2.10 Description

All pipeline artifacts — tasks, execution units, outputs, validations, commits — SHALL be represented as Codex Signum patterns (graph nodes) with structural state encoding. The pipeline run itself becomes a Lattice of interconnected Blooms.

#### 2.11 Detailed Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-12.1 | Each pipeline run SHALL be represented as a Lattice node. Each stage (INTAKE, TRIAGE, DECOMPOSE, DISPATCH, EXECUTE, COMMIT) SHALL be represented as a Bloom within that Lattice. | MUST |
| FR-12.2 | Each execution unit SHALL be represented as a Sigil within its stage's Bloom. Individual operations (model calls, file reads, validations) SHALL be representable as Glyphs within the Sigil. | MUST |
| FR-12.3 | All inter-node connections SHALL carry the three Codex state dimensions: health (luminance/confidence), activity (pulsation/recency), and trust (connection weight/reliability). | MUST |
| FR-12.4 | Node health SHALL be computed from execution outcome: successful completion → full luminance; partial success → proportional dimming; failure → minimal luminance; not-yet-executed → neutral luminance with zero pulsation. | MUST |
| FR-12.5 | The graph SHALL be serialisable to a persistent format (JSON-LD, or equivalent linked-data format) that preserves all structural state. Each pipeline run produces a complete graph artifact. | MUST |
| FR-12.6 | The graph SHALL support temporal queries: "show me the state of this Bloom at time T" for any T within the pipeline run duration. This requires append-only state transitions on nodes. | SHOULD |
| FR-12.7 | The graph SHALL be queryable for structural patterns: "find all Sigils with health below threshold X", "find all connections where trust has decreased across runs". | SHOULD |
| FR-12.8 | The graph representation SHALL be the authoritative record of the pipeline run. Flat-file outputs (markdown reports, logs) SHALL be derived views of the graph, not independent artifacts. | MUST |
| FR-12.9 | Graph nodes SHALL carry provenance metadata: creation timestamp, creating stage, input dependencies (edges to upstream nodes), axiom compliance flags. | MUST |

#### 2.12 Traceability

- **Axiom alignment:** This is the primary operationalisation of the core Codex thesis — *state is structural*. Specifically: *Structural Coherence* (pipeline state encoded in topology, not logs); *Provenance Tracing* (every node traces to its inputs); *Feedback Directionality* (feedback flows along graph edges); *Graceful Degradation* (health propagation follows graph structure)
- **Gap closed:** Current pipeline output is flat files with no structural relationships. Understanding run history requires manual log correlation. This is **muda of motion** (searching for information) and **muda of inventory** (redundant state representations).
- **SIPOC impact:** All stages gain a new output: `graph-node(s)`. A new cross-cutting concern — graph construction — is introduced. The COMMIT stage gains responsibility for persisting the complete graph.
- **Lean metrics:** Enables measurement of all other lean metrics (RTY, %C&A, PCE) directly from the graph structure rather than from manual log analysis. This is the measurement system (MSA) foundation.

---

### FR-13: Multi-Dimensional Thompson Sampling

#### 2.13 Description

The pipeline's learning system SHALL use multi-dimensional Thompson sampling to select execution strategies across multiple independent quality dimensions simultaneously, replacing any single-metric optimisation.

#### 2.14 Detailed Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-13.1 | The system SHALL maintain independent Beta distributions (Thompson sampling posteriors) for each combination of: (a) model selection, (b) prompt strategy, (c) context size, (d) decomposition granularity — across at least three quality dimensions: correctness, completeness, and coherence. | MUST |
| FR-13.2 | Each quality dimension SHALL have a defined measurement: correctness = `npx tsc --noEmit` pass rate + test pass rate; completeness = acceptance criteria coverage; coherence = output consistency with existing codebase patterns. | MUST |
| FR-13.3 | At DISPATCH, the system SHALL sample from each dimension's posterior independently and select the strategy that maximises the minimum sampled value across dimensions (maximin selection), preventing optimisation of one dimension at the expense of others. | MUST |
| FR-13.4 | After EXECUTE, observed outcomes SHALL update the corresponding Beta distributions using Bayesian posterior update. Successful outcomes increment α; failures increment β. | MUST |
| FR-13.5 | The system SHALL support configurable dimension weights to express organisational priorities (e.g., "correctness is 2× more important than completeness"). Weights modify the maximin selection, not the posterior updates. | SHOULD |
| FR-13.6 | Thompson sampling state (all Beta distribution parameters) SHALL persist across pipeline runs. Cold-start priors SHALL be configurable (default: α=1, β=1, uniform). | MUST |
| FR-13.7 | The system SHALL log every sampling decision: which arms were available, what values were sampled, which was selected, and why. This log SHALL be attached to the execution unit's graph node (FR-12). | MUST |
| FR-13.8 | The system SHALL detect distribution convergence (variance below threshold) and trigger exploration bonuses (temporary prior inflation) to prevent premature exploitation lock-in. | SHOULD |
| FR-13.9 | The system SHALL support at least 10 concurrent arms (strategy combinations) without performance degradation in the sampling step. | MUST |

#### 2.15 Traceability

- **Axiom alignment:** *Adaptive Feedback* (three feedback scales — Correction/Learning/Evolution — map to immediate outcome update, cross-run posterior update, and dimension weight adjustment respectively); *Feedback Directionality* (learning flows from EXECUTE outcomes back to DISPATCH selection); *Bounded Autonomy* (Thompson sampling operates within defined strategy space, does not invent new strategies)
- **Gap closed:** M-7B and M-8A used static model/prompt selection. No learning occurred across runs. This is **muda of overprocessing** (using suboptimal strategies repeatedly) and a source of **common-cause variation** (no mechanism to reduce baseline variability in output quality).
- **SIPOC impact:** DISPATCH gains new processing (`thompson-sample`). EXECUTE gains new output (`dimension-outcomes`). A new cross-run persistence concern (`thompson-state`) is introduced.
- **Lean metrics:** Target Cpk improvement of 0.3 within 20 pipeline runs through variance reduction. Thompson sampling directly addresses common-cause variation by systematically exploring and exploiting the strategy space.

---

### FR-14: Self-Referential Axiom Review

#### 2.16 Description

The pipeline SHALL be capable of auditing its own axiom compliance. When directed to perform a lean review or axiom validation, it SHALL evaluate its current implementation against the Codex axioms, identify divergences, and recommend corrections — including corrections to the axioms themselves if evidence warrants.

#### 2.17 Detailed Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-14.1 | The system SHALL include a reviewable axiom registry: a machine-readable document listing all Codex axioms, their definitions, their operational constraints, and their testable predicates. | MUST |
| FR-14.2 | The system SHALL support a `REVIEW` pipeline mode that, instead of executing a development task, evaluates the pipeline's own compliance with the axiom registry. | MUST |
| FR-14.3 | In REVIEW mode, the system SHALL: (a) enumerate all axioms, (b) for each axiom, identify the implementation components that operationalise it, (c) evaluate whether the implementation correctly expresses the axiom's intent, (d) produce a compliance report with evidence. | MUST |
| FR-14.4 | The compliance report SHALL distinguish between: (a) axiom correctly implemented, (b) axiom partially implemented (with gap description), (c) axiom not implemented, (d) implementation diverges from axiom (with divergence description), (e) axiom itself may need revision (with evidence). | MUST |
| FR-14.5 | The system SHALL apply **scope awareness** when evaluating axioms: axioms that constrain the running system (operational scope) are evaluated differently from the review's right to question foundational assumptions (review scope). Specifically, *Semantic Stability* constrains operational renaming but does not prevent the review from recommending foundational changes with substantive justification. | MUST |
| FR-14.6 | When the system recommends axiom revision, it SHALL provide: (a) the current axiom text, (b) the proposed revision, (c) evidence from pipeline runs supporting the change, (d) impact analysis on dependent axioms and implementations, (e) a clear statement of what breaks if the axiom is not revised. | MUST |
| FR-14.7 | The REVIEW mode output SHALL itself be a graph (FR-12) where each axiom is a node, each implementation component is a node, and compliance relationships are edges with health state. | SHOULD |
| FR-14.8 | The system SHALL detect circular justification: an axiom cannot be validated solely by the component that implements it. Validation SHALL require at least one independent evidence source (test results, output analysis, cross-axiom consistency). | MUST |

#### 2.18 Traceability

- **Axiom alignment:** This FR operationalises the meta-imperative of **self-reference** — the system must be able to examine its own foundations. It interacts with all ten axioms but particularly: *Semantic Stability* (scope-aware application — operational vs. review); *Structural Coherence* (the review itself must be structurally encoded); *Adaptive Feedback* at the Evolution scale (foundational changes to the axiom set)
- **Gap closed:** M-8A axiom validation was performed manually. The pipeline could not evaluate its own compliance. This is **muda of motion** (human effort to perform machine-assistable analysis) and a measurement system gap (MSA — the measurement instrument was informal and non-repeatable).
- **SIPOC impact:** New pipeline mode (REVIEW) with its own SIPOC. Inputs: axiom registry, implementation source, prior run data. Outputs: compliance graph, gap report, revision recommendations.
- **Lean metrics:** Establishes the MSA (Measurement System Analysis) foundation — the review process itself becomes measurable and repeatable, enabling Gage R&R on axiom compliance assessments.

---

### FR-15: Jidoka / Andon-Cord Hallucination Detection

#### 2.19 Description

The pipeline SHALL implement structural hallucination detection using the jidoka principle: automated detection of quality defects with the authority to stop the line. When a hallucination is detected, the pipeline halts the affected execution unit (Andon cord), surfaces the anomaly structurally, and requires explicit human or automated resolution before proceeding.

#### 2.20 Detailed Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-15.1 | The system SHALL define hallucination as: output that references entities, interfaces, files, dependencies, or patterns that do not exist in the provided context and cannot be verified against the codebase. | MUST |
| FR-15.2 | At EXECUTE output, the system SHALL perform structural validation: (a) all import/require statements resolve to existing modules, (b) all function/method calls reference declared interfaces, (c) all file paths reference existing files or are explicitly marked as new-file-creation, (d) all type references resolve. | MUST |
| FR-15.3 | TypeScript compilation (`npx tsc --noEmit`) SHALL be a mandatory hallucination gate. Compilation failure on the execution unit's output SHALL trigger the Andon cord. | MUST |
| FR-15.4 | When the Andon cord is pulled, the system SHALL: (a) halt the specific execution unit (not the entire pipeline), (b) record the halted state on the execution unit's graph node (FR-12) with full diagnostic context, (c) attempt automated remediation (up to N retries, configurable, default 2), (d) if automated remediation fails, escalate to human review with structured context. | MUST |
| FR-15.5 | Automated remediation SHALL include the hallucination evidence (what was referenced, what actually exists) in the retry prompt context. The retry SHALL be a distinct Thompson sampling arm (FR-13) so that hallucination-prone strategies are down-weighted. | MUST |
| FR-15.6 | The system SHALL maintain a hallucination rate metric per model, per prompt strategy, and per context configuration. This metric SHALL feed into Thompson sampling posteriors (FR-13) as a penalty on the correctness dimension. | MUST |
| FR-15.7 | The system SHALL distinguish between: (a) fabrication (referencing non-existent entities), (b) misattribution (referencing real entities with wrong signatures), (c) anachronism (referencing entities from a different version), (d) confabulation (generating plausible but incorrect logic). Type (a) and (b) are structurally detectable; (c) requires version context; (d) requires semantic validation. | SHOULD |
| FR-15.8 | The system SHALL support configurable severity levels for hallucination types. Fabrication and misattribution default to Andon-cord (halt). Anachronism defaults to warning. Confabulation defaults to flag-for-review. | SHOULD |
| FR-15.9 | All Andon-cord events SHALL be recorded as first-class events in the pipeline graph (FR-12) with edges to: the triggering execution unit, the detecting validation, the remediation attempts, and the resolution. | MUST |
| FR-15.10 | The system SHALL report hallucination metrics as part of the pipeline run summary: total hallucinations detected, hallucinations by type, hallucinations by model/strategy, remediation success rate. | MUST |

#### 2.21 Traceability

- **Axiom alignment:** *Graceful Degradation* (the execution unit dims/halts, not the entire pipeline); *Structural Coherence* (hallucination is a structural anomaly — reference to nonexistent structure); *Feedback Directionality* (hallucination evidence flows back to inform strategy selection); *Adaptive Feedback* at Correction scale (immediate retry with evidence) and Learning scale (strategy posterior update)
- **Gap closed:** M-7B and M-8A had no automated hallucination detection. Fabricated imports, non-existent interface references, and phantom file paths reached COMMIT and caused cascading failures. This is **muda of defects** (the most expensive category — defects propagated to the latest possible stage) and directly degrades RTY.
- **SIPOC impact:** EXECUTE gains new output validation (`hallucination-check`). New sub-process between EXECUTE(Output) and COMMIT(Input). COMMIT SIPOC gains a new input prerequisite: `hallucination-check-passed`.
- **Lean metrics:** Target: reduce hallucination escape rate (hallucinations reaching COMMIT) to <5% within 10 pipeline runs. Currently estimated at 20-35% based on M-8A rework data. Directly improves %C&A at EXECUTE output and RTY across the full pipeline.
- **OpEx reference:** Jidoka (autonomation) is a core Toyota Production System principle — machines detect abnormality and stop themselves. The Andon cord is the signal mechanism. This FR translates both concepts directly into the AI pipeline domain, as described in the OpEx research paper.

---

## 3. Cross-Cutting Concerns

### 3.1 FR Interdependencies

```
FR-9 (Pre-flight Auth) ──→ FR-10 (file access validated before context injection)
FR-11 (Directory Metadata) ──→ FR-10 (metadata informs context resolution)
FR-11 (Directory Metadata) ──→ FR-12 (directory structure becomes graph topology)
FR-12 (Graph Nodes) ──→ FR-13 (sampling decisions recorded in graph)
FR-12 (Graph Nodes) ──→ FR-14 (review output is a graph)
FR-12 (Graph Nodes) ──→ FR-15 (Andon events recorded in graph)
FR-13 (Thompson Sampling) ←──→ FR-15 (hallucination rates feed sampling posteriors)
FR-14 (Self-Referential Review) ──→ FR-15 (axiom review can detect systemic hallucination patterns)
```

**FR-12 is the keystone.** Graph node representation is a prerequisite for FR-13, FR-14, and FR-15 to function as designed. Implementation order: FR-9 → FR-11 → FR-10 → FR-12 → FR-13 → FR-15 → FR-14.

### 3.2 Axiom Scope Awareness

Per the intent specification, axioms apply differently depending on scope:

| Axiom | Operational Scope (constrains running system) | Review Scope (evaluates foundation) |
|-------|-----------------------------------------------|--------------------------------------|
| Semantic Stability | Prevents arbitrary renaming of morphemes/stages during execution | Does NOT prevent recommending foundational terminology changes with evidence |
| Structural Coherence | Pipeline outputs must encode state structurally | Review may identify that "structural" itself needs redefinition |
| Bounded Autonomy | Execution units stay within declared scope | Review may recommend expanding or contracting autonomy bounds |
| Adaptive Feedback | Learning operates within defined scales | Review may recommend new feedback scales |

This scope distinction is operationalised by FR-14.5 and applies throughout the topology refactor.

### 3.3 Verification Strategy

All FRs are verifiable through the existing acceptance criterion (`npx tsc --noEmit`) for type-safety of the implementation, plus:

| FR | Additional Verification |
|----|------------------------|
| FR-9 | Integration test: pipeline with intentionally invalid credential halts at INTAKE with structured error |
| FR-10 | Unit test: DISPATCH execution unit contains declared file content with correct SHA-256 |
| FR-11 | Unit test: DECOMPOSE output execution units carry `scopeDirectories`; overlap < 5% |
| FR-12 | Integration test: pipeline run produces valid graph artifact; all nodes carry three state dimensions |
| FR-13 | Unit test: sampling decisions logged; posteriors updated correctly; convergence detection fires |
| FR-14 | Integration test: REVIEW mode produces compliance graph with evidence for each axiom |
| FR-15 | Integration test: fabricated import in model output triggers Andon cord; execution unit halts; retry includes evidence |

---

## 4. Summary Matrix

| FR | Name | Stage(s) | Primary Waste Eliminated | Primary Axiom | Codex Layer |
|----|------|----------|--------------------------|---------------|-------------|
| FR-9 | Pre-flight Auth Validation | INTAKE | Defects, Waiting | Structural Coherence | Bloom |
| FR-10 | File Context Injection | DISPATCH | Defects, Overprocessing | Provenance Tracing | Sigil |
| FR-11 | Directory Metadata | DECOMPOSE | Overproduction, Motion | Bounded Autonomy | Bloom |
| FR-12 | Pipeline as Graph Nodes | All | Motion, Inventory | State Is Structural (core thesis) | Lattice |
| FR-13 | Multi-Dim Thompson Sampling | DISPATCH, EXECUTE | Overprocessing (common-cause variation) | Adaptive Feedback | Sigil |
| FR-14 | Self-Referential Axiom Review | New (REVIEW mode) | Motion (manual analysis) | Meta-imperative: Self-Reference | Lattice |
| FR-15 | Jidoka Hallucination Detection | EXECUTE → COMMIT | Defects (escaped hallucinations) | Graceful Degradation | Sigil/Bloom |

---

*End of FR-9 through FR-15 specification.*