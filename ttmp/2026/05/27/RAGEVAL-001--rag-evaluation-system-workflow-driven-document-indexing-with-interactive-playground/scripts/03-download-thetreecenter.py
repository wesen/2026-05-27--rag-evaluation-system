#!/usr/bin/env python3
"""Download The Tree Center guide/blog pages as Defuddle-cleaned Markdown.

The script reads the public WordPress sitemaps advertised by robots.txt and
extracts readable Markdown with the local `defuddle` CLI. It is intentionally
rate-limited and resumable so it can seed a test RAG corpus without hammering
the site.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

SITEMAPS = {
    "posts": "https://www.thetreecenter.com/wp-sitemap-posts-post-1.xml",
    "guides": "https://www.thetreecenter.com/wp-sitemap-posts-ttc_guide-1.xml",
}
XML_NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


@dataclass(frozen=True)
class Page:
    kind: str
    url: str


def fetch_sitemap(url: str) -> list[str]:
    with urllib.request.urlopen(url, timeout=30) as response:
        data = response.read()
    root = ET.fromstring(data)
    return [loc.text.strip() for loc in root.findall(".//s:loc", XML_NS) if loc.text]


def discover_pages(kinds: Iterable[str]) -> list[Page]:
    pages: list[Page] = []
    for kind in kinds:
        for url in fetch_sitemap(SITEMAPS[kind]):
            pages.append(Page(kind=kind, url=url))
    return pages


def slug_from_url(url: str) -> str:
    slug = url.rstrip("/").split("/")[-1]
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", slug).strip("-").lower()
    return slug or "index"


def run_defuddle(url: str, *, title: bool = False) -> str:
    cmd = ["defuddle", "parse", url]
    if title:
        cmd += ["-p", "title"]
    else:
        cmd += ["--md"]
    result = subprocess.run(cmd, check=True, text=True, capture_output=True)
    return result.stdout.strip()


def yaml_quote(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def write_page(page: Page, out_dir: Path, force: bool) -> tuple[Path, str]:
    kind_dir = out_dir / page.kind
    kind_dir.mkdir(parents=True, exist_ok=True)
    path = kind_dir / f"{slug_from_url(page.url)}.md"
    if path.exists() and not force:
        return path, "skipped"

    markdown = run_defuddle(page.url)
    try:
        title = run_defuddle(page.url, title=True) or slug_from_url(page.url).replace("-", " ").title()
    except subprocess.CalledProcessError:
        title = slug_from_url(page.url).replace("-", " ").title()

    frontmatter = "\n".join(
        [
            "---",
            f"title: {yaml_quote(title)}",
            f"source_url: {yaml_quote(page.url)}",
            f"source_site: {yaml_quote('thetreecenter.com')}",
            f"source_type: {yaml_quote(page.kind)}",
            "retrieved_with: defuddle",
            "---",
            "",
        ]
    )
    path.write_text(frontmatter + markdown + "\n", encoding="utf-8")
    return path, "downloaded"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out-dir", default="data/corpus/thetreecenter", help="Output directory for Markdown corpus")
    parser.add_argument("--types", default="guides", help="Comma-separated subset: guides,posts,all")
    parser.add_argument("--max", type=int, default=0, help="Maximum pages to process after discovery; 0 means all selected pages")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between downloaded pages in seconds")
    parser.add_argument("--force", action="store_true", help="Overwrite existing Markdown files")
    parser.add_argument("--dry-run", action="store_true", help="Print discovered URLs without downloading")
    args = parser.parse_args()

    selected = [part.strip() for part in args.types.split(",") if part.strip()]
    if "all" in selected:
        selected = ["guides", "posts"]
    invalid = sorted(set(selected) - set(SITEMAPS))
    if invalid:
        parser.error(f"unknown type(s): {', '.join(invalid)}")

    pages = discover_pages(selected)
    if args.max > 0:
        pages = pages[: args.max]

    out_dir = Path(args.out_dir)
    manifest_path = out_dir / "manifest.jsonl"

    print(f"discovered {len(pages)} pages for types={','.join(selected)}", file=sys.stderr)
    if args.dry_run:
        for page in pages:
            print(f"{page.kind}\t{page.url}")
        return 0

    out_dir.mkdir(parents=True, exist_ok=True)
    with manifest_path.open("a", encoding="utf-8") as manifest:
        for idx, page in enumerate(pages, start=1):
            try:
                path, status = write_page(page, out_dir, args.force)
                record = {"status": status, "kind": page.kind, "url": page.url, "path": str(path)}
                print(json.dumps(record, ensure_ascii=False))
                print(json.dumps(record, ensure_ascii=False), file=manifest)
                manifest.flush()
            except subprocess.CalledProcessError as exc:
                record = {
                    "status": "error",
                    "kind": page.kind,
                    "url": page.url,
                    "returncode": exc.returncode,
                    "stderr": exc.stderr[-1000:] if exc.stderr else "",
                }
                print(json.dumps(record, ensure_ascii=False), file=sys.stderr)
                print(json.dumps(record, ensure_ascii=False), file=manifest)
                manifest.flush()
            if idx < len(pages) and args.delay > 0:
                time.sleep(args.delay)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
