---
Title: ""
Ticket: ""
Status: ""
Topics: []
DocType: ""
Intent: ""
Owners: []
RelatedFiles:
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/components/atoms/ContextKindSwatch/ContextKindSwatch.tsx
      Note: Current swatch takes ContextPartKind; hard-cutover design deletes it and introduces generic ContextStyleSwatch
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/components/molecules/ContextLegend/ContextLegend.tsx
      Note: Current legend derives from kinds; hard-cutover design replaces it with required items+styles API
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/components/organisms/ContextDiagramPanel/ContextDiagramPanel.tsx
      Note: Panel should require styleSet and pass it to diagrams and legend
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/context/kinds.ts
      Note: Current visual registry hardcoded by kind; hard-cutover design removes it from the diagram rendering path
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/context/types.ts
      Note: Current hardcoded ContextPartKind model; hard-cutover design replaces kind with required styleKey and generic style/legend contracts
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/widgets/WidgetRenderer.context-diagrams.stories.tsx
      Note: Storybook Widget IR examples should include custom three-label styleSet
    - Path: 2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/widgets/ir.ts
      Note: Widget IR must require JSON-compatible styleSet for caller-defined legends and styles
ExternalSources: []
Summary: ""
LastUpdated: 0001-01-01T00:00:00Z
WhatFor: ""
WhenToUse: ""
---








# Reviewed Design: Configurable Legends and Style Palettes for Context Diagrams

## Executive Summary

The previous design correctly identified two important ideas: context diagrams need more visual distinction, and colored halftone is a better fit for the existing retro visual language than flat fills. However, it still kept the most important limitation of the current implementation: **the diagram vocabulary is hardcoded around `ContextPartKind`** (`system`, `generated`, `evicted`, `active`, etc.).

The new requirement changes the design center. A caller should be able to say:

> "For this context diagram, I have three labels. Here is the data to render. Here is the visual style for each label. Render the diagram and the legend using exactly those labels and styles."

That means the legend and palette cannot be derived only from a fixed enum. The diagram system needs to separate three concerns that are currently tangled together:

1. **Data segments** — the actual context window parts and token counts.
2. **Legend entries** — the labels the viewer should see for this diagram.
3. **Visual styles** — the halftone pattern, line color, fill tint, stroke, label color, and swatch sizing for each entry.

The reviewed design below keeps the useful parts of the earlier proposal — CSS tokens, colored halftone, Storybook palette showcase — but replaces the hardcoded-kind model with a **caller-configurable style map and legend spec**.

**Hard-cutover directive:** do not preserve backwards compatibility. `2026-05-27--rag-evaluation-system/` and `ClubMedMeetup/` are the only current consumers and both can be updated. That means the implementation should remove the old `ContextPartKind`-driven context diagram API instead of wrapping it. No `ContextKindSwatch` compatibility wrapper, no `legendKinds`, no `legendMode`, no `.kind_*` CSS compatibility layer, and no "fallback to old kind" resolution.

---

## What Was Good in the Previous Design

The previous design has several strong choices worth keeping.

### 1. Colored halftone is the right visual direction

The correction from flat fills to **colored halftone** is important. The existing diagrams are built around checkerboards, stipples, diagonal hatches, and dense diagonal hatches. Throwing those patterns away would make the visualization less distinctive and less aligned with the current design language.

The right model is:

- keep the pattern shape (`checker`, `stipple`, `diagonal`, `cross`, etc.),
- parameterize the pattern line color,
- parameterize the background fill/tint,
- let each diagram segment use the same generic pattern renderer.

### 2. CSS custom properties are the right implementation tool

CSS variables are still the correct primitive for palette theming. They let a provider wrapper scope a palette to a subtree without threading colors through every component prop. This is especially good for Storybook because the same component tree can be rendered under several different providers.

### 3. Storybook should show the same layout under multiple themes

The previous design's Storybook gallery idea is correct. A good showcase should render the **same snapshot and same layout** under several visual palettes so reviewers can see whether the styling is truly separated from the data.

