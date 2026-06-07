---
Title: Context Viewer Source Map
Ticket: RAGEVAL-CONTEXT-WINDOWS-DESIGN
Status: active
Topics: [design-system, frontend-architecture, react, rag, ui-dsl]
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Extracted top-level functions, constants, CSS variables, and CSS classes from the context-viewer prototype.
LastUpdated: 2026-06-07T00:00:00Z
WhatFor: Use as a compact source map for context-viewer analysis.
WhenToUse: Before reading individual prototype source files.
---

# Context Viewer Source Map

## `app.jsx`
- Lines: 114
- Functions: `NavIcon`, `App`
- Top-level constants: `TWEAK_DEFAULTS`, `NAV`, `TITLES`

## `data.jsx`
- Lines: 236
- Functions: `cwTotal`, `toStrip`, `toStack`, `toBudget`, `toTreemap`, `adapt`
- Top-level constants: `LIMIT`, `SNAPSHOTS`, `TRANSCRIPT`, `COURSE`, `HANDOUT`

## `data2.jsx`
- Lines: 59
- Top-level constants: `SLIDES`

## `diagrams.jsx`
- Lines: 319
- Functions: `wrapText`, `Txt`, `Arrow`, `placeSegments`, `StripDiagram`, `StackDiagram`, `BudgetBar`, `squarify`, `Treemap`, `DiagramRenderer`
- Top-level constants: `DFONT`, `DMONO`, `FIXED_W`

## `ds-overview.jsx`
- Lines: 429
- Functions: `Section`, `Sub`, `Note`, `Spec`, `Grid`, `Render`, `DSOverview`

## `ds.jsx`
- Lines: 143
- Functions: `MenuBar`, `MacWindow`, `Panel`, `Button`, `LinkButton`, `Tabs`, `MetadataGrid`, `StatusText`, `Caption`, `SectionLabel`, `TextInput`, `TextArea`, `Select`, `FormRow`, `Checkbox`, `Chip`, `ErrorCallout`
- Top-level constants: `STATUS_GLYPH`

## `patterns.jsx`
- Lines: 145
- Functions: `PatternDefs`, `kindOf`, `resolveKind`, `KindRect`, `Legend`
- Top-level constants: `INK`, `ACCENT`, `RED`, `KIND`, `TONE`, `OUTLINE`, `DiagramStyleContext`

## `screens.jsx`
- Lines: 277
- Functions: `LandingScreen`, `Visualize`, `Upload`
- Top-level constants: `VIEWS`, `SAMPLE_JSON`

## `screens2.jsx`
- Lines: 198
- Functions: `mdInline`, `Markdown`, `Handout`, `Transcript`
- Top-level constants: `ROLE_META`

## `screens3.jsx`
- Lines: 217
- Functions: `Comments`, `SlideViewer`
- Top-level constants: `SEED_COMMENTS`, `COMMENT_VIEWS`, `SLIDE_W`

## `tweaks-panel.jsx`
- Lines: 542
- Functions: `useTweaks`, `TweaksPanel`, `TweakSection`, `TweakRow`, `TweakSlider`, `TweakToggle`, `TweakRadio`, `TweakSelect`, `TweakText`, `TweakNumber`, `__twkIsLight`, `TweakColor`, `TweakButton`

## `styles.css`
- Lines: 316
- CSS variables: `--desktop`, `--font-body`, `--font-display`, `--font-mono`, `--mac-accent`, `--mac-accent-2`, `--mac-amber`, `--mac-bg`, `--mac-bg-dark`, `--mac-border`, `--mac-green`, `--mac-mono`, `--mac-stripe`, `--mac-surface`, `--mac-surface-2`, `--mac-surface-3`, `--mac-text`, `--mac-text-dim`, `--mac-text-inv`, `--rag-font-role-body`, `--rag-font-role-code`, `--rag-font-role-compact`, `--rag-font-role-label`, `--rag-font-role-metadata`, `--rag-font-role-metric`
- CSS classes: `.center`, `.col`, `.desktop-bg`, `.dim`, `.divider`, `.divider-dim`, `.gap2`, `.grow`, `.mac-btn`, `.mac-caption`, `.mac-checkbox`, `.mac-chip`, `.mac-error`, `.mac-flabel`, `.mac-formrow`, `.mac-input`, `.mac-link`, `.mac-menubar`, `.mac-meta`, `.mac-navgroup`, `.mac-navitem`, `.mac-panel`, `.mac-panel-body`, `.mac-panel-header`, `.mac-scroll`, `.mac-sectionlabel`, `.mac-sidebar`, `.mac-status`, `.mac-tab`, `.mac-table`, `.mac-tablist`, `.mac-textarea`, `.mac-titlebar`, `.mac-window`, `.mono`, `.row`, `.spread`, `.wrap`
