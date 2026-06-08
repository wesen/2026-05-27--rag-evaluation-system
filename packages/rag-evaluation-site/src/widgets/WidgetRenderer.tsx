import { createElement, type CSSProperties, type ReactNode } from 'react';
import { AnnotationBadge, Button, ContextKindSwatch, ErrorCallout, SelectInput, TextInput, TranscriptRoleBadge } from '../components/atoms';
import { Caption, CodeText, Divider, StatusText, Text } from '../components/foundation';
import { AppShell, DashboardGrid, FormRow, Inline, Panel, ScrollRegion, SectionBlock, SidebarShell, SplitPane, Stack, TabList } from '../components/layout';
import { AppNav, ContextBudgetBar, ContextLegend, ContextStackDiagram, ContextStripDiagram, ContextTreemap, DataTable, MetadataGrid } from '../components/molecules';
import { ContextDiagramPanel } from '../components/organisms';
import type {
  ActionSpec,
  AppNavWidgetProps,
  AppShellWidgetProps,
  AnnotationBadgeWidgetProps,
  ButtonWidgetProps,
  CaptionWidgetProps,
  CodeTextWidgetProps,
  ComponentNode,
  ContextBudgetBarWidgetProps,
  ContextDiagramPanelWidgetProps,
  ContextKindSwatchWidgetProps,
  ContextLegendWidgetProps,
  ContextStackDiagramWidgetProps,
  ContextStripDiagramWidgetProps,
  ContextTreemapWidgetProps,
  DashboardGridWidgetProps,
  DividerWidgetProps,
  DataTableWidgetProps,
  ElementNode,
  FormRowWidgetProps,
  InlineWidgetProps,
  JsonObject,
  MetadataGridWidgetProps,
  PanelWidgetProps,
  ScrollRegionWidgetProps,
  SectionBlockWidgetProps,
  SelectInputWidgetProps,
  SidebarShellWidgetProps,
  SplitPaneWidgetProps,
  StackWidgetProps,
  StatusTextWidgetProps,
  TabListWidgetProps,
  TextInputWidgetProps,
  TextWidgetProps,
  TranscriptRoleBadgeWidgetProps,
  WidgetNode,
} from './ir';
import { bindAction, type WidgetActionContext, type WidgetActionHandler } from './actions';
import { renderCell, renderRenderable, rowKey } from './cellRenderers';

export interface WidgetRendererProps {
  node: WidgetNode;
  onAction?: WidgetActionHandler;
}

export function WidgetRenderer({ node, onAction }: WidgetRendererProps) {
  return <>{renderWidgetNode(node, onAction)}</>;
}

function renderWidgetNode(node: WidgetNode, onAction?: WidgetActionHandler): ReactNode {
  if (node.kind === 'text') return node.text;
  if (node.kind === 'element') return renderElementNode(node, onAction);
  return renderComponentNode(node, onAction);
}

function renderChildren(children: WidgetNode[] | undefined, onAction?: WidgetActionHandler): ReactNode[] {
  return (children ?? []).map((child, index) => <WidgetRenderer key={index} node={child} onAction={onAction} />);
}

function renderRenderableValue(value: unknown, onAction?: WidgetActionHandler): ReactNode {
  return renderRenderable(value as never, (node) => renderWidgetNode(node, onAction));
}

function renderNodeProp(node: WidgetNode | undefined, onAction?: WidgetActionHandler): ReactNode | undefined {
  return node ? renderWidgetNode(node, onAction) : undefined;
}

function renderElementNode(node: ElementNode, onAction?: WidgetActionHandler): ReactNode {
  const attrs = { ...(node.attrs ?? {}) } as Record<string, unknown>;
  if (attrs.style && typeof attrs.style === 'object') attrs.style = attrs.style as CSSProperties;
  return createElement(node.tag, attrs, ...renderChildren(node.children, onAction));
}

