---
Title: Review and Revised Implementation Guide for the RAG Widget DSL
Ticket: RAGEVAL-UI-DSL
Status: active
Topics:
    - go
    - goja
    - javascript
    - web
    - react
    - dsl
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/02-rag-widget-dsl-design-component-to-html-mapping.md
      Note: Previous widget DSL proposal under review
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/layout/Panel/Panel.tsx
      Note: Representative presentational React component using CSS Modules
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/layout/Panel/Panel.module.css
      Note: Evidence that CSS Modules use local class names such as root/fill/header/body
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/molecules/DataTable/DataTable.tsx
      Note: Generic table API with function-valued cell renderers
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/molecules/DataTable/DataTable.module.css
      Note: Table CSS module classes used by React component
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/organisms/SearchControlsPanel/SearchControlsPanel.tsx
      Note: Stateful/search organism whose props are callbacks and live values
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/corpus/DocumentInspector/DocumentInspector.tsx
      Note: Stateful complex widget using hooks, RTK Query, tabs, selection, and clipboard
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/services/api.ts
      Note: API contracts and generated RTK Query hooks used by widgets
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/vite.config.ts
      Note: Frontend build embeds Vite output into internal/web/dist
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/web/spa.go
      Note: Current Go server only serves embedded SPA assets, not dynamic Goja widget pages
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/cmd/rag-eval/cmds/serve/server.go
      Note: Current HTTP mux wiring for API routes and SPA fallback
ExternalSources: []
Summary: Review of the previous RAG widget DSL design, identifying strong ideas, incorrect assumptions, missing architecture, and a revised implementation plan centered on a typed Widget IR rendered by the actual React component registry.
LastUpdated: 2026-06-02T23:00:00-04:00
WhatFor: Help a new intern understand what the previous DSL proposal got right and wrong, and give them a safer implementation path for a real RAG-specific UI DSL.
WhenToUse: Before implementing widget.dsl, when reviewing DSL designs, or when deciding whether to generate HTML directly or render actual React components from a widget specification.
---

# Review and Revised Implementation Guide for the RAG Widget DSL

## Executive Summary

The previous RAG-specific UI DSL design made an important correction: it moved away from blindly copying the generic `kanban.dsl` example and toward a DSL for this repository's real widget types. That was the right instinct. The design correctly noticed that `web/src/components/` is not just a bag of HTML tags; it is a curated component system with atoms, foundation primitives, layout components, molecules, organisms, corpus widgets, and workflow widgets.

However, the proposed solution still made a risky architectural leap: it assumed the DSL should emit hand-written HTML that mimics React components and CSS Modules. That is fragile. The actual widgets are React components. Several of them contain state, callbacks, conditional rendering, RTK Query calls, clipboard behavior, tab state, and CSS Modules imported as `styles`. A DSL that tries to reproduce those components in Go by hard-coding class names is likely to drift from the real UI quickly.

The stronger design is to define a **typed Widget IR** (intermediate representation) produced by Goja scripts, then render that IR with the **actual React component registry** inside the existing Vite app. The DSL should not try to be React in Go. It should be a concise JavaScript authoring layer that returns JSON-like widget trees. The React app should own rendering, event handling, CSS Modules, accessibility behavior, and RTK Query integration.

The revised model is:

```text
Goja script
  uses widget.dsl builders
      ↓
Widget IR JSON
  validated by Go schemas and/or TypeScript zod-like schemas
      ↓
React WidgetRenderer
  maps {type: "Panel"} to <Panel ...>
      ↓
Actual existing components
  with real CSS Modules, hooks, event registry, RTK Query where appropriate
```

This approach keeps the DSL domain-specific while avoiding a second, divergent implementation of the UI component library.

---

## 1. What the Previous Work Did Well

### 1.1 It corrected the biggest conceptual mistake: Kanban was only a pattern reference

The first draft treated `kanban.dsl` as if this project needed a new Kanban board package. The user clarified that Kanban was only an example of how a Goja-native DSL can be shaped. The previous designer then recognized that this project needs a DSL for **RAG evaluation widgets**, not a generic task board.

