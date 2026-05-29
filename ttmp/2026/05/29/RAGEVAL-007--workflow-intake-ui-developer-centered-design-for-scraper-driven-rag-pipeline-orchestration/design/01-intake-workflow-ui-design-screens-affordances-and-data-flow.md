---
title: "Intake workflow UI design: screens, affordances, and data flow"
doc-type: design
ticket: RAGEVAL-007
status: active
intent: long-term
topics: [rag, ui, workflow, scraper, intake, design]
created: 2026-05-29
---

# Intake Workflow UI Design: Screens, Affordances, and Data Flow

## Executive Summary

The RAG evaluation system has a functional Corpus Explorer, Search Workbench, and Pipeline view—but the **intake workflow orchestration layer** has no UI at all. Today, a developer kicks off an intake pipeline (chunk → embed → index) by running a CLI command like `rag-eval workflow submit-intake`, then monitors progress with `rag-eval workflow status`. There is no way to see workflow graphs, retry failed ops, inspect op results, or understand queue health from the browser.

This design document specifies a new **Workflows** view in the existing React SPA that gives a developer working on intake pipelines the affordances they need: submit workflows with parameterized forms, watch a live DAG of ops progress, drill into individual op results and errors, retry or cancel failed ops, and understand queue throughput. Every screen is specified with ASCII wireframes, input props, data sources, and the backend API endpoints needed to power them.

The document is written for an intern joining the project—someone who needs to understand *what the system is*, *how data flows through it*, and *what to build* to make the workflow layer visible and controllable from the browser.

---

## 1. What Is This System?

### 1.1 The Big Picture

The RAG evaluation system ("rag-eval") is a pipeline for turning **raw documents** into **searchable vector embeddings** and **BM25 text indexes**, so that retrieval quality can be measured and improved. Think of it as a factory:

```
  Raw files          Chunking           Embedding          Indexing          Search
 (markdown,    →   (split into     →   (vectorize      →   (BM25 +       →   (query
  HTML, PDF)        fixed-size          chunks with         vector          and
                    windows)            OpenAI/Ollama)      stores)         retrieve)
```

Each step is **durable** and **retryable** because it runs through the **scraper workflow engine**—a SQLite-backed job queue with dependencies, leases, retries, and queue-level rate limiting.

### 1.2 The Two Databases

The system has **two separate SQLite databases** that matter to the UI:

| Database | Default path | What it stores | UI today |
|----------|-------------|----------------|----------|
| **Corpus DB** | `data/rag-eval.db` | Sources, documents, chunks, chunking strategies, embedding vectors, document processing artifacts | Fully visible in Corpus Explorer |
| **Engine DB** | `state/rag-eval-workflows.db` | Workflow runs, ops, op results, leases, queue state, artifacts | **No UI at all** |

The corpus DB is the *domain data*. The engine DB is the *workflow orchestration data*. The UI gap is that you can see *what* data exists (Corpus Explorer) but not *how it got there* or *what is currently being computed*.

### 1.3 The Workflow Engine (from `scraper/`)

The scraper workflow engine is a Go library that provides:

- **WorkflowRun**: A named, metadata-tagged collection of ops with a status (`pending` → `running` → `succeeded`/`failed`/`canceled`).
- **OpSpec**: An atomic unit of work with a `Kind`, a `Queue`, a `DedupKey`, `DependsOn` (dependency graph), and a `Retry` policy.
- **Scheduler**: A poll-based loop that leases ready ops, runs them via registered `Runner` implementations, and records results.
- **Store**: A SQLite-backed implementation of `WorkflowStore`, `OpStore`, and `ResultStore` interfaces.

The scraper engine is **generic**—it was built for web scraping (hence the name), but the rag-eval project uses it as a **durable task queue** for the intake pipeline.

### 1.4 The Intake Runner

The rag-eval project registers a single runner kind: `rag-eval/intake` (`IntakeRunnerKind`). This runner dispatches ops by their `Operation` field:

| Operation constant | What it does | Queue |
|---------------------|-------------|-------|
| `chunk_document` | Splits a document into chunks using a strategy (fixed, recursive, etc.) | `rag-eval:cpu` |
| `compute_embeddings` | Calls OpenAI/Ollama to vectorize chunks, stores in `chunk_embeddings` table | `rag-eval:embedding` |
| `build_bm25` | Builds a Bleve-based BM25 full-text index from chunks | `rag-eval:index` |
| `preprocess_document` | LLM-based document preprocessing (currently fake provider) | `rag-eval:llm` |
| `echo` | Debug/test operation that returns its input | `rag-eval:cpu` |

### 1.5 The Intake Workflow DAG

When you call `SubmitIntakeWorkflow()`, it creates a **DAG** (directed acyclic graph) of ops:

```
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │ chunk:doc-1 │   │ chunk:doc-2 │   │ chunk:doc-3 │   ... (one per document)
  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
         │                 │                 │
         └─────────┬───────┴─────────┬──────┘
                   │                 │
          ┌────────▼──────┐  ┌──────▼────────┐
          │   :embed      │  │    :bm25      │
          └───────────────┘  └───────────────┘
```

- Each document gets its own `chunk_document` op.
- `compute_embeddings` depends on ALL chunk ops succeeding.
- `build_bm25` depends on ALL chunk ops succeeding.
- Embedding and BM25 ops run in parallel after all chunks are done.

This means:
- You can see progress per-document (which docs are chunked).
- You can see the fan-out/fan-in pattern (many chunk ops → one embed op + one bm25 op).
- Failed chunk ops block downstream embedding and indexing.

---

## 2. Developer Personas and Needs

### 2.1 Primary Persona: The Pipeline Developer

**Who:** A developer working on the rag-eval intake pipeline who needs to iterate on chunking strategies, embedding providers, and search quality.

**What they do day-to-day:**
1. **Ingest new content** — scan a directory of markdown files into the corpus DB.
2. **Try a chunking strategy** — experiment with `fixed-800-100` vs `fixed-1200-150` vs `recursive-500-50`.
3. **Compute embeddings** — try different providers (OpenAI `text-embedding-3-small` vs Ollama `nomic-embed-text`) and compare.
4. **Build search indexes** — BM25 + vector + hybrid, tune RRF weights.
5. **Evaluate retrieval quality** — run test queries, inspect results.
6. **Diagnose failures** — an op failed, why? Is the provider down? Is the document malformed?

### 2.2 Affordance Analysis

What affordances does this developer need from a workflow UI?

