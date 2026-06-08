---
Title: Line References for Widget IR Semantic Components
Ticket: RAGEVAL-WIDGET-IR-SEMANTIC-COMPONENTS
Status: active
Topics:
  - frontend
  - widget-ir
  - design-system
  - rag-evaluation
DocType: reference
Intent: short-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Line-numbered source excerpts for Widget IR semantic component support research."
LastUpdated: 2026-06-07T21:10:00-04:00
WhatFor: "Use as line-anchored evidence for the implementation guide."
WhenToUse: "When reviewing claims about existing Widget IR, renderer, DSL, schema, context DTOs, and package exports."
---

# Line References for Widget IR Semantic Components

## TypeScript Widget IR model

File: `packages/rag-evaluation-site/src/widgets/ir.ts` lines 1-220

```text
     1	import type { CaptionTone, CaptionTransform, RagStatus } from '../components/foundation';
     2	import type { ButtonSize, ButtonVariant } from '../components/atoms';
     3	import type { DashboardGridRecipe, InlineGap, InlineJustify, StackAlign, StackGap } from '../components/layout';
     4	
     5	export type JsonPrimitive = string | number | boolean | null;
     6	export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
     7	export type JsonObject = { [key: string]: JsonValue };
     8	
     9	export type WidgetNode = TextNode | ElementNode | ComponentNode;
    10	
    11	export interface TextNode {
    12	  kind: 'text';
    13	  text: string;
    14	}
    15	
    16	export interface ElementNode {
    17	  kind: 'element';
    18	  tag: string;
    19	  attrs?: JsonObject;
    20	  children?: WidgetNode[];
    21	}
    22	
    23	export type RagWidgetType =
    24	  | 'AppShell'
    25	  | 'AppNav'
    26	  | 'Button'
    27	  | 'Caption'
    28	  | 'DashboardGrid'
    29	  | 'DataTable'
    30	  | 'FormRow'
    31	  | 'Inline'
    32	  | 'MetadataGrid'
    33	  | 'Panel'
    34	  | 'ScrollRegion'
    35	  | 'SelectInput'
    36	  | 'Stack'
    37	  | 'StatusText'
    38	  | 'TabList'
    39	  | 'TextInput';
    40	
    41	export interface ComponentNode {
    42	  kind: 'component';
    43	  type: RagWidgetType | string;
    44	  props?: WidgetProps;
    45	  children?: WidgetNode[];
    46	}
    47	
    48	export type RenderableValue = WidgetNode | string | number | boolean | null;
    49	
    50	export type ActionSpec =
    51	  | NavigateActionSpec
    52	  | ServerActionSpec
    53	  | EventActionSpec
    54	  | CopyActionSpec;
    55	
    56	export interface NavigateActionSpec {
    57	  kind: 'navigate';
    58	  to: string;
    59	  params?: JsonObject;
    60	}
    61	
    62	export interface ServerActionSpec {
    63	  kind: 'server';
    64	  name: string;
    65	  payload?: JsonObject;
    66	}
    67	
    68	export interface EventActionSpec {
    69	  kind: 'event';
    70	  event: string;
    71	  detail?: JsonObject;
    72	}
    73	
    74	export interface CopyActionSpec {
    75	  kind: 'copy';
    76	  value?: string;
    77	  field?: string;
    78	}
    79	
    80	export interface BaseWidgetProps {
    81	  className?: string;
    82	  style?: JsonObject;
    83	  id?: string;
    84	  action?: ActionSpec;
    85	  [key: string]: unknown;
    86	}
    87	
    88	export interface AppShellWidgetProps extends BaseWidgetProps {
    89	  header?: WidgetNode;
    90	  sidebar?: WidgetNode;
    91	}
    92	
    93	export interface AppNavWidgetProps extends BaseWidgetProps {
    94	  brand: RenderableValue;
    95	  items: AppNavItemSpec[];
    96	  activeItemId: string;
    97	}
    98	
    99	export interface AppNavItemSpec {
   100	  id: string;
   101	  label: RenderableValue;
   102	  action?: ActionSpec;
   103	}
   104	
   105	export interface ButtonWidgetProps extends BaseWidgetProps {
   106	  variant?: ButtonVariant;
   107	  size?: ButtonSize;
   108	  selected?: boolean;
   109	  disabled?: boolean;
   110	  type?: 'button' | 'submit' | 'reset';
   111	}
   112	
   113	export interface CaptionWidgetProps extends BaseWidgetProps {
   114	  tone?: CaptionTone;
   115	  transform?: CaptionTransform;
   116	  truncate?: boolean;
   117	}
   118	
   119	export interface DashboardGridWidgetProps extends BaseWidgetProps {
   120	  recipe?: DashboardGridRecipe;
   121	}
   122	
   123	export interface DataTableWidgetProps extends BaseWidgetProps {
   124	  columns: DataTableColumnSpec[];
   125	  rows: JsonObject[];
   126	  getRowKey: RowKeySpec;
   127	  selectedKey?: string | null;
   128	  onRowSelect?: ActionSpec;
   129	  emptyMessage?: RenderableValue;
   130	}
   131	
   132	export interface DataTableColumnSpec {
   133	  id: string;
   134	  header: RenderableValue;
   135	  cell: CellSpec;
   136	  align?: 'start' | 'end' | 'center';
   137	  maxWidth?: number | string;
   138	}
   139	
   140	export type RowKeySpec = string | { field: string } | { template: string };
   141	
   142	export type CellSpec =
   143	  | FieldCellSpec
   144	  | NumberCellSpec
   145	  | StatusCellSpec
   146	  | CaptionCellSpec
   147	  | TemplateCellSpec
   148	  | LinkCellSpec
   149	  | ConstantCellSpec;
   150	
   151	export interface FieldCellSpec {
   152	  kind: 'field';
   153	  field: string;
   154	  fallback?: string;
   155	}
   156	
   157	export interface NumberCellSpec {
   158	  kind: 'number';
   159	  field: string;
   160	  format?: 'integer' | 'fixed';
   161	  digits?: number;
   162	  fallback?: string;
   163	}
   164	
   165	export interface StatusCellSpec {
   166	  kind: 'status';
   167	  field: string;
   168	  icon?: boolean;
   169	  fallback?: RagStatus | string;
   170	}
   171	
   172	export interface CaptionCellSpec {
   173	  kind: 'caption';
   174	  field: string;
   175	  tone?: CaptionTone;
   176	  fallback?: string;
   177	}
   178	
   179	export interface TemplateCellSpec {
   180	  kind: 'template';
   181	  template: string;
   182	}
   183	
   184	export interface LinkCellSpec {
   185	  kind: 'link';
   186	  hrefField: string;
   187	  labelField: string;
   188	  target?: '_blank' | '_self' | '_parent' | '_top';
   189	  fallbackLabel?: string;
   190	}
   191	
   192	export interface ConstantCellSpec {
   193	  kind: 'constant';
   194	  value: RenderableValue;
   195	}
   196	
   197	export interface FormRowWidgetProps extends BaseWidgetProps {
   198	  label: RenderableValue;
   199	  control: WidgetNode;
   200	  hint?: RenderableValue;
   201	}
   202	
   203	export interface InlineWidgetProps extends BaseWidgetProps {
   204	  gap?: InlineGap;
   205	  justify?: InlineJustify;
   206	  wrap?: boolean;
   207	}
   208	
   209	export interface MetadataGridWidgetProps extends BaseWidgetProps {
   210	  items: MetadataGridItemSpec[];
   211	  density?: 'normal' | 'compact';
   212	}
   213	
   214	export interface MetadataGridItemSpec {
   215	  key: RenderableValue;
   216	  value: RenderableValue;
   217	  copyValue?: string;
   218	}
   219	
   220	export interface PanelWidgetProps extends BaseWidgetProps {
```

## WidgetRenderer dispatch and current component coverage

File: `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx` lines 1-260

