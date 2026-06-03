---
title: "Best Chunking Strategies for RAG - Firecrawl"
source: "https://www.firecrawl.dev/blog/best-chunking-strategies-rag"
extracted: "2026-06-02"
type: source
---

<article><p>Bex TuychievFeb 24, 2026 (updated)</p> <img alt="Best Chunking Strategies for RAG (and LLMs) in 2026 image" width="800" height="450" srcSet="/_next/image?url=%2Fimages%2Fblog%2Fbest-chunking-strategies-rag-2025%2Fbest-chunking-strategies-rag-2025.webp&w=640&q=75&dpl=dpl_4SA9tF2xCnVNcK8SKvWnc8pJZr6J 640w, /_next/image?url=%2Fimages%2Fblog%2Fbest-chunking-strategies-rag-2025%2Fbest-chunking-strategies-rag-2025.webp&w=750&q=75&dpl=dpl_4SA9tF2xCnVNcK8SKvWnc8pJZr6J 750w, /_next/image?url=%2Fimages%2Fblog%2Fbest-chunking-strategies-rag-2025%2Fbest-chunking-strategies-rag-2025.webp&w=828&q=75&dpl=dpl_4SA9tF2xCnVNcK8SKvWnc8pJZr6J 828w, /_next/image?url=%2Fimages%2Fblog%2Fbest-chunking-strategies-rag-2025%2Fbest-chunking-strategies-rag-2025.webp&w=1080&q=75&dpl=dpl_4SA9tF2xCnVNcK8SKvWnc8pJZr6J 1080w, /_next/image?url=%2Fimages%2Fblog%2Fbest-chunking-strategies-rag-2025%2Fbest-chunking-strategies-rag-2025.webp&w=1200&q=75&dpl=dpl_4SA9tF2xCnVNcK8SKvWnc8pJZr6J 1200w, /_next/image?url=%2Fimages%2Fblog%2Fbest-chunking-strategies-rag-2025%2Fbest-chunking-strategies-rag-2025.webp&w=1920&q=75&dpl=dpl_4SA9tF2xCnVNcK8SKvWnc8pJZr6J 1920w, /_next/image?url=%2Fimages%2Fblog%2Fbest-chunking-strategies-rag-2025%2Fbest-chunking-strategies-rag-2025.webp&w=2048&q=75&dpl=dpl_4SA9tF2xCnVNcK8SKvWnc8pJZr6J 2048w, /_next/image?url=%2Fimages%2Fblog%2Fbest-chunking-strategies-rag-2025%2Fbest-chunking-strategies-rag-2025.webp&w=3840&q=75&dpl=dpl_4SA9tF2xCnVNcK8SKvWnc8pJZr6J 3840w" src="https://www.firecrawl.dev/_next/image?url=%2Fimages%2Fblog%2Fbest-chunking-strategies-rag-2025%2Fbest-chunking-strategies-rag-2025.webp&w=3840&q=75&dpl=dpl_4SA9tF2xCnVNcK8SKvWnc8pJZr6J"> <div><H2>TLDR</H2> <ul> <li>Seven chunking strategies compared with working code examples: recursive character splitting, semantic, page-level, LLM-based, size-based, sentence-based, and late chunking</li> <li>Recursive character splitting at 400-512 tokens with 10-20% overlap is the best default for most use cases</li> <li>Page-level chunking won NVIDIA's 2024 benchmarks (0.648 accuracy, lowest variance), but only for paginated documents</li> <li>Semantic chunking can improve recall by up to 9% over simpler methods, at the cost of embedding every sentence</li> <li>Firecrawl handles data collection and <a href="https://www.firecrawl.dev/blog/scrape-a-website-to-markdown">clean markdown extraction</a> so every chunking strategy gets clean input</li> <li>Decision framework and complete RAG pipeline example included with Pinecone, Qdrant, Weaviate, ChromaDB, and pgvector</li> </ul> <hr> <p>Your RAG system's retrieval accuracy depends on how you chunk your documents. The wrong strategy can create up to a 9% gap in recall performance between best and worst approaches. That's the difference between a system that helps users and one that frustrates them. With RAG adoption hitting 51% among enterprises in 2024 (up from 31% in 2023, per <a href="https://menlovc.com/2024-the-state-of-generative-ai-in-the-enterprise/">Menlo Ventures</a>) and the <a href="https://www.marketsandmarkets.com/PressReleases/retrieval-augmented-generation-rag.asp">RAG market projected to reach $9.86 billion by 2030</a>, getting chunking right matters at scale. Chunking is just one part of building effective RAG systems—once you've optimized your chunking strategy, explore <a href="https://www.firecrawl.dev/blog/best-open-source-rag-frameworks">open-source RAG frameworks</a> to see how chunking fits into complete RAG pipelines, or compare <a href="https://www.firecrawl.dev/blog/best-enterprise-rag-platforms-2025">enterprise RAG platforms</a> for production deployments.</p> <p>Here's the challenge: chunking strategies for LLMs require breaking documents into smaller pieces before embedding them, but deciding which approach works best isn't obvious. Fixed-size chunks are easy to implement but ignore context boundaries. Semantic chunking preserves meaning but costs money to run. Page-level chunking achieved the highest accuracy in NVIDIA's 2024 benchmarks, yet it might not fit your use case.</p> <p>This article compares seven chunking strategies using real benchmark data from NVIDIA, Chroma, and other research teams. You'll see specific numbers, actual performance metrics, and honest trade-offs between approaches.</p> <p>We'll cover the following chunking strategies:</p> <ul> <li><a href="https://www.firecrawl.dev/blog/best-chunking-strategies-rag#recursive-character-splitting">Recursive Character Splitting</a></li> <li><a href="https://www.firecrawl.dev/blog/best-chunking-strategies-rag#semantic-chunking">Semantic Chunking</a></li> <li><a href="https://www.firecrawl.dev/blog/best-chunking-strategies-rag#page-level-chunking">Page-Level Chunking</a></li> <li><a href="https://www.firecrawl.dev/blog/best-chunking-strategies-rag#llm-based-chunking">LLM-Based Chunking</a></li> <li><a href="https://www.firecrawl.dev/blog/best-chunking-strategies-rag#size-based-chunking">Size-Based Chunking</a></li> <li><a href="https://www.firecrawl.dev/blog/best-chunking-strategies-rag#sentence-based-chunking">Sentence-Based Chunking</a></li> <li><a href="https://www.firecrawl.dev/blog/best-chunking-strategies-rag#late-chunking">Late Chunking</a></li> </ul> <p>Each strategy includes working code examples you can test (see <a href="https://www.firecrawl.dev/blog/best-chunking-strategies-rag#getting-sample-data-for-testing-chunking-strategies">Getting Sample Data</a> to set up a test dataset).</p> <H2>Understanding chunking trade-offs</H2> <p>Every chunking strategy trades off context preservation against retrieval precision. Smaller chunks match queries more precisely but lose surrounding context. Larger chunks preserve relationships between ideas but dilute relevance in your embeddings.</p> <H3>The cost spectrum</H3> <p>Different strategies have different computational costs:</p> <p><strong>Simple methods</strong> (size-based, token-based) are fast and cheap. Split on character count, no API calls, no overhead.</p> <p><strong>Structure-aware methods</strong> (recursive, sentence-based, page-level) add modest complexity with extra parsing logic to respect natural boundaries. Cost is still minimal.</p> <p><strong>Semantic methods</strong> require generating embeddings for every sentence and calculating similarity scores to find split points. This means API calls or running local models.</p> <p><strong>LLM-based methods</strong> send every document through an LLM to analyze structure. High quality, high cost, slower processing.</p> <H3>Why there's no universal winner</H3> <p>Three factors determine what works best for your use case:</p> <p><strong>Your embedding model</strong> affects performance. Different architectures have different characteristics that change which chunking strategies work well.</p> <p><strong>Your document type</strong> matters. PDFs with tables need different handling than blog posts or code files.</p> <p><strong>Your query patterns</strong> influence optimal chunk size. Factoid lookups need different chunking than analytical questions.</p> <p>Let's look at each strategy in detail.</p> <H2>Recursive character splitting</H2> <p>Recursive character splitting is where most teams should start. It works by trying to split text at natural boundaries, checking multiple separators in order until it finds one that works.</p> <H3>How it works</H3> <p>The splitter respects natural language boundaries. It doesn't cut sentences mid-thought, and waits for paragraph breaks. If the paragraph is too long, it waits for a sentence. If the sentence is too long, it looks for a space between words.</p> <p>This happens through a hierarchy of separators:</p> <ol> <li>Double newline <code>\\n\\n</code> (paragraph breaks)</li> <li>Single newline <code>\\n</code> (line breaks)</li> <li>Space  (word boundaries)</li> <li>Empty string <code>""</code> (individual characters, last resort)</li> </ol> <p>When you set a chunk size of 512 characters, the splitter tries to respect that limit while breaking at the highest-level separator it can. A 600-character paragraph gets split at a sentence boundary instead of mid-word.</p> <p>For code, you can customize separators to respect function and class boundaries:</p> <figure><div><pre><code class="language-python" data-lang="python"># Code-aware separators
separators = [
    "\\n\\nclass ",  # Class definitions
    "\\n\\ndef ",    # Function definitions
    "\\n\\n",        # Paragraph breaks
    "\\n",          # Line breaks
    " ",           # Spaces
    ""
]</code></pre></div></figure> <H3>Implementation example</H3> <p>Here's how to use LangChain's <code>RecursiveCharacterTextSplitter</code>.</p> <p>For the examples below, we'll use clean drug information data. If you want to follow along, see <a href="https://www.firecrawl.dev/blog/best-chunking-strategies-rag#getting-sample-data-for-testing-chunking-strategies">Getting Sample Data for Testing Chunking Strategies</a> to scrape your own dataset with Firecrawl. For comprehensive web data collection, see our <a href="https://www.firecrawl.dev/blog/mastering-the-crawl-endpoint-in-firecrawl">crawl endpoint guide</a>.</p> <figure><div><pre><code class="language-python" data-lang="python">from langchain_text_splitters import RecursiveCharacterTextSplitter
import json
from pathlib import Path
 
