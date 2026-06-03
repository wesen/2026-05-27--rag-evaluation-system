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

## Step 3: Goja-Text Module Investigation and Document Update

After the user added `./goja-text` to the workspace, I investigated it and updated the design document with a comprehensive new section.

### Prompt Context

**User prompt (verbatim):** "ok, I added ./goja-text to the workspace. update your document if necessary, after looking at goja-text documentation."

**Assistant interpretation:** Investigate the goja-text repository, understand its API surface, and integrate it into the design document.

**Inferred user intent:** The goja-text module is a key missing piece for RAG experimentation (Markdown parsing, JSON/YAML sanitization, structured data extraction). The user wants the design doc to reflect its capabilities.

### What I did

- Read goja-text README, AGENT.md, xgoja.yaml, all three module.go files, types.go, the xgoja provider, and the jsverbs
- Added Section 5 ("The Goja-Text Module") with 9 subsections covering: overview, three sub-modules, markdown API with TypeScript types and walk return values, sanitize API, extract API, why it matters for RAG, xgoja integration, Go embedding pattern, and key files table
- Updated Strategy 9.2 (Markdown Section Chunking) to use goja-text's `markdown.parse()` and `markdown.walk()` instead of rag-ops chunking, demonstrating AST-based section splitting with source positions
- Added Strategy 9.5 (Structured Extraction Pipeline) using `extract.all()` + `sanitize.json.sanitize()` + `extract.validate()` for end-to-end extraction with LLM JSON output repair
- Updated xgoja.yaml example to include goja-text provider and modules
- Updated xgoja REPL diagram to show markdown/sanitize/extract usage
- Updated DR-3 to reference goja-text's jsverb embedding pattern
- Resolved the goja-text open question (✅ found)
- Added vocabulary entries for goja-text, markdown, extract, sanitize topics
- Related 5 goja-text files to the ticket
- Updated changelog

### Why

Goja-text directly enables the RAG experimentation use case: Markdown parsing replaces Go-only chunking, sanitize repairs LLM JSON output, and extract finds embedded structured data in documents.

### What worked

- Goja-text's module registration pattern (`modules.NativeModule` + `init()` self-registration) is exactly what rag-ops should follow
- The `markdown.walk()` visitor with `"skip"/"stop"` return values is perfect for heading-based section extraction
- The `extract` + `sanitize` combo handles the common problem of LLM JSON output being slightly malformed
- Goja-text already has an xgoja provider package, so it's trivially composable with the proposed rag-eval-js binary

### What didn't work

- The `MarkdownHeadingChunker` in the existing Go code splits on `#` prefixes naively; goja-text's `markdown.walk()` with `StartLine` positions is strictly more precise. The doc should note this upgrade path.

### What I learned

- Goja-text follows the go-go-goja `modules.NativeModule` + `modules.Register()` pattern (not the `require.ModuleLoader` pattern used by geppetto). The rag-ops module should follow the goja-text pattern since it's the newer, cleaner approach.
- Goja-text already ships bundled jsverbs (toc, links, summary, list, validate, etc.) which are essentially the CLI versions of what RAG JS scripts would do programmatically.
- The `sanitize` module is critical for RAG because LLMs frequently produce slightly broken JSON (Python booleans, trailing commas, single quotes).

## Step 4: RAG Research Sources Collection

Searched for and downloaded 19 high-quality articles about RAG document preprocessing strategies, focusing on Anthropic's contextual retrieval, Jina AI's late chunking, metadata-driven RAG, semantic chunking, and hybrid search.

### Prompt Context

**User prompt (verbatim):** "look for the rag research by anthropic about adding context enrichment to the chunking, and potentially other recent articles about preprocessing documents for rag (either vector, but also traditional search / extracting metadata / what to index), high quality sources. Articles that are worth saving should be saved in the sources/ folder of the ticket, use defuddle to download them. You can also use `surf kagi assistant ...` and `surf chatgpt` for more information."

**Assistant interpretation:** Find and save key RAG preprocessing research papers and articles to the ticket sources folder, starting with Anthropic's contextual retrieval work.

**Inferred user intent:** Build a reference library of authoritative sources that inform the RAG evaluation system's design, particularly around chunk enrichment, metadata extraction, and indexing strategies.

### What I did

- Searched Kagi for Anthropic contextual retrieval, late chunking, metadata-driven RAG, semantic chunking, hybrid BM25+vector search
- Used Kagi Assistant for deeper research across all five topics simultaneously
- Downloaded 19 articles to `sources/` folder using defuddle and Playwright
- Discovered that defuddle "1-line" files actually contain full content (it strips newlines), used `fold -w 100 -s` to restore readability
- Created `00-sources-index.md` with categorized summaries and key takeaways for our system

### Why

The RAG evaluation system's chunking and enrichment strategies should be grounded in the best available research, not ad-hoc choices. Anthropic's contextual retrieval directly validates the `enrich_chunk` op design.

### What worked