```text
     1	import { createElement, type CSSProperties, type ReactNode } from 'react';
     2	import { Button, ErrorCallout, SelectInput, TextInput } from '../components/atoms';
     3	import { Caption, StatusText } from '../components/foundation';
     4	import { AppShell, DashboardGrid, FormRow, Inline, Panel, ScrollRegion, Stack, TabList } from '../components/layout';
     5	import { AppNav, DataTable, MetadataGrid } from '../components/molecules';
     6	import type {
     7	  ActionSpec,
     8	  AppNavWidgetProps,
     9	  AppShellWidgetProps,
    10	  ButtonWidgetProps,
    11	  CaptionWidgetProps,
    12	  ComponentNode,
    13	  DashboardGridWidgetProps,
    14	  DataTableWidgetProps,
    15	  ElementNode,
    16	  FormRowWidgetProps,
    17	  InlineWidgetProps,
    18	  JsonObject,
    19	  MetadataGridWidgetProps,
    20	  PanelWidgetProps,
    21	  ScrollRegionWidgetProps,
    22	  SelectInputWidgetProps,
    23	  StackWidgetProps,
    24	  StatusTextWidgetProps,
    25	  TabListWidgetProps,
    26	  TextInputWidgetProps,
    27	  WidgetNode,
    28	} from './ir';
    29	import { bindAction, type WidgetActionContext, type WidgetActionHandler } from './actions';
    30	import { renderCell, renderRenderable, rowKey } from './cellRenderers';
    31	
    32	export interface WidgetRendererProps {
    33	  node: WidgetNode;
    34	  onAction?: WidgetActionHandler;
    35	}
    36	
    37	export function WidgetRenderer({ node, onAction }: WidgetRendererProps) {
    38	  return <>{renderWidgetNode(node, onAction)}</>;
    39	}
    40	
    41	function renderWidgetNode(node: WidgetNode, onAction?: WidgetActionHandler): ReactNode {
    42	  if (node.kind === 'text') return node.text;
    43	  if (node.kind === 'element') return renderElementNode(node, onAction);
    44	  return renderComponentNode(node, onAction);
    45	}
    46	
    47	function renderChildren(children: WidgetNode[] | undefined, onAction?: WidgetActionHandler): ReactNode[] {
    48	  return (children ?? []).map((child, index) => <WidgetRenderer key={index} node={child} onAction={onAction} />);
    49	}
    50	
    51	function renderRenderableValue(value: unknown, onAction?: WidgetActionHandler): ReactNode {
    52	  return renderRenderable(value as never, (node) => renderWidgetNode(node, onAction));
    53	}
    54	
    55	function renderElementNode(node: ElementNode, onAction?: WidgetActionHandler): ReactNode {
    56	  const attrs = { ...(node.attrs ?? {}) } as Record<string, unknown>;
    57	  if (attrs.style && typeof attrs.style === 'object') attrs.style = attrs.style as CSSProperties;
    58	  return createElement(node.tag, attrs, ...renderChildren(node.children, onAction));
    59	}
    60	
    61	function renderComponentNode(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
    62	  switch (node.type) {
    63	    case 'AppShell':
    64	      return renderAppShell(node, onAction);
    65	    case 'AppNav':
    66	      return renderAppNav(node, onAction);
    67	    case 'Button':
    68	      return renderButton(node, onAction);
    69	    case 'Caption':
    70	      return renderCaption(node, onAction);
    71	    case 'DashboardGrid':
    72	      return renderDashboardGrid(node, onAction);
    73	    case 'DataTable':
    74	      return renderDataTable(node, onAction);
    75	    case 'FormRow':
    76	      return renderFormRow(node, onAction);
    77	    case 'Inline':
    78	      return renderInline(node, onAction);
    79	    case 'MetadataGrid':
    80	      return renderMetadataGrid(node, onAction);
    81	    case 'Panel':
    82	      return renderPanel(node, onAction);
    83	    case 'ScrollRegion':
    84	      return renderScrollRegion(node, onAction);
    85	    case 'SelectInput':
    86	      return renderSelectInput(node, onAction);
    87	    case 'Stack':
    88	      return renderStack(node, onAction);
    89	    case 'StatusText':
    90	      return renderStatusText(node, onAction);
    91	    case 'TabList':
    92	      return renderTabList(node, onAction);
    93	    case 'TextInput':
    94	      return renderTextInput(node);
    95	    default:
    96	      return <ErrorCallout>Unknown widget: {node.type}</ErrorCallout>;
    97	  }
    98	}
    99	
   100	function renderAppShell(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   101	  const props = (node.props ?? {}) as AppShellWidgetProps;
   102	  return (
   103	    <AppShell
   104	      className={props.className}
   105	      header={props.header ? renderWidgetNode(props.header, onAction) : undefined}
   106	      sidebar={props.sidebar ? renderWidgetNode(props.sidebar, onAction) : undefined}
   107	    >
   108	      {renderChildren(node.children, onAction)}
   109	    </AppShell>
   110	  );
   111	}
   112	
   113	function renderAppNav(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   114	  const props = (node.props ?? {}) as AppNavWidgetProps;
   115	  return (
   116	    <AppNav
   117	      brand={renderRenderableValue(props.brand, onAction)}
   118	      items={props.items.map((item) => ({ id: item.id, label: renderRenderableValue(item.label, onAction) }))}
   119	      activeItemId={props.activeItemId}
   120	      onItemSelect={(itemId) => {
   121	        const item = props.items.find((candidate) => candidate.id === itemId);
   122	        if (item?.action) bindAndRun(item.action, { value: itemId, componentType: 'AppNav' }, onAction);
   123	      }}
   124	    />
   125	  );
   126	}
   127	
   128	function renderButton(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   129	  const props = (node.props ?? {}) as ButtonWidgetProps;
   130	  return (
   131	    <Button
   132	      className={props.className}
   133	      variant={props.variant}
   134	      size={props.size}
   135	      selected={props.selected}
   136	      disabled={props.disabled}
   137	      type={props.type ?? 'button'}
   138	      onClick={bindAction(props.action, { componentType: 'Button' }, onAction)}
   139	    >
   140	      {renderChildren(node.children, onAction)}
   141	    </Button>
   142	  );
   143	}
   144	
   145	function renderCaption(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   146	  const props = (node.props ?? {}) as CaptionWidgetProps;
   147	  return <Caption className={props.className} tone={props.tone} transform={props.transform} truncate={props.truncate}>{renderChildren(node.children, onAction)}</Caption>;
   148	}
   149	
   150	function renderDashboardGrid(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   151	  const props = (node.props ?? {}) as DashboardGridWidgetProps;
   152	  return <DashboardGrid className={props.className} recipe={props.recipe}>{renderChildren(node.children, onAction)}</DashboardGrid>;
   153	}
   154	
   155	function renderDataTable(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   156	  const props = (node.props ?? {}) as DataTableWidgetProps;
   157	  const rowSelectAction = props.onRowSelect;
   158	  return (
   159	    <DataTable<JsonObject>
   160	      className={props.className}
   161	      rows={props.rows}
   162	      columns={props.columns.map((column) => ({
   163	        id: column.id,
   164	        header: renderRenderableValue(column.header, onAction),
   165	        align: column.align,
   166	        maxWidth: column.maxWidth,
   167	        cell: (row) => renderCell(column.cell, row, (child) => renderWidgetNode(child, onAction)),
   168	      }))}
   169	      getRowKey={(row) => rowKey(row, props.getRowKey)}
   170	      selectedKey={props.selectedKey == null ? props.selectedKey : String(props.selectedKey)}
   171	      emptyMessage={renderRenderableValue(props.emptyMessage, onAction)}
   172	      onRowSelect={rowSelectAction ? (row) => bindAndRun(rowSelectAction, { row, rowKey: rowKey(row, props.getRowKey), componentType: 'DataTable' }, onAction) : undefined}
   173	    />
   174	  );
   175	}
   176	
   177	function renderFormRow(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   178	  const props = (node.props ?? {}) as FormRowWidgetProps;
   179	  return (
   180	    <FormRow
   181	      className={props.className}
   182	      label={renderRenderableValue(props.label, onAction)}
   183	      control={renderWidgetNode(props.control, onAction)}
   184	      hint={renderRenderableValue(props.hint, onAction)}
   185	    />
   186	  );
   187	}
   188	
   189	function renderInline(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   190	  const props = (node.props ?? {}) as InlineWidgetProps;
   191	  return <Inline className={props.className} gap={props.gap} justify={props.justify} wrap={props.wrap}>{renderChildren(node.children, onAction)}</Inline>;
   192	}
   193	
   194	function renderMetadataGrid(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   195	  const props = (node.props ?? {}) as MetadataGridWidgetProps;
   196	  return (
   197	    <MetadataGrid
   198	      className={props.className}
   199	      density={props.density}
   200	      items={props.items.map((item) => ({
   201	        key: renderRenderableValue(item.key, onAction),
   202	        value: renderRenderableValue(item.value, onAction),
   203	        copyValue: item.copyValue,
   204	      }))}
   205	    />
   206	  );
   207	}
   208	
   209	function renderPanel(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   210	  const props = (node.props ?? {}) as PanelWidgetProps;
   211	  return (
   212	    <Panel
   213	      className={props.className}
   214	      title={renderRenderableValue(props.title, onAction)}
   215	      actions={renderRenderableValue(props.actions, onAction)}
   216	      density={props.density}
   217	      fill={props.fill}
   218	    >
   219	      {renderChildren(node.children, onAction)}
   220	    </Panel>
   221	  );
   222	}
   223	
   224	function renderScrollRegion(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   225	  const props = (node.props ?? {}) as ScrollRegionWidgetProps;
   226	  return <ScrollRegion className={props.className} axis={props.axis} style={props.style as CSSProperties | undefined}>{renderChildren(node.children, onAction)}</ScrollRegion>;
   227	}
   228	
   229	function renderSelectInput(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   230	  const props = (node.props ?? {}) as SelectInputWidgetProps;
   231	  return (
   232	    <SelectInput className={props.className} name={props.name} value={props.value} disabled={props.disabled}>
   233	      {(props.options ?? []).map((option) => (
   234	        <option key={String(option.value)} value={option.value} disabled={option.disabled}>
   235	          {renderRenderableValue(option.label, onAction)}
   236	        </option>
   237	      ))}
   238	      {renderChildren(node.children, onAction)}
   239	    </SelectInput>
   240	  );
   241	}
   242	
   243	function renderStack(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   244	  const props = (node.props ?? {}) as StackWidgetProps;
   245	  return <Stack className={props.className} gap={props.gap} align={props.align}>{renderChildren(node.children, onAction)}</Stack>;
   246	}
   247	
   248	function renderStatusText(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   249	  const props = (node.props ?? {}) as StatusTextWidgetProps;
   250	  return <StatusText className={props.className} status={props.status} icon={props.icon}>{renderChildren(node.children, onAction)}</StatusText>;
   251	}
   252	
   253	function renderTabList(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
   254	  const props = (node.props ?? {}) as TabListWidgetProps;
   255	  return (
   256	    <TabList
   257	      items={props.items.map((item) => ({ id: item.id, label: renderRenderableValue(item.label, onAction) }))}
   258	      activeId={props.activeId}
   259	      ariaLabel={props.ariaLabel}
   260	      onChange={(id) => {
```

## WidgetRenderer current component cases continued

File: `packages/rag-evaluation-site/src/widgets/WidgetRenderer.tsx` lines 260-520

```text
   260	      onChange={(id) => {
   261	        if (props.onChange) bindAndRun(props.onChange, { value: id, componentType: 'TabList' }, onAction);
   262	      }}
   263	    />
   264	  );
   265	}
   266	
   267	function renderTextInput(node: ComponentNode): ReactNode {
   268	  const props = (node.props ?? {}) as TextInputWidgetProps;
   269	  return (
   270	    <TextInput
   271	      className={props.className}
   272	      name={props.name}
   273	      value={props.value}
   274	      placeholder={props.placeholder}
   275	      type={props.type}
   276	      disabled={props.disabled}
   277	      min={props.min}
   278	      max={props.max}
   279	      readOnly
   280	    />
   281	  );
   282	}
   283	
   284	function bindAndRun(action: ActionSpec, context: WidgetActionContext, onAction?: WidgetActionHandler): void {
   285	  bindAction(action, context, onAction)?.();
   286	}
```

## Widget DSL module exports and helpers

File: `pkg/widgetdsl/module.go` lines 1-260

```text
     1	package widgetdsl
     2	
     3	import (
     4		"fmt"
     5		"reflect"
     6		"regexp"
     7		"strings"
     8	
     9		"github.com/dop251/goja"
    10		"github.com/dop251/goja_nodejs/require"
    11		"github.com/go-go-golems/go-go-goja/modules"
    12	)
    13	
    14	const ModuleName = "widget.dsl"
    15	
    16	var templatePattern = regexp.MustCompile(`\$\{([^}]+)\}|\$([A-Za-z0-9_.-]+)`)
    17	
    18	var componentNames = []string{
    19		"appShell",
    20		"appNav",
    21		"button",
    22		"caption",
    23		"dashboardGrid",
    24		"dataTable",
    25		"formRow",
    26		"inline",
    27		"metadataGrid",
    28		"panel",
    29		"scrollRegion",
    30		"selectInput",
    31		"stack",
    32		"statusText",
    33		"tabList",
    34		"textInput",
    35	}
    36	
    37	var componentTypes = map[string]string{
    38		"appShell":      "AppShell",
    39		"appNav":        "AppNav",
    40		"button":        "Button",
    41		"caption":       "Caption",
    42		"dashboardGrid": "DashboardGrid",
    43		"dataTable":     "DataTable",
    44		"formRow":       "FormRow",
    45		"inline":        "Inline",
    46		"metadataGrid":  "MetadataGrid",
    47		"panel":         "Panel",
    48		"scrollRegion":  "ScrollRegion",
    49		"selectInput":   "SelectInput",
    50		"stack":         "Stack",
    51		"statusText":    "StatusText",
    52		"tabList":       "TabList",
    53		"textInput":     "TextInput",
    54	}
    55	
    56	type module struct{}
    57	
    58	var _ modules.NativeModule = (*module)(nil)
    59	
    60	func NewLoader() require.ModuleLoader {
    61		mod := &module{}
    62		return mod.Loader
    63	}
    64	
    65	func Register(reg *require.Registry) {
    66		if reg == nil {
    67			return
    68		}
    69		loader := NewLoader()
    70		reg.RegisterNativeModule(ModuleName, loader)
    71		reg.RegisterNativeModule("rag.dsl", loader)
    72	}
    73	
    74	func (module) Name() string { return ModuleName }
    75	
    76	func (module) Doc() string {
    77		return `
    78	widget.dsl is a RAG Evaluation System authoring DSL for producing JSON-compatible
    79	Widget IR. The returned IR is intended to be rendered by the React WidgetRenderer,
    80	not by Go-side HTML generation.
    81	
    82	Example:
    83	
    84	  const rag = require("widget.dsl");
    85	  exports.page = () => rag.panel({title: "Demo"},
    86	    rag.caption({tone: "success"}, "Rendered by React")
    87	  );
    88	`
    89	}
    90	
    91	func (m *module) Loader(vm *goja.Runtime, moduleObj *goja.Object) {
    92		rt := &runtime{vm: vm}
    93		exports := moduleObj.Get("exports").(*goja.Object)
    94		rt.install(exports)
    95	}
    96	
    97	func init() {
    98		modules.Register(&module{})
    99	}
   100	
   101	type runtime struct {
   102		vm *goja.Runtime
   103	}
   104	
   105	func (r *runtime) install(exports *goja.Object) {
   106		setExport(exports, "text", r.text)
   107		setExport(exports, "element", r.element)
   108		setExport(exports, "component", r.component)
   109		setExport(exports, "fragment", r.fragment)
   110		setExport(exports, "page", r.page)
   111	
   112		for _, name := range componentNames {
   113			componentType := componentTypes[name]
   114			setExport(exports, name, r.componentFactory(componentType))
   115		}
   116	
   117		cell := r.vm.NewObject()
   118		setExport(cell, "field", func(field string, options ...goja.Value) map[string]any {
   119			out := map[string]any{"kind": "field", "field": field}
   120			mergeOptions(out, exportOptions(options))
   121			return out
   122		})
   123		setExport(cell, "number", func(field string, options ...goja.Value) map[string]any {
   124			out := map[string]any{"kind": "number", "field": field}
   125			mergeOptions(out, exportOptions(options))
   126			return out
   127		})
   128		setExport(cell, "status", func(field string, options ...goja.Value) map[string]any {
   129			out := map[string]any{"kind": "status", "field": field}
   130			mergeOptions(out, exportOptions(options))
   131			return out
   132		})
   133		setExport(cell, "caption", func(field string, options ...goja.Value) map[string]any {
   134			out := map[string]any{"kind": "caption", "field": field}
   135			mergeOptions(out, exportOptions(options))
   136			return out
   137		})
   138		setExport(cell, "template", func(template string) map[string]any {
   139			return map[string]any{"kind": "template", "template": template}
   140		})
   141		setExport(cell, "link", func(hrefField string, labelField string, options ...goja.Value) map[string]any {
   142			out := map[string]any{"kind": "link", "hrefField": hrefField, "labelField": labelField}
   143			mergeOptions(out, exportOptions(options))
   144			return out
   145		})
   146		setExport(cell, "constant", func(value goja.Value) any {
   147			return map[string]any{"kind": "constant", "value": r.exportRenderable(value)}
   148		})
   149		setExport(exports, "cell", cell)
   150	
   151		action := r.vm.NewObject()
   152		setExport(action, "server", func(name string, options ...goja.Value) map[string]any {
   153			out := map[string]any{"kind": "server", "name": name}
   154			mergeOptions(out, exportOptions(options))
   155			return out
   156		})
   157		setExport(action, "navigate", func(to string, options ...goja.Value) map[string]any {
   158			out := map[string]any{"kind": "navigate", "to": to}
   159			mergeOptions(out, exportOptions(options))
   160			return out
   161		})
   162		setExport(action, "event", func(event string, options ...goja.Value) map[string]any {
   163			out := map[string]any{"kind": "event", "event": event}
   164			mergeOptions(out, exportOptions(options))
   165			return out
   166		})
   167		setExport(action, "copy", func(value string) map[string]any {
   168			return map[string]any{"kind": "copy", "value": value}
   169		})
   170		setExport(exports, "action", action)
   171	
   172		recipes := r.vm.NewObject()
   173		setExport(recipes, "metrics", r.metricsRecipe)
   174		setExport(recipes, "actionToolbar", r.actionToolbarRecipe)
   175		setExport(recipes, "masterDetailTable", r.masterDetailTableRecipe)
   176		setExport(exports, "recipes", recipes)
   177	}
   178	
   179	func (r *runtime) text(value goja.Value) map[string]any {
   180		return map[string]any{"kind": "text", "text": stringifyValue(value)}
   181	}
   182	
   183	func (r *runtime) element(call goja.FunctionCall) goja.Value {
   184		if len(call.Arguments) == 0 {
   185			panic(r.vm.NewGoError(fmt.Errorf("widget.dsl element(tag, attrs?, ...children) requires a tag")))
   186		}
   187		tag := strings.TrimSpace(call.Arguments[0].String())
   188		if tag == "" {
   189			panic(r.vm.NewGoError(fmt.Errorf("widget.dsl element tag must not be empty")))
   190		}
   191		attrs := map[string]any{}
   192		childStart := 1
   193		if len(call.Arguments) > 1 && isPlainObject(call.Arguments[1]) && !looksLikeWidgetNodeExport(call.Arguments[1]) {
   194			attrs = exportObject(call.Arguments[1])
   195			childStart = 2
   196		}
   197		out := map[string]any{"kind": "element", "tag": tag}
   198		if len(attrs) > 0 {
   199			out["attrs"] = attrs
   200		}
   201		children := r.exportChildren(call.Arguments[childStart:])
   202		if len(children) > 0 {
   203			out["children"] = children
   204		}
   205		return r.vm.ToValue(out)
   206	}
   207	
   208	func (r *runtime) component(call goja.FunctionCall) goja.Value {
   209		if len(call.Arguments) == 0 {
   210			panic(r.vm.NewGoError(fmt.Errorf("widget.dsl component(type, props?, ...children) requires a type")))
   211		}
   212		componentType := strings.TrimSpace(call.Arguments[0].String())
   213		if componentType == "" {
   214			panic(r.vm.NewGoError(fmt.Errorf("widget.dsl component type must not be empty")))
   215		}
   216		props, childStart := propsAndChildStart(call.Arguments, 1)
   217		return r.vm.ToValue(r.buildComponent(componentType, props, call.Arguments[childStart:]))
   218	}
   219	
   220	func (r *runtime) componentFactory(componentType string) func(goja.FunctionCall) goja.Value {
   221		return func(call goja.FunctionCall) goja.Value {
   222			props, childStart := propsAndChildStart(call.Arguments, 0)
   223			return r.vm.ToValue(r.buildComponent(componentType, props, call.Arguments[childStart:]))
   224		}
   225	}
   226	
   227	func (r *runtime) fragment(call goja.FunctionCall) []any {
   228		return r.exportChildren(call.Arguments)
   229	}
   230	
   231	func (r *runtime) page(call goja.FunctionCall) goja.Value {
   232		if len(call.Arguments) == 0 || !isPlainObject(call.Arguments[0]) {
   233			panic(r.vm.NewGoError(fmt.Errorf("widget.dsl page(options) requires an options object")))
   234		}
   235		options := exportObject(call.Arguments[0])
   236		id := stringFromMap(options, "id", "page")
   237		title := stringFromMap(options, "title", id)
   238		out := map[string]any{
   239			"schemaVersion": stringFromMap(options, "schemaVersion", "0.1.0"),
   240			"id":            id,
   241			"title":         title,
   242		}
   243		if meta, ok := options["meta"].(map[string]any); ok && len(meta) > 0 {
   244			out["meta"] = meta
   245		}
   246		if root, ok := options["root"].(map[string]any); ok && isWidgetNodeExport(root) {
   247			out["root"] = root
   248			return r.vm.ToValue(out)
   249		}
   250		sections := anySlice(options["sections"])
   251		children := []any{}
   252		for _, section := range sections {
   253			if node, ok := section.(map[string]any); ok && isWidgetNodeExport(node) {
   254				children = append(children, node)
   255			}
   256		}
   257		out["root"] = map[string]any{
   258			"kind":     "component",
   259			"type":     "Stack",
   260			"props":    map[string]any{"gap": stringFromMap(options, "gap", "lg")},
```

