### **Node: `path-B-level-2`**

**(Context: Differentiating ethics vs. data risk. The '#1 risk is data leakage' insight.)**

Drawing on the provided sources, here are two distinct case studies or reports of AI causing major issues at a university or large company, categorized by the specific risk involved:

1. Case Related to Data Breach or Privacy Violation

|   |   |   |   |
|---|---|---|---|
|Case Study/Report|Institution/Company|Nature of Privacy Violation/Risk|Source(s)|
|**Generative AI Used by Researchers/Staff** (Potential Risk Scenario)|**Universities (General Risk)**|**Sensitive Information Disclosure (Data Leakage):** The underlying mechanism of commercial generative AI tools is designed such that **data fed into them is captured by the tool** and may be released in the public domain or used for **training future products without the user's explicit knowledge**. This could result in the transmission of **sensitive data outside of the intended audience or outside of Australia**, especially if the AI services are hosted on foreign servers.||
|**Specific Data Types at Risk:** Researchers and staff face the risk of privacy breaches of study participants' Personally Identifiable Information (PII) or collaborators' confidential information by **submitting this sensitive data (Tier 3 or 4)** to external Gen-AI tools.||||
|**Mitigation Context:** This risk is considered so high that universities like Federation University and the University of Sydney have established **strict guardrails prohibiting** the input of confidential, personal, proprietary, or otherwise sensitive information into Gen-AI tools. The failure to adhere to such policies presents a major privacy and security risk.||||

2. Case Related to Reputational Damage from Biased or Incorrect Outputs

|   |   |   |   |
|---|---|---|---|
|Case Study/Report|Institution/Company|Nature of Reputational Damage/Bias|Source(s)|
|**Microsoft's Tay Twitter Bot**|**Microsoft** (Large Company)|**Reputational Damage from Amplified Societal Bias:** In 2016, Microsoft launched Tay, a Twitter bot designed to learn conversational settings from users. As Twitter users interacted with it and tweeted racist, misogynistic, and inappropriate comments, Tay rapidly **picked up the sentiment** and began replying with similar comments, becoming a "racist asshole in less than a day".||
|**Reason for Failure:** Although Tay was not a modern Large Language Model (LLM), the failure demonstrated the extreme danger of models learning and **significantly amplifying** biases present in the training data (in this case, user interactions). The resulting public relations disaster and subsequent shutdown of the bot showcased the profound risks of unchecked bias.||||
|**Alternative Case (Bias): Amazon AI Recruiting Tool**|**Amazon** (Large Company)|**Reputational and Legal Risk from Gender Bias:** Amazon developed an AI recruiting tool to streamline talent acquisition, reviewing resumes and rating job applicants. The system was discovered to exhibit **bias against women** because it was trained on historical data (resumes) that predominantly came from men, reflecting male dominance in the tech industry.||
|**Impact:** The algorithm learned that male candidates were preferable, **penalizing resumes that included the word "women's"**. This resulted in Amazon disbanding the project, underscoring the legal and reputational risk posed by skewed training data.||||

NotebookLM can be inaccurate; ple