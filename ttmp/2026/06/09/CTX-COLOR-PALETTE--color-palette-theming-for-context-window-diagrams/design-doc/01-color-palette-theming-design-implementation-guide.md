---
title: "Color Palette Theming — Design & Implementation Guide"
doc_type: design-doc
status: active
intent: long-term
topics: [frontend, theming, context-window, visualization]
ticket: CTX-COLOR-PALETTE
created: "2026-06-09"
owners: []
---

# Color Palette Theming for Context Window Diagrams

## Executive Summary

The context window visualization subsystem in `@go-go-golems/rag-evaluation-site` currently renders diagram segments using only **black ink, blue accent, and CSS halftone patterns** (diagonal lines, stipple dots, checkerboards). While this monochrome approach is elegant in print, it makes it **hard to distinguish segment kinds at a glance** — especially when multiple kinds appear in the same diagram.

This document proposes adding a **color palette theming layer** that works **on top of the existing halftone pattern system** — not replacing it. In color mode, each segment keeps its halftone pattern (diagonal lines, stipple, checkerboard, cross-hatch) but the pattern lines are drawn in the palette's accent color instead of black ink, and the fill behind the pattern gets a light tint of the same accent. The result is **colored halftone**: the texture that makes the monochrome mode elegant, now made legible through color.

The design is driven by the `macos1_subtle_color_palettes.json` palette collection (stored in `sources/`). The user's preferred palettes — **Signal Orange / Cyan**, **Slate / Coral**, **Cobalt / Sand**, and **Dusty Magenta / Blue** — use complementary accent pairs that map cleanly to the semantic categories in a context window (system, retrieval, generated, active, etc.).

The implementation is scoped to the **four context diagram molecules** and their supporting atoms, with no changes to layout, data flow, or the widget registry. A new `'color'` mode joins the existing `'pattern' | 'tone' | 'outline'` modes, making this strictly additive.

---

## Problem Statement

### What we have today

Every context diagram — strip, stack, budget bar, and treemap — renders segment fills using one of three approaches, selected via the `mode` prop on each component:

| Mode | How it looks | Problem |
|------|-------------|---------|
| `pattern` (default) | White fill + CSS halftone pattern (diagonal lines, stipple, checkerboard) in `var(--mac-border)` color | Many kinds share the same pattern (e.g., `retrieval`, `tool`, `result` all use stipple). Hard to tell apart at small sizes. |
| `tone` | Grayscale fills from `#fff` to `#6a6a6a` | Better contrast but still monochrome. Still hard to distinguish adjacent kinds without reading the label. |
| `outline` | White fill + varying border widths and dash patterns | Good for print, but low visual impact on screen. |

The `active` kind is the only one that uses color (`CONTEXT_ACCENT = #0000CC`, a strong blue). Everything else is achromatic.

### What we need

- **Distinct, legible colors** for each of the 15 `ContextPartKind` values.
- Colors that are **complementary** — adjacent segments in a diagram should be clearly distinguishable without clashing.
- **Colored halftone** — keep the pattern textures (diagonal, stipple, checker) but color the pattern lines and tint the fill behind them.
- A **theming mechanism** so the palette can be swapped (e.g., for accessibility, dark mode, or branding).
- **No regression** in the existing pattern/tone/outline modes.

---

## Current-State Architecture

This section walks through every file and concept you need to understand to implement this feature. Read it end-to-end before writing any code.

### Directory layout (relevant paths)

```
packages/rag-evaluation-site/src/
├── context/                          # Domain types and visual specs
│   ├── types.ts                      # TypeScript type definitions
│   ├── kinds.ts                      # Visual spec registry (fills, patterns, colors)
│   ├── fixtures.ts                   # Example data (ContextWindowSnapshot, etc.)
│   └── index.ts                      # Barrel re-export
├── components/
│   ├── atoms/
│   │   └── ContextKindSwatch/        # Small colored square showing a kind's visual
│   ├── molecules/
│   │   ├── ContextStripDiagram/      # Horizontal strip view
│   │   ├── ContextStackDiagram/      # Vertical stack view
│   │   ├── ContextBudgetBar/         # Budget bar with headroom indicator
│   │   ├── ContextTreemap/           # Area-proportional treemap
│   │   └── ContextLegend/            # Legend of kind swatches + labels
│   └── organisms/
│       └── ContextDiagramPanel/      # Orchestrator: view switcher + diagram + legend
├── theme.css                         # CSS custom properties (design tokens)
└── styles.css                        # Global base styles
```

### The data model (`context/types.ts`)

The core data type is `ContextWindowSnapshot` — a snapshot of what's in an LLM's context window at a given turn:

```typescript
// A single segment of the context window
interface ContextWindowPart {
  id: string;           // e.g., 't14-file-reads'
  label: string;        // e.g., 'file reads'
  kind: ContextPartKind; // e.g., 'result'
  tokens: number;       // e.g., 38600
  note?: string;
  contentPreview?: string;
  metadata?: Record<string, JsonValue>;
}

// A complete snapshot of the window at a point in time
interface ContextWindowSnapshot {
  id: string;            // e.g., 't14'
  title: string;         // e.g., 'Turn 14 — deep in the bug'
  subtitle?: string;
  limit: number;         // e.g., 200_000 (token budget)
  parts: ContextWindowPart[];
  selectedPartId?: string;
}
```

The `ContextPartKind` union type has 15 members:

```typescript
type ContextPartKind =
  | 'system'       // System instructions + tool schemas
  | 'instruction'  // Developer/user instructions
  | 'context'      // Project context (CLAUDE.md, repo map)
  | 'conversation' // Chat history turns
  | 'summary'      // Compressed/rolling summary of old turns
  | 'retrieval'    // Retrieved documents (RAG chunks)
  | 'tool'         // Tool call requests
  | 'result'       // Tool call results (file reads, test output)
  | 'generated'    // LLM reasoning / scratchpad
  | 'annotation'   // Human annotations on context
  | 'course'       // Course material (workshop slides)
  | 'evicted'      // Dropped/compressed turns
  | 'active'       // The current task (always pinned)
  | 'empty'        // Unused budget space
  | 'other';       // Catch-all
```

### The visual spec system (`context/kinds.ts`)

This is the **most important file to understand**. It maps each `ContextPartKind` to a visual specification:

```typescript
interface ContextKindVisualSpec {
  fill: string;         // Background color or CSS variable
  stroke: string;       // Border color
  label: string;        // Text color for labels inside the segment
  name: string;         // Human-readable kind name
  dashed?: boolean;     // Dashed border?
  dotted?: boolean;     // Dotted border?
  inner?: boolean;      // Inset double border?
  strokeWidth?: number; // Border width
  pattern?: 'checker' | 'diagonal' | 'diagonalDense' | 'stipple' | 'cross' | 'overflow';
}
```

There are **three spec registries** — one per mode:

1. `patternSpecs` — The default. Uses CSS patterns for fills.
2. `toneOverrides` — Solid grayscale fills (`#dddddd` to `#6a6a6a`).
3. `outlineOverrides` — White fill with varying border treatments.

The `getContextKindSpec(kind, mode)` function merges the base spec with the appropriate override:

```typescript
function getContextKindSpec(kind: ContextPartKind, mode: ContextDiagramStyle = 'pattern'): ContextKindVisualSpec {
  const normalized = isContextPartKind(kind) ? kind : 'other';
  const base = patternSpecs[normalized];
  if (mode === 'tone') return { ...base, ...toneOverrides[normalized] };
  if (mode === 'outline') return { ...base, ...outlineOverrides[normalized] };
  return base; // 'pattern' mode
}
```

**Key insight for the implementation:** We need to add a **fourth registry** — `colorOverrides` — and extend `getContextKindSpec` to handle `mode === 'color'`.

### The diagram components

All four diagram molecules follow the same pattern:

