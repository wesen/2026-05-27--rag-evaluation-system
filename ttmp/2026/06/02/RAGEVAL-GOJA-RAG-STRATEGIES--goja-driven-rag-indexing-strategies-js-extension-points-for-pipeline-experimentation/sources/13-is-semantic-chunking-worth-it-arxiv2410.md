---
title: "Is Semantic Chunking Worth the Computational Cost? (arxiv 2410.13070)"
source: "https://arxiv.org/html/2410.13070v1"
extracted: 2026-06-02T17:54:15-04:00
---

# Is Semantic Chunking Worth the Computational Cost?

Source: https://arxiv.org/html/2410.13070v1

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
2Chunking Strategies
3Experiments
4Results
5Conclusion
 References

HTML conversions sometimes display errors due to content that did not convert correctly from the source. This paper uses the following packages that are not yet supported by the HTML conversion tool. Feedback on these issues are not necessary; they are known and are being worked on.

failed: inconsolata

Authors: achieve the best HTML results from your LaTeX submissions by following these best practices.

License: CC BY-NC-ND 4.0
arXiv:2410.13070v1 [cs.CL] 16 Oct 2024
Is Semantic Chunking Worth the Computational Cost?
Renyi Qu
Vectara, Inc. renyi@vectara.com
&Forrest Bao Vectara, Inc. forrest@vectara.com
&Ruixuan Tu University of Wisconsin–Madison turx2003@gmail.com
Abstract

Recent advances in Retrieval-Augmented Generation (RAG) systems have popularized semantic chunking, which aims to improve retrieval performance by dividing documents into semantically coherent segments. Despite its growing adoption, the actual benefits over simpler fixed-size chunking, where documents are split into consecutive, fixed-size segments, remain unclear. This study systematically evaluates the effectiveness of semantic chunking using three common retrieval-related tasks: document retrieval, evidence retrieval, and retrieval-based answer generation. The results show that the computational costs associated with semantic chunking are not justified by consistent performance gains. These findings challenge the previous assumptions about semantic chunking and highlight the need for more efficient chunking strategies in RAG systems.

Is Semantic Chunking Worth the Computational Cost?




Renyi Qu
Vectara, Inc.
renyi@vectara.com                      Forrest Bao
Vectara, Inc.
forrest@vectara.com                      Ruixuan Tu
University of Wisconsin–Madison
turx2003@gmail.com



1Introduction

In Retrieval-Augmented Generation (RAG) systems, cutting documents into smaller units called “chunks” has a crucial effect on the quality of both retrieval and generation tasks Chen et al. (2023); Wadhwa et al. (2024); Shi et al. (2023); Yu et al. (2023). By retrieving the most relevant chunks for a given query and feeding them into a generative language model, these systems aim to produce accurate and contextually appropriate answers. However, the effectiveness of chunking strategies remains a significant challenge in optimizing retrieval quality and computational efficiency Lewis et al. (2020); Finardi et al. (2024).

Known as fixed-size chunking, the traditional way to chunk is to cut documents into chunks of a fixed length such as 200 tokens Gao et al. (2023). While computationally simple, this approach can fragment semantically related content across multiple chunks, leading to suboptimal retrieval performance. Recently, there has been a surge of interest in semantic chunking, where documents are segmented based on semantic similarity, with some industry applications suggesting promising improvements in performance LangChain (2024); LlamaIndex (2024); McCormick (2024). However, there is no systematic evidence that semantic chunking yields a performance gain in downstream tasks, and if there is, the gain is significant enough to justify the computational overhead than fixed-size chunking.

Such a systematic evaluation is not trivial due to the lack of data that can be directly used to compare chunking strategies. Therefore, we design an indirect evaluation using three proxy tasks: (1) document retrieval, measuring the ability to identify relevant documents; (2) evidence retrieval, measuring the ability to locate ground-truth evidence; and (3) answer generation, testing the quality of answers produced by a generative model using retrieved chunks. Our findings challenge prevailing assumptions about the benefits of semantic chunking, suggesting that its advantages are highly task-dependent and often insufficient to justify the added computational costs. This study lays the groundwork for future exploration of more efficient and adaptive chunking strategies in RAG systems.

Figure 1:Illustration of the three chunkers tested in this study. Colored segments represent different topics within the sample document: Purple for psychology, Green for programming, and Yellow for food. Red blocks mark chunk breakpoints. (a) Fixed-size Chunker splits the document into consecutive, uniform chunks without considering semantic content. (b) Breakpoint-based Semantic Chunker segments the text by detecting semantic distance thresholds between consecutive sentences to maintain coherence. (c) Clustering-based Semantic Chunker groups semantically similar sentences, potentially combining non-consecutive text to form topic-based chunks.

In general, our contributions are:

• 

We present a novel, large-scale evaluation framework comparing semantic and fixed-size chunking across diverse tasks.

• 

We demonstrate that while semantic chunking shows some benefits in certain scenarios, these are inconsistent and often insufficient to justify the computational cost.

2Chunking Strategies

In this paper, a document is first split into sentences which are then grouped into chunks. We evaluate three chunking strategies, hereafter referred to as “chunkers.”

Fixed-size Chunker  This is our baseline chunker that splits a document sequentially into fixed-size chunks, based on a predefined or user-specified number of sentences per chunk.

Although this approach is simple and computationally efficient, it may separate contextually related sentences, leading to potential degradation in retrieval quality Lewis et al. (2020); Finardi et al. (2024); Gao et al. (2023). To alleviate this, we use overlapping sentences between consecutive chunks, a common practice to maintain some degree of contextual continuity.

Breakpoint-based Semantic Chunker  A break- point-based chunker scans over the sequence of sentences and decide where to insert a breakpoint to separate sentences before and after it into two chunks. A breakpoint is inserted if the semantic distance between two consecutive sentences exceeds a thredshold, meaning a significant topic change.

We tested four relative thresholds for determining breakpoints, as proposed by LangChain (2024).Additionally, we tested two absolute thresholds, which use predetermined values to determine chunk boundaries, reducing computational overhead.

However, the breakpoint-based chunkers make decisions using only two sentences each time. This strategy maybe locally greedy. To chunk with more information at a bigger scope, we propose a new type of semantic chunkers next.

Clustering-based Semantic Chunker   This type of chunkers leverage clustering algorithms to group sentences together semantically, capturing global relationships and allowing for non-sequential sentence groupings. However, it risks losing losing contextual information hidden in the proximity of sentences. To mitigate this, we defined a new distance measure that combines positional and semantic distances. Specifically, we calculate a weighted sum between the positional distance (i.e., the sentence index difference) and the cosine distance between two sentence 
x
𝑎
 and 