# Load one of our scraped documents
doc_path = Path("data/raw_documents/drug_info_00.json")
with open(doc_path) as f:
    doc = json.load(f)
 
# Configure the splitter
splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=50,
    length_function=len,
    separators=["\\n\\n", "\\n", ". ", " ", ""]
)
 
# Split the document
chunks = splitter.split_text(doc["markdown"])
 
# Show results
print(f"Document: {doc['title']}")
print(f"Original length: {len(doc['markdown'])} characters")
print(f"Number of chunks: {len(chunks)}")
print(f"\\nFirst chunk preview:")
print(chunks[0][:200] + "...")</code></pre></div></figure> <p>We load a JSON document containing scraped medical information, configure a recursive character splitter with a 512-character target chunk size and 50-character overlap, then split the text using a hierarchy of separators (paragraphs, lines, sentences, words).</p> <p>The output shows document metadata and a preview of the first chunk:</p> <figure><div><pre><code class="language-plaintext" data-lang="plaintext">Document: Sertraline (oral route) - Side effects &amp; dosage - Mayo Clinic
Original length: 23092 characters
Number of chunks: 64
 
First chunk preview:
## On this page
 
- [Brand names](https://www.mayoclinic.org/drugs-supplements/sertraline-oral-route/description/drg-20065940#drug-brand-names)
 
- [Description](https://www.mayoclinic.org/drugs-supplem...</code></pre></div></figure> <p>The chunk preserves the document structure. Headers stay with their content. Sections break at natural boundaries instead of mid-sentence.</p> <H3>When to use this</H3> <p>Recursive splitting handles most text content well:</p> <ul> <li>Articles and blog posts</li> <li>Technical documentation</li> <li>Research papers</li> <li>Product descriptions</li> <li>Email threads</li> </ul> <p>For documents with clear section markers (like medical drug information with "Description", "Before Using", "Side Effects"), add section headers to your separators list with higher priority than paragraph breaks to preserve entire sections. It's the default choice for 80% of RAG applications because it balances simplicity with structure awareness.</p> <H3>Trade-offs</H3> <p>Pros:</p> <ul> <li>Preserves document organization (headers, paragraphs, lists)</li> <li>Adapts to different content types through custom separators</li> <li>Better context retention than fixed-size splitting</li> <li>Reliable performance in Chroma's research (88-89% recall with 400-token chunks using text-embedding-3-large)</li> </ul> <p>Cons:</p> <ul> <li>Slightly more complex setup than character-based splitting</li> <li>Requires understanding your content structure to choose good separators</li> <li>Variable chunk sizes can complicate batch processing</li> </ul> <H2>Size-based chunking</H2> <p>Size-based chunking is the simplest approach. Pick a number, split when you hit it, repeat. No structure awareness, no smart decisions, just counting.</p> <H3>How it works</H3> <p>Two main variants exist: character-based and token-based.</p> <p>Character-based splitting counts characters and splits when you reach the limit. Set <code>chunk_size=1000</code> and you get chunks of roughly 1000 characters each. A 5000-character document becomes 5 chunks.</p> <p>Token-based splitting counts tokens instead of characters. This distinction matters because embedding models have token limits, not character limits. The word "unhappiness" is one word and 11 characters, but it might be 2 tokens ("un" + "happiness") depending on the tokenizer.</p> <p>Both variants support overlap (sliding windows). A 1000-character chunk with 100-character overlap means the last 100 characters of chunk 1 appear as the first 100 characters of chunk 2. This helps preserve context across boundaries.</p> <H3>Implementation example</H3> <p>Character-based splitting with LangChain:</p> <figure><div><pre><code class="language-python" data-lang="python">from langchain_text_splitters import CharacterTextSplitter
import json
from pathlib import Path
 
# Load document, see the Getting Sample Data section to scrape your own drug_info_00 dataset with Firecrawl.
doc_path = Path("data/raw_documents/drug_info_00.json")
with open(doc_path) as f:
    doc = json.load(f)
 
# Character-based splitting
char_splitter = CharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
    separator="\\n"
)
 
chunks = char_splitter.split_text(doc["markdown"])
print(f"Character-based: {len(chunks)} chunks")
print(f"Chunk 0 length: {len(chunks[0])} chars")
print(f"Chunk 1 length: {len(chunks[1])} chars")</code></pre></div></figure> <p>We configure a character-based splitter with a 1000-character target and 100-character overlap, using newlines as separators.</p> <p>For token-based splitting:</p> <figure><div><pre><code class="language-python" data-lang="python">from langchain_text_splitters import TokenTextSplitter
 
# Token-based splitting (uses tiktoken)
token_splitter = TokenTextSplitter(
    chunk_size=512,
    chunk_overlap=50
)
 
token_chunks = token_splitter.split_text(doc["markdown"])
print(f"\\nToken-based: {len(token_chunks)} chunks")</code></pre></div></figure> <p>The token-based splitter uses the tiktoken library to count tokens (not characters), which better aligns with embedding model limits. With a 512-token target, this produces different chunk counts than character-based splitting.</p> <p>Output:</p> <figure><div><pre><code class="language-plaintext" data-lang="plaintext">Character-based: 28 chunks
Chunk 0 length: 954 chars
Chunk 1 length: 926 chars
 
Token-based: 14 chunks</code></pre></div></figure> <p>Token-based splitting produces fewer chunks in this case because tokens are more efficient units than fixed character counts with overlap. The 512-token limit effectively captures more semantic content per chunk than the character-based approach.</p> <H3>When to use this</H3> <p>Size-based chunking works for:</p> <ul> <li><strong>Prototyping and MVPs</strong>: Get something working fast, optimize later</li> <li><strong>Uniform content</strong>: News articles, product listings, short-form content with consistent structure</li> <li><strong>When simplicity matters</strong>: Small teams, limited resources, straightforward use cases</li> </ul> <p>If you're testing whether RAG works for your use case at all, start here. The implementation takes 5 minutes.</p> <H3>Trade-offs</H3> <p>Pros:</p> <ul> <li>Fastest to implement (literally 3 lines of code)</li> <li>Predictable chunk sizes for batch processing</li> <li>No computational overhead</li> <li>Works with any content type</li> </ul> <p>Cons:</p> <ul> <li>Ignores semantic boundaries and document structure</li> <li>Fragments sentences mid-thought</li> <li>Lower retrieval accuracy than structure-aware methods</li> <li>Can split tables, code blocks, or lists in awkward places</li> </ul> <H3>Overlap and sliding windows</H3> <p>Overlap helps reduce fragmentation problems. If a key sentence gets split across two chunks, the overlap ensures both chunks contain the complete thought.</p> <p>Industry best practices recommend 10-20% overlap as a starting point. For a 500-token chunk, use 50-100 tokens of overlap. The <a href="https://stackoverflow.blog/2024/12/27/breaking-up-is-hard-to-do-chunking-in-rag-applications/">Stack Overflow blog on RAG chunking</a> discusses sliding windows and overlap strategies in detail.</p> <p>More overlap preserves more context but increases storage costs and processing time. That said, a <a href="https://arxiv.org/abs/2601.14123">January 2026 systematic analysis</a> using SPLADE retrieval and Mistral-8B on Natural Questions found that overlap provided no measurable benefit and only increased indexing cost. Test what works for your use case, but don't assume overlap is always worth the storage trade-off.</p> <H2>Sentence-based chunking</H2> <p>Sentence-based chunking respects natural language boundaries. Instead of counting characters or tokens blindly, it identifies complete sentences and groups them into chunks.</p> <H3>How it works</H3> <p>The splitter uses natural language processing to detect sentence boundaries. Periods, question marks, and exclamation points signal potential splits, but the algorithm is smart enough to handle edge cases like "Dr. Smith" or "3.14" without fragmenting them.</p> <p>Once sentences are identified, the chunker groups them to hit your target chunk size. If you set <code>chunk_size=1024</code> tokens, it keeps adding sentences until the next one would exceed the limit, then starts a new chunk.</p> <p>The result is variable chunk sizes. One chunk might be 950 tokens, another might be 1100, depending on where sentence boundaries fall. The guarantee is that sentences stay intact.</p> <H3>Implementation example</H3> <p>LlamaIndex's <code>SentenceSplitter</code> handles sentence detection and grouping:</p> <figure><div><pre><code class="language-python" data-lang="python">from llama_index.core.node_parser import SentenceSplitter
from llama_index.core import Document
import json
from pathlib import Path
 
# Load document, see the Getting Sample Data section to scrape your own drug_info_00 dataset with Firecrawl.
doc_path = Path("data/raw_documents/drug_info_00.json")
with open(doc_path) as f:
    doc_data = json.load(f)
 
# Create LlamaIndex Document
doc = Document(text=doc_data["markdown"])
 
# Configure sentence splitter
splitter = SentenceSplitter(
    chunk_size=1024,
    chunk_overlap=20
)
 
# Split into nodes (LlamaIndex's chunk equivalent)
nodes = splitter.get_nodes_from_documents([doc])
 
# Show results
print(f"Document: {doc_data['title']}")
print(f"Number of chunks: {len(nodes)}")
print(f"\\nChunk sizes:")
for i, node in enumerate(nodes[:5]):
    print(f"Chunk {i}: {len(node.text)} characters")</code></pre></div></figure> <p>We create a LlamaIndex Document object from our text, configure a sentence splitter with a 1024-character target size and 20-character overlap, then split the document into nodes (LlamaIndex's term for chunks).</p> <p>Here's what we get:</p> <figure><div><pre><code class="language-plaintext" data-lang="plaintext">Document: Sertraline (oral route) - Side effects &amp; dosage - Mayo Clinic
Number of chunks: 6
 
Chunk sizes:
Chunk 0: 3883 characters
Chunk 1: 3609 characters
Chunk 2: 4049 characters
Chunk 3: 4502 characters
Chunk 4: 4005 characters</code></pre></div></figure> <p>Each chunk contains complete sentences. No thought gets cut off mid-expression.</p> <H3>When to use this</H3> <p>Sentence-based chunking works well for:</p> <ul> <li>Conversational data (chat logs, customer support transcripts)</li> <li>Q&amp;A content where each question-answer pair should stay together</li> <li>Short-form content with clear sentence structure</li> <li>When preserving complete thoughts matters more than uniform chunk sizes</li> </ul> <p>If your RAG system answers questions where context comes from complete sentences, this approach helps retrieval quality.</p> <H3>Trade-offs</H3> <p>Pros:</p> <ul> <li>Maintains sentence integrity (no mid-sentence splits)</li> <li>Natural language structure feels more coherent</li> <li>Better than size-based for conversational or Q&amp;A content</li> <li>Users reading retrieved chunks see complete thoughts</li> </ul> <p>Cons:</p> <ul> <li>Variable chunk sizes complicate batch processing</li> <li>Long sentences can create oversized chunks</li> <li>Sentence detection fails on poorly formatted text</li> <li>More complex than simple character counting</li> </ul> <H2>Page-level chunking</H2> <p>PDFs and structured documents benefit from specialized approaches that respect document layout and visual boundaries.</p> <p>Page-level chunking treats each page as a separate chunk. Instead of counting tokens or looking for sentence breaks, it splits wherever the document pagination naturally occurs.</p> <H3>How it works</H3> <p>PDF files have built-in page boundaries. Page-level chunking extracts content page by page and creates one chunk per page (or groups a few pages together if they're short).</p> <p>This matters because PDFs often organize information visually. Financial reports put balance sheets on one page, income statements on another. Research papers have figures on specific pages with captions. Medical documentation separates patient history, current symptoms, and treatment plans across different pages.</p> <p>Breaking content across these natural boundaries would lose important context. Page-level chunking preserves it.</p> <H3>Implementation example</H3> <p>Unstructured.io provides PDF parsing with page-aware chunking:</p> <figure><div><pre><code class="language-python" data-lang="python">from unstructured.partition.pdf import partition_pdf
from unstructured.chunking.title import chunk_by_title
 
# Parse PDF and partition by page
elements = partition_pdf(
    filename="sample_report.pdf",
    strategy="hi_res",  # High-resolution extraction for tables/images
)
 
# Chunk with multipage_sections=False to respect page boundaries
chunks = chunk_by_title(
    elements,
    multipage_sections=False,  # Don't merge across pages
    combine_text_under_n_chars=200,
    max_characters=2000
)
 
# Show results
print(f"Total chunks: {len(chunks)}")
for i, chunk in enumerate(chunks[:3]):
    print(f"\\nChunk {i}:")
    print(f"  Type: {chunk.category}")
    print(f"  Length: {len(str(chunk))} characters")
    print(f"  Preview: {str(chunk)[:150]}...")</code></pre></div></figure> <p>We use Unstructured.io's <code>partition_pdf</code> function with the "hi_res" strategy to extract text, tables, and images from a PDF while preserving page structure. The <code>chunk_by_title</code> function groups elements by section titles, with <code>multipage_sections=False</code> ensuring chunks don't span page boundaries.</p> <p>Running this produces:</p> <figure><div><pre><code class="language-plaintext" data-lang="plaintext">Total chunks: 12
 
Chunk 0:
  Type: Title
  Length: 487 characters
  Preview: FINANCIAL SUMMARY
Q4 2024 Results
 
Revenue increased 23% year-over-year to $2.3B, driven by enterprise segment growth. Operating margin improved to 18.5%...
 
Chunk 1:
  Type: Table
  Length: 623 characters
  Preview: Balance Sheet
Assets: $15.2B
Liabilities: $8.7B
Equity: $6.5B...</code></pre></div></figure> <p>The <code>multipage_sections=False</code> parameter ensures page breaks start new chunks. Tables, figures, and text from the same page stay together.</p> <H3>When to use this</H3> <p>Page-level chunking excels with:</p> <ul> <li>PDFs with visual layouts (reports, presentations, forms)</li> <li>Table-heavy content (financial statements, research data)</li> <li>Documents where pagination has semantic meaning</li> <li>Mixed content types per page (text + tables + images)</li> </ul> <p>If your documents have clear page-based organization, this preserves that structure. For web-sourced PDFs specifically, Firecrawl's <a href="https://www.firecrawl.dev/blog/pdf-parser-v2">document extraction</a> handles scanned documents and complex layouts before they reach your chunking pipeline. The current engine, <a href="https://www.firecrawl.dev/blog/fire-pdf-launch">Fire-PDF</a>, averages under 400ms per page by routing only scanned content through GPU—leaving text-based pages on the fast native extraction path. For a side-by-side comparison of <a href="https://www.firecrawl.dev/blog/best-pdf-parsers">AI PDF parsers for RAG</a> —including open-source options like Docling, Marker-PDF, and LlamaParse alongside Firecrawl—see the dedicated PDF parsers guide. For a broader comparison of <a href="https://www.firecrawl.dev/blog/best-document-parsing-apis">document parsing APIs</a> covering PDF parsing APIs, document extraction APIs, and AI document processing services, see the best document parsing APIs guide.</p> <H3>Trade-offs</H3> <p>Pros:</p> <ul> <li>Preserves page context and visual layout</li> <li>Handles tables and figures naturally</li> <li>Works with documents where pages represent logical units</li> <li>Highest accuracy in NVIDIA benchmarks (0.648 with lowest variance)</li> </ul> <p>Cons:</p> <ul> <li>Only makes sense for paginated documents (PDFs, presentations)</li> <li>Assumes pages align with semantic boundaries (not always true)</li> <li>Variable chunk sizes based on page content density</li> <li>May create very small or very large chunks depending on pagination</li> </ul> <H3>Research validation</H3> <p>NVIDIA's 2024 benchmark tested seven chunking strategies across five datasets. Page-level chunking won with 0.648 accuracy and the lowest standard deviation (0.107), meaning it performed consistently well across different document types.</p> <p>The results make sense. Financial reports, legal documents, and research papers organize information by pages. Respecting that structure helps retrieval find the right context.</p> <p>But remember: NVIDIA tested document types where pagination matters. If your PDFs are just text exports with arbitrary page breaks, page-level chunking won't help.</p> <H2>Semantic chunking</H2> <p>Semantic chunking splits text based on meaning, not structure. Instead of looking for paragraph breaks or sentence boundaries, it analyzes how related consecutive sentences are and creates chunks where topics shift.</p> <H3>How it works</H3> <p>The process follows four steps:</p> <ol> <li><strong>Sentence segmentation</strong>: Break the document into individual sentences</li> <li><strong>Embedding generation</strong>: Create vector embeddings for each sentence</li> <li><strong>Similarity analysis</strong>: Compare embeddings between consecutive sentences to measure how related they are</li> <li><strong>Chunk formation</strong>: When similarity drops below a threshold, start a new chunk</li> </ol> <p>Consider a research paper. The introduction flows naturally from background to motivation to contribution. Then there's a shift to related work. That transition is noticeable when reading. Semantic chunking detects it mathematically using embedding similarity.</p> <p>The threshold determines sensitivity. Three common methods exist:</p> <p><strong>Percentile threshold (default)</strong>: Split when similarity difference exceeds the 95th percentile. If most sentences are 0.85 similar but two consecutive ones are only 0.65 similar, that's a topic shift.</p> <p><strong>Standard deviation</strong>: Split when difference exceeds 3 standard deviations from the mean. Catches statistically unusual topic transitions.</p> <p><strong>Interquartile range</strong>: Uses the middle 50% of similarity scores to identify outliers. Less sensitive to extreme values than standard deviation.</p> <H3>Implementation example</H3> <p>LangChain's <code>SemanticChunker</code> handles the embedding and similarity analysis:</p> <figure><div><pre><code class="language-python" data-lang="python">from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings
import json
from pathlib import Path
import os
 
# Set up embeddings model
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=os.getenv("OPENAI_API_KEY")
)
 
# Load document, see the Getting Sample Data section to scrape your own drug_info_00 dataset with Firecrawl.
doc_path = Path("data/raw_documents/drug_info_00.json")
with open(doc_path) as f:
    doc = json.load(f)
 
# Configure semantic chunker
semantic_splitter = SemanticChunker(
    embeddings=embeddings,
    breakpoint_threshold_type="percentile",  # or "standard_deviation", "interquartile"
    breakpoint_threshold_amount=95
)
 
# Split based on semantic similarity
chunks = semantic_splitter.split_text(doc["markdown"])
 
# Show results
print(f"Document: {doc['title']}")
print(f"Number of chunks: {len(chunks)}")
print(f"\\nChunk sizes:")
for i, chunk in enumerate(chunks[:5]):
    print(f"Chunk {i}: {len(chunk)} characters")</code></pre></div></figure> <p>We initialize OpenAI embeddings, load our document, and configure a semantic chunker that uses the percentile threshold method (95th percentile) to detect topic transitions. The chunker embeds each sentence, compares consecutive embeddings, and splits where similarity drops sharply.</p> <p>The results show highly variable chunk sizes based on semantic coherence rather than fixed limits:</p> <figure><div><pre><code class="language-plaintext" data-lang="plaintext">Document: Sertraline (oral route) - Side effects &amp; dosage - Mayo Clinic
Number of chunks: 8
 
Chunk sizes:
Chunk 0: 1811 characters
Chunk 1: 315 characters
Chunk 2: 4701 characters
Chunk 3: 8405 characters
Chunk 4: 6309 characters</code></pre></div></figure> <p>Notice the fewer chunks compared to size-based or recursive splitting. Semantic chunking groups related content together regardless of length. Each chunk represents a coherent topic.</p> <H3>When to use this</H3> <p>Semantic chunking works best for:</p> <ul> <li>Dense unstructured text (research papers, long-form articles, technical documentation)</li> <li>Content with subtle topic transitions that structure-based methods miss</li> <li>When retrieval accuracy is the top priority and budget allows</li> <li>Documents where natural sections aren't marked with headers</li> </ul> <p>The cost matters. Every sentence needs an embedding, which means API calls (if using OpenAI) or local model inference. For a 10,000-word document, you might generate 200-300 embeddings just for chunking.</p> <H3>Trade-offs</H3> <p>Pros:</p> <ul> <li>Maintains semantic coherence across chunk boundaries</li> <li>Detects subtle topic shifts that structure-based methods miss</li> <li>2-3 percentage points better recall than RecursiveCharacterTextSplitter (Chroma research found performance differences up to 9 percentage points across all chunking methods tested)</li> <li>Highest accuracy: 0.919 recall with LLM-enhanced variant</li> </ul> <p>Cons:</p> <ul> <li>Computationally expensive (embedding every sentence)</li> <li>Requires threshold tuning for your specific content</li> <li>Embedding API costs add up (or local model inference time)</li> <li>Slower processing than simpler methods</li> <li>A <a href="https://aclanthology.org/2025.findings-naacl.114/">NAACL 2025 Findings paper</a> concluded the computational costs aren't justified by consistent gains, with fixed 200-word chunks matching or beating semantic chunking across retrieval and answer generation tasks</li> </ul> <H3>Advanced variants</H3> <p>Cluster semantic chunking groups similar sentences even if they aren't adjacent. This helps when a document revisits topics or has nested structure. This is a more advanced approach than standard semantic chunking. <a href="https://developers.llamaindex.ai/python/examples/node_parsers/semantic_chunking/">LlamaIndex's SemanticSplitterNodeParser</a> implements standard semantic splitting by analyzing consecutive sentences.</p> <p>Hierarchical chunking creates multiple chunk layers. Summary chunks for high-level queries, detail chunks for specific questions. More complex but powerful for documents with nested information architecture.</p> <p>Test whether semantic chunking justifies the cost for your use case. If recursive splitting gives 88% recall and semantic gives 91%, is the 3% improvement worth 10x processing time and embedding costs?</p> <H2>LLM-based chunking</H2> <p>LLM-based chunking uses a language model to analyze document structure and decide where to split. Instead of following fixed rules or embedding similarity, the LLM reads the content and makes context-aware decisions about chunk boundaries.</p> <H3>How it works</H3> <p>You send the document (or sections of it) to an LLM with instructions about how to chunk it. The model analyzes the content, identifies logical boundaries, and returns split points or pre-chunked content.</p> <p>A basic approach:</p> <ol> <li><strong>Send document sections to LLM</strong>: "Identify logical section breaks in this text where topics shift"</li> <li><strong>LLM analyzes structure</strong>: Understands headers, topic transitions, argument flow</li> <li><strong>Receive split points or chunks</strong>: Get back either marked boundaries or pre-chunked text</li> <li><strong>Create final chunks</strong>: Use LLM suggestions to split the original document</li> </ol> <p>More sophisticated approaches ask the LLM to summarize each chunk or generate metadata, creating semantically rich chunks with built-in context.</p> <H3>Implementation example</H3> <p>Here's a conceptual example using OpenAI's API:</p> <figure><div><pre><code class="language-python" data-lang="python">from openai import OpenAI
import json
from pathlib import Path
 
client = OpenAI()
 
# Load document, see the Getting Sample Data section to scrape your own drug_info_00 dataset with Firecrawl.
doc_path = Path("data/raw_documents/drug_info_00.json")
with open(doc_path) as f:
    doc = json.load(f)
 
# Prompt LLM to identify chunk boundaries
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{
        "role": "system",
        "content": "You are a document analysis expert. Identify logical sections in the following medical document and suggest where to split it into semantically coherent chunks. Return section titles and approximate character positions for splits."
    }, {
        "role": "user",
        "content": doc["markdown"][:8000]  # Send first portion
    }]
)
 
