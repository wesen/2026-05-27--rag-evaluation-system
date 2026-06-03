---
title: "The Role of Data Preprocessing in RAG - deepset"
source: "https://www.deepset.ai/blog/preprocessing-rag"
extracted: 2026-06-02T17:52:55-04:00
---

# The Role of Data Preprocessing in RAG

Source: https://www.deepset.ai/blog/preprocessing-rag

"Products and Services
Solutions
Resources
Company
TRY FOR FREE
DEMO/CONTACT
Monthly updates on making AI work for you. Delivered to your inbox.
SIGN UP NOW
BACK TO RESOURCES
BLOG
AI ARCHITECTURE
AI FUNDAMENTALS
AI BEST PRACTICES
The Role of Data Preprocessing in RAG

Half of a Retrieval Augmented Generation project is data preparation and indexing

By
Isabelle Nguyen
Published on
September 25, 2024
8
min read

At deepset, we've helped our customers build countless RAG (Retrieval Augmented Generation) pipelines for a variety of use cases. We've talked about how to extend a basic RAG setup with components to fit any application.

‍

But when we start working with customers on a new project, we often discuss a different process: Preprocessing, which involves indexing. Getting this step right is a critical requirement for running any RAG application in the first place. So in this blog post, we're going to talk about preprocessing: what it is, why it's important, and how to customize it for your use case.

What is preprocessing?

Preprocessing is the action of preparing your files so that your RAG system can use them to generate the best possible answers. Preprocessing, indexing, and RAG itself work in tandem, and can only be evaluated and tuned together, which is why they're sometimes referred to collectively as the RAG system.

‍

But there's an advantage to discussing preprocessing in isolation: as an action, preparing and adding data to the database is very different, almost complementary, to retrieving and further processing that data. Also, preprocessing and indexing are relevant to other applications as well, not just RAG. So, in good Compound AI fashion, we'll separate it from the rest and look at it in isolation.

‍

For an initial examination of the steps involved in preprocessing, we'll consider only text data. Later, we'll discuss other types of data as well.

Step 1: Examining and extracting the data

Data comes in many forms. To set up your preprocessing pipeline correctly, you need to understand it: What file formats are in your dataset? Is your data all in the same format, or are you dealing with different file types (text, powerpoint, excel, pdf, etc.?) or even data types? Based on the answers to these questions, you can choose the right tools to extract the data contained in your files and unify it for further processing.

Step 2: Cleaning the data

The purpose of preprocessing is to make your data \\"RAG-ready\\" while preserving the information it contains. To do this, it's useful to strip the data of format-specific characters that contain no information, such as extra whitespace, blank lines, specified substrings, regexes, page headers and footers. However, some of this data could also be converted into metadata to preserve important information about the document structure that will help you later.

Step 3: Chunking the data

Language processing algorithms and models have implicit preferences for the length of text snippets they can process. In this step, you chunk your text data into smaller pieces so that they arrive at the optimal length. There are many strategies for data chunking, largely dictated by the indexing technique we're going to use. While many embedding models used to require text snippets between 200 and 300 words, we're now often looking at models that can handle larger chunks of text, such as entire PDF pages, or even entire multi-page documents in \\"long-context\\" setups.

Step 4: Adding metadata

The term \\"metadata\\" refers to labels that tell you more about your data, such as when a data point was created, who created it, and so on. During the chunking process, you can also extract metadata from your original data and add it to your cleaned and chunked snippets. For example, you might want to retain information about what page a snippet came from, what header it was published under, or what snippet comes immediately after it. This adds context that can be very helpful in finding the right information later. 

Step 5: Indexing the data

Finally, your data is ready to be indexed. This crucial step involves converting the content into fixed-size vectors, storing these vectors along with the original text and associated metadata, and organizing everything into the format required by the underlying database. This indexing process is arguably the most important part of our preprocessing pipeline, so let's discuss it in more detail.

A closer look at indexing

Indexing is the process of adding data to a database so that it can be easily retrieved. It is therefore complementary to retrieval. You can use sparse or dense methods to index data. The most popular sparse method is BM25, a ranking algorithm. Dense methods use language models (also known as embedding models). Sparse and dense methods complement each other and are often used together in a hybrid setup. What's important is that you use the same method that will be used to retrieve your data later.

‍

We said earlier that language models dictate some of the other preprocessing steps. For example, the language model you choose to embed your text chunks will determine how long your text chunks can be. If you change your retriever model in the RAG pipeline itself, you'll also need to reindex all your data using the same model to embed it.

‍

As for your metadata, it will be indexed along with the text data itself, so it can serve as a future filter or other context enhancer. 

Advanced indexing pipelines

In modern AI product development, customization isn't just a feature, it's a guiding principle. So, just as the RAG pipeline itself, your indexing pipeline will be unique to your business use case, and therefore will need to be adapted as you go through iterative development cycles. Here, we'll look at three components you may want to add to your basic preprocessing pipeline. 

Named Entity Recognition (NER) for metadata extraction

