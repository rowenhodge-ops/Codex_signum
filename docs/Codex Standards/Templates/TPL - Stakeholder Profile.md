---
# FILE NAMING CONVENTION: [Full Name] - [Company].md
# Example: Jane Smith - University of Wollongong.md
# Example: Bob Johnson - Acme Corp.md

aliases: []
stakeholder-id: "<% tp.file.title %>"
stakeholder-type: C1 # Options: C1 (Strategic Navigator), C2 (Peer Collaborator), C3 (Market Intel), C4 (Economic Buyer)
status: active # Options: active (current engagement), dormant (inactive >90 days), archived (no longer relevant)
first-contact-date: <% tp.date.now("YYYY-MM-DD") %>
last-contact-date: # Update after every interaction
relationship-strength: cold # Options: cold (initial contact), warm (ongoing dialogue), hot (active opportunity/partnership)
potential-value: medium # Options: low (referral source), medium (valuable intel), high (potential client), strategic (game-changer)
company: # Their organization name
title: # Their job title/role
vertical: # Industry/sector. Examples: HEI (Higher Ed), Logistics, Government, B2B Services, Healthcare, Finance
linkedin: # LinkedIn profile URL
email: # Primary email address
phone: # Phone number with country code
location: # City, Country (for timezone/meeting planning)
related-target: # Link to Target Profile if they work at a prospect organization
  # Example: "[[University of Wollongong - Target Profile]]"
related-stakeholders: # Other contacts in their network
  -  # Example: "[[John Doe - CTO]]" (their colleague/connection)
tasks:
  - description: "" # Next action with this stakeholder
    status: not-started # Options: not-started, in-progress, completed, blocked
    priority: medium # Options: low, medium, high, urgent
    due-date: YYYY-MM-DD # When to complete this task
tags:
  - stakeholder
---

<!-- CELL: executive-summary | type: summary | rag-priority: high -->

### Summary

- **Who they are:** [Role, background, areas of expertise]
- **What they want:** [Their goals, pain points, objectives]
- **How we help:** [Our value proposition to them specifically]
- **Relationship origin:** [How did we connect? Who introduced us?]
<!-- END CELL -->

<!-- CELL: strategic-value | type: analysis | rag-priority: high -->

### Strategic Value

#### For Us

- **Intelligence value:** [What market insights can they provide?]
- **Network value:** [Who can they introduce us to?]
- **Commercial value:** [Are they a potential buyer or pathway to buyer?]

#### For Them

- **Our value to them:** [What specific value do we bring?]
- **Their success metrics:** [What does success look like for them?]
<!-- END CELL -->

<!-- CELL: context-background | type: context | rag-priority: medium -->

### Context & Background

#### Professional

- **Current role & responsibilities:**
- **Career trajectory:**
- **Areas of expertise:**
- **Key projects/initiatives:**

#### Personal (Relevant)

- **Communication preferences:** [Email, LinkedIn, phone, etc.]
- **Response patterns:** [Quick responder? Prefers meetings? Detail-oriented?]
- **Interests/motivations:** [What drives them professionally?]
<!-- END CELL -->

<!-- CELL: key-language | type: training-data | rag-priority: high -->

### Key Language & Terminology

> Exact phrases and terminology they use - critical for resonance

-
-

<!-- END CELL -->

<!-- CELL: messy-problems | type: training-data | rag-priority: high -->

### Messy Problems (Their Context)

1. **Problem:**
   - **Impact on them:**
   - **Their words:** ""
   <!-- END CELL -->

<!-- CELL: network-connections | type: relationships | rag-priority: low -->

### Network & Connections

#### People They've Mentioned

- **[[Contact Name]]** - [Relationship, potential value]

#### Organizations Connected To

- **[[Organization]]** - [Nature of connection]
<!-- END CELL -->

<!-- CELL: engagement-history | type: context | rag-priority: medium -->

### Engagement History

#### Initial Contact

- **Date:**
- **Channel:**
- **Context:**
- **Outcome:**

#### Subsequent Engagements

- **[[Engagement Note - Date]]** - [Brief summary, outcome]
- **[[Engagement Note - Date]]** - [Brief summary, outcome]
<!-- END CELL -->

<!-- CELL: performance-metrics | type: validation-metrics | rag-priority: medium -->

### Performance Metrics

- **Total engagements:** 0
- **Average response time:** N/A
- **CTA acceptance rate:** N/A
- **Last engagement sentiment:** N/A
- **Relationship trajectory:** [Growing, Stable, Declining]
<!-- END CELL -->

<!-- CELL: strategic-notes | type: action-items | rag-priority: medium -->

### Strategic Notes

#### Opportunities

-
-

#### Risks/Considerations

-
-

#### Next Best Actions

1. [ ] [Specific action with timeline]
2. [ ] [Specific action with timeline]
<!-- END CELL -->

### Related Documents

- Target Profile: [[]]
- Engagement Notes:
- Learnings: [[L-XXX]]
- Related SOPs: [[SOP - Strategic Network & Stakeholder Engagement (v2.2)]]
