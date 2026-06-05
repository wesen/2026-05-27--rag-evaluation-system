---
Title: Research Logbook
Ticket: WIDGETSITE-PACKAGING
Status: active
Topics:
    - ui-dsl
    - goja
    - frontend
    - packaging
    - research
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../../../../code/wesen/go-go-golems/go-go-parc/Projects/2026/06/01/ARTICLE - Trusted npm Publishing for Go Go Golems React Packages.md
      Note: Source for tokenless npm publishing
    - Path: ../../../../../../../2026-05-03--goja-hosting-site/cmd/goja-site/serve.go
      Note: CLI serve command model for trusted JavaScript site hosting
    - Path: ../../../../../../../2026-05-03--goja-hosting-site/go.mod
      Note: goja-site dependency version evidence for go-go-goja API mismatch
    - Path: ../../../../../../../go-go-goja/modules/express/express.go
      Note: Optional Express-style route registration reference
    - Path: ../../../../../../../go-go-goja/modules/uidsl/module.go
      Note: HTML ui.dsl pattern used as contrast for Widget IR boundary
    - Path: ../../../../../../../go-go-goja/pkg/gojahttp/host.go
      Note: goja HTTP dispatch model and old HTML result rendering behavior
    - Path: internal/api/dsl_handlers.go
      Note: Concrete static Widget IR API response used as package API seed
    - Path: web/src/components/pages/DslPreviewPage/DslPreviewPage.tsx
      Note: Minimal fetch-and-render page to generalize into default app
ExternalSources: []
Summary: Resource-by-resource research notes for WidgetRenderer packaging, including usefulness, stale areas, and update needs.
LastUpdated: 2026-06-04T23:46:00-04:00
WhatFor: Use this to track which source files and docs shaped the WidgetRenderer packaging design and what needs refreshing later.
WhenToUse: When resuming the packaging work, updating the design guide, or checking whether a source is stale before implementation.
---



# Research Logbook

## Goal

This logbook records every document, source file, and local resource consulted while designing how to package the WidgetRenderer as a standalone Go-served app plus reusable npm renderer package. It is intentionally practical: each entry explains why the resource was read, what was useful, what was not useful, what appears stale or wrong, and what should be updated.

## Context

The research question was:

> How should we package a WidgetRenderer system so a default React site can be embedded in a Go binary, while users can also provide their own React app using our renderer as an npm package?

The initial investigation used local resources under `/home/manuel/workspaces/2026-05-27/rag-evaluation-system` plus local skill references. A later continuation also read Manuel's Obsidian article on trusted npm publishing at `/home/manuel/code/wesen/go-go-golems/go-go-parc/Projects/2026/06/01/ARTICLE - Trusted npm Publishing for Go Go Golems React Packages.md` to update the npm package/release plan.

## Quick Reference Summary

| Resource | Usefulness | Staleness risk | Update needed |
|---|---:|---:|---|
| RAG `web/src/widgets/ir.ts` | High | Medium | Extract to npm package and keep schema in sync with Go validator. |
| RAG `WidgetRenderer.tsx` | High | Medium | Add registry override API and remove app-specific assumptions. |
| RAG `pkg/widgetdsl/module.go` and `registrar.go` | High | Medium | Public package and registrar now exist; add validation and schema fixtures. |
| RAG `internal/web/spa.go` | High | Low | Generalize into reusable default SPA package. |
| RAG `web/vite.config.ts` | High | Low | Adapt build output and dev proxy names. |
| goja-site `pkg/app/server.go` | High | Medium | Copy lifecycle pattern, not server-side HTML rendering. |
| go-go-goja `engine/*` | High | Medium | Target current `RuntimeModuleSpec` interface; check version before implementation. |
| go-go-goja `uidsl` | Medium | Medium | Use as contrast only; do not copy HTML rendering boundary. |
| go-go-goja `express`/`gojahttp` | Medium | Medium | Optional advanced routing; page-runner should come first. |
| skill docs | Medium | Low | Keep docmgr/reMarkable workflow current. |

## Resource Entries

### 1. Ticket research writing-style reference