function renderComponentNode(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  switch (node.type) {
    case 'AppShell':
      return renderAppShell(node, onAction);
    case 'AppNav':
      return renderAppNav(node, onAction);
    case 'Button':
      return renderButton(node, onAction);
    case 'Text':
      return renderText(node, onAction);
    case 'CodeText':
      return renderCodeText(node, onAction);
    case 'Divider':
      return renderDivider(node);
    case 'ContextKindSwatch':
      return renderContextKindSwatch(node);
    case 'AnnotationBadge':
      return renderAnnotationBadge(node);
    case 'TranscriptRoleBadge':
      return renderTranscriptRoleBadge(node);
    case 'ContextLegend':
      return renderContextLegend(node);
    case 'ContextBudgetBar':
      return renderContextBudgetBar(node);
    case 'ContextStripDiagram':
      return renderContextStripDiagram(node);
    case 'ContextStackDiagram':
      return renderContextStackDiagram(node);
    case 'ContextTreemap':
      return renderContextTreemap(node);
    case 'ContextDiagramPanel':
      return renderContextDiagramPanel(node);
    case 'Caption':
      return renderCaption(node, onAction);
    case 'DashboardGrid':
      return renderDashboardGrid(node, onAction);
    case 'DataTable':
      return renderDataTable(node, onAction);
    case 'FormRow':
      return renderFormRow(node, onAction);
    case 'Inline':
      return renderInline(node, onAction);
    case 'MetadataGrid':
      return renderMetadataGrid(node, onAction);
    case 'Panel':
      return renderPanel(node, onAction);
    case 'ScrollRegion':
      return renderScrollRegion(node, onAction);
    case 'SectionBlock':
      return renderSectionBlock(node, onAction);
    case 'SplitPane':
      return renderSplitPane(node, onAction);
    case 'SidebarShell':
      return renderSidebarShell(node, onAction);
    case 'SelectInput':
      return renderSelectInput(node, onAction);
    case 'Stack':
      return renderStack(node, onAction);
    case 'StatusText':
      return renderStatusText(node, onAction);
    case 'TabList':
      return renderTabList(node, onAction);
    case 'TextInput':
      return renderTextInput(node);
    default:
      return <ErrorCallout>Unknown widget: {node.type}</ErrorCallout>;
  }
}

function renderAppShell(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as AppShellWidgetProps;
  return (
    <AppShell
      className={props.className}
      header={props.header ? renderWidgetNode(props.header, onAction) : undefined}
      sidebar={props.sidebar ? renderWidgetNode(props.sidebar, onAction) : undefined}
    >
      {renderChildren(node.children, onAction)}
    </AppShell>
  );
}

function renderAppNav(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as AppNavWidgetProps;
  return (
    <AppNav
      brand={renderRenderableValue(props.brand, onAction)}
      items={props.items.map((item) => ({ id: item.id, label: renderRenderableValue(item.label, onAction) }))}
      activeItemId={props.activeItemId}
      onItemSelect={(itemId) => {
        const item = props.items.find((candidate) => candidate.id === itemId);
        if (item?.action) bindAndRun(item.action, { value: itemId, componentType: 'AppNav' }, onAction);
      }}
    />
  );
}

function renderButton(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as ButtonWidgetProps;
  return (
    <Button
      className={props.className}
      variant={props.variant}
      size={props.size}
      selected={props.selected}
      disabled={props.disabled}
      type={props.type ?? 'button'}
      onClick={bindAction(props.action, { componentType: 'Button' }, onAction)}
    >
      {renderChildren(node.children, onAction)}
    </Button>
  );
}

function renderText(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as TextWidgetProps;
  return <Text className={props.className} as={props.as} size={props.size} tone={props.tone} weight={props.weight} align={props.align} truncate={props.truncate}>{renderChildren(node.children, onAction)}</Text>;
}

function renderCodeText(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as CodeTextWidgetProps;
  return <CodeText className={props.className} as={props.as} tone={props.tone} display={props.display} copyable={props.copyable}>{renderChildren(node.children, onAction)}</CodeText>;
}

function renderDivider(node: ComponentNode): ReactNode {
  const props = (node.props ?? {}) as DividerWidgetProps;
  return <Divider className={props.className} orientation={props.orientation} />;
}

