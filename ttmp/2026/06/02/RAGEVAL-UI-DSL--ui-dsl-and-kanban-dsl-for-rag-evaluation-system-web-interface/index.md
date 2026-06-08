---
Title: UI DSL and Kanban DSL for RAG Evaluation System Web Interface
Ticket: RAGEVAL-UI-DSL
Status: active
Topics:
    - go
    - goja
    - javascript
    - web
    - react
    - dsl
    - kanban
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: cmd/rag-eval/cmds/serve/server.go
      Note: HTTP server wiring with database
    - Path: internal/api/dsl_handlers.go
      Note: Static API demo endpoint for Phase 4
    - Path: internal/api/dsl_handlers_test.go
      Note: Smoke tests for static Widget IR demo endpoint and 404 behavior
    - Path: internal/api/handlers.go
      Note: Go HTTP handler registration and API implementation
    - Path: internal/dsl/widgetdsl/module.go
      Note: Initial Goja widget.dsl module emitting Widget IR maps
    - Path: internal/dsl/widgetdsl/module_test.go
      Note: Tests requiring widget.dsl and rag.dsl aliases and verifying JSON-serializable IR
    - Path: internal/web/spa.go
      Note: SPA static file serving with index.html fallback
    - Path: ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/02-rag-widget-dsl-design-component-to-html-mapping.md
      Note: Detailed widget DSL mapping every React component to a JS constructor
    - Path: ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/03-review-and-revised-implementation-guide-for-the-rag-widget-dsl.md
      Note: Review and corrected implementation plan for the RAG widget DSL
    - Path: web/src/App.tsx
      Note: |-
        Main React app entry point showing view routing
        Navigation and view switch wiring for DSL preview
    - Path: web/src/components/molecules/DataTable/DataTable.tsx
      Note: Generic typed DataTable component demonstrating component contract patterns
    - Path: web/src/components/pages/DslPreviewPage/DslPreviewPage.tsx
      Note: React page that fetches and renders Widget IR
    - Path: web/src/services/api.ts
      Note: Complete RTK Query API with all backend endpoints
    - Path: web/src/widgets/WidgetRenderer.stories.tsx
      Note: Storybook coverage for Widget IR renderer combinations
    - Path: web/src/widgets/WidgetRenderer.tsx
      Note: Implemented React WidgetRenderer for phase 2
    - Path: web/src/widgets/ir.ts
      Note: Implemented Widget IR schema for phase 1
ExternalSources: []
Summary: ""
LastUpdated: 2026-06-02T21:00:30.291950342-04:00
WhatFor: ""
WhenToUse: ""
---




























# UI DSL and Kanban DSL for RAG Evaluation System Web Interface

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- go
- goja
- javascript
- web
- react
- dsl
- kanban

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
