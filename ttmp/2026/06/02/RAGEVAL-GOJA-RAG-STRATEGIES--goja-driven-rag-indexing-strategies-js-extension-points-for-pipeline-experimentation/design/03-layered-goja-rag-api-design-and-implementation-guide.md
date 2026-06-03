---
title: "Layered Goja RAG API Design and Implementation Guide"
type: design-doc
ticket: RAGEVAL-GOJA-RAG-STRATEGIES
status: active
created: 2026-06-02
topics: [rag, goja, api-design, fluent-api, builder-pattern, bleve, sqlite, goja-text, geppetto]
---

# Layered Goja RAG API Design and Implementation Guide

## Executive Summary

The existing proposed `rag-ops` API is useful as a first sketch, but it mirrors internal Go service names too closely. Names such as `documentProcessing` and `chunkEnrichment` describe current implementation tables and services, not the conceptual operations an experiment author wants to compose. They make JavaScript scripts look like administrative calls into the backend rather than a powerful RAG experimentation DSL.

This document proposes a layered Goja API with two explicit goals:

1. **Give experiment scripts real low-level power**: direct SQL access to SQLite, low-level Bleve/BM25 handles, direct embedding and inference calls, and goja-text Markdown/extract/sanitize primitives.
2. **Provide a more elegant, opinionated, type-checked builder API on top**: Go-backed fluent builders that construct typed plans (`DocumentSet`, `ChunkSet`, `ContextPlan`, `IndexPlan`, `RetrieverPlan`, `ExperimentPlan`) and validate them before execution.

The recommended API is not a single flat `ragOps` bag of functions. It is a **layered module family**:

```text
require("rag")       // opinionated high-level RAG API: builders, recipes, plans, handles
require("rag/raw")   // direct low-level handles: SQL, Bleve, service escape hatches
require("markdown")  // goja-text Markdown parser/walker
require("extract")   // goja-text structured-data extraction
require("sanitize")  // goja-text JSON/YAML repair and validation
require("geppetto")  // LLM inference and prompt/profile machinery
```

The key design idea is: **JavaScript chooses strategy; Go owns stateful domain objects and validates transitions.** A script can remain expressive and experimental, while Go stores handles, enforces invariants, runs providers, writes the database, and rejects invalid plans early.

---

## 1. Why the Previous API Is Not Quite Right

The previous design proposed namespaces like:

```javascript
const ragOps = require("rag-ops");

ragOps.documents.list({ limit: 50 });
ragOps.chunking.apply({ document_id, strategy: "markdown-heading" });
ragOps.embeddings.compute({ strategy_id, provider_type: "ollama" });
ragOps.search.hybridSearch({ query, index_id, strategy_id });
ragOps.documentProcessing.store({ document_id, artifact_type, output_text });
ragOps.chunkEnrichment.store({ chunk_id, short_summary, key_topics });
```

This is service-shaped. It is easy to map to current Go files, but it has several problems:

- **It exposes implementation nouns rather than experiment concepts.** `documentProcessing` is a table/service; a researcher thinks in terms of `metadata`, `summaries`, `features`, `context`, and `artifacts`.
- **It encourages arbitrary option maps.** Every call accepts a JavaScript object. That is flexible, but it shifts validation burden into every Go method and every script.
- **It makes composition hard to read.** A pipeline is a sequence of unrelated calls instead of a plan: select docs → chunk → contextualize → index → retrieve → evaluate.
- **It hides the difference between raw power and safe opinionated operations.** A script that runs SQL and a script that uses typed pipeline builders should feel different.
- **It does not use goja-text's strengths enough.** `markdown.walk()`, `extract.all()`, and `sanitize.json.sanitize()` allow document-aware strategy logic that should be first-class in the design.

The names also carry premature domain decisions. `chunkEnrichment` sounds like a single artifact type, but recent RAG research points to many derived features:

- contextual retrieval prefix (Anthropic)
- document-level metadata
- chunk-level section path
- hypothetical questions
- entities and canonical terms
- answerable facts
- BM25 lexical expansion terms
- embedding text variants

A better API should let scripts create and combine **features** and **representations**, not just store "enrichment" records.

---

## 2. Design Principles

### 2.1 Keep raw access, but label it clearly

The user asked for actual low-level access. That is important. Fast experimentation sometimes requires:

- ad-hoc SQL joins over `documents`, `chunks`, `chunk_embeddings`, and artifact tables
- direct Bleve queries, field boosts, analyzers, and result inspection
- direct LLM calls through geppetto
- direct Markdown AST traversal through goja-text

The design should expose this as a deliberate low-level layer:

```javascript
const raw = require("rag/raw");
const rows = raw.db.query(`
  SELECT d.id, d.title, COUNT(c.id) AS chunks
  FROM documents d
  JOIN chunks c ON c.document_id = d.id
  WHERE c.strategy_id = ?
  GROUP BY d.id
`, "md-pg-500");

const idx = raw.bleve.open("ctx-bm25-garden");
const hits = idx.query()
  .match("text", "apple tree rootstock")
  .boost("title", 2.0)
  .limit(20)
  .search();
```

Raw APIs should be powerful, but not confused with the safer API. They should be documented as escape hatches.

### 2.2 Use fluent builders for complex objects

Fluent interfaces are useful when they act as an internal DSL. Martin Fowler describes fluent interfaces as APIs designed so that use reads like a small domain language. The builder pattern is especially appropriate when an object has many optional parameters and should be validated at construction time.

This applies perfectly to RAG experiments:

- A chunking strategy has many constraints (`maxTokens`, `overlap`, boundary policy, fallback policy).
- A retrieval strategy has a graph of components (BM25, vector, RRF, reranker).
- An experiment has a dataset, indexing plan, query set, metrics, and output policy.

Instead of accepting a loose map, Go should expose builder objects:

```javascript
const chunkPlan = rag.chunker()
  .markdown()
  .paragraphGroups()
  .maxTokens(500)
  .overlapTokens(80)
  .keepHeadingPath(true)
  .id("md-pg-500-v1")
  .Build();        // validation happens here
```

