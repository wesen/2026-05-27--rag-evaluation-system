---
Title: RAG Widget DSL Design — Component-to-HTML Mapping
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
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/atoms/Button/Button.tsx
      Note: Button atom with variant, size, selected props
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/atoms/TextInput/TextInput.tsx
      Note: TextInput atom extending HTML input
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/atoms/SelectInput/SelectInput.tsx
      Note: SelectInput atom extending HTML select
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/layout/Stack/Stack.tsx
      Note: Stack layout with gap and align props
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/layout/Inline/Inline.tsx
      Note: Inline layout with gap, justify, wrap props
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/layout/Panel/Panel.tsx
      Note: Panel layout with title, actions, density, fill props
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/layout/DashboardGrid/DashboardGrid.tsx
      Note: DashboardGrid with recipe prop for layout patterns
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/layout/TabList/TabList.tsx
      Note: TabList with items, activeId, onChange props
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/layout/FormRow/FormRow.tsx
      Note: FormRow with label, control, hint props
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/layout/ScrollRegion/ScrollRegion.tsx
      Note: ScrollRegion with axis prop
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/molecules/DataTable/DataTable.tsx
      Note: Generic typed DataTable with columns, rows, selection
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/molecules/MetadataGrid/MetadataGrid.tsx
      Note: MetadataGrid with key-value items and copy button
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/molecules/CoveragePanel/CoveragePanel.tsx
      Note: CoveragePanel combining Panel, MetadataGrid, DataTable, StatusText
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/molecules/AppNav/AppNav.tsx
      Note: AppNav with brand, items, activeItemId props
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/foundation/StatusText/StatusText.tsx
      Note: StatusText with status enum and icon support
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/foundation/Caption/Caption.tsx
      Note: Caption with tone, transform, truncate props
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/organisms/SearchControlsPanel/SearchControlsPanel.tsx
      Note: Complex organism combining Panel, Stack, FormRow, TextInput, Button, CheckboxRow
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/organisms/RetrievalResultsPanel/RetrievalResultsPanel.tsx
      Note: RetrievalResultsPanel with DataTable and conditional columns
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/corpus/DocumentBrowser/DocumentBrowser.tsx
      Note: DocumentBrowser with search, DataTable, pagination
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/corpus/DocumentInspector/DocumentInspector.tsx
      Note: DocumentInspector with TabList, MetadataGrid, DataTable, coverage visualization
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/corpus/IdentityBar/IdentityBar.tsx
      Note: IdentityBar with form inputs for embedding identity
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/organisms/WorkflowListPanel/WorkflowListPanel.tsx
      Note: WorkflowListPanel with status filter and DataTable
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/organisms/WorkflowSummaryPanel/WorkflowSummaryPanel.tsx
      Note: WorkflowSummaryPanel with ProgressBar, MetadataGrid, action buttons
    - Path: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/layout/AppShell/AppShell.tsx
      Note: AppShell root layout with header, sidebar, main
ExternalSources: []
Summary: Detailed design for a RAG-specific widget DSL that maps each React component to a JavaScript constructor producing identical HTML structure and CSS classes via ui.dsl.
LastUpdated: 2026-06-02T22:00:00-04:00
WhatFor: Define the exact DSL API surface for every widget in the RAG system so JavaScript authors can generate pages identical to the React SPA.
WhenToUse: When implementing the widget.dsl native module, when authoring Goja scripts that render RAG dashboards, or when adding new widgets to the DSL.
---

# RAG Widget DSL Design — Component-to-HTML Mapping

## Executive Summary

The RAG Evaluation System has a rich React component library with 30+ widgets organized in atomic-design layers. This document specifies a **RAG Widget DSL** (`widget.dsl` or `rag.dsl`) that exposes every component as a JavaScript constructor. Each constructor builds an HTML AST via the underlying `ui.dsl` module, producing DOM that uses the **exact same CSS classes, `data-rag-*` attributes, and structural nesting** as the React components.

The DSL is not a generic HTML builder. It is a **semantic widget builder**: `rag.panel()`, `rag.dataTable()`, `rag.corpusExplorer()` — each knows the RAG component's props, CSS module class names, and accessibility attributes.

This document is organized as:
1. **Principles** — How React props map to DSL arguments
2. **CSS Architecture** — How CSS Modules are replicated in static CSS
3. **Layer-by-Layer DSL API** — Every widget with its props, rendered HTML, and example calls
4. **Page Recipes** — Complete page examples using only the DSL
5. **Implementation Plan** — Go module structure for wiring the DSL into the server

---

## Part 1: Design Principles

### 1.1 One-to-One Component Mapping

Every React component has a corresponding DSL function:

| React Component | DSL Function | Module |
|----------------|--------------|--------|
| `Button` | `rag.button(...)` | Atoms |
| `TextInput` | `rag.textInput(...)` | Atoms |
| `Stack` | `rag.stack(...)` | Layout |
| `Panel` | `rag.panel(...)` | Layout |
| `DataTable` | `rag.dataTable(...)` | Molecules |
| `CoveragePanel` | `rag.coveragePanel(...)` | Molecules |
| `SearchControlsPanel` | `rag.searchControls(...)` | Organisms |
| `DocumentBrowser` | `rag.documentBrowser(...)` | Corpus |

### 1.2 Props Become Attribute Maps

React props map to the first argument of each DSL function — an options object:

```javascript
// React:
<Button variant="primary" size="compact" onClick={handleClick}>Search</Button>

// DSL:
rag.button({variant: "primary", size: "compact", onClick: "handleClick"}, "Search")
```

Event handlers are serialized as `data-action` references. The browser runtime dispatches them.

