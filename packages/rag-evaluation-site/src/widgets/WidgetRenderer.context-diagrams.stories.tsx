import type { Meta, StoryObj } from '@storybook/react-vite';
import { contextWindowSnapshots } from '../context';
import { WidgetRenderer } from './WidgetRenderer';
import { component, text, type WidgetNode } from './ir';

const meta = { title: 'Widget IR/Renderer/Context Diagrams', component: WidgetRenderer } satisfies Meta<typeof WidgetRenderer>;
export default meta;
type Story = StoryObj<typeof meta>;

const snapshot = contextWindowSnapshots[0]!;
const overBudgetSnapshot = {
  ...contextWindowSnapshots[1]!,
  id: 'over-budget-widget-ir',
  title: 'Over budget context window',
  limit: 12_000,
};

function panel(title: string, children: WidgetNode[]): WidgetNode {
  return component('Panel', { title, density: 'condensed' }, children);
}

export const ContextDiagramGallery: Story = {
  args: {
    node: component('Stack', { gap: 'md' }, [
      panel('Same snapshot, four diagram renderers', [
        component('DashboardGrid', { recipe: 'twoColumn' }, [
          component('ContextBudgetBar', { snapshot, selectedPartId: snapshot.selectedPartId, showLegend: true }),
          component('ContextStripDiagram', { snapshot, selectedPartId: snapshot.selectedPartId }),
          component('ContextStackDiagram', { snapshot, selectedPartId: snapshot.selectedPartId }),
          component('ContextTreemap', { snapshot, selectedPartId: snapshot.selectedPartId }),
        ]),
      ]),
      component('ContextLegend', { compact: false, selectedKind: 'conversation' }),
    ]),
  },
};

export const ContextDiagramPanelModes: Story = {
  args: {
    node: component('DashboardGrid', { recipe: 'twoColumn' }, [
      component('ContextDiagramPanel', { snapshot, initialView: 'strip', selectedPartId: snapshot.selectedPartId }),
      component('ContextDiagramPanel', { snapshot, initialView: 'budget', selectedPartId: snapshot.selectedPartId }),
      component('ContextDiagramPanel', { snapshot, initialView: 'stack', selectedPartId: snapshot.selectedPartId }),
      component('ContextDiagramPanel', { snapshot, initialView: 'treemap', selectedPartId: snapshot.selectedPartId }),
    ]),
  },
};

export const ContextDiagramWithMetadataSidebar: Story = {
  args: {
    node: component('SplitPane', {
      ratio: 'rightNarrow',
      divider: true,
      left: component('ContextDiagramPanel', { snapshot, initialView: 'treemap', selectedPartId: snapshot.selectedPartId }),
      right: component('Stack', { gap: 'md' }, [
        panel('Window metadata', [
          component('MetadataGrid', { density: 'compact', items: [
            { key: 'Window ID', value: component('CodeText', {}, [text(snapshot.id)]), copyValue: snapshot.id },
            { key: 'Limit', value: `${snapshot.limit.toLocaleString()} tokens` },
            { key: 'Parts', value: snapshot.parts.length },
            { key: 'Selected', value: snapshot.selectedPartId ?? 'none' },
          ] }),
        ]),
        panel('Legend', [component('ContextLegend', { compact: true, selectedKind: 'conversation' })]),
      ]),
    }),
  },
};

export const OverBudgetContextWindow: Story = {
  args: {
    node: component('Stack', { gap: 'md' }, [
      component('ContextBudgetBar', { snapshot: overBudgetSnapshot, showLegend: true }),
      component('Inline', { gap: 'sm', wrap: true }, [
        component('AnnotationBadge', { kind: 'evicted', label: 'eviction risk', selected: true }),
        component('Caption', { tone: 'warning' }, [text('Budget state is intentionally over the configured limit.')]),
      ]),
      component('ContextStripDiagram', { snapshot: overBudgetSnapshot, showLabels: true }),
    ]),
  },
};
