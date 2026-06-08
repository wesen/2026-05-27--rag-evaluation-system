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

## Step 2: Add Granular Phase Task List

I added a separate phased implementation task list so the design guide now has an executable companion checklist. The new document decomposes the whole Widget IR expansion into baseline, renderer, Goja helper, context diagram, transcript, course/handout, recipe, schema/docs, validation, and handoff phases.

The plan clarifies that Phase 1 extends the existing `WidgetRenderer` in place, then subsequent phases add Goja helpers, schema entries, DTO-heavy components, semantic recipes, and end-to-end validation. Each phase includes files to edit, component scope, tests, Storybook stories, and done criteria.

### Prompt Context

**User prompt (verbatim):** "create phases and then per phase, granular detailed list of tasks for the whoel thing."

**Assistant interpretation:** Add a full phase-by-phase implementation task plan for the entire semantic Widget IR effort, detailed enough for an intern to execute.

**Inferred user intent:** Turn the high-level design guide into an actionable implementation checklist with clear sequencing and review boundaries.

### What I did
- Added `reference/02-phased-implementation-task-list.md`.
- Broke the work into phases 0 through 9.
- Added granular checklists for TypeScript IR, React renderer, WidgetRenderer stories, Goja helpers, schema updates, tests, validation, docs, commits, and handoff.
- Updated `tasks.md` to mark the task list as complete.

### Why
- The main design guide explains the architecture, but implementers need a concrete task board.
- The phase split reduces risk by proving foundation/atom/layout support before context, transcript, course, and recipe work.
- The checklist makes it harder to forget synchronization points such as `pkg/widgetschema/schema.go` or `pkg/widgetdsl/module_test.go`.

### What worked
- The task list now states the exact extension points and done criteria for each phase.
- Phase 1 is clearly scoped as an in-place extension of existing Widget IR and `WidgetRenderer`.

### What didn't work
- N/A

### What I learned
- The implementation needs two early phases, not one: TypeScript renderer support first, then Goja/schema support for the same low-risk components.
- Separating semantic recipes into their own later phase keeps direct renderer support reviewable.

### What was tricky to build
- The main tricky part was balancing granularity with sequence. If Goja helpers are added before renderer stories, authors can produce nodes that are not yet visually proven. The plan therefore asks for renderer stories before broad recipe work.

### What warrants a second pair of eyes
- Review whether `SlideShell` should be Phase 1 or Phase 5.
- Review whether Phase 2 should be merged with Phase 1 in one commit or kept separate.

### What should be done in the future
- Use `reference/02-phased-implementation-task-list.md` as the checklist when coding starts.
- Update checkboxes after each implementation phase.

### Code review instructions
- Review `reference/02-phased-implementation-task-list.md` for phase order and scope.
- Confirm the proposed commit slices match the desired PR/review cadence.

### Technical details
- The plan uses these recurring synchronization points:
  - `packages/rag-evaluation-site/src/widgets/ir.ts`
  - `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx`
  - `packages/rag-evaluation-site/src/widgets/WidgetRenderer.stories.tsx`
  - `pkg/widgetdsl/module.go`
  - `pkg/widgetdsl/module_test.go`
  - `pkg/widgetschema/schema.go`

## Step 3: Add Widget IR Storybook Story Matrix

I expanded the phased task list with a dedicated Widget IR Storybook story matrix. The new section keeps all renderer validation stories under the `Widget IR/Renderer/...` mantle while splitting them into navigable subgroups for foundation/atoms, layout recipes, context diagrams, transcripts and notes, course studio, handout documents, composed workflows, and actions/edge cases.

This was added because individual renderer cases are not enough. The expanded Widget IR surface must prove that new components compose well together in realistic product scenes: transcript review workbenches, context studio overviews, course slides with context visuals, handout readers, and legacy RAG dashboards enhanced with new components.

### Prompt Context

**User prompt (verbatim):** "Add tasks to write stories for all these different combinations under the widget IR storybook mantle, but then split into subgroups, since we have so many possibilities. We want to see these things being combined in interesting ways."

**Assistant interpretation:** Extend the implementation task list with a detailed Storybook plan for many Widget IR combinations, organized into subgroups under the Widget IR renderer story hierarchy.

**Inferred user intent:** Ensure the implementation validates real compositional usage, not only one isolated story per component.

### What I did
- Added `Cross-phase Widget IR Storybook story matrix` to `reference/02-phased-implementation-task-list.md`.
- Added subgroup title conventions under `Widget IR/Renderer/...`.
- Added story tasks for:
  - Foundation and atoms
  - Layout recipes
  - Context diagrams
  - Transcript and notes
  - Course studio
  - Handout documents
  - Composed workflows
  - Actions and edge cases
- Added cross-story quality tasks for deterministic fixtures, action loggers, overflow states, and screenshot capture.
- Updated `tasks.md` to record the Storybook matrix addition.

### Why
- Widget IR needs to prove component composition, not just component existence.
- The renderer story catalog would become unmanageable if every scenario stayed in one flat Storybook list.
- Subgroups make visual review and implementation progress easier to navigate.

### What worked
- The task list now gives concrete story names and the renderer behavior each group should prove.
- It explicitly requires every story to render through `<WidgetRenderer node={...} />`, preserving the validation path.

### What didn't work
- N/A

### What I learned
- The highest-value stories are cross-feature compositions: transcript plus comments, course plus handout, context diagram plus metadata sidebar, and legacy dashboards enhanced with new atoms/layout.

### What was tricky to build
- The tricky part was keeping the story matrix broad enough to cover interesting combinations without turning it into implementation code. The plan therefore lists story intent and required components, but leaves exact fixture shape to the implementation phase.

### What warrants a second pair of eyes
- Review whether the subgroup names match the desired Storybook navigation taxonomy.
- Review whether action-logger stories should be implemented with Storybook actions, custom stateful render wrappers, or a small shared helper.

### What should be done in the future
- When implementation begins, create story files incrementally per subgroup rather than one enormous story file.
- Link screenshots or Storybook URLs in the diary after each subgroup lands.

### Code review instructions
- Review the new `Cross-phase Widget IR Storybook story matrix` section in `reference/02-phased-implementation-task-list.md`.
- Confirm that each subgroup validates renderer behavior through IR rather than direct JSX.

