---
title: "Reconstructing Context: Evaluating Advanced Chunking Strategies for RAG"
source: "https://arxiv.org/html/2504.19754v1"
extracted: 2026-06-02T17:52:04-04:00
---

# Reconstructing Context: Evaluating Advanced Chunking Strategies for RAG

Source: https://arxiv.org/html/2504.19754v1

"Back to arXiv

This is experimental HTML to improve accessibility. We invite you to report rendering errors. 
Use Alt+Y to toggle on accessible reporting links and Alt+Shift+Y to toggle off.
Learn more about this project and help improve conversions.

Why HTML?
Report Issue
Back to Abstract
Download PDF
 Abstract
1Introduction
2Related Work
3Methodology
4Experimental Setup
5Results and Analysis
6Conclusion
 References
License: CC BY 4.0
arXiv:2504.19754v1 [cs.IR] 28 Apr 2025
1
Reconstructing Context
Evaluating Advanced Chunking Strategies for Retrieval-Augmented Generation
Carlo Merola
0009-0000-1088-1495
Jaspinder Singh
Equal contribution. 0009-0000-5147-1249
Abstract

Retrieval-augmented generation (RAG) has become a transformative approach for enhancing large language models (LLMs) by grounding their outputs in external knowledge sources. Yet, a critical question persists: how can vast volumes of external knowledge be managed effectively within the input constraints of LLMs? Traditional methods address this by chunking external documents into smaller, fixed-size segments. While this approach alleviates input limitations, it often fragments context, resulting in incomplete retrieval and diminished coherence in generation. To overcome these shortcomings, two advanced techniques—late chunking and contextual retrieval—have been introduced, both aiming to preserve global context. Despite their potential, their comparative strengths and limitations remain unclear. This study presents a rigorous analysis of late chunking and contextual retrieval, evaluating their effectiveness and efficiency in optimizing RAG systems. Our results indicate that contextual retrieval preserves semantic coherence more effectively but requires greater computational resources. In contrast, late chunking offers higher efficiency but tends to sacrifice relevance and completeness.

Keywords: Contextual Retrieval Late Chunking Dynamic Chunking Rank Fusion.
1Introduction

Retrieval Augmented Generation (RAG) is a transformative approach that enhances the capabilities of large language models (LLMs) by integrating external information retrieval directly into the text generation process. This method allows LLMs to dynamically access and utilize relevant external knowledge, significantly improving their ability to generate accurate, contextually grounded, and informative responses. Unlike static LLMs that rely solely on pre-trained data, RAG-enabled models can access up-to-date and domain-specific information. This dynamic integration ensures that the generated content remains both relevant and accurate, even in rapidly evolving or specialized fields.

RAG models combine two key components: a retrieval mechanism and a generative model. The retrieval mechanism fetches relevant documents or data from a large corpus, while the generative model synthesizes this information into coherent, contextually enriched answers. This synergy enhances performance in knowledge-intensive natural language processing (NLP) tasks, enabling models to produce well-informed responses grounded in the retrieved data.

The Context Dilemma in Classic RAG: Managing extensive external documents poses significant issues in RAG systems. Despite advancements, many LLMs are limited to processing a few thousand tokens. Although some models have achieved context windows up to millions of tokens [5], these are exceptions rather than the norm. Moreover, research indicates that LLMs may exhibit positional bias, performing better with information at the beginning of a document and struggling with content located in the middle or toward the end [11, 16]. This issue is exacerbated when retrieval fails to prioritize relevant information properly. Thus, documents are often divided into smaller segments or \\"chunks\\" before embedding and retrieval. However, this chunking process can disrupt semantic coherence, leading to:

• 

Loss of Context: dividing documents without considering semantic boundaries can result in chunks that lack sufficient context, impairing the model’s ability to generate accurate and coherent responses.

• 

Incomplete Information Retrieval: important information split across chunks may not be effectively retrieved or integrated.

To address these issues, we analyse and compare two recent techniques—contextual retrieval1 and late chunking [9]—within a unified setup, evaluating their strengths and limitations in tackling challenges like context loss and incomplete information retrieval. Contextual retrieval preserves coherence by prepending LLM-generated context to chunks, while late chunking embeds entire documents to retain global context before segmenting.

Our study rigorously assesses their impact on generation performance in question-answering tasks, finding that neither technique offers a definitive solution. This work highlights the trade-offs between these methods and provides practical guidance for optimizing RAG systems.

To further support the community, we release all code, prompts, and data under the permissive MIT license, enabling full reproducibility and empowering practitioners to adapt and extend our work.2

2Related Work
Classic RAG.

