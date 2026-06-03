---
Title: Investigation diary
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
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/09-docker-compose.mysql.yml
      Note: Compose file for running the TTC MySQL source container
ExternalSources: []
Summary: Diary for exporting TTC WordPress/WooCommerce data from MySQL into an elegant SQLite database for RAG querying.
LastUpdated: 2026-06-02T23:05:01.758826065-04:00
WhatFor: Track the MySQL container setup, source-query inspection, export scripts, destination schema, validation results, and failures.
WhenToUse: Read before rerunning or changing the TTC WordPress-to-SQLite export pipeline.
---


# Diary

## Goal

Capture the work to load the TTC WordPress dump into MySQL and export rich but simple RAG-oriented SQLite tables. The resulting SQLite database should keep products, categories, attributes, posts, guides, FAQs, pages, and selected raw metadata easy to query without forcing downstream RAG scripts to understand WordPress internals.

## Step 1: Create the ticket and confirm the MySQL source

I created a dedicated docmgr ticket for the TTC export work and confirmed that the local dump and MySQL container were available. The container `rageval-ttc-mysql` was already running with database/user/password `ttc/ttc/ttc`, so the setup script is idempotent: it starts or creates the container when needed, imports `/home/manuel/code/ttc/ttc/ttc_dev_dump.sql.bz2` when `wp_posts` is empty, and skips import when the dump is already loaded.

I also inspected the TTC sqleton templates under `/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/` to anchor the export queries in existing WordPress/WooCommerce knowledge. The key examples were `wp-products.yaml`, `attributes.yaml`, `stock.yaml`, and `manage-content.yaml`, which showed important meta keys, taxonomy joins, category joins, stock fields, tree-info fields, and SKU/product variation conventions.

### Prompt Context

**User prompt (verbatim):** "setup a mysql container to load ~/code/ttc/ttc/ttc_dev_dump.sql.bz2 and extract product and guides and other information into a sqlite db for RAG querying. It's a wordpress table so it's a bit messy, you can look at the sql yaml template in /home/manuel/code/ttc/ttc/sql/sqleton/ttc/products and such to find how to query the db. 

Create a new docmgr ticket in 2026-05-27--rag-evaluation-system/ to do that export of TTC data into sqlite. that way we'll have some rich tables and all"

**Assistant interpretation:** Create a docmgr ticket, prepare a MySQL source environment for the TTC dump, inspect existing SQL templates, and build an export pipeline into a RAG-friendly SQLite database.

**Inferred user intent:** Produce reusable scripts and a durable SQLite corpus that can be queried by RAG experiments without repeatedly reverse-engineering WordPress tables.

**Commit (code):** N/A — changes are uncommitted.

### What I did

- Created ticket `RAGEVAL-TTC-SQLITE-EXPORT` under `2026-05-27--rag-evaluation-system/ttmp/2026/06/02/`.
- Added tasks for loading MySQL, inspecting sqleton templates, exporting records, and validating SQLite output.
- Confirmed `/home/manuel/code/ttc/ttc/ttc_dev_dump.sql.bz2` exists and is 43 MB.
- Confirmed Docker is available and `rageval-ttc-mysql` is already running on host port `3347`.
- Ran `SHOW TABLES`, `COUNT(*) FROM wp_posts`, and grouped `wp_posts` by `post_type/post_status`.
- Wrote `scripts/01-setup-mysql-container.sh` as an idempotent setup/import script.
- Ran the setup script; it reported `wp_posts already loaded (39689 rows); skipping import`.

### Why

- Keeping container setup in a numbered script makes the export reproducible and lets future work reload the dump if the container disappears.
- Inspecting the sqleton templates prevents inventing product joins from scratch and preserves domain details like `_treeinfo_*`, `_sku`, `_stock`, `product_cat`, `pa_*`, and product variation fields.

### What worked

- The existing MySQL container already had the dump loaded.
- `wp_posts` contained 39,689 rows.
- The source had rich target content: 2,594 published products, 11,913 published product variations, 483 published posts, 120 published pages, 35 published FAQs, and 19 published `ttc_guide` rows.
- Existing sqleton templates clearly identified product fields and taxonomy patterns.