1. Accept `snapshot: ContextWindowSnapshot` and `mode?: ContextDiagramStyle`.
2. Iterate over `snapshot.parts`.
3. For each part, compute `styles['kind_' + part.kind]` to get the CSS class.
4. The CSS class applies a fill (pattern, solid, etc.) via `background`.
5. Labels inside segments use `spec.label` color via inline styles or CSS variables.

The CSS modules all define `.kind_*` classes with `background` properties. For example, from `ContextStripDiagram.module.css`:

```css
.kind_system, .kind_instruction {
  background: repeating-linear-gradient(45deg, var(--mac-border) 0 1px, var(--mac-surface) 1px 4px);
}
.kind_retrieval, .kind_tool, .kind_result {
  background: radial-gradient(var(--mac-border) 1px, var(--mac-surface) 1px);
  background-size: 4px 4px;
}
.kind_active { background: var(--mac-accent); }
```

### The CSS custom property system (`theme.css`)

The design tokens are defined as CSS custom properties on `:root`:

```css
:root {
  --mac-accent: #0000CC;     /* The only color used today */
  --mac-border: #000000;     /* Black — used for all pattern lines */
  --mac-surface: #ffffff;    /* White fill */
  --mac-text: #1d232a;       /* Primary text */
  --mac-text-dim: #68727d;   /* Muted text */
  --mac-border-subtle: #d8dde3;
  /* ... */
}
```

**Key insight:** The current system has no concept of per-kind color tokens. We need to add a set of `--rag-context-color-<kind>` variables.

---

## Palette Source Material

The `sources/macos1_subtle_color_palettes.json` file contains 16 palettes. Each palette has this structure:

```json
{
  "name": "Signal Orange / Cyan",
  "mood": "warm terminal + cool selection",
  "colors": {
    "paper": "#F5F1E8",
    "ink": "#141414",
    "grid": "#BDB7AA",
    "shadow": "#7E7A72",
    "accent_a": "#D86F2A",
    "accent_b": "#2EA6A6",
    "accent_c": "#F0B45A"
  },
  "use": "Orange for alerts/active states; cyan for links, cursor, selection."
}
```

The palette structure uses a **paper / ink / grid / shadow** base with **2–3 accent colors**. This is a good match for our system because:

- `paper` maps to `--mac-surface` (background)
- `ink` maps to `--mac-border` / `--mac-text`
- `grid` maps to `--mac-border-subtle`
- `shadow` maps to `--mac-text-dim`
- `accent_a` / `accent_b` / `accent_c` are the distinguishing colors per kind

### User's preferred palettes

The four palettes the user likes best, and why they work well for context diagrams:

#### 1. Signal Orange / Cyan

| Role | Hex | Visual |
|------|-----|--------|
| accent_a (orange) | `#D86F2A` | Warm, attention-grabbing |
| accent_b (cyan) | `#2EA6A6` | Cool, calm |
| accent_c (gold) | `#F0B45A` | Soft highlight |

**Why it works:** Orange and cyan are complementary (warm vs cool). Orange can mark active/retrieval, cyan can mark system/instruction.

#### 2. Slate / Coral

| Role | Hex | Visual |
|------|-----|--------|
| accent_a (slate) | `#5F7F89` | Neutral, authoritative |
| accent_b (coral) | `#C46A55` | Warm interruption |
| accent_c (ice) | `#D8E0DF` | Pale background |

**Why it works:** Slate is restrained and modern (macOS feel). Coral pops for active/evicted. The palette feels "professional tool" rather than "data viz toy."

#### 3. Cobalt / Sand

| Role | Hex | Visual |
|------|-----|--------|
| accent_a (cobalt) | `#315D91` | Deep, technical |
| accent_b (sand) | `#D2A84A` | Warm accent |
| accent_c (steel) | `#A8B8CC` | Muted blue-grey |

**Why it works:** Cobalt is a classic "technical atlas" blue. Sand provides warm contrast. Steel works as a soft fill for large areas.

#### 4. Dusty Magenta / Blue (favorite)

| Role | Hex | Visual |
|------|-----|--------|
| accent_a (magenta) | `#9C527E` | Rich, agent-like |
| accent_b (blue) | `#4F74A8` | Machine state |
| accent_c (mauve) | `#D6B8CB` | Soft background |

**Why it works:** The user specifically called this one out as the best because **magenta and blue are complementary** and naturally map to the human/agent vs machine distinction in context windows. Magenta marks agent-generated content (summary, generated, annotation), blue marks machine/system content (system, instruction, retrieval). This dual-axis coding is exactly what the diagrams need.

---

## Color-to-Kind Mapping Strategy

The core design challenge is assigning colors to the 15 `ContextPartKind` values using only 2–3 accent colors from a palette, **while preserving the halftone pattern textures**. We solve this with a **colored halftone** approach: each segment keeps its pattern (diagonal, stipple, checker, etc.) but the pattern lines are drawn in the palette's accent color and the fill behind the pattern gets a light tint of the same color.

The key CSS trick is that every halftone pattern in the current system uses `var(--mac-border)` (black) for the pattern lines and `var(--mac-surface)` (white) for the gaps. In color mode, we replace these with palette-aware tokens:

```css
/* BEFORE (monochrome) */
.kind_system {
  background: repeating-linear-gradient(
    45deg, var(--mac-border) 0 1px, var(--mac-surface) 1px 4px
  );
}

/* AFTER (colored halftone) */
[data-mode='color'] .kind_system {
  background: repeating-linear-gradient(
    45deg, var(--rag-context-line-system) 0 1px, var(--rag-context-fill-system) 1px 4px
  );
}
```

The result looks like the original halftone texture but in color — diagonal stripes of blue on a pale blue wash, stipple dots of magenta on a pink tint, etc.

### Three-tier system

We still use three visual tiers, but now each tier specifies both a **line color** (for the pattern marks) and a **fill color** (for the background behind the pattern):

#### Tier 1: Full-saturation accent halftone (strongest visual weight)

These kinds get the palette's accent colors at full saturation for both pattern lines and fill. The pattern is clearly visible and the color is unmistakable:

| Kind | Pattern | Line color | Fill color | Signal Orange | Dusty Magenta |
|------|---------|-----------|-----------|---------------|---------------|
| `active` | solid (no pattern) | — | `accent_a` full | solid orange | solid magenta |
| `system` | checker | `accent_b` | `accent_b` @ 20% tint | cyan checker on pale cyan | blue checker on pale blue |
| `generated` | diagonal-dense | `accent_c` | `accent_c` @ 25% tint | gold lines on pale gold | mauve lines on pale mauve |
| `evicted` | cross-hatch | `accent_b` @ 70% | `accent_b` @ 15% tint | dark cyan cross on pale cyan | dark blue cross on pale blue |

#### Tier 2: Tinted halftone (medium visual weight)

These kinds get the accent colors at reduced saturation. Pattern lines are drawn at ~50–60% of the accent, fills are ~15–25% tinted:

| Kind | Pattern | Line color | Fill color |
|------|---------|-----------|-----------|
| `instruction` | checker | `accent_b` @ 55% | `accent_b` @ 18% tint |
| `retrieval` | stipple | `accent_a` @ 60% | `accent_a` @ 20% tint |
| `tool` | stipple | `accent_a` @ 50% | `accent_a` @ 15% tint |
| `result` | stipple | `accent_a` @ 55% | `accent_a` @ 18% tint |
| `summary` | diagonal | `accent_b` @ 55% | `accent_b` @ 18% tint |

#### Tier 3: Neutral with subtle tint (lowest visual weight)

These kinds stay close to the paper color with barely-there tints and no strong pattern lines:

| Kind | Pattern | Line color | Fill color |
|------|---------|-----------|-----------|
| `context` | none (plain) | `grid` | `paper` |
| `conversation` | none (plain) | `grid` | `paper` |
| `annotation` | diagonal | `accent_c` @ 40% | `paper` |
| `course` | none (plain) | `grid` | `paper` |
| `empty` | none (plain) | `grid` @ 50% | `paper` @ 72% opacity |
| `other` | none (plain) | `grid` | `paper` |

