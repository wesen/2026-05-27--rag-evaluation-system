# Changelog

## 2026-06-02

- Initial workspace created


## 2026-06-02

Created design doc and investigation diary for UI DSL and Kanban DSL integration

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/01-ui-dsl-and-kanban-dsl-design-and-implementation-guide.md — Primary design document


## 2026-06-02

Added example UI DSL and Kanban DSL scripts for document pipeline and workflow operations

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/scripts/example-ui-dsl.js — Example UI DSL script


## 2026-06-02

Wrote RAG Widget DSL design doc with exact component-to-HTML mapping for all 30+ widgets

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/02-rag-widget-dsl-design-component-to-html-mapping.md — Widget DSL design document


## 2026-06-04

Added senior review of previous widget DSL design and revised implementation guide centered on Widget IR plus React renderer

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/03-review-and-revised-implementation-guide-for-the-rag-widget-dsl.md — Review and implementation guide


## 2026-06-04

Implemented Widget IR step 1 and React WidgetRenderer step 2 with Storybook renderer coverage

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/widgets/WidgetRenderer.tsx — React renderer mapping IR to real components
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/widgets/ir.ts — Widget IR schema and constructors


## 2026-06-04

Added static Widget IR demo endpoint and DslPreviewPage wired into the React app

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/api/dsl_handlers.go — Static Widget IR demo response
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/pages/DslPreviewPage/DslPreviewPage.tsx — Frontend preview page rendering API Widget IR


## 2026-06-04

Added initial Goja widget.dsl authoring module with component and cell helpers plus runtime tests

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/dsl/widgetdsl/module.go — Native module implementation for Widget IR helpers
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/dsl/widgetdsl/module_test.go — Goja require() integration tests for widget.dsl


## 2026-06-04

Added API smoke tests for the DSL demo page payload and unknown-page behavior

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/api/dsl_handlers_test.go — Endpoint smoke coverage for DSL preview payload


## 2026-06-04

Ran Pi Playwright browser smoke for DSL nav and preview rendering; verified DSL page marker, 3 table rows, and API request

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/api/dsl_handlers.go — Backend endpoint hit during browser smoke
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/pages/DslPreviewPage/DslPreviewPage.tsx — Browser smoke target for data-rag-page marker and WidgetRenderer output

