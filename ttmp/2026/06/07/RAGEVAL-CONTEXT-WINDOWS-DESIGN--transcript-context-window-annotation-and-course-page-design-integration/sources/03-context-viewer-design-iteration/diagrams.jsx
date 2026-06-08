/* diagrams.jsx — monochrome geometric context-window diagrams.
   Renderers: Strip, Stack, BudgetBar, Treemap. Uses KindRect/PatternDefs. */

const DFONT = "Geneva, 'Helvetica Neue', Arial, sans-serif";
const DMONO = "Monaco, 'Courier New', monospace";

/* ---------- text helpers ---------- */
function wrapText(str, max = 16) {
  if (!str) return [""];
  const words = String(str).split(" ");
  const out = []; let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) { out.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) out.push(cur);
  return out;
}
function Txt({ x, y, lines, size = 12, weight = 400, anchor = "middle", color = "#000", lh, mono = false }) {
  const arr = Array.isArray(lines) ? lines : [lines];
  const step = lh || size + 2;
  return (
    <text x={x} textAnchor={anchor} fontFamily={mono ? DMONO : DFONT} fontSize={size} fontWeight={weight} fill={color}>
      {arr.map((ln, i) => <tspan key={i} x={x} y={y + i * step}>{ln}</tspan>)}
    </text>
  );
}
function Arrow({ x1, y1, x2, y2, color = "#000" }) {
  const ang = Math.atan2(y2 - y1, x2 - x1), a = 6;
  const h1 = [x2 - a * Math.cos(ang - 0.42), y2 - a * Math.sin(ang - 0.42)];
  const h2 = [x2 - a * Math.cos(ang + 0.42), y2 - a * Math.sin(ang + 0.42)];
  return (
    <g stroke={color} strokeWidth="1.25" fill="none" strokeLinecap="square">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M${h1[0].toFixed(1)},${h1[1].toFixed(1)} L${x2},${y2} L${h2[0].toFixed(1)},${h2[1].toFixed(1)}`} strokeLinejoin="miter" />
    </g>
  );
}

/* ---------- segment placement ---------- */
const FIXED_W = { separator: 11, boundary: 8, limit: 4 };
function placeSegments(segments, totalW, gap = 4) {
  let fixedSum = 0, propSum = 0;
  segments.forEach((s) => {
    if (FIXED_W[s.kind] != null) fixedSum += FIXED_W[s.kind];
    else propSum += s.width || s.tokens || 10;
  });
  const gaps = Math.max(0, segments.length - 1) * gap;
  const remaining = Math.max(40, totalW - fixedSum - gaps);
  const MINW = 17; // floor so thin labeled segments stay legible / separable
  // first pass: raw proportional widths with floor
  let raw = segments.map((s) => FIXED_W[s.kind] != null ? FIXED_W[s.kind] : Math.max(MINW, remaining * ((s.width || s.tokens || 10) / (propSum || 1))));
  // re-fit proportional widths so the band still sums to `remaining`
  const propTotal = raw.reduce((a, w, i) => a + (FIXED_W[segments[i].kind] != null ? 0 : w), 0);
  if (propTotal > remaining) {
    const scale = remaining / propTotal;
    raw = raw.map((w, i) => FIXED_W[segments[i].kind] != null ? w : Math.max(MINW * 0.7, w * scale));
  }
  let cx = 0;
  return segments.map((s, i) => { const w = raw[i]; const p = { ...s, x: cx, w }; cx += w + gap; return p; });
}

/* =========================================================================
   STRIP — segments across the window
   ========================================================================= */
function StripDiagram({ d }) {
  const W = 600, pad = 26, bandW = W - pad * 2;
  const topAnn = (d.annotations || []).filter((a) => a.side === "top");
  const botAnn = (d.annotations || []).filter((a) => a.side === "bottom");
  const segLabels = (d.segments || []).filter((s) => s.label);

  const placed = placeSegments(d.segments || [], bandW);
  const centers = {};
  placed.forEach((s) => { if (s.label) centers[s.label] = pad + s.x + s.w / 2; });
  const cx = (n) => centers[n] ?? pad + bandW / 2;

  /* angled labels — never collide regardless of segment width */
  const y0 = (segLabels.length || topAnn.length) ? 66 : 18;
  const bandH = 56;
  const botTier = botAnn.length ? 52 : 0;
  const capH = d.caption ? 38 : 12;
  const H = y0 + bandH + botTier + capH + 10;
  const bandBot = y0 + bandH;

  return (
    <svg data-rag-molecule="ContextStripDiagram" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <PatternDefs />
      {segLabels.map((s, i) => {
        const c = cx(s.label);
        const ax = c, ay = y0 - 11;
        return (
          <g key={"sl" + i}>
            <line x1={c} y1={y0 - 3} x2={c} y2={y0 - 9} stroke="#000" strokeWidth="1.1" />
            <text x={ax} y={ay} fontFamily={DFONT} fontSize={10.5} fontWeight={700} fill="#000"
              textAnchor="start" transform={`rotate(-30 ${ax} ${ay})`}>{s.label}</text>
          </g>
        );
      })}
      {topAnn.map((a, i) => <Txt key={"ta" + i} x={cx(a.to)} y={14} lines={wrapText(a.text, 18)} size={12} color="#666" />)}
      {placed.map((s, i) => <KindRect key={i} x={pad + s.x} y={y0} w={s.w} h={bandH} kind={s.kind} />)}
      {botAnn.map((a, i) => {
        const c = a.to === "strip" ? pad + bandW / 2 : cx(a.to);
        const ay1 = bandBot + 26;
        return (
          <g key={"ba" + i}>
            <Arrow x1={c} y1={ay1} x2={c} y2={bandBot + 3} />
            <Txt x={c} y={ay1 + 13} lines={wrapText(a.text, 18)} size={11} color="#666" mono />
          </g>
        );
      })}
      {d.caption && (() => {
        const by = y0 + bandH + botTier + 14;
        return (
          <g>
            <path d={`M${pad},${by - 6} L${pad},${by} L${pad + bandW},${by} L${pad + bandW},${by - 6}`} fill="none" stroke="#000" strokeWidth="1.1" />
            <Txt x={pad + bandW / 2} y={by + 15} lines={wrapText(d.caption, 48)} size={12} weight={400} color="#000" />
          </g>
        );
      })()}
    </svg>
  );
}

/* =========================================================================
   STACK — layered single call
   ========================================================================= */
function StackDiagram({ d }) {
  const layers = d.layers || [];
  const W = 600, stackW = 230, x0 = 34, top = 16, unit = 3.6, gap = 5;
  let y = top;
  const placed = layers.map((l) => { const h = Math.max(20, (l.height || 14) * unit); const p = { ...l, y, h }; y += h + gap; return p; });
  const stackBottom = y - gap;
  const botAnn = (d.annotations || []).filter((a) => a.side === "bottom");
  const H = stackBottom + (botAnn.length ? 30 : 14);
  const labelX = x0 + stackW + 20;

  return (
    <svg data-rag-molecule="ContextStackDiagram" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <PatternDefs />
      {placed.map((l, i) => (
        <g key={i}>
          <KindRect x={x0} y={l.y} w={stackW} h={l.h} kind={l.kind} />
          <Arrow x1={labelX - 6} y1={l.y + l.h / 2} x2={x0 + stackW + 5} y2={l.y + l.h / 2} />
          <text x={labelX} y={l.y + l.h / 2 + (l.note ? -2 : 4)} fontFamily={DFONT} fontSize={12} fontWeight={700} fill="#000">{l.label}</text>
          {l.note && <text x={labelX} y={l.y + l.h / 2 + 11} fontFamily={DMONO} fontSize={10.5} fill="#666">{l.note}</text>}
          {l.tokens != null && <text x={x0 + stackW - 6} y={l.y + l.h / 2 + 4} textAnchor="end" fontFamily={DMONO} fontSize={10.5} fontWeight={700} fill={l.kind === "active" ? "#fff" : "#000"}>{l.tokens.toLocaleString()}</text>}
        </g>
      ))}
      {/* height bracket */}
      <path d={`M${x0 - 12},${top} L${x0 - 18},${top} L${x0 - 18},${stackBottom} L${x0 - 12},${stackBottom}`} fill="none" stroke="#000" strokeWidth="1.1" />
      {(d.brackets || []).map((b, i) => {
        const a = placed.find((p) => p.label === b.from), c = placed.find((p) => p.label === b.to);
        if (!a || !c) return null;
        const yt = Math.min(a.y, c.y), yb = Math.max(a.y + a.h, c.y + c.h);
        const right = b.side === "right";
        const bx = right ? x0 + stackW + 168 : x0 - 30;
        const dir = right ? 6 : -6;
        return (
          <g key={"bk" + i}>
            <path d={`M${bx + dir},${yt} L${bx},${yt} L${bx},${yb} L${bx + dir},${yb}`} fill="none" stroke="#000" strokeWidth="1.1" />
            <text x={bx - dir} y={(yt + yb) / 2 + 4} textAnchor={right ? "start" : "end"} fontFamily={DMONO} fontSize={10.5} fill="#666">{b.label}</text>
          </g>
        );
      })}
      {botAnn.map((a, i) => <Txt key={"sa" + i} x={x0 + stackW / 2} y={stackBottom + 18} lines={wrapText(a.text, 44)} size={11} color="#666" mono />)}
    </svg>
  );
}

/* =========================================================================
   BUDGET BAR — % fill, limit marker
   ========================================================================= */
function BudgetBar({ d }) {
  const W = 600, pad = 26, barW = W - pad * 2;
  const limit = d.limit || 200000;
  const segs = d.segments || [];
  const used = segs.reduce((s, x) => s + (x.tokens || 0), 0);
  const pct = used / limit;
  const barH = 50, y0 = 44;
  const overflow = Math.max(0, used - limit);
  const usableScale = barW / Math.max(limit, used); // px per token, clamp so overflow shows
  let cx = pad;
  const placed = segs.map((s) => { const w = (s.tokens || 0) * usableScale; const p = { ...s, x: cx, w }; cx += w; return p; });
  const limitX = pad + limit * usableScale;
  const H = y0 + barH + 56;

  return (
    <svg data-rag-molecule="ContextBudgetBar" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <PatternDefs />
      {/* readout */}
      <text x={pad} y={20} fontFamily={DMONO} fontSize={13} fontWeight={700} fill="#000">{used.toLocaleString()} / {limit.toLocaleString()} tokens</text>
      <text x={W - pad} y={20} textAnchor="end" fontFamily={DMONO} fontSize={13} fontWeight={700} fill={pct > 1 ? RED : pct > 0.85 ? "#AA7700" : "#000"}>{Math.round(pct * 100)}%</text>
      {/* track outline */}
      <rect x={pad} y={y0} width={barW} height={barH} fill="#fff" stroke="#000" strokeWidth="1.25" shapeRendering="crispEdges" />
      {/* segments */}
      {placed.map((s, i) => (
        <g key={i}>
          <KindRect x={s.x} y={y0} w={s.w} h={barH} kind={s.x + s.w > limitX + 0.5 ? (s.x >= limitX ? "overflow" : s.kind) : s.kind} />
          {s.w > 34 && <text x={s.x + s.w / 2} y={y0 + barH + 13} textAnchor="middle" fontFamily={DMONO} fontSize={10} fill="#666">{(s.tokens / 1000).toFixed(0)}k</text>}
        </g>
      ))}
      {/* overflow region beyond limit, drawn over with red hatch border */}
      {overflow > 0 && <rect x={limitX} y={y0 - 3} width={pad + used * usableScale - limitX} height={barH + 6} fill="none" stroke={RED} strokeWidth="1.25" strokeDasharray="3 2" />}
      {/* limit line */}
      <line x1={limitX} y1={y0 - 10} x2={limitX} y2={y0 + barH + 10} stroke={RED} strokeWidth="1.5" />
      <text x={limitX} y={y0 - 14} textAnchor="middle" fontFamily={DMONO} fontSize={10} fontWeight={700} fill={RED}>LIMIT</text>
      {/* scale ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const tx = pad + limit * t * usableScale;
        return (
          <g key={i}>
            <line x1={tx} y1={y0 + barH} x2={tx} y2={y0 + barH + 5} stroke="#000" strokeWidth="1" />
            <text x={tx} y={y0 + barH + 30} textAnchor="middle" fontFamily={DMONO} fontSize={9.5} fill="#999">{Math.round(limit * t / 1000)}k</text>
          </g>
        );
      })}
      {d.caption && <text x={pad} y={H - 6} fontFamily={DFONT} fontSize={12} fill="#666">{d.caption}</text>}
    </svg>
  );
}

/* =========================================================================
   TREEMAP — proportional area (squarified)
   ========================================================================= */
function squarify(items, x, y, w, h) {
  // simple recursive squarified treemap
  const total = items.reduce((s, it) => s + it.value, 0);
  const out = [];
  let area = { x, y, w, h };
  let remaining = items.slice();
  let remTotal = total;
  function worst(row, len, scale) {
    const sum = row.reduce((s, r) => s + r.value, 0) * scale;
    const max = Math.max(...row.map((r) => r.value)) * scale;
    const min = Math.min(...row.map((r) => r.value)) * scale;
    return Math.max((len * len * max) / (sum * sum), (sum * sum) / (len * len * min));
  }
  while (remaining.length) {
    const horizontal = area.w >= area.h;
    const len = horizontal ? area.h : area.w;
    const scale = (area.w * area.h) / remTotal;
    let row = [remaining[0]];
    let i = 1;
    while (i < remaining.length) {
      const next = row.concat(remaining[i]);
      if (worst(next, len, scale) <= worst(row, len, scale)) { row = next; i++; }
      else break;
    }
    const rowSum = row.reduce((s, r) => s + r.value, 0);
    const rowArea = rowSum * scale;
    const thick = rowArea / len;
    let off = 0;
    row.forEach((r) => {
      const cellLen = (r.value * scale) / thick;
      if (horizontal) out.push({ ...r, x: area.x, y: area.y + off, w: thick, h: cellLen });
      else out.push({ ...r, x: area.x + off, y: area.y, w: cellLen, h: thick });
      off += cellLen;
    });
    if (horizontal) { area = { x: area.x + thick, y: area.y, w: area.w - thick, h: area.h }; }
    else { area = { x: area.x, y: area.y + thick, w: area.w, h: area.h - thick }; }
    remaining = remaining.slice(row.length);
    remTotal -= rowSum;
  }
  return out;
}
function Treemap({ d }) {
  const W = 600, H = 372, pad = 24;
  const segs = (d.segments || []).filter((s) => (s.tokens || 0) > 0).map((s) => ({ ...s, value: s.tokens }));
  const cells = squarify(segs, pad, pad + 4, W - pad * 2, H - pad * 2);
  const total = segs.reduce((s, x) => s + x.value, 0);
  return (
    <svg data-rag-molecule="ContextTreemap" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <PatternDefs />
      {d.caption && <text x={pad} y={16} fontFamily={DFONT} fontSize={12} fontWeight={700} fill="#000">{d.caption}</text>}
      {cells.map((c, i) => {
        const big = c.w > 70 && c.h > 38;
        const med = c.w > 46 && c.h > 22;
        const labelColor = c.kind === "active" ? "#fff" : "#000";
        return (
          <g key={i}>
            <KindRect x={c.x} y={c.y} w={c.w} h={c.h} kind={c.kind} />
            {big && (
              <g>
                {/* label chip so text reads over pattern */}
                <rect x={c.x + 5} y={c.y + 5} width={Math.min(c.w - 10, c.label.length * 6.6 + 8)} height={15} fill={c.kind === "active" ? ACCENT : "#fff"} stroke="none" opacity={c.kind === "active" ? 0 : 0.92} />
                <text x={c.x + 8} y={c.y + 16} fontFamily={DFONT} fontSize={11} fontWeight={700} fill={labelColor}>{c.label}</text>
                <text x={c.x + 8} y={c.y + 30} fontFamily={DMONO} fontSize={10} fill={c.kind === "active" ? "#fff" : "#666"}>{c.tokens.toLocaleString()} · {Math.round(c.value / total * 100)}%</text>
              </g>
            )}
            {!big && med && (
              <g>
                <rect x={c.x + 3} y={c.y + 3} width={Math.min(c.w - 6, c.label.length * 5.6 + 6)} height={13} fill="#fff" opacity={c.kind === "active" ? 0 : 0.9} />
                <text x={c.x + 5} y={c.y + 13} fontFamily={DMONO} fontSize={9.5} fill={labelColor}>{c.label}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- switch ---------- */
function DiagramRenderer({ d, view }) {
  const type = view || (d && d.type);
  if (!d) return null;
  try {
    if (type === "strip") return <StripDiagram d={d} />;
    if (type === "stack") return <StackDiagram d={d} />;
    if (type === "budget") return <BudgetBar d={d} />;
    if (type === "treemap") return <Treemap d={d} />;
    return <StripDiagram d={d} />;
  } catch (e) {
    return <div className="mac-error">render error: {String(e.message)}</div>;
  }
}

Object.assign(window, { StripDiagram, StackDiagram, BudgetBar, Treemap, DiagramRenderer, wrapText });
