#!/usr/bin/env bash
set -euo pipefail

DB="${1:-data/ttc-wordpress-rag.sqlite}"

if [[ ! -f "$DB" ]]; then
  echo "SQLite DB not found: $DB" >&2
  exit 1
fi

echo "== Tables =="
sqlite3 "$DB" ".tables"

echo
 echo "== Counts =="
sqlite3 -header -column "$DB" <<'SQL'
SELECT 'documents' AS table_name, COUNT(*) AS rows FROM documents
UNION ALL SELECT 'document_terms', COUNT(*) FROM document_terms
UNION ALL SELECT 'product_details', COUNT(*) FROM product_details
UNION ALL SELECT 'product_variants', COUNT(*) FROM product_variants
UNION ALL SELECT 'document_meta', COUNT(*) FROM document_meta
UNION ALL SELECT 'view_products', COUNT(*) FROM view_products
UNION ALL SELECT 'view_documents', COUNT(*) FROM view_documents;
SQL

echo
 echo "== Documents by kind =="
sqlite3 -header -column "$DB" <<'SQL'
SELECT kind, COUNT(*) AS rows
FROM documents
GROUP BY kind
ORDER BY rows DESC;
SQL

echo
 echo "== Top product categories =="
sqlite3 -header -column "$DB" <<'SQL'
SELECT taxonomy, term_name, COUNT(*) AS docs
FROM document_terms
WHERE is_category = 1
GROUP BY taxonomy, term_name
ORDER BY docs DESC
LIMIT 20;
SQL

echo
 echo "== Example product detail =="
sqlite3 -header -column "$DB" <<'SQL'
SELECT d.doc_id, d.title, pd.sku, pd.product_type, pd.price, pd.stock_status,
       pd.botanical_name, pd.hardiness_zone, pd.sunlight
FROM documents d
JOIN product_details pd ON pd.doc_id = d.doc_id
WHERE d.title LIKE '%Thuja Green Giant%'
ORDER BY d.wp_id
LIMIT 5;
SQL

echo
 echo "== Simple RAG views =="
sqlite3 -header -column "$DB" <<'SQL'
SELECT 'view_products' AS view_name, COUNT(*) AS rows FROM view_products
UNION ALL SELECT 'view_documents', COUNT(*) FROM view_documents;
SQL

echo
 echo "== view_products sample =="
sqlite3 -header -column "$DB" <<'SQL'
SELECT doc_id, title, sku, product_type, stock_status, botanical_name, categories
FROM view_products
WHERE title LIKE '%Thuja Green Giant%'
LIMIT 3;
SQL

echo
 echo "== view_documents sample =="
sqlite3 -header -column "$DB" <<'SQL'
SELECT doc_id, kind, title, categories
FROM view_documents
ORDER BY kind, title
LIMIT 5;
SQL

echo
 echo "== Markdown header sample =="
sqlite3 -header -column "$DB" <<'SQL'
SELECT doc_id, kind, title, substr(content_markdown, 1, 700) AS markdown
FROM view_documents
WHERE content_markdown LIKE '#%'
   OR content_markdown LIKE '%' || char(10) || '#%'
ORDER BY length(content_markdown) DESC
LIMIT 1;
SQL

echo
 echo "== FTS sample: thuja privacy =="
sqlite3 -header -column "$DB" <<'SQL'
SELECT d.doc_id, d.kind, d.title
FROM documents_fts f
JOIN documents d ON d.doc_id = f.doc_id
WHERE documents_fts MATCH 'thuja privacy'
LIMIT 10;
SQL
