---
Title: Semantic Widget IR Component Support Implementation Guide
Ticket: RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS
Status: active
Topics:
    - frontend
    - widget-ir
    - design-system
    - rag-evaluation
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/rag-evaluation-site/GUIDELINES.md
      Note: Design-system rules for React-first and Widget IR later
    - Path: packages/rag-evaluation-site/src/context/types.ts
      Note: JSON-compatible context/transcript/course/handout DTOs
    - Path: packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx
      Note: React renderer dispatch that must be extended
    - Path: packages/rag-evaluation-site/src/widgets/ir.ts
      Note: TypeScript Widget IR node and prop contracts
    - Path: pkg/widgetdsl/module.go
      Note: Goja widget.dsl direct helpers and semantic recipes
    - Path: pkg/widgetschema/schema.go
      Note: Server-discoverable Widget IR schema summary
ExternalSources: []
Summary: Intern-oriented implementation guide for extending Widget IR, WidgetRenderer, Goja widget.dsl helpers, schemas, stories, and tests to cover the new reusable package atoms, molecules, organisms, and semantic page recipes.
LastUpdated: 2026-06-07T21:05:00-04:00
WhatFor: Use before implementing semantic Widget IR support for the expanded @go-go-golems/rag-evaluation-site component vocabulary.
WhenToUse: When adding WidgetRenderer cases, Goja DSL helpers, semantic recipes, JSON schemas, or examples for context viewer, transcript, course, handout, sidebar, and article components.
---


# Semantic Widget IR Component Support Implementation Guide

## Executive Summary

The package `@go-go-golems/rag-evaluation-site` has grown from a small reusable component package into the canonical design-system layer for the RAG Evaluation System. It now contains context-window diagrams, transcript and annotation widgets, course/slide shells, sidebar shells, handout/document readers, and many generic molecules. The current Widget IR layer has not caught up: `src/widgets/ir.ts`, `src/widgets/WidgetRenderer.tsx`, `pkg/widgetdsl/module.go`, and `pkg/widgetschema/schema.go` still expose the earlier, smaller set of components.

The correct next step is to extend Widget IR in two layers:

1. **Direct semantic component nodes** for stable, JSON-compatible package components whose React APIs are already story-covered.
2. **High-level recipes** for common product compositions such as annotated transcripts, context diagram panels, course slides, handouts, and course studio shells.

This guide is written for a new intern. It explains the existing system, why the current architecture uses React rendering instead of Go-generated HTML, where each part lives, how actions cross the JSON boundary, which new components should be exposed, what props should look like, how to implement each phase, and how to test it without breaking the existing server/runtime contract.

The key rule is: **Widget IR should describe semantic UI, not recreate CSS-module DOM internals.** Goja scripts and recipes produce JSON-compatible Widget IR. The React `WidgetRenderer` maps those JSON nodes to the actual package components. The Go server and Goja runtime validate, serve, and action-dispatch the JSON, but they do not render HTML for individual components.

---

## 1. Problem Statement and Scope

### 1.1 What the user wants

The new ticket is to add “proper IR WidgetRenderer support” for the large amount of package UI added recently: atoms, molecules, organisms, and page-like shells. The requested deliverable is not a quick list of switch cases. It is a design and implementation guide that teaches a new intern the whole system and gives them a safe phased path.

### 1.2 What exists today

The current Widget IR model is intentionally small. In TypeScript, `WidgetNode` is a union of `TextNode`, `ElementNode`, and `ComponentNode` in `packages/rag-evaluation-site/src/widgets/ir.ts:9`. `RagWidgetType` currently lists the supported component node names at `packages/rag-evaluation-site/src/widgets/ir.ts:23`, and `WidgetProps` unions the known prop contracts at `packages/rag-evaluation-site/src/widgets/ir.ts:277`.

The renderer dispatches on `node.type` in `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx:61`. Unknown component names intentionally render an `ErrorCallout` at `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx:95`. That is good behavior because it makes missing renderer support visible instead of silently dropping UI.

The Goja DSL mirrors the same small vocabulary. `pkg/widgetdsl/module.go:18` defines `componentNames`, `pkg/widgetdsl/module.go:37` maps those JavaScript helper names to React component type strings, and `pkg/widgetdsl/module.go:112` installs one generic component factory per name. The same module also installs `page`, `cell`, `action`, and `recipes` helpers. Current recipes include `metrics`, `actionToolbar`, and `masterDetailTable` at `pkg/widgetdsl/module.go:172`.

The server exposes Widget IR pages and actions through `pkg/widgetserver/server.go`. Routes are registered in `registerRoutes` at `pkg/widgetserver/server.go:104`; page rendering is served from `GET /api/widget/pages/{id}`, actions from `POST /api/widget/actions/{name}`, and schema from `GET /api/widget/schema`. The default packaged React app loads pages with `useWidgetPage` and renders the result through `WidgetRenderer` in `packages/rag-evaluation-site/src/app/App.tsx:33` and `packages/rag-evaluation-site/src/app/App.tsx:70`.

### 1.3 What changed recently

The design-system package now exports a much larger component surface:

- `packages/rag-evaluation-site/src/components/molecules/index.ts:4-23` exports context diagram molecules, transcript cards, annotation cards, anchored comments, course/content molecules, sidebar navigation, markdown/article/document components, and preview toolbar components.
- `packages/rag-evaluation-site/src/components/organisms/index.ts:1-9` exports context diagram panels, transcript reader/workspace/rail panels, anchored comment rail, course lesson/slide/studio shells, and handout document shell.
- `packages/rag-evaluation-site/src/components/layout/index.ts` now includes `SectionBlock`, `SplitPane`, `SlideShell`, and `SidebarShell` in addition to the earlier layout primitives.
- `packages/rag-evaluation-site/src/context/types.ts:1-158` defines JSON-compatible DTOs for context-window parts, transcripts, annotations, courses, slides, anchored comments, and handout bundles.

