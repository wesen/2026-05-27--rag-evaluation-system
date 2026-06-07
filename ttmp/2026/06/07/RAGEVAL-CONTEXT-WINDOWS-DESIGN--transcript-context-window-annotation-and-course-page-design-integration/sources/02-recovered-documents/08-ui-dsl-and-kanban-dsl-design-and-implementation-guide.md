---
Title: UI DSL and Kanban DSL Design and Implementation Guide
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
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/App.tsx
      Note: Main React application entry point showing view routing and navigation
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/services/api.ts
      Note: Redux Toolkit API service with all backend endpoint definitions
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/api/handlers.go
      Note: Go HTTP API handler registration and implementation
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/web/spa.go
      Note: SPA static file serving with fallback to index.html
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/cmd/rag-eval/cmds/serve/server.go
      Note: HTTP server wiring with database, API handlers, and SPA fallback
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/index.ts
      Note: Component export barrel showing the atomic design organization
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/molecules/DataTable/DataTable.tsx
      Note: Generic typed DataTable component with selection support
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/uidsl/module.go
      Note: Reference UI DSL module registration and tag constructor surface
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/uidsl/node.go
      Note: Reference UI DSL AST node types (Document, Element, Text, etc.)
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/uidsl/render.go
      Note: Reference UI DSL safe HTML renderer with attribute escaping
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-03--goja-hosting-site/pkg/kanbanddsl/types.go
      Note: Reference Kanban DSL type definitions (Board, ColumnSpec, etc.)
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-03--goja-hosting-site/pkg/kanbanddsl/builder.go
      Note: Reference Kanban DSL builder pattern with fluent JavaScript API
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-03--goja-hosting-site/pkg/kanbanddsl/render.go
      Note: Reference Kanban DSL server-side rendering using UI DSL nodes
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-03--goja-hosting-site/pkg/kanbanddsl/mount.go
      Note: Reference Kanban DSL Express app mounting with action dispatch
ExternalSources: []
Summary: Comprehensive design and implementation guide for adding UI DSL and Kanban DSL capabilities to the RAG Evaluation System, modeled after the goja-hosting-site reference implementation.
LastUpdated: 2026-06-02T21:00:00-04:00
WhatFor: Guide a new intern through understanding the RAG Evaluation System architecture and implementing UI DSL and Kanban DSL modules for webpage generation.
WhenToUse: Use when onboarding, when implementing new DSL modules, when creating server-rendered pages from the RAG system widgets, or when extending the goja-hosting-site patterns into this project.
---

# UI DSL and Kanban DSL Design and Implementation Guide

## Executive Summary

The RAG Evaluation System is a Go-based backend with a React/Vite frontend that provides a complete document ingestion, chunking, embedding, and retrieval evaluation pipeline. This guide teaches you how to add **UI DSL** and **Kanban DSL** modules to the system, following patterns proven in the `goja-hosting-site` reference project. These DSLs let you write JavaScript code that generates safe HTML, mount interactive kanban boards, and create server-rendered webpages using the same widgets and primitives that power the React frontend.

The architecture is layered:

1. **Go Backend** — SQLite database, service layer, HTTP API handlers, workflow engine
2. **React Frontend** — Vite-built SPA with atomic-design components, Redux Toolkit state, RTK Query API
3. **Goja JavaScript Runtime** — Embedded JavaScript execution via Go (from `go-go-goja`)
4. **UI DSL** — Safe HTML AST builder exposed to JavaScript (`ui.dsl` module)
5. **Kanban DSL** — Interactive board builder exposed to JavaScript (`kanban.dsl` module)

This document is written for an intern who needs to understand every subsystem, its file location, its API surface, and how the pieces connect.

---

## Part 1: The RAG Evaluation System — What It Is

### 1.1 System Purpose

The RAG Evaluation System is a tool for evaluating Retrieval-Augmented Generation pipelines. It lets you:

- **Ingest documents** from various sources (files, URLs) into a SQLite database
- **Chunk documents** using configurable strategies (fixed-size, semantic, etc.)
- **Compute embeddings** for chunks using providers like Ollama, OpenAI, or custom backends
- **Search** using BM25 (via Bleve), vector similarity, or hybrid retrieval
- **Run workflows** that orchestrate intake, processing, enrichment, and indexing
- **Evaluate results** through an interactive web interface with corpus exploration, search workbench, and pipeline visualization

