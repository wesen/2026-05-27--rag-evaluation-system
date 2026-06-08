---
Title: Investigation diary
Ticket: RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS
Status: active
Topics:
    - frontend
    - widget-ir
    - design-system
    - rag-evaluation
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../../../../code/wesen/go-go-golems/go-go-parc/Projects/2026/06/06/RAG-EVAL DSL/ARTICLE - Semantic Recipes on Top of Widget IR.md
      Note: External source article requested by user
    - Path: ttmp/2026/06/07/RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS--semantic-widget-ir-support-for-reusable-design-system-components/design-doc/01-semantic-widget-ir-component-support-implementation-guide.md
      Note: Primary design deliverable
    - Path: ttmp/2026/06/07/RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS--semantic-widget-ir-support-for-reusable-design-system-components/scripts/01_collect_widget_ir_evidence.sh
      Note: Evidence collection script
    - Path: ttmp/2026/06/07/RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS--semantic-widget-ir-support-for-reusable-design-system-components/scripts/02_extract_line_references.sh
      Note: Line-reference extraction script
ExternalSources: []
Summary: Chronological diary for the semantic Widget IR component support design ticket.
LastUpdated: 2026-06-07T21:05:00-04:00
WhatFor: Track the investigation, evidence collection, design writing, validation, and reMarkable delivery for the Widget IR semantic component support ticket.
WhenToUse: Before resuming implementation of expanded WidgetRenderer or widget.dsl support.
---


# Diary

## Goal

Capture the work to create a new ticket and write an intern-oriented design/implementation guide for expanding Widget IR, WidgetRenderer, and widget.dsl support to the newer design-system package components.

## Step 1: Create Ticket, Gather Evidence, and Write the Implementation Guide

I created a dedicated ticket for semantic Widget IR component support and used it as an evidence-backed design workspace. The investigation centered on the existing Widget IR runtime, the Goja `widget.dsl` module, the server/schema/runtime path, the newly expanded package component exports, and the Obsidian article about semantic recipes on top of Widget IR.

The resulting design guide explains the complete system for a new intern: how Goja scripts produce JSON Widget IR, how the Go server serves pages and actions, how the packaged React app loads those pages, how `WidgetRenderer` maps semantic nodes to actual package components, and how the implementation should be phased across TypeScript, Go, schemas, stories, and tests.

### Prompt Context

**User prompt (verbatim):** "Let's actually tackle a new ticket, which is to add proper IR widgetrenderer support for the immense amount of new atoms and molecules and organisms and pages we have been adding. 

See /home/manuel/code/wesen/go-go-golems/go-go-parc/Projects/2026/06/06/RAG-EVAL DSL/ARTICLE - Semantic Recipes on Top of Widget IR.md (and past tickets in this repo as well, and of course the proper implementation itself), and Create  a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and the nupload to remarkable."

**Assistant interpretation:** Create a new docmgr ticket, research the existing Widget IR/WidgetRenderer/widget.dsl architecture plus prior guidance, then write and upload a clear technical implementation guide for extending IR support to the expanded package component vocabulary.

**Inferred user intent:** Prepare a future implementer or intern to safely add semantic Widget IR support without regressing the design-system architecture or repeating the earlier Go-generated-HTML mistake.

### What I did
- Loaded the ticket-research writing-style and deliverable-checklist references.
- Created ticket `RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS`.
- Added design document `design-doc/01-semantic-widget-ir-component-support-implementation-guide.md`.
- Added this investigation diary.
- Copied the Obsidian source article into `sources/semantic-recipes-on-top-of-widget-ir.md` for ticket-local review.
- Added scripts:
  - `scripts/01_collect_widget_ir_evidence.sh`
  - `scripts/02_extract_line_references.sh`
- Collected evidence into:
  - `sources/01-widget-ir-evidence.txt`
  - `sources/02-line-references.md`
  - `sources/03-component-api-surface.txt`
- Read and referenced the current implementation files for Widget IR, renderer, actions, cell renderers, Goja DSL helpers, widget schema, widget server, widget runner tests, app shell, context DTOs, package exports, and package guidelines.
- Wrote an implementation guide with system diagrams, API sketches, pseudocode, phased implementation steps, testing strategy, decision records, and file references.

