---
Title: Research Logbook
Ticket: ""
Status: ""
Topics:
    - research
    - xgoja
    - goja-text
    - rag-eval
    - scripting
    - glazed
DocType: ""
Intent: ""
Owners: []
RelatedFiles:
    - Path: 2026-05-27--rag-evaluation-system/cmd/rag-eval/jsverbs/explorer.js
      Note: Primary artifact of the research
ExternalSources: []
Summary: ""
LastUpdated: 0001-01-01T00:00:00Z
WhatFor: ""
WhenToUse: ""
---


# Research Logbook

## Overview

This document tracks every resource consulted during the `rag-eval-scripting-expansion` ticket. For each resource, it records why it was chosen, what it contained, what was useful, what was not, and what needs updating. The purpose is to save future researchers from rediscovering the same dead ends and to flag stale or misleading documentation before it wastes time.

---

## Resource 1: `cmd/rag-eval/main.go`

| Field | Value |
|-------|-------|
| **What I was researching** | How the rag-eval CLI is structured and where xgoja fits in.
| **What I was looking for** | Whether the main binary already initializes a help system that could load glazed help entries.
| **Why I chose it** | The entry point is the canonical place to discover command wiring and top-level initialization.
| **How I found it** | Listed in `find` output for the `cmd/rag-eval` tree.
| **What was useful** | Confirmed that `rag-eval` is a standard Cobra CLI with no `help_cmd.SetupCobraRootCommand(...)` call. Logging is initialized via `logging.InitLoggerFromCobra` and `logging.AddLoggingSectionToRootCommand`. The scripting binary (`rag-eval-js`) is separate.
| **What was not useful** | The file is short and does not show how the xgoja binary is generated from the same source tree. You have to infer that by looking at `xgoja.yaml`.
| **Out of date / wrong** | Nothing wrong. The version string is `"dev"`, which is expected for a local build.
| **What would need updating** | If we register glazed help docs directly in `rag-eval-js`, we will need to add `help_cmd.SetupCobraRootCommand(...)` to the generated xgoja entrypoint. That is beyond the scope of this ticket but should be noted.

---

## Resource 2: `cmd/rag-eval/xgoja.yaml`

| Field | Value |
|-------|-------|
| **What I was researching** | The exact module set available to `rag-eval-js` and how the binary is configured.
| **What I was looking for** | Which modules are exposed, how they are named in `require()`, and whether `allowConfigure: true` is set on `db`.
| **Why I chose it** | This is the authoritative build spec. Every module exposed to JavaScript is declared here.
| **How I found it** | Listed alongside `main.go` in the `cmd/rag-eval` directory during initial `find`.
| **What was useful** | Confirmed the exact alias names: `db`, `fs`, `express`, `markdown`, `sanitize`, `extract`, `yaml`, `path`, `geppetto`. Confirmed `allowConfigure: true` on the `db` module. Confirmed `replace: ../../../go-go-goja` paths, which explains why the build needs `--xgoja-replace`. Showed that `jsverbs` are embedded from `./jsverbs/`.
| **What was not useful** | The `help.sources` section references `goja-text-runtime-api`, but there is no mention of how to add custom help sources for user-written jsverbs. I had to infer that from glazed docs.
| **Out of date / wrong** | Nothing wrong, but the `geppetto` module is declared with `allowRegistryLoad: true` and `allowNetwork: true`. If this binary is ever used in an environment where network access is restricted, those flags could be a security concern. They are currently unused by the new verbs.
| **What would need updating** | If new modules are added (e.g., `events`, `timer`, `crypto`), this file is the only place that needs changing. A comment block at the top summarizing the rebuild command would save time. |

---

## Resource 3: `cmd/rag-eval/jsverbs/database.js`

