/* screens3.jsx — Comments (3 UI variants) + Slides viewer */
const { useState: us3, useRef: ur3, useEffect: ue3, useLayoutEffect: ul3 } = React;

/* ============================ COMMENTS ============================ */
const SEED_COMMENTS = [
  { id: 1, fx: 0.30, fy: 0.52, author: "you", text: "This file-reads block is 38k tokens — biggest single tenant. Candidate to summarize once the bug is found.", time: "2m" },
  { id: 2, fx: 0.74, fy: 0.5, author: "Priya", text: "Why is the scratchpad carried forward? Drop it after the step completes.", time: "just now" },
];
const COMMENT_VIEWS = [{ id: "strip", label: "Strip" }, { id: "stack", label: "Stack" }, { id: "treemap", label: "Treemap" }];

function Comments({ commentUI }) {
  const [comments, setComments] = us3(SEED_COMMENTS);
  const [active, setActive] = us3(1);
  const [arming, setArming] = us3(false);
  const [draft, setDraft] = us3(null); // {fx,fy} pending
  const [draftText, setDraftText] = us3("");
  const [view, setView] = us3("strip");
  const wrapRef = ur3(null);
  const cw = SNAPSHOTS[1];
  const d = adapt(cw, view);

  const onCanvasClick = (e) => {
    if (!arming) return;
    const r = wrapRef.current.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    setDraft({ fx, fy }); setDraftText(""); setArming(false);
  };
  const commitDraft = () => {
    if (!draftText.trim()) { setDraft(null); return; }
    const id = Math.max(0, ...comments.map((c) => c.id)) + 1;
    setComments([...comments, { ...draft, id, author: "you", text: draftText.trim(), time: "now" }]);
    setActive(id); setDraft(null); setDraftText("");
  };
  const remove = (id) => { setComments(comments.filter((c) => c.id !== id)); if (active === id) setActive(null); };

  const Marker = ({ c, n }) => (
    <button onClick={(e) => { e.stopPropagation(); setActive(c.id); }}
      style={{ position: "absolute", left: `${c.fx * 100}%`, top: `${c.fy * 100}%`, transform: "translate(-50%,-50%)",
        width: 20, height: 20, border: "1px solid #000", background: active === c.id ? "var(--mac-accent)" : "#fff",
        color: active === c.id ? "#fff" : "#000", font: "700 11px/1 var(--font-mono)", cursor: "pointer", zIndex: 5,
        boxShadow: "1px 1px 0 0 rgba(0,0,0,0.5)" }}>{n}</button>
  );

  return (
    <div className="grow" style={{ display: "flex", minHeight: 0, background: "#fff" }}>
      <div className="grow mac-scroll" data-rag-organism="Comments" style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", borderBottom: "1px solid #000", background: "#fafafa" }}>
          <Tabs tabs={COMMENT_VIEWS} value={view} onChange={setView} />
          <span style={{ flex: 1 }} />
          <Caption>{comments.length} comments</Caption>
          <Button compact primary={arming} onClick={() => { setArming(!arming); setDraft(null); }}>{arming ? "✕ Cancel" : "＋ Add comment"}</Button>
        </div>
        {/* canvas */}
        <div style={{ padding: 22, flex: 1, minHeight: 0 }}>
          {arming && <div className="mono" style={{ fontSize: 11, color: "var(--mac-accent)", marginBottom: 8 }}>▸ Click anywhere on the diagram to drop a comment.</div>}
          <Panel title={`Review — ${cw.title}`}>
            <div ref={wrapRef} onClick={onCanvasClick} style={{ position: "relative", maxWidth: 640, margin: "0 auto", cursor: arming ? "crosshair" : "default" }}>
              <DiagramRenderer d={d} />
              {/* connectors for sticky mode */}
              {commentUI === "sticky" && comments.map((c) => (
                <svg key={"cn" + c.id} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}>
                  <line x1={`${c.fx * 100}%`} y1={`${c.fy * 100}%`} x2={`${Math.min(96, c.fx * 100 + 6)}%`} y2={`${Math.max(6, c.fy * 100 - 16)}%`} stroke="#000" strokeWidth="1" strokeDasharray="2 2" />
                </svg>
              ))}
              {comments.map((c, i) => <Marker key={c.id} c={c} n={i + 1} />)}
              {/* sticky notes */}
              {commentUI === "sticky" && comments.map((c) => (
                <div key={"st" + c.id} onClick={(e) => { e.stopPropagation(); setActive(c.id); }}
                  style={{ position: "absolute", left: `${Math.min(96, c.fx * 100 + 6)}%`, top: `${Math.max(2, c.fy * 100 - 16)}%`, transform: "translate(0,-100%)", width: 168, zIndex: 6,
                    border: "1px solid", borderColor: active === c.id ? "var(--mac-accent)" : "#000", background: "#FFFDF0", boxShadow: "2px 2px 0 0 rgba(0,0,0,0.4)", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 6px", borderBottom: "1px solid #000", background: active === c.id ? "var(--mac-accent)" : "#000", color: "#fff" }}>
                    <span className="mono" style={{ fontSize: 9.5, fontWeight: 700 }}>{c.author.toUpperCase()}</span>
                    <span className="mono" style={{ fontSize: 9.5, opacity: 0.8 }}>{c.time}</span>
                  </div>
                  <div style={{ padding: "5px 7px", font: "400 11px/1.4 var(--font-body)" }}>{c.text}</div>
                </div>
              ))}
              {/* popover (single) */}
              {commentUI === "popover" && active != null && comments.find((c) => c.id === active) && (() => {
                const c = comments.find((x) => x.id === active);
                return (
                  <div style={{ position: "absolute", left: `${Math.min(70, c.fx * 100)}%`, top: `${c.fy * 100}%`, transform: "translate(0,12px)", width: 220, zIndex: 8,
                    border: "1px solid #000", background: "#fff", boxShadow: "3px 3px 0 0 rgba(0,0,0,0.45)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 8px", borderBottom: "1px solid #000", background: "#000", color: "#fff" }}>
                      <span className="mono" style={{ fontSize: 10, fontWeight: 700 }}>{c.author.toUpperCase()} · {c.time}</span>
                      <span onClick={(e) => { e.stopPropagation(); setActive(null); }} style={{ cursor: "pointer" }}>✕</span>
                    </div>
                    <div style={{ padding: "8px 10px", font: "400 12px/1.45 var(--font-body)" }}>{c.text}</div>
                    <div style={{ padding: "0 10px 8px", display: "flex", gap: 6 }}>
                      <input className="mac-input" placeholder="Reply…" style={{ fontSize: 11 }} />
                      <Button compact>Send</Button>
                    </div>
                  </div>
                );
              })()}
              {/* draft editor (popover near click) */}
              {draft && (
                <div style={{ position: "absolute", left: `${Math.min(70, draft.fx * 100)}%`, top: `${draft.fy * 100}%`, transform: "translate(0,12px)", width: 230, zIndex: 10, border: "1px solid var(--mac-accent)", background: "#fff", boxShadow: "3px 3px 0 0 rgba(0,0,0,0.45)" }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ padding: "3px 8px", borderBottom: "1px solid #000", background: "var(--mac-accent)", color: "#fff" }} className="mono" >NEW COMMENT</div>
                  <div style={{ padding: 8 }}>
                    <TextArea autoFocus value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="What about this part of the window?" style={{ minHeight: 56, fontSize: 11.5, marginBottom: 6 }} />
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Button compact onClick={() => setDraft(null)}>Cancel</Button>
                      <Button compact primary onClick={commitDraft}>Comment</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <hr className="divider-dim" style={{ margin: "10px 0" }} />
            <Legend compact />
          </Panel>
        </div>
      </div>

      {/* rail (rail + popover modes show list; sticky hides full list) */}
      {commentUI !== "sticky" && (
        <div className="mac-scroll" style={{ flex: "0 0 270px", borderLeft: "1px solid #000", background: "#fafafa", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #000" }}>
            <SectionLabel>COMMENTS</SectionLabel>
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {comments.length === 0 && <Caption>No comments yet. Click ＋ Add comment.</Caption>}
            {comments.map((c, i) => (
              <div key={c.id} onClick={() => setActive(c.id)} style={{ border: "1px solid", borderColor: active === c.id ? "var(--mac-accent)" : "#000", background: "#fff", cursor: "pointer", boxShadow: active === c.id ? "2px 2px 0 0 rgba(0,0,0,0.4)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 8px", borderBottom: "1px solid #000", background: active === c.id ? "var(--mac-accent)" : "#000", color: "#fff" }}>
                  <span style={{ width: 16, height: 16, border: "1px solid #fff", display: "grid", placeItems: "center", font: "700 10px/1 var(--font-mono)" }}>{i + 1}</span>
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700 }}>{c.author.toUpperCase()}</span>
                  <span style={{ flex: 1 }} />
                  <span className="mono" style={{ fontSize: 9.5, opacity: 0.8 }}>{c.time}</span>
                  <span onClick={(e) => { e.stopPropagation(); remove(c.id); }} style={{ cursor: "pointer", paddingLeft: 4 }} title="Delete">✕</span>
                </div>
                <div style={{ padding: "7px 9px", font: "400 12px/1.45 var(--font-body)" }}>{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ SLIDES ============================ */
const SLIDE_W = 1000, SLIDE_H = 620;
function SlideViewer() {
  const [idx, setIdx] = us3(() => { const v = parseInt(localStorage.getItem("cws_slide") || "0", 10); return isNaN(v) ? 0 : Math.max(0, Math.min(SLIDES.length - 1, v)); });
  const [scale, setScale] = us3(1);
  const hostRef = ur3(null);
  ue3(() => { localStorage.setItem("cws_slide", String(idx)); }, [idx]);
  ul3(() => {
    const fit = () => {
      if (!hostRef.current) return;
      const r = hostRef.current.getBoundingClientRect();
      setScale(Math.min((r.width - 32) / SLIDE_W, (r.height - 32) / SLIDE_H));
    };
    fit();
    const ro = new ResizeObserver(fit); if (hostRef.current) ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, []);
  ue3(() => {
    const onKey = (e) => { if (e.key === "ArrowRight") setIdx((i) => Math.min(SLIDES.length - 1, i + 1)); if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1)); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  const s = SLIDES[idx];
  const snap = SNAPSHOTS.find((x) => x.id === s.snap);
  const d = adapt(snap, s.view);

  return (
    <div className="grow" data-rag-organism="SlideViewer" style={{ display: "flex", flexDirection: "column", minHeight: 0, background: "#fff" }}>
      <div ref={hostRef} className="grow desktop-bg" style={{ display: "grid", placeItems: "center", minHeight: 0, overflow: "hidden", position: "relative" }}>
        <div style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, transformOrigin: "center", background: "#fff", border: "1px solid #000", boxShadow: "3px 3px 0 0 rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>
          {/* slide titlebar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 36px 14px", borderBottom: "2px solid #000" }}>
            <div>
              <div className="mono" style={{ fontSize: 14, letterSpacing: "0.16em", color: "#666", marginBottom: 8 }}>{s.kicker}</div>
              <h1 style={{ font: "700 40px/1.05 var(--font-display)", margin: 0, letterSpacing: "-0.01em" }}>{s.title}</h1>
            </div>
            <div className="mono" style={{ fontSize: 13, color: "#999" }}>{s.n} / 0{SLIDES.length}</div>
          </div>
          {/* slide body */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.15fr 0.85fr", minHeight: 0 }}>
            <div style={{ padding: "26px 30px", borderRight: "1px solid #000", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <DiagramRenderer d={d} />
              <div style={{ marginTop: 20 }}><Legend /></div>
            </div>
            <div style={{ padding: "30px 34px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
              {s.notes.map((n, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--mac-accent)", lineHeight: "26px" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ font: "400 19px/1.4 var(--font-body)" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* controls (outside scaled area) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", borderTop: "1px solid #000", background: "#fafafa" }}>
        <Button compact onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>◂ Prev</Button>
        <Button compact onClick={() => setIdx(Math.min(SLIDES.length - 1, idx + 1))} disabled={idx === SLIDES.length - 1}>Next ▸</Button>
        <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
          {SLIDES.map((sl, i) => (
            <button key={i} onClick={() => setIdx(i)} title={sl.title} style={{ width: 22, height: 16, border: "1px solid #000", background: i === idx ? "#000" : "#fff", color: i === idx ? "#fff" : "#000", font: "700 9px/1 var(--font-mono)", cursor: "pointer" }}>{sl.n}</button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <Caption>← → to navigate</Caption>
        <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{s.n} / 0{SLIDES.length}</span>
      </div>
    </div>
  );
}

Object.assign(window, { Comments, SlideViewer });
