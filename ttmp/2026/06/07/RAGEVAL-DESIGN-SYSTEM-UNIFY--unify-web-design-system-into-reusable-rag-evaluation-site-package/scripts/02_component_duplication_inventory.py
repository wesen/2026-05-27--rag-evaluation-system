#!/usr/bin/env python3
from __future__ import annotations

import filecmp
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[6]
TICKET = Path(__file__).resolve().parents[1]
OUT = TICKET / "sources" / "01-duplication-inventory.json"
OUT_MD = TICKET / "sources" / "01-duplication-inventory.md"

pairs = [
    (ROOT / "web/src/components", ROOT / "packages/rag-evaluation-site/src/components", "components"),
    (ROOT / "web/src/widgets", ROOT / "packages/rag-evaluation-site/src/widgets", "widgets"),
    (ROOT / "web/src/hooks", ROOT / "packages/rag-evaluation-site/src/hooks", "hooks"),
]

rows = []
for web_dir, pkg_dir, group in pairs:
    if not web_dir.exists() or not pkg_dir.exists():
        continue
    web_files = {p.relative_to(web_dir).as_posix(): p for p in web_dir.rglob("*") if p.is_file()}
    pkg_files = {p.relative_to(pkg_dir).as_posix(): p for p in pkg_dir.rglob("*") if p.is_file()}
    for rel in sorted(web_files.keys() & pkg_files.keys()):
        rows.append({"group": group, "path": rel, "status": "identical" if filecmp.cmp(web_files[rel], pkg_files[rel], shallow=False) else "different"})
    for rel in sorted(web_files.keys() - pkg_files.keys()):
        rows.append({"group": group, "path": rel, "status": "web_only"})
    for rel in sorted(pkg_files.keys() - web_files.keys()):
        rows.append({"group": group, "path": rel, "status": "package_only"})

OUT.write_text(json.dumps(rows, indent=2))

counts = {}
for row in rows:
    counts[(row["group"], row["status"])] = counts.get((row["group"], row["status"]), 0) + 1

lines = [
    "---",
    "Title: Component Duplication Inventory",
    "Ticket: RAGEVAL-DESIGN-SYSTEM-UNIFY",
    "Status: active",
    "Topics: [design-system, frontend-architecture, react, packaging, storybook]",
    "DocType: reference",
    "Intent: long-term",
    "Owners: []",
    "RelatedFiles: []",
    "ExternalSources: []",
    "Summary: Machine-generated inventory of duplicated files between web/src and packages/rag-evaluation-site/src.",
    "LastUpdated: 2026-06-07T00:00:00Z",
    "WhatFor: Use to decide which files can be package-canonical and which remain web-specific.",
    "WhenToUse: Before moving imports or deleting duplicated frontend files.",
    "---",
    "",
    "# Component Duplication Inventory",
    "",
    "## Counts",
    "",
    "| Group | Status | Count |",
    "|---|---:|---:|",
]
for (group, status), count in sorted(counts.items()):
    lines.append(f"| {group} | {status} | {count} |")
lines += ["", "## Different shared files", ""]
for row in rows:
    if row["status"] == "different":
        lines.append(f"- `{row['group']}/{row['path']}`")
lines += ["", "## Web-only files", ""]
for row in rows:
    if row["status"] == "web_only":
        lines.append(f"- `{row['group']}/{row['path']}`")
OUT_MD.write_text("\n".join(lines))
print(OUT_MD)
