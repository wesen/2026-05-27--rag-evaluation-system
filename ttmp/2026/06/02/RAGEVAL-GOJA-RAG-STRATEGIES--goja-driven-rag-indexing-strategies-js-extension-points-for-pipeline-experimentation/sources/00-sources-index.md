---
title: "RAG Research Sources Index"
type: reference
statusance: active
---

# RAG Research Sources Index

Sources collected for the RAGEVAL-GOJA-RAG-STRATEGIES ticket, covering contextual retrieval, late chunking, metadata-driven RAG, semantic chunking, and hybrid search strategies.

## Contextual Retrieval (Anthropic)

| # | File | Source | Summary |
|---|---|---|---|
| 01 | `01-anthropic-contextual-retrieval.md` | https://www.anthropic.com/engineering/contextual-retrieval | **Primary source.** Anthropic introduces Contextual Retrieval (Sep 2024): two sub-techniques — Contextual Embeddings and Contextual BM25 — that prepend LLM-generated context to each chunk before embedding/indexing. Reduces retrieval failures by up to 67% when combined. Uses Haiku with prompt caching for cost efficiency. |
| 02 | `02-anthropic-claude-cookbook-contextual-embeddings.md` | https://platform.claude.com/cookbook/capabilities-contextual-embeddings-guide | Full implementation guide from Claude Cookbook with code. Shows the exact prompt template for context generation, how to use prompt caching to reduce costs, and end-to-end pipeline with contextual embeddings + contextual BM25. |
| 14 | `14-together-ai-contextual-rag-implementation.md` | https://docs.together.ai/docs/how-to-implement-contextual-rag-from-anthropic | Together AI's implementation guide for contextual RAG. Includes code for context generation, embedding with contextual prefixes, and BM25 indexing with contextual prefixes. Practical walkthrough. |

## Late Chunking (Jina AI)

| # | File | Source | Summary |
|---|---|---|---|
| 04 | `04-late-chunking-jina-ai.md` | https://arxiv.org/html/2409.04701v2 | **Primary paper.** Introduces "Late Chunking": embed the entire document first using long-context embedding models, then apply mean pooling to segments of the token vector sequence to produce contextual chunk embeddings. Outperforms naive chunking across all benchmarks. Fixed-size boundaries with late chunking match or exceed semantic boundaries with naive chunking. |
| 05 | `05-jina-late-chunking-blog.md` | https://jina.ai/news/late-chunking-in-long-context-embedding-models/ | Jina AI blog introducing late chunking concept. Explains the problem (chunks lose context), the solution (embed whole doc then pool segments), and shows qualitative examples. Available in jina-embeddings-v3. |
| 06 | `06-jina-late-chunking-part2.md` | https://jina.ai/news/what-late-chunking-really-is-and-what-its-not-part-ii/ | Deep dive into late chunking vs contextual retrieval. Key finding: late chunking with fixed boundaries outperforms naive chunking with semantic boundaries. Compares computational costs and accuracy tradeoffs. |
| 15 | `15-weaviate-late-chunking.md` | https://weaviate.io/blog/late-chunking | Weaviate's explanation of late chunking with practical examples. Shows how naive vs late chunking differs qualitatively and quantitatively using jina-embeddings-v2-base-en. |

## Comparative Analysis

| # | File | Source | Summary |
|---|---|---|---|
| 03 | `03-reconstructing-context-late-chunking-vs-contextual-retrieval.md` | https://arxiv.org/html/2504.19754v1 (Apr 2025) | **Rigorous comparison** of late chunking vs contextual retrieval. Finds that contextual retrieval preserves semantic coherence more effectively but requires greater computational resources (one LLM call per chunk). Late chunking is cheaper (one embedding call per doc) but slightly less accurate. |

## Chunking Strategies

