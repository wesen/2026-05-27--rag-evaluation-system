---
Title: Investigation Diary
Ticket: RAGEVAL-UI-DSL
Status: active
Topics:
    - go
    - goja
    - javascript
    - web
    - react
    - dsl
    - kanban
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Chronological investigation of the RAG Evaluation System architecture and the goja-hosting-site reference DSL patterns.
LastUpdated: 2026-06-02T21:00:00-04:00
WhatFor: Track what was discovered, what patterns were identified, and how the design doc was constructed.
WhenToUse: Resume work on this ticket, onboard new team members, or verify design decisions against original evidence.
---

# Investigation Diary

## Goal

Understand the RAG Evaluation System's architecture (Go backend, React frontend, widget inventory) and the goja-hosting-site's UI DSL / Kanban DSL patterns so we can replicate them in this project and produce a comprehensive intern onboarding guide.

---

## Step 1: Map Project Structure

### Prompt Context

**User prompt (verbatim):** "Create a new docmgr ticket in 2026-05-27--rag-evaluation-system/ttmp using `docmgr --root 2026-05-27--rag-evaluation-system/ttmp` to create a ui.dsl and kanban dsl like in 2026-05-03--goja-hosting-site/ to create webpages using the widgets and primitives in 2026-05-27--rag-evaluation-system/web/. Create a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet points and pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and then upload to remarkable."

**Assistant interpretation:** Create a docmgr ticket documenting how to build UI DSL and Kanban DSL modules for the RAG system, modeled after the goja-hosting-site reference, using the existing React widgets as a design basis. Write an exhaustive intern guide.

**Inferred user intent:** Produce onboarding documentation that connects the existing Go/React codebase to the DSL paradigm, with concrete implementation guidance.

### What I did

- Listed the project root directory to understand the monorepo structure
- Found `2026-05-27--rag-evaluation-system/` as the main project
- Found `2026-05-03--goja-hosting-site/` as the reference project inside the same workspace
- Found `go-go-goja/` as the shared Goja runtime library

### What worked

- The workspace contains both the target project and the reference implementation
- docmgr is already initialized with vocabulary at `2026-05-27--rag-evaluation-system/ttmp/vocabulary.yaml`

### What didn't work

- Initially looked for `web/` at the workspace root; it's actually at `2026-05-27--rag-evaluation-system/web/`
- Had to adjust paths to account for the nested project structure

### What I learned

- The workspace is a monorepo with multiple related projects
- The reference DSL implementation lives in `go-go-goja/modules/uidsl/` (shared library) and `goja-hosting-site/pkg/kanbanddsl/` (project-specific)

---

## Step 2: Analyze the React Frontend Widgets

### What I did

- Read `web/src/App.tsx` to understand the view routing and navigation structure
- Read `web/src/services/api.ts` to catalog all API endpoints and types
- Read `web/src/components/index.ts` to see the atomic design organization
- Read `web/src/components/layout/AppShell/AppShell.tsx` for layout structure
- Read `web/src/components/molecules/DataTable/DataTable.tsx` for component contract patterns

### What worked

- Identified 6 main views: Search, Corpus, Workflows, Pipeline, Embeddings, Evaluation
- Found the complete RTK Query API with 30+ auto-generated hooks
- Confirmed atomic design: atoms → foundation → layout → molecules → organisms → pages
- DataTable shows a generic typed pattern with column definitions, row selection, and empty states

### What I learned

- The frontend uses CSS Modules (`*.module.css`) not Tailwind utility classes exclusively
- Components export barrel files for clean imports
- Every major component has Storybook stories
- The component library is mature and well-organized

### Key file references

- `web/src/App.tsx` — View router with `rag:navigate-to-chunk` and `rag:navigate-to-workflows` custom events
- `web/src/services/api.ts` — Complete API surface with `tagTypes` for cache invalidation
- `web/src/components/molecules/DataTable/DataTable.tsx` — Generic `<T>` typed table component

---

## Step 3: Analyze the Go Backend

### What I did

- Read `cmd/rag-eval/main.go` for command structure
- Read `cmd/rag-eval/cmds/serve/server.go` for HTTP server wiring
- Read `internal/api/handlers.go` for API handler implementations
- Read `internal/web/spa.go` for SPA serving logic

### What worked

- Confirmed standard Go 1.22+ `http.ServeMux` with path values (`{id}`)
- API routes registered before SPA fallback: `mux.Handle("/", web.SPAHandler())`
- Server opens SQLite, runs migrations, registers handlers, starts server with graceful shutdown
- All handlers use a consistent `writeJSON` / `writeError` helper pattern

### What I learned

