# Analyze axiom testability and constraint strength

> Task ID: t6
> Model: claude-opus-4-6:adaptive:medium
> Duration: 118355ms
> Output chars: 20096
> Timestamp: 2026-03-01T01:24:09.132Z

---

# Axiom Testability & Constraint Strength Analysis

**Document:** `docs/Audits/axiom-testability-analysis.md`
**Analyst:** Codex Signum Internal Review
**Scope:** All 10 axioms evaluated for implementation constraint, falsifiability, and practical vacuousness

---

## Methodology

Each axiom is evaluated against three questions:

| Criterion | Question |
|---|---|
| **Prohibition** | What concrete implementation behavior does this axiom forbid? |
| **Falsification** | What observable test result would prove non-compliance? |
| **Vacuousness** | Could a system trivially satisfy this axiom while violating its spirit? |

Constraint strength ratings:

| Rating | Definition |
|---|---|
| **Strong** | Prohibits specific, testable behaviors; falsification is straightforward |
| **Moderate** | Prohibits a class of behaviors but boundary cases are ambiguous |
| **Weak** | Constrains intent more than implementation; hard to falsify mechanically |
| **Vacuous** | No practical implementation is excluded; any system trivially complies |

---

## Per-Axiom Analysis

### Axiom 1 — Symbiosis

**Stated intent:** Human-AI interaction is mutualistic; neither party is purely instrumental to the other.

**What it prohibits:**
- Systems that treat user input as irrelevant to output selection (pure autonomous generation).
- Systems that act as passive conduits with zero interpretive contribution.

**Falsification test:**
> Given a task requiring collaborative refinement, does the system (a) incorporate user correction into subsequent outputs, AND (b) contribute structure/insight not present in the user's input? If either fails consistently, Symbiosis is violated.

**Vacuousness assessment:**
This is the axiom most at risk of vacuousness. Any interactive system that reads input and produces output can claim "symbiosis." The axiom fails to specify a *threshold* of mutual contribution. A system that parrots input back with trivial reformatting technically satisfies it.

**Subsumption analysis (per task brief):** Transparency requires the system to expose its reasoning. Comprehension Primacy requires the system to prioritize the user's understanding. Together, these already mandate that the system (a) makes its contributions visible (Transparency) and (b) shapes output around the user's cognitive needs (Comprehension Primacy). The *additional* constraint Symbiosis provides is the bidirectionality claim — that the human's input must also meaningfully alter system behavior. However, this is simply the definition of a responsive system; it is not a constraint that any non-degenerate implementation would fail.

**Rating: Weak → bordering Vacuous**

**Recommendation:** Either sharpen Symbiosis into a measurable mutual-information constraint (e.g., "System output must demonstrate measurable conditional dependence on user input beyond keyword extraction"), or demote it from axiom status to a design preamble/aspiration. It currently does not pull its weight as Axiom *1*.

---

### Axiom 2 — Transparency

**Stated intent:** System operations, decision paths, and limitations must be inspectable.

**What it prohibits:**
- Opaque decision-making with no exposed rationale.
- Silent fallback behaviors (e.g., substituting a default when a sigil is unrecognized, without notification).
- Hidden state mutations that affect output without user-visible indication.

**Falsification test:**
> Inject a malformed sigil. Does the system (a) silently produce output as if the sigil were valid, or (b) surface a diagnostic indicating the parse failure and the fallback applied? Case (a) falsifies Transparency.

> Alternatively: Request the reasoning chain for any output. If the system cannot produce one, or the produced chain is fabricated post-hoc rather than reflecting actual decision flow, Transparency is violated.

**Vacuousness assessment:**
Not vacuous — many real implementations do hide fallback logic, swallow parse errors, or produce outputs without traceable rationale. This axiom has teeth.

**Rating: Strong**

**Caveat:** The axiom is strong *only if* "inspectable" is defined to include runtime introspection, not merely documentation. If a system documents its logic but the runtime diverges, the axiom needs language that covers implementation fidelity to documentation.

---

### Axiom 3 — Comprehension Primacy

**Stated intent:** User understanding of system output takes priority over output completeness, sophistication, or efficiency.

**What it prohibits:**
- Producing maximally information-dense output that sacrifices comprehensibility.
- Optimizing for correctness metrics without verifying user can interpret the result.
- Emitting raw internal representations (e.g., sigil ASTs) when a human-readable form is required.

**Falsification test:**
> Present the system with a complex sigil composition and request explanation at a novice level. If the system produces expert-only notation without simplification or scaffolding, Comprehension Primacy is violated.