That correction matters. The RAG frontend has widgets like:

- `SearchControlsPanel`
- `RetrievalResultsPanel`
- `CoveragePanel`
- `DocumentBrowser`
- `DocumentInspector`
- `IdentityBar`
- `WorkflowListPanel`
- `WorkflowSummaryPanel`
- `DataTable`
- `MetadataGrid`
- `Panel`
- `DashboardGrid`

Those are the semantic vocabulary of this UI. A good DSL should speak in those terms.

### 1.2 It read real component files instead of inventing widgets from memory

The second design doc relates and discusses actual files under `web/src/components/`. That was good engineering behavior. It found the atomic design structure and noticed important implementation details:

- `Panel` uses `title`, `actions`, `density`, and `fill` props.
- `DataTable` uses a `columns` array and function-valued `cell` renderers.
- `StatusText` maps status strings to icons and style classes.
- `DashboardGrid` has named recipes: `searchWorkbench`, `corpusExplorer`, `twoColumn`.
- `DocumentInspector` is not a single flat card; it is a tabbed inspector with overview, text, chunks, coverage, and artifacts tabs.

That evidence-driven inventory is the most useful part of the prior work.

### 1.3 It identified CSS as a real design problem

The previous design noticed that React CSS Modules produce class names that cannot simply be typed by hand in server-generated HTML. It proposed stable BEM names such as `Panel_root` and `Button_primary`. While I disagree with making that the primary path, the problem statement is real: if a Go-rendered DSL tries to mimic React DOM, CSS Module class resolution becomes a build-time integration problem.

### 1.4 It recognized that interactions need declarative action references

The previous work suggested that callbacks become `data-action="actionName"`. That is directionally correct: a DSL cannot serialize JavaScript closures from React props over an HTML boundary. Interactions need a registry or event contract. The better version of this idea is to encode action references in Widget IR, then let the React renderer bind them to an action dispatch layer.

### 1.5 It produced a useful widget catalog for onboarding

Even if the architecture needs revision, the catalog of DSL functions is useful as a vocabulary list:

```javascript
rag.panel(...)
rag.dataTable(...)
rag.metadataGrid(...)
rag.searchControls(...)
rag.documentBrowser(...)
rag.documentInspector(...)
rag.workflowList(...)
```

An intern can use this catalog to learn the component library. The problem is not the names; the problem is the proposed rendering mechanism.

---

## 2. What the Previous Work Did Less Well

### 2.1 It treated React components as if they were static HTML templates

Some components are close to static templates. For example, `Panel.tsx` is mostly a presentational wrapper:

```tsx
export function Panel({ title, actions, density = 'normal', fill = false, className, children, ...rest }: PanelProps) {
  return (
    <section className={[styles.root, fill ? styles.fill : '', className ?? ''].filter(Boolean).join(' ')} data-rag-layout="Panel" {...rest}>
      {(title || actions) && (
        <div className={styles.header}>
          <span>{title}</span>
          {actions}
        </div>
      )}
      <div className={density === 'condensed' ? styles.condensed : styles.body}>{children}</div>
    </section>
  );
}
```

But many widgets are not static templates:

- `SearchControlsPanel` receives many state setters and event callbacks.
- `DocumentBrowser` has local `useState` search filtering.
- `DocumentInspector` has `useState` tabs, selected chunk state, RTK Query calls for artifacts, and clipboard behavior.
- `WorkflowSummaryPanel` contains a custom progress bar with derived percentages.
- `RetrievalResultsPanel` changes its table columns depending on retriever type.

A design that says “emit equivalent HTML” misses the behavioral and stateful nature of those components.

### 2.2 It underestimated CSS Modules

The proposed BEM extraction is possible but expensive and fragile. The CSS files use local names like:

```css
/* Panel.module.css */
.root { ... }
.fill { ... }
.header { ... }
.body { ... }
.condensed { ... }
```

React imports these through:

```tsx
import styles from './Panel.module.css';
```

At build time, Vite transforms `styles.root` into generated class names. The Go server does not know those names unless we either:

1. export a CSS module manifest,
2. reproduce Vite's class-name algorithm exactly,
3. use global stable class names in addition to CSS Modules,
4. avoid server-side HTML mimicry and render through React.

The previous design chose option 3 implicitly (`Panel_root`). That creates a second CSS contract. Every CSS update now has to preserve both the React CSS Module and the DSL global class. That is duplication.

### 2.3 It did not separate authoring DSL from rendering runtime

A DSL has two jobs:

1. **Authoring**: make it pleasant to describe a UI.
2. **Rendering**: turn that description into visible UI.

The prior work conflated them. It assumed each DSL function should directly build `uidsl.Element` nodes. That is how the reference `ui.dsl` works, but this project already has a rich React renderer. For RAG widgets, the DSL should author a typed widget tree, not hand-render DOM.

### 2.4 It missed the existing SPA deployment boundary

The current server wiring is:

```go
mux := http.NewServeMux()
api.RegisterHandlersWithOptions(mux, database, api.Options{EngineDB: engineDB})
mux.Handle("/", web.SPAHandler())
```

And `web/vite.config.ts` builds the React app into:

```ts
build: {
  outDir: '../internal/web/dist',
  emptyOutDir: true,
  sourcemap: true,
}
```

So the deployed frontend is a Vite SPA embedded in Go. The previous design added an imagined `/assets/rag-dsl.css` and dynamic Goja-rendered HTML pages without specifying how that coexists with the embedded SPA, routing, frontend build, and API client. That needs an explicit integration plan.

### 2.5 It did not classify widgets by renderability

Not every component should be exposed at the same DSL layer. Components fall into categories:

| Category | Examples | DSL strategy |
|---|---|---|
| Pure presentational | `Panel`, `Stack`, `Inline`, `Caption`, `StatusText` | Safe to expose directly |
| Data display | `DataTable`, `MetadataGrid`, `CoveragePanel` | Expose with serializable schemas |
| Stateful form controls | `SearchControlsPanel`, `IdentityBar` | Expose as controlled widgets with action descriptors |
| Data-fetching / hook widgets | `DocumentInspector` artifacts tab | Prefer page recipe + React-owned data fetching |
| Application pages | `SearchWorkbenchPage`, `CorpusExplorerView` | Expose as route/page recipes, not primitive constructors |

The prior design listed all widgets uniformly. Implementation should not.

### 2.6 It proposed function-valued cell renderers without a serialization boundary

`DataTable.tsx` uses function-valued cells:

```tsx
export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'start' | 'end' | 'center';
  maxWidth?: number | string;
}
```

The previous DSL copied this shape:

```javascript
rag.dataTable({
  columns: [
    {id: "title", header: "Title", cell: (row) => row.title},
  ],
  rows: documents,
})
```

That is fine if the DSL renders immediately inside Goja. It is not fine if the output must cross into React as JSON. Functions cannot be serialized. A revised design needs a **cell renderer vocabulary**, not arbitrary JavaScript closures, unless rendering stays entirely in Goja.

Example better column spec:

```json
{
  "id": "status",
  "header": "Status",
  "align": "start",
  "cell": {"kind": "statusText", "field": "status", "icon": true}
}
```

### 2.7 It was too confident about “exact same DOM”

The phrase “exact same CSS classes, `data-rag-*` attributes, and structural nesting” sounds good, but exact DOM parity is expensive. The real goal is **behavioral and visual parity**. Exact DOM parity should only be required in tests for small presentational components. Complex components should be rendered by React itself, not manually duplicated.

---

## 3. What Would Have Helped Them to Know

### 3.1 CSS Modules are not normal class names

The intern should know that this line:

```tsx
className={styles.root}
```

does not mean the final DOM class is literally `root`. It becomes a generated class name managed by Vite. That one fact changes the whole architecture. A Go-side renderer cannot just emit `Panel_root` and expect the existing React CSS to apply.

### 3.2 React components are not just HTML macros

Some components embed behavior:

- local state (`useState`)
- derived UI state
- event callbacks
- API hooks
- clipboard calls
- conditional rendering
- browser dispatch events

A DSL for those components needs a runtime model, not just HTML generation.

### 3.3 The existing frontend already has a renderer and a build system

The SPA is not incidental. It is the canonical renderer. If we want “use the widgets and primitives in `web/`,” the most literal and maintainable approach is to let React render them.

### 3.4 DSL design needs a serialization boundary decision first

Before naming DSL functions, decide what they return:

1. HTML string?
2. `uidsl.Node` tree?
3. JSON Widget IR?
4. React component tree via SSR?
5. Route/page registration metadata?

The previous work did not make that decision explicitly enough. My recommendation is **Widget IR first**, optional SSR later.

### 3.5 Data ownership matters

Widgets like `SearchControlsPanel` and `DocumentInspector` are connected to API state. The DSL should not duplicate all RTK Query logic. It should either:

- emit a page recipe that the React app hydrates and owns, or
- emit a static snapshot view with no live data fetching.

Those are different product modes and should be named separately.

---

## 4. Revised Architecture

### 4.1 Recommended model: Widget IR rendered by React

```text
┌──────────────────────────────────────────────────────────────┐
│ Goja script                                                   │
│                                                              │
│ const rag = require("widget.dsl")                            │
│ module.exports = () => rag.page(...widgets...)                │
└───────────────────────────┬──────────────────────────────────┘
                            │ returns
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ Widget IR                                                     │
│                                                              │
│ {                                                            │
│   type: "DashboardGrid",                                     │
│   props: { recipe: "searchWorkbench" },                      │
│   children: [ ... ]                                           │
│ }                                                            │
└───────────────────────────┬──────────────────────────────────┘
                            │ served as JSON by Go
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ React WidgetRenderer                                          │
│                                                              │
│ registry.Panel = Panel                                        │
│ registry.DataTable = DataTable                                │
│ registry.StatusText = StatusText                              │
│ registry.DocumentBrowser = DocumentBrowser                    │
└───────────────────────────┬──────────────────────────────────┘
                            │ renders
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ Existing React components                                     │
│                                                              │
│ CSS Modules, event handling, hooks, accessibility preserved   │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Server routes

Add DSL API routes, not dynamic HTML routes initially:

```text
GET  /api/v1/dsl/pages                  list registered DSL pages
GET  /api/v1/dsl/pages/{id}             returns Widget IR for one page
POST /api/v1/dsl/actions/{actionName}   action dispatch target
```

The existing SPA continues to serve `/`. Add a React route/view that fetches Widget IR:

```text
/dsl/:pageId  → React page that calls GET /api/v1/dsl/pages/:pageId
```

This respects the current server order:

```go
api.RegisterHandlersWithOptions(mux, database, opts)
mux.Handle("/", web.SPAHandler())
```

### 4.3 Widget IR shape

Use a small JSON-compatible schema:

```ts
export type WidgetNode =
  | TextNode
  | ElementNode
  | ComponentNode;

export interface TextNode {
  kind: 'text';
  text: string;
}

export interface ElementNode {
  kind: 'element';
  tag: string;
  attrs?: Record<string, unknown>;
  children?: WidgetNode[];
}

export interface ComponentNode {
  kind: 'component';
  type: RagComponentType;
  props?: Record<string, unknown>;
  children?: WidgetNode[];
}
```

Example IR:

```json
{
  "kind": "component",
  "type": "Panel",
  "props": {"title": "Search", "density": "condensed"},
  "children": [
    {
      "kind": "component",
      "type": "Stack",
      "props": {"gap": "sm"},
      "children": [
        {"kind": "component", "type": "TextInput", "props": {"placeholder": "Enter query…"}},
        {"kind": "component", "type": "Button", "props": {"variant": "primary"}, "children": [{"kind": "text", "text": "Search"}]}
      ]
    }
  ]
}
```

### 4.4 Goja DSL returns Widget IR, not HTML

Goja script:

```javascript
const rag = require("widget.dsl");