These components were added with package guidelines in mind. The guidelines say “React first, Widget IR later” at `packages/rag-evaluation-site/GUIDELINES.md:15`, and the Widget IR rules at `packages/rag-evaluation-site/GUIDELINES.md:241` say to expose only stable visual components with mostly JSON-compatible props and renderer stories/tests.

### 1.4 In scope

This ticket should guide implementation for:

- Extending TypeScript IR types for stable package components.
- Extending `WidgetRenderer` with direct semantic node support.
- Extending `widget.dsl` Goja helpers for direct component construction.
- Extending semantic recipes for common context/transcript/course/handout compositions.
- Extending `widgetschema` so `/api/widget/schema` tells the truth.
- Adding Storybook stories and Go/TypeScript validation.
- Preserving the action model for `copy`, `event`, `navigate`, and `server` actions.

### 1.5 Out of scope

This design does **not** recommend:

- Recreating React component DOM in Go.
- Hard-coding CSS Module class names in Goja or Go.
- Exposing unstable visual fragments just because they exist.
- Adding backend hooks or router/store state to package components.
- Making every atom available before the high-value semantic nodes.

---

## 2. System Map for a New Intern

### 2.1 The runtime in one diagram

```text
JavaScript authoring script
  require("widget.dsl") or require("rag.dsl")
          |
          v
Goja native module: pkg/widgetdsl/module.go
  returns JSON-compatible Widget IR objects
          |
          v
widgetrunner validates page shape and action results
          |
          v
widgetserver serves /api/widget/pages/{id}
          |
          v
React app: RagEvaluationSiteApp + useWidgetPage
          |
          v
WidgetRenderer maps { kind: "component", type: "..." }
  to actual @go-go-golems/rag-evaluation-site React components
          |
          v
CSS Modules + theme tokens + real component behavior
```

### 2.2 Why React owns rendering

Past research rejected server-side HTML mimicry. The recovered implementation guide explains that copying React component DOM into a Go HTML builder creates a second UI implementation and breaks CSS Module ownership. The Obsidian article “From Boilerplate to Recipes” repeats the stronger pattern: recipes are pure functions that expand user data into Widget IR, and WidgetRenderer renders real React components.

That design is still correct. The package components use CSS Modules, design tokens, controlled selection props, ReactNode slots, and callback props. Widget IR must not duplicate their internal DOM. It should pass semantic props to the real React component.

### 2.3 The five code surfaces you must keep in sync

When adding a new Widget IR component, update these surfaces together:

1. **TypeScript IR contract**
   - File: `packages/rag-evaluation-site/src/widgets/ir.ts`
   - Add the component type string to `RagWidgetType`.
   - Add a props interface if the component has a meaningful typed prop contract.
   - Add that props interface to `WidgetProps`.

2. **React renderer**
   - File: `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx`
   - Import the React component.
   - Add a switch case.
   - Add a render helper that normalizes `WidgetNode` slots and `ActionSpec` callbacks.

3. **Goja DSL helpers**
   - File: `pkg/widgetdsl/module.go`
   - Add the JavaScript helper name to `componentNames` and the React type to `componentTypes` when a direct component helper is enough.
   - Add recipe functions when the author should not assemble the tree manually.

4. **Server schema**
   - File: `pkg/widgetschema/schema.go`
   - Add component types to `ComponentTypes`.
   - If schema detail becomes strict later, add prop schemas for new component families.

5. **Examples/tests/stories**
   - File: `packages/rag-evaluation-site/src/widgets/WidgetRenderer.stories.tsx`
   - File: `pkg/widgetdsl/module_test.go`
   - Optional examples: `examples/xgoja/widget-site/verbs/sites.js`
   - Add at least one Storybook story per new semantic family and at least one Go JSON round-trip test per DSL helper/recipe family.

---

## 3. Current-State Evidence

### 3.1 Widget IR shape is JSON-first

The TypeScript model defines JSON primitives, JSON values, and Widget nodes in `packages/rag-evaluation-site/src/widgets/ir.ts`. The important shape is:

```ts
export type WidgetNode = TextNode | ElementNode | ComponentNode;

export interface ComponentNode {
  kind: 'component';
  type: RagWidgetType | string;
  props?: WidgetProps;
  children?: WidgetNode[];
}
```

This means all new component props should remain serializable. A prop may contain `WidgetNode` or `RenderableValue`, but it cannot contain functions, React elements, class instances, Dates, Maps, or live service references.

### 3.2 WidgetRenderer has explicit cases

`WidgetRenderer.tsx` dispatches on component type. It does not use a dynamic registry today:

```ts
switch (node.type) {
  case 'AppShell':
    return renderAppShell(node, onAction);
  ...
  default:
    return <ErrorCallout>Unknown widget: {node.type}</ErrorCallout>;
}
```

Explicit cases are verbose, but useful for an intern because each case documents how JSON props become real component props. Keep this explicit style for the next implementation phase. Do not introduce a generic registry until the direct component list becomes painful and after tests cover the behavior.

### 3.3 Actions are already declarative

Actions are represented by `ActionSpec` in `ir.ts`, and handled in `packages/rag-evaluation-site/src/widgets/actions.ts`. The action kinds are:

- `copy`
- `event`
- `navigate`
- `server`

`RagEvaluationSiteApp` intercepts server actions and posts them to the configured API base. Non-server actions are dispatched locally. Preserve this behavior. New components that need callbacks should expose props like `onSelectAction`, `onChangeAction`, or `onDismissAction` in IR, and `WidgetRenderer` should bind those action specs to the React callback.

### 3.4 Recipes already exist

The current recipe layer is installed in `pkg/widgetdsl/module.go:172`. The Obsidian article explains the pattern: a recipe takes structured JavaScript data and returns plain Widget IR. It does not render, fetch, or mutate. Current recipes prove the pattern:

- `metrics` expands metric data into `DashboardGrid` + `Panel` + `StatusText`.
- `actionToolbar` expands action definitions into `Panel` + `Inline` + `Button`.
- `masterDetailTable` expands rows/columns/detail into `DashboardGrid` + `DataTable` + detail panel.

