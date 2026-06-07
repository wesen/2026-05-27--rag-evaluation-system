#!/usr/bin/env bash
set -euo pipefail

TICKET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$TICKET_DIR/sources/go-minitrace"
mkdir -p "$OUT_DIR"

go-minitrace help --all > "$OUT_DIR/help-all.txt"
go-minitrace help query-commands > "$OUT_DIR/help-query-commands.txt"
go-minitrace help query-duckdb > "$OUT_DIR/help-query-duckdb.txt"
go-minitrace help structured-query-commands > "$OUT_DIR/help-structured-query-commands.txt"
go-minitrace help js-api-reference > "$OUT_DIR/help-js-api-reference.txt"
go-minitrace help writing-duckdb-queries > "$OUT_DIR/help-writing-duckdb-queries.txt"

wc -l "$OUT_DIR"/*.txt
