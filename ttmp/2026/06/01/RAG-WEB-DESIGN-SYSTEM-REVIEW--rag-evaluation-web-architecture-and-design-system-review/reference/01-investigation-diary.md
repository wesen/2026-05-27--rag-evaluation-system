---
Title: Investigation Diary
Ticket: RAG-WEB-DESIGN-SYSTEM-REVIEW
Status: active
Topics:
    - rag
    - react
    - design-system
    - css
    - dmeta
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/design-doc/01-rag-evaluation-web-architecture-and-design-system-review.md
      Note: Primary report produced by the investigation
    - Path: web/src/App.tsx
      Note: App shell and navigation event evidence
    - Path: web/src/components/search/SearchView.tsx
      Note: First recommended vertical-slice evidence
    - Path: web/src/index.css
      Note: CSS/design-system evidence
    - Path: web/src/services/api.ts
      Note: API contract evidence
ExternalSources: []
Summary: Chronological diary for the RAG Evaluation web architecture and design-system/DMETA review.
LastUpdated: 2026-06-01T00:00:00-04:00
WhatFor: Use this diary to understand how the RAG web review was investigated, what commands were run, what failed, and how to continue.
WhenToUse: Read before continuing the RAG web design-system or DMETA IR implementation work.
---


# Diary

## Goal

Capture the investigation and delivery steps for a detailed intern-facing review of the `2026-05-27--rag-evaluation-system` web application, with recommendations based on the design-system and DMETA IR playbook.

## Step 1: Create the Ticket and Map the Web System

I created a new docmgr ticket inside the RAG Evaluation System repository using the repository-local `ttmp` root, then inspected the React app, CSS, RTK Query API layer, Go API handlers, embedded-SPA server, and prior RAGEVAL design documents. The review treats the current React/CSS implementation as evidence and evaluates it against the layered design-system + DMETA approach from the previous TTC documents.

The investigation showed that the web app is already a useful developer dashboard: it has search, corpus exploration, workflows, embeddings, pipeline overview, and a placeholder evaluation view. The main issue is not missing product value; it is missing architectural ownership. Global CSS, inline styles, large page files, and implicit domain concepts need to be turned into tokens, primitives, component layers, DMETA IR, and validators.

### Prompt Context

**User prompt (verbatim):** "ok, let's go through 2026-05-27--rag-evaluation-system and create a new ticket in that 2026-05-27--rag-evaluation-system/ttmp (using docmgr --root ...) and study the whole web stuff in there and make a full report, according to these review and organization document we just wrote.

Create  a detailed analysis / design / review that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and the nupload to remarkable."

**Assistant interpretation:** Create a new RAG-local docmgr ticket, audit the whole web/UI/API surface, write a detailed technical report for an intern using the design-system/DMETA guidance just produced, and upload it to reMarkable.

**Inferred user intent:** The user wants a durable onboarding and architecture report that explains the current RAG web system and gives a concrete path to formalize it into a design system plus DMETA IR.

**Commit (code):** N/A — documentation/review step.

### What I did

- Ran `docmgr --root ttmp` from inside `2026-05-27--rag-evaluation-system` to create ticket `RAG-WEB-DESIGN-SYSTEM-REVIEW`.
- Created:
  - `design-doc/01-rag-evaluation-web-architecture-and-design-system-review.md`
  - `reference/01-investigation-diary.md`
- Inspected frontend files under `web/src`, including:
  - `App.tsx`
  - `services/api.ts`
  - `store/index.ts`
  - `index.css`
  - `SearchView.tsx`
  - `CorpusExplorerView.tsx`
  - `DocumentInspector.tsx`
  - `WorkflowsView.tsx`
  - `EmbeddingsView.tsx`
  - `PipelineView.tsx`
  - `EvaluationView.tsx`
  - `components/retro/*`