`Build()` returns a Go-backed immutable spec object, not a plain JavaScript map. That gives us:

- type safety in Go
- runtime validation before expensive work starts
- TypeScript declarations for script authors
- better error messages (`overlapTokens must be smaller than maxTokens`)
- inspectable plan objects for UI/workflow reporting

### 2.3 Separate plan construction from execution

A script should be able to build a plan, inspect it, dry-run it, and then execute it.

```javascript
const plan = rag.experiment("anthropic-contextual-garden")
  .documents(rag.documents().source("garden-guides").limit(100).Build())
  .chunks(rag.chunker().markdown().paragraphGroups().maxTokens(500).Build())
  .features(rag.features().contextualPrefix().anthropicPrompt().Build())
  .indexes(rag.indexes().bm25().vector().hybridRRF().Build())
  .evaluation(rag.eval().queries("garden-smoke").metrics("recall@20", "ndcg@10").Build())
  .Build();

console.log(plan.describe());
console.log(plan.validate());

const result = plan.run({ force: false });
```

This makes experiments repeatable and reviewable. It also maps naturally to durable workflow execution: the `ExperimentPlan` can be serialized to JSON and submitted as a workflow.

### 2.4 Use handles for Go-owned state

Goja can expose Go pointers as JS objects. Geppetto already uses hidden Go references (`__geppetto_ref`) on JS objects. We should follow that pattern.

A `DocumentSet`, `ChunkSet`, `BleveIndex`, or `Retriever` should be a Go-owned handle:

```javascript
const docs = rag.documents().source("garden-guides").Build();
const chunks = rag.materializeChunks(docs, chunkPlan);

// chunks is a Go handle, not a JS array of arbitrary chunk maps.
console.log(chunks.count());
console.log(chunks.preview(3));
```

This prevents scripts from fabricating invalid domain objects. Scripts can pass handles to other builders; Go checks that they belong to the same database, strategy, provider, and index root.

### 2.5 Prefer domain concepts over table/service names

Use these conceptual names:

| Current service/table wording | Better API concept | Why |
|---|---|---|
| `documentProcessing` | `features.documents`, `artifacts.documents`, `metadata` | A document can have many derived features, not just "processing" |
| `chunkEnrichment` | `features.chunks`, `context`, `lexicalExpansion`, `representations` | Research names the operation by purpose: contextual prefix, metadata, questions |
| `embeddings.compute` | `representations.vector`, `indexes.vector` | An embedding is a representation and/or index input |
| `search.query` | `retrieve`, `retrievers` | Retrieval is a strategy object, not just a query function |
| `chunking.apply` | `chunker().Build()` + `materializeChunks()` | Chunker is a strategy spec; materialization writes chunks |

The database can still store `document_processing_artifacts` and `chunk_enrichments`; the JS API does not need to reveal those names as its main abstraction.

---

## 3. System Context for a New Intern

### 3.1 Workspace components

The workspace contains several repos that matter for this API:

| Repository | What the intern should know |
|---|---|
| `2026-05-27--rag-evaluation-system` | Main app. Owns SQLite schema, chunking, embeddings, search, workflow ops, CLI, web UI. |
| `goja-text` | Go-backed modules for `markdown`, `extract`, and `sanitize`. These are essential for Markdown-aware RAG scripts. |
| `geppetto` | LLM and embedding infrastructure. Exposes `require("geppetto")` for JS inference. |
| `go-go-goja` | Goja runtime builder, module registration, database module, xgoja provider system. |
| `scraper` | Durable workflow scheduler and JS execution pattern. RAG uses this scheduler for workflow ops. |

### 3.2 Current RAG data flow

```text
Markdown files
   │
   ▼
Source scan
   │ writes documents
   ▼
SQLite documents table
   │
   ├── document feature/artifact generation
   │      writes document_processing_artifacts
   │
   ├── chunking
   │      writes chunks
   │
   ├── chunk feature/context generation
   │      writes chunk_enrichments
   │
   ├── embedding computation
   │      writes chunk_embeddings
   │
   └── BM25 indexing
          writes Bleve index on disk + search_indexes metadata
```

The important files are:

| File | Role |
|---|---|
| `internal/db/queries.go` | Typed DB operations and `DB()` escape hatch. |
| `internal/db/search_queries.go` | Queries for chunks with document context and embedding rows. |
| `internal/services/chunking/service.go` | Applies chunkers and writes `chunks`. |
| `internal/chunking/chunker.go` | Existing fixed, sentence, and markdown-heading chunkers. |
| `internal/services/documentprocessing/service.go` | Document-level LLM artifacts. Current name is implementation-shaped. |
| `internal/services/chunkenrichment/service.go` | Chunk-level LLM artifacts. Current name is implementation-shaped. |
| `internal/services/embedding/service.go` | Embedding computation over stored chunks. |
| `internal/services/search/bm25.go` | Bleve index build/query. |
| `internal/services/search/vector.go` | Vector similarity query over SQLite embeddings. |
| `internal/services/search/hybrid.go` | Reciprocal-rank fusion between BM25 and vector results. |
| `internal/workflow/intake_runner.go` | Dispatches durable ops into services. |
| `scraper/pkg/js/runtime/executor.go` | Existing pattern for running JS scripts inside durable ops. |
| `goja-text/pkg/markdown/module.go` | Markdown AST parse/walk module. |
| `goja-text/pkg/extract/module.go` | Structured-data candidate extraction module. |
| `goja-text/pkg/sanitize/module.go` | JSON/YAML repair module. |
| `geppetto/pkg/js/modules/geppetto/module.go` | JS LLM inference module. |
| `go-go-goja/modules/database/database.go` | SQL module pattern with `query`/`exec` and preconfigured DB support. |

---

## 4. Proposed Layered API

## 4.1 Module layout

