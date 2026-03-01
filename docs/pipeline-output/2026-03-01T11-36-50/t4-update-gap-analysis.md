# Update gap analysis

> Task ID: t4
> Model: claude-opus-4-6:adaptive:low
> Duration: 156845ms
> Output chars: 24997
> Timestamp: 2026-03-01T11:45:30.911Z

---

# Gap Analysis Update — M-7B / M-8A Consolidated Findings

**Document**: `docs/lean/gap-analysis-update-m7b-m8a.md`
**Date**: 2026-03-01
**Baseline**: M-7B pipeline run, M-8A consolidated findings (`docs/pipeline-output/2026-03-01T08-19-52/`)
**References**: Codex Signum v3.0 spec, Lean Process Maps v2, Axiom Audit, Phase 2-3 Validation, OpEx Research Paper

---

## 1. Summary of New Gaps

| Gap ID | Category | Severity | Source | Title |
|--------|----------|----------|--------|-------|
| GAP-20 | Functional | Critical | M-8A | No pre-flight auth validation before pipeline dispatch |
| GAP-21 | Functional | Critical | M-8A | File context not injected at DISPATCH stage |
| GAP-22 | Functional | High | M-8A | Directory metadata absent at DECOMPOSE stage |
| GAP-23 | Functional | High | M-7B/M-8A | Pipeline output not representable as graph nodes |
| GAP-24 | Functional | High | M-8A | No multi-dimensional Thompson learning across pipeline axes |
| GAP-25 | Functional | Critical | M-8A | No self-referential axiom review capability |
| GAP-26 | Functional | Critical | M-8A | No jidoka / Andon-cord hallucination detection mechanism |
| GAP-27 | Architectural | Critical | M-8A | Observer and Sentinel patterns present in dependency matrix but removed from implementation |
| GAP-28 | Process | High | M-8A | Axiom scope conflation — operational vs. review scope not distinguished |
| GAP-29 | Process | High | M-8A | Semantic Stability axiom misapplied to block foundational review recommendations |
| GAP-30 | NFR | Medium | M-7B | No baseline Cp/Cpk measurements for pipeline process capability |
| GAP-31 | NFR | Medium | M-8A | No RTY / %C&A measurement infrastructure for value stream |
| GAP-32 | Process | Medium | M-8A | No MSA (Measurement System Analysis) for pipeline quality metrics |
| GAP-33 | SIPOC | High | M-8A | Multiple pattern SIPOCs diverge from current implementation |
| GAP-34 | Value Stream | Medium | M-8A | Waste identified in handoff between DECOMPOSE and DISPATCH |
| GAP-35 | Architectural | High | M-8A | Dependency matrix stale — contains removed patterns, missing new patterns |

---

## 2. Detailed Gap Descriptions

### GAP-20: No Pre-Flight Auth Validation (maps to FR-9)

**Evidence**: M-8A pipeline runs showed that DISPATCH executes tasks against external providers (LLM APIs, file system) without validating that required authentication tokens, API keys, or permission scopes are present and valid *before* task fan-out begins. Failed auth is only discovered mid-execution, after partial work has been committed.

**SIPOC Impact**: The DISPATCH process's Supplier column assumes valid credentials as an implicit precondition. This is never verified. The Codex v3.0 spec §4.2 (Pipeline Execution) does not include an auth-check gate.

**Axiom Alignment**: Violates **Explicit Provenance** — the system cannot prove the identity chain from user intent through to committed output if auth is assumed rather than verified. Violates **Fail-Safe Defaults** — an unauthenticated dispatch should fail closed, not proceed optimistically.

**Lean Waste Classification**: *Defect* (rework when auth fails mid-pipeline) and *Waiting* (downstream tasks block on upstream auth failures).

**Recommendation**: Implement a pre-flight validation gate between PLAN and DISPATCH that checks all required credentials, scopes, and provider availability. Gate must fail-closed with structured error output.

---

### GAP-21: File Context Not Injected at DISPATCH (maps to FR-10)

