---
Title: Diary
Ticket: WIDGETSITE-PACKAGING
Status: active
Topics:
    - ui-dsl
    - goja
    - frontend
    - packaging
    - research
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../../../../code/wesen/go-go-golems/go-go-parc/Projects/2026/06/01/ARTICLE - Trusted npm Publishing for Go Go Golems React Packages.md
      Note: Step 7 trusted npm publishing plan source
    - Path: packages/rag-evaluation-site/package.json
      Note: Step 9 package scaffold and validation scripts
    - Path: packages/rag-evaluation-site/scripts/prepare-dist.mjs
      Note: Step 9 compiled npm dist package preparation
    - Path: packages/rag-evaluation-site/scripts/sync-defaultspa.mjs
      Note: Step 10 frontend-to-Go embed sync script
    - Path: packages/rag-evaluation-site/src/hooks/useWidgetPage.ts
      Note: Step 9 hook for loading Widget IR pages
    - Path: pkg/defaultspa/spa.go
      Note: Step 10 embedded default SPA implementation
    - Path: pkg/widgetdsl/module.go
      Note: Moved public widget.dsl module implementation recorded in Step 5
    - Path: pkg/widgetdsl/module_test.go
      Note: Validation tests for public package and registrar recorded in Step 5
    - Path: pkg/widgetdsl/registrar.go
      Note: New RuntimeModuleSpec registrar recorded in Step 5
    - Path: pkg/widgetrunner/runner.go
      Note: Step 6 runner implementation and validation boundary
    - Path: pkg/widgetrunner/runner_test.go
      Note: Step 6 tests and captured PageContext map fix
    - Path: pkg/widgetschema/schema.go
      Note: Step 11 schema/versioning implementation
    - Path: pkg/widgetserver/server.go
      Note: |-
        Step 8 HTTP API and frontend modes implementation
        Step 10 embedded frontend default wiring
        Step 11 schema and action HTTP endpoints
    - Path: pkg/widgetserver/server_test.go
      Note: Step 8 endpoint and SPA fallback tests
    - Path: ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/design-doc/01-widgetrenderer-packaging-architecture-and-implementation-guide.md
      Note: Primary design deliverable produced in this diary
    - Path: ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/reference/01-research-logbook.md
      Note: Research logbook deliverable produced in this diary
    - Path: ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/scripts/smoke-widgetsite/page.js
      Note: Step 11 Playwright smoke Widget IR page/action script
    - Path: ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/tasks.md
      Note: Ticket task tracking for deliverable and future implementation work
ExternalSources: []
Summary: Chronological diary for the WidgetRenderer packaging research/design ticket.
LastUpdated: 2026-06-05T00:30:00-04:00
WhatFor: Use this to understand how the packaging design deliverable was researched, written, validated, and uploaded.
WhenToUse: Read before resuming WIDGETSITE-PACKAGING implementation or updating its design/logbook docs.
---








# Diary

## Goal

This diary records the work to create the `WIDGETSITE-PACKAGING` ticket, research the relevant local RAG/goja-site/go-go-goja sources, write the intern-facing packaging design guide, write the resource logbook, validate the ticket, and upload the bundle to reMarkable.

## Step 1: Create Ticket and Load Writing Rules

This step established the documentation workspace and loaded the relevant writing guidance before drafting. The output of this step was a new docmgr ticket with a design document, research logbook, and diary skeleton.

The user asked for a detailed technical design/implementation guide and a research logbook, both stored in a new ticket and uploaded to reMarkable. Because the request explicitly included upload, this step followed the full docmgr + reMarkable research workflow rather than the earlier no-upload preference from the previous implementation task.

### Prompt Context

**User prompt (verbatim):**

> Create a nenw docmgr ticket, and Create  a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and the nupload to remarkable.
>
>
> Then,  Create a research logbook document in the ticket that allows us to keep track of which resources    
>  are useful / out of date / need updating .                                                          
>                                                                                                      
>  For all the documents and external resources you read, list:                                        
>                                                                                                      
>  - what you were researching                                                                         
>  - what you were looking for in this document in particular                                          
>  - why you chose it
>  - how you found the resource itself
>  - what you found useful in the document                                                             
>  - what you didn't find useful                                                                        
>  - what is out of date / what was wrong                                                              
>  - what would need updating.                                                                         
>                                                                                                      
>  Store in ticket and upload to remarkable.     
>
>
> Keep a diary as you work.

**Assistant interpretation:** Create a new docmgr ticket about packaging the WidgetRenderer system, write a long intern-friendly design guide, write a resource-by-resource research logbook, keep a diary, validate the ticket, and upload the resulting bundle to reMarkable.

**Inferred user intent:** Turn the prior architectural discussion into durable handoff documentation that a new intern can use to implement a standalone WidgetRenderer package/server and understand which sources are reliable or stale.

**Commit (code):** N/A — documentation-only work in this step.

### What I did

- Loaded writing and delivery references:
  - `/home/manuel/.pi/agent/skills/ticket-research-docmgr-remarkable/references/writing-style.md`
  - `/home/manuel/.pi/agent/skills/ticket-research-docmgr-remarkable/references/deliverable-checklist.md`
  - `/home/manuel/.pi/agent/skills/diary/references/diary.md`
- Ran `docmgr status --summary-only`.
- Created the ticket:
  - `docmgr ticket create-ticket --ticket WIDGETSITE-PACKAGING --title "WidgetRenderer Packaging and Standalone Server Design" --topics ui-dsl,goja,frontend,packaging,research`
- Added docs:
  - `docmgr doc add --ticket WIDGETSITE-PACKAGING --doc-type design-doc --title "WidgetRenderer Packaging Architecture and Implementation Guide"`
  - `docmgr doc add --ticket WIDGETSITE-PACKAGING --doc-type reference --title "Research Logbook"`
  - `docmgr doc add --ticket WIDGETSITE-PACKAGING --doc-type reference --title "Diary"`
- Listed the created documents with `docmgr doc list --ticket WIDGETSITE-PACKAGING`.

### Why

- The user explicitly asked for a new ticket and persistent docs.
- Loading the writing rules first ensured the design guide would be evidence-backed and structured for onboarding.
- Creating the diary early made it possible to record the process rather than reconstruct it later.

### What worked

- Ticket creation succeeded.
- Three documents were created:
  - `design-doc/01-widgetrenderer-packaging-architecture-and-implementation-guide.md`
  - `reference/01-research-logbook.md`
  - `reference/02-diary.md`

### What didn't work

- No failures in this step.

### What I learned

- The docmgr ticket template creates a usable workspace with `index.md`, `tasks.md`, `changelog.md`, and typed document directories.
- The generated document stubs preserve frontmatter that should be retained when replacing content.

### What was tricky to build

- The prompt contains typos (`nenw`, `nupload`, `sand`), but the intent was clear. I preserved the exact prompt in the diary and interpreted it as a request for a new ticket, detailed design guide, logbook, upload, and diary.

### What warrants a second pair of eyes

- Confirm the ticket id `WIDGETSITE-PACKAGING` is the desired naming convention before implementation work begins.

### What should be done in the future

- If this design becomes implementation work, create a separate implementation ticket or add concrete tasks under this ticket.

### Code review instructions

- Start with `index.md` and `tasks.md` in the ticket workspace.
- Verify the generated docs exist under the ticket path.

### Technical details

