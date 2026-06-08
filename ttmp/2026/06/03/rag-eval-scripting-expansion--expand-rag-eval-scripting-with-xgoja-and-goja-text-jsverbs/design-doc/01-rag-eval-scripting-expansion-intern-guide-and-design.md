---
Title: rag-eval scripting expansion — intern guide and design
Ticket: ""
Status: ""
Topics:
    - rag-eval
    - xgoja
    - goja-text
    - scripting
    - intern-guide
    - sqlite
    - rag
DocType: ""
Intent: ""
Owners: []
RelatedFiles:
    - Path: ../../../../../../../../../../code/wesen/go-go-golems/go-go-parc/Projects/2026/06/03/ARTICLE - Deep Dive - xgoja Scripting for RAG Evaluation Systems.md
      Note: Obsidian vault deep-dive article
    - Path: 2026-05-27--rag-evaluation-system/cmd/rag-eval/README.md
      Note: Directory overview and quick start
    - Path: 2026-05-27--rag-evaluation-system/cmd/rag-eval/jsverbs/explorer.js
      Note: New explorer jsverbs package using db
    - Path: 2026-05-27--rag-evaluation-system/cmd/rag-eval/xgoja.yaml
      Note: xgoja build specification
    - Path: 2026-05-27--rag-evaluation-system/docs/howtos/how-to-write-rag-eval-js-scripts-quick-reference.md
      Note: Quick reference companion
    - Path: 2026-05-27--rag-evaluation-system/docs/howtos/how-to-write-rag-eval-js-scripts.md
      Note: How-to guide for writing rag-eval-js scripts in glazed help style
    - Path: 2026-05-27--rag-evaluation-system/internal/db/db.go
      Note: SQLite schema migrations
    - Path: 2026-05-27--rag-evaluation-system/internal/db/queries.go
      Note: Typed Go query helpers
    - Path: 2026-05-27--rag-evaluation-system/ttmp/2026/06/03/rag-eval-scripting-expansion--expand-rag-eval-scripting-with-xgoja-and-goja-text-jsverbs/log/01-research-logbook.md
      Note: Research logbook tracking resources consulted
ExternalSources: []
Summary: ""
LastUpdated: 0001-01-01T00:00:00Z
WhatFor: ""
WhenToUse: ""
---










# rag-eval scripting expansion — intern guide and design

## Executive Summary

This document is the onboarding guide for a new intern working on the `rag-eval` RAG Evaluation System. It explains what the system is, how it is built, how its database is organized, how the JavaScript scripting layer works, and how to write new `jsverbs` using the `xgoja` toolchain and the `goja-text` text-processing modules.

The guide is evidence-based: every API reference, file path, and command example is grounded in the actual repository. By the end of this document, an intern should be able to:

- Run the rag-eval CLI and the generated `rag-eval-js` scripting binary.
- Query the SQLite database using both Go and JavaScript.
- Understand the database schema and the relationships between sources, documents, chunks, embeddings, enrichments, search indexes, and evaluation artifacts.
- Write new `jsverbs` using `db`, `fs`, `express`, `markdown`, `sanitize`, and `extract`.
- Rebuild the `rag-eval-js` binary after adding or modifying `jsverbs`.
- Extend the system with new Explorer verbs or entirely new verb packages.

---

## 1. What is rag-eval?

`rag-eval` is a workflow-driven document indexing and retrieval evaluation system. It ingests documents from multiple sources, chunks them using configurable strategies, computes vector embeddings, builds hybrid search indexes (BM25 + vector), and provides a web-based corpus explorer for inspecting documents, chunks, embeddings, and search results.

The system is built around a central SQLite database that tracks:

- **Sources**: where documents come from (filesystem crawls, SQLite dumps, WordPress imports).
- **Documents**: individual articles, guides, or products with metadata.
- **Chunks**: text segments produced by chunking strategies.
- **Chunk Embeddings**: dense vectors for semantic search.
- **Chunk Enrichments**: LLM-generated summaries, entities, and hypothetical questions.
- **Search Indexes**: disposable BM25 and vector indexes for retrieval experiments.
- **Document Processing Artifacts**: outputs of LLM-based preprocessing (title extraction, summarization).
- **Evaluation Queries/Runs/Results**: structured RAG evaluation experiments.

On top of this database, `rag-eval` provides:

1. A **Go CLI** (`cmd/rag-eval`) for operational tasks: source management, chunking, embedding computation, search, and workflow orchestration.
2. A **React web UI** (`web/`) served by the Go backend as an embedded SPA.
3. A **JavaScript scripting layer** (`cmd/rag-eval/jsverbs/`) powered by `xgoja`, which turns JavaScript functions into first-class CLI commands.

---

## 2. System Architecture Overview

### 2.1 High-Level Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Frontends                                 │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │  Go CLI      │  │  React Web UI    │  │  rag-eval-js       │ │
│  │  (Cobra)     │  │  (Vite + TS)     │  │  (xgoja runtime)   │ │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬───────────┘ │
└─────────┼──────────────────┼───────────────────────┼─────────────┘
          │                  │                       │
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     HTTP + SQLite Backend                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  internal/api/handlers.go  →  REST endpoints for corpus  │   │
│  │  internal/services/        →  domain services           │   │
│  │  internal/db/              →  schema + queries         │   │
│  │  internal/workflow/        →  workflow engine + runners │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SQLite Database                           │
│  data/rag-eval.db                                               │
│  Tables: sources, documents, chunks, chunking_strategies,       │
│          chunk_embeddings, chunk_enrichments,                   │
│          document_processing_artifacts, search_indexes,           │
│          eval_queries, eval_runs, eval_results                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Directory Map

| Directory | Purpose |
|-----------|---------|
| `cmd/rag-eval/` | Go CLI main entry point and xgoja scripting config |
| `cmd/rag-eval/cmds/` | Cobra command groups: source, chunk, document, embedding, search, serve, workflow |
| `cmd/rag-eval/jsverbs/` | JavaScript verb packages registered with xgoja |
| `internal/api/` | HTTP handlers for the REST API (corpus, search, workflows) |
| `internal/db/` | SQLite schema migrations and typed query helpers |
| `internal/services/` | Domain services: corpus, document, chunking, chunk enrichment, embedding, search, source, document processing |
| `internal/web/` | Go code that embeds and serves the React SPA |
| `web/` | React + TypeScript + Vite frontend |
| `data/` | SQLite databases, indexes, and runtime state |

---

## 3. The SQLite Database Schema

The database is the single source of truth. Understanding its schema is prerequisite to writing useful queries or jsverbs.

### 3.1 Core Tables

#### sources

```sql
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,          -- 'filesystem', 'sqlite-corpus', 'wordpress'
    config_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Every document belongs to a source. The `config_json` stores source-specific configuration (e.g., the crawl root directory for a filesystem source).

#### documents

```sql
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id),
    external_id TEXT,             -- ID in the upstream system
    title TEXT NOT NULL,
    author TEXT DEFAULT '',
    url TEXT DEFAULT '',
    content_type TEXT DEFAULT 'text',
    raw_content TEXT,             -- original HTML/markdown
    content_text TEXT,            -- cleaned text
    content_html TEXT,
    word_count INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    metadata_json TEXT DEFAULT '{}',
    status TEXT DEFAULT 'pending', -- 'pending', 'extracted', 'chunked', 'embedded', 'indexed'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

The `status` field drives the workflow: a document is ingested as `pending`, cleaned to `extracted`, chunked to `chunked`, embedded to `embedded`, and indexed to `indexed`.

#### chunks

```sql
CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    strategy_id TEXT NOT NULL REFERENCES chunking_strategies(id),
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    start_offset INTEGER DEFAULT 0,
    end_offset INTEGER DEFAULT 0,
    boundaries_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(document_id, strategy_id, chunk_index)
);
```

Chunks are scoped to a `strategy_id` and a `document_id`. The same document can have multiple chunk sets (e.g., `fixed-200-30` vs `fixed-1200-150`).

#### chunking_strategies

