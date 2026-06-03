---
title: "A Systematic Investigation of Document Chunking Strategies and Embedding Sensitivity (arxiv 2603.06976)"
source: "https://arxiv.org/html/2603.06976"
extracted: 2026-06-02T17:53:35-04:00
---

# A Systematic Investigation of Document Chunking Strategies and Embedding Sensitivity

Source: https://arxiv.org/html/2603.06976

"Back to arXiv
License: CC BY 4.0
arXiv:2603.06976v1 [cs.CL] 07 Mar 2026
A Systematic Investigation of Document Chunking Strategies and Embedding Sensitivity
Muhammad Arslan Shaukat
Open Source Institute, Faculty of Science and Technology, University of Canberra, Canberra, Australia
arslan.shaukat@canberra.edu.au
Muntasir Adnan
Open Source Institute, Faculty of Science and Technology, University of Canberra, Canberra, Australia
Carlos C. N. Kuhn
Open Source Institute, Faculty of Science and Technology, University of Canberra, Canberra, Australia
Abstract

We present the first large-scale, cross-domain evaluation of document chunking strategies for dense retrieval, addressing a critical but underexplored aspect of retrieval-augmented systems. In our study, 36 segmentation methods spanning fixed-size, semantic, structure-aware, hierarchical, adaptive, and LLM-assisted approaches are benchmarked across six diverse knowledge domains using five different embedding models. Retrieval performance is assessed using graded relevance scores from a state-of-the-art LLM evaluator, with Normalised DCG@5 as the primary metric (complemented by Hit@5 and MRR). Our experiments show that content-aware chunking significantly improves retrieval effectiveness over naive fixed-length splitting. The top-performing strategy, Paragraph Group Chunking, achieved the highest overall accuracy (mean nDCG@5 
≈
 0.459) and substantially better top-rank hit rates (Precision@1 
≈
 24%, Hit@5 
≈
 59%). In contrast, simple fixed-size character chunking as baselines performed poorly (nDCG@5 < 0.244, Precision@1 
≈
 2-3%). We observe pronounced domain-specific differences: dynamic token sizing is strongest in biology, physics and health, while paragraph grouping is strongest in legal and maths. Larger embedding models yield higher absolute scores but remain sensitive to suboptimal segmentation, indicating that better chunking and large embeddings provide complementary benefits. In addition to accuracy gains, we quantify the efficiency trade-offs of advanced chunking. Producing more, smaller chunks can increase index size and latency. Consequently, we identify methods (like dynamic chunking) that approach an optimal balance of effectiveness and efficiency. These findings establish chunking as a vital lever for improving retrieval performance and reliability. Our work offers practical guidance for selecting chunking strategies that maximise knowledge retrieval quality while managing computational costs, informing the design of next-generation retrieval-augmented AI systems.

Introduction

Large language models (LLMs) have reshaped natural language processing through strong generative and reasoning capabilities [32, 5]. However, their knowledge remains bounded by training data and degrades over time, motivating retrieval-augmented generation (RAG) as a means to ground model outputs in external corpora [17]. By integrating dense retrieval with generation, RAG systems improve factual accuracy, transparency, and applicability across knowledge-intensive domains, including law [8], finance [7], and medicine [13]. Consequently, dense retrieval has become a foundational component of modern knowledge-driven systems [26, 23].


A central yet underexamined component of dense retrieval pipelines is chunking, the segmentation of documents into retrievable units prior to embedding and indexing. Chunking governs how semantic information is represented in vector space, how efficiently similarity search operates, and how faithfully retrieved evidence reflects the source text [26, 4]. Despite its ubiquity, chunking has traditionally been treated as a secondary engineering choice. Recent studies, however, demonstrate that segmentation decisions can substantially affect retrieval effectiveness, latency, memory usage, and index size [3, 21]. Suboptimal chunking can dilute semantic coherence, inflate computational costs, and undermine the benefits of advanced embedding models.


Conventional dense retrieval systems rely on fixed-size chunking, segmenting documents into uniform spans of tokens or characters. While simple and reproducible, this approach assumes uniform information density across text. Empirical evidence from long-document retrieval shows that chunk size has a strong and often non-linear effect on performance [3, 16, 11]. Smaller chunks favour precise matching but risk losing context, whereas larger chunks capture broader semantics at the cost of increased redundancy and query mismatch [3]. These effects further interact with embedding architectures: sentence-level encoders and retrieval-tuned contrastive models exhibit distinct optimal segmentation regimes [34, 1]. Such findings indicate that fixed-size chunking is insufficiently flexible for diverse retrieval settings.


In response, a growing body of work has proposed semantic and structure-aware chunking strategies. Semantic chunking groups text by meaning similarity to form contextually coherent units [15], while structure-aware methods leverage layout cues such as headings, sections, and metadata to preserve logical boundaries [38]. These approaches have shown consistent gains in domain-specific applications, including financial filings [7] and legal reasoning tasks [8]. More recent advances extend segmentation beyond flat representations. Hierarchical chunking enables multi-resolution retrieval and improved interpretability [22], while late chunking embeds long documents holistically before partitioning, preserving global context [23]. Adaptive methods further adjust chunk boundaries based on content complexity or semantic variability [39, 19]. Together, these developments reflect a shift toward content-sensitive segmentation as a key design lever in retrieval systems.


Chunking strategies have also been specialised for particular domains, including biomedical literature [18], finance [10], legal documents [30], and code retrieval [9], reinforcing that segmentation is inherently domain-dependent. Parallel efforts have sought to formalise chunking evaluation through protocols and benchmarks such as A New HOPE [4] and Hichunk [22], as well as diagnostic tools like RAGTrace [6] and optimisation frameworks such as RAGSmith [14]. Nonetheless, most existing studies evaluate a limited set of methods, confound chunking with retrieval or embedding choices, or omit efficiency analysis. As a result, key questions regarding cross-domain generalisation, embedding interactions, and operational trade-offs remain unresolved [29, 22].


This paper addresses these gaps through a systematic benchmark evaluating 36 chunking strategies across 6 domains and 5 embedding models (1,080 configurations total) the largest controlled comparison of chunking methods to date. We systematically evaluate thirty-six chunking strategies, including fixed-size, semantic, structure-aware, hierarchical, adaptive, and late chunking, across six domains and five embedding models under a fixed retrieval configuration. Retrieval effectiveness is evaluated using graded relevance judgments produced by large language models, with Normalised Discounted Cumulative Gain (nDCG@5) as the primary ranking sensitive metric, complemented by Hit Rate (Hits@5) and Mean Reciprocal Rank (MRR) to capture retrieval accuracy. In addition, we analyse latency, memory consumption, and index size to characterise efficiency accuracy trade-offs.


Our results demonstrate consistent performance hierarchies across domains and embedding models, showing that structurally informed and adaptive chunking strategies frequently outperform fixed-size baselines while exhibiting greater robustness. However, these gains often incur additional computational costs, underscoring the need to balance retrieval quality with operational constraints. Overall, this study reframes chunking as a first-class design dimension in dense retrieval and RAG systems, providing empirical guidance for principled segmentation choices in real-world deployments.

Material and Methods

This study benchmarks a wide range of document chunking strategies to evaluate their impact on dense retrieval performance across multiple knowledge domains. The full RAG systems combine retrieval with generation, this study isolates the retrieval stage to measure chunking impact without confounding effects from prompt design, decoding, or answer synthesis. Retrieval quality remains the critical bottleneck for RAG success, making this controlled analysis directly relevant. An overview of the complete pipeline is provided in Figure 1.


Figure 1:End-to-end experimental pipeline for evaluating document chunking strategies in dense retrieval. Documents from six knowledge domains (Biology, Physics, Health, Legal, Maths, Agriculture) in the UltraDomain dataset are segmented using 36 chunking strategies spanning six design categories. The resulting chunks are embedded using five dense embedding models and indexed into separate Qdrant vector stores, yielding 1,080 unique configurations. For each query, the top-5 retrieved chunks are evaluated by a Mixtral-8x22B LLM judge against the golden reference answer using a three-point graded relevance scale. The query is intentionally withheld from the evaluator to prevent lexical bias. Efficiency metrics - including index size, query latency, and memory usage are recorded in parallel across all configurations. No generation component is included; evaluation is retrieval only.
Dataset and Domains

All experiments are conducted using the UltraDomain dataset [28], a long-context benchmark designed to evaluate retrieval in scenarios where relevant information is distributed across large document collections rather than localised within a single passage. The dataset consists of multi-hop natural-language queries paired with golden reference answers, which specify the information required to satisfy each query.


