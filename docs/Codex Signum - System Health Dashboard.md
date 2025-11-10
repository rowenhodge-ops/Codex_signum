---
cssclass: dashboard
tags:
  - dashboard
  - system-health
  - phase-3
created: 2025-11-10
last-updated: 2025-11-10
---

# Codex Signum - System Health Dashboard

**Purpose**: Operational intelligence - surfaces gaps, strategic opportunities, and validation needs across the knowledge graph

**Last Updated**: 2025-11-10  
**Sprint**: Sprint 1 Week 1 (Phase 3 Foundation)

---

## 🎯 Quick Status Overview

> **Note**: This dashboard uses Dataview queries to surface actionable insights. Install the Dataview plugin if queries aren't rendering.

---

## 📊 Dashboard Queries

### 1. Stale Targets (>30 Days Without Update)

**Purpose**: Identify research or qualified targets that haven't been updated recently - potential pipeline leaks

```dataview
TABLE 
    stakeholder-type as "Type",
    last-updated as "Last Updated",
    (date(today) - date(last-updated)).days as "Days Stale",
    tags as "Tags"
FROM "Codex Signum/Stakeholder Engagment" OR "Codex Signum/Research"
WHERE file.name != "System Health Dashboard"
    AND last-updated
    AND (date(today) - date(last-updated)).days > 30
SORT (date(today) - date(last-updated)).days DESC
LIMIT 10
```

**What to do**: Review each stale target and decide:
- Re-engage (schedule follow-up)
- Disqualify (move to closed-lost)
- Archive (no longer relevant)

---

### 2. Unvalidated T2/T3 Hypotheses

**Purpose**: Find Target Profiles where technical/operational assumptions haven't been validated yet

```dataview
TABLE 
    t2-validated as "T2 Valid",
    t3-validated as "T3 Valid",
    engagement-count as "Engagements",
    last-updated as "Last Updated"
FROM "Codex Signum/Stakeholder Engagment"
WHERE (t2-validated = false OR t3-validated = false)
    AND file.name != "System Health Dashboard"
SORT engagement-count DESC
LIMIT 10
```

**What to do**: For each unvalidated hypothesis:
- T2 (Technical): Validate with C2 stakeholders (IT Directors, CTOs)
- T3 (Operational): Validate with C3 stakeholders (Operations, Procurement)
- Update template with validation status after confirmation

**Critical**: Validated T2/T3 correlates with 95%+ win rate (vs 45% unvalidated)

---

### 3. Uncommitted Learnings (From Recent Engagements)

**Purpose**: Surface engagement notes with insights that haven't been captured in Learning Registry

```dataview
TABLE 
    stakeholder-type as "Type",
    sentiment as "Sentiment",
    cta-success as "CTA Success",
    learning-id as "Learning ID",
    date as "Date"
FROM "Codex Signum/Stakeholder Engagment"
WHERE tags contains "engagement"
    AND !learning-id
    AND date >= date(today) - dur(30 days)
SORT date DESC
LIMIT 10
```

**What to do**: Review each engagement note and ask:
- Did I learn a repeatable principle? → Create Learning Registry entry
- Was there a surprising outcome? → Document pattern
- Did stakeholder teach me something? → Capture key language

**Why this matters**: Learnings compound over time - capturing them builds institutional memory

---

### 4. Learning Impact Validation (Ready for Validation)

**Purpose**: Identify Learning Registry entries with 3+ applications (ready to validate effectiveness)

```dataview
TABLE 
    application-count as "Applications",
    validation-status as "Status",
    principle as "Principle",
    last-updated as "Last Updated"
FROM "Codex Signum/Learning Log"
WHERE tags contains "learning-registry"
    AND application-count >= 3
    AND validation-status = "untested"
SORT application-count DESC
LIMIT 10
```