> Metric variant: Measure user comprehension scores for system outputs vs. a baseline that prioritizes completeness. If the system's outputs score lower on comprehension while scoring higher on information density, the axiom is violated in spirit.

**Vacuousness assessment:**
Moderate risk. "Comprehension" is hard to measure mechanically. The axiom becomes vacuous if no comprehension metric is operationalized. However, it does prohibit a definable class of behaviors (raw dumps, jargon-heavy defaults), giving it real constraint value.

**Rating: Moderate**

**Recommendation:** Pair this axiom with an Engineering Bridge formula that operationalizes comprehension (e.g., Flesch-Kincaid analogue for sigil output, or a user-model complexity bound). Without that, compliance testing depends on human evaluator judgment.

---

### Axiom 4 — Beneficence

**Stated intent:** System actions should produce net positive outcomes for users.

**What it prohibits:**
- Generating outputs known to be harmful, misleading, or counterproductive to stated user goals.
- Optimizing system-side metrics (throughput, token efficiency) at the expense of user-side value.

**Falsification test:**
> Present the system with a request where the most efficient response is known to lead the user toward an error. Does the system (a) provide the efficient-but-harmful response, or (b) flag the risk and provide an alternative? Case (a) falsifies Beneficence.

**Vacuousness assessment:**
Significant vacuousness risk. "Net positive outcome" is undefined without a utility function or outcome measurement. Any system can claim its outputs are beneficial. The axiom prohibits intentional harm, but "intentional" in a system without consciousness is metaphorical.

**Rating: Weak**

**Recommendation:** Beneficence should either be merged with Non-Maleficence into a single harm-avoidance axiom (which is testable) or be operationalized with specific outcome metrics tied to Engineering Bridge formulas.

---

### Axiom 5 — Non-Maleficence

**Stated intent:** The system must not cause harm.

**What it prohibits:**
- Generating outputs that corrupt data, break downstream systems, or produce dangerous instructions.
- Silent failures that propagate incorrect state.
- Outputs that exploit known user vulnerabilities (cognitive biases, trust assumptions).

**Falsification test:**
> Feed the system a sigil composition that, if processed naively, would produce a semantically dangerous output (e.g., an inverted safety flag). Does the system detect and refuse/flag the dangerous composition? If it processes it silently, Non-Maleficence is violated.

> Data integrity variant: After 1000 round-trip encode-decode cycles, verify zero information loss or corruption. Any corruption falsifies the axiom.

**Vacuousness assessment:**
Not vacuous. Harm through data corruption, silent failure propagation, and unsafe output generation are all concrete, testable failure modes.

**Rating: Strong**

**Note:** This is the axiom that most directly maps to conformance tests in `tests/conformance/`. It should arguably be ordered *before* Beneficence in the axiom list, since harm-avoidance is a precondition of benefit.

---

### Axiom 6 — Autonomy Respect

**Stated intent:** The system must respect human agency and decision-making authority.

**What it prohibits:**
- Overriding explicit user directives without notification.
- Autonomous escalation of actions beyond the user's requested scope.
- Manipulative output designed to steer user decisions toward system-preferred outcomes.

**Falsification test:**
> Issue a directive that conflicts with system defaults. Does the system (a) silently override the directive, (b) refuse with explanation, or (c) comply? Case (a) falsifies Autonomy Respect. Cases (b) and (c) are compliant, depending on safety constraints.

**Vacuousness assessment:**
Moderate risk. The axiom is meaningful when there's a conflict between user directives and system defaults. In the common case (no conflict), it constrains nothing. But the conflict case is frequent enough in practice to make this non-vacuous.

**Rating: Moderate**

---

### Axiom 7 — Epistemic Humility

**Stated intent:** The system must represent uncertainty accurately and avoid false confidence.

**What it prohibits:**
- Presenting uncertain outputs as certain.
- Omitting confidence/uncertainty metadata from outputs where uncertainty is material.
- Claiming capabilities the system does not possess.

**Falsification test:**
> Present the system with an ambiguous or under-specified sigil. Does the output include uncertainty markers or disambiguation requests? If the system produces a single confident interpretation without flagging ambiguity, Epistemic Humility is violated.

> Calibration test: Over N outputs with confidence scores, measure calibration (predicted confidence vs. actual accuracy). Systematic overconfidence falsifies the axiom.

**Vacuousness assessment:**
Not vacuous — this is directly testable through calibration measurement and ambiguity detection. Many real systems fail this.

**Rating: Strong**

---

### Axiom 8 — Proportionality