- Kagi + Kagi Assistant gave excellent results for finding the primary sources
- Defuddle worked well for clean doc sites (Together AI, Claude Cookbook, Firecrawl)
- Playwright extraction worked for JS-heavy sites (Anthropic blog, Jina AI, Elastic, arxiv papers)
- The `fold -w 100 -s` approach fixed defuddle's single-line output
- 19 articles totaling ~1.4MB of source material collected

### What didn't work

- Defuddle returns single-line output (strips all newlines), initially appeared as failed — actually full content, just needs reflowing. User pointed this out.
- Some sites blocked defuddle or required JS rendering

### What I learned

- **Anthropic's Contextual Retrieval** (Sep 2024): generate short context per chunk using LLM, prepend before both embedding and BM25. Reduces failures by up to 67%. Maps directly to our `enrich_chunk` op + geppetto.
- **Late Chunking** (Jina AI): embed whole doc then pool segments — cheaper but slightly less accurate.
- **Semantic chunking may not be worth it** (arxiv 2410.13070): costs not justified by consistent gains over fixed-size chunking.
- **36 strategies evaluated** (arxiv 2603.06976): most comprehensive comparison available.
- **Metadata-driven RAG** (arxiv 2510.24402): document attributes as pre-retrieval filters improve precision.

### What was tricky to build

- Defuddle's single-line output was initially mistaken for failure. User pointed out the fix: it's full content, just needs `fold -w 100 -s`.
- Playwright extraction required the `<<NL>>` marker trick for newline preservation.

### What warrants a second pair of eyes

- Whether our `enrich_chunk` op + geppetto's `runInference()` is truly equivalent to Anthropic's contextual embeddings approach.

### What should be done in the future

- Update the defuddle skill documentation to note single-line output is normal and just needs `fold -w 100 -s`
- Integrate key findings into the design document's strategy sections
- Re-upload the design doc + sources bundle to reMarkable

### Technical details

- 19 source files, ~1.4MB total
- Extraction methods: defuddle (6), Playwright innerText (9), both (4)
- Key finding: Anthropic contextual retrieval = enrich chunk with LLM context + prepend before embedding and BM25

### What was tricky to build

- Section numbering after inserting the new section (5→6→7→...→13). Had to be careful to update all cross-references. -- dupe removed, see above

### What warrants a second pair of eyes

- The Strategy 9.5 script uses `extract.all()` on both the document content AND the LLM output — this double-extraction pattern is powerful but could be simplified with a helper function.

### What should be done in the future

- Re-upload the updated document to reMarkable
- Consider adding a `rag-ops.chunking.markdownAst()` function that wraps goja-text's markdown module for convenient section splitting

### Code review instructions

- Start with Section 5 (goja-text module) — compare the JS API documentation with the actual module.go files
- Then review the updated Strategy 9.2 and the new Strategy 9.5

### Technical details

- Goja-text module registration: `func init() { modules.Register(&module{}) }` — self-registers on blank import
- Xgoja provider: `pkg/xgoja/providers/text/text.go` — wraps all three modules into a single provider package
- The `MarkdownNode` type exposes `StartLine`, `StartColumn`, `SourcePos` which map directly to the RAG system's `start_offset`/`end_offset` chunk fields
- The `ExtractionCandidate` type has `Confidence` (0.0-1.0), `StartRow`, `StartColumn`, `PayloadStartByte`, etc. — all useful for position-aware extraction

## Step 5: Layered Goja RAG API Redesign

This step revisits the earlier `rag-ops` API proposal after the user raised concerns about the shape of the JavaScript surface. The work reframes the API from a service-shaped wrapper (`documents`, `chunking`, `documentProcessing`, `chunkEnrichment`) into a layered RAG experimentation DSL with explicit raw access and Go-backed fluent builders.

The resulting design keeps low-level SQL/Bleve power available for fast investigation while moving the recommended API toward typed handles and validated plans: `DocumentSet → ChunkPlan → ChunkSet → FeaturePlan → RepresentationPlan → IndexPlan → RetrieverPlan → ExperimentPlan`.

### Prompt Context

**User prompt (verbatim):** "Your little brother has come up with this goja API for allowing fast experimentation with the RAG system. I kind of like it, but I'm unsure about the API itself. I think we want something like:

- actual low level access (say, SQL to the DB, which we already have, or say bleve APIs to do the bm25 search and all)
- a nice but still quite flexible more opinoinated api that is oriented towards the layers built on top of the raw DBs, but i feel the documentProcessing and chunkEnrichment here might maybe not be ideal, and I think there are more elegant ways to approach this.

I do like fluent API with the builder pattern quite a bit, with the objects being handled on the go side for the most part, because it gives type safety and runtime validation instead of having to program defensively against arbitrary stringmaps and javascript objects.

Do your own in depth research, the idea behind the scripts I like, but I feel we could have a more powerful yet elegant and opinoinated API, on top of the lower level APIs against the raw content. Also study the ./goja-text/ APIs which allow us to do nice markdown stuff.

Create  a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and the nupload to remarkable."

**Assistant interpretation:** Re-evaluate the previously proposed Goja RAG API, critique its service-shaped naming, design a more elegant layered/fluent builder API with raw SQL/Bleve access, and write an intern-ready implementation guide.

