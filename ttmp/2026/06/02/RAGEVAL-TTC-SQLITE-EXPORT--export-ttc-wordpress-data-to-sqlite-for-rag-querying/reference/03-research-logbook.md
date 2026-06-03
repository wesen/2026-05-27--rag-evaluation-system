---
Title: Research logbook
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
    - Path: ../../../../../../../../../../code/ttc/ttc/sql/sqleton/ttc/products/attributes.yaml
      Note: Existing product attribute taxonomy query reference
    - Path: ../../../../../../../../../../code/ttc/ttc/sql/sqleton/ttc/products/manage-content.yaml
      Note: Existing product content completeness and tree-info field query reference
    - Path: ../../../../../../../../../../code/ttc/ttc/sql/sqleton/ttc/products/stock.yaml
      Note: Existing stock and product variation query reference
    - Path: ../../../../../../../../../../code/ttc/ttc/sql/sqleton/ttc/products/wp-products.yaml
      Note: Existing product field and WooCommerce postmeta query reference
    - Path: ../../../../../../../../../../code/wesen/go-go-golems/go-go-parc/Projects/2026/06/03/ARTICLE - Exporting WordPress WooCommerce Data into a RAG SQLite Corpus.md
      Note: Obsidian narrative report synthesized from the ticket
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/reference/01-investigation-diary.md
      Note: Chronological implementation evidence
    - Path: ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/reference/02-ttc-sqlite-export-runbook.md
      Note: Replayable export and validation commands
ExternalSources: []
Summary: Resource-by-resource logbook for the TTC WordPress-to-SQLite RAG export investigation.
LastUpdated: 2026-06-03T00:20:00-04:00
WhatFor: Track which local resources were useful, outdated, incomplete, or need follow-up updates for the TTC SQLite export work.
WhenToUse: Use before extending the TTC export, revisiting source SQL assumptions, or deciding which source resources need maintenance.
---


# Research Logbook

## Goal

This logbook records the documents and resources consulted while building the TTC WordPress/WooCommerce export into a compact SQLite database for RAG querying. It is deliberately resource-centered rather than step-centered. The diary explains what happened chronologically; this logbook explains which resources informed the work, why they were selected, what they contributed, and what needs updating.

## Resource evaluation matrix

| Resource | Status | Usefulness | Update need |
|---|---:|---:|---|
| `/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/wp-products.yaml` | Useful | High | Add notes for RAG export-relevant fields and variable-product price interpretation. |
| `/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/attributes.yaml` | Useful | High | Add category/attribute taxonomy rationale and exported taxonomy list. |
| `/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/stock.yaml` | Useful | Medium | Clarify stock semantics for parent products vs variations. |
| `/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/manage-content.yaml` | Useful but too UI-specific | Medium | Extract its content-completeness logic into a smaller reusable reference. |
| `/home/manuel/code/ttc/ttc/ttc_dev_dump.sql.bz2` | Current source artifact | High | Add checksum/version marker to future export runs. |
| Running MySQL container `rageval-ttc-mysql` | Useful operational source | High | Keep compose/setup scripts synchronized with actual container settings. |
| WordPress source tables (`wp_posts`, `wp_postmeta`, `wp_terms`, `wp_term_taxonomy`, `wp_term_relationships`) | Canonical source | High | No source update; export docs should document chosen subset. |
| Existing ticket docs for `RAGEVAL-TTC-SQLITE-EXPORT` | Current project record | High | Keep runbook and diary aligned when scripts change. |
| Obsidian article `ARTICLE - Exporting WordPress WooCommerce Data into a RAG SQLite Corpus.md` | Durable narrative | Medium | Update if schema or bot-facing views change substantially. |

---

## `/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/wp-products.yaml`

### What I was researching

I was researching how TTC's existing SQL tooling extracts WooCommerce product rows from the WordPress database. The export needed product identity, SKU, stock, price, COGS, and status fields without relying on guesses about postmeta keys.

### What I was looking for in this document in particular

I was looking for the canonical joins between `wp_posts` and `wp_postmeta` for product fields. In particular, I needed the postmeta keys that represent SKU, price, stock, backorders, stock status, managed stock, and cost of goods.

### Why I chose it

The filename and description identify it as the existing TTC product query. It is more trustworthy than ad hoc inspection because it was already part of the site's operational SQL template set.

### How I found the resource itself

The user pointed me to `/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products`. I listed that directory and found `wp-products.yaml` alongside `attributes.yaml`, `stock.yaml`, and `manage-content.yaml`.

### What I found useful in the document

The query confirmed the key WooCommerce meta fields:

```text
_manage_stock
_sku
_inventory_ground
_inventory_need
_backorders
_price
_regular_price
_sale_price
_stock
_stock_status
_wc_cog_cost
```

It also showed that products and product variations should be considered together in some operational contexts:

```sql
p.post_type IN ('product', 'product_variation')
```

That informed the decision to keep parent products in `product_details` and variations in `product_variants` rather than mixing them in a single table.

### What I didn't find useful

The template includes CLI flags and template conditionals for filtering by product ID, SKU, name, stock state, and status. Those are useful for the sqleton command, but they were not directly useful for a full-corpus export. The export needed complete extraction, not an interactive filtered report.

### What is out of date / what was wrong

Nothing was obviously wrong for its original purpose. For RAG export, the query is incomplete because it does not include document text, categories, attributes, tree information, Markdown conversion, or bot-facing views.

The price fields also need caution. Variable products can expose aggregate or range-like price metadata. A row such as `Thuja Green Giant` showed a high `price` value, so downstream RAG scripts should not assume every `price` is a single customer-facing price.

### What would need updating

Add a short note to the template or adjacent docs explaining which fields are safe product facts for RAG and which require commerce-domain interpretation. A future update could also mention that RAG export now separates parent products and product variations.

---

## `/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/attributes.yaml`

### What I was researching

I was researching how TTC represents product attributes and which taxonomies matter for product retrieval.

### What I was looking for in this document in particular

I needed the taxonomy list that should appear in a RAG-friendly product export. Product attributes are useful for faceted retrieval and answer generation, but WordPress stores them as taxonomy relationships rather than product columns.

### Why I chose it

The file name directly indicated product attribute counts. It was the most likely source for the set of `pa_*` taxonomies that the site already considers important.

### How I found the resource itself

It was in the user-specified sqleton products directory. I read it after `wp-products.yaml` because product facts and attributes are the two core parts of product retrieval.

### What I found useful in the document

The template identified important product attribute taxonomies:

```text
pa_growing-zone
pa_brand
pa_sun-needs
pa_special-features
pa_water-needs
pa_style
pa_flower-color
pa_flowering-season
pa_growth-rate
pa_plant_type
pa_excluded-states
```

It also showed the standard join path:

```sql
wp_term_relationships -> wp_term_taxonomy -> wp_terms
```

That pattern became the basis for `03-export-document-terms.sql`, except the export generalizes beyond only selected product attributes. It includes categories, tags, product categories, guide categories, FAQ categories, and all `pa_*` rows.

### What I didn't find useful

The document is written as an aggregate count report. The export needed one row per document-term relationship, not grouped counts. The grouping logic therefore had to be replaced.

### What is out of date / what was wrong

The template's default attribute list is useful, but the source database contains additional relevant taxonomies such as `pa_size`, `pa_soil-conditions`, `pa_drought-tolerance`, `product_cat`, `product_tag`, and `product_visibility`. For RAG, restricting to the default list would lose useful context.

### What would need updating

The attribute template or adjacent documentation should distinguish between:

- operational attribute reports, where a selected list is desirable;
- corpus export, where preserving all product-related taxonomies is safer.

A future update could add a maintained taxonomy allowlist for RAG export.

---

## `/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/stock.yaml`

### What I was researching

I was researching stock and variation semantics for WooCommerce products.

### What I was looking for in this document in particular

I wanted to know how TTC distinguishes simple products, variable parent products, and product variations, and how stock fields are attached to those rows.

### Why I chose it

The export needed to decide whether variation rows should become documents, product facts, or a separate child table. The stock query was the clearest existing reference for variation handling.

### How I found the resource itself

It was part of the same sqleton products directory. I read it after the product and attributes templates because variations are the main complication in product export.

### What I found useful in the document

The query showed the parent calculation:

```sql
CASE WHEN wp.post_parent = 0 THEN wp.ID ELSE wp.post_parent END AS parent_id
```

It also showed that product variations have their own SKU, size, stock, and managed-stock fields:

```text
attribute_pa_size
_sku
_stock
_manage_stock
```

That informed the `product_variants` table design.

### What I didn't find useful

The query is optimized for an operational stock report, not for corpus export. It filters published rows and excludes bundle sizes. The export needed broader preservation of product variation facts, not a final inventory report.

### What is out of date / what was wrong

Nothing was obviously wrong for stock reporting. For RAG export, the query is too narrow because it does not preserve price, COGS, raw attributes JSON, or parent product text.

### What would need updating

Add documentation explaining which stock fields belong to parent products and which belong to variation rows. A future RAG export might also compute a summarized stock availability field on `view_products` from variants.

---

