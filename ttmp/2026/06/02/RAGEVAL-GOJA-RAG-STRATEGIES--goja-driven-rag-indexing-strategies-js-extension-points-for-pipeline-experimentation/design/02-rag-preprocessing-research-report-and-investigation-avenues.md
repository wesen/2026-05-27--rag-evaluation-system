---
title: "RAG Preprocessing Research Report & Investigation Avenues"
type: design-doc
ticket: RAGEVAL-GOJA-RAG-STRATEGIES
status: active
created: 2026-06-02
---

# RAG Preprocessing Research Report & Investigation Avenues

## Purpose

This report synthesizes findings from 19 research articles and papers collected as source material for the RAG evaluation system project. It serves two functions:

1. **Detailed resource report** — what each source contributes, its methodology, key numbers, and limitations.
2. **Avenues to pursue** — concrete experiments, tooling, and investigation paths that emerge from the research, mapped directly to our system's architecture (goja, scraper, geppetto, goja-text).

---

# Part I: Detailed Resource Report

## 1. Contextual Retrieval (Anthropic)

### Sources
- **01** Anthropic blog (Sep 2024): "Introducing Contextual Retrieval"
- **02** Claude Cookbook: Full implementation guide with Python code
- **14** Together AI: Practical implementation walkthrough

### Core Technique

Contextual Retrieval has two sub-techniques that share a common preprocessing step:

**Contextual Embeddings**: Before embedding each chunk, use an LLM to generate a short (50–100 token) context string that "situates" the chunk within the whole document. Prepend this context to the chunk, then embed.

**Contextual BM25**: Before building the BM25 index for each chunk, prepend the same LLM-generated context. This means BM25 can match keywords in both the original chunk text *and* the contextual description.

The prompt template (from source 02):

```
<document>
{WHOLE_DOCUMENT}
</document>
Here is the chunk we want to situate within the whole document
<chunk>
{CHUNK_CONTENT}
</chunk>
Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else.
```

### Key Numbers

| Technique | Top-20 Retrieval Failure Rate | Reduction |
|---|---|---|
| Baseline (embeddings + BM25) | 5.7% | — |
| + Contextual Embeddings | 3.7% | 35% reduction |
| + Contextual Embeddings + Contextual BM25 | 2.9% | 49% reduction |
| + Contextual E + Contextual BM25 + Reranking | 1.9% | 67% reduction |

From the Claude Cookbook (codebase dataset, 248 queries):

| Approach | Pass@5 | Pass@10 | Pass@20 |
|---|---|---|---|
| Baseline RAG | 80.92% | 87.15% | 90.06% |
| + Contextual Embeddings | 88.12% | 92.34% | 94.29% |
| + Hybrid Search (Contextual BM25) | 86.43% | 93.21% | 94.99% |
| + Reranking (Cohere) | 92.15% | 95.26% | 97.45% |

### Cost Analysis

- With prompt caching (Claude): $1.02 per million document tokens for one-time ingestion
- For 737 chunks across 9 codebases: ~$2.85 with caching (vs ~$9.20 without)
- 61.83% of input tokens read from cache at 90% discount
- Processing must be document-sequential to maximize cache hits

### Limitations

- One LLM call per chunk at ingestion time (cost and latency)
- For very long documents, VRAM fills up quickly (~20GB for contextualization)
- Generic prompt works well but domain-specific prompts may do better
- Some embedding models have fixed input token limits — contextualized chunks may get truncated

### Relevance to Our System

**Directly implementable.** Our `enrich_chunk` op in the workflow engine + geppetto's `runInference()` is exactly this pattern. The key mapping:

- `enrich_chunk` → LLM generates context per chunk (using the Anthropic prompt)
- `create_embedding` → embed the contextualized chunk (context + original text)
- `create_bm25_index` → index the contextualized chunk for BM25

We need to: (a) ensure the context is prepended before *both* embedding and BM25 indexing, and (b) implement prompt caching for cost efficiency.

---

## 2. Late Chunking (Jina AI)

