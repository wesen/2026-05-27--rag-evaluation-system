---
Title: Implementation Audit and Recovery Plan
Ticket: RAGEVAL-001
Status: active
Topics:
    - rag
    - embeddings
    - evaluation
    - workflow
    - playground
    - search
DocType: analysis
Intent: long-term
Owners: []
RelatedFiles:
    - Path: cmd/rag-eval/cmds/chunk/apply.go
      Note: Glazed chunk apply command audited for duplicated service logic and persistence risks
    - Path: internal/api/handlers.go
      Note: HTTP route parity and duplicated chunking behavior audited
    - Path: internal/chunking/chunker.go
      Note: Chunking implementation and corrected overlap termination logic (commit cbae145)
    - Path: internal/chunking/chunker_test.go
      Note: Regression tests for chunker termination and overlap validation (commit cbae145)
    - Path: internal/db/db.go
      Note: SQLite schema and chunk strategy identity risks audited
    - Path: ttmp/2026/05/27/RAGEVAL-001--rag-evaluation-system-workflow-driven-document-indexing-with-interactive-playground/design-doc/01-rag-evaluation-system-architecture-and-implementation-guide.md
ExternalSources: []
Summary: Audit of the initial RAG Evaluation System implementation, the chunker runaway-memory incident, what was built correctly, what was not, and the recovery plan.
LastUpdated: 2026-05-27T15:45:00-04:00
WhatFor: Use this after the first implementation burst to understand current code health, known defects, recovery priorities, and guardrails for the next implementation pass.
WhenToUse: Before continuing beyond Phase 2, before assigning work to an intern, or when reviewing the Glazed CLI/HTTP lockstep implementation.
---


# Implementation Audit and Recovery Plan

## Executive summary

The project is now past a pure design document and has a working skeleton: Go server, SQLite schema, embedded React SPA, Glazed CLI command tree, source ingestion, document listing, and an initial chunking subsystem. The best architectural move was the user-requested correction to build Glazed CLI tools in lockstep with the HTTP API. That created an operator-friendly surface for each backend capability and made local validation much faster than driving everything through the browser.

However, the implementation sprint also exposed a serious reliability failure: the first fixed-size chunker could loop indefinitely at the tail of a document when overlap was enabled. That is almost certainly what caused the memory spike and killed the process. The immediate correction is now committed as `cbae145` (`feat: add chunking commands and guard overlap loops`): fixed-size and sentence chunkers reject invalid overlap parameters, fixed-size chunking now terminates at the document end, and regression tests cover the runaway-tail case.

The current code is useful as a scaffold, not yet a production RAG system. The core problems are: the schema does not yet model multiple chunking strategies correctly; CLI and HTTP behavior share some database code but not enough service-layer logic; the scraper workflow engine has not been integrated; Geppetto embeddings are not implemented; Bleve search is not implemented; evaluation metrics are not implemented; the React UI is mostly a themed shell; and the task list currently overstates some completion (for example, Storybook stories are checked off in task text but were not actually created).

The immediate next step should be a stabilization pass, not more feature expansion. Freeze Phase 2, introduce a small service layer used by both HTTP and CLI, repair the chunking schema to support `strategy_id` on chunks, make ingestion/chunking idempotent, add bounded-output behavior to CLI commands, and only then proceed to embeddings.

## Incident: what happened with memory

### Symptom

A run of:

```bash
./rag-eval chunk apply --doc-id doc-5881ea80337070d2 --strategy fixed --chunk-size 200 --overlap 30 --output json
```

was killed by the OS. A constrained rerun produced a stack trace showing `FixedSizeChunker.Chunk()` repeatedly generating chunk IDs with thousands of chunk indexes for a roughly 6 KB document. The document size did not justify the memory growth.

### Root cause

The original algorithm emitted a chunk ending at `totalRunes`, then subtracted `overlap` and continued. At the tail, that can produce a new `start` that still leads to the same `end == totalRunes`, causing the same final span to be emitted repeatedly.