## Widget DSL recipes and helpers

File: `pkg/widgetdsl/module.go` lines 260-620

```text
   260			"props":    map[string]any{"gap": stringFromMap(options, "gap", "lg")},
   261			"children": children,
   262		}
   263		return r.vm.ToValue(out)
   264	}
   265	
   266	func (r *runtime) metricsRecipe(call goja.FunctionCall) goja.Value {
   267		options := firstObject(call.Arguments)
   268		items := anySlice(options["items"])
   269		children := []any{}
   270		for _, raw := range items {
   271			item, ok := raw.(map[string]any)
   272			if !ok {
   273				continue
   274			}
   275			label := stringFromMap(item, "label", "Metric")
   276			status := stringFromMap(item, "status", "ready")
   277			value := item["value"]
   278			children = append(children, map[string]any{
   279				"kind":  "component",
   280				"type":  "Panel",
   281				"props": map[string]any{"title": label, "density": "condensed"},
   282				"children": []any{map[string]any{
   283					"kind":     "component",
   284					"type":     "StatusText",
   285					"props":    map[string]any{"status": status, "icon": boolFromMap(item, "icon", true)},
   286					"children": []any{map[string]any{"kind": "text", "text": fmt.Sprint(value)}},
   287				}},
   288			})
   289		}
   290		return r.vm.ToValue(map[string]any{
   291			"kind":     "component",
   292			"type":     "DashboardGrid",
   293			"props":    map[string]any{"recipe": stringFromMap(options, "recipe", metricsRecipeName(len(children)))},
   294			"children": children,
   295		})
   296	}
   297	
   298	func (r *runtime) actionToolbarRecipe(call goja.FunctionCall) goja.Value {
   299		options := firstObject(call.Arguments)
   300		actions := anySlice(options["actions"])
   301		inlineChildren := []any{}
   302		for _, raw := range actions {
   303			item, ok := raw.(map[string]any)
   304			if !ok {
   305				continue
   306			}
   307			label := stringFromMap(item, "label", stringFromMap(item, "name", "Action"))
   308			props := map[string]any{"variant": stringFromMap(item, "variant", "secondary")}
   309			if act, ok := normalizeActionSpec(item["action"], item["name"], item["payload"]); ok {
   310				props["action"] = act
   311			}
   312			inlineChildren = append(inlineChildren, map[string]any{
   313				"kind":     "component",
   314				"type":     "Button",
   315				"props":    props,
   316				"children": []any{map[string]any{"kind": "text", "text": label}},
   317			})
   318		}
   319		if caption, ok := options["caption"].(string); ok && caption != "" {
   320			inlineChildren = append(inlineChildren, map[string]any{
   321				"kind":     "component",
   322				"type":     "Caption",
   323				"props":    map[string]any{"tone": stringFromMap(options, "captionTone", "muted")},
   324				"children": []any{map[string]any{"kind": "text", "text": caption}},
   325			})
   326		}
   327		return r.vm.ToValue(map[string]any{
   328			"kind":  "component",
   329			"type":  "Panel",
   330			"props": map[string]any{"title": stringFromMap(options, "title", "Actions")},
   331			"children": []any{map[string]any{
   332				"kind":     "component",
   333				"type":     "Inline",
   334				"props":    map[string]any{"gap": stringFromMap(options, "gap", "sm"), "wrap": boolFromMap(options, "wrap", true)},
   335				"children": inlineChildren,
   336			}},
   337		})
   338	}
   339	
   340	func (r *runtime) masterDetailTableRecipe(call goja.FunctionCall) goja.Value {
   341		options := firstObject(call.Arguments)
   342		rows := anySlice(options["rows"])
   343		selectedKey := options["selectedKey"]
   344		tableProps := map[string]any{
   345			"rows":         rows,
   346			"getRowKey":    valueOrDefault(options["getRowKey"], "id"),
   347			"columns":      anySlice(options["columns"]),
   348			"selectedKey":  selectedKey,
   349			"emptyMessage": valueOrDefault(options["emptyMessage"], "No rows"),
   350		}
   351		if act, ok := normalizeActionSpec(options["onRowSelect"], nil, nil); ok {
   352			tableProps["onRowSelect"] = act
   353		}
   354		tablePanel := map[string]any{
   355			"kind":     "component",
   356			"type":     "Panel",
   357			"props":    map[string]any{"title": stringFromMap(options, "title", "Items")},
   358			"children": []any{map[string]any{"kind": "component", "type": "DataTable", "props": tableProps}},
   359		}
   360		detailNode := r.detailNode(options, selectedRow(rows, selectedKey, tableProps["getRowKey"]))
   361		return r.vm.ToValue(map[string]any{
   362			"kind":     "component",
   363			"type":     "DashboardGrid",
   364			"props":    map[string]any{"recipe": stringFromMap(options, "recipe", "two-up")},
   365			"children": []any{tablePanel, detailNode},
   366		})
   367	}
   368	
   369	func (r *runtime) detailNode(options map[string]any, row any) any {
   370		if detailFn, ok := goja.AssertFunction(r.vm.ToValue(options["detail"])); ok {
   371			value, err := detailFn(goja.Undefined(), r.vm.ToValue(row))
   372			if err != nil {
   373				panic(err)
   374			}
   375			if exported, ok := value.Export().(map[string]any); ok && isWidgetNodeExport(exported) {
   376				return exported
   377			}
   378		}
   379		if fallback, ok := options["detail"].(map[string]any); ok && isWidgetNodeExport(fallback) {
   380			return fallback
   381		}
   382		return map[string]any{
   383			"kind":     "component",
   384			"type":     "Panel",
   385			"props":    map[string]any{"title": stringFromMap(options, "detailTitle", "Details")},
   386			"children": []any{map[string]any{"kind": "component", "type": "Caption", "props": map[string]any{"tone": "muted"}, "children": []any{map[string]any{"kind": "text", "text": "Select a row to inspect it."}}}},
   387		}
   388	}
   389	
   390	func (r *runtime) buildComponent(componentType string, props map[string]any, childValues []goja.Value) map[string]any {
   391		out := map[string]any{"kind": "component", "type": componentType}
   392		if len(props) > 0 {
   393			out["props"] = props
   394		}
   395		children := r.exportChildren(childValues)
   396		if len(children) > 0 {
   397			out["children"] = children
   398		}
   399		return out
   400	}
   401	
   402	func (r *runtime) exportChildren(values []goja.Value) []any {
   403		out := []any{}
   404		for _, value := range values {
   405			out = append(out, r.exportChild(value)...)
   406		}
   407		return out
   408	}
   409	
   410	func (r *runtime) exportChild(value goja.Value) []any {
   411		if value == nil || goja.IsUndefined(value) || goja.IsNull(value) {
   412			return nil
   413		}
   414		if isArrayLike(value) {
   415			obj := value.ToObject(r.vm)
   416			length := int(obj.Get("length").ToInteger())
   417			out := []any{}
   418			for i := 0; i < length; i++ {
   419				out = append(out, r.exportChild(obj.Get(fmt.Sprintf("%d", i)))...)
   420			}
   421			return out
   422		}
   423		if isWidgetNode(r.vm, value) {
   424			return []any{value.Export()}
   425		}
   426		return []any{map[string]any{"kind": "text", "text": stringifyValue(value)}}
   427	}
   428	
   429	func (r *runtime) exportRenderable(value goja.Value) any {
   430		children := r.exportChild(value)
   431		if len(children) == 0 {
   432			return nil
   433		}
   434		if len(children) == 1 {
   435			return children[0]
   436		}
   437		return children
   438	}
   439	
   440	func propsAndChildStart(args []goja.Value, index int) (map[string]any, int) {
   441		if len(args) > index && isPlainObject(args[index]) && !looksLikeWidgetNodeExport(args[index]) {
   442			return exportObject(args[index]), index + 1
   443		}
   444		return map[string]any{}, index
   445	}
   446	
   447	func isPlainObject(value goja.Value) bool {
   448		if value == nil || goja.IsUndefined(value) || goja.IsNull(value) {
   449			return false
   450		}
   451		exported := value.Export()
   452		_, ok := exported.(map[string]any)
   453		return ok
   454	}
   455	
   456	func isWidgetNode(vm *goja.Runtime, value goja.Value) bool {
   457		if value == nil || goja.IsUndefined(value) || goja.IsNull(value) {
   458			return false
   459		}
   460		obj := value.ToObject(vm)
   461		kind := obj.Get("kind")
   462		if kind == nil || goja.IsUndefined(kind) || goja.IsNull(kind) {
   463			return false
   464		}
   465		s := kind.String()
   466		return s == "text" || s == "element" || s == "component"
   467	}
   468	
   469	func looksLikeWidgetNodeExport(value goja.Value) bool {
   470		exported, ok := value.Export().(map[string]any)
   471		if !ok {
   472			return false
   473		}
   474		kind, _ := exported["kind"].(string)
   475		return kind == "text" || kind == "element" || kind == "component"
   476	}
   477	
   478	func isArrayLike(value goja.Value) bool {
   479		if value == nil || goja.IsUndefined(value) || goja.IsNull(value) {
   480			return false
   481		}
   482		t := value.ExportType()
   483		if t == nil {
   484			return false
   485		}
   486		k := t.Kind()
   487		return k == reflect.Slice || k == reflect.Array
   488	}
   489	
   490	func exportObject(value goja.Value) map[string]any {
   491		if value == nil || goja.IsUndefined(value) || goja.IsNull(value) {
   492			return map[string]any{}
   493		}
   494		if exported, ok := value.Export().(map[string]any); ok {
   495			return exported
   496		}
   497		return map[string]any{}
   498	}
   499	
   500	func exportOptions(options []goja.Value) map[string]any {
   501		if len(options) == 0 {
   502			return map[string]any{}
   503		}
   504		return exportObject(options[0])
   505	}
   506	
   507	func mergeOptions(out map[string]any, options map[string]any) {
   508		for k, v := range options {
   509			out[k] = v
   510		}
   511	}
   512	
   513	func firstObject(args []goja.Value) map[string]any {
   514		if len(args) == 0 {
   515			return map[string]any{}
   516		}
   517		return exportObject(args[0])
   518	}
   519	
   520	func stringFromMap(m map[string]any, key, fallback string) string {
   521		if value, ok := m[key]; ok {
   522			if s, ok := value.(string); ok && strings.TrimSpace(s) != "" {
   523				return s
   524			}
   525		}
   526		return fallback
   527	}
   528	
   529	func boolFromMap(m map[string]any, key string, fallback bool) bool {
   530		if value, ok := m[key]; ok {
   531			if b, ok := value.(bool); ok {
   532				return b
   533			}
   534		}
   535		return fallback
   536	}
   537	
   538	func anySlice(value any) []any {
   539		if value == nil {
   540			return []any{}
   541		}
   542		if out, ok := value.([]any); ok {
   543			return out
   544		}
   545		rv := reflect.ValueOf(value)
   546		if rv.Kind() != reflect.Slice && rv.Kind() != reflect.Array {
   547			return []any{}
   548		}
   549		out := make([]any, 0, rv.Len())
   550		for i := 0; i < rv.Len(); i++ {
   551			out = append(out, rv.Index(i).Interface())
   552		}
   553		return out
   554	}
   555	
   556	func valueOrDefault(value any, fallback any) any {
   557		if value == nil {
   558			return fallback
   559		}
   560		return value
   561	}
   562	
   563	func isWidgetNodeExport(exported map[string]any) bool {
   564		kind, _ := exported["kind"].(string)
   565		return kind == "text" || kind == "element" || kind == "component"
   566	}
   567	
   568	func metricsRecipeName(count int) string {
   569		if count <= 2 {
   570			return "two-up"
   571		}
   572		if count == 3 {
   573			return "three-up"
   574		}
   575		return "four-up"
   576	}
   577	
   578	func normalizeActionSpec(action any, name any, payload any) (map[string]any, bool) {
   579		if spec, ok := action.(map[string]any); ok {
   580			if kind, _ := spec["kind"].(string); kind != "" {
   581				return spec, true
   582			}
   583		}
   584		if actionName, ok := action.(string); ok && strings.TrimSpace(actionName) != "" {
   585			out := map[string]any{"kind": "server", "name": actionName}
   586			if payload != nil {
   587				out["payload"] = payload
   588			}
   589			return out, true
   590		}
   591		if actionName, ok := name.(string); ok && strings.TrimSpace(actionName) != "" {
   592			out := map[string]any{"kind": "server", "name": actionName}
   593			if payload != nil {
   594				out["payload"] = payload
   595			}
   596			return out, true
   597		}
   598		return nil, false
   599	}
   600	
   601	func selectedRow(rows []any, selectedKey any, keySpec any) any {
   602		if selectedKey == nil {
   603			return nil
   604		}
   605		wanted := stringifyRowKey(selectedKey)
   606		for _, raw := range rows {
   607			row, ok := raw.(map[string]any)
   608			if !ok {
   609				continue
   610			}
   611			if rowKeyForSpec(row, keySpec) == wanted {
   612				return row
   613			}
   614		}
   615		return nil
   616	}
   617	
   618	func rowKeyForSpec(row map[string]any, spec any) string {
   619		switch typed := spec.(type) {
   620		case string:
```

