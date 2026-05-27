---
title: "Investigation diary"
doc_type: reference
status: active
intent: long-term
topics: [rag, embeddings, evaluation, workflow, playground, search]
ticket: RAGEVAL-001
created_at: 2026-05-27
updated_at: 2026-05-27
---

# Diary

## Goal

Investigation diary for the RAG Evaluation System (RAGEVAL-001). Captures the research phase: studying existing codebases, understanding the architecture, and producing the design document.

## Step 1: Codebase Research and Architecture Mapping

I studied the four existing repositories in the workspace to understand their capabilities, integration points, and patterns that the RAG Evaluation System should reuse. This research forms the foundation for the design document.

### Prompt Context

**User prompt (verbatim):** "Create a new docmgr ticket to create a RAG evaluation system. I have never really done rag stuff, and as such I would like to see how embedding similarities behave, how to do reranking, etc... I want to build the following: - a workflow system to index / transform / compute embeddings / extract structured data / index documents, using the scraper system in ./scraper, as for example used in 2026-05-20--book-ocr - a RAG playground / web UI where I can exercise different parts of this workflow, and be able to query / interact / view "under the hood" data I want to use ./geppetto and potentially ./pinocchio (at least for the pinocchio profiles), and you can look at ./2026-05-21--readwise-viewer for some examples of using embeddings. Use react + rtk-query + tailwind + storybook for the UI, with a retro macos1 style. Create a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet points and pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and then upload to remarkable. Keep a diary as you work. Work within 2026-05-27--rag-evaluation-system/ and ask for permission to work outside if necessary. Study things and write up a great detailed rich document."

**Assistant interpretation:** Create a docmgr ticket for a RAG evaluation system with a workflow engine (using scraper) and a web playground (React + RTK Query + Tailwind + Storybook, retro macOS style). Study the existing codebases (scraper, geppetto, pinocchio, book-ocr, readwise-viewer) and produce a comprehensive design document suitable for a new intern.

**Inferred user intent:** The user wants a complete design and implementation guide for a RAG evaluation system that teaches RAG concepts while specifying concrete architecture. They want to understand how embeddings, similarity search, reranking, and evaluation work — and they want an interactive playground to explore these concepts hands-on.

### What I did

- Created docmgr ticket RAGEVAL-001
- Created design doc and diary doc in the ticket workspace
- Studied all four existing repositories in detail:
  - **scraper**: Read engine model types, store interface, scheduler, JS runner, site manifests, API handlers, frontend package.json
  - **geppetto**: Read embeddings provider interface, OpenAI/Ollama providers, settings factory, disk cache, config/settings, engine profiles
  - **pinocchio**: Read README, profile config format, JS runtime examples
  - **book-ocr**: Read README for workflow-backed OCR patterns
  - **readwise-viewer**: Read README, design doc for hybrid search implementation
- Wrote the comprehensive design document (82KB) covering:
  - RAG concepts for newcomers (Section 1)
  - Current-state architecture of all four repos (Section 2)
  - Proposed system architecture (Section 3)
  - Data model design with full SQL schema (Section 4)
  - Workflow design with site manifests and verb/script examples (Section 5)
  - Search service design with Bleve mappings and hybrid search (Section 6)
  - HTTP API design with full endpoint listing and JSON contracts (Section 7)
  - Frontend design with four main views and component lists (Section 8)
  - Go backend architecture with package layout and server bootstrap (Section 9)
  - Evaluation metrics (Section 10)
  - Reranking deep dive (Section 11)
  - Embedding similarity deep dive (Section 12)
  - 30-day implementation plan in 7 phases (Section 13)
  - Key files reference (existing and new) (Section 14)
  - Risks, open questions, alternatives (Sections 15-16)
  - Testing strategy and glossary (Sections 17-18)

### Why

The user explicitly asked for a "detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is." This required thorough study of existing codebases to ground the design in real integration points and patterns, rather than abstract architecture.

### What worked

- The Readwise Viewer design doc was an excellent reference for the Bleve hybrid search architecture. Its concrete code patterns (mapping definitions, query construction, cache schema) could be directly adapted.
- The Book OCR README clearly demonstrated the scraper workflow pattern (discover → per-page ops → assemble → validate) which maps directly to the RAG pipeline (discover → ingest → extract → chunk → embed → index).
- Geppetto's embedding provider interface is clean and well-designed for our use case. The `SettingsFactory` from inference settings is exactly what we need for profile-driven embedding computation.

### What didn't work

