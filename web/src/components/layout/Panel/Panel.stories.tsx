import type { Meta, StoryObj } from '@storybook/react-vite';
import { Panel } from './Panel';

const meta = { title: 'Design System/Layout/Panel', component: Panel } satisfies Meta<typeof Panel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Retrieval Results',
    children: 'Panel body content for a dashboard organism.',
  },
};

export const WithActions: Story = {
  render: () => (
    <Panel title="Inspector" actions={<button className="copy-btn">✕</button>} density="condensed">
      <div className="meta-grid">
        <span className="meta-key">Chunk</span><span className="meta-value">chunk_01HX7RAGDEMO</span>
        <span className="meta-key">Score</span><span className="meta-value">0.8421</span>
      </div>
    </Panel>
  ),
};
