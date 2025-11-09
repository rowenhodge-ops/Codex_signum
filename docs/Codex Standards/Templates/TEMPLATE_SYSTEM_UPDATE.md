# Template System Update - 2025-11-09

## Overview

This document summarizes the template system enhancements for improved LLM RAG integration and knowledge graph effectiveness.

## Changes Made

### ✅ Enhanced Existing Templates

#### 1. TPL - Learning Registry.md

**Status:** ✅ Complete restructure

**Added:**

- Comprehensive YAML frontmatter with tracking fields
- `validation-status` (untested/validated/superseded)
- `application-count` for usage tracking
- Structured sections for "What Changed" with Before/After/Delta pattern
- Performance impact tracking (edit distance, CTA success, response time)
- Application guidelines section
- Related learnings linkage

**RAG Benefits:**

- LLM can now retrieve specific learnings by context/stakeholder type
- Performance metrics enable automated quality tracking
- Validation status prevents applying superseded learnings

#### 2. TPL - Engagement Note.md

**Status:** ✅ Enhanced with performance metrics

**Added:**

- `response-time-hours` for tracking stakeholder responsiveness
- `cta-success` field (Accepted/Deferred/Rejected)
- `sentiment-score` (-1 to +1 scale)
- `edit-distance-score` (1-5 for LLM draft quality tracking)
- Pre-engagement context section
- Outcome & response tracking section
- LLM draft quality analysis section
- Codex commit checklist

**RAG Benefits:**

- Full engagement lifecycle captured in structured metadata
- Performance tracking enables systematic improvement
- Edit distance scoring creates feedback loop for LLM training

#### 3. TPL - Stakeholder Profile.md

**Status:** ✅ Comprehensive enhancement

**Added:**

- `company`, `vertical`, `first-contact-date` fields
- `relationship-strength` (cold/warm/hot)
- `potential-value` (low/medium/high/strategic)
- Strategic value assessment (for us / for them)
- Context & background sections
- Performance metrics tracking
- Network & connections mapping
- Strategic notes (opportunities/risks)

**RAG Benefits:**

- Multi-dimensional stakeholder assessment
- Relationship lifecycle tracking
- Network graph construction via connections

#### 4. TPL - Event Debrief.md

**Status:** ✅ Enhanced with structured metrics

**Added:**

- Comprehensive YAML frontmatter
- `event-id`, `attendees-met`, `follow-up-required` fields
- Event metrics & summary section
- Structured P2 reward checklist with timelines
- Strategic analysis section
- Related documents tracking

**RAG Benefits:**

- Quantitative event ROI assessment
- Time-bound action item tracking
- Multi-stakeholder event intelligence capture

### 🆕 New Templates Created

#### 5. TPL - Target Profile.md

**Status:** ✅ Created (based on SOP - Market Intelligence V1.0)

**Structure:**

- T1: Strategic Language (priorities, financials, C-suite language)
- T2: Technical Reality (known stack, vendor gaps, integration chaos)
- T3: Operational Symptoms (tactical problems, staff complaints, quantifiable impacts)
- Synthesis section (connects T1→T2→T3)
- The Killer Question (strategic pitch angle)
- Contact strategy & pathway mapping
- Intelligence sources & confidence levels

**RAG Benefits:**

- Structured market intelligence capture
- Three-tier analysis framework enables pattern recognition
- Confidence level tracking for intelligence quality
- Direct mapping to engagement strategy

#### 6. TPL - Market Insight.md

**Status:** ✅ Created

**Structure:**

- Executive summary with confidence level
- Deep dive analysis section
- Application to Codex Signum (Initium, proposals, talking points)
- Stakeholder-specific talking points (C1/C2/C3/C4)
- Real-world examples
- Strategic implications
- Related insights linkage
- Validation & testing framework

**RAG Benefits:**

- Systematic insight capture from 22+ existing insight files
- Multi-level application guidance (strategic + tactical)
- Stakeholder-specific framing templates
- Insight network via related insights

#### 7. TPL - Weekly Review.md