Example with 80 runes, `chunk_size=50`, `overlap=10`:

1. emit `[0:50]`, next start = `40`
2. emit `[40:80]`, next start = `70`
3. emit `[70:80]`, next start = `70`
4. repeat forever

### Correction applied

The corrected fixed-size chunker now validates overlap and breaks once the emitted chunk reaches the text end. Evidence:

- `internal/chunking/chunker.go:49-58` validates positive chunk size, non-negative overlap, and `overlap < chunk_size`.
- `internal/chunking/chunker.go:87-90` exits once `end >= totalRunes`.
- `internal/chunking/chunker.go:92-101` enforces forward progress as a defensive guard.
- `internal/chunking/chunker_test.go:8-26` verifies the overlapping tail terminates as two chunks, not an unbounded stream.
- `internal/chunking/chunker_test.go:28-50` verifies invalid overlaps return errors.

Validation command run after the fix:

```bash
GOMAXPROCS=2 GOMEMLIMIT=768MiB go test ./internal/chunking ./internal/db ./internal/ingest -count=1 -timeout 20s
GOMAXPROCS=2 GOMEMLIMIT=768MiB go build ./cmd/rag-eval
```

A real CLI smoke test then successfully chunked a scanned document into six chunks without runaway memory:

```bash
GOMAXPROCS=2 GOMEMLIMIT=768MiB ./rag-eval chunk apply \
  --db /tmp/rag-eval-audit.db \
  --doc-id "$DOC_ID" \
  --strategy fixed \
  --chunk-size 300 \
  --overlap 50 \
  --output json
```

## What is good

### 1. The design direction is still sound

The original design's main architectural choices remain correct:

1. SQLite as canonical state.
2. Rebuildable indexes for derived search state.
3. Strategy IDs for comparing chunking/embedding configurations.
4. Workflow engine as the durable orchestration layer for long-running ingestion and embedding jobs.
5. React playground for inspecting internals rather than hiding retrieval details.
6. Glazed CLI commands as an operator and testing surface.

Those are the right primitives for a RAG evaluation lab.

### 2. The project now has a coherent Go + React skeleton

The repository has a conventional single-binary shape:

- `cmd/rag-eval/main.go` wires the root CLI command.
- `internal/db/db.go` opens SQLite, enables WAL, and creates tables.
- `internal/api/handlers.go` registers `/api/v1/*` routes.
- `internal/web/spa.go` serves the embedded SPA.
- `web/` contains the React/Vite/RTK Query frontend.

This is a good foundation. It keeps operational complexity low and avoids prematurely splitting the system into services.

### 3. Glazed CLI lockstep was the right correction

The user explicitly asked to build actual functionality as Glazed CLI tools in lockstep with the HTTP API. That was a strong intervention. The current command tree gives a practical surface:

```text
rag-eval source create
rag-eval source list
rag-eval source scan
rag-eval document list
rag-eval document get
rag-eval document chunks
rag-eval chunk apply
rag-eval chunk strategies
rag-eval serve
```

This lets developers validate ingestion and chunking without needing the browser. It also encourages structured output (`--output json`, `--output table`, `--output yaml`) which is useful for automation and future workflow integration.

### 4. The first real defect was converted into a regression test

The memory incident did not just get patched; it now has tests. This is exactly the right recovery behavior. `internal/chunking/chunker_test.go` covers:

1. overlapping tail termination,
2. `overlap >= chunk_size` rejection,
3. negative overlap rejection,
4. sentence chunker overlap validation.

### 5. DB parent directory creation is now handled

`internal/db/db.go:13-18` now creates the parent directory before SQLite opens the DB. This fixes the earlier `disk I/O error: no such file or directory` failure when `data/` did not exist.

## What is bad

### 1. The code sprint outran the design invariants

The design said the system should compare multiple strategies side-by-side. The current `chunks` schema cannot do that cleanly:

```sql
UNIQUE(document_id, chunk_index)
```

