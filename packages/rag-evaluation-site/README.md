# @go-go-golems/rag-evaluation-site

React Widget IR renderer and default RAG evaluation site shell.

## Install

```bash
pnpm add @go-go-golems/rag-evaluation-site react react-dom
```

## Renderer usage

```tsx
import { WidgetRenderer, useWidgetPage } from '@go-go-golems/rag-evaluation-site';
import '@go-go-golems/rag-evaluation-site/styles.css';

export function Page() {
  const { page, loading, error } = useWidgetPage('/api/widget/pages/demo');
  if (loading) return <div>Loading…</div>;
  if (error || !page) return <div>Failed to load page</div>;
  return <WidgetRenderer node={page.root} />;
}
```

## Default app usage

```tsx
import { RagEvaluationSiteApp } from '@go-go-golems/rag-evaluation-site/app';
import '@go-go-golems/rag-evaluation-site/styles.css';

export function App() {
  return <RagEvaluationSiteApp apiBase="/api/widget" defaultPageId="index" />;
}
```

## Build outputs

- `dist/`: npm package artifact.
- `app-dist/`: default Vite app build for Go embedding.