### How colored halftone works in CSS

The key CSS trick: every pattern is built from two colors — the **line color** (the dots, dashes, or stripes) and the **gap color** (the background between lines). In monochrome mode both are fixed (black + white). In color mode, we parameterize both:

```css
/* Colored halftone for retrieval (stipple) */
[data-mode='color'] .kind_retrieval {
  background-color: var(--rag-context-fill-retrieval);   /* tinted background */
  background-image: radial-gradient(
    var(--rag-context-line-retrieval) 1px,               /* colored dots */
    transparent 1px
  );
  background-size: 4px 4px;
}

/* Colored halftone for system (checker) */
[data-mode='color'] .kind_system {
  background-color: var(--rag-context-fill-system);
  background-image:
    linear-gradient(45deg, var(--rag-context-line-system) 25%, transparent 25%),
    linear-gradient(-45deg, var(--rag-context-line-system) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--rag-context-line-system) 75%),
    linear-gradient(-45deg, transparent 75%, var(--rag-context-line-system) 75%);
  background-position: 0 0, 0 2px, 2px -2px, -2px 0;
  background-size: 4px 4px;
}

/* Colored halftone for summary (diagonal) */
[data-mode='color'] .kind_summary {
  background-color: var(--rag-context-fill-summary);
  background-image: repeating-linear-gradient(
    45deg, var(--rag-context-line-summary) 0 1px, transparent 1px 6px
  );
}
```

Each kind gets **two CSS custom properties**: `--rag-context-line-<kind>` for the pattern marks and `--rag-context-fill-<kind>` for the tinted background. This gives us fine-grained control over both the pattern texture and its color.

The `color-mix()` CSS function (Chrome 111+, Firefox 113+, Safari 16.2+) is used for tints in the token definitions. If you need to support older browsers, pre-compute the mixed hex values.

---

## Proposed Solution

### Step 1: Extend `ContextDiagramStyle` type

**File:** `src/context/types.ts`

```typescript
// BEFORE:
export type ContextDiagramStyle = 'pattern' | 'tone' | 'outline';

// AFTER:
export type ContextDiagramStyle = 'pattern' | 'tone' | 'outline' | 'color';
```

### Step 2: Define CSS custom properties for palette colors

**File:** `src/theme.css` — add after the existing `--mac-*` variables.

Every kind gets **two** tokens: `--rag-context-line-<kind>` for the halftone pattern marks (dots, stripes, checks) and `--rag-context-fill-<kind>` for the tinted background behind the pattern. This is what makes the colored halftone work — the pattern texture stays, but both its colors are now parameterized.

```css
:root {
  /* ─── Context diagram palette tokens ─── */
  /* Default palette: Dusty Magenta / Blue */
  --rag-context-paper: #F2EEF2;
  --rag-context-ink: #141214;
  --rag-context-grid: #C0B5C1;
  --rag-context-shadow: #776C7A;
  --rag-context-accent-a: #9C527E;   /* magenta — agent, active, generated */
  --rag-context-accent-b: #4F74A8;   /* blue — machine, system, retrieval */
  --rag-context-accent-c: #D6B8CB;   /* mauve — soft highlight */

  /* ─── Per-kind halftone line tokens (pattern marks) ─── */
  /* Tier 1: full-saturation accent */
  --rag-context-line-active: transparent;        /* solid fill, no pattern */
  --rag-context-line-system: var(--rag-context-accent-b);
  --rag-context-line-generated: var(--rag-context-accent-c);
  --rag-context-line-evicted: color-mix(in srgb, var(--rag-context-accent-b) 70%, var(--rag-context-paper));

  /* Tier 2: reduced-saturation pattern marks */
  --rag-context-line-instruction: color-mix(in srgb, var(--rag-context-accent-b) 55%, var(--rag-context-paper));
  --rag-context-line-retrieval: color-mix(in srgb, var(--rag-context-accent-a) 60%, var(--rag-context-paper));
  --rag-context-line-tool: color-mix(in srgb, var(--rag-context-accent-a) 50%, var(--rag-context-paper));
  --rag-context-line-result: color-mix(in srgb, var(--rag-context-accent-a) 55%, var(--rag-context-paper));
  --rag-context-line-summary: color-mix(in srgb, var(--rag-context-accent-b) 55%, var(--rag-context-paper));

  /* Tier 3: barely-there lines */
  --rag-context-line-annotation: color-mix(in srgb, var(--rag-context-accent-c) 40%, var(--rag-context-paper));
  --rag-context-line-context: var(--rag-context-grid);
  --rag-context-line-conversation: var(--rag-context-grid);
  --rag-context-line-course: var(--rag-context-grid);
  --rag-context-line-empty: color-mix(in srgb, var(--rag-context-grid) 50%, var(--rag-context-paper));
  --rag-context-line-other: var(--rag-context-grid);

  /* ─── Per-kind fill tokens (background behind pattern) ─── */
  /* Tier 1 */
  --rag-context-fill-active: var(--rag-context-accent-a);
  --rag-context-fill-system: color-mix(in srgb, var(--rag-context-accent-b) 20%, var(--rag-context-paper));
  --rag-context-fill-generated: color-mix(in srgb, var(--rag-context-accent-c) 25%, var(--rag-context-paper));
  --rag-context-fill-evicted: color-mix(in srgb, var(--rag-context-accent-b) 15%, var(--rag-context-paper));

  /* Tier 2 */
  --rag-context-fill-instruction: color-mix(in srgb, var(--rag-context-accent-b) 18%, var(--rag-context-paper));
  --rag-context-fill-retrieval: color-mix(in srgb, var(--rag-context-accent-a) 20%, var(--rag-context-paper));
  --rag-context-fill-tool: color-mix(in srgb, var(--rag-context-accent-a) 15%, var(--rag-context-paper));
  --rag-context-fill-result: color-mix(in srgb, var(--rag-context-accent-a) 18%, var(--rag-context-paper));
  --rag-context-fill-summary: color-mix(in srgb, var(--rag-context-accent-b) 18%, var(--rag-context-paper));

  /* Tier 3 */
  --rag-context-fill-context: var(--rag-context-paper);
  --rag-context-fill-conversation: var(--rag-context-paper);
  --rag-context-fill-annotation: var(--rag-context-paper);
  --rag-context-fill-course: var(--rag-context-paper);
  --rag-context-fill-empty: var(--rag-context-paper);
  --rag-context-fill-other: var(--rag-context-paper);

  /* ─── Per-kind label color tokens ─── */
  --rag-context-label-active: #ffffff;
  --rag-context-label-system: #ffffff;
  --rag-context-label-generated: var(--rag-context-ink);
  --rag-context-label-evicted: #ffffff;
  --rag-context-label-default: var(--rag-context-ink);
}
```

Note how Tier 1 kinds get full-saturation line colors and visible tints behind them, while Tier 3 kinds keep the `grid` color for lines and plain `paper` for fills. This graduated approach keeps the visual hierarchy clear while making every kind distinguishable.

### Step 3: Add `colorOverrides` to `context/kinds.ts`

**File:** `src/context/kinds.ts`

The key change from the original design: **we keep the `pattern` field** from the base `patternSpecs` instead of clearing it with `pattern: undefined`. The color mode overrides only the `fill` and adds a new `lineColor` property — the pattern texture itself stays.

First, add a `lineColor` field to the `ContextKindVisualSpec` interface:

```typescript
export interface ContextKindVisualSpec {
  fill: string;
  stroke: string;
  label: string;
  name: string;
  dashed?: boolean;
  dotted?: boolean;
  inner?: boolean;
  narrow?: boolean;
  thin?: boolean;
  strokeWidth?: number;
  pattern?: 'checker' | 'diagonal' | 'diagonalDense' | 'stipple' | 'cross' | 'overflow';
  lineColor?: string;  // ◄── NEW: color for halftone pattern marks in color mode
}
```