Evidence: `internal/db/db.go:93-106` defines `chunks` without a `strategy_id` column and makes `(document_id, chunk_index)` unique. That means two chunking strategies for the same document cannot both have chunk index `0`. The code tries to store `strategy_id` inside `boundaries_json`, but that is not relationally enforceable and does not support joins, uniqueness, or efficient filtering.

Correct shape should be closer to:

```sql
CREATE TABLE chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    strategy_id TEXT NOT NULL REFERENCES chunking_strategies(id),
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    start_offset INTEGER DEFAULT 0,
    end_offset INTEGER DEFAULT 0,
    boundaries_json TEXT DEFAULT '{}',
    text_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(document_id, strategy_id, chunk_index)
);
```

This should be fixed before embeddings, because embeddings depend on chunk identity.

### 2. CLI and HTTP are not truly lockstep yet

They expose overlapping behavior, but they do not share one service layer. For example:

- CLI chunking logic lives in `cmd/rag-eval/cmds/chunk/apply.go:138-223`.
- HTTP chunking logic lives separately in `internal/api/handlers.go`.

This means fixes can land in one path and not the other. The correct architecture is:

```text
internal/services/source.Service
internal/services/document.Service
internal/services/chunking.Service

CLI command -> service method -> db.Queries
HTTP handler -> same service method -> db.Queries
```

The CLI and HTTP should be thin adapters, not two implementations.

### 3. Error handling is inconsistent

The CLI chunk command swallows strategy insertion errors:

```go
err = queries.InsertChunkingStrategy(...)
if err != nil {
    // Might already exist, that's fine
}
```

Evidence: `cmd/rag-eval/cmds/chunk/apply.go:161-170`.

This is too broad. It should only ignore a known SQLite uniqueness conflict if the existing strategy has the same config. Any other error should fail.

The HTTP chunk handler also needs stronger insertion error handling. It currently stores chunks in a loop and must treat DB insertion failures as fatal, not silently continue.

### 4. Idempotency is missing

Important operations are not safe to rerun:

- `source scan` inserts deterministic document IDs but uses plain insert; a second scan can fail on primary key collision.
- `chunk apply` inserts deterministic chunk IDs and cannot rerun cleanly unless chunks are deleted first.
- strategy creation has no config reconciliation.

Workflow-driven systems must assume retries. Scraper workflows will retry ops; retry-unsafe DB writes are a core design bug.

Every write operation should decide explicitly between:

1. insert-once and return existing,
2. upsert if content hash/config hash matches,
3. delete-and-rebuild derived state,
4. fail if the existing row conflicts.

### 5. The task list is now inaccurate

The task list says `Phase 0.4: Create MacWindow, MacMenuBar, MacButton retro UI components with stories` is checked, but Storybook stories were not created. The task title includes both components and stories, so the checked state overclaims.

The high-level Phase 1 and Phase 2 checkboxes remain unchecked even though pieces are implemented. That is better than overclaiming, but the list should be reconciled into narrower truthfully-completed tasks.

### 6. The frontend is mostly a shell

The retro theme and RTK Query setup are useful, but the current UI does not yet expose the actual RAG internals:

- no source creation form wired to POST,
- no directory scan action,
- no chunk application controls,
- no chunk detail view,
- no embeddings inspector functionality,
- no search sandbox functionality,
- no evaluation dashboard functionality,
- no Storybook stories despite the task wording.

The frontend should not be expanded until the backend services settle; otherwise it will bind to unstable APIs.

### 7. The scraper workflow engine is still not integrated

This is a major gap against the original mission. The current ingestion and chunking functions are direct CLI/HTTP calls. They are not scraper workflow ops. That means the system currently lacks durable workflow runs, retries, op results, and workflow-status visualization.

This should be Phase 6 in the original plan, but practically it needs to be pulled earlier once ingestion/chunking are service-layer stable.

### 8. Geppetto and Pinocchio are not yet used

The original request required Geppetto for inference/embeddings and Pinocchio at least for profiles. Neither has been integrated yet. This is acceptable at the current phase, but the implementation should not claim to be a RAG evaluation system until embeddings and retrieval exist.

