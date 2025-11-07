**

You are an expert full-stack developer specializing in Firebase, React, Tailwind CSS, and minimalist, AI-native user interfaces.

Your task is to build a "C-Suite AI Strategy Navigator" application. The app's purpose is to engage high-level clients (CFOs, CIOs, VCs) by guiding them through a 4-level diagnostic survey.

This app has two primary goals:

1. Lead Capture: Secure the client's Name, Company, and Email.
    
2. Contextual Pitch: Capture the client's specific problems (e.g., key metrics, project ideas) and use this data to initiate a Gemini-powered chat that pitches a 2-3 week "Initial Diagnostic" advisory service.
    

The entire aesthetic must be minimalist, dark-mode, and "Perplexity-style"—a single, clean, conversational feed.

Core Technology Stack:

- Frontend: React (using functional components and hooks)
    
- Styling: Tailwind CSS
    
- Backend & DB: Firebase.
    

- Firestore: To store survey logic, templates, and captured client data.
    
- Firebase Auth: Required. Use anonymous authentication (signInAnonymously) on app load to get a stable userId.
    

- AI: Gemini 2.5 Pro (via API call)
    

Design & UI (Perplexity-Style):

- Overall: A single-page, single-feed application. No separate pages.
    
- Theme: Dark mode (bg-black or bg-gray-950 body).
    
- Text: High-contrast, highly readable (text-gray-200 or text-white).
    
- Accent Color: A single professional accent color (e.g., text-blue-400 or text-violet-400).
    
- Flow: The interaction should feel like a conversation. When a user makes a choice, their choice is confirmed, and the next question/insight/input appears below it.
    

Application Flow:

1. Start (Level 1): App loads. signInAnonymously(). Fetch and display the level-1 node from surveyNodes.
    
2. Navigation & Data Capture (Levels 2-3): The app follows the next_node logic, displaying questions or data capture inputs. All captured data is saved to a local state variable.
    
3. Lead Capture Form (Level 4): Before showing the final output, display a non-skippable form for Name, Company, and Email.
    
4. Transition to AI Chat (Level 5 - The Pitch):
    

- On lead form submission, create a new document in the clientConversations collection, saving all captured data (userId, lead info, survey answers).
    
- Display the final diagnosis text, which is rewritten as a pitch for the 2-3 week diagnostic.
    
- Fade in the Gemini Chat Interface.
    

Gemini 2.5 Pro Integration (Crucial):

1. Chat Interface: A simple, clean chat history div and a text input box.
    
2. Contextual Priming: Construct a System Instruction for the Gemini API that includes the client's captured data, the diagnosis, and the full content of the relevant template.
    
3. Initial Chat Prompt: The chat history will be pre-filled with a prompt that references the client's captured data and pivots to pitching the diagnostic (e.g., "Thanks, [Name]. I see your focus is on [Metric]. This is the perfect starting point for our 2-3 week Diagnostic...").
    
4. Interaction & Context Saving: All messages (user and model) are saved to the messages array in the clientConversations document in Firestore, providing a full transcript for your engagement team.
    

## PART 1: FIRESTORE DATA (surveyNodes collection)

Create a collection named surveyNodes. Create one document for each ID below, using the provided data.

### Level 1

Document ID: level-1

{  
  "type": "question",  
  "insight": "Welcome. This 3-minute diagnostic will help you identify and frame your primary AI challenge.",  
  "text": "What is the primary driver for your interest in AI strategy today?",  
  "options": [  
    {  
      "text": "[A] Finding high-value opportunities and a clear starting point.",  
      "next_node": "path-A-level-2"  
    },  
    {  
      "text": "[B] Managing risk, ensuring security, and establishing ethical guardrails.",  
      "next_node": "path-B-level-2"  
    },  
    {  
      "text": "[C] Justifying investment, measuring value, and understanding our competitive position.",  
      "next_node": "path-C-level-2"  
    }  
  ]  
}  
  

### Path A (Opportunity)

Document ID: path-A-level-2

{  
  "type": "question",  
  "insight": "Insight: Research shows 80% of AI projects fail to deliver value, often because they solve the wrong problem.",  
  "text": "Are you looking to identify a *new* high-value project, or do you have a specific project idea in mind already?",  
  "options": [  
    {  
      "text": "I need to find and prioritize new, high-value projects.",  
      "next_node": "path-A1-level-3"  
    },  
    {  
      "text": "I have a specific project idea that needs to be scoped.",  
      "next_node": "path-A2-level-3"  
    }  
  ]  
}  
  

Document ID: path-A1-level-3

