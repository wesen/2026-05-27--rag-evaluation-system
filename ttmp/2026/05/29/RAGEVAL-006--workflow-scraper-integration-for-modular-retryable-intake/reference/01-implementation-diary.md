---
Title: Implementation Diary
Ticket: RAGEVAL-006
Status: active
Topics:
    - rag
    - workflow
    - ingestion
    - embeddings
    - corpus
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../scraper/pkg/doc/topics/scraper-queue-policies-and-rate-limiting.md
      Note: Queue policy reference used for LLM and embedding op pacing recommendations
    - Path: ../../../../../../../scraper/pkg/doc/topics/scraper-runtime-model.md
      Note: Scraper runtime reference used to distinguish submit verbs and execution ops
    - Path: ttmp/2026/05/29/RAGEVAL-006--workflow-scraper-integration-for-modular-retryable-intake/design-doc/01-workflow-scraper-intake-integration-design-and-implementation-guide.md
      Note: Primary design guide produced in Step 1
ExternalSources: []
Summary: Chronological diary for the workflow/scraper integration design ticket.
LastUpdated: 2026-05-29T18:30:00Z
WhatFor: Track the design investigation, evidence, decisions, and delivery steps for scraper-backed modular retryable intake.
WhenToUse: Read before implementing workflow orchestration, LLM preprocessing, chunk enrichment, or scraper runner integration in rag-eval.
---


# Diary

## Goal

This diary records the RAGEVAL-006 design workflow: creating the workflow/scraper integration ticket, studying current rag-eval intake services and scraper engine primitives, and writing an intern-ready implementation guide for modular, retryable intake with LLM pre/post-processing.

## Step 1: Ticket Creation, Architecture Mapping, and Design Guide

I created RAGEVAL-006 to capture workflow/scraper integration as a bounded prototype rather than an immediate full migration. The design keeps current rag-eval services as the domain implementation and proposes using scraper as a durable orchestration layer above them.

The key recommendation is to add workflow support now, but add it incrementally. The first implementation should be a Go-native scraper runner that calls existing services, then a small LLM preprocessing/enrichment prototype over one or two TTC documents. The direct CLI/service path should remain the debugging fallback.

### Prompt Context

**User prompt (verbatim):** "create the ticket, and then Create  a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and the nupload to remarkable."

**Assistant interpretation:** Create a new docmgr ticket for integrating scraper workflows into rag-eval intake, then write and deliver a detailed design/implementation guide suitable for a new intern, including architecture, decisions, pseudocode, APIs, file references, and reMarkable upload.

**Inferred user intent:** The user wants a concrete plan for making rag-eval intake more modular, retryable, and structured, especially to support LLM document preprocessing and chunk postprocessing without losing debuggability.

### What I did

- Created ticket `RAGEVAL-006 -- Workflow/Scraper Integration for Modular Retryable Intake`.
- Added a design document:
  - `ttmp/2026/05/29/RAGEVAL-006--workflow-scraper-integration-for-modular-retryable-intake/design-doc/01-workflow-scraper-intake-integration-design-and-implementation-guide.md`
- Added this implementation diary:
  - `ttmp/2026/05/29/RAGEVAL-006--workflow-scraper-integration-for-modular-retryable-intake/reference/01-implementation-diary.md`
- Added tasks for architecture mapping, guide writing, diary/file relations, validation, and reMarkable upload.
- Inspected current rag-eval intake files:
  - `internal/services/source/service.go`
  - `internal/services/chunking/service.go`
  - `internal/services/embedding/service.go`
  - `internal/services/embedding/provider.go`
  - `internal/services/search/bm25.go`
  - `internal/db/db.go`
  - `internal/api/handlers.go`
  - `cmd/rag-eval/cmds/embedding/compute.go`
- Inspected scraper architecture docs and code:
  - `../scraper/pkg/doc/topics/scraper-architecture-overview.md`
  - `../scraper/pkg/doc/topics/scraper-runtime-model.md`
  - `../scraper/pkg/doc/topics/scraper-queue-policies-and-rate-limiting.md`
  - `../scraper/pkg/doc/topics/scraper-js-api-reference.md`
  - `../scraper/pkg/engine/model/types.go`
  - `../scraper/pkg/engine/store/store.go`
  - `../scraper/pkg/engine/scheduler/scheduler.go`
  - `../scraper/pkg/engine/runner/runner.go`
  - `../scraper/sites/slashdot/verbs/seed.js`
  - `../scraper/sites/slashdot/scripts/seed.js`
