---
Title: "Bundling the WidgetRenderer SPA"
Slug: widget-dsl-spa-bundling
Short: "Package the React WidgetRenderer frontend with xgoja or Go applications that emit Widget IR."
Topics:
- xgoja
- widget-dsl
- widget-ir
- react
- assets
- go-embed
Commands:
- xgoja build
- pnpm build:app
Flags: []
IsTopLevel: false
IsTemplate: false
ShowPerDefault: true
SectionType: Application
---

A Widget DSL application has two runtime halves. The JavaScript or Go backend emits Widget IR at endpoints such as `/api/widget/pages/{id}`. The browser frontend fetches that JSON and renders it with the React `WidgetRenderer` from `@go-go-golems/rag-evaluation-site`.

The provider only supplies the authoring module, `require("widget.dsl")` / `require("rag.dsl")`. It does not turn Widget IR into HTML on the Go side. If an application should be usable in a browser, it must also serve a WidgetRenderer SPA. You can use the embedded Go SPA that ships with this repository, serve a development proxy, or copy the built SPA into an xgoja asset bundle.

## Choose the packaging mode

Use this section to choose how the frontend is bundled. The right option depends on whether the host is a Go program, an xgoja-generated binary, or a JavaScript/React application.

| Mode | Use when | Who owns the SPA assets |
| --- | --- | --- |
| Go embedded default SPA | A Go program wants a ready-made WidgetRenderer UI. | `pkg/defaultspa` embeds the built assets. |
| xgoja embedded assets | An xgoja app wants one generated binary with JavaScript verbs and the React UI. | The xgoja app copies `app-dist` into its own `assets/public` tree. |
| Development proxy | You are changing React code and want Vite hot reload. | The Vite dev server owns the frontend during development. |
| API-only | Another web app already renders Widget IR. | The host serves only `/api/widget/...` JSON. |

The important boundary is stable across all modes: the backend owns data, actions, authentication, and persistence; the React app owns rendering, CSS, client-side routing, accessibility behavior, and browser event handling.

## Use the embedded SPA from Go

A Go application can import the default embedded SPA and mount it with normal `net/http` routing. Register API routes separately, then let the SPA handle browser routes such as `/`, `/pages/demo`, and `/pages/actions`.

```go
package main

import (
    "encoding/json"
    "net/http"

    "github.com/go-go-golems/rag-evaluation-system/pkg/defaultspa"
)

func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("GET /api/widget/pages/{id}", func(w http.ResponseWriter, r *http.Request) {
        _ = json.NewEncoder(w).Encode(map[string]any{
            "schemaVersion": "0.1.0",
            "id":            r.PathValue("id"),
            "title":         "Demo",
            "root": map[string]any{
                "kind":  "component",
                "type":  "Panel",
                "props": map[string]any{"title": "Demo"},
                "children": []any{map[string]any{"kind": "text", "text": "Rendered by React"}},
            },
        })
    })

    mux.Handle("/", defaultspa.Handler())
    _ = http.ListenAndServe("127.0.0.1:8080", mux)
}
```

This mode is the best default for Go applications that want the standard renderer. The application still owns `/api/widget/pages/{id}` and `/api/widget/actions/{name}`. The embedded SPA only knows how to fetch those endpoints and render the returned Widget IR.

For applications that want the complete page/action server contract, use `pkg/widgetserver`. Its embedded frontend mode serves `pkg/defaultspa` by default, while `dir`, `proxy`, and `api-only` modes support local development and integration tests.

## Bundle the SPA into an xgoja application

An xgoja-generated binary needs explicit static assets. Build the React app, copy the output into the xgoja app's asset tree, expose that tree through `fs:assets`, and mount it with `spaFromAssetsModule`.

From the repository root, build the default frontend:

```bash
pnpm --dir packages/rag-evaluation-site build:app
```

That creates:

```text
packages/rag-evaluation-site/app-dist/
```

Copy the relevant files into your xgoja app. The bundled example uses this shape:

```text
examples/xgoja/widget-site/assets/public/index.html
examples/xgoja/widget-site/assets/public/assets/...
```

The example target is:

```bash
make -C examples/xgoja/widget-site sync-app
```

A separate application can use the same copy step in its own `Makefile`:

```make
sync-widget-spa:
	rm -rf ./assets/public
	mkdir -p ./assets/public
	cp -R /path/to/rag-evaluation-system/packages/rag-evaluation-site/app-dist/index.html \
	      /path/to/rag-evaluation-system/packages/rag-evaluation-site/app-dist/assets \
	      ./assets/public/
	find ./assets/public -name '*.map' -delete
```

Then embed that asset tree in `xgoja.yaml`:

```yaml
packages:
  - id: go-go-goja-host
    import: github.com/go-go-golems/go-go-goja/pkg/xgoja/providers/host
  - id: go-go-goja-http
    import: github.com/go-go-golems/go-go-goja/pkg/xgoja/providers/http
  - id: rag-widget-site
    import: github.com/go-go-golems/rag-evaluation-system/pkg/xgoja/providers/widgetsite

assets:
  - id: webapp
    path: ./assets
    embed: true
    description: Built WidgetRenderer SPA assets.

modules:
  - package: go-go-goja-http
    name: express
    as: express
  - package: go-go-goja-host
    name: fs
    as: fs:assets
    config:
      embedded:
        allow: true
        mounts:
          - asset: webapp
            mount: /app
  - package: rag-widget-site
    name: widget.dsl
    as: widget.dsl
```

Finally, serve the SPA from the JavaScript verb and keep API routes out of the static fallback:

```js
function demo() {
  const express = require("express")
  const assets = require("fs:assets")
  const rag = require("widget.dsl")

  const app = express.app()

  app.spaFromAssetsModule("/", assets, "/app/public", {
    excludePrefixes: ["/api", "/healthz", "/favicon.ico"]
  })

  app.get("/api/widget/pages/demo", (_req, res) => {
    res.json({
      schemaVersion: "0.1.0",
      id: "demo",
      title: "Demo",
      root: rag.panel({ title: "Demo" },
        rag.caption({ tone: "muted" }, "Rendered by React"),
        rag.button({ variant: "primary" }, "Refresh")
      )
    })
  })
}
```

`excludePrefixes` is required when the SPA is mounted at `/`. Without it, the static fallback can answer `/api/widget/pages/demo` with `index.html`, and the browser will fail because it expected JSON.

## Keep embedded assets fresh

The renderer bundle changes whenever `WidgetRenderer`, CSS, or the default app changes. Rebuild and resync assets before building a release binary.

For the xgoja example:

```bash
pnpm --dir packages/rag-evaluation-site build:app
make -C examples/xgoja/widget-site sync-app
make -C examples/xgoja/widget-site smoke
```

For the Go embedded default SPA in this repository:

```bash
pnpm --dir packages/rag-evaluation-site build:app
pnpm --dir packages/rag-evaluation-site sync:defaultspa
go test ./pkg/defaultspa ./pkg/widgetserver ./pkg/xgoja/providers/widgetsite -count=1
```

Commit the refreshed embedded assets when the repository should ship a new default renderer. If you change only backend page data and not the renderer, you do not need to rebuild the SPA.

## When not to bundle the default SPA

Do not bundle the default SPA when your application already has its own React shell. In that case, install `@go-go-golems/rag-evaluation-site`, import `WidgetRenderer` or `RagEvaluationSiteApp`, and serve only Widget IR JSON from the backend.

```tsx
import { RagEvaluationSiteApp } from '@go-go-golems/rag-evaluation-site/app';
import '@go-go-golems/rag-evaluation-site/styles.css';

export function App() {
  return <RagEvaluationSiteApp apiBase="/api/widget" defaultPageId="index" />;
}
```

This mode is useful when the host app already owns authentication, layout, navigation, and deployment. The RAG package provides the renderer and component vocabulary, but the host app bundles the frontend in its normal Vite, Next.js, or other web build.

## Troubleshooting

| Problem | Cause | Solution |
| --- | --- | --- |
| Browser routes such as `/pages/demo` return `404`. | Static files are served without SPA fallback. | Use `defaultspa.Handler()`, `widgetserver` embedded frontend mode, or `app.spaFromAssetsModule(...)`. |
| `/api/widget/pages/demo` returns `index.html`. | The root SPA fallback caught the API route. | Add `/api` to `excludePrefixes`, or register API routes outside the SPA handler. |
| The browser shows `Unknown widget: ...`. | The embedded SPA is older than the Widget IR emitted by the backend. | Rebuild with `pnpm --dir packages/rag-evaluation-site build:app` and resync embedded assets. |
| `Cannot find module "fs:assets"`. | The xgoja build spec did not select and configure the host `fs` module. | Add the `go-go-goja-host` package and a `modules:` entry with `as: fs:assets`. |
| `Cannot find module "widget.dsl"`. | The widget provider was not selected in `xgoja.yaml`. | Add the `rag-widget-site` package and select `name: widget.dsl`. |
| The npm package works in React but the xgoja binary has no UI. | `widget.dsl` only creates Widget IR; it does not include browser assets. | Bundle the default SPA assets or build a host frontend that imports `RagEvaluationSiteApp`. |

## See Also

- `widget-dsl-getting-started`
- `widget-dsl-js-api-reference`
- `tutorial-static-assets-http-server`
- `tutorial-http-serve-jsverbs`
- `buildspec-reference`
