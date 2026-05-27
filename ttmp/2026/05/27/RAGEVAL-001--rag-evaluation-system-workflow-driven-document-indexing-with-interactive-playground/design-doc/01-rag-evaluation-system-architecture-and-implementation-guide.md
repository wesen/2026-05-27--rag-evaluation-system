---
Title: ""
Ticket: ""
Status: ""
Topics: []
DocType: ""
Intent: ""
Owners: []
RelatedFiles:
    - Path: ../../../../../../../2026-05-20--book-ocr/README.md
      Note: Workflow-backed document processing precedent showing scraper integration pattern
    - Path: ../../../../../../../2026-05-21--readwise-viewer/ttmp/2026/05/21/RWVEC-001--readwise-viewer-embeddings-and-bleve-hybrid-search/design-doc/01-readwise-viewer-embeddings-and-bleve-hybrid-search-implementation-guide.md
      Note: Primary reference for Bleve hybrid search architecture and embedding integration patterns
    - Path: ../../../../../../../geppetto/pkg/cli/bootstrap/engine_settings.go
      Note: Profile resolution path reused from geppetto bootstrap
    - Path: ../../../../../../../geppetto/pkg/embeddings/disk-cache.go
      Note: Disk cache implementation reused for embedding caching
    - Path: ../../../../../../../geppetto/pkg/embeddings/embeddings.go
      Note: Provider interface reused for embedding computation
    - Path: ../../../../../../../geppetto/pkg/embeddings/settings_factory.go
      Note: SettingsFactory pattern for profile-driven provider construction
    - Path: ../../../../../../../scraper/pkg/engine/model/types.go
      Note: Core workflow/op type model reused from scraper
    - Path: ../../../../../../../scraper/pkg/engine/store/store.go
      Note: Store interface pattern for SQLite-backed persistence
ExternalSources: []
Summary: ""
LastUpdated: 0001-01-01T00:00:00Z
WhatFor: ""
WhenToUse: ""
---









# RAG Evaluation System — Architecture and Implementation Guide

## Executive Summary

This document describes the design and implementation plan for a **RAG Evaluation System**: a workflow-driven document processing pipeline coupled with an interactive web playground that lets you inspect, compare, and understand every stage of Retrieval-Augmented Generation — from raw document ingestion through embedding computation, similarity search, reranking, and structured data extraction.

The system has two major halves:

1. **A workflow engine** (built on `scraper`) that orchestrates multi-step document processing: scraping, text extraction, chunking, embedding computation, structured enrichment (summaries, entities, hypothetical questions), and index building.
2. **A RAG playground web UI** (React + RTK Query + Tailwind + Storybook, retro macOS style) that provides interactive "under the hood" visibility into each processing stage, lets you run queries against different search configurations, compare embedding similarities, experiment with reranking strategies, and visualize pipeline state.

The system consumes `geppetto` for LLM inference and embedding providers, `pinocchio` profile registries for model configuration, and the existing `scraper` engine for durable workflow execution.

This guide is written for a new intern who has not worked with RAG before. It explains every concept, every component, and every integration point with enough depth to start building.

---

## 1. What is RAG and Why Does It Need Evaluation?

### 1.1 The RAG Pipeline

Retrieval-Augmented Generation (RAG) is a pattern where an LLM's response is grounded in documents retrieved from a knowledge base, rather than relying solely on the model's parametric knowledge. The canonical pipeline looks like this:

```text
User Query
    |
    v
[Query Encoder] ──> query embedding vector
    |
    v
[Vector Similarity Search] ──> top-K candidate documents
    |                              |
    |                              v
    |                      [Optional Reranker]
    |                              |
    v                              v
[Context Assembly] <─── reranked top-N documents
    |
    v
[LLM Generation] with retrieved context
    |
    v
Answer
```

At each stage, things can go wrong:

- **Bad embeddings**: If your embedding model doesn't capture semantic similarity well, relevant documents won't be found.
- **Poor chunking**: If documents are split at wrong boundaries, the retrieved chunks may be incomplete or misleading.
- **Missing reranking**: A simple cosine-similarity top-K may surface irrelevant but high-similarity documents.
- **Stale index**: If the index isn't rebuilt when documents change, retrieval will return outdated content.
- **Wrong embedding model**: Different models (OpenAI `text-embedding-3-small` vs Ollama `nomic-embed-text` vs `all-minilm`) produce different similarity landscapes.

### 1.2 Why "Evaluation"?

The word "evaluation" in this project name means two things:

1. **Quantitative evaluation**: Compare retrieval quality across different configurations (embedding models, chunking strategies, reranking methods) using metrics like Recall@K, MRR, and nDCG.
2. **Qualitative exploration**: The playground lets you *see* what happens at each stage. You can inspect individual embedding vectors, compare similarity scores between pairs of documents, visualize which chunks were retrieved and why, and understand the ranking behavior of different reranking strategies.

This system is a workbench for understanding RAG, not just a production pipeline.

### 1.3 Key RAG Concepts for the Intern

Here are the foundational concepts you need to understand:

**Embeddings**: A function that maps a piece of text (a sentence, a paragraph, a document) to a fixed-length vector of floating-point numbers (e.g., 384, 768, 1536, or 3072 dimensions). Texts that are semantically similar will have vectors that are close together in vector space. The distance metric is typically **cosine similarity** (normalized dot product, ranging from -1 to 1, where 1 = identical direction).

**Chunking**: Long documents must be broken into smaller pieces ("chunks") before embedding, because embedding models have context-length limits and because a single vector for a long document "blurs" the topics. Common strategies: fixed-size token windows, sentence boundaries, paragraph boundaries, semantic splitting (breaking at topic shifts).

**Vector Index**: A data structure (typically an Approximate Nearest Neighbor or ANN index) that lets you quickly find the K vectors closest to a query vector. Common implementations: FAISS, HNSW, Bleve vector fields, Qdrant, Milvus, Pinecone.

**BM25 / Lexical Search**: A traditional keyword-based ranking algorithm that scores documents based on term frequency and inverse document frequency. It excels at exact keyword matching (library names, identifiers, proper nouns) but fails at semantic matching ("caching" ≠ "memoization" to BM25).

**Hybrid Search**: Combining BM25 (lexical) and vector (semantic) retrieval. The standard fusion method is **Reciprocal Rank Fusion (RRF)**, which combines rank positions rather than raw scores (which live on incompatible scales):

```text
RRF_score(d) = Σ 1 / (k + rank_i(d))
```

where `k` is typically 60 and `rank_i(d)` is the document's rank in retrieval method `i`.

**Reranking**: A second-pass scoring model that takes the top-K candidates from initial retrieval and re-scores them with a more powerful (but slower) cross-attention model. Unlike bi-encoder embeddings (which encode query and document independently), a cross-encoder sees both texts simultaneously and can model fine-grained interactions. Examples: Cohere Rerank, `bge-reranker-v2-m3`, Jina Reranker.

**Cosine Similarity**:

```text
cos_sim(A, B) = (A · B) / (||A|| × ||B||)
```

Range: [-1, 1]. In practice for normalized embedding vectors, this is just the dot product.

---

## 2. Current-State Architecture: The Existing Systems

This section maps the four existing repositories that the RAG Evaluation System will compose.

### 2.1 Scraper — Durable Workflow Engine

**Repository**: `./scraper/`
**Purpose**: Orchestrates durable, retryable, multi-step workflows backed by SQLite persistence.

The scraper engine models work as follows:

- A **WorkflowRun** is a top-level execution context. It has a status (`pending`, `running`, `succeeded`, `failed`, `canceled`) and metadata.
- An **OpSpec** is a single step within a workflow. Each op has a `Kind` (e.g., `js`, `http`), a `Queue` for concurrency/rate-limit control, dependencies on other ops, and a retry policy.
- A **Runner** executes an op. The current runners are `js` (executes JavaScript via Goja) and `http` (makes HTTP requests).
- A **Scheduler** polls for ready ops, leases them to workers, and handles completion/failure/retry.
- A **Site** is a named configuration (manifest directory) that defines verbs, scripts, SQL migrations, and queue policies.

Key files:

| File | Purpose |
|---|---|
| `pkg/engine/model/types.go` | Core types: `WorkflowRun`, `OpSpec`, `OpResult`, `RetryPolicy`, `QueuePolicy` |
| `pkg/engine/store/store.go` | Store interface: `CreateWorkflow`, `Enqueue`, `LeaseReadyOp`, `CompleteOp` |
| `pkg/engine/store/sqlite/` | SQLite implementation of the store |
| `pkg/engine/scheduler/scheduler.go` | Polling scheduler with observer pattern |
| `pkg/engine/runner/runner.go` | Runner interface and registry |
| `pkg/engine/runner/js.go` | Goja-based JavaScript runner |
| `pkg/engine/runner/http.go` | HTTP/fetch runner |
| `pkg/sites/manifest/manifest.go` | Site manifest loading (`site.yaml`) |
| `pkg/api/handlers/` | HTTP API handlers (submission, catalog, engine view) |
| `pkg/services/submission/` | Workflow submission service |
| `pkg/services/engineview/` | Read-only workflow status services |
| `web/` | React + MUI + RTK frontend for workflow monitoring |

The API surface:

```text
POST /api/v1/sites/{site}/verbs/{verb}:submit    # Submit a workflow
GET  /api/v1/sites/                                # List sites
GET  /api/v1/...                                    # Workflow/op status endpoints
```

Site manifests define the available verbs (submit commands) and their scripts:

```yaml
# sites/my-site/site.yaml
name: my-site
databaseFileName: my-site.db
scriptsRoot: scripts
verbsRoot: verbs
sqlMigrationsRoot: migrations
modules:
  - default-registry
```

JavaScript verbs define the workflow graph:

```javascript
// sites/my-site/verbs/seed.js
__verb__("seed", {
  short: "Submit the indexing workflow",
  fields: { sourceDir: { type: "string", help: "Directory to index" } }
});

function seed(ctx) {
  ctx.emit({
    id: ctx.workflow.id + ":crawl",
    kind: "js",
    queue: "site:my-site:js",
    input: { sourceDir: ctx.values.sourceDir }
  });
  return { data: { submitted: true } };
}
```

### 2.2 Geppetto — LLM Runtime Core

