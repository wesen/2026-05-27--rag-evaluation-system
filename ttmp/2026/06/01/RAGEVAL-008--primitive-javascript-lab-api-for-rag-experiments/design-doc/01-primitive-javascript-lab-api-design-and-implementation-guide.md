---
Title: Primitive JavaScript Lab API Design and Implementation Guide
Ticket: RAGEVAL-008
Status: active
Topics:
    - rag
    - intake
    - workflow
    - design
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../geppetto/pkg/embeddings/embeddings.go
      Note: Existing provider abstraction that should back gp.embeddings
    - Path: ../../../../../../../geppetto/pkg/embeddings/openai.go
      Note: Existing OpenAI embedding provider to wrap rather than duplicate in rag-eval
    - Path: ../../../../../../../geppetto/pkg/js/modules/geppetto/module.go
      Note: Current require geppetto module entrypoint and namespace wiring to extend
    - Path: ../../../../../../../geppetto/pkg/js/runtime/runtime.go
      Note: Owned runtime creation path that binds the Geppetto module to go-go-goja
    - Path: ../../../../../../../go-go-goja/modules/common.go
      Note: Defines the go-go-goja NativeModule contract and registry behavior that RAGEVAL-008 must follow
    - Path: ../../../../../../../go-go-goja/modules/exports.go
      Note: Shows the helper for setting JavaScript exports from native module loaders
ExternalSources: []
Summary: Design for a Goja-backed primitive JavaScript API for RAG experiments, with LLM, embeddings, and reranking primitives implemented in Geppetto and consumed by rag-eval lab scripts.
LastUpdated: 2026-06-01T10:30:00-04:00
WhatFor: Use this guide to implement intern-friendly, low-level JavaScript primitives for RAG experiments without prematurely baking in one pipeline abstraction.
WhenToUse: Use when adding go-go-goja native modules, Geppetto JS LLM/embedding/rerank APIs, or a rag-eval experiment harness around those primitives.
---


# Primitive JavaScript Lab API Design and Implementation Guide

## Executive Summary

RAGEVAL-008 should give researchers and application developers a small JavaScript "lab bench" for RAG experiments. The goal is not to invent another high-level pipeline framework. The goal is to let ordinary JavaScript code call well-scoped Go primitives: load documents, parse or chunk Markdown, call LLMs, compute embeddings, rerank candidates, write experiment artifacts, and compare results.

The implementation should be split into two layers:

1. **Geppetto primitive intelligence layer** — `geppetto/` owns LLM, embeddings, and reranking primitives because it already owns provider-agnostic inference, profile resolution, Goja module registration, runtime bridging, and TypeScript declaration generation.
2. **rag-eval lab layer** — `rag-evaluation-system/` owns corpus/database/workspace/search/experiment primitives because those are application-domain concerns tied to rag-eval schemas and workflows.

The resulting JavaScript should feel like this:

```javascript
const gp = require("geppetto");
const rag = require("raglab");

const ws = rag.workspace.open({ dbPath: "state/eval.db", root: "./lab-runs/demo" });
const docs = ws.documents.find({ sourceId: "ttc", limit: 5 });

const embedder = gp.embeddings.fromProfile({ profileSlug: "openai-small" });
const reranker = gp.rerank.fromConfig({ provider: "cohere", model: "rerank-v3.5" });
const llm = gp.llm.fromProfile({ profileSlug: "gpt-5-nano-low" });

for (const doc of docs) {
  const chunks = rag.markdown.chunk(doc.contentText, { strategy: "semantic-ish", maxChars: 1200 });
  const vectors = await embedder.embedMany(chunks.map(c => c.text));
  ws.store.replaceChunks(doc.id, chunks, { strategyId: "js-lab-v1", embeddings: vectors });
}

const candidates = ws.query.hybrid("warranty exclusions", { topK: 30 });
const ranked = await reranker.rerank({ query: "warranty exclusions", documents: candidates });
const answer = await llm.generateText({
  system: "Answer with citations.",
  prompt: rag.prompts.answerWithContext("warranty exclusions", ranked.slice(0, 5)),
});

ws.experiments.record({ name: "warranty-hybrid-rerank", answer, ranked });
```

That example is intentionally just JavaScript. It uses loops, arrays, conditionals, assertions, temporary files, and explicit storage decisions. The heavy work stays in Go services and Geppetto providers; the experimental composition stays in JS.