| Field | Value |
|-------|-------|
| **What I was researching** | The expected pattern for writing jsverbs in this project.
| **What I was looking for** | How `__package__`, `__verb__`, `require`, and field descriptors are used.
| **Why I chose it** | This was the first and most complete existing verb package. It demonstrates `db`, `fs`, `yaml`, and `markdown` in one file.
| **How I found it** | Listed in the `find` output for `cmd/rag-eval/jsverbs`.
| **What was useful** | Showed the `openDatabase` helper pattern, the `__package__`/`__verb__` registration sequence, dynamic SQL with `COALESCE`, and the `markdown.parse` / `markdown.walk` / `markdown.textContent` pattern. The firstNonEmptyLine / markdownTitle logic is a solid example of defensive text processing.
| **What was not useful** | The `configProbe` verb is a proof-of-concept that does not query the database; it demonstrates `fs` + `yaml` but has no operational value for corpus work. It could be moved to `capabilities.js`.
| **Out of date / wrong** | The `chunkPreview` verb uses `substr(c.text, 1, 240)` which is SQLite-specific. This is fine for SQLite but would fail on PostgreSQL if the project ever migrates. The verb name `chunkPreview` uses camelCase, which Glazed automatically hyphenates to `chunk-preview` for the CLI.
| **What would need updating** | The `DEFAULT_DB` constant is `"data/rag-eval.db"`. Some developers run from the repo root and some from `cmd/rag-eval/`. The relative path breaks depending on CWD. The verbs should ideally use `process.cwd()` or an environment variable fallback. |

---

## Resource 4: `cmd/rag-eval/jsverbs/capabilities.js`

| Field | Value |
|-------|-------|
| **What I was researching** | How the `express` module is used and whether it supports route parameters.
| **What I was looking for** | A working `express` example that I could adapt for `serveDbBrowser`.
| **Why I chose it** | The `serveProbe` verb is the only existing example that uses the `express` module.
| **How I found it** | Listed alongside `database.js` in the jsverbs directory.
| **What was useful** | Confirmed that `express.app()` returns an object with `.get()`, `.post()`, etc. Showed the `body` parameter pattern. Clarified that the express server is tied to the xgoja runtime's HTTP server, not a standalone Node.js server.
| **What was not useful** | The `moduleProbe` verb is useful for debugging but the `keys: Object.keys(mod).sort().slice(0, 20)` truncation hides important methods. It does not show how to discover method signatures.
| **Out of date / wrong** | The `serveProbe` note says "For long-running use prefer a dedicated run script with --keep-alive," but it does not explain *how* to write that script. The verb just returns a note. A longer example showing `setInterval(() => {}, 1000)` or a real blocking call would help.
| **What would need updating** | The `moduleProbe` should show TypeScript-style signatures or at least list all exported functions. The `serveProbe` should include a complete `run --keep-alive` example in its help text. |

---

## Resource 5: `go-go-goja/modules/database/database.go`

| Field | Value |
|-------|-------|
| **What I was researching** | The exact API of the `db` native module.
| **What I was looking for** | Function signatures, argument flattening behavior, connection lifecycle, and whether transactions are supported.
| **Why I chose it** | Native module source code is the ground truth for what JavaScript can call.
| **How I found it** | Located via `ls go-go-goja/modules/database/` after confirming the module directory layout.
| **What was useful** | Showed that `query()` flattens arguments via `flattenArgs()`, so passing an array or variadic args both work. Showed that `Configure` opens a new `sql.DB` and closes the old one. Confirmed that `close()` exists and can be called from JS. The `QueryContext` / `ExecContext` interfaces mean the module respects Go contexts.
| **What was not useful** | No transaction support. `db.begin()`, `db.commit()`, `db.rollback()` do not exist. This limits scripts that need atomic multi-statement updates.
| **Out of date / wrong** | Nothing wrong. The `database_test.go` file was not examined but could provide more edge cases.
| **What would need updating** | Transaction support would be a valuable addition for scripts that update multiple tables atomically. |

---

## Resource 6: `go-go-goja/modules/fs/fs.go`

| Field | Value |
|-------|-------|
| **What I was researching** | Whether `fs.mkdirSync` supports `{ recursive: true }` and what encodings `readFileSync` accepts.
| **What I was looking for** | The Go-side implementation of `mkdirOptions` and `writeOptions`.
| **Why I chose it** | Needed to verify the claim that `fs.mkdirSync(dir, { recursive: true })` works before using it in `exportDocs`.
| **How I found it** | Located alongside `database.go` in the `modules` tree.
| **What was useful** | Confirmed `mkdirOptions` reads `recursive` and `mode` from the JS object. Confirmed `readFileSync` supports `"utf-8"` and returns a string when encoding is provided, otherwise a Buffer. Confirmed `writeFileSync` decodes strings, Buffers, Uint8Arrays, and DataViews.
| **What was not useful** | The `Backend` interface abstraction is over-engineered for understanding the JS API. The key information is in the `Loader` function and the option parsers.
| **Out of date / wrong** | Nothing wrong. The `fs_errors.go` file defines custom error types but the JS side panics on errors, which is not ideal. A friendlier JS error object would be better.
| **What would need updating** | The `fs` module could expose `readDirSync` file metadata (`name`, `isDir`) instead of just strings. Currently `readdirSync` returns `[]string`. |