## Widget DSL tests

File: `pkg/widgetdsl/module_test.go` lines 1-260

```text
     1	package widgetdsl
     2	
     3	import (
     4		"context"
     5		"encoding/json"
     6		"testing"
     7	
     8		"github.com/dop251/goja"
     9		"github.com/dop251/goja_nodejs/require"
    10		"github.com/go-go-golems/go-go-goja/modules"
    11		"github.com/go-go-golems/go-go-goja/pkg/engine"
    12	)
    13	
    14	func TestRequireWidgetDSLExportsHelpers(t *testing.T) {
    15		vm := goja.New()
    16		reg := require.NewRegistry()
    17		modules.DefaultRegistry.Enable(reg)
    18		reg.Enable(vm)
    19	
    20		value, err := vm.RunString(`
    21			const rag = require("widget.dsl");
    22			({
    23				text: typeof rag.text,
    24				component: typeof rag.component,
    25				element: typeof rag.element,
    26				panel: typeof rag.panel,
    27				dataTable: typeof rag.dataTable,
    28				cellField: typeof rag.cell.field,
    29				cellStatus: typeof rag.cell.status,
    30			});
    31		`)
    32		if err != nil {
    33			t.Fatalf("require widget.dsl: %v", err)
    34		}
    35		got := value.Export().(map[string]any)
    36		for _, name := range []string{"text", "component", "element", "panel", "dataTable", "cellField", "cellStatus"} {
    37			if got[name] != "function" {
    38				t.Fatalf("%s export = %#v, want function (all: %#v)", name, got[name], got)
    39			}
    40		}
    41	}
    42	
    43	func TestRagAliasRegistration(t *testing.T) {
    44		vm := goja.New()
    45		reg := require.NewRegistry()
    46		Register(reg)
    47		reg.Enable(vm)
    48	
    49		value, err := vm.RunString(`
    50			const rag = require("rag.dsl");
    51			typeof rag.panel;
    52		`)
    53		if err != nil {
    54			t.Fatalf("require rag.dsl: %v", err)
    55		}
    56		if got := value.String(); got != "function" {
    57			t.Fatalf("typeof rag.panel = %s, want function", got)
    58		}
    59	}
    60	
    61	func TestBuildsNestedWidgetIR(t *testing.T) {
    62		vm := goja.New()
    63		reg := require.NewRegistry()
    64		Register(reg)
    65		reg.Enable(vm)
    66	
    67		value, err := vm.RunString(`
    68			const rag = require("widget.dsl");
    69			rag.panel({ title: "Demo", density: "condensed" },
    70				rag.stack({ gap: "sm" }, [
    71					rag.caption({ tone: "success" }, "Ready"),
    72					rag.button({ variant: "primary" }, "Run"),
    73				])
    74			);
    75		`)
    76		if err != nil {
    77			t.Fatalf("build widget IR: %v", err)
    78		}
    79		got := value.Export().(map[string]any)
    80		assertString(t, got, "kind", "component")
    81		assertString(t, got, "type", "Panel")
    82		props := got["props"].(map[string]any)
    83		if props["title"] != "Demo" || props["density"] != "condensed" {
    84			t.Fatalf("props = %#v", props)
    85		}
    86		children := got["children"].([]any)
    87		if len(children) != 1 {
    88			t.Fatalf("children len = %d, want 1: %#v", len(children), children)
    89		}
    90		stack := children[0].(map[string]any)
    91		assertString(t, stack, "type", "Stack")
    92		stackChildren := stack["children"].([]any)
    93		if len(stackChildren) != 2 {
    94			t.Fatalf("stack children len = %d, want 2: %#v", len(stackChildren), stackChildren)
    95		}
    96	}
    97	
    98	func TestEngineRegistrarRegistersWidgetAndRagAliases(t *testing.T) {
    99		factory, err := engine.NewRuntimeFactoryBuilder().WithModules(NewRegistrar()).Build()
   100		if err != nil {
   101			t.Fatalf("build runtime factory: %v", err)
   102		}
   103		rt, err := factory.NewRuntime()
   104		if err != nil {
   105			t.Fatalf("create runtime: %v", err)
   106		}
   107		defer func() { _ = rt.Close(context.Background()) }()
   108	
   109		value, err := rt.VM.RunString(`
   110			const widget = require("widget.dsl");
   111			const rag = require("rag.dsl");
   112			({ widgetPanel: typeof widget.panel, ragPanel: typeof rag.panel });
   113		`)
   114		if err != nil {
   115			t.Fatalf("require modules through engine registrar: %v", err)
   116		}
   117		got := value.Export().(map[string]any)
   118		if got["widgetPanel"] != "function" || got["ragPanel"] != "function" {
   119			t.Fatalf("registrar exports = %#v, want both aliases to expose panel()", got)
   120		}
   121	}
   122	
   123	func TestDataTableAndCellHelpersAreJSONSerializable(t *testing.T) {
   124		vm := goja.New()
   125		reg := require.NewRegistry()
   126		Register(reg)
   127		reg.Enable(vm)
   128	
   129		value, err := vm.RunString(`
   130			const rag = require("widget.dsl");
   131			const table = rag.dataTable({
   132				rows: [{ id: "a", title: "Alpha", status: "done", score: 0.42 }],
   133				getRowKey: { field: "id" },
   134				columns: [
   135					{ id: "title", header: "Title", cell: rag.cell.field("title") },
   136					{ id: "score", header: "Score", align: "end", cell: rag.cell.number("score", { format: "fixed", digits: 2 }) },
   137					{ id: "status", header: "Status", cell: rag.cell.status("status", { icon: true }) },
   138				]
   139			});
   140			JSON.stringify(table);
   141		`)
   142		if err != nil {
   143			t.Fatalf("build table IR: %v", err)
   144		}
   145		var decoded map[string]any
   146		if err := json.Unmarshal([]byte(value.String()), &decoded); err != nil {
   147			t.Fatalf("IR is not JSON: %v\n%s", err, value.String())
   148		}
   149		assertString(t, decoded, "kind", "component")
   150		assertString(t, decoded, "type", "DataTable")
   151	}
   152	
   153	func TestSemanticRecipesAndActionsAreJSONSerializable(t *testing.T) {
   154		vm := goja.New()
   155		reg := require.NewRegistry()
   156		Register(reg)
   157		reg.Enable(vm)
   158	
   159		value, err := vm.RunString(`
   160			const rag = require("widget.dsl");
   161			const rows = [{ id: 1, name: "Alpha", status: "running" }];
   162			const page = rag.page({
   163				id: "actions",
   164				title: "Actions",
   165				meta: { shell: "app", maxWidth: "wide" },
   166				sections: [
   167					rag.recipes.metrics({ items: [
   168						{ label: "Total", value: rows.length, status: "ready" },
   169						{ label: "Running", value: 1, status: "running" }
   170					]}),
   171					rag.recipes.actionToolbar({ title: "Controls", actions: [
   172						{ label: "Add", action: "add-query", variant: "primary", payload: { owner: "test" } },
   173						{ label: "Reset", action: rag.action.server("reset-demo") }
   174					]}),
   175					rag.recipes.masterDetailTable({
   176						title: "Rows",
   177						rows,
   178						columns: [{ id: "name", header: "Name", cell: rag.cell.field("name") }],
   179						selectedKey: 1,
   180						onRowSelect: "select-query",
   181						detail: row => rag.panel({ title: "Selected" }, row.name)
   182					})
   183				]
   184			});
   185			JSON.stringify(page);
   186		`)
   187		if err != nil {
   188			t.Fatalf("build recipe page: %v", err)
   189		}
   190		var decoded map[string]any
   191		if err := json.Unmarshal([]byte(value.String()), &decoded); err != nil {
   192			t.Fatalf("recipe page is not JSON: %v\n%s", err, value.String())
   193		}
   194		assertString(t, decoded, "id", "actions")
   195		root := decoded["root"].(map[string]any)
   196		assertString(t, root, "type", "Stack")
   197		children := root["children"].([]any)
   198		if len(children) != 3 {
   199			t.Fatalf("recipe page children len = %d, want 3: %#v", len(children), children)
   200		}
   201		toolbar := children[1].(map[string]any)
   202		assertString(t, toolbar, "type", "Panel")
   203	}
   204	
   205	func TestMasterDetailTableUsesConfiguredRowKeyForDetails(t *testing.T) {
   206		vm := goja.New()
   207		reg := require.NewRegistry()
   208		Register(reg)
   209		reg.Enable(vm)
   210	
   211		value, err := vm.RunString(`
   212			const rag = require("widget.dsl");
   213			const table = rag.recipes.masterDetailTable({
   214				rows: [{ id: 1, slug: "alpha", name: "Alpha" }],
   215				getRowKey: "slug",
   216				columns: [{ id: "name", header: "Name", cell: rag.cell.field("name") }],
   217				selectedKey: "alpha",
   218				detail: row => rag.panel({ title: "Selected" }, row.name)
   219			});
   220			JSON.stringify(table);
   221		`)
   222		if err != nil {
   223			t.Fatalf("build master-detail recipe: %v", err)
   224		}
   225		var decoded map[string]any
   226		if err := json.Unmarshal([]byte(value.String()), &decoded); err != nil {
   227			t.Fatalf("master-detail table is not JSON: %v\n%s", err, value.String())
   228		}
   229		children := decoded["children"].([]any)
   230		detail := children[1].(map[string]any)
   231		detailChildren := detail["children"].([]any)
   232		text := detailChildren[0].(map[string]any)
   233		assertString(t, text, "text", "Alpha")
   234	}
   235	
   236	func assertString(t *testing.T, m map[string]any, key, want string) {
   237		t.Helper()
   238		if got, _ := m[key].(string); got != want {
   239			t.Fatalf("%s = %#v, want %q (map=%#v)", key, m[key], want, m)
   240		}
   241	}
```