## Problem Statement

The RAG Evaluation System now has durable workflow-backed intake, document-processing artifacts, chunk-enrichment artifacts, workflow visibility, and direct CLI escape hatches. That is strong operational infrastructure, but there is still a gap for fast research iteration:

- testing alternative chunking strategies requires writing Go or CLI glue;
- comparing embedding models requires bridging profile/provider settings into rag-eval storage by hand;
- trying a reranker between retrieval and answer generation is not yet a first-class primitive;
- recording experimental runs, manifests, outputs, and notes is still ad hoc;
- current workflow orchestration is durable but heavier than a scratchpad research loop.

JavaScript is a good fit for the missing layer because Goja lets the application expose precise host capabilities through `require()` while keeping provider implementations and data storage in Go. The desired shape is a programmable lab bench, not a user-controlled Node process with unrestricted filesystem/network access.

## Scope

### In scope

- Add Geppetto-owned JavaScript APIs for:
  - low-level LLM calls;
  - embeddings single/batch calls;
  - reranking query/document candidates.
- Keep provider implementations in `geppetto/` rather than duplicating LLM/embedding/reranking clients in rag-eval.
- Add a rag-eval-owned native module for:
  - workspace opening;
  - document lookup/import;
  - Markdown parsing/chunking helpers;
  - chunk/artifact storage;
  - vector/BM25/hybrid query helpers;
  - experiment result manifests and artifact files.
- Use Promise-based APIs for blocking network calls.
- Generate or maintain TypeScript declarations so experiment authors get editor help.
- Provide deterministic fake providers and runtime integration tests.

### Out of scope for the first implementation

- A full pipeline DSL that hides control flow.
- Durable workflow orchestration inside the JS API. Workflows can later call JS scripts or JS can submit workflows, but this ticket should first expose primitives.
- Unrestricted Node compatibility. The runtime is Goja plus explicitly installed modules, not Node.js.
- Browser UI changes, except optionally linking to stored experiment runs after the primitives exist.

## Evidence and Current-State Architecture

### go-go-goja runtime and native modules

`go-go-goja` exposes Go modules to JavaScript through a small native module contract. The core interface is:

```go
type NativeModule interface {
    Name() string
    Doc() string
    Loader(*goja.Runtime, *goja.Object)
}
```

This is defined in `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/common.go:28-32`. A module registry stores these modules and registers each loader on a `goja_nodejs/require.Registry` (`common.go:85-89`). A convenience `modules.SetExport` helper attaches Go functions to JavaScript exports and logs failures (`modules/exports.go:3-8`).

Implication for interns: the JavaScript API is not magic. Each `require("name")` module is a Go adapter that receives a VM and a CommonJS-style `module.exports` object. Put decoding and export wiring there; do not put domain logic there.

### goja-repl documentation implications

The captured `goja-repl help --all` output lists the important authoring topics now stored under this ticket's `sources/` directory. The most important pages for this design are:

- `sources/goja-creating-modules.txt` — native modules are registered Go adapters exposed through `require()`.
- `sources/goja-async-patterns.txt` — the Goja VM is single-threaded; background goroutines must not touch JS values directly.
- `sources/goja-typescript-declaration-generator.txt` — modules can publish deterministic `.d.ts` files and CI drift checks.
- `sources/goja-nodejs-primitives.txt` — the runtime exposes a deliberate subset of Node-like primitives, not a complete Node environment.
- `sources/goja-bun-bundling-playbook-goja.txt` — author scripts can be bundled to CommonJS before running in Goja.

The async page is especially important. It states that a Goja runtime is single-threaded from JavaScript's point of view and that Promise settlement, JS callback invocation, and access to `goja.Value` must happen through the runtime owner. That rule determines the implementation shape for LLM, embedding, and reranking network calls.

### Geppetto already exposes `require("geppetto")`

Geppetto has a native Goja module named `geppetto`. The module name is defined in `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/js/modules/geppetto/module.go:23-25`. The module options already include runtime-owner, Go tool registry, middleware factories, engine profile registry, default inference settings, event sinks, snapshot hooks, and persister options (`module.go:33-49`). Registration is explicit through `Register(reg, opts)`, which registers `require("geppetto")` on the Goja require registry (`module.go:58-64`).

