/* screens.jsx — Landing, Visualize, Upload */
const { useState: uS, useMemo: uM, useRef: uR, useEffect: uE } = React;

/* ============================ LANDING ============================ */
function LandingScreen({ onNavigate }) {
  const c = COURSE;
  const heroDiagram = adapt(SNAPSHOTS[1], "strip");
  return (
    <div className="mac-scroll grow" data-rag-organism="LandingScreen" style={{ background: "#fff" }}>
      {/* hero */}
      <div style={{ borderBottom: "1px solid #000", padding: "30px 34px 26px" }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: "0.18em", color: "#666", marginBottom: 14 }}>{c.kicker}</div>
        <h1 style={{ font: "700 46px/1.02 var(--font-display)", letterSpacing: "-0.01em", margin: "0 0 14px", maxWidth: 660 }}>{c.title}</h1>
        <p style={{ font: "400 16px/1.5 var(--font-body)", color: "#333", maxWidth: 540, margin: "0 0 22px" }}>{c.tagline}</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Button primary onClick={() => {}} style={{ padding: "7px 20px", fontSize: 12 }}>Reserve a seat</Button>
          <Button onClick={() => onNavigate("slides")} style={{ padding: "7px 16px", fontSize: 12 }}>Preview the deck</Button>
          <span className="mono" style={{ fontSize: 11, color: "#666", marginLeft: 4 }}>{c.price}</span>
        </div>
        {/* meta strip */}
        <div style={{ display: "flex", gap: 0, marginTop: 26, border: "1px solid #000", maxWidth: 720 }}>
          {[["WHEN", c.when], ["WHERE", c.where], ["FORMAT", c.format]].map(([k, v], i) => (
            <div key={k} style={{ flex: 1, padding: "10px 14px", borderLeft: i ? "1px solid #000" : "none" }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "#666", marginBottom: 4 }}>{k}</div>
              <div style={{ font: "400 12px/1.35 var(--font-body)" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* hero diagram showcase */}
      <div style={{ padding: "24px 34px", borderBottom: "1px solid #000", background: "#fff" }}>
        <SectionLabel style={{ color: "#666", marginBottom: 4 }}>YOU WILL LEARN TO READ THIS</SectionLabel>
        <Caption style={{ display: "block", marginBottom: 14 }}>A real coding-agent window, 14 turns in. Every segment competes for the same fixed space.</Caption>
        <div style={{ maxWidth: 620 }}>
          <DiagramRenderer d={heroDiagram} />
        </div>
        <div style={{ marginTop: 12 }}><Legend compact /></div>
      </div>

      {/* outcomes + agenda */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.25fr)", borderBottom: "1px solid #000" }}>
        <div style={{ padding: "24px 34px", borderRight: "1px solid #000" }}>
          <SectionLabel style={{ marginBottom: 14 }}>WHAT YOU'LL LEAVE WITH</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {c.outcomes.map((o, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "var(--mac-green)", fontWeight: 700, fontSize: 13, lineHeight: "20px" }}>✔</span>
                <span style={{ font: "400 13px/1.45 var(--font-body)" }}>{o}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22 }}>
            <SectionLabel style={{ marginBottom: 8 }}>INSTRUCTOR</SectionLabel>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, border: "1px solid #000", background: "url(#none)", flex: "none", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, backgroundColor: "#eee" }}>{c.instructor.name[0]}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{c.instructor.name}</div>
                <div className="mono" style={{ fontSize: 10.5, color: "#666", marginBottom: 4 }}>{c.instructor.role}</div>
                <div style={{ font: "400 12px/1.45 var(--font-body)", color: "#333", maxWidth: 280 }}>{c.instructor.bio}</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "24px 34px" }}>
          <SectionLabel style={{ marginBottom: 14 }}>AGENDA · 2 HOURS</SectionLabel>
          <div style={{ border: "1px solid #000" }}>
            {c.agenda.map((a, i) => (
              <div key={a.n} style={{ display: "flex", gap: 14, padding: "11px 12px", borderBottom: i < c.agenda.length - 1 ? "1px solid #ddd" : "none", alignItems: "baseline" }}>
                <span className="mono" style={{ fontSize: 11, color: "#999", flex: "none", width: 18 }}>{a.n}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{a.t}</div>
                  <div style={{ font: "400 12px/1.4 var(--font-body)", color: "#666" }}>{a.d}</div>
                </div>
                <span className="mono" style={{ fontSize: 10.5, color: "#999", flex: "none" }}>{a.min}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* blurb + footer cta */}
      <div style={{ padding: "26px 34px 40px", display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between" }}>
        <p style={{ font: "400 14px/1.6 var(--font-body)", color: "#333", maxWidth: 560, margin: 0 }}>{c.blurb}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button primary style={{ padding: "8px 24px", fontSize: 12 }}>Reserve a seat →</Button>
          <Caption style={{ textAlign: "center" }}>24 seats · {c.price.toLowerCase()}</Caption>
        </div>
      </div>
    </div>
  );
}

/* ============================ VISUALIZE ============================ */
const VIEWS = [
  { id: "strip", label: "Strip" },
  { id: "stack", label: "Stack" },
  { id: "budget", label: "Budget" },
  { id: "treemap", label: "Treemap" },
];
function Visualize({ snapshot, externalCW }) {
  const [snapId, setSnapId] = uS(SNAPSHOTS[1].id);
  const [view, setView] = uS("strip");
  const cw = externalCW || SNAPSHOTS.find((s) => s.id === snapId) || SNAPSHOTS[0];
  const d = uM(() => adapt(cw, view), [cw, view]);
  const used = cwTotal(cw);
  const pct = used / cw.limit;
  const visibleParts = cw.parts.filter((p) => p.kind !== "empty");

  return (
    <div className="grow" data-rag-organism="Visualize" style={{ display: "flex", minHeight: 0, background: "#fff" }}>
      <div className="grow mac-scroll" data-rag-organism="Visualize" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* snapshot selector */}
        {!externalCW && (
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #000", flexWrap: "wrap" }}>
            {SNAPSHOTS.filter((s) => s.id !== "over").map((s) => (
              <button key={s.id} className={"mac-navitem"} style={{ flex: 1, borderBottom: "none", borderRight: "1px solid #ddd", background: snapId === s.id ? "#000" : "#fff", color: snapId === s.id ? "#fff" : "#000", display: "block", padding: "7px 12px", minWidth: 150 }} onClick={() => setSnapId(s.id)}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{s.title}</div>
                <div className="mono" style={{ fontSize: 10, opacity: 0.7 }}>{s.id}</div>
              </button>
            ))}
          </div>
        )}
        {/* view tabs */}
        <div style={{ padding: "10px 16px 0" }}>
          <Tabs tabs={VIEWS} value={view} onChange={setView} />
        </div>
        {/* diagram */}
        <div style={{ padding: 18, flex: 1, minHeight: 0 }}>
          <Panel title={`${view} view — ${cw.title}`} actions={<Caption style={{ color: "#fff" }}>{cw.sub}</Caption>}>
            <div style={{ maxWidth: 640, margin: "0 auto", padding: "4px 0 8px" }}>
              <DiagramRenderer d={d} />
            </div>
            <hr className="divider-dim" style={{ margin: "8px 0 10px" }} />
            <Legend compact />
          </Panel>
        </div>
      </div>

      {/* inspector */}
      <div className="mac-scroll" style={{ flex: "0 0 264px", borderLeft: "1px solid #000", display: "flex", flexDirection: "column", gap: 12, padding: 12, background: "#fafafa" }}>
        <Panel title="Budget">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <span className="mono" style={{ fontWeight: 700, fontSize: 18, color: pct > 1 ? "var(--mac-accent-2)" : "#000" }}>{Math.round(pct * 100)}%</span>
            <span className="mono" style={{ fontSize: 11, color: "#666" }}>of {(cw.limit / 1000).toFixed(0)}k</span>
          </div>
          <div style={{ height: 10, border: "1px solid #000", position: "relative", marginBottom: 6 }}>
            <div style={{ position: "absolute", inset: 0, width: Math.min(100, pct * 100) + "%", background: pct > 1 ? "var(--mac-accent-2)" : "#000" }} />
          </div>
          <MetadataGrid compact rows={[
            ["Used", <span className="mono">{used.toLocaleString()}</span>],
            ["Free", <span className="mono">{Math.max(0, cw.limit - used).toLocaleString()}</span>],
            ["Limit", <span className="mono">{cw.limit.toLocaleString()}</span>],
          ]} />
        </Panel>
        <Panel title="Breakdown" fill>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {visibleParts.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: i < visibleParts.length - 1 ? "1px solid #eee" : "none" }}>
                <svg width="14" height="14" style={{ flex: "none" }} viewBox="0 0 14 14"><PatternDefs /><KindRect x={0.6} y={0.6} w={12.8} h={12.8} kind={p.kind} /></svg>
                <span style={{ flex: 1, fontSize: 12, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</span>
                <span className="mono" style={{ fontSize: 10.5, color: "#666" }}>{Math.round(p.tokens / used * 100)}%</span>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, width: 48, textAlign: "right" }}>{(p.tokens / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ============================ UPLOAD ============================ */
const SAMPLE_JSON = JSON.stringify({
  title: "My agent window",
  limit: 200000,
  parts: [
    { label: "system + tools", kind: "system", tokens: 7200 },
    { label: "conversation", kind: "context", tokens: 18400 },
    { label: "file reads", kind: "result", tokens: 31200 },
    { label: "scratchpad", kind: "generated", tokens: 8600 },
    { label: "current task", kind: "active", tokens: 1500 },
    { label: "free space", kind: "empty", tokens: 133100 },
  ],
}, null, 2);

function Upload({ onLoad }) {
  const [text, setText] = uS(SAMPLE_JSON);
  const [dragOver, setDragOver] = uS(false);
  const parsed = uM(() => {
    try {
      const o = JSON.parse(text);
      if (!Array.isArray(o.parts)) throw new Error("missing 'parts' array");
      o.parts.forEach((p, i) => {
        if (typeof p.tokens !== "number") throw new Error(`part ${i}: 'tokens' must be a number`);
        if (!p.kind) throw new Error(`part ${i}: missing 'kind'`);
      });
      return { cw: { id: "uploaded", title: o.title || "Uploaded window", sub: o.sub || "Pasted context window", limit: o.limit || 200000, parts: o.parts }, error: null };
    } catch (e) { return { cw: null, error: e.message }; }
  }, [text]);

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { const r = new FileReader(); r.onload = () => setText(String(r.result)); r.readAsText(f); }
  };

  return (
    <div className="mac-scroll grow" data-rag-organism="Upload" style={{ background: "#fff", padding: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        {/* left: input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <h2 style={{ font: "700 18px/1.2 var(--font-display)", margin: "0 0 4px" }}>Upload a context window</h2>
            <Caption>Drop a JSON file, or paste a token budget below. It renders into all four views.</Caption>
          </div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            style={{ border: dragOver ? "2px solid var(--mac-accent)" : "2px dashed #999", background: dragOver ? "#f0f0ff" : "#fafafa", padding: "26px 16px", textAlign: "center", cursor: "default" }}>
            <svg width="40" height="34" viewBox="0 0 40 34" style={{ marginBottom: 8 }}>
              <path d="M2,8 L2,32 L38,32 L38,4 L18,4 L14,8 Z" fill="#fff" stroke="#000" strokeWidth="1.25" />
              <line x1="20" y1="14" x2="20" y2="26" stroke="#000" strokeWidth="1.5" />
              <path d="M15,19 L20,14 L25,19" fill="none" stroke="#000" strokeWidth="1.5" />
            </svg>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Drop a .json file here</div>
            <Caption>or paste below · max 200k tokens</Caption>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Caption>Load a sample:</Caption>
            {SNAPSHOTS.map((s) => (
              <Button key={s.id} compact onClick={() => setText(JSON.stringify({ title: s.title, sub: s.sub, limit: s.limit, parts: s.parts }, null, 2))}>{s.id}</Button>
            ))}
          </div>
          <TextArea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} style={{ minHeight: 280, fontSize: 11.5 }} />
          <div className="mono" style={{ fontSize: 11.5, color: parsed.error ? "var(--mac-accent-2)" : "var(--mac-green)" }}>
            {parsed.error ? `✘ ${parsed.error}` : "✔ valid — preview live"}
          </div>
        </div>

        {/* right: preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 0 }}>
          <Panel title="Preview" actions={parsed.cw && <Button compact primary onClick={() => onLoad(parsed.cw)}>Open in Visualizer →</Button>}>
            {parsed.error ? (
              <ErrorCallout>Cannot render — fix the JSON to preview.{"\n\n"}{parsed.error}</ErrorCallout>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <SectionLabel style={{ color: "#666", marginBottom: 6 }}>STRIP</SectionLabel>
                  <DiagramRenderer d={adapt(parsed.cw, "strip")} />
                </div>
                <hr className="divider-dim" />
                <div>
                  <SectionLabel style={{ color: "#666", marginBottom: 6 }}>BUDGET</SectionLabel>
                  <DiagramRenderer d={adapt(parsed.cw, "budget")} />
                </div>
                <hr className="divider-dim" />
                <Legend compact />
              </div>
            )}
          </Panel>
          <Panel title="Schema" condensed>
            <div className="mono" style={{ fontSize: 10.5, color: "#444", lineHeight: 1.6 }}>
              <div><b>title</b> string · <b>limit</b> number</div>
              <div><b>parts[]</b>: {`{ label, kind, tokens }`}</div>
              <div style={{ color: "#666", marginTop: 4 }}>kind ∈ system · context · summary · result · generated · evicted · active · empty</div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LandingScreen, Visualize, Upload, VIEWS });
