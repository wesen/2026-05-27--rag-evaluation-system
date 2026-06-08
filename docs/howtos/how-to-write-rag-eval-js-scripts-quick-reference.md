---
Title: "Quick reference: writing rag-eval-js scripts"
Slug: how-to-write-rag-eval-js-scripts-quick-reference
Short: "Copy-paste reference for writing jsverbs: patterns, APIs, build commands, and troubleshooting."
Topics:
- rag-eval
- xgoja
- scripting
- javascript
- jsverbs
- sqlite
- quick-reference
Commands:
- rag-eval-js
Flags:
- database
- output
IsTopLevel: false
IsTemplate: false
ShowPerDefault: true
SectionType: GeneralTopic
---

This is the quick-reference companion to the full tutorial. Read the full version for the conceptual foundation. Use this page when you are actively writing a verb and need the exact pattern.

## Minimal verb template

```js
__package__({ name: "myPackage", short: "What this package does" });

const db = require("db");

const DEFAULT_DB = "data/rag-eval.db";

function openDatabase(database) {
  const path = database || DEFAULT_DB;
  db.configure("sqlite3", path);
  return path;
}

function myVerb(database, limit) {
  openDatabase(database);
  const n = limit || 20;
  return db.query("SELECT * FROM sources LIMIT ?", n);
}

__verb__("myVerb", {
  short: "List sources",
  fields: {
    database: { type: "string", default: "data/rag-eval.db", help: "SQLite path" },
    limit: { type: "int", default: 20, help: "Max rows" }
  }
});
```

## Module availability

| `require(...)` | Key functions |
|----------------|---------------|
| `"db"` | `configure(driver, dsn)`, `query(sql, ...args)`, `exec(sql, ...args)`, `close()` |
| `"fs"` | `readFileSync(p, enc)`, `writeFileSync(p, data, enc)`, `mkdirSync(p, opts)`, `readdirSync(p)`, `statSync(p)`, `existsSync(p)` |
| `"express"` | `app()` → `.get(pattern, fn)`, `.post(...)`, `.put(...)`, `.delete(...)`, `.all(...)`, `.static(prefix, dir)` |
| `"markdown"` | `parse(text)`, `renderHTML(text)`, `walk(ast, visitor)`, `textContent(node)`, `validate(value)` |
| `"sanitize"` | `yaml.sanitize(text)`, `yaml.lint(text)`, `json.sanitize(text)`, `json.strictParse(text)` |
| `"extract"` | `all(text)`, `markdownCodeBlocks(text)`, `xmlTagged(text)`, `frontmatter(text)`, `validate(candidate)` |
| `"yaml"` | `parse(text)`, `stringify(obj)`, `validate(text)` |
| `"path"` | `join(...)`, `resolve(...)`, `basename(p)`, `dirname(p)`, `extname(p)` |

## Dynamic SQL with optional filters

```js
function documents(database, sourceId, status, limit) {
  openDatabase(database);
  let sql = `SELECT * FROM documents`;
  const conditions = [];
  const args = [];

  if (sourceId) { conditions.push("source_id = ?"); args.push(sourceId); }
  if (status) { conditions.push("status = ?"); args.push(status); }
  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " LIMIT ?";
  args.push(limit || 20);

  return db.query(sql, args);
}
```

## Export pattern with `fs`

```js
const fs = require("fs");

function exportRows(rows, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const row of rows) {
    fs.writeFileSync(
      `${outDir}/${row.id}.json`,
      JSON.stringify(row, null, 2),
      "utf-8"
    );
  }
  return { exported: rows.length, dir: outDir };
}
```

## Markdown analysis pattern

```js
const markdown = require("markdown");

function countHeadings(text) {
  const ast = markdown.parse(text);
  let n = 0;
  markdown.walk(ast, (node) => {
    if (node.Type === "heading") n++;
  });
  return n;
}
```

## Express server pattern

```js
const express = require("express");

function serveApi(database, port) {
  openDatabase(database);
  const app = express.app();

  app.get("/api/rows", (_req, res) => {
    res.json({ rows: db.query("SELECT * FROM sources") });
  });

  return { ok: true, port: port || 8787 };
}
```

Run long-lived:

```bash
rag-eval-js run script.js --keep-alive --http-listen 127.0.0.1:8788
```

## Defensive sanitize access

```js
const sanitize = require("sanitize");

const result = sanitize.yaml.sanitize(text);
const fixes = (result.Fixes || []).map((f) => f.Rule);
const issues = ((result.Issues || result.LintIssues) || []).map((i) => i.Message);
```

## Rebuild after changes

```bash
cd cmd/rag-eval
xgoja build -f xgoja.yaml --output dist/rag-eval-js --xgoja-replace ../../../go-go-goja
```

## Run and test

```bash
# List verbs
./dist/rag-eval-js myPackage --help

# Run verb
./dist/rag-eval-js myPackage my-verb --database ../../data/rag-eval.db

# JSON output
./dist/rag-eval-js myPackage my-verb --output json

# One-liner eval
./dist/rag-eval-js eval 'const db=require("db"); db.configure("sqlite3","data/rag-eval.db"); console.log(db.query("SELECT COUNT(*) AS n FROM documents")[0].n);'
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `database not configured` | Call `db.configure("sqlite3", path)` before first query |
| `.Fixes.map` crashes | Use `(result.Fixes \| \| []).map(...)` |
| Port `8787` busy | Pass `--http-listen 127.0.0.1:8788` or use `run --keep-alive` |
| `rows[0]` is undefined | Check `rows.length` before indexing |
| `xgoja build` module errors | Verify `--xgoja-replace` points to the right checkout |
| Verb not in help | Rebuild with `xgoja build` after adding `.js` files |

## See Also

- `rag-eval-js help how-to-write-rag-eval-js-scripts` — Full conceptual tutorial
- `rag-eval-js help explorer` — Built-in explorer verbs
- `cmd/rag-eval/xgoja.yaml` — Module declarations and build spec
- `cmd/rag-eval/jsverbs/` — Existing verb packages
