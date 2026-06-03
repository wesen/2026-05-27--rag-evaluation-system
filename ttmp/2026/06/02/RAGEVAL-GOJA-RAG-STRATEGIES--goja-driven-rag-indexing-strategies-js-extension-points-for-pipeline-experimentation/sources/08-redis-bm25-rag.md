---
title: "Full-text Search for RAG Apps: BM25 & Hybrid Search - Redis"
source: "https://redis.io/blog/full-text-search-for-rag-the-precision-layer/"
extracted: 2026-06-02T17:55:14-04:00
---

# Full-text Search for RAG Apps: BM25 & Hybrid Search

Source: https://redis.io/blog/full-text-search-for-rag-the-precision-layer/

"Resource Center
Events & webinars
Blog
Videos
Glossary
Resources
Architecture Diagrams
Demo Center
Full-text search for RAG: the precision layer vector search doesn't reliably replace
February 23, 2026
9 minute read
Jim Allen Wallace

Vector search gets all the hype in AI circles. But if your retrieval augmented generation (RAG) app can't find a document when a user types an exact product SKU, a legal clause number, or a specific API endpoint name, your fancy vector embeddings aren't helping anyone.

For most real-world RAG apps that care about exact identifiers, full-text search provides precision that vector search doesn't reliably match. And the best RAG systems don't choose between them; they use both.

This article covers what full-text search is, how Best Matching 25 (BM25) works, where it outperforms vector search, and how to design a hybrid retrieval system that combines keyword precision with semantic recall.

What is full-text search in modern AI apps?

Full-text search is an information retrieval technique that finds documents by matching the actual words in a query against an index of terms. Instead of scanning every document from top to bottom, it uses an inverted index, a data structure that maps terms to the documents containing them, so lookups are fast even across millions of records.

A common baseline ranking algorithm for full-text search is BM25. BM25 scores documents based on three factors:

Term frequency (TF) saturation: a word appearing 100 times doesn't score 100x higher than one appearance. Each additional occurrence has diminishing impact, which prevents keyword-stuffed documents from dominating results.
Document length normalization: longer documents don't automatically win just because they contain more words. BM25 adjusts scores relative to the average document length in your collection, so a concise answer can outrank a lengthy spec.
Inverse document frequency (IDF): rare terms carry more weight than common ones. A search for EKS or HNSW should narrow results fast, while \\"the\\" shouldn't influence ranking at all.

Modern full-text search engines often layer practical features on top of BM25:

Tokenization: splitting text into searchable terms (and deciding what counts as a term).
Stemming or lemmatization: matching \\"running\\" with \\"run\\" based on language rules.
Stop words: optionally ignoring ultra-common words like \\"the\\" or \\"is.\\"
Phrase queries: matching exact sequences like \\"terms of service\\".
Field weighting: boosting matches in title over body, or giving extra weight to tags.

In AI apps, full-text search typically serves three roles: (1) finding exact identifiers, (2) filtering candidates before vector search, or (3) providing a precision check when semantic retrieval returns loosely related results.

Why BM25 works so well as the precision layer

If you've only ever treated BM25 as \\"keyword search,\\" you're missing what makes it effective. Most people assume that if a keyword appears, it matches. BM25 goes further: it estimates how important that match is. IDF down-weights terms that appear in nearly every document, so common words don't dominate results. TF saturation ensures that one mention of POST /v2/exports is a strong signal, but the 50th mention isn't 50x more meaningful. And length normalization prevents a 20-page spec from outranking a one-paragraph answer just because it has more surface area. Together, these factors are why BM25 tends to \\"feel\\" right for humans searching docs, tickets, policies, and code-adjacent text.

Query parsing also shapes what \\"matching\\" even means. The query error E0427 billing retry is treated as a bag of terms, while \\"error E0427\\" \\"BillingService::retryCharge\\"triggers phrase matching, and billing (retry OR recover) -deprecated introduces boolean logic. These three queries look similar to a user, but they produce wildly different retrieval. If you want full-text search to be a reliable RAG tool, be explicit about what your system supports: whether quotes trigger phrase queries, which boolean operators are available, and whether users can scope queries to specific fields like title:\\"rate limiting\\". These decisions change recall and precision before vectors get a vote.

Full-text search vs. vector search

Full-text search and vector search answer fundamentally different questions. Full-text search finds where an exact term or phrase appears. Vector search finds content that is semantically similar to what the user means, even when the wording differs.

Full-text search is the stronger choice when queries contain exact tokens that matter (SKUs, error codes, endpoint paths), when you need phrase matching for legal or compliance language, when boolean logic and explicit filters are required, or when you want explainable ranking. Vector search is typically better when users ask questions in natural language without knowing the precise terminology, when you need matches across synonyms and paraphrases, or when the best answer is buried in a chunk that doesn't share exact keywords with the query.

Each approach has a blind spot. Full-text search misses relevant documents when wording changes (\\"terminate\\" vs. \\"cancel\\"). Vector search can be unreliable for exact identifiers when the token itself is the point (/v1/auth/token is not great). If you've ever watched a chatbot confidently cite the wrong policy because two paragraphs were \\"kind of similar,\\" you've seen why relying on only one approach tends to fail in ways that annoy real users.

Why you should care about full-text search in RAG

The generation part of RAG gets all the attention, but retrieval is what determines whether your app's answers are trustworthy. When retrieval fails, you typically get one of these outcomes:

The model answers without enough context, and hallucination risk goes up.
The retriever surfaces the wrong chunk, one that sounds plausible but isn't.
The app returns \\"no results,\\" and the user goes back to grep, Slack, or your support team.