### 1.2 High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          RAG Evaluation System                           │
├─────────────────────────────────────────────────────────────────────────┤
│  Frontend Layer (React + Vite + TypeScript)                             │
│  ├── web/src/App.tsx           — Main app shell, view router             │
│  ├── web/src/services/api.ts   — RTK Query API client                   │
│  ├── web/src/components/       — Atomic design component library        │
│  └── web/src/store/            — Redux Toolkit store                   │
├─────────────────────────────────────────────────────────────────────────┤
│  HTTP Transport Layer                                                     │
│  ├── GET  /api/v1/*            — JSON REST API                         │
│  ├── POST /api/v1/*            — Mutations and search                   │
│  └── GET  /                    — SPA fallback → index.html              │
├─────────────────────────────────────────────────────────────────────────┤
│  Go Backend Layer                                                         │
│  ├── cmd/rag-eval/             — CLI entry point with Cobra commands    │
│  ├── internal/api/             — HTTP handler registration              │
│  ├── internal/services/        — Business logic (document, chunk, etc.) │
│  ├── internal/workflow/        — Workflow engine (op queue, runners)    │
│  └── internal/db/              — SQLC-generated queries                 │
├─────────────────────────────────────────────────────────────────────────┤
│  Data Layer                                                               │
│  └── SQLite database           — Documents, chunks, embeddings, jobs  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Backend Components

#### 1.3.1 Database Layer (`internal/db/`)

The system uses SQLite with SQLC-generated type-safe queries. The schema includes:

- `sources` — Document source configurations
- `documents` — Ingested documents with metadata
- `chunks` — Document segments with token counts and offsets
- `chunking_strategies` — Named chunking configurations
- `embeddings` — Vector embeddings for chunks
- `workflows`, `workflow_ops`, `op_results` — Workflow execution tracking
- `processing_artifacts`, `chunk_enrichments` — LLM-generated enrichments

#### 1.3.2 Service Layer (`internal/services/`)

Each domain has a service struct:

| Service | File | Responsibility |
|---------|------|---------------|
| Source | `internal/services/source/service.go` | CRUD for ingestion sources |
| Document | `internal/services/document/service.go` | Document listing, content retrieval |
| Chunking | `internal/services/chunking/service.go` | Apply chunking strategies |
| Embedding | `internal/services/embedding/service.go` | Compute and cache embeddings |
| Search | `internal/services/search/service.go` | BM25, vector, hybrid search |
| Corpus | `internal/services/corpus/service.go` | Aggregated corpus exploration |
| Workflow | `internal/workflow/engine.go` | Op scheduling and execution |

#### 1.3.3 API Handlers (`internal/api/handlers.go`)

All routes use Go 1.22+ path value syntax (`mux.HandleFunc("GET /api/v1/sources", ...)`). Key endpoint groups:

- **Sources**: `GET /api/v1/sources`, `POST /api/v1/sources`, `POST /api/v1/sources/{id}/scan`
- **Documents**: `GET /api/v1/documents`, `GET /api/v1/documents/{id}`, `GET /api/v1/documents/{id}/chunks`
- **Chunking**: `POST /api/v1/documents/{id}/chunk`, `GET /api/v1/chunking-strategies`
- **Embeddings**: `POST /api/v1/embeddings/compute`, `POST /api/v1/embeddings/coverage`, `POST /api/v1/embeddings/similarity`
- **Search**: `POST /api/v1/search/query` (BM25), `POST /api/v1/search/vector`, `POST /api/v1/search/hybrid`
- **Corpus**: `GET /api/v1/corpus/sources`, `GET /api/v1/corpus/documents`, `GET /api/v1/corpus/documents/{id}`
- **Workflows**: `GET /api/v1/workflows`, `POST /api/v1/workflows/intake`, `POST /api/v1/workflows/{id}/cancel`
- **Artifacts**: `GET /api/v1/artifacts/document-processing/identities`, `GET /api/v1/artifacts/chunk-enrichment/coverage`

#### 1.3.4 HTTP Server (`cmd/rag-eval/cmds/serve/server.go`)

The server wiring is concise and follows a standard pattern:

```go
// 1. Open SQLite database
database, err := db.OpenDB(dbPath)

// 2. Run migrations
if err := db.Migrate(database); err != nil { ... }

// 3. Create router
mux := http.NewServeMux()

// 4. Register API handlers
api.RegisterHandlersWithOptions(mux, database, api.Options{EngineDB: engineDB})

// 5. Register SPA fallback for all unmatched routes
mux.Handle("/", web.SPAHandler())

// 6. Start server
server := &http.Server{Addr: address, Handler: mux, ...}
```

The critical insight: **API routes are registered before the SPA fallback**, so `/api/v1/*` always hits the Go handlers, while everything else serves the React app.

---

## Part 2: The Frontend — React Component Architecture

### 2.1 Tech Stack

| Technology | Purpose | Version |
|-----------|---------|---------|
| React | UI framework | 19.2.6 |
| TypeScript | Type safety | ~6.0.2 |
| Vite | Build tool | ^8.0.12 |
| Redux Toolkit | State management | ^2.12.0 |
| RTK Query | API caching and fetching | ^2.12.0 |
| React Router | Client-side routing | ^7.15.1 |
| Recharts | Charts and visualizations | ^3.8.1 |
| Tailwind CSS | Utility styling | ^4.3.0 |
| Storybook | Component development | ^10.4.1 |

### 2.2 Component Organization (Atomic Design)

The `web/src/components/` directory follows atomic design principles:

```text
components/
├── atoms/           — Smallest building blocks (Button, TextInput, CheckboxRow)
├── foundation/      — Text primitives (Caption, CodeText, StatusText, Divider)
├── layout/          — Structural components (AppShell, DashboardGrid, Stack, Panel)
├── molecules/       — Composite widgets (DataTable, AppNav, CoveragePanel)
├── organisms/       — Complex sections (SearchControlsPanel, RetrievalResultsPanel)
├── pages/           — Full page views (EvaluationPage, PipelinePage, SearchWorkbenchPage)
├── corpus/          — Corpus-specific components (DocumentBrowser, DocumentInspector)
├── embeddings/      — Embedding visualization (EmbeddingsView)
├── evaluation/      — Evaluation dashboard (EvaluationView)
├── search/          — Search interfaces (SearchView)
├── pipeline/        — Pipeline visualization (PipelineOverview, PipelineView)
└── workflows/       — Workflow management (WorkflowsView, workflowFormat)
```

### 2.3 Key Component Primitives

#### 2.3.1 Atoms — `web/src/components/atoms/`

These are the lowest-level interactive elements. Each exports:
- `Component.tsx` — Implementation
- `Component.module.css` — Scoped styles with CSS custom properties
- `Component.stories.tsx` — Storybook stories
- `index.ts` — Barrel export

Available atoms:
- **Button** — Primary/secondary action button with icon support
- **CheckboxRow** — Labeled checkbox with custom styling
- **ErrorCallout** — Error message display with icon
- **IconButton** — Button with only an icon
- **SelectInput** — Styled `<select>` with options
- **TextInput** — Text field with validation states

#### 2.3.2 Foundation — `web/src/components/foundation/`

Typography and accessory primitives:
- **Caption** — Small secondary text
- **CodeText** — Monospace inline code
- **Divider** — Horizontal separator
- **StatusText** — Colored status indicator text
- **Text** — Body text with size variants
- **VisuallyHidden** — Accessibility helper for screen readers

#### 2.3.3 Layout — `web/src/components/layout/`

Structural components that compose the page skeleton:
- **AppShell** — Root layout with header, optional sidebar, main content area
- **DashboardGrid** — CSS Grid wrapper for dashboard panels
- **FormRow** — Horizontal form field layout with label
- **Inline** — Horizontal flex container with gap
- **Panel** — Bordered card-like container
- **ScrollRegion** — Scrollable container with custom styling
- **Stack** — Vertical flex container with gap
- **TabList** — Horizontal tab navigation

#### 2.3.4 Molecules — `web/src/components/molecules/`

Composite components combining atoms and layout:
- **AppNav** — Top navigation bar with brand and links
- **DataTable** — Generic typed table with sortable columns, selection, empty states
- **CoveragePanel** — Coverage statistics display
- **MetadataGrid** — Key-value metadata display
- **QueryPresetList** — Saved search query browser

The **DataTable** is particularly important because it demonstrates the component contract pattern used throughout:

```typescript
// From web/src/components/molecules/DataTable/DataTable.tsx
export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'start' | 'end' | 'center';
  maxWidth?: number | string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  selectedKey?: string | null;
  onRowSelect?: (row: T) => void;
  emptyMessage?: ReactNode;
}
```

### 2.4 State Management

The frontend uses Redux Toolkit with RTK Query for server state:

```typescript
// From web/src/services/api.ts
export const ragApi = createApi({
  reducerPath: 'ragApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Sources', 'Documents', 'Chunks', 'Strategies', 'Embeddings', 'Corpus', 'Workflows', 'Artifacts'],
  endpoints: (builder) => ({
    listSources: builder.query<Source[], void>({
      query: () => 'sources',
      providesTags: ['Sources'],
    }),
    // ... 30+ endpoints
  }),
});
```

React hooks are auto-generated from the endpoint definitions:

```typescript
export const {
  useListSourcesQuery,
  useCreateSourceMutation,
  useSearchBM25Mutation,
  useSearchHybridMutation,
  useListWorkflowsQuery,
  // ...
} = ragApi;
```

### 2.5 View Routing

`App.tsx` implements a simple state-based view router (not URL-based, since it's a single-page app served from `/`):

```typescript
const views = [
  { id: 'search', label: 'Search' },
  { id: 'corpus', label: 'Corpus' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'embeddings', label: 'Embeddings' },
  { id: 'evaluation', label: 'Evaluation' },
];
```

The `AppShell` wraps the active view, and `AppNav` provides top-level navigation.

---

## Part 3: The Goja JavaScript Runtime

### 3.1 What is Goja?

Goja is a pure-Go JavaScript interpreter (`github.com/dop251/goja`). The project `go-go-goja` wraps Goja with:

- **Module loading** via `require()` (Node.js-compatible)
- **Native module registration** — Go code exposes APIs to JavaScript
- **Express-style HTTP** — `express.app()` with routing
- **SQLite database access** — `require("database")` for SQL
- **UI DSL** — `require("ui.dsl")` for HTML generation
- **File system** — `require("fs")` for reading files

### 3.2 How Native Modules Work

A native module is a Go package that exposes functions to JavaScript. The pattern is:

```go
// In go-go-goja, a module implements this interface
type NativeModule interface {
    Load(vm *goja.Runtime, moduleObj *goja.Object)
}
```

The `ui.dsl` module is registered as:

```go
// From go-go-goja/modules/uidsl/module.go
func (r *Registrar) RegisterRuntimeModule(ctx *engine.RuntimeModuleContext, reg *require.Registry) error {
    reg.RegisterNativeModule("ui.dsl", Loader)
    reg.RegisterNativeModule("ui", Loader)
    return nil
}
```

When JavaScript calls `require("ui.dsl")`, the Go `Loader` function creates an `exports` object with tag constructors.

### 3.3 The UI DSL Module (`ui.dsl`)

The UI DSL provides safe HTML generation from JavaScript. It creates an AST (Abstract Syntax Tree) of nodes that Go renders to HTML with proper escaping.

#### 3.3.1 Node Types

From `go-go-goja/modules/uidsl/node.go`:

```go
type Node interface{ isNode() }

type Document struct {
    Title string
    Head  []Node
    Body  []Node
}

type Element struct {
    Tag      string
    Attrs    []Attr
    Children []Node
}

type Text struct{ Value string }
type RawHTML struct{ Value string }
type Fragment struct{ Children []Node }

type Attr struct {
    Key   string
    Value string
    Bool  bool  // True for boolean attributes like "disabled"
}
```

#### 3.3.2 Tag Constructors

The module exports a function for every HTML tag:

```go
var tags = []string{
    "html", "head", "body", "title", "meta", "link", "script", "style",
    "main", "img", "br", "hr", "time", "div", "span", "h1", "h2", "h3",
    "h4", "p", "a", "form", "input", "button", "select", "option",
    "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td",
    "section", "article", "header", "footer", "nav", "label", "textarea",
    "strong", "em", "small", "pre", "code",
}
```

Each tag is a variadic function:
- First argument (optional): attribute map (`{class: "foo", id: "bar"}`)
- Remaining arguments: children (strings become Text nodes, nested elements are preserved)

Example JavaScript usage:

```javascript
const ui = require("ui.dsl");

const card = ui.article({class: "kanban-card", "data-card-id": "42"},
  ui.h3("Research campsites"),
  ui.p("Look into options near Sahale and Colonial Creek."),
  ui.div({class: "card-meta"},
    ui.span({class: "tag"}, "Planning"),
    ui.time({datetime: "May 12"}, "May 12")
  )
);
```

This generates safe HTML with all text escaped.

#### 3.3.3 Special Helpers

- `ui.fragment(...children)` — Wraps children without an outer element
- `ui.text(string)` — Explicit text node
- `ui.raw(string)` — Unescaped HTML (dangerous, use sparingly)
- `ui.render(node)` — Renders a node tree to an HTML string
- `ui.page({title: "..."}, ...children)` — Creates a full HTML document
- `ui.table(id)` — Rich table builder with filtering, sorting, pagination
- `ui.codeBlock(language, source)` — Syntax highlighted code block
- `ui.badge(value, options)` — Status badge element
- `ui.tabs(id, tabs, options)` — Tab panel component

#### 3.3.4 Safe Rendering

From `go-go-goja/modules/uidsl/render.go`:

```go
func RenderAny(vm *goja.Runtime, v goja.Value) (string, error) {
    n, err := Normalize(vm, v)
    if err != nil { return "", err }
    var b bytes.Buffer
    if err := renderNode(&b, n); err != nil { return "", err }
    return b.String(), nil
}
```

The renderer:
1. Normalizes values (strings → Text, arrays → Fragment, nil → empty Fragment)
2. Recursively renders nodes
3. Escapes all text content with `html.EscapeString`
4. Escapes all attribute values with `html.EscapeString`
5. Sorts attributes alphabetically for deterministic output
6. Handles boolean attributes (omits `="..."` for boolean true)

This makes `ui.dsl` injection-safe: even if user data contains `<script>` tags, they are escaped to `&lt;script&gt;`.

### 3.4 The Kanban DSL Module (`kanban.dsl`)

The Kanban DSL builds interactive task boards. It is a higher-level DSL that internally uses `ui.dsl` for rendering.

#### 3.4.1 Core Types

From `goja-hosting-site/pkg/kanbanddsl/types.go`:

```go
type ColumnSpec struct {
    ID          string
    Title       string
    Description string
    Limit       int       // WIP limit, 0 = unlimited
    Terminal    bool      // Cards moved here are considered "done"
    ClassName   string
    Attrs       map[string]any
}

type DataSpec struct {
    Cards      goja.Callable  // fn(ctx) => array of card objects
    ID         goja.Callable  // fn(card) => string id
    Column     goja.Callable  // fn(card) => string columnId
    Position   goja.Callable  // fn(card) => number (optional)
    SearchText goja.Callable  // fn(card) => string (optional)
}

type FeatureSpec struct {
    Search     SearchSpec   // Client-side or server-side search
    DragDrop   bool         // Enable drag/drop (requires cardMoved action)
    CreateCard bool         // Enable "add card" UI (requires cardCreated action)
    CardMenu   bool         // Enable card actions menu (requires cardMenuAction)
    ReadOnly   bool         // Disable all mutations
}

type RenderSpec struct {
    Card         goja.Callable  // fn(card, ctx) => ui node
    ColumnHeader goja.Callable  // fn(column, ctx) => ui node (optional)
    Toolbar      goja.Callable  // fn(ctx) => ui node (optional)
    EmptyColumn  goja.Callable  // fn(column) => ui node (optional)
    BoardShell   goja.Callable  // fn(boardNode, ctx) => ui node (optional)
}

type ActionSpec struct {
    CardMoved      goja.Callable  // fn(event) => {ok, refresh, card, toast}
    CardCreated    goja.Callable  // fn(event) => {ok, refresh, card}
    CardUpdated    goja.Callable
    CardDeleted    goja.Callable
    CardClicked    goja.Callable
    CardMenuAction goja.Callable
    Custom         map[string]goja.Callable
}
```

#### 3.4.2 Builder Pattern (JavaScript API)

From `goja-hosting-site/pkg/kanbanddsl/builder.go`:

The Kanban DSL uses a fluent builder pattern exposed to JavaScript:

```javascript
const kanban = require("kanban.dsl");

const board = kanban.board("trail-notes")
  .title("Trail Notes: Cascade Loop")
  .theme("field-notes")
  .className("board")
  .columns(cols => cols
    .column("todo").title("To Do").done()
    .column("progress").title("In Progress").done()
    .column("done").title("Done").terminal(true).done()
    .column("someday").title("Someday").done()
  )
  .data(data => data
    .cards(ctx => listCards(ctx.session, ctx.query || {}))
    .id(card => String(card.id))
    .column(card => card.status)
    .position(card => Number(card.position || 0))
    .searchText(card => searchText(card))
  )
  .features(features => features
    .search({ mode: "client" })
    .dragDrop()
  )
  .render(render => render
    .toolbar(ctx => ui.form(...))
    .card((card, ctx) => ui.article(...))
    .emptyColumn(column => ui.div("No visible cards"))
  )
  .actions(actions => actions
    .cardMoved(event => { ... move logic ... })
  )
  .build();
```

The `.build()` call:
1. Validates the configuration (columns present, required callbacks set)
2. Registers the board in the runtime's board map
3. Returns a board object with `.render(ctx)`, `.mount(app, prefix)`, and `.dispatch(action, event)` methods

#### 3.4.3 Rendering

From `goja-hosting-site/pkg/kanbanddsl/render.go`:

Rendering produces a `uidsl.Node` tree:

1. **Load cards** by calling `data.cards(ctx)`
2. **Group by column** using `data.column(card)`
3. **Sort within columns** by `data.position(card)` (or original index if absent)
4. **Build column nodes**: header + card list + drop sentinel
5. **Build board node**: toolbar + columns grid
6. **Optional board shell**: wraps the entire board

Each card renders as an `<article>` with:
- `data-kb-card-id` — Card identifier
- `data-kb-card-column` — Current column
- `data-kb-card-index` — Position in column
- `data-kb-search-text` — Lowercase search text
- `draggable="true"` — If dragDrop enabled
- `role="listitem"`, `tabindex="0"` — Accessibility

#### 3.4.4 Mounting and Action Dispatch

From `goja-hosting-site/pkg/kanbanddsl/mount.go`:

When `.mount(app, prefix)` is called, the board:

1. Registers `GET <prefix>/<boardId>/fragment` — Returns rendered HTML fragment
2. Registers `POST <prefix>/<boardId>/action/:action` — Dispatches actions and returns JSON
3. Registers `GET <prefix>/client.js` — Serves the Kanban client runtime (only once per prefix)

Action dispatch flow:

```
POST /_kanban/trail-notes/action/cardMoved
│
├─→ Normalize event (adds boardId, action, from/to objects)
├─→ Call configured action handler (e.g., actions.cardMoved)
├─→ Handler returns {ok: true, refresh: true, card: {...}, toast: "Moved"}
├─→ If refresh=true, re-render board HTML
├─→ Return JSON: {ok: true, html: "<section...>", card: {...}}
└─→ Client JS swaps the board DOM with the new HTML
```

This is **server-rendered with progressive enhancement**: the board works as static HTML, but JavaScript makes it interactive.

---

## Part 4: Connecting RAG System to DSL

### 4.1 Why Add DSLs to the RAG System?

The existing RAG system has a rich React frontend, but there are scenarios where a server-rendered approach is preferable:

- **Administrative dashboards** — Simple pages that don't need React's complexity
- **Workflow monitoring** — Kanban boards for tracking pipeline stage progression
- **Embedded reports** — HTML fragments that can be included in external systems
- **Goja-hosted extensions** — allowing users to write JavaScript plugins that generate custom views

### 4.2 Integration Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     RAG Evaluation System                        │
│                                                                  │
│  +-----------------------------------------------------------+  │
│  │  Goja JavaScript Runtime (go-go-goja)                      │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐     │  │
│  │  │  ui.dsl     │  │  kanban.dsl  │  │  database    │     │  │
│  │  │  (HTML AST) │  │  (Board AST) │  │  (SQLite)    │     │  │
│  │  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘     │  │
│  │         │                 │                   │           │  │
│  │  ┌──────▼─────────────────▼───────────────────▼──────┐   │  │
│  │  │         JavaScript Plugin Scripts                  │   │  │
│  │  │  const board = kanban.board("docs")                 │   │  │
│  │  │    .data(d => d.cards(ctx => db.query(...)))        │   │  │
│  │  │    .render(r => r.card((c) => ui.article(...)))     │   │  │
│  │  └──────────────────────┬────────────────────────────┘   │  │
│  │                         │                                  │  │
│  └─────────────────────────┼──────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────▼──────────────────────────────────┐  │
│  │         Go HTTP Server (existing)                            │  │
│  │  mux.Handle("/api/v1/*", apiHandlers)                       │  │
│  │  mux.Handle("/_dsl/*", dslHandler)  ← NEW                   │  │
│  │  mux.Handle("/", spaHandler)                                │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         Existing React SPA (/ via web/dist)                  │  │
│  │  Search │ Corpus │ Workflows │ Pipeline │ Embeddings        │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Implementation Plan

#### Phase 1: Create `internal/dsl/` Package

Create a new Go package that wraps the go-go-goja modules with RAG-specific services:

```
internal/dsl/
├── module.go          — DSL module registration
├── uidsl.go           — UI DSL wrapper with RAG widget helpers
├── kanbanddsl.go      — Kanban DSL wrapper with RAG data bindings
├── rag_context.go     — Injects RAG services into JS context
└── handler.go         — HTTP handler for DSL-rendered pages
```

#### Phase 2: Register Modules in Server

Modify `cmd/rag-eval/cmds/serve/server.go`:

```go
import "github.com/go-go-golems/rag-evaluation-system/internal/dsl"

// In runHTTPServer:
if err := dsl.Register(mux, database); err != nil {
    zerolog_log.Fatal().Err(err).Msg("failed to register DSL handlers")
}
```

#### Phase 3: Create Example Scripts

Add example JavaScript files in `plugins/` or `examples/dsl/`:

```
examples/dsl/
├── corpus-kanban.js       — Kanban board for document processing stages
├── search-dashboard.js    — Search results as a rich table
└── workflow-board.js      — Workflow ops as a kanban board
```

---

## Part 5: UI DSL Implementation Details

### 5.1 Module Registration

The UI DSL module is already implemented in `go-go-goja`. To use it in the RAG system, register it with the runtime:

```go
// internal/dsl/module.go
package dsl

import (
    "github.com/dop251/goja"
    "github.com/dop251/goja_nodejs/require"
    "github.com/go-go-golems/go-go-goja/modules/uidsl"
)

func RegisterModules(reg *require.Registry) {
    reg.RegisterNativeModule("ui.dsl", uidsl.Loader)
    reg.RegisterNativeModule("ui", uidsl.Loader)
}
```

### 5.2 Creating RAG Widget Helpers

You can extend the UI DSL with RAG-specific components by creating a wrapper module:

```javascript
// examples/dsl/rag-widgets.js
const ui = require("ui.dsl");

function documentCard(doc) {
  return ui.article({class: "rag-document-card", "data-doc-id": doc.id},
    ui.header({class: "doc-header"},
      ui.h3(doc.title),
      ui.span({class: "doc-source"}, doc.source_name)
    ),
    ui.div({class: "doc-meta"},
      ui.span({class: "doc-status doc-status--" + doc.status}, doc.status),
      ui.span({class: "doc-count"}, doc.word_count + " words"),
      ui.span({class: "doc-chunks"}, doc.chunk_count + " chunks")
    )
  );
}

function chunkCard(chunk) {
  return ui.article({class: "rag-chunk-card"},
    ui.div({class: "chunk-header"},
      ui.span("Chunk " + chunk.chunk_index),
      ui.span({class: "chunk-tokens"}, chunk.token_count + " tokens")
    ),
    ui.pre({class: "chunk-text"}, chunk.text_preview || chunk.text)
  );
}

module.exports = {
  documentCard,
  chunkCard,
  searchResultCard(result) { ... },
  coverageMeter(coverage) { ... },
};
```

### 5.3 CSS Integration

The UI DSL generates HTML but not CSS. You have two options:

**Option A: Inline Styles**
```javascript
ui.div({
  class: "rag-panel",
  style: {background: "#f7f7f4", border: "2px solid #111"}
}, ...)
```

**Option B: External Stylesheet**
```javascript
ui.page({title: "RAG Dashboard"},
  ui.link({rel: "stylesheet", href: "/rag-styles.css"}),
  ui.main(...)
)
```

The RAG system's existing CSS tokens in `web/src/styles/tokens.css` can be reused:

```css
/* Extracted from web/src/styles/tokens.css */
:root {
  --color-ink: #0d0d0d;
  --color-paper: #fbfbfa;
  --color-soft: #f2f2ef;
  --color-muted: #666;
  --color-line: #111;
  --font-mono: "Courier New", "IBM Plex Mono", ui-monospace, monospace;
}
```

### 5.4 Table Component

The UI DSL includes a rich table builder:

```javascript
const ui = require("ui.dsl");

