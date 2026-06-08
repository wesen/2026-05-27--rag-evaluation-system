---
Title: Research Logbook
Ticket: RAGEVAL-CONTEXT-WINDOWS-DESIGN
Status: active
Topics:
    - design-system
    - frontend-architecture
    - react
    - rag
    - ui-dsl
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/scripts/01_capture_go_minitrace_help.sh
      Note: Captures go-minitrace help pages that shaped the transcript-search workflow
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/scripts/02_convert_relevant_pi_sessions.sh
      Note: Converts relevant Pi session stores before querying
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/scripts/03_candidate_session_search.sql
      Note: DuckDB session-ranking query used in the first evidence pass
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/scripts/query-commands/design/web-playbook-search.js
      Note: JS query command used to search tool-call evidence
    - Path: ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration/sources/01-recovered-design-docs.md
      Note: |-
        Compact catalog generated from the recovered resources
        Compact catalog generated from recovered resources
ExternalSources: []
Summary: Logbook of resources read during the go-minitrace/minitrace-session-search process, with usefulness, staleness, and update notes for future transcript investigations.
LastUpdated: 2026-06-07T16:14:50-04:00
WhatFor: Use this before repeating a session-log search so the next agent knows which resources, help pages, scripts, and recovered documents were useful or stale.
WhenToUse: Before using go-minitrace to search prior Pi/Codex sessions, or before updating the frontend/design-system recovery workflow.
---


# Research Logbook

## Goal

Track every resource consulted during the minitrace-based search for prior frontend/design-system playbooks, with explicit notes on usefulness, staleness, and update needs. This is meant to be a better starting point the next time we need to mine Pi/Codex session logs for project knowledge.

## Context

This logbook belongs to ticket `RAGEVAL-CONTEXT-WINDOWS-DESIGN`. The immediate research task was to find design-system and `web/` contribution guidance that had likely been written in earlier Pi sessions. The search used:

- `go-minitrace help --all` and focused help pages;
- conversion of relevant Pi session stores;
- DuckDB SQL over `.minitrace.json` archives;
- a reusable JS query command using `require("minitrace")`;
- git history as a second evidence channel;
- docmgr ticket/document discovery after candidate sessions pointed to likely tickets.

## Quick Reference: Resource Status

| Resource | Status | Use next time? | Main reason |
|---|---:|---:|---|
| `go-minitrace-transcript-analysis` skill | Useful | Yes | Best workflow overview and caveats for Pi/Codex transcript analysis. |
| `references/queries.md` | Useful | Yes | Compact schema/query reminder for `sessions_base`, `turns`, and `tool_calls`. |
| `go-minitrace help --all` | Partly useful | Yes, but not enough alone | Good index, but short in this installed version. |
| `go-minitrace help query-commands` | Useful | Yes | Explains raw DuckDB versus structured command paths. |
| `go-minitrace help query-duckdb` | Useful | Yes | Needed for `--archive-glob`, presets, and SQL-file usage. |
| `go-minitrace help structured-query-commands` | Useful | Yes | Needed for JS command repository layout and command invocation. |
| `go-minitrace help js-api-reference` | Useful | Yes | Needed for `require("minitrace")`, `mt.query`, `mt.tableName`, escaping helpers. |
| `go-minitrace help writing-duckdb-queries` | Useful | Yes | Needed for JSON/UNNEST query patterns. |
| `scripts/01_capture_go_minitrace_help.sh` | Useful | Yes | Makes help capture reproducible inside the ticket. |
| `scripts/02_convert_relevant_pi_sessions.sh` | Useful but narrow | Yes, edit sources | Converts the two RAG workspace Pi session roots. |
| `scripts/03_candidate_session_search.sql` | Useful first pass | Yes, tune terms | High-recall session ranking across turns and tool calls. |
| `scripts/query-commands/design/web-playbook-search.js` | Useful prototype | Yes, improve scoring | Demonstrates reusable JS command path. |
| `scripts/04_git_frontend_history.sh` | Useful | Yes | Git history found the original design-system guideline commit quickly. |
| `scripts/05_catalog_recovered_design_docs.py` | Useful | Yes, generalize | Produces a compact resource index once likely docs are known. |
| `sources/candidate-session-search.json` | Useful evidence | Yes | Shows ranked sessions and why they matched. |
| `sources/web-playbook-evidence.json` | Mixed | Yes, with filtering | Finds tool-call evidence, but includes current-session/self hits. |
| `sources/git/frontend-history.tsv` | Useful | Yes | Gives commit timeline for frontend/design-system changes. |
| `sources/01-recovered-design-docs.md` | Useful | Yes | Best compact index of recovered frontend/design docs. |
| `RAG React Design System Guidelines` | Very useful | Yes | Closest thing to the missing frontend contribution playbook. |
| `RAG Design System Guideline Audit` | Useful | Yes | Shows concrete component-by-component cleanup targets. |
| `Styling and Design Reference` | Very useful | Yes | Current visual language and CSS/token rules. |
| `Widget Hierarchy and Interaction Reference` | Very useful | Yes | Current hierarchy and Widget IR/interaction model. |
| `Widget DSL Visual Quality Analysis` | Useful | Yes | Explains token/shell/recipe gaps in standalone Widget DSL pages. |
| `WidgetRenderer Packaging Architecture` | Useful | Yes | Explains package/default-app architecture. |
| `UI DSL and Kanban DSL Design Guide` | Historical | Selectively | Useful context but partly superseded by Widget IR direction. |
| `RAG Widget DSL Component-to-HTML Mapping` | Partly stale | Selectively | One-to-one HTML mapping was later revised. |
| `Review and Revised Implementation Guide for RAG Widget DSL` | Useful | Yes | Corrects stale assumptions from the earlier DSL proposal. |
| Obsidian article on RAG React Design System | Useful narrative | Yes | Good chronological explanation, but outside docmgr. |
| `packages/rag-evaluation-site/README.md` | Out of date/incomplete | Yes, update | Usage only; missing contribution/design-system links. |
| `ttmp/_guidelines/playbook.md` | Generic | Rarely | Useful only for doc structure, not frontend/minitrace specifics. |