- The workflow engine DB is separate (`state/rag-eval-workflows.db`) from the main DB
- All queries go through SQLC-generated `db.Queries` struct
- Services are instantiated per-request (not singletons), which makes them easy to test

### Key file references

- `cmd/rag-eval/cmds/serve/server.go:22-52` — Server construction sequence
- `internal/api/handlers.go:17-85` — Route registration block
- `internal/web/spa.go:8-26` — SPA serving with fallback to index.html

---

## Step 4: Analyze the Reference UI DSL

### What I did

- Read `go-go-goja/modules/uidsl/module.go` for module registration
- Read `go-go-goja/modules/uidsl/node.go` for AST node types
- Read `go-go-goja/modules/uidsl/render.go` for HTML rendering logic

### What worked

- Found the exact mechanism: `require.RegisterNativeModule("ui.dsl", Loader)`
- Every tag is a variadic function: `(attrs?, ...children)`
- Special helpers: `fragment`, `page`, `table`, `codeBlock`, `badge`, `tabs`
- Rendering uses `html.EscapeString` for all text and attributes

### What I learned

- `ui.page()` automatically routes `<title>`, `<meta>`, `<link>`, `<style>` to `<head>`
- Attributes support boolean (present/absent), string, class arrays, and style maps
- `raw()` is the only escape hatch; everything else is safe

### Key file references

- `go-go-goja/modules/uidsl/module.go:15-21` — Registration and tag list
- `go-go-goja/modules/uidsl/module.go:39-49` — `elementFromCall` constructor
- `go-go-goja/modules/uidsl/render.go:74-125` — Node rendering
- `go-go-goja/modules/uidsl/render.go:128-160` — Attribute rendering with escaping

---

## Step 5: Analyze the Reference Kanban DSL

### What I did

- Read `goja-hosting-site/pkg/kanbanddsl/types.go` for type definitions
- Read `goja-hosting-site/pkg/kanbanddsl/builder.go` for builder implementation
- Read `goja-hosting-site/pkg/kanbanddsl/render.go` for board rendering
- Read `goja-hosting-site/pkg/kanbanddsl/mount.go` for Express mounting
- Read `goja-hosting-site/pkg/kanbanddsl/dispatch.go` for action routing
- Read `goja-hosting-site/examples/kanban/scripts/app.js` for complete usage example

### What worked

- The builder pattern creates a Go-side configuration from JavaScript fluent calls
- Validation at `.build()` time catches missing required fields
- Rendering produces `uidsl.Node` trees, then renders to HTML strings
- Mounting registers three routes: `client.js`, `fragment`, and `action`

### What I learned

- The Kanban DSL depends on `uidsl` for HTML generation and the Express module for routing
- Actions return `{ok: true, refresh: true, ...}`; the server optionally re-renders HTML
- Drag/drop requires `features.dragDrop()` AND `actions.cardMoved()`; validation enforces this
- Client search uses `data-kb-search-text` attributes; server search re-queries via fragment route

### Key file references

- `goja-hosting-site/pkg/kanbanddsl/types.go` — All type definitions
- `goja-hosting-site/pkg/kanbanddsl/builder.go:39-100` — Validation logic
- `goja-hosting-site/pkg/kanbanddsl/render.go:15-75` — Board render flow
- `goja-hosting-site/pkg/kanbanddsl/mount.go:14-120` — Route registration
- `goja-hosting-site/examples/kanban/scripts/app.js` — Complete working example

---

## Step 6: Create Docmgr Ticket and Write Design Doc

### What I did

- Created docmgr ticket `RAGEVAL-UI-DSL`
- Added design-doc `01-ui-dsl-and-kanban-dsl-design-and-implementation-guide.md`
- Added reference doc `01-investigation-diary.md` (this file)
- Wrote a comprehensive 45,000+ character design document with:
  - Executive summary
  - System architecture (backend + frontend)
  - Component inventory
  - Goja runtime explanation
  - UI DSL implementation details
  - Kanban DSL implementation details
  - Example scripts
  - Decision records
  - Testing strategy
  - File reference tables

### What worked

- docmgr ticket created successfully with correct topics
- Design doc covers all requested sections: prose, bullets, pseudocode, diagrams, API refs, file refs
- Document is written for an intern with no prior system knowledge

### What was tricky to build

- Understanding which files were in the main project vs the reference project
- The `go-go-goja` module is shared but lives in a sibling directory
- Making sure all file paths in RelatedFiles are absolute for clarity

### What warrants a second pair of eyes

- The example DSL scripts in the design doc are pseudocode; they need to be tested against a real Goja runtime
- The proposed `internal/dsl/` package structure is a recommendation, not yet implemented
- File paths in RelatedFiles must be verified when the project structure changes