A standard RAG workflow involves four main stages: document segmentation, chunk embedding, indexing, and retrieval. During segmentation, documents are divided into manageable chunks. These chunks are then transformed into vector representations using encoder models, often normalized to ensure unit magnitudes. The resulting embeddings are stored in indexed vector databases, enabling efficient approximate similarity searches. Retrieval involves comparing query embeddings with the stored embeddings using metrics such as cosine similarity or Euclidean distance, which identify the most relevant chunks. Seminal works like [15] and [13] have demonstrated the effectiveness of RAG in tasks such as open-domain question answering. More recent studies, including [7], have introduced advancements in scalability and embedding techniques, further establishing RAG as a foundational framework for knowledge-intensive applications.

Document Segmentation.

Document segmentation is essential for processing long texts in RAG workflows, with methods ranging from fixed-size segmentation [7] to more adaptive techniques like semantic segmentation,3 which detect semantic breakpoints based on shifts in meaning. Recent advancements include supervised segmentation models [14, 12] and segment-then-predict models, trained end-to-end without explicit labels to optimize chunking for downstream task performance [17]. In 2024, late chunking and contextual retrieval introduced novel paradigms. Both techniques have proven effective in retrieval benchmarks but remain largely untested in integrated RAG workflows. Despite several RAG surveys [7, 6, 8], no prior work has compared these methods within a comprehensive evaluation framework. This study addresses this gap by holistically analyzing late chunking and contextual retrieval, offering actionable insights into their relative strengths and trade-offs.

3Methodology

To guide our study, we define the following research questions (RQs), aimed at evaluating different strategies for chunking and retrieval in RAG systems:

• 

RQ#1: Compares the effectiveness of early versus late chunking strategies, utilizing different text segmenters and embedding models to evaluate their impact on retrieval accuracy and downstream performance in RAG systems.

• 

RQ#2: Compares the effectiveness of contextual retrieval versus traditional early chunking strategies, utilizing different text segmenters and embedding models to evaluate their impact on retrieval accuracy and downstream performance in RAG systems.

3.1RQ#1: Early or Late Chunking?

In this workflow, the main architectural modification compared to the standard RAG lies in the document embedding process Figure 1. Specifically, we experiment with various embedding models to encode document chunks, tailoring them to align with the early and late chunking strategies under evaluation. This adjustment allows us to explore how different embedding techniques influence the retrieval quality and, subsequently, the overall performance of the RAG system. Additionally, we test dynamic segmenting models to further refine the chunking process, providing an adaptive mechanism that adjusts chunk sizes based on content characteristics. By evaluating the impact of these dynamic segmenting models, we aim to improve the overall retrieval efficiency and response generation within the RAG framework.

Early Chunking.

Documents are segmented into text chunks, and each chunk is processed by the embedding model. The model generates token-level embeddings for each chunk, which are subsequently aggregated using mean pooling to produce a single embedding per chunk.

Late Chunking.

Late chunking [9] defers the chunking process. As shown in Figure  1, instead of segmenting the document initially, the entire document is first embedded at the token level. The resulting token embeddings are then segmented into chunks, and mean pooling is applied to each chunk to generate the final embeddings. This approach preserves the full contextual information within the document, potentially leading to superior results across various retrieval tasks. It is adaptable to a wide range of long-context embedding models and can be implemented without additional training. The two approaches are tested with different embedding models.

Figure 1:Comparison of early chunking (left) and late chunking (right) approaches for processing long documents. In early chunking, the document is divided into chunks before embedding, with each chunk processed independently by the embedding model and then pooled. In contrast, late chunking processes the entire document to generate token embeddings first, using boundary cues to create chunk embeddings, which are subsequently pooled.
3.2RQ#2: Early or Contextual Chunking?

In this workflow, traditional retrieval is compared to Contextual Retrieval with Rank Fusion technique. This has been introduced by Anthropic in September 2024.4 Three steps are added to the Traditional RAG process: Contextualization, Rank Fusion, Reraking.

Contextualization.
Figure 2:Contextualization of each chunk is performed prior to embedding. The document is divided into chunks, and a prompt is used to query an LLM to generate contextual information from the document for each chunk. The context is prepended to the chunk, which is then processed by the embedding model to produce the final chunk embedding.

After document segmentation, each chunk is enriched with additional context from the entire document, ensuring that even when segmented, each piece retains a broader understanding of the content (Fig. 2). In fact, when documents are split into smaller chunks, it might arise the problem where individual chunks lack sufficient context. For example, a chunk might contain the text: \\"The company’s revenue grew by 3% over the previous quarter.\\" However, this chunk on its own does not specify which company it is referring to or the relevant time period, making it difficult to retrieve the right information or use the information effectively. Contextualization improves the relevance and accuracy of retrieved information by maintaining contextual integrity.

Rank Fusion.

