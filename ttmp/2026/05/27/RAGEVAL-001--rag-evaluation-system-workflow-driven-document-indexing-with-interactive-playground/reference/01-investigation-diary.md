---
title: "Investigation diary"
doc_type: reference
status: active
intent: long-term
topics: [rag, embeddings, evaluation, workflow, playground, search]
ticket: RAGEVAL-001
created_at: 2026-05-27
updated_at: 2026-05-27
---

# Diary

## Goal

Investigation diary for the RAG Evaluation System (RAGEVAL-001). Captures the research phase: studying existing codebases, understanding the architecture, and producing the design document.

## Step 1: Codebase Research and Architecture Mapping

I studied the four existing repositories in the workspace to understand their capabilities, integration points, and patterns that the RAG Evaluation System should reuse. This research forms the foundation for the design document.

### Prompt Context

**User prompt (verbatim):** "Create a new docmgr ticket to create a RAG evaluation system. I have never really done rag stuff, and as such I would like to see how embedding similarities behave, how to do reranking, etc... I want to build the following: - a workflow system to index / transform / compute embeddings / extract structured data / index documents, using the scraper system in ./scraper, as for example used in 2026-05-20--book-ocr - a RAG playground / web UI where I can exercise different parts of this workflow, and be able to query / interact / view "under the hood" data I want to use ./geppetto and potentially ./pinocchio (at least for the pinocchio profiles), and you can look at ./2026-05-21--readwise-viewer for some examples of using embeddings. Use react + rtk-query + tailwind + storybook for the UI, with a retro macos1 style. Create a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet points and pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and then upload to remarkable. Keep a diary as you work. Work within 2026-05-27--rag-evaluation-system/ and ask for permission to work outside if necessary. Study things and write up a great detailed rich document."

**Assistant interpretation:** Create a docmgr ticket for a RAG evaluation system with a workflow engine (using scraper) and a web playground (React + RTK Query + Tailwind + Storybook, retro macOS style). Study the existing codebases (scraper, geppetto, pinocchio, book-ocr, readwise-viewer) and produce a comprehensive design document suitable for a new intern.

**Inferred user intent:** The user wants a complete design and implementation guide for a RAG evaluation system that teaches RAG concepts while specifying concrete architecture. They want to understand how embeddings, similarity search, reranking, and evaluation work — and they want an interactive playground to explore these concepts hands-on.

### What I did

- Created docmgr ticket RAGEVAL-001
- Created design doc and diary doc in the ticket workspace
- Studied all four existing repositories in detail:
  - **scraper**: Read engine model types, store interface, scheduler, JS runner, site manifests, API handlers, frontend package.json
  - **geppetto**: Read embeddings provider interface, OpenAI/Ollama providers, settings factory, disk cache, config/settings, engine profiles
  - **pinocchio**: Read README, profile config format, JS runtime examples
  - **book-ocr**: Read README for workflow-backed OCR patterns
  - **readwise-viewer**: Read README, design doc for hybrid search implementation
- Wrote the comprehensive design document (82KB) covering:
  - RAG concepts for newcomers (Section 1)
  - Current-state architecture of all four repos (Section 2)
  - Proposed system architecture (Section 3)
  - Data model design with full SQL schema (Section 4)
  - Workflow design with site manifests and verb/script examples (Section 5)
  - Search service design with Bleve mappings and hybrid search (Section 6)
  - HTTP API design with full endpoint listing and JSON contracts (Section 7)
  - Frontend design with four main views and component lists (Section 8)
  - Go backend architecture with package layout and server bootstrap (Section 9)
  - Evaluation metrics (Section 10)
  - Reranking deep dive (Section 11)
  - Embedding similarity deep dive (Section 12)
  - 30-day implementation plan in 7 phases (Section 13)
  - Key files reference (existing and new) (Section 14)
  - Risks, open questions, alternatives (Sections 15-16)
  - Testing strategy and glossary (Sections 17-18)

