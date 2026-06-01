import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisuallyHidden } from './VisuallyHidden';

const meta = {
  title: 'Design System/Foundation/VisuallyHidden',
  component: VisuallyHidden,
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AccessibleLabel: Story = {
  render: () => (
    <button className="btn">
      ⧉
      <VisuallyHidden>Copy chunk identifier</VisuallyHidden>
    </button>
  ),
};