### What didn't work

- N/A for setup. The container was already loaded, so no dump import was needed during this run.

### What I learned

- The WordPress dump has the expected messy split: text in `wp_posts`, product data in `wp_postmeta`, categories and attributes through `wp_term_relationships/wp_term_taxonomy/wp_terms`, and variations as `product_variation` rows.
- `search_products` and `view_product_skus` exist in the dump and are used by existing sqleton queries, but the export can avoid depending on them by joining canonical WordPress tables directly.

### What was tricky to build

- The main setup nuance is idempotency. Reimporting the dump into an already-loaded container would be slow and potentially destructive, so the script checks for `wp_posts` and a non-zero row count before importing.
- The source schema mixes content-oriented rows and commerce/inventory rows, so the setup phase had to identify which tables matter before designing the destination schema.

### What warrants a second pair of eyes

- Confirm that reusing the existing `rageval-ttc-mysql` container is acceptable, rather than forcing a fresh container/import for every run.
- Confirm whether future runs should preserve the host port `3347` or make it configurable only through environment variables.

### What should be done in the future

- If the dump changes frequently, add a checksum marker table or container label so the setup script can detect whether the loaded data matches the requested dump.

### Code review instructions

- Start with `scripts/01-setup-mysql-container.sh`.
- Validate with:
  - `ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/01-setup-mysql-container.sh`
  - `docker exec rageval-ttc-mysql mysql -uttc -pttc ttc -e "SELECT COUNT(*) FROM wp_posts;"`

### Technical details

The MySQL container settings used by the setup script are:

```text
CONTAINER_NAME=rageval-ttc-mysql
MYSQL_DATABASE=ttc
MYSQL_USER=ttc
MYSQL_PASSWORD=ttc
MYSQL_ROOT_PASSWORD=somewordpress
MYSQL_PORT=3347
DUMP_PATH=/home/manuel/code/ttc/ttc/ttc_dev_dump.sql.bz2
```

## Step 2: Export a simple RAG-oriented SQLite schema

The export keeps the destination schema deliberately small and semantic. Instead of mirroring WordPress tables, it creates `documents`, `document_terms`, `product_details`, `product_variants`, `document_meta`, and an FTS5 table. Products, posts, guides, FAQs, and pages all become documents; categories, tags, product categories, and product attributes become normalized terms; WooCommerce/tree fields get one product details row per product.

All export SQL and scripts live in the ticket `scripts/` directory with numerical prefixes so the workflow can be replayed. The generated database is `data/ttc-wordpress-rag.sqlite` in the RAG evaluation repository.

### Prompt Context

**User prompt (verbatim):** "Keep a detailed diary as you work, store all scripts and sql queries and such in the scripts/ folder of the ticket."

**Additional user prompts (verbatim):**

- "posts, guides, faq, all fair game"
- "cateegories too"
- "but thedestination schema should be elegant and simple, it's for RAG"
- "save all scripts and sql in the ticket'sscripts/ folder, with numerical prefix, so we can retrace your steps later on."

**Assistant interpretation:** Keep detailed chronological documentation, make the export broad enough to include non-product content and categories, and keep every script/query reproducibly stored under the ticket scripts directory with numeric prefixes.

**Inferred user intent:** Build a durable, inspectable export pipeline rather than a one-off ad hoc command, while keeping the SQLite schema useful for RAG instead of WordPress administration.

**Commit (code):** N/A — changes are uncommitted.

### What I did

- Wrote these numbered ticket scripts:
  - `scripts/01-setup-mysql-container.sh`
  - `scripts/02-export-documents.sql`
  - `scripts/03-export-document-terms.sql`
  - `scripts/04-export-product-details.sql`
  - `scripts/05-export-product-variants.sql`
  - `scripts/06-export-selected-meta.sql`
  - `scripts/07-export-ttc-wordpress-to-sqlite.py`
  - `scripts/08-validate-ttc-sqlite.sh`
  - `scripts/09-docker-compose.mysql.yml`