### What should be done in the future

- Implement the `internal/dsl/` Go package
- Write actual working JavaScript example files
- Add Playwright tests for DSL-rendered pages
- Create shared CSS between React and DSL views
- Implement hot-reload for Goja scripts in development

---

## Step 7: Backfill — Implement Widget IR, React Renderer, Storybook Coverage, and Static Demo

This step records the implementation work that happened after the design review. The implementation deliberately followed the revised architecture: Go/Goja should produce a JSON-compatible Widget IR, while the existing React component registry renders the actual UI. This avoids duplicating CSS Modules and preserves component behavior in the browser.

The work delivered the first end-to-end vertical slice: hardcoded backend Widget IR is served from `/api/v1/dsl/pages/demo`, fetched by a new React `DslPreviewPage`, and rendered through `WidgetRenderer` using the real component library.

### Prompt Context

**User prompt (verbatim):** "ok. Add detailed phases + tasks per phase to the ticket tasks.md if not already. I also want to have a tremendous variety and amount of storybook stories for the different combinations for the IR widget renderer. That way we can immediately see how things look like without having to run through go and goja.

Then, work and do step 1 + 2"

**Assistant interpretation:** Update ticket tasks with phased implementation, then implement Step 1 (Widget IR TypeScript schema) and Step 2 (React WidgetRenderer registry), plus substantial Storybook examples.

**Inferred user intent:** Make the Widget IR architecture concrete and visually inspectable before adding Goja execution.

**Commit (code):** N/A — worktree changes are not committed in this session.

### What I did

- Rewrote `tasks.md` with detailed phases from architecture guardrails through Goja module implementation, action dispatch, page recipes, testing, and reMarkable handoff.
- Added `web/src/widgets/ir.ts` with JSON-compatible Widget IR types:
  - `WidgetNode`, `TextNode`, `ElementNode`, `ComponentNode`
  - `ActionSpec`
  - `CellSpec`
  - table/metadata/nav/form/widget prop specs
  - utility constructors `text`, `element`, `component`
- Added `web/src/widgets/actions.ts` with action dispatch helpers for `copy`, `event`, `navigate`, and `server` actions.
- Added `web/src/widgets/cellRenderers.tsx` to render serializable `CellSpec` values into React table cells.
- Added `web/src/widgets/WidgetRenderer.tsx` mapping IR component types to real React components.
- Added `web/src/widgets/index.ts` barrel exports.
- Added `web/src/widgets/WidgetRenderer.stories.tsx` with broad Storybook coverage for primitives, layouts, metadata, tables, page compositions, and error cases.
- Added `tslib` as a dev dependency because Storybook build failed through `recast` without it.
- Added static backend demo endpoint `GET /api/v1/dsl/pages/{id}` with `demo` support in `internal/api/dsl_handlers.go`.
- Registered the DSL demo route in `internal/api/handlers.go`.
- Added `DslPreviewPage` under `web/src/components/pages/DslPreviewPage/`.
- Added `useGetDslPageQuery` to `web/src/services/api.ts`.
- Added a `DSL` nav entry and view switch branch in `web/src/App.tsx`.
- Ran frontend and backend validation:
  - `pnpm typecheck`
  - `pnpm build-storybook`
  - `pnpm build`
  - `go test ./... -count=1`
  - `docmgr doctor --ticket RAGEVAL-UI-DSL --stale-after 30`
- Re-uploaded the ticket bundle to reMarkable after the implementation updates.

### Why

- The revised architecture depends on proving that Widget IR can be rendered by the actual React app before Goja is introduced.
- Storybook coverage gives fast visual feedback for Widget IR combinations without needing to run the Go server or Goja scripts.
- A static backend endpoint validates the transport shape and catches API/frontend type mismatches early.

### What worked

- `pnpm typecheck` passed after fixing two renderer type issues.
- `pnpm build-storybook` passed after adding `tslib`.
- `pnpm build` passed and refreshed `internal/web/dist` embedded SPA assets.
- `go test ./... -count=1` passed across the repository.
- `docmgr doctor` passed after cleaning stale related-file entries.
- The static demo route exercises real IR with `AppShell`, `AppNav`, `Stack`, `Panel`, `MetadataGrid`, `DashboardGrid`, `FormRow`, `TextInput`, `SelectInput`, `Inline`, `Button`, `DataTable`, and `StatusText`.

### What didn't work

- First `pnpm typecheck` failed because Storybook packages were not installed in `node_modules`:
  - `Cannot find module '@storybook/react-vite' or its corresponding type declarations.`
  - Resolution: ran `pnpm install` in `web/`.
