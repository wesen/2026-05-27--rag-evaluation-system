// example-kanban-dsl.js
// Example Kanban DSL script for the RAG Evaluation System
// This demonstrates how to use kanban.dsl to create interactive boards
// for tracking document processing stages, workflow operations, etc.

const kanban = require("kanban.dsl");
const ui = require("ui.dsl");
const db = require("database");
const express = require("express");

// ─────────────────────────────────────────────────────────────────────────
// Configuration: Document Processing Pipeline Board
// Cards = documents, Columns = processing stages
// ─────────────────────────────────────────────────────────────────────────

function createDocumentPipelineBoard() {
  return kanban.board("document-pipeline")
    .title("Document Processing Pipeline")
    .description("Track documents through ingestion, chunking, embedding, and indexing.")
    .theme("rag-eval")
    .className("rag-kanban-board")

    // Define columns matching the document.status field
    .columns(cols => cols
      .column("intake").title("In Take").done()
      .column("chunked").title("Chunked").done()
      .column("embedded").title("Embedded").limit(50).done()
      .column("indexed").title("Indexed").terminal(true).done()
      .column("failed").title("Failed").done()
    )

    // Data bindings: how to load and identify cards
    .data(data => data
      .cards(ctx => {
        const filters = ctx.query || {};
        const search = String(filters.search || "").trim().toLowerCase();
        const status = String(filters.status || "").trim();

        const where = ["1=1"];
        const args = [];

        if (search) {
          where.push("(lower(title) LIKE ? OR lower(author) LIKE ?)");
          const q = "%" + search + "%";
          args.push(q, q);
        }
        if (status) {
          where.push("status = ?");
          args.push(status);
        }

        return db.query(
          "SELECT * FROM documents WHERE " + where.join(" AND ") + " ORDER BY updated_at DESC LIMIT 200",
          ...args
        );
      })
      .id(doc => String(doc.id))
      .column(doc => doc.status || "intake")
      .position(doc => new Date(doc.updated_at).getTime())
      .searchText(doc => {
        return String(doc.title || "") + " " + String(doc.author || "") + " " + String(doc.status || "");
      })
    )

    // Features: what interactive capabilities are enabled
    .features(features => features
      .search({mode: "server"})
      .dragDrop()
      .createCard()
    )

    // Render: how each card looks
    .render(render => render
      .toolbar(ctx => ui.form({
          class: "search-form kb-toolbar",
          method: "get",
          action: "/documents"
        },
        ui.input({
          id: "doc-search",
          name: "search",
          placeholder: "Search documents...",
          value: String(ctx.query?.search || ""),
          "data-kb-search": true,
          autocomplete: "off",
          class: "search-input"
        }),
        ui.select({name: "status", class: "filter-select"},
          ui.option({value: ""}, "All statuses"),
          ui.option({value: "intake"}, "In Take"),
          ui.option({value: "chunked"}, "Chunked"),
          ui.option({value: "embedded"}, "Embedded"),
          ui.option({value: "indexed"}, "Indexed"),
          ui.option({value: "failed"}, "Failed")
        ),
        ui.button({type: "submit", class: "search-button"}, "Filter")
      ))

      .card((doc, ctx) => ui.article({class: "rag-doc-card"},
        ui.div({class: "card-header"},
          ui.span({class: "card-id"}, "#" + String(doc.id).substring(0, 8)),
          ui.h3(doc.title || "Untitled")
        ),
        ui.p({class: "card-author"}, doc.author || "No author"),
        ui.div({class: "card-stats"},
          ui.span({class: "stat"}, (doc.word_count || 0) + " words"),
          ui.span({class: "stat"}, (doc.chunk_count || 0) + " chunks")
        ),
        doc.url ? ui.a({href: doc.url, class: "card-link", target: "_blank"}, "Source") : null
      ))

      .emptyColumn(column => ui.div({class: "empty-column"},
        ui.p("No documents in " + column.Title),
        ui.span({class: "hint"}, "Documents will appear here when they reach this stage.")
      ))
    )

    // Actions: what happens when cards are moved or manipulated
    .actions(actions => actions
      .cardMoved(event => {
        const docId = event.cardId;
        const toStatus = event.to.columnId;
        const toIndex = event.to.index;

        const doc = db.query("SELECT * FROM documents WHERE id = ?", docId)[0];
        if (!doc) {
          return {ok: false, error: "Document not found: " + docId};
        }

        const fromStatus = doc.status;

        // Update document status
        db.exec(
          "UPDATE documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          toStatus, docId
        );

        // Renormalize positions in affected columns (simple strategy)
        if (fromStatus !== toStatus) {
          const fromDocs = db.query(
            "SELECT id FROM documents WHERE status = ? ORDER BY updated_at DESC",
            fromStatus
          );
          fromDocs.forEach((d, i) => {
            db.exec("UPDATE documents SET row_order = ? WHERE id = ?", (i + 1) * 10, d.id);
          });
        }

        const toDocs = db.query(
          "SELECT id FROM documents WHERE status = ? ORDER BY updated_at DESC",
          toStatus
        );
        toDocs.forEach((d, i) => {
          db.exec("UPDATE documents SET row_order = ? WHERE id = ?", (i + 1) * 10, d.id);
        });

        return {
          ok: true,
          refresh: true,
          toast: "Moved to " + toStatus,
          card: db.query("SELECT * FROM documents WHERE id = ?", docId)[0]
        };
      })

      .cardCreated(event => {
        const title = String(event.title || "").trim();
        if (!title) {
          return {ok: false, error: "Title is required"};
        }

        const status = String(event.status || "intake");
        db.exec(
          "INSERT INTO documents (title, status, word_count, chunk_count, created_at, updated_at) VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
          title, status
        );

        return {
          ok: true,
          refresh: true,
          toast: "Created document",
          card: db.query("SELECT * FROM documents ORDER BY id DESC LIMIT 1")[0]
        };
      })
    )

    .build();
}