- Added `scripts/09-docker-compose.mysql.yml` as a compose equivalent for running the MySQL source container with the same database/user/password/port settings as the setup script.
- Removed an earlier nested `scripts/sql/` scratch directory so the ticket has one clear numbered script sequence.
- Implemented SQLite destination tables:
  - `documents`
  - `document_terms`
  - `product_details`
  - `product_variants`
  - `document_meta`
  - `documents_fts` using SQLite FTS5
- Exported to `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/data/ttc-wordpress-rag.sqlite`.
- Cleaned WordPress/HTML content into text using BeautifulSoup.
- Included products, posts, pages, FAQs, and `ttc_guide` documents.
- Included categories and attributes through `document_terms`, including `category`, `product_cat`, `product_tag`, `faq_categories`, `ttc_guide_categories`, and `pa_*` taxonomies.
- Included selected product/SEO/tree-info/meta fields in `product_details` and `document_meta`.
- Included variation SKU/size/stock/price rows in `product_variants`.
- Built `search_text` by combining title, excerpt, content, SEO text, taxonomy labels, product details, and variant summaries.
- Built and validated the FTS5 index.

### Why

- A RAG-facing schema should optimize for retrieval and explanation, not for preserving every WordPress implementation detail.
- `documents` gives the retriever a single content table.
- `document_terms` preserves categories/tags/attributes in a normalized queryable form.
- `product_details` exposes important product facts without making RAG scripts parse serialized PHP postmeta.
- `document_meta` keeps selected raw fields available for debugging and future extraction improvements.

### What worked

- The export completed successfully.
- Validation counts:

```text
documents:         3258
document_terms:    123457
product_details:   2600
product_variants:  12179
document_meta:     59212
```

- Documents by kind:

```text
product:    2600
post:        483
page:        121
faq:          35
ttc_guide:    19
```

- Example product detail validation returned `Thuja Green Giant` with SKU `3699`, product type `variable`, stock status `instock`, botanical name `Thuja standishii x plicata`, hardiness zone `5-9`, and sunlight `Full Sun to Partial Shade`.
- Top category validation showed decoded category names such as `Other Shrubs & Hedges`.

### What didn't work

- The first export attempt parsed raw `mysql -B` output from `JSON_OBJECT(...)` directly and failed because MySQL batch output escaped WordPress shortcodes/backslashes in a way that corrupted JSON parsing:

```text
RuntimeError: invalid JSON from 02-export-documents.sql:1: Expecting ',' delimiter: line 1 column 379 (char 378)
```

- I fixed this by wrapping each SQL file at runtime as:

```sql
SELECT REPLACE(TO_BASE64(row_json), '\n', '') FROM (<source query>) AS exported_rows;
```

and base64-decoding the JSON in Python.

- The next export attempt failed on a document parent foreign key:

```text
sqlite3.IntegrityError: FOREIGN KEY constraint failed
```

- Some pages/records had parent IDs that were not exported in the same document set/order. I fixed this by not populating `parent_doc_id` during the initial export. Parent relationships can be reintroduced later with a nullable relation table if needed.

### What I learned

- MySQL `TO_BASE64` wraps long output, so the script must remove embedded newline wrapping with `REPLACE(..., '\n', '')` before the CLI emits rows.
- For RAG, categories and product attributes are better represented as separate normalized terms and also appended into `search_text`.
- Product variations are numerous enough to deserve their own table rather than being flattened entirely into parent product metadata.
- WordPress entity names can include HTML entities; the script now applies `html.unescape` to titles, terms, and variant titles.

### What was tricky to build

- The sharpest edge was transporting JSON through the MySQL CLI. WordPress content contains shortcodes, escaped quotes, HTML entities, ampersands, and newlines. MySQL's batch output is not a safe JSON-lines transport for raw long text, so base64-wrapping inside SQL was necessary.
- The second tricky piece was balancing schema elegance with richness. Mirroring WordPress would produce too many tables for RAG scripts; flattening everything into one text blob would lose categories, SKUs, stock, prices, and attributes. The chosen schema keeps one main document table plus a few semantic satellite tables.
- The third tricky piece was category inclusion. Categories are not a product-only concern; posts, FAQs, guides, pages, and products all use taxonomy relationships. The `document_terms` table therefore treats categories, tags, and attributes uniformly while marking category-like taxonomies with `is_category`.