exports.page = function(ctx) {
  return rag.appShell({
    header: rag.appNav({
      brand: "◉ RAG Eval",
      activeItemId: "search",
      items: [
        {id: "search", label: "Search"},
        {id: "corpus", label: "Corpus"},
        {id: "workflows", label: "Workflows"},
      ],
    }),
  },
    rag.dashboardGrid({recipe: "searchWorkbench"},
      rag.searchControls({
        query: ctx.query.q || "",
        retriever: "hybrid",
        action: "search.perform",
      }),
      rag.retrievalResults({items: [], emptyHint: "Enter a query and press Search."})
    )
  );
};
```

Returned JSON:

```json
{
  "kind": "component",
  "type": "AppShell",
  "props": {"header": {"kind": "component", "type": "AppNav", "props": {...}}},
  "children": [...]
}
```

### 4.5 React WidgetRenderer

```tsx
import { Button, TextInput, SelectInput } from './components/atoms';
import { Panel, Stack, Inline, DashboardGrid } from './components/layout';
import { DataTable, MetadataGrid, CoveragePanel, AppNav } from './components/molecules';

const registry = {
  Button,
  TextInput,
  SelectInput,
  Panel,
  Stack,
  Inline,
  DashboardGrid,
  DataTable: DataTableRenderer,
  MetadataGrid: MetadataGridRenderer,
  CoveragePanel,
  AppNav: AppNavRenderer,
};

export function WidgetRenderer({ node }: { node: WidgetNode }): React.ReactNode {
  if (node.kind === 'text') return node.text;
  if (node.kind === 'element') return renderElement(node);

  const Component = registry[node.type];
  if (!Component) return <ErrorCallout>Unknown widget: {node.type}</ErrorCallout>;

  const props = hydrateProps(node.type, node.props ?? {});
  const children = node.children?.map((child, i) => <WidgetRenderer key={i} node={child} />);
  return <Component {...props}>{children}</Component>;
}
```

### 4.6 Why this is better than Go-side HTML mimicry

| Concern | Go-side HTML mimicry | Widget IR + React renderer |
|---|---|---|
| CSS Modules | Must duplicate or extract class names | Uses real CSS Modules automatically |
| Component drift | High risk | Low risk; same components render |
| Stateful components | Must reimplement in JS/Go | React owns state |
| Accessibility | Must duplicate ARIA behavior | Reuses component implementation |
| DataTable cells | JS functions render HTML | Typed renderer vocabulary in React |
| Testability | DOM snapshots only | Component-level tests + IR tests |
| Implementation complexity | Looks easy first, grows hard | More upfront structure, safer long-term |

---

## 5. Revised DSL Surface

### 5.1 Keep the semantic vocabulary from the previous doc

The names were mostly good:

```javascript
rag.button(...)
rag.textInput(...)
rag.caption(...)
rag.statusText(...)
rag.panel(...)
rag.stack(...)
rag.inline(...)
rag.dashboardGrid(...)
rag.dataTable(...)
rag.metadataGrid(...)
rag.searchControls(...)
rag.retrievalResults(...)
rag.documentBrowser(...)
rag.workflowList(...)
```

But their implementation changes: each returns a `ComponentNode`.

```javascript
function component(type, props, children) {
  return { kind: "component", type, props: props || {}, children: flatten(children) };
}

exports.panel = (props, ...children) => component("Panel", props, children);
exports.stack = (props, ...children) => component("Stack", props, children);
exports.button = (props, ...children) => component("Button", props, children);
```

### 5.2 DataTable needs serializable cell renderers

Do not allow arbitrary JavaScript functions in IR. Define a constrained cell renderer schema:

```ts
export type CellSpec =
  | { kind: 'field'; field: string; fallback?: string }
  | { kind: 'number'; field: string; format?: 'integer' | 'fixed'; digits?: number }
  | { kind: 'status'; field: string; icon?: boolean }
  | { kind: 'caption'; field: string; tone?: CaptionTone }
  | { kind: 'template'; template: string }
  | { kind: 'link'; hrefField: string; labelField: string; target?: string }
  | { kind: 'component'; node: WidgetNode };