## Detailed Resource Notes

### 1. go-minitrace transcript-analysis skill

- **What I was researching:** How to inspect previous Pi sessions without hand-reading raw JSONL.
- **What I was looking for in this document:** A safe workflow for discovering sessions, converting only relevant subsets, querying archives, and preserving reproducible scripts.
- **Why I chose it:** The user explicitly asked to use `go-minitrace`; this skill is the project-specific operating guide for transcript analysis.
- **How I found it:** It was available in the loaded skill list as `go-minitrace-transcript-analysis`.
- **Useful:** Native session locations, conversion caveats, query-first workflow, and the instruction to read built-in help before inventing queries.
- **Not useful:** It is generic; it does not know this repo's two RAG workspace session roots.
- **Out of date / wrong:** It says to use bundled scripts under the skill directory, but for this ticket we correctly created ticket-local scripts instead.
- **Needs updating:** Add a short example for avoiding current-session self-hits when querying freshly converted archives.

### 2. `go-minitrace-transcript-analysis/references/queries.md`

- **What I was researching:** Stable JSON paths and SQL patterns for minitrace archives.
- **What I was looking for:** How to access `environment`, `metrics`, `timing`, `turns`, and `tool_calls` from DuckDB.
- **Why I chose it:** The skill explicitly says to read this reference before custom SQL.
- **How I found it:** Linked from the go-minitrace skill.
- **Useful:** Confirmed `sessions_base`, `UNNEST(tool_calls)`, and JSON operators such as `environment->>'agent_framework'`.
- **Not useful:** It does not include a ready-made full-text search query over both turns and tool outputs.
- **Out of date / wrong:** No observed wrong content.
- **Needs updating:** Add a recipe for keyword/ranking search over `turns` and `tool_calls` because that is the most common “find prior work” workflow.

### 3. `go-minitrace help --all`

- **What I was researching:** The full embedded help catalog and whether there were already commands for SQL/JS transcript search.
- **What I was looking for:** Query command names, DuckDB guidance, JS verb guidance, and built-in examples.
- **Why I chose it:** The user explicitly requested `go-minitrace help --all` first.
- **How I found it:** Direct user instruction.
- **Useful:** It listed the available help topics.
- **Not useful:** In this installed version it produced only an index-like 45-line output, not the complete content of every help topic.
- **Out of date / wrong:** The name `--all` implies exhaustive output, but practically it was not enough for implementation.
- **Needs updating:** Either make `--all` include full topic bodies or document that users should capture focused pages after `--all`.

