# Create LLM Invocation Transformation Definition spec

> Task ID: t1
> Model: claude-opus-4-6:adaptive:low
> Duration: 149263ms
> Output chars: 24786
> Timestamp: 2026-03-23T09:11:03.308Z

> **⚠️ Hallucination flags (1):**
> - [content/warning] Task t1 references "grep -q 'LLM.*Invocation.*Transformation' docs/specs/instantiation-mutation-resonator-design.md" but this file was not in its context

---

# LLM Invocation Transformation Definition — Specification Analysis

**Status:** Analysis — Cognitive Bloom Cycle 1, Task t1
**Pre-survey:** λ₂=0 (no structural coupling yet), ψH=0.6 (moderate health)
**Grounded In:** Codex Signum v5.0, Instantiation-Mutation Resonator Design Spec
**Purpose:** Define the LLM Invocation Transformation type so that Cognitive Bloom cycles have a governed, observable, structurally enforced mechanism for delegating reasoning to external LLM services.

---

## 1. Positioning Within the Graph

### 1.1 What This Transformation Is

The LLM Invocation Transformation is a **Resonator type definition** — a definition Seed that lives in the Constitutional Bloom alongside the existing 41 definition Seeds and the three governance Resonators. Instances of this transformation are Resonators contained within Cognitive Blooms. They are not utility functions. They are not API wrappers. They are morpheme instances in the graph, subject to the same governance, observation, and ΦL measurement as everything else.

This is the critical finding: an LLM call that is invisible to the graph is an unobservable side effect. The graph cannot measure how well its reasoning delegations are working. It cannot learn from failures. It cannot detect degradation patterns. Making LLM invocation a Resonator means:

- The Assayer can evaluate output quality against input context
- ΦL dims when invocations produce non-compliant or low-fitness outputs
- Scale 2 learning can detect invocation patterns (which models fail for which tasks, which prompt structures produce the most refinement cycles, which context injection strategies correlate with high-fitness output)
- The immune memory can observe invocation anomalies (repeated failures, cost spikes, latency degradation)

### 1.2 Definition Seed Identity

```
Seed {
  id: 'def:transformation:llm-invocation',
  name: 'LLM Invocation Transformation Definition',
  content: 'Defines the transformation type for delegating reasoning to external LLM 
            services. Encodes input/output contracts, parameter schemas, invocation 
            protocols, and observability requirements for synchronous and streaming modes.',
  seedType: 'definition',
  status: 'planned'
}
```

This Seed would be contained by the Constitutional Bloom and linked via INSTANTIATES to `def:morpheme:seed`. It serves as the type anchor — every LLM Invocation Resonator instance in the graph links to this definition via INSTANTIATES.

### 1.3 Relationship to Existing Governance Resonators

LLM Invocation Resonator instances are **created through the Instantiation Resonator**, not alongside it. The governance Resonators (Instantiation, Mutation, Line Creation) are bootstrapped in Phase A.5 with raw Cypher. LLM Invocation Resonators are Phase C entities — fully governed, created through the standard path. This distinction matters: the governance Resonators exist to make creation possible; LLM Invocation Resonators exist to make reasoning possible. Different layers, same structural enforcement.

---

## 2. Transformation Schema

### 2.1 Instance Schema

Every LLM Invocation Resonator instance must satisfy:

| Property | Required | Description |
|---|---|---|
| `id` | Yes | Unique identifier. Pattern: `resonator:llm-invocation:{bloom-id}:{ordinal}` |
| `name` | Yes | Human-readable name describing this invocation's purpose |
| `content` | Yes | What this specific invocation accomplishes within its containing Bloom |
| `type` | Yes | Must be `'llm-invocation'` — sub-classification within Resonator |
| `status` | Yes | Lifecycle state: `planned`, `active`, `degraded`, `retired` |

These are the standard Resonator requirements per the existing spec. The Instantiation Resonator enforces them at creation time. No additional enforcement layer needed.

### 2.2 Transformation-Specific Properties

Beyond base Resonator properties, LLM Invocation instances carry transformation-specific configuration as structured properties:

| Property | Required | Type | Description |
|---|---|---|---|
| `invocationMode` | Yes | `'synchronous'` \| `'streaming'` | How the response is consumed |
| `modelSelector` | Yes | Object | Model selection criteria (see §3.1) |
| `promptSchema` | Yes | Object | Prompt construction rules (see §3.2) |
| `contextInjection` | Yes | Object | Context assembly strategy (see §3.3) |
| `outputContract` | Yes | Object | Expected output structure (see §4) |
| `timeoutMs` | Yes | Number | Maximum wait before degradation signal |
| `retryPolicy` | No | Object | Retry behavior on transient failures |