**Repository**: `./geppetto/`
**Purpose**: Provider-agnostic inference engine for LLM applications in Go.

Geppetto provides:

- **Inference engines**: OpenAI, Anthropic, Ollama, and others behind a common interface.
- **Embedding providers**: `OpenAIProvider` and `OllamaProvider` implementing the `Provider` interface:
  ```go
  type Provider interface {
      GenerateEmbedding(ctx context.Context, text string) ([]float32, error)
      GenerateBatchEmbeddings(ctx context.Context, texts []string) ([][]float32, error)
      GetModel() EmbeddingModel
  }
  ```
- **Profile registries**: Stackable, YAML/SQLite-backed configuration for model selection, API keys, and cache settings.
- **Caching**: Memory and disk-based embedding caches with LRU eviction.
- **Glazed integration**: CLI sections and flags for profile/registry/engine configuration.
- **JavaScript bindings**: `require("geppetto")` in Goja runtimes.

Key files:

| File | Purpose |
|---|---|
| `pkg/embeddings/embeddings.go` | `Provider` interface, `EmbeddingModel` type |
| `pkg/embeddings/openai.go` | OpenAI embedding provider implementation |
| `pkg/embeddings/ollama.go` | Ollama embedding provider implementation |
| `pkg/embeddings/settings_factory.go` | `SettingsFactory` — builds providers from Glazed/config |
| `pkg/embeddings/disk-cache.go` | Disk-based embedding cache with SHA-256 keys |
| `pkg/embeddings/batch.go` | Parallel batch embedding helper |
| `pkg/embeddings/config/settings.go` | `EmbeddingsConfig` with Glazed field tags |
| `pkg/engineprofiles/` | Profile registry, stack resolution, SQLite/YAML stores |
| `pkg/cli/bootstrap/` | App bootstrap config, profile resolution, engine settings |
| `pkg/turns/` | Conversation turn/block data model |
| `pkg/inference/` | Inference engine, tool loop, middleware, sessions |

The embedding provider construction path:

```go
// From profile resolution:
resolved, _ := geppettobootstrap.ResolveCLIEngineSettings(ctx, bootstrapConfig, parsed)
factory := embeddings.NewSettingsFactoryFromInferenceSettings(resolved.FinalInferenceSettings)
provider, _ := factory.NewProvider()
vector, _ := provider.GenerateEmbedding(ctx, text)
```

The disk cache stores embeddings as JSON files keyed by SHA-256 of the input text, with configurable max size and max entries.

### 2.3 Pinocchio — CLI LLM Tool with Profile Management

**Repository**: `./pinocchio/`
**Purpose**: Interactive and CLI-based LLM tool with unified config and profile management.

For this project, Pinocchio's primary value is its **profile registry system**. The RAG Evaluation System should use the same profile configuration that Pinocchio uses, so that embedding models and inference settings are consistent across tools.

A typical profile registry (`~/.config/pinocchio/profiles.yaml`):

```yaml
slug: workspace
profiles:
  ollama-nomic-embedding:
    slug: ollama-nomic-embedding
    display_name: Local Ollama nomic-embed-text
    inference_settings:
      api:
        base_urls:
          ollama-base-url: http://localhost:11434
      embeddings:
        type: ollama
        engine: nomic-embed-text
        dimensions: 768
        cache_type: file
        cache_directory: ./data/embeddings-cache

  openai-embedding-small:
    slug: openai-embedding-small
    display_name: OpenAI text-embedding-3-small
    inference_settings:
      api:
        api_keys:
          openai-api-key: ${OPENAI_API_KEY}
      embeddings:
        type: openai
        engine: text-embedding-3-small
        dimensions: 1536
        cache_type: file
        cache_directory: ./data/embeddings-cache
```

The profile selection precedence:

1. `--profile` CLI flag
2. `PINOCCHIO_PROFILE` environment variable
3. `profile.active` from unified config
4. Registry default profile

### 2.4 Book OCR — Workflow-Backed Document Processing Example

**Repository**: `./2026-05-20--book-ocr/`
**Purpose**: OCR application that demonstrates how to build a multi-step document processing workflow on top of the scraper engine.

Book OCR is the closest existing precedent to what we're building. Its pipeline:

```text
structured-run ──> discover-pages ──> [structured-page-001, ..., structured-page-N] ──> assemble-markdown ──> validate
```

Key lessons from Book OCR:

1. **Each page is an independent workflow op** that can run in parallel.
2. **Artifacts are persisted per-step** (raw response, structured JSON, rendered Markdown, validation).
3. **The Goja runtime is used for scripting** but heavy processing stays in Go.
4. **Geppetto profiles control which model is used** for inference.
5. **Workflow ops emit child ops** via `ctx.emit()` for fan-out patterns.
6. **Retries and targeted re-runs** are first-class operations.

### 2.5 Readwise Viewer — Embedding and Search Example

**Repository**: `./2026-05-21--readwise-viewer/`
**Purpose**: Document viewer with BM25 + vector hybrid search over Readwise Reader highlights.

This is the most directly relevant precedent. It already implements:

- SQLite as the canonical document store.
- Bleve-based BM25 full-text search.
- Geppetto profile-driven embedding computation.
- Embedding cache in SQLite (`document_embeddings` table).
- Vector index build path (`readwise-viewer index rebuild-vectors`).
- Hybrid search (BM25 + kNN with RRF fusion).
- Both CLI and HTTP API access to search.

Key code and patterns to reuse:

| Pattern | Source |
|---|---|
| `Embedder` interface (OpenAI + Ollama) | `geppetto/pkg/embeddings/` |
| Profile resolution through Glazed sections | `geppetto/pkg/cli/bootstrap/` |
| Disk-based embedding cache | `geppetto/pkg/embeddings/disk-cache.go` |
| SQLite embedding cache table | Readwise Viewer design doc (section 5.2) |
| Bleve text + vector mapping | Readwise Viewer design doc (sections 8.1-8.2) |
| Hybrid BM25 + kNN with RRF | Readwise Viewer design doc (sections 5, 9) |
| `SearchDocument` type | Readwise Viewer design doc (section 5.3) |
| Structured text for embeddings | Readwise Viewer design doc (section 6) |

---

## 3. Proposed Architecture

### 3.1 System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     RAG Evaluation System                          │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Go Backend Server                          │ │
│  │                                                               │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │ │
│  │  │  Workflow    │  │  Embedding   │  │  Search             │ │ │
│  │  │  Engine      │  │  Service     │  │  Service            │ │ │
│  │  │  (scraper)   │  │  (geppetto)  │  │  (bleve + custom)   │ │ │
│  │  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘ │ │
│  │         │                │                      │            │ │
│  │  ┌──────┴────────────────┴──────────────────────┴──────────┐ │ │
│  │  │                   SQLite Store                          │ │ │
│  │  │  documents | chunks | embeddings | enrichments | evals   │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                          │                                   │ │
│  │  ┌───────────────────────┴───────────────────────────────┐  │ │
│  │  │                  HTTP API (net/http)                   │  │ │
│  │  │  /api/v1/workflows/  /api/v1/documents/               │  │ │
│  │  │  /api/v1/embeddings/ /api/v1/search/                   │  │ │
│  │  │  /api/v1/eval/       /api/v1/playground/               │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌───────────────────────────┴───────────────────────────────────┐ │
│  │                   React Frontend (SPA)                       │ │
│  │                                                               │ │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐  │ │
│  │  │ Pipeline │ │ Embedding  │ │ Search   │ │ Evaluation   │  │ │
│  │  │ Explorer │ │ Inspector  │ │ Sandbox  │ │ Dashboard    │  │ │
│  │  └──────────┘ └────────────┘ └──────────┘ └──────────────┘  │ │
│  │                                                               │ │
│  │  RTK Query │ Tailwind CSS │ Storybook │ Retro macOS Theme   │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Responsibilities

| Component | Responsibility |
|---|---|
| **Workflow Engine** | Orchestrates document processing: ingest → extract → chunk → embed → enrich → index. Uses scraper's durable engine model. |
| **Embedding Service** | Wraps Geppetto's embedding providers. Manages embedding computation, caching, and comparison. Profile-aware. |
| **Search Service** | Manages Bleve indexes (BM25, vector, hybrid). Provides query APIs with explain/debug modes. |
| **Reranking Service** | Applies cross-encoder reranking to initial retrieval results. Supports multiple reranking strategies. |
| **Evaluation Service** | Runs benchmark queries against different configurations, computes metrics, stores results. |
| **SQLite Store** | Canonical document/chunk/embedding/enrichment storage. All derived indexes (Bleve) are disposable. |
| **HTTP API** | Serves the React frontend and CLI clients. Provides CRUD for all entities plus playground-specific debug endpoints. |
| **React Frontend** | Interactive playground UI. Pipeline explorer, embedding inspector, search sandbox, evaluation dashboard. |

### 3.3 Data Flow: Document Ingestion

```text
Document Source (file, URL, API)
    |
    v
[Scraper Workflow: ingest]
    |  Submit document metadata + raw content
    v
SQLite: documents(id, source, title, content, metadata, status)
    |
    v
[Scraper Workflow: extract]
    |  Clean HTML → plain text
    |  Detect language, structure
    v
SQLite: documents.content_text, documents.extraction_metadata
    |
    v
[Scraper Workflow: chunk]
    |  Split into overlapping token windows
    |  Or sentence/paragraph boundaries
    v
SQLite: chunks(id, document_id, index, text, token_count, boundaries)
    |
    v
[Scraper Workflow: embed]
    |  For each chunk: compute embedding vector
    |  Via Geppetto profile (OpenAI / Ollama)
    |  Cache in SQLite + Geppetto disk cache
    v
SQLite: chunk_embeddings(chunk_id, provider, model, dimensions, embedding_blob, text_hash)
    |
    v
[Scraper Workflow: enrich] (optional, parallel to embed)
    |  LLM-based enrichment: summary, entities,
    |  hypothetical questions, key topics
    v
SQLite: chunk_enrichments(chunk_id, prompt_version, summary, entities_json, hyp_questions_json)
    |
    v
[Scraper Workflow: index]
    |  Build Bleve index from chunks + embeddings
    |  Supports: text-only, vector, hybrid
    v
Bleve Index: data/rag-eval.bleve/
```