x
𝑏
:

\\t
𝑑
⁢
(
x
𝑎
,
x
𝑏
)
=
𝜆
⁢
𝑑
pos
⁢
(
x
𝑎
,
x
𝑏
)
+
(
1
−
𝜆
)
⁢
𝑑
cos
⁢
(
x
𝑎
,
x
𝑏
)
\\t\\t
(1)

\\t
𝑑
pos
⁢
(
x
𝑎
,
x
𝑏
)
=
|
𝑎
−
𝑏
|
𝑛
\\t\\t
(2)

\\t
𝑑
cos
⁢
(
x
𝑎
,
x
𝑏
)
=
1
−
max
⁡
(
cos
⁡
(
emb
⁢
(
x
𝑎
)
,
emb
⁢
(
x
𝑏
)
)
,
0
)
\\t\\t
(3)

where 
𝑛
 is the total number of sentences in the document, 
emb
⁢
(
⋅
)
 is the embedding function, and 
𝜆
 is a hyperparameter. When 
𝜆
=
0
, the chunker operates purely based on semantic similarity; when 
𝜆
=
1
, it mirrors the Fixed-size Chunker. In Eq. (3), a cosine similarity of 0 indicates orthogonal (unrelated) sentence embeddings, while negative cosine similarity values are treated as 0, as they do not aid in retrieval or generation.

Without losing generality, we employed single-linkage agglomerative clustering and DBSCAN Ester et al. (1996) as representatives of clustering algorithms. Further details on these methods an their adjustments during experimentation are provided in Appendix A.

3Experiments

In the absence of ground-truth chunk data, we designed three experiments to indirectly assess the quality of each chunker: document retrieval, evidence retrieval, and answer generation. Different datasets and evaluation metrics were used for each experiment to align with the specific task requirements. All documents were first split into sentences using SpaCy’s en
_
core
_
web
_
sm model Explosion (2024) before being embedded and chunked. We tested three embedding models selected to represent a range of performances based on their rankings on the MTEB Leaderboard Muennighoff et al. (2022). See Appendix E.2 for details.

3.1Document Retrieval

This experiment assessed the effectiveness of chunkers in retrieving relevant documents for a given query. We used 10 datasets, shown in Tables 1 and 6. Most documents on the BEIR benchmark Thakur et al. (2021) are too short for chunking to be effective. To address this, we synthesized longer documents by stitching short documents from six datasets where documents are too short (see Appendix C for details). We randomly sampled 100 queries from each dataset and retrieved the top 
𝑘
 chunks, where 
𝑘
∈
[
1
,
3
,
5
,
10
]
. Each retrieved chunk was mapped to its source document, and the retrieved documents were evaluated by comparing them to a set of relevant documents for each query.

3.2Evidence Retrieval

Here we evaluate chunkers at a finer granularity than the previous experiment by measuring their abilities to locate evidence sentences. We selected additional datasets from RAGBench Friel et al. (2024), shown in Tables 2 and 6, because few datasets contain long documents with ground-truth evidence sentences. We measured the number of ground-truth evidence sentences present in the retrieved top-k chunks.

3.3Answer Generation

This experiment measured how chunkers impacted the quality of LLM-generated answers. We used gpt-4o-mini as the generative model. The top-5 retrieved chunks were used as input for the LLM, and generated answers were compared to ground-truth responses using semantic similarity measures. We reused the datasets from Section 3.2, as they included long documents, evidence, and reference answers.

4Results
4.1Measuring and reporting performances

As mentioned earlier, we used three proxy tasks the study chunking. We cannot directly assess the quality of retrieval at the chunk level due to the lack of ground-truth at the chunk level. Instead, each retrieved chunk is mapped back to either the source document or the included evidence sentences.

Since the number of relevant documents or evidence sentences is not fixed (unlike the 
𝑘
 value for retrieved chunks), traditional metrics such as Recall@k and NDCG@k are not suitable. F1 provides a balanced measure that accounts for both precision and recall under these circumstances. Therefore, we use F1@5 as the metric. For further details, see Appendix D.

For each dataset, results are reported based on the best hyperparameter configuration for each chunker, determined by the average F1 score across all 
𝑘
 values. All results to be reported below are obtained using 
dunzhang/stella
_
en
_
1.5B
_
v5
 as the embedder for being the best among those tested.

In the following subsections, Bold values indicate the best performance on the respective dataset. The results for Answer Generation closely matched those of Evidence Retrieval and are discussed in Appendix E.1. Additional analysis of hyperparameters is provided in Appendix B. Inspection of the outputs of different chunkers is provided in Appendix E.4.

4.2Document Retrieval

Table 1 shows varied chunker performance, with Fixed-size Chunker excelling on non-stitched datasets and Semantic Chunkers performing better on stitched datasets.

Dataset\\tFixed-size\\tBreakpoint\\tClustering
Miracl*\\t69.45\\t81.89\\t67.35
NQ*\\t43.79\\t63.93\\t41.01
Scidocs*\\t16.82\\t17.60\\t19.87
Scifact*\\t35.27\\t36.27\\t35.70
BioASQ*\\t61.86\\t61.87\\t62.49
NFCorpus*\\t21.36\\t21.07\\t22.12
HotpotQA\\t90.59\\t87.37\\t84.79
MSMARCO\\t93.58\\t92.23\\t93.18
ConditionalQA\\t68.11\\t64.44\\t65.94
Qasper\\t90.99\\t89.27\\t90.77
Table 1:F1@5 for Document Retrieval (
%
). Datasets marked with * are stitched. Rows are sorted by the average number of sentences per document (before stitching) in ascending order for easier comparison.

As described in Appendix C, stitched documents, averaging 100 sentences, were formed by combining short documents (fewer than 10 sentences) from datasets like Miracl and NQ, leading to high topic diversity. In such cases, Breakpoint-based Semantic Chunker outperformed others by better preserving topic integrity, splitting sentences based on semantic dissimilarity to form chunks similar to the original documents. In contrast, Fixed-size and Clustering-based Chunkers often mixed sentences from different documents, increasing noise and lowering retrieval quality.

As document length increased, fewer documents were stitched together, reducing topic diversity. This diminished the advantage of Breakpoint-based Semantic Chunker, while Clustering-based Semantic Chunker improved. The gap between semantic and fixed-size chunkers narrowed, with Fixed-size Chunker benefiting from higher topic integrity.

These results suggest that in real life, the topics in a document may not be as diverse as in our artificially noisy, stitched data, and hence semantic chunkers may not have an edge over fixed-size chunker there.