---

## Resource 7: `go-go-goja/modules/express/express.go`

| Field | Value |
|-------|-------|
| **What I was researching** | How route parameters work in the xgoja `express` module.
| **What I was looking for** | Whether `req.params.id` is populated by the Go backend.
| **Why I chose it** | Needed to write `serveDbBrowser` with `/api/documents/:id` routes.
| **How I found it** | Located in `go-go-goja/modules/express/`.
| **What was useful** | Confirmed that `app.get(pattern, handler)` registers routes and that the Go `gojahttp.Host` handles HTTP serving. The `static` and `staticFromAssetsModule` methods are available for embedding static assets.
| **What was not useful** | The source code does not show how path parameters are parsed into `req.params`. That logic lives in `gojahttp.Host`, which is in a different package. I had to assume the standard Express convention and test it empirically.
| **Out of date / wrong** | Nothing wrong, but the `express` module lacks middleware support (`next()` chaining, body parsers, cors). This is a limitation of the minimal implementation.
| **What would need updating** | Document the available subset of Express APIs. A compatibility matrix in the module docstring would help. |

---

## Resource 8: `goja-text/pkg/xgoja/providers/text/text.go`

| Field | Value |
|-------|-------|
| **What I was researching** | How `goja-text` modules are registered and made available to xgoja.
| **What I was looking for** | Whether `markdown`, `sanitize`, and `extract` are exposed as separate `require()` names or grouped under a single module.
| **Why I chose it** | The top-level `text.go` registers the three modules and adds help sources. It is the bridge between the goja-text library and the xgoja provider system.
| **How I found it** | Located via `find goja-text/pkg/xgoja/providers/text -name "*.go"`.
| **What was useful** | Confirmed that `modules.GetModule(name)` is called for `"markdown"`, `"sanitize"`, and `"extract"`. This means each is a standalone `require()` target. Confirmed that help sources are loaded from embedded FS.
| **What was not useful** | The file itself is thin; the real implementations live in `goja-text/pkg/markdown/`, `pkg/sanitize/`, and `pkg/extract/`. The file does not show the JS-facing API.
| **Out of date / wrong** | Nothing wrong.
| **What would need updating** | The `nativeModuleEntry` helper could expose more metadata (e.g., version, dependencies) for discovery tools. |

---

## Resource 9: `goja-text/pkg/xgoja/providers/text/doc/markdown-api-reference.md`

| Field | Value |
|-------|-------|
| **What I was researching** | The exact API of the `markdown` module: `parse`, `renderHTML`, `walk`, `textContent`, `validate`.
| **What I was looking for** | The return shapes of `walk` and `validate`, and whether `textContent` works on any node type.
| **Why I chose it** | This is the authoritative API reference for the `markdown` module, shipped as a glazed help entry.
| **How I found it** | Listed alongside `text.go` in the `doc/` subdirectory.
| **What was useful** | Clear descriptions of `walk` visitor return semantics (`undefined`/`true` = continue, `false`/`"skip"` = skip children, `"stop"` = halt). PascalCase field list for `MarkdownNode`. The `renderHTML` function is mentioned but not demonstrated with an example.
| **What was not useful** | No information on performance. No mention of whether `parse` is streaming or loads the entire document into memory. For large Markdown files (100KB+), this matters.
| **Out of date / wrong** | Nothing wrong.
| **What would need updating** | Add a note about memory usage for large documents. Add an example showing `renderHTML` with a fenced code block and syntax highlighting options. |

---

## Resource 10: `goja-text/pkg/xgoja/providers/text/doc/extract-api-reference.md`

| Field | Value |
|-------|-------|
| **What I was researching** | The `extract` module API for structured-data candidate extraction.
| **What I was looking for** | The fields on `ExtractionCandidate`, how `validate` works, and whether `all()` deduplicates overlapping candidates.
| **Why I chose it** | Needed to write `extractProbe` and understand how `extract.all()` behaves.
| **How I found it** | Listed in `goja-text/pkg/xgoja/providers/text/doc/`.
| **What was useful** | Comprehensive field list: `Kind`, `Format`, `Text`, `Raw`, `StartByte`, `EndByte`, `Confidence`, `Diagnostics`. Confirmed that overlapping candidates are preserved. Confirmed `validate` delegates to `sanitize` semantics.
| **What was not useful** | No numerical examples for `Confidence`. Is 0.5 low or high? The document says "heuristic confidence score" without a scale.
| **Out of date / wrong** | Nothing wrong.
| **What would need updating** | Add a `Confidence` scale explanation (0.0–1.0). Show a worked example with overlapping candidates and explain the policy for choosing between them. |