### 4. The current hardcoded kinds are useful source material, not an API to preserve

The current 15 hardcoded kinds have value as examples of a good context-window vocabulary. They should inform the default fixture/style data, but they should not remain as a typed API, wrapper, or special rendering path. If a diagram still wants labels named `system`, `result`, or `active`, it can express them as ordinary `styleKey` strings inside its `ContextStyleSet`.

---

## What Was Problematic

### Problem 1: `ContextPartKind` is treated as both semantics and style key

Today, `kind` means too many things:

- It is a semantic category (`system`, `tool`, `result`).
- It is a legend lookup key.
- It is a CSS class suffix (`.kind_system`).
- It is a key in TypeScript registries (`patternSpecs.system`).
- It is the only way to choose swatch appearance.

This works for demos, but it fails when a caller wants a diagram with a different vocabulary, such as:

- `prompt`, `retrieved evidence`, `answer draft`
- `pinned`, `working set`, `evicted`
- `trusted`, `untrusted`, `generated`
- `policy`, `task`, `tool output`, `scratch`

Those are not necessarily `ContextPartKind` values, and forcing them into `other` loses the point of having a configurable legend.

### Problem 2: The legend derives from hardcoded kinds, not from the diagram contract

`ContextLegend` currently accepts:

```typescript
interface ContextLegendProps {
  kinds?: ContextPartKind[];
  mode?: ContextDiagramStyle;
  compact?: boolean;
  selectedKind?: ContextPartKind;
}
```

This means the legend can only display known kinds. The label text comes from `getContextKindLabel(kind)`, so callers cannot say, "call this bucket `Retrieved evidence` in this diagram" without changing global code.

### Problem 3: CSS selectors are hardcoded by kind

The CSS modules use selectors such as:

```css
.kind_system,
.kind_instruction { ... }
.kind_retrieval,
.kind_tool,
.kind_result { ... }
.kind_active { ... }
```

This makes custom palettes awkward because every new label/style would need a new CSS class. The styling model should instead use **generic pattern classes** and per-segment CSS variables.

### Problem 4: Palette size is assumed to match the built-in vocabulary

The previous design discussed four named palettes, but the actual desired abstraction is more general: the caller may provide 3 legend entries, 6 entries, or 15 entries. The palette size should be whatever the diagram needs.

A "palette" in this system should mean "a set of style entries keyed by the caller's label/style ids", not only "one global theme with three accent colors."

---

## New Design Principle

The diagram renderer should not ask, "What hardcoded kind is this segment?" It should ask:

1. What **style key** is attached to this segment?
2. Does the current `styleMap` define that key?
3. What legend entry should be displayed for that key?
4. Which pattern renderer should draw it?

In other words:

```text
ContextWindowPart.styleKey ───────┐
                                  ▼
                         ContextStyleMap[styleKey]
                                  │
             ┌────────────────────┴────────────────────┐
             ▼                                         ▼
      segment visual style                     legend item display
   (fill, line, pattern, stroke)             (label, swatch, order)
```

There is no `kind` fallback in the hard-cutover design. Every renderable part must have a `styleKey`, and every `styleKey` used by visible data should be covered by the supplied `ContextStyleSet`.

---

## Proposed Data Model

### 1. Replace segment kind with required style identity

`ContextWindowPart` should remove `kind` and use a required `styleKey`. This is a deliberate breaking change. All existing fixtures and consumers in `2026-05-27--rag-evaluation-system/` and `ClubMedMeetup/` should be updated in the same implementation pass.

```typescript
export interface ContextWindowPart {
  id: string;
  label: string;

  /**
   * Required visual/legend lookup key for caller-defined styles.
   * Examples: 'prompt', 'evidence', 'answer', 'trusted', 'untrusted'.
   */
  styleKey: string;

  tokens: number;
  note?: string;
  contentPreview?: string;
  content?: string;
  sourceId?: string;
  startToken?: number;
  endToken?: number;
  metadata?: ContextJsonRecord;
}
```

