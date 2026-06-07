#!/usr/bin/env bash
# Capture original context-viewer prototype page/widget screenshots.
#
# The standalone HTML pages are only render harnesses. The actual extraction
# uses data-rag-* selectors and css-visual-diff's JavaScript browser runtime
# via scripts/10_rag_prototype_cssvd.js.
#
# Usage:
#   ./scripts/08_capture_prototype_screenshots.sh [output-dir]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TICKET_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="${1:-$TICKET_ROOT/prototype-design/visual-diff/prototype-screenshots}"
PORT="${RAG_PROTOTYPE_PORT:-7071}"
BASE_URL="http://127.0.0.1:$PORT"
mkdir -p "$OUT_DIR"

SERVER_PID=""
cleanup() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Rebuild the per-screen harnesses before capture.
"$SCRIPT_DIR/09_generate_standalone_html.py"

# Serve the ticket root so both the original source index and generated harnesses work:
#   /sources/03-context-viewer-design-iteration/index.html
#   /prototype-design/standalone/full-app/*.html
echo "Starting prototype server on $BASE_URL ..."
python3 -m http.server "$PORT" --directory "$TICKET_ROOT" >/tmp/rag-prototype-cssvd-server.log 2>&1 &
SERVER_PID=$!
sleep 2

if ! curl -fsS "$BASE_URL/sources/03-context-viewer-design-iteration/index.html" >/dev/null 2>&1; then
  echo "ERROR: Prototype server did not expose the original index.html"
  exit 1
fi

if ! curl -fsS "$BASE_URL/prototype-design/standalone/full-app/landing.html" >/dev/null 2>&1; then
  echo "ERROR: Prototype server did not expose generated standalone pages"
  exit 1
fi

echo "Capturing prototype screenshots with css-visual-diff jsverbs..."
css-visual-diff verbs \
  --repository "$SCRIPT_DIR" \
  rag prototype capture-all \
  --baseUrl "$BASE_URL" \
  --outDir "$OUT_DIR" \
  --output json

echo ""
echo "Captured files:"
find "$OUT_DIR" -maxdepth 1 -type f -name '*.png' -print | sort
