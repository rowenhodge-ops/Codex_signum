---
document-type: registry
status: 🟢 Active
version: 1.0
created: 2025-11-10
last-updated: 2025-11-10
author: Collaborative
related-documents:
  - PHASE_3_IMPLEMENTATION_PLAN.md
  - agents/auditor-agent-spec.md
  - agents/researcher-agent-spec.md
  - agents/synthesizer-agent-spec.md
  - agents/strategist-agent-spec.md
  - agents/coo-agent-spec.md
  - agents/cfo-agent-spec.md
  - ../Kore/ARCHITECTURE_PATTERNS.md
  - ../Kore/CORE_TYPES.md
tags:
  - agent-registry
  - hierarchical-agents
  - phase-3-core
  - phase-4-specialists
---

# Agent Registry - Codex Signum AI Architecture

**Purpose**: Central catalog of all autonomous agents (current and planned) with roles, triggers, and build priorities

**Scope**: 6 core agents (Phase 3), 8 specialist agents (Phase 4+), hierarchical structure, decision gates

**Design Philosophy**: Start lean (6 core), scale strategically (revenue milestones), preserve vision (document future agents now)

---

## Overview

Codex Signum employs a **hierarchical agent architecture** where autonomous AI agents handle tactical execution, operational management, and strategic oversight. This registry documents all current and planned agents, their roles, and build priorities.

**Design Philosophy**:

- **Start lean** (6 core agents in Phase 3)
- **Scale strategically** (add specialists based on revenue milestones)
- **Preserve vision** (document future agents now, build when justified)

---

## Agent Hierarchy

```
┌─────────────────────────────────────────────────────┐
│         STRATEGIST (Board Level)                     │
│  • Business plan compliance                         │
│  • Strategic gap analysis                           │
│  • Quarterly performance review                     │
└────────────────┬────────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
┌─────▼──────┐      ┌──────▼──────┐
│    CFO     │      │     COO     │
│ (Finance)  │      │ (Operations)│
└─────┬──────┘      └──────┬──────┘
      │                    │
      │         ┌──────────┼──────────┐
      │         │          │          │
┌─────▼─────┐ ┌▼─────┐ ┌─▼────┐ ┌───▼────────┐
│  AUDITOR  │ │RESEAR│ │SYNTHE│ │  WORKFLOW  │
│ (Health)  │ │ -CHER│ │-SIZER│ │  OPTIMIZER │
└───────────┘ └──────┘ └──────┘ └────────────┘

Future Specialist Layer (Phase 4+):
┌────────────┬───────────┬──────────┬─────────────┐
│CYBERSECUR │COMPLIANCE │   RISK   │    LEGAL    │
│   -ITY    │  OFFICER  │  MGMT    │             │
└────────────┴───────────┴──────────┴─────────────┘
┌────────────┬───────────┬──────────┬─────────────┐
│ MARKETING  │  SALES    │    HR    │  CUSTOMER   │
│            │   DEV     │  TALENT  │   SUCCESS   │
└────────────┴───────────┴──────────┴─────────────┘
```

---

## Phase 3: Core 6 Agents (Q1 2026)

### 1. Auditor Agent

**Status**: 🔴 Not Started (Sprint 2 - Weeks 3-4)  
**Purpose**: System health monitoring, gap identification  
**Cost**: $15/month (GPT-4o-mini + Neo4j queries)  
**Runs**: Nightly at 3 AM

**Key Responsibilities**:

- Find stale Target Profiles (30+ days without update)
- Identify unvalidated T2/T3 hypotheses
- Discover warm introduction paths to C4 buyers
- Track learning application → outcome correlation
- Flag scope creep risks in active engagements

**Output**: Daily audit report with prioritized action items

**Success Metrics**:

- Identifies 3+ high-impact gaps per week
- Warm intro discovery: 2+ opportunities per month
- 95% accuracy (consultant validates findings)

**Full Spec**: [agents/auditor-agent-spec.md](agents/auditor-agent-spec.md)

---

### 2. Researcher Agent

**Status**: 🔴 Not Started (Sprint 3 - Weeks 5-6)  
**Purpose**: Autonomous T2/T3 validation via web research  
**Cost**: $20/month (GPT-4o-mini + search API)  
**Runs**: On-demand (triggered by Auditor or COO)

**Key Responsibilities**:

- Validate Target Profile hypotheses (technical reality, operational context)
- Web research using DuckDuckGo, Wikipedia, company databases
- Generate Research Notes with findings and confidence scores
- Update Target Profile metadata (t2_validated, t3_validated)

**Output**: Research Notes with validated assumptions

**Success Metrics**:

- Validates 5+ T2/T3 hypotheses per week
- 80%+ findings confirmed by consultant review
- Reduces research time from 2 hours → 15 minutes

**Full Spec**: [agents/researcher-agent-spec.md](agents/researcher-agent-spec.md)

---

### 3. Synthesizer Agent

**Status**: 🔴 Not Started (Sprint 4 - Weeks 7-8)  
**Purpose**: "Codex Commit" automation - extract learnings from engagements  
**Cost**: $15/month (GPT-4o-mini + embeddings)  
**Runs**: When Engagement Note marked `status: completed`

**Key Responsibilities**:

- Extract key language, messy problems from engagement notes
- Compare to existing Learning Registry for novelty
- Draft Learning Registry entries (human-in-loop approval)
- Track learning application in Neo4j (APPLIED_IN relationships)

**Output**: Draft Learning Registry entries for consultant review

**Success Metrics**:

- Identifies 2-3 learning candidates per week
- 60%+ consultant approval rate
- Reduces "Codex Commit" time from 30 min → 5 min

**Full Spec**: [agents/synthesizer-agent-spec.md](agents/synthesizer-agent-spec.md)

---

### 4. Strategist Agent

**Status**: 🔴 Not Started (Sprint 5 - Weeks 9-10)  
**Purpose**: Business plan compliance monitoring + strategic insights  
**Cost**: $5/month (GPT-4o-mini, weekly runs)  
**Runs**: Weekly (Monday mornings)

**Key Responsibilities**:

- Parse Business Plan v5.4 strategic goals
- Compare plan targets vs. Codex reality (Neo4j queries)
- Identify strategic gaps (e.g., conversion rate below target)
- Generate Strategic Review Notes with recommendations
- Trigger other agents proactively (e.g., "Research T3 for lost Initiums")

**Output**: Weekly Strategic Review Note

**Success Metrics**:

- Identifies 1-2 strategic gaps per week
- Proactively triggers Researcher/Auditor agents
- Consultant acts on 80%+ recommendations

**Full Spec**: [agents/strategist-agent-spec.md](agents/strategist-agent-spec.md)

---

### 5. COO Agent (Operations Director)

**Status**: 🔴 Not Started (Sprint 6 - Week 11)  
**Purpose**: Workflow optimization, capacity planning, task prioritization  
**Cost**: $15/month (GPT-4o-mini + Neo4j)  
**Runs**: Daily (morning)

**Key Responsibilities**:

- Analyze time allocation (billable vs. internal operations)
- Identify workflow bottlenecks (stalled tasks, unassigned work)
- Calculate capacity utilization (target: 60%+ billable)
- Optimize task sequencing (ROI-based prioritization)
- Delegate tasks to other agents (automation opportunities)

**Output**: Daily operations brief with top 5 priority tasks

**Success Metrics**:

- Maintains 60%+ billable utilization
- Identifies 4+ hours/week delegation opportunities
- Task completion velocity: 5+ high-value tasks/week

**Full Spec**: [agents/coo-agent-spec.md](agents/coo-agent-spec.md)

---

### 6. CFO Agent (Financial Controller)

**Status**: 🔴 Not Started (Sprint 7 - Week 12)  
**Purpose**: Budget tracking, revenue forecasting, cost optimization  
**Cost**: $5/month (GPT-4o, monthly runs)  
**Runs**: Monthly (first Monday)

**Key Responsibilities**:

- Calculate monthly revenue by product (Initium, Consilium, Fabrica, Vigilia)
- Analyze profit margins by engagement type
- Track infrastructure costs vs. budget ($210/month target)
- Forecast Year 1 revenue trajectory (vs. $500k goal)
- Optimize service mix (which products to prioritize)

**Output**: Monthly financial report with strategic recommendations

**Success Metrics**:

- Revenue forecasts accurate within 10%
- Infrastructure costs stay within 110% of budget
- Identifies service mix optimization opportunities

**Full Spec**: [agents/cfo-agent-spec.md](agents/cfo-agent-spec.md)

---

## Phase 3 Summary