## `/home/manuel/code/ttc/ttc/sql/sqleton/ttc/products/manage-content.yaml`

### What I was researching

I was researching how TTC judges whether product content is complete. That matters because a RAG corpus should know which products have content, images, tree info, SEO text, and categories.

### What I was looking for in this document in particular

I was looking for content-related fields: main content, short description, SEO title/description, image, categories, and tree information such as mature height, mature width, and botanical name.

### Why I chose it

The file is explicitly a product content management query. It is more likely to contain content completeness logic than stock or product-list queries.

### How I found the resource itself

It was in the same sqleton products directory. I read it after establishing the basic product and stock joins.

### What I found useful in the document

The document confirmed important tree-info and content keys:

```text
_treeinfo_mature_height
_treeinfo_mature_width
_treeinfo_botanical_name
_ttc_content_link
_thumbnail_id
_su_title
_su_description
```

It also showed category lookup through `product_cat` and content completeness checks involving main content, short description, tree info, image, and SEO.

### What I didn't find useful

The template is large and UI-oriented. It includes many conditional filters, computed completeness flags, and report-specific columns. Those are useful for a content management interface but too specific for a general RAG export.

### What is out of date / what was wrong

Nothing was clearly wrong, but it is not shaped as a reusable source schema reference. It mixes facts, completeness policy, UI report needs, and SQL template conditionals.

### What would need updating

Extract a smaller reference document or SQL template that lists product content fields independently of the manage-content report. That reference would be useful for future exports and content-quality checks.

---

## `/home/manuel/code/ttc/ttc/ttc_dev_dump.sql.bz2`

### What I was researching

I was researching the actual available WordPress/WooCommerce source data, not just the query templates.

### What I was looking for in this document in particular

I needed to confirm that the dump existed, could be loaded, and contained the expected WordPress tables and content types.

### Why I chose it

It is the source artifact named by the user. The export must be grounded in this dump rather than assumptions about production state.

### How I found the resource itself

The user gave the path directly. I checked the file with `ls -lh` and found it was 43 MB.

### What I found useful in the document

Once loaded into MySQL, the dump showed:

```text
wp_posts rows: 39689
product publish: 2594
product_variation publish: 11913
post publish: 483
page publish: 120
faq publish: 35
ttc_guide publish: 19
```

Those counts shaped the export scope.

### What I didn't find useful

The compressed dump itself is not a readable design document. It is useful only after loading into MySQL and querying the schema.

### What is out of date / what was wrong

The dump is a snapshot. It may be out of date relative to current production. The export has no checksum, timestamp marker, or source-version table beyond the generated file time.

### What would need updating

Add a source metadata table to the SQLite export with dump path, dump size, optional checksum, export timestamp, and container/database settings. That would make future comparisons easier.

---

## Running MySQL container `rageval-ttc-mysql`

### What I was researching

I was researching whether the MySQL environment already existed and whether it matched the requested TTC dump import task.

### What I was looking for in this resource in particular

I needed container name, port, credentials, database name, MySQL version, and whether `wp_posts` was already loaded.

### Why I chose it

The Docker container list showed `rageval-ttc-mysql` already running. Reusing it avoided a destructive or redundant import.

### How I found the resource itself

I ran Docker inspection commands after checking `docker ps`. The environment showed:

```text
MYSQL_DATABASE=ttc
MYSQL_USER=ttc
MYSQL_PASSWORD=ttc
MYSQL_ROOT_PASSWORD=somewordpress
HostPort=3347
MySQL version=8.0.33
```

### What I found useful in the resource

The container had a loaded `wp_posts` table with 39,689 rows. That allowed the export to proceed immediately.

### What I didn't find useful

The container state alone does not prove which dump was loaded. It confirms data is present, but not provenance.

### What is out of date / what was wrong

The running container was older than the ticket work and had been up for several days. It might not reflect a freshly imported copy of the named dump.

### What would need updating

The setup script and compose file now document the intended container settings. Future work should add provenance checks, especially if multiple TTC dumps are used.

---

## WordPress source tables

### What I was researching

I was researching the canonical WordPress data model needed for extraction.

### What I was looking for in these tables in particular

I needed the fields in `wp_posts`, `wp_postmeta`, `wp_terms`, `wp_term_taxonomy`, and `wp_term_relationships`. I also needed to confirm the post types and taxonomies present in the dump.

### Why I chose them

These tables are the canonical source for WordPress content and taxonomy relationships. They are more stable than plugin-specific helper views.

### How I found the resource itself

I queried `SHOW TABLES LIKE 'wp_%'`, `DESCRIBE wp_posts`, `DESCRIBE wp_postmeta`, and grouped post types and taxonomies through MySQL.

