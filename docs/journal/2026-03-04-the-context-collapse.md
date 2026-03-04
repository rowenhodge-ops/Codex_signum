# The Context Collapse

**Date:** 2026-03-04 (Session 4)
**Phase:** M-9 Part 2 planning — roadmap rebuild + M-9.8 reprioritisation

## What Happened

I spent three hours last night combing through the roadmap and updating it. Hand-editing a markdown file. Line by line. For a system whose core thesis is "state is structural."

Then I looked at the result today and couldn't find anything in it. The critical path section had been compressed to a checklist of M-numbers with ✅ and ⏳ stamps. No mention of ΦL, ΨH, εR. No signal conditioning. No Thompson sampling details. No morpheme topology. No hypothesis tracking. No Bridge View Principle. Just gate compliance markers telling me things passed without telling me what they were.

Four versions of delta-on-delta compression had stripped the document down to its skeleton. Each version optimised for "what changed" and progressively eroded the narrative context. The roadmap had become a project status dashboard masquerading as an architectural reference.

## The Irony

This is exactly what the system is supposed to prevent.

The roadmap describes a protocol where state is structural — where health, status, and relationships emerge from the topology of the graph rather than from manually-maintained documents. Where "where are we?" is a Cypher query, not a prose paragraph. Where plan edits are graph mutations, not markdown rewrites.

And the roadmap itself was the only artifact in the entire project that wasn't structurally represented. Every pipeline run writes to Neo4j. Every decision completes its lifecycle in the graph. Every observation persists through the memory layer. But the plan — the thing that sequences all of it, that every session references, that I edit most often — lives in a markdown file that degrades through successive rewrites.

M-9.8 (Ecosystem Bootstrap) was designed to fix exactly this. The roadmap becomes a Bloom containing milestone Blooms. Tasks become Seeds. Test results become Observations. "Where are we?" becomes `MATCH (m:Bloom {type: "milestone"}) RETURN m.name, m.phiL, m.status`. But M-9.8 was sequenced at the end of Part 2 — after test reconciliation, after Llama 4 model expansion, after the grammar reference, after the morpheme mapping. By the time it would have executed, I'd have spent another week hand-editing a markdown file that keeps losing information.

## The Fix

Two changes.

First, the roadmap got rebuilt from scratch. Not another delta — a complete rewrite informed by reading v5 and v6 in full and restoring everything that mattered. The State Dimension Gap got its own section. The vertical wiring problem — raw observations at the bottom, computation modules in the middle, hierarchical aggregation at the top, no connection between them — is now visible on the map instead of buried in a context transfer from three sessions ago.

Second, M-9.8 moved. New Part 2 order: M-9.5 (test reconciliation) → M-9.8 (ecosystem bootstrap) → M-9.6 (model expansion) → M-9.7a (grammar reference) → M-9.7b (morpheme mapping). The grammar reference was originally the "bill of materials" prerequisite for M-9.8, but the morpheme mapping table already exists — Bloom for milestones, Seed for tasks, Observation for test results. The types are known. M-9.7a becomes a completeness pass over a structure that already exists in the graph, not a prerequisite for building it.

## What This Reveals About the Project

The context collapse wasn't a one-time mistake. It was a systematic failure mode that the delta-on-delta process was always going to produce. Each session's assistant sees the most recent version and generates a diff. No assistant reads the full history. Details that aren't in the diff disappear. Over four versions, the roadmap lost its entire architectural narrative.

This is the same failure mode the system is designed to prevent at the code level. CLAUDE.md files provide persistent architectural context that survives session boundaries. Hallucination detection catches when agents reference entities that don't exist. The ELIMINATED_ENTITIES list prevents drift back to old vocabulary. These governance mechanisms work because they're structural — they exist in files that every session reads, not in conversation history that gets summarised and compressed.

The roadmap had no equivalent governance mechanism. It was the one artifact where I was doing all the maintenance by hand, trusting that the delta approach would preserve what mattered. It didn't.

After M-9.8, the roadmap will be governed the same way everything else is — structurally. Until then, the rebuilt v6.3 carries the full architectural narrative in markdown form, and I know not to let another delta compress it.

## The Verification Story Continues

Today was also the day the verification cycle completed. M-9.VA ran the pipeline against itself — 14 tasks, 5 models, the system diagnosing its own structural wiring. It found 17 issues, 5 critical. M-9.VA-FIX patched the critical bugs. M-9.VA-V confirmed: 10/10 tasks, 6 models, 100% success rate (was 64%), quality 0.76-0.88 continuous (was bucketed at 0.40/0.50/0.70), approximately 2× faster. All from structural correctness, not optimisation.

The pipeline can now be trusted as a diagnostic tool. It identified and characterised bugs in its own wiring. That capability — self-diagnosis through structural output — is the strongest evidence yet that "state is structural" produces real operational value, not just theoretical elegance.

But the state dimensions (ΦL, ΨH, εR) still don't flow from live data. The computation modules exist. The signal conditioning pipeline exists. The hierarchical aggregation is specified. None of it is connected to the execution path. The pipeline writes raw observations and uses qualityScore as a proxy. The gap between "data exists in the graph" and "the system computes its own health from that data" is the next mountain.

## Process Observation

The fastest way to lose architectural knowledge is to treat a reference document like a changelog. Deltas compound compression. Narrative erodes. What survives is what's measured — test counts, commit hashes, status stamps — and what disappears is what matters — why things are sequenced, what's wired to what, where the gaps live.

The solution is either structural storage (M-9.8) or disciplined full rewrites. Not deltas on deltas.
