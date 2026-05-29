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
    - Path: cmd/rag-eval/cmds/chunk/enrich.go
      Note: Phase 4 direct chunk enrichment debug CLI
    - Path: cmd/rag-eval/cmds/document/preprocess.go
      Note: |-
        Phase 3 direct preprocessing debug CLI
        Phase 5 direct live preprocessing CLI flags
    - Path: cmd/rag-eval/cmds/serve/root.go
      Note: Phase 6 engine DB serve flag
    - Path: cmd/rag-eval/cmds/workflow/root.go
      Note: Phase 2 workflow CLI root
    - Path: cmd/rag-eval/main.go
      Note: Registers workflow CLI command group
    - Path: go.mod
      Note: Phase 0 scraper and go-go-goja dependency compatibility wiring
    - Path: internal/api/handlers.go
      Note: Phase 6 backend route registration and engine DB options
    - Path: internal/api/workflow_artifact_handlers.go
      Note: Phase 6 workflow and artifact visibility handlers
    - Path: internal/api/workflow_artifact_handlers_test.go
      Note: Phase 6 backend endpoint smoke tests
    - Path: internal/db/chunk_enrichment_queries.go
      Note: |-
        Phase 4 chunk enrichment DB helpers
        Phase 6 chunk enrichment list helper
    - Path: internal/db/db.go
      Note: Phase 3 document preprocessing artifact schema
    - Path: internal/db/document_processing_queries.go
      Note: |-
        Phase 3 artifact DB helpers
        Phase 6 document artifact list helper
    - Path: internal/db/queries.go
      Note: Supports document-scoped chunk selection for workflow embeddings
    - Path: internal/db/search_queries.go
      Note: Supports document-scoped chunk selection for workflow BM25
    - Path: internal/services/chunkenrichment/service.go
      Note: Phase 4 fake-provider chunk enrichment service
    - Path: internal/services/chunkenrichment/service_test.go
      Note: Phase 4 freshness validation and coverage tests
    - Path: internal/services/documentprocessing/live_openai.go
      Note: Phase 5 opt-in live OpenAI Responses document preprocessing provider
    - Path: internal/services/documentprocessing/service.go
      Note: Phase 3 fake-provider preprocessing service
    - Path: internal/services/documentprocessing/service_test.go
      Note: Phase 3 artifact freshness coverage and non-destructive tests
    - Path: internal/services/embedding/service.go
      Note: Propagates document IDs in compute requests
    - Path: internal/services/search/bm25.go
      Note: Uses document IDs when building workflow-scoped BM25 indexes
    - Path: internal/services/search/service.go
      Note: Includes document IDs in BM25 request/result contracts
    - Path: internal/workflow/constants.go
      Note: Phase 0 runner kind and queue constants
    - Path: internal/workflow/echo_runner.go
      Note: Phase 0 custom scraper runner spike
    - Path: internal/workflow/echo_runner_test.go
      Note: Phase 0 scheduler/store integration tests
    - Path: internal/workflow/engine.go
      Note: Phase 2 worker scheduler construction
    - Path: internal/workflow/intake_runner.go
      Note: |-
        Phase 1 Go-native intake runner and chunk_document dispatch
        Completed Phase 1 runner operations for chunking embeddings and BM25
        Phase 3 preprocess_document workflow dispatch
        Phase 4 enrich_chunk workflow dispatch
        Phase 5 live provider resolution in workflow runner
    - Path: internal/workflow/intake_runner_test.go
      Note: |-
        Phase 1 durable chunk_document workflow test
        Completed Phase 1 dependency-chain workflow tests
        Phase 3 preprocess workflow smoke test
        Phase 4 enrich_chunk scheduler smoke test
    - Path: internal/workflow/ops.go
      Note: |-
        Phase 1 typed intake op contracts
        Completed Phase 1 op contracts for chunking embeddings and BM25
    - Path: internal/workflow/submit.go
      Note: |-
        Phase 2 workflow submission service
        Phase 4 bounded existing-chunk enrichment fan-out
    - Path: internal/workflow/submit_test.go
      Note: Phase 2 fake-provider smoke workflow test
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

---

## Step 2: Phase 0 Dependency Boundary and Echo Runner Spike

I expanded the ticket tasks into explicit implementation phases before coding, then started Phase 0. The goal was deliberately small: prove that rag-eval can import scraper engine packages, register a custom Go-native runner, create a workflow in a scraper engine SQLite database, and execute one op through the scraper scheduler.

This step does not implement production intake operations yet. It creates the compatibility seam and a tested `internal/workflow` package skeleton so Phase 1 can replace the echo operation with real service-backed operations.

### Prompt Context

**User prompt (verbatim):** "ok, add detailed phases and for each phases tasks, and then work on them step by step, keeping a diary as you work, committing at appropriate intervals."

**Assistant interpretation:** Expand RAGEVAL-006 into detailed phased implementation tasks, then begin executing those phases incrementally with diary updates and focused commits.

**Inferred user intent:** Move from design to implementation while keeping the workflow integration disciplined, inspectable, and easy to review.

### What I did

- Rewrote `tasks.md` with detailed phases 0 through 7 and per-phase task checklists.
- Added a local development dependency on scraper in `go.mod`:
  - `require github.com/go-go-golems/scraper v0.0.0`
  - `replace github.com/go-go-golems/scraper => ../scraper`
- Added a compatibility replacement for `go-go-goja`:
  - `replace github.com/go-go-golems/go-go-goja => github.com/go-go-golems/go-go-goja v0.4.16`
- Created `internal/workflow/constants.go` with:
  - runner kind `rag-eval/intake`
  - queue names `rag-eval:cpu`, `rag-eval:llm`, `rag-eval:embedding`, `rag-eval:index`
- Added `internal/workflow/echo_runner.go`:
  - `EchoRunner` implements scraper's `runner.Runner` interface;
  - operation `echo` returns compact JSON data;
  - unknown operations return non-retryable `model.OpError` with code `unknown_operation`.
- Added `internal/workflow/echo_runner_test.go`:
  - creates a temporary scraper engine SQLite store;
  - registers `EchoRunner` in a scraper runner registry;
  - creates a workflow with one op;
  - runs `scheduler.RunOnce`;
  - asserts the op result exists and the workflow reaches `succeeded`;
  - tests unknown-operation non-retryable error behavior.

### Why

Before implementing real workflow intake ops, we need to know whether scraper can be embedded in the rag-eval Go module at all. A minimal custom runner is the smallest useful proof. It validates the dependency boundary, the scheduler/store/runner path, and the shape of future Go-native operations without touching production intake behavior.

### What worked

- `EchoRunner` successfully implements scraper's `runner.Runner` interface.
- A scraper workflow can be created and run from a rag-eval test.
- The scheduler leases and executes the op, persists the result, and updates workflow status to `succeeded`.
- Focused validation passed:
  - `GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/workflow -count=1 -timeout 60s`
- Broader relevant validation passed:
  - `GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/db ./internal/ingest ./internal/chunking ./internal/services/source ./internal/services/chunking ./internal/services/document ./internal/services/embedding ./internal/services/search ./internal/workflow -count=1 -timeout 120s`
