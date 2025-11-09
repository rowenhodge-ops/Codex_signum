---
# FILE NAMING CONVENTION: [Topic/Pattern] - Market Insight.md
# Example: HEI AI Governance Patterns - Market Insight.md
# Example: C3 Engagement Strategy - Market Insight.md

insight-id: INS-<% tp.date.now("YYYYMMDD") %>-XXX # Unique identifier. Format: INS-YYYYMMDD-[###]
title: # Descriptive title of this insight/pattern
category: # Options: governance, technology, case-study, methodology, market-trend, stakeholder-pattern
relevance: high # Options: high (immediately actionable), medium (valuable context), low (reference only)
source: # Where did this come from? Options: research, client-engagement, industry-report, academic-paper, conversation
source-url: # URL if from external source
date-captured: <% tp.date.now("YYYY-MM-DD") %>
last-updated: <% tp.date.now("YYYY-MM-DD") %> # Update when insight is refined/validated
applies-to: # Which industries/sectors does this apply to?
  -  # Examples: HEI (Higher Education), Government, Logistics, B2B Services, Healthcare
related-sops: # Which SOPs leverage this insight?
  -  # Example: "[[SOP - Initium Delivery]]"
related-target-profiles: # Which Target Profiles does this inform?
  -  # Example: "[[University of Wollongong - Target Profile]]"
key-concepts: # Tags for semantic search
  -  # Examples: ai-governance, stakeholder-engagement, procurement-process
status: active # Options: active (current), validated (confirmed across multiple engagements), superseded (replaced by newer insight), archived (no longer relevant)
tags:
  - insight
  - market-intelligence
---

# Market Insight: {{title}}

<!-- CELL: executive-summary | type: summary | rag-priority: high -->

## Executive Summary

**The Key Takeaway:**
[2-3 sentence distillation of the most important point]

**Why it matters to Codex Signum:**
[How this insight affects our strategy, positioning, or delivery]

**Confidence Level:** High / Medium / Low

<!-- END CELL -->

---

<!-- CELL: insight | type: training-data | rag-priority: high -->

## The Insight

### Context

[What's the situation or problem this insight addresses?]

### The Finding

[The core insight, discovery, or pattern we've identified]

### Evidence

**Primary sources:**

-
- **Supporting data:**

-
- **Validation:**
  [How do we know this is true? Client feedback? Industry reports? Case studies?]

  ***

  <!-- END CELL -->

<!-- CELL: deep-dive | type: analysis | rag-priority: medium -->

## Deep Dive Analysis

### The Pattern

[Detailed explanation of the insight, including:]

- What we observed
- Why it's happening
- What it means for the market
- Implications for target organizations

### Mechanisms

[How does this work? What are the underlying causes?]

### Exceptions

[When does this NOT apply? What are the edge cases?]

---

<!-- END CELL -->

<!-- CELL: application-codex | type: inference-prompt | rag-priority: high -->

## Application to Codex Signum

### Use in Initium Diagnostic

**How this shapes our diagnostic approach:**

-
- **Specific questions to ask:**

1.
2.

**Red flags to look for:**

-
-

### Use in Proposals

**Value proposition framing:**

>

**Proof points:**

-
- **Risk mitigation:**
  [How we address this in our methodology]

### Use in Proposals

**Value proposition framing:**

>

**Proof points:**

-
- **Risk mitigation:**
  [How we address this in our methodology]
  <!-- END CELL -->

<!-- CELL: stakeholder-talking-points | type: inference-prompt | rag-priority: high -->

### Talking Points for Stakeholder Engagements

#### C1 Navigator

**Strategic framing:**

>

**Questions to provoke thought:**

-

#### C2 Collaborator

**Partnership angle:**

>

**Common ground:**

-

#### C3 Market Intel

**Validation questions:**

-
- **What to listen for:**

-

#### C4 Economic Buyer

**Business case connection:**

>

**ROI linkage:**

- ***

  <!-- END CELL -->

<!-- CELL: examples | type: context | rag-priority: medium -->

## Real-World Examples

### Example 1: [Organization/Situation]

**Context:**

**Application of insight:**

**Outcome:**

**Source:** [[Engagement Note]] or [External source]

### Example 2: [Organization/Situation]

**Context:**

**Application of insight:**

**Outcome:**

**Source:**

---

<!-- END CELL -->

<!-- CELL: strategic-implications | type: analysis | rag-priority: high -->

## Strategic Implications

### Market Positioning

[How this insight affects how we position Codex Signum in the market]

### Competitive Advantage

[How this insight differentiates us from competitors]

### Risk Factors

[Potential challenges or limitations of this insight]

---

<!-- END CELL -->

<!-- CELL: related-insights | type: relationships | rag-priority: low -->

## Related Insights

### Complementary Insights

- [[INS-XXX]] - [How it relates]
- [[INS-XXX]] - [How it relates]

### Conflicting Insights

- [[INS-XXX]] - [How they differ and which to prioritize]

### Build-Up Sequence

[If presenting multiple insights, what order makes most sense?]

1. [[INS-XXX]] - [Foundation]
2. [[INS-XXX]] - [Build on foundation]
3. **THIS INSIGHT** - [Synthesis]
<!-- END CELL -->

---

## Validation & Testing

### Hypotheses to Test

1. [What we think is true based on this insight]
2. [What we need to validate]

### Validation Method

[How we'll confirm this insight applies to specific situations]

### Success Metrics

[How we'll know if applying this insight is working]

---

## Revision History

### <% tp.date.now("YYYY-MM-DD") %> - Insight Captured

- Source:
- Initial application:
- Confidence:
