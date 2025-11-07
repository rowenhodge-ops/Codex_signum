### **Node: `path-B1-level-3`**

**(Context: Ethical risk. The 'Deakin failure' insight.)**

Drawing on the risk classification frameworks, regulatory standards (such as the EU AI Act and the US Blueprint for an AI Bill of Rights), and risk assessment templates provided in the sources, the following are the primary categories of "high-stakes decisions" where AI should not be used without a **human-in-the-loop (HITL)** or substantial human oversight:

The principle of Human Oversight or Human Alternatives is repeatedly mandated for all High-Risk AI systems. For these high-stakes decisions, the final decision-making authority must reside with a qualified human operator who can **validate or override AI outputs**.

High-Stakes Decisions Requiring Human-in-the-Loop Oversight

1. Education and Academic Decisions (University Context)

|   |   |   |   |
|---|---|---|---|
|Decision Area|Specific Context Requiring HITL|Risk Classification|Source(s)|
|**Admissions and Grading**|Systems involved in **high-stakes decisions like admissions or grading**. This includes scoring or ranking applicants, or determining final student academic outcomes.|High Risk / High-Risk (EU AI Act)||
|**Assessment/Grading**|If an AI system is used to **automatically grade student essays** or papers, human intervention is crucial to challenge potentially biased algorithms or inadequate training data. Relying heavily on AI could undermine the intended learning outcomes and misrepresent students' abilities.|High Risk||
|**High-Risk Student Advising**|Decisions that directly impact a student's fundamental rights, opportunities, or access to critical needs. This may include high-stakes advisement that affects academic progression or financial aid eligibility.|High Risk||

2. Employment, Financial, and Resource Allocation Decisions

|   |   |   |   |
|---|---|---|---|
|Decision Area|Specific Context Requiring HITL|Risk Classification|Source(s)|
|**Recruitment and Employment**|AI systems used in **employment and recruitment decisions** (e.g., scoring candidates, assigning job applicants) must retain human oversight to mitigate bias and ensure compliance with anti-discrimination laws.|High Risk (EU AI Act)||
|**Financial/Credit Scoring**|Systems that perform **automated credit scoring** or influence an individual's **ability to get access to loans**. This applies broadly to high-stakes financial services.|High Risk (EU AI Act)||
|**Benefits and Services Eligibility**|Systems that **determine benefit eligibility** or are relied on to make or directly inform **decisions affecting individuals' rights, benefits, or access to services**.|High Risk / Tier 3||
|**Destructive/Irreversible Actions**|AI agents must have **mandatory human-in-the-loop confirmation for all destructive or irreversible actions**, such as deleting critical source code or files.|High Risk (Risk Mitigation Control)||

3. Health, Safety, and Public Sector Critical Systems

|   |   |   |   |
|---|---|---|---|
|Decision Area|Specific Context Requiring HITL|Risk Classification|Source(s)|
|**Medical/Clinical Diagnosis**|AI systems used for **medical diagnosis or treatment recommendations**. Errors in this context can be **life-threatening**. HITL ensures critical context, ethical nuances, and human judgment are applied.|Critical/High Risk||
|**Critical Infrastructure**|AI systems used for the **management of critical infrastructure** (e.g., predicting maintenance needs for critical infrastructure).|High Risk (EU AI Act)||
|**Automated Administrative Decisions**|Decisions made by algorithms that affect an **individual** (such as being excluded from a public service). Delegating authority over such a decision to an AI system may be impermissible where administrative justice frameworks exist.|High Risk / Tier 3||
|**Law Enforcement/Justice**|AI systems used in **law enforcement or justice**.|High Risk (EU AI Act)||

NotebookLM can be inaccurate; please double-check its response