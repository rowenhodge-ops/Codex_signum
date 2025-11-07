## **1\. Core Task**

You are an expert full-stack developer. Your task is to build a complete, single-page web application using **Angular**, **Tailwind CSS**, and **Firebase (Auth and Firestore)**.

The application is a C-suite advisory tool called the "**AI Strategy Navigator**" for my consultancy, **Codex Signum**.

The app functions as a multi-step survey. It captures a potential client's strategic challenges, gathers their contact information as a lead, and then hands them off to a context-aware Gemini chat. The chat's purpose is to build on their survey answers and sell them on an initial **2-3 week "Diagnostic"** advisory service.

## **2\. Branding & Aesthetic (From UI/UX Research)**

**Branding:**

* A simple, clean header must be present at the top of the app.  
* It should contain the text "**Codex Signum**" in a bold, sans-serif font, aligned to the left.

**Aesthetic (Perplexity-Inspired Dark Mode):**

* **Font:** Use a modern, sans-serif font stack (e.g., **Inter**, Roboto, system-ui). Text must be clean and highly readable.  
* **Main Background:** A very dark grey (e.g., bg-zinc-900 or \#1E1E1E).  
* **Text Color:** An off-white, low-glare color (e.g., text-zinc-200 or rgba(255, 255, 255, 0.87)).  
* **Survey Cards:** The entire survey flow should take place inside a minimalist card with a slightly lighter background (e.g., bg-zinc-800 or \#252526) and rounded corners (rounded-xl).  
* **Buttons:**  
  * **Primary/Next:** Bright, high-contrast, and solid (e.g., bg-blue-600 text-white font-semibold).  
  * **Selection (Choices):** Minimalist. border border-zinc-700 on idle, and bg-blue-600 border-blue-600 text-white when selected. Implement **Hick's Law** (from the UI research): show choices clearly, one step at a time.  
* **Inputs:** Minimalist dark-mode text fields (e.g., bg-zinc-700 border border-zinc-600 rounded-md text-white).  
* **Chat UI:**  
  * **AI Bubble:** bg-zinc-800.  
  * **User Bubble:** bg-blue-700.

## **3\. Core Application Flow & Logic**

The app is a single Angular component (AppComponent). Use signals to manage the current state, survey step, user data, and chat messages.

**Step 0: Industry Selector**

* **UI:** Show a simple selection screen.  
* **Question:** "What industry are you in?"  
* **Options:**  
  * \[ Higher Education \] (Enabled)  
  * \[ Finance \] (Disabled, "Coming Soon")  
  * \[ Healthcare \] (Disabled, "Coming Soon")  
* **Action:** When the user selects "Higher Education," move to Step 1\.

**Step 1: The Survey (Nodes level-1 to level-4)**

* **Logic:**  
  1. Fetch all documents from the surveyNodes Firestore collection.  
  2. Start at nodeId: "level-1".  
  3. Display the question and the insight text.  
  4. Render the choices as buttons.  
  5. If the type is "data\_capture", render the appropriate input (e.g., multi-select buttons for soft\_roi\_metrics).  
  6. When a user makes a choice:  
     * If it's a data\_capture node, save the user's input to a local signal (e.g., capturedData).  
     * Get the nextNode ID from their choice.  
     * Transition to the next node.  
* **Data Capture:** The capturedData signal (a simple map) will store their answers, e.g., { "soft\_roi\_metrics": \["Student Retention", "Faculty Time Reclaimed"\] }.

**Step 2: Lead Capture Form**

* **Logic:** When the user reaches a nextNode value of "LEAD\_CAPTURE", show this form.  
* **UI:** A simple form with three required fields:  
  * Name (\<input type="text"\>)  
  * Company (\<input type="text"\>)  
  * Email (\<input type="email"\>)  
* **Action:** On submit, save this data to the capturedData signal and move to Step 3\. This form is **not skippable**.

**Step 3: Diagnosis & Chat Hand-off**

* **Logic:** When the form is submitted, the finalNodeId (from the last survey step) is now known. Use this ID (e.g., "output-A1") to:  
  1. Get the diagnosis text from the surveyNodes document.  
  2. Get the initialChatPrompt from the surveyNodes document.  
* **UI:** Display the diagnosis text clearly. Below it, show the Gemini Chat interface.  
* **Action:**  
  1. **Firebase Auth:** Sign the user in anonymously.  
  2. **Firestore Write:** Create a *new document* in the clientConversations collection.  
  3. **Populate Document:** Save all the captured data:  
     * userId (from anonymous auth)  
     * name  
     * company  
     * email  
     * capturedData (the map of their survey answers)  
     * finalDiagnosis (the diagnosis text)  
     * chatHistory (array, initialize with the first AI message)  
  4. **Initiate Chat:** Display the initialChatPrompt as the first message from the "AI Assistant."

**Step 4: The Gemini Chat**

* **UI:** A standard chat interface (message log, input box, send button).  
* **System Instruction:** When calling the Gemini API, use this system instruction:"You are a world-class AI strategy consultant from Codex Signum. Your goal is to sell the user on a 2-3 week 'Diagnostic' advisory service. The user has just completed a survey. Their answers and final diagnosis are in the chat history.  
  Your task is to:  
  1. **Listen:** Ask them to provide more context about their specific situation (e.g., 'You mentioned you're focused on student retention. What specific challenges are you seeing there?').  
  2. **Use the Tools:** You have been provided with our 'Template' documents. Use the knowledge *from these templates* to inform your answers and build credibility.  
  3. **Pivot to the Pitch:** Connect their problem to our service. Example: 'That's exactly what our 2-3 week Diagnostic is designed to uncover. Our team would come onsite to analyze that retention data, identify the root cause, and build a charter for a pilot project.'  
  4. **Save Context:** Be conversational. Your entire conversation will be saved and reviewed by our human team."  
* **Tools (for Gemini):** The generateContent call must include the tools property. The tools payload will be an array of functionDeclarations, one for each of the 6 templates.  
  * Example: { "functionDeclarations": \[{ "name": "getMvaipCharterTemplate", "description": "Provides the MVAIP Charter Template content. Use this to help a user scope a new AI project." ...etc }\] }  
  * When Gemini tries to "call" one of these functions, simply return the hardcoded template text from the templateData constant.  
* **Firestore Updates:** With *every* user message and AI response, update the chatHistory array in their specific clientConversations document. This saves the full transcript for your team.

## **4\. Firebase Setup & Data**

You must create and populate two Firestore collections: surveyNodes and templateData.

### **Collection 1: surveyNodes**

*(This collection drives the entire survey logic. Create one document per node.)*

**Document ID: level-1**

{  
  "question": "What is your primary focus regarding AI right now?",  
  "insight": "C-suite leaders are typically focused on one of three paths: finding new opportunities, managing new risks, or justifying the high cost of investment.",  
  "type": "choice",  
  "choices": \[  
    { "text": "Finding new revenue and efficiency opportunities", "nextNode": "path-A-level-2" },  
    { "text": "Managing financial, legal, and reputational risk", "nextNode": "path-B-level-2" },  
    { "text": "Justifying investment and competitive strategy", "nextNode": "path-C-level-2" }  
  \]  
}

**Document ID: path-A-level-2**

{  
  "question": "Are you exploring new project ideas or scoping a specific project?",  
  "insight": "Our research shows 80% of AI projects fail to deliver value, often due to poor initial scoping. Vetting the \*first\* project is critical.",  
  "type": "choice",  
  "choices": \[  
    { "text": "I'm exploring new ideas ('Soft ROI' projects)", "nextNode": "path-A1-level-3" },  
    { "text": "I have a specific project to scope", "nextNode": "path-A2-level-3" }  
  \]  
}

**Document ID: path-A1-level-3**

{  
  "question": "Are you more interested in improving student success or in finding internal efficiencies?",  
  "insight": "A competitor, Georgia State University, used an AI chatbot to increase enrollment by 3.3%—proving 'soft' student-facing projects can have the hardest ROI.",  
  "type": "choice",  
  "choices": \[  
    { "text": "Improving student retention & success", "nextNode": "path-A1-level-4-capture" },  
    { "text": "Finding internal efficiencies (admin, operations)", "nextNode": "path-A1-level-4-capture" }  
  \]  
}

**Document ID: path-A1-level-4-capture**

{  
  "question": "Which of these 'Soft ROI' metrics are most important to you? (Select all that apply)",  
  "insight": "Capturing these metrics is the first step in building a business case.",  
  "type": "data\_capture",  
  "data\_key": "soft\_roi\_metrics",  
  "data\_options\_from\_template": "Value\_Realization\_Plan",  
  "data\_options\_key": "soft\_roi\_metrics",  
  "choices": \[  
    { "text": "Finish", "nextNode": "LEAD\_CAPTURE", "finalNodeId": "output-A1" }  
  \],  
  "diagnosis": "Your focus on 'Soft ROI' is smart. The strongest business cases (like GSU's 3.3% enrollment boost) come from student-facing projects, not just back-office cuts. Your goal is to build a business case that links metrics like 'Student Retention' directly to revenue.",  
  "initialChatPrompt": "Thanks for that context. You're focused on new opportunities, specifically around the 'Soft ROI' metrics you selected. Our 2-3 week Diagnostic is designed to build the business case for exactly this. To start, could you tell me more about the challenges you're facing with \[User's Selected Metric\]?"  
}

**Document ID: path-A2-level-3**

{  
  "question": "To scope your project, we need to know what it will do. Is it automating a process or providing advice?",  
  "insight": "Clear scoping is the \#1 defense against project failure. We use a 'Value vs. Complexity' matrix to vet all new ideas.",  
  "type": "choice",  
  "choices": \[  
    { "text": "Automating an internal process (e.g., admin)", "nextNode": "path-A2-level-4-capture" },  
    { "text": "Providing advice/service (e.g., student chatbot)", "nextNode": "path-A2-level-4-capture" }  
  \]  
}

**Document ID: path-A2-level-4-capture**

{  
  "question": "Which of these areas does your project support? (Select one)",  
  "insight": "Aligning your project to a core strategic goal is essential for executive buy-in.",  
  "type": "data\_capture",  
  "data\_key": "strategic\_pillar",  
  "data\_options\_from\_template": "MVAIP\_Charter",  
  "data\_options\_key": "strategic\_pillars",  
  "choices": \[  
    { "text": "Finish", "nextNode": "LEAD\_CAPTURE", "finalNodeId": "output-A2" }  
  \],  
  "diagnosis": "You're ready to move from idea to execution. The next step is to formalize this project in a 'Minimum Viable AI Product (MVAIP) Charter'. This charter forces you to define the scope, value, and complexity \*before\* you write a single line of code, preventing the 80% failure rate.",  
  "initialChatPrompt": "You have a specific project in mind, which is a great start. To prevent the 80% failure rate, our 2-3 week Diagnostic uses an 'MVAIP Charter'. I can help you start drafting that now. Based on what you've selected, what's the core problem this project is trying to solve?"  
}

**Document ID: path-B-level-2**

{  
  "question": "Which risk is your primary concern: reputational harm from bad outputs, or data leaks from security flaws?",  
  "insight": "A competitor, Deakin University, suffered a major public failure when their chatbot gave 'unsafe' advice. The \#1 risk isn't just a data leak; it's a loss of trust.",  
  "type": "choice",  
  "choices": \[  
    { "text": "Reputational Harm (Bias, 'Hallucinations')", "nextNode": "path-B1-level-3" },  
    { "text": "Data Leaks & Security Flaws", "nextNode": "path-B2-level-3" }  
  \]  
}

**Document ID: path-B1-level-3**

{  
  "question": "Is your concern about AI making automated high-stakes decisions, or about AI providing unvetted, 'unsafe' advice?",  
  "insight": "Governance isn't one-size-fits-all. A 'High-Stakes' decision (like admissions) needs a different review process than an 'Advisory' tool (like a chatbot).",  
  "type": "choice",  
  "choices": \[  
    { "text": "Automated 'High-Stakes' Decisions", "nextNode": "path-B1-level-4-capture" },  
    { "text": "Unvetted / 'Unsafe' Advice", "nextNode": "path-B1-level-4-capture" }  
  \]  
}

**Document ID: path-B1-level-4-capture**

{  
  "question": "Which of these 'High-Stakes' areas concern you most? (Select all that apply)",  
  "insight": "Identifying these areas is the first step in our 'Federated Governance' model, ensuring human oversight is applied where it matters most.",  
  "type": "data\_capture",  
  "data\_key": "high\_stakes\_areas",  
  "data\_options\_from\_template": "AI\_Risk\_Assessment",  
  "data\_options\_key": "high\_stakes\_areas",  
  "choices": \[  
    { "text": "Finish", "nextNode": "LEAD\_CAPTURE", "finalNodeId": "output-B1" }  
  \],  
  "diagnosis": "Your concern is about 'Governance Risk'. You're right to be. The solution is a formal governance model with human-in-the-loop oversight for all high-stakes decisions. You can't 'set and forget' AI. You need a clear process to review, approve, and contest AI-driven decisions.",  
  "initialChatPrompt": "You're focused on the high-stakes governance risks, which is exactly the right place to start. Our 2-3 week Diagnostic helps you build an 'AI Risk Assessment' framework. To give you a head start, which of the areas you selected (e.g., \[User's Selected Area\]) is the most urgent for your institution?"  
}

**Document ID: path-B2-level-3**

{  
  "question": "Is this risk from employees putting sensitive data into public tools, or from a new internal tool you are building?",  
  "insight": "The \#1 security vulnerability is often untrained staff. A policy prohibiting the use of public AI with sensitive data is the fastest, cheapest, and most effective security control you can deploy.",  
  "type": "choice",  
  "choices": \[  
    { "text": "Employees using public tools (e.g., ChatGPT)", "nextNode": "path-B2.1-level-4" },  
    { "text": "Building a new internal tool", "nextNode": "path-B2.1-level-4" }  
  \]  
}

**Document ID: path-B2.1-level-4**

{  
  "question": "Does this tool or scenario involve PII, financial, or strategic IP?",  
  "insight": "Our data classification framework is simple: If the data is 'Protected' or 'Restricted', it CANNOT go into a public model. It must be hosted in a secure, private environment.",  
  "type": "choice",  
  "choices": \[  
    { "text": "Yes, it involves sensitive data", "nextNode": "LEAD\_CAPTURE", "finalNodeId": "output-B2" },  
    { "text": "No, it's public or non-sensitive data", "nextNode": "LEAD\_CAPTURE", "finalNodeId": "output-B2" }  
  \]  
}

**Document ID: output-B2**

{  
  "type": "output",  
  "diagnosis": "Your focus is on 'Data Security Risk'. This is the most critical technical challenge. The solution is twofold: 1\) A clear, simple 'Data Classification' policy that tells staff what data is forbidden in public AI. 2\) A 'GenAI Security Checklist' (based on the OWASP Top 10\) for any new internal tools to prevent data leaks and prompt injection attacks.",  
  "initialChatPrompt": "Data security is the right foundation. Our 2-3 week Diagnostic always starts by building a 'Data Classification' framework. This is non-negotiable. To get started, can you tell me more about the types of sensitive (PII, financial, or IP) data you are most concerned about protecting?"  
}

**Document ID: path-C-level-2**

{  
  "question": "Are you trying to build a business case for a \*single project\*, or define the \*entire university's\* long-term competitive strategy?",  
  "insight": "We found that your competitors (like Monash and Sydney) are already investing millions in their own 'Sovereign AI' infrastructure, creating a 'Technology Deficit' that must be addressed.",  
  "type": "choice",  
  "choices": \[  
    { "text": "Build a business case (Project ROI)", "nextNode": "path-C1-level-3" },  
    { "text": "Define long-term strategy (Peer Competition)", "nextNode": "path-C2-level-3" }  
  \]  
}

**Document ID: path-C1-level-3**

{  
  "question": "Traditional ROI models often fail for AI. Are you looking to measure direct cost savings or mission-critical value?",  
  "insight": "Focusing \*only\* on cost-cuts is a trap. The biggest wins are in 'Soft ROI'—like GSU's 3.3% enrollment boost from a student chatbot. These are 'mission-critical' metrics that drive revenue.",  
  "type": "choice",  
  "choices": \[  
    { "text": "Direct Cost Savings (e.g., automating admin)", "nextNode": "path-C1-level-4-capture" },  
    { "text": "Mission-Critical Value (e.g., student retention)", "nextNode": "path-C1-level-4-capture" }  
  \]  
}

**Document ID: path-C1-level-4-capture**

{  
  "question": "Which of these 'Soft ROI' metrics are most important to you? (Select all that apply)",  
  "insight": "Capturing these metrics is the first step in building a business case.",  
  "type": "data\_capture",  
  "data\_key": "soft\_roi\_metrics",  
  "data\_options\_from\_template": "Value\_Realization\_Plan",  
  "data\_options\_key": "soft\_roi\_metrics",  
  "choices": \[  
    { "text": "Finish", "nextNode": "LEAD\_CAPTURE", "finalNodeId": "output-C1" }  
  \],  
  "diagnosis": "You need a modern business case. The right approach is a 'Hybrid ROI Model' that connects 'Soft ROI' (like the metrics you selected) to hard revenue. A 1% increase in student retention isn't 'soft'—it's worth millions. You must build a plan to measure this from Day 1.",  
  "initialChatPrompt": "You're focused on building a solid business case. Our 2-3 week Diagnostic helps you create a 'Value Realization Plan' that links the metrics you chose to real financial outcomes. To start, which of those metrics do you believe has the strongest, most provable link to revenue at your institution?"  
}

**Document ID: path-C2-level-3**

{  
  "question": "Your peers are investing millions in their own AI infrastructure. Do you see your institution competing, or partnering?",  
  "insight": "This is the core 'capital investment' question. Building your own 'Sovereign AI' is expensive and slow. Partnering with a vendor (like Microsoft) is fast but creates permanent lock-in.",  
  "type": "choice",  
  "choices": \[  
    { "text": "We must compete (Build 'Sovereign AI')", "nextNode": "LEAD\_CAPTURE", "finalNodeId": "output-C2" },  
    { "text": "We should partner (Use Vendor Platforms)", "nextNode": "LEAD\_CAPTURE", "finalNodeId": "output-C2" },  
    { "text": "We should avoid the 'arms race' (Focus on Niche)", "nextNode": "LEAD\_CAPTURE", "finalNodeId": "output-C2" }  
  \]  
}

**Document ID: output-C2**

{  
  "type": "output",  
  "diagnosis": "This is the most critical long-term decision you'll make. You've identified the 'Technology Deficit'. Your choice (Sovereign vs. Partner vs. Niche) dictates your entire budget, talent, and procurement strategy for the next five years. This can't be an 'IT decision'; it must be an executive-level strategic choice.",  
  "initialChatPrompt": "You've landed on the core capital investment question. Our 2-3 week Diagnostic is designed to frame this exact 'Strategic Choice'. We deliver a decision brief to your leadership that models the 5-year TCO and risks of all three options. To help me understand your position, what is the biggest driver behind your choice to \[User's Selected Choice\]?"  
}

### **Collection 2: templateData**

*(This collection stores the 'tools' for Gemini and the data extracts for the survey. Create one document per template.)*

**Document ID: MVAIP\_Charter**

{  
  "name": "MVAIP Charter Template",  
  "description": "A template to scope a 'Minimum Viable AI Product'. Use this to help a client formalize a new project idea and prevent scope creep.",  
  "data\_extracts": {  
    "strategic\_pillars": \[  
      "Intelligent Operations & Administration",  
      "Personalised & Scalable Student Journey",  
      "Accelerated Research & Discovery"  
    \]  
  },  
  "content": "\# AI Project Charter: Minimum Viable AI Product (MVAIP)\\n\\nThis charter operationalizes the 'Crawl' phase of the 3-Year Strategic AI Roadmap. It serves as the primary initiation document for review by the AI Steering Committee.\\n\\n\#\# 1\. Project Definition\\n| Attribute | Value |\\n| :--- | :--- |\\n| \*\*MVAIP Project Name:\*\* | '\[Enter Project Name\]' |\\n| \*\*Project Sponsor:\*\* | '\[Name, Title\]' |\\n| \*\*Project Lead:\*\* | '\[Name, Title\]' |\\n\\n\#\# 2\. Strategic Alignment\\nIdentify the primary strategic pillar this MVAIP supports:\\n\* \[ \] Intelligent Operations & Administration\\n\* \[ \] Personalised & Scalable Student Journey\\n\* \[ \] Accelerated Research & Discovery\\n\\n\*\*Problem Statement:\*\*\\n'\[Briefly describe the specific institutional problem this project solves.\]'\\n\\n\*\*Strategic Justification:\*\*\\n'\[Explain how solving this problem aligns with the selected pillar and the university's core mission.\]'\\n\\n\#\# 3\. Value vs. Complexity Assessment\\n| \*\*Value (High/Med/Low)\*\* | \*\*Complexity (High/Med/Low)\*\* |\\n| :--- | :--- |\\n| '\[e.g., High\]' | '\[e.g., Low\]' |\\n| \*\*Value Justification:\*\* '\[Justify the value rating. Reference Hard/Soft ROI. See Value Realization Plan.\]' | \*\*Complexity Justification:\*\* '\[Justify the complexity. Note data readiness, tech requirements, and required skills.\]' |\\n\\n\#\# 4\. Scope & Key Deliverables\\n\*\*MVAIP Scope (In):\*\*\\n'\[List the specific, minimal features required for this to be viable.\]'\\n\\n\*\*MVAIP Scope (Out):\*\*\\n'\[List features explicitly excluded to prevent scope creep.\]'\\n"  
}

**Document ID: AI\_Risk\_Assessment**

{  
  "name": "AI Risk Assessment Form",  
  "description": "A template to assess the ethical and governance risk of a new AI project. Use this to help a client concerned with bias, fairness, or accountability.",  
  "data\_extracts": {  
    "high\_stakes\_areas": \[  
      "Admissions & Recruitment",  
      "Student Grading & Assessment",  
      "Financial Aid & Scholarships",  
      "Staff/Faculty Hiring & Performance",  
      "Student Disciplinary Actions"  
    \]  
  },  
  "content": "\# AI Project Risk Assessment Form\\n\\nThis form is a mandatory component of the 'Federated Governance Model'. It must be completed and submitted to the relevant AI Review Board (for Low/Medium risk) or the AI Steering Committee (for High risk).\\n\\n\#\# 1\. Project & Data Identification\\n| Attribute | Value |\\n| :--- | :--- |\\n| \*\*Project Name:\*\* | '\[Enter Project Name\]' |\\n| \*\*Data Classification:\*\* | '\[Identify the highest data tier (Tier 1-4) used by the system.\]' |\\n\\n\#\# 2\. AI Ethics & Principles Review\\nDescribe how the project actively upholds the five core ethical principles.\\n\\n| \*\*Principle\*\* | \*\*Adherence & Mitigation Strategy\*\* |\\n| :--- | :--- |\\n| \*\*1. Beneficial\*\* | '\[How does this project demonstrably benefit students, staff, or research? What safeguards prevent harm?\]' |\\n| \*\*2. Fair\*\* | '\[What is the plan to identify and mitigate algorithmic bias? How will training data be vetted for fairness?\]' |\\n| \*\*3. Transparent\*\* | '\[How will users be notified they are interacting with an AI? How will the system's decisions be explained?\]' |\\n| \*\*4. Accountable\*\* | '\[Who is the designated individual accountable for the AI's outputs? What is the human-in-the-loop mechanism?\]' |\\n| \*\*5. Contestable\*\* | '\[What is the clear, advertised process for a user to appeal or challenge the AI's decision or output?\]' |\\n\\n\#\# 3\. Final Risk Rating\\n\* \[ \] \*\*Low Risk:\*\* (e.g., Internal process automation, non-PII data)\\n\* \[ \] \*\*Medium Risk:\*\* (e.g., Advisory systems, student-facing tools, contains Tier 3 data)\\n\* \[ \] \*\*High Risk:\*\* (e.g., High-stakes decisions like admissions/grading, sensitive research, contains Tier 4 data)"  
}

**Document ID: Peer\_Analysis\_Template**

{  
  "name": "Peer Case Study Analysis Template",  
  "description": "A template to analyze AI projects from peer institutions to find actionable lessons. Use this to help a client in the 'ideation' phase.",  
  "data\_extracts": {},  
  "content": "\# AI Peer Case Study Analysis Template\\n\\nThis template is used to formally analyze AI projects from peer institutions to extract actionable lessons.\\n\\n\#\# 1\. Case Study Overview\\n| Attribute | Value |\\n| :--- | :--- |\\n| \*\*Institution:\*\* | '\[e.g., Georgia State University\]' |\\n| \*\*Project Name:\*\* | '\[e.g., 'Pounce' Chatbot\]' |\\n| \*\*Domain:\*\* | '\[e.g., Student Support & Retention\]' |\\n\\n\*\*Project Summary:\*\*\\n'\[Describe the project's goal, function, and target users.\]'\\n\\n\#\# 2\. Outcome Analysis\\n\*\*Stated Outcome:\*\* \[ \] Success \[ \] Failure \[ \] Mixed\\n\\n\*\*Evidence of Outcome:\*\*\\n'\[Provide the key metric or qualitative result. e.g., 'Led to a 3.3% enrollment increase over 4 years.'\]'\\n\\n\*\*Analysis of Critical Factors:\*\*\\n'\[What \*caused\* the outcome? (e.g., GSU: Proactive, personalized support based on 800+ risk factors. Deakin: Failure to cleanse or vet the internal knowledge base.)\]'\\n\\n\#\# 3\. Key Actionable Lessons\\n\*\*Lesson 1 (Do This):\*\*\\n'\[e.g., 'Lesson: Proactive, personalized student support provides a massive, measurable Soft ROI in retention.'\]'\\n\\n\*\*Lesson 2 (Avoid This):\*\*\\n'\[e.g., 'Lesson: Never connect an AI to an unvetted internal knowledge base. The primary risk is data quality, not the AI model.'\]'\\n"  
}

**Document ID: Strategic\_Choice\_Brief**

{  
  "name": "Strategic Choice Decision Brief",  
  "description": "A C-suite level brief outlining the 3 core strategic pathways for long-term AI investment. Use this to frame the 'Build vs. Buy' (Sovereign vs. Partner) conversation.",  
  "data\_extracts": {},  
  "content": "\# Decision Brief: AI Strategic Technology Pathway\\n\\n\*\*SUBJECT:\*\* Selection of a 5-Year Strategic AI Technology Pathway\\n\\n\#\# 1\. The Strategic Imperative\\nThe 'AI Maturity Peer Analysis' confirms our institution has a 'Technology Deficit' compared to peers (e.g., Monash, Sydney) who are investing millions in sovereign compute. This forces a fundamental, long-term strategic choice.\\n\\n\#\# 2\. Pathway 1: Sovereign Infrastructure\\n\* \*\*Description:\*\* Compete directly by funding and building our own large-scale AI compute infrastructure.\\n\* \*\*Pros:\*\* Full autonomy; research leadership; data sovereignty; attracts top-tier AI talent.\\n\* \*\*Cons:\*\* Extremely high capital/operating cost; long lead time; high-risk of technological obsolescence.\\n\\n\#\# 3\. Pathway 2: Enterprise Partnership\\n\* \*\*Description:\*\* Accept platform dependency. Build our AI ecosystem exclusively on a major vendor's stack (e.g., Microsoft Azure, Google Cloud, AWS).\\n\* \*\*Pros:\*\* Rapid deployment; lower initial cost; access to state-of-the-art models.\\n\* \*\*Cons:\*\* Vendor lock-in; data sovereignty risks; usage-based costs can spiral.\\n\\n\#\# 4\. Pathway 3: Niche Leadership (Governance & Application)\\n\* \*\*Description:\*\* Cede the infrastructure race. Focus investment on being a world-leader in the \*application\* and \*governance\* of AI. Differentiate by building secure, ethical systems on top of commodity vendor models.\\n\* \*\*Pros:\*\* Aligns with core mission; lower cost; strong reputational and ethical branding.\\n\* \*\*Cons:\*\* Cedes 'big model' research leadership; dependent on partners.\\n\\n\#\# 5\. Request for Decision\\nWe request the AI Steering Committee to formally debate and ratify one of these three pathways. This decision is the prerequisite for all future AI-related technology procurement and talent strategies."  
}

**Document ID: Value\_Realization\_Plan**

{  
  "name": "AI Value Realization Plan",  
  "description": "A template to build a 'Hybrid ROI' business case for an AI project. Use this to help a client connect 'Soft ROI' metrics (like student retention) to 'Hard ROI' (revenue).",  
  "data\_extracts": {  
    "soft\_roi\_metrics": \[  
      "Student Retention & Success",  
      "Student Satisfaction (NPS)",  
      "Faculty/Staff Time Reclaimed",  
      "Research Output / Speed",  
      "Accessibility & Inclusion",  
      "Ethical Compliance Score"  
    \]  
  },  
  "content": "\# AI Project: Value Realization Plan\\n\\nThis plan defines \*how\* the value of an AI project will be measured, with a focus on the 'Hybrid ROI Model' that prioritizes mission-centric outcomes.\\n\\n\#\# 1\. Project Overview\\n| Attribute | Value |\\n| :--- | :--- |\\n| \*\*Project Name:\*\* | '\[Enter Project Name\]' |\\n| \*\*Alignment:\*\* | '\[Strategic Pillar\]' |\\n\\n\#\# 2\. Hard ROI (Financial Metrics)\\n\*These are quantitative measures of financial efficiency or gain.\*\\n\\n| \*\*Metric\*\* | \*\*Baseline (Current State)\*\* | \*\*Target (Post-Implementation)\*\* |\\n| :--- | :--- | :--- |\\n| \*\*Cost Avoidance\*\* | '\[e.g., $X spent on Y process\]' | '\[e.g., $Y saved\]' |\\n| \*\*Efficiency Gain\*\* | '\[e.g., Z hours/week spent on task\]' | '\[e.g., Z-10 hours/week\]' |\\n| \*\*Enrollment/Revenue\*\* | '\[e.g., X% conversion/retention\]' | '\[e.g., X+1% conversion/retention\]' |\\n\\n\#\# 3\. Soft ROI (Mission-Critical Metrics)\\n\*This is the primary measure of value. Select the metrics that align with the university's core mission.\*\\n\\n| \*\*Metric\*\* | \*\*Baseline (Current State)\*\* | \*\*Target (Post-Implementation)\*\* |\\n| :--- | :--- | :--- |\\n| \*\*Student Retention\*\* | '\[e.g., X% drop-off at Y milestone\]' | '\[e.g., X-0.5% drop-off\]' |\\n| \*\*Student Satisfaction\*\* | '\[e.g., Y% score on student feedback\]' | '\[e.g., Y+5% score\]' |\\n| \*\*Faculty/Staff Time Reclaimed\*\* | '\[e.g., X hours/week on admin\]' | '\[e.g., Y hours freed for research/teaching\]' |\\n| \*\*Research Output\*\* | '\[e.g., Avg. time to X discovery\]' | '\[e.g., Reduced time to X\]' |\\n| \*\*Ethical Compliance\*\* | '\[e.g., 0% of projects assessed\]' | '\[e.g., 100% of projects assessed\]' |\\n"  
}

**Document ID: GenAI\_Security\_Checklist**

{  
  "name": "GenAI Security Checklist",  
  "description": "An essential checklist for any new AI project, based on the OWASP Top 10 for LLMs. Use this to help a client concerned with data leaks, privacy, and security.",  
  "data\_extracts": {},  
  "content": "\# GenAI Security & Compliance Checklist\\n\\nThis checklist is a mandatory tool based on the 'AI Security & Data Governance Framework'. It must be completed by the Project Lead and reviewed by the appropriate AI Review Board.\\n\\n\#\# 1\. Data Classification & Handling\\n\* \[ \] \*\*Data Classified:\*\* All data used (training, RAG) has been classified using the \*\*Tier 1-4 Data Classification Framework\*\*.\\n\* \[ \] \*\*Highest Data Tier Identified:\*\* '\[Specify Tier 1, 2, 3, or 4\]'\\n\* \[ \] \*\*Public GenAI Prohibition:\*\* I confirm this project \*\*DOES NOT\*\* involve inputting \*\*Tier 3 (Protected)\*\* or \*\*Tier 4 (Restricted)\*\* data into any public, third-party Generative AI service.\\n\* \[ \] \*\*Data Minimization:\*\* The project uses the absolute minimum data necessary for its function.\\n\* \[ \] \*\*Anonymization/Pseudonymization:\*\* All Tier 3 or 4 data has been de-identified, where technically feasible.\\n\\n\#\# 2\. Secure AI Environment\\n\* \[ \] \*\*Secure Environment:\*\* The AI model and data are hosted in a university-approved secure environment (e.g., secure private cloud, on-premise).\\n\* \[ \] \*\*Access Control:\*\* Access to the model, its APIs, and its training data is restricted to named, authorized personnel.\\n\* \[ \] \*\*Secure Knowledge Base:\*\* If using RAG, the knowledge base has been vetted, cleansed, and secured (Ref: Deakin failure).\\n\\n\#\# 3\. OWASP Top 10 for LLMs Mitigation\\n\*This section addresses key application-layer risks.\*\\n\\n\* \[ \] \*\*Prompt Injection:\*\* Input validation and sanitization are in place to mitigate malicious prompt injection.\\n\* \[ \] \*\*Insecure Output Handling:\*\* Outputs from the LLM are sanitized before being passed to back-end systems (e.g., to prevent XSS).\\n\* \[ \] \*\*Data Poisoning:\*\* Training data sources are vetted, and a process is in place to secure the data integrity pipeline.\\n\* \[ \] \*\*Sensitive Information Disclosure:\*\* The model has been tested (e.g., red-teamed) to ensure it does not leak sensitive, PII, or confidential information.\\n"  
}  
