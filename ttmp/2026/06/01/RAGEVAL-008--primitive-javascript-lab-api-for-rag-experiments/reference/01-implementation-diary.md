---
Title: Implementation diary
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
    - Path: ../../../../../../../geppetto/README.md
      Note: Documents current Geppetto JS API and revealed possible stale harness command
    - Path: ../../../../../../../geppetto/pkg/doc/topics/13-js-api-reference.md
      Note: Current JavaScript API reference for require geppetto
    - Path: ../../../../../../../geppetto/pkg/doc/topics/14-js-api-user-guide.md
      Note: Current JavaScript user guide for profile and runner split
    - Path: ../../../../../../../go-go-goja/modules/timer/timer.go
      Note: Async Promise implementation example that shaped runtime-owner guidance
ExternalSources: []
Summary: Chronological diary for the primitive JavaScript lab API design ticket.
LastUpdated: 2026-06-01T10:30:00-04:00
WhatFor: Use this diary to resume or review the RAGEVAL-008 design effort without reconstructing what was inspected and why.
WhenToUse: Read before implementing the Geppetto JS primitives or rag-eval raglab module proposed by this ticket.
---


# Diary

## Goal

This diary records the investigation and design work for RAGEVAL-008: a primitive JavaScript lab API for RAG experiments backed by `go-go-goja`, with LLM, embeddings, and reranking primitives implemented in `geppetto/` and rag-eval-specific storage/query primitives kept in the RAG Evaluation System.

## Step 1: Create the ticket and capture Goja/Geppetto evidence

I created the RAGEVAL-008 ticket workspace and gathered the source material needed to design the API from evidence rather than guessing. The key early decision was to treat `goja-repl help --all` and the existing Geppetto Goja module as constraints: this API must be a native `require()` surface, must respect Goja owner-thread safety, and must produce documentation and TypeScript declarations that an intern can rely on.

I also inspected Geppetto's existing JavaScript module and embeddings package. That confirmed that LLM/runtime/profile concepts already live in Geppetto, embeddings already have a provider interface, and reranking appears to need a new first-class Geppetto package before it can be exposed cleanly to JavaScript.

### Prompt Context

**User prompt (verbatim):** "The user asked to create a new ticket for building a JavaScript API backed by `go-go-goja`, with the LLM / Embeddings / Reranking implementation living in `geppetto/`. They specifically requested: read `goja-repl help --all` carefully and understand implications; inspect existing Goja modules in `geppetto/`, noting they may not be fully adapted; create a detailed intern-friendly analysis/design/implementation guide with prose, bullets, pseudocode, diagrams, API references, and file references; store the guide in the ticket; upload it to reMarkable; keep a work diary while proceeding."  

**Assistant interpretation:** Create a docmgr ticket and produce a rigorous design guide for a future Goja-backed RAG experiment JavaScript API, grounded in current go-go-goja and Geppetto implementation details.

**Inferred user intent:** The user wants a durable, reviewable plan that an intern can follow to implement the JavaScript primitives safely, without mixing rag-eval storage concerns into Geppetto provider logic or violating Goja async/threading rules.

**Commit (code):** N/A — documentation/design work only so far.

### What I did

- Created ticket `RAGEVAL-008` with title `Primitive JavaScript Lab API for RAG Experiments`.
- Added design doc `ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/design-doc/01-primitive-javascript-lab-api-design-and-implementation-guide.md`.
- Added diary doc `ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/reference/01-implementation-diary.md`.
- Captured `goja-repl help --all` into `sources/01-goja-repl-help-all.txt`.
- Captured relevant `goja-repl help <topic>` pages into ticket-local `sources/` files.
- Read Goja native module and async guidance, especially the `modules.NativeModule` pattern and runtime-owner Promise settlement rule.
- Inspected `go-go-goja/modules/common.go`, `modules/exports.go`, `modules/fs/fs.go`, and `modules/timer/timer.go`.
- Inspected Geppetto's `require("geppetto")` module in `pkg/js/modules/geppetto/module.go`.
- Inspected Geppetto's runtime constructor in `pkg/js/runtime/runtime.go`.
- Inspected Geppetto's embeddings provider interface and OpenAI implementation under `pkg/embeddings/`.

### Why

- The requested API crosses repository boundaries, so the design needed to establish ownership before proposing code.
- `go-go-goja` native module patterns determine how any JavaScript-facing API must be wired.
- Geppetto already owns provider/profile/runtime concepts, so duplicating LLM and embedding client logic in rag-eval would create drift.
- Reranking was not found as a first-class Geppetto package, so the design needed to call out that gap explicitly.

### What worked

