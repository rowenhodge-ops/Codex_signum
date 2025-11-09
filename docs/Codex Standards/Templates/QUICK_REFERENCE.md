# Quick Template Reference Guide

## 📋 Template Decision Tree

```
Did you interact with someone?
├─ Yes → TPL - Engagement Note
│
Did you meet someone new?
├─ Yes → TPL - Stakeholder Profile
│
Are you researching an organization?
├─ Yes → TPL - Target Profile
│
Did you discover a reusable insight?
├─ Yes → TPL - Market Insight
│
Did you learn something that improves future engagements?
├─ Yes → TPL - Learning Registry
│
Are you investigating a question?
├─ Yes → TPL - Research Note
│
Did you attend an event?
├─ Yes → TPL - Event Debrief
│
Is it end of week?
└─ Yes → TPL - Weekly Review
```

## 🎯 Template Quick Reference

| Template                | When to Use                                | Time to Complete | Key Benefit                                |
| ----------------------- | ------------------------------------------ | ---------------- | ------------------------------------------ |
| **Engagement Note**     | After every call, meeting, email           | 10-15 min        | Captures interaction + performance metrics |
| **Stakeholder Profile** | New person or relationship upgrade         | 15-20 min        | Comprehensive person context               |
| **Target Profile**      | Researching potential client org           | 30-45 min        | T1/T2/T3 analysis + killer question        |
| **Market Insight**      | Pattern identified across multiple sources | 20-30 min        | Reusable intelligence asset                |
| **Learning Registry**   | Principle discovered from engagement       | 5-10 min         | Improves future LLM drafts                 |
| **Research Note**       | Investigating specific question            | Variable         | Structured exploration                     |
| **Event Debrief**       | After conferences/networking               | 20-30 min        | Event ROI + multi-contact capture          |
| **Weekly Review**       | Friday/Monday weekly                       | 30-45 min        | System performance tracking                |

## 📊 Metadata Field Cheat Sheet

### Common Fields (All Templates)

```yaml
---
# Identity
[type]-id: XXX-YYYYMMDD-###
date: YYYY-MM-DD
status: # draft, active, complete, archived

# Relationships
stakeholder-id: "[[Person Name]]"
related-target: "[[Target Profile - Org]]"
related-sop: "[[SOP Name]]"

# Intelligence
key-language:
  - "exact phrases"
messy-problems:
  - "pain points"
learning-id:
  - "L-XXX"
action-items:
  - "next steps"

# Tags
tags:
  - category
---
```

### Template-Specific Required Fields

**Engagement Note:**

- `engagement-type` (call/meeting/email/linkedin-dm)
- `cta-success` (Accepted/Deferred/Rejected)
- `sentiment-score` (-1 to +1)
- `edit-distance-score` (1-5)

**Stakeholder Profile:**

- `stakeholder-type` (C1/C2/C3/C4)
- `relationship-strength` (cold/warm/hot)
- `potential-value` (low/medium/high/strategic)
- `company` (organization name)
- `vertical` (HEI/Logistics/Government/etc.)

**Target Profile:**

- `segment` (HEI/Logistics/Government/etc.)
- `status` (research/qualified/engaged/client)
- `economic-buyer` (link to C4 if identified)
- `killer-question` (strategic pitch)

**Market Insight:**

- `category` (governance/technology/case-study/methodology)
- `relevance` (high/medium/low)
- `applies-to` (list of verticals)
- `source-url`

**Learning Registry:**

- `context` (situation description)
- `stakeholder-type` (C1/C2/C3/C4)
- `validation-status` (untested/validated/superseded)
- `application-count` (number)

## 🔗 Template Relationships

### The Learning Loop

```
Engagement Note
    ↓
Captures → Learning Registry
    ↓
Applied to → Next Engagement Note
    ↓
Tracked in → Weekly Review
```

### The Intelligence Flow

```
Research Note
    ↓
Synthesized into → Market Insight
    ↓
Applied to → Target Profile
    ↓
Used in → Engagement Note (with Stakeholder)
    ↓
Refined via → Learning Registry
```

### The Relationship Hierarchy

