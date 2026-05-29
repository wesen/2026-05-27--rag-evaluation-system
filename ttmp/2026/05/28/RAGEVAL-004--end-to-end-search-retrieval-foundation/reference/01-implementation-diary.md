---
Title: Implementation Diary
Ticket: RAGEVAL-004
Status: active
Topics:
    - rag
    - search
    - embeddings
    - evaluation
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/05/28/RAGEVAL-004--end-to-end-search-retrieval-foundation/design-doc/01-end-to-end-search-retrieval-implementation-guide.md
      Note: Design guide authored in Step 1
ExternalSources: []
Summary: Chronological diary for the end-to-end retrieval foundation design ticket.
LastUpdated: 2026-05-28T00:00:00Z
WhatFor: Track why RAGEVAL-004 focuses on base retrieval functionality before benchmark design.
WhenToUse: Read before implementing BM25, vector search, hybrid retrieval, or smoke-query checks.
---


# Diary

## Goal

This diary records the planning work for the base retrieval foundation needed before benchmark design: BM25 search, query-vector search, hybrid retrieval, and smoke-query validation.

## Step 1: Create Retrieval Foundation Ticket and Design Guide

I created a new docmgr ticket for the next phase of the RAG Evaluation System: proving that real queries can retrieve plausible chunks from the corpus before designing benchmarks. The guide focuses on base functionality rather than the Corpus Explorer UI.

The main design decision is to implement retrieval in layers. BM25 lexical search comes first because it is cheap, deterministic, and explainable. Query-vector search comes next because embeddings already exist, but the system still needs user-query-to-chunk retrieval. Hybrid search and smoke-query checks should come only after the individual retrievers work on their own.

### Prompt Context

**User prompt (verbatim):** "Create a new ticket and Create  a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and the nupload to remarkable."

**Assistant interpretation:** Create a new docmgr ticket for implementing end-to-end retrieval functionality, write a clear intern-ready technical guide, store it in the ticket, and upload it to reMarkable.

**Inferred user intent:** Move from corpus/chunk inspection into base retrieval validation so the project can run real corpus queries before investing in benchmark design.

### What I did

- Created ticket `RAGEVAL-004` titled `End-to-End Search Retrieval Foundation`.
- Added tasks for:
  - BM25 lexical search design;
  - query-vector search design;
  - hybrid retrieval and smoke testing;
  - reMarkable upload.
- Wrote `design-doc/01-end-to-end-search-retrieval-implementation-guide.md`.
- The guide covers:
  - current system state;
  - retrieval architecture;
  - BM25 service design;
  - vector query search design;
  - hybrid/RRF design;
  - CLI command plan;
  - HTTP API plan;
  - DB query additions;
  - smoke query file design;
  - validation sequence;
  - implementation phases.

### Why

The system has chunks and partial embeddings, but it cannot yet answer real questions by returning ranked evidence chunks. Benchmark design would be premature until BM25, vector search, and hybrid search can each be validated independently.

### What worked

- Existing project structure gives clear extension points:
  - `internal/services/search/` for retrieval logic;
  - `cmd/rag-eval/cmds/search/` for CLI commands;
  - `internal/api/handlers.go` for HTTP endpoints;
  - `internal/db/queries.go` or `internal/db/search_queries.go` for chunk/document/index metadata queries.
- Existing tables already include `search_indexes`, which can track disposable BM25 indexes rebuilt from canonical SQLite chunks.
- Existing embedding code provides vector encoding/decoding and cosine similarity helpers that query-vector search can reuse.

### What didn't work

- No code implementation was done in this step. This ticket creates the design package for the next implementation pass.
- The current system does not yet have a search service or search CLI commands.

### What I learned

- The next milestone should be retrieval observability, not evaluation metrics.
- BM25 should be implemented first because it reveals ingestion/chunking/text problems without provider costs.
- Query-vector search should scan stored embeddings with explicit candidate limits before introducing native vector indexes.
- Product queries may fail because product metadata is not yet fully composed into `documents.content_text`; that should be treated as a corpus text issue before tuning retrievers.

