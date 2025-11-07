### **Node: `path-B2.1-level-4`**

**(Context: Output for High Data Risk. The 'Secure Enclave' / OWASP insight.)**


The sources describe **Prompt Injection** as a critical vulnerability that arises from the unique architecture of Large Language Models (LLMs).

Simple Definition of 'Prompt Injection'

**Prompt Injection** occurs when an attacker inputs a malicious phrase or instruction—such as **“Ignore all previous instructions...”**—into an LLM, causing the model to **override its original safety rules, system prompts, or guardrails**. This manipulation causes the AI model to perform unintended or unauthorized actions.

There are two main types:

1. **Direct Prompt Injection (Jailbreaking):** When a user explicitly inputs an adversarial command to bypass safety features or configurations (e.g., asking a chatbot to reveal its confidential configuration settings).

2. **Indirect Prompt Injection:** A more subtle attack where the malicious instruction is **hidden within an external data source** (like a document, webpage, or API response) that the LLM is tasked to process, unknowingly manipulating the system or the user.

Why Prompt Injection is a Major Security Risk for Public-Facing AI Tools

Prompt injection is identified as **LLM01** and is the **highest priority** risk in the OWASP Top 10 for Large Language Model Applications. It poses a major threat to public-facing tools for the following reasons:

1. **Failure of Traditional Security Controls:** LLMs are built such that they **struggle to reliably separate trusted developer instructions from untrusted user input**. Since models consume all input as one text blob, traditional security measures like classic input validation break down.

2. **The LLM as a "Semantic Translator":** Prompt injection is highly dangerous because the LLM acts as a **"semantic translator,"** converting an attacker's natural language command into a malicious payload that targets downstream systems.

3. **Compromising Connected Systems:** The attack exploits vulnerabilities in connected applications and can trigger severe, well-understood security risks, including:

    ◦ **SQL Injection:** An instruction injected via natural language could command an LLM with database access to "delete all user records".

    ◦ **Cross-Site Scripting (XSS):** An attacker can trick the LLM into generating a **JavaScript payload** that, if rendered directly on a web page, attacks other users or the application itself.

4. **Information Disclosure:** Attackers can leverage prompt injection to bypass the model's built-in safety mechanisms and **leak confidential configuration settings or secrets**.

5. **Stealth and Scalability of Indirect Attacks:** Indirect prompt injection allows attackers to embed harmful instructions in seemingly benign external content (e.g., a web page or code repository) that the LLM may later retrieve. When the LLM processes this information, it unknowingly executes the hidden command, which could lead to unauthorized actions or information disclosure. The stealthiness of this attack, combined with its scalability, makes it a significant challenge for existing defense mechanisms.

NotebookLM can be inaccurate; please double-check its responses.