### Sources
- **04** arxiv paper 2409.04701v2: "Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models"
- **05** Jina AI blog Part I: Introduction and qualitative evaluation
- **06** Jina AI blog Part II: Deep dive, misconceptions, vs contextual retrieval
- **15** Weaviate blog: Practical explanation

### Core Technique

Late Chunking inverts the traditional chunk-then-embed pipeline:

1. **Traditional (early chunking)**: Split document → embed each chunk independently → mean pool each → store
2. **Late chunking**: Embed entire document at token level → apply chunk boundaries → mean pool each chunk's token vectors → store

The result: each chunk embedding is "conditioned on" the entire document, not just the chunk's own text. Because encoder-only transformers use full bidirectional attention, each token embedding incorporates context from *all* other tokens in the document.

### Key Numbers (from source 05, jina-embeddings-v2-small-en)

| Dataset | Avg Doc Length | Naive Chunking nDCG@10 | Late Chunking nDCG@10 | No Chunking nDCG@10 |
|---|---|---|---|---|
| SciFact | 1498 chars | 64.20% | 66.10% | 63.89% |
| TRECCOVID | 1117 chars | 63.36% | 64.70% | 65.18% |
| NFCorpus | 1590 chars | 23.46% | **29.98%** | 30.40% |
| FiQA2018 | 767 chars | 33.25% | 33.84% | 33.43% |

Key insight: **Improvement correlates with document length.** The longer the document, the more effective late chunking becomes.

### Resilience to Poor Boundaries

From source 06 (Part II), testing late chunking with different boundary cues using jina-embeddings-v3:

| Boundary Type | Naive nDCG@10 | Late nDCG@10 |
|---|---|---|
| Fixed token (256) | ~33% | ~36.7% |
| Sentence boundaries | ~30.4% | ~36.6% |
| Semantic boundaries | ~30.3% | ~36.6% |

**Late chunking with fixed boundaries outperforms naive chunking with semantic boundaries.** This is the most significant finding: you don't need expensive boundary detection when you use late chunking.

### Requirements

- Long-context embedding model (≥8192 tokens): jina-embeddings-v2, v3, nomic-v1
- Model must use mean pooling (not CLS or max pooling)
- Model must provide token-level embeddings (not just final embedding)

### Late Chunking vs Contextual Retrieval

From source 06 and source 03 (the comparison paper):

| Aspect | Late Chunking | Contextual Retrieval |
|---|---|---|
| Cost | One embedding call per document | One LLM call per chunk |
| Speed | Fast (embedding only) | Slow (LLM inference per chunk) |
| Storage | Same as naive (no extra text) | Larger (context prepended to chunks) |
| Resilience to boundaries | High | Unclear (LLM needs readable chunks) |
| Accuracy | Good, slightly less than contextual | Best, preserves semantic coherence more |
| Additional training | Optional (fine-tuning helps) | Not applicable |

The comparison paper (source 03) found: "Contextual retrieval preserves semantic coherence more effectively but requires greater computational resources. Late chunking offers higher efficiency but tends to sacrifice relevance and completeness."

### Relevance to Our System

Late chunking could be implemented as an alternative embedding strategy in the `rag-ops` goja module. The key challenge: we currently use OpenAI embeddings via geppetto, which do *not* provide token-level embeddings and are not long-context models designed for this. We would need to add support for jina-embeddings-v3 as an embedding provider.

---

## 3. Reconstructing Context: Comparative Analysis

### Source
- **03** arxiv 2504.19754v1 (Apr 2025): "Reconstructing Context: Evaluating Advanced Chunking Strategies for RAG"

### Methodology

Rigorous head-to-head comparison of late chunking vs contextual retrieval using:
- Embedding models: Jina-V3, Jina-V2, BGE-M3, Stella-V5
- Segmentation: Fixed-window, Jina-Semantic, Simple-Qwen, Topic-Qwen
- Datasets: NFCorpus (retrieval), MSMarco (generation QA)
- LLM: Phi-3.5-mini-instruct (4-bit quantized) for contextualization
- Reranker: Jina Reranker V2 Base

### Key Findings

