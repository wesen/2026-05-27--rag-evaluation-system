# Tasks

## TODO

### Hard-cutover architecture

- [ ] Remove `ContextPartKind` from context diagram styling contracts; do not add compatibility wrappers.
- [ ] Replace `ContextWindowPart.kind` with required `ContextWindowPart.styleKey: string` in `packages/rag-evaluation-site/src/context/types.ts`.
- [ ] Update all context-window fixtures in `packages/rag-evaluation-site/src/context/fixtures.ts` so every part uses `styleKey` and no part uses `kind`.
- [ ] Audit `ClubMedMeetup/` for context-window widget usage and update any serialized/widget data from `kind` to `styleKey` plus `styleSet`.
- [ ] Audit `2026-05-27--rag-evaluation-system/` outside `packages/rag-evaluation-site/` for context-window widget usage and update any serialized/widget data from `kind` to `styleKey` plus `styleSet`.

### Generic style model

- [ ] Create `packages/rag-evaluation-site/src/context/styles.ts` with `ContextPatternName`, `ContextVisualStyle`, `ContextLegendItemSpec`, and `ContextStyleSet`.
- [ ] Add strict `resolveContextVisualStyle(styleKey, styleSet)` helper that reports unknown style keys in development/Storybook.
- [ ] Add `contextVisualStyleToCssVars(style)` helper that emits `--ctx-fill`, `--ctx-line`, `--ctx-stroke`, `--ctx-label`, and stroke width CSS variables.
- [ ] Add palette-to-style-set helper(s) for constructing colored-halftone style sets from the imported macOS palette JSON.
- [ ] Remove or isolate `src/context/kinds.ts` from the diagram rendering path; do not keep it as a compatibility preset unless non-diagram code still needs it.

### Generic pattern CSS

- [ ] Replace `.kind_*` CSS selectors in `ContextStripDiagram.module.css` with generic `.pattern_*` selectors.
- [ ] Replace `.kind_*` CSS selectors in `ContextStackDiagram.module.css` with generic `.pattern_*` selectors.
- [ ] Replace `.kind_*` CSS selectors in `ContextBudgetBar.module.css` with generic `.pattern_*` selectors.
- [ ] Replace `.kind_*` CSS selectors in `ContextTreemap.module.css` with generic `.pattern_*` selectors.
- [ ] Ensure generic pattern CSS supports `none`, `solid`, `checker`, `diagonal`, `diagonalDense`, `stipple`, `cross`, and `overflow`.
- [ ] Ensure colored halftone uses `--ctx-line` for pattern marks and `--ctx-fill` for the tinted background.

### Diagram component cutover

- [ ] Update `ContextStripDiagram.tsx` to require `styleSet`, resolve each part by `styleKey`, and render pattern classes plus CSS variables.
- [ ] Update `ContextStackDiagram.tsx` to require `styleSet`, resolve each part by `styleKey`, and render pattern classes plus CSS variables.
- [ ] Update `ContextBudgetBar.tsx` to require `styleSet`, resolve each part by `styleKey`, and render pattern classes plus CSS variables.
- [ ] Update `ContextTreemap.tsx` to require `styleSet`, resolve each part by `styleKey`, and render pattern classes plus CSS variables.
- [ ] Update `ContextDiagramPanel.tsx` to require `styleSet` and pass it to all diagram views and the legend.
- [ ] Remove diagram `mode` props where they only exist to support built-in kind styling.

### Legend and swatch cutover

- [ ] Replace `ContextLegend` props with required `items: ContextLegendItemSpec[]` and `styles: Record<string, ContextVisualStyle>`.
- [ ] Remove `kinds`, `mode`, `compact`, and `selectedKind` props from `ContextLegend`.
- [ ] Create `ContextStyleSwatch` that renders any `ContextVisualStyle` with the same generic pattern CSS.
- [ ] Delete `ContextKindSwatch` and its widget adapter/registry entry.
- [ ] Update `AnnotationBadge` or any other consumer that currently depends on `ContextPartKind` styling to use `ContextVisualStyle` or a caller-provided style entry.