```sql
CREATE TABLE IF NOT EXISTS chunking_strategies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,          -- 'fixed', 'semantic', 'legacy'
    config_json TEXT NOT NULL DEFAULT '{}',
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

The `config_json` stores parameters like `{"chunk_size": 1200, "overlap": 150}`.

#### chunk_embeddings

```sql
CREATE TABLE IF NOT EXISTS chunk_embeddings (
    chunk_id TEXT NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
    strategy_id TEXT NOT NULL REFERENCES chunking_strategies(id),
    provider TEXT NOT NULL,      -- 'openai', 'local'
    model TEXT NOT NULL,
    dimensions INTEGER NOT NULL,
    text_hash TEXT NOT NULL,
    embedding BLOB NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (chunk_id, strategy_id, provider, model, dimensions)
);
```

Embeddings are keyed by `(chunk_id, strategy_id, provider, model, dimensions)` so the same chunk can have embeddings from multiple providers.

#### chunk_enrichments

```sql
CREATE TABLE IF NOT EXISTS chunk_enrichments (
    chunk_id TEXT NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
    strategy_id TEXT NOT NULL REFERENCES chunking_strategies(id),
    prompt_version TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    short_summary TEXT,
    long_summary TEXT,
    key_topics_json TEXT DEFAULT '[]',
    entities_json TEXT DEFAULT '[]',
    hypothetical_questions_json TEXT DEFAULT '[]',
    quality_score REAL,
    text_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (chunk_id, strategy_id, prompt_version)
);
```

Enrichments are LLM-generated metadata attached to chunks to improve retrieval quality.

#### document_processing_artifacts

```sql
CREATE TABLE IF NOT EXISTS document_processing_artifacts (
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    artifact_type TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    output_text TEXT,
    output_json TEXT DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'succeeded',
    error_code TEXT DEFAULT '',
    error_message TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (document_id, artifact_type, prompt_version, provider, model)
);
```

Artifacts hold the outputs of document-level LLM processing (e.g., title extraction, summarization, Q/A generation).

#### search_indexes

```sql
CREATE TABLE IF NOT EXISTS search_indexes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    strategy_id TEXT REFERENCES chunking_strategies(id),
    provider TEXT,
    model TEXT,
    dimensions INTEGER,
    index_type TEXT NOT NULL,    -- 'bm25', 'vector', 'hybrid'
    index_path TEXT NOT NULL,
    document_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    last_rebuild_at TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Search indexes are disposable: the system rebuilds them from the chunk/embedding tables when experiments change.

---

## 4. The Go Backend: Services and API

The Go backend is organized into `internal/services/`, with each package owning one domain concept. This is a thin service layer over the database.

### 4.1 Service Map

| Service | File | Purpose |
|---------|------|---------|
| Corpus | `internal/services/corpus/service.go` | High-level corpus operations |
| Document | `internal/services/document/service.go` | Document CRUD and status transitions |
| Chunking | `internal/services/chunking/service.go` | Apply chunking strategies to documents |
| Chunk Enrichment | `internal/services/chunkenrichment/service.go` | Run LLM enrichment over chunks |
| Embedding | `internal/services/embedding/service.go` | Compute and store embeddings |
| Search | `internal/services/search/service.go` | BM25, vector, and hybrid retrieval |
| Source | `internal/services/source/service.go` | Source CRUD and scanning |
| Document Processing | `internal/services/documentprocessing/service.go` | LLM artifact generation |

### 4.2 API Handlers

HTTP handlers live in `internal/api/`:

- `handlers.go`: General corpus endpoints (sources, documents, chunks).
- `workflow_artifact_handlers.go`: Workflow artifact upload/download endpoints.

The Go backend serves the React SPA from `internal/web/dist/` using `http.ServeMux` with Go 1.22 path patterns:

```go
mux.Handle("/api/...", apiHandlers)
mux.Handle("/", spaHandler) // serves index.html for all non-API routes
```

---

## 5. The React Frontend

The frontend is a Vite + React + TypeScript SPA located in `web/`.

- **Build**: `cd web && pnpm build` produces `internal/web/dist/`.
- **Dev**: `cd web && pnpm dev` runs the Vite dev server.
- **Embedding**: The Go binary embeds `internal/web/dist/` using `//go:embed dist` and serves it.

Key frontend technologies:
- React with hooks and a custom store (see `web/src/store/`).
- API client in `web/src/services/api.ts`.
- Component library in `web/src/components/`.

The frontend is not the focus of this scripting ticket, but it is important context: the JavaScript scripting layer (`rag-eval-js`) complements the web UI by providing batch query, export, and automation capabilities that would be tedious to do by hand in a browser.

---

## 6. The Scripting Layer: xgoja and jsverbs

### 6.1 What is xgoja?

`xgoja` (from the `go-go-goja` project) is a binary generator. You write an `xgoja.yaml` file that declares:

- Which Go module **packages** to import (e.g., `go-go-goja-core`, `go-go-goja-host`, `goja-text`).
- Which **modules** to expose in the JavaScript runtime (e.g., `db`, `fs`, `express`, `markdown`).
- Which **commands** the generated binary should have (e.g., `eval`, `run`, `repl`, `jsverbs`).
- Which **jsverb directories** to embed and register.

`xgoja build` reads this YAML, generates a temporary Go program, compiles it, and outputs a custom CLI binary. For `rag-eval`, this binary is called `rag-eval-js`.

### 6.2 The rag-eval xgoja.yaml

Located at `cmd/rag-eval/xgoja.yaml`:

```yaml
name: rag-eval-js
appName: rag-eval-js
envPrefix: RAG_EVAL_JS
# ...
target:
  kind: xgoja
  output: dist/rag-eval-js
packages:
  - id: go-go-goja-core
    import: github.com/go-go-golems/go-go-goja/pkg/xgoja/providers/core
    replace: ../../../go-go-goja
  - id: go-go-goja-host
    import: github.com/go-go-golems/go-go-goja/pkg/xgoja/providers/host
    replace: ../../../go-go-goja
  - id: go-go-goja-http
    import: github.com/go-go-golems/go-go-goja/pkg/xgoja/providers/http
    replace: ../../../go-go-goja
  - id: goja-text
    import: github.com/go-go-golems/goja-text/pkg/xgoja/providers/text
    replace: ../../../goja-text
  - id: geppetto
    import: github.com/go-go-golems/geppetto/pkg/js/modules/geppetto/provider
    replace: ../../../geppetto
runtimes:
  main:
    modules:
      - package: go-go-goja-core
        name: path
        as: path
      - package: go-go-goja-core
        name: yaml
        as: yaml
      - package: go-go-goja-host
        name: fs
        as: fs
        config:
          allow: true
      - package: go-go-goja-host
        name: db
        as: db
        config:
          allowConfigure: true
      - package: goja-text
        name: markdown
        as: markdown
      - package: goja-text
        name: sanitize
        as: sanitize
      - package: goja-text
        name: extract
        as: extract
      - package: go-go-goja-http
        name: express
        as: express
      - package: geppetto
        name: geppetto
        as: geppetto
        config:
          allowRegistryLoad: true
          allowNetwork: true
commands:
  eval:
    enabled: true
    runtime: main
  run:
    enabled: true
    runtime: main
  repl:
    enabled: true
    runtime: main
  jsverbs:
    enabled: true
    runtime: main
    name: verbs
    mount: root
jsverbs:
  - id: rag-eval-jsverbs
    path: ./jsverbs
    embed: true
help:
  sources:
    - id: goja-text-runtime-api
      package: goja-text
      source: runtime-api
```

**Key observations for an intern:**

- The `replace` fields point to local checkouts in the workspace. This is why the build works without publishing modules.
- `allowConfigure: true` on the `db` module means JavaScript can call `db.configure('sqlite3', path)` to pick a database.
- `allow: true` on `fs` means the JavaScript runtime has full filesystem access.
- `express` is available but requires `--http-enabled` (or the xgoja runtime starting with HTTP enabled) to actually open a listener.
- The `jsverbs` section points to `./jsverbs/`, meaning every `.js` file in that directory becomes a verb package.

### 6.3 Rebuilding rag-eval-js

After adding or modifying jsverbs, rebuild the binary:

```bash
cd cmd/rag-eval
xgoja build -f xgoja.yaml --output dist/rag-eval-js --xgoja-replace ../../../go-go-goja
```

This generates a Go build workspace in `/tmp/xgoja-build-*`, compiles it, and writes `dist/rag-eval-js`.

---

## 7. JavaScript Module APIs

The generated `rag-eval-js` runtime exposes the following native modules via `require(name)`:

### 7.1 db (database)

From `go-go-goja/modules/database/database.go`.

```js
const db = require("db");

db.configure("sqlite3", "data/rag-eval.db");   // open a SQLite database
db.query("SELECT * FROM sources WHERE id = ?", sourceId);  // rows as JS objects
db.exec("UPDATE documents SET status = ? WHERE id = ?", "chunked", docId);  // summary with rowsAffected, lastInsertId
db.close();  // close owned connection
```

