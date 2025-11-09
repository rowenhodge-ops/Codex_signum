---
aliases: []
stakeholder-id: "[[Stakeholder Name]]"
stakeholder-type: # C1, C2, C3, C4
engagement-date: <% tp.date.now("YYYY-MM-DD") %>
engagement-time: <% tp.date.now("HH:mm") %>
engagement-type: call # call, meeting, email, linkedin-dm
status: completed # pending, completed, requires-follow-up
response-time-hours: # Time from outreach to response (for performance tracking)
cta-success: # Accepted, Deferred, Rejected
sentiment-score: # -1 (Negative) to +1 (Highly Positive)
edit-distance-score: # 1-5 (1=Sent as-is, 5=Total rewrite)
learning-id:
  -
key-language:
  -
messy-problems:
  -
new-contacts:
  -
action-items:
  -
tasks:
  - description: ""
    status: not-started # not-started, in-progress, completed, blocked
    priority: medium # low, medium, high, urgent
    due-date: YYYY-MM-DD
related-target: # "[[Target Profile]]" if applicable
related-sop: "[[SOP - Strategic Network & Stakeholder Engagement (v2.2)]]"
tags:
  - engagement
---

<!-- CELL: executive-summary | type: summary | rag-priority: high -->

### 1. Executive Summary & Goal

- **Goal for this engagement:**
- **Key finding:**
- **CTA Outcome:** [What was requested and what was the response]
<!-- END CELL -->

<!-- CELL: pre-engagement-context | type: context | rag-priority: medium -->

### 2. Pre-Engagement Context

- **Relationship history:** [How did this connection come about?]
- **Expected value:** [What did we hope to learn/gain?]
- **Preparation notes:** [Any research or context gathered beforehand]
<!-- END CELL -->

<!-- CELL: transcript | type: raw-data | rag-priority: low -->

### 3. Key Notes & Transcript

#### Opening

-

#### Main Discussion

-

#### Key Insights

-

#### Closing & Next Steps

- <!-- END CELL -->

<!-- CELL: data-extraction | type: training-data | rag-priority: high -->

### 4. Data Extraction (For Codex Commit)

#### Key Language Captured

> [Exact phrases and terminology they used - copy verbatim]

-
-

#### Messy Problems Identified

1. **Problem:**
   - **Impact:**
   - **Their words:** ""

#### New Contacts Mentioned

- **[[Contact Name]]** - [Title, Organization, Potential value]

#### Strategic Insights

- <!-- END CELL -->

<!-- CELL: outcome-response | type: validation-metrics | rag-priority: high -->

### 5. Outcome & Response

#### Immediate Response

- **Date sent:**
- **Response received:** [Yes/No, Date/Time if yes]
- **Response time:** [Hours from sending to reply]
- **Sentiment:** [Positive/Neutral/Negative with specific indicators]

#### CTA Analysis

- **What was asked:**
- **Their response:**
- **Result:** [Accepted/Deferred/Rejected]
- **Next action scheduled:** [Yes/No, Date if yes]
<!-- END CELL -->

<!-- CELL: analysis-learning | type: analysis | rag-priority: high -->

### 6. Analysis & Learning

#### What Worked

-
-

#### What Didn't Work

-
-

#### Learnings to Codify

- **[[L-XXX]]** - [Principle learned that should be added to Learning Registry]

#### LLM Draft Quality

- **Edit distance score:** [1-5]
- **Major edits required:** [List specific changes made to AI-generated draft]
- **Patterns for improvement:** [What should the AI learn from these edits?]
<!-- END CELL -->

<!-- CELL: next-steps | type: action-items | rag-priority: medium -->

### 7. Next Steps

- **Immediate action:** [[<% tp.file.cursor() %>]]
- **Follow-up required by:** [Date]
- **Update to Target Profile:** [Yes/No - What needs updating?]
- **Codex commit status:** [ ] Complete
<!-- END CELL -->
