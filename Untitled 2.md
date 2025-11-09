---
# FILE NAMING CONVENTION: YYYY-MM-DD - [Stakeholder Name] - [Topic].md
# Example: 2025-11-10 - Jane Smith - Demo Call.md
# Example: 2025-11-10 - Bob Johnson - Pricing Discussion.md

aliases: []
stakeholder-id: "[[Stakeholder Name]]" # Link to their Stakeholder Profile
stakeholder-type: C1 # C1 (Strategic Navigator), C2 (Peer Collaborator), C3 (Market Intel), C4 (Economic Buyer)
engagement-date: 2025-11-10
engagement-time: 00:37
engagement-type: call # Options: call, meeting, email, linkedin-dm, video-call, in-person
status: completed # Options: pending, completed, requires-follow-up
response-time-hours: # Time from your outreach to their response (number of hours, for performance tracking)
cta-success: # Your call-to-action result. Options: Accepted, Deferred, Rejected
sentiment-score: # Their engagement level. Scale: -1 (Negative/Resistant) to +1 (Highly Positive/Engaged)
edit-distance-score: # How much you edited your notes. Scale: 1 (Sent as-is, clear capture) to 5 (Total rewrite, poor capture)
learning-id: # Link to Learning Registry entries created from this engagement
  -  # Example: "[[L-042 - Two-sentence openers]]"
key-language: # Their exact words/phrases (copy verbatim for future messaging)
  -  # Example: "We're data-rich but insight-poor"
messy-problems: # Pain points they mentioned (their words, not your interpretation)
  -  # Example: "Manual data entry for compliance reports"
new-contacts: # New people they mentioned
  -  # Example: "[[Jane Doe - Head of Admissions]]"
action-items: # Your commitments from this call
  -  # Example: "Send pricing proposal by Friday EOD"
tasks:
  - description: "" # Specific next step with clear completion criteria
    status: not-started # Options: not-started, in-progress, completed, blocked
    priority: medium # Options: low, medium, high, urgent
    due-date: YYYY-MM-DD # Target completion date
related-target:# Link to organization profile if applicable
  # Example: "[[University of Wollongong - Target Profile]]"
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