The installed top-level namespaces currently include:

- `turns`
- `engines`
- `profiles`
- `runner`
- `schemas`
- `middlewares`
- `events`
- `tools`

This is visible in `module.go:143-203` and documented in `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/doc/topics/13-js-api-reference.md`.

Geppetto also has a runtime constructor that builds an owned `go-go-goja` runtime and installs the module. In `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/js/runtime/runtime.go:49-74`, `NewRuntime` builds a runtime factory, binds `RuntimeOwner`, registers `geppetto`, and returns an owned runtime.

Implication: RAGEVAL-008 should extend the existing Geppetto module rather than creating a separate LLM module in rag-eval. The same `require("geppetto")` entrypoint should grow low-level primitives for LLM calls, embeddings, and reranking.

### Geppetto's current JS docs are useful but partially stale

The Geppetto README and JS reference mention a `go run ./cmd/examples/geppetto-js-lab --script ...` harness. In the currently inspected checkout, `cmd/examples/geppetto-js-lab` was not present; the JS examples exist under `examples/js/geppetto/`, but the documented lab command appears stale relative to the tree inspected during this ticket.

This does not block the design, but it means implementation should include an explicit working harness command and should update Geppetto docs at the same time as code. Interns should not assume every README command is currently runnable without checking the repository.

### Geppetto already has an embeddings provider interface

Geppetto already has a provider-agnostic embedding interface in `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/embeddings/embeddings.go:11-22`:

```go
type Provider interface {
    GenerateEmbedding(ctx context.Context, text string) ([]float32, error)
    GenerateBatchEmbeddings(ctx context.Context, texts []string) ([][]float32, error)
    GetModel() EmbeddingModel
}
```

It also has an OpenAI implementation. `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/embeddings/openai.go:19-31` constructs the provider, `openai.go:34-45` generates one embedding, and `openai.go:47-73` generates batch embeddings with a result-count check. There is also a disk cache provider in `pkg/embeddings/disk-cache.go`.

Implication: embeddings should not be reimplemented in rag-eval. Add a Geppetto JS adapter over this existing provider interface, then let rag-eval consume vectors and store them in its own `chunk_embeddings` schema.

### Reranking is not yet an obvious Geppetto package

A repository search found no first-class `pkg/rerank` package in Geppetto. That means RAGEVAL-008 likely needs a small new Go package before the JS adapter:

```go
package rerank

type Document struct {
    ID       string
    Text     string
    Metadata map[string]any
}

type Result struct {
    ID       string
    Index    int
    Score    float64
    Document Document
}

type Provider interface {
    Rerank(ctx context.Context, query string, docs []Document, opts Options) ([]Result, error)
    GetModel() Model
}
```

Start with a fake deterministic provider and one live provider only if credentials/config already exist. Do not wire live reranking directly into rag-eval until the Geppetto package has service tests and JS runtime tests.

## Design Principles

1. **Primitive first, pipeline later.** Expose small operations that compose in plain JS. Avoid `runRagPipeline()` until multiple experiments prove the shape.
2. **Geppetto owns intelligence providers.** LLM calls, embedding providers, and reranking providers live in `geppetto/`.
3. **rag-eval owns corpus and experiment storage.** DB rows, chunks, search indexes, source records, and experiment manifests live in rag-eval.
4. **The JS adapter is glue, not business logic.** Native module code decodes options, calls Go services, and encodes results.
5. **Async APIs must be owner-thread safe.** Blocking Go work can happen in goroutines; Promise settlement must return through runtime-owner helpers.
6. **Fake providers are first-class.** Every primitive should have deterministic tests without network access.
7. **TypeScript declarations are part of the API.** If a function is exported, it needs editor-visible types and drift checks.
8. **Explicit capability boundaries.** Scripts receive only the modules and globals the host installs.

## Proposed API Surface

### Layer 1: Geppetto JavaScript primitive APIs

Add these namespaces to `require("geppetto")`:

```typescript
interface GeppettoModule {
  llm: LLMNamespace;
  embeddings: EmbeddingsNamespace;
  rerank: RerankNamespace;
}
```

#### `gp.llm`

The existing `gp.engines` and `gp.runner` APIs are powerful, but RAG experiments often need a smaller primitive: "give me text or JSON for this prompt". Add thin convenience wrappers that still use the underlying engine/profile machinery.

