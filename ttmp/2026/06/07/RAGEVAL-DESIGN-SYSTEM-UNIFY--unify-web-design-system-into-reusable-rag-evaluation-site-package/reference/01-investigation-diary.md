---
Title: Investigation Diary
Ticket: RAGEVAL-DESIGN-SYSTEM-UNIFY
Status: active
Topics:
    - design-system
    - frontend-architecture
    - react
    - packaging
    - storybook
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/06/07/RAGEVAL-DESIGN-SYSTEM-UNIFY--unify-web-design-system-into-reusable-rag-evaluation-site-package/scripts/01_capture_css_visual_diff_help.sh
      Note: Step 1 css-visual-diff help capture
    - Path: ttmp/2026/06/07/RAGEVAL-DESIGN-SYSTEM-UNIFY--unify-web-design-system-into-reusable-rag-evaluation-site-package/scripts/02_component_duplication_inventory.py
      Note: Step 1 duplication inventory script
ExternalSources: []
Summary: Chronological diary for unifying duplicated web/src design-system components into packages/rag-evaluation-site with Storybook and css-visual-diff visual parity checks.
LastUpdated: 2026-06-07T00:00:00Z
WhatFor: Use to resume or review the design-system unification work.
WhenToUse: Before changing frontend package boundaries or deleting duplicated files.
---


# Diary

## Goal

Capture the design-system unification work: evidence, scripts, failures, commits, visual parity checks, and migration steps from duplicated `web/src` components toward package-canonical imports from `packages/rag-evaluation-site`.

## Step 1: Ticket Setup, css-visual-diff Help Capture, and Duplication Inventory

I created a dedicated docmgr ticket for making `packages/rag-evaluation-site` the canonical home of the reusable RAG design system and Widget IR renderer. Before changing code, I captured `css-visual-diff` help pages into the ticket and generated a machine-readable duplication inventory between `web/src` and the package.

The inventory confirms the unification premise: the package is already a copied-out subset of the `web/` design system. Most shared primitive/layout/molecule files are byte-for-byte identical, so the safest migration is to make `web` depend on the local package and redirect imports before deleting duplicated files.

### Prompt Context

**User prompt (verbatim):** "ok, create a new ticket to do the unification / move the design system . Create a detailed analysis and guide, and a list of detailed granular tasks , then work on them one by one, keeping a diary as you go, usig css-visual-diff to compare for visual parity (see css-visual-diff help --all on how to do that, and potential scripts to write, which you should store in the scripts/ folder of the ticket like all scripts), committing at appropriate intervals, keeping a diary.

Use storybook for the visual parity, don't hesitate to add stories if missing. 

Have the page properly depend on the package for development."

**Assistant interpretation:** Create a new docmgr ticket, write an analysis/implementation guide and granular task list, then begin migrating duplicated design-system code from `web/src` into `packages/rag-evaluation-site` with Storybook/css-visual-diff visual parity checks and frequent diary updates.

**Inferred user intent:** Reduce frontend duplication while preserving visual behavior, making the reusable package the canonical design-system/Widget IR surface and keeping `web/` focused on app-specific pages and backend-connected containers.

### What I did
- Committed the prior context-viewer ticket and `web/README.md` first as `2343bef docs: capture context viewer design analysis` to start this new work from a clean tree.
- Created ticket `RAGEVAL-DESIGN-SYSTEM-UNIFY`.
- Added design doc `design-doc/01-design-system-unification-analysis-and-implementation-guide.md`.
- Added this diary `reference/01-investigation-diary.md`.
- Added initial granular tasks for css-visual-diff setup, duplication inventory, workspace dependency, import migration, Storybook coverage, and visual parity checks.
- Wrote and ran `scripts/01_capture_css_visual_diff_help.sh`.
- Wrote and ran `scripts/02_component_duplication_inventory.py`.

### Why
- The user explicitly asked for ticketed work, scripts in the ticket, css-visual-diff, Storybook, diary, and appropriate commits.
- The duplication inventory gives objective evidence before changing imports or deleting files.

### What worked
- `css-visual-diff help --all` worked and focused help pages were captured under `sources/css-visual-diff-help/`.
- The duplication script generated `sources/01-duplication-inventory.md` and `.json`.
- Inventory result:
  - `components`: 72 identical shared files, 2 differing shared files, 120 web-only files.
  - `widgets`: 3 identical shared files, 2 differing shared files, 1 web-only file.
  - `hooks`: package and web each have one non-overlapping hook file.