### 1.3 CSS Classes Are Hard-Coded

Each DSL function emits the exact class names from the React component's CSS Module:

```javascript
// Panel emits:
// <section class="Panel_root Panel_fill" data-rag-layout="Panel">
//   <div class="Panel_header"><span>Title</span><div class="Panel_actions">...</div></div>
//   <div class="Panel_body">...</div>
// </section>
```

The static CSS file `rag-dsl.css` is a concatenation of all `*.module.css` files with their hash suffixes stripped, or a new unified stylesheet with stable BEM-style class names.

### 1.4 Data Attributes for Component Identity

Every widget emits `data-rag-component`, `data-rag-layout`, `data-rag-atom`, or `data-rag-foundation` to match the React component's `data-rag-*` attributes. This enables:
- CSS targeting without class collision
- Browser runtime detection ("find all `data-rag-component="DataTable"`")
- Testing and verification

### 1.5 Children Are DSL Nests

Where React uses JSX children, the DSL uses positional arguments:

```javascript
rag.panel({title: "Search"},
  rag.stack({gap: "sm"},
    rag.formRow({label: "Query", control: rag.textInput({placeholder: "Enter query..."})}),
    rag.button({variant: "primary"}, "Search")
  )
)
```

### 1.6 Tables Use Column Definitions

`rag.dataTable()` accepts a column definition array and a row array, matching the React `DataTableColumn<T>` pattern:

```javascript
rag.dataTable({
  columns: [
    {id: "title", header: "Title", cell: (row) => row.title},
    {id: "words", header: "Words", align: "end", cell: (row) => row.word_count},
  ],
  rows: documents,
  getRowKey: (row) => row.id,
})
```

Cell renderers are JavaScript functions that receive a row object and return DSL nodes.

---

## Part 2: CSS Architecture for DSL Output

### 2.1 The Problem

React components use CSS Modules (`Button.module.css`, `Panel.module.css`). The generated class names are hashed (e.g., `Button_root__a3f7`). The DSL cannot generate these hashes because they are build-time artifacts.

### 2.2 Solution: Stable BEM Class Names

The DSL emits stable class names that match the CSS Module source names:

```css
/* From Button.module.css → rag-dsl.css */
.Button_root { /* base styles */ }
.Button_primary { /* primary variant */ }
.Button_selected { /* selected state */ }
.Button_compact { /* compact size */ }
.Button_normal { /* normal size */ }
```

The build pipeline for the DSL CSS:
1. Extract all `*.module.css` files from `web/src/components/`
2. Strip the hash suffixes from class names, replace with BEM prefix (`ComponentName_`)
3. Concatenate into a single `rag-dsl.css`
4. Serve as a static asset

### 2.3 Alternative: CSS Custom Properties

The RAG system already uses `web/src/styles/tokens.css` with CSS custom properties. The DSL CSS can reference these tokens:

```css
:root {
  --rag-color-ink: #0d0d0d;
  --rag-color-paper: #fbfbfa;
  --rag-color-soft: #f2f2ef;
  --rag-color-muted: #666;
  --rag-color-line: #111;
  --rag-font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --rag-gap-xs: 4px;
  --rag-gap-sm: 8px;
  --rag-gap-md: 16px;
  --rag-gap-lg: 24px;
  --rag-gap-xl: 32px;
}
```

All component CSS uses these tokens, making theme changes possible from a single CSS file.

### 2.4 Layout Recipes

`DashboardGrid` has three recipes mapped to CSS grids:

```css
.DashboardGrid_root { display: grid; gap: var(--rag-gap-md); }
.DashboardGrid_searchWorkbench { grid-template-columns: 280px 1fr; }
.DashboardGrid_corpusExplorer { grid-template-columns: 240px 1fr 320px; }
.DashboardGrid_twoColumn { grid-template-columns: 1fr 1fr; }
```

---

## Part 3: Layer-by-Layer DSL API

### 3.0 Root Page Constructor

```javascript
rag.page({title: string}, ...children)
```

Wraps children in `ui.page()` plus the RAG stylesheet link:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{title}}</title>
  <link rel="stylesheet" href="/assets/rag-dsl.css">
</head>
<body>
  {{children}}
</body>
</html>
```

### 3.1 Atoms

#### `rag.button(options, label)`

**Props (options map)**:
- `variant`: `"default" | "primary"` — default `"default"`
- `size`: `"normal" | "compact"` — default `"normal"`
- `selected`: `boolean` — default `false`
- `disabled`: `boolean` — passed through to `<button>`
- `type`: `"button" | "submit"` — default `"button"`
- `onClick`: `string` — action reference for browser runtime
- `className`: `string` — additional classes

**Rendered HTML**:

```html
<button type="button"
  class="Button_root Button_default Button_normal"
  data-rag-atom="Button">
  {{label}}
</button>
```

**Example**:

```javascript
rag.button({variant: "primary", size: "compact"}, "▶ Search")
```

---

#### `rag.textInput(options)`

**Props**:
- `placeholder`: `string`
- `value`: `string`
- `type`: `"text" | "number" | "password"` — default `"text"`
- `name`: `string`
- `className`: `string`

**Rendered HTML**:

```html
<input type="text"
  class="TextInput_root"
  data-rag-atom="TextInput"
  placeholder="Enter query…" />
```

**Example**:

```javascript
rag.textInput({placeholder: "Enter query…", value: query, name: "q"})
```

---

#### `rag.selectInput(options, ...optionsList)`

**Props**:
- `value`: `string`
- `name`: `string`
- `className`: `string`

**Children**: `rag.option({value, selected}, label)` nodes

**Rendered HTML**:

```html
<select class="SelectInput_root" data-rag-atom="SelectInput" name="status">
  <option value="">all</option>
  <option value="pending">pending</option>
  <option value="running">running</option>
