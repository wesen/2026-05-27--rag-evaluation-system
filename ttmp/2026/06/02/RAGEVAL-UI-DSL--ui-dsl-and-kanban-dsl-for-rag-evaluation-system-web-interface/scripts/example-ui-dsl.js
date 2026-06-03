// example-ui-dsl.js
// Example UI DSL script for the RAG Evaluation System
// This demonstrates how to use ui.dsl to create server-rendered HTML pages
// using the RAG system's widget primitives mapped to HTML structures.

const ui = require("ui.dsl");
const db = require("database");

// ─────────────────────────────────────────────────────────────────────────
// Helper: Create a document card matching the React DocumentBrowser style
// ─────────────────────────────────────────────────────────────────────────

function documentCard(doc) {
  const statusClass = "doc-status doc-status--" + doc.status;
  return ui.article({class: "rag-document-card", "data-doc-id": String(doc.id)},
    ui.header({class: "doc-header"},
      ui.h3(doc.title || "Untitled"),
      ui.span({class: "doc-source"}, doc.source_name || "Unknown source")
    ),
    ui.div({class: "doc-meta"},
      ui.span({class: statusClass}, doc.status || "unknown"),
      ui.span({class: "doc-count"}, (doc.word_count || 0) + " words"),
      ui.span({class: "doc-chunks"}, (doc.chunk_count || 0) + " chunks")
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helper: Create a chunk card matching the React CorpusExplorer style
// ─────────────────────────────────────────────────────────────────────────

function chunkCard(chunk) {
  const preview = (chunk.text_preview || chunk.text || "").substring(0, 200);
  return ui.article({class: "rag-chunk-card"},
    ui.div({class: "chunk-header"},
      ui.span("Chunk " + (chunk.chunk_index || 0)),
      ui.span({class: "chunk-tokens"}, (chunk.token_count || 0) + " tokens")
    ),
    ui.pre({class: "chunk-text"}, preview + (preview.length >= 200 ? "..." : ""))
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helper: Create a search result card
// ─────────────────────────────────────────────────────────────────────────

function searchResultCard(result) {
  return ui.article({class: "rag-result-card"},
    ui.header({class: "result-header"},
      ui.h3(result.title || "Untitled"),
      ui.span({class: "result-score"}, "Score: " + (result.score || 0).toFixed(3))
    ),
    ui.p({class: "result-preview"}, result.preview || ""),
    ui.div({class: "result-meta"},
      ui.span({class: "result-retriever"}, result.retriever || "unknown"),
      ui.a({class: "result-link", href: result.url || "#"}, "View source")
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helper: Create a coverage meter bar
// ─────────────────────────────────────────────────────────────────────────

function coverageMeter(label, current, total) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return ui.div({class: "coverage-item"},
    ui.label({class: "coverage-label"}, label),
    ui.div({class: "coverage-bar"},
      ui.div({
        class: "coverage-fill",
        style: {width: pct + "%"},
        "data-coverage": pct
      })
    ),
    ui.span({class: "coverage-count"}, current + "/" + total + " (" + pct + "%)")
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Page: Corpus Overview Dashboard
// Mirrors the React CorpusExplorerView in server-rendered HTML
// ─────────────────────────────────────────────────────────────────────────

function corpusOverviewPage() {
  const sources = db.query(`
    SELECT
      s.id,
      s.name,
      s.type,
      COUNT(DISTINCT d.id) as doc_count,
      COUNT(DISTINCT c.id) as chunk_count,
      COUNT(DISTINCT e.chunk_id) as embedded_count
    FROM sources s
    LEFT JOIN documents d ON d.source_id = s.id
    LEFT JOIN chunks c ON c.document_id = d.id
    LEFT JOIN embeddings e ON e.chunk_id = c.id
    GROUP BY s.id
    ORDER BY s.name
  `);

  const totalDocs = sources.reduce((sum, s) => sum + (s.doc_count || 0), 0);
  const totalChunks = sources.reduce((sum, s) => sum + (s.chunk_count || 0), 0);
  const totalEmbedded = sources.reduce((sum, s) => sum + (s.embedded_count || 0), 0);

  return ui.page({title: "Corpus Overview — RAG Evaluation System"},
    ui.link({rel: "stylesheet", href: "/assets/rag-dsl.css"}),
    ui.main({class: "page"},
      ui.header({class: "page-header"},
        ui.h1("Corpus Overview"),
        ui.p("Server-rendered corpus exploration dashboard")
      ),

      ui.section({class: "stats-grid"},
        ui.div({class: "stat-card"},
          ui.span({class: "stat-value"}, String(totalDocs)),
          ui.span({class: "stat-label"}, "Documents")
        ),
        ui.div({class: "stat-card"},
          ui.span({class: "stat-value"}, String(totalChunks)),
          ui.span({class: "stat-label"}, "Chunks")
        ),
        ui.div({class: "stat-card"},
          ui.span({class: "stat-value"}, String(totalEmbedded)),
          ui.span({class: "stat-label"}, "Embedded")
        )
      ),

      ui.section({class: "sources-table"},
        ui.h2("Sources"),
        ui.table("sources-overview")
          .fromRows(sources.map(s => ({
            name: s.name,
            type: s.type,
            documents: s.doc_count || 0,
            chunks: s.chunk_count || 0,
            embedded: s.embedded_count || 0,
            coverage: Math.round(((s.embedded_count || 0) / Math.max(s.chunk_count || 1, 1)) * 100) + "%"
          })))
          .features(f => f.sorting().pagination())
          .render({})
      ),

      ui.section({class: "coverage-section"},
        ui.h2("Embedding Coverage by Source"),
        ...sources.map(s => coverageMeter(
          s.name,
          s.embedded_count || 0,
          s.chunk_count || 0
        ))
      )
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Page: Search Results
// Mirrors the React SearchView in server-rendered HTML
// ─────────────────────────────────────────────────────────────────────────

function searchResultsPage(query) {
  const results = db.query(`
    SELECT d.id, d.title, d.author, d.url, c.text, c.chunk_index, s.name as source_name
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    JOIN sources s ON d.source_id = s.id
    WHERE lower(c.text) LIKE lower(?)
    ORDER BY c.chunk_index
    LIMIT 50
  `, "%" + (query || "") + "%");

  return ui.page({title: "Search: " + (query || "") + " — RAG Evaluation System"},
    ui.link({rel: "stylesheet", href: "/assets/rag-dsl.css"}),
    ui.main({class: "page"},
      ui.header({class: "page-header"},
        ui.h1("Search Results"),
        ui.p(query ? "Query: " + query : "No query provided")
      ),

      ui.form({class: "search-form", method: "get", action: "/search"},
        ui.input({
          name: "q",
          value: query || "",
          placeholder: "Search documents...",
          class: "search-input"
        }),
        ui.button({type: "submit", class: "search-button"}, "Search")
      ),

      results.length > 0
        ? ui.section({class: "results-list"}, ...results.map(searchResultCard))
        : ui.div({class: "empty-state"}, ui.p("No results found for your query."))
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Export module API
// ─────────────────────────────────────────────────────────────────────────

module.exports = {
  documentCard,
  chunkCard,
  searchResultCard,
  coverageMeter,
  corpusOverviewPage,
  searchResultsPage,
};