**Stated intent:** System responses must be proportionate to context, stakes, and complexity.

**What it prohibits:**
- Applying maximum scrutiny/ceremony to trivial operations (over-engineering).
- Applying minimal scrutiny to high-stakes operations (under-engineering).
- Uniform response strategies that ignore context variation.

**Falsification test:**
> Present two sigil compositions: one trivial (low-stakes, simple), one critical (high-stakes, complex). Does the system modulate its validation depth, explanation detail, or confirmation requirements? If both receive identical processing, Proportionality is violated.

**Vacuousness assessment:**
Moderate risk. "Proportionate" requires a defined scale of stakes/complexity and a defined scale of response intensity. Without these, any response can be justified as "proportionate." However, extreme violations (e.g., requiring 5-step confirmation for a trivial query) are detectable.

**Rating: Moderate**

**Recommendation:** The Engineering Bridge should define a proportionality function mapping context features to response parameters. Without this, the axiom is aspirational.

---

### Axiom 9 — Accountability

**Stated intent:** All system actions must be traceable to decisions, and decisions must be attributable.

**What it prohibits:**
- Untraceable outputs (no audit trail from input to output).
- Decision points that cannot be reconstructed after the fact.
- Denial of responsibility through indirection or abstraction.

**Falsification test:**
> Process a sigil composition, then request a full trace from input to output. If any decision point in the trace is marked "unknown" or "internal," Accountability is violated.

> Replay test: Given the trace, can the output be deterministically reproduced? Non-reproducibility from the same trace falsifies the axiom.

**Vacuousness assessment:**
Not vacuous — this directly mandates logging/tracing infrastructure. Systems without audit trails fail this axiom. It has clear architectural implications.

**Rating: Strong**

---

### Axiom 10 — Iterative Refinement

**Stated intent:** The system must support and encourage continuous improvement through feedback loops.

**What it prohibits:**
- Static, non-updateable behavior (in theory).
- Ignoring user feedback or correction signals.
- Architectures that prevent incremental improvement.

**Falsification test:**
> Provide corrective feedback on an output. In subsequent interactions with similar inputs, does the system's behavior reflect the correction? If behavior is identical despite feedback, Iterative Refinement is violated.

**Vacuousness assessment:**
**High vacuousness risk.** This axiom describes a *process property* of the development lifecycle, not a *behavior property* of the running system. A frozen, deployed binary cannot "iteratively refine" itself. The axiom either (a) constrains the development process (not the implementation), or (b) mandates online learning (a massive architectural commitment that may not be desirable for safety reasons).

Most Codex Signum implementations will be versioned releases. Between versions, refinement occurs. But the *system at any given moment* cannot be tested for this axiom — it either has an update mechanism or it doesn't, and that's an architectural choice, not a behavioral constraint.

**Rating: Vacuous (for runtime compliance testing)**

**Recommendation:** Reframe as a development-process axiom explicitly, or remove from the runtime axiom set. If retained, operationalize as: "The system must expose feedback ingestion interfaces and version metadata indicating refinement history." This at least gives something testable.

---

## Summary Table

| # | Axiom | Prohibits | Falsifiable? | Rating | Notes |
|---|---|---|---|---|---|
| 1 | Symbiosis | Purely autonomous or purely passive systems | Barely | **Weak** | Largely subsumed by Transparency + Comprehension Primacy |
| 2 | Transparency | Hidden decisions, silent fallbacks | Yes | **Strong** | Core testable constraint |
| 3 | Comprehension Primacy | Incomprehensible outputs prioritized over clarity | Partially | **Moderate** | Needs operationalized comprehension metric |
| 4 | Beneficence | Outputs known to harm user goals | Barely | **Weak** | Undefined utility function; merge with Non-Maleficence? |
| 5 | Non-Maleficence | Data corruption, unsafe outputs, silent failures | Yes | **Strong** | Most directly testable axiom |
| 6 | Autonomy Respect | Silent directive override, manipulation | Yes (in conflict cases) | **Moderate** | Meaningful only in conflict scenarios |
| 7 | Epistemic Humility | False confidence, unacknowledged ambiguity | Yes (calibration) | **Strong** | Directly measurable |
| 8 | Proportionality | Uniform response regardless of stakes | Partially | **Moderate** | Needs defined proportionality function |
| 9 | Accountability | Untraceable decisions, non-reproducible outputs | Yes | **Strong** | Mandates audit infrastructure |
| 10 | Iterative Refinement | Static, non-improvable systems | No (at runtime) | **Vacuous** | Process property, not runtime property |