{  
  "type": "data_capture",  
  "insight": "Key Finding: The highest-value projects are often 'Soft ROI' initiatives. A peer university increased enrollment by 3.3% not by cutting costs, but by building an AI to improve student retention.",  
  "text": "Let's explore that. What is the *single biggest operational drag* or *missed opportunity* you see in your area of responsibility right now?",  
  "capture_config": {  
    "type": "textarea",  
    "placeholder": "e.g., 'Manually processing student applications', 'High student drop-off after first year', 'Wasting researcher time on grant admin'...",  
    "key": "opportunity_statement"  
  },  
  "next_node": "lead-capture"  
}  
  

Document ID: path-A2-level-3

{  
  "type": "data_capture",  
  "insight": "To succeed, a project must be vetted against a Value vs. Complexity matrix. Let's get a baseline for your idea.",  
  "text": "What is the working title or brief description of your project idea?",  
  "capture_config": {  
    "type": "text",  
    "placeholder": "e.g., 'Admissions document processing bot', 'AI-powered career advisor'",  
    "key": "project_name"  
  },  
  "next_node": "lead-capture"  
}  
  

### Path B (Risk)

Document ID: path-B-level-2

{  
  "type": "question",  
  "insight": "Insight: The #1 risk in AI is not 'rogue AI,' it's data leakage. A single incident involving sensitive student or financial data can cause millions in reputational and legal damage.",  
  "text": "Is your primary concern the *ethical* risk (e.g., bias, fairness) or the *technical/data* risk (e.g., privacy, security breaches)?",  
  "options": [  
    {  
      "text": "Ethical & Reputational Risk (e.g., biased decisions, lack of transparency).",  
      "next_node": "path-B1-level-3"  
    },  
    {  
      "text": "Data & Security Risk (e.g., data leaks, privacy, compliance).",  
      "next_node": "path-B2-level-3"  
    }  
  ]  
}  
  

Document ID: path-B1-level-3

{  
  "type": "data_capture",  
  "insight": "A peer, Deakin University, faced a public failure when its chatbot gave incorrect and harmful advice. This was a failure of governance, not just technology.",  
  "text": "What type of high-stakes decisions do you worry about AI making? (Select all that apply)",  
  "capture_config": {  
    "type": "multiselect",  
    "options_source": "template:AI_Risk_Assessment_Template.md:high_stakes_decisions",  
    "key": "ethical_concerns"  
  },  
  "next_node": "lead-capture"  
}  
  

Document ID: path-B2-level-3

{  
  "type": "question",  
  "insight": "Framework: All data must be classified. Public AI tools are *prohibited* for 'Protected' (e.g., PII) and 'Restricted' (e.g., sensitive IP) data.",  
  "text": "Realistically, will your AI initiatives need to access sensitive student, staff, or research data to be useful?",  
  "options": [  
    {  
      "text": "Yes, access to sensitive data is essential.",  
      "next_node": "path-B2.1-level-4"  
    },  
    {  
      "text": "No, we can operate effectively with public or anonymized data.",  
      "next_node": "path-B2.2-level-4"  
    }  
  ]  
}  
  

Document ID: path-B2.1-level-4

{  
  "type": "output",  
  "insight": "This is the highest-risk, highest-value scenario. You cannot use public tools.",  
  "diagnosis": "Your path requires a 'Secure Enclave' approach. Our 2-3 week Diagnostic will focus on a full security and compliance audit, assessing your data against the **OWASP Top 10 for LLMs** and defining the technical architecture needed to proceed safely.",  
  "output_template_id": "GenAI_Security_Checklist.md",  
  "next_node": null  
}  
  

Document ID: path-B2.2-level-4

{  
  "type": "output",  
  "insight": "This is a lower-risk scenario, but reputational risk (like the Deakin failure) is still high.",  
  "diagnosis": "Your focus is on public-facing data and tools. Our 2-3 week Diagnostic will focus on 'reputational risk,' vetting your data sources and building governance to ensure your AI provides accurate, safe information.",  
  "output_template_id": "AI_Risk_Assessment_Template.md",  
  "next_node": null  
}  
  

### Path C (Investment)

Document ID: path-C-level-2

{  
  "type": "question",  
  "insight": "Insight: Traditional ROI models fail for AI. The real value is often 'Soft ROI'—like improving student retention—which *directly* drives revenue.",  
  "text": "Are you focused on building the business case for a *specific project*, or defining the *overall, long-term* competitive investment strategy?",  
  "options": [  
    {  
      "text": "Building a business case for a specific project (Project ROI).",  
      "next_node": "path-C1-level-3"  
    },  
    {  
      "text": "Defining the long-term capital investment (Competitive Strategy).",  
      "next_node": "path-C2-level-3"  
    }  
  ]  
}  
  

