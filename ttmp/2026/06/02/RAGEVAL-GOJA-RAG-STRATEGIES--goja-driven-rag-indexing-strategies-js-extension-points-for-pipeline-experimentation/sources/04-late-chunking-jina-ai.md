---
title: "Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models"
source: "https://arxiv.org/html/2409.04701v2"
extracted: "2026-06-02"
type: source
---

<article> <p> Michael Günther <sup>1</sup>, Isabelle Mohr <sup>1</sup>, Daniel James Williams 
<sup>2</sup>, Bo Wang <sup>1</sup>, Han Xiao <sup>1</sup> <br> <br> <sup>1</sup> Jina AI GmbH, 
Prinzessinnenstr. 19-20, 10969 Berlin, Germany research@jina.ai <sup>2</sup> Weaviate B.V., 
Prinsengracht 769a, 1017JZ Amsterdam danny@weaviate.io </p> <H6>Abstract</H6> <p>Many use cases 
require retrieving smaller portions of text, and dense vector-based retrieval systems often perform 
better with shorter text segments, as the semantics are less likely to be “over-compressed” in 
the embeddings. Consequently, practitioners often split text documents into smaller chunks and 
encode them separately. However, chunk embeddings created in this way can lose contextual 
information from surrounding chunks, resulting in sub-optimal representations. In this paper, we 
introduce a novel method called “late chunking”, which leverages long context embedding models 
to first embed all tokens of the long text, with chunking applied after the transformer model and 
just before mean pooling - hence the term “late” in its naming. The resulting chunk embeddings 
capture the full contextual information, leading to superior results across various retrieval 
tasks. The method is generic enough to be applied to a wide range of long-context embedding models 
and works without additional training. To further increase the effectiveness of late chunking, we 
propose a dedicated fine-tuning approach for embedding models.</p> <section> <H2>1 
Introduction</H2> <p>Neural information retrieval (IR) relies on text embedding models <sup 
id="fnref:11"><a href="https://arxiv.org/html/2409.04701v2#fn:11">11</a></sup> that are primarily 
based on the transformer architecture <sup id="fnref:2"><a 
href="https://arxiv.org/html/2409.04701v2#fn:2">2</a></sup> and have been pre-trained using very 
large text corpora. These models capture important elements of texts’ semantics in the form of 
dense vectors whose spatial relations - particularly cosine distance - are good proxies for text 
similarity and relevancy. For many neural IR use cases like the well-known RAG (Retrieval Augmented 
Generation) approach <sup id="fnref:8"><a 
href="https://arxiv.org/html/2409.04701v2#fn:8">8</a></sup>, applications require splitting 
documents into limited-size text chunks, and storing them and their vector embeddings in a 
database. At run-time, neural IR techniques are used to retrieve chunks of text relevant to a 
user’s requests, which are, in the case of RAG, presented to an LLM as a basis for synthesizing a 
response.</p> <figure><img alt="Refer to caption" height="289" src="https://arxiv.org/html/x1.png" 
width="435"> <figcaption>Figure 1: An illustration of the lost context problem. A Wikipedia article 
about Berlin is split into chunks. One can see that phrases like “its” and “the city” 
reference “Berlin,” which is mentioned only in the first sentence. This makes it harder for the 
embedding model to link these references to the correct entity, thereby producing a lower-quality 
vector representation.</figcaption></figure> <p>However, long-distance semantic dependencies – 
when the relevant information to interpret one chunk of text is located in one or more other chunks 
– reduce the effectiveness of this search strategy. Figure 1 displays a Wikipedia article 
<sup>1</sup> that is split into chunks of sentences. One can see that phrases like “its” and 
“the city” referencing “Berlin” which is mentioned only in the first sentence, e.g., it is 
harder for the embedding model to link it to the respective entity to produce a high-quality 
representation.</p> <p>To overcome this limitation, we introduce a novel technique called <em>late 
chunking</em>. This method leverages the long text embedding capabilities of recently published 
open source models <sup id="fnref:3"><a href="https://arxiv.org/html/2409.04701v2#fn:3">3</a></sup> 
<sup id="fnref:9"><a href="https://arxiv.org/html/2409.04701v2#fn:9">9</a></sup> to, first, encode 
all tokens of an entire document with their full in-document context into a sequence of token 
embeddings, and then break this sequence up into chunks, which receive embeddings via mean pooling 
of their token embeddings. This way, chunk embeddings include relevant semantic information derived 
from their place in the whole text.</p> <figure> <figcaption>Table 1: Comparing the embedding of 
the term “Berlin” to various sentences from the article about Berlin using cosine similarity. 
The column “Sim. naive” shows the similarity values between the query embedding of “Berlin” 
and the embeddings using naive chunking, while “Sim. late” represents the results with the late 
chunking method.</figcaption> <table> <thead> <tr> <th> Text </th> <th>Sim. Naive</th> <th>Sim. 
Late</th> </tr> </thead> <tbody> <tr> <td> Berlin is the capital and largest city of Germany, both 
by area and by population. </td> <td>0.8486</td> <td>0.8495</td> </tr> <tr> <td> Its more than 3.85 
million inhabitants make it the European Union’s most populous city, as measured by population 
within city limits. </td> <td>0.7084</td> <td>0.8249</td> </tr> <tr> <td> The city is also one of 
the states of Germany, and is the third smallest state in the country in terms of area. </td> <td 
rowspan="2">0.7535</td> <td rowspan="2">0.8498</td> </tr> </tbody> </table> </figure> <p>As an 
example of how late chunking works, we encode the texts in Figure 1 with a long-context embedding 
model, jina-embeddings-v2-small, using both naive and late chunking methods. We then calculate the 
similarity of the resulting embeddings to the embedding of the word “Berlin”. Table 1 shows 
that, with naive chunking, texts that do not contain the word “Berlin” have low similarity 
scores, even though both sentences, in context, refer to the city of Berlin. With late chunking, 
you can see that the similarity scores are much higher. The late chunking strategy has encoded 
“Berlin” into the embeddings of “Its” and “the city” because it sees them in their 
context before chunking the text.</p> <div> <p>Late chunking is an architectural change that can be 
implemented in any long-context text embedding model that uses mean pooling with any chunking 
technique and does not require additional model training. It leads to superior results compared to 
naive chunking across a wide range of retrieval benchmarks. To demonstrate the replicability of our 
results, we are publishing the code via GitHub <sup>2</sup>. In particular, we make the following 
contributions:</p> <ul> <li> <p>Late Chunking: We describe our novel late chunking technique in 
Section 3 and demonstrate that it leads to superior results compared to naive chunking across a 
wide range of retrieval benchmarks.</p> </li> <li> <p>Extended Algorithm for Long Documents: For 
encoding long documents with more tokens than long-context embedding models can handle, we propose 
a long late chunking approach (see Section 3.1) and prove its effectiveness in Section 4.3.</p> 
</li> <li> <p>Training for Late Chunking: While late chunking does not require additional training, 
we propose a novel training method to further enhance retrieval accuracy when using it (see Section 
3.2). We conduct an evaluation to show its advantage over comparable contrastive training in 
Section 4.4.</p> </li> <li> <p>Comprehensive Evaluation: We conduct a comprehensive empirical 
evaluation to identify scenarios where late chunking performs superior to naive chunking and 
scenarios where the standard method yields comparable or superior results (see Sections 4.1 and 
4.2).</p> </li> </ul> </div> </section> <H2>2 Related Work</H2> <p>Most modern text embedding 
models are trained on transformer-based architectures <sup id="fnref:2-2"><a 
href="https://arxiv.org/html/2409.04701v2#fn:2">2</a></sup> using the training method proposed by 
<sup id="fnref:11-2"><a href="https://arxiv.org/html/2409.04701v2#fn:11">11</a></sup>. In general, 
the model is equipped with a pooling operator which converts the token embeddings produced by the 
transformer into a single vector representation. Mean pooling is especially popular, as <sup 
id="fnref:11-3"><a href="https://arxiv.org/html/2409.04701v2#fn:11">11</a></sup> conduct 
experiments in which mean pooling shows the best performance among other methods. While the 
original transformer uses absolute positional encodings, methods that encode relative positions 
like AliBi <sup id="fnref:10"><a href="https://arxiv.org/html/2409.04701v2#fn:10">10</a></sup> and 
RoPE <sup id="fnref:14"><a href="https://arxiv.org/html/2409.04701v2#fn:14">14</a></sup> allow 
effective training of embedding models with larger context lengths <sup id="fnref:3-2"><a 
href="https://arxiv.org/html/2409.04701v2#fn:3">3</a></sup> <sup id="fnref:9-2"><a 
href="https://arxiv.org/html/2409.04701v2#fn:9">9</a></sup>.</p> <p>To address the limited context 
length and overcome practical issues of handling embeddings of long texts, chunking text before 
embedding it has become common practice. While simple chunking methods use a fixed token length 
<sup id="fnref:8-2"><a href="https://arxiv.org/html/2409.04701v2#fn:8">8</a></sup> or split text 
into units like sentences or paragraphs, more sophisticated methods like semantic chunking <sup 
id="fnref:6"><a href="https://arxiv.org/html/2409.04701v2#fn:6">6</a></sup> use the similarity of 
embedding vectors of neighboring sentences to find optimal spans for chunking.</p> <p>To prevent 
the problem of missing context information various approaches have been proposed that augment the 
text of the chunks. For instance, practitioners divide text into overlapping chunks <sup 
id="fnref:12"><a href="https://arxiv.org/html/2409.04701v2#fn:12">12</a></sup>, meaning that the 
end of one chunk shares some tokens with the beginning of the next chunk. During the development of 
this paper, a blog post <sup id="fnref:1"><a 
href="https://arxiv.org/html/2409.04701v2#fn:1">1</a></sup> introduced an alternative approach for 
producing contextualized chunk embeddings using an additional large language model (LLM). The LLM 
receives as input the whole document and the target chunk to produce text for augmenting the chunk 
text with relevant context information before passing it to the embedding model. This is however 
computationally more expensive, as LLMs are typically much larger than embedding models or even 
require paid access to LLM APIs.</p> <p>Another branch of research proposes embedding models that 
encode and index an embedding for each token. Models like ColBERT <sup id="fnref:7"><a 
href="https://arxiv.org/html/2409.04701v2#fn:7">7</a></sup> <sup id="fnref:4"><a 
href="https://arxiv.org/html/2409.04701v2#fn:4">4</a></sup> use a method called “late 
interaction”, which compares each token embedding of the query with each token embedding of the 
document and can compute more accurate relevance scores in this way. However, in contrast to our 
proposed late chunking method, this leads to more computational effort during the vector 
search.</p> <section> <H2>3 Method</H2> <figure><img alt="Refer to caption" height="420" 
src="https://arxiv.org/html/x2.png" width="747"> <figcaption>Figure 2: Overview of the naive 
chunking strategy (left) and the late chunking strategy (right). In late chunking, the transformer 
processes the entire text first, allowing chunk embeddings to capture context from the whole text, 
unlike the naive approach which first splits the text into sub-strings which are passed as 
independent units to the model.</figcaption></figure> <p><em>Late chunking</em> is a strategy for 
taking advantage of the difference in size between the long context input windows of recent 
embedding models and the relatively small size of optimal text chunks for most applications. These 
models support much longer input texts, for example, 8192 tokens for jina-embeddings-v2-small – 
roughly ten pages of standard text – while optimal chunk sizes are typically much smaller, e.g., 
the size of a paragraph. The reasons can be manifold, one being that LLMs get more inefficient when 
providing longer context, and a single short embedding vector only has a limited capacity to 
represent information.</p> <p>The naive chunking approach (left side in Figure 2) chunks texts 
before processing them, using sentences or paragraphs, and then applies an embedding model to the 
resulting chunks. Contrastively, late chunking, as described in Algorithm 1, first tokenizes the 
entire text, or the largest part of it possible (line 5), and applies the transformer part from the 
embedding model on it (line 6). This generates a sequence of vector representations <math 
data-latex="\\vartheta_{1},\\dots,\\vartheta_{m}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>ϑ</mi> 
<mn>1</mn></msub><mo>,</mo><mi mathvariant="normal">…</mi><mo>,</mo><msub><mi>ϑ</mi> 
<mi>m</mi></msub></mrow> <annotation-xml><list><apply><csymbol>subscript</csymbol> 
<ci>italic-ϑ</ci> <cn type="integer">1</cn></apply> <ci>…</ci> 
<apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> 
<ci>𝑚</ci></apply></list></annotation-xml> 
<annotation>\\vartheta_{1},\\dots,\\vartheta_{m}</annotation> <annotation>italic_ϑ 
start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, …, italic_ϑ start_POSTSUBSCRIPT italic_m 
end_POSTSUBSCRIPT</annotation></semantics></math> for each token that encompass textual information 
from the entire text. To generate a single embedding for a text, many embedding models apply mean 
pooling to these token representations to output a single vector. Late chunking instead applies 
mean pooling to smaller segments of this sequence of token vectors, producing embeddings for each 
chunk that take into account the entire text. It is important to highlight that late chunking still 
requires boundary cues that are derived from the chunks determined by a chunking algorithm, but 
these cues are used only <em>after</em> obtaining the token-level-embeddings - hence the term 
<em>late</em> in its naming. Chunking algorithms usually chunk text into sequences of characters. 
For late chunking, boundary cues corresponding to a sequence of tokens are necessary. Accordingly, 
Lines 9-17 of the algorithm translate the chunk definition into boundary cues that are used by the 
pooling step in the lines19-21.</p> <figure> <figcaption>Algorithm 1 Late Chunking</figcaption> 
<div> Inputs: Text <math data-latex="T" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>T</mi> 
<annotation-xml><ci>𝑇</ci></annotation-xml> <annotation>T</annotation> 
<annotation>italic_T</annotation></semantics></math>, Chunking Strategy <math data-latex="S" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>S</mi> 
<annotation-xml><ci>𝑆</ci></annotation-xml> <annotation>S</annotation> 
<annotation>italic_S</annotation></semantics></math> </div> <div> Outputs: Chunk Embeddings <math 
data-latex="e_{1},\\dots,e_{n}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>e</mi> 
<mn>1</mn></msub><mo>,</mo><mi mathvariant="normal">…</mi><mo>,</mo><msub><mi>e</mi> 
<mi>n</mi></msub></mrow> <annotation-xml><list><apply><csymbol>subscript</csymbol> <ci>𝑒</ci> 
<cn type="integer">1</cn></apply> <ci>…</ci> <apply><csymbol>subscript</csymbol> <ci>𝑒</ci> 
<ci>𝑛</ci></apply></list></annotation-xml> <annotation>e_{1},\\dots,e_{n}</annotation> 
<annotation>italic_e start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, …, italic_e start_POSTSUBSCRIPT 
italic_n end_POSTSUBSCRIPT</annotation></semantics></math> </div> <math 
data-latex="(c_{1},\\dots,c_{n})\\leftarrow\\mathrm{Chunker}(T,S)" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mrow><mo 
stretchy="false">(</mo><msub><mi>c</mi> <mn>1</mn></msub><mo>,</mo><mi 
mathvariant="normal">…</mi><mo>,</mo><msub><mi>c</mi> <mi>n</mi></msub><mo 
stretchy="false">)</mo></mrow> <mo stretchy="false">←</mo> <mrow><mi>Chunker</mi> <mo>⁢</mo> 
<mrow><mo stretchy="false">(</mo><mi>T</mi><mo>,</mo><mi>S</mi><mo 
stretchy="false">)</mo></mrow></mrow></mrow> <annotation-xml><apply><ci>←</ci> 
<vector><apply><csymbol>subscript</csymbol> <ci>𝑐</ci> <cn type="integer">1</cn></apply> 
<ci>…</ci> <apply><csymbol>subscript</csymbol> <ci>𝑐</ci> <ci>𝑛</ci></apply></vector> 
<apply><ci>Chunker</ci> <interval><ci>𝑇</ci> 
<ci>𝑆</ci></interval></apply></apply></annotation-xml> 
<annotation>(c_{1},\\dots,c_{n})\\leftarrow\\mathrm{Chunker}(T,S)</annotation> <annotation>( italic_c 
start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, …, italic_c start_POSTSUBSCRIPT italic_n 
end_POSTSUBSCRIPT ) ← roman_Chunker ( italic_T, italic_S )</annotation></semantics></math> <div> 
<math data-latex="(\\tau_{1},\\dots,\\tau_{m}),(o_{1},\\dots,o_{m})\\leftarrow\\mathrm{Tokenizer}(T)" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mrow><mrow><mo 
stretchy="false">(</mo><msub><mi>τ</mi> <mn>1</mn></msub><mo>,</mo><mi 
mathvariant="normal">…</mi><mo>,</mo><msub><mi>τ</mi> <mi>m</mi></msub><mo 
stretchy="false">)</mo></mrow><mo>,</mo><mrow><mo stretchy="false">(</mo><msub><mi>o</mi> 
<mn>1</mn></msub><mo>,</mo><mi mathvariant="normal">…</mi><mo>,</mo><msub><mi>o</mi> 
<mi>m</mi></msub><mo stretchy="false">)</mo></mrow></mrow> <mo stretchy="false">←</mo> 
<mrow><mi>Tokenizer</mi> <mo>⁢</mo> <mrow><mo stretchy="false">(</mo><mi>T</mi><mo 
stretchy="false">)</mo></mrow></mrow></mrow> <annotation-xml><apply><ci>←</ci> 
<list><vector><apply><csymbol>subscript</csymbol> <ci>𝜏</ci> <cn type="integer">1</cn></apply> 
<ci>…</ci> <apply><csymbol>subscript</csymbol> <ci>𝜏</ci> <ci>𝑚</ci></apply></vector> 
<vector><apply><csymbol>subscript</csymbol> <ci>𝑜</ci> <cn type="integer">1</cn></apply> 
<ci>…</ci> <apply><csymbol>subscript</csymbol> <ci>𝑜</ci> 
<ci>𝑚</ci></apply></vector></list> <apply><ci>Tokenizer</ci> 
<ci>𝑇</ci></apply></apply></annotation-xml> 
<annotation>(\\tau_{1},\\dots,\\tau_{m}),(o_{1},\\dots,o_{m})\\leftarrow\\mathrm{Tokenizer}(T)</annotation
> <annotation>( italic_τ start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, …, italic_τ 
start_POSTSUBSCRIPT italic_m end_POSTSUBSCRIPT ), ( italic_o start_POSTSUBSCRIPT 1 
end_POSTSUBSCRIPT, …, italic_o start_POSTSUBSCRIPT italic_m end_POSTSUBSCRIPT ) ← 
roman_Tokenizer ( italic_T )</annotation></semantics></math> <math data-latex="\\triangleright" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mo>▷</mo> 
<annotation-xml><ci>▷</ci></annotation-xml> <annotation>\\triangleright</annotation> 
<annotation>▷</annotation></semantics></math> <math data-latex="\\tau_{i}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><msub><mi>τ</mi> <mi>i</mi></msub> 
<annotation-xml><apply><csymbol>subscript</csymbol> <ci>𝜏</ci> 
<ci>𝑖</ci></apply></annotation-xml> <annotation>\\tau_{i}</annotation> <annotation>italic_τ 
start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT</annotation></semantics></math> is a token ID, <math 
data-latex="o_{i}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><msub><mi>o</mi> <mi>i</mi></msub> 
<annotation-xml><apply><csymbol>subscript</csymbol> <ci>𝑜</ci> 
<ci>𝑖</ci></apply></annotation-xml> <annotation>o_{i}</annotation> <annotation>italic_o 
start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT</annotation></semantics></math> its character length 
</div> <div> <math 
data-latex="(\\vartheta_{1},\\dots,\\vartheta_{m})\\leftarrow\\mathrm{Model}(\\tau_{1},\\dots,%
\\tau_{m})" display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mrow><mo 
stretchy="false">(</mo><msub><mi>ϑ</mi> <mn>1</mn></msub><mo>,</mo><mi 
mathvariant="normal">…</mi><mo>,</mo><msub><mi>ϑ</mi> <mi>m</mi></msub><mo 
stretchy="false">)</mo></mrow> <mo stretchy="false">←</mo> <mrow><mi>Model</mi> <mo>⁢</mo> 
<mrow><mo stretchy="false">(</mo><msub><mi>τ</mi> <mn>1</mn></msub><mo>,</mo><mi 
mathvariant="normal">…</mi><mo>,</mo><msub><mi>τ</mi> <mi>m</mi></msub><mo 
stretchy="false">)</mo></mrow></mrow></mrow> <annotation-xml><apply><ci>←</ci> 
<vector><apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> <cn type="integer">1</cn></apply> 
<ci>…</ci> <apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> <ci>𝑚</ci></apply></vector> 
<apply><ci>Model</ci> <vector><apply><csymbol>subscript</csymbol> <ci>𝜏</ci> <cn 
type="integer">1</cn></apply> <ci>…</ci> <apply><csymbol>subscript</csymbol> <ci>𝜏</ci> 
<ci>𝑚</ci></apply></vector></apply></apply></annotation-xml> 
<annotation>(\\vartheta_{1},\\dots,\\vartheta_{m})\\leftarrow\\mathrm{Model}(\\tau_{1},\\dots,% 
\\tau_{m})</annotation> <annotation>( italic_ϑ start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, …, 
italic_ϑ start_POSTSUBSCRIPT italic_m end_POSTSUBSCRIPT ) ← roman_Model ( italic_τ 
start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, …, italic_τ start_POSTSUBSCRIPT italic_m 
end_POSTSUBSCRIPT )</annotation></semantics></math> <math data-latex="\\triangleright" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mo>▷</mo> 
<annotation-xml><ci>▷</ci></annotation-xml> <annotation>\\triangleright</annotation> 
<annotation>▷</annotation></semantics></math> Calculate token embeddings <math 
data-latex="\\vartheta_{1},\\dots,\\vartheta_{m}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>ϑ</mi> 
<mn>1</mn></msub><mo>,</mo><mi mathvariant="normal">…</mi><mo>,</mo><msub><mi>ϑ</mi> 
<mi>m</mi></msub></mrow> <annotation-xml><list><apply><csymbol>subscript</csymbol> 
<ci>italic-ϑ</ci> <cn type="integer">1</cn></apply> <ci>…</ci> 
<apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> 
<ci>𝑚</ci></apply></list></annotation-xml> 
<annotation>\\vartheta_{1},\\dots,\\vartheta_{m}</annotation> <annotation>italic_ϑ 
start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, …, italic_ϑ start_POSTSUBSCRIPT italic_m 
end_POSTSUBSCRIPT</annotation></semantics></math> </div> <div> <math 
data-latex="o_{\\mathrm{chunk}}\\leftarrow 0" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>o</mi> <mi>chunk</mi></msub> 
<mo stretchy="false">←</mo> <mn>0</mn></mrow> <annotation-xml><apply><ci>←</ci> 
<apply><csymbol>subscript</csymbol> <ci>𝑜</ci> <ci>chunk</ci></apply> <cn 
type="integer">0</cn></apply></annotation-xml> <annotation>o_{\\mathrm{chunk}}\\leftarrow 
0</annotation> <annotation>italic_o start_POSTSUBSCRIPT roman_chunk end_POSTSUBSCRIPT ← 
0</annotation></semantics></math>, <math data-latex="j\\leftarrow 1" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>j</mi> <mo 
stretchy="false">←</mo> <mn>1</mn></mrow> <annotation-xml><apply><ci>←</ci> <ci>𝑗</ci> <cn 
type="integer">1</cn></apply></annotation-xml> <annotation>j\\leftarrow 1</annotation> 
<annotation>italic_j ← 1</annotation></semantics></math>, <math 
data-latex="\\mathit{cue}_{\\mathit{start}}\\leftarrow 1" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>𝑐𝑢𝑒</mi> 
<mi>𝑠𝑡𝑎𝑟𝑡</mi></msub> <mo stretchy="false">←</mo> <mn>1</mn></mrow> 
<annotation-xml><apply><ci>←</ci> <apply><csymbol>subscript</csymbol> <ci>𝑐𝑢𝑒</ci> 
<ci>𝑠𝑡𝑎𝑟𝑡</ci></apply> <cn type="integer">1</cn></apply></annotation-xml> 
<annotation>\\mathit{cue}_{\\mathit{start}}\\leftarrow 1</annotation> <annotation>italic_cue 
start_POSTSUBSCRIPT italic_start end_POSTSUBSCRIPT ← 1</annotation></semantics></math>, <math 
data-latex="\\mathit{cues}\\leftarrow[\\;]" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>𝑐𝑢𝑒𝑠</mi> <mo 
stretchy="false">←</mo> <mrow><mo rspace="0.280em" stretchy="false">[</mo><mo 
stretchy="false">]</mo></mrow></mrow> <annotation-xml><apply><ci>←</ci> 
<ci>𝑐𝑢𝑒𝑠</ci></apply></annotation-xml> 
<annotation>\\mathit{cues}\\leftarrow[\\;]</annotation> <annotation>italic_cues ← [ 
]</annotation></semantics></math> </div> <div> for <math data-latex="i\\in\\{1,\\dots,m\\}" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>i</mi> 
<mo>∈</mo> <mrow><mo stretchy="false">{</mo> <mn>1</mn><mo>,</mo><mi 
mathvariant="normal">…</mi><mo>,</mo><mi>m</mi> <mo stretchy="false">}</mo></mrow></mrow> 
<annotation-xml><apply><ci>𝑖</ci> <set><cn type="integer">1</cn> <ci>…</ci> 
<ci>𝑚</ci></set></apply></annotation-xml> <annotation>i\\in\\{1,\\dots,m\\}</annotation> 
<annotation>italic_i ∈ { 1, …, italic_m }</annotation></semantics></math> do <math 
data-latex="\\triangleright" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mo>▷</mo> 
<annotation-xml><ci>▷</ci></annotation-xml> <annotation>\\triangleright</annotation> 
<annotation>▷</annotation></semantics></math> For each token </div> <math 
data-latex="o_{\\mathrm{chunk}}\\leftarrow o_{\\mathrm{chunk}}+o_{i}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>o</mi> <mi>chunk</mi></msub> 
<mo stretchy="false">←</mo> <mrow><msub><mi>o</mi> <mi>chunk</mi></msub> <mo>+</mo> 
<msub><mi>o</mi> <mi>i</mi></msub></mrow></mrow> <annotation-xml><apply><ci>←</ci> 
<apply><csymbol>subscript</csymbol> <ci>𝑜</ci> <ci>chunk</ci></apply> 
<apply><apply><csymbol>subscript</csymbol> <ci>𝑜</ci> <ci>chunk</ci></apply> 
<apply><csymbol>subscript</csymbol> <ci>𝑜</ci> 
<ci>𝑖</ci></apply></apply></apply></annotation-xml> <annotation>o_{\\mathrm{chunk}}\\leftarrow 
o_{\\mathrm{chunk}}+o_{i}</annotation> <annotation>italic_o start_POSTSUBSCRIPT roman_chunk 
end_POSTSUBSCRIPT ← italic_o start_POSTSUBSCRIPT roman_chunk end_POSTSUBSCRIPT + italic_o 
start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT</annotation></semantics></math> <div> if <math 
data-latex="o_{\\mathrm{chunk}}\\geq|c_{j}|" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>o</mi> <mi>chunk</mi></msub> 
<mo>≥</mo> <mrow><mo stretchy="false">|</mo> <msub><mi>c</mi> <mi>j</mi></msub> <mo 
stretchy="false">|</mo></mrow></mrow> <annotation-xml><apply><apply><csymbol>subscript</csymbol> 
<ci>𝑜</ci> <ci>chunk</ci></apply> <apply><apply><csymbol>subscript</csymbol> <ci>𝑐</ci> 
<ci>𝑗</ci></apply></apply></apply></annotation-xml> 
<annotation>o_{\\mathrm{chunk}}\\geq|c_{j}|</annotation> <annotation>italic_o start_POSTSUBSCRIPT 
roman_chunk end_POSTSUBSCRIPT ≥ | italic_c start_POSTSUBSCRIPT italic_j end_POSTSUBSCRIPT 
|</annotation></semantics></math> then <math data-latex="\\triangleright" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mo>▷</mo> 
<annotation-xml><ci>▷</ci></annotation-xml> <annotation>\\triangleright</annotation> 
<annotation>▷</annotation></semantics></math> When the current chunk size is reached, save 
positions </div> <math data-latex="\\mathit{cue}_{\\mathit{end}}\\leftarrow i" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>𝑐𝑢𝑒</mi> 
<mi>𝑒𝑛𝑑</mi></msub> <mo stretchy="false">←</mo> <mi>i</mi></mrow> 
<annotation-xml><apply><ci>←</ci> <apply><csymbol>subscript</csymbol> <ci>𝑐𝑢𝑒</ci> 
<ci>𝑒𝑛𝑑</ci></apply> <ci>𝑖</ci></apply></annotation-xml> 
<annotation>\\mathit{cue}_{\\mathit{end}}\\leftarrow i</annotation> <annotation>italic_cue 
start_POSTSUBSCRIPT italic_end end_POSTSUBSCRIPT ← italic_i</annotation></semantics></math> <math 
data-latex="\\mathit{cues}\\leftarrow\\mathit{cues}\\oplus(\\mathit{cue}_{\\mathit{start}},%
\\mathit{cue}_{\\mathit{end}})" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>𝑐𝑢𝑒𝑠</mi> <mo 
stretchy="false">←</mo> <mrow><mi>𝑐𝑢𝑒𝑠</mi> <mo>⊕</mo> <mrow><mo 
stretchy="false">(</mo><msub><mi>𝑐𝑢𝑒</mi> 
<mi>𝑠𝑡𝑎𝑟𝑡</mi></msub><mo>,</mo><msub><mi>𝑐𝑢𝑒</mi> 
<mi>𝑒𝑛𝑑</mi></msub><mo stretchy="false">)</mo></mrow></mrow></mrow> 
<annotation-xml><apply><ci>←</ci> <ci>𝑐𝑢𝑒𝑠</ci> <apply><csymbol>direct-sum</csymbol> 
<ci>𝑐𝑢𝑒𝑠</ci> <interval><apply><csymbol>subscript</csymbol> <ci>𝑐𝑢𝑒</ci> 
<ci>𝑠𝑡𝑎𝑟𝑡</ci></apply> <apply><csymbol>subscript</csymbol> <ci>𝑐𝑢𝑒</ci> 
<ci>𝑒𝑛𝑑</ci></apply></interval></apply></apply></annotation-xml> 
<annotation>\\mathit{cues}\\leftarrow\\mathit{cues}\\oplus(\\mathit{cue}_{\\mathit{start}},% 
\\mathit{cue}_{\\mathit{end}})</annotation> <annotation>italic_cues ← italic_cues ⊕ ( italic_cue 
start_POSTSUBSCRIPT italic_start end_POSTSUBSCRIPT, italic_cue start_POSTSUBSCRIPT italic_end 
end_POSTSUBSCRIPT )</annotation></semantics></math> <div> <math data-latex="j\\leftarrow(j+1)" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>j</mi> <mo 
stretchy="false">←</mo> <mrow><mo stretchy="false">(</mo><mrow><mi>j</mi> <mo>+</mo> 
<mn>1</mn></mrow><mo stretchy="false">)</mo></mrow></mrow> <annotation-xml><apply><ci>←</ci> 
<ci>𝑗</ci> <apply><ci>𝑗</ci> <cn type="integer">1</cn></apply></apply></annotation-xml> 
<annotation>j\\leftarrow(j+1)</annotation> <annotation>italic_j ← ( italic_j + 1 
)</annotation></semantics></math>, <math data-latex="\\mathit{cue}_{\\mathit{start}}\\leftarrow(i+1)" 
display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>𝑐𝑢𝑒</mi> 
<mi>𝑠𝑡𝑎𝑟𝑡</mi></msub> <mo stretchy="false">←</mo> <mrow><mo 
stretchy="false">(</mo><mrow><mi>i</mi> <mo>+</mo> <mn>1</mn></mrow><mo 
stretchy="false">)</mo></mrow></mrow> <annotation-xml><apply><ci>←</ci> 
<apply><csymbol>subscript</csymbol> <ci>𝑐𝑢𝑒</ci> <ci>𝑠𝑡𝑎𝑟𝑡</ci></apply> 
<apply><ci>𝑖</ci> <cn type="integer">1</cn></apply></apply></annotation-xml> 
<annotation>\\mathit{cue}_{\\mathit{start}}\\leftarrow(i+1)</annotation> <annotation>italic_cue 
start_POSTSUBSCRIPT italic_start end_POSTSUBSCRIPT ← ( italic_i + 1 
)</annotation></semantics></math> </div> <math data-latex="o_{\\mathrm{chunk}}\\leftarrow 0" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>o</mi> 
<mi>chunk</mi></msub> <mo stretchy="false">←</mo> <mn>0</mn></mrow> 
<annotation-xml><apply><ci>←</ci> <apply><csymbol>subscript</csymbol> <ci>𝑜</ci> 
<ci>chunk</ci></apply> <cn type="integer">0</cn></apply></annotation-xml> 
<annotation>o_{\\mathrm{chunk}}\\leftarrow 0</annotation> <annotation>italic_o start_POSTSUBSCRIPT 
roman_chunk end_POSTSUBSCRIPT ← 0</annotation></semantics></math> <p> end if </p> <p> end for 
</p> <div> for <math 
data-latex="(\\mathit{cue}_{\\mathit{start}},\\mathit{cue}_{\\mathit{end}})_{i}\\in\\mathit{cues}" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mrow><mo 
stretchy="false">(</mo><msub><mi>𝑐𝑢𝑒</mi> 
<mi>𝑠𝑡𝑎𝑟𝑡</mi></msub><mo>,</mo><msub><mi>𝑐𝑢𝑒</mi> 
<mi>𝑒𝑛𝑑</mi></msub><mo stretchy="false">)</mo></mrow> <mi>i</mi></msub> <mo>∈</mo> 
<mi>𝑐𝑢𝑒𝑠</mi></mrow> <annotation-xml><apply><apply><csymbol>subscript</csymbol> 
<interval><apply><csymbol>subscript</csymbol> <ci>𝑐𝑢𝑒</ci> 
<ci>𝑠𝑡𝑎𝑟𝑡</ci></apply> <apply><csymbol>subscript</csymbol> <ci>𝑐𝑢𝑒</ci> 
<ci>𝑒𝑛𝑑</ci></apply></interval> <ci>𝑖</ci></apply> 
<ci>𝑐𝑢𝑒𝑠</ci></apply></annotation-xml> 
<annotation>(\\mathit{cue}_{\\mathit{start}},\\mathit{cue}_{\\mathit{end}})_{i}\\in\\mathit{cues}</annotat
ion> <annotation>( italic_cue start_POSTSUBSCRIPT italic_start end_POSTSUBSCRIPT, italic_cue 
start_POSTSUBSCRIPT italic_end end_POSTSUBSCRIPT ) start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT 
∈ italic_cues</annotation></semantics></math> do <math data-latex="\\triangleright" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mo>▷</mo> 
<annotation-xml><ci>▷</ci></annotation-xml> <annotation>\\triangleright</annotation> 
<annotation>▷</annotation></semantics></math> Pool token embeddings according to <math 
data-latex="\\mathit{cue}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>𝑐𝑢𝑒</mi> 
<annotation-xml><ci>𝑐𝑢𝑒</ci></annotation-xml> <annotation>\\mathit{cue}</annotation> 
<annotation>italic_cue</annotation></semantics></math> positions </div> <math 
data-latex="e_{i}\\leftarrow\\Big{(}\\sum_{j=\\mathit{cue}_{\\mathit{start}}}^{\\mathit{cue}_{%
\\mathit{end}}}\\vartheta_{j}\\Big{)}/((\\mathit{cue}_{\\mathit{end}}+1)-\\mathit{%
cue}_{\\mathit{start}})" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>e</mi> <mi>i</mi></msub> <mo 
stretchy="false">←</mo> <mrow><mrow><mo maxsize="160%" minsize="160%">(</mo><mrow><msubsup><mo 
lspace="0em">∑</mo> <mrow><mi>j</mi> <mo>=</mo> <msub><mi>𝑐𝑢𝑒</mi> 
<mi>𝑠𝑡𝑎𝑟𝑡</mi></msub></mrow> <msub><mi>𝑐𝑢𝑒</mi> 
<mi>𝑒𝑛𝑑</mi></msub></msubsup> <msub><mi>ϑ</mi> <mi>j</mi></msub></mrow><mo maxsize="160%" 
minsize="160%">)</mo></mrow> <mo>/</mo> <mrow><mo stretchy="false">(</mo><mrow><mrow><mo 
stretchy="false">(</mo><mrow><msub><mi>𝑐𝑢𝑒</mi> <mi>𝑒𝑛𝑑</mi></msub> <mo>+</mo> 
<mn>1</mn></mrow><mo stretchy="false">)</mo></mrow> <mo>−</mo> <msub><mi>𝑐𝑢𝑒</mi> 
<mi>𝑠𝑡𝑎𝑟𝑡</mi></msub></mrow><mo stretchy="false">)</mo></mrow></mrow></mrow> 
<annotation-xml><apply><ci>←</ci> <apply><csymbol>subscript</csymbol> <ci>𝑒</ci> 
<ci>𝑖</ci></apply> <apply><apply><apply><csymbol>superscript</csymbol> 
<apply><csymbol>subscript</csymbol> <apply><ci>𝑗</ci> <apply><csymbol>subscript</csymbol> 
<ci>𝑐𝑢𝑒</ci> <ci>𝑠𝑡𝑎𝑟𝑡</ci></apply></apply></apply> 
<apply><csymbol>subscript</csymbol> <ci>𝑐𝑢𝑒</ci> <ci>𝑒𝑛𝑑</ci></apply></apply> 
<apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> <ci>𝑗</ci></apply></apply> 
<apply><apply><apply><csymbol>subscript</csymbol> <ci>𝑐𝑢𝑒</ci> 
<ci>𝑒𝑛𝑑</ci></apply> <cn type="integer">1</cn></apply> <apply><csymbol>subscript</csymbol> 
<ci>𝑐𝑢𝑒</ci> 
<ci>𝑠𝑡𝑎𝑟𝑡</ci></apply></apply></apply></apply></annotation-xml> 
<annotation>e_{i}\\leftarrow\\Big{(}\\sum_{j=\\mathit{cue}_{\\mathit{start}}}^{\\mathit{cue}_{% 
\\mathit{end}}}\\vartheta_{j}\\Big{)}/((\\mathit{cue}_{\\mathit{end}}+1)-\\mathit{% 
cue}_{\\mathit{start}})</annotation> <annotation>italic_e start_POSTSUBSCRIPT italic_i 
end_POSTSUBSCRIPT ← ( ∑ start_POSTSUBSCRIPT italic_j = italic_cue start_POSTSUBSCRIPT 
italic_start end_POSTSUBSCRIPT end_POSTSUBSCRIPT start_POSTSUPERSCRIPT italic_cue 
start_POSTSUBSCRIPT italic_end end_POSTSUBSCRIPT end_POSTSUPERSCRIPT italic_ϑ start_POSTSUBSCRIPT 
italic_j end_POSTSUBSCRIPT ) / ( ( italic_cue start_POSTSUBSCRIPT italic_end end_POSTSUBSCRIPT + 1 
) - italic_cue start_POSTSUBSCRIPT italic_start end_POSTSUBSCRIPT )</annotation></semantics></math> 
<p> end for </p> </figure> <section> <H3>3.1 Long Late Chunking</H3> <figure> <figcaption>Algorithm 
2 Long Late Chunking</figcaption> <div> Inputs: Text <math data-latex="T" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>T</mi> 
<annotation-xml><ci>𝑇</ci></annotation-xml> <annotation>T</annotation> 
<annotation>italic_T</annotation></semantics></math>, Chunking Strategy <math data-latex="S" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>S</mi> 
<annotation-xml><ci>𝑆</ci></annotation-xml> <annotation>S</annotation> 
<annotation>italic_S</annotation></semantics></math>, Maximum Token Length <math 
data-latex="l_{\\mathit{max}}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><msub><mi>l</mi> <mi>𝑚𝑎𝑥</mi></msub> 
<annotation-xml><apply><csymbol>subscript</csymbol> <ci>𝑙</ci> 
<ci>𝑚𝑎𝑥</ci></apply></annotation-xml> <annotation>l_{\\mathit{max}}</annotation> 
<annotation>italic_l start_POSTSUBSCRIPT italic_max 
end_POSTSUBSCRIPT</annotation></semantics></math>, Overlap Length <math data-latex="\\omega" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>ω</mi> 
<annotation-xml><ci>𝜔</ci></annotation-xml> <annotation>\\omega</annotation> 
<annotation>italic_ω</annotation></semantics></math> </div> <div> Outputs: Chunk Embeddings <math 
data-latex="E=(e_{1},e_{2},\\dots,e_{n})" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>E</mi> <mo>=</mo> <mrow><mo 
stretchy="false">(</mo><msub><mi>e</mi> <mn>1</mn></msub><mo>,</mo><msub><mi>e</mi> 
<mn>2</mn></msub><mo>,</mo><mi mathvariant="normal">…</mi><mo>,</mo><msub><mi>e</mi> 
<mi>n</mi></msub><mo stretchy="false">)</mo></mrow></mrow> <annotation-xml><apply><ci>𝐸</ci> 
<vector><apply><csymbol>subscript</csymbol> <ci>𝑒</ci> <cn type="integer">1</cn></apply> 
<apply><csymbol>subscript</csymbol> <ci>𝑒</ci> <cn type="integer">2</cn></apply> <ci>…</ci> 
<apply><csymbol>subscript</csymbol> <ci>𝑒</ci> 
<ci>𝑛</ci></apply></vector></apply></annotation-xml> 
<annotation>E=(e_{1},e_{2},\\dots,e_{n})</annotation> <annotation>italic_E = ( italic_e 
start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, italic_e start_POSTSUBSCRIPT 2 end_POSTSUBSCRIPT, …, 
italic_e start_POSTSUBSCRIPT italic_n end_POSTSUBSCRIPT )</annotation></semantics></math> </div> 
<math data-latex="(c_{1},\\dots,c_{n})\\leftarrow\\mathrm{Chunker}(T,S)" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mrow><mo 
stretchy="false">(</mo><msub><mi>c</mi> <mn>1</mn></msub><mo>,</mo><mi 
mathvariant="normal">…</mi><mo>,</mo><msub><mi>c</mi> <mi>n</mi></msub><mo 
stretchy="false">)</mo></mrow> <mo stretchy="false">←</mo> <mrow><mi>Chunker</mi> <mo>⁢</mo> 
<mrow><mo stretchy="false">(</mo><mi>T</mi><mo>,</mo><mi>S</mi><mo 
stretchy="false">)</mo></mrow></mrow></mrow> <annotation-xml><apply><ci>←</ci> 
<vector><apply><csymbol>subscript</csymbol> <ci>𝑐</ci> <cn type="integer">1</cn></apply> 
<ci>…</ci> <apply><csymbol>subscript</csymbol> <ci>𝑐</ci> <ci>𝑛</ci></apply></vector> 
<apply><ci>Chunker</ci> <interval><ci>𝑇</ci> 
<ci>𝑆</ci></interval></apply></apply></annotation-xml> 
<annotation>(c_{1},\\dots,c_{n})\\leftarrow\\mathrm{Chunker}(T,S)</annotation> <annotation>( italic_c 
start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, …, italic_c start_POSTSUBSCRIPT italic_n 
end_POSTSUBSCRIPT ) ← roman_Chunker ( italic_T, italic_S )</annotation></semantics></math> <div> 
<math data-latex="(\\tau_{1},\\tau_{2},\\dots,\\tau_{m}),(o_{1},o_{2},\\dots,o_{m})\\leftarrow" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mrow><mrow><mo 
stretchy="false">(</mo><msub><mi>τ</mi> <mn>1</mn></msub><mo>,</mo><msub><mi>τ</mi> 
<mn>2</mn></msub><mo>,</mo><mi mathvariant="normal">…</mi><mo>,</mo><msub><mi>τ</mi> 
<mi>m</mi></msub><mo stretchy="false">)</mo></mrow><mo>,</mo><mrow><mo 
stretchy="false">(</mo><msub><mi>o</mi> <mn>1</mn></msub><mo>,</mo><msub><mi>o</mi> 
<mn>2</mn></msub><mo>,</mo><mi mathvariant="normal">…</mi><mo>,</mo><msub><mi>o</mi> 
<mi>m</mi></msub><mo stretchy="false">)</mo></mrow></mrow> <mo stretchy="false">←</mo></mrow> 
<annotation-xml><apply><ci>←</ci> <list><vector><apply><csymbol>subscript</csymbol> <ci>𝜏</ci> 
<cn type="integer">1</cn></apply> <apply><csymbol>subscript</csymbol> <ci>𝜏</ci> <cn 
type="integer">2</cn></apply> <ci>…</ci> <apply><csymbol>subscript</csymbol> <ci>𝜏</ci> 
<ci>𝑚</ci></apply></vector> <vector><apply><csymbol>subscript</csymbol> <ci>𝑜</ci> <cn 
type="integer">1</cn></apply> <apply><csymbol>subscript</csymbol> <ci>𝑜</ci> <cn 
type="integer">2</cn></apply> <ci>…</ci> <apply><csymbol>subscript</csymbol> <ci>𝑜</ci> 
<ci>𝑚</ci></apply></vector></list> <csymbol>absent</csymbol></apply></annotation-xml> 
<annotation>(\\tau_{1},\\tau_{2},\\dots,\\tau_{m}),(o_{1},o_{2},\\dots,o_{m})\\leftarrow</annotation> 
<annotation>( italic_τ start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, italic_τ start_POSTSUBSCRIPT 2 
end_POSTSUBSCRIPT, …, italic_τ start_POSTSUBSCRIPT italic_m end_POSTSUBSCRIPT ), ( italic_o 
start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, italic_o start_POSTSUBSCRIPT 2 end_POSTSUBSCRIPT, …, 
italic_o start_POSTSUBSCRIPT italic_m end_POSTSUBSCRIPT ) ←</annotation></semantics></math> 
Tokenizer(<math data-latex="T" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>T</mi> 
<annotation-xml><ci>𝑇</ci></annotation-xml> <annotation>T</annotation> 
<annotation>italic_T</annotation></semantics></math>) <math data-latex="\\triangleright" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mo>▷</mo> 
<annotation-xml><ci>▷</ci></annotation-xml> <annotation>\\triangleright</annotation> 
<annotation>▷</annotation></semantics></math> <math data-latex="\\tau_{i}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><msub><mi>τ</mi> <mi>i</mi></msub> 
<annotation-xml><apply><csymbol>subscript</csymbol> <ci>𝜏</ci> 
<ci>𝑖</ci></apply></annotation-xml> <annotation>\\tau_{i}</annotation> <annotation>italic_τ 
start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT</annotation></semantics></math> is a token ID, <math 
data-latex="o_{i}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><msub><mi>o</mi> <mi>i</mi></msub> 
<annotation-xml><apply><csymbol>subscript</csymbol> <ci>𝑜</ci> 
<ci>𝑖</ci></apply></annotation-xml> <annotation>o_{i}</annotation> <annotation>italic_o 
start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT</annotation></semantics></math> its character length 
</div> <div> if <math data-latex="m<l_{\\mathit{max}}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>m</mi> <mo>&lt;</mo> 
<msub><mi>l</mi> <mi>𝑚𝑎𝑥</mi></msub></mrow> <annotation-xml><apply><ci>𝑚</ci> 
<apply><csymbol>subscript</csymbol> <ci>𝑙</ci> 
<ci>𝑚𝑎𝑥</ci></apply></apply></annotation-xml> 
<annotation>m&lt;l_{\\mathit{max}}</annotation> <annotation>italic_m &lt; italic_l 
start_POSTSUBSCRIPT italic_max end_POSTSUBSCRIPT</annotation></semantics></math> then <math 
data-latex="\\triangleright" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mo>▷</mo> 
<annotation-xml><ci>▷</ci></annotation-xml> <annotation>\\triangleright</annotation> 
<annotation>▷</annotation></semantics></math> If the number of tokens is already small, do 
regular late chunking </div> <div> return LateChunking(<math data-latex="T" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>T</mi> 
<annotation-xml><ci>𝑇</ci></annotation-xml> <annotation>T</annotation> 
<annotation>italic_T</annotation></semantics></math>, <math data-latex="S" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>S</mi> 
<annotation-xml><ci>𝑆</ci></annotation-xml> <annotation>S</annotation> 
<annotation>italic_S</annotation></semantics></math>) </div> <p> end if </p> <div> <math 
data-latex="i_{\\textrm{end}}\\leftarrow l_{\\mathit{max}}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>i</mi> 
<mtext>end</mtext></msub> <mo stretchy="false">←</mo> <msub><mi>l</mi> 
<mi>𝑚𝑎𝑥</mi></msub></mrow> <annotation-xml><apply><ci>←</ci> 
<apply><csymbol>subscript</csymbol> <ci>𝑖</ci> <ci><mtext 
mathsize="70%">end</mtext></ci></apply> <apply><csymbol>subscript</csymbol> <ci>𝑙</ci> 
<ci>𝑚𝑎𝑥</ci></apply></apply></annotation-xml> <annotation>i_{\\textrm{end}}\\leftarrow 
l_{\\mathit{max}}</annotation> <annotation>italic_i start_POSTSUBSCRIPT end end_POSTSUBSCRIPT ← 
italic_l start_POSTSUBSCRIPT italic_max end_POSTSUBSCRIPT</annotation></semantics></math>,  <math 
data-latex="i_{\\textrm{start}}\\leftarrow 1" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>i</mi> 
<mtext>start</mtext></msub> <mo stretchy="false">←</mo> <mn>1</mn></mrow> 
<annotation-xml><apply><ci>←</ci> <apply><csymbol>subscript</csymbol> <ci>𝑖</ci> <ci><mtext 
mathsize="70%">start</mtext></ci></apply> <cn type="integer">1</cn></apply></annotation-xml> 
<annotation>i_{\\textrm{start}}\\leftarrow 1</annotation> <annotation>italic_i start_POSTSUBSCRIPT 
start end_POSTSUBSCRIPT ← 1</annotation></semantics></math>,   <math 
data-latex="\\textrm{embeddings}\\leftarrow[\\;]" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mtext>embeddings</mtext> <mo 
stretchy="false">←</mo> <mrow><mo rspace="0.280em" stretchy="false">[</mo><mo 
stretchy="false">]</mo></mrow></mrow> <annotation-xml><apply><ci>←</ci> 
<ci><mtext>embeddings</mtext></ci></apply></annotation-xml> 
<annotation>\\textrm{embeddings}\\leftarrow[\\;]</annotation> <annotation>embeddings ← [ 
]</annotation></semantics></math> </div> <div> while <math 
data-latex="i_{\\textrm{end}}<l_{\\mathit{max}}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>i</mi> 
<mtext>end</mtext></msub> <mo>&lt;</mo> <msub><mi>l</mi> <mi>𝑚𝑎𝑥</mi></msub></mrow> 
<annotation-xml><apply><apply><csymbol>subscript</csymbol> <ci>𝑖</ci> <ci><mtext 
mathsize="70%">end</mtext></ci></apply> <apply><csymbol>subscript</csymbol> <ci>𝑙</ci> 
<ci>𝑚𝑎𝑥</ci></apply></apply></annotation-xml> 
<annotation>i_{\\textrm{end}}&lt;l_{\\mathit{max}}</annotation> <annotation>italic_i 
start_POSTSUBSCRIPT end end_POSTSUBSCRIPT &lt; italic_l start_POSTSUBSCRIPT italic_max 
end_POSTSUBSCRIPT</annotation></semantics></math> do </div> <div> <math 
data-latex="(\\vartheta_{i_{\\mathrm{start}}},\\dots,\\vartheta_{i_{\\mathrm{end}}})\\leftarrow%
\\mathrm{Model}(\\tau_{i_{\\mathrm{start}}},\\dots,\\tau_{i_{\\mathrm{end}}})" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mrow><mo 
stretchy="false">(</mo><msub><mi>ϑ</mi> <msub><mi>i</mi> <mi>start</mi></msub></msub><mo>,</mo><mi 
mathvariant="normal">…</mi><mo>,</mo><msub><mi>ϑ</mi> <msub><mi>i</mi> 
<mi>end</mi></msub></msub><mo stretchy="false">)</mo></mrow> <mo stretchy="false">←</mo> 
<mrow><mi>Model</mi> <mo>⁢</mo> <mrow><mo stretchy="false">(</mo><msub><mi>τ</mi> 
<msub><mi>i</mi> <mi>start</mi></msub></msub><mo>,</mo><mi 
mathvariant="normal">…</mi><mo>,</mo><msub><mi>τ</mi> <msub><mi>i</mi> 
<mi>end</mi></msub></msub><mo stretchy="false">)</mo></mrow></mrow></mrow> 
<annotation-xml><apply><ci>←</ci> <vector><apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> 
<apply><csymbol>subscript</csymbol> <ci>𝑖</ci> <ci>start</ci></apply></apply> <ci>…</ci> 
<apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> <apply><csymbol>subscript</csymbol> 
<ci>𝑖</ci> <ci>end</ci></apply></apply></vector> <apply><ci>Model</ci> 
<vector><apply><csymbol>subscript</csymbol> <ci>𝜏</ci> <apply><csymbol>subscript</csymbol> 
<ci>𝑖</ci> <ci>start</ci></apply></apply> <ci>…</ci> <apply><csymbol>subscript</csymbol> 
<ci>𝜏</ci> <apply><csymbol>subscript</csymbol> <ci>𝑖</ci> 
<ci>end</ci></apply></apply></vector></apply></apply></annotation-xml> 
<annotation>(\\vartheta_{i_{\\mathrm{start}}},\\dots,\\vartheta_{i_{\\mathrm{end}}})\\leftarrow% 
\\mathrm{Model}(\\tau_{i_{\\mathrm{start}}},\\dots,\\tau_{i_{\\mathrm{end}}})</annotation> <annotation>( 
italic_ϑ start_POSTSUBSCRIPT italic_i start_POSTSUBSCRIPT roman_start end_POSTSUBSCRIPT 
end_POSTSUBSCRIPT, …, italic_ϑ start_POSTSUBSCRIPT italic_i start_POSTSUBSCRIPT roman_end 
end_POSTSUBSCRIPT end_POSTSUBSCRIPT ) ← roman_Model ( italic_τ start_POSTSUBSCRIPT italic_i 
start_POSTSUBSCRIPT roman_start end_POSTSUBSCRIPT end_POSTSUBSCRIPT, …, italic_τ 
start_POSTSUBSCRIPT italic_i start_POSTSUBSCRIPT roman_end end_POSTSUBSCRIPT end_POSTSUBSCRIPT 
)</annotation></semantics></math> <math data-latex="\\triangleright" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mo>▷</mo> 
<annotation-xml><ci>▷</ci></annotation-xml> <annotation>\\triangleright</annotation> 
<annotation>▷</annotation></semantics></math> Calculate token embeddings </div> <div> if <math 
data-latex="i_{\\mathrm{start}}=1" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>i</mi> <mi>start</mi></msub> 
<mo>=</mo> <mn>1</mn></mrow> <annotation-xml><apply><apply><csymbol>subscript</csymbol> 
<ci>𝑖</ci> <ci>start</ci></apply> <cn type="integer">1</cn></apply></annotation-xml> 
<annotation>i_{\\mathrm{start}}=1</annotation> <annotation>italic_i start_POSTSUBSCRIPT roman_start 
end_POSTSUBSCRIPT = 1</annotation></semantics></math> then </div> <math 
data-latex="\\textrm{embeddings}\\leftarrow\\textrm{embeddings}\\oplus(\\vartheta_{i_{\\mathrm{%
start}}},\\dots,\\vartheta_{i_{\\mathrm{end}}})" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mtext>embeddings</mtext> <mo 
stretchy="false">←</mo> <mrow><mtext>embeddings</mtext> <mo>⊕</mo> <mrow><mo 
stretchy="false">(</mo><msub><mi>ϑ</mi> <msub><mi>i</mi> <mi>start</mi></msub></msub><mo>,</mo><mi 
mathvariant="normal">…</mi><mo>,</mo><msub><mi>ϑ</mi> <msub><mi>i</mi> 
<mi>end</mi></msub></msub><mo stretchy="false">)</mo></mrow></mrow></mrow> 
<annotation-xml><apply><ci>←</ci> <ci><mtext>embeddings</mtext></ci> 
<apply><csymbol>direct-sum</csymbol> <ci><mtext>embeddings</mtext></ci> 
<vector><apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> <apply><csymbol>subscript</csymbol> 
<ci>𝑖</ci> <ci>start</ci></apply></apply> <ci>…</ci> <apply><csymbol>subscript</csymbol> 
<ci>italic-ϑ</ci> <apply><csymbol>subscript</csymbol> <ci>𝑖</ci> 
<ci>end</ci></apply></apply></vector></apply></apply></annotation-xml> 
<annotation>\\textrm{embeddings}\\leftarrow\\textrm{embeddings}\\oplus(\\vartheta_{i_{\\mathrm{% 
start}}},\\dots,\\vartheta_{i_{\\mathrm{end}}})</annotation> <annotation>embeddings ← embeddings ⊕ 
( italic_ϑ start_POSTSUBSCRIPT italic_i start_POSTSUBSCRIPT roman_start end_POSTSUBSCRIPT 
end_POSTSUBSCRIPT, …, italic_ϑ start_POSTSUBSCRIPT italic_i start_POSTSUBSCRIPT roman_end 
end_POSTSUBSCRIPT end_POSTSUBSCRIPT )</annotation></semantics></math> <p> else </p> <math 
data-latex="\\textrm{embeddings}\\leftarrow\\textrm{embeddings}\\oplus(\\vartheta_{i_{\\mathrm{%
start}}+\\omega},\\dots,\\vartheta_{i_{\\mathrm{end}}})" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mtext>embeddings</mtext> <mo 
stretchy="false">←</mo> <mrow><mtext>embeddings</mtext> <mo>⊕</mo> <mrow><mo 
stretchy="false">(</mo><msub><mi>ϑ</mi> <mrow><msub><mi>i</mi> <mi>start</mi></msub> <mo>+</mo> 
<mi>ω</mi></mrow></msub><mo>,</mo><mi mathvariant="normal">…</mi><mo>,</mo><msub><mi>ϑ</mi> 
<msub><mi>i</mi> <mi>end</mi></msub></msub><mo stretchy="false">)</mo></mrow></mrow></mrow> 
<annotation-xml><apply><ci>←</ci> <ci><mtext>embeddings</mtext></ci> 
<apply><csymbol>direct-sum</csymbol> <ci><mtext>embeddings</mtext></ci> 
<vector><apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> 
<apply><apply><csymbol>subscript</csymbol> <ci>𝑖</ci> <ci>start</ci></apply> 
<ci>𝜔</ci></apply></apply> <ci>…</ci> <apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> 
<apply><csymbol>subscript</csymbol> <ci>𝑖</ci> 
<ci>end</ci></apply></apply></vector></apply></apply></annotation-xml> 
<annotation>\\textrm{embeddings}\\leftarrow\\textrm{embeddings}\\oplus(\\vartheta_{i_{\\mathrm{% 
start}}+\\omega},\\dots,\\vartheta_{i_{\\mathrm{end}}})</annotation> <annotation>embeddings ← 
embeddings ⊕ ( italic_ϑ start_POSTSUBSCRIPT italic_i start_POSTSUBSCRIPT roman_start 
end_POSTSUBSCRIPT + italic_ω end_POSTSUBSCRIPT, …, italic_ϑ start_POSTSUBSCRIPT italic_i 
start_POSTSUBSCRIPT roman_end end_POSTSUBSCRIPT end_POSTSUBSCRIPT )</annotation></semantics></math> 
<p> end if </p> <div> <math data-latex="i_{\\textrm{start}}\\leftarrow i_{\\textrm{end}}+1" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>i</mi> 
<mtext>start</mtext></msub> <mo stretchy="false">←</mo> <mrow><msub><mi>i</mi> 
<mtext>end</mtext></msub> <mo>+</mo> <mn>1</mn></mrow></mrow> <annotation-xml><apply><ci>←</ci> 
<apply><csymbol>subscript</csymbol> <ci>𝑖</ci> <ci><mtext 
mathsize="70%">start</mtext></ci></apply> <apply><apply><csymbol>subscript</csymbol> <ci>𝑖</ci> 
<ci><mtext mathsize="70%">end</mtext></ci></apply> <cn 
type="integer">1</cn></apply></apply></annotation-xml> <annotation>i_{\\textrm{start}}\\leftarrow 
i_{\\textrm{end}}+1</annotation> <annotation>italic_i start_POSTSUBSCRIPT start end_POSTSUBSCRIPT 
← italic_i start_POSTSUBSCRIPT end end_POSTSUBSCRIPT + 1</annotation></semantics></math> <math 
data-latex="\\triangleright" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mo>▷</mo> 
<annotation-xml><ci>▷</ci></annotation-xml> <annotation>\\triangleright</annotation> 
<annotation>▷</annotation></semantics></math> Update token positions with overlap </div> <math 
data-latex="i_{\\textrm{end}}\\leftarrow\\min(i_{\\textrm{end}}+l_{\\mathit{max}}-\\omega,l_{%
\\mathit{max}})" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>i</mi> 
<mtext>end</mtext></msub> <mo stretchy="false">←</mo> <mrow><mi>min</mi> <mo>⁡</mo> <mrow><mo 
stretchy="false">(</mo><mrow><mrow><msub><mi>i</mi> <mtext>end</mtext></msub> <mo>+</mo> 
<msub><mi>l</mi> <mi>𝑚𝑎𝑥</mi></msub></mrow> <mo>−</mo> 
<mi>ω</mi></mrow><mo>,</mo><msub><mi>l</mi> <mi>𝑚𝑎𝑥</mi></msub><mo 
stretchy="false">)</mo></mrow></mrow></mrow> <annotation-xml><apply><ci>←</ci> 
<apply><csymbol>subscript</csymbol> <ci>𝑖</ci> <ci><mtext 
mathsize="70%">end</mtext></ci></apply> <apply><apply><apply><apply><csymbol>subscript</csymbol> 
<ci>𝑖</ci> <ci><mtext mathsize="70%">end</mtext></ci></apply> 
<apply><csymbol>subscript</csymbol> <ci>𝑙</ci> <ci>𝑚𝑎𝑥</ci></apply></apply> 
<ci>𝜔</ci></apply> <apply><csymbol>subscript</csymbol> <ci>𝑙</ci> 
<ci>𝑚𝑎𝑥</ci></apply></apply></apply></annotation-xml> 
<annotation>i_{\\textrm{end}}\\leftarrow\\min(i_{\\textrm{end}}+l_{\\mathit{max}}-\\omega,l_{% 
\\mathit{max}})</annotation> <annotation>italic_i start_POSTSUBSCRIPT end end_POSTSUBSCRIPT ← 
roman_min ( italic_i start_POSTSUBSCRIPT end end_POSTSUBSCRIPT + italic_l start_POSTSUBSCRIPT 
italic_max end_POSTSUBSCRIPT - italic_ω, italic_l start_POSTSUBSCRIPT italic_max end_POSTSUBSCRIPT 
)</annotation></semantics></math> <p> end while </p> <div> Carry out steps 7 to 21 of Algorithm 1 
with augmented token embeddings <math data-latex="\\vartheta_{1},\\dots,\\vartheta_{m}" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>ϑ</mi> 
<mn>1</mn></msub><mo>,</mo><mi mathvariant="normal">…</mi><mo>,</mo><msub><mi>ϑ</mi> 
<mi>m</mi></msub></mrow> <annotation-xml><list><apply><csymbol>subscript</csymbol> 
<ci>italic-ϑ</ci> <cn type="integer">1</cn></apply> <ci>…</ci> 
<apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> 
<ci>𝑚</ci></apply></list></annotation-xml> 
<annotation>\\vartheta_{1},\\dots,\\vartheta_{m}</annotation> <annotation>italic_ϑ 
start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, …, italic_ϑ start_POSTSUBSCRIPT italic_m 
end_POSTSUBSCRIPT</annotation></semantics></math>. </div> </figure> <p>Although many embedding 
models offer a high enough context length to encode a large amount of text at once, the context 
length might still not be sufficient to encode very large documents in one step. Moreover, the 
memory required for the encoding increases exponentially with an increasing number of tokens so 
that encoding all tokens at once becomes infeasible. To solve this problem, we propose using long 
late chunking as described in Algorithm 2. Thereby, the text is split into larger macro chunks of 
<math data-latex="l_{\\mathit{max}}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><msub><mi>l</mi> <mi>𝑚𝑎𝑥</mi></msub> 
<annotation-xml><apply><csymbol>subscript</csymbol> <ci>𝑙</ci> 
<ci>𝑚𝑎𝑥</ci></apply></annotation-xml> <annotation>l_{\\mathit{max}}</annotation> 
<annotation>italic_l start_POSTSUBSCRIPT italic_max 
end_POSTSUBSCRIPT</annotation></semantics></math> tokens that encompass multiple smaller chunks. 
Each macro chunk is processed separately by the <math data-latex="\\mathrm{LateChunking}" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>LateChunking</mi> 
<annotation-xml><ci>LateChunking</ci></annotation-xml> 
<annotation>\\mathrm{LateChunking}</annotation> 
<annotation>roman_LateChunking</annotation></semantics></math> method. To avoid missing context, 
macro chunks are augmented with a certain number of tokens <math data-latex="\\omega" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>ω</mi> 
<annotation-xml><ci>𝜔</ci></annotation-xml> <annotation>\\omega</annotation> 
<annotation>italic_ω</annotation></semantics></math> that overlap with the next chunks. Those 
additional tokens serve as supplementary context information during late chunking.</p> </section> 
<H3>3.2 Training Method</H3> <p>While late chunking works without further training, models that are 
trained with mean pooling to create a single embedding representation of a longer text might not be 
well-suited to encode chunks of token embeddings containing additional information from surrounding 
tokens. Therefore, we propose a modified text embedding training method, which uses a technique 
that we call “span pooling” to train the model to encode specifically the relevant information 
contained in an annotated text span into its token embeddings.</p> <H4>Training Data:</H4> <p>To 
conduct the training, we prepare training data which consist of tuples <math 
data-latex="(q,d,\\langle{}\\mathit{start},\\mathit{end}\\rangle{})" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mo 
stretchy="false">(</mo><mi>q</mi><mo>,</mo><mi>d</mi><mo>,</mo><mrow><mo stretchy="false">⟨</mo> 
<mi>𝑠𝑡𝑎𝑟𝑡</mi><mo>,</mo><mi>𝑒𝑛𝑑</mi> <mo 
stretchy="false">⟩</mo></mrow><mo stretchy="false">)</mo></mrow> 
<annotation-xml><vector><ci>𝑞</ci> <ci>𝑑</ci> <list><ci>𝑠𝑡𝑎𝑟𝑡</ci> 
<ci>𝑒𝑛𝑑</ci></list></vector></annotation-xml> 
<annotation>(q,d,\\langle{}\\mathit{start},\\mathit{end}\\rangle{})</annotation> <annotation>( 
italic_q, italic_d, ⟨ italic_start, italic_end ⟩ )</annotation></semantics></math> of two text 
values: a query <math data-latex="q" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>q</mi> 
<annotation-xml><ci>𝑞</ci></annotation-xml> <annotation>q</annotation> 
<annotation>italic_q</annotation></semantics></math> and a relevant document <math data-latex="d" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>d</mi> 
<annotation-xml><ci>𝑑</ci></annotation-xml> <annotation>d</annotation> 
<annotation>italic_d</annotation></semantics></math>, with additional annotation of the relevant 
span in the document <math data-latex="\\langle{}\\mathit{start},\\mathit{end}\\rangle{}" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mo 
stretchy="false">⟨</mo> <mi>𝑠𝑡𝑎𝑟𝑡</mi><mo>,</mo><mi>𝑒𝑛𝑑</mi> <mo 
stretchy="false">⟩</mo></mrow> <annotation-xml><list><ci>𝑠𝑡𝑎𝑟𝑡</ci> 
<ci>𝑒𝑛𝑑</ci></list></annotation-xml> 
<annotation>\\langle{}\\mathit{start},\\mathit{end}\\rangle{}</annotation> <annotation>⟨ 
italic_start, italic_end ⟩</annotation></semantics></math> that contains the answer.</p> 
<H4>Training Process:</H4> <p>The fine-tuning procedure itself follows the pair training stage 
described in <sup id="fnref:3-3"><a href="https://arxiv.org/html/2409.04701v2#fn:3">3</a></sup>, 
where the model is trained on text pairs using the InfoNCE <sup id="fnref:17"><a 
href="https://arxiv.org/html/2409.04701v2#fn:17">17</a></sup> loss which is defined on a batch 
<math data-latex="B=((x_{1},y_{1}),\\ldots,(x_{k},y_{k}))" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>B</mi> <mo>=</mo> <mrow><mo 
stretchy="false">(</mo><mrow><mo stretchy="false">(</mo><msub><mi>x</mi> 
<mn>1</mn></msub><mo>,</mo><msub><mi>y</mi> <mn>1</mn></msub><mo 
stretchy="false">)</mo></mrow><mo>,</mo><mi mathvariant="normal">…</mi><mo>,</mo><mrow><mo 
stretchy="false">(</mo><msub><mi>x</mi> <mi>k</mi></msub><mo>,</mo><msub><mi>y</mi> 
<mi>k</mi></msub><mo stretchy="false">)</mo></mrow><mo stretchy="false">)</mo></mrow></mrow> 
<annotation-xml><apply><ci>𝐵</ci> <vector><interval><apply><csymbol>subscript</csymbol> 
<ci>𝑥</ci> <cn type="integer">1</cn></apply> <apply><csymbol>subscript</csymbol> <ci>𝑦</ci> 
<cn type="integer">1</cn></apply></interval> <ci>…</ci> 
<interval><apply><csymbol>subscript</csymbol> <ci>𝑥</ci> <ci>𝑘</ci></apply> 
<apply><csymbol>subscript</csymbol> <ci>𝑦</ci> 
<ci>𝑘</ci></apply></interval></vector></apply></annotation-xml> 
<annotation>B=((x_{1},y_{1}),\\ldots,(x_{k},y_{k}))</annotation> <annotation>italic_B = ( ( italic_x 
start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT, italic_y start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT ), …, ( 
italic_x start_POSTSUBSCRIPT italic_k end_POSTSUBSCRIPT, italic_y start_POSTSUBSCRIPT italic_k 
end_POSTSUBSCRIPT ) )</annotation></semantics></math> of <math data-latex="k" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>k</mi> 
<annotation-xml><ci>𝑘</ci></annotation-xml> <annotation>k</annotation> 
<annotation>italic_k</annotation></semantics></math> pairs and the cosine similarity function <math 
data-latex="s" display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>s</mi> 
<annotation-xml><ci>𝑠</ci></annotation-xml> <annotation>s</annotation> 
<annotation>italic_s</annotation></semantics></math>:</p> <math 
data-latex="\\mathcal{L}_{\\mathrm{NCE}}(B):=-\\sum_{(x_{i},y_{i})\\in B}\\ln\\frac{e^{s(x_{i},y%
_{i})/\\tau}}{\\sum\\limits_{i^{\\prime}=1}^{k}e^{s(x_{i},y_{i^{\\prime}})/\\tau}}" display="block" 
xmlns="http://www.w3.org/1998/Math/MathML">\\mathcal{L}_{\\mathrm{NCE}}(B):=-\\sum_{(x_{i},y_{i})\\in 
B}\\ln\\frac{e^{s(x_{i},y% 
_{i})/\\tau}}{\\sum\\limits_{i^{\\prime}=1}^{k}e^{s(x_{i},y_{i^{\\prime}})/\\tau}}</math> <p>Here, the 
query vectors <math data-latex="x_{i}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><msub><mi>x</mi> <mi>i</mi></msub> 
<annotation-xml><apply><csymbol>subscript</csymbol> <ci>𝑥</ci> 
<ci>𝑖</ci></apply></annotation-xml> <annotation>x_{i}</annotation> <annotation>italic_x 
start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT</annotation></semantics></math> are obtained by 
applying the embedding model to the query text <math data-latex="q_{i}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><msub><mi>q</mi> <mi>i</mi></msub> 
<annotation-xml><apply><csymbol>subscript</csymbol> <ci>𝑞</ci> 
<ci>𝑖</ci></apply></annotation-xml> <annotation>q_{i}</annotation> <annotation>italic_q 
start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT</annotation></semantics></math> in the usual way. 
For the document embeddings <math data-latex="y_{i}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><msub><mi>y</mi> <mi>i</mi></msub> 
<annotation-xml><apply><csymbol>subscript</csymbol> <ci>𝑦</ci> 
<ci>𝑖</ci></apply></annotation-xml> <annotation>y_{i}</annotation> <annotation>italic_y 
start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT</annotation></semantics></math>, the set of token 
embeddings <math data-latex="\\vartheta_{i,1},\\ldots,\\vartheta_{i,n}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mi>ϑ</mi> 
<mrow><mi>i</mi><mo>,</mo><mn>1</mn></mrow></msub><mo>,</mo><mi 
mathvariant="normal">…</mi><mo>,</mo><msub><mi>ϑ</mi> 
<mrow><mi>i</mi><mo>,</mo><mi>n</mi></mrow></msub></mrow> 
<annotation-xml><list><apply><csymbol>subscript</csymbol> <ci>italic-ϑ</ci> <list><ci>𝑖</ci> 
<cn type="integer">1</cn></list></apply> <ci>…</ci> <apply><csymbol>subscript</csymbol> 
<ci>italic-ϑ</ci> <list><ci>𝑖</ci> <ci>𝑛</ci></list></apply></list></annotation-xml> 
<annotation>\\vartheta_{i,1},\\ldots,\\vartheta_{i,n}</annotation> <annotation>italic_ϑ 
start_POSTSUBSCRIPT italic_i, 1 end_POSTSUBSCRIPT, …, italic_ϑ start_POSTSUBSCRIPT italic_i, 
italic_n end_POSTSUBSCRIPT</annotation></semantics></math> is obtained by applying the model on the 
documents <math data-latex="d_{i}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><msub><mi>d</mi> <mi>i</mi></msub> 
<annotation-xml><apply><csymbol>subscript</csymbol> <ci>𝑑</ci> 
<ci>𝑖</ci></apply></annotation-xml> <annotation>d_{i}</annotation> <annotation>italic_d 
start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT</annotation></semantics></math>, and executing the 
mean pooling operation only to the token embeddings within the span <math 
data-latex="\\langle{}\\mathit{start},\\mathit{end}\\rangle{}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mo stretchy="false">⟨</mo> 
<mi>𝑠𝑡𝑎𝑟𝑡</mi><mo>,</mo><mi>𝑒𝑛𝑑</mi> <mo stretchy="false">⟩</mo></mrow> 
<annotation-xml><list><ci>𝑠𝑡𝑎𝑟𝑡</ci> <ci>𝑒𝑛𝑑</ci></list></annotation-xml> 
<annotation>\\langle{}\\mathit{start},\\mathit{end}\\rangle{}</annotation> <annotation>⟨ 
italic_start, italic_end ⟩</annotation></semantics></math>, hence the term “span 
pooling”.</p> <p>As proposed by <sup id="fnref:3-4"><a 
href="https://arxiv.org/html/2409.04701v2#fn:3">3</a></sup>, we use a bi-directional version of the 
loss <math data-latex="\\mathcal{L}_{\\mathrm{pairs}}" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><msub><mi>ℒ</mi> <mi>pairs</mi></msub> 
<annotation-xml><apply><csymbol>subscript</csymbol> <ci>ℒ</ci> 
<ci>pairs</ci></apply></annotation-xml> <annotation>\\mathcal{L}_{\\mathrm{pairs}}</annotation> 
<annotation>caligraphic_L start_POSTSUBSCRIPT roman_pairs 
end_POSTSUBSCRIPT</annotation></semantics></math>, where <math 
data-latex="B^{\\dagger}=((y_{1},x_{1}),\\ldots,(y_{k},x_{k}))" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msup><mi>B</mi> <mo>†</mo></msup> 
<mo>=</mo> <mrow><mo stretchy="false">(</mo><mrow><mo stretchy="false">(</mo><msub><mi>y</mi> 
<mn>1</mn></msub><mo>,</mo><msub><mi>x</mi> <mn>1</mn></msub><mo 
stretchy="false">)</mo></mrow><mo>,</mo><mi mathvariant="normal">…</mi><mo>,</mo><mrow><mo 
stretchy="false">(</mo><msub><mi>y</mi> <mi>k</mi></msub><mo>,</mo><msub><mi>x</mi> 
<mi>k</mi></msub><mo stretchy="false">)</mo></mrow><mo stretchy="false">)</mo></mrow></mrow> 
<annotation-xml><apply><apply><csymbol>superscript</csymbol> <ci>𝐵</ci> <ci>†</ci></apply> 
<vector><interval><apply><csymbol>subscript</csymbol> <ci>𝑦</ci> <cn 
type="integer">1</cn></apply> <apply><csymbol>subscript</csymbol> <ci>𝑥</ci> <cn 
type="integer">1</cn></apply></interval> <ci>…</ci> <interval><apply><csymbol>subscript</csymbol> 
<ci>𝑦</ci> <ci>𝑘</ci></apply> <apply><csymbol>subscript</csymbol> <ci>𝑥</ci> 
<ci>𝑘</ci></apply></interval></vector></apply></annotation-xml> 
<annotation>B^{\\dagger}=((y_{1},x_{1}),\\ldots,(y_{k},x_{k}))</annotation> <annotation>italic_B 
start_POSTSUPERSCRIPT † end_POSTSUPERSCRIPT = ( ( italic_y start_POSTSUBSCRIPT 1 
end_POSTSUBSCRIPT, italic_x start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT ), …, ( italic_y 
start_POSTSUBSCRIPT italic_k end_POSTSUBSCRIPT, italic_x start_POSTSUBSCRIPT italic_k 
end_POSTSUBSCRIPT ) )</annotation></semantics></math> is obtained from <math data-latex="B" 
display="inline" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>B</mi> 
<annotation-xml><ci>𝐵</ci></annotation-xml> <annotation>B</annotation> 
<annotation>italic_B</annotation></semantics></math> by swapping the order of pairs:</p> <math 
data-latex="\\mathcal{L}_{\\mathrm{pairs}}(B):=\\mathcal{L}_{\\mathrm{NCE}}(B)+\\mathcal{L}_{%
\\mathrm{NCE}}(B^{\\dagger})" display="block" 
xmlns="http://www.w3.org/1998/Math/MathML">\\mathcal{L}_{\\mathrm{pairs}}(B):=\\mathcal{L}_{\\mathrm{NCE
}}(B)+\\mathcal{L}_{% \\mathrm{NCE}}(B^{\\dagger})</math> <p>A description of the datasets, 
hyperparameters of the training and the evaluation results can be found in Section 4.4.</p> 
</section> <H2>4 Evaluation</H2> <p>First, we evaluate late chunking on a variety of models, 
chunking methods, and retrieval datasets to show its effectiveness in Section 4.1. Section 4.2 
investigate the influence of the chunking size and also identifies scenarios where late chunking 
works optimally, as well as limitations of the method. The long late chunking method is evaluated 
on datasets with long documents in Section 4.3. The proposed span pooling method for training is 
evaluated in Section 4.4. Finally, we also conduct a small-scale evaluation to compare late 
chunking to the LLM-based contextual embedding technique in Section 4.5.</p> <H3>4.1 Evaluation on 
Retrieval Tasks</H3> <p>To test the effectiveness of late chunking, we apply our technique to the 
smaller retrieval tasks of the BeIR benchmark <sup id="fnref:15"><a 
href="https://arxiv.org/html/2409.04701v2#fn:15">15</a></sup>. We restrict the evaluation on the 
smaller datasets, as splitting documents into smaller chunks increases the computational effort of 
the evaluation, which makes a comprehensive evaluation on different models, tasks, and chunking 
techniques infeasible.</p> <p>Those retrieval tasks consist of a query set, a corpus of text 
documents, and a QRels file that stores information about the IDs of documents that are relevant 
for each query. To identify the relevant documents of a query, one can chunk the documents, encode 
and store them into an embedding index, and determine for each query embedding the chunks 
corresponding to the k-nearest-neighbors (kNN) of their normalized vector representations. As each 
chunk corresponds to a document, one can convert the kNN ranking of chunks into a kNN ranking of 
documents (for documents occurring multiple times in the ranking, only the first occurrence is 
retained). After that, one can compare the resulting ranking with the ranking corresponding to the 
ground-truth QRels file and calculate retrieval metrics like nDCG@10.</p> <div> <p>We run this 
evaluation for the BeIR datasets with naive chunking, our novel late chunking method, and also 
report the score obtained without chunking. Both naive chunking and late chunking are evaluated 
with different chunking techniques, we use:</p> <ul> <li> <p>Fixed-Size Boundaries: Each chunk has 
the same number of tokens (256 in this experiment).</p> </li> <li> <p>Sentence Boundaries: Each 
chunk has the same number of sentences (5 in this experiment).</p> </li> <li> <p>Semantic Sentence 
Boundaries: Each chunk corresponds to multiple sentences. Sentences with high embedding similarity 
(we use jina-embeddings-v2-small-en) are combined in the same chunk. We use the semantic chunking 
implementation from llama-index <sup>3</sup> with the default parameters.</p> </li> </ul> <p>We 
evaluate three embedding models: jina-embeddings-v2-small <sup id="fnref:3-5"><a 
href="https://arxiv.org/html/2409.04701v2#fn:3">3</a></sup>, jina-embeddings-v3 <sup 
id="fnref:13"><a href="https://arxiv.org/html/2409.04701v2#fn:13">13</a></sup>, and 
nomic-embed-text-v1 <sup id="fnref:9-3"><a 
href="https://arxiv.org/html/2409.04701v2#fn:9">9</a></sup>.</p> </div> <section> <H4>Dealing with 
Non-Context Tokens:</H4> <p>Not all tokens correspond to characters in the original string. For 
instance, the tokenizers of all models add a [CLS] token at the beginning and append a [SEP] token 
at the end of the text. Additionally, jina-embeddings-v3 and nomic-embed-text-v1 prepend an 
instruction to the string for distinguishing queries and documents. During late chunking, we 
include all embeddings of prepended tokens in the mean pooling of the first chunk and all 
embeddings of appended tokens to the last chunk.</p> <p>We present the evaluation results in Table 
2. When comparing the results for the different chunking methods, we observe that replacing naive 
methods with their late chunking counterparts almost always yields better performance. Averaging 
results across three models and four datasets, we find a 3.63% relative improvement (1.9% absolute) 
from naive chunking with sentence boundaries to late chunking using sentence boundaries, a 3.46% 
improvement (1.8% absolute) from naive chunking to late chunking using fixed-size boundaries, and a 
2.70% improvement (1.5% absolute) from naive chunking to late chunking when using semantic sentence 
boundaries. These findings demonstrate that the late chunking technique effectively and 
consistently enhances overall performance.</p> <figure> <figcaption>Table 2: Evaluation of 
different chunking methods on retrieval tasks. Scores are reported as nDCG@10 [%] Models: 
jina-embeddings-v2-small (J2s), jina-embeddings-v3(J3), nomic-embed-text-v1 (Nom).</figcaption> 
<table> <tbody> <tr> <td rowspan="2"></td> <td colspan="3">SciFact</td> <td 
colspan="3">NFCorpus</td> <td colspan="3">FiQA</td> <td colspan="3">TRECCOVID</td> <td 
rowspan="2">AVG</td> </tr> <tr> <td>J2s</td> <td>J3</td> <td>Nom</td> <td>J2s</td> <td>J3</td> 
<td>Nom</td> <td>J2s</td> <td>J3</td> <td>Nom</td> <td>J2s</td> <td>J3</td> <td>Nom</td> </tr> <tr> 
<td colspan="14"> Fixed-Size Boundaries (256 Tokens per Chunk)</td> </tr> <tr> <td>Naive</td> 
<td>64.2</td> <td>71.8</td> <td>70.7</td> <td>23.5</td> <td>35.6</td> <td>35.3</td> <td>33.3</td> 
<td>46.3</td> <td>37.0</td> <td>63.4</td> <td>73.0</td> <td>72.9</td> <td>52.2</td> </tr> <tr> 
<td>Late</td> <td>66.1</td> <td>73.2</td> <td>70.6</td> <td>30.0</td> <td>36.7</td> <td>35.3</td> 
<td>33.8</td> <td>47.6</td> <td>38.3</td> <td>64.7</td> <td>77.2</td> <td>75.0</td> <td>54.0</td> 
</tr> <tr> <td colspan="14"> Sentence Boundaries (5 Sentences per Chunk)</td> </tr> <tr> 
<td>Naive</td> <td>64.7</td> <td>71.4</td> <td>71.3</td> <td>28.3</td> <td>35.8</td> <td>34.7</td> 
<td>30.4</td> <td>43.7</td> <td>35.1</td> <td>66.5</td> <td>72.4</td> <td>74.2</td> <td>52.4</td> 
</tr> <tr> <td>Late</td> <td>65.2</td> <td>73.2</td> <td>71.4</td> <td>30.0</td> <td>36.6</td> 
<td>35.5</td> <td>33.9</td> <td>48.0</td> <td>37.7</td> <td>66.6</td> <td>76.5</td> <td>76.8</td> 
<td>54.3</td> </tr> <tr> <td colspan="14">Semantic Sentence Boundaries</td> </tr> <tr> 
<td>Naive</td> <td>64.3</td> <td>71.2</td> <td>70.4</td> <td>27.4</td> <td>36.1</td> <td>35.3</td> 
<td>30.3</td> <td>44.0</td> <td>34.8</td> <td>66.2</td> <td>74.7</td> <td>74.3</td> <td>52.4</td> 
</tr> <tr> <td>Late</td> <td>65.0</td> <td>72.4</td> <td>70.5</td> <td>29.3</td> <td>36.6</td> 
<td>35.3</td> <td>33.7</td> <td>47.6</td> <td>36.9</td> <td>66.3</td> <td>76.2</td> <td>76.1</td> 
<td>53.8</td> </tr> </tbody> </table> </figure> </section> <section> <H3>4.2 Influence of the 
Chunking Size</H3> <figure><img alt="Refer to caption" height="257" 
src="https://arxiv.org/html/extracted/5896280/img/chunk_size_eval.png" width="598"> 
<figcaption>Figure 3: Retrieval Results with Different Chunk Sizes</figcaption></figure> <p>The 
following experiment investigates the influence of the chunk size on the performance of naive and 
late chunking. For this case, we mainly evaluate the model on retrieval tasks with long documents. 
While most retrieval tasks contain relatively short texts, we only select the NFCorpus dataset from 
BeIR (which contains comparable long text documents) and also use the datasets from the LongEmbed 
benchmark <sup id="fnref:18"><a href="https://arxiv.org/html/2409.04701v2#fn:18">18</a></sup>, 
which contains retrieval datasets constructed from reading comprehension benchmarks as well as 
synthetic datasets of long documents. As many documents are longer than 8192 tokens, we truncate 
the texts at 8192 tokens before the evaluation. We use the chunking method with fixed-size 
boundaries with different numbers of tokens and evaluate naive and late chunking with 
jina-embeddings-v2-small using the same retrieval evaluation method as described in Section 4.1. 
The results in Figure 3 show that late chunking performs better than naive chunking, specifically 
for small chunk sizes. For NFCorpus, late chunking performs consistently better, while for some of 
the reading comprehension tasks, naive chunking works better when using large chunks. This may be 
due to some of the reading comprehension datasets requiring finding a specific sentence or phrase 
embedded into a relatively unrelated textual context instead of finding a whole document. 
Specifically, the two synthetic datasets Needle-8192 and Passkey-8192 are constructed by placing 
short relevant information into a document of unrelated text. In this case, late chunking is not 
useful, as the additional context from the document is totally irrelevant.</p> </section> <section> 
<H3>4.3 Evaluation of Long Late Chunking</H3> <figure><img alt="Refer to caption" height="171" 
src="https://arxiv.org/html/extracted/5896280/img/macro_chunking.png" width="598"> 
<figcaption>Figure 4: Retrieval Results with Long Late Chunking for Different Chunk 
Sizes</figcaption></figure> <p>To evaluate long late chunking, we select three of the non-synthetic 
reading comprehension datasets, as none of the BeIR datasets contain a significant amount of text 
values with more than 8192 tokens. We use the same evaluation method as described in Section 4.2 
but do not truncate this time. Figure 4 shows that late chunking with the long late chunking method 
achieves superior results in comparison to naive chunking. Compared to the experiment of Section 
4.2, the nDCG scores are higher, as truncation in the last experiment could lead to information 
loss. Long late chunking solves this problem.</p> </section> <section> <H3>4.4 Evaluation of 
Training Method</H3> <figure> <figcaption>Table 3: Evaluation results (nDCG@10 [%]) on chunked 
evaluation tasks when training with span pooling and mean pooling, with a fixed chunk size of 64 
tokens and late chunking during inference.</figcaption> <table> <tbody> <tr> <th 
rowspan="2">Model</th> <th>Pooling (During</th> <th rowspan="2">Training Data</th> <th>Sci-</th> 
<th>Narrative-</th> <th>NF-</th> <th>TREC</th> <th>FiQA</th> </tr> <tr> <th>Training)</th> 
<th>Fact</th> <th>QA</th> <th>Corpus</th> <th>-COV</th> <td></td> </tr> <tr> <th 
rowspan="2">J3</th> <th rowspan="2">Span-Based</th> <th>TriviaQA&amp;FEVER</th> <td>72.61</td> 
<td>44.01</td> <td>36.80</td> <td>77.59</td> <td>48.22</td> </tr> <tr> <th>TriviaQA</th> 
<td>72.28</td> <td>44.94</td> <td>36.69</td> <td>77.39</td> <td>47.99</td> </tr> <tr> <th 
rowspan="2">J3</th> <th rowspan="2">Mean</th> <th>TriviaQA&amp;FEVER</th> <td>72.59</td> 
<td>43.83</td> <td>36.77</td> <td>77.21</td> <td>47.40</td> </tr> <tr> <th>TriviaQA</th> 
<td>72.56</td> <td>44.86</td> <td>36.78</td> <td>77.36</td> <td>47.35</td> </tr> <tr> <th 
rowspan="2">J2s</th> <th rowspan="2">Span-Based</th> <th>TriviaQA&amp;FEVER</th> <td>65.20</td> 
<td>47.29</td> <td>29.96</td> <td>65.18</td> <td>34.52</td> </tr> <tr> <th>TriviaQA</th> 
<td>65.43</td> <td>47.76</td> <td>30.04</td> <td>64.95</td> <td>34.29</td> </tr> <tr> <th 
rowspan="2">J2s</th> <th rowspan="2">Mean</th> <th>TriviaQA&amp;FEVER</th> <td>64.77</td> 
<td>47.31</td> <td>29.70</td> <td>64.73</td> <td>33.87</td> </tr> <tr> <th>TriviaQA</th> 
<td>65.18</td> <td>47.45</td> <td>29.76</td> <td>64.86</td> <td>33.82</td> </tr> </tbody> </table> 
</figure> <p>Table 3 captures the results from our training experiments. The experiments include 
running both span-based and regular mean pooling training methods on the jina-embeddings-v3 and 
jina-embeddings-v2-small-en long context embedding models in order to see whether the proposed 
training method achieves performance gains in combination with late chunking. To evaluate the 
models after the training we use the same procedure as in Section 4.1. For chunking, we used 
fixed-size boundaries (64 tokens). For the jina-embeddings-v3 model, we fine-tune only the 
retrieval adapters, following the same hyperparameter settings of <sup id="fnref:13-2"><a 
href="https://arxiv.org/html/2409.04701v2#fn:13">13</a></sup>, however with an increased batch size 
of 512 and training for only 500 steps. The hyperparameters for the fine-tuning of 
jina-embeddings-v2-small-en model are analogous to those detailed in <sup id="fnref:3-6"><a 
href="https://arxiv.org/html/2409.04701v2#fn:3">3</a></sup>.</p> <p>For the span-based training 
method, we prepare two datasets into the format described in Section 3.2 and make these publicly 
available on HuggingFace <sup>4</sup>. These two datasets are FEVER <sup id="fnref:16"><a 
href="https://arxiv.org/html/2409.04701v2#fn:16">16</a></sup> and TriviaQA <sup id="fnref:5"><a 
href="https://arxiv.org/html/2409.04701v2#fn:5">5</a></sup>, which are well-suited for this 
experiment as they contain annotations of where the relevant text can be found in the documents 
respectively. In the FEVER dataset, these spans take the shape of sentence number annotations, 
while for TriviaQA the annotations are usually a name, place, or date in the form of a short 
phrase. For FEVER, we only include pairs where the document provides supporting evidence for the 
claim. When multiple spans are annotated in these datasets, we select only the span, which occurs 
earliest in the document.</p> <p>Across the datasets and models, span pooling and mean pooling 
during training deliver relatively similar results, with span pooling consistently achieving a 
small improvement. The training dataset selection also has a small effect on the performance, thus 
resulting in slightly higher results for NarrativeQA when only training on TriviaQA, which is 
likely due to an overlap of domain and phrasing of query-document pairs of the task and training 
data.</p> <p>While the span pooling method for training shows promise, the training dataset 
diversity is quite limited, as both training datasets are sourced from Wikipedia documents. The 
summed dataset encompasses only <math data-latex="\\sim" display="inline" 
xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mo>∼</mo> 
<annotation-xml><csymbol>similar-to</csymbol></annotation-xml> <annotation>\\sim</annotation> 
<annotation>∼</annotation></semantics></math> 470k pairs in total for training, which may 
additionally limit the potential performance gains. It may be possible to achieve higher 
performance with a larger quantity and more diverse set of training data.</p> </section> <section> 
<H3>4.5 Comparison to Contextual Embedding</H3> <figure> <figcaption>Table 4: Cosine similarity 
scores using naive chunking, late chunking, and contextual embedding.</figcaption> <table> <thead> 
<tr> <th rowspan="2"> Chunk </th> <th>Similarity</th> <th>Similarity</th> <th>Similarity</th> </tr> 
<tr> <th>Late Chunking</th> <th>Contextual Embedding</th> <th>Naive Chunking</th> </tr> </thead> 
<tbody> <tr> <td> The recent SEC filing provided insights into ACME Corp’s performance for Q2 
2023. </td> <td>0.8305</td> <td>0.8069</td> <td>0.8505</td> </tr> <tr> <td> It highlighted a 3% 
revenue growth over the previous quarter. </td> <td>0.8516</td> <td>0.8590</td> <td>0.6343</td> 
</tr> <tr> <td> The company, which had a revenue of $314 million in the prior quarter, showed 
steady progress. </td> <td>0.8424</td> <td>0.8546</td> <td>0.6169</td> </tr> <tr> <td> They 
attributed this growth to strategic initiatives and operational efficiencies. </td> <td>0.7997</td> 
<td>0.8234</td> <td>0.5191</td> </tr> <tr> <td> The report emphasized the company’s resilience 
and ability to navigate market challenges, reflecting positively on their financial health and 
future prospects. </td> <td rowspan="4">0.8022</td> <td rowspan="4">0.8061</td> <td 
rowspan="4">0.6007</td> </tr> </tbody> </table> </figure> <p>We conduct a small-scale experiment to 
compare late chunking to the LLM-based contextual embedding approach published in a blog post by 
<sup id="fnref:1-2"><a href="https://arxiv.org/html/2409.04701v2#fn:1">1</a></sup> mentioned in the 
related work Section 2. Given the chunks obtained from a fictional financial document shown in 
Table 4 and the query “What is ACME Corp’s revenue growth for Q2 2023?”, the goal is to 
identify the relevant chunk. The relevant chunk in this example, “It highlighted a 3% revenue 
growth over the previous quarter.”, however, misses the company’s name, which is necessary to 
determine its relevancy. We implement the method described in the blog post that uses the 
claude-3-haiku-20240307 model to select relevant contextual information from the whole text and add 
it to the beginning of each text chunk. Then, we encode the query and the augmented chunks with 
jinaai/jina-embeddings-v2-small-en to calculate their cosine similarity. Table 4 captures the 
similarity values and compares them to those obtained from the chunks with late and naive chunking. 
One can see that both the contextual embedding method and late chunking produce the highest 
similarity value for the relevant chunk. In contrast, native chunking leads to a much smaller 
similarity score that is lower than the similarity to other chunks. Furthermore, one can see that 
contextual embedding and late chunking produce similarity scores that are close to each other 
across all chunks, with late chunking having the advantage that it does not require using an 
additional large language model.</p> </section> <H2>5 Conclusion</H2> <p>In this paper, we present 
a novel approach for encoding text chunks with embedding models called <em>late chunking</em>. We 
demonstrate how it can resolve context dependency problems and show that it improves text 
embeddings across a wide range of retrieval tasks. For handling situations in which the maximum 
context length of the model is not sufficient, we present a long late chunking approach to 
effectively solve this problem. Late chunking requires no additional training and is applicable to 
a wide range of embedding models. Furthermore, we demonstrate that additional training with a 
custom method can further enhance its performance on retrieval tasks.</p>

