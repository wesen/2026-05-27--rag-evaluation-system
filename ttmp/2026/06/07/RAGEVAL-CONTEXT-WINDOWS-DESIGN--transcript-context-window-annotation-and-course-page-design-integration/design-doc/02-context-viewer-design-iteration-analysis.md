---
Title: Context Viewer Design Iteration Analysis
Ticket: RAGEVAL-CONTEXT-WINDOWS-DESIGN
Status: active
Topics:
    - design-system
    - frontend-architecture
    - react
    - rag
    - ui-dsl
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/rag-evaluation-site/src/widgets/ir.ts
      Note: Current Widget IR API surface referenced by the analysis
    - Path: pkg/widgetdsl/module.go
      Note: Current Goja widget.dsl module and recipe surface referenced by the analysis
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/03-context-viewer-design-iteration/app.jsx
      Note: Prototype shell
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/03-context-viewer-design-iteration/diagrams.jsx
      Note: Strip
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/03-context-viewer-design-iteration/ds.jsx
      Note: Prototype design-system primitives to compare against existing React components
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/03-context-viewer-design-iteration/patterns.jsx
      Note: Context-window kind vocabulary
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/03-context-viewer-design-iteration/screens2.jsx
      Note: Handout markdown renderer and annotated transcript screen
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/03-context-viewer-design-iteration/screens3.jsx
      Note: Anchored comment variants and slide viewer
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/03-context-viewer-design-iteration/styles.css
      Note: Updated Classic Mac token set
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/04-context-viewer-source-map.md
      Note: Extracted function/token/source map for the context-viewer prototype
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/index.md
      Note: Source corpus index explaining recovered docs and context-viewer zip contents
    - Path: web/README.md
      Note: Frontend entrypoint that points contributors to the recovered design-system glossary and context-viewer analysis
ExternalSources: []
Summary: Analysis-first intern guide for understanding the context-viewer design iteration, how it relates to the existing RAG React design system and Widget IR stack, and what concepts are candidates for integration.
LastUpdated: 2026-06-07T00:00:00Z
WhatFor: Use before implementation to understand the updated design-system work and its integration surface.
WhenToUse: Before planning or coding transcript, context-window, annotation, course, or Widget DSL changes.
---



# Context Viewer Design Iteration Analysis

## Executive Summary

This document analyzes the new `context-viewer.zip` design iteration as source material for future RAG Evaluation System UI work. It is intentionally **analysis-first**: the goal is to understand what the prototype contains, what is new relative to the existing design system, and how its concepts might eventually integrate without breaking the current `web/` app or the newer `packages/rag-evaluation-site` Widget IR package.

The prototype is a complete browser-only React sketch called **Context Window Studio**. It includes a Classic Mac OS-inspired shell, a course landing page, slide deck, context-window visualizer, JSON upload workflow, annotated transcript reader, diagram commenting workflow, and handout/download screen. It also includes a mini design-system layer (`ds.jsx` + `styles.css`), a context-window diagram language (`patterns.jsx` + `diagrams.jsx`), and sample data (`data.jsx`, `data2.jsx`).

The most important conclusion is that the prototype is **not production architecture**, but it is strong **product and interaction architecture**. It uses global scripts, inline styles, CDN React/Babel, `window` exports, and local state. Those implementation choices should not be copied directly. The ideas should be promoted into the existing layered system:

```text
Current RAG design-system layers:
  tokens → foundation → atoms → layout → molecules → organisms → pages → containers

Current Widget DSL layers:
  Goja widget.dsl → JSON Widget IR → React WidgetRenderer → component library

Context Viewer concept layers:
  context-window DTOs → diagram adapters → diagram renderer molecules
  transcript DTOs → transcript/annotation organisms → transcript page
  comment DTOs → anchored annotation/comment organisms → review page
  course DTOs → lesson/slide/handout organisms → course page
```

The prototype also proposes a typography adjustment worth preserving: body text moves from the current very compact `12px/1.45` style toward `13px/1.5`, compact text moves from `11px/1.4` to `12px/1.4`, metric text moves from `12px` to `13px`, and code moves from `11px/1.45` to `12px/1.5`. The result is still dense and retro, but less cramped and more readable for course/transcript material.

## Source Corpus

The managed source bundle lives in:

- `ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/`

Start with:

- `sources/index.md` — index of all copied and unpacked sources.
- `sources/01-recovered-design-docs.md` — catalog of prior recovered docs.
- `sources/02-recovered-documents/` — local copies of the relevant prior docs.
- `sources/03-context-viewer-design-iteration/` — unpacked `~/Downloads/context-viewer.zip`.
- `sources/04-context-viewer-source-map.md` — extracted source map of functions, constants, tokens, and CSS classes.

The most important current references copied into `02-recovered-documents/` are:

1. `01-styling-and-design-reference.md`
2. `02-widget-hierarchy-and-interaction-reference.md`
3. `03-widget-dsl-visual-quality-analysis-and-implementation-guide.md`
4. `04-widgetrenderer-packaging-architecture-and-implementation-guide.md`
5. `05-rag-react-design-system-guidelines.md`
6. `06-review-and-revised-implementation-guide-for-the-rag-widget-dsl.md`

These define the existing rules that the new work must respect.

## Current System Primer for an Intern

### The existing `web/` design system

The original RAG frontend lives under `web/src`. Its design-system structure is already close to a standard layered React architecture:

```text
web/src/styles/tokens.css
web/src/components/foundation/*
web/src/components/atoms/*
web/src/components/layout/*
web/src/components/molecules/*
web/src/components/organisms/*
web/src/components/pages/*
web/src/components/corpus/*
web/src/components/workflows/*
```

The key rule from the recovered guidelines is ownership:

- **Tokens** own raw values and semantic aliases.
- **Foundation** owns typography, status text, captions, dividers, code text, and accessibility primitives.
- **Atoms** own basic controls such as buttons and inputs.
- **Layout** owns spacing, panels, stacks, tabs, grids, shells, and scroll regions.
- **Molecules** own reusable data-display patterns such as nav, tables, metadata, query presets, and coverage.
- **Organisms** own feature panels with domain-shaped props.
- **Pages** compose organisms into storyable page boundaries.
- **Containers** own data fetching, API calls, navigation, mutations, and side effects.

The current token source is `web/src/styles/tokens.css`. It defines the Classic Mac palette and role fonts:

```css
--mac-bg: #FFFFFF;
--mac-bg-dark: #000000;
--mac-text: #000000;
--mac-text-dim: #666666;
--mac-border: #000000;
--mac-surface: #FFFFFF;
--mac-surface-2: #EEEEEE;
--mac-accent: #0000CC;
--mac-accent-2: #CC0000;
--mac-green: #007722;
--mac-amber: #AA7700;

--rag-font-role-body: 400 12px/1.45 var(--font-body);
--rag-font-role-compact: 400 11px/1.4 var(--font-body);
--rag-font-role-metadata: 400 11px/1.35 var(--font-mono);
--rag-font-role-label: 700 11px/1.2 var(--font-mono);
--rag-font-role-metric: 700 12px/1.25 var(--font-mono);
--rag-font-role-code: 400 11px/1.45 var(--font-mono);
```

### The newer packaged Widget IR system

The package frontend lives under `packages/rag-evaluation-site`. It contains a reusable renderer and component subset intended for standalone widget sites:

```text
packages/rag-evaluation-site/src/components/foundation/*
packages/rag-evaluation-site/src/components/atoms/*
packages/rag-evaluation-site/src/components/layout/*
packages/rag-evaluation-site/src/components/molecules/*
packages/rag-evaluation-site/src/widgets/ir.ts
packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx
packages/rag-evaluation-site/src/widgets/actions.ts
packages/rag-evaluation-site/src/app/App.tsx
packages/rag-evaluation-site/src/theme.css
```

The Widget IR contract in `packages/rag-evaluation-site/src/widgets/ir.ts` defines a JSON-compatible tree:

```ts
type WidgetNode = TextNode | ElementNode | ComponentNode;

interface ComponentNode {
  kind: 'component';
  type: RagWidgetType | string;
  props?: WidgetProps;
  children?: WidgetNode[];
}
```

The Goja-side authoring module lives in `pkg/widgetdsl/module.go`. It exposes helpers such as:

```js
const rag = require("widget.dsl");

rag.panel({ title: "Demo" },
  rag.caption({ tone: "success" }, "Rendered by React")
);

rag.recipes.masterDetailTable({
  rows,
  columns,
  selectedKey,
  detail: row => rag.panel({ title: "Selected" }, row.name),
});
```