**Finding:** These properties are stored as structured content on the Resonator node. They are not separate nodes. The Resonator IS its configuration — this follows the principle that every morpheme carries meaning in its `content` property. The structured transformation-specific properties extend the Resonator's content, not its node structure.

**Evidence:** The existing spec states "Every morpheme carries meaning" and rejects empty content. The LLM Invocation Resonator's meaning IS its invocation configuration. Splitting configuration into separate nodes would create a containment problem (Resonators don't contain per the interaction rules) and would require Lines to wire configuration, adding structural complexity with no governance benefit.

---

## 3. Parameter Validation Schema

### 3.1 Model Selection

```
modelSelector: {
  provider: string,          // e.g., 'anthropic', 'openai'
  model: string,             // e.g., 'claude-sonnet-4-20250514', 'gpt-4o'
  fallbackChain: string[],   // Ordered fallback models if primary unavailable
  constraints: {
    maxTokens: number,       // Output token limit
    temperature: number,     // 0.0-1.0, validated at creation
    topP?: number,           // Optional nucleus sampling
  }
}
```

**Finding:** Model selection must be validated at Resonator creation time (Instantiation Resonator hygiene check) AND at invocation time (model availability is runtime state). Creation-time validation catches structural errors (empty provider, temperature > 1.0). Invocation-time validation catches environmental errors (model deprecated, provider down). These are different failure modes with different observation patterns.

**Recommendation:** The fallback chain is critical for ψH maintenance. If the primary model is unavailable and no fallback exists, the Resonator's ΦL drops immediately — it cannot perform its transformation. The fallback chain is not a convenience; it is a structural resilience property. Require at least one entry in `fallbackChain` for any Resonator with `status: 'active'`.

### 3.2 Prompt Engineering

```
promptSchema: {
  templateId: string,        // Reference to a prompt template Seed
  systemInstruction: string, // Constitutional framing for the LLM
  variableSlots: {           // Named slots filled from input Lines
    [slotName: string]: {
      sourceLineId: string,  // Which input Line provides this value
      required: boolean,     // Reject invocation if missing?
      transform?: string,    // Optional pre-processing (truncation, summarization ref)
    }
  },
  assemblyOrder: string[],   // Ordered slot names for prompt construction
  maxPromptTokens: number,   // Budget ceiling — truncation strategy applied if exceeded
}
```

**Finding:** The prompt schema must reference a template Seed via `templateId`. This Seed is a morpheme in the graph — observable, mutable through the Mutation Resonator, versioned through its `updatedAt` timestamp. Prompt templates are NOT embedded strings; they are graph-resident Seeds with their own ΦL. This means:

- Prompt template changes are provenance-traced (Mutation Resonator records every edit)
- Template quality is observable (which templates correlate with high-fitness output?)
- Templates can be shared across multiple LLM Invocation Resonators via Lines
- The Assayer can evaluate template fitness independent of invocation fitness

**Recommendation:** The `systemInstruction` field appears redundant with the template Seed's content. Consolidate: the template Seed carries the full prompt structure including system instruction. The `systemInstruction` field on the Resonator should be reserved for Resonator-specific constitutional framing that overrides or augments the template — e.g., "You are operating within Cognitive Bloom Cycle {n}, evaluating {domain}." This is the Resonator's identity injected into the prompt, not a duplicate of the template.

### 3.3 Context Injection

```
contextInjection: {
  strategy: 'full' | 'windowed' | 'summarized' | 'selective',
  sources: [
    {
      lineId: string,        // Input Line carrying context
      priority: number,      // Higher = included first when budget-constrained
      maxTokens?: number,    // Per-source budget cap
      filter?: string,       // Dimensional filter expression for selective strategy
    }
  ],
  totalBudget: number,       // Total context token budget
  overflowBehavior: 'truncate_lowest_priority' | 'reject' | 'summarize',
}
```

**Finding:** Context injection is where the Codex graph structure provides a decisive advantage over flat prompt engineering. The input Lines to an LLM Invocation Resonator carry Seeds with dimensional profiles. The `selective` strategy uses these dimensions to inject only contextually relevant information. This is not keyword matching — it is Line conductivity Layer 3 (contextual fitness) applied to prompt construction.