Resolution rule:

```typescript
function getPartStyleKey(part: ContextWindowPart): string {
  return part.styleKey;
}
```

If a part references an unknown `styleKey`, the component should render an explicit developer-facing error state in Storybook/development rather than silently mapping it to `other`. In production, it may use `styleSet.fallbackStyle`, but that fallback is for resilience, not backwards compatibility.

### 2. Define a generic visual style entry

A style entry describes **how one category should be drawn**. It is not tied to context-window semantics.

```typescript
export type ContextPatternName =
  | 'none'
  | 'checker'
  | 'diagonal'
  | 'diagonalDense'
  | 'stipple'
  | 'cross'
  | 'solid'
  | 'overflow';

export interface ContextVisualStyle {
  /** Background behind pattern marks. */
  fill: string;

  /** Pattern mark color: dots, hatches, checker pixels, cross lines. */
  line?: string;

  /** Segment border color. */
  stroke?: string;

  /** Label text color inside the segment. */
  labelColor?: string;

  /** Which generic pattern renderer to use. */
  pattern?: ContextPatternName;

  /** Optional border tweaks. */
  dashed?: boolean;
  dotted?: boolean;
  strokeWidth?: number;

  /** Optional custom CSS vars for advanced cases. */
  vars?: Record<string, string>;
}
```

### 3. Define legend entries separately from style entries

A legend item describes **what the viewer sees in the legend**. It points at a visual style by id.

```typescript
export interface ContextLegendItemSpec {
  id: string;

  /** Display label; Widget IR can allow RenderableValue here. */
  label: string;

  /** Optional explanatory text for hover/detail views. */
  description?: string;

  /** Which style to use. Defaults to id. */
  styleKey?: string;

  /** Optional ordering. Smaller numbers render first. */
  order?: number;

  /** Optional: hide from legend while still allowing segment styling. */
  hidden?: boolean;
}
```

### 4. Bundle styles and legend into a style set

A style set is the diagram-local palette. Its size is flexible: 3 items, 6 items, 15 items, or any number the diagram needs.

```typescript
export interface ContextStyleSet {
  id?: string;
  name?: string;

  /** Flexible visual vocabulary for this diagram. */
  styles: Record<string, ContextVisualStyle>;

  /** Legend entries to render. If omitted, derive from styles. */
  legend?: ContextLegendItemSpec[];

  /** Fallback style for unknown style keys. */
  fallbackStyle?: ContextVisualStyle;

  /** Legend presentation settings. */
  legendSize?: 'xs' | 'sm' | 'md' | 'lg';
  swatchSize?: 'xs' | 'sm' | 'md' | 'lg';
}
```

A three-label caller-defined example:

```typescript
const threeLabelStyleSet: ContextStyleSet = {
  id: 'simple-rag-window',
  name: 'Simple RAG Window',
  swatchSize: 'md',
  legend: [
    { id: 'prompt', label: 'Prompt scaffolding', description: 'System and developer instructions' },
    { id: 'evidence', label: 'Retrieved evidence', description: 'Documents retrieved for the answer' },
    { id: 'answer', label: 'Answer draft', description: 'Current generated answer' },
  ],
  styles: {
    prompt: {
      pattern: 'checker',
      fill: 'color-mix(in srgb, #4F74A8 20%, #F2EEF2)',
      line: '#4F74A8',
      stroke: '#141214',
      labelColor: '#141214',
    },
    evidence: {
      pattern: 'stipple',
      fill: 'color-mix(in srgb, #9C527E 18%, #F2EEF2)',
      line: 'color-mix(in srgb, #9C527E 60%, #F2EEF2)',
      stroke: '#141214',
      labelColor: '#141214',
    },
    answer: {
      pattern: 'solid',
      fill: '#9C527E',
      stroke: '#141214',
      labelColor: '#ffffff',
    },
  },
};
```

---

## Rendering Model

### Current rendering model

The current implementation renders by hardcoded CSS class:

```typescript
className={[styles.segment, styles[`kind_${part.kind}`]].join(' ')}
```

That means styles live in CSS selectors named after built-in kinds.

### Proposed rendering model

The new implementation should render by **generic pattern class + per-segment CSS variables**:

```typescript
const styleKey = getPartStyleKey(part);
const visual = resolveContextVisualStyle(styleKey, styleSet);

<div
  className={[
    styles.segment,
    styles[`pattern_${visual.pattern ?? 'none'}`],
    selected ? styles.selected : '',
  ].filter(Boolean).join(' ')}
  style={contextVisualStyleToCssVars(visual)}
>
  {showLabels && <span className={styles.label}>{part.label}</span>}
</div>
```

The CSS becomes generic:

```css
.segment {
  --ctx-fill: var(--mac-surface);
  --ctx-line: var(--mac-border);
  --ctx-stroke: var(--mac-border);
  --ctx-label: var(--mac-text);
  background-color: var(--ctx-fill);
  border-color: var(--ctx-stroke);
}

.label { color: var(--ctx-label); }

.pattern_none { background: var(--ctx-fill); }
.pattern_solid { background: var(--ctx-fill); }

.pattern_diagonal {
  background-color: var(--ctx-fill);
  background-image: repeating-linear-gradient(
    45deg, var(--ctx-line) 0 1px, transparent 1px 7px
  );
}

.pattern_diagonalDense {
  background-color: var(--ctx-fill);
  background-image: repeating-linear-gradient(
    45deg, var(--ctx-line) 0 1px, transparent 1px 3px
  );
}

.pattern_stipple {
  background-color: var(--ctx-fill);
  background-image: radial-gradient(var(--ctx-line) 1px, transparent 1px);
  background-size: 4px 4px;
}

.pattern_cross {
  background-color: var(--ctx-fill);
  background-image:
    repeating-linear-gradient(45deg, transparent 0 3px, var(--ctx-line) 3px 4px),
    repeating-linear-gradient(-45deg, transparent 0 3px, var(--ctx-line) 3px 4px);
}

.pattern_checker {
  background-color: var(--ctx-fill);
  background-image:
    linear-gradient(45deg, var(--ctx-line) 25%, transparent 25%),
    linear-gradient(-45deg, var(--ctx-line) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--ctx-line) 75%),
    linear-gradient(-45deg, transparent 75%, var(--ctx-line) 75%);
  background-position: 0 0, 0 2px, 2px -2px, -2px 0;
  background-size: 4px 4px;
}
```

This is the most important implementation change. The CSS no longer needs `.kind_system`, `.kind_result`, or `.kind_active` rules. It only needs reusable pattern renderers.

### CSS variable conversion helper

```typescript
export function contextVisualStyleToCssVars(style: ContextVisualStyle): React.CSSProperties {
  return {
    '--ctx-fill': style.fill,
    '--ctx-line': style.line ?? style.stroke ?? 'var(--mac-border)',
    '--ctx-stroke': style.stroke ?? 'var(--mac-border)',
    '--ctx-label': style.labelColor ?? 'var(--mac-text)',
    '--ctx-stroke-width': `${style.strokeWidth ?? 1}px`,
    ...(style.vars ?? {}),
  } as React.CSSProperties;
}
```

---

## Legend API Redesign

### Removed legend API

The current API asks for hardcoded kinds:

```typescript
<ContextLegend kinds={['system', 'result', 'active']} mode="pattern" />
```

This API should be deleted. Do not keep it as a convenience wrapper. The current consumers are small enough to update, and preserving this path would keep the wrong abstraction alive.

### New legend API

The API should be:

```typescript
<ContextLegend
  items={styleSet.legend}
  styles={styleSet.styles}
  size="md"
  selectedId="evidence"
/>
```

Proposed props:

```typescript
export interface ContextLegendProps extends HTMLAttributes<HTMLDivElement> {
  items: ContextLegendItemSpec[];
  styles: Record<string, ContextVisualStyle>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  selectedId?: string;
}
```