| Affordance | Why | Current gap |
|------------|-----|-------------|
| **See all workflows** | Know what intake runs have been submitted, when, and their status | CLI only: `rag-eval workflow status` |
| **Submit a new intake workflow** | Kick off chunk→embed→index with parameters, without remembering CLI flags | CLI only: `rag-eval workflow submit-intake` |
| **See the op DAG for a workflow** | Understand fan-out/fan-in, which ops block which, spot stuck deps | No representation at all |
| **Track per-op progress in real time** | Watch chunk ops complete one by one, see embed/bm25 start | CLI polling only |
| **Inspect an op result** | After an op succeeds, see its output (chunk count, embed dimensions, index path) | Must open engine DB manually |
| **Diagnose a failed op** | See the error code, message, retryability, and retry state | Must read scheduler logs |
| **Retry a failed op** | Re-queue a failed op without re-running the whole workflow | CLI only: `rag-eval workflow retry` |
| **Cancel a running workflow** | Stop a workflow that's going wrong | CLI only: `rag-eval workflow cancel` |
| **See queue health** | Know if embedding queue is rate-limited, how many ops are in-flight | No visibility |
| **Navigate from workflow to corpus** | After intake completes, jump to the Corpus Explorer to see the new chunks/embeddings | Must manually switch tabs and look up IDs |

---

## 3. System Architecture (for the Intern)

### 3.1 Repository Layout

```
rag-evaluation-system/
├── scraper/                          # Generic workflow engine (library)
│   └── pkg/
│       ├── engine/
│       │   ├── model/types.go        # WorkflowRun, OpSpec, OpResult, OpError
│       │   ├── runner/               # Runner interface + registry
│       │   ├── scheduler/            # Poll-based scheduler loop
│       │   └── store/
│       │       ├── store.go          # Store interface (WorkflowStore, OpStore, ResultStore)
│       │       └── sqlite/           # SQLite implementation
│       └── services/
│           └── engineview/           # Read + mutation services for engine DB
│               ├── service.go                    # Service struct + EngineStatus()
│               ├── workflow_read_service.go      # ListWorkflows, Workflow, WorkflowOps
│               ├── workflow_mutation_service.go  # RetryOp, CancelWorkflow
│               ├── queue_read_service.go         # ListQueues
│               └── artifact_read_service.go      # ListArtifacts, GetOpResult, ListWorkflowResults
│
├── 2026-05-27--rag-evaluation-system/  # The rag-eval application
│   ├── internal/
│   │   ├── workflow/                 # Intake-specific workflow logic
│   │   │   ├── engine.go             # NewIntakeScheduler() — wires store + registry + scheduler
│   │   │   ├── intake_runner.go      # IntakeRunner — dispatches ops by Operation field
│   │   │   ├── ops.go                # IntakeOpInput, output structs, operation constants
│   │   │   ├── submit.go             # SubmitIntakeWorkflow() — builds the DAG and writes to engine DB
│   │   │   └── constants.go          # Queue names, runner kind
│   │   ├── api/handlers.go           # HTTP handlers (currently no workflow endpoints)
│   │   ├── db/                       # Corpus DB queries and migrations
│   │   ├── services/                 # Domain services: chunking, embedding, search, corpus, source
│   │   └── web/
│   │       └── spa.go                # go:embed of built React SPA
│   ├── web/                          # React SPA (Vite + RTK Query)
│   │   └── src/
│   │       ├── App.tsx               # Top-level nav: Search | Corpus | Pipeline | Embeddings | Evaluation
│   │       ├── services/api.ts       # RTK Query API definition + TypeScript types
│   │       ├── store/index.ts        # Redux store setup
│   │       └── components/
│   │           ├── corpus/           # CorpusExplorerView (sources → documents → inspector)
│   │           ├── search/           # SearchView (BM25/vector/hybrid query workbench)
│   │           ├── pipeline/         # PipelineView (basic sources + documents tables)
│   │           ├── embeddings/       # EmbeddingsView
│   │           └── evaluation/       # EvaluationView
│   └── cmd/rag-eval/                 # CLI commands
│       ├── cmds/workflow/            # workflow submit-intake, status, worker, retry, cancel, ops
│       └── cmds/serve/               # rag-eval serve — starts HTTP server + scheduler
```

### 3.2 Data Flow: Submitting and Running a Workflow

```
  Developer
      │
      │  rag-eval workflow submit-intake --source-ids ttc-guides --strategy fixed --chunk-size 1200
      │
      ▼
  SubmitIntakeWorkflow()
      │
      ├─► Open engine DB (state/rag-eval-workflows.db)
      │
      ├─► Resolve document IDs from corpus DB (data/rag-eval.db)
      │   SELECT id FROM documents WHERE source_id IN (...)
      │
      ├─► Build OpSpec DAG:
      │   - N × chunk_document ops (one per doc, queue: rag-eval:cpu)
      │   - 1 × compute_embeddings op (depends on all chunks, queue: rag-eval:embedding)
      │   - 1 × build_bm25 op (depends on all chunks, queue: rag-eval:index)
      │
      └─► Write WorkflowRun + OpSpecs to engine DB via store.CreateWorkflow()
            │
            ▼
      Scheduler.RunOnce() loop (runs in background via `rag-eval serve` or `rag-eval workflow worker`)
            │
            ├─► RefreshRunnableOps() — promote pending ops with met dependencies to "ready"
            │
            ├─► ListQueueCandidates() — which queues have ready work?
            │
            ├─► For each candidate queue:
            │     LeaseReadyOp() — atomically claim an op (creates a Lease row)
            │     │
            │     ▼
            │   IntakeRunner.Run(ctx, runCtx)
            │     │
            │     ├─► Decode IntakeOpInput from op.Input
            │     ├─► Open corpus DB at input.DBPath
            │     ├─► Switch on input.Operation:
            │     │     chunk_document  → chunkservice.Apply()
            │     │     compute_embeddings → embeddingservice.Compute()
            │     │     build_bm25 → searchservice.BuildBM25()
            │     │     preprocess_document → documentprocessing.Process()
            │     │
            │     └─► Return OpResult (success) or OpError (failure)
            │
            ├─► On success: store.CompleteOp() — write result, release lease
            ├─► On failure: store.FailOp() — write error, compute retry state, release lease
            │
            └─► refreshWorkflowStatus() — recompute workflow status from op statuses
```

### 3.3 Key Data Structures

#### WorkflowRun (`scraper/pkg/engine/model/types.go`)

