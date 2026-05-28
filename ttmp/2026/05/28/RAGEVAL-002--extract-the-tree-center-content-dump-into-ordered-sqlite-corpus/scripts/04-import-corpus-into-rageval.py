#!/usr/bin/env python3
"""Import the normalized TTC corpus SQLite into the rag-eval app database.

This bridges `data/corpus/ttc-dump/ttc-corpus.sqlite` into the app's canonical
`sources` and `documents` tables. It is rerun-safe: sources and documents are
upserted by stable IDs derived from corpus item IDs.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

DEFAULT_CORPUS = Path("data/corpus/ttc-dump/ttc-corpus.sqlite")
DEFAULT_APP_DB = Path("data/rag-eval.db")
SOURCE_PREFIX = "ttc-dump"

SOURCE_CONFIG = {
    "source": "ttc_dev_dump.sql.bz2",
    "origin": "/home/manuel/code/ttc/ttc/ttc_dev_dump.sql.bz2",
    "normalized_corpus": str(DEFAULT_CORPUS),
    "imported_with": "RAGEVAL-002 scripts/04-import-corpus-into-rageval.py",
}


def connect_app(path: Path) -> sqlite3.Connection:
    if not path.exists():
        raise FileNotFoundError(f"rag-eval app DB not found: {path}; run ./rag-eval once or use --app-db")
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def ensure_sources(app: sqlite3.Connection, kinds: Iterable[str]) -> None:
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    for kind in sorted(set(kinds)):
        source_id = f"{SOURCE_PREFIX}-{kind}s"
        config = dict(SOURCE_CONFIG)
        config["kind"] = kind
        app.execute(
            """
            INSERT INTO sources (id, name, type, config_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name,
              type=excluded.type,
              config_json=excluded.config_json,
              updated_at=excluded.updated_at
            """,
            (
                source_id,
                f"TTC dump {kind}s",
                "sqlite-corpus",
                json.dumps(config, ensure_ascii=False, sort_keys=True),
                now,
                now,
            ),
        )


def metadata_for(row: sqlite3.Row) -> str:
    metadata = json.loads(row["metadata_json"] or "{}")
    metadata.update(
        {
            "corpus_item_id": row["id"],
            "wp_id": row["wp_id"],
            "kind": row["kind"],
            "post_type": row["post_type"],
            "slug": row["slug"],
            "url_path": row["url_path"],
            "published_at": row["published_at"],
            "modified_at": row["modified_at"],
        }
    )
    return json.dumps(metadata, ensure_ascii=False, sort_keys=True)


def import_items(corpus: sqlite3.Connection, app: sqlite3.Connection, kinds: set[str], limit: int) -> dict[str, int]:
    where = "WHERE kind IN (%s)" % ",".join("?" for _ in kinds)
    params: list[object] = sorted(kinds)
    query = f"""
        SELECT id, wp_id, kind, post_type, status, slug, title, url_path,
               published_at, modified_at, excerpt, content_html, content_text,
               word_count, parent_wp_id, metadata_json
        FROM content_items
        {where}
        ORDER BY kind, published_at, wp_id
    """
    if limit > 0:
        query += " LIMIT ?"
        params.append(limit)

    counts: dict[str, int] = {kind: 0 for kind in kinds}
    for row in corpus.execute(query, params):
        kind = row["kind"]
        doc_id = row["id"]
        source_id = f"{SOURCE_PREFIX}-{kind}s"
        url = f"https://www.thetreecenter.com{row['url_path']}"
        app.execute(
            """
            INSERT INTO documents (
              id, source_id, external_id, title, author, url, content_type,
              raw_content, content_text, content_html, word_count, language,
              metadata_json, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), COALESCE(?, datetime('now')))
            ON CONFLICT(id) DO UPDATE SET
              source_id=excluded.source_id,
              external_id=excluded.external_id,
              title=excluded.title,
              author=excluded.author,
              url=excluded.url,
              content_type=excluded.content_type,
              raw_content=excluded.raw_content,
              content_text=excluded.content_text,
              content_html=excluded.content_html,
              word_count=excluded.word_count,
              language=excluded.language,
              metadata_json=excluded.metadata_json,
              status=excluded.status,
              updated_at=datetime('now')
            """,
            (
                doc_id,
                source_id,
                row["id"],
                row["title"] or row["slug"],
                "",
                url,
                "text/html",
                row["content_html"] or "",
                row["content_text"] or "",
                row["content_html"] or "",
                int(row["word_count"] or 0),
                "en",
                metadata_for(row),
                "extracted",
                row["published_at"],
                row["modified_at"],
            ),
        )
        counts[kind] = counts.get(kind, 0) + 1
    return counts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    parser.add_argument("--app-db", type=Path, default=DEFAULT_APP_DB)
    parser.add_argument("--kinds", default="article,guide,product", help="Comma-separated kinds to import")
    parser.add_argument("--limit", type=int, default=0, help="Total item import limit after kind filtering; 0 means all")
    args = parser.parse_args()

    kinds = {k.strip() for k in args.kinds.split(",") if k.strip()}
    if not kinds:
        raise SystemExit("no kinds selected")
    if not args.corpus.exists():
        raise FileNotFoundError(f"corpus DB not found: {args.corpus}")

    corpus = sqlite3.connect(args.corpus)
    corpus.row_factory = sqlite3.Row
    app = connect_app(args.app_db)
    try:
        with app:
            ensure_sources(app, kinds)
            counts = import_items(corpus, app, kinds, args.limit)
    finally:
        corpus.close()
        app.close()

    print(json.dumps({"app_db": str(args.app_db), "corpus": str(args.corpus), "imported": counts}, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
