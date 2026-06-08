---
Title: "TTC Data Handbook for IR Work"
Slug: "ttc-data-handbook"
Short: "Understand the TTC WordPress/WooCommerce SQLite export, its RAG-facing views, and the retrieval patterns it supports."
Topics:
- rag
- sqlite
- mysql
- wordpress
- ttc
- ir
Commands:
- rag-eval
Flags: []
IsTopLevel: false
IsTemplate: false
ShowPerDefault: true
SectionType: GeneralTopic
---

This handbook explains the TTC data export for engineers doing information retrieval work. It describes what data exists, where it came from, how it is represented in SQLite, which fields are safe to query first, and which source-system details require caution.

The short version is this: start with `view_products` for product retrieval and `view_documents` for non-product content retrieval. Use `search_markdown` when constructing prompt context, use `search_text` or `documents_fts` for full-text matching, and join the normalized tables only when you need precise filters or product facts.

## Data source and export location

The source data is a TTC WordPress/WooCommerce MySQL dump:

```text
/home/manuel/code/ttc/ttc/ttc_dev_dump.sql.bz2
```

The dump is loaded into a local MySQL 8 container:

```text
container: rageval-ttc-mysql
database:  ttc
user:      ttc
password:  ttc
port:      3347 -> 3306
```

The RAG-facing SQLite export is generated at:

```text
data/ttc-wordpress-rag.sqlite
```

The reproducible export scripts live in the TTC export ticket:

```text
ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts
```

The important scripts are:

```text
01-setup-mysql-container.sh          # start/create MySQL and import dump when needed
02-export-documents.sql              # products, posts, pages, FAQs, guides
03-export-document-terms.sql         # categories, tags, attributes, taxonomy terms
04-export-product-details.sql        # WooCommerce and tree-info product facts
05-export-product-variants.sql       # variation SKUs, sizes, stock, prices
06-export-selected-meta.sql          # selected raw postmeta for debugging
07-export-ttc-wordpress-to-sqlite.py # main exporter and SQLite schema
08-validate-ttc-sqlite.sh            # validation queries
09-docker-compose.mysql.yml          # compose definition for the MySQL source
```

## Why the SQLite schema does not mirror WordPress

WordPress stores content and metadata in a flexible schema. That flexibility is useful for WordPress plugins, but it is not a good retrieval schema. A product answer may require `wp_posts.post_title`, `wp_posts.post_content`, `_sku`, `_stock_status`, `_treeinfo_botanical_name`, `product_cat`, `pa_growing-zone`, and multiple variation rows. Those fields are spread across several tables.

The SQLite export reshapes the data around IR tasks:

- A retriever needs one row per retrievable unit.
- A reranker or prompt builder needs clean text and Markdown context.
- A product QA flow needs product facts without parsing raw postmeta.
- A category-aware search flow needs normalized terms and attributes.
- A debugging workflow needs selected raw metadata to explain where a value came from.

The schema therefore keeps both normalized tables and bot-friendly views. The normalized tables preserve precision. The views make common retrieval queries easy.

## Current corpus shape

The current export contains:

```text
documents:         3258
document_terms:    123457
product_details:   2600
product_variants:  12179
document_meta:     59212
view_products:     2600
view_documents:    658
```

Documents by kind:

```text
product:    2600
post:        483
page:        121
faq:          35
ttc_guide:    19
```

These counts are useful sanity checks. If a future export changes them substantially, inspect the source dump, post status filters, and post type filters before assuming the retrieval results are comparable.

## The two views to use first

Most IR experiments should start with two SQLite views.

### `view_products`

`view_products` exposes one row per product. It joins product documents with product facts, categories, product attributes, tags, plain text, and Markdown context.

Important columns:

```text
doc_id
wp_id
title
slug
url
sku
product_type
stock_status
price
regular_price
sale_price
botanical_name
hardiness_zone
sunlight
soil_conditions
drought_tolerance
mature_height
mature_width
categories
attributes
content_text
excerpt_text
content_markdown
excerpt_markdown
search_text
search_markdown
```

