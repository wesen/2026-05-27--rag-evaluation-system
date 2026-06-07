/* patterns.jsx — Mac bit-patterns for the diagram language + KIND map + legend */

const INK = "#000000";
const ACCENT = "#0000CC";
const RED = "#CC0000";

/* SVG <defs> with classic 1-bit fill patterns. Drop once per <svg>. */
function PatternDefs() {
  return (
    <defs>
      {/* sparse diagonal hatch — summary */}
      <pattern id="p-diag" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="#fff" />
        <line x1="0" y1="0" x2="0" y2="6" stroke={INK} strokeWidth="1" />
      </pattern>
      {/* dense diagonal — generated / scratchpad */}
      <pattern id="p-diag-dense" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="3" height="3" fill="#fff" />
        <line x1="0" y1="0" x2="0" y2="3" stroke={INK} strokeWidth="1" />
      </pattern>
      {/* stipple dots — result / tool output */}
      <pattern id="p-stipple" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="#fff" />
        <circle cx="1" cy="1" r="0.9" fill={INK} />
        <circle cx="3" cy="3" r="0.9" fill={INK} />
      </pattern>
      {/* crosshatch — evicted / compressed */}
      <pattern id="p-cross" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="#fff" />
        <path d="M0,0 L4,4 M0,4 L4,0" stroke={INK} strokeWidth="0.9" />
      </pattern>
      {/* 50% checker — memory / neutral fill */}
      <pattern id="p-checker" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="#fff" />
        <rect width="2" height="2" fill={INK} />
        <rect x="2" y="2" width="2" height="2" fill={INK} />
      </pattern>
      {/* red crosshatch — overflow / over budget */}
      <pattern id="p-overflow" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="5" height="5" fill="#fff" />
        <line x1="0" y1="0" x2="0" y2="5" stroke={RED} strokeWidth="1.4" />
      </pattern>
    </defs>
  );
}

/* kind → render spec. fill can be a color or url(#pattern). */
const KIND = {
  empty:     { fill: "#fff", stroke: INK, dashed: true,  label: "#666", name: "free space" },
  context:   { fill: "#fff", stroke: INK,                label: INK,    name: "context / history" },
  system:    { fill: "url(#p-checker)", stroke: INK,     label: INK,    name: "system / instructions" },
  summary:   { fill: "url(#p-diag)", stroke: INK,        label: INK,    name: "summary / memory" },
  result:    { fill: "url(#p-stipple)", stroke: INK,     label: INK,    name: "tool result" },
  generated: { fill: "url(#p-diag-dense)", stroke: INK,  label: INK,    name: "generated / scratchpad" },
  evicted:   { fill: "url(#p-cross)", stroke: INK,       label: INK,    name: "evicted / compressed" },
  active:    { fill: ACCENT, stroke: INK,                label: "#fff", name: "active (current)" },
  overflow:  { fill: "url(#p-overflow)", stroke: RED,    label: RED,    name: "over budget" },
  boundary:  { fill: INK, stroke: INK, narrow: true,                    name: "boundary" },
  separator: { fill: "url(#p-diag)", stroke: INK, narrow: true,         name: "separator" },
  limit:     { fill: RED, stroke: RED, thin: true,                      name: "limit" },
};

function kindOf(k) { return KIND[k] || KIND.context; }

/* tone (flat grayscale) overrides */
const TONE = {
  empty:     { fill: "#fff", dashed: true, label: "#666" },
  context:   { fill: "#fff", label: "#000" },
  system:    { fill: "#dddddd", label: "#000" },
  summary:   { fill: "#eeeeee", label: "#000" },
  result:    { fill: "#c4c4c4", label: "#000" },
  generated: { fill: "#a0a0a0", label: "#000" },
  evicted:   { fill: "#6a6a6a", label: "#fff" },
  active:    { fill: ACCENT, label: "#fff" },
  overflow:  { fill: "#f2c4c4", stroke: RED, label: RED },
  boundary:  { fill: INK, narrow: true },
  separator: { fill: "#9a9a9a", narrow: true },
  limit:     { fill: RED, thin: true },
};
/* outline (wireframe) overrides — kind shown by stroke treatment */
const OUTLINE = {
  empty:     { fill: "#fff", stroke: "#999", dashed: true, label: "#666" },
  context:   { fill: "#fff", sw: 1.25, label: "#000" },
  system:    { fill: "#fff", sw: 2.5, label: "#000" },
  summary:   { fill: "#fff", dashed: true, label: "#000" },
  result:    { fill: "#fff", dotted: true, label: "#000" },
  generated: { fill: "#fff", sw: 2.5, dashed: true, label: "#000" },
  evicted:   { fill: "#fff", inner: true, dashed: true, label: "#000" },
  active:    { fill: ACCENT, label: "#fff" },
  overflow:  { fill: "#fff", stroke: RED, dashed: true, label: RED },
  boundary:  { fill: INK, narrow: true },
  separator: { fill: "#fff", stroke: "#999", narrow: true, dashed: true },
  limit:     { fill: RED, thin: true },
};
function resolveKind(kind, mode) {
  const base = kindOf(kind);
  if (mode === "tone") return { ...base, ...(TONE[kind] || {}), stroke: (TONE[kind] && TONE[kind].stroke) || INK };
  if (mode === "outline") return { ...base, ...(OUTLINE[kind] || {}), stroke: (OUTLINE[kind] && OUTLINE[kind].stroke) || INK };
  return base;
}

/* React context for the active diagram style mode */
const DiagramStyleContext = React.createContext("pattern");

/* A rect drawn for a given kind, honoring the active style mode. */
function KindRect({ x, y, w, h, kind, rx = 0 }) {
  const mode = React.useContext(DiagramStyleContext);
  const k = resolveKind(kind, mode);
  const sw = k.sw != null ? k.sw : (kind === "boundary" || kind === "limit" ? 1 : 1.25);
  const dash = k.dashed ? "4 3" : k.dotted ? "1.5 2" : "none";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx}
        fill={k.fill} stroke={k.stroke || INK} strokeWidth={sw}
        strokeDasharray={dash} shapeRendering="crispEdges" />
      {k.inner && <rect x={x + 3} y={y + 3} width={Math.max(0, w - 6)} height={Math.max(0, h - 6)}
        fill="none" stroke={k.stroke || INK} strokeWidth="1" strokeDasharray="2 2" />}
    </g>
  );
}

/* legend — list of kinds with swatch */
function Legend({ kinds, compact = false }) {
  const mode = React.useContext(DiagramStyleContext);
  const list = kinds || ["system", "context", "summary", "result", "generated", "evicted", "active", "empty"];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: compact ? "4px 14px" : "6px 18px" }}>
      {list.map((k) => {
        const spec = resolveKind(k, mode);
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="19" height="14" style={{ flex: "none" }} viewBox="0 0 19 14">
              <PatternDefs />
              <KindRect x={0.75} y={0.75} w={17.5} h={12.5} kind={k} />
            </svg>
            <span className="mac-caption" style={{ color: "#000" }}>{kindOf(k).name}</span>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { PatternDefs, KIND, kindOf, resolveKind, KindRect, Legend, DiagramStyleContext, INK, ACCENT, RED });