4.3Evidence Retrieval

As shown in Table 2, Fixed-size Chunker performed best on 3 out of 5 datasets, indicating a slight edge in capturing core evidence sentences. However, the performance differences between the Fixed-size Chunker and the two semantic chunkers were minimal, suggesting no clear advantage for any specific chunking strategy. See Appendix B for more details.

Further inspection revealed that despite variations in chunking methods, the top-k retrieved chunks frequently contained the same evidence sentences, explaining the minimal performance differences. This suggests that adding semantic information did not significantly enhance performance, as the benefits of semantic grouping were often redundant when core evidence was already captured by sentence positions. These findings indicate that the performance of the chunkers largely depends on how effectively the embedding models capture the semantic richness of individual sentences, rather than the chunking strategy itself.

Dataset\\tFixed-size\\tBreakpoint\\tClustering
ExpertQA\\t47.11\\t47.08\\t46.87
DelucionQA\\t43.05\\t43.24\\t43.36
TechQA\\t28.98\\t28.49\\t27.96
ConditionalQA\\t18.23\\t19.83\\t19.14
Qasper\\t8.66\\t8.16\\t8.50
Table 2:F1@5 for Evidence Retrieval (
%
). Rows are sorted by the average number of sentences per document in ascending order for easier comparison.
4.4Results for Answer Generation

As shown in Tables 3, Semantic Chunkers performed slightly better than Fixed-size Chunker based on BERTScore, but the differences are minimal, making it difficult to draw any definitive conclusions.

Dataset\\tFixed-size\\tBreakpoint\\tClustering
ExpertQA\\t0.65\\t0.65\\t0.65
DelucionQA\\t0.76\\t0.76\\t0.76
TechQA\\t0.68\\t0.68\\t0.68
ConditionalQA\\t0.42\\t0.43\\t0.43
Qasper\\t0.49\\t0.49\\t0.50
Table 3:BERTScore for Answer Generation.
5Conclusion

In this paper, we evaluated semantic and fixed-size chunking strategies in RAG systems across document retrieval, evidence retrieval, and answer generation. Semantic chunking occasionally improved performance, particularly on stitched datasets with high topic diversity. However, these benefits were highly context-dependent and did not consistently justify the additional computational cost. On non-synthetic datasets that better reflect real-world documents, fixed-size chunking often performed better. Overall, our results suggest that fixed-size chunking remains a more efficient and reliable choice for practical RAG applications. The impact of chunking strategy was often overshadowed by other factors, such as the quality of embeddings, especially when computational resources are limited or when working with standard document structures.

Limitations

Sentence-level Chunking  Our study focuses on sentence-level chunking, where documents are split into individual sentences, and each sentence is treated as a segment for grouping. This approach results in sentence embeddings that lack contextual information. While we attempted to address this by overlapping sentences in Fixed-size Chunker and incorporating positional distance in Semantic Chunker (global), the embeddings themselves remained context-free. Further exploration of contextual embeddings is necessary before definitively concluding the limitations of semantic chunking.

Lack of Chunk Quality Measures  As noted in Section 4, while the output chunks differed between methods, retrieval and generation performances were similar across chunkers. In addition to the influence of embedding models, the absence of direct chunk quality metrics likely contributed to this issue. Having ground-truth query-chunk relevance scores would provide more accurate evaluations than relying solely on document or evidence mapping.

Lack of Suitable Datasets  Despite testing multiple datasets, our selection was constrained by a lack of comprehensive datasets. An ideal dataset would include long documents representative of real-world use cases, diverse query types, human-generated answers, query-document relevance scores, and human-labeled evidence sentences. Our synthetic documents had artificially high topic diversity due to random stitching, potentially leading to unreliable results. Additionally, the answer sets in RAGBench Friel et al. (2024) were generated by LLMs, which may not accurately assess chunk quality. A dataset containing all these elements is needed for a more thorough evaluation of chunking strategies.

