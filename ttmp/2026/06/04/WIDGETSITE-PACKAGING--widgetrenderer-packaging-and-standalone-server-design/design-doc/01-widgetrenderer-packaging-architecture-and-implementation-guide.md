---
Title: WidgetRenderer Packaging Architecture and Implementation Guide
Ticket: WIDGETSITE-PACKAGING
Status: active
Topics:
    - ui-dsl
    - goja
    - frontend
    - packaging
    - research
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../../../../code/wesen/go-go-golems/go-go-parc/Projects/2026/06/01/ARTICLE - Trusted npm Publishing for Go Go Golems React Packages.md
      Note: Trusted npm publishing and package artifact guidance used to revise single-package plan
    - Path: ../../../../../../../2026-05-03--goja-hosting-site/pkg/app/server.go
      Note: goja-site runtime/server/script-loading pattern
    - Path: ../../../../../../../go-go-goja/engine/factory.go
      Note: Runtime factory/module selection lifecycle
    - Path: ../../../../../../../go-go-goja/engine/runtime_modules.go
      Note: Current go-go-goja runtime module interface
    - Path: internal/web/spa.go
      Note: Current embedded SPA serving pattern
    - Path: packages/rag-evaluation-site/package.json
      Note: Single npm package exports
    - Path: packages/rag-evaluation-site/scripts/consumer-smoke.mjs
      Note: Clean consumer smoke for compiled dist artifact
    - Path: packages/rag-evaluation-site/scripts/sync-defaultspa.mjs
      Note: Sync script from app-dist to pkg/defaultspa/dist
    - Path: packages/rag-evaluation-site/src/app/App.tsx
      Note: |-
        Default app shell consuming /api/widget page endpoints
        Default app action POST and refresh behavior
    - Path: packages/rag-evaluation-site/src/index.ts
      Note: Root renderer package entrypoint and CSS side-effect import
    - Path: pkg/defaultspa/spa.go
      Note: Embedded default SPA package and fallback handler
    - Path: pkg/defaultspa/spa_test.go
      Note: Embedded app filesystem and fallback tests
    - Path: pkg/widgetdsl/module.go
      Note: |-
        Prototype Goja widget.dsl helper module to extract into public package
        Public widget.dsl Goja module implementation after extraction from internal
    - Path: pkg/widgetdsl/module_test.go
      Note: Direct require and engine registrar tests for the public widgetdsl package
    - Path: pkg/widgetdsl/registrar.go
      Note: go-go-goja engine RuntimeModuleSpec registrar for widget.dsl and rag.dsl
    - Path: pkg/widgetrunner/runner.go
      Note: |-
        Trusted script loader and page execution runtime for Widget IR pages
        SchemaVersion validation and Goja action execution
    - Path: pkg/widgetrunner/runner_test.go
      Note: Runner tests for pages map
    - Path: pkg/widgetschema/schema.go
      Note: Versioned Widget IR schema summary and JSON Schema
    - Path: pkg/widgetserver/server.go
      Note: HTTP API and frontend mode server implementation for Widget IR pages
    - Path: pkg/widgetserver/server_test.go
      Note: Widgetserver endpoint
    - Path: ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/scripts/03-widgetsite-smoke-server.go
      Note: Embedded WidgetRenderer Playwright smoke server
    - Path: web/src/widgets/WidgetRenderer.tsx
      Note: React renderer mapping Widget IR to real components
    - Path: web/src/widgets/ir.ts
      Note: Widget IR schema and serializable component/cell contracts
ExternalSources: []
Summary: Architecture and implementation guide for packaging the WidgetRenderer as a Go-served default app plus reusable npm renderer package.
LastUpdated: 2026-06-05T00:30:00-04:00
WhatFor: Use this when creating a standalone WidgetRenderer server, extracting the RAG-local renderer into packages, or onboarding an intern to the Goja + React packaging model.
WhenToUse: Before implementing pkg/widgetdsl, pkg/widgetrunner, pkg/widgetserver, default embedded SPA packaging, or an npm package for custom React apps.
---








# WidgetRenderer Packaging Architecture and Implementation Guide

## Executive Summary

The system should be packaged as two cooperating products: a Go package/binary that serves Widget IR pages, and an npm package that renders those pages in React. The Go side owns script loading, Goja runtime lifecycle, `widget.dsl` module registration, Widget IR validation, and HTTP APIs. The React side owns the visual component implementation through `WidgetRenderer`, typed IR definitions, action dispatch hooks, and CSS.

This design intentionally does **not** follow the older `goja-site` pattern of rendering Goja-authored UI DSL nodes into server-side HTML. `goja-site` is still the best reference for runtime ownership, trusted script loading, CLI shape, and Express-style route registration. The new WidgetRenderer package should borrow those runtime and packaging patterns while changing the rendering boundary: Goja scripts emit JSON-compatible Widget IR, Go serves that IR, and React renders it in the browser.

The preferred implementation has four layers:

1. `pkg/widgetdsl`: Goja `require("widget.dsl")` module that produces plain Widget IR maps.
2. `pkg/widgetrunner`: trusted script runner that loads scripts and calls page functions such as `exports.page(ctx)` or `exports.pages[id](ctx)`.
3. `pkg/widgetserver`: `net/http` API server that exposes pages, actions, schema, health, and optional static frontend serving.
4. one npm package:
   - `@go-go-golems/rag-evaluation-site`: reusable renderer, IR types, default registry, hooks, CSS, and a default app entrypoint that fetches Widget IR and renders it.

The default Go binary embeds the built default-app entrypoint from `@go-go-golems/rag-evaluation-site` for a single-binary experience. Users who want their own React app install the same npm package and import only the renderer/hooks/CSS subpaths they need.

## Implementation Status as of 2026-06-05

The first implementation slices now exist in the repository:

- `pkg/widgetdsl` exposes the public Goja `widget.dsl` / `rag.dsl` module and registrar.
- `pkg/widgetrunner` loads trusted scripts and executes `exports.pages[id](ctx)` / `exports.page(ctx)` into Widget IR page responses.
- `pkg/widgetserver` exposes `/api/widget` endpoints and frontend modes.
- `packages/rag-evaluation-site` now scaffolds the single npm package `@go-go-golems/rag-evaluation-site`.
- `pkg/defaultspa` embeds the built default app and `pkg/widgetserver` embedded mode now serves it by default.
- `pkg/widgetschema` exposes versioned schema metadata and a JSON Schema summary.
- `pkg/widgetrunner` / `pkg/widgetserver` now support `exports.actions[name](ctx, payload)` through `POST /api/widget/actions/{name}`.
- A Playwright smoke validated embedded app render, action POST, page refresh, and clean browser console.

The npm package slice includes copied reusable components and `web/src/widgets/*`, package exports for renderer/types/app/CSS, `useWidgetPage`, a default app entrypoint, Vite library build, Vite default-app build, dist package preparation, dry-run pack smoke, and clean consumer smoke. It intentionally keeps `dist/`, `app-dist/`, and `node_modules/` generated/ignored locally; the future CI workflow should build those artifacts before npm publish and before Go embedding.

Remaining implementation work is now primarily CI/trusted-publishing workflow wiring and any future polish such as production sourcemap policy. Renderer registry overrides were explicitly deferred for now.

## Problem Statement and Scope

We want a reusable package that can serve the WidgetRenderer UI outside the RAG evaluation application. It should support two audiences:

- **CLI/server users** who want `widget-site serve --scripts ./scripts` and a ready-made browser UI.
- **frontend users** who want to build their own React app while reusing the renderer, Widget IR types, and styling.

The package must answer these concrete questions:

- How do we bundle a React site into a Go binary?
- How do we let users provide their own React app instead of the bundled one?
- How do we expose the renderer as an npm package?
- How do we adapt goja-site/go-go-goja patterns without accidentally preserving the older server-side HTML rendering boundary?
- What files in the current RAG/goja-site/go-go-goja workspace should an intern read first?

Non-goals for the first implementation:

- Do not implement a full multi-tenant hosting service.
- Do not make untrusted JavaScript safe. This design assumes trusted scripts unless a later sandboxing ticket explicitly changes that.
- Do not require Express-style script routes for the first WidgetRenderer package. A page runner is simpler and gives a stable API contract.
- Do not force consumers to use the default React app. The npm renderer package should be independently usable.

## Current-State Architecture: Evidence Map

### RAG frontend already has the Widget IR and renderer contract

The Widget IR is defined in `web/src/widgets/ir.ts`. It establishes a JSON-compatible data model: `JsonPrimitive`, `JsonValue`, and `JsonObject` are defined at lines 5-7, while `WidgetNode` is the union of `TextNode`, `ElementNode`, and `ComponentNode` at lines 9-21. `ComponentNode` carries a `type`, optional props, and optional children at lines 41-46.

The important current invariant is that the IR is serializable. For example, table cells are represented by `CellSpec` variants instead of JavaScript or React callback functions. The `DataTableWidgetProps` contract requires `columns`, `rows`, and `getRowKey` at lines 123-130, and each column carries a serializable `cell: CellSpec` at lines 132-138.

The renderer is implemented in `web/src/widgets/WidgetRenderer.tsx`. It dispatches on node kind at lines 41-45 and on component type at lines 61-97. Unknown component types render a visible `ErrorCallout` at lines 95-97, which is a useful default for extensible package users. Component mappings include `AppShell`, `AppNav`, `Button`, `DataTable`, `MetadataGrid`, `Panel`, `SelectInput`, `TabList`, and `TextInput` at lines 61-97.

The table renderer bridges serialized cell specs back to real React table callbacks. `renderDataTable` maps columns to `DataTable` column definitions at lines 155-173, and calls `renderCell` for each row at line 167. `web/src/widgets/cellRenderers.tsx` then maps `CellSpec.kind` values to concrete display behavior: field, number, status, caption, template, link, and constant cells at lines 8-31.

### RAG currently embeds a built SPA in Go

The current RAG backend embeds the Vite build output in `internal/web/spa.go`. The `//go:embed all:dist` directive is at lines 9-10. `SPAHandler` creates a sub-filesystem rooted at `dist` at lines 14-20 and falls back to `index.html` for unknown SPA routes at lines 34-36.

The Vite config builds into that Go embed directory. `web/vite.config.ts` sets the dev proxy for `/api` at lines 9-16 and emits production assets to `../internal/web/dist` at lines 18-22. This is the simplest evidence for the default embedded-app packaging model.

The Go server registers API routes before the SPA fallback. `cmd/rag-eval/cmds/serve/server.go` calls `api.RegisterHandlersWithOptions` at line 37 and then mounts `web.SPAHandler()` at line 38. For the standalone package, preserve this order: API first, frontend fallback last.

### RAG has a working API shape for Widget IR pages

`internal/api/dsl_handlers.go` demonstrates the current JSON response shape. `handleDslDemoPage` reads the path parameter at line 6, rejects unknown pages at lines 7-10, and writes a response with `id`, `title`, and `root` at lines 12-17. The demo root is a component node with `kind: "component"` and `type: "AppShell"` at lines 15-18.

The static demo includes nested Widget IR for metadata, controls, and a table. It emits `TextInput` and `SelectInput` component nodes at lines 49-62 and a `DataTable` with rows and serializable columns/cells at lines 65-81. This is the concrete payload model that the new package should preserve.

The frontend fetch type is declared in `web/src/services/api.ts`: `DslPageResponse` has `id`, `title`, and `root: WidgetNode` at lines 4-8. The RTK Query endpoint `getDslPage` maps page ids to `dsl/pages/{id}` at lines 301-307. A reusable npm package should not require Redux, but the API shape is still useful.

