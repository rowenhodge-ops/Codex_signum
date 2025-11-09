# Template System User Guide

**Version**: 2.0 (Phase 2 Complete - Cell Markers Active)  
**Last Updated**: November 9, 2025  
**Status**: Production Ready

---

## Quick Start: Your Daily Workflow

### After Every Sales Call/Meeting

**5-Minute Capture (Immediately Post-Call)**:

1. Open **TPL - Engagement Note.md**
2. Fill out header metadata (date, stakeholder, type: C1/C2/C3/C4)
3. Write raw notes in "What Happened" section (don't edit yet)
4. Record CTA (Call-to-Action) and sentiment
5. Save and close

**10-Minute Processing (Same Day)**:

1. Re-open the Engagement Note
2. Fill "What It Means" section (strategic implications)
3. Identify 1-2 learning points → create Learning Registry entry
4. If new contact → create Stakeholder Profile
5. Update Target Profile if relevant
6. Add [[wiki-links]] to connect documents

### Weekly Review Ritual

**Friday Afternoon or Monday Morning** (30-45 minutes):

1. Open **TPL - Weekly Review.md**
2. Count engagement types: C1 (cold), C2 (qualified), C3 (intel), C4 (internal)
3. Calculate edit distance average (aim for ≤2.0)
4. Review wins/challenges/insights
5. Set 3 focus priorities for next week
6. Archive completed Target Profiles

### Monthly Deep Dive

**Last Week of Month** (60-90 minutes):

1. Review last 4 Weekly Reviews (trend analysis)
2. Update all active Target Profiles (refresh T1/T2/T3 data)
3. Create Market Insights from recurring themes
4. Clean up orphaned notes (no [[wiki-links]])
5. Celebrate wins, plan course corrections

---

## Template Decision Matrix

**"Which template do I use right now?"**

| Situation                  | Template            | Priority  | Why This One?                                      |
| -------------------------- | ------------------- | --------- | -------------------------------------------------- |
| Just finished a sales call | Engagement Note     | URGENT    | Capture context while fresh (memory decay = 24hrs) |
| Met someone at conference  | Event Debrief       | HIGH      | Multi-contact capture, prevents data loss          |
| Learned a new technique    | Learning Registry   | HIGH      | Knowledge compounds, don't lose insights           |
| Researching a new prospect | Target Profile      | MEDIUM    | Strategic prep, use before first contact           |
| Need to remember a contact | Stakeholder Profile | MEDIUM    | Relationship memory, update after each interaction |
| Discovered market trend    | Market Insight      | LOW       | Strategic intelligence, batch these weekly         |
| Exploring new topic        | Research Note       | LOW       | Exploratory workflow, becomes Market Insight later |
| End of week                | Weekly Review       | MANDATORY | System health check, non-negotiable                |

**Decision Tree**:

```
Did you talk to a human today?
├─ YES → Engagement Note (always)
│   ├─ New person? → Also create Stakeholder Profile
│   │   └─ Potential client? → Also create Target Profile
│   └─ Learned something? → Also create Learning Registry entry
└─ NO → Did you research something?
    ├─ YES → Research Note or Market Insight
    └─ NO → Is it Friday? → Weekly Review
```

---

## Template Deep Dive: How to Fill Out Each One

### 1. Engagement Note (Daily Workhorse)

**When**: After every call, meeting, email exchange, or LinkedIn conversation

**How to Fill It Out**:

**Header Metadata** (30 seconds):

- `date`: YYYY-MM-DD format (today's date)
- `stakeholder`: [[Name of Person]] (use wiki-link)
- `type`: C1/C2/C3/C4 (see Contact Type Guide below)
- `tags`: #engagement, plus context (#cold-outreach, #demo, #negotiation)

**Contact Type Guide**:

- **C1 (Cold Outreach)**: First contact, no prior relationship
- **C2 (Qualified Lead)**: Active sales conversation, expressed interest
- **C3 (Market Intelligence)**: Not a prospect, but valuable info source
- **C4 (Internal/Partner)**: Team member, advisor, collaborator

**What Happened** (2-3 minutes):

- Dump your raw notes (don't edit for grammar)
- Use bullet points or stream-of-consciousness
- Include direct quotes (use "quotation marks")
- Note non-verbal cues (tone, hesitation, enthusiasm)

**What It Means** (3-5 minutes):

- Strategic implications: What does this reveal about their needs?
- Qualification assessment: Are they a good fit? Budget? Authority? Timeline?
- Next steps: What changed in your approach?
- Red flags: Any concerns or blockers?

**Call-to-Action (CTA)** (1 minute):

- What did you promise to do? (e.g., "Send pricing proposal by Friday")
- Be specific and date-bound
- Track completion: Update with ✅ when done

**Sentiment** (10 seconds):

- positive: They're engaged, moving forward
- neutral: Informational, no commitment
- negative: Pushback, objections, ghosting

**Key Language** (1-2 minutes):

- Exact phrases they used (their jargon, not yours)
- Pain points in their words (gold for email templates)
- Decision criteria they mentioned

**Performance Metrics**:

- `edit_distance`: How much you had to edit "What Happened" when writing "What It Means" (0-5 scale)
  - **0-1**: Crystal clear capture, minimal edits → EXCELLENT
  - **2**: Some cleanup needed → GOOD
  - **3**: Moderate rewrites → AVERAGE (aim to improve)
  - **4-5**: Major rewrites, context lost → POOR (slow down next time)

**Pro Tip**: If your edit distance is consistently >3, you're rushing the capture phase. Spend 30 more seconds post-call writing clearer notes.

---

### 2. Learning Registry (Knowledge Compound Interest)

**When**: Whenever you learn something actionable (aim for 2-3 per week)

**How to Fill It Out**:

**Header Metadata** (30 seconds):

- `source_type`: book | article | video | conversation | experience
- `confidence_level`: validated (tested myself) | likely (credible source) | hypothesis (untested)

**What I Learned** (2 minutes):

- One sentence summary of the insight
- Example: "Cold emails with 2-sentence openers get 40% more replies than 4+ sentences"

**Context** (2 minutes):

- Where did this come from? (book title, person's name, article URL)
- Why is this relevant to your work?
- What problem does it solve?

**How to Apply It** (3-5 minutes):

- Concrete next steps (not vague intentions)
- Bad: "Use this in cold emails"
- Good: "Test 2-sentence vs 4-sentence openers in next 20 cold emails, track reply rate"

**Result** (Update after testing):

- What happened when you tried it?
- Quantify results: "Reply rate increased from 8% to 12% (n=40 emails)"
- Update `confidence_level` to "validated" if successful

**Related Concepts** (1 minute):

- [[Wiki-link]] to related Learning Registry entries
- [[Wiki-link]] to Market Insights or Target Profiles where this applies

**Pro Tip**: The Learning Registry is your competitive advantage. Most people learn things and forget them. You're building a searchable knowledge base that compounds over time.

---

### 3. Stakeholder Profile (Relationship Memory)

**When**:

- Immediately after meeting someone new (or within 24 hours)
- Update after every significant interaction

**How to Fill It Out**:

**Header Metadata** (1 minute):

- `contact_type`: C1 | C2 | C3 | C4 (matches Engagement Note types)
- `priority`: hot (active deal) | warm (nurturing) | cold (backburner) | archive (inactive)

**Quick Take** (1 minute):

- 2-3 sentence summary: Who are they? Why do they matter?
- Example: "CTO at MidMarket SaaS. Budget authority for AI projects. Burned by consultants before."

**Strategic Value** (2-3 minutes):

- What can they do for you? (decision maker, influencer, connector, intel source)
- What's their timeline? (buying now, planning for Q2, researching only)
- What's their budget? (if known)

**Background & Context** (2 minutes):

- Career history (LinkedIn stalking summary)
- Company context (industry, size, growth stage)
- Personal interests (hobbies, LinkedIn posts, Twitter activity)

**Key Language & Preferences** (3-5 minutes - CRITICAL):

- Exact phrases they use for their problems
- Communication style (formal/casual, email/phone, morning/afternoon)
- Decision criteria they've mentioned
- Pet peeves or triggers (e.g., "hates being called during lunch")

**Pro Tip**: The "Key Language" section is your secret weapon. When you mirror their exact words in follow-up emails, response rates skyrocket. Don't paraphrase—quote them.

**Messy Problems & Pain Points** (3 minutes):

- What keeps them up at night? (their words, not your guesses)
- Unsolved challenges (especially ones you can fix)
- Political/organizational blockers

**Network & Relationships** (2 minutes):

- Who do they report to? Who reports to them?
- Internal allies or blockers?
- External connections (mutual contacts, competitors they admire)

**Engagement History** (Append over time):

- Brief log of interactions with dates
- Example: "2025-11-05: Demo call, positive response to ROI calc"
- [[Wiki-link]] to full Engagement Notes

**Performance Metrics**:

- `response_rate`: How often they reply (percentage)
- `avg_response_time`: Hours/days to respond
- `engagement_quality`: high | medium | low (subjective, but track trends)

**Strategic Notes** (Evolving):

- Patterns you notice over time
- Strategy adjustments
- Risk assessment

**Pro Tip**: Update this within 2 hours of every interaction. If you wait, you'll forget the nuances (tone, hesitation, body language if video).

---

### 4. Target Profile (T1/T2/T3 Analysis)

**When**:

- Before first contact with a potential client organization
- Update quarterly or after major company changes

**How to Fill It Out**:

**Header Metadata** (1 minute):

- `stage`: research | outreach | engaged | negotiation | won | lost
- `priority`: tier1 (dream client) | tier2 (solid fit) | tier3 (filler pipeline)

**Executive Summary** (2 minutes):

- One paragraph: Who are they? Why pursue? What's the opportunity size?

**T1: Strategic Context** (10-15 minutes):

- Industry trends affecting them (growth, disruption, regulation)
- Company financials (revenue, growth rate, funding rounds)
- Leadership team analysis (who makes decisions?)
- Competitive landscape (who are they beating? who's beating them?)

**T2: Technical Context** (10-15 minutes):

- Current tech stack (LinkedIn job postings, tech blogs, GitHub)
- Technical debt or legacy systems (pain points)
- Integration requirements (what do they need to connect with?)
- Technical decision makers (who's the CTO? DevOps lead?)

**T3: Operational Context** (10-15 minutes):

- Current workflows you'd impact (sales, marketing, operations)
- Pain points in current process (manual, slow, error-prone)
- Organizational structure (who owns the budget?)
- Change management challenges (resistance to new tools?)

**Synthesis** (5 minutes):

- How do T1/T2/T3 connect?
- What's the compelling narrative? (strategic need + technical fit + operational urgency)
- Where's the leverage point? (budget holder + pain + timing)

**The Killer Question** (3 minutes):

- One question that qualifies or disqualifies this target
- Example: "Are you actively budgeting for AI automation in Q1 2026, or just exploring?"

**Contact Strategy & Approach** (5 minutes):

- Who to contact first (CEO, CTO, VP Sales?)
- Messaging angle (efficiency, revenue, risk mitigation?)
- Outreach sequence (LinkedIn → email → warm intro?)
- Timeline (when to start, when to follow up)

**Intelligence Sources** (Ongoing):

- Where are you getting data? (news, LinkedIn, Crunchbase, mutual contacts)
- [[Wiki-link]] to Market Insights, Research Notes, Stakeholder Profiles

**Pro Tip**: Don't start outreach until T1/T2/T3 are 80% complete. Bad targeting wastes weeks. Good targeting closes deals in days.

---

### 5. Market Insight (Intelligence Asset)

**When**:

- You notice a pattern across 3+ conversations
- You read something that changes your strategy
- A competitor does something interesting

**How to Fill It Out**:

**Header Metadata** (1 minute):

- `insight_type`: trend | competitor | customer-behavior | regulatory | technical
- `confidence`: high (validated by multiple sources) | medium (credible but limited data) | low (hypothesis)

**Executive Summary** (2 minutes):

- One sentence: What's the insight?
- Example: "Enterprise buyers now expect AI tools to integrate with Slack, not email"

**The Insight** (3-5 minutes):

- Detailed explanation of what you discovered
- Why it matters (impact on your strategy)
- Who it affects (which stakeholders, which targets)

**Deep Dive** (10-15 minutes):

- Supporting evidence (quotes, data, articles)
- Counter-evidence (what might disprove this?)
- Nuances or edge cases

**Application to Codex Signum** (5 minutes):

- How does this change your approach?
- What should you do differently?
- What opportunities does this create?

**Stakeholder-Specific Talking Points** (10-15 minutes):

- How to explain this insight to different audiences:
  - **C-Suite**: Business impact, ROI, competitive advantage
  - **Technical Leaders**: Implementation, architecture, integrations
  - **Operations**: Workflow changes, training, adoption

**Examples & Case Studies** (Ongoing):

- Real-world examples where this insight applies
- [[Wiki-link]] to Target Profiles or Stakeholder Profiles

**Strategic Implications** (5 minutes):

- What does this mean for your roadmap?
- Should you pivot? Double down? Avoid something?

**Related Insights** (1 minute):

- [[Wiki-link]] to other Market Insights
- [[Wiki-link]] to Research Notes

**Pro Tip**: Market Insights are force multipliers. One good insight applied to 10 target profiles saves 50 hours of research.

---

### 6. Weekly Review (System Health Check)

**When**: Every Friday afternoon or Monday morning (MANDATORY)

**How to Fill It Out**:

**Week Overview** (2 minutes):

- What was the theme of this week? (focus area)
- Major wins or losses?
- Energy level (high/medium/low)

**Engagement Performance** (5 minutes):

- Count engagement types:
  - C1 (Cold Outreach): X engagements
  - C2 (Qualified Leads): X engagements
  - C3 (Market Intel): X engagements
  - C4 (Internal): X engagements
- Calculate edit distance average (aim for ≤2.0)
- CTA completion rate (% of promises kept)
- Sentiment distribution (positive/neutral/negative %)

**Engagement Breakdown by Type** (10 minutes):

- **C1 Analysis**: Cold outreach effectiveness, reply rates, what's working?
- **C2 Analysis**: Pipeline movement, stalled deals, objections?
- **C3 Analysis**: Intelligence quality, patterns emerging?
- **C4 Analysis**: Internal alignment, team velocity?

**Learning Performance** (5 minutes):

- How many Learning Registry entries this week? (target: 2-3)
- Which learnings did you apply?
- Confidence level changes (hypotheses → validated)

**Target Progress** (5 minutes):

- Active Target Profiles: X
- Stage changes this week (research → outreach → engaged)
- Stalled targets (no movement in 2+ weeks)

**Wins This Week** (3 minutes):

- Deals closed, meetings booked, relationships deepened
- Celebrate small wins (first reply from cold email counts!)

**Challenges & Blockers** (5 minutes):

- What's not working? (be honest)
- Resource constraints? Skill gaps? Market conditions?
- What needs to change?

**Strategic Insights** (5 minutes):

- Patterns across engagements this week
- Hypothesis to test next week
- Market shifts or surprises

**Action Items for Next Week** (5 minutes):

- 3-5 concrete tasks with owners and due dates
- Example: "Test 2-sentence cold email opener (20 emails by Wednesday)"

**Next Week's Focus** (2 minutes):

- Top 3 priorities
- What are you saying "no" to?

**Pro Tip**: If your edit distance average is >3.0 for two consecutive weeks, you're rushing. Slow down. Quality > quantity.

---

### 7. Research Note (Exploratory Workflow)

**When**:

- Investigating a new topic, technology, or market
- Before creating a Market Insight (lower confidence)

**How to Fill It Out**:

**Header Metadata** (30 seconds):

- `research_status`: active | completed | abandoned
- `confidence_level`: high | medium | low

**Research Question** (1 minute):

- What are you trying to learn?
- Example: "Do mid-market SaaS companies prefer build vs buy for AI tools?"

**Context & Motivation** (2 minutes):

- Why are you researching this?
- What decision depends on the answer?

**Research Plan** (5 minutes):

- How will you investigate? (desk research, interviews, experiments)
- Data sources (articles, books, experts)
- Timeline (when will you conclude?)

**Findings** (Ongoing):

- Raw notes, quotes, data
- Don't organize yet—just capture

**Analysis** (After research complete):

- Patterns, trends, contradictions
- What's surprising? What's confirmed?

**Conclusions** (Final):

- Answer to research question
- Confidence level (did you validate this?)
- Update `research_status` to "completed"

**Recommendations & Next Steps** (Final):

- What should you do with this knowledge?
- Create a Market Insight?
- Update Target Profiles?

**Related Research** (Ongoing):

- [[Wiki-link]] to other Research Notes
- [[Wiki-link]] to Market Insights

**Pro Tip**: Research Notes are messy by design. Don't polish them—just dump knowledge. Once you have 3+ sources confirming something, promote it to a Market Insight.

---

### 8. Event Debrief (Conference/Networking Capture)

**When**: After conferences, trade shows, networking events, or workshops

**How to Fill It Out**:

**Event Information** (2 minutes):

- Event name, date, location
- Why you attended (goals)

**C2 Contacts: Qualified Leads** (10-15 minutes):

- List each potential client contact
- Name, title, company
- Pain points discussed
- Follow-up actions
- Create individual Stakeholder Profiles + Engagement Notes for top 3

**C3 Contacts: Market Intelligence** (5-10 minutes):

- Industry experts, analysts, peers
- Key insights or trends they mentioned
- [[Wiki-link]] to Market Insights if relevant

**Performance Metrics** (3 minutes):

- Total contacts made
- C2 vs C3 ratio
- Business cards collected
- LinkedIn connections added

**Post-Event Processing Plan** (5 minutes):

- Who to follow up with first?
- Deadlines for outreach (within 48 hours = warm, 7+ days = cold)
- Content to send (articles, case studies, proposals)

**Final Assessment** (5 minutes):

- ROI: Was this event worth attending?
- Lessons learned (what worked, what didn't)
- Attend again next year?

**Pro Tip**: Process Event Debriefs within 24 hours or you'll lose context. Create Stakeholder Profiles for top 3 contacts immediately.

---

## Template Interconnections: The Knowledge Graph

**How Templates Link Together**:

```
Engagement Note (daily)
├─ Creates → Stakeholder Profile (if new person)
├─ Creates → Learning Registry (if insight gained)
├─ Updates → Target Profile (if relevant to prospect)
└─ Feeds → Weekly Review (aggregated metrics)

Target Profile (strategic)
├─ References → Stakeholder Profiles (who to contact)
├─ Informed by → Market Insights (industry trends)
└─ Validated by → Engagement Notes (real conversations)

Market Insight (intelligence)
├─ Emerges from → 3+ Engagement Notes (pattern recognition)
├─ Evolves from → Research Notes (promoted when validated)
└─ Applied to → Target Profiles (strategic context)

Learning Registry (knowledge)
├─ Sourced from → Engagement Notes (field experience)
├─ Applied to → Engagement Notes (testing hypotheses)
└─ Validated by → Weekly Review (tracking results)

Weekly Review (system health)
├─ Aggregates → All Engagement Notes (performance data)
├─ Tracks → Learning Registry (knowledge growth)
└─ Monitors → Target Profiles (pipeline health)
```

**The Flywheel Effect**:

1. **Engagement Notes** capture raw conversations → create **Learning Registry** entries
2. **Learning Registry** builds knowledge → improves future **Engagement Notes**
3. **Engagement Notes** reveal patterns → become **Market Insights**
4. **Market Insights** inform strategy → update **Target Profiles**
5. **Target Profiles** guide outreach → generate better **Engagement Notes**
6. **Weekly Review** tracks it all → identifies improvement areas → cycle repeats

**Pro Tip**: If a note doesn't have any [[wiki-links]], it's an orphan. Orphans die. Link everything.

---

## Understanding Cell Markers (Phase 2)

**What Are They?**

HTML comments embedded in templates that categorize sections for future AI/RAG systems. You won't see them in Obsidian (they're invisible), but they're there.

**Example**:

```markdown
<!-- CELL: executive-summary | type: summary | rag-priority: high -->

## Executive Summary

Your content here...

<!-- END CELL: executive-summary -->
```

**Why Do They Matter?**

In Q1 2026, when you implement LangChain/LlamaIndex RAG, these markers will:

- **Prioritize retrieval**: High-priority cells fetched first
- **Type-specific queries**: "Show me all training-data cells" or "Find action-items"
- **Context windows**: Only load relevant sections, not entire files

**Cell Types** (9 total):

1. **training-data**: Examples of good work (your past wins, templates)
2. **inference-prompt**: Questions, frameworks, or decision criteria
3. **validation-metrics**: Performance data (edit distance, CTA completion)
4. **analysis**: Your strategic thinking (synthesis, implications)
5. **context**: Background info (event details, company data)
6. **raw-data**: Unprocessed notes (verbatim quotes, brain dumps)
7. **relationships**: Connections between entities (people, companies)
8. **action-items**: Tasks, follow-ups, commitments
9. **summary**: High-level overviews (executive summaries, conclusions)

**RAG Priority Levels**:

- **high**: Primary retrieval targets (summaries, analysis, training data)
- **medium**: Supporting context (metrics, action items)
- **low**: Reference only (relationships, metadata)

**What You Need to Do**: Nothing. They're already in your templates. Just fill out the sections normally.

**Future Benefit**: When you ask your AI system "What's my average edit distance?", it will query only `validation-metrics` cells. When you ask "Show me successful cold outreach examples", it will fetch `training-data` cells. Faster, more accurate, less token waste.

---

## Metrics That Matter

### 1. Edit Distance (Quality Signal)

**What It Measures**: How much you had to rewrite your "What Happened" section when filling out "What It Means"

**Why It Matters**:

- Low edit distance = high capture quality = better decision-making data
- High edit distance = rushed notes = lost context = poor follow-up

**Target Scores**:

- **0-1**: Excellent (crystal clear capture)
- **2**: Good (minimal cleanup)
- **3**: Average (aim to improve)
- **4-5**: Poor (slow down, capture better)

**How to Improve**:

- Spend 30 extra seconds post-call writing clearer bullets
- Use voice recording if typing is slow
- Capture direct quotes (less interpretation needed)

**Weekly Target**: Average edit distance ≤2.0

---

### 2. CTA Completion Rate (Accountability)

**What It Measures**: Percentage of promises you kept

**Why It Matters**:

- High completion rate = trustworthy = more deals
- Low completion rate = flaky = lost credibility

**Target Score**: ≥90% within promised timeframe

**How to Track**:

- Mark CTAs with due dates in Engagement Notes
- Check Weekly Review: Count total CTAs vs completed CTAs
- Calculate: (Completed / Total) × 100

**How to Improve**:

- Don't over-promise (under-commit, over-deliver)
- Set calendar reminders for CTAs
- Review CTAs daily (morning standup with yourself)

---

### 3. Sentiment Distribution (Pipeline Health)

**What It Measures**: Ratio of positive/neutral/negative interactions

**Why It Matters**:

- Too many negatives = messaging problem or bad targeting
- Too many neutrals = not advancing deals
- Healthy mix: 60% positive, 30% neutral, 10% negative

**How to Track**:

- Tag sentiment in every Engagement Note
- Weekly Review: Count sentiment tags
- Calculate percentages

**How to Improve**:

- If >20% negative: Review messaging, qualify better upfront
- If >50% neutral: Ask better questions, create urgency

---

### 4. Contact Type Distribution (Pipeline Balance)

**What It Measures**: Ratio of C1/C2/C3/C4 engagements

**Why It Matters**:

- Too many C1s = not converting to qualified leads
- Too few C2s = pipeline is dry
- Healthy mix: 30% C1, 40% C2, 20% C3, 10% C4

**How to Track**:

- Tag every Engagement Note with C1/C2/C3/C4
- Weekly Review: Count each type
- Calculate percentages

**How to Improve**:

- If C1 > 50%: Focus on converting to C2 (qualify faster)
- If C2 < 30%: Nurture existing leads, improve follow-up
- If C3 < 10%: Not enough market intelligence gathering

---

### 5. Learning Velocity (Knowledge Growth)

**What It Measures**: Learning Registry entries per week

**Why It Matters**:

- More learnings = faster skill development = better results
- Zero learnings = stagnant = falling behind competitors

**Target Score**: 2-3 Learning Registry entries per week

**How to Track**:

- Count Learning Registry entries with `date` in current week
- Weekly Review: Track trend over time

**How to Improve**:

- After every call, ask: "What did I learn?"
- Read 1 article/book chapter per day, extract 1 insight
- Test hypotheses, document results

---

## Best Practices: Daily, Weekly, Monthly Habits

### Daily Habits (15-20 minutes)

**Morning Routine** (5 minutes):

- Review yesterday's CTAs (any follow-ups due today?)
- Check calendar: Who are you meeting today?
- Pre-read their Stakeholder Profile (if exists)

**Post-Interaction Routine** (10 minutes per call):

- Immediately after call: Create Engagement Note (raw capture)
- Within 2 hours: Complete "What It Means" section
- Before end of day: Update related Stakeholder Profile

**Evening Routine** (5 minutes):

- Review today's Engagement Notes (anything missed?)
- Set CTAs for tomorrow
- Quick win journal (one sentence: what went well?)

---

### Weekly Habits (30-45 minutes)

**Friday Afternoon or Monday Morning**:

1. Create Weekly Review (mandatory, non-negotiable)
2. Calculate metrics: edit distance, CTA completion, sentiment
3. Identify patterns: What's working? What's not?
4. Set 3 priorities for next week
5. Archive completed Target Profiles (move to archive folder)
6. Clean up orphaned notes (add [[wiki-links]])

---

### Monthly Habits (60-90 minutes)

**Last Week of Month**:

1. Review last 4 Weekly Reviews (trend analysis)
2. Update all active Target Profiles (refresh T1/T2/T3 data)
3. Promote recurring themes to Market Insights
4. Deep clean: Delete draft notes, organize folders
5. Celebrate wins: Review progress since last month
6. Plan next month: What's the strategic focus?

---

## Advanced Workflows

### Workflow 1: Cold Outreach Campaign

**Goal**: Send 50 cold emails, track results, optimize

**Steps**:

1. Research 50 targets → Create 50 Target Profiles (T1/T2/T3)
2. Extract "Killer Question" from each → Craft personalized openers
3. Send emails → Create Engagement Notes (type: C1, CTA: "Get reply by Friday")
4. Track sentiment and edit distance
5. Weekly Review: Calculate reply rate, analyze what worked
6. Create Learning Registry entry: "Cold email insights"
7. Create Market Insight if pattern emerges across 10+ targets

---

### Workflow 2: Deal Acceleration

**Goal**: Move stalled C2 lead to closed/won

**Steps**:

1. Read all Engagement Notes with this stakeholder (chronological)
2. Update Target Profile (T1/T2/T3): What's changed since last update?
3. Review Stakeholder Profile: Key language, pain points, objections
4. Check related Market Insights: Any new intelligence relevant to them?
5. Craft hypothesis: "They're stalled because [reason]"
6. Test hypothesis: Schedule call, ask direct question
7. Create Engagement Note: Document result, update edit distance
8. Update CTA: Next concrete step with deadline

---

### Workflow 3: Knowledge Mining

**Goal**: Extract maximum intelligence from your notes

**Steps**:

1. Search all Engagement Notes for keyword (e.g., "integration")
2. Copy relevant quotes to new Research Note
3. Analyze patterns: What are people saying about integrations?
4. Validate with 3+ sources (articles, expert interviews)
5. Promote Research Note → Market Insight
6. Apply Market Insight → Update all relevant Target Profiles
7. Test in next 5 Engagement Notes: Does this insight resonate?
8. Create Learning Registry entry: "Integration messaging framework"

---

## Troubleshooting: Common Issues & Fixes

### Issue 1: "I have 50 Engagement Notes but no insights"

**Diagnosis**: You're capturing, not synthesizing

**Fix**:

1. Force yourself to complete Weekly Review (mandatory)
2. In Weekly Review, ask: "What pattern do I see across all C2 calls this week?"
3. If pattern emerges 3+ times → Create Market Insight
4. If no patterns → Your capture quality is too low (check edit distance)

---

### Issue 2: "My edit distance is always 4-5"

**Diagnosis**: You're rushing the capture phase

**Fix**:

1. Immediately post-call: Spend 5 minutes writing raw bullets (don't multitask)
2. Use direct quotes (copy/paste from chat transcript if virtual call)
3. Record tone/sentiment while fresh ("They hesitated when I mentioned price")
4. Don't worry about grammar—capture context, not polish
5. Test: For next 5 calls, spend extra 2 minutes on capture. Track edit distance improvement.

---

### Issue 3: "I don't know which template to use"

**Diagnosis**: Unclear decision criteria

**Fix**:

1. Bookmark the Template Decision Matrix (above)
2. Default rule: If you talked to a human → Engagement Note (always)
3. Second rule: If you learned something → Learning Registry (also always)
4. Third rule: If new person + potential client → Stakeholder Profile + Target Profile
5. When in doubt: Start with Engagement Note, add [[wiki-links]] to other templates later

---

### Issue 4: "My Target Profiles are out of date"

**Diagnosis**: No refresh cadence

**Fix**:

1. Set calendar reminder: "Update Target Profiles" (every Friday)
2. In Weekly Review: List all active Target Profiles, check last update date
3. If >30 days old → Spend 10 minutes refreshing T1/T2/T3 (quick Google search)
4. If >90 days old and no engagement → Move to archive (they're not active)

---

### Issue 5: "I created 20 notes but they're not connected"

**Diagnosis**: Missing [[wiki-links]]

**Fix**:

1. Open each note, search for person names → Add [[Stakeholder Profile]] wiki-link
2. Search for company names → Add [[Target Profile]] wiki-link
3. Search for concepts → Add [[Market Insight]] or [[Learning Registry]] wiki-link
4. Rule: Every note should have at least 2 wiki-links
5. Use Obsidian Graph View: Orphaned notes have no connections (delete or link them)

---

### Issue 6: "My metrics aren't improving"

**Diagnosis**: Not applying Learning Registry insights

**Fix**:

1. Review last 10 Learning Registry entries: Which ones are still "hypothesis"?
2. Pick top 3 with highest potential impact
3. Force yourself to test each one in next 5 Engagement Notes
4. Document results in Learning Registry (update confidence level)
5. If "validated" → Apply to all future engagements
6. If "rejected" → Update Learning Registry, move on

---

### Issue 7: "I don't have time for Weekly Review"

**Diagnosis**: Misunderstanding ROI of reflection

**Fix**:

1. Weekly Review is not optional—it's the highest-leverage 30 minutes of your week
2. Without Weekly Review, you're flying blind (no metrics, no patterns, no improvement)
3. Block calendar: Friday 4pm or Monday 9am (non-negotiable)
4. If truly no time: Do "Express Weekly Review" (10 minutes):
   - Count C1/C2/C3/C4 engagements
   - Calculate edit distance average
   - Write 3 bullets: Wins, Challenges, Next Week Focus
5. Better to do 10-minute Weekly Review than skip entirely

---

## Implementation Roadmap: First 4 Weeks

### Week 1: Foundation (Engagement Notes Only)

**Goal**: Build daily capture habit

**Tasks**:

- After every call/meeting: Create Engagement Note (aim for 5 this week)
- Focus on "What Happened" section only (don't worry about quality yet)
- Track edit distance (baseline measurement)
- End of week: Count total Engagement Notes created (celebrate if ≥5)

**Success Criteria**: 5+ Engagement Notes created, edit distance measured

---

### Week 2: Synthesis (Add "What It Means")

**Goal**: Improve analysis quality

**Tasks**:

- Continue Engagement Notes (aim for 7 this week)
- Now complete "What It Means" section within 2 hours of call
- Track edit distance: Is it improving from Week 1?
- Create first Weekly Review (Friday or Monday)

**Success Criteria**: 7+ Engagement Notes, edit distance ≤3.0, Weekly Review completed

---

### Week 3: Knowledge Building (Add Learning Registry)

**Goal**: Start capturing insights

**Tasks**:

- Continue Engagement Notes (aim for 8 this week)
- After each call, ask: "What did I learn?" → Create Learning Registry entry (aim for 3 this week)
- Complete second Weekly Review
- Compare Week 2 vs Week 3 metrics: Improving?

**Success Criteria**: 8+ Engagement Notes, 3+ Learning Registry entries, Weekly Review shows improvement

---

### Week 4: Relationship Mapping (Add Stakeholder Profiles)

**Goal**: Build relationship memory

**Tasks**:

- Continue Engagement Notes (aim for 10 this week)
- Create Stakeholder Profiles for 5 key contacts (prioritize C2 qualified leads)
- Add [[wiki-links]] connecting Engagement Notes ↔ Stakeholder Profiles
- Complete third Weekly Review
- Month-end: Review all 4 weeks, identify biggest win and biggest lesson

**Success Criteria**: 10+ Engagement Notes, 5 Stakeholder Profiles, visible improvement in edit distance or CTA completion

---

### Month 2+: Advanced Usage

**Week 5-8**: Add Target Profiles (strategic prospecting)  
**Week 9-12**: Add Market Insights (intelligence layer)  
**Week 13-16**: Add Research Notes (exploratory thinking)  
**Month 5+**: System runs on autopilot, focus on optimization

---

## Success Criteria: How to Know It's Working

### After 1 Month

- ✅ 30+ Engagement Notes created
- ✅ 4 Weekly Reviews completed (one per week, non-negotiable)
- ✅ Edit distance trending downward (from baseline to <3.0)
- ✅ 5+ Stakeholder Profiles created
- ✅ 5+ Learning Registry entries created

### After 3 Months

- ✅ 100+ Engagement Notes created
- ✅ Edit distance consistently ≤2.0
- ✅ CTA completion rate ≥90%
- ✅ 15+ Stakeholder Profiles actively maintained
- ✅ 3+ Target Profiles with complete T1/T2/T3 analysis
- ✅ 2+ Market Insights created from patterns

### After 6 Months

- ✅ 250+ Engagement Notes created
- ✅ Knowledge graph visible in Obsidian (50+ interconnected notes)
- ✅ 5+ Market Insights informing strategy
- ✅ Learning Registry driving measurable improvement (validated insights)
- ✅ Weekly Review reveals clear trends (pipeline health, skill growth)
- ✅ System feels automatic (daily capture is habitual, not forced)

### Leading Indicators (Early Signals It's Working)

- Faster follow-up: You remember context instantly (no re-reading emails)
- Better questions: You ask more strategic questions in calls (informed by past Engagement Notes)
- Closed deals: Prospects say "You really get us" (key language capture working)
- Pattern recognition: You spot market trends before competitors (Market Insights compounding)

---

## Pro Tips from the Trenches

### Pro Tip 1: "Capture Fast, Analyze Later"

Don't combine capture and analysis in the same session. Your brain can't do both well simultaneously. Capture raw notes immediately (5 minutes), then analyze later (10 minutes). Edit distance will plummet.

---

### Pro Tip 2: "The 2-Hour Rule"

If you don't complete "What It Means" within 2 hours of a call, you've lost 50% of the context. Memory decay is real. Protect those 2 hours.

---

### Pro Tip 3: "Quote Everything"

Direct quotes are gold. When a prospect says "We're drowning in manual data entry," that exact phrase becomes your email subject line. Paraphrasing loses power.

---

### Pro Tip 4: "One Note, One Insight"

Don't cram 10 learnings into one Learning Registry entry. Separate notes = searchable knowledge. "Cold email insights" is one note. "Demo call frameworks" is another.

---

### Pro Tip 5: "Wiki-Link While Fresh"

Add [[wiki-links]] immediately after creating a note. If you wait until "cleanup day," you'll forget the connections. Link = memory.

---

### Pro Tip 6: "Weekly Review is Sacred"

Miss a workout? Fine. Miss a client call? Reschedule. Miss a Weekly Review? System collapses. This is the keystone habit. Protect it.

---

### Pro Tip 7: "Archive Aggressively"

If a Target Profile hasn't been touched in 90 days, move it to archive. Clutter kills clarity. Your active notes should fit on one screen.

---

### Pro Tip 8: "Measure What Matters"

Don't track 20 metrics. Focus on 3: edit distance (quality), CTA completion (accountability), sentiment distribution (pipeline health). Everything else is noise.

---

### Pro Tip 9: "Teach the System"

When you test a Learning Registry hypothesis, document the result immediately. "Tested 2-sentence cold emails: Reply rate increased from 8% to 12% (n=40)." This is training data for future you (and future AI).

---

### Pro Tip 10: "Celebrate Small Wins"

Got your edit distance from 4 to 2? Celebrate. Kept 100% of CTAs this week? Celebrate. Closed a deal using key language from a Stakeholder Profile? Celebrate. Positive reinforcement builds habits.

---

## Final Thoughts

This system is not about perfection. It's about **progressive improvement**.

Start with Engagement Notes. Add one template per week. By Month 3, you'll have a knowledge base that compounds over time. By Month 6, you'll close deals faster, learn faster, and operate with more strategic clarity than 95% of your competitors.

The secret? **Consistency beats intensity.** 10 minutes daily > 2 hours monthly.

Now go create your first Engagement Note. The system starts today.

---

**Questions? Stuck? Confused?**

Re-read the relevant Template Deep Dive section. Check the Troubleshooting section. Review the Template Decision Matrix. If still stuck, start with the simplest template (Engagement Note) and add complexity gradually.

You've got this. 🚀
