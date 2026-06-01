---
Title: Developer Handoff - Geppetto JS API
Ticket: RAGEVAL-008
Status: active
Topics:
    - rag
    - intake
    - workflow
    - design
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../geppetto/pkg/doc/types/geppetto.d.ts
      Note: TypeScript declaration surface that should be updated with new exports
    - Path: ../../../../../../../geppetto/pkg/embeddings/embeddings.go
      Note: Existing embeddings provider abstraction to wrap from JavaScript
    - Path: ../../../../../../../geppetto/pkg/js/modules/geppetto/api_engines.go
      Note: Existing engine construction path that should inform gp.llm and provider config handling
    - Path: ../../../../../../../geppetto/pkg/js/modules/geppetto/api_owner_bridge.go
      Note: Existing owner bridge helpers relevant to Promise-safe async calls
    - Path: ../../../../../../../geppetto/pkg/js/modules/geppetto/api_runner.go
      Note: Existing runner API that should inform generateText convenience behavior
    - Path: ../../../../../../../geppetto/pkg/js/modules/geppetto/module.go
      Note: Current require geppetto module entrypoint to extend with llm embeddings and rerank namespaces
ExternalSources: []
Summary: Textbook-style handoff for the developer implementing the Geppetto side of the primitive JavaScript RAG experiment API.
LastUpdated: 2026-06-01T11:15:00-04:00
WhatFor: Use this as the practical starting brief for implementing gp.llm, gp.embeddings, and gp.rerank in Geppetto.
WhenToUse: Read before writing code in geppetto/pkg/js/modules/geppetto or adding provider packages for JavaScript RAG experiment primitives.
---


# Developer Handoff: Geppetto JavaScript API for RAG Experiments

## Goal

This handoff is for the developer who will implement the Geppetto side of RAGEVAL-008. By the end of this document, you should know what we want the JavaScript API to feel like, what Geppetto already has, what is missing, which files matter, and what order to implement the work in.

The short version is this: Geppetto should expose low-level intelligence primitives to JavaScript. Those primitives are LLM calls, embeddings, and reranking. They should be available through `require("geppetto")`, should work in a Goja runtime, should be safe around Goja's single-threaded VM ownership model, and should be tested with deterministic fake providers before any live provider is required.

This is not a request to build a RAG pipeline framework inside Geppetto. The RAG Evaluation System will later own corpus storage, chunk persistence, search indexes, experiment manifests, and workflow integration. Geppetto's job is narrower and cleaner: provide the provider-backed intelligence operations that other systems can compose.

## The Desired End State

The developer experience should be simple enough that a script author can stay in ordinary JavaScript. They should not have to understand Go interfaces, profile registry internals, session builders, or provider-specific SDKs before they can run a small experiment.

A first useful end state looks like this:

```javascript
const gp = require("geppetto");

const llm = gp.llm.fromProfile({ profileSlug: "gpt-5-nano-low" });
const embedder = gp.embeddings.fromProfile({ profileSlug: "openai-small" });
const reranker = gp.rerank.fake();

const vectors = await embedder.embedMany([
  "The warranty excludes accidental damage.",
  "Returns are allowed within thirty days.",
]);

const ranked = await reranker.rerank({
  query: "what damage is excluded from warranty?",
  documents: [
    { id: "a", text: "The warranty excludes accidental damage." },
    { id: "b", text: "Returns are allowed within thirty days." },
  ],
});

const answer = await llm.generateText({
  system: "Answer in one sentence.",
  prompt: `Use this evidence: ${ranked[0].text}`,
});

console.log(answer.text);
```

The important property of this example is not the exact naming. The important property is the separation of concerns. The script controls composition. Geppetto controls provider access. The host controls which modules and credentials are available.

## Current Status

RAGEVAL-008 is currently a design and handoff ticket. No implementation has started yet for the new JavaScript primitives. The ticket already contains a full design guide and captured source material from `goja-repl help --all`.

The ticket workspace is:

```text
ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/
```

The primary design guide is:

```text
ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/design-doc/01-primitive-javascript-lab-api-design-and-implementation-guide.md
```

The captured Goja help sources are under:

```text
ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/sources/
```

The key implementation facts established so far are:

| Area | Current state | What it means for you |
|---|---|---|
| Goja native modules | `go-go-goja` exposes modules with `Name()`, `Doc()`, and `Loader(*goja.Runtime, *goja.Object)`. | JavaScript API work must be implemented as native module adapter code, not as global runtime mutation. |
| Geppetto JS module | Geppetto already exposes `require("geppetto")` with namespaces such as `turns`, `engines`, `profiles`, `runner`, `schemas`, `middlewares`, `events`, and `tools`. | Extend the existing module; do not create a second competing LLM module. |
| Runtime ownership | Goja VM access is single-threaded. Async work must settle Promises through runtime-owner helpers. | Network-backed LLM, embedding, and rerank calls should return Promises and must not touch JS values from background goroutines. |
| Embeddings | Geppetto already has `pkg/embeddings.Provider` with single and batch methods, plus OpenAI and disk-cache providers. | `gp.embeddings` should wrap the existing provider interface instead of inventing a parallel implementation. |
| Reranking | No first-class Geppetto reranking package was found during investigation. | Add `pkg/rerank` or equivalent pure Go provider package before adding `gp.rerank`. |
| JS harness docs | The Geppetto README references `cmd/examples/geppetto-js-lab`, but that path was not present in the inspected checkout. | First implementation step should verify or repair the documented script-running path. |
| TypeScript declarations | Geppetto has generated declaration machinery and `pkg/doc/types/geppetto.d.ts`. | Runtime exports and declarations should change together. |

## The Boundary: What Belongs in Geppetto

Geppetto should own the operations that are provider-oriented and reusable outside rag-eval:

- create an LLM client from config or profile;
- generate text from a prompt;
- generate JSON from a prompt and schema-like options;
- create an embedding client from config or profile;
- embed one string;
- embed many strings while preserving input order;
- create a reranker from config or profile;
- rerank query/document candidates;
- expose model metadata in JavaScript-friendly shape;
- provide deterministic fake clients for tests and examples.

Geppetto should not own rag-eval's application storage:

- no rag-eval document table operations;
- no chunk table operations;
- no BM25 index persistence;
- no experiment manifest schema;
- no scraper workflow submission;
- no Corpus Explorer UI concepts.

Those belong in a later rag-eval module, likely `require("raglab")`. The Geppetto work should make that later module possible by providing reliable intelligence primitives.

## The API I Would Like to See

The first version should be small. A small API with strong tests is better than a broad API whose async behavior and type declarations are unclear.

### `gp.llm`

The existing `gp.engines` and `gp.runner` APIs are useful for lower-level composition. RAG experiment scripts need a simpler convenience layer. That layer should still use Geppetto's existing engine/profile machinery internally.

```typescript
interface LLMNamespace {
  fromConfig(options: LLMConfig): LLMClient;
  fromProfile(options: ProfileSelector): LLMClient;
  fake(options?: FakeLLMOptions): LLMClient;
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

A fake LLM matters. It gives CI a way to test the JS API without live credentials. It also gives users a way to learn the API without spending money.

### `gp.embeddings`

Embeddings should be the first serious primitive because Geppetto already has the provider interface. The first implementation should focus on correctness and order preservation.

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

The batch result must preserve input order. If the provider returns a different count from the input count, reject the Promise. A vector assigned to the wrong chunk is worse than a failed experiment because it corrupts downstream evidence.

### `gp.rerank`

Reranking is the missing primitive between retrieval and answer generation. It should be added as a pure Go package first, then exposed to JavaScript.

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

The `index` field is important. It tells the caller which original input document produced the result, even when documents do not have IDs. The `id` field is useful, but it is optional; `index` is the stable fallback.

## Files to Read Before Coding

Read these files before making implementation decisions:

| File | Why it matters |
|---|---|
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/common.go` | Defines the native module contract and default registry pattern. |
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/exports.go` | Shows the export helper used by native modules. |
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/timer/timer.go` | Shows Promise-based async module behavior and runtime-owner usage. |
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/js/modules/geppetto/module.go` | The current `require("geppetto")` entrypoint and namespace wiring. |
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/js/modules/geppetto/api_engines.go` | Existing engine construction from config/profile-like options. |
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/js/modules/geppetto/api_runner.go` | Existing runner APIs that can inform `gp.llm`. |
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/js/modules/geppetto/api_owner_bridge.go` | Existing owner-bridge helper methods inside the Geppetto JS module. |
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/js/runtime/runtime.go` | Owned runtime creation and Geppetto module registration. |
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/embeddings/embeddings.go` | Provider interface for single and batch embeddings. |
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/embeddings/openai.go` | Current OpenAI embedding provider. |
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/doc/types/geppetto.d.ts` | Current generated JavaScript type surface. |
| `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/examples/js/geppetto/README.md` | Current examples and profile fixture descriptions. |

Also read the ticket-local Goja help captures:

```text
ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/sources/goja-creating-modules.txt
ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/sources/goja-async-patterns.txt
ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/sources/goja-typescript-declaration-generator.txt
```

## Implementation Order

The order matters because each phase gives the next phase something stable to stand on.

### Phase 1: Repair or confirm the JS harness

Before adding APIs, make sure there is a documented way to run a Geppetto JavaScript file. The README currently points to a harness path that was not present in the inspected checkout.

A successful result for this phase is a command like this that actually works:

```bash
go run ./cmd/examples/geppetto-js-lab --script examples/js/geppetto/01_turns_and_blocks.js
```

If that command is no longer the intended path, update the README, JS API reference, and examples to the real command. Do not leave new examples attached to a stale runner.

### Phase 2: Add pure Go service primitives

Add or normalize Go code before adding JS adapter code. This keeps domain behavior testable without Goja.

For embeddings, reuse `pkg/embeddings.Provider`. Add any missing provider construction helpers needed by JS:

```go
func NewEmbeddingProviderFromConfig(cfg EmbeddingConfig) (embeddings.Provider, error)
func NewEmbeddingProviderFromProfile(reg profiles.RegistryReader, selector ProfileSelector) (embeddings.Provider, error)
```

For reranking, add a new package if none exists:

```text
pkg/rerank/
  rerank.go
  fake.go
  provider_*.go      # later, for live providers
  rerank_test.go
```

For LLM convenience, prefer a small facade over the existing engine and runner machinery. Avoid duplicating provider logic.

### Phase 3: Add Geppetto JS adapters

Add namespace-specific adapter files:

```text
pkg/js/modules/geppetto/api_llm.go
pkg/js/modules/geppetto/api_embeddings.go
pkg/js/modules/geppetto/api_rerank.go
```

Wire them in `installExports` in `module.go`:

```go
llmObj := m.vm.NewObject()
m.mustSet(llmObj, "fromConfig", m.llmFromConfig)
m.mustSet(llmObj, "fromProfile", m.llmFromProfile)
m.mustSet(llmObj, "fake", m.llmFake)
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

The adapter code should do three things and only three things:

- decode JavaScript options into Go structs;
- call Go services/providers;
- encode Go results back into JavaScript values or Promise settlements.

If you find yourself implementing provider behavior inside `api_embeddings.go` or `api_rerank.go`, stop and move that code into a pure Go package.

### Phase 4: Add Promise-safe async helpers

LLM, embedding, and reranking calls may block on network I/O. They should return Promises. The hard rule is that background goroutines must not touch `goja.Value`, JavaScript callbacks, or Promise resolution directly.

The shape should be:

```text
JS calls native function on owner thread
  -> adapter copies inputs into Go values
  -> adapter creates Promise
  -> goroutine calls provider with context
  -> goroutine posts result back to runtime owner
  -> owner resolves or rejects Promise
```

Pseudocode:

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

    go func() {
        result, err := work(callCtx)

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

Treat this as a sketch, not copy/paste code. Use the exact runtimebridge helpers available in the current Geppetto/go-go-goja version. The invariant is what matters: JavaScript values are owner-thread values.

### Phase 5: Add tests before live providers

The first test suite should not require API keys. It should use fake providers and runtime integration tests.

Minimum tests:

```text
pkg/embeddings or provider construction tests:
  - fake embedding provider returns deterministic dimensions
  - batch embedding preserves input order
  - empty batch returns empty result

pkg/rerank tests:
  - fake reranker returns deterministic scores
  - result index points at original input
  - empty documents are handled intentionally

pkg/js/modules/geppetto tests:
  - require("geppetto").embeddings.fake exists
  - await gp.embeddings.fake().embed("hello") resolves
  - await gp.embeddings.fake().embedMany(["a", "b"]) preserves order
  - invalid embedding input rejects the Promise
  - await gp.rerank.fake().rerank(...) resolves deterministic result
  - await gp.llm.fake().generateText(...) resolves text
