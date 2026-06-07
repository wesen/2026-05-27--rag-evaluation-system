---
Title: Source Corpus Index
Ticket: RAGEVAL-CONTEXT-WINDOWS-DESIGN
Status: active
Topics:
  - design-system
  - frontend-architecture
  - react
  - rag
  - ui-dsl
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Index of recovered design-system documents, go-minitrace evidence, git evidence, and the new context-viewer design iteration used as starting material for analysis.
LastUpdated: 2026-06-07T00:00:00Z
WhatFor: Use this file to understand the source bundle captured before analyzing the updated context-viewer work.
WhenToUse: Before reading the analysis/design guide or starting implementation.
---

# Source Corpus Index

## Purpose

This directory captures the starting evidence for the `RAGEVAL-CONTEXT-WINDOWS-DESIGN` analysis. It keeps two kinds of sources together:

1. **Recovered prior design-system and Goja Widget DSL documents** that explain how the existing `web/` design system and Widget IR stack were built.
2. **The new `context-viewer.zip` design iteration** from `~/Downloads/context-viewer.zip`, unpacked as a source artifact for analysis before integration work begins.

The current task is analysis-first: understand the updated design iteration, compare it against the existing design system, and map integration concepts without yet committing to a detailed implementation plan.

## How these sources were found

### go-minitrace and transcript search

The recovered document set was found by converting relevant Pi sessions and querying them with DuckDB SQL plus a go-minitrace JS command:

- `scripts/01_capture_go_minitrace_help.sh` captured `go-minitrace help --all` and focused SQL/JS help pages.
- `scripts/02_convert_relevant_pi_sessions.sh` converted relevant Pi session stores under `~/.pi/agent/sessions`.
- `scripts/03_candidate_session_search.sql` ranked sessions by design-system, playbook, React, `web/`, Widget IR, and context-window terms.
- `scripts/query-commands/design/web-playbook-search.js` extracted tool-call evidence via the go-minitrace JS API.
- `scripts/04_git_frontend_history.sh` cross-checked git history for frontend/design-system commits.
- `scripts/05_catalog_recovered_design_docs.py` produced `01-recovered-design-docs.md`.

Primary evidence outputs:

- `candidate-session-search.json`
- `web-playbook-evidence.json`
- `git/frontend-history.tsv`
- `01-recovered-design-docs.md`

### New design iteration

The updated design iteration was provided as:

- `~/Downloads/context-viewer.zip`

It was unpacked into:

- `03-context-viewer-design-iteration/`

The unpacked file list and SHA-256 checksums are stored as:

- `03-context-viewer-file-list.txt`
- `03-context-viewer-sha256.txt`

## Recovered documents copied into this source set

These files are copied into `02-recovered-documents/` so the analysis has a stable local baseline.

### Most current / most relevant

1. `01-styling-and-design-reference.md`
   - Source: `RAGEVAL-DS-RAGEVAL-QWEN36-HIGH`, 2026-06-07.
   - Useful for: current visual identity, tokens, typography, CSS architecture, and styling discipline.

2. `02-widget-hierarchy-and-interaction-reference.md`
   - Source: `RAGEVAL-DS-RAGEVAL-QWEN36-HIGH`, 2026-06-07.
   - Useful for: component hierarchy, information hierarchy, Widget IR, Goja authoring, and interaction rules.

3. `03-widget-dsl-visual-quality-analysis-and-implementation-guide.md`
   - Source: `WIDGETDSL-VISUAL-QUALITY`, 2026-06-05.
   - Useful for: understanding why standalone Widget DSL pages can look visually wrong, and how shell defaults, token bridges, and semantic recipes improve quality.

4. `04-widgetrenderer-packaging-architecture-and-implementation-guide.md`
   - Source: `WIDGETSITE-PACKAGING`, 2026-06-04.
   - Useful for: the packaged WidgetRenderer, standalone Go-served app, default SPA, and npm package boundary.