### 9. Memory safety was not treated as a first-class invariant

RAG systems process arbitrary documents. Any loop over text spans must have explicit progress invariants and bounded output behavior. The first fixed-size chunker did not have this. The fix adds validation/tests, but the lesson should propagate to all future algorithms:

- chunking,
- sentence splitting,
- markdown section splitting,
- embeddings batches,
- search result windows,
- evaluation loops.

## What they did not know / missed

### 1. Overlap chunking has a tail trap

The dangerous case is not just `overlap >= chunk_size`. Even normal overlap causes repeated tail emission if the algorithm does not stop after the final chunk reaches the document end. This is a common chunking bug.

Correct invariant:

```text
For every loop iteration, either:
1. end == total_length and the loop exits, or
2. next_start > current_start.
```

Both conditions must be tested.

### 2. Retriable workflows require idempotent writes

Because the final system is supposed to run through scraper workflows, DB writes must be safe under retry. Plain `INSERT` is usually wrong for workflow ops unless duplicate execution is impossible. The implementation should have started by deciding operation semantics:

```text
ingest file      -> upsert by source_id + path/content_hash
chunk document   -> rebuild derived chunks for (document_id, strategy_id)
embed chunk      -> upsert by chunk_id + embedding_strategy_id + text_hash
build index      -> rebuild disposable index from SQLite truth
run evaluation   -> immutable run record + append results
```

### 3. `strategy_id` must be first-class, not buried in JSON

If a field participates in identity, joins, filters, or comparisons, it belongs in columns and keys, not only JSON. `strategy_id` is identity for chunks, embeddings, enrichments, indexes, search runs, and eval runs.

### 4. CLI/HTTP lockstep means shared behavior, not copied behavior

Adding matching command names and route names is not enough. True lockstep means both call the same service method and return the same domain result shape.

### 5. Tests should precede algorithms that can runaway

Chunking, crawling, batching, and workflow retry loops should all have termination tests from the start. A tiny table-driven test would have caught the tail-loop bug before running against real documents.

### 6. Output defaults can be dangerous when row count is unbounded

Glazed structured output is powerful, but commands like `chunk apply --output json` can emit all chunk text. That is acceptable for small samples and hazardous for large documents. Commands should support:

```text
--emit full|summary|preview
--preview-runes 120
--limit N
```

The current command emits previews, which is good, but the HTTP API returns full chunks in the chunking response. That should be changed to summary by default.

## What they should have done

### 1. Build the service layer before duplicating adapters

Implementation order should have been:

1. `internal/db` migrations and query primitives.
2. `internal/services/source` for source creation and scanning.
3. `internal/services/chunking` for strategy registration, chunk computation, and persistence.
4. HTTP handlers that call services.
5. Glazed commands that call services.
6. Frontend RTK Query endpoints that call HTTP.

Instead, CLI and HTTP were evolved semi-independently.

### 2. Write table-driven tests for every algorithmic primitive

Before running chunking through Glazed, the following tests should have existed:

```text
empty text
short text shorter than chunk_size
exactly chunk_size text
chunk_size + 1 text
normal overlap
zero overlap
negative overlap
chunk_size == overlap
overlap > chunk_size
unicode input
markdown with no headings
markdown with repeated headings
long section fallback
```

### 3. Keep tasks synchronized with actual behavior

Tasks should not combine multiple deliverables in one checkbox if only part is done. For example:

```text
Bad: Create MacWindow, MacMenuBar, MacButton retro UI components with stories
Better:
- Create MacWindow component
- Create MacMenuBar component
- Create MacButton component
- Add Storybook stories for retro components
```

### 4. Mark phase gates only after validation

A phase should not be called complete until it has:

1. code,
2. tests,
3. CLI smoke test,
4. HTTP smoke test,
5. documentation/diary update,
6. task/changelog update.

### 5. Use resource limits during exploratory runs

