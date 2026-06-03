#!/usr/bin/env python3
"""Export TTC WordPress/WooCommerce content from MySQL into a compact SQLite RAG database.

The script intentionally keeps the destination schema simple:

- documents: one row per product/post/guide/FAQ/page with cleaned text and metadata_json.
- document_terms: categories, tags, product attributes, and other taxonomies.
- product_details: product-specific commerce and tree-info fields.
- product_variants: variation rows linked back to parent product documents.
- document_meta: selected raw postmeta values for debugging/reconstruction.
- documents_fts: FTS5 index over title/kind/search_text.

All source extraction SQL lives next to this script with numerical prefixes.
"""

from __future__ import annotations

import argparse
import base64
import html
import json
import re
import sqlite3
import subprocess
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable

from bs4 import BeautifulSoup, Comment

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_SQLITE = Path.cwd() / "data" / "ttc-wordpress-rag.sqlite"

SQL_FILES = {
    "documents": SCRIPT_DIR / "02-export-documents.sql",
    "terms": SCRIPT_DIR / "03-export-document-terms.sql",
    "product_details": SCRIPT_DIR / "04-export-product-details.sql",
    "product_variants": SCRIPT_DIR / "05-export-product-variants.sql",
    "meta": SCRIPT_DIR / "06-export-selected-meta.sql",
}