</select>
```

**Example**:

```javascript
rag.selectInput({name: "status"},
  rag.option({value: ""}, "all"),
  rag.option({value: "pending"}, "pending"),
  rag.option({value: "running"}, "running")
)
```

---

#### `rag.checkboxRow(options, label)`

**Props**:
- `checked`: `boolean`
- `name`: `string`
- `onChange`: `string` — action reference

**Rendered HTML**:

```html
<label class="CheckboxRow_root" data-rag-atom="CheckboxRow">
  <input type="checkbox" checked />
  <span class="CheckboxRow_label">{{label}}</span>
</label>
```

---

#### `rag.iconButton(options, icon)`

**Props**:
- `label`: `string` — `aria-label`
- `onClick`: `string` — action reference

**Rendered HTML**:

```html
<button type="button"
  class="IconButton_root"
  data-rag-atom="IconButton"
  aria-label="Close">
  ✕
</button>
```

---

#### `rag.errorCallout(options, ...children)`

**Props**:
- `className`: `string`

**Rendered HTML**:

```html
<div class="ErrorCallout_root {{className}}" data-rag-atom="ErrorCallout">
  {{children}}
</div>
```

---

### 3.2 Foundation

#### `rag.caption(options, text)`

**Props**:
- `tone`: `"muted" | "accent" | "success" | "warning" | "danger" | "inherit"` — default `"muted"`
- `transform`: `"none" | "uppercase"` — default `"none"`
- `truncate`: `boolean` — default `false`

**Rendered HTML**:

```html
<span class="Caption_root Caption_toneMuted" data-rag-foundation="Caption">
  {{text}}
</span>
```

**Example**:

```javascript
rag.caption({tone: "success"}, "1500 docs")
rag.caption({transform: "uppercase"}, "Retriever")
```

---

#### `rag.statusText(options, text)`

**Props**:
- `status`: `"pending" | "ready" | "running" | "succeeded" | "done" | "partial" | "warning" | "failed" | "error" | "canceled"`
- `icon`: `boolean` — default `false`

**Rendered HTML**:

```html
<span class="StatusText_root StatusText_running" data-rag-foundation="StatusText">
  {{icon ? '● ' : ''}}{{text}}
</span>
```

**Status-to-icon mapping**:
- `pending`: `◌`
- `running`: `●`
- `succeeded` / `done`: `✔`
- `partial`: `◐`
- `warning`: `⚠`
- `failed` / `error`: `✘`
- `canceled`: `⊘`

**Example**:

```javascript
rag.statusText({status: "running", icon: true}, "running")
```

---

#### `rag.codeText(options, text)`

**Props**:
- `className`: `string`

**Rendered HTML**:

```html
<code class="CodeText_root" data-rag-foundation="CodeText">{{text}}</code>
```

---

#### `rag.text(options, text)`

**Props**:
- `size`: `"inherit" | "xs" | "sm" | "md" | "lg" | "xl"` — default `"inherit"`

**Rendered HTML**:

```html
<span class="Text_root Text_md" data-rag-foundation="Text">{{text}}</span>
```

---

#### `rag.divider(options)`

**Rendered HTML**:

```html
<hr class="Divider_root" data-rag-foundation="Divider" />
```

---

### 3.3 Layout

#### `rag.appShell(options, ...children)`

**Props**:
- `header`: `Node` — top navigation bar
- `sidebar`: `Node` — optional side panel

**Rendered HTML**:

```html
<div class="AppShell_root" data-rag-layout="AppShell">
  <header class="AppShell_header">{{header}}</header>
  <div class="AppShell_body">
    <aside class="AppShell_sidebar">{{sidebar}}</aside>
    <main class="AppShell_main">{{children}}</main>
  </div>
</div>
```

**Example**:

```javascript
rag.appShell({header: rag.appNav({...})},
  rag.dashboardGrid({recipe: "searchWorkbench"}, ...)
)
```

---

#### `rag.stack(options, ...children)`

**Props**:
- `gap`: `"xs" | "sm" | "md" | "lg" | "xl"` — default `"md"`
- `align`: `"stretch" | "start" | "center" | "end"` — default `"stretch"`
- `className`: `string`

**Rendered HTML**:

```html
<div class="Stack_root Stack_gapMd Stack_alignStretch" data-rag-layout="Stack">
  {{children}}
</div>
```

---

#### `rag.inline(options, ...children)`

**Props**:
- `gap`: `"xs" | "sm" | "md" | "lg"` — default `"sm"`
- `justify`: `"start" | "between" | "end"` — default `"start"`
- `wrap`: `boolean` — default `true`
- `className`: `string`

**Rendered HTML**:

```html
<div class="Inline_root Inline_gapSm Inline_justifyStart Inline_wrap" data-rag-layout="Inline">
  {{children}}
</div>
```

---

#### `rag.panel(options, ...children)`

**Props**:
- `title`: `Node | string`
- `actions`: `Node`
- `density`: `"normal" | "condensed"` — default `"normal"`
- `fill`: `boolean` — default `false`
- `className`: `string`

**Rendered HTML**:

```html
<section class="Panel_root {{fill ? 'Panel_fill' : ''}} {{className}}"
  data-rag-layout="Panel">
  <div class="Panel_header">
    <span>{{title}}</span>
    <div class="Panel_actions">{{actions}}</div>
  </div>
  <div class="{{density === 'condensed' ? 'Panel_condensed' : 'Panel_body'}}">
    {{children}}
  </div>