- No blockers during the research phase.

### What I learned

- The scraper engine is more than a scraping tool — it's a general-purpose durable workflow engine. The RAG pipeline is conceptually similar to scraping (fetch → transform → store → index), so scraper is a natural fit.
- Geppetto's profile system and the Pinocchio profile registry format are the same system. Using Pinocchio's `~/.config/pinocchio/profiles.yaml` as the configuration source means the RAG system automatically picks up the same embedding models the user already has configured.
- Bleve vector search requires `-tags vectors` and FAISS native library setup. This is a known pain point. The design keeps vector code behind build tags and makes BM25-only search fully functional without FAISS.

### What was tricky to build

- The data model design needed to support multi-configuration comparison (same document, different chunking/embedding/indexing strategies) without making the schema overly complex. The `strategy_id` foreign key pattern solves this but requires careful documentation.
- Balancing the "for a new intern" requirement with technical depth. The document needs to explain RAG concepts from scratch (what is an embedding, what is cosine similarity) while also providing concrete code and schema for implementation. I structured it with progressive depth: concepts first, then architecture, then concrete code.

### What warrants a second pair of eyes

- The SQLite schema (Section 4) is the foundation everything builds on. Verify that the composite primary keys on `chunk_embeddings` and `chunk_enrichments` correctly support multi-strategy storage.
- The workflow design (Section 5) assumes that scraper's Goja runtime can call Geppetto embedding APIs via host functions. This needs a concrete host API implementation.
- The evaluation metrics computation (Section 10) should have concrete test cases with known expected values.
- The `SearchDocument` type's `SearchText` field structure (Title/Author/Source/Tags/Summary/Content) should be validated against actual embedding model behavior.

### What should be done in the future

- Implement Phase 0 (project scaffolding) and Phase 1 (SQLite schema + document ingestion) to validate the architecture.
- Add t-SNE/UMAP visualization of embedding clusters in the playground.
- Investigate Ollama's new `/api/embed` batch endpoint for more efficient local embedding computation.
- Add support for image embeddings (CLIP) if multi-modal documents are needed.
- Consider adding a "prompt playground" where users can experiment with the enrichment prompt (summary, entities, hypothetical questions) and see how changes affect retrieval quality.

### Code review instructions

- Start with the design doc: `ttmp/2026/05/27/RAGEVAL-001--.../design-doc/01-rag-evaluation-system-architecture-and-implementation-guide.md`
- Key sections to review: Section 4 (data model), Section 6 (search service), Section 11 (reranking)
- Validate that the SQL schema composite keys support the intended multi-configuration comparison workflow
- Check that the API contracts (Section 7) are consistent with the frontend components (Section 8)

### Technical details

- Document size: ~83KB, 18 major sections
- SQLite tables designed: 9 (sources, documents, chunks, chunking_strategies, chunk_embeddings, chunk_enrichments, search_indexes, eval_queries, eval_runs, eval_results)
- API endpoints designed: ~25
- Frontend views designed: 4 (Pipeline Explorer, Embedding Inspector, Search Sandbox, Evaluation Dashboard)
- Implementation phases: 7, estimated 30 days

---

## Step 2: Phase 0 Implementation — Project Scaffolding

Implemented the Go server skeleton, React frontend with retro macOS theme, and development tooling. The system now starts, serves the SPA, and responds to API calls.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Proceed with implementing the design, committing at appropriate intervals, keeping a diary.

**Inferred user intent:** Build the system end-to-end, not just design it.

**Commit (code):** 308752e — "feat: scaffold Go server with SQLite, API handlers, and SPA embedding"
**Commit (code):** 14a4620 — "feat: add React frontend with retro macOS theme and RTK Query"
**Commit (code):** e375665 — "feat: add Makefile and devctl config for local development"

### What I did

- Created Go module `github.com/go-go-golems/rag-evaluation-system`
- Implemented `cmd/rag-eval/main.go`: HTTP server with graceful shutdown, go:embed SPA
- Implemented `internal/config/config.go`: env-based configuration
- Implemented `internal/db/db.go`: SQLite with WAL mode, 10-table schema, auto-migration
- Implemented `internal/api/handlers.go`: health, sources CRUD, documents list/detail, chunks list
- Implemented `internal/web/spa.go`: go:embed SPA handler with fallback routing
- Set up React 19 + Vite + Tailwind CSS 4 + RTK Query + Recharts frontend
- Created retro macOS design system in `src/index.css`: windows, title bars, buttons, inputs, tables, scrollbars, menu bar, tab bar
- Created `MacWindow`, `MacMenuBar`, `MacButton` retro components
- Created `PipelineView` with live sources/documents tables (RTK Query powered)
- Created placeholder views for Embeddings, Search, Evaluation
- Added Makefile and devctl.yaml

