#!/usr/bin/env bash
set -euo pipefail

TICKET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$TICKET_DIR/../../../../.." && pwd)"
OUT_DIR="$TICKET_DIR/sources/git"
mkdir -p "$OUT_DIR"

cd "$REPO_ROOT"

git log --date=iso --pretty=format:'%h%x09%ad%x09%s' -- web packages/rag-evaluation-site internal/web pkg/widgetdsl pkg/widgetserver pkg/widgetrunner > "$OUT_DIR/frontend-history.tsv" || true
git log --name-only --date=iso --pretty=format:'--COMMIT--%x09%H%x09%ad%x09%s' -- web packages/rag-evaluation-site internal/web pkg/widgetdsl pkg/widgetserver pkg/widgetrunner > "$OUT_DIR/frontend-history-with-files.txt" || true

git ls-files 'web/**' 'packages/rag-evaluation-site/**' 'internal/web/**' 'pkg/widgetdsl/**' 'pkg/widgetserver/**' 'pkg/widgetrunner/**' > "$OUT_DIR/frontend-tracked-files.txt"

wc -l "$OUT_DIR"/*