- **Resource:** `/home/manuel/.pi/agent/skills/ticket-research-docmgr-remarkable/references/writing-style.md`
- **What I was researching:** How to structure the design document requested by the user.
- **What I was looking for in this document:** Required tone, section ordering, evidence rules, and decision record format.
- **Why I chose it:** The active skill says to load it when writing long-form ticket research/design deliverables.
- **How I found the resource:** It was referenced by the pinned `ticket-research-docmgr-remarkable` skill.
- **What I found useful:** The recommended design-doc order: executive summary, problem statement, current-state analysis, gap analysis, proposed architecture, decisions, pseudocode, phases, tests, risks, and references.
- **What I didn't find useful:** It does not contain domain-specific guidance for Goja, React packaging, npm exports, or embedded SPAs.
- **What is out of date / what was wrong:** Nothing observed.
- **What would need updating:** Add a short packaging-specific checklist if this skill is used often for Go+npm monorepo designs.

### 2. Ticket research deliverable checklist

- **Resource:** `/home/manuel/.pi/agent/skills/ticket-research-docmgr-remarkable/references/deliverable-checklist.md`
- **What I was researching:** Required completion steps for a docmgr + reMarkable deliverable.
- **What I was looking for in this document:** Validation and upload checklist.
- **Why I chose it:** The user explicitly asked to store documents in a ticket and upload to reMarkable.
- **How I found the resource:** It was referenced by the pinned `ticket-research-docmgr-remarkable` skill.
- **What I found useful:** It requires ticket setup, evidence-backed analysis, file relations, `docmgr doctor`, dry-run upload, real upload, and verification listing.
- **What I didn't find useful:** It does not prescribe how to handle already-running local services or packaging-specific release tasks.
- **What is out of date / what was wrong:** Nothing observed.
- **What would need updating:** Consider adding a note that user instructions can override default upload behavior; in this case the user explicitly requested upload.

### 3. Diary workflow reference

- **Resource:** `/home/manuel/.pi/agent/skills/diary/references/diary.md`
- **What I was researching:** How to keep the implementation diary while producing research docs.
- **What I was looking for in this document:** Required diary structure and what to capture in failures/learning/future work.
- **Why I chose it:** The user explicitly said, “Keep a diary as you work.”
- **How I found the resource:** The pinned `diary` skill references it.
- **What I found useful:** The prose-first step structure and emphasis on exact commands/failures.
- **What I didn't find useful:** It is mostly implementation-oriented; research-only steps require interpretation.
- **What is out of date / what was wrong:** Nothing observed.
- **What would need updating:** Add an explicit research diary example that includes doc creation and upload steps.

### 4. RAG embedded SPA handler

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/web/spa.go`
- **What I was researching:** How the current Go binary embeds and serves the React frontend.
- **What I was looking for in this document:** `go:embed` shape, `fs.Sub`, file server, and SPA fallback behavior.
- **Why I chose it:** The user asked how to bundle/package the React site inside a Go package.
- **How I found the resource:** It was already part of the current RAG app and had been inspected during earlier implementation work.
- **What I found useful:** `//go:embed all:dist` at lines 9-10 and `SPAHandler` fallback at lines 14-37 are a concise production packaging model.
- **What I didn't find useful:** It has no disk fallback, dev proxy, or configurable frontend modes.
- **What is out of date / what was wrong:** Nothing wrong for the RAG app. It is too app-specific for a public package because it assumes `dist` exists inside `internal/web`.
- **What would need updating:** Generalize into `pkg/defaultspa` and add frontend mode selection in `pkg/widgetserver`.

