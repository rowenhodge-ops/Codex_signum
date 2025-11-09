---
# FILE NAMING CONVENTION: [Topic/Question] - Research Note.md
# Example: LLM Router Evaluation - Research Note.md
# Example: HEI Procurement Processes - Research Note.md

research-id: RES-<% tp.date.now("YYYYMMDD") %>-XXX # Unique identifier. Format: RES-YYYYMMDD-[###]
topic: # What are you researching?
date-started: <% tp.date.now("YYYY-MM-DD") %>
date-completed: # Update when research is concluded
status: in-progress # Options: in-progress (active research), complete (concluded), archived (no longer relevant), parked (paused for later)
priority: medium # Options: low (nice to know), medium (valuable context), high (urgent need), urgent (blocking decision)
category: # What type of research? Options: technology, market, methodology, competitor, regulation, vendor-evaluation
research-type: # Approach type. Options: exploratory (open-ended), validation (testing hypothesis), deep-dive (comprehensive analysis), comparative (A vs B evaluation)
related-projects: # If research supports specific project/product
  -  # Example: "[[Initium - Product Definition]]"
related-target-profiles: # If research informs specific target organizations
  -  # Example: "[[University of Wollongong - Target Profile]]"
related-sops: # If research will inform SOP updates
  -  # Example: "[[SOP - Initium Delivery]]"
tags:
  - research
---

# Research Note: {{topic}}

<!-- CELL: research-question | type: summary | rag-priority: high -->

## Research Question

**Primary Question:**
[What are we trying to learn/validate/understand?]

**Why this matters:**
[Strategic importance or business need]

**Success Criteria:**
[How will we know when this research is complete?]

<!-- END CELL -->

---

<!-- CELL: context | type: context | rag-priority: medium -->

## Context & Motivation

### Background

[What led to this research question?]

### Current Understanding

[What do we already know?]

### Knowledge Gap

[What specifically are we trying to fill in?]

### Implications

[How will this research inform decisions or strategy?]

---

<!-- END CELL -->

<!-- CELL: research-plan | type: action-items | rag-priority: low -->

## Research Plan

### Approach

[How will we gather this information?]

- [ ] Literature review
- [ ] Industry reports
- [ ] Expert interviews
- [ ] Case studies
- [ ] Competitive analysis
- [ ] Technical testing
- [ ] Other:

### Sources to Consult

1.
2.
3.

### Timeline

- **Start date:** <% tp.date.now("YYYY-MM-DD") %>
- **Target completion:**
- **Actual completion:**

---

<!-- END CELL -->

<!-- CELL: findings | type: training-data | rag-priority: high -->

## Findings

### Key Discoveries

1. **Finding:**

   - **Source:**
   - **Confidence:** High / Medium / Low
   - **Implications:**

2. **Finding:**
   - **Source:**
   - **Confidence:** High / Medium / Low
   - **Implications:**

### Supporting Evidence

#### Source 1: [Name/Title]

- **Type:** [Report, Article, Interview, etc.]
- **Date:**
- **Key quotes/data:**
  >

#### Source 2: [Name/Title]

- **Type:**
- **Date:**
- **Key quotes/data:**
  >

### Conflicting Information

[Any contradictions found? How did we resolve them?]

---

<!-- END CELL -->

<!-- CELL: analysis | type: analysis | rag-priority: high -->

## Analysis & Synthesis

### Pattern Recognition

[What patterns emerge across sources?]

### Surprising Insights

[What was unexpected or counter-intuitive?]

### Connections to Other Research

- [[Research Note - Topic]] - [How they relate]
- [[Market Insight - Title]] - [How this validates or challenges the insight]

---

<!-- END CELL -->

<!-- CELL: conclusions | type: summary | rag-priority: high -->

## Conclusions

### Answer to Research Question

[Clear, concise answer to the primary research question]

### Confidence Level

**Overall confidence:** High / Medium / Low

**Rationale:**
[Why this confidence level?]

### Caveats & Limitations

[What are the bounds of this conclusion?]

---

<!-- END CELL -->

<!-- CELL: recommendations | type: action-items | rag-priority: medium -->

## Actionable Recommendations

### Strategic Implications

1.
2.
3.

### Tactical Applications

**For Initium Diagnostic:**

- **For Stakeholder Engagements:**

- **For Target Profiling:**

-

### Further Research Needed

- [ ] [Follow-up question]
- [ ] [Follow-up question]

---

<!-- END CELL -->

## Documentation & Artifacts

### Files & Documents

- [Link to source documents]
- [Link to analysis spreadsheets]
- [Link to interview transcripts]

### Should Become

[Does this research warrant promotion to a Market Insight or other formal document?]

- [ ] Create [[Market Insight - Title]]
- [ ] Update [[Target Profile - Organization]]
- [ ] Add to [[SOP - Name]]
- [ ] Share with [[Stakeholder Name]]

---

## Research Log

### <% tp.date.now("YYYY-MM-DD") %> - Research Started

- Initial question defined
- Sources identified

### [Date] - [Milestone]

- [What happened]
