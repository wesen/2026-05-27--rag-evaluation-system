---
title: "Implementation diary"
doc-type: reference
ticket: RAGEVAL-007
status: active
intent: long-term
topics: [rag, ui, workflow, scraper, intake, design]
created: 2026-05-29
---

# Diary

## Goal

Capture the investigation and design work for RAGEVAL-007: creating a workflow intake UI for the scraper-driven RAG pipeline.

## Step 1: Codebase investigation and ticket creation

Explored the full rag-evaluation-system codebase to understand the architecture: the two-database model (corpus DB for domain data, engine DB for workflow orchestration), the scraper engine library, the IntakeRunner, the submit/DAG logic, and the existing React SPA. Then created the RAGEVAL-007 ticket with a design doc and diary.

### Prompt Context

**User prompt (verbatim):** "Create a new docmgr ticket to create a great UI for the workflow scraper approach to rag embedding in 2026-05-27--rag-evaluation-system/ using the scraper/ framework. We already have a great UI, but now we want to start with a proper design workflow. Let's analyze the needs of a developer working on the intake workflows and parts of it, and what affordances they need. Then derive views and screens to enable them to do this work and to access this data to help them iterate. Use ascii screenshots and sketch out input props needed and which / where the data comes from. Create a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and the nupload to remarkable. Kepe a diary as you work."

**Assistant interpretation:** Create a docmgr ticket for designing a workflow intake UI. Analyze developer needs, derive screens with ASCII wireframes and input props, write a comprehensive intern-ready design/implementation guide, store in ticket, upload to reMarkable, and keep a diary.

**Inferred user intent:** Produce a complete design specification that a new intern can pick up and implement the workflow UI end-to-end, including backend API, frontend components, and data flow diagrams.

### What I did

- Explored the full directory structure of the rag-evaluation-system workspace
- Read key Go source files: workflow engine.go, intake_runner.go, ops.go, submit.go, constants.go, api/handlers.go
- Read scraper engine model types, store interface, scheduler, engineview services
- Read React SPA: App.tsx, api.ts, store/index.ts, CorpusExplorerView.tsx, PipelineView.tsx
- Read corpus DB queries and database schema
- Examined existing ttmp tickets (RAGEVAL-001 through RAGEVAL-006) for context
- Created RAGEVAL-007 ticket via docmgr
- Created design doc: `01-intake-workflow-ui-design-screens-affordances-and-data-flow.md`
- Created this diary document

### Why

The existing UI covers corpus exploration and search but has zero visibility into the workflow engine. A developer iterating on intake pipelines needs to see workflow progress, diagnose failures, and submit new runs—all from the browser.

### What worked

- The `engineview` service package already provides all the read/mutation operations needed (ListWorkflows, WorkflowOps, RetryOp, CancelWorkflow, ListQueues). No new backend logic needed—just HTTP handlers that call existing service methods.
- The existing React SPA has a clear pattern (RTK Query + Bootstrap-styled panels) that the new Workflows view can follow directly.
- The intake DAG structure is predictable (fan-out chunk → fan-in embed/bm25), so the DAG visualization can use a simple hierarchical layout without needing a graph library.

### What didn't work

- Nothing failed during investigation. The codebase is well-structured and the gap is clear.

### What I learned

- The two-database architecture is the key insight: the engine DB is invisible in the current UI, which is why developers must use CLI commands to monitor workflows.
- The `IntakeOpInput` struct has many optional fields that vary by operation type—the UI needs to display different result schemas for chunk vs embed vs bm25 ops.
- The scheduler's `Observer` interface could power real-time updates in the future, but polling is sufficient for phase 1.

### What was tricky to build

- The design doc needed to be comprehensive enough for an intern while staying grounded in actual code. I anchored every screen and API endpoint to specific Go functions and SQL tables, with line references to the source files.

### What warrants a second pair of eyes

- The DAG visualization approach: I chose CSS-based absolute positioning with SVG edges. For 500+ ops this might need virtualization or a different approach. The collapsed view design needs iteration.
- The Submit Intake modal: the form has many fields. The grouping and progressive disclosure need UX review.
- Engine DB concurrency: SQLite WAL mode should handle concurrent reads + writes, but this needs verification.

### What should be done in the future

- SSE/WebSocket for real-time op status updates (instead of polling)
- Workflow templates (save common intake configurations)
- Workflow comparison (side-by-side run diffs)
- Bulk retry for all failed ops in a workflow
- Op artifact viewer (for preprocess_document artifacts)

### Code review instructions

- Start with `ttmp/2026/05/29/RAGEVAL-007--.../design/01-intake-workflow-ui-design-screens-affordances-and-data-flow.md`
- Cross-reference the scraper engineview services against the proposed API endpoints
- Verify the RTK Query type definitions match the Go struct field names and JSON tags

### Technical details

- Engine DB path: `state/rag-eval-workflows.db` (configurable via `--engine-db`)
- Corpus DB path: `data/rag-eval.db` (configurable via `--db-path`)
- Workflow ID format: `intake-YYYYMMDDTHHMMSS`
- Strategy ID format: `{strategy}-{chunkSize}-{overlap}` (e.g. `fixed-1200-150`)
- Op ID format: `{workflowId}:{operation}:{documentId}` or `{workflowId}:{operation}`

## Step 3: Backend API implementation (Phase 1)

Added 5 new endpoints to `workflow_artifact_handlers.go` (extending the 3 existing ones):
- `GET /api/v1/workflows/{id}/results/{opId}` — inspect op result data
- `POST /api/v1/workflows/{id}/retry/{opId}` — retry a failed op
- `POST /api/v1/workflows/{id}/cancel` — cancel a running workflow
- `POST /api/v1/workflows/intake` — submit new intake workflow from browser
- `GET /api/v1/queues` — queue health status

All wired through the existing `handler.engineDB` field. No new handler struct needed — just added methods to the existing `handler` type.

Committed as `faf6ab`.

## Step 4: Frontend implementation (Phases 2-6)

Created `WorkflowsView.tsx` with 5 sub-components:
1. **WorkflowsList** — table with status filter, polling every 2s
2. **QueueHealthWidget** — queue status table, polling every 5s
3. **SubmitIntakeModal** — form with source IDs, chunking params, embedding config, BM25 toggle
4. **WorkflowDetail** — header with stats, compact op graph, ops-by-group table, op inspector
5. **OpGroupRow** — clickable row per (operation, status) group

Added RTK Query endpoints and TypeScript types to `api.ts`.
Added "Workflows" tab to `App.tsx` nav.

**Critical fix:** Changed ops endpoint to return grouped summary (by operation+status) instead of full op list. A workflow with 3117 docs creates 6236+ ops — returning all would explode context. The grouped response returns ~4 rows instead of 6236, with a `sample` op per group for drill-down.

Committed as `387713d`.

### What worked
- The grouped ops approach keeps the response tiny even for huge workflows
- The op graph shows chunk fan-out + embed/bm25 fan-in clearly
- The inspector shows sample op input fields for drill-down
- Submit intake modal works end-to-end (POST → workflow created → navigate to detail)

### What didn't work
- First attempt used raw op list — 6236 ops in one response crashed the browser context
- TypeScript field names had to match actual Go JSON tags (PascalCase for nested op fields, camelCase for wrapper fields)

### What was tricky to build
- The Go JSON serialization uses different casing conventions for nested structs vs top-level: `WorkflowRun` fields serialize as PascalCase (because Go's `encoding/json` uses exported field names by default), while `engineview.WorkflowOp` wrapper fields use `json:"status"` tags with camelCase. Had to inspect actual API responses to align TypeScript types.
- The `QueueStatus` struct in the scraper uses `json:"inFlight"` etc (camelCase), not PascalCase.

### What warrants a second pair of eyes
- The `handleWorkflowOps` grouping logic — it creates `opGroup` structs inline and does a map+order pattern. Should be tested with edge cases (empty ops, single op, mixed statuses).
- The `handleSubmitIntake` handler applies defaults that overlap with `SubmitIntakeWorkflow()`'s own defaults. Double-defaulting could cause issues if they diverge.

### What should be done in the future
- Add a dedicated endpoint to fetch ops for a specific group (e.g., all failed chunk ops) with pagination
- Add op result detail view (GET /api/v1/workflows/{id}/results/{opId})
- Real-time updates via SSE instead of polling
- Workflow templates for common configurations

## Step 2: Doc validation and reMarkable upload

Ran `docmgr doctor`, fixed vocabulary warnings by adding `design`, `intake`, `scraper`, `ui` topics. Removed 3 broken related file entries for scraper engineview files (paths outside project root don't resolve correctly in docmgr). Doctor passes cleanly after fixes.

Uploaded bundle to reMarkable at `/ai/2026/05/29/RAGEVAL-007` — confirmed with `remarquee cloud ls`.

No code was implemented. The deliverable is the design document only.