```typescript
interface LLMNamespace {
  fromConfig(options: LLMConfig): LLMClient;
  fromProfile(options: ProfileSelector): LLMClient;
}

interface LLMClient {
  modelInfo?: ModelInfo;
  generateText(input: GenerateTextInput, options?: RunOptions): Promise<GenerateTextResult>;
  generateJson(input: GenerateJsonInput, options?: RunOptions): Promise<GenerateJsonResult>;
}

interface GenerateTextInput {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, any>;
}

interface GenerateTextResult {
  text: string;
  turn?: Turn;
  usage?: Record<string, any>;
  model?: string;
  provider?: string;
}
```

Example:

```javascript
const gp = require("geppetto");
const llm = gp.llm.fromProfile({ profileSlug: "gpt-5-nano-low" });

const out = await llm.generateText({
  system: "Extract product facts as concise bullets.",
  prompt: documentText,
});

console.log(out.text);
```

Implementation note: this can internally build an engine with the existing profile/config path, resolve an app-owned runtime, and call the existing runner/session code. Keep the first version simple and non-streaming. Add streaming only after the Promise API and tests are stable.

#### `gp.embeddings`

```typescript
interface EmbeddingsNamespace {
  fromConfig(options: EmbeddingConfig): EmbeddingClient;
  fromProfile(options: ProfileSelector): EmbeddingClient;
  fake(options?: FakeEmbeddingOptions): EmbeddingClient;
  cosineSimilarity(a: number[], b: number[]): number;
}

interface EmbeddingClient {
  model: { name: string; dimensions: number };
  embed(text: string, options?: EmbedOptions): Promise<EmbeddingResult>;
  embedMany(texts: string[], options?: EmbedOptions): Promise<EmbeddingBatchResult>;
}

interface EmbeddingResult {
  embedding: number[];
  model: { name: string; dimensions: number };
  inputHash: string;
}

interface EmbeddingBatchResult {
  embeddings: number[][];
  model: { name: string; dimensions: number };
  inputHashes: string[];
}
```

Example:

```javascript
const embedder = gp.embeddings.fromConfig({
  provider: "openai",
  model: "text-embedding-3-small",
  dimensions: 1536,
});

const batch = await embedder.embedMany(chunks.map(c => c.text));
```

Implementation note: wrap `pkg/embeddings.Provider`. For profile support, add or reuse Geppetto profile resolution for `inference_settings.embeddings`. The example profile fixture `examples/js/geppetto/profiles/40-embeddings.yaml` already indicates the intended profile direction.

#### `gp.rerank`

```typescript
interface RerankNamespace {
  fromConfig(options: RerankConfig): RerankClient;
  fromProfile(options: ProfileSelector): RerankClient;
  fake(options?: FakeRerankOptions): RerankClient;
}

interface RerankClient {
  model: { name: string; provider: string };
  rerank(input: RerankInput, options?: RerankOptions): Promise<RerankResult[]>;
}

interface RerankInput {
  query: string;
  documents: Array<string | RerankDocument>;
}

interface RerankDocument {
  id?: string;
  text: string;
  metadata?: Record<string, any>;
}

interface RerankResult {
  id?: string;
  index: number;
  score: number;
  text: string;
  metadata?: Record<string, any>;
}
```

Example:

```javascript
const reranker = gp.rerank.fake();
const ranked = await reranker.rerank({
  query: "return policy",
  documents: candidates.map(c => ({ id: c.chunkId, text: c.text, metadata: c })),
});
```

Implementation note: because no first-class reranking package was found in Geppetto, first add `pkg/rerank` with `Provider`, `FakeProvider`, and provider config types. Then expose it through JS.

### Layer 2: rag-eval JavaScript lab module

Add a rag-eval-owned module. The recommended module name is `raglab` because it describes the experimental surface without implying all of rag-eval is available from JS.

```javascript
const rag = require("raglab");
```

Suggested namespaces:

```typescript
interface RaglabModule {
  workspace: WorkspaceNamespace;
  markdown: MarkdownNamespace;
  prompts: PromptNamespace;
}
```

#### `rag.workspace`