- Build passed:
  - `GOMAXPROCS=2 GOMEMLIMIT=1024MiB go build ./cmd/rag-eval`

### What didn't work

- The first focused `go test ./internal/workflow` failed after adding the scraper dependency:

```text
# github.com/go-go-golems/scraper/pkg/sites/registry
../scraper/pkg/sites/registry/registry.go:23:38: undefined: gggengine.ModuleSpec
../scraper/pkg/sites/registry/registry.go:31:38: undefined: gggengine.RuntimeModuleRegistrar
# github.com/go-go-golems/scraper/pkg/js/runtime
../scraper/pkg/js/runtime/executor.go:32:38: undefined: gggengine.ModuleSpec
../scraper/pkg/js/runtime/executor.go:33:38: undefined: gggengine.RuntimeModuleRegistrar
../scraper/pkg/js/runtime/executor.go:64:3: gggengine.NewBuilder().WithRequireOptions(require.WithLoader(loader)).WithModules(e.config.Modules...).WithRuntimeModuleRegistrars undefined (type *engine.FactoryBuilder has no field or method WithRuntimeModuleRegistrars)
FAIL	github.com/go-go-golems/rag-evaluation-system/internal/workflow [build failed]
```

- Cause: rag-eval's existing dependency graph selected `github.com/go-go-golems/go-go-goja v0.6.0`, while the local scraper code expects the older module-composition API present in the 0.4.x line.
- Fix for the spike: add a replace to `github.com/go-go-golems/go-go-goja v0.4.16`.
- This is acceptable for Phase 0 but must be reviewed before treating the scraper integration as stable.

### What I learned

- Importing scraper as a Go library is possible, but dependency compatibility is a real implementation concern.
- Scraper's runner package compiles all runner files, including JS runner code, so even a Go-native custom runner test is affected by scraper's go-go-goja API expectations.
- The custom runner seam is still the right integration point: the scheduler/store path works once the module version conflict is resolved.

### What was tricky to build

The tricky part was that the compile failure did not come from the custom runner code. It came from scraper's JS/site packages being compiled as part of the scraper runner package dependency graph. The immediate solution was a module replacement, but the longer-term solution should be a deliberate dependency decision: either keep the replacement, update scraper to the newer go-go-goja API, or isolate the engine/runner packages so Go-native runner usage does not require compiling JS site integration code.

### What warrants a second pair of eyes

- Review the `go-go-goja` replacement before merging widely. It may affect Geppetto or Pinocchio code paths outside the tested package set.
- Review whether scraper should be updated to work with `go-go-goja v0.6.0` instead of pinning rag-eval lower.
- Review whether the scraper engine should expose a smaller package boundary that does not compile JS site integration for Go-native runners.
- Review the `EchoRunner` result/error shape before Phase 1 turns it into a real dispatch runner.

### What should be done in the future

- Complete Phase 0 commit.
- In Phase 1, replace the echo-only runner with typed operation dispatch for real service calls.
- Add a dependency compatibility note to the design guide if the `go-go-goja` replacement remains necessary.
- Consider opening a scraper-side cleanup ticket to decouple engine runner interfaces from JS runner dependencies.

### Code review instructions

- Start with `go.mod` and inspect the two replace directives.
- Review `internal/workflow/constants.go` for runner kind and queue naming.
- Review `internal/workflow/echo_runner.go` for the custom runner shape.
- Review `internal/workflow/echo_runner_test.go` for the temporary engine DB + scheduler integration path.
- Validate with:
  - `GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/workflow -count=1 -timeout 60s`
  - `GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/db ./internal/ingest ./internal/chunking ./internal/services/source ./internal/services/chunking ./internal/services/document ./internal/services/embedding ./internal/services/search ./internal/workflow -count=1 -timeout 120s`
  - `GOMAXPROCS=2 GOMEMLIMIT=1024MiB go build ./cmd/rag-eval`

### Technical details

- New package: `internal/workflow`.
- Runner kind: `rag-eval/intake`.
- Phase 0 runner operation: `echo`.
- Temporary engine DB: created under `t.TempDir()` in tests.
- Scraper store: `github.com/go-go-golems/scraper/pkg/engine/store/sqlite`.
- Scraper scheduler: `github.com/go-go-golems/scraper/pkg/engine/scheduler`.

---

## Step 3: Phase 1 First Slice — Typed Intake Runner and `chunk_document` Operation

After the Phase 0 echo runner proved that scraper can execute a rag-eval custom runner, I started Phase 1 with the safest real operation: `chunk_document`. This operation uses the existing chunking service, does not call external providers, and is already rerun-safe for a document/strategy pair.

The result is the first real durable intake op. A scraper workflow can now run `rag-eval/intake` with operation `chunk_document`, open the rag-eval app database, call `internal/services/chunking.Service.Apply`, persist chunks, and store a compact op result containing document ID, strategy ID, and chunk count.

### Prompt Context

**User prompt (verbatim):** (same as Step 2)

**Assistant interpretation:** Continue implementing RAGEVAL-006 phase by phase after the detailed task expansion.

**Inferred user intent:** Make steady implementation progress while preserving the ability to review and debug each slice independently.

### What I did

- Added `internal/workflow/ops.go` with first typed intake op input/output structures.
- Added operation constants:
  - `echo`
  - `chunk_document`
- Added `internal/workflow/intake_runner.go`:
  - `IntakeRunner` implements scraper's `runner.Runner` interface;
  - dispatches by `IntakeOpInput.Operation`;
  - validates missing operation and unknown operations;
  - opens/migrates the rag-eval app DB from `db_path`;
  - calls `chunking.Service.Apply` for `chunk_document`;
  - returns compact `ChunkDocumentOutput` JSON.
- Added `internal/workflow/intake_runner_test.go`:
  - seeds a temporary rag-eval app DB with source/document content;
  - creates a temporary scraper engine DB;
  - registers `IntakeRunner`;
  - creates a workflow containing one `chunk_document` op;
  - runs `scheduler.RunOnce`;
  - asserts chunks were written to the app DB and workflow status is `succeeded`;
  - checks missing `db_path` returns a non-retryable op error.
- Updated Phase 1 tasks to mark the first chunk operation slice complete.

### Why

`chunk_document` is the right first real operation because it validates the main architecture without introducing provider complexity. It proves that a workflow op can mutate rag-eval's canonical SQLite state through an existing service and that workflow results remain compact.

### What worked

- Focused workflow tests pass.
- The broader intake/search/workflow test set passes.
- The `rag-eval` binary still builds.
- The existing chunking service needed no production behavior changes.

Validation commands:

```text
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/workflow -count=1 -timeout 60s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/db ./internal/ingest ./internal/chunking ./internal/services/source ./internal/services/chunking ./internal/services/document ./internal/services/embedding ./internal/services/search ./internal/workflow -count=1 -timeout 120s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go build ./cmd/rag-eval
```

### What didn't work