```text
rag
├── documents()              // typed DocumentSetBuilder
├── chunker()                // typed ChunkPlanBuilder
├── features()               // typed FeaturePlanBuilder for metadata/context/lexical features
├── representations()        // typed representation builders (embedding text variants, vectors)
├── indexes()                // BM25/vector/hybrid index builders
├── retriever()              // retrieval strategy builder
├── experiment(name)         // full experiment plan builder
├── recipes                  // prebuilt opinionated pipelines
└── open(config)             // open a Go-backed RAG session/context

rag/raw
├── db                       // direct SQL query/exec against rag-eval SQLite
├── bleve                    // low-level Bleve open/build/query/explain handles
├── services                 // explicit escape hatches to current service methods
└── schema                   // table/column metadata for scripts and docs
```

The high-level module should be named `rag`, not `rag-ops`, because it is not only operations. It is a mini DSL for building RAG representations and experiments. If keeping backwards compatibility matters, `rag-ops` can alias `rag`, but the intern should implement and document `rag` as the canonical API.

## 4.2 Layer diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│ JS experiment scripts                                                │
│                                                                     │
│  const rag = require("rag");       const raw = require("rag/raw"); │
│  const md = require("markdown");   const geo = require("geppetto");│
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│ Layer 3: Recipes and experiments                                    │
│  rag.recipes.contextualRetrieval()                                  │
│  rag.experiment("name").documents(...).chunks(...).indexes(...)     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│ Layer 2: Fluent typed builders                                      │
│  DocumentSetBuilder, ChunkPlanBuilder, FeaturePlanBuilder,           │
│  IndexPlanBuilder, RetrieverBuilder, ExperimentBuilder               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│ Layer 1: Go domain handles and repositories                          │
│  DocumentSet, ChunkSet, ArtifactSet, RepresentationSet, IndexHandle   │
│  These call existing Go services and DB queries.                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│ Layer 0: Raw primitives                                              │
│  SQLite (database module), Bleve, geppetto inference, goja-text AST   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Low-Level API: `rag/raw`

The raw module exists so that sophisticated users can experiment below the opinionated DSL.

### 5.1 Raw SQL

Use the existing `go-go-goja/modules/database` design. It already supports a preconfigured `QueryExecer`, disables `configure()` when preconfigured, and returns rows as JavaScript objects.

Recommended export:

```typescript
declare module "rag/raw" {
  export namespace db {
    function query(sql: string, ...args: any[]): Record<string, any>[];
    function exec(sql: string, ...args: any[]): { success: boolean; rowsAffected: number; lastInsertId: number };
    function tables(): TableInfo[];
    function explain(sql: string, ...args: any[]): QueryPlanRow[];
  }
}
```

Example:

```javascript
const raw = require("rag/raw");

const missing = raw.db.query(`
  SELECT d.id, d.title
  FROM documents d
  LEFT JOIN chunks c ON c.document_id = d.id AND c.strategy_id = ?
  WHERE c.id IS NULL
  ORDER BY d.created_at DESC
  LIMIT ?
`, "md-pg-500-v1", 20);
```

Implementation note: register this by wrapping `databasemod.New(databasemod.WithName("db"), databasemod.WithPreconfiguredDB(queries.DB()))` inside the `rag/raw` loader, or expose it as `require("ragdb")` and re-export in `rag/raw`.

### 5.2 Raw Bleve/BM25

The current search service exposes `BuildBM25` and `QueryBM25`, but scripts may need field boosts, query composition, analyzers, and debug/explain output. Add a raw Bleve module that returns Go-owned `BleveIndexHandle` and `BleveQueryBuilder` objects.

Example:

```javascript
const raw = require("rag/raw");

const idx = raw.bleve.open("ctx-bm25-garden");

const hits = idx.query()
  .match("text", "apple rootstock disease")
  .match("title", "apple rootstock disease").boost(2.0)
  .field("source_id", "garden-guides")
  .limit(25)
  .explain(true)
  .Search();
```

TypeScript sketch:

```typescript
export namespace bleve {
  function open(indexID: string): BleveIndex;
  function create(indexID: string): BleveIndexBuilder;

  interface BleveIndex {
    id(): string;
    path(): string;
    query(): BleveQueryBuilder;
    doc(id: string): Record<string, any> | null;
    close(): void;
  }

  interface BleveIndexBuilder {
    field(name: string): BleveFieldBuilder;
    analyzer(name: string): BleveIndexBuilder;
    source(strategyID: string): BleveIndexBuilder;
    includeContextArtifact(promptVersion: string): BleveIndexBuilder;
    Build(): BleveIndexPlan;
  }

  interface BleveQueryBuilder {
    match(field: string, query: string): BleveQueryBuilder;
    phrase(field: string, phrase: string): BleveQueryBuilder;
    boost(value: number): BleveQueryBuilder;
    limit(n: number): BleveQueryBuilder;
    explain(enabled: boolean): BleveQueryBuilder;
    Search(): RetrievalResult[];
  }
}
```

This raw layer should be explicit that it is not the long-term default for scripts. It is the place to discover and validate lower-level behavior.

### 5.3 Raw service escape hatches

Expose service-shaped calls only under `rag/raw.services`, not as the main API:

```javascript
const raw = require("rag/raw");

raw.services.chunking.apply({ documentID, strategy: "markdown-heading", chunkSize: 1000 });
raw.services.search.buildBM25({ strategyID, force: true });
```

This preserves the existing service API for migrations and tests without making it the recommended authoring style.

---

## 6. High-Level API: Fluent Builders and Handles

## 6.1 `rag.open()` and session ownership

A script should start by opening a RAG session. The session owns DB path, index root, provider resolver config, and permission mode.

```javascript
const rag = require("rag");

const r = rag.open({
  dbPath: ctx.input.db_path,
  indexRoot: ctx.input.index_root || "data/indexes",
  mode: "readwrite",       // "readonly" for REPL by default
  profiles: ctx.input.profile_registries || [],
});
```

If the module is embedded into `rag-eval` workflow ops, Go can preconfigure the session and export `rag.current()` instead:

```javascript
const r = require("rag").current();
```

### Go implementation shape

```go
type Session struct {
    DBPath string
    IndexRoot string
    Mode AccessMode
    Queries *db.Queries
    Services Services
    ProviderResolver ProviderResolver
}
```