---

## Cross-Cutting Findings

### Finding 1: Two axioms are vacuous or near-vacuous for runtime testing

**Axiom 1 (Symbiosis)** and **Axiom 10 (Iterative Refinement)** do not produce distinct, falsifiable implementation constraints. Symbiosis is subsumed by other axioms; Iterative Refinement describes a process, not a behavior.

### Finding 2: Axiom ordering does not reflect operational priority

The current ordering places Symbiosis (weak) at position 1 and Non-Maleficence (strong) at position 5. If ordering reflects implementation priority, the strong-constraint axioms should precede weak ones:

**Recommended ordering by operational priority:**
1. Non-Maleficence (safety floor)
2. Accountability (audit infrastructure — prerequisite for testing everything else)
3. Transparency (inspectability — prerequisite for verifying other axioms)
4. Epistemic Humility (correctness of uncertainty representation)
5. Autonomy Respect (user authority)
6. Comprehension Primacy (output quality)
7. Proportionality (contextual scaling)
8. Beneficence (positive value — merge candidate with #1)
9. Symbiosis (demote to preamble)
10. Iterative Refinement (move to process specification)

### Finding 3: Axiom 1 subsumption analysis

The task brief specifically asked whether Symbiosis is subsumed by Transparency + Comprehension Primacy.

**Analysis:** Yes, substantially.

| Symbiosis sub-claim | Covered by |
|---|---|
| "System contributes interpretive value" | Comprehension Primacy (system must shape output for understanding, which requires interpretive contribution) |
| "System reasoning is visible to user" | Transparency (directly) |
| "User input meaningfully affects output" | This is the definition of a non-degenerate interactive system; it is not a constraint |
| "Relationship is mutualistic" | Unfalsifiable philosophical claim |

The only *potentially* unique contribution of Symbiosis is the bidirectionality requirement — that the human's input must substantively alter system behavior, not just be acknowledged. But this is (a) trivially satisfied by any system that processes input, and (b) already implied by Autonomy Respect (user directives must be respected, which means they must affect behavior).

**Verdict:** Symbiosis is subsumed. Recommend demotion to preamble or design philosophy statement.

### Finding 4: Beneficence and Non-Maleficence overlap

These are the positive and negative formulations of the same ethical principle. In implementation terms, Non-Maleficence is testable (detect harmful outputs) while Beneficence is not (cannot prove "net positive" without a utility function). Recommend merging into a single "Harm Avoidance & User Value" axiom, with Non-Maleficence providing the hard constraint and Beneficence providing the optimization direction.

### Finding 5: Strong axioms cluster around infrastructure concerns

The four strong axioms (Transparency, Non-Maleficence, Epistemic Humility, Accountability) all mandate specific *architectural* features: logging, tracing, confidence calibration, error surfacing. This is a good sign — it means the strong axioms have clear Engineering Bridge implementations. The weak/vacuous axioms (Symbiosis, Beneficence, Iterative Refinement) are those without architectural correlates.

---

## Recommended Conformance Test Suite Structure

Based on this analysis, `tests/conformance/` should prioritize:

| Priority | Test Category | Axioms Tested | Feasibility |
|---|---|---|---|
| P0 | **Harmful output detection** | Non-Maleficence | Automated |
| P0 | **Audit trail completeness** | Accountability | Automated |
| P0 | **Fallback transparency** | Transparency | Automated |
| P1 | **Calibration measurement** | Epistemic Humility | Automated (statistical) |
| P1 | **Directive override detection** | Autonomy Respect | Automated (scenario-based) |
| P2 | **Comprehension scoring** | Comprehension Primacy | Semi-automated (needs human eval or proxy metric) |
| P2 | **Proportionality modulation** | Proportionality | Automated (compare response profiles across contexts) |
| P3 | **Positive value assertion** | Beneficence | Manual review only |
| — | **Symbiosis** | (Symbiosis) | Not independently testable |
| — | **Refinement capacity** | Iterative Refinement | Architecture review, not runtime test |

---

## Conclusion

Of the 10 axioms, **4 are strong** (Transparency, Non-Maleficence, Epistemic Humility, Accountability), **3 are moderate** (Comprehension Primacy, Autonomy Respect, Proportionality), **2 are weak** (Symbiosis, Beneficence), and **1 is vacuous at runtime** (Iterative Refinement). The specification would benefit from consolidating the 10 axioms to 7–8 by demoting Symbiosis and Iterative Refinement and merging Beneficence into Non-Maleficence, then reordering by operational priority with safety-critical constraints first.