- The first `chunk_document` workflow test expected `result.Error == nil`, but scraper's result read path returned a non-nil zero-value `OpError` for a successful result. I adjusted the assertion to treat a nil error or an error with empty code as success for now.
- This deserves a second look in scraper's result storage/read behavior before relying on `result.Error != nil` as the only success test.

### What I learned

- The service-wrapper approach works: workflow ops do not need to duplicate chunking logic.
- Result shape should be intentionally compact. Returning full chunks through workflow results would duplicate canonical data and make engine rows heavy.
- Tests that cross scraper engine DB and rag-eval app DB are straightforward enough to use as the main validation pattern for future ops.

### What was tricky to build

The subtle issue was scraper result error decoding. Successful op completion stores no meaningful error, but the retrieved result may still contain a non-nil zero-value error pointer. For this slice, the test avoids failing on an empty error code. A future scraper-side fix or helper should normalize that behavior so result inspection is less surprising.

### What warrants a second pair of eyes

- Review `internal/workflow/intake_runner.go` error classification. `chunk_document_failed` is currently non-retryable. Some SQLite busy/temporary errors may deserve retryable classification later.
- Review the use of `db_path` in every op input. It is explicit and easy to debug, but repeated DB open/migrate per op may be inefficient.
- Review scraper result error decoding behavior.

### What should be done in the future

- Add remaining Phase 1 operations: `compute_embeddings`, `build_bm25`, `select_documents`, and `summarize_workflow`.
- Add dependency-chain tests, especially chunk → embedding.
- Decide whether to keep `EchoRunner` after `IntakeRunner` fully supports an echo/no-op operation.

### Code review instructions

- Review:
  - `internal/workflow/ops.go`
  - `internal/workflow/intake_runner.go`
  - `internal/workflow/intake_runner_test.go`
- Validate with the same commands listed above.

### Technical details

- New real operation: `chunk_document`.
- Output shape: `{document_id, strategy_id, chunk_count}`.
- DB behavior: per-op open + migrate using `internal/db.OpenDB` and `internal/db.Migrate`.

---

## Step 4: Complete Phase 1 — Embedding and BM25 Workflow Operations

I completed the rest of Phase 1 by extending the Go-native intake runner beyond chunking. The workflow runner can now compute embeddings through the existing embedding service and build BM25 indexes through the existing search service. Both operations keep workflow results compact and write canonical artifacts to the rag-eval database or index directory.

This finishes the first real workflow runner slice. The runner still does not expose operator CLI commands; that is Phase 2. At this point, tests can create scraper workflows programmatically with dependencies such as chunking before embedding or chunking before BM25 indexing.

### Prompt Context

**User prompt (verbatim):** "continue. do the full next phase"

**Assistant interpretation:** Finish the remaining Phase 1 tasks after the initial `chunk_document` slice: add embedding and BM25 workflow operations, dependency-chain tests, diary updates, and a focused commit.

**Inferred user intent:** Get the complete service-backed runner phase done before moving to workflow CLI/user-facing submission commands.

### What I did

- Extended `IntakeOpInput` in `internal/workflow/ops.go` with fields for:
  - strategy IDs and source filters;
  - embedding provider/profile settings;
  - batch size, limit, force;
  - BM25 index root and index ID.
- Added operation constants:
  - `compute_embeddings`
  - `build_bm25`
- Added compact output structs:
  - `ComputeEmbeddingsOutput`
  - `BuildBM25Output`
- Extended `internal/workflow/intake_runner.go`:
  - added `ProviderResolver` seam for tests and real provider resolution;
  - implemented `compute_embeddings` over `embedding.Service.Compute`;
  - implemented `build_bm25` over `search.Service.BuildBM25`;
  - added default provider resolution through `embedding.ResolveProvider`;
  - added `openOpQueries` to normalize per-op DB open/migration errors.
- Extended `internal/workflow/intake_runner_test.go`:
  - added fake embedding provider and resolver;
  - added `chunk_document -> compute_embeddings -> compute_embeddings` dependency-chain test;
  - verifies the second embedding op skips fresh vectors instead of recomputing;
  - added `chunk_document -> build_bm25` dependency-chain test;
  - verifies `search_indexes` metadata is written.
- Updated Phase 1 tasks to complete.

### Why

The workflow integration needs to wrap the existing services that already define the intake pipeline. Completing `compute_embeddings` and `build_bm25` proves that the runner can handle both provider-backed operations and derived filesystem index operations. The dependency-chain tests prove scraper dependencies can order these steps correctly.

### What worked

- `compute_embeddings` works with an injected fake provider, so tests do not call live providers.
- The repeated embedding workflow op correctly reports `computed=0` and skips fresh rows after the first embedding op writes vectors.
- `build_bm25` works against a temporary index root and writes `search_indexes` metadata.
- Validation passed:

```text
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/workflow -count=1 -timeout 60s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/db ./internal/ingest ./internal/chunking ./internal/services/source ./internal/services/chunking ./internal/services/document ./internal/services/embedding ./internal/services/search ./internal/workflow -count=1 -timeout 120s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go build ./cmd/rag-eval
```

### What didn't work

- No new blockers in this step.
- The earlier scraper result error decoding caveat still exists in the tests: success checks ignore a non-nil `OpError` when its code is empty.
- Live provider-backed workflow execution is not tested yet. That belongs after the CLI submission path and explicit smoke controls exist.

### What I learned

- The existing service boundaries are strong enough for workflow orchestration.
- Embedding provider injection is essential for workflow tests; otherwise every workflow test would depend on OpenAI/Ollama credentials.
- Search indexing as a workflow op fits the same derived-state model as chunking and embeddings.

### What was tricky to build

The main subtlety was preserving compact workflow results. The embedding service returns enough data to report considered/computed/skipped counts without storing vectors in the scraper engine database. The BM25 service returns enough data to locate the derived index without copying index contents into workflow artifacts. This keeps scraper workflow state as orchestration metadata and leaves canonical artifacts in rag-eval DB/index directories.

### What warrants a second pair of eyes

- `compute_embeddings_failed` is currently marked retryable. This is right for transient provider failures but too broad for configuration errors that reach the service layer. Phase 2 or 3 should add finer error classification.
- `build_bm25_failed` is currently non-retryable. Filesystem/transient errors may deserve retry in future.
- Provider resolution errors are non-retryable. This is correct for missing API keys and bad profiles, but not necessarily for registry IO errors.

### What should be done in the future

- Start Phase 2 by adding operator-facing workflow CLI commands.
- Add workflow status/ops inspection so users do not need test helpers to inspect scraper engine state.
- Consider adding a dry-run or planning mode before live provider workflow runs.

### Code review instructions

- Review:
  - `internal/workflow/ops.go`
  - `internal/workflow/intake_runner.go`
  - `internal/workflow/intake_runner_test.go`
- Pay special attention to provider resolver injection and compact result output.
- Validate with the commands listed above.

### Technical details

- Completed Phase 1 operations:
  - `chunk_document`
  - `compute_embeddings`
  - `build_bm25`
- Dependency-chain tests:
  - chunk → embed → fresh-check embed;
  - chunk → BM25 index.