**What to do**: For each learning with 3+ applications:
- Review engagement notes where applied
- Calculate success rate (CTA success, sentiment improvement)
- If success rate >70% → update `validation-status: validated`
- If success rate <40% → update `validation-status: superseded` (explain why)

**Pattern**: Validated learnings = competitive advantage (proven tactics)

---

### 5. Pipeline Health by Stage

**Purpose**: Distribution of targets across pipeline stages - identify bottlenecks

```dataview
TABLE 
    length(rows) as "Count",
    sum(rows.estimated-value) as "Total Value"
FROM "Codex Signum/Stakeholder Engagment" OR "Codex Signum/Research"
WHERE tags contains "target-profile"
GROUP BY status
SORT status ASC
```

**Expected Distribution** (healthy pipeline):
- Research: 40% of targets (top of funnel)
- Qualified: 30% of targets (filtering)
- Engaged: 20% of targets (active pursuit)
- Proposal: 7% of targets (closing)
- Negotiation: 3% of targets (final stage)

**Red flags**:
- Engaged stage >30% = stagnation (need C4 engagement)
- Proposal stage <5% = not closing (conversion issue)
- Research stage <30% = thin pipeline (need more prospecting)

---

### 6. Weekly Billable Utilization Trending

**Purpose**: Track billable vs non-billable hours over last 8 weeks (target: 70%+ billable)

```dataview
TABLE 
    week-of as "Week",
    total-engagements as "Engagements",
    billable-hours as "Billable",
    non-billable-hours as "Non-Billable",
    round(billable-hours / (billable-hours + non-billable-hours) * 100, 1) as "Utilization %"
FROM "Codex Signum/Log"
WHERE tags contains "weekly-review"
    AND week-of >= date(today) - dur(56 days)
SORT week-of DESC
LIMIT 8
```

**Target**: 70%+ billable utilization  
**Acceptable**: 60-70% (building phase)  
**Concern**: <60% (insufficient client work)

**Actions**:
- Utilization <60% for 2+ weeks → Prioritize pipeline (more Initium proposals)
- Utilization >85% → Risk of burnout (defer new engagements, hire support)

---

## 🚨 Alert Thresholds (Manual Review Triggers)

### Critical Alerts (Check Daily)
- ❌ **Stale Targets >10**: Pipeline leaking, need re-engagement or disqualification
- ❌ **Unvalidated T2/T3 >5**: Risk of proposals without evidence (low win rate)
- ❌ **Uncommitted Learnings >5**: Losing institutional memory (capture insights)

### Warning Alerts (Check Weekly)
- ⚠️ **Pipeline Bottleneck**: >30% of targets in single stage (Engaged or Proposal)
- ⚠️ **Utilization <60%**: 2+ consecutive weeks below target (revenue risk)
- ⚠️ **Learnings Ready for Validation**: 5+ entries with 3+ applications (compound value)

### Opportunity Alerts (Check Monthly)
- ✅ **Validated Learnings**: 10+ validated principles (competitive advantage)
- ✅ **High-Value Pipeline**: $500K+ weighted pipeline (3x quarterly revenue target)
- ✅ **Utilization 70-80%**: Optimal balance (sustainable, profitable)

---

## 📈 Sprint 1 Success Metrics

**Dashboard Effectiveness** (evaluate after 4 weeks):
- ✅ Principal reviews dashboard 2+ times/week (5 min each)
- ✅ Stale targets reduced by 50% (proactive re-engagement)
- ✅ Uncommitted learnings <3 at any time (capture discipline)
- ✅ Utilization trending visible (informed capacity planning)

**Query Performance** (technical validation):
- ✅ All queries execute in <2 seconds
- ✅ No missing data (all templates have required fields)
- ✅ Accurate counts (manual spot-check vs actual notes)

---

## 🔧 Implementation Notes

### Required Template Fields