The dataset spans eighteen disciplines; this study focuses on six high-density knowledge domains: Biology, Maths, Physics, Health, Legal, and Agriculture. These domains were selected to capture diverse document structures, ranging from highly formal and hierarchical texts (e.g. legal and mathematical documents) to concept-dense technical narratives (e.g. health and physics). For each domain, the original document contexts provided by UltraDomain are preserved to maintain domain-specific discourse characteristics.


Queries drive retrieval of chunks from the vector database, with no golden reference exposure during this step. Golden reference answers are not exposed during chunking, indexing, or retrieval so that it remains answer-agnostic. They are introduced only at the evaluation stage, where they are used to judge whether retrieved chunks support the reference answer.

Chunking Framework Overview

We evaluate thirty-six document chunking strategies designed to systematically explore the impact of chunk boundary selection on retrieval performance. The strategies span a broad design space and vary along three primary axes: (i) the mechanism used to determine chunk boundaries (deterministic, structural, semantic, adaptive, or model-driven), (ii) the degree of control over chunk size (fixed, overlapping, or variable), and (iii) the use of post-processing constraints such as token-length normalisation.


Each family captures a distinct chunking principle commonly used in information retrieval and neural retrieval pipelines, including fixed-size segmentation, linguistically motivated segmentation, semantic cohesion-based segmentation, adaptive granularity, hierarchical chunking, and LLM-assisted boundary detection. Hybrid strategies arise naturally from combining these principles in multi-stage pipelines.

Table 2 provides a complete operational and mathematical specification of each chunking strategy family. For each family, the table defines the chunk construction process, all relevant parameters, and the formal criteria used to introduce chunk boundaries.


Table 1 enumerates the full set of thirty-six implemented strategies, including their abbreviations and concrete parameterisations. Each listed strategy corresponds to either a direct instance or a parameterised hybrid of the formulations presented in Table 2. No strategy receives task-specific tuning or special handling.


Across all strategies, the downstream retrieval pipeline is held constant. Chunks constitute the atomic retrieval unit and are embedded, indexed, and retrieved using identical procedures.

Table 1:Strategy configuration matrix showing chunking category, strategy name, shorthand alias used throughout the paper, and the corresponding operational configuration derived from the experimental setup.
Category
 \\t
Strategy Name
\\t
Abbreviation
\\t
Configuration Set


Deterministic / Rule-Based
 \\t
Fixed Character Chunking
\\t
FCC
\\t
char_size=100, overlap=10

\\t
Fixed Token Chunking
\\t
FC
\\t
token_size=50, overlap=0

\\t
Overlapping Token Chunking
\\t
OFC
\\t
token_size=50, overlap=10

\\t
Sliding Window Token Chunking
\\t
SWC
\\t
window=50, step=25

\\t
Length Aware Chunking
\\t
LAC
\\t
target=500, tolerance=100

\\t
Sentence Based Chunking
\\t
SBC
\\t
sentence boundaries

\\t
Sentence Group Chunking
\\t
SGC
\\t
sentences=3, overlap=1

\\t
Paragraph Based Chunking
\\t
PBC
\\t
paragraph boundaries

\\t
Paragraph Group Chunking
\\t
PGC
\\t
paragraphs=2, overlap=1


Recursive / Hierarchical
 \\t
Recursive Chunking
\\t
RC
\\t
chunk_size=500, overlap=50

\\t
Recursive Token Fallback Chunking
\\t
RTF
\\t
token_size=100, overlap=10

\\t
Parent Child Chunking
\\t
PCC
\\t
parent=500, child=100


Semantic / Topic-Aware
 \\t
Semantic Embedding Based Chunking
\\t
SEBC
\\t
embedding similarity grouping

\\t
Semantic Similarity Threshold Chunking
\\t
SSTC
\\t
similarity threshold=0.6

\\t
Topic Based Chunking
\\t
TBC
\\t
topic distance threshold=0.4

\\t
Semantic Boundary Detection
\\t
SBDC
\\t
semantic boundary detection


Adaptive / Dynamic
 \\t
Dynamic Token Size Chunking
\\t
DFC
\\t
min=50, max=200 tokens

\\t
Content Density Adaptive Chunking
\\t
CDAC
\\t
base_size=1000

\\t
Semantic Variance Adaptive Chunking
\\t
SVAC
\\t
sensitivity=0.2


Late Chunking / Index-First
 \\t
Late Chunking Sentence Indexing
\\t
LCSI
\\t
sentence-level indexing

\\t
Late Chunking Paragraph Indexing
\\t
LCPI
\\t
paragraph-level indexing

\\t
Late Chunking Token Spans
\\t
LCTS
\\t
span=128, step=64


LLM-Driven
 \\t
LLM Boundary Detection Chunking
\\t
LBDC
\\t
LLM-based boundary inference

\\t
LLM Segment Then Chunk
\\t
LSTC
\\t
LLM segmentation + size constraint


Semantic-First Hybrids
 \\t
Hybrid Semantic Fixed Token Chunking
\\t
HSmFC
\\t
semantic 
→
 token(200,20)

\\t
Hybrid Semantic Sliding Window Chunking
\\t
HSSC
\\t
semantic 
→
 window(50,25)

\\t
Hybrid Semantic Variance Fixed Token Chunking
\\t
HSVFC
\\t
variance 
→
 token(200,20)


Structural-First Hybrids
 \\t
Hybrid Sentence Fixed Token Chunking
\\t
HSnFC
\\t
sentence 
→
 token(200,20)

\\t
Hybrid Sentence Group Fixed Token Chunking
\\t
HSGC
\\t
sent_group 
→
 token(200,20)

\\t
Hybrid Paragraph Fixed Token Chunking
\\t
HPFC
\\t
paragraph 
→
 token(200,20)

\\t
Hybrid Paragraph Group Fixed Token Chunking
\\t
HPGC
\\t
para_group 
→
 token(200,20)

\\t
Hybrid Recursive Fixed Token Chunking
\\t
HRC
\\t
recursive 
→
 token(200,20)

\\t
Hybrid Fixed Char Fixed Token Chunking
\\t
HFCF
\\t
char(100,10) 
→
 token(200,20)

\\t
Hybrid Overlapping Fixed Token Chunking
\\t
HOFC
\\t
overlap(50,10) 
→
 token(200,20)

\\t
Hybrid Dynamic Fixed Token Chunking
\\t
HDFC
\\t
dynamic(50-200) 
→
 token(200,20)

\\t
Hybrid Content Density Fixed Token Chunking
\\t
HCDC
\\t
density 
→
 token(200,20)

Configuration legend. Numeric pairs are reported as (size, overlap) in tokens unless otherwise stated. Ranges (e.g., 50-200) denote adaptive minimum and maximum token limits. window(step) denotes sliding window size and stride. Arrows (
→
) indicate sequential hybrid execution, where the primary chunking strategy is applied first and the output is subsequently normalised by the secondary strategy. Structural boundaries (sentence/paragraph) imply no fixed size unless combined with token normalisation. Similarity thresholds and sensitivities are cosine-based unless otherwise noted.

Table 2:Detailed specification of chunking strategies evaluated in this study. Each row provides a complete operational and mathematical definition; all implemented strategies correspond to parameterised instances or hybrids of these formulations.
Strategy
 \\t
Operational Definition
\\t
Formal Specification and Parameters


Fixed Token Chunking (FC)
 \\t
The document is tokenised and split into contiguous, non-overlapping chunks of fixed length. Each chunk is treated as an independent retrieval unit.
\\t
Let 
𝑇
=
[
𝑡
1
,
…
,
𝑡
𝑁
]
 be the token sequence of document 
𝐷
. The 
𝑖
-th chunk is defined as 
𝐶
𝑖
=
𝑇
[
(
𝑖
−
1
)
𝐾
:
(
𝑖
−
1
)
𝐾
+
𝐾
]
, where 
𝐾
 is the fixed number of tokens per chunk.


Fixed Character Chunking (FCC)
 \\t
The raw document text is divided into contiguous character spans of equal length, independent of linguistic structure.
\\t
Let 
𝐷
 be a character sequence. 
𝐶
𝑖
=
𝐷
[
(
𝑖
−
1
)
𝐿
:
(
𝑖
−
1
)
𝐿
+
𝐿
]
, where 
𝐿
 is the fixed number of characters per chunk.


