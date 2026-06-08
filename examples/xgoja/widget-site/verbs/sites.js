__package__({ name: "sites", short: "WidgetRenderer xgoja sites" })

__verb__("demo", {
  name: "demo",
  output: "text",
  short: "Serve an interactive Widget IR site backed by express, db, assets, and widget.dsl",
  tags: ["http", "widget", "db", "actions"]
})
function demo() {
  const express = require("express")
  const assets = require("fs:assets")
  const db = require("db")
  const rag = require("widget.dsl")

  db.exec("CREATE TABLE queries (id INTEGER PRIMARY KEY, name TEXT, status TEXT, priority INTEGER, owner TEXT, notes TEXT)")
  db.exec("INSERT INTO queries (name, status, priority, owner, notes) VALUES (?, ?, ?, ?, ?)", "Fast Growing Trees", "succeeded", 3, "botany", "Seeded from the xgoja demo")
  db.exec("INSERT INTO queries (name, status, priority, owner, notes) VALUES (?, ?, ?, ?, ?)", "Arborvitae Spacing", "running", 2, "landscape", "Needs another pass")
  db.exec("INSERT INTO queries (name, status, priority, owner, notes) VALUES (?, ?, ?, ?, ?)", "Broken Import Example", "failed", 1, "ingest", "Retry after source cleanup")

  const appState = { selectedId: 1, audit: ["Demo initialized"] }
  const app = express.app()
  app.spaFromAssetsModule("/", assets, "/app/public", { excludePrefixes: ["/api", "/healthz", "/favicon.ico"] })
  app.get("/favicon.ico", (_req, res) => res.status(204).end())
  app.get("/healthz", (_req, res) => res.json({ ok: true, site: "rag-widget-xgoja-site" }))
  app.get("/api/widget/schema", (_req, res) => res.json({ schemaVersion: "0.1.0", components: [
    "Panel", "StatusText", "DataTable", "Button", "MetadataGrid",
    "ContextDiagramPanel", "TranscriptWorkspacePanel", "CourseStudioShell", "CourseSlidePanel", "HandoutDocumentShell"
  ] }))

  function allRows() {
    return db.query("SELECT id, name, status, priority, owner, notes FROM queries ORDER BY priority DESC, id ASC")
  }

  function selectedRow() {
    const rows = db.query("SELECT id, name, status, priority, owner, notes FROM queries WHERE id = ?", appState.selectedId)
    return rows.length > 0 ? rows[0] : null
  }

  function counts() {
    const rows = db.query("SELECT status, COUNT(*) AS count FROM queries GROUP BY status ORDER BY status")
    const out = { total: 0, succeeded: 0, running: 0, failed: 0, pending: 0 }
    rows.forEach(row => {
      const count = Number(row.count || 0)
      out.total += count
      out[row.status] = count
    })
    return out
  }

  function nextStatus(status) {
    if (status === "pending") return "running"
    if (status === "running") return "succeeded"
    if (status === "succeeded") return "failed"
    return "pending"
  }

  function pageSummary(id) {
    const c = counts()
    return rag.recipes.metrics({ items: [
      { label: "Total queries", value: c.total, status: "ready" },
      { label: "Succeeded", value: c.succeeded || 0, status: "succeeded" },
      { label: "Running", value: c.running || 0, status: "running" },
      { label: "Failed", value: c.failed || 0, status: "failed" }
    ]})
  }

  function toolbar() {
    return rag.recipes.actionToolbar({
      title: "Queue controls",
      caption: "Actions mutate in-memory SQLite state and ask the React app to refresh.",
      actions: [
        { label: "Add query", variant: "primary", action: "add-query", payload: { owner: "research" } },
        { label: "Retry failed", action: "bulk-retry-failed" },
        { label: "Reset demo", action: "reset-demo" }
      ]
    })
  }

  function queryColumns() {
    return [
      { id: "priority", header: "Priority", align: "right", cell: rag.cell.number("priority") },
      { id: "name", header: "Query", cell: rag.cell.field("name") },
      { id: "owner", header: "Owner", cell: rag.cell.caption("owner", { tone: "muted" }) },
      { id: "status", header: "Status", cell: rag.cell.status("status", { icon: true }) },
      { id: "notes", header: "Notes", cell: rag.cell.caption("notes", { tone: "muted" }) }
    ]
  }

  function selectedPanel(row) {
    if (!row) {
      return rag.panel({ title: "Selected query" }, rag.caption({ tone: "muted" }, "Select a row to inspect it."))
    }
    return rag.panel({ title: "Selected query" },
      rag.metadataGrid({ density: "compact", items: [
        { key: "ID", value: String(row.id), copyValue: String(row.id) },
        { key: "Name", value: row.name, copyValue: row.name },
        { key: "Owner", value: row.owner },
        { key: "Priority", value: String(row.priority) },
        { key: "Status", value: rag.statusText({ status: row.status, icon: true }, row.status) },
        { key: "Notes", value: row.notes }
      ]}),
      rag.inline({ gap: "sm", wrap: true },
        rag.button({ variant: "primary", action: { kind: "server", name: "cycle-status", payload: { id: row.id } } }, "Cycle status"),
        rag.button({ variant: "secondary", action: { kind: "server", name: "bump-priority", payload: { id: row.id, delta: 1 } } }, "Priority +1"),
        rag.button({ variant: "secondary", action: { kind: "server", name: "bump-priority", payload: { id: row.id, delta: -1 } } }, "Priority -1"),
        rag.button({ variant: "danger", action: { kind: "server", name: "archive-query", payload: { id: row.id } } }, "Archive")
      )
    )
  }

  function auditPanel() {
    return rag.panel({ title: "Action audit trail", density: "condensed" },
      rag.stack({ gap: "xs" },
        appState.audit.slice(-6).reverse().map(entry => rag.caption({ tone: "muted" }, entry))
      )
    )
  }

  const snapshot = {
    id: "xgoja-context-window",
    title: "xgoja Generated Context Window",
    limit: 16000,
    parts: [
      { id: "system", label: "System prompt", kind: "system", tokens: 620, importance: 0.9, pinned: true },
      { id: "chat", label: "Recent transcript", kind: "conversation", tokens: 4200, importance: 0.82 },
      { id: "docs", label: "Retrieved docs", kind: "retrieval", tokens: 7100, importance: 0.74 },
      { id: "tools", label: "Tool traces", kind: "tool", tokens: 1800, importance: 0.5 },
      { id: "notes", label: "Reviewer notes", kind: "annotation", tokens: 900, importance: 0.62 }
    ]
  }

  const transcript = {
    title: "Context review session",
    subtitle: "Rendered from rag.recipes.annotatedTranscript in xgoja",
    messages: [
      { id: "m1", role: "system", text: "You are reviewing whether the current answer used the allowed retrieval context.", tokens: 38, timestamp: "09:13" },
      { id: "m2", role: "user", text: "Why did retrieval crowd out the system prompt?", tokens: 12, timestamp: "09:14", annotationIds: ["a1"] },
      { id: "m3", role: "assistant", text: "The retrieved-doc slice grew to 44% of the window. Pinning kept the system prompt present, but reduced budget for tool traces.", tokens: 34, timestamp: "09:15", annotationIds: ["a1", "a2"] },
      { id: "m4", role: "tool", name: "context.inspect", text: "retrieval=7100 tokens, transcript=4200 tokens, tools=1800 tokens", tokens: 19, timestamp: "09:15" },
      { id: "m5", role: "assistant", text: "A safer plan is to summarize retrieved evidence before adding it to the next turn.", tokens: 21, timestamp: "09:16", annotationIds: ["a3"] }
    ],
    annotations: [
      { id: "a1", targetMessageId: "m3", kind: "context", label: "Budget pressure", text: "Retrieved documents dominate this context window.", confidence: 0.92 },
      { id: "a2", targetMessageId: "m3", kind: "course", label: "Teaching note", text: "Use the treemap to show the tradeoff.", confidence: 0.81 },
      { id: "a3", targetMessageId: "m5", kind: "summary", label: "Repair pattern", text: "Summarize before carrying evidence forward.", confidence: 0.88 }
    ]
  }

  const anchoredComments = [
    { id: "c1", anchorX: 28, anchorY: 18, author: "Reviewer", text: "Call out pinned system content before discussing retrieval.", time: "09:22", status: "open" },
    { id: "c2", anchorX: 62, anchorY: 54, author: "Instructor", text: "This is the moment to switch from budget bar to treemap.", time: "09:24", status: "open" },
    { id: "c3", anchorX: 40, anchorY: 72, author: "QA", text: "Resolved once tool traces are summarized.", time: "09:29", status: "resolved" }
  ]

  const courseSections = [
    { id: "course", label: "Course", items: [{ id: "overview", label: "Overview" }, { id: "slides", label: "Slides" }] },
    { id: "reference", label: "Reference", items: [{ id: "handout", label: "Handout" }] }
  ]

  const course = {
    id: "context-workshop",
    kicker: "Live xgoja workshop",
    title: "Context Window Engineering",
    tagline: "Learn to see, budget, annotate, and teach context windows.",
    when: "Friday 10:00",
    where: "Remote studio",
    format: "90 minute lab",
    price: "Included",
    instructor: { name: "RAG Systems Team", role: "Instructor", bio: "Builds evaluation tooling and context visualizers." },
    blurb: "This course page is generated entirely by a jsverb and rendered by the package React components.",
    outcomes: ["Read context-window diagrams", "Connect transcript annotations to budget pressure", "Package a slide and handout for reviewers"],
    agenda: [
      { id: "agenda-map", number: "01", title: "Map the window", description: "Identify pinned, retrieved, conversational, and tool slices.", duration: "20 min" },
      { id: "agenda-annotate", number: "02", title: "Annotate the transcript", description: "Attach reviewer notes to the exact messages that changed the answer.", duration: "25 min" },
      { id: "agenda-teach", number: "03", title: "Teach the repair", description: "Turn the finding into a slide and handout.", duration: "30 min" }
    ]
  }

  const slides = [
    {
      id: "slide-budget",
      number: "01",
      kicker: "Budget",
      title: "Context budget is a product decision",
      subtitle: "xgoja emits semantic Widget IR; React owns the rendering.",
      view: "budget",
      snapshotId: snapshot.id,
      notes: ["Pinned content protects invariants.", "Retrieval slices need explicit budgets.", "Tool traces should be summarized before they dominate the window."]
    },
    {
      id: "slide-treemap",
      number: "02",
      kicker: "Shape",
      title: "Treemaps make crowding obvious",
      subtitle: "When one slice expands, every other slice loses room.",
      view: "treemap",
      snapshotId: snapshot.id,
      notes: ["Look for a single dominant rectangle.", "Ask whether that slice can be summarized.", "Move low-value traces to a reference artifact."]
    },
    {
      id: "slide-stack",
      number: "03",
      kicker: "Order",
      title: "Stack order explains what the model saw first",
      subtitle: "Use stack view to discuss recency and instruction placement.",
      view: "stack",
      snapshotId: snapshot.id,
      notes: ["System and developer content should be easy to find.", "Conversation turns carry recency pressure.", "Generated summaries belong near the evidence they summarize."]
    }
  ]
  const slide = slides[0]

  const handoutBundle = {
    intro: "Reference material generated by the xgoja widget site demo.",
    docs: [
      { id: "guide", title: "Context Window Guide", file: "context-window-guide.md", format: "markdown", size: "8 KB", description: "Short checklist for reviewing context windows.", body: "# Context Window Guide\n\nUse this handout to review context composition.\n\n## Checklist\n\n- Preserve system invariants.\n- Budget retrieval explicitly.\n- Summarize verbose tool traces.\n" },
      { id: "exercise", title: "Workshop Exercise", file: "workshop-exercise.md", format: "markdown", size: "5 KB", description: "Hands-on prompt for balancing retrieval and transcript budget.", body: "# Workshop Exercise\n\nGiven a 16k window, allocate budget for system prompt, transcript, retrieval, and tools.\n" },
      { id: "rubric", title: "Review Rubric", file: "review-rubric.md", format: "markdown", size: "6 KB", description: "Scoring guide for context-window review sessions.", body: "# Review Rubric\n\nScore each answer on evidence fit, instruction preservation, and trace compactness.\n\n| Dimension | Question |\n| --- | --- |\n| Evidence | Did retrieved context support the answer? |\n| Instructions | Were system/developer instructions preserved? |\n| Trace | Were tool outputs compact enough? |\n" },
      { id: "facilitator", title: "Facilitator Notes", file: "facilitator-notes.md", format: "markdown", size: "7 KB", description: "Teaching notes for running the workshop.", body: "# Facilitator Notes\n\nStart with the transcript, then reveal the budget diagram, then ask learners to rewrite the next turn.\n" }
    ]
  }

  const navItems = [
    { id: "index", label: "Overview" },
    { id: "demo", label: "Queue" },
    { id: "actions", label: "Actions" },
    { id: "semantic", label: "Semantic" },
    { id: "transcripts", label: "Transcripts" },
    { id: "slides", label: "Slides" },
    { id: "handouts", label: "Handouts" },
    { id: "course-examples", label: "Course" }
  ]

  function pageMeta(activeNavItemId, maxWidth) {
    return { activeNavItemId, navItems, maxWidth: maxWidth || "wide" }
  }

  function semanticPage(id) {
    return rag.page({
      schemaVersion: "0.1.0",
      id,
      title: "xgoja semantic Widget IR demo",
      meta: pageMeta(id),
      sections: [
        rag.panel({ title: "Semantic recipes from xgoja" },
          rag.caption({ tone: "muted" }, "This page is authored in JavaScript with widget.dsl recipes and rendered by the React package.")),
        rag.keyValueStrip({ items: [
          { key: "Recipe count", value: "5" },
          { key: "Messages", value: String(transcript.messages.length) },
          { key: "Slides", value: String(slides.length) },
          { key: "Handouts", value: String(handoutBundle.docs.length) }
        ]}),
        rag.recipes.contextDiagram({ snapshot, view: "budget" }),
        rag.recipes.annotatedTranscript({ transcript, selectedAnnotationId: "a1", onAnnotationSelect: "note-selected" }),
        rag.recipes.courseStudio({
          sections: courseSections,
          activeItemId: "slides",
          main: rag.recipes.courseSlide({ slide, snapshot, index: 0, total: 1 })
        }),
        rag.recipes.handout({ bundle: handoutBundle, selectedDocumentId: "guide", onSelect: "document-selected", onDownload: "document-download" })
      ]
    })
  }

  function transcriptExamplesPage(id) {
    return rag.page({
      schemaVersion: "0.1.0",
      id,
      title: "xgoja transcript examples",
      meta: pageMeta(id),
      sections: [
        rag.panel({ title: "Transcript components" },
          rag.caption({ tone: "muted" }, "This page mixes direct transcript components with the annotatedTranscript recipe.")),
        rag.transcriptWorkspacePanel({
          title: transcript.title,
          subtitle: "Workspace panel with notes rail",
          messages: transcript.messages,
          annotations: transcript.annotations,
          selectedAnnotationId: "a1",
          showNotes: true,
          onAnnotationSelectAction: rag.action.server("note-selected")
        }),
        rag.splitPane({
          ratio: "course",
          divider: true,
          gutter: "lg",
          left: rag.transcriptReaderPanel({
            title: "Reader only",
            subtitle: "TranscriptReaderPanel with annotation chips",
            messages: transcript.messages,
            annotations: transcript.annotations,
            selectedAnnotationId: "a2",
            showAnnotationChips: true,
            onAnnotationSelectAction: rag.action.server("note-selected")
          }),
          right: rag.annotationRailPanel({
            title: "Annotation rail",
            description: "Annotations emitted as serializable data from xgoja.",
            annotations: transcript.annotations,
            selectedAnnotationId: "a2",
            onAnnotationSelectAction: rag.action.server("note-selected")
          })
        }),
        rag.splitPane({
          ratio: "rightNarrow",
          divider: true,
          gutter: "md",
          left: rag.figureBlock({ frame: "bordered", caption: "Transcript plus context budget" },
            rag.contextDiagramPanel({ snapshot, initialView: "strip", selectedPartId: "docs" })),
          right: rag.anchoredCommentRail({
            title: "Anchored review comments",
            comments: anchoredComments,
            selectedCommentId: "c1",
            onCommentSelectAction: rag.action.server("comment-selected")
          })
        }),
        rag.recipes.annotatedTranscript({ transcript, selectedAnnotationId: "a3", onAnnotationSelect: "note-selected" })
      ]
    })
  }

  function slideExamplesPage(id) {
    return rag.page({
      schemaVersion: "0.1.0",
      id,
      title: "xgoja slide examples",
      meta: pageMeta(id),
      sections: [
        rag.panel({ title: "Slide examples" },
          rag.caption({ tone: "muted" }, "CourseSlidePanel is useful for standard teaching slides; SlideShell is useful for custom compositions.")),
        rag.courseSlidePanel({ slide: slides[0], snapshot, index: 0, total: slides.length, visualSide: "right" }),
        rag.courseSlidePanel({ slide: slides[1], snapshot, index: 1, total: slides.length, visualSide: "left" }),
        rag.slideShell({
          eyebrow: "custom xgoja slide",
          counter: "03 / 03",
          title: "A slide can be assembled from direct Widget IR nodes",
          subtitle: "FigureBlock, KeyPointList, ContextLegend, and ContextBudgetBar all render through React.",
          primarySide: "left",
          ratio: "secondaryWide",
          primary: rag.figureBlock({ frame: "bordered", caption: "Budget bar inside a FigureBlock", legend: rag.contextLegend({ compact: true }) },
            rag.contextBudgetBar({ snapshot })),
          secondary: rag.keyPointList({ items: [
            { id: "data", title: "Data only", text: "xgoja returns JSON-compatible Widget IR." },
            { id: "slots", title: "Slots", text: "Renderable slot props can contain nested WidgetNodes." },
            { id: "render", title: "Renderer", text: "React owns layout, CSS modules, and interaction binding." }
          ]}),
          footer: rag.inline({ justify: "between" },
            rag.button({ size: "compact" }, "Previous"),
            rag.button({ size: "compact", variant: "primary" }, "Next"))
        })
      ]
    })
  }

  function handoutExamplesPage(id) {
    const selected = handoutBundle.docs[0]
    return rag.page({
      schemaVersion: "0.1.0",
      id,
      title: "xgoja handout examples",
      meta: pageMeta(id),
      sections: [
        rag.panel({ title: "Handout components" },
          rag.caption({ tone: "muted" }, "The full shell and the molecule-level list/toolbar/article composition are both authored from xgoja.")),
        rag.handoutDocumentShell({
          title: "Workshop handout shell",
          intro: handoutBundle.intro,
          documents: handoutBundle.docs,
          selectedDocumentId: selected.id,
          onDocumentSelectAction: rag.action.server("document-selected"),
          onDownloadAction: rag.action.server("document-download"),
          onDownloadAllAction: rag.action.server("download-all")
        }),
        rag.splitPane({
          ratio: "sidebar",
          divider: true,
          gutter: "lg",
          left: rag.documentListPanel({
            title: "Documents",
            description: "A custom handout reader assembled from molecules.",
            items: handoutBundle.docs.map(doc => ({ id: doc.id, title: doc.title, format: doc.format, size: doc.size, description: doc.description })),
            selectedItemId: selected.id,
            showItemDescriptions: true,
            onItemSelectAction: rag.action.server("document-selected"),
            onDownloadAllAction: rag.action.server("download-all")
          }),
          right: rag.stack({ gap: "sm" },
            rag.documentPreviewToolbar({
              file: selected.file,
              format: selected.format,
              size: selected.size,
              rightSlot: rag.annotationBadge({ kind: "course", label: "selected" }),
              onDownloadAction: rag.action.server("document-download")
            }),
            rag.markdownArticle({ source: selected.body }))
        })
      ]
    })
  }

  function courseExamplesPage(id) {
    return rag.page({
      schemaVersion: "0.1.0",
      id,
      title: "xgoja course examples",
      meta: pageMeta(id),
      sections: [
        rag.courseLessonPanel({ course, activeAgendaItemId: "agenda-annotate", onAgendaItemSelectAction: rag.action.server("agenda-selected") }),
        rag.courseStudioShell({
          sections: courseSections,
          activeItemId: "slides",
          title: "xgoja Course Studio",
          subtitle: "Direct CourseStudioShell node with a CourseSlidePanel child",
          sidebarFooter: rag.caption({ tone: "muted" }, "Generated by examples/xgoja/widget-site")
        }, rag.courseSlidePanel({ slide: slides[2], snapshot, index: 2, total: slides.length, visualSide: "right" }))
      ]
    })
  }

  function overviewPage(id) {
    return rag.page({
      schemaVersion: "0.1.0",
      id,
      title: "xgoja Widget IR examples",
      meta: pageMeta(id),
      sections: [
        rag.panel({ title: "xgoja Widget IR examples" },
          rag.statusText({ status: "succeeded", icon: true }, "Generated xgoja server is running"),
          rag.caption({ tone: "muted" }, "Each top-nav item now serves a distinct Widget IR page from the jsverb.")),
        rag.keyValueStrip({ items: [
          { key: "Dashboard rows", value: String(allRows().length) },
          { key: "Transcript messages", value: String(transcript.messages.length) },
          { key: "Slides", value: String(slides.length) },
          { key: "Handouts", value: String(handoutBundle.docs.length) }
        ]}),
        rag.panel({ title: "Browse examples" },
          rag.inline({ gap: "sm", wrap: true },
            rag.button({ action: rag.action.navigate("/pages/demo") }, "Queue demo"),
            rag.button({ action: rag.action.navigate("/pages/actions") }, "Actions lab"),
            rag.button({ action: rag.action.navigate("/pages/transcripts") }, "Transcripts"),
            rag.button({ action: rag.action.navigate("/pages/slides") }, "Slides"),
            rag.button({ action: rag.action.navigate("/pages/handouts") }, "Handouts"),
            rag.button({ action: rag.action.navigate("/pages/course-examples") }, "Course"))),
        rag.recipes.contextDiagram({ snapshot, view: "budget" })
      ]
    })
  }

  function widgetPage(id) {
    const rows = allRows()
    const selected = selectedRow()
    return rag.page({
      schemaVersion: "0.1.0",
      id,
      title: "xgoja queue demo",
      meta: pageMeta(id),
      sections: [
        rag.panel({ title: "Queue demo" },
          rag.statusText({ status: "succeeded", icon: true }, "Rows: " + rows.length),
          rag.caption({ tone: "muted" }, "This page focuses on the master-detail table. Click a row to switch the selected detail pane.")
        ),
        pageSummary(id),
        rag.recipes.masterDetailTable({
          title: "Query queue",
          rows,
          columns: queryColumns(),
          selectedKey: appState.selectedId,
          onRowSelect: "select-query",
          detail: () => selectedPanel(selected)
        })
      ]
    })
  }

  function actionsPage(id) {
    const rows = allRows()
    const selected = selectedRow()
    return rag.page({
      schemaVersion: "0.1.0",
      id,
      title: "xgoja actions lab",
      meta: pageMeta(id),
      sections: [
        rag.panel({ title: "Actions lab" },
          rag.caption({ tone: "muted" }, "This page focuses on buttons and server actions. Use Queue for row-selection pane switching.")),
        pageSummary(id),
        toolbar(),
        rag.splitPane({
          ratio: "rightNarrow",
          divider: true,
          gutter: "lg",
          left: selectedPanel(selected),
          right: auditPanel()
        }),
        rag.panel({ title: "Current rows", density: "condensed" },
          rag.dataTable({ rows, getRowKey: "id", columns: queryColumns(), selectedKey: appState.selectedId, onRowSelect: rag.action.server("select-query") }))
      ]
    })
  }

  function payload(req) {
    return (req.body && req.body.payload) || {}
  }

  function actionContext(req) {
    return (req.body && req.body.context) || {}
  }

  function remember(message) {
    appState.audit.push(new Date().toISOString().slice(11, 19) + " " + message)
  }

  function actionResult(message) {
    remember(message)
    return { ok: true, refresh: true, toast: message, data: { message } }
  }

  app.get("/api/widget/pages/index", (_req, res) => res.json(overviewPage("index")))
  app.get("/api/widget/pages/demo", (_req, res) => res.json(widgetPage("demo")))
  app.get("/api/widget/pages/actions", (_req, res) => res.json(actionsPage("actions")))
  app.get("/api/widget/pages/semantic", (_req, res) => res.json(semanticPage("semantic")))
  app.get("/api/widget/pages/transcripts", (_req, res) => res.json(transcriptExamplesPage("transcripts")))
  app.get("/api/widget/pages/slides", (_req, res) => res.json(slideExamplesPage("slides")))
  app.get("/api/widget/pages/handouts", (_req, res) => res.json(handoutExamplesPage("handouts")))
  app.get("/api/widget/pages/course-examples", (_req, res) => res.json(courseExamplesPage("course-examples")))
  app.get("/api/widget/pages/context", (_req, res) => res.json(rag.page({ schemaVersion: "0.1.0", id: "context", title: "Context recipe", meta: pageMeta("semantic"), sections: [rag.recipes.contextDiagram({ snapshot, view: "treemap" })] })))
  app.get("/api/widget/pages/course", (_req, res) => res.json(rag.page({ schemaVersion: "0.1.0", id: "course", title: "Course recipe", meta: pageMeta("course-examples"), sections: [rag.recipes.courseStudio({ sections: courseSections, activeItemId: "slides", main: rag.recipes.courseSlide({ slide, snapshot, index: 0, total: 1 }) })] })))
  app.get("/api/widget/pages/handout", (_req, res) => res.json(rag.page({ schemaVersion: "0.1.0", id: "handout", title: "Handout recipe", meta: pageMeta("handouts"), sections: [rag.recipes.handout({ bundle: handoutBundle, selectedDocumentId: "guide" })] })))

  app.post("/api/widget/actions/note-selected", (req, res) => {
    const ctx = actionContext(req)
    res.json(actionResult("Selected annotation " + String(ctx.annotationId || ctx.value || "unknown")))
  })

  app.post("/api/widget/actions/comment-selected", (req, res) => {
    const ctx = actionContext(req)
    res.json(actionResult("Selected comment " + String(ctx.commentId || ctx.value || "unknown")))
  })

  app.post("/api/widget/actions/document-selected", (req, res) => {
    const ctx = actionContext(req)
    res.json(actionResult("Selected document " + String(ctx.documentId || ctx.itemId || ctx.value || "unknown")))
  })

  app.post("/api/widget/actions/document-download", (req, res) => {
    const ctx = actionContext(req)
    res.json(actionResult("Downloaded document " + String(ctx.documentId || ctx.file || ctx.value || "current")))
  })

  app.post("/api/widget/actions/download-all", (_req, res) => res.json(actionResult("Downloaded all handouts")))
  app.post("/api/widget/actions/agenda-selected", (req, res) => {
    const ctx = actionContext(req)
    res.json(actionResult("Selected agenda item " + String(ctx.itemId || ctx.value || "unknown")))
  })

  app.post("/api/widget/actions/select-query", (req, res) => {
    const ctx = actionContext(req)
    const row = ctx.row || {}
    const nextId = Number(row.id || ctx.rowKey || payload(req).id || appState.selectedId)
    if (nextId > 0) appState.selectedId = nextId
    res.json(actionResult("Selected query #" + appState.selectedId))
  })

  app.post("/api/widget/actions/cycle-status", (req, res) => {
    const id = Number(payload(req).id || appState.selectedId)
    const rows = db.query("SELECT status FROM queries WHERE id = ?", id)
    if (rows.length === 0) return res.status(404).json({ ok: false, error: "query not found" })
    const status = nextStatus(rows[0].status)
    db.exec("UPDATE queries SET status = ? WHERE id = ?", status, id)
    appState.selectedId = id
    res.json(actionResult("Query #" + id + " status -> " + status))
  })

  app.post("/api/widget/actions/bump-priority", (req, res) => {
    const data = payload(req)
    const id = Number(data.id || appState.selectedId)
    const delta = Number(data.delta || 1)
    db.exec("UPDATE queries SET priority = MAX(0, priority + ?) WHERE id = ?", delta, id)
    appState.selectedId = id
    res.json(actionResult("Query #" + id + " priority changed by " + delta))
  })

  app.post("/api/widget/actions/archive-query", (req, res) => {
    const id = Number(payload(req).id || appState.selectedId)
    db.exec("DELETE FROM queries WHERE id = ?", id)
    const rows = allRows()
    appState.selectedId = rows.length > 0 ? Number(rows[0].id) : 0
    res.json(actionResult("Archived query #" + id))
  })

  app.post("/api/widget/actions/add-query", (req, res) => {
    const owner = String(payload(req).owner || "research")
    const next = db.query("SELECT COALESCE(MAX(id), 0) + 1 AS id FROM queries")[0].id
    db.exec("INSERT INTO queries (name, status, priority, owner, notes) VALUES (?, ?, ?, ?, ?)", "Follow-up Query " + next, "pending", 1, owner, "Created by a Widget IR action")
    appState.selectedId = Number(next)
    res.json(actionResult("Added query #" + next))
  })

  app.post("/api/widget/actions/bulk-retry-failed", (_req, res) => {
    db.exec("UPDATE queries SET status = 'running', notes = 'Bulk retry requested from Widget IR action' WHERE status = 'failed'")
    res.json(actionResult("Retried failed queries"))
  })

  app.post("/api/widget/actions/reset-demo", (_req, res) => {
    db.exec("DELETE FROM queries")
    db.exec("INSERT INTO queries (id, name, status, priority, owner, notes) VALUES (?, ?, ?, ?, ?, ?)", 1, "Fast Growing Trees", "succeeded", 3, "botany", "Seeded from the xgoja demo")
    db.exec("INSERT INTO queries (id, name, status, priority, owner, notes) VALUES (?, ?, ?, ?, ?, ?)", 2, "Arborvitae Spacing", "running", 2, "landscape", "Needs another pass")
    db.exec("INSERT INTO queries (id, name, status, priority, owner, notes) VALUES (?, ?, ?, ?, ?, ?)", 3, "Broken Import Example", "failed", 1, "ingest", "Retry after source cleanup")
    appState.selectedId = 1
    appState.audit = ["Demo reset"]
    res.json({ ok: true, refresh: true, toast: "Demo reset", data: { message: "Demo reset" } })
  })
}