- First Storybook build failed with:
  - `Error: Cannot find module 'tslib'`
  - Require stack included `node_modules/.pnpm/recast@0.23.11/node_modules/recast/main.js`.
  - Resolution: `pnpm add -D tslib`, then `pnpm build-storybook` succeeded.
- `WidgetRenderer.tsx` initially had a narrowing issue where `props.onRowSelect` was seen as possibly undefined inside a closure.
  - Resolution: assigned `const rowSelectAction = props.onRowSelect` before creating the callback.
- `renderTextInput` had an unused `onAction` parameter after implementation.
  - Resolution: removed the parameter and updated the dispatch switch call.

### What I learned

- Storybook packages were already declared in `package.json`, but the checkout's `node_modules` was incomplete until `pnpm install` was run.
- The current frontend TypeScript config includes stories in `src`, so missing Storybook type packages break `pnpm typecheck`.
- The Widget IR approach integrates cleanly with RTK Query: `DslPreviewPage` can fetch JSON from `/api/v1/dsl/pages/demo` just like any other API resource.
- The existing App state-router is easy to extend for a `DSL` preview view.

### What was tricky to build

- Keeping `WidgetProps` JSON-compatible while still expressive enough for component props was the key tension. The solution uses `RenderableValue` for places that need strings, numbers, booleans, null, or nested `WidgetNode` values.
- `DataTable` required a separate `CellSpec` vocabulary because its React API uses function-valued `cell` renderers, which cannot cross the JSON boundary.
- Action handling needed to be present but not overbuilt. The initial `ActionSpec` implementation dispatches `copy`, `event`, `navigate`, and `server`, but most stories use static rendering for now.
- Some component props are naturally controlled (`TextInput`, `SelectInput`). For this first slice, `TextInput` is rendered `readOnly` to avoid controlled-input warnings without introducing form state.

### What warrants a second pair of eyes

- `ActionSpec` interpolation for navigation uses a small custom placeholder syntax. It should be reviewed before being treated as stable.
- `ElementNode` currently uses `React.createElement` with sanitized-ish but not deeply audited attrs. Before exposing arbitrary element nodes to untrusted scripts, add stricter tag/attribute allowlists.
- The static Go demo constructs a large nested `map[string]any`; it is fine for a fixture but should be replaced by generated or typed helpers once Goja `widget.dsl` exists.
- `DslPreviewPage` currently exposes a top-level `DSL` nav item to all builds. Decide later whether it should be dev-only, feature-flagged, or permanent.

### What should be done in the future

- Add a Playwright smoke test for clicking the `DSL` nav item and seeing `[data-rag-page="DslPreviewPage"]` plus `DataTable` rows.
- Implement `internal/dsl/widgetdsl` Goja module so scripts can produce the same IR as the static demo endpoint.
- Add validation for backend IR before returning it to the frontend.
- Add Storybook stories for action dispatch with mocked `onAction` handlers.
- Add a proper `GET /api/v1/dsl/pages` listing endpoint once multiple pages exist.

### Code review instructions

- Start with `web/src/widgets/ir.ts` to verify the JSON boundary.
- Review `web/src/widgets/WidgetRenderer.tsx` and confirm every supported `RagWidgetType` renders through a real React component, not hand-coded HTML.
- Review `web/src/widgets/cellRenderers.tsx` because it defines the table-cell vocabulary Goja authors must use.
- Review `internal/api/dsl_handlers.go` as a fixture endpoint only; do not treat the nested map style as the final backend authoring style.
- Validate with:
  - `cd web && pnpm typecheck`
  - `cd web && pnpm build-storybook`
  - `cd web && pnpm build`
  - `go test ./... -count=1`

### Technical details

- Widget IR schema: `web/src/widgets/ir.ts`
- Renderer: `web/src/widgets/WidgetRenderer.tsx`
- Cell renderers: `web/src/widgets/cellRenderers.tsx`
- Action dispatch: `web/src/widgets/actions.ts`
- Storybook coverage: `web/src/widgets/WidgetRenderer.stories.tsx`
- Static API endpoint: `internal/api/dsl_handlers.go`
- Route registration: `internal/api/handlers.go`
- Frontend page: `web/src/components/pages/DslPreviewPage/DslPreviewPage.tsx`
- API client: `web/src/services/api.ts`
- App navigation: `web/src/App.tsx`

---

## Step 8: Diary Process Correction

This step records a process correction requested by the user: keep a detailed diary while working, and backfill if needed. The implementation work above was backfilled immediately after the reminder so future continuation has a clear audit trail.

### Prompt Context

**User prompt (verbatim):** "keep a detailed diary as you work (backfill if you haven't written one!)"

