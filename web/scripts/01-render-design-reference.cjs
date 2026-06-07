/**
 * 01-render-design-reference.js
 *
 * Renders two self-contained HTML reference pages using React SSR:
 *   1. Foundation & Tokens  (colours, typography, spacing, component states)
 *   2. Widgets & Composition (every widget, composition patterns, action model)
 *
 * Run from the web/ directory:
 *   cd web && node scripts/01-render-design-reference.js
 *
 * Approach:
 *   - Start a Vite dev server in SSR middleware mode
 *   - ssrLoadModule resolves CSS Modules + TSX correctly
 *   - renderToString produces HTML with scoped class names
 *   - Separate Vite client build extracts the CSS (same hashes)
 *   - Combine into self-contained HTML files
 */

const { createServer, build } = require('vite');
const { renderToString } = require('react-dom/server');
const React = require('react');
const fs = require('fs');
const path = require('path');

const WEB_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(
  __dirname,
  '../../ttmp/2026/06/07/DESIGN-REF-001--rag-evaluation-design-system-reference/output'
);

async function main() {
  console.log('=== Step 1: Start Vite dev server (SSR mode) ===');
  const server = await createServer({
    root: WEB_ROOT,
    server: { middlewareMode: true },
    appType: 'custom',
  });
  console.log('Vite dev server started');

  console.log('=== Step 2: Render foundation reference ===');
  const foundationMod = await server.ssrLoadModule('/src/reference-pages/FoundationReference.tsx');
  const FoundationPage = foundationMod.default || foundationMod.FoundationReference;
  const foundationHtml = renderToString(React.createElement(FoundationPage));
  console.log('Foundation HTML rendered:', foundationHtml.length, 'chars');

  console.log('=== Step 3: Render widget reference ===');
  const widgetMod = await server.ssrLoadModule('/src/reference-pages/WidgetReference.tsx');
  const WidgetPage = widgetMod.default || widgetMod.WidgetReference;
  const widgetHtml = renderToString(React.createElement(WidgetPage));
  console.log('Widget HTML rendered:', widgetHtml.length, 'chars');

  console.log('=== Step 4: Build client CSS ===');
  const clientBuild = await build({
    root: WEB_ROOT,
    build: {
      write: false,
      rollupOptions: {
        input: [
          path.resolve(WEB_ROOT, 'src/index.css'),
          path.resolve(WEB_ROOT, 'src/reference-pages/FoundationReference.tsx'),
          path.resolve(WEB_ROOT, 'src/reference-pages/WidgetReference.tsx'),
        ],
      },
    },
    logLevel: 'warn',
  });
  let css = '';
  for (const chunk of clientBuild.output) {
    if (chunk.type === 'asset' && chunk.fileName.endsWith('.css')) {
      css += chunk.source;
    }
  }
  console.log('CSS extracted:', css.length, 'chars');

  console.log('=== Step 5: Write self-contained HTML files ===');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const foundationOutput = wrapInPage('Design System — Foundation & Tokens', css, foundationHtml);
  fs.writeFileSync(path.resolve(OUTPUT_DIR, 'foundation-and-tokens.html'), foundationOutput);
  console.log('Written: foundation-and-tokens.html');

  const widgetOutput = wrapInPage('Design System — Widgets & Composition', css, widgetHtml);
  fs.writeFileSync(path.resolve(OUTPUT_DIR, 'widgets-and-composition.html'), widgetOutput);
  console.log('Written: widgets-and-composition.html');

  await server.close();
  console.log('=== Done ===');
}

function wrapInPage(title, css, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
${css}

/* Reference page layout helpers */
.ds-ref-page { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
.ds-ref-section { margin-top: 2.5rem; }
.ds-ref-section-title { border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 1rem; font: 700 12px/1.25 Monaco, monospace; }
.ds-ref-label { font: 400 11px/1.35 Monaco, monospace; color: #666; margin-bottom: 0.25rem; }
.ds-ref-row { display: flex; gap: 1rem; flex-wrap: wrap; margin: 0.5rem 0; align-items: flex-start; }
.ds-ref-item { flex: 0 0 auto; min-width: 120px; }
.ds-ref-code { font: 400 11px/1.35 Monaco, monospace; background: #f5f5f5; padding: 1px 4px; }
</style>
</head>
<body>
<div class="ds-ref-page">
${body}
</div>
</body>
</html>`;
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