```

DSL example:

```javascript
rag.dataTable({
  rows: documents,
  getRowKey: {field: "id"},
  columns: [
    {id: "title", header: "Title", cell: rag.cell.field("title"), maxWidth: 300},
    {id: "words", header: "Words", align: "end", cell: rag.cell.number("word_count", {format: "integer"})},
    {id: "status", header: "Status", cell: rag.cell.status("status")},
  ],
})
```

React implementation:

```tsx
function renderCell(spec: CellSpec, row: any): React.ReactNode {
  switch (spec.kind) {
    case 'field': return String(get(row, spec.field) ?? spec.fallback ?? '');
    case 'number': return formatNumber(get(row, spec.field), spec);
    case 'status': return <StatusText status={String(get(row, spec.field))} icon={spec.icon}>{String(get(row, spec.field))}</StatusText>;
    case 'caption': return <Caption tone={spec.tone}>{String(get(row, spec.field) ?? '')}</Caption>;
    case 'link': return <a href={String(get(row, spec.hrefField) ?? '#')} target={spec.target}>{String(get(row, spec.labelField) ?? '')}</a>;
  }
}
```

### 5.3 Actions need an explicit action descriptor

Instead of `onClick: "search"`, use an action object:

```json
{
  "type": "Button",
  "props": {
    "variant": "primary",
    "action": {"kind": "server", "name": "search.perform", "payload": {"form": "search-controls"}}
  }
}
```

TypeScript:

```ts
export type ActionSpec =
  | { kind: 'navigate'; to: string; params?: Record<string, unknown> }
  | { kind: 'server'; name: string; payload?: Record<string, unknown> }
  | { kind: 'event'; event: string; detail?: Record<string, unknown> }
  | { kind: 'copy'; value?: string; field?: string };
```

React hydration:

```tsx
function hydrateAction(action?: ActionSpec): (() => void) | undefined {
  if (!action) return undefined;
  return () => dispatchWidgetAction(action);
}
```

### 5.4 Separate low-level layout widgets from page recipes

Low-level widgets:

```javascript
rag.panel(...)
rag.dataTable(...)
rag.metadataGrid(...)
```

Page recipes:

```javascript
rag.pages.searchWorkbench({...})
rag.pages.corpusExplorer({...})
rag.pages.workflowDashboard({...})
```

This matters because an intern should not manually assemble `SearchControlsPanel` every time. Page recipes encode common layouts and API conventions.

---

## 6. Implementation Guide for a New Intern

### Step 1: Add shared Widget IR TypeScript types

Create:

```text
web/src/widgets/ir.ts
```

Sketch:

```ts
export type WidgetNode = TextNode | ElementNode | ComponentNode;

export interface TextNode {
  kind: 'text';
  text: string;
}

export interface ElementNode {
  kind: 'element';
  tag: string;
  attrs?: Record<string, unknown>;
  children?: WidgetNode[];
}

export interface ComponentNode {
  kind: 'component';
  type: string;
  props?: Record<string, unknown>;
  children?: WidgetNode[];
}

export interface ActionSpec {
  kind: 'navigate' | 'server' | 'event' | 'copy';
  name?: string;
  to?: string;
  event?: string;
  payload?: Record<string, unknown>;
}
```

Validation:

```bash
cd 2026-05-27--rag-evaluation-system/web
pnpm typecheck
```

### Step 2: Implement the React WidgetRenderer

Create:

```text
web/src/widgets/WidgetRenderer.tsx
web/src/widgets/cellRenderers.tsx
web/src/widgets/actions.ts
```

Start with only the safe layer:

- `Button`
- `TextInput`
- `Caption`
- `StatusText`
- `Panel`
- `Stack`
- `Inline`
- `MetadataGrid`

Do not start with `DocumentInspector`. That is too complex.

Pseudocode:

```tsx
const registry: Record<string, React.ComponentType<any>> = {
  Button,
  TextInput,
  Caption,
  StatusText,
  Panel,
  Stack,
  Inline,
  MetadataGrid: MetadataGridFromIR,
};

