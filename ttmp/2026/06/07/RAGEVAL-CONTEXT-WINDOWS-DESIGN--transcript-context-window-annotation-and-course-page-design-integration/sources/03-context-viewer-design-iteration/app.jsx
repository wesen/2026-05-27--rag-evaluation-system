/* app.jsx — shell, navigation, routing, tweaks */
const { useState: uSa, useEffect: uEa } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "diagramStyle": "pattern",
  "commentUI": "rail"
}/*EDITMODE-END*/;

const NAV = [
  { group: "PRESENT" },
  { id: "course", label: "Course", screen: "course" },
  { id: "slides", label: "Slides", screen: "slides" },
  { group: "ANALYZE" },
  { id: "visualize", label: "Visualize", screen: "visualize" },
  { id: "upload", label: "Upload", screen: "upload" },
  { group: "REVIEW" },
  { id: "transcript", label: "Transcript", screen: "transcript" },
  { id: "comments", label: "Comments", screen: "comments" },
  { group: "TAKE-HOME" },
  { id: "handout", label: "Handout", screen: "handout" },
];
const TITLES = {
  course: "Context Window Engineering — Course",
  slides: "Presentation",
  visualize: "Window Visualizer",
  upload: "Upload Context Window",
  transcript: "Agent Session — Annotated",
  comments: "Review & Comments",
  handout: "Handout & Downloads",
};

function NavIcon({ id, active }) {
  const s = active ? "#fff" : "#000";
  const props = { width: 15, height: 15, viewBox: "0 0 15 15", fill: "none", stroke: s, strokeWidth: 1.2 };
  switch (id) {
    case "course": return <svg {...props}><rect x="2" y="1.5" width="11" height="12" /><line x1="4.5" y1="5" x2="10.5" y2="5" /><line x1="4.5" y1="8" x2="10.5" y2="8" /><line x1="4.5" y1="11" x2="8" y2="11" /></svg>;
    case "slides": return <svg {...props}><rect x="1.5" y="2.5" width="12" height="8.5" /><line x1="6" y1="13" x2="9" y2="13" /><line x1="7.5" y1="11" x2="7.5" y2="13" /></svg>;
    case "visualize": return <svg {...props}><rect x="1.5" y="4" width="3" height="7" fill={active ? "#fff" : "#000"} /><rect x="5.5" y="2" width="3" height="9" /><rect x="9.5" y="6" width="3" height="5" fill={active ? "#fff" : "#000"} /></svg>;
    case "upload": return <svg {...props}><path d="M2,9 L2,13 L13,13 L13,9" /><line x1="7.5" y1="2" x2="7.5" y2="9.5" /><path d="M4.5,5 L7.5,2 L10.5,5" /></svg>;
    case "transcript": return <svg {...props}><rect x="1.5" y="2" width="12" height="11" /><line x1="4" y1="5" x2="11" y2="5" /><line x1="4" y1="7.5" x2="11" y2="7.5" /><line x1="4" y1="10" x2="8" y2="10" /></svg>;
    case "comments": return <svg {...props}><path d="M2,2 L13,2 L13,9 L7,9 L4,12 L4,9 L2,9 Z" /></svg>;
    case "handout": return <svg {...props}><path d="M3,1.5 L10,1.5 L12.5,4 L12.5,13.5 L3,13.5 Z" /><path d="M10,1.5 L10,4 L12.5,4" /></svg>;
    default: return <svg {...props} />;
  }
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = uSa("course");
  const [loadedCW, setLoadedCW] = uSa(null);

  const go = (s) => { setScreen(s); };
  const openUploaded = (cw) => { setLoadedCW(cw); setScreen("visualize"); };

  let body;
  if (screen === "course") body = <LandingScreen onNavigate={go} />;
  else if (screen === "slides") body = <SlideViewer />;
  else if (screen === "visualize") body = <Visualize externalCW={loadedCW} key={loadedCW ? "ext" : "samples"} />;
  else if (screen === "upload") body = <Upload onLoad={openUploaded} />;
  else if (screen === "transcript") body = <Transcript />;
  else if (screen === "comments") body = <Comments commentUI={t.commentUI} />;
  else if (screen === "handout") body = <Handout />;

  return (
    <DiagramStyleContext.Provider value={t.diagramStyle}>
      <div className="desktop-bg" style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <MenuBar title=" Context Window Studio" items={["File", "Edit", "View", "Window", "Help"]} />
        <div style={{ flex: 1, minHeight: 0, padding: 16, display: "flex" }}>
          <MacWindow title={TITLES[screen]} style={{ flex: 1, minHeight: 0 }} onClose={() => go("course")}>
            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              {/* sidebar */}
              <div className="mac-sidebar">
                {NAV.map((n, i) => n.group
                  ? <div key={"g" + i} className="mac-navgroup">{n.group}</div>
                  : (
                    <button key={n.id} className={"mac-navitem" + (screen === n.screen && !(screen === "visualize" && loadedCW) ? " active" : (screen === n.screen ? " active" : ""))}
                      onClick={() => { if (n.screen !== "visualize") setLoadedCW(null); go(n.screen); }}>
                      <span className="nav-ico"><NavIcon id={n.id} active={screen === n.screen} /></span>
                      <span style={{ flex: 1 }}>{n.label}</span>
                    </button>
                  ))}
                <div style={{ marginTop: "auto", padding: "10px 12px", borderTop: "1px solid #000" }}>
                  <div className="mono" style={{ fontSize: 9.5, color: "#999", lineHeight: 1.5 }}>CONTEXT WINDOW STUDIO v1.0<br />Session 04 · live workshop</div>
                </div>
              </div>
              {/* loaded-cw banner sits inside visualize; content */}
              {screen === "visualize" && loadedCW ? (
                <div className="grow" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px", borderBottom: "1px solid #000", background: "#FFFDF0" }}>
                    <span className="mac-chip blue">UPLOADED</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{loadedCW.title}</span>
                    <span style={{ flex: 1 }} />
                    <Button compact onClick={() => setLoadedCW(null)}>← Back to samples</Button>
                  </div>
                  {body}
                </div>
              ) : body}
            </div>
          </MacWindow>
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Diagram style" />
        <TweakRadio label="Fill" value={t.diagramStyle} options={[{ value: "pattern", label: "Pattern" }, { value: "tone", label: "Tone" }, { value: "outline", label: "Outline" }]} onChange={(v) => setTweak("diagramStyle", v)} />
        <TweakSection label="Comment UI" />
        <TweakRadio label="Mode" value={t.commentUI} options={[{ value: "rail", label: "Rail" }, { value: "sticky", label: "Sticky" }, { value: "popover", label: "Popover" }]} onChange={(v) => setTweak("commentUI", v)} />
      </TweaksPanel>
    </DiagramStyleContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
