#!/usr/bin/env bash
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
TICKET="$ROOT/ttmp/2026/06/07/RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS--semantic-widget-ir-support-for-reusable-design-system-components"
OUT="$TICKET/sources/02-line-references.md"
emit() {
  local title="$1" file="$2" start="$3" end="$4"
  echo "## $title"
  echo
  echo "File: \`$file\` lines $start-$end"
  echo
  echo '```text'
  nl -ba "$ROOT/$file" | sed -n "${start},${end}p"
  echo '```'
  echo
}
{
  echo "# Line References for Widget IR Semantic Components"
  echo
  emit "TypeScript Widget IR model" "packages/rag-evaluation-site/src/widgets/ir.ts" 1 220
  emit "WidgetRenderer dispatch and current component coverage" "packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx" 1 260
  emit "WidgetRenderer current component cases continued" "packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx" 260 520
  emit "Widget DSL module exports and helpers" "pkg/widgetdsl/module.go" 1 260
  emit "Widget DSL recipes and helpers" "pkg/widgetdsl/module.go" 260 620
  emit "Widget DSL tests" "pkg/widgetdsl/module_test.go" 1 260
  emit "Package public exports" "packages/rag-evaluation-site/src/index.ts" 1 180
  emit "Component molecule exports" "packages/rag-evaluation-site/src/components/molecules/index.ts" 1 200
  emit "Component organism exports" "packages/rag-evaluation-site/src/components/organisms/index.ts" 1 200
  emit "Context DTOs" "packages/rag-evaluation-site/src/context/types.ts" 1 260
  emit "Context fixtures" "packages/rag-evaluation-site/src/context/fixtures.ts" 1 340
  emit "Package guidelines" "packages/rag-evaluation-site/GUIDELINES.md" 1 260
  emit "Existing WidgetRenderer Storybook examples" "packages/rag-evaluation-site/src/widgets/WidgetRenderer.stories.tsx" 1 260
} > "$OUT"
echo "$OUT"