**Evidence:** The existing spec defines three-layer conductivity: Layer 1 (morpheme hygiene), Layer 2 (grammatical shape), Layer 3 (contextual fitness via dimensional profile alignment). An LLM Invocation Resonator's input Lines have conductivity scores. Low-conductivity Lines carry context that is structurally valid but contextually irrelevant. The `selective` strategy filters by conductivity, injecting high-conductivity context first. This is the graph reasoning about what context the LLM needs.

**Recommendation:** The `overflowBehavior: 'summarize'` option implies a nested LLM invocation (summarize context before injecting it). This creates a dependency: an LLM Invocation Resonator may require another LLM Invocation Resonator for context preparation. This is valid — Resonators can be chained through Lines — but must be declared in the containing Bloom's topology to prevent circular invocation. Add a `maxDepth` property to context injection to cap recursive summarization.

---

## 4. Input/Output Contracts

### 4.1 Input Contract

```
Input Lines:
  ← Line from: Task Seed
       (carries: task description, acceptance criteria, domain context)
       conductivity: must be ≥ 0.5 for invocation to proceed
       
  ← Line from: Context Seeds (0..n)
       (carries: relevant graph state, prior cycle outputs, observational data)
       conductivity: used for selective injection per §3.3
       
  ← Line from: Prompt Template Seed
       (carries: prompt structure, variable slot definitions)
       conductivity: must be 1.0 — template must be fully valid
       
  ← Line from: Configuration Seed (optional)
       (carries: runtime overrides for model selection, temperature, etc.)
       conductivity: standard three-layer evaluation
```

**Finding:** The input contract uses Line conductivity as a pre-invocation quality gate. If the Task Seed Line drops below 0.5 conductivity (e.g., the task was modified and is now incomplete), the invocation does not proceed. This is not a try/catch — it is a structural signal that the input is not fit for transformation. The Resonator's ΦL reflects this: blocked invocations due to low input conductivity are observed and feed learning.

### 4.2 Output Contract

```
Output Lines:
  → Line to: Response Seed
       (carries: LLM output, structured per outputContract)
       properties: {
         model: string,           // Which model actually responded
         tokenUsage: {prompt, completion, total},
         latencyMs: number,
         finishReason: string,    // 'stop', 'length', 'content_filter', etc.
         confidence?: number,     // Self-assessed if model supports it
       }
       
  → Line to: Observation Grid
       (carries: invocation event Seed with full telemetry)
       
  → Line to: Error Seed (conditional — only on failure)
       (carries: failure type, retry count, fallback attempts, final state)
```

**Output Contract Schema:**

```
outputContract: {
  format: 'text' | 'json' | 'structured',
  schema?: object,           // JSON Schema if format is 'json' or 'structured'
  requiredFields?: string[], // Fields that must be present in structured output
  validationMode: 'strict' | 'permissive',
  postProcessing?: {
    extractFields?: string[],   // Pull specific fields from response
    transformRef?: string,      // Reference to a post-processing Resonator
  }
}
```

**Finding:** The Response Seed is a full morpheme — created through the Instantiation Resonator, contained by the Cognitive Bloom, with all required properties. The LLM's raw output becomes the Seed's `content`. Metadata (model, tokens, latency) are properties on the Seed or on the Line connecting the Resonator to the Seed. This means LLM outputs are graph-resident, observable, and subject to the same governance as every other morpheme.

**Finding:** `finishReason` is a critical observability signal. A `finishReason: 'length'` means the output was truncated — the token budget was insufficient. This should trigger a specific observation pattern: the Resonator's ΦL dims proportionally, and the observation Grid records a truncation event. Scale 2 learning can then detect: "This Resonator consistently hits token limits → recommend increasing `maxTokens` or splitting the task."

---

## 5. Invocation Semantics

### 5.1 Synchronous Mode

```
Sequence:
  1. Validate input Lines (conductivity check)
  2. Assemble prompt (template + variables + context injection)
  3. Select model (primary → fallback chain)
  4. Invoke LLM API (blocking)
  5. Validate response against output contract
  6. Create Response Seed via Instantiation Resonator
  7. Wire output Lines via Line Creation Resonator
  8. Record observation
  9. Return Response Seed reference
```

**Semantics:** The calling Bloom waits for completion. The entire sequence is observable as a single transformation event. ΦL is computed after step 8 — it reflects the full cycle: input quality, invocation success, output compliance.