References
Bolotova-Baranova et al. (2023)
↑
\\tValeriia Bolotova-Baranova, Vladislav Blinov, Sofya Filippova, Falk Scholer, and Mark Sanderson. 2023.Wikihowqa: A comprehensive benchmark for multi-document non-factoid question answering.In Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers), pages 5291–5314.
Boteva et al. (2016)
↑
\\tVera Boteva, Demian Gholipour, Artem Sokolov, and Stefan Riezler. 2016.A full-text learning to rank dataset for medical information retrieval.In Advances in Information Retrieval: 38th European Conference on IR Research, ECIR 2016, Padua, Italy, March 20–23, 2016. Proceedings 38, pages 716–722. Springer.
Castelli et al. (2019)
↑
\\tVittorio Castelli, Rishav Chakravarti, Saswati Dana, Anthony Ferritto, Radu Florian, Martin Franz, Dinesh Garg, Dinesh Khandelwal, Scott McCarley, Mike McCawley, et al. 2019.The techqa dataset.arXiv preprint arXiv:1911.02984.
Chen et al. (2024)
↑
\\tJianlv Chen, Shitao Xiao, Peitian Zhang, Kun Luo, Defu Lian, and Zheng Liu. 2024.Bge m3-embedding: Multi-lingual, multi-functionality, multi-granularity text embeddings through self-knowledge distillation.arXiv preprint arXiv:2402.03216.
Chen et al. (2023)
↑
\\tTong Chen, Hongwei Wang, Sihao Chen, Wenhao Yu, Kaixin Ma, Xinran Zhao, Dong Yu, and Hongming Zhang. 2023.Dense x retrieval: What retrieval granularity should we use?arXiv preprint arXiv:2312.06648.
Cohan et al. (2020)
↑
\\tArman Cohan, Sergey Feldman, Iz Beltagy, Doug Downey, and Daniel S Weld. 2020.Specter: Document-level representation learning using citation-informed transformers.arXiv preprint arXiv:2004.07180.
Dasigi et al. (2021)
↑
\\tPradeep Dasigi, Kyle Lo, Iz Beltagy, Arman Cohan, Noah A Smith, and Matt Gardner. 2021.A dataset of information-seeking questions and answers anchored in research papers.arXiv preprint arXiv:2105.03011.
Ester et al. (1996)
↑
\\tMartin Ester, Hans-Peter Kriegel, Jörg Sander, Xiaowei Xu, et al. 1996.A density-based algorithm for discovering clusters in large spatial databases with noise.In kdd, volume 96, pages 226–231.
Explosion (2024)
↑
\\tExplosion. 2024.English • spacy models documentation.
Finardi et al. (2024)
↑
\\tPaulo Finardi, Leonardo Avila, Rodrigo Castaldoni, Pedro Gengo, Celio Larcher, Marcos Piau, Pablo Costa, and Vinicius Caridá. 2024.The chronicles of rag: The retriever, the chunk and the generator.arXiv preprint arXiv:2401.07883.
Friel et al. (2024)
↑
\\tRobert Friel, Masha Belyi, and Atindriyo Sanyal. 2024.Ragbench: Explainable benchmark for retrieval-augmented generation systems.arXiv preprint arXiv:2407.11005.
Gao et al. (2023)
↑
\\tYunfan Gao, Yun Xiong, Xinyu Gao, Kangxiang Jia, Jinliu Pan, Yuxi Bi, Yi Dai, Jiawei Sun, and Haofen Wang. 2023.Retrieval-augmented generation for large language models: A survey.arXiv preprint arXiv:2312.10997.
Kamradt (2024)
↑
\\tGreg Kamradt. 2024.5 levels of text splitting.
Kwiatkowski et al. (2019)
↑
\\tTom Kwiatkowski, Jennimaria Palomaki, Olivia Redfield, Michael Collins, Ankur Parikh, Chris Alberti, Danielle Epstein, Illia Polosukhin, Jacob Devlin, Kenton Lee, et al. 2019.Natural questions: a benchmark for question answering research.Transactions of the Association for Computational Linguistics, 7:453–466.
LangChain (2024)
↑
\\tLangChain. 2024.How to split text based on semantic similarity.
Lewis et al. (2020)
↑
\\tPatrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, et al. 2020.Retrieval-augmented generation for knowledge-intensive nlp tasks.Advances in Neural Information Processing Systems, 33:9459–9474.
LlamaIndex (2024)
↑
\\tLlamaIndex. 2024.Semantic chunker.
Malaviya et al. (2023)
↑
\\tChaitanya Malaviya, Subin Lee, Sihao Chen, Elizabeth Sieber, Mark Yatskar, and Dan Roth. 2023.Expertqa: Expert-curated questions and attributed answers.arXiv preprint arXiv:2309.07852.
McCormick (2024)
↑
\\tZach McCormick. 2024.Solving the out-of-context chunk problem for rag.
Muennighoff et al. (2022)
↑
\\tNiklas Muennighoff, Nouamane Tazi, Loïc Magne, and Nils Reimers. 2022.Mteb: Massive text embedding benchmark.arXiv preprint arXiv:2210.07316.
Nguyen (2016)
↑
\\tT Nguyen. 2016.Ms marco: A human generated machine reading comprehension dataset.arXiv preprint arXiv:1611.09268.
Sadat et al. (2023)
↑
\\tMobashir Sadat, Zhengyu Zhou, Lukas Lange, Jun Araki, Arsalan Gundroo, Bingqing Wang, Rakesh R Menon, Md Rizwan Parvez, and Zhe Feng. 2023.Delucionqa: Detecting hallucinations in domain-specific question answering.arXiv preprint arXiv:2312.05200.
Shi et al. (2023)
↑
\\tFreda Shi, Xinyun Chen, Kanishka Misra, Nathan Scales, David Dohan, Ed H Chi, Nathanael Schärli, and Denny Zhou. 2023.Large language models can be easily distracted by irrelevant context.In International Conference on Machine Learning, pages 31210–31227. PMLR.
Song et al. (2020)
↑
\\tKaitao Song, Xu Tan, Tao Qin, Jianfeng Lu, and Tie-Yan Liu. 2020.Mpnet: Masked and permuted pre-training for language understanding.Advances in neural information processing systems, 33:16857–16867.
Sun et al. (2021)
↑
\\tHaitian Sun, William W Cohen, and Ruslan Salakhutdinov. 2021.Conditionalqa: A complex reading comprehension dataset with conditional answers.arXiv preprint arXiv:2110.06884.
Thakur et al. (2021)
↑
\\tNandan Thakur, Nils Reimers, Andreas Rücklé, Abhishek Srivastava, and Iryna Gurevych. 2021.Beir: A heterogenous benchmark for zero-shot evaluation of information retrieval models.arXiv preprint arXiv:2104.08663.
Tsatsaronis et al. (2012)
↑
\\tGeorge Tsatsaronis, Michael Schroeder, Georgios Paliouras, Yannis Almirantis, Ion Androutsopoulos, Eric Gaussier, Patrick Gallinari, Thierry Artieres, Michael R Alvers, Matthias Zschunke, et al. 2012.Bioasq: A challenge on large-scale biomedical semantic indexing and question answering.In 2012 AAAI Fall Symposium Series.
Wadden et al. (2020)
↑
\\tDavid Wadden, Shanchuan Lin, Kyle Lo, Lucy Lu Wang, Madeleine van Zuylen, Arman Cohan, and Hannaneh Hajishirzi. 2020.Fact or fiction: Verifying scientific claims.arXiv preprint arXiv:2004.14974.
Wadhwa et al. (2024)
↑
\\tHitesh Wadhwa, Rahul Seetharaman, Somyaa Aggarwal, Reshmi Ghosh, Samyadeep Basu, Soundararajan Srinivasan, Wenlong Zhao, Shreyas Chaudhari, and Ehsan Aghazadeh. 2024.From rags to rich parameters: Probing how language models utilize external knowledge over parametric information for factual queries.arXiv preprint arXiv:2406.12824.
Yang et al. (2018)
↑
\\tZhilin Yang, Peng Qi, Saizheng Zhang, Yoshua Bengio, William W Cohen, Ruslan Salakhutdinov, and Christopher D Manning. 2018.Hotpotqa: A dataset for diverse, explainable multi-hop question answering.arXiv preprint arXiv:1809.09600.
Yu et al. (2023)
↑
\\tWenhao Yu, Hongming Zhang, Xiaoman Pan, Kaixin Ma, Hongwei Wang, and Dong Yu. 2023.Chain-of-note: Enhancing robustness in retrieval-augmented language models.arXiv preprint arXiv:2311.09210.
Zhang (2024)
↑
\\tDun Zhang. 2024.Stella.
Zhang et al. (2019)
↑
\\tTianyi Zhang, Varsha Kishore, Felix Wu, Kilian Q Weinberger, and Yoav Artzi. 2019.Bertscore: Evaluating text generation with bert.arXiv preprint arXiv:1904.09675.
Zhang et al. (2023)
↑
\\tXinyu Zhang, Nandan Thakur, Odunayo Ogundepo, Ehsan Kamalloo, David Alfonso-Hermelo, Xiaoguang Li, Qun Liu, Mehdi Rezagholizadeh, and Jimmy Lin. 2023.Miracl: A multilingual retrieval dataset covering 18 diverse languages.Transactions of the Association for Computational Linguistics, 11:1114–1131.
Zhu et al. (2024)
↑
\\tAndrew Zhu, Alyssa Hwang, Liam Dugan, and Chris Callison-Burch. 2024.Fanoutqa: a multi-hop, multi-document question answering benchmark for large language models.In Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (Volume 2: Short Papers), pages 18–37.
Dataset\\tType\\tSplit\\t
#
D\\tS/D(*)\\tS/D\\tD/Q
Miracl Zhang et al. (2023) \\tStitched\\ttrain\\t1184\\t102\\t4\\t3
NQ Kwiatkowski et al. (2019) \\tStitched\\ttest\\t488\\t88\\t5\\t1
Scidocs Cohan et al. (2020) \\tStitched\\ttest\\t1692\\t88\\t8\\t5
Scifact Wadden et al. (2020) \\tStitched\\ttest\\t420\\t99\\t8\\t1
BioASQ Tsatsaronis et al. (2012) \\tStitched\\ttrain\\t2368\\t93\\t9\\t6
NFCorpus Boteva et al. (2016) \\tStitched\\ttest\\t364\\t118\\t12\\t37
HotpotQA Yang et al. (2018) \\tOriginal\\ttest\\t800\\t20\\t20\\t2
MSMARCO Nguyen (2016) \\tOriginal\\tdev\\t398\\t64\\t64\\t1
ConditionalQA Sun et al. (2021) \\tOriginal\\tdev\\t652\\t120\\t120\\t1
Qasper Dasigi et al. (2021) \\tOriginal\\ttest\\t416\\t130\\t130\\t1
Table 4:Datasets for Document Retrieval. \\"
#
D\\" means the number of selected long documents. \\"S/D\\" means the average number of sentences per document (before stitching). \\"S/D(*)\\" means the average number of sentences per long document (after stitching). \\"D/Q\\" means the average number of relevant long documents per query. The synthesized datasets are labeled as \\"Synthetic\\".
Dataset\\tSplit\\t
#
D\\tS/D\\tE/Q
ExpertQA Malaviya et al. (2023) \\ttest\\t777\\t20\\t12
DelucionQA Sadat et al. (2023) \\ttest\\t235\\t23\\t9
TechQA Castelli et al. (2019) \\ttest\\t648\\t49\\t15
ConditionalQA Sun et al. (2021) \\tdev\\t652\\t120\\t5
Qasper Dasigi et al. (2021) \\ttest\\t416\\t130\\t4
Table 5:Datasets for Evidence Retrieval and Answer Generation. \\"
#
D\\" means the number of selected long documents. \\"S/D\\" means the average number of sentences per long document. \\"E/Q\\" means the average number of evidence sentences per query.
Name\\tRank\\tModel Size (millions)
dunzhang/stella
_
en
_
1.5B
_
v5 Zhang (2024) \\t3\\t1543
BAAI/bge-large-en-v1.5 Chen et al. (2024) \\t36\\t335
all-mpnet-base-v2 Song et al. (2020) \\t105\\t110
Table 6:Embedding models used in the experiments. \\"Rank\\" represents the rank of the model on the MTEB Leaderboard Muennighoff et al. (2022). \\"Model Size\\" represents the number of parameters in the embedding model.
Appendix AClustering methods for Clustering-based Semantic Chunker