In our methodology, we employ a rank fusion strategy that integrates dense embeddings with sparse embeddings of BM25 [19] to improve retrieval performance. Although embedding models adeptly capture semantic relationships, they may overlook exact matches, which is particularly useful for unique identifiers or technical terms. BM25 uses a ranking function that builds upon Term Frequency-Inverse Document Frequency (TF-IDF), addressing this limitation by emphasizing precise lexical matches. To combine the strengths of both approaches, we conduct searches across both dense embedding vectors and BM25 sparse embedding vectors generated from both the chunk and its generated context. Initially, the assigned relative importance in the search for the two vector fields has been set to be of equal intensity, resulting in lowering the scoring results in the retrieval evaluation. For this reason we use a weighting strategy assigning higher weights to dense vector fields, emphasizing them more in the final ranking. While different weight parameters have been tested, the final decision has been to define a ratio of importance 4:1 assigning weight 1 for the dense embedding vectors and 0.25 for the BM25 sparse embedding vectors. This ratio reflects Anthropic weight assignment.5 By applying these weights, dense embeddings are emphasized more heavily, while still incorporating the contributions of the BM25 sparse embeddings. This weighted rank fusion approach leverages the complementary strengths of semantic embeddings and lexical matching, aiming to improve the accuracy and relevance of the retrieved results.

Reranking Step.

To boost and obtain consistent improved performance, the retrieval and ranking stages have been separated. This two-stage approach improves efficiency and effectiveness by leveraging the strengths of different models at each stage. After retrieving the initial set of document chunks, we implement an additional reranking step to enhance the relevance of the results to the user’s query. This process involves reassessing and reordering the retrieved chunks based on their pertinence, prioritising the most relevant information. The reranker operates by evaluating the semantic similarity and contextual relevance between the query and each retrieved chunk. It assigns a relevance score to each chunk, and the chunks are then reordered based on these scores, with higher-scoring chunks placed at the top of the list presented to the user. This method ensures that the most pertinent information is readily accessible, improving the overall effectiveness of the retrieval system. Implementing this reranking step addresses potential limitations of the initial retrieval process, such as the inclusion of less relevant chunks or the misordering of pertinent information.

4Experimental Setup

This study has focused on testing these techniques with open-source models. A particular focus was also given to resource usage, for real-world scenarios that lead towards the choice of the LLM for the question answering task to Microsoft’s Phi-3.5-mini-instruct,6 quantized to 4 bits. [1] This language model is designed to operate efficiently in memory- and compute-constrained environments which is a crucial aspect of our work. The same language model has been used also to generate additional context to prepend to each chunk in the Contextual Retrieval Setup.

For what regards the embedding models these ones have been tested: Jina V3 [20], Jina Colbert V2 [10], Stella V5 and BGE-M3 [4], all present in the MTEB [18] leaderboard (see Table 1 for more details).

Dataset and Hardware.

There are severe limitations in current datasets available for RAG systems evaluation. Many don’t include together the labels for retrieval quality evaluation and answers labels for the quality of the generation in a question answering system. In our system initial Retrieval performance has been tested on the NFCorpus [3] dataset, while the subsequent Generation performance in question answering has been conducted over MSMarco[2].