Resolution rules:

1. `items` and `styles` are required.
2. Each `item.id` resolves to `styles[item.styleKey ?? item.id]`.
3. Unknown style ids are implementation errors and should be surfaced in development/Storybook.
4. Legend ordering comes from `item.order` and array order, not from a global enum.

### Swatch atom redesign

Replace `ContextKindSwatch` with `ContextStyleSwatch`. Do not keep `ContextKindSwatch` as a wrapper.

```typescript
export interface ContextStyleSwatchProps extends HTMLAttributes<HTMLSpanElement> {
  style: ContextVisualStyle;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  selected?: boolean;
}
```

The generic swatch knows only how to draw a style. It does not know about `kind`, `ContextPartKind`, `mode`, or global registries.

---

## Widget IR Impact

This requirement matters even more in the widget system because widget props are the contract between server-produced UI and client-rendered UI. If the server wants to send a diagram with three labels, the IR must be able to carry those three labels and their styles.

### Current widget props are too narrow

Current `ContextDiagramPanelWidgetProps`:

```typescript
export interface ContextDiagramPanelWidgetProps extends BaseWidgetProps {
  snapshot: ContextWindowSnapshot;
  initialView?: ContextDiagramView;
  selectedPartId?: string;
  views?: ContextDiagramView[];
  showLegend?: boolean;
  legendKinds?: ContextPartKind[];
  legendMode?: ContextDiagramStyle;
  showPartDetails?: boolean;
}
```

The problematic fields are `legendKinds?: ContextPartKind[]` and `legendMode?: ContextDiagramStyle`. They assume the legend vocabulary is the built-in enum.

### Revised widget props

Make `styleSet: ContextStyleSet` required for context diagram widgets. This is a hard cutover: remove `legendKinds`, `legendMode`, and `mode` from Widget IR context diagram props.

```typescript
export interface ContextDiagramPanelWidgetProps extends BaseWidgetProps {
  snapshot: ContextWindowSnapshot;
  styleSet: ContextStyleSet;
  initialView?: ContextDiagramView;
  selectedPartId?: string;
  views?: ContextDiagramView[];
  showLegend?: boolean;
  showPartDetails?: boolean;
}
```

For lower-level diagrams:

```typescript
export interface ContextStripDiagramWidgetProps extends BaseWidgetProps {
  snapshot: ContextWindowSnapshot;
  styleSet: ContextStyleSet;
  selectedPartId?: string;
  showLabels?: boolean;
}
```

The widget adapter simply passes `styleSet` through:

```typescript
export const contextDiagramPanelWidget = defineWidget<ContextDiagramPanelWidgetProps>({
  type: 'ContextDiagramPanel',
  module: 'context_window.dsl',
  render: (props) => (
    <ContextDiagramPanel
      snapshot={props.snapshot}
      initialView={props.initialView}
      selectedPartId={props.selectedPartId}
      views={props.views}
      showLegend={props.showLegend}
      showPartDetails={props.showPartDetails}
      styleSet={props.styleSet}
      className={props.className}
    />
  ),
});
```

### Widget IR example: three labels, custom styles

```typescript
component('ContextDiagramPanel', {
  snapshot: {
    id: 'turn-42-rag-answer',
    title: 'Turn 42 context window',
    limit: 32000,
    selectedPartId: 'retrieved-docs',
    parts: [
      { id: 'prompt', label: 'Prompt', styleKey: 'prompt', tokens: 1400 },
      { id: 'retrieved-docs', label: 'Evidence', styleKey: 'evidence', tokens: 9200 },
      { id: 'answer-draft', label: 'Draft', styleKey: 'answer', tokens: 1800 },
      { id: 'free', label: 'Free', styleKey: 'free', tokens: 19600 },
    ],
  },
  initialView: 'strip',
  styleSet: {
    legendSize: 'md',
    swatchSize: 'md',
    legend: [
      { id: 'prompt', label: 'Prompt scaffolding' },
      { id: 'evidence', label: 'Retrieved evidence' },
      { id: 'answer', label: 'Answer draft' },
      { id: 'free', label: 'Free space', hidden: true },
    ],
    styles: {
      prompt: { pattern: 'checker', fill: '#DDE6F2', line: '#4F74A8', stroke: '#141214' },
      evidence: { pattern: 'stipple', fill: '#E9DCE6', line: '#9C527E', stroke: '#141214' },
      answer: { pattern: 'solid', fill: '#9C527E', labelColor: '#fff', stroke: '#141214' },
      free: { pattern: 'none', fill: '#F2EEF2', stroke: '#C0B5C1', labelColor: '#776C7A' },
    },
  },
});
```