### Widget IR hard cutover

- [ ] Update `src/widgets/ir.ts` so context diagram widget props require `styleSet: ContextStyleSet`.
- [ ] Remove `ContextPartKind`, `legendKinds`, `legendMode`, and diagram `mode` from context diagram widget prop interfaces.
- [ ] Remove `ContextKindSwatch` from `RagWidgetType` and the context-window widget registry.
- [ ] Update `ContextDiagramPanel.widget.tsx` to pass required `styleSet` and remove old legend/mode props.
- [ ] Update `ContextStripDiagram.widget.tsx`, `ContextStackDiagram.widget.tsx`, `ContextBudgetBar.widget.tsx`, and `ContextTreemap.widget.tsx` to pass required `styleSet`.
- [ ] Update `WidgetRenderer.context-diagrams.stories.tsx` examples so every context diagram component includes `styleSet`.

### Goja DSL hard cutover

- [ ] Create/maintain `design-doc/03-goja-dsl-styleset-cutover.md` as the Goja DSL contract for style-set helpers.
- [ ] Remove `contextKindSwatch` from `pkg/widgetdsl` `contextWindowHelpers`.
- [ ] Add `contextWindow.visualStyle(options)` helper returning a JSON-compatible `ContextVisualStyle`.
- [ ] Add `contextWindow.legendItem(id, label, options?)` helper returning a `ContextLegendItemSpec`.
- [ ] Add `contextWindow.styleSet(options)` helper returning a `ContextStyleSet`.
- [ ] Add `contextWindow.contextPart(id, label, styleKey, tokens, options?)` helper returning a `ContextWindowPart` with required `styleKey`.
- [ ] Add `contextWindow.contextSnapshot(options)` helper returning a normalized context window snapshot.
- [ ] Add `contextWindow.paletteStyleSet(options)` helper for preferred palette + entry definitions.
- [ ] Update `contextWindow.recipes.contextDiagram(options)` to require `styleSet` or enough palette data to construct one; throw a useful error otherwise.
- [ ] Update Goja DSL tests so snapshots use `styleKey`, recipe IR includes `styleSet`, and missing `styleSet` errors.
- [ ] Update `pkg/widgetschema/schema.go` component list to remove `ContextKindSwatch` and include `ContextStyleSwatch` if exposed through Widget IR.
- [ ] Update `schema/dsl-modules.yaml` or generated manifests if helper/component ownership metadata changes.

### Storybook and examples

- [ ] Add `ContextDiagramPanel.configurable-legend.stories.tsx` with a custom three-label diagram (`prompt`, `evidence`, `answer`) that uses no `kind` fields.
- [ ] Add a Storybook matrix that renders the same snapshot under Signal Orange / Cyan, Slate / Coral, Cobalt / Sand, and Dusty Magenta / Blue style sets.
- [ ] Update existing `ContextStripDiagram`, `ContextStackDiagram`, `ContextBudgetBar`, `ContextTreemap`, and `ContextDiagramPanel` stories to use explicit `styleSet`.
- [ ] Add a Widget IR story that embeds a JSON-compatible `styleSet` to prove server-provided diagrams can control labels and styles.

### Validation

- [ ] Run `pnpm --dir packages/rag-evaluation-site typecheck` or the repository-equivalent TypeScript validation command.
- [ ] Run `pnpm --dir packages/rag-evaluation-site build-storybook` to verify Storybook compiles with the hard-cutover API.
- [ ] Run repository tests/build commands that cover `ClubMedMeetup/` after updating consumers.
- [ ] Search for remaining forbidden API names: `ContextPartKind`, `ContextKindSwatch`, `legendKinds`, `legendMode`, `.kind_`, and `kind:` in context-window diagram paths.
- [ ] Visually verify colored halftone: patterns remain visible, labels are legible, and swatches match segment rendering.
