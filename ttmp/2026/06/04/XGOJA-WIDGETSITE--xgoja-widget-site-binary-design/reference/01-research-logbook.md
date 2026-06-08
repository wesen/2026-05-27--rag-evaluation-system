---
Title: Research Logbook
Ticket: XGOJA-WIDGETSITE
Status: active
Topics:
    - goja
    - frontend
    - packaging
    - research
    - ui-dsl
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../go-go-goja/cmd/xgoja/doc/11-provider-runtime-config-and-host-services.md
      Note: Host-service contribution reference for database service design
    - Path: ttmp/2026/06/04/XGOJA-WIDGETSITE--xgoja-widget-site-binary-design/sources/xgoja-help-tutorial-generated-runtime-package.txt
      Note: Captured requested generated runtime package tutorial
    - Path: ttmp/2026/06/04/XGOJA-WIDGETSITE--xgoja-widget-site-binary-design/sources/xgoja-help-tutorial-http-serve-jsverbs.txt
      Note: Captured requested HTTP jsverbs tutorial
    - Path: ttmp/2026/06/04/XGOJA-WIDGETSITE--xgoja-widget-site-binary-design/sources/xgoja-help-tutorial-static-assets-http-server.txt
      Note: Captured requested embedded static assets tutorial
ExternalSources: []
Summary: Resource-by-resource research log for the xgoja WidgetRenderer site binary design.
LastUpdated: 2026-06-05T01:55:00-04:00
WhatFor: Use this to understand which xgoja, go-go-goja, and RAG WidgetRenderer resources shaped the XGOJA-WIDGETSITE design.
WhenToUse: Before implementing the provider, example, generated binary, database configuration, or embedded frontend smoke for XGOJA-WIDGETSITE.
---


# Research Logbook

## Goal

This logbook records every important resource read while designing an xgoja-generated WidgetRenderer site binary. Each entry states what was researched, why the resource was chosen, what was useful, what was not useful, what was out of date, and what would need updating.

## Resource 1: `xgoja help --all`

- **What I was researching:** The available xgoja documentation topics and tutorials.
- **What I was looking for:** Confirmation that xgoja exposes tutorials for HTTP jsverbs, embedded static assets, generated runtime packages, provider APIs, and buildspec syntax.
- **Why I chose it:** The user explicitly asked to read `xgoja help --all` and focus on specific tutorial pages.
- **How I found the resource:** Ran `xgoja help --all` and saved output to `sources/xgoja-help-all.txt`.
- **What I found useful:** It listed the relevant tutorial names and confirmed that `provider-runtime-config-and-host-services` is a first-class help topic.
- **What I didn't find useful:** It is an index only. It does not contain implementation details.
- **What is out of date / what was wrong:** No issue in the index itself.
- **What would need updating:** Keep the index in sync with example directories, especially the generated runtime package tutorial if its example remains absent.

## Resource 2: `xgoja help tutorial-http-serve-jsverbs`

- **What I was researching:** How to expose JavaScript verbs as long-lived HTTP site setup functions.
- **What I was looking for:** The generated command shape, required provider packages, `xgoja.yaml` fields, runtime lifetime semantics, and troubleshooting guidance.
- **Why I chose it:** The requested design requires a little webapp with a jsverb, and this tutorial is the direct source for the `serve sites demo` mode.
- **How I found the resource:** User specified the tutorial; captured with `xgoja help tutorial-http-serve-jsverbs`.
- **What I found useful:** The tutorial establishes that the selected verb registers Express routes and returns, while the HTTP provider's `serve` command keeps the runtime alive. It also shows `commandProviders` with package `go-go-goja-http`, name `serve`, and mount `serve`.
- **What I didn't find useful:** The tutorial uses a minimal hello-world route and does not discuss combining assets, db, and a custom provider.
- **What is out of date / what was wrong:** No direct mismatch found. The example `examples/xgoja/13-http-serve-jsverbs` exists and its smoke target passed.
- **What would need updating:** Add a combined example that includes `fs:assets`, `db`, and a custom provider module, because that is the actual design required here.

## Resource 3: `xgoja help tutorial-static-assets-http-server`

- **What I was researching:** How generated binaries embed and serve HTML, CSS, and JavaScript files.
- **What I was looking for:** The `assets` buildspec shape, `fs:assets` module config, and Express static serving API.
- **Why I chose it:** The generated WidgetRenderer site needs embedded frontend assets.
- **How I found the resource:** User specified the tutorial; captured with `xgoja help tutorial-static-assets-http-server`.
- **What I found useful:** The tutorial clearly explains `require("fs:assets")`, `app.staticFromAssetsModule("/static", assets, "/app/public")`, and the requirement that asset trees be pre-filtered because include/exclude are not implemented.
- **What I didn't find useful:** It does not describe single-page app fallback behavior for client-side routes.
- **What is out of date / what was wrong:** No direct mismatch found. The example `examples/xgoja/10-embedded-assets-fs` exists and its smoke target passed.
- **What would need updating:** Add a SPA fallback example or document that `staticFromAssetsModule` is static-prefix-only.