- Inspected backend/server files needed to understand the web system:
  - `cmd/rag-eval/cmds/serve/server.go`
  - `cmd/rag-eval/cmds/serve/root.go`
  - `internal/web/spa.go`
  - `internal/api/handlers.go`
  - `internal/api/workflow_artifact_handlers.go`
  - `internal/db/db.go`
- Inspected prior ticket documents for context:
  - RAGEVAL-003 corpus explorer design
  - RAGEVAL-004 retrieval UX/status design
  - RAGEVAL-007 workflow UI design
- Ran static scans for file sizes, global class usage, inline style counts, custom events, and absence of `.module.css`, `.stories.tsx`, and `dmeta-ir` files.
- Attempted a frontend build.

### Why

- The report needs to be evidence-backed and useful for a new intern.
- The RAG app is a complex dashboard candidate, so the review must explain product concepts, UI views, API data flow, CSS/design-system state, and future DMETA IR boundaries.
- The previous TTC playbook says to begin with the current UI as evidence, not as architecture; this investigation follows that method.

### What worked

- The repository already has a local `ttmp` and existing RAGEVAL ticket history.
- The React source tree is compact enough to audit completely.
- The backend API route registry and RTK Query layer line up well, making data flow understandable.
- Prior RAGEVAL docs provide useful product context for corpus, retrieval, and workflow UX.

### What didn't work

- `pnpm build` failed because frontend dependencies were not installed in `web/node_modules`:

```text
> web@0.0.0 build /home/manuel/workspaces/2026-05-27/ttc-design-system/2026-05-27--rag-evaluation-system/web
> tsc && vite build

sh: 1: tsc: not found
 ELIFECYCLE  Command failed.
 WARN  Local package.json exists, but node_modules missing, did you mean to install?
```

- I did not run `pnpm install` because the task is a documentation/review pass and the failure itself is useful validation evidence for the report.

### What I learned

- The web app is not merely a placeholder. It already exposes real RAG workflows: BM25/vector/hybrid search, corpus inspection, document/chunk/embedding coverage, workflow orchestration, queue health, and embedding similarity.
- The highest leverage refactor is not visual redesign; it is ownership extraction: tokens, foundation primitives, layout primitives, component layers, Storybook, DMETA IR, and validators.
- `SearchView.tsx` is the best first vertical slice because it touches query composition, retrieval results, coverage, result inspection, and corpus navigation.

### What was tricky to build

- The tricky part was avoiding a superficial CSS cleanup report. The current CSS is coherent and useful; the problem is not that it exists, but that one global CSS file owns too many layers. The report therefore recommends preserving the retro monochrome language while extracting ownership boundaries.
- Another tricky part was deciding how much backend context to include. The report focuses on backend files only when they explain the web app: server wiring, API routes, database concepts, corpus/search/workflow handlers, and endpoint contracts.

### What warrants a second pair of eyes

- Whether the first DMETA vertical slice should be Search-first, as recommended, or Corpus-first because Corpus Explorer has the richest explanatory model.
- Whether the retro `components/retro/*` files should be deleted or revived as part of the future primitive layer.
- Whether cross-view navigation should move to React Router, route params, or a small typed dashboard navigation store.

### What should be done in the future

- Install frontend dependencies and run `pnpm build` to separate dependency issues from TypeScript issues.
- Implement the first Search Workbench design-system/DMETA vertical slice.
- Add a `dmeta-ir` directory with human-readable YAML fields for core model, Interaction IR, Web MDS templates, and lowering rules.

### Code review instructions

- Start with the design doc:
  - `ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/design-doc/01-rag-evaluation-web-architecture-and-design-system-review.md`
- Compare claims against:
  - `web/src/App.tsx`
  - `web/src/services/api.ts`
  - `web/src/index.css`
  - `web/src/components/search/SearchView.tsx`
  - `web/src/components/corpus/CorpusExplorerView.tsx`
  - `web/src/components/workflows/WorkflowsView.tsx`
  - `internal/api/handlers.go`
  - `internal/api/workflow_artifact_handlers.go`