### 4. Focused go-minitrace help pages

Resources: `query-commands`, `query-duckdb`, `structured-query-commands`, `js-api-reference`, `writing-duckdb-queries`.

- **What I was researching:** How to run saved SQL files and create a JS query command repository.
- **What I was looking for:** CLI flags, archive loading, command repository conventions, JS API functions, and JSON query idioms.
- **Why I chose them:** `help --all` listed them and the skill recommended them.
- **How I found them:** Captured by `scripts/01_capture_go_minitrace_help.sh`.
- **Useful:** These pages were enough to create both `03_candidate_session_search.sql` and `web-playbook-search.js`.
- **Not useful:** They did not provide a complete, copy/paste keyword-search command for prior-design-doc recovery.
- **Out of date / wrong:** No observed wrong content. The SQL regexp failure came from my regex, not the docs.
- **Needs updating:** Add a “session knowledge recovery” worked example combining session ranking, current-session exclusion, and evidence snippets.

### 5. `scripts/01_capture_go_minitrace_help.sh`

- **What I was researching:** How to make the help-reading phase reproducible.
- **What I was looking for:** A script that future agents can rerun without remembering which help pages were relevant.
- **Why I chose it:** The user requested all scripts be stored in the ticket.
- **How I found it:** I wrote it from the go-minitrace skill/help guidance.
- **Useful:** Captures exactly the help pages used for the research.
- **Not useful:** It only captures current installed help; it does not pin a go-minitrace version.
- **Out of date / wrong:** Not wrong, but it is ticket-specific.
- **Needs updating:** Add `go-minitrace version` capture if the CLI exposes it, or `which go-minitrace` plus checksum if not.

### 6. `scripts/02_convert_relevant_pi_sessions.sh`

- **What I was researching:** Which Pi transcript stores correspond to this workspace.
- **What I was looking for:** A repeatable conversion step for the RAG evaluation system sessions.
- **Why I chose it:** The minitrace workflow requires conversion before DuckDB querying.
- **How I found it:** `ls ~/.pi/agent/sessions | grep -i rag` showed two relevant roots.
- **Useful:** Converted 18 sessions across the outer workspace and nested repo checkout.
- **Not useful:** It does not include Codex sessions or other related repos like `ttc-design-system`.
- **Out of date / wrong:** No wrong behavior, but the source list is hard-coded.
- **Needs updating:** Parameterize source roots and add optional Codex staging/conversion for cross-agent searches.

### 7. `scripts/03_candidate_session_search.sql`

- **What I was researching:** Which sessions likely contain design-system, playbook, and `web/` contribution material.
- **What I was looking for:** Ranked candidate sessions with snippets and hit categories.
- **Why I chose it:** SQL can scan all converted sessions cheaply and reproducibly.
- **How I found it:** I wrote it after inspecting minitrace JSON shape with `jq` and the query reference.
- **Useful:** Ranked session `019e8afc-89d8-7f43-95d0-e7f6be234ee4` highest and surfaced the recent design reference sessions.
- **Not useful:** High recall means false positives; generic terms like `react` and `web/` match many implementation sessions.
- **Out of date / wrong:** It includes the current session when the current session has already been converted.
- **Needs updating:** Add filters for `started_at < current_ticket_start`, session IDs to exclude, and weighted phrase groups configurable outside the SQL.

### 8. `scripts/query-commands/design/web-playbook-search.js`

- **What I was researching:** Whether go-minitrace JS command handlers are worth using for richer evidence search.
- **What I was looking for:** A reusable command shape for future transcript-mining tasks.
- **Why I chose it:** The user explicitly mentioned SQL plus jsverb scripting capabilities.
- **How I found it:** Created from `structured-query-commands` and `js-api-reference` help.
- **Useful:** Demonstrates a local query repository and a JS command wrapping `mt.query(...)`.
- **Not useful:** Current scoring is still mostly SQL-in-JS and not much smarter than the SQL file.
- **Out of date / wrong:** First run had an invalid regex (`write(`), fixed to `write[(]`.
- **Needs updating:** Move scoring/post-processing into JS, dedupe self-hits, and output grouped sessions with top evidence snippets per resource.