5. `05-rag-react-design-system-guidelines.md`
   - Source: `RAG-WEB-DESIGN-SYSTEM-REVIEW`, 2026-06-01.
   - Useful for: the original `web/` contribution playbook, ownership rules, file layout, Storybook requirements, and CSS Modules discipline.

6. `06-review-and-revised-implementation-guide-for-the-rag-widget-dsl.md`
   - Source: `RAGEVAL-UI-DSL`, 2026-06-02.
   - Useful for: historical correction of the original UI DSL approach; use as rationale for Widget IR over cloned HTML.

### Secondary / historical context

7. `07-rag-design-system-guideline-audit.md`
   - Useful for: cleanup evidence and component-by-component audit of the original `web/` implementation.

8. `08-ui-dsl-and-kanban-dsl-design-and-implementation-guide.md`
   - Useful for: historical onboarding context about the first UI DSL/Kanban DSL proposal.

9. `09-rag-widget-dsl-design-component-to-html-mapping.md`
   - Useful for: historical component catalog and API thinking, but its direct HTML/class cloning direction is partially superseded.

10. `10-article-rag-react-design-system-from-prototype-dashboard-to-structured-design-system.md`
    - Source: Obsidian vault article referenced by transcripts.
    - Useful for: narrative overview of the design-system extraction journey.

## New context-viewer design iteration contents

Directory: `03-context-viewer-design-iteration/`

Important files:

- `index.html` — browser entrypoint using React UMD and Babel.
- `app.jsx` — shell, navigation, screen routing, loaded-context-window state, tweaks panel wiring.
- `styles.css` — updated Classic Mac OS token set and component classes.
- `ds.jsx` — simple React primitives: `MenuBar`, `MacWindow`, `Panel`, `Button`, `Tabs`, `MetadataGrid`, `StatusText`, inputs, `Chip`, `ErrorCallout`.
- `patterns.jsx` — context-window visual language: kind map, SVG bit patterns, legend, style modes.
- `diagrams.jsx` — diagram renderers: strip, stack, budget bar, and treemap.
- `data.jsx` — sample context-window snapshots, transcript, course content, and handout content.
- `data2.jsx` — slide deck data.
- `screens.jsx` — course landing, visualizer, upload screen.
- `screens2.jsx` — markdown handout renderer and transcript screen.
- `screens3.jsx` — comments screen variants and slide viewer.
- `ds-overview.jsx` — design-system overview/demo content.
- `tweaks-panel.jsx` — floating design-tweak panel used by the prototype.
- `uploads/foundation-and-tokens.html` and `uploads/widgets-and-composition.html` — exported design reference pages from prior work.
- `uploads/pasted-1780856609056-0.png` — visual source/screenshot asset included in the zip.

## What these sources are useful for

Use the recovered documents to answer:

- What are the existing ownership rules for tokens, foundation, atoms, layout, molecules, organisms, pages, and containers?
- What counts as acceptable CSS ownership?
- Which docs are current versus historical?
- Why should Widget IR render real React components instead of cloning HTML?
- What Storybook and visual-review obligations should future components have?

Use the context-viewer iteration to answer:

- What new product surfaces exist: course, slides, visualizer, upload, transcript, comments, handout?
- What new visual vocabulary exists: diagram kinds, bit-pattern fills, context-window budget states, annotation rails, sticky/popover comments?
- What typography/token adjustments differ from the current `web/` and `packages/rag-evaluation-site` tokens?
- Which prototype widgets should become design-system primitives, molecules, organisms, or page-level compositions?
- Which prototype behaviors should become Widget IR recipes later?

## Current caution

The context-viewer code is a prototype: it uses global scripts, many inline styles, `window` exports, CDN React/Babel, and local state. It should be analyzed as a design and interaction source, not copied directly into production. The eventual integration should preserve the existing working design system while promoting reusable concepts into the correct layers.