# Parse LLM suggestions
suggestions = response.choices[0].message.content
print("LLM-suggested chunks:")
print(suggestions)
 
# In production, you'd parse the response and create actual chunks
# This is a simplified example showing the concept</code></pre></div></figure> <p>We send the first 8000 characters of our document to GPT-4 with a system prompt instructing it to analyze document structure and suggest chunk boundaries. The LLM returns section titles with character positions.</p> <p>In a production system, you'd parse these suggestions and use them to split the full document. Here's example output:</p> <figure><div><pre><code class="language-plaintext" data-lang="plaintext">LLM-suggested chunks:
1. "Table of Contents" (Start: 0, End: 777)
2. "Brand Name" (Start: 780, End: 869)
3. "Description" (Start: 872, End: 1518)
4. "Before Using" (Start: 1521, End: 6835)
5. "Proper Use" (Start: 6838, End: 7680)</code></pre></div></figure> <p>The LLM identified semantic sections that align with how medical professionals think about drug information, not just where paragraph breaks happen.</p> <H3>When to use this</H3> <p>LLM-based chunking makes sense for:</p> <ul> <li>High-value content where chunking quality directly affects business outcomes</li> <li>Documents with complex or unusual structure that breaks simple methods</li> <li>Experimental projects where you can iterate on prompts</li> <li>Small document collections where processing cost isn't prohibitive</li> </ul> <p>This isn't for production-scale document processing unless cost isn't a concern. One 10,000-word document might need multiple LLM calls to analyze fully, each costing $0.01-$0.10 depending on model and token count.</p> <H3>Trade-offs</H3> <p>Pros:</p> <ul> <li>Context-aware decisions based on actual content meaning</li> <li>Adapts to document structure dynamically</li> <li>Can generate chunk summaries and metadata in the same pass</li> <li>Handles unusual document types that break rule-based methods</li> </ul> <p>Cons:</p> <ul> <li>Expensive (LLM API costs for every document)</li> <li>Slow (LLM inference latency, especially for large documents)</li> <li>Requires LLM access (API dependency or local model infrastructure)</li> <li>Limited production use (cost and latency prohibitive at scale)</li> <li>Needs prompt engineering and testing</li> </ul> <H3>Agentic chunking</H3> <p>Agentic chunking extends the LLM approach by giving the model agency to decide chunking strategy per document. Instead of one fixed prompt, the agent analyzes document characteristics and picks the right method.</p> <p>A research paper might get semantic chunking. A financial report might get page-level. A code file might get function-level splitting. The agent decides based on document type, structure, and content density.</p> <p>This sounds promising, but it remains largely experimental. <a href="https://weaviate.io/blog/chunking-strategies-for-rag">Weaviate's chunking blog</a> and <a href="https://www.f22labs.com/blogs/7-chunking-strategies-in-rag-you-need-to-know/">F22 Labs guide</a> discuss the approach, though the complexity and cost limit real-world adoption.</p> <H3>Practical considerations</H3> <p>If you're considering LLM-based chunking, test it on a small sample first. Calculate actual costs:</p> <ul> <li>100 documents × 5,000 words each = 500,000 words</li> <li>At ~1.3 tokens/word = 650,000 tokens</li> <li>GPT-4 input: $5.00/1M tokens = $3.25</li> <li>Add output tokens and multiple passes for large docs</li> </ul> <p>For ongoing document processing, costs add up fast. LLM-based chunking works best for one-time processing of valuable content or as a benchmark to evaluate simpler methods.</p> <H2>Late chunking</H2> <p>Every strategy covered so far shares the same assumption: you split the document first, then embed each chunk on its own. Late chunking, <a href="https://arxiv.org/abs/2409.04701">introduced by Jina AI in 2024</a>, flips that order. The transformer processes the full document before any splitting happens, so each chunk's embedding carries context from the entire text.</p> <H3>How it works</H3> <p>Consider a chunk containing "Its population exceeds 3.85 million" where "Berlin" appeared three paragraphs earlier, now sitting in a different chunk. With standard chunking, the self-attention layers only see one chunk at a time, so that pronoun reference is lost.</p> <p>Late chunking runs the full document through the transformer first. At this point, every token embedding reflects bidirectional attention over the entire input, and the token for "Its" already encodes information about "Berlin" from the broader context. Only after this forward pass do you apply chunk boundaries and mean-pool the token embeddings within each span to produce the final chunk vectors.</p> <p>In practice, you tokenize the full document up to the model's context window, run the complete token sequence through all transformer layers, then map your chunk boundaries onto the resulting token-level embeddings. Those boundaries can come from any strategy covered in this article: recursive splitting, sentence-based, fixed-size, or semantic. The final step is mean-pooling within each chunk span to get one vector per chunk. The <a href="https://arxiv.org/abs/2409.04701">paper's benchmarks</a> show retrieval improved across all boundary strategies when paired with late chunking.</p> <p>This means late chunking isn't a replacement for other strategies, but a layer on top of them.</p> <H3>Implementation example</H3> <p>The most practical path today is <a href="https://jina.ai/embeddings/">Jina's embedding API</a>, which supports late chunking as a parameter. When <code>late_chunking</code> is set to <code>True</code>, the API concatenates all input strings, processes them through the transformer as a single sequence, then returns one embedding per string.</p> <figure><div><pre><code class="language-python" data-lang="python">import requests
import os
 
