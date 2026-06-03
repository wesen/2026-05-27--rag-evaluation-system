---
title: "Essential Data Preprocessing for RAG - Unstructured"
source: "https://unstructured.io/blog/level-up-your-genai-apps-essential-data-preprocessing-for-any-rag-system"
extracted: "2026-06-02"
type: source
---

<main><H4>Authors</H4> <div><picture><img width="2048" height="2048" alt="Maria Khalusova" 
srcSet="https://cdn.sanity.io/images/d35hevy9/production/704991d902483e6321248ee5ca63e711b63eb6e3-13
38x1646.png?rect=0,154,1338,1338&w=600&h=600&max-h=3840&max-w=3840&q=85&auto=format 600w, 
https://cdn.sanity.io/images/d35hevy9/production/704991d902483e6321248ee5ca63e711b63eb6e3-1338x1646.
png?rect=0,154,1338,1338&w=1024&h=1024&max-h=3840&max-w=3840&q=85&auto=format 1024w, 
https://cdn.sanity.io/images/d35hevy9/production/704991d902483e6321248ee5ca63e711b63eb6e3-1338x1646.
png?rect=0,154,1338,1338&w=1440&h=1440&max-h=3840&max-w=3840&q=85&auto=format 1440w, 
https://cdn.sanity.io/images/d35hevy9/production/704991d902483e6321248ee5ca63e711b63eb6e3-1338x1646.
png?rect=0,154,1338,1338&w=2048&h=2048&max-h=3840&max-w=3840&q=85&auto=format 2048w" 
src="https://cdn.sanity.io/images/d35hevy9/production/704991d902483e6321248ee5ca63e711b63eb6e3-1338x
1646.png?rect=0,154,1338,1338&w=2048&h=2048&max-h=3840&max-w=3840&q=85&auto=format"></picture></div>
 <p>Maria Khalusova</p> <p>Unstructured</p> <div><p>Welcome to the third post in our series on 
