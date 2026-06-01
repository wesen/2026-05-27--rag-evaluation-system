#!/usr/bin/env python3
"""Validate the hand-authored RAG DMETA IR seed catalog.

Checks intentionally stay lightweight until a shared DMETA loader is available:
- every YAML file parses;
- explicit manifest file references exist;
- major catalog objects include human-readable summary/description/why fields;
- IDs are globally unique across the catalog;
- capability/representation/action/template references resolve.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:  # pragma: no cover - operator-facing error
    print("ERROR: PyYAML is required: python3 -m pip install pyyaml", file=sys.stderr)
    sys.exit(2)

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "dmeta-ir"
REQUIRED_TEXT = ("summary", "description", "why")
MAJOR_LIST_KEYS = {
    "archetypes",
    "capabilities",
    "representations",
    "actions",
    "elaboration_rules",
    "lowering_rules",
    "templates",
    "token_families",
    "recipes",
}
REFERENCE_KEYS = {
    "capabilities": "capability",
    "representations": "representation",
    "actions": "action",
}

errors: list[str] = []
parsed: dict[Path, Any] = {}
ids: dict[str, Path] = {}
known: dict[str, set[str]] = {
    "capability": set(),
    "representation": set(),
    "action": set(),
    "template": set(),
}


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def load_yaml() -> None:
    if not CATALOG.exists():
        errors.append("dmeta-ir directory is missing")
        return
    for path in sorted(CATALOG.rglob("*.yaml")):
        try:
            parsed[path] = yaml.safe_load(path.read_text())
        except Exception as exc:  # noqa: BLE001 - validation should report all parse failures
            errors.append(f"{rel(path)}: YAML parse failed: {exc}")


def require_text_fields(path: Path, obj: dict[str, Any], label: str) -> None:
    for key in REQUIRED_TEXT:
        value = obj.get(key)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{rel(path)}: {label} missing non-empty `{key}`")


def walk_major_objects(path: Path, node: Any) -> None:
    if isinstance(node, dict):
        if path.suffix == ".yaml" and node is parsed.get(path):
            require_text_fields(path, node, "document")
        for key, value in node.items():
            if key in MAJOR_LIST_KEYS and isinstance(value, list):
                # The same words (for example `representations` and `actions`) also
                # appear in consumes/outputs blocks as string references. Treat only
                # list items with an `id` as major catalog objects.
                for index, item in enumerate(value):
                    if not (isinstance(item, dict) and isinstance(item.get("id"), str)):
                        continue
                    item_id = item["id"]
                    label = f"{key}[{item_id or index}]"
                    require_text_fields(path, item, label)
                    if item_id in ids:
                        errors.append(
                            f"duplicate id `{item_id}` in {rel(path)} and {rel(ids[item_id])}"
                        )
                    ids[item_id] = path
                    singular = {
                        "capabilities": "capability",
                        "representations": "representation",
                        "actions": "action",
                        "templates": "template",
                    }.get(key)
                    if singular:
                        known[singular].add(item_id)
            elif key == "instance" and isinstance(value, dict):
                require_text_fields(path, value, "instance")
                item_id = value.get("id")
                if isinstance(item_id, str):
                    if item_id in ids:
                        errors.append(f"duplicate id `{item_id}` in {rel(path)} and {rel(ids[item_id])}")
                    ids[item_id] = path
            walk_major_objects(path, value)
    elif isinstance(node, list):
        for item in node:
            walk_major_objects(path, item)


def validate_manifests() -> None:
    for path, doc in parsed.items():
        if path.name != "00-index.yaml" or not isinstance(doc, dict):
            continue
        files = doc.get("files", {})
        if not isinstance(files, dict):
            errors.append(f"{rel(path)}: `files` should be a mapping")
            continue
        for value in files.values():
            refs = value if isinstance(value, list) else [value]
            for ref in refs:
                if not isinstance(ref, str):
                    errors.append(f"{rel(path)}: manifest reference should be a string: {ref!r}")
                    continue
                target = path.parent / ref
                if not target.exists():
                    errors.append(f"{rel(path)}: manifest target missing: {ref}")


def check_ref(path: Path, ref_id: str, ref_type: str, context: str) -> None:
    if ref_id not in known[ref_type]:
        errors.append(f"{rel(path)}: unknown {ref_type} `{ref_id}` in {context}")


def validate_references(path: Path, node: Any, context: str = "document") -> None:
    if path.name == "00-index.yaml":
        return
    if isinstance(node, dict):
        for key, value in node.items():
            if key in REFERENCE_KEYS and isinstance(value, list):
                for ref_id in value:
                    if isinstance(ref_id, str):
                        check_ref(path, ref_id, REFERENCE_KEYS[key], context)
            if key in {"template", "selected_templates"}:
                refs = value if isinstance(value, list) else [value]
                for ref_id in refs:
                    if isinstance(ref_id, str) and ref_id.startswith("rag."):
                        check_ref(path, ref_id, "template", context)
            if key == "uses" and isinstance(value, list):
                for item in value:
                    if isinstance(item, dict) and isinstance(item.get("template"), str):
                        check_ref(path, item["template"], "template", context)
            next_context = context
            if key == "id" and isinstance(value, str):
                next_context = value
            validate_references(path, value, next_context)
    elif isinstance(node, list):
        for item in node:
            validate_references(path, item, context)


def main() -> int:
    load_yaml()
    for path, doc in parsed.items():
        walk_major_objects(path, doc)
    validate_manifests()
    for path, doc in parsed.items():
        validate_references(path, doc)

    if errors:
        print("DMETA IR validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"DMETA IR validation passed ({len(parsed)} YAML files, {len(ids)} IDs)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