```go
type WorkflowRun struct {
    ID        WorkflowID      // e.g. "intake-20260529T143000"
    Site      SiteName        // always "rag-eval" for intake workflows
    Name      string          // e.g. "rag-eval intake workflow"
    Status    WorkflowStatus  // pending | running | succeeded | failed | canceled
    Input     json.RawMessage // { db_path, document_ids, strategy_id, ... }
    Metadata  map[string]string // { kind: "rag-eval-intake", strategy: "fixed-1200-150", ticket: "RAGEVAL-006" }
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

#### OpSpec (`scraper/pkg/engine/model/types.go`)

```go
type OpSpec struct {
    ID          OpID           // e.g. "intake-20260529T143000:chunk:doc-abc123"
    WorkflowID  WorkflowID
    ParentID    *OpID
    Site        SiteName       // "rag-eval"
    Kind        string         // "rag-eval/intake"
    Queue       QueueKey       // "rag-eval:cpu" | "rag-eval:embedding" | "rag-eval:index" | "rag-eval:llm"
    DedupKey    string         // prevents duplicate ops
    Input       json.RawMessage // IntakeOpInput JSON
    DependsOn   []Dependency   // [{ OpID: "...", Required: true }]
    Retry       RetryPolicy
    RetryState  RetryState
    Metadata    map[string]string
    // ... timestamps
}
```

#### IntakeOpInput (`internal/workflow/ops.go`)

```go
type IntakeOpInput struct {
    Operation   string   `json:"operation"`    // chunk_document | compute_embeddings | build_bm25 | preprocess_document | echo
    DBPath      string   `json:"db_path"`      // path to corpus DB, e.g. "data/rag-eval.db"

    // chunk_document params
    DocumentID  string   `json:"document_id,omitempty"`
    Strategy    string   `json:"strategy,omitempty"`     // "fixed" | "recursive"
    ChunkSize   int      `json:"chunk_size,omitempty"`    // 1200
    Overlap     int      `json:"overlap,omitempty"`       // 150

    // compute_embeddings params
    StrategyID           string   `json:"strategy_id,omitempty"`
    SourceIDs            []string `json:"source_ids,omitempty"`
    ProfileRegistries    []string `json:"profile_registries,omitempty"`
    Profile              string   `json:"profile,omitempty"`
    EmbeddingType        string   `json:"embeddings_type,omitempty"`
    EmbeddingEngine      string   `json:"embeddings_engine,omitempty"`
    Dimensions           int      `json:"embeddings_dimensions,omitempty"`
    // ... more embedding config

    // build_bm25 params
    IndexRoot   string   `json:"index_root,omitempty"`
    IndexID     string   `json:"index_id,omitempty"`
}
```

#### OpResult and OpError

```go
type OpResult struct {
    OpID        OpID
    Data        json.RawMessage  // Operation-specific output JSON
    Records     []RecordWrite
    Artifacts   []ArtifactWrite
    Error       *OpError         // nil on success
}

type OpError struct {
    Code       string           // e.g. "chunk_document_failed", "resolve_embedding_provider_failed"
    Message    string           // Human-readable error
    Retryable  bool             // Whether scheduler should retry
    Details    json.RawMessage  // Structured context (document_id, etc.)
}
```

---

## 4. Backend API Endpoints Needed

The current `api/handlers.go` has zero workflow endpoints. We need a new set that proxies the `engineview.Service` to the browser.

### 4.1 Endpoint Table

| Method | Path | Purpose | Engine service call |
|--------|------|---------|-------------------|
| GET | `/api/v1/workflows` | List workflows with pagination + status filter | `engineview.Service.ListWorkflows()` |
| GET | `/api/v1/workflows/{id}` | Get workflow summary (metadata + op stats) | `engineview.Service.Workflow()` |
| GET | `/api/v1/workflows/{id}/ops` | Get all ops for a workflow with status/deps/retry | `engineview.Service.WorkflowOps()` |
| GET | `/api/v1/workflows/{id}/results` | Get result summaries for completed ops | `engineview.Service.ListWorkflowResults()` |
| GET | `/api/v1/workflows/{id}/results/{opId}` | Get full op result data (JSON payload) | `engineview.Service.GetOpResult()` |
| POST | `/api/v1/workflows/{id}/retry/{opId}` | Retry a failed op | `engineview.Service.RetryOp()` |
| POST | `/api/v1/workflows/{id}/cancel` | Cancel a running workflow | `engineview.Service.CancelWorkflow()` |
| POST | `/api/v1/workflows/intake` | Submit a new intake workflow | `workflow.SubmitIntakeWorkflow()` |
| GET | `/api/v1/queues` | Get queue status (pending/ready/running/failed counts per queue) | `engineview.Service.ListQueues()` |

### 4.2 Request/Response Schemas

#### `GET /api/v1/workflows`

Query params: `?status=running&limit=50&offset=0`

```typescript
interface WorkflowListResponse {
  workflows: WorkflowListItem[];
  total: number;
}

interface WorkflowListItem {
  workflow: {
    id: string;           // "intake-20260529T143000"
    site: string;         // "rag-eval"
    name: string;         // "rag-eval intake workflow"
    status: string;       // pending | running | succeeded | failed | canceled
    input: Record<string, unknown>;  // Parsed JSON
    metadata: Record<string, string>;
    created_at: string;
    updated_at: string;
  };
  op_total: number;       // Total ops in this workflow
  op_done: number;        // Ops in terminal state (succeeded + failed + canceled)
}
```

**Data source:** `engineview.ListWorkflows()` reads from `state/rag-eval-workflows.db`, table `workflows` + subquery on `ops`.

#### `GET /api/v1/workflows/{id}/ops`

```typescript
interface WorkflowOpsResponse {
  ops: WorkflowOp[];
}