```typescript
interface WorkspaceNamespace {
  open(options: WorkspaceOpenOptions): Workspace;
}

interface WorkspaceOpenOptions {
  dbPath: string;
  root?: string;
  indexRoot?: string;
  readonly?: boolean;
}

interface Workspace {
  documents: DocumentsAPI;
  store: StoreAPI;
  query: QueryAPI;
  experiments: ExperimentsAPI;
  close(): void;
}
```

#### `ws.documents`

```typescript
interface DocumentsAPI {
  get(id: string): Document | null;
  find(filter?: DocumentFilter): Document[];
  importText(input: ImportTextInput): Document;
}
```

#### `rag.markdown`

```typescript
interface MarkdownNamespace {
  parse(text: string, options?: MarkdownParseOptions): MarkdownDocument;
  chunk(text: string, options?: ChunkOptions): ChunkDraft[];
}
```

#### `ws.store`

```typescript
interface StoreAPI {
  replaceChunks(documentId: string, chunks: ChunkDraft[], options: ReplaceChunksOptions): StoredChunk[];
  putEmbeddings(chunks: StoredChunk[], embeddings: number[][], options: PutEmbeddingsOptions): void;
  putDocumentArtifact(documentId: string, artifact: DocumentArtifactInput): void;
  putChunkEnrichment(chunkId: string, enrichment: ChunkEnrichmentInput): void;
}
```

#### `ws.query`

```typescript
interface QueryAPI {
  bm25(query: string, options?: QueryOptions): Candidate[];
  vector(queryEmbedding: number[], options?: QueryOptions): Candidate[];
  hybrid(query: string, options?: HybridQueryOptions): Candidate[];
}
```

#### `ws.experiments`

```typescript
interface ExperimentsAPI {
  start(input: ExperimentStartInput): ExperimentRun;
  record(input: ExperimentRecordInput): void;
  finish(input?: ExperimentFinishInput): ExperimentSummary;
}
```

Experiment storage should create a durable manifest under the workspace root, for example:

```text
lab-runs/
  2026-06-01T143000Z--warranty-hybrid-rerank/
    manifest.json
    script.js
    inputs.jsonl
    candidates.jsonl
    outputs.jsonl
    metrics.json
    notes.md
```

## Architecture Diagrams

### Ownership diagram

```text
+---------------------------+        +------------------------------+
| JavaScript experiment     |        | Go host runtime              |
|---------------------------|        |------------------------------|
| ordinary JS loops         | require| go-go-goja RuntimeOwner      |
| await gp.llm.generateText |------->| native module adapters       |
| await gp.embeddings...    |        | Promise settlement on owner  |
| ws.store.replaceChunks    |        +---------------+--------------+
+-------------+-------------+                        |
              |                                      |
              v                                      v
+-------------+-------------+        +---------------+--------------+
| raglab module             |        | geppetto module              |
|---------------------------|        |------------------------------|
| rag-eval DB services      |        | LLM engines / profiles       |
| markdown/chunking         |        | embeddings providers         |
| search/query services     |        | reranking providers          |
| experiment manifests      |        | TypeScript declarations      |
+---------------------------+        +------------------------------+
```

### Async Promise flow

```text
JS call on owner thread
  |
  | gp.embeddings.fromProfile(...).embedMany(texts)
  v
Native module decodes JS inputs and creates Promise
  |
  | starts goroutine with copied Go strings/options
  v
Goroutine calls Geppetto provider over network
  |
  | does NOT touch goja.Value, JS callback, or Promise directly
  v
runtimebridge posts settlement back to RuntimeOwner
  |
  | owner resolves/rejects Promise
  v
JavaScript await resumes
```

## Implementation Plan

### Phase 0 — Confirm and fix the runnable JS harness

1. Verify which Geppetto JS harness is current.
2. If `cmd/examples/geppetto-js-lab` is missing, either restore it or update docs to the actual command.
3. Add a minimal script test:

```javascript
const gp = require("geppetto");
console.log({ version: gp.version, namespaces: Object.keys(gp).sort() });
```

Acceptance criteria:

- A documented command runs the script from a clean checkout.
- The command is tested or at least covered by a smoke test.
- Geppetto README and JS docs no longer point interns to a missing command.

### Phase 1 — Add Geppetto service-level primitives

Add or normalize pure Go packages before touching JS adapters.

#### LLM

- Reuse existing Geppetto engine/runner packages where possible.
- Add a small service facade only if it reduces duplication in JS adapter code:

```go
type TextGenerator interface {
    GenerateText(ctx context.Context, input GenerateTextInput) (GenerateTextResult, error)
    GenerateJSON(ctx context.Context, input GenerateJSONInput) (GenerateJSONResult, error)
}
```

#### Embeddings

- Reuse `pkg/embeddings.Provider`.
- Add provider construction from `InferenceSettings` / profile resolution if not already present.
- Add fake provider with deterministic vectors if a suitable one does not exist.

#### Rerank

- Add `pkg/rerank` with provider interface, fake provider, model metadata, config structs, and tests.
- Add live provider later; do not block JS API tests on live credentials.

Acceptance criteria:

- Pure Go tests cover LLM fake/echo path, embeddings fake/batch path, and rerank fake path.
- No goja dependency is required for service-level tests.

### Phase 2 — Add Geppetto JS adapters

Add files under `geppetto/pkg/js/modules/geppetto/`:

```text
api_llm.go
api_embeddings.go
api_rerank.go
```

Wire namespaces in `installExports`:

```go
llmObj := m.vm.NewObject()
m.mustSet(llmObj, "fromConfig", m.llmFromConfig)
m.mustSet(llmObj, "fromProfile", m.llmFromProfile)
m.mustSet(exports, "llm", llmObj)

embObj := m.vm.NewObject()
m.mustSet(embObj, "fromConfig", m.embeddingsFromConfig)
m.mustSet(embObj, "fromProfile", m.embeddingsFromProfile)
m.mustSet(embObj, "fake", m.embeddingsFake)
m.mustSet(embObj, "cosineSimilarity", cosineSimilarity)
m.mustSet(exports, "embeddings", embObj)

rerankObj := m.vm.NewObject()
m.mustSet(rerankObj, "fromConfig", m.rerankFromConfig)
m.mustSet(rerankObj, "fromProfile", m.rerankFromProfile)
m.mustSet(rerankObj, "fake", m.rerankFake)
m.mustSet(exports, "rerank", rerankObj)
```

#### Promise helper pseudocode

Use a helper so all network primitives follow the same owner-thread rule:

```go
func (m *moduleRuntime) promiseFromGo(
    op string,
    work func(ctx context.Context) (any, error),
) goja.Value {
    promise, resolve, reject := m.vm.NewPromise()

    services, ok := runtimebridge.Lookup(m.vm)
    if !ok || services.Owner == nil {
        panic(m.vm.NewGoError(fmt.Errorf("%s requires runtime services", op)))
    }

    callCtx := runtimebridge.CurrentOwnerContext(m.vm)
    lifetimeCtx := services.Lifetime()

    go func() {
        ctx, cancel := context.WithCancel(callCtx)
        defer cancel()

        done := make(chan struct{})
        go func() {
            select {
            case <-lifetimeCtx.Done(): cancel()
            case <-done:
            }
        }()

        result, err := work(ctx)
        close(done)

        _ = services.PostWithCustomContext(callCtx, op+".settle", func(context.Context, *goja.Runtime) {
            if err != nil {
                _ = reject(m.vm.NewGoError(err))
                return
            }
            _ = resolve(m.vm.ToValue(result))
        })
    }()

    return m.vm.ToValue(promise)
}
```

The real helper should be adjusted to the exact runtimebridge API available in the checked-out `go-go-goja`/`geppetto` versions, but the invariant is non-negotiable: background goroutines only handle copied Go values and never touch JS values directly.

Acceptance criteria:

- `await gp.embeddings.fake().embed("hello")` works in a runtime integration test.
- `await gp.embeddings.fake().embedMany(["a", "b"])` preserves order.
- `await gp.rerank.fake().rerank(...)` returns deterministic scores/order.
- `await gp.llm.fromConfig({ provider: "echo" }).generateText(...)` or equivalent fake path works without network.
- Errors reject Promises rather than returning ambiguous `{ error }` objects unless the API explicitly documents result-style errors.

### Phase 3 — Add TypeScript declarations and examples

Geppetto already has generated declarations under `pkg/doc/types/geppetto.d.ts`. The goja-repl TypeScript guide recommends implementing `modules.TypeScriptDeclarer` and using generator/check flows to prevent drift.

Add declarations for:

- `LLMNamespace`
- `LLMClient`
- `EmbeddingsNamespace`
- `EmbeddingClient`
- `RerankNamespace`
- `RerankClient`