Then add the `colorOverrides` constant. Notice: **no `pattern: undefined`** — the base pattern is preserved:

```typescript
const colorOverrides: Partial<Record<ContextPartKind, Partial<ContextKindVisualSpec>>> = {
  // Tier 3: neutral (no pattern or barely visible)
  empty:        { fill: 'var(--rag-context-fill-empty)', lineColor: 'var(--rag-context-line-empty)', stroke: 'var(--rag-context-grid)', dashed: true, label: 'var(--rag-context-shadow)' },
  context:      { fill: 'var(--rag-context-fill-context)', lineColor: 'var(--rag-context-line-context)', stroke: 'var(--rag-context-grid)', label: 'var(--rag-context-ink)' },
  conversation: { fill: 'var(--rag-context-fill-conversation)', lineColor: 'var(--rag-context-line-conversation)', stroke: 'var(--rag-context-grid)', label: 'var(--rag-context-ink)' },
  course:       { fill: 'var(--rag-context-fill-course)', lineColor: 'var(--rag-context-line-course)', stroke: 'var(--rag-context-grid)', label: 'var(--rag-context-ink)' },
  other:        { fill: 'var(--rag-context-fill-other)', lineColor: 'var(--rag-context-line-other)', stroke: 'var(--rag-context-grid)', label: 'var(--rag-context-ink)' },

  // Tier 2: tinted halftone
  instruction:  { fill: 'var(--rag-context-fill-instruction)', lineColor: 'var(--rag-context-line-instruction)', stroke: 'var(--rag-context-ink)', label: 'var(--rag-context-ink)' },
  summary:      { fill: 'var(--rag-context-fill-summary)', lineColor: 'var(--rag-context-line-summary)', stroke: 'var(--rag-context-ink)', label: 'var(--rag-context-ink)' },
  retrieval:    { fill: 'var(--rag-context-fill-retrieval)', lineColor: 'var(--rag-context-line-retrieval)', stroke: 'var(--rag-context-ink)', label: 'var(--rag-context-ink)' },
  tool:         { fill: 'var(--rag-context-fill-tool)', lineColor: 'var(--rag-context-line-tool)', stroke: 'var(--rag-context-ink)', label: 'var(--rag-context-ink)' },
  result:       { fill: 'var(--rag-context-fill-result)', lineColor: 'var(--rag-context-line-result)', stroke: 'var(--rag-context-ink)', label: 'var(--rag-context-ink)' },
  annotation:   { fill: 'var(--rag-context-fill-annotation)', lineColor: 'var(--rag-context-line-annotation)', stroke: 'var(--rag-context-accent-c)', label: 'var(--rag-context-ink)' },

  // Tier 1: full-saturation accent halftone
  system:       { fill: 'var(--rag-context-fill-system)', lineColor: 'var(--rag-context-line-system)', stroke: 'var(--rag-context-ink)', label: 'var(--rag-context-label-system)' },
  generated:    { fill: 'var(--rag-context-fill-generated)', lineColor: 'var(--rag-context-line-generated)', stroke: 'var(--rag-context-ink)', label: 'var(--rag-context-label-generated)' },
  evicted:      { fill: 'var(--rag-context-fill-evicted)', lineColor: 'var(--rag-context-line-evicted)', stroke: 'var(--rag-context-ink)', label: 'var(--rag-context-label-evicted)' },
  active:       { fill: 'var(--rag-context-fill-active)', stroke: 'var(--rag-context-ink)', label: 'var(--rag-context-label-active)' },  // solid fill, no lineColor needed
};
```

Then extend `getContextKindSpec`:

```typescript
export function getContextKindSpec(kind: ContextPartKind | string, mode: ContextDiagramStyle = 'pattern'): ContextKindVisualSpec {
  const normalized = isContextPartKind(kind) ? kind : 'other';
  const base = patternSpecs[normalized];
  if (mode === 'tone') {
    return { ...base, ...toneOverrides[normalized], stroke: toneOverrides[normalized]?.stroke ?? CONTEXT_INK };
  }
  if (mode === 'outline') {
    return { ...base, ...outlineOverrides[normalized], stroke: outlineOverrides[normalized]?.stroke ?? CONTEXT_INK };
  }
  if (mode === 'color') {
    // IMPORTANT: we do NOT clear the pattern field here.
    // The base patternSpecs pattern is preserved; only fill/lineColor/label are overridden.
    return { ...base, ...colorOverrides[normalized], stroke: colorOverrides[normalized]?.stroke ?? CONTEXT_INK };
  }
  return base;
}
```

The `ContextKindSwatch` component can then use `spec.lineColor` to set the pattern mark color via a CSS variable, which the CSS modules consume.
```

### Step 4: Add colored-halftone CSS rules to each diagram module

For each of the four diagram CSS modules, add a `data-mode="color"` variant that re-creates the halftone pattern using the palette's line and fill tokens instead of black-and-white.

The pattern for each kind of halftone:

| Pattern | CSS technique | Color mode variant |
|---------|-------------|-------------------|
| Checker | 4× `linear-gradient` at 45° | Replace `var(--mac-border)` with `var(--rag-context-line-<kind>)`, add `background-color: var(--rag-context-fill-<kind>)` |
| Diagonal | `repeating-linear-gradient(45deg)` | Same substitution |
| Diagonal-dense | `repeating-linear-gradient(45deg, ... 3px)` | Same substitution |
| Stipple | `radial-gradient` + `background-size: 4px 4px` | Same substitution |
| Cross | Two `repeating-linear-gradient` at ±45° | Same substitution |
| Solid (active) | Plain `background-color` | Use fill token directly |

**Example for `ContextStripDiagram.module.css`:**

```css
/* ─── Color mode: colored halftone ─── */

/* Tier 1: full-saturation accent patterns */
[data-mode='color'] .kind_system {
  background-color: var(--rag-context-fill-system);
  background-image:
    linear-gradient(45deg, var(--rag-context-line-system) 25%, transparent 25%),
    linear-gradient(-45deg, var(--rag-context-line-system) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--rag-context-line-system) 75%),
    linear-gradient(-45deg, transparent 75%, var(--rag-context-line-system) 75%);
  background-position: 0 0, 0 2px, 2px -2px, -2px 0;
  background-size: 4px 4px;
}
[data-mode='color'] .kind_system .label { color: var(--rag-context-label-system); }

[data-mode='color'] .kind_instruction {
  background-color: var(--rag-context-fill-instruction);
  background-image:
    linear-gradient(45deg, var(--rag-context-line-instruction) 25%, transparent 25%),
    linear-gradient(-45deg, var(--rag-context-line-instruction) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--rag-context-line-instruction) 75%),
    linear-gradient(-45deg, transparent 75%, var(--rag-context-line-instruction) 75%);
  background-position: 0 0, 0 2px, 2px -2px, -2px 0;
  background-size: 4px 4px;
}

[data-mode='color'] .kind_generated {
  background-color: var(--rag-context-fill-generated);
  background-image: repeating-linear-gradient(
    45deg, var(--rag-context-line-generated) 0 1px, transparent 1px 3px
  );
}

/* Tier 1: evicted — cross-hatch in dark accent */
[data-mode='color'] .kind_evicted {
  background-color: var(--rag-context-fill-evicted);
  background-image:
    repeating-linear-gradient(45deg, transparent 0 3px, var(--rag-context-line-evicted) 3px 4px),
    repeating-linear-gradient(-45deg, transparent 0 3px, var(--rag-context-line-evicted) 3px 4px);
}
[data-mode='color'] .kind_evicted .label { color: var(--rag-context-label-evicted); background: transparent; }