function renderContextKindSwatch(node: ComponentNode): ReactNode {
  const props = (node.props ?? {}) as ContextKindSwatchWidgetProps;
  return <ContextKindSwatch className={props.className} kind={props.kind} mode={props.mode} size={props.size} selected={props.selected} />;
}

function renderAnnotationBadge(node: ComponentNode): ReactNode {
  const props = (node.props ?? {}) as AnnotationBadgeWidgetProps;
  return <AnnotationBadge className={props.className} kind={props.kind} label={props.label} selected={props.selected} />;
}

function renderTranscriptRoleBadge(node: ComponentNode): ReactNode {
  const props = (node.props ?? {}) as TranscriptRoleBadgeWidgetProps;
  return <TranscriptRoleBadge className={props.className} role={props.role} name={props.name} />;
}

function renderContextLegend(node: ComponentNode): ReactNode {
  const props = (node.props ?? {}) as ContextLegendWidgetProps;
  return <ContextLegend className={props.className} kinds={props.kinds} mode={props.mode} compact={props.compact} selectedKind={props.selectedKind} />;
}

function renderContextBudgetBar(node: ComponentNode): ReactNode {
  const props = (node.props ?? {}) as ContextBudgetBarWidgetProps;
  return <ContextBudgetBar className={props.className} snapshot={props.snapshot} mode={props.mode} showLegend={props.showLegend} selectedPartId={props.selectedPartId} />;
}

function renderContextStripDiagram(node: ComponentNode): ReactNode {
  const props = (node.props ?? {}) as ContextStripDiagramWidgetProps;
  return <ContextStripDiagram className={props.className} snapshot={props.snapshot} mode={props.mode} selectedPartId={props.selectedPartId} showLabels={props.showLabels} />;
}

function renderContextStackDiagram(node: ComponentNode): ReactNode {
  const props = (node.props ?? {}) as ContextStackDiagramWidgetProps;
  return <ContextStackDiagram className={props.className} snapshot={props.snapshot} selectedPartId={props.selectedPartId} />;
}

function renderContextTreemap(node: ComponentNode): ReactNode {
  const props = (node.props ?? {}) as ContextTreemapWidgetProps;
  return <ContextTreemap className={props.className} snapshot={props.snapshot} selectedPartId={props.selectedPartId} />;
}

function renderContextDiagramPanel(node: ComponentNode): ReactNode {
  const props = (node.props ?? {}) as ContextDiagramPanelWidgetProps;
  return <ContextDiagramPanel className={props.className} snapshot={props.snapshot} initialView={props.initialView} selectedPartId={props.selectedPartId} />;
}

function renderCaption(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as CaptionWidgetProps;
  return <Caption className={props.className} tone={props.tone} transform={props.transform} truncate={props.truncate}>{renderChildren(node.children, onAction)}</Caption>;
}

function renderDashboardGrid(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as DashboardGridWidgetProps;
  return <DashboardGrid className={props.className} recipe={props.recipe}>{renderChildren(node.children, onAction)}</DashboardGrid>;
}

function renderDataTable(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as DataTableWidgetProps;
  const rowSelectAction = props.onRowSelect;
  return (
    <DataTable<JsonObject>
      className={props.className}
      rows={props.rows}
      columns={props.columns.map((column) => ({
        id: column.id,
        header: renderRenderableValue(column.header, onAction),
        align: column.align,
        maxWidth: column.maxWidth,
        cell: (row) => renderCell(column.cell, row, (child) => renderWidgetNode(child, onAction)),
      }))}
      getRowKey={(row) => rowKey(row, props.getRowKey)}
      selectedKey={props.selectedKey == null ? props.selectedKey : String(props.selectedKey)}
      emptyMessage={renderRenderableValue(props.emptyMessage, onAction)}
      onRowSelect={rowSelectAction ? (row) => bindAndRun(rowSelectAction, { row, rowKey: rowKey(row, props.getRowKey), componentType: 'DataTable' }, onAction) : undefined}
    />
  );
}

function renderFormRow(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as FormRowWidgetProps;
  return (
    <FormRow
      className={props.className}
      label={renderRenderableValue(props.label, onAction)}
      control={renderWidgetNode(props.control, onAction)}
      hint={renderRenderableValue(props.hint, onAction)}
    />
  );
}