The important architectural lesson from the recovered docs is: **Goja authors data; React renders UI**. We should not return to an earlier model where the DSL clones HTML and CSS classes directly.

## What the Context Viewer Prototype Contains

### File map

The unpacked prototype lives in:

- `sources/03-context-viewer-design-iteration/`

Key files:

| File | Role |
|---|---|
| `index.html` | Browser entrypoint with React UMD, ReactDOM UMD, Babel standalone, and script tags. |
| `app.jsx` | Application shell, left navigation, route state, uploaded context-window state, tweaks panel. |
| `styles.css` | Classic Mac token set and global `.mac-*` component classes. |
| `ds.jsx` | Prototype React primitives: menu bar, window, panel, button, tabs, metadata, inputs, chips. |
| `patterns.jsx` | Context-window kind vocabulary, SVG pattern definitions, legend, style modes. |
| `diagrams.jsx` | Diagram renderers: strip, stack, budget bar, treemap. |
| `data.jsx` | Context-window snapshots, adapters, transcript data, course content, handout data. |
| `data2.jsx` | Slide deck data. |
| `screens.jsx` | Landing/course, visualizer, upload screen. |
| `screens2.jsx` | Markdown handout renderer and annotated transcript screen. |
| `screens3.jsx` | Comments/review screen and slide viewer. |
| `ds-overview.jsx` | Design-system overview/demo page. |
| `tweaks-panel.jsx` | Floating tweak controls for diagram/comment variants. |

### Product surface map

The prototype has seven navigation destinations:

```text
PRESENT
  Course
  Slides
ANALYZE
  Visualize
  Upload
REVIEW
  Transcript
  Comments
TAKE-HOME
  Handout
```

This is a meaningful product taxonomy. It frames context-window work as a full learning and analysis environment rather than a single utility screen.

### Data model in the prototype

The central domain object is a context-window snapshot:

```ts
type ContextWindowSnapshot = {
  id: string;
  title: string;
  sub?: string;
  limit: number;
  parts: ContextWindowPart[];
};

type ContextWindowPart = {
  label: string;
  kind: ContextPartKind;
  tokens: number;
  note?: string;
};

type ContextPartKind =
  | 'system'
  | 'context'
  | 'summary'
  | 'result'
  | 'generated'
  | 'evicted'
  | 'active'
  | 'empty'
  | 'overflow';
```

The prototype then derives each visualization from the same snapshot:

```js
function adapt(cw, view) {
  if (view === "strip") return toStrip(cw);
  if (view === "stack") return toStack(cw);
  if (view === "budget") return toBudget(cw);
  if (view === "treemap") return toTreemap(cw);
  return toStrip(cw);
}
```

This is a strong pattern. It should be preserved: the model should not store four different diagram shapes. It should store one canonical context-window DTO and derive views from it.

## Detailed Analysis of the Updated Design Iteration

### 1. Visual language: still Classic Mac, but more readable

The prototype keeps the existing Classic Mac OS monochrome identity:

- black/white surfaces;
- 1px black borders;
- square corners;
- striped title bars;
- compact metadata text;
- thin panel headers;
- blue/red/green/amber semantic accents;
- bit-pattern fills for diagrams.

The notable change is typography. Compared with `web/src/styles/tokens.css`, the prototype's `styles.css` uses:

```css
--font-display: 'Chicago', 'Geneva', 'Helvetica Neue', Arial, sans-serif;
--rag-font-role-body: 400 13px/1.5 var(--font-body);
--rag-font-role-compact: 400 12px/1.4 var(--font-body);
--rag-font-role-metric: 700 13px/1.25 var(--font-mono);
--rag-font-role-code: 400 12px/1.5 var(--font-mono);
```

This is a real design-system adjustment, not just local style. It matters because the new surfaces contain longer educational and transcript text than the earlier search/workflow dashboard. A `12px` body font works for dense operational tables; a course/transcript page benefits from `13px/1.5` body text and stronger display headings.

**Analysis recommendation:** treat the typography as an experimental token variant. Do not hard-code it in new components. Capture it as either updated default role tokens or a `learning/workbench` density theme.

### 2. Shell and navigation: product taxonomy is valuable, implementation is prototype-only