| Agent       | Build Sprint | Cost/Month    | Time Savings     | ROI     |
| ----------- | ------------ | ------------- | ---------------- | ------- |
| Auditor     | Weeks 3-4    | $15           | 1 hour/week      | 27x     |
| Researcher  | Weeks 5-6    | $20           | 2 hours/week     | 60x     |
| Synthesizer | Weeks 7-8    | $15           | 0.5 hour/week    | 13x     |
| Strategist  | Weeks 9-10   | $5            | 1 hour/week      | 120x    |
| COO         | Week 11      | $15           | 2 hours/week     | 80x     |
| CFO         | Week 12      | $5            | 1.5 hours/week   | 180x    |
| **TOTAL**   | **12 weeks** | **$75/month** | **8 hours/week** | **64x** |

**Break-Even**: 0.5 hours of consultant time saved/month (conservative: expect 8+ hours/week)

---

## Parked Agents: Future Specialists

### High Priority (Q2 2026)

#### Agent 7: Cybersecurity Agent

**Trigger**: After Phase 3 agents validated  
**Purpose**: Security posture monitoring, threat detection, data protection compliance  
**Build Time**: 3 weeks  
**Cost**: $20/month

**Key Features**:

- Daily Firestore access log audits
- API key rotation automation
- PII detection in notes (data classification)
- Anomaly detection (unusual query patterns)

**Decision Gate**: Build when confidential client data exceeds 100 notes

**Full Spec**: [agents/cybersecurity-agent-spec.md](agents/cybersecurity-agent-spec.md)

---

#### Agent 8: Compliance Officer Agent

**Trigger**: After CFO stable  
**Purpose**: Regulatory compliance monitoring, contract adherence, scope creep detection  
**Build Time**: 2 weeks  
**Cost**: $10/month

**Key Features**:

- Pre-engagement contract term audits
- Scope creep detection (hours delivered vs. estimated)
- Professional indemnity insurance verification
- Liability exposure flagging

**Decision Gate**: Build after 10+ client engagements completed

**Full Spec**: [agents/compliance-agent-spec.md](agents/compliance-agent-spec.md)

---

### Medium Priority (Q3 2026)

#### Agent 9: Risk Management Agent

**Trigger**: After COO/CFO stable  
**Purpose**: Business risk identification (operational, financial, reputational)  
**Build Time**: 3 weeks  
**Cost**: $15/month

**Key Features**:

- Pipeline concentration risk analysis
- Client payment risk monitoring
- Market risk tracking (competitor movements)
- Relationship risk detection (stakeholder churn)

**Decision Gate**: Build after $500k revenue annualized

**Full Spec**: [agents/risk-management-agent-spec.md](agents/risk-management-agent-spec.md)

---

#### Agent 10: Legal Agent

**Trigger**: After $1M+ revenue  
**Purpose**: Contract review, IP protection, legal risk mitigation  
**Build Time**: 4 weeks  
**Cost**: $20/month

**Key Features**:

- Contract clause extraction (PDF parsing)
- Unfavorable term detection (unlimited liability, indemnification)
- IP ownership clause validation
- Standard contract comparison

**Decision Gate**: Build after 20+ contracts signed

**Full Spec**: [agents/legal-agent-spec.md](agents/legal-agent-spec.md)

---

### Low Priority (Q4 2026+)

#### Agent 11: Marketing Agent

**Trigger**: After revenue stable  
**Purpose**: Content generation, campaign optimization, engagement analysis  
**Build Time**: 3 weeks  
**Cost**: $25/month

**Decision Gate**: Build after Initium conversion rate >40%

**Full Spec**: [agents/marketing-agent-spec.md](agents/marketing-agent-spec.md)

---

#### Agent 12: Sales Development Agent

**Trigger**: After Initium conversion >40%  
**Purpose**: Lead qualification, outreach automation, demo scheduling  
**Build Time**: 4 weeks  
**Cost**: $30/month

**Decision Gate**: Build after consistent Initium lead flow (5+ per month)

**Full Spec**: [agents/sales-development-agent-spec.md](agents/sales-development-agent-spec.md)

---

#### Agent 13: HR/Talent Agent

**Trigger**: After multi-consultant team  
**Purpose**: Subcontractor sourcing, skill gap analysis, capacity forecasting  
**Build Time**: 3 weeks  
**Cost**: $20/month

**Decision Gate**: Build after hiring first subcontractor