### Technical details
- Proposed Storybook mantle/subgroups:
  - `Widget IR/Renderer/Foundation and Atoms/...`
  - `Widget IR/Renderer/Layout Recipes/...`
  - `Widget IR/Renderer/Context Diagrams/...`
  - `Widget IR/Renderer/Transcript and Notes/...`
  - `Widget IR/Renderer/Course Studio/...`
  - `Widget IR/Renderer/Handout Documents/...`
  - `Widget IR/Renderer/Composed Workflows/...`
  - `Widget IR/Renderer/Actions and Edge Cases/...`

## Step 4: Implement Phase 0, Phase 1, and Phase 2 Foundation IR Support

I started the implementation work from the phase plan and completed the low-risk foundation/atom/layout slice. This extends the existing Widget IR system in place: `ir.ts` now knows about the new component types, `WidgetRenderer.tsx` renders them through the real package components, Storybook has grouped Widget IR stories for foundation/atoms and layout recipes, and `widget.dsl` exposes matching Goja helpers.

This is the first proof that the plan works end-to-end without introducing a second renderer. JSON IR nodes such as `Text`, `ContextKindSwatch`, `SectionBlock`, `SplitPane`, and `SidebarShell` now render via the existing React `WidgetRenderer`, and Goja authors can create the same nodes through helper functions such as `rag.textBlock()`, `rag.contextKindSwatch()`, `rag.sectionBlock()`, `rag.splitPane()`, and `rag.sidebarShell()`.

### Prompt Context

**User prompt (verbatim):** "Now work on these tasks one by one, commit at appropriate intervals, keep a diary as you work. I am going to go swimming and I want to have done verything when I come back. No faltering."

**Assistant interpretation:** Begin executing the phased Widget IR implementation plan, keep diary updates, validate frequently, and commit coherent slices.

**Inferred user intent:** Make tangible implementation progress across the Widget IR roadmap while the user is away, with enough documentation and commits to review safely later.

### What I did
- Ran Phase 0 baseline validation:
  - `git status --short`
  - `pnpm --dir packages/rag-evaluation-site typecheck`
  - `pnpm --dir packages/rag-evaluation-site build`
  - `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1`
- Extended `packages/rag-evaluation-site/src/widgets/ir.ts` with Phase 1 component types and prop interfaces:
  - `Text`, `CodeText`, `Divider`
  - `ContextKindSwatch`, `AnnotationBadge`, `TranscriptRoleBadge`
  - `SectionBlock`, `SplitPane`, `SidebarShell`
- Extended `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx` with explicit switch cases and render helpers for those components.
- Added `renderNodeProp()` for `WidgetNode` slot props used by `SplitPane` and `SidebarShell`.
- Added grouped Widget IR Storybook files:
  - `WidgetRenderer.foundation-atoms.stories.tsx`
  - `WidgetRenderer.layout-recipes.stories.tsx`
- Extended `pkg/widgetdsl/module.go` with direct Goja helpers:
  - `textBlock`, `codeText`, `divider`
  - `contextKindSwatch`, `annotationBadge`, `transcriptRoleBadge`
  - `sectionBlock`, `splitPane`, `sidebarShell`
- Extended `pkg/widgetschema/schema.go` with the new component names.
- Extended Go tests in `pkg/widgetdsl/module_test.go` and `pkg/widgetserver/server_test.go`.

### Why
- Phase 1 and Phase 2 are the smallest safe end-to-end slice: they cover scalar props, children, slot props, direct renderer cases, Goja helpers, schema discovery, and Storybook grouping without DTO-heavy organisms.
- This establishes the exact pattern needed for later context diagrams, transcripts, course, and handout support.

### What worked
- Baseline package validation passed before implementation.
- Phase 1 package validation passed after implementation:
  - `pnpm --dir packages/rag-evaluation-site typecheck`
  - `pnpm --dir packages/rag-evaluation-site build`
  - `pnpm --dir packages/rag-evaluation-site exec storybook build --output-dir /tmp/rag-package-storybook-widget-ir-phase-1`
- Phase 2 Go validation passed:
  - `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1`
- Storybook build now includes the subgroup files under `Widget IR/Renderer/Foundation and Atoms` and `Widget IR/Renderer/Layout Recipes`.

### What didn't work
- First Phase 1 typecheck failed because I used `sidebar` as a `SplitPane` ratio in the IR and story, but the actual `SplitPane` component supports `balanced`, `leftNarrow`, `rightNarrow`, and `course`.
- Exact error:
  - `Type '"course" | "sidebar" | "balanced" | undefined' is not assignable to type '"course" | "balanced" | "leftNarrow" | "rightNarrow" | undefined'.`
- I fixed the IR prop type and story to use `leftNarrow`.

### What I learned
- Slot-prop components can be represented cleanly with `WidgetNode` props and a small renderer helper.
- The direct `componentFactory` in Goja is already enough for the Phase 1 helper set; no custom Go functions were needed.
- `rag.text()` must remain a raw text-node helper, so `rag.textBlock()` is the right DSL helper name for the React `Text` component.

### What was tricky to build
- The main sharp edge was keeping TypeScript IR prop unions aligned with the actual component prop unions. The `SplitPane` ratio mismatch showed why Phase 1 should remain small and heavily typechecked.
- Another subtle point is that `CodeText` copyability only copies when its React `children` is a string; WidgetRenderer passes children as React nodes. This is acceptable for now because action-based copy remains available through Button/action specs, but it should be reviewed if authors expect `CodeText.copyable` to work from IR text children.

### What warrants a second pair of eyes
- Confirm whether `CodeText.copyable` should be supported from Widget IR or omitted from the IR prop interface until a string-value prop exists.
- Review whether `style` pass-through should remain ignored for these new components, matching most existing renderer helpers, or selectively supported.
- Review whether `SidebarShell.sidebarWidth` should accept only numbers in IR or also CSS strings.

### What should be done in the future
- Continue with Phase 3 context diagram nodes.
- Add browser visual sanity screenshots for the new grouped Widget IR stories.
- Update the phase task list checkboxes after the first commit lands.

### Code review instructions
- Start in `packages/rag-evaluation-site/src/widgets/ir.ts` and review new prop interfaces.
- Then review `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx` for explicit prop mapping.
- Review Storybook groups:
  - `Widget IR/Renderer/Foundation and Atoms`
  - `Widget IR/Renderer/Layout Recipes`