`DslPreviewPage` fetches a page id and renders the root with `WidgetRenderer`. It calls `useGetDslPageQuery(pageId)` at line 13, handles loading/error/empty states at lines 15-25, and renders `<WidgetRenderer node={data.root} />` inside `data-rag-page="DslPreviewPage"` at lines 27-30. The default app can be a generic version of this page.

### RAG now has a Goja `widget.dsl` skeleton

The current `pkg/widgetdsl/module.go` is the extracted public in-repository Goja module for Widget IR authoring. It exports `ModuleName = "widget.dsl"` at line 13 and component shortcut names at lines 15-32. The module implements `modules.NativeModule` at line 55 and registers itself in the default registry at lines 94-96.

The module also exposes a direct `Register(*require.Registry)` helper that registers both `widget.dsl` and `rag.dsl` at lines 62-69. The exported helpers are installed in `runtime.install`: low-level helpers `text`, `element`, `component`, and `fragment` at lines 102-106; component shortcuts at lines 108-111; and `cell` helpers at lines 113-145. `pkg/widgetdsl/registrar.go` now adds an `engine.RuntimeModuleSpec` registrar for `engine.NewBuilder().WithModules(widgetdsl.NewRegistrar())` composition.

This is now importable as `github.com/go-go-golems/rag-evaluation-system/pkg/widgetdsl` from within this module and by external consumers of this module path. Remaining public-package work is validation, schema versioning, stronger fixtures, and deciding whether this should stay in the RAG module or move to a separate `github.com/go-go-golems/widget-site` module.

### goja-site is the closest runtime/server reference

`goja-site` is useful because it already owns a Go HTTP server, a Goja runtime, script loading, a CLI, and module registration. Its `serve` command defines flags for address, database, script directories, dev mode, read-only settings, and observability at `cmd/goja-site/serve.go` lines 21-35 and lines 52-67. It defaults scripts to `./scripts` at lines 83-85 and constructs `app.NewServer(...)` at lines 108-119.

The server owns database, runtime, host, and HTTP server fields at `pkg/app/server.go` lines 23-30. It creates a `gojahttp.Host` with an HTML renderer at line 58, configures module registrars at lines 68-75, creates a runtime at lines 81-85, then loads scripts at lines 88-92. `LoadScripts` reads each JavaScript file and executes it on the runtime owner at lines 153-172.

For the WidgetRenderer package, copy the runtime ownership and script-loading pattern, but replace the HTML renderer boundary with a JSON Widget IR page runner.

### go-go-goja has the runtime module contract to use

`go-go-goja/engine/runtime_modules.go` defines the current `RuntimeModuleSpec` contract: modules expose `ID()` and `RegisterRuntimeModule(ctx, reg)` at lines 12-20. The context includes the VM, event loop, owner, closer registry, and runtime values at lines 22-30.

`go-go-goja/engine/factory.go` shows how a runtime factory is configured. `WithModules` appends runtime-aware module registrations at lines 77-82. `UseModuleMiddleware` narrows which default-registry modules are available at lines 84-97. `Build` freezes the composition and validates module IDs at lines 122-178. `NewRuntime` creates the VM, event loop, owner, runtime context, and require registry at lines 181-256.

This is the API the new `pkg/widgetdsl.NewRegistrar()` should target.

### ui.dsl and Express are useful but not the rendering model

`go-go-goja/modules/uidsl/module.go` registers `ui.dsl` and `ui` at lines 11-19. Its loader exports HTML tag helpers, `fragment`, `text`, `raw`, `render`, `page`, and table helpers at lines 24-70. It normalizes Goja values into server-rendered HTML nodes at lines 107-147.

`go-go-goja/modules/express/express.go` registers an Express-like module that lets scripts call `express.app()`, then `app.get`, `app.post`, etc. Lines 94-125 build the app object and register handlers or static mounts. `go-go-goja/pkg/gojahttp/host.go` dispatches HTTP requests into JS handlers at lines 51-106 and can render non-string handler results as HTML at lines 108-118.

The old model is: script returns `ui.dsl` nodes -> Go renders HTML. The new model is: script returns Widget IR -> Go validates/serializes JSON -> React renders UI. Express can remain an optional advanced mode, but it should not be required for basic WidgetRenderer packaging.

## Target Architecture

### Conceptual diagram

```text
                      ┌────────────────────────────────────┐
                      │          User JS scripts            │
                      │  require("widget.dsl")              │
                      │  exports.pages.demo = (ctx) => IR   │
                      └──────────────────┬─────────────────┘
                                         │ Goja runtime call
                                         ▼
┌────────────────────┐      ┌────────────────────────────────────┐
│ pkg/widgetdsl      │      │ pkg/widgetrunner                   │
│ Goja helpers       │─────▶│ loads scripts, calls page funcs     │
│ emit Widget IR     │      │ normalizes + validates IR           │
└────────────────────┘      └──────────────────┬─────────────────┘
                                                │ PageResult
                                                ▼
                                 ┌────────────────────────────┐
                                 │ pkg/widgetserver           │
                                 │ GET /api/widget/pages/{id} │
                                 │ POST /api/widget/actions/* │
                                 └──────────────┬─────────────┘
                                                │ JSON
                                                ▼
┌────────────────────────────────────────────────────────────────┐
│ Browser                                                        │
│                                                                │
│  Default embedded app OR user app                              │
│  imports @go-go-golems/rag-evaluation-site                    │
│  fetches page JSON                                              │
│  <WidgetRenderer node={page.root} registry={...} />             │
└────────────────────────────────────────────────────────────────┘
```

### Package diagram