<H2>References</H2>

<div id="footnotes"><ol><li id="fn:1"><p> Anthropic. Introducing Contextual Retrieval, 2024. URL <a 
href="https://www.anthropic.com/news/contextual-retrieval" 
title="">https://www.anthropic.com/news/contextual-retrieval</a>. Accessed: 2024-09-29. 
</p></li><li id="fn:2"><p> Jacob Devlin, Ming-Wei Chang, Kenton Lee, and Kristina Toutanova. BERT: 
Pre-Training of Deep Bidirectional Transformers for Language Understanding. In Jill Burstein, 
Christy Doran, and Thamar Solorio (eds.), <em>Proceedings of the 2019 Conference of the North 
American Chapter of the Association for Computational Linguistics: Human Language Technologies, 
Volume 1 (Long and Short Papers)</em>, pp. 4171–4186, Minneapolis, Minnesota, June 2019. 
Association for Computational Linguistics. doi: 10.18653/v1/N19-1423. URL <a 
href="https://aclanthology.org/N19-1423" title="">https://aclanthology.org/N19-1423</a>. 
</p></li><li id="fn:3"><p> Michael Günther, Jackmin Ong, Isabelle Mohr, Alaeddine Abdessalem, 
Tanguy Abel, Mohammad Kalim Akram, Susana Guzman, Georgios Mastrapas, Saba Sturua, Bo Wang, et al. 
Jina Embeddings 2: 8192-Token General-Purpose Text Embeddings for Long Documents. <em>arXiv 
preprint arXiv:2310.19923</em>, 2023. URL <a href="http://arxiv.org/abs/2310.19923" 
title="">http://arxiv.org/abs/2310.19923</a>. </p></li><li id="fn:4"><p> Rohan Jha, Bo Wang, 
Michael Günther, Saba Sturua, Mohammad Kalim Akram, and Han Xiao. Jina-ColBERT-v2: A 
General-Purpose Multilingual Late Interaction Retriever. <em>arXiv preprint arXiv:2408.16672</em>, 
2024. URL <a href="http://arxiv.org/abs/2408.16672" title="">http://arxiv.org/abs/2408.16672</a>. 
</p></li><li id="fn:5"><p> Mandar Joshi, Eunsol Choi, Daniel S Weld, and Luke Zettlemoyer. 
TriviaQA: A Large Scale Distantly Supervised Challenge Dataset for Reading Comprehension. In 
<em>Proceedings of the 55th Annual Meeting of the Association for Computational Linguistics (Volume 
1: Long Papers)</em>, pp. 1601–1611, 2017. </p></li><li id="fn:6"><p> Greg Kamradt. 5 Levels of 
Text Splitting. <a 
href="https://github.com/FullStackRetrieval-com/RetrievalTutorials/blob/main/tutorials/LevelsOfTextS
plitting/5_Levels_Of_Text_Splitting.ipynb" 
title="">https://github.com/FullStackRetrieval-com/RetrievalTutorials/blob/main/tutorials/LevelsOfTe
xtSplitting/5_Levels_Of_Text_Splitting.ipynb</a>, 2024. Accessed: 2024-09-06. </p></li><li 
id="fn:7"><p> Omar Khattab and Matei Zaharia. ColBERT: Efficient and Effective Passage Search via 
Contextualized Late Interaction over BERT. In <em>Proceedings of the 43rd International ACM SIGIR 
conference on research and development in Information Retrieval</em>, pp. 39–48, 2020. 
</p></li><li id="fn:8"><p> Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir 
Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, et al. 
Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <em>Advances in Neural 
Information Processing Systems</em>, 33:9459–9474, 2020. </p></li><li id="fn:9"><p> Zach 
Nussbaum, John X Morris, Brandon Duderstadt, and Andriy Mulyar. Nomic Embed: Training a 
Reproducible Long Context Text Embedder. <em>arXiv preprint arXiv:2402.01613</em>, 2024. URL <a 
href="http://arxiv.org/abs/arXiv:2402.01613" title="">http://arxiv.org/abs/arXiv:2402.01613</a>. 
</p></li><li id="fn:10"><p> Ofir Press, Noah Smith, and Mike Lewis. Train Short, Test Long: 
Attention with Linear Biases Enables Input Length Extrapolation. In <em>International Conference on 
Learning Representations</em>, 2022. </p></li><li id="fn:11"><p> Nils Reimers and Iryna Gurevych. 
Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. In <em>Proceedings of the 2019 
Conference on Empirical Methods in Natural Language Processing and the 9th International Joint 
Conference on Natural Language Processing (EMNLP-IJCNLP)</em>, pp. 3982–3992, 2019. </p></li><li 
id="fn:12"><p> Krystian Safjan. From Fixed-Size to NLP Chunking - A Deep Dive into Text Chunking 
Techniques. <em>Krystian’s Safjan Blog</em>, 2023. </p></li><li id="fn:13"><p> Saba Sturua, 
Isabelle Mohr, Mohammad Kalim Akram, Michael Günther, Bo Wang, Markus Krimmel, Feng Wang, Georgios 
Mastrapas, Andreas Koukounas, Nan Wang, et al. jina-embeddings-v3: Multilingual Embeddings with 
Task LoRA. <em>arXiv preprint arXiv:2409.10173</em>, 2024. URL <a 
href="http://arxiv.org/abs/2409.10173" title="">http://arxiv.org/abs/2409.10173</a>. </p></li><li 
id="fn:14"><p> Jianlin Su, Murtadha Ahmed, Yu Lu, Shengfeng Pan, Wen Bo, and Yunfeng Liu. RoFormer: 
Enhanced Transformer with Rotary Position Embedding. <em>Neurocomputing</em>, 568:127063, 2024. 
</p></li><li id="fn:15"><p> Nandan Thakur, Nils Reimers, Andreas Rücklé, Abhishek Srivastava, and 
Iryna Gurevych. BEIR: A Heterogeneous Benchmark for Zero-Shot Evaluation of Information Retrieval 
Models. In <em>Thirty-fifth Conference on Neural Information Processing Systems Datasets and 
Benchmarks Track (Round 2)</em>, 2021. URL <a href="https://openreview.net/forum?id=wCu6T5xFjeJ" 
title="">https://openreview.net/forum?id=wCu6T5xFjeJ</a>. </p></li><li id="fn:16"><p> James Thorne, 
Andreas Vlachos, Christos Christodoulopoulos, and Arpit Mittal. FEVER: A Large-Scale Dataset for 
Fact Extraction and VERification. In <em>NAACL-HLT</em>, 2018. </p></li><li id="fn:17"><p> Aäron 
van den Oord, Yazhe Li, and Oriol Vinyals. Representation Learning with Contrastive Predictive 
Coding. <em>CoRR</em>, abs/1807.03748, 2018. URL <a href="http://arxiv.org/abs/1807.03748" 
title="">http://arxiv.org/abs/1807.03748</a>. </p></li><li id="fn:18"><p> Dawei Zhu, Liang Wang, 
Nan Yang, Yifan Song, Wenhao Wu, Furu Wei, and Sujian Li. LongEmbed: Extending Embedding Models for 
Long Context Retrieval. <em>arXiv preprint arXiv:2404.12096</em>, 2024. 
</p></li></ol></div></article>
