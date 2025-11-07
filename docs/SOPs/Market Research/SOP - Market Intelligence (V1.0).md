**
## Codex Signum - P1 Data Acquisition

### 1.0 Objective & Strategic Link

Objective: To execute the "business architect's" analysis by systematically gathering and synthesizing proprietary, non-public data (T2/T3) on target segments, supplementing high-level strategic data (T1).

Strategic Link: This SOP is the primary data-acquisition "node" for the Codex and directly serves P1. The Proprietary Data Mandate. The output of this SOP is the briefing packet used to execute the SOP - Strategic Network Engagement (your "day job").

Architectural Principle: This manual SOP (V1.0) is the logical specification for a future, automated Praxis Forge intelligence agent. Its purpose is not collection; it is synthesis.

### 2.0 Process Overview (The "Agent" Logic)

This process targets one entity (e.g., "University of Wollongong") from the gtm-strategy-v1.md at a time.

- Phase 1: Ingestion (T1): Get the "C-Suite Language" (What they say).
    
- Phase 2: Ingestion (T2): Get the "Technical Reality" (What they use).
    
- Phase 3: Ingestion (T3): Get the "Un-spun Mess" (What they fear).
    
- Phase 4: Synthesis (The "Algorithm"): Synthesize T1+T2+T3 into the "Killer Question."
    
- Phase 5: Commit (The "Codex"): Load the synthesized Target Profile into the Codex.
    

### 3.0 Process Nodes (V1.0 Manual Execution)

#### Phase 1: Ingest Strategic Language (T1 Data)

This node acquires the publicly stated strategy of the target.

|Node|Source|"Trick" (Manual Query)|Output (Data to Capture)|
|---|---|---|---|
|1.1: Strategic Plan|Target's Website|"University of Wollongong strategic plan 2025"|strategic_priorities: [Array] (e.g., "student experience," "operational excellence")|
|1.2: Financials|Target's Website / Google|"BlueScope Steel annual report 2024"|financial_health: (String) (e.g., "cost-cutting focus," "investing heavily in tech")|
|1.3: Investor Pitch|Target's "Investor" Page|"NSW Ports 'Investor Day' Presentation 2024"|c-suite_language: [Array] (e.g., "optimizing last-mile," "digitizing supply chain")|

#### Phase 2: Ingest Technical Reality (T2 Data)

This node acquires the ground-truth tech stack and gaps.

|Node|Source|"Trick" (Manual Query)|Output (Data to Capture)|
|---|---|---|---|
|2.1: Job Ads|Seek / LinkedIn / Target's Site|"University of Wollongong jobs 'TechnologyOne'" "Logistics jobs Port Kembla 'CargoWise'"|known_tech_stack: [Array] (e.g., "TechnologyOne," "Workday," "SAP," "Cerner")|
|2.2: Vendor Brag|Google|"TechnologyOne" "UoW" case study" "Cerner" "ISLHD" case study"|existing_vendors: [Array] post_implementation_gap: (Hypothesis)|

#### Phase 3: Ingest "Un-spun" Problems (T3 Data)

This node acquires the validated, high-pain "messy problems".

|Node|Source|"Trick" (Manual Query)|Output (Data to Capture)|
|---|---|---|---|
|3.1: Regulator/Union|Google / NTEU / TWU Sites|"NTEU" "University of Wollongong" "wage theft" "TWU" "Port Kembla" "queuing"|unspun_problem: (String) (e.g., "Payroll/workload system is broken," "Vendor booking system is inefficient")|
|3.2: Conference Agenda|Google|"Tertiary Education Management Conference 2025 agenda"|validated_market_pain: [Array] (e.g., "TEQSA compliance," "student retention data models")|

### 4.0 Phase 4: Synthesis (The "Algorithm")

This is the most critical node. It synthesizes all ingested data into an actionable briefing.

Action: Review all T1, T2, and T3 data. Find the conflict or gap between them. This gap is the Initium diagnostic.

Synthesis Algorithm (Mental Model):

1. Read T1: "The COO's strategic plan (1.1) says they are focused on 'Student Experience'."
    
2. Read T2: "But their job ads (2.1) show they are desperately trying to hire 'TechnologyOne' experts."
    
3. Read T3: "And the union (3.1) is publicly complaining about 'workload allocation errors'."
    
4. Synthesize: The "Student Experience" (T1) initiative is failing because the "TechnologyOne" (T2) platform is not correctly mapping "Workload Allocation" (T3).
    
5. Result: This is the "messy problem" for your $15k Initium.
    

Output: The Killer Question (Strategic Pitch Angle)

### 5.0 Phase 5: Commit (The "Codex")

Action: Create a new entry in your Obsidian vault (or Codex Firestore collection) using this template. This is the Target Profile.

Template:

## Target Profile: [University of Wollongong]  
**Segment:** [HEI]  
**GTM Plan:** [gtm-strategy-v1.md]  
**Date:** [30-Oct-2025]  
  
---  
### T1: Strategic Language  
- **Priorities:** ["Improve student experience," "Operational excellence," "Research funding"]  
- **Financials:** ["Stable, but under margin pressure from international student gap"]  
- **C-Suite Language:** ["Digitizing the student journey," "Simplifying our core processes"]  
  
---  
### T2: Technical Reality  
- **Known Stack:** ["TechnologyOne (Finance, HR, Student Mgmt)," "Workday (Finance? - check)," "Salesforce (CRM?)"]  
- **Vendor Gaps:** ["Recently completed a major TechnologyOne Student Mgmt implementation (per 2023 case study)."]  
  
---  
### T3: "Un-spun" Messy Problems  
- **Union/Regulator:** ["NTEU reports on 'systemic workload allocation errors' and 'payroll discrepancies' post-T1 implementation."]  
- **Market Pain:** ["Entire HEI sector is focused on 'TEQSA compliance automation' and 'student retention analytics' (per conference agenda)."]  
  
---  
### SYNTHESIS (The `$15k Initium` Pitch)  
  
**Hypothesized "Messy Problem":**  
The new TechnologyOne platform (T2) has broken the old workload-allocation processes (T3), which is creating payroll errors (T3) and undermining the "Student Experience" strategic goal (T1). The internal team is too busy with "keep-the-lights-on" to architect a solution.  
  
**The "Killer Question" (for the C3/C4 call):**  
*"I've been tracking the HEI sector's response to the new TEQSA standards. I saw your strategic plan is heavily focused on 'student experience,' but I also noticed the NTEU reports on workload allocation issues since the new T1 platform went live. How is your team handling the data-flow between the new T1 system and your faculty's workload-mapping processes?"*  
  


**