```text
Go module: github.com/go-go-golems/widget-site

cmd/widget-site
  main.go
  serve.go
  validate.go
  list_pages.go

pkg/widgetdsl
  module.go       // NewLoader(), NativeModule-style loader
  registrar.go    // engine.RuntimeModuleSpec for go-go-goja
  types.go        // optional Go structs for Widget IR

pkg/widgetrunner
  runner.go       // Runtime owner + script loading + page execution + minimal validation
  runner_test.go  // page execution, fallback page, missing page, invalid IR tests
  future split: scripts.go / validate.go / errors.go when the package grows

pkg/widgetserver
  server.go       // net/http ServeMux wiring
  handlers.go     // /api/widget/pages/{id}, actions, schema, health
  frontend.go     // embedded/dir/proxy/api-only frontend modes

pkg/defaultspa
  spa.go          // embedded dist FS + SPA fallback handler
  dist/...        // built default React app

npm package:

packages/rag-evaluation-site
  src/ir.ts
  src/WidgetRenderer.tsx
  src/registry.tsx
  src/actions.ts
  src/hooks/useWidgetPage.ts
  src/app/App.tsx
  src/app/PageRoute.tsx
  src/styles.css
  src/theme.css
  vite.config.ts
```

## API Contracts

### Page API

```http
GET /api/widget/pages/{id}?mode=preview
Accept: application/json
```

Response:

```json
{
  "id": "demo",
  "title": "Demo",
  "root": {
    "kind": "component",
    "type": "Panel",
    "props": { "title": "Demo" },
    "children": [
      { "kind": "text", "text": "Rendered by React" }
    ]
  },
  "meta": {
    "script": "scripts/demo.js",
    "generatedAt": "2026-06-04T23:00:00Z"
  }
}
```

Errors should be structured and stable:

```json
{
  "error": {
    "code": "script_runtime_error",
    "message": "exports.pages.demo threw an exception",
    "details": {
      "pageId": "demo",
      "script": "scripts/demo.js"
    }
  }
}
```

Recommended error codes:

- `page_not_found`
- `script_load_error`
- `script_runtime_error`
- `invalid_widget_ir`
- `action_not_found`
- `action_runtime_error`

### Action API

```http
POST /api/widget/actions/{name}
Content-Type: application/json
```

Request:

```json
{
  "payload": { "id": "chunk_001" },
  "context": {
    "componentType": "DataTable",
    "rowKey": "chunk_001",
    "row": { "id": "chunk_001", "title": "Fast Growing Trees" }
  }
}
```

Response:

```json
{
  "ok": true,
  "refresh": true,
  "toast": "Action completed",
  "patch": null
}
```

### Schema API

```http
GET /api/widget/schema
```

This should eventually return a JSON Schema or versioned schema bundle. Initially it can return a version string and a list of supported components.

```json
{
  "schemaVersion": "0.1.0",
  "components": ["Panel", "Stack", "DataTable", "Button"],
  "cellKinds": ["field", "number", "status", "caption", "template", "link", "constant"]
}
```

## Go API Sketches

### `pkg/widgetdsl`

```go
package widgetdsl

const ModuleName = "widget.dsl"

func NewLoader() require.ModuleLoader

type Registrar struct{}

func NewRegistrar() *Registrar { return &Registrar{} }
func (r *Registrar) ID() string { return "widget-dsl" }
func (r *Registrar) RegisterRuntimeModule(ctx *engine.RuntimeModuleContext, reg *require.Registry) error {
    loader := NewLoader()
    reg.RegisterNativeModule("widget.dsl", loader)
    reg.RegisterNativeModule("rag.dsl", loader)
    return nil
}
```

The current RAG prototype has now been extracted to `pkg/widgetdsl/module.go`, and `pkg/widgetdsl/registrar.go` provides the first `engine.RuntimeModuleSpec` registrar. The remaining work in this layer is validation, schema/version tests, and broader fixture coverage.

### `pkg/widgetrunner`

```go
type Config struct {
    ScriptDirs []string
    Dev        bool
    Modules    []engine.RuntimeModuleSpec
}

type Runner struct {
    factory *engine.Factory
    runtime *engine.Runtime
    scripts []ScriptInfo
}

type PageContext struct {
    PageID string                 `json:"pageId"`
    Query  map[string]string      `json:"query"`
    User   map[string]any         `json:"user,omitempty"`
    Data   map[string]any         `json:"data,omitempty"`
}

type PageResult struct {
    ID    string     `json:"id"`
    Title string     `json:"title"`
    Root  WidgetNode `json:"root"`
    Meta  map[string]any `json:"meta,omitempty"`
}

func NewRunner(ctx context.Context, cfg Config) (*Runner, error)
func (r *Runner) LoadScripts(ctx context.Context) error
func (r *Runner) RenderPage(ctx context.Context, id string, pageCtx PageContext) (*PageResult, error)
func (r *Runner) InvokeAction(ctx context.Context, name string, req ActionRequest) (*ActionResult, error)
func (r *Runner) Close(ctx context.Context) error
```

### `pkg/widgetserver`

```go
type FrontendMode string

const (
    FrontendEmbedded FrontendMode = "embedded"
    FrontendDir      FrontendMode = "dir"
    FrontendProxy    FrontendMode = "proxy"
    FrontendAPIOnly  FrontendMode = "api-only"
)

type Config struct {
    Addr          string
    Runner        *widgetrunner.Runner
    FrontendMode  FrontendMode
    FrontendDir   string
    FrontendProxy string
    APIPrefix     string // default /api/widget
    Dev           bool
}

type Server struct {
    cfg Config
    mux *http.ServeMux
}

func New(cfg Config) (*Server, error)
func (s *Server) Handler() http.Handler
func (s *Server) Run(ctx context.Context) error
```

Route registration should use the Go standard library `http.ServeMux`:

```go
func (s *Server) registerRoutes() {
    prefix := strings.TrimRight(s.cfg.APIPrefix, "/")

    s.mux.HandleFunc("GET "+prefix+"/health", s.handleHealth)
    s.mux.HandleFunc("GET "+prefix+"/pages/{id}", s.handlePage)
    s.mux.HandleFunc("POST "+prefix+"/actions/{name}", s.handleAction)
    s.mux.HandleFunc("GET "+prefix+"/schema", s.handleSchema)

    // Frontend fallback last.
    if s.cfg.FrontendMode != FrontendAPIOnly {
        s.mux.Handle("/", s.frontendHandler())
    }
}
```

## npm Package Design

The npm side should be a **single package** named `@go-go-golems/rag-evaluation-site`. Earlier versions of this plan split the renderer and default app into `@go-go-golems/widget-renderer` and `@go-go-golems/widget-site-app`; that has been superseded. The single package should still expose clean subpaths so custom React apps can import only the renderer without mounting the default app.

The package source directory should be named `packages/rag-evaluation-site`, and the unscoped internal package name can be described as `rag-evaluation-site` in scripts and docs. The published npm name is scoped:

```text
@go-go-golems/rag-evaluation-site
```

### Package responsibilities

The package should contain:

- Widget IR TypeScript types.
- `WidgetRenderer` and default widget registry.
- Action dispatch helpers.
- `useWidgetPage` fetch hook.
- Default CSS/theme tokens.
- A default app entrypoint that fetches `/api/widget/pages/{id}` and renders a page.
- Optional Storybook/demo fixtures for development, excluded from the publish artifact unless intentionally exported.

It should **not** depend on Redux, RTK Query, or the RAG application store. A user-provided React app should be able to install this package, import the renderer and CSS, and point it at any compatible Widget IR API.

### Recommended package source layout

```text
packages/rag-evaluation-site/
  package.json
  README.md
  src/
    index.ts
    ir.ts
    WidgetRenderer.tsx
    registry.tsx
    cellRenderers.tsx
    actions.ts
    hooks/
      useWidgetPage.ts
    app/
      main.tsx
      App.tsx
      PageRoute.tsx
      LoadingState.tsx
      ErrorState.tsx
    styles.css
    theme.css
  dist/                 # generated publish artifact, not source contract
```

### Recommended exports

```json
{
  "name": "@go-go-golems/rag-evaluation-site",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "license": "MIT",
  "sideEffects": ["**/*.css"],
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "react": "^18 || ^19",
    "react-dom": "^18 || ^19"
  },
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "import": "./index.js"
    },
    "./ir": {
      "types": "./ir.d.ts",
      "import": "./ir.js"
    },
    "./app": {
      "types": "./app/index.d.ts",
      "import": "./app/index.js"
    },
    "./styles.css": "./styles.css",
    "./theme.css": "./theme.css"
  },
  "files": [
    "**/*.js",
    "**/*.d.ts",
    "**/*.css",
    "**/*.json",
    "README.md"
  ]
}
```

The public root export should expose the reusable renderer contract:

```ts
export type {
  WidgetNode,
  ComponentNode,
  TextNode,
  ElementNode,
  ActionSpec,
  CellSpec,
  DataTableWidgetProps,
} from './ir';

export interface WidgetRendererProps {
  node: WidgetNode;
  registry?: WidgetRegistry;
  onAction?: WidgetActionHandler;
}

export function WidgetRenderer(props: WidgetRendererProps): React.ReactElement;

export const defaultWidgetRegistry: WidgetRegistry;

export function createWidgetRegistry(overrides: WidgetRegistry): WidgetRegistry;

export function useWidgetPage(url: string, options?: UseWidgetPageOptions): UseWidgetPageResult;
```

A user app should be able to do this:

```tsx
import {
  WidgetRenderer,
  useWidgetPage,
  defaultWidgetRegistry,
} from '@go-go-golems/rag-evaluation-site';
import '@go-go-golems/rag-evaluation-site/styles.css';

export function MyWidgetPage() {
  const { page, loading, error, refresh } = useWidgetPage('/api/widget/pages/demo');

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Failed to load page</div>;
  if (!page) return <div>No page</div>;

  return (
    <WidgetRenderer
      node={page.root}
      registry={defaultWidgetRegistry}
      onAction={(action, context) => {
        if (action.kind === 'server') {
          fetch(`/api/widget/actions/${action.name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload: action.payload ?? {}, context }),
          }).then(() => refresh());
        }
      }}
    />
  );
}
```

The default app entrypoint should be imported by the package's own Vite build for embedding in Go. Consumers may also import it if they want the default site shell:

```tsx
import { RagEvaluationSiteApp } from '@go-go-golems/rag-evaluation-site/app';
import '@go-go-golems/rag-evaluation-site/styles.css';

