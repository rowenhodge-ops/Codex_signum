# Codex Signum â€” Attunement

## How Patterns Travel

**Version:** 0.2  
**Companion to:** Codex Signum v2.5 (Core Specification)  
**Supersedes:** Pattern Exchange Protocol v0.1 (Draft)  
**Date:** 2026-02-14

---

## What This Document Describes

When two Blooms connect across a deployment boundary, the Codex already has the grammar for what happens. G1 governs intent. G2 governs direction. G3 governs what's exposed and what's protected. G5 governs whether the compositions resonate. The state dimensions report health, compatibility, and exploration throughout.

This document describes the mechanics of that first connection â€” the format a Bloom carries when it travels, and the process by which two Blooms attempt resonance across a boundary. We call this **Attunement**.

Attunement is not a new concept. It is the Codex's existing connection mechanics (G1: "connection requires intent") applied at the scale where Blooms cross deployment boundaries. Two Seeds attune when they connect within a pattern. Two Blooms attune when their interface shapes meet across a network. Same grammar, different zoom level. The fractal holds.

---

## Why "Attunement"

An API is a contract you negotiate and maintain. MCP is a protocol you configure and manage. Attunement is something that either *happens* or *doesn't*. You don't set up attunement â€” you attempt it, and the structural properties of both sides determine whether resonance is achieved.

This is deliberate. A Bloom's identity at its boundary isn't a generated key that you keep secret. It is the auto-aggregated computation of everything inside it â€” Î¦L, Î¨H, ÎµR, interface shape, morpheme composition. When two Blooms attempt attunement, they are comparing structural realities, not exchanging tokens. You can't fake attunement because the state dimensions *are* the structural properties. A Bloom that claims high Î¦L but whose patterns consistently fail is structurally incoherent â€” the lie is visible in the encoding. Axiom 2 (Fidelity) enforces this without any additional mechanism.

Attunement describes both the process and the aspiration. Blooms seek resonance. When they find it, Lines form. When they don't, nothing happens. It just is.

---

## The Bloom Envelope

Every pattern that crosses a deployment boundary travels inside its Bloom. This is not a new concept â€” Blooms already define scope, boundary, and context. A Bloom in transit is a Bloom with its petals folded inward for protection, its interface shape preserved at the open edge, carrying a self-description of everything inside.

The Bloom envelope has five sections:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  â—‹ BLOOM (in transit)                   â”‚
â”‚                                         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚  Identity                       â”‚    â”‚
â”‚  â”‚  - content_hash (SHA-256)       â”‚    â”‚
â”‚  â”‚  - codex_version (e.g. "2.5")   â”‚    â”‚
â”‚  â”‚  - scale (seed|pattern)         â”‚    â”‚
â”‚  â”‚  - created_at                   â”‚    â”‚
â”‚  â”‚  - origin (optional)            â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚  Structure                      â”‚    â”‚
â”‚  â”‚  - morpheme_composition         â”‚    â”‚
â”‚  â”‚  - grammar_compliance (G1-G5)   â”‚    â”‚
â”‚  â”‚  - interface_shape              â”‚    â”‚
â”‚  â”‚  - dependency_declarations      â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚  State (the three dimensions)   â”‚    â”‚
â”‚  â”‚  - Î¦L (with factor breakdown)   â”‚    â”‚
â”‚  â”‚  - Î¨H (internal coherence)      â”‚    â”‚
â”‚  â”‚  - ÎµR (exploration profile)     â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚  Provenance                     â”‚    â”‚
â”‚  â”‚  - observation_depth            â”‚    â”‚
â”‚  â”‚  - network_presence             â”‚    â”‚
â”‚  â”‚  - origin_context               â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚  Payload                        â”‚    â”‚
â”‚  â”‚  - configuration                â”‚    â”‚
â”‚  â”‚  - (code or reference)          â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Five sections. The critical change from v0.1: **State** and **Provenance** replace the former "Health" section. State carries the three dimensions the Codex already defines for every morpheme. Provenance carries the context needed to discount those dimensions on import.