### What didn't work
- No blocker yet.

### What I learned
- The package has no package-only component files; it is a strict subset of the `web` component library.
- Most duplicate files are identical, so a package-canonical migration can be incremental and low-risk.
- The package `WidgetRenderer.tsx` and `actions.ts` differ from `web`, and the package versions include newer behavior from PR review work. These should be treated as the current canonical versions.

### What was tricky to build
- The important distinction is between reusable presentational files and Storybook/app files. Story files are currently web-only but may need to move or be duplicated temporarily to test package components visually.
- `web` currently has no root workspace dependency on the local package, so development wiring must come before import migration.

### What warrants a second pair of eyes
- Whether Storybook should live in `web`, in the package, or in both during the migration.
- Whether domain-specific organisms like corpus/workflow panels should move to the package now or only after primitive/layout/widget duplication is removed.

### What should be done in the future
- Add workspace wiring and aliases so `web` can import package source during development.
- Add css-visual-diff scripts that compare Storybook pages before and after migration.
- Migrate imports in `web` from local primitive/layout/molecule/widget paths to package imports.

### Code review instructions
- Start with `sources/01-duplication-inventory.md`.
- Review `scripts/01_capture_css_visual_diff_help.sh` and `scripts/02_component_duplication_inventory.py`.
- Confirm the initial task list in `tasks.md` before code migration.

### Technical details
- css-visual-diff help capture: `sources/css-visual-diff-help/`.
- Duplication inventory: `sources/01-duplication-inventory.md` and `sources/01-duplication-inventory.json`.

## Step 2: Add Workspace Development Dependency

I wired the repository as a two-package pnpm workspace so the `web` application can depend on the local `@go-go-golems/rag-evaluation-site` package during development. This is the prerequisite for moving imports from duplicated local files to package-canonical files.

I also added Vite and TypeScript source aliases so development resolves package imports to `packages/rag-evaluation-site/src` rather than stale built artifacts in `dist`.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Begin the migration by making `web` properly depend on the local reusable package for development.

**Inferred user intent:** Ensure unification is real package consumption, not another copy or alias-only trick that hides duplication.

### What I did
- Added root `pnpm-workspace.yaml` with `web` and `packages/rag-evaluation-site`.
- Added `@go-go-golems/rag-evaluation-site: workspace:*` to `web/package.json`.
- Added Vite aliases in `web/vite.config.ts` for package root, `/app`, and `/ir` imports.
- Added TypeScript `paths` in `web/tsconfig.json` for the same package entrypoints.
- Ran `pnpm install` at the repo root.
- Added `/node_modules/` to `.gitignore` because root workspace install creates root `node_modules`.
- Ran package and web typechecks.

### Why
- `web` needs a real local workspace dependency before import migration.
- Source aliases keep local development fast and avoid requiring package rebuilds for every component change.

### What worked
- `pnpm install` succeeded with `Scope: all 2 workspace projects`.
- `pnpm --dir web typecheck` passed.
- `pnpm --dir packages/rag-evaluation-site typecheck` passed.

### What didn't work
- Root `node_modules/` appeared as untracked because the repo only ignored `web/node_modules/`. I fixed this by adding `/node_modules/` to `.gitignore`.

### What I learned
- The root workspace lockfile is now the coordination point for both frontend packages.
- No code imports have been redirected yet, so this step is low-risk and validates dependency wiring only.

### What was tricky to build
- Vite/TypeScript need source aliases because the package `exports` point at built package files for distribution, while development should consume source.

### What warrants a second pair of eyes
- Confirm whether package subpath aliases should use an array form in Vite if future prefix matching causes an issue.

### What should be done in the future
- Begin import migration in small batches, starting with app-level imports and duplicated widgets.

### Code review instructions
- Review `pnpm-workspace.yaml`, `web/package.json`, `web/vite.config.ts`, and `web/tsconfig.json`.
- Validate with `pnpm install`, `pnpm --dir web typecheck`, and `pnpm --dir packages/rag-evaluation-site typecheck`.

## Step 3: Redirect Shared Barrels and Add Storybook/css-visual-diff Parity Harness