The JS object should carry a hidden Go ref, following geppetto's pattern.

## 6.2 Document selection

Document selection should return a `DocumentSet`, not a raw array by default.

```javascript
const docs = r.documents()
  .source("garden-guides")
  .status("ready")
  .whereTitleContains("apple")
  .limit(100)
  .Build();

console.log(docs.count());
console.log(docs.preview(5));
```

TypeScript sketch:

```typescript
interface DocumentSetBuilder {
  source(id: string): DocumentSetBuilder;
  sources(ids: string[]): DocumentSetBuilder;
  document(id: string): DocumentSetBuilder;
  documents(ids: string[]): DocumentSetBuilder;
  status(status: "ready" | "pending" | "failed" | string): DocumentSetBuilder;
  whereTitleContains(text: string): DocumentSetBuilder;
  limit(n: number): DocumentSetBuilder;
  Build(): DocumentSet;
}

interface DocumentSet {
  id(): string;
  count(): number;
  ids(): string[];
  preview(n?: number): DocumentPreview[];
  materialize(): Document[]; // explicit escape hatch to JS objects
}
```

Why this is better than `documents.list({limit})`:

- The builder validates mutually incompatible filters.
- The handle can be passed to chunk/index/eval builders without copying arrays.
- The UI can inspect the plan used to produce the set.

## 6.3 Chunking plans

Chunking is a strategy. The API should distinguish **defining a chunking plan** from **materializing chunks into SQLite**.

```javascript
const chunkPlan = r.chunker()
  .markdown()
  .paragraphGroups()
  .maxTokens(500)
  .overlapTokens(80)
  .keepHeadingPath(true)
  .fallbackFixedSize(700, 80)
  .id("md-pg-500-v1")
  .Build();

const chunks = r.materializeChunks(docs, chunkPlan, { force: false });
```

Recommended chunker concepts:

| Builder path | Meaning | Backing implementation |
|---|---|---|
| `.fixed().chars(2000).overlapChars(200)` | Simple character chunks | Existing `FixedSizeChunker` |
| `.sentence().targetChars(1600).overlapChars(200)` | Sentence chunks | Existing `SentenceChunker` |
| `.markdown().headings().maxTokens(700)` | Heading-section chunks | Upgrade existing `MarkdownHeadingChunker` or use goja-text AST |
| `.markdown().paragraphGroups().maxTokens(500)` | Paragraph Group Chunking | New implementation; recommended by research |
| `.custom(fn)` | JS-provided chunk boundaries | Use goja-text `markdown.walk()` and validate spans in Go |

### Using goja-text for custom chunking

The high-level API should still permit custom chunk boundary logic, because this is the core experimentation use case. The safe pattern is: JS returns **boundaries**, Go validates and materializes.

```javascript
const markdown = require("markdown");

const customPlan = r.chunker()
  .customMarkdown("heading-plus-callouts", (doc) => {
    const ast = markdown.parse(doc.contentText());
    const boundaries = [];
    const stack = [];

    markdown.walk(ast, (node) => {
      if (node.Type === "heading") {
        stack[node.Level - 1] = markdown.textContent(node);
        stack.length = node.Level;
        boundaries.push({
          line: node.StartLine,
          kind: "heading",
          headingPath: stack.slice(),
        });
      }
    });

    return boundaries;
  })
  .maxTokens(600)
  .Build();
```

Go validation should reject:

- non-monotonic spans
- overlapping spans unless explicitly allowed
- empty chunks
- spans outside document length
- chunk plans without deterministic IDs

## 6.4 Feature plans instead of `documentProcessing`/`chunkEnrichment`

Use a `features()` builder namespace to describe derived document/chunk facts.

```javascript
const featurePlan = r.features()
  .documentMetadata()
    .fields("title", "document_type", "date", "entities", "section_outline")
    .fromLLM({ profile: "haiku" })
    .storeAs("doc-metadata-v1")
  .chunkContext()
    .anthropicContextualRetrievalPrompt()
    .fromLLM({ profile: "haiku" })
    .storeAs("ctx-prefix-v1")
  .chunkQuestions()
    .count(3)
    .fromLLM({ profile: "haiku" })
    .storeAs("hypo-q-v1")
  .Build();

const features = r.materializeFeatures(chunks, featurePlan, { force: false });
```

This maps to existing tables but avoids exposing their names as the core API:

| Feature concept | Storage today | Future storage option |
|---|---|---|
| Document metadata | `document_processing_artifacts` | `document_features` typed table |
| Document summary | `document_processing_artifacts` | same |
| Chunk contextual prefix | `chunk_enrichments.long_summary` or JSON fields | `chunk_features` typed table |
| Chunk entities/topics | `chunk_enrichments.*_json` | same |
| Hypothetical questions | `chunk_enrichments.hypothetical_questions_json` | same |

### Why `features` is better

`documentProcessing` says how the backend produced something. `features` says what the experiment needs. An experiment author can compose:

- feature extraction
- feature storage
- feature-to-index rendering
- feature-to-embedding rendering

without caring which table is used internally.

## 6.5 Representation plans

A RAG system often indexes more than raw chunk text. It may embed:

- raw chunk text
- contextual prefix + raw chunk text
- metadata + raw chunk text
- hypothetical questions + chunk text
- title/heading path + raw text

Represent that explicitly:

```javascript
const repr = r.representations()
  .text("ctx-text-v1")
  .template(`{{chunk.context("ctx-prefix-v1")}}\n\n{{chunk.text}}`)
  .Build();

const vectors = r.representations()
  .vector("openai-small-ctx-v1")
  .fromText(repr)
  .provider("openai", "text-embedding-3-small")
  .dimensions(1536)
  .batchSize(32)
  .Build();

r.materializeRepresentations(chunks, vectors, { force: false });
```

This is the missing abstraction in the current system. Today `embedding.Compute()` always embeds `chunk.Text`. Contextual retrieval requires embedding a rendered text variant. Therefore the implementation needs one of these changes:

1. Add a `representation_text` or `embedding_input_text` derivation table.
2. Extend `chunk_embeddings` with `representation_id` and `text_hash` of the rendered representation.
3. Let the embedding service accept a `TextRenderer` callback/spec rather than always reading `chunk.Text`.

Recommended: add `representation_id` to embeddings and introduce a `chunk_representations` table.

```sql
CREATE TABLE chunk_representations (
  chunk_id TEXT NOT NULL,
  strategy_id TEXT NOT NULL,
  representation_id TEXT NOT NULL,
  text TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  renderer_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (chunk_id, strategy_id, representation_id)
);
```

This makes contextual embeddings, metadata embeddings, and hypothetical-question embeddings first-class.

## 6.6 Index plans

Indexes should consume representations and features.

```javascript
const indexPlan = r.indexes()
  .bm25("ctx-bm25-v1")
    .source(chunks)
    .field("title").fromDocument("title").boost(2.0)
    .field("heading_path").fromChunkMeta("headingPath").boost(1.5)
    .field("text").fromRepresentation("ctx-text-v1")
    .Build()
  .vector("ctx-vector-v1")
    .sourceRepresentation("openai-small-ctx-v1")
    .Build()
  .Build();

const indexes = r.materializeIndexes(indexPlan, { force: false });
```

The current `BuildBM25` indexes `title` and `text`. This is good for a start, but research suggests BM25 should index contextual prefixes and metadata fields too. The builder should make fields explicit.

## 6.7 Retriever plans

Retrieval should be a reusable object:

```javascript
const retriever = r.retriever()
  .hybrid()
  .bm25("ctx-bm25-v1").limit(150).weight(0.2)
  .vector("ctx-vector-v1").limit(150).weight(0.8)
  .fusion("rrf").k(60)
  .rerank()
    .model("cohere-rerank-v3")
    .topN(20)
  .Build();

const hits = retriever.query("How do I plant apple trees in clay soil?").top(20).Run();
```

This is more reusable than `search.hybridSearch({ ... })` because the retrieval strategy can be named, evaluated, reused in UI, and compared against alternatives.

## 6.8 Experiment plans

The full power of the API is the experiment builder:

```javascript
const exp = r.experiment("anthropic-contextual-vs-baseline")
  .documents(docs)
  .chunks(chunkPlan)
  .features(featurePlan)
  .representations(repr, vectors)
  .indexes(indexPlan)
  .retriever("baseline", r.retriever().vector("raw-vector-v1").Build())
  .retriever("contextual", retriever)
  .evaluation()
    .queries("garden-smoke-queries")
    .metrics("recall@20", "mrr@10", "ndcg@10")
    .judge("golden-chunks")
  .output()
    .writeArtifacts(true)
    .writeReport("reports/anthropic-contextual-vs-baseline.md")
  .Build();

console.log(exp.describe());
const result = exp.Run();
```

`ExperimentPlan` is what should eventually become a durable workflow input. A workflow op should not receive a pile of loose operation-specific fields. It should receive a serialized validated plan.

---

## 7. Recipes: Opinionated Defaults for Common Strategies

A high-level API should include recipes so a new intern can start quickly.

### 7.1 Anthropic Contextual Retrieval recipe

```javascript
const plan = r.recipes.contextualRetrieval("garden-contextual-v1")
  .documents(r.documents().source("garden-guides").limit(200).Build())
  .chunking()
    .markdownParagraphGroups().maxTokens(500).overlapTokens(80)
  .context()
    .profile("haiku")
    .prompt("anthropic-contextual-retrieval")
    .storeAs("ctx-prefix-v1")
  .embedding()
    .provider("openai", "text-embedding-3-small")
    .representation("context_plus_text")
  .bm25()
    .indexContext(true)
    .indexTitle(true)
    .indexHeadingPath(true)
  .retrieval()
    .hybridRRF({ vectorWeight: 0.8, bm25Weight: 0.2, k: 60 })
  .Build();

plan.Run();
```

### 7.2 Metadata-driven RAG recipe

```javascript
const plan = r.recipes.metadataDriven("finance-or-docs-v1")
  .documents(docs)
  .metadata()
    .fields("document_type", "date", "entities", "section_outline", "source_author")
    .profile("haiku")
  .chunking()
    .markdownParagraphGroups().maxTokens(500)
  .embedding()
    .template("metadata_plus_heading_plus_text")
  .retrieval()
    .metadataPrefilter(true)
    .hybridRRF()
  .Build();
```

### 7.3 Chunking benchmark recipe

```javascript
const benchmark = r.recipes.chunkingBenchmark("chunking-smoke")
  .documents(docs)
  .strategies(
    r.chunker().fixed().chars(2000).overlapChars(200).id("fixed-2000-200").Build(),
    r.chunker().markdown().headings().maxTokens(700).id("md-heading-700").Build(),
    r.chunker().markdown().paragraphGroups().maxTokens(500).id("md-pg-500").Build()
  )
  .embeddingProvider("openai", "text-embedding-3-small")
  .queries("smoke-queries")
  .metrics("recall@20", "mrr@10")
  .Build();

benchmark.Run();
```

Recipes should be implemented last, after the underlying builders work. They are thin opinionated wrappers.

---

## 8. Interaction with goja-text APIs

Goja-text should remain separate from `rag`. It provides generic text primitives that scripts can use directly.

### 8.1 Markdown parsing and AST traversal

`goja-text/pkg/markdown/module.go` exposes:

```javascript
const markdown = require("markdown");

const ast = markdown.parse(text);
markdown.walk(ast, (node, ctx) => {
  if (node.Type === "heading") {
    console.log(node.Level, markdown.textContent(node), node.StartLine);
  }
});
```

Important API details:

- Go-backed nodes expose PascalCase fields: `Type`, `Children`, `Text`, `Level`, `Destination`, `StartLine`, etc.
- `walk()` accepts return values: `"skip"`, `"stop"`, `false`, or nothing.
- This is better than the current naive `splitMarkdownSections()` helper in `internal/chunking/chunker.go`, because the AST can preserve structure, links, code blocks, headings, and source positions.

