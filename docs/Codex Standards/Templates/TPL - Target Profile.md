---
# FILE NAMING CONVENTION: [Organization Name] - Target Profile.md
# Example: University of Wollongong - Target Profile.md
# Example: Acme Corporation - Target Profile.md

target-id: # Unique identifier. Format: TGT-[ORG]-[###]. Example: TGT-UOW-001
organization: # Full legal organization name
segment: # Industry/sector. Examples: HEI (Higher Education), Logistics, Government, B2B Services, Healthcare, Finance
gtm-plan: "[[GTM Strategy V1.0]]"
date-created: <% tp.date.now("YYYY-MM-DD") %>
last-updated: <% tp.date.now("YYYY-MM-DD") %> # Update this on every major revision
status: research # Options: research (investigating), qualified (validated fit), engaged (active conversation), client (signed contract)
economic-buyer: # Link to the decision-maker. Example: "[[Jane Smith - CFO]]"
priority: medium # Options: low (opportunistic), medium (solid prospect), high (hot lead), strategic (game-changing opportunity)
estimated-value: # Expected contract value. Examples: $50k, $100-200k, $500k+
decision-timeline: # Expected timeframe. Examples: Q1 2026, 6-12 months, Unknown
messy-problems: # Key pain points you've identified (their language)
  -  # Example: "Manual compliance reporting takes 40 hours/month"
killer-question:
  | # The strategic pitch angle - one question that qualifies or disqualifies
  # Example: "Are you actively budgeting for AI automation in Q1 2026, or just exploring?"
related-contacts: # Stakeholders at this organization
  -  # Example: "[[Bob Johnson - CTO]]" (C4 - Economic Buyer)
  -  # Example: "[[Jane Smith - Project Lead]]" (C3 - Market Intel)
tasks:
  - description: "" # Next action for this target
    status: not-started # Options: not-started, in-progress, completed, blocked
    priority: medium # Options: low, medium, high, urgent
    due-date: YYYY-MM-DD # When to complete this task
tags:
  - target-profile
related-sop: "[[SOP - Market Intelligence (V1.0)]]"
---

# Target Profile: {{organization}}

<!-- CELL: executive-summary | type: summary | rag-priority: high -->

## Executive Summary

**What they do:**

**Why they matter:**

**Our angle:**

<!-- END CELL -->

---

<!-- CELL: t1-strategic | type: context | rag-priority: high -->

## T1: Strategic Language

### Priorities

**What leadership says they care about:**

-
-
- **Evidence (Annual reports, press releases, LinkedIn posts):**

-

### Financials

**Budget situation:**

- **Financial pressure points:**

- **Investment appetite:**

-

### C-Suite Language

**Exact phrases they use:**

>

**Strategic initiatives mentioned:**

-
- ***

  <!-- END CELL -->

<!-- CELL: t2-technical | type: context | rag-priority: high -->

## T2: Technical Reality

### Known Stack

**Confirmed systems:**

-
-
- **Sources:** [Where did we learn this? Contact mentions, case studies, vendor sites]

### Vendor Gaps

**Recent implementations:**

- **Known challenges:**

- **Integration points:**

-

### Integration Chaos

**Systems that don't talk:**

- **Manual workarounds:**

- **Data silos:**

- ***

  <!-- END CELL -->

<!-- CELL: t3-operational | type: training-data | rag-priority: high -->

## T3: Operational Symptoms

### Tactical Problems

**Day-to-day pain points:**

1. **Problem:**
   - **Source:** [Which contact mentioned this, or where did we learn it]
   - **Impact:**

### Staff Complaints

**What people on the ground say:**

>

**Common frustrations:**

-
-

### Quantifiable Impacts

**Measurable costs of current state:**

- **Time waste:**
- **Error rate:**
- **Manual effort:**
- **Compliance risk:**

---

<!-- END CELL -->

<!-- CELL: synthesis | type: analysis | rag-priority: high -->

## Synthesis: The Messy Problem

### The Pattern

[Connect T1 strategic language → T2 technical reality → T3 operational symptoms into one coherent problem statement]

**Strategic Level (T1):** Leadership says they want [X]...

**Technical Level (T2):** But their tech stack is [Y]...

**Operational Level (T3):** Which means staff are experiencing [Z]...

**The Gap:** [The disconnect between what leadership wants and what's actually possible with current systems]

### Validation Status

- [ ] T1 confirmed (Annual report, public statements)
- [ ] T2 confirmed (Contact validation, case studies)
- [ ] T3 confirmed (Direct staff feedback)

---

<!-- END CELL -->

<!-- CELL: killer-question | type: inference-prompt | rag-priority: high -->

## The Killer Question

### Our Pitch Angle

[The strategic question or provocation that positions Initium as the solution]

**The Question:**

>

**Why it works:**

- Speaks to T1 (leadership priorities)
- Acknowledges T2 (technical complexity)
- Solves T3 (operational pain)

### Proof Points

**Evidence we can reference:**

-
- ***

  <!-- END CELL -->

<!-- CELL: contact-strategy | type: action-items | rag-priority: medium -->

## Contact Strategy

### Economic Buyer Profile

**Who can say yes:**

- **Title:**
- **Name (if known):** [[Stakeholder Name]]
- **Budget authority:**
- **Pain points:**

### Pathway to Economic Buyer

**Our warm path:**

1. [[C1 - Navigator]] →
2. [[C2 - Collaborator]] →
3. [[C3 - Market Intel]] →
4. C4 Economic Buyer

**Status:** [Which stage are we at?]

---

<!-- END CELL -->

<!-- CELL: intelligence-sources | type: relationships | rag-priority: low -->

## Intelligence Sources

### Primary Sources

- [[Engagement Note - Contact Name - Date]]
- [[Engagement Note - Contact Name - Date]]

### Secondary Sources

- Annual Report: [Link]
- Case Studies: [Link]
- News Articles: [Link]
- LinkedIn Intelligence: [What we've observed]

### Confidence Level

- **T1 (Strategic):** High / Medium / Low
- **T2 (Technical):** High / Medium / Low
- **T3 (Operational):** High / Medium / Low

---

<!-- END CELL -->

## Next Actions

### Research Needed

- [ ] [Specific research task]
- [ ] [Specific research task]

### Contacts to Engage

- [ ] [[Stakeholder Name]] - [Purpose of engagement]
- [ ] [[Stakeholder Name]] - [Purpose of engagement]

### Intelligence Gaps

**What we still need to learn:**

-
- **How we'll learn it:**

- ***

## Change Log

### <% tp.date.now("YYYY-MM-DD") %> - Profile Created

- Initial T1/T2/T3 analysis based on [[Source]]
- Killer question drafted
- Contact strategy mapped