/* Tier 2: tinted halftone */
[data-mode='color'] .kind_retrieval,
[data-mode='color'] .kind_tool,
[data-mode='color'] .kind_result {
  background-color: var(--rag-context-fill-result);
  background-image: radial-gradient(
    var(--rag-context-line-result) 1px, transparent 1px
  );
  background-size: 4px 4px;
}
[data-mode='color'] .kind_retrieval {
  background-color: var(--rag-context-fill-retrieval);
  background-image: radial-gradient(var(--rag-context-line-retrieval) 1px, transparent 1px);
}
[data-mode='color'] .kind_tool {
  background-color: var(--rag-context-fill-tool);
  background-image: radial-gradient(var(--rag-context-line-tool) 1px, transparent 1px);
}

[data-mode='color'] .kind_summary,
[data-mode='color'] .kind_annotation {
  background-color: var(--rag-context-fill-summary);
  background-image: repeating-linear-gradient(
    45deg, var(--rag-context-line-summary) 0 1px, transparent 1px 7px
  );
}
[data-mode='color'] .kind_annotation {
  background-color: var(--rag-context-fill-annotation);
  background-image: repeating-linear-gradient(
    45deg, var(--rag-context-line-annotation) 0 1px, transparent 1px 7px
  );
}

/* Tier 1: active — solid fill (no pattern) */
[data-mode='color'] .kind_active { background: var(--rag-context-fill-active); }
[data-mode='color'] .kind_active .label { color: var(--rag-context-label-active); background: transparent; }

/* Tier 3: neutral (paper fill, grid border) */
[data-mode='color'] .kind_context,
[data-mode='color'] .kind_conversation,
[data-mode='color'] .kind_course,
[data-mode='color'] .kind_other { background: var(--rag-context-fill-context); }

[data-mode='color'] .kind_empty {
  background: var(--rag-context-fill-empty);
  opacity: .72;
}
```

The same CSS pattern applies to `ContextStackDiagram.module.css`, `ContextBudgetBar.module.css`, and `ContextTreemap.module.css`. The only difference is that `ContextBudgetBar` uses shorter segment heights and `ContextTreemap` uses tile boxes — but the `[data-mode='color']` rules are identical.
[data-mode='color'] .kind_result,
[data-mode='color'] .kind_generated,
[data-mode='color'] .kind_annotation,
[data-mode='color'] .kind_course,
[data-mode='color'] .kind_evicted,
[data-mode='color'] .kind_active,
[data-mode='color'] .kind_empty,
[data-mode='color'] .kind_other {
  background: var(--rag-context-fill-default, var(--mac-surface));
}

[data-mode='color'] .kind_active { background: var(--rag-context-fill-active); }
[data-mode='color'] .kind_active .label { color: var(--rag-context-label-active); background: transparent; }

[data-mode='color'] .kind_system { background: var(--rag-context-fill-system); }
[data-mode='color'] .kind_system .label { color: var(--rag-context-label-system); }

[data-mode='color'] .kind_generated { background: var(--rag-context-fill-generated); }

[data-mode='color'] .kind_retrieval { background: var(--rag-context-fill-retrieval); }
[data-mode='color'] .kind_tool { background: var(--rag-context-fill-tool); }
[data-mode='color'] .kind_result { background: var(--rag-context-fill-result); }

[data-mode='color'] .kind_summary { background: var(--rag-context-fill-summary); }
[data-mode='color'] .kind_instruction { background: var(--rag-context-fill-instruction); }

[data-mode='color'] .kind_evicted { background: var(--rag-context-fill-evicted); }
[data-mode='color'] .kind_evicted .label { color: var(--rag-context-label-evicted); background: transparent; }

[data-mode='color'] .kind_empty { background: var(--rag-context-fill-empty); opacity: 0.72; }

/* Neutral kinds keep paper fill, just clean borders */
[data-mode='color'] .kind_context,
[data-mode='color'] .kind_conversation,
[data-mode='color'] .kind_course,
[data-mode='color'] .kind_other { background: var(--rag-context-fill-context); }
```

### Step 5: Wire color mode into `ContextDiagramPanel`

**File:** `src/components/organisms/ContextDiagramPanel/ContextDiagramPanel.tsx`

The `ContextDiagramPanel` already accepts a `legendMode` prop and passes `mode` to child diagrams. No structural change needed — just make sure the mode selector includes `'color'`:

```typescript
// In the view switcher buttons, include 'color' as an option.
// The existing Button-based switcher just needs 'color' in the views array.
const defaultViews: ContextDiagramView[] = ['strip', 'stack', 'budget', 'treemap'];
// Mode selection can be added as a separate control (see Step 6).
```

### Step 6: Add a palette selector (optional, Phase 2)

For Phase 1, we hardcode the Dusty Magenta / Blue palette as the default `'color'` mode. Phase 2 can add:

- A `ContextPaletteSelect` component that reads from `macos1_subtle_color_palettes.json`.
- A React context (`PaletteProvider`) that sets the CSS custom properties on a wrapper `<div>`.
- Palette-specific per-kind overrides (each palette may need slightly different tint ratios).

Pseudocode for the palette provider:

```typescript
// src/context/palette.tsx (Phase 2)
const PALETTES: Record<string, PaletteDefinition> = loadPalettes();

function PaletteProvider({ palette, children }) {
  const vars = useMemo(() => paletteToCssVars(PALETTES[palette]), [palette]);
  return <div style={vars}>{children}</div>;
}

function paletteToCssVars(p: PaletteColors): React.CSSProperties {
  return {
    '--rag-context-paper': p.paper,
    '--rag-context-ink': p.ink,
    '--rag-context-accent-a': p.accent_a,
    '--rag-context-accent-b': p.accent_b,
    '--rag-context-accent-c': p.accent_c,
    // ...per-kind fills computed via color-mix or pre-computed...
  };
}
```

---

## Palette Switching via CSS

Since the entire color system is built on CSS custom properties, switching palettes is just a matter of overriding the variables on a parent element. No JavaScript state, no React re-renders, no prop drilling.

```css
/* Example: switching to Signal Orange / Cyan palette */
.palette-signal-orange-cyan {
  --rag-context-paper: #F5F1E8;
  --rag-context-ink: #141414;
  --rag-context-accent-a: #D86F2A;  /* orange */
  --rag-context-accent-b: #2EA6A6;  /* cyan */
  --rag-context-accent-c: #F0B45A;  /* gold */
}
```

Any component inside a `div.palette-signal-orange-cyan` will automatically use the orange/cyan fills because the CSS `color-mix()` and `var()` references resolve at computed-value time.

---

## Pre-computed palette swatches (ready to copy)

For browsers that don't support `color-mix()`, here are the pre-computed tint values for each of the four preferred palettes. These are the values you'd use if you need to avoid `color-mix()`.

### Dusty Magenta / Blue (default)

| Kind | Fill | Label color |
|------|------|-------------|
| `active` | `#9C527E` | `#ffffff` |
| `system` | `#4F74A8` | `#ffffff` |
| `generated` | `#D6B8CB` | `#141214` |
| `evicted` | `#8E8FA3` | `#ffffff` |
| `instruction` | `#C2BBD0` | `#141214` |
| `retrieval` | `#C8A8BB` | `#141214` |
| `tool` | `#DCD5DE` | `#141214` |
| `result` | `#D3BFCB` | `#141214` |
| `summary` | `#B9BCCE` | `#141214` |
| `context` | `#F2EEF2` | `#141214` |
| `conversation` | `#F2EEF2` | `#141214` |
| `annotation` | `#F2EEF2` | `#141214` |
| `course` | `#F2EEF2` | `#141214` |
| `empty` | `#F2EEF2` | `#776C7A` |
| `other` | `#F2EEF2` | `#141214` |

### Signal Orange / Cyan

| Kind | Fill | Label color |
|------|------|-------------|
| `active` | `#D86F2A` | `#ffffff` |
| `system` | `#2EA6A6` | `#ffffff` |
| `generated` | `#F0B45A` | `#141414` |
| `evicted` | `#7DB0B0` | `#ffffff` |
| `instruction` | `#B3D4D4` | `#141414` |
| `retrieval` | `#E6B99E` | `#141414` |
| `tool` | `#EFD8C4` | `#141414` |
| `result` | `#EBC9B1` | `#141414` |
| `summary` | `#C4D8D8` | `#141414` |
| `context` | `#F5F1E8` | `#141414` |
| `conversation` | `#F5F1E8` | `#141414` |

