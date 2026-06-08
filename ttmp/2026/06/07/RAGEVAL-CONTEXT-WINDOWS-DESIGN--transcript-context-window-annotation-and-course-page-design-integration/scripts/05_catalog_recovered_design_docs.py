#!/usr/bin/env python3
"""Catalog recovered frontend/design-system documents for this ticket.

The minitrace and git searches identify likely tickets. This script extracts the
frontmatter-ish metadata and first headings from the most relevant documents so
we can review a compact evidence table before reading full documents.
"""
from __future__ import annotations

from pathlib import Path
import re

REPO = Path(__file__).resolve().parents[6]
TICKET = Path(__file__).resolve().parents[1]
OUT = TICKET / "sources" / "01-recovered-design-docs.md"

DOCS = [
    "ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/design-doc/02-rag-react-design-system-guidelines.md",
    "ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/analysis/01-rag-design-system-guideline-audit.md",
    "ttmp/2026/06/07/RAGEVAL-DS-RAGEVAL-QWEN36-HIGH--rag-design-system-reference-sheet-styling-design-widget-interaction-hierarchy/design-doc/01-styling-and-design-reference.md",
    "ttmp/2026/06/07/RAGEVAL-DS-RAGEVAL-QWEN36-HIGH--rag-design-system-reference-sheet-styling-design-widget-interaction-hierarchy/design-doc/02-widget-hierarchy-and-interaction-reference.md",
    "ttmp/2026/06/05/WIDGETDSL-VISUAL-QUALITY--widget-dsl-visual-quality-and-rich-website-design/design-doc/01-widget-dsl-visual-quality-analysis-and-implementation-guide.md",
    "ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/design-doc/01-widgetrenderer-packaging-architecture-and-implementation-guide.md",
    "ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/01-ui-dsl-and-kanban-dsl-design-and-implementation-guide.md",
    "ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/02-rag-widget-dsl-design-component-to-html-mapping.md",
    "ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/03-review-and-revised-implementation-guide-for-the-rag-widget-dsl.md",
]

OBSIDIAN_DOCS = [
    "/home/manuel/code/wesen/go-go-golems/go-go-parc/Projects/2026/06/02/ARTICLE - RAG React Design System - From Prototype Dashboard to Structured Design System.md",
]


def extract(path: Path) -> dict[str, str | list[str]]:
    text = path.read_text(errors="replace")
    title = ""
    m = re.search(r"^title:\s*[\"']?(.+?)[\"']?\s*$", text, re.M | re.I)
    if not m:
        m = re.search(r"^Title:\s*(.+?)\s*$", text, re.M)
    if m:
        title = m.group(1).strip().strip('"')
    if not title:
        h = re.search(r"^#\s+(.+)$", text, re.M)
        title = h.group(1).strip() if h else path.name
    summary = ""
    m = re.search(r"^Summary:\s*(.+?)\s*$", text, re.M)
    if m:
        summary = m.group(1).strip().strip('"')
    what_for = ""
    m = re.search(r"^WhatFor:\s*(.+?)\s*$", text, re.M)
    if m:
        what_for = m.group(1).strip().strip('"')
    headings = re.findall(r"^#{2,3}\s+(.+)$", text, re.M)[:8]
    return {"title": title, "summary": summary, "what_for": what_for, "headings": headings}


def main() -> None:
    lines = ["# Recovered frontend/design-system documents", ""]
    for rel in DOCS:
        path = REPO / rel
        if not path.exists():
            lines += [f"## Missing: `{rel}`", ""]
            continue
        meta = extract(path)
        lines += [f"## {meta['title']}", "", f"- Path: `{path}`"]
        if meta["summary"]:
            lines.append(f"- Summary: {meta['summary']}")
        if meta["what_for"]:
            lines.append(f"- WhatFor: {meta['what_for']}")
        lines.append("- First headings:")
        lines.extend(f"  - {h}" for h in meta["headings"])
        lines.append("")
    lines += ["# Obsidian/source articles referenced by transcripts", ""]
    for raw in OBSIDIAN_DOCS:
        path = Path(raw)
        if not path.exists():
            lines += [f"## Missing: `{raw}`", ""]
            continue
        meta = extract(path)
        lines += [f"## {meta['title']}", "", f"- Path: `{path}`", "- First headings:"]
        lines.extend(f"  - {h}" for h in meta["headings"])
        lines.append("")
    OUT.write_text("\n".join(lines))
    print(OUT)

if __name__ == "__main__":
    main()