url = "https://api.jina.ai/v1/embeddings"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('JINA_API_KEY')}",
}
 
# Pass chunks as separate strings in the input array
# The API concatenates them internally for the full-document forward pass
data = {
    "input": [
        "Berlin is the capital and largest city of Germany, both by area and by population.",
        "Its more than 3.85 million inhabitants make it the European Union's most populous city.",
        "The city is also one of the states of Germany, and is the third smallest state by area.",
    ],
    "model": "jina-embeddings-v3",
    "task": "retrieval.passage",
    "late_chunking": True,
}
 
response = requests.post(url, headers=headers, json=data)
embeddings = response.json()["data"]
 
for i, emb in enumerate(embeddings):
    print(f"Chunk {i}: {len(emb['embedding'])} dimensions")</code></pre></div></figure> <p>The second chunk's embedding now knows "Its" refers to Berlin, because the transformer saw the full concatenated text before pooling.</p> <p>For teams already using LangChain, the <a href="https://pypi.org/project/langchain-jina/"><code>langchain-jina</code></a> package wraps this into a familiar interface:</p> <figure><div><pre><code class="language-python" data-lang="python">from langchain_jina import LateChunkEmbeddings
 
embeddings = LateChunkEmbeddings(
    jina_api_key=os.getenv("JINA_API_KEY"),
    model_name="jina-embeddings-v3"
)
 
