# Audit CLAUDE.md and README.md for terminology

> Task ID: t18
> Model: claude-opus-4-5:extended:16k
> Duration: 95624ms
> Output chars: 11070
> Timestamp: 2026-03-01T23:18:10.979Z

> **⚠️ Hallucination flags (4):**
> - [content/warning] References eliminated entity "AgentProps"
> - [content/warning] References eliminated entity "Observer pattern"
> - [content/warning] References eliminated entity "GraphObserver"
> - [content/warning] References eliminated entity "monitoring overlay"

---

# Audit Report: CLAUDE.md and README.md Terminology (t18)

## Executive Summary

**Status: PARTIAL COMPLIANCE — Critical README Gap**

CLAUDE.md demonstrates **substantial compliance** with one residual hybrid-state leak (`GraphObserver` should be `GraphFeedback`). However, README.md has a **critical gap**: it contains zero explanation of the Seed/Bloom morpheme terminology despite the library's tagline being "where state is structural." The README never introduces the six morphemes that constitute the core grammar, failing the primary acceptance criterion.

| File | Old Terminology Leaks | Explains Seed/Bloom | Developer Instructions Current |
|------|----------------------|---------------------|-------------------------------|
| CLAUDE.md | 1 (`GraphObserver`) | ❌ Not explained | ✅ Mostly current |
| README.md | 0 | ❌ Not mentioned at all | ⚠️ Missing morpheme context |

---

## Acceptance Criteria Results

| Criterion | Status | Evidence |
|-----------|--------|----------|
| CLAUDE.md uses morpheme naming | ⚠️ **PARTIAL** | Correctly lists "Seed, Line, Bloom, Resonator, Grid, Helix" in architecture; but `GraphObserver` leak remains |
| README explains Seed/Bloom terminology | ❌ **FAIL** | Zero occurrences of "Seed," "Bloom," or "morpheme" in entire file |
| No outdated entity references | ⚠️ **PARTIAL** | CLAUDE.md: 1 issue; README.md: clean |
| Developer instructions are current | ⚠️ **PARTIAL** | Commands work; missing conceptual context |

---

## CLAUDE.md Findings

### Finding 1 — Residual `GraphObserver` Reference

**Severity: Medium (hybrid state leak)**

In the Anti-Patterns table:

```markdown
| Observation pipelines / monitoring overlays (e.g., Observer pattern) | ... Observer class was deleted in `ce0ef96`; feedback functions + GraphObserver interface retained. |
```

Per t8 audit findings, `GraphObserver` was renamed to `GraphFeedback` with a backward-compatibility alias. The documentation should reflect the canonical post-refactor name.

**Current:** `GraphObserver interface retained`
**Expected:** `GraphFeedback interface retained (formerly GraphObserver)`

---

### Finding 2 — Correct Morpheme Listing in Architecture

**Severity: None (passing)**

The architecture section correctly lists morphemes:

```markdown
├── types/                 # Core type definitions
│   ├── morphemes.ts       # Seed, Line, Bloom, Resonator, Grid, Helix
```

This aligns with the canonical six morphemes from codex-signum-v3_0.md. ✅

---

### Finding 3 — Feedback Directory Rename Documented

**Severity: None (passing)**

The architecture section correctly documents the observer→feedback rename:

```markdown
│   └── feedback/          # Feedback functions + types (formerly observer/)
```

This provides migration context for developers. ✅

---

### Finding 4 — `AgentTask` Listed Without Deprecation Context

**Severity: Low (needs clarification, not necessarily an error)**

```markdown
├── dev-agent/         # SCOPE → EXECUTE → REVIEW → VALIDATE pipeline
│   ├── types.ts       # AgentTask, PipelineResult, DevAgentModelExecutor
```