Add runnable examples under `examples/js/geppetto/`:

```text
25_llm_generate_text.js
26_embeddings_fake_batch.js
27_rerank_fake.js
28_rag_retrieval_primitives_preview.js   # optional after raglab exists
```

Acceptance criteria:

- Declaration generation/check passes.
- Examples are included in a smoke script or test.
- README lists the new namespaces and examples.

### Phase 4 — Add rag-eval `raglab` service package

In rag-eval, create pure Go services first:

```text
internal/jslab/workspace
internal/jslab/markdown
internal/jslab/experiments
```

The service layer should have no goja dependency. It should wrap existing rag-eval services:

- `internal/services/document`
- `internal/services/chunking`
- `internal/services/embedding`
- `internal/services/search`
- `internal/services/documentprocessing`
- `internal/services/chunkenrichment`

Design rule: if an operation already exists as a rag-eval service, call that service rather than rewriting SQL or filesystem logic in the JS adapter.

Acceptance criteria:

- Pure Go tests can open a temp workspace DB, add/import a document, chunk text, store chunks, query stored data, and write an experiment manifest.
- Parent directories are created automatically for workspace roots and manifest paths.

### Phase 5 — Add rag-eval `require("raglab")` native module

Add adapter package:

```text
internal/jslab/module
```

Module implementation pattern:

```go
type module struct{}

func (m *module) Name() string { return "raglab" }
func (m *module) Doc() string  { return "RAG Evaluation System lab primitives." }
func (m *module) Loader(vm *goja.Runtime, moduleObj *goja.Object) {
    exports := moduleObj.Get("exports").(*goja.Object)
    // set workspace, markdown, prompts namespaces
}

func init() {
    modules.Register(&module{})
}
```

Runtime creation should blank-import the module package or explicitly add it to the runtime builder before scripts run.

Acceptance criteria:

- A runtime integration test executes:

```javascript
const rag = require("raglab");
const ws = rag.workspace.open({ dbPath, root });
const doc = ws.documents.importText({ id: "demo", text: "# Hello" });
const chunks = rag.markdown.chunk(doc.contentText, { maxChars: 100 });
ws.store.replaceChunks(doc.id, chunks, { strategyId: "test" });
ws.experiments.record({ event: "ok" });
```

- The test asserts real DB rows and manifest files, not just lack of JS errors.

### Phase 6 — Add a script runner CLI for rag-eval experiments

Add a CLI such as:

```bash
rag-eval lab run --script experiments/demo.js --db state/eval.db --workspace-root lab-runs/demo
```

Suggested flags:

```text
--script PATH
--db PATH
--workspace-root PATH
--index-root PATH
--profile-registries PATH[,PATH]
--allow-network=false
--allow-write=true
--timeout 5m
--json
```

The runner should:

1. create an owned Goja runtime;
2. install `geppetto` with host-approved options;
3. install `raglab` with scoped DB/workspace permissions;
4. load a CommonJS script or bundled script;
5. wait for top-level Promise completion if the harness supports it;
6. return structured output and write experiment metadata.

Acceptance criteria:

- Fake-provider script runs in CI.
- Live-provider script is opt-in and bounded.
- CLI prints the experiment run directory and manifest path.

## Testing Strategy

### Pure Go tests

- Geppetto LLM facade with fake/echo engine.
- Geppetto embeddings provider construction and fake vectors.
- Geppetto rerank fake provider and validation.
- rag-eval workspace open/import/store/query/experiment manifest.

### Goja runtime integration tests

- `require("geppetto")` exposes `llm`, `embeddings`, and `rerank`.
- `await` works for each async primitive.
- Promise rejection works for invalid inputs.
- `require("raglab")` opens a temp DB and writes real artifacts.
- A combined script uses `gp.embeddings.fake()` plus `raglab` chunk storage.

### CLI smoke tests

- `rag-eval lab run --script testdata/fake_embedding_experiment.js --db <temp> --workspace-root <temp>`.
- Optional live smoke only when explicit env vars/flags are set.

### Type/declaration checks

- Geppetto declaration generation/check.
- If raglab has TypeScript declarations, add a drift check for those too.

## Error Semantics

Use thrown JS errors / rejected Promises for programmer and provider failures:

- invalid options;
- missing profile;
- provider construction failure;
- network/API failure;
- embedding dimension mismatch;
- reranker result count mismatch;
- workspace permission failure.

Use structured result fields for normal domain outcomes:

- no documents found;
- zero candidates returned;
- empty input batch;
- experiment metrics with failed assertions.

Example:

```javascript
try {
  const vectors = await embedder.embedMany(texts);
} catch (err) {
  ws.experiments.record({ type: "embedding-error", message: String(err) });
  throw err;
}
```

## Security and Capability Boundaries

The lab runtime should not expose more host power than necessary.

- Network access is implicit in live Geppetto providers and should require explicit host flags/config.
- Filesystem access should be scoped to the workspace root unless the user explicitly passes paths.
- Database paths should be explicit.
- Scripts should not automatically inherit all Node modules.
- Secrets should come from host profile/config resolution, not be printed into manifests.
- Experiment manifests should record provider/model/profile names, but not API keys.

## Intern Implementation Checklist

1. Read:
   - `sources/01-goja-repl-help-all.txt`
   - `sources/goja-creating-modules.txt`
   - `sources/goja-async-patterns.txt`
   - `sources/goja-typescript-declaration-generator.txt`
   - `geppetto/pkg/js/modules/geppetto/module.go`
   - `geppetto/pkg/embeddings/embeddings.go`
2. Verify the actual JS harness command in Geppetto.
3. Add pure Go service primitives before JS adapters.
4. Add fake providers before live providers.
5. Add JS adapters with Promise-safe runtime owner usage.
6. Add runtime integration tests that call `require(...)` from JavaScript.
7. Add declarations and examples.
8. Add rag-eval `raglab` services and module.
9. Add `rag-eval lab run` CLI.
10. Run tests and document any live-provider caveats.

## Risks and Mitigations

### Risk: blocking the Goja owner thread

If synchronous JS calls block while waiting for goroutines that need to settle Promises on the owner, the runtime can deadlock.

Mitigation: all provider calls return Promises; all Promise settlements post back through runtimebridge helpers.

### Risk: API surface grows into a pipeline framework too early

If the first version exposes `runExperimentPipeline(config)`, it will encode assumptions before enough experiments exist.

Mitigation: expose low-level clients and storage primitives. Add higher-level helpers only after repeated scripts show stable patterns.

### Risk: duplicating provider code in rag-eval

RAG experiments need LLMs, embeddings, and rerankers, but duplicating those clients in rag-eval would diverge from Geppetto.

Mitigation: Geppetto owns all intelligence provider implementations; rag-eval only consumes results.

### Risk: documentation drift

Current Geppetto JS docs appear to reference a harness path not present in the inspected checkout.

Mitigation: implementation must update docs and include smoke tests for documented commands.

### Risk: TypeScript declarations drift from runtime exports

Mitigation: use declaration generation/checks and commit generated `.d.ts` updates with runtime API changes.

## Open Questions

1. What is the canonical Geppetto JS harness command in the current repository, given the missing `cmd/examples/geppetto-js-lab` path?
2. Should `gp.llm.generateText` return only text by default, or always return `{ text, turn, usage }`?
3. Which reranking provider should be implemented first after the fake provider?
4. Should rag-eval's JS module be named `raglab`, `rageval`, or `ragEval`?
5. Should experiment manifests be a new rag-eval DB table, filesystem-only JSON, or both?
6. Should JS scripts be allowed to submit scraper workflows, or should that be a later module namespace?

## References

### Ticket-local sources

- `ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/sources/01-goja-repl-help-all.txt`
- `ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/sources/goja-creating-modules.txt`
- `ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/sources/goja-async-patterns.txt`
- `ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/sources/goja-typescript-declaration-generator.txt`
- `ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/sources/goja-nodejs-primitives.txt`

### go-go-goja files

- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/common.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/exports.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/fs/fs.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/timer/timer.go`

### Geppetto files

- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/README.md`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/doc/topics/13-js-api-reference.md`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/doc/topics/14-js-api-user-guide.md`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/js/modules/geppetto/module.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/js/runtime/runtime.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/embeddings/embeddings.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/embeddings/openai.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/embeddings/disk-cache.go`

### rag-eval files that will shape the lab layer

- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/services/chunking/service.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/services/embedding/provider.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/services/search/service.go`
- `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/workflow/intake_runner.go`