### 9. `scripts/04_git_frontend_history.sh`

- **What I was researching:** Whether git history could find committed design-system docs faster than transcript search.
- **What I was looking for:** Commit messages and touched files under `web`, `packages/rag-evaluation-site`, `internal/web`, and widget packages.
- **Why I chose it:** The user allowed git/sqlite/other richer searches to avoid manual reading.
- **How I found it:** Wrote it after minitrace pointed to design-system docs and tickets.
- **Useful:** Quickly identified `1cb51dd docs: audit RAG design system guidelines`.
- **Not useful:** Git history does not explain why a document was written unless commit messages are descriptive.
- **Out of date / wrong:** First version computed the repo root incorrectly and failed with `fatal: not a git repository`.
- **Needs updating:** Compute the repo root with `git -C "$TICKET_DIR" rev-parse --show-toplevel` instead of counting parent directories.

### 10. `scripts/05_catalog_recovered_design_docs.py`

- **What I was researching:** How to produce a compact index of the recovered documents without reading every full file in the chat context.
- **What I was looking for:** Titles, summaries, `WhatFor`, and first headings.
- **Why I chose it:** The recovered docs are long; a catalog makes handoff and re-use easier.
- **How I found it:** Wrote it after SQL/git identified likely docs.
- **Useful:** Created `sources/01-recovered-design-docs.md`, the best quick index for the recovered material.
- **Not useful:** It needs a manually curated `DOCS` list.
- **Out of date / wrong:** First version used `parents[5]`, which resolved to `ttmp` rather than repo root; fixed to `parents[6]`.
- **Needs updating:** Discover docs from `candidate-session-search.json`, git output, and docmgr metadata automatically.

### 11. `sources/candidate-session-search.json`

- **What I was researching:** Which sessions to inspect first.
- **What I was looking for:** Session IDs, titles, hit counts, and first snippets.
- **Why I chose it:** This is the saved output from the first SQL search.
- **How I found it:** Generated by `03_candidate_session_search.sql`.
- **Useful:** It explains why sessions were chosen and preserves evidence for future review.
- **Not useful:** It includes current-ticket noise after this session creates new matching terms.
- **Out of date / wrong:** Not wrong, but timestamp-relative interpretation matters.
- **Needs updating:** Regenerate after adding exclusion filters.

### 12. `sources/web-playbook-evidence.json`

- **What I was researching:** Tool-call-level evidence for design playbook creation or discovery.
- **What I was looking for:** Commands and outputs mentioning docs, paths, and design-system terms.
- **Why I chose it:** Tool outputs often include doc paths that are easier to follow than prose turns.
- **How I found it:** Generated by the JS query command.
- **Useful:** Surfaced docmgr ticket creation/output and file path evidence.
- **Not useful:** The top rows include the current session because it also mentions the target terms.
- **Out of date / wrong:** Not wrong, but the ranking is polluted without self-exclusion.
- **Needs updating:** Exclude current session and group by older session/document path.

### 13. `sources/git/frontend-history.tsv`

- **What I was researching:** The actual commit timeline for frontend/design-system work.
- **What I was looking for:** Commits likely to have introduced guidelines, audits, components, and packaging.
- **Why I chose it:** Git is authoritative for committed artifacts and often faster than transcript mining.
- **How I found it:** Generated by `04_git_frontend_history.sh`.
- **Useful:** Found the design-system guideline audit commit and showed the design-system extraction sequence.
- **Not useful:** It does not include uncommitted session artifacts or Obsidian vault notes.
- **Out of date / wrong:** No wrong content.
- **Needs updating:** Include commit hashes in the research design doc's references table.

### 14. `sources/01-recovered-design-docs.md`

- **What I was researching:** A compact map of all recovered design sources.
- **What I was looking for:** Which documents are worth detailed reading for the new design iteration.
- **Why I chose it:** It is a generated digest of the recovered resources.
- **How I found it:** Produced by `05_catalog_recovered_design_docs.py`.
- **Useful:** Best single starting point for the next agent.
- **Not useful:** It is an index, not the full content.
- **Out of date / wrong:** Initially lacked docmgr frontmatter and had a non-numeric filename; fixed to `01-recovered-design-docs.md` with frontmatter.
- **Needs updating:** Add source session IDs and git commits beside each recovered document.

