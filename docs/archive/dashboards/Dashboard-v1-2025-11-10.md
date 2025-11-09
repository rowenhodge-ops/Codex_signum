---
archived-date: 2025-11-10
archived-reason: Replaced with Control Center dashboard with structured tasks integration and dynamic Dataview queries
superseded-by: ../../Codex Signum - Dashboard.md
original-path: /Codex Signum - Dashboard.md
---

# [ARCHIVED] Original Dashboard (v1)

**This file is archived for historical reference only.**  
**See current dashboard: [[Codex Signum - Dashboard]]**

**Issues with this version:**

- Used `#action_item` tag that doesn't exist in templates
- Static tables instead of dynamic Dataview queries
- No task tracking integration
- Limited metrics visibility

---

### Open Action Items

```dataview
TABLE stakeholder-id, engagement-date
FROM #action_item AND !"Templates"
WHERE status != "completed"
SORT engagement-date DESC
```

### Recent Key Language Captured

| File1                                                                                                      | stakeholder-id | key-language |
| ---------------------------------------------------------------------------------------------------------- | -------------- | ------------ |
| [TPL - Engagement Note](app://obsidian.md/docs/Codex%20Standards/Templates/TPL%20-%20Engagement%20Note.md) | -              | - -          |

### Untested Learnings