---

## Resource 11: `goja-text/pkg/xgoja/providers/text/doc/sanitize-api-reference.md`

| Field | Value |
|-------|-------|
| **What I was researching** | The `sanitize` module API: namespaces, builder methods, result fields.
| **What I was looking for** | Whether `sanitize.yaml.sanitize()` returns `Fixes` and `Issues` on clean input, and what the `StrictParseClean` field means.
| **Why I chose it** | Needed to write `sanitizeProbe` and handle null/undefined `Fixes` safely.
| **How I found it** | Listed in `goja-text/pkg/xgoja/providers/text/doc/`.
| **What was useful** | Clear builder API (`MaxIterations`, `TabWidth`, `OnlyRules`, etc.). JSON namespace is shown alongside YAML. The `StrictParseClean` field is documented.
| **What was not useful** | The document does not warn that `Fixes` and `Issues` may be `null` or `undefined` when the input is already clean. This caused a runtime error in the first draft of `sanitizeProbe`.
| **Out of date / wrong** | The field names are documented as PascalCase (`Sanitized`, `Fixes`, `Issues`), which is correct. The document does not mention the defensive pattern `(result.Fixes || [])`.
| **What would need updating** | Add a warning: "`Fixes` and `Issues` may be `null` if no fixes or issues were found. Always coalesce before mapping." |

---

## Resource 12: `internal/db/db.go`

| Field | Value |
|-------|-------|
| **What I was researching** | The exact SQLite schema and migration definitions.
| **What I was looking for** | All table definitions, foreign key relationships, and the `ensureChunksStrategyID` migration logic.
| **Why I chose it** | This is the single source of truth for the database schema. Every query in the new verbs must match these definitions.
| **How I found it** | Located via `grep -n "CREATE TABLE" internal/db/`.
| **What was useful** | Complete schema for all tables: `sources`, `documents`, `chunks`, `chunking_strategies`, `chunk_embeddings`, `chunk_enrichments`, `document_processing_artifacts`, `search_indexes`, `eval_queries`, `eval_runs`, `eval_results`. The `ensureChunksStrategyID` function shows how legacy databases are migrated.
| **What was not useful** | The `OpenDB` function sets `SetMaxOpenConns(1)` which is correct for SQLite but restrictive. It does not explain why WAL mode is chosen or how to tune the busy timeout.
| **Out of date / wrong** | Nothing wrong. The `word_count` field on `documents` is `INTEGER DEFAULT 0` but the Go `Queries.InsertDocument` does not enforce non-negativity.
| **What would need updating** | Add a schema diagram (e.g., Mermaid ER diagram) as a comment block. The `metadata_json` fields should ideally have a helper to validate JSON on insert, but that is a Go-side concern. |

---

## Resource 13: `internal/db/queries.go`

| Field | Value |
|-------|-------|
| **What I was researching** | How the Go backend performs typed queries and whether there are helper patterns I should mirror in JS.
| **What I was looking for** | The `placeholders` helper, the `InsertDocument` upsert pattern, and how `nullString` / `nullInt` work.
| **Why I chose it** | The Go query layer is the reference implementation for database access. JS verbs should produce the same results.
| **How I found it** | Located alongside `db.go` and `search_queries.go` in `internal/db/`.
| **What was useful** | The `placeholders(n)` function is simple but clever: `strings.TrimRight(strings.Repeat("?,", n), ",")`. The `InsertDocument` and `InsertSource` queries use `ON CONFLICT(id) DO UPDATE SET ...` which is the correct SQLite upsert pattern. The `nullString` / `nullInt` wrappers show how NULL fields are handled in Go.
| **What was not useful** | Many query methods (e.g., `ListDocuments`) use manual `Scan` loops instead of `sqlx` or a code-generated query layer. This is verbose but predictable. It does not affect the JS side.
| **Out of date / wrong** | `ListDocuments` does not support filtering by `source_id` or `status`. The JS `documents` verb adds this dynamically, which is a gap in the Go API.
| **What would need updating** | The Go `Queries` type could grow `ListDocumentsFiltered` methods that accept `sourceId` and `status` parameters, matching the JS verb capabilities. |

