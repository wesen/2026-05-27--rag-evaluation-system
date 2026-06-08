#!/usr/bin/env bash
set -euo pipefail

TICKET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$TICKET_DIR/sources/css-visual-diff-help"
mkdir -p "$OUT_DIR"

css-visual-diff help --all > "$OUT_DIR/help-all.txt"
css-visual-diff help getting-started > "$OUT_DIR/help-getting-started.txt"
css-visual-diff help javascript-api > "$OUT_DIR/help-javascript-api.txt"
css-visual-diff help javascript-verbs > "$OUT_DIR/help-javascript-verbs.txt"
css-visual-diff help review-site > "$OUT_DIR/help-review-site.txt"
css-visual-diff help site-comparison-workflow > "$OUT_DIR/help-site-comparison-workflow.txt"
css-visual-diff help pixel-accuracy-scripting-guide > "$OUT_DIR/help-pixel-accuracy-scripting-guide.txt"
css-visual-diff help js-verb-review-sweep > "$OUT_DIR/help-js-verb-review-sweep.txt"

wc -l "$OUT_DIR"/*.txt