**Finding:** Step 5 (validate response) is where `outputContract.validationMode` applies. In `strict` mode, a response that doesn't match the JSON schema is rejected — the Resonator creates an Error Seed instead. In `permissive` mode, the response is accepted but the observation records a schema mismatch, and ΦL dims slightly. Strict mode is appropriate for Resonators whose output feeds structured processing (e.g., the Thompson Selection Transformation). Permissive mode is appropriate for Resonators whose output feeds human review (e.g., the Human Gate Transformation's preparation step).

### 5.2 Streaming Mode

```
Sequence:
  1. Validate input Lines (conductivity check)
  2. Assemble prompt (template + variables + context injection)
  3. Select model (primary → fallback chain)
  4. Invoke LLM API (streaming)
  5. For each chunk:
     a. Append to accumulator
     b. Emit chunk event on output Line (for real-time consumers)
     c. If chunk triggers early termination criteria → stop stream
  6. Validate complete response against output contract
  7. Create Response Seed via Instantiation Resonator (with complete response)
  8. Wire output Lines via Line Creation Resonator
  9. Record observation (including streaming telemetry: chunks, pauses, total time)
  10. Return Response Seed reference
```

**Finding:** Streaming introduces a temporal dimension that synchronous mode doesn't have. The Resonator is in an intermediate state between steps 4 and 6 — it has begun producing output but hasn't completed. During this window:

- The Resonator's status should be `'transforming'` (a sub-state of `active`)
- Partial output is NOT a morpheme — it doesn't exist in the graph until step 7
- Chunk events on the output Line are ephemeral signals, not persisted Seeds
- If the stream fails mid-way, the Resonator creates an Error Seed with the partial content and the failure point

**Recommendation:** Add `'transforming'` to the valid status values for LLM Invocation Resonators. This is not a general Resonator status — it is specific to transformation types that have a temporal execution phase. The Mutation Resonator should accept `status: 'transforming'` only for Resonators whose definition supports it (i.e., those INSTANTIATES-linked to `def:transformation:llm-invocation`).

### 5.3 Early Termination Criteria

```
earlyTermination: {
  enabled: boolean,
  criteria: [
    {
      type: 'token_budget_exceeded',
      threshold: number,      // Stop if accumulated tokens exceed this
    },
    {
      type: 'content_filter_triggered',
      action: 'stop' | 'retry_with_modified_prompt',
    },
    {
      type: 'quality_signal',
      detector: string,       // Reference to a quality detection function
      threshold: number,      // Stop if quality drops below
    }
  ]
}
```

**Finding:** Early termination is a cost and quality control mechanism. Without it, a streaming invocation that has gone off-track will consume tokens producing unusable output. The `quality_signal` criterion is particularly interesting — it allows the Resonator to monitor its own output in real-time and stop if the output is diverging from the expected pattern. This is a form of self-observation: the Resonator watching its own transformation.

---

## 6. Observation and ΦL

### 6.1 Observation Grid Structure

Every LLM Invocation Resonator instance has an associated observation Grid (contained by the same Bloom, connected via OBSERVES Line). This Grid accumulates invocation event Seeds:

| Observation Seed Property | Description |
|---|---|
| `invocationTimestamp` | When the invocation began |
| `completionTimestamp` | When the invocation completed (or failed) |
| `model` | Which model was used (including fallback) |
| `promptTokens` | Input token count |
| `completionTokens` | Output token count |
| `latencyMs` | Total invocation time |
| `finishReason` | How the invocation ended |
| `outputCompliance` | Did the output match the contract? |
| `conductivitySnapshot` | Input Line conductivities at invocation time |
| `fallbacksUsed` | How many fallback models were tried |
| `retryCount` | How many retries were needed |

### 6.2 ΦL Derivation

The LLM Invocation Resonator's ΦL derives from its observation Grid:

- **Success rate:** Proportion of invocations that produce compliant output. Weight: 0.4
- **Efficiency:** Token usage relative to budget (consistently using 95%+ budget suggests budget is too low). Weight: 0.2
- **Latency fitness:** Invocation time relative to timeout. Weight: 0.1
- **Fallback frequency:** How often primary model is unavailable (infrastructure health signal). Weight: 0.1
- **Downstream fitness:** ΦL of morphemes created from this Resonator's output (do the Response Seeds pass Assayer evaluation?). Weight: 0.2

**Finding:** The 0.2 weight on downstream fitness is the crucial feedback loop. An LLM Invocation Resonator that produces structurally valid but contextually useless output will have high success rate but low downstream fitness. Its ΦL dims. Scale 2 learning detects the pattern. The containing Bloom's ΦL dims proportionally (parent-from-children derivation). This is how the graph learns that a particular LLM configuration is underperforming without any external monitoring system.

