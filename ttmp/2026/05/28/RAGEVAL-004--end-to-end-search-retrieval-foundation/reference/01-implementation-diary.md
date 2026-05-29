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
    - Path: cmd/rag-eval/cmds/search/index.go
      Note: Glazed CLI command for BM25 index builds
    - Path: cmd/rag-eval/cmds/search/query.go
      Note: Glazed CLI command for BM25 queries
    - Path: internal/db/search_queries.go
      Note: DB helpers for chunk/document context and search index metadata
    - Path: internal/services/search/bm25.go
      Note: Phase 1 BM25 build/query implementation
    - Path: internal/services/search/service.go
      Note: Shared search service types and defaults
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

---

## Step 3: Phase 1 BM25 Search Service and CLI

I implemented the first retrieval layer: a disposable Bleve/BM25 index built from canonical SQLite chunks and queried through a new `rag-eval search` CLI group. This gives the project its first end-to-end lexical retrieval path from persisted chunks to ranked chunk previews.

I also ran real TTC corpus queries against a bounded articles+guides index. The results showed that the plumbing works and that BM25 can find obvious exact-match material like `Crape Myrtle Varieties and Guide`; they also surfaced corpus coverage issues, such as `hydrangea pruning` returning weak results because the bounded indexed sample does not appear to contain focused hydrangea material.

### Prompt Context

**User prompt (verbatim):** "Go ahead, task by task, commit at appropriate intervals, keep a diary as you go."

**Assistant interpretation:** Start implementing RAGEVAL-004 incrementally, commit focused milestones, and maintain the ticket diary/changelog while working.

**Inferred user intent:** Move from design into working retrieval functionality while keeping implementation progress reviewable and recoverable.

**Commit (code):** c24d8a5 — "feat: add BM25 search service and CLI"

### What I did

- Added Bleve dependency with:
  - `go get github.com/blevesearch/bleve/v2@latest`
- Added DB search helpers:
  - `internal/db/search_queries.go`
  - `ListChunksWithDocumentContext`
  - `UpsertSearchIndex`
  - `GetSearchIndex`
- Added BM25 search service:
  - `internal/services/search/service.go`
  - `internal/services/search/bm25.go`
  - `internal/services/search/service_test.go`
- Added Glazed/Cobra CLI command group:
  - `cmd/rag-eval/cmds/search/root.go`
  - `cmd/rag-eval/cmds/search/index.go`
  - `cmd/rag-eval/cmds/search/query.go`
- Registered `search.NewCommand()` in `cmd/rag-eval/main.go`.
- Built a real BM25 index:
  - `bm25-ttc-guides-articles-fixed-1200-150`
  - sources: `ttc-dump-guides,ttc-dump-articles`
  - chunks indexed: `204`
  - documents indexed: `6`
- Ran real queries:
  - `crape myrtle varieties`
  - `how to plant arborvitae`
  - `hydrangea pruning`

### Why

BM25 is the cheapest and most explainable retrieval baseline. It proves that chunks can be indexed and retrieved before adding query embeddings, hybrid ranking, or benchmark machinery.

### What worked

- Unit tests passed:
  - `GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/services/search ./internal/db -count=1 -timeout 60s`
- CLI binary built:
  - `GOMAXPROCS=2 GOMEMLIMIT=1024MiB go build ./cmd/rag-eval`
- Real index build succeeded:
  - `chunk_count=204`
  - `document_count=6`
- `crape myrtle varieties` returned chunks from `ttc-article-6737` / `Crape Myrtle Varieties and Guide` as expected.
- `how to plant arborvitae` returned planting/privacy-screen guide material, which is plausible given the bounded sample.

### What didn't work

- `hydrangea pruning` returned weak results from Japanese maple and crape myrtle chunks. This appears to be a corpus/index coverage issue rather than a BM25 plumbing failure: the bounded indexed chunk set likely does not include a focused hydrangea pruning document.
- The implementation currently covers only BM25 service + CLI. HTTP endpoints, vector query search, hybrid search, and smoke query files are still open.

### What I learned

- The first real queries are already useful because they expose whether the indexed corpus subset contains the evidence needed for a query.
- The current TTC sample indexed for articles/guides is small: 204 chunks across 6 documents. This is enough for plumbing validation, but not enough to draw broad retrieval-quality conclusions.
- Exact-match article queries are a good first sanity check; broader care/product queries need richer source coverage and likely product text composition improvements.

### What was tricky to build

The main sharp edge was keeping the search index disposable while preserving enough metadata to query it later. The service now writes the Bleve index under `data/indexes/bm25/{index_id}` and records index metadata in `search_indexes`. Querying first consults SQLite metadata and falls back to the deterministic index-root path.

Another minor sharp edge was Bleve field extraction. Search results need stored fields for IDs, titles, source IDs, chunk indexes, and preview text. The first implementation indexes a small `indexedChunk` struct and requests those fields explicitly in the search request.

### What warrants a second pair of eyes

- Review whether the default Bleve mapping is sufficient or whether we should define explicit field mappings and analyzers before indexing larger corpora.
- Review index ID/path derivation and whether the CLI should require explicit `--index-id` for reproducibility.
- Review the BM25 query shape: current implementation uses a disjunction over `text` and boosted `title`; ranking can be tuned after more real query inspection.

### What should be done in the future

- Add BM25 HTTP endpoints for index build and query.
- Add query-vector search using existing Geppetto/Pinocchio provider resolution.
- Build broader indexes, including products, after deciding whether product `content_text` needs metadata composition improvements.
- Create a small retrieval smoke query file after BM25 and vector search both exist.

### Code review instructions

- Start with:
  - `internal/services/search/bm25.go`
  - `internal/services/search/service.go`
  - `internal/db/search_queries.go`
- Then inspect CLI wiring:
  - `cmd/rag-eval/cmds/search/index.go`
  - `cmd/rag-eval/cmds/search/query.go`
  - `cmd/rag-eval/main.go`
- Validate with:
  - `GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/services/search ./internal/db -count=1 -timeout 60s`
  - `GOMAXPROCS=2 GOMEMLIMIT=1024MiB go build ./cmd/rag-eval`
  - `./rag-eval search index --strategy-id fixed-1200-150 --source-ids ttc-dump-guides,ttc-dump-articles --index-id bm25-ttc-guides-articles-fixed-1200-150 --force --output table`
  - `./rag-eval search query --index-id bm25-ttc-guides-articles-fixed-1200-150 --query "crape myrtle varieties" --limit 5 --output table`

### Technical details

- BM25 index path used during validation:
  - `data/indexes/bm25/bm25-ttc-guides-articles-fixed-1200-150`
- The derived index is intentionally under ignored `data/` and should not be committed.
- Current result rows include rank, retriever, index ID, query, score, chunk ID, document ID, source ID, title, chunk index, URL, and preview.