const table = ui.table("corpus-sources")
  .fromRows([
    {name: "Wikipedia", docs: 1500, chunks: 45000, embedded: 44800},
    {name: "ArXiv", docs: 800, chunks: 24000, embedded: 24000},
  ])
  .features(f => f
    .pagination()
    .sorting()
    .filtering()
  )
  .render({});
```

This generates a full HTML table with client-side sorting, pagination, and filtering.

---

## Part 6: Kanban DSL Implementation Details

### 6.1 Board Configuration for RAG Workflows

A kanban board for tracking document processing:

```javascript
const kanban = require("kanban.dsl");
const db = require("database");

function listDocumentCards(ctx) {
  const status = ctx.query?.status || "";
  const search = ctx.query?.search || "";
  const where = ["1=1"];
  const args = [];
  
  if (status) { where.push("status = ?"); args.push(status); }
  if (search) { 
    where.push("(lower(title) LIKE ? OR lower(author) LIKE ?)"); 
    args.push("%" + search + "%", "%" + search + "%"); 
  }
  
  return db.query(
    "SELECT * FROM documents WHERE " + where.join(" AND ") + " ORDER BY updated_at DESC",
    ...args
  );
}

const board = kanban.board("document-pipeline")
  .title("Document Processing Pipeline")
  .theme("rag-eval")
  .columns(cols => cols
    .column("intake").title("In Take").done()
    .column("chunked").title("Chunked").done()
    .column("embedded").title("Embedded").done()
    .column("indexed").title("Indexed").terminal(true).done()
    .column("failed").title("Failed").done()
  )
  .data(data => data
    .cards(ctx => listDocumentCards(ctx))
    .id(doc => String(doc.id))
    .column(doc => doc.status)
    .position(doc => new Date(doc.updated_at).getTime())
  )
  .features(features => features
    .search({mode: "server"})
    .dragDrop()
  )
  .render(render => render
    .card((doc, ctx) => ui.article({class: "doc-card"},
      ui.h3(doc.title),
      ui.p(doc.author),
      ui.div({class: "doc-stats"},
        ui.span(doc.word_count + " words"),
        ui.span(doc.chunk_count + " chunks")
      )
    ))
  )
  .actions(actions => actions
    .cardMoved(event => {
      const doc = db.query("SELECT * FROM documents WHERE id = ?", event.cardId)[0];
      if (!doc) return {ok: false, error: "Document not found"};
      
      db.exec(
        "UPDATE documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        event.to.columnId, event.cardId
      );
      
      return {ok: true, refresh: true, toast: "Moved to " + event.to.columnId};
    })
  )
  .build();
