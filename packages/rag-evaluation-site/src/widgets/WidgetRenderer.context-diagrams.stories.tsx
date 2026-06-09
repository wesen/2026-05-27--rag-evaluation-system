import type { Meta, StoryObj } from '@storybook/react-vite';
import { contextPaletteOptions, contextStyleSetForPalette, contextThreeLabelStyleSets, contextWindowSnapshots, type ContextPaletteName, type ContextStyleSet, type ContextWindowSnapshot } from '../context';
import { WidgetRenderer, type WidgetRendererProps } from './WidgetRenderer';
import { defaultWidgetRegistry } from './defaultRegistry';
import { component, text, type WidgetNode } from './ir';

type StoryArgs = WidgetRendererProps & { palette: ContextPaletteName };

const meta = {
  title: 'Widget IR/Renderer/Context Diagrams',
  args: { registry: defaultWidgetRegistry, palette: 'Dusty Magenta / Blue' },
  argTypes: {
    palette: { control: 'select', options: contextPaletteOptions },
    node: { control: false },
    registry: { control: false },
    onAction: { control: false },
  },
} satisfies Meta<StoryArgs>;
export default meta;
type Story = StoryObj<StoryArgs>;

const snapshot = contextWindowSnapshots[0]!;
const contentSnapshot: ContextWindowSnapshot = {
  id: 'widget-ir-content-blocks',
  title: 'Widget IR content blocks',
  subtitle: 'Server-provided parts correspond to transcript/tool blocks.',
  limit: 16_000,
  selectedPartId: 'tool-result',
  parts: [
    { id: 'system', label: 'system', styleKey: 'system', tokens: 720, note: 'Instructions and tool policy.', contentPreview: 'You are an expert coding assistant...' },
    { id: 'user-turn', label: 'T4 user', styleKey: 'conversation', tokens: 180, note: 'User asks for content-level context visualization.', contentPreview: 'I want the context view visualization to be more about the actual content...' },
    { id: 'tool-call', label: 'T5 bash call', styleKey: 'tool', tokens: 90, note: 'Search command.', contentPreview: '$ rg -n ContextDiagramPanel packages pkg -S', metadata: { turn: 5, toolName: 'bash' } },
    { id: 'tool-result', label: 'T5 search output', styleKey: 'result', tokens: 1180, note: 'Search results showing the files to change.', contentPreview: 'packages/rag-evaluation-site/src/widgets/ir.ts:229...\npackages/rag-evaluation-site/src/components/organisms/ContextDiagramPanel...', metadata: { turn: 5, fullBytes: 4720 } },
    { id: 'answer', label: 'T6 assistant', styleKey: 'active', tokens: 340, note: 'Current answer draft.', contentPreview: 'Yes — the current panel hard-codes a generic legend...' },
    { id: 'free', label: 'free', styleKey: 'empty', tokens: 13_490 },
  ],
};
const overBudgetSnapshot: ContextWindowSnapshot = { ...contextWindowSnapshots[1]!, id: 'over-budget-widget-ir', title: 'Over budget context window', limit: 12_000 };
const threeLabelStyleSet = contextThreeLabelStyleSets[0]!;
const threeLabelSnapshot: ContextWindowSnapshot = {
  id: 'widget-ir-three-label',
  title: 'Widget IR three-label context',
  limit: 32_000,
  selectedPartId: 'retrieved-docs',
  parts: [
    { id: 'prompt', label: 'Prompt', styleKey: 'prompt', tokens: 1400 },
    { id: 'retrieved-docs', label: 'Evidence', styleKey: 'evidence', tokens: 9200 },
    { id: 'answer-draft', label: 'Draft', styleKey: 'answer', tokens: 1800 },
    { id: 'free', label: 'Free', styleKey: 'free', tokens: 19600 },
  ],
};

function panel(title: string, children: WidgetNode[]): WidgetNode { return component('Panel', { title, density: 'condensed' }, children); }
function renderNode(node: WidgetNode, registry = defaultWidgetRegistry) { return <WidgetRenderer registry={registry} node={node} />; }