We applied single-linkage agglomerative clustering to sentence embeddings in two stages. First, we computed a distance matrix where each entry represents the distance between pairs of sentences in the document. Second, we iteratively formed clusters by merging sentence pairs with the smallest distances, ensuring that the resulting cluster does not exceed a predefined maximum chunk size. This process continued until all distances had been processed, after which we relabeled the merged clusters.

To address challenges encountered during experimentation, we implemented the following adjustments:

Chunk Size Constraint  Without a size constraint, this chunker tends to form one large chunk while leaving a few isolated sentences as individual chunks. To avoid this, we imposed a maximum chunk size threshold that directly depends on the number of chunks and the total number of sentences in the input document.

Distance Threshold for Stopping  To prevent isolated sentences from being grouped arbitrarily, we introduced a distance threshold. Once this threshold is exceeded, clustering stops, and any remaining sentences are left ungrouped. In this paper, the threshold was set to be 0.5.

A limitation of the single-linkage method is its requirement to specify the number of clusters, which can be difficult without prior knowledge. To mitigate this, we also experimented with DBSCAN Ester et al. (1996), a density-based clustering method that adjusts the number of clusters dynamically based on the density of sentence embeddings. DBSCAN follows the same initial steps as single-linkage clustering but replaces the merging process with density-based clustering.

Appendix BHyperparameters

Fixed-size Chunker   We tested two hyperparameters: the number of chunks and the number of overlapping sentences between consecutive chunks. For the number of chunks, we tested integer values between 2 and 10 to observe performance changes with different chunk sizes. For the overlapping sentences, we tested two settings: 0 or 1. If set to 1, one sentence overlaps between consecutive chunks; if set to 0, there is no overlap.

Breakpoint-based Semantic Chunker   We tested two hyperparameters: the type of breakpoint threshold and the threshold amount. Sentences were split into chunks when the distance between consecutive sentences exceeded a predefined threshold. We evaluated four relative threshold types from Kamradt (2024):

• 

Percentile: The nth percentile of the linear interpolation of the distance array. We tested [10, 30, 50, 70, 90].

• 

Standard deviation: The mean of the linear interpolation plus a fraction of the standard deviation. We tested [1, 1.5, 2, 2.5, 3].

• 

Interquartile: The mean of the linear interpolation plus a fraction of the interquartile range. We tested [0.5, 0.75, 1, 1.25, 1.5].

• 

Gradient: The nth percentile of the second-order accurate difference in the distance array. We tested [10, 30, 50, 70, 90].

Additionally, we tested two absolute versions of \\"Percentile\\" and \\"Gradient\\":

• 

Distance: A cosine distance threshold value. We tested [0.1, 0.2, 0.3, 0.4, 0.5] based on empirical distance values.

• 

Gradient: A threshold value based on the second-order accurate difference. We tested [0.01, 0.05, 0.1, 0.15, 0.2] based on empirical gradient values.

Note that the number of chunks or chunk size is not tunable in the Breakpoint-based Semantic Chunker.

Clustering-based Semantic Chunker   For the single-linkage chunker, we tested two hyperparameters: 
𝜆
, which controls the weight of the positional distance in the overall distance calculation, and the number of chunks, as in the Fixed-size Chunker. We tested [0, 0.25, 0.5, 0.75, 1] for 
𝜆
.

