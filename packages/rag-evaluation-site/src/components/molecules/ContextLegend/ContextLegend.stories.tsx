import type { Meta, StoryObj } from '@storybook/react-vite';
import { contextDefaultStyleSet, contextThreeLabelStyleSets } from '../../../context';
import { Caption } from '../../foundation';
import { Panel, Stack } from '../../layout';
import { ContextLegend } from './ContextLegend';

const meta = {
  title: 'Component Library/Molecules/ContextLegend',
  component: ContextLegend,
  args: { items: contextDefaultStyleSet.legend, styles: contextDefaultStyleSet.styles, size: 'md' },
} satisfies Meta<typeof ContextLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultStyleSet: Story = {
  render: () => <Panel title="default context-window legend"><ContextLegend items={contextDefaultStyleSet.legend} styles={contextDefaultStyleSet.styles} selectedId="active" /></Panel>,
};

export const Sizes: Story = {
  render: () => (
    <Stack gap="md">
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <Panel key={size} title={`${size} legend`}>
          <ContextLegend items={contextDefaultStyleSet.legend.slice(0, 8)} styles={contextDefaultStyleSet.styles} size={size} selectedId="result" />
        </Panel>
      ))}
    </Stack>
  ),
};

export const CustomThreeLabelLegend: Story = {
  render: () => {
    const styleSet = contextThreeLabelStyleSets[0]!;
    return (
      <Stack gap="sm">
        <Caption>Caller-defined legend labels and palette size (3 visible labels)</Caption>
        <ContextLegend items={styleSet.legend} styles={styleSet.styles} selectedId="evidence" />
      </Stack>
    );
  },
};
