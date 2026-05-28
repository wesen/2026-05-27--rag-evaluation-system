#!/usr/bin/env bash
set -euo pipefail

APP_DB="${RAGEVAL_DB:-data/rag-eval.db}"
STRATEGY="${TTC_SAMPLE_STRATEGY:-fixed}"
CHUNK_SIZE="${TTC_SAMPLE_CHUNK_SIZE:-1200}"
OVERLAP="${TTC_SAMPLE_OVERLAP:-150}"
PER_KIND="${TTC_SAMPLE_PER_KIND:-3}"

if [[ ! -f "$APP_DB" ]]; then
  echo "app DB not found: $APP_DB" >&2
  exit 1
fi

for kind in guide article product; do
  echo "# Chunking $PER_KIND $kind document(s)" >&2
  sqlite3 -noheader -batch "$APP_DB" \
    "SELECT id FROM documents WHERE source_id='ttc-dump-${kind}s' ORDER BY word_count DESC, id LIMIT $PER_KIND;" |
  while IFS= read -r doc_id; do
    [[ -z "$doc_id" ]] && continue
    echo "chunking kind=$kind doc_id=$doc_id" >&2
    ./rag-eval chunk apply \
      --db "$APP_DB" \
      --doc-id "$doc_id" \
      --strategy "$STRATEGY" \
      --chunk-size "$CHUNK_SIZE" \
      --overlap "$OVERLAP" \
      --emit none \
      --output json >/dev/null
    sqlite3 -json "$APP_DB" \
      "SELECT '$kind' AS kind, '$doc_id' AS document_id, 'fixed-${CHUNK_SIZE}-${OVERLAP}' AS strategy_id, COUNT(*) AS chunk_count FROM chunks WHERE document_id='$doc_id' AND strategy_id='fixed-${CHUNK_SIZE}-${OVERLAP}';" |
      jq -c '.[0]'
  done
done

sqlite3 -header -column "$APP_DB" \
  "SELECT d.source_id, c.strategy_id, COUNT(*) chunks, COUNT(DISTINCT c.document_id) docs
   FROM chunks c
   JOIN documents d ON d.id=c.document_id
   WHERE d.source_id LIKE 'ttc-dump-%'
   GROUP BY d.source_id, c.strategy_id
   ORDER BY d.source_id, c.strategy_id;"