Note what's happening: this is just a Bloom doing what Blooms do. It defines scope (what's inside this pattern), protection (what's shielded during transit), and interface (where connection happens). When the Bloom arrives and is imported, it unfolds into the receiving graph as a Dormant Seed, with its morpheme composition expanding into nodes and relationships. The Bloom doesn't disappear â€” it becomes the pattern's boundary in the new graph.

---

## 1. Identity

The pattern's fingerprint. Immutable once published.

```json
{
  "identity": {
    "content_hash": "sha256:a3f2...",
    "codex_version": "2.5",
    "scale": "pattern",
    "created_at": "2026-02-13T10:00:00Z",
    "origin": "bloom:b7e4..."
  }
}
```

**content_hash** â€” SHA-256 of the Structure + Payload sections. This is the pattern's identity. Two patterns with the same hash are the same pattern regardless of where they came from. Like content-addressed storage (IPFS, Git), the hash *is* the name.

**codex_version** â€” Which version of the Codex this pattern was built against. A v2.5 pattern connects to a v2.5 deployment without translation. Cross-version compatibility follows the ossification rules â€” core morphemes don't change, so structural compatibility is preserved. Only if a major version boundary is crossed (v3.0) would translation be needed.

**scale** â€” Where in the fractal this Bloom sits.

| Scale | What the Bloom Contains | Typical Morpheme Count |
|---|---|---|
| `seed` | A single function, datum, or decision point | 1 (the Seed itself) |
| `pattern` | A composition of morphemes â€” the standard case | 3â€“50+ |

The Bloom format is identical at both scales. A Seed-scale Bloom's morpheme composition is simply `{ "seed": { "id": "...", "role": "..." } }` â€” one morpheme, no Lines, no containment. The fractal holds. Larger compositions â€” patterns containing patterns â€” are still just patterns. The grammar handles infinite nesting without needing a new scale label at each level.

**origin** â€” Optional. The Bloom that first published this pattern. Not required for the pattern to function (patterns are self-describing), but enables provenance tracking across the network. A pattern with no origin is anonymous â€” valid but carrying lower `provenance_clarity` in the Î¦L computation.

---

## 2. Structure

What the pattern *is*, expressed in Codex terms. This is the DNA â€” the morpheme composition that any deployment can read.

```json
{
  "structure": {
    "morphemes": {
      "bloom": {
        "id": "root",
        "shape": "open",
        "contains": ["extract", "route", "respond", "knowledge", "learn"]
      },
      "resonators": [
        { "id": "extract", "orientation": "down", "role": "entity_extraction" },
        { "id": "route", "orientation": "up", "role": "routing_decision" },
        { "id": "respond", "orientation": "up", "role": "response_generation" }
      ],
      "grids": [
        { "id": "knowledge", "type": "persistent", "schema_ref": "knowledge_v1" }
      ],
      "helixes": [
        { "id": "learn", "mode": "learning", "feeds_into": "route" }
      ],
      "lines": [
        { "from": "input", "to": "extract", "direction": "forward" },
        { "from": "extract", "to": "route", "direction": "forward" },
        { "from": "route", "to": "respond", "direction": "forward", "condition": "simple" },
        { "from": "route", "to": "knowledge", "direction": "forward", "condition": "complex" },
        { "from": "knowledge", "to": "learn", "direction": "forward" },
        { "from": "learn", "to": "route", "direction": "return" },
        { "from": "respond", "to": "output", "direction": "forward" }
      ]
    },

    "grammar_compliance": {
      "G1_proximity": true,
      "G2_orientation": true,
      "G3_containment": true,
      "G4_flow": true,
      "G5_resonance": true,
      "violations": []
    },

    "interface": {
      "inputs": [
        { "id": "input", "type": "seed", "accepts": "text/document" }
      ],
      "outputs": [
        { "id": "output", "type": "seed", "produces": "text/response" }
      ],
      "exposes": [
        { "id": "knowledge", "type": "grid", "access": "read" }
      ]
    },

    "dependencies": {
      "requires_models": ["llm/general"],
      "requires_grids": [],
      "requires_external": []
    }
  }
}
```

### Morpheme Composition

This is the pattern's body plan. Every morpheme is declared with its type, role, and relationships. A receiving deployment can reconstruct the pattern's graph topology from this alone â€” without running it, without trusting it, without knowing anything about its origin.

The morpheme composition is what enables structural compatibility checking. If your graph has a document processing pipeline and someone offers a pattern with an entity extraction Resonator, you can see from the composition alone whether this Resonator's interface shape matches your pipeline's needs.

### Grammar Compliance

Self-declared but verifiable. The Bloom claims G1-G5 compliance and lists any known violations. A receiving deployment **must re-verify** â€” self-declared compliance is a hint, not a guarantee. Verification is cheap (structural graph walk) and should be automatic on import.

A pattern with grammar violations is not rejected â€” it's flagged. The violations reduce the `axiom_compliance` factor in Î¦L computation, which means it starts dimmer. If it performs well enough to overcome the Î¦L penalty, it survives. If not, it naturally dims out. The grammar rules are selective pressure, not a gate.

### Interface Shape

The pattern's connection points â€” the open edge of the Bloom's C-shape. This is the receptor site. It defines what shapes can dock here.

- **inputs** â€” What the pattern consumes. Type declarations are semantic, not schema-strict. `"text/document"` means "this expects text input that represents a document." The receiving deployment maps this to its own types.
- **outputs** â€” What the pattern produces.
- **exposes** â€” Internal components available for external read. A Grid that's exposed can be queried by other patterns. A Resonator that's exposed can be composed into larger patterns.

### Dependencies

What the pattern needs to function. Deliberately minimal:

- **requires_models** â€” Categories, not specific models. `"llm/general"` not `"claude-sonnet-4-20250514"`. The receiving deployment maps to its own available models via its Thompson Sampler. This is why models are substrate, not participants â€” the pattern doesn't care *which* LLM, only that one exists.
- **requires_grids** â€” External knowledge structures the pattern expects to exist (e.g., a shared taxonomy). Empty means self-contained.
- **requires_external** â€” APIs, services, or resources outside the pattern. The honest declaration of external coupling.

---

## 3. State

The pattern's three state dimensions as computed by the originating deployment. These are the same three dimensions the Codex defines for every morpheme â€” nothing new, nothing parallel. The State section is the pattern's structural properties in transit.

```json
{
  "state": {
    "phi_l": {
      "value": 0.87,
      "trend": "stable",
      "factors": {
        "axiom_compliance": 1.0,
        "provenance_clarity": 0.85,
        "usage_success_rate": 0.94,
        "temporal_stability": 0.88
      }
    },

    "psi_h": {
      "internal_coherence": 0.91,
      "note": "Relational property â€” recomputed on connection to receiving graph"
    },

    "epsilon_r": {
      "value": 0.05,
      "range": "stable"
    }
  }
}
```

### Why This Structure

In v0.1, the Health section carried `observation_summary` (success_rate, total_executions, mean_latency) alongside `phi_l` (current, trend). But `success_rate` is an input to the Î¦L formula (`usage_success_rate`), and Î¦L is the output. The envelope was transmitting both the inputs and the output of the same computation.

Now, State carries the **computed dimensions** â€” exactly what the Codex defines. The raw inputs that produced those dimensions live in Provenance (section 4), where they serve a different purpose: helping the receiving deployment calibrate how much to trust these numbers.

### Î¦L â€” Health Score

The composite score from the Engineering Bridge formula:

```
Î¦L = wâ‚ Ã— axiom_compliance + wâ‚‚ Ã— provenance_clarity + wâ‚ƒ Ã— usage_success_rate + wâ‚„ Ã— temporal_stability
```

The `factors` object exposes the four inputs. This is transparency, not duplication. A receiving deployment can see *why* Î¦L is 0.87. A pattern with high Î¦L driven mostly by `axiom_compliance` (structurally sound but lightly tested) is different from one driven by `usage_success_rate` (battle-tested but loosely structured). The factors tell the story.

**Trend** is one of: `improving`, `stable`, `declining`. Derived from the slope of Î¦L over the observation window. A pattern at 0.72 and `improving` is more promising than one at 0.85 and `declining`.

### Î¨H â€” Harmonic Signature

Î¨H is relational â€” it emerges through composition, not intrinsically. A pattern can report its *internal* coherence (how well its constituent morphemes resonate with each other), but its Î¨H relative to the receiving graph is unknown until connection. That's what attunement discovers.

### ÎµR â€” Exploration Rate

The fraction of the pattern's routing decisions that sampled uncertain alternatives rather than exploiting known-best options.

| ÎµR Value | Range | Meaning |
|---|---|---|
| 0.0 | `rigid` | No exploration. Brittle. |
| 0.01â€“0.10 | `stable` | Light exploration. Confident. |
| 0.10â€“0.30 | `adaptive` | Active learning. Environment changing or system new. |
| > 0.30 | `unstable` | Confidence collapsed or very new. |

A pattern arriving with `rigid` ÎµR should be treated with caution â€” it may be overfit to its origin environment. A pattern with `adaptive` ÎµR is actively learning, which is healthy but means its Î¦L may be volatile.

---

## 4. Provenance

The context that enables a receiving deployment to discount the State dimensions. This is not health data â€” it is *meta-data about the health data*. How deep are the observations? How broad is the network validation? What environment produced these numbers?

```json
{
  "provenance": {
    "observation_depth": {
      "total_observations": 1847,
      "observation_window_days": 45,
      "last_observation": "2026-02-12T18:30:00Z"
    },

    "network_presence": {
      "deployments_attuned": 12,
      "network_mean_phi_l": 0.82,
      "earliest_attunement": "2026-01-15T00:00:00Z"
    },

    "origin_context": {
      "deployment_scale": "medium",
      "primary_domain": "document_processing",
      "model_diversity": 3,
      "note": "Optimised for English-language legal documents"
    }
  }
}
```

### Observation Depth

How much evidence backs the State dimensions. A pattern with 1,847 observations over 45 days has earned its Î¦L. A pattern with 12 observations over 2 days has not. The receiving deployment uses observation depth to scale its import discount:

```
import_confidence = (1 - e^(-0.05 Ã— observations)) Ã— (1 - e^(-0.1 Ã— window_days))
```

This mirrors the maturity modifier from the Engineering Bridge â€” the same formula that prevents cold-start inflation locally now prevents foreign-pattern inflation during import.

### Network Presence

How many other deployments have attuned to this pattern and what they observed. This is where the network effect lives.

A pattern attuned across 12 deployments with a mean Î¦L of 0.82 is very different from a pattern with 1 deployment at Î¦L 0.95. The first has survived diverse environments. The second might be overfit to its origin.

Network presence is gossip-propagated and eventually consistent. A deployment can lie about its observations, but a deployment that consistently overstates Î¦L for patterns that perform poorly elsewhere will find its own gossip discounted by the network. Trust is recursive and earned. Exactly like Î¦L itself.

### Origin Context

Honest metadata about where this pattern works best. Not requirements â€” context. A pattern optimised for English-language legal documents might work fine for French medical documents, but you should know what it was optimised for so you can set expectations correctly.

### What Travels vs. What Doesn't

**Travels:** Computed state dimensions. Factor breakdowns. Observation counts. Network presence statistics. Origin context. These are compact, privacy-preserving, and meaningful across environments.

**Does not travel:** Raw observations (Stratum 2). Individual execution traces. Model-specific performance data. User data. These stay in the originating deployment. The State section is the distillation (Stratum 3 per Memory Topology) â€” lessons without the raw material.

---

## 5. Payload

The actual implementation. Deliberately the simplest section.

```json
{
  "payload": {
    "type": "configuration",
    "format": "codex-pattern/v1",
    "content": {
      "// The actual pattern configuration": "...",
      "// Prompt templates, routing rules,": "...",
      "// model preferences, threshold settings": "..."
    }
  }
}
```

Or for patterns that reference external code:

```json
{
  "payload": {
    "type": "reference",
    "format": "npm",
    "package": "@patterns/doc-processor",
    "version": "^2.1.0",
    "integrity": "sha256:c4d5..."
  }
}
```

The payload is opaque to the protocol. The Bloom carries the structural and state information that enables evaluation. The payload carries the implementation that enables execution. Attunement doesn't care what's inside the payload â€” it cares about the Bloom.

---

## Attunement

When a Bloom from one deployment encounters a Bloom from another, attunement begins. This is not a handshake in the API sense â€” it is a process of discovering whether two structures can resonate.

### The Topology

Attunement starts as a single Line â€” a resonant connection between two Bloom boundaries, interface shapes touching at their open C-edges. This is G1 (connection requires intent) satisfied at whatever scale the connection occurs. Someone deliberately initiated this.

That initial Line is the trunk. It carries the Bloom's self-description â€” Structure, State, Provenance. The receiving deployment evaluates. If compatible, the Line brightens. If not, it dims and disconnects. This is Î¨H doing its job: structural compatibility is either there or it isn't.

**What happens when attunement succeeds:**

Once thresholds are crossed and the pattern enters its integration lifecycle (Dormant â†’ Connected â†’ Active), the topology changes. The single trunk Line fans out. Internal morphemes begin forming their own connections â€” pattern-to-pattern Lines, Seed-to-Seed references, Grid-to-Grid knowledge sharing. The trunk resolves into a mesh of relationships at lower scales.

This is the fractal at work. At the deployment scale, you see one Line between two Blooms. Zoom in, and that Line resolves into dozens of connections between internal morphemes. Zoom in further, and individual Seeds are exchanging data across the boundary. A pattern shared across thousands of deployments doesn't have one connection â€” it's porous, with thousands of independent attunement Lines, each carrying local observations, each contributing to the pattern's network presence.

**What happens when attunement fails:**

Nothing. The Line dims. No error code. No retry with different credentials. The shapes didn't fit. The receiving deployment may keep the Bloom as Dormant â€” visible but isolated, available for future attunement attempts if the graph evolves into a shape where the interface matches. Or it may discard it. The Codex's pattern hygiene handles both cases without special rules.

### The Lifecycle

The lifecycle is the Codex's existing integration lifecycle. The Bloom arrives, unfolds, and follows the same path every other component follows. No special "foreign pattern" handling needed.

```
Bloom arrives via attunement Line
    â”‚
    â–¼
1. VERIFY IDENTITY
   - Compute SHA-256 of Structure + Payload
   - Compare to declared content_hash
   - If mismatch â†’ reject (tampered)
    â”‚
    â–¼
2. CHECK VERSION
   - Is codex_version compatible?
   - Same major version â†’ proceed
   - Different major version â†’ translation required (or reject)
    â”‚
    â–¼
3. VERIFY GRAMMAR
   - Walk the morpheme composition graph
   - Check G1-G5 compliance independently
   - Flag violations (don't reject)
   - Violations feed axiom_compliance factor in
     locally-computed Î¦L
    â”‚
    â–¼
4. EVALUATE COMPATIBILITY (Î¨H)
   - Do the interface shapes match connection points?
   - Are declared dependencies satisfiable?
   - Does the morpheme composition structurally fit
     the receiving graph?
   - This is where Î»â‚‚ matters if computed â€” does adding
     this pattern maintain or improve algebraic connectivity?
   - Internal coherence (from State.psi_h) is compared
     against the receiving graph's harmonic profile
   - This IS the attunement check â€” resonance or dissonance
    â”‚
    â–¼
5. IMPORT AS DORMANT
   - Pattern enters the graph as a Dormant Seed
   - Local Î¦L initialised from imported State, discounted
     by Provenance (observation_depth, network_presence)
   - No active connections yet
   - Visible but isolated
    â”‚
    â–¼
6. INTEGRATION
   - The Codex's existing integration lifecycle takes over
   - Dormant â†’ Connected (trial, shadow mode, limited traffic)
   - Local observations accumulate (Stratum 2)
   - Local Î¦L forms from local observations, gradually
     replacing the imported Î¦L
   - Connected â†’ Active (local Î¦L converges to Healthy range)
   - OR: Connected â†’ Dormant (local Î¦L degrades, disconnect)
   - OR: Dormant too long â†’ archived via pattern hygiene
   - When Active: this deployment's Î¦L for this pattern
     becomes eligible for gossip propagation â€” the network
     learns this attunement succeeded
```

Six steps. Steps 1-4 are the attunement itself â€” evaluation of the Bloom. Steps 5-6 are the Codex's normal integration lifecycle, unchanged. There is no separate "attestation" step. When a pattern reaches Active status, its locally-computed Î¦L *is* the attestation. Gossip makes it visible to the network. The state dimensions are the attestation. Nothing more is needed.

---

## Discovery

How do deployments find patterns? Three mechanisms, ordered by maturity:

### Phase 1: Direct Share (Now)

You have a pattern that works. You export the Bloom. You send it to someone â€” file, URL, message. They import it. This is how the first 10-100 patterns will spread. No infrastructure needed. Just the Bloom format.

```
codex export doc-processor > doc-processor.bloom.json
codex import doc-processor.bloom.json
```

### Phase 2: Registry (codexsignum.com)

A public index of Bloom envelopes hosted at codexsignum.com. Content-addressed (the hash is the lookup key). Searchable by interface shape, domain, state dimensions. Anyone can publish. Anyone can browse. The registry stores Blooms, not payloads â€” it's a catalogue, not a package manager.

The registry doesn't validate or endorse. It indexes. Î¦L and network presence provide the quality signal.

```
codex search --interface "text/document â†’ text/response"
codex search --domain "software_development"
codex pull sha256:7f3a...
```

### Phase 3: Gossip (Federated)

Deployments that opt into federation share pattern state gossip. "Pattern X has Î¦L 0.89 in my deployment." "Pattern Y degraded after connecting to Pattern Z." This is Stratum 4 (Institutional Memory) going cross-boundary.

Gossip is eventually consistent. No central coordinator. Each deployment decides what to trust based on the track record of the gossiping peers. A deployment whose gossip consistently correlates with your local observations is weighted more heavily. One whose gossip is unreliable gets discounted.

---

## Where This Lives

### Neo4j â€” Runtime State

Attunement's *effects* live in Neo4j. The Engineering Bridge principle holds: "Neo4j is the single source of truth for both component relationships and component health."

When a Bloom is imported:

| What Happens | Where in Neo4j |
|---|---|
| Pattern enters as Dormant | Node created with morpheme composition stored as child nodes and relationships. Imported state dimensions stored as properties, discounted by provenance. |
| Trial connection | Relationship created between pattern's interface points and receiving graph's connection points. Execution records (Stratum 2) accumulate as observation nodes. |
| Integration to Active | State transitions. Î¦L computed from local observations via standard formula. Pattern participates in normal routing and feedback. |
| Gossip | If federated, locally-computed Î¦L published as gossip keyed to content_hash. |

```cypher
// Import a Bloom as Dormant
CREATE (p:Pattern {
  content_hash: $hash,
  codex_version: "2.5",
  scale: "pattern",
  state: "dormant",
  imported_phi_l: $phi_l,
  import_confidence: $confidence,
  origin: $origin,
  attuned_at: datetime()
})

// Store morpheme composition
CREATE (p)-[:CONTAINS]->(r:Resonator { id: "extract", role: "entity_extraction" })
CREATE (p)-[:CONTAINS]->(g:Grid { id: "knowledge", type: "persistent" })

// Trial connection
MATCH (p:Pattern { content_hash: $hash })
MATCH (target:Interface { id: $connection_point })
CREATE (p)-[:ATTUNED_TO { trial: true, started: datetime() }]->(target)

// Transition to Active
MATCH (p:Pattern { content_hash: $hash })
SET p.state = "active"
MATCH (p)-[a:ATTUNED_TO]->(target)
SET a.trial = false
```

### codexsignum.com â€” Registry & Specification

The public layer:

- **Specification hosting** â€” Codex Signum v2.5, Engineering Bridge, Attunement Protocol, JSON schema
- **Bloom registry** (Phase 2) â€” Content-addressed store. Search by interface shape, domain, network presence. Anyone can publish.
- **Network health aggregation** (Phase 3) â€” Optional: aggregates gossip into network-wide views. Which patterns are thriving across the federation.

The registry stores Blooms, not payloads. It is a catalogue, not a runtime. Î¦L is computed locally in each deployment's Neo4j instance. The registry displays aggregate network presence â€” it does not compute or validate health.

---

## What Attunement Does NOT Do

**It does not enforce access control.** Patterns are published or they're not. There's no permissioning system. If you don't want a pattern shared, don't export it. Once exported, it's in the wild. This is by design â€” the network effect requires frictionless sharing.

**It does not guarantee compatibility.** The Î¨H pre-check (step 4) is structural, not semantic. Two patterns might have perfectly matching interface shapes and still produce garbage when composed. That's what the trial connection catches. Structure enables evaluation; it doesn't replace it.

**It does not centralise trust.** There is no "verified pattern" badge. No certification authority. Trust is emergent from Î¦L across the network. Early patterns have low trust and must earn it â€” exactly like new components in a single deployment.

**It does not version patterns.** A changed pattern is a new pattern (different content_hash). Both can exist simultaneously. The better one accumulates higher Î¦L and naturally displaces the old one. Versioning is selection pressure, not version numbers.

**It does not transmit raw data.** No execution traces, no user data, no raw observations cross the boundary. Only computed state dimensions and provenance statistics. Privacy is maintained by the protocol's design, not by policy.

**It does not introduce new concepts.** No new morphemes, axioms, grammar rules, or state dimensions. Attunement is the Codex's existing connection grammar applied to its own distribution.

**It does not define a deployment boundary.** There is no "outermost Bloom" concept. Patterns connect where their interface shapes match. A single pattern might be attuned across thousands of deployments simultaneously, each with its own local Î¦L, each contributing to the pattern's network presence. The network is porous by design.

---

## Concrete Example

Your multi-agent Thompson sampling coding pattern, as a Bloom envelope:

```json
{
  "identity": {
    "content_hash": "sha256:7f3a...",
    "codex_version": "2.5",
    "scale": "pattern",
    "created_at": "2026-02-13T12:00:00Z",
    "origin": "bloom:your-origin"
  },

  "structure": {
    "morphemes": {
      "bloom": {
        "id": "coding-pipeline",
        "shape": "open",
        "contains": ["scope", "execute", "review", "validate",
                     "model-router", "execution-history", "learning-loop"]
      },
      "resonators": [
        { "id": "scope", "orientation": "down", "role": "task_decomposition" },
        { "id": "execute", "orientation": "up", "role": "code_generation" },
        { "id": "review", "orientation": "down", "role": "quality_review" },
        { "id": "validate", "orientation": "up", "role": "output_validation" },
        { "id": "model-router", "orientation": "up", "role": "model_selection",
          "mechanism": "thompson_sampling" }
      ],
      "grids": [
        { "id": "execution-history", "type": "persistent",
          "schema_ref": "execution_trace_v1" }
      ],
      "helixes": [
        { "id": "learning-loop", "mode": "learning",
          "feeds_into": "model-router",
          "source": "execution-history" }
      ],
      "lines": [
        { "from": "input", "to": "scope", "direction": "forward" },
        { "from": "scope", "to": "model-router", "direction": "forward" },
        { "from": "model-router", "to": "execute", "direction": "forward" },
        { "from": "execute", "to": "review", "direction": "forward" },
        { "from": "review", "to": "execute", "direction": "return",
          "condition": "needs_correction" },
        { "from": "review", "to": "validate", "direction": "forward",
          "condition": "passes_review" },
        { "from": "validate", "to": "output", "direction": "forward" },
        { "from": "validate", "to": "execution-history", "direction": "parallel" },
        { "from": "execution-history", "to": "learning-loop", "direction": "forward" },
        { "from": "learning-loop", "to": "model-router", "direction": "return" }
      ]
    },

    "grammar_compliance": {
      "G1_proximity": true,
      "G2_orientation": true,
      "G3_containment": true,
      "G4_flow": true,
      "G5_resonance": true,
      "violations": []
    },

    "interface": {
      "inputs": [
        { "id": "input", "type": "seed", "accepts": "text/task_description" }
      ],
      "outputs": [
        { "id": "output", "type": "seed",
          "produces": "code/validated_implementation" }
      ],
      "exposes": [
        { "id": "execution-history", "type": "grid", "access": "read" },
        { "id": "model-router", "type": "resonator", "access": "observe" }
      ]
    },

    "dependencies": {
      "requires_models": ["llm/code_generation", "llm/code_review"],
      "requires_grids": [],
      "requires_external": []
    }
  },

  "state": {
    "phi_l": {
      "value": 0.84,
      "trend": "improving",
      "factors": {
        "axiom_compliance": 1.0,
        "provenance_clarity": 0.78,
        "usage_success_rate": 0.91,
        "temporal_stability": 0.80
      }
    },
    "psi_h": {
      "internal_coherence": 0.88,
      "note": "Tight feedback loop between learning-loop and model-router contributes to high internal resonance"
    },
    "epsilon_r": {
      "value": 0.08,
      "range": "stable"
    }
  },

  "provenance": {
    "observation_depth": {
      "total_observations": 342,
      "observation_window_days": 21,
      "last_observation": "2026-02-13T11:45:00Z"
    },
    "network_presence": {
      "deployments_attuned": 1,
      "network_mean_phi_l": 0.84,
      "earliest_attunement": "2026-01-23T00:00:00Z"
    },
    "origin_context": {
      "deployment_scale": "small",
      "primary_domain": "software_development",
      "model_diversity": 4,
      "note": "TypeScript/Node.js focus. 4-stage pipeline with recursive correction."
    }
  },

  "payload": {
    "type": "configuration",
    "format": "codex-pattern/v1",
    "content": "..."
  }
}
```

Someone imports this. They see: a 4-stage coding pipeline with Thompson sampling model selection, a learning loop that feeds execution history back to routing, clean grammar compliance, Î¦L at 0.84 and improving â€” with factors showing strong axiom compliance and good success rate but moderate provenance clarity (young pattern, single origin). ÎµR is stable. Internal coherence is high. 342 observations over 21 days â€” enough to take seriously but not enough to trust blindly.

It arrives Dormant. The Codex takes over. If it performs, it brightens. If it doesn't, it dims. No committee. No approval process. Just structural evaluation and observed behaviour â€” the same as every other component.

---

## Relationship to Existing Specification

This protocol introduces no new morphemes, axioms, grammar rules, or state dimensions. It composes entirely from existing concepts:

| Attunement Element | Codex Source |
|---|---|
| Bloom envelope | Bloom (â—‹) â€” scope, boundary, context. The existing morpheme, in transit. |
| Morpheme composition | The six morphemes + five grammar rules â€” structural description |
| State dimensions (Î¦L, Î¨H, ÎµR) | The three dimensions every morpheme carries |
| Provenance discounting | Maturity modifier from Engineering Bridge â€” preventing cold-start inflation |
| Interface shape | G1 (Proximity) + G3 (Containment) â€” connection points at boundary |
| Attunement Line | Line (â†’) â€” the existing morpheme, carrying connection intent across boundaries |
| Trunk-to-mesh fan-out | G3 containment + G5 resonance â€” internal Lines form as attunement deepens |
| Import as Dormant | Dormant Seed concept from v2.5 â€” present but unconnected |
| Integration lifecycle | Created â†’ Dormant â†’ Connected â†’ Active from Engineering Bridge |
| Network presence (gossip) | Distributed self-policing from v2.5 â€” reputation through observation |
| Scale invariance | Fractal property â€” "any valid expression at one scale remains valid at all scales" |

The protocol is the Codex applied to its own distribution. Patterns travel the same way they operate â€” structurally described, state-visible, grammar-governed. Attunement is just connection. The Codex already knows how to connect.

---

## Changes from v0.1

| What Changed | v0.1 | v0.2 | Why |
|---|---|---|---|
| Protocol name | Pattern Exchange Protocol | Attunement | Describes resonance-seeking, not packet transfer |
| Envelope concept | "Pattern envelope" (new concept) | Bloom (existing morpheme, in transit) | The Bloom already *is* the envelope. No new concept needed. |
| Deployment boundary | "Signum" (formal concept) | No formal boundary | The network is porous. Patterns connect where interface shapes match. No outermost Bloom. |
| Health section | Flat: observation_summary + phi_l + epsilon_r + network_attestations + origin_context | Split into State (Î¦L/Î¨H/ÎµR) + Provenance (depth/presence/context) | Eliminates duplication â€” success_rate was both an observation field and a Î¦L input |
| State dimensions | Î¦L and ÎµR only | Î¦L, Î¨H, and ÎµR | Aligns with Codex's three dimensions per morpheme |
| Î¦L representation | Opaque value + trend | Value + trend + factor breakdown | Transparency: receiving deployment sees *why* not just *what* |
| Connection topology | One-to-one Signum boundary | Trunk Line â†’ mesh fan-out at lower scales | Matches how the Codex grammar actually composes connections |
| Lifecycle steps | 8 (including separate Attestation) | 6 (attunement check + standard integration lifecycle) | Attestation = Î¦L + gossip. No separate step. The state dimensions *are* the attestation. |
| Post-integration | Named "graft" | Unnamed â€” the Codex does its thing | The integration lifecycle isn't special for foreign patterns. Same rules, same grammar. |
| Scale field | signum_version + implicit pattern scale | codex_version + explicit scale (seed/pattern) | Fractal: same format at every scale. No Signum-level scale needed. |
| File extension | `.signum.json` | `.bloom.json` | The file is a Bloom. |

---

## Next Steps

1. **Formalise the JSON schema** for the Bloom envelope. Make it validatable. Publish at codexsignum.com.
2. **Build `codex export` and `codex import`** CLI commands. These serialize a pattern's Neo4j subgraph into a Bloom and import a Bloom as a Dormant Seed. Direct share first.
3. **Test with one pattern** â€” export your coding pipeline, import to a second deployment, verify that the Codex's integration lifecycle handles the rest without special rules.
4. **Then stop and observe.** The protocol will tell you what's missing once real patterns start traveling.

---

*Blooms carry their own structure. The network provides the selection pressure. What attunes, brightens. What doesn't, dims. The protocol just makes the connection possible.*