## Package public exports

File: `packages/rag-evaluation-site/src/index.ts` lines 1-180

```text
     1	import './styles.css';
     2	
     3	export * from './widgets';
     4	export * from './hooks/useWidgetPage';
     5	export * from './components';
     6	export * from './context';
```

## Component molecule exports

File: `packages/rag-evaluation-site/src/components/molecules/index.ts` lines 1-200

```text
     1	export * from './MetadataGrid';
     2	export * from './DataTable';
     3	export * from './AppNav';
     4	export * from './ContextLegend';
     5	export * from './ContextBudgetBar';
     6	export * from './ContextStripDiagram';
     7	export * from './ContextStackDiagram';
     8	export * from './ContextTreemap';
     9	export * from './TranscriptMessageCard';
    10	export * from './TranscriptSessionHeader';
    11	export * from './AnnotationNoteCard';
    12	export * from './AnchoredCommentCard';
    13	export * from './CourseStepNav';
    14	export * from './KeyValueStrip';
    15	export * from './CheckList';
    16	export * from './StepList';
    17	export * from './PersonSummary';
    18	export * from './FigureBlock';
    19	export * from './KeyPointList';
    20	export * from './SidebarNav';
    21	export * from './MarkdownArticle';
    22	export * from './DocumentListPanel';
    23	export * from './DocumentPreviewToolbar';
```

## Component organism exports

File: `packages/rag-evaluation-site/src/components/organisms/index.ts` lines 1-200

```text
     1	export * from './ContextDiagramPanel';
     2	export * from './TranscriptReaderPanel';
     3	export * from './TranscriptWorkspacePanel';
     4	export * from './AnnotationRailPanel';
     5	export * from './AnchoredCommentRail';
     6	export * from './CourseLessonPanel';
     7	export * from './CourseSlidePanel';
     8	export * from './CourseStudioShell';
     9	export * from './HandoutDocumentShell';
```

## Context DTOs

File: `packages/rag-evaluation-site/src/context/types.ts` lines 1-260

```text
     1	export type ContextPartKind =
     2	  | 'system'
     3	  | 'instruction'
     4	  | 'context'
     5	  | 'conversation'
     6	  | 'summary'
     7	  | 'retrieval'
     8	  | 'tool'
     9	  | 'result'
    10	  | 'generated'
    11	  | 'annotation'
    12	  | 'course'
    13	  | 'active'
    14	  | 'evicted'
    15	  | 'empty'
    16	  | 'other';
    17	
    18	export type TranscriptRole =
    19	  | 'system'
    20	  | 'developer'
    21	  | 'user'
    22	  | 'assistant'
    23	  | 'tool'
    24	  | 'other';
    25	
    26	export type ContextJsonPrimitive = string | number | boolean | null;
    27	export type ContextJsonValue = ContextJsonPrimitive | ContextJsonValue[] | { [key: string]: ContextJsonValue };
    28	export type ContextJsonRecord = Record<string, ContextJsonValue>;
    29	
    30	export interface ContextWindowPart {
    31	  id: string;
    32	  label: string;
    33	  kind: ContextPartKind;
    34	  tokens: number;
    35	  note?: string;
    36	  sourceId?: string;
    37	  startToken?: number;
    38	  endToken?: number;
    39	  metadata?: ContextJsonRecord;
    40	}
    41	
    42	export interface ContextWindowSnapshot {
    43	  id: string;
    44	  title: string;
    45	  subtitle?: string;
    46	  limit: number;
    47	  parts: ContextWindowPart[];
    48	  selectedPartId?: string;
    49	  metadata?: ContextJsonRecord;
    50	}
    51	
    52	export type ContextDiagramView = 'strip' | 'stack' | 'budget' | 'treemap';
    53	export type ContextDiagramStyle = 'pattern' | 'tone' | 'outline';
    54	
    55	export interface ContextDiagramSegment {
    56	  id: string;
    57	  label: string;
    58	  kind: ContextPartKind;
    59	  tokens: number;
    60	  note?: string;
    61	  metadata?: ContextJsonRecord;
    62	}
    63	
    64	export interface TranscriptAnnotation {
    65	  id: string;
    66	  targetMessageId: string;
    67	  kind: ContextPartKind;
    68	  label: string;
    69	  text: string;
    70	  confidence?: number;
    71	  metadata?: ContextJsonRecord;
    72	}
    73	
    74	export interface TranscriptMessage {
    75	  id: string;
    76	  role: TranscriptRole;
    77	  text: string;
    78	  tokens?: number;
    79	  name?: string;
    80	  timestamp?: string;
    81	  annotationIds?: string[];
    82	  metadata?: ContextJsonRecord;
    83	}
    84	
    85	export interface TranscriptFixture {
    86	  id: string;
    87	  title: string;
    88	  subtitle?: string;
    89	  messages: TranscriptMessage[];
    90	  annotations: TranscriptAnnotation[];
    91	  selectedAnnotationId?: string;
    92	}
    93	
    94	export interface ContextCourseInstructor {
    95	  name: string;
    96	  role?: string;
    97	  bio?: string;
    98	}
    99	
   100	export interface ContextCourseAgendaItem {
   101	  id: string;
   102	  number: string;
   103	  title: string;
   104	  description: string;
   105	  duration?: string;
   106	}
   107	
   108	export interface ContextCourse {
   109	  id: string;
   110	  kicker?: string;
   111	  title: string;
   112	  tagline: string;
   113	  when?: string;
   114	  where?: string;
   115	  format?: string;
   116	  price?: string;
   117	  instructor?: ContextCourseInstructor;
   118	  blurb?: string;
   119	  outcomes: string[];
   120	  agenda: ContextCourseAgendaItem[];
   121	}
   122	
   123	export interface ContextSlide {
   124	  id: string;
   125	  number: string;
   126	  kicker?: string;
   127	  title: string;
   128	  view: ContextDiagramView;
   129	  snapshotId: string;
   130	  notes: string[];
   131	}
   132	
   133	export interface ContextHandoutDocument {
   134	  id: string;
   135	  title: string;
   136	  file: string;
   137	  format: string;
   138	  size?: string;
   139	  description: string;
   140	  body: string;
   141	}
   142	
   143	export type AnchoredCommentStatus = 'open' | 'resolved';
   144	
   145	export interface AnchoredComment {
   146	  id: string;
   147	  anchorX: number;
   148	  anchorY: number;
   149	  author: string;
   150	  text: string;
   151	  time?: string;
   152	  status?: AnchoredCommentStatus;
   153	  metadata?: ContextJsonRecord;
   154	}
   155	
   156	export interface ContextHandoutBundle {
   157	  intro: string;
   158	  docs: ContextHandoutDocument[];
   159	}
```

## Context fixtures

File: `packages/rag-evaluation-site/src/context/fixtures.ts` lines 1-340