This is the API shape the user is asking for: the caller supplies the labels, the data, and the styles.

---

## Storybook Requirements

The Storybook work should prove three things:

1. All stories use `styleKey` and `styleSet`; none use `kind`, `legendKinds`, `legendMode`, or `mode`.
2. A custom three-label diagram renders without any built-in kind assumptions.
3. The same custom layout can be shown under different palette/style sets.

### Story 1: Converted existing context-window fixtures

Update the existing `contextWindowSnapshots` so every part uses `styleKey`. Render them with an explicit `styleSet` that contains labels/styles for the old categories (`system`, `context`, `result`, etc.) as ordinary string keys. This proves the cutover can support current content without preserving the old API.

### Story 2: Custom three-label diagram

Render a snapshot with `styleKey: 'prompt' | 'evidence' | 'answer' | 'free'` and a matching `styleSet`. Do not use `kind` at all in this story. This is the acceptance test for the new API.

### Story 3: Same layout, switched style sets

Render the same three-label snapshot under several style sets:

```typescript
const styleSets = [dustyThreeLabelSet, signalOrangeThreeLabelSet, slateCoralThreeLabelSet];

export const SameDiagramDifferentStyleSets = {
  render: () => (
    <DashboardGrid recipe="twoColumn">
      {styleSets.map((styleSet) => (
        <ContextDiagramPanel
          key={styleSet.id}
          snapshot={threeLabelSnapshot}
          initialView="strip"
          views={['strip']}
          styleSet={styleSet}
        />
      ))}
    </DashboardGrid>
  ),
};
```

This is more important than a global theme provider story because it exercises the actual required API: per-diagram label/style configuration.

---

## Implementation Plan

### Phase A: Introduce generic visual types and helpers

Files:

- `src/context/types.ts`
- `src/context/styles.ts` (new)
- `src/context/index.ts`

Add:

- `ContextPatternName`
- `ContextVisualStyle`
- `ContextLegendItemSpec`
- `ContextStyleSet`
- `getPartStyleKey(part)`
- `resolveContextVisualStyle(styleKey, styleSet)`
- `contextVisualStyleToCssVars(style)`
- `createContextStyleSetFromPalette(palette, entries)`

### Phase B: Replace kind-specific CSS with pattern-specific CSS

Files:

- `ContextStripDiagram.module.css`
- `ContextStackDiagram.module.css`
- `ContextBudgetBar.module.css`
- `ContextTreemap.module.css`
- `ContextStyleSwatch.module.css` (new)

Replace `.kind_*` rendering rules with `.pattern_*` rules and CSS vars.

Because this is a hard cutover, delete the old `.kind_*` selectors in the same change that updates the components. Do not leave a parallel compatibility layer.

### Phase C: Update diagram component props

Files:

- `ContextStripDiagram.tsx`
- `ContextStackDiagram.tsx`
- `ContextBudgetBar.tsx`
- `ContextTreemap.tsx`
- `ContextDiagramPanel.tsx`

Add required `styleSet: ContextStyleSet` and use required `styleKey` resolution for each part.

### Phase D: Redesign legend and swatch

Files:

- `ContextLegend.tsx`
- `ContextLegend.module.css`
- `ContextStyleSwatch.tsx` (new)
- remove `ContextKindSwatch.tsx` and its widget adapter