**Inferred user intent:** The user wants a durable API design that supports serious RAG experimentation without forcing scripts into loose object maps or exposing current table/service names as the conceptual API.

### What I did

- Re-read the existing design sections that proposed `rag-ops`, especially the `documentProcessing` and `chunkEnrichment` namespaces.
- Inspected current RAG system files: DB queries, migrations, chunking, document processing, chunk enrichment, embeddings, BM25, vector, hybrid search, and workflow runner.
- Inspected the scraper JS executor to confirm how JS scripts receive context, dependencies, emitted ops, records, and artifacts.
- Inspected goja-text's `markdown`, `extract`, and `sanitize` modules, including their Go-backed builder and AST traversal patterns.
- Inspected geppetto's Goja module hidden-reference pattern and go-go-goja's `database` module for raw SQL access.
- Searched for external API design references around fluent interfaces/builders, especially the idea of an internal DSL and explicit build-time validation.
- Wrote `design/03-layered-goja-rag-api-design-and-implementation-guide.md`.

### Why

The earlier API was useful but too close to current backend services. For a long-lived experimentation surface, the API should express RAG concepts: documents, chunk plans, features, representations, indexes, retrievers, and experiments. It should also distinguish raw escape hatches from validated high-level builders.

### What worked

- The current codebase already has most low-level primitives: `Queries.DB()` for SQL, Bleve-backed BM25 services, vector search, hybrid RRF, geppetto inference, and goja-text Markdown parsing.
- Goja-text's builder pattern (`sanitize.json.options().MaxIterations(5).Build()`) is a strong local precedent for Go-backed fluent builders.
- Geppetto's hidden Go-reference pattern provides a clear model for Go-owned handles exposed to JavaScript.
- The new design produces a clearer conceptual chain: `DocumentSet → ChunkPlan → ChunkSet → FeaturePlan → RepresentationPlan → IndexPlan → RetrieverPlan → ExperimentPlan`.

### What didn't work

- There does not appear to be an actual checked-in implementation of the user's "little brother" API beyond the earlier design document proposal, so the critique is based on the proposed `rag-ops` API surface rather than new code.
- The existing diary still contains a duplicated/truncated section from Step 3; this should be cleaned later if the diary becomes a primary review artifact.

### What I learned

- `documentProcessing` and `chunkEnrichment` should remain internal storage/service concepts; the public API should talk about `features`, `metadata`, `context`, `representations`, and `artifacts`.
- Contextual retrieval needs first-class representation text. Embedding raw `chunks.text` is not enough; the system needs a representation layer for `context + text`, `metadata + text`, or `questions + text`.
- Raw access should be explicit (`require("rag/raw")`) and separate from the opinionated API (`require("rag")`).
- A fluent API is most useful here when `Build()` materializes immutable Go specs and validates invariants before expensive LLM/index work starts.

### What was tricky to build

- The main challenge was balancing low-level power with API safety. If SQL/Bleve access is hidden, expert users cannot experiment quickly. If everything is raw maps and raw calls, scripts become fragile and hard to validate. The design solves this by keeping raw access under `rag/raw` while making `rag` itself plan/handle oriented.
- Another tricky point was naming. The API needs names that survive schema changes. `features` and `representations` are more stable than `documentProcessing` and `chunkEnrichment`, because they describe what the experiment is building rather than which current service writes it.

### What warrants a second pair of eyes

- Whether the canonical module should be `rag` with `rag-ops` as an alias, or whether the existing `rag-ops` naming should be retained for continuity.
- Whether the proposed `chunk_representations` table is the right persistence model, or whether representations should be stored as artifact rows first.
- Whether lower-camel-case JS methods are worth the wrapper code, or whether Go-exported PascalCase builder methods are acceptable for this internal DSL.

### What should be done in the future

- Implement the first vertical slice: `Session`, `DocumentSetBuilder`, `ChunkPlanBuilder`, `materializeChunks()`, and `rag/raw.db`.
- Add raw Bleve handles after the SQL layer works.
- Add a representation layer before implementing contextual embeddings, so embedding/index inputs are not hardwired to raw chunk text.
- Clean the diary duplication from Step 3 if this ticket's diary is used as a primary handoff document.

### Code review instructions

- Start with `design/03-layered-goja-rag-api-design-and-implementation-guide.md`, especially Sections 4–7 for the proposed API shape.
- Then inspect `goja-text/pkg/markdown/module.go`, `goja-text/pkg/sanitize/module.go`, and `go-go-goja/modules/database/database.go` as implementation precedents.
- Finally compare the proposed vertical slice against `internal/services/chunking/service.go` and `internal/workflow/intake_runner.go`.

### Technical details

- New doc path: `ttmp/2026/06/02/RAGEVAL-GOJA-RAG-STRATEGIES--goja-driven-rag-indexing-strategies-js-extension-points-for-pipeline-experimentation/design/03-layered-goja-rag-api-design-and-implementation-guide.md`
- Proposed canonical module: `require("rag")`
- Proposed raw module: `require("rag/raw")`
- Proposed first acceptance script: select docs, build a markdown paragraph-group chunk plan, materialize chunks, and verify row count with raw SQL.