- The `goja-repl` help pages provided clear guidance on module authoring, async patterns, TypeScript declarations, and runtime capabilities.
- Geppetto already has a coherent `require("geppetto")` module with namespaces for turns, engines, profiles, runner, schemas, middlewares, events, and tools.
- Geppetto already has an embeddings `Provider` interface with single and batch methods, which is a good base for a JS adapter.
- The previous RAGEVAL-006 brainstorming mapped cleanly onto a two-layer design: Geppetto owns intelligence primitives; rag-eval owns workspace/database/query/experiment primitives.

### What didn't work

- The Geppetto README and JS docs mention:

```text
go run ./cmd/examples/geppetto-js-lab --script examples/js/geppetto/01_turns_and_blocks.js
```

  but the inspected checkout did not contain `cmd/examples/geppetto-js-lab/main.go` or a matching directory under `cmd/examples/`. This appears to be documentation drift and is recorded as a Phase 0 implementation follow-up.

- A search for reranking in Geppetto did not reveal a first-class reranking package:

```text
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto && rg -n "embed|embedding|rerank|reranker|rank" pkg cmd examples -S
```

  The search found embeddings packages but no obvious `pkg/rerank` provider equivalent.

### What I learned

- `go-go-goja` modules should be implemented as small adapters: `Name()`, `Doc()`, and `Loader(*goja.Runtime, *goja.Object)`.
- Geppetto's module is not a generic default-registry module; it registers through `geppetto.Register(reg, opts)` and carries host options such as runtime owner, tool registry, middleware factories, profile registry, event sinks, and persister hooks.
- Async provider calls must copy inputs into Go values, do blocking work away from the VM owner, and post Promise settlement back to the runtime owner.
- Embeddings are already much closer to JS exposure than reranking because `pkg/embeddings.Provider` exists.
- The implementation should begin with fake providers and runtime integration tests, not live providers.

### What was tricky to build

The trickiest part was deciding where the API boundary belongs. A single `require("raglab")` module could expose everything, including LLMs and embeddings, but that would put provider implementation pressure on rag-eval. Conversely, putting workspace/database/query helpers into Geppetto would pollute Geppetto with application-specific RAG Evaluation System concepts.

The solution is a two-layer boundary: extend `require("geppetto")` with `llm`, `embeddings`, and `rerank` namespaces, then add a rag-eval-owned `require("raglab")` module for workspace, document, storage, query, and experiment operations. This preserves ownership while still giving scripts a cohesive lab-bench experience.

### What warrants a second pair of eyes

- Whether the proposed namespace names should be `gp.llm`, `gp.embeddings`, and `gp.rerank`, or whether Geppetto maintainers prefer a different naming convention.
- Whether `gp.llm.generateText` should be a thin wrapper over the existing runner or should expose a new lower-level service facade first.
- Whether `raglab` is the right module name for rag-eval primitives.
- Whether experiment manifests should be filesystem-only at first or should also be backed by a rag-eval DB table.

### What should be done in the future

- Restore or update the Geppetto JS lab harness documentation before adding more examples.
- Add `pkg/rerank` to Geppetto with a fake provider before any JS rerank adapter.
- Add TypeScript declarations and drift checks at the same time as runtime exports.
- Add a bounded fake-provider `rag-eval lab run` smoke test after the raglab module exists.

### Code review instructions

- Start with the design doc:
  - `ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/design-doc/01-primitive-javascript-lab-api-design-and-implementation-guide.md`
- Check the evidence files cited there:
  - `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/common.go`
  - `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/js/modules/geppetto/module.go`
  - `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/geppetto/pkg/embeddings/embeddings.go`
- Validate ticket hygiene with:

```bash
docmgr doctor --ticket RAGEVAL-008 --stale-after 30
```

### Technical details

The core implementation patterns identified so far are:

```go
type NativeModule interface {
    Name() string
    Doc() string
    Loader(*goja.Runtime, *goja.Object)
}
```

```go
func (m *module) Loader(vm *goja.Runtime, moduleObj *goja.Object) {
    exports := moduleObj.Get("exports").(*goja.Object)
    // install JS-facing namespaces and functions here
}
```

The high-level target shape is:

```javascript
const gp = require("geppetto");
const rag = require("raglab");

const embedder = gp.embeddings.fromProfile({ profileSlug: "openai-small" });
const reranker = gp.rerank.fake();
const ws = rag.workspace.open({ dbPath: "state/eval.db", root: "lab-runs/demo" });
```

## Step 2: Write the Geppetto implementer handoff

I added a focused handoff document for the developer who will implement the Geppetto portion of the JavaScript API. The design guide explains the whole cross-repository concept; the handoff narrows the frame to what should happen first in `geppetto/`: verify the JS harness, add the provider-side primitives, expose `gp.llm`, `gp.embeddings`, and `gp.rerank`, and keep runtime-owner async safety central.