Imagine you are building an AI assistant for historical events. It would be critical for users to be able to ask questions about people and places. So in your preprocessing pipeline, you can include a component that uses a small language model to identify named entities and store them as metadata along with your text. These named entities can then be used as a filter at query time.

Language classification

If you have a large multilingual document collection, it's important to know what language each document is in. You can add a classifier to your indexing pipeline and have it generate language labels to add as metadata to each document.

Semantic chunking

Rule-based chunking strategies run the risk of losing information. Consider the following sentences: \\"The cat was sleeping. He had eaten well.\\" If your chunking strategy happens to split this down the middle and store it in separate chunks, you won't know what \\"he\\" refers to. That's why semantic chunking has gained popularity, which uses an embedding model to segment text while preserving context.

Multimodal

Text is only one type of data, and LLMs are equipped to handle all types of data, such as tables and images. In business contexts, it is common to deal with documents that contain tables and charts, for example. During preprocessing, you'll need to use special models to extract these types of data from a document.

‍

Getting your indexing pipeline right is critical to the success of your RAG project. So you should be prepared to devote sufficient time and resources to this step – in our experience, it accounts for about 50 percent of your RAG project.

Preprocessing and indexing in production

It's relatively easy to index a few documents on one machine, but production systems often need to process millions of files quickly.  In production, you'll need to consider factors such as throughput (how many files can be processed in a given time) and latency (how quickly new information is available for retrieval).

‍

Production indexing systems often use distributed architectures to meet these challenges. They may queue indexing requests and use multiple machines to process files in parallel. Technologies such as Kubernetes can be used to automatically scale the number of indexing processors based on demand. This scalable approach allows the system to handle large amounts of data and integrate new information quickly.

Out-of-the-box customization and scaling of indexing pipelines with Haystack

Haystack Enterprise Platform (formerly known as deepset AI Platform) excels in indexing due to its speed, flexibility and comprehensiveness. It uses a parallel approach to significantly speed up the indexing process. This feature is particularly beneficial for workflows that require frequent re-indexing, such as when experimenting with different embedding models.

‍

The platform's modular indexing pipelines are easy to customize, allowing users to quickly add components. Furthermore, Haystack offers a \\"set and forget\\" approach to data uploads, automatically managing dependencies and providing options for replacing or adding new data, streamlining the entire indexing process.

MEET THE AUTHOR
Isabelle Nguyen
Technical Content Writer
TABLE OF CONTENTS
What is preprocessing?
A closer look at indexing
Advanced indexing pipelines
Preprocessing and indexing in production
Out-of-the-box customization and scaling of indexing pipelines with Haystack
GET STARTED WITH A PERSONALIZED DEEPSET DEMO
BOOK DEMO
Explore Related Content
June 2, 2026

Why Enterprise AI Costs Are Spiralling & How Sovereign AI Fixes the Economics

Enterprise AI costs are spiralling due to model mismatch, context bloat, agentic complexity, and weak governance. Learn why a sovereign AI approach is the key to controlling spend at scale.

BLOG
May 21, 2026

Harness Engineering: How to Build Reliable AI Agents by Engineering the System, Not the Model

Agent reliability doesn't come from picking the right model, it comes from engineering the system around it. Learn what harness engineering is, how to classify and fix agent failures, and how to build production-grade agent harnesses with Haystack.

BLOG
January 22, 2026

Context Engineering: The Next Frontier Beyond Prompt Engineering

This article explores how designing the right informational environment is the key to building sophisticated, enterprise-ready AI application and agents in 2026.

BLOG
January 22, 2026

Sovereign AI: What It Is, Why It Matters, and How to Build It

This article explores the key motivations for the increasing awareness and adoption of sovereign AI systems, the underlying infrastructure and design principles, and evolving challenges and opportunities.

BLOG
SEE WHY ORGANIZATIONS LIKE AIRBUS, THE ECONOMIST, AND OAKNORTH CHOOSE DEEPSET.
BOOK DEMO
EXPLORE HAYSTACK ENTERRISE PLATFORM
PRODUCT AND SERVICES
Overview
PLATFORM
Haystack
Haystack Enterprise Starter
Haystack Enterprise Platform
Haystack Enterprise Platform Trial
Haystack Docs
Platform Docs
Trust Center
INDUSTRY SOLUTIONS
Government and Defense
Financial Services
Media and Publishing
Legal
Manufacturing
Technology
Health and Life Sciences
Retail and Consumer Goods
TECHNICAL SOLUTIONS
AI Agents
Retrieval Augmented Generation (RAG)
Intelligent Document Processing (IDP)
Enterprise Search
Text-to-SQL
RESOURCES
Resource Center
Case Studies
Webinars
Reports & Guides
Blog
Documentation
ABOUT
About Us
Partner
News
Careers
OFFICES
HQ Berlin
HQ New York
CONTACT
Contact Us
Get In-Depth Learning &  News in Your Inbox
Email*
deepset will use your contact information to share product and service updates. You can unsubscribe anytime. Learn more in our Privacy Policy.
Privacy Settings
Privacy
Imprint
Terms and Conditions
Made by Refokus"