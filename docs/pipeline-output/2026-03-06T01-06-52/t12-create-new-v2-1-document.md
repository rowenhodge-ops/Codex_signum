# Create new v2.1 document

> Task ID: t12
> Model: claude-opus-4-6:adaptive:medium
> Duration: 53194ms
> Output chars: 8558
> Timestamp: 2026-03-06T01:08:20.900Z

> **⚠️ Hallucination flags (11):**
> - [content/warning] Claims 2 axioms (canonical count is 9)
> - [content/warning] Task t12 references "src/computation/" but this file was not in its context
> - [content/warning] Task t12 references "docs/specs/codex-signum-v4_3-draft.md" but this file was not in its context
> - [content/warning] Task t12 references "src/patterns/thompson-router/" but this file was not in its context
> - [content/warning] Task t12 references "scripts/bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task t12 references "CLAUDE.md" but this file was not in its context
> - [content/warning] Task t12 references "src/computation/psi-h.ts" but this file was not in its context
> - [content/warning] Task t12 references "src/computation/epsilon-r.ts" but this file was not in its context
> - [content/warning] Task t12 references "docs/specs/codex-signum-engineering-bridge-v2_0.md" but this file was not in its context
> - [content/warning] Task t12 references "codex-signum-engineering-bridge-v2_0.md" but this file was not in its context
> - [content/warning] Task t12 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# Analysis: Engineering Bridge v2.1 — Initial Structure (t12)

## 1. Situation Assessment

### 1.1 File Status
The target file `docs/specs/codex-signum-engineering-bridge-v2_1.md` does not exist. This is correctly flagged as a DECOMPOSE defect — the task references it as a relevant file to read, but t12's entire purpose is to *create* it. No circular dependency exists; the task is simply the first in a creation chain.

### 1.2 Scope Derived from Intent
The intent document specifies **six major workstreams** that the v2.1 Bridge must cover. Each maps to one or more required top-level sections:

| Workstream | Required Sections | Key Artifacts to Reference |
|---|---|---|
| (1) Formula audit | Corrected formula catalog, delta table vs v2.0 | `src/computation/`, `docs/specs/codex-signum-v4_3-draft.md` |
| (2) Bridge View Principle | Normative constraint section, compliance matrix | Grammar morpheme definitions, axiom parameter list |
| (3) Build experience | Thompson priors, hallucination detection, CLAUDE.md governance, M-9.VA convergence | `src/patterns/thompson-router/`, `scripts/bootstrap-task-executor.ts`, `CLAUDE.md` |
| (4) Vertical wiring interface | 7 interface-point specifications | Code on both sides of each interface |
| (5) PsiH temporal decomposition + epsilon-R spectral calibration | Dedicated computation sections | `src/computation/psi-h.ts`, `src/computation/epsilon-r.ts` |
| (6) Supersession notice | Front-matter or appendix notice pointing at v2.0 | `docs/specs/codex-signum-engineering-bridge-v2_0.md` |

## 2. Findings

### 2.1 The v2.0 Document Provides Structural Precedent
The reference spec `codex-signum-engineering-bridge-v2_0.md` establishes the existing organizational pattern. The v2.1 structure must be a **superset** — retaining section numbering continuity where possible so downstream references (in code comments, CLAUDE.md, milestone trackers) don't break silently. Sections that are removed or merged should be noted in a compatibility appendix.

### 2.2 Three Stale Formulas Are Explicitly Called Out
The intent names three specific corrections:
1. **Dampening formula**: Must become budget-capped `min(γ_base, s/k)` — the old `k−1` divisor form is retired.
2. **Axiom count**: 9, not 10. One axiom was removed or merged in v4.3.
3. **Unified hub dampening**: A single hub dampening model replaces whatever per-component variants existed.

These corrections are the *minimum* audit surface. The structure must include a section broad enough to capture additional corrections discovered during later tasks.

### 2.3 The 7 Vertical Wiring Interface Points Are Enumerated
The intent lists them explicitly:
1. Observation → Conditioning
2. Conditioning → PhiL (Φ_L)
3. PhiL → Maturity
4. Node → Container
5. Graph → PsiH (Ψ_H)
6. State → Events
7. Recovery → Hysteresis

Each requires a four-column specification: **producer function**, **consumer function**, **missing glue**, **implementing milestone**. The document structure needs a subsection template for each.

### 2.4 Bridge View Principle Is Normative, Not Informational
Workstream (2) elevates the Bridge View Principle to a **normative constraint** — meaning it must appear early in the document (after front-matter, before formulas) and every subsequent formula section must be auditable against it. This implies a compliance column or annotation in formula tables.

### 2.5 Build Experience Is Unprecedented in Bridge Documents
Workstream (3) introduces implementation-derived knowledge that has no precedent in v2.0. This is a new category of content. It should be clearly separated (its own top-level section) so that readers expecting a pure spec-to-engineering translation can skip it, while implementors treat it as essential context.