## Resource 4: `xgoja help tutorial-generated-runtime-package`

- **What I was researching:** Whether generated package mode could be used if a Go host application should own server lifecycle.
- **What I was looking for:** Target kind, generated API functions, and when to choose package mode instead of binary mode.
- **Why I chose it:** The user explicitly asked to read it and the design may require modifying host services or embedded asset providers.
- **How I found the resource:** User specified the tutorial; captured with `xgoja help tutorial-generated-runtime-package`.
- **What I found useful:** The tutorial explains `target.kind: package`, `NewBundle`, `Bundle.NewRuntime`, `RegisterProviders`, and `AttachDefaultCommands`.
- **What I didn't find useful:** It does not directly solve the requested jsverb webapp because package mode assumes an existing host application owns lifecycle.
- **What is out of date / what was wrong:** The tutorial references `examples/xgoja/14-generated-runtime-package`, but that directory was absent in the inspected checkout. Running `make -C examples/xgoja/14-generated-runtime-package smoke` failed with `No such file or directory`.
- **What would need updating:** Restore the example or update the help page to point to the current generated-package example location.

## Resource 5: `cmd/xgoja/doc/04-tutorial-providing-package-and-modules.md`

- **What I was researching:** How to expose RAG's `widget.dsl` through xgoja.
- **What I was looking for:** Provider package contract, module selection rules, local replacement guidance, and validation patterns.
- **Why I chose it:** The RAG `widget.dsl` module is not an xgoja provider yet. The implementation needs a provider wrapper.
- **How I found the resource:** Followed from xgoja help topics and searched the go-go-goja docs.
- **What I found useful:** The doc explains `providerapi.Module`, `NewModuleFactory`, top-level `modules`, and the crucial distinction between compiling a provider package and selecting a runtime module.
- **What I didn't find useful:** It is generic and does not include a `widget.dsl` example.
- **What is out of date / what was wrong:** No issue found.
- **What would need updating:** Add a short example for adapting an existing downstream native module such as RAG `widgetdsl.NewLoader()` into an xgoja provider.

## Resource 6: `cmd/xgoja/doc/06-buildspec-reference.md`

- **What I was researching:** Exact `xgoja.yaml` fields for packages, replaces, assets, modules, commands, command providers, and jsverb paths.
- **What I was looking for:** Path resolution rules and whether local provider replacements are already supported.
- **Why I chose it:** The ticket experiment needed a valid combined `xgoja.yaml`.
- **How I found the resource:** It is listed by `xgoja help --all` as `buildspec-reference`.
- **What I found useful:** It states that `packages[].replace`, embedded `jsverbs[].path`, help paths, and asset paths are resolved relative to the spec file directory. It also documents that asset include/exclude filters are intentionally unsupported.
- **What I didn't find useful:** It is a quick reference and does not explain generated Go module behavior in depth.
- **What is out of date / what was wrong:** No issue found.
- **What would need updating:** Add a combined provider/assets/http/db example to reduce guesswork.

## Resource 7: `cmd/xgoja/doc/11-provider-runtime-config-and-host-services.md`

- **What I was researching:** How a provider can contribute a preconfigured database service or other live Go resource.
- **What I was looking for:** The timing of public Glazed config, internal xgoja config, host-service contribution, and module setup.
- **Why I chose it:** The user specifically mentioned host services and embedded asset provider changes may be required.
- **How I found the resource:** Listed in `xgoja help --all`; read from the go-go-goja checkout.
- **What I found useful:** It explains `HostServiceContributionCapability`, `HostServiceSink`, `ModuleSetupContext.Host`, `AddCloser`, and the runtime construction sequence.
- **What I didn't find useful:** It does not include a database-specific worked example.
- **What is out of date / what was wrong:** No issue found.
- **What would need updating:** Add a concrete preconfigured SQLite database provider example, because the database module already supports `WithPreconfiguredDB` but the host provider does not yet expose a polished CLI/config path for it.

## Resource 8: `go-go-goja/pkg/xgoja/providers/http/serve.go`

- **What I was researching:** The implementation of provider-backed HTTP jsverb serving.
- **What I was looking for:** How the `serve` command creates runtimes, invokes verbs, initializes selected modules, and blocks for shutdown.
- **Why I chose it:** The design depends on the HTTP provider keeping the runtime alive after a setup verb returns.
- **How I found the resource:** Followed from the HTTP serve tutorial and file search.
- **What I found useful:** The code shows `newServeCommandSet`, `serveVerb`, `RuntimeFactory.NewRuntimeFromSections`, `registry.RequireLoader()`, `providerutil.InitRuntimeFromSections`, and signal-based shutdown.
- **What I didn't find useful:** It does not expose any route-level helper for WidgetRenderer pages; that belongs in JavaScript or a future provider.
- **What is out of date / what was wrong:** No issue found.
- **What would need updating:** No update required for the first implementation.