Make `ContextLegend` render `items + styles` only. Remove `kinds`, `mode`, `compact`, and `selectedKind` props.

### Phase E: Update Widget IR and registry adapters

Files:

- `src/widgets/ir.ts`
- `ContextDiagramPanel.widget.tsx`
- all context diagram widget adapters

Add required `styleSet: ContextStyleSet` to context diagram widget prop interfaces and pass through. Remove `legendKinds`, `legendMode`, `mode`, `ContextKindSwatch`, and `ContextPartKind` imports from widget contracts.

### Phase F: Add Storybook coverage

Files:

- `ContextDiagramPanel.configurable-legend.stories.tsx` (new)
- update `WidgetRenderer.context-diagrams.stories.tsx`

Add:

- custom three-label diagram story,
- same diagram with multiple style sets,
- Widget IR example using `styleSet`.

---

## Decision Records

### DR-1: Required `styleKey` replaces `ContextPartKind`

**Decision:** Remove `kind` from context diagram segment styling and require `styleKey: string` on `ContextWindowPart`.

**Why:** Expanding or preserving `ContextPartKind` would continue the hardcoding problem. The caller needs arbitrary labels per diagram, not a larger enum or a wrapper around the old enum.

**Consequence:** Existing fixtures and consumers must be updated immediately. Diagram components should not fall back to built-in kinds.

### DR-2: Generic pattern classes instead of `.kind_*` CSS

**Decision:** Replace kind-specific CSS selectors with generic `.pattern_*` selectors plus CSS variables.

**Why:** The number of labels/styles is caller-defined. CSS cannot anticipate arbitrary keys such as `prompt`, `evidence`, or `answer`. Pattern names are finite; style ids are not.

**Consequence:** Components must set CSS variables per segment. This is a good tradeoff: CSS keeps pattern rendering, TypeScript owns style resolution.

### DR-3: `ContextStyleSet` is the required diagram styling contract

**Decision:** Use required `ContextStyleSet` as the per-diagram API. A provider can still exist later for broad page theming, but it is not required for this cutover and should not carry compatibility behavior.

**Why:** A provider is good for broad theming, but it does not solve configurable legends. The user wants to specify "these are my labels and styles" for a specific diagram. That belongs in diagram props and Widget IR.

**Consequence:** Context diagram components and widgets must require `styleSet` wherever a diagram is rendered.

### DR-4: Remove old kind widgets and registries instead of wrapping them

**Decision:** Delete `ContextKindSwatch`, `legendKinds`, `legendMode`, `.kind_*` CSS selectors, and hardcoded `ContextPartKind` diagram style registries from the context diagram path.

**Why:** Wrappers preserve the wrong mental model and create two APIs to test. The current consumers can be updated, so there is no product reason to keep the old path.

**Consequence:** The implementation is simpler after the cutover: one style resolution path, one legend API, one swatch component, and one generic pattern CSS grammar.

---

## What the Previous Designer Should Learn

This is constructive feedback, not blame. The earlier work moved in the right visual direction, but it optimized for the wrong abstraction boundary.

### Good instinct: reuse existing patterns

Keeping halftone was the right call. The visual language matters, and colored pattern lines are more expressive than flat fills.

### Missed abstraction: kind is not style

The biggest mistake was treating `ContextPartKind` as the permanent styling abstraction. A kind is a semantic hint; a legend item is a presentation contract; a style is a rendering rule. Those should be separate.

When designing UI primitives, ask:

- Is this value domain data?
- Is this value presentation data?
- Is this value a lookup key?
- Is this value controlled by the server/caller or by the component library?

If one field answers all four questions, it is probably doing too much.

### Missed product requirement: callers need local vocabularies

A context-window visualizer may be used for many different explanations. Sometimes the canonical 15 kinds are right. Sometimes a workshop slide needs only three categories. Sometimes an evaluation report needs labels like `trusted`, `unsupported`, and `hallucinated`. The component should support those local vocabularies without changing global source code.