### 5. RAG Vite config

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/vite.config.ts`
- **What I was researching:** How frontend dev proxying and production build output are configured.
- **What I was looking for in this document:** API proxy path, backend port environment variable, and output directory.
- **Why I chose it:** It proves how the bundled frontend currently becomes Go-embeddable assets.
- **How I found the resource:** It was referenced in previous DSL preview smoke work and is the Vite config for the RAG web app.
- **What I found useful:** `/api` proxy to `RAG_EVAL_BACKEND_PORT` at lines 9-16 and output to `../internal/web/dist` at lines 18-22.
- **What I didn't find useful:** It is tuned to RAG naming and one backend port. It does not describe library-mode builds for npm.
- **What is out of date / what was wrong:** Nothing observed.
- **What would need updating:** For packaging, add one package build for `@go-go-golems/rag-evaluation-site` that emits both a compiled npm `dist/` artifact and a default app `app-dist/` artifact for Go embedding.

### 6. RAG Widget IR schema

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/widgets/ir.ts`
- **What I was researching:** The data contract between Goja/Go and React.
- **What I was looking for in this document:** JSON value definitions, node shapes, component prop contracts, action specs, and table cell specs.
- **Why I chose it:** This is the core artifact the new npm package must export.
- **How I found the resource:** It was created in the current RAG UI DSL work and imported by the renderer and API types.
- **What I found useful:** `JsonValue` and `WidgetNode` definitions at lines 5-21; `ComponentNode` at lines 41-46; `ActionSpec` at lines 50-78; `DataTableWidgetProps` and `CellSpec` at lines 123-195.
- **What I didn't find useful:** It is TypeScript-only and has no generated JSON Schema or Go validator equivalent.
- **What is out of date / what was wrong:** It is current for the RAG prototype but incomplete for public packaging because it lacks schema versioning and extension registry types.
- **What would need updating:** Add `schemaVersion`, package-level docs, generated JSON Schema, and custom widget extension typing.

### 7. RAG WidgetRenderer

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/widgets/WidgetRenderer.tsx`
- **What I was researching:** How Widget IR becomes real React components.
- **What I was looking for in this document:** Renderer dispatch, supported widgets, action binding, and places where app-specific assumptions leak in.
- **Why I chose it:** It is the main artifact to publish as an npm package.
- **How I found the resource:** It is the renderer used by `DslPreviewPage`.
- **What I found useful:** Node dispatch at lines 41-45; component registry switch at lines 61-97; `DataTable` bridging at lines 155-173; `TabList` action handling at lines 253-264.
- **What I didn't find useful:** It uses a hard-coded switch and does not yet expose a user registry override API.
- **What is out of date / what was wrong:** The `SelectInput` render path passes `value` without `onChange` at lines 229-240, which produced a React controlled-input warning during browser smoke.
- **What would need updating:** Add a registry API, fix static select rendering with `defaultValue` or action-backed `onChange`, and make the server action URL configurable instead of RAG-specific.

### 8. RAG cell renderers

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/widgets/cellRenderers.tsx`
- **What I was researching:** How serialized table cells are rendered without function-valued JSON props.
- **What I was looking for in this document:** `CellSpec.kind` behavior and row path/template interpolation.
- **Why I chose it:** Data tables are the most important non-trivial serialized component.
- **How I found the resource:** It is imported by `WidgetRenderer.tsx`.
- **What I found useful:** `renderCell` switch at lines 8-31 and template interpolation at lines 68-72.
- **What I didn't find useful:** No custom cell renderer extension point yet.
- **What is out of date / what was wrong:** Current behavior is fine for the prototype but not extensible enough for package users.
- **What would need updating:** Add custom cell kind registry or let users override `DataTable` rendering through the widget registry.

