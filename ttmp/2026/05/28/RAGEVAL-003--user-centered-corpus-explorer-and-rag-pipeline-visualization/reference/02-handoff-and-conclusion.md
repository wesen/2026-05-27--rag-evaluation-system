---
Title: Handoff and Conclusion
Ticket: RAGEVAL-003
Status: active
Topics:
    - rag
    - playground
    - corpus
    - embeddings
    - search
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: internal/services/corpus/service.go
      Note: Corpus service — read-only queries for source summaries, document browser, document detail
    - Path: internal/services/corpus/service_test.go
      Note: 8 unit tests covering all corpus service query paths
    - Path: internal/api/handlers.go
      Note: Added 3 corpus API endpoints and helper functions
    - Path: web/src/components/corpus/CorpusExplorerView.tsx
      Note: Main corpus explorer orchestrator component
    - Path: web/src/components/corpus/DocumentInspector.tsx
      Note: 4-tab document inspector (overview, text, chunks, coverage)
    - Path: web/src/components/corpus/DocumentBrowser.tsx
      Note: Document table with search filter and pagination
    - Path: web/src/components/corpus/SourcePanel.tsx
      Note: Source list panel with coverage stats
    - Path: web/src/components/corpus/IdentityBar.tsx
      Note: Strategy/provider/model/dimensions controls
    - Path: web/src/components/corpus/ChunkTimelineBar.tsx
      Note: Proportional chunk position visualization
    - Path: web/src/index.css
      Note: Complete retro macOS 1 monochrome theme
    - Path: web/src/services/api.ts
      Note: Added corpus RTK Query types and 3 query endpoints
    - Path: web/src/App.tsx
      Note: New nav strip with Corpus as default view
ExternalSources: []
Summary: Handoff article for the RAGEVAL-003 Corpus Explorer implementation. Everything built, how it works, how to run it, and what to do next.
LastUpdated: 2026-05-28T22:40:00Z
WhatFor: Hand off the Corpus Explorer implementation to the main developer with full context on what was built, how it works, and what remains.
WhenToUse: Read this before modifying or extending the Corpus Explorer. Use as onboarding context for the corpus service, API endpoints, or frontend components.
---

# RAGEVAL-003 — Handoff and Conclusion

## What we set out to do

The RAG Evaluation System had a working backend pipeline — sources, documents, chunking, embeddings — but no website surface that helped a user understand what was happening to their data. The Pipeline view listed things. The Embeddings view computed vectors. Neither showed the transformations.

The goal was a **Corpus Explorer**: an interface where a user can pick a source, browse documents, inspect chunk boundaries, see which chunks have embeddings, and understand what can be tested next. The design principle was: *the website should show the transformations, not only the outputs.*

Along the way, the visual theme was redesigned to a **retro macOS 1 monochrome** look: pure black and white, no menu bar, no window chrome, color accents only on text foreground.

## What was built

### Backend: Corpus Service and API (3 endpoints)

A new read-only corpus service at `internal/services/corpus/service.go` (425 lines) with three methods, backed by three HTTP endpoints.

| Endpoint | What it does |
|---|---|
| `GET /api/v1/corpus/sources` | Returns all sources with document count, word count, chunk count, and embedding coverage for a given strategy/provider/model/dimensions identity |
| `GET /api/v1/corpus/documents` | Paginated documents for a source, with per-document chunk and embedding counts |
| `GET /api/v1/corpus/documents/{id}` | Full document detail: metadata, optional content text, chunk list with per-chunk embedding presence |

All endpoints accept optional query parameters: `strategy_id`, `provider_type`, `model`, `dimensions`. When provided, chunk and embedding counts are computed. When omitted, only document and word counts are returned.

The document detail endpoint accepts `include_text=true` to include the full `content_text` and `content_html` fields (large payloads — off by default).