- Review Go helper additions in `pkg/widgetdsl/module.go` and tests in `pkg/widgetdsl/module_test.go`.
- Validate with:
  - `pnpm --dir packages/rag-evaluation-site typecheck`
  - `pnpm --dir packages/rag-evaluation-site build`
  - `pnpm --dir packages/rag-evaluation-site exec storybook build --output-dir /tmp/rag-package-storybook-widget-ir-phase-1`
  - `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1`

### Technical details
- New DSL helper distinction:
  - `rag.text("...")` creates `{ kind: "text" }`.
  - `rag.textBlock({...}, "...")` creates `{ kind: "component", type: "Text" }`.

## Step 5: Add Context Diagram Widget IR Support

I completed the next implementation slice for context-window visualizations. Widget IR now supports the context legend, budget bar, strip diagram, stack diagram, treemap, and the higher-level `ContextDiagramPanel` organism. The implementation again extends the existing renderer and DSL surfaces rather than creating any separate rendering path.

I also added a grouped Storybook file under `Widget IR/Renderer/Context Diagrams` with stories that combine multiple diagram types, a diagram panel mode gallery, a metadata sidebar composition, and an over-budget context-window state. This starts exercising the “interesting combinations” story matrix rather than only one component at a time.

### Prompt Context

**User prompt (verbatim):** (same as Step 4)

**Assistant interpretation:** Continue executing the phased Widget IR implementation plan and commit coherent slices with diary updates.

**Inferred user intent:** Keep making concrete progress through the component families while maintaining reviewable commits and validation evidence.

### What I did
- Added context diagram prop interfaces to `packages/rag-evaluation-site/src/widgets/ir.ts`.
- Added renderer imports, switch cases, and render helpers in `WidgetRenderer.tsx` for:
  - `ContextLegend`
  - `ContextBudgetBar`
  - `ContextStripDiagram`
  - `ContextStackDiagram`
  - `ContextTreemap`
  - `ContextDiagramPanel`
- Added `WidgetRenderer.context-diagrams.stories.tsx` with subgroup title `Widget IR/Renderer/Context Diagrams`.
- Added Goja helper mappings in `pkg/widgetdsl/module.go`.
- Added schema component names in `pkg/widgetschema/schema.go`.
- Added Go JSON serialization coverage for a context diagram page in `pkg/widgetdsl/module_test.go`.
- Extended schema endpoint test coverage in `pkg/widgetserver/server_test.go`.

### Why
- Context diagrams are the next lowest-risk DTO-backed family because their props are already JSON-compatible `ContextWindowSnapshot` objects.
- The diagrams are central to the context-viewer work and should be available both as low-level diagrams and as `ContextDiagramPanel`.

### What worked
- `pnpm --dir packages/rag-evaluation-site typecheck` passed.
- `pnpm --dir packages/rag-evaluation-site build` passed.
- `pnpm --dir packages/rag-evaluation-site exec storybook build --output-dir /tmp/rag-package-storybook-widget-ir-phase-3` passed.
- `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1` passed.

### What didn't work
- N/A

### What I learned
- The context diagram family fits the direct-node model cleanly because the React components already accept DTO-shaped props.
- `ContextDiagramPanel` is stateful internally for view switching, but its initial state and selected part are still safely representable in JSON IR.

### What was tricky to build
- The diagram components do not all expose identical props: `ContextBudgetBar` and `ContextStripDiagram` accept `mode`, while `ContextStackDiagram` and `ContextTreemap` do not. The IR prop interfaces intentionally mirror the real component APIs instead of inventing a fake unified shape.

### What warrants a second pair of eyes
- Confirm whether the IR should eventually add `onPartSelectAction`; current React context diagram components do not expose selection callbacks, so this was deferred.
- Review whether `ContextDiagramPanel.initialView` should be renamed at the IR level to `view` for author ergonomics, or kept identical to React props for simplicity.

### What should be done in the future
- Proceed to transcript/annotation/comment Widget IR support.
- Add visual screenshots for the context diagram Widget IR stories if needed for review.

### Code review instructions
- Review `WidgetRenderer.context-diagrams.stories.tsx` first to understand expected renderer output.
- Then review `ir.ts` and `WidgetRenderer.tsx` context diagram additions.
- Validate with the same package and Go commands listed in `What worked`.

### Technical details
- New Storybook subgroup: `Widget IR/Renderer/Context Diagrams`.
- The over-budget story uses a modified fixture with a lower token limit to force warning/over-budget behavior.

## Step 6: Add Transcript, Annotation, and Comment Widget IR Support

I added Widget IR support for the polished transcript family: session headers, message cards, note cards, annotation rails, transcript reader/workspace panels, anchored comment cards, and anchored comment rails. This phase also wires selection/dismiss-like callbacks through existing `ActionSpec` props, so JSON-authored transcript widgets can still participate in the same action dispatch system as buttons and tables.

The new Storybook subgroup `Widget IR/Renderer/Transcript and Notes` includes no-notes and with-notes workspace stories, manual reader-plus-rail composition, message card state coverage, anchored comments next to transcript content, and an action logger harness. This directly addresses the requirement to see interesting combinations under the Widget IR mantle.

### Prompt Context

**User prompt (verbatim):** (same as Step 4)

**Assistant interpretation:** Continue implementing the Widget IR phase plan with frequent diary updates and coherent commits.

**Inferred user intent:** Complete the renderer/DSL coverage for the newly polished transcript UI so it is usable from semantic Widget IR.

### What I did
- Added transcript/comment DTO prop interfaces to `packages/rag-evaluation-site/src/widgets/ir.ts`.
- Added `ActionSpec` callback props for annotation selection, anchored comment selection, and anchored comment dismiss.
- Added renderer imports, switch cases, and render helpers in `WidgetRenderer.tsx` for:
  - `TranscriptSessionHeader`
  - `TranscriptMessageCard`
  - `AnnotationNoteCard`
  - `AnnotationRailPanel`
  - `TranscriptReaderPanel`
  - `TranscriptWorkspacePanel`
  - `AnchoredCommentCard`
  - `AnchoredCommentRail`
- Added `annotationSelectHandler()` helper to bind annotation selection action context consistently.
- Added `WidgetRenderer.transcript-notes.stories.tsx`.
- Added Goja helper mappings in `pkg/widgetdsl/module.go`.
- Added schema component names in `pkg/widgetschema/schema.go`.
- Added Go JSON serialization coverage in `pkg/widgetdsl/module_test.go`.
- Extended schema endpoint test coverage in `pkg/widgetserver/server_test.go`.