vectors = embeddings.embed_documents([
    "Berlin is the capital and largest city of Germany.",
    "Its more than 3.85 million inhabitants make it the EU's most populous city.",
])</code></pre></div></figure> <p>You can also run late chunking locally with Jina's <a href="https://github.com/jina-ai/late-chunking">open source implementation</a> using any HuggingFace model that supports mean pooling.</p> <p><em>P.S: For a comparison of how Jina AI and Firecrawl approach document processing for AI pipelines, see <a href="https://www.firecrawl.dev/alternatives/firecrawl-vs-jina-ai">Firecrawl vs Jina AI</a>.</em></p> <H3>When to use this</H3> <p>Late chunking fits documents where chunks frequently reference information from other parts of the text: legal contracts with cross-references, research papers where the methods section depends on definitions from the introduction, or technical documentation heavy on pronouns and acronyms introduced earlier.</p> <p>The performance gap widens with document length. On NFCorpus (average 1,589 characters per document), late chunking improved nDCG@10 by 6.5 points over naive chunking. On Quora (average 62 characters), there was zero improvement because short texts don't have cross-chunk dependencies to preserve.</p> <H3>Trade-offs</H3> <p>Pros:</p> <ul> <li>Chunk embeddings carry full-document context without extra API calls or inference steps beyond what you'd already run for embedding</li> <li>Works as a layer on top of any boundary strategy (recursive, sentence-based, fixed-size)</li> <li>Approached the quality of LLM-augmented contextual embeddings in the paper's tests (0.8516 vs 0.8590 cosine similarity) at a fraction of the cost</li> </ul> <p>Cons:</p> <ul> <li>Requires models with mean pooling and long context windows; CLS-token models like some BERT variants won't work</li> <li>The entire document must fit in the model's context window (8,192 tokens for <a href="https://jina.ai/embeddings/">jina-embeddings-v3</a>, roughly 10 pages)</li> <li>The Jina API is the only production-ready path right now, though local usage is possible through the <a href="https://github.com/jina-ai/late-chunking">transformers library</a></li> <li>A weaker embedding model with late chunking still underperforms a stronger model without it</li> </ul> <H2>What the research says about chunking strategies for LLMs and RAG</H2> <p><a href="https://developer.nvidia.com/blog/finding-the-best-chunking-strategy-for-accurate-ai-responses/">NVIDIA tested seven chunking strategies</a> across five datasets in 2024. Page-level chunking won with 0.648 accuracy and 0.107 standard deviation. Query type affected optimal chunk size: factoid queries performed best with 256-512 tokens, analytical queries needed 1024+ tokens.</p> <p><a href="https://research.trychroma.com/evaluating-chunking">Chroma Research found</a> performance varied by up to 9% in recall across methods. LLMSemanticChunker achieved 0.919 recall, ClusterSemanticChunker reached 0.913, and RecursiveCharacterTextSplitter hit 85.4-89.5% (best at 400 tokens: 88.1-89.5%).</p> <p><a href="https://superlinked.com/vectorhub/articles/evaluation-rag-retrieval-chunking-methods">Superlinked's HotpotQA tests</a> showed SentenceSplitter outperformed semantic approaches with ColBERT v2 embeddings. Embedding model choice matters as much as chunking strategy.</p> <p>More recent research reinforces some of these patterns and challenges others. A <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12649634/">peer-reviewed clinical decision support study</a> (MDPI Bioengineering, November 2025) found that adaptive chunking aligned to logical topic boundaries hit 87% accuracy versus 13% for fixed-size baselines, with the gap statistically confirmed at p = 0.001. <a href="https://www.runvecta.com/blog/we-benchmarked-7-chunking-strategies-most-advice-was-wrong">Vecta's February 2026 benchmark</a> of 7 strategies across 50 academic papers placed recursive 512-token splitting first at 69% accuracy, while semantic chunking landed at 54% after producing fragments averaging just 43 tokens.</p> <p>On context length, Chroma's <a href="https://research.trychroma.com/context-rot">context rot research</a> (July 2025) tested 18 models including GPT-4.1, Claude 4, and Gemini 2.5 and found that retrieval performance degrades as context length increases, even on straightforward tasks. A <a href="https://arxiv.org/abs/2601.14123">January 2026 systematic analysis</a> identified a "context cliff" around 2,500 tokens where response quality drops, and separately found that sentence chunking matched semantic chunking up to ~5,000 tokens at a fraction of the cost.</p> <p>Start with RecursiveCharacterTextSplitter at 400-512 tokens with 10-20% overlap. Move to semantic or page-level chunking only if your metrics show you need the extra performance and budget allows for the costs.</p> <H2>Decision framework</H2> <H3>The default choice</H3> <p>Start with RecursiveCharacterTextSplitter:</p> <ul> <li>Chunk size: 400-512 tokens</li> <li>Overlap: 50-100 tokens (10-20%)</li> <li>Separators: <code>["\\n\\n", "\\n", " ", ""]</code> (default) or add <code>". "</code> for better sentence splitting</li> </ul> <p>This handles most text content well: blog posts, documentation, research papers, web articles.</p> <H3>When to use a different approach</H3> <p>You can also combine strategies based on content type. Here's when to pick something else:</p> <div><table><thead><tr><th>Your Situation</th> <th>Use This Strategy</th> <th>Why</th></tr></thead> <tbody><tr><td>Working with PDFs</td> <td>Page-level chunking (details below)</td> <td>Won NVIDIA's benchmarks (0.648 accuracy), handles tables</td></tr> <tr><td>Accuracy is important, budget allows</td> <td>Semantic chunking (details below)</td> <td>Up to 9% better recall, maintains semantic coherence</td></tr> <tr><td>Budget is tight, need speed</td> <td>Size-based chunking (details below)</td> <td>Fastest to implement, no computational overhead</td></tr> <tr><td>Processing code files</td> <td>Recursive with code separators (details below)</td> <td>Respects function/class boundaries</td></tr> <tr><td>Short-form content (tweets, Q&amp;A)</td> <td>Sentence-based chunking (details below)</td> <td>Preserves complete thoughts</td></tr> <tr><td>High-value content, experimental</td> <td>LLM-based chunking (details below)</td> <td>Context-aware, adapts to structure dynamically</td></tr></tbody></table></div> <p><strong>Many production systems use hybrid approaches:</strong> route PDFs to page-level chunking, web pages to recursive splitting, and code to code-aware separators based on file type or content analysis.</p> <H3>Adjust chunk size for your query type</H3> <p>Once you've picked a strategy, tune the chunk size:</p> <ul> <li><strong>Factoid queries</strong> (names, dates, facts): 256-512 tokens for precise matching</li> <li><strong>Analytical queries</strong> (explanations, comparisons): 1024+ tokens for more context</li> <li><strong>Mixed queries</strong>: Start with 400-512 tokens (balanced middle ground)</li> </ul> <p><strong>Conflicting signals?</strong> If your content type suggests one approach (PDFs → page-level) but query type suggests another (factoid → 256-512 tokens), content type usually wins. Test both to confirm.</p> <p>Before going to production, test 2-3 strategies on 50-100 representative documents with 20-30 realistic queries. Measure recall, precision, and answer quality to pick the winner for your use case.</p> <H2>Getting sample data for testing chunking strategies</H2> <p>Testing chunking strategies requires sample data. For this article, we'll use medical and pharmaceutical content because it contains the variety that chunking needs to handle: technical terminology, structured sections, dosage tables, and regulatory information. The challenge is getting this web content clean content without HTML noise.</p> <p>Scraping websites typically gives you HTML mixed with navigation menus, forms, JavaScript elements, and other artifacts. This noise fragments during chunking and pollutes your embeddings. <a href="https://www.firecrawl.dev/glossary/web-scraping-apis/html-cleaning-boilerplate-removal-llm-training">HTML cleaning and boilerplate removal</a> before chunking is what makes the difference between useful embeddings and noisy ones. Clean extraction solves this problem.</p> <H3>Building a test dataset with Firecrawl</H3> <p>Firecrawl extracts clean content from web pages. It renders JavaScript, removes boilerplate elements, and converts everything to markdown or structured JSON while preserving headers, structured data, and document hierarchy.</p> <p>We'll build a test dataset by scraping drug information from Mayo Clinic. Their drug reference pages provide technical depth, clear section structure (Description, Before Using, Proper Use, Precautions, Side Effects), and real-world complexity for testing chunking approaches.</p> <p>The process uses two Firecrawl methods:</p> <ol> <li>Map to discover drug information URLs from the site</li> <li>Batch scrape to extract clean content from those pages</li> </ol> <H3>Setup</H3> <p>First, sign up at <a href="https://firecrawl.dev/">firecrawl.dev</a> and get your API key. Install the SDK:</p> <figure><div><pre><code class="language-bash" data-lang="bash">pip install firecrawl-py python-dotenv</code></pre></div></figure> <p>Save your API key in a <code>.env</code> file:</p> <figure><div><pre><code class="language-bash" data-lang="bash">touch .env
echo "FIRECRAWL_API_KEY='fc-YOUR-KEY-HERE'" &gt;&gt; .env</code></pre></div></figure> <H3>Discovering and scraping drug information</H3> <p>With Firecrawl configured, we'll use the <a href="https://docs.firecrawl.dev/features/map"><code>map</code></a> endpoint to discover drug information pages from Mayo Clinic, then <a href="https://docs.firecrawl.dev/features/batch-scrape"><code>batch_scrape</code></a> to extract their content in parallel:</p> <figure><div><pre><code class="language-python" data-lang="python">from firecrawl import Firecrawl
from dotenv import load_dotenv
import json
from pathlib import Path
 