I redirected the main `web/src` component and widget barrels so app code that imports `../atoms`, `../foundation`, `../layout`, shared `../molecules`, or `../widgets` now receives implementations from `@go-go-golems/rag-evaluation-site`. This is the first import-migration slice: it changes consumers that go through the public layer barrels while intentionally leaving direct story imports and CSS reference imports in place for parity testing.

I added a Storybook parity story that renders representative local `web/src` components next to package components, then wrote a css-visual-diff script that builds Storybook, serves it, and compares the local and package sections. After removing intentionally different labels, css-visual-diff reports 0 changed pixels for the shared-component sample.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Start migrating duplicated shared components to package imports and use Storybook plus css-visual-diff to prove parity.

**Inferred user intent:** Make the package canonical without visual regressions and keep reusable visual evidence in the ticket.

### What I did
- Updated `web/src/components/atoms/index.ts` to re-export package atoms.
- Updated `web/src/components/foundation/index.ts` to re-export package foundation primitives and types.
- Updated `web/src/components/layout/index.ts` to re-export package layout primitives and types.
- Updated `web/src/components/molecules/index.ts` to keep local `CoveragePanel`/`QueryPresetList` while re-exporting package `AppNav`, `DataTable`, and `MetadataGrid`.
- Updated `web/src/widgets/index.ts` to re-export package Widget IR, renderer, action, and cell-renderer APIs.
- Added `web/src/components/PackageParity.stories.tsx`, rendering local and package versions of Button, Caption, AppNav, Panel, Stack, MetadataGrid, and DataTable side by side.
- Wrote `scripts/03_storybook_package_parity_compare.sh`.
- Ran the script; it built Storybook and generated css-visual-diff artifacts under `sources/visual-parity/package-parity/`.
- Removed the generated `storybook-static` directory from the ticket output after producing compare artifacts, because the script can regenerate it and it is large.
- Ran validation commands.

### Why
- Barrel redirection is a low-risk way to make many web consumers use the package while leaving local files available for direct parity stories.
- The parity story allows css-visual-diff to compare local and package components in the same Storybook runtime.

### What worked
- `pnpm --dir web typecheck` passed.
- `pnpm --dir packages/rag-evaluation-site typecheck` passed.
- `pnpm --dir web build` passed.
- `pnpm --dir web build-storybook` passed inside the parity script.
- `css-visual-diff compare` reported:
  - `changed_pixels: 0`
  - `changed_percent: 0`
  - no computed style diffs for selected props.

### What didn't work
- The first parity story failed typecheck because `AppNav` requires `onItemSelect`:
  - `Property 'onItemSelect' is missing ... but required in type 'AppNavProps'.`
- I fixed the story by passing `onItemSelect={() => {}}` to both local and package `AppNav` instances.
- The first visual comparison had `0.3385%` changed pixels because the local and package headings used different text (`Local web/src components` vs `Package components`). I changed both headings to `Shared components`, then reran css-visual-diff and got `0%` changed pixels.

### What I learned
- Local and package implementations are visually identical for the representative shared-component sample when rendered with the same props.
- Keeping local direct imports in the parity story is useful while migrating; direct story imports should not be deleted until package Storybook ownership is decided.

### What was tricky to build
- If the parity story labels differ, css-visual-diff correctly reports pixels changed even when components are identical. The comparison fixture must keep all non-component text equal.
- Storybook build output is too large to keep in the ticket; the durable artifacts are the compare screenshots/report and the script.

### What warrants a second pair of eyes
- The barrel strategy means many consumers now use the package, but direct imports from individual local component files remain in stories and CSS reference tooling. Reviewers should confirm whether to keep that as the temporary parity harness or move stories into the package next.

### What should be done in the future
- Audit remaining direct local imports.
- Move or rewrite stories to import package components where appropriate.
- Delete duplicated local component implementation files only after direct imports are gone or intentionally retained for parity.

### Code review instructions
- Review the five barrel files under `web/src/components/**/index.ts` and `web/src/widgets/index.ts`.
- Review `web/src/components/PackageParity.stories.tsx`.
- Re-run `scripts/03_storybook_package_parity_compare.sh` and inspect `sources/visual-parity/package-parity/compare-shared-components/01-compare.md`.

### Technical details
- css-visual-diff report: `sources/visual-parity/package-parity/compare-shared-components/01-compare.md`.
- Pixel diff result: `0 changed pixels / 0%`.