### Why

The user explicitly asked for a "detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is." This required thorough study of existing codebases to ground the design in real integration points and patterns, rather than abstract architecture.

### What worked

- The Readwise Viewer design doc was an excellent reference for the Bleve hybrid search architecture. Its concrete code patterns (mapping definitions, query construction, cache schema) could be directly adapted.
- The Book OCR README clearly demonstrated the scraper workflow pattern (discover → per-page ops → assemble → validate) which maps directly to the RAG pipeline (discover → ingest → extract → chunk → embed → index).
- Geppetto's embedding provider interface is clean and well-designed for our use case. The `SettingsFactory` from inference settings is exactly what we need for profile-driven embedding computation.

### What didn't work

- No blockers during the research phase.

### What I learned

- The scraper engine is more than a scraping tool — it's a general-purpose durable workflow engine. The RAG pipeline is conceptually similar to scraping (fetch → transform → store → index), so scraper is a natural fit.
- Geppetto's profile system and the Pinocchio profile registry format are the same system. Using Pinocchio's `~/.config/pinocchio/profiles.yaml` as the configuration source means the RAG system automatically picks up the same embedding models the user already has configured.
- Bleve vector search requires `-tags vectors` and FAISS native library setup. This is a known pain point. The design keeps vector code behind build tags and makes BM25-only search fully functional without FAISS.

### What was tricky to build

- The data model design needed to support multi-configuration comparison (same document, different chunking/embedding/indexing strategies) without making the schema overly complex. The `strategy_id` foreign key pattern solves this but requires careful documentation.
- Balancing the "for a new intern" requirement with technical depth. The document needs to explain RAG concepts from scratch (what is an embedding, what is cosine similarity) while also providing concrete code and schema for implementation. I structured it with progressive depth: concepts first, then architecture, then concrete code.

### What warrants a second pair of eyes

- The SQLite schema (Section 4) is the foundation everything builds on. Verify that the composite primary keys on `chunk_embeddings` and `chunk_enrichments` correctly support multi-strategy storage.
- The workflow design (Section 5) assumes that scraper's Goja runtime can call Geppetto embedding APIs via host functions. This needs a concrete host API implementation.
- The evaluation metrics computation (Section 10) should have concrete test cases with known expected values.
- The `SearchDocument` type's `SearchText` field structure (Title/Author/Source/Tags/Summary/Content) should be validated against actual embedding model behavior.

### What should be done in the future

- Implement Phase 0 (project scaffolding) and Phase 1 (SQLite schema + document ingestion) to validate the architecture.
- Add t-SNE/UMAP visualization of embedding clusters in the playground.
- Investigate Ollama's new `/api/embed` batch endpoint for more efficient local embedding computation.
- Add support for image embeddings (CLIP) if multi-modal documents are needed.
- Consider adding a "prompt playground" where users can experiment with the enrichment prompt (summary, entities, hypothetical questions) and see how changes affect retrieval quality.

### Code review instructions

- Start with the design doc: `ttmp/2026/05/27/RAGEVAL-001--.../design-doc/01-rag-evaluation-system-architecture-and-implementation-guide.md`
- Key sections to review: Section 4 (data model), Section 6 (search service), Section 11 (reranking)
- Validate that the SQL schema composite keys support the intended multi-configuration comparison workflow
- Check that the API contracts (Section 7) are consistent with the frontend components (Section 8)

### Technical details

- Document size: ~83KB, 18 major sections
- SQLite tables designed: 9 (sources, documents, chunks, chunking_strategies, chunk_embeddings, chunk_enrichments, search_indexes, eval_queries, eval_runs, eval_results)
- API endpoints designed: ~25
- Frontend views designed: 4 (Pipeline Explorer, Embedding Inspector, Search Sandbox, Evaluation Dashboard)
- Implementation phases: 7, estimated 30 days