load_dotenv()
app = Firecrawl()
 
# Step 1: Discover drug information pages with map
map_result = app.map(
    "https://www.mayoclinic.org/drugs-supplements",
    search="drug information oral route",
    limit=10
)
 
# Filter out the index page
drug_urls = [
    link.url for link in map_result.links
    if link.url != "https://www.mayoclinic.org/drugs-supplements"
]
 
print(f"Discovered {len(drug_urls)} drug information pages")</code></pre></div></figure> <p>The <code>map</code> endpoint generates a list of URLs from a site without scraping full page content. The <code>search</code> parameter filters results by relevance, so we get drug information pages rather than navigation or category pages.</p> <p>With URLs in hand, <code>batch_scrape</code> fetches all pages concurrently:</p> <figure><div><pre><code class="language-python" data-lang="python"># Step 2: Batch scrape all discovered drug pages
batch_result = app.batch_scrape(drug_urls, formats=["markdown"])
 
# Process results
documents = []
for doc in batch_result.data:
    documents.append({
        "url": doc.metadata.url if doc.metadata else "",
        "markdown": doc.markdown,
        "title": doc.metadata.title if doc.metadata else "",
        "description": doc.metadata.description if doc.metadata else ""
    })
    print(f"Scraped: {doc.metadata.title if doc.metadata else 'Unknown'}")</code></pre></div></figure> <p>Each result contains clean markdown with the drug information content, preserving sections like Description, Before Using, Proper Use, Precautions, and Side Effects. Save the documents to disk for chunking experiments:</p> <figure><div><pre><code class="language-python" data-lang="python"># Save to disk for chunking experiments
output_dir = Path("data/raw_documents")
output_dir.mkdir(parents=True, exist_ok=True)
 
for i, doc in enumerate(documents):
    filepath = output_dir / f"drug_info_{i:02d}.json"
    with open(filepath, "w") as f:
        json.dump(doc, f, indent=2)
 
print(f"\\nSaved {len(documents)} documents to {output_dir}")</code></pre></div></figure> <p>Output:</p> <figure><div><pre><code class="language-plaintext" data-lang="plaintext">Discovered 13 drug information pages
Scraped: Tramadol (oral route) - Side effects &amp; dosage - Mayo Clinic
Scraped: Tadalafil (oral route) - Side effects &amp; dosage - Mayo Clinic
Scraped: Metformin (oral route) - Side effects &amp; dosage - Mayo Clinic
Scraped: Ibuprofen (oral route) - Side effects &amp; dosage - Mayo Clinic
Scraped: Oxycodone (oral route) - Side effects &amp; dosage - Mayo Clinic
 