### What I found useful in the resource

Useful source columns included:

```text
wp_posts.ID
wp_posts.post_title
wp_posts.post_content
wp_posts.post_excerpt
wp_posts.post_type
wp_posts.post_status
wp_posts.post_name
wp_posts.guid
wp_posts.post_parent
wp_posts.post_date
wp_posts.post_modified
wp_postmeta.meta_key
wp_postmeta.meta_value
wp_term_taxonomy.taxonomy
wp_terms.name
wp_terms.slug
```

The taxonomy counts showed product categories and product attributes such as:

```text
product_cat
pa_excluded-states
pa_growing-zone
pa_size
category
post_tag
product_tag
pa_special-features
pa_brand
```

### What I didn't find useful

The source tables contain far more data than the RAG export needs, including attachments, scheduler tables, orders, coupons, sessions, logs, and plugin tables. Those were intentionally excluded.

### What is out of date / what was wrong

The source schema is messy by design because it reflects WordPress, WooCommerce, and site-specific plugin history. It is not wrong, but it is not a good destination schema for RAG.

### What would need updating

The export documentation should continue to state which source tables are canonical and which are excluded. If order or analytics data becomes RAG-relevant, that should be a separate export path rather than expanding the document corpus indiscriminately.

---

## Existing ticket docs for `RAGEVAL-TTC-SQLITE-EXPORT`

### What I was researching

I used the ticket docs to keep track of implementation state, commands, failures, validation results, and operator instructions.

### What I was looking for in these documents in particular

I needed the diary for chronological history and the runbook for replayable commands.

### Why I chose them

They are the documentation artifacts created by this work. They are the source of truth for why the export has its current shape.

### How I found the resource itself

They were created through `docmgr` in the ticket workspace.

### What I found useful in the documents

The diary captured failures such as MySQL JSON transport corruption and the parent foreign-key failure. The runbook captured concise commands for setup, export, validation, and query examples.

### What I didn't find useful

The diary is intentionally long and chronological, so it is not the fastest operator reference. That is why the runbook exists separately.

### What is out of date / what was wrong

The docs were updated during the work. The main risk is future drift if scripts change without updating the runbook and logbook.

### What would need updating

Update the runbook whenever schema, view columns, validation counts, or command paths change. Update this logbook whenever new source resources are consulted.

---

## Obsidian article: `ARTICLE - Exporting WordPress WooCommerce Data into a RAG SQLite Corpus.md`

### What I was researching

I wrote this article as a durable technical explanation of the project for the Obsidian vault.

### What I was looking for in this document in particular

The article needed to explain the architecture, design decisions, schema, pipeline, Markdown conversion, failure modes, and next steps in a textbook-style technical blog post.

### Why I chose it

The user requested an Obsidian vault project report after the export work. It is not an input source so much as a synthesized external-facing explanation.

### How I found the resource itself

I created it in the vault under:

```text
/home/manuel/code/wesen/go-go-golems/go-go-parc/Projects/2026/06/03/ARTICLE - Exporting WordPress WooCommerce Data into a RAG SQLite Corpus.md
```

### What I found useful in the document

It gives a coherent narrative for future readers who are not inside the ticket workspace. It explains why the schema is not a WordPress mirror and why `view_products` / `view_documents` are the bot-facing entrypoints.

### What I didn't find useful

It is not a runbook. It intentionally omits some exact command detail in favor of conceptual explanation.

### What is out of date / what was wrong

The article records the schema as of the Markdown-enhanced export. It will become out of date if later work adds a unified view, changes the schema, or imports the corpus into the main RAG evaluation database.

### What would need updating

Update the article if the export grows a `view_rag_documents` view, changes the bot-facing view columns, adopts a third-party Markdown converter, or changes the source dump provenance model.

---

## Resource maintenance recommendations

The export is now reproducible, but the documentation should continue to distinguish three kinds of resources:

- Source resources describe the WordPress/WooCommerce data model.
- Ticket resources describe this implementation and how to run it.
- Narrative resources explain the project to future readers.

The most important update is source provenance. The generated SQLite database should eventually record the dump path, file size, checksum, export timestamp, exporter version, and MySQL container settings. Without that metadata, later readers can validate the export shape but not the exact source snapshot.

The second update is query maintainability. The sqleton templates were useful but UI/report oriented. A small source-schema reference for TTC products, attributes, and content fields would make future exports easier to review.

The third update is Markdown conversion policy. The current converter is dependency-light and sufficient for headings and links, but future work should decide whether to keep that approach or adopt a dedicated HTML-to-Markdown library.