## 3. Recommended Document Structure

Based on the analysis, the v2.1 document should have the following skeleton:

```
§0  Front Matter
    §0.1  Title, version, date, authors
    §0.2  Supersession notice (v2.0 is retired; pointer to archived file)
    §0.3  Scope statement
    §0.4  Notation and conventions
    §0.5  Relationship to Codex Signum v4.3 spec

§1  Bridge View Principle (Normative)
    §1.1  Statement of the principle
    §1.2  Definitions: grammar-defined morpheme states, axiom-defined parameters
    §1.3  Compliance requirements for all subsequent formulas
    §1.4  Violation examples and remediation pattern

§2  Axiom and Parameter Reference
    §2.1  The 9 axioms (enumerated, with v4.3 cross-references)
    §2.2  Parameter table (symbol, type, source, default, axiom owner)
    §2.3  Delta from v2.0 (what changed, what was removed)

§3  Corrected Formula Catalog
    §3.1  Dampening: budget-capped min(γ_base, s/k)
    §3.2  Unified hub dampening
    §3.3  [Placeholder for additional corrected formulas discovered during audit]
    §3.4  Formula-to-source traceability matrix
    §3.5  Bridge View Principle compliance annotations

§4  PsiH (Ψ_H) Temporal Decomposition
    §4.1  Mathematical formulation
    §4.2  Code mapping to src/computation/psi-h.ts
    §4.3  Temporal components and their semantics
    §4.4  Edge cases and boundary behavior

§5  Epsilon-R (ε_R) Spectral Calibration
    §5.1  Calibration model
    §5.2  Code mapping to src/computation/epsilon-r.ts
    §5.3  Spectral parameters and tuning
    §5.4  Convergence properties

§6  Vertical Wiring Interface
    §6.1  Overview and data-flow diagram
    §6.2  Interface 1: Observation → Conditioning
    §6.3  Interface 2: Conditioning → PhiL (Φ_L)
    §6.4  Interface 3: PhiL → Maturity
    §6.5  Interface 4: Node → Container
    §6.6  Interface 5: Graph → PsiH (Ψ_H)
    §6.7  Interface 6: State → Events
    §6.8  Interface 7: Recovery → Hysteresis
    (Each §6.x contains: producer function, consumer function, 
     missing glue, implementing milestone)

§7  Build Experience and Implementation Notes
    §7.1  Thompson-informed priors and context-blocked posteriors
           (src/patterns/thompson-router/)
    §7.2  Three-layer hallucination detection
           (scripts/bootstrap-task-executor.ts)
    §7.3  CLAUDE.md governance files as persistent agent context
    §7.4  M-9.VA verification convergence data
    §7.5  Lessons learned and anti-patterns

§8  Governance and Lifecycle
    §8.1  How this document is maintained
    §8.2  Change-control process
    §8.3  Verification: npx tsc --noEmit as gate

Appendix A  v2.0 → v2.1 Migration Guide
Appendix B  Full formula delta table
Appendix C  Glossary
```

## 4. Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Later tasks (formula audit, code reading) discover the structure needs sections not anticipated here | Medium | Use explicit placeholder subsections (§3.3) and a "this structure is extensible" note in §0.3 |
| Section numbering conflicts with v2.0 references in codebase | Low | Appendix A provides a mapping table; a grep for `v2_0` references should accompany the supersession |
| The 7 interface points may not all have code on both sides yet | High | The §6.x template explicitly includes a "missing glue" column — absence of code is a valid finding, not a blocker |
| `npx tsc --noEmit` verification is irrelevant to a .md file | Low | The verification gate applies to the broader task chain; for t12 specifically, verification is "file exists and parses as valid UTF-8 markdown" |

## 5. Recommendations

1. **Create the file with the skeleton above as the initial commit for t12.** The acceptance criteria ("file created with basic structure, header and sections outlined") are satisfied by a well-commented skeleton with TODO markers in each section body.

2. **Use HTML comments or `<!-- TODO -->` markers** in each section to signal to subsequent tasks exactly what content is expected and which workstream populates it.

3. **Place the supersession notice (§0.2) immediately**, even in the skeleton, so that any reader who finds the file early knows v2.0 is being replaced.

4. **Pin the axiom count to 9 in §2.1** from the start — this is a known correction and should not wait for the full formula audit task.

5. **Ensure UTF-8 encoding explicitly** — the file should begin without a BOM and use only UTF-8 characters. Mathematical symbols (Ψ, Φ, γ, ε) should use actual Unicode code points, not LaTeX escapes, unless a rendering pipeline is confirmed.

6. **The Bridge View Principle (§1) must precede all formula content** — its normative status means it constrains everything that follows. Placing it after front matter and before the formula catalog enforces this reading order.