function contextDiagramGalleryNode(styleSet: ContextStyleSet): WidgetNode {
  return component('Stack', { gap: 'md' }, [
    panel('Same snapshot, four diagram renderers', [
      component('DashboardGrid', { recipe: 'twoColumn' }, [
        component('ContextBudgetBar', { snapshot, styleSet, selectedPartId: snapshot.selectedPartId, showLegend: true }),
        component('ContextStripDiagram', { snapshot, styleSet, selectedPartId: snapshot.selectedPartId }),
        component('ContextStackDiagram', { snapshot, styleSet, selectedPartId: snapshot.selectedPartId }),
        component('ContextTreemap', { snapshot, styleSet, selectedPartId: snapshot.selectedPartId }),
      ]),
    ]),
    component('ContextLegend', { items: styleSet.legend, styles: styleSet.styles, selectedId: 'conversation' }),
  ]);
}

export const ContextDiagramGallery: Story = {
  render: ({ palette, registry }) => renderNode(contextDiagramGalleryNode(contextStyleSetForPalette(palette)), registry),
};

export const ContextDiagramPanelViews: Story = {
  render: ({ palette, registry }) => {
    const styleSet = contextStyleSetForPalette(palette);
    return renderNode(component('DashboardGrid', { recipe: 'twoColumn' }, [
      component('ContextDiagramPanel', { snapshot, styleSet, initialView: 'strip', selectedPartId: snapshot.selectedPartId }),
      component('ContextDiagramPanel', { snapshot, styleSet, initialView: 'budget', selectedPartId: snapshot.selectedPartId }),
      component('ContextDiagramPanel', { snapshot, styleSet, initialView: 'stack', selectedPartId: snapshot.selectedPartId }),
      component('ContextDiagramPanel', { snapshot, styleSet, initialView: 'treemap', selectedPartId: snapshot.selectedPartId }),
    ]), registry);
  },
};

export const ContextDiagramPanelContentDetails: Story = {
  render: ({ palette, registry }) => renderNode(component('ContextDiagramPanel', { snapshot: contentSnapshot, styleSet: contextStyleSetForPalette(palette), initialView: 'stack', views: ['stack', 'strip', 'budget'], showPartDetails: true }), registry),
};

export const CustomThreeLabelWidgetIR: Story = {
  parameters: { controls: { include: [] } },
  args: { palette: 'Dusty Magenta / Blue' },
  render: ({ registry }) => renderNode(component('ContextDiagramPanel', { snapshot: threeLabelSnapshot, styleSet: threeLabelStyleSet, initialView: 'strip', views: ['strip', 'budget', 'treemap'], showPartDetails: true }), registry),
};

export const ContextDiagramWithMetadataSidebar: Story = {
  render: ({ palette, registry }) => {
    const styleSet = contextStyleSetForPalette(palette);
    return renderNode(component('SplitPane', {
      ratio: 'rightNarrow',
      divider: true,
      left: component('ContextDiagramPanel', { snapshot, styleSet, initialView: 'treemap', selectedPartId: snapshot.selectedPartId }),
      right: component('Stack', { gap: 'md' }, [
        panel('Window metadata', [
          component('MetadataGrid', { density: 'compact', items: [
            { key: 'Window ID', value: component('CodeText', {}, [text(snapshot.id)]), copyValue: snapshot.id },
            { key: 'Limit', value: `${snapshot.limit.toLocaleString()} tokens` },
            { key: 'Parts', value: snapshot.parts.length },
            { key: 'Selected', value: snapshot.selectedPartId ?? 'none' },
          ] }),
        ]),
        panel('Legend', [component('ContextLegend', { items: styleSet.legend, styles: styleSet.styles, size: 'sm', selectedId: 'conversation' })]),
      ]),
    }), registry);
  },
};

export const OverBudgetContextWindow: Story = {
  render: ({ palette, registry }) => {
    const styleSet = contextStyleSetForPalette(palette);
    return renderNode(component('Stack', { gap: 'md' }, [
      component('ContextBudgetBar', { snapshot: overBudgetSnapshot, styleSet, showLegend: true }),
      component('Inline', { gap: 'sm', wrap: true }, [
        component('AnnotationBadge', { visualStyle: styleSet.styles.evicted, label: 'eviction risk', selected: true }),
        component('Caption', { tone: 'warning' }, [text('Budget state is intentionally over the configured limit.')]),
      ]),
      component('ContextStripDiagram', { snapshot: overBudgetSnapshot, styleSet, showLabels: true }),
    ]), registry);
  },
};
