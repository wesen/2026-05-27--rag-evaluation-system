/* data.jsx — sample content for every screen. One source of truth for context
   windows; adapters derive each diagram shape from the same token budget. */

/* ---------- context-window snapshots (a coding-agent session) ---------- */
/* Each part: { label, kind, tokens, note? }. limit is the model window. */
const LIMIT = 200000;

const SNAPSHOTS = [
  {
    id: "t03",
    title: "Turn 3 — warming up",
    sub: "Agent has read the repo map and the failing test.",
    limit: LIMIT,
    parts: [
      { label: "system + tools", kind: "system", tokens: 7200, note: "instructions + tool schemas" },
      { label: "project context", kind: "context", tokens: 4100, note: "CLAUDE.md, repo map" },
      { label: "conversation", kind: "context", tokens: 5200, note: "3 turns so far" },
      { label: "file reads", kind: "result", tokens: 9800, note: "test + 2 source files" },
      { label: "current task", kind: "active", tokens: 1400, note: "fix failing test" },
      { label: "free space", kind: "empty", tokens: 162300 },
    ],
  },
  {
    id: "t14",
    title: "Turn 14 — deep in the bug",
    sub: "Many tool results accumulated; scratchpad reasoning growing.",
    limit: LIMIT,
    parts: [
      { label: "system + tools", kind: "system", tokens: 7200, note: "instructions + tool schemas" },
      { label: "project context", kind: "context", tokens: 4100, note: "CLAUDE.md, repo map" },
      { label: "summary", kind: "summary", tokens: 3400, note: "turns 1–6 compressed" },
      { label: "conversation", kind: "context", tokens: 21800, note: "turns 7–14" },
      { label: "file reads", kind: "result", tokens: 38600, note: "6 files + grep output" },
      { label: "test output", kind: "result", tokens: 12400, note: "stack traces" },
      { label: "scratchpad", kind: "generated", tokens: 9200, note: "hypotheses, plan" },
      { label: "current task", kind: "active", tokens: 1900, note: "patch the parser" },
      { label: "free space", kind: "empty", tokens: 91700 },
    ],
  },
  {
    id: "t31",
    title: "Turn 31 — at the limit",
    sub: "Window full. Old turns evicted; results re-summarized to reclaim space.",
    limit: LIMIT,
    parts: [
      { label: "system + tools", kind: "system", tokens: 7200, note: "instructions + tool schemas" },
      { label: "project context", kind: "context", tokens: 4100, note: "CLAUDE.md, repo map" },
      { label: "evicted", kind: "evicted", tokens: 28400, note: "turns 1–18 dropped" },
      { label: "summary", kind: "summary", tokens: 8600, note: "rolling summary" },
      { label: "conversation", kind: "context", tokens: 41200, note: "turns 19–31" },
      { label: "file reads", kind: "result", tokens: 64800, note: "12 files in working set" },
      { label: "scratchpad", kind: "generated", tokens: 22600, note: "long reasoning trace" },
      { label: "current task", kind: "active", tokens: 2100, note: "verify the fix" },
      { label: "free space", kind: "empty", tokens: 21000 },
    ],
  },
  {
    id: "over",
    title: "Turn 31 — before reclaim (over budget)",
    sub: "What the naïve append-everything window would have looked like.",
    limit: LIMIT,
    parts: [
      { label: "system + tools", kind: "system", tokens: 7200 },
      { label: "project context", kind: "context", tokens: 4100 },
      { label: "conversation (all)", kind: "context", tokens: 88200 },
      { label: "file reads (all)", kind: "result", tokens: 96400 },
      { label: "scratchpad", kind: "generated", tokens: 31600 },
      { label: "current task", kind: "active", tokens: 2100 },
    ],
  },
];

/* adapters: CW -> diagram-specific shapes */
function cwTotal(cw) { return cw.parts.reduce((s, p) => s + (p.kind === "empty" ? 0 : p.tokens), 0); }

