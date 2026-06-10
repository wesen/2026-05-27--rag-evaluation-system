---
title: "Goja DSL StyleSet Cutover"
doc_type: design-doc
status: active
intent: long-term
topics: [frontend, theming, context-window, visualization]
ticket: CTX-COLOR-PALETTE
created: "2026-06-09"
owners: []
---

# Goja DSL StyleSet Cutover

## Executive Summary

The React context-window diagram API is moving from hardcoded `kind` / `ContextPartKind` styling to caller-defined `styleKey` plus required `ContextStyleSet`. The Goja DSL must emit the same contract. This document defines the JavaScript-facing API for `require("context_window.dsl")` after the hard cutover.

The key rule is simple: every context diagram emitted by the DSL must carry:

1. `snapshot.parts[].styleKey`, and
2. `props.styleSet` with `legend` and `styles` entries.

No Goja helper should emit `kind`, `legendKinds`, `legendMode`, `mode`, or `ContextKindSwatch`.

---

## Problem Statement

`pkg/widgetdsl/module.go` currently exposes generic component helpers such as `contextWindow.contextDiagramPanel({ snapshot, initialView })`. Because helpers copy props through, Goja authors can currently build context snapshots with `kind: "conversation"` and omit any style definition. That becomes invalid after the React hard cutover.

The DSL therefore needs convenience helpers so JS authors can create valid style sets without hand-writing large nested JSON objects every time.

---

## Proposed JavaScript API

### Generic helpers

Add these exports to `context_window.dsl`:

```javascript
const contextWindow = require("context_window.dsl")

const styleSet = contextWindow.styleSet({
  id: "rag-three",
  name: "RAG Three Labels",
  legendSize: "md",
  swatchSize: "md",
  legend: [
    contextWindow.legendItem("prompt", "Prompt scaffolding"),
    contextWindow.legendItem("evidence", "Retrieved evidence"),
    contextWindow.legendItem("answer", "Answer draft"),
  ],
  styles: {
    prompt: contextWindow.visualStyle({ pattern: "checker", fill: "#DDE6F2", line: "#4F74A8" }),
    evidence: contextWindow.visualStyle({ pattern: "stipple", fill: "#E9DCE6", line: "#9C527E" }),
    answer: contextWindow.visualStyle({ pattern: "solid", fill: "#9C527E", labelColor: "#fff" }),
  },
})
```

Helper behavior:

- `visualStyle(options)` returns a plain object containing `pattern`, `fill`, `line`, `stroke`, `labelColor`, `dashed`, `dotted`, `strokeWidth`, and `vars` when supplied.
- `legendItem(id, label, options?)` returns `{ id, label, ...options }`.
- `styleSet(options)` validates/coerces `legend` and `styles` shape lightly and returns a plain JSON object. It does not inject built-in kinds.
- `contextPart(id, label, styleKey, tokens, options?)` returns a context window part with required `styleKey`.
- `contextSnapshot(options)` returns a snapshot with `parts` normalized through `contextPart`-compatible objects.

### Palette convenience helper

Add one convenience helper for the four preferred palettes:

```javascript
const set = contextWindow.paletteStyleSet({
  palette: "Dusty Magenta / Blue",
  entries: [
    { id: "prompt", label: "Prompt", accent: "b", pattern: "checker" },
    { id: "evidence", label: "Evidence", accent: "a", pattern: "stipple" },
    { id: "answer", label: "Answer", accent: "a", pattern: "solid" },
  ],
})
```

This helper is optional sugar over `styleSet`. It should return a normal `ContextStyleSet` object so React sees no difference.

---

## Recipe Cutover

`contextWindow.recipes.contextDiagram(options)` must require or create a style set:

```javascript
contextWindow.recipes.contextDiagram({
  snapshot,
  styleSet,
  view: "budget",
})
```

Rules:

1. If `options.styleSet` exists, pass it through.
2. Else if `options.palette` and `options.entries` exist, build `paletteStyleSet(options)`.
3. Else throw a Goja error explaining that `styleSet` is required.

No recipe should silently create legacy built-in kind styles.

---

## Widget IR Shape

The emitted IR should look like:

```json
{
  "kind": "component",
  "type": "ContextDiagramPanel",
  "props": {
    "snapshot": {
      "id": "ctx",
      "title": "Window",
      "limit": 1000,
      "parts": [
        { "id": "prompt", "label": "Prompt", "styleKey": "prompt", "tokens": 300 }
      ]
    },
    "styleSet": {
      "legend": [{ "id": "prompt", "label": "Prompt" }],
      "styles": {
        "prompt": { "pattern": "checker", "fill": "#DDE6F2", "line": "#4F74A8" }
      }
    },
    "initialView": "budget"
  }
}
```

---

## Tests

Update `pkg/widgetdsl/module_test.go`:

1. Assert `contextWindow.contextKindSwatch` is undefined.
2. Assert `contextWindow.styleSet`, `legendItem`, `visualStyle`, `contextPart`, and `contextSnapshot` are functions.
3. Update all snapshots in tests from `kind` to `styleKey`.
4. Assert `contextWindow.recipes.contextDiagram({ snapshot, styleSet })` emits `props.styleSet`.
5. Add a negative test: calling the recipe without `styleSet` and without palette entries throws a useful error.

---

## Implementation Notes

Keep the Go implementation simple. These helpers can return `map[string]any` and reuse existing `exportObject`, `anySlice`, and `mergeOptions` utilities. They do not need a dedicated Go domain package because they are JSON object constructors, not business logic.

Use lowerCamelCase JS fields to match Widget IR: `styleKey`, `labelColor`, `strokeWidth`, `legendSize`, `swatchSize`.

---

## Acceptance Criteria

- Goja DSL emits no `kind` fields in context diagram examples/tests.
- Goja DSL exposes style-set construction helpers.
- Context diagram recipe requires `styleSet` or enough palette information to construct one.
- Go tests cover helper exports, JSON shape, and missing-styleSet error.
- React Widget IR stories and Goja DSL tests use the same `styleSet` contract.
