/* ds-overview.jsx — rich design-system reference, rendered from real components */
const { useState: dsoState } = React;

const dsoMono = "Monaco, 'Courier New', monospace";
const dsoBody = "Geneva, 'Helvetica Neue', Arial, sans-serif";

/* ---- layout helpers ---- */
function Section({ n, title, lead, children }) {
  return (
    <section style={{ marginTop: 46 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, borderBottom: "2px solid #000", paddingBottom: 8, marginBottom: lead ? 12 : 22 }}>
        <span className="mono" style={{ fontSize: 13, color: "#999" }}>{n}</span>
        <h2 style={{ font: "700 21px/1 var(--font-display)", margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
      </div>
      {lead && <p style={{ font: "400 14px/1.55 var(--font-body)", color: "#333", maxWidth: 720, margin: "0 0 24px" }}>{lead}</p>}
      {children}
    </section>
  );
}
function Sub({ children }) {
  return <h3 style={{ font: "700 11px/1.2 var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.6px", color: "#000", margin: "26px 0 4px" }}>{children}</h3>;
}
function Note({ children }) {
  return <p style={{ font: "400 12px/1.5 var(--font-body)", color: "#666", margin: "0 0 14px", maxWidth: 680 }}>{children}</p>;
}
/* a labelled specimen tile */
function Spec({ label, children, bg, col }) {
  return (
    <div style={{ minWidth: 0 }}>
      {label && <div className="mono" style={{ fontSize: 10, color: "#999", marginBottom: 5 }}>{label}</div>}
      <div style={{ border: "1px solid #ddd", background: bg || "#fff", padding: 16, display: "flex", flexDirection: col ? "column" : "row", gap: 14, flexWrap: "wrap", alignItems: col ? "stretch" : "center" }}>
        {children}
      </div>
    </div>
  );
}
function Grid({ cols = "repeat(auto-fill,minmax(220px,1fr))", gap = 16, children, style }) {
  return <div style={{ display: "grid", gridTemplateColumns: cols, gap, ...style }}>{children}</div>;
}

/* a scaled live render of a full screen, framed like a window capture */
function Render({ title, w, h, frameW = 992, children }) {
  const scale = frameW / w;
  return (
    <div style={{ marginBottom: 26 }}>
      <div className="mono" style={{ fontSize: 10, color: "#999", marginBottom: 6 }}>{title}</div>
      <div style={{ width: frameW, height: Math.round(h * scale), overflow: "hidden", border: "1px solid #000", boxShadow: "3px 3px 0 0 rgba(0,0,0,0.45)", background: "#fff" }}>
        <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left", display: "flex", flexDirection: "column" }}>
          <DiagramStyleContext.Provider value="pattern">{children}</DiagramStyleContext.Provider>
        </div>
      </div>
    </div>
  );
}

/* ============================================================= */
function DSOverview() {
  const [tab, setTab] = dsoState("Overview");
  const snap = SNAPSHOTS[0];
  const allKinds = ["system", "context", "summary", "result", "generated", "evicted", "active", "empty", "separator", "boundary", "limit", "overflow"];

  return (
    <div className="desktop-bg" style={{ minHeight: "100vh", padding: "26px 0 80px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", background: "#fff", border: "1px solid #000", boxShadow: "3px 3px 0 0 rgba(0,0,0,0.5)" }}>
        {/* faux titlebar */}
        <div className="mac-titlebar" style={{ height: 22 }}>
          <span className="close-box" />
          <span className="title">Design System.ref</span>
          <span className="zoom-box" />
        </div>

        <div style={{ padding: "34px 44px 56px" }}>
          {/* masthead */}
          <div style={{ borderBottom: "3px solid #000", paddingBottom: 16, marginBottom: 6 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: "0.16em", color: "#666", marginBottom: 10 }}>CONTEXT WINDOW STUDIO · DESIGN SYSTEM v1.0</div>
            <h1 style={{ font: "800 40px/1 var(--font-display)", letterSpacing: "-0.015em", margin: "0 0 10px" }}>Widgets, States & Composition</h1>
            <p style={{ font: "400 15px/1.55 var(--font-body)", color: "#333", maxWidth: 760, margin: 0 }}>
              A self-contained reference for the Classic Mac OS monochrome language. Every swatch, control, and diagram below is rendered from the same React components and CSS tokens the product ships. Pure black &amp; white, 1px borders, two accents — blue for the live, red for the limit.
            </p>
          </div>

          {/* ===================== 1. FOUNDATION ===================== */}
          <Section n="01" title="Principles">
            <Grid cols="repeat(auto-fit,minmax(220px,1fr))">
              {[
                ["Monochrome first", "Black on white, separated by 1px hairlines. Color is a signal, never decoration."],
                ["Two accents only", "Blue = the live / current / you-are-here. Red = the limit, overflow, destructive. Nothing else is colored."],
                ["Weight over size", "Hierarchy comes from weight and case, not a dozen type sizes. Two working sizes do most of the work."],
                ["Density is honest", "Tight 11–13px type and small padding. The chrome gets out of the way of the data."],
              ].map(([t, d]) => (
                <div key={t} style={{ border: "1px solid #000", padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t}</div>
                  <div style={{ font: "400 12px/1.5 var(--font-body)", color: "#555" }}>{d}</div>
                </div>
              ))}
            </Grid>
          </Section>

          {/* ===================== 2. COLOR ===================== */}
          <Section n="02" title="Colour tokens" lead="The entire palette. Surfaces and ink are monochrome; the four chromatic tokens are reserved for status and signal.">
            <Grid cols="repeat(auto-fill,minmax(150px,1fr))" gap={10}>
              {[
                ["--mac-bg", "#FFFFFF", "Page / surface", true],
                ["--mac-bg-dark", "#000000", "Headers, ink", false],
                ["--mac-text-dim", "#666666", "Muted text", false],
                ["--mac-surface-2", "#EEEEEE", "Hover / fill", true],
                ["--mac-surface-3", "#DDDDDD", "Hairline rows", true],
                ["--mac-accent", "#0000CC", "Live / current", false],
                ["--mac-accent-2", "#CC0000", "Limit / error", false],
                ["--mac-green", "#007722", "Succeeded", false],
                ["--mac-amber", "#AA7700", "Running / warn", false],
              ].map(([tok, hex, use, lightText]) => (
                <div key={tok} style={{ border: "1px solid #ccc" }}>
                  <div style={{ height: 50, background: hex, borderBottom: "1px solid #ccc" }} />
                  <div style={{ padding: "6px 8px" }}>
                    <div className="mono" style={{ fontSize: 10.5, fontWeight: 700 }}>{tok}</div>
                    <div className="mono" style={{ fontSize: 10, color: "#888" }}>{hex}</div>
                    <div style={{ font: "400 11px/1.3 var(--font-body)", color: "#555", marginTop: 2 }}>{use}</div>
                  </div>
                </div>
              ))}
            </Grid>
          </Section>

          {/* ===================== 3. TYPE ===================== */}
          <Section n="03" title="Type roles" lead="Geneva for prose, Monaco for data and labels, a bold display face for headings. Roles are named so primitives stay consistent.">
            <div style={{ border: "1px solid #000" }}>
              {[
                ["display / h1", "800 40px var(--font-display)", "Context Window", "Hero & screen titles"],
                ["display / h2", "700 21px var(--font-display)", "Anatomy of a call", "Section headers"],
                ["body", "400 13px/1.5 Geneva", "The model can only see a limited amount at once.", "Paragraph copy"],
                ["compact", "400 12px Geneva", "Pasted context window", "Dense body / captions"],
                ["metadata", "400 11px Monaco", "98,600 / 200,000 tok", "Numbers, file names"],
                ["label", "700 11px Monaco · UPPERCASE", "BREAKDOWN", "Panel & section labels"],
                ["metric", "700 13px Monaco", "49%", "Headline numbers"],
                ["code", "400 12px Monaco", "parseArray(src/parser.ts:218)", "Tool output, JSON"],
              ].map(([role, spec, sample, use], i) => (
                <div key={role} style={{ display: "grid", gridTemplateColumns: "150px 1fr 160px", gap: 16, alignItems: "baseline", padding: "11px 14px", borderBottom: i < 7 ? "1px solid #eee" : "none" }}>
                  <div className="mono" style={{ fontSize: 10.5, color: "#888" }}>{role}</div>
                  <div style={{
                    font: role.startsWith("display / h1") ? "800 30px var(--font-display)"
                      : role.startsWith("display / h2") ? "700 20px var(--font-display)"
                      : role === "label" ? "700 11px Monaco" : role === "metric" ? "700 13px Monaco"
                      : role === "metadata" || role === "code" ? "400 12px Monaco" : "400 13px Geneva",
                    textTransform: role === "label" ? "uppercase" : "none", letterSpacing: role === "label" ? "0.5px" : "normal",
                  }}>{sample}</div>
                  <div className="mono" style={{ fontSize: 10, color: "#aaa" }}>{use}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ===================== 4. SPACING / BORDERS ===================== */}
          <Section n="04" title="Spacing, borders & elevation">
            <Grid cols="1fr 1fr" gap={24}>
              <div>
                <Sub>Gap scale</Sub>
                <Note>A 2-4-6-8-12-16 px ramp. Flex/grid <code className="mono">gap</code> everywhere — never margins between siblings.</Note>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                  {[2, 4, 6, 8, 12, 16].map((g) => (
                    <div key={g} style={{ textAlign: "center" }}>
                      <div style={{ width: 26, height: g + 18, background: "#000", margin: "0 auto 5px" }} />
                      <div style={{ width: g, height: 8, background: "var(--mac-accent)", margin: "0 auto 5px" }} />
                      <div className="mono" style={{ fontSize: 10 }}>{g}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Sub>Borders & elevation</Sub>
                <Note>One border weight: 1px solid black. Depth is faked with a hard offset shadow, never a blur.</Note>
                <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 80, height: 44, border: "1px solid #000", background: "#fff" }} />
                    <div className="mono" style={{ fontSize: 10, marginTop: 5 }}>1px border</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 80, height: 44, border: "1px solid #000", background: "#fff", boxShadow: "2px 2px 0 0 rgba(0,0,0,0.55)" }} />
                    <div className="mono" style={{ fontSize: 10, marginTop: 5 }}>window 2px</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 80, height: 44, border: "1px solid #000", background: "#fff", boxShadow: "3px 3px 0 0 rgba(0,0,0,0.45)" }} />
                    <div className="mono" style={{ fontSize: 10, marginTop: 5 }}>popover 3px</div>
                  </div>
                </div>
              </div>
            </Grid>
          </Section>

          {/* ===================== 5. ATOMS ===================== */}
          <Section n="05" title="Atoms" lead="The smallest interactive parts and their states. Hover fills grey; active / selected inverts to solid black.">
            <Grid cols="repeat(auto-fit,minmax(280px,1fr))" gap={18}>
              <Spec label="Button — states" col>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Button>Default</Button>
                  <button className="mac-btn" style={{ background: "var(--mac-surface-2)" }}>Hover</button>
                  <Button primary>Primary</Button>
                  <Button selected>Active</Button>
                  <Button disabled>Disabled</Button>
                  <Button compact>Compact</Button>
                </div>
                <Button block primary>Block button</Button>
              </Spec>
              <Spec label="Text link">
                <LinkButton>inline link →</LinkButton>
                <span className="dim mono" style={{ fontSize: 10 }}>underline · accent · hover→ink</span>
              </Spec>
              <Spec label="Chip / badge">
                <Chip>default</Chip>
                <Chip tone="inv">inverted</Chip>
                <Chip tone="blue">uploaded</Chip>
                <Chip tone="red">over budget</Chip>
              </Spec>
              <Spec label="Status text">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <StatusText status="succeeded">succeeded</StatusText>
                  <StatusText status="running">running</StatusText>
                  <StatusText status="failed">failed</StatusText>
                  <StatusText status="pending">pending</StatusText>
                </div>
              </Spec>
              <Spec label="Inputs — default & focus" col>
                <TextInput placeholder="Text input" defaultValue="parser.test.ts" />
                <input className="mac-input" defaultValue="focused" style={{ outline: "2px solid var(--mac-accent)", outlineOffset: -1 }} />
                <Select options={["bm25", "embedding", "hybrid"]} value="bm25" onChange={() => {}} />
              </Spec>
              <Spec label="Textarea & checkbox" col>
                <TextArea defaultValue={'{ "tokens": 7200 }'} style={{ minHeight: 46 }} />
                <div style={{ display: "flex", gap: 16 }}>
                  <Checkbox checked label="checked" onChange={() => {}} />
                  <Checkbox checked={false} label="unchecked" onChange={() => {}} />
                </div>
              </Spec>
              <Spec label="Caption & section label" col>
                <SectionLabel>SECTION LABEL</SectionLabel>
                <Caption>A muted caption in Monaco, for hints and metadata.</Caption>
              </Spec>
              <Spec label="Form row">
                <div style={{ width: "100%" }}>
                  <FormRow label="Retriever"><Select options={["bm25", "hybrid"]} value="bm25" onChange={() => {}} /></FormRow>
                  <div style={{ height: 6 }} />
                  <FormRow label="Top-K"><TextInput defaultValue="10" /></FormRow>
                </div>
              </Spec>
            </Grid>
          </Section>

          {/* ===================== 6. CONTAINERS ===================== */}
          <Section n="06" title="Containers & layout" lead="Panels are the workhorse — a 1px box with a black title bar. Everything else composes inside them.">
            <Sub>Panel — variants</Sub>
            <Grid cols="repeat(auto-fit,minmax(230px,1fr))" gap={14}>
              <Panel title="With title"><StatusText status="succeeded">All systems operational</StatusText></Panel>
              <Panel title="Title + action" actions={<Button compact primary>Add</Button>}><StatusText status="running">4 in queue</StatusText></Panel>
              <Panel title="Condensed" condensed><Caption>Tight padding for dense tiles</Caption></Panel>
              <Panel><span style={{ fontSize: 12 }}>A bare container — border and padding only.</span></Panel>
            </Grid>

            <Sub>Tabs</Sub>
            <Spec label="tablist · one active">
              <div style={{ width: 320 }}>
                <Tabs tabs={["Strip", "Stack", "Budget", "Treemap"]} value={tab === "Overview" ? "Strip" : tab} onChange={setTab} />
              </div>
            </Spec>

            <Grid cols="1fr 1fr" gap={18} style={{ marginTop: 22 }}>
              <div>
                <Sub>Metadata grid</Sub>
                <Panel title="Query detail">
                  <MetadataGrid rows={[["Corpus", "wikipedia-en"], ["Retriever", "bm25"], ["Top-K", "10"], ["Status", <StatusText status="succeeded">Completed</StatusText>]]} />
                </Panel>
              </div>
              <div>
                <Sub>Data table</Sub>
                <Panel title="Query results">
                  <table className="mac-table">
                    <thead><tr><th>ID</th><th>Name</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr><td>1</td><td>retrieval-a</td><td><StatusText status="succeeded">ok</StatusText></td></tr>
                      <tr><td>2</td><td>retrieval-b</td><td><StatusText status="running">run</StatusText></td></tr>
                      <tr><td>3</td><td>retrieval-c</td><td><StatusText status="failed">fail</StatusText></td></tr>
                    </tbody>
                  </table>
                </Panel>
              </div>
            </Grid>

            <Sub>Error callout</Sub>
            <Spec label="validation error">
              <div style={{ width: "100%", maxWidth: 460 }}><ErrorCallout>part 2: 'tokens' must be a number</ErrorCallout></div>
            </Spec>

            <Sub>Window chrome & menu bar</Sub>
            <Note>The outer shell: a desktop menu bar plus a striped-titlebar window with a close box and zoom box.</Note>
            <div style={{ border: "1px solid #ddd", background: "#fafafa", padding: 16 }}>
              <div style={{ maxWidth: 520, border: "1px solid #000", boxShadow: "2px 2px 0 0 rgba(0,0,0,0.5)" }}>
                <div className="mac-menubar" style={{ borderBottom: "1px solid #000" }}>
                  <span className="menu-item menu-apple"></span>
                  <span className="menu-item" style={{ fontWeight: 700 }}>Studio</span>
                  <span className="menu-item">File</span><span className="menu-item">Edit</span><span className="menu-item">View</span>
                  <span className="menu-spacer" /><span className="menu-clock">9:41 AM</span>
                </div>
                <div className="mac-titlebar"><span className="close-box" /><span className="title">Window Title</span><span className="zoom-box" /></div>
                <div style={{ padding: 14, font: "400 12px var(--font-body)", color: "#555" }}>Window body content.</div>
              </div>
            </div>
          </Section>

          {/* ===================== 7. DIAGRAM LANGUAGE ===================== */}
          <Section n="07" title="The diagram language" lead="The system's signature: context-window segments rendered as classic 1-bit fill patterns. Each kind carries meaning by texture, so diagrams read in pure black & white.">
            <Sub>Segment kinds</Sub>
            <Grid cols="repeat(auto-fill,minmax(150px,1fr))" gap={10}>
              {allKinds.map((k) => (
                <div key={k} style={{ border: "1px solid #ccc" }}>
                  <svg width="100%" height="40" viewBox="0 0 150 40" preserveAspectRatio="none"><PatternDefs /><KindRect x={0.6} y={0.6} w={148.8} h={38.8} kind={k} /></svg>
                  <div style={{ padding: "5px 8px" }}>
                    <div className="mono" style={{ fontSize: 10.5, fontWeight: 700 }}>{k}</div>
                    <div style={{ font: "400 10.5px/1.3 var(--font-body)", color: "#666" }}>{kindOf(k).name}</div>
                  </div>
                </div>
              ))}
            </Grid>

            <Sub>Fill modes</Sub>
            <Note>Three interchangeable renderings of the same window — switchable as a Tweak. Pattern is the default; Tone reads at a glance; Outline is print-friendly.</Note>
            <Grid cols="repeat(auto-fit,minmax(280px,1fr))" gap={16}>
              {[["pattern", "Pattern — 1-bit textures"], ["tone", "Tone — flat greyscale"], ["outline", "Outline — wireframe"]].map(([mode, label]) => (
                <div key={mode}>
                  <div className="mono" style={{ fontSize: 10, color: "#999", marginBottom: 5 }}>{label}</div>
                  <div style={{ border: "1px solid #ddd", padding: 10 }}>
                    <DiagramStyleContext.Provider value={mode}>
                      <DiagramRenderer d={adapt(snap, "strip")} />
                    </DiagramStyleContext.Provider>
                  </div>
                </div>
              ))}
            </Grid>

            <Sub>Diagram types</Sub>
            <Note>One token budget, four lenses. Strip for composition, Stack for order &amp; proportion, Budget for headroom, Treemap for where the tokens went.</Note>
            <DiagramStyleContext.Provider value="pattern">
              <Grid cols="1fr 1fr" gap={16}>
                {[["strip", "Strip"], ["budget", "Budget bar"], ["stack", "Stack"], ["treemap", "Treemap"]].map(([type, label]) => (
                  <div key={type}>
                    <div className="mono" style={{ fontSize: 10, color: "#999", marginBottom: 5 }}>{label}</div>
                    <div style={{ border: "1px solid #ddd", padding: 10 }}><DiagramRenderer d={adapt(SNAPSHOTS[1], type)} /></div>
                  </div>
                ))}
              </Grid>
            </DiagramStyleContext.Provider>
          </Section>

          {/* ===================== 8. COMPOSITION ===================== */}
          <Section n="08" title="Composition" lead="How the parts assemble into screens. Atoms nest in containers; containers tile inside the window shell.">
            <Sub>Shell anatomy</Sub>
            <div style={{ border: "1px solid #000", marginBottom: 8 }}>
              <div style={{ background: "#000", color: "#fff", font: "700 10px/1 var(--font-mono)", textAlign: "center", padding: "4px" }}>MENU BAR</div>
              <div style={{ background: "repeating-linear-gradient(to bottom,#000 0 1px,#fff 1px 3px)", textAlign: "center", padding: "3px", font: "700 10px var(--font-mono)" }}><span style={{ background: "#fff", padding: "0 8px" }}>TITLE BAR</span></div>
              <div style={{ display: "flex", height: 120 }}>
                <div style={{ flex: "0 0 130px", borderRight: "1px solid #000", background: "#fafafa", display: "grid", placeItems: "center", font: "700 10px var(--font-mono)", color: "#666", textAlign: "center" }}>SIDEBAR<br />NAV</div>
                <div style={{ flex: 1, display: "grid", placeItems: "center", font: "700 11px var(--font-mono)", color: "#999" }}>SCREEN CONTENT</div>
                <div style={{ flex: "0 0 110px", borderLeft: "1px solid #000", background: "#fafafa", display: "grid", placeItems: "center", font: "700 10px var(--font-mono)", color: "#666", textAlign: "center" }}>INSPECTOR<br />RAIL</div>
              </div>
            </div>
            <Caption>AppShell = MenuBar · MacWindow ( TitleBar · Sidebar · Content · optional Rail )</Caption>

            <Sub>Master / detail</Sub>
            <Note>DashboardGrid → DataTable (master) beside a Panel of MetadataGrid (detail).</Note>
            <Grid cols="1fr 1fr" gap={12}>
              <Panel title="Snapshots">
                <table className="mac-table">
                  <thead><tr><th>Turn</th><th>State</th></tr></thead>
                  <tbody>
                    <tr className="selected"><td>14</td><td>deep in the bug</td></tr>
                    <tr><td>3</td><td>warming up</td></tr>
                    <tr><td>31</td><td>at the limit</td></tr>
                  </tbody>
                </table>
              </Panel>
              <Panel title="Turn 14 — budget">
                <MetadataGrid compact rows={[["Used", <span className="mono">98,600</span>], ["Free", <span className="mono">101,400</span>], ["Limit", <span className="mono">200,000</span>], ["Fill", <span className="mono" style={{ color: "var(--mac-accent)" }}>49%</span>]]} />
              </Panel>
            </Grid>

            <Sub>Diagram + inspector (the Visualizer)</Sub>
            <Note>The product's core composition: a Panel-framed diagram beside a budget + breakdown rail.</Note>
            <DiagramStyleContext.Provider value="pattern">
              <div style={{ display: "flex", gap: 12, border: "1px solid #ddd", background: "#fafafa", padding: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Panel title="Strip view — Turn 14">
                    <DiagramRenderer d={adapt(SNAPSHOTS[1], "strip")} />
                    <hr className="divider-dim" style={{ margin: "8px 0" }} />
                    <Legend compact />
                  </Panel>
                </div>
                <div style={{ flex: "0 0 180px" }}>
                  <Panel title="Budget">
                    <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>49%</div>
                    <div style={{ height: 10, border: "1px solid #000", marginTop: 6 }}><div style={{ width: "49%", height: "100%", background: "#000" }} /></div>
                  </Panel>
                </div>
              </div>
            </DiagramStyleContext.Provider>
          </Section>

          {/* ===================== 9. SCREEN RENDERS ===================== */}
          <Section n="09" title="Screen renders" lead="Full compositions, captured live. The same atoms and containers above, assembled into shipping screens.">
            <Render title="Course landing — marketing page inside the window shell" w={1180} h={1340}>
              <MacWindow title="Context Window Engineering — Course"><LandingScreen onNavigate={() => {}} /></MacWindow>
            </Render>
            <Render title="Presentation — scaled 16:9 slide with diagram + numbered notes" w={1180} h={720}>
              <MacWindow title="Presentation"><SlideViewer /></MacWindow>
            </Render>
            <Render title="Handout — master/detail with live markdown render" w={1180} h={760}>
              <MacWindow title="Handout & Downloads"><Handout /></MacWindow>
            </Render>
          </Section>

          <div style={{ marginTop: 50, borderTop: "1px solid #000", paddingTop: 14, display: "flex", justifyContent: "space-between" }}>
            <span className="mono" style={{ fontSize: 10, color: "#999" }}>CONTEXT WINDOW STUDIO · DESIGN SYSTEM v1.0</span>
            <span className="mono" style={{ fontSize: 10, color: "#999" }}>Rendered from live components</span>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<DSOverview />);