### Why
- Transcript and notes are one of the primary context-viewer surfaces and were recently stabilized visually.
- This phase validates both direct high-level authoring (`TranscriptWorkspacePanel`) and lower-level custom composition (`TranscriptReaderPanel` + `AnnotationRailPanel`).
- Action props are necessary because React callbacks cannot cross the JSON boundary.

### What worked
- `pnpm --dir packages/rag-evaluation-site typecheck` passed after the story fix.
- `pnpm --dir packages/rag-evaluation-site build` passed.
- `pnpm --dir packages/rag-evaluation-site exec storybook build --output-dir /tmp/rag-package-storybook-widget-ir-phase-4` passed.
- `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1` passed.

### What didn't work
- First typecheck failed for the `TranscriptActionLogger` story because Storybook's `Story` type required `args` even though the story used a custom `render` function.
- Exact error:
  - `Property 'args' is missing in type '{ render: () => React.JSX.Element; }' but required...`
- I fixed it by adding a minimal `args` node to the story.

### What I learned
- The transcript family needs both direct nodes and high-level nodes. Direct nodes are useful for custom composition; `TranscriptWorkspacePanel` is the ergonomic default.
- Existing `ActionSpec` is sufficient for annotation/comment selection as long as renderer helpers include useful context payloads.

### What was tricky to build
- The callback conversion is the main sharp edge. React expects functions such as `onAnnotationSelect`, but IR must carry JSON. The renderer now converts `onAnnotationSelectAction` into a callback that sends `{ annotationId, value, componentType }`.
- `AnchoredCommentCard` has `onDismiss?: () => void`, so the renderer must derive the comment id from the card's `comment` prop rather than from callback arguments.

### What warrants a second pair of eyes
- Review the `componentType` strings used in action contexts; they are intentionally the rendered component names but could be standardized later.
- Review whether `onDismissAction` belongs on `AnchoredCommentCard` now, or should wait until the card's dismiss behavior is used in package stories.
- `AnchoredCommentRail` still contains inline button styles from prior work; that is outside this IR task but should be cleaned up later.

### What should be done in the future
- Continue with course/sidebar/handout/document Widget IR support.
- Add browser sanity screenshots for the transcript Widget IR stories.
- Consider a shared action logger decorator for all action-related Widget IR stories.

### Code review instructions
- Start with `WidgetRenderer.transcript-notes.stories.tsx` to see intended combinations.
- Review `ir.ts` transcript/comment prop interfaces.
- Review `WidgetRenderer.tsx` action binding helpers and component render helpers.
- Validate with package typecheck/build/Storybook and targeted Go tests.

### Technical details
- Annotation selection context shape:
  - `{ annotationId, value: annotationId, componentType }`
- Comment rail selection context shape:
  - `{ commentId, value: commentId, componentType: 'AnchoredCommentRail' }`

## Step 7: Add Course, Studio, Handout, and Document Widget IR Support

I added Widget IR support for the course and handout surfaces: generic content molecules, slide shell, sidebar navigation, course lesson and slide panels, course studio shell, markdown article rendering, document list/toolbar, and the full handout document shell. This completes the major React component families that were recently added to the package.

The new `Widget IR/Renderer/Course Studio` story file includes course landing, slide with context visual, custom teaching slide composition, handout shell, course-plus-handout split view, and document-list-plus-preview-toolbar compositions. These stories intentionally combine multiple component layers to prove that Widget IR can build real product surfaces, not just isolated widgets.

### Prompt Context

**User prompt (verbatim):** (same as Step 4)

**Assistant interpretation:** Continue executing the Widget IR implementation plan with diary updates and commits.

**Inferred user intent:** Keep progressing through all planned component families so the expanded design-system package is usable from Widget IR.

### What I did
- Added IR prop interfaces for:
  - `SlideShell`, `KeyValueStrip`, `CheckList`, `StepList`, `PersonSummary`, `FigureBlock`, `KeyPointList`
  - `SidebarNav`, `CourseStepNav`, `MarkdownArticle`, `DocumentListPanel`, `DocumentPreviewToolbar`
  - `CourseLessonPanel`, `CourseSlidePanel`, `CourseStudioShell`, `HandoutDocumentShell`
- Added renderer cases and render helpers for those components.
- Added action binding for item/document/nav/agenda selection and download actions.
- Added `WidgetRenderer.course-handout.stories.tsx` under `Widget IR/Renderer/Course Studio`.
- Added Goja helper mappings and schema names for the new components.
- Added Go JSON serialization coverage for course/handout helpers.

### Why
- Course, studio, and handout surfaces are the most page-like components in the package and prove that IR can compose beyond dashboard panels.
- The handout/document shell also validates markdown/document DTO rendering through semantic nodes.

### What worked
- `pnpm --dir packages/rag-evaluation-site typecheck` passed.
- `pnpm --dir packages/rag-evaluation-site build` passed.
- `pnpm --dir packages/rag-evaluation-site exec storybook build --output-dir /tmp/rag-package-storybook-widget-ir-phase-5` passed.
- `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1` passed.

### What didn't work
- No blocking failures in this phase after fixing missing `SlideShell` renderer support while implementing the course composition story.

### What I learned
- The page-like components need careful conversion of `RenderableValue` fields back into React nodes. This is especially visible in `SidebarNav`, `DocumentListPanel`, and `CourseStudioShell`.
- `SlideShell` belongs in this phase because course stories need custom slide composition, not only `CourseSlidePanel`.

### What was tricky to build
- Several molecule props contain arrays of objects with nested `ReactNode`-like fields. The renderer now maps those nested fields through `renderRenderableValue` rather than passing JSON objects directly.
- Download actions have no natural selected id in some molecules, so the renderer binds component-level contexts for toolbar/download-all and document-id contexts for handout document downloads.

### What warrants a second pair of eyes
- Review whether the compressed one-line IR interfaces in `ir.ts` should be expanded for readability before final merge.
- Review action context names for document and nav selection.
- Review whether `DocumentPreviewToolbar.onDownloadAction` should include file metadata in context.

### What should be done in the future
- Add semantic recipes on top of these direct nodes.
- Add end-to-end xgoja example pages using course/handout recipes.

### Code review instructions
- Start with `WidgetRenderer.course-handout.stories.tsx` to see the intended compositions.
- Review nested renderable mapping in `WidgetRenderer.tsx` for list/document/sidebar props.
- Validate with package typecheck/build/Storybook and targeted Go tests.

