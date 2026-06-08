#!/usr/bin/env bash
set -euo pipefail

TICKET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANALYSIS_DIR="$TICKET_DIR/sources/minitrace"
mkdir -p "$ANALYSIS_DIR"

# Candidate Pi session stores for this workspace. Convert both the outer
# workspace and nested git checkout because prior web/ work happened from both.
SOURCES=(
  "$HOME/.pi/agent/sessions/--home-manuel-workspaces-2026-05-27-rag-evaluation-system--"
  "$HOME/.pi/agent/sessions/--home-manuel-workspaces-2026-05-27-rag-evaluation-system-2026-05-27--rag-evaluation-system--"
)

for source_dir in "${SOURCES[@]}"; do
  if [[ ! -d "$source_dir" ]]; then
    echo "skip missing $source_dir" >&2
    continue
  fi
  name="$(basename "$source_dir" | sed 's/^--//; s/--$//')"
  out="$ANALYSIS_DIR/$name"
  mkdir -p "$out"
  go-minitrace convert pi --source-dir "$source_dir" --output-dir "$out"
done

find "$ANALYSIS_DIR" -name '*.minitrace.json' -print | sort > "$ANALYSIS_DIR/archive-files.txt"
wc -l "$ANALYSIS_DIR/archive-files.txt"