- `query()` returns an array of plain objects. Column names become object keys.
- `exec()` returns `{ success, rowsAffected, lastInsertId }`.
- The db module is single-connection. Scripts that run multiple queries in one verb invocation share the same connection.
- Arguments to `query`/`exec` are flattened automatically. You can pass an array of args as a single argument or as variadic arguments.

### 7.2 fs (file system)

From `go-go-goja/modules/fs/fs.go`.

```js
const fs = require("fs");

const text = fs.readFileSync("file.txt", "utf-8");
fs.writeFileSync("out.json", JSON.stringify(data), "utf-8");
fs.mkdirSync("exports", { recursive: true });
const files = fs.readdirSync("data/");
const info = fs.statSync("data/rag-eval.db");
fs.existsSync("data/rag-eval.db");  // boolean
```

Async versions also exist (`readFile`, `writeFile`, `mkdir`, etc.) but in the verb context, sync is usually simpler because the verb invocation blocks until completion anyway.

Important: `fs.readFileSync` without encoding returns a `Buffer` (binary). With `"utf-8"` it returns a string.

### 7.3 express (HTTP server)

From `go-go-goja/modules/express/express.go`.

```js
const express = require("express");
const app = express.app();

app.get("/api/sources", (_req, res) => {
  const rows = db.query("SELECT id, name FROM sources");
  res.json({ sources: rows });
});
```

- `app.get(pattern, handler)`, `app.post(...)`, `app.put(...)`, `app.patch(...)`, `app.delete(...)`, `app.all(...)` register route handlers.
- `app.static(prefix, dir)` serves static files.
- The server only actually starts if the runtime is launched with HTTP enabled (`--http-enabled`, which defaults to `true` in verb mode, or `--http-listen` to set the address).
- For long-lived servers, use `rag-eval-js run script.js --keep-alive --http-listen 127.0.0.1:8788`.

### 7.4 markdown

From `goja-text/pkg/xgoja/providers/text/`.

```js
const markdown = require("markdown");

const ast = markdown.parse("# Title\n\nBody");
markdown.renderHTML("**strong**");
markdown.walk(ast, (node, ctx) => {
  console.log(ctx.Depth, node.Type);
});
const title = markdown.textContent(ast.Children[0]);
const result = markdown.validate(ast);
```

- Nodes are Go objects with PascalCase fields: `Type`, `Children`, `Level`, `Destination`, `Text`, etc.
- `walk` visitor return values: `undefined`/`true` = continue, `false`/`"skip"` = skip children, `"stop"` = stop traversal.

### 7.5 sanitize

From `goja-text/pkg/xgoja/providers/text/`.

```js
const sanitize = require("sanitize");

const y = sanitize.yaml.sanitize("name:Alice\n");
console.log(y.Sanitized);
console.log(y.Fixes.map((f) => f.Rule));

const j = sanitize.json.sanitize("{'ok': true}");
console.log(j.StrictParseClean);
```

Namespaces: `sanitize.yaml.*` and `sanitize.json.*`.

### 7.6 extract

From `goja-text/pkg/xgoja/providers/text/`.

```js
const extract = require("extract");

const candidates = extract.all(text);
const validated = candidates.map((c) => extract.validate(c));
```

Candidates expose `Kind`, `Format`, `Text`, `Confidence`, `StartByte`, `EndByte`, etc.

---

## 8. The jsverbs Pattern

A jsverb package is a JavaScript file in `cmd/rag-eval/jsverbs/` that follows this pattern:

```js
__package__({ name: "myPackage", short: "Description of the package" });

const db = require("db");

function myVerb(arg1, arg2) {
  // ... do work ...
  return resultObject;
}

__verb__("myVerb", {
  short: "Description of the verb",
  fields: {
    arg1: { argument: true, help: "First positional argument" },
    arg2: { type: "int", default: 10, help: "Optional flag" }
  }
});
```

### 8.1 Key Rules

1. `__package__()` declares the package name. It becomes the Cobra command group name (e.g., `database`, `explorer`, `capabilities`).
2. `__verb__("verbName", { ... })` registers a function as a CLI subcommand under the package.
3. `fields` in the verb descriptor define CLI flags and arguments. Supported types: `string`, `int`, `bool`, `float`, and arrays thereof.
4. `{ argument: true }` makes the field a positional argument.
5. The function name and the first argument to `__verb__` must match exactly.
6. Return values are automatically serialized by Glazed. You do not need to call `console.log` unless you want side-effect output.

