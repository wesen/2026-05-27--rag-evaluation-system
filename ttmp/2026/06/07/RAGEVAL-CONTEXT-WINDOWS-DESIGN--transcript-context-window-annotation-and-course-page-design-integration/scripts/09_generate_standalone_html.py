#!/usr/bin/env python3
"""Generate standalone HTML files from context-viewer prototype JSX screens.

Each screen gets its own HTML file that loads React/Babel from CDN,
loads the original prototype CSS/JSX files, and renders a single screen
component. The standalone HTML is only the browser harness; data-rag-* selectors
inside the prototype are the extraction handles for screenshots/comparison.

This follows the Pyxis standalone prototype pattern.
"""

from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
TICKET_ROOT = SCRIPT_DIR.parent
OUT_DIR = TICKET_ROOT / "prototype-design" / "standalone" / "full-app"
WIDGET_OUT_DIR = TICKET_ROOT / "prototype-design" / "standalone" / "widgets"
INDEX_DIR = TICKET_ROOT / "prototype-design" / "standalone"

# Paths are relative from prototype-design/standalone/full-app/*.html.
SRC_BASE = "../../../sources/03-context-viewer-design-iteration"

COMMON_DEPS = [
    "ds",
    "patterns",
    "diagrams",
    "data",
    "data2",
    "screens",
    "screens2",
    "screens3",
    "tweaks-panel",
]

# Direct-render screen definitions: (html_slug, component_name, label).
# The full app shell already exists as sources/03-context-viewer-design-iteration/index.html;
# do not regenerate it here. These pages are only per-screen harnesses for
# selector-based screenshot extraction.
SCREENS = [
    ("landing", "LandingScreen", "Landing / Course"),
    ("visualize", "Visualize", "Visualize / Context Window"),
    ("transcript", "Transcript", "Transcript / Annotation"),
    ("comments", "Comments", "Comments / Review"),
    ("slides", "SlideViewer", "Slides / Presentation"),
    ("handout", "Handout", "Handout / Downloads"),
    ("upload", "Upload", "Upload Context Window"),
]

# Widget harnesses render prototype components directly so css-visual-diff can
# capture original atoms/molecules that are otherwise hidden behind interaction
# state (for example non-default diagram views).
WIDGETS = [
    ("strip-diagram", "Context Strip Diagram", 'const d = adapt(SNAPSHOTS[1], "strip"); return <div style={{ width: 720, padding: 24 }}><DiagramRenderer d={d} /><div style={{ marginTop: 18 }}><Legend /></div></div>;'),
    ("stack-diagram", "Context Stack Diagram", 'const d = adapt(SNAPSHOTS[1], "stack"); return <div style={{ width: 720, padding: 24 }}><DiagramRenderer d={d} /><div style={{ marginTop: 18 }}><Legend /></div></div>;'),
    ("budget-bar", "Context Budget Bar", 'const d = adapt(SNAPSHOTS[2], "budget"); return <div style={{ width: 720, padding: 24 }}><DiagramRenderer d={d} /><div style={{ marginTop: 18 }}><Legend /></div></div>;'),
    ("treemap", "Context Treemap", 'const d = adapt(SNAPSHOTS[1], "treemap"); return <div style={{ width: 720, padding: 24 }}><DiagramRenderer d={d} /><div style={{ marginTop: 18 }}><Legend /></div></div>;'),
]

HTML_TEMPLATE = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>RAG Evaluation · {label}</title>
<meta name="viewport" content="width=1240" />
<link rel="stylesheet" href="{src_base}/styles.css" />
<style>
  html, body {{ margin: 0; padding: 0; background: #fff; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
  #root {{ width: 1240px; height: 760px; min-height: 760px; background: #fff; overflow: hidden; }}
  body.standalone-direct #root > .grow {{ height: 760px; }}
</style>
</head>
<body class="standalone-direct">
<div id="root"></div>

<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"></script>

{deps}
{app_dep}

<script type="text/babel" data-presets="react">
  function StandaloneScreen() {{
    return <{component} />;
  }}
  {render_code}
</script>
</body>
</html>
'''

WIDGET_HTML_TEMPLATE = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>RAG Evaluation Prototype Widget · {label}</title>
<meta name="viewport" content="width=760" />
<link rel="stylesheet" href="{src_base}/styles.css" />
<style>
  html, body {{ margin: 0; padding: 0; background: #fff; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
  #root {{ width: 760px; min-height: 520px; background: #fff; overflow: visible; }}
</style>
</head>
<body>
<div id="root"></div>

<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"></script>

{deps}

<script type="text/babel" data-presets="react">
  function StandaloneWidget() {{
    {body}
  }}
  ReactDOM.createRoot(document.getElementById("root")).render(<StandaloneWidget />);
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
<p>Standalone HTML entrypoints for baseline screenshot/CSS extraction. These load the prototype JSX and render each screen at a fixed viewport.</p>
<ul>
{links}
</ul>
</body>
</html>
'''


def generate_html(slug: str, component: str, label: str) -> str:
    deps_html = "".join(
        f'<script type="text/babel" src="{SRC_BASE}/{d}.jsx"></script>\n'
        for d in COMMON_DEPS
    )
    app_dep = ""
    render_code = 'ReactDOM.createRoot(document.getElementById("root")).render(<StandaloneScreen />);'
    return HTML_TEMPLATE.format(
        label=label,
        component=component,
        deps=deps_html,
        app_dep=app_dep,
        src_base=SRC_BASE,
        render_code=render_code,
    )


def generate_widget_html(label: str, body: str) -> str:
    deps_html = "".join(
        f'<script type="text/babel" src="{SRC_BASE}/{d}.jsx"></script>\n'
        for d in COMMON_DEPS
    )
    return WIDGET_HTML_TEMPLATE.format(label=label, body=body, deps=deps_html, src_base=SRC_BASE)


def generate_catalog() -> str:
    screen_links = "".join(
        f'  <li><a href="full-app/{slug}.html">{label}</a><span class="label">Screen harness</span></li>\n'
        for slug, component, label in SCREENS
    )
    widget_links = "".join(
        f'  <li><a href="widgets/{slug}.html">{label}</a><span class="label">Widget harness</span></li>\n'
        for slug, label, body in WIDGETS
    )
    source_link = '  <li><a href="../../sources/03-context-viewer-design-iteration/index.html">Original full app shell</a><span class="label">Existing prototype index.html</span></li>\n'
    return CATALOG_TEMPLATE.format(links=source_link + screen_links + widget_links)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    WIDGET_OUT_DIR.mkdir(parents=True, exist_ok=True)
    INDEX_DIR.mkdir(parents=True, exist_ok=True)

    index_path = INDEX_DIR / "index.html"
    index_path.write_text(generate_catalog())
    print(f"Written: {index_path}")

    for slug, component, label in SCREENS:
        path = OUT_DIR / f"{slug}.html"
        path.write_text(generate_html(slug, component, label))
        print(f"Written: {path} ({component})")

    for slug, label, body in WIDGETS:
        path = WIDGET_OUT_DIR / f"{slug}.html"
        path.write_text(generate_widget_html(label, body))
        print(f"Written: {path} (widget)")

    print(f"\nDone — generated {len(SCREENS)} screen HTML files and {len(WIDGETS)} widget HTML files")


if __name__ == "__main__":
    main()