For the DBSCAN chunker, we evaluated three hyperparameters: 
𝜆
, similar to single-linkage; EPS, the maximum distance between two samples for them to be considered part of the same neighborhood; and \\"min
_
samples\\", the minimum number of samples required in a neighborhood for a point to be classified as a core point. For EPS, we tested [0.1, 0.2, 0.3, 0.4, 0.5]. For \\"min
_
samples\\", we tested [1, 2, 3, 4, 5].

Appendix CDocument Stitching and Dataset Choices

Most document retrieval datasets consist of short documents (fewer than 20 sentences), which are inadequate for effectively evaluating chunkers. Initially, we experimented with datasets from BEIR Thakur et al. (2021), but the short length of these documents showed no performance improvement with chunking. Short documents lack the complexity required to assess how chunkers manage context and semantic coherence across longer spans of text.

To overcome this limitation, we created long documents by stitching shorter documents from existing datasets. Each stitched document contains approximately 100 sentences, better reflecting real-world long-document retrieval scenarios. In this setup, if a short document is relevant to a query, the corresponding stitched long document is considered relevant. This creates a coarser granularity for document retrieval and motivated the need for the evidence retrieval experiment, which offers a finer level of evaluation.

We selected datasets based on diversity in document topics and query types. Keyword-specific queries tend to favor lexical search, which can degrade the performance of semantic search methods. For the document retrieval task, we used the datasets listed in Table 6, including NFCorpus, NQ, HotpotQA, Scidocs, and Scifacts from BEIR Thakur et al. (2021).

For evidence retrieval and answer generation, we used the datasets listed in Table 6. No stitched document was used.

Appendix DChoice of Evaluation Metrics

Document Retrieval  Retrieval can be viewed as two tasks: classification and ranking. In this paper, a document is considered retrieved if any chunk from it is retrieved, irrespective of the query-chunk relevance score. This approach shifts the focus from query-chunk relevance to query-document evaluation, reducing the influence of ranking metrics such as NDCG, MAP, or MRR.

• 

Recall@k: Fraction of relevant documents retrieved within the top-k chunks, over all relevant documents.

• 

Precision@k: Fraction of relevant documents retrieved within the top-k chunks, over all retrieved documents.

• 

F1@k: The harmonic mean of precision and recall.

In typical retrieval experiments, recall is often the primary metric. However, our setup requires balancing recall with precision and F1 score. Since the number of retrieved chunks is fixed but the number of retrieved documents varies, precision and F1 are crucial. For instance, if five chunks are retrieved for a query with only one relevant document, retrieving all five chunks from this document would result in 100
%
 recall and precision. However, if only one chunk is relevant and the rest are from irrelevant documents, the recall remains 100
%
, but precision drops, leading to a different quality of retrieval. In such cases, the F1 score better captures this trade-off by balancing recall and precision.

Evidence Retrieval  In evidence retrieval, recall and precision are sensitive to chunk size when considered separately. Larger chunks tend to have higher recall, as they are more likely to contain evidence sentences, but also lower precision, as they may include more irrelevant sentences. Larger chunks are often less desirable as they introduce more noise. For example, \\"No Chunker\\" will consistently have the highest recall and lowest precision, as it treats entire documents as single chunks. The F1 score helps balance these biases, providing a better indicator of whether the chunker produces appropriately sized chunks that capture relevant evidence. Therefore, we focus on F1 scores in our analysis.

• 

Recall@k: Fraction of retrieved evidence sentences over all evidence sentences.

• 

Precision@k: Fraction of retrieved evidence sentences over all retrieved sentences.

• 

F1@k: The harmonic mean of precision and recall.

Answer Generation  Generated answers were assessed using BERTScore for semantic similarity between generated and actual answers, and cosine similarity between the queries and generated answers.

• 

BERTScore Zhang et al. (2019): A measure of the semantic similarity between generated answers and reference answers using contextual embeddings. We used the best model microsoft/deberta-xlarge-mnli for calculating this score.

• 

QA Similarity: The cosine similarity between the query and generated answer, providing a measure of consistency and correctness in relation to the original query.

Appendix EAdditional Results and Analyses

We present full results and analyses that are not reported in Section 4 in this section. See Table 8 for F1 scores at all 
𝑘
 values for document retrieval. See Table 11 for F1 scores at all 
𝑘
 values for evidence retrieval.

E.1Results for Answer Generation

As shown in Table 7, semantic chunkers performed slightly better than Fixed-size Chunker in terms of QA cosine similarity. However, the differences are minimal, making it difficult to draw any definitive conclusions from the results.

Dataset\\tFixed-size\\tBreakpoint\\tClustering
ExpertQA\\t0.81\\t0.82\\t0.81
DelucionQA\\t0.82\\t0.82\\t0.82
TechQA\\t0.89\\t0.88\\t0.89
ConditionalQA\\t0.36\\t0.36\\t0.36
Qasper\\t0.44\\t0.44\\t0.44
Table 7:QA Cosine Similarity for Answer Generation.
E.2Impact of Embedding Models

The choice of embedding model significantly affected retrieval performance (See Table 6 for tested models). In the Evidence Retrieval experiment, BAAI/bge-large-en-v1.5 outperformed all-mpnet-base-v2 by 1.06
%
 on F1@1 and 1.32
%
 on F1@10, both statistically significant at the 5
%
 level. dunzhang/stella
_
en
_
1.5B
_
v5 showed an average improvement of 7.44
%
 over BAAI/bge-large-en-v1.5 across all F1 values. This result was statistically significant with 
𝑝
=
1.59
×
10
−
5
, highlighting the critical role of embedding models in retrieval tasks. See Tables 11-11 for full F1 scores from the three embedding models on evidence retrieval.

E.3Hyperparameter Analysis

For Figures 2-5, all scores are normalized and averaged across datasets and 
𝑘
 values. We aimed to identify chunker configurations that perform well across various datasets and 
𝑘
 values, making it logical to average the results. The title of each plot row indicates the chunker and experiment being analyzed, while each subplot title specifies the fixed hyperparameter. The y-axis shows the metric score, and the x-axis represents the hyperparameter being analyzed. Blue lines denote recall, orange lines represent precision, and green lines indicate the F1 score.

Clustering-based Semantic Chunker (Single-linkage)  As n
_
clusters increases, the average chunk size decreases. This has little effect on document retrieval since chunks are mapped to their source documents regardless of size. However, Figure 2 shows that while recall remains steady, precision rises significantly as chunk size decreases, even when 
𝜆
=
1
 (the Fixed-size Chunker case). This occurs due to a drop in the number of retrieved documents as smaller chunks from the same document are retrieved.