export function App() {
  return <RagEvaluationSiteApp apiBase="/api/widget" defaultPageId="index" />;
}
```

### Trusted npm publishing requirements

The package should follow the trusted-publishing playbook from `ARTICLE - Trusted npm Publishing for Go Go Golems React Packages.md`:

- Publish a compiled `dist/` artifact, not TypeScript source.
- Ensure `dist/package.json` has runtime `.js` exports and `.d.ts` type exports.
- Do not leak `workspace:*` dependencies into the publish artifact.
- Export plain/self-contained CSS; do not require consumer Tailwind/PostCSS processing unless explicitly documented.
- Add pack-smoke and clean-consumer smoke tests before first publish.
- Bootstrap new package existence with one manual `npm publish` if trusted publishing cannot be configured before the package exists.
- Configure npm Trusted Publishing for repository `go-go-golems/rag-evaluation-site`, workflow `publish-npm.yml`, environment `npm-production`.
- Use GitHub Actions `permissions.id-token: write` and npm `>=11.10.0`.
- Do not pass `NODE_AUTH_TOKEN` in the trusted-publishing workflow.
- After tokenless publishing is verified under `next`, set package publishing access to require 2FA and disallow tokens.

## Frontend Modes for User-Provided Apps

The server should support four modes.

### Mode 1: Embedded default app

```bash
widget-site serve --frontend embedded --scripts ./scripts
```

- Serves the embedded `pkg/defaultspa/dist` build.
- Best for `go install` and single-binary demos.
- Requires dist assets to be present when the Go package is built.

### Mode 2: User app directory

```bash
widget-site serve --frontend-dir ./my-widget-app/dist --scripts ./scripts
```

- Serves a user's already-built React app.
- The app must call the Widget API itself.
- Good for production custom apps without a separate static host.

### Mode 3: Frontend dev proxy

```bash
widget-site serve --frontend-proxy http://127.0.0.1:5173 --scripts ./scripts --dev
```

- Go serves APIs.
- Vite serves the user app with HMR.
- The Go server proxies non-API requests to Vite.
- Best developer experience.

### Mode 4: API only

```bash
widget-site serve --api-only --scripts ./scripts
```

- Go exposes only `/api/widget/*`.
- User hosts React app elsewhere.
- Best for deployments with a dedicated frontend host.

## Build and Bundling Strategy

### Default app build flow

```text
pnpm install
pnpm --filter @go-go-golems/rag-evaluation-site typecheck
pnpm --filter @go-go-golems/rag-evaluation-site build
pnpm --filter @go-go-golems/rag-evaluation-site build:app
rm -rf pkg/defaultspa/dist
cp -R packages/rag-evaluation-site/app-dist pkg/defaultspa/dist
go build ./cmd/widget-site
```

The package should have two build outputs:

- `dist/`: npm publish artifact for `@go-go-golems/rag-evaluation-site`.
- `app-dist/`: Vite app build consumed by Go `pkg/defaultspa`.

### Release strategy

There are two viable release strategies:

1. **Check in `pkg/defaultspa/dist`.**
   - Pros: `go install github.com/.../cmd/widget-site@latest` works without Node.
   - Cons: generated assets live in the Go repository.

2. **Do not check in `dist`; build via release pipeline only.**
   - Pros: cleaner source tree.
   - Cons: `go install` from source fails unless the release artifact includes generated assets or the embed package has a fallback.

Recommended decision: check in the default app dist for the first public package. This optimizes for installability. Add CI that fails if source changes and `dist` is stale.

### Go generate option

Use `go generate` for local and CI asset refresh:

```go
// pkg/defaultspa/generate.go
package defaultspa

//go:generate go run ./internal/cmd/build-defaultspa
```

The generator should:

1. find the repo root,
2. run `pnpm --filter @go-go-golems/rag-evaluation-site build:app`,
3. delete `pkg/defaultspa/dist`,
4. copy `packages/rag-evaluation-site/app-dist` into `pkg/defaultspa/dist`,
5. optionally write a manifest with git SHA and build timestamp.

### npm trusted publishing flow

The release workflow should have these layers:

```text
source package -> typecheck -> compiled dist -> npm pack smoke -> clean consumer smoke -> trusted npm publish
```

The workflow must request OIDC but not use npm tokens:

```yaml
permissions:
  contents: read
  id-token: write

jobs:
  publish-npm:
    runs-on: ubuntu-latest
    environment: npm-production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
      - name: Upgrade npm for trusted publishing
        run: npm install -g npm@^11.10.0
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @go-go-golems/rag-evaluation-site typecheck
      - run: pnpm --filter @go-go-golems/rag-evaluation-site build
      - run: pnpm --filter @go-go-golems/rag-evaluation-site pack:smoke
      - run: pnpm --filter @go-go-golems/rag-evaluation-site consumer:smoke
      - run: npm publish packages/rag-evaluation-site/dist --access public --tag next --provenance
```

Bootstrap sequence for a new package:

1. Build and pack-smoke `packages/rag-evaluation-site/dist`.
2. Perform one manual `npm publish packages/rag-evaluation-site/dist --access public --tag next` if npm trust cannot be configured before package existence.
3. Configure trust:

```bash
npx -y npm@latest trust github @go-go-golems/rag-evaluation-site \
  --repo go-go-golems/rag-evaluation-site \
  --file publish-npm.yml \
  --env npm-production \
  --allow-publish
```

4. Run a real GitHub Actions publish under `next`.
5. Only after tokenless publish is verified, disallow token publishing:

```bash
npx -y npm@latest access set mfa=publish @go-go-golems/rag-evaluation-site
```

## Implementation Plan for an Intern

### Phase 1: Create single npm package `@go-go-golems/rag-evaluation-site`

Goal: create one publishable npm package containing the reusable renderer, IR types, hooks, CSS, and default app entrypoint.

Tasks:

- Create `packages/rag-evaluation-site/package.json`.
- Copy `web/src/widgets/ir.ts` into `packages/rag-evaluation-site/src/ir.ts`.
- Copy `WidgetRenderer.tsx`, `cellRenderers.tsx`, and `actions.ts`.
- Copy only the component primitives needed by the renderer.
- Add `src/hooks/useWidgetPage.ts`.
- Add `src/app/*` for the default app shell.
- Remove RAG app dependencies such as Redux store imports.
- Add Vite library build or tsup/Rollup build for `dist/`.
- Add Vite app build for `app-dist/`.
- Export self-contained `styles.css` / `theme.css`.
- Add Storybook stories as package examples, but keep stories out of the publish artifact unless intentionally exported.

Validation:

```bash
pnpm --filter @go-go-golems/rag-evaluation-site typecheck
pnpm --filter @go-go-golems/rag-evaluation-site build
pnpm --filter @go-go-golems/rag-evaluation-site build:app
pnpm --filter @go-go-golems/rag-evaluation-site pack:smoke
pnpm --filter @go-go-golems/rag-evaluation-site consumer:smoke
```

### Phase 2: Embed the package default app in Go

Goal: build the package's default app entrypoint and embed it in the Go binary.

Tasks:

- Implement `RagEvaluationSiteApp` in `packages/rag-evaluation-site/src/app`.
- Build `packages/rag-evaluation-site/app-dist`.
- Copy `app-dist` into `pkg/defaultspa/dist`.
- Serve `pkg/defaultspa/dist` through the Go SPA handler.
- Keep the default app generic: it fetches `/api/widget/pages/{id}` and renders `WidgetRenderer`.

Pseudocode:

```tsx
function RagEvaluationSiteApp({ apiBase = '/api/widget', defaultPageId = 'index' }) {
  const pageId = readPageIdFromLocation() ?? defaultPageId;
  const { page, loading, error } = useWidgetPage(`${apiBase}/pages/${pageId}`);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <WidgetRenderer node={page.root} />;
}
```

### Phase 3: Move `widget.dsl` to a public Go package

Goal: make the Goja module importable by the standalone server and by other Go programs.

Tasks:

- [done] Move the earlier RAG-local module to `pkg/widgetdsl`.
- [done] Add an `engine.RuntimeModuleSpec` registrar.
- [done] Keep `NewLoader()` for direct goja_nodejs registration tests.
- [done] Add tests for `require("widget.dsl")` and `require("rag.dsl")`.
- [done] Add tests that `JSON.stringify(rag.panel(...))` produces valid IR.
- [remaining] Add validation/error tests for malformed props and required `DataTable` fields.

Pseudocode:

```go
factory, err := engine.NewBuilder().
    WithModules(widgetdsl.NewRegistrar()).
    UseModuleMiddleware(engine.MiddlewareOnly("path", "time", "timer", "yaml")).
    Build()
```

### Phase 4: Implement `pkg/widgetrunner`

Goal: load scripts and call page functions.

Status: initial implementation complete in `pkg/widgetrunner`. It loads trusted `.js` scripts, installs a shared global `exports` object, calls `exports.pages[id](ctx)` or fallback `exports.page(ctx)`, wraps bare WidgetNode results into a page response, and performs minimal Widget IR validation. JSON Schema/versioning remains future work under the validation task.

Tasks:

- [done] Implement script discovery similar to goja-site `LoadScripts`.
- [done] Load scripts through `runtime.Owner.Call` so all JS runs on the runtime owner.
- [done] Define the script contract.
- [done] Implement `RenderPage(ctx, id, pageCtx)`.
- [partial] Validate returned IR before serving it; minimal node validation exists, full schema/version validation remains.

Script contract:

```js
const rag = require('widget.dsl');

exports.pages = {
  demo(ctx) {
    return {
      id: 'demo',
      title: 'Demo',
      root: rag.panel({ title: 'Demo' }, 'Hello')
    };
  }
};
```

Runner pseudocode:

```go
func (r *Runner) RenderPage(ctx context.Context, id string, input PageContext) (*PageResult, error) {
    input.PageID = id
    ret, err := r.runtime.Owner.Call(ctx, "widgetrunner.render-page", func(ctx context.Context, vm *goja.Runtime) (any, error) {
        fn, err := lookupPageFunction(vm, id) // exports.pages[id], then exports.page
        if err != nil { return nil, err }
        value, err := fn(goja.Undefined(), vm.ToValue(pageContextMap(input)))
        if err != nil { return nil, err }
        return value.Export(), nil
    })
    if err != nil { return nil, err }
    page, err := NormalizePageResult(id, ret)
    if err != nil { return nil, err }
    return page, ValidatePage(page)
}
```

### Phase 5: Implement `pkg/widgetserver`

Goal: provide stable APIs and frontend modes.

Status: initial implementation complete in `pkg/widgetserver`. It wraps `pkg/widgetrunner` with `net/http` APIs, supports configurable API prefix, maps runner errors into structured JSON errors, exposes a schema summary, returns an explicit not-implemented response for actions, and supports frontend modes `embedded`, `dir`, `proxy`, and `api-only`. Embedded mode currently requires a provided `FrontendHandler` until `pkg/defaultspa` exists.

Tasks:

- [done] Add `GET /api/widget/pages/{id}`.
- [done] Add `POST /api/widget/actions/{name}` as explicit `501 action_not_implemented` placeholder.
- [done] Add `GET /api/widget/schema`.
- [done] Add `GET /api/widget/health`.
- [done] Add frontend modes: embedded, dir, proxy, api-only.
- [done] Ensure the SPA fallback is mounted last.

Validation:

```bash
go test ./pkg/widgetserver ./pkg/widgetrunner ./pkg/widgetdsl -count=1
go test ./... -count=1
```

### Phase 6: Add release packaging

Goal: make the packages installable and publishable.

Tasks:

- Add `Makefile` targets:
  - `pnpm-build`
  - `defaultspa-generate`
  - `go-test`
  - `build`
  - `release-snapshot`
- Add GitHub Actions:
  - install pnpm,
  - build npm packages,
  - generate default SPA,
  - run Go tests,
  - build binary.
- Add GoReleaser if binary distribution matters.
- Publish `@go-go-golems/rag-evaluation-site` from generated `dist/` through npm Trusted Publishing.

## Decision Records

### Decision: Widget IR over server-side HTML

- **Context:** goja-site uses `ui.dsl` and Go-side HTML rendering, but the RAG implementation has a typed React renderer and component library.
- **Options considered:** Keep server-side HTML; emit Widget IR JSON and render with React; SSR React from Go; embed a WebView-like renderer.
- **Decision:** Emit Widget IR JSON and render with React in the browser.
- **Rationale:** The current `WidgetRenderer` maps IR to real React components and preserves component behavior. Reimplementing that as Go HTML would duplicate CSS modules, hooks, action semantics, and accessibility behavior.
- **Consequences:** Requires a frontend bundle, but enables reusable React packages and custom user apps.
- **Status:** proposed.

### Decision: Single npm package `@go-go-golems/rag-evaluation-site`

- **Context:** The packaging plan originally split reusable renderer and default app into separate npm packages, but the current direction is to ship one package named `rag-evaluation-site` under the Go Go Golems scope.
- **Options considered:** One package with subpath exports; separate renderer and app packages; no npm package, only Go embedded app.
- **Decision:** Publish one package: `@go-go-golems/rag-evaluation-site`.
- **Rationale:** One package reduces release coordination and matches the intended product identity while still allowing custom apps to import renderer-only subpaths.
- **Consequences:** The package must keep clean exports so consumers can import renderer APIs without mounting the default app. Bundle size and dependency boundaries need extra attention.
- **Status:** accepted.

### Decision: Public Go packages, not `internal/`

- **Context:** The earlier RAG `widgetdsl` prototype lived under `internal/`, which could not be imported by external modules.
- **Options considered:** Keep it internal and copy code; move to `pkg/widgetdsl`; create a separate module.
- **Decision:** Move reusable code to `pkg/widgetdsl` first, with the option to later extract it to a separate `github.com/go-go-golems/widget-site` module.
- **Rationale:** A standalone binary and third-party Go users need importable packages.
- **Consequences:** Public API stability matters; tests and docs become more important.
- **Status:** proposed.

### Decision: Page runner before Express-style script routes

- **Context:** goja-site scripts can register arbitrary routes through Express. WidgetRenderer pages only need a stable page API initially.
- **Options considered:** Express-first; page-runner-first; both at launch.
- **Decision:** Implement page runner first, keep Express as optional advanced integration.
- **Rationale:** Page runner gives a simple API (`GET /api/widget/pages/{id}`), easier validation, and fewer security surprises.
- **Consequences:** Scripts cannot define arbitrary HTTP routes in phase 1; action endpoints need a separate explicit contract.
- **Status:** proposed.

### Decision: Check in default SPA dist for installability

- **Context:** Go `//go:embed` requires assets at compile time. `go install` cannot run pnpm automatically.
- **Options considered:** Check in dist; require `go generate`; release-only generated assets.
- **Decision:** Check in default app dist for early public packaging.
- **Rationale:** Users can install and build the Go binary without Node.
- **Consequences:** CI must detect stale generated assets.
- **Status:** proposed.

## Risks and Open Questions

- **Schema drift:** TypeScript IR, Go validator structs, and Goja helper output can diverge. Mitigation: generate JSON Schema from TypeScript or maintain contract tests with fixtures.
- **Runtime safety:** goja-site and this design assume trusted scripts. If untrusted scripts are needed, add a sandboxing/security design first.
- **CSS coupling:** The renderer package currently depends on copied component styles. A public package should move toward CSS variables and documented theme tokens.
- **React controlled input warnings:** Current `SelectInput` rendering uses `value` without `onChange`. Decide whether static widgets use `defaultValue` or action-backed controlled state.
- **go-go-goja API version mismatch:** goja-site uses `github.com/go-go-golems/go-go-goja v0.4.16`; the local checked-out go-go-goja shows a `RuntimeModuleSpec` interface. Do not copy registrar code blindly; target the version used by the new package.
- **Custom widget extensions:** The renderer needs a registry override API so user apps can render custom component types emitted by scripts.

## File Reference Map for Interns

Read in this order:

1. `web/src/widgets/ir.ts` — Widget IR model and JSON-serializable component/cell contracts.
2. `web/src/widgets/WidgetRenderer.tsx` — renderer dispatch and component mapping.
3. `web/src/widgets/cellRenderers.tsx` — serializable table cell behavior.
4. `internal/api/dsl_handlers.go` — example JSON page response.
5. `web/src/components/pages/DslPreviewPage/DslPreviewPage.tsx` — minimal fetch + render page.
6. `internal/web/spa.go` and `web/vite.config.ts` — embedded SPA build/serve model.
7. `pkg/widgetdsl/module.go` — current Goja Widget IR helper prototype.
8. `goja-site/pkg/app/server.go` — runtime/server/script-loading pattern.
9. `go-go-goja/engine/runtime_modules.go` and `engine/factory.go` — runtime module registration and lifecycle.
10. `go-go-goja/modules/uidsl/module.go` and `modules/express/express.go` — older HTML/Express reference patterns to adapt carefully.

## Validation Checklist

For the first implementation, require:

- `pnpm --filter @go-go-golems/rag-evaluation-site typecheck`
- `pnpm --filter @go-go-golems/rag-evaluation-site build`
- `pnpm --filter @go-go-golems/rag-evaluation-site build:app`
- `pnpm --filter @go-go-golems/rag-evaluation-site pack:smoke`
- `pnpm --filter @go-go-golems/rag-evaluation-site consumer:smoke`
- `go generate ./pkg/defaultspa`
- `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver -count=1`
- `go test ./... -count=1`
- Browser smoke:
  - start `widget-site serve --scripts examples/basic --dev`,
  - open `/`,
  - verify `GET /api/widget/pages/demo` returns JSON,
  - verify `<WidgetRenderer>` renders at least one panel and one table,
  - verify console has no React controlled-input warnings.

## References

- RAG Widget IR schema: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/widgets/ir.ts`
- RAG WidgetRenderer: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/widgets/WidgetRenderer.tsx`
- RAG static Widget IR endpoint: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/api/dsl_handlers.go`
- RAG embedded SPA handler: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/web/spa.go`
- goja-site server: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-03--goja-hosting-site/pkg/app/server.go`
- go-go-goja runtime modules: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/engine/runtime_modules.go`
- go-go-goja factory: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/engine/factory.go`
- go-go-goja `ui.dsl`: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/uidsl/module.go`
- go-go-goja Express/gojahttp: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/express/express.go`, `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/pkg/gojahttp/host.go`
