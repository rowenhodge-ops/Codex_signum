# The Document That Ate Itself

**Date:** 2026-03-04 (Session 4)
**Phase:** M-9.VA-V verified → Roadmap v6.3 restored → M-9.8 promoted

## What Happened

The verification passed. All five fixes from the pipeline's self-diagnostic confirmed in production. 10/10 tasks, 6 models, 100% success, quality 0.76–0.88 with real gradient signal. And the system is running roughly twice as fast as before the fixes — not from optimisation, but from removing the structural friction that was causing retries, dead ends, and wasted Thompson samples. Fix the structure, everything downstream improves. That's the thesis in action.

Then the thesis broke.

## The Context Collapse

I asked a simple question: "Are we seeing the state dimensions? They should be feeding into the formulas." The answer was no. ΦL, ΨH, εR — the three state dimensions that are literally the core of the visual grammar — exist as computation modules, are tested, and aren't connected to anything the pipeline actually produces. The pipeline writes raw observations with a proxy quality score. The conditioning pipeline never runs. The hierarchical aggregation never fires. The system can tell you a task scored 0.82 but cannot tell you whether the Architect Bloom is healthy.

That was bad enough. Then I looked at the roadmap that was supposed to track all of this, and found it had eaten itself.

The roadmap went through four delta updates in a single day — v6.0, v6.1, v6.2, v6.3-delta. Each update focused on what changed: stamp this ✅, update that test count, add this running log entry. Each was individually correct. Collectively, they eroded the document from 1011 lines of architectural context to a compliance checklist. The critical path became a list of gates. The milestone descriptions shrank to one-liners. The hypothesis tracking section vanished. The Bridge View Principle rationale disappeared. The deferred computation table — the one that would have made the ΦL gap immediately visible — was gone.

I'd spent three hours the night before hand-editing the plan, and the detail I'd worked to preserve was being stripped out by the delta format that was supposed to maintain it.

## The Irony

The system's thesis is "state is structural." The plan managing the system is a markdown file. Every edit is a full document rewrite where the editor (human or AI) must hold the entire context to avoid dropping pieces. The AI can't hold it — it optimises for conciseness when told to tighten. The human can't hold it — 1000 lines of interconnected milestone descriptions, refinement backlogs, and dependency graphs exceed working memory for manual editing.

This is exactly the problem the system is designed to solve. Structural state doesn't degrade through rewrites because it's computed from its children, not narrated about them. A milestone Bloom's ΦL doesn't disappear because someone forgot to copy it into the next version of a document. It's there because the Observations that feed it are there.

M-9.8 — Ecosystem Bootstrap — was designed to fix this. The roadmap becomes a Bloom containing milestone Blooms. Tasks become Seeds. Test results become Observations. "Where are we?" becomes a Cypher query. But M-9.8 was sequenced last in Part 2, after test reconciliation, model expansion, grammar reference, and morpheme mapping.

That sequencing was wrong. The grammar reference (M-9.7a) was supposed to be the "bill of materials" before the ecosystem could be bootstrapped. But the bill of materials already exists — the morpheme mapping table is right there in the roadmap. Milestones are Blooms. Tasks are Seeds. Tests are Seeds with Observations. We know this. We've known it since v5.

M-9.8 is now second in Part 2, right after M-9.5 (test reconciliation). Every day it stays as a markdown file is another day where hand-edits can lose detail, deltas can erode context, and the system's most important artifact fails to satisfy the system's own thesis.

## The Speed Insight

The other thing worth recording: the pipeline is running ~2× faster after fixing five wiring bugs. Nobody optimised anything. The fixes were:

1. Standardise a bloom ID (was "bloom_architect", should be "architect")
2. Thread runId/taskId through Decision recording
3. Remove a stale model seed that was guaranteed to 404
4. Replace discrete quality buckets with continuous scoring
5. Link failed tasks to the DISPATCH stage

Five mundane wiring corrections. The speed gain comes from removing a cascade of secondary failures: stale model → 404 → retry → wasted 30 seconds. Discrete quality → no gradient → Thompson can't distinguish → explores randomly → picks bad models → slower. Broken bloom ID → phantom node → queries return wrong data → downstream confusion.

This is the compounding effect the spec describes. Bad structure doesn't just produce bad data — it produces bad decisions that produce worse data that produces worse decisions. Fix the structure and the vicious cycle inverts into a virtuous one. The system was already capable of this speed. The structural errors were hiding it.

## What the Roadmap Looks Like Now

v6.3 is a full rewrite — 848 lines restored from the v5 and v6 originals with all current status integrated. It has:

- A new "State Dimension Gap" section making the ΦL/ΨH/εR disconnection visible as a first-class architectural concern
- All M-16, M-17, M-8.INT milestone descriptions with their sub-tasks and rationale
- The full M-19 hypothesis tracking section (6 hypotheses, 5 papers, venues, sandbox pattern, flywheel)
- 26 refinement items (was implicitly truncated in deltas)
- M-9.8 promoted to immediately after M-9.5

This is the last time the roadmap should need a full document rewrite. After M-9.8, it lives in the graph.

## The Lesson

Documents decay. Every rewrite is a lossy compression. The more frequently a document is updated, the faster it loses the context that makes it useful. The solution isn't better document discipline — it's making the document unnecessary by encoding its content structurally. That's not a theoretical aspiration anymore. The infrastructure to do it exists. It just needs to be wired.

M-9.5, then M-9.8. Then this markdown file becomes a snapshot of the moment the plan stopped being a document and started being a structure.

*The cobbler's children have no shoes — until the cobbler decides the children's feet are the critical path.*