No clear trend for 
𝜆
 was observed, indicating that shifting the weight between semantic and positional information does not significantly affect document retrieval. This suggests two possibilities: (1) Sentences close in position are often semantically similar; (2) Chunks with non-contiguous, yet semantically similar sentences do not enhance document retrieval.

In Figure 2, evidence retrieval shows an inverse trend. As chunk size decreases, fewer sentences are retrieved, lowering the chance of retrieving evidence sentences and causing a sharp decline in recall. Thus, the F1 score remains relatively unchanged.

In addition, Figure 2 shows that as 
𝜆
 approaches 1 (representing the Fixed-size Chunker), the F1 score (green line) gradually increases, indicating that positional information contributed more to retrieval performance than semantic similarity, likely because core evidence sentences were often located close together.

Clustering-based Semantic Chunker (DBSCAN)  As EPS increases, the threshold for grouping samples into the same cluster loosens, increasing average chunk size. As seen in Figure 3, this leads to a decrease in precision and an increase in recall for document and evidence retrieval, respectively, similar to the single-linkage case.

Breakpoint-based Semantic Chunker  As the distance threshold between consecutive sentences increases, fewer breakpoints appear, resulting in larger chunks. Regardless of the threshold type, it ultimately determines chunk size. In Figure 4, we observe similar trends to Figure 2 and 3: as chunk size increases, precision decreases in both retrieval tasks, while recall increases sharply for evidence retrieval. The rise in standard deviation is expected, as values from standard deviation-based thresholds are generally higher than those from percentiles or interquartile ranges.

Fixed-size Chunker  Figure 5 shows results for the Fixed-size Chunker. The trends mirror those seen in other chunkers. Adding one overlapping sentence between chunks does not notably improve performance, indicating that a single overlapping sentence is insufficient to significantly boost contextual coherence.

E.4Chunk Inspection

