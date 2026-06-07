/* screens2.jsx — Handout (+ markdown renderer), Transcript */
const { useState: us2, useMemo: um2, useRef: ur2, useEffect: ue2 } = React;

/* ---------- tiny markdown renderer ---------- */
function mdInline(s, key) {
  // bold, code, links — minimal
  const parts = [];
  let rest = s, i = 0;
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/;
  let m;
  while ((m = rest.match(re))) {
    if (m.index > 0) parts.push(rest.slice(0, m.index));
    if (m[2] != null) parts.push(<b key={key + "b" + i}>{m[2]}</b>);
    else if (m[3] != null) parts.push(<code key={key + "c" + i} style={{ background: "#eee", padding: "0 3px", fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{m[3]}</code>);
    rest = rest.slice(m.index + m[0].length); i++;
  }
  parts.push(rest);
  return parts;
}
function Markdown({ src }) {
  const lines = src.split("\n");
  const out = [];
  let i = 0, key = 0;
  while (i < lines.length) {
    let ln = lines[i];
    if (ln.startsWith("```")) {
      const buf = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      out.push(<pre key={key++} style={{ background: "#f4f4f4", border: "1px solid #ddd", padding: 10, font: "var(--rag-font-role-code)", overflow: "auto", margin: "10px 0" }}>{buf.join("\n")}</pre>);
      continue;
    }
    if (ln.startsWith("### ")) { out.push(<h4 key={key++} style={{ font: "700 12px/1.3 var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "16px 0 6px" }}>{mdInline(ln.slice(4), key)}</h4>); i++; continue; }
    if (ln.startsWith("## ")) { out.push(<h3 key={key++} style={{ font: "700 16px/1.25 var(--font-display)", margin: "20px 0 8px", borderBottom: "1px solid #000", paddingBottom: 4 }}>{mdInline(ln.slice(3), key)}</h3>); i++; continue; }
    if (ln.startsWith("# ")) { out.push(<h2 key={key++} style={{ font: "700 22px/1.15 var(--font-display)", margin: "4px 0 10px" }}>{mdInline(ln.slice(2), key)}</h2>); i++; continue; }
    if (ln.startsWith("> ")) { out.push(<blockquote key={key++} style={{ borderLeft: "3px solid #000", paddingLeft: 12, margin: "12px 0", font: "italic 400 14px/1.5 var(--font-body)", color: "#333" }}>{mdInline(ln.slice(2), key)}</blockquote>); i++; continue; }
    if (ln.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) { rows.push(lines[i]); i++; }
      const cells = rows.map((r) => r.split("|").slice(1, -1).map((c) => c.trim()));
      const body = cells.filter((r) => !r.every((c) => /^-+$/.test(c)));
      out.push(
        <table key={key++} className="mac-table" style={{ margin: "12px 0", border: "1px solid #000" }}>
          <thead><tr>{body[0].map((c, j) => <th key={j}>{mdInline(c, key + "h" + j)}</th>)}</tr></thead>
          <tbody>{body.slice(1).map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{mdInline(c, key + "r" + ri + ci)}</td>)}</tr>)}</tbody>
        </table>
      );
      continue;
    }
    if (/^\s*-\s+\[[ x]\]\s+/.test(ln)) {
      const items = [];
      while (i < lines.length && /^\s*-\s+\[[ x]\]\s+/.test(lines[i])) {
        const checked = /\[x\]/.test(lines[i]); const txt = lines[i].replace(/^\s*-\s+\[[ x]\]\s+/, "");
        items.push(<li key={items.length} style={{ listStyle: "none", display: "flex", gap: 8, alignItems: "flex-start", padding: "3px 0" }}><span style={{ fontFamily: "var(--font-mono)" }}>{checked ? "☑" : "☐"}</span><span>{mdInline(txt, key + "ck" + items.length)}</span></li>);
        i++;
      }
      out.push(<ul key={key++} style={{ margin: "8px 0", padding: 0 }}>{items}</ul>);
      continue;
    }
    if (/^\s*-\s+/.test(ln)) {
      const items = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) { items.push(<li key={items.length} style={{ font: "400 13px/1.5 var(--font-body)", margin: "2px 0" }}>{mdInline(lines[i].replace(/^\s*-\s+/, ""), key + "li" + items.length)}</li>); i++; }
      out.push(<ul key={key++} style={{ margin: "8px 0", paddingLeft: 20 }}>{items}</ul>);
      continue;
    }
    if (ln.trim() === "") { i++; continue; }
    out.push(<p key={key++} style={{ font: "400 13px/1.55 var(--font-body)", margin: "8px 0" }}>{mdInline(ln, key)}</p>);
    i++;
  }
  return <div>{out}</div>;
}

/* ============================ HANDOUT ============================ */
function Handout() {
  const [sel, setSel] = us2(HANDOUT.docs[0].id);
  const doc = HANDOUT.docs.find((d) => d.id === sel);
  const fmtIcon = (f) => f === "PDF" ? "▤" : f === "JSON" ? "{ }" : "¶";
  return (
    <div className="grow" style={{ display: "flex", minHeight: 0, background: "#fff" }}>
      {/* doc list */}
      <div className="mac-scroll" style={{ flex: "0 0 268px", borderRight: "1px solid #000", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #000" }}>
          <h2 style={{ font: "700 16px/1.2 var(--font-display)", margin: "0 0 6px" }}>Handout</h2>
          <Caption>{HANDOUT.intro}</Caption>
        </div>
        {HANDOUT.docs.map((d) => (
          <button key={d.id} className="mac-navitem" onClick={() => setSel(d.id)} style={{ flexDirection: "column", alignItems: "stretch", gap: 3, padding: "10px 14px", background: sel === d.id ? "#000" : "#fff", color: sel === d.id ? "#fff" : "#000" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="mono" style={{ width: 22, fontSize: 12 }}>{fmtIcon(d.fmt)}</span>
              <span style={{ fontWeight: 700, fontSize: 12.5, flex: 1 }}>{d.title}</span>
            </div>
            <div className="mono" style={{ fontSize: 10, opacity: 0.7, paddingLeft: 30 }}>{d.fmt} · {d.size}</div>
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: 12, borderTop: "1px solid #000" }}>
          <Button block primary onClick={() => {}}>⤓ Download all (.zip)</Button>
        </div>
      </div>
      {/* preview */}
      <div className="grow mac-scroll" style={{ minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px", borderBottom: "1px solid #000", background: "#fafafa", position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <span className="mono" style={{ fontSize: 11, color: "#666" }}>{doc.file}</span>
            <Chip>{doc.fmt}</Chip><Chip>{doc.size}</Chip>
          </div>
          <Button compact onClick={() => {}}>⤓ Download</Button>
        </div>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 26px 50px" }}>
          <Markdown src={doc.body} />
        </div>
      </div>
    </div>
  );
}

/* ============================ TRANSCRIPT ============================ */
const ROLE_META = {
  user: { label: "USER", glyph: "▸", color: "#000" },
  assistant: { label: "ASSISTANT", glyph: "✦", color: "var(--mac-accent)" },
  tool: { label: "TOOL", glyph: "⚙", color: "var(--mac-amber)" },
};
function Transcript() {
  const [active, setActive] = us2(1);
  const annotated = TRANSCRIPT.map((m, i) => ({ ...m, idx: i })).filter((m) => m.anno);
  const annoNum = {};
  annotated.forEach((m, i) => { annoNum[m.idx] = i + 1; });
  const cumulative = [];
  TRANSCRIPT.reduce((acc, m, i) => { const n = acc + m.tokens; cumulative[i] = n; return n; }, 0);
  const total = cumulative[cumulative.length - 1];

  return (
    <div className="grow" style={{ display: "flex", minHeight: 0, background: "#fff" }}>
      {/* transcript */}
      <div className="grow mac-scroll" style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 18px", borderBottom: "1px solid #000", background: "#fafafa", position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div><b style={{ fontSize: 13 }}>Session: fix nested-array parser</b> <Caption>· 10 messages · {annotated.length} annotations</Caption></div>
            <span className="mono" style={{ fontSize: 11, color: "#666" }}>{total.toLocaleString()} tok cumulative</span>
          </div>
          <div style={{ height: 8, border: "1px solid #000", display: "flex" }}>
            {TRANSCRIPT.map((m, i) => (
              <div key={i} title={`${ROLE_META[m.role].label} · ${m.tokens} tok`} style={{ width: (m.tokens / total * 100) + "%", borderRight: i < TRANSCRIPT.length - 1 ? "1px solid #fff" : "none", background: m.role === "tool" ? "url(#none)" : m.role === "assistant" ? "#0000CC" : "#000", backgroundColor: m.role === "tool" ? "#999" : m.role === "assistant" ? "#0000CC" : "#000" }} />
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 18px 50px", display: "flex", flexDirection: "column", gap: 12 }}>
          {TRANSCRIPT.map((m, i) => {
            const rm = ROLE_META[m.role];
            const isTool = m.role === "tool";
            const num = annoNum[i];
            const isActive = active === i;
            return (
              <div key={i} onClick={() => m.anno && setActive(i)}
                style={{ border: "1px solid", borderColor: m.anno && isActive ? "var(--mac-accent)" : "#000", boxShadow: m.anno && isActive ? "0 0 0 1px var(--mac-accent)" : "none", cursor: m.anno ? "pointer" : "default", background: "#fff", maxWidth: m.role === "user" ? 520 : 580, alignSelf: m.role === "user" ? "flex-end" : "flex-start", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 8px", borderBottom: "1px solid #000", background: m.role === "user" ? "#eee" : "#fff" }}>
                  <span style={{ color: rm.color, fontWeight: 700 }}>{rm.glyph}</span>
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>{rm.label}{isTool && ` · ${m.name}`}</span>
                  <span style={{ flex: 1 }} />
                  {num && <span className="mac-chip blue" style={{ fontSize: 10 }}>note {num}</span>}
                  <span className="mono" style={{ fontSize: 10, color: "#666" }}>{m.tokens.toLocaleString()} tok</span>
                </div>
                <div style={{ padding: "8px 10px", font: isTool ? "var(--rag-font-role-code)" : "400 13px/1.5 var(--font-body)", whiteSpace: isTool ? "pre-wrap" : "normal", color: isTool ? "#222" : "#000", background: isTool ? "#f6f6f6" : "#fff" }}>{m.text}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* annotations rail */}
      <div className="mac-scroll" style={{ flex: "0 0 280px", borderLeft: "1px solid #000", background: "#fafafa", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #000" }}>
          <SectionLabel>CONTEXT-ENGINEERING NOTES</SectionLabel>
          <Caption style={{ display: "block", marginTop: 3 }}>What each message costs the window. Click a note or a message to focus it.</Caption>
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {annotated.map((m) => {
            const n = annoNum[m.idx]; const isActive = active === m.idx;
            return (
              <div key={m.idx} onClick={() => setActive(m.idx)} style={{ border: "1px solid", borderColor: isActive ? "var(--mac-accent)" : "#000", background: isActive ? "#fff" : "#fff", padding: 0, cursor: "pointer", boxShadow: isActive ? "2px 2px 0 0 rgba(0,0,0,0.4)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderBottom: "1px solid #000", background: isActive ? "var(--mac-accent)" : "#000", color: "#fff" }}>
                  <span className="mono" style={{ fontWeight: 700, fontSize: 11 }}>NOTE {n}</span>
                  <span style={{ flex: 1 }} />
                  <svg width="13" height="13" viewBox="0 0 13 13"><PatternDefs /><KindRect x={0.6} y={0.6} w={11.8} h={11.8} kind={m.anno.kind} /></svg>
                </div>
                <div style={{ padding: "7px 9px" }}>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{m.anno.label}</div>
                  <div style={{ font: "400 12px/1.45 var(--font-body)", color: "#333" }}>{m.anno.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Markdown, Handout, Transcript });