**For Target Profiles** (`TPL - Target Profile.md`):
- `status`: research, qualified, engaged, proposal, negotiation, closed-won, closed-lost
- `t2-validated`: true/false (technical assumptions confirmed)
- `t3-validated`: true/false (operational assumptions confirmed)
- `estimated-value`: numeric (pipeline forecasting)
- `last-updated`: YYYY-MM-DD (staleness detection)

**For Engagement Notes** (`TPL - Engagement Note.md`):
- `learning-id`: link to Learning Registry entry (or null)
- `sentiment`: 1-5 scale (delivery quality tracking)
- `cta-success`: true/false (effectiveness measurement)
- `date`: YYYY-MM-DD (trending analysis)

**For Learning Registry** (`TPL - Learning Registry.md`):
- `application-count`: numeric (usage tracking)
- `validation-status`: untested, validated, superseded
- `principle`: text (what was learned)
- `last-updated`: YYYY-MM-DD (maintenance tracking)

**For Weekly Reviews** (`TPL - Weekly Review.md`):
- `week-of`: YYYY-MM-DD (trending)
- `billable-hours`: numeric (utilization calculation)
- `non-billable-hours`: numeric (utilization calculation)
- `total-engagements`: numeric (activity level)

### Query Troubleshooting

**Query returns no results**:
1. Check folder path: `"Codex Signum/Stakeholder Engagment"` (verify spelling)
2. Check field names: `t2-validated` vs `t2_validated` (hyphens matter)
3. Check tags: `tags contains "engagement"` (case-sensitive)
4. Check date format: `YYYY-MM-DD` (ISO 8601 required)

**Query returns wrong data**:
1. Verify template metadata: Open 3 sample notes, check frontmatter
2. Manual spot-check: Count notes manually, compare to query result
3. Date calculations: Test with known stale target (should appear in query)

**Performance issues (>5 seconds)**:
1. Reduce folder scope: Query specific subfolder vs entire vault
2. Add LIMIT clause: Start with LIMIT 10, increase if needed
3. Remove complex calculations: Simplify date arithmetic

---

## 🎯 Next Steps After Dashboard

**Immediate** (Sprint 1 Week 2 - Nov 18-24):
1. Add validation metadata to templates (t2-validated, t3-validated, learning-id)
2. Backfill existing notes with new fields (prioritize active targets)
3. Test dashboard queries with real data (verify accuracy)

**Short-term** (Sprint 2 - Nov 25 - Dec 8):
4. Build Auditor Agent (automates nightly analysis of these queries)
5. Add alert system (Firestore + email digest for critical thresholds)
6. Enhance dashboard with charts (if using Obsidian Charts plugin)

**Medium-term** (Sprint 3+ - Dec 9+):
7. Researcher Agent integration (query answers link to dashboard insights)
8. Strategist Agent recommendations (uses dashboard data for prioritization)
9. COO/CFO dashboards (operational and financial metrics)

---

## 📚 Related Documents

- [[PHASE_3_IMPLEMENTATION_PLAN]] - Sprint 1 deliverables and timeline
- [[AGENT_REGISTRY]] - Auditor Agent will automate this analysis
- [[TPL - Target Profile]] - Template with t2-validated, t3-validated fields
- [[TPL - Engagement Note]] - Template with learning-id field
- [[TPL - Learning Registry]] - Template with application-count, validation-status
- [[TPL - Weekly Review]] - Template with billable-hours, utilization tracking

---

## 📝 Changelog

### 2025-11-10 - Version 1.0 (Sprint 1 Week 1)
- Created System Health Dashboard with 6 Dataview queries
- Defined alert thresholds (critical, warning, opportunity)
- Documented required template fields for query functionality
- Established success metrics for dashboard effectiveness
- Added troubleshooting guide for query issues

---

**Last Updated**: 2025-11-10  
**Status**: 🟢 Active (Sprint 1 Week 1 deliverable)  
**Next Review**: 2025-11-17 (after 1 week of usage, tune query thresholds)