### 8.2 Multiple Files

Every `.js` file in `jsverbs/` is a separate package. You can have:

- `database.js` — package `database`
- `capabilities.js` — package `capabilities`
- `explorer.js` — package `explorer`

They all share the same runtime and can require the same modules.

---

## 9. The New Explorer Verbs

This ticket adds `cmd/rag-eval/jsverbs/explorer.js`, a rich navigation and query package. Below is the API reference for each new verb.

### 9.1 `sources`

List all corpus sources.

```bash
rag-eval-js explorer sources --database data/rag-eval.db
```

Returns: `id`, `name`, `type`, `config_json`, `created_at`, `updated_at`.

### 9.2 `documents`

List documents with optional filtering.

```bash
rag-eval-js explorer documents --database data/rag-eval.db --sourceId ttc-dump-articles --status chunked --limit 20
```

Returns: document metadata plus `chunk_count` and `source_name`.

### 9.3 `docDetail`

Show full document detail including chunks, strategies, embeddings, and artifacts.

```bash
rag-eval-js explorer doc-detail --database data/rag-eval.db ttc-article-9838 --output json
```

Returns a nested object:

```json
{
  "document": { ... },
  "chunks": [ { "strategy_id", "chunk_index", "preview", ... } ],
  "strategies": [ { "strategy_id", "chunk_count", "total_tokens" } ],
  "embeddings": [ { "strategy_id", "provider", "model", "count" } ],
  "artifacts": [ { "artifact_type", "status", ... } ]
}
```

### 9.4 `chunkStrategies`

List all chunking strategies.

```bash
rag-eval-js explorer chunk-strategies --database data/rag-eval.db
```

### 9.5 `embeddingsCoverage`

Show embedding coverage grouped by source. Useful for checking whether all chunks in a strategy have been embedded.

```bash
rag-eval-js explorer embeddings-coverage --database data/rag-eval.db --strategyId fixed-1200-150
```

Returns: `source_id`, `source_name`, `chunk_count`, `embedded_count`.

### 9.6 `searchIndexes`

List all search indexes.

```bash
rag-eval-js explorer search-indexes --database data/rag-eval.db
```

### 9.7 `docArtifacts`

List document processing artifacts for a single document.

```bash
rag-eval-js explorer doc-artifacts --database data/rag-eval.db ttc-article-9838
```

### 9.8 `exportDocs`

Export documents matching filters to JSON files on disk.

```bash
rag-eval-js explorer export-docs --database data/rag-eval.db --sourceId ttc-dump-products --outDir exports
```

Writes one JSON file per document and a `manifest.json`. Uses `fs.writeFileSync`. The `outDir` is created with `fs.mkdirSync(..., { recursive: true })`.

### 9.9 `markdownStats`

Analyze Markdown structure of a document using the goja-text `markdown` module.

```bash
rag-eval-js explorer markdown-stats --database data/rag-eval.db ttc-article-9838
```

Returns:

```json
{
  "id": "ttc-article-9838",
  "storedTitle": "Cypress Trees - The Complete Guide",
  "extractedH1": "...",
  "headings": 12,
  "maxHeadingLevel": 3,
  "paragraphs": 45,
  "codeBlocks": 2,
  "links": 15,
  "images": 3,
  "totalChars": 61679,
  "totalLines": 619
}
```

### 9.10 `sanitizeProbe`

Probe the `sanitize` module.

```bash
rag-eval-js explorer sanitize-probe
```

Demonstrates both `sanitize.yaml.sanitize()` and `sanitize.json.sanitize()`.

### 9.11 `extractProbe`

Probe the `extract` module.

```bash
rag-eval-js explorer extract-probe
```

Demonstrates `extract.all()` on a sample containing Markdown code blocks and XML-like tags.

### 9.12 `serveDbBrowser`

Start an Express HTTP server that exposes key DB tables as JSON REST endpoints.

```bash
rag-eval-js explorer serve-db-browser --database data/rag-eval.db --port 8788
```

Because the verb itself does not block, this is best used inside a long-lived script:

```bash
rag-eval-js run jsverbs/explorer.js --keep-alive --http-listen 127.0.0.1:8788
```