For this project, dangerous commands should be run with:

```bash
GOMAXPROCS=2 GOMEMLIMIT=768MiB <command>
```

This does not replace correctness tests, but it lowers blast radius during development.

## What to do next time

### 1. Start every phase with invariants

For Phase 2 chunking, the invariants should have been written before code:

```text
- chunk_size > 0
- 0 <= overlap < chunk_size
- every emitted chunk has start < end
- chunk indexes are contiguous per (document_id, strategy_id)
- loop exits after end == len(text)
- total chunks <= ceil(len(text) / (chunk_size - overlap)) + 1
- repeated application for the same (document_id, strategy_id) is idempotent
```

### 2. Make retry behavior explicit

Every workflow op should document:

```text
idempotency key
input hash
output rows
retry-safe behavior
conflict behavior
```

### 3. Maintain one domain method per capability

For example:

```go
type ChunkService struct { ... }
func (s *ChunkService) Apply(ctx context.Context, req ApplyRequest) (*ApplyResult, error)
```

Then:

```text
HTTP POST /documents/{id}/chunk -> ChunkService.Apply
CLI rag-eval chunk apply        -> ChunkService.Apply
Workflow op chunk-document      -> ChunkService.Apply
```

### 4. Keep output bounded by default

Never return full chunk text, full embeddings, or full document bodies unless explicitly requested.

### 5. Commit smaller, validated units

The clean commit cadence should be:

1. schema + query tests,
2. service + unit tests,
3. CLI adapter + smoke test,
4. HTTP adapter + smoke test,
5. frontend adapter.

The sprint mixed several of these boundaries.

## What to do now

## Immediate stabilization plan

### Step 1: Freeze Phase 2 expansion

Do not add embeddings yet. Finish and stabilize ingestion/chunking first.

### Step 2: Repair chunk identity and migrations

Change `chunks` to include `strategy_id` as a real column. Update keys:

```sql
UNIQUE(document_id, strategy_id, chunk_index)
```

Update embeddings/enrichments to reference chunk IDs that are stable for a specific chunking strategy, or include `strategy_id` consistently in their keys.

### Step 3: Extract service layer

Create:

```text
internal/services/source/service.go
internal/services/document/service.go
internal/services/chunking/service.go
```

Move duplicate logic out of:

```text
cmd/rag-eval/cmds/chunk/apply.go
internal/api/handlers.go
cmd/rag-eval/cmds/source/scan.go
```

### Step 4: Make write operations idempotent

Implement these semantics:

```text
source create: insert or return existing if same config
source scan: upsert documents by source_id + file path/hash
chunk apply: delete/rebuild chunks for (document_id, strategy_id) or upsert exact spans
strategy create: insert or validate existing config matches
```

### Step 5: Add safe command output modes

For `chunk apply` and future embedding/search commands:

```text
--emit summary|preview|full
--preview-runes 120
--limit 50
```

Default should be `summary` or `preview`.

### Step 6: Add HTTP parity tests

Add tests that verify CLI and HTTP adapters call the same service behavior. The goal is not to test Cobra or net/http deeply; the goal is to ensure one behavior path.

### Step 7: Reconcile tasks and diary

Update task titles and status to avoid overclaiming. Add diary entries for:

1. Glazed CLI pivot,
2. chunking implementation,
3. memory incident and fix,
4. audit/report creation.

### Step 8: Only then proceed to embeddings

Once Phase 2 is stable, implement Geppetto embedding integration with strict batching and memory controls.

## Current implementation map