| # | File | Source | Summary |
|---|---|---|---|
| 11 | `11-systematic-chunking-strategies-arxiv2603.md` | https://arxiv.org/html/2603.06976 (Mar 2026) | **Most comprehensive.** Systematic evaluation of 36 chunking strategies including fixed-size, semantic, structure-aware, hierarchical, adaptive, and late chunking. Evaluates embedding sensitivity across strategies. Essential reference for choosing chunking approach. |
| 13 | `13-is-semantic-chunking-worth-it-arxiv2410.md` | https://arxiv.org/html/2410.13070v1 (Oct 2024) | **Challenges assumptions.** Finds that computational costs of semantic chunking are NOT justified by consistent performance gains over fixed-size chunking. Important counterpoint to the trend toward expensive chunking strategies. |
| 19 | `19-pinecone-chunking-strategies.md` | https://www.pinecone.io/learn/chunking-strategies/ | Pinecone's practical guide to chunking strategies: fixed-size, recursive, semantic, and structure-aware chunking. Good overview for beginners. |
| 18 | `18-firecrawl-chunking-strategies-2026.md` | https://www.firecrawl.dev/blog/best-chunking-strategies-rag (Feb 2026) | Compares 7 chunking strategies with working code examples: recursive character splitting, semantic, page-level, LLM-based, size-based, markdown-heading, and late chunking. Practical and current. |

## Document Preprocessing & Metadata

| # | File | Source | Summary |
|---|---|---|---|
| 07 | `07-deepset-preprocessing-rag.md` | https://www.deepset.ai/blog/preprocessing-rag | 4-step preprocessing guide: examine/extract → clean → chunk → add metadata. Emphasizes that metadata (title, source, date, section) is critical for filtering and should be added during preprocessing. |
| 16 | `16-unstructured-data-preprocessing-rag.md` | https://unstructured.io/blog/level-up-your-genai-apps-essential-data-preprocessing-for-any-rag-system | Unstructured's guide covering ingestion, extraction, chunking, embedding, and indexing. Focuses on the full preprocessing pipeline with practical recommendations. |
| 17 | `17-unstructured-metadata-rag.md` | https://unstructured.io/insights/how-to-use-metadata-in-rag-for-better-contextual-results | **Metadata-focused.** How to use metadata (source type, date, author, section, page number) to improve RAG retrieval. Covers metadata filtering before vector search, combining with hybrid search, and metadata-enriched chunking. |
| 12 | `12-metadata-driven-rag-arxiv2510.md` | https://arxiv.org/html/2510.24402v1 (Oct 2025) | **Academic paper.** Systematic investigation of metadata-driven RAG for financial QA. Proposes metadata-aware retrieval that uses document attributes (filing date, sector, document type) as pre-retrieval filters and post-retrieval reranking signals. |

## Hybrid Search & BM25

| # | File | Source | Summary |
|---|---|---|---|
| 08 | `08-redis-bm25-rag.md` | https://redis.io/blog/full-text-search-for-rag-the-precision-layer/ | Redis guide on BM25 full-text search for RAG. Explains when BM25 outperforms vector search (exact keyword matches, named entities, domain-specific terms), and how to design hybrid retrieval. |
| 09 | `09-elastic-advanced-rag-techniques.md` | https://www.elastic.co/search-labs/blog/advanced-rag-techniques-part-1 | Elastic's advanced RAG techniques for data processing: parent-child document relationships, metadata enrichment, overlap strategies, and hybrid BM25+vector retrieval with reranking. |
| 10 | `10-meilisearch-rag-indexing.md` | https://www.meilisearch.com/blog/rag-indexing (Nov 2025) | Guide to RAG indexing: what it is, key strategies, when to refresh indexes, and how to measure performance. Covers structure, evaluation, and grounded LLM answers. |

## Key Takeaways for Our System

1. **Contextual Retrieval is directly implementable** — our `enrich_chunk` op + geppetto's `runInference()` maps exactly to Anthropic's approach: generate short context for each chunk, prepend it before embedding and BM25 indexing.

2. **Late Chunking is a simpler alternative** — instead of per-chunk LLM calls, embed the whole doc then pool segments. Requires long-context embedding models (jina-embeddings-v2/v3). Could be implemented as an alternative embedding strategy.

3. **Metadata is underused in our current system** — the RAG eval system stores `source_id` and `word_count` but doesn't use them for pre-retrieval filtering. Adding metadata fields (section heading, document type, date) would improve hybrid search.

4. **Semantic chunking may not be worth it** — the arxiv 2410.13070 paper challenges the assumption. Our `MarkdownHeadingChunker` (structure-aware) may already be close to optimal for markdown documents.

5. **36 strategies evaluated systematically** — the arxiv 2603.06976 paper is the most comprehensive reference for choosing a chunking approach.