### What warrants a second pair of eyes

- Review whether `parent_doc_id` should remain null or be restored via a separate `document_relationships` table that can tolerate parents outside the export set.
- Review whether product `price` for variable products should be interpreted differently; `Thuja Green Giant` shows `2644.2`, which may reflect aggregate or WooCommerce variable metadata rather than a customer-facing single price.
- Review whether `document_meta` should include more or fewer raw keys; it currently includes selected SEO, tree-info, SKU, stock, price, and serialized product attribute keys.
- Review FTS ranking/query examples. The validation query `thuja privacy` currently returns page/state pages first, which may be reasonable given text frequency but may not be ideal for product retrieval.

### What should be done in the future

- Add a small RAG import command that converts `documents` rows into the existing RAG evaluation system's `documents` and `sources` schema.
- Add optional BM25/FTS ranking examples over `documents_fts` plus category filters.
- Consider deriving a `rag_chunks` table from `documents.search_text` for direct chunk-level retrieval experiments.
- Consider parsing serialized PHP arrays in `_product_attributes`, `_default_attributes`, and `_treeinfo_qa` if future RAG experiments need structured values from those fields.

### Code review instructions

- Start with `scripts/09-docker-compose.mysql.yml` or `scripts/01-setup-mysql-container.sh` for the MySQL source container setup.
- Then read `scripts/07-export-ttc-wordpress-to-sqlite.py` for destination schema and the Python export flow.
- Then inspect each numbered SQL file to see how source rows are selected:
  - `02-export-documents.sql`
  - `03-export-document-terms.sql`
  - `04-export-product-details.sql`
  - `05-export-product-variants.sql`
  - `06-export-selected-meta.sql`