### Better next-time pattern

Start from the caller's desired sentence:

> "I have N labels. Here is the data. Here is how each label should look."

Then design the API that directly represents that sentence:

```typescript
<ContextDiagramPanel
  snapshot={data}
  styleSet={{ legend: labels, styles }}
/>
```

Only after the external contract is clear should implementation details like CSS variables and providers be chosen.

---

## Acceptance Criteria

The implementation should be considered correct when all of these pass:

1. No context diagram component prop interface exposes `kind`, `ContextPartKind`, `legendKinds`, `legendMode`, or `mode` for styling.
2. Every `ContextWindowPart` in fixtures and stories uses required `styleKey`.
3. Every context diagram render path receives a `styleSet`.
4. `ContextLegend` renders exactly the labels supplied by `styleSet.legend`.
5. `ContextLegend` has no `kinds` or `selectedKind` props.
6. `ContextStyleSwatch` replaces `ContextKindSwatch`; no compatibility wrapper remains.
7. Palette size is flexible: 3 entries, 6 entries, and 15 entries all work.
8. The same snapshot can be rendered under multiple `ContextStyleSet` objects in Storybook.
9. The Widget IR can carry `styleSet` as JSON-compatible data.
10. The CSS does not need new `.kind_*` selectors for new labels; old `.kind_*` selectors are removed from migrated diagram CSS.
11. Colored styles preserve halftone patterns rather than replacing them with flat fills.
12. `2026-05-27--rag-evaluation-system/` and `ClubMedMeetup/` builds/stories are updated to the new API in the same branch.

---

## Revised File Reference Index

| File | Change |
|------|--------|
| `src/context/types.ts` | Replace `kind` with required `styleKey: string`; move/remove `ContextPartKind` from context diagram contracts |
| `src/context/styles.ts` | New: `ContextVisualStyle`, `ContextStyleSet`, strict style resolution helpers, palette-to-style-set helpers |
| `src/context/kinds.ts` | Remove from diagram rendering path or delete if unused after cutover |
| `src/components/molecules/ContextLegend/ContextLegend.tsx` | Required `items + styles` API only; remove `kinds`, `mode`, `compact`, `selectedKind` |
| `src/components/atoms/ContextStyleSwatch/ContextStyleSwatch.tsx` | New generic style swatch |
| `src/components/atoms/ContextKindSwatch/ContextKindSwatch.tsx` | Delete component and widget adapter |
| `ContextStripDiagram.tsx` | Require `styleSet`, use required `styleKey`, generic pattern class, CSS vars |
| `ContextStackDiagram.tsx` | Same |
| `ContextBudgetBar.tsx` | Same |
| `ContextTreemap.tsx` | Same |
| `ContextDiagramPanel.tsx` | Require `styleSet`, pass to diagrams and legend |
| `src/widgets/ir.ts` | Add required JSON-compatible `ContextStyleSet` props; remove `ContextPartKind`, `legendKinds`, `legendMode`, `mode` from context diagram widget props |
| `*.widget.tsx` adapters | Pass required `styleSet`; remove ContextKindSwatch registration |
| `src/context/fixtures.ts` | Convert all parts from `kind` to `styleKey`; add style sets used by stories |
| `ContextDiagramPanel.configurable-legend.stories.tsx` | New story for custom three-label legend and multi-style-set showcase |
| `WidgetRenderer.context-diagrams.stories.tsx` | Update Widget IR examples to required `styleSet` |

---

## Bottom Line

The next version should not be "hardcoded kinds, but prettier." It should be a small visual grammar:

```text
segment.styleKey  ──►  styleSet.styles[styleKey]  ──►  generic pattern renderer
styleSet.legend   ──►  legend labels + swatches
```

That grammar can represent the original context-window vocabulary as ordinary style keys, but it does not preserve the old enum-driven API. The implementation should be a clean hard cutover: arbitrary caller-defined diagrams with their own legend labels, palette size, and visual styles are the only supported context diagram model.