```

### 6.2 Mounting the Board

Mount the board onto an Express app:

```javascript
const express = require("express");
const app = express.app();

// Serve static assets
app.static("/assets", "examples/dsl/assets");

// Mount board at /_kanban
board.mount(app, "/_kanban");

// Full page with embedded board
app.get("/", (req, res) => {
  res.html(ui.page({title: "Document Pipeline"},
    ui.link({rel: "stylesheet", href: "/assets/rag-kanban.css"}),
    ui.main({class: "page"},
      ui.header(ui.h1("Document Processing Pipeline")),
      board.render({query: req.query, session: req.session})
    )
  ));
});
```

### 6.3 Client-Side Behavior

The Kanban DSL includes a small client runtime (`kanban.clientScript()`) that adds:

- **Live search** — Filters cards without page reload (for `mode: "client"`)
- **Drag and drop** — Moves cards between columns with mouse/touch
- **Form interception** — POSTs actions via fetch, receives HTML fragment, swaps DOM
- **Accessibility** — Keyboard navigation, ARIA labels, focus management

The client runtime is served automatically when you call `board.mount()`. It reads `data-kb-*` attributes and wires behavior.

### 6.4 Server-Side Search vs Client-Side Search

**Client search** (`mode: "client"`):
- All cards rendered in initial HTML
- JavaScript filters visible cards
- Fast for small boards (< 500 cards)
- No additional server requests

**Server search** (`mode: "server"`):
- Each keystroke fetches `/fragment?search=...`
- Server re-queries database and re-renders
- Scales to large datasets
- Requires network latency tolerance

Choose based on expected data size. For RAG document pipelines, server search is usually appropriate.

---

## Part 7: Example DSL Scripts for RAG System

### 7.1 Search Results Table

```javascript
// examples/dsl/search-results.js
const ui = require("ui.dsl");
const db = require("database");

function renderSearchResults(query) {
  const results = db.query(`
    SELECT d.id, d.title, d.author, c.text, c.chunk_index
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    WHERE c.text LIKE ?
    ORDER BY c.chunk_index
    LIMIT 50
  `, "%" + query + "%");
  
  return ui.table("search-results")
    .fromRows(results.map(r => ({
      document: r.title,
      author: r.author,
      chunk: "#" + r.chunk_index,
      preview: (r.text || "").substring(0, 120) + "..."
    })))
    .features(f => f.pagination().sorting())
    .render({});
}

module.exports = {renderSearchResults};
```

### 7.2 Corpus Overview Dashboard

```javascript
// examples/dsl/corpus-dashboard.js
const ui = require("ui.dsl");
const db = require("database");

function corpusOverview() {
  const sources = db.query(`
    SELECT s.id, s.name, s.type,
           COUNT(DISTINCT d.id) as doc_count,
           COUNT(DISTINCT c.id) as chunk_count,
           COUNT(DISTINCT e.id) as embedded_count
    FROM sources s
    LEFT JOIN documents d ON d.source_id = s.id
    LEFT JOIN chunks c ON c.document_id = d.id
    LEFT JOIN embeddings e ON e.chunk_id = c.id
    GROUP BY s.id
  `);
  
  return ui.page({title: "Corpus Overview"},
    ui.main({class: "page"},
      ui.h1("Corpus Overview"),
      ui.table("sources")
        .fromRows(sources)
        .features(f => f.sorting())
        .render({}),
      
      ui.h2("Coverage by Source"),
      ...sources.map(s => ui.div({class: "coverage-bar"},
        ui.label(s.name),
        ui.div({class: "bar"},
          ui.div({
            class: "bar-fill",
            style: {width: (s.embedded_count / Math.max(s.chunk_count, 1) * 100) + "%"}
          })
        ),
        ui.span(s.embedded_count + "/" + s.chunk_count)
      ))
    )
  );
}

