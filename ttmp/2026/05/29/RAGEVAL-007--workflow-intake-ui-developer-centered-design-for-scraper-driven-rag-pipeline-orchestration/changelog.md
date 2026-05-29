# Changelog

## 2026-05-29

- Initial workspace created


## 2026-05-29

Step 1: Investigated codebase, created ticket, wrote comprehensive design doc with 5 screens (workflows list, submit modal, workflow detail, op inspector, queue health), 8 backend API endpoints, RTK Query types, component tree, and 7-phase implementation plan. All grounded in actual source files.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/05/29/RAGEVAL-007--workflow-intake-ui-developer-centered-design-for-scraper-driven-rag-pipeline-orchestration/design/01-intake-workflow-ui-design-screens-affordances-and-data-flow.md — Primary design document


## 2026-05-29

Step 2: Fixed vocabulary (added design/intake/scraper/ui topics), removed broken related file entries, doctor passes. Uploaded bundle to reMarkable at /ai/2026/05/29/RAGEVAL-007. Design deliverable complete, no code implemented.


## 2026-05-29

Steps 3-4: Implemented backend API (5 new endpoints) and frontend Workflows UI (list, detail, op graph, submit modal, queue health, op inspector). Key fix: grouped ops endpoint to prevent context explosion with 6000+ ops. Two commits: fafb6ab, 387713d.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/api/workflow_artifact_handlers.go — New workflow mutation endpoints + grouped ops
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/workflows/WorkflowsView.tsx — Main workflow UI component
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/services/api.ts — RTK Query workflow endpoints and types


## 2026-05-29

Step 5: Phase 7 polish — progress bar, proper CSS design system classes, styled modal/form, op inspector with selectable rows, fixed React #310 crash from polling useCallback deps (commit 1851167)

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/workflows/WorkflowsView.tsx — ProgressBar
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/index.css — status-running/error/canceled