### 8.2 Structured-data extraction

`goja-text/pkg/extract/module.go` exposes:

```javascript
const extract = require("extract");

const candidates = extract.all(documentText);
for (const c of candidates) {
  const validation = extract.validate(c);
  if (validation.Valid) console.log(c.Kind, c.Format, c.Text);
}
```

Use this for:

- frontmatter metadata
- JSON/YAML fenced blocks
- LLM outputs wrapped in code fences
- XML-like `<metadata>...</metadata>` prompt outputs

### 8.3 JSON/YAML repair

`goja-text/pkg/sanitize/module.go` exposes Go-backed option builders:

```javascript
const sanitize = require("sanitize");

const opts = sanitize.json.options()
  .MaxIterations(5)
  .Build();

const result = sanitize.json.sanitize("~~~json\n{'ok': True,}\n~~~", opts);
console.log(result.Sanitized);
```

This pattern is exactly what the RAG API should copy: a builder returns a validated Go config. Unknown options are not silently accepted.

---

## 9. Implementation Guide for the Intern

## 9.1 Package layout

Create a new JS module package inside the RAG eval repo:

```text
2026-05-27--rag-evaluation-system/
└── internal/js/rag/
    ├── module.go              # require("rag") entrypoint
    ├── raw_module.go          # require("rag/raw") entrypoint
    ├── options.go             # Session options, access mode, provider resolvers
    ├── refs.go                # hidden Go refs and type assertions
    ├── session.go             # Session lifecycle, services, DB close
    ├── documents.go           # DocumentSetBuilder + DocumentSet handle
    ├── chunker.go             # ChunkPlanBuilder + materializeChunks
    ├── features.go            # FeaturePlanBuilder + materializeFeatures
    ├── representations.go     # Representation builders
    ├── indexes.go             # IndexPlanBuilder + materializeIndexes
    ├── retriever.go           # RetrieverBuilder + query execution
    ├── experiment.go          # ExperimentPlanBuilder
    ├── recipes.go             # Opinionated recipes
    ├── bleve_raw.go           # Raw Bleve handles/query builders
    ├── ts_declarations.go     # TypeScript declarations
    └── provider.go            # xgoja provider registration
```

Use `goja-text`'s module registration pattern (`modules.NativeModule`) rather than only `goja_nodejs/require` direct registration, because it composes cleanly with xgoja providers.

## 9.2 Module registration pattern

Follow goja-text:

```go
type module struct { opts Options }

var _ modules.NativeModule = (*module)(nil)
var _ modules.TypeScriptDeclarer = (*module)(nil)

func (m *module) Name() string { return "rag" }

func (m *module) Loader(vm *goja.Runtime, moduleObj *goja.Object) {
    exports := moduleObj.Get("exports").(*goja.Object)
    rt := newRuntime(vm, m.opts)
    rt.installExports(exports)
}
```

But because this module needs runtime-specific DB path and resolvers, provide both:

- `NewModule(opts Options) modules.NativeModule` for configured hosts
- an xgoja provider wrapper that reads config from xgoja runtime config

## 9.3 Hidden references

Follow geppetto's hidden-ref approach:

```go
const hiddenRefKey = "__rag_ref"

func (rt *moduleRuntime) attachRef(o *goja.Object, ref any) {
    _ = o.Set(hiddenRefKey, ref)
    _ = o.DefineDataProperty(hiddenRefKey, o.Get(hiddenRefKey),
        goja.FLAG_FALSE, goja.FLAG_FALSE, goja.FLAG_FALSE)
}

func (rt *moduleRuntime) getRef(v goja.Value) any { /* same pattern as geppetto */ }
```

Each builder/handle object should contain a Go ref:

- `*Session`
- `*DocumentSetBuilder`
- `*DocumentSet`
- `*ChunkPlanBuilder`
- `*ChunkPlan`
- `*RetrieverBuilder`
- etc.

## 9.4 Builder method style

Use PascalCase `Build()` if returning Go-backed builder methods, because goja exposes exported Go methods naturally. If you manually set JS functions, use lower camel case. To align with goja-text's builders (`MaxIterations().Build()`), prefer exported Go methods:

```go
type ChunkPlanBuilder struct {
    kind string
    maxTokens int
    overlapTokens int
    errors []string
}

func (b *ChunkPlanBuilder) Markdown() *ChunkPlanBuilder { b.kind = "markdown"; return b }
func (b *ChunkPlanBuilder) ParagraphGroups() *ChunkPlanBuilder { ...; return b }
func (b *ChunkPlanBuilder) MaxTokens(n int) *ChunkPlanBuilder { ...; return b }
func (b *ChunkPlanBuilder) Build() (*ChunkPlan, error) { ... }
```

In JS:

```javascript
const plan = r.Chunker().Markdown().ParagraphGroups().MaxTokens(500).Build();
```

If lower camel case is strongly preferred for JS ergonomics, manually register wrappers:

```javascript
const plan = r.chunker().markdown().paragraphGroups().maxTokens(500).build();
```

Recommendation: use lower camel case for top-level `rag` ergonomics, but keep Go-backed builder method names in `sanitize` as-is. This requires some wrapper code, but the API reads better.

## 9.5 Start small: implement four objects first

Do not implement the full API in one pass. Start with the smallest useful vertical slice:

1. `Session`
2. `DocumentSetBuilder` / `DocumentSet`
3. `ChunkPlanBuilder` / `ChunkPlan`
4. `materializeChunks(docs, plan)`

Then add:

5. raw SQL (`rag/raw.db`)
6. BM25 index builder/query wrapper
7. representation text builder
8. embedding materialization
9. hybrid retriever
10. experiment plan

## 9.6 First vertical-slice example

The first smoke script should be this:

```javascript
const rag = require("rag");
const markdown = require("markdown");

module.exports = function(ctx) {
  const r = rag.current();

  const docs = r.documents()
    .source(ctx.input.source_id)
    .limit(ctx.input.limit || 10)
    .Build();

  const chunkPlan = r.chunker()
    .markdown()
    .paragraphGroups()
    .maxTokens(500)
    .overlapTokens(80)
    .id("md-pg-500-smoke")
    .Build();

  const chunks = r.materializeChunks(docs, chunkPlan, { force: ctx.input.force || false });

  return {
    documentCount: docs.count(),
    chunkCount: chunks.count(),
    strategyID: chunkPlan.id(),
  };
};
```