The new semantic widgets should follow the same rule. A recipe such as `rag.recipes.annotatedTranscript()` should return `TranscriptWorkspacePanel` IR or a composition of transcript nodes. It should not hand-build transcript card DOM.

### 3.5 The package guidelines already authorize “IR later”

The package guidelines explicitly say to add Widget IR support only after React component APIs and stories are stable. That condition is now true for many of the new components because they have package-owned stories and have passed typecheck/build/Storybook in prior work. However, not all components deserve first-class IR nodes. Use the classification below.

---

## 4. Component Exposure Strategy

### 4.1 Three tiers of exposure

Use three tiers instead of blindly exposing every file.

#### Tier 1: Direct component nodes

Expose components whose props are JSON-compatible and whose semantics are clear. These get direct `RagWidgetType` entries, renderer cases, and `widget.dsl` helpers.

Examples:

- `Text`, `CodeText`, `Divider`
- `ContextKindSwatch`, `AnnotationBadge`, `TranscriptRoleBadge`
- `SectionBlock`, `SplitPane`, `SlideShell`, `SidebarShell`
- `KeyValueStrip`, `CheckList`, `StepList`, `PersonSummary`, `FigureBlock`, `KeyPointList`
- `SidebarNav`
- `ContextBudgetBar`, `ContextStripDiagram`, `ContextStackDiagram`, `ContextTreemap`, `ContextLegend`
- `TranscriptMessageCard`, `TranscriptSessionHeader`, `AnnotationNoteCard`
- `MarkdownArticle`, `DocumentListPanel`, `DocumentPreviewToolbar`

#### Tier 2: Direct organism nodes with action callback props

Expose organisms when they take DTO-shaped props plus simple controlled callbacks. Renderer maps action specs into callbacks.

Examples:

- `ContextDiagramPanel`
- `TranscriptReaderPanel`
- `AnnotationRailPanel`
- `TranscriptWorkspacePanel`
- `AnchoredCommentRail`
- `CourseLessonPanel`
- `CourseSlidePanel`
- `CourseStudioShell`
- `HandoutDocumentShell`

#### Tier 3: Recipes and page-level helpers

Expose common page compositions as recipes, not low-level DOM. Recipes should choose the right direct nodes and fill in defaults.

Examples:

- `rag.recipes.contextDiagramPanel({ snapshot, view, mode })`
- `rag.recipes.annotatedTranscript({ transcript, selectedAnnotationId, onAnnotationSelect })`
- `rag.recipes.courseLesson({ course, nav, activeId })`
- `rag.recipes.courseSlide({ slide, snapshot, nav })`
- `rag.recipes.handout({ bundle, selectedDocumentId })`
- `rag.recipes.courseStudio({ activeItemId, main, title, subtitle })`

### 4.2 Components to defer

Defer components that are too low-level, too visual-fragment-specific, or not yet useful from Goja:

- `VisuallyHidden`: generally not needed as an author-facing DSL helper; use internally in components.
- `IconButton`: expose only if a stable icon representation is defined. Unicode labels are okay; arbitrary SVG/icon registries are not.
- `CheckboxRow`: expose only if form/control semantics are needed by a recipe.
- `ElementNode` escape hatch already exists; do not create atom helpers only to support arbitrary DOM.

---

## 5. Proposed TypeScript IR API

### 5.1 Extend `RagWidgetType`

Add new strings in semantic groups. Keep alphabetical or layer order; layer order is easier for reviewers.

```ts
export type RagWidgetType =
  // existing
  | 'AppShell'
  | 'AppNav'
  | 'Button'
  | 'Caption'
  ...

  // foundation / atoms
  | 'Text'
  | 'CodeText'
  | 'Divider'
  | 'ContextKindSwatch'
  | 'AnnotationBadge'
  | 'TranscriptRoleBadge'

  // layout
  | 'SectionBlock'
  | 'SplitPane'
  | 'SlideShell'
  | 'SidebarShell'

  // molecules
  | 'ContextLegend'
  | 'ContextBudgetBar'
  | 'ContextStripDiagram'
  | 'ContextStackDiagram'
  | 'ContextTreemap'
  | 'TranscriptSessionHeader'
  | 'TranscriptMessageCard'
  | 'AnnotationNoteCard'
  | 'AnchoredCommentCard'
  | 'CourseStepNav'
  | 'KeyValueStrip'
  | 'CheckList'
  | 'StepList'
  | 'PersonSummary'
  | 'FigureBlock'
  | 'KeyPointList'
  | 'SidebarNav'
  | 'MarkdownArticle'
  | 'DocumentListPanel'
  | 'DocumentPreviewToolbar'

  // organisms
  | 'ContextDiagramPanel'
  | 'TranscriptReaderPanel'
  | 'AnnotationRailPanel'
  | 'TranscriptWorkspacePanel'
  | 'AnchoredCommentRail'
  | 'CourseLessonPanel'
  | 'CourseSlidePanel'
  | 'CourseStudioShell'
  | 'HandoutDocumentShell';
```

### 5.2 Reuse context DTOs instead of duplicating them

The context DTOs in `packages/rag-evaluation-site/src/context/types.ts` are already JSON-compatible. Import those types into `ir.ts` and use them in widget props:

```ts
import type {
  AnchoredComment,
  ContextCourse,
  ContextDiagramStyle,
  ContextDiagramView,
  ContextHandoutDocument,
  ContextPartKind,
  ContextSlide,
  ContextWindowSnapshot,
  TranscriptAnnotation,
  TranscriptMessage,
  TranscriptRole,
} from '../context';
```

### 5.3 Add action props for callbacks

React components use callbacks like `onAnnotationSelect`, `onDismiss`, `onSelect`, and `onItemSelect`. JSON cannot carry functions. In IR, use `ActionSpec` props:

```ts
export interface TranscriptWorkspacePanelWidgetProps extends BaseWidgetProps {
  title?: string;
  subtitle?: string;
  messages: TranscriptMessage[];
  annotations?: TranscriptAnnotation[];
  selectedAnnotationId?: string;
  showNotes?: boolean;
  onAnnotationSelectAction?: ActionSpec;
}

export interface HandoutDocumentShellWidgetProps extends BaseWidgetProps {
  documents: ContextHandoutDocument[];
  selectedDocumentId?: string;
  title?: string;
  subtitle?: string;
  onSelectAction?: ActionSpec;
}

export interface AnchoredCommentRailWidgetProps extends BaseWidgetProps {
  comments: AnchoredComment[];
  selectedCommentId?: string;
  onDismissAction?: ActionSpec;
}
```

Renderer callback pseudocode:

```ts
function runAction(action: ActionSpec | undefined, context: WidgetActionContext, onAction?: WidgetActionHandler) {
  if (!action) return undefined;
  return () => bindAndRun(action, context, onAction);
}

function renderTranscriptWorkspacePanel(node, onAction) {
  const props = node.props as TranscriptWorkspacePanelWidgetProps;
  return <TranscriptWorkspacePanel
    title={props.title}
    subtitle={props.subtitle}
    messages={props.messages}
    annotations={props.annotations}
    selectedAnnotationId={props.selectedAnnotationId}
    showNotes={props.showNotes}
    onAnnotationSelect={props.onAnnotationSelectAction
      ? (annotationId) => bindAndRun(props.onAnnotationSelectAction!, {
          value: annotationId,
          annotationId,
          componentType: 'TranscriptWorkspacePanel',
        }, onAction)
      : undefined}
  />;
}
```

### 5.4 Represent ReactNode slots as `WidgetNode`

Some layout components have slot props instead of plain children:

- `SplitPane`: `left`, `right`
- `SlideShell`: `visual`, `children`, title fields
- `SidebarShell`: `sidebar`, `header`, `footer`, children
- `FigureBlock`: likely visual/body slot fields

In IR, make those slots `WidgetNode` or `RenderableValue`, never ReactNode:

```ts
export interface SplitPaneWidgetProps extends BaseWidgetProps {
  left: WidgetNode;
  right: WidgetNode;
  ratio?: 'balanced' | 'course' | 'sidebar' | string;
  divider?: boolean;
}

function renderSplitPane(node, onAction) {
  const props = node.props as SplitPaneWidgetProps;
  return <SplitPane
    left={renderWidgetNode(props.left, onAction)}
    right={renderWidgetNode(props.right, onAction)}
    ratio={props.ratio}
    divider={props.divider}
  />;
}
```

### 5.5 Keep children semantics simple

For direct nodes, use one of these patterns:

1. **Children-only components:** `Stack`, `Inline`, `SectionBlock`, `SlideShell` body.
2. **Props-only DTO components:** `ContextBudgetBar`, `TranscriptMessageCard`, `CourseLessonPanel`.
3. **Slot-prop components:** `SplitPane`, `SidebarShell`, `FigureBlock`.

Do not support two competing APIs unless there is a clear need. For example, `SplitPane` should use `props.left` and `props.right`, not positional `children[0]` and `children[1]`.

---

## 6. Proposed Renderer Implementation

### 6.1 Import groups

Add imports by layer to keep the renderer readable:

```ts
import {
  Button,
  ErrorCallout,
  SelectInput,
  TextInput,
  AnnotationBadge,
  ContextKindSwatch,
  TranscriptRoleBadge,
} from '../components/atoms';

import { Caption, CodeText, Divider, StatusText, Text } from '../components/foundation';

import {
  AppShell,
  DashboardGrid,
  FormRow,
  Inline,
  Panel,
  ScrollRegion,
  Stack,
  TabList,
  SectionBlock,
  SplitPane,
  SlideShell,
  SidebarShell,
} from '../components/layout';

import {
  AppNav,
  DataTable,
  MetadataGrid,
  ContextBudgetBar,
  ContextLegend,
  ContextStackDiagram,
  ContextStripDiagram,
  ContextTreemap,
  TranscriptMessageCard,
  TranscriptSessionHeader,
  AnnotationNoteCard,
  ...
} from '../components/molecules';

import {
  ContextDiagramPanel,
  TranscriptReaderPanel,
  TranscriptWorkspacePanel,
  ...
} from '../components/organisms';
```

### 6.2 Add switch cases in layer order

Keep the current explicit switch structure. Add cases in groups so diffs are navigable:

```ts
case 'Text':
  return renderText(node, onAction);
case 'CodeText':
  return renderCodeText(node, onAction);
case 'Divider':
  return renderDivider(node);
case 'ContextKindSwatch':
  return renderContextKindSwatch(node);
...
case 'TranscriptWorkspacePanel':
  return renderTranscriptWorkspacePanel(node, onAction);
```

### 6.3 Add renderer utility helpers

The renderer already has `renderChildren`, `renderRenderableValue`, and `bindAndRun`. Add a few small helpers instead of copying callback logic into every case.

```ts
function renderNodeProp(node: WidgetNode | undefined, onAction?: WidgetActionHandler): ReactNode | undefined {
  return node ? renderWidgetNode(node, onAction) : undefined;
}

function actionCallback<T extends string | number | boolean | null>(
  action: ActionSpec | undefined,
  componentType: string,
  valueKey: string,
  onAction?: WidgetActionHandler,
): ((value: T) => void) | undefined {
  if (!action) return undefined;
  return (value: T) => bindAndRun(action, { value, [valueKey]: value, componentType }, onAction);
}
```

Use explicit callbacks when richer context is needed:

```ts
onDismiss={props.onDismissAction
  ? (commentId) => bindAndRun(props.onDismissAction!, {
      value: commentId,
      commentId,
      componentType: 'AnchoredCommentRail',
    }, onAction)
  : undefined}
```

### 6.4 Renderer cases by component family

#### Foundation and atoms

These are direct prop pass-through cases. Most only need `className`, scalar props, and children.

```ts
function renderText(node, onAction) {
  const props = node.props as TextWidgetProps;
  return <Text as={props.as} size={props.size} tone={props.tone} weight={props.weight} align={props.align} className={props.className}>
    {renderChildren(node.children, onAction)}
  </Text>;
}
```

For `AnnotationBadge`, `ContextKindSwatch`, and `TranscriptRoleBadge`, use DTO scalar props:

```ts
<AnnotationBadge kind={props.kind} label={props.label} selected={props.selected} />
<ContextKindSwatch kind={props.kind} mode={props.mode} size={props.size} selected={props.selected} />
<TranscriptRoleBadge role={props.role} name={props.name} />
```

#### Layout

`SectionBlock` can render children and renderable label/caption:

```ts
<SectionBlock
  label={renderRenderableValue(props.label, onAction)}
  caption={renderRenderableValue(props.caption, onAction)}
  density={props.density}
  divider={props.divider}
>
  {renderChildren(node.children, onAction)}
</SectionBlock>
```

`SplitPane`, `SidebarShell`, and `SlideShell` must render slot props:

```ts
<SidebarShell
  sidebar={renderNodeProp(props.sidebar, onAction)}
  header={renderNodeProp(props.header, onAction)}
  footer={renderNodeProp(props.footer, onAction)}
  sidebarWidth={props.sidebarWidth}
>
  {renderChildren(node.children, onAction)}
</SidebarShell>
```

#### Context diagrams

The context DTOs are already JSON-shaped. Renderer cases should pass snapshots and selection IDs directly:

```ts
<ContextDiagramPanel
  snapshot={props.snapshot}
  view={props.view}
  mode={props.mode}
  selectedPartId={props.selectedPartId}
/>
```

If a future component supports selection callbacks, use `onPartSelectAction` and pass `{ partId, value: partId, componentType: 'ContextDiagramPanel' }`.

#### Transcript and annotations

Keep both low-level and high-level support:

- Low-level: `TranscriptMessageCard`, `AnnotationNoteCard`, `TranscriptReaderPanel`, `AnnotationRailPanel`.
- High-level: `TranscriptWorkspacePanel`.

The high-level node is the likely author-facing default. Low-level nodes are useful for custom layouts and tests.

```ts
<TranscriptWorkspacePanel
  title={props.title}
  subtitle={props.subtitle}
  messages={props.messages}
  annotations={props.annotations}
  selectedAnnotationId={props.selectedAnnotationId}
  showNotes={props.showNotes}
  onAnnotationSelect={props.onAnnotationSelectAction
    ? (annotationId) => bindAndRun(props.onAnnotationSelectAction!, { annotationId, value: annotationId, componentType: 'TranscriptWorkspacePanel' }, onAction)
    : undefined}
/>
```

#### Course/studio/handout

For course and handout organisms, prefer DTO props and action props:

```ts
<CourseLessonPanel course={props.course} />
<CourseSlidePanel slide={props.slide} snapshot={props.snapshot} visualSide={props.visualSide} />
<CourseStudioShell title={props.title} subtitle={props.subtitle} activeItemId={props.activeItemId} navSections={props.navSections}>
  {renderChildren(node.children, onAction)}
</CourseStudioShell>
<HandoutDocumentShell documents={props.documents} selectedDocumentId={props.selectedDocumentId} onSelect={...} />
```

---

## 7. Proposed Goja DSL API

### 7.1 Direct helpers

For direct component nodes, add names to `componentNames` and `componentTypes` in `pkg/widgetdsl/module.go`.

Recommended JavaScript helper names use lower camel case:

```go
var componentNames = []string{
  // existing
  "appShell",
  "appNav",
  ...

  // foundation / atoms
  "textBlock",
  "codeText",
  "divider",
  "contextKindSwatch",
  "annotationBadge",
  "transcriptRoleBadge",

  // layout
  "sectionBlock",
  "splitPane",
  "slideShell",
  "sidebarShell",

  // molecules / organisms
  "contextDiagramPanel",
  "transcriptWorkspacePanel",
  "courseLessonPanel",
  "courseSlidePanel",
  "courseStudioShell",
  "handoutDocumentShell",
}
```

Use `textBlock` for the `Text` component to avoid colliding with existing `rag.text()`, which creates a `TextNode`.

```go
var componentTypes = map[string]string{
  "textBlock": "Text",
  "codeText": "CodeText",
  "divider": "Divider",
  "contextKindSwatch": "ContextKindSwatch",
  ...
}
```

A direct helper call should look like:

```js
rag.transcriptWorkspacePanel({
  title: transcript.title,
  subtitle: transcript.subtitle,
  messages: transcript.messages,
  annotations: transcript.annotations,
  selectedAnnotationId: state.selectedAnnotationId,
  onAnnotationSelectAction: rag.action.server("select-annotation")
})
```

Because `componentFactory` already accepts props and children, most direct helpers need no custom Go function.

### 7.2 Semantic recipes

Direct helpers are useful but still verbose. Recipes should encode known-good compositions.

#### `recipes.annotatedTranscript`

```js
rag.recipes.annotatedTranscript({
  transcript,
  selectedAnnotationId: state.selectedAnnotationId,
  onAnnotationSelect: "select-annotation",
  showNotes: true,
})
```

Output IR:

```json
{
  "kind": "component",
  "type": "TranscriptWorkspacePanel",
  "props": {
    "title": "...",
    "subtitle": "...",
    "messages": [...],
    "annotations": [...],
    "selectedAnnotationId": "...",
    "showNotes": true,
    "onAnnotationSelectAction": { "kind": "server", "name": "select-annotation" }
  }
}
```

Go pseudocode:

```go
func (r *runtime) annotatedTranscriptRecipe(call goja.FunctionCall) goja.Value {
  options := firstObject(call.Arguments)
  transcript, _ := options["transcript"].(map[string]any)
  props := map[string]any{
    "title": valueOrDefault(transcript["title"], options["title"]),
    "subtitle": valueOrDefault(transcript["subtitle"], options["subtitle"]),
    "messages": anySlice(transcript["messages"]),
    "annotations": anySlice(transcript["annotations"]),
    "selectedAnnotationId": valueOrDefault(options["selectedAnnotationId"], transcript["selectedAnnotationId"]),
    "showNotes": boolFromMap(options, "showNotes", true),
  }
  if act, ok := normalizeActionSpec(options["onAnnotationSelect"], nil, nil); ok {
    props["onAnnotationSelectAction"] = act
  }
  return r.vm.ToValue(componentNode("TranscriptWorkspacePanel", props))
}
```