1. **Fixed-window vs semantic chunking**: "do not differ much in terms of performance or not at all, while the first one being far easier implementable and faster"

2. **Rank Fusion with contextual chunks**: "shows improved results especially when chunks are enriched with additional context from the document. BM25 matches search terms in both segments and contexts, leading to very good results."

3. **Reranking is crucial**: "adding the final reranking step in the workflow is crucial to leverage this potential and see consistent improvements"

4. **Late chunking vs contextual retrieval** (Jina-V3, Fixed-Window):

   | Method | NDCG@5 | MAP@5 | F1@5 |
   |---|---|---|---|
   | Late | 0.309 | 0.143 | 0.202 |
   | Contextual + Rank Fusion + Reranking | **0.317** | **0.146** | **0.206** |

5. **Late chunking doesn't always win**: With BGE-M3 on NFCorpus, early chunking outperformed late chunking. With Stella-V5 on MSMarco, early chunking also won.

6. **VRAM constraint**: Contextual retrieval with long documents reaches ~20GB VRAM, limiting batch sizes.

### Limitations

- Only 50 queries for contextual retrieval (vs 1000 for late chunking) due to compute constraints
- Small LLM (Phi-3.5-mini) for contextualization — results may differ with larger models
- Not peer-reviewed (preprint for ECIR 2025 workshop)

---

## 4. Systematic Chunking Strategies (36 Methods)

### Source
- **11** arxiv 2603.06976 (Mar 2026): "A Systematic Investigation of Document Chunking Strategies and Embedding Sensitivity"

### Scope

**The most comprehensive chunking study to date.** 36 strategies × 6 domains × 5 embedding models = 1,080 configurations.

**Strategy categories**:
- Deterministic/rule-based: Fixed character, fixed token, overlapping token, sliding window, length-aware, sentence-based, sentence group, paragraph-based
- Structure-aware: Markdown heading, HTML section, code block, table-aware
- Semantic: Breakpoint-based, clustering-based, topic-based, semantic similarity
- Hierarchical: Parent-child, multi-resolution, section-then-chunk
- Adaptive: Dynamic token sizing, content-driven adaptive, meta-chunking
- LLM-assisted: LLM boundary detection, LLM segment-then-chunk
- Late chunking variants: Late chunking with various boundary cues

**Domains**: Biology, Physics, Health, Legal, Maths, Agriculture (from UltraDomain dataset)

**Embedding models**: Five models of varying sizes on MTEB leaderboard

**Evaluation**: nDCG@5, Hit@5, MRR, with LLM-as-judge (Mixtral-8x22B) for graded relevance

### Key Findings

1. **Paragraph Group Chunking (PGC) is the overall winner**: nDCG@5 ≈ 0.459, Precision@1 ≈ 24%, Hit@5 ≈ 59%

2. **Fixed-size chunking is terrible**: Fixed character chunking nDCG@5 < 0.244, Precision@1 ≈ 2-3%

3. **No single strategy is universally optimal**: Domain matters:
   - Biology, Physics, Health: Dynamic token sizing wins
   - Legal, Maths: Paragraph grouping wins
   
4. **Chunking and embedding are complementary**: "Better chunking and large embeddings provide complementary benefits. Even the largest models benefit from improved chunking, and suboptimal segmentation imposes a performance ceiling on all models."

5. **Efficiency trade-offs are severe**:
   - LLM-based chunking: 5,672 MB RAM, 10+ seconds per document
   - Semantic clustering: 2,849 MB RAM, 133+ seconds per document
   - Paragraph Group Chunking: 873 MB RAM, 6.26 seconds, best effectiveness
   - Dynamic token chunking: Near Pareto-optimal frontier

6. **Chunking strategy selection dominates model architecture choice**: Embedding dimensionality shows minimal correlation with performance (|r| < 0.2).

### Relevance to Our System

Our `MarkdownHeadingChunker` is a structure-aware strategy (similar to "Markdown heading" in this study). PGC is consistently better. The study validates that structure-aware chunking significantly outperforms fixed-size, and that paragraph-level grouping is the sweet spot for most domains.

