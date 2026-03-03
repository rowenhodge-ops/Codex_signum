# The Plan Before the Sprint

**Date:** 2026-03-03 (afternoon)
**Sessions:** 1 (extended planning)
**Phase:** Roadmap v5 refinement — no code, all structure

## What Happened

After days of intense building — M-8C topology refactor, Vertex incident recovery, test governance, v4.0 spec draft, Assayer pattern design — the architect paused. Not because something broke. Because the roadmap needed the same rigour that was being applied to the code.

The roadmap v5 had been built across multiple sub-sessions, each adding milestones as they became clear: M-9 structural compliance, M-9.6 model expansion, M-9.7 morpheme mapping, M-9.8 ecosystem bootstrap, FMEA lifecycle, Assayer invocation points. Good decisions, individually. But the document as a whole had gaps that would slow execution.

This session found them.

## What We Learned

**The test gate policy contradicted itself.** "No phase advances with failing tests" + "tests verify spec requirements" + "spec not built yet" = the agent writes tests verifying current behaviour and calls them spec tests. That's exactly what produced 213 useless tests in the test audit. The corrected policy creates two categories: in-scope tests that block the gate, and `@future(M-{N})` tests that are expected to fail until their milestone begins. The principle inverts: "make code satisfy test, not test satisfy code."

**M-17.2 was two sentences describing the highest-value architectural constraint in the project.** The Bridge View Principle — "every formula must be a pure function of grammar-defined morpheme states and axiom-defined parameters" — collapsed nine M-8A recommendations into one. It deserved a full specification of what codification means: normative constraint, testable compliance check, Assayer corpus entry, retroactive audit, CLAUDE.md constraint. Two sentences wasn't enough for something this important.

**The code is ahead of the spec, and that's still a problem.** M-17.4 listed ΨH temporal decomposition, εR spectral calibration, and signal conditioning parameters as "deferred computation details never delivered." But most of them WERE built during Phase G core reconciliation. The Bridge document just doesn't describe them. A stale spec that's behind the implementation creates the same drift as a stale implementation that's behind the spec — future agents build from the document, not the code.

**There is no grammar reference.** The vocabulary of the Codex — morphemes, state dimensions, grammar rules, axioms, anti-patterns, meta-imperatives, operational records, memory strata — is scattered across five or more documents. No single reference lists them all with their implementation status. You can't map what you haven't inventoried. M-9.7 now produces this as its first deliverable.

**Pipeline performance metrics (ΦL/ΨH/εR) don't exist because the pipeline has no graph nodes.** The computation code works — it computes health for model Seeds and pattern Blooms. But there are no PipelineRun nodes, no TaskOutput nodes, no Observations from analytical output. The functions exist. The data to run them against doesn't. M-9 fixes this.

**Six milestones don't belong in an ice box.** Memory operations, Research pattern, Constitutional evolution, Self-recursive learning, Pattern Exchange, and Assayer implementation aren't nice-to-haves. They're the system's core capabilities. Ice-boxing them sent the wrong signal about their importance. They're now properly sequenced with dependencies.

**Hypotheses are Helixes.** The lightning-in-a-bottle document describes five publishable research papers. Each depends on specific testable claims that accumulate evidence over time — that's a Helix. Each pipeline run from M-9 onwards generates Observations that feed relevant hypothesis Helixes. If hypothesis tracking waits until M-11 (Research Pattern), months of operational evidence is lost. It starts at M-9.7.

**Research papers are Blooms.** A paper is a composition of hypothesis Helixes, data Seeds, and narrative structure. A paper is "ready for drafting" when its constituent hypotheses are sufficiently bright (high ΦL, low εR). This is the Codex governing its own research output using its own grammar.

## What Changed

No code. No commits. All documents:

- **Roadmap v5** grew from 547 to 814 lines. Test gate policy corrected, M-17.2/M-17.4 expanded, agent model selection with per-milestone recommendations, grammar reference as M-9.7 first deliverable, six milestones un-ice-boxed with full sequencing, M-19 hypothesis tracking + research pipeline, dependency graph updated through M-15.
- **Assayer pattern design** updated with per-task FMEA advisory as 5th invocation point.
- **Context transfer** produced for session continuity.

## The Lesson

This was the kind of session that doesn't feel productive in the moment. No tests went green. No pipeline ran. No commits landed. But every gap found in the plan would have cost a session to fix later — the contradictory test gate policy, the two-sentence Bridge View Principle, the missing grammar reference, the ice-boxed core capabilities, the hypothesis data that would have been lost.

Good structure, dependency management, and outcome orientation win out every time. No matter how capable the models are, no matter how fast the agent types, the plan is the constraint. LSS principles applied to the plan itself: inventory before you map, define acceptance before you execute, distinguish in-scope from future-scope, and make sure the most important things get the most detail.

The sprint starts next session. The plan is ready.

*Sometimes the most productive thing is to stop building and start reading what you've built.*