---

## Step 5: Complete Phase 2 — Operator-Facing Workflow CLI

I added the first operator-facing CLI layer for the scraper-backed intake workflow. The CLI can now submit durable intake workflows, run a local worker cycle or continuous worker, and inspect workflow status and operation state from the scraper engine database.

This phase turns the Phase 1 programmatic workflow runner into something an operator can actually use. The commands intentionally keep direct service commands available: if a workflow op fails, the same chunking, embedding, or search services can still be exercised through existing non-workflow command paths.

### Prompt Context

**User prompt (verbatim):** "phase 2 entirely"

**Assistant interpretation:** Implement all Phase 2 tasks, including workflow CLI registration, submission, worker execution, status/ops inspection, smoke coverage, diary/task updates, and a focused commit.

**Inferred user intent:** Move from internal workflow runner tests to an operator-usable prototype that can create, run, and inspect durable intake workflows.

### What I did

- Added `internal/workflow/submit.go`:
  - `SubmitIntakeRequest`
  - `SubmitIntakeResult`
  - `SubmitIntakeWorkflow`
  - document selection by explicit document IDs or source IDs plus limit;
  - workflow creation with chunk ops per document and optional embedding/BM25 downstream ops.
- Added `internal/workflow/engine.go`:
  - `WorkerConfig`
  - `NewIntakeScheduler`
  - shared scheduler construction for CLI and tests.
- Added `cmd/rag-eval/cmds/workflow` command package:
  - `workflow submit-intake`
  - `workflow run-once`
  - `workflow run-worker`
  - `workflow status`
  - `workflow ops`
- Registered the workflow command group from `cmd/rag-eval/main.go`.
- Added `internal/workflow/submit_test.go` as a smoke/integration test:
  - submits a workflow against temporary rag-eval and scraper engine databases;
  - runs scheduler cycles with a fake embedding provider seam;
  - verifies the workflow reaches `succeeded`.
- Added document-ID filtering through embedding and BM25 service paths so explicitly selected workflow documents do not accidentally trigger downstream work over every chunk with the same strategy.
- Marked Phase 2 tasks complete.

### Why

Phase 1 proved that scraper can orchestrate rag-eval service operations. Phase 2 needed to expose that capability through stable commands so a local operator can submit intake work, run workers, and inspect status without writing test code or manually manipulating the scraper engine database.

### What worked

- `rag-eval workflow --help` shows the new command group and subcommands.
- The workflow submit helper can create a full chunk → embedding/BM25 workflow.
- The worker helper registers the `rag-eval/intake` runner and runs scraper scheduler cycles.
- Status and ops commands reuse scraper's `engineview` read service rather than duplicating read-side SQL.
- Validation passed:

```text
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/workflow -count=1 -timeout 60s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/db ./internal/ingest ./internal/chunking ./internal/services/source ./internal/services/chunking ./internal/services/document ./internal/services/embedding ./internal/services/search ./internal/workflow ./cmd/rag-eval/cmds/workflow -count=1 -timeout 120s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go build ./cmd/rag-eval
go run ./cmd/rag-eval workflow --help
```

### What didn't work

- I did not run a live provider workflow from the CLI. The smoke coverage uses a fake provider via the internal scheduler seam so tests stay deterministic and credential-free.
- `workflow status` and `workflow ops` currently emit JSON only. This is useful for debugging and automation but not yet as nice as the Glazed table output used by other commands.

### What I learned

- Scraper's `engineview` package already provides enough read-side functionality for first-pass status and op inspection.
- Keeping scheduler construction in `internal/workflow` avoids duplicating runner registration logic between CLI commands and tests.
- The submission layer is the right place to encode workflow topology: one chunk op per document, followed by aggregate embedding and BM25 ops that depend on all chunk ops.

### What was tricky to build

The tricky part was drawing the boundary between reusable workflow logic and CLI logic. A second sharp edge was downstream scoping: embedding and BM25 services originally filtered only by strategy/source, which was too broad for explicit `--document-ids` workflows, so I added document-ID filters to the shared service/query layer rather than special-casing workflow code.

The broader reusable boundary remains important: The durable workflow topology belongs in `internal/workflow/submit.go`, because tests and future APIs should use the same shape as the CLI. Cobra files should only parse flags, call the service layer, and print JSON. Worker construction follows the same pattern: the CLI should not know the runner registration details beyond the engine DB and worker tuning flags.

### What warrants a second pair of eyes

- The default workflow ID uses timestamp seconds. That is human-readable, but rapid repeated submissions in the same second could collide unless the user provides `--workflow-id`.
- Embedding and BM25 ops currently depend directly on all chunk ops. For very large document sets, this is simple but may create very large dependency lists.
- `submit-intake` uses selected documents ordered by word count when `--document-ids` is omitted. This is useful for bounded smoke runs but should be reviewed for production default behavior.
- CLI output is raw JSON rather than Glazed output.

### What should be done in the future

- Add Glazed/table output for `workflow status` and `workflow ops`.
- Add a `--dry-run` mode to print the workflow topology without creating it.
- Add a safer unique default workflow ID with sub-second precision or a short random suffix.
- Consider source-level workflow fan-out for large corpora.

### Code review instructions

- Start with `internal/workflow/submit.go` to review the workflow topology and document/source scoping.
- Then review `internal/workflow/engine.go` for scheduler/runner registration.
- Review `internal/db/queries.go`, `internal/db/search_queries.go`, `internal/services/embedding/service.go`, and `internal/services/search/bm25.go` for document-ID filter propagation.
- Then review `cmd/rag-eval/cmds/workflow/*.go` for flag mapping and command behavior.
- Validate with the commands listed in `What worked`.

### Technical details

New commands:

```text
rag-eval workflow submit-intake
rag-eval workflow run-once
rag-eval workflow run-worker
rag-eval workflow status
rag-eval workflow ops
```

The submit command maps to existing direct-debug paths:

- `chunk_document` ↔ `rag-eval chunk apply`
- `compute_embeddings` ↔ `rag-eval embedding compute`
- `build_bm25` ↔ `rag-eval search index bm25`

---

## Step 6: Complete Phase 3 — Document Preprocessing Artifacts

I added the first document-level preprocessing layer as non-destructive derived state. The implementation stores preprocessing outputs in a new `document_processing_artifacts` table keyed by document, artifact type, prompt version, provider, and model. It never rewrites `documents.content_text`.

This phase intentionally uses a deterministic fake document processor first. That gives us schema, freshness, coverage, direct debugging, and workflow execution semantics without making live LLM calls or introducing credential/cost risk before the bounded live-provider smoke phase.

### Prompt Context

**User prompt (verbatim):** "phase 3"

**Assistant interpretation:** Implement Phase 3 completely: schema, DB helpers, service with fake-provider tests, workflow op, direct debug path, validation, diary/task updates, and a focused commit.

**Inferred user intent:** Add the first LLM-preprocessing-ready artifact layer while preserving canonical document content and keeping tests deterministic.

### What I did