**Assistant interpretation:** Update the ticket diary with detailed implementation notes and continue recording future work as it happens.

**Inferred user intent:** Make the implementation trace reviewable and continuation-friendly, including commands, failures, validations, and rationale.

**Commit (code):** N/A — worktree changes are not committed in this session.

### What I did

- Backfilled Step 7 with detailed notes for Widget IR, React renderer, Storybook, static API endpoint, `DslPreviewPage`, validation, and reMarkable upload.
- Recorded exact failed commands and error summaries from typecheck and Storybook build.
- Recorded the validation commands that passed.

### Why

- The ticket already had an investigation diary, but it had not yet captured the implementation details of phases 1–4.
- Backfilling prevents future agents or interns from having to infer what changed from git diff alone.

### What worked

- The diary now captures the work sequence and important decisions.

### What didn't work

- The diary was not updated immediately while phases 1–4 were implemented. This step corrects that gap.

### What I learned

- The implementation diary should be updated after each vertical slice, not only at the end of a larger session.

### What was tricky to build

- The backfill needed to distinguish implementation changes from prior design/review documentation so the ticket remains navigable.

### What warrants a second pair of eyes

- Future diary entries should include exact command output snippets for any non-trivial failure, especially if Playwright or Goja runtime errors appear.

### What should be done in the future

- Add a diary step after the Playwright smoke test and another after the Goja `widget.dsl` module skeleton.

### Code review instructions

- Check Step 7 before reviewing the Widget IR implementation files.
- Check Step 8 to verify the diary process correction was captured.

### Technical details

- Diary file: `reference/01-investigation-diary.md`

---

## Step 9: Implement Initial Goja `widget.dsl` Authoring Module

This step added the first Goja-side authoring layer. The module does not render HTML and does not know about React. Instead, it emits the same JSON-compatible Widget IR shape consumed by the frontend `WidgetRenderer`.

The key idea is that scripts can now say `rag.panel(...)`, `rag.caption(...)`, or `rag.dataTable(...)` and receive plain maps representing `ComponentNode` values. The React frontend remains the renderer.

### Prompt Context

**User prompt (verbatim):** "no need to upload things to remarkable unless asked, btw.

continue"

**Assistant interpretation:** Continue implementation, stop automatically uploading to reMarkable, and keep the implementation diary current.

**Inferred user intent:** Move from static demo IR toward real Goja-authored Widget IR while preserving documentation discipline.

**Commit (code):** N/A — worktree changes are not committed in this session.

### What I did

- Loaded the `go-go-goja-module-authoring` skill because this step creates a Goja native module.
- Read the go-go-goja module contract in `go-go-goja/modules/common.go`.
- Read `goja-bleve/pkg/module.go` and `goja-bleve/pkg/module_test.go` for a nearby module registration and runtime test pattern.
- Added `internal/dsl/widgetdsl/module.go` implementing `modules.NativeModule`.
- Registered the module through `init()` as `widget.dsl` in the default module registry.
- Added a direct `Register(*require.Registry)` helper that registers both `widget.dsl` and `rag.dsl` aliases.
- Exported authoring helpers:
  - low-level: `text`, `element`, `component`, `fragment`
  - component shortcuts: `panel`, `stack`, `inline`, `button`, `caption`, `statusText`, `dataTable`, `metadataGrid`, etc.
  - cell helpers: `cell.field`, `cell.number`, `cell.status`, `cell.caption`, `cell.template`, `cell.link`, `cell.constant`
- Added `internal/dsl/widgetdsl/module_test.go` with Goja runtime tests.
- Ran:
  - `gofmt -w internal/dsl/widgetdsl/module.go internal/dsl/widgetdsl/module_test.go`
  - `go test ./internal/dsl/widgetdsl -count=1`
  - `go test ./... -count=1`
  - `cd web && pnpm typecheck`
- Updated `tasks.md`, ticket changelog, and related files.

### Why

- The frontend renderer slice was already complete, but there was no script authoring module yet.
- The revised architecture requires Goja to emit Widget IR rather than HTML.
- This module establishes the `require("widget.dsl")` contract and verifies that it emits JSON-serializable structures.

### What worked

- `require("widget.dsl")` exposes the expected helper functions.
- `require("rag.dsl")` works when registered directly with `Register(reg)`.
- Nested component construction works:
  - `rag.panel({title: "Demo"}, rag.stack(...))`
- JavaScript arrays passed as children are flattened correctly.
- `DataTable` column definitions with cell helpers serialize cleanly through `JSON.stringify`.
- `go test ./internal/dsl/widgetdsl -count=1` passed.
- `go test ./... -count=1` passed.
- `pnpm typecheck` still passed.