### 15. `RAG React Design System Guidelines`

Path: `ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/design-doc/02-rag-react-design-system-guidelines.md`

- **What I was researching:** The missing frontend/design-system contribution playbook.
- **What I was looking for:** Component layering, CSS ownership, Storybook requirements, and contribution rules.
- **Why I chose it:** Git history and doc content show it is explicitly a design-system guideline for RAG React work.
- **How I found it:** `git show 1cb51dd` after frontend git history, plus recovered design-doc catalog.
- **Useful:** Defines the key ownership rule: tokens, foundation, layout, molecules, organisms, pages, containers, and CSS Modules each own different decisions.
- **Not useful:** Written for `web/`, not the newer `packages/rag-evaluation-site` package boundary.
- **Out of date / wrong:** Some file paths and status statements are pre-package extraction.
- **Needs updating:** Create a short current `CONTRIBUTING.md` that reconciles `web/` and `packages/rag-evaluation-site`.

### 16. `RAG Design System Guideline Audit`

Path: `ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/analysis/01-rag-design-system-guideline-audit.md`

- **What I was researching:** Concrete evidence of what was compliant or still messy in the original `web/` design system.
- **What I was looking for:** Component-by-component cleanup recommendations and Storybook gaps.
- **Why I chose it:** It was committed with the design-system guideline and directly applies the guideline.
- **How I found it:** `git show --name-only 1cb51dd`.
- **Useful:** Provides a practical audit method and concrete file examples.
- **Not useful:** Some audit findings may have been fixed by later commits.
- **Out of date / wrong:** It is a historical audit, not current truth.
- **Needs updating:** Re-run the audit against current `web/` and `packages/rag-evaluation-site` before implementation.

### 17. `Styling and Design Reference`

Path: `ttmp/2026/06/07/RAGEVAL-DS-RAGEVAL-QWEN36-HIGH--rag-design-system-reference-sheet-styling-design-widget-interaction-hierarchy/design-doc/01-styling-and-design-reference.md`

- **What I was researching:** Current visual language and CSS/token discipline.
- **What I was looking for:** Palette, typography roles, status vocabulary, global stylesheet rules, and CSS architecture.
- **Why I chose it:** Recent design-reference ticket was surfaced by minitrace and ticket list evidence.
- **How I found it:** `docmgr ticket list`, minitrace session `019ea2e6...`, and file discovery under `ttmp/2026/06/07`.
- **Useful:** Confirms the active retro monochrome Mac OS 1-inspired language and zero-radius discipline.
- **Not useful:** It is reference material, not a step-by-step implementation checklist.
- **Out of date / wrong:** No observed wrong content, but target version text says `web/` and may not fully include `packages/rag-evaluation-site`.
- **Needs updating:** Add package-specific token bridge notes and link from package README.

### 18. `Widget Hierarchy and Interaction Reference`

Path: `ttmp/2026/06/07/RAGEVAL-DS-RAGEVAL-QWEN36-HIGH--rag-design-system-reference-sheet-styling-design-widget-interaction-hierarchy/design-doc/02-widget-hierarchy-and-interaction-reference.md`

- **What I was researching:** Current component hierarchy and Widget IR interaction model.
- **What I was looking for:** Layer map, information hierarchy, action patterns, and renderer/Goja boundaries.
- **Why I chose it:** The new transcript/context-window pages must fit both React hierarchy and Widget IR direction.
- **How I found it:** Same recent design-reference ticket surfaced by minitrace and ticket discovery.
- **Useful:** Gives the clearest current hierarchy: tokens -> foundation -> atoms -> layout -> molecules -> organisms -> pages -> containers, plus Widget IR -> WidgetRenderer.
- **Not useful:** Does not yet define transcript/context-window/annotation/course-specific components.
- **Out of date / wrong:** No observed wrong content.
- **Needs updating:** Add the new page family once component contracts are settled.

### 19. `Widget DSL Visual Quality Analysis and Implementation Guide`