- Validate with:

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system
python3 ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/07-export-ttc-wordpress-to-sqlite.py --sqlite data/ttc-wordpress-rag.sqlite
ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/08-validate-ttc-sqlite.sh data/ttc-wordpress-rag.sqlite
```

### Technical details

Destination schema summary:

```text
documents(doc_id, wp_id, kind, status, title, slug, url, content_text, excerpt_text, search_text, metadata_json, post_date, post_modified)
document_terms(doc_id, taxonomy, term_id, term_slug, term_name, term_description, parent_term_id, is_category)
product_details(doc_id, sku, product_type, stock/price fields, tree-info fields, metadata_json)
product_variants(variant_wp_id, parent_doc_id, sku, size, stock/price fields, attributes_json)
document_meta(doc_id, meta_key, meta_value)
documents_fts(doc_id, kind, title, search_text)
```

Important source tables:

```text
wp_posts
wp_postmeta
wp_term_relationships
wp_term_taxonomy
wp_terms
```

Important source query references:

```text
/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/wp-products.yaml
/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/attributes.yaml
/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/stock.yaml
/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/manage-content.yaml
```

## Step 3: Add a replayable runbook and validate docmgr hygiene

After the export worked, I added a compact runbook so future agents and interns do not need to mine the diary for commands. The runbook records how to start MySQL using either the setup script or Docker Compose, how to import the dump into a fresh volume, how to rerun the export, how to validate counts, and how to query the resulting SQLite tables for RAG scenarios.

I also validated the compose file syntax and SQLite integrity, removed the placeholder task, related the scripts/output database to the runbook, updated the changelog, and fixed docmgr vocabulary warnings for the new topic names.

### Prompt Context

**User prompt (verbatim):** "continue"

**Assistant interpretation:** Continue hardening and documenting the TTC SQLite export pipeline after adding the Docker Compose file.

**Inferred user intent:** Make the ticket self-contained, replayable, and docmgr-clean rather than stopping after the first successful export.

**Commit (code):** N/A — changes are uncommitted.

### What I did

- Added `reference/02-ttc-sqlite-export-runbook.md` with copy/paste setup, export, validation, schema, and query examples.
- Validated `scripts/09-docker-compose.mysql.yml` with:
  - `docker compose -f .../scripts/09-docker-compose.mysql.yml config`
- Validated SQLite integrity and FTS with:
  - `sqlite3 data/ttc-wordpress-rag.sqlite "PRAGMA integrity_check; SELECT COUNT(*) FROM documents_fts WHERE documents_fts MATCH 'cypress';"`
- Removed the placeholder `Add tasks here` entry from `tasks.md`.
- Related all numbered scripts and `data/ttc-wordpress-rag.sqlite` to the runbook with `docmgr doc relate`.
- Updated the ticket changelog.
- Ran `docmgr doctor --ticket RAGEVAL-TTC-SQLITE-EXPORT --stale-after 30`.
- Added missing topic vocabulary entries: `mysql`, `sqlite`, `ttc`, and `wordpress`.
- Reran `docmgr doctor`; it passed cleanly.

### Why

- The export should be replayable without relying on hidden shell history.
- The runbook separates operational commands from the detailed investigation diary.
- `docmgr doctor` needs to pass before the ticket can be treated as a clean durable artifact.

### What worked

- Docker Compose config validation returned `ok`.
- SQLite `PRAGMA integrity_check` returned `ok`.
- FTS query `cypress` returned 198 hits.
- `docmgr doctor` passed after adding vocabulary entries.

### What didn't work

- Initial doctor run warned about unknown topics:

```text
unknown topics: [mysql sqlite ttc wordpress]
```

- Fixed by adding each topic with `docmgr vocab add --category topics`.

### What I learned

- The ticket vocabulary did not yet include database-specific and TTC-specific topic slugs, even though the repository already had broader `database` and `corpus` topics.
- Keeping the runbook as a separate reference doc makes the diary easier to use as history and the runbook easier to use as an operator guide.

### What was tricky to build

- The main sharp edge was avoiding documentation sprawl: the diary is chronological, the runbook is procedural, and the scripts are the source of truth for executable steps. I kept each artifact focused on one job.
- Another small issue was preserving all scripts in one numbered directory. The earlier scratch nested SQL folder was removed so the workflow is visually ordered from `01` to `09`.

### What warrants a second pair of eyes

- Review whether `data/ttc-wordpress-rag.sqlite` should be checked into git, ignored as generated data, or moved under a larger artifact/data policy.
- Review the runbook's advice for importing into a fresh Compose volume; it intentionally does not auto-import through Compose because the dump path is outside the repo.

### What should be done in the future

- Add an optional `10-import-into-rag-eval.py` script if the next step is to convert `ttc-wordpress-rag.sqlite` documents into the existing RAG evaluation system `documents` table.
- Add retrieval examples that combine FTS search with `document_terms` category filters.

### Code review instructions

- Read `reference/02-ttc-sqlite-export-runbook.md` first for operator flow.
- Confirm all scripts are in `scripts/` with numeric prefixes.
- Validate with:

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system
docker compose -f ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/09-docker-compose.mysql.yml config >/tmp/ttc-compose-config.yml
sqlite3 data/ttc-wordpress-rag.sqlite "PRAGMA integrity_check;"
docmgr doctor --ticket RAGEVAL-TTC-SQLITE-EXPORT --stale-after 30
```

### Technical details

The runbook path is:

```text
ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/reference/02-ttc-sqlite-export-runbook.md
```

The final numbered scripts are:

```text
01-setup-mysql-container.sh
02-export-documents.sql
03-export-document-terms.sql
04-export-product-details.sql
05-export-product-variants.sql
06-export-selected-meta.sql
07-export-ttc-wordpress-to-sqlite.py
08-validate-ttc-sqlite.sh
09-docker-compose.mysql.yml
```

## Step 4: Add bot-friendly product and document views

The normalized schema is useful for inspection and enrichment, but a RAG bot should not need to join five tables just to get a product or article row. I added two simple SQLite views: `view_products` for product rows and `view_documents` for all non-product content (`post`, `page`, `faq`, and `ttc_guide`).

These views preserve the normalized tables underneath while giving retrieval scripts two easy entrypoints. `view_products` includes product facts, categories, attributes, content text, excerpt text, and enriched `search_text`. `view_documents` includes content kind, categories, tags, content text, excerpt text, and enriched `search_text`.

### Prompt Context

**User prompt (verbatim):** "can we create even simple `view_products` and `view_documents` (the rest: posts, pages, faq, guides) that can very easily be searched, as the two tables to give a RAG bot."

