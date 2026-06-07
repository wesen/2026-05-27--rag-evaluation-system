---
Title: Design Integration Research and Implementation Plan
Ticket: RAGEVAL-CONTEXT-WINDOWS-DESIGN
Status: active
Topics:
  - design-system
  - frontend-architecture
  - react
  - rag
  - ui-dsl
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/design-doc/02-rag-react-design-system-guidelines.md
      Note: Original RAG React design-system contribution guideline recovered from git/minitrace
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/scripts/03_candidate_session_search.sql
      Note: go-minitrace DuckDB search used to rank prior frontend/design-system sessions
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/scripts/query-commands/design/web-playbook-search.js
      Note: go-minitrace JS verb command used to extract tool-call evidence
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/01-recovered-design-docs.md
      Note: Catalog of recovered design-system and frontend playbook documents
    - Path: ttmp/2026/06/07/RAGEVAL-DS-RAGEVAL-QWEN36-HIGH--rag-design-system-reference-sheet-styling-design-widget-interaction-hierarchy/design-doc/02-widget-hierarchy-and-interaction-reference.md
      Note: Current widget hierarchy and interaction reference for design integration
ExternalSources: []
Summary: ""
LastUpdated: 2026-06-07T00:00:00Z
WhatFor: ""
WhenToUse: ""
---


# Design Integration Research and Implementation Plan

## Executive Summary

This ticket will integrate the next design iteration for a full RAG working surface: transcript reading, context-window construction, annotation, and course/page-oriented learning workflows. The first phase is evidence recovery. Instead of inventing a new frontend playbook, we used `go-minitrace` SQL and JS query commands plus git history to recover the prior design-system guidance written during earlier `web/` work.

The initial search found a strong existing foundation. The most important recovered sources are:

1. `RAG React Design System Guidelines` — the original contribution/playbook-style guide for adding/refactoring RAG React components.
2. `RAG Design System Guideline Audit` — component-by-component cleanup plan and evidence map.
3. `Styling and Design Reference` — current visual language, token, CSS architecture, and style discipline reference.
4. `Widget Hierarchy and Interaction Reference` — current component hierarchy, Widget IR, interaction, and Goja authoring model.
5. `Widget DSL Visual Quality Analysis and Implementation Guide` — standalone Widget DSL visual-quality gaps and recipe strategy.
6. `WidgetRenderer Packaging Architecture and Implementation Guide` — packaging/default-app architecture for widget-rendered experiences.
7. `UI DSL and Kanban DSL Design and Implementation Guide` plus follow-up DSL reviews — historical context and corrected architecture decisions.

The design direction should therefore reuse the existing layered architecture:

```text
tokens → foundation → atoms → layout → molecules → organisms → pages → containers
Widget IR → WidgetRenderer → React components → browser
```

The transcript/context-window/annotation/course experience should be designed as presentational pages and reusable organisms first, then wired to data/API containers and Widget IR recipes only after the visual and interaction model is stable.

## Problem Statement and Scope

The project needs a coherent page family for working with RAG context windows. The user described four surfaces:

- **Transcript page** — inspect source conversations or transcripts as structured evidence.
- **Context window page** — assemble, inspect, score, and revise context windows for RAG experiments.
- **Annotation page** — label spans, chunks, retrieval results, claims, or course moments.
- **Course page** — present guided material/exercises around context windows and RAG concepts.

The design must fit the existing RAG frontend/design-system discipline and the newer Widget IR/DSL package direction.

## Evidence Recovery Method

All reusable investigation commands are stored under this ticket's `scripts/` directory.

| Script | Purpose | Output |
|---|---|---|
| `scripts/01_capture_go_minitrace_help.sh` | Capture `go-minitrace help --all` and focused SQL/JS help pages. | `sources/go-minitrace/*.txt` |
| `scripts/02_convert_relevant_pi_sessions.sh` | Convert relevant Pi session stores for this workspace. | `sources/minitrace/**.minitrace.json` |
| `scripts/03_candidate_session_search.sql` | SQL query ranking sessions by design-system/playbook/web terms. | `sources/candidate-session-search.json` |
| `scripts/query-commands/design/web-playbook-search.js` | JS verb command for richer tool-call evidence search. | `sources/web-playbook-evidence.json` |
| `scripts/04_git_frontend_history.sh` | Capture git history and tracked files for frontend/design paths. | `sources/git/*` |
| `scripts/05_catalog_recovered_design_docs.py` | Build a compact catalog of recovered design docs and source articles. | `sources/01-recovered-design-docs.md` |

The minitrace SQL search ranked session `019e8afc-89d8-7f43-95d0-e7f6be234ee4` highest for combined design-system/frontend/playbook evidence. The git history search identified commit `1cb51dd` (`docs: audit RAG design system guidelines`) as the strongest direct pointer to the original web contribution playbook.

## Recovered Guidance Relevant to This Ticket

### 1. Layer ownership is the governing rule

The recovered guidelines define strict ownership:

- tokens own values;
- foundation primitives own typography, code text, captions, status text, accessibility, and separators;
- layout primitives own structure and spacing recipes;
- molecules own reusable data-display patterns;
- organisms own feature panels with DTO-shaped props;
- pages own composition of organisms and page-level state;
- containers own RTK Query, mutations, navigation events, and side effects;
- CSS Modules own local anatomy that is not reusable.

This directly implies the new transcript/context-window/annotation/course work should not start as one large page with ad-hoc CSS. It should start by identifying reusable molecules and organisms.

### 2. Storybook coverage is part of the definition of done

The recovered `RAG React Design System Guidelines` state that primitives, molecules, organisms, and presentational page boundaries need Storybook coverage. The new page family should therefore include stories for:

- transcript timeline/message list states;
- context-window budget meters and included/excluded chunk lists;
- annotation inspector and annotation list states;
- course lesson/step layout states;
- full page composition examples with realistic RAG data.

### 3. The visual identity is retro monochrome, dense, and square

The current `Styling and Design Reference` confirms the active visual language: Mac OS 1-inspired, monochrome-first, compact, square corners, black panel headers, thin borders, monospace labels, and small semantic color accents. The new pages should not introduce rounded card UI, large airy spacing, or generic SaaS gradients.

### 4. Widget IR should reuse React components, not clone HTML

The DSL history shows a corrected architecture: Goja authors JSON-compatible Widget IR; React renders actual component-library widgets. The new page family should be represented in Widget IR only after the React component vocabulary is stable, so the DSL can expose high-level recipes rather than fragile low-level layout fragments.

## Initial Architecture Sketch

### Candidate component decomposition

```text
foundation
  Caption, StatusText, CodeText, Text, Divider, VisuallyHidden

atoms
  Button, IconButton, TextInput, SelectInput, CheckboxRow, ErrorCallout

layout
  Panel, Stack, Inline, DashboardGrid, ScrollRegion, TabList, FormRow, AppShell

molecules (new or extended)
  TranscriptMessage
  TranscriptTurnList
  TokenBudgetMeter
  ContextChunkRow
  AnnotationBadge
  AnnotationList
  CourseStepNav
  EvidenceMetadataGrid

organisms (new)
  TranscriptReaderPanel
  ContextWindowBuilderPanel
  RetrievedContextPanel
  AnnotationInspectorPanel
  AnnotationWorkspacePanel
  CourseLessonPanel
  CourseExercisePanel

pages (new)
  TranscriptWorkbenchPage
  ContextWindowWorkbenchPage
  AnnotationWorkbenchPage
  CoursePage

containers (later)
  TranscriptWorkbenchContainer
  ContextWindowWorkbenchContainer
  AnnotationWorkbenchContainer
  CourseContainer
```

### Data boundaries to define next

- Transcript DTO: sessions, turns/messages, speaker/source, timestamps, token counts, tool/event metadata.
- Context-window DTO: budget, selected chunks, candidates, exclusions, score/rationale, source spans.
- Annotation DTO: target type, span/range, label, note, confidence, author, provenance.
- Course DTO: lesson, section, objective, examples, exercises, linked transcript/context artifacts.

## Design Decisions

### Decision 1: Start with presentational React pages before Widget DSL recipes

**Status:** proposed

**Context:** Prior DSL work shows that cloning HTML or starting from low-level DSL layouts creates visual-quality problems.

**Decision:** Build storyable React molecules/organisms/pages first. Add Widget IR types/recipes only after the component vocabulary stabilizes.

**Consequences:** Slower initial DSL exposure, but much safer visual consistency and less duplicated rendering logic.

### Decision 2: Treat context-window work as a page family, not one page

**Status:** proposed

**Context:** Transcript reading, context selection, annotation, and course learning have overlapping components but different primary tasks.

**Decision:** Build a page family with shared molecules/organisms rather than one mega-workbench.

**Consequences:** More files/stories up front, but better reuse and clearer navigation.

## Phased Implementation Plan

### Phase 1 — Finish evidence extraction

- Read and summarize the recovered design-system docs in more detail.
- Extract a compact frontend contribution playbook from the recovered sources.
- Relate recovered docs/files to this ticket.

### Phase 2 — Define page contracts

- Draft DTOs and static fixtures for transcript, context window, annotation, and course pages.
- Decide which components live in `web/src/components/**` versus `packages/rag-evaluation-site/src/components/**`.
- Identify whether the target implementation is the legacy `web/` app, the new package app, or both.

### Phase 3 — Build Storybook-first components

- Implement new molecules and organisms with CSS Modules.
- Add stories covering empty/loading/error/dense/selected states.
- Validate against the retro monochrome token system.

### Phase 4 — Compose pages and containers

- Compose presentational pages from organisms.
- Wire routing/API containers after page visuals are stable.
- Add smoke tests/screenshots for full-page layouts.

### Phase 5 — Add Widget IR recipes

- Add Widget IR component support only for stable public components.
- Add Goja DSL recipes for common transcript/context-window/course layouts.
- Validate server-rendered/default-app pages against React Storybook examples.

## References

See `sources/01-recovered-design-docs.md` for the compact catalog of recovered documents.