def run_mysql_json(sql_path: Path, container: str, database: str, user: str, password: str) -> Iterable[dict[str, Any]]:
    cmd = [
        "docker",
        "exec",
        "-i",
        container,
        "mysql",
        f"-u{user}",
        f"-p{password}",
        "--default-character-set=utf8mb4",
        "--binary-mode=1",
        "-N",
        "-B",
        database,
    ]
    raw_sql = sql_path.read_text(encoding="utf-8").strip().rstrip(";")
    # MySQL batch output escapes tabs/newlines/backslashes in a way that can corrupt
    # JSON_OBJECT strings containing WordPress shortcodes. Wrap each query and base64
    # encode the JSON object inside MySQL so the CLI transport is line-safe.
    sql = f"SELECT REPLACE(TO_BASE64(row_json), '\\n', '') FROM ({raw_sql}) AS exported_rows;"
    proc = subprocess.run(cmd, input=sql, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0:
        raise RuntimeError(f"mysql failed for {sql_path.name}:\nSTDERR:\n{proc.stderr}\nSTDOUT:\n{proc.stdout[:2000]}")
    for line_no, line in enumerate(proc.stdout.splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        try:
            decoded = base64.b64decode(line).decode("utf-8")
            value = json.loads(decoded)
        except (ValueError, json.JSONDecodeError) as e:
            raise RuntimeError(f"invalid base64 JSON from {sql_path.name}:{line_no}: {e}: {line[:500]!r}") from e
        if isinstance(value, dict):
            yield value
        else:
            raise RuntimeError(f"expected object from {sql_path.name}:{line_no}, got {type(value).__name__}")


def preprocess_wordpress_html(value: Any) -> str:
    text = "" if value is None else str(value)
    if not text:
        return ""
    # Remove common layout-only WordPress/Visual Composer shortcodes. Keep their
    # inner text when they have closing tags; drop one-shot layout widgets.
    text = re.sub(r"\[(/?)(vc_[^\]]+|rev_slider[^\]]*|caption[^\]]*|gallery[^\]]*)\]", " ", text, flags=re.I)
    return text


def clean_text_from_html(value: Any) -> str:
    text = preprocess_wordpress_html(value)
    if not text:
        return ""
    soup = BeautifulSoup(text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    for comment in soup.find_all(string=lambda value: isinstance(value, Comment)):
        comment.extract()
    out = soup.get_text("\n")
    out = re.sub(r"\r\n?", "\n", out)
    out = re.sub(r"[ \t]+", " ", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return html.unescape(out).strip()


def normalize_markdown(md: str) -> str:
    md = re.sub(r"\r\n?", "\n", md)
    md = re.sub(r"[ \t]+\n", "\n", md)
    md = re.sub(r"\n{3,}", "\n\n", md)
    return html.unescape(md).strip()


def inline_markdown(node: Any) -> str:
    if isinstance(node, str):
        return html.unescape(node)
    name = getattr(node, "name", None)
    if name is None:
        return html.unescape(str(node))
    if name in {"script", "style", "noscript"}:
        return ""
    if name == "br":
        return "\n"
    text = "".join(inline_markdown(child) for child in node.children)
    text = re.sub(r"[ \t\n]+", " ", text).strip()
    if name in {"strong", "b"} and text:
        return f"**{text}**"
    if name in {"em", "i"} and text:
        return f"*{text}*"
    if name == "code" and text:
        return f"`{text}`"
    if name == "a" and text:
        href = (node.get("href") or "").strip()
        if href:
            return f"[{text}]({href})"
    if name == "img":
        alt = (node.get("alt") or "").strip()
        src = (node.get("src") or "").strip()
        if src:
            return f"![{alt}]({src})"
        return alt
    return text


def block_markdown(node: Any, list_depth: int = 0) -> str:
    if isinstance(node, str):
        return inline_markdown(node).strip()
    name = getattr(node, "name", None)
    if name is None:
        return inline_markdown(node).strip()
    if name in {"script", "style", "noscript"}:
        return ""
    if name in {"h1", "h2", "h3", "h4", "h5", "h6"}:
        level = int(name[1])
        text = inline_markdown(node)
        return f"{'#' * level} {text}" if text else ""
    if name == "p":
        return inline_markdown(node)
    if name == "blockquote":
        inner = "\n".join(block_markdown(child, list_depth) for child in node.children)
        inner = normalize_markdown(inner)
        return "\n".join(f"> {line}" if line else ">" for line in inner.splitlines())
    if name in {"ul", "ol"}:
        lines = []
        ordered = name == "ol"
        idx = 1
        for child in node.children:
            if getattr(child, "name", None) != "li":
                continue
            item = normalize_markdown("\n".join(block_markdown(grand, list_depth + 1) for grand in child.children))
            bullet = f"{idx}." if ordered else "-"
            indent = "  " * list_depth
            if item:
                item_lines = item.splitlines()
                lines.append(f"{indent}{bullet} {item_lines[0]}")
                lines.extend(f"{indent}  {line}" for line in item_lines[1:])
            idx += 1
        return "\n".join(lines)
    if name == "pre":
        text = node.get_text("\n")
        return f"```\n{text.strip()}\n```" if text.strip() else ""
    if name == "hr":
        return "---"
    if name == "table":
        rows = []
        for tr in node.find_all("tr"):
            cells = [inline_markdown(cell) for cell in tr.find_all(["th", "td"])]
            if cells:
                rows.append(" | ".join(cells))
        return "\n".join(rows)
    if name in {"div", "section", "article", "main", "header", "footer", "body"}:
        return "\n\n".join(filter(None, (block_markdown(child, list_depth) for child in node.children)))
    return inline_markdown(node)


def markdown_from_html(value: Any) -> str:
    text = preprocess_wordpress_html(value)
    if not text:
        return ""
    soup = BeautifulSoup(text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    for comment in soup.find_all(string=lambda value: isinstance(value, Comment)):
        comment.extract()
    blocks = []
    root_children = soup.body.children if soup.body else soup.children
    for child in root_children:
        block = block_markdown(child)
        if block:
            blocks.append(block)
    return normalize_markdown("\n\n".join(blocks))


def doc_id(wp_id: Any) -> str:
    return f"wp:{int(wp_id)}"


def maybe_json(value: Any) -> Any:
    if isinstance(value, str) and value and value[0] in "[{":
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return value


def compact_json(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def to_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def to_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def create_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        DROP VIEW IF EXISTS view_products;
        DROP VIEW IF EXISTS view_documents;
        DROP TABLE IF EXISTS documents_fts;
        DROP TABLE IF EXISTS document_meta;
        DROP TABLE IF EXISTS product_variants;
        DROP TABLE IF EXISTS product_details;
        DROP TABLE IF EXISTS document_terms;
        DROP TABLE IF EXISTS documents;

        CREATE TABLE documents (
            doc_id TEXT PRIMARY KEY,
            wp_id INTEGER NOT NULL UNIQUE,
            kind TEXT NOT NULL,
            status TEXT NOT NULL,
            title TEXT NOT NULL,
            slug TEXT,
            url TEXT,
            parent_doc_id TEXT REFERENCES documents(doc_id),
            content_text TEXT NOT NULL DEFAULT '',
            excerpt_text TEXT NOT NULL DEFAULT '',
            content_markdown TEXT NOT NULL DEFAULT '',
            excerpt_markdown TEXT NOT NULL DEFAULT '',
            search_text TEXT NOT NULL DEFAULT '',
            search_markdown TEXT NOT NULL DEFAULT '',
            metadata_json TEXT NOT NULL DEFAULT '{}',
            post_date TEXT,
            post_modified TEXT
        );

        CREATE TABLE document_terms (
            doc_id TEXT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
            taxonomy TEXT NOT NULL,
            term_id INTEGER,
            term_slug TEXT,
            term_name TEXT NOT NULL,
            term_description TEXT,
            parent_term_id INTEGER,
            is_category INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (doc_id, taxonomy, term_name)
        );

        CREATE TABLE product_details (
            doc_id TEXT PRIMARY KEY REFERENCES documents(doc_id) ON DELETE CASCADE,
            sku TEXT,
            product_type TEXT,
            manage_stock TEXT,
            stock INTEGER,
            stock_status TEXT,
            backorders TEXT,
            price REAL,
            regular_price REAL,
            sale_price REAL,
            cogs REAL,
            total_stock_qty INTEGER,
            min_variation_price REAL,
            max_variation_price REAL,
            botanical_name TEXT,
            mature_height TEXT,
            mature_width TEXT,
            hardiness_zone TEXT,
            sunlight TEXT,
            soil_conditions TEXT,
            drought_tolerance TEXT,
            brand_text TEXT,
            does_not_ship_to TEXT,
            treeinfo_qa TEXT,
            product_attributes_raw TEXT,
            default_attributes_raw TEXT,
            metadata_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE TABLE product_variants (
            variant_wp_id INTEGER PRIMARY KEY,
            parent_doc_id TEXT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
            title TEXT,
            slug TEXT,
            status TEXT,
            sku TEXT,
            size TEXT,
            manage_stock TEXT,
            stock INTEGER,
            stock_status TEXT,
            backorders TEXT,
            price REAL,
            regular_price REAL,
            sale_price REAL,
            cogs REAL,
            attributes_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE TABLE document_meta (
            doc_id TEXT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
            meta_key TEXT NOT NULL,
            meta_value TEXT,
            PRIMARY KEY (doc_id, meta_key, meta_value)
        );

        CREATE VIRTUAL TABLE documents_fts USING fts5(
            doc_id UNINDEXED,
            kind,
            title,
            search_text,
            tokenize = 'unicode61 remove_diacritics 2'
        );

        CREATE INDEX idx_documents_kind ON documents(kind);
        CREATE INDEX idx_terms_taxonomy ON document_terms(taxonomy, term_name);
        CREATE INDEX idx_terms_doc ON document_terms(doc_id);
        CREATE INDEX idx_product_details_sku ON product_details(sku);
        CREATE INDEX idx_variants_parent ON product_variants(parent_doc_id);
        CREATE INDEX idx_variants_sku ON product_variants(sku);

        CREATE VIEW view_products AS
        SELECT
            d.doc_id,
            d.wp_id,
            d.title,
            d.slug,
            d.url,
            pd.sku,
            pd.product_type,
            pd.stock_status,
            pd.price,
            pd.regular_price,
            pd.sale_price,
            pd.botanical_name,
            pd.hardiness_zone,
            pd.sunlight,
            pd.soil_conditions,
            pd.drought_tolerance,
            pd.mature_height,
            pd.mature_width,
            COALESCE(categories.category_names, '') AS categories,
            COALESCE(attributes.attribute_names, '') AS attributes,
            d.content_text,
            d.excerpt_text,
            d.content_markdown,
            d.excerpt_markdown,
            d.search_text,
            d.search_markdown
        FROM documents d
        JOIN product_details pd ON pd.doc_id = d.doc_id
        LEFT JOIN (
            SELECT doc_id, group_concat(term_name, ', ') AS category_names
            FROM document_terms
            WHERE taxonomy = 'product_cat'
            GROUP BY doc_id
        ) categories ON categories.doc_id = d.doc_id
        LEFT JOIN (
            SELECT doc_id, group_concat(taxonomy || ': ' || term_name, '; ') AS attribute_names
            FROM document_terms
            WHERE taxonomy LIKE 'pa_%' OR taxonomy = 'product_tag'
            GROUP BY doc_id
        ) attributes ON attributes.doc_id = d.doc_id
        WHERE d.kind = 'product';

        CREATE VIEW view_documents AS
        SELECT
            d.doc_id,
            d.wp_id,
            d.kind,
            d.title,
            d.slug,
            d.url,
            d.post_date,
            d.post_modified,
            COALESCE(categories.category_names, '') AS categories,
            COALESCE(tags.tag_names, '') AS tags,
            d.content_text,
            d.excerpt_text,
            d.content_markdown,
            d.excerpt_markdown,
            d.search_text,
            d.search_markdown
        FROM documents d
        LEFT JOIN (
            SELECT doc_id, group_concat(term_name, ', ') AS category_names
            FROM document_terms
            WHERE is_category = 1
            GROUP BY doc_id
        ) categories ON categories.doc_id = d.doc_id
        LEFT JOIN (
            SELECT doc_id, group_concat(term_name, ', ') AS tag_names
            FROM document_terms
            WHERE taxonomy IN ('post_tag', 'product_tag')
            GROUP BY doc_id
        ) tags ON tags.doc_id = d.doc_id
        WHERE d.kind <> 'product';
        """
    )


def load_documents(conn: sqlite3.Connection, rows: Iterable[dict[str, Any]]) -> dict[int, dict[str, Any]]:
    docs: dict[int, dict[str, Any]] = {}
    for row in rows:
        wp_id = int(row["wp_id"])
        kind = str(row.get("post_type") or "")
        content_text = clean_text_from_html(row.get("content_html"))
        excerpt_text = clean_text_from_html(row.get("excerpt_html"))
        content_markdown = markdown_from_html(row.get("content_html"))
        excerpt_markdown = markdown_from_html(row.get("excerpt_html"))
        parent_wp_id = row.get("parent_wp_id")
        metadata = {
            "seoTitle": row.get("seo_title"),
            "seoDescription": row.get("seo_description"),
            "thumbnailId": row.get("thumbnail_id"),
            "menuOrder": row.get("menu_order"),
            "commentCount": row.get("comment_count"),
        }
        title = html.unescape(str(row.get("title") or "")).strip()
        base_search = "\n\n".join(x for x in [title, excerpt_text, content_text, row.get("seo_title"), row.get("seo_description")] if x)
        base_search_markdown = "\n\n".join(x for x in [f"# {title}" if title else "", excerpt_markdown, content_markdown, row.get("seo_title"), row.get("seo_description")] if x)
        conn.execute(
            """
            INSERT INTO documents (
                doc_id, wp_id, kind, status, title, slug, url, parent_doc_id,
                content_text, excerpt_text, content_markdown, excerpt_markdown, search_text, search_markdown,
                metadata_json, post_date, post_modified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                doc_id(wp_id),
                wp_id,
                kind,
                str(row.get("post_status") or ""),
                title,
                row.get("slug"),
                row.get("url"),
                None,
                content_text,
                excerpt_text,
                content_markdown,
                excerpt_markdown,
                base_search,
                base_search_markdown,
                compact_json(metadata),
                row.get("post_date"),
                row.get("post_modified"),
            ),
        )
        docs[wp_id] = row
    return docs


def load_terms(conn: sqlite3.Connection, rows: Iterable[dict[str, Any]]) -> dict[str, list[str]]:
    by_doc: dict[str, list[str]] = defaultdict(list)
    for row in rows:
        did = doc_id(row["wp_id"])
        term_name = html.unescape(str(row.get("term_name") or "")).strip()
        taxonomy = str(row.get("taxonomy") or "").strip()
        if not term_name or not taxonomy:
            continue
        conn.execute(
            """
            INSERT OR IGNORE INTO document_terms (
                doc_id, taxonomy, term_id, term_slug, term_name, term_description, parent_term_id, is_category
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                did,
                taxonomy,
                to_int(row.get("term_id")),
                row.get("term_slug"),
                term_name,
                row.get("term_description"),
                to_int(row.get("parent_term_id")),
                1 if row.get("is_category") else 0,
            ),
        )
        by_doc[did].append(f"{taxonomy}: {term_name}")
    return by_doc


def load_product_details(conn: sqlite3.Connection, rows: Iterable[dict[str, Any]]) -> dict[str, list[str]]:
    by_doc: dict[str, list[str]] = defaultdict(list)
    fields_for_text = [
        "sku",
        "product_type",
        "botanical_name",
        "mature_height",
        "mature_width",
        "hardiness_zone",
        "sunlight",
        "soil_conditions",
        "drought_tolerance",
        "brand_text",
        "does_not_ship_to",
        "treeinfo_qa",
    ]
    for row in rows:
        did = doc_id(row["wp_id"])
        conn.execute(
            """
            INSERT OR REPLACE INTO product_details (
                doc_id, sku, product_type, manage_stock, stock, stock_status, backorders,
                price, regular_price, sale_price, cogs, total_stock_qty, min_variation_price, max_variation_price,
                botanical_name, mature_height, mature_width, hardiness_zone, sunlight, soil_conditions,
                drought_tolerance, brand_text, does_not_ship_to, treeinfo_qa, product_attributes_raw,
                default_attributes_raw, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                did,
                row.get("sku"),
                row.get("product_type"),
                row.get("manage_stock"),
                to_int(row.get("stock")),
                row.get("stock_status"),
                row.get("backorders"),
                to_float(row.get("price")),
                to_float(row.get("regular_price")),
                to_float(row.get("sale_price")),
                to_float(row.get("cogs")),
                to_int(row.get("total_stock_qty")),
                to_float(row.get("min_variation_price")),
                to_float(row.get("max_variation_price")),
                row.get("botanical_name"),
                row.get("mature_height"),
                row.get("mature_width"),
                row.get("hardiness_zone"),
                row.get("sunlight"),
                row.get("soil_conditions"),
                row.get("drought_tolerance"),
                row.get("brand_text"),
                row.get("does_not_ship_to"),
                clean_text_from_html(row.get("treeinfo_qa")),
                row.get("product_attributes_raw"),
                row.get("default_attributes_raw"),
                compact_json({"source": "wp_postmeta"}),
            ),
        )
        for key in fields_for_text:
            value = row.get(key)
            if value not in (None, ""):
                by_doc[did].append(f"{key.replace('_', ' ')}: {clean_text_from_html(value)}")
    return by_doc


def load_variants(conn: sqlite3.Connection, rows: Iterable[dict[str, Any]]) -> dict[str, list[str]]:
    by_parent: dict[str, list[str]] = defaultdict(list)
    for row in rows:
        parent = doc_id(row["parent_wp_id"])
        attrs = maybe_json(row.get("attributes_json")) or {}
        conn.execute(
            """
            INSERT OR REPLACE INTO product_variants (
                variant_wp_id, parent_doc_id, title, slug, status, sku, size, manage_stock,
                stock, stock_status, backorders, price, regular_price, sale_price, cogs, attributes_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                int(row["variant_wp_id"]),
                parent,
                html.unescape(str(row.get("variant_title") or "")),
                row.get("variant_slug"),
                row.get("post_status"),
                row.get("sku"),
                row.get("size"),
                row.get("manage_stock"),
                to_int(row.get("stock")),
                row.get("stock_status"),
                row.get("backorders"),
                to_float(row.get("price")),
                to_float(row.get("regular_price")),
                to_float(row.get("sale_price")),
                to_float(row.get("cogs")),
                compact_json(attrs),
            ),
        )
        parts = ["variant"]
        for key in ["sku", "size", "price", "stock", "stock_status"]:
            if row.get(key) not in (None, ""):
                parts.append(f"{key}: {row.get(key)}")
        by_parent[parent].append("; ".join(parts))
    return by_parent


def load_meta(conn: sqlite3.Connection, rows: Iterable[dict[str, Any]]) -> None:
    for row in rows:
        value = row.get("meta_value")
        if value is not None:
            value = str(value)
        conn.execute(
            "INSERT OR IGNORE INTO document_meta (doc_id, meta_key, meta_value) VALUES (?, ?, ?)",
            (doc_id(row["wp_id"]), row.get("meta_key"), value),
        )


def append_search_text(conn: sqlite3.Connection, additions: dict[str, list[str]]) -> None:
    for did, parts in additions.items():
        if not parts:
            continue
        extra = "\n".join(str(p) for p in parts if p)
        conn.execute(
            """
            UPDATE documents
            SET search_text = trim(search_text || char(10) || char(10) || ?),
                search_markdown = trim(search_markdown || char(10) || char(10) || ?)
            WHERE doc_id = ?
            """,
            (extra, extra, did),
        )


def rebuild_fts(conn: sqlite3.Connection) -> None:
    conn.execute("DELETE FROM documents_fts")
    conn.execute(
        """
        INSERT INTO documents_fts (doc_id, kind, title, search_text)
        SELECT doc_id, kind, title, search_text FROM documents
        """
    )


def print_summary(conn: sqlite3.Connection) -> None:
    print("SQLite export summary")
    for table in ["documents", "document_terms", "product_details", "product_variants", "document_meta"]:
        count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"  {table}: {count}")
    print("  documents by kind:")
    for kind, count in conn.execute("SELECT kind, COUNT(*) FROM documents GROUP BY kind ORDER BY COUNT(*) DESC"):
        print(f"    {kind}: {count}")
    print("  sample FTS query for 'thuja privacy':")
    for row in conn.execute(
        """
        SELECT d.doc_id, d.kind, d.title
        FROM documents_fts f
        JOIN documents d ON d.doc_id = f.doc_id
        WHERE documents_fts MATCH ?
        LIMIT 5
        """,
        ("thuja privacy",),
    ):
        print(f"    {row[0]} | {row[1]} | {row[2]}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--container", default="rageval-ttc-mysql", help="MySQL docker container name")
    parser.add_argument("--database", default="ttc", help="MySQL database name")
    parser.add_argument("--mysql-user", default="ttc", help="MySQL user")
    parser.add_argument("--mysql-password", default="ttc", help="MySQL password")
    parser.add_argument("--sqlite", type=Path, default=DEFAULT_SQLITE, help="Output SQLite database")
    args = parser.parse_args()

    out = args.sqlite.resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()

    print(f"exporting TTC WordPress data to {out}")
    conn = sqlite3.connect(out)
    try:
        create_schema(conn)
        with conn:
            print("loading documents...")
            load_documents(conn, run_mysql_json(SQL_FILES["documents"], args.container, args.database, args.mysql_user, args.mysql_password))
            print("loading terms/categories/attributes...")
            term_text = load_terms(conn, run_mysql_json(SQL_FILES["terms"], args.container, args.database, args.mysql_user, args.mysql_password))
            append_search_text(conn, term_text)
            print("loading product details...")
            detail_text = load_product_details(conn, run_mysql_json(SQL_FILES["product_details"], args.container, args.database, args.mysql_user, args.mysql_password))
            append_search_text(conn, detail_text)
            print("loading product variants...")
            variant_text = load_variants(conn, run_mysql_json(SQL_FILES["product_variants"], args.container, args.database, args.mysql_user, args.mysql_password))
            append_search_text(conn, variant_text)
            print("loading selected raw meta...")
            load_meta(conn, run_mysql_json(SQL_FILES["meta"], args.container, args.database, args.mysql_user, args.mysql_password))
            print("building FTS index...")
            rebuild_fts(conn)
        print_summary(conn)
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