**Key design decisions:**
- Separate `/corpus/` route group, not overloading existing `/documents` endpoints
- Sub-query JOINs for chunk/embedding counts (no N+1, single query per endpoint)
- SQL is built dynamically — identity fields are optional, so the query shape changes based on what's provided

**Tests:** 8 unit tests in `service_test.go` covering:
- Source summaries with and without embedding identity
- Document browser with filtering and pagination
- Document detail with chunks, embedding status, not-found, no-text, and no-strategy cases

### Frontend: Corpus Explorer (7 components)

The Corpus Explorer is a three-column layout:

```
┌─────────────────────────────────────────────────────────────────┐
│ Embedding Identity  [Strategy ▾] [Provider] [Model] [Dims]      │
├──────────┬─────────────────────┬────────────────────────────────┤
│ Sources  │ Documents           │ Document Inspector              │
│          │ [🔍 Search...]       │ overview | text | chunks | cov │
│ ● src-a  │ ─────────────────── │                                 │
│   src-b  │ row 1  5k  10/55    │ ID: doc-1  [copy]              │
│   src-c  │ row 2  3k  0/12     │ Source: src-a                  │
│   src-d  │ row 3  1k  —        │ Chunks: 55  Embedded: 10/55    │
│          │ ...                 │                                 │
│          │ [Load more (383→)]  │ [chunk timeline bar ■■□□□...]   │
│          │                     │ #0  0–1200   ●  chk-b16a...    │
│          │                     │ #1  1050–2250 ●  chk-f107...    │
│          │                     │ #2  2100–3300 ○  chk-26e2...    │
└──────────┴─────────────────────┴────────────────────────────────┘
```

**Component files** (all under `web/src/components/corpus/`):

| File | Lines | Responsibility |
|---|---|---|
| `CorpusExplorerView.tsx` | 128 | Main layout, state management, RTK Query wiring |
| `IdentityBar.tsx` | 68 | Strategy/provider/model/dims controls + summary stats |
| `SourcePanel.tsx` | 70 | Source list with document/word/coverage per source |
| `DocumentBrowser.tsx` | 103 | Document table, search filter, pagination |
| `DocumentInspector.tsx` | 231 | 4-tab inspector: overview, text, chunks, coverage |
| `ChunkTimelineBar.tsx` | 36 | Proportional chunk position bar |

**Features:**
- **Source panel**: Shows each source with document count, word count, chunk count, and embedding coverage percentage. Click to load documents.
- **Document browser**: Searchable (title/ID substring), paginated (100 per page, "Load more" button), shows word count, chunk count, embedding ratio, status.
- **Document inspector**:
  - **Overview tab**: Document ID (copyable), source, URL, word count, chunk count, embedding ratio, status, full metadata grid.
  - **Text tab**: Full extracted text in a scrollable container.
  - **Chunks tab**: Chunk timeline bar (proportional position with embedded/missing shading), chunk table (index, offset range, tokens, embedding status ●/○, copyable chunk ID), selected chunk text preview.
  - **Coverage tab**: Stats summary, per-chunk dot strip visualization, missing chunks table.
- **IDs are copyable** via `[copy]` buttons on document and chunk IDs.

### Theme: Retro macOS 1 Monochrome

The entire site was redesigned in `web/src/index.css` (494 lines):

- Pure black/white palette with subtle grays
- No menu bar, no window chrome — replaced with a minimal nav strip (active item inverts to white-on-black)
- Black panel headers with white text, uppercase monospace labels
- Color accents **only on text foreground**:
  - Green (`#007722`): embedded, done, success
  - Amber (`#AA7700`): partial, warning
  - Red (`#CC0000`): error, failed
  - Blue (`#0000CC`): accent, links
- Dotted row separators, monospace numbers, retro thick scrollbars
- All existing views (Pipeline, Embeddings, Search, Evaluation) updated to use the new panel-based classes

### Navigation

The old MacMenuBar was removed. `App.tsx` now uses a flat nav strip:

```
◉ RAG Eval | Corpus | Pipeline | Embeddings | Search | Evaluation
```

Corpus is the default view (was Pipeline).

## How to build and run

```bash
# Build frontend + backend (frontend is embedded via go:embed)
cd web && npm run build && cd ..
go build ./cmd/rag-eval

# Run
./rag-eval serve --address 127.0.0.1:8080

# Test
GOMAXPROCS=2 GOMEMLIMIT=1024MiB go test ./internal/... -count=1 -timeout 60s
cd web && npm run build
```

The Go binary embeds the frontend at build time. After any `web/` change, rebuild the Go binary.

## How to verify it works

```bash
# Start server
./rag-eval serve --address 127.0.0.1:8080

# API checks
curl -s 'http://localhost:8080/api/v1/corpus/sources?strategy_id=fixed-1200-150&provider_type=openai&model=text-embedding-3-small&dimensions=1536' | jq .

curl -s 'http://localhost:8080/api/v1/corpus/documents?source_id=ttc-dump-articles&strategy_id=fixed-1200-150&provider_type=openai&model=text-embedding-3-small&dimensions=1536&limit=5' | jq .

curl -s 'http://localhost:8080/api/v1/corpus/documents/ttc-article-6737?strategy_id=fixed-1200-150&provider_type=openai&model=text-embedding-3-small&dimensions=1536&include_text=false' | jq '.document.title, (.chunks | length)'

# UI checks
# 1. Open http://localhost:8080
# 2. Click "TTC dump articles" in the Sources panel
# 3. Confirm 483 docs load in the document table
# 4. Search for "Crape" — should filter to one result
# 5. Click "Crape Myrtle Varieties and Guide"
# 6. Click "chunks" tab — should show 55 chunks, first 10 embedded (●)
# 7. Click "coverage" tab — should show 18% coverage, 45 missing chunks
```

## Current corpus state

| Source | Documents | Words | Chunks (fixed-1200-150) | Embedded (openai) |
|---|---:|---:|---:|---:|
| Test | 2 | 1,706 | 0 | 0 |
| The Tree Center Guides | 19 | 38,540 | 226 | 5 |
| TTC dump articles | 483 | 605,850 | 162 | 10 |
| TTC dump guides | 19 | 37,594 | 42 | 10 |
| TTC dump products | 2,594 | 2,208,648 | 51 | 10 |
| **Total** | **3,117** | **2,892,538** | **481** | **35** |

## What's left to do

### Recommended next steps (in priority order)

1. **Search integration** — After BM25/vector search exists, search results should link back into the Corpus Explorer. The Corpus Explorer already exposes copyable chunk IDs and document IDs for this purpose.

2. **Server-side search** — The current document browser search is client-side (filters the loaded page of 100 docs). For the TTC dump products source (2,594 docs), add a backend `q` parameter to `/corpus/documents` for server-side filtering.

3. **Write actions** — The design guide envisioned bounded compute actions from the Corpus Explorer (e.g., "compute embeddings for missing chunks in this document, limit 10"). This would reuse the existing `POST /api/v1/embeddings/compute` endpoint.

4. **Chunk boundary highlighting** — Show chunk boundaries visually in the extracted text tab (highlight start/end offsets). This helps users understand overlap and gaps.

5. **Metadata-to-text warning** — For product documents (ttc-dump-products), important data lives in metadata JSON fields (price, dimensions, hardiness zone) rather than in `content_text`. The Corpus Explorer should warn when a document's `content_text` is sparse relative to its metadata.

6. **Raw HTML tab** — Add a raw HTML vs extracted text comparison tab for debugging normalization quality.

### Known limitations