Then in another terminal:

```bash
curl http://127.0.0.1:8788/api/sources
curl http://127.0.0.1:8788/api/documents
curl http://127.0.0.1:8788/api/documents/ttc-article-9838
```

---

## 10. How to Add a New Verb

### 10.1 Step-by-Step

1. **Edit or create a jsverb file** in `cmd/rag-eval/jsverbs/`. For example, `analytics.js`.

2. **Write the package header and require modules**:

```js
__package__({ name: "analytics", short: "RAG analytics verbs" });

const db = require("db");
```

3. **Write a function** that queries the database and returns structured data:

```js
function documentWordCountHistogram(database, bins) {
  openDatabase(database);
  const rows = db.query(`
    SELECT CAST(word_count / ? AS INTEGER) AS bin,
           COUNT(*) AS count,
           MIN(word_count) AS min_words,
           MAX(word_count) AS max_words
    FROM documents
    GROUP BY bin
    ORDER BY bin
  `, bins || 100);
  return rows;
}
```

4. **Register the verb** with `__verb__`:

```js
__verb__("documentWordCountHistogram", {
  short: "Histogram of document word counts",
  fields: {
    database: { type: "string", default: "data/rag-eval.db" },
    bins: { type: "int", default: 100, help: "Bin width in words" }
  }
});
```

5. **Rebuild**:

```bash
cd cmd/rag-eval
xgoja build -f xgoja.yaml --output dist/rag-eval-js --xgoja-replace ../../../go-go-goja
```

6. **Test**:

```bash
./dist/rag-eval-js analytics document-word-count-histogram --database ../../data/rag-eval.db
```

### 10.2 Common Patterns

#### Pattern: Reusable database opener

```js
const DEFAULT_DB = "data/rag-eval.db";
function openDatabase(database) {
  const path = database || DEFAULT_DB;
  db.configure("sqlite3", path);
  return path;
}
```

Always call this at the start of each verb that needs DB access. If multiple queries run in one verb, only call it once.

#### Pattern: Dynamic SQL with optional filters

```js
const conditions = [];
const args = [];
if (sourceId) { conditions.push("source_id = ?"); args.push(sourceId); }
if (status) { conditions.push("status = ?"); args.push(status); }
let sql = "SELECT * FROM documents";
if (conditions.length > 0) {
  sql += " WHERE " + conditions.join(" AND ");
}
sql += " ORDER BY created_at DESC LIMIT ?";
args.push(limit);
return db.query(sql, args);
```

#### Pattern: Using fs for export

```js
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(`${dir}/${id}.json`, JSON.stringify(doc, null, 2), "utf-8");
```

#### Pattern: Using markdown.walk for analysis

```js
const ast = markdown.parse(text);
let headings = 0;
markdown.walk(ast, (node) => {
  if (node.Type === "heading") headings++;
});
```

---

## 11. Testing and Validation

### 11.1 Quick Smoke Tests

After rebuilding, run these to verify the core paths:

```bash
# Database core verbs
./dist/rag-eval-js explorer sources --database ../../data/rag-eval.db
./dist/rag-eval-js explorer documents --database ../../data/rag-eval.db --limit 5
./dist/rag-eval-js explorer doc-detail --database ../../data/rag-eval.db ttc-article-9838 --output json | head -c 500

# Text processing verbs
./dist/rag-eval-js explorer markdown-stats --database ../../data/rag-eval.db ttc-article-9838
./dist/rag-eval-js explorer sanitize-probe
./dist/rag-eval-js explorer extract-probe

# Export verb
./dist/rag-eval-js explorer export-docs --database ../../data/rag-eval.db --sourceId ttc-dump-products --outDir /tmp/rag-eval-export
ls /tmp/rag-eval-export/manifest.json
```

### 11.2 Integration Testing with Express

```bash
# Start the server in one terminal
./dist/rag-eval-js run jsverbs/explorer.js --keep-alive --http-listen 127.0.0.1:8789

# In another terminal
curl -s http://127.0.0.1:8789/api/sources | jq '.sources | length'
curl -s http://127.0.0.1:8789/api/documents | jq '.documents[0].title'
```

---

## 12. Decision Records

### DR-001: Why xgoja instead of a Go-native query CLI?

**Context**: We needed a way to expose ad-hoc database queries and corpus navigation without writing Go code for every new question.

