---
title: Goja RAG Strategy Architecture and Intern Implementation Guide
type: design
status: active
intent: long-term
topics: [rag, goja, embeddings, chunking, search, xgoja, scraper, geppetto]
ticket: RAGEVAL-GOJA-RAG-STRATEGIES
---

# Goja RAG Strategy Architecture and Intern Implementation Guide

## Executive Summary

This document is a comprehensive, intern-ready guide to the RAG evaluation system and its surrounding ecosystem. It explains how to add JavaScript-driven experimentation points for RAG indexing strategies—chunking, LLM enrichment, embedding computation, and search retrieval—using the goja JavaScript engine, the scraper workflow scheduler, the geppetto LLM inference module, and the xgoja code generator.

The central question this document answers is: **how can we write short JS scripts that drive RAG pipeline steps, schedule them as durable workflow operations, and inspect the results through a web UI?**

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [The RAG Evaluation System](#2-the-rag-evaluation-system)
3. [The Scraper Workflow Engine](#3-the-scraper-workflow-engine)
4. [The Goja JavaScript Engine](#4-the-goja-javascript-engine)
5. [The Geppetto LLM Module](#5-the-geppetto-llm-module)
6. [Xgoja: Custom Binary Code Generation](#6-xgoja-custom-binary-code-generation)
7. [Integration Architecture](#7-integration-architecture)
8. [Proposed JS-Driven RAG Strategies](#8-proposed-js-driven-rag-strategies)
9. [Implementation Phases](#9-implementation-phases)
10. [API Reference](#10-api-reference)
11. [File Reference](#11-file-reference)
12. [Diagrams](#12-diagrams)

---

## 1. System Overview

The workspace at `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/` contains a Go module workspace (`go.work`) that links six major repositories:

| Repository | Purpose |
|---|---|
| `2026-05-27--rag-evaluation-system` | The RAG evaluation application: CLI, API server, web UI, SQLite storage, workflow ops |
| `scraper` | A job scheduler and JS runtime for web scraping workflows. Provides durable op scheduling, SQLite-backed queues, and a JS runner |
| `geppetto` | LLM inference engine and goja module. Provides `require("geppetto")` for JS scripts, with profile-based provider resolution |
| `go-go-goja` | The goja runtime builder, module system, REPL, and xgoja codegen. Provides the JS VM infrastructure |
| `pinocchio` | A chat/inference TUI that composes geppetto with a web SPA. Uses agent-mode middleware |
| `glazed` | CLI framework with structured output, help pages, and config loading |

These components form a layered stack. The RAG evaluation system sits at the top, using scraper's scheduler for durable workflows, go-go-goja's builder for JS runtime construction, and geppetto's module for LLM access from JS.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RAG Evaluation System                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  CLI     │  │  API     │  │  Web UI  │  │  Workflow Engine │  │
│  │ rag-eval │  │ /api/v1  │  │  React   │  │  (scraper-based) │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
│       │             │                              │               │
│       ▼             ▼                              ▼               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Go Service Layer                          │  │
│  │  SourceService │ DocumentService │ ChunkingService           │  │
│  │  EmbeddingService │ SearchService │ DocumentProcessingService│  │
│  │  ChunkEnrichmentService │ CorpusService                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│       │                              │               │              │
│       ▼                              ▼               ▼              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────┐    │
│  │  SQLite  │  │ Bleve    │  │  Geppetto Providers          │    │
│  │  DB      │  │ BM25     │  │  (OpenAI, Ollama, Fake)      │    │
│  └──────────┘  └──────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                     │
         ▼                    ▼                     ▼
┌──────────────┐   ┌──────────────────┐   ┌─────────────────────┐
│   Scraper    │   │   go-go-goja     │   │    Geppetto         │
│  Scheduler   │   │  Runtime Builder │   │  JS Module          │
│  Store       │   │  Modules         │   │  require("geppetto")│
│  JS Runner   │   │  xgoja codegen   │   │  Profile Registry  │
└──────────────┘   └──────────────────┘   └─────────────────────┘
```

---

## 2. The RAG Evaluation System

### 2.1 What It Does

The RAG evaluation system is a workflow-driven document indexing pipeline with an interactive playground. Its job is to take a corpus of markdown documents (articles, guides, etc.), process them through a series of indexing steps, and make them searchable through both keyword (BM25) and vector similarity search.

The pipeline steps are:

1. **Source scanning** — read markdown files from a directory, store them in SQLite as documents with `content_text`, `word_count`, `title`, etc.
2. **Document preprocessing** — use an LLM to compute derived artifacts (summaries, clean text, keyword extraction) and store them as `document_processing_artifacts`.
3. **Chunking** — split documents into overlapping chunks using configurable strategies (fixed-size, sentence-boundary, markdown-heading).
4. **Chunk enrichment** — use an LLM to augment individual chunks with contextual metadata (parent document summary, section context, keyword lists).
5. **Embedding computation** — compute vector embeddings for each chunk using an embedding provider (Ollama, OpenAI, etc.) and store them in SQLite as `chunk_embeddings`.
6. **BM25 index building** — build a Bleve-based full-text search index over chunks.
7. **Search retrieval** — query via BM25, vector similarity, or hybrid (Reciprocal Rank Fusion).

### 2.2 Project Structure

```
2026-05-27--rag-evaluation-system/
├── cmd/rag-eval/
│   ├── main.go                    # CLI entry point (cobra)
│   └── cmds/
│       ├── source/                # source create, list, scan
│       ├── document/              # document list, get, chunks, preprocess
│       ├── chunk/                 # chunk apply, enrich, strategies
│       ├── embedding/             # compute, coverage, similarity
│       ├── search/                # index, query, vector, hybrid, smoke
│       ├── workflow/              # submit, status, worker, ops
│       └── serve/                 # API server + SPA
├── internal/
│   ├── api/
│   │   ├── handlers.go           # HTTP handler registration
│   │   └── workflow_artifact_handlers.go
│   ├── chunking/
│   │   └── chunker.go            # FixedSizeChunker, SentenceChunker, MarkdownHeadingChunker
│   ├── db/
│   │   ├── db.go                 # OpenDB, Migrate
│   │   ├── queries.go            # All typed SQL queries
│   │   ├── migrations.go         # Schema DDL
│   │   ├── chunk_enrichment_queries.go
│   │   ├── document_processing_queries.go
│   │   └── search_queries.go
│   ├── ingest/
│   │   └── scanner.go            # Directory scanner → documents
│   ├── services/
│   │   ├── source/service.go
│   │   ├── document/service.go
│   │   ├── chunking/service.go
│   │   ├── chunkenrichment/service.go
│   │   ├── documentprocessing/service.go
│   │   ├── embedding/service.go, provider.go, vector.go, similarity.go
│   │   ├── search/service.go, bm25.go, vector.go, hybrid.go
│   │   └── corpus/service.go
│   ├── workflow/
│   │   ├── engine.go             # WorkerConfig → scheduler setup
│   │   ├── ops.go                # Op constants + IntakeOpInput/output types
│   │   ├── intake_runner.go      # IntakeRunner: dispatches ops to services
│   │   ├── submit.go             # SubmitIntakeWorkflow: builds op DAG
│   │   └── echo_runner.go
│   └── web/
│       └── spa.go                # go:embed of built React SPA
├── web/                          # React + TypeScript SPA
│   └── src/
│       ├── App.tsx
│       ├── services/api.ts
│       └── components/
│           ├── corpus/           # CorpusExplorerView, SourcePanel, DocumentInspector
│           ├── search/           # SearchView
│           ├── embeddings/        # EmbeddingsView
│           ├── evaluation/        # EvaluationView
│           ├── workflows/         # WorkflowsView
│           └── pipeline/          # PipelineView
├── data/
│   ├── corpus/                   # Markdown source files
│   ├── rag-eval.db               # Main SQLite database
│   └── indexes/bm25/             # Bleve index directories
└── go.mod
```

### 2.3 Data Model

The SQLite schema has these core tables:

- **`sources`** — corpus source definition (id, name, type, config_json)
- **`documents`** — ingested documents (id, source_id, title, content_text, word_count, status)
- **`chunks`** — text chunks (id, document_id, strategy_id, chunk_index, text, token_count, start_offset, end_offset)
- **`chunking_strategies`** — registered chunking configs (id, name, type, config_json)
- **`chunk_embeddings`** — computed embedding vectors (chunk_id, strategy_id, provider, model, dimensions, text_hash, embedding blob)
- **`document_processing_artifacts`** — LLM-derived document artifacts (document_id, artifact_type, prompt_version, provider, model, input_hash, output_text, output_json, status)
- **`chunk_enrichment_artifacts`** — LLM-derived chunk artifacts (chunk_id, strategy_id, prompt_version, provider, model, text_hash, enriched_text, quality_score, status)

### 2.4 Workflow Operations

The `IntakeRunner` dispatches these op kinds:

| Operation | Description | Queue |
|---|---|---|
| `echo` | Simple echo for testing | CPU |
| `preprocess_document` | LLM processing of a document (summaries, keywords) | LLM |
| `chunk_document` | Split a document into chunks | CPU |
| `enrich_chunk` | LLM augmentation of a chunk with context | LLM |
| `compute_embeddings` | Vector embedding computation for chunks | Embedding |
| `build_bm25` | Build Bleve full-text search index | Index |

Each op is submitted as an `IntakeOpInput` JSON blob with an `operation` field and op-specific parameters. The workflow engine creates a DAG of ops with dependencies (e.g., chunk ops depend on preprocess ops, embedding ops depend on chunk ops).

### 2.5 API Endpoints

The API server exposes these routes (see `internal/api/handlers.go`):

```
GET    /api/v1/health
GET    /api/v1/sources
POST   /api/v1/sources
POST   /api/v1/sources/{id}/scan
GET    /api/v1/documents
GET    /api/v1/documents/{id}
GET    /api/v1/documents/{id}/chunks
GET    /api/v1/documents/{id}/processing-artifacts
POST   /api/v1/documents/{id}/chunk
GET    /api/v1/chunking-strategies
POST   /api/v1/embeddings/compute
POST   /api/v1/embeddings/coverage
POST   /api/v1/embeddings/similarity
POST   /api/v1/search/indexes
POST   /api/v1/search/query
POST   /api/v1/search/vector
POST   /api/v1/search/hybrid
GET    /api/v1/workflows
GET    /api/v1/workflows/{id}
GET    /api/v1/workflows/{id}/ops
GET    /api/v1/workflows/{id}/results/{opId}
POST   /api/v1/workflows/{id}/retry/{opId}
POST   /api/v1/workflows/{id}/cancel
POST   /api/v1/workflows/intake
GET    /api/v1/queues
GET    /api/v1/corpus/sources
GET    /api/v1/corpus/documents
GET    /api/v1/corpus/documents/{id}
```

---

## 3. The Scraper Workflow Engine

### 3.1 What Scraper Does

Scraper was originally designed as a web scraping framework where **jobs are written in JavaScript**. It provides:

- **Durable workflow scheduling** — workflows and ops are persisted in SQLite. If the process crashes, ops resume from their last state.
- **Dependency-based op DAGs** — ops declare dependencies on other ops; the scheduler only runs ops whose dependencies are satisfied.
- **Queue-based concurrency** — ops are assigned to named queues (e.g., `cpu`, `llm`, `embedding`) with configurable max-in-flight and rate limits.
- **Lease-based worker model** — workers acquire leases on ops; leases expire if the worker crashes, allowing other workers to pick up the op.
- **JS runner** — a `JSRunner` that loads JS scripts from an embedded filesystem and executes them in a goja VM.

### 3.2 How JS Execution Works

The JS execution path in scraper:

```
JSRunner.Run(ctx, runCtx)
  │
  ├── 1. Look up site definition in registry (contains ScriptsFS, Modules, etc.)
  │
  ├── 2. Create Executor with config from site
  │     ExecutorConfig{ScriptsFS, ScriptsRoot, Modules, ExtraModules, ScraperDB, SiteDB}
  │
  ├── 3. Executor.Execute(ctx, req)
  │     │
  │     ├── Build goja runtime via gggengine.Builder
  │     │   builder.WithRequireOptions(loader)
  │     │   builder.WithModules(modules...)
  │     │   builder.WithModules(NewDatabaseRegistrar(...))
  │     │   factory = builder.Build()
  │     │   runtime = factory.NewRuntime()
  │     │
  │     ├── Execute JS via runtime.Owner.Call("scraper.js.execute", callback)
  │     │   │
  │     │   ├── require("./" + scriptPath)  — load the script
  │     │   ├── resolveScriptFunction(moduleValue) — find exported function
  │     │   ├── buildJSContext(vm, req, state) — create ctx object
  │     │   └── fn(undefined, jsCtx) — call the script function
  │     │
  │     ├── Await Promise if result is a Promise
  │     │
  │     └── Build OpResult from execution state
  │         (records, artifacts, emitted ops, log entries)
  │
  └── Return OpResult
```

### 3.3 The JS Context Object

When a JS script runs inside scraper, it receives a `ctx` object with these properties and methods:

```javascript
// Available in every scraper JS script
const ctx = {
  site: "my-site",
  now: "2026-06-02T12:00:00Z",
  workflow: { id, site, name, status, input, metadata },
  op: { id, workflowID, site, kind, queue, dedupKey, metadata },
  lease: { workerID, token, acquiredAt, expiresAt },
  input: { /* the op's Input JSON */ },

  // Functions
  log(...parts),              // Log a message (captured as artifact)
  dep(opID),                  // Resolve a dependency op's result
  emit(opSpec),               // Emit new ops into the workflow
  writeRecord(collection, key, data),  // Write a record to the store
  writeArtifact(artifactSpec),        // Write an artifact to the store
};
```

This is a powerful execution context. A JS script can:
- Read its op input
- Resolve results from dependency ops via `dep()`
- Emit new ops into the workflow via `emit()`
- Write records and artifacts to the store
- Log messages that are captured and persisted

### 3.4 Key Scraper Files

| File | Purpose |
|---|---|
| `scraper/pkg/engine/runner/js.go` | JSRunner — dispatcher from scraper op to JS executor |
| `scraper/pkg/js/runtime/executor.go` | Executor — builds goja runtime, loads script, executes, builds result |
| `scraper/pkg/engine/runner/runner.go` | Runner interface and Registry |
| `scraper/pkg/engine/scheduler/scheduler.go` | Scheduler — lease-based op dispatch loop |
| `scraper/pkg/engine/store/sqlite/store.go` | SQLite store for workflows, ops, leases, results |
| `scraper/pkg/engine/model/types.go` | Core types: WorkflowRun, OpSpec, OpResult, Lease, etc. |
| `scraper/pkg/sites/registry/registry.go` | Site registry — maps site names to definitions |
| `scraper/pkg/sites/defaults/defaults.go` | Default site definitions |

---

## 4. The Goja JavaScript Engine

### 4.1 What Goja Is

Goja (`github.com/dop251/goja`) is an ECMAScript 5.1+ implementation in pure Go. It provides:
- A JavaScript VM that runs in-process, no external runtime needed
- A `require()` system via `goja_nodejs` that loads native Go modules
- Promise support with event loop integration
- No DOM, no Node.js builtins (those are added via goja_nodejs modules)

The go-go-goja project wraps goja with a runtime builder, module system, and REPL infrastructure.

### 4.2 The Runtime Builder

The `gggengine.Builder` pattern for creating a goja runtime:

```go
// Pseudocode for building a goja runtime with modules
builder := gggengine.NewBuilder().
    WithRequireOptions(require.WithLoader(myLoader)).
    WithModules(moduleSpec1, moduleSpec2, ...)

factory, err := builder.Build()
runtime, err := factory.NewRuntime(gggengine.WithStartupContext(ctx))
defer runtime.Close(ctx)

// Execute JS code
result, err := runtime.Owner.Call(ctx, "my.namespace", func(ctx context.Context, vm *goja.Runtime) (any, error) {
    moduleValue, err := runtime.Require.Require("./my-script")
    fn, _ := goja.AssertFunction(moduleValue)
    result, err := fn(goja.Undefined(), vm.ToValue(inputData))
    return result.Export(), nil
})
```

### 4.3 Available Goja Modules

The go-go-goja project ships these modules (in `go-go-goja/modules/`):

| Module | `require()` name | Purpose |
|---|---|---|
| `crypto` | `crypto` | Hashing and random bytes |
| `database` | `database` | SQLite query execution (shared with scraper) |
| `events` | `events` | Event emitter pattern |
| `exec` | `exec` | Execute external commands |
| `express` | `express` | HTTP server (Express-like API) |
| `fs` | `fs` | Filesystem operations (sync, async, embed backends) |
| `os` | `os` | OS info, environment variables |
| `path` | `path` | Path manipulation |
| `time` | `time` | Time formatting and parsing |
| `timer` | `timer` | setTimeout, setInterval |
| `uidsl` | `uidsl` | TUI DSL for rendering tables and components |
| `yaml` | `yaml` | YAML parse/stringify |

Additionally, **geppetto** provides the `geppetto` module for LLM inference (see Section 5).

### 4.4 How to Add a New Module

A goja native module follows this pattern:

```go
package mymodule

import (
    "github.com/dop251/goja"
    "github.com/dop251/goja_nodejs/require"
)

const ModuleName = "my-module"

func NewLoader(opts Options) require.ModuleLoader {
    return func(vm *goja.Runtime, moduleObj *goja.Object) {
        exports := moduleObj.Get("exports").(*goja.Object)
        _ = exports.Set("myFunction", func(call goja.FunctionCall) goja.Value {
            // implement the function
            return vm.ToValue("hello from my module")
        })
    }
}

func Register(reg *require.Registry, opts Options) {
    reg.RegisterNativeModule(ModuleName, NewLoader(opts))
}
```

Then register it in the runtime builder:

```go
builder := gggengine.NewBuilder().
    WithModules(gggengine.RuntimeModuleSpec{
        Package: "my-package-id",
        Name:    "my-module",
        As:      "my-module",  // require("my-module")
    })
```

---

## 5. The Geppetto LLM Module

### 5.1 What Geppetto Provides for JS

The geppetto goja module (`require("geppetto")`) exposes a full LLM inference API to JavaScript scripts. This is the key bridge that enables JS scripts to call LLMs for document processing and chunk enrichment.

### 5.2 JS API Surface

```javascript
const geppetto = require("geppetto");

// Version
geppetto.version  // "0.1.0"

// Quick inference
const result = await geppetto.runInference({
  profile: "gpt-4o-mini",
  messages: [{ role: "user", content: "Summarize this document..." }],
});

// Builder pattern for complex pipelines
const builder = geppetto.createBuilder();
const session = builder
  .withProfile("gpt-4o-mini")
  .withMiddleware("think-mode")
  .build();
const sessionObj = geppetto.createSession(session);
const events = geppetto.events.collector();
const runner = geppetto.runner.resolveRuntime(session, events);
const prepared = geppetto.runner.prepare(runner, turns);
const runResult = await geppetto.runner.start(prepared);

// Profile management
const profiles = geppetto.profiles.listProfiles();
const profile = geppetto.profiles.getProfile("gpt-4o-mini");
const resolved = geppetto.profiles.resolve({ profile: "gpt-4o-mini" });

// Engine factories
const engine = geppetto.engines.fromProfile("gpt-4o-mini");
const engine2 = geppetto.engines.fromFunction(async (turns) => { ... });

// Turns manipulation
const t = geppetto.turns;
const normalized = t.normalize(rawTurns);
const newTurn = t.newTurn();
t.appendBlock(newTurn, t.newUserBlock("Hello"));
t.appendBlock(newTurn, t.newSystemBlock("You are a helpful assistant."));

// Tools
const registry = geppetto.tools.createRegistry();
// Register Go tools or JS tool definitions

// Middleware
const mw = geppetto.middlewares.fromJS({ /* JS middleware config */ });
const goMw = geppetto.middlewares.go("think-mode");

// Schemas
const mwSchemas = geppetto.schemas.listMiddlewares();
const extSchemas = geppetto.schemas.listExtensions();
```

### 5.3 Embeddings in JS

Geppetto also has a separate embeddings wrapper (`geppetto/pkg/js/embeddings-js.go`) that can register an `embeddings` global in a goja runtime:

```javascript
// Sync embedding
const vec = embeddings.generateEmbedding("some text to embed");

// Async embedding (Promise)
const vec2 = await embeddings.generateEmbeddingAsync("some text to embed");

// With callbacks
embeddings.generateEmbeddingWithCallbacks("text", {
  onSuccess: (vec) => { /* handle */ },
  onError: (err) => { /* handle */ },
});

// Model info
const model = embeddings.getModel();
// { name: "nomic-embed-text", dimensions: 768 }
```

### 5.4 Key Geppetto Files

| File | Purpose |
|---|---|
| `geppetto/pkg/js/modules/geppetto/module.go` | Module registration, exports, Options struct |
| `geppetto/pkg/js/modules/geppetto/api_runner.go` | Runner API (resolveRuntime, prepare, run, start) |
| `geppetto/pkg/js/modules/geppetto/api_engines.go` | Engine factories |
| `geppetto/pkg/js/modules/geppetto/api_profiles.go` | Profile management |
| `geppetto/pkg/js/modules/geppetto/api_middlewares.go` | Middleware factories |
| `geppetto/pkg/js/modules/geppetto/api_tools_registry.go` | Tool registry |
| `geppetto/pkg/js/modules/geppetto/api_turns.go` | Turns manipulation |
| `geppetto/pkg/js/modules/geppetto/provider/provider.go` | Module provider for xgoja |
| `geppetto/pkg/js/embeddings-js.go` | Standalone embeddings wrapper |
| `geppetto/pkg/js/runtime/runtime.go` | JS runtime helpers |
| `geppetto/pkg/js/runtimebridge/bridge.go` | Bridge between goja Owner and geppetto runtime |

---

## 6. Xgoja: Custom Binary Code Generation

### 6.1 What Xgoja Does

Xgoja generates a custom Go binary from a declarative `xgoja.yaml` spec. The generated binary bundles selected goja modules, provider packages, and command definitions. This lets you create a standalone CLI tool that has exactly the modules you need for your use case.

### 6.2 xgoja.yaml Structure

```yaml
name: rag-eval-js
go:
  version: "1.26"
  module: github.com/go-go-golems/rag-evaluation-system
target:
  kind: xgoja
  output: dist/rag-eval-js
packages:
  - id: go-go-goja-core
    import: github.com/go-go-golems/go-go-goja/pkg/xgoja/providers/core
    register: Register
  - id: geppetto
    import: github.com/go-go-golems/geppetto/pkg/js/modules/geppetto/provider
    register: Register
  # Future: add rag-ops provider package
  # - id: rag-ops
  #   import: github.com/go-go-golems/rag-evaluation-system/pkg/xgoja/providers/ragops
  #   register: Register
runtimes:
  main:
    modules:
      - package: go-go-goja-core
        name: fs
        as: fs
      - package: go-go-goja-core
        name: yaml
        as: yaml
      - package: go-go-goja-core
        name: database
        as: database
      - package: geppetto
        name: geppetto
        as: geppetto
      # Future:
      # - package: rag-ops
      #   name: rag-ops
      #   as: rag-ops
commands:
  repl:
    enabled: true
    runtime: main
  eval:
    enabled: true
    runtime: main
  run:
    enabled: true
    runtime: main
  jsverbs:
    enabled: true
    runtime: main
```

### 6.3 Generated Commands

An xgoja binary typically provides these commands:

- **`eval <expr>`** — evaluate a JS expression
- **`run <script.js>`** — run a JS file
- **`repl`** — interactive JS REPL
- **`verbs`** — run JS verb scripts (if jsverbs configured)

### 6.4 Adding a New Provider Package

To add a new module provider for xgoja, you need:

1. A Go package with a `Register()` function that registers module specs
2. The package must follow the provider interface expected by xgoja
3. Add the package to the `packages` section of `xgoja.yaml`
4. Run `xgoja build` to regenerate the binary

---

## 7. Integration Architecture

### 7.1 Three Integration Surfaces

There are three distinct ways to integrate JS-driven RAG experimentation:

#### Surface 1: JS Op Kind in Scraper Workflow

Add a new op kind `js_pipeline` to the RAG evaluation workflow engine. When the scheduler encounters this op kind, it loads a JS script, provides it with a `ragCtx` object that wraps the RAG service layer, and executes it.

```
┌──────────────────────────────────────────────────────────────────┐
│                     Scraper Scheduler                            │
│                                                                  │
│  Op Kind: IntakeRunner          Op Kind: JSRunner (new)          │
│  ┌───────────────────────┐      ┌────────────────────────────┐  │
│  │ chunk_document        │      │ js_pipeline               │  │
│  │ preprocess_document   │      │                            │  │
│  │ enrich_chunk          │      │ Loads script from FS       │  │
│  │ compute_embeddings    │      │ Provides ragCtx object     │  │
│  │ build_bm25            │      │ Can require("geppetto")    │  │
│  └───────────────────────┘      │ Can require("rag-ops")     │  │
│                                  │ Can emit() new ops          │  │
│                                  └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Pros:** Durable scheduling, dependency tracking, retry policies, automatic artifact persistence.
**Cons:** Requires building a new runner kind, more infrastructure.

#### Surface 2: `rag-ops` Goja Module

Create a `require("rag-ops")` native module that wraps the existing Go service layer. This module can be used in any goja runtime—inside scraper JS ops, in an xgoja REPL, or in a standalone script.

```javascript
const ragOps = require("rag-ops");
const geppetto = require("geppetto");

// List documents
const docs = ragOps.documents.list({ limit: 50 });

// Get document content
const doc = ragOps.documents.get("doc-abc123");
const content = doc.content_text;

// Chunk a document
const chunks = ragOps.chunking.apply({
  document_id: "doc-abc123",
  strategy: "markdown-heading",
  chunk_size: 1200,
});

// Compute embeddings for chunks
const result = ragOps.embeddings.compute({
  strategy_id: "fixed-1200-150",
  provider_type: "ollama",
  model: "nomic-embed-text",
});

// Search
const hits = ragOps.search.query({
  index_id: "bm25-intake-20260602",
  query: "how to plant crape myrtle",
  limit: 10,
});

// LLM enrichment (using geppetto)
const summary = await geppetto.runInference({
  profile: "gpt-4o-mini",
  messages: [{
    role: "user",
    content: `Summarize this article:\n\n${content}`
  }],
});
ragOps.documentProcessing.store({
  document_id: "doc-abc123",
  artifact_type: "summary",
  prompt_version: "v1",
  output_text: summary.content,
});
```

**Pros:** Works everywhere goja runs, composable with geppetto, no workflow dependency needed for experimentation.
**Cons:** No durable scheduling by itself (but can be combined with Surface 1).

#### Surface 3: Xgoja Standalone Binary

Generate a custom `rag-eval-js` binary via xgoja that bundles the `rag-ops` module, geppetto, and core goja modules. This gives you a REPL for ad-hoc experimentation.

```bash
# Build the custom binary
xgoja build

# Interactive experimentation
$ rag-eval-js repl
> const ragOps = require("rag-ops");
> const docs = ragOps.documents.list({ limit: 10 });
> docs.forEach(d => console.log(d.title));
  "General Planting Guide"
  "How to Plant Apple Trees"
  ...

# Run a script
$ rag-eval-js run scripts/enrich-with-context.js

# Evaluate an expression
$ rag-eval-js eval 'require("rag-ops").documents.list({limit:3}).map(d=>d.title)'
```

**Pros:** Maximum ergonomics for REPL-driven development. No Go compilation needed after initial xgoja build.
**Cons:** No durable scheduling; scripts run ephemerally.

### 7.2 Recommended Integration Path

The recommended path uses all three surfaces in sequence:

1. **Phase 1 (rag-ops module):** Build the `require("rag-ops")` module first. This unlocks JS-driven experimentation in any context.
2. **Phase 2 (js_pipeline op kind):** Add the `js_pipeline` op kind to the workflow engine, using the `rag-ops` module inside scraper's JS executor. This enables durable, scheduled JS pipelines.
3. **Phase 3 (xgoja binary):** Create an `xgoja.yaml` that bundles `rag-ops` + geppetto. This gives a REPL for quick experimentation.

### 7.3 The `rag-ops` Module Design

```go
// Pseudocode for rag-ops module structure
package ragops

type Options struct {
    DBPath    string    // path to rag-eval.db
    IndexRoot string    // path to BM25 index root
}

func NewLoader(opts Options) require.ModuleLoader {
    return func(vm *goja.Runtime, moduleObj *goja.Object) {
        exports := moduleObj.Get("exports").(*goja.Object)
        
        // documents namespace
        docsObj := vm.NewObject()
        docsObj.Set("list", docsList(opts))
        docsObj.Set("get", docsGet(opts))
        docsObj.Set("getContent", docsGetContent(opts))
        exports.Set("documents", docsObj)
        
        // chunking namespace
        chunkObj := vm.NewObject()
        chunkObj.Set("apply", chunkApply(opts))
        chunkObj.Set("listStrategies", chunkListStrategies(opts))
        chunkObj.Set("listChunks", chunkListChunks(opts))
        exports.Set("chunking", chunkObj)
        
        // embeddings namespace
        embObj := vm.NewObject()
        embObj.Set("compute", embCompute(opts))
        embObj.Set("coverage", embCoverage(opts))
        embObj.Set("similarity", embSimilarity(opts))
        exports.Set("embeddings", embObj)
        
        // search namespace
        searchObj := vm.NewObject()
        searchObj.Set("buildIndex", searchBuildIndex(opts))
        searchObj.Set("query", searchQuery(opts))
        searchObj.Set("vectorSearch", searchVector(opts))
        searchObj.Set("hybridSearch", searchHybrid(opts))
        exports.Set("search", searchObj)
        
        // documentProcessing namespace
        dpObj := vm.NewObject()
        dpObj.Set("store", dpStore(opts))
        dpObj.Set("getArtifact", dpGetArtifact(opts))
        dpObj.Set("coverage", dpCoverage(opts))
        exports.Set("documentProcessing", dpObj)
        
        // chunkEnrichment namespace
        ceObj := vm.NewObject()
        ceObj.Set("store", ceStore(opts))
        ceObj.Set("getArtifact", ceGetArtifact(opts))
        ceObj.Set("coverage", ceCoverage(opts))
        exports.Set("chunkEnrichment", ceObj)
        
        // sources namespace
        srcObj := vm.NewObject()
        srcObj.Set("list", srcList(opts))
        srcObj.Set("create", srcCreate(opts))
        srcObj.Set("scan", srcScan(opts))
        exports.Set("sources", srcObj)
    }
}
```

---

## 8. Proposed JS-Driven RAG Strategies

### 8.1 Strategy: LLM-Generated Summaries as Index Terms

**Goal:** Use an LLM to generate a structured summary for each document, then use that summary as additional index terms for both BM25 and vector search.

**JS Script:**

```javascript
// scripts/llm-summaries-as-index-terms.js
module.exports = async function(ctx) {
  const geppetto = require("geppetto");
  const ragOps = require("rag-ops");
  
  const docs = ragOps.documents.list({ limit: ctx.input.limit || 100 });
  const results = [];
  
  for (const doc of docs) {
    // Skip if already processed with this prompt version
    const existing = ragOps.documentProcessing.getArtifact({
      document_id: doc.id,
      artifact_type: "structured_summary",
      prompt_version: "v1",
      provider: "openai-responses",
      model: "gpt-4o-mini",
    });
    if (existing && existing.status === "succeeded") {
      ctx.log(`Skipping ${doc.id}: already processed`);
      continue;
    }
    
    const content = ragOps.documents.getContent(doc.id);
    
    // Call LLM for structured summary
    const response = await geppetto.runInference({
      profile: ctx.input.profile || "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Analyze this document and produce a JSON object with:
          - summary: a 2-3 sentence summary
          - keywords: an array of 5-10 key terms
          - topics: an array of 2-5 topic categories
          - reading_level: one of "beginner", "intermediate", "advanced"
          
          Document title: ${doc.title}
          
          ${content.slice(0, 4000)}`
      }],
    });
    
    // Store as artifact
    ragOps.documentProcessing.store({
      document_id: doc.id,
      artifact_type: "structured_summary",
      prompt_version: "v1",
      provider: "openai-responses",
      model: "gpt-4o-mini",
      output_text: response.content,
    });
    
    results.push({ document_id: doc.id, status: "processed" });
    ctx.log(`Processed ${doc.id}`);
  }
  
  return { data: results };
};
```

### 8.2 Strategy: Markdown Section Chunking with LLM Context Enrichment

**Goal:** Chunk documents by markdown headings, then use an LLM to prepend each chunk with its parent document context (title, section hierarchy, sibling section summaries).

**JS Script:**

```javascript
// scripts/markdown-section-chunk-with-context.js
module.exports = async function(ctx) {
  const geppetto = require("geppetto");
  const ragOps = require("rag-ops");
  
  const docId = ctx.input.document_id;
  const content = ragOps.documents.getContent(docId);
  const doc = ragOps.documents.get(docId);
  
  // Step 1: Chunk by markdown headings
  const chunks = ragOps.chunking.apply({
    document_id: docId,
    strategy: "markdown-heading",
    chunk_size: 2400,
  });
  
  ctx.log(`Created ${chunks.chunk_count} chunks for ${docId}`);
  
  // Step 2: For each chunk, compute LLM context
  const strategyId = chunks.strategy_id;
  const chunkList = ragOps.chunking.listChunks(docId);
  
  for (const chunk of chunkList) {
    // Build context: document title + surrounding section summaries
    const contextPrompt = `Document: "${doc.title}"
Section chunk (index ${chunk.chunk_index}):
${chunk.text.slice(0, 500)}...

Provide a brief 1-2 sentence context note that would help a reader understand 
where this section fits in the overall document.`;

    const response = await geppetto.runInference({
      profile: ctx.input.profile || "gpt-4o-mini",
      messages: [{ role: "user", content: contextPrompt }],
    });
    
    // Store as enrichment artifact
    ragOps.chunkEnrichment.store({
      chunk_id: chunk.id,
      strategy_id: strategyId,
      prompt_version: "context-v1",
      provider: "openai-responses",
      model: "gpt-4o-mini",
      enriched_text: `[Context: ${response.content}]\n\n${chunk.text}`,
    });
    
    ctx.log(`Enriched chunk ${chunk.id}`);
  }
  
  return {
    data: {
      document_id: docId,
      strategy_id: strategyId,
      chunks_enriched: chunkList.length,
    }
  };
};
```

### 8.3 Strategy: Keyword-Enhanced Embeddings

**Goal:** Compute embeddings not just on raw chunk text, but on chunk text augmented with LLM-extracted keywords. This can improve retrieval precision for domain-specific queries.

**JS Script:**

```javascript
// scripts/keyword-enhanced-embeddings.js
module.exports = async function(ctx) {
  const geppetto = require("geppetto");
  const ragOps = require("rag-ops");
  
  const strategyId = ctx.input.strategy_id;
  const chunks = ragOps.chunking.listChunksForStrategy(strategyId, ctx.input.limit || 50);
  
  // Step 1: Extract keywords for each chunk using LLM
  const keywordArtifacts = [];
  for (const chunk of chunks) {
    const response = await geppetto.runInference({
      profile: ctx.input.profile || "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Extract 5-10 keywords and key phrases from this text. 
Return them as a comma-separated list.

Text:
${chunk.text.slice(0, 2000)}`
      }],
    });
    
    const keywords = response.content.trim();
    const augmentedText = `${chunk.text}\n\nKeywords: ${keywords}`;
    
    ragOps.chunkEnrichment.store({
      chunk_id: chunk.id,
      strategy_id: strategyId,
      prompt_version: "keyword-extraction-v1",
      provider: "openai-responses",
      model: "gpt-4o-mini",
      enriched_text: augmentedText,
    });
    
    keywordArtifacts.push({ chunk_id: chunk.id, keywords });
  }
  
  // Step 2: Compute embeddings on the enriched text
  const embResult = ragOps.embeddings.compute({
    strategy_id: strategyId,
    provider_type: ctx.input.provider_type || "ollama",
    model: ctx.input.model || "nomic-embed-text",
    dimensions: ctx.input.dimensions || 768,
    force: true,  // recompute because text changed
  });
  
  return {
    data: {
      chunks_processed: chunks.length,
      embeddings: embResult,
    }
  };
};
```

### 8.4 Strategy: Multi-Grain Chunking with Hierarchical Index

**Goal:** Create chunks at multiple granularities (section-level and paragraph-level), compute embeddings for both, and use a two-stage retrieval: first retrieve sections, then retrieve fine-grained paragraphs within matching sections.

**JS Script:**

```javascript
// scripts/multi-grain-hierarchical-index.js
module.exports = async function(ctx) {
  const ragOps = require("rag-ops");
  
  // Step 1: Create coarse (section-level) chunks
  const coarseChunks = ragOps.chunking.apply({
    document_id: ctx.input.document_id,
    strategy: "markdown-heading",
    chunk_size: 4800,     // large sections
    description: "Coarse section-level chunks for hierarchical retrieval",
  });
  
  // Step 2: Create fine (paragraph-level) chunks
  const fineChunks = ragOps.chunking.apply({
    document_id: ctx.input.document_id,
    strategy: "sentence",
    chunk_size: 600,
    overlap: 100,
    description: "Fine paragraph-level chunks for detail retrieval",
  });
  
  // Step 3: Compute embeddings for both
  const coarseEmb = ragOps.embeddings.compute({
    strategy_id: coarseChunks.strategy_id,
    provider_type: ctx.input.provider_type || "ollama",
  });
  const fineEmb = ragOps.embeddings.compute({
    strategy_id: fineChunks.strategy_id,
    provider_type: ctx.input.provider_type || "ollama",
  });
  
  return {
    data: {
      coarse_strategy_id: coarseChunks.strategy_id,
      fine_strategy_id: fineChunks.strategy_id,
      coarse_chunk_count: coarseChunks.chunk_count,
      fine_chunk_count: fineChunks.chunk_count,
    }
  };
};
```

---

## 9. Implementation Phases

### Phase 1: The `rag-ops` Goja Module (Week 1-2)

**Goal:** Create `require("rag-ops")` that wraps all existing Go services.

**Steps:**

1. Create package `pkg/js/modules/ragops/` in the RAG evaluation system
2. Implement `module.go` with `NewLoader()` and `Register()`
3. Implement namespace files:
   - `api_documents.go` — `list()`, `get()`, `getContent()`
   - `api_chunking.go` — `apply()`, `listStrategies()`, `listChunks()`, `listChunksForStrategy()`
   - `api_embeddings.go` — `compute()`, `coverage()`, `similarity()`
   - `api_search.go` — `buildIndex()`, `query()`, `vectorSearch()`, `hybridSearch()`
   - `api_sources.go` — `list()`, `create()`, `scan()`
   - `api_document_processing.go` — `store()`, `getArtifact()`, `coverage()`
   - `api_chunk_enrichment.go` — `store()`, `getArtifact()`, `coverage()`
4. Write TypeScript declaration file `rag-ops.d.ts`
5. Write integration tests using `gggengine.Builder` + test DB
6. Add xgoja provider package `pkg/xgoja/providers/ragops/`

**Pseudocode for key function:**

```go
func docsList(opts Options) func(call goja.FunctionCall) goja.Value {
    return func(call goja.FunctionCall) goja.Value {
        vm := call.Runtime
        
        // Parse options from JS
        limit := 50
        if limitVal := call.Argument(0).ToObject(vm).Get("limit"); limitVal != nil {
            limit = int(limitVal.ToInteger())
        }
        
        // Open DB, execute query
        db_ := openDB(opts.DBPath)
        queries := db.NewQueries(db_)
        service := documentservice.NewService(queries)
        docs, err := service.List(context.Background(), documentservice.ListRequest{
            Limit: limit, Offset: 0,
        })
        if err != nil {
            panic(vm.NewGoError(err))
        }
        
        // Convert to JS array of objects
        arr := vm.NewArray()
        for i, doc := range docs {
            obj := vm.NewObject()
            obj.Set("id", doc.ID)
            obj.Set("title", doc.Title)
            obj.Set("word_count", doc.WordCount)
            obj.Set("source_id", doc.SourceID)
            // ... more fields
            arr.SetIndex(i, obj)
        }
        return arr
    }
}
```

### Phase 2: JS Pipeline Op Kind (Week 3-4)

**Goal:** Add `js_pipeline` op kind to the RAG evaluation workflow engine.

**Steps:**

1. Add `OperationJSPipeline = "js_pipeline"` to `internal/workflow/ops.go`
2. Add `JSPipelineInput` struct with fields: `script_path`, `db_path`, plus arbitrary `payload`
3. Create `internal/workflow/js_pipeline_runner.go`:
   - Implements `runner.Runner` interface with `Kind() = "js_pipeline"`
   - On `Run()`, builds a goja runtime with `rag-ops` + `geppetto` modules
   - Loads script from a configured scripts FS
   - Passes a `ragCtx` object that combines scraper's `ctx` with rag-ops access
4. Register the runner in `NewIntakeScheduler()`
5. Add `QueueJS = "js"` queue definition
6. Update `SubmitIntakeWorkflow()` to accept `js_pipeline` ops
7. Add API endpoint `POST /api/v1/workflows/js-pipeline` for submitting JS pipeline workflows

**Pseudocode for JS pipeline runner:**

```go
type JSPipelineRunner struct {
    ScriptsFS   fs.FS
    ScriptsRoot string
    RAGDBPath   string
    IndexRoot   string
}

func (r *JSPipelineRunner) Kind() string { return "js_pipeline" }

func (r *JSPipelineRunner) Run(ctx context.Context, runCtx runner.RunContext) (*model.OpResult, error) {
    var input JSPipelineInput
    json.Unmarshal(runCtx.Op.Input, &input)
    
    // Build goja runtime with rag-ops + geppetto
    loader := moduleLoader(r.ScriptsFS, r.ScriptsRoot)
    builder := gggengine.NewBuilder().
        WithRequireOptions(require.WithLoader(loader)).
        WithModules(
            ragopsModuleSpec,     // rag-ops
            geppettoModuleSpec,  // geppetto
            fsModuleSpec,        // fs
            yamlModuleSpec,      // yaml
        )
    
    factory, _ := builder.Build()
    runtime, _ := factory.NewRuntime(gggengine.WithStartupContext(ctx))
    defer runtime.Close(ctx)
    
    // Execute: load script, call it with ragCtx
    result, err := runtime.Owner.Call(ctx, "rag.eval.js.execute", 
        func(ctx context.Context, vm *goja.Runtime) (any, error) {
            mod, _ := runtime.Require.Require("./" + input.ScriptPath)
            fn, _ := resolveScriptFunction(vm, mod, input.ScriptPath)
            
            ragCtx := buildRAGContext(vm, runCtx, input, r.RAGDBPath, r.IndexRoot)
            result, err := fn(goja.Undefined(), ragCtx)
            if err != nil { return nil, err }
            return result.Export(), nil
        })
    
    // Build OpResult...
}
```

### Phase 3: Xgoja Standalone Binary (Week 5)

**Goal:** Create `xgoja.yaml` for a `rag-eval-js` REPL binary.

**Steps:**

1. Create `xgoja.yaml` in the project root with rag-ops + geppetto packages
2. Create provider package `pkg/xgoja/providers/ragops/` if not done in Phase 1
3. Run `xgoja build` to generate the binary
4. Add JS verb scripts under `scripts/` for common operations
5. Test the REPL with sample workflows
6. Document the REPL in a help page

### Phase 4: UI for JS Strategy Experimentation (Week 6-7)

**Goal:** Add UI screens for submitting JS pipeline workflows, inspecting results, and comparing strategies.

**Steps:**

1. Add "JS Pipelines" tab to the web UI
2. Create a script browser component (list JS files from scripts directory)
3. Create a script editor/viewer component (syntax-highlighted JS)
4. Create a pipeline submission form (select script, configure parameters, select documents)
5. Create a pipeline results viewer (show op results, artifacts, logs)
6. Add strategy comparison view (side-by-side search results for different chunking/enrichment strategies)
7. Wire to `POST /api/v1/workflows/js-pipeline` and `GET /api/v1/workflows/{id}/ops`

---

## 10. API Reference

### 10.1 rag-ops Module API

```typescript
declare module "rag-ops" {
  export namespace sources {
    function list(): Array<{ id: string; name: string; type: string; config_json?: string }>;
    function create(req: { id: string; name: string; type: string; config?: object }): object;
    function scan(req: { source_id: string; dir: string }): { documents_scanned: number };
  }

  export namespace documents {
    function list(opts?: { limit?: number; offset?: number }): Array<Document>;
    function get(id: string): Document | null;
    function getContent(id: string): string;
  }

  export namespace chunking {
    function apply(req: {
      document_id: string;
      strategy: "fixed" | "sentence" | "markdown-heading";
      chunk_size?: number;
      overlap?: number;
      description?: string;
    }): { document_id: string; strategy_id: string; chunk_count: number };
    function listStrategies(): Array<Strategy>;
    function listChunks(document_id: string): Array<Chunk>;
    function listChunksForStrategy(strategy_id: string, limit?: number): Array<Chunk>;
  }

  export namespace embeddings {
    function compute(req: {
      strategy_id: string;
      source_ids?: string[];
      profile?: string;
      provider_type?: string;
      model?: string;
      dimensions?: number;
      batch_size?: number;
      limit?: number;
      force?: boolean;
    }): ComputeResult;
    function coverage(req: {
      strategy_id: string;
      provider_type: string;
      model: string;
      dimensions: number;
    }): CoverageResult;
    function similarity(req: {
      strategy_id: string;
      provider_type: string;
      model: string;
      dimensions: number;
      chunk_id_a?: string;
      chunk_id_b?: string;
      limit?: number;
    }): SimilarityResult;
  }

  export namespace search {
    function buildIndex(req: {
      index_id?: string;
      strategy_id: string;
      source_ids?: string[];
      force?: boolean;
    }): BuildIndexResult;
    function query(req: {
      index_id: string;
      query: string;
      limit?: number;
    }): QueryResult;
    function vectorSearch(req: {
      query: string;
      strategy_id: string;
      provider_type?: string;
      model?: string;
      dimensions?: number;
      limit?: number;
    }): QueryResult;
    function hybridSearch(req: {
      index_id: string;
      query: string;
      strategy_id: string;
      limit?: number;
      rrf_k?: number;
    }): QueryResult;
  }

  export namespace documentProcessing {
    function store(req: {
      document_id: string;
      artifact_type: string;
      prompt_version: string;
      provider: string;
      model: string;
      output_text?: string;
      output_json?: object;
    }): void;
    function getArtifact(req: {
      document_id: string;
      artifact_type: string;
      prompt_version: string;
      provider: string;
      model: string;
    }): Artifact | null;
    function coverage(req: {
      artifact_type: string;
      prompt_version: string;
      provider: string;
      model: string;
    }): CoverageResult;
  }

  export namespace chunkEnrichment {
    function store(req: {
      chunk_id: string;
      strategy_id: string;
      prompt_version: string;
      provider: string;
      model: string;
      enriched_text: string;
      quality_score?: number;
    }): void;
    function getArtifact(req: {
      chunk_id: string;
      strategy_id: string;
      prompt_version: string;
      provider: string;
      model: string;
    }): Artifact | null;
    function coverage(req: {
      strategy_id: string;
      prompt_version: string;
      provider: string;
      model: string;
    }): CoverageResult;
  }

  interface Document {
    id: string;
    source_id: string;
    external_id?: string;
    title: string;
    author?: string;
    url?: string;
    content_type: string;
    word_count: number;
    language: string;
    status: string;
    created_at: string;
    updated_at: string;
  }

  interface Chunk {
    id: string;
    document_id: string;
    strategy_id: string;
    chunk_index: number;
    text: string;
    token_count: number;
    start_offset: number;
    end_offset: number;
  }

  interface Strategy {
    id: string;
    name: string;
    type: string;
    description: string;
  }

  interface ComputeResult {
    strategy_id: string;
    provider_type: string;
    model: string;
    dimensions: number;
    considered: number;
    computed: number;
    skipped_fresh: number;
  }

  interface QueryResult {
    hits: Array<{
      chunk_id: string;
      document_id: string;
      score: number;
      text_preview: string;
      chunk_index: number;
    }>;
    total: number;
  }

  interface Artifact {
    document_id?: string;
    chunk_id?: string;
    artifact_type: string;
    prompt_version: string;
    provider: string;
    model: string;
    output_text?: string;
    output_json?: string;
    status: string;
  }
}
```

### 10.2 Scraper JS Context API (available in js_pipeline ops)

```typescript
interface RagPipelineContext {
  site: string;
  now: string;
  workflow: { id: string; site: string; name: string; status: string; input: any; metadata: Record<string, string> };
  op: { id: string; workflowID: string; site: string; kind: string; queue: string; dedupKey: string; metadata: Record<string, string> };
  lease: { workerID: string; token: string; acquiredAt: string; expiresAt: string };
  input: any;

  log(...parts: any[]): void;
  dep(opID: string): OpResult | null;
  emit(opSpec: { kind: string; input?: any; queue?: string; dedupKey?: string; dependsOn?: Array<{opID: string; required?: boolean}>; retry?: { maxAttempts?: number; backoffKind?: string; initialBackoff?: string; maxBackoff?: string; multiplier?: number } }): string;
  writeRecord(collection: string, key: string, data: any): void;
  writeArtifact(artifact: { id?: string; name?: string; kind?: string; contentType?: string; metadata?: Record<string, string>; body?: string }): string;
}

interface OpResult {
  opID: string;
  data: any;
  records: Array<{ collection: string; key: string; data: any }>;
  artifacts: Array<{ id: string; name: string; kind: string; contentType: string; metadata: Record<string, string>; bodyText: string }>;
  error?: { code: string; message: string; retryable: boolean; details: any };
}
```

---

## 11. File Reference

### 11.1 RAG Evaluation System Files

| File Path | Description |
|---|---|
| `2026-05-27--rag-evaluation-system/cmd/rag-eval/main.go` | CLI entry point with cobra commands |
| `2026-05-27--rag-evaluation-system/internal/workflow/ops.go` | Op kind constants and input/output types |
| `2026-05-27--rag-evaluation-system/internal/workflow/intake_runner.go` | Op dispatcher (Go services) |
| `2026-05-27--rag-evaluation-system/internal/workflow/submit.go` | Workflow DAG builder |
| `2026-05-27--rag-evaluation-system/internal/workflow/engine.go` | Scheduler + store setup |
| `2026-05-27--rag-evaluation-system/internal/db/queries.go` | All SQL queries |
| `2026-05-27--rag-evaluation-system/internal/db/migrations.go` | Schema DDL |
| `2026-05-27--rag-evaluation-system/internal/chunking/chunker.go` | Chunking strategies (fixed, sentence, markdown-heading) |
| `2026-05-27--rag-evaluation-system/internal/services/embedding/service.go` | Embedding computation |
| `2026-05-27--rag-evaluation-system/internal/services/embedding/provider.go` | Provider resolution |
| `2026-05-27--rag-evaluation-system/internal/services/search/service.go` | Search service |
| `2026-05-27--rag-evaluation-system/internal/services/search/bm25.go` | Bleve BM25 implementation |
| `2026-05-27--rag-evaluation-system/internal/services/search/vector.go` | Vector similarity search |
| `2026-05-27--rag-evaluation-system/internal/services/search/hybrid.go` | Hybrid RRF search |
| `2026-05-27--rag-evaluation-system/internal/services/documentprocessing/service.go` | LLM document processing |
| `2026-05-27--rag-evaluation-system/internal/services/chunkenrichment/service.go` | LLM chunk enrichment |
| `2026-05-27--rag-evaluation-system/internal/api/handlers.go` | HTTP API handler registration |
| `2026-05-27--rag-evaluation-system/web/src/App.tsx` | React SPA entry |
| `2026-05-27--rag-evaluation-system/web/src/components/corpus/CorpusExplorerView.tsx` | Corpus browser |
| `2026-05-27--rag-evaluation-system/web/src/components/search/SearchView.tsx` | Search UI |
| `2026-05-27--rag-evaluation-system/web/src/components/embeddings/EmbeddingsView.tsx` | Embedding coverage/similarity |
| `2026-05-27--rag-evaluation-system/web/src/components/workflows/WorkflowsView.tsx` | Workflow viewer |

### 11.2 Scraper Files

| File Path | Description |
|---|---|
| `scraper/pkg/engine/runner/js.go` | JSRunner — op dispatch to JS executor |
| `scraper/pkg/js/runtime/executor.go` | JS execution engine (build runtime, load script, execute, build result) |
| `scraper/pkg/engine/runner/runner.go` | Runner interface and Registry |
| `scraper/pkg/engine/scheduler/scheduler.go` | Durable scheduler |
| `scraper/pkg/engine/store/sqlite/store.go` | SQLite workflow/op store |
| `scraper/pkg/engine/model/types.go` | Core domain types |

### 11.3 Goja / Geppetto Files

| File Path | Description |
|---|---|
| `go-go-goja/engine/runtime.go` | Runtime lifecycle management |
| `go-go-goja/engine/factory.go` | Runtime factory |
| `go-go-goja/engine/module_specs.go` | Module specification types |
| `go-go-goja/modules/database/database.go` | SQLite module (shared with scraper) |
| `go-go-goja/modules/fs/fs.go` | Filesystem module |
| `go-go-goja/modules/yaml/yaml.go` | YAML module |
| `go-go-goja/pkg/xgoja/providers/core/` | Core provider package for xgoja |
| `geppetto/pkg/js/modules/geppetto/module.go` | Geppetto goja module |
| `geppetto/pkg/js/modules/geppetto/provider/provider.go` | Geppetto xgoja provider |
| `geppetto/pkg/js/embeddings-js.go` | Embeddings wrapper for goja |
| `geppetto/pkg/js/runtimebridge/bridge.go` | Bridge between goja Owner and geppetto |

---

## 12. Diagrams

### 12.1 Data Flow: Document Ingestion to Search

```
                    ┌─────────────────────────────────────────┐
                    │          Markdown Corpus                 │
                    │  data/corpus/thetreecenter/guides/*.md  │
                    └────────────────┬────────────────────────┘
                                     │ scan
                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         SQLite: rag-eval.db                          │
│                                                                      │
│  ┌──────────┐     ┌──────────────┐     ┌────────────────────────┐   │
│  │ sources  │────▶│  documents   │────▶│ document_processing_   │   │
│  │          │     │  (content_   │     │ artifacts (LLM output) │   │
│  │          │     │   text,      │     │ - summary              │   │
│  │          │     │   word_count)│     │ - clean_text           │   │
│  └──────────┘     └──────┬───────┘     │ - keywords             │   │
                          │ chunk         └────────────────────────┘   │
                          ▼                                            │
                   ┌──────────────┐     ┌────────────────────────┐   │
                   │    chunks    │────▶│ chunk_enrichment_      │   │
                   │ (text,       │     │ artifacts (LLM output) │   │
                   │  token_count)│     │ - context notes        │   │
                   └──────┬───────┘     │ - enriched text        │   │
                          │             └────────────────────────┘   │
                  ┌───────┴────────┐                                 │
                  │                │                                 │
                  ▼ embed          ▼ index                           │
           ┌──────────────┐  ┌──────────────┐                      │
           │ chunk_       │  │ Bleve BM25   │                      │
           │ embeddings   │  │ Index        │                      │
           │ (vector blob)│  │ (zap files)  │                      │
           └──────┬───────┘  └──────┬───────┘                      │
                  │                 │                                │
                  └────────┬────────┘                                │
                           ▼                                         │
                   ┌──────────────┐                                  │
                   │ Hybrid Search│  (RRF fusion)                    │
                   │ - BM25 score │                                  │
                   │ - Cosine sim │                                  │
                   └──────────────┘                                  │
                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 12.2 JS Pipeline Op Execution Flow

```
                    SubmitIntakeWorkflow()
                           │
                           ▼
               ┌───────────────────────┐
               │  Create Op DAG in     │
               │  SQLite Store         │
               │                       │
               │  preprocess ──┐       │
               │  chunk ───────┤       │
               │  enrich ──────┤       │
               │  js_pipeline ─┤◄─NEW  │
               │  embed ───────┘       │
               │  bm25                  │
               └───────────┬───────────┘
                           │
                           ▼ scheduler loop
               ┌───────────────────────┐
               │  Worker acquires      │
               │  lease on op          │
               └───────────┬───────────┘
                           │
                  ┌────────┴────────┐
                  │                 │
           Op Kind: Intake    Op Kind: js_pipeline
                  │                 │
                  ▼                 ▼
          ┌──────────────┐  ┌──────────────────────────────────┐
          │ Go service   │  │ Build goja runtime               │
          │ dispatch     │  │  - rag-ops module                │
          │              │  │  - geppetto module               │
          │ chunkDoc()   │  │  - fs, yaml, database            │
          │ embed()      │  │                                   │
          │ preprocess() │  │ Load JS script from FS            │
          └──────────────┘  │                                   │
                            │ Call script function(ragCtx)      │
                            │  - ragCtx has rag-ops API         │
                            │  - ragCtx has scraper ctx methods │
                            │  - script can require("geppetto") │
                            │                                   │
                            │ Build OpResult from JS return     │
                            │  - artifacts, records, emitted ops│
                            └──────────────────────────────────┘
```

### 12.3 Xgoja Binary Experimentation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     rag-eval-js (xgoja binary)              │
│                                                             │
│  $ rag-eval-js repl                                         │
│  > const rag = require("rag-ops");                          │
│  > const gpt = require("geppetto");                         │
│  > const docs = rag.documents.list({limit: 5});             │
│  > const content = rag.documents.getContent(docs[0].id);    │
│  > const summary = await gpt.runInference({                 │
│      profile: "gpt-4o-mini",                                │
│      messages: [{role: "user", content: "Summarize: " +     │
│        content.slice(0, 2000)}]                             │
│    });                                                      │
│  > rag.documentProcessing.store({...});                     │
│  > const chunks = rag.chunking.apply({...});                │
│  > rag.embeddings.compute({...});                           │
│  > rag.search.query({index_id: "bm25-test", query: "..."});│
│                                                             │
│  $ rag-eval-js run scripts/enrich-with-context.js           │
│  $ rag-eval-js eval 'require("rag-ops").search.vectorSearch│
│      ({query:"crape myrtle", strategy_id:"fixed-1200-150"})'│
└─────────────────────────────────────────────────────────────┘
```

---

## Decision Records

### DR-1: Module Name `rag-ops` vs `rag-eval`

**Context:** Need a module name for the goja native module that wraps RAG evaluation services.

**Options:**
1. `rag-ops` — short, verb-focused, suggests operations
2. `rag-eval` — matches the binary name, suggests evaluation

**Decision:** `rag-ops`

**Rationale:** The module exposes *operations* (chunk, embed, search, enrich), not evaluation logic. The name `rag-ops` makes it clear that you're calling operations on the RAG pipeline, not running evaluation benchmarks. If a separate evaluation module is added later, it can be `rag-eval`.

**Consequences:** Users type `require("rag-ops")`, not `require("rag-eval")`. The xgoja provider package is `ragops`.

**Status:** proposed

### DR-2: DB Access Pattern for rag-ops Module

**Context:** The rag-ops module needs to access the SQLite database. Should it open a new connection per call, share a connection, or use the service layer?

**Options:**
1. Open a new `*sql.DB` per function call — simple, no concurrency issues, but slow
2. Share a `*sql.DB` across the module lifetime — efficient, requires careful closing
3. Use the existing Go service layer — most correct, reuses all business logic

**Decision:** Option 3 — use the existing Go service layer

**Rationale:** The Go services already handle input validation, conflict resolution, and edge cases. Reusing them avoids duplicating logic and ensures that JS calls produce the same results as API calls. The module opens a `*sql.DB` once at module load time and creates `*db.Queries` + service instances as needed.

**Consequences:** Module initialization requires a DB path. The module must close the DB connection when the runtime shuts down. Some service methods require provider resolution (embeddings, document processing), which the module must handle.

**Status:** proposed

### DR-3: JS Pipeline Scripts: Embedded FS vs. Filesystem

**Context:** JS pipeline scripts need to be loadable by the goja runtime. Should they be embedded in the binary or loaded from the filesystem?

**Options:**
1. `go:embed` — scripts compiled into the binary, version-controlled, but require rebuild to change
2. Filesystem — scripts loaded from a directory at runtime, easy to iterate, but must be deployed alongside the binary
3. Both — embedded by default, filesystem override via flag

**Decision:** Option 3 — embedded by default, filesystem override via flag

**Rationale:** Embedded scripts are convenient for production and xgoja binaries. Filesystem access is essential for development iteration. A `--scripts-dir` flag can override the embedded FS, enabling rapid experimentation without recompilation.

**Consequences:** The `JSPipelineRunner` must accept both an `fs.FS` and an optional filesystem path. The `xgoja.yaml` can include an `assets` section for embedding scripts.

**Status:** proposed

---

## Risks, Alternatives, and Open Questions

### Risks

- **LLM rate limits:** JS scripts that loop over many documents/chunks may hit API rate limits. The workflow engine's queue system and retry policies mitigate this, but scripts must be aware of backpressure.
- **Goja runtime lifecycle:** Creating a goja VM per op is expensive. For high-throughput pipelines, a VM pool or persistent VM may be needed.
- **SQLite concurrency:** Multiple JS ops writing to the same SQLite DB concurrently may cause contention. WAL mode helps, but the rag-ops module should use short transactions.

### Alternatives

- **Python scripting:** Instead of goja, expose the RAG services via a Python-friendly API (e.g., gRPC or HTTP) and write experimentation scripts in Python. This would leverage Python's LLM ecosystem but loses the in-process goja advantage.
- **Standalone REST client:** Write a thin CLI or Python library that calls the existing HTTP API. Simpler but no in-process access, slower for bulk operations.

### Open Questions

1. **goja-text module:** The user mentioned a `goja-text` module for text processing. Where is it? Is it planned? What should it provide (markdown parsing, section splitting, tokenization)?
2. **VM pooling:** Should the `js_pipeline` runner reuse goja VMs across ops, or create fresh ones each time? Reuse is faster but risks state leakage.
3. **Streaming LLM responses:** The current geppetto module collects full responses. For long documents, streaming would be more efficient. How should streaming be exposed in JS?
4. **Testing strategy:** How should JS pipeline scripts be tested? Unit tests with fake providers? Integration tests against a test corpus?