- Wrote a detailed design guide covering:
  - current rag-eval intake state;
  - scraper engine primitives;
  - recommended Go-native runner approach;
  - LLM document preprocessing artifact table;
  - chunk enrichment using existing `chunk_enrichments` schema;
  - prototype workflow graph;
  - CLI/API sketches;
  - runner pseudocode;
  - retry/idempotency rules;
  - queue policy recommendations;
  - testing strategy;
  - risks, alternatives, and open questions.

### Why

The current intake path is service-backed and idempotent enough to be orchestrated. LLM preprocessing and chunk enrichment introduce slow, provider-backed, failure-prone work where durable retry and per-operation observability become useful. A workflow system is appropriate now, but only if it wraps existing services rather than replacing them.

### What worked

- The current rag-eval service comments and behavior already anticipate future workflow operations.
- Chunking is rerun-safe for exact document/strategy pairs, which is essential for workflow retries.
- Embedding compute already has source filters, limits, batching, and text-hash freshness checks.
- Scraper exposes a clean runner interface that can support a Go-native rag-eval runner.
- Scraper's queue policy and retry model align well with provider-backed LLM work.

### What didn't work

- No implementation was performed in this step. This is a design and delivery ticket.
- There is not yet a document-level preprocessing artifact table in rag-eval.
- The current `chunk_enrichments` table exists but does not yet have query helpers or service code.
- It is not yet proven that importing scraper as a Go dependency will be frictionless; Phase 0 of the guide explicitly calls for dependency/version validation.

### What I learned

- The strongest integration seam is scraper's Go `Runner` interface, not scraper's JavaScript site scripting layer.
- JavaScript site workflows remain useful as a later option, but starting there would move too much domain behavior out of existing tested Go services.
- The workflow integration should be measured by debuggability: if a workflow op fails, the equivalent direct CLI/service command should still reproduce the failure.

### What was tricky to build

The tricky design point was choosing how much of scraper to reuse. Scraper's normal site model uses manifests, JS submit verbs, and JS execution scripts. Rag-eval already has Go services for source scanning, chunking, embeddings, and BM25 indexing. The design resolves this by using scraper's engine, scheduler, store, retry, and queue machinery while adding a Go-native `rag-eval/intake` runner.

Another tricky point is LLM preprocessing storage. Overwriting `documents.content_text` would make experiments destructive and hard to compare. The guide recommends a new `document_processing_artifacts` table so preprocessing outputs are explicit derived artifacts with prompt/provider/model/hash identity.

### What warrants a second pair of eyes

- Review whether the first implementation should embed scraper as a Go library or call the scraper binary as a subprocess.
- Review whether workflow state should live in a separate engine DB or inside `data/rag-eval.db`.
- Review the proposed `document_processing_artifacts` schema before implementation.
- Review the recommendation to start with a Go-native runner instead of scraper JS site scripts.
- Review dependency version compatibility between rag-eval and scraper before coding.

### What should be done in the future

- Run Phase 0 dependency and minimal custom-runner spike.
- Add document preprocessing artifact persistence.
- Add chunk enrichment service over `chunk_enrichments`.
- Add bounded workflow submit and worker commands.
- Run a two-document TTC guide smoke workflow with fake providers first, then one explicit live provider smoke.

### Code review instructions

- Start with the design guide:
  - `ttmp/2026/05/29/RAGEVAL-006--workflow-scraper-integration-for-modular-retryable-intake/design-doc/01-workflow-scraper-intake-integration-design-and-implementation-guide.md`
- Then review the main rag-eval service boundaries:
  - `internal/services/source/service.go`
  - `internal/services/chunking/service.go`
  - `internal/services/embedding/service.go`
  - `internal/services/search/bm25.go`
- Then review scraper integration seams:
  - `../scraper/pkg/engine/model/types.go`
  - `../scraper/pkg/engine/store/store.go`
  - `../scraper/pkg/engine/scheduler/scheduler.go`
  - `../scraper/pkg/engine/runner/runner.go`

### Technical details

- Ticket: `RAGEVAL-006`.
- Recommended first runner kind: `rag-eval/intake`.
- Recommended first workflow scope: two `ttc-dump-guides` documents, `fixed-1200-150`, first one or two chunks enriched, embedding limit around 10, BM25 smoke index only.
- Recommended new table: `document_processing_artifacts`.
- Recommended existing table to wire: `chunk_enrichments`.