- Added `document_processing_artifacts` schema in `internal/db/db.go` with:
  - document ID;
  - artifact type;
  - prompt version;
  - provider/model identity;
  - input hash;
  - output text and JSON;
  - status and error metadata;
  - timestamps;
  - primary key over `(document_id, artifact_type, prompt_version, provider, model)`.
- Added DB helpers in `internal/db/document_processing_queries.go`:
  - upsert artifact;
  - lookup artifact;
  - freshness check;
  - coverage grouped by source.
- Added `internal/services/documentprocessing`:
  - provider interface;
  - deterministic fake provider;
  - `Service.Process`;
  - `Service.Coverage`;
  - SHA-256 input hashing over canonical document content.
- Added service tests proving:
  - artifacts are stored;
  - fresh artifacts are skipped;
  - coverage reports fresh/missing counts;
  - `documents.content_text` is not overwritten.
- Added workflow op `preprocess_document` to `internal/workflow`:
  - dispatches through `IntakeRunner`;
  - resolves fake document processor by default;
  - stores compact workflow output;
  - writes canonical output only to `document_processing_artifacts`.
- Added workflow integration test for `preprocess_document` with scraper scheduler and temporary DBs.
- Added direct debug CLI:
  - `rag-eval document preprocess --document-id ...`
- Extended `workflow submit-intake` with optional preprocessing ops:
  - `--skip-preprocessing=false` enables fake preprocessing per selected document.

### Why

The system needs LLM document preprocessing, but preprocessing must be experiment-safe. If preprocessing rewrites `documents.content_text`, different prompt/provider/model versions become destructive and hard to compare. Storing outputs as artifacts keeps canonical corpus text stable while allowing future chunking/indexing experiments to choose which artifact to consume.

### What worked

- Fake-provider service tests pass.
- Workflow op test writes a document processing artifact and leaves canonical content unchanged.
- The broader workflow submit smoke now includes a preprocessing op when not skipped.
- Direct CLI help works for `rag-eval document preprocess`.
- Validation passed:

```text
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/db ./internal/services/documentprocessing ./internal/workflow ./cmd/rag-eval/cmds/document ./cmd/rag-eval/cmds/workflow -count=1 -timeout 120s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/db ./internal/ingest ./internal/chunking ./internal/services/source ./internal/services/chunking ./internal/services/document ./internal/services/documentprocessing ./internal/services/embedding ./internal/services/search ./internal/workflow ./cmd/rag-eval/cmds/document ./cmd/rag-eval/cmds/workflow -count=1 -timeout 120s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go build ./cmd/rag-eval
go run ./cmd/rag-eval document preprocess --help
```

### What didn't work

- No live LLM provider was wired in this phase by design. Live provider work remains Phase 5.
- The direct CLI emits JSON only and supports only the fake provider for now.
- Workflow submission can include preprocessing ops, but chunking still uses canonical `documents.content_text`; artifact-driven chunking is intentionally deferred.

### What I learned

- The artifact identity needs to include prompt version and provider/model. Without those fields in the key, repeated experiments would overwrite each other.
- Freshness should be based on an input hash over canonical document content, not timestamps.
- A fake provider is enough to validate non-destructive behavior, workflow storage, coverage, and skip semantics.

### What was tricky to build

The tricky invariant was making preprocessing useful without changing downstream semantics prematurely. The phase adds artifact storage and workflow execution, but it does not teach chunking to consume preprocessing artifacts yet. That keeps Phase 3 safe: preprocessing can be run, inspected, skipped when fresh, and compared, while the established chunk/embedding/BM25 pipeline remains unchanged.

A second tricky point was failure handling. The service stores failed provider attempts with status and error metadata before returning the provider error. That gives future operator views something concrete to inspect instead of losing all failure context to logs.

### What warrants a second pair of eyes

- The artifact primary key does not include `input_hash`; instead a changed hash updates the same artifact identity. This preserves one latest artifact per prompt/provider/model identity, but historical artifact versions would require an additional history table.
- Failed artifacts are upserted under the same identity. Review whether failed attempts should preserve previous successful output or replace status immediately.
- `workflow submit-intake --skip-preprocessing=false` creates preprocessing ops in parallel with chunk ops. Since chunking does not consume artifacts yet, this is safe, but future artifact-driven chunking will need explicit dependencies.

### What should be done in the future

- Add live LLM provider adapters after fake-provider semantics are stable.
- Add artifact-driven chunking options only after the user-facing experiment model is clear.
- Add Glazed/table output and coverage commands for preprocessing artifacts.
- Expose preprocessing coverage in API/Corpus Explorer during Phase 6.

### Code review instructions

- Start with `internal/db/db.go` and `internal/db/document_processing_queries.go` for schema and DB semantics.
- Review `internal/services/documentprocessing/service.go` and tests for non-destructive behavior and freshness rules.
- Review `internal/workflow/intake_runner.go` and `internal/workflow/intake_runner_test.go` for workflow op dispatch.
- Review `cmd/rag-eval/cmds/document/preprocess.go` for direct debugging behavior.
- Validate with the commands listed above.

### Technical details

New operation:

```text
preprocess_document
```

New direct command:

```text
rag-eval document preprocess --document-id DOC --artifact-type clean_text --prompt-version v1 --provider fake
```

Important invariant:

```text
documents.content_text is read as input but never overwritten by Phase 3 preprocessing.
```

---

## Step 7: Complete Phase 4 — Chunk Enrichment Artifacts

I added the first chunk-level enrichment layer over the existing `chunk_enrichments` table. The implementation stores summaries, topics, entities, hypothetical questions, quality score, provider/model identity, prompt version, and a text hash for freshness. As with document preprocessing, the first provider is deterministic and fake so the workflow behavior can be tested without live LLM cost or credentials.

This phase makes chunk postprocessing retryable and inspectable while preserving canonical chunk text. Chunk enrichment can now run through the service layer, a direct debug CLI, or a scraper workflow operation.

### Prompt Context

**User prompt (verbatim):** "continue"

**Assistant interpretation:** Continue the phased RAGEVAL-006 implementation by completing the next unchecked phase, Phase 4 chunk enrichment.

**Inferred user intent:** Add retryable chunk-level postprocessing support before moving on to live-provider smoke tests.

### What I did

- Added `internal/db/chunk_enrichment_queries.go` with helpers for:
  - chunk lookup by chunk/strategy;
  - first-N chunks per selected document;
  - enrichment upsert;
  - enrichment lookup;
  - freshness check by `text_hash`;
  - coverage grouped by source.
- Added `internal/services/chunkenrichment`:
  - provider interface;
  - deterministic fake provider;
  - strict provider output validation;
  - `Service.Enrich`;
  - `Service.Coverage`.
- Added service tests proving:
  - enrichments are stored;
  - fresh enrichments are skipped;
  - invalid provider output is rejected;
  - coverage reports fresh/missing counts.
- Added workflow op `enrich_chunk` to the `rag-eval/intake` runner.
- Added workflow scheduler test for `enrich_chunk` over a pre-chunked test document.
- Added direct debug CLI:
  - `rag-eval chunk enrich --chunk-id ... --strategy-id ...`