module.exports = {corpusOverview};
```

### 7.3 Workflow Kanban Board

```javascript
// examples/dsl/workflow-board.js
const kanban = require("kanban.dsl");
const ui = require("ui.dsl");
const db = require("database");

const columns = [
  ["pending", "Pending"],
  ["ready", "Ready"],
  ["running", "Running"],
  ["succeeded", "Succeeded"],
  ["failed", "Failed"],
];

function getWorkflowOps(ctx) {
  const workflowId = ctx.query?.workflow_id || "";
  if (!workflowId) return [];
  
  return db.query(`
    SELECT op_id, kind, status, queue, error_message, created_at
    FROM workflow_ops
    WHERE workflow_id = ?
    ORDER BY created_at DESC
  `, workflowId);
}

const board = kanban.board("workflow-ops")
  .title("Workflow Operations")
  .columns(cols => {
    for (const [id, title] of columns) {
      cols.column(id).title(title).done();
    }
    return cols;
  })
  .data(data => data
    .cards(ctx => getWorkflowOps(ctx))
    .id(op => String(op.op_id))
    .column(op => op.status)
  )
  .features(f => f.search({mode: "client"}).dragDrop())
  .render(render => render
    .card((op) => ui.article({class: "op-card op-card--" + op.status},
      ui.header(
        ui.code(op.kind),
        ui.span({class: "op-queue"}, op.queue)
      ),
      op.error_message ? ui.p({class: "op-error"}, op.error_message) : null
    ))
  )
  .build();