Path: `ttmp/2026/06/05/WIDGETDSL-VISUAL-QUALITY--widget-dsl-visual-quality-and-rich-website-design/design-doc/01-widget-dsl-visual-quality-analysis-and-implementation-guide.md`

- **What I was researching:** Why Widget DSL pages looked visually weak and how to make them richer.
- **What I was looking for:** Root causes and implementation phases for standalone Widget DSL pages.
- **Why I chose it:** The new pages may eventually become Widget DSL recipes.
- **How I found it:** Existing ticket list and recovered-doc catalog.
- **Useful:** Identifies token contract mismatch, missing shell/template layer, and need for semantic DSL recipes.
- **Not useful:** Focuses on visual quality and packaging, not transcript/context-window domain modeling.
- **Out of date / wrong:** Some issues have since been addressed by PR fixes and default-shell/token work.
- **Needs updating:** Mark which visual-quality fixes are complete and which remain.

### 20. `WidgetRenderer Packaging Architecture and Implementation Guide`

Path: `ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/design-doc/01-widgetrenderer-packaging-architecture-and-implementation-guide.md`

- **What I was researching:** How the WidgetRenderer package/default app is supposed to be served and reused.
- **What I was looking for:** Package boundaries, Go embedded SPA strategy, API shape, and implementation status.
- **Why I chose it:** The new design iteration may target the packaged renderer, not only legacy `web/`.
- **How I found it:** Existing ticket list and recovered-doc catalog.
- **Useful:** Explains the package/default-app architecture and server integration.
- **Not useful:** Does not define frontend contribution conventions in detail.
- **Out of date / wrong:** Some implementation status may be outdated after PR 2 and review fixes.
- **Needs updating:** Add note that `pkg/defaultspa/dist` must be committed when `//go:embed all:dist` is used.

### 21. `UI DSL and Kanban DSL Design and Implementation Guide`

Path: `ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/01-ui-dsl-and-kanban-dsl-design-and-implementation-guide.md`

- **What I was researching:** Historical origin of the UI DSL and Kanban DSL direction.
- **What I was looking for:** System architecture, frontend organization, and early DSL rationale.
- **Why I chose it:** The highest-ranked minitrace session started from this work.
- **How I found it:** SQL session search and existing docmgr ticket list.
- **Useful:** Good intern-friendly architecture overview and historical context.
- **Not useful:** Earlier than the corrected Widget IR approach.
- **Out of date / wrong:** Kanban/UI DSL emphasis is partly superseded by Widget IR and actual React rendering.
- **Needs updating:** Add a deprecation/supersession note pointing to the revised Widget DSL implementation guide.

### 22. `RAG Widget DSL Design - Component-to-HTML Mapping`

Path: `ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/02-rag-widget-dsl-design-component-to-html-mapping.md`

- **What I was researching:** The proposed one-to-one mapping from React components to generated HTML.
- **What I was looking for:** Widget catalog and DSL API ideas.
- **Why I chose it:** It is part of the recovered UI DSL sequence.
- **How I found it:** Recovered-doc catalog and docmgr list.
- **Useful:** Useful as a widget catalog and cautionary design artifact.
- **Not useful:** The HTML-cloning architecture is no longer the preferred approach.
- **Out of date / wrong:** Superseded by the revised guide: React should render actual components from Widget IR rather than cloning HTML/CSS manually.
- **Needs updating:** Add a prominent superseded warning at the top.

### 23. `Review and Revised Implementation Guide for the RAG Widget DSL`

Path: `ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/03-review-and-revised-implementation-guide-for-the-rag-widget-dsl.md`

- **What I was researching:** Which earlier DSL assumptions were corrected.
- **What I was looking for:** Accepted architecture after reviewing the component-to-HTML idea.
- **Why I chose it:** It is the bridge from stale HTML mapping to current Widget IR architecture.
- **How I found it:** Recovered-doc catalog and docmgr list.
- **Useful:** Clearly states that Widget IR rendered by React is safer than cloning HTML.
- **Not useful:** Still historical; later package docs are more current for implementation status.
- **Out of date / wrong:** No major wrong content observed; status may need current implementation links.
- **Needs updating:** Link to current `packages/rag-evaluation-site` files and PR 2 changes.