```

A live provider smoke test can come later, behind explicit environment checks. It should not be the first proof that the adapter works.

### Phase 6: Add TypeScript declarations and examples

Update declarations when exports change. The runtime API and the type API should move together.

Add examples under:

```text
examples/js/geppetto/
```

Suggested files:

```text
25_llm_generate_text_fake.js
26_embeddings_fake_batch.js
27_rerank_fake.js
28_embeddings_profile_live_smoke.js      # opt-in only
```

The fake examples should run in CI. The live example should be clearly marked as opt-in.

## Acceptance Criteria

The Geppetto portion of RAGEVAL-008 is ready when these are true:

- `require("geppetto")` exposes `llm`, `embeddings`, and `rerank` namespaces.
- Each namespace has a deterministic fake path that works without credentials.
- Embedding batch results preserve input order and validate output count.
- Rerank results preserve original input identity via `index`, with optional `id` passthrough.
- LLM text generation has a simple Promise API that does not require direct session-builder usage.
- Async provider calls settle Promises through runtime-owner-safe code.
- JavaScript runtime integration tests exercise the actual `require("geppetto")` module.
- TypeScript declarations include the new API surface.
- Examples exist and the documented harness command works.
- Live provider smoke tests are opt-in and bounded.

## What I Do Not Want to See

Do not add a high-level RAG pipeline function to Geppetto as the first abstraction. A function like this would be premature:

```javascript
gp.rag.runPipeline({ documents, chunker, embedder, retriever, reranker, llm });
```

That may become useful later, but it should emerge from repeated scripts. The first version should expose primitives.

Do not put rag-eval database logic in Geppetto. Geppetto should not know about rag-eval document IDs, chunk strategies, `chunk_embeddings`, BM25 index paths, scraper workflows, or experiment tables.

Do not make live providers mandatory for tests. Fake providers are part of the architecture, not temporary scaffolding.

Do not resolve Promises from background goroutines directly. This is the most important correctness rule in the whole handoff.

Do not update runtime exports without updating docs, examples, and declarations. JavaScript APIs are partly social contracts; stale examples are API bugs.

## Review Checklist

When reviewing the implementation, start with these questions:

1. Can I run a fake JavaScript example from the README command?
2. Does the implementation keep provider logic outside the JS adapter files?
3. Does every blocking operation return a Promise?
4. Does every Promise settle on the runtime owner thread?
5. Does `embedMany` preserve input order under test?
6. Does reranking return both scores and original input indexes?
7. Are invalid options rejected with useful errors?
8. Are TypeScript declarations updated with the same commit as runtime exports?
9. Are live-provider tests opt-in?
10. Does the code make it easier for rag-eval to later build `require("raglab")` without copying provider logic?

## Suggested First Pull Requests

### PR 1: Harness and documentation repair

- Verify the current Geppetto JS harness.
- Restore or replace `cmd/examples/geppetto-js-lab` if needed.
- Update README and JS docs to a command that works.
- Add one smoke script that prints `Object.keys(require("geppetto"))`.

This PR should not add new provider APIs. Its purpose is to make later examples trustworthy.

### PR 2: Embeddings fake and JS API

- Add or reuse deterministic fake embeddings provider.
- Add `gp.embeddings.fake()`.
- Add `embed` and `embedMany` Promise methods.
- Add order-preservation and invalid-input tests.
- Add TypeScript declarations and example script.

This is the best first primitive because the existing provider interface is already present.

### PR 3: Rerank package and fake JS API

- Add `pkg/rerank` with provider interface and fake provider.
- Add `gp.rerank.fake()`.
- Add JavaScript runtime tests.
- Add TypeScript declarations and example script.

This PR establishes the missing provider abstraction before live reranking enters the system.

### PR 4: LLM convenience API

- Add `gp.llm.fake()`.
- Add `gp.llm.fromConfig()` and `gp.llm.fromProfile()` if the profile/config path is clear.
- Implement `generateText` first.
- Add `generateJson` only if schema/result semantics are clear enough to test.

This PR should reuse existing engine and runner behavior rather than creating a parallel inference system.

## Open Questions for the Implementer

- What is the current intended Geppetto JS harness command, and should the old documented command be restored or replaced?
- Should `gp.llm.generateText` return `{ text, turn, usage }` every time, or should there be a text-only convenience method as well?
- Should profile-based embeddings use existing `inference_settings.embeddings` fixtures directly, or is a small resolver package needed first?
- Which live reranking provider should be implemented first after the fake provider?
- Should `gp.embeddings.cosineSimilarity` live in Geppetto, or should vector math remain outside the provider namespace?
- Should all new clients expose `modelInfo`, or should embeddings/rerank use smaller model metadata objects?

## Closing Guidance

Build the smallest useful Geppetto layer that makes later RAG experiments possible. The implementation should make this sentence true:

> A Goja script can call LLM, embedding, and reranking primitives through `require("geppetto")`, with deterministic fake tests, Promise-safe async behavior, and documented TypeScript-visible APIs.

If the first implementation reaches that point, rag-eval can build its own `raglab` module on top without duplicating provider code. That is the architectural win: Geppetto remains the provider runtime, rag-eval remains the experiment system, and JavaScript becomes the composition language between them.