function toStrip(cw) {
  const segs = [];
  cw.parts.forEach((p, i) => {
    if (i > 0 && p.kind !== "empty" && cw.parts[i - 1].kind !== "empty") segs.push({ kind: "separator" });
    segs.push({ label: p.label, kind: p.kind, width: Math.max(6, p.tokens) });
  });
  return { type: "strip", caption: `context window — ${LIMIT.toLocaleString()} tokens`, segments: segs };
}
function toStack(cw) {
  const layers = cw.parts.map((p) => ({
    label: p.label, kind: p.kind, note: p.note,
    height: Math.max(6, Math.min(64, p.tokens / 1100)), tokens: p.tokens,
  }));
  return { type: "stack", layers };
}
function toBudget(cw) {
  return { type: "budget", limit: cw.limit, caption: cw.sub, segments: cw.parts.filter((p) => p.kind !== "empty").map((p) => ({ label: p.label, kind: p.kind, tokens: p.tokens })) };
}
function toTreemap(cw) {
  return { type: "treemap", caption: `${cwTotal(cw).toLocaleString()} tokens in use`, segments: cw.parts.filter((p) => p.kind !== "empty").map((p) => ({ label: p.label, kind: p.kind, tokens: p.tokens })) };
}
function adapt(cw, view) {
  if (view === "strip") return toStrip(cw);
  if (view === "stack") return toStack(cw);
  if (view === "budget") return toBudget(cw);
  if (view === "treemap") return toTreemap(cw);
  return toStrip(cw);
}

/* ---------- coding-agent transcript ---------- */
const TRANSCRIPT = [
  { role: "user", tokens: 320, text: "The test `parser.test.ts › handles nested arrays` is failing on main. Can you fix it?" },
  { role: "assistant", tokens: 180, text: "I'll start by reading the failing test and the parser it exercises.", anno: { kind: "context", label: "Task framing", text: "The current task (320 tok) is small but high-value — it stays pinned at the bottom of every window for the rest of the session." } },
  { role: "tool", name: "read_file", tokens: 2400, text: "parser.test.ts  (148 lines)\nsrc/parser.ts  (412 lines)", anno: { kind: "result", label: "Tool result cost", text: "Two file reads = ~2.4k tokens. Cheap now, but reads compound — by turn 14 the working set is 38k." } },
  { role: "assistant", tokens: 540, text: "The test expects `parseArray` to recurse into nested brackets, but the current implementation only handles one level. Let me run the test to confirm the failure mode." },
  { role: "tool", name: "run_test", tokens: 1900, text: "FAIL  parser.test.ts\n  ● handles nested arrays\n    Expected: [[1,2],[3]]\n    Received: [\"[1\",\"2]\",\"[3]\"]\n    at parseArray (src/parser.ts:218)", anno: { kind: "result", label: "Stack traces are noisy", text: "Test output carries stack traces. Keep the assertion + first frame; the rest is a summarization candidate." } },
  { role: "assistant", tokens: 880, text: "Confirmed — `parseArray` splits on commas without tracking bracket depth. I'll rewrite it to maintain a depth counter and recurse.", anno: { kind: "generated", label: "Scratchpad reasoning", text: "Reasoning tokens are generated, not retrieved. Useful in-turn, but rarely worth carrying forward verbatim." } },
  { role: "tool", name: "edit_file", tokens: 1200, text: "src/parser.ts  — rewrote parseArray (lines 198–240)" },
  { role: "tool", name: "run_test", tokens: 760, text: "PASS  parser.test.ts  (12 tests)" },
  { role: "assistant", tokens: 240, text: "All 12 tests pass. The fix tracks bracket depth and recurses on nested arrays. Want me to add a regression test for deeply-nested input?", anno: { kind: "active", label: "Window rebuilt here", text: "Before this reply, the window was rebuilt: the failing run_test output was summarized to one line now that it's resolved." } },
  { role: "user", tokens: 60, text: "Yes please." },
];

/* ---------- course / landing ---------- */
const COURSE = {
  kicker: "LIVE WORKSHOP · SESSION 04",
  title: "Context Window Engineering",
  tagline: "What fits, what falls out, and why. A hands-on session on designing the prompt that the model actually sees.",
  when: "Thursday, June 18, 2026 · 6:30 – 8:30 PM",
  where: "South Park Commons · San Francisco",
  format: "In person · 24 seats · laptops required",
  price: "Free for members",
  instructor: { name: "M. Calder", role: "Applied ML, Developer Tools", bio: "Builds agent runtimes; has spent more nights staring at token budgets than is healthy." },
  blurb: "Every model call is a window of fixed size. The difference between an agent that finishes the job and one that loops forever is usually not the model — it's what you packed into that window. This session takes you from the mental model to the dials you control in production.",
  outcomes: [
    "Read any context window as a budget of competing claims on space",
    "Diagram a window four ways — strip, stack, budget, and treemap",
    "Decide what to summarize, what to evict, and what to pin",
    "Instrument a coding agent and watch its window churn turn by turn",
  ],
  agenda: [
    { n: "01", t: "The window as a budget", d: "Fixed size, competing tenants. Why everything is a trade.", min: "20 min" },
    { n: "02", t: "Anatomy of a call", d: "System, context, results, scratchpad, the current task.", min: "25 min" },
    { n: "03", t: "Growth & truncation", d: "What falls out when the window fills, and how to choose.", min: "20 min" },
    { n: "04", t: "The agent loop", d: "Rebuild, don't append. Perceive → think → act → observe.", min: "25 min" },
    { n: "05", t: "Reclaiming space", d: "Summarize, evict, retrieve, pin. Live on a real session.", min: "25 min" },
    { n: "06", t: "Workshop", d: "Instrument your own agent and annotate its window.", min: "30 min" },
  ],
};

