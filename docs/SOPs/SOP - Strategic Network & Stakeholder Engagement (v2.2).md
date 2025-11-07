# SOP - Strategic Network & Stakeholder Engagement (v2.2)
**

Owner: Principal
Date: 31-Oct-2025

## 1.0 Objective & Strategic Link

Objective: To systematically gather market intelligence, validate the core value proposition ("holistic strategist"), and secure warm introductions to operational leaders. This SOP governs all initial network engagement before a final product offering is defined.

Primary Goal: Intelligence gathering and validation, not direct sales.

Strategic Link: This SOP is the primary execution layer for the GTM strategy. It is the action step that follows the Market Intel SOP.

- Intel SOP: Generates the Target Profile.
    
- Engagement SOP (This Doc): Uses that intel to execute the engagement.
    
- Codex: The output of the engagement is committed to the Codex (Firestore) via the SOP Assistant Script, directly serving the P1 Proprietary Data Mandate.
    

## 2.0 Scope

This SOP applies to all initial outreach and inbound inquiries from the Principal's professional network. It is suspended for a specific contact only when that contact is qualified as a high-intent "Economic Buyer" (C4), at which point a formal Sales SOP takes over.

## 3.0 Stakeholder Triage & Categorization

Before any outreach, every new contact (inbound or outbound) must be triaged and assigned one of the following categories. This categorization defines the goal, focus, and desired outcome of the meeting.

| Category                | Description                                                                                                     | Primary Goal                                                                                                                               | Focus (Your Value Prop Anchor)                                                                                                                 | Key Risk to Manage                                                 | Desired Outcome (Of the Engagement)                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| C1: Strategic Navigator | High-status thinkers, academics, or senior leaders (e.g., Monash HBR Prof). They operate at a 30,000-foot view. | Red Team the Premise. Gain high-level market validation and, potentially, a high-status advocate.                                          | Testing the 'Big Idea' (The Provocation). Your value prop to them is an interesting, high-level strategic challenge.                           | Wasting their time with a generic "get to know you" chat.          | A "red-teamed" and validated strategic premise. OR a high-status advocate who may make future C-level intros. |
| C2: Peer Collaborator   | People who do part of what you do (e.g., UoW AI Consultant, Infosys Devs). Potential partners or competitors.   | Find the "Gaps." Identify opportunities for a Channel (they send you clients) or Partner (you use them for delivery) relationship.         | Partnership & Gaps (What do they hate doing?). Your value prop to them is a potential partnership where you take on the "messy" work.          | Endless, unproductive "brainstorming sessions" and IP leakage.     | A "Yes/No" on a partnership. A defined channel (referrals) or delivery (sub-contract) model.                  |
| C3: Market Intel        | People on the ground with deep context but no buying power (e.g., UoW Engagement Mgr, university contacts).     | Hear the "Messy Problems." Gather the specific language and pain points of the target market. This is your primary source for product dev. | Pure Problem Discovery (Listening & Empathy). Your value prop to them is that you are genuinely listening and seeking to understand, not sell. | Treating them like a "Buyer" and triggering their "sales" defense. | A list of 1-3 "messy problems" and the exact language clients use to describe them. A warm intro to a C4.     |
| C4: Economic Buyer      | Individuals with the authority and budget to purchase your service (e.g., COO, CFO, Registrar).                 | Move to Sales SOP. (This SOP no longer applies).                                                                                           | Matching Pain to Service (Qualification). Your value prop is "I can solve your specific, high-cost pain."                                      | Pitching too early with an un-validated product.                   | A signed SOW for a $15k Diagnostic. (Handled by Sales SOP).                                                   |

## 4.0 Core Engagement Stack (The Tools)

|Tool|Purpose|90-Day Mandate|
|---|---|---|
|Obsidian|Core CRM & Knowledge Base. Your "single source of truth." All Target Profiles, call notes, and contact histories are logged here.|MANDATORY. All call notes must be processed in Obsidian to fuel the Codex.|
|LinkedIn Sales Navigator|Targeting & Warm Path Finding. Used to identify C4 targets and map your "six degrees" C1/C2/C3 paths to them.|HIGHLY RECOMMENDED. This is your primary "P1 - Day Job" tool.|
|Email (Google Workspace)|Formal Outreach. The primary medium for "The Ask" once a contact has agreed to an intro.|MANDATORY.|
|Calendly (or similar)|Frictionless Scheduling. The link is only provided after a contact has agreed to a call.|HIGHLY RECOMMENDED. Reduces admin overhead.|
|SOP Assistant Script|Codex Commit Node. Your (P2) script that parses Obsidian notes and updates the Codex (Firestore).|CRITICAL (P2 BUILD). This automates your "Back Stage."|

