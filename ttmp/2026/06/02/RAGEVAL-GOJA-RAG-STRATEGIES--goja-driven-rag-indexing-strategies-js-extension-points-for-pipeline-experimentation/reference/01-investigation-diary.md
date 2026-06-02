---
title: Investigation Diary
type: reference
status: active
intent: long-term
topics: [rag, goja, embeddings, chunking, search, xgoja, scraper, geppetto]
ticket: RAGEVAL-GOJA-RAG-STRATEGIES
---

# Diary

## Goal

Chronological investigation diary for the RAGEVAL-GOJA-RAG-STRATEGIES ticket: exploring how goja JS extension points can drive RAG pipeline experimentation, how scraper's JS runner, geppetto's goja module, and xgoja codegen can be combined.

## Step 1: System Architecture Survey

This step maps the full landscape of components that exist in the workspace and how they interconnect. The goal was to understand what already works, what is extensible, and where the gaps are for JS-driven RAG strategy experimentation.

### Prompt Context

**User prompt (verbatim):** "I want to experiment with different RAG strategies, ideally by writing short scripts and then devising some UI screens for querying the results. I am talking about 2026-05-27--rag-evaluation-system/ . What ways could I have to do things like: get articles as markdown, compute summaries and other traditional search facts / index terms using an LLM, chunk by markdown sections and augment each section with context using an LLM, compute embeddings on each section. We have a goja-text module that allows us to add goja JS functionality, and we have geppetto goja backing. Is it possible to run and schedule JS fragments within the rag evaluation system ? Create a new ticket with docmgr about this exploration of RAG and indexing strategies, especially geared towards goja, and Create a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet points and pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and then upload to remarkable. Investigate the work done so far, how it interacts with scraper, (scraper was started as something that can run jobs written in JS). There's also the possibility to add goja extension points using `xgoja help --all` which is a tool to codegen code that binds / expands functionality"

**Assistant interpretation:** Create a comprehensive intern-ready design document covering the RAG evaluation system architecture, how goja JS scripting fits in, how scraper/geppetto/xgoja interoperate, and propose a concrete implementation path for JS-driven RAG pipeline experimentation.

**Inferred user intent:** The user wants a practical, explorable path for writing short JS scripts that drive RAG indexing strategies (chunking, enrichment, embeddings, search), with goja as the scripting engine and scraper's workflow engine as the scheduler. They also want this documented thoroughly for an intern to pick up.

### What I did

- Mapped the full workspace structure: `2026-05-27--rag-evaluation-system/`, `scraper/`, `geppetto/`, `go-go-goja/`, `pinocchio/`, `glazed/`
- Read the RAG evaluation system's Go source: `cmd/rag-eval/main.go`, workflow engine, intake runner, ops definitions, DB queries, chunking strategies, document processing, embeddings, search
- Read scraper's JS runtime executor (`pkg/js/runtime/executor.go`), the JS runner (`pkg/engine/runner/js.go`), and the site registry
- Read geppetto's goja module (`pkg/js/modules/geppetto/module.go`) and its JS embeddings wrapper (`pkg/js/embeddings-js.go`)
- Examined xgoja CLI help and example `xgoja.yaml` files
- Examined the RAG evaluation system's API handlers and web UI structure
- Created the docmgr ticket RAGEVAL-GOJA-RAG-STRATEGIES with a design doc and diary

### Why

Before designing the goja extension points, I needed to understand every layer: how scraper dispatches JS ops, how goja modules are registered and loaded, how geppetto exposes LLM inference to JS, and how the RAG evaluation system currently wires Go services together.

### What worked

- The scraper JS runtime executor is already a mature system: it loads JS scripts from an `fs.FS`, registers goja modules, builds a runtime via `gggengine.Builder`, and executes JS functions that receive a rich `ctx` object with `log()`, `dep()`, `emit()`, `writeRecord()`, `writeArtifact()`.
- The geppetto goja module exposes a full inference API to JS: `require("geppetto")` gives you `runInference()`, `createBuilder()`, `createSession()`, profile resolution, tool registries, middleware factories, and event sinks.
- xgoja can codegen a custom binary that bundles selected goja modules (core, database, geppetto, etc.) into a standalone REPL/eval/run CLI.
- The RAG evaluation system already uses scraper's scheduler and store for durable workflow execution.

### What didn't work

- There is no `goja-text` module in the workspace yet (searched for it, not found). The user mentioned it, but it may be planned or in a different location.
- The RAG evaluation system's `IntakeRunner` dispatches Go-coded operations only; there is no JS op kind today.
- The `IntakeRunner` uses Go-native resolvers for embedding/document-processing/chunk-enrichment providers; bridging these to JS would require new goja module bindings.
- Scraper's JS runner works within scraper's site/verb model; adapting it for RAG evaluation ops would require a new site definition or a generic "rag-eval-js" site.

### What I learned

- The architecture has three distinct integration surfaces:
  1. **Scraper JS Runner** — run JS as an op kind within scraper workflows (the `JSRunner` in `scraper/pkg/engine/runner/js.go`)
  2. **Goja Module in RAG Eval Binary** — add a `require("rag-eval")` or `require("rag-ops")` module that wraps the existing Go services for use from JS
  3. **xgoja Custom Binary** — codegen a standalone tool that bundles rag-eval modules with geppetto for ad-hoc experimentation
