__package__({ name: "sites", short: "WidgetRenderer xgoja sites" })

__verb__("demo", {
  name: "demo",
  output: "text",
  short: "Serve a tiny Widget IR site backed by express, db, assets, and widget.dsl",
  tags: ["http", "widget", "db"]
})
function demo() {
  const express = require("express")
  const assets = require("fs:assets")
  const db = require("db")
  const rag = require("widget.dsl")

  db.configure("sqlite3", ":memory:")
  db.exec("CREATE TABLE queries (id INTEGER PRIMARY KEY, name TEXT, status TEXT)")
  db.exec("INSERT INTO queries (name, status) VALUES (?, ?)", "Fast Growing Trees", "success")
  db.exec("INSERT INTO queries (name, status) VALUES (?, ?)", "Arborvitae Spacing", "running")

  const app = express.app()
  app.staticFromAssetsModule("/static", assets, "/app/public")
  app.get("/", (_req, res) => res.redirect("/static/"))
  app.get("/healthz", (_req, res) => res.json({ ok: true, site: "rag-widget-xgoja-site" }))
  app.get("/api/widget/schema", (_req, res) => res.json({ schemaVersion: "0.1.0", components: ["Panel", "StatusText", "DataTable"] }))
  app.get("/api/widget/pages/demo", (_req, res) => {
    const rows = db.query("SELECT id, name, status FROM queries ORDER BY id")
    res.json({
      schemaVersion: "0.1.0",
      id: "demo",
      title: "xgoja widget demo",
      root: rag.panel({ title: "xgoja widget demo" },
        rag.statusText({ status: "success", icon: true }, "Rows: " + rows.length),
        rag.dataTable({
          rows,
          getRowKey: "id",
          columns: [
            { id: "id", header: "ID", cell: rag.cell.field("id") },
            { id: "name", header: "Name", cell: rag.cell.field("name") },
            { id: "status", header: "Status", cell: rag.cell.status("status") }
          ]
        })
      )
    })
  })
}