---

## 5. Is Semantic Chunking Worth It?

### Source
- **13** arxiv 2410.13070 (Oct 2024): "Is Semantic Chunking Worth the Computational Cost?"

### Core Question

Does the computational cost of semantic chunking (embedding each sentence, computing similarities, finding breakpoints) justify its performance over simple fixed-size chunking?

### Three Chunkers Tested

1. **Fixed-size**: Split into consecutive chunks of N sentences with overlap
2. **Breakpoint-based semantic**: Insert break when semantic distance between consecutive sentences exceeds a threshold
3. **Clustering-based semantic**: Group semantically similar sentences (possibly non-adjacent) using single-linkage or DBSCAN

### Key Findings

1. **Semantic chunking shows inconsistent benefits**: On natural (non-stitched) documents, fixed-size chunking often matches or exceeds semantic chunking.

2. **Semantic chunking helps on stitched documents**: When multiple unrelated documents are concatenated, semantic chunking detects topic boundaries. But "simply splitting the document into structured sections before applying fixed-size chunking will solve this issue."

3. **Clustering-based chunker can misgroup**: Sentences from different sections get grouped together because of high semantic similarity despite large positional distance.

4. **Breakpoint-based chunker produces degenerate chunks**: Single-sentence chunks lacking context, or chunks separated at wrong points.

5. **Conclusion**: "The computational costs associated with semantic chunking are not justified by consistent performance gains."

### Relevance to Our System

Our `MarkdownHeadingChunker` already uses document structure (headings) as natural breakpoints — which is the "splitting by structured sections" that this paper recommends. Semantic chunking would add cost without reliable gains for our markdown-heavy document corpus.

---

## 6. Metadata-Driven RAG

### Source
- **12** arxiv 2510.24402 (Oct 2025): "Metadata-Driven Retrieval-Augmented Generation for Financial Question Answering"

### Core Technique

A multi-stage architecture that treats documents as hierarchical knowledge structures, not flat chunk collections:

**Offline indexing pipeline**:
1. LLM generates document-level metadata: summaries, key entities, thematic clusters
2. LLM generates chunk-level metadata: parent cluster references, associated entities, potential Q&A pairs, "retrieval nuggets" of implicit knowledge
3. Create "contextual chunks" by embedding chunk text *together with* its metadata

**Runtime pipeline**:
1. **Pre-retrieval**: Use document-level metadata for file filtering and query rewriting
2. **Retrieval**: Search contextual chunks (text + metadata embedded together)
3. **Post-retrieval**: Metadata-driven entity/cluster expansion, custom reranker

### Key Findings

1. **Contextual chunks (text + metadata embedded together) give the biggest single improvement**: "The most significant performance gains come from embedding chunk metadata directly with text"

2. **Pre-retrieval filtering helps**: Using document-level metadata to filter files before searching reduces noise

3. **Naive chunk expansion is harmful**: Simply adding more chunks to the context window leads to higher hallucination rates — "the accounting principle of relevance over quantity"

4. **Custom reranker vs commercial**: A custom open-source reranker can achieve competitive results with better auditability and lower cost

5. **Reranking is essential for precision**: "A powerful reranker is essential for precision"

### Relevance to Our System

Our current system stores minimal metadata (`source_id`, `word_count`). Adding metadata extraction as a preprocessing step — using goja-text's `extract` module and geppetto's `runInference()` — could significantly improve retrieval. The "contextual chunks" approach (embedding metadata with text) is directly implementable in our embedding pipeline.

---

## 7. Hybrid Search & BM25

### Sources
- **08** Redis: "Full-text search for RAG: the precision layer"
- **09** Elastic: "Advanced RAG techniques: Data processing & ingestion"

### Core Concepts

**BM25** scores documents based on three factors:
1. **TF saturation**: Diminishing returns for repeated terms (100 mentions ≠ 100× score)
2. **Document length normalization**: Longer docs don't automatically win
3. **IDF**: Rare terms carry more weight than common ones