**Full Spec**: [agents/hr-talent-agent-spec.md](agents/hr-talent-agent-spec.md)

---

#### Agent 14: Customer Success Agent

**Trigger**: After 3+ Vigilia clients  
**Purpose**: Retainer health monitoring, churn prediction, expansion opportunities  
**Build Time**: 4 weeks  
**Cost**: $25/month

**Decision Gate**: Build after $300k+ ARR from Vigilia retainers

**Full Spec**: [agents/customer-success-agent-spec.md](agents/customer-success-agent-spec.md)

---

## Decision Tree: When to Build Next Agent

```
Phase 3 Complete (Q1 2026)
│
├─ Are 6 core agents saving 8+ hours/week?
│  ├─ YES → Evaluate Q2 build
│  └─ NO → Optimize existing agents first
│
Q2 2026 Decision Point ($200k cumulative revenue)
│
├─ Confidential client data >100 notes?
│  ├─ YES → Build Cybersecurity Agent
│  └─ NO → Wait for more data volume
│
├─ Completed engagements >10?
│  ├─ YES → Build Compliance Agent
│  └─ NO → Wait for more contract history
│
Q3 2026 Decision Point ($500k revenue annualized)
│
├─ Revenue concentrated in 1-2 clients?
│  ├─ YES → Build Risk Management Agent
│  └─ NO → Diversification healthy
│
├─ Signed contracts >20?
│  ├─ YES → Build Legal Agent
│  └─ NO → Wait for contract volume
│
Q4 2026 Decision Point (Revenue stable, scaling)
│
├─ Initium conversion rate >40%?
│  ├─ YES → Build Marketing + Sales Dev Agents
│  └─ NO → Focus on conversion optimization
│
2027 Decision Point (Multi-consultant team)
│
├─ Subcontractors used on 3+ projects?
│  ├─ YES → Build HR/Talent Agent
│  └─ NO → Solo consultant still viable
│
├─ Vigilia ARR >$300k?
│  ├─ YES → Build Customer Success Agent
│  └─ NO → Scale Vigilia first
```

---

## Agent Cost Progression

| Phase                 | Active Agents  | Monthly Cost | Cumulative ROI           |
| --------------------- | -------------- | ------------ | ------------------------ |
| **Phase 3** (Q1 2026) | 6 core         | $75          | 64x ($4,800/month value) |
| **Q2 2026**           | +2 specialists | $105         | 45x                      |
| **Q3 2026**           | +2 specialists | $140         | 34x                      |
| **Q4 2026**           | +2 specialists | $195         | 24x                      |
| **2027**              | +2 specialists | $240         | 20x                      |

**Key Insight**: ROI decreases as specialists added (diminishing returns), but absolute value increases. Build only when decision gates met.

---

## Maintenance & Governance

### Monthly Agent Performance Review

**Conducted by**: Strategist Agent (automated) + Consultant (manual validation)

**Metrics Tracked**:

- Time savings per agent (hours/week)
- Cost per agent (actual vs. budgeted)
- Accuracy rate (human validation of agent outputs)
- Utilization rate (how often agent is triggered)

**Decision Criteria**:

- **Keep**: ROI >5x, accuracy >80%, utilized >2x/week
- **Optimize**: ROI <5x, accuracy 60-80%, utilized 1-2x/week
- **Deprecate**: ROI <2x, accuracy <60%, utilized <1x/month

### Quarterly Agent Architecture Review

**Review Questions**:

1. Which agents saved the most time this quarter?
2. Which agents had the lowest accuracy? Why?
3. Are there new agent types needed based on business changes?
4. Should any parked agents be activated early?
5. Should any active agents be deprecated or merged?

---

## Related Documents

- **Implementation Plan**: [PHASE_3_IMPLEMENTATION_PLAN.md](PHASE_3_IMPLEMENTATION_PLAN.md)
- **Agent Specifications**: [agents/\*.md](agents/)
- **Architecture Patterns**: [../Kore/ARCHITECTURE_PATTERNS.md](../Kore/ARCHITECTURE_PATTERNS.md)
- **Business Plan**: [../Business Plan/Business Plan - Codex Signum (V5.4).md](<../Business%20Plan/Business%20Plan%20-%20Codex%20Signum%20(V5.4).md>)

---

**Last Updated**: 2025-11-10  
**Next Review**: 2026-01-15 (after Phase 3 Sprint 1 complete)