```text
     1	import type {
     2	  ContextCourse,
     3	  AnchoredComment,
     4	  ContextHandoutBundle,
     5	  ContextSlide,
     6	  ContextWindowSnapshot,
     7	  TranscriptFixture,
     8	} from './types';
     9	
    10	export const CONTEXT_WINDOW_LIMIT = 200_000;
    11	
    12	export const contextWindowSnapshots: ContextWindowSnapshot[] = [
    13	  {
    14	    id: 't03',
    15	    title: 'Turn 3 — warming up',
    16	    subtitle: 'Agent has read the repo map and the failing test.',
    17	    limit: CONTEXT_WINDOW_LIMIT,
    18	    parts: [
    19	      { id: 't03-system', label: 'system + tools', kind: 'system', tokens: 7200, note: 'instructions + tool schemas' },
    20	      { id: 't03-project', label: 'project context', kind: 'context', tokens: 4100, note: 'CLAUDE.md, repo map' },
    21	      { id: 't03-conversation', label: 'conversation', kind: 'context', tokens: 5200, note: '3 turns so far' },
    22	      { id: 't03-file-reads', label: 'file reads', kind: 'result', tokens: 9800, note: 'test + 2 source files' },
    23	      { id: 't03-task', label: 'current task', kind: 'active', tokens: 1400, note: 'fix failing test' },
    24	      { id: 't03-empty', label: 'free space', kind: 'empty', tokens: 162300 },
    25	    ],
    26	  },
    27	  {
    28	    id: 't14',
    29	    title: 'Turn 14 — deep in the bug',
    30	    subtitle: 'Many tool results accumulated; scratchpad reasoning growing.',
    31	    limit: CONTEXT_WINDOW_LIMIT,
    32	    selectedPartId: 't14-file-reads',
    33	    parts: [
    34	      { id: 't14-system', label: 'system + tools', kind: 'system', tokens: 7200, note: 'instructions + tool schemas' },
    35	      { id: 't14-project', label: 'project context', kind: 'context', tokens: 4100, note: 'CLAUDE.md, repo map' },
    36	      { id: 't14-summary', label: 'summary', kind: 'summary', tokens: 3400, note: 'turns 1–6 compressed' },
    37	      { id: 't14-conversation', label: 'conversation', kind: 'context', tokens: 21800, note: 'turns 7–14' },
    38	      { id: 't14-file-reads', label: 'file reads', kind: 'result', tokens: 38600, note: '6 files + grep output' },
    39	      { id: 't14-test-output', label: 'test output', kind: 'result', tokens: 12400, note: 'stack traces' },
    40	      { id: 't14-scratchpad', label: 'scratchpad', kind: 'generated', tokens: 9200, note: 'hypotheses, plan' },
    41	      { id: 't14-task', label: 'current task', kind: 'active', tokens: 1900, note: 'patch the parser' },
    42	      { id: 't14-empty', label: 'free space', kind: 'empty', tokens: 91700 },
    43	    ],
    44	  },
    45	  {
    46	    id: 't31',
    47	    title: 'Turn 31 — at the limit',
    48	    subtitle: 'Window full. Old turns evicted; results re-summarized to reclaim space.',
    49	    limit: CONTEXT_WINDOW_LIMIT,
    50	    parts: [
    51	      { id: 't31-system', label: 'system + tools', kind: 'system', tokens: 7200, note: 'instructions + tool schemas' },
    52	      { id: 't31-project', label: 'project context', kind: 'context', tokens: 4100, note: 'CLAUDE.md, repo map' },
    53	      { id: 't31-evicted', label: 'evicted', kind: 'evicted', tokens: 28400, note: 'turns 1–18 dropped' },
    54	      { id: 't31-summary', label: 'summary', kind: 'summary', tokens: 8600, note: 'rolling summary' },
    55	      { id: 't31-conversation', label: 'conversation', kind: 'context', tokens: 41200, note: 'turns 19–31' },
    56	      { id: 't31-file-reads', label: 'file reads', kind: 'result', tokens: 64800, note: '12 files in working set' },
    57	      { id: 't31-scratchpad', label: 'scratchpad', kind: 'generated', tokens: 22600, note: 'long reasoning trace' },
    58	      { id: 't31-task', label: 'current task', kind: 'active', tokens: 2100, note: 'verify the fix' },
    59	      { id: 't31-empty', label: 'free space', kind: 'empty', tokens: 21000 },
    60	    ],
    61	  },
    62	  {
    63	    id: 'over',
    64	    title: 'Turn 31 — before reclaim (over budget)',
    65	    subtitle: 'What the naïve append-everything window would have looked like.',
    66	    limit: CONTEXT_WINDOW_LIMIT,
    67	    parts: [
    68	      { id: 'over-system', label: 'system + tools', kind: 'system', tokens: 7200 },
    69	      { id: 'over-project', label: 'project context', kind: 'context', tokens: 4100 },
    70	      { id: 'over-conversation', label: 'conversation (all)', kind: 'context', tokens: 88200 },
    71	      { id: 'over-file-reads', label: 'file reads (all)', kind: 'result', tokens: 96400 },
    72	      { id: 'over-scratchpad', label: 'scratchpad', kind: 'generated', tokens: 31600 },
    73	      { id: 'over-task', label: 'current task', kind: 'active', tokens: 2100 },
    74	    ],
    75	  },
    76	];
    77	
    78	export const transcriptFixture: TranscriptFixture = {
    79	  id: 'parser-session',
    80	  title: 'Coding-agent transcript — parser fix',
    81	  subtitle: 'Annotated transcript fixture from the context-viewer prototype.',
    82	  selectedAnnotationId: 'task-framing',
    83	  messages: [
    84	    {
    85	      id: 'm1',
    86	      role: 'user',
    87	      tokens: 320,
    88	      text: 'The test `parser.test.ts › handles nested arrays` is failing on main. Can you fix it?',
    89	    },
    90	    {
    91	      id: 'm2',
    92	      role: 'assistant',
    93	      tokens: 180,
    94	      text: "I'll start by reading the failing test and the parser it exercises.",
    95	      annotationIds: ['task-framing'],
    96	    },
    97	    {
    98	      id: 'm3',
    99	      role: 'tool',
   100	      name: 'read_file',
   101	      tokens: 2400,
   102	      text: 'parser.test.ts  (148 lines)\nsrc/parser.ts  (412 lines)',
   103	      annotationIds: ['tool-result-cost'],
   104	    },
   105	    {
   106	      id: 'm4',
   107	      role: 'assistant',
   108	      tokens: 540,
   109	      text: 'The test expects `parseArray` to recurse into nested brackets, but the current implementation only handles one level. Let me run the test to confirm the failure mode.',
   110	    },
   111	    {
   112	      id: 'm5',
   113	      role: 'tool',
   114	      name: 'run_test',
   115	      tokens: 1900,
   116	      text: 'FAIL  parser.test.ts\n  ● handles nested arrays\n    Expected: [[1,2],[3]]\n    Received: ["[1","2]","[3]"]\n    at parseArray (src/parser.ts:218)',
   117	      annotationIds: ['stack-trace-noise'],
   118	    },
   119	    {
   120	      id: 'm6',
   121	      role: 'assistant',
   122	      tokens: 880,
   123	      text: "Confirmed — `parseArray` splits on commas without tracking bracket depth. I'll rewrite it to maintain a depth counter and recurse.",
   124	      annotationIds: ['scratchpad-reasoning'],
   125	    },
   126	    {
   127	      id: 'm7',
   128	      role: 'tool',
   129	      name: 'edit_file',
   130	      tokens: 1200,
   131	      text: 'src/parser.ts  — rewrote parseArray (lines 198–240)',
   132	    },
   133	    {
   134	      id: 'm8',
   135	      role: 'tool',
   136	      name: 'run_test',
   137	      tokens: 760,
   138	      text: 'PASS  parser.test.ts  (12 tests)',
   139	    },
   140	    {
   141	      id: 'm9',
   142	      role: 'assistant',
   143	      tokens: 240,
   144	      text: "All 12 tests pass. The fix tracks bracket depth and recurses on nested arrays. Want me to add a regression test for deeply-nested input?",
   145	      annotationIds: ['window-rebuilt'],
   146	    },
   147	    { id: 'm10', role: 'user', tokens: 60, text: 'Yes please.' },
   148	  ],
   149	  annotations: [
   150	    {
   151	      id: 'task-framing',
   152	      targetMessageId: 'm2',
   153	      kind: 'context',
   154	      label: 'Task framing',
   155	      text: 'The current task is small but high-value — it stays pinned at the bottom of every window for the rest of the session.',
   156	    },
   157	    {
   158	      id: 'tool-result-cost',
   159	      targetMessageId: 'm3',
   160	      kind: 'result',
   161	      label: 'Tool result cost',
   162	      text: 'Two file reads are cheap now, but reads compound — by turn 14 the working set is 38k.',
   163	    },
   164	    {
   165	      id: 'stack-trace-noise',
   166	      targetMessageId: 'm5',
   167	      kind: 'result',
   168	      label: 'Stack traces are noisy',
   169	      text: 'Test output carries stack traces. Keep the assertion and first frame; the rest is a summarization candidate.',
   170	    },
   171	    {
   172	      id: 'scratchpad-reasoning',
   173	      targetMessageId: 'm6',
   174	      kind: 'generated',
   175	      label: 'Scratchpad reasoning',
   176	      text: 'Reasoning tokens are generated, not retrieved. Useful in-turn, but rarely worth carrying forward verbatim.',
   177	    },
   178	    {
   179	      id: 'window-rebuilt',
   180	      targetMessageId: 'm9',
   181	      kind: 'active',
   182	      label: 'Window rebuilt here',
   183	      text: "Before this reply, the window was rebuilt: the failing run_test output was summarized to one line now that it's resolved.",
   184	    },
   185	  ],
   186	};
   187	
   188	export const contextCourseFixture: ContextCourse = {
   189	  id: 'context-window-engineering',
   190	  kicker: 'LIVE WORKSHOP · SESSION 04',
   191	  title: 'Context Window Engineering',
   192	  tagline: 'What fits, what falls out, and why. A hands-on session on designing the prompt that the model actually sees.',
   193	  when: 'Thursday, June 18, 2026 · 6:30 – 8:30 PM',
   194	  where: 'South Park Commons · San Francisco',
   195	  format: 'In person · 24 seats · laptops required',
   196	  price: 'Free for members',
   197	  instructor: {
   198	    name: 'M. Calder',
   199	    role: 'Applied ML, Developer Tools',
   200	    bio: 'Builds agent runtimes; has spent more nights staring at token budgets than is healthy.',
   201	  },
   202	  blurb: "Every model call is a window of fixed size. The difference between an agent that finishes the job and one that loops forever is usually not the model — it's what you packed into that window.",
   203	  outcomes: [
   204	    'Read any context window as a budget of competing claims on space',
   205	    'Diagram a window four ways — strip, stack, budget, and treemap',
   206	    'Decide what to summarize, what to evict, and what to pin',
   207	    'Instrument a coding agent and watch its window churn turn by turn',
   208	  ],
   209	  agenda: [
   210	    { id: 'agenda-01', number: '01', title: 'The window as a budget', description: 'Fixed size, competing tenants. Why everything is a trade.', duration: '20 min' },
   211	    { id: 'agenda-02', number: '02', title: 'Anatomy of a call', description: 'System, context, results, scratchpad, the current task.', duration: '25 min' },
   212	    { id: 'agenda-03', number: '03', title: 'Growth & truncation', description: 'What falls out when the window fills, and how to choose.', duration: '20 min' },
   213	    { id: 'agenda-04', number: '04', title: 'The agent loop', description: 'Rebuild, don\'t append. Perceive → think → act → observe.', duration: '25 min' },
   214	    { id: 'agenda-05', number: '05', title: 'Reclaiming space', description: 'Summarize, evict, retrieve, pin. Live on a real session.', duration: '25 min' },
   215	    { id: 'agenda-06', number: '06', title: 'Workshop', description: 'Instrument your own agent and annotate its window.', duration: '30 min' },
   216	  ],
   217	};
   218	
   219	export const contextSlides: ContextSlide[] = [
   220	  {
   221	    id: 'slide-01',
   222	    number: '01',
   223	    kicker: 'MODULE 01',
   224	    title: 'The window is a fixed budget',
   225	    view: 'budget',
   226	    snapshotId: 't14',
   227	    notes: [
   228	      'Every model call gets a window of fixed size.',
   229	      'Instructions, history, results, reasoning and the task all compete for the same space.',
   230	      "If it doesn't fit, the model can't see it. Headroom is the whole game.",
   231	    ],
   232	  },
   233	  {
   234	    id: 'slide-02',
   235	    number: '02',
   236	    kicker: 'MODULE 02',
   237	    title: 'Anatomy of a single call',
   238	    view: 'stack',
   239	    snapshotId: 't14',
   240	    notes: [
   241	      'A call is a layered document: durable layers on top, volatile ones below.',
   242	      'System and project context are stable. Results and scratchpad churn every turn.',
   243	      'The current task sits at the bottom and is never evicted.',
   244	    ],
   245	  },
   246	  {
   247	    id: 'slide-03',
   248	    number: '03',
   249	    kicker: 'MODULE 03',
   250	    title: 'Composition at a glance',
   251	    view: 'strip',
   252	    snapshotId: 't14',
   253	    notes: [
   254	      'Laid flat, the window reads left to right as a strip of segments.',
   255	      'Separators mark where one tenant ends and the next begins.',
   256	      'This is the fastest way to sanity-check what you packed.',
   257	    ],
   258	  },
   259	  {
   260	    id: 'slide-04',
   261	    number: '04',
   262	    kicker: 'MODULE 04',
   263	    title: 'Where the tokens actually go',
   264	    view: 'treemap',
   265	    snapshotId: 't31',
   266	    notes: [
   267	      'Area equals tokens. The biggest box is usually not the one you think.',
   268	      'Tool results and file reads dominate long sessions — not the conversation.',
   269	      'Treemaps make the expensive tenants impossible to miss.',
   270	    ],
   271	  },
   272	  {
   273	    id: 'slide-05',
   274	    number: '05',
   275	    kicker: 'MODULE 05',
   276	    title: 'Growth & truncation',
   277	    view: 'budget',
   278	    snapshotId: 't31',
   279	    notes: [
   280	      'As the session runs, new information is added every turn.',
   281	      'When the limit is reached, the oldest, lowest-value content is dropped.',
   282	      'Evicted turns are gone unless they were summarized first.',
   283	    ],
   284	  },
   285	  {
   286	    id: 'slide-06',
   287	    number: '06',
   288	    kicker: 'MODULE 06',
   289	    title: "Reclaim, don't append",
   290	    view: 'budget',
   291	    snapshotId: 'over',
   292	    notes: [
   293	      'Append-everything blows the budget — here the same session runs 26% over.',
   294	      'Summarize resolved results, evict stale turns, retrieve on demand.',
   295	      'Rebuild the window every turn around what matters now.',
   296	    ],
   297	  },
   298	];
   299	
   300	export const anchoredCommentFixtures: AnchoredComment[] = [
   301	  {
   302	    id: 'comment-file-reads',
   303	    anchorX: 0.3,
   304	    anchorY: 0.52,
   305	    author: 'you',
   306	    text: 'This file-reads block is 38k tokens — biggest single tenant. Candidate to summarize once the bug is found.',
   307	    time: '2m',
   308	    status: 'open',
   309	  },
   310	  {
   311	    id: 'comment-scratchpad',
   312	    anchorX: 0.74,
   313	    anchorY: 0.5,
   314	    author: 'Priya',
   315	    text: 'Why is the scratchpad carried forward? Drop it after the step completes.',
   316	    time: 'just now',
   317	    status: 'open',
   318	  },
   319	  {
   320	    id: 'comment-summary',
   321	    anchorX: 0.18,
   322	    anchorY: 0.3,
   323	    author: 'Manuel',
   324	    text: 'Resolved tool output can collapse into the rolling summary after the assertion is understood.',
   325	    time: 'resolved',
   326	    status: 'resolved',
   327	  },
   328	];
   329	
   330	export const contextHandoutFixture: ContextHandoutBundle = {
   331	  intro: 'Everything from tonight, to take home. Slides, the diagram source, and a one-page field guide.',
   332	  docs: [
   333	    {
   334	      id: 'fieldguide',
   335	      title: 'The Context Window — Field Guide',
   336	      file: 'context-window-field-guide.md',
   337	      format: 'Markdown',
   338	      size: '11 KB',
   339	      description: 'One-page reference: the six ideas, the four diagrams, and the reclaim checklist.',
   340	      body: `# The Context Window — Field Guide
