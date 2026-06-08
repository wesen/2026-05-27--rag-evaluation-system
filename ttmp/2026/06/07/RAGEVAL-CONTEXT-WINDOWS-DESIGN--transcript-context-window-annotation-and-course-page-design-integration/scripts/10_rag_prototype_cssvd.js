__package__({
  name: 'prototype',
  parents: ['rag'],
  short: 'RAG context-viewer prototype screenshot capture commands',
})

var cvd = require('css-visual-diff')
var fs = require('fs')
var path = require('path')

var SOURCE_PATH = '/sources/03-context-viewer-design-iteration/index.html'
var DIRECT_BASE = '/prototype-design/standalone/full-app'
var WIDGET_BASE = '/prototype-design/standalone/widgets'

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function slugify(s) {
  return String(s || 'target').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function urlJoin(base, suffix) {
  return String(base || 'http://127.0.0.1:7071').replace(/\/$/, '') + suffix
}

function defaultTargets(baseUrl) {
  var b = baseUrl || 'http://127.0.0.1:7071'
  return [
    { name: 'full-app-shell', page: 'app', url: urlJoin(b, SOURCE_PATH), selector: '#root', viewport: { width: 1240, height: 760 } },
    { name: 'app-sidebar', page: 'app', url: urlJoin(b, SOURCE_PATH), selector: '[data-rag-organism="AppSidebar"]', viewport: { width: 1240, height: 760 } },

    { name: 'course-landing-page', page: 'landing', url: urlJoin(b, DIRECT_BASE + '/landing.html'), selector: '[data-rag-organism="LandingScreen"]', viewport: { width: 1240, height: 760 } },
    { name: 'course-landing-legend', page: 'landing', url: urlJoin(b, DIRECT_BASE + '/landing.html'), selector: '[data-rag-molecule="ContextLegend"]', viewport: { width: 1240, height: 760 } },

    { name: 'context-visualize-page', page: 'visualize', url: urlJoin(b, DIRECT_BASE + '/visualize.html'), selector: '[data-rag-organism="Visualize"]', viewport: { width: 1240, height: 760 } },
    { name: 'context-strip-diagram', page: 'visualize', url: urlJoin(b, DIRECT_BASE + '/visualize.html'), selector: '[data-rag-molecule="ContextStripDiagram"]', viewport: { width: 1240, height: 760 } },
    { name: 'context-legend', page: 'visualize', url: urlJoin(b, DIRECT_BASE + '/visualize.html'), selector: '[data-rag-molecule="ContextLegend"]', viewport: { width: 1240, height: 760 } },

    { name: 'widget-strip-diagram', page: 'widgets', url: urlJoin(b, WIDGET_BASE + '/strip-diagram.html'), selector: '[data-rag-molecule="ContextStripDiagram"]', viewport: { width: 760, height: 520 } },
    { name: 'widget-stack-diagram', page: 'widgets', url: urlJoin(b, WIDGET_BASE + '/stack-diagram.html'), selector: '[data-rag-molecule="ContextStackDiagram"]', viewport: { width: 760, height: 520 } },
    { name: 'widget-budget-bar', page: 'widgets', url: urlJoin(b, WIDGET_BASE + '/budget-bar.html'), selector: '[data-rag-molecule="ContextBudgetBar"]', viewport: { width: 760, height: 520 } },
    { name: 'widget-treemap', page: 'widgets', url: urlJoin(b, WIDGET_BASE + '/treemap.html'), selector: '[data-rag-molecule="ContextTreemap"]', viewport: { width: 760, height: 520 } },

    { name: 'transcript-page', page: 'transcript', url: urlJoin(b, DIRECT_BASE + '/transcript.html'), selector: '[data-rag-organism="TranscriptReaderPanel"]', viewport: { width: 1240, height: 760 } },
    { name: 'transcript-message-card', page: 'transcript', url: urlJoin(b, DIRECT_BASE + '/transcript.html'), selector: '[data-rag-molecule="TranscriptMessageCard"]', viewport: { width: 1240, height: 760 } },
    { name: 'annotation-rail-panel', page: 'transcript', url: urlJoin(b, DIRECT_BASE + '/transcript.html'), selector: '[data-rag-organism="AnnotationRailPanel"]', viewport: { width: 1240, height: 760 } },

    { name: 'comments-page', page: 'comments', url: urlJoin(b, DIRECT_BASE + '/comments.html'), selector: '[data-rag-organism="Comments"]', viewport: { width: 1240, height: 760 } },
    { name: 'anchored-comment-rail', page: 'comments', url: urlJoin(b, DIRECT_BASE + '/comments.html'), selector: '[data-rag-organism="AnchoredCommentRail"]', viewport: { width: 1240, height: 760 } },
    { name: 'anchored-comment-card', page: 'comments', url: urlJoin(b, DIRECT_BASE + '/comments.html'), selector: '[data-rag-molecule="AnchoredCommentCard"]', viewport: { width: 1240, height: 760 } },

    { name: 'slides-page', page: 'slides', url: urlJoin(b, DIRECT_BASE + '/slides.html'), selector: '[data-rag-organism="SlideViewer"]', viewport: { width: 1240, height: 760 } },
    { name: 'course-slide-panel', page: 'slides', url: urlJoin(b, DIRECT_BASE + '/slides.html'), selector: '[data-rag-organism="CourseSlidePanel"]', viewport: { width: 1240, height: 760 } },
    { name: 'slide-diagram', page: 'slides', url: urlJoin(b, DIRECT_BASE + '/slides.html'), selector: '[data-rag-molecule^="Context"]', viewport: { width: 1240, height: 760 } },

    { name: 'handout-page', page: 'handout', url: urlJoin(b, DIRECT_BASE + '/handout.html'), selector: '[data-rag-organism="Handout"]', viewport: { width: 1240, height: 760 } },
    { name: 'upload-page', page: 'upload', url: urlJoin(b, DIRECT_BASE + '/upload.html'), selector: '[data-rag-organism="Upload"]', viewport: { width: 1240, height: 760 } },
  ]
}

function targetByName(name, baseUrl) {
  var targets = defaultTargets(baseUrl)
  for (var i = 0; i < targets.length; i++) {
    if (targets[i].name === name) return targets[i]
  }
  throw new Error('unknown target: ' + name)
}

async function captureTargetRecord(target, values) {
  values = values || {}
  var outDir = values.outDir || 'prototype-design/visual-diff/prototype-screenshots'
  var targetDir = path.join(outDir, slugify(target.name))
  ensureDir(targetDir)
  var outputFile = path.join(outDir, slugify(target.name) + '.png')
  var props = ['display', 'position', 'width', 'height', 'padding', 'margin', 'font-family', 'font-size', 'line-height', 'color', 'background-color', 'border', 'box-shadow', 'overflow']

  var browser = await cvd.browser()
  var page
  try {
    page = await browser.page(target.url, {
      viewport: target.viewport || { width: values.width || 1240, height: values.height || 760 },
      waitMs: values.waitMs == null ? 2000 : values.waitMs,
      name: target.name,
    })
    var locator = page.locator(target.selector)
    await locator.waitFor({ timeoutMs: values.timeoutMs || 30000, pollIntervalMs: 100, visible: true, afterWaitMs: 500 })
    var status = await locator.status()
    var artifact = await page.inspect(
      { name: target.name, selector: target.selector, props: props },
      { outDir: targetDir, artifacts: 'screenshot' }
    )
    var screenshotPath = artifact && artifact.screenshot
    if (!screenshotPath) throw new Error('page.inspect did not return screenshot artifact for ' + target.name)
    if (path.resolve(screenshotPath) !== path.resolve(outputFile)) fs.copyFileSync(screenshotPath, outputFile)
    return {
      ok: true,
      name: target.name,
      page: target.page,
      url: target.url,
      selector: target.selector,
      outputFile: outputFile,
      inspectOutDir: targetDir,
      sourceArtifact: screenshotPath,
      bounds: status.bounds || null,
    }
  } catch (err) {
    return {
      ok: false,
      name: target.name,
      page: target.page,
      url: target.url,
      selector: target.selector,
      outputFile: outputFile,
      inspectOutDir: targetDir,
      error: err && err.message ? err.message : String(err),
    }
  } finally {
    if (page) await page.close()
    await browser.close()
  }
}

async function listTargets(values) {
  return defaultTargets(values && values.baseUrl).map(function (t) {
    return { name: t.name, page: t.page, url: t.url, selector: t.selector, viewport: t.viewport }
  })
}

__verb__('listTargets', {
  parents: ['rag', 'prototype'],
  short: 'List registered RAG prototype screenshot targets',
  output: 'structured',
  fields: {
    values: { bind: 'all' },
    baseUrl: { type: 'string', default: 'http://127.0.0.1:7071', help: 'Prototype server base URL' },
  },
})

async function captureTarget(name, values) {
  var target = targetByName(name, values && values.baseUrl)
  return [await captureTargetRecord(target, values || {})]
}

__verb__('captureTarget', {
  parents: ['rag', 'prototype'],
  short: 'Capture one RAG prototype target screenshot via css-visual-diff browser runtime',
  output: 'structured',
  fields: {
    name: { argument: true, required: true, help: 'Target name from list-targets' },
    values: { bind: 'all' },
    baseUrl: { type: 'string', default: 'http://127.0.0.1:7071', help: 'Prototype server base URL' },
    outDir: { type: 'string', default: 'prototype-design/visual-diff/prototype-screenshots', help: 'Output directory for screenshots/artifacts' },
    waitMs: { type: 'int', default: 2000, help: 'Post-navigation wait in milliseconds' },
    timeoutMs: { type: 'int', default: 30000, help: 'Selector wait timeout in milliseconds' },
  },
})

async function captureAll(values) {
  values = values || {}
  var pageFilter = values.page || ''
  var targets = defaultTargets(values.baseUrl)
  if (pageFilter) targets = targets.filter(function (t) { return t.page === pageFilter })
  var out = []
  for (var i = 0; i < targets.length; i++) {
    out.push(await captureTargetRecord(targets[i], values))
  }
  var summaryPath = path.join(values.outDir || 'prototype-design/visual-diff/prototype-screenshots', 'summary.json')
  ensureDir(path.dirname(summaryPath))
  fs.writeFileSync(summaryPath, JSON.stringify({ createdAt: new Date().toISOString(), results: out }, null, 2))
  return out
}

__verb__('captureAll', {
  parents: ['rag', 'prototype'],
  short: 'Capture all registered RAG prototype page/widget screenshots',
  output: 'structured',
  fields: {
    values: { bind: 'all' },
    baseUrl: { type: 'string', default: 'http://127.0.0.1:7071', help: 'Prototype server base URL' },
    outDir: { type: 'string', default: 'prototype-design/visual-diff/prototype-screenshots', help: 'Output directory for screenshots/artifacts' },
    page: { type: 'string', default: '', help: 'Optional page filter' },
    waitMs: { type: 'int', default: 2000, help: 'Post-navigation wait in milliseconds' },
    timeoutMs: { type: 'int', default: 30000, help: 'Selector wait timeout in milliseconds' },
  },
})