function renderInline(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as InlineWidgetProps;
  return <Inline className={props.className} gap={props.gap} justify={props.justify} wrap={props.wrap}>{renderChildren(node.children, onAction)}</Inline>;
}

function renderMetadataGrid(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as MetadataGridWidgetProps;
  return (
    <MetadataGrid
      className={props.className}
      density={props.density}
      items={props.items.map((item) => ({
        key: renderRenderableValue(item.key, onAction),
        value: renderRenderableValue(item.value, onAction),
        copyValue: item.copyValue,
      }))}
    />
  );
}

function renderPanel(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as PanelWidgetProps;
  return (
    <Panel
      className={props.className}
      title={renderRenderableValue(props.title, onAction)}
      actions={renderRenderableValue(props.actions, onAction)}
      density={props.density}
      fill={props.fill}
    >
      {renderChildren(node.children, onAction)}
    </Panel>
  );
}

function renderScrollRegion(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as ScrollRegionWidgetProps;
  return <ScrollRegion className={props.className} axis={props.axis} style={props.style as CSSProperties | undefined}>{renderChildren(node.children, onAction)}</ScrollRegion>;
}

function renderSectionBlock(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as SectionBlockWidgetProps;
  return <SectionBlock className={props.className} as={props.as} label={renderRenderableValue(props.label, onAction)} caption={renderRenderableValue(props.caption, onAction)} density={props.density} divider={props.divider}>{renderChildren(node.children, onAction)}</SectionBlock>;
}

function renderSplitPane(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as SplitPaneWidgetProps;
  return <SplitPane className={props.className} left={renderWidgetNode(props.left, onAction)} right={renderWidgetNode(props.right, onAction)} ratio={props.ratio} divider={props.divider} />;
}

function renderSidebarShell(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as SidebarShellWidgetProps;
  return <SidebarShell className={props.className} sidebar={renderNodeProp(props.sidebar, onAction)} sidebarWidth={props.sidebarWidth} header={renderNodeProp(props.header, onAction)} footer={renderNodeProp(props.footer, onAction)}>{renderChildren(node.children, onAction)}</SidebarShell>;
}

function renderSelectInput(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as SelectInputWidgetProps;
  return (
    <SelectInput className={props.className} name={props.name} value={props.value} disabled={props.disabled}>
      {(props.options ?? []).map((option) => (
        <option key={String(option.value)} value={option.value} disabled={option.disabled}>
          {renderRenderableValue(option.label, onAction)}
        </option>
      ))}
      {renderChildren(node.children, onAction)}
    </SelectInput>
  );
}

function renderStack(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as StackWidgetProps;
  return <Stack className={props.className} gap={props.gap} align={props.align}>{renderChildren(node.children, onAction)}</Stack>;
}

function renderStatusText(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as StatusTextWidgetProps;
  return <StatusText className={props.className} status={props.status} icon={props.icon}>{renderChildren(node.children, onAction)}</StatusText>;
}

function renderTabList(node: ComponentNode, onAction?: WidgetActionHandler): ReactNode {
  const props = (node.props ?? {}) as TabListWidgetProps;
  return (
    <TabList
      items={props.items.map((item) => ({ id: item.id, label: renderRenderableValue(item.label, onAction) }))}
      activeId={props.activeId}
      ariaLabel={props.ariaLabel}
      onChange={(id) => {
        if (props.onChange) bindAndRun(props.onChange, { value: id, componentType: 'TabList' }, onAction);
      }}
    />
  );
}

function renderTextInput(node: ComponentNode): ReactNode {
  const props = (node.props ?? {}) as TextInputWidgetProps;
  return (
    <TextInput
      className={props.className}
      name={props.name}
      value={props.value}
      placeholder={props.placeholder}
      type={props.type}
      disabled={props.disabled}
      min={props.min}
      max={props.max}
      readOnly
    />
  );
}

function bindAndRun(action: ActionSpec, context: WidgetActionContext, onAction?: WidgetActionHandler): void {
  bindAction(action, context, onAction)?.();
}