```
Target Profile (Organization)
    ├── Economic Buyer (C4)
    ├── Stakeholder Profiles (People)
    │   ├── C1 Navigator
    │   ├── C2 Collaborator
    │   └── C3 Market Intel
    └── Engagement Notes (Interactions)
        └── Learning Registry (Insights)
```

## ⚡ Templater Shortcuts

If using Templater plugin, trigger with:

- `<% tp.file.cursor() %>` - Cursor position after template
- `<% tp.date.now("YYYY-MM-DD") %>` - Today's date
- `<% tp.file.title %>` - Current file name

## 🎨 Visual Template Tags

Use in titles for quick identification:

- `📞` Call/Meeting (Engagement Note)
- `👤` Person (Stakeholder Profile)
- `🏢` Organization (Target Profile)
- `💡` Insight (Market Insight)
- `📚` Learning (Learning Registry)
- `🔬` Research (Research Note)
- `🎪` Event (Event Debrief)
- `📊` Review (Weekly Review)

## 🚀 Workflow Integration

### Daily Routine

1. Before engagement → Review Stakeholder Profile + Target Profile
2. During engagement → Take raw notes
3. After engagement → Fill Engagement Note template (10 min)
4. Extract learnings → Create Learning Registry entry if applicable
5. Update Stakeholder Profile → Add engagement to history

### Weekly Routine

1. Friday afternoon or Monday morning
2. Fill Weekly Review template
3. Review all engagement notes from week
4. Calculate performance metrics
5. Identify patterns
6. Set objectives for next week

### Monthly Routine

1. Review Target Profiles → Update status
2. Audit Market Insights → Are they still valid?
3. Review Learning Registry → Which learnings are most applied?
4. System health check → Template adoption rate, metadata completeness

## 💡 Pro Tips

### For Effective RAG Retrieval

1. **Use exact quotes** in key-language fields (helps LLM match future contexts)
2. **Link everything** - Every person, organization, SOP mentioned
3. **Be specific in messy-problems** - Quantify when possible
4. **Update relationship-strength** regularly - Helps prioritize outreach

### For Knowledge Graph Building

1. **Cross-reference liberally** - Link related documents
2. **Use consistent naming** - "C1 - FirstName LastName" pattern
3. **Tag strategically** - Use tags for themes that span documents
4. **Close the loop** - Reference outcomes in original documents

### For LLM Draft Improvement

1. **Always score edit-distance** - This is your training signal
2. **Document what you changed** - Pattern becomes learning
3. **Link to learning-id** - Connect outcome to principle
4. **Track application-count** - Most-used learnings are most valuable

## 📝 Example File Naming

```
Stakeholder Profiles:
  C1 - Herman Tse.md
  C2 - Anthony Autore.md
  C3 - Jane Smith.md
  C4 - John Doe.md

Engagement Notes:
  ENG-20251109 - Herman Tse - Follow-up Call.md
  ENG-20251110 - Anthony Autore - Business Show.md

Target Profiles:
  TGT - University of Wollongong.md
  TGT - Logistics Corp Australia.md

Market Insights:
  INS-20251109-001 - AI Data Classification Framework.md
  INS-20251110-002 - HEI Technology Implementation Patterns.md

Learning Registry:
  L-001 - C1 Direct Opening.md
  L-002 - C1 Simple CTA.md

Research Notes:
  RES-20251109-001 - LLM Router Evaluation.md

Weekly Reviews:
  WKR-2025-W45 - Weekly Review.md
```

## 🎯 Success Indicators

You know the template system is working when:

✅ You can answer "What worked with C2s last month?" in 60 seconds
✅ LLM drafts require less editing over time (edit-distance trending down)
✅ You can trace any insight back to source conversation
✅ New team members can understand your strategy by reading templates
✅ Dashboard queries return meaningful patterns, not noise

---

**Need Help?**

- See [[TEMPLATE_SYSTEM_UPDATE]] for detailed explanation
- See [[SOP - Meta-Data Management]] for Codex Commit workflow
- See [[Obsidian Tagging]] for three-tier tagging protocol
