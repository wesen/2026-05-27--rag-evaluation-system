---
Title: TTC SQLite export runbook
Ticket: RAGEVAL-TTC-SQLITE-EXPORT
Status: active
Topics:
    - rag
    - sqlite
    - mysql
    - wordpress
    - ttc
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: data/ttc-wordpress-rag.sqlite
      Note: Generated TTC RAG SQLite database
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/01-setup-mysql-container.sh
      Note: Idempotent Docker/MySQL setup and dump import
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/02-export-documents.sql
      Note: Source query for product/post/page/FAQ/guide documents
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/03-export-document-terms.sql
      Note: Source query for categories/tags/product attributes
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/04-export-product-details.sql
      Note: Source query for WooCommerce and tree-info product facts
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/05-export-product-variants.sql
      Note: Source query for product variation SKU/size/stock facts
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/06-export-selected-meta.sql
      Note: Source query for selected raw postmeta
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/07-export-ttc-wordpress-to-sqlite.py
      Note: Main exporter and SQLite schema
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/08-validate-ttc-sqlite.sh
      Note: Validation queries for counts/categories/product detail/FTS
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/09-docker-compose.mysql.yml
      Note: Compose definition for MySQL source container
ExternalSources: []
Summary: Copy/paste runbook for exporting TTC WordPress/WooCommerce content into a compact SQLite RAG database.
LastUpdated: 2026-06-02T23:40:00-04:00
WhatFor: Rerun, validate, and inspect the TTC WordPress-to-SQLite export without rereading the implementation diary.
WhenToUse: Use when recreating data/ttc-wordpress-rag.sqlite, debugging the MySQL source container, or writing RAG scripts against the export.
---


# TTC SQLite Export Runbook

## Goal

Export the TTC WordPress/WooCommerce development dump into a compact SQLite database for RAG querying.

The destination intentionally does **not** mirror WordPress. It gives RAG scripts a small number of semantic tables: documents, terms/categories/attributes, product details, variants, selected metadata, FTS, and two bot-friendly search views: `view_products` and `view_documents`. Documents now store both plain text and simple Markdown so RAG prompts can preserve headings and links when useful.

## Context

Source dump:

```text
/home/manuel/code/ttc/ttc/ttc_dev_dump.sql.bz2
```

Ticket scripts directory:

```text
/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts
```

Output database:

```text
/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/data/ttc-wordpress-rag.sqlite
```

MySQL defaults:

```text
container: rageval-ttc-mysql
database:  ttc
user:      ttc
password:  ttc
port:      3347 -> 3306
```

## Quick Reference

### 1. Start or create the MySQL source container

Either use the setup script:

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system

ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/01-setup-mysql-container.sh
```

Or use Docker Compose:

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system

docker compose \
  -f ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/09-docker-compose.mysql.yml \
  up -d
```

If using Compose with a fresh volume, import the dump after MySQL is healthy:

```bash
bzip2 -dc /home/manuel/code/ttc/ttc/ttc_dev_dump.sql.bz2 \
  | docker exec -i rageval-ttc-mysql mysql \
      -uttc -pttc \
      --default-character-set=utf8mb4 \
      ttc
```

### 2. Confirm source data

```bash
docker exec rageval-ttc-mysql mysql -uttc -pttc ttc -e '
SELECT COUNT(*) AS posts FROM wp_posts;
SELECT post_type, post_status, COUNT(*) AS c
FROM wp_posts
GROUP BY post_type, post_status
ORDER BY c DESC
LIMIT 20;
'
```

Expected current source size:

```text
wp_posts: 39689
```

Important published/private content classes currently exported:

```text
product
post
page
faq
ttc_guide
```

### 3. Run the export

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system

python3 ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/07-export-ttc-wordpress-to-sqlite.py \
  --sqlite data/ttc-wordpress-rag.sqlite
```

The exporter reads these SQL files:

```text
02-export-documents.sql
03-export-document-terms.sql
04-export-product-details.sql
05-export-product-variants.sql
06-export-selected-meta.sql
```

The exporter wraps each SQL file as base64 JSON inside MySQL before decoding in Python. This avoids MySQL CLI escaping problems with WordPress shortcodes, quotes, backslashes, and newlines.

### 4. Validate the SQLite database

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system

ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/08-validate-ttc-sqlite.sh \
  data/ttc-wordpress-rag.sqlite
```

Expected current counts:

```text
documents:         3258
document_terms:    123457
product_details:   2600
product_variants:  12179
document_meta:     59212
view_products:     2600
view_documents:    658
```

Expected current document kinds:

```text
product:    2600
post:        483
page:        121
faq:          35
ttc_guide:    19
```

### 5. Check SQLite integrity and FTS