Sliding Window Token Chunking (SWC / OFC)
 \\t
Overlapping token windows are generated to preserve contextual continuity across chunk boundaries.
\\t
𝐶
𝑖
=
𝑇
[
(
𝑖
−
1
)
𝑆
:
(
𝑖
−
1
)
𝑆
+
𝑊
]
, where 
𝑊
 is the window size (tokens) and 
𝑆
 is the stride. Overlap occurs when 
𝑆
<
𝑊
.


Sentence-Based and Sentence-Group Chunking (SBC / SGC)
 \\t
Chunks are formed by grouping one or more consecutive sentences, preserving sentence boundaries.
\\t
Let 
{
𝑠
1
,
…
,
𝑠
𝑛
}
 denote sentences in 
𝐷
. 
𝐶
𝑖
=
{
𝑠
(
𝑖
−
1
)
​
(
𝐺
−
𝑂
)
+
1
,
…
,
𝑠
(
𝑖
−
1
)
​
(
𝐺
−
𝑂
)
+
𝐺
}
, where 
𝐺
 is the number of sentences per chunk and 
𝑂
 is sentence overlap.


Paragraph-Based and Paragraph-Group Chunking (PBC / PGC)
 \\t
Chunks align with paragraph boundaries or groups of adjacent paragraphs.
\\t
Let 
{
𝑝
1
,
…
,
𝑝
𝑚
}
 denote paragraphs. 
𝐶
𝑖
=
{
𝑝
(
𝑖
−
1
)
​
(
𝐺
−
𝑂
)
+
1
,
…
,
𝑝
(
𝑖
−
1
)
​
(
𝐺
−
𝑂
)
+
𝐺
}
, where 
𝐺
 is the number of paragraphs and 
𝑂
 is overlap.


Recursive Chunking (RC / RTF)
 \\t
Documents are recursively segmented using increasingly fine rules until a size constraint is met, with fallback token splitting if required.
\\t
Given segment 
𝑥
, recursively apply 
split
​
(
𝑥
)
 until 
|
𝐶
𝑖
|
≤
𝐿
, where 
𝐿
 is the maximum allowable chunk size (tokens or characters).


Parent–Child Chunking (PCC)
 \\t
A hierarchical structure is constructed in which parent chunks preserve broader context and child chunks serve as the atomic retrieval unit.
\\t
Parent chunks 
𝑃
𝑗
 satisfy 
|
𝑃
𝑗
|
≤
𝐿
𝑝
. Each parent is subdivided into child chunks 
𝐶
𝑗
,
𝑘
⊂
𝑃
𝑗
, with 
|
𝐶
𝑗
,
𝑘
|
≤
𝐿
𝑐
, where 
𝐿
𝑝
>
𝐿
𝑐
.


Dynamic Token Size Chunking (DFC / LAC)
 \\t
Chunk sizes vary dynamically within predefined bounds to balance granularity and context.
\\t
Each chunk size 
𝐾
𝑖
 is selected such that 
𝐾
𝑖
∈
[
𝐾
min
,
𝐾
max
]
, where 
𝐾
min
 and 
𝐾
max
 are minimum and maximum token limits.


Content Density Adaptive Chunking (CDAC)
 \\t
Chunk sizes are adjusted inversely to local lexical density, producing smaller chunks in information-dense regions.
\\t
Lexical density is defined as 
𝜌
​
(
𝑥
)
=
|
𝑉
​
(
𝑥
)
|
|
𝑥
|
, where 
𝑉
​
(
𝑥
)
 is the set of unique tokens in segment 
𝑥
. Chunk size scales as 
𝐾
𝑖
∝
𝜌
​
(
𝑥
)
−
1
.


Semantic Similarity Threshold Chunking (SSTC)
 \\t
Semantic boundaries are introduced when adjacent segments become dissimilar in embedding space.
\\t
Let 
𝑓
​
(
⋅
)
 be an embedding function. 
sim
​
(
𝑥
𝑖
,
𝑥
𝑖
+
1
)
=
𝑓
​
(
𝑥
𝑖
)
⋅
𝑓
​
(
𝑥
𝑖
+
1
)
‖
𝑓
​
(
𝑥
𝑖
)
‖
​
‖
𝑓
​
(
𝑥
𝑖
+
1
)
‖
. A boundary is inserted if 
sim
​
(
𝑥
𝑖
,
𝑥
𝑖
+
1
)
<
𝜃
, where 
𝜃
 is a similarity threshold.


Semantic Variance Adaptive Chunking (SVAC)
 \\t
Boundaries are triggered when semantic similarity drops significantly relative to recent context.
\\t
A rolling mean similarity 
𝜇
 is maintained. A boundary is introduced if 
sim
​
(
𝑥
𝑖
,
𝑥
𝑖
+
1
)
<
𝜇
−
𝛿
, where 
𝛿
 controls sensitivity to semantic change.


Topic-Based Chunking (TBC)
 \\t
Chunks correspond to contiguous regions sharing the same inferred topic.
\\t
Sentences are embedded and clustered. A boundary is introduced when 
cluster
​
(
𝑥
𝑖
)
≠
cluster
​
(
𝑥
𝑖
+
1
)
.


LLM Boundary Detection (LBDC / LSTC)
 \\t
Chunking is formulated as a learned boundary detection task using a language model.
\\t
The model predicts boundary probability 
𝑝
​
(
𝑏
𝑖
=
1
∣
𝑥
𝑖
,
𝑥
𝑖
+
1
)
. A boundary is inserted if 
𝑝
​
(
𝑏
𝑖
=
1
)
>
𝜏
, where 
𝜏
 is a decision threshold.


Late Chunking Strategies (LCTS / LCSI / LCPI)
 \\t
Chunk construction is deferred until retrieval or query time to preserve full-document context.
\\t
Chunks are materialised as 
𝐶
𝑖
=
segment
​
(
𝐷
∣
𝑞
)
, where 
𝑞
 is the retrieval query and segmentation depends on query relevance.


Hybrid Chunking Strategies
 \\t
Two-stage pipelines combining semantic or structural segmentation with strict size normalisation.
\\t
𝒞
=
𝒮
​
(
𝒫
​
(
𝐷
)
)
, where 
𝒫
 produces coherent segments and 
𝒮
 enforces token or character length constraints.
Embedding Models and Index Construction

Each chunk produced by a given strategy is embedded using five publicly available models that span high-capacity multilingual transformers, compact sentence encoders, and static retrieval-oriented embeddings. At the high end, we employ BAAI/bge-m3, a 1024-dimensional multilingual embedding model designed for dense, sparse, and multi-vector retrieval and shown to achieve state-of-the-art performance on multilingual and cross-lingual retrieval benchmarks [24]. As a strong but lightweight transformer baseline, we use sentence-transformers/all-MiniLM-L6-v2, a 384-dimensional MiniLM variant distilled for task-agnostic semantic similarity and widely adopted for semantic search and sentence embedding tasks [37, 36]. We include three static-embedding POTION / Model2Vec models (potion-8M, potion-4M, potion-2M) that provide 256, 128, and 64 dimensional token embeddings respectively, aligning with recent work showing that static word embeddings distilled from Sentence Transformers can yield competitive sentence representations [33].


For each combination of domain, chunking strategy, and embedding model, a separate vector index is constructed using the Qdrant vector database [27]. All indices share identical configuration parameters, including distance metric and indexing settings, to ensure fair comparison across conditions and independent analysis of chunking and embedding effects while preserving their interaction.

Dense Retrieval Setup

Dense retrieval is performed using cosine similarity between query embeddings and indexed chunk embeddings. For each query, the retriever returns the top-5 most similar chunks. This retrieval depth reflects common deployment settings in dense retrieval systems and allows meaningful differentiation between chunking strategies using graded ranking metrics.


No sparse retrieval, re-ranking, fusion, or generation-based refinement is applied. The output of the retrieval stage is a ranked list of retrieved chunks for each query, which will serve as input to the evaluation stage along with the golden answer.

Relevance Evaluation and Metrics

Retrieval quality is evaluated using graded answer-support judgements produced by a large language model acting as an automated assessor. For each query, the evaluator is provided with the retrieved chunks returned by the dense retriever and the corresponding golden reference answer from the dataset. The query itself is intentionally withheld from the evaluator, who is shown only the answer and the retrieved chunk. This setup is designed to assess whether the retrieved chunks support the reference answer, rather than their conventional relevance to query text.


