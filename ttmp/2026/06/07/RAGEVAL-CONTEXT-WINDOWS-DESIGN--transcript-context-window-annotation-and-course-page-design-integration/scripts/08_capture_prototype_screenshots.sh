#!/usr/bin/env bash
# Capture standalone prototype screenshots for baseline visual comparison.
# Usage: ./scripts/08_capture_prototype_screenshots.sh [output-dir]
#
# Follows the same workflow as Pyxis:
#   1. Generate standalone HTML from prototype JSX (see 09_generate_standalone_html.py)
#   2. Add data-* annotations to prototype widgets (already done to sources/03-context-viewer-design-iteration/*.jsx)
#   3. Serve HTML locally and capture screenshots via Playwright
#   4. Compare against Storybook component screenshots via css-visual-diff
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TICKET_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STANDALONE_DIR="$TICKET_ROOT/prototype-design/standalone"
OUT_DIR="${1:-$TICKET_ROOT/prototype-design/visual-diff/prototype-screenshots}"
mkdir -p "$OUT_DIR"

SERVER_PID=""
cleanup() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Start prototype HTTP server
echo "Starting prototype server on port 7071..."
python3 -m http.server 7071 --directory "$STANDALONE_DIR" &
SERVER_PID=$!
sleep 2

# Verify server is running
if ! curl -fsS http://localhost:7071/ >/dev/null 2>&1; then
  echo "ERROR: Prototype server not responding"
  exit 1
fi

echo "Server running at http://localhost:7071"
echo "Capturing screenshots..."
echo ""

# Use Node.js + Playwright for reliable React rendering
cat > /tmp/rag-prototype-capture.mjs <<'NODESCRIPT'
import { chromium } from 'playwright';

const pages = [
  { path: 'full-app/app.html', label: 'Full App Shell' },
  { path: 'full-app/landing.html', label: 'Landing Course' },
  { path: 'full-app/visualize.html', label: 'Visualize Context Window' },
  { path: 'full-app/transcript.html', label: 'Transcript Annotation' },
  { path: 'full-app/comments.html', label: 'Comments Review' },
  { path: 'full-app/slides.html', label: 'Slides Presentation' },
  { path: 'full-app/handout.html', label: 'Handout Downloads' },
  { path: 'full-app/upload.html', label: 'Upload Context Window' },
];

const outDir = process.argv[2] || 'prototype-design/visual-diff/prototype-screenshots';
const basePort = 7071;

const browser = await chromium.launch({ headless: true });
const count = pages.length;

for (let i = 0; i < count; i++) {
  const { path, label } = pages[i];
  const url = `http://localhost:${basePort}/${path}`;
  const safeName = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const outFile = `${outDir}/${safeName}.png`;

  console.log(`  [${i + 1}/${count}] ${label} (${path}) → ${outFile}`);

  const page = await browser.newPage({ viewport: { width: 1240, height: 760 } });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    // Wait for React + Babel to render
    await page.waitForTimeout(3000);
    await page.screenshot({ path: outFile, fullPage: false });
    console.log(`    ✓ Captured`);
  } catch (e) {
    console.error(`    ✗ Error: ${e.message}`);
    // Still try to screenshot what we have
    try { await page.screenshot({ path: outFile, fullPage: false }); } catch {}
  }
  await page.close();
}

await browser.close();
console.log(`\nDone — captured ${count} prototype screenshots to ${outDir}/`);
NODESCRIPT

node /tmp/rag-prototype-capture.mjs "$OUT_DIR"

echo ""
echo "Captured files:"
ls -la "$OUT_DIR/"