`app.jsx` wraps every screen in a desktop background, a menu bar, a `MacWindow`, and a left sidebar. The grouped navigation is one of the strongest design contributions:

```text
PRESENT: Course, Slides
ANALYZE: Visualize, Upload
REVIEW: Transcript, Comments
TAKE-HOME: Handout
```

The current production systems already have shell concepts:

- `web/src/components/layout/AppShell`
- `packages/rag-evaluation-site/src/components/layout/AppShell`
- `packages/rag-evaluation-site/src/app/App.tsx`
- `packages/rag-evaluation-site/src/components/molecules/AppNav`

The prototype's `MacWindow` and `MenuBar` are visually compelling, but they conflict with an earlier recovered design note that the RAG dashboard had “no menu bar, no window chrome” at one stage. For this new course/context studio, the chrome may be appropriate because the product metaphor is a studio/workbench. That should be treated as a design decision, not assumed globally.

**Integration concept:** the grouped navigation model can become a richer `AppNav` variant or a page-specific shell organism, but the prototype's inline shell should not replace the whole app shell directly.

### 3. Diagram language: the most important new reusable subsystem

`patterns.jsx` and `diagrams.jsx` define a coherent context-window visualization language.

The semantic `kind` map is the heart of it:

```js
const KIND = {
  empty:     { name: "free space" },
  context:   { name: "context / history" },
  system:    { name: "system / instructions" },
  summary:   { name: "summary / memory" },
  result:    { name: "tool result" },
  generated: { name: "generated / scratchpad" },
  evicted:   { name: "evicted / compressed" },
  active:    { name: "active (current)" },
  overflow:  { name: "over budget" },
};
```

The prototype supports three rendering modes:

- `pattern` — one-bit fill patterns, strongest retro identity;
- `tone` — grayscale fills, more legible at small sizes;
- `outline` — wireframe/print-friendly mode.

The four diagram renderers are:

- **Strip** — horizontal composition at a glance.
- **Stack** — ordered/layered single-call view.
- **Budget** — token usage against a fixed limit.
- **Treemap** — proportional area view of where tokens went.

This subsystem should become one or more reusable design-system molecules/organisms. It should not remain page-local JSX.

Candidate production component split:

```text
molecules/ContextKindSwatch
molecules/ContextLegend
molecules/TokenBudgetBar
molecules/ContextStripDiagram
molecules/ContextStackDiagram
molecules/ContextTreemap
organisms/ContextWindowVisualizerPanel
```

Possible typed API:

```ts
export type ContextPartKind =
  | 'system' | 'context' | 'summary' | 'result'
  | 'generated' | 'evicted' | 'active' | 'empty' | 'overflow';

export interface ContextWindowPart {
  id?: string;
  label: string;
  kind: ContextPartKind;
  tokens: number;
  note?: string;
  sourceRef?: string;
}

export interface ContextWindowSnapshot {
  id: string;
  title: string;
  subtitle?: string;
  limit: number;
  parts: ContextWindowPart[];
}

export type ContextDiagramView = 'strip' | 'stack' | 'budget' | 'treemap';
export type ContextDiagramStyle = 'pattern' | 'tone' | 'outline';

export interface ContextWindowDiagramProps {
  snapshot: ContextWindowSnapshot;
  view: ContextDiagramView;
  styleMode?: ContextDiagramStyle;
  showLegend?: boolean;
  onPartSelect?: (part: ContextWindowPart) => void;
}
```

### 4. Visualizer screen: strong master/detail pattern

The `Visualize` screen has three important patterns:

1. A snapshot selector across the top.
2. View tabs for strip/stack/budget/treemap.
3. A right inspector rail with budget readout and part breakdown.

This maps well to the current design-system vocabulary:

```text
TabList            → view switcher
Panel              → diagram container
MetadataGrid       → budget metadata
ScrollRegion       → main/rail scrolling
DataTable/List     → breakdown rows
DashboardGrid      → alternate layouts if needed
```

The main difference is domain specificity: the breakdown is not a generic table; it is a context-window part list with swatches, percentages, and token counts. That likely deserves a domain molecule.

### 5. Upload screen: useful but should become an import/parser boundary

The upload screen accepts pasted or dropped JSON with `title`, `limit`, and `parts`. This is useful as a developer/analysis workflow. The production version should separate concerns:

- parser/validator function;
- editor component;
- preview component;
- action boundary that loads the parsed snapshot into a visualizer.

Prototype pseudocode:

```js
const parsed = useMemo(() => {
  try {
    const o = JSON.parse(text);
    if (!Array.isArray(o.parts)) throw new Error("missing parts");
    validate parts;
    return { cw: normalize(o), error: null };
  } catch (e) {
    return { cw: null, error: e.message };
  }
}, [text]);
```

Production-shaped API:

```ts
export function parseContextWindowJson(input: string): Result<ContextWindowSnapshot, ParseError[]>;
export function normalizeContextWindow(input: unknown): ContextWindowSnapshot;
```

This parser can be shared by React and Widget DSL fixture tests if kept pure.

### 6. Transcript screen: the main annotation page seed

The transcript screen in `screens2.jsx` is a complete seed for the requested “full transcript / context window / annotation page”. It has:

- role-specific message cards (`user`, `assistant`, `tool`);
- token counts per message;
- cumulative token bar;
- inline note badges;
- an annotation rail;
- click-to-focus behavior linking notes and messages.

The sample `TRANSCRIPT` data suggests this DTO:

```ts
export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  name?: string;          // tool name when role === 'tool'
  text: string;
  tokens: number;
  annotation?: TranscriptAnnotation;
}

export interface TranscriptAnnotation {
  id: string;
  kind: ContextPartKind;
  label: string;
  text: string;
  targetMessageId: string;
}
```

This should likely become:

```text
molecules/TranscriptMessageCard
molecules/TranscriptTokenBar
molecules/AnnotationNoteCard
organisms/TranscriptReaderPanel
organisms/AnnotationRailPanel
pages/TranscriptWorkbenchPage
```

The key interaction pattern is synchronized selection:

```ts
const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

function selectMessage(messageId: string) {
  const annotation = annotations.find(a => a.targetMessageId === messageId);
  if (annotation) setActiveAnnotationId(annotation.id);
}

function selectAnnotation(annotationId: string) {
  setActiveAnnotationId(annotationId);
  scrollMessageIntoView(annotationsById[annotationId].targetMessageId);
}
```

### 7. Comments screen: anchored annotation variants

The comments screen in `screens3.jsx` explores three comment UI modes:

- **rail** — markers on the diagram plus comments in a right rail;
- **sticky** — notes appear near diagram anchors with connector lines;
- **popover** — active comment opens as a contextual popover.

This is an important state exploration. It should be captured in Storybook because the modes answer different use cases:

| Mode | Best for | Tradeoff |
|---|---|---|
| Rail | Review many comments and maintain stable reading order. | Spatial relationship requires marker lookup. |
| Sticky | Presentation/teaching where spatial comments matter. | Can occlude diagrams and collide on dense screens. |
| Popover | Focused single-comment editing. | Weak overview of all comments. |

Production DTO:

```ts
export interface AnchoredComment {
  id: string;
  targetId?: string;
  fx: number; // 0..1 x anchor within diagram viewport
  fy: number; // 0..1 y anchor within diagram viewport
  author: string;
  text: string;
  createdAt?: string;
}

export type CommentPresentationMode = 'rail' | 'sticky' | 'popover';
```

Potential production components:

```text
molecules/AnchoredCommentMarker
molecules/CommentCard
organisms/AnchoredCommentLayer
organisms/CommentRailPanel
organisms/DiagramReviewPanel
```

### 8. Course and slides: product narrative layer

The course landing page and slides are not just decoration. They show how the same context-window diagrams can serve educational material:

- landing hero uses a context diagram;
- agenda/outcome sections explain context-window concepts;
- slide deck presents diagram variants as teaching panels;
- handout screen renders field-guide/reference material.

The current RAG Evaluation System is mostly operational. This prototype introduces a **course/learning mode**. That matters because it may require different typography density and page rhythm than operational dashboards.

Potential production page split:

```text
pages/ContextCoursePage
pages/ContextSlidesPage
pages/ContextHandoutPage
organisms/CourseHeroPanel
organisms/CourseAgendaPanel
organisms/SlideDeckViewer
organisms/HandoutBrowserPanel
```

The handout markdown renderer is useful as a prototype, but production should probably use an existing markdown renderer or a controlled Markdown component instead of this local parser.

### 9. Tweaks panel: keep as design tooling, not product UI

`tweaks-panel.jsx` provides a floating control panel for diagram style and comment UI mode. This is useful for design exploration and Storybook controls, but should not become product UI by default.

Production interpretation:

- Use Storybook controls for `diagramStyle` and `commentUI` variants.
- Possibly expose diagram style as a user preference later.
- Do not ship the generic floating tweak panel into the main app unless a debug/design mode is explicitly required.

## Delta Against the Existing Design System

### New or changed tokens

Prototype adds/changes:

- `--font-display` using Chicago/Geneva-like display stack.
- `--mac-surface-3` for tertiary separators/fills.
- `--desktop` for stippled desktop background.
- Larger body/compact/metric/code font roles.

Existing package theme `packages/rag-evaluation-site/src/theme.css` has a standalone package token bridge with canonical `--rag-*` variables mapped into `--mac-*`. If integrating prototype typography into the package, update both:

- `web/src/styles/tokens.css`
- `packages/rag-evaluation-site/src/theme.css`

### New candidate primitives and molecules

The prototype's `ds.jsx` mostly duplicates existing components, but a few concepts are missing or need richer variants:

| Prototype concept | Existing equivalent | Analysis |
|---|---|---|
| `MenuBar` | none / shell-level only | Product-specific shell chrome; probably not global primitive. |
| `MacWindow` | `AppShell`, `Panel` | Useful for studio metaphor, but should be page shell variant. |
| `Panel` | existing `Panel` | Same concept; do not duplicate. |
| `Tabs` | `TabList` | Same concept; merge states/visual details if needed. |
| `Chip` | no clear equivalent | Candidate atom/foundation badge. |
| `SectionLabel` | `Caption` transform? | Candidate foundation text role or Caption variant. |
| `ContextLegend` | new | Needed for context diagrams. |
| `KindRect`/swatch | new | Needed as SVG/pattern primitive. |
| `TokenBudgetBar` | new | Domain molecule. |
| `TranscriptMessageCard` | new | Domain molecule. |
| `AnchoredCommentMarker` | new | Domain molecule. |

### New organisms and pages

The prototype strongly suggests four page families:

```text
ContextCoursePage
ContextVisualizerPage
TranscriptAnnotationPage
DiagramReviewPage
```

These are not just visual screens; they are conceptual product modules.

## Goja / Widget DSL Analysis

The prototype is currently normal React JSX with local data. To expose it through Goja later, we should add **semantic recipes**, not low-level SVG trees.

Bad future DSL shape:

```js
// Too low-level: asks authors to construct SVG/component internals.
rag.component("ContextStripDiagram", { segments: [...], style: {...} })
```

Better future DSL shape:

```js
const rag = require("widget.dsl");

exports.page = () => rag.recipes.contextWindowStudio({
  title: "Turn 14 — deep in the bug",
  limit: 200000,
  parts: [
    { label: "system + tools", kind: "system", tokens: 7200 },
    { label: "file reads", kind: "result", tokens: 38600 },
    { label: "current task", kind: "active", tokens: 1900 },
  ],
  views: ["strip", "stack", "budget", "treemap"],
  defaultView: "strip",
});
```

Transcript recipe sketch:

```js
exports.page = () => rag.recipes.annotatedTranscript({
  title: "Agent Session — Annotated",
  messages: [
    { id: "m1", role: "user", text: "...", tokens: 320 },
    { id: "m2", role: "assistant", text: "...", tokens: 180 },
  ],
  annotations: [
    { id: "a1", targetMessageId: "m2", kind: "context", label: "Task framing", text: "..." },
  ],
});
```

The current `pkg/widgetdsl/module.go` has recipes for `metrics`, `actionToolbar`, and `masterDetailTable`. Context-window recipes would be a natural continuation once React components exist.

## Integration Concept Map, Not Yet an Implementation Plan

The user clarified that this phase is analysis of the updated work, not a detailed integration plan. The following is therefore a concept map: it shows likely landing zones and dependencies without prescribing exact implementation order.

