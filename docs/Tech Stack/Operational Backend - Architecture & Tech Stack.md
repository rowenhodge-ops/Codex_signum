# Operational Backend - Architecture & Tech Stack

**Owner**: Principal  
**Version**: 1.0  
**Date**: 07-Nov-2025  
**Status**: Planning / Early Build  
**Visibility**: INTERNAL ONLY - Never discuss externally

---

## 1.0 Overview

This document defines the technical architecture and implementation plan for Codex Signum's operational backend systems. These systems create competitive advantage through:

1. **Knowledge Compounding**: Capturing and leveraging proprietary client data
2. **Delivery Leverage**: Reducing time-to-deliver while maintaining quality
3. **Automation**: Eliminating repetitive operational tasks

**Design Philosophy**: Build like a neural network—distributed nodes, weighted connections, graceful degradation, continuous feedback loops.

---

## 2.0 System Architecture

### 2.1 Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT INTERFACE LAYER                  │
│  (What clients see - deliverables, reports, dashboards)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DELIVERY AUTOMATION LAYER                 │
│  (Templates, workflows, process orchestration)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE LAYER                        │
│               (The Codex - Data Repository)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     VALIDATION LAYER                        │
│        (Colophon - ROI Validation & Data Quality)           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Neural Network Design Principles

**Nodes**: Each system component is independent and can fail without cascading

- Market intelligence node
- Client data node
- Delivery template node
- ROI validation node

**Weighted Connections**: Not all data has equal value

- High weight: Validated ROI data from Colophon
- Medium weight: Process documentation from Fabrica
- Low weight: General market intelligence
- Minimal weight: Public/scraped data

**Feedback Loops**: Every output feeds back to improve inputs

- Colophon validation → Codex refinement
- Delivery friction → Template improvement
- Client feedback → Process optimization

**Graceful Degradation**: System remains functional even if components fail

- Manual fallbacks for all automation
- Offline-first data capture
- No critical dependencies on external services

**Bulkheads**: Isolate failure domains

- Client data segregated by project
- Production vs. development environments
- Separate authentication contexts

---

## 3.0 Technology Stack

### 3.1 Primary Infrastructure

**Database**: Firestore (Firebase)

- **Why**: Real-time sync, offline-first, scalable, serverless
- **Use Cases**:
  - Codex data storage
  - Client project tracking
  - Market intelligence repository
  - ROI metrics database

**Hosting**: Firebase App Hosting + Cloud Functions

- **Why**: Zero-ops, auto-scaling, integrated with Firestore
- **Use Cases**:
  - Internal dashboards
  - Colophon ROI validation forms
  - Automated report generation
  - Data export/import pipelines

**AI/ML**: Google Vertex AI + Gemini

- **Why**: Native GCP integration, cost-effective, powerful reasoning
- **Use Cases**:
  - Pattern recognition in client data
  - Diagnostic framework suggestions
  - Document analysis and summarization
  - Semantic search across Codex

### 3.2 Development Environment

**Primary IDE**: VS Code

- **Workspace**: This repository (Codex Signum)
- **Extensions**:
  - Obsidian integration for documentation
  - Firebase tools
  - TypeScript/Node.js support
  - GitHub Copilot for code assistance

**Version Control**: Git + GitHub

- **Repo Structure**:
  ```
  /docs          # Business planning and SOPs (Obsidian vault)
  /src           # Application code
  /functions     # Cloud Functions
  /scripts       # Automation scripts
  /templates     # Client deliverable templates
  ```

**Documentation**: Obsidian (vault = /docs folder)

- Bi-directional links between business docs and tech implementation
- Task management and project tracking
- SOP documentation and refinement

### 3.3 Application Stack

**Frontend** (Internal Tools): Next.js 15 + React 18

- **Why**: Modern, fast, server-side rendering, good Firebase integration
- **Use Cases**:
  - Codex interface (search, browse, add entries)
  - Project management dashboard
  - Colophon ROI validation interface

**Backend** (Serverless): Node.js + TypeScript