## Resource 9: `go-go-goja/pkg/xgoja/providers/http/http.go`

- **What I was researching:** Express module registration and HTTP server runtime settings.
- **What I was looking for:** How `require("express")` starts the server and how `--http-listen` is exposed.
- **Why I chose it:** The webapp depends on Express route registration and generated CLI HTTP flags.
- **How I found the resource:** Followed from the HTTP provider source.
- **What I found useful:** It shows the HTTP capability's Glazed section with prefix `http-`, default listen address, runtime initialization, server startup, and closer registration.
- **What I didn't find useful:** It does not include SPA fallback behavior.
- **What is out of date / what was wrong:** No issue found.
- **What would need updating:** Consider adding an Express helper for assets-backed SPA fallback.

## Resource 10: `go-go-goja/modules/express/express.go`

- **What I was researching:** The JavaScript Express-like API surface.
- **What I was looking for:** Supported methods and static asset serving APIs.
- **Why I chose it:** The jsverb must register routes and serve embedded assets.
- **How I found the resource:** Searched for `staticFromAssetsModule`.
- **What I found useful:** It supports `get`, `post`, `put`, `patch`, `delete`, `all`, `static`, and `staticFromAssetsModule`.
- **What I didn't find useful:** It does not show a direct `res.sendFile` or SPA fallback API in this file.
- **What is out of date / what was wrong:** No issue found.
- **What would need updating:** Add or document a helper for serving a single-page app from an embedded assets module.

## Resource 11: `go-go-goja/pkg/xgoja/providers/host/host.go`

- **What I was researching:** Host provider support for embedded fs and database modules.
- **What I was looking for:** Whether `fs:assets` and `db` can be configured from `xgoja.yaml` today.
- **Why I chose it:** The target binary needs both embedded assets and a db service.
- **How I found the resource:** Searched for `databaseModule`, `embeddedBackendFromConfig`, and host provider registration.
- **What I found useful:** It registers `fs`, `node:fs`, `exec`, `database`, and `db`; embedded fs requires `embedded.allow: true`; database supports `allowConfigure`.
- **What I didn't find useful:** It does not currently read a preconfigured DB host service from `ModuleSetupContext.Host`.
- **What is out of date / what was wrong:** No issue found.
- **What would need updating:** Add database host-service contribution or document the JavaScript `db.configure()` pattern as the intended first-demo path.

## Resource 12: `go-go-goja/modules/database/database.go`

- **What I was researching:** The database module's JavaScript API and Go configuration options.
- **What I was looking for:** `query`, `exec`, `configure`, `WithPreconfiguredDB`, and close behavior.
- **Why I chose it:** The target webapp needs a db service and may require host-service modifications.
- **How I found the resource:** Search results for `modules/database` and `WithPreconfiguredDB`.
- **What I found useful:** The module already supports `WithPreconfiguredDB`, `WithCloseFn`, and `WithConfigureEnabled`. Query returns rows as JavaScript objects, and exec returns rows-affected/last-insert metadata.
- **What I didn't find useful:** It does not enforce read-only policy itself; that must come from the DSN, wrapper, or provider config.
- **What is out of date / what was wrong:** No issue found.
- **What would need updating:** Add provider-level wiring for preconfigured DB service and read/write policy.

## Resource 13: `go-go-goja/pkg/xgoja/app/assets.go` and `host.go`

- **What I was researching:** How embedded asset trees become host services available to modules.
- **What I was looking for:** `AssetStore`, `ResolveAsset`, `HostServices`, and `NewHostWithOptions` behavior.
- **Why I chose it:** The embedded frontend path depends on generated assets being resolvable by `fs:assets`.
- **How I found the resource:** Followed from host provider embedded fs implementation.
- **What I found useful:** `AssetStore.ResolveAsset` returns an embedded filesystem and clean root for an asset id. `HostServices.AssetResolver` exposes that to provider modules.
- **What I didn't find useful:** No SPA fallback logic exists here; this layer only resolves embedded assets.
- **What is out of date / what was wrong:** No issue found.
- **What would need updating:** No update needed for static serving. SPA fallback belongs in Express or a widget-site helper.

## Resource 14: `go-go-goja/cmd/xgoja/internal/generate/gomod.go`

