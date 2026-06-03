# Changelog

## 2026-06-02

- Initial workspace created


## 2026-06-02

Created comprehensive design doc: Goja RAG Strategy Architecture and Intern Implementation Guide. Covers system overview, scraper JS runtime, geppetto module, xgoja codegen, proposed rag-ops module API, 4 example JS strategies, 4-phase implementation plan, API reference, file reference, diagrams, and decision records.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-GOJA-RAG-STRATEGIES--goja-driven-rag-indexing-strategies-js-extension-points-for-pipeline-experimentation/design/01-goja-rag-strategy-architecture-and-intern-implementation-guide.md — Design document


## 2026-06-02

Uploaded design doc + diary bundle to reMarkable at /ai/2026/06/02/RAGEVAL-GOJA-RAG-STRATEGIES


## 2026-06-02

Step 3: Added goja-text module documentation (Section 5), updated all strategy examples to use markdown/sanitize/extract, added 5th strategy (structured extraction pipeline), updated xgoja.yaml examples, resolved goja-text open question (found at ./goja-text), updated diagrams and file references.


## 2026-06-02

Step 4: Collected 19 RAG research sources (1.4MB total). Key findings: Anthropic contextual retrieval validates enrich_chunk+geppetto approach; late chunking is cheaper alternative; semantic chunking may not be worth cost; metadata-driven filtering improves precision. Created sources/00-sources-index.md with categorized summaries.


## 2026-06-02

Step 5: Created design doc 02 - RAG Preprocessing Research Report & Investigation Avenues (32KB). Part I: detailed report on all 19 sources (contextual retrieval, late chunking, systematic chunking, metadata-driven RAG, hybrid search). Part II: 8 concrete avenues to pursue with pseudocode, implementation steps, and expected outcomes. Part III: prioritized 3-phase roadmap. Part IV: cross-cutting observations and open questions.


## 2026-06-02

Step 5: Added layered Goja RAG API design guide. Replaces service-shaped public API proposal with require('rag') + require('rag/raw'), Go-backed fluent builders, typed handles, representation plans, raw SQL/Bleve access, goja-text integration, and a concrete intern implementation roadmap.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-GOJA-RAG-STRATEGIES--goja-driven-rag-indexing-strategies-js-extension-points-for-pipeline-experimentation/design/03-layered-goja-rag-api-design-and-implementation-guide.md — New design guide
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-GOJA-RAG-STRATEGIES--goja-driven-rag-indexing-strategies-js-extension-points-for-pipeline-experimentation/reference/01-investigation-diary.md — Diary Step 5 recorded