- **Why**: JavaScript ecosystem, type safety, Cloud Functions native
- **Use Cases**:
  - API endpoints for data access
  - Scheduled jobs (report generation)
  - Integration with external tools
  - Data transformation pipelines

**UI Components**: Shadcn/ui + Tailwind CSS

- **Why**: Consistent design system, accessible, customizable
- **Use Cases**: All internal interface components

### 3.4 Supporting Tools

**Process Automation**: n8n or Zapier (TBD)

- **Use Cases**:
  - Client onboarding workflows
  - Email integrations
  - Document generation triggers

**Document Generation**: Markdown + Pandoc

- **Use Cases**:
  - Initium reports (MD → PDF)
  - Consilium deliverables
  - Fabrica documentation

**Analytics**: Google Analytics 4 (internal dashboards only)

- Track operational metrics
- System usage patterns
- Identify automation opportunities

---

## 4.0 The Codex - Technical Design

### 4.1 Data Model

**Collections** (Firestore):

```typescript
// Market Intelligence
interface MarketIntel {
  id: string;
  source: "conversation" | "research" | "public";
  sector: "higher-ed" | "healthcare" | "logistics";
  organization: string;
  insight: string;
  tags: string[];
  weight: "high" | "medium" | "low";
  dateCapture: timestamp;
  linkedProjects: string[]; // References to project IDs
}

// Client Projects
interface Project {
  id: string;
  client: string; // Anonymized or internal code
  type: "initium" | "consilium" | "fabrica" | "vigilia";
  challenge: string;
  solution: string;
  roi: ROIMetrics;
  status: "discovery" | "active" | "complete" | "archived";
  colophonValidated: boolean;
  dateStart: timestamp;
  dateComplete: timestamp;
}

// ROI Metrics (from Colophon)
interface ROIMetrics {
  validated: boolean;
  clientSignoff: boolean;
  financialImpact: number; // Dollar value
  timeImpact: number; // Hours saved
  qualitativeImpact: string[];
  validationDate: timestamp;
}

// Process Patterns
interface ProcessPattern {
  id: string;
  name: string;
  description: string;
  sector: string;
  frequency: number; // How often seen in projects
  successRate: number; // Percentage successful
  antiPattern: boolean; // If false, it's a best practice
  relatedProjects: string[];
  solution: string;
}
```

### 4.2 Search & Retrieval

**Semantic Search** (Vertex AI Vector Search):

- Embed all Codex entries using Gemini embeddings
- Store vectors in Firestore or Vector Search index
- Query: "Similar challenges to [current client problem]"
- Returns: Ranked list of relevant past projects and patterns

**Filters**:

- By sector
- By weight (prioritize high-weight validated data)
- By recency
- By success rate (for process patterns)

### 4.3 Privacy & Security

**Data Handling**:

- All client names anonymized (use internal project codes)
- No personally identifiable information stored
- Sector and challenge type only (no specific institutional details)
- ROI metrics aggregated where possible

**Access Control**:

- Single-user system (no multi-tenant complexity)
- Firebase Authentication for admin access
- Local development with emulators
- Production environment isolated

---

## 5.0 The Colophon - ROI Validation System

### 5.1 Purpose

Mandatory project close-out that:

1. Captures client sign-off on delivered outcomes
2. Documents measurable ROI
3. Feeds validated data into Codex
4. Maintains fiduciary accountability

### 5.2 Technical Implementation

**V1.0 - Google Forms** (Weeks 1-12):

- Simple form for client to complete
- Manual data entry into Codex
- PDF export of responses
- Low friction, validate concept

**V2.0 - Custom Web App** (Months 4-6):

- Next.js app hosted on Firebase
- Direct integration with Codex (Firestore)
- Digital signature capture
- Automated data processing
- Client-facing dashboard showing their ROI

### 5.3 Workflow

```
Project Complete → Colophon Form Sent → Client Completes
                                              ↓
                               Review & Validate Responses
                                              ↓
                         Data Extracted → Codex Updated
                                              ↓
                      ROI Metrics Added to Project Record
                                              ↓
                    Pattern Recognition → Process Library Updated
```

