# Changelog

## 2026-06-04

- Initial workspace created


## 2026-06-04

Created WidgetRenderer packaging design guide, research logbook, and diary with evidence from RAG, goja-site, and go-go-goja

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/design-doc/01-widgetrenderer-packaging-architecture-and-implementation-guide.md — Primary intern-facing design guide
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/reference/01-research-logbook.md — Resource usefulness/staleness logbook
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/reference/02-diary.md — Chronological work diary


## 2026-06-04

Validated WIDGETSITE-PACKAGING docs and uploaded reMarkable bundle after fixing Pandoc escape issue in diary prompt

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/reference/02-diary.md — Records validation
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/tasks.md — Marks upload and success-output verification complete


## 2026-06-04

Implemented first packaging slice by moving widget.dsl to public pkg/widgetdsl and adding a go-go-goja RuntimeModuleSpec registrar

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetdsl/module.go — Public Goja Widget IR helper module
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetdsl/module_test.go — Tests for aliases
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetdsl/registrar.go — Runtime registrar for engine.NewBuilder composition


## 2026-06-04

Implemented pkg/widgetrunner for trusted script loading, exports.pages page execution, fallback exports.page, and minimal Widget IR validation

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetrunner/runner.go — Runner implementation
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetrunner/runner_test.go — Runner behavior tests


## 2026-06-04

Updated npm plan to single @go-go-golems/rag-evaluation-site package with trusted publishing guidance, then implemented pkg/widgetserver APIs and frontend modes

### Related Files

- /home/manuel/code/wesen/go-go-golems/go-go-parc/Projects/2026/06/01/ARTICLE - Trusted npm Publishing for Go Go Golems React Packages.md — Trusted publishing reference that changed npm packaging plan
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetserver/server.go — Widgetserver implementation
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetserver/server_test.go — Widgetserver tests


## 2026-06-04

Step 9: scaffolded packages/rag-evaluation-site as @go-go-golems/rag-evaluation-site with renderer exports, useWidgetPage, default app entrypoint, dist publish preparation, pack smoke, and clean consumer smoke

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/package.json — Package exports and validation scripts
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/scripts/consumer-smoke.mjs — Clean consumer package validation
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/app/App.tsx — Default Widget IR app


## 2026-06-04

Step 10: added pkg/defaultspa to embed the built default app, wired widgetserver embedded mode to serve it by default, and added sync/defaultspa validation

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/scripts/sync-defaultspa.mjs — Build artifact sync
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/defaultspa/spa.go — Embedded default SPA handler
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetserver/server.go — Embedded frontend mode now defaults to defaultspa


## 2026-06-04

Step 11: added Widget IR schema/versioning, Goja server actions, frontend action POST/refresh behavior, and embedded Playwright smoke validation

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/app/App.tsx — Frontend action handling
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetrunner/runner.go — Action runtime
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetschema/schema.go — Schema/versioning
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/scripts/03-widgetsite-smoke-server.go — Browser smoke harness

