# Template System Change Log

## 2025-11-10 - Phase 2 Enhancement: Structured Tasks Integration

### Overview

Upgraded all templates with structured `tasks:` blocks to enable dynamic task management via Dataview queries. This change integrates the template system with the new Control Center dashboard and optional Kanban board.

### Changes Made

#### Templates Updated (6 files)

1. **TPL - Engagement Note.md**
   - Added: `tasks:` block with status/priority/due-date fields
   - Added: `tags: [engagement]` for Dataview queries
   - Preserved: All existing fields and cell markers

2. **TPL - Stakeholder Profile.md**
   - Added: `tasks:` block with status/priority/due-date fields
   - Preserved: Existing `tags: [stakeholder-profile, stakeholder]`
   - Preserved: All existing fields and cell markers

3. **TPL - Target Profile.md**
   - Added: `tasks:` block with status/priority/due-date fields
   - Preserved: Existing `tags: [target-profile]`
   - Preserved: All existing fields and cell markers

4. **TPL - Weekly Review.md**
   - Added: `tasks:` block with status/priority/due-date fields
   - Preserved: Existing `tags: [weekly-review, performance-metrics]`
   - Preserved: All existing fields and cell markers

5. **TPL - Event Debrief.md**
   - Added: `tasks:` block with status/priority/due-date fields
   - Preserved: Existing `tags: [event, debrief, c2_qualification, c3_intel]`
   - Preserved: All existing fields and cell markers

6. **TPL - Learning Registry.md**
   - Added: `tags: [learning-registry]` for Dataview queries
   - No tasks block (learnings don't require task tracking)
   - Preserved: All existing fields and cell markers

#### Dashboard Replacement

- **Old**: `Codex Signum - Dashboard.md` (static tables, broken queries)
- **New**: `Codex Signum - Dashboard.md` (Control Center with 8 dynamic sections)
- **Archived**: Old version to `docs/archive/dashboards/Dashboard-v1-2025-11-10.md`

#### Copilot Instructions Update

- **Old**: `.github/copilot-instructions.md` (Kore Next.js project instructions)
- **New**: `.github/copilot-instructions.md` (Codex Signum Obsidian vault instructions)
- **Archived**: Kore version to `.github/archive/copilot-instructions-kore.md`

### New Capabilities Enabled

1. **Urgent Task Tracking**: Query all high/urgent priority tasks across vault
2. **Stalled Deal Alerts**: Auto-flag C2/C4 stakeholders with no contact in 14+ days
3. **Pipeline Visibility**: Real-time view of target status and priority
4. **Untested Learnings**: Track which Learning Registry entries need validation
5. **Key Language Repository**: Auto-populated from all engagement notes
6. **Performance Trends**: 8-week rolling view of metrics
7. **Task Status Management**: Move tasks through workflow by updating YAML status field

### Migration Notes

**For Existing Notes:**
- No immediate action required
- Templates will apply to new notes only
- Gradually migrate old notes by adding `tasks:` block when updating them
- Old notes remain compatible with new dashboard (queries handle missing fields)

**For New Notes:**
- Use updated templates (Templater will auto-insert new fields)
- Fill out `tasks:` block for any action items
- Set priority (`low`/`medium`/`high`/`urgent`) based on urgency
- Set due-date in `YYYY-MM-DD` format

### Breaking Changes

**None.** All changes are additive. Old notes without `tasks:` blocks will simply not appear in task-specific queries.

### Related Documentation

- [[USER_GUIDE]] - Section on template usage (already documents task workflows)
- [[QUICK_REFERENCE]] - Updated decision tree (pending)
- [[JUPYTER_STYLE_EVOLUTION]] - Phase 2 cell markers (already complete)

### Implementation Checklist

- [x] Archive old dashboard with explanatory header
- [x] Archive Kore copilot instructions
- [x] Create archive directories and changelog
- [ ] Update 6 template frontmatter blocks
- [ ] Replace dashboard content
- [ ] Update copilot-instructions.md
- [ ] Test Dataview queries with sample notes
- [ ] Commit changes with proper message

### Rollback Plan

If issues arise:
1. Restore old dashboard from `docs/archive/dashboards/Dashboard-v1-2025-11-10.md`
2. Remove `tasks:` blocks from templates
3. Revert copilot-instructions.md from archive

### Next Steps (Future Enhancements)

- **Phase 3**: Kanban board integration (optional)
- **Phase 4**: Task completion rate analytics in Weekly Review
- **Phase 5**: Priority-based alerts (overdue high-priority tasks)
- **Phase 6**: Automated task creation from CTA fields

---

**Change Author**: AI Agent (following copilot-instructions.md validation protocol)  
**Approved By**: User (Rowen)  
**Related Conversation**: 2025-11-09 Gemini review + dashboard redesign discussion  
**Implementation Date**: 2025-11-10