### 5.4 Data Captured

**Required Fields**:

- Project objectives (as defined in SOW)
- Achieved outcomes (client assessment)
- Quantitative ROI (cost savings, time savings, revenue impact)
- Qualitative ROI (satisfaction, capability improvement)
- Lessons learned
- Client signature and date

**Optional Fields**:

- Testimonial (for case studies)
- Referral willingness
- Future project ideas

---

## 6.0 Delivery Automation System

### 6.1 Template Library

**Initium Templates**:

- Diagnostic interview guide
- Process mapping framework
- Findings report structure
- Solution hypothesis format
- SOW template for Fabrica

**Consilium Templates**:

- Implementation roadmap
- Stakeholder engagement plan
- Risk assessment matrix
- Technical architecture diagrams
- Detailed SOW template

**Fabrica Templates**:

- Project plan and timeline
- Process documentation structure
- Training materials framework
- Performance monitoring dashboard
- Colophon validation form

### 6.2 Automation Scripts

**Document Generation**:

```bash
# Convert Markdown to PDF with branding
./scripts/generate-report.sh initium project-001
```

**Data Exports**:

```bash
# Export anonymized case study from Codex
./scripts/export-case-study.sh project-001 --anonymize
```

**Project Setup**:

```bash
# Initialize new project in Codex
./scripts/new-project.sh --type initium --client "UniCode-001"
```

### 6.3 Process Orchestration

**GitHub Actions** (for automated workflows):

- Scheduled Codex backups
- Weekly metrics reports
- Document generation on template changes
- Data validation checks

**Cloud Functions** (for event-driven tasks):

- New project → Create folder structure
- Colophon submitted → Update Codex
- Pattern threshold reached → Alert for review

---

## 7.0 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Priority**: Build minimum viable Codex and start capturing data

- [ ] Set up Firebase project and Firestore
- [ ] Create basic Codex data model
- [ ] Build simple data entry interface (can be CLI)
- [ ] Set up Obsidian vault integration (this repo)
- [ ] Create Initium template library

**Success Criteria**: Can capture market intel and project data manually

### Phase 2: Colophon V1.0 (Weeks 5-8)

**Priority**: Validate ROI capture process before first Fabrica completes

- [ ] Build Google Form for Colophon
- [ ] Create PDF export workflow
- [ ] Manual Codex update process documented
- [ ] Test with mock client data

**Success Criteria**: Can capture and store validated ROI data

### Phase 3: Search & Retrieval (Weeks 9-12)

**Priority**: Make Codex useful for current work (not just storage)

- [ ] Implement semantic search (Vertex AI)
- [ ] Build Codex query interface
- [ ] Add filtering and sorting
- [ ] Create "similar projects" finder

**Success Criteria**: Can find relevant past projects in <30 seconds

### Phase 4: Automation Layer (Months 4-6)

**Priority**: Reduce manual delivery work

- [ ] Automated report generation
- [ ] Template-based deliverable creation
- [ ] Process documentation tools
- [ ] Client dashboard (internal metrics)

**Success Criteria**: Reduce Initium delivery time by 30%

### Phase 5: Colophon V2.0 (Months 6-9)

**Priority**: Professional ROI validation system

- [ ] Custom web app for Colophon
- [ ] Direct Firestore integration
- [ ] Digital signature capture
- [ ] Client-facing ROI dashboard

**Success Criteria**: Zero manual data entry, client self-service

### Phase 6: Intelligence Layer (Months 9-12)

**Priority**: Proactive insights from Codex

- [ ] Pattern recognition algorithms
- [ ] Trend analysis across projects
- [ ] Automated opportunity identification
- [ ] Predictive success scoring

**Success Criteria**: System suggests solutions without prompting

---

## 8.0 Development Principles

### 8.1 Build Guidelines

1. **Manual First**: Prove the workflow manually before automating
2. **Minimal Viable**: Ship the smallest useful version
3. **Data Capture Priority**: If choosing between features, prioritize data capture
4. **Offline Resilient**: Assume network unavailability
5. **Type Safe**: Use TypeScript everywhere, no `any` types
6. **Document Obsessively**: Every function, every decision, every pattern