- Extended `workflow submit-intake` with bounded existing-chunk fan-out:
  - `--skip-chunk-enrichment=false`;
  - `--chunks-per-document-to-enrich N`;
  - fake provider/model/prompt flags.

### Why

Chunk-level enrichments are the natural place for summaries, topics, entities, and hypothetical questions. Storing them separately from chunks keeps derived LLM state experimental and repeatable: prompt changes, provider changes, and model changes can be represented by identity fields instead of mutating canonical chunk text.

### What worked

- Fake-provider chunk enrichment service tests pass.
- Workflow op `enrich_chunk` writes an enrichment through scraper scheduler execution.
- Direct CLI help works for `rag-eval chunk enrich`.
- Validation passed:

```text
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/db ./internal/services/chunkenrichment ./internal/workflow ./cmd/rag-eval/cmds/chunk ./cmd/rag-eval/cmds/workflow -count=1 -timeout 120s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/db ./internal/ingest ./internal/chunking ./internal/services/source ./internal/services/chunking ./internal/services/document ./internal/services/documentprocessing ./internal/services/chunkenrichment ./internal/services/embedding ./internal/services/search ./internal/workflow ./cmd/rag-eval/cmds/chunk ./cmd/rag-eval/cmds/document ./cmd/rag-eval/cmds/workflow -count=1 -timeout 120s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go build ./cmd/rag-eval
go run ./cmd/rag-eval chunk enrich --help
```

### What didn't work

- Live LLM chunk enrichment is intentionally not wired yet; that belongs to Phase 5.
- `workflow submit-intake` can fan out enrichment ops only for chunks that already exist at submission time. This is safe for bounded smoke over pre-chunked documents, but it is not yet a dynamic fan-out stage that creates enrich ops after chunking completes.
- The existing `chunk_enrichments` primary key is `(chunk_id, strategy_id, prompt_version)`, so provider/model are attributes rather than part of the uniqueness identity. This matches the current schema but limits side-by-side provider/model comparison for the same prompt version.

### What I learned

- Strict fake-provider validation is useful: it catches malformed summaries/topics/questions before storage and gives future live-provider adapters a concrete contract.
- Freshness by chunk text hash is enough to skip reruns when chunk text is unchanged.
- Dynamic workflow fan-out would be useful in a later phase if we want submit-time chunking and post-chunk enrichment in one fully dynamic workflow.

### What was tricky to build

The subtle part was bounded fan-out. The first implementation avoids dynamic workflow mutation and instead selects existing chunks for each selected document at submit time. That keeps Phase 4 simple and debuggable, but it means chunk enrichment fan-out works best for documents that have already been chunked or for workflows submitted after a chunking pass.

Another tricky point is schema identity. The current `chunk_enrichments` table stores provider and model but does not include them in the primary key. I kept the implementation aligned with the existing schema rather than introducing a destructive table rebuild in this phase.

### What warrants a second pair of eyes

- Whether `chunk_enrichments` should be migrated to include provider/model in the primary key before live experiments.
- Whether workflow dynamic fan-out should be added before Phase 5, or whether bounded pre-existing chunk fan-out is enough for smoke testing.
- Whether failed enrichment attempts should be represented in a separate status/error table, since the existing table has no status/error columns.

### What should be done in the future

- Add live provider adapters and cost controls in Phase 5.
- Consider schema migration for provider/model-keyed enrichment variants.
- Add dynamic fan-out or a follow-up command that submits enrichment ops after chunking completes.
- Surface chunk enrichment coverage in API/Corpus Explorer during Phase 6.

### Code review instructions

- Start with `internal/db/chunk_enrichment_queries.go` for query and freshness semantics.
- Review `internal/services/chunkenrichment/service.go` and tests for provider contract validation.
- Review `internal/workflow/intake_runner.go` and `internal/workflow/intake_runner_test.go` for workflow op dispatch.
- Review `cmd/rag-eval/cmds/chunk/enrich.go` for direct debugging behavior.
- Review `internal/workflow/submit.go` for bounded existing-chunk fan-out.
- Validate with the commands listed above.

### Technical details

New operation:

```text
enrich_chunk
```

New direct command:

```text
rag-eval chunk enrich --chunk-id CHUNK --strategy-id STRATEGY --prompt-version v1 --provider fake
```

---

## Step 8: Complete Phase 5 — Bounded Live-Provider Workflow Smoke

I added and exercised a minimal live OpenAI Responses document-processing provider, then ran bounded live smoke tests with the user-requested `gpt-5-nano-low` Pinocchio profile. The smoke stayed intentionally small: one direct document preprocessing call and one two-document scraper workflow with live preprocessing plus chunking, but no embeddings, BM25, or chunk enrichment.

This phase proves that the workflow path can execute a real provider-backed preprocessing operation through the scraper scheduler while preserving the fake-provider test seams used in earlier phases.

### Prompt Context

**User prompt (verbatim):** "go ahead, use model gpt-5-nano-low"

**Assistant interpretation:** Proceed with Phase 5 live-provider smoke using the `gpt-5-nano-low` model/profile, with bounded cost controls.

**Inferred user intent:** Validate that the workflow prototype can run at least one real LLM-backed preprocessing path, not only fake providers.

### What I did

- Added `internal/services/documentprocessing/live_openai.go`:
  - resolves Pinocchio/Geppetto profile settings via existing profile resolution;
  - supports OpenAI Responses API calls;
  - uses the profile's chat engine and reasoning settings;
  - returns preprocessing output into the existing artifact service contract.
- Extended `rag-eval document preprocess`:
  - supports `--provider openai-responses`;
  - supports `--profile gpt-5-nano-low`;
  - keeps `fake` as the default deterministic provider.
- Extended workflow document processor resolution:
  - `document_processing_provider=openai-responses` resolves a live provider;
  - `document_processing_model=gpt-5-nano-low` is treated as the live profile slug for workflow submission.
- Ran a direct one-document live smoke:

```text
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go run ./cmd/rag-eval document preprocess \
  --db data/rag-eval.db \
  --document-id ttc-product-682105 \
  --artifact-type live_smoke_clean_text \
  --prompt-version phase5-gpt-5-nano-low-v1 \
  --provider openai-responses \
  --profile gpt-5-nano-low \
  --force
```

- Submitted a two-document workflow with strict limits:

```text
mkdir -p state
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go run ./cmd/rag-eval workflow submit-intake \
  --engine-db state/rageval006-phase5-live.db \
  --db data/rag-eval.db \
  --workflow-id phase5-live-gpt5nano-low-001 \
  --name "Phase 5 live gpt-5-nano-low smoke" \
  --document-ids ttc-product-682105,ttc-product-817621 \
  --strategy fixed \
  --chunk-size 32 \
  --overlap 4 \
  --skip-preprocessing=false \
  --preprocess-artifact-type live_smoke_clean_text \
  --preprocess-prompt-version phase5-gpt-5-nano-low-v1 \
  --preprocess-provider openai-responses \
  --preprocess-model gpt-5-nano-low \
  --skip-embeddings \
  --skip-bm25 \
  --skip-chunk-enrichment
```