### What didn't work

- During self-review before testing, I noticed `isWidgetNode` initially attempted to call `value.ToObject(nil)`, which is unsafe because Goja object conversion should use the runtime.
- The first draft also used a brittle array-like check based on JavaScript `length` plus `ExportType().String()`.
- Resolution:
  - Changed `isWidgetNode` to accept `*goja.Runtime` and call `value.ToObject(vm)`.
  - Replaced array detection with a `reflect`-based check against `value.ExportType().Kind()` for slices and arrays.
  - Added `looksLikeWidgetNodeExport` for distinguishing prop maps from already-built widget node maps.

### What I learned

- The `modules.NativeModule` contract is small: `Name()`, `Doc()`, and `Loader(*goja.Runtime, *goja.Object)`.
- For this project, `widget.dsl` can be lightweight because it only builds plain IR maps.
- Most semantic validation can be deferred, but child flattening and WidgetNode-vs-props detection need to be correct immediately or authoring ergonomics are poor.

### What was tricky to build

- The function call shape is intentionally JSX-like: `rag.panel(props?, ...children)`. Distinguishing `props` from a child widget node requires checking whether the first object argument already has `kind: "text" | "element" | "component"`.
- JavaScript arrays should be usable for mapped children, for example `rows.map(...)`. The module flattens arrays recursively so authors can pass arrays naturally.
- `cell.constant(value)` needs to accept either primitive renderables or nested widget nodes. It uses the same child normalization path as component children.

### What warrants a second pair of eyes

- The module currently does minimal validation. `rag.dataTable({})` can emit invalid IR; frontend rendering may fail if required fields are absent.
- `element(tag, attrs?, ...children)` has no tag or attribute allowlist yet. This is acceptable for early trusted scripts but not for untrusted script authors.
- The default registry only self-registers `widget.dsl`; the `rag.dsl` alias is available through direct `Register(reg)`. Decide whether aliasing should also exist in the global module registry path.

### What should be done in the future

- Add validation for required props before returning IR, especially `DataTable.columns`, `DataTable.rows`, `DataTable.getRowKey`, `StatusText.status`, `TabList.items`, and `TabList.activeId`.
- Add TypeScript declaration support if this module becomes part of a generated xgoja/provider workflow.
- Add a runner that loads actual DSL page scripts and calls `exports.page(ctx)`.
- Add a backend IR validator before returning script-produced IR to the React app.

### Code review instructions

- Start in `internal/dsl/widgetdsl/module.go`.
- Review `propsAndChildStart`, `exportChildren`, and `exportChild` because these define the JavaScript authoring ergonomics.
- Review `module_test.go` to see the supported contract in executable form.
- Validate with:
  - `go test ./internal/dsl/widgetdsl -count=1`
  - `go test ./... -count=1`
  - `cd web && pnpm typecheck`

### Technical details

- Module: `internal/dsl/widgetdsl/module.go`
- Tests: `internal/dsl/widgetdsl/module_test.go`
- Module names: `widget.dsl` and direct-registration alias `rag.dsl`
- Exported namespace: `cell` for serializable table cell specifications

---

## Step 10: Add API Smoke Coverage for the DSL Demo Endpoint

This step added automated smoke coverage around the static backend DSL page endpoint. The original continuation plan mentioned Playwright, but the web package does not currently include browser-test tooling, so I chose the closest existing test style: Go HTTP endpoint tests.

The tests make sure `/api/v1/dsl/pages/demo` returns a JSON-serializable Widget IR payload rooted at `AppShell`, and that unknown DSL page ids return `404`.

### Prompt Context

**User prompt (verbatim):** (same as Step 9)

**Assistant interpretation:** Continue implementation and validation without uploading to reMarkable.

**Inferred user intent:** Improve confidence in the DSL preview path while avoiding unnecessary new tooling and external handoff steps.

**Commit (code):** N/A — worktree changes are not committed in this session.

### What I did

- Checked `web/package.json` and found no Playwright or browser-test setup.
- Inspected existing API tests in `internal/api/workflow_artifact_handlers_test.go`.
- Added `internal/api/dsl_handlers_test.go`.
- Covered:
  - `GET /api/v1/dsl/pages/demo` returns `200`.
  - the response has `id: "demo"` and `title: "Widget IR Demo"`.
  - `root.kind` is `component` and `root.type` is `AppShell`.
  - the payload can be marshaled as JSON.
  - `GET /api/v1/dsl/pages/unknown` returns `404`.
  - direct `PathValue("id")` routing works for the handler.
- Ran:
  - `gofmt -w internal/api/dsl_handlers_test.go`
  - `go test ./internal/api ./internal/dsl/widgetdsl -count=1`
  - `go test ./... -count=1`