</section>
```

**Example**:

```javascript
rag.panel({
  title: "Search",
  actions: rag.caption({tone: "muted"}, "BM25"),
  density: "condensed"
},
  rag.stack({gap: "sm"},
    rag.formRow({label: "Query", control: rag.textInput({placeholder: "Enter query…"})}),
    rag.button({variant: "primary"}, "▶")
  )
)
```

---

#### `rag.dashboardGrid(options, ...children)`

**Props**:
- `recipe`: `"searchWorkbench" | "corpusExplorer" | "twoColumn"` — default `"twoColumn"`
- `className`: `string`

**Rendered HTML**:

```html
<div class="DashboardGrid_root DashboardGrid_twoColumn" data-rag-layout="DashboardGrid" data-rag-layout-recipe="twoColumn">
  {{children}}
</div>
```

**Example**:

```javascript
rag.dashboardGrid({recipe: "searchWorkbench"},
  rag.panel({title: "Search Controls"}, ...),   /* left column, 280px */
  rag.panel({title: "Results", fill: true}, ...) /* right column, 1fr */
)
```

---

#### `rag.tabList(options)`

**Props**:
- `items`: `Array<{id: string, label: string}>`
- `activeId`: `string`
- `ariaLabel`: `string` — default `"Tabs"`

**Rendered HTML**:

```html
<div class="TabList_root" role="tablist" aria-label="Document inspector tabs" data-rag-layout="TabList">
  <button type="button" role="tab" aria-selected="true" class="TabList_item TabList_active">overview</button>
  <button type="button" role="tab" aria-selected="false" class="TabList_item">text</button>
  <button type="button" role="tab" aria-selected="false" class="TabList_item">chunks</button>
</div>
```

**Note**: Tab switching is handled by the browser runtime. Each tab panel is wrapped in a `data-tab-id` container.

**Example**:

```javascript
rag.tabList({
  items: [
    {id: "overview", label: "overview"},
    {id: "text", label: "text"},
    {id: "chunks", label: "chunks"},
  ],
  activeId: "overview",
})
```

---

#### `rag.formRow(options)`

**Props**:
- `label`: `Node | string`
- `control`: `Node` — the input element
- `hint`: `Node | string` — optional help text
- `className`: `string`

**Rendered HTML**:

```html
<div class="FormRow_root {{className}}" data-rag-layout="FormRow">
  <div class="FormRow_label">{{label}}</div>
  <div class="FormRow_control">{{control}}</div>
  <div class="FormRow_hint">{{hint}}</div>
</div>
```

**Example**:

```javascript
rag.formRow({
  label: "BM25 Index",
  control: rag.textInput({placeholder: "Index ID"}),
})
```

---

#### `rag.scrollRegion(options, ...children)`

**Props**:
- `axis`: `"y" | "x" | "both"` — default `"y"`
- `style`: `object` — inline styles (e.g., `{maxHeight: "570px"}`)
- `className`: `string`

**Rendered HTML**:

```html
<div class="ScrollRegion_root ScrollRegion_y {{className}}" data-rag-layout="ScrollRegion" style="max-height: 570px;">
  {{children}}
</div>
```

---

### 3.4 Molecules

#### `rag.dataTable(options)`

**Props**:
- `columns`: `Array<{id, header, align?, maxWidth?, cell: function}>`
- `rows`: `Array<any>`
- `getRowKey`: `(row) => string` — unique row identifier
- `selectedKey`: `string | null`
- `onRowSelect`: `string` — action reference
- `emptyMessage`: `Node | string`
- `className`: `string`

**Rendered HTML**:

```html
<table class="DataTable_root {{className}}" data-rag-component="DataTable">
  <thead>
    <tr>
      <th class="DataTable_start" style="max-width: 300px;">Title</th>
      <th class="DataTable_end">Words</th>
    </tr>
  </thead>
  <tbody>
    <tr class="DataTable_selectable {{selected ? 'DataTable_selected' : ''}}" data-row-key="doc-1">
      <td class="DataTable_start" style="max-width: 300px;">Research campsites</td>
      <td class="DataTable_end">1,234</td>
    </tr>
  </tbody>
</table>
```

**Example**:

```javascript
rag.dataTable({
  columns: [
    {id: "title", header: "Title", maxWidth: 300, cell: (r) => r.title},
    {id: "words", header: "Words", align: "end", cell: (r) => r.word_count.toLocaleString()},
    {id: "status", header: "Status", cell: (r) => rag.statusText({status: r.status}, r.status)},
  ],
  rows: documents,
  getRowKey: (r) => r.id,
  selectedKey: selectedDocId,
  onRowSelect: "selectDocument",
  emptyMessage: "No documents found.",
})
```

---

#### `rag.metadataGrid(options)`

**Props**:
- `items`: `Array<{key, value, copyValue?}>`
- `density`: `"normal" | "compact"` — default `"normal"`
- `className`: `string`
- `onCopy`: `string` — action reference for copy button

**Rendered HTML**:

```html
<dl class="MetadataGrid_root {{density === 'compact' ? 'MetadataGrid_compact' : ''}}" data-rag-component="MetadataGrid">
  <div class="MetadataGrid_row">
    <dt class="MetadataGrid_key">ID</dt>
    <dd class="MetadataGrid_value">
      doc-42
      <button type="button" class="MetadataGrid_copyButton" data-copy-value="doc-42">⧉</button>
    </dd>
  </div>
