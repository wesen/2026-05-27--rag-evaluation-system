/* ds.jsx — Classic Mac OS primitives (React). Exports to window. */
const { useState, useRef, useEffect } = React;

/* ---- menu bar ---- */
function MenuBar({ items = ["File", "Edit", "View", "Window", "Help"], title = "Context Window Studio", clock }) {
  return (
    <div className="mac-menubar">
      <span className="menu-item menu-apple"></span>
      <span className="menu-item" style={{ fontWeight: 700 }}>{title}</span>
      {items.map((it) => <span key={it} className="menu-item">{it}</span>)}
      <span className="menu-spacer" />
      <span className="menu-clock">{clock || "9:41 AM"}</span>
    </div>
  );
}

/* ---- window chrome (striped titlebar) ---- */
function MacWindow({ title, children, style, onClose, bodyClass = "", scroll = false }) {
  return (
    <div className="mac-window" style={style}>
      <div className="mac-titlebar">
        <span className="close-box" onClick={onClose} title="Close" />
        <span className="title">{title}</span>
        <span className="zoom-box" />
      </div>
      <div className={"grow " + (scroll ? "mac-scroll " : "") + bodyClass} style={{ display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

/* ---- panel ---- */
function Panel({ title, actions, children, style, condensed = false, bodyStyle, fill = false }) {
  return (
    <section className="mac-panel" style={{ ...(fill ? { height: "100%", display: "flex", flexDirection: "column" } : {}), ...style }}>
      {title != null && (
        <div className="mac-panel-header">
          <span>{title}</span>
          {actions && <span style={{ display: "flex", gap: 6 }}>{actions}</span>}
        </div>
      )}
      <div className={"mac-panel-body" + (condensed ? " condensed" : "")} style={{ ...(fill ? { flex: 1, minHeight: 0 } : {}), ...bodyStyle }}>
        {children}
      </div>
    </section>
  );
}

/* ---- button ---- */
function Button({ children, primary, selected, compact, block, onClick, disabled, style, title }) {
  const cls = ["mac-btn", primary && "primary", selected && "selected", compact && "compact", block && "block"].filter(Boolean).join(" ");
  return <button type="button" className={cls} onClick={onClick} disabled={disabled} style={style} title={title}>{children}</button>;
}

function LinkButton({ children, onClick, style }) {
  return <button type="button" className="mac-link" onClick={onClick} style={style}>{children}</button>;
}

/* ---- tabs ---- */
function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mac-tablist" role="tablist">
      {tabs.map((t) => {
        const id = typeof t === "string" ? t : t.id;
        const label = typeof t === "string" ? t : t.label;
        return (
          <button key={id} role="tab" aria-selected={value === id}
            className={"mac-tab" + (value === id ? " active" : "")}
            onClick={() => onChange(id)}>{label}</button>
        );
      })}
    </div>
  );
}

/* ---- metadata grid ---- */
function MetadataGrid({ rows, compact = false }) {
  return (
    <dl className={"mac-meta" + (compact ? " compact" : "")}>
      {rows.map(([k, v], i) => (
        <div className="row" key={i}>
          <dt className="key">{k}</dt>
          <dd className="val" style={{ margin: 0 }}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---- status text ---- */
const STATUS_GLYPH = { running: "●", succeeded: "✔", failed: "✘", pending: "◌" };
function StatusText({ status, children }) {
  return <span className={"mac-status " + status}>{STATUS_GLYPH[status]} {children}</span>;
}

/* ---- caption / section label ---- */
function Caption({ children, style }) { return <span className="mac-caption" style={style}>{children}</span>; }
function SectionLabel({ children, style }) { return <div className="mac-sectionlabel" style={style}>{children}</div>; }

/* ---- inputs ---- */
function TextInput(props) { return <input className="mac-input" {...props} />; }
function TextArea(props) { return <textarea className="mac-textarea" {...props} />; }
function Select({ options, value, onChange, ...rest }) {
  return (
    <select className="mac-select" value={value} onChange={onChange} {...rest}>
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const lab = typeof o === "string" ? o : o.label;
        return <option key={val} value={val}>{lab}</option>;
      })}
    </select>
  );
}
function FormRow({ label, children }) {
  return (
    <div className="mac-formrow">
      <span className="mac-flabel">{label}</span>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}
function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", font: "var(--rag-font-role-compact)" }}>
      <input type="checkbox" className="mac-checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

/* ---- chip ---- */
function Chip({ children, tone }) { return <span className={"mac-chip" + (tone ? " " + tone : "")}>{children}</span>; }

/* ---- error callout ---- */
function ErrorCallout({ children }) { return <div className="mac-error">{children}</div>; }

Object.assign(window, {
  MenuBar, MacWindow, Panel, Button, LinkButton, Tabs, MetadataGrid,
  StatusText, Caption, SectionLabel, TextInput, TextArea, Select, FormRow,
  Checkbox, Chip, ErrorCallout,
});