#### `recipes.contextDiagram`

```js
rag.recipes.contextDiagram({
  snapshot,
  view: "treemap",
  mode: "pattern",
  selectedPartId: "conversation-history",
})
```

This should expand to `ContextDiagramPanel` rather than four separate diagram widgets, unless the author asks for a specific low-level diagram helper.

#### `recipes.courseStudio`

```js
rag.recipes.courseStudio({
  title: "Context Engineering Workshop",
  subtitle: "Lesson 1",
  activeItemId: "slides",
  main: rag.courseSlidePanel({ slide, snapshot }),
})
```

Output IR should be `CourseStudioShell` with the `main` node as children. It may default to `courseStudioNavSections` semantics if those sections are expressible as JSON in props.

#### `recipes.handout`

```js
rag.recipes.handout({
  title: "Workshop handout",
  documents: handout.docs,
  selectedDocumentId: state.docId,
  onSelect: "select-document",
})
```

Output IR should be `HandoutDocumentShell` with `onSelectAction` normalized to a server action.

### 7.3 Recipe utility helpers

Add small helpers to reduce repeated map construction:

```go
func componentNode(componentType string, props map[string]any, children ...any) map[string]any {
  out := map[string]any{"kind": "component", "type": componentType}
  if len(props) > 0 { out["props"] = props }
  if len(children) > 0 { out["children"] = children }
  return out
}

func widgetNodeFromOption(value any) (map[string]any, bool) {
  node, ok := value.(map[string]any)
  return node, ok && isWidgetNodeExport(node)
}
```

Keep these helpers small and covered by recipe tests.

---

## 8. Server Schema and Compatibility

### 8.1 Update `pkg/widgetschema/schema.go`

`pkg/widgetschema/schema.go:5` currently lists the same small component set as the TypeScript renderer. Add every new direct component type that the renderer supports.

The schema is permissive today: the component node definition allows `additionalProperties: true` for props. That is acceptable for this phase, but the `components` list must be accurate because `/api/widget/schema` is used for discovery.

### 8.2 Schema versioning

The current version is `0.1.0`. There are two reasonable options:

- Keep `0.1.0` if the change is additive and old pages still render.
- Move to `0.2.0` if downstream consumers treat the schema as a fixed contract and need to discover the larger component set.

Recommendation: keep the `schemaVersion` default in `rag.page()` as `0.1.0` for backward compatibility, but add a changelog note and consider `0.2.0` only when strict JSON Schema props are introduced.

### 8.3 Backward compatibility

Existing scripts using `rag.panel`, `rag.dataTable`, `rag.recipes.metrics`, `rag.recipes.actionToolbar`, and `rag.recipes.masterDetailTable` must continue to work unchanged. Add tests that still exercise old recipes after new helpers are installed.

---

## 9. Implementation Phases

### Phase 0: Baseline and guardrails

1. Run current validation:
   - `pnpm --dir packages/rag-evaluation-site typecheck`
   - `pnpm --dir packages/rag-evaluation-site build`
   - `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1`
2. Confirm package Storybook has stories for candidate components.
3. Read `packages/rag-evaluation-site/GUIDELINES.md` before editing.
4. Keep unrelated untracked web page directories out of commits.

### Phase 1: TypeScript IR for foundation, atoms, and layout

Implement direct support for the smallest safe set first:

- `Text`, `CodeText`, `Divider`
- `ContextKindSwatch`, `AnnotationBadge`, `TranscriptRoleBadge`
- `SectionBlock`, `SplitPane`, `SlideShell`, `SidebarShell`

Why this phase first:

- It exercises scalar props, children, renderable props, and slot props.
- It does not require complex DTOs or callback action binding.
- It gives Storybook coverage for basic new renderer mechanics.

Files to edit:

- `packages/rag-evaluation-site/src/widgets/ir.ts`
- `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx`
- `packages/rag-evaluation-site/src/widgets/WidgetRenderer.stories.tsx`

Validation:

- Typecheck and build.
- Add a `Widget IR/Renderer` story named `NewFoundationAtomsAndLayout`.

### Phase 2: Context diagram DTO components

Add direct support for:

- `ContextLegend`
- `ContextBudgetBar`
- `ContextStripDiagram`
- `ContextStackDiagram`
- `ContextTreemap`
- `ContextDiagramPanel`

Props should use `ContextWindowSnapshot`, `ContextDiagramView`, `ContextDiagramStyle`, and selected IDs from `src/context/types.ts`.

Add a Storybook story that renders a full `ContextDiagramPanel` and one low-level story that renders a `DashboardGrid` of the four diagram types using Widget IR.

### Phase 3: Transcript, annotations, and comments

Add direct support for:

- `TranscriptSessionHeader`
- `TranscriptMessageCard`
- `AnnotationNoteCard`
- `AnnotationRailPanel`
- `TranscriptReaderPanel`
- `TranscriptWorkspacePanel`
- `AnchoredCommentCard`
- `AnchoredCommentRail`

Add action props:

- `onAnnotationSelectAction`
- `onDismissAction`
- optionally `onMessageSelectAction` if a future component supports it

Add Storybook stories:

- `Widget IR/Renderer / TranscriptWithoutNotes`
- `Widget IR/Renderer / TranscriptWithNotes`
- `Widget IR/Renderer / AnchoredComments`

Add Go tests:

- DSL helper can build a `TranscriptWorkspacePanel` node and JSON serialize it.
- Recipe can build annotated transcript from a transcript fixture object.

### Phase 4: Course, slides, sidebar, and handout

Add support for:

- `CourseStepNav`
- `CourseLessonPanel`
- `CourseSlidePanel`
- `CourseStudioShell`
- `SidebarNav`
- `MarkdownArticle`
- `DocumentListPanel`
- `DocumentPreviewToolbar`
- `HandoutDocumentShell`
- `FigureBlock`, `KeyPointList`, `KeyValueStrip`, `CheckList`, `StepList`, `PersonSummary`