### 24. Obsidian article: `RAG React Design System - From Prototype Dashboard to Structured Design System`

Path: `/home/manuel/code/wesen/go-go-golems/go-go-parc/Projects/2026/06/02/ARTICLE - RAG React Design System - From Prototype Dashboard to Structured Design System.md`

- **What I was researching:** Narrative overview of how the RAG design system evolved.
- **What I was looking for:** A human-readable chronology and conceptual summary.
- **Why I chose it:** It was referenced explicitly in a recovered minitrace prompt.
- **How I found it:** Minitrace search surfaced the path in session `019ea2e3...`.
- **Useful:** Excellent narrative for onboarding; explains passes from tokens to atoms/molecules/pages.
- **Not useful:** It lives outside docmgr and may not be kept in sync with ticket docs.
- **Out of date / wrong:** Could be stale relative to package extraction and Widget IR work.
- **Needs updating:** Copy or link a current summary into docmgr and add package-era updates.

### 25. `packages/rag-evaluation-site/README.md`

- **What I was researching:** Whether the package has a frontend/design-system contribution guide.
- **What I was looking for:** Component organization, design-system rules, contribution instructions, build/test commands.
- **Why I chose it:** It is the obvious package-local entrypoint for contributors.
- **How I found it:** Repository search for README/handbook/playbook files.
- **Useful:** Shows install usage, renderer usage, default app usage, and build outputs.
- **Not useful:** Does not describe atoms/foundation/layout/molecules, CSS Modules, Storybook, or Widget IR contribution workflow.
- **Out of date / wrong:** Incomplete for contributors, not necessarily wrong.
- **Needs updating:** Add a link to a new package `CONTRIBUTING.md` or recovered design-system playbook.

### 26. `ttmp/_guidelines/playbook.md`

- **What I was researching:** Whether a generic playbook template existed in docmgr.
- **What I was looking for:** Required sections and expected playbook structure.
- **Why I chose it:** It appeared in the repository search for `*playbook*`.
- **How I found it:** `find . -iname '*playbook*'` during the earlier docs search.
- **Useful:** Defines generic playbook expectations: purpose, assumptions, commands, exit criteria.
- **Not useful:** Not specific to frontend, design systems, or minitrace.
- **Out of date / wrong:** No wrong content observed.
- **Needs updating:** None for this ticket; use it only if we create a formal operational playbook.

## What Should Be Updated Next

1. **Create a current frontend contribution playbook** that reconciles `web/` and `packages/rag-evaluation-site`.
2. **Add self-exclusion to minitrace searches** so current-session terms do not dominate future evidence output.
3. **Generalize the catalog script** so it discovers candidate docs from minitrace/git output rather than a hand-curated list.
4. **Add source session IDs and commit hashes** to `sources/01-recovered-design-docs.md`.
5. **Mark stale DSL docs as superseded** where they recommend component-to-HTML cloning instead of Widget IR rendered by React.
6. **Update package README** to link to contribution/design-system docs.
7. **Add a go-minitrace worked example** for “find prior project knowledge in local sessions” using this ticket's scripts as the seed.

## Usage Examples

### Before repeating a transcript search

1. Read this logbook.
2. Run `scripts/01_capture_go_minitrace_help.sh` if the go-minitrace version may have changed.
3. Edit `scripts/02_convert_relevant_pi_sessions.sh` to include the target repo/session roots.
4. Run the SQL search first.
5. Use the JS command only when you need richer scoring or grouping.
6. Use git history as a second evidence channel for committed docs.
7. Update this logbook with new resources and stale findings.

### Minimum useful rerun

```bash
TICKET=ttmp/2026/06/07/RAGEVAL-CONTEXT-WINDOWS-DESIGN--transcript-context-window-annotation-and-course-page-design-integration
$TICKET/scripts/02_convert_relevant_pi_sessions.sh
go-minitrace query duckdb \
  --archive-glob "$TICKET/sources/minitrace/*/active/*/*.minitrace.json" \
  --sql-file "$TICKET/scripts/03_candidate_session_search.sql" \
  --output json > "$TICKET/sources/candidate-session-search.json"
$TICKET/scripts/04_git_frontend_history.sh
$TICKET/scripts/05_catalog_recovered_design_docs.py
```