advanced RAG techniques (here's the <a 
href="https://unstructured.io/blog/level-up-your-genai-apps-rag-beyond-the-basics">first post</a>, 
and the <a 
href="https://unstructured.io/blog/level-up-your-genai-apps-overview-of-advanced-rag-techniques">sec
ond post</a>). This time, we’re going back to the source, quite literally. </p><p>Before adding 
the more advanced layers of a RAG system, it's important to get the fundamentals of data 
preprocessing right. This stage is often undervalued, but it directly determines the quality and 
performance of the entire system. Unstructured is purpose-built to handle this stage intelligently, 
offering tools and patterns that make preprocessing not just manageable, but actually 
effective.</p><H3>Getting the Data Out of Silos: Ingestion</H3> <p>Ingestion is the first, and 
often most underestimated, step in building intelligent systems with enterprise data. It’s not 
just about collecting files or exporting data; it’s about reliably accessing, contextualizing, 
and standardizing fragmented knowledge from a chaotic ecosystem of siloed internal platforms. 
Ingestion is where data integrity, completeness, and usability are won or lost. If it fails, 
everything downstream, aka chunking, enrichment, embedding, retrieval, is compromised.</p><p>As you 
can likely imagine, enterprise data isn’t neatly packaged. It’s scattered across cloud storage 
buckets, collaboration tools, databases, SaaS applications, and more. Each source brings its own 
API quirks, content formats, permission models, and metadata conventions. Ingesting this data at 
scale requires much more than one-off scripts or generic pipelines. It requires a system that can 
handle the diversity of source systems, preserve context, reconcile formats, and keep everything up 
to date efficiently.</p><p>That’s why successful ingestion pipelines must meet five key 
requirements:</p><ol><li><p>Connectivity: Access content from wherever it lives, across both 
structured and unstructured platforms.</p></li><li><p>Context Preservation: Capture and retain 
critical metadata—authorship, timestamps, permissions, and system-specific 
signals.</p></li><li><p>Normalization: Convert varied content formats into a standardized 
representation for downstream processing.</p></li><li><p>Incremental Update Support: Detect changes 
and only ingest what’s new to keep systems fresh without ballooning 
costs.</p></li><li><p>Maintainability: Avoid brittle custom code that breaks with API changes or 
format drift.</p></li></ol><p>Unstructured is designed from the ground up to meet these needs. Its 
production-grade connectors cover the most common enterprise data systems, including cloud storage 
(S3, GCS, Azure), collaboration platforms (SharePoint, Confluence, Box), business apps (Salesforce, 
Jira), databases, and streaming systems like Kafka. These connectors go beyond simple file transfer 
by embedding logic for metadata extraction, and smart synchronization. They’re continuously 
maintained, and tested so your ingestion pipelines are robust, scalable, and you don’t have to 
experience this headache.</p><H3>Wrangling Your Data: Extraction and Partitioning</H3> <p>After 
ingestion, the next big step in preparing enterprise content for RAG pipelines is document 
partitioning and content extraction. This is yet another step where things often get messy. 
Enterprise data isn’t confined to a single content type or format. It lives across PDFs, docx 
files, PowerPoint decks, Excel spreadsheets, HTML pages, and so on. Each of these formats encodes 
content differently, and extracting clean, usable text from them is a deceptively hard 
problem.</p><p>Some open-source tools offer partial coverage: one might be good at extracting 
content from HTML pages, another at parsing Word documents or processing spreadsheets. But 
stitching them together into a cohesive pipeline means you, the developer, are now responsible for 
standardizing their outputs—each of which likely returns text in different schemas, with 
different assumptions about structure and granularity. For example, how do you reconcile a div tag 
from HTML with a paragraph tag from docx, or a row from a CSV with a cell block in an Excel file? 
Without a consistent representation, it’s difficult to apply uniform downstream logic for 
chunking, embedding, or filtering. You end up spending more time cleaning and reconciling than 
building.</p><p>Worse still, common extraction methods tend to flatten documents into a stream of 
plain text, stripping away visual layout, images, and positional cues. This loss of structure 
degrades both chunking and retrieval accuracy, especially for dense or formatted documents like 
manuals, reports, or spreadsheets.</p><p>Unstructured solves this by applying intelligent 
partitioning, which breaks down diverse documents into distinct elements such as Title, 
NarrativeText, ListItem, Table, Image, and more; each annotated with detailed metadata like layout 
coordinates, page numbers, source file type, and hierarchical structure. This preserves spatial and 
semantic context from the outset and provides a consistent, typed JSON schema across all content 
types. That means you can process a paragraph from a PowerPoint slide and a Jira ticket in exactly 
the same way without brittle custom glue code. Partitioning also captures rich media artifacts that 
are typically lost during extraction: images are preserved as base64-encoded metadata, unlocking 
multimodal use cases. Tables, meanwhile, are preserved not just as flat text but in their structure 
converted to plain HTML, maintaining row-column relationships that are critical for accurate 
interpretation.</p><p>Once partitioned, these structured elements become the building blocks for 
the next critical step: chunking. </p><H3>Breaking It Down: Chunking Strategies</H3> <p>Once the 
text is extracted, it needs to be divided into smaller segments, or "chunks." This is arguably one 
of the most critical preprocessing steps in RAG. While it may sound like a simple formatting step, 
chunking has profound implications for how well your AI system can retrieve and reason over 
data.</p><p>Chunking choices are vital for effective retrieval. Matching a specific piece of 
information within a smaller, focused chunk is generally more precise and efficient than matching 
with a massive document. Smaller chunks tend to have a better signal-to-noise ratio for retrieval. 
However, there's a fundamental trade-off:</p><ul><li><p>Smaller Chunks: Offer higher precision for 
retrieval, making it easier to pinpoint specific facts or matches. But they might lack sufficient 
context for the LLM to understand the information fully or generate a comprehensive 
answer.</p></li><li><p>Larger Chunks: Provide more context, potentially leading to better 
generation quality. But they can dilute the relevance signal for retrieval (making it harder to 
find the specific matching part) and might contain more irrelevant information (noise). They also 
consume more of the LLM's context window and increase processing costs. </p></li></ul><p>Finding 
the right balance is key and often requires experimentation and a good understanding of underlying 
data and common user queries.</p><p>Common chunking strategies (and their 
limits):</p><ol><li><div><strong>Fixed-Size Chunking</strong>. The most basic method: divide text 
into equally sized blocks (e.g., 500 characters) with optional overlap.<ul><li><p>Pros: Fast &amp; 
simple.</p></li><li><p>Cons: Ignores document structure and meaning—often splits mid-sentence, 
mid-paragraph, or even mid-word. This can lead to semantic fragmentation and noisy 
retrieval.</p></li></ul></div></li><li><div><strong>Recursive Character-Based Chunking</strong>. 
This method recursively splits text using a hierarchy of separators—first by paragraphs, then 
newlines, then spaces—to get under the character limit.<ul><li><p>Pros: Some structure awareness; 
better at preserving natural breakpoints than fixed-size.</p></li><li><p>Cons: Still primarily 
size-driven, not meaning-driven. Boundaries can be arbitrary, and important semantic groupings can 
still get lost.</p></li></ul></div></li><li><div><strong>Sentence-Based Chunking</strong>. Chunks 
are defined using sentence boundaries.<ul><li><p>Pros: Aligns well with natural language, enabling 
clearer reasoning for LLMs.</p></li><li><p>Cons: Sentence size varies wildly, and individual 
sentences often lack standalone context. </p></li></ul></div></li></ol><p><strong>Unstructured 
Smart Chunking Strategies</strong></p> <p>Because Unstructured generates rich document structure 
during partitioning, it enables structurally-aware and semantically coherent chunking strategies 
that align more naturally with how humans and LLMs interpret information. After partitioning, the 
document is already split into its logical segments - document elements, so instead of splitting a 
large blob of text as normal chunking would do, Unstructured can intelligently combine small 
related elements and only split large segments when needed, all while preserving the document’s 
intended structure:</p><ul><li><p><strong>Basic</strong>: Combines sequential elements into chunks 
while preserving logical boundaries (e.g., paragraph breaks, lists).</p></li><li><p><strong>By 
Title</strong>: Groups content under heading elements, preserving document hierarchy and 
section-level coherence.</p></li><li><p><strong>By Page</strong>: Treats each page as a 
self-contained unit, ideal for scanned documents or forms where layout 
matters.</p></li></ul><p>These strategies reduce semantic drift, improve chunk-level relevance, and 
eliminate the need for brittle post-processing logic. </p><H3>From Text to Vectors: Embedding 
Generation Fundamentals</H3> <p>The core idea enabling semantic search in most RAG systems is the 
conversion of text chunks into numerical representations called embeddings.</p><p>Embeddings are 
vectors (lists of numbers) in a high-dimensional space, generated by an embedding model (often a 
transformer-based bi-encoder model). These vectors are designed such that texts with similar 
meanings are located closer to each other in this vector space, while dissimilar texts are farther 
apart. This geometric relationship allows for mathematical comparison of semantic 
similarity.</p><p>Each cleaned and chunked piece of text is fed into the chosen embedding model, 
which outputs a corresponding vector embedding. It's crucial that the same embedding model is used 
to embed the source document chunks during indexing and to embed the user query at retrieval time; 
otherwise, the comparison will be meaningless.</p><p>Not all embedding models are created equal. We 
wrote a blog post called <a 
href="https://unstructured.io/blog/understanding-embedding-models-make-an-informed-choice-for-your-r
ag">Understanding embedding models: make an informed choice for your RAG</a> to help you navigate 
the existing models and open leaderboards.</p><p>In short, here are some considerations for 
choosing an embedding model:</p><ul><li><p>Model size and architecture: Larger models (e.g., 
OpenAI’s text-embedding-3-large) generally yield higher-quality vectors but come at higher 
latency and cost.</p></li><li><p>Training data domain: Models trained on general web data might 
underperform on specialized enterprise domains like law, finance, or biotech. Domain-tuned models 
might yield better results, and in some cases you may want to consider fine-tuning an embedding 
model.</p></li><li><p>Embedding dimension: Model outputs have varying dimensionality (e.g., 256 vs. 
1024 vs. 3072). Higher dimensions capture more nuance but increase storage and search 
costs.</p></li></ul><p>Unstructured integrates seamlessly with major embedding providers—OpenAI, 
Amazon Bedrock, TogetherAI, Voyage AI, and others—so you can easily plug in the model that best 
fits your use case, and experiment across providers without rearchitecting your 
pipeline.</p><H3>Making Data Searchable: Basic Indexing with Vector Stores</H3> <p>Once text chunks 
are converted into embeddings, they need to be stored in a way that allows for efficient searching 
based on semantic similarity. This is the role of the index, most commonly implemented using a 
vector database (also called a vector store).</p><p>A vector database enables similarity search, a 
process that compares a user query embedding against a collection of pre-computed document 
embeddings. The result is a ranked list of documents whose vector representations are most similar 
to the query vector, typically based on cosine similarity or Euclidean distance.</p><p>To handle 
potentially billions of vectors efficiently, vector databases don't usually compare the query 
vector to every single stored vector (which would be too slow). Instead, they employ Approximate 
Nearest Neighbor (ANN) search algorithms (like HNSW - Hierarchical Navigable Small World). ANN 
algorithms trade a small amount of accuracy for a massive gain in search speed, quickly finding 
vectors that are likely to be among the closest neighbors.</p><p>Many vector database options 
exist, both open-source and managed services. Examples include Pinecone, Weaviate, Qdrant, Milvus, 
Redis (with vector search capabilities), Elasticsearch/OpenSearch, etc. Unstructured connects 
directly to many of these, handling upload and indexing without manual effort. Whichever database 
you choose to be the destination for your processed documents, you can configure a destination 
connector in Unstructured for it, and the platform will handle uploading documents seamlessly. 
</p><H3>Conclusion</H3> <p>Solid preprocessing isn’t a nice-to-have. It’s the bedrock of an 
effective RAG system. Ingestion, extraction, chunking, embedding, and indexing must all be handled 
with care, precision, and scalability in mind. Unstructured helps you get this right from the 
beginning, giving your downstream applications the clean, contextualized, and actionable data they 
need to perform.</p><p>In our next post, we’ll go over some advanced data preprocessing 
techniques like contextual chunking, entity extraction, and LLM/VLM-powered enrichments. Stay 
tuned.</p></div></main>