---

## Resource 14: `internal/db/search_queries.go`

| Field | Value |
|-------|-------|
| **What I was researching** | How search indexes and chunk embeddings are queried for retrieval.
| **What I was looking for** | The `ChunkWithDocument` join pattern and how `ListChunksWithDocumentContext` handles optional source/document filters.
| **Why I chose it** | Needed to understand how documents, chunks, and embeddings are joined, which informed the `docDetail` and `embeddingsCoverage` JS verbs.
| **How I found it** | Located alongside `queries.go`.
| **What was useful** | The dynamic SQL builder pattern (appending `AND d.source_id IN (...)` and `AND c.document_id IN (...)`) is identical to the pattern used in `explorer.js`. This validates the approach. The `ChunkEmbeddingWithContext` struct shows all fields available for retrieval results.
| **What was not useful** | No vector similarity queries are present in this file. Vector search lives in `internal/services/search/` and uses Bleve/FAISS rather than raw SQL.
| **Out of date / wrong** | Nothing wrong.
| **What would need updating** | Add a helper that returns the SQL for a "coverage report" (chunks vs embeddings per source). The JS `embeddingsCoverage` verb duplicated this logic by hand. |

---

## Resource 15: `cmd/rag-eval/cmds/helpers.go`

| Field | Value |
|-------|-------|
| **What I was researching** | How the Go CLI opens and migrates databases.
| **What I was looking for** | Whether there is a reusable `OpenDBAtPath` function that the JS runtime could theoretically call.
| **Why I chose it** | The name `helpers.go` suggested shared utilities.
| **How I found it** | Listed in the `cmds/` directory.
| **What was useful** | Confirmed that `OpenDBAtPath` calls `db.OpenDB(path)` then `db.Migrate(database)`. This is the same sequence a JavaScript script must perform manually (the `db` module does not auto-migrate).
| **What was not useful** | The helper is trivial. It wraps two lines and does not add significant value.
| **Out of date / wrong** | Nothing wrong.
| **What would need updating** | Consider exposing `OpenDBAtPath` or a migration verb in the JS runtime so scripts do not need to know about `db.Migrate`. |

---

## Resource 16: `glazed/pkg/doc/tutorials/01-a-simple-table-cli.md`

| Field | Value |
|-------|-------|
| **What I was researching** | The exact Glazed help entry format: frontmatter fields, heading levels, content conventions.
| **What I was looking for** | Whether a Tutorial-type help entry includes a top-level `#` heading.
| **Why I chose it** | This is the canonical glazed tutorial entry. It sets the standard for all glazed help documentation.
| **How I found it** | Located via `find glazed/pkg/doc/tutorials -name "*.md"`.
| **What was useful** | Confirmed that glazed help entries do **not** use a top-level `#` heading. The `Title` frontmatter field is rendered by the help system. Confirmed the `SectionType: Tutorial` convention. Confirmed that code blocks are annotated with language tags. Confirmed the `See Also` section pattern at the end.
| **What was not useful** | The tutorial predates the `Short` field being used prominently. Its `Short` is empty, which is now discouraged by the glazed-help-page-authoring skill.
| **Out of date / wrong** | The tutorial uses `cmds.NewCommandDescription` and `fields.New(...)` which are older Glazed APIs. Newer glazed code uses `parameters.NewParameterDefinition` and `layers.NewParameterLayer`. However, the *help entry format* itself is still valid.
| **What would need updating** | Update the code examples in the tutorial to use the current Glazed API. The help entry structure (frontmatter, sections, See Also) is timeless. |

---

## Resource 17: `glazed/pkg/doc/examples/help/help-example-1.md`

| Field | Value |
|-------|-------|
| **What I was researching** | Minimal glazed help frontmatter for an Example section type.
| **What I was looking for** | Whether `IsTopLevel: true` affects rendering and how `Short` is used.
| **Why I chose it** | This is the shortest possible glazed help entry. It reveals the minimal set of required fields.
| **How I found it** | Located in `glazed/pkg/doc/examples/help/`.
| **What was useful** | Confirmed that `Short` can be a multi-line string. Confirmed that `IsTopLevel: true` places the entry in the top-level help listing. Confirmed `ShowPerDefault: true` means it appears without `--list`.
| **What was not useful** | The example is tiny and does not show content conventions. It is useful only as a frontmatter template.
| **Out of date / wrong** | Nothing wrong.
| **What would need updating** | Add a note explaining that `IsTopLevel: true` should be used sparingly to avoid cluttering the top-level help index. |