### Why
- The package now has many stable reusable components that are not yet available to Widget IR authors.
- The existing DSL already supports semantic recipes, but only for the earlier smaller component vocabulary.
- A new implementer needs the full architecture before adding many renderer cases and Goja helpers.
- Prior docs warn against direct HTML generation; this guide reinforces the React-rendered Widget IR model.

### What worked
- `docmgr ticket create-ticket` created the workspace successfully.
- `docmgr doc add` created both the design doc and diary.
- Evidence collection scripts ran successfully after correcting the WidgetRenderer story path from `src/WidgetRenderer.stories.tsx` to `src/widgets/WidgetRenderer.stories.tsx`.
- The current source files provide a clear implementation pattern: TypeScript IR type, renderer case, Goja helper, schema component list, Storybook story, Go test.
- The Obsidian semantic-recipes article aligned with the package guideline that high-level recipes should expand into existing Widget IR, not render UI themselves.

### What didn't work
- The first run of `scripts/02_extract_line_references.sh` failed with:
  - `nl: /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/packages/rag-evaluation-site/src/WidgetRenderer.stories.tsx: No such file or directory`
- The actual file is `packages/rag-evaluation-site/src/widgets/WidgetRenderer.stories.tsx`.
- I fixed the script and reran it successfully.

### What I learned
- The current IR implementation is intentionally permissive at the JSON Schema layer but explicit at the TypeScript renderer layer.
- The package context DTOs are already JSON-compatible enough to reuse in new IR prop interfaces.
- The direct helper mechanism in `pkg/widgetdsl/module.go` is generic enough for many new components; recipes only need custom Go functions when they normalize data or expand common compositions.
- The action model is already capable of supporting callback-like props through `ActionSpec`, as long as the renderer constructs useful action context payloads.

### What was tricky to build
- The main design challenge was not listing every new component; it was deciding which components deserve direct nodes, which should be recipes, and which should be deferred.
- Another sharp edge is the callback boundary: React components use functions, while Widget IR must remain JSON. The design resolves this by adding explicit `on...Action` props and binding them in `WidgetRenderer`.
- Slot props such as `SplitPane.left`, `SidebarShell.sidebar`, and `SlideShell.visual` require `WidgetNode` props rather than ReactNode props, so the renderer needs helper functions to render node-valued props.

### What warrants a second pair of eyes
- The proposed first PR slice should be reviewed for scope. It may still be too broad if the implementation includes all foundation/atom/layout additions at once.
- The schema versioning decision (`0.1.0` vs `0.2.0`) should be confirmed before implementation.
- The exact names of direct Goja helpers, especially `textBlock` for the `Text` component, should be accepted before coding.
- The relationship between `CourseStudioShell` default navigation and JSON-provided navigation sections should be reviewed.

### What should be done in the future
- Implement Phase 1 from the design doc: foundation/atom/layout IR support.
- Follow with context diagrams, transcript/annotations, and course/handout recipes in separate commits or PRs.
- Add WidgetRenderer visual stories and Go JSON serialization tests for each phase.

### Code review instructions
- Start with `design-doc/01-semantic-widget-ir-component-support-implementation-guide.md`.
- Verify the evidence files under `sources/` if a claim needs line-level support.
- Confirm that the implementation plan updates all five required surfaces: TypeScript IR, React renderer, Goja DSL, widget schema, and tests/stories.
- Validate with `docmgr doctor --ticket RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS --stale-after 30` before handoff.

### Technical details
- Primary files studied:
  - `packages/rag-evaluation-site/src/widgets/ir.ts`
  - `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx`
  - `packages/rag-evaluation-site/src/widgets/actions.ts`
  - `packages/rag-evaluation-site/src/widgets/cellRenderers.tsx`
  - `packages/rag-evaluation-site/src/app/App.tsx`
  - `packages/rag-evaluation-site/src/context/types.ts`
  - `pkg/widgetdsl/module.go`
  - `pkg/widgetdsl/module_test.go`
  - `pkg/widgetschema/schema.go`
  - `pkg/widgetserver/server.go`
  - `pkg/widgetrunner/runner_test.go`
- Core design recommendation:
  - Add direct semantic component nodes for stable JSON-compatible components.
  - Add high-level recipes for context/transcript/course/handout page compositions.
  - Keep React components as the rendering source of truth.