---

## 7. Risks and Gaps

### 7.1 λ₂=0 — No Structural Coupling Yet

The pre-survey shows λ₂=0, meaning this transformation definition has no structural coupling to the other four transformation definitions. This is expected at Cycle 1 — the definitions are being created independently. However:

**Risk:** The five transformations must compose within a Cognitive Bloom. The LLM Invocation Transformation's output contract must be compatible with the Compliance Evaluation Transformation's input contract, and the Thompson Selection Transformation's input contract. If these contracts are defined independently, mismatches will surface at integration time.

**Recommendation:** Define the output contract's `format: 'structured'` schema now, provisionally, and flag it for validation when the Compliance Evaluation (t3) and Thompson Selection (t2) definitions are complete. The Line Creation Resonator will enforce endpoint compatibility when the Lines between these Resonators are wired, but earlier detection is cheaper.

### 7.2 External Dependency

LLM services are external to the graph. They can fail, degrade, change behavior, or be deprecated. The Resonator framework handles this through fallback chains and observation, but:

**Risk:** A model behavior change (e.g., a provider updates the model weights) is invisible to the Resonator. The invocation succeeds, the output matches the schema, but the quality has shifted. ΦL's downstream fitness weight (0.2) may detect this slowly.

**Recommendation:** Add a `modelVersion` field to observation Seeds. When the observed model version changes, trigger an explicit re-evaluation cycle — the Resonator's status temporarily shifts to `'degraded'` until downstream fitness confirms the new version performs adequately. This is the immune system detecting an environmental change.

### 7.3 Cost Observability

Token usage has financial cost. The current observation schema captures token counts but not cost.

**Recommendation:** Add `estimatedCost` to observation Seeds. This is derived from `model + tokenUsage` using a cost table Seed in the Constitutional Bloom. Cost patterns feed Scale 2 learning: "This Bloom's LLM invocations cost 3x more than similar Blooms → investigate prompt efficiency."

### 7.4 Prompt Injection Surface

The context injection mechanism assembles content from multiple graph sources into a prompt sent to an external service. If any source Seed contains adversarial content, it could manipulate the LLM's behavior.

**Finding:** This is partially mitigated by Line conductivity — a Seed with anomalous content should have lower contextual fitness (Layer 3), reducing its injection priority. But conductivity measures structural fitness, not adversarial intent.

**Recommendation:** The `systemInstruction` field (§3.2) should include constitutional framing that anchors the LLM's behavior regardless of injected context. This is not a complete defense but raises the bar. Flag this for the Compliance Evaluation Transformation definition (t3) — compliance evaluation should include prompt integrity checking.

---

## 8. Summary of Findings

| # | Finding | Impact | Action |
|---|---|---|---|
| F1 | LLM invocation must be a Resonator, not a utility function, to be observable | High — invisible side effects break graph learning | Confirmed by existing spec pattern |
| F2 | Prompt templates should be graph-resident Seeds, not embedded strings | Medium — enables template versioning and quality observation | Define template Seed pattern |
| F3 | Context injection can leverage Line conductivity Layer 3 for relevance filtering | High — graph structure directly improves prompt quality | Design selective injection strategy |
| F4 | Streaming mode requires `'transforming'` status sub-state | Medium — temporal execution phase needs representation | Extend status vocabulary for this type |
| F5 | Downstream fitness (0.2 weight) is the critical feedback loop for quality | High — prevents "valid but useless" output from persisting | Ensure Assayer evaluation feeds back to Resonator ΦL |
| F6 | Output contracts must be provisionally defined now, validated at integration | Medium — λ₂=0 means no coupling yet | Flag for cross-task validation after t2, t3 |
| F7 | Model version changes are invisible quality risks | Medium — silent degradation | Add modelVersion tracking with degradation trigger |
| F8 | Context injection creates a prompt injection surface | Low-Medium — partially mitigated by conductivity | Constitutional framing + flag for t3 compliance evaluation |

---

## 9. Verification

The verification command `grep -q 'LLM.*Invocation.*Transformation' docs/specs/instantiation-mutation-resonator-design.md` will match once the following section header is appended to the design spec:

> **LLM Invocation Transformation Definition** — see Cognitive Bloom Cycle 1, Task t1 analysis.

This analysis document provides the specification content. The integration into the design spec is a subsequent Mutation Resonator operation, not a raw edit.