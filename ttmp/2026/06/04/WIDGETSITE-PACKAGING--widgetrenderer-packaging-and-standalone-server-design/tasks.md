# Tasks

## Documentation deliverable

- [x] Create docmgr ticket `WIDGETSITE-PACKAGING`.
- [x] Create design document for WidgetRenderer packaging architecture.
- [x] Research RAG frontend/backend, goja-site, and go-go-goja source files.
- [x] Write intern-facing design/implementation guide with diagrams, APIs, pseudocode, decisions, and file references.
- [x] Create research logbook tracking usefulness, stale areas, and update needs for resources read.
- [x] Keep implementation diary while working.
- [x] Relate key files to the ticket documents.
- [x] Update changelog.
- [x] Run `docmgr doctor --ticket WIDGETSITE-PACKAGING --stale-after 30`.
- [x] Upload bundled deliverable to reMarkable.
- [x] Verify reMarkable upload success output.

## Future implementation tasks

- [x] Create single npm package `@go-go-golems/rag-evaluation-site` from `web/src/widgets/*`, renderer components, hooks, CSS, and default app entrypoint.
- [ ] Add renderer registry override API for custom widgets inside `@go-go-golems/rag-evaluation-site`. (Deferred by user.)
- [x] Add self-contained package-level CSS bundle and theme token contract.
- [x] Add default app entrypoint/export inside `@go-go-golems/rag-evaluation-site` and build `app-dist` for Go embedding.
- [x] Add `pkg/defaultspa` to embed the built default app and wire `pkg/widgetserver` embedded mode to it.
- [x] Move RAG `widgetdsl` from `internal/dsl/widgetdsl` to public `pkg/widgetdsl`.
- [x] Add `engine.RuntimeModuleSpec` registrar for `widget.dsl` and `rag.dsl`.
- [x] Implement `pkg/widgetrunner` script loading and `exports.pages[id](ctx)` execution.
- [x] Implement Widget IR validation and JSON Schema/versioning. (`pkg/widgetschema` now exposes versioned summary/JSON Schema and runner validates page schemaVersion.)
- [x] Implement server actions through `exports.actions[name](ctx, payload)` and `POST /api/widget/actions/{name}`.
- [x] Implement `pkg/widgetserver` APIs and frontend modes.
- [x] Run embedded WidgetRenderer Playwright smoke covering page render, server action POST, refresh, and console checks.
- [ ] Add CI/release workflow for `@go-go-golems/rag-evaluation-site`, default SPA generation, Go tests, binary builds, pack smoke, clean consumer smoke, and npm Trusted Publishing. (Package-local pack smoke and clean consumer smoke scripts now exist; workflow wiring remains.)