- Validate ticket hygiene with:
  - `docmgr --root ttmp doctor --ticket RAG-WEB-DESIGN-SYSTEM-REVIEW --stale-after 30`

### Technical details

Useful commands from the investigation:

```bash
cd 2026-05-27--rag-evaluation-system

docmgr --root ttmp status --summary-only
find web/src -maxdepth 5 -type f | sort
rg -n "rag:navigate|className=|style=\{\{" web/src -S
find . -maxdepth 3 \( -name '*dmeta*' -o -name 'dmeta-ir' -o -name '*.stories.tsx' -o -name '*.module.css' \) -print
cd web && pnpm build
```

## Step 2: Validate and Upload the Report

I completed the delivery loop by resolving docmgr vocabulary warnings, rerunning `docmgr doctor`, and uploading the report bundle to reMarkable. The final bundle includes both the primary review and this investigation diary.

The upload completed successfully and returned the expected `OK: uploaded` message.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Finish ticket hygiene and deliver the intern-facing RAG web review as a reMarkable PDF bundle.

**Inferred user intent:** The user wants the report stored in the RAG ticket workspace and available for offline reading/review.

**Commit (code):** N/A — documentation/review step.

### What I did

- Related key web, API, server, database, and ticket files to the design doc and diary.
- Added missing vocabulary entries for ticket topics:
  - `react`
  - `css`
  - `design-system`
  - `dmeta`
- Ran:
  - `docmgr --root ttmp doctor --ticket RAG-WEB-DESIGN-SYSTEM-REVIEW --stale-after 30`
- Ran a reMarkable dry run for the report bundle.
- Uploaded the report bundle to:
  - `/ai/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW`

### Why

- The ticket should pass docmgr validation before handoff.
- The reMarkable bundle is the requested delivery artifact for reading and review.

### What worked

- After adding vocabulary entries, `docmgr doctor` reported `All checks passed`.
- The dry run showed the expected report and diary inputs.
- The real upload returned: `OK: uploaded RAG Web Architecture Design System Review.pdf -> /ai/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW`.

### What didn't work

- The first `docmgr doctor` run warned that `css`, `design-system`, `dmeta`, and `react` were unknown topics in the RAG repository vocabulary. I resolved this by adding the topic slugs to `ttmp/vocabulary.yaml` with `docmgr --root ttmp vocab add`.

### What I learned

- The RAG repository's docmgr vocabulary was narrower than the TTC design-system vocabulary, so design-system review tickets need explicit topic additions before doctor passes.

### What was tricky to build

- The subtle part was using the RAG repository's local docmgr root and vocabulary rather than the outer workspace's TTC docmgr configuration. Running docmgr from inside `2026-05-27--rag-evaluation-system` with `--root ttmp` used the correct local `.ttmp.yaml` and vocabulary.

### What warrants a second pair of eyes

- The added vocabulary entries should be acceptable for future RAG web/design-system tickets; if the project prefers `ui` or `design` only, the topic taxonomy can be revisited.

### What should be done in the future

- Commit the ticket documents and vocabulary update.
- Start a follow-up implementation ticket for the Search Workbench vertical slice.

### Code review instructions

- Confirm `docmgr --root ttmp doctor --ticket RAG-WEB-DESIGN-SYSTEM-REVIEW --stale-after 30` passes.
- Confirm the uploaded PDF path in the final handoff.

### Technical details

Validation and upload commands:

```bash
cd 2026-05-27--rag-evaluation-system

docmgr --root ttmp doctor --ticket RAG-WEB-DESIGN-SYSTEM-REVIEW --stale-after 30

remarquee upload bundle \
  2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/design-doc/01-rag-evaluation-web-architecture-and-design-system-review.md \
  2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/reference/01-investigation-diary.md \
  --name "RAG Web Architecture Design System Review" \
  --remote-dir "/ai/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW" \
  --toc-depth 2 \
  --non-interactive
```