### 9. RAG action dispatcher

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/widgets/actions.ts`
- **What I was researching:** How actions are represented and dispatched from rendered widgets.
- **What I was looking for in this document:** Navigate, event, copy, and server action behavior.
- **Why I chose it:** The npm renderer package needs a configurable action dispatch mechanism.
- **How I found the resource:** It is imported by `WidgetRenderer.tsx`.
- **What I found useful:** `WidgetActionHandler` type at lines 3-11 and default action behavior at lines 13-46.
- **What I didn't find useful:** The server action endpoint is hard-coded as `/api/v1/dsl/actions/{name}` at lines 39-44.
- **What is out of date / what was wrong:** The endpoint is RAG-specific and should not be part of a generic package default.
- **What would need updating:** Accept a configurable `apiPrefix`, require `onAction` for server actions, or export a helper that takes an endpoint base.

### 10. RAG DSL preview page

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/components/pages/DslPreviewPage/DslPreviewPage.tsx`
- **What I was researching:** Minimal app integration for fetching and rendering a Widget IR page.
- **What I was looking for in this document:** Fetch state handling and renderer invocation.
- **Why I chose it:** The default app can be a generalized version of this file.
- **How I found the resource:** It is the active preview page wired into the RAG app.
- **What I found useful:** Fetch with `useGetDslPageQuery` at line 13, states at lines 15-25, and `<WidgetRenderer node={data.root} />` at line 29.
- **What I didn't find useful:** It depends on the RAG service layer and CSS module path.
- **What is out of date / what was wrong:** Not wrong, but app-specific.
- **What would need updating:** Replace RTK Query with a package-level `useWidgetPage` hook using `fetch`, and expose the default app through the same `@go-go-golems/rag-evaluation-site` package.

### 11. RAG API service

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/web/src/services/api.ts`
- **What I was researching:** Current frontend API shape for DSL pages.
- **What I was looking for in this document:** Response type and endpoint path.
- **Why I chose it:** The package needs a stable API contract for user apps.
- **How I found the resource:** It is imported by `DslPreviewPage`.
- **What I found useful:** `DslPageResponse` at lines 4-8 and `getDslPage` endpoint at lines 301-307.
- **What I didn't find useful:** The file is large and RAG-specific; most endpoints are unrelated.
- **What is out of date / what was wrong:** Not wrong, but the endpoint path `dsl/pages` lacks package-level namespacing.
- **What would need updating:** Generic server should use `/api/widget/pages/{id}` or configurable API prefix.

### 12. RAG static DSL endpoint

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/api/dsl_handlers.go`
- **What I was researching:** Concrete backend JSON payload that the renderer can display.
- **What I was looking for in this document:** Page response structure, nested component IR, and DataTable cell examples.
- **Why I chose it:** It is the working vertical slice from Go JSON to React rendering.
- **How I found the resource:** It was added during the RAG UI DSL implementation.
- **What I found useful:** `id/title/root` response at lines 12-17; `AppShell` root at lines 15-18; table rows and cell specs at lines 65-81.
- **What I didn't find useful:** It is hardcoded and not backed by Goja scripts.
- **What is out of date / what was wrong:** It says purpose is “Validate IR without Goja” at line 42; that is accurate for the prototype but not the final server.
- **What would need updating:** Replace with runner-backed endpoint and add validation before response.

### 13. RAG DSL API tests

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/internal/api/dsl_handlers_test.go`
- **What I was researching:** Existing test expectations for the Widget IR page endpoint.
- **What I was looking for in this document:** Smoke-test scope and route behavior.
- **Why I chose it:** The package should preserve equivalent API contract tests.
- **How I found the resource:** It was created during the current implementation session.
- **What I found useful:** Positive endpoint test at lines 14-40, unknown-page 404 at lines 42-51, and direct path-value route test at lines 69-81.
- **What I didn't find useful:** It does not deeply validate nested table/cell schema.
- **What is out of date / what was wrong:** Nothing observed.
- **What would need updating:** Add schema validation and script-runner tests later.

### 14. RAG `widget.dsl` public package

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetdsl/module.go` and `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/pkg/widgetdsl/registrar.go`
- **What I was researching:** How Goja scripts can emit Widget IR maps and how the module can be registered with a go-go-goja engine runtime.
- **What I was looking for in this document:** Native module loader, helper names, child normalization, cell helpers, alias registration, and runtime registrar shape.
- **Why I chose it:** It is the seed public Go package for standalone WidgetRenderer servers.
- **How I found the resource:** It began as the RAG UI DSL prototype and was then moved into `pkg/widgetdsl` during this implementation slice.
- **What I found useful:** `ModuleName` at line 13, helper list at lines 15-32, direct registry aliases at lines 62-69, default registry init at lines 94-96, exports at lines 102-145, child normalization at lines 212-248, and the new registrar implementing `engine.RuntimeModuleSpec`.
- **What I didn't find useful:** Validation remains minimal and there is not yet a JSON Schema or generated TypeScript declaration bridge.
- **What is out of date / what was wrong:** Earlier notes that the module lived under `internal/` are now outdated; the module is now under `pkg/widgetdsl`.
- **What would need updating:** Add validation, TypeScript declaration support if needed, schema fixtures, and tests for malformed Widget IR.