| Area | Current state | Assessment |
|---|---|---|
| Go server | `rag-eval serve` works | Good skeleton |
| SQLite | tables exist | Needs migration versioning and chunk strategy repair |
| Source API | list/create/scan | Useful but not idempotent enough |
| Source CLI | list/create/scan | Good operator surface |
| Document API | list/get/chunks | Basic and useful |
| Document CLI | list/get/chunks | Good operator surface |
| Chunking | fixed/sentence/markdown-heading | Initial implementation; fixed runaway bug now covered |
| Chunk CLI | apply/strategies | Useful but persistence model needs repair |
| Chunk HTTP | POST chunk/list strategies | Exists but duplicates service logic |
| Frontend | themed shell + basic tables | Attractive but shallow |
| Storybook | requested in task, not present | Gap |
| Geppetto | not integrated | Future phase |
| Pinocchio | not integrated | Future phase |
| Bleve search | not integrated | Future phase |
| Evaluation metrics | not implemented | Future phase |
| Scraper workflow | not integrated | Major future gap |

## Review checklist for the next engineer

Start here:

1. `internal/chunking/chunker.go`
2. `internal/chunking/chunker_test.go`
3. `cmd/rag-eval/cmds/chunk/apply.go`
4. `internal/api/handlers.go`
5. `internal/db/db.go`

Run:

```bash
GOMAXPROCS=2 GOMEMLIMIT=768MiB go test ./internal/chunking ./internal/db ./internal/ingest -count=1 -timeout 20s
GOMAXPROCS=2 GOMEMLIMIT=768MiB go build ./cmd/rag-eval
```

Smoke test:

```bash
rm -f /tmp/rag-eval-audit.db /tmp/rag-eval-audit.db-shm /tmp/rag-eval-audit.db-wal
GOMAXPROCS=2 GOMEMLIMIT=768MiB ./rag-eval --log-level error source create \
  --db /tmp/rag-eval-audit.db --id audit --name Audit --type filesystem --output json
GOMAXPROCS=2 GOMEMLIMIT=768MiB ./rag-eval --log-level error source scan \
  --db /tmp/rag-eval-audit.db --source-id audit --dir ./internal/chunking --output json
DOC_ID=$(sqlite3 /tmp/rag-eval-audit.db "SELECT id FROM documents LIMIT 1")
GOMAXPROCS=2 GOMEMLIMIT=768MiB ./rag-eval --log-level error chunk apply \
  --db /tmp/rag-eval-audit.db --doc-id "$DOC_ID" --strategy fixed --chunk-size 300 --overlap 50 --output json
```

## Priority backlog

### P0: must fix before embeddings

1. Add `strategy_id` to `chunks` and repair uniqueness.
2. Extract chunking service shared by CLI/HTTP.
3. Make source scan and chunk apply idempotent.
4. Add migration/versioning mechanism instead of only `CREATE TABLE IF NOT EXISTS` strings.
5. Add tests for CLI/HTTP/service parity.

### P1: should fix before frontend expansion

1. Add bounded output modes to chunk commands and HTTP chunk endpoint.
2. Add source creation/scan UI controls.
3. Add chunk apply UI controls and chunk preview table.
4. Add Storybook and actual stories for retro components.
5. Reconcile task list checkboxes.

### P2: next feature phase

1. Integrate Geppetto embeddings.
2. Use Pinocchio profiles for embedding provider configuration.
3. Implement embedding CLI and HTTP endpoints in the same service-layer pattern.
4. Add text-hash-based staleness checks before embedding.
5. Add batching limits and memory limits.

### P3: later feature phases

1. Bleve BM25 index.
2. Optional vector path behind build tags.
3. Hybrid RRF search.
4. Reranking.
5. Evaluation metrics.
6. Scraper workflow engine integration.
7. Interactive frontend playground and dashboard.

## Final assessment

The work is recoverable and the foundation is useful. The mistake was not architectural direction; the mistake was rushing from scaffolding into algorithmic behavior without enough invariants, tests, and retry/idempotency thinking. The chunker memory incident is a valuable early warning: this project will process arbitrary text and must treat termination, bounded output, and retry safety as core correctness requirements.

The correct path now is to slow down, stabilize Phase 1/2, and make CLI/HTTP/workflow share services before adding embeddings. If that discipline is followed, the project can still become the intended RAG evaluation lab. If the team continues adding features on top of the current schema and duplicated adapter logic, it will become difficult to reason about results and unsafe to run on larger corpora.