Add action props:

- `onNavSelectAction` for nav shells if the React components support selection callbacks.
- `onSelectAction` for `HandoutDocumentShell` and document lists.

Add recipes:

- `courseStudio`
- `courseLesson`
- `courseSlide`
- `handout`

Add WidgetRenderer stories that compose a full course studio page with a slide and a handout page.

### Phase 5: Goja DSL, schema, and xgoja example

After renderer support works in Storybook:

1. Add direct helpers to `pkg/widgetdsl/module.go`.
2. Add semantic recipes.
3. Update `pkg/widgetschema/schema.go`.
4. Add Go tests in `pkg/widgetdsl/module_test.go`.
5. Add or update an xgoja widget-site page that demonstrates the new semantic recipes.
6. Run widget server tests and smoke if available.

### Phase 6: Documentation and migration

Update:

- `packages/rag-evaluation-site/README.md`
- `packages/rag-evaluation-site/GUIDELINES.md` if new rules are discovered
- bundled widget DSL docs if present
- examples under `examples/xgoja/widget-site`

Document recommended authoring style:

- Use direct helpers for small custom layouts.
- Use recipes for product-level context/transcript/course/handout pages.
- Avoid anonymous `element('div')` trees unless no component exists.

---

## 10. Testing and Validation Strategy

### 10.1 TypeScript/package validation

Run after each phase:

```bash
pnpm --dir packages/rag-evaluation-site typecheck
pnpm --dir packages/rag-evaluation-site build
pnpm --dir packages/rag-evaluation-site exec storybook build --output-dir /tmp/rag-package-storybook-widget-ir-expanded
```

### 10.2 Storybook validation

Every new family should have a `Widget IR/Renderer` story. The story must use IR objects, not direct JSX, because it validates the renderer path.

Minimum story list:

- `NewFoundationAtomsAndLayout`
- `ContextDiagramComponents`
- `TranscriptWithoutNotes`
- `TranscriptWithNotes`
- `AnchoredComments`
- `CourseStudioSlide`
- `HandoutDocumentShell`

### 10.3 Go tests

Run:

```bash
go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1
```

Add tests for:

- New helper export existence.
- JSON serialization of new direct component helpers.
- JSON serialization of semantic recipes.
- Action normalization for callback-style props.
- `/api/widget/schema` includes new component names.

Example test sketch:

```go
func TestContextAndTranscriptHelpersAreJSONSerializable(t *testing.T) {
  vm := goja.New()
  reg := require.NewRegistry()
  Register(reg)
  reg.Enable(vm)

  value, err := vm.RunString(`
    const rag = require("widget.dsl");
    const page = rag.page({ id: "context", title: "Context" , sections: [
      rag.contextDiagramPanel({ snapshot: { id: "s", title: "S", limit: 100, parts: [] }, view: "budget" }),
      rag.transcriptWorkspacePanel({ title: "T", messages: [], annotations: [], showNotes: false })
    ]});
    JSON.stringify(page);
  `)
  // assert JSON round-trip and component types
}
```

### 10.4 Browser action smoke

For callback-bearing components, test that selecting an item emits the expected action context. Use a custom `onAction` in Storybook or a React test harness.

Expected context examples:

```json
{
  "componentType": "TranscriptWorkspacePanel",
  "annotationId": "ann-01",
  "value": "ann-01"
}
```

```json
{
  "componentType": "HandoutDocumentShell",
  "documentId": "doc-field-guide",
  "value": "doc-field-guide"
}
```

### 10.5 Server smoke

When xgoja example pages are updated:

```bash
make -C examples/xgoja/widget-site smoke
```

If the repo-wide Go workspace still has unrelated module issues, run targeted package tests first and document the broader failure separately.

---

## 11. Design Decisions

### Decision: Extend React WidgetRenderer, not Go HTML rendering

- **Context:** Past designs considered generating HTML from Goja directly, but the package uses React components and CSS Modules.
- **Options considered:** Go-generated HTML, CSS-module class manifest, React WidgetRenderer extension.
- **Decision:** Extend React `WidgetRenderer` with semantic component cases.
- **Rationale:** This preserves the actual component implementation, CSS Modules, tokens, accessibility, and action behavior.
- **Consequences:** TypeScript renderer work is required for each component, but visual drift is minimized.
- **Status:** accepted.

### Decision: Use direct nodes plus recipes

- **Context:** Raw IR is verbose, but exposing only high-level recipes prevents custom layouts.
- **Options considered:** Only direct nodes; only recipes; both direct nodes and recipes.
- **Decision:** Add direct nodes for stable JSON-compatible components and recipes for common product compositions.
- **Rationale:** Direct nodes are flexible; recipes are ergonomic and encode preferred design-system composition.
- **Consequences:** There are two authoring levels to document, but both produce the same plain IR.
- **Status:** proposed.

### Decision: Callback props become `ActionSpec` props

- **Context:** React callbacks cannot cross JSON or Goja boundaries.
- **Options considered:** Drop interactivity; string event names only; reuse `ActionSpec`.
- **Decision:** Add props such as `onAnnotationSelectAction`, `onSelectAction`, and `onDismissAction` using the existing `ActionSpec` type.
- **Rationale:** The action system already supports local copy/event/navigation and server actions.
- **Consequences:** Renderer cases must bind action context carefully and tests must assert context payloads.
- **Status:** proposed.

### Decision: Reuse context DTOs in IR prop types

- **Context:** New context/transcript/course/handout components already use JSON-compatible DTOs in `src/context/types.ts`.
- **Options considered:** Duplicate DTOs in `ir.ts`; import and reuse DTOs; use `JsonObject` everywhere.
- **Decision:** Import and reuse context DTOs in IR props.
- **Rationale:** It reduces drift and gives interns a single source of truth for domain shapes.
- **Consequences:** `ir.ts` gains a dependency on `src/context`, which is acceptable because both are package-level public contracts.
- **Status:** proposed.

### Decision: Keep renderer dispatch explicit for now

- **Context:** Adding many cases may make `WidgetRenderer.tsx` longer.
- **Options considered:** Dynamic registry, generic prop spread, explicit switch.
- **Decision:** Keep explicit switch and helper functions for this implementation.
- **Rationale:** Explicit cases make prop normalization and action binding reviewable. A generic prop spread would accidentally pass unsupported props and hide callback conversion.
- **Consequences:** More code, but safer for a first intern implementation.
- **Status:** proposed.

### Decision: Use `textBlock` as the DSL helper for the `Text` component

- **Context:** `rag.text()` already creates a text node, not a `Text` component.
- **Options considered:** Rename existing `text`, overload `text`, introduce `textBlock`.
- **Decision:** Keep `rag.text()` unchanged and add `rag.textBlock()` for the `Text` component.
- **Rationale:** Avoids breaking existing scripts and preserves a clear distinction between raw text nodes and typography components.
- **Consequences:** The helper name differs from the React component name, but that difference is documented.
- **Status:** proposed.

---

## 12. Intern Implementation Checklist

For each new component family, use this checklist:

1. Read the React component props and story.
2. Confirm props are JSON-compatible or define action/slot conversions.
3. Add prop interface to `ir.ts`.
4. Add component type string to `RagWidgetType`.
5. Add props interface to `WidgetProps`.
6. Import component in `WidgetRenderer.tsx`.
7. Add switch case.
8. Add render helper with explicit prop mapping.
9. Add WidgetRenderer Storybook story using IR.
10. Add Goja helper mapping if direct DSL support is wanted.
11. Add recipe if the component is a common semantic composition.
12. Add Go JSON serialization tests.
13. Update `widgetschema.ComponentTypes`.
14. Run TypeScript, Storybook, and Go tests.
15. Update docs/changelog/diary.

---

## 13. Suggested First Pull Request Slice

Keep the first implementation PR small enough to review. Recommended first PR:

- TypeScript IR + renderer support for:
  - `Text`
  - `CodeText`
  - `Divider`
  - `ContextKindSwatch`
  - `AnnotationBadge`
  - `TranscriptRoleBadge`
  - `SectionBlock`
  - `SplitPane`
  - `SidebarShell`
- WidgetRenderer story for those components.
- Goja direct helpers for those names.
- Schema component list update.
- Go export/JSON serialization test.

Then follow with separate PRs:

1. Context diagram components.
2. Transcript/annotation/comment components and recipes.
3. Course/sidebar/handout components and recipes.
4. xgoja examples and docs.

This sequencing avoids one huge risky PR and gives the intern a quick path to learn the full loop.

---

## 14. Open Questions

1. Should `pkg/widgetschema.Version` remain `0.1.0` for additive changes, or move to `0.2.0` when the component list expands?
2. Should `CourseStudioShell` expose its default nav sections through a JSON prop, or should the recipe inject the default sections and keep the node simple?
3. Should low-level `MarkdownArticle` be exposed directly, or should authors normally use `HandoutDocumentShell` and only get direct markdown support for custom documents?
4. Should direct helper names exactly mirror React names, or should some helpers use clearer DSL names (`textBlock`, `annotatedTranscript`, `contextDiagram`)?
5. Should a generated source of truth eventually produce `RagWidgetType`, `componentTypes`, and `widgetschema.ComponentTypes`, or is manual synchronization acceptable for now?

---

## 15. References

### Primary implementation files

- `packages/rag-evaluation-site/src/widgets/ir.ts` — TypeScript Widget IR model and prop contracts.
- `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx` — React renderer for Widget IR component nodes.
- `packages/rag-evaluation-site/src/widgets/actions.ts` — Action dispatch model for copy/event/navigate/server actions.
- `packages/rag-evaluation-site/src/widgets/cellRenderers.tsx` — Existing pattern for JSON cell specs and renderable values.
- `packages/rag-evaluation-site/src/widgets/WidgetRenderer.stories.tsx` — Existing Storybook coverage for renderer behavior.
- `packages/rag-evaluation-site/src/app/App.tsx` — Packaged app that fetches pages, handles actions, and renders `WidgetRenderer`.
- `packages/rag-evaluation-site/src/context/types.ts` — JSON-compatible context/transcript/course/handout DTOs.
- `pkg/widgetdsl/module.go` — Goja native module exposing `widget.dsl` and semantic recipes.
- `pkg/widgetdsl/module_test.go` — Existing DSL serialization and recipe tests.
- `pkg/widgetdsl/registrar.go` — Runtime module registrar for go-go-goja.
- `pkg/widgetschema/schema.go` — Server schema summary and JSON Schema skeleton.
- `pkg/widgetserver/server.go` — HTTP routes for pages, actions, health, schema, and frontend serving.
- `pkg/widgetrunner/runner_test.go` — Runner tests for page rendering, action invocation, script loading, and IR validation.

### Design-system and prior guidance

- `packages/rag-evaluation-site/GUIDELINES.md` — package rules, including “React first, Widget IR later.”
- `packages/rag-evaluation-site/README.md` — package ownership summary and WidgetRenderer usage.
- `web/README.md` — frontend architecture primer and links to DSL design documents.
- `ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/design-doc/03-context-viewer-integration-plan-after-design-system-unification.md` — accepted plan to add Widget IR recipes after React component stabilization.
- `ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/02-recovered-documents/06-review-and-revised-implementation-guide-for-the-rag-widget-dsl.md` — prior correction from HTML generation to typed Widget IR rendered by React.
- `/home/manuel/code/wesen/go-go-golems/go-go-parc/Projects/2026/06/06/RAG-EVAL DSL/ARTICLE - Semantic Recipes on Top of Widget IR.md` — Obsidian article explaining the recipe pattern used by current DSL recipes.

### Ticket evidence files

- `sources/01-widget-ir-evidence.txt` — repository search output for renderer, DSL, schema, examples, and tests.
- `sources/02-line-references.md` — line-numbered excerpts for key implementation files.
- `sources/03-component-api-surface.txt` — component prop/story/export surface extracted from the package.
- `sources/semantic-recipes-on-top-of-widget-ir.md` — copied source article for offline ticket review.