### 3.4 Data Flow: Query and Retrieval

```text
User Query (text)
    |
    v
[Embedding Service] ──> query vector (same model as document embeddings)
    |
    v
[Search Service]
    ├── BM25 search ──> ranked list A
    ├── kNN vector search ──> ranked list B
    └── Hybrid RRF fusion ──> combined ranked list C
    |
    v
[Reranking Service] (optional)
    |  Cross-encoder re-score top-K candidates
    v
Final ranked results
    |
    v
[Playground API] ──> Frontend renders with debug metadata
```

---

## 4. Data Model Design

### 4.1 Canonical SQLite Schema

SQLite is the single source of truth. All Bleve indexes are derived and disposable.

```sql
-- Sources: where documents come from
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'file', 'url', 'api', 'scraper-site'
    config_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Documents: the raw ingested content
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id),
    external_id TEXT,           -- ID in the source system (e.g., Readwise ID)
    title TEXT NOT NULL,
    author TEXT DEFAULT '',
    url TEXT DEFAULT '',
    content_type TEXT DEFAULT 'text',  -- 'text', 'html', 'markdown', 'pdf'
    raw_content TEXT,           -- Original content before extraction
    content_text TEXT,          -- Cleaned plain text after extraction
    content_html TEXT,          -- Original HTML if available
    word_count INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    metadata_json TEXT DEFAULT '{}',
    status TEXT DEFAULT 'pending',  -- 'pending', 'extracted', 'chunked', 'embedded', 'indexed', 'failed'
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Chunks: document segments for embedding
CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    start_offset INTEGER DEFAULT 0,    -- Character offset in content_text
    end_offset INTEGER DEFAULT 0,
    boundaries_json TEXT DEFAULT '{}',  -- Chunking metadata (boundary type, overlap, etc.)
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(document_id, chunk_index)
);

-- Chunking strategies: named configurations
CREATE TABLE IF NOT EXISTS chunking_strategies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'fixed', 'sentence', 'paragraph', 'semantic'
    config_json TEXT NOT NULL DEFAULT '{}',
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL
);

-- Embedding cache: one row per (chunk, provider, model, strategy)
CREATE TABLE IF NOT EXISTS chunk_embeddings (
    chunk_id TEXT NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
    strategy_id TEXT NOT NULL REFERENCES chunking_strategies(id),
    provider TEXT NOT NULL,          -- 'openai', 'ollama'
    model TEXT NOT NULL,             -- 'text-embedding-3-small', 'nomic-embed-text'
    dimensions INTEGER NOT NULL,
    text_hash TEXT NOT NULL,         -- SHA-256 of the input text; detects staleness
    embedding BLOB NOT NULL,         -- Little-endian float32 array
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (chunk_id, strategy_id, provider, model, dimensions)
);

-- LLM enrichments: structured data extracted by an LLM
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
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (chunk_id, strategy_id, prompt_version)
);

-- Search indexes: track which Bleve indexes exist
CREATE TABLE IF NOT EXISTS search_indexes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    strategy_id TEXT REFERENCES chunking_strategies(id),
    provider TEXT,
    model TEXT,
    dimensions INTEGER,
    index_type TEXT NOT NULL,     -- 'bm25', 'vector', 'hybrid'
    index_path TEXT NOT NULL,
    document_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    last_rebuild_at TEXT,
    status TEXT DEFAULT 'active',  -- 'active', 'stale', 'building'
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Evaluation queries: benchmark questions with relevance judgments
CREATE TABLE IF NOT EXISTS eval_queries (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    relevant_chunk_ids_json TEXT DEFAULT '[]',
    relevant_document_ids_json TEXT DEFAULT '[]',
    notes TEXT DEFAULT '',
    category TEXT DEFAULT 'general',
    created_at TEXT NOT NULL
);

-- Evaluation runs: one run = one (query_set, config) evaluation
CREATE TABLE IF NOT EXISTS eval_runs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    config_json TEXT NOT NULL,  -- Search config: index, mode, reranker, top_k, etc.
    status TEXT DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'
    started_at TEXT,
    finished_at TEXT,
    created_at TEXT NOT NULL
);

-- Evaluation results: per-query results within a run
CREATE TABLE IF NOT EXISTS eval_results (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
    query_id TEXT NOT NULL REFERENCES eval_queries(id),
    retrieved_chunk_ids_json TEXT NOT NULL,  -- Ordered list of retrieved chunk IDs
    scores_json TEXT NOT NULL,         -- Per-result scores: {chunk_id: {bm25_rank, vector_rank, rrf_score, rerank_score}}
    recall_at_k REAL DEFAULT 0,
    mrr REAL DEFAULT 0,
    ndcg_at_k REAL DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);
```

### 4.2 Key Design Decisions

**Why chunks, not documents?** The fundamental unit of retrieval in a RAG system is a *chunk*, not a whole document. A document might be 50 pages long; a chunk is typically 256-1024 tokens. The embedding represents the chunk's meaning, and retrieval returns chunks (or collapsed documents). Storing chunks as first-class entities allows us to:

- Compare different chunking strategies on the same documents.
- Inspect individual chunk embeddings in the playground.
- Track which chunk was retrieved and why.

**Why `strategy_id` everywhere?** We want to compare different configurations: the same document chunked differently, embedded with different models, indexed with different methods. The `strategy_id` key lets us store all variants side-by-side and compare them in the evaluation dashboard.

**Why `text_hash`?** When a document's content changes, its chunk text changes, so its embedding is stale. The `text_hash` detects this without recomputing the embedding. This is the same pattern used in the Readwise Viewer design.

**Why embedding BLOB instead of a separate vector DB?** For a RAG evaluation system with thousands (not millions) of documents, SQLite BLOBs are simple, portable, and fast enough. The Bleve index provides the ANN search structure. SQLite stores the ground truth. This keeps the operational surface area small.

### 4.3 Float32 Vector Encoding

Store and retrieve embedding vectors as little-endian `float32` byte arrays:

```go
func MarshalFloat32Vector(v []float32) []byte {
    buf := new(bytes.Buffer)
    for _, x := range v {
        _ = binary.Write(buf, binary.LittleEndian, x)
    }
    return buf.Bytes()
}

func UnmarshalFloat32Vector(b []byte) ([]float32, error) {
    if len(b)%4 != 0 {
        return nil, fmt.Errorf("bad vector byte length %d", len(b))
    }
    out := make([]float32, len(b)/4)
    err := binary.Read(bytes.NewReader(b), binary.LittleEndian, out)
    return out, err
}
```

### 4.4 Bleve Search Document

```go
type SearchDocument struct {
    ID            string    `json:"id"`
    DocumentID    string    `json:"document_id"`
    ChunkIndex    int       `json:"chunk_index"`
    Title         string    `json:"title"`
    Author        string    `json:"author"`
    Source        string    `json:"source"`
    SourceURL     string    `json:"source_url"`
    ChunkText     string    `json:"chunk_text"`
    SearchText    string    `json:"search_text"`    // Structured text for embedding
    Tags          []string  `json:"tags"`
    TokenCount    int       `json:"token_count"`
    CreatedAt     string    `json:"created_at"`
    Embedding     []float32 `json:"embedding,omitempty"`
    // Enrichment fields (optional)
    ShortSummary      string   `json:"short_summary,omitempty"`
    KeyTopics         []string `json:"key_topics,omitempty"`
    HypotheticalQs    []string `json:"hypothetical_questions,omitempty"`
}
```

`SearchText` is the structured representation used for embedding:

```text
Title: <title>
Author: <author>
Source: <source>
Tags: <tag1>, <tag2>
Summary: <short_summary if available>
Content:
<chunk_text>
```

---

## 5. Workflow Design

### 5.1 Workflow Graph

The RAG indexing pipeline is a scraper workflow. Each step is a durable op with dependencies.

```text
[ingest-submit]
    |
    v
[ingest-N] ── (one per document, parallel)
    |
    v
[extract-N] ── (depends on ingest-N)
    |
    v
[chunk-N] ── (depends on extract-N)
    |
    ├── [embed-N] ── (depends on chunk-N, calls Geppetto)
    └── [enrich-N] ── (depends on chunk-N, calls Geppetto LLM, optional)
    |
    v
[index-build] ── (depends on all embed-N, builds Bleve index)
    |
    v
[index-validate] ── (depends on index-build, sanity checks)
```

### 5.2 Site Manifest

```yaml
# sites/rag-eval/site.yaml
name: rag-eval
databaseFileName: rag-eval.db
scriptsRoot: scripts
verbsRoot: verbs
sqlMigrationsRoot: migrations
modules:
  - default-registry
  - geppetto

queuePolicies:
  - queue: "site:rag-eval:embed"
    maxInFlight: 4
    rateLimit:
      kind: token_bucket
      ratePerSecond: 2
      burst: 10
  - queue: "site:rag-eval:enrich"
    maxInFlight: 2
    rateLimit:
      kind: token_bucket
      ratePerSecond: 1
      burst: 5
```

### 5.3 Verb Definitions

The submit verb triggers the pipeline:

```javascript
// sites/rag-eval/verbs/index-source.js
doc(`Submit a document indexing workflow for a source directory or URL.`);

__verb__("index-source", {
  short: "Index documents from a source",
  fields: {
    source_path: {
      type: "string",
      help: "Path to directory or URL to index",
      required: true
    },
    source_type: {
      type: "string",
      help: "Source type: file, url, readwise",
      default: "file"
    },
    chunking_strategy: {
      type: "string",
      help: "Chunking strategy: fixed-256, fixed-512, sentence, paragraph",
      default: "fixed-512"
    },
    embedding_profile: {
      type: "string",
      help: "Geppetto profile slug for embeddings",
      default: "ollama-nomic-embedding"
    },
    skip_enrichment: {
      type: "bool",
      help: "Skip LLM enrichment step",
      default: true
    }
  }
});

function indexSource(ctx) {
  const values = ctx.values || {};
  const runID = String(ctx.workflow.id);
  const sourcePath = values.source_path;
  const sourceType = values.source_type;
  const chunkStrategy = values.chunking_strategy;

  // Step 1: Discover documents (emit one op per file)
  const discoverID = runID + ":discover";
  ctx.emit({
    id: discoverID,
    kind: "js",
    queue: "site:rag-eval:js",
    input: {
      source_path: sourcePath,
      source_type: sourceType
    }
  });

  // The discover script will emit per-document ingest ops,
  // which will cascade through extract → chunk → embed → index

  ctx.setTargetOpID(runID + ":index-build");

  return {
    data: {
      runID: runID,
      sourcePath: sourcePath,
      chunkStrategy: chunkStrategy
    }
  };
}
```

