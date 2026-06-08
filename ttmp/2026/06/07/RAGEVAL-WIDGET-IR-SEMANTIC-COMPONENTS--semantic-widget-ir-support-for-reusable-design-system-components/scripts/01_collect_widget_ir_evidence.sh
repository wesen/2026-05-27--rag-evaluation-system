#!/usr/bin/env bash
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
TICKET="$ROOT/ttmp/2026/06/07/RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS--semantic-widget-ir-support-for-reusable-design-system-components"
OUT="$TICKET/sources/01-widget-ir-evidence.txt"
{
  echo "# Widget IR evidence collected $(date -Is)"
  echo
  echo "## Current git head"
  git rev-parse --short HEAD
  echo
  echo "## Widget renderer and DSL files"
  rg --files pkg packages/rag-evaluation-site/src examples/xgoja/widget-site 2>/dev/null | rg '(widgetdsl|WidgetRenderer|widgets/ir|\.stories\.tsx$|components/.*/index\.ts$|components/.*/.*\.tsx$|verbs/sites\.js$)' | sort
  echo
  echo "## Renderer component switch cases"
  rg -n "case '.*'|const componentType|renderComponent|type WidgetNode|interface .*Node|function WidgetRenderer|export function WidgetRenderer|ComponentNode" packages/rag-evaluation-site/src pkg/widgetdsl examples/xgoja/widget-site -S
  echo
  echo "## Package component exports"
  rg -n "export \* from './" packages/rag-evaluation-site/src/components packages/rag-evaluation-site/src/index.ts packages/rag-evaluation-site/src/context -S
  echo
  echo "## Existing DSL helper names"
  rg -n "setExport\(|func \(r \*runtime\).*Helper|recipes|page\(" pkg/widgetdsl -S
  echo
  echo "## Existing tests mentioning Widget IR"
  rg -n "Widget|widget|recipes|ComponentNode|DataTable|masterDetail|JSON" pkg packages/rag-evaluation-site/src -g '*test*' -S
} > "$OUT"
echo "$OUT"