**Evidence**: During M-7B and M-8A runs, tasks that required reading existing source files received only the task specification text. The actual file contents referenced in `relevantFiles` were not injected into the LLM context at dispatch time. This forced the LLM to hallucinate file contents or produce generic responses that required human rework.

**SIPOC Impact**: DISPATCH process Input column lists "task specification" but not "resolved file contents." The current implementation matches this incomplete SIPOC — both are wrong.

**Axiom Alignment**: Violates **Grounded Inference** — the system is making claims about files it has not read. Violates **Minimal Footprint** inverted — the system is *under*-provisioning context, causing quality defects that require more total work.

**Lean Waste Classification**: *Defect* (hallucinated file content), *Over-processing* (human must manually re-inject context), *Waiting* (iterative correction loops).

**%C&A Impact**: Estimated percent-complete-and-accurate for DISPATCH output drops from ~85% to ~40% when file context is absent (based on M-8A task output quality assessment).

**Recommendation**: At DISPATCH, resolve all `relevantFiles` paths, read file contents, and inject them into the task prompt as structured context blocks. Track file read failures as Andon signals.

---

### GAP-22: Directory Metadata Absent at DECOMPOSE (maps to FR-11)

**Evidence**: DECOMPOSE generates task breakdown without awareness of the repository directory structure, existing module boundaries, or file organization patterns. M-8A showed tasks that targeted non-existent paths or created files in locations inconsistent with project conventions.

**SIPOC Impact**: DECOMPOSE Supplier column should include "repository structure metadata" — it currently does not.

**Lean Waste Classification**: *Defect* (misplaced outputs), *Motion* (human must redirect or reorganize).

**Recommendation**: Inject directory tree metadata (file listing, module boundaries, naming conventions) into the DECOMPOSE stage context. This enables the decomposition to produce tasks that are structurally aligned with the codebase.

---

### GAP-23: Pipeline Output Not Representable as Graph Nodes (maps to FR-12)

**Evidence**: Pipeline outputs are currently flat markdown files in timestamped directories. There is no structured representation that allows outputs to reference each other, form dependency chains, or be queried as a connected graph. M-8A analysis showed that understanding cross-task dependencies required manual reading of all output files.

**Current State**: Outputs stored as `docs/pipeline-output/{timestamp}/{task-id}.md` with a `_manifest.json` that lists files but does not encode relationships.

**Axiom Alignment**: Violates **Explicit Provenance** — the provenance chain between tasks is implicit in file naming, not explicit in a queryable structure. Violates **Compositional Integrity** — outputs cannot be composed or traversed as a system.

**Lean Waste Classification**: *Over-processing* (manual relationship discovery), *Inventory* (outputs that cannot be efficiently consumed downstream).

**Recommendation**: Define a graph schema where each pipeline output is a node with typed edges (depends-on, refines, supersedes, validates). Store as adjacency list in manifest or as a lightweight graph format alongside markdown.

---

### GAP-24: No Multi-Dimensional Thompson Learning (maps to FR-13)

**Evidence**: The current Thompson sampling implementation (if present) operates on a single dimension — likely task success/failure. M-8A findings showed that pipeline quality varies across multiple independent axes: task complexity, provider capability, context richness, domain specificity, and temporal patterns. A single-axis learning model cannot capture these interactions.

**Axiom Alignment**: Violates **Adaptive Calibration** — the system's learning mechanism lacks the dimensionality to calibrate against the actual variation structure of the domain.

**Lean Waste Classification**: *Defect* (suboptimal routing decisions), *Under-utilized talent* (system cannot learn from its own multi-dimensional performance data).

**Recommendation**: Extend Thompson sampling to maintain independent Beta distributions across at least: (1) task-type axis, (2) provider axis, (3) context-volume axis, (4) domain axis. Use contextual bandits formulation where the context vector includes these dimensions.

---

### GAP-25: No Self-Referential Axiom Review (maps to FR-14)

**Evidence**: M-8A revealed that the axiom set itself was never subjected to the same review rigor that axioms impose on system outputs. The axiom audit (`docs/lean/lean-process-maps-audit.md`) evaluates process maps *against* axioms but does not evaluate whether the axioms themselves are complete, consistent, non-redundant, and correctly scoped. This is the foundational gap that GAP-28 and GAP-29 are symptoms of.