Use this view when the task asks about products, plant properties, categories, shipping exclusions, SKU-level product identity, product descriptions, or commercially relevant product facts.

A minimal product query:

```sql
SELECT doc_id, title, sku, categories, attributes, search_markdown
FROM view_products
WHERE search_text LIKE '%cypress%'
LIMIT 20;
```

A category-aware product query:

```sql
SELECT doc_id, title, sku, botanical_name, hardiness_zone, search_markdown
FROM view_products
WHERE categories LIKE '%Privacy Trees%'
  AND search_text LIKE '%thuja%'
LIMIT 20;
```

### `view_documents`

`view_documents` exposes one row per non-product document. It includes posts, pages, FAQs, and TTC guides.

Important columns:

```text
doc_id
wp_id
kind
title
slug
url
post_date
post_modified
categories
tags
content_text
excerpt_text
content_markdown
excerpt_markdown
search_text
search_markdown
```

Use this view when the task asks about editorial content, care guides, policy pages, FAQs, or site information that is not a product listing.

A minimal non-product query:

```sql
SELECT doc_id, kind, title, categories, search_markdown
FROM view_documents
WHERE search_text LIKE '%planting%'
LIMIT 20;
```

An FAQ query:

```sql
SELECT doc_id, title, categories, search_markdown
FROM view_documents
WHERE kind = 'faq'
  AND categories LIKE '%Shipping%';
```

## Text fields and when to use them

The export stores both plain text and Markdown. This is intentional. Text retrieval and prompt construction have different needs.

| Field | Where it appears | Use it when |
|---|---|---|
| `content_text` | `documents`, both views | You need clean body text without markup. |
| `excerpt_text` | `documents`, both views | You need short description or excerpt text. |
| `content_markdown` | `documents`, both views | You want section headings, links, lists, and readable prompt context. |
| `excerpt_markdown` | `documents`, both views | You want structured short description context. |
| `search_text` | `documents`, both views, FTS source | You need plain retrieval text enriched with categories, attributes, product facts, and variants. |
| `search_markdown` | `documents`, both views | You need prompt-ready retrieval context with Markdown body plus enrichment lines. |

For initial retrieval, use `search_text` or `documents_fts`. For answer generation, use `search_markdown` unless you have a reason to remove structure.

A product Markdown sample begins like this:

```markdown
# Thuja Green Giant

When you need a large screen or wind-break, Thuja Green Giant is the perfect choice...
```

An editorial Markdown sample begins like this:

```markdown
## Introduction

Gardeners today have access to a wide variety of evergreen trees...
```

The Markdown converter preserves headings, links, lists, emphasis, blockquotes, code blocks, image references, and simple table text. It removes script/style/noscript tags and Gutenberg HTML comments.

## Full-text search

The export includes an FTS5 table:

```text
documents_fts(doc_id, kind, title, search_text)
```

Use it for simple full-text experiments:

```sql
SELECT d.doc_id, d.kind, d.title
FROM documents_fts f
JOIN documents d ON d.doc_id = f.doc_id
WHERE documents_fts MATCH 'thuja privacy'
LIMIT 10;
```

FTS is currently basic. It indexes enriched `search_text`, but it does not implement field weights, category boosts, product/document routing, semantic embeddings, or reranking. Those choices belong in the IR experiment layer.

The FTS table is useful for:

- quick sanity checks;
- BM25-style baselines;
- candidate generation before reranking;
- comparing product-only and document-only retrieval behavior.

It is not a complete production retrieval strategy by itself.

## Normalized tables for precise filters

The two views are easiest to use, but the normalized tables matter when experiments need exact filters.

### `documents`

`documents` is the central table. Every exported product, post, page, FAQ, and guide has one row.