**When BM25 outperforms vector search**:
- Exact identifiers (SKUs, error codes, API endpoints)
- Phrase matching (legal/compliance language)
- Boolean logic and explicit filters
- Explainable ranking required

**When vector search outperforms BM25**:
- Natural language queries without precise terminology
- Synonyms and paraphrases
- Best answer doesn't share keywords with query

**Hybrid design** (from Anthropic/Claude Cookbook):
- Retrieve top-150 from both semantic search and BM25
- Apply weighted Reciprocal Rank Fusion (80% semantic, 20% BM25)
- Return top-k after fusion

### Relevance to Our System

Our system currently only does vector search. Adding BM25 as a parallel retrieval path and fusing results would improve retrieval for queries containing exact terms (function names, error codes, identifiers).

---

## 8. Document Preprocessing

### Sources
- **07** deepset: 4-step preprocessing guide
- **16** Unstructured: Full preprocessing pipeline
- **17** Unstructured: Metadata for RAG

### Key Insights

**deepset's 4-step preprocessing** (source 07):
1. **Examine & Extract**: Understand document structure, extract text from PDFs/HTML
2. **Clean**: Remove boilerplate, normalize whitespace, strip HTML tags
3. **Chunk**: Apply chunking strategy
4. **Add Metadata**: Title, source, date, section heading, author

**Metadata types that improve retrieval** (source 17):
- Source type (PDF, HTML, markdown)
- Document date
- Author/creator
- Section heading
- Page number
- Document type (report, memo, spec)

**Metadata filtering strategies**:
- Pre-retrieval: Filter by metadata before vector search (e.g., "only documents from 2024")
- Post-retrieval: Use metadata to rerank results
- Metadata-enriched chunking: Include metadata in the chunk text before embedding

### Relevance to Our System

Our goja-text `extract` module already handles extraction (examine & extract). The `sanitize` module handles cleaning. The `markdown` module handles structure-aware chunking. What's missing: **systematic metadata extraction and storage**.

---

# Part II: Avenues to Pursue — Experiments, Tooling, and Investigations

## Avenue 1: Implement Contextual Retrieval as a JS Strategy

**Priority**: High — directly validated by research, maps to existing system components

### What to build

A `rag-ops` goja module function `contextualizeChunks(document, chunks)` that:

```javascript
// In rag-ops module (JS API)
const rag = require("rag-ops");

// Step 1: Generate context for each chunk
const contextualized = await rag.contextualizeChunks({
  document: fullDocumentText,
  chunks: chunkArray,
  model: "claude-haiku-4-5",  // or any geppetto-supported model
  promptTemplate: rag.ANTHROPIC_CONTEXT_PROMPT, // built-in template
  useCaching: true
});

// Step 2: Embed the contextualized chunks
const embeddings = await rag.embedChunks({
  chunks: contextualized,  // context already prepended
  model: "text-embedding-3-small"
});

// Step 3: Build BM25 index with contextualized chunks
const bm25Index = await rag.buildBM25Index({
  chunks: contextualized,  // same context used for BM25
  fields: ["content", "context"]  // search both original and context
});
```

### Implementation steps

