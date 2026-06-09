import type { Meta, StoryObj } from '@storybook/react-vite';
import { contextDefaultStyleSet, contextSignalOrangeStyleSet, contextWindowSnapshots } from '../../../context';
import { Panel, Stack } from '../../layout';
import { ContextStackDiagram } from './ContextStackDiagram';

const [, deepBug, atLimit] = contextWindowSnapshots;
const meta = { title: 'Component Library/Molecules/ContextStackDiagram', component: ContextStackDiagram, args: { snapshot: deepBug!, styleSet: contextDefaultStyleSet } } satisfies Meta<typeof ContextStackDiagram>;
export default meta;
type Story = StoryObj<typeof meta>;

export const GroupedContextWindow: Story = { render: () => <Panel title="layered call"><ContextStackDiagram snapshot={deepBug!} styleSet={contextDefaultStyleSet} /></Panel> };
export const SelectedLayer: Story = { render: () => <Panel title="selected scratchpad"><ContextStackDiagram snapshot={atLimit!} styleSet={contextDefaultStyleSet} selectedPartId="t31-scratchpad" /></Panel> };
export const Comparison: Story = { render: () => <Stack gap="md"><Panel title="turn 14"><ContextStackDiagram snapshot={deepBug!} styleSet={contextDefaultStyleSet} /></Panel><Panel title="turn 31"><ContextStackDiagram snapshot={atLimit!} styleSet={contextDefaultStyleSet} /></Panel><Panel title="turn 31 / signal orange"><ContextStackDiagram snapshot={atLimit!} styleSet={contextSignalOrangeStyleSet} /></Panel></Stack> };