### 5.4 Processing Scripts

Each processing step is a JavaScript script executed by the Goja runtime, calling into Go host APIs for heavy lifting (database access, embedding computation, file I/O).

**Discover script** (`scripts/discover.js`):

```javascript
function discover(ctx) {
  const input = ctx.input;
  const files = ctx.listFiles(input.source_path);

  for (const file of files) {
    ctx.emit({
      id: ctx.op.workflowID + ":ingest:" + file.path,
      kind: "js",
      queue: "site:rag-eval:js",
      input: {
        file_path: file.path,
        source_type: input.source_type
      }
    });
  }

  return {
    data: { discoveredCount: files.length }
  };
}
```

**Ingest script** (`scripts/ingest.js`):

```javascript
function ingest(ctx) {
  const input = ctx.input;
  const content = ctx.readFile(input.file_path);
  const docId = ctx.generateID();

  // Store document in SQLite
  ctx.db.insert("documents", {
    id: docId,
    source_id: ctx.workflow.metadata.source_id,
    title: ctx.extractTitle(content, input.file_path),
    raw_content: content,
    content_type: ctx.detectContentType(content),
    status: "pending"
  });

  // Emit extraction step
  ctx.emit({
    id: ctx.op.id + ":extract",
    kind: "js",
    queue: "site:rag-eval:js",
    input: { document_id: docId }
  });

  return { data: { document_id: docId } };
}
```

**Embed script** (`scripts/embed.js`):

This script calls the Geppetto embedding host API:

```javascript
function embed(ctx) {
  const input = ctx.input;
  const chunks = ctx.db.query(
    "SELECT id, text FROM chunks WHERE document_id = ? AND strategy_id = ?",
    [input.document_id, input.strategy_id]
  );

  const profile = ctx.workflow.metadata.embedding_profile;
  const results = [];

  for (const chunk of chunks) {
    // Check cache first
    const cached = ctx.db.query(
      "SELECT embedding FROM chunk_embeddings WHERE chunk_id = ? AND text_hash = ?",
      [chunk.id, ctx.hash(chunk.text)]
    );

    if (cached.length > 0) {
      results.push({ chunk_id: chunk.id, cached: true });
      continue;
    }

    // Call Geppetto embedding API
    const vector = ctx.embed(chunk.text, { profile: profile });
    ctx.db.insert("chunk_embeddings", {
      chunk_id: chunk.id,
      strategy_id: input.strategy_id,
      provider: vector.provider,
      model: vector.model,
      dimensions: vector.dimensions,
      text_hash: ctx.hash(chunk.text),
      embedding: vector.bytes  // Little-endian float32 blob
    });
    results.push({ chunk_id: chunk.id, dimensions: vector.dimensions });
  }

  return { data: { embedded_count: results.length } };
}
```

### 5.5 Go Host APIs for JS Runtime

The scraper JS runtime needs new host APIs for the RAG workflow:

```go
// In pkg/js/runtime/executor.go or a new pkg/js/runtime/rag_host.go

// EmbedHostAPI provides ctx.embed() and ctx.embedBatch() to JavaScript
type EmbedHostAPI struct {
    embeddingService *EmbeddingService
}

func (api *EmbedHostAPI) Embed(text string, opts map[string]interface{}) (map[string]interface{}, error) {
    profileSlug, _ := opts["profile"].(string)
    provider, err := api.embeddingService.GetProvider(profileSlug)
    if err != nil {
        return nil, err
    }
    vector, err := provider.GenerateEmbedding(context.Background(), text)
    if err != nil {
        return nil, err
    }
    return map[string]interface{}{
        "vector":     vector,
        "provider":   provider.GetModel().Name,
        "model":      provider.GetModel().Name,
        "dimensions": len(vector),
    }, nil
}
```

---

## 6. Search Service Design

### 6.1 Bleve Index Mapping

**Text-only mapping** (builds without `-tags vectors`):

```go
func NewTextMapping() *mapping.IndexMappingImpl {
    idx := bleve.NewIndexMapping()
    doc := bleve.NewDocumentMapping()

    text := bleve.NewTextFieldMapping()
    text.Store = true

    keyword := bleve.NewKeywordFieldMapping()
    keyword.Store = true

    // Text fields for BM25
    doc.AddFieldMappingsAt("title", text)
    doc.AddFieldMappingsAt("author", text)
    doc.AddFieldMappingsAt("chunk_text", text)
    doc.AddFieldMappingsAt("search_text", text)
    doc.AddFieldMappingsAt("short_summary", text)

    // Keyword fields for filtering
    doc.AddFieldMappingsAt("id", keyword)
    doc.AddFieldMappingsAt("document_id", keyword)
    doc.AddFieldMappingsAt("source", keyword)
    doc.AddFieldMappingsAt("tags", keyword)

    idx.DefaultMapping = doc
    return idx
}
```

**Vector mapping** (requires `-tags vectors`):

```go
//go:build vectors

func NewVectorMapping(dims int) *mapping.IndexMappingImpl {
    idx := NewTextMapping()

    vector := bleve.NewVectorFieldMapping()
    vector.Dims = dims
    vector.Similarity = index.CosineSimilarity
    vector.VectorIndexOptimizedFor = index.IndexOptimizedForRecall

    idx.DefaultMapping.AddFieldMappingsAt("embedding", vector)
    return idx
}
```

### 6.2 Search Modes

```go
type SearchMode string

const (
    SearchModeBM25    SearchMode = "bm25"
    SearchModeVector  SearchMode = "vector"
    SearchModeHybrid  SearchMode = "hybrid"
)

type SearchRequest struct {
    Query      string
    Mode       SearchMode
    IndexName   string    // Which Bleve index to query
    Limit      int
    Offset     int
    Explain    bool       // Include score breakdown
    Rerank     bool       // Apply cross-encoder reranking
    RerankTopK int        // How many candidates to rerank
    Filters    SearchFilters
}

type SearchFilters struct {
    Source string
    Tags   []string
}

type SearchResult struct {
    ChunkID      string
    DocumentID   string
    DocumentTitle string
    ChunkText    string
    ChunkIndex   int
    Score        float64
    Mode         SearchMode
    Signals      RankSignals
    Highlights   map[string][]string
}

type RankSignals struct {
    BM25Rank      int     `json:"bm25_rank,omitempty"`
    VectorRank   int     `json:"vector_rank,omitempty"`
    RRFScore     float64 `json:"rrf_score,omitempty"`
    BM25Score    float64 `json:"bm25_score,omitempty"`
    VectorScore  float64 `json:"vector_score,omitempty"`
    RerankScore  float64 `json:"rerank_score,omitempty"`
    FinalRank    int     `json:"final_rank"`
}
```

### 6.3 Hybrid Search Implementation

```go
func (s *SearchService) HybridSearch(ctx context.Context, req SearchRequest) ([]SearchResult, error) {
    // 1. Compute query embedding
    provider, err := s.embeddingService.GetProviderForIndex(req.IndexName)
    if err != nil {
        return nil, err
    }
    queryVector, err := provider.GenerateEmbedding(ctx, req.Query)
    if err != nil {
        return nil, err
    }

    // 2. Build Bleve hybrid query
    textQuery := bleve.NewMatchQuery(req.Query)
    textQuery.SetField("search_text")

    filterQuery := s.buildFilterQuery(req.Filters)

    var root query.Query = textQuery
    if filterQuery != nil {
        root = bleve.NewConjunctionQuery(textQuery, filterQuery)
    }

    searchReq := bleve.NewSearchRequest(root)
    searchReq.Size = req.Limit

    // Add kNN vector search
    searchReq.AddKNNWithFilter("embedding", queryVector, req.Limit*2, 1.0, filterQuery)
    searchReq.Score = bleve.ScoreRRF  // Use RRF fusion

    // 3. Execute search
    searchResult, err := s.index.Search(searchReq)
    if err != nil {
        return nil, err
    }

    // 4. Convert results
    results := s.hydrateResults(ctx, searchResult.Hits, req)

    // 5. Optional reranking
    if req.Rerank {
        results, err = s.reranker.Rerank(ctx, req.Query, results, req.RerankTopK)
        if err != nil {
            // Log but don't fail — fall back to RRF results
            log.Warn().Err(err).Msg("reranking failed, returning RRF results")
        }
    }

    return results, nil
}
```

### 6.4 Reranking Service

The reranking service applies a second-pass model to the top-K candidates. Two strategies:

**Cohere Rerank API** (cloud-based, high quality):

```go
type CohereReranker struct {
    apiKey     string
    model      string  // "rerank-v3.5" or "rerank-english-v3.0"
    httpClient *http.Client
}

func (r *CohereReranker) Rerank(ctx context.Context, query string, candidates []SearchResult, topK int) ([]SearchResult, error) {
    // Build request to Cohere rerank API
    documents := make([]string, len(candidates))
    for i, c := range candidates {
        documents[i] = c.ChunkText
    }

    reqBody := map[string]interface{}{
        "query":     query,
        "documents": documents,
        "top_n":     topK,
        "model":     r.model,
    }

    // ... HTTP call to Cohere API ...
    // Parse response, re-order candidates, set RerankScore
}
```

**Cross-encoder via Geppetto** (local, uses any LLM with a scoring prompt):

```go
type LLMScoreReranker struct {
    engine  inference.Engine
    prompt  string
}

func (r *LLMScoreReranker) Rerank(ctx context.Context, query string, candidates []SearchResult, topK int) ([]SearchResult, error) {
    // For each candidate, ask the LLM to score relevance
    for i := range candidates {
        score, err := r.scoreRelevance(ctx, query, candidates[i].ChunkText)
        if err != nil {
            candidates[i].Signals.RerankScore = 0
            continue
        }
        candidates[i].Signals.RerankScore = score
    }

    // Sort by rerank score
    sort.Slice(candidates, func(i, j int) bool {
        return candidates[i].Signals.RerankScore > candidates[j].Signals.RerankScore
    })

    return candidates[:min(topK, len(candidates))], nil
}
```