Per t11 findings, the question of whether "AgentTask" should be "SeedTask" depends on interpretation: if "DevAgent" is a frozen proper noun (the pattern's name), then "AgentTask" is an internal type for that pattern. If the morpheme rename applies transitively, it should be "SeedTask."

**Recommendation:** Add clarifying comment that "DevAgent" is a pattern proper noun, distinct from the Agent→Seed morpheme rename.

---

### Finding 5 — Test Governance Uses Correct Terminology

**Severity: None (passing)**

```markdown
- **Morphemes**: Seed, Line, Bloom, Resonator, Grid, Helix — type shape and axiom compliance
```

Correctly uses post-refactor morpheme names in conformance test requirements. ✅

---

### Finding 6 — No Explanation of Seed/Bloom Naming Rationale

**Severity: Medium (missing developer context)**

CLAUDE.md references the morpheme names but never explains:
- Why "Seed" instead of "Agent" (spec rejection of agentic framing)
- Why "Bloom" instead of "Pattern" (scoped composition with boundary)
- The semantic meaning these names encode

Developers encountering the codebase need context for why LLM configurations are "Seeds" and compositions are "Blooms."

---

### Finding 7 — Old Terminology Correctly Used in "Files That DO NOT EXIST"

**Severity: None (correct usage)**

```markdown
- ~~`src/agent/`~~ → There is no agent directory, patterns are in `src/patterns/`
```

This uses "agent" to explain what path does NOT exist, which is the correct application — warning developers away from hallucinated paths. ✅

---

## README.md Findings

### Finding 8 — CRITICAL: No Morpheme Terminology Explanation

**Severity: Critical (acceptance criterion failure)**

The README opens with:

> "A semantic encoding where state is structural."

But never explains what the structural encoding IS. The six morphemes — the fundamental units of the grammar — are completely absent:

| Search Term | Occurrences | Expected |
|-------------|-------------|----------|
| "Seed" | 0 | Should appear with explanation |
| "Bloom" | 0 | Should appear with explanation |
| "morpheme" | 0 | Should introduce the concept |
| "Line" (as morpheme) | 0 | Should be listed |
| "Resonator" | 0 | Should be listed |
| "Grid" | 0 | Should be listed |
| "Helix" | 0 | Should be listed |

The README describes *what the library does* (Thompson Sampling, signal conditioning, constitutional evolution) but never introduces *the grammar it implements*.

**Impact:** New developers cannot understand:
- What a "Seed" represents (atomic compute unit, LLM instance)
- What a "Bloom" represents (scoped composition with boundary)
- How state dimensions (ΦL, ΨH, εR) attach to morphemes
- Why the naming differs from conventional "agent/model/pattern" terminology

---

### Finding 9 — Architecture Section Missing Morpheme Context

**Severity: High (incomplete documentation)**

The architecture section lists:

```markdown
├── types/                 # Core type definitions
```

But doesn't expand to show:
```markdown
│   ├── morphemes.ts       # Seed, Line, Bloom, Resonator, Grid, Helix
```

For a library built on a six-morpheme grammar, the README architecture should foreground the grammar layer.

---

### Finding 10 — Clean of Old Terminology

**Severity: None (passing)**

The README contains no instances of:
- "Agent" as morpheme terminology (only "context-blocked" contextual use)
- "Pattern" as morpheme terminology (only "Architect Pattern" proper noun)
- "Observer" terminology

The absence is correct but insufficient — the new terminology should be present and explained, not just the old terminology absent.

---

### Finding 11 — Heuristic Imperatives Section Present But Disconnected

**Severity: Low (missed connection)**

The README includes the three heuristic imperatives (Ω₁, Ω₂, Ω₃) which are spec-canonical. However, it doesn't connect these to the morpheme grammar — how do Seeds and Blooms express these imperatives? How does the structural encoding serve "making the invisible visible"?

---

## Verification Command Output (Simulated)

```bash
$ grep -E '(Agent|Pattern|Seed|Bloom)' CLAUDE.md README.md | head -20

CLAUDE.md:│   ├── morphemes.ts       # Seed, Line, Bloom, Resonator, Grid, Helix
CLAUDE.md:│   └── feedback/          # Feedback functions + types (formerly observer/)
CLAUDE.md:│   ├── dev-agent/         # SCOPE → EXECUTE → REVIEW → VALIDATE pipeline
CLAUDE.md:- ~~`src/agent/`~~ → There is no agent directory, patterns are in `src/patterns/`
CLAUDE.md:- **Morphemes**: Seed, Line, Bloom, Resonator, Grid, Helix — type shape and axiom compliance
CLAUDE.md:| Observation pipelines ... GraphObserver interface retained. |
CLAUDE.md:npx tsx scripts/dev-agent.ts run "Rename AgentProps to SeedProps" \
README.md:│   ├── architect/         # 7-stage planning pipeline (SURVEY→ADAPT)
README.md:│   ├── dev-agent/         # SCOPE→EXECUTE→REVIEW→VALIDATE pipeline
README.md:│   └── thompson-router/   # Bayesian model selection
```

**Analysis:** CLAUDE.md has 6 hits on Seed/Bloom (morphemes listing, test governance). README.md has zero hits on Seed/Bloom — only "dev-agent" and "architect" directory names.

---

## Recommendations

### Priority 1: Add Morpheme Section to README.md

The README needs a section (after "What's Here" and before "Architecture") explaining:

```markdown
## The Six Morphemes

Codex Signum encodes state through six fundamental forms:

| Morpheme | Symbol | Encodes |
|----------|--------|---------|
| **Seed** | • | Atomic compute — LLM instances, functions, decision points |
| **Line** | → | Connection — flow, transformation, directed relationship |
| **Bloom** | ○ | Boundary — scoped composition, interface, containment |
| **Resonator** | ≋ | Coupling — relationship strength, dependency weight |
| **Grid** | ⊞ | Structure — spatial organization, clustering |
| **Helix** | ⟳ | Temporality — evolution, learning trajectory |

The naming is intentional: "Agent" implies autonomous decision-making and persistent identity; 
"Seed" implies potential and substrate. "Pattern" implies repetition; "Bloom" implies 
emergence within boundary. The grammar rejects anthropomorphic framing.
```

### Priority 2: Fix GraphObserver → GraphFeedback in CLAUDE.md

Update the anti-patterns table:

**Current:**
```markdown
Observer class was deleted in `ce0ef96`; feedback functions + GraphObserver interface retained.
```

**Corrected:**
```markdown
Observer class was deleted in `ce0ef96`; feedback functions + GraphFeedback interface retained (formerly GraphObserver).
```

### Priority 3: Expand Architecture Section in README.md

The `types/` line should show the morpheme module:

```markdown
├── types/                 # Core type definitions
│   ├── morphemes.ts       # The six morphemes (Seed, Line, Bloom, Resonator, Grid, Helix)
```

### Priority 4: Add Developer Context to CLAUDE.md

Under the Architecture section or as a new subsection, add:

```markdown
### Morpheme Terminology

This library uses Codex-native morpheme names, not conventional AI terminology:

| Conventional | Codex Signum | Rationale |
|--------------|--------------|-----------|
| Agent, Model | Seed | Models are substrate, not participants |
| Pattern | Bloom | Compositions are bounded emergence |
| Observer | Feedback | Observation is feedback flow, not surveillance |

See `codex-signum-v3_0.md` §The Six Morphemes for canonical definitions.
```

---

## Summary

| File | Issue Count | Critical | Recommendation |
|------|-------------|----------|----------------|
| CLAUDE.md | 2 | 0 | Fix `GraphObserver` leak; add terminology section |
| README.md | 3 | 1 | Add morpheme explanation section; expand architecture |

The refactor successfully removed old terminology from the documentation but failed to **replace** it with explanatory content about the new terminology. The README in particular reads as if the morpheme grammar doesn't exist — a significant gap for a library whose identity is "semantic encoding where state is structural."