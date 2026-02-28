# Codex Signum Reference Pattern: Research

## Structured Frontier Discovery & Knowledge Integration

**Date:** 2026-02-21
**Status:** Pattern design specification — pre-implementation
**Depends on:** Codex Signum v3.0, Engineering Bridge v2.0
**Triggered by:** Retrospective (systemic gaps), Architect (unknown domains), Human (curiosity/opportunity)
**Feeds into:** Retrospective (evidence for process changes), Architect (domain knowledge for planning), Constitutional layer (evidence for amendments)
**Purpose:** The fifth reference pattern. The Research pattern formalises the structured discovery of frontier knowledge and its integration into the Codex ecosystem. It maintains a prioritised research backlog, produces multi-perspective reports, tracks how findings integrate into practice, and supports the human's refinement of research direction through conversational iteration. It eliminates the manual copy-paste-between-tools workflow by keeping the entire research cycle within the Claude ecosystem.

---

## Design Philosophy

The Research pattern exists because the Codex is a living system that operates at the frontier of multiple disciplines. Knowledge gaps are inevitable. New techniques emerge. Established approaches get superseded. The system needs a structured way to discover what it doesn't know, investigate it, and integrate the findings.

### What Research Actually Looks Like in This Project

Ten research papers. All produced by Claude Opus extended thinking. The workflow:

1. Ask Opus: *"What research should we do to ensure we're leveraging as much as we can from X?"*
2. Opus proposes topics with rationale
3. Select a topic, refine the question
4. Opus writes a structured research prompt
5. Execute the research (in a new chat, with extended thinking)
6. Process the output — extract findings, challenge claims, map to architecture
7. Integrate validated findings into the specification

The most valuable research (OpEx synthesis) succeeded because the human brought deep domain expertise — knew what to ask, what to challenge, what the theory actually says vs. what practitioners assume. The pattern must support this: **research is a collaboration between the system's analytical capability and the human's domain judgment.**

### The Research Backlog as a Living System

Research topics aren't a static list. They emerge from:
- **Retrospective triggers:** "We keep failing at cascade dampening — do we actually understand the theory well enough?"
- **Architect discoveries:** "This plan involves graph signal processing and I'm not confident in our approach"
- **Human curiosity:** "I just read about a new RL exploration technique — is it relevant?"
- **Report gaps:** A completed research report identifies questions it couldn't answer → these become new topics
- **Environmental change:** New model release, new paper published, new capability available

Topics have priority, urgency, and lifecycle. They accumulate. Some become urgent. Some stay dormant until the system encounters their domain. Some get superseded by other findings. The backlog is a knowledge gap inventory — and its shape tells you something about where the system's understanding is thin.

### Why Not Just Search When You Need Something?

Targeted search (Architect SURVEY stage) handles "I need a specific fact right now." That's Tier A research — quick, contextual, embedded in planning.

The Research pattern handles Tier B and C: structured investigation that produces reusable knowledge artefacts. The distinction:

| | Targeted Search (SURVEY) | Structured Research (this pattern) |
|---|---|---|
| **Trigger** | Immediate need during planning | Systemic gap or strategic opportunity |
| **Output** | Facts incorporated into current plan | Report archived as institutional knowledge |
| **Depth** | Surface — enough to proceed | Frontier — comprehensive landscape survey |
| **Duration** | Minutes | Hours to days (across sessions) |
| **Reuse** | None — consumed by the current plan | High — referenced by future plans, retrospectives, specs |
| **Human involvement** | Minimal — automated within SURVEY | High — human refines direction, challenges findings |

---

## Identity in Codex Terms

The Research pattern is a **Bloom (○)** containing a multi-stage investigation pipeline. Each stage is a **Resonator (Δ)**. The Bloom connects via **Lines (→)** to the Retrospective (receives gap signals, sends evidence), the Architect (receives domain needs, sends knowledge), and to the human (receives direction, sends reports for review). It maintains its own **Grids (□)** for the topic backlog, report archive, and knowledge graph, and **Learning Helixes (🌀)** for improving research quality and topic generation.

---

*[Full specification continues — see complete document in project files]*

*This is the design specification for the Research pattern. Implementation follows the build sequence defined in the Implementation Notes section.*