Another important note for Contextual Retrieval (RQ#2). The NFCorpus dataset is characterised by a long average document length. Here appear the first limitations of the Contextual Retrieval approach to RAG. For the intrinsic nature of this approach, the segmented chunks are enhanced with a generated context taken from the document, prompting an LLM for the task, leveraging the new advents of Instruction Learning. Chunks and documents are passed together in a formatted prompt to the model. When a document reaches long lengths, the VRAM of the GPU gets filled up quickly. For chunk contextualization, around 20GB of VRAM use can be reached, limiting batch dimensions for generation and slowing down the times needed for effective chunk contextualization.

In our experimental setup, we utilized an Nvidia RTX 4090 with 24GB of VRAM. Due to GPU memory constraints, we employed a subset of the dataset, corresponding to 20% of the entire NFCorpus for RQ#2, while the full dataset was used for RQ#1 workflow.

For datasets such as MsMarco, which include only passage texts rather than full documents, the system operates within a more constrained context for generating responses. This limitation arises because passages are typically shorter segments of text, providing less information for contextual understanding. As a result in RQ#2, the system’s ability to generate contextually relevant and comprehensive responses can be affected by the brevity of the input text, potentially impacting the quality and depth of the generated content.

In RQ#1, the evaluation was conducted on the first 1,000 queries and approximately 5,000 documents/passages. For RQ#2, due to the significant computational requirements and hardware limitations, the experiments were restricted to 50 queries and around 300 documents.

4.1Embedding generation
Common to both RQs.

To generate embeddings for our experiments, we utilized different embedding models, as detailed previously (see section 4). Each segmentation model approach outlined was paired with an appropriate embedding model to evaluate its influence on downstream tasks.

For fixed-size segmentation, we divided the text into equal-sized chunks with a predefined length of 512 characters. This approach ensures uniform chunk sizes, simplifying processing and offering a baseline for comparison with more adaptive methods.

For semantic segmentation, we used the Jina-Segmenter API,7 which dynamically adjusts chunk boundaries based on the semantic structure of the text. This ensures that the segments capture meaningful content, improving the quality of embeddings generated.

All the generated embeddings were normalized to unit vectors, facilitating cosine similarity computations during the retrieval phase and ensuring uniformity across experiments.

RQ#1:

In addition to the mentioned segmentation approaches, for this workflow, dynamic segmentation was tested, testing two models to assess their performance. The first model, simple-qwen-0.5, is a straightforward solution designed to identify boundaries based on the structural elements of the document. Its simplicity makes it efficient for basic segmentation needs, offering a computationally lightweight approach.

The second model, topic-qwen-0.5, inspired by Chain-of-Thought reasoning, enhances segmentation by identifying topics within the text. By segmenting text based on topic boundaries, this approach captures richer semantic relationships, making it suitable for tasks requiring a deeper understanding of document content.

Model\\tMTEB Rank\\tModel Size(M)\\tMemory(GB)\\tEmbedding Dim\\tMax Token
Stella-V5\\t5\\t1,543\\t5.75\\t1,024\\t131,072
Jina-V3[20] \\t53\\t572\\t2.13\\t1,024\\t8,194
Jina-V2 [10] \\t123\\t137\\t0.51\\t1,024\\t8,194
BGE-M3 [4] \\t211\\t567\\t2.11\\t1,024\\t8,192
Table 1:Embedding models.
RQ#2:

In this workflow, for the ContextualRankFusion evaluation, contextualization of the chunks before the embedding is necessary. To contextualize each chunk, we prompt Microsoft’s LLM model Phi3.5-mini-instruct to generate a brief summary that situates the chunk within the overall document, formatting the prompt with the chunk and its relative original document.

4.2Retrieval Evaluation
RQ#2:

In this workflow, specifically for the ContextualRankFusion retrieval, the document retrieval has been enhanced with two additional steps (see Section 3.2). In the reranking step, Rank Fusion was allowed through Milvus Vector Database, which integrates with BM25 through the BM25EmbeddingFunction class, enabling hybrid search across dense and sparse vector fields.
After retrieving the top documents, these are reordered through the reranker model Jina Reranker V2 Base model,8 that employes a cross-encoder architecture that processes each query-document pair individually, outputting a relevance score. This design enables the model to capture intricate semantic relationships between the query and the document before being given to the LLM.

Scorings.

For both approaches in RQ#1 and RQ#2, when querying the embedding database (generated in 4.1), the output will be a ranked list of chunks, ordered from the most similar to the query to the least similar. We employ a straightforward aggregation strategy to transition from chunk-level rankings to document-level rankings. Specifically, for each document, we consider the score of its most significant chunk as the representative value for the entire document. This approach ensures that a document’s relevance is determined by its most relevant chunk.

Once the document scores are determined, we generate a ranked list of documents based on these scores. From this ranking, we extract the top-k documents, focusing on the Top 5 or Top 10 documents, depending on the specific evaluation scenario. This final document ranking is then used to assess the effectiveness of the retrieval process.

This methodology highlights the importance of individual chunks in influencing the overall document ranking and ensures that highly relevant chunks directly impact the document’s position in the final ranking.

Metrics.

To evaluate the performance of our model, we utilize three key metrics: NDCG , MAP, and F1-score. Each metric serves a specific purpose in assessing different aspects of the results. Normalized Discounted Cumulative Gain (NDCG): It measures the usefulness of an item based on its position in the ranking, assigning higher weights to items appearing at the top of the list. By using NDCG, we aim to assess the relevance of predictions in a way that prioritizes higher-ranked items. Mean Average Precision (MAP): It calculates the mean of the Average Precision (AP) scores for all queries, where AP considers the precision at each relevant item in the ranked list. With MAP, we aim to quantify how effectively the model retrieves relevant results across different scenarios. F1-score: The F1-score, a harmonic mean of precision and recall, is employed to balance the trade-off between false positives and false negatives.

4.3Generation evaluation

Generation evaluation was assessed through the MSMarco dataset using a question answering task. While for the Late Chunking technique, the scoring on the generation respects the retrieval performance, for the Contextual Retrieval Setup, chunks are enriched with additional generated context from the document that influences the output generation of an LLM. Although some differences were measured in the scorings, they were not notable enough to assess a significant difference in generation performance.

5Results and Analysis
5.1Traditional Retrieval Versus ContextualRankFusion Retrieval

From the results in Table 2, and especially focusing the attention on the best performing embedding model Jina-V3, we show that Fixed-Window Chunking versus Semantic Chunking techniques do not differ much in terms of performance or not at all, while the first one being far easier implementable and faster than the second one. A more important finding underlines in the Rank Fusion technique. This technique shows improved results especially when chunks are enriched with additional context from the document. In this way, BM25 matches search terms in both segments and contexts, leading to very good results. It is important to note that adding the final reranking step in the workflow is crucial to leverage this potential and see consistent improvements in the results.

Model\\tCM\\tRM\\tNDCG@5\\tMAP@5\\tF1@5\\tNDCG@10\\tMAP@10\\tF1@10
Jina-V3\\tFUC\\tTR\\t0.303\\t0.137\\t0.193\\t0.291\\t0.154\\t0.191
\\tRFR\\t0.289\\t0.130\\t0.185\\t0.288\\t0.150\\t0.193
SUC\\tTR\\t0.307\\t0.143\\t0.197\\t0.292\\t0.159\\t0.187
\\tRFR\\t0.295\\t0.135\\t0.194\\t0.287\\t0.152\\t0.189
FCC\\tTR\\t0.312\\t0.144\\t0.204\\t0.295\\t0.159\\t0.190
\\tRFR\\t0.317\\t0.146\\t0.206\\t0.308\\t0.166\\t0.202
SCC\\tTR\\t0.305\\t0.136\\t0.197\\t0.296\\t0.155\\t0.198
\\tRFR\\t0.317\\t0.146\\t0.209\\t0.309\\t0.166\\t0.204
Jina-V2\\tFUC\\tTR\\t0.206\\t0.084\\t0.138\\t0.202\\t0.096\\t0.137
\\tRFR\\t0.256\\t0.119\\t0.166\\t0.251\\t0.133\\t0.161
SUC\\tTR\\t0.231\\t0.100\\t0.152\\t0.223\\t0.112\\t0.149
\\tRFR\\t0.274\\t0.127\\t0.179\\t0.262\\t0.140\\t0.168
FCC\\tTR\\t0.232\\t0.098\\t0.155\\t0.219\\t0.109\\t0.143
\\tRFR\\t0.288\\t0.130\\t0.182\\t0.274\\t0.144\\t0.173
SCC\\tTR\\t0.231\\t0.099\\t0.156\\t0.220\\t0.110\\t0.148
\\tRFR\\t0.297\\t0.134\\t0.191\\t0.283\\t0.148\\t0.180
BGE-M3\\tFUC\\tTR\\t0.017\\t0.006\\t0.015\\t0.018\\t0.007\\t0.014
\\tRFR\\t0.032\\t0.012\\t0.018\\t0.033\\t0.012\\t0.020
SUC\\tTR\\t0.012\\t0.003\\t0.001\\t0.012\\t0.003\\t0.011
\\tRFR\\t0.029\\t0.008\\t0.017\\t0.026\\t0.009\\t0.018
FCC\\tTR\\t0.007\\t0.001\\t0.003\\t0.012\\t0.003\\t0.012
\\tRFR\\t0.040\\t0.015\\t0.026\\t0.040\\t0.016\\t0.027
SCC\\tTR\\t0.002\\t0.001\\t0.001\\t0.006\\t0.002\\t0.007
\\tRFR\\t0.034\\t0.014\\t0.021\\t0.030\\t0.015\\t0.019

Table 2:Comparative results on a subset of the NFCorpus dataset. 20% of the whole shuffled dataset was taken, deleting labels of documents not present in the subset dataset for retrieval evaluation. Scorings will be higher on the whole dataset.
1 

CM: Chunking Methods (FUC: Fixed-Window Uncontextualized Chunks, SUC: Semantic Uncontextualized Chunks, FCC: Fixed-Window Contextualized Chunks, SCC: Semantic Contextualized Chunks).

2 

RM: Retrieval Methods (TR: Traditional Retrieval, RFR: Rank Fusion with weighted strategy (1, 0.25) respectively for dense embedder models and BM25 embeddings – additional Reranking step for RFR).

5.2Traditional Retrieval Versus Latechunking Retrieval

Upon analyzing the results in Table 3, we observe that the novel Late Chunking approach performs well in most cases when compared to the Early version. This indicates its potential as an effective retrieval strategy for many scenarios. However, it is important to note that Late Chunking does not consistently outperform the Early approach across all models and datasets.

For instance, with the BGE-M3 model applied to the NFCorpus, the Early version demonstrates superior performance, highlighting a case where the Late Chunking approach falls short. This observation is further confirmed through testing on the MsMarco dataset using the Stella-V5 model (Table 4), where once again the Early version outperforms the Late Chunking approach.

These findings suggest that while Late Chunking introduces promising improvements in certain contexts, its efficacy may vary depending on the dataset and model used, emphasizing the need for careful selection of retrieval strategies based on specific use cases.

5.3Latechunking Versus ContextualRankFusion Retrieval

In Table 5 we compare the best results obtained for ContextualRankFusion with Latechunking on the same subset of NFCorpus in order to compare the two techniques. The embedding model used is Jina-V3, for Fixed-Window Chunks. ContextualRankFusion obtains better results overall.

Model\\tChunk\\tSegm\\tLength\\tNDCG@5\\tMAP@5\\tF1@5\\tNDCG@10\\tMAP@10\\tF1@10
Stella-V5\\tEarly\\tFix-size\\t512\\t0.443\\t0.137\\t0.226\\t0.414\\t0.161\\t0.247
Late\\tFix-size\\t512\\t0.445\\t0.133\\t0.225\\t0.410\\t0.158\\t0.242
Jina-V3\\tEarly\\tFix-size\\t512\\t0.374\\t0.107\\t0.186\\t0.346\\t0.127\\t0.204
Late\\tFix-size\\t512\\t0.380\\t0.103\\t0.185\\t0.354\\t0.125\\t0.210
Early\\tJina-Sem\\t-\\t0.377\\t0.111\\t0.192\\t0.353\\t0.130\\t0.210
Late\\tsim-Qwen\\t-\\t0.384\\t0.105\\t0.185\\t0.356\\t0.126\\t0.206
Late\\ttop-Qwen\\t-\\t0.383\\t0.102\\t0.179\\t0.351\\t0.122\\t0.203
Jina-V2\\tEarly\\tFix-size\\t512\\t0.261\\t0.064\\t0.124\\t0.237\\t0.075\\t0.137
Late\\tFix-size\\t512\\t0.280\\t0.069\\t0.125\\t0.255\\t0.081\\t0.146
Early\\tJina-Sem\\t-\\t0.294\\t0.079\\t0.144\\t0.269\\t0.092\\t0.158
Late\\tsim-Qwen\\t-\\t0.278\\t0.071\\t0.130\\t0.253\\t0.083\\t0.146
Late\\ttop-Qwen\\t-\\t0.279\\t0.070\\t0.135\\t0.254\\t0.081\\t0.147
BGE-M3\\tEarly\\tFix-size\\t512\\t0.246\\t0.059\\t0.120\\t0.225\\t0.069\\t0.130
Late\\tFix-size\\t512\\t0.070\\t0.010\\t0.029\\t0.067\\t0.013\\t0.038
Early\\tJina-Sem\\t-\\t0.260\\t0.066\\t0.122\\t0.240\\t0.079\\t0.144
Late\\tsim-Qwen\\t-\\t0.091\\t0.015\\t0.038\\t0.081\\t0.018\\t0.045
Late\\ttop-Qwen\\t-\\t0.110\\t0.019\\t0.044\\t0.097\\t0.022\\t0.048
Table 3:EarlyVsLate Retriever comparison on NFCorpus. Bold values indicate the best performance for each metric
Model\\tChunk\\tSegm\\tLength\\tNDCG@5\\tMAP@5\\tF1@5\\tNDCG@10\\tMAP@10\\tF1@10
Stella-V5\\tEarly\\tFix-size\\t512\\t0.630\\t0.501\\t0.019\\t0.632\\t0.502\\t0.011
Late\\tFix-size\\t512\\t0.503\\t0.340\\t0.018\\t0.505\\t0.341\\t0.010
Table 4:EarlyVsLate Retriever comparison MsMarco. Bold values indicate the best performance for each metric.
Method\\tNDCG@5\\tMAP@5\\tF1@5\\tNDCG@10\\tMAP@10\\tF1@10
Late\\t0.309\\t0.143\\t0.202\\t0.294\\t0.160\\t0.192
Contextual\\t0.317\\t0.146\\t0.206\\t0.308\\t0.166\\t0.202
Table 5:Latechunking (Late) comparison versus ContextualRankFusion (Contextual) best performances, on same NFCorpus dataset subset (20% of the whole). Embedding Model: Jina-V3. Chunking Method: Fixed-Window Chunking.
5.4Dynamic segmenting models

As shown in Table 3, the performance of pipelines utilizing dynamic segmentation, such as with Jina-V3, is superior to other approaches. However, this improvement comes at the cost of increased computational requirements and longer processing times. Specifically, embedding the NFCorpus dataset entirely with our experimental setup with fixed-size or semantic segmenter takes approximately 30 minutes. In comparison, the Simple-Qwen model requires twice the time, while the Topic-Qwen model requires four times as long.

Another drawback of these models is their generative nature, which can lead to inconsistencies. They do not always produce the exact same wording for chunks, rendering them less reliable in certain scenarios.

6Conclusion

While both approaches are effective solutions at mitigating the challenge of context-dilemma, maintaining context in document retrieval in certain scenarios, both cannot be considered definitive solutions to tackle the problem. Late chunking offers a more computationally efficient solution by leveraging the natural capabilities of embedding models. In contrast, contextual retrieval, with its reliance on LLMs for context augmentation and re-ranking, incurs higher computational expenses. It also notable that the type of document and it’s length can affect the performances, together with the LLM chosen for the task, smaller and more efficient models performing worse.
This distinction is crucial for applications where computational resources are a significant consideration like in real-world scenarios.

Preprint Acknowledgment

This preprint has not undergone peer review or any post-submission improvements or corrections. The Version of Record of this contribution will be available online in Second Workshop on Knowledge-Enhanced Information Retrieval, ECIR 2025, Springer Lecture Notes in Computer Science, via Springer’s DOI link after publication.

References
[1]
↑
\\tAbdin, M., Aneja, J., Awadalla, H., Awadallah, A., Awan, A.A., Bach, N., Bahree, A., Bakhtiari, A., Bao, J., Behl, H., Benhaim, A., Bilenko, M., Bjorck, J., Bubeck, S., Cai, M., Cai, Q., Chaudhary, V., Chen, D., Chen, D., Chen, W., Chen, Y.C., Chen, Y.L., Cheng, H., Chopra, P., Dai, X., Dixon, M., Eldan, R., Fragoso, V., Gao, J., Gao, M., Gao, M., Garg, A., Giorno, A.D., Goswami, A., Gunasekar, S., Haider, E., Hao, J., Hewett, R.J., Hu, W., Huynh, J., Iter, D., Jacobs, S.A., Javaheripi, M., Jin, X., Karampatziakis, N., Kauffmann, P., Khademi, M., Kim, D., Kim, Y.J., Kurilenko, L., Lee, J.R., Lee, Y.T., Li, Y., Li, Y., Liang, C., Liden, L., Lin, X., Lin, Z., Liu, C., Liu, L., Liu, M., Liu, W., Liu, X., Luo, C., Madan, P., Mahmoudzadeh, A., Majercak, D., Mazzola, M., Mendes, C.C.T., Mitra, A., Modi, H., Nguyen, A., Norick, B., Patra, B., Perez-Becker, D., Portet, T., Pryzant, R., Qin, H., Radmilac, M., Ren, L., de Rosa, G., Rosset, C., Roy, S., Ruwase, O., Saarikivi, O., Saied, A., Salim, A., Santacroce, M., Shah, S., Shang, N., Sharma, H., Shen, Y., Shukla, S., Song, X., Tanaka, M., Tupini, A., Vaddamanu, P., Wang, C., Wang, G., Wang, L., Wang, S., Wang, X., Wang, Y., Ward, R., Wen, W., Witte, P., Wu, H., Wu, X., Wyatt, M., Xiao, B., Xu, C., Xu, J., Xu, W., Xue, J., Yadav, S., Yang, F., Yang, J., Yang, Y., Yang, Z., Yu, D., Yuan, L., Zhang, C., Zhang, C., Zhang, J., Zhang, L.L., Zhang, Y., Zhang, Y., Zhang, Y., Zhou, X.: Phi-3 technical report: A highly capable language model locally on your phone (2024), https://arxiv.org/abs/2404.14219
[2]
↑
\\tBajaj, P., Campos, D., Craswell, N., Deng, L., Gao, J., Liu, X., Majumder, R., McNamara, A., Mitra, B., Nguyen, T., Rosenberg, M., Song, X., Stoica, A., Tiwary, S., Wang, T.: Ms marco: A human generated machine reading comprehension dataset (2018), https://arxiv.org/abs/1611.09268
[3]
↑
\\tBoteva, V., Gholipour Ghalandari, D., Sokolov, A., Riezler, S.: A full-text learning to rank dataset for medical information retrieval. vol. 9626, pp. 716–722 (03 2016). https://doi.org/10.1007/978-3-319-30671-1_58
[4]
↑
\\tChen, J., Xiao, S., Zhang, P., Luo, K., Lian, D., Liu, Z.: Bge m3-embedding: Multi-lingual, multi-functionality, multi-granularity text embeddings through self-knowledge distillation (2024), https://arxiv.org/abs/2402.03216
[5]
↑
\\tDing, Y., Zhang, L.L., Zhang, C., Xu, Y., Shang, N., Xu, J., Yang, F., Yang, M.: Longrope: Extending LLM context window beyond 2 million tokens. In: Forty-first International Conference on Machine Learning, ICML 2024, Vienna, Austria, July 21-27, 2024. OpenReview.net (2024), https://openreview.net/forum?id=ONOtpXLqqw
[6]
↑
\\tFan, W., Ding, Y., Ning, L., Wang, S., Li, H., Yin, D., Chua, T.S., Li, Q.: A survey on rag meeting llms: Towards retrieval-augmented large language models (2024), https://arxiv.org/abs/2405.06211
[7]
↑
\\tGao, Y., Xiong, Y., Gao, X., Jia, K., Pan, J., Bi, Y., Dai, Y., Sun, J., Wang, M., Wang, H.: Retrieval-augmented generation for large language models: A survey (2024), https://arxiv.org/abs/2312.10997
[8]
↑
\\tGupta, S., Ranjan, R., Singh, S.: A comprehensive survey of retrieval-augmented generation (rag): Evolution, current landscape and future directions (10 2024). https://doi.org/10.48550/arXiv.2410.12837
[9]
↑
\\tGünther, M., Mohr, I., Williams, D.J., Wang, B., Xiao, H.: Late chunking: Contextual chunk embeddings using long-context embedding models (2024), https://arxiv.org/abs/2409.04701
[10]
↑
\\tGünther, M., Ong, J., Mohr, I., Abdessalem, A., Abel, T., Akram, M.K., Guzman, S., Mastrapas, G., Sturua, S., Wang, B., Werk, M., Wang, N., Xiao, H.: Jina embeddings 2: 8192-token general-purpose text embeddings for long documents (2024), https://arxiv.org/abs/2310.19923
[11]
↑
\\tHsieh, C.Y., Chuang, Y.S., Li, C.L., Wang, Z., Le, L.T., Kumar, A., Glass, J., Ratner, A., Lee, C.Y., Krishna, R., Pfister, T.: Found in the middle: Calibrating positional attention bias improves long context utilization (2024), https://arxiv.org/abs/2406.16008
[12]
↑
\\tJina.ai: Finding optimal breakpoints in long documents using small language models (Oct 2024), https://jina.ai/news/finding-optimal-breakpoints-in-long-documents-using-small-language-models/
[13]
↑
\\tKarpukhin, V., Oğuz, B., Min, S., Lewis, P., Wu, L., Edunov, S., Chen, D., tau Yih, W.: Dense passage retrieval for open-domain question answering (2020), https://arxiv.org/abs/2004.04906
[14]
↑
\\tKoshorek, O., Cohen, A., Mor, N., Rotman, M., Berant, J.: Text segmentation as a supervised learning task (2018), https://arxiv.org/abs/1803.09337
[15]
↑
\\tLewis, P.S.H., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S., Kiela, D.: Retrieval-augmented generation for knowledge-intensive NLP tasks. In: Larochelle, H., Ranzato, M., Hadsell, R., Balcan, M., Lin, H. (eds.) Advances in Neural Information Processing Systems 33: Annual Conference on Neural Information Processing Systems 2020, NeurIPS 2020, December 6-12, 2020, virtual (2020), https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html
[16]
↑
\\tLu, T., Gao, M., Yu, K., Byerly, A., Khashabi, D.: Insights into llm long-context failures: When transformers know but don’t tell (2024), https://arxiv.org/abs/2406.14673
[17]
↑
\\tMoro, G., Ragazzi, L.: Align-then-abstract representation learning for low-resource summarization. Neurocomputing 548, 126356 (2023). https://doi.org/https://doi.org/10.1016/j.neucom.2023.126356, https://www.sciencedirect.com/science/article/pii/S0925231223004794
[18]
↑
\\tMuennighoff, N., Tazi, N., Magne, L., Reimers, N.: Mteb: Massive text embedding benchmark (2023), https://arxiv.org/abs/2210.07316
[19]
↑
\\tRobertson, S., Zaragoza, H.: The probabilistic relevance framework: Bm25 and beyond. Foundations and Trends in Information Retrieval 3, 333–389 (01 2009). https://doi.org/10.1561/1500000019
[20]
↑
\\tSturua, S., Mohr, I., Akram, M.K., Günther, M., Wang, B., Krimmel, M., Wang, F., Mastrapas, G., Koukounas, A., Wang, N., Xiao, H.: jina-embeddings-v3: Multilingual embeddings with task lora (2024), https://arxiv.org/abs/2409.10173
Report Issue
Report Issue for Selection
Generated by L A T E xml 
Instructions for reporting errors

We are continuing to improve HTML versions of papers, and your feedback helps enhance accessibility and mobile support. To report errors in the HTML that will help us improve conversion and rendering, choose any of the methods listed below:

Click the \\"Report Issue\\" button.
Open a report feedback form via keyboard, use \\"Ctrl + ?\\".
Make a text selection and click the \\"Report Issue for Selection\\" button near your cursor.
You can use Alt+Y to toggle on and Alt+Shift+Y to toggle off accessible reporting links at each section.

Our team has already identified the following issues. We appreciate your time reviewing and reporting rendering errors we may not have found yet. Your efforts will help us improve the HTML versions for all readers, because disability should not be a barrier to accessing research. Thank you for your continued support in championing open access for all.

Have a free development cycle? Help support accessibility at arXiv! Our collaborators at LaTeXML maintain a list of packages that need conversion, and welcome developer contributions."