</dl>
```

**Example**:

```javascript
rag.metadataGrid({
  density: "compact",
  items: [
    {key: "ID", value: doc.id, copyValue: doc.id},
    {key: "Source", value: doc.source_id},
    {key: "Words", value: doc.word_count.toLocaleString()},
    {key: "Status", value: rag.statusText({status: doc.status}, doc.status)},
  ],
})
```

---

#### `rag.coveragePanel(options)`

**Props**:
- `coverage`: `object` — `{total_chunks, embedded_chunks, sources: [...]}`
- `coveragePct`: `number`

**Rendered HTML**:

This is a composite widget. It renders a `Panel` containing:
1. A `MetadataGrid` with totals
2. A `DataTable` of per-source coverage
3. An optional warning callout if coverage < 50%

```html
<section class="Panel_root CoveragePanel" data-rag-component="CoveragePanel">
  <div class="Panel_header">
    <span>Coverage</span>
    <div class="Panel_actions">
      <span class="StatusText_root StatusText_done">87%</span>
    </div>
  </div>
  <div class="Panel_condensed">
    <dl class="MetadataGrid_root MetadataGrid_compact">...</dl>
    <table class="DataTable_root">...</table>
  </div>
</section>
```

**Example**:

```javascript
rag.coveragePanel({
  coverage: {
    total_chunks: 45000,
    embedded_chunks: 44800,
    sources: [
      {source_id: "wiki", source_name: "Wikipedia", total_chunks: 30000, embedded_chunks: 30000, coverage_pct: 100},
      {source_id: "arxiv", source_name: "ArXiv", total_chunks: 15000, embedded_chunks: 14800, coverage_pct: 98.7},
    ],
  },
  coveragePct: 99.6,
})
```

---

#### `rag.appNav(options)`

**Props**:
- `brand`: `Node | string`
- `items`: `Array<{id, label}>`
- `activeItemId`: `string`

**Rendered HTML**:

```html
<nav class="AppNav_root" aria-label="Primary" data-rag-component="AppNav">
  <span class="AppNav_brand">◉ RAG Eval</span>
  <button type="button" class="AppNav_item AppNav_active" aria-current="page">Search</button>
  <button type="button" class="AppNav_item">Corpus</button>
  <button type="button" class="AppNav_item">Workflows</button>