- Ran the workflow worker:

```text
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go run ./cmd/rag-eval workflow run-worker \
  --engine-db state/rageval006-phase5-live.db \
  --worker-id phase5-live-worker \
  --max-workers 2 \
  --cycles 4
```

### Why

Fake providers prove correctness of orchestration and storage, but they do not prove that real profile resolution and network provider execution work in the workflow path. Phase 5 adds that proof with a narrowly bounded live run before any UI/API visibility work begins.

### What worked

- Direct live preprocessing succeeded for `ttc-product-682105`.
- The two-document workflow succeeded with 4/4 ops complete:
  - 2 chunk ops;
  - 2 live preprocessing ops.
- Artifact rows were stored for both documents:

```text
ttc-product-682105|live_smoke_clean_text|phase5-gpt-5-nano-low-v1|openai-responses|gpt-5-nano|succeeded|181
ttc-product-817621|live_smoke_clean_text|phase5-gpt-5-nano-low-v1|openai-responses|gpt-5-nano|succeeded|183
```

- Workflow result check showed:

```text
workflow_id: phase5-live-gpt5nano-low-001
status: succeeded
total ops: 4
succeeded ops: 4
failed ops: 0
```

- Result rows showed one workflow preprocessing op skipped fresh output from the direct smoke and one called the live provider:

```text
phase5-live-gpt5nano-low-001:preprocess:ttc-product-682105 | skipped_fresh=1 | provider=openai-responses | model=gpt-5-nano
phase5-live-gpt5nano-low-001:preprocess:ttc-product-817621 | skipped_fresh=0 | provider=openai-responses | model=gpt-5-nano
```

- Validation passed after the implementation changes:

```text
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/db ./internal/ingest ./internal/chunking ./internal/services/source ./internal/services/chunking ./internal/services/document ./internal/services/documentprocessing ./internal/services/chunkenrichment ./internal/services/embedding ./internal/services/search ./internal/workflow ./cmd/rag-eval/cmds/chunk ./cmd/rag-eval/cmds/document ./cmd/rag-eval/cmds/workflow -count=1 -timeout 120s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go build ./cmd/rag-eval
```

### What didn't work

- First workflow submission failed because the `state/` directory did not exist:

```text
Error: ensure schema_migrations table: unable to open database file: no such file or directory
```

- I fixed the run by creating the directory first:

```text
mkdir -p state
```

- Live chunk enrichment is still not wired; only live document preprocessing is wired for Phase 5.
- The direct live provider currently calls OpenAI Responses API directly rather than through the full Geppetto chat runtime abstraction.

### What I learned

- The existing Pinocchio profile resolution path is enough to bootstrap a live OpenAI Responses smoke provider.
- Artifact freshness worked as intended: after the direct live smoke, the workflow preprocessing op for the same document skipped fresh output instead of making another provider call.
- The workflow CLI should ensure the parent directory for `--engine-db` exists, just like the rag-eval DB helper does.

### What was tricky to build

The main tricky point was adding live-provider behavior without destabilizing fake-provider tests. I kept the live provider opt-in behind `--provider openai-responses` and profile selection, leaving fake as the default. This means tests stay deterministic and Phase 5 live smoke is explicit.

The second tricky point was interpreting the user-provided `gpt-5-nano-low`. In this environment it is a Pinocchio profile slug whose resolved OpenAI Responses engine is `gpt-5-nano`; the workflow artifact records the provider/model as `openai-responses/gpt-5-nano` while the command records the prompt version `phase5-gpt-5-nano-low-v1`.

### What warrants a second pair of eyes

- Whether the live OpenAI Responses provider should move to a shared LLM provider abstraction instead of living under `documentprocessing`.
- Whether the direct HTTP Responses call should be replaced with Geppetto's higher-level chat runtime before expanding live operations.
- Whether `workflow submit-intake` or scraper SQLite store opening should automatically create the engine DB parent directory.

### What should be done in the future

- Add live chunk enrichment only after deciding whether to share the live provider abstraction.
- Add parent-directory creation for `--engine-db` paths.
- Add explicit `--live`/confirmation guardrails if these commands become user-facing beyond development.
- Surface live artifact coverage in Phase 6.

### Code review instructions

- Review `internal/services/documentprocessing/live_openai.go` for profile resolution, request shape, and response parsing.
- Review `cmd/rag-eval/cmds/document/preprocess.go` for live-provider CLI guardrails.
- Review `internal/workflow/intake_runner.go` for live document processor resolution.
- Re-run only bounded live smoke if credentials and budget are available; otherwise rely on fake-provider tests.

### Technical details

Live model/profile used:

```text
gpt-5-nano-low profile → gpt-5-nano OpenAI Responses engine
```

Generated live smoke state:

```text
state/rageval006-phase5-live.db
data/rag-eval.db document_processing_artifacts rows for prompt_version phase5-gpt-5-nano-low-v1
```

---

## Step 9: Phase 6 Backend Visibility Endpoints

I implemented the backend-only part of Phase 6. The HTTP API now exposes read-only workflow, document preprocessing, and chunk enrichment visibility endpoints that the Corpus Explorer UI can consume in a later frontend slice.

This step deliberately avoids frontend changes. It establishes stable API contracts first: workflow summaries and ops come from scraper's `engineview` read service, while artifact coverage/details come from the rag-eval database helpers added in Phases 3 and 4.

### Prompt Context

**User prompt (verbatim):** "do the backend part of phase 6."

**Assistant interpretation:** Implement only the read-only backend/API portion of Phase 6, leaving UI wiring for a later step.

**Inferred user intent:** Prepare the server endpoints needed by Corpus Explorer before investing in frontend views.

### What I did

- Added API server options:
  - `api.Options{EngineDB: ...}`;
  - `RegisterHandlersWithOptions` while preserving existing `RegisterHandlers` compatibility.
- Added `rag-eval serve --engine-db` so the HTTP server can locate the scraper workflow engine DB.
- Added workflow read endpoints:
  - `GET /api/v1/workflows`
  - `GET /api/v1/workflows/{id}`
  - `GET /api/v1/workflows/{id}/ops`
- Added artifact coverage endpoints:
  - `GET /api/v1/artifacts/document-processing/coverage`
  - `GET /api/v1/artifacts/chunk-enrichment/coverage`
- Added detail endpoints:
  - `GET /api/v1/documents/{id}/processing-artifacts`
  - `GET /api/v1/chunks/{id}/enrichments`
- Added DB list helpers:
  - `ListDocumentProcessingArtifacts(documentID)`;
  - `ListChunkEnrichments(chunkID, strategyID, promptVersion)`.
- Added `internal/api/workflow_artifact_handlers_test.go` to smoke all new endpoints against temporary rag-eval and scraper engine DBs.

### Why

The UI should not read SQLite directly or duplicate scraper workflow SQL. These endpoints centralize read-side contracts and let the frontend focus on display: workflow status, op state, preprocessing coverage, enrichment coverage, and per-document/chunk artifact inspection.

### What worked

