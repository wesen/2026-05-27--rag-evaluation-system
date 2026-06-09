---
Title: Color Palette Theming for Context Window Diagrams
Ticket: CTX-COLOR-PALETTE
Status: active
Topics:
    - frontend
    - theming
    - context-window
    - visualization
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/components/atoms/ContextKindSwatch/ContextKindSwatch.tsx
      Note: Swatch atom — consumes getContextKindSpec
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/components/molecules/ContextBudgetBar/ContextBudgetBar.module.css
      Note: Budget bar CSS — needs [data-mode='color'] rules
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/components/molecules/ContextStackDiagram/ContextStackDiagram.module.css
      Note: Stack diagram CSS — needs [data-mode='color'] rules
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/components/molecules/ContextStripDiagram/ContextStripDiagram.tsx
      Note: Strip diagram component — needs color mode CSS
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/components/molecules/ContextTreemap/ContextTreemap.module.css
      Note: Treemap CSS — needs [data-mode='color'] rules
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/components/organisms/ContextDiagramPanel/ContextDiagramPanel.tsx
      Note: Panel orchestrator — view switcher
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/context/fixtures.ts
      Note: Example data — 4 ContextWindowSnapshot fixtures for testing
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/context/kinds.ts
      Note: Visual spec registry — patternSpecs
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/context/types.ts
      Note: Core types — ContextPartKind union (15 kinds)
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/theme.css
      Note: CSS custom properties — needs --rag-context-fill-* and --rag-context-label-* tokens
ExternalSources: []
Summary: ""
LastUpdated: 2026-06-09T16:38:36.060938613-04:00
WhatFor: ""
WhenToUse: ""
---











# Color Palette Theming for Context Window Diagrams

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- frontend
- theming
- context-window
- visualization

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