- Ticket path: `ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design`
- Docs root: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp`

## Step 2: Gather Evidence from RAG, goja-site, and go-go-goja

This step mapped the relevant local source files before writing conclusions. The purpose was to avoid a generic packaging essay and instead ground the design in the actual RAG Widget IR implementation, the goja-site runtime/server pattern, and the go-go-goja module APIs.

The investigation identified a key distinction for the final design: goja-site is an excellent reference for runtime ownership and script loading, but its `ui.dsl` model renders HTML on the Go side. The WidgetRenderer package should preserve React as the renderer and make Goja emit JSON-compatible Widget IR.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Research the local implementation and related projects deeply enough to write an intern-friendly packaging design.

**Inferred user intent:** Ensure the guide teaches the actual system and does not invent architecture disconnected from the existing code.

**Commit (code):** N/A — research/documentation only.

### What I did

- Read source files and captured line-anchored evidence with `nl -ba ... | sed -n ...`.
- Inspected RAG frontend packaging:
  - `internal/web/spa.go`
  - `web/vite.config.ts`
  - `web/package.json`
- Inspected RAG Widget IR and renderer:
  - `web/src/widgets/ir.ts`
  - `web/src/widgets/WidgetRenderer.tsx`
  - `web/src/widgets/cellRenderers.tsx`
  - `web/src/widgets/actions.ts`
- Inspected RAG DSL preview integration:
  - `internal/api/dsl_handlers.go`
  - `internal/api/dsl_handlers_test.go`
  - `web/src/components/pages/DslPreviewPage/DslPreviewPage.tsx`
  - `web/src/services/api.ts`
- Inspected RAG Goja DSL prototype:
  - `pkg/widgetdsl/module.go`
- Inspected goja-site runtime/server/script patterns:
  - `2026-05-03--goja-hosting-site/cmd/goja-site/serve.go`
  - `2026-05-03--goja-hosting-site/pkg/app/server.go`
  - `2026-05-03--goja-hosting-site/go.mod`
  - `2026-05-03--goja-hosting-site/examples/kanban/scripts/app.js`
  - `2026-05-03--goja-hosting-site/examples/verbs/builtin/ui.js`
- Inspected go-go-goja runtime/module patterns:
  - `go-go-goja/modules/common.go`
  - `go-go-goja/engine/runtime_modules.go`
  - `go-go-goja/engine/factory.go`
  - `go-go-goja/modules/uidsl/module.go`
  - `go-go-goja/modules/express/express.go`
  - `go-go-goja/pkg/gojahttp/host.go`

### Why

- The guide needed concrete file references, API references, pseudocode, and diagrams.
- The research logbook needed a per-resource assessment of usefulness and stale areas.
- The user specifically asked to look at goja hosting site and go-go-goja in the prior turn, so the design needed to compare against those systems.

### What worked

- The RAG implementation already provides a complete vertical-slice reference: Widget IR schema, React renderer, static Go endpoint, preview page, and tests.
- goja-site provides a strong runtime/server pattern for CLI settings, server ownership, module registration, script loading, and shutdown.
- go-go-goja provides the runtime module contract needed for a public `widget.dsl` registrar.

### What didn't work

- A version mismatch appeared between goja-site and the local go-go-goja checkout:
  - goja-site `go.mod` depends on `github.com/go-go-golems/go-go-goja v0.4.16`.
  - The local go-go-goja checkout exposes `RuntimeModuleSpec` with `RegisterRuntimeModule`.
  - goja-site code uses older-looking names such as `engine.RuntimeModuleRegistrar` / `WithRuntimeModuleRegistrars`.
- This is not a blocker for documentation, but it means implementation should choose a specific go-go-goja version and not copy code blindly.

### What I learned

- The right packaging boundary is not “goja-site plus React.” It is “goja-site runtime pattern plus Widget IR JSON API plus React renderer package.”
- The current RAG `widget.dsl` code is useful but must move out of `internal/` to become reusable.
- The npm package should avoid RTK Query and RAG-specific service paths, even though the RAG app currently uses those.

### What was tricky to build

- The same phrase “UI DSL” means two different things across the codebase:
  - `ui.dsl` in go-go-goja/goja-site means server-rendered HTML nodes.
  - `widget.dsl` in the RAG prototype means JSON-compatible Widget IR rendered by React.
- The guide needed to make that distinction explicit so an intern does not accidentally implement server-side HTML mimicry.

### What warrants a second pair of eyes

- Verify the recommended go-go-goja API target before writing `pkg/widgetdsl.NewRegistrar()`.
- Confirm whether package implementation should live in the RAG repository, a new `widget-site` repository, or an npm/go monorepo.

### What should be done in the future

- Add an implementation spike that imports the selected go-go-goja version and compiles the proposed registrar skeleton.
- Add a small example script using `require("widget.dsl")` and `exports.pages.demo`.

### Code review instructions

- Review the research logbook entries for stale/outdated notes before using any code snippet.
- Pay special attention to the goja-site vs local go-go-goja API mismatch.

### Technical details

- Main evidence commands used `nl -ba <file> | sed -n '<range>p'` and `rg -n <pattern> <files>`.
- The design guide references line numbers from these evidence captures.

## Step 3: Write the Design Guide and Research Logbook

This step turned the evidence into two ticket documents. The design guide is written for a new intern: it explains the problem, current-state architecture, target package architecture, Go and npm APIs, frontend modes, build strategy, implementation phases, decision records, risks, and file-reading order.

The research logbook records each resource that shaped the design, including why it was chosen, how it was found, what was useful, what was not useful, what appears stale or wrong, and what needs updating.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Produce durable design and research documents rather than code changes.

**Inferred user intent:** Give future implementers enough technical context to build the package without redoing the investigation.

**Commit (code):** N/A — documentation-only work.

### What I did

- Replaced the generated design-doc stub with a detailed guide:
  - `design-doc/01-widgetrenderer-packaging-architecture-and-implementation-guide.md`
- Replaced the generated research logbook stub with a complete resource log:
  - `reference/01-research-logbook.md`
- Included diagrams, API contracts, pseudocode, package layout proposals, implementation phases, and decision records.
- Preserved docmgr YAML frontmatter and filled in summary/usage fields.

### Why

- The user requested prose paragraphs, bullet points, pseudocode, diagrams, API references, and file references.
- The logbook was required to support ongoing maintenance of resource usefulness/staleness.

### What worked

- The design guide now contains:
  - conceptual architecture diagram,
  - package diagram,
  - HTTP API contracts,
  - Go API sketches,
  - npm package exports,
  - frontend mode descriptions,
  - build/release strategy,
  - intern implementation plan,
  - decision records,
  - risks/open questions,
  - file reference map.
- The logbook now contains 25 resource entries.

### What didn't work

- No command failure occurred during writing.
- The main limitation is that this is still a design document, not a compiled implementation spike.

### What I learned

- The current RAG slice is already sufficient to specify the reusable package boundary.
- Most package risk is not in rendering; it is in keeping TypeScript schema, Go validation, Goja helper output, and user extension APIs synchronized.

### What was tricky to build

- The research logbook needed to include skill docs as well as source files because the user asked for all documents and external resources read.
- The design guide needed enough detail for an intern without becoming an implementation diff. I used pseudocode where exact package APIs are not yet committed.

### What warrants a second pair of eyes

- Review the decision to check in default SPA `dist` for `go install` compatibility.
- Review the proposed split between `@go-go-golems/widget-renderer` and `@go-go-golems/widget-site-app`.
- Review the proposed four frontend modes before implementation.

### What should be done in the future

- Convert the implementation phases into GitHub issues or docmgr tasks if this becomes active work.
- Add a small proof-of-concept repo or branch that compiles `pkg/widgetdsl`, `pkg/widgetrunner`, and `pkg/widgetserver`.

### Code review instructions

- Start with the design guide executive summary and target architecture.
- Then read the research logbook entries for resources marked medium staleness risk.
- Validate that every major recommendation is backed by a file reference.

### Technical details

- Design guide path: `design-doc/01-widgetrenderer-packaging-architecture-and-implementation-guide.md`
- Research logbook path: `reference/01-research-logbook.md`

## Step 4: Validate and Upload Deliverables

This step validated the ticket and uploaded the requested document bundle to reMarkable. The first real upload failed during Pandoc PDF generation because the diary had literal backslash-n prompt escapes; after replacing those escapes with actual blockquoted line breaks, validation passed and the upload succeeded.

The upload is explicitly allowed in this ticket because the user requested “upload to remarkable” for both the guide and logbook. I used a dry run first, then a real bundled upload. I did not run a separate cloud listing because the reMarkable upload skill says a successful `OK: uploaded ...` response is sufficient verification and routine listing calls should be avoided.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Finish the docmgr deliverable and send it to reMarkable.

**Inferred user intent:** Make the research package available for reading/review on the reMarkable device.

**Commit (code):** N/A — documentation delivery step.

### What I did

- Related the key source files to the design guide, research logbook, and diary with `docmgr doc relate`.
- Updated the ticket changelog.
- Marked completed docmgr tasks.
- Ran `docmgr doctor --ticket WIDGETSITE-PACKAGING --stale-after 30`.
- Added missing vocabulary topics after the first doctor run warned about unknown topic slugs:
  - `frontend`
  - `packaging`
  - `research`
  - `ui-dsl`
- Re-ran `docmgr doctor --ticket WIDGETSITE-PACKAGING --stale-after 30`, which passed.
- Ran a reMarkable dry run:
  - `remarquee upload bundle --dry-run ... --name "WIDGETSITE-PACKAGING WidgetRenderer Packaging Guide" --remote-dir "/ai/2026/06/04/WIDGETSITE-PACKAGING" --toc-depth 2 --non-interactive`
- Ran the real upload, which first failed with a Pandoc error.
- Fixed the diary prompt formatting by replacing literal `\n` sequences with actual blockquoted line breaks.
- Verified no literal `\n` sequences remained with `rg -n "\\\\n" ... || true`.
- Re-ran `docmgr doctor`, which passed.
- Re-ran the real upload successfully.

### Why

- The ticket should pass `docmgr doctor` before upload.
- The reMarkable upload should include the design guide, research logbook, diary, tasks, changelog, and index as one bundle.
- The prompt formatting fix was required because Pandoc/LaTeX treats raw backslash sequences as commands in some contexts.

### What worked

- Dry-run bundle output showed the intended files:
  - `index.md`
  - `tasks.md`
  - `changelog.md`
  - `design-doc/01-widgetrenderer-packaging-architecture-and-implementation-guide.md`
  - `reference/01-research-logbook.md`
  - `reference/02-diary.md`
- Final doctor output passed:
  - `✅ All checks passed`
- Final upload succeeded:
  - `OK: uploaded WIDGETSITE-PACKAGING WidgetRenderer Packaging Guide.pdf -> /ai/2026/06/04/WIDGETSITE-PACKAGING`

### What didn't work

- First `docmgr doctor` run warned about unknown topic slugs:
  - `frontend`
  - `packaging`
  - `research`
  - `ui-dsl`
- The first real upload failed with:
  - `Error: pandoc failed: Error producing PDF.`
  - `! Undefined control sequence.`
  - `l.2873 remarkable.\n`
  - `: exit status 43`
- Root cause: the Step 1 diary prompt stored literal `\n` sequences inside a quoted paragraph.
- Fix: converted the prompt to a Markdown blockquote with real line breaks.

### What I learned

- `docmgr doctor` vocabulary warnings should be resolved before upload so generated metadata is clean.
- Long verbatim prompts should be represented as blockquotes or fenced text with real line breaks, not literal escape sequences, when the document will be converted to PDF.
- The reMarkable upload command’s `OK: uploaded ... -> <path>` output is enough delivery verification under the current upload skill guidance.

### What was tricky to build

- The conflict between workflow habits and current reMarkable skill guidance required a small adjustment: the ticket research workflow mentions remote listing verification, while the reMarkable upload skill says not to run routine cloud listing after success. I treated the successful upload output as verification and updated the task wording accordingly.
- The Pandoc error pointed to generated LaTeX line context rather than directly naming the Markdown line. Searching the ticket for literal `\\n` found the source quickly.

### What warrants a second pair of eyes

- Confirm that using upload success output rather than `remarquee cloud ls` is acceptable for this ticket.
- Review the diary prompt formatting after PDF generation to ensure it is readable on reMarkable.

### What should be done in the future

- Avoid literal backslash escape sequences in Markdown destined for Pandoc PDF output.
- If this bundle is re-uploaded after implementation work, run a dry run first and keep the same remote directory unless the date changes.

### Code review instructions

- Check the final `docmgr doctor` output.
- Check the final reMarkable upload output:
  - `OK: uploaded WIDGETSITE-PACKAGING WidgetRenderer Packaging Guide.pdf -> /ai/2026/06/04/WIDGETSITE-PACKAGING`

### Technical details

- Upload destination: `/ai/2026/06/04/WIDGETSITE-PACKAGING`
- Bundle name: `WIDGETSITE-PACKAGING WidgetRenderer Packaging Guide`
- Final uploaded PDF name: `WIDGETSITE-PACKAGING WidgetRenderer Packaging Guide.pdf`

## Step 5: Extract `widget.dsl` into Public `pkg/widgetdsl`

This step turned the first packaging recommendation into code. The earlier `widget.dsl` module lived under `internal/dsl/widgetdsl`, which was fine for an application-private prototype but not suitable for a reusable package or standalone server import path.

The implementation moved the module to `pkg/widgetdsl`, added an explicit go-go-goja `engine.RuntimeModuleSpec` registrar, and verified that both direct `require.Registry` registration and `engine.NewBuilder().WithModules(widgetdsl.NewRegistrar())` registration expose `require("widget.dsl")` and `require("rag.dsl")`.

### Prompt Context

**User prompt (verbatim):** "continue"

**Assistant interpretation:** Continue from the WIDGETSITE-PACKAGING implementation plan by starting a concrete implementation slice.

**Inferred user intent:** Move beyond design documentation and begin extracting reusable packaging components while keeping the ticket diary/tasks current.

**Commit (code):** N/A — worktree changes are not committed in this session.

### What I did

- Moved:
  - `internal/dsl/widgetdsl/module.go` → `pkg/widgetdsl/module.go`
  - `internal/dsl/widgetdsl/module_test.go` → `pkg/widgetdsl/module_test.go`
- Added:
  - `pkg/widgetdsl/registrar.go`
- Implemented `Registrar`:
  - satisfies `engine.RuntimeModuleSpec`
  - exposes `NewRegistrar()`
  - registers both `widget.dsl` and `rag.dsl` through the existing `Register(*require.Registry)` helper
- Added `TestEngineRegistrarRegistersWidgetAndRagAliases` to verify engine-level registration.
- Updated WIDGETSITE-PACKAGING docs/tasks to reflect that the public package and registrar now exist.
- Related the new package files to the design document.
- Updated the ticket changelog.
- Ran:
  - `gofmt -w pkg/widgetdsl/*.go`
  - `go test ./pkg/widgetdsl -count=1`
  - `go test ./... -count=1`

### Why

- The packaging guide identified `pkg/widgetdsl` as the first Go-side package boundary.
- External binaries cannot import another module's `internal/...` packages.
- A standalone WidgetRenderer server should compose `widget.dsl` through the go-go-goja engine builder, not only through ad hoc `require.Registry` setup.

### What worked

- `go test ./pkg/widgetdsl -count=1` passed.
- `go test ./... -count=1` passed.
- The direct module registration tests still pass.
- The new engine registrar test verifies both aliases:
  - `require("widget.dsl")`
  - `require("rag.dsl")`

### What didn't work

- An automatic text replacement changed some design/logbook wording too broadly, producing awkward phrases such as “Move `pkg/widgetdsl` to `pkg/widgetdsl`.”
- I corrected the affected passages in the design guide, research logbook, and tasks file.

### What I learned

- The RAG app already depends on `github.com/go-go-golems/go-go-goja v0.7.2`, so the current `engine.RuntimeModuleSpec` interface is available in this module.
- The registrar can remain thin because the existing `Register(*require.Registry)` helper already centralizes canonical and alias registration.

### What was tricky to build

- The code move was straightforward, but the documentation had to be updated carefully because previous research text described the pre-move state. Some statements should remain historically useful, while task/status passages should reflect the new state.
- The package is now public within the RAG module path, but the larger design question remains: whether it stays here or later moves into a dedicated `widget-site` module.

### What warrants a second pair of eyes

- Confirm that `pkg/widgetdsl` is the desired long-term public package path.
- Review whether `init()` registration into `modules.DefaultRegistry` should remain in a reusable package or whether explicit engine registration should be preferred for package consumers.
- Review whether `rag.dsl` should be a permanent public alias or a RAG-specific compatibility alias.

### What should be done in the future

- Add Widget IR validation for required props and malformed nodes.
- Add schema/version fixtures shared between Go and TypeScript.
- Decide whether `pkg/widgetdsl` should be extracted into a separate module when the npm packages are created.

### Code review instructions

- Start with `pkg/widgetdsl/registrar.go` to see the new public engine integration.
- Then review `pkg/widgetdsl/module.go` for helper exports and child normalization.
- Validate with:
  - `go test ./pkg/widgetdsl -count=1`
  - `go test ./... -count=1`

### Technical details

- New public package path: `github.com/go-go-golems/rag-evaluation-system/pkg/widgetdsl`
- Canonical JS module name: `widget.dsl`
- Alias JS module name: `rag.dsl`
- Registrar interface: `github.com/go-go-golems/go-go-goja/engine.RuntimeModuleSpec`

## Step 6: Implement `pkg/widgetrunner` Script Loading and Page Execution

This step added the first runnable server-side page execution layer. The runner owns a go-go-goja runtime configured with `pkg/widgetdsl`, loads trusted JavaScript files from configured script directories, and calls page functions to produce Widget IR page responses.

The runner deliberately stays smaller than the eventual `pkg/widgetserver`: it does not expose HTTP routes yet. Its job is to load scripts, locate `exports.pages[id]` or fallback `exports.page`, execute the function with a JSON-shaped context, normalize the result into `{id,title,root}`, and reject obviously malformed Widget IR before a future server returns it to React.

### Prompt Context

**User prompt (verbatim):** "go ahead"

**Assistant interpretation:** Proceed with the next implementation step after extracting `pkg/widgetdsl`; implement the page runner described in the packaging guide.

**Inferred user intent:** Continue turning the packaging guide into working reusable Go packages while keeping docs and validation current.

**Commit (code):** N/A — worktree changes are not committed in this session.

### What I did

- Added `pkg/widgetrunner/runner.go`.
- Added `pkg/widgetrunner/runner_test.go`.
- Implemented:
  - `Config`
  - `Runner`
  - `ScriptInfo`
  - `PageContext`
  - `PageResult`
  - `ActionRequest`
  - `ActionResult`
  - `New(ctx, cfg)`
  - `LoadScripts(ctx)`
  - `RenderPage(ctx, id, pageCtx)`
  - `NormalizePageResult(defaultID, value)`
  - `ValidatePage(page)`
  - `ValidateWidgetNode(node)`
- The runner installs a shared global `exports` object before loading scripts.
- Script discovery recursively loads `.js` files in lexical order.
- Page lookup checks:
  - `exports.pages[id]`
  - fallback `exports.page`
- Added tests for:
  - named page execution through `exports.pages.demo`
  - fallback `exports.page` returning a bare WidgetNode
  - missing page returns `ErrPageNotFound`
  - invalid component node returns `ErrInvalidWidgetIR`
  - multiple scripts load in lexical order and share `exports`
- Updated the design guide Phase 4 status.
- Marked the `pkg/widgetrunner` task complete and clarified that schema/versioning remains future work.
- Related runner files and updated the ticket changelog.
- Ran:
  - `gofmt -w pkg/widgetrunner/*.go`
  - `go test ./pkg/widgetrunner -count=1`
  - `go test ./pkg/widgetdsl ./pkg/widgetrunner -count=1`
  - `go test ./... -count=1`

### Why

- `pkg/widgetdsl` can author Widget IR, but a standalone server also needs a runtime layer that loads user scripts and calls page functions.
- Keeping this separate from HTTP routing makes it easier to test script behavior without starting a server.
- The page runner is the simplest bridge between goja-site’s trusted-script model and the React WidgetRenderer JSON boundary.

### What worked

- Named pages render correctly from `exports.pages`.
- Fallback `exports.page` works and bare WidgetNode results are wrapped into a `PageResult`.
- Scripts loaded in lexical order can share helpers through the global `exports` object.
- Minimal validation catches malformed component nodes, such as `{ kind: "component" }` without `type`.
- Full Go tests passed.

### What didn't work

- The first targeted test run failed:

```text
--- FAIL: TestRenderNamedPageFromExportsPages (0.00s)
    runner_test.go:31: render page: TypeError: Cannot read property 'q' of undefined at demo (/tmp/TestRenderNamedPageFromExportsPages3586027575/001/page.js:7:33(8))
FAIL
FAIL	github.com/go-go-golems/rag-evaluation-system/pkg/widgetrunner	0.006s
FAIL
```

- Root cause: passing the Go `PageContext` struct directly through `vm.ToValue(pageCtx)` exposed Go field names such as `Query`, not JSON tag names such as `query`.
- Fix: added `pageContextMap(ctx PageContext)` and pass `vm.ToValue(pageContextMap(pageCtx))` so JavaScript sees `ctx.pageId`, `ctx.query`, `ctx.user`, and `ctx.data`.

### What I learned

- Goja does not automatically make struct JSON tags the JavaScript property names in the way this API needs.
- Runner-facing inputs should be converted to explicit maps before crossing the Go-to-JS boundary.
- A shared global `exports` object is enough for this first trusted-script runner, but it is a deliberate simplification compared to CommonJS module wrappers.

### What was tricky to build

- The runner needs to be useful without becoming a full module system. It currently loads scripts into one runtime/global scope and gives them a shared `exports` object. That supports simple multi-file examples, but future package boundaries may need per-script module objects or explicit page registration helpers.
- Validation is intentionally minimal. It checks the WidgetNode skeleton (`kind`, `text`, `tag`, `type`, and child arrays), but it does not yet validate component-specific required props like `DataTable.columns` or schema version compatibility.

### What warrants a second pair of eyes

- Review whether the shared global `exports` model is acceptable for phase 1 or whether scripts should be CommonJS-wrapped.
- Review whether fallback `exports.page` should apply to every missing page id or only to `index`.
- Review the validation boundary: what belongs in `pkg/widgetrunner` versus a future `pkg/widgetschema` package.

### What should be done in the future

- Add component-specific Widget IR validation and JSON Schema/versioning.
- Add action invocation support through exported action maps.
- Implement `pkg/widgetserver` to expose the runner over HTTP.
- Add examples under a controlled scripts directory once the server exists.

### Code review instructions

- Start with `pkg/widgetrunner/runner.go` and read `RenderPage`, `lookupPageFunction`, `NormalizePageResult`, and `ValidateWidgetNode`.
- Then read `pkg/widgetrunner/runner_test.go` to understand the script contract.
- Validate with:
  - `go test ./pkg/widgetrunner -count=1`
  - `go test ./pkg/widgetdsl ./pkg/widgetrunner -count=1`
  - `go test ./... -count=1`

### Technical details

- Page function contract:

```javascript
const rag = require('widget.dsl');

exports.pages = {
  demo(ctx) {
    return {
      id: ctx.pageId,
      title: 'Demo',
      root: rag.panel({ title: 'Demo' }, 'Hello')
    };
  }
};
```

- Fallback contract:

```javascript
exports.page = function(ctx) {
  return rag.panel({ title: ctx.pageId }, 'Hello');
};
```

## Step 7: Revise npm Plan to Single `@go-go-golems/rag-evaluation-site` Package

This step updated the packaging plan based on the user's naming and packaging decision. The prior design split the React side into a renderer package and a default app package; the new plan uses one package, `@go-go-golems/rag-evaluation-site`, with subpath exports for renderer-only usage and default app usage.

I also read the trusted npm publishing article the user provided. That changed the release plan: the package should publish a compiled `dist/` artifact, keep exported CSS self-contained, include pack-smoke and clean-consumer validation, and publish through npm Trusted Publishing using GitHub Actions OIDC rather than long-lived npm tokens.

### Prompt Context

**User prompt (verbatim):** "Btw: make a single npm package, call it rag-evaluation-site, and we'll package it as @go-go-golems/rag-evaluation-site. look at how the npm packaging with a trusted published is setup in /home/manuel/code/wesen/go-go-golems/go-go-parc/Projects/2026/06/01/ARTICLE - Trusted npm Publishing for Go Go Golems React Packages.md 

Update the plan. 

Then continue with the ticket."

**Assistant interpretation:** Replace the two-package npm plan with one package named `@go-go-golems/rag-evaluation-site`, incorporate trusted npm publishing guidance from the provided article, then continue implementation work.

**Inferred user intent:** Align the architecture docs with the desired package identity and release model before building more of the system.

**Commit (code):** N/A — documentation and plan update step.

### What I did

- Read `/home/manuel/code/wesen/go-go-golems/go-go-parc/Projects/2026/06/01/ARTICLE - Trusted npm Publishing for Go Go Golems React Packages.md`.
- Updated the design guide to replace the old two-package plan with one package:
  - source directory: `packages/rag-evaluation-site`
  - published name: `@go-go-golems/rag-evaluation-site`
- Added package export guidance for:
  - root renderer exports
  - `./ir`
  - `./app`
  - `./styles.css`
  - `./theme.css`
- Added trusted-publishing requirements:
  - compiled `dist/` publish artifact
  - no `workspace:*` leakage
  - self-contained CSS
  - pack smoke
  - clean consumer smoke
  - GitHub Actions OIDC with `permissions.id-token: write`
  - npm `>=11.10.0`
  - no `NODE_AUTH_TOKEN`
  - `npm-production` environment
  - manual bootstrap publish if required before trust can be configured
  - token lockdown only after tokenless publish is verified
- Updated `tasks.md` to use the single package name.
- Added a research logbook entry for the article.
- Related the article path to the design guide and research logbook.

### Why

- The user made a clear package naming decision.
- A single package reduces release coordination but requires clean subpath exports.
- The trusted publishing article contains Go Go Golems-specific release rules that should be part of this ticket's implementation plan.

### What worked

- The design guide now consistently describes `@go-go-golems/rag-evaluation-site` as the npm package.
- The release plan now includes artifact validation and tokenless npm publishing details.
- The research logbook records the article as a resource and explains which parts apply versus which parts do not apply.

### What didn't work

- The previous plan had several references to `@go-go-golems/widget-renderer` and `@go-go-golems/widget-site-app`; these needed targeted cleanup rather than a blind global replace because some historical context remained useful.

### What I learned

- For public React packages, package correctness and publish authentication are separate validation layers.
- Clean consumer smoke is necessary because workspace builds can hide CSS processor assumptions and dependency/export mistakes.
- npm Trusted Publishing has a package-existence bootstrap problem: a package may need one manual publish before trust can be configured.

### What was tricky to build

- The package should be single from the user's perspective, but still internally expose separable concerns. The plan now uses subpath exports rather than separate packages.
- The default app build and npm library build need different outputs: `dist/` for npm and `app-dist/` for Go embedding.

### What warrants a second pair of eyes

- Confirm the expected GitHub repository name for trusted publishing. The doc currently assumes `go-go-golems/rag-evaluation-site`.
- Confirm whether the Go repository and npm package source should live together or whether npm package source should be split into a separate repository.

### What should be done in the future

- Add actual `packages/rag-evaluation-site/package.json` and build scripts.
- Add pack-smoke and clean-consumer smoke scripts before first publish.
- Add `.github/workflows/publish-npm.yml` using trusted publishing.

### Code review instructions

- Review the `npm Package Design`, `Build and Bundling Strategy`, and `Phase 1` sections in the design guide.
- Review research logbook entry 26 for the trusted publishing article.

### Technical details

- Final npm package name: `@go-go-golems/rag-evaluation-site`
- Source directory proposed: `packages/rag-evaluation-site`
- Npm publish artifact: `packages/rag-evaluation-site/dist`
- Go embedded app artifact: `packages/rag-evaluation-site/app-dist`

## Step 8: Implement `pkg/widgetserver` HTTP APIs and Frontend Modes

This step added the HTTP layer around `pkg/widgetrunner`. The new `pkg/widgetserver` package exposes Widget IR pages over JSON, provides health and schema endpoints, returns a clear placeholder for server actions, and supports frontend serving modes for API-only, static directory, reverse proxy, and embedded handler configurations.

The implementation stays within the standard library `net/http` model. This matches the packaging guide and keeps the server independent of third-party routers.

### Prompt Context

**User prompt (verbatim):** (same as Step 7)

**Assistant interpretation:** After updating the npm packaging plan, continue implementation with the next ticket task.

**Inferred user intent:** Keep progressing from design into reusable Go packages while preserving the corrected npm package direction.

**Commit (code):** N/A — worktree changes are not committed in this session.

### What I did

- Added `pkg/widgetserver/server.go`.
- Added `pkg/widgetserver/server_test.go`.
- Implemented:
  - `FrontendMode`
  - `Config`
  - `Server`
  - `New(cfg)`
  - `Handler()`
  - `Run(ctx)`
  - `GET /api/widget/health`
  - `GET /api/widget/pages/{id}`
  - `POST /api/widget/actions/{name}` as `501 action_not_implemented`
  - `GET /api/widget/schema`
  - `SPAHandler(fs.FS)`
- Supported frontend modes:
  - `api-only`
  - `dir`
  - `proxy`
  - `embedded` with provided `FrontendHandler` until `pkg/defaultspa` exists
- Added tests for:
  - successful page rendering through the runner
  - missing page mapped to `404 page_not_found`
  - health endpoint
  - schema endpoint
  - action endpoint placeholder
  - API-only root returning 404
  - directory frontend static asset serving and SPA fallback
- Updated ticket docs, tasks, file relations, and changelog.
- Ran:
  - `gofmt -w pkg/widgetserver/*.go`
  - `go test ./pkg/widgetserver -count=1`
  - `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver -count=1`
  - `go test ./... -count=1`

### Why

- `pkg/widgetrunner` can execute page scripts, but consumers need an HTTP API for browser clients and the future default React app.
- The server layer should be testable before adding the npm package or embedded default SPA.
- Frontend mode support is needed so users can choose embedded app, custom built app directory, dev proxy, or API-only deployment.

### What worked

- Page endpoint returns runner-produced JSON.
- Query parameters are passed through to `PageContext.Query`.
- Missing pages produce structured JSON errors.
- Schema and health endpoints are stable smoke targets.
- Directory frontend mode serves static files and falls back to `index.html` for SPA routes.
- Full Go tests passed.

### What didn't work

- The first `pkg/widgetserver` test run failed for directory SPA fallback:

```text
--- FAIL: TestDirFrontendServesStaticAndFallsBackToIndex (0.01s)
    server_test.go:92: GET /unknown/route = 301, want 200 body=
FAIL
FAIL	github.com/go-go-golems/rag-evaluation-system/pkg/widgetserver	0.022s
FAIL
```

- Root cause: using `http.FileServer` with a rewritten `/index.html` request still triggered redirect behavior for some extensionless paths.
- Fix: in fallback mode, read `index.html` from the filesystem and write it directly with `Content-Type: text/html; charset=utf-8`.

### What I learned

- `http.FileServer` is good for direct asset serving but can surprise SPA fallback tests with redirects.
- A direct `index.html` write is simpler and more deterministic for fallback paths.
- The server package can be useful before `pkg/defaultspa` exists by supporting `api-only`, `dir`, and `proxy` modes.

### What was tricky to build

- Embedded frontend mode cannot be fully wired until `pkg/defaultspa` exists. The server handles this by requiring a caller-provided `FrontendHandler` for `FrontendEmbedded` mode in the current slice.
- Action support is not implemented yet, but the endpoint exists and returns a structured `501` so clients and docs have a stable placeholder.

### What warrants a second pair of eyes

- Review the frontend mode semantics, especially whether `FrontendEmbedded` should default to API-only until `pkg/defaultspa` exists or require a handler as it does now.
- Review the schema endpoint contents; it is currently a simple component/cell-kind summary, not a JSON Schema.
- Review whether action endpoint should be absent until implemented or present as `501 action_not_implemented`.

### What should be done in the future

- Add `pkg/defaultspa` and wire embedded mode to the built `@go-go-golems/rag-evaluation-site` default app.
- Implement action invocation through `pkg/widgetrunner`.
- Replace schema summary with real JSON Schema/version metadata.
- Add browser smoke once the default app package exists.

### Code review instructions

- Start with `pkg/widgetserver/server.go` route registration and `frontendHandler`.
- Then review `pkg/widgetserver/server_test.go` for the expected API behavior.
- Validate with:
  - `go test ./pkg/widgetserver -count=1`
  - `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver -count=1`
  - `go test ./... -count=1`

### Technical details

- Default API prefix: `/api/widget`
- Page endpoint: `GET /api/widget/pages/{id}`
- Schema endpoint: `GET /api/widget/schema`
- Health endpoint: `GET /api/widget/health`
- Action placeholder: `POST /api/widget/actions/{name}` → `501 action_not_implemented`

## Step 9: Scaffold `@go-go-golems/rag-evaluation-site` Package

This step created the first reusable npm package slice for the WidgetRenderer system. The package now contains the renderer, Widget IR types, reusable component subtrees, package CSS/theme exports, a `useWidgetPage` hook, and a default app entrypoint that talks to the `/api/widget` server API.

The package build now follows the trusted-publishing direction from the design guide: the publishable artifact is compiled `dist/`, not the source package root. A package-local pack smoke and clean consumer smoke validate that the dist artifact can be installed by a separate Vite/React app, imports the CSS export correctly, and has no workspace-only assumptions.

### Prompt Context

**User prompt (verbatim):** "Continue the ongoing implementation work."

**Assistant interpretation:** Continue the WIDGETSITE implementation from the previous state, with the next practical step being the standalone `@go-go-golems/rag-evaluation-site` npm package.

**Inferred user intent:** Move the design from documentation and Go server primitives into a reusable frontend package that can be published and embedded by the standalone widget server.

**Commit (code):** N/A — worktree changes are not committed in this session.

### What I did

- Created `packages/rag-evaluation-site`.
- Copied reusable React source from the existing RAG frontend:
  - `web/src/widgets/*` into `packages/rag-evaluation-site/src/widgets/`
  - reusable `atoms`, `foundation`, `layout`, and selected `molecules` into `packages/rag-evaluation-site/src/components/`
- Excluded Storybook files from the package copy.
- Removed app-specific molecule exports from the package surface:
  - `CoveragePanel`
  - `QueryPresetList`
- Added package entrypoints and source files:
  - `src/index.ts`
  - `src/components/index.ts`
  - `src/hooks/useWidgetPage.ts`
  - `src/app/App.tsx`
  - `src/app/index.ts`
  - `src/app/main.tsx`
  - `src/styles.css`
  - `src/theme.css`
- Added package configuration:
  - `package.json`
  - `tsconfig.json`
  - `tsconfig.build.json`
  - `vite.config.ts`
  - `vite.app.config.ts`
  - `index.html`
  - `.gitignore`
- Added dist preparation scripts:
  - `scripts/copy-css.mjs`
  - `scripts/prepare-dist.mjs`
  - `scripts/consumer-smoke.mjs`
- Installed package-local dependencies with `pnpm install`.
- Ran validation:
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm build:app`
  - `pnpm pack:smoke`
  - `pnpm consumer:smoke`
- Updated `tasks.md` to mark package scaffolding, CSS/theme export, and default app build tasks complete.

### Why

- `pkg/widgetserver` already exposes `/api/widget/pages/{id}`, so the next missing vertical slice was a reusable frontend package that can consume that API.
- Publishing from compiled `dist/` avoids leaking TypeScript source layout, `workspace:*` dependencies, generated app bundles, or local development files into npm.
- A clean consumer smoke catches package export, type declaration, CSS export, and peer dependency problems that local workspace builds can hide.

### What worked

- Package-local typecheck passed after removing app-specific molecule exports and using the same permissive CSS module declaration pattern as the RAG app.
- The library build produced:
  - `dist/index.js`
  - `dist/ir.js`
  - `dist/app/index.js`
  - `dist/styles.css`
  - `dist/theme.css`
  - generated declaration files
  - generated `dist/package.json`
- The default app build produced `app-dist/` for future Go embedding.
- `npm pack --dry-run ./dist` showed the npm artifact contains compiled JS, declarations, CSS, `README.md`, and `package.json`, without source files or `app-dist`.
- The clean consumer smoke installed the tarball in a temporary Vite app, imported `WidgetRenderer`, imported `@go-go-golems/rag-evaluation-site/styles.css`, imported `RagEvaluationSiteAppProps` from `./app`, ran TypeScript, and built successfully.

### What didn't work

- First package typecheck failed because the copied `CoveragePanel` imported the application RTK service that does not exist in the package:

```text
src/components/molecules/CoveragePanel/CoveragePanel.tsx(5,46): error TS2307: Cannot find module '../../../services/api' or its corresponding type declarations.
```

- Fix: removed `CoveragePanel` and `QueryPresetList` from the package surface and deleted the app-specific copied directories.
- Typecheck also failed because a stricter CSS module declaration made CSS class lookups `string | undefined` under `noUncheckedIndexedAccess`:

```text
src/components/foundation/Caption/Caption.tsx(15,3): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
```

- Fix: used the existing RAG app CSS module declaration style (`const classes: any`) in `src/vite-env.d.ts`.
- First library build failed under TypeScript 6 because `tsconfig.build.json` needed an explicit source root:

```text
tsconfig.build.json(8,5): error TS5011: The common source directory of 'tsconfig.build.json' is './src'. The 'rootDir' setting must be explicitly set to this or another path to adjust your output's file layout.
```

- Fix: added `"rootDir": "src"` to `tsconfig.build.json`.
- First pack smoke used `npm pack --dry-run dist`, which npm interpreted as the registry package named `dist` rather than the local directory. The output showed `📦 dist@0.1.2`.
- Fix: changed pack smoke to `npm pack --dry-run ./dist`.
- The first CSS copy step overwrote Vite's generated component CSS with only the small authored `src/styles.css` file.
- Fix: stopped copying `src/styles.css`; the library build now generates `dist/styles.css`, while the script only copies standalone `theme.css`.
- The first clean consumer smoke used an invalid sample IR node:

```text
src/main.tsx(7,7): error TS2322: Type '{ type: string; text: string; }' is not assignable to type 'WidgetNode'.
  Property 'kind' is missing in type '{ type: string; text: string; }' but required in type 'ComponentNode'.
```

- Fix: changed the smoke fixture to `{ kind: 'text', text: 'consumer smoke' }`.

### What I learned

- The reusable package should not copy all molecules blindly; components that import app services need to stay in the app until they are made explicitly data-driven.
- For this package, the publish contract is clearer when CI publishes `packages/rag-evaluation-site/dist` rather than the package root.
- `npm pack` needs an explicit `./dist` path to avoid resolving a package named `dist`.
- Clean consumer smoke is useful even before CI exists because it caught a real Widget IR sample mismatch and validates the compiled artifact rather than the source tree.

### What was tricky to build

- The package needs two different build outputs with different consumers: `dist/` for npm and `app-dist/` for Go embedding. The library build should not publish `app-dist`, while the app build should remain available for `pkg/defaultspa` later.
- CSS handling required preserving Vite-generated CSS modules in `dist/styles.css` while still offering a standalone `theme.css` export. Copying authored CSS after Vite build accidentally destroyed the generated component stylesheet, so the final flow lets Vite own `styles.css` and only copies `theme.css`.
- The reusable component copy had to distinguish shared UI primitives from app-specific connected widgets. `CoveragePanel` was visually reusable but imports `services/api`, so it is not package-safe yet.

### What warrants a second pair of eyes

- Review the published package surface in `packages/rag-evaluation-site/package.json`, especially the `exports` map and whether component barrels should be exported publicly or remain implementation detail.
- Review whether `src/index.ts` should import `./styles.css` as a side effect or whether consumers should always import the CSS explicitly.
- Review the package-local dependency policy. React and ReactDOM are peers, but package-local install creates development copies for tests/builds.
- Review whether `app-dist/` should remain ignored/generated or be committed once `pkg/defaultspa` is added.

### What should be done in the future

- Add renderer registry override API for custom widgets.
- Add `pkg/defaultspa` to embed `packages/rag-evaluation-site/app-dist`.
- Add CI workflow wiring for `pnpm build`, `pnpm build:app`, `pnpm pack:smoke`, `pnpm consumer:smoke`, Go tests, and npm Trusted Publishing.
- Replace package CSS module `any` declarations with a safer pattern if TypeScript/Vite CSS module typing supports it without fighting `noUncheckedIndexedAccess`.

### Code review instructions

- Start with `packages/rag-evaluation-site/package.json` to review exports, scripts, peer dependencies, and dist-publish assumptions.
- Then review `packages/rag-evaluation-site/src/index.ts`, `src/hooks/useWidgetPage.ts`, and `src/app/App.tsx` for the public runtime API.
- Review `scripts/prepare-dist.mjs` and `scripts/consumer-smoke.mjs` to confirm the package is published from `dist/` and validated from a clean consumer.
- Validate with:
  - `cd packages/rag-evaluation-site && pnpm typecheck`
  - `cd packages/rag-evaluation-site && pnpm build`
  - `cd packages/rag-evaluation-site && pnpm build:app`
  - `cd packages/rag-evaluation-site && pnpm pack:smoke`
  - `cd packages/rag-evaluation-site && pnpm consumer:smoke`

### Technical details

- Package source root: `packages/rag-evaluation-site`
- Published package name: `@go-go-golems/rag-evaluation-site`
- Publish artifact: `packages/rag-evaluation-site/dist`
- Go embeddable app artifact: `packages/rag-evaluation-site/app-dist`
- Default app API base: `/api/widget`
- Page loading hook: `useWidgetPage(url)`

## Step 10: Embed the Default SPA in `pkg/defaultspa`

This step connected the frontend package build to the Go server. The new `pkg/defaultspa` package embeds the built `packages/rag-evaluation-site/app-dist` output and exposes an HTTP handler with SPA fallback behavior.

`pkg/widgetserver` embedded frontend mode now serves this default app automatically when callers do not provide a custom `FrontendHandler`. This completes the basic standalone server vertical slice: trusted JS scripts can produce Widget IR, `/api/widget` serves page JSON, and the same Go server can serve the bundled React app.

### Prompt Context

**User prompt (verbatim):** "continue"

**Assistant interpretation:** Continue after choosing to skip renderer registry overrides, using the recommended next task: `pkg/defaultspa` embedding.

**Inferred user intent:** Keep progressing toward a runnable single-binary WidgetRenderer site rather than stopping at npm package scaffolding.

**Commit (code):** N/A — worktree changes are not committed in this session.

### What I did

- Copied the built default app from `packages/rag-evaluation-site/app-dist` into `pkg/defaultspa/dist`.
- Added `pkg/defaultspa/spa.go` with:
  - `//go:embed all:dist`
  - `FS() fs.FS`
  - `Handler() http.Handler`
  - local `SPAHandler(publicFS fs.FS)` with `index.html` fallback
- Added `pkg/defaultspa/spa_test.go` to verify:
  - embedded `index.html` exists and contains `id="root"`
  - embedded assets exist
  - `/` returns the app index
  - `/pages/demo` falls back to the app index
- Updated `pkg/widgetserver/server.go`:
  - imports `pkg/defaultspa`
  - `FrontendEmbedded` uses a supplied `FrontendHandler` when present
  - otherwise defaults to `defaultspa.Handler()`
- Updated `pkg/widgetserver/server_test.go` with tests for:
  - default embedded frontend serving the app index
  - custom embedded handler override still working
- Added `packages/rag-evaluation-site/scripts/sync-defaultspa.mjs`.
- Added package script `sync:defaultspa` to refresh `pkg/defaultspa/dist` from `app-dist`.
- Updated WIDGETSITE tasks and design status.

### Why

- The default app build existed, but Go could not serve it as an embedded app yet.
- `pkg/widgetserver` previously required a caller-supplied handler in embedded mode, which left the single-binary default app path incomplete.
- A sync script makes the generated frontend-to-Go-embed step explicit and repeatable.

### What worked

- Focused tests passed:
  - `go test ./pkg/defaultspa ./pkg/widgetserver -count=1`
- Broader Go validation passed:
  - `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/defaultspa ./pkg/widgetserver -count=1`
  - `go test ./... -count=1`
- Frontend/package validation still passed after adding the sync script:
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm build:app`
  - `pnpm sync:defaultspa`
  - `pnpm pack:smoke`
  - `pnpm consumer:smoke`

### What didn't work

- No test failures in this step.
- One design constraint remains: `pkg/defaultspa/dist` is a copied generated artifact. The current implementation includes a manual/package-script sync step, but CI still needs to run it in the correct order.

### What I learned

- Keeping `defaultspa.SPAHandler` local avoids an import cycle. If `defaultspa` imported `widgetserver.SPAHandler`, then `widgetserver` could not import `defaultspa` for embedded mode defaults.
- The existing `widgetserver.SPAHandler` behavior was simple enough to duplicate locally for now.
- The embedded default app is testable without launching a browser by asserting that SPA routes return the built `index.html` shell.

### What was tricky to build

- The package build output lives under `packages/rag-evaluation-site/app-dist`, but `go:embed` can only embed files under the package directory. The implementation therefore copies the app build into `pkg/defaultspa/dist` and embeds that directory.
- This introduces an ordering invariant for CI and release builds: build the app, sync `pkg/defaultspa/dist`, then run Go tests/builds. The new `sync:defaultspa` script makes that invariant explicit.

### What warrants a second pair of eyes

- Review whether duplicating SPA fallback logic in `pkg/defaultspa` and `pkg/widgetserver` is acceptable or whether a tiny shared package should own that helper.
- Review whether `pkg/defaultspa/dist` should be committed as an embedded artifact or generated during CI/release only.
- Review whether source maps should be embedded in production by default; the current copied app includes the Vite JS source map.

### What should be done in the future

- Wire the CI workflow to run `pnpm build:app && pnpm sync:defaultspa` before Go tests and binary builds.
- Consider disabling sourcemaps for production embedded app builds if binary size matters.
- Add a browser smoke that starts `pkg/widgetserver` in embedded mode and verifies the default app calls `/api/widget/pages/{id}`.

### Code review instructions

- Start with `pkg/defaultspa/spa.go` to review the embed root, `FS`, and fallback handler.
- Then review `pkg/widgetserver/server.go` `frontendHandler()` to confirm embedded mode default/custom-handler behavior.
- Review `packages/rag-evaluation-site/scripts/sync-defaultspa.mjs` for the frontend-to-Go-embed sync path.
- Validate with:
  - `go test ./pkg/defaultspa ./pkg/widgetserver -count=1`
  - `go test ./... -count=1`
  - `cd packages/rag-evaluation-site && pnpm build:app && pnpm sync:defaultspa`

### Technical details

- Embedded source directory: `pkg/defaultspa/dist`
- Frontend build source: `packages/rag-evaluation-site/app-dist`
- Sync command: `cd packages/rag-evaluation-site && pnpm sync:defaultspa`
- Default server behavior: `FrontendEmbedded` + nil `FrontendHandler` => `defaultspa.Handler()`

## Step 11: Add Schema, Actions, and Embedded Browser Smoke

This step completed the remaining runtime vertical slice after renderer registry overrides were deferred. The Widget server now publishes versioned schema metadata, validates page `schemaVersion`, executes Goja-defined server actions, and the embedded React app can POST those actions and refresh the page.

The end-to-end proof used a ticket-local smoke server and script, served the embedded default SPA from `pkg/defaultspa`, drove it through Playwright, clicked a server-backed button, observed the action POST and refresh GET, and captured a screenshot artifact.

### Prompt Context

**User prompt (verbatim):** "ok, continue, all the way to smoke testing with playwright! Let's get this done. I'm going swimming I want you to be done when I come back."

**Assistant interpretation:** Finish the remaining schema/action work and validate the whole embedded WidgetRenderer stack in a real browser with Playwright.

**Inferred user intent:** Return to a completed, smoke-tested implementation rather than another partial planning slice.

**Commit (code):** N/A — worktree changes are not committed in this session.

### What I did

- Added `pkg/widgetschema/schema.go`:
  - `Version = "0.1.0"`
  - component type list
  - cell kind list
  - `Summary()`
  - `JSONSchema()` using draft 2020-12 style metadata
- Updated `pkg/widgetrunner/runner.go`:
  - `PageResult` now includes `schemaVersion`
  - page normalization defaults missing schema version to `0.1.0`
  - page validation rejects unsupported schema versions
  - added `ErrActionNotFound` and `ErrInvalidAction`
  - added `InvokeAction(ctx, name, req)`
  - added `lookupActionFunction`
  - added `NormalizeActionResult`
  - action functions receive `(ctx, payload)` where `ctx.action` is the action name plus caller context fields
- Updated `pkg/widgetrunner/runner_test.go` for schema version and action execution tests.
- Updated `pkg/widgetserver/server.go`:
  - `GET /api/widget/schema` returns `widgetschema.Summary()` with embedded JSON Schema
  - `POST /api/widget/actions/{name}` decodes action request JSON
  - missing actions map to `404 action_not_found`
  - invalid action results map to `400 invalid_action_result`
  - runtime errors map to `500 action_runtime_error`
- Updated `pkg/widgetserver/server_test.go` for schema JSON Schema presence and action endpoint behavior.
- Updated package frontend action handling:
  - `packages/rag-evaluation-site/src/widgets/actions.ts` default server action URL now uses `/api/widget/actions/{name}`
  - `packages/rag-evaluation-site/src/app/App.tsx` passes an `onAction` handler to `WidgetRenderer`, posts actions to the configured API base, dispatches `widget:toast`, and refreshes when the action result has `refresh: true`
- Rebuilt package and default app, then synced `app-dist` into `pkg/defaultspa/dist`.
- Added ticket-local smoke harness:
  - `scripts/03-widgetsite-smoke-server.go`
  - `scripts/smoke-widgetsite/page.js`
- Started the smoke server on `127.0.0.1:8897`.
- Ran API smoke checks with `curl` for health and page JSON.
- Ran Playwright browser smoke against `http://127.0.0.1:8897/pages/smoke`.
- Captured screenshot: `widgetsite-embedded-smoke-2026-06-05.png`.
- Stopped the temporary smoke server.

### Why

- Schema/versioning makes the Widget IR contract explicit enough for frontend/backend compatibility and future breaking changes.
- Server actions make the UI interactive beyond static page rendering.
- Browser smoke validates the real embedded app, not just Go handlers or TypeScript compilation.

### What worked

- Focused tests passed:
  - `go test ./pkg/widgetschema ./pkg/widgetrunner ./pkg/widgetserver -count=1`
- Full validation passed:
  - `cd packages/rag-evaluation-site && pnpm typecheck`
  - `pnpm build`
  - `pnpm build:app`
  - `pnpm sync:defaultspa`
  - `pnpm pack:smoke`
  - `pnpm consumer:smoke`
  - `cd ../.. && go test ./... -count=1`
- Smoke server API checks passed:
  - `GET /api/widget/health => {"service":"widget-site","status":"ok"}`
  - `GET /api/widget/pages/smoke` returned `schemaVersion: "0.1.0"` and a `Clicks 0` page
- Playwright smoke passed:
  - loaded `http://127.0.0.1:8897/pages/smoke`
  - saw `Widget Smoke Header`
  - saw `Clicks 0`
  - clicked `Increment`
  - network showed `POST http://127.0.0.1:8897/api/widget/actions/increment => 200 OK`
  - network showed refresh `GET http://127.0.0.1:8897/api/widget/pages/smoke => 200 OK`
  - UI updated to `Clicks 1`
  - browser console warnings/errors: `0`

### What didn't work

- No validation failures in this final slice.
- One implementation tradeoff remains: the JSON Schema is intentionally broad for component props (`additionalProperties: true`) rather than a fully precise per-component prop schema. This is enough for versioning and node shape validation, but not yet enough to catch every prop-level mistake.

### What I learned

- The existing `WidgetRenderer` action hook was enough to wire real server actions without changing the renderer tree itself.
- The default app needs to own refresh behavior because only it knows the page URL and `useWidgetPage` refresh function.
- The browser smoke is the most useful validation for the embedded stack because it proves the app-dist sync, Go embedding, route fallback, API endpoint, action endpoint, and frontend refresh behavior together.

### What was tricky to build

- Goja action context needed to expose JSON-style field names. The action implementation mirrors the earlier page context lesson by explicitly constructing a map instead of relying on Go struct JSON tags.
- The action endpoint must distinguish missing actions from runtime failures so UI authors can debug script exports versus thrown exceptions.
- The JSON Schema needed to be useful without pretending to fully model every component prop. The current schema validates page/node shape and advertises component/cell vocabularies; deeper prop validation can be layered on later.

### What warrants a second pair of eyes

- Review `pkg/widgetschema.JSONSchema()` for whether the schema should be split into a standalone `.json` file or generated from TypeScript types later.
- Review `NormalizeActionResult`: it defaults missing `ok` to true for ergonomic JS actions; confirm that default is acceptable.
- Review frontend action error handling in `RagEvaluationSiteApp`; currently failed actions throw inside an async void handler and do not render an error banner.
- Review whether production embedded builds should include source maps; current `app-dist` still includes a JS source map.

### What should be done in the future

- Add CI/trusted publishing workflow wiring.
- Add an automated repo-level Playwright test if this project standardizes browser automation in CI.
- Consider prop-level JSON Schema precision for each built-in widget.
- Consider a visible toast/error component in the default app for action results and failures.

### Code review instructions

- Start with `pkg/widgetschema/schema.go` for the public schema contract.
- Then review `pkg/widgetrunner/runner.go` around `InvokeAction`, `NormalizeActionResult`, and schemaVersion validation.
- Review `pkg/widgetserver/server.go` `handleAction` and `handleSchema`.
- Review `packages/rag-evaluation-site/src/app/App.tsx` and `src/widgets/actions.ts` for frontend action behavior.
- Review the ticket smoke harness under `scripts/` for the browser smoke scenario.
- Validate with:
  - `go test ./pkg/widgetschema ./pkg/widgetrunner ./pkg/widgetserver -count=1`
  - `cd packages/rag-evaluation-site && pnpm typecheck && pnpm build && pnpm build:app && pnpm sync:defaultspa && pnpm pack:smoke && pnpm consumer:smoke`
  - `go test ./... -count=1`

### Technical details

- Schema endpoint: `GET /api/widget/schema`
- Schema version: `0.1.0`
- Action endpoint: `POST /api/widget/actions/{name}`
- Goja action export shape: `exports.actions = { name(ctx, payload) { return { ok, refresh, toast, data } } }`
- Smoke server: `go run .../scripts/03-widgetsite-smoke-server.go --addr 127.0.0.1:8897 --scripts .../scripts/smoke-widgetsite`
- Screenshot artifact: `widgetsite-embedded-smoke-2026-06-05.png`