### 15. goja-site serve command

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-03--goja-hosting-site/cmd/goja-site/serve.go`
- **What I was researching:** CLI shape for a trusted JavaScript website server.
- **What I was looking for in this document:** Flags, defaults, script-dir handling, dev mode, and server startup.
- **Why I chose it:** The new binary can reuse this CLI mental model.
- **How I found the resource:** It is the goja hosting site command implementation.
- **What I found useful:** Settings struct at lines 21-35, command docs at lines 38-51, flags at lines 52-67, default scripts at lines 83-85, and `app.NewServer` invocation at lines 108-119.
- **What I didn't find useful:** Database policy flags are less relevant for a generic WidgetRenderer server unless scripts need DB access.
- **What is out of date / what was wrong:** Nothing directly wrong; it targets goja-site’s HTML route model.
- **What would need updating:** Add frontend mode flags: `--frontend`, `--frontend-dir`, `--frontend-proxy`, `--api-only`, and `--api-prefix`.

### 16. goja-site app server

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-03--goja-hosting-site/pkg/app/server.go`
- **What I was researching:** Runtime ownership and script loading pattern.
- **What I was looking for in this document:** Goja runtime creation, host setup, module registration, script loading, shutdown.
- **Why I chose it:** It is the closest existing implementation of a Goja-backed HTTP server in this workspace.
- **How I found the resource:** It is imported by the goja-site serve command.
- **What I found useful:** Server fields at lines 23-30; `gojahttp.Host` creation at line 58; runtime factory construction at lines 71-75; runtime creation at lines 81-85; script execution via `runtime.Owner.Call` at lines 153-172.
- **What I didn't find useful:** It uses `uidsl.RenderAny` at line 58, which is the old HTML rendering model.
- **What is out of date / what was wrong:** It appears tied to go-go-goja v0.4.16 from goja-site `go.mod`, while the local checked-out go-go-goja has a different current module interface. Copying registrar code directly may fail.
- **What would need updating:** Adapt to the current `engine.RuntimeModuleSpec` interface when implementing the new package.

### 17. goja-site go.mod

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-03--goja-hosting-site/go.mod`
- **What I was researching:** Which go-go-goja version goja-site currently targets.
- **What I was looking for in this document:** Module name, Go version, and go-go-goja dependency version.
- **Why I chose it:** It explains why goja-site code can differ from the local go-go-goja checkout.
- **How I found the resource:** It is the module file for goja-site.
- **What I found useful:** Module path at line 1, Go/toolchain at lines 3-5, and `github.com/go-go-golems/go-go-goja v0.4.16` at line 11.
- **What I didn't find useful:** Most indirect dependencies are irrelevant to packaging design.
- **What is out of date / what was wrong:** Potentially stale relative to the local go-go-goja checkout used for design references.
- **What would need updating:** Decide whether the new package depends on v0.4.16 or a newer go-go-goja; then update code examples accordingly.

### 18. goja-site kanban example script

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-03--goja-hosting-site/examples/kanban/scripts/app.js`
- **What I was researching:** How an existing hosted script uses modules, data, UI DSL, and routes.
- **What I was looking for in this document:** Script style and user-facing ergonomics.
- **Why I chose it:** The WidgetRenderer page scripts should feel similarly approachable.
- **How I found the resource:** It was part of the goja hosting site examples and had been read during earlier context gathering.
- **What I found useful:** `require("database")`, `require("express")`, `require("ui.dsl")`, and `require("kanban.dsl")` at lines 1-4; `express.app()` at line 6; fluent builder usage at lines 209-265; route registration at lines 294-324.
- **What I didn't find useful:** It contains a lot of application-specific CSS and database code.
- **What is out of date / what was wrong:** The example is HTML/UI DSL based. It should not be copied as a WidgetRenderer page API.
- **What would need updating:** Create a new WidgetRenderer example that uses `require("widget.dsl")` and `exports.pages.demo = ...` rather than `app.get` returning HTML.

