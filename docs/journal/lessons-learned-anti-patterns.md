# Anti-Patterns and Hard-Won Insights

**Date:** Synthesis (Feb 22–28, 2026)
**Phase:** Lessons extracted across 20+ sessions

## The Shadow System Instinct

The single most persistent anti-pattern: the impulse to build monitoring alongside the graph instead of in it. It appeared at least five times across the sprint, in three distinct forms.

**The Observer class.** A subscriber-pattern object that watches for threshold crossings and triggers alerts. Reasonable engineering. Completely wrong for Codex Signum. Axiom 10 says state is structurally encoded. An Observer is a separate system watching another system — it's the dashboard-and-metrics pattern wearing a different hat. The replacement: `writeObservation()` writes to the graph and checks thresholds in the same operation. The graph is its own observer.

**The Model Sentinel.** A proposed scheduled probe that pings models to detect degradation. But the graph already tracks degradation through real execution outcomes. Thompson arm stats decay naturally when a model underperforms. Synthetic probes add instrumentation cost without structural value. Killed entirely on Feb 27.

**The staged retrospective.** The original design was GATHER→ANALYSE→BASELINE→RECOMMEND→VALIDATE — five stages, LLM-driven, conventional analytics. The graph already contains everything the retrospective needs. The replacement runs 4 concurrent Cypher queries. No LLM. No stages. The graph answers its own questions.

The deeper pattern: training data gravity. AI coding agents (and sometimes the human architect) revert to familiar monitoring patterns because those patterns dominate the training corpus. Every time you catch yourself building a thing to watch another thing, ask: can the thing watch itself?

## The Infrastructure-First Instinct

Reaching for new databases, new services, new dependencies instead of new nodes and relationships. This appeared whenever a requirement seemed to need "real-time" data: proposals for Redis caches, time-series databases, message queues. In every case, the same data could be served by a graph query with appropriate indexing.

Codex Signum's "scales from 1" constraint drives this correction. The system must work with a single user, a single model, a single pattern. Infrastructure-first solutions scale from 1,000. By the time you've deployed Redis to cache Thompson arm stats, you've added operational complexity that the graph doesn't need until you have thousands of concurrent routing decisions. And when you do have that problem, it's a performance optimisation, not an architecture change.

## Convention Reversion

AI coding agents trained on millions of repositories will fight novel architecture. The specific failure modes, catalogued across 20+ sessions:

**Invented file paths.** Copilot and Claude Code both confidently reference paths that don't exist. `agent/config/models.ts` instead of `agent/routing/models.ts`. Over a 100-task session, one wrong path cascades into broken imports across dozens of files. Mitigation: explicit file path tables in every prompt, negative file lists in CLAUDE.md.

**Wrong database technology.** Neo4j project, but the agent reaches for Firestore. Three occurrences before `pre-edit-guard.sh` was deployed to block Firebase imports at the file-write level.

**Parallel registries.** The agent creates a local model configuration when one already exists in core. Two occurrences. Mitigation: "single source of truth" declarations in CLAUDE.md.

**Scope creep.** Agent modifies files in the wrong repository. First occurrence: commit `4e8c961` on Feb 22 — modified core source files despite "work in DND-Manager only." Mitigation: explicit "What NOT to change" sections in prompts, plus hooks.

**Verification loops.** After encountering errors, the agent enters a cycle of checking whether files exist, re-running install, re-checking. The context window accumulates failure signals, creating "learned helplessness" where even correct results aren't trusted. Mitigation: fresh sessions, "VERIFIED STATE — do not re-check" framing.

**Assumed API shapes.** Writing tests without reading source files. The G-10 test governance session produced 24 assertion failures in one run because the agent assumed function signatures from memory. RTY: 0.49 for that session. After adding "read source first" as Rule 11: next session RTY: 1.0.

These aren't random errors. They're systematic biases toward training-data modes. The more novel your architecture, the stronger the gravitational pull.

## Context Transfer as Architecture

The context transfer documents started as prose summaries and evolved into a protocol. By Feb 27, they had structured sections: repo state with commit SHAs, branch heads, verified file paths, carry-forward issues, explicit "what's next" directives. The total corpus exceeded 3,000 lines across 11 documents.

The key insight: context transfer is the memory layer for a system that has no memory. Each Claude session starts empty. The context transfer document is the only thing connecting session N to session N+1. When it's incomplete, the session drifts. When it's bloated, attention dilutes. The optimal transfer document is specific enough to prevent drift and concise enough to preserve attention for actual work.

The retrospective identified what should have been different: the context transfer should be a generated artifact — a SURVEY output — not a hand-maintained prose document. The Architect pattern's SURVEY stage already exists for this purpose. Making SURVEY produce machine-readable state snapshots that serve as context injection eliminates the manual carry-forward problem entirely.

## Governance Evolved from Prompt to Structure to Hooks

A timeline of governance mechanisms:

Feb 22: Constraints embedded in session prompts. "Do NOT touch Codex_signum." Violated within sessions.

Feb 23: Best practices document codified failure modes. Still prompt-dependent — the document had to be read.

Feb 24: `CLAUDE.md` deployed. Persistent context that Claude Code reads at session start. The "should do" layer.

Feb 24: Hooks deployed. Pre-edit guards, post-edit typecheck, pre-commit gates. The "must do" layer.

Feb 26: Discovery that the core repo had no governance. Root cause of all Phase G drift. CLAUDE.md + hooks deployed to core.

Feb 27: Test governance. 5-level taxonomy. Codex conformance structure. Data provenance rule.

The lesson: governance should have been Day 1 infrastructure. The first commit to any repo should include `CLAUDE.md` + hooks. This is the equivalent of setting up CI before writing code. The cost of deploying it late was measurable: DND-Manager (governed since Phase 4) maintained 2204/2205 tests. The core repo (ungoverned through Phase G) produced ModelExecutor collisions, spec drift, and 24 test assertion failures in a single session.

## Research-First Development

Eighteen months of specification before writing production code. Ten research papers. Three spec versions. An engineering bridge document. A novelty assessment against the research frontier.

The cost: speed. No production code for 18 months.

The payoff: 760+ tests in two weeks. No architectural rewrites. No "we need to rethink the foundation" moments. When the implementation sprint began, the hard problems were solved. The signal conditioning pipeline has 7 stages because the research determined 7 stages. The dampening formula is budget-capped because percolation theory proved the original was supercritical. The heuristic imperatives are gradient signals because the control theory analysis showed hard stops create discontinuities.

Every decision that wasn't made during the research phase — the specific Neo4j schema, the TypeScript type system, the hook shell scripts — was made quickly during implementation because the underlying principles were clear. The spec didn't specify `pre-edit-guard.sh`, but it specified Axiom 10 (structural encoding), and `pre-edit-guard.sh` is a direct instantiation of that axiom applied to the development process.

Research-first development is not a process recommendation. It's an investment thesis. Expensive upfront. Cheap downstream. The interest rate is proportional to the novelty of the system you're building.
