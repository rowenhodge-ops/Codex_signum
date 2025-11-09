# Design Alignment Summary

**Date**: October 14, 2025  
**Status**: Complete

---

## 🎯 Overview

This document summarizes the comprehensive alignment of Kore's project plan and task specifications with the UX/UI research findings and AI humanization guidelines documented in:

- `docs/UIUX Research & Strategic Recommend.md`
- `docs/The comprehensive details below out.md`

---

## 📋 Documents Updated

### 1. Project Plan (`docs/project-plan.md`)

**New Section Added**: "Design Philosophy & UX Principles"

Key additions:

- **Cognitive Load Minimization**: Hierarchy-first design, single-column content (45rem max-width), generous whitespace
- **Dark Theme Excellence**: Specific color tokens (#1E1E1E, #252526), text hierarchy (87%/60% white opacity), WCAG AA compliance
- **Trust Through Transparency**: Granular citations, visual confidence indicators, close the Trust-Verification Gap
- **Editor-First Interactions**: Hybrid live preview, click-to-edit link behavior (Cmd+Click to follow), [[link]] autocomplete patterns
- **AI Output Humanization**: Flag AI telltales, prompt for empathy, vary structure, verify before presenting

### 2. Task 001: Multi-Model Chat Foundation

**New Section Added**: "Design & UX Guidelines"

Integrated:

- Hierarchy-first layout rules with specific measurements
- Granular citation affordances in MessageBubble component
- Dark-theme token palette with accessibility guidance
- Input area padding and keyboard-first navigation patterns

**New Section Added**: "AI Output Humanization Requirements"

Integrated:

- Server-side post-processing hooks to reduce overused AI phrases
- Token/cost display alongside "Humanize" action pathway
- Phrase flagging system for downstream editing tools
- Persona and empathy prompt templates
- Hallucination risk tracking via citation verification

### 3. Task 002: Markdown Editor with Wiki-Style Linking

**New Section Added**: "UX/UI Implementation Guidelines"

Critical integrations:

- **Editor Interaction Model**: Click to edit, Cmd+Click to follow (resolves Obsidian's primary friction point)
- **Hover preview**: Page preview popover on link hover
- **Autocomplete UI**: Immediate [[trigger, fuzzy search, create-new option always visible
- **Live Preview Mode**: Hybrid approach with accent color tokens
- **Content Layout**: Specific max-width and spacing requirements
- **Dark Theme Tokens**: Surface colors, syntax palette, focus indicators
- **Accessibility tests**: WCAG 2.2 contrast ratio verification

### 4. Task 005: Document Generation Tool

**New Section Added**: "Humanization & Quality Controls"

Integrated:

- Post-processing with linguistic heuristics from AI tics document
- "Humanize" review step with persona/empathy prompt options
- Citation verification before save (flag missing sources)
- Sentence structure variation tracking
- Logging system for flagged terms and user overrides

### 5. Task 008: RAG Foundation with Citations

**New Section Added**: "Citation UX Guidelines (Critical Differentiator)"

This is the most strategically important addition:

- **Granular Inline Citations**: Sentence-level mapping with hover popovers showing direct quotes
- **Visual Indicators**: Solid underline (direct quote) vs. dashed (synthesis), color-coded confidence
- **Trust-Verification Gap Solution**:
  - "View in Context" button for each citation
  - Hallucination detection when claims can't be traced to sources
  - Source quality signals (warn if citing AI-generated content)
  - Distinction between context (retrieved) and citation (used)
- **Visual Design**: Grounded badge, collapsible citation panel, WCAG accessibility
- **Testing**: Granular citation hover tests, hallucination detection tests

### 6. Task 010: Command Palette

**New Section Added**: "UX/UI Implementation Guidelines"

Integrated:

- Command palette as universal interaction layer (inspired by Linear/Arc Browser analysis)
- Specific visual design metrics (600px max-width, 8-10 visible items, category grouping)
- Keyboard navigation requirements (arrow keys, Enter, Escape, Tab)
- Accessibility requirements (focus management, screen reader support, 4.5:1 contrast)
- Performance targets (<100ms open latency, <50ms fuzzy search)

---

## 🎨 Key Design Principles Established

### 1. Cognitive Load Reduction

- Every UI element must justify its existence (default action: remove, not add)
- Single-column content with 45rem (720px) max-width for optimal line length
- Consistent spacing system via design tokens

### 2. Dark Theme System

- **Never use pure black** (#000000) - use #1E1E1E / #252526 for surfaces
- Text at 87% white (high emphasis) and 60% white (medium emphasis)
- Desaturated accent colors meeting 4.5:1 contrast ratio
- Focus indicators: 2px outline, 2px offset, :focus-visible only

### 3. Trust & Verification

- **Close the Trust-Verification Gap**: Move beyond Perplexity's coarse citations
- Granular, sentence-level citations with hover-to-verify interaction
- Visual confidence indicators (solid vs. dashed underlines)
- Explicit hallucination detection and warnings

### 4. Editor Interactions

- **Resolve link interaction conflict**: Click to edit, Cmd+Click to navigate (writer-first)
- Hybrid live preview (render Markdown, show syntax on active line)
- [[Link]] autocomplete with fuzzy search and create-new option
- Hover previews for context without navigation

### 5. AI Humanization

- **Flag 20+ overused AI phrases**: "unlock", "leverage", "in today's fast-paced world", etc.
- **Prompt strategies**: Persona adoption, first-person shift, empathy layering, varied structure
- **Verification requirement**: Every AI claim must trace to source document
- **Quality controls**: Repetitive structure detection, filler word removal, trust element insertion

---

## 📊 Strategic Differentiators

Based on competitive analysis of Perplexity, Obsidian, Notion, Linear, and Arc Browser:

| Feature             | Kore Approach                                     | Competitor Weakness Addressed                          |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| **Citations**       | Granular, sentence-level with hover verification  | Perplexity's coarse-grained "illusion of verification" |
| **Link Editing**    | Click to edit, Cmd+Click to follow                | Obsidian's single-click-follows friction               |
| **AI Output**       | Linguistic humanization with phrase flagging      | Generic AI voice across all tools                      |
| **Command Palette** | Universal Cmd+K for all actions + content         | Notion's limited quick switcher                        |
| **Dark Theme**      | Research-backed color system (not inverted light) | Inconsistent contrast ratios                           |
| **Accessibility**   | WCAG 2.2 compliant from day one                   | Often added as afterthought                            |

---

## ✅ Implementation Checklist

For each task implementation, developers must:

- [ ] Reference the appropriate research document sections
- [ ] Apply design tokens for colors, spacing, typography
- [ ] Implement accessibility requirements (contrast ratios, focus indicators, screen reader support)
- [ ] Follow the specific interaction patterns documented (click behaviors, keyboard shortcuts)
- [ ] Add the corresponding test cases (manual and automated)
- [ ] Validate against the documented UX principles before PR review

---

## 🔗 Cross-References

| Research Document                      | Relevant Tasks                       |
| -------------------------------------- | ------------------------------------ |
| UIUX Research & Strategic Recommend.md | All tasks (design foundation)        |
| The comprehensive details below out.md | Task 001, 005, 007 (AI output tasks) |
| Perplexity Analysis                    | Task 001, 008 (chat & citations)     |
| Obsidian Analysis                      | Task 002 (editor & linking)          |
| Linear/Arc Analysis                    | Task 010 (command palette)           |
| Material Design Dark Theme             | All tasks (color system)             |
| WCAG 2.2 Guidelines                    | All tasks (accessibility)            |

---

## 📝 Notes for Development

1. **Design Tokens First**: Before implementing any UI component, ensure design tokens are defined in `src/styles/tokens.css` or equivalent
2. **Accessibility Non-Negotiable**: All color combinations must pass WCAG contrast checks before merging
3. **Test with Real Content**: Test with 500+ notes, 10,000+ word documents, 100+ citations to validate performance
4. **Dogfood Early**: Core team must use the application daily starting from Week 2 of Phase 1
5. **Iterate Based on Friction**: Any repeated point of confusion from dogfooding triggers immediate UX review

---

## 🚀 Next Actions

1. **Phase 1, Week 1**: Implement design token system and core component library adhering to established principles
2. **Phase 1, Week 2-3**: Build Task 001 and Task 002 with full UX/UI guidelines integration
3. **Phase 1, Week 4**: Begin internal dogfooding and collect usability feedback
4. **Phase 2**: Implement advanced features (RAG with granular citations, document generation with humanization)

---

**Document Owner**: Development Team  
**Last Review**: October 14, 2025  
**Next Review**: After Phase 1 completion (4 weeks)