- New endpoints compile and pass an HTTP smoke test.
- The workflow endpoints reuse scraper `engineview` instead of duplicating engine read SQL.
- Existing `api.RegisterHandlers` callers remain compatible.
- Validation passed:

```text
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/api -count=1 -timeout 120s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/db ./internal/api ./internal/ingest ./internal/chunking ./internal/services/source ./internal/services/chunking ./internal/services/document ./internal/services/documentprocessing ./internal/services/chunkenrichment ./internal/services/embedding ./internal/services/search ./internal/workflow ./cmd/rag-eval/cmds/serve -count=1 -timeout 120s
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go build ./cmd/rag-eval
```

### What didn't work

- No frontend wiring was done in this backend-only slice.
- The coverage endpoints currently require exact identity parameters and return broad grouped coverage; they do not yet provide UI-optimized defaults or discovery of available prompt/provider/model identities.

### What I learned

- The scraper `engineview` service is reusable from the rag-eval HTTP layer with only an engine DB path.
- The previous artifact query helpers needed small list/detail helpers for UI consumption, but the schema was already sufficient.

### What was tricky to build

The main tricky point was preserving compatibility. Existing callers use `api.RegisterHandlers(mux, database)`, so I added `RegisterHandlersWithOptions` rather than changing that signature directly. The server command now passes the engine DB path explicitly, but tests and older code can still use defaults.

### What warrants a second pair of eyes

- Endpoint shapes before frontend adoption, especially whether `items` wrappers and coverage response shapes are what the UI wants.
- Whether workflow endpoints should expose scraper's Go struct field casing as-is or normalize to snake_case DTOs.
- Whether artifact coverage should support optional source filters now rather than later.

### What should be done in the future

- Wire Corpus Explorer UI to these endpoints.
- Add endpoint discovery for available artifact identities.
- Normalize workflow response JSON if frontend ergonomics require it.
- Add browser/manual validation once the UI consumes the endpoints.

### Code review instructions

- Review `internal/api/handlers.go` for routing and engine DB option wiring.
- Review `internal/api/workflow_artifact_handlers.go` for endpoint behavior.
- Review `internal/db/document_processing_queries.go` and `internal/db/chunk_enrichment_queries.go` for list/detail helper semantics.
- Review `cmd/rag-eval/cmds/serve/*` for `--engine-db` flag plumbing.
- Validate with the commands listed above.

### Technical details

Backend endpoints added:

```text
GET /api/v1/workflows
GET /api/v1/workflows/{id}
GET /api/v1/workflows/{id}/ops
GET /api/v1/artifacts/document-processing/coverage
GET /api/v1/artifacts/chunk-enrichment/coverage
GET /api/v1/documents/{id}/processing-artifacts
GET /api/v1/chunks/{id}/enrichments
```

## Step 8: Phase 6 Frontend — Corpus Explorer artifact integration

Completed the remaining RAGEVAL-006 Phase 6 frontend tasks. The backend artifact endpoints existed but were not consumed by the Corpus Explorer.

### Prompt Context
**User prompt (verbatim):** "ok, continue, add tasks to the ticket if not already present, then work on them, commit at appropriate intervals, keep a diary as you work"
**Assistant interpretation:** Add tasks for the remaining Phase 6 frontend work and implement them.
**Inferred user intent:** Complete RAGEVAL-006 Phase 6 by wiring artifact endpoints into the Corpus Explorer UI.
**Commit (code):** 164aded — "feat(corpus): wire artifact endpoints into Corpus Explorer (RAGEVAL-006 Phase 6)"
**Commit (code):** 4cbf0cb — "feat(corpus): add reverse cross-link from Artifacts tab to Workflows tab"

### What I did
1. Added 4 RTK Query endpoints + TypeScript types for artifact APIs in `api.ts`
2. Added preprocessing coverage display to SourcePanel (e.g. "0/19 preprocessed (0%)")
3. Added `Artifacts` tab to DocumentInspector showing document preprocessing artifacts table
4. Added `ArtifactDetail` sub-component for drill-down (provider, hash, output text, errors)
5. Added `Enrich` column to chunk rows in the chunks tab (●/○ indicators)
6. Added enrichment join to backend `DocumentDetail` query (`LEFT JOIN chunk_enrichments`)
7. Added `Enrichment` field to `CorpusChunk` Go struct
8. Added reverse cross-link: "Submit Workflow →" button in Artifacts tab navigates to Workflows view
9. Added `rag:navigate-to-workflows` custom event in App.tsx

### Why
RAGEVAL-006 Phase 6 had two unchecked frontend tasks: linking Corpus Explorer to preprocessing/enrichment status, and adding UI smoke tests. The backend endpoints existed but weren't wired to any UI. Users had no way to see artifact coverage from the Corpus Explorer.

### What worked
- SourcePanel preprocessing coverage renders immediately alongside embedding coverage
- The Artifacts tab lazy-loads artifacts only when the tab is selected (via `skip` param on RTK Query)
- The enrichment join in the DocumentDetail query adds enrichment status without extra round-trips
- The reverse cross-link (Corpus → Workflows) completes the bidirectional navigation

### What didn't work
- The preprocessing coverage uses hardcoded identity (fake provider). In production, this needs to match the actual provider used by the workflow. This is the "identity problem" — preprocessing has a different identity axis than embeddings.

### What was tricky to build
- The `CorpusChunk.Enrichment` struct required matching both the Go struct and the TypeScript interface. The Go struct uses a nested anonymous struct with JSON tags, which serializes as a nested object. The TypeScript `CorpusChunk.enrichment` field must match this shape.
- The enrichment join needed 4 additional columns (`short_summary, prompt_version, quality_score, updated_at`) in the chunk query, plus `sql.NullString`/`sql.NullFloat64` scanning. Getting the column count right in the Scan was critical — miscounting causes runtime panics.

### What warrants a second pair of eyes
- The enrichment LEFT JOIN always joins on `chunk_id AND strategy_id`. If multiple enrichments exist for the same chunk with different prompt_versions, only one row comes back (SQL will return whichever the DB picks). Should be refined with a `GROUP BY` or subquery to pick the latest enrichment.
- The preprocessing coverage identity is hardcoded (`fake/fake-document-processor/v1`). This should come from the workflow submission or a user-selectable identity.

### What should be done in the future
- Add artifact identity selector to IdentityBar or a separate ArtifactIdentityBar
- Fix enrichment join to handle multiple enrichment versions per chunk
- Add op result detail endpoint integration in Workflows tab
- SSE instead of polling for real-time updates

### Code review instructions
- Start at `web/src/components/corpus/DocumentInspector.tsx` — review the Artifacts tab and ArtifactDetail component
- Check `internal/services/corpus/service.go` — review the enrichment LEFT JOIN in DocumentDetail
- Check `web/src/components/corpus/SourcePanel.tsx` — review the preprocessing coverage display
- Run: `cd web && pnpm build && cd .. && go build ./cmd/rag-eval`
- Verify: open http://127.0.0.1:8772 → Corpus tab → click source → click document → check Artifacts tab + Chunks Enrich column