// ─────────────────────────────────────────────────────────────────────────
// Configuration: Workflow Operations Board
// Cards = workflow operations, Columns = operation status
// ─────────────────────────────────────────────────────────────────────────

function createWorkflowOpsBoard() {
  const COLUMNS = [
    ["pending", "Pending"],
    ["ready", "Ready"],
    ["running", "Running"],
    ["succeeded", "Succeeded"],
    ["failed", "Failed"],
  ];

  return kanban.board("workflow-ops")
    .title("Workflow Operations")
    .description("Monitor and manage workflow operation execution.")
    .theme("rag-eval")
    .className("rag-kanban-board")

    .columns(cols => {
      COLUMNS.forEach(([id, title]) => {
        cols.column(id).title(title).done();
      });
      return cols;
    })

    .data(data => data
      .cards(ctx => {
        const workflowId = ctx.query?.workflow_id || "";
        if (!workflowId) return [];

        return db.query(`
          SELECT
            op_id,
            kind,
            status,
            queue,
            error_message,
            created_at,
            updated_at
          FROM workflow_ops
          WHERE workflow_id = ?
          ORDER BY created_at DESC
          LIMIT 500
        `, workflowId);
      })
      .id(op => String(op.op_id))
      .column(op => op.status || "pending")
      .position(op => new Date(op.created_at).getTime())
      .searchText(op => {
        return String(op.kind || "") + " " + String(op.queue || "") + " " + String(op.error_message || "");
      })
    )

    .features(features => features
      .search({mode: "client"})
      .dragDrop()
    )

    .render(render => render
      .card((op) => ui.article({class: "rag-op-card rag-op-card--" + op.status},
        ui.div({class: "op-header"},
          ui.code({class: "op-kind"}, op.kind || "unknown"),
          ui.span({class: "op-queue"}, op.queue || "default")
        ),
        op.error_message
          ? ui.p({class: "op-error"}, op.error_message)
          : null,
        ui.div({class: "op-footer"},
          ui.time({class: "op-time"}, op.created_at || "")
        )
      ))

      .emptyColumn(column => ui.div({class: "empty-column"},
        ui.p("No operations in " + column.Title)
      ))
    )

    .actions(actions => actions
      .cardMoved(event => {
        const opId = event.cardId;
        const toStatus = event.to.columnId;

        db.exec(
          "UPDATE workflow_ops SET status = ? WHERE op_id = ?",
          toStatus, opId
        );

        return {
          ok: true,
          refresh: true,
          toast: "Moved to " + toStatus
        };
      })
    )

    .build();
}

// ─────────────────────────────────────────────────────────────────────────
// Express App Setup
// ─────────────────────────────────────────────────────────────────────────

function setupApp() {
  const app = express.app();

  // Serve static CSS/assets
  app.static("/assets", "scripts/assets");

  // Create boards
  const docBoard = createDocumentPipelineBoard();
  const workflowBoard = createWorkflowOpsBoard();

  // Mount boards
  docBoard.mount(app, "/_kanban");
  workflowBoard.mount(app, "/_kanban");

  // Full page routes
  app.get("/documents", (req, res) => {
    res.html(ui.page({title: "Document Pipeline"},
      ui.link({rel: "stylesheet", href: "/assets/rag-dsl.css"}),
      ui.main({class: "page"},
        ui.header({class: "page-header"},
          ui.h1("Document Processing Pipeline"),
          ui.p("Drag documents between stages to update their processing status.")
        ),
        docBoard.render({query: req.query, session: req.session})
      )
    ));
  });

  app.get("/workflows/:id/ops", (req, res) => {
    res.html(ui.page({title: "Workflow Operations"},
      ui.link({rel: "stylesheet", href: "/assets/rag-dsl.css"}),
      ui.main({class: "page"},
        ui.header({class: "page-header"},
          ui.h1("Workflow Operations"),
          ui.p("Workflow: " + (req.params.id || ""))
        ),
        workflowBoard.render({query: {workflow_id: req.params.id}, session: req.session})
      )
    ));
  });

  return app;
}

// ─────────────────────────────────────────────────────────────────────────
// Export module API
// ─────────────────────────────────────────────────────────────────────────

module.exports = {
  createDocumentPipelineBoard,
  createWorkflowOpsBoard,
  setupApp,
};