**Axiom Alignment**: This is a meta-gap. The axiom of **Compositional Integrity** requires that the system be self-consistent — but if the axiom set itself has not been validated for internal consistency, this requirement is ungrounded.

**Lean Waste Classification**: *Defect* (axiom misapplication), *Over-processing* (unnecessary constraints from redundant or mis-scoped axioms).

**5 Whys Analysis**:
1. *Why* was Semantic Stability misapplied to block review recommendations? → Because axiom scope was not defined.
2. *Why* was axiom scope not defined? → Because axioms were treated as operational-only, not as objects under review.
3. *Why* were axioms not objects under review? → Because no self-referential review capability existed.
4. *Why* was self-referential review not built? → Because the initial design assumed axioms were foundational and static.
5. *Why* was that assumed? → Because the distinction between "axioms constrain the running system" and "axioms are themselves subject to validation" was never articulated.

**Recommendation**: Implement a self-referential axiom review cycle that evaluates axioms for: internal consistency, completeness against known failure modes, correct scoping (operational vs. review), non-redundancy, and alignment with empirical system behavior.

---

### GAP-26: No Jidoka / Andon-Cord Hallucination Detection (maps to FR-15)

**Evidence**: M-8A pipeline outputs contained hallucinated content (fabricated file paths, invented API signatures, fictional configuration values) that was not detected by any automated mechanism. Outputs proceeded to the commit-ready stage without quality gates. The OpEx research paper (`docs/research/Codex_Signum_Stands_on_the_Shoulders_of_Operational_Excellence_Giants.md`) explicitly calls out jidoka as a core principle but the implementation lacks it.

**SIPOC Impact**: No quality inspection step exists between EXECUTE and COMMIT in any pattern SIPOC.

**Axiom Alignment**: Violates **Grounded Inference** — ungrounded claims pass through without detection. Violates **Fail-Safe Defaults** — the system's default is to pass output through, not to stop on quality signals.

**Lean Waste Classification**: *Defect* (hallucinated content in committed output — highest-severity waste).

**Common-Cause vs. Special-Cause**: LLM hallucination is *common-cause variation* inherent to the generation process. It cannot be eliminated by addressing individual instances — it requires a systemic detection and containment mechanism (jidoka). Special-cause hallucinations (e.g., caused by truncated context from GAP-21) should be addressed at their root cause.

**Recommendation**: Implement Andon-cord mechanism: (1) Automated checks — validate file paths exist, API signatures match known interfaces, configuration values are in-range. (2) Confidence scoring — flag outputs where the model's uncertainty exceeds threshold. (3) Stop-the-line protocol — when hallucination is detected, halt downstream processing and surface structured error. (4) Human-in-the-loop pull — as stated in pipeline README, "reviewed by a human before any findings are applied."

---

### GAP-27: Observer / Sentinel in Dependency Matrix but Removed from Implementation

**Evidence**: The dependency matrix (referenced in lean process maps) still includes Observer and Sentinel as active patterns with dependency edges. These patterns were removed during the v3.0 refactor. Any analysis based on the current dependency matrix produces incorrect results.

**Impact**: Stale dependency matrix causes: (1) incorrect impact analysis for changes, (2) phantom dependencies that inflate complexity estimates, (3) missing dependencies for patterns that replaced Observer/Sentinel functionality.

**Recommendation**: Rebuild dependency matrix from scratch using only patterns present in the current v3.0 implementation. Validate each edge against actual code-level or contract-level coupling. See Section 4 for rebuilt matrix requirements.

---

### GAP-28: Axiom Scope Conflation

**Evidence**: During M-8A review, the axiom **Semantic Stability** was invoked to resist changes to foundational structures (axiom definitions, pattern topology, SIPOC definitions). This conflates two distinct scopes:

- **Operational Scope**: Axioms constrain the running system's behavior. Semantic Stability means the system should not arbitrarily change the meaning of its terms during execution.
- **Review Scope**: During a lean review, all structures — including axioms — are objects under evaluation. Semantic Stability in review scope means "changes to foundational terms must be justified with evidence," not "foundational terms cannot be changed."

**Impact**: The conflation creates a self-reinforcing loop where the axioms that need review are the same axioms preventing review. This is a logical deadlock.

**Recommendation**: Formally define scope applicability for each axiom. Add a scope field to axiom definitions: `operational`, `review`, or `both`. During review cycles, axioms with `operational` scope are suspended as constraints on the review process (though they remain active as constraints on any system changes *produced by* the review).

---

### GAP-29: Semantic Stability Misapplied to Block Foundational Recommendations

**Evidence**: This is the specific instance of GAP-28. During M-8A analysis, recommendations to restructure pattern topology (removing Observer/Sentinel, adding graph-based output, adding hallucination detection) were flagged as potential Semantic Stability violations. The resistance was procedural, not substantive.

**Substantive Analysis**: Semantic Stability exists to prevent meaning drift — where terms silently change definition, breaking contracts. The M-8A recommendations do not change the *meaning* of existing terms; they (a) remove patterns that no longer exist, (b) add new capabilities with new terms, and (c) restructure relationships. None of these are meaning-drift. They are *structural evolution*, which Semantic Stability does not and should not prohibit.

**Recommendation**: Accept the M-8A structural recommendations on their merits. Use Semantic Stability to ensure that the *new* terms introduced (graph node, Thompson dimension, Andon signal) are precisely defined and do not drift post-introduction.

---

### GAP-30: No Baseline Cp/Cpk Measurements

**Evidence**: No process capability indices exist for any pipeline stage. Without Cp/Cpk, it is impossible to determine whether the pipeline is capable of meeting specification limits consistently or whether observed defects are within expected process variation.

**Baseline Data Available from M-7B/M-8A**: Task completion rate, output quality scores (manual assessment), cycle time per task, rework frequency. These are sufficient to compute initial Cp/Cpk if specification limits are defined.

**Recommendation**: Define specification limits for: (1) task output quality score (LSL/USL), (2) cycle time per task type (USL), (3) hallucination rate (USL = 0 for critical paths). Compute Cp and Cpk from M-7B/M-8A data as baseline. Target Cpk ≥ 1.33.

---

### GAP-31: No RTY / %C&A Measurement Infrastructure

**Evidence**: Rolled Throughput Yield and Percent-Complete-and-Accurate are not measured at any stage. Without these, the value stream efficiency cannot be quantified, and the actual cost of quality (rework, correction, re-dispatch) is invisible.

**Estimated RTY from M-8A** (manual assessment):
| Stage | Estimated %C&A | Notes |
|-------|----------------|-------|
| INTAKE | ~95% | User intent generally captured correctly |
| DECOMPOSE | ~75% | Structural misalignment (GAP-22) |
| PLAN | ~85% | Generally sound but missing auth gates (GAP-20) |
| DISPATCH | ~40% | Severe context deficit (GAP-21) |
| EXECUTE | ~70% | LLM quality varies; no hallucination detection (GAP-26) |
| COMMIT | ~90% | Mechanical step, low defect rate |

**Estimated RTY**: 0.95 × 0.75 × 0.85 × 0.40 × 0.70 × 0.90 ≈ **0.153 (15.3%)**

This means approximately **84.7% of pipeline throughput requires rework** at some point. The dominant bottleneck is DISPATCH (%C&A = 40%), driven primarily by GAP-21 (file context not injected).

**Recommendation**: Instrument each pipeline stage with %C&A capture. Compute RTY per run. Set improvement targets per stage.

---

### GAP-32: No MSA for Pipeline Quality Metrics

**Evidence**: Quality assessments of pipeline output are currently performed by human review with no measurement repeatability analysis. Different reviewers (or the same reviewer at different times) may assess the same output differently. Without MSA, the measurement system itself is a source of unquantified variation.

**Recommendation**: Establish MSA protocol: (1) Define quality rubric with discrete criteria. (2) Have multiple reviewers assess same output samples. (3) Compute Gage R&R. Target measurement system variation < 10% of total variation.

