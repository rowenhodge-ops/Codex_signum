# Update GATE stage connection

> Task ID: t6
> Model: claude-opus-4-6:adaptive:low
> Duration: 52253ms
> Output chars: 6775
> Timestamp: 2026-03-23T18:07:12.240Z

> **⚠️ Hallucination flags (5):**
> - [content/warning] Task t6 references "./types.js" but this file was not in its context
> - [content/warning] Task t6 references "DND-Manager agent/patterns/architect/gate.ts" but this file was not in its context
> - [content/warning] Task t6 references "npx vitest run tests/conformance/graph-native-containment-direction.test.ts" but this file was not in its context
> - [content/warning] Task t6 references "gate.ts" but this file was not in its context
> - [content/warning] Task t6 references a document ("docs/specs/06_codex-signum-architect-pattern-design.md") that was not in its context

---

# Analysis: GATE Stage Connection — FLOWS_TO Wiring (t6)

## Executive Summary

The GATE stage implementation (`src/patterns/architect/gate.ts`) is **entirely graph-unaware**. It operates as a pure procedural function with no concept of FLOWS_TO edges, stage topology, or shared resonators. This directly explains the pre-survey diagnostic of `lambda2=0` (disconnected graph components) — the GATE stage is an island node with no inter-stage edges.

---

## Findings

### F1: No Graph-Structural Awareness

**Evidence:** The `gate()` function signature is:
```
gate(planState: PlanState, options?: GateOptions) → Promise<GateResponse>
```

There is no parameter, metadata, or side-channel that references:
- Upstream source stages (what FLOWS_TO the GATE)
- Downstream target stages (what the GATE FLOWS_TO)
- Any edge registry or adjacency structure

The function consumes a `PlanState` and emits a `GateResponse` — but neither of these types (imported from `./types.js`) appear to carry graph-edge metadata. The GATE operates as if it exists in isolation.

### F2: Missing FLOWS_TO Edge Declarations

**Evidence:** The file contains zero references to `FLOWS_TO`, `edge`, `connection`, `stage`, `flow`, `graph`, or any graph-topology primitives. The only import beyond types is `readline`.

The mutate advisory explicitly states: *"lambda2=0: disconnected components. Stages have no inter-edges."* This is a direct consequence — if the GATE stage doesn't declare or consume FLOWS_TO relationships, the architect pattern's stage graph has at least one disconnected component (GATE itself), driving algebraic connectivity to zero.

### F3: No Shared Resonator Handling

**Evidence:** The acceptance criteria require "Shared Resonators are correctly handled." There is no resonator concept in the current implementation — no shared state channels, no resonance coupling between stages, no mechanism for the GATE to propagate or receive signals through shared resonant structures.

The `GateResponse` return value (`{ decision, modifications?, reason? }`) is a plain object with no resonator binding.

### F4: The `create_line` Mutation Target Is Unimplemented

**Evidence from Intent block:** The proposed change `create_line: Wire FLOWS_TO from architect_GATE` indicates a specific edge needs to be created *from* the GATE stage. Currently, the GATE function returns a response but does not:
- Signal to a downstream stage
- Register its output as a FLOWS_TO edge source
- Participate in any stage sequencing graph

The three `GateResponse.decision` branches (`approve`, `modify`, `abort`) should each map to different FLOWS_TO targets (e.g., approve → EXECUTE stage, modify → PLAN stage, abort → terminal), but this routing is absent.

### F5: Structural Consequence — psiH=0.6 Degradation

The `psiH=0.6` (structural health metric) is below what would be expected for a well-connected stage graph. The GATE's disconnection is a primary contributor. A properly wired GATE with bidirectional FLOWS_TO edges (inbound from PLAN, outbound to EXECUTE/PLAN/ABORT) would contribute at least 2-3 edges to the graph, likely raising `lambda2 > 0` and improving `psiH`.

---

## Root Cause

The GATE stage was ported from a procedural agent framework (`DND-Manager agent/patterns/architect/gate.ts`, per the file comment: *"Moved from DND-Manager"*) where stages were orchestrated by an external controller via sequential function calls. The graph-native containment/direction model of Codex Signum v5.0b requires stages to **self-declare** their FLOWS_TO edges and participate in the stage graph as first-class nodes. This adaptation was not performed during the port.

---

## Recommendations

### R1: Introduce Stage Node Identity and Edge Declaration

The GATE module needs to export or register a stage descriptor that declares its FLOWS_TO edges. This should include:
- **Inbound edges**: What stages flow *into* GATE (e.g., PLAN → GATE)
- **Outbound edges**: Conditional edges based on decision (approve → EXECUTE, modify → PLAN, abort → TERMINATE)

This likely requires the GATE to conform to a `StageNode` interface (or equivalent from the Codex Signum core) rather than being a bare async function.

### R2: Integrate Shared Resonator Protocol

The GATE's `PlanState` input and `GateResponse` output should be channeled through shared resonators rather than direct parameter passing. This ensures:
- Other stages can observe GATE state changes
- The GATE can react to upstream resonator signals (e.g., plan invalidation during gate review)
- Coupling is maintained at the graph level, not the call-stack level

### R3: Refactor Decision Routing as FLOWS_TO Edge Selection

The three decision branches (`approve`, `modify`, `abort`) currently return inert data. These should instead **activate** the corresponding FLOWS_TO edge, making the GATE a conditional routing node in the stage graph. This is the core of the `create_line: Wire FLOWS_TO from architect_GATE` mutation.

### R4: Validate with Conformance Test

The verification command (`npx vitest run tests/conformance/graph-native-containment-direction.test.ts`) tests graph-native containment and direction. Post-implementation, this test should verify:
- GATE appears as a connected node (no isolated components → `lambda2 > 0`)
- FLOWS_TO edges from GATE resolve to valid target stages
- Edge directionality matches the containment model (GATE contained within architect pattern, edges flow outward to sibling stages)

### R5: Update Types

`PlanState` and `GateResponse` in `./types.js` likely need augmentation to carry edge metadata or resonator bindings. Review these types for graph-native compatibility before modifying `gate.ts` itself.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Breaking the readline interaction model | Low | FLOWS_TO wiring is structural; the human-interaction logic can remain as-is within the node's execution body |
| Type incompatibility with existing callers | Medium | Any code currently calling `gate()` directly will need to go through the stage graph instead; search for direct imports |
| Auto-gate mode bypass of edge routing | Medium | Ensure `autoApprove` still activates the approve FLOWS_TO edge, not just returns silently |
| Resonator lifecycle management | Medium | Shared resonators must be properly acquired/released around the blocking readline call to avoid deadlock |

---

## Summary

The GATE stage is a **procedural island** in what should be a **graph-native architecture**. It needs to be promoted from a bare function to a graph-participating stage node with explicit FLOWS_TO edge declarations and shared resonator integration. This is the primary fix for the `lambda2=0` disconnected-components diagnostic.