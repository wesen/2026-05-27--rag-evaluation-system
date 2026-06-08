#!/usr/bin/env python3
"""Summarize the unpacked context-viewer prototype source files.

It extracts top-level functions/constants from JSX and CSS custom properties/classes
from the stylesheet. The goal is a compact objective source map for the analysis
without treating the prototype as production-ready code.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

TICKET = Path(__file__).resolve().parents[1]
SRC = TICKET / "sources" / "03-context-viewer-design-iteration"
OUT_JSON = TICKET / "sources" / "04-context-viewer-source-map.json"
OUT_MD = TICKET / "sources" / "04-context-viewer-source-map.md"

function_re = re.compile(r"^function\s+([A-Za-z0-9_]+)\s*\(", re.M)
const_re = re.compile(r"^const\s+([A-Z][A-Za-z0-9_]+)\s*=", re.M)
css_var_re = re.compile(r"(--[A-Za-z0-9_-]+)\s*:")
css_class_re = re.compile(r"^\.([A-Za-z0-9_-]+)\b", re.M)

summary = []
for path in sorted(SRC.glob("*.jsx")) + sorted(SRC.glob("*.css")):
    text = path.read_text(errors="replace")
    is_css = path.suffix == ".css"
    item = {
        "file": path.name,
        "lines": text.count("\n") + 1,
        "functions": function_re.findall(text) if not is_css else [],
        "top_level_constants": const_re.findall(text) if not is_css else [],
        "css_variables": sorted(set(css_var_re.findall(text))) if is_css else [],
        "css_classes": sorted(set(css_class_re.findall(text))) if is_css else [],
    }
    summary.append(item)

OUT_JSON.write_text(json.dumps(summary, indent=2))

lines = ["---", "Title: Context Viewer Source Map", "Ticket: RAGEVAL-CONTEXT-WINDOWS-DESIGN", "Status: active", "Topics: [design-system, frontend-architecture, react, rag, ui-dsl]", "DocType: reference", "Intent: long-term", "Owners: []", "RelatedFiles: []", "ExternalSources: []", "Summary: Extracted top-level functions, constants, CSS variables, and CSS classes from the context-viewer prototype.", "LastUpdated: 2026-06-07T00:00:00Z", "WhatFor: Use as a compact source map for context-viewer analysis.", "WhenToUse: Before reading individual prototype source files.", "---", "", "# Context Viewer Source Map", ""]
for item in summary:
    lines.append(f"## `{item['file']}`")
    lines.append(f"- Lines: {item['lines']}")
    if item["functions"]:
        lines.append("- Functions: " + ", ".join(f"`{x}`" for x in item["functions"]))
    if item["top_level_constants"]:
        lines.append("- Top-level constants: " + ", ".join(f"`{x}`" for x in item["top_level_constants"]))
    if item["css_variables"]:
        lines.append("- CSS variables: " + ", ".join(f"`{x}`" for x in item["css_variables"]))
    if item["css_classes"]:
        classes = item["css_classes"]
        lines.append("- CSS classes: " + ", ".join(f"`.{x}`" for x in classes[:80]) + (f" … (+{len(classes)-80} more)" if len(classes) > 80 else ""))
    lines.append("")
OUT_MD.write_text("\n".join(lines))
print(OUT_MD)