```

## Package guidelines

File: `packages/rag-evaluation-site/GUIDELINES.md` lines 1-260

```text
     1	# `@go-go-golems/rag-evaluation-site` Design-System Guidelines
     2	
     3	This package is the canonical reusable UI layer for the RAG Evaluation System. Treat it as a strict design system, not as a scratchpad for one-off page CSS.
     4	
     5	Read this file before adding or changing components in `packages/rag-evaluation-site`.
     6	
     7	## Non-negotiable rules
     8	
     9	1. **Use the package layers.** Put reusable structure in `components/layout`, reusable data/content patterns in `components/molecules`, and domain panels with DTO-shaped props in `components/organisms`.
    10	2. **Use existing foundation typography.** Prefer `Text`, `Caption`, `CodeText`, `StatusText`, and the `--rag-font-role-*` tokens before writing font declarations.
    11	3. **Do not invent ad-hoc typography.** No random `font-size: 13px`, `font-weight: 600`, `letter-spacing: .16em`, or `line-height` unless it is being added deliberately to a token/foundation primitive.
    12	4. **Do not create CSS-in-JS systems.** No generic `Box`, no arbitrary style props, no components that accept `padding`, `gap`, `color`, `fontSize`, and `display` as an unbounded styling API.
    13	5. **Keep components API-free.** Package components must not import RTK Query hooks, app stores, router state, backend services, or web-only containers.
    14	6. **Storybook is required.** New public components need package-owned stories before they are considered part of the design system.
    15	7. **React first, Widget IR later.** Stabilize the React component API and visual states before adding semantic `WidgetRenderer`/Goja DSL support.
    16	8. **Use `data-rag-*` identity attributes.** These are required for visual-diff extraction, prototype parity checks, and future IR/runtime inspection.
    17	9. **Prototype JSX is reference material, not production code.** Copy concepts, anatomy, and token usage; do not copy global classes, inline styles, CDN assumptions, or app-local state.
    18	
    19	## Package layer ownership
    20	
    21	```text
    22	src/theme.css
    23	  -> foundation primitives
    24	  -> atoms
    25	  -> layout primitives
    26	  -> molecules
    27	  -> organisms
    28	  -> widgets / WidgetRenderer
    29	```
    30	
    31	### `src/theme.css`
    32	
    33	Owns raw tokens and compatibility bridge tokens:
    34	
    35	- `--rag-color-*`
    36	- `--mac-*`
    37	- `--font-body`, `--font-mono`
    38	- `--rag-font-role-body`
    39	- `--rag-font-role-compact`
    40	- `--rag-font-role-metadata`
    41	- `--rag-font-role-label`
    42	- `--rag-font-role-metric`
    43	- `--rag-font-role-code`
    44	
    45	If a visual choice repeats, add or adjust a token/foundation primitive instead of duplicating literals across CSS modules.
    46	
    47	### Foundation
    48	
    49	Foundation owns text and semantic display roles:
    50	
    51	- `Text` — body/compact/metadata/label/metric text with tone/weight/alignment.
    52	- `Caption` — compact metadata/caption copy.
    53	- `CodeText` — code-like IDs, paths, model names, compact technical values.
    54	- `StatusText` — status-to-tone mapping.
    55	- `Divider` — separators.
    56	- `VisuallyHidden` — accessibility-only text.
    57	
    58	Use these roles instead of local typography whenever possible.
    59	
    60	### Atoms
    61	
    62	Atoms own small controls and semantic markers. They may use foundation typography and theme tokens, but they should not own page layout.
    63	
    64	Examples: `Button`, `TextInput`, `SelectInput`, `CheckboxRow`, `IconButton`, `ContextKindSwatch`, `AnnotationBadge`.
    65	
    66	### Layout
    67	
    68	Layout owns generic structure and spacing recipes. Layout components must not know domain nouns like “course agenda”, “transcript message”, or “context part”.
    69	
    70	Examples:
    71	
    72	- `AppShell`
    73	- `SidebarShell`
    74	- `Panel`
    75	- `Stack`
    76	- `Inline`
    77	- `DashboardGrid`
    78	- `SplitPane`
    79	- `SectionBlock`
    80	- `SlideShell`
    81	- `ScrollRegion`
    82	- `TabList`
    83	- `FormRow`
    84	
    85	If a component answers “where do regions go?” it belongs in layout. If it answers “what domain data is shown?” it does not.
    86	
    87	### Molecules
    88	
    89	Molecules own reusable data-display or content-display patterns. They should have typed props, no app services, and no route/store assumptions.
    90	
    91	Examples:
    92	
    93	- `DataTable`
    94	- `MetadataGrid`
    95	- `SidebarNav`
    96	- `KeyValueStrip`
    97	- `CheckList`
    98	- `StepList`
    99	- `KeyPointList`
   100	- `FigureBlock`
   101	- `PersonSummary`
   102	- context diagram molecules
   103	- transcript/annotation cards
   104	
   105	If a pattern is useful outside one page but still carries content semantics, it is probably a molecule.
   106	
   107	### Organisms
   108	
   109	Organisms compose atoms/layout/molecules into feature panels or product-level shells with DTO-shaped props and callbacks.
   110	
   111	Examples:
   112	
   113	- `ContextDiagramPanel`
   114	- `TranscriptReaderPanel`
   115	- `AnnotationRailPanel`
   116	- `AnchoredCommentRail`
   117	- `CourseLessonPanel`
   118	- `CourseSlidePanel`
   119	- `CourseStudioShell`
   120	
   121	Organisms may be domain-specific, but they still must be presentational. They should accept data and callbacks; containers decide where data comes from.
   122	
   123	### Web-owned code
   124	
   125	Keep the following outside this package unless explicitly split into API-free presentational props:
   126	
   127	- RTK Query hooks and services
   128	- app store access
   129	- route state and navigation adapters
   130	- upload/parsing workflows tied to backend/runtime behavior
   131	- backend-connected containers/views
   132	- app-specific pages that are not reusable package surfaces
   133	
   134	## Storybook conventions
   135	
   136	Use package Storybook as the canonical review surface for reusable package components.
   137	
   138	Required title prefixes:
   139	
   140	```text
   141	Design System/Foundation/<Primitive>
   142	Design System/Atoms/<Atom>
   143	Design System/Layout/<Primitive>
   144	Component Library/Molecules/<Component>
   145	Component Library/Organisms/<Component>
   146	Widget IR/Renderer
   147	```
   148	
   149	Required story states where applicable:
   150	
   151	- default/populated
   152	- empty
   153	- overflow/dense
   154	- selected/active
   155	- disabled
   156	- error/warning
   157	- alternate layout direction, e.g. visual left/right
   158	
   159	Do not hide reusable stories in `web`. `web` Storybook is for app containers, backend-connected views, and integration/page compositions.
   160	
   161	## Typography rules
   162	
   163	The current visual language is intentionally compact and tokenized. Use these roles:
   164	
   165	| Purpose | Use |
   166	|---|---|
   167	| Body prose | `Text size="body"` or `font: var(--rag-font-role-body)` |
   168	| Readable article prose | `font: var(--rag-font-role-readable-body)` inside document/article renderers |
   169	| Article/display heading | `font: var(--rag-font-role-display)` or `font: var(--rag-font-role-heading)` in document/article renderers |
   170	| Dense labels / navigation rows | `Text size="compact"` or `font: var(--rag-font-role-compact)` |
   171	| Metadata / captions / side notes | `Caption` or `font: var(--rag-font-role-metadata)` |
   172	| Uppercase section labels | `Text size="label"` or `font: var(--rag-font-role-label)` plus tokenized uppercase behavior |
   173	| Compact numeric/metric values | `Text size="metric"` or `font: var(--rag-font-role-metric)` |
   174	| Code-like technical text | `CodeText` or `font: var(--rag-font-role-code)` |
   175	
   176	Do not set component-local typography unless the role does not exist yet. If a role is missing, add the role deliberately and document it.
   177	
   178	### Sidebar typography example
   179	
   180	The imported context-viewer prototype defines sidebar rows and groups with the same font roles:
   181	
   182	```css
   183	.mac-navitem { font: var(--rag-font-role-compact); }
   184	.mac-navgroup { font: var(--rag-font-role-label); letter-spacing: 0.5px; }
   185	.mac-caption { font: var(--rag-font-role-metadata); }
   186	```
   187	
   188	Package sidebar components should follow this token language, not custom body-font weights or arbitrary letter-spacing.
   189	
   190	## CSS module rules
   191	
   192	CSS Modules are allowed and expected, but they own only local anatomy.
   193	
   194	Allowed in CSS modules:
   195	
   196	- component layout anatomy
   197	- state selectors such as active/selected/disabled
   198	- dynamic visualization geometry wrappers
   199	- overflow/clamp behavior
   200	- local borders/backgrounds using theme tokens
   201	
   202	Avoid in CSS modules:
   203	
   204	- raw colors when a token exists
   205	- arbitrary font literals
   206	- global selectors
   207	- utility classes
   208	- domain-specific layout that should be a layout primitive
   209	- broad styling props that turn components into style systems
   210	
   211	Inline styles are allowed only for truly dynamic geometry, CSS variable plumbing, or Storybook-only swatches.
   212	
   213	## Prototype-source usage
   214	
   215	The imported prototype under the context ticket is valuable for:
   216	
   217	- product vocabulary
   218	- screen hierarchy
   219	- spacing and rhythm cues
   220	- `data-rag-*` extraction targets
   221	- visual parity comparison
   222	- token/foundation usage examples
   223	
   224	It is not production architecture. Do not copy:
   225	
   226	- global `.mac-*` classes directly into package components
   227	- inline JSX styles as permanent implementation
   228	- `window` exports
   229	- CDN/Babel assumptions
   230	- screen-local state into reusable components
   231	
   232	When porting from prototype source:
   233	
   234	1. Identify the generic layer: layout, molecule, organism, or app container.
   235	2. Replace global classes with CSS Modules and package tokens.
   236	3. Replace ad-hoc typography with foundation roles.
   237	4. Add Storybook stories for the extracted component.
   238	5. Add `data-rag-*` identity attributes.
   239	6. Validate typecheck/build/Storybook before using it in `web`.
   240	
   241	## Widget IR / WidgetRenderer rules
   242	
   243	`src/widgets/ir.ts` and `src/widgets/WidgetRenderer.tsx` expose JSON-compatible semantic UI nodes. Do not extend them with unstable visual fragments.
   244	
   245	Add Widget IR support only when:
   246	
   247	1. The React component is stable and story-covered.
   248	2. Its props are mostly JSON-compatible.
   249	3. There is a clear semantic reason for Goja/IR authors to use it.
   250	4. The renderer can preserve existing actions (`copy`, `event`, `navigate`, `server`) and typed value normalization.
   251	5. There are WidgetRenderer stories or tests that cover the new node.
   252	
   253	Prefer high-level semantic recipes over low-level DOM recreation. For example, a future `CourseStudioShell` or `ContextDiagramPanel` node is better than emitting many anonymous `div` nodes that mimic CSS module internals.
   254	
   255	## Review checklist
   256	
   257	Before committing package UI changes:
   258	
   259	- [ ] Correct layer chosen.
   260	- [ ] No backend/router/store imports.