/* ---------- handout documents ---------- */
const HANDOUT = {
  intro: "Everything from tonight, to take home. Slides, the diagram source, and a one-page field guide. Click any item to preview; download individually or grab the full bundle.",
  docs: [
    {
      id: "fieldguide", title: "Field Guide — The Context Window", file: "context-window-field-guide.md",
      fmt: "Markdown", size: "11 KB", desc: "One-page reference: the six ideas, the four diagrams, and the reclaim checklist.",
      body: `# The Context Window — Field Guide

## The one idea
A model call is a **window of fixed size**. Everything the model can use — instructions, history, tool results, its own reasoning, the current task — must fit inside it. What's outside is invisible.

## Read every window as a budget
| Tenant | Pays for | Cut first? |
|---|---|---|
| System + tools | Capability | No — pin it |
| Project context | Grounding | Rarely |
| Conversation | Continuity | Summarize |
| Tool results | Evidence | Summarize / evict |
| Scratchpad | In-turn reasoning | Drop after use |
| Current task | The point | Never |

## The four views
- **Strip** — segments across the window. Best for *composition at a glance*.
- **Stack** — layered single call. Best for *order and proportion*.
- **Budget bar** — % fill against the limit. Best for *headroom and overflow*.
- **Treemap** — proportional area. Best for *where the tokens actually went*.

## Reclaiming space — in order
1. **Summarize** resolved tool output to a single line.
2. **Evict** turns older than the current sub-task.
3. **Retrieve** on demand instead of holding files open.
4. **Pin** the system prompt and the current task. Never evict the point.

> Rebuild the window every turn. Don't append forever.`,
    },
    {
      id: "slides", title: "Slide Deck — all 6 panels", file: "context-window-slides.pdf",
      fmt: "PDF", size: "1.4 MB", desc: "The full presentation as shown tonight, one panel per page.",
      body: `# Slide Deck

Six panels, print-ready:

1. **Context window** — the model sees a limited amount at once.
2. **Composition** — the window is made of parts.
3. **Growth & truncation** — old info falls out as the window moves.
4. **Agent loop** — perceive, think, act, observe; rebuild each step.
5. **One step** — a typical single-call layout.
6. **Reclaiming space** — compress, summarize, drop.

Open the *Slides* screen to present live, or download the PDF for offline.`,
    },
    {
      id: "dsl", title: "Diagram source (JSON)", file: "diagram-presets.json",
      fmt: "JSON", size: "6 KB", desc: "The token budgets behind every snapshot. Drop into the uploader to re-render.",
      body: `# Diagram source

Each snapshot is a list of parts with token counts:

\`\`\`json
{
  "title": "Turn 14 — deep in the bug",
  "limit": 200000,
  "parts": [
    { "label": "system + tools", "kind": "system", "tokens": 7200 },
    { "label": "file reads", "kind": "result", "tokens": 38600 },
    { "label": "current task", "kind": "active", "tokens": 1900 }
  ]
}
\`\`\`

Load it on the *Upload* screen to render all four views.`,
    },
    {
      id: "checklist", title: "Reclaim Checklist (printable)", file: "reclaim-checklist.md",
      fmt: "Markdown", size: "3 KB", desc: "Tape it to your monitor. The order to cut things when the window fills.",
      body: `# Reclaim Checklist

- [ ] Is the **current task** pinned at the bottom?
- [ ] Is the **system prompt** intact and not duplicated?
- [ ] Have resolved **tool results** been summarized to one line?
- [ ] Are there **turns older than the current sub-task** still verbatim?
- [ ] Is any **file held open** that could be re-read on demand?
- [ ] Has the **scratchpad** from finished steps been dropped?
- [ ] Is the **rolling summary** still accurate, or stale?`,
    },
  ],
};

Object.assign(window, { LIMIT, SNAPSHOTS, adapt, cwTotal, TRANSCRIPT, COURSE, HANDOUT });