```sql
SELECT doc_id, wp_id, kind, title, slug
FROM documents
WHERE kind IN ('post', 'ttc_guide')
ORDER BY post_modified DESC
LIMIT 20;
```

### `document_terms`

`document_terms` stores taxonomy relationships. This includes WordPress categories, post tags, product categories, product tags, product attributes, FAQ categories, and guide categories.

```sql
SELECT taxonomy, term_name, COUNT(*) AS docs
FROM document_terms
GROUP BY taxonomy, term_name
ORDER BY docs DESC
LIMIT 30;
```

Common taxonomy families:

```text
category              editorial categories
post_tag              editorial tags
product_cat           WooCommerce product categories
product_tag           WooCommerce product tags
faq_categories        FAQ categories
ttc_guide_categories  guide categories
pa_*                  WooCommerce product attributes
```

Use this table for exact filtering rather than matching text inside the view `categories` column.

```sql
SELECT d.doc_id, d.title
FROM documents d
JOIN document_terms t ON t.doc_id = d.doc_id
WHERE t.taxonomy = 'product_cat'
  AND t.term_name = 'Cypress Trees';
```

### `product_details`

`product_details` stores product facts extracted from WooCommerce postmeta and TTC tree-info fields.

```sql
SELECT d.title, pd.sku, pd.botanical_name, pd.hardiness_zone, pd.sunlight
FROM product_details pd
JOIN documents d ON d.doc_id = pd.doc_id
WHERE pd.hardiness_zone LIKE '%5-9%';
```

Important fields include:

```text
sku
product_type
stock_status
price
regular_price
sale_price
botanical_name
hardiness_zone
sunlight
soil_conditions
drought_tolerance
mature_height
mature_width
```

Treat price fields carefully. WooCommerce variable products can store aggregate or range-related values. Do not assume every `price` value is a single customer-facing price.

### `product_variants`

`product_variants` stores child variation rows. These rows are linked to product documents by `parent_doc_id`.

```sql
SELECT d.title, v.variant_wp_id, v.sku, v.size, v.price, v.stock_status
FROM product_variants v
JOIN documents d ON d.doc_id = v.parent_doc_id
WHERE d.title = 'Thuja Green Giant'
ORDER BY v.variant_wp_id;
```

Use this table when SKU, size, or variation-level availability matters. Do not expand variants into independent RAG documents unless the retrieval task specifically requires SKU-level documents.

### `document_meta`

`document_meta` stores selected raw postmeta values. It exists for debugging and future extraction work.

```sql
SELECT meta_key, meta_value
FROM document_meta
WHERE doc_id = 'wp:3699'
ORDER BY meta_key;
```

Use semantic tables first. Use `document_meta` when you need to verify an extracted value or inspect a raw field not yet modeled.

## Query patterns for IR experiments

### Product-only baseline

This query gives a simple product corpus with prompt-ready context.

```sql
SELECT doc_id, title, search_markdown
FROM view_products
WHERE search_text LIKE '%' || :query || '%'
LIMIT 50;
```

Use this as a first baseline when evaluating product retrieval without editorial content.

### Non-product baseline

This query gives posts, pages, FAQs, and guides.

```sql
SELECT doc_id, kind, title, search_markdown
FROM view_documents
WHERE search_text LIKE '%' || :query || '%'
LIMIT 50;
```

Use this when evaluating care-guide retrieval, FAQ retrieval, or policy-page retrieval.

### Mixed FTS baseline

This query uses FTS across all documents.

```sql
SELECT d.doc_id, d.kind, d.title, d.search_markdown
FROM documents_fts f
JOIN documents d ON d.doc_id = f.doc_id
WHERE documents_fts MATCH :query
LIMIT 50;
```

Use this for a simple BM25-style baseline over the whole corpus.

### Category-filtered retrieval

Use `document_terms` for exact filtering.