```

## Existing WidgetRenderer Storybook examples

File: `packages/rag-evaluation-site/src/widgets/WidgetRenderer.stories.tsx` lines 1-260

```text
     1	import type { Meta, StoryObj } from '@storybook/react-vite';
     2	import { WidgetRenderer } from './WidgetRenderer';
     3	import { component, element, text, type JsonObject, type WidgetNode } from './ir';
     4	
     5	const meta = { title: 'Widget IR/Renderer', component: WidgetRenderer } satisfies Meta<typeof WidgetRenderer>;
     6	export default meta;
     7	type Story = StoryObj<typeof meta>;
     8	
     9	const sourceRows: JsonObject[] = [
    10	  { id: 'src_tree_center', name: 'The Tree Center', type: 'wordpress', documents: 1284, chunks: 38492, embedded: 38121, coverage: 99, status: 'done', url: 'https://www.thetreecenter.com' },
    11	  { id: 'src_arxiv', name: 'ArXiv RAG papers with a very long title-like source name', type: 'pdf', documents: 316, chunks: 11204, embedded: 4800, coverage: 43, status: 'partial', url: 'https://arxiv.org' },
    12	  { id: 'src_failed', name: 'Broken import batch', type: 'filesystem', documents: 18, chunks: 901, embedded: 0, coverage: 0, status: 'failed', url: 'https://example.invalid' },
    13	];
    14	
    15	const retrievalRows: JsonObject[] = [
    16	  { id: 'chunk_001', rank: 1, title: 'Fast Growing Trees', chunk_index: 12, score: 0.842134, retriever: 'hybrid', preview: 'Crape myrtle grows quickly in warm climates and benefits from full sun exposure.', bm25_rank: 3, vector_rank: 1, url: 'https://example.com/trees' },
    17	  { id: 'chunk_002', rank: 2, title: 'Arborvitae Spacing', chunk_index: 8, score: 0.712991, retriever: 'hybrid', preview: 'Spacing depends on cultivar and desired hedge density.', bm25_rank: 1, vector_rank: 4, url: 'https://example.com/arborvitae' },
    18	  { id: 'chunk_003', rank: 3, title: 'Hydrangea Care', chunk_index: 21, score: 0.6412, retriever: 'bm25', preview: 'Hydrangeas prefer moist soil and partial shade in hot climates.', bm25_rank: 2, vector_rank: 9, url: 'https://example.com/hydrangea' },
    19	];
    20	
    21	const workflowRows: JsonObject[] = [
    22	  { id: 'wf_intake_001', status: 'running', strategy: 'fixed-500', ops: '14/41', age: '4m' },
    23	  { id: 'wf_intake_002', status: 'succeeded', strategy: 'semantic-512', ops: '88/88', age: '2h' },
    24	  { id: 'wf_intake_003', status: 'failed', strategy: 'fixed-800', ops: '9/17', age: '1d' },
    25	];
    26	
    27	function panel(title: string, children: WidgetNode[], actions?: WidgetNode): WidgetNode {
    28	  return component('Panel', { title, actions, density: 'condensed' }, children);
    29	}
    30	
    31	function caption(value: string, tone: 'muted' | 'accent' | 'success' | 'warning' | 'danger' = 'muted'): WidgetNode {
    32	  return component('Caption', { tone }, [text(value)]);
    33	}
    34	
    35	function status(value: string, icon = true): WidgetNode {
    36	  return component('StatusText', { status: value, icon }, [text(value)]);
    37	}
    38	
    39	export const PrimitiveAtoms: Story = {
    40	  args: {
    41	    node: component('Stack', { gap: 'md' }, [
    42	      panel('Buttons', [
    43	        component('Inline', { gap: 'sm', wrap: true }, [
    44	          component('Button', {}, [text('Default')]),
    45	          component('Button', { variant: 'primary' }, [text('Primary')]),
    46	          component('Button', { selected: true }, [text('Selected')]),
    47	          component('Button', { size: 'compact' }, [text('Compact')]),
    48	          component('Button', { disabled: true }, [text('Disabled')]),
    49	        ]),
    50	      ]),
    51	      panel('Inputs', [
    52	        component('Stack', { gap: 'sm' }, [
    53	          component('TextInput', { placeholder: 'Enter query…', value: 'crape myrtle spacing' }),
    54	          component('SelectInput', { value: 'hybrid', options: [
    55	            { value: 'bm25', label: 'BM25' },
    56	            { value: 'vector', label: 'Vector' },
    57	            { value: 'hybrid', label: 'Hybrid' },
    58	          ] }),
    59	        ]),
    60	      ]),
    61	    ]),
    62	  },
    63	};
    64	
    65	export const FoundationStatuses: Story = {
    66	  args: {
    67	    node: panel('Status and caption combinations', [
    68	      component('Stack', { gap: 'sm' }, [
    69	        component('Inline', { gap: 'md', wrap: true }, ['pending', 'ready', 'running', 'succeeded', 'done', 'partial', 'warning', 'failed', 'error', 'canceled'].map((s) => status(s))),
    70	        component('Inline', { gap: 'md', wrap: true }, [
    71	          caption('muted'),
    72	          caption('accent', 'accent'),
    73	          caption('success', 'success'),
    74	          caption('warning', 'warning'),
    75	          caption('danger', 'danger'),
    76	          component('Caption', { transform: 'uppercase' }, [text('uppercase label')]),
    77	        ]),
    78	      ]),
    79	    ]),
    80	  },
    81	};
    82	
    83	export const LayoutRecipes: Story = {
    84	  args: {
    85	    node: component('Stack', { gap: 'lg' }, [
    86	      component('DashboardGrid', { recipe: 'twoColumn' }, [
    87	        panel('Left Panel', [caption('Two-column dashboard grid, left side.')]),
    88	        panel('Right Panel', [caption('Two-column dashboard grid, right side.')]),
    89	      ]),
    90	      component('DashboardGrid', { recipe: 'searchWorkbench' }, [
    91	        panel('Search Controls Width', [caption('Narrow control panel.')]),
    92	        component('Panel', { title: 'Results Fill', fill: true }, [caption('Wide result panel.')]),
    93	      ]),
    94	    ]),
    95	  },
    96	};
    97	
    98	export const MetadataGridVariants: Story = {
    99	  args: {
   100	    node: component('DashboardGrid', { recipe: 'twoColumn' }, [
   101	      panel('Normal metadata', [
   102	        component('MetadataGrid', { items: [
   103	          { key: 'Document ID', value: 'doc_01HX7RAGDEMO', copyValue: 'doc_01HX7RAGDEMO' },
   104	          { key: 'Source', value: 'The Tree Center' },
   105	          { key: 'Status', value: status('done') },
   106	          { key: 'Coverage', value: caption('99%', 'success') },
   107	        ] }),
   108	      ]),
   109	      panel('Compact metadata', [
   110	        component('MetadataGrid', { density: 'compact', items: [
   111	          { key: 'Strategy', value: caption('fixed-500') },
   112	          { key: 'Provider', value: 'ollama/nomic-embed-text' },
   113	          { key: 'Dimensions', value: 768 },
   114	          { key: 'Missing', value: caption('371', 'warning') },
   115	        ] }),
   116	      ]),
   117	    ]),
   118	  },
   119	};
   120	
   121	export const DataTableCellKinds: Story = {
   122	  args: {
   123	    node: panel('Source coverage table', [
   124	      component('DataTable', {
   125	        rows: sourceRows,
   126	        getRowKey: { field: 'id' },
   127	        selectedKey: 'src_arxiv',
   128	        columns: [
   129	          { id: 'name', header: 'Source', maxWidth: 220, cell: { kind: 'field', field: 'name' } },
   130	          { id: 'type', header: 'Type', cell: { kind: 'caption', field: 'type', tone: 'accent' } },
   131	          { id: 'docs', header: 'Docs', align: 'end', cell: { kind: 'number', field: 'documents' } },
   132	          { id: 'chunks', header: 'Chunks', align: 'end', cell: { kind: 'number', field: 'chunks' } },
   133	          { id: 'coverage', header: 'Cov', align: 'end', cell: { kind: 'template', template: '$coverage%' } },
   134	          { id: 'status', header: 'Status', cell: { kind: 'status', field: 'status', icon: true } },
   135	          { id: 'link', header: 'Link', cell: { kind: 'link', hrefField: 'url', labelField: 'type', target: '_blank' } },
   136	        ],
   137	      }),
   138	    ]),
   139	  },
   140	};
   141	
   142	export const DataTableEmptyAndMalformed: Story = {
   143	  args: {
   144	    node: component('DashboardGrid', { recipe: 'twoColumn' }, [
   145	      panel('Empty table', [
   146	        component('DataTable', {
   147	          rows: [],
   148	          getRowKey: { field: 'id' },
   149	          emptyMessage: 'No workflows with status "running".',
   150	          columns: [
   151	            { id: 'status', header: 'Status', cell: { kind: 'status', field: 'status' } },
   152	            { id: 'id', header: 'Workflow ID', cell: { kind: 'field', field: 'id' } },
   153	          ],
   154	        }),
   155	      ]),
   156	      panel('Unknown widget boundary', [
   157	        component('DefinitelyNotAWidget', {}, [text('This should render an error callout.')]),
   158	      ]),
   159	    ]),
   160	  },
   161	};
   162	
   163	export const SearchWorkbenchComposition: Story = {
   164	  args: {
   165	    node: component('AppShell', {
   166	      header: component('AppNav', {
   167	        brand: '◉ RAG Eval',
   168	        activeItemId: 'search',
   169	        items: [
   170	          { id: 'search', label: 'Search' },
   171	          { id: 'corpus', label: 'Corpus' },
   172	          { id: 'workflows', label: 'Workflows' },
   173	          { id: 'dsl', label: 'DSL' },
   174	        ],
   175	      }),
   176	    }, [
   177	      component('DashboardGrid', { recipe: 'searchWorkbench' }, [
   178	        panel('Search', [
   179	          component('Stack', { gap: 'sm' }, [
   180	            component('FormRow', { label: 'Query', control: component('TextInput', { placeholder: 'Enter query…', value: 'how fast do crape myrtles grow?' }) }),
   181	            component('Inline', { gap: 'sm' }, [
   182	              component('Button', { variant: 'primary' }, [text('▶ Search')]),
   183	              component('Button', { selected: true }, [text('hybrid')]),
   184	              component('Button', {}, [text('bm25')]),
   185	              component('Button', {}, [text('vector')]),
   186	            ]),
   187	            component('FormRow', { label: 'BM25 Index', control: component('TextInput', { value: 'trees-default' }) }),
   188	            component('FormRow', { label: 'Strategy', control: component('TextInput', { value: 'fixed-500' }) }),
   189	            component('ScrollRegion', { axis: 'y', style: { maxHeight: '160px' } }, sourceRows.map((row) => component('Caption', { tone: row.status === 'failed' ? 'danger' : 'muted', truncate: true }, [text(String(row.name))]))),
   190	          ]),
   191	        ]),
   192	        component('Panel', { title: 'HYBRID — 3 results', fill: true, actions: caption('how fast do crape myrtles grow?') }, [
   193	          component('ScrollRegion', { axis: 'y', style: { height: '100%' } }, [
   194	            component('DataTable', {
   195	              rows: retrievalRows,
   196	              getRowKey: { field: 'id' },
   197	              selectedKey: 'chunk_001',
   198	              columns: [
   199	                { id: 'rank', header: '#', align: 'end', cell: { kind: 'number', field: 'rank' } },
   200	                { id: 'title', header: 'Title', maxWidth: 180, cell: { kind: 'field', field: 'title' } },
   201	                { id: 'score', header: 'Score', align: 'end', cell: { kind: 'number', field: 'score', format: 'fixed', digits: 4 } },
   202	                { id: 'bm25', header: 'BM25', align: 'end', cell: { kind: 'template', template: '#$bm25_rank' } },
   203	                { id: 'vector', header: 'Vec', align: 'end', cell: { kind: 'template', template: '#$vector_rank' } },
   204	                { id: 'preview', header: 'Preview', maxWidth: 320, cell: { kind: 'field', field: 'preview' } },
   205	              ],
   206	            }),
   207	          ]),
   208	        ]),
   209	      ]),
   210	    ]),
   211	  },
   212	};
   213	
   214	export const CorpusExplorerSkeleton: Story = {
   215	  args: {
   216	    node: component('AppShell', {
   217	      header: component('AppNav', {
   218	        brand: '◉ RAG Eval',
   219	        activeItemId: 'corpus',
   220	        items: [
   221	          { id: 'search', label: 'Search' },
   222	          { id: 'corpus', label: 'Corpus' },
   223	          { id: 'workflows', label: 'Workflows' },
   224	        ],
   225	      }),
   226	    }, [
   227	      component('Stack', { gap: 'md' }, [
   228	        panel('Embedding Identity', [
   229	          component('Inline', { gap: 'md' }, [
   230	            component('FormRow', { label: 'Strategy', control: component('SelectInput', { value: 'fixed-500', options: [{ value: 'fixed-500', label: 'fixed-500' }, { value: 'semantic-512', label: 'semantic-512' }] }) }),
   231	            component('FormRow', { label: 'Provider', control: component('TextInput', { value: 'ollama' }) }),
   232	            component('FormRow', { label: 'Model', control: component('TextInput', { value: 'nomic-embed-text' }) }),
   233	            component('FormRow', { label: 'Dims', control: component('TextInput', { type: 'number', value: 768 }) }),
   234	            caption('1618 docs · 50597 chunks · 42921 embedded'),
   235	          ]),
   236	        ]),
   237	        component('DashboardGrid', { recipe: 'corpusExplorer' }, [
   238	          panel('Sources', [component('DataTable', {
   239	            rows: sourceRows,
   240	            getRowKey: { field: 'id' },
   241	            selectedKey: 'src_tree_center',
   242	            columns: [
   243	              { id: 'name', header: 'Source', cell: { kind: 'field', field: 'name' } },
   244	              { id: 'docs', header: 'Docs', align: 'end', cell: { kind: 'number', field: 'documents' } },
   245	            ],
   246	          })]),
   247	          panel('The Tree Center — Documents', [component('ScrollRegion', { axis: 'y', style: { maxHeight: '570px' } }, [component('DataTable', {
   248	            rows: retrievalRows,
   249	            getRowKey: { field: 'id' },
   250	            selectedKey: 'chunk_002',
   251	            columns: [
   252	              { id: 'title', header: 'Title', maxWidth: 300, cell: { kind: 'field', field: 'title' } },
   253	              { id: 'chunk', header: 'Chunk', align: 'end', cell: { kind: 'number', field: 'chunk_index' } },
   254	              { id: 'status', header: 'Status', cell: { kind: 'constant', value: status('done') } },
   255	            ],
   256	          })])]),
   257	          panel('Inspector', [
   258	            component('TabList', { activeId: 'overview', items: [{ id: 'overview', label: 'overview' }, { id: 'text', label: 'text' }, { id: 'chunks', label: 'chunks' }, { id: 'coverage', label: 'coverage' }] }),
   259	            component('MetadataGrid', { items: [
   260	              { key: 'ID', value: 'doc_01HX7RAGDEMO', copyValue: 'doc_01HX7RAGDEMO' },
```