```text
context-viewer.zip prototype
  │
  ├─ visual tokens / typography
  │    ├─ compare with web/src/styles/tokens.css
  │    └─ compare with packages/rag-evaluation-site/src/theme.css
  │
  ├─ primitive duplicates
  │    ├─ Panel/Button/Tabs/Input → existing components
  │    └─ Chip/SectionLabel/MenuBar/MacWindow → evaluate as variants or new components
  │
  ├─ context-window diagram language
  │    ├─ promote kind vocabulary to typed domain model
  │    ├─ promote legend/swatch/budget/strip/stack/treemap to molecules
  │    └─ compose Visualizer organism/page
  │
  ├─ transcript and annotation UI
  │    ├─ promote message card/token bar/note card to molecules
  │    ├─ compose TranscriptReader + AnnotationRail organisms
  │    └─ compose TranscriptWorkbench page
  │
  ├─ anchored comments
  │    ├─ promote markers/cards/layers to molecules/organisms
  │    └─ preserve rail/sticky/popover as Storybook states
  │
  ├─ course/slides/handout
  │    ├─ analyze typography and reading density
  │    ├─ decide if these are product pages or demo/docs pages
  │    └─ reuse diagrams as teaching components
  │
  └─ Widget DSL recipes later
       ├─ contextWindowVisualizer(...)
       ├─ annotatedTranscript(...)
       ├─ diagramReview(...)
       └─ coursePage(...)
```

## Risks and Questions

### Risk: direct copying would regress architecture

The prototype has many inline styles and global classes. Direct copying would violate the recovered design-system rules. Any implementation should promote stable pieces into CSS Modules and typed React components.

### Risk: two frontend targets may diverge

There are two relevant frontend surfaces:

- `web/` — the original app with full organisms/pages and Storybook history.
- `packages/rag-evaluation-site` — the reusable package and WidgetRenderer app.

The new context-window components could live in `web/`, in the package, or both. That decision should be made after analysis, not assumed.

### Risk: Widget IR type surface can grow too fast

If every prototype detail becomes a Widget IR node immediately, the DSL becomes hard to maintain. The safer path is to stabilize React components first, then expose high-level recipes.

### Open questions

- Should the typography adjustment become the new default or a page-mode theme?
- Should `MacWindow`/`MenuBar` be product chrome for the Context Window Studio only, or a reusable shell variant?
- Should context-window diagrams be part of the package component library immediately, or start in `web/` and migrate later?
- What real backend data should feed transcripts and context-window snapshots: minitrace archives, rag-eval session data, or new explicit APIs?
- Do comments/annotations need persistence in this ticket, or only static/storybook states first?

## Recommended Next Analysis Tasks

This is not the implementation plan. These are the next analysis tasks that would make a later plan reliable:

1. Capture screenshots of every prototype screen and annotate what should become component-library material.
2. Compare prototype `styles.css` token-by-token against `web/src/styles/tokens.css` and `packages/rag-evaluation-site/src/theme.css`.
3. Build a component promotion table: prototype function → existing component → proposed layer → required props → Storybook states.
4. Decide target frontend boundary: `web/`, `packages/rag-evaluation-site`, or dual-track.
5. Define canonical DTOs for context windows, transcript messages, annotations, comments, slides, and handouts.
6. Only after those are stable, write a concrete integration plan.

## File References

Prototype sources:

- `sources/03-context-viewer-design-iteration/app.jsx`
- `sources/03-context-viewer-design-iteration/styles.css`
- `sources/03-context-viewer-design-iteration/ds.jsx`
- `sources/03-context-viewer-design-iteration/patterns.jsx`
- `sources/03-context-viewer-design-iteration/diagrams.jsx`
- `sources/03-context-viewer-design-iteration/data.jsx`
- `sources/03-context-viewer-design-iteration/screens.jsx`
- `sources/03-context-viewer-design-iteration/screens2.jsx`
- `sources/03-context-viewer-design-iteration/screens3.jsx`
- `sources/03-context-viewer-design-iteration/tweaks-panel.jsx`

Existing system references:

- `web/src/styles/tokens.css`
- `web/src/components/foundation/*`
- `web/src/components/atoms/*`
- `web/src/components/layout/*`
- `web/src/components/molecules/*`
- `web/src/components/organisms/*`
- `web/src/components/pages/*`
- `packages/rag-evaluation-site/src/theme.css`
- `packages/rag-evaluation-site/src/widgets/ir.ts`
- `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx`
- `packages/rag-evaluation-site/src/app/App.tsx`
- `pkg/widgetdsl/module.go`
- `pkg/widgetrunner/runner.go`
- `pkg/widgetserver/server.go`
