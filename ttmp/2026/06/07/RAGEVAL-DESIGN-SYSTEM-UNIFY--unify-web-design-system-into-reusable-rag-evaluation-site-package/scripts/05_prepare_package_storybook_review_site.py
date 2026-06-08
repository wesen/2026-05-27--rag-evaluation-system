#!/usr/bin/env python3
"""Convert package Storybook css-visual-diff sweep output to serveable review-site layout."""

from __future__ import annotations

import csv
import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any

SCRIPT = Path(__file__).resolve()
TICKET = SCRIPT.parents[1]
SWEEP = TICKET / "sources" / "visual-parity" / "package-story-sweep"
REVIEW = TICKET / "sources" / "visual-parity" / "package-story-sweep-review"
PAGE = "package-storybook"


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def link_or_copy(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() or dst.is_symlink():
        dst.unlink()
    try:
        rel = os.path.relpath(src, start=dst.parent)
        dst.symlink_to(rel)
    except OSError:
        shutil.copy2(src, dst)


def trim_for_review(src: Path, dst: Path) -> None:
    """Create a review-friendly image crop from a css-visual-diff screenshot.

    Storybook's #storybook-root often spans the whole viewport even when the
    story content is a small control. The raw screenshots are correct for pixel
    comparison but too wide/tiny in the review UI, so trim whitespace and add a
    small white border for human review.
    """
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() or dst.is_symlink():
        dst.unlink()
    result = subprocess.run(
        ["convert", str(src), "-trim", "+repage", "-bordercolor", "white", "-border", "12", str(dst)],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        shutil.copy2(src, dst)


def bounds_delta(left: dict[str, Any], right: dict[str, Any]) -> dict[str, float]:
    return {
        "x": float(right.get("x", 0)) - float(left.get("x", 0)),
        "y": float(right.get("y", 0)) - float(left.get("y", 0)),
        "width": float(right.get("width", 0)) - float(left.get("width", 0)),
        "height": float(right.get("height", 0)) - float(left.get("height", 0)),
    }


def main() -> None:
    story_list = SWEEP / "story-list.tsv"
    reports = SWEEP / "reports"
    if not story_list.exists():
        raise SystemExit(f"missing story list: {story_list}")

    if REVIEW.exists():
        shutil.rmtree(REVIEW)
    REVIEW.mkdir(parents=True)

    rows: list[dict[str, Any]] = []
    with story_list.open(newline="") as f:
        reader = csv.reader(f, delimiter="\t")
        for story_id, title, name in reader:
            src_dir = reports / story_id
            compare_src = src_dir / "compare.json"
            data = read_json(compare_src)
            pixel = data.get("pixel_diff", {})
            left_bounds = data.get("url1", {}).get("computed", {}).get("bounds", {})
            right_bounds = data.get("url2", {}).get("computed", {}).get("bounds", {})
            section = story_id
            dst_dir = REVIEW / PAGE / "artifacts" / section

            link_map = {
                "compare.json": compare_src,
                "diff_only.png": src_dir / "diff_only.png",
                "diff_comparison.png": src_dir / "diff_comparison.png",
            }
            for dst_name, src in link_map.items():
                if not src.exists():
                    raise SystemExit(f"missing artifact for {story_id}: {src}")
                link_or_copy(src, dst_dir / dst_name)

            left_src = src_dir / "url1_screenshot.png"
            right_src = src_dir / "url2_screenshot.png"
            for src in [left_src, right_src]:
                if not src.exists():
                    raise SystemExit(f"missing artifact for {story_id}: {src}")
            trim_for_review(left_src, dst_dir / "left_region.png")
            trim_for_review(right_src, dst_dir / "right_region.png")

            changed_percent = float(pixel.get("changed_percent", 0) or 0)
            changed_pixels = int(pixel.get("changed_pixels", 0) or 0)
            style_diffs = data.get("computed_diffs", []) or []
            attribute_diffs = data.get("attribute_diffs", []) or []
            row = {
                "page": PAGE,
                "section": section,
                "title": title,
                "name": name,
                "classification": "accepted" if changed_pixels == 0 else "review",
                "changedPercent": changed_percent,
                "changedPixels": changed_pixels,
                "totalPixels": int(pixel.get("total_pixels", 0) or 0),
                "threshold": int(pixel.get("threshold", 30) or 30),
                "variant": "desktop",
                "leftRegionPath": str((dst_dir / "left_region.png").absolute()),
                "rightRegionPath": str((dst_dir / "right_region.png").absolute()),
                "diffOnlyPath": str((dst_dir / "diff_only.png").absolute()),
                "diffComparisonPath": str((dst_dir / "diff_comparison.png").absolute()),
                "artifactJson": str((dst_dir / "compare.json").absolute()),
                "leftSelector": data.get("inputs", {}).get("selector1", "#storybook-root"),
                "rightSelector": data.get("inputs", {}).get("selector2", "#storybook-root"),
                "styleChangeCount": len(style_diffs),
                "attributeChangeCount": len(attribute_diffs),
                "styleDiffs": style_diffs,
                "attributeDiffs": attribute_diffs,
                "bounds": {
                    "changed": bounds_delta(left_bounds, right_bounds) != {"x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0},
                    "delta": bounds_delta(left_bounds, right_bounds),
                    "left": left_bounds,
                    "right": right_bounds,
                    "normalizedWidth": pixel.get("normalized_width"),
                    "normalizedHeight": pixel.get("normalized_height"),
                },
            }
            row = {k: v for k, v in row.items() if v is not None}
            rows.append(row)

    counts: dict[str, int] = {}
    for row in rows:
        counts[row["classification"]] = counts.get(row["classification"], 0) + 1

    summary = {
        "classificationCounts": counts,
        "pageCount": 1,
        "sectionCount": len(rows),
        "maxChangedPercent": max((row["changedPercent"] for row in rows), default=0),
        "policy": {
            "ok": all(row["classification"] == "accepted" for row in rows),
            "worstClassification": "accepted" if all(row["classification"] == "accepted" for row in rows) else "review",
            "failureCount": sum(1 for row in rows if row["classification"] != "accepted"),
        },
        "rows": rows,
    }
    (REVIEW / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    (REVIEW / "01-review-site.md").write_text(
        "---\n"
        "Title: Package Storybook Visual Review Site Data\n"
        "Ticket: RAGEVAL-DESIGN-SYSTEM-UNIFY\n"
        "Status: active\n"
        "Topics: [design-system, frontend-architecture, react, packaging, storybook]\n"
        "DocType: reference\n"
        "Intent: short-term\n"
        "Owners: []\n"
        "RelatedFiles: []\n"
        "ExternalSources: []\n"
        "Summary: Serve-ready css-visual-diff review-site layout for package Storybook visual baselines.\n"
        "LastUpdated: 2026-06-07T00:00:00Z\n"
        "WhatFor: Open the package Storybook visual baseline in css-visual-diff's interactive review UI.\n"
        "WhenToUse: During design-system visual review and regression triage.\n"
        "---\n\n"
        "# Package Storybook Visual Review Site Data\n\n"
        "Generated from `package-story-sweep` by `scripts/05_prepare_package_storybook_review_site.py`.\n\n"
        "Serve with:\n\n"
        "```bash\n"
        f"css-visual-diff serve --data-dir {REVIEW} --port 8097\n"
        "```\n"
    )
    print(f"wrote {len(rows)} review rows to {REVIEW}")
    print(f"summary: {REVIEW / 'summary.json'}")


if __name__ == "__main__":
    main()