interface WorkflowOp {
  op: {
    id: string;           // "intake-...:chunk:doc-abc"
    workflow_id: string;
    kind: string;         // "rag-eval/intake"
    queue: string;        // "rag-eval:cpu" | "rag-eval:embedding" | "rag-eval:index"
    dedup_key: string;
    input: IntakeOpInput; // Parsed from op input JSON
    depends_on: Array<{ op_id: string; required: boolean }>;
    retry: { max_attempts: number; backoff_kind: string; initial_backoff: string };
    retry_state: { attempt: number; next_attempt_at: string | null; last_error: string };
    metadata: Record<string, string>;
  };
  status: string;         // pending | ready | running | succeeded | failed | canceled
  created_at: string;
  updated_at: string;
  lease: { worker_id: string; token: string; acquired_at: string; expires_at: string } | null;
}
```

**Data source:** `engineview.WorkflowOps()` reads from `state/rag-eval-workflows.db`, table `ops` + joins for `depends_on` and `leases`.

#### `POST /api/v1/workflows/intake`

```typescript
interface SubmitIntakeRequest {
  db_path?: string;               // default: "data/rag-eval.db"
  workflow_id?: string;           // auto-generated if empty
  name?: string;                  // default: "rag-eval intake workflow"
  source_ids?: string[];          // Filter documents by source
  document_ids?: string[];        // Explicit document list (overrides source_ids)
  document_limit?: number;        // Cap on documents from source
  strategy?: string;              // "fixed" | "recursive"
  chunk_size?: number;            // default: 1200
  overlap?: number;               // default: 150
  skip_embeddings?: boolean;      // Skip the compute_embeddings op
  skip_bm25?: boolean;            // Skip the build_bm25 op
  // Embedding provider config
  profile?: string;
  base_profile?: string;
  embeddings_type?: string;       // "openai" | "ollama"
  embeddings_engine?: string;     // "text-embedding-3-small" | "nomic-embed-text"
  embeddings_dimensions?: number; // 1536 | 768
  batch_size?: number;            // default: 16
  force_embeddings?: boolean;
  // BM25 config
  index_id?: string;              // auto-generated if empty
  index_root?: string;
  force_index?: boolean;
}

interface SubmitIntakeResponse {
  workflow_id: string;
  engine_db: string;
  db_path: string;
  document_ids: string[];
  strategy_id: string;           // e.g. "fixed-1200-150"
  op_ids: string[];
}
```

**Data source:** `workflow.SubmitIntakeWorkflow()` reads document IDs from corpus DB, writes workflow + ops to engine DB.

#### `GET /api/v1/queues`

```typescript
interface QueueStatusResponse {
  queues: QueueStatus[];
}

interface QueueStatus {
  site: string;           // "rag-eval"
  queue: string;          // "rag-eval:cpu" | "rag-eval:embedding" | "rag-eval:index" | "rag-eval:llm"
  pending: number;
  ready: number;
  running: number;
  succeeded: number;
  failed: number;
  in_flight: number;
  max_in_flight: number;
  tokens?: number;        // Token bucket state (if rate-limited)
  burst?: number;
  rate_per_second?: number;
}
```

**Data source:** `engineview.ListQueues()` reads from `state/rag-eval-workflows.db`, aggregates `ops` by `(site, queue_key, status)` + joins `queue_limit_state`.

---

## 5. Screen Designs

### 5.1 Workflows List Screen

The landing view when you click "Workflows" in the nav bar.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◉ RAG Eval    Search | Corpus | Workflows | Pipeline | Embeddings | Eva │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ Workflows ──────────────────────────────────────────────────────┐   │
│  │  [+ New Intake]                           Filter: [all ▾]  🔍    │   │
│  ├───────────────────────────────────────────────────────────────────┤   │
│  │                                                                   │   │
│  │  ID                    Name                  Status    Ops   Age   │   │
│  │  ────────────────────  ────────────────────  ────────  ────  ───  │   │
│  │  intake-20260529T14…  rag-eval intake       ● Running  18/20  3m  │   │
│  │  intake-20260528T09…  rag-eval intake       ✔ Done     20/20  1d  │   │
│  │  intake-20260527T16…  rag-eval intake       ✘ Failed   15/20  2d  │   │
│  │                                                                   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Queue Health ───────────────────────────────────────────────────┐   │
│  │  Queue             Ready  Running  In-Flight  Rate              │   │
│  │  rag-eval:cpu        0       2        2/1       —                │   │
│  │  rag-eval:embedding  1       0        0/1       5 tok/s         │   │
│  │  rag-eval:index      0       0        0/1       —                │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Input props:**
- `WorkflowsListView` — no props; fetches from API.

**Data sources:**
- `GET /api/v1/workflows?limit=50` → `WorkflowListResponse`
- `GET /api/v1/queues` → `QueueStatusResponse`
- Polling: every 2 seconds while any workflow is `running`.

**Interactions:**
- Click a workflow row → navigate to Workflow Detail screen.
- Click `[+ New Intake]` → open Submit Intake modal.
- Filter dropdown: `all | pending | running | succeeded | failed | canceled`.
- Queue health auto-refreshes.

### 5.2 Submit Intake Modal

A form overlay for creating a new intake workflow. This is the **primary entry point** for developers who want to kick off a pipeline run.

```
┌─────────────────────────────────────────────────────────────┐
│  Submit Intake Workflow                                 [✕] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ── Document Selection ──────────────────────────────────   │
│                                                              │
│  Source IDs:  [ttc-guides        ] [ttc-articles      ] [+] │
│  Document IDs: (auto-resolved from sources)                 │
│  Document Limit: [0    ] (0 = all)                          │
│                                                              │
│  ── Chunking ────────────────────────────────────────────   │
│                                                              │
│  Strategy:    [fixed ▾]                                     │
│  Chunk Size:  [1200  ]                                      │
│  Overlap:     [150   ]                                      │
│  → Strategy ID will be: fixed-1200-150                      │
│                                                              │
│  ── Embedding ──────────────────────────────────────────    │
│                                                              │
│  ☑ Compute Embeddings                                       │
│  Provider:    [openai ▾]                                    │
│  Engine:      [text-embedding-3-small ▾]                    │
│  Dimensions:  [1536  ]                                      │
│  Batch Size:  [16    ]                                      │
│  ☐ Force recompute                                          │
│                                                              │
│  ── BM25 Index ─────────────────────────────────────────    │
│                                                              │
│  ☑ Build BM25 Index                                        │
│  Index ID:    [auto-generated        ]                      │
│  ☐ Force rebuild                                           │
│                                                              │
│                     [Cancel]  [Submit Workflow]              │
└─────────────────────────────────────────────────────────────┘
```

**Input props:**
- `SubmitIntakeModal` — `onClose: () => void`, `onSubmitted: (workflowId: string) => void`

**Data sources:**
- `GET /api/v1/sources` → populate source ID suggestions.
- `POST /api/v1/workflows/intake` → `SubmitIntakeResponse`

**Interactions:**
- Source IDs: multi-select with autocomplete from existing sources.
- Strategy dropdown: `fixed | recursive` (extensible).
- Provider dropdown: `openai | ollama`.
- Engine dropdown: changes based on provider selection.
- `Strategy ID` preview updates live as chunk size/overlap change.
- On submit: POST the form, close modal, navigate to the new workflow's detail page.
- Validation: at least one source or document ID required.

### 5.3 Workflow Detail Screen

The heart of the workflow UI. Shows the op DAG, per-op progress, and allows drill-down.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◉ RAG Eval    Search | Corpus | Workflows*| Pipeline | Embeddings | Eva │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ Workflow: intake-20260529T143000 ───────────────────────────────┐   │
│  │  Status: ● Running    Created: 2026-05-29 14:30    Site: rag-eval│   │
│  │  Strategy: fixed-1200-150    Docs: 18    Ops: 20                 │   │
│  │  [Cancel Workflow]                                                │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Op DAG ────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │   ┌─────────────────┐                                            │   │
│  │   │ chunk:doc-1     │ ✔ 2s ago                                   │   │
│  │   └────────┬────────┘                                            │   │
│  │            │                                                      │   │
│  │   ┌────────┴────────┐   ┌─────────────────┐                     │   │
│  │   │ chunk:doc-2     │ ● │ chunk:doc-3     │ ◌ pending           │   │
│  │   └────────┬────────┘   └────────┬────────┘                     │   │
│  │            │                     │                               │   │
│  │   ... (18 chunk ops)              │                              │   │
│  │            │                     │                               │   │
│  │   ┌────────┴─────────────────────┴──────────┐                   │   │
│  │   │            :embed                        │ ◌ pending         │   │
│  │   └──────────────────────────────────────────┘                   │   │
│  │   ┌──────────────────────────────────────────┐                   │   │
│  │   │            :bm25                          │ ◌ pending       │   │
│  │   └──────────────────────────────────────────┘                   │   │
│  │                                                                   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Op Table ──────────────────────────────────────────────────────┐   │
│  │  Op ID                     Operation      Queue      Status      │   │
│  │  ────────────────────────  ────────────  ─────────  ──────────  │   │
│  │  :chunk:doc-1              chunk_doc      cpu        ✔ Succeeded │   │
│  │  :chunk:doc-2              chunk_doc      cpu        ● Running   │   │
│  │  :chunk:doc-3              chunk_doc      cpu        ◌ Pending   │   │
│  │  :embed                    compute_emb    embedding  ◌ Pending   │   │
│  │  :bm25                     build_bm25     index      ◌ Pending   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Input props:**
- `WorkflowDetailView` — `workflowId: string`

**Data sources:**
- `GET /api/v1/workflows/{id}` → `WorkflowSummary` (metadata + stats)
- `GET /api/v1/workflows/{id}/ops` → `WorkflowOpsResponse` (full op list with deps)
- Polling: every 2 seconds while status is `running`.

**Interactions:**
- Click an op row → open Op Inspector panel.
- `[Cancel Workflow]` → `POST /api/v1/workflows/{id}/cancel`
- DAG auto-layout: chunk ops at the top, embed/bm25 at the bottom, edges from chunk deps.
- Op status icons: ✔ succeeded, ● running, ◌ pending/ready, ✘ failed, ⊘ canceled.
- If the workflow is `succeeded`, show a "View in Corpus" button that navigates to the Corpus Explorer with the workflow's source/strategy pre-selected.

### 5.4 Op Inspector Panel

A slide-out or split panel that shows everything about a single op—its input parameters, its result data, or its error details.

**For a succeeded op (e.g., `chunk_document`):**

```
┌─ Op Inspector ────────────────────────────────────────────┐
│                                                            │
│  Op: intake-...:chunk:doc-1                                │
│  Kind: rag-eval/intake    Queue: rag-eval:cpu              │
│  Status: ✔ Succeeded    Completed: 2026-05-29 14:30:12    │
│                                                            │
│  ── Input ──────────────────────────────────────────────   │
│  operation:     chunk_document                             │
│  db_path:       data/rag-eval.db                           │
│  document_id:   ttc-guide-plant-apple-pear-trees          │
│  strategy:      fixed                                      │
│  chunk_size:    1200                                       │
│  overlap:       150                                        │
│                                                            │
│  ── Result ─────────────────────────────────────────────   │
│  document_id:   ttc-guide-plant-apple-pear-trees          │
│  strategy_id:   fixed-1200-150                             │
│  chunk_count:   3                                          │
│                                                            │
│  [View Document in Corpus →]                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**For a failed op:**