Document ID: path-C1-level-3

{  
  "type": "data_capture",  
  "insight": "Example: Georgia State University's AI project delivered a 3.3% enrollment increase by focusing on the 'Soft ROI' metric of student retention.",  
  "text": "Which 'Soft ROI' metrics would be most valuable for your business case? (Select all that apply)",  
  "capture_config": {  
    "type": "multiselect",  
    "options_source": "template:Value_Realization_Plan_Template.md:soft_roi_metrics",  
    "key": "soft_roi_metrics"  
  },  
  "next_node": "lead-capture"  
}  
  

Document ID: path-C2-level-3

{  
  "type": "data_capture",  
  "insight": "Fact: Key competitors (like Monash, Sydney) are building multi-million dollar, "Sovereign" AI infrastructure. This creates a 'Technology Deficit' that must be addressed.",  
  "text": "This forces a fundamental choice. What is your *initial* leaning? (This is non-binding)",  
  "capture_config": {  
    "type": "radio",  
    "options_source": "template:Strategic_Choice_Brief_Template.md:pathways",  
    "key": "strategic_leaning"  
  },  
  "next_node": "lead-capture"  
}  
  

### Lead Capture & Output Nodes

Document ID: lead-capture

{  
  "type": "lead_capture_form",  
  "insight": "Your diagnosis is ready.",  
  "text": "Please provide your details to see your recommended action plan and start the analysis.",  
  "next_node": null  
  // After this form, the app logic will look at the *previous* node  
  // to determine which *final* 'output' node to load.  
  // e.g., if previous node was 'path-A1-level-3', load 'path-A1-level-4-output'.  
  // This requires a bit of state management in the app.  
}  
  