We examined the output chunks to (1) confirm that different chunkers were functioning as intended, and (2) investigate the reasons behind performance differences. BEIR’s HotpotQA dataset Thakur et al. (2021); Yang et al. (2018) was selected for its reasonably sized documents. We randomly sampled five documents, stitching the first four together to form a stitched document (Figure 6), and keeping the fifth as a normal document (Figure 7. The document IDs are:

• 

Stitched: 44547136, 14115210, 5580754, 54045118.

• 

Normal: 30214079.

Inspection on Stitched Documents  In Figure 6, Documents 1 and 3 have four sentences each, while Documents 2 and 4 contain three and five sentences, respectively. The Fixed-size Chunker, which ignores semantic relationships and document structure, frequently misassigned sentences, leading to errors that propagated through subsequent chunks. For instance, a sentence from Document 3 was appended to Document 2, illustrating the limitations of Fixed-size Chunking with stitched documents containing numerous short segments. This explains its poor performance under such conditions. However, simply splitting the document into structured sections before applying fixed-size chunking will solve this issue.

In contrast, both semantic chunkers performed better on stitched documents, but still had issues. The Clustering-based Chunker made one error by grouping Sentence 16 (the last sentence of Document 4) into Chunk 2. This happened because, despite the large positional distance, the semantic similarity was high, causing the sentence to be incorrectly included. Without considering positional structure like the Fixed-size and Breakpoint-based Chunkers, the Clustering-based Chunker often mixed sentences from different documents. While this might be useful for multi-document tasks Bolotova-Baranova et al. (2023); Zhu et al. (2024), it was problematic here, leading to worse performance when many short documents were stitched together.

The Breakpoint-based Chunker also made errors. It could, like the Fixed-size Chunker, group a sentence with a different chunk due to low semantic similarity with neighboring sentences, as seen with Sentence 4 being moved to Chunk 2. This shows the advantage of the joint distance measure in Equation 1, which prevented this error for the Clustering-based Chunker. Moreover, controlling chunk size was challenging; higher thresholds led to overly large chunks, while lower thresholds resulted in single-sentence chunks lacking contextual information, such as Chunk 4’s meaningless \\"Name binding\\" phrase.

Inspection on Normal Documents  In Figure 7, the document about \\"Interact Home Computer\\" was naturally divided into four sections, though this structure was not provided to the chunkers. The Fixed-size Chunker repeated its issue from stitched documents, occasionally grouping sentences from adjacent sections into the same chunk, and this error could be easily fixed by splitting the document by sections beforehand.

Although this example did not fully highlight the Clustering-based Chunker’s limitations, it still demonstrated the downsides of relying solely on semantic similarity. Sentences 8-9, though belonging to Chunk 3, were grouped into Chunk 2 due to high semantic similarity. This showed that even with added positional information, semantic-based chunking could misgroup content that shared context, as these sentences were clearly about the sales of Interact Home Computer.

For the Breakpoint-based Chunker, errors seen in stitched documents were even more pronounced. Despite using the optimal configuration for each chunker (minimizing errors), Breakpoint-based Chunker still produced chunks containing only a single sentence, such as Chunk 3 and 5. Additionally, separating Sentences 5 and 6, which both discussed \\"Interact Electronics Inc,\\" was an especially poor decision. These examples underscore that semantic similarity alone is not a reliable measure for effective chunking, and it may be less useful than straightforward positional information.

Metric\\tF1@1\\tF1@3\\tF1@5\\tF1@10
Chunker\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering
Miracl*\\t67.55\\t69.73\\t68.61\\t76.03\\t83.55\\t75.24\\t69.45\\t81.89\\t67.35\\t49.89\\t67.83\\t46.59
NQ*\\t92.92\\t92.36\\t88.63\\t62.29\\t83.37\\t60.29\\t43.79\\t63.93\\t41.01\\t24.02\\t36.18\\t22.56
Scidocs*\\t7.60\\t7.73\\t10.40\\t15.16\\t14.92\\t18.93\\t16.82\\t16.60\\t19.87\\t16.96\\t16.88\\t19.94
Scifact*\\t55.07\\t53.38\\t55.09\\t43.97\\t52.91\\t46.60\\t35.27\\t36.27\\t35.70\\t22.33\\t27.59\\t22.32
BioASQ*\\t53.09\\t55.95\\t53.14\\t61.92\\t70.74\\t61.84\\t61.86\\t61.87\\t62.49\\t54.37\\t56.82\\t55.44
NFCorpus*\\t11.41\\t12.49\\t11.42\\t19.00\\t19.10\\t20.24\\t21.36\\t21.07\\t22.12\\t22.95\\t23.48\\t24.09
HotpotQA\\t66.00\\t66.00\\t66.67\\t92.06\\t91.83\\t92.33\\t90.59\\t87.37\\t84.79\\t61.34\\t52.22\\t51.30
MSMARCO\\t99.00\\t97.00\\t98.00\\t95.35\\t94.92\\t94.73\\t93.58\\t92.23\\t93.18\\t85.75\\t84.34\\t77.57
ConditionalQA\\t83.03\\t79.70\\t79.34\\t78.67\\t74.63\\t76.09\\t68.11\\t64.44\\t65.94\\t44.66\\t40.37\\t39.35
Qasper\\t96.50\\t93.53\\t95.96\\t95.21\\t92.20\\t95.14\\t90.99\\t89.27\\t90.77\\t68.86\\t69.59\\t62.41
Table 8:F1 scores for all 
𝑘
 values for Document Retrieval (
%
). Datasets marked with * are stitched. Rows are sorted by the average number of sentences per document (before stitching) in ascending order for easier comparison.
Metric\\tF1@1\\tF1@3\\tF1@5\\tF1@10
Chunker\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering
ExpertQA\\t42.43\\t35.25\\t40.83\\t48.67\\t48.49\\t48.73\\t47.11\\t47.08\\t46.87\\t33.18\\t36.53\\t33.92
DelucionQA\\t39.40\\t28.12\\t34.60\\t44.18\\t45.43\\t44.05\\t43.05\\t43.24\\t43.36\\t37.29\\t36.16\\t36.32
TechQA\\t39.38\\t29.27\\t31.68\\t28.98\\t28.49\\t27.96\\t28.98\\t28.49\\t27.96\\t16.92\\t16.76\\t14.51
ConditionalQA\\t23.14\\t23.61\\t22.15\\t19.81\\t22.01\\t17.32\\t18.23\\t19.83\\t19.14\\t14.56\\t15.41\\t15.25
Qasper\\t8.22\\t8.58\\t8.36\\t9.67\\t8.83\\t8.75\\t8.66\\t8.16\\t8.50\\t6.99\\t6.78\\t6.52
Table 9:F1 scores for all 
𝑘
 values for Evidence Retrieval (
%
), from dunzhang/stella
_
en
_
1.5B
_
v5.
Metric\\tF1@1\\tF1@3\\tF1@5\\tF1@10
Chunker\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering
ExpertQA\\t40.34\\t33.39\\t38.31\\t44.60\\t43.71\\t44.36\\t42.25\\t41.46\\t43.03\\t29.54\\t31.89\\t29.28
DelucionQA\\t33.88\\t27.02\\t32.73\\t42.10\\t43.58\\t40.79\\t40.85\\t40.89\\t41.22\\t37.29\\t36.16\\t35.99
TechQA\\t34.90\\t28.25\\t29.57\\t23.09\\t23.92\\t22.24\\t19.82\\t20.90\\t19.27\\t13.00\\t13.25\\t12.92
ConditionalQA\\t20.09\\t20.09\\t19.40\\t18.24\\t16.93\\t14.27\\t14.83\\t13.89\\t10.73\\t10.72\\t9.24\\t6.39
Qasper\\t7.80\\t6.20\\t5.34\\t6.88\\t6.83\\t6.76\\t6.59\\t6.43\\t5.70\\t4.99\\t4.71\\t4.34
Table 10:F1 scores for all 
𝑘
 values for Evidence Retrieval (
%
), from BAAI/bge-large-en-v1.5.
Metric\\tF1@1\\tF1@3\\tF1@5\\tF1@10
Chunker\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering\\tFixed-size\\tBreakpoint\\tClustering
ExpertQA\\t40.96\\t32.75\\t38.83\\t42.76\\t43.39\\t43.38\\t41.78\\t41.56\\t42.07\\t31.82\\t29.64\\t31.37
DelucionQA\\t38.02\\t32.22\\t31.67\\t39.78\\t42.22\\t39.68\\t41.31\\t35.34\\t41.04\\t35.94\\t27.77\\t36.11
TechQA\\t31.04\\t23.30\\t27.24\\t24.62\\t23.41\\t24.60\\t19.42\\t21.24\\t19.56\\t16.56\\t14.07\\t12.21
ConditionalQA\\t18.01\\t20.87\\t17.73\\t14.73\\t18.65\\t14.24\\t11.67\\t16.09\\t11.05\\t7.25\\t12.95\\t7.11
Qasper\\t8.09\\t6.92\\t6.98\\t6.97\\t6.23\\t6.67\\t6.56\\t5.98\\t6.24\\t4.23\\t4.12\\t3.62
Table 11:F1 scores for all 
𝑘
 values for Evidence Retrieval (
%
), from all-mpnet-base-v2.
Figure 2:Performance vs. hyperparameter values for Clustering-based Semantic Chunker (Single-linkage). Left: Document Retrieval; Right: Evidence Retrieval. The x-axis shows n
_
clusters, and the y-axis shows the metric value. Each subplot’s y-label indicates the fixed hyperparameter value, with 
𝜆
 increasing from top to bottom.
Figure 3:Performance vs. hyperparameter values for Clustering-based Semantic Chunker (DBSCAN). Left: Document Retrieval; Right: Evidence Retrieval. The x-axis shows eps, and the y-axis shows the metric value. Each subplot’s y-label indicates the fixed hyperparameter value, with 
𝜆
 increasing from top to bottom.
Figure 4:Performance vs. hyperparameter values for Breakpoint-based Semantic Chunker. Left: Document Retrieval; Right: Evidence Retrieval. The x-axis shows n
_
clusters, and the y-axis shows the metric value. Each subplot’s y-label indicates the breakpoint threshold type.
Figure 5:Performance vs. hyperparameter values for Fixed-size Chunker. Left: Document Retrieval; Right: Evidence Retrieval. The x-axis shows n
_
chunks, and the y-axis shows the metric value. Each subplot’s y-label indicates the fixed hyperparameter value, with n_sents_overlap increasing from top to bottom.
Figure 6:Example of chunking a stitched document using different chunkers. Each line shows a sentence and its original index in the document. Bold red lines indicate errors where a sentence is incorrectly assigned to a chunk. The configuration listed next to each chunker name represents the optimal setup for minimizing errors.
Figure 7:Example of chunking a normal document using different chunkers. Each line shows a sentence and its original index in the document. Bold red lines indicate errors where a sentence is incorrectly assigned to a chunk. The configuration listed next to each chunker name represents the optimal setup for minimizing errors.
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