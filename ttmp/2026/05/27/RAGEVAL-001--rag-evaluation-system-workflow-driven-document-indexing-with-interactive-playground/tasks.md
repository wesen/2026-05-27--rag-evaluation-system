# Tasks

## TODO

- [x] Add tasks here

- [x] Project scaffolding: Go server + React SPA skeleton (Phase 0)
- [ ] SQLite schema and document ingestion (Phase 1)
- [ ] Chunking implementation (Phase 2)
- [ ] Embedding computation via Geppetto (Phase 3)
- [ ] BM25 and hybrid search with Bleve (Phase 4)
- [ ] Reranking service (Phase 5)
- [ ] Scraper workflow integration (Phase 6)
- [ ] Evaluation dashboard and metrics (Phase 7)
- [x] Phase 0.1: Initialize Go module and cmd/rag-eval/main.go with minimal HTTP server
- [x] Phase 0.2: Create web/ React + Vite + Tailwind + RTK Query + Storybook skeleton
- [x] Phase 0.3: Implement go:embed SPA serving and /api/v1/health endpoint
- [x] Phase 0.4: Create MacWindow, MacMenuBar, MacButton retro UI components with stories
- [ ] Phase 0.5: Add devctl.yaml for local dev (server + web + worker)
- [ ] Phase 1.1: Implement SQLite schema: sources, documents tables with migrations
- [ ] Phase 1.2: Add GET /api/v1/sources, POST /api/v1/sources, GET /api/v1/documents
- [ ] Phase 1.3: Implement file-based document ingestion (scan directory, store in SQLite)
- [ ] Phase 1.4: Pipeline Explorer view: SourceList, DocumentTable, WorkflowSubmitForm
- [ ] Phase 2.1: Add chunks and chunking_strategies tables with migrations
- [ ] Phase 2.2: Implement fixed-size chunking (256, 512, 1024 tokens with overlap)
- [ ] Phase 2.3: Implement sentence-based chunking
- [ ] Phase 2.4: Add GET /api/v1/documents/{id}/chunks and chunk detail view
- [ ] Phase 3.1: Add geppetto as Go dependency, implement profile bootstrap
- [ ] Phase 3.2: Add chunk_embeddings table, implement embedding service wrapping Geppetto
- [ ] Phase 3.3: Add POST /api/v1/embeddings/compute and /api/v1/embeddings/similarity
- [ ] Phase 3.4: Embedding Inspector view: SimilarityHeatmap, PairwiseCompare, ModelComparison
- [ ] Phase 4.1: Implement Bleve text-only mapping and BM25 search
- [ ] Phase 4.2: Add search_indexes table, index build/rebuild commands
- [ ] Phase 4.3: Implement vector mapping (-tags vectors) and hybrid RRF search
- [ ] Phase 4.4: Add POST /api/v1/search with explain mode
- [ ] Phase 4.5: Search Sandbox view: SearchQueryBar, SearchResultList, ScoreDistributionChart
- [ ] Phase 5.1: Implement rerank service interface and Cohere provider
- [ ] Phase 5.2: Implement LLM-as-judge reranker via Geppetto
- [ ] Phase 5.3: Add POST /api/v1/rerank and wire into search flow
- [ ] Phase 5.4: RerankComparison component in Search Sandbox
- [ ] Phase 6.1: Create sites/rag-eval site manifest with verbs and scripts
- [ ] Phase 6.2: Implement ingest→extract→chunk→embed workflow ops
- [ ] Phase 6.3: Wire workflow submission through POST /api/v1/workflows/submit
- [ ] Phase 6.4: Display workflow status in Pipeline Explorer
- [ ] Phase 7.1: Implement eval_queries, eval_runs, eval_results tables
- [ ] Phase 7.2: Implement Recall@K, MRR, nDCG@K computation
- [ ] Phase 7.3: Create default 15-20 query benchmark set
- [ ] Phase 7.4: Add eval API endpoints and Evaluation Dashboard view