---

## Resource 18: `glazed/pkg/doc/examples/help/help-example-2.md`

| Field | Value |
|-------|-------|
| **What I was researching** | How commands and flags are tagged in glazed help entries.
| **What I was looking for** | The relationship between `Commands`/`Flags` frontmatter lists and the help system's cross-referencing.
| **Why I chose it** | This example ties a help entry to a specific command and flag.
| **How I found it** | Located in `glazed/pkg/doc/examples/help/`.
| **What was useful** | Confirmed that `Commands:` and `Flags:` are simple string lists. The help system uses them for cross-linking.
| **What was not useful** | Even shorter than example 1. No content at all.
| **Out of date / wrong** | Nothing wrong.
| **What would need updating** | Nothing.

---

## Resource 19: `/home/manuel/.pi/agent/skills/textbook-authoring/SKILL.md`

| Field | Value |
|-------|-------|
| **What I was researching** | The exact constraints of the Peter Norvig textbook style.
| **What I was looking for** | The anti-patterns list, the chapter structure, and the "no analogies" rule.
| **Why I chose it** | The user explicitly requested a "textbook writing style." This skill defines that style formally.
| **How I found it** | Pinned skills were loaded at the start of the session.
| **What was useful** | The anti-patterns list is precise and actionable: "Wandering preamble," "Hedged non-claims," "Vague bullet lists," "Philosophical throat-clearing," "Overused qualifiers," "Analogies instead of precise explanation." The chapter structure (Opening → Conceptual foundation → Code → Tables → Trace → Key points → Closing) is a reliable template. The "reader is capable" principle prevents condescension.
| **What was not useful** | The Systemlab-specific widgets (`ToggledViewer`, `TraceTimeline`) are irrelevant to a CLI scripting guide. I adapted the structural principles without the widget references.
| **Out of date / wrong** | Nothing wrong.
| **What would need updating** | Add a section on integrating textbook style with Glazed help entry frontmatter. The two systems have different structural requirements (Glazed needs operational sections at the end; textbook style needs conceptual sections at the start). |

---

## Resource 20: `/home/manuel/.pi/agent/skills/glazed-help-page-authoring/SKILL.md`

| Field | Value |
|-------|-------|
| **What I was researching** | The exact workflow for authoring Glazed help entries.
| **What I was looking for** | SectionType choices, frontmatter field names, and the Go integration pattern.
| **Why I chose it** | The user requested the how-to guide be "in the style of glazed help entries." This skill is the canonical reference.
| **How I found it** | Pinned skills were loaded at the start of the session.
| **What was useful** | The `SectionType` decision tree (`GeneralTopic`, `Example`, `Application`, `Tutorial`). The `Short`-field guidance ("One-sentence summary"). The Go integration pattern with `go:embed`, `LoadSectionsFromFS`, and `help_cmd.SetupCobraRootCommand`. TheDefinition of Done list.
| **What was not useful** | The Go integration instructions are for a full Glazed CLI, not for a generated xgoja binary. Integrating help docs into `rag-eval-js` requires modifying the generated Go code, which is beyond the scope of this ticket.
| **Out of date / wrong** | Nothing wrong, but the skill assumes the author is writing help for a `glaze`-style CLI. xgoja binaries use a different entrypoint generation path. The help system wiring would need to be added to `xgoja.yaml` or the generated template.
| **What would need updating** | Add an xgoja-specific subsection: "How to register help sources in an xgoja-generated binary." |

---

## Resource 21: `go-go-goja/ttmp/2026/01/10/BUN-005--split-bundle-demo-for-goja/analysis/01-split-bundle-demo-plan.md`

