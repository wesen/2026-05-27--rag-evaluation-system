import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inline } from './Inline';

const meta = { title: 'Design System/Layout/Inline', component: Inline } satisfies Meta<typeof Inline>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Toolbar: Story = {
  render: () => (
    <Inline gap="sm">
      <button className="btn btn-primary">Search</button>
      <button className="btn">Reset</button>
      <span className="text-mono text-dim">fixed-1200-150</span>
    </Inline>
  ),
};