The handoff is written in a textbook style because the next developer needs more than a checklist. They need to understand the boundary. Geppetto should become the provider runtime for JavaScript intelligence primitives, while rag-eval later owns workspace, corpus, search, and experiment storage through a separate module.

### Prompt Context

**User prompt (verbatim):** "Create a handoff document to a developer who is going to work on the JS API in geppetto, on what you would like to see, what the current status is, what is needed, etc...

Store in the ticket. upload to remarkable. Write in a textbook writing style."

**Assistant interpretation:** Add a ticket-local handoff reference document that tells a Geppetto implementer what to build, what exists now, what to avoid, what files to read, and how to validate the work; then upload that document to reMarkable.

**Inferred user intent:** The user wants the next developer to start implementation with a clear conceptual model and concrete work plan, without needing to reconstruct the design discussion from prior conversation history.

**Commit (code):** N/A — documentation update only at this step.

### What I did

- Added `reference/02-developer-handoff-geppetto-js-api.md` under the RAGEVAL-008 ticket.
- Wrote the handoff around the Geppetto-specific scope: `gp.llm`, `gp.embeddings`, and `gp.rerank`.
- Documented current status, desired end state, implementation order, acceptance criteria, and review checklist.
- Related the handoff to the most important Geppetto files, including `module.go`, `api_engines.go`, `api_runner.go`, `api_owner_bridge.go`, `pkg/embeddings/embeddings.go`, and `pkg/doc/types/geppetto.d.ts`.
- Updated `tasks.md` to include the handoff and upload work.

### Why

- The existing design guide is broad and includes future rag-eval `raglab` work. The implementer needs a smaller entry document focused on Geppetto.
- The most important implementation risk is not naming; it is accidentally mixing boundaries or violating Goja async ownership rules.
- A handoff document makes the first pull requests obvious: repair/confirm the harness, add embeddings fake JS API, add rerank package and fake JS API, then add LLM convenience API.

### What worked

- The design guide already contained enough evidence to produce a concise implementer-facing handoff.
- The textbook style fit the subject well because the work depends on understanding responsibility boundaries before writing adapter code.
- `docmgr doc relate` cleanly attached the implementation-relevant Geppetto files to the handoff document.

### What didn't work

- No implementation or tests were run for Geppetto because this step was intentionally documentation-only.
- The known stale-harness issue remains open: the Geppetto README references `cmd/examples/geppetto-js-lab`, but that path was not present in the inspected checkout.

### What I learned

- The handoff should emphasize `gp.embeddings` as the best first implementation target because Geppetto already has a provider interface.
- Reranking should start as a pure Go package with a fake provider before any JS adapter or live provider is introduced.
- The LLM convenience layer should reuse the existing engine/runner machinery rather than creating a second inference stack.

### What was tricky to build

The main challenge was avoiding duplication with the full design guide. The handoff needed to be actionable for a developer, not a second architecture essay. I handled that by making it Geppetto-specific: desired end state, current status, boundary, API sketch, files to read, implementation order, acceptance criteria, and suggested first PRs.

The other tricky part was keeping the style explanatory without making it vague. The handoff uses concrete TypeScript-like interfaces, file paths, test names, and command expectations so the prose remains tied to implementation.

### What warrants a second pair of eyes

- Whether the suggested first PR order matches the Geppetto maintainer's preference.
- Whether `gp.llm`, `gp.embeddings`, and `gp.rerank` are the right namespace names.
- Whether `gp.llm.fake()` should exist as a public API or only as a test helper.
- Whether `cosineSimilarity` belongs under `gp.embeddings`.

### What should be done in the future

- Upload the handoff to reMarkable and record the result in the changelog.
- Commit the updated ticket documents.
- Start implementation with the harness repair/confirmation PR.

### Code review instructions

- Review the new handoff first:
  - `ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/reference/02-developer-handoff-geppetto-js-api.md`
- Check that it stays consistent with the broader design guide:
  - `ttmp/2026/06/01/RAGEVAL-008--primitive-javascript-lab-api-for-rag-experiments/design-doc/01-primitive-javascript-lab-api-design-and-implementation-guide.md`
- Validate ticket hygiene with:

```bash
docmgr doctor --ticket RAGEVAL-008 --stale-after 30
```

### Technical details

The handoff's implementation sequence is:

1. Repair or confirm the documented Geppetto JS harness.
2. Add pure Go service/provider primitives first.
3. Add `gp.llm`, `gp.embeddings`, and `gp.rerank` JS adapters.
4. Use Promise-safe runtime-owner settlement for blocking calls.
5. Add runtime integration tests with fake providers.
6. Add TypeScript declarations and runnable examples.