### Technical details
- New subgroup: `Widget IR/Renderer/Course Studio`.
- `SlideShell` is now a direct IR node with `primary`, `secondary`, and `footer` slot props.

## Step 8: Add Semantic Recipes for Context, Transcript, Course, and Handout

I added the first semantic recipe layer on top of the expanded direct Widget IR nodes. These recipes keep the same architecture as the earlier `metrics`, `actionToolbar`, and `masterDetailTable` recipes: they are pure Goja-side expansions into plain JSON-compatible Widget IR, and the React `WidgetRenderer` still owns rendering.

The new recipes cover context diagrams, annotated transcripts, course studio shells, course slides, and handout document shells. This gives authors a higher-level API for the most common product surfaces without forcing them to manually assemble every direct component node.

### Prompt Context

**User prompt (verbatim):** (same as Step 4)

**Assistant interpretation:** Continue executing the Widget IR implementation plan and move from direct nodes toward semantic recipes.

**Inferred user intent:** Make the expanded Widget IR authoring surface ergonomic, not just technically complete.

### What I did
- Added recipe exports in `pkg/widgetdsl/module.go`:
  - `rag.recipes.contextDiagram(...)`
  - `rag.recipes.annotatedTranscript(...)`
  - `rag.recipes.courseStudio(...)`
  - `rag.recipes.courseSlide(...)`
  - `rag.recipes.handout(...)`
- Added helper functions:
  - `valueFromMap`
  - `copyIfPresent`
  - `componentNode`
  - `widgetNodeFromAny`
- Added `TestContextCourseHandoutRecipesAreJSONSerializable` in `pkg/widgetdsl/module_test.go`.

### Why
- Direct helpers are flexible but verbose for common product screens.
- Recipes let scripts speak in domain terms while still producing the same direct nodes that WidgetRenderer already supports.

### What worked
- `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1` passed.
- `pnpm --dir packages/rag-evaluation-site typecheck` passed.

### What didn't work
- N/A

### What I learned
- The recipe layer can stay small by expanding to high-level organisms such as `TranscriptWorkspacePanel`, `ContextDiagramPanel`, `CourseStudioShell`, `CourseSlidePanel`, and `HandoutDocumentShell`.
- `normalizeActionSpec` remains useful for recipe options such as `onAnnotationSelect`, `onNavigate`, and `onSelect`.

### What was tricky to build
- Recipes need to accept both direct option fields and bundled DTO-like objects. For example, `annotatedTranscript` accepts a `transcript` object but also allows override fields such as `selectedAnnotationId`.
- `courseStudio` needs to accept a `main` Widget IR node and put it into `children`, so the helper validates that `main` is actually a WidgetNode export.

### What warrants a second pair of eyes
- Review recipe option names for final author ergonomics: `view` maps to `initialView`, `onSelect` maps to `onDocumentSelectAction`, and `onAnnotationSelect` maps to `onAnnotationSelectAction`.
- Review whether default empty snapshot/page fallbacks should be permissive or should throw errors.

### What should be done in the future
- Add example xgoja pages using these recipes.
- Add bundled documentation for the new recipe API.

### Code review instructions
- Review `pkg/widgetdsl/module.go` recipe functions and helper functions.
- Review `pkg/widgetdsl/module_test.go` recipe serialization test.
- Validate with targeted Go tests.

### Technical details
- Recipes are pure expansions and do not call APIs, mutate state, or render HTML.

## Step 9: Final Documentation and Full Validation

I updated the package README with the expanded Widget IR coverage and ran the full validation set for the completed implementation slices. The README now points reviewers and authors to the grouped `Widget IR/Renderer/...` Storybook stories and documents that Goja authors can use both direct helpers and semantic recipes.

This final pass confirms that the expanded renderer, DSL helpers, schema entries, stories, and recipe tests all build together after the foundation, context diagram, transcript, course, handout, and recipe commits.

### Prompt Context

**User prompt (verbatim):** (same as Step 4)

**Assistant interpretation:** Continue through the implementation plan and leave the repo in a validated, documented state.

**Inferred user intent:** Return from swimming to a pushed branch with the expanded Widget IR work completed and reviewable.

### What I did
- Updated `packages/rag-evaluation-site/README.md` with a Widget IR coverage section.
- Ran final validation:
  - `pnpm --dir packages/rag-evaluation-site typecheck`
  - `pnpm --dir packages/rag-evaluation-site build`
  - `pnpm --dir packages/rag-evaluation-site exec storybook build --output-dir /tmp/rag-package-storybook-widget-ir-complete`
  - `go test ./pkg/widgetdsl ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1`
  - `docmgr doctor --ticket RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS --stale-after 30`

### Why
- The implementation added a large authoring surface; the README needed to summarize where to find examples and how authors should think about direct helpers versus semantic recipes.
- Final validation ensures the independent phase commits work together.

### What worked
- All final validation commands passed.
- `docmgr doctor` passed for the ticket.

### What didn't work
- N/A

### What I learned
- Grouped Storybook files are essential now; the old single `WidgetRenderer.stories.tsx` would be too large for this expanded surface.

### What was tricky to build
- The overall tricky part was keeping TypeScript, React renderer, Goja helpers, schema list, Storybook stories, and Go tests synchronized over multiple commits. The phase plan helped keep the surfaces aligned.

### What warrants a second pair of eyes
- Review the larger `WidgetRenderer.tsx` for readability. It may eventually need a registry or split renderer modules, but explicit cases were safer for this implementation.
- Review recipe naming and defaulting behavior before documenting it as permanent API.

### What should be done in the future
- Add xgoja example pages that use the new recipes end-to-end.
- Consider splitting `WidgetRenderer.tsx` by component family if it becomes hard to maintain.
- Add browser screenshot capture for the grouped Widget IR stories.

### Code review instructions
- Review commits in order:
  - foundation/atom/layout nodes
  - context diagram nodes
  - transcript annotation nodes
  - course handout nodes
  - semantic recipes
  - README/docs update
- Run the final validation commands above.

### Technical details
- Final Storybook build output: `/tmp/rag-package-storybook-widget-ir-complete`.

## Step 10: Tighten Course Handout Split-Pane Spacing

I fixed the visual issue reported in the Storybook `DocumentListAndPreviewToolbar` composition: the handout/document list and preview were pressed directly against the split divider, and the document-list side could read as too wide for a sidebar-like pane. The fix adds explicit split-pane gutter support and a constrained `sidebar` ratio for sidebar-plus-preview layouts.