**Status:** ✅ Created

**Structure:**

- Engagement performance metrics
- Breakdown by stakeholder category (C1/C2/C3/C4)
- Learning system performance tracking
- Target profile progress
- Key wins & challenges
- Insights & patterns section
- Action items for next week
- System health check
- Reflection & meta-learning

**RAG Benefits:**

- System-level performance monitoring
- Trend analysis (week-over-week)
- Learning system effectiveness tracking
- Pattern recognition across engagements
- Continuous improvement loop

#### 8. TPL - Research Note.md

**Status:** ✅ Created

**Structure:**

- Research question & success criteria
- Context & motivation
- Research plan with timeline
- Findings with confidence levels
- Analysis & synthesis
- Actionable recommendations
- Documentation & artifacts
- Promotion pathway (to Market Insight, etc.)

**RAG Benefits:**

- Exploratory research capture
- Evidence-based conclusion tracking
- Confidence level assessment
- Clear promotion pathway to formal insights

## Template System Architecture

### Document Hierarchy

```
┌─────────────────────────────────────────────┐
│         Weekly Review (System Level)         │
│  - Aggregates all engagement performance     │
│  - Tracks learning system effectiveness      │
└─────────────────┬───────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
┌────────▼────────┐ ┌─────▼──────────┐
│ Target Profiles │ │ Market Insights │
│  (Organizations) │ │  (Intelligence) │
└────────┬────────┘ └─────┬──────────┘
         │                 │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  Engagement      │
         │     Notes        │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  Stakeholder    │
         │   Profiles      │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │    Learning     │
         │    Registry     │
         └─────────────────┘
```

### Metadata Schema (Shared Fields)

**Core Identity:**

- `*-id` (unique identifier pattern)
- `date-created` / `last-updated`
- `status` (lifecycle state)

**Relationships:**

- `stakeholder-id` (person)
- `related-target` (organization)
- `related-sop` (process)
- `related-*` (flexible linking)

**Performance Tracking:**

- `*-success-rate` (percentages)
- `*-score` (numeric scales)
- `*-count` (volume metrics)

**Intelligence Metadata:**

- `key-language` (verbatim terms)
- `messy-problems` (pain points)
- `learning-id` (lessons learned)
- `action-items` (next steps)

## RAG & Knowledge Graph Benefits

### 1. Semantic Search Improvements

**Before:**

- Free-text notes with inconsistent structure
- Difficult to find specific information types
- No performance metrics

**After:**

- Structured metadata enables precise queries
- Consistent fields across document types
- Quantitative performance tracking

**Example Queries Now Possible:**

```
"Show all C1 engagements with CTA success rate > 75%"
"Find messy problems mentioned in HEI sector Target Profiles"
"List learnings with validation-status=validated and application-count > 5"
"What's the average response time for C2 collaborators vs C3 market intel?"
```

### 2. Knowledge Graph Enhancement

**Node Types:**

- Stakeholder Profiles (people)
- Target Profiles (organizations)
- Engagement Notes (interactions)
- Learning Registry (insights)
- Market Insights (intelligence)
- Research Notes (investigations)

**Edge Types:**

- `works-at` (Stakeholder → Target Profile)
- `engaged-with` (Engagement Note → Stakeholder)
- `discovered-at` (Learning → Engagement)
- `applies-to` (Market Insight → Target Profile)
- `validates` (Research Note → Market Insight)

**Graph Queries Enabled:**

```
"Show me the network graph around [[University of Wollongong]]"
→ Returns: Target Profile + all related stakeholders + engagements + learnings

"Find the shortest path from [[C1 - Herman Tse]] to [[Economic Buyer]]"
→ Returns: Relationship chain and engagement history

"What learnings were discovered from engagements with HEI sector targets?"
→ Returns: Learning Registry entries + source engagements + validation status
```

### 3. LLM Context Retrieval

**Structured Prompts Enabled:**

When generating engagement draft:

```
Retrieve:
- [[Stakeholder Profile]] (relationship history, communication preferences)
- [[Target Profile]] (if applicable - T1/T2/T3 analysis)
- [[Learning Registry]] (validated learnings for this stakeholder type)
- [[Market Insight]] (relevant sector intelligence)

Generate engagement draft using:
- Stakeholder's key language
- Validated learnings for this stakeholder category
- Target profile killer question
- Market insights for context
```

When analyzing weekly performance:

```
Retrieve:
- All Engagement Notes from week
- Current Learning Registry entries
- Previous Weekly Review for comparison

Analyze:
- CTA success rates by stakeholder category
- Edit distance trends (is LLM improving?)
- New learnings captured vs applied
- Pattern recognition across messy problems
```

## Implementation Checklist

### Immediate (This Week)

- [x] Update TPL - Learning Registry
- [x] Enhance TPL - Engagement Note
- [x] Enhance TPL - Stakeholder Profile
- [x] Enhance TPL - Event Debrief
- [x] Create TPL - Target Profile
- [x] Create TPL - Market Insight
- [x] Create TPL - Weekly Review
- [x] Create TPL - Research Note
- [ ] Test templates with Templater plugin
- [ ] Create sample documents to validate structure
- [ ] Update SOP references to new template fields

### Short-term (Next 2 Weeks)

- [ ] Migrate existing insights to TPL - Market Insight format
- [ ] Create Target Profiles for known organizations
- [ ] Backfill performance metrics in existing Engagement Notes
- [ ] Set up Dataview queries for new dashboard views
- [ ] Document template usage in SOP - Meta-Data Management

### Medium-term (Next Month)

- [ ] Analyze template effectiveness (are they being used?)
- [ ] Gather feedback on template complexity
- [ ] Refine based on actual usage patterns
- [ ] Create template variations if needed (simplified versions)
- [ ] Build automated template validation scripts

## Template Usage Guide

### When to Use Which Template

**TPL - Engagement Note** → Every stakeholder interaction (call, meeting, email)

**TPL - Stakeholder Profile** → When you meet a new person or promote existing contact

**TPL - Target Profile** → When researching an organization as potential client

**TPL - Market Insight** → When you identify a reusable pattern or intelligence

**TPL - Learning Registry** → When you discover a principle to improve future engagements

**TPL - Weekly Review** → Every Friday/Monday for performance tracking

**TPL - Research Note** → When investigating a question that doesn't fit other templates

**TPL - Event Debrief** → After attending conferences, networking events, workshops

## Success Metrics

### System Health Indicators

1. **Template adoption rate** (% of new documents using templates)
2. **Metadata completeness** (% of required fields populated)
3. **Link density** (avg # of wiki-links per document)
4. **Learning velocity** (new learnings per week)
5. **Application frequency** (how often learnings are referenced)

### Performance Tracking

1. **CTA success rate** (trending up?)
2. **Edit distance score** (LLM improving?)
3. **Response time** (relationships strengthening?)
4. **Sentiment score** (engagement quality improving?)

### Intelligence Quality

1. **Confidence levels** (are we validating insights?)
2. **Source diversity** (multiple confirmation sources?)
3. **Pattern recognition** (messy problems appearing across multiple targets?)

## Next Steps

1. **Test templates** with Obsidian Templater plugin
2. **Create example documents** for each template type
3. **Update SOP - Strategic Network & Stakeholder Engagement** to reference new fields
4. **Build Dataview dashboard queries** for new metrics
5. **Document template conventions** in Obsidian vault README

## Change Log

### 2025-11-09 - Initial Template System Overhaul

- Enhanced 4 existing templates with performance metrics
- Created 4 new templates for comprehensive workflow coverage
- Standardized YAML frontmatter across all templates
- Documented template hierarchy and relationships
- Defined RAG benefits and knowledge graph improvements

---

**Related Documents:**

- [[SOP - Strategic Network & Stakeholder Engagement (v2.2)]]
- [[SOP - Meta-Data Management]]
- [[The SOP as a Living System]]
- [[Obsidian Tagging]]
