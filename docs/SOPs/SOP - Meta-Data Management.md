## Step 1: Create a New Engagement Note

- Before or right after a meeting trigger Templater.
- Create a new note titled `C2 - Name - Title`.
- Templater automatically inserts the `TPL - Engagement Note.md` content. The date is already filled in.

## Step 2: Fill in the Metadata to commit to the Codex

- You immediately fill out the YAML frontmatter. 
	- Link the `stakeholder-id: "[[C2 - Anthony Autore]]"`.
	- List the `#messy_problems` and `#key_language` in the structured list format.
## Step 3: Link & Tag While You Write

- As you write your notes in the body, you continue to use the other two tiers of our system:
    - **Tier 2 (Wiki-Links):**
	    - You mention his CFO? You write `[[Peter Kearney]]`. You discuss a specific SOP?
	    - You write `[[SOP - Engagement Pathways]]`.
    - **Tier 1 (Hashtags):**
	    - You identify a potential risk not captured in the metadata? You write a line and add `#red_flag`.

## Step 4: The Payoff - Your Automated Dashboard

- You create one new note called `Dashboard`. In this note, you place a few Dataview queries.

````markdown
### Open Action Items
```dataview
TABLE stakeholder-id, engagement-date
FROM #action_item AND !"Templates"
WHERE status != "completed"
SORT engagement-date DESC
````

### Recent Key Language Captured

|File1|stakeholder-id|key-language|
|---|---|---|
|[TPL - Engagement Note](app://obsidian.md/docs/Codex%20Standards/Templates/TPL%20-%20Engagement%20Note.md)|-|- -|

### Untested Learnings

Dataview: No results to show for list query.

This dashboard will **automatically update** every time you create or modify a note. Your action items will appear, your latest insights will be surfaced, and your key language repository will grow. This is the "living system."

By combining **Templater** (for consistent input), **Linter** (for data quality), and **Dataview** (for intelligent output), you create a robust, practical, and low-friction system. You spend less time organizing and more time analyzing the connections that your system automatically reveals. This is the fastest path to building your Codex.