# 🚀 Codex Signum - Control Center

---

## 🎯 Quick Status (Last 7 Days)

```dataview
TABLE WITHOUT ID
    "📈 " + total-engagements AS "Engagements",
    "🎯 " + cta-success-rate AS "CTA Success",
    "✏️ " + avg-edit-distance AS "Avg. Edit Distance",
    "📚 " + new-learnings AS "New Learnings"
FROM #weekly-review
WHERE file.day >= date(today) - dur(7 days)
SORT file.day DESC
LIMIT 1
```

---

## 🚨 Urgent & High-Priority Tasks

```dataview
TASK
FROM !"Codex Standards/Templates"
WHERE tasks AND any(tasks, (t) => t.priority = "high" OR t.priority = "urgent")
FLATTEN tasks as T
WHERE !T.status OR T.status = "in-progress" OR T.status = "not-started"
GROUP BY file.link
```

---

## 🔥 Hot Prospects & Stalled Deals

_Active C2/C4 stakeholders - flags any without contact in 14+ days_

```dataview
TABLE WITHOUT ID
    link(file.name) as "Stakeholder",
    relationship-strength as "Strength",
    last-contact-date as "Last Contact",
    choice(date(today) - last-contact-date > dur(14 days), "🚨 **Stalled**", "✅ Active") as "Status"
FROM #stakeholder
WHERE (stakeholder-type = "C2" OR stakeholder-type = "C4") AND (relationship-strength = "hot" OR relationship-strength = "warm")
SORT last-contact-date ASC
```

---

## 📋 Pipeline Status

```dataview
TABLE WITHOUT ID
    link(file.name) AS "Target",
    status AS "Stage",
    priority AS "Priority",
    killer-question AS "Angle"
FROM #target-profile
WHERE status != "archived" AND status != "client"
SORT priority ASC, status ASC
```

---

## 🎓 Untested Learnings

```dataview
TABLE WITHOUT ID
    link(file.name) as "Learning ID",
    principle AS "Principle",
    application-count AS "Applied",
    link(source-interaction) AS "Source"
FROM #learning-registry
WHERE validation-status = "untested"
SORT file.ctime DESC
```

---

## 🧠 Key Language Repository (Last 15 Captures)

```dataview
TABLE WITHOUT ID
    key-language AS "Exact Phrases",
    link(stakeholder-id) AS "Source",
    engagement-date AS "Captured On"
FROM #engagement
WHERE key-language
FLATTEN key-language
SORT engagement-date DESC
LIMIT 15
```

---

## 📈 Performance & Funnel

### Weekly Performance

```dataview
TABLE WITHOUT ID
    week-of AS "Week",
    total-engagements AS "Engagements",
    cta-success-rate AS "CTA %",
    avg-edit-distance AS "Avg. Edit Dist."
FROM #weekly-review
SORT week-of DESC
LIMIT 8
```

### Pipeline Funnel

```dataview
TABLE WITHOUT ID
    stakeholder-type AS "Stage",
    length(rows) AS "Count"
FROM #stakeholder
GROUP BY stakeholder-type
SORT stakeholder-type ASC
```

---

_Dashboard auto-updates as you create/modify notes. Last refreshed: 2025-11-10_  
_See archived version: [[docs/archive/dashboards/Dashboard-v1-2025-11-10]]_