</nav>
```

**Example**:

```javascript
rag.appNav({
  brand: "◉ RAG Eval",
  items: [
    {id: "search", label: "Search"},
    {id: "corpus", label: "Corpus"},
    {id: "workflows", label: "Workflows"},
  ],
  activeItemId: "search",
})
```

---

### 3.5 Organisms

#### `rag.searchControls(options)`

**Props**:
- `query`: `string`
- `retriever`: `"bm25" | "vector" | "hybrid"`
- `indexId`: `string`
- `strategyId`: `string`
- `profile`: `string`
- `limit`: `number`
- `candidateLimit`: `number`
- `previewRunes`: `number`
- `sources`: `Array<{source_id, source_name}>`
- `selectedSourceIds`: `Array<string>`
- `onSearch`: `string` — action reference
- `className`: `string`

**Rendered HTML**:

This renders a `Panel` with `title="Search"` and `density="condensed"`. Inside, a `Stack` with:
1. Query row (TextInput + primary Button)
2. Retriever toggle buttons (3 `Button` elements)
3. Conditional FormRow for BM25 Index
4. Conditional Stack for Vector fields
5. Source filter CheckBoxes in ScrollRegion
6. Limit FormRow

Every interactive element gets `data-action` and `data-field` attributes for the browser runtime.

**Example**:

```javascript
rag.searchControls({
  query: "neural networks",
  retriever: "hybrid",
  indexId: "default-bm25",
  strategyId: "fixed-500",
  profile: "ollama-nomic",
  limit: 20,
  candidateLimit: 200,
  previewRunes: 120,
  sources: [
    {source_id: "wiki", source_name: "Wikipedia"},
    {source_id: "arxiv", source_name: "ArXiv"},
  ],
  selectedSourceIds: ["wiki"],
  onSearch: "performSearch",
})
```

---

#### `rag.retrievalResults(options)`

**Props**:
- `items`: `Array<RetrievalResult>`
- `retriever`: `"bm25" | "vector" | "hybrid"`
- `query`: `string`
- `selectedResult`: `object | null`
- `searchError`: `string | null`
- `isLoading`: `boolean`
- `onSelectResult`: `string` — action reference
- `emptyHint`: `string`
- `className`: `string`

**Rendered HTML**:

A `Panel` with `fill` containing a `ScrollRegion`. Inside:
- Optional `ErrorCallout`
- Empty state `Caption`
- `DataTable` with conditional columns for hybrid mode (`bm25` and `vector` component columns)

**Example**:

```javascript
rag.retrievalResults({
  items: results,
  retriever: "hybrid",
  query: "neural networks",
  selectedResult: null,
  searchError: null,
  isLoading: false,
  onSelectResult: "inspectResult",
  emptyHint: "Enter a query and press Search.",
})
```

---

#### `rag.workflowList(options)`

**Props**:
- `workflows`: `Array<WorkflowListItem>`
- `total`: `number`
- `statusFilter`: `string`
- `onStatusFilterChange`: `string`
- `onSelect`: `string`
- `isLoading`: `boolean`

**Rendered HTML**:

A `Panel` with title `Workflows ({{total}})`, actions containing a `SelectInput` for status filter, and a `ScrollRegion` containing a `DataTable`.

**Example**:

```javascript
rag.workflowList({
  workflows: wfList,
  total: 42,
  statusFilter: "",
  onStatusFilterChange: "filterWorkflows",
  onSelect: "openWorkflow",
})
```

---

#### `rag.workflowSummary(options)`

**Props**:
- `workflow`: `object` — workflow metadata
- `strategyId`: `string`
- `docCount`: `number`
- `totalOps`: `number`
- `succeededCount`: `number`
- `runningCount`: `number`
- `pendingCount`: `number`
- `failedCount`: `number`
- `isRunning`: `boolean`
- `onBack`: `string`
- `onCancel`: `string`
- `onNavigateToCorpus`: `string`

**Rendered HTML**:

A `Panel` with:
1. Title = workflow ID
2. Actions = `StatusText` + back button
3. A `ProgressBar` div with CSS percentage segments
4. A `MetadataGrid` with stats
5. Conditional cancel button
6. Conditional "View in Corpus" button

**Example**:

```javascript
rag.workflowSummary({
  workflow: {ID: "wf-001", Status: "running", CreatedAt: "2026-06-02T10:00:00Z"},
  strategyId: "fixed-500",
  docCount: 150,
  totalOps: 8,
  succeededCount: 3,
  runningCount: 4,
  pendingCount: 1,
  failedCount: 0,
  isRunning: true,
  onBack: "backToList",
  onCancel: "cancelWorkflow",
})
```

---

### 3.6 Corpus Widgets

#### `rag.documentBrowser(options)`

**Props**:
- `documents`: `Array<CorpusDocumentRow>`
- `sourceName`: `string | null`
- `totalDocs`: `number`
- `selectedDocId`: `string`
- `onSelectDocument`: `string`
- `onLoadMore`: `string`
- `hasMore`: `boolean`
- `className`: `string`

**Rendered HTML**:

A `Panel` with title and actions. Contains:
1. `TextInput` for local title/ID filtering
2. `ScrollRegion` with:
   - Empty state `Caption`
   - `DataTable` with columns: Title, Words, Chunks, Embed status, Status
   - Optional "Load more" `Button`

**Example**:

```javascript
rag.documentBrowser({
  documents: docList,
  sourceName: "Wikipedia",
  totalDocs: 1500,
  selectedDocId: "doc-42",
  onSelectDocument: "inspectDocument",
  onLoadMore: "loadMoreDocs",
  hasMore: true,
})
```

---

#### `rag.documentInspector(options)`

**Props**:
- `document`: `object` — document metadata
- `chunks`: `Array<CorpusChunk>`
- `identity`: `CorpusIdentityArgs`
- `activeTab`: `"overview" | "text" | "chunks" | "coverage" | "artifacts"`
- `artifacts`: `Array<DocumentProcessingArtifact>`
- `highlightChunkId`: `string | null`
- `className`: `string`

**Rendered HTML**:

A composite widget with:
1. `TabList` for view switching
2. `ScrollRegion` containing one of:
   - **Overview**: `MetadataGrid` + metadata sections
   - **Text**: content text display
   - **Chunks**: `ChunkTimelineBar` + `DataTable` + selected chunk detail
   - **Coverage**: coverage stats + dot strip + missing chunks table
   - **Artifacts**: `DataTable` + `ArtifactDetail` panel

**Example**:

```javascript
rag.documentInspector({
  document: doc,
  chunks: chunkList,
  identity: {strategy_id: "fixed-500", provider_type: "ollama", model: "nomic-embed-text", dimensions: 768},
  activeTab: "chunks",
  artifacts: artifactList,
})
```

---

#### `rag.identityBar(options)`

**Props**:
- `identity`: `CorpusIdentityArgs`
- `strategies`: `Array<{id}>`
- `totals`: `{totalDocs, totalChunks, totalEmbedded}`
- `onChange`: `string` — action reference

**Rendered HTML**:

A `Panel` with title "Embedding Identity" and `density="condensed"`. Inside an `Inline` gap="md" containing:
1. `FormRow` label="Strategy" control=`SelectInput`
2. `FormRow` label="Provider" control=`TextInput`
3. `FormRow` label="Model" control=`TextInput`
4. `FormRow` label="Dims" control=`TextInput` type="number"
5. `Caption` showing totals

**Example**:

```javascript
rag.identityBar({
  identity: {strategy_id: "fixed-500", provider_type: "ollama", model: "nomic-embed-text", dimensions: 768},
  strategies: [{id: "fixed-500"}, {id: "semantic-512"}],
  totals: {totalDocs: 1500, totalChunks: 45000, totalEmbedded: 44800},
  onChange: "updateIdentity",
})
```

---

## Part 4: Page Recipes — Complete DSL Examples

### 4.1 Search Workbench Page

This recreates the React `SearchWorkbenchPage` using only DSL calls:

```javascript
const ui = require("ui.dsl");
const rag = require("widget.dsl");
const db = require("database");