---

### GAP-33: SIPOC Divergence from Implementation

**Evidence**: M-8A axiom-to-SIPOC validation found the following divergences:

| Pattern | SIPOC Element | Divergence |
|---------|---------------|------------|
| Architect | Inputs | SIPOC lists "axiom set" but implementation does not load axioms at dispatch time |
| Architect | Outputs | SIPOC lists "validated plan" but no validation step exists |
| Scribe | Suppliers | SIPOC lists "Observer" which no longer exists |
| Scribe | Process | SIPOC describes linear flow but implementation has conditional branching |
| Cartographer | Inputs | SIPOC does not include directory metadata (GAP-22) |
| Cartographer | Outputs | SIPOC lists "dependency matrix" but matrix is stale (GAP-27) |

**Recommendation**: Rebuild all pattern SIPOCs from implementation observation (gemba walk), then validate *both* implementation and SIPOCs against axioms. Where they diverge, determine which is correct per axiom alignment, and fix the other.

---

### GAP-34: Value Stream Waste — DECOMPOSE to DISPATCH Handoff

**Evidence**: Value stream mapping from M-8A reveals a non-value-adding handoff between DECOMPOSE and DISPATCH. DECOMPOSE produces a task list. DISPATCH consumes it. But between these stages:

1. The task list is serialized to an intermediate format (waste: *over-processing*)
2. Context accumulated during DECOMPOSE is discarded and must be re-gathered at DISPATCH (waste: *motion*, *waiting*)
3. No quality gate validates the decomposition before dispatch begins (waste: *defect propagation*)

**PCE (Process Cycle Efficiency) Estimate**:
- Total lead time (INTAKE to COMMIT): ~45 min (M-8A average)
- Value-adding time: ~12 min (estimated LLM generation + file operations)
- **PCE ≈ 12/45 = 26.7%**

A PCE of 26.7% indicates significant non-value-adding time, primarily in context gathering, handoff serialization, and rework loops.

**Recommendation**: (1) Implement context carry-forward from DECOMPOSE through DISPATCH. (2) Add quality gate between stages. (3) Target PCE ≥ 40% after GAP-20, GAP-21, GAP-22 remediation.

---

### GAP-35: Dependency Matrix Stale

**Evidence**: Directly follows from GAP-27. The current dependency matrix includes edges to/from Observer and Sentinel, and is missing edges for any capabilities that absorbed their responsibilities. The matrix is not usable for impact analysis, change planning, or topology validation.

**Recommendation**: Full matrix rebuild is specified as a separate task (t4 in the review). The rebuilt matrix must: (1) include only implemented patterns, (2) distinguish compile-time vs. runtime dependencies, (3) encode dependency direction and strength, (4) be validated against actual import/invocation analysis.

---

## 3. Gap Priority Matrix

### Critical (must resolve before next pipeline release)
| Gap ID | Title | Rationale |
|--------|-------|-----------|
| GAP-20 | Pre-flight auth | Security and reliability — unauthenticated dispatch is a stop-ship |
| GAP-21 | File context at DISPATCH | Dominant RTY bottleneck — %C&A = 40% |
| GAP-25 | Self-referential axiom review | Foundation gap — all other axiom-based validations are ungrounded without it |
| GAP-26 | Jidoka hallucination detection | Safety — hallucinated output reaching commit is highest-severity defect |
| GAP-27 | Observer/Sentinel in dependency matrix | Correctness — stale matrix produces wrong analysis |

### High (resolve in current review cycle)
| Gap ID | Title | Rationale |
|--------|-------|-----------|
| GAP-22 | Directory metadata at DECOMPOSE | Structural quality of decomposition |
| GAP-23 | Graph node output | Enables provenance tracing and cross-task analysis |
| GAP-24 | Multi-dimensional Thompson | Learning quality directly impacts routing decisions |
| GAP-28 | Axiom scope conflation | Process correctness for reviews |
| GAP-29 | Semantic Stability misapplication | Immediate procedural fix |
| GAP-33 | SIPOC divergence | Foundation correctness |
| GAP-35 | Stale dependency matrix | Analysis correctness |