Saved 13 documents to data/raw_documents</code></pre></div></figure> <H3>Beyond scraping: agent, browser, and CLI</H3> <p>The <code>scrape</code>, <code>crawl</code>, <code>batch_scrape</code>, and <code>map</code> endpoints cover most data collection needs for chunking pipelines. Firecrawl also has a few features worth knowing about for more complex workflows.</p> <p>The <a href="https://docs.firecrawl.dev/features/agent"><code>/agent</code> endpoint</a> handles cases where you need structured data from the web without writing scraping logic. You describe what you want in plain text, optionally pass a Pydantic schema, and the agent searches, navigates, and returns structured results:</p> <figure><div><pre><code class="language-python" data-lang="python">from pydantic import BaseModel, Field
from typing import List, Optional
 
class DrugInfo(BaseModel):
    name: str = Field(description="Drug name")
    common_uses: Optional[str] = Field(None, description="Primary uses")
    drug_class: Optional[str] = Field(None, description="Drug classification")
 
class DrugList(BaseModel):
    drugs: List[DrugInfo] = Field(description="List of drugs")
 
result = app.agent(
    prompt="Find 3 commonly prescribed oral medications on Mayo Clinic and their primary uses",
    schema=DrugList,
    model="spark-1-mini",
)
 
print(result.data)</code></pre></div></figure> <figure><div><pre><code class="language-plaintext" data-lang="plaintext">{
  "drugs": [
    {"name": "Atorvastatin", "common_uses": "Lower high cholesterol, reduce risk of heart attack and stroke", "drug_class": "HMG-CoA reductase inhibitor (statin)"},
    {"name": "Lisinopril", "common_uses": "Treat high blood pressure and heart failure", "drug_class": "ACE inhibitor"},
    {"name": "Levothyroxine", "common_uses": "Treat hypothyroidism, decrease enlarged thyroid glands", "drug_class": "Thyroid hormone"}
  ]
}</code></pre></div></figure> <p>The agent comes in two models: <code>spark-1-mini</code> (default, 60% cheaper) for straightforward extractions, and <code>spark-1-pro</code> for complex multi-domain research.</p> <p>The <a href="https://docs.firecrawl.dev/features/browser">Browser Sandbox</a> gives agents a secure, managed browser environment with Playwright pre-installed. Each session runs in an isolated sandbox where you can execute Python, JavaScript, or bash commands remotely:</p> <figure><div><pre><code class="language-python" data-lang="python">session = app.browser(ttl=120)
print(session.cdp_url)  # wss://browser.firecrawl.dev/cdp/...
 
result = app.browser_execute(
    session.id,
    code='await page.goto("https://news.ycombinator.com")\\ntitle = await page.title()\\nprint(title)',
    language="python",
)
 
print(result.stdout)  # "Hacker News"
app.delete_browser(session.id)</code></pre></div></figure> <p>For terminal-based workflows, the <a href="https://docs.firecrawl.dev/sdks/cli">Firecrawl CLI</a> supports scraping, searching, crawling, and running the agent from the command line:</p> <figure><div><pre><code class="language-bash" data-lang="bash"># Scrape a page to markdown
firecrawl https://example.com --format markdown --only-main-content
 
# Discover URLs from a site
firecrawl map https://example.com --search "blog" --limit 100
 
# Run the agent
firecrawl agent "Find top 5 AI startups" --wait</code></pre></div></figure> <H3>Why clean extraction matters for chunking</H3> <p>The difference between raw HTML and Firecrawl's markdown becomes clear when you chunk:</p> <p><strong>Raw HTML:</strong> Character-based splitting breaks <code>&lt;div&gt;</code> tags mid-element, fragments dosage tables around form elements, and embeds navigation text in your chunks.</p> <p><strong>Firecrawl markdown:</strong> Section headers (Description, Before Using, Proper Use, Precautions, Side Effects) provide natural split points. Dosage tables stay intact. Medical terminology is properly formatted. Every chunking strategy works better with this clean input.</p> <p>With clean data ready, you can now test chunking strategies on the same content and make fair comparisons. The next section starts with recursive character splitting, the recommended default approach for most text content.</p> <H2>Complete RAG pipeline example</H2> <p>You've seen different chunking strategies and how they work in isolation. Here's how chunking fits into a complete RAG pipeline.</p> <p>A typical RAG workflow follows these steps: collect data, clean it, chunk it, embed it, store it in a vector database, and query. We already covered data collection in the <a href="https://www.firecrawl.dev/blog/best-chunking-strategies-rag#getting-sample-data-for-testing-chunking-strategies">Getting Sample Data</a> section where we scraped drug information with Firecrawl. For a deeper look at the collection and cleaning steps — including <a href="https://www.firecrawl.dev/glossary/web-crawling-apis/deduplicate-crawl-pages-rag">deduplication of crawled pages</a>, format normalization, and validation — our <a href="https://www.firecrawl.dev/blog/ai-data-preparation">RAG data preparation guide</a> covers all of that before chunking begins. When your corpus comes from a list of URLs rather than a single crawl, <a href="https://www.firecrawl.dev/glossary/web-scraping-apis/url-list-to-documents-embeddings">converting those URLs to documents for embeddings</a> via batch scraping is the right first step. Now we'll build the rest of the pipeline, focusing on how the chunking step affects the final system.</p> <H3>The workflow</H3> <p>Here's what a complete pipeline looks like:</p> <ol> <li>Scrape web content with Firecrawl (covered in section 4)</li> <li>Load the clean markdown</li> <li>Chunk the documents (strategy choice matters here)</li> <li>Generate embeddings</li> <li>Store in your vector database</li> <li>Query</li> </ol> <p>We'll build this pipeline with Pinecone and recursive character splitting. You'll see how to swap in different chunking strategies or vector databases later. If you haven't chosen a vector database yet, see our <a href="https://www.firecrawl.dev/blog/best-vector-databases-2025">comparison of 18 options</a> covering Pinecone, Qdrant, Milvus, pgvector, and more.</p> <H3>Building the pipeline with recursive chunking</H3> <p>We'll use the drug information we scraped earlier, chunk it with RecursiveCharacterTextSplitter, and store it in Pinecone. First, install the required packages:</p> <figure><div><pre><code class="language-bash" data-lang="bash">pip install langchain-pinecone langchain-openai pinecone-client langchain-text-splitters python-dotenv</code></pre></div></figure> <p>Set up your environment variables in a <code>.env</code> file:</p> <figure><div><pre><code class="language-bash" data-lang="bash">PINECONE_API_KEY=your-pinecone-key
OPENAI_API_KEY=your-openai-key</code></pre></div></figure> <p>The code below builds the complete pipeline. We'll walk through each step.</p> <H4>Import dependencies and load environment</H4> <figure><div><pre><code class="language-python" data-lang="python">import os
import json
from pathlib import Path
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
 
load_dotenv()</code></pre></div></figure> <p>This imports libraries for vector storage (Pinecone), embeddings (OpenAI), and document chunking (LangChain).</p> <H4>Initialize Pinecone and create index</H4> <figure><div><pre><code class="language-python" data-lang="python"># Initialize Pinecone
pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index_name = "drug-info-rag"
 
# Create index if it doesn't exist
if not pc.has_index(index_name):
    pc.create_index(
        name=index_name,
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )</code></pre></div></figure> <p>This connects to Pinecone and creates a serverless index configured for OpenAI's <code>text-embedding-3-small</code> model (1536 dimensions) using cosine similarity.</p> <H4>Set up embeddings and vector store</H4> <figure><div><pre><code class="language-python" data-lang="python"># Set up vector store
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
index = pc.Index(index_name)
vector_store = PineconeVectorStore(index=index, embedding=embeddings)</code></pre></div></figure> <p>This initializes the OpenAI embeddings model and connects it to our Pinecone index through LangChain's vector store wrapper.</p> <H4>Load documents</H4> <figure><div><pre><code class="language-python" data-lang="python"># Load the scraped drug information
documents = []
data_dir = Path("data/raw_documents")
 
for json_file in data_dir.glob("drug_info_*.json"):
    with open(json_file) as f:
        doc_data = json.load(f)
        documents.append(
            Document(
                page_content=doc_data["markdown"],
                metadata={"source": doc_data["title"], "url": doc_data["url"]}
            )
        )
 
print(f"Loaded {len(documents)} documents")</code></pre></div></figure> <p>This reads the JSON files containing our scraped drug information and converts them to LangChain <code>Document</code> objects, preserving the title and URL as metadata.</p> <H4>Chunk documents with recursive splitting</H4> <figure><div><pre><code class="language-python" data-lang="python"># Chunk with recursive character splitter
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\\n\\n", "\\n", ". ", " ", ""]
)
 