This proves:

- the module loads
- DB access works
- builder validation works
- chunks are written through the service layer
- the script can return structured output to scraper workflow

---

## 10. Proposed TypeScript API Reference (Abbreviated)

```typescript
declare module "rag" {
  export function current(): Session;
  export function open(config: OpenConfig): Session;

  export interface OpenConfig {
    dbPath?: string;
    indexRoot?: string;
    mode?: "readonly" | "readwrite";
    profiles?: string[];
  }

  export interface Session {
    documents(): DocumentSetBuilder;
    chunker(): ChunkPlanBuilder;
    features(): FeaturePlanBuilder;
    representations(): RepresentationBuilder;
    indexes(): IndexPlanBuilder;
    retriever(): RetrieverBuilder;
    experiment(name: string): ExperimentBuilder;
    materializeChunks(docs: DocumentSet, plan: ChunkPlan, opts?: MaterializeOptions): ChunkSet;
    materializeFeatures(chunks: ChunkSet, plan: FeaturePlan, opts?: MaterializeOptions): FeatureSet;
    materializeRepresentations(chunks: ChunkSet, plan: RepresentationPlan, opts?: MaterializeOptions): RepresentationSet;
    materializeIndexes(plan: IndexPlan, opts?: MaterializeOptions): IndexSet;
  }

  export interface MaterializeOptions {
    force?: boolean;
    limit?: number;
    dryRun?: boolean;
  }

  export interface DocumentSetBuilder {
    source(id: string): DocumentSetBuilder;
    sources(ids: string[]): DocumentSetBuilder;
    document(id: string): DocumentSetBuilder;
    documents(ids: string[]): DocumentSetBuilder;
    status(status: string): DocumentSetBuilder;
    whereTitleContains(text: string): DocumentSetBuilder;
    limit(n: number): DocumentSetBuilder;
    Build(): DocumentSet;
  }

  export interface DocumentSet {
    id(): string;
    count(): number;
    ids(): string[];
    preview(n?: number): DocumentPreview[];
    materialize(): Document[];
  }

  export interface ChunkPlanBuilder {
    fixed(): FixedChunkBuilder;
    sentence(): SentenceChunkBuilder;
    markdown(): MarkdownChunkBuilder;
    customMarkdown(name: string, fn: (doc: DocumentHandle) => ChunkBoundary[]): CustomChunkBuilder;
  }

  export interface MarkdownChunkBuilder {
    headings(): MarkdownChunkBuilder;
    paragraphGroups(): MarkdownChunkBuilder;
    maxTokens(n: number): MarkdownChunkBuilder;
    overlapTokens(n: number): MarkdownChunkBuilder;
    keepHeadingPath(enabled: boolean): MarkdownChunkBuilder;
    fallbackFixedSize(chars: number, overlap: number): MarkdownChunkBuilder;
    id(id: string): MarkdownChunkBuilder;
    Build(): ChunkPlan;
  }

  export interface ChunkPlan {
    id(): string;
    kind(): string;
    describe(): string;
    toJSON(): object;
  }

  export interface ChunkSet {
    id(): string;
    strategyID(): string;
    count(): number;
    preview(n?: number): ChunkPreview[];
    materialize(): Chunk[];
  }

  export interface FeaturePlanBuilder {
    documentMetadata(): DocumentMetadataBuilder;
    chunkContext(): ChunkContextBuilder;
    chunkQuestions(): ChunkQuestionsBuilder;
    Build(): FeaturePlan;
  }

  export interface RepresentationBuilder {
    text(id: string): TextRepresentationBuilder;
    vector(id: string): VectorRepresentationBuilder;
  }

  export interface IndexPlanBuilder {
    bm25(id: string): BM25IndexBuilder;
    vector(id: string): VectorIndexBuilder;
    Build(): IndexPlan;
  }

  export interface RetrieverBuilder {
    bm25(indexID: string): RetrieverBuilder;
    vector(indexID: string): RetrieverBuilder;
    hybrid(): HybridRetrieverBuilder;
    Build(): Retriever;
  }

  export interface Retriever {
    query(q: string): QueryRunBuilder;
  }

  export interface QueryRunBuilder {
    top(n: number): QueryRunBuilder;
    Run(): RetrievalResult[];
  }
}
```

---

## 11. Durable Workflow Integration

The current workflow operation input is a flat `IntakeOpInput` struct in `internal/workflow/ops.go`. For JS experiments, avoid extending this forever with more fields. Instead add a plan-based operation:

```go
const OperationRunRAGPlan = "run_rag_plan"

type RunRAGPlanInput struct {
    DBPath string `json:"db_path"`
    IndexRoot string `json:"index_root"`
    PlanJSON json.RawMessage `json:"plan_json"`
    Script string `json:"script,omitempty"`
    Mode string `json:"mode,omitempty"`
}
```

Two modes:

1. **Plan-only mode**: JS generated an `ExperimentPlan`, serialized it, and workflow executes it.
2. **Script mode**: workflow uses scraper JS executor with `rag`, `rag/raw`, `geppetto`, and goja-text modules available.

Recommended order:

1. Build `rag` module for REPL/eval use.
2. Add `rag/raw` module.
3. Add `run_rag_plan` op for serialized plan execution.
4. Add `js_pipeline` op only after plan execution works.

---

## 12. Validation and Testing Strategy

### Unit tests

- Builder validation:
  - overlap < maxTokens
  - required IDs
  - mutually exclusive source/document filters
  - read-only mode rejects writes
- Hidden ref type assertions:
  - passing a fake JS object where `DocumentSet` is required fails clearly
- SQL raw mode:
  - query works
  - exec blocked in readonly mode
- Chunk materialization:
  - deterministic strategy ID
  - rerun safety with `force`
  - source offsets valid