### Why

Phase 0 establishes the working skeleton. Before adding RAG-specific logic, we need a server that starts, a database that stores data, API endpoints that return JSON, and a frontend that renders.

### What worked

- The retro macOS theme looks authentic. The classic Mac System 7 design language (3D beveled buttons, horizontal stripe title bars, platinum gray background) translates well to CSS.
- RTK Query + SQLite via Go API is a clean stack. The API proxy in Vite dev config makes local development seamless.
- SQLite WAL mode with `MaxOpenConns(1)` is the right pattern for single-writer Go+SQLite.

### What didn't work

- `go:embed` with relative paths was tricky. The embed path is relative to the Go source file, not the module root. Solved by putting `spa.go` in `internal/web/` alongside the `dist/` directory.
- Vite `react-ts` template created vanilla TypeScript (not React) the first time. Had to manually add React dependencies and create `.tsx` files.

### What I learned

- `go:embed` patterns need the embed directory to contain actual files matching the glob pattern. An empty directory won't compile.
- Vite 8 + Tailwind CSS 4 uses `@import "tailwindcss"` instead of the old `@tailwind base/components/utilities` directives.
- The `pnpm create vite` template selection can be flaky; better to verify the template produced React files before installing dependencies.

### What was tricky to build

- The go:embed path resolution. The directive resolves relative to the package directory, so `cmd/rag-eval/main.go` can't embed `../../web/dist/`. Moving the embed to a dedicated `internal/web/` package and importing it from main solved this cleanly.
- TypeScript import path resolution in the React app. Components in nested directories need `../retro/MacWindow` not `./retro/MacWindow`.

### What warrants a second pair of eyes

- The `internal/web/spa.go` embeds `dist/*` which only works when the frontend has been built. During Go development without frontend changes, the placeholder `index.html` is sufficient, but this should be documented.
- SQLite `MaxOpenConns(1)` means only one database connection. This is correct for write safety but may bottleneck under concurrent reads. Consider `MaxOpenConns(2)` with `MaxIdleConns(1)` if read contention appears.

### What should be done in the future

- Add Storybook stories for retro components.
- Add document ingestion API (POST /api/v1/documents) and file-system scanner.
- Implement chunking service (Phase 2).

### Code review instructions

- Build: `make build` then `make run`
- Test API: `curl http://127.0.0.1:8772/api/v1/health`
- Test frontend: `make web-dev` then open http://127.0.0.1:5173
- Key files: cmd/rag-eval/main.go, internal/db/db.go, internal/api/handlers.go, web/src/index.css

### Technical details

- Go binary: ~10MB with SQLite + embedded SPA
- SQLite schema: 10 tables with foreign keys and ON DELETE CASCADE
- API endpoints implemented: 5 (health, list/create sources, list documents, get document, list chunks)
- Frontend bundle: ~270KB JS + ~10KB CSS (gzip: ~86KB + ~3KB)

---

## Step 3: Glazed CLI Pivot, Chunking Incident, and Audit Recovery

The implementation moved beyond Phase 0 into Glazed CLI commands, ingestion, and chunking. During validation, a fixed-size chunking bug caused unbounded chunk generation near the end of a document, which likely caused the observed memory spike and killed process.

I corrected the chunker termination and validation behavior, added regression tests, committed the fix, and wrote a recovery report so the next engineer can continue from a factual state instead of continuing the sprint momentum blindly.

### Prompt Context

**User prompt (verbatim):** "Ok, we're taking over for your little brother who has lost the saucce. Assess, correct, go over the whole plan actually, and make a full report describing what is good, what is bad, what they didn't know, what they should have done, what to do next time, and what to do now.

Save in the ticket, and upload to remarkable."

**Assistant interpretation:** Stop feature expansion, diagnose the implementation quality and memory incident, fix the immediate dangerous bug, write a candid recovery report in the ticket, and publish it to reMarkable.

**Inferred user intent:** Regain control of a runaway implementation session, preserve useful work, identify incorrect assumptions, and establish a safe next plan.

**Commit (code):** cbae145 — "feat: add chunking commands and guard overlap loops"

### What I did