module.exports = {board};
```

---

## Part 8: File Reference Summary

### 8.1 RAG System Core Files

| File | Purpose |
|------|---------|
| `cmd/rag-eval/main.go` | CLI entry point with Cobra command tree |
| `cmd/rag-eval/cmds/serve/server.go` | HTTP server construction and lifecycle |
| `internal/api/handlers.go` | All HTTP handler functions and route registration |
| `internal/web/spa.go` | SPA static file serving with index.html fallback |
| `internal/db/` | SQLC-generated queries and migrations |
| `internal/services/*/service.go` | Business logic services (document, chunk, search, etc.) |
| `internal/workflow/engine.go` | Workflow operation scheduling and execution |

### 8.2 Frontend Core Files

| File | Purpose |
|------|---------|
| `web/src/App.tsx` | React app entry with view router |
| `web/src/services/api.ts` | RTK Query API definitions with all endpoints |
| `web/src/store/index.ts` | Redux store configuration |
| `web/src/components/index.ts` | Component barrel exports |
| `web/src/components/atoms/` | Button, Input, Checkbox primitives |
| `web/src/components/layout/AppShell.tsx` | Root layout component |
| `web/src/components/molecules/DataTable.tsx` | Generic typed table |
| `web/src/components/organisms/` | Complex panels (SearchControls, RetrievalResults) |
| `web/src/components/pages/` | Full page views |
| `web/vite.config.ts` | Vite build configuration |
| `web/package.json` | Frontend dependencies |

### 8.3 Reference DSL Files

| File | Purpose |
|------|---------|
| `go-go-goja/modules/uidsl/module.go` | UI DSL native module registration |
| `go-go-goja/modules/uidsl/node.go` | UI DSL AST node types |
| `go-go-goja/modules/uidsl/render.go` | Safe HTML renderer |
| `2026-05-03--goja-hosting-site/pkg/kanbanddsl/types.go` | Kanban DSL type definitions |
| `2026-05-03--goja-hosting-site/pkg/kanbanddsl/builder.go` | Kanban DSL builder pattern |
| `2026-05-03--goja-hosting-site/pkg/kanbanddsl/render.go` | Kanban board rendering |
| `2026-05-03--goja-hosting-site/pkg/kanbanddsl/mount.go` | Express mounting and action dispatch |
| `2026-05-03--goja-hosting-site/pkg/kanbanddsl/dispatch.go` | Action normalization and routing |
| `2026-05-03--goja-hosting-site/examples/kanban/scripts/app.js` | Complete Kanban example application |

---

## Part 9: Decision Records

### DR-1: Use go-go-goja uidsl rather than custom HTML builder

**Context**: We need safe HTML generation from JavaScript plugins. Options: (a) write a custom builder, (b) reuse go-go-goja's proven uidsl module.

**Decision**: Reuse `go-go-goja/modules/uidsl`.

**Rationale**: Already tested, handles escaping correctly, has rich helpers (table, tabs, badge), and integrates with the existing go-go-goja module system.

**Consequences**: Positive — less code, proven safety. Negative — must accept uidsl's design choices (sorted attributes, specific helper set).

**Status**: Accepted.

### DR-2: Server-rendered with progressive enhancement vs full SPA

**Context**: New views could be React components or server-rendered HTML.

**Decision**: Server-rendered HTML with optional client JS enhancement.

**Rationale**: The existing React SPA handles complex interactive views. DSL-generated pages are for simpler administrative and reporting views where React's bundle size and complexity are unnecessary. Server rendering works without JavaScript.

**Consequences**: Positive — accessible, fast initial load, works in constrained environments. Negative — two rendering paradigms in one project requires clear documentation.

**Status**: Accepted.

### DR-3: Kanban DSL mounts via Express app vs direct HTTP handlers

**Context**: Kanban boards need routes for fragments and actions.

**Decision**: Use go-go-goja's Express-style module for routing.

**Rationale**: Consistent with goja-hosting-site pattern. JavaScript authors use familiar `app.get()`/`app.post()` syntax. The RAG server mux can delegate a prefix to the Goja Express app.

**Consequences**: Positive — JavaScript-native routing, no Go handler boilerplate. Negative — Express module adds a translation layer.

**Status**: Accepted.

---

## Part 10: Testing Strategy

### 10.1 Go Unit Tests

```go
// internal/dsl/uidsl_test.go
func TestRenderDocumentCard(t *testing.T) {
    vm := goja.New()
    // Load ui.dsl module
    // Create documentCard with sample data
    // Render and assert HTML contains expected tags
}

func TestKanbanBoardValidation(t *testing.T) {
    // Test that board without columns fails validation
    // Test that board without data.cards fails validation
    // Test that dragDrop without cardMoved fails validation
}
```

### 10.2 Playwright Integration Tests

```javascript
// playwright/tests/dsl-kanban.spec.js
test('kanban board renders and moves cards', async ({page}) => {
  await page.goto('/_kanban/document-pipeline');
  await expect(page.locator('.kb-board')).toBeVisible();
  
  const card = page.locator('[data-kb-card-id]').first();
  await expect(card).toBeVisible();
  
  // Drag to "Done" column
  const doneColumn = page.locator('[data-kb-column-id="done"]');
  await card.dragTo(doneColumn);
  
  // Assert card moved
  await expect(doneColumn.locator('[data-kb-card-id]')).toContainText('Moved document');
});
```

### 10.3 Manual Verification

1. Start server: `go run ./cmd/rag-eval serve --db state/rag-eval.db`
2. Open `http://localhost:8080/_kanban/document-pipeline`
3. Verify board renders with real database data
4. Test search, drag/drop, and card movement
5. Verify accessibility with keyboard navigation
6. Check browser console for JavaScript errors

---

## Part 11: Open Questions and Future Work

1. **Authentication**: How should DSL routes authenticate users? The existing system has no auth layer yet.

2. **Multi-tenancy**: If multiple users access the same board, how are concurrent moves handled? SQLite serializes writes, but the JavaScript move logic should be idempotent.

3. **CSS Framework**: Should we create a `@rag/ui` CSS package shared between React and DSL views, or keep styles separate?

4. **Hot Reload**: Can Goja scripts be reloaded without server restart during development?

5. **Performance**: For boards with 10,000+ cards, server-side rendering may become slow. Consider pagination or virtual scrolling.

6. **Custom Widgets**: The RAG system has Recharts visualizations. Can these be rendered server-side as SVG or generated images?

---

## Bottom Line

The RAG Evaluation System already has a solid Go backend and React frontend. Adding UI DSL and Kanban DSL capabilities lets you create server-rendered pages and interactive boards from JavaScript, using the same data layers that power the SPA. Follow these steps:

1. Study the reference implementations in `go-go-goja/modules/uidsl` and `2026-05-03--goja-hosting-site/pkg/kanbanddsl`
2. Create `internal/dsl/` wrappers that inject RAG services into the JavaScript context
3. Write example JavaScript files that use `ui.dsl` and `kanban.dsl` with your database
4. Register DSL routes in the HTTP server alongside existing API routes
5. Add Playwright tests for interactive behavior
6. Document each new component and board in this ticket's design doc

The system is designed to be extended. The DSL layer is additive — it does not replace the React frontend, but complements it for simpler, faster, server-rendered views.
