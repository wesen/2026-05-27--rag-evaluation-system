---
Title: 'Workflow intake UI: developer-centered design for scraper-driven RAG pipeline orchestration'
Ticket: RAGEVAL-007
Status: active
Topics:
    - rag
    - ui
    - workflow
    - scraper
    - intake
    - design
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: internal/api/handlers.go
      Note: Pattern to follow for new workflow HTTP handlers
    - Path: internal/workflow/engine.go
      Note: Wires intake scheduler with store + registry + IntakeRunner
    - Path: internal/workflow/intake_runner.go
      Note: Dispatches ops by Operation field
    - Path: internal/workflow/ops.go
      Note: IntakeOpInput and output structs
    - Path: internal/workflow/submit.go
      Note: Builds the intake DAG and writes to engine DB
    - Path: web/src/App.tsx
      Note: Top-level nav where Workflows tab goes
    - Path: web/src/services/api.ts
      Note: RTK Query API definition where new endpoints go
ExternalSources: []
Summary: ""
LastUpdated: 2026-05-29T16:09:31.487533239-04:00
WhatFor: ""
WhenToUse: ""
---



# Workflow intake UI: developer-centered design for scraper-driven RAG pipeline orchestration

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- rag
- ui
- workflow
- scraper
- intake
- design

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