```
┌─ Op Inspector ────────────────────────────────────────────┐
│                                                            │
│  Op: intake-...:embed                                      │
│  Kind: rag-eval/intake    Queue: rag-eval:embedding        │
│  Status: ✘ Failed                                         │
│                                                            │
│  ── Error ──────────────────────────────────────────────   │
│  Code:      compute_embeddings_failed                      │
│  Message:   failed to call OpenAI API: connection refused  │
│  Retryable: true                                           │
│  Details:   { "strategy_id": "fixed-1200-150" }           │
│                                                            │
│  ── Retry State ───────────────────────────────────────    │
│  Attempt:         2 / 3                                    │
│  Last Error:      connection refused                       │
│  Next Attempt At: 2026-05-29 14:32:00                     │
│                                                            │
│  [Retry Now]                                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Input props:**
- `OpInspector` — `op: WorkflowOp`, `result?: OpResultDetail`

**Data sources:**
- Op data comes from the parent `WorkflowDetailView`'s query.
- `GET /api/v1/workflows/{id}/results/{opId}` → full result JSON (lazily loaded when inspector opens).
- `POST /api/v1/workflows/{id}/retry/{opId}` → retry action.

**Interactions:**
- `[Retry Now]` → POST retry endpoint, then re-fetch ops.
- `[View Document in Corpus →]` → dispatch `rag:navigate-to-chunk` event (already used by SearchView → CorpusExplorer navigation).
- For `compute_embeddings` result: show provider, model, dimensions, considered/computed/skipped_fresh counts.
- For `build_bm25` result: show index_id, index_path, chunk_count, document_count, rebuilt flag.

### 5.5 Queue Health Widget

A compact panel showing queue state, embedded in the Workflows list screen.

```
┌─ Queue Health ──────────────────────────────────────┐
│                                                      │
│  Queue              ██████████░░░  Ready  Running    │
│  rag-eval:cpu       ██████░░░░░░    0       2      │
│  rag-eval:embedding ██████░░░░░░    1       0      │
│  rag-eval:index     ░░░░░░░░░░░░    0       0      │
│  rag-eval:llm       ░░░░░░░░░░░░    0       0      │
│                                                      │
│  Failed ops: 2  (click to see)                       │
└──────────────────────────────────────────────────────┘
```

**Data source:** `GET /api/v1/queues` → `QueueStatusResponse`

**Interactions:**
- Bar chart shows ready/running/succeeded proportions.
- "Failed ops: 2" links to a filtered view of workflows with failed ops.
- Auto-refreshes every 5 seconds.

---

## 6. React Component Architecture

### 6.1 Component Tree

```
App
├── Nav bar (existing, add "Workflows" tab)
└── WorkflowsView (NEW)
    ├── QueueHealthWidget (NEW)
    │   └── data: useListQueuesQuery (polling)
    │
    ├── WorkflowsList (NEW)
    │   ├── data: useListWorkflowsQuery (polling)
    │   ├── filter bar (status dropdown)
    │   └── WorkflowRow (NEW) per workflow
    │
    ├── SubmitIntakeModal (NEW)
    │   ├── data: useListSourcesQuery (for source autocomplete)
    │   ├── mutation: useSubmitIntakeWorkflowMutation
    │   └── form fields (document selection, chunking, embedding, bm25)
    │
    └── WorkflowDetail (NEW)
        ├── data: useGetWorkflowQuery (polling)
        ├── data: useGetWorkflowOpsQuery (polling)
        ├── WorkflowHeader (status, metadata, cancel button)
        ├── OpDAG (visual graph)
        │   ├── OpNode (per op, shows status icon + label)
        │   └── OpEdge (dependency arrows)
        ├── OpTable (sortable/filterable op list)
        └── OpInspector (slide-out panel)
            ├── InputSection (parsed IntakeOpInput)
            ├── ResultSection (operation-specific output)
            ├── ErrorSection (OpError + retry state)
            └── Actions (retry, navigate-to-corpus)