**Options**:
1. Write more Cobra subcommands in Go.
2. Use an embedded scripting runtime (xgoja).

**Decision**: Use xgoja with jsverbs.

**Rationale**: JavaScript is faster to write for data exploration. The `db` module gives full SQL power. The `fs` module lets scripts write exports. The `express` module lets us spin up REST APIs without modifying Go. Goja (the Go JS engine) is lightweight and integrates with Go's type system.

**Consequences**: We accept the tradeoff of debugging JS instead of Go for scripting tasks. Performance-critical paths should remain in Go.

### DR-002: Why SQLite for the primary store?

**Context**: The system must run locally without infrastructure.

**Decision**: SQLite with WAL mode and foreign keys.

**Rationale**: Single file, easy to backup, ACID, no server process. WAL mode allows readers to proceed during writes. Foreign keys maintain referential integrity across `documents → sources`, `chunks → documents`, `embeddings → chunks`.

### DR-003: Module exposure strategy

**Context**: The xgoja runtime can expose many modules.

**Decision**: Expose `db`, `fs`, `express`, `markdown`, `sanitize`, `extract`, `yaml`, `path`, and `geppetto`.

**Rationale**: These cover the three domains we need: data access (`db`), file I/O (`fs`), HTTP serving (`express`), and text processing (`markdown`, `sanitize`, `extract`). `yaml` is needed for config parsing. `geppetto` provides LLM prompt management if needed in scripts.

---

## 13. Risks and Open Questions

1. **Memory pressure on large exports**: `exportDocs` loads all matching documents into memory before writing. For very large corpora, streaming write would be preferable.
2. **HTTP port conflicts**: The default port `8787` may be in use. Scripts should allow `--port` override, which `serveDbBrowser` already does.
3. **Concurrency**: SQLite allows only one writer. Multiple `rag-eval-js` processes writing to the same DB will hit busy-timeout retries. The `db` module does not currently expose connection pooling options.
4. **Legacy strategy migration**: Old dev DBs may have the `legacy` strategy from the `ensureChunksStrategyID` migration. Queries that assume all chunks have meaningful strategy names should filter out `legacy` where appropriate.
5. **TypeScript declarations**: xgoja can generate `.d.ts` files for native modules. We should evaluate whether generating declarations for `db`, `fs`, and `express` improves the IDE experience for jsverb authors.

---

## 14. Key File Reference

| File | Why it matters |
|------|---------------|
| `cmd/rag-eval/xgoja.yaml` | Build spec for the scripting binary |
| `cmd/rag-eval/jsverbs/database.js` | Original database query verbs |
| `cmd/rag-eval/jsverbs/capabilities.js` | Module and express smoke-test verbs |
| `cmd/rag-eval/jsverbs/explorer.js` | **New** rich navigation and query verbs |
| `internal/db/db.go` | Schema migrations and `OpenDB` |
| `internal/db/queries.go` | Typed Go query helpers |
| `internal/db/search_queries.go` | Search-index and chunk-embedding queries |
| `go-go-goja/modules/database/database.go` | Native `db` module implementation |
| `go-go-goja/modules/fs/fs.go` | Native `fs` module implementation |
| `go-go-goja/modules/express/express.go` | Native `express` module implementation |
| `goja-text/pkg/xgoja/providers/text/text.go` | goja-text module registration |

---

## 15. Phased Implementation Plan

| Phase | Task | Files |
|-------|------|-------|
| 1 | Add `explorer.js` with sources, documents, docDetail, chunkStrategies | `cmd/rag-eval/jsverbs/explorer.js` |
| 2 | Add embeddingsCoverage, searchIndexes, docArtifacts | `cmd/rag-eval/jsverbs/explorer.js` |
| 3 | Add exportDocs using `fs` | `cmd/rag-eval/jsverbs/explorer.js` |
| 4 | Add markdownStats, sanitizeProbe, extractProbe using `goja-text` | `cmd/rag-eval/jsverbs/explorer.js` |
| 5 | Add serveDbBrowser using `express` | `cmd/rag-eval/jsverbs/explorer.js` |
| 6 | Rebuild binary and run smoke tests | `cmd/rag-eval/dist/rag-eval-js` |
| 7 | Write intern guide and update ticket docs | `ttmp/.../design-doc/01-...md` |

---

*End of intern guide.*