- **Pagination is client-growing** — The "Load more" button increases the query limit (100→200→300...), which re-fetches all data. This is fine up to ~1000 docs but not ideal for very large sources.
- **Search is client-side** — Only searches within the currently loaded page. Docs beyond the loaded page are not found until more are loaded.
- **No keyboard navigation** — The source list and document table are mouse-only. Arrow keys and Enter would improve usability.
- **Coverage tab identity label** — The coverage tab shows the provider/model/dims label correctly now (was hardcoded in the initial version), but doesn't update if you change the identity while on the coverage tab (it reads from props, so it does update correctly on re-render).

### Architecture notes for the next developer

- The corpus service is intentionally separate from the document service. The generic document endpoints remain stable and simple. The corpus endpoints are opinionated toward the explorer use case.
- The SQL query construction in `service.go` is dynamic — the number of `?` placeholders changes based on which identity fields are provided. The corresponding scan logic also branches (2, 3, or 5 columns). If you add new identity fields, all branches need updating.
- The frontend components are stateless — all state lives in `CorpusExplorerView.tsx` and is passed down as props. This makes the components easy to test and rearrange.
- RTK Query caches are tagged with `['Corpus']` so mutations can invalidate the explorer data.

## Commits

| Hash | Description |
|---|---|
| `d0934ea` | Backend corpus service and API endpoints |
| `96847da` | Corpus Explorer UI + monochrome theme |
| `7934e0a` | Fix: SQL parameter ordering in document browser/detail queries |
| `82784da` | Diary: Steps 3–4 |
| `7c0b852` | Docmgr file relations |
| `32f7d71` | Component split, search/pagination, corpus service tests |
| `70d3e35` | Diary: Step 5 |

## Files changed

**New files (8):**
- `internal/services/corpus/service.go` — Corpus service (425 lines)
- `internal/services/corpus/service_test.go` — 8 unit tests (285 lines)
- `web/src/components/corpus/CorpusExplorerView.tsx` — Main view (128 lines)
- `web/src/components/corpus/IdentityBar.tsx` — Identity controls (68 lines)
- `web/src/components/corpus/SourcePanel.tsx` — Source list (70 lines)
- `web/src/components/corpus/DocumentBrowser.tsx` — Document table with search/pagination (103 lines)
- `web/src/components/corpus/DocumentInspector.tsx` — 4-tab inspector (231 lines)
- `web/src/components/corpus/ChunkTimelineBar.tsx` — Timeline bar (36 lines)

**Modified files (8):**
- `internal/api/handlers.go` — Added 3 corpus endpoints + helpers
- `web/src/index.css` — Complete monochrome theme rewrite (494 lines)
- `web/src/services/api.ts` — Added corpus types + 3 RTK Query endpoints
- `web/src/App.tsx` — New nav strip, Corpus as default
- `web/src/components/pipeline/PipelineView.tsx` — Updated to panel classes
- `web/src/components/embeddings/EmbeddingsView.tsx` — Updated to panel classes
- `web/src/components/search/SearchView.tsx` — Updated to panel classes
- `web/src/components/evaluation/EvaluationView.tsx` — Updated to panel classes

**Total new code: ~2,700 lines across 16 files.**

## Conclusion

The Corpus Explorer turns the RAG pipeline into something you can see and click through. A user can now answer these questions from the browser:

- **What content did we ingest?** → Source panel shows 5 sources, 3,117 docs, 2.9M words.
- **What happened to this document?** → Document inspector shows metadata, content text, status.
- **How was it chunked?** → Chunks tab shows 55 chunks with boundaries, overlaps, token counts.
- **Which chunks are embedded?** → Coverage strip and embedding status column show 10/55 for the selected identity.
- **What can I test next?** → Missing chunks table lists 45 chunks that need embeddings.

The retro monochrome theme gives the app a distinctive, data-dense aesthetic that prioritizes readability over decoration. Color is used sparingly and only on text — green for done, amber for partial, red for error — keeping the interface focused on the data.

The implementation is complete, tested, and ready for the main developer to extend with search integration, write actions, and deeper pipeline visualization.