### What was tricky to build

The main design challenge was keeping the scope focused. It is tempting to jump directly to benchmarks, hybrid ranking, or LLM evaluation. The guide instead stages the work so each layer has a standalone validation path: BM25 first, then vector query search, then hybrid, then smoke query sets, and only then formal benchmarks.

### What warrants a second pair of eyes

- Review the recommendation to use Bleve for BM25 instead of SQLite FTS5.
- Review the proposed `/api/v1/search/*` route shapes.
- Review whether vector search should initially scan SQLite embeddings or introduce a vector index earlier.
- Review the smoke query schema before implementation so it stays lightweight and does not become a premature benchmark framework.

### What should be done in the future

- Implement Phase 1 BM25 service and CLI.
- Run manual TTC queries against guides/articles.
- Add vector query search using existing Geppetto/Pinocchio provider resolution.
- Add hybrid search only after BM25 and vector results are independently plausible.
- Create `eval/ttc-smoke.yaml` after retrieval works.

### Code review instructions

- Start with:
  - `ttmp/2026/05/28/RAGEVAL-004--end-to-end-search-retrieval-foundation/design-doc/01-end-to-end-search-retrieval-implementation-guide.md`
- Then inspect implementation extension points:
  - `internal/db/db.go`
  - `internal/db/queries.go`
  - `internal/services/embedding/service.go`
  - `internal/services/embedding/similarity.go`
  - `internal/services/embedding/vector.go`
  - `internal/services/corpus/service.go`
  - `internal/api/handlers.go`
  - `cmd/rag-eval/main.go`
  - `cmd/rag-eval/cmds/embedding/*`

### Technical details

- Ticket: `RAGEVAL-004`.
- Primary guide: `design-doc/01-end-to-end-search-retrieval-implementation-guide.md`.
- Proposed new package: `internal/services/search`.
- Proposed new CLI group: `rag-eval search`.
- Proposed new endpoint group: `/api/v1/search/*`.
- Recommended implementation order: `BM25 -> manual real queries -> vector query search -> hybrid -> smoke query set -> benchmarks`.

---

## Step 2: reMarkable Upload and Ticket Completion

I uploaded the RAGEVAL-004 design package to reMarkable as a bundled PDF. The bundle includes the end-to-end search retrieval implementation guide and this implementation diary.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Complete the ticket package delivery by publishing the retrieval design guide to reMarkable.

**Inferred user intent:** Make the retrieval implementation plan reviewable as a PDF before implementation begins.

### What I did

- Uploaded the design guide and diary with `remarquee upload bundle`.
- Used remote directory `/ai/2026/05/28/RAGEVAL-004`.
- Marked task 4 complete.
- Updated the changelog with the upload location.

### Why

The user requested that the guide be stored in the ticket and uploaded to reMarkable.

### What worked

- Upload succeeded:
  - `OK: uploaded RAGEVAL-004 Search Retrieval Foundation.pdf -> /ai/2026/05/28/RAGEVAL-004`

### What didn't work

- N/A.

### What I learned

- The retrieval implementation plan is now ready for review before code work starts.

### What was tricky to build

N/A for this upload step. I followed the minimal non-interactive reMarkable upload workflow without redundant status/list calls.

### What warrants a second pair of eyes

- Review the PDF before implementation, especially the BM25 technology choice and the staged boundary between smoke checks and formal benchmarks.

### What should be done in the future

- Start Phase 1 implementation: BM25 service, CLI, and real TTC query validation.

### Code review instructions

- Review the source markdown or uploaded PDF:
  - `design-doc/01-end-to-end-search-retrieval-implementation-guide.md`

### Technical details

- reMarkable path: `/ai/2026/05/28/RAGEVAL-004`.
- Uploaded bundle name: `RAGEVAL-004 Search Retrieval Foundation.pdf`.