---

## 7. HTTP API Design

### 7.1 API Surface

All API endpoints use the standard `net/http` `ServeMux` (Go 1.22+ pattern matching). The Go backend serves both the API and the embedded React SPA.

```text
# Document & Source Management
GET    /api/v1/sources                        # List sources
POST   /api/v1/sources                        # Create source
GET    /api/v1/sources/{id}                    # Get source details
GET    /api/v1/documents                       # List documents with filters
GET    /api/v1/documents/{id}                  # Get document with chunks
GET    /api/v1/documents/{id}/chunks           # List chunks for a document

# Workflow Management
POST   /api/v1/workflows/submit                # Submit an indexing workflow
GET    /api/v1/workflows/{id}                  # Get workflow status
GET    /api/v1/workflows/{id}/ops              # List workflow ops

# Embedding Playground
POST   /api/v1/embeddings/compute              # Compute embedding for a text
POST   /api/v1/embeddings/similarity           # Compare two texts' embeddings
GET    /api/v1/embeddings/models               # List available embedding models
POST   /api/v1/embeddings/nearest              # Find nearest neighbors for a vector

# Search
POST   /api/v1/search                          # Search (BM25, vector, hybrid)
GET    /api/v1/search/explain                  # Debug search for a query

# Reranking
POST   /api/v1/rerank                          # Rerank a list of (query, documents)
GET    /api/v1/rerank/models                   # List available reranking models

# Evaluation
GET    /api/v1/eval/queries                    # List evaluation queries
POST   /api/v1/eval/queries                    # Create evaluation query
POST   /api/v1/eval/run                        # Start an evaluation run
GET    /api/v1/eval/runs                       # List evaluation runs
GET    /api/v1/eval/runs/{id}                  # Get evaluation run results
GET    /api/v1/eval/compare                    # Compare multiple runs

# Index Management
GET    /api/v1/indexes                         # List search indexes
POST   /api/v1/indexes/rebuild                 # Rebuild an index
GET    /api/v1/indexes/{id}/stats              # Get index statistics

# Profile/Config
GET    /api/v1/profiles                         # List available Geppetto profiles
GET    /api/v1/profiles/{slug}                  # Get profile details
```

### 7.2 Key API Contracts

**Search request/response:**

```json
// POST /api/v1/search
// Request:
{
  "query": "how does cosine similarity work",
  "mode": "hybrid",
  "index_name": "default-hybrid",
  "limit": 10,
  "explain": true,
  "rerank": true,
  "rerank_top_k": 20,
  "filters": {
    "source": "wikipedia",
    "tags": ["math", "linear-algebra"]
  }
}

// Response:
{
  "results": [
    {
      "chunk_id": "ch-abc123",
      "document_id": "doc-456",
      "document_title": "Vector Space Models",
      "chunk_text": "Cosine similarity measures the cosine of the angle...",
      "chunk_index": 3,
      "score": 0.0327,
      "mode": "hybrid/rrf+rerank",
      "signals": {
        "bm25_rank": 5,
        "vector_rank": 1,
        "rrf_score": 0.0327,
        "rerank_score": 0.94,
        "final_rank": 1
      },
      "highlights": {
        "chunk_text": ["Cosine <mark>similarity</mark> measures the..."]
      }
    }
  ],
  "meta": {
    "total": 10,
    "latency_ms": 145,
    "index_name": "default-hybrid",
    "embedding_model": "nomic-embed-text",
    "reranker_model": "cohere-rerank-v3.5"
  }
}
```

**Embedding similarity request/response:**

```json
// POST /api/v1/embeddings/similarity
// Request:
{
  "texts": ["machine learning", "artificial intelligence", "baking bread"],
  "profile": "ollama-nomic-embedding",
  "metric": "cosine"
}

// Response:
{
  "embeddings": [
    { "text": "machine learning", "dimensions": 768, "sample": [0.12, -0.34, ...] },
    { "text": "artificial intelligence", "dimensions": 768, "sample": [0.11, -0.32, ...] },
    { "text": "baking bread", "dimensions": 768, "sample": [-0.45, 0.67, ...] }
  ],
  "similarities": {
    "0-1": 0.94,
    "0-2": 0.12,
    "1-2": 0.08
  },
  "model": "nomic-embed-text",
  "metric": "cosine"
}
```

**Evaluation comparison:**

```json
// GET /api/v1/eval/compare?runs=run-1,run-2,run-3
// Response:
{
  "runs": [
    {
      "run_id": "run-1",
      "name": "BM25 only",
      "config": { "mode": "bm25", "index": "bm25-only" },
      "avg_recall_at_10": 0.42,
      "avg_mrr": 0.55,
      "avg_ndcg_at_10": 0.48
    },
    {
      "run_id": "run-2",
      "name": "Vector only (nomic-768)",
      "config": { "mode": "vector", "index": "vector-nomic", "profile": "ollama-nomic-embedding" },
      "avg_recall_at_10": 0.61,
      "avg_mrr": 0.68,
      "avg_ndcg_at_10": 0.63
    },
    {
      "run_id": "run-3",
      "name": "Hybrid RRF + Cohere rerank",
      "config": { "mode": "hybrid", "index": "hybrid-nomic", "rerank": true, "reranker": "cohere" },
      "avg_recall_at_10": 0.78,
      "avg_mrr": 0.82,
      "avg_ndcg_at_10": 0.79
    }
  ]
}
```

---

## 8. Frontend Design

### 8.1 Technology Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| RTK Query | API client + caching + state management |
| Tailwind CSS | Styling (retro macOS theme) |
| Storybook | Component development and documentation |
| Vite | Build tool |
| TypeScript | Type safety |
| Recharts | Charts (evaluation metrics, similarity heatmaps) |

### 8.2 Retro macOS Design Language

The UI should evoke classic Mac OS (System 1-7 era) with a modern twist:

- **Window chrome**: Classic title bars with horizontal stripes, close/zoom/shade boxes
- **Typography**: Chicago-like monospace for system text, Geneva-like for body
- **Colors**: Classic Mac platinum gray (#DDDDDD), window white, dark borders
- **Icons**: Black-and-white 16x16 or 32x32 pixel icons
- **Buttons**: Classic 3D beveled button style
- **Scroll bars**: Thick, with up/down arrows at both ends
- **Patterns**: Classic dithering patterns for backgrounds
- **Menu bar**: Fixed top menu bar (like classic Mac)
- **Dialog boxes**: Classic alert style with icon

CSS custom properties for theming:

```css
:root {
  /* Classic Mac Colors */
  --mac-platinum: #DDDDDD;
  --mac-window-white: #EEEEEE;
  --mac-border-dark: #000000;
  --mac-border-light: #FFFFFF;
  --mac-highlight: #000000;
  --mac-text: #000000;
  --mac-text-bg: #FFFFFF;
  --mac-button-face: #CCCCCC;
  --mac-button-highlight: #FFFFFF;
  --mac-button-shadow: #808080;
  --mac-accent: #0000CC;  /* Classic blue selection */
  
  /* Typography */
  --font-system: 'Chicago', 'Geneva', 'Monaco', monospace;
  --font-body: 'Geneva', 'Helvetica Neue', sans-serif;
  --font-mono: 'Monaco', 'Courier', monospace;

  /* Spacing */
  --mac-border-width: 1px;
  --mac-window-padding: 4px;
}
```

### 8.3 Page/View Structure

The playground has four main views:

```text
┌──────────────────────────────────────────────────────────┐
│ ◉ ◉ ◉  RAG Evaluation System   File  Edit  View  Help  │
├──────────────────────────────────────────────────────────┤
│  [Pipeline]  [Embeddings]  [Search]  [Evaluation]       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  (Active view content)                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 8.4 Pipeline Explorer View

Shows the document processing pipeline state:

```text
┌─ Pipeline Explorer ──────────────────────────────────────┐
│                                                           │
│  Sources:                                                 │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ 📁 /data/wiki   │  │ 🌐 readwise-api │               │
│  │ 234 documents    │  │ 89 documents    │               │
│  │ status: indexed  │  │ status: pending │               │
│  └─────────────────┘  └─────────────────┘               │
│                                                           │
│  Workflow: index-wiki-001                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ● discover ──> ○ ingest ──> ○ extract ──> ...     │  │
│  │   (done)       (3/5)                                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  Recent Documents:                                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Vector Space Models       │ 12 chunks │ embedded    │  │
│  │ Attention Is All You Need │ 8 chunks  │ indexed     │  │
│  │ Baking Sourdough Bread   │ 6 chunks  │ pending     │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

Components:

- `SourceList`: Cards showing configured sources with document counts and status
- `WorkflowTimeline`: Visual workflow graph showing op statuses
- `DocumentTable`: Filterable table of documents with chunk counts and statuses
- `WorkflowSubmitForm`: Form to submit a new indexing workflow

### 8.5 Embedding Inspector View

Interactive exploration of embedding space:

```text
┌─ Embedding Inspector ────────────────────────────────────┐
│                                                           │
│  Model: [nomic-embed-text ▼]  Profile: [ollama-local ▼] │
│                                                           │
│  ┌─ Similarity Matrix ──────────┐  ┌─ Pair Compare ───┐ │
│  │     T1    T2    T3    T4      │  │                   │ │
│  │ T1  1.00  0.94  0.12  0.08    │  │ Text A:           │ │
│  │ T2  0.94  1.00  0.15  0.11    │  │ "machine learning"│ │
│  │ T3  0.12  0.15  1.00  0.89    │  │                   │ │
│  │ T4  0.08  0.11  0.89  1.00    │  │ Text B:           │ │
│  └───────────────────────────────┘  │ "AI techniques"   │ │
│                                     │                   │ │
│  ┌─ Embedding Dimensions ─────┐    │ Similarity: 0.94  │ │
│  │ Dim  Value                  │    │ Model: nomic-768  │ │
│  │ 0    0.0234                 │    └───────────────────┘ │
│  │ 1    -0.1234                │                          │
│  │ 2    0.5678                 │  ┌─ Nearest Neighbors ─┐│
│  │ ...                        │  │ Query: "embedding"   ││
│  │ 767  0.0091                 │  │ 1. "vector search"  ││
│  └─────────────────────────────┘  │    sim: 0.87         ││
│                                     │ 2. "cosine sim"     ││
│  ┌─ Model Comparison ──────────┐   │    sim: 0.85        ││
│  │ Model            │ Avg Sim  │   │ 3. "neural retrieval"││
│  │ nomic-768        │ 0.45     │   │    sim: 0.82        ││
│  │ all-minilm-384   │ 0.38     │   └────────────────────┘│
│  │ openai-3s-1536   │ 0.52     │                          │
│  └─────────────────────────────┘                          │
└───────────────────────────────────────────────────────────┘
```

Components:

- `SimilarityHeatmap`: Color-coded matrix showing pairwise cosine similarities
- `PairwiseCompare`: Compare two texts with their embedding similarity
- `EmbeddingDimensionsTable`: Show actual vector values for a text
- `NearestNeighborSearch`: Query for nearest chunks by embedding
- `ModelComparisonTable`: Compare average similarity metrics across models

### 8.6 Search Sandbox View

Run queries and inspect every step:

```text
┌─ Search Sandbox ─────────────────────────────────────────┐
│                                                           │
│  Query: [how does attention work in transformers_______] │
│  Mode: [hybrid ▼]  Index: [default-hybrid ▼]            │
│  Rerank: [✓]  Reranker: [cohere-rerank ▼]               │
│  [🔍 Search]                                              │
│                                                           │
│  Results (10 found, 145ms):                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 1. Attention Is All You Need                       │  │
│  │    Chunk 3/8 │ Score: 0.0327 (RRF) → 0.94 (rerank)│  │
│  │    BM25 rank: 5 │ Vector rank: 1                    │  │
│  │    "...the attention mechanism computes <mark>...  │  │
│  │    [View chunk] [View embedding] [Compare]         │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ 2. Transformer Architecture Explained              │  │
│  │    Chunk 1/5 │ Score: 0.0289 (RRF) → 0.88 (rerank)│  │
│  │    BM25 rank: 2 │ Vector rank: 4                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  Score Distribution:                                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  BM25 ████████████░░░  Vector ██████████░░░░░      │  │
│  │  RRF  ██████████████░  Rerank ████████████████      │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

Components:

- `SearchQueryBar`: Input with mode/index/rerank selectors
- `SearchResultList`: Expandable result cards with score breakdowns
- `ScoreDistributionChart`: Bar chart comparing BM25/vector/RRF/rerank scores
- `ChunkViewer`: Modal showing full chunk text with highlights
- `RerankComparison`: Side-by-side pre/post reranking order

### 8.7 Evaluation Dashboard View

Compare configurations quantitatively:

```text
┌─ Evaluation Dashboard ───────────────────────────────────┐
│                                                           │
│  Query Set: [default-20 ▼]  [▶ Run All]  [+ New Query]  │
│                                                           │
│  ┌─ Metric Comparison ─────────────────────────────────┐ │
│  │                                                      │ │
│  │  Recall@10  ████████████████████░░░░  0.78 (hybrid) │ │
│  │             ██████████████░░░░░░░░░░░  0.61 (vector) │ │
│  │             ████████░░░░░░░░░░░░░░░░  0.42 (bm25)  │ │
│  │                                                      │ │
│  │  MRR        ████████████████████████░  0.82 (hybrid) │ │
│  │             █████████████░░░░░░░░░░░░░  0.68 (vector) │ │
│  │             ███████████░░░░░░░░░░░░░░░  0.55 (bm25)  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─ Per-Query Detail ──────────────────────────────────┐ │
│  │ Query                    │ BM25 │ Vector │ Hybrid    │ │
│  │ "cosine similarity"      │  ✓   │  ✓     │  ✓       │ │
│  │ "local first databases"  │  ✗   │  ✓     │  ✓       │ │
│  │ "sqlite fts5"            │  ✓   │  ✗     │  ✓       │ │
│  │ "bleve vector search"     │  ✗   │  ✓     │  ✓       │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

Components:

- `MetricBarChart`: Grouped bars comparing metrics across configurations
- `PerQueryDetailTable`: Per-query pass/fail matrix
- `EvaluationRunForm`: Configure and start an evaluation run
- `QueryEditor`: Add/edit evaluation queries with relevance judgments

### 8.5 RTK Query API Slice

```typescript
// src/services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ragApi = createApi({
  reducerPath: 'ragApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Sources', 'Documents', 'Chunks', 'Workflows', 'Indexes', 'EvalQueries', 'EvalRuns'],
  endpoints: (builder) => ({
    // Sources
    listSources: builder.query<Source[], void>({
      query: () => 'sources',
      providesTags: ['Sources'],
    }),
    createSource: builder.mutation<Source, CreateSourceRequest>({
      query: (body) => ({ url: 'sources', method: 'POST', body }),
      invalidates: ['Sources'],
    }),

    // Documents
    listDocuments: builder.query<PaginatedResponse<Document>, DocumentFilters>({
      query: (filters) => ({ url: 'documents', params: filters }),
      providesTags: ['Documents'],
    }),
    getDocument: builder.query<Document, string>({
      query: (id) => `documents/${id}`,
    }),
    getDocumentChunks: builder.query<Chunk[], string>({
      query: (docId) => `documents/${docId}/chunks`,
    }),

    // Search
    search: builder.mutation<SearchResponse, SearchRequest>({
      query: (body) => ({ url: 'search', method: 'POST', body }),
    }),

    // Embeddings
    computeEmbedding: builder.mutation<EmbeddingResponse, EmbeddingRequest>({
      query: (body) => ({ url: 'embeddings/compute', method: 'POST', body }),
    }),
    computeSimilarity: builder.mutation<SimilarityResponse, SimilarityRequest>({
      query: (body) => ({ url: 'embeddings/similarity', method: 'POST', body }),
    }),
    findNearest: builder.mutation<NearestNeighborResponse, NearestNeighborRequest>({
      query: (body) => ({ url: 'embeddings/nearest', method: 'POST', body }),
    }),

    // Evaluation
    listEvalQueries: builder.query<EvalQuery[], void>({
      query: () => 'eval/queries',
      providesTags: ['EvalQueries'],
    }),
    createEvalQuery: builder.mutation<EvalQuery, CreateEvalQueryRequest>({
      query: (body) => ({ url: 'eval/queries', method: 'POST', body }),
      invalidates: ['EvalQueries'],
    }),
    startEvalRun: builder.mutation<EvalRun, StartEvalRunRequest>({
      query: (body) => ({ url: 'eval/run', method: 'POST', body }),
      invalidates: ['EvalRuns'],
    }),
    compareEvalRuns: builder.query<ComparisonResult, string[]>({
      query: (runIds) => ({ url: 'eval/compare', params: { runs: runIds.join(',') } }),
    }),

    // Profiles
    listProfiles: builder.query<Profile[], void>({
      query: () => 'profiles',
    }),
  }),
});
```

### 8.6 Storybook Structure

```text
src/components/
├── pipeline/
│   ├── SourceList.stories.tsx
│   ├── WorkflowTimeline.stories.tsx
│   ├── DocumentTable.stories.tsx
│   └── WorkflowSubmitForm.stories.tsx
├── embeddings/
│   ├── SimilarityHeatmap.stories.tsx
│   ├── PairwiseCompare.stories.tsx
│   ├── EmbeddingDimensionsTable.stories.tsx
│   ├── NearestNeighborSearch.stories.tsx
│   └── ModelComparisonTable.stories.tsx
├── search/
│   ├── SearchQueryBar.stories.tsx
│   ├── SearchResultList.stories.tsx
│   ├── SearchResultCard.stories.tsx
│   ├── ScoreDistributionChart.stories.tsx
│   ├── ChunkViewer.stories.tsx
│   └── RerankComparison.stories.tsx
├── evaluation/
│   ├── MetricBarChart.stories.tsx
│   ├── PerQueryDetailTable.stories.tsx
│   ├── EvaluationRunForm.stories.tsx
│   └── QueryEditor.stories.tsx
├── layout/
│   ├── AppShell.stories.tsx
│   ├── MacWindow.stories.tsx
│   ├── MacMenuBar.stories.tsx
│   └── TabBar.stories.tsx
└── retro/
    ├── MacButton.stories.tsx
    ├── MacCheckbox.stories.tsx
    ├── MacSelect.stories.tsx
    ├── MacInput.stories.tsx
    ├── MacDialog.stories.tsx
    └── MacScrollbar.stories.tsx
```

---

## 9. Go Backend Architecture

### 9.1 Package Layout

```text
cmd/rag-eval/              CLI entrypoint
internal/
  config/                  App config, bootstrap
  db/                      SQLite access layer
  pipeline/                Workflow definitions (scraper integration)
  embedding/               Embedding service (wraps geppetto)
  search/                  Search service (wraps bleve)
  rerank/                  Reranking service
  eval/                    Evaluation service
  api/                     HTTP handlers
  profile/                 Profile bootstrap (geppetto integration)
pkg/                       Public packages (if any)
web/                       Embedded React SPA (go:embed)
```

### 9.2 Server Bootstrap

The Go server uses `net/http` with Go 1.22+ pattern matching. No third-party HTTP framework.

```go
func main() {
    ctx := context.Background()

    // 1. Open SQLite
    db, err := db.OpenDB(cfg.DBPath)
    if err != nil {
        log.Fatal().Err(err).Msg("failed to open database")
    }
    defer db.Close()

    // 2. Initialize services
    embeddingService := embedding.NewService(profileConfig)
    searchService := search.NewService(bleveIndexPath, embeddingService)
    rerankService := rerank.NewService(embeddingService)
    evalService := eval.NewService(db, searchService)

    // 3. Wire HTTP handlers
    mux := http.NewServeMux()

    // API routes
    mux.HandleFunc("GET /api/v1/sources", api.HandleListSources(db))
    mux.HandleFunc("POST /api/v1/sources", api.HandleCreateSource(db))
    mux.HandleFunc("GET /api/v1/documents", api.HandleListDocuments(db))
    mux.HandleFunc("GET /api/v1/documents/{id}", api.HandleGetDocument(db))
    mux.HandleFunc("POST /api/v1/search", api.HandleSearch(searchService, rerankService))
    mux.HandleFunc("POST /api/v1/embeddings/compute", api.HandleComputeEmbedding(embeddingService))
    mux.HandleFunc("POST /api/v1/embeddings/similarity", api.HandleComputeSimilarity(embeddingService))
    mux.HandleFunc("POST /api/v1/rerank", api.HandleRerank(rerankService))
    mux.HandleFunc("POST /api/v1/eval/run", api.HandleStartEvalRun(evalService))
    mux.HandleFunc("GET /api/v1/eval/compare", api.HandleCompareRuns(evalService))
    mux.HandleFunc("GET /api/v1/profiles", api.HandleListProfiles(profileConfig))

    // Static files (embedded React SPA)
    mux.Handle("/", web.SPAHandler())

    // 4. Start server
    server := &http.Server{
        Addr:    cfg.Address,
        Handler: mux,
    }
    log.Info().Str("addr", cfg.Address).Msg("starting server")
    log.Fatal().Err(server.ListenAndServe()).Msg("server stopped")
}
```

### 9.3 SPA Embedding

The React build output is embedded into the Go binary using `go:embed`:

```go
// web/embed.go
//go:embed dist/*
//go:embed dist/assets/*
var webFS embed.FS

func SPAHandler() http.Handler {
    fileServer := http.FileServer(http.FS(webFS))
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Try to serve the exact file
        path := "dist" + r.URL.Path
        if _, err := webFS.Open(path); err == nil {
            fileServer.ServeHTTP(w, r)
            return
        }
        // Fallback to index.html for SPA routing
        r.URL.Path = "/"
        fileServer.ServeHTTP(w, r)
    })
}
```

Build the frontend:

```bash
cd web && pnpm build  # outputs to web/dist/
```

Then build the Go binary with the embedded SPA:

```bash
go build -o rag-eval ./cmd/rag-eval
```

---

## 10. Evaluation Metrics

### 10.1 Core Metrics

**Recall@K**: What fraction of known-relevant documents appear in the top K results?

```text
Recall@K = |relevant ∩ retrieved_top_K| / |relevant|
```

Range: [0, 1]. Higher is better. Measures coverage.

**Mean Reciprocal Rank (MRR)**: How high is the first relevant document, averaged over queries?

```text
MRR = (1/Q) × Σ (1 / rank_of_first_relevant_for_query_q)
```

Range: [0, 1]. Higher is better. Measures how quickly a relevant result appears.

**Normalized Discounted Cumulative Gain (nDCG@K)**: Supports graded relevance (e.g., "highly relevant" vs "marginally relevant").

```text
DCG@K  = Σ (2^rel_i - 1) / log2(i + 1)    for i = 1..K
IDCG@K = DCG of the ideal ranking
nDCG@K = DCG@K / IDCG@K
```

Range: [0, 1]. Higher is better. Measures ranking quality with graded judgments.

### 10.2 Evaluation Workflow

1. Create a query set (10-20 queries covering different retrieval challenges):
   - Exact keyword queries ("sqlite fts5")
   - Semantic/conceptual queries ("local first databases")
   - Mixed queries ("embedding similarity for search")
   - Edge cases ("bleve vs elasticsearch")

2. For each query, label the relevant chunk IDs (manual curation).

3. For each configuration to test:
   - Run all queries.
   - Record retrieved chunk IDs and scores.
   - Compute Recall@10, MRR, nDCG@10.

4. Compare configurations side-by-side.

### 10.3 Expected Outcomes

Based on the Readwise Viewer experience:

| Configuration | Strengths | Weaknesses |
|---|---|---|
| BM25 only | Exact keyword matches (library names, IDs) | Fails on paraphrases, synonyms |
| Vector only | Semantic matching, conceptual queries | Fails on exact identifiers, rare terms |
| Hybrid RRF | Best of both worlds | Slightly more complex |
| Hybrid + Rerank | Best quality | Highest latency and cost |

---

## 11. Reranking Deep Dive

### 11.1 Why Reranking Matters

Initial retrieval (BM25 and/or vector search) uses **bi-encoder** models: the query and document are encoded independently, then compared by cosine similarity. This is fast but approximate — it cannot model fine-grained interactions between query and document tokens.

A **cross-encoder** (reranker) takes both the query and a candidate document as a single input and produces a relevance score. It can model token-level interactions:

```text
Bi-encoder:
  query → encoder → Q_vec ─┐
                            ├→ cosine_sim(Q_vec, D_vec)
  doc   → encoder → D_vec ─┘

Cross-encoder:
  [query; document] → cross-encoder → relevance_score
```

The cross-encoder is slower (O(K) model calls for K candidates) but much more accurate for ranking.

### 11.2 Reranking Strategies

**1. Cohere Rerank API** (recommended for cloud usage):
- Fast, high-quality, supports multiple languages.
- API: `POST https://api.cohere.com/v1/rerank`
- Models: `rerank-v3.5` (multilingual), `rerank-english-v3.0`
- Returns relevance scores for each document.

**2. Jina Reranker** (local or API):
- Open-source cross-encoder model.
- Can run locally via Ollama or Hugging Face Transformers.
- Good balance of quality and speed.

**3. LLM-as-Judge** (flexible but expensive):
- Use any LLM (via Geppetto) to score query-document pairs.
- Prompt: "On a scale of 0-10, how relevant is this document to the query?"
- Allows custom relevance criteria.
- Slowest option, but most flexible.

**4. No reranking** (baseline):
- Use the RRF-fused results directly.
- This is the control group for evaluation.

### 11.3 Reranking in the Playground

The playground should make reranking observable:

- Show the pre-rerank order and the post-rerank order side-by-side.
- Show the rerank score for each candidate.
- Highlight documents that moved up or down significantly.
- Allow swapping reranking strategies and comparing.

---

## 12. Embedding Similarity Deep Dive

### 12.1 Understanding Embedding Space

An embedding model maps text to a vector in a high-dimensional space. The key insight is:

- **Semantically similar texts → vectors close together** (high cosine similarity, near 1.0)
- **Semantically unrelated texts → vectors far apart** (low cosine similarity, near 0.0)
- **Opposite meaning texts → vectors in opposite directions** (negative cosine similarity, near -1.0, though this is rare with modern models)

### 12.2 What to Explore in the Playground

The Embedding Inspector should let you answer these questions:

1. **Same meaning, different words**: How similar is "machine learning" to "artificial intelligence"? To "neural networks"? (Expected: 0.7-0.95)

2. **Different meaning, similar domain**: How similar is "gradient descent" to "backpropagation"? (Expected: moderate, 0.5-0.8)

3. **Different domains entirely**: How similar is "gradient descent" to "baking sourdough"? (Expected: low, 0.0-0.3)

4. **Same text, different models**: Compare nomic-768, all-minilm-384, and text-embedding-3-small-1536. Do they agree on which texts are similar? Do higher-dimensional models capture nuance better?

5. **Asymmetric similarity**: Some models (like BGE) use asymmetric encoding — passages get a `passage:` prefix and queries get a `query:` prefix. Does this affect similarity scores?

6. **Chunking impact**: How does chunk size affect embedding quality? A 256-token chunk vs a 1024-token chunk of the same document — do they produce similar vectors?

### 12.3 Visualization Ideas

- **Similarity heatmap**: A matrix showing pairwise cosine similarities between a set of texts. Color-coded: green = high similarity, red = low.
- **t-SNE / UMAP projection**: Project high-dimensional vectors to 2D for visual clustering.
- **Dimension importance**: Which dimensions contribute most to similarity? Show the top-N dimensions by absolute value difference.
- **Token attribution**: For a given text, which tokens most influence the embedding direction?

---

## 13. Implementation Plan

### Phase 0: Project Scaffolding (Day 1-2)

**Goal**: Working Go server + React app skeleton with `go:embed` SPA serving.

Implementation steps:

1. Create `cmd/rag-eval/main.go` with a minimal HTTP server.
2. Create `web/` with React + Vite + Tailwind + RTK Query boilerplate.
3. Implement `go:embed` SPA serving.
4. Add a single test API endpoint: `GET /api/v1/health`.
5. Verify the frontend can call the health endpoint and display the result.
6. Add a MacWindow component in Storybook.

```bash
# Project structure
cmd/rag-eval/main.go
internal/config/config.go
internal/db/db.go
web/src/App.tsx
web/src/services/api.ts
web/src/components/layout/MacWindow.tsx
web/src/components/layout/MacWindow.stories.tsx
```

### Phase 1: SQLite Schema and Document Ingestion (Day 3-5)

**Goal**: Store documents in SQLite, list them via API, display in frontend.

Implementation steps:

1. Implement the `sources` and `documents` table schemas.
2. Add `GET /api/v1/sources` and `POST /api/v1/sources`.
3. Add `GET /api/v1/documents` with pagination and filters.
4. Implement file-based document ingestion (read files from a directory).
5. Display documents in the Pipeline Explorer view.

### Phase 2: Chunking (Day 6-8)

**Goal**: Split documents into chunks, store in SQLite, display per-document chunk views.

Implementation steps:

1. Implement `chunks` table and `chunking_strategies` table.
2. Add fixed-size chunking (256, 512, 1024 tokens) with overlap.
3. Add sentence-based chunking (using simple regex or NLP sentence splitting).
4. Add `GET /api/v1/documents/{id}/chunks`.
5. Display chunks in the Pipeline Explorer document detail view.

### Phase 3: Embedding Computation (Day 9-12)

**Goal**: Compute embeddings via Geppetto profiles, cache in SQLite, expose in playground.

Implementation steps:

1. Add `geppetto` as a Go dependency.
2. Implement `internal/profile/bootstrap.go` for profile resolution.
3. Implement `internal/embedding/service.go` wrapping Geppetto providers.
4. Add `POST /api/v1/embeddings/compute` and `POST /api/v1/embeddings/similarity`.
5. Add `chunk_embeddings` table and cache logic.
6. Implement the Embedding Inspector view with:
   - Pairwise similarity comparison
   - Model comparison
7. Wire profile selection in the UI.

### Phase 4: Search (Day 13-17)

**Goal**: BM25 and hybrid search with Bleve, observable in the playground.

Implementation steps:

1. Implement Bleve text-only mapping and index building.
2. Add `POST /api/v1/search` with `mode=bm25`.
3. Implement `search_indexes` tracking.
4. Add vector mapping behind `-tags vectors`.
5. Implement vector search and hybrid RRF search.
6. Add `mode=vector` and `mode=hybrid` to the search API.
7. Implement the Search Sandbox view with:
   - Query bar with mode/index selectors
   - Result list with score breakdowns
   - Score distribution chart

### Phase 5: Reranking (Day 18-20)

**Goal**: Cross-encoder reranking as an optional post-retrieval step.

Implementation steps:

1. Implement `internal/rerank/service.go` with a provider interface.
2. Add Cohere Rerank provider (API-based).
3. Add LLM-as-Judge provider (Geppetto-based).
4. Add `POST /api/v1/rerank` endpoint.
5. Wire reranking into the search flow as an optional step.
6. Add RerankComparison component in the Search Sandbox.

### Phase 6: Workflow Integration (Day 21-25)

**Goal**: Use scraper's workflow engine for durable document processing.

Implementation steps:

1. Create `sites/rag-eval/` site manifest with verbs and scripts.
2. Implement the ingest → extract → chunk → embed pipeline as workflow ops.
3. Wire workflow submission through `POST /api/v1/workflows/submit`.
4. Display workflow status in the Pipeline Explorer.
5. Add devctl commands for local development.

### Phase 7: Evaluation (Day 26-30)

**Goal**: Quantitative comparison of search configurations.

Implementation steps:

1. Implement `eval_queries`, `eval_runs`, `eval_results` tables.
2. Add evaluation endpoints (`POST /api/v1/eval/run`, `GET /api/v1/eval/compare`).
3. Create a default query set with 15-20 benchmark queries.
4. Implement Recall@K, MRR, nDCG@K computation.
5. Build the Evaluation Dashboard view.
6. Run evaluations comparing: BM25, vector-only, hybrid, hybrid+rerank.

---

## 14. Key Files Reference

### 14.1 Existing Files to Study

| File | What to Learn |
|---|---|
| `scraper/pkg/engine/model/types.go` | Workflow/Op/Result type model |
| `scraper/pkg/engine/store/store.go` | Store interface pattern |
| `scraper/pkg/engine/scheduler/scheduler.go` | Scheduler/observer pattern |
| `scraper/pkg/engine/runner/js.go` | Goja JS runner with host APIs |
| `scraper/sites/jsdemo/verbs/seed.js` | Verb definition pattern |
| `scraper/sites/jsdemo/scripts/seed.js` | Script execution pattern |
| `scraper/pkg/api/handlers/submission.go` | HTTP handler pattern |
| `scraper/web/package.json` | Frontend tech stack (React + RTK + MUI + Storybook) |
| `geppetto/pkg/embeddings/embeddings.go` | `Provider` interface |
| `geppetto/pkg/embeddings/openai.go` | OpenAI embedding provider |
| `geppetto/pkg/embeddings/ollama.go` | Ollama embedding provider |
| `geppetto/pkg/embeddings/settings_factory.go` | Factory from config/profiles |
| `geppetto/pkg/embeddings/disk-cache.go` | Disk-based embedding cache |
| `geppetto/pkg/embeddings/config/settings.go` | Glazed sections for embeddings |
| `geppetto/pkg/cli/bootstrap/engine_settings.go` | Profile resolution path |
| `geppetto/pkg/engineprofiles/registry.go` | Profile registry |
| `2026-05-21--readwise-viewer/ttmp/.../design-doc/01-...md` | Complete hybrid search implementation guide |
| `2026-05-20--book-ocr/README.md` | Workflow-backed document processing example |

### 14.2 New Files to Create

| File | Purpose |
|---|---|
| `cmd/rag-eval/main.go` | CLI entrypoint and server bootstrap |
| `internal/config/config.go` | App configuration |
| `internal/db/db.go` | SQLite database access layer |
| `internal/db/migrations.go` | Schema migrations |
| `internal/embedding/service.go` | Embedding computation and caching |
| `internal/search/service.go` | Bleve search service |
| `internal/search/mapping.go` | Bleve index mappings |
| `internal/search/hybrid.go` | Hybrid search with RRF |
| `internal/rerank/service.go` | Reranking service |
| `internal/rerank/cohere.go` | Cohere rerank provider |
| `internal/rerank/llm_judge.go` | LLM-as-judge provider |
| `internal/eval/service.go` | Evaluation service |
| `internal/eval/metrics.go` | Recall, MRR, nDCG computation |
| `internal/api/handlers.go` | HTTP API handlers |
| `internal/profile/bootstrap.go` | Geppetto profile bootstrap |
| `web/src/App.tsx` | React app entry |
| `web/src/services/api.ts` | RTK Query API slice |
| `web/src/components/pipeline/` | Pipeline Explorer components |
| `web/src/components/embeddings/` | Embedding Inspector components |
| `web/src/components/search/` | Search Sandbox components |
| `web/src/components/evaluation/` | Evaluation Dashboard components |
| `web/src/components/retro/` | Retro macOS design components |

---

## 15. Risks and Open Questions

### 15.1 Risks

| Risk | Mitigation |
|---|---|
| Bleve vector dependencies (FAISS, ONNX) are fragile to set up | Keep vector code behind `-tags vectors`; make text-only path fully functional |
| Embedding API costs can be significant for large document sets | Use Ollama local models by default; cache aggressively; add `--dry-run` flags |
| Cross-encoder reranking is slow for large K | Default to small K (20-50); show latency in UI; offer async mode |
| SQLite write contention with concurrent workflow workers | WAL mode; reasonable connection pool; serialize writes if needed |
| Retro macOS theme may be unfamiliar for some developers | Start with standard Tailwind components, add retro chrome as a theme layer |

### 15.2 Open Questions

1. **Chunk overlap strategy**: Fixed overlap (e.g., 50 tokens) or semantic overlap (re-sentence-boundary)? Start simple.
2. **Streaming search results**: Should the search API stream results as they arrive from different backends? Nice for UX but adds API complexity.
3. **Multi-modal embeddings**: Should we support image embeddings (CLIP, etc.)? Not in v1, but design the provider interface to allow it.
4. **Scraper workflow vs simpler approach**: Should we use the full scraper workflow engine or a simpler task queue? The scraper engine gives us durability and retries, which are valuable for embedding computation (which can fail due to API limits). Use scraper from the start.
5. **Re-ranking model hosting**: Should we host a local cross-encoder model (via Ollama or ONNX) or rely on cloud APIs only? Start with Cohere API + Geppetto LLM-as-judge; add local cross-encoder later if needed.

---

## 16. Alternatives Considered

### 16.1 Vector Database Instead of SQLite+Bleve

**Considered**: Using Qdrant, Milvus, or Pinecone for vector storage and search.

**Rejected because**: These add significant operational complexity (separate service, Docker, API keys). For an evaluation system with thousands of documents (not millions), SQLite + Bleve is sufficient, portable, and keeps the operational surface area small. We can always add a Qdrant adapter later if scale demands it.

### 16.2 Separate Microservices

**Considered**: Separate Go services for embedding, search, and evaluation.

**Rejected because**: A single Go binary with embedded SPA is simpler to develop, deploy, and reason about. The services communicate via Go function calls, not network. The scraper workflow engine handles background processing.

### 16.3 Elasticsearch Instead of Bleve

**Considered**: Using Elasticsearch for both BM25 and vector search.

**Rejected because**: Elasticsearch requires a JVM, significant memory, and a separate service. Bleve is a pure-Go library that can be embedded directly. The Readwise Viewer project has already validated Bleve + FAISS for hybrid search.

### 16.4 Python Backend

**Considered**: Using Python (FastAPI + LangChain/LlamaIndex) for the backend.

**Rejected because**: The existing ecosystem is in Go (scraper, geppetto, pinocchio). Using Go keeps the dependency surface consistent and allows direct reuse of scraper's workflow engine and geppetto's embedding providers.

---

## 17. Testing Strategy

### 17.1 Unit Tests

- SQLite schema creation and migration tests.
- Float32 vector marshaling/unmarshaling round-trip tests.
- Chunking strategy tests (fixed-size, sentence-boundary).
- Cosine similarity computation tests with known vectors.
- Embedding cache hit/miss tests.
- Search query construction tests (BM25, vector, hybrid).
- Evaluation metric computation tests with simple fixtures.

### 17.2 Integration Tests

- Full pipeline: ingest → extract → chunk → embed → index → search.
- Profile resolution: verify that a given profile resolves to the expected provider/model/dimensions.
- Cache reproducibility: re-embedding the same text produces the same cached result.
- Search consistency: same query against the same index produces the same results.

### 17.3 Evaluation Tests

- Run the default benchmark query set against each configuration.
- Verify that metrics are computed correctly against manually curated relevance judgments.
- Regression: if a configuration change degrades Recall@10, the evaluation should surface it.

---

## 18. Glossary

| Term | Definition |
|---|---|
| **Embedding** | A fixed-length vector of floats representing text semantics |
| **Chunk** | A segment of a document, typically 256-1024 tokens, used as the unit of retrieval |
| **BM25** | Best Match 25, a lexical ranking algorithm based on term frequency |
| **kNN** | k-Nearest Neighbors search in vector space |
| **RRF** | Reciprocal Rank Fusion, a method to combine ranked lists |
| **Cross-encoder** | A model that jointly encodes query and document for fine-grained scoring |
| **Reranking** | Post-retrieval re-scoring of candidates using a cross-encoder |
| **nDCG** | Normalized Discounted Cumulative Gain, a ranking quality metric |
| **MRR** | Mean Reciprocal Rank, measures how high the first relevant result appears |
| **Bleve** | A full-text and vector search library for Go |
| **Goja** | A Go-based JavaScript runtime (ECMAScript 5.1+) |
| **Glazed** | A CLI framework for structured output and command configuration |
| **Geppetto** | Go LLM runtime library with engines, profiles, and embeddings |
| **Pinocchio** | CLI LLM tool with profile management and prompt repositories |
| **Scraper** | Durable workflow engine for scraping and document processing |
| **FAISS** | Facebook AI Similarity Search, a library for efficient vector similarity |
| **Cosine similarity** | Normalized dot product measuring vector direction alignment |