### Integration tests

1. Build goja runtime with modules: `rag`, `rag/raw`, `markdown`, `extract`, `sanitize`, `geppetto`.
2. Open a temp SQLite database and run migrations.
3. Insert two documents.
4. Run a JS script that builds a document set and chunks it.
5. Verify chunks in DB.
6. Build BM25 index.
7. Query BM25 and verify result shape.

### Smoke scripts

Store scripts under:

```text
scripts/rag-js-smoke/
├── 01-list-documents.js
├── 02-chunk-markdown-paragraph-groups.js
├── 03-build-bm25.js
├── 04-query-hybrid.js
└── 05-contextual-retrieval-dry-run.js
```

---

## 13. Decision Records

### DR-1: Canonical module name is `rag`, not `rag-ops`

**Decision:** Use `require("rag")` for the high-level API and `require("rag/raw")` for escape hatches.

**Rationale:** `rag-ops` sounds like backend operations. The new API is a RAG experiment DSL with handles, builders, recipes, and raw access.

**Consequence:** Existing documentation that says `rag-ops` should be treated as legacy or as a possible alias.

### DR-2: Raw access is separate and explicit

**Decision:** Expose SQL and Bleve under `rag/raw`.

**Rationale:** Low-level access is necessary for experimentation, but it should not pollute the high-level API or weaken type safety.

**Consequence:** Scripts that use raw SQL are visibly different from scripts that use validated builders.

### DR-3: Builders return Go-backed handles

**Decision:** Complex specs and domain objects are Go-owned handles, not plain JS maps.

**Rationale:** This preserves type safety, supports runtime validation, prevents fabricated invalid objects, and lets Go manage lifecycle.

**Consequence:** Builders need TypeScript declarations and hidden-ref machinery.

### DR-4: `features` replaces public `documentProcessing` / `chunkEnrichment`

**Decision:** The high-level API uses `features`, `metadata`, `context`, `representations`, and `artifacts` concepts.

**Rationale:** The old names reflect service/table internals. The new names reflect RAG experiment concepts.

**Consequence:** Existing tables may remain unchanged initially, but the JS surface should not be table-shaped.

### DR-5: Representation text becomes first-class

**Decision:** Introduce a `RepresentationPlan` and eventually a `chunk_representations` table.

**Rationale:** Contextual retrieval, metadata-driven RAG, and hypothetical-question indexing all require embedding/indexing text variants other than raw `chunks.text`.

**Consequence:** Embedding and BM25 services need to accept representation sources, not only chunks.

---

## 14. Implementation Roadmap

### Phase A: API foundation (small vertical slice)

- Implement `internal/js/rag/module.go`
- Implement `Session`
- Implement `DocumentSetBuilder` / `DocumentSet`
- Implement `ChunkPlanBuilder` for fixed and markdown paragraph group plans
- Implement `materializeChunks()` through existing chunking service or a new chunking materializer
- Add TypeScript declarations
- Add smoke test

### Phase B: Raw layer

- Re-export/preconfigure database module as `rag/raw.db`
- Implement `rag/raw.bleve.open()` and basic query builder
- Add readonly/readwrite mode gates
- Add schema introspection helpers

### Phase C: Representations and contextual retrieval

- Add `RepresentationPlan`
- Add `chunk_representations` table or equivalent storage
- Update embedding service to embed representation text
- Update BM25 index builder to index configurable fields/representations
- Add contextual retrieval recipe

### Phase D: Retriever and experiment plans

- Implement retriever builders: BM25, vector, hybrid RRF
- Add optional reranker interface
- Implement `ExperimentPlanBuilder`
- Add plan serialization/deserialization
- Add durable `run_rag_plan` op

### Phase E: xgoja integration

- Add provider package for `rag` and `rag/raw`
- Add `xgoja.yaml` for `rag-eval-js`
- Include modules: `rag`, `rag/raw`, `markdown`, `extract`, `sanitize`, `geppetto`, `db`, `fs`
- Add help pages and jsverb examples

---

## 15. What the Intern Should Build First

Start with this concrete target:

> Build a `rag` module that can select documents, define a markdown paragraph-group chunking plan, materialize chunks, and expose raw SQL reads.

Acceptance script:

```javascript
const rag = require("rag");
const raw = require("rag/raw");

module.exports = function(ctx) {
  const r = rag.current();

  const docs = r.documents()
    .source(ctx.input.source_id)
    .limit(5)
    .Build();

  const chunkPlan = r.chunker()
    .markdown()
    .paragraphGroups()
    .maxTokens(500)
    .overlapTokens(80)
    .id("md-pg-500-intern-smoke")
    .Build();

  const chunks = r.materializeChunks(docs, chunkPlan, { force: true });

  const rows = raw.db.query(
    "SELECT COUNT(*) AS n FROM chunks WHERE strategy_id = ?",
    chunkPlan.id()
  );

  return {
    docs: docs.count(),
    chunks: chunks.count(),
    dbCount: rows[0].n,
  };
};
```

The intern is done with Phase A when:

- the script runs in a goja runtime
- invalid builder configs fail with clear errors
- chunks are deterministic and rerun-safe
- raw SQL query sees the same chunk count
- the module has TypeScript declarations
- unit/integration tests pass

---

## 16. Final Recommendation

Keep the spirit of the earlier scripts: short JavaScript experiments should be able to drive RAG indexing strategies quickly. But change the API shape.

Recommended public API:

- `rag` for opinionated, typed, fluent plans
- `rag/raw` for SQL, Bleve, and service escape hatches
- `markdown`, `extract`, `sanitize` from goja-text for document-aware JS logic
- `geppetto` for inference

Recommended conceptual model:

```text
DocumentSet → ChunkPlan → ChunkSet → FeaturePlan → RepresentationPlan → IndexPlan → RetrieverPlan → ExperimentPlan
```

Avoid making `documentProcessing` and `chunkEnrichment` the public center of gravity. They are storage/service details. The elegant API should center on **features**, **representations**, **indexes**, **retrievers**, and **experiments**.