```

### 6.2 RTK Query Endpoints to Add

Add to `web/src/services/api.ts`:

```typescript
// --- Workflow Types ---

export interface WorkflowListItem {
  workflow: {
    id: string;
    site: string;
    name: string;
    status: string;
    input: Record<string, unknown>;
    metadata: Record<string, string>;
    created_at: string;
    updated_at: string;
  };
  op_total: number;
  op_done: number;
}

export interface WorkflowListResponse {
  workflows: WorkflowListItem[];
  total: number;
}

export interface WorkflowOp {
  op: {
    id: string;
    workflow_id: string;
    kind: string;
    queue: string;
    dedup_key: string;
    input: IntakeOpInput;
    depends_on: Array<{ op_id: string; required: boolean }>;
    retry: { max_attempts: number; backoff_kind: string; initial_backoff_ms: number };
    retry_state: { attempt: number; next_attempt_at: string | null; last_error: string };
    metadata: Record<string, string>;
  };
  status: string;
  created_at: string;
  updated_at: string;
  lease: { worker_id: string; acquired_at: string; expires_at: string } | null;
}

export interface WorkflowSummary {
  workflow: WorkflowListItem['workflow'];
  stats: {
    workflow_id: string;
    total: number;
    pending: number;
    ready: number;
    running: number;
    succeeded: number;
    failed: number;
    canceled: number;
  };
}

export interface OpResultDetail {
  op_id: string;
  data: Record<string, unknown>;
  error: { code: string; message: string; retryable: boolean; details: Record<string, unknown> } | null;
  completed_at: string;
}

export interface QueueStatus {
  site: string;
  queue: string;
  pending: number;
  ready: number;
  running: number;
  succeeded: number;
  failed: number;
  in_flight: number;
  max_in_flight: number;
  tokens?: number;
  rate_per_second?: number;
}

export interface SubmitIntakeRequest {
  db_path?: string;
  workflow_id?: string;
  name?: string;
  source_ids?: string[];
  document_ids?: string[];
  document_limit?: number;
  strategy?: string;
  chunk_size?: number;
  overlap?: number;
  skip_embeddings?: boolean;
  skip_bm25?: boolean;
  profile?: string;
  base_profile?: string;
  embeddings_type?: string;
  embeddings_engine?: string;
  embeddings_dimensions?: number;
  batch_size?: number;
  force_embeddings?: boolean;
  index_id?: string;
  index_root?: string;
  force_index?: boolean;
}

export interface SubmitIntakeResponse {
  workflow_id: string;
  engine_db: string;
  db_path: string;
  document_ids: string[];
  strategy_id: string;
  op_ids: string[];
}

// --- New Endpoints ---

endpoints: (builder) => ({
  // ... existing endpoints ...

  listWorkflows: builder.query<WorkflowListResponse, { status?: string; limit?: number; offset?: number }>({
    query: (params) => ({
      url: 'workflows',
      params: {
        status: params.status,
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
      },
    }),
    providesTags: ['Workflows'],
  }),

  getWorkflow: builder.query<WorkflowSummary, string>({
    query: (id) => `workflows/${id}`,
    providesTags: ['Workflows'],
  }),

  getWorkflowOps: builder.query<WorkflowOp[], string>({
    query: (id) => `workflows/${id}/ops`,
    providesTags: ['Workflows'],
  }),

  getWorkflowOpResult: builder.query<OpResultDetail, { workflowId: string; opId: string }>({
    query: ({ workflowId, opId }) => `workflows/${workflowId}/results/${opId}`,
    providesTags: ['Workflows'],
  }),

  submitIntakeWorkflow: builder.mutation<SubmitIntakeResponse, SubmitIntakeRequest>({
    query: (body) => ({ url: 'workflows/intake', method: 'POST', body }),
    invalidatesTags: ['Workflows'],
  }),

  retryOp: builder.mutation<void, { workflowId: string; opId: string }>({
    query: ({ workflowId, opId }) => ({
      url: `workflows/${workflowId}/retry/${opId}`,
      method: 'POST',
    }),
    invalidatesTags: ['Workflows'],
  }),

  cancelWorkflow: builder.mutation<void, string>({
    query: (id) => ({ url: `workflows/${id}/cancel`, method: 'POST' }),
    invalidatesTags: ['Workflows'],
  }),

  listQueues: builder.query<QueueStatus[], void>({
    query: () => 'queues',
    providesTags: ['Workflows'],
  }),
}),
```

Add `'Workflows'` to `tagTypes`.

### 6.3 Polling Strategy

- `useListWorkflowsQuery` with `pollingInterval: 2000` when any workflow has status `running` or `pending`.
- `useGetWorkflowOpsQuery` with `pollingInterval: 2000` when the detail view is open and the workflow is `running`.
- `useListQueuesQuery` with `pollingInterval: 5000` always.

### 6.4 Navigation Integration

Add "Workflows" to the `views` array in `App.tsx`:

```typescript
const views = [
  { id: 'search', label: 'Search' },
  { id: 'corpus', label: 'Corpus' },
  { id: 'workflows', label: 'Workflows' },  // NEW
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'embeddings', label: 'Embeddings' },
  { id: 'evaluation', label: 'Evaluation' },
];
```

---

## 7. Backend Implementation Guide

### 7.1 Wire Engine DB Path

The engine DB path needs to be available to the HTTP handlers. The simplest approach: add it as a parameter to `RegisterHandlers`.

In `cmd/rag-eval/cmds/serve/server.go`, pass the engine DB path:

```go
func registerAPI(mux *http.ServeMux, database *sql.DB, engineDB string) {
    // ... existing corpus handlers ...
    api.RegisterHandlers(mux, database)
    api.RegisterWorkflowHandlers(mux, engineDB, database)  // NEW
}
```

### 7.2 New Handler File: `internal/api/workflow_handlers.go`

```go
package api