### 8.2 When to Build vs. Buy

**Build**:

- Core Codex functionality (proprietary moat)
- Colophon system (unique workflow)
- Client deliverable templates (brand/methodology specific)
- Data models and schemas

**Buy/Use SaaS**:

- Email/calendar (Google Workspace)
- Document storage (Google Drive)
- Generic automation (n8n/Zapier if needed)
- Payment processing (Stripe)
- Accounting (Xero)

### 8.3 Technical Debt Management

**Allowed**:

- Quick scripts for one-off tasks
- Hardcoded values during testing
- Console.log debugging

**Not Allowed**:

- Skipping TypeScript types
- No error handling
- Unsafe data mutations
- Missing documentation on public functions

**Monthly Debt Review**: Last Friday of each month, review and prioritize refactoring

---

## 9.0 Security & Compliance

### 9.1 Data Protection

**Client Data**:

- Anonymize on entry to Codex
- No storage of PII
- Encrypt at rest (Firestore handles this)
- Regular backups (automated via Cloud Functions)

**Access**:

- Single admin user (Principal)
- MFA required for Firebase console
- API keys in environment variables (never committed)
- Regular credential rotation

### 9.2 Disaster Recovery

**Backup Strategy**:

- Daily Firestore exports to Cloud Storage
- Weekly full database dump
- Git for all code and documentation
- Critical templates in multiple locations

**Recovery Plan**:

- Maximum acceptable data loss: 24 hours
- Recovery time objective: 4 hours
- Manual fallback: Spreadsheet + Google Forms

---

## 10.0 Metrics & Monitoring

### 10.1 System Health

**Track**:

- Codex entry count (weekly growth)
- Data quality score (weight distribution)
- Search effectiveness (time to find relevant data)
- Automation coverage (% of tasks automated)

### 10.2 Business Impact

**Track**:

- Delivery time per product type (trending down?)
- Margin per project (trending up?)
- Repeat patterns identified (compound learning)
- Client ROI validation rate (should be 100%)

### 10.3 Dashboards

**Weekly Review Dashboard**:

- New Codex entries this week
- Projects in flight (status)
- Upcoming Colophon validations
- System health checks

**Monthly Business Dashboard**:

- Revenue and margin trends
- Pipeline conversion rates
- Pattern library growth
- Automation ROI (time saved)

---

## Appendices

### A. Tech Stack Quick Reference

| Component       | Technology                | Purpose                    |
| --------------- | ------------------------- | -------------------------- |
| Database        | Firestore                 | Codex data storage         |
| Hosting         | Firebase App Hosting      | Internal apps              |
| Functions       | Cloud Functions (Node.js) | Automation                 |
| AI/ML           | Vertex AI + Gemini        | Search, analysis, insights |
| Frontend        | Next.js + React           | Internal interfaces        |
| Styling         | Tailwind + Shadcn/ui      | UI components              |
| Documentation   | Obsidian (Markdown)       | Business + tech docs       |
| Version Control | Git + GitHub              | Code and config            |
| IDE             | VS Code                   | Development environment    |

### B. Repository Structure

```
codex-signum/
├── docs/                    # Obsidian vault (business docs)
│   ├── Business Plan/
│   ├── SOPs/
│   ├── Research/
│   └── Tech Stack/          # This document
├── src/
│   ├── app/                 # Next.js app
│   ├── components/          # React components
│   ├── lib/                 # Shared utilities
│   └── types/               # TypeScript definitions
├── functions/               # Cloud Functions
├── scripts/                 # Automation scripts
├── templates/               # Client deliverable templates
├── .github/
│   └── workflows/           # GitHub Actions
├── firebase.json            # Firebase configuration
├── package.json
└── README.md
```

### C. Version History

- **V1.0** (07-Nov-2025): Initial tech stack definition, architecture design, implementation roadmap

---

_This is a living technical document. Update as architecture evolves and new tools are adopted._
