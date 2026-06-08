# Tasks

## Phase 0 — Architecture guardrails and acceptance criteria

- [x] Review the earlier RAG widget DSL proposal and identify risks around CSS Module duplication, stateful React widgets, and Go-side HTML mimicry.
- [x] Decide that the first implementation path is Widget IR JSON rendered by the existing React component registry, not server-side HTML mimicry.
- [ ] Record Widget IR invariants in code comments and tests: JSON-serializable, no function-valued props, renderer owns callbacks, unknown widgets fail visibly.
- [ ] Define the minimum vertical slice: hardcoded Widget IR → `WidgetRenderer` → actual React components visible in Storybook.

## Phase 1 — Shared Widget IR schema (Step 1)

- [x] Add `web/src/widgets/ir.ts` with `WidgetNode`, `TextNode`, `ElementNode`, `ComponentNode`, `ActionSpec`, `CellSpec`, table column specs, metadata specs, nav specs, and utility constructors.
- [x] Ensure the schema is JSON-serializable: no function props, no React nodes, no class instances.
- [x] Add type-level documentation explaining how Goja scripts should emit the IR.
- [x] Run `pnpm typecheck` from `web/`.

## Phase 2 — React WidgetRenderer registry (Step 2)

- [x] Add `web/src/widgets/WidgetRenderer.tsx` mapping IR component types to real React components.
- [x] Add `web/src/widgets/cellRenderers.tsx` for serializable `DataTable` cell specifications.
- [x] Add `web/src/widgets/actions.ts` for `ActionSpec` dispatch helpers.
- [x] Add `web/src/widgets/index.ts` barrel exports.
- [x] Support first safe widget set: `Button`, `TextInput`, `SelectInput`, `Caption`, `StatusText`, `Panel`, `Stack`, `Inline`, `DashboardGrid`, `FormRow`, `ScrollRegion`, `TabList`, `MetadataGrid`, `DataTable`, and `AppNav`.
- [x] Render unknown widget/component types as visible error callouts instead of silently failing.
- [x] Run `pnpm typecheck` from `web/`.

## Phase 3 — Tremendous Storybook coverage for Widget IR

- [x] Add `web/src/widgets/WidgetRenderer.stories.tsx` with many combinations that exercise IR rendering without Go or Goja.
- [ ] Stories for primitives: buttons, selected buttons, disabled buttons, text inputs, select inputs, captions, status icons.
- [ ] Stories for layout: nested `Panel`, `Stack`, `Inline`, `DashboardGrid` recipes, `FormRow`, `ScrollRegion`, `TabList`.
- [ ] Stories for data display: `MetadataGrid`, compact metadata, `DataTable` with field cells, number cells, status cells, caption cells, link cells, templates, empty states, selected rows.
- [ ] Stories for page-like compositions: Search Workbench shell, Corpus Explorer skeleton, Workflow dashboard skeleton.
- [ ] Stories for error boundaries: unknown component, unsupported cell kind, malformed props.
- [ ] Add enough fixture data to visually inspect realistic RAG states: sparse coverage, failed workflows, hybrid retrieval components, selected rows, long titles, empty datasets.
- [x] Build Storybook with `pnpm build-storybook`; visual human inspection still pending.

## Phase 4 — Static API demo before Goja

- [x] Add a temporary backend endpoint `GET /api/v1/dsl/pages/demo` returning hardcoded Widget IR.
- [x] Add a `DslPreviewPage` React page that fetches the demo IR and renders it with `WidgetRenderer`.
- [x] Add a top-nav entry or dev-only route for the DSL preview page.
- [x] Add API smoke coverage for the hardcoded demo page.
- [x] Run Pi Playwright browser-tool smoke for the hardcoded demo page and verify rendered DSL preview rows.

## Phase 5 — Goja `widget.dsl` authoring module

- [x] Add `internal/dsl/widgetdsl/module.go` exposing helper functions that produce Widget IR maps.
- [x] Add helpers for primitives and layout: `rag.panel`, `rag.stack`, `rag.button`, `rag.caption`, etc.
- [x] Add cell helper namespace: `rag.cell.field`, `rag.cell.number`, `rag.cell.status`, `rag.cell.caption`, `rag.cell.link`, `rag.cell.template`.
- [ ] Add validation for required props before returning IR.
- [x] Unit-test Goja scripts that emit Widget IR.

## Phase 6 — Page runner and script loading

- [ ] Add `internal/dsl/runner.go` to execute page scripts and call `exports.page(ctx)`.
- [ ] Add script discovery under a controlled project-local directory such as `plugins/dsl/`.
- [ ] Add `GET /api/v1/dsl/pages/{id}` backed by the runner.
- [ ] Add structured errors for script load failure, runtime exception, invalid IR, and unknown page.

## Phase 7 — Action dispatch runtime

- [ ] Implement frontend `ActionSpec` dispatch for `navigate`, `event`, `copy`, and `server` actions.
- [ ] Add backend endpoint `POST /api/v1/dsl/actions/{name}` for server actions.
- [ ] Define payload conventions for row selection, form submission, tab changes, and table actions.
- [ ] Add Storybook stories with mocked `onAction` handlers.

## Phase 8 — Real RAG page recipes

- [ ] Implement `rag.pages.workflowList` first because it is simpler than corpus inspector.
- [ ] Implement `rag.pages.searchWorkbench` with serialized search controls and retrieval result tables.
- [ ] Implement `rag.pages.corpusExplorer` skeleton with identity bar, source table, document browser, and inspector placeholder.
- [ ] Defer full `DocumentInspector` artifacts tab until action dispatch and data-fetching conventions are stable.

## Phase 9 — Testing and review gates

- [x] Typecheck frontend with `pnpm typecheck`.
- [x] Build Storybook with `pnpm build-storybook`.
- [x] Run Go tests with `go test ./... -count=1` after backend work starts.
- [ ] Add visual review notes comparing Widget IR stories against existing component stories.
- [x] Add API smoke tests for the DSL preview page payload and unknown-page behavior.
- [x] Run browser-tool smoke for DSL nav click, `data-rag-page="DslPreviewPage"`, and rendered result rows. (Committed Playwright test-suite setup remains optional future work.)

## Phase 10 — Documentation and reMarkable handoff

- [ ] Keep the implementation diary updated after each phase.
- [ ] Update design docs when architecture decisions change.
- [x] Re-run `docmgr doctor --ticket RAGEVAL-UI-DSL --stale-after 30`.
- [ ] Re-upload the updated bundle to reMarkable after major milestones.