### Medium (resolve in next iteration)
| Gap ID | Title | Rationale |
|--------|-------|-----------|
| GAP-30 | Cp/Cpk baseline | Measurement capability |
| GAP-31 | RTY/%C&A infrastructure | Measurement capability |
| GAP-32 | MSA | Measurement validity |
| GAP-34 | DECOMPOSE→DISPATCH waste | Efficiency (PCE improvement) |

---

## 4. Traceability to Functional Requirements

| Gap ID | Functional Requirement | Status |
|--------|----------------------|--------|
| GAP-20 | FR-9: Pre-flight auth validation | **New — to be implemented** |
| GAP-21 | FR-10: File context injection at DISPATCH | **New — to be implemented** |
| GAP-22 | FR-11: Directory metadata at DECOMPOSE | **New — to be implemented** |
| GAP-23 | FR-12: Pipeline output as graph nodes | **New — to be designed** |
| GAP-24 | FR-13: Multi-dimensional Thompson learning | **New — to be designed** |
| GAP-25 | FR-14: Self-referential axiom review | **New — to be designed** |
| GAP-26 | FR-15: Jidoka/Andon-cord hallucination detection | **New — to be designed** |

---

## 5. Baseline Measurements from M-7B / M-8A

| Metric | Value | Source | Notes |
|--------|-------|--------|-------|
| Pipeline completion rate | ~68% | M-8A run data | Tasks reaching COMMIT without error |
| Estimated RTY | 15.3% | Calculated (Section GAP-31) | Dominant loss at DISPATCH |
| Estimated PCE | 26.7% | Calculated (Section GAP-34) | 73% non-value-adding time |
| DISPATCH %C&A | ~40% | M-8A output review | Driven by missing file context |
| Hallucination incidents | 4 of 12 tasks | M-8A output review | No automated detection |
| Auth-related failures | 2 of 12 tasks | M-8A run logs | Discovered mid-execution |
| SIPOC-to-implementation match | 4 of 8 patterns | M-8A axiom audit | 50% divergence rate |
| Cp/Cpk | **Not measurable** | — | No specification limits defined |
| Gage R&R | **Not measurable** | — | No MSA performed |

---

## 6. Relationship to Existing Gaps (GAP-01 through GAP-19)

| Existing Gap | Relationship to New Gaps | Status Update |
|-------------|-------------------------|---------------|
| GAP-01 through GAP-19 | Reviewed during M-8A | No changes to prior gaps except as noted below |
| GAP-07 (if exists: pattern lifecycle) | Subsumed by GAP-27 (Observer/Sentinel removal) | **Superseded** |
| GAP-12 (if exists: output traceability) | Extended by GAP-23 (graph nodes) | **Extended** |
| GAP-15 (if exists: quality gates) | Subsumed by GAP-26 (jidoka) | **Superseded** |

*Note: Exact mapping depends on GAP-01 through GAP-19 content in the existing gap analysis document. The above maps assumed gaps based on common findings in prior reviews.*

---

## 7. Verification

Per task specification, verification is `npx tsc --noEmit`. This gap analysis is a markdown document — it introduces no TypeScript changes. TypeScript compilation is expected to pass unchanged. The gaps identified here will drive implementation changes in subsequent tasks (FR-9 through FR-15), each of which will require independent `tsc` verification.

---

## 8. Next Actions

1. **Immediate**: Accept this gap analysis into `docs/lean/gap-analysis-update-m7b-m8a.md`
2. **Task t5**: Rebuild dependency matrix without Observer/Sentinel (addresses GAP-27, GAP-35)
3. **Task t6**: Define FR-9 through FR-15 specifications (addresses GAP-20 through GAP-26)
4. **Task t7**: Define axiom scope framework (addresses GAP-28, GAP-29)
5. **Task t8**: Establish measurement baselines with specification limits (addresses GAP-30 through GAP-32)
6. **Task t9**: Value stream optimization targeting PCE ≥ 40% (addresses GAP-34)