import (
    "encoding/json"
    "net/http"
    "strconv"

    "github.com/go-go-golems/rag-evaluation-system/internal/db"
    "github.com/go-go-golems/rag-evaluation-system/internal/workflow"
    "github.com/go-go-golems/scraper/pkg/engine/model"
    "github.com/go-go-golems/scraper/pkg/services/engineview"
)

type workflowHandler struct {
    engineView *engineview.Service
    corpusDB   *sql.DB
}

func RegisterWorkflowHandlers(mux *http.ServeMux, engineDB string, corpusDB *sql.DB) {
    h := &workflowHandler{
        engineView: engineview.NewService(engineDB),
        corpusDB:   corpusDB,
    }

    mux.HandleFunc("GET /api/v1/workflows", h.handleListWorkflows)
    mux.HandleFunc("GET /api/v1/workflows/{id}", h.handleGetWorkflow)
    mux.HandleFunc("GET /api/v1/workflows/{id}/ops", h.handleGetWorkflowOps)
    mux.HandleFunc("GET /api/v1/workflows/{id}/results/{opId}", h.handleGetOpResult)
    mux.HandleFunc("POST /api/v1/workflows/{id}/retry/{opId}", h.handleRetryOp)
    mux.HandleFunc("POST /api/v1/workflows/{id}/cancel", h.handleCancelWorkflow)
    mux.HandleFunc("POST /api/v1/workflows/intake", h.handleSubmitIntake)
    mux.HandleFunc("GET /api/v1/queues", h.handleListQueues)
}
```

Each handler calls the corresponding `engineview.Service` method and serializes the result. The `handleSubmitIntake` handler is special—it needs to call `workflow.SubmitIntakeWorkflow()`, which opens the engine DB itself, so the handler just passes the request through.

### 7.3 Pseudocode for Key Handlers

```go
// handleListWorkflows returns workflows with optional status filter.
func (h *workflowHandler) handleListWorkflows(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    status := r.URL.Query().Get("status")
    limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
    offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

    opts := engineview.ListWorkflowsOptions{
        Status: model.WorkflowStatus(status),
        Limit:  limit,
        Offset: offset,
    }
    result, err := h.engineView.ListWorkflows(ctx, opts)
    if err != nil {
        writeError(w, 500, "query_failed", err.Error())
        return
    }
    writeJSON(w, 200, result)
}

// handleSubmitIntake creates a new intake workflow.
func (h *workflowHandler) handleSubmitIntake(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    var req workflow.SubmitIntakeRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, 400, "invalid_json", err.Error())
        return
    }
    // Apply defaults (same as SubmitIntakeWorkflow does internally)
    if req.DBPath == "" { req.DBPath = "data/rag-eval.db" }
    if req.EngineDB == "" { req.EngineDB = "state/rag-eval-workflows.db" }
    if req.Strategy == "" { req.Strategy = "fixed" }
    if req.ChunkSize == 0 { req.ChunkSize = 1200 }
    if req.Overlap == 0 { req.Overlap = 150 }

    result, err := workflow.SubmitIntakeWorkflow(ctx, req)
    if err != nil {
        writeError(w, 500, "submit_failed", err.Error())
        return
    }
    writeJSON(w, 201, result)
}