chunks = splitter.split_documents(documents)
print(f"Created {len(chunks)} chunks from {len(documents)} documents")
print(f"Average chunk size: {sum(len(c.page_content) for c in chunks) // len(chunks)} characters")</code></pre></div></figure> <p>Chunking strategy matters here. We're using recursive character splitting with 500-character chunks and 50-character overlap. The separator hierarchy (<code>["\\n\\n", "\\n", ". ", " ", ""]</code>) means the splitter tries paragraph breaks first, then line breaks, then sentence boundaries, then word boundaries. This preserves the document structure we got from Firecrawl's clean markdown.</p> <p>The output shows how many chunks we created and their average size.</p> <H4>Add to Pinecone and query</H4> <figure><div><pre><code class="language-python" data-lang="python"># Add chunks to Pinecone
vector_store.add_documents(chunks)
print("Added chunks to Pinecone")
 
# Query the system
query = "What are the side effects of sertraline?"
results = vector_store.similarity_search(query, k=3)
 
print(f"\\nQuery: '{query}'\\n")
for i, result in enumerate(results, 1):
    print(f"Result {i} (from {result.metadata['source']}):")
    print(result.page_content[:200] + "...\\n")</code></pre></div></figure> <p>This uploads all chunks to Pinecone with their embeddings, then performs a semantic search for information about sertraline side effects. The system retrieves the top 3 most similar chunks.</p> <p><strong>Output:</strong></p> <figure><div><pre><code class="language-plaintext" data-lang="plaintext">Loaded 9 documents
Created 127 chunks from 9 documents
Average chunk size: 456 characters
Added chunks to Pinecone
 
Query: 'What are the side effects of sertraline?'
 
Result 1 (from Sertraline (oral route) - Side effects &amp; dosage - Mayo Clinic):
## Side effects
 
Along with its needed effects, a medicine may cause some unwanted effects. Although not all of these side effects may occur, if they do occur they may need medical attention.
 
Check with your doctor...</code></pre></div></figure> <p>The chunking strategy directly affected these results. Because we used recursive splitting with sentence boundaries, each chunk contains complete thoughts about side effects. The 500-character size was large enough to capture multiple related side effects in each chunk, giving the LLM good context for answering the question.</p> <H3>Testing different chunking strategies</H3> <p>You can test how chunking strategy affects retrieval by changing just the splitter configuration. Here's semantic chunking instead:</p> <figure><div><pre><code class="language-python" data-lang="python">from langchain_experimental.text_splitter import SemanticChunker
 
# Replace the RecursiveCharacterTextSplitter with SemanticChunker
semantic_splitter = SemanticChunker(
    embeddings=embeddings,
    breakpoint_threshold_type="percentile"
)
 
semantic_chunks = semantic_splitter.split_documents(documents)
print(f"Semantic chunking created {len(semantic_chunks)} chunks")</code></pre></div></figure> <p>Semantic chunking will create fewer, larger chunks because it groups sentences by semantic similarity rather than character count. You'd then add these chunks to a different Pinecone index and compare retrieval quality for your specific queries.</p> <p>The same pattern works for other strategies: swap the splitter, re-chunk, compare results.</p> <H3>Adapting for other vector databases</H3> <p>The pattern stays the same across all <a href="https://www.firecrawl.dev/blog/best-vector-databases-2025">vector databases</a>: load data, chunk it, embed it, store it. Only the vector store setup changes.</p> <p>For <strong>Qdrant</strong>:</p> <figure><div><pre><code class="language-python" data-lang="python">from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
 
client = QdrantClient(url="http://localhost:6333")
vector_store = QdrantVectorStore(
    client=client,
    collection_name="drug-info",
    embedding=embeddings
)
vector_store.add_documents(chunks)</code></pre></div></figure> <p>For <strong>Weaviate</strong>:</p> <figure><div><pre><code class="language-python" data-lang="python">from langchain_weaviate import WeaviateVectorStore
import weaviate
 
with weaviate.connect_to_local() as client:
    vector_store = WeaviateVectorStore(
        client=client,
        index_name="DrugInfo",
        text_key="text",
        embedding=embeddings
    )
    vector_store.add_documents(chunks)</code></pre></div></figure> <p>For <strong>ChromaDB</strong>:</p> <figure><div><pre><code class="language-python" data-lang="python">from langchain_chroma import Chroma
 
vector_store = Chroma(
    collection_name="drug-info",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)
vector_store.add_documents(chunks)</code></pre></div></figure> <p>For <strong>pgvector</strong> (PostgreSQL):</p> <figure><div><pre><code class="language-python" data-lang="python">from langchain_postgres import PGVector
 
connection_string = "postgresql://user:pass@localhost:5432/vectordb"
vector_store = PGVector(
    connection_string=connection_string,
    collection_name="drug_info",
    embedding_function=embeddings
)
vector_store.add_documents(chunks)</code></pre></div></figure> <p>The chunking logic stays identical across all of these. You use the same <code>RecursiveCharacterTextSplitter</code> (or any other strategy) and the same chunks. The vector database handles storage and retrieval, but the chunking quality determines what gets stored.</p> <p>This is why chunking strategy matters more than vector database choice for many applications. A well-chunked document retrieves better regardless of which database you use. Poor chunking degrades retrieval even on the fastest vector database.</p> <H2>Which chunking strategy should you use?</H2> <p>No single chunking strategy is universally best. Page-level chunking won NVIDIA's benchmarks with 0.648 accuracy and the lowest variance across document types. Semantic chunking can improve recall by up to 9% over simpler methods. RecursiveCharacterTextSplitter with 400-512 tokens delivered 85-90% recall in Chroma's tests without the computational overhead, making it a solid default for most teams.</p> <p>The benchmarks in this article used specific datasets, embedding models, and query patterns that probably differ from yours. Your chunking choice determines what your vector database stores, which determines what your RAG system can retrieve. Track your metrics over time: recall shows whether you're retrieving relevant chunks, precision shows whether those chunks are actually useful, MRR and NDCG measure ranking quality.</p></div><H2>Frequently Asked Questions</H2> <H3>What is the best chunking strategy for RAG?</H3><p>There's no single best strategy. Recursive character splitting at 400-512 tokens with 10-20% overlap works well for most text content and is the recommended starting point. Page-level chunking performs best for PDFs and paginated documents. Semantic chunking gives higher recall but costs more to run. Your best bet is testing 2-3 strategies on your actual documents and queries.</p><H3>What chunk size should I use?</H3><p>It depends on your query patterns. Factoid queries (names, dates, specific facts) perform best with 256-512 tokens. Analytical queries (explanations, comparisons) need 1024+ tokens for enough context. If you handle a mix of both, start with 400-512 tokens as a balanced middle ground.</p><H3>Does chunk overlap matter?</H3><p>Yes. Overlap (sliding windows) prevents information loss at chunk boundaries. If a sentence gets split across two chunks, overlap ensures both contain the complete thought. Start with 10-20% of your chunk size as overlap. A 500-token chunk should have 50-100 tokens of overlap.</p><H3>How is chunking for LLMs different from chunking for search?</H3><p>Chunking strategies for LLMs prioritize preserving semantic coherence so the model gets enough context to reason about the content. Search-oriented chunking prioritizes precision so each chunk matches a narrow query. In practice, most RAG systems need both — chunks that are focused enough to retrieve accurately but large enough for the LLM to generate a good answer.</p><H3>Should I use semantic chunking or recursive splitting?</H3><p>Start with recursive splitting. Chroma's research showed it delivers 85-90% recall at 400 tokens, while semantic chunking reaches 91-92%. That 2-3% improvement costs embedding every sentence in your documents, which means API calls or local model inference for the chunking step alone. Semantic chunking makes sense when accuracy is your top priority and budget allows for the extra processing.</p><H3>How do I chunk code files?</H3><p>Use recursive character splitting with code-aware separators. Prioritize splitting at class definitions (\\n\\nclass), function definitions (\\n\\ndef), then fall back to paragraph and line breaks. This keeps functions and classes intact as single chunks instead of fragmenting them mid-logic.</p><H3>What tools do I need to clean web content before chunking?</H3><p>Raw HTML creates noisy chunks full of navigation elements, scripts, and boilerplate. Firecrawl converts web pages to clean markdown with headers, lists, and tables preserved, giving every chunking strategy better input to work with. The difference matters because clean markdown provides natural split points that structure-aware chunkers can use.</p><H3>Can I combine multiple chunking strategies?</H3><p>Yes, and many production systems do. A common pattern is routing documents by type: PDFs go through page-level chunking, web content gets recursive splitting, and code files use code-aware separators. You can build this routing logic based on file extension, MIME type, or content analysis.</p></article>