function searchWorkbenchPage(ctx) {
  const sources = db.query("SELECT id, name FROM sources ORDER BY name");
  const selectedSources = ctx.query?.sources ? ctx.query.sources.split(",") : [];

  return rag.page({title: "Search — RAG Evaluation System"},
    rag.appShell({
      header: rag.appNav({
        brand: "◉ RAG Eval",
        items: [
          {id: "search", label: "Search"},
          {id: "corpus", label: "Corpus"},
          {id: "workflows", label: "Workflows"},
        ],
        activeItemId: "search",
      }),
    },
      rag.dashboardGrid({recipe: "searchWorkbench"},
        rag.panel({title: "Search", density: "condensed"},
          rag.stack({gap: "sm"},
            rag.formRow({
              label: "Query",
              control: rag.textInput({
                placeholder: "Enter query…",
                value: ctx.query?.q || "",
                name: "q",
              }),
            }),
            rag.inline({gap: "sm"},
              rag.button({variant: "primary"}, "▶ Search"),
              rag.button({}, "Clear"),
            ),
            rag.caption({transform: "uppercase"}, "Retriever"),
            rag.inline({gap: "sm"},
              rag.button({selected: true}, "bm25"),
              rag.button({}, "vector"),
              rag.button({}, "hybrid"),
            ),
            rag.caption({transform: "uppercase"}, "Source Filter"),
            rag.scrollRegion({axis: "y", style: {maxHeight: "200px"}},
              ...sources.map(s =>
                rag.checkboxRow({
                  checked: selectedSources.includes(s.id),
                  name: "sources",
                }, s.name)
              )
            ),
            rag.formRow({
              label: "Limit",
              control: rag.textInput({type: "number", value: 20, name: "limit"}),
            }),
          )
        ),
        rag.panel({title: "Results", fill: true},
          rag.scrollRegion({axis: "y", style: {height: "100%"}},
            rag.caption({}, "Enter a query and press Search.")
          )
        )
      )
    )
  );
}
```

### 4.2 Corpus Explorer Page

```javascript
function corpusExplorerPage(ctx) {
  const identity = {
    strategy_id: ctx.query?.strategy_id || "fixed-500",
    provider_type: ctx.query?.provider_type || "ollama",
    model: ctx.query?.model || "nomic-embed-text",
    dimensions: Number(ctx.query?.dimensions) || 768,
  };

  const sources = db.query(`
    SELECT s.id, s.name, COUNT(d.id) as doc_count,
           COUNT(c.id) as chunk_count,
           COUNT(e.chunk_id) as embedded_count
    FROM sources s
    LEFT JOIN documents d ON d.source_id = s.id
    LEFT JOIN chunks c ON c.document_id = d.id
    LEFT JOIN embeddings e ON e.chunk_id = c.id
    GROUP BY s.id
  `);

  const totalDocs = sources.reduce((s, src) => s + (src.doc_count || 0), 0);
  const totalChunks = sources.reduce((s, src) => s + (src.chunk_count || 0), 0);
  const totalEmbedded = sources.reduce((s, src) => s + (src.embedded_count || 0), 0);

  const selectedSource = ctx.query?.source_id || (sources[0]?.id || "");
  const documents = selectedSource
    ? db.query("SELECT * FROM documents WHERE source_id = ? ORDER BY updated_at DESC LIMIT 100", selectedSource)
    : [];

  return rag.page({title: "Corpus — RAG Evaluation System"},
    rag.appShell({
      header: rag.appNav({brand: "◉ RAG Eval", items: [...], activeItemId: "corpus"}),
    },
      rag.dashboardGrid({recipe: "corpusExplorer"},
        /* Left column: Source panel */
        rag.panel({title: "Sources", density: "condensed"},
          rag.dataTable({
            columns: [
              {id: "name", header: "Source", cell: (s) => s.name},
              {id: "docs", header: "Docs", align: "end", cell: (s) => s.doc_count || 0},
              {id: "chunks", header: "Chunks", align: "end", cell: (s) => s.chunk_count || 0},
            ],
            rows: sources,
            getRowKey: (s) => s.id,
            selectedKey: selectedSource,
            onRowSelect: "selectSource",
          })
        ),
        /* Middle column: Document browser */
        rag.documentBrowser({
          documents: documents,
          sourceName: sources.find(s => s.id === selectedSource)?.name || null,
          totalDocs: totalDocs,
          selectedDocId: ctx.query?.doc_id || "",
          onSelectDocument: "inspectDocument",
          onLoadMore: "loadMoreDocs",
          hasMore: documents.length >= 100,
        }),
        /* Right column: Inspector or coverage */
        rag.identityBar({
          identity: identity,
          strategies: [{id: "fixed-500"}, {id: "semantic-512"}],
          totals: {totalDocs, totalChunks, totalEmbedded},
        })
      )
    )
  );
}
```

### 4.3 Workflow List Page

```javascript
function workflowListPage(ctx) {
  const statusFilter = ctx.query?.status || "";
  const where = statusFilter ? "WHERE status = ?" : "";
  const args = statusFilter ? [statusFilter] : [];

  const workflows = db.query(`
    SELECT w.id, w.status, w.name, w.created_at,
           COUNT(o.id) as op_total,
           SUM(CASE WHEN o.status = 'succeeded' THEN 1 ELSE 0 END) as op_done
    FROM workflows w
    LEFT JOIN workflow_ops o ON o.workflow_id = w.id
    ${where}
    GROUP BY w.id
    ORDER BY w.created_at DESC
  `, ...args);

  return rag.page({title: "Workflows — RAG Evaluation System"},
    rag.appShell({
      header: rag.appNav({brand: "◉ RAG Eval", items: [...], activeItemId: "workflows"}),
    },
      rag.workflowList({
        workflows: workflows.map(w => ({
          workflow: {ID: w.id, Status: w.status, Name: w.name, CreatedAt: w.created_at, Metadata: null},
          opTotal: w.op_total || 0,
          opDone: w.op_done || 0,
        })),
        total: workflows.length,
        statusFilter: statusFilter,
        onStatusFilterChange: "filterWorkflows",
        onSelect: "openWorkflow",
      })
    )
  );
}
```

---

## Part 5: Implementation Plan

### 5.1 Go Module Structure

```
internal/dsl/
├── widgetdsl/
│   ├── module.go          — Register widget.dsl native module
│   ├── atoms.go           — button, textInput, selectInput, checkboxRow, iconButton, errorCallout
│   ├── foundation.go      — caption, statusText, codeText, text, divider
│   ├── layout.go          — appShell, stack, inline, panel, dashboardGrid, tabList, formRow, scrollRegion
│   ├── molecules.go        — dataTable, metadataGrid, coveragePanel, appNav, queryPresetList
│   ├── organisms.go        — searchControls, retrievalResults, workflowList, workflowSummary
│   └── corpus.go           — documentBrowser, documentInspector, identityBar
├── css/
│   └── extractor.go       — Build rag-dsl.css from *.module.css
└── handler.go             — HTTP handler for DSL-rendered pages
```

### 5.2 Each DSL Function Implementation Pattern

```go
// internal/dsl/widgetdsl/atoms.go
package widgetdsl

