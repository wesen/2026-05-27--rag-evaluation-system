__package__({
  name: "clubmed-visual-smoke",
  parents: ["clubmed"],
  short: "ClubMed minitrace-viz and Storybook visual smoke capture"
})

async function capture(values) {
  const cvd = require("css-visual-diff")
  const outDir = values.outDir
  const appUrl = values.appUrl.replace(/\/$/, "")
  const storybookUrl = values.storybookUrl.replace(/\/$/, "")
  const viewport = { width: values.viewportWidth, height: values.viewportHeight }
  const waitMs = values.waitMs

  const targets = [
    {
      slug: "clubmed-course",
      name: "ClubMed course landing",
      url: `${appUrl}/pages/course`,
      probes: [
        { name: "app-root", selector: '[data-rag-page="RagEvaluationSiteApp"]', props: ["background-color", "color", "font-family"] },
        { name: "course-shell", selector: '[data-rag-organism="CourseStudioShell"]', props: ["display", "background-color", "min-height"] },
        { name: "course-lesson", selector: '[data-rag-organism="CourseLessonPanel"]', props: ["background-color", "color"] },
      ],
      overlay: [
        ["App root", '[data-rag-page="RagEvaluationSiteApp"]', "#0ea5e9"],
        ["Course shell", '[data-rag-organism="CourseStudioShell"]', "#a855f7"],
        ["Lesson", '[data-rag-organism="CourseLessonPanel"]', "#22c55e"],
      ],
    },
    {
      slug: "clubmed-upload",
      name: "ClubMed upload workflow",
      url: `${appUrl}/pages/upload`,
      probes: [
        { name: "course-shell", selector: '[data-rag-organism="CourseStudioShell"]', props: ["display", "background-color", "min-height"] },
        { name: "upload-drop", selector: '[data-rag-organism="ContextUploadDropArea"]', props: ["background-color", "border", "border-radius", "padding"] },
      ],
      overlay: [
        ["Course shell", '[data-rag-organism="CourseStudioShell"]', "#a855f7"],
        ["Upload drop area", '[data-rag-organism="ContextUploadDropArea"]', "#f97316"],
      ],
    },
    {
      slug: "clubmed-slides",
      name: "ClubMed restored slides page",
      url: `${appUrl}/pages/slides`,
      probes: [
        { name: "course-shell", selector: '[data-rag-organism="CourseStudioShell"]', props: ["display", "background-color", "min-height"] },
        { name: "slide-panel", selector: '[data-rag-organism="CourseSlidePanel"]', props: ["display", "background-color", "color"] },
      ],
      overlay: [
        ["Course shell", '[data-rag-organism="CourseStudioShell"]', "#a855f7"],
        ["Slide panel", '[data-rag-organism="CourseSlidePanel"]', "#22c55e"],
      ],
    },
    {
      slug: "clubmed-handouts",
      name: "ClubMed restored handouts page",
      url: `${appUrl}/pages/handouts`,
      probes: [
        { name: "course-shell", selector: '[data-rag-organism="CourseStudioShell"]', props: ["display", "background-color", "min-height"] },
        { name: "handout-shell", selector: '[data-rag-organism="HandoutDocumentShell"]', props: ["display", "background-color", "color"] },
      ],
      overlay: [
        ["Course shell", '[data-rag-organism="CourseStudioShell"]', "#a855f7"],
        ["Handouts", '[data-rag-organism="HandoutDocumentShell"]', "#22c55e"],
      ],
    },
    {
      slug: "storybook-context-diagram",
      name: "Storybook context diagram custom legend",
      url: `${storybookUrl}/iframe.html?id=widget-ir-renderer-context-diagrams--custom-three-label-widget-ir&viewMode=story`,
      probes: [
        { name: "story-root", selector: "#storybook-root", props: ["background-color", "color", "font-family"] },
        { name: "context-panel", selector: '[data-rag-organism="ContextDiagramPanel"]', props: ["background-color", "border", "border-radius"] },
      ],
      overlay: [
        ["Story root", "#storybook-root", "#0ea5e9"],
        ["Context diagram", '[data-rag-organism="ContextDiagramPanel"]', "#f97316"],
      ],
    },
    {
      slug: "storybook-transcript-notes",
      name: "Storybook transcript with notes rail",
      url: `${storybookUrl}/iframe.html?id=widget-ir-renderer-transcript-and-notes--annotated-transcript-with-notes-rail&viewMode=story`,
      probes: [
        { name: "story-root", selector: "#storybook-root", props: ["background-color", "color", "font-family"] },
        { name: "transcript-workspace", selector: '[data-rag-organism="TranscriptWorkspacePanel"]', props: ["display", "background-color"] },
        { name: "message-card", selector: '[data-rag-molecule="TranscriptMessageCard"]', props: ["background-color", "border", "border-radius", "color"] },
      ],
      overlay: [
        ["Transcript workspace", '[data-rag-organism="TranscriptWorkspacePanel"]', "#a855f7"],
        ["Message card", '[data-rag-molecule="TranscriptMessageCard"]', "#22c55e"],
      ],
    },
    {
      slug: "storybook-course-handouts",
      name: "Storybook course and handout registry surface",
      url: `${storybookUrl}/iframe.html?id=widget-ir-renderer-domain-registry-coverage--course-handout-registry-surface&viewMode=story`,
      probes: [
        { name: "story-root", selector: "#storybook-root", props: ["background-color", "color", "font-family"] },
        { name: "course-shell", selector: '[data-rag-organism="CourseStudioShell"]', props: ["display", "background-color"] },
        { name: "handout-shell", selector: '[data-rag-organism="HandoutDocumentShell"]', props: ["display", "background-color"] },
      ],
      overlay: [
        ["Course shell", '[data-rag-organism="CourseStudioShell"]', "#a855f7"],
        ["Handouts", '[data-rag-organism="HandoutDocumentShell"]', "#22c55e"],
      ],
    },
  ]

  await cvd.write.json(`${outDir}/targets.json`, targets.map(t => ({ slug: t.slug, name: t.name, url: t.url })))

  const browser = await cvd.browser()
  const rows = []
  const missing = []
  try {
    for (const target of targets) {
      const page = await browser.page(target.url, { viewport, waitMs, name: target.slug })
      try {
        await page.css(`* { animation: none !important; transition: none !important; } html { scroll-behavior: auto !important; } body { min-height: 100vh; }`)
        const statuses = await page.preflight(target.probes.map(p => ({ name: p.name, selector: p.selector, source: "visual-smoke", required: true })))
        await cvd.write.json(`${outDir}/${target.slug}.preflight.json`, statuses)
        for (const status of statuses) {
          if (!status.exists) missing.push(`${target.slug}:${status.name}`)
        }
        const existing = target.probes.filter((_p, idx) => statuses[idx] && statuses[idx].exists)
        if (existing.length > 0) {
          await page.inspectAll(existing, { outDir: `${outDir}/artifacts/${target.slug}`, artifacts: "css-json" })
        }
        const overlayBuilder = cvd.overlaySpec()
          .legend(true)
          .screenshot("fullPage")
          .style({
            legend: { position: "bottom-right", background: "rgba(255,255,255,0.92)", color: "#111827" },
            targetDefaults: { borderWidth: 2, contentBackground: "rgba(14,165,233,0.08)", labelColor: "white" },
          })
        for (const [name, selector, color] of target.overlay) {
          const status = await page.locator(selector).status()
          if (status.exists) overlayBuilder.target(cvd.overlayTarget(name).selector(selector).borderColor(color).labelBackground(color))
        }
        const overlay = await page.overlay(overlayBuilder.build()).screenshot(`${outDir}/${target.slug}.overlay.png`)
        rows.push({ slug: target.slug, name: target.name, url: target.url, overlay })
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }

  const md = [
    "---",
    "Title: ClubMed Visual Smoke Summary",
    "DocType: reference",
    "Ticket: CTX-WINDOW-BLOCK-VIZ",
    "Status: active",
    "Intent: short-term",
    "Topics:",
    "  - frontend",
    "  - visual-testing",
    "---",
    "",
    "# ClubMed Visual Smoke Summary",
    "",
    `- App URL: ${appUrl}`,
    `- Storybook URL: ${storybookUrl}`,
    `- Viewport: ${viewport.width}x${viewport.height}`,
    `- Wait: ${waitMs}ms`,
    `- Missing required probes: ${missing.length ? missing.join(", ") : "none"}`,
    "",
    "## Captured targets",
    "",
    ...rows.map(row => `- **${row.name}** (${row.slug}) — ${row.url}\n  - overlay: \`${row.slug}.overlay.png\`\n  - preflight: \`${row.slug}.preflight.json\``),
  ].join("\n")
  await cvd.write.markdown(`${outDir}/01-visual-smoke-summary.md`, md)
  if (missing.length) throw new Error(`Missing required visual probes: ${missing.join(", ")}`)
  return rows.map(row => ({ slug: row.slug, overlay: `${outDir}/${row.slug}.overlay.png` }))
}

__verb__("capture", {
  parents: ["clubmed", "visual-smoke"],
  short: "Capture ClubMed minitrace-viz and Storybook visual smoke evidence",
  output: "structured",
  fields: {
    outDir: { argument: true, required: true, help: "Output directory for visual smoke artifacts" },
    values: { bind: "all" },
    appUrl: { type: "string", default: "http://127.0.0.1:18787", help: "Base URL of the ClubMed minitrace-viz server" },
    storybookUrl: { type: "string", default: "http://127.0.0.1:6007", help: "Base URL of Storybook static server" },
    viewportWidth: { type: "int", default: 1440 },
    viewportHeight: { type: "int", default: 1100 },
    waitMs: { type: "int", default: 1000 }
  }
})