(You will need to create the final "output" nodes for the paths that end in lead-capture. I'll provide two examples, the rest follow the same pattern.)

Document ID: path-A1-level-4-output

{  
  "type": "output",  
  "insight": "This is an 'Ideation & Prioritization' challenge.",  
  "diagnosis": "You've identified a key problem area. Our 2-3 week Diagnostic will rapidly workshop this, benchmark it against peer successes (like GSU's 3.3% enrollment uplift), and deliver a costed MVAIP Charter.",  
  "output_template_id": "Peer_Analysis_Template.md",  
  "next_node": null  
}  
  

Document ID: path-C1-level-4-output

{  
  "type": "output",  
  "insight": "This is a 'Value & ROI' challenge.",  
  "diagnosis": "Your focus on 'Soft ROI' is correct. Our 2-3 week Diagnostic will use these metrics as a starting point to build a full, data-backed business case and Value Realization Plan for your leadership.",  
  "output_template_id": "Value_Realization_Plan_Template.md",  
  "next_node": null  
}  
  

## PART 2: FIRESTORE DATA (templates collection)

Create a collection named templates. Create one document for each ID below, using the provided data.

Document ID: MVAIP_Charter_Template.md

{  
  "content": "# AI Project Charter: Minimum Viable AI Product (MVAIP)\n\nThis charter serves as the primary initiation document for review by the AI Steering Committee.\n\n## 1. Project Definition\n\n| Attribute | Value |\n| :--- | :--- |\n| **MVAIP Project Name:** | `[Enter Project Name]` |\n| **Project Sponsor:** | `[Name, Title]` |\n| **Project Lead:** | `[Name, Title]` |\n| **Date of Submission:** | `[Date]` |\n\n## 2. Strategic Alignment\n\nIdentify the primary strategic pillar this MVAIP supports:\n* [ ] **Intelligent Operations & Administration**\n* [ ] **Personalised & Scalable Student Journey**\n* [ ] **Accelerated Research & Discovery**\n\n**Problem Statement:**\n`[Briefly describe the specific institutional problem this project solves.]`\n\n## 3. Value vs. Complexity Assessment\n\n| **Value (High/Med/Low)** | **Complexity (High/Med/Low)** |\n| :--- | :--- |\n| `[e.g., High]` | `[e.g., Low]` |\n| **Value Justification:** `[Justify the value rating. Reference Hard/Soft ROI.]` | **Complexity Justification:** `[Justify the complexity. Note data readiness, tech requirements, and required skills.]` |\n",  
  "data_extracts": null  
}  
  

Document ID: Peer_Analysis_Template.md

{  
  "content": "# AI Peer Case Study Analysis Template\n\nThis template is used to formally analyze AI projects from peer institutions to extract actionable lessons.\n\n## 1. Case Study Overview\n\n| Attribute | Value |\n| :--- | :--- |\n| **Institution:** | `[e.g., Georgia State University]` |\n| **Project Name:** | `[e.g., 'Pounce' Chatbot]` |\n| **Domain:** | `[e.g., Student Support & Retention]` |\n\n**Project Summary:**\n`[Describe the project's goal, function, and target users.]`\n\n## 2. Outcome Analysis\n\n**Stated Outcome:** [ ] Success [ ] Failure [ ] Mixed\n\n**Evidence of Outcome:**\n`[Provide the key metric or qualitative result. e.g., 'Led to a 3.3% enrollment increase over 4 years.']`\n\n## 3. Key Actionable Lessons\n\n**Lesson 1 (Do This):**\n`[e.g., 'Lesson: Proactive, personalized student support provides a massive, measurable Soft ROI in retention.']`\n\n**Lesson 2 (Avoid This):**\n`[e.g., 'Lesson: Never connect an AI to an unvetted internal knowledge base. The primary risk is data quality, not the AI model.']`\n",  
  "data_extracts": null  
}  
  

Document ID: AI_Risk_Assessment_Template.md

{  
  "content": "# AI Project Risk Assessment Form\n\nThis form is a mandatory component of the **Federated Governance Model**. It must be completed before project commencement.\n\n## 1. Project & Data Identification\n\n| Attribute | Value |\n| :--- | :--- |\n| **Project Name:** | `[Enter Project Name]` |\n| **Data Classification:** | `[Identify the highest data tier (Tier 1-4) used by the system.]` |\n\n## 2. AI Ethics & Principles Review\n\nDescribe how the project actively upholds the five core ethical principles.\n\n| **Principle** | **Adherence & Mitigation Strategy** |\n| :--- | :--- |\n| **1. Beneficial** | `[How does this project demonstrably benefit students, staff, or research? What safeguards prevent harm?]` |\n| **2. Fair** | `[What is the plan to identify and mitigate algorithmic bias? How will training data be vetted for fairness?]` |\n| **3. Transparent** | `[How will users be notified they are interacting with an AI? How will the system's decisions be explained?]` |\n| **4. Accountable** | `[Who is the designated individual accountable for the AI's outputs? What is the human-in-the-loop mechanism?]` |\n| **5. Contestable** | `[What is the clear, advertised process for a user (student/staff) to appeal or challenge the AI's decision or output?]` |\n\n## 3. Final Risk Rating\n\n* [ ] **Low Risk:** (e.g., Internal process automation, non-PII data)\n* [ ] **Medium Risk:** (e.g., Advisory systems, student-facing tools)\n* [ ] **High Risk:** (e.g., High-stakes decisions like admissions/grading, sensitive data)\n",  
  "data_extracts": {  
    "high_stakes_decisions": [  
      "Admissions or Hiring",  
      "Student Grading or Assessment",  
      "Financial Aid or Scholarships",  
      "Student/Staff Disciplinary Actions",  
      "Sensitive Medical or Mental Health Analysis"  
    ]  
  }  
}  
  

Document ID: Strategic_Choice_Brief_Template.md

{  
  "content": "# Decision Brief: AI Strategic Technology Pathway\n\n**TO:** C-Suite / AI Steering Committee\n**SUBJECT:** Selection of a 5-Year Strategic AI Technology Pathway\n\n## 1. The Strategic Imperative\n\nThe AI Maturity Peer Analysis confirms we have a **'Technology Deficit'** compared to peers who are investing millions in sovereign compute. This forces a fundamental, long-term strategic choice.\n\n## 2. Pathway 1: Sovereign Infrastructure\n* **Description:** Compete directly by funding and building our own, large-scale AI compute infrastructure.\n* **Pros:** Full autonomy; research leadership; data sovereignty.\n* **Cons:** Extremely high capital/operating cost; long lead time; high-risk of technological obsolescence.\n\n## 3. Pathway 2: Enterprise Partnership\n* **Description:** Accept platform dependency. Build our AI ecosystem exclusively on a major vendor's stack (e.g., Microsoft Azure, Google Cloud).\n* **Pros:** Rapid deployment; lower initial cost; access to state-of-the-art models.\n* **Cons:** Vendor lock-in; data sovereignty risks; usage-based costs can spiral.\n\n## 4. Pathway 3: Niche Leadership (Governance & Application)\n* **Description:** Cede the infrastructure race. Focus investment on being a world-leader in the *application* and *governance* of AI. Differentiate by building secure, ethical, human-centric systems on top of commodity vendor models.\n* **Pros:** Aligns with core mission; lower cost; strong reputational and ethical branding.\n* **Cons:** Cedes 'big model' research leadership; may be perceived as less ambitious.\n",  
  "data_extracts": {  
    "pathways": [  
      "Pathway 1: Sovereign Infrastructure (Build our own)",  
      "Pathway 2: Enterprise Partnership (Rely on a vendor)",  
      "Pathway 3: Niche Leadership (Focus on governance & application)"  
    ]  
  }  
}  
  

Document ID: Value_Realization_Plan_Template.md

{  
  "content": "# AI Project: Value Realization Plan\n\nThis plan defines *how* the value of an AI project will be measured, with a focus on the **Hybrid ROI Model** that prioritizes mission-centric outcomes.\n\n## 1. Project Overview\n\n| Attribute | Value |\n| :--- | :--- |\n| **Project Name:** | `[Enter Project Name]` |\n\n## 2. Hard ROI (Financial Metrics)\n\n*These are quantitative measures of financial efficiency or gain.*\n\n| **Metric** | **Baseline (Current State)** | **Target (Post-Implementation)** |\n| :--- | :--- | :--- |\n| **Cost Avoidance** | `[e.g., $X spent on Y process]` | `[e.g., $Y saved]` |\n| **Efficiency Gain** | `[e.g., Z hours/week spent on task]` | `[e.g., Z-10 hours/week]` |\n| **Enrollment/Revenue** | `[e.g., X% conversion/retention]` | `[e.g., X+1% conversion/retention]` |\n\n## 3. Soft ROI (Mission-Critical Metrics)\n\n*This is the primary measure of value. Select the metrics that align with the university's core mission.*\n\n| **Metric** | **Baseline (Current State)** | **Target (Post-Implementation)** |\n| :--- | :--- | :--- |\n| **Student Retention** | `[e.g., X% drop-off at Y milestone]` | `[e.g., X-0.5% drop-off]` |\n| **Student Satisfaction** | `[e.g., Y% score on student feedback]` | `[e.g., Y+5% score]` |\n| **Faculty/Staff Time Reclaimed** | `[e.g., X hours/week on admin]` | `[e.g., Y hours freed for research/teaching]` |\n| **Research Output** | `[e.g., Avg. time to X discovery]` | `[e.g., Reduced time to X]` |\n",  
  "data_extracts": {  
    "soft_roi_metrics": [  
      "Student Retention",  
      "Student Satisfaction",  
      "Faculty/Staff Time Reclaimed",  
      "Research Output",  
      "Ethical Compliance / Risk Reduction"  
    ]  
  }  
}  
  

Document ID: GenAI_Security_Checklist.md

{  
  "content": "# GenAI Security & Compliance Checklist\n\nThis checklist is a mandatory tool based on the **AI Security & Data Governance Framework**. It must be completed by the Project Lead.\n\n## 1. Data Classification & Handling\n\n* [ ] **Data Classified:** All data used for training, fine-tuning, or RAG has been classified using the **Tier 1-4 Data Classification Framework**.\n* [ ] **Highest Data Tier Identified:** `[Specify Tier 1, 2, 3, or 4]`\n* [ ] **Public GenAI Prohibition:** I confirm this project **DOES NOT** involve inputting **Tier 3 (Protected)** or **Tier 4 (Restricted)** data into any public, third-party Generative AI service.\n* [ ] **Data Minimization:** The project uses the absolute minimum data necessary for its function.\n\n## 2. Secure AI Environment\n\n* [ ] **Secure Environment:** The AI model and data are hosted in a university-approved secure environment (e.g., secure private cloud, on-premise).\n* [ ] **Access Control:** Access to the model, its APIs, and its training data is restricted to named, authorized personnel.\n* [ ] **Secure Knowledge Base:** If using RAG, the knowledge base has been vetted, cleansed, and secured against unauthorized access.\n\n## 3. OWASP Top 10 for LLMs Mitigation\n\n*This section addresses key application-layer risks.*\n\n* [ ] **Prompt Injection:** Input validation and sanitization are in place.\n* [ ] **Insecure Output Handling:** Outputs from the LLM are sanitized before being passed to back-end systems.\n* [ ] **Data Poisoning:** Training data sources are vetted and secured.\n* [ ] **Sensitive Information Disclosure:** The model has been tested (e.g., red-teamed) to ensure it does not leak sensitive, PII, or confidential information.\n",  
  "data_extracts": null  
}  
  


**