### 19. goja-site local built-in UI verb example

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-03--goja-hosting-site/examples/verbs/builtin/ui.js`
- **What I was researching:** Minimal `ui.dsl` usage outside the server app.
- **What I was looking for in this document:** Small example of requiring and rendering a DSL module.
- **Why I chose it:** It helps compare old `ui.dsl.render(...)` with the new Widget IR model.
- **How I found the resource:** It was referenced by an earlier search for `require("ui.dsl")`.
- **What I found useful:** `const ui = require("ui.dsl")` and `ui.render(ui.table.fromRows(...))` at lines 7-12.
- **What I didn't find useful:** It renders HTML text, which is not the desired WidgetRenderer boundary.
- **What is out of date / what was wrong:** Not wrong for ui.dsl, but not applicable to WidgetRenderer packaging.
- **What would need updating:** Add a similar smoke verb for `widget.dsl` that emits JSON and validates it.

### 20. go-go-goja NativeModule registry

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/common.go`
- **What I was researching:** Native module contract and default registry behavior.
- **What I was looking for in this document:** `NativeModule` methods, default registry, and registration mechanism.
- **Why I chose it:** The RAG `widget.dsl` prototype implements this interface.
- **How I found the resource:** It was identified while inspecting go-go-goja module patterns.
- **What I found useful:** `NativeModule` interface at lines 28-32 and default registry registration at lines 92-108.
- **What I didn't find useful:** It does not cover runtime-aware module specs or aliases.
- **What is out of date / what was wrong:** Not wrong, but default registry modules are less explicit than `engine.RuntimeModuleSpec` for package servers.
- **What would need updating:** For `widget.dsl`, provide both a native loader and a runtime module registrar.

### 21. go-go-goja runtime module interface

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/engine/runtime_modules.go`
- **What I was researching:** Current runtime-aware module registration API.
- **What I was looking for in this document:** Interface shape and runtime context fields.
- **Why I chose it:** The new `pkg/widgetdsl.NewRegistrar()` should implement this API.
- **How I found the resource:** It was under the local go-go-goja `engine` package.
- **What I found useful:** `RuntimeModuleSpec` at lines 12-20 and `RuntimeModuleContext` at lines 22-30.
- **What I didn't find useful:** It has no example implementation in the same file.
- **What is out of date / what was wrong:** Nothing observed in the local checkout.
- **What would need updating:** Cross-check against the exact go-go-goja module version selected for the new package.

### 22. go-go-goja factory

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/engine/factory.go`
- **What I was researching:** Runtime factory lifecycle and module selection.
- **What I was looking for in this document:** `WithModules`, `UseModuleMiddleware`, `Build`, `NewRuntime`.
- **Why I chose it:** The standalone server must build a Goja runtime correctly.
- **How I found the resource:** It is the factory implementation in the local go-go-goja checkout.
- **What I found useful:** `WithModules` at lines 77-82, module middleware at lines 84-97, build freezing at lines 122-178, and runtime setup at lines 181-256.
- **What I didn't find useful:** It does not decide which modules are safe for this app; that is a server design decision.
- **What is out of date / what was wrong:** It differs from goja-site’s current dependency API; see entries 16 and 17.
- **What would need updating:** Document the selected go-go-goja version in the implementation repository.

