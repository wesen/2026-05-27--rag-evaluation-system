/* data2.jsx — slide deck definitions (reference snapshots + view + notes) */
const SLIDES = [
  {
    n: "01", kicker: "MODULE 01", title: "The window is a fixed budget",
    view: "budget", snap: "t14",
    notes: [
      "Every model call gets a window of fixed size.",
      "Instructions, history, results, reasoning and the task all compete for the same space.",
      "If it doesn't fit, the model can't see it. Headroom is the whole game.",
    ],
  },
  {
    n: "02", kicker: "MODULE 02", title: "Anatomy of a single call",
    view: "stack", snap: "t14",
    notes: [
      "A call is a layered document: durable layers on top, volatile ones below.",
      "System and project context are stable. Results and scratchpad churn every turn.",
      "The current task sits at the bottom and is never evicted.",
    ],
  },
  {
    n: "03", kicker: "MODULE 03", title: "Composition at a glance",
    view: "strip", snap: "t14",
    notes: [
      "Laid flat, the window reads left to right as a strip of segments.",
      "Separators mark where one tenant ends and the next begins.",
      "This is the fastest way to sanity-check what you packed.",
    ],
  },
  {
    n: "04", kicker: "MODULE 04", title: "Where the tokens actually go",
    view: "treemap", snap: "t31",
    notes: [
      "Area equals tokens. The biggest box is usually not the one you think.",
      "Tool results and file reads dominate long sessions — not the conversation.",
      "Treemaps make the expensive tenants impossible to miss.",
    ],
  },
  {
    n: "05", kicker: "MODULE 05", title: "Growth & truncation",
    view: "budget", snap: "t31",
    notes: [
      "As the session runs, new information is added every turn.",
      "When the limit is reached, the oldest, lowest-value content is dropped.",
      "Evicted turns are gone unless they were summarized first.",
    ],
  },
  {
    n: "06", kicker: "MODULE 06", title: "Reclaim, don't append",
    view: "budget", snap: "over",
    notes: [
      "Append-everything blows the budget — here the same session runs 26% over.",
      "Summarize resolved results, evict stale turns, retrieve on demand.",
      "Rebuild the window every turn around what matters now.",
    ],
  },
];
Object.assign(window, { SLIDES });