Full-text search helps because it's deterministic about exact strings. It's also typically fast and cheap to run, which matters when you're doing retrieval on every chat turn.

Common RAG failure modes where full-text search helps:

Identifier queries: \\"What does error E0427 mean?\\"
Protocol and API docs: \\"How do I call POST /v2/exports?\\"
Policy and legal references: \\"What does section 7.2 say about retention?\\"
Codebase knowledge: \\"Where is BillingService::retryCharge() used?\\"

If queries like these are part of your product, full-text search is likely doing more for retrieval quality than you'd expect.

How full-text search fits into retrieval architectures

Full-text search usually shows up in one of three patterns.

Full-text as the primary retriever

This is the classic setup: index your docs, run BM25, return the top results.

It tends to work well when:

Queries are mostly keyword-based.
Your content has strong terminology and structured language (docs, tickets, specs).
You need exact matching more than semantic recall.
Full-text as a filter for vector search

This is a common hybrid pattern:

Use full-text search to narrow the candidate set (by keyword, phrase, or metadata fields).
Run vector search inside that smaller set to rank by meaning.

The idea is to combine high precision from exact filtering with semantic ranking to surface the best chunk.

Full-text as a backstop

Sometimes you run vector search first, but if confidence is low—or the user query looks like an identifier—you fall back to full-text.

This \\"routing\\" approach is often worth it, but it's usually best to keep the routing logic simple. Over-engineering query classification tends to add more latency and bugs than it solves.

How hybrid search works (full-text + vectors) for better RAG

Hybrid search combines exact matching with semantic ranking. You're typically trying to answer two questions: what should be eligible (filters), and what should be ranked highest (scoring).

A straightforward approach works well for most systems. Start with metadata filters like tenant ID, product, or document type as hard constraints. Then run full-text search and vector search inside that boundary, and combine the scores with a weighted sum. Semantic similarity is not an access control mechanism, so filtering before retrieval is important for both correctness and cost.

Two patterns are worth knowing about. First, treat identifier-shaped queries differently. If a query looks like ABC-123, /v1/..., or ERR_..., leaning toward exact and phrase matches often produces better results. Otherwise, a more semantic-heavy blend tends to work well. Simple heuristics cover a lot of ground here. Second, index what users actually type. If users search for k8s but your docs spell out \\"Kubernetes,\\" adding synonyms and common aliases has an outsized effect on match quality.

The overall shape of most hybrid retrieval pipelines is similar: metadata filters first, then two retrievers (full-text and vector) running in parallel, then a merge and re-rank. Keep the outputs debuggable so you can answer \\"why did it cite that?\\" and tune your hybrid weights based on real results instead of guessing.

Hybrid patterns that punch above their weight

Beyond the basic \\"keywords plus vectors\\" setup, a few extra patterns are worth considering.

Use full-text to anchor citations. A common RAG failure mode is correct concept but wrong citation. After you pick top chunks semantically, run a lightweight full-text check for the key tokens you plan to cite (section numbers, endpoint paths, function names). If a chunk doesn't pass that check, it's a risky citation.
Be intentional about chunk boundaries. Chunking is usually discussed as a vector search problem, but it affects full-text search too. If you split legal docs mid-clause, phrase queries get flaky. Chunking on structural boundaries (headings, list items, code blocks) typically gives you cleaner phrase matches and better citations.
Store two representations of the same text. Keep a \\"display\\" version with original casing and formatting, and an \\"index\\" version with normalized text for better match rates. This helps with queries like BillingService::retryCharge() where punctuation matters for exact lookups, but normalization helps the rest of the time.
What to look for in a search engine for hybrid RAG retrieval

Hybrid retrieval is often simpler and faster when full-text search, vector search, and metadata filtering all run in the same system. Splitting them across separate tools means more integration work, more latency from network hops, and more operational overhead to keep indexes in sync. The fewer moving parts between your query and your ranked results, the easier hybrid retrieval is to build, debug, and keep fast.

It also helps when your search layer sits close to your operational data. If you're already storing sessions, cached responses, or app state in one system, running retrieval there too means one less datastore to manage. Redis Query Engine supports full-text search, vector search, and hybrid queries in a single real-time data platform designed for low-latency retrieval. Actual performance depends on deployment and workload, but this architecture makes it a natural fit for RAG workloads where retrieval sits on the critical path.

Your RAG needs both precision & meaning

Vector search is great at \\"what did the user mean?\\" Full-text search is great at \\"where is that exact thing?\\" In real RAG apps, you usually need both.

Full-text search gives you deterministic matching for identifiers, clause numbers, endpoints, and exact phrases. BM25-style ranking is a solid default, especially when you add field weighting, phrase queries, and filters. And hybrid search (full-text + vectors) is often the practical sweet spot, combining keyword precision with semantic recall.

If you want hybrid retrieval to feel fast, it helps when your search engine is also built for real-time workloads. Redis is a real-time, in-memory data platform designed for low latency. With Redis Query Engine, you can add full-text search, vector search, and hybrid queries in the same system, so you can build a retrieval layer that's both precise and semantic without turning your RAG architecture into a pile of moving parts.

Try Redis free to test hybrid retrieval with your own documents and queries, or talk to our team about hybrid search design and keeping retrieval fast under load.

Découvrez Redis dès aujourd’hui.

Échangez avec un expert Redis et découvrez dès aujourd’hui notre solution Redis Entreprise.


Essayer gratuitement
Contacter l’équipe"