### Slate / Coral

| Kind | Fill | Label color |
|------|------|-------------|
| `active` | `#5F7F89` | `#ffffff` |
| `system` | `#C46A55` | `#ffffff` |
| `generated` | `#D8E0DF` | `#111314` |
| `evicted` | `#98AAA8` | `#ffffff` |
| `instruction` | `#D0CEC8` | `#111314` |
| `retrieval` | `#C0B2AE` | `#111314` |
| `tool` | `#DAD6D4` | `#111314` |
| `result` | `#D0C8C4` | `#111314` |
| `summary` | `#C4C8C6` | `#111314` |
| `context` | `#F2F3EF` | `#111314` |
| `conversation` | `#F2F3EF` | `#111314` |

### Cobalt / Sand

| Kind | Fill | Label color |
|------|------|-------------|
| `active` | `#315D91` | `#ffffff` |
| `system` | `#D2A84A` | `#111318` |
| `generated` | `#A8B8CC` | `#111318` |
| `evicted` | `#7A8FA3` | `#ffffff` |
| `instruction` | `#C1C4BA` | `#111318` |
| `retrieval` | `#A3A090` | `#111318` |
| `tool` | `#BCBAAE` | `#111318` |
| `result` | `#B0AE9E` | `#111318` |
| `summary` | `#A8A496` | `#111318` |
| `context` | `#F3EEDC` | `#111318` |
| `conversation` | `#F3EEDC` | `#111318` |

---

## Visual diagram: How color mode works

This ASCII diagram shows the data flow for color mode:

```
┌──────────────────────────────────────────────────────────────────┐
│ theme.css                                                        │
│                                                                  │
│  :root {                                                         │
│    --rag-context-accent-a: #9C527E;   ◄── palette accent A      │
│    --rag-context-accent-b: #4F74A8;   ◄── palette accent B      │
│    --rag-context-fill-active: var(--rag-context-accent-a);       │
│    --rag-context-fill-system: var(--rag-context-accent-b);       │
│    --rag-context-fill-retrieval:                                   │
│      color-mix(in srgb, var(--rag-context-accent-a) 30%,         │
│        var(--rag-context-paper));                                 │
│    ...                                                            │
│  }                                                               │
└─────────────┬────────────────────────────────────────────────────┘
              │ CSS var() resolves at compute time
              ▼
┌──────────────────────────────────────────────────────────────────┐
│ ContextStripDiagram.module.css                                   │
│                                                                  │
│  [data-mode='color'] .kind_active {                              │
│    background: var(--rag-context-fill-active);                    │
│    /* resolves to #9C527E */                                     │
│  }                                                               │
│  [data-mode='color'] .kind_retrieval {                           │
│    background: var(--rag-context-fill-retrieval);                 │
│    /* resolves to ~30% magenta on paper */                       │
│  }                                                               │
└─────────────┬────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────┐
│ ContextStripDiagram.tsx                                          │
│                                                                  │
│  <div data-mode={mode}>   ◄── mode='color'                      │
│    {parts.map(part => (                                           │
│      <div className={styles[`kind_${part.kind}`]}>               │
│        {/* CSS does the rest */}                                 │
│      </div>                                                      │
│    ))}                                                           │
│  </div>                                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Decision Records

### DR-1: CSS custom properties vs. inline styles

**Context:** Color fills can be applied either via CSS classes + custom properties or via inline `style` attributes.

**Options considered:**
1. **CSS custom properties** — Define `--rag-context-fill-*` vars, set them on `:root`, consume them in CSS modules.
2. **Inline styles** — Compute fill colors in `getContextKindSpec()` and pass them as `style={{ background: spec.fill }}`.

**Decision:** CSS custom properties.

**Rationale:** CSS vars enable palette switching without React re-renders. A parent element with a different class can override all vars at once. Inline styles would require prop drilling and wouldn't benefit from CSS cascade.

**Consequences:** Slightly more CSS to write, but much more flexible for theming and palette switching.

### DR-2: `data-mode` attribute vs. CSS class for mode selection

**Context:** The diagram's `mode` needs to be communicated to CSS somehow.

**Options considered:**
1. **`data-mode` attribute** — `<div data-mode="color">`.
2. **CSS class** — `<div className={styles.colorMode}>`.

**Decision:** `data-mode` attribute (already used by existing code).

**Rationale:** All four diagram modules already set `data-mode={mode}` on their root elements. This is the established pattern.

### DR-3: `color-mix()` vs. pre-computed hex values

**Context:** Tier 2 (tinted) fills need accent colors mixed with the paper color.

**Options considered:**
1. **`color-mix(in srgb, ...)`** — Pure CSS, no build step.
2. **Pre-computed hex values** — Compute once, store in palette JSON.
3. **Sass/PostCSS build-time computation** — Use a preprocessor.

**Decision:** Use `color-mix()` with pre-computed fallbacks in palette JSON.

**Rationale:** `color-mix()` is supported in all current browsers. Pre-computed values in the palette JSON serve as a reference and fallback. No build tooling changes needed.

---

## Phased Implementation Plan

### Phase 1: Core color mode (this ticket)

**Scope:** Add `'color'` mode to the four diagram molecules with the Dusty Magenta / Blue palette as default.

**Files to modify (in order):**

1. `src/context/types.ts` — Add `'color'` to `ContextDiagramStyle` union.
2. `src/context/kinds.ts` — Add `lineColor` to `ContextKindVisualSpec`, add `colorOverrides`, extend `getContextKindSpec`.
3. `src/context/palette.ts` — New file. Palette types + `paletteToCssVars()` function.
4. `src/context/ContextPaletteProvider.tsx` — New file. Provider component that scopes CSS vars.
5. `src/context/palettes.json` — Copy of `sources/macos1_subtle_color_palettes.json` for runtime import.
6. `src/theme.css` — Add `--rag-context-line-*`, `--rag-context-fill-*`, and `--rag-context-label-*` custom properties.
7. `src/components/molecules/ContextStripDiagram/ContextStripDiagram.module.css` — Add `[data-mode='color']` colored halftone rules.
8. `src/components/molecules/ContextStackDiagram/ContextStackDiagram.module.css` — Same.
9. `src/components/molecules/ContextBudgetBar/ContextBudgetBar.module.css` — Same.
10. `src/components/molecules/ContextTreemap/ContextTreemap.module.css` — Same.
11. `src/components/atoms/ContextKindSwatch/ContextKindSwatch.module.css` — Add `[data-mode='color']` rules.
12. `src/components/atoms/PaletteSelect/` — New atom. Palette swatch selector.
13. `src/components/organisms/ContextDiagramPanel/ContextDiagramPanel.tsx` — Add mode toggle button + optional `palette` prop.
14. `src/components/organisms/ContextDiagramPanel/ContextDiagramPanel.palettes.stories.tsx` — New story: palette gallery.

**Estimated size:** ~350 lines of CSS, ~180 lines of TypeScript, ~90 lines in theme.css.

### Step 7: Add `ContextPaletteProvider` for runtime theme switching

The provider is a **React component that sets CSS custom properties on a wrapper `<div>`** via inline `style`. It doesn't use React context or state — it's purely a CSS variable scoping mechanism. Any diagram rendered inside the provider's `<div>` automatically inherits the palette's tokens because CSS custom properties cascade through the DOM.

#### Why a provider and not a React context?

React context triggers re-renders. CSS custom properties don't need that — they're resolved by the browser's CSS engine at paint time. The provider simply sets `style` on a wrapper element, and all descendants consume the variables via `var()`. This is:

- **Zero-cost at render time** — no subscribers, no re-renders when the palette changes.
- **Instant** — the browser repaints without React getting involved.
- **Composable** — you can nest providers (outer default, inner override).

#### Palette data type

**New file:** `src/context/palette.ts`

```typescript
/** The raw palette structure from macos1_subtle_color_palettes.json */
export interface PaletteColors {
  paper: string;
  ink: string;
  grid: string;
  shadow: string;
  accent_a: string;
  accent_b: string;
  accent_c: string;
}

