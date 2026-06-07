#!/usr/bin/env python3
"""Generate standalone HTML files from context-viewer prototype JSX screens.

Each screen gets its own HTML file that loads React/Babel from CDN,
imports the prototype JSX files, and renders a single screen component.

Follows the Pyxis pattern from prototype-design/-deprecated/visual-diff-scripts/15-generate-standalone-full-app-html.mjs
"""

import os
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
TICKET_ROOT = SCRIPT_DIR.parent
SRC_DIR = TICKET_ROOT / "sources" / "03-context-viewer-design-iteration"
OUT_DIR = TICKET_ROOT / "prototype-design" / "standalone" / "full-app"
INDEX_DIR = TICKET_ROOT / "prototype-design" / "standalone"

# Screen definitions: (html_slug, component_name, label, required_jsx_deps)
SCREENS = [
    ("app", "App", "Full App Shell", ["patterns", "data", "tweaks-panel", "screens", "screens2", "screens3", "app"]),
    ("landing", "LandingScreen", "Landing / Course", ["patterns", "data", "tweaks-panel", "screens"]),
    ("visualize", "Visualize", "Visualize / Context Window", ["patterns", "data", "tweaks-panel", "screens"]),
    ("transcript", "Transcript", "Transcript / Annotation", ["patterns", "data", "tweaks-panel", "screens2"]),
    ("comments", "Comments", "Comments / Review", ["patterns", "data", "tweaks-panel", "screens3"]),
    ("slides", "SlideViewer", "Slides / Presentation", ["patterns", "data", "tweaks-panel", "screens3"]),
    ("handout", "Handout", "Handout / Downloads", ["patterns", "data", "tweaks-panel", "screens2"]),
    ("upload", "Upload", "Upload Context Window", ["patterns", "data", "tweaks-panel", "screens"]),
]

HTML_TEMPLATE = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>RAG Evaluation · {label}</title>
<meta name="viewport" content="width=1240" />
<style>
  html, body {{ margin: 0; padding: 0; background: #fff; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
  #root {{ width: 1240px; min-height: 760px; background: #fff; overflow: visible; }}
</style>
</head>
<body>
<div id="root"></div>

<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"></script>

{deps}

<script type="text/babel" data-presets="react">
  function StandaloneScreen() {{
    return <{component} />;
  }}
  ReactDOM.createRoot(document.getElementById("root")).render(<StandaloneScreen />);
</script>
</body>
</html>
'''

CATALOG_TEMPLATE = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>RAG Evaluation — Context Viewer prototype pages</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body {{ margin: 0; padding: 32px; background: #F3F1EB; color: #1F1E1C; font: 14px/1.5 Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
  h1 {{ margin: 0 0 10px; font-family: Georgia, serif; font-size: 32px; }}
  p {{ margin: 0 0 24px; color: #8E887E; }}
  ul {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; padding: 0; margin: 0; list-style: none; }}
  li {{ background: #fff; border: 1px solid #EAE7E0; border-radius: 10px; padding: 14px 16px; }}
  a {{ color: #C8270D; text-decoration: none; font-weight: 700; }}
  a:hover {{ text-decoration: underline; }}
  .label {{ display: block; margin-top: 4px; font-size: 12px; color: #8E887E; }}
</style>
</head>
<body>
<h1>RAG Evaluation — Context Viewer prototype pages</h1>
<p>Standalone HTML entrypoints for baseline screenshot/CSS extraction. These load the prototype JSX via CDN and render each screen at a fixed viewport.</p>
<ul>
{links}
</ul>
</body>
</html>
'''


def generate_html(slug, component, label, deps):
    """Generate standalone HTML for one screen."""
    deps_html = "".join(
        f'<script type="text/babel" src="../../sources/03-context-viewer-design-iteration/{d}.jsx"></script>'
        for d in deps
    )
    return HTML_TEMPLATE.format(
        label=label,
        component=component,
        deps=deps_html,
    )


def generate_catalog():
    """Generate the prototype page catalog index."""
    links = "".join(
        f'  <li><a href="full-app/{slug}.html">{label}</a><span class="label">{label}</span></li>\n'
        for slug, component, label, deps in SCREENS
    )
    return CATALOG_TEMPLATE.format(links=links)


def main():
    out_dir = OUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    # Index catalog
    index_path = INDEX_DIR / "index.html"
    index_path.write_text(generate_catalog())
    print(f"Written: {index_path}")

    count = 0
    for slug, component, label, deps in SCREENS:
        html = generate_html(slug, component, label, deps)
        path = out_dir / f"{slug}.html"
        path.write_text(html)
        count += 1
        print(f"Written: {path} (deps: {', '.join(deps)})")

    print(f"\nDone — generated {count} standalone HTML files")


if __name__ == "__main__":
    main()