export function WidgetRenderer({node}: {node: WidgetNode}) {
  switch (node.kind) {
    case 'text': return node.text;
    case 'element': return React.createElement(node.tag, sanitizeAttrs(node.attrs), renderChildren(node.children));
    case 'component': return renderComponent(node);
  }
}
```

### Step 3: Add a demo route in React

Because this app currently uses state-based view switching in `App.tsx`, the simplest first integration is a new view ID:

```tsx
const views = [
  { id: 'search', label: 'Search' },
  { id: 'corpus', label: 'Corpus' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'dsl', label: 'DSL' },
];
```

Add:

```tsx
case 'dsl':
  return <DslPreviewPage pageId="demo" />;
```

Create:

```text
web/src/components/pages/DslPreviewPage/DslPreviewPage.tsx
```

This page fetches:

```text
GET /api/v1/dsl/pages/demo
```

and renders:

```tsx
<WidgetRenderer node={data.root} />
```

### Step 4: Add Go API endpoint for static demo IR

Before Goja is involved, add a hardcoded endpoint:

```go
mux.HandleFunc("GET /api/v1/dsl/pages/demo", h.handleDslDemoPage)
```

Return JSON:

```json
{
  "id": "demo",
  "root": {
    "kind": "component",
    "type": "Panel",
    "props": {"title": "DSL Demo", "density": "condensed"},
    "children": [
      {"kind": "component", "type": "Caption", "props": {"tone": "success"}, "children": [{"kind":"text", "text":"Rendered by WidgetRenderer"}]}
    ]
  }
}
```

This proves the React renderer path before adding Goja.

### Step 5: Add Goja widget.dsl module returning IR

Create:

```text
internal/dsl/widgetdsl/module.go
```

A minimal Go native module can expose functions that return Go maps:

```go
func Loader(vm *goja.Runtime, moduleObj *goja.Object) {
    exports := moduleObj.Get("exports").(*goja.Object)
    _ = exports.Set("text", func(s string) map[string]any {
        return map[string]any{"kind": "text", "text": s}
    })
    _ = exports.Set("component", func(componentType string, props map[string]any, children ...goja.Value) map[string]any {
        return map[string]any{
            "kind": "component",
            "type": componentType,
            "props": props,
            "children": exportChildren(children),
        }
    })
    _ = exports.Set("panel", func(props map[string]any, children ...goja.Value) map[string]any {
        return component("Panel", props, children...)
    })
}
```

Then add ergonomic helpers:

```go
exports.Set("button", makeComponent("Button"))
exports.Set("caption", makeComponent("Caption"))
exports.Set("statusText", makeComponent("StatusText"))
exports.Set("stack", makeComponent("Stack"))
exports.Set("panel", makeComponent("Panel"))
```

### Step 6: Execute Goja page scripts server-side

Create:

```text
internal/dsl/runner.go
```

The runner:

1. creates a Goja runtime,
2. registers `widget.dsl`,
3. registers safe data helpers (not raw DB at first),
4. loads a script from `plugins/dsl/*.js`,
5. calls `exports.page(ctx)`,
6. serializes the returned IR as JSON.

Pseudocode:

```go
func (r *Runner) RenderPage(ctx context.Context, pageID string, req PageRequest) (*PageResponse, error) {
    script, err := r.loadScript(pageID)
    if err != nil { return nil, err }

    vm := goja.New()
    reg := require.NewRegistry()
    widgetdsl.Register(reg)
    reg.Enable(vm)

    if _, err := vm.RunString(script); err != nil { return nil, err }
    exports := getModuleExports(vm)
    pageFn, ok := goja.AssertFunction(exports.Get("page"))
    if !ok { return nil, fmt.Errorf("page script must export page(ctx)") }

    result, err := pageFn(goja.Undefined(), vm.ToValue(req))
    if err != nil { return nil, err }

    return decodeWidgetIR(result.Export())
}
```

### Step 7: Add one real page recipe

Start with `workflowList`, because it is simpler than corpus inspector.

Script:

```javascript
const rag = require("widget.dsl");
const data = require("rag.data");

exports.page = function(ctx) {
  const workflows = data.workflows.list({status: ctx.query.status || ""});
  return rag.workflowList({
    workflows,
    total: workflows.length,
    statusFilter: ctx.query.status || "",
    actions: {
      onStatusFilterChange: {kind: "navigate", to: "/dsl/workflows", payload: {status: "$value"}},
      onSelect: {kind: "navigate", to: "/dsl/workflows/$workflowId"}
    }
  });
};
```

### Step 8: Test against the actual component DOM

Add tests at two levels.

**TypeScript test** for renderer:

```tsx
it('renders Panel from Widget IR', () => {
  render(<WidgetRenderer node={{kind:'component', type:'Panel', props:{title:'Hello'}, children:[text('Body')]}} />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
  expect(screen.getByText('Body')).toBeInTheDocument();
});
```

**Playwright test** for full stack:

```ts
test('DSL demo page renders through React registry', async ({page}) => {
  await page.goto('http://127.0.0.1:8772/');
  await page.getByRole('button', {name: 'DSL'}).click();
  await expect(page.locator('[data-rag-layout="Panel"]')).toBeVisible();
  await expect(page.getByText('Rendered by WidgetRenderer')).toBeVisible();
});
```

---

## 7. What I Would Do Differently

### 7.1 I would not start with CSS extraction

The previous design makes CSS extraction a major pillar. I would avoid that entirely for v1 by rendering real React components. CSS extraction only becomes relevant if we later add server-side static HTML rendering.

### 7.2 I would not expose complex hook-based widgets first

Start with pure widgets:

1. `Caption`
2. `StatusText`
3. `Button`
4. `Panel`
5. `Stack`
6. `Inline`
7. `MetadataGrid`
8. `DataTable` with simple field cells

Only after that should we expose:

- `SearchControlsPanel`
- `DocumentBrowser`
- `WorkflowListPanel`
- `DocumentInspector`

### 7.3 I would define schemas before implementation

The intern should write `web/src/widgets/ir.ts` before any Goja work. If we cannot express the UI as a TypeScript type, we do not understand the DSL boundary yet.

### 7.4 I would build a static demo before dynamic Goja

Hardcoded JSON → React renderer is the smallest useful vertical slice. It validates the hardest architectural decision first.

### 7.5 I would treat Goja as an authoring language, not as the UI runtime

Goja should produce IR. The browser's React runtime should render. This keeps responsibilities clean.

---

## 8. Review Summary: Scorecard

| Area | Prior work score | Notes |
|---|---:|---|
| Recognizing Kanban was only an example | 8/10 | Corrected quickly after feedback |
| Component inventory | 8/10 | Read many real files and captured useful props |
| CSS understanding | 5/10 | Found the issue but chose a duplicate-CSS solution too early |
| React architecture understanding | 4/10 | Underestimated state, hooks, callbacks, and RTK Query |
| Serialization boundary | 3/10 | Function-valued cell renderers cannot cross JSON cleanly |
| Implementation plan | 5/10 | Good file structure idea, wrong rendering target |
| Intern onboarding value | 7/10 | Useful as catalog, needs this review to avoid wrong implementation path |

The core recommendation: keep the **semantic widget DSL vocabulary**, replace the **Go-side HTML mimicry renderer** with a **Widget IR + React component registry renderer**.

---

## 9. Bottom Line for the Intern

If you are the intern implementing this, do not begin by writing `rag.panel()` in Go that returns raw HTML. Begin by writing the Widget IR schema and the React `WidgetRenderer`.

Your first milestone should be:

```text
Hardcoded JSON Widget IR → React WidgetRenderer → real <Panel> and <Caption> on screen
```

Your second milestone should be:

```text
Goja widget.dsl script → Widget IR JSON endpoint → React WidgetRenderer
```

Only after those work should you think about data-bound page recipes or server actions.

The good instinct from the previous work was naming the DSL after real RAG widgets. The missing architectural insight was that **the renderer already exists**. Use it.