import (
    "github.com/dop251/goja"
    "github.com/go-go-golems/go-go-goja/modules/uidsl"
)

func buildButton(vm *goja.Runtime, call goja.FunctionCall) goja.Value {
    opts := extractOpts(call, 0)
    label := extractChildren(call, 1)

    variant := getString(opts, "variant", "default")
    size := getString(opts, "size", "normal")
    selected := getBool(opts, "selected", false)
    disabled := getBool(opts, "disabled", false)
    btnType := getString(opts, "type", "button")
    action := getString(opts, "onClick", "")

    classes := []string{"Button_root"}
    if variant == "primary" { classes = append(classes, "Button_primary") }
    if selected { classes = append(classes, "Button_selected") }
    if size == "compact" { classes = append(classes, "Button_compact") } else { classes = append(classes, "Button_normal") }

    attrs := map[string]any{
        "type": btnType,
        "class": strings.Join(classes, " "),
        "data-rag-atom": "Button",
    }
    if disabled { attrs["disabled"] = true }
    if action != "" { attrs["data-action"] = action }

    return vm.ToValue(&uidsl.Element{
        Tag: "button",
        Attrs: uidsl.Attrs(attrs),
        Children: []uidsl.Node{&uidsl.Text{Value: label}},
    })
}
```

### 5.3 CSS Extraction

```go
// internal/dsl/css/extractor.go
package css

import (
    "path/filepath"
    "regexp"
    "strings"
)

// ExtractRagCSS reads all *.module.css files in web/src/components/
// and produces a stable-class CSS string for DSL output.
func ExtractRagCSS(webSrcDir string) (string, error) {
    // 1. Find all *.module.css files
    // 2. For each file, strip hash suffixes: .root__a3f7 → .ComponentName_root
    // 3. Prepend BEM prefix from filename: Button.module.css → .Button_root
    // 4. Concatenate into single stylesheet
}
```

### 5.4 HTTP Integration

```go
// internal/dsl/handler.go
package dsl

import (
    "database/sql"
    "net/http"
    "github.com/dop251/goja"
    "github.com/dop251/goja_nodejs/require"
    "github.com/go-go-golems/go-go-goja/engine"
    "github.com/go-go-golems/rag-evaluation-system/internal/dsl/widgetdsl"
)

func Register(mux *http.ServeMux, database *sql.DB) error {
    reg := require.NewRegistry()
    widgetdsl.Register(reg)

    mux.HandleFunc("GET /_dsl/{script}", func(w http.ResponseWriter, r *http.Request) {
        scriptName := r.PathValue("script")
        // Load and execute script from plugins/ or scripts/ directory
        // Render result as HTML
    })

    mux.HandleFunc("GET /assets/rag-dsl.css", func(w http.ResponseWriter, r *http.Request) {
        css, err := widgetdsl.ExtractCSS()
        if err != nil { http.Error(w, err.Error(), 500); return }
        w.Header().Set("Content-Type", "text/css")
        w.Write([]byte(css))
    })

    return nil
}
```

---

## Part 6: Decision Records

### DR-1: Use stable BEM class names instead of CSS Module hashes

**Context**: React CSS Modules generate hashes at build time. The DSL runs at request time and cannot reproduce hashes.

**Decision**: Map each CSS Module to stable BEM class names: `Button_root`, `Panel_fill`, etc.

**Rationale**: Predictable, debuggable, and the DSL output can be matched to a single static CSS file.

**Consequences**: Requires a build step to extract and rename CSS, or manual maintenance of `rag-dsl.css`.

**Status**: Proposed.

### DR-2: Action handlers are string references, not inline JS

**Context**: React uses closures for `onClick`. The DSL generates static HTML.

**Decision**: Action handlers are `data-action="actionName"` attributes. A browser runtime dispatches them.

**Rationale**: Keeps HTML declarative, avoids inline scripts, enables server-side caching.

**Consequences**: Requires a small browser JavaScript runtime to wire actions.

**Status**: Proposed.

### DR-3: Composite widgets are monolithic DSL functions

**Context**: `SearchControlsPanel` is a complex composite of 6+ sub-widgets.

**Decision**: Provide `rag.searchControls()` as a single function rather than forcing users to manually compose Stack, FormRow, TextInput, etc.

**Rationale**: Matches the React component API, reduces boilerplate, ensures consistent structure.

**Consequences**: More Go code to maintain, less flexibility for layout variants.

**Status**: Proposed.

---

## Part 7: Open Questions

1. **CSS extraction automation**: Should we write a Go tool that walks `web/src/components/` and auto-generates `rag-dsl.css`, or maintain it manually?
2. **Form handling**: Should `formRow` emit a `<form>` wrapper, or should forms be explicit `rag.form()` wrappers?
3. **Client runtime size**: How much JavaScript is needed for tab switching, row selection, and action dispatch? Can it be under 5KB?
4. **Image/asset handling**: The React app has `public/icons.svg`. How does the DSL reference these?
5. **Dynamic data loading**: Should the DSL support `hx-boost`-style partial updates, or only full-page reloads?
6. **Accessibility parity**: Can we maintain the same ARIA attributes and keyboard navigation patterns as the React components?