The updated story now uses the new `sidebar` split ratio with a large gutter, so the document list has a bounded width and the markdown preview has breathing room next to the divider.

### Prompt Context

**User prompt (verbatim):** "http://localhost:6007/?path=/story/widget-ir-renderer-course-studio--document-list-and-preview-toolbar - no margin / padding next to the hand out pane, and the /tmp/pi-clipboard-f25dda9d-0b73-4851-99a2-9edf02df0198.png 

and the sidebar should have limited width /tmp/pi-clipboard-fdf77340-62d9-4fc4-a6b1-32d7ef7f25f7.png"

**Assistant interpretation:** Fix the Storybook course/handout split layout so the preview is padded away from the handout pane/divider and the left sidebar/list does not take too much width.

**Inferred user intent:** Improve visual polish and composition constraints for the reusable course/handout Widget IR examples.

### What I did
- Added `gutter?: 'none' | 'md' | 'lg'` to `SplitPane` and `SplitPaneWidgetProps`.
- Added `ratio: 'sidebar'` to `SplitPane` for fixed-ish sidebar/list compositions.
- Passed `gutter` through `WidgetRenderer`.
- Updated `DocumentListAndPreviewToolbar` to use `ratio: 'sidebar'` and `gutter: 'lg'`.
- Captured a verification screenshot at `course-handout-fixed.png`.

### Why
- `leftNarrow` was still proportional, so a sidebar/list could become too wide on large canvases.
- Divider-only split panes need optional inner padding for content that should not touch the divider.

### What worked
- `pnpm --dir packages/rag-evaluation-site typecheck` passed.
- `pnpm --dir packages/rag-evaluation-site build` passed.
- `pnpm --dir packages/rag-evaluation-site exec storybook build --output-dir /tmp/rag-package-storybook-widget-ir-layout-fix` passed.

### What didn't work
- N/A

### What I learned
- The handout/document list story is a good example of needing a semantic split mode beyond fractional `leftNarrow` / `rightNarrow` ratios.

### What was tricky to build
- The fix needed to be reusable at the layout primitive level rather than hard-coded into the story, because other Widget IR compositions may need the same gutter/sidebar behavior.

### What warrants a second pair of eyes
- Review whether `sidebar` should use `minmax(220px, 320px)` or a different max width.
- Review whether gutters should be applied symmetrically to both panes or have left/right-specific variants later.

### What should be done in the future
- Add a `SplitPane` Storybook example for the new `sidebar` ratio and gutter knobs.

### Code review instructions
- Start at `SplitPane.tsx` and `SplitPane.module.css`.
- Then review `WidgetRenderer.course-handout.stories.tsx` for the concrete fixed story.
- Re-open the reported Storybook URL and verify the left document list is constrained and the preview has padding near the divider.

### Technical details
- Storybook output for validation: `/tmp/rag-package-storybook-widget-ir-layout-fix`.

## Step 11: Add SidebarShell Content Padding for Layout Recipe Story

I also addressed the same spacing family in the `SidebarShellWithHeaderAndFooter` Widget IR story. The sidebar width itself was already reasonable, but the main content area needed an explicit inset so section content and embedded panels do not sit hard against the shell edge.

The fix adds reusable `contentPadding` support to `SidebarShell` and threads it through the Widget IR props/renderer. The layout recipe story now opts into `contentPadding: 'lg'` instead of relying on every caller to wrap children in a padded container.

### Prompt Context

**User prompt (verbatim):** "also here: http://localhost:6007/?path=/story/widget-ir-renderer-layout-recipes--sidebar-shell-with-header-and-footer"

**Assistant interpretation:** Apply the same visual spacing/polish fix to the SidebarShell layout recipe story.

**Inferred user intent:** Ensure layout primitives expose reusable spacing knobs so Storybook examples do not look flush or cramped.

### What I did
- Added `contentPadding?: 'none' | 'md' | 'lg'` to `SidebarShell`.
- Added `.contentPaddingMd` and `.contentPaddingLg` styles.
- Added `contentPadding` to `SidebarShellWidgetProps`.
- Passed `contentPadding` through `WidgetRenderer`.
- Updated `SidebarShellWithHeaderAndFooter` to use `contentPadding: 'lg'`.

### Why
- Sidebar shell content should be able to opt into shell-managed padding.
- This keeps padding responsibility with the layout primitive rather than requiring every story/caller to add wrapper nodes.

### What worked
- `pnpm --dir packages/rag-evaluation-site typecheck` passed.
- `pnpm --dir packages/rag-evaluation-site build` passed.
- `docmgr doctor --ticket RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS --stale-after 30` passed.

### What didn't work
- N/A

### What I learned
- `SidebarShell` and `SplitPane` both need explicit spacing APIs because Widget IR stories often compose raw layout nodes without app-page wrappers.

### What was tricky to build
- The change needed to preserve `SidebarShell`'s default app-shell behavior. The default remains `contentPadding: 'none'`, and individual stories/compositions opt in.

### What warrants a second pair of eyes
- Review whether future `CourseStudioShell` should pass its own content padding through `SidebarShell` instead of wrapping children in `CourseStudioShell.module.css`.

### What should be done in the future
- Add controls/stories for `SidebarShell.contentPadding`.

### Code review instructions
- Review `SidebarShell.tsx` and `SidebarShell.module.css` first.
- Then review `WidgetRenderer.layout-recipes.stories.tsx` to see the reported story using the new prop.

### Technical details
- The change is intentionally additive and keeps default content padding disabled for backwards-compatible layout behavior.

## Step 12: Expand the xgoja Widget Site with Transcript, Slide, Course, and Handout Examples

I moved from the React/Storybook side into the Goja/xgoja demo surface. The widget-site example now exposes multiple jsverb-authored pages that exercise the semantic recipes and direct component helpers for transcripts, annotations, anchored comments, slides, course shells, and handouts.

This makes the xgoja story concrete: JavaScript authors can serve rich React-rendered context-review pages from a generated xgoja binary without writing HTML or React code. The examples intentionally include both high-level recipes and lower-level direct component compositions so reviewers can compare authoring styles.

### Prompt Context

**User prompt (verbatim):** "add lots of examples around the transcripts and slides and handouts and all that. 

continue"

**Assistant interpretation:** Continue into the xgoja/widget-site layer and add many runnable examples for the newly supported semantic Widget IR families.

**Inferred user intent:** Validate the expanded Widget IR API from the actual JavaScript/xgoja authoring surface, not only React Storybook and Go unit tests.

