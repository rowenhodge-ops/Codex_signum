# Codex Signum — Pattern Exchange Protocol

## How Patterns Travel Between Signums

**Version:** 0.1 (Draft)  
**Companion to:** Codex Signum v2.5  
**Date:** 2026-02-13

---

## Design Principle

A pattern that travels between Signums carries the minimum information needed for the receiving Signum to answer three questions:

1. **What is it?** — Structure (morpheme composition, grammar compliance)
2. **Does it work?** — Health (ΦL history, εR profile)
3. **Will it fit here?** — Compatibility (interface shape, dependency declarations)

Everything else is discoverable after connection. Like HTTP, the protocol is stateless at the exchange level — each pattern carries everything needed to evaluate it. Like DNS, trust accumulates through the network over time but is not required for the first connection.

---

## The Pattern Envelope

Every pattern that crosses a Signum boundary is wrapped in an envelope. This is the unit of exchange — the "HTTP request" of Codex Signum.

```
┌─────────────────────────────────────────┐
│  PATTERN ENVELOPE                       │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Identity                       │    │
│  │  - content_hash (SHA-256)       │    │
│  │  - signum_version (e.g. "2.5")  │    │
│  │  - created_at                   │    │
│  │  - origin_signum (optional)     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Structure                      │    │
│  │  - morpheme_composition         │    │
│  │  - grammar_compliance (G1-G5)   │    │
│  │  - interface_shape              │    │
│  │  - dependency_declarations      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Health (portable ΦL)           │    │
│  │  - observation_summary          │    │
│  │  - εR_profile                   │    │
│  │  - origin_context               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Payload                        │    │
│  │  - configuration                │    │
│  │  - (code or reference)          │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

That's it. Four sections. Let's walk through each.

---

## 1. Identity

The pattern's fingerprint. Immutable once published.

```json
{
  "identity": {
    "content_hash": "sha256:a3f2...",
    "signum_version": "2.5",
    "created_at": "2026-02-13T10:00:00Z",
    "origin_signum": "signum:b7e4..."
  }
}
```

**content_hash** — SHA-256 of the Structure + Payload sections. This is the pattern's identity. Two patterns with the same hash are the same pattern regardless of where they came from. Like content-addressed storage (IPFS, Git), the hash *is* the name.

**signum_version** — Which version of the Codex this pattern was built against. A v2.5 pattern connects to a v2.5 Signum without translation. Cross-version compatibility follows the ossification rules — core morphemes don't change, so structural compatibility is preserved. Only if a major version boundary is crossed (v3.0) would translation be needed.

**origin_signum** — Optional. The Signum that first published this pattern. Not required for the pattern to function (patterns are self-describing), but enables provenance tracking across the network. A pattern with no origin is anonymous — valid but carrying lower provenance_clarity in ΦL computation.

---

## 2. Structure

What the pattern *is*, expressed in Codex terms. This is the DNA — the morpheme composition that any Signum can read.

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

This is the pattern's body plan. Every morpheme is declared with its type, role, and relationships. A receiving Signum can reconstruct the pattern's graph topology from this alone — without running it, without trusting it, without knowing anything about its origin.

The morpheme composition is what enables structural compatibility checking. If your Signum has a document processing pipeline and someone offers a pattern with an entity extraction Resonator, the receiving Signum can see from the composition alone whether this Resonator's interface shape matches the existing pipeline's needs.

### Grammar Compliance

Self-declared but verifiable. The envelope claims G1-G5 compliance and lists any known violations. A receiving Signum **must re-verify** — self-declared compliance is a hint, not a guarantee. Verification is cheap (structural graph walk) and should be automatic on import.

A pattern with grammar violations is not rejected — it's flagged. The violations reduce the `axiom_compliance` factor in ΦL computation, which means it starts dimmer. If it performs well enough to overcome the ΦL penalty, it survives. If not, it naturally dims out. The grammar rules are selective pressure, not a gate.

### Interface Shape

The pattern's connection points. This is the receptor site from the DNA metaphor — it defines what shapes can dock here.

- **inputs** — What the pattern consumes. Type declarations are semantic, not schema-strict. `"text/document"` means "this expects text input that represents a document." The receiving Signum maps this to its own types.
- **outputs** — What the pattern produces.
- **exposes** — Internal components available for external read. A Grid that's exposed can be queried by other patterns. A Resonator that's exposed can be composed into larger patterns.

### Dependencies

What the pattern needs to function. This is kept deliberately minimal:

- **requires_models** — Categories, not specific models. `"llm/general"` not `"claude-sonnet-4-20250514"`. The receiving Signum maps to its own available models via its Thompson Sampler. This is why models are substrate, not participants — the pattern doesn't care *which* LLM, only that one exists.
- **requires_grids** — External knowledge structures the pattern expects to exist (e.g., a shared taxonomy). Empty means self-contained.
- **requires_external** — APIs, services, or resources outside the Signum. This is the honest declaration of external coupling.

---

## 3. Health (Portable ΦL)

The pattern's track record. This is the most nuanced section because health is context-dependent — a pattern that thrived in one Signum may struggle in another.

```json
{
  "health": {
    "observation_summary": {
      "total_executions": 1847,
      "success_rate": 0.94,
      "mean_latency_ms": 320,
      "observation_window_days": 45,
      "last_execution": "2026-02-12T18:30:00Z"
    },

    "phi_l": {
      "current": 0.87,
      "trend": "stable",
      "time_in_trusted": 0.72,
      "time_in_degraded": 0.03
    },

    "epsilon_r": {
      "current": 0.05,
      "mean_30d": 0.07,
      "spikes": 2,
      "last_spike_reason": "model_provider_outage"
    },

    "network_attestations": {
      "signums_using": 12,
      "mean_phi_l_across_network": 0.82,
      "earliest_adoption": "2026-01-15T00:00:00Z"
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

### What travels vs. what doesn't

**Travels:** Summary statistics. Trend direction. Time-in-state ratios. Network attestation counts. These are compact, privacy-preserving, and meaningful across contexts.

**Does not travel:** Raw observations (Stratum 2). Individual execution traces. Model-specific performance data. User data. These stay in the originating Signum. The summary is the distillation (Stratum 3) — lessons without the raw material.

### Network Attestations

This is where the network effect lives. A pattern used by 12 Signums with a mean ΦL of 0.82 is very different from a pattern used by 1 Signum with ΦL of 0.95. The first has survived diverse environments. The second might be overfit to its origin.

Attestations are not endorsements — they're observations. Each Signum that adopts a pattern contributes its own ΦL measurement to the aggregate. No central authority collects or validates these. The numbers are gossip-propagated and eventually consistent. A Signum can lie about its attestation, but a Signum that consistently attests high ΦL for patterns that perform poorly will find its own attestations discounted by the network (because patterns it recommends keep failing elsewhere).

Trust is recursive and earned. Exactly like ΦL itself.

### Origin Context

Honest metadata about where this pattern works best. Not requirements — context. A pattern optimised for English-language legal documents might work fine for French medical documents, but the receiving Signum should know what it was optimised for so it can set expectations correctly.

---

## 4. Payload

The actual implementation. This is deliberately the simplest section.

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

The payload is opaque to the protocol. The envelope carries the structural and health information that enables evaluation. The payload carries the implementation that enables execution. The protocol doesn't care what's inside the payload — it cares about the envelope.

---

## Connection Lifecycle

When a pattern from Signum A arrives at Signum B, this is what happens:

```
Pattern arrives
    │
    ▼
1. VERIFY IDENTITY
   - Compute SHA-256 of Structure + Payload
   - Compare to declared content_hash
   - If mismatch → reject (tampered)
    │
    ▼
2. CHECK VERSION
   - Is signum_version compatible?
   - Same major version → proceed
   - Different major version → translation required (or reject)
    │
    ▼
3. VERIFY GRAMMAR
   - Walk the morpheme composition graph
   - Check G1-G5 compliance independently
   - Flag violations (don't reject)
    │
    ▼
4. EVALUATE COMPATIBILITY (ΨH pre-check)
   - Do the interface shapes match connection points?
   - Are declared dependencies satisfiable?
   - Does the morpheme composition structurally fit
     the receiving graph? (This is where λ₂ matters
     if computed — does adding this pattern maintain
     or improve algebraic connectivity?)
    │
    ▼
5. IMPORT AS DORMANT
   - Pattern enters the graph as a Dormant Seed
   - ΦL initialised from portable health, discounted
     by provenance_clarity and foreign_context factors
   - No active connections yet
   - Visible but isolated
    │
    ▼
6. TRIAL CONNECTION
   - Pattern is connected to one interface point
   - Runs in shadow mode or limited traffic
   - Local observations begin accumulating
   - Local ΦL starts forming independently of
     the portable ΦL
    │
    ▼
7. INTEGRATION
   - If local ΦL converges to Healthy range → full connection
   - If local ΦL degrades → disconnect, return to Dormant
   - If Dormant too long → natural archival via pattern hygiene
    │
    ▼
8. ATTESTATION
   - If integrated and performing, this Signum's observations
     contribute to the pattern's network attestations
   - Gossip propagation shares updated health to other Signums
```

### The critical insight: import as Dormant

Patterns don't arrive and immediately start processing traffic. They arrive as Dormant Seeds — visible but isolated. The existing integration lifecycle (Created → Dormant → Connected → Active) handles everything. No new states needed. No special "foreign pattern" handling. The Codex already describes how components earn their way from dormancy to active participation.

The portable ΦL gives the pattern a starting brightness — it doesn't arrive completely dark. But that starting brightness is discounted because local observations haven't confirmed it yet. A pattern with network attestations from 50 Signums starts brighter than one from 1 Signum, but both still need to prove themselves locally.

This is the biological immune system at work. Foreign proteins are admitted, evaluated, and either integrated or rejected based on observed behaviour — not based on credentials.

---

## Discovery

How do Signums find patterns? Three mechanisms, ordered by maturity:

### Phase 1: Direct Share (Now)

You have a pattern that works. You export the envelope. You send it to someone (file, URL, message). They import it. This is how the first 10-100 patterns will spread. No infrastructure needed. Just the envelope format.

```
signum export doc-processor > doc-processor.signum.json
signum import doc-processor.signum.json
```

### Phase 2: Registry (Near-term)

A public index of pattern envelopes. Content-addressed (the hash is the lookup key). Searchable by interface shape, domain, health metrics. Anyone can publish. Anyone can browse. The registry stores envelopes, not payloads — it's a catalogue, not a package manager.

Think npm registry but for pattern envelopes. The registry doesn't validate or endorse. It indexes. ΦL and network attestations provide the quality signal.

### Phase 3: Gossip (Federated)

Signums that opt into federation share pattern health gossip. "Pattern X has ΦL 0.89 in my deployment." "Pattern Y degraded after connecting to Pattern Z." This is Stratum 4 (Institutional Memory) going cross-Signum.

Gossip is eventually consistent. No central coordinator. Each Signum decides what to trust based on the track record of the gossiping peers. A Signum whose gossip consistently correlates with your local observations is weighted more heavily. One whose gossip is unreliable gets discounted.

---

## What This Protocol Does NOT Do

**It does not enforce access control.** Patterns are published or they're not. There's no permissioning system. If you don't want a pattern shared, don't export it. Once exported, it's in the wild. This is by design — the network effect requires frictionless sharing.

**It does not guarantee compatibility.** The pre-check (step 4) is structural, not semantic. Two patterns might have perfectly matching interface shapes and still produce garbage when composed. That's what the trial connection (step 6) catches. Structure enables evaluation; it doesn't replace it.

**It does not centralise trust.** There is no "verified pattern" badge. No certification authority. Trust is emergent from ΦL across the network. This means early patterns have low trust (no network attestations) and must earn it — exactly like new components in a single Signum.

**It does not version patterns.** A changed pattern is a new pattern (different content_hash). If you improve your doc-processor, the improved version is a new envelope with a new hash. Both can exist simultaneously. The better one will accumulate higher ΦL and naturally displace the old one. Versioning is selection pressure, not version numbers.

**It does not transmit raw data.** No execution traces, no user data, no raw observations cross the boundary. Only summary statistics and structural descriptions. Privacy is maintained by the protocol's design, not by policy.

---

## Relationship to Existing Specification

This protocol introduces no new morphemes, axioms, grammar rules, or state dimensions. It composes from existing concepts:

| Protocol Element | Codex Source |
|---|---|
| Pattern envelope | Bloom boundary (○) — the pattern's scope, packaged for transport |
| Morpheme composition | The six morphemes + five grammar rules — structural description |
| Portable ΦL | State dimensions — health summary in transit |
| Interface shape | G1 (Proximity) + G3 (Containment) — connection points at boundary |
| Import as Dormant | Dormant Seed concept from v2.5 — present but unconnected |
| Trial connection | Integration lifecycle from Engineering Bridge — earning active status |
| Network attestations | Distributed self-policing from v2.5 — reputation through observation |
| Gossip propagation | Federation model from v2.5 — decentralised sharing |

The protocol is the Codex applied to its own distribution. Patterns travel the same way they operate — structurally described, health-visible, grammar-governed.

---

## Next Steps

1. **Formalise the JSON schema** for the envelope. Make it validatable.
2. **Build `signum export` and `signum import`** CLI commands. Direct share first.
3. **Test with one pattern** — export your coding pipeline, import to a second Signum instance, verify the lifecycle works.
4. **Then stop and observe.** The protocol will tell you what's missing once real patterns start traveling.

---

*Patterns carry their own DNA. The network provides the selection pressure. What works, brightens. What doesn't, dims. The protocol just makes the journey possible.*