1. Add `contextualizeChunks()` to `rag-ops` module — calls geppetto's `runInference()` per chunk with the Anthropic prompt template
2. Ensure context is prepended before *both* `create_embedding` and BM25 indexing
3. Implement prompt caching for the document portion (reuse geppetto's caching if available, otherwise batch chunks by document)
4. Add `buildBM25Index()` to `rag-ops` — wraps bleve or SQLite FTS5
5. Add `hybridSearch()` that does weighted Reciprocal Rank Fusion (semantic + BM25)

### Experiment to run

**Benchmark**: Compare baseline chunking (no context) vs contextual embeddings vs contextual embeddings + contextual BM25 vs full pipeline with reranking.

**Metrics**: Pass@5, Pass@10, Pass@20, nDCG@5 on our existing evaluation dataset.

**Expected outcome**: 35-67% reduction in retrieval failures, matching Anthropic's published results.

---

## Avenue 2: Implement Late Chunking as an Alternative Embedding Strategy

**Priority**: Medium — promising but requires new embedding provider

### What to build

A `rag-ops` goja module function `lateChunkEmbed()` that:

```javascript
const rag = require("rag-ops");

// Late chunking: embed whole doc, then pool segments
const result = await rag.lateChunkEmbed({
  document: fullDocumentText,
  boundaries: chunkBoundaries,  // [{start: 0, end: 512}, {start: 512, end: 1024}, ...]
  model: "jina-embeddings-v3"  // must support token-level output
});

// result.embeddings is an array of chunk embeddings
// result.tokenEmbeddings is the full token-level matrix (for inspection)
```

### Implementation steps

1. Add jina-embeddings-v3 as an embedding provider in geppetto (or add a new provider that exposes token-level embeddings)
2. Implement `lateChunkEmbed()` that:
   - Sends entire document to the embedding model
   - Gets back token-level embeddings
   - Applies mean pooling to each chunk's token range
3. Support multiple boundary cue strategies: fixed-size, sentence-based, markdown-heading-based

### Experiment to run

**Benchmark**: Compare early chunking (current approach) vs late chunking with the same boundaries, across documents of our corpus. Measure retrieval accuracy vs computational cost.

**Key question**: Does late chunking's advantage hold with OpenAI embeddings, or does it require jina-embeddings specifically?

---

## Avenue 3: Metadata Extraction and Enrichment Pipeline

**Priority**: High — directly implementable with existing tools, strong research support

### What to build

A goja-text + geppetto pipeline that extracts metadata from documents and stores it alongside chunks:

```javascript
const text = require("goja-text");
const geo = require("geppetto");
const rag = require("rag-ops");

// Step 1: Extract metadata using goja-text + geppetto
const metadata = await geo.runInference({
  prompt: `Extract metadata from this document:
    - title
    - date (if present)
    - author (if present)
    - document_type (report, spec, tutorial, reference, etc.)
    - key_entities (array of named entities)
    - section_hierarchy (array of heading paths)
    Document: ${documentText}`,
  model: "claude-haiku-4-5"
});

// Step 2: Chunk with goja-text (structure-aware)
const chunks = text.markdown.chunk({
  text: documentText,
  strategy: "heading",
  maxChunkSize: 512
});

// Step 3: Enrich chunks with metadata
const enrichedChunks = chunks.map(chunk => ({
  ...chunk,
  metadata: {
    ...metadata,
    section_heading: chunk.heading,
    position_in_doc: chunk.index / chunks.length,
    parent_section: chunk.parentHeading
  }
}));

// Step 4: Create "contextual chunks" — embed text + metadata together
const embeddings = await rag.embedChunks({
  chunks: enrichedChunks.map(c => 
    `Document: ${c.metadata.title} | Type: ${c.metadata.document_type} | Section: ${c.metadata.section_heading}\n${c.content}`
  ),
  model: "text-embedding-3-small"
});
```

### Implementation steps

1. Add a `rag-ops.extractMetadata()` function that calls geppetto for document-level metadata extraction
2. Extend the `chunks` table schema to store metadata fields: `title`, `document_type`, `section_heading`, `key_entities`, `date`
3. Implement "contextual chunks" embedding: concatenate metadata with chunk text before embedding
4. Add pre-retrieval filtering: filter by metadata before vector search
5. Add metadata to BM25 index fields for hybrid search

### Experiment to run

**Benchmark**: Compare baseline (text-only embedding) vs contextual chunks (text + metadata embedding) vs contextual chunks + pre-retrieval filtering.

**Expected outcome**: Based on source 12, embedding metadata with text gives the biggest single improvement in the metadata-driven approach.

---

## Avenue 4: Implement Hybrid Search (BM25 + Vector + Reranking)

**Priority**: High — all three research streams (Anthropic, Elastic, Redis) validate this

### What to build

```javascript
const rag = require("rag-ops");

// Hybrid search with weighted fusion
const results = await rag.hybridSearch({
  query: userQuery,
  vectorWeight: 0.8,
  bm25Weight: 0.2,
  topK: 20,
  rerank: true,
  rerankModel: "cohere-rerank-v3",  // or custom reranker
  rerankTopN: 150  // retrieve 150 candidates, rerank to 20
});
```

### Implementation steps

1. Add a BM25 search backend (bleve for Go-native, or SQLite FTS5 for simplicity)
2. Implement `hybridSearch()` with weighted Reciprocal Rank Fusion
3. Add reranking step: call geppetto for cross-encoder reranking, or implement a lightweight custom reranker
4. Support multiple retrieval strategies: vector-only, BM25-only, hybrid

### Experiment to run

**Benchmark**: Compare vector-only vs BM25-only vs hybrid (80/20) vs hybrid + reranking.

**Key questions**:
- What's the optimal semantic/BM25 weight ratio for our corpus?
- Does reranking with a smaller model (e.g., geppetto's `runInference`) approximate Cohere reranker performance?

---

## Avenue 5: Chunking Strategy Comparison Benchmarks

**Priority**: Medium — need to know which strategy works best for our specific corpus

### What to investigate

Based on sources 11 and 13, we should benchmark our existing `MarkdownHeadingChunker` against:

1. **Paragraph Group Chunking (PGC)** — the overall winner in the 36-strategy study
2. **Dynamic Token Size Chunking** — near Pareto-optimal frontier
3. **Fixed-size with overlap** — baseline
4. **Semantic chunking** — to verify whether it helps on our corpus

### Implementation

Create a goja benchmarking script:

```javascript
const text = require("goja-text");
const rag = require("rag-ops");

const strategies = [
  { name: "markdown-heading", fn: () => text.markdown.chunk({text, strategy: "heading"}) },
  { name: "paragraph-group", fn: () => text.chunk({text, strategy: "paragraph"}) },
  { name: "fixed-512-overlap-50", fn: () => text.chunk({text, strategy: "fixed", size: 512, overlap: 50}) },
  { name: "dynamic-token", fn: () => text.chunk({text, strategy: "dynamic"}) },
];

for (const strategy of strategies) {
  const chunks = strategy.fn();
  const embeddings = await rag.embedChunks({chunks});
  const metrics = await rag.evaluate({embeddings, testSet: evalSet});
  console.log(`${strategy.name}: nDCG@5=${metrics.ndcg5}, Hit@5=${metrics.hit5}`);
}
```

### Key questions
- Does our markdown-heavy corpus benefit from PGC over heading-based chunking?
- Is semantic chunking worth the cost for our specific document types?
- What's the optimal chunk size for our corpus?

---

## Avenue 6: Reranking with Geppetto

**Priority**: Medium — all sources confirm reranking adds 2-5 percentage points

### What to investigate

Can we use geppetto's `runInference()` as a reranker instead of paying for Cohere?

```javascript
const geo = require("geppetto");

async function rerank(query, chunks, topK = 20) {
  const scored = await Promise.all(chunks.map(async (chunk, i) => {
    const response = await geo.runInference({
      prompt: `Rate the relevance of this text to the query on a scale of 0-10.
        Query: ${query}
        Text: ${chunk.content}
        Relevance score (0-10):`,
      model: "claude-haiku-4-5",
      maxTokens: 10
    });
    return { chunk, score: parseFloat(response) };
  }));
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
```

### Key questions
- How does LLM-based reranking compare to dedicated cross-encoder rerankers?
- What's the latency/cost trade-off?
- Can we use a smaller, faster model for reranking?

---

## Avenue 7: Document-Level Context Windows (No Chunking)

**Priority**: Low — only relevant for small corpora, but worth noting

### What to investigate

Anthropic's blog notes: "If your knowledge base is smaller than 200,000 tokens (~500 pages), you can just include the entire knowledge base in the prompt." With prompt caching, this is cost-effective.

For small document collections, we could skip chunking entirely and just pass the full documents to the LLM with RAG-as-context-window.

### When this applies
- Document collections < 200K tokens
- Use cases where retrieval accuracy is paramount
- Scenarios where the cost of LLM inference is acceptable

---

## Avenue 8: Fine-Tuning Late Chunking

**Priority**: Low — requires ML training infrastructure

### What to investigate

Source 06 (Jina Part II) mentions that late chunking can be fine-tuned using contrastive loss (InfoNCE) with (query, document, relevant_span) triples. This could improve chunk embeddings for our specific domain.

### Implementation
- Create a training dataset of (query, document, relevant_chunk) triples from our evaluation data
- Fine-tune jina-embeddings-v3 with late chunking loss
- Compare retrieval performance before/after fine-tuning

---

# Part III: Prioritized Roadmap

Based on research evidence and implementability with our current stack:

## Phase 1: Foundation (2-3 weeks)

| Priority | Avenue | Effort | Expected Impact |
|---|---|---|---|
| **P0** | Avenue 1: Contextual Retrieval | Medium | 35-49% failure reduction |
| **P0** | Avenue 4: Hybrid Search (BM25 + Vector) | Medium | 5-10% additional improvement |
| **P1** | Avenue 3: Metadata Extraction | Low-Medium | Biggest single metadata gain |

## Phase 2: Optimization (2-4 weeks)

| Priority | Avenue | Effort | Expected Impact |
|---|---|---|---|
| **P1** | Avenue 5: Chunking Strategy Benchmarks | Low | Validate/optimize current approach |
| **P1** | Avenue 6: Reranking with Geppetto | Medium | 2-5 additional percentage points |
| **P2** | Avenue 2: Late Chunking | High | Alternative path, needs new provider |

## Phase 3: Advanced (exploratory)

| Priority | Avenue | Effort | Expected Impact |
|---|---|---|---|
| **P3** | Avenue 7: No-chunking for small corpora | Low | Niche optimization |
| **P3** | Avenue 8: Fine-tuning late chunking | Very High | Domain-specific improvement |

---

# Part IV: Cross-Cutting Observations

## Research Consensus

1. **Context enrichment is the single most impactful preprocessing technique** — whether through LLM-generated context (Anthropic) or whole-document embedding (Jina), adding context to chunks improves retrieval by 30-50%.

2. **Structure-aware chunking beats fixed-size and semantic chunking** — Paragraph Group Chunking, heading-based chunking, and document-structure chunking consistently outperform fixed-size and semantic approaches. Semantic chunking is not worth the computational cost for most use cases.

3. **Hybrid search (BM25 + vector) is always better than either alone** — BM25 catches exact terms, vectors catch semantics. The combination with weighted fusion (80/20 semantic/BM25) consistently improves results.

4. **Reranking is the final precision boost** — After hybrid search, reranking the top-150 candidates down to top-20 gives another 2-5 percentage points of improvement.

5. **Metadata is underutilized in most systems** — Embedding metadata with chunk text ("contextual chunks") gives significant improvements in domain-specific retrieval.

6. **Chunking strategy matters more than embedding model size** — From source 11: embedding dimensionality shows minimal correlation with performance (|r| < 0.2), while chunking strategy is the dominant factor.

## Open Questions for Our System

1. **Can we use geppetto's `runInference()` as a reranker?** Or do we need a dedicated cross-encoder model?
2. **What's the optimal semantic/BM25 weight ratio for our corpus?** Anthropic uses 80/20, but our documents may differ.
3. **Does late chunking work with OpenAI embeddings?** Or do we need to add jina-embeddings as a provider?
4. **What metadata fields are most valuable for our corpus?** We need to test which extracted fields actually improve retrieval.
5. **Should we implement prompt caching?** The cost reduction from caching is dramatic (61-90% savings), but our current geppetto integration may not support it.

## Tooling Gaps

1. **No BM25 search backend** — Need to add bleve or SQLite FTS5
2. **No metadata storage** — Chunks table only has `source_id` and `word_count`
3. **No token-level embedding access** — Current geppetto/embedding integration returns only final embeddings
4. **No reranking infrastructure** — Need a reranking step in the retrieval pipeline
5. **No chunking benchmark framework** — Need to be able to compare strategies systematically
