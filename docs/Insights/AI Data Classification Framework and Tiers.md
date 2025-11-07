### **Node: `path-B2-level-3`**

**(Context: Data risk. The 'Data Classification' insight.)**

The **Data Classification Framework (DCF)** is a mandatory and foundational element of effective AI data governance, especially given that AI models are trained on vast datasets which serve as a primary security and compliance risk area.

What is a Data Classification Framework in the Context of AI?

A Data Classification Framework is a set of policies and processes used to **organise and categorize data assets** based on predefined criteria such as sensitivity, importance, and value to the organization.

In the context of AI, the DCF is essential because:

1. **Risk Mitigation:** Data is not just an input; it is the **foundational training material** and a **primary attack surface** for AI systems. Classification is the mechanism that ensures security measures are applied appropriately for each data type.

2. **Critical Questions:** It allows an organization to systematically answer three critical questions for data destined for an AI system: **What type of data is it, how sensitive is it, and who should have access to it?**.

3. **Compliance Prerequisite:** Classification is crucial for demonstrating compliance with global regulations, such as **GDPR, HIPAA**, and the **Australian Privacy Principles (APPs)**, by providing visibility into where sensitive data resides and ensuring appropriate security controls are in place.

4. **High Watermark Principle:** The overall security requirement for a dataset is determined by the **High Watermark Principle**, which dictates that the system or dataset's overall classification is determined by the **highest impact rating** across any of the core security principles (Confidentiality, Integrity, or Availability).

--------------------------------------------------------------------------------

Summary of Data Sensitivity Tiers (The Four-Tier Model)

The sources detail a rigorous four-tier model that dictates the required security controls and permissible use in AI projects. For internal AI development, rigorous application of this framework is required for every project. For public GenAI tools, policies explicitly **prohibit** the input of Tier 3 and Tier 4 data.

|   |   |   |   |   |
|---|---|---|---|---|
|Tier/Level|Description of Sensitivity and Risk|Examples of Data Included|AI Usage Restrictions|Source(s)|
|**Tier 1: Public / Unrestricted**|**Lowest level of classification**. Information intended for public distribution or carrying **no significant risk** if disclosed.|Marketing materials, press releases, job advertisements, public blog posts, and public website content.|**Unrestricted use** for training, fine-tuning, and RAG. May be processed with approved GenAI tools with appropriate oversight.||
|**Tier 2: Internal / Limited / Sensitive**|Information intended for use **within the organization** only. Unauthorized disclosure would likely cause only **minor operational disruption or reputational harm**.|Internal communications/memos, non-public operational data, employee directories (excluding highly sensitive data), and internal project reports.|Use is permissible for training **internal-facing AI models**. Prohibited for training external-facing models without explicit approval. May be processed with enhanced oversight and content review.||
|**Tier 3: Restricted / Confidential**|**Sensitive information** intended only for specific individuals with a "business need to know." Unauthorized access could lead to **legal penalties, significant financial loss, or damage to reputation**.|Company **intellectual property**, customer lists, internal financial records, proprietary source code, and combined Personally Identifiable Information (PII) that could lead to identity theft (e.g., name, birthdate, and address).|**Prohibited for direct use** in training. Permitted only after **de-identification** (anonymization/pseudonymization) and with explicit approval from the Data Owner. Must not be inputted into **any public GenAI tool**.||
|**Tier 4: Highly Restricted / Critical**|**Highest classification level**. Unauthorized disclosure leads to **severe legal consequences, catastrophic financial loss, or direct harm**. This data is often protected by stringent regulations (e.g., HIPAA).|**Protected Health Information (PHI)**, full Social Security Numbers (SSNs), **credit card numbers (PCI data)**, private encryption keys, biometric data, and system credentials.|**Strictly prohibited for direct use** in training. Use is only permissible via approved **Privacy-Enhancing Technologies (PETs)** (e.g., synthetic data generation, differential privacy) and requires a formal **Privacy Impact Assessment (PIA)** and approval from the highest governance body.||

NotebookLM can be inaccurate; please double-check its responses.