### What I did
- Expanded `examples/xgoja/widget-site/verbs/sites.js` with richer fixtures:
  - context snapshot
  - transcript messages and annotations
  - anchored comments
  - course metadata and agenda
  - three slides
  - four handout documents
- Added xgoja page endpoints:
  - `/api/widget/pages/semantic`
  - `/api/widget/pages/transcripts`
  - `/api/widget/pages/slides`
  - `/api/widget/pages/handouts`
  - `/api/widget/pages/course-examples`
- Added direct component examples for:
  - `TranscriptWorkspacePanel`, `TranscriptReaderPanel`, `AnnotationRailPanel`, `AnchoredCommentRail`
  - `CourseSlidePanel`, `SlideShell`, `FigureBlock`, `KeyPointList`
  - `HandoutDocumentShell`, `DocumentListPanel`, `DocumentPreviewToolbar`, `MarkdownArticle`
  - `CourseLessonPanel`, `CourseStudioShell`
- Added lightweight action handlers for annotation/comment/document/agenda selections.
- Extended `examples/xgoja/widget-site/Makefile` smoke checks for the new pages.
- Updated provider docs for the expanded recipe set and example routes.

### Why
- The Goja DSL core already supported the new helpers and recipes, but the generated xgoja example still mostly demonstrated the older dashboard/action flow.
- Runnable jsverb examples are the strongest proof that the new semantic Widget IR surface works across the intended boundary.

### What worked
- `node --check examples/xgoja/widget-site/verbs/sites.js` passed.
- `go test ./pkg/widgetdsl ./pkg/xgoja/providers/widgetsite ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1` passed.
- `cd examples/xgoja/widget-site && make smoke` passed.

### What didn't work
- N/A

### What I learned
- The direct component helpers make xgoja pages expressive enough to demonstrate custom layouts, while recipes keep the common pages compact.
- The smoke test can cheaply verify semantic coverage by checking for expected component names in JSON page responses.

### What was tricky to build
- The examples needed to use the actual DTO shapes expected by React components, especially transcript annotations (`targetMessageId`, `label`, `text`) and course/handout document fields.
- It was important to keep the new pages JSON-first; no HTML strings or React-specific assumptions were added.

### What warrants a second pair of eyes
- Review whether the example data should be moved out of `sites.js` once it grows further.
- Review the action context keys used by the new action handlers against the renderer bindings.

### What should be done in the future
- Add browser-level visual smoke for the new xgoja pages.
- Consider adding a navigation page that links the demo, semantic, transcripts, slides, handouts, and course examples.

### Code review instructions
- Start with `examples/xgoja/widget-site/verbs/sites.js` and review each new `*ExamplesPage` function.
- Then review `examples/xgoja/widget-site/Makefile` smoke checks.
- Validate with `node --check`, targeted Go tests, and `make smoke` from the widget-site example directory.

### Technical details
- The xgoja example still serves the same embedded React app; only the Widget IR returned from jsverb endpoints changed.

## Step 13: Refresh Embedded xgoja App Assets and Browser-Check New Pages

After adding the xgoja semantic pages, the API responses were correct but the browser still showed `Unknown widget` for components such as `TranscriptWorkspacePanel` and `SplitPane`. The cause was a stale embedded SPA bundle in `examples/xgoja/widget-site/assets/public`; it had not been rebuilt from the current package app after the renderer gained the new component cases.

I rebuilt the package app bundle, re-synced it into the xgoja widget-site assets, reran the xgoja smoke test, and opened the transcript, slides, and handout pages in the browser. The pages now render without console warnings or unknown-widget messages.

### Prompt Context

**User prompt (verbatim):** "Unknown widget: TranscriptWorkspacePanel
Unknown widget: SplitPane
Unknown widget: SplitPane
Unknown widget: TranscriptWorkspacePanel"

**Assistant interpretation:** The xgoja-served frontend is using a stale renderer bundle that does not know the newly added Widget IR component types.

**Inferred user intent:** Make the runnable xgoja demo actually render the new semantic examples in the browser, not just return valid JSON.

### What I did
- Ran `pnpm --dir packages/rag-evaluation-site build:app` to rebuild `app-dist`.
- Ran `make sync-app` in `examples/xgoja/widget-site` to refresh embedded public assets.
- Ran `make smoke` in `examples/xgoja/widget-site`.
- Restarted the local generated xgoja site on `127.0.0.1:18793`.
- Browser-checked:
  - `/pages/transcripts`
  - `/pages/slides`
  - `/pages/handouts`
- Captured `xgoja-transcripts-fixed.png` after the fix.

### Why
- xgoja embeds a static React app bundle; updating Widget IR server JSON is not enough if the embedded app bundle predates the new renderer cases.

### What worked
- The refreshed xgoja pages rendered expected headings such as `Transcript components`, `Slide examples`, and `Handout components`.
- Browser console warnings/errors were clean after navigation.
- `make smoke` passed after asset sync.

### What didn't work
- The first browser check showed `Unknown widget` because the embedded assets were stale.

### What I learned
- The xgoja workflow needs an explicit `build:app` + `sync-app` step whenever renderer support changes.
- `make smoke` validates JSON/API coverage but does not alone prove that the embedded browser bundle has current renderer code unless assets were synced first.

### What was tricky to build
- The symptom looked like a DSL/server issue, but the API returned the expected component types. The actual problem was the client bundle version boundary between `packages/rag-evaluation-site/app-dist` and `examples/xgoja/widget-site/assets/public`.

### What warrants a second pair of eyes
- Consider making `make smoke` depend on `sync-app` or adding a separate `smoke-fresh` target to prevent stale embedded assets.

### What should be done in the future
- Add a browser smoke target for the generated xgoja site that fails on `Unknown widget` text.

### Code review instructions
- Review the refreshed files under `examples/xgoja/widget-site/assets/public`.
- Validate with `pnpm --dir packages/rag-evaluation-site build:app`, `make sync-app`, and `make smoke`.

### Technical details
- The old embedded asset hash was replaced by the current app bundle hash after `build:app`.

## Step 14: Make xgoja Demo Navigation Pages Distinct and Verify Row Switching

I browsed the generated xgoja site and confirmed the user-reported issue: `/pages/index`, `/pages/demo`, and `/pages/actions` all rendered the same dashboard because all three routes returned `widgetPage(...)`. The row-selection interaction actually worked once clicked, but the page copy and repeated routes made it look like panes were not switching.

I split the three default pages into distinct pages and added an expanded top navigation that also exposes the semantic examples. The overview page now introduces the example set, the queue page focuses on the master-detail table and explicitly says that clicking rows switches the detail pane, and the actions page focuses on server-action buttons plus audit output.

### Prompt Context

**User prompt (verbatim):** "after clicking on the xgoja widget actions demo, all three pages are the same (/pages/index, /pages/demo, /pages/actions), i can't switch panes in the demo page either. you browse around and check things a bit."

**Assistant interpretation:** Inspect the running xgoja site in the browser, verify the navigation and interaction behavior, then fix the repeated default pages and make the demo clearer.

**Inferred user intent:** Make the generated xgoja demo feel like a real multi-page example site and ensure interactive panes/actions are discoverable.

### What I did
- Added shared `navItems` and `pageMeta(...)` in `examples/xgoja/widget-site/verbs/sites.js`.
- Added distinct pages:
  - `overviewPage("index")`
  - `widgetPage("demo")` for the queue/master-detail table
  - `actionsPage("actions")` for server action controls and audit trail
- Updated all semantic example pages to use shared nav metadata.
- Updated the Makefile smoke assertion from `Queue controls` to `Query queue` for the queue demo page.
- Browsed the local xgoja site and verified:
  - `/pages/index` shows overview/browse content.
  - `/pages/demo` shows queue-specific content.
  - `/pages/actions` shows actions-specific content.
  - Clicking the `Arborvitae Spacing` row changes the selected detail pane to ID `2` / `Arborvitae Spacing`.
  - Clicking `Add query` on the actions page refreshes and shows `Follow-up Query`.

### Why
- Reusing the same page for index/demo/actions was technically valid but made the demo confusing.
- The expanded semantic examples need visible navigation so users can discover them from the embedded site.

### What worked
- `node --check examples/xgoja/widget-site/verbs/sites.js` passed.
- `go test ./pkg/widgetdsl ./pkg/xgoja/providers/widgetsite ./pkg/widgetrunner ./pkg/widgetserver ./pkg/widgetschema -count=1` passed.
- `cd examples/xgoja/widget-site && make smoke` passed.
- Browser navigation and row/action interactions worked on the restarted xgoja site.

### What didn't work
- The original `/pages/index`, `/pages/demo`, and `/pages/actions` were indistinguishable because they all called the same page builder.
- Waiting for audit text on the queue page was the wrong browser assertion after splitting pages; the queue page intentionally no longer shows the audit panel.

### What I learned
- Page metadata is important for xgoja examples: custom `navItems` and `activeNavItemId` make the default React app shell much more useful.
- Interaction was functioning, but unclear page boundaries made it hard to tell.

### What was tricky to build
- The split needed to preserve existing smoke tests and action endpoints while changing the page shape. Keeping the action handlers shared allowed the queue page and actions page to exercise the same backend state.

### What warrants a second pair of eyes
- Review whether the top nav now has too many items for narrow widths.
- Review whether `/pages/context`, `/pages/course`, and `/pages/handout` should remain as compatibility aliases or be removed in favor of the richer pages.

### What should be done in the future
- Add browser smoke that clicks nav items and verifies page-specific text.
- Add browser smoke that clicks a row and asserts selected detail text changes.

### Code review instructions
- Review `examples/xgoja/widget-site/verbs/sites.js`, especially `overviewPage`, `widgetPage`, `actionsPage`, `navItems`, and route handlers.
- Rebuild/run the xgoja site and browse `/pages/index`, `/pages/demo`, and `/pages/actions`.

### Technical details
- The queue page still uses `rag.recipes.masterDetailTable` with `onRowSelect: "select-query"`.
- The actions page uses the same server state and exposes toolbar buttons plus a compact row table.

## Step 15: Fill Out the xgoja Widget DSL API Reference for New Semantic Components

I checked the provider help documentation and found that the xgoja docs covered the new semantic recipes and mentioned the new direct helpers, but the API reference did not yet enumerate all new helpers or document the DTO/prop shapes needed to use transcripts, slides, course pages, handouts, context diagrams, and split/sidebar layout from JavaScript.

I expanded the JavaScript API reference so xgoja authors have a single place to look up the new helper names, expected JSON DTO shapes, action context behavior, and example compositions.

### Prompt Context

**User prompt (verbatim):** "do we have documentation api reference for all the new xgoja"

**Assistant interpretation:** Verify whether the xgoja/widget.dsl API reference fully documents the expanded Widget IR surface, and close any documentation gap.

**Inferred user intent:** Make the new xgoja authoring surface discoverable and usable without reading TypeScript or Storybook source.

### What I did
- Inspected `pkg/xgoja/providers/widgetsite/doc/02-widget-dsl-js-api-reference.md`.
- Confirmed recipe docs existed, but direct helper/API reference coverage was incomplete.
- Added all new semantic helper names to the component helper table.
- Added a `Semantic component props and DTO shapes` section covering:
  - context-window snapshots and diagram helpers
  - transcript messages/annotations and transcript workspace/reader/rail helpers
  - anchored comments
  - course, agenda, slide, studio, and custom slide helpers
  - handout/document bundle helpers
  - `SplitPane` gutter/sidebar ratio and `SidebarShell.contentPadding`
- Added examples for direct helpers and recipes using xgoja-friendly JSON data.

### Why
- The xgoja example now has many semantic pages; the help reference needed to match that authoring surface.
- Authors should not have to infer DTO shapes from TypeScript interfaces.

### What worked
- `go test ./pkg/xgoja/providers/widgetsite ./pkg/widgetdsl -count=1` passed.

### What didn't work
- N/A

### What I learned
- The docs had recipe coverage but not full direct-helper coverage; this was an important gap after adding the rich xgoja examples.

### What was tricky to build
- The API reference needed to balance completeness with readability. I documented the common DTO fields and examples rather than duplicating every TypeScript interface verbatim.

### What warrants a second pair of eyes
- Review whether every documented prop name exactly matches the React/IR interface, especially action props and layout options.

### What should be done in the future
- Consider generating part of the helper table from `pkg/widgetdsl/module.go` to avoid drift.

### Code review instructions
- Review `pkg/xgoja/providers/widgetsite/doc/02-widget-dsl-js-api-reference.md`, especially the new semantic component section.
- Validate with provider/widgetdsl Go tests.

### Technical details
- This is provider help documentation embedded through the widget-site xgoja provider docs FS.