```bash
sqlite3 data/ttc-wordpress-rag.sqlite "PRAGMA integrity_check;"
sqlite3 data/ttc-wordpress-rag.sqlite "SELECT COUNT(*) FROM documents_fts WHERE documents_fts MATCH 'cypress';"
```

Current result:

```text
integrity_check: ok
cypress FTS hits: 198
```

## Destination Schema

### `documents`

One row per exported product/post/page/FAQ/guide.

Important columns:

```text
doc_id          stable ID like wp:3699
wp_id           original wp_posts.ID
kind            WordPress post_type
title           HTML-entity-decoded title
content_text       cleaned text from post_content
excerpt_text       cleaned text from post_excerpt
content_markdown   simple Markdown from post_content, preserving headings/links/lists
excerpt_markdown   simple Markdown from post_excerpt
search_text        RAG search text enriched with terms/product facts/variant summaries
search_markdown    Markdown-flavored RAG context enriched with terms/product facts/variants
metadata_json      compact SEO/thumb/menu/comment metadata
```

### `document_terms`

One row per taxonomy term relationship. This includes categories, tags, product categories, and product attributes.

Useful filters:

```sql
WHERE is_category = 1
WHERE taxonomy = 'product_cat'
WHERE taxonomy LIKE 'pa_%'
```

### `product_details`

One row per product document with SKU, stock, price, WooCommerce COGS, and tree-info fields.

### `product_variants`

One row per WooCommerce product variation linked to a parent product `doc_id`.

### `document_meta`

Selected raw meta values retained for debugging and future extraction improvements.

### `documents_fts`

FTS5 index over `kind`, `title`, and `search_text`.

### `view_products`

Simple RAG-bot view for product retrieval. It joins `documents`, `product_details`, product categories, product attributes, and tags into one searchable row per product.

Important columns:

```text
doc_id, wp_id, title, slug, url, sku, product_type, stock_status,
price, regular_price, sale_price, botanical_name, hardiness_zone,
sunlight, soil_conditions, drought_tolerance, mature_height, mature_width,
categories, attributes, content_text, excerpt_text,
content_markdown, excerpt_markdown, search_text, search_markdown
```

### `view_documents`

Simple RAG-bot view for all non-product content: posts, pages, FAQs, and TTC guides.

Important columns:

```text
doc_id, wp_id, kind, title, slug, url, post_date, post_modified,
categories, tags, content_text, excerpt_text,
content_markdown, excerpt_markdown, search_text, search_markdown
```

## Usage Examples

### Give a bot the two simple views

For many RAG scripts, start with these two views instead of the underlying tables:

```sql
SELECT * FROM view_products;
SELECT * FROM view_documents;
```

### Search documents

```bash
sqlite3 -header -column data/ttc-wordpress-rag.sqlite <<'SQL'
SELECT d.doc_id, d.kind, d.title
FROM documents_fts f
JOIN documents d ON d.doc_id = f.doc_id
WHERE documents_fts MATCH 'thuja privacy'
LIMIT 10;
SQL
```

### Find products in a category

```bash
sqlite3 -header -column data/ttc-wordpress-rag.sqlite <<'SQL'
SELECT doc_id, title, sku, stock_status, botanical_name, categories
FROM view_products
WHERE categories LIKE '%Cypress Trees%'
ORDER BY title
LIMIT 20;
SQL
```

### Inspect product facts

```bash
sqlite3 -header -column data/ttc-wordpress-rag.sqlite <<'SQL'
SELECT d.doc_id, d.title, pd.sku, pd.product_type, pd.price, pd.stock_status,
       pd.botanical_name, pd.hardiness_zone, pd.sunlight
FROM documents d
JOIN product_details pd ON pd.doc_id = d.doc_id
WHERE d.title LIKE '%Thuja Green Giant%'
ORDER BY d.wp_id;
SQL
```

### Inspect variant sizes and SKUs

```bash
sqlite3 -header -column data/ttc-wordpress-rag.sqlite <<'SQL'
SELECT d.title, v.variant_wp_id, v.sku, v.size, v.price, v.stock, v.stock_status
FROM product_variants v
JOIN documents d ON d.doc_id = v.parent_doc_id
WHERE d.title = 'Thuja Green Giant'
ORDER BY v.variant_wp_id
LIMIT 20;
SQL
```

## Notes for Future RAG Work

- Use `documents.search_text` as the easiest full-document plain-text source.
- Use `content_markdown` / `search_markdown` when prompt context should preserve headings, links, lists, and basic document structure.
- Use `document_terms` for faceted/category-aware retrieval.
- Use `product_details` when answer generation needs product facts such as botanical name, hardiness zone, price, or stock status.
- Use `product_variants` when answer generation needs specific SKUs/sizes.
- The export intentionally keeps selected raw meta in `document_meta`, but downstream RAG should prefer the semantic tables.
