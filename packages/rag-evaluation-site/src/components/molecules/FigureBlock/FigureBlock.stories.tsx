import type { Meta, StoryObj } from '@storybook/react-vite';
import { contextDefaultStyleSet, contextWindowSnapshots } from '../../../context';
import { ContextLegend, ContextStripDiagram } from '../index';
import { FigureBlock } from './FigureBlock';

const snapshot = contextWindowSnapshots[1]!;
const meta = {
  title: 'Component Library/Molecules/FigureBlock',
  component: FigureBlock,
  args: {
    caption: 'context window — 200,000 tokens',
    legend: <ContextLegend items={contextDefaultStyleSet.legend} styles={contextDefaultStyleSet.styles} size="sm" />,
    children: <ContextStripDiagram snapshot={snapshot} styleSet={contextDefaultStyleSet} />,
  },
} satisfies Meta<typeof FigureBlock>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DiagramFigure: Story = {};
export const BorderedFigure: Story = { args: { frame: 'bordered' } };
