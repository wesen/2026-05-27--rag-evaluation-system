---
Title: 'Goja-Driven RAG Indexing Strategies: JS Extension Points for Pipeline Experimentation'
Ticket: RAGEVAL-GOJA-RAG-STRATEGIES
Status: active
Topics:
    - rag
    - goja
    - embeddings
    - chunking
    - search
    - xgoja
    - scraper
    - geppetto
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-05-27--rag-evaluation-system/internal/api/handlers.go
      Note: HTTP API handlers — endpoints that rag-ops wraps
    - Path: 2026-05-27--rag-evaluation-system/internal/db/queries.go
      Note: SQL queries — DB layer that rag-ops calls via services
    - Path: 2026-05-27--rag-evaluation-system/internal/workflow/intake_runner.go
      Note: Current Go-only op dispatcher — pattern for js_pipeline runner
    - Path: 2026-05-27--rag-evaluation-system/internal/workflow/ops.go
      Note: Op kind constants and IntakeOpInput — add js_pipeline here
    - Path: 2026-05-27--rag-evaluation-system/internal/workflow/submit.go
      Note: Workflow DAG builder — add js_pipeline op submission
    - Path: 2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-GOJA-RAG-STRATEGIES--goja-driven-rag-indexing-strategies-js-extension-points-for-pipeline-experimentation/design/02-rag-preprocessing-research-report-and-investigation-avenues.md
      Note: New design doc - research report + 8 investigation avenues
    - Path: 2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-GOJA-RAG-STRATEGIES--goja-driven-rag-indexing-strategies-js-extension-points-for-pipeline-experimentation/design/03-layered-goja-rag-api-design-and-implementation-guide.md
      Note: Layered Goja RAG API redesign with raw SQL/Bleve layer
    - Path: geppetto/pkg/js/modules/geppetto/module.go
      Note: |-
        Geppetto goja module — pattern for rag-ops module
        Hidden Go reference pattern used as precedent for Go-owned JS handles
    - Path: geppetto/pkg/js/modules/geppetto/provider/provider.go
      Note: Geppetto xgoja provider — pattern for rag-ops provider package
    - Path: go-go-goja/modules/database/database.go
      Note: Existing raw SQL Goja module pattern used for rag/raw.db design
    - Path: goja-text/README.md
      Note: Goja-text README with full API documentation and examples
    - Path: goja-text/pkg/extract/module.go
      Note: Extract goja module — structured data extraction from text
    - Path: goja-text/pkg/markdown/module.go
      Note: |-
        Markdown goja module — AST parsing
        Markdown AST traversal API used as precedent for document-aware chunking
    - Path: goja-text/pkg/sanitize/module.go
      Note: Sanitize goja module — YAML/JSON repair and linting
    - Path: goja-text/pkg/xgoja/providers/text/text.go
      Note: Goja-text xgoja provider package — registers all three modules
    - Path: scraper/pkg/engine/runner/js.go
      Note: JSRunner — dispatch from scraper op to JS executor
    - Path: scraper/pkg/js/runtime/executor.go
      Note: JS execution engine — pattern for rag-ops module integration
ExternalSources: []
Summary: ""
LastUpdated: 2026-06-02T17:03:10.723119457-04:00
WhatFor: ""
WhenToUse: ""
---









# Goja-Driven RAG Indexing Strategies: JS Extension Points for Pipeline Experimentation

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- rag
- goja
- embeddings
- chunking
- search
- xgoja
- scraper
- geppetto

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
