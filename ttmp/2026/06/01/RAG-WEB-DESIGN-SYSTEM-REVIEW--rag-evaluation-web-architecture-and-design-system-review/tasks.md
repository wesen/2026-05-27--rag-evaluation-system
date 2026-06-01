# Tasks

## DONE

- [x] Create RAG-local docmgr ticket with `docmgr --root ttmp`.
- [x] Inspect the React web app source tree.
- [x] Inspect the RTK Query API layer and Redux store.
- [x] Inspect the global CSS/design-system state.
- [x] Inspect Go server, embedded SPA, API route registry, workflow/artifact handlers, and database concepts needed to understand the web app.
- [x] Review prior RAGEVAL web/retrieval/workflow docs for context.
- [x] Run static scans for file size, class usage, inline style pressure, custom events, and missing Storybook/CSS-module/DMETA artifacts.
- [x] Attempt frontend build and record dependency failure.
- [x] Write the intern-facing design/architecture/review report.
- [x] Write the investigation diary.
- [x] Relate key files to the ticket docs.
- [x] Run `docmgr --root ttmp doctor`.
- [x] Upload the report bundle to reMarkable.
- [x] Phase 0: install frontend dependencies and restore a passing local web build baseline.
- [x] Phase 0: add Storybook package scripts/config so component review can start before large refactors.
- [x] Phase 1: extract current retro visual tokens into `web/src/styles/tokens.css`.
- [x] Phase 1: add foundation primitives for text, code identifiers, statuses, dividers, and visually hidden labels.
- [x] Phase 1: add layout primitives for panels, stacks, inline toolbars, and dashboard grid recipes.
- [x] Phase 2: start Storybook immediately with co-located foundation primitive stories.
- [x] Phase 2: start Storybook immediately with co-located layout primitive stories.
- [x] Phase 2: validate the new Storybook setup with `pnpm build-storybook`.

## TODO

- [ ] Phase 2 follow-up: add Storybook stories for extracted Search Workbench organisms (`SearchControlsPanel`, `RetrievalResultsPanel`, `ResultInspectorPanel`, `CoveragePanel`).
- [ ] Phase 2 follow-up: split `SearchView.tsx` into page/organism/molecule components while preserving behavior.
- [ ] Phase 2 follow-up: add stories for loading, empty, BM25, vector, hybrid, sparse coverage, and selected-result inspector states.
- [ ] Phase 3: add initial `dmeta-ir` core/interaction/Web MDS YAML for the Search Workbench vertical slice.