```sql
SELECT p.doc_id, p.title, p.search_markdown
FROM view_products p
JOIN document_terms t ON t.doc_id = p.doc_id
WHERE t.taxonomy = 'product_cat'
  AND t.term_name = :category
  AND p.search_text LIKE '%' || :query || '%'
LIMIT 50;
```

This avoids false positives from category names that happen to appear in body text.

### Prompt context construction

A simple prompt context row can be built directly from a view:

```sql
SELECT
  doc_id,
  title,
  categories,
  search_markdown AS context
FROM view_products
WHERE doc_id = :doc_id;
```

For products, include product facts explicitly when generating final answer context:

```sql
SELECT
  title,
  sku,
  botanical_name,
  hardiness_zone,
  sunlight,
  stock_status,
  categories,
  search_markdown
FROM view_products
WHERE doc_id = :doc_id;
```

## Data quality notes

The corpus is useful but not uniform. IR experiments should account for the following details.

| Issue | Effect on retrieval | Recommended handling |
|---|---|---|
| Products and editorial documents have different structure. | Product fields may dominate search text differently from guide prose. | Evaluate product-only and document-only retrieval separately before mixing. |
| Product categories and attributes are numerous. | Category terms can improve recall but also add repetitive text. | Use `document_terms` for filters; use view attributes for prompt context. |
| Variable product prices can be aggregate values. | A generated answer may present misleading prices. | Treat price fields as metadata requiring domain validation. |
| WordPress shortcodes appear in content. | Some shortcode text may remain in Markdown or text output. | Inspect `content_markdown` samples for queries where formatting matters. |
| Page content includes state landing pages and site utility pages. | Broad FTS queries can return pages before product or guide content. | Filter by `kind`, category, or product view when evaluating specific tasks. |
| Parent relationships are not fully modeled. | Hierarchical pages are not represented as linked trees. | Add a relationship table if page hierarchy becomes relevant. |

## Rebuilding and validating the export

Run the setup script if the MySQL container is not available:

```bash
ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/01-setup-mysql-container.sh
```

Run the exporter:

```bash
python3 ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/07-export-ttc-wordpress-to-sqlite.py \
  --sqlite data/ttc-wordpress-rag.sqlite
```

Run validation:

```bash
ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/08-validate-ttc-sqlite.sh \
  data/ttc-wordpress-rag.sqlite
```

Check SQLite integrity:

```bash
sqlite3 data/ttc-wordpress-rag.sqlite "PRAGMA integrity_check;"
```

Expected result:

```text
ok
```

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| `mysql failed for ...` | The MySQL container is not running, credentials changed, or the dump was not imported. | Run `01-setup-mysql-container.sh`, then check `docker ps` and `SELECT COUNT(*) FROM wp_posts`. |
| JSON decode errors from MySQL output | Raw MySQL batch output is not safe for long WordPress JSON. | Keep the exporter base64 wrapper around each SQL query. Do not remove it. |
| `FOREIGN KEY constraint failed` during export | A relationship points to a document outside the exported set or loaded out of order. | Keep parent relationships nullable or model them in a separate relationship table. |
| Markdown contains `wp:heading` or similar block text | Gutenberg comments were not removed before conversion. | Ensure BeautifulSoup `Comment` nodes are removed in the exporter. |
| Product retrieval returns state pages or guide pages | The query searched the mixed `documents_fts` corpus. | Use `view_products` for product-only retrieval or filter `documents.kind = 'product'`. |
| Price values look too high or not like storefront prices | Variable product metadata can contain aggregate values. | Treat price fields as metadata and validate price semantics before answer generation. |

## See Also

- `ttc-sqlite-export-runbook` — the ticket runbook for recreating and validating the SQLite database.
- `RAGEVAL-TTC-SQLITE-EXPORT` ticket diary — chronological implementation details and failure history.
- `scripts/07-export-ttc-wordpress-to-sqlite.py` — the source of truth for the SQLite schema and views.
- `scripts/08-validate-ttc-sqlite.sh` — current validation queries and expected sample output.