export interface PaletteDefinition {
  name: string;
  mood: string;
  colors: PaletteColors;
  use: string;
}

/**
 * Given a PaletteColors, compute all the CSS custom property values
 * that color mode needs. Returns a flat Record of CSS var name → value.
 *
 * This is where the tinting math lives. We pre-compute the tints so
 * the CSS doesn't need color-mix() at runtime — the provider outputs
 * concrete hex values.
 */
export function paletteToCssVars(colors: PaletteColors): Record<string, string> {
  const { paper, ink, grid, shadow, accent_a, accent_b, accent_c } = colors;

  // Helper: mix two hex colors at a given percentage.
  // In production you'd use a proper color library (culori, chroma-js, etc.)
  // or pre-compute these values. For the provider, we'll use color-mix()
  // strings and let the browser resolve them.
  const mix = (color: string, pct: number) =>
    `color-mix(in srgb, ${color} ${pct}%, ${paper})`;

  return {
    // Base palette tokens
    '--rag-context-paper': paper,
    '--rag-context-ink': ink,
    '--rag-context-grid': grid,
    '--rag-context-shadow': shadow,
    '--rag-context-accent-a': accent_a,
    '--rag-context-accent-b': accent_b,
    '--rag-context-accent-c': accent_c,

    // ─── Line tokens (halftone pattern marks) ───
    // Tier 1
    '--rag-context-line-active': 'transparent',  // solid fill, no pattern
    '--rag-context-line-system': accent_b,
    '--rag-context-line-generated': accent_c,
    '--rag-context-line-evicted': mix(accent_b, 70),
    // Tier 2
    '--rag-context-line-instruction': mix(accent_b, 55),
    '--rag-context-line-retrieval': mix(accent_a, 60),
    '--rag-context-line-tool': mix(accent_a, 50),
    '--rag-context-line-result': mix(accent_a, 55),
    '--rag-context-line-summary': mix(accent_b, 55),
    // Tier 3
    '--rag-context-line-annotation': mix(accent_c, 40),
    '--rag-context-line-context': grid,
    '--rag-context-line-conversation': grid,
    '--rag-context-line-course': grid,
    '--rag-context-line-empty': mix(grid, 50),
    '--rag-context-line-other': grid,

    // ─── Fill tokens (background behind pattern) ───
    // Tier 1
    '--rag-context-fill-active': accent_a,
    '--rag-context-fill-system': mix(accent_b, 20),
    '--rag-context-fill-generated': mix(accent_c, 25),
    '--rag-context-fill-evicted': mix(accent_b, 15),
    // Tier 2
    '--rag-context-fill-instruction': mix(accent_b, 18),
    '--rag-context-fill-retrieval': mix(accent_a, 20),
    '--rag-context-fill-tool': mix(accent_a, 15),
    '--rag-context-fill-result': mix(accent_a, 18),
    '--rag-context-fill-summary': mix(accent_b, 18),
    // Tier 3
    '--rag-context-fill-context': paper,
    '--rag-context-fill-conversation': paper,
    '--rag-context-fill-annotation': paper,
    '--rag-context-fill-course': paper,
    '--rag-context-fill-empty': paper,
    '--rag-context-fill-other': paper,

    // ─── Label tokens ───
    '--rag-context-label-active': '#ffffff',
    '--rag-context-label-system': '#ffffff',
    '--rag-context-label-generated': ink,
    '--rag-context-label-evicted': '#ffffff',
    '--rag-context-label-default': ink,
  };
}
```

#### The provider component

**New file:** `src/context/ContextPaletteProvider.tsx`

```typescript
import { type CSSProperties, type ReactNode, useMemo } from 'react';
import { type PaletteColors, paletteToCssVars } from './palette';

export interface ContextPaletteProviderProps {
  palette: PaletteColors;
  children: ReactNode;
}

/**
 * Scopes a set of CSS custom properties to its children.
 *
 * Usage:
 *   <ContextPaletteProvider palette={dustyMagentaColors}>
 *     <ContextDiagramPanel snapshot={snap} legendMode="color" />
 *   </ContextPaletteProvider>
 *
 * The provider renders a plain <div> with inline style overriding
 * all --rag-context-* tokens. Descendant components consume these
 * via var() in their CSS modules. No React context, no re-renders.
 */
export function ContextPaletteProvider({ palette, children }: ContextPaletteProviderProps) {
  const cssVars = useMemo(() => paletteToCssVars(palette) as CSSProperties, [palette]);
  return <div style={cssVars}>{children}</div>;
}
```

That's it. The entire provider is ~15 lines. The `useMemo` ensures the style object is stable across re-renders unless the palette changes.

#### The palette selector atom

**New file:** `src/components/atoms/PaletteSelect/PaletteSelect.tsx`

```typescript
import { type PaletteColors, type PaletteDefinition } from '../../../context/palette';
import styles from './PaletteSelect.module.css';

export interface PaletteSelectProps {
  palettes: PaletteDefinition[];
  value: string;  // palette name
  onChange: (palette: PaletteDefinition) => void;
}

/**
 * A simple row of palette swatch-buttons. Each button shows the
 * palette's accent_a and accent_b colors as a mini preview.
 */
export function PaletteSelect({ palettes, value, onChange }: PaletteSelectProps) {
  return (
    <div className={styles.root} role="radiogroup" aria-label="Color palette">
      {palettes.map((p) => (
        <button
          key={p.name}
          className={[styles.swatch, value === p.name ? styles.selected : ''].join(' ')}
          style={{
            '--swatch-a': p.colors.accent_a,
            '--swatch-b': p.colors.accent_b,
            '--swatch-bg': p.colors.paper,
          } as React.CSSProperties}
          onClick={() => onChange(p)}
          role="radio"
          aria-checked={value === p.name}
          title={`${p.name}: ${p.mood}`}
        />
      ))}
    </div>
  );
}
```

```css
/* PaletteSelect.module.css */
.root { display: flex; gap: 4px; }
.swatch {
  width: 28px; height: 20px;
  border: 1px solid var(--mac-border);
  background:
    linear-gradient(135deg, var(--swatch-a) 50%, var(--swatch-b) 50%);
  cursor: pointer;
}
.swatch:hover { outline: 2px solid var(--mac-accent); outline-offset: 1px; }
.selected { outline: 2px solid var(--mac-accent); outline-offset: 1px; }
```

### Step 8: Wire palette switching into `ContextDiagramPanel`

**File:** `src/components/organisms/ContextDiagramPanel/ContextDiagramPanel.tsx`

Add an optional `palette` prop. When provided, the panel wraps itself in `ContextPaletteProvider`:

```typescript
// New prop on ContextDiagramPanelProps:
palette?: PaletteColors;
```

In the render, conditionally wrap:

```typescript
const content = (
  <Panel title={snapshot.title} ...>
    {/* ...existing content... */}
  </Panel>
);

return palette
  ? <ContextPaletteProvider palette={palette}>{content}</ContextPaletteProvider>
  : content;
```

### Step 9: Storybook showcase — same layout, multiple palettes

This is the most important Storybook story for this feature. It renders the **exact same `ContextDiagramPanel`** four times, each wrapped in a different `ContextPaletteProvider`. This proves the theme switching is purely CSS-driven — same React component, same props, different wrapper.

**New file:** `src/components/organisms/ContextDiagramPanel/ContextDiagramPanel.palettes.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { contextWindowSnapshots } from '../../../context';
import { ContextPaletteProvider } from '../../../context/ContextPaletteProvider';
import type { PaletteDefinition } from '../../../context/palette';
import palettes from '../../../palettes.json';  // or import directly
import { ContextDiagramPanel } from './ContextDiagramPanel';
import { PaletteSelect } from '../../atoms/PaletteSelect';
import { Stack } from '../../layout';

