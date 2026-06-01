import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from './Stack';

const meta = {
  title: 'Design System/Layout/Stack',
  component: Stack,
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PanelStack: Story = {
  render: () => (
    <Stack gap="sm">
      <div className="panel"><div className="panel-header"><span>Query</span></div><div className="panel-body-condensed">Controls</div></div>
      <div className="panel"><div className="panel-header"><span>Coverage</span></div><div className="panel-body-condensed">204/204 embedded</div></div>
      <div className="panel"><div className="panel-header"><span>Presets</span></div><div className="panel-body-condensed">hydrangea pruning</div></div>
    </Stack>
  ),
};