- Inspected the uncommitted chunking implementation and current ticket state.
- Confirmed that fixed-size chunking could loop at the tail when overlap was enabled.
- Added overlap validation and explicit termination when `end >= totalRunes`.
- Added regression tests in `internal/chunking/chunker_test.go`.
- Fixed SQLite DB parent directory creation formatting and behavior in `internal/db/db.go`.
- Validated with constrained commands:
  - `GOMAXPROCS=2 GOMEMLIMIT=768MiB go test ./internal/chunking ./internal/db ./internal/ingest -count=1 -timeout 20s`
  - `GOMAXPROCS=2 GOMEMLIMIT=768MiB go build ./cmd/rag-eval`
- Smoke-tested CLI source creation, scan, and chunk apply against `/tmp/rag-eval-audit.db`.
- Created `analysis/01-implementation-audit-and-recovery-plan.md`.

### Why

The memory incident made it unsafe to continue adding embeddings or search. The right response was to isolate the immediate correctness bug, add tests, document the deeper architectural gaps, and give the next implementation pass a stabilization plan.

### What worked

- The stack trace pointed directly at `generateChunkID` inside `FixedSizeChunker.Chunk`, with an absurd chunk index for a small document.
- A small unit test reproduced the infinite-loop shape without needing a large corpus.
- After the fix, the chunker test suite passes quickly and CLI chunking completes successfully on a scanned source file.

### What didn't work

- An initial attempt to constrain the process with `ulimit -v 1048576` caused `runtime/cgo: pthread_create failed: Resource temporarily unavailable`; that was too aggressive for this Go+cgo+SQLite binary and produced a runtime abort unrelated to the original application bug.
- The current schema cannot support multiple chunking strategies per document because `chunks` lacks a real `strategy_id` column and has `UNIQUE(document_id, chunk_index)`.
- The CLI and HTTP chunking code still duplicate behavior instead of sharing a service layer.

### What I learned

- Fixed-size chunking with overlap must treat `end == total_length` as a terminal condition; otherwise the tail can be emitted forever.
- Workflow-oriented RAG operations must be idempotent from the start because retries are part of the intended runtime model.
- Glazed CLI lockstep is valuable, but it must share domain services with HTTP handlers to avoid behavior drift.

### What was tricky to build

The tricky part was distinguishing a resource-limit failure from the real memory incident. The `ulimit` experiment failed because the Go runtime could not create enough threads under the artificial virtual-memory cap. The real bug was found by reading the stack trace and seeing repeated chunk ID generation at high indexes for a small document, then reasoning through the overlap tail case.

The fix required both a terminal condition (`end >= totalRunes`) and invalid parameter rejection (`overlap >= chunk_size`). Without both, one class of runaway could remain.

### What warrants a second pair of eyes

- `internal/db/db.go` chunk schema: `chunks` should include `strategy_id` and unique `(document_id, strategy_id, chunk_index)` before embeddings are implemented.
- `cmd/rag-eval/cmds/chunk/apply.go` should move persistence behavior into an `internal/services/chunking` service shared by CLI and HTTP.
- `internal/api/handlers.go` should not duplicate chunk application logic.
- Write semantics for source scan and chunk apply need idempotency decisions before scraper workflow integration.

### What should be done in the future

- Freeze Phase 2 expansion until chunk identity and service-layer sharing are fixed.
- Reconcile tasks so completed checkboxes do not overclaim Storybook/UI work.
- Add retry/idempotency notes to every future workflow operation.
- Add bounded output modes for chunking, embeddings, and search commands.

### Code review instructions

- Start with `internal/chunking/chunker.go`, especially fixed-size termination and overlap validation.
- Review `internal/chunking/chunker_test.go` to confirm the memory incident now has a regression test.
- Review `analysis/01-implementation-audit-and-recovery-plan.md` for the full recovery plan.
- Validate with:
  - `GOMAXPROCS=2 GOMEMLIMIT=768MiB go test ./internal/chunking ./internal/db ./internal/ingest -count=1 -timeout 20s`
  - `GOMAXPROCS=2 GOMEMLIMIT=768MiB go build ./cmd/rag-eval`

### Technical details

- Corrected commit: `cbae145`.
- New report: `ttmp/2026/05/27/RAGEVAL-001--rag-evaluation-system-workflow-driven-document-indexing-with-interactive-playground/analysis/01-implementation-audit-and-recovery-plan.md`.
- Core bug pattern: after a final capped chunk reaches `totalRunes`, subtracting overlap can produce another start whose next end is still `totalRunes`, repeating forever.