const meta = {
  title: 'Component Library/Organisms/ContextDiagramPanel/Palettes',
  component: ContextDiagramPanel,
} satisfies Meta<typeof ContextDiagramPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

const snapshot = contextWindowSnapshots[1]!;  // deepBug — most interesting

// The four preferred palettes
const preferredPalettes: PaletteDefinition[] = [
  palettes.find(p => p.name === 'Signal Orange / Cyan')!,
  palettes.find(p => p.name === 'Slate / Coral')!,
  palettes.find(p => p.name === 'Cobalt / Sand')!,
  palettes.find(p => p.name === 'Dusty Magenta / Blue')!,
];

/**
 * Interactive story: pick a palette from the swatch bar,
 * see all four diagram views update instantly.
 */
export const InteractivePaletteSwitcher: Story = {
  render: () => {
    const [active, setActive] = useState(preferredPalettes[3]!);  // Dusty Magenta default
    return (
      <Stack gap="md">
        <PaletteSelect
          palettes={preferredPalettes}
          value={active.name}
          onChange={setActive}
        />
        <ContextPaletteProvider palette={active.colors}>
          <ContextDiagramPanel
            snapshot={snapshot}
            legendMode="color"
            initialView="strip"
          />
        </ContextPaletteProvider>
      </Stack>
    );
  },
};

/**
 * Gallery story: all four palettes shown simultaneously,
 * each rendering the same snapshot in the same view.
 */
export const AllPalettesGallery: Story = {
  render: () => (
    <Stack gap="md">
      {preferredPalettes.map((p) => (
        <ContextPaletteProvider key={p.name} palette={p.colors}>
          <ContextDiagramPanel
            snapshot={snapshot}
            legendMode="color"
            initialView="strip"
          />
        </ContextPaletteProvider>
      ))}
    </Stack>
  ),
};

/**
 * Cross-product story: each palette × each view = 16 panels.
 * Best viewed in a 4-column grid.
 */
export const PaletteViewMatrix: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {preferredPalettes.flatMap((p) =>
        (['strip', 'stack', 'budget', 'treemap'] as const).map((view) => (
          <ContextPaletteProvider key={`${p.name}-${view}`} palette={p.colors}>
            <ContextDiagramPanel
              snapshot={snapshot}
              legendMode="color"
              initialView={view}
              views={[view]}
              showLegend={false}
              showPartDetails={false}
            />
          </ContextPaletteProvider>
        ))
      )}
    </div>
  ),
};
```

#### How the Storybook decorator pattern works

If you want **all** context diagram stories (not just the palette-specific ones) to support palette switching, add a global decorator to `.storybook/preview.ts`:

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react-vite';
import { ContextPaletteProvider } from '../src/context/ContextPaletteProvider';
import { useState } from 'react';

const defaultPalette = {
  paper: '#F2EEF2', ink: '#141214', grid: '#C0B5C1',
  shadow: '#776C7A', accent_a: '#9C527E', accent_b: '#4F74A8', accent_c: '#D6B8CB',
};

const preview: Preview = {
  parameters: { layout: 'padded' },
  decorators: [
    (Story, context) => {
      // Only wrap stories that have a `palette` parameter
      const palette = context.parameters?.palette;
      if (!palette) return <Story />;
      return (
        <ContextPaletteProvider palette={palette}>
          <Story />
        </ContextPaletteProvider>
      );
    },
  ],
};

export default preview;
```

Then any story can opt in by setting `parameters: { palette: somePaletteColors }`.

### Phase 3: Dark mode palettes

**Scope:** Add dark-mode variants of each palette with inverted paper/ink and adjusted accent luminance.

---

## Testing and Validation

### Manual testing

1. Open Storybook and navigate to `WidgetRenderer > Context Diagrams`.
2. Toggle the mode selector to `color`.
3. Verify all four views (strip, stack, budget, treemap) render with color fills.
4. Verify labels are readable against their fill colors.
5. Verify selection outline still works (blue `--mac-accent` outline).
6. Switch between palettes (Phase 2) and verify smooth transitions.

### Automated testing

- Add a Storybook story that renders all four diagram views in `color` mode side-by-side.
- Add a chromatic snapshot test for the `color` mode variants.

### Accessibility

- Run a contrast check (WCAG AA) for all label-on-fill combinations.
- The Dusty Magenta palette's `active` (#9C527E) on white labels: contrast ratio ~4.8:1 — passes AA for large text.
- The `system` fill (#4F74A8) on white labels: contrast ratio ~4.5:1 — passes AA.

---

## Risks and Open Questions

1. **`color-mix()` browser support** — Requires Chrome 111+, Firefox 113+, Safari 16.2+. If the app must support older browsers, we need pre-computed hex values in the palette JSON. **Mitigation:** Provide pre-computed values as a fallback (already included above).

2. **Palette-to-kind mapping quality** — The three-tier system (accent / tint / neutral) works well for the four preferred palettes, but may not generalize to all 16 palettes in the JSON. **Mitigation:** Phase 1 only ships the four preferred palettes. General mapping can be refined in Phase 2.

3. **CSS module duplication** — The `[data-mode='color']` rules are nearly identical across all four diagram CSS modules. **Mitigation:** Accept the duplication for now. A shared `context-diagram-color.module.css` mixin file can be extracted later if it grows unwieldy.

4. **Interaction with pattern mode** — The `color` mode **preserves** the base halftone pattern from `patternSpecs` (checker, diagonal, stipple, etc.) and only overrides the fill and line colors via CSS custom properties. The `[data-mode='color']` CSS rules re-create the same pattern shapes using `var(--rag-context-line-<kind>)` instead of `var(--mac-border)`. This should be verified visually — the pattern texture must remain crisp when recolored.

---

## File Reference Index

| File | Role | Lines to change |
|------|------|----------------|
| `src/context/types.ts` | Type definitions | ~1 line (union type) |
| `src/context/kinds.ts` | Visual spec registry | ~55 lines (colorOverrides + `lineColor` field + switch branch) |
| `src/context/palette.ts` | Palette data types + CSS var mapper | ~80 lines (new file) |
| `src/context/ContextPaletteProvider.tsx` | Provider component | ~20 lines (new file) |
| `src/context/palettes.json` | Bundled palette data | Copy of `sources/macos1_subtle_color_palettes.json` |
| `src/theme.css` | Design tokens | ~90 lines (new custom properties) |
| `src/components/molecules/ContextStripDiagram/ContextStripDiagram.module.css` | Strip diagram styles | ~60 lines (colored halftone rules) |
| `src/components/molecules/ContextStackDiagram/ContextStackDiagram.module.css` | Stack diagram styles | ~60 lines (colored halftone rules) |
| `src/components/molecules/ContextBudgetBar/ContextBudgetBar.module.css` | Budget bar styles | ~60 lines (colored halftone rules) |
| `src/components/molecules/ContextTreemap/ContextTreemap.module.css` | Treemap styles | ~60 lines (colored halftone rules) |
| `src/components/atoms/ContextKindSwatch/ContextKindSwatch.module.css` | Swatch styles | ~25 lines (color mode rules) |
| `src/components/atoms/PaletteSelect/PaletteSelect.tsx` | Palette swatch selector | ~30 lines (new file) |
| `src/components/atoms/PaletteSelect/PaletteSelect.module.css` | Selector styles | ~15 lines (new file) |
| `src/components/organisms/ContextDiagramPanel/ContextDiagramPanel.tsx` | Panel orchestrator | ~15 lines (mode toggle + palette prop) |
| `src/components/organisms/ContextDiagramPanel/ContextDiagramPanel.palettes.stories.tsx` | Palette showcase stories | ~100 lines (new file) |
| `sources/macos1_subtle_color_palettes.json` | Palette source data | Read-only reference |
