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
    - Path: ../../../../../../2026-05-03--goja-hosting-site/pkg/kanbanddsl/builder.go
      Note: Reference Kanban DSL builder pattern with fluent JavaScript API
    - Path: ../../../../../../2026-05-03--goja-hosting-site/pkg/kanbanddsl/types.go
      Note: Reference Kanban DSL type definitions and configuration structs
    - Path: ../../../../../../go-go-goja/modules/uidsl/module.go
      Note: UI DSL native module registration and tag constructors
    - Path: ../../../../../../go-go-goja/modules/uidsl/node.go
      Note: UI DSL AST node type definitions
    - Path: ../../../../../../go-go-goja/modules/uidsl/render.go
      Note: UI DSL safe HTML renderer with attribute escaping
    - Path: cmd/rag-eval/cmds/serve/server.go
      Note: HTTP server wiring with database
    - Path: internal/api/handlers.go
      Note: Go HTTP handler registration and API implementation
    - Path: internal/web/spa.go
      Note: SPA static file serving with index.html fallback
    - Path: ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/02-rag-widget-dsl-design-component-to-html-mapping.md
      Note: Detailed widget DSL mapping every React component to a JS constructor
    - Path: web/src/App.tsx
      Note: Main React app entry point showing view routing
    - Path: web/src/components/molecules/DataTable/DataTable.tsx
      Note: Generic typed DataTable component demonstrating component contract patterns
    - Path: web/src/services/api.ts
      Note: Complete RTK Query API with all backend endpoints
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
