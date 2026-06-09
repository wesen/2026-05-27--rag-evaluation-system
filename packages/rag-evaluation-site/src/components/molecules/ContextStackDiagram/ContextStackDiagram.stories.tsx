import type { Meta, StoryObj } from '@storybook/react-vite';
import { contextPaletteOptions, contextSignalOrangeStyleSet, contextStyleSetForPalette, contextWindowSnapshots, type ContextPaletteName } from '../../../context';
import { Panel, Stack } from '../../layout';
import { ContextStackDiagram, type ContextStackDiagramProps } from './ContextStackDiagram';

const [, deepBug, atLimit] = contextWindowSnapshots;

type StoryArgs = Omit<ContextStackDiagramProps, 'styleSet'> & { palette: ContextPaletteName };

const meta = {
  title: 'Component Library/Molecules/ContextStackDiagram',
  args: { snapshot: deepBug!, palette: 'Dusty Magenta / Blue' },
  argTypes: {
    palette: { control: 'select', options: contextPaletteOptions },
    snapshot: { control: false },
    selectedPartId: { control: 'text' },
  },
} satisfies Meta<StoryArgs>;
export default meta;
type Story = StoryObj<StoryArgs>;

export const GroupedContextWindow: Story = {
  render: ({ palette }) => <Panel title={`layered call · ${palette}`}><ContextStackDiagram snapshot={deepBug!} styleSet={contextStyleSetForPalette(palette)} /></Panel>,
};

export const SelectedLayer: Story = {
  args: { selectedPartId: 't31-scratchpad' },
  render: ({ palette, selectedPartId }) => <Panel title={`selected scratchpad · ${palette}`}><ContextStackDiagram snapshot={atLimit!} styleSet={contextStyleSetForPalette(palette)} selectedPartId={selectedPartId} /></Panel>,
};

export const Comparison: Story = {
  render: ({ palette }) => {
    const styleSet = contextStyleSetForPalette(palette);
    return <Stack gap="md"><Panel title="turn 14"><ContextStackDiagram snapshot={deepBug!} styleSet={styleSet} /></Panel><Panel title="turn 31"><ContextStackDiagram snapshot={atLimit!} styleSet={styleSet} /></Panel><Panel title="turn 31 / signal orange reference"><ContextStackDiagram snapshot={atLimit!} styleSet={contextSignalOrangeStyleSet} /></Panel></Stack>;
  },
};
