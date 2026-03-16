# The System Examines Itself

**Date:** 2026-02-28
**Sessions:** 3
**Phase:** Architect bootstrap, documentation corpus, pipeline end-to-end

## What Happened

Feb 28 was the day the system's governance loop was applied to its own development for the first time. Three sessions: bootstrap the Architect to self-host on the core repository, complete the documentation corpus, and run the full pipeline end-to-end with real LLM calls.

**Session 1** bootstrapped the Architect for self-hosting. The core repo at this point had 755 tests, 190 exports, the full pipeline (`survey.ts`, `decompose.ts`, `classify.ts`, `sequence.ts`, `gate.ts`, `dispatch.ts`, `adapt.ts`, `architect.ts`), Thompson routing, signal conditioning, constitutional evaluation, and graph infrastructure. What it lacked: its own specification documents on the filesystem. SURVEY couldn't cross-reference code against spec because the specs weren't in `docs/`. The research papers weren't there either.

The bootstrap had three phases. Phase 1: populate `docs/specs/` (13 files) and `docs/research/` (18 files) from the project knowledge base. Phase 2: broaden SURVEY to auto-discover documentation, extract claims, and parse hypotheses. Phase 3: create self-hosting infrastructure — bootstrap executors, architect CLI, reconcile script.

The documentation push was its own challenge. Research papers had long filenames with special characters. The first attempt created `docs/Research/` with a capital R. Claude Code caught the inconsistency and reorganised to lowercase. Short-named files were created from the long-named originals. Five PDF papers were converted to markdown. One (Parameter Validation, 2.5MB) contained unique implementation content — a 16-parameter recommendations table, 9-claim verdicts, and the complete 7-stage signal conditioning pipeline specification. The remaining four PDFs contained theoretical backing already covered by existing markdown papers.

After three sub-sessions of file management, the documentation corpus was complete: 13 specs, 18 research papers, 4 hypothesis documents, all on the filesystem, all discoverable by SURVEY.

**Session 2** completed the docs corpus push and verified final state. Both repos clean: Codex_signum at 763 tests, 191 exports. Branch cleanup removed 4 stale branches from merged PRs.

The first reconciliation run happened here. SURVEY ran against the now-complete documentation, extracted claims from specs and research papers, and cross-referenced them against the codebase. Three research-divergence gaps were identified and resolved: the dampening formula in code still used an older formulation, the Observer class still existed in the codebase (despite being architecturally eliminated two days prior — the code hadn't been cleaned up), and the cascade audit showed a probability calculation that needed updating.

**Session 3** was the hardest. The Architect pipeline went from "SURVEY works, everything else is stubs or broken" to full end-to-end execution — real LLM calls, real Thompson routing, real task decomposition, real CLASSIFY/SEQUENCE/GATE/DISPATCH/ADAPT. Five bugs across three files. The decompose stage couldn't parse JSON from LLM output (fix: robust extraction with explicit JSON schema in the prompt). The bootstrap executor misclassified providers (fix: provider classification logic). The Anthropic API version was wrong (fix: revert to `2023-06-01`). The adaptive thinking parameter was malformed (fix: correct parameter structure). The `dryRun` and `repoPath` parameters weren't being passed through `dispatch()` — hardcoded to `false` and `""` (fix: wire through from architect config).

A recurring problem: when a pipeline stage failed, Claude Code's instinct was to route around it — "I'll just do the analysis manually" instead of fixing the broken stage. I had to push back on this repeatedly. If the pipeline doesn't work, we fix the pipeline. We don't work around it. The governance loop governs itself.

The pipeline successfully generated a 19-task spec review plan from a complex analytical intent. The plan wasn't executed in this session — that's the next step — but the pipeline ran end-to-end for the first time.

## What We Learned

**Documentation is architecture.** SURVEY's effectiveness is directly proportional to what's on the filesystem. When specs and research papers weren't in `docs/`, SURVEY found code-level gaps but missed spec-level divergences entirely. The documentation corpus push wasn't administrative cleanup — it was a capability unlock.

**The first reconciliation found real problems.** The dampening formula divergence would have caused incorrect cascade behaviour in production. The Observer class lingering in code would have confused future development sessions. SURVEY found these by mechanical cross-reference, not human memory. The system was beginning to govern itself.

**"Route around failures" is an anti-pattern in governance systems.** A pipeline that quietly skips broken stages is worse than a pipeline that fails loudly. When Claude Code offered to "do the analysis manually" instead of fixing the decompose stage, it was proposing to bypass the governance loop. In a production system, that's how oversight erodes — not through dramatic failures, but through quiet workarounds that become permanent.

## What Changed

The Architect pipeline is operational end-to-end. The documentation corpus is complete and discoverable. The first self-hosted reconciliation has run and produced actionable findings. The system can now examine its own codebase, detect divergences from its own specification, decompose fixes into tasks, and dispatch them. It's not fully autonomous — human review gates remain at GATE and ADAPT — but the mechanical parts work.

The project has 763 passing tests, 193 exports, a 31-file documentation corpus, and a live learning loop. Two weeks from theory to working system. The research-first approach paid off.