## 5.0 Engagement Procedure

### Phase 1: Contact Triage

1. Log the new contact in your Obsidian vault, linked to a Target Profile or as a new contact.
    
2. Assign their category (C1-C3) based on the matrix in Section 3.0.
    
3. Update status in Obsidian/tracker to "Triaged."
    

### Phase 2: Engagement & Scripting

1. Select Script: Choose the appropriate script framework based on the contact's category.
    
2. Execute Outreach: Send the message via LinkedIn or Email.
    
3. Update Obsidian: Log the outreach and set status to "Contacted - Awaiting Reply."
    

Outreach Scripting Table | Category | Script Framework | Example "Ask" | | :--- | :--- | :--- | | C1 (Navigator) | The "Strategic Provocation" | "I'm challenging [big-corp premise] with [my new premise]. From your seat at [HBR/Monash], what part of my hypothesis is wrong?" | | C2 (Collaborator) | The "Partner Gap" | "I'm a tool-agnostic strategist. What are the messy strategy/people/process problems that clients bring you that you don't want to solve?" | | C3 (Market Intel) | The "Honest Ask" | "This is not a sales call. I'm in my initial validation phase and I'm hoping to borrow your brain to understand the real operational challenges... In exchange for 10 mins of your insight on [Messy Problem], I can share my data on [X]..." |

### Phase 3: Conversation Execution

1. Frame the Call: Begin every C1-C3 call by re-stating the non-sales frame.
    

- Script: "As promised, this isn't a sales call. My only goal is to [state goal from Sec 3.0, e.g., 'get your advice', 'find the gaps', 'hear your perspective']."
    

2. Execute the Game Plan: Follow the plan for the contact's category.
    
3. The "Specific Ask": At the end of the call, make one specific request based on the conversation, aiming for your Desired Outcome.
    

- Script: "This has been incredibly helpful. That problem you mentioned about [re-state their messy problem] is exactly what I'm built for. Who is the one person in your network who is most focused on solving that right now?"
    

Conversation Game Plan Table | Category | Conversation Game Plan | Desired Outcome (Re-stated) | | :--- | :--- | :--- | | C1 (Navigator) | Present your 5-min "provocation" and then stop talking. Let them "red team" it. Listen for their validation, objections, and who else is thinking about this. | A "red-teamed" premise or a new high-status advocate. | | C2 (Collaborator) | Listen for what they hate doing (e.g., stakeholder management, process mapping, change mgt). This is your "wedge." Explore how your services are complementary, not competitive. | A clear "Yes/No" on a partnership or channel/referral model. | | C3 (Market Intel) | Ask discovery questions: "What's the #1 operational fire...?" "What's the 'messy' project that...?" "What's the one thing you'd fix if you had a magic wand?" Listen for their exact language. | A list of "messy problems" and the exact language clients use. A warm intro to a C4. |

### Phase 4: Post-Call Processing (The Codex Commit Node)

This is the most critical P1/P2 integration step and must be done within 24 hours of any C1, C2, or C3 call.

1. Immediate Follow-up: Send a thank-you note within 1 hour, referencing a key insight they shared.
    
2. Transcribe & Synthesize (Obsidian):
    

- Open the contact's note in Obsidian.
    
- Transcribe all raw notes.
    
- Create a "Synthesis" section with the mandatory data tags. This is the data your P2 script will parse.
    

3. Execute (The "P2 Reward"):
    

- Run your SOP Assistant Script.
    
- Function: The script ingests this new Obsidian note, parses the tags, and automatically updates your Codex (Firestore) Target Profile and Contact Graph.
    
- Outcome: Your "Back Stage" (Codex) just got "smarter" from your "Front Stage" (P1) work.
    

Codex Commit - Obsidian Data Tags | Tag | Purpose & Example | | :--- | :--- | | #key_language: | Captures the contact's exact phrasing of their pain. e.g., ["our student-flow is a nightmare", "we are data-rich but insight-poor"] | | #messy_problem: | The validated operational gap or pain point. e.g., ["T1 platform not mapping to payroll", "manual data entry for compliance"] | | #new_contact: | Any new person mentioned for a potential introduction. e.g., ["Jane Doe, Head of Admissions", "Bob Smith, Infosys Project Lead"] | | #action_item: | The specific next step you are responsible for. e.g., ["Send follow-up email by EOW", "Send Calendly link to Jane Doe"] |

## 6.0 Key Performance Indicators (KPIs)

- Leading KPI: # of C1-C3 Conversations Held (Target: 10-15)
    
- Success KPI: # of Warm Introductions Received (This is the #1 signal of success)
    
- Strategic KPI: # of "Messy Problem" Patterns Identified (This becomes your $15k diagnostic)
    

**