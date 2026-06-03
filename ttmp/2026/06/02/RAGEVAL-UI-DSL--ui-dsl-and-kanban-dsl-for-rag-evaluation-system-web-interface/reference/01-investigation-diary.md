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

## Code review instructions

- Start with `design-doc/01-ui-dsl-and-kanban-dsl-design-and-implementation-guide.md`
- Check that all linked file paths exist in the repository
- Verify that the API endpoint list in Part 1 matches `internal/api/handlers.go`
- Verify that the component list in Part 2 matches `web/src/components/`
- Verify that the Kanban DSL types in Part 3 match `goja-hosting-site/pkg/kanbanddsl/types.go`

## Technical details

- Ticket path: `2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/`
- Design doc: `design-doc/01-ui-dsl-and-kanban-dsl-design-and-implementation-guide.md`
- Diary: `reference/01-investigation-diary.md`
- Related files tracked in docmgr frontmatter with absolute paths