- Updated `tasks.md`, ticket changelog, and related file metadata.

### Why

- Browser-level DSL preview testing is useful, but adding Playwright would introduce a new dependency and setup surface.
- The existing endpoint tests give immediate coverage for the backend contract consumed by the RTK Query hook and React renderer.
- This catches accidental route removal, response shape regressions, and unknown-id behavior.

### What worked

- The API tests passed.
- The full Go suite passed after adding the tests.
- The tests reuse the existing `assertStatus` helper from the `internal/api` test package.

### What didn't work

- Browser-level Playwright coverage could not be added without introducing new test tooling. `web/package.json` only has Vite, TypeScript, and Storybook scripts.
- I intentionally did not add Playwright dependencies in this step because the project has no existing browser-test convention.

### What I learned

- The API package already has a concise pattern for mux-level smoke tests using `httptest` and `RegisterHandlersWithOptions`.
- The DSL endpoint is independent enough that it can be tested with an empty migrated app database.

### What was tricky to build

- The endpoint itself does not need database state, but the public handler registration function expects a database handle. The test creates and migrates a temporary SQLite database to use the same route registration path as production.
- There was already an `assertStatus` helper in the package, so the new test avoids duplicating it and only adds a small handler setup helper.

### What warrants a second pair of eyes

- Decide whether browser-level Playwright should still be added later for nav-click and renderer smoke coverage.
- Check whether `internal/api/dsl_handlers_test.go` should assert deeper nested payload details, such as `DataTable` columns and `cell.kind` values, or whether that belongs in a future schema validator.

### What should be done in the future

- Add browser-level coverage once the project adopts Playwright, Vitest browser mode, or another frontend test runner.
- Add schema validation tests once a backend Widget IR validator exists.

### Code review instructions

- Review `internal/api/dsl_handlers_test.go` after `internal/api/dsl_handlers.go`.
- Validate with:
  - `go test ./internal/api -count=1`
  - `go test ./... -count=1`

### Technical details

- Test file: `internal/api/dsl_handlers_test.go`
- Covered route: `GET /api/v1/dsl/pages/{id}`
- Positive fixture id: `demo`
- Negative fixture id: `unknown`

---

## Step 11: Run Pi Playwright Browser Smoke for the DSL Preview

This step corrected my earlier wording about Playwright. The repository does not currently have a committed Playwright test suite, but the Pi harness does provide a Playwright browser tool. I used that tool to manually smoke-test the DSL preview page in a real browser.

The smoke verified that clicking the top-level `DSL` nav item loads the preview page, that the frontend calls the backend DSL endpoint, and that the static Widget IR renders through the React component library into the expected metadata, controls, and result rows.

### Prompt Context

**User prompt (verbatim):** "how do you mean playwright not installed, we have a tool at the very least?"

**Assistant interpretation:** I conflated repository-level Playwright dependencies with the Pi harness Playwright tool, and should clarify and use the available browser tool.

**Inferred user intent:** Ensure the DSL preview is validated in an actual browser rather than only by API tests.

**Commit (code):** N/A — this step only updated ticket docs/tasks and ran a tool-based smoke.

### What I did

- Inspected `web/vite.config.ts` and confirmed Vite proxies `/api` to `RAG_EVAL_BACKEND_PORT`, defaulting to `8772`.
- Tried to use port `8772`, but found an existing `rag-eval` process there returning the SPA HTML for `/api/v1/dsl/pages/demo` instead of the current JSON endpoint.
- Started a fresh backend on port `8872` with temporary local DB files:
  - `go run ./cmd/rag-eval serve --address 127.0.0.1:8872 --db .tmp/playwright-app.db --engine-db .tmp/playwright-engine.db --log-level warn`
- Verified the backend returned JSON for `/api/v1/dsl/pages/demo`.
- Started Vite with `RAG_EVAL_BACKEND_PORT=8872`; Vite selected `http://127.0.0.1:5175/` because `5173` and `5174` were already in use.
- Used the Pi Playwright tool to:
  - navigate to `http://127.0.0.1:5175/`
  - click the top-level `DSL` nav button
  - inspect the accessibility tree
  - inspect console messages
  - inspect network requests filtered to `/api/v1/dsl/pages`
  - evaluate DOM state for `data-rag-page="DslPreviewPage"` and table rows
  - capture a screenshot artifact: `dsl-preview-smoke-2026-06-04.png`
- Shut down the temporary backend and Vite processes that I started.
- Updated `tasks.md` to record that the Pi Playwright browser-tool smoke is complete while committed Playwright test-suite setup remains optional future work.

### Why

- API smoke tests prove the endpoint contract but not browser integration.
- The browser smoke proves the vertical slice across nav state, RTK Query, Vite proxy, backend endpoint, `DslPreviewPage`, and `WidgetRenderer`.
- It also surfaces real browser console warnings that unit/API tests do not catch.

### What worked

- The top-level `DSL` nav button became active after click.
- The page included `data-rag-page="DslPreviewPage"`.
- The DSL endpoint request was observed:
  - `GET http://127.0.0.1:5175/api/v1/dsl/pages/demo => 200 OK`
- The rendered page showed:
  - `Widget IR Demo`
  - `React WidgetRenderer`
  - `GET /api/v1/dsl/pages/demo`
  - `Controls`
  - `Results`
- The rendered table had 3 rows:
  - `Fast Growing Trees`
  - `Arborvitae Spacing`
  - `Broken Import Example`

### What didn't work

- Port `8772` was already in use by an existing `rag-eval` process, and that process returned SPA HTML for `/api/v1/dsl/pages/demo` instead of the current endpoint JSON.
- My first background-process shell commands wrote PID files from the wrong working directory because `&` bound to more of the command chain than intended.
- Vite could not bind to `5173` or `5174`, so it selected `5175`.
- Browser console showed two errors/warnings:
  - `Failed to load resource: the server responded with a status of 404 (Not Found) @ http://127.0.0.1:5175/favicon.ico:0`
  - `You provided a value prop to a form field without an onChange handler. This will render a read-only field. If the field should be mutable use defaultValue. Otherwise, set onChange.`

### What I learned

- The project-level test setup and harness-level Playwright tool are different concerns.
- The DSL preview does render correctly in a browser even without committed Playwright tests.
- The current static IR demo creates controlled input props without change handlers, which React reports as read-only.

### What was tricky to build

- The main tricky point was isolating the smoke from already-running local services. Reusing port `8772` would have produced a false signal because the old server returned HTML, not the new DSL JSON payload.
- The shell backgrounding issue was caused by command-precedence around `cd ... && ... & echo $!`; grouping the backgrounded command from the repo root fixed PID handling.

### What warrants a second pair of eyes

- The read-only controlled input warning should be reviewed. Options include using `defaultValue` in the static demo IR, adding no-op `onChange` behavior in the renderer for preview-only fields, or marking these controls read-only intentionally.
- The duplicate app shell in the DSL preview is intentional for the static demo root (`AppShell` inside the active app shell), but it should be reviewed before this becomes a real page recipe.
- Decide whether to add an actual committed Playwright setup later.

### What should be done in the future

- Fix or intentionally document the read-only controlled field warning.
- Add a favicon or suppress the favicon 404 if clean browser-console smoke is required.
- Add committed browser tests once the project chooses Playwright, Vitest browser mode, or another frontend test runner.

### Code review instructions

- Review the browser smoke together with `web/src/components/pages/DslPreviewPage/DslPreviewPage.tsx`, `web/src/widgets/WidgetRenderer.tsx`, and `internal/api/dsl_handlers.go`.
- Reproduce manually by starting backend on a free port, starting Vite with `RAG_EVAL_BACKEND_PORT=<port>`, clicking `DSL`, and checking for `data-rag-page="DslPreviewPage"` plus 3 result rows.

### Technical details

- Backend smoke port: `127.0.0.1:8872`
- Vite smoke URL: `http://127.0.0.1:5175/`
- Observed API request: `GET /api/v1/dsl/pages/demo => 200 OK`
- DOM check result:
  - `hasDslPageMarker: true`
  - `rowCount: 3`
- Screenshot artifact: `dsl-preview-smoke-2026-06-04.png`

---

## Code review instructions

- Start with `design-doc/03-review-and-revised-implementation-guide-for-the-rag-widget-dsl.md` for the corrected architecture.
- Then review `web/src/widgets/ir.ts`, `web/src/widgets/WidgetRenderer.tsx`, and `internal/api/dsl_handlers.go` for the implemented vertical slice.
- Check that all linked file paths exist in the repository.
- Verify that `tasks.md` accurately reflects completed phases.

## Technical details

- Ticket path: `2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/`
- Design doc: `design-doc/01-ui-dsl-and-kanban-dsl-design-and-implementation-guide.md`
- Widget DSL design doc: `design-doc/02-rag-widget-dsl-design-component-to-html-mapping.md`
- Review/revised implementation guide: `design-doc/03-review-and-revised-implementation-guide-for-the-rag-widget-dsl.md`
- Diary: `reference/01-investigation-diary.md`
- Related files tracked in docmgr frontmatter with absolute paths