- **What I was researching:** Why the ticket-local provider build failed and how xgoja handles local replacements.
- **What I was looking for:** Generated `go.mod` require/replace rules and provider module path extraction.
- **Why I chose it:** The experiment failed during `go mod tidy`, so generated module semantics were central.
- **How I found the resource:** Searched for `XGojaReplace`, `go.mod`, and `replace`.
- **What I found useful:** The generator supports `--xgoja-replace` for go-go-goja and `packages[].replace` for provider modules. It trims imports at `/pkg/`, `/cmd/`, or `/internal/` to infer module roots.
- **What I didn't find useful:** Nothing; this file explained the failure clearly.
- **What is out of date / what was wrong:** The design implication is that ticket-local provider import paths are poor candidates because they do not map cleanly to module roots.
- **What would need updating:** No generator change is required if the provider lives under `pkg/...`; otherwise more flexible replace support would be needed.

## Resource 15: `go-go-goja/examples/xgoja/10-embedded-assets-fs`

- **What I was researching:** A working embedded asset server example.
- **What I was looking for:** Correct YAML and route script shape.
- **Why I chose it:** It is the runnable example named by the static assets tutorial.
- **How I found the resource:** Tutorial reference and repository search.
- **What I found useful:** `xgoja.yaml` shows `assets`, `fs:assets`, `fs:host`, and `express`. The script shows `staticFromAssetsModule` and reading embedded config JSON.
- **What I didn't find useful:** It does not include jsverbs or Widget IR.
- **What is out of date / what was wrong:** No issue found. Smoke target passed.
- **What would need updating:** Add SPA fallback or combine with jsverbs in a future example.

## Resource 16: `go-go-goja/examples/xgoja/13-http-serve-jsverbs`

- **What I was researching:** A working HTTP jsverb serve example.
- **What I was looking for:** Correct YAML, Makefile smoke pattern, and verb metadata shape.
- **Why I chose it:** It is the runnable example named by the HTTP serve tutorial.
- **How I found the resource:** Tutorial reference and repository search.
- **What I found useful:** The Makefile shows a good smoke pattern: build, start the generated binary, poll health with curl, assert response, kill process.
- **What I didn't find useful:** It does not combine assets or db.
- **What is out of date / what was wrong:** No issue found. Smoke target passed.
- **What would need updating:** Add a combined `14` or `15` example for assets + db + custom provider.

## Resource 17: `pkg/widgetdsl/module.go`

- **What I was researching:** Whether RAG `widget.dsl` can be wrapped as an xgoja provider module.
- **What I was looking for:** Public loader function and module behavior.
- **Why I chose it:** The xgoja binary needs `require("widget.dsl")`.
- **How I found the resource:** Existing WIDGETSITE implementation in the RAG repo.
- **What I found useful:** `widgetdsl.NewLoader()` returns a `require.ModuleLoader`, which is exactly what `providerapi.Module.NewModuleFactory` needs to return.
- **What I didn't find useful:** It is not currently an xgoja provider package.
- **What is out of date / what was wrong:** No issue found.
- **What would need updating:** Add `pkg/xgoja/providers/widgetsite` to expose the loader through xgoja.

## Resource 18: `packages/rag-evaluation-site`

- **What I was researching:** The frontend asset candidate for the generated xgoja binary.
- **What I was looking for:** Default app build output and API expectations.
- **Why I chose it:** The generated binary should eventually serve the WidgetRenderer app, not just print JSON.
- **How I found the resource:** Current RAG WidgetRenderer packaging work.
- **What I found useful:** The package builds `app-dist`, and the default app expects `/api/widget/pages/{id}` and `/api/widget/actions/{name}`.
- **What I didn't find useful:** The current app is already integrated with `pkg/defaultspa`, not xgoja Express. xgoja needs its own asset sync or example directory.
- **What is out of date / what was wrong:** No issue found.
- **What would need updating:** Add an xgoja example sync step that copies `app-dist` into an xgoja `assets/public` directory.

## Resource 19: Ticket-local experiment `scripts/01-current-xgoja-widgetsite-experiment`

- **What I was researching:** Whether a combined spec with assets, express, db, and widget.dsl can validate today.
- **What I was looking for:** Current xgoja friction points before writing the design guide.
- **Why I chose it:** The user asked for hard thinking and allowed ticket-local scripts/experiments.
- **How I found the resource:** Created inside this ticket's `scripts/` directory.
- **What I found useful:** `xgoja doctor` and `xgoja list-modules` passed. The combined module set is valid in principle.
- **What I didn't find useful:** A ticket-local provider is not a buildable long-term provider location.
- **What is out of date / what was wrong:** The experiment intentionally demonstrates a failure: generated builds could not resolve the provider import path when the provider lived under `ttmp/.../scripts`.
- **What would need updating:** Move the provider to `pkg/xgoja/providers/widgetsite` and use `packages[].replace` during local builds.