The evaluator is asked to assess the extent to which each retrieved chunk contains information that supports or contributes to the golden reference answer. This formulation treats relevance assessment as an answer support attribution task, rather than query-document matching, and is well-suited to the multi-hop and long-context design of the UltraDomain benchmark. The golden reference answer is used exclusively for post-retrieval evaluation and is never exposed to the chunking, indexing, or retrieval stages, ensuring that retrieval performance is evaluated independently of answer knowledge.


Prior research has shown that reference based metrics such as BLEU and BertScore, often exhibit weak correlation with human judgements on reasoning-intensive tasks, especially when deep semantic support must be assessed [20]. These metrics are primarily sensitive to surface level lexical overlap or static embedding similarity and therefore struggle to distinguish chunks that genuinely support a target answer, as opposed to merely sharing vocabulary or local paraphrases. In contrast, large language models prompted as evaluators (LLM-as-a-judge) follow natural-language rubrics and directly score properties such as coherence, factual consistency, and answer support, and they consistently achieve much stronger alignment with human preferences across summarisation, dialogue, QA, statistical reasoning, and evaluation tasks [31, 20, 12, 35, 25, 2].


We employ mistralai/mixtral-8x22b-instruct-v0.1 (via Ollama) as the fixed relevance evaluator. This model is selected based on its top-ranked performance in a recent large-scale LLM judge benchmark measuring agreement with human annotators, where it achieves highly consistent performance relative to humans (Z-score = 1.45 above the mean of all evaluated LLM judges in [12]), strong correlation with human relevance scores (Pearson r = 0.879), and high inter-rater reliability (Cohen’s k = 0.813). Each retrieved chunk is assigned a graded relevance score on a three-point ordinal scale:


• 

Irrelevant, 0: the chunk does not address or support the reference answer.

• 

Partially relevant, 1: the chunk is related to the topic but only partially supports the reference answer.

• 

Fully relevant, 2: the chunk directly and completely supports the reference answer.

To ensure deterministic and reproducible outputs, inference was conducted with temperature = 0 and top_p = 0.1. The following zero-shot system prompt was provided verbatim to the evaluator:

You are a strict information retrieval judge.

Reference Answer:
{answer}

Retrieved Chunk:
{chunk_text}

Assign a relevance score:
0 = Not relevant
1 = Partially relevant
2 = Fully relevant

Respond with JSON only:
{
  \\"score\\": 0 | 1 | 2,
  \\"reason\\": \\"short explanation\\"
}

Processing

For each query 
𝑞
 under configuration 
(
𝑚
,
𝑑
,
𝑠
)
 comprising embedding model 
𝑚
, domain 
𝑑
, and chunking strategy 
𝑠
 we evaluated the top 
𝐾
=
5
 retrieved chunks ordered by rank. We report Normalised Discounted Cumulative Gain at rank 5 (nDCG@5) as the primary effectiveness metric, as it jointly captures ranking order and graded relevance. Let 
𝑔
𝑖
∈
{
0
,
1
,
2
}
 denote the gain at rank 
𝑖
. The Discounted Cumulative Gain is:

\\t
DCG
​
@
​
5
​
(
𝑞
,
𝑚
,
𝑑
,
𝑠
)
=
∑
𝑖
=
1
5
𝑔
𝑖
log
2
⁡
(
𝑖
+
1
)
\\t

The discount factor 
log
2
⁡
(
𝑖
+
1
)
 penalises relevant chunks that appear at lower ranks, rewarding strategies that surface the most useful content first. To normalise across queries with different gain distributions, we compute an Ideal DCG (IDCG) by pooling all gains observed for query 
𝑞
 across all chunking strategies (under fixed 
𝑚
 and 
𝑑
), sorting them in descending order, and applying the same discount:

\\t
IDCG
​
@
​
5
​
(
𝑞
,
𝑚
,
𝑑
)
=
∑
𝑖
=
1
5
𝑔
𝑖
⋆
log
2
⁡
(
𝑖
+
1
)
\\t

where 
𝑔
1
⋆
≥
𝑔
2
⋆
≥
⋯
≥
𝑔
5
⋆
 are the top-5 pooled gains. This defines the ideal ranking relative to what the judge has actually assessed, grounding normalisation in observed data. The normalised score is then:

\\t
nDCG
​
@
​
5
​
(
𝑞
,
𝑚
,
𝑑
,
𝑠
)
=
{
DCG
​
@
​
5
​
(
𝑞
,
𝑚
,
𝑑
,
𝑠
)
IDCG
​
@
​
5
​
(
𝑞
,
𝑚
,
𝑑
)
\\t
if 
​
IDCG
​
@
​
5
>
0


0
\\t
otherwise
\\t

Binary metrics, including Hit@5 and MRR@5, are reported for complementary analysis and to facilitate comparison with prior retrieval benchmarks. We adopt a strict relevance criterion for binary metrics: only chunks judged fully relevant (score 
=
2
) are counted as relevant. Partially relevant chunks (score 
=
1
) are treated as non-relevant for Hit@5 and MRR, avoiding inflation of success rates by near-miss retrievals.


Hit@5 is a binary indicator of whether at least one fully relevant chunk appears in the top 5 results:

\\t
Hit
@
5
(
𝑞
,
𝑚
,
𝑑
,
𝑠
)
=
𝟏
[
∃
𝑖
≤
5
:
𝑔
𝑖
=
2
]
\\t

Averaged across queries, this yields the Hit Rate, which captures the proportion of queries for which retrieval was at least fully successful in the strictest sense.


Mean Reciprocal Rank measures how early a fully relevant chunk first appears in the ranked list. Let 
𝑟
⋆
 denote the rank of the first chunk with 
𝑔
=
2
:

\\t
MRR
​
@
​
5
​
(
𝑞
,
𝑚
,
𝑑
,
𝑠
)
=
{
1
𝑟
⋆
\\t
if 
​
Hit
​
@
​
5
=
1


0
\\t
otherwise
\\t

A strategy that consistently places a fully relevant chunk at rank 1 achieves MRR 
=
1.0
; placement at rank 3 yields 
0.33
. Precision@1 is defined as 1 if the rank 1 retrieved chunk receives a relevance score of 2 (fully relevant), and 0 otherwise.

Efficiency and Resource Metrics

In addition to retrieval effectiveness, we measure efficiency at two stages of the pipeline. Prepossessing metrics include chunking-phase runtime and peak memory usage during segmentation/index preparation. Retrieval metics include total number of chunks, resulting index size, and query-time latency (median and 95th percentile) which allows us to distinguish one-time indexing cost from recurring query-time cost.

Latency is measured end-to-end for the retrieval stage, excluding offline preprocessing and indexing. These metrics enable explicit analysis of trade-offs between retrieval quality and operational cost.

Experimental Protocol and Reproducibility

All experiments follow a fixed evaluation protocol. Each configuration is executed once, reflecting realistic deployment behaviour for retrieval systems. While LLM-based chunking and relevance evaluation introduce stochasticity, all model versions, prompts, and parameters are held constant across configurations. Intermediate artefacts, including chunk outputs, retrieval rankings, and evaluation scores, are stored to ensure traceability and post-hoc analysis.

Results and Discussion

This section analyses the impact of chunking strategies on retrieval effectiveness, robustness, and efficiency under a fixed dense retrieval configuration. Prior studies have suggested that segmentation choices play a substantial role in retrieval performance, yet existing evidence is often fragmented across domains or confounded with changes in retrieval architectures and embedding models [29, 22]. By evaluating a diverse set of chunking strategies across six domains and five embedding models in a controlled setting, our results enable a direct comparison of segmentation approaches and provide a unified view of how chunking strategy performance under a fixed dense retrieval pipeline, across six domains and five embedding models as shown in Figure 6. In doing so, the analysis corroborates earlier observations regarding the limitations of fixed-size chunking [3, 16] and clarifies the conditions under which semantic and structure-aware strategies yield consistent gains.

Overall Chunking Effectiveness

Across all evaluated domains and embedding models, Paragraph Group Chunking (PGC) achieved the highest mean nDCG@5 (
≈
0.459
; Figure 2), outperforming the next-best Dynamic Token Size Chunking (DFC; 0.441). PGC also led on strict top-rank success (Precision@1 = 
24
%
, where Precision@1 = 1 if rank 1 chunk scores fully relevant) and Hit@5 (
59
%
). Fixed character chunking (FCC), a naive baseline, trailed substantially with nDCG@5 = 0.244 and Precision@1 
≈
2
−
3
%
. These gaps highlight PGC’s ability to surface fully relevant content both early and reliably.


By contrast, the second-tier methods Dynamic Token Size Chunking (nDCG@5 = 0.441) and LLM Boundary Detection Chunking (nDCG@5 = 0.415) attain strong but slightly lower overall effectiveness.


Figure 2:Distribution of nDCG@5 for all chunking strategies across embedding models and domains, ordered by descending mean nDCG@5. Red diamonds denote mean values and black lines denote medians. Higher-ranked methods such as PGC, HPGC, and DFC show stronger overall retrieval effectiveness, while FC, FCC, and HFCF exhibit weaker performance. Differences in box and whisker widths highlight stability variations acroos queries. The chunking method abbreviations on the x-axis correspond to those defined in Table 1

Nearly all advanced chunking strategies substantially outperform the simplest baselines. For example, fixed-length character chunking (FCC) yields one of the weakest outcomes, with mean nDCG@5 = 0.244 and only 
2
−
3
%
 of queries retrieving a relevant document at rank 1. In contrast, the strongest methods achieve 10.4 times higher Precision@1 and markedly higher recall. A query-level comparison further illustrates that modern chunking strategies outperform fixed-character segmentation on a large majority of queries.


These findings are consistent with prior work reporting poor retrieval effectiveness for fixed-size segmentation due to excessive context fragmentation [3, 16]. At the same time, they extend earlier domain-specific evidence [38, 8] by demonstrating that both preserving document-native structural coherence (as with PGC) and adapting dynamically to content density (as with DFC) yield strong and stable improvements across multiple domains and embedding models within a unified evaluation framework. Notably, the effectiveness of Paragraph Group Chunking suggests that maintaining coherent logical units can be more beneficial than introducing additional semantic partitioning noise, particularly when embedding models already encode substantial contextual information.


Examining methods by their design philosophy further highlights these differences. Strategies that preserve semantic or structural units, such as paragraph-based grouping and dynamic or adaptive chunking, exhibit substantially higher effectiveness than approaches relying on fixed-size slices. The fixed-length chunking family tends to fragment coherent content or group unrelated text, which plausibly explains its consistently poor performance relative to more content-aware approaches.

Precision vs. Recall Trade-offs

Although the best-performing chunking strategies tend to improve both precision and recall metrics, certain methods emphasise one at the expense of the other. Highly fine-grained semantic chunking variants that generate many small segments often ensure that some relevant content is retrieved within the top results (boosting Hit@5) but may scatter relevant information across multiple chunks such that none receives the top rank (reducing Precision@1). This pattern is evident for Semantic Similarity Threshold chunking in the legal domain, where the method attains a relatively high Hit@5 of approximately 
54
%
 but a lower Precision@1 of around 
17
%
.


By contrast, Paragraph Group Chunking in the legal domain not only retrieves relevant content frequently (Hit@5 
≈
78
%
) but also places the most relevant result at rank 1 substantially more often (Precision@1 
≈
35
%
). Overall, the strongest strategies in our study, Paragraph Group Chunking, LLM-based segmentation, and dynamic approaches, achieve a more favourable balance by producing chunks that are neither overly fragmentary nor excessively coarse. This balance allows embedding models to both identify relevant information early and retain sufficient contextual coverage within the top ranks. Our results further indicate that structure-preserving chunking can mitigate this trade-off more effectively than purely semantic or aggressively fine-grained approaches, maintaining both strong early ranking performance and high coverage of relevant content.

Domain-Specific Performance Trends

The pronounced domain dependence observed here helps contextualise previously fragmented findings in the literature, where different chunking strategies were reported as optimal for specific domains such as biomedical [18] or legal text [8] but were not evaluated under comparable retrieval conditions.


Figure 3 compares chunking strategies across domains. In biology and physics, Dynamic Token Size Chunking yields the highest average performance, achieving high MRR and Precision@1 across both smaller and larger embedding models. These gains suggest that dynamic adaption to content density align well with semantically meaningful sections in scientific texts, enabling more complete contextual units to be retrieved.


Figure 3:Mean nDCG@5 scores for Domain-specific retrieval performance across Agriculture, Biology, Health, Legal, Maths and Physics. Dynamic Token Size Chunking (DFC) achieves the highest single score in Health and Physics while paragraph-aware and late-stage strategies, particularly Paragraph Group Chunking (PGC), Hybrid Paragraph Group Fixed Token Chunking (HPGC), and Late Chunking Token Spans (LCTS), consistently rank among the top three methods across all domains. The chunking method abbreviations on the x-axis correspond to those defined in Table 1.

In health-related documents, Dynamic Token Size Chunking performs best across all models, likely reflecting the wide variation in document length and structure in this domain. By adapting chunk size to content, this method avoids inappropriate splits of clinically relevant passages, leading to consistently high retrieval effectiveness.


For legal and mathematical corpora, Paragraph Group Chunking dominates across all embedding models. Legal documents frequently present arguments spanning multiple paragraphs, while mathematical texts often distribute definitions, theorems, and proofs across contiguous sections. Preserving these multi-paragraph structures enables the retrieval of complete logical units, substantially improving accuracy relative to more fine-grained segmentation strategies.


Agricultural texts exhibit a heterogeneous pattern with no single dominant method. Paragraph-aware strategies (PGC, HPGC) and late chunking (LCTS) rank among the top three across embedding models, though semantic methods also perform competitively depending on model capacity. Larger models benefit from embedding-based semantic clustering, while smaller models perform better with explicit semantic boundary detection. These results suggest that agricultural documents, which vary widely in structure and topic, benefit from chunking strategies that enforce topical cohesion, with model capacity influencing which semantic cues are most effectively exploited.


Overall, these domain-specific trends reinforce the conclusion that no single chunking strategy is universally optimal; instead, segmentation effectiveness depends on the structural and semantic characteristics of the target domain.

Influence of Embedding Model Size

As expected, larger embedding models achieve higher absolute retrieval effectiveness across all chunking strategies. However, improved segmentation yields gains regardless of model size, and the relative ordering of chunking strategies remains largely stable as model capacity increases (Figure 4).


Figure 4:Heatmap of mean nDCG@5 across five embedding models and thirty-six chunking strategies. The results show that bge-m3 (0.456) delivers the strongest overall performance, with all-MiniLM-L6-v2 (0.416) as the clear second best. The potion-base variants trail behind, with scores generally tapering off across later chunking strategies. The chunking method abbreviations on the x-axis correspond to those defined in Table 1.

For example, the same paragraph-based and adaptive strategies that perform well with all-MiniLM-L6-v2 also tend to perform well with BGE-M3, albeit at a higher absolute nDCG@5. With an optimal chunking strategy, the strongest model reaches very high effectiveness in some domains (e.g., nDCG@5 
≈
0.65
-
0.70
 in physics), while even the smallest model benefits from the same domain-preferred segmentation approach, though at lower absolute performance levels.


These trends align with prior observations that increased embedding capacity can reduce but does not eliminate sensitivity to chunking granularity [1]. Even for high-capacity encoders, suboptimal segmentation continues to impose a ceiling on retrieval effectiveness, indicating that embedding quality and chunking strategy play complementary roles rather than serving as substitutes.

Robustness and Query-Level Variability

Beyond aggregate metrics, we examine the consistency of each chunking strategy across individual queries. Some methods exhibit high variance, performing exceptionally well on certain queries but failing on others. Strategies that aggressively fragment content tend to show greater query-by-query variability. In the physics domain, Dynamic Token and LLM-based chunking achieve high average scores but also exhibit a higher incidence of zero-hit queries, where no relevant result is retrieved, likely because the smaller chunks lacked sufficient global context to meaningfully match the dense query vector, causing them to fall completely out of the top-5 ranking.


In contrast, structurally coherent approaches such as Paragraph Group Chunking demonstrate more stable behaviour, with fewer catastrophic failures on difficult queries. A quantitative analysis of query-level variance (Figure 2) supports this observation, showing that the strongest methods combine high mean effectiveness with relatively low variability.


While most prior evaluations of chunking strategies focus on aggregate retrieval metrics, this analysis highlights meaningful differences in robustness across queries, suggesting that segmentation choices also influence the reliability of retrieval outcomes for diverse information needs.

Effectiveness–Efficiency Trade-offs

The choice of chunking strategy has significant implications for index size, storage cost, and query latency. Different methods produce widely varying numbers of chunks per document, directly affecting indexing overhead and retrieval efficiency.

Figure 5:Effectiveness-efficiency trade-off plots. Left: mean nDCG@5 against index size, highlighting how each strategy scales in terms of index growth. Right: mean nDCG@5 against query latency, illustrating the trade-off between retrieval accuracy and response time for each chunking approach. The chunking method abbreviations on the x-axis correspond to those defined in Table 1.

While methods that generate many small chunks can achieve high recall, they often incur substantial indexing and latency costs. Conversely, grouping content into very large chunks reduces index size but risks diluting relevance signals. The average chunk length alone is therefore an incomplete predictor of performance; extremely small or large chunks tend to perform poorly, whereas moderate chunk sizes often produced by adaptive or structure-aware methods strike a more favourable balance.


To identify strategies that jointly optimise effectiveness and efficiency, we examine the Pareto frontier of mean nDCG@5 versus index size (Figure 5 Left). Only a small subset of methods lies on this frontier, indicating that many chunking strategies are dominated by alternatives offering equal or better effectiveness at lower cost. Dynamic Token Chunking, in particular, offers a strong trade-off, achieving near-optimal retrieval effectiveness while producing substantially fewer chunks than fine-grained approaches. In contrast, the Fixed Character baseline lies far from the frontier, inflating index size while delivering poor effectiveness.


A similar pattern emerges when considering query latency (Figure 5 Right), where leaner indexing strategies generally enable faster retrieval. However, index size and query latency only capture system performance during the final retrieval phase; the initial segmentation of documents also incurs heavily skewed computational overheads. As detailed in Table 3, the memory footprint (RAM) and processing time required during the chunking phase vary wildly depending on the strategy’s design philosophy. LLM assisted boundary detection (LBDC) and segment-then-chunk (LSTC) methods introduce massive preprocessing costs. Similarly, deep semantic processing methods, such as Topic Based Chunking (TBC), drastically inflate computation time, taking over 133 seconds to execute compared to the 6 seconds required by PGC. Although this extreme LLM and semantic overhead is typically amortised as a one time indexing cost and may be entirely acceptable for static corpora where retrieval gains are substantial it presents a severe bottleneck for real-time or frequently updated databases. Jointly analysing these preprocessing constraints alongside retrieval quality addresses a critical gap in prior chunking studies. Paragraph Group Chunking (PGC) lies near the Pareto frontier, delivering top effectiveness with relatively low chunking time, RAM usage, and query latency. Adaptive methods like Dynamic Token Size Chunking (DFC) offer a competitive alternative for domains favoring variable granularity, though they incur modestly higher preprocessing costs.

Table 3:Performance trade-offs for all 36 evaluated chunking strategies, sorted in descending order by chunking phase RAM. While all methods maintain an average query time of under 7 milliseconds, the preprocessing costs vary severely. LLM-based strategies (e.g., LSTC, LBDC) demand extreme memory overhead, and complex semantic clustering (e.g., TBC, HSSC) requires significantly higher processing time. Conversely, high-performing structural methods like Paragraph Group Chunking (PGC) remain highly resource efficient across all three metrics.
Strategy\\tRAM Cost\\tChunking\\tQuery Time\\tStrategy\\tRAM Cost\\tChunking\\tQuery Time
\\t(MB)\\tTime (s)\\t(ms)\\t\\t(MB)\\tTime (s)\\t(ms)
LSTC\\t5,672.16\\t10.02\\t3.84\\tLCTS\\t929.34\\t7.77\\t5.28
LBDC\\t5,417.98\\t9.27\\t3.62\\tLCSI\\t926.96\\t9.77\\t3.92
TBC\\t2,849.53\\t133.79\\t4.37\\tHPGC\\t925.70\\t8.52\\t4.27
HSSC\\t1,744.49\\t77.40\\t4.02\\tSBC\\t922.47\\t9.52\\t3.88
HSmFC\\t1,700.33\\t75.15\\t4.40\\tFC\\t915.20\\t7.77\\t4.02
SBDC\\t1,658.81\\t73.64\\t3.62\\tHSGC\\t914.89\\t9.02\\t3.86
SEBC\\t1,657.18\\t73.64\\t3.73\\tHPFC\\t891.13\\t6.77\\t4.05
HSVFC\\t1,601.20\\t74.39\\t4.68\\tHDFC\\t883.62\\t7.27\\t4.47
SSTC\\t1,594.77\\t75.90\\t3.99\\tDFC\\t883.49\\t7.27\\t5.49
SVAC\\t1,557.51\\t72.14\\t4.17\\tSGC\\t880.71\\t8.77\\t4.02
PCC\\t994.77\\t14.53\\t3.92\\tHRC\\t879.47\\t7.77\\t3.88
SWC\\t981.46\\t9.52\\t4.93\\tHCDC\\t874.56\\t19.54\\t4.65
HFCF\\t969.30\\t8.27\\t5.57\\tPGC\\t873.35\\t6.26\\t3.72
FCC\\t953.14\\t8.27\\t4.47\\tLCPI\\t859.46\\t6.01\\t3.75
HSnFC\\t942.21\\t10.02\\t4.00\\tPBC\\t858.21\\t6.01\\t5.45
RTF\\t932.91\\t19.79\\t3.89\\tRC\\t850.11\\t7.52\\t3.94
OFC\\t931.69\\t8.27\\t4.01\\tLAC\\t841.39\\t7.77\\t4.64
HOFC\\t930.66\\t8.52\\t4.03\\tCDAC\\t841.27\\t19.29\\t6.24

Taken together, these findings demonstrate that chunking is a central design factor in dense retrieval systems, influencing not only average effectiveness but also robustness across queries and efficiency at scale. While Paragraph Group Chunking achieves the strongest overall performance (nDCG@5 = 0.459), Dynamic Token Size Chunking proves advantageous in Biology (0.534), Health (0.621), and Physics (0.648). LLM-informed segmentation, dynamic resizing, and semantic clustering, prove advantageous in specific domains, reinforcing prior observations that optimal segmentation is inherently context-dependent [8, 7, 18]. The consistency of these trends across embedding models further supports the view that effective chunking amplifies, rather than replaces, the benefits of stronger embeddings [1]. By situating these results within a unified evaluation framework, this study clarifies how prior domain-specific insights generalise and provides practical guidance for selecting chunking strategies that balance retrieval quality with operational constraints in real-world retrieval-augmented systems.

Metric Validation and Correlation Structure
Figure 6:Pearson correlation matrix across all evaluation metrics. The nDCG@5 family shows strong internal consistency and high correlation with MRR@5 (r=0.92) and Precision@5 (r=0.88), validating it as the primary ranking metric. Embedding dimensionality shows minimal correlation with performance metrics (|r| < 0.2), confirming that chunking strategy selection dominates model architecture as a performance driver. Efficiency metrics (index size, latency) occupy the lower-right quadrant and show expected negative trade-off relationships.

Figure 6 presents a comprehensive Pearson correlation matrix visualising relationships across key evaluation metrics from the chunking strategy benchmark. It serves three primary purposes: validating metric reliability, identifying complementary measures, and quantifying performance-efficiency trade-offs.


The nDCG@5 family (mean, low/high confidence intervals) occupies the upper-left quadrant, demonstrating exceptional internal consistency. nDCG_mean exhibits the strongest correlation with MRR@5 (r=0.92), confirming that strategies producing high-quality early rankings also achieve superior reciprocal rank performance. Strict Precision@5 (p_strict) follows closely (r=0.88), validating that top-ranked relevance directly translates to precision. The confidence interval metrics (ndcg_low, ndcg_high) show moderate mutual correlation (r
≈
0.6), indicating stable variance patterns across strategies. This tight clustering confirms nDCG@5 as a robust primary metric suitable for primary reporting.


Binary success metrics form a secondary cluster. Hit@5 correlates strongly with nDCG_mean (r=0.85) and MRR@5 (r=0.82), establishing that strategies succeeding on at least one fully relevant chunk in top-5 also excel in ranking quality. MRR@5’s central position underscores its role as a ranking-focused complement to nDCG’s graded assessment.


Efficiency metrics reveal expected engineering trade-offs in the lower-right quadrant. Index size exhibits moderate positive correlation with both latency metrics (latency_p95: r
≈
-0.4, latency_p90: r
≈
-0.35), confirming larger indexes slow retrieval as expected. Total chunk count shows similar positive latency relationships, validating that fine-grained chunking increases computational overhead. Embedding dimensionality displays minimal correlation with performance metrics (|r|<0.2), suggesting chunking strategy selection dominates model architecture choice.

Limitations and Future Work

A few limitations should be noted. First, chunking strategies inherently affect index size and chunk count, which may influence retrieval behaviour beyond semantic quality alone. Rather than normalising these effects away, we explicitly measure and analyse them as part of the system-level trade-offs reported in the Results and Discussion section. Second, relevance judgements are produced by an LLM rather than human annotators. Although the selected evaluator demonstrates strong agreement with humans, automated evaluation may still introduce bias or noise. Third, results are reported on a fixed subset of domains from UltraDomain; while these domains are diverse, findings may not generalise to all retrieval settings. Future work could incorporate ensembles of judges, calibration procedures, or targeted human spot-checks to further strengthen reliability in large-scale retrieval benchmarks.

Conclusion

This study demonstrates that document chunking is a pivotal design factor in dense retrieval systems. In our cross-domain evaluation of 36 chunking strategies across six knowledge domains and five embedding models, we find that segmentation choices significantly affect retrieval accuracy, robustness, and efficiency. Content-aware approaches that preserve natural semantic or structural units consistently outperform fixed-size baselines, confirming that naive uniform segmentation can severely degrade performance. For example, the best method, Paragraph Group Chunking, achieved the highest overall retrieval quality (mean nDCG@5 
≈
 0.459) along with substantially higher top-rank precision (
≈
 24% Precision@1) and coverage (
≈
 59% Hit@5) than other strategies. In contrast, a simple fixed-length character chunking baseline produced a mean nDCG@5 below 0.244 with only 
≈
 2-3% of queries retrieving a relevant document at rank 1. These results underscore the risk of arbitrarily fragmenting context and highlight the value of segmentation that aligns with the text’s logical units.


No single chunking strategy is universally optimal; instead, effective chunking is context-dependent, varying with domain and content characteristics. Strategies such as LLM-informed boundary detection, dynamic token sizing, and paragraph grouping each excelled in different domains, reflecting the diverse structure of scientific, clinical, legal, and technical texts. Nonetheless, the performance hierarchy remains fairly consistent across embedding model sizes. Even the largest models benefit from improved chunking, and suboptimal segmentation imposes a performance ceiling on all models. This indicates that chunking and embedding capacity offer complementary benefits: stronger embeddings amplify the gains from good chunking rather than replacing the need for it. This means investing in a larger embedding model without revisiting chunking strategy is an incomplete optimisation.


Our results also highlight practical trade-offs between retrieval effectiveness and efficiency. Methods producing extremely fine-grained chunks can boost recall but at the cost of exploding index size and query latency, whereas overly coarse chunks risk missing relevant information. We identified adaptive strategies, such as dynamic token chunking, that lie near the Pareto-optimal frontier, delivering high accuracy with fewer chunks, unlike naive baselines, which inflate resource usage for inferior results. These insights underscore the need to balance quality and operational constraints when selecting a chunking policy for real-world applications.


Taken together, this work reframes chunking from a low-level implementation detail to a first-class consideration in retrieval-augmented systems. By providing a unified, large-scale evaluation across domains, we bridge previously fragmented findings and offer empirical guidance for choosing segmentation strategies. Careful, content-aware chunking can substantially improve retrieval success and consistency and as retrieval-augmented systems scale to larger corpora and more demanding applications, the choice of how to divide knowledge will remain as consequential as the choice of how to represent it.

Data Availability

All benchmark datasets used in this study are publicly available. The code and analysis scripts will be made publicly available upon publication at https://github.com/TheOpenSI/chunkbench.

References
[1]\\tM. Amiri and T. Bocklitz (2025)Chunk twice, embed once: a systematic study of segmentation and representation trade-offs in chemistry-aware retrieval-augmented generation.arXiv preprint arXiv:2506.17277.Cited by: Introduction, Influence of Embedding Model Size, Effectiveness–Efficiency Trade-offs.
[2]\\tS. Badshah and H. SajjadReference-guided verdict: llms-as-judges in automatic evaluation of free-form qa.Conference Proceedings In Proceedings of the 9th Widening NLP Workshop,pp. 251–267.Cited by: Relevance Evaluation and Metrics.
[3]\\tS. R. Bhat, M. Rudat, J. Spiekermann, and N. Flores-Herr (2025)Rethinking chunk size for long-document retrieval: a multi-dataset analysis.arXiv preprint arXiv:2505.21700.Cited by: Introduction, Introduction, Overall Chunking Effectiveness, Results and Discussion.
[4]\\tH. Brådland, M. Goodwin, P. Andersen, A. S. Nossum, and A. GuptaA new hope: domain-agnostic automatic evaluation of text chunking.Conference Proceedings In Proceedings of the 48th International ACM SIGIR Conference on Research and Development in Information Retrieval,pp. 170–179.Cited by: Introduction, Introduction.
[5]\\tT. Brown, B. Mann, N. Ryder, M. Subbiah, J. D. Kaplan, P. Dhariwal, A. Neelakantan, P. Shyam, G. Sastry, and A. Askell (2020)Language models are few-shot learners.Advances in neural information processing systems 33, pp. 1877–1901.Cited by: Introduction.
[6]\\tS. Cheng, J. Li, H. Wang, and Y. MaRagtrace: understanding and refining retrieval-generation dynamics in retrieval-augmented generation.Conference Proceedings In Proceedings of the 38th Annual ACM Symposium on User Interface Software and Technology,pp. 1–20.Cited by: Introduction.
[7]\\tM. Dadopoulos, A. Ladas, S. Moschidis, and I. Negkakis (2025)Metadata-driven retrieval-augmented generation for financial question answering.arXiv preprint arXiv:2510.24402.Cited by: Introduction, Introduction, Effectiveness–Efficiency Trade-offs.
[8]\\tA. F. Ferraris, D. Audrito, G. Siragusa, and A. Piovano (2024)Legal chunking: evaluating methods for effective legal text retrieval.Book Section In Legal Knowledge and Information Systems,pp. 275–281.Cited by: Introduction, Introduction, Overall Chunking Effectiveness, Domain-Specific Performance Trends, Effectiveness–Efficiency Trade-offs.
[9]\\tT. Galimzyanov, O. Kolomyttseva, and E. Bogomolov (2025)Practical code rag at scale: task-aware retrieval design choices under compute budgets.arXiv preprint arXiv:2510.20609.Cited by: Introduction.
[10]\\tC. Gondhalekar, U. Patel, and F. Yeh (2025)MultiFinRAG: an optimized multimodal retrieval-augmented generation (rag) framework for financial question answering.arXiv preprint arXiv:2506.20821.Cited by: Introduction.
[11]\\tK. Guu, K. Lee, Z. Tung, P. Pasupat, and M. ChangRetrieval augmented language model pre-training.Conference Proceedings In International conference on machine learning,pp. 3929–3938.External Links: ISBN 2640-3498Cited by: Introduction.
[12]\\tS. Han, G. T. Junior, T. Balough, and W. Zhou (2025)Judge’s verdict: a comprehensive analysis of llm judge capability through human agreement.arXiv preprint arXiv:2510.09738.Cited by: Relevance Evaluation and Metrics, Relevance Evaluation and Metrics.
[13]\\tJ. He, B. Zhang, H. Rouhizadeh, Y. Chen, R. Yang, J. Lu, X. Chen, N. Liu, and D. Teodoro (2025)Retrieval-augmented generation in biomedicine: a survey of technologies, datasets, and clinical applications.arXiv preprint arXiv:2505.01146.Cited by: Introduction.
[14]\\tM. Y. Kartal, S. K. Kose, K. Sevinç, and B. Aktas (2025)RAGSmith: a framework for finding the optimal composition of retrieval-augmented generation methods across datasets.arXiv preprint arXiv:2511.01386.Cited by: Introduction.
[15]\\tC. Kiss, M. Nagy, and P. Szilágyi (2025)Max–min semantic chunking of documents for rag application.Discover Computing 28 (1), pp. 117.External Links: ISSN 2948-2992Cited by: Introduction.
[16]\\tK. Lee, M. Chang, and K. Toutanova (2019)Latent retrieval for weakly supervised open domain question answering.arXiv preprint arXiv:1906.00300.Cited by: Introduction, Overall Chunking Effectiveness, Results and Discussion.
[17]\\tP. Lewis, E. Perez, A. Piktus, F. Petroni, V. Karpukhin, N. Goyal, H. Küttler, M. Lewis, W. Yih, and T. Rocktäschel (2020)Retrieval-augmented generation for knowledge-intensive nlp tasks.Advances in neural information processing systems 33, pp. 9459–9474.Cited by: Introduction.
[18]\\tM. Li, Z. Zhan, H. Yang, Y. Xiao, H. Zhou, J. Huang, and R. Zhang (2025)Benchmarking retrieval-augmented large language models in biomedical nlp: application, robustness, and self-awareness.Sci Adv 11 (47), pp. eadr1443.External Links: ISSN 2375-2548, DocumentCited by: Introduction, Domain-Specific Performance Trends, Effectiveness–Efficiency Trade-offs.
[19]\\tJ. Liang, H. Li, C. Li, J. Zhou, S. Jiang, Z. Wang, C. Ji, Z. Zhu, R. Liu, and T. Ren (2025)Ai meets brain: memory systems from cognitive neuroscience to autonomous agents.arXiv preprint arXiv:2512.23343.Cited by: Introduction.
[20]\\tY. Liu, D. Iter, Y. Xu, S. Wang, R. Xu, and C. ZhuG-eval: nlg evaluation using gpt-4 with better human alignment.Conference Proceedings In Proceedings of the 2023 conference on empirical methods in natural language processing,pp. 2511–2522.Cited by: Relevance Evaluation and Metrics.
[21]\\tZ. Liu, C. Simon, and F. CaspaniPassage segmentation of documents for extractive question answering.Conference Proceedings In European Conference on Information Retrieval,pp. 345–352.Cited by: Introduction.
[22]\\tW. Lu, K. Chen, R. Qiao, and X. Sun (2025)Hichunk: evaluating and enhancing retrieval-augmented generation with hierarchical chunking.arXiv preprint arXiv:2509.11552.Cited by: Introduction, Introduction, Results and Discussion.
[23]\\tC. Merola and J. SinghReconstructing context: evaluating advanced chunking strategies for retrieval-augmented generation.Conference Proceedings In International Workshop on Knowledge-Enhanced Information Retrieval,pp. 3–18.Cited by: Introduction, Introduction.
[24]\\tM. M. Multi-Granularity (2024)M3-embedding: multi-linguality, multi-functionality, multi-granularity text embeddings through self-knowledge distillation.arXiv preprint arXiv:2402.03216.Cited by: Embedding Models and Index Construction.
[25]\\tC. Nagarkar, L. Bogachev, and S. Sharoff (2026)Can llm reasoning be trusted? a comparative study: using human benchmarking on statistical tasks.arXiv preprint arXiv:2601.14479.Cited by: Relevance Evaluation and Metrics.
[26]\\tH. Nguyen, T. Nguyen, and V. NguyenEnhancing retrieval augmented generation with hierarchical text segmentation chunking.Conference Proceedings In International Symposium on Information and Communication Technology,pp. 209–220.Cited by: Introduction, Introduction.
[27]\\tQdrant Team (2025)Qdrant.Note: Accessed 2 February 2026External Links: LinkCited by: Embedding Models and Index Construction.
[28]\\tH. Qian, P. Zhang, Z. Liu, K. Mao, and Z. Dou (2024)Memorag: moving towards next-gen rag via memory-inspired knowledge discovery.arXiv preprint arXiv:2409.05591 1.Cited by: Dataset and Domains.
[29]\\tR. Qu, R. Tu, and F. BaoIs semantic chunking worth the computational cost?.Conference Proceedings In Findings of the Association for Computational Linguistics: NAACL 2025,pp. 2155–2177.Cited by: Introduction, Results and Discussion.
[30]\\tM. Reuter, T. Lingenberg, R. Liepina, F. Lagioia, M. Lippi, G. Sartor, A. Passerini, and B. SayinTowards reliable retrieval in rag systems for large legal datasets.Conference Proceedings In Proceedings of the Natural Legal Language Processing Workshop 2025,pp. 17–30.Cited by: Introduction.
[31]\\tN. Thakur, R. Pradeep, S. Upadhyay, D. Campos, N. Craswell, and J. Lin (2025)Support evaluation for the trec 2024 rag track: comparing human versus llm judges.arXiv preprint arXiv:2504.15205.Cited by: Relevance Evaluation and Metrics.
[32]\\tH. Touvron, T. Lavril, G. Izacard, X. Martinet, M. Lachaux, T. Lacroix, B. Rozière, N. Goyal, E. Hambro, and F. Azhar (2023)Llama: open and efficient foundation language models.arXiv preprint arXiv:2302.13971.Cited by: Introduction.
[33]\\tT. Wada, Y. Hirakawa, R. Shimizu, T. Kawashima, and Y. SaitoStatic word embeddings for sentence semantic representation.Conference Proceedings In Proceedings of the 2025 Conference on Empirical Methods in Natural Language Processing,pp. 6206–6222.Cited by: Embedding Models and Index Construction.
[34]\\tL. Wang, N. Yang, X. Huang, B. Jiao, L. Yang, D. Jiang, R. Majumder, and F. Wei (2022)Text embeddings by weakly-supervised contrastive pre-training.arXiv preprint arXiv:2212.03533.Cited by: Introduction.
[35]\\tR. Wang, J. Guo, C. Gao, G. Fan, C. Y. Chong, and X. Xia (2025)Can llms replace human evaluators? an empirical study of llm-as-a-judge in software engineering.Proceedings of the ACM on Software Engineering 2 (ISSTA), pp. 1955–1977.External Links: ISSN 2994-970XCited by: Relevance Evaluation and Metrics.
[36]\\tW. Wang, H. Bao, S. Huang, L. Dong, and F. WeiMinilmv2: multi-head self-attention relation distillation for compressing pretrained transformers.Conference Proceedings In Findings of the Association for Computational Linguistics: ACL-IJCNLP 2021,pp. 2140–2151.Cited by: Embedding Models and Index Construction.
[37]\\tW. Wang, F. Wei, L. Dong, H. Bao, N. Yang, and M. Zhou (2020)Minilm: deep self-attention distillation for task-agnostic compression of pre-trained transformers.Advances in neural information processing systems 33, pp. 5776–5788.Cited by: Embedding Models and Index Construction.
[38]\\tA. J. Yepes, Y. You, J. Milczek, S. Laverde, and R. Li (2024)Financial report chunking for effective retrieval augmented generation.arXiv preprint arXiv:2402.05131.Cited by: Introduction, Overall Chunking Effectiveness.
[39]\\tJ. Zhao, Z. Ji, Y. Feng, P. Qi, S. Niu, B. Tang, F. Xiong, and Z. Li (2024)Meta-chunking: learning text segmentation and semantic completion via logical perception.arXiv preprint arXiv:2410.12788.Cited by: Introduction.
Acknowledgments

Portions of the manuscript text and implementation were developed with the assistance of an AI-based language model. The authors designed the methodology, conducted all experiments, and take full responsibility for the results and conclusions presented in this work.

Author contributions

M.A.S, C.C.N.K and M.A collaborated on exploring the idea, writing, designing the experiments and reviewing the manuscript. All authors reviewed the manuscript.

Funding

This work is funded under the agreement with the ACT Government, Future Jobs Fund - Open Source Institute (OpenSI) - R01553 and NetApp Technology Alliance Agreement with OpenSI - R01657. Additionally, this research was supported by the Australian Government through the Department of Education’s National Industry PhD Program (project 36337). The views expressed herein are those of the authors and are not necessarily those of the Australian Government or the Department of Education.

Competing interests

All authors declare that there is no conflict of interest and no financial contributions have been made towards this work, which could have affected its results.

Experimental support, please view the build logs for errors. Generated by L A T E xml  .
Instructions for reporting errors

We are continuing to improve HTML versions of papers, and your feedback helps enhance accessibility and mobile support. To report errors in the HTML that will help us improve conversion and rendering, choose any of the methods listed below:

Click the \\"Report Issue\\" () button, located in the page header.

Tip: You can select the relevant text first, to include it in your report.

Our team has already identified the following issues. We appreciate your time reviewing and reporting rendering errors we may not have found yet. Your efforts will help us improve the HTML versions for all readers, because disability should not be a barrier to accessing research. Thank you for your continued support in championing open access for all.

Have a free development cycle? Help support accessibility at arXiv! Our collaborators at LaTeXML maintain a list of packages that need conversion, and welcome developer contributions.

BETA"