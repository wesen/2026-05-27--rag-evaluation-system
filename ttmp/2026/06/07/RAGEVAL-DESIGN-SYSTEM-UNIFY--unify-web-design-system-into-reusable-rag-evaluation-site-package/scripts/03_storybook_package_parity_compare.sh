#!/usr/bin/env bash
set -euo pipefail

TICKET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$TICKET_DIR/../../../../.." && pwd)"
OUT_DIR="$TICKET_DIR/sources/visual-parity/package-parity"
STORYBOOK_DIR="$OUT_DIR/storybook-static"
COMPARE_DIR="$OUT_DIR/compare-shared-components"
PORT="${CSSVD_STORYBOOK_PORT:-18607}"
URL="http://127.0.0.1:${PORT}/iframe.html?id=design-system-package-parity--shared-components"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cd "$REPO_ROOT"
pnpm --dir web build-storybook --output-dir "$STORYBOOK_DIR"

python3 -m http.server "$PORT" --directory "$STORYBOOK_DIR" > "$OUT_DIR/http-server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT

# Wait for the static server to answer before Chromium navigates.
for _ in $(seq 1 50); do
  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

css-visual-diff compare \
  --url1 "$URL" \
  --selector1 '[data-cvd="local-shared-components"]' \
  --url2 "$URL" \
  --selector2 '[data-cvd="package-shared-components"]' \
  --viewport-w 1440 \
  --viewport-h 1000 \
  --threshold 30 \
  --out "$COMPARE_DIR"


REPORT_MD="$COMPARE_DIR/compare.md"
PREFIXED_REPORT_MD="$COMPARE_DIR/01-compare.md"
if [[ -f "$REPORT_MD" ]]; then
  {
    cat <<'FM'
---
Title: Storybook Package Parity css-visual-diff Report
Ticket: RAGEVAL-DESIGN-SYSTEM-UNIFY
Status: active
Topics: [design-system, frontend-architecture, react, packaging, storybook]
DocType: reference
Intent: short-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: css-visual-diff report comparing local web shared components against package components in Storybook.
LastUpdated: 2026-06-07T00:00:00Z
WhatFor: Visual parity evidence for package-canonical shared components.
WhenToUse: Before deleting local duplicated component implementations.
---

FM
    cat "$REPORT_MD"
  } > "$PREFIXED_REPORT_MD"
  rm "$REPORT_MD"
fi

printf 'Storybook URL: %s\nCompare output: %s\n' "$URL" "$COMPARE_DIR" | tee "$OUT_DIR/summary.txt"
