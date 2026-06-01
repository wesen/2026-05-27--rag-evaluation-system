# Changelog

## 2026-06-01

- Initial workspace created


## 2026-06-01

Created intern-facing RAG web architecture/design-system/DMETA review and investigation diary

### Related Files

- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/design-doc/01-rag-evaluation-web-architecture-and-design-system-review.md — Primary review deliverable
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/reference/01-investigation-diary.md — Investigation diary


## 2026-06-01

Validated RAG web review ticket and uploaded report bundle to reMarkable at /ai/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW

### Related Files

- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/design-doc/01-rag-evaluation-web-architecture-and-design-system-review.md — Uploaded primary report
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/reference/01-investigation-diary.md — Updated delivery diary


## 2026-06-01

Implemented Phase 0/1/early-2 web design-system scaffolding: dependencies, Storybook config, tokens, foundation primitives, layout primitives, and co-located primitive stories

### Related Files

- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/reference/01-investigation-diary.md — Recorded Phase 0/1/2 implementation diary
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/package.json — Added typecheck and Storybook scripts/dependencies
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/components/foundation/index.ts — Foundation primitive exports
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/components/layout/index.ts — Layout primitive exports
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/styles/tokens.css — Extracted retro tokens and added RAG role aliases


## 2026-06-01

Validated web Phase 0/1/2 with pnpm typecheck, pnpm build, and pnpm build-storybook; noted go test is blocked in this checkout by missing ../scraper replace target

### Related Files

- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/reference/01-investigation-diary.md — Recorded validation results and Go test blocker
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/package.json — Web validation scripts


## 2026-06-01

Continued Phase 2 by extracting SearchControlsPanel, RetrievalResultsPanel, CoveragePanel, and QueryPresetList with co-located Storybook stories

### Related Files

- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/reference/01-investigation-diary.md — Recorded Phase 2 Search Workbench extraction
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/components/molecules/CoveragePanel/CoveragePanel.tsx — Extracted embedding coverage molecule
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/components/molecules/QueryPresetList/QueryPresetList.tsx — Extracted query preset molecule
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/components/organisms/RetrievalResultsPanel/RetrievalResultsPanel.tsx — Extracted retrieval results organism
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/components/organisms/SearchControlsPanel/SearchControlsPanel.tsx — Extracted search controls organism
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/components/search/SearchView.tsx — Refactored to compose extracted Search Workbench components


## 2026-06-01

Completed the next Phase 2 increment by extracting ResultInspectorPanel and moving the Search Workbench shell onto DashboardGrid/Stack

### Related Files

- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/reference/01-investigation-diary.md — Recorded ResultInspector extraction and layout primitive adoption
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/components/organisms/ResultInspectorPanel/ResultInspectorPanel.stories.tsx — Storybook examples for inspector states
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/components/organisms/ResultInspectorPanel/ResultInspectorPanel.tsx — Extracted selected-result inspector organism
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/components/search/SearchView.module.css — Page-local sizing and scroll ownership for Search Workbench shell
- /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web/src/components/search/SearchView.tsx — Search page now owns data orchestration and composes ResultInspectorPanel with layout primitives

