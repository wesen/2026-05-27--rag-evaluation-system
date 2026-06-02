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
    - Path: geppetto/pkg/js/modules/geppetto/module.go
      Note: Geppetto goja module — pattern for rag-ops module
    - Path: geppetto/pkg/js/modules/geppetto/provider/provider.go
      Note: Geppetto xgoja provider — pattern for rag-ops provider package
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