// handleRetryOp retries a failed op.
func (h *workflowHandler) handleRetryOp(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    workflowID := model.WorkflowID(r.PathValue("id"))
    opID := model.OpID(r.PathValue("opId"))

    if err := h.engineView.RetryOp(ctx, workflowID, opID); err != nil {
        writeError(w, 400, "retry_failed", err.Error())
        return
    }
    writeJSON(w, 200, map[string]string{"status": "retried"})
}
```

### 7.4 CORS and Static File Serving

No changes needed. The existing `spa.go` already serves the React SPA on `/` and the API on `/api/v1/*`. New endpoints fit into the same pattern.

---

## 8. Op DAG Visualization

### 8.1 Layout Algorithm

The intake workflow has a predictable structure: N chunk ops at the top, 1–2 fan-in ops at the bottom. A simple hierarchical layout works:

1. Group ops by `operation` type from their `input.operation` field.
2. Group 0 (top): all `chunk_document` ops.
3. Group 1 (bottom): `compute_embeddings` and `build_bm25` ops.
4. Draw edges from each chunk op to each fan-in op (based on `depends_on`).

For small workflows (≤ 30 chunk ops), render all nodes. For large workflows (> 30), use a "collapsed" representation:

```
  ┌──────────────────────────────────┐
  │ chunk_document × 18  ✔12 ●3 ◌3  │
  └──────────────┬───────────────────┘
                 │
      ┌──────────┴──────────┐
      │ :embed   ◌ pending  │
      │ :bm25    ◌ pending  │
      └─────────────────────┘
```

### 8.2 Implementation Approach

Use a simple **CSS-based layout** (no D3 or canvas needed for this structure):

- Each `OpNode` is a `<div>` with absolute positioning calculated from group + index.
- Edges are SVG `<line>` elements overlaid on the same container.
- Status colors come from a CSS variable map:
  - `succeeded` → green (`var(--status-done)`)
  - `running` → blue pulse (`var(--status-running)`)
  - `pending/ready` → gray
  - `failed` → red (`var(--status-error)`)
  - `canceled` → strikethrough gray

### 8.3 OpNode Component

```typescript
interface OpNodeProps {
  op: WorkflowOp;
  x: number;
  y: number;
  onClick: (opId: string) => void;
  // Derived from op.input.operation:
  operationLabel: string;  // "chunk:doc-1" | "embed" | "bm25"
}

// Pseudocode rendering:
//
// ┌─────────────────────┐
// │ ✔ chunk:doc-1       │
// │   rag-eval:cpu  2s   │
// └─────────────────────┘
```

---

## 9. Implementation Phases

### Phase 1: Backend API (estimated: 1 day)

1. Create `internal/api/workflow_handlers.go` with all 8 endpoints.
2. Wire into `RegisterHandlers` / server setup.
3. Test with `curl` against a running `rag-eval serve`.

**Files to create/modify:**
- `internal/api/workflow_handlers.go` (NEW)
- `cmd/rag-eval/cmds/serve/server.go` (add engine DB path, register new handlers)
- `cmd/rag-eval/cmds/serve/root.go` (add `--engine-db` flag)

### Phase 2: RTK Query + Types (estimated: 0.5 day)

1. Add TypeScript types for all workflow API responses.
2. Add RTK Query endpoints to `api.ts`.
3. Add `'Workflows'` tag type.

**Files to modify:**
- `web/src/services/api.ts`

### Phase 3: Workflows List + Queue Health (estimated: 1 day)

1. Create `WorkflowsView` component with list + queue health.
2. Create `WorkflowRow` component.
3. Create `QueueHealthWidget` component.
4. Add "Workflows" tab to `App.tsx` nav.

**Files to create:**
- `web/src/components/workflows/WorkflowsView.tsx`
- `web/src/components/workflows/WorkflowRow.tsx`
- `web/src/components/workflows/QueueHealthWidget.tsx`

**Files to modify:**
- `web/src/App.tsx` (add workflows tab)

### Phase 4: Submit Intake Modal (estimated: 1 day)

1. Create `SubmitIntakeModal` with form fields.
2. Wire to `useSubmitIntakeWorkflowMutation`.
3. Source ID autocomplete from `useListSourcesQuery`.

**Files to create:**
- `web/src/components/workflows/SubmitIntakeModal.tsx`

### Phase 5: Workflow Detail + Op DAG (estimated: 2 days)

1. Create `WorkflowDetail` with header, DAG, and op table.
2. Create `OpDAG` with hierarchical layout.
3. Create `OpNode` and `OpEdge`.
4. Polling for live updates.

**Files to create:**
- `web/src/components/workflows/WorkflowDetail.tsx`
- `web/src/components/workflows/OpDAG.tsx`
- `web/src/components/workflows/OpNode.tsx`
- `web/src/components/workflows/OpTable.tsx`

### Phase 6: Op Inspector + Actions (estimated: 1 day)

1. Create `OpInspector` panel with input/result/error sections.
2. Wire retry and cancel mutations.
3. Wire "View in Corpus" navigation.

**Files to create:**
- `web/src/components/workflows/OpInspector.tsx`

### Phase 7: Polish and Testing (estimated: 1 day)

1. Edge cases: empty states, error states, very large DAGs.
2. Styling alignment with existing retro Mac theme.
3. Integration test: submit intake from UI → watch DAG → inspect result → navigate to corpus.

---

## 10. Risks and Open Questions

1. **Engine DB concurrency**: The scheduler writes to the engine DB while the HTTP handlers read it. SQLite allows concurrent reads + one write, so this is safe as long as both processes use `WAL` mode. Verify this is set.

2. **Large DAG rendering**: A workflow with 500 documents creates 500 chunk ops + 2 fan-in ops. The DAG must collapse chunk ops into groups. The collapsed view needs design iteration.

3. **Real-time updates**: Polling every 2 seconds is simple but not truly real-time. For a future phase, consider SSE (server-sent events) or WebSocket for live op status updates. The scheduler already has an `Observer` interface that emits events.

4. **Submit intake from UI vs CLI**: The `SubmitIntakeWorkflow` function currently opens the engine DB, writes the workflow, and returns. This is fine for CLI use but for HTTP we need to make sure the engine DB path is configurable per-request or per-server.

5. **Security**: The intake submission endpoint allows specifying `api_key` and `base_url` for embedding providers. These should not be logged or returned in API responses. Consider server-side profile resolution where the UI only selects a named profile and the server resolves the key.

6. **Multiple engine DBs**: Currently one engine DB per rag-eval instance. If this changes, the API needs a way to specify which engine DB to query.

---

## 11. Key File Reference

| File | What it contains | Why it matters for this ticket |
|------|-----------------|-------------------------------|
| `scraper/pkg/engine/model/types.go` | WorkflowRun, OpSpec, OpResult, OpError, RetryPolicy, Lease | Core domain types for the DAG |
| `scraper/pkg/engine/store/store.go` | Store interface (WorkflowStore, OpStore, ResultStore) | Defines what the engine DB can do |
| `scraper/pkg/engine/store/sqlite/store.go` | SQLite implementation, migrations | Schema of the engine DB |
| `scraper/pkg/engine/scheduler/scheduler.go` | Scheduler loop, Observer interface, Event types | How ops get executed and events emitted |
| `scraper/pkg/services/engineview/service.go` | EngineStatus() | Top-level engine health |
| `scraper/pkg/services/engineview/workflow_read_service.go` | ListWorkflows, Workflow, WorkflowOps | Backend queries for the workflow list and detail |
| `scraper/pkg/services/engineview/workflow_mutation_service.go` | RetryOp, CancelWorkflow | Mutation actions exposed in the UI |
| `scraper/pkg/services/engineview/queue_read_service.go` | ListQueues | Queue health data |
| `scraper/pkg/services/engineview/artifact_read_service.go` | ListWorkflowResults, GetOpResult, ListArtifacts | Result and artifact inspection |
| `internal/workflow/ops.go` | IntakeOpInput, output structs, operation constants | The op input/output contracts |
| `internal/workflow/submit.go` | SubmitIntakeWorkflow(), SubmitIntakeRequest | How intake workflows are submitted |
| `internal/workflow/intake_runner.go` | IntakeRunner.Run() | How each operation type is dispatched |
| `internal/workflow/engine.go` | NewIntakeScheduler() | Wiring of store + registry + scheduler |
| `internal/workflow/constants.go` | Queue names, runner kind | Queue routing keys |
| `internal/api/handlers.go` | Existing HTTP handlers (corpus, search, embedding) | Pattern to follow for new handlers |
| `web/src/services/api.ts` | RTK Query endpoints + TypeScript types | Where to add new workflow endpoints |
| `web/src/App.tsx` | Top-level nav + view routing | Where to add Workflows tab |
| `web/src/components/corpus/CorpusExplorerView.tsx` | Corpus explorer pattern (source → doc → inspector) | Pattern to follow for workflow → op → inspector |