**Assistant interpretation:** Add two simple SQLite views that hide the normalized schema and expose bot-friendly rows for product and non-product document retrieval.

**Inferred user intent:** Make the export immediately usable by RAG scripts and bots with minimal SQL complexity.

**Commit (code):** N/A — changes are uncommitted.

### What I did

- Updated `scripts/07-export-ttc-wordpress-to-sqlite.py` to create:
  - `view_products`
  - `view_documents`
- Updated `scripts/08-validate-ttc-sqlite.sh` to report view row counts and samples.
- Re-ran the exporter against `data/ttc-wordpress-rag.sqlite`.
- Re-ran the validation script.
- Updated `reference/02-ttc-sqlite-export-runbook.md` with the new view descriptions and examples.

### Why

- `view_products` gives a product RAG bot one row per product with both content and product facts.
- `view_documents` gives a general content RAG bot one row per post/page/FAQ/guide.
- Keeping them as views avoids duplicating text and lets future schema improvements flow through automatically.

### What worked

- Export completed successfully after adding the views.
- Validation showed:

```text
view_products:  2600
view_documents: 658
```

- `view_products` sample for `Thuja Green Giant` returned SKU, product type, stock status, botanical name, and categories.
- `view_documents` sample returned FAQ rows with categories.

### What didn't work

- N/A. The view additions worked on the first rerun.

### What I learned

- The export now has a good two-layer shape: normalized semantic tables for precise inspection, plus two simplified views for RAG consumers.
- `view_documents` row count is 658, matching non-product documents: 483 posts + 121 pages + 35 FAQs + 19 guides.

### What was tricky to build

- The main nuance was deciding which related data to collapse into comma-separated strings. For bot-facing search rows, `categories` and `attributes` are more useful as readable text than as nested JSON.
- Product tags and `pa_*` attributes are included in the product `attributes` column; category-like taxonomies remain in `categories`.

### What warrants a second pair of eyes

- Review whether `view_products.attributes` should include all `pa_*` taxonomies or only selected bot-relevant ones.
- Review whether `view_documents` should include `page` rows such as state landing pages, or whether future scripts should filter them by category/slug.

### What should be done in the future

- Add example xgoja/jsverb queries that read only from `view_products` and `view_documents`.
- Consider adding `view_rag_documents` as a UNION ALL of both views if a single mixed corpus endpoint becomes useful.

### Code review instructions

- Inspect the view definitions in `scripts/07-export-ttc-wordpress-to-sqlite.py` inside `create_schema`.
- Validate with:

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system
python3 ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/07-export-ttc-wordpress-to-sqlite.py --sqlite data/ttc-wordpress-rag.sqlite
ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/08-validate-ttc-sqlite.sh data/ttc-wordpress-rag.sqlite
```

### Technical details

`view_products` columns:

```text
doc_id, wp_id, title, slug, url, sku, product_type, stock_status,
price, regular_price, sale_price, botanical_name, hardiness_zone,
sunlight, soil_conditions, drought_tolerance, mature_height, mature_width,
categories, attributes, content_text, excerpt_text, search_text
```

`view_documents` columns:

```text
doc_id, wp_id, kind, title, slug, url, post_date, post_modified,
categories, tags, content_text, excerpt_text, search_text
```

## Step 5: Preserve Markdown structure for RAG context

The first export stored readable plain text, but it lost document structure: headings were plain lines, links lost their URLs, and lists/tables were flattened. I extended the exporter to store both plain text and simple Markdown so retrievers can keep `content_text` for FTS while answer-generation prompts can use `content_markdown` or `search_markdown` when structure matters.

The Markdown converter is intentionally dependency-light. It uses BeautifulSoup, removes WordPress/Gutenberg comments and layout shortcodes, then converts common HTML blocks into ATX headings, Markdown links, emphasis, lists, blockquotes, code blocks, and lightweight table rows.

### Prompt Context

**User prompt (verbatim):** "yes, do it. Keep a diary as you work, commit at appropriate intervals."

**Assistant interpretation:** Add Markdown conversion/storage to the TTC SQLite export, document the work in the diary, validate it, and commit the focused ticket changes.

**Inferred user intent:** Improve RAG context quality by preserving document structure while keeping the export reproducible and reviewable.

**Commit (code):** 5338d18edd9c58bb357d45a6f48939ebf73d592e — "Add TTC WordPress SQLite export ticket"

### What I did

- Added `content_markdown`, `excerpt_markdown`, and `search_markdown` columns to `documents`.
- Added those Markdown fields to `view_products` and `view_documents`.
- Implemented a small HTML-to-Markdown converter in `scripts/07-export-ttc-wordpress-to-sqlite.py`.
- Removed BeautifulSoup `Comment` nodes so Gutenberg comments such as `<!-- wp:heading -->` do not leak into Markdown output.
- Updated `append_search_text` so term/product/variant enrichment is appended to both `search_text` and `search_markdown`.
- Updated `scripts/08-validate-ttc-sqlite.sh` with a Markdown header sample.
- Re-ran the export and validation.
- Updated the runbook schema notes to mention Markdown columns.

### Why

- RAG prompts often benefit from headings because they preserve section boundaries and local context.
- Plain text remains useful for simple FTS and low-noise retrieval.
- Keeping both avoids choosing between retrieval safety and prompt structure.

### What worked

- `python3 -m py_compile .../scripts/07-export-ttc-wordpress-to-sqlite.py` passed.
- Re-export succeeded.
- Validation succeeded and showed a clean Markdown sample:

```markdown
## Introduction

