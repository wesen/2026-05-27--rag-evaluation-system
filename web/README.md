# RAG Evaluation Web Frontend

This directory contains the original React/Vite RAG Evaluation dashboard. It uses a layered Classic Mac OS-inspired design system and should be treated as a design-system application, not as a collection of one-off screens.

For the newest context-window/course/transcript design analysis, start with:

- [`../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/design-doc/02-context-viewer-design-iteration-analysis.md`](../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/design-doc/02-context-viewer-design-iteration-analysis.md)
- [`../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/index.md`](../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/index.md)

## Commands

```bash
cd web
pnpm dev
pnpm typecheck
pnpm build
pnpm storybook
pnpm build-storybook
```

## Architecture primer

The frontend is organized as layered React components:

```text
styles/tokens.css
  -> foundation primitives
  -> atoms
  -> layout primitives
  -> molecules
  -> organisms
  -> pages
  -> API-aware containers / views
```

Ownership rules:

- **Tokens** own raw values and semantic aliases.
- **Foundation** owns typography, captions, status text, code text, dividers, and accessibility helpers.
- **Atoms** own basic controls such as buttons and inputs.
- **Layout** owns structure: panels, stacks, tabs, scroll regions, app shells, grids, and form rows.
- **Molecules** own reusable data-display patterns such as nav, tables, metadata, query presets, and coverage panels.
- **Organisms** own feature panels with domain-shaped props.
- **Pages** compose organisms into storyable page boundaries.
- **Containers/views** own data fetching, mutations, navigation, and side effects.

Do not add ad-hoc global CSS or inline layout styling when a component layer already owns the behavior.

## Glossary

- **Token** — CSS custom property that defines a design value such as color, font, or spacing. Primary file: `src/styles/tokens.css`.
- **Foundation primitive** — Small reusable presentation primitive for text, status, code, captions, dividers, or accessibility.
- **Atom** — Basic interactive/control component: button, icon button, checkbox row, select, text input, error callout.
- **Layout primitive** — Structure component such as `Panel`, `Stack`, `Inline`, `DashboardGrid`, `ScrollRegion`, `TabList`, or `AppShell`.
- **Molecule** — Reusable data/display pattern that is not tied to a single backend feature, for example `DataTable`, `MetadataGrid`, or `AppNav`.
- **Organism** — Feature-specific panel with domain props and callbacks, for example retrieval result panels or workflow inspector panels.
- **Page boundary** — Storybook-friendly presentational page composition that wires organisms together without owning API calls.
- **Container/view** — API-aware wrapper that owns RTK Query, mutations, routing, and side effects.
- **Widget IR** — JSON-compatible UI tree rendered by the packaged `WidgetRenderer` in `packages/rag-evaluation-site`.
- **Goja Widget DSL** — JavaScript authoring layer in `pkg/widgetdsl` that emits Widget IR; Goja authors data, React renders UI.
- **Context window** — Fixed token budget visible to a model call, composed of system instructions, history, tool results, summaries, scratchpad/generated content, current task, and free/overflow space.
- **Context-window part** — One semantic segment of a context window, such as `system`, `context`, `summary`, `result`, `generated`, `evicted`, `active`, `empty`, or `overflow`.
- **Annotation rail** — Side panel that links transcript messages, context-window parts, diagram comments, or notes to focused source material.

## Contribution checklist

Before adding or refactoring UI:

1. Pick the correct layer. If the concept is reusable, do not hide it inside a page.
2. Prefer existing primitives before creating new components.
3. Keep visual decisions in tokens, foundation, layout, or local CSS Modules according to ownership.
4. Add Storybook coverage for new primitives, molecules, organisms, and presentational pages.
5. Keep API calls and side effects out of presentational components.
6. If exposing a surface to Goja later, first stabilize the React component API; then add high-level Widget IR recipes.

## Reference documents

Current/highest-value references:

- [Styling and Design Reference](../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/02-recovered-documents/01-styling-and-design-reference.md)
- [Widget Hierarchy and Interaction Reference](../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/02-recovered-documents/02-widget-hierarchy-and-interaction-reference.md)
- [Widget DSL Visual Quality Analysis](../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/02-recovered-documents/03-widget-dsl-visual-quality-analysis-and-implementation-guide.md)
- [WidgetRenderer Packaging Architecture](../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/02-recovered-documents/04-widgetrenderer-packaging-architecture-and-implementation-guide.md)
- [Original RAG React Design System Guidelines](../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/02-recovered-documents/05-rag-react-design-system-guidelines.md)
- [Revised RAG Widget DSL Implementation Guide](../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/02-recovered-documents/06-review-and-revised-implementation-guide-for-the-rag-widget-dsl.md)

Context-viewer source bundle:

- [`../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/03-context-viewer-design-iteration/`](../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/03-context-viewer-design-iteration/)
- [Context Viewer Source Map](../ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/04-context-viewer-source-map.md)
