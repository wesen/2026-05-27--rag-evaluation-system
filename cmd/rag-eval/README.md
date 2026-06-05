# rag-eval CLI and Scripting Runtime

This directory contains the Go CLI entrypoint (`main.go`) and the JavaScript scripting layer for the RAG Evaluation System.

## Directory layout

| File / Directory | Purpose |
|------------------|---------|
| `main.go` | Go entrypoint: registers Cobra commands for source, chunk, document, embedding, search, serve, and workflow |
| `xgoja.yaml` | Build spec for the `rag-eval-js` scripting binary. Declares modules (`db`, `fs`, `express`, `markdown`, `sanitize`, `extract`, etc.), runtime profiles, and embedded jsverb packages |
| `jsverbs/` | JavaScript verb packages. Each `.js` file becomes a CLI command group under `rag-eval-js` |
| `dist/` | Output directory for the generated `rag-eval-js` binary |

## Quick start for Go CLI

```bash
# Build the main Go CLI
cd ../../  # repo root
make build

# Run it
./rag-eval source list
./rag-eval document list
```

## Quick start for JavaScript scripting

```bash
# Build the scripting binary (required after any jsverb change)
xgoja build -f xgoja.yaml --output dist/rag-eval-js --xgoja-replace ../../../go-go-goja

# Run built-in explorer verbs
./dist/rag-eval-js explorer sources --database ../../data/rag-eval.db
./dist/rag-eval-js explorer documents --limit 5
./dist/rag-eval-js explorer doc-detail ttc-article-9838 --output json
```

## Writing new jsverbs

Verb packages live in `jsverbs/`. Each file follows this pattern:

```js
__package__({ name: "myPackage", short: "Description" });
const db = require("db");

function myVerb(database) {
  db.configure("sqlite3", database || "data/rag-eval.db");
  return db.query("SELECT * FROM sources");
}

__verb__("myVerb", {
  short: "List sources",
  fields: {
    database: { type: "string", default: "data/rag-eval.db" }
  }
});
```

After editing, rebuild with `xgoja build` as shown above.

## Documentation

- **Full tutorial** — [docs/howtos/how-to-write-rag-eval-js-scripts.md](../../docs/howtos/how-to-write-rag-eval-js-scripts.md) — Conceptual foundation, mental model, module APIs, and step-by-step guide
- **Quick reference** — [docs/howtos/how-to-write-rag-eval-js-scripts-quick-reference.md](../../docs/howtos/how-to-write-rag-eval-js-scripts-quick-reference.md) — Copy-paste patterns, API tables, build commands, and troubleshooting

## Available modules

The scripting runtime exposes these native modules to JavaScript:

| Module | Purpose |
|--------|---------|
| `db` | SQLite query, exec, and connection management |
| `fs` | File read, write, mkdir, stat, rename, delete |
| `express` | HTTP route registration and static file serving |
| `markdown` | Parse, walk, render, and validate Markdown |
| `sanitize` | Repair malformed YAML and JSON |  
| `extract` | Find structured data candidates in text |
| `yaml` | YAML parse and stringify |
| `path` | Path manipulation utilities |

All modules are declared in `xgoja.yaml`.

## Rebuilding

Any change to `jsverbs/` or `xgoja.yaml` requires a rebuild:

```bash
xgoja build -f xgoja.yaml --output dist/rag-eval-js --xgoja-replace ../../../go-go-goja
```

The `--xgoja-replace` flag is necessary because the workspace uses local `go-go-goja` and `goja-text` checkouts via Go workspace mode.