| Field | Value |
|-------|-------|
| **What I was researching** | The writing style used in go-go-goja ticket analysis documents.
| **What I was looking for** | Whether the project uses a specific docmgr template or markdown convention.
| **Why I chose it** | I was sampling existing documents in the `go-go-goja` repo to understand local conventions.
| **How I found it** | Listed in `find go-go-goja/ttmp -name "*.md"`.
| **What was useful** | Confirmed the docmgr frontmatter convention (`Ticket`, `Status`, `Topics`, `DocType`, `Intent`, `Owners`, `RelatedFiles`, `ExternalSources`, `Summary`, `LastUpdated`). Confirmed that `analysis` doc types use `## Goals`, `## Non-goals`, `## Planned changes` sections.
| **What was not useful** | The content is about Dagger pipelines and Bun bundling, which is irrelevant to the rag-eval scripting layer. I was looking for style, not substance.
| **Out of date / wrong** | The `LastUpdated` field is `2026-01-14T16:18:03-05:00`, which is old. The document may no longer reflect current priorities.
| **What would need updating** | Not relevant to this ticket, but the `BUN-005` ticket itself should be reviewed for staleness. |

---

## Resource 22: `go-go-goja/README.md`

| Field | Value |
|-------|-------|
| **What I was researching** | High-level overview of the go-go-goja project.
| **What I was looking for** | Whether the README mentions xgoja, jsverbs, or module authoring.
| **Why I chose it** | README files are the usual entry point for understanding a project.
| **How I found it** | Listed at the root of `go-go-goja/`.
| **What was useful** | Provides a conceptual overview of goja as a Go JS engine, but the xgoja and module sections are minimal.
| **What was not useful** | The README focuses on the REPL and module loading, not on the xgoja build system. It does not explain how to write a new module or how `xgoja.yaml` works.
| **Out of date / wrong** | Nothing wrong, but the README predates the `xgoja` command by several months based on git history.
| **What would need updating** | Add an "Authoring modules for xgoja" section to the README, or at least link to the xgoja help topics. |

---

## Resource 23: `goja-text/README.md`

| Field | Value |
|-------|-------|
| **What I was researching** | High-level overview of goja-text.
| **What I was looking for** | How the markdown, sanitize, and extract modules are organized.
| **Why I chose it** | Needed to understand whether goja-text is a standalone project or a plugin to go-go-goja.
| **How I found it** | Listed at the root of `goja-text/`.
| **What was useful** | Explained that goja-text is a Go library + xgoja provider package. Listed the three text modules. Mentioned the `xgoja.yaml` example.
| **What was not useful** | The README is short (~9 KB). It does not show actual JavaScript API usage examples. You have to read the API reference markdown files for that.
| **Out of date / wrong** | Nothing wrong.
| **What would need updating** | Add a "Quick Start" section with a runnable JS snippet for each module. |

---

## Synthesis

### Patterns that held up

1. **The `db` + `fs` + `express` + `goja-text` module set is solid.** Every module behaved as documented. The only surprise was `sanitize` returning null `Fixes` on clean input, which is easily defensed.
2. **The xgoja build pipeline is straightforward.** `xgoja build -f xgoja.yaml --output dist/rag-eval-js --xgoja-replace ../../../go-go-goja` works every time. Build times are fast (~5 seconds) because the workspace is small.
3. **Dynamic SQL with `?` placeholders is safe and idiomatic.** This pattern appears in both the Go `Queries` type and the JS verbs.

### Patterns that broke or surprised

1. **`sanitizeProbe` crashed on first try** because `yResult.Issues` was undefined. The API docs do not warn about this.
2. **Default HTTP port `8787` was occupied** by a prior process. The xgoja runtime does not auto-increment the port.
3. **`exportDocs` has no `--limit` flag** (I accidentally passed one during testing). The verb exports all matches, which is slow for large corpora.
4. **The `db` module has no transaction support.** Multi-statement updates are not atomic from JavaScript.

### What future researchers should skip

- Reading `go-go-goja/modules/fs/backend.go` or `backend_embed.go`. The JS API surface is fully described in `fs.go`.
- Reading `go-go-goja/modules/express/express_integration_test.go` unless you are changing the express implementation. The test file is large and the API surface is tiny.
- Reading the entire `glazed` tutorial unless you need the older API examples. The help entry *format* is the only relevant part.

### What future researchers should definitely read

1. `cmd/rag-eval/xgoja.yaml` — understand the module set before writing any JS.
2. `cmd/rag-eval/jsverbs/database.js` — the canonical verb pattern.
3. `goja-text/pkg/xgoja/providers/text/doc/*.md` — the authoritative API references for text modules.
4. `internal/db/db.go` — the schema truth.
5. `internal/db/queries.go` — the Go reference for query patterns.
6. `go-go-goja/modules/database/database.go` — understand connection lifecycle and argument flattening.
7. This logbook — to avoid the same pitfalls.