- The most natural integration path is to add a new op kind `js_pipeline` to the RAG evaluation workflow engine, where the op's JS script is loaded from an embedded FS or a scripts directory, and the script can call `require("geppetto")` for LLM calls and `require("rag-ops")` for corpus operations.
- The geppetto module already handles the hard part (async LLM calls from goja), so the main work is exposing the RAG service layer as a goja native module.

### What was tricky to build

- Understanding the ownership chain: scraper owns the scheduler/store/runner model; go-go-goja owns the goja runtime builder; geppetto owns the LLM module. The RAG evaluation system imports from all three, but each has its own runtime lifecycle. Wiring them requires careful attention to which runtime owns the VM, which context carries cancellation, and how async LLM promises interact with the scraper op execution loop.

### What warrants a second pair of eyes

- The approach of adding a `js_pipeline` op kind vs. creating a separate xgoja binary. Both are valid; the trade-off is workflow durability (scraper) vs. REPL ergonomics (xgoja).
- The security boundary of letting JS scripts call LLM providers directly from within scraper ops. Rate limits and API key exposure need careful handling.

### What should be done in the future

- Implement the `rag-ops` goja module (Phase 1)
- Add the `js_pipeline` op kind to the RAG evaluation workflow (Phase 2)
- Create xgoja.yaml for a standalone RAG experimentation binary (Phase 3)
- Add `goja-text` module for markdown parsing/section splitting from JS (needs investigation)

### Code review instructions

- Start with `internal/workflow/intake_runner.go` and `internal/workflow/ops.go` to understand the current op dispatch
- Compare with `scraper/pkg/engine/runner/js.go` to see the JS runner pattern
- Look at `geppetto/pkg/js/modules/geppetto/module.go` for the goja module registration pattern

### Technical details

- Scraper JS execution flow: `JSRunner.Run()` → `Executor.Execute()` → `gggengine.Builder.Build()` → `factory.NewRuntime()` → `runtime.Owner.Call()` → `require(script)` → `fn(ctx)` → result serialized to `OpResult`
- The `ctx` object available in JS: `{ site, now, workflow, op, lease, input, log(), dep(), emit(), writeRecord(), writeArtifact() }`
- Geppetto module JS API: `{ version, createBuilder, createSession, runInference, turns, engines, profiles, runner, schemas, middlewares, events, tools }`

## Step 2: Design Document Creation and reMarkable Upload

Completed the full analysis document (65KB, 12 sections) covering system overview, all component architectures, proposed `rag-ops` goja module with full TypeScript API declaration, 4 example JS-driven RAG strategies, 4-phase implementation plan, decision records, and diagrams. Uploaded the design doc + diary bundle to reMarkable at `/ai/2026/06/02/RAGEVAL-GOJA-RAG-STRATEGIES`.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Complete the deliverable: write the comprehensive design document and upload to reMarkable.

**Inferred user intent:** Produce the full intern-ready guide and deliver it to reMarkable for reading.

### What I did

- Wrote the design document with 12 sections: System Overview, RAG Eval System, Scraper Workflow Engine, Goja JS Engine, Geppetto LLM Module, Xgoja Codegen, Integration Architecture, Proposed JS Strategies, Implementation Phases, API Reference, File Reference, Diagrams
- Added 4 complete JS strategy examples (LLM summaries as index terms, markdown section chunking with context enrichment, keyword-enhanced embeddings, multi-grain hierarchical index)
- Added 3 decision records (module naming, DB access pattern, script loading)
- Created docmgr ticket with tasks for 4 phases + goja-text investigation
- Added vocabulary entries for new topics (chunking, geppetto, goja, xgoja)
- Ran docmgr doctor (clean pass)
- Uploaded design doc + diary bundle to reMarkable

### Why

The user needs the complete guide available on reMarkable for reading, and the ticket structure for tracking implementation work.

### What worked

- The design doc covers every component the user asked about with file references and pseudocode
- The rag-ops module API is fully specified with TypeScript declarations
- The 4 JS strategy examples are concrete and runnable (modulo the rag-ops module not existing yet)
- reMarkable upload succeeded on first attempt

### What didn't work

- The `goja-text` module still hasn't been located — this remains an open question

### What I learned

- The integration architecture has 3 clear surfaces: scraper JS runner (durable), rag-ops goja module (composable), xgoja binary (ergonomic)
- The most efficient implementation order is: rag-ops module → js_pipeline op → xgoja binary → UI
- The geppetto module already solves the hardest problem (async LLM from goja), so the main new work is the rag-ops service layer wrapper

### What was tricky to build

- Balancing depth vs. brevity in the design doc. The intern-readability requirement means each section needs context that an experienced dev would skip.

### What warrants a second pair of eyes

- The proposed rag-ops module API surface. Is it too thin (just wrapping services) or does it need higher-level abstractions (e.g., `ragOps.pipeline.run(strategyName)`)?
- The decision to use the Go service layer rather than raw SQL in the rag-ops module.

### What should be done in the future

- Implement Phase 1 (rag-ops module)
- Locate or create the goja-text module
- Add streaming LLM support to geppetto's goja module

### Code review instructions

- Read the design doc sections 7 (Integration Architecture) and 9 (Implementation Phases) first
- Then review the rag-ops module API in section 10
- Compare with scraper's `pkg/js/runtime/executor.go` for the execution pattern

### Technical details

- reMarkable upload path: `/ai/2026/06/02/RAGEVAL-GOJA-RAG-STRATEGIES`
- Bundle name: `RAGEVAL-GOJA-RAG-STRATEGIES Design and Diary`
- Design doc: 65KB, ~1500 lines of Markdown
- Diary: ~8KB
