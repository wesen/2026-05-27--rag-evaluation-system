import type { Meta, StoryObj } from '@storybook/react-vite';
import { contextDefaultStyleSet, contextPaletteOptions, contextStyleSetForPalette, contextWindowSnapshots, transcriptFixture, transcriptStyleSetForPalette, type ContextPaletteName, type ContextStyleSet } from '../context';
import { WidgetRenderer, type WidgetRendererProps } from './WidgetRenderer';
import { defaultWidgetRegistry } from './defaultRegistry';
import { component, text, type WidgetNode } from './ir';

const meta = { title: 'Widget IR/Renderer/Session Workspace', component: WidgetRenderer, args: { registry: defaultWidgetRegistry } } satisfies Meta<typeof WidgetRenderer>;
export default meta;
type Story = StoryObj<typeof meta>;
type PaletteControlsArgs = WidgetRendererProps & { palette: ContextPaletteName };

const snapshot = contextWindowSnapshots[1] ?? contextWindowSnapshots[0]!;

const sessionWorkspaceNavSections = [
  { id: 'session', label: 'Session', items: [{ id: 'upload', label: 'Upload', icon: component('ContextStudioNavIcon', { id: 'upload' }) }, { id: 'visualize', label: 'Visualize', icon: component('ContextStudioNavIcon', { id: 'visualize' }) }, { id: 'transcript', label: 'Transcript', icon: component('ContextStudioNavIcon', { id: 'transcript' }) }] },
];

function workspace(main: WidgetNode, activeItemId = 'visualize'): WidgetNode {
  return component('CourseStudioShell', {
    sections: sessionWorkspaceNavSections,
    activeItemId,
    title: 'Session workspace',
    subtitle: 'Upload · visualize · transcript',
    sidebarFooter: component('Caption', { tone: 'muted' }, [text('IR story · no live-session view')]),
    onNavigateAction: { kind: 'event', event: 'widget-ir:navigate' },
  }, [main]);
}

function visualizeNode(styleSet: ContextStyleSet): WidgetNode {
  return workspace(component('ContextDiagramPanel', {
    snapshot,
    styleSet,
    initialView: 'treemap',
    views: ['strip', 'budget', 'stack', 'treemap'],
    selectedPartId: snapshot.selectedPartId,
    showPartDetails: true,
  }), 'visualize');
}

function uploadNode(): WidgetNode {
  return workspace(component('Stack', { gap: 'md' }, [
    component('ContextUploadDropArea', {
      title: 'Drop an exported session JSON here',
      description: 'Upload first; then visualize token blocks or inspect the transcript.',
      onFilesSelectedAction: { kind: 'event', event: 'widget-ir:session-upload' },
    }),
    component('Caption', { tone: 'muted' }, [text('Accepted flow: upload → visualize / transcript.')]),
  ]), 'upload');
}

function transcriptNode(palette: ContextPaletteName): WidgetNode {
  return workspace(component('TranscriptWorkspacePanel', {
    title: transcriptFixture.title,
    subtitle: transcriptFixture.subtitle,
    messages: transcriptFixture.messages,
    annotations: transcriptFixture.annotations,
    selectedAnnotationId: transcriptFixture.selectedAnnotationId,
    showNotes: true,
    styleSet: transcriptStyleSetForPalette(palette),
  }), 'transcript');
}

export const PaletteControls: StoryObj<PaletteControlsArgs> = {
  args: {
    registry: defaultWidgetRegistry,
    palette: 'Dusty Magenta / Blue',
    node: visualizeNode(contextDefaultStyleSet),
  },
  argTypes: {
    palette: { control: 'select', options: contextPaletteOptions },
    node: { control: false },
    registry: { control: false },
    onAction: { control: false },
  },
  render: ({ palette, registry, onAction }) => <WidgetRenderer registry={registry} onAction={onAction} node={visualizeNode(contextStyleSetForPalette(palette))} />,
};

export const UploadWorkspace: Story = {
  args: {
    node: uploadNode(),
  },
};

export const VisualizeWorkspace: Story = {
  args: {
    node: visualizeNode(contextDefaultStyleSet),
  },
};

export const TranscriptWorkspace: StoryObj<PaletteControlsArgs> = {
  args: {
    registry: defaultWidgetRegistry,
    palette: 'Dusty Magenta / Blue',
  },
  argTypes: {
    palette: { control: 'select', options: contextPaletteOptions },
    node: { control: false },
    registry: { control: false },
    onAction: { control: false },
  },
  render: ({ palette, registry, onAction }) => <WidgetRenderer registry={registry} onAction={onAction} node={transcriptNode(palette)} />,
};