Gardeners today have access to a wide variety of evergreen trees...
```

- Existing row counts remained stable:

```text
view_products:  2600
view_documents: 658
```

### What didn't work

- The first Markdown validation sample included raw Gutenberg comment text:

```text
wp:heading {"level":1}
# Choosing The Right Crape Myrtle Tree
/wp:heading
```

- I fixed this by importing `Comment` from BeautifulSoup and removing all HTML comments before text/Markdown rendering.

### What I learned

- TTC WordPress content includes Gutenberg block comments as well as ordinary HTML and shortcodes.
- BeautifulSoup can expose comments as text-like nodes unless they are removed explicitly.
- A lightweight converter is enough for useful RAG Markdown as long as it handles headings, links, lists, and comments correctly.

### What was tricky to build

- The tricky part was preserving useful structure without adding a new dependency such as `markdownify` or `html2text`, neither of which is installed in this environment.
- Another sharp edge was Gutenberg comments: they are not visible page content, but they appeared in the first Markdown attempt. Removing comments before traversal fixed the issue while preserving the actual heading text.
- The converter is intentionally conservative. It does not attempt perfect Markdown table formatting or shortcode semantics; it aims for clean RAG context.

### What warrants a second pair of eyes

- Review whether the dependency-light converter is sufficient or whether future work should add a real Markdown conversion dependency.
- Review shortcode handling. The current preprocessing removes common layout widgets but does not semantically expand TTC-specific button/content shortcodes.
- Review whether `search_markdown` should include enrichment as plain lines or structured sections such as `## Product facts` and `## Categories`.

### What should be done in the future

- Consider adding a `view_rag_documents` union view with a single `markdown_context` column for both product and non-product rows.
- Add a small sample RAG script that retrieves `search_markdown` from the two views and prints prompt-ready context.

### Code review instructions

- Start with `markdown_from_html`, `block_markdown`, and `inline_markdown` in `scripts/07-export-ttc-wordpress-to-sqlite.py`.
- Check the `documents` schema and view definitions in `create_schema`.
- Validate with:

```bash
cd /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system
python3 -m py_compile ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/07-export-ttc-wordpress-to-sqlite.py
python3 ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/07-export-ttc-wordpress-to-sqlite.py --sqlite data/ttc-wordpress-rag.sqlite
ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/08-validate-ttc-sqlite.sh data/ttc-wordpress-rag.sqlite
```

### Technical details

New columns:

```text
documents.content_markdown
documents.excerpt_markdown
documents.search_markdown
view_products.content_markdown
view_products.excerpt_markdown
view_products.search_markdown
view_documents.content_markdown
view_documents.excerpt_markdown
view_documents.search_markdown
```
