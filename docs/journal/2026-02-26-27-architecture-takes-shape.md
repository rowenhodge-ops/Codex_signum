# Architecture Solidifies

**Date:** 2026-02-26 to 2026-02-27
**Sessions:** 6 (2 on Feb 26, 4 on Feb 27)
**Phase:** Core completeness review, governance deployment, decision loop, inline conditioning, retrospective, full learning loop

## What Happened

These two days transformed the project from a collection of working components into an integrated system. The arc: discover what's missing, deploy governance to fix the root cause, build the decision loop, wire inline conditioning, redesign the retrospective, and bring the full learning loop live.

### Feb 26: The Root Cause

Session 1 produced a comprehensive core completeness review — a systematic cross-reference of the entire Codex_signum repo against the v3.0 specification, engineering bridge, architect design doc, and implementation plan. The review found gaps, but the deeper finding was structural: **the core repository had no `CLAUDE.md` and no hooks.** Every Claude Code session on this repo had been operating without governance. No persistent context, no anti-pattern enforcement, no structural checks.

DND-Manager had been governed since Feb 24 (commit `bcc6193`) and maintained 2204/2205 tests passing. The core repo had nothing, which explained every Phase G problem: ModelExecutor naming collisions, spec drift, circuit breaker uncertainties, 24 assertion failures in one test governance session. The ungoverned repo was the root cause.

The fix was deployed directly to main: `CLAUDE.md` (12.8KB with architecture map, 10 non-negotiable rules, Engineering Bridge parameters, anti-pattern table, negative file list), plus four hooks. This was commit `d34cb4e`. From this point forward, both repos had structural governance.

Session 2 broadened the SURVEY stage to auto-discover documentation, extract claims (formulas, thresholds, warnings, recommendations), and cross-reference them against the codebase. The reconciliation phase that followed found spec-vs-code divergences and produced fix prompts. This was the Architect pattern beginning to function as designed — detecting gaps through structural analysis rather than human memory.

### Feb 27: The Critical Discovery and the Full Loop

Session 1 executed test governance (G-10): 20 new test files, 580 tests total. The first Claude Code session produced 24 assertion failures across 8 files — root cause was the agent writing tests based on assumed API shapes without reading the source files. The second session fixed them with targeted source reads. RTY for the first session: 0.49. For the correction session: 1.0. This produced a new rule (Rule 11 in CLAUDE.md): "Read source before writing tests."

Then came the critical architectural discovery. While reviewing the test governance results, I realised: **the morpheme topology was missing from the graph.** The Codex spec defines six morphemes — Seed, Line, Bloom, Resonator, Grid, Helix. Pipeline stages should be Resonator nodes. Data flow between stages should be Lines. Patterns should be Blooms containing their stages. None of this existed in Neo4j. The system computed health correctly. Thompson routing worked. Signal conditioning worked. But the system's own structure wasn't represented in its own grammar.

This matters because "state is structural" must apply to the system itself, not just its outputs. Every time an LLM infers what a pipeline stage is — its interface, its connections, its health — there's a probability of error. If the topology were in the graph, inference is replaced by query. Query doesn't drift.

Session 2 produced the Lean process maps — SIPOC diagrams for each pattern, cross-cutting process flows, dependency matrices, and implementation sequences. During this mapping, the Observer pattern was eliminated entirely. The Observer class violated Axiom 10 (structural encoding). It was a monitoring overlay built alongside the graph instead of in it. The functions it provided (watching for threshold crossings, triggering alerts) were replaced by `writeObservation()` — a function that writes to the graph and checks thresholds in the same operation. No observer. No subscriber pattern. The graph itself is the observation layer.

Sessions 3 and 4 executed the full implementation plan. Phase 0: graph foundation (`bootstrapPatterns()`, `CORE_PATTERNS`, decision lifecycle conformance). Phase 1: `selectModel()` API with Thompson sampling and context-blocked posteriors — 697 tests. Phase 2: decision loop wiring in DND-Manager (`selectModelForTask()`, `recordDecisionOutcome()`). Phase 3a: inline conditioning (`writeObservation()`, `conditionValue()`, `healthBand()`, `ThresholdEvent`). Phase 3b: retrospective — but not the original design.

The original retrospective was a 5-stage GATHER→ANALYSE→BASELINE→RECOMMEND→VALIDATE pipeline. On review, this was conventional analytics design imported wholesale — LLM-driven, stage-heavy, violating the spirit of structural state. It was replaced with `runRetrospective()`: a single function running 4 deterministic Cypher queries concurrently. No LLM. No stages. The graph already contains the answers; the retrospective surfaces them.

The Model Sentinel pattern was killed entirely. It proposed synthetic probes to detect model degradation — but the graph already tracks this through real execution outcomes. Thompson arm stats degrade routing naturally. Synthetic probes add nothing structural. Anti-pattern #1: shadow system instinct.

By the end of session 4, all phases were merged to main. The self-recursive learning loop was live: every LLM execution creates a Decision node, runs Thompson sampling, records the outcome, updates pattern health, and feeds the retrospective.

## What We Learned

**Missing governance is invisible until it compounds.** The core repo ran without governance for the entire Phase G consolidation. Each individual session's problems seemed like normal development friction. Only the completeness review revealed the pattern: every problem traced to the same root cause.

**"Read source before writing tests" should not need to be a rule.** It does. Claude Code's instinct is to write tests from memory of the API shape. When the architecture is novel, memory is wrong. The RTY data proves it: 0.49 without the rule, 1.0 with it.

**Killing features is a design skill.** Observer, Model Sentinel, and the staged retrospective were all reasonable engineering. They were also all wrong for this architecture. Recognising that something useful violates the system's principles — and removing it rather than accommodating it — is harder than building it in the first place.

## What Changed

Both repos now have structural governance. The learning loop is live end-to-end. The Observer class is gone. The retrospective is a set of graph queries, not a pipeline. The morpheme topology discovery set the direction for future work: the system should describe itself in its own grammar before it can fully govern itself.