### 23. go-go-goja `ui.dsl`

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/uidsl/module.go`
- **What I was researching:** Existing DSL registrar and loader pattern.
- **What I was looking for in this document:** How aliases are registered and how helpers are exported.
- **Why I chose it:** It is the closest module to the desired `widget.dsl` shape.
- **How I found the resource:** It was known from goja-site imports and prior context.
- **What I found useful:** Registrar at lines 11-19 and loader exports at lines 24-70.
- **What I didn't find useful:** The node normalization and HTML rendering path is not the desired architecture.
- **What is out of date / what was wrong:** Not wrong, but it represents a different rendering model.
- **What would need updating:** Use it as a pattern for alias registration, not as a rendering target.

### 24. go-go-goja Express module

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/modules/express/express.go`
- **What I was researching:** Optional route registration model from JavaScript.
- **What I was looking for in this document:** How `express.app()` exposes route methods and static mounts.
- **Why I chose it:** The user asked in relation to goja hosting site, which uses Express-style routes.
- **How I found the resource:** It is imported by goja-site `pkg/app/server.go`.
- **What I found useful:** Registrar at lines 19-55, loader at lines 57-67, and app methods/static mount setup at lines 94-125.
- **What I didn't find useful:** Express-style arbitrary routes are more complex than needed for first WidgetRenderer page packaging.
- **What is out of date / what was wrong:** Nothing observed.
- **What would need updating:** Keep as optional advanced mode after the page-runner API is stable.

### 25. go-go-goja HTTP host

- **Resource:** `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/go-go-goja/pkg/gojahttp/host.go`
- **What I was researching:** How goja-site dispatches HTTP requests into JavaScript handlers.
- **What I was looking for in this document:** Request routing, static mounts, runtime owner calls, and response rendering.
- **Why I chose it:** It explains the old server-side routing model.
- **How I found the resource:** It is used by the Express module and goja-site server.
- **What I found useful:** Static mount handling at lines 51-57, route matching at lines 62-72, runtime owner dispatch at lines 83-93, and result rendering at lines 108-118.
- **What I didn't find useful:** It renders non-string JS results as HTML through a renderer, which does not fit the JSON Widget IR API.
- **What is out of date / what was wrong:** Not wrong for gojahttp; just not the core model for the WidgetRenderer server.
- **What would need updating:** If reused, configure it only for optional custom routes or static assets, not core page rendering.

### 26. Trusted npm publishing article

- **Resource:** `/home/manuel/code/wesen/go-go-golems/go-go-parc/Projects/2026/06/01/ARTICLE - Trusted npm Publishing for Go Go Golems React Packages.md`
- **What I was researching:** How Go Go Golems React packages should be prepared and published to npm using tokenless trusted publishing.
- **What I was looking for in this document:** Package artifact rules, npm Trusted Publishing workflow requirements, bootstrap sequence for new packages, pack smoke/consumer smoke validation, and security lockdown steps.
- **Why I chose it:** The user explicitly asked to update the packaging plan based on this article and specified the final package name `@go-go-golems/rag-evaluation-site`.
- **How I found the resource:** The user provided the exact absolute Obsidian vault path in the prompt.
- **What I found useful:** The article establishes that public React packages should publish compiled `dist/` artifacts rather than TypeScript source, avoid `workspace:*` dependency leakage, export self-contained CSS, validate with clean consumer smoke tests, and use GitHub Actions OIDC/npm Trusted Publishing with `permissions.id-token: write` and npm `>=11.10.0`.
- **What I didn't find useful:** The provider/overlay split in the article is not directly applicable because the user explicitly chose a single package for this project. The article's package names and repository names are examples, not values to copy.
- **What is out of date / what was wrong:** Nothing appeared wrong. The old two-package plan in this ticket became out of date after reading this article and the user's naming decision.
- **What would need updating:** The implementation plan should create one package, `packages/rag-evaluation-site`, published as `@go-go-golems/rag-evaluation-site`, with root renderer exports, `./ir`, `./app`, `./styles.css`, and `./theme.css` subpath exports. CI should include pack smoke, clean consumer smoke, trusted publishing, and eventual package token lockdown.

## Usage Examples

When resuming implementation, use this logbook to decide what to read first:

1. For renderer extraction, read entries 6-10.
2. For Go module extraction, read entries 14, 20-23.
3. For server/runtime design, read entries 15-17 and 21-25.
4. For packaging/build design, read entries 4-5 and the design document’s build section.

## Related

- Design guide: `design-doc/01-widgetrenderer-packaging-architecture-and-implementation-guide.md`
- Diary: `reference/02-diary.md`
