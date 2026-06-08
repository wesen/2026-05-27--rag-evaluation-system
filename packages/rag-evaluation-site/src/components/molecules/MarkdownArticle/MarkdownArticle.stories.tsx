import type { Meta, StoryObj } from '@storybook/react-vite';
import { contextHandoutFixture } from '../../../context';
import { MarkdownArticle } from './MarkdownArticle';

const meta = {
  title: 'Component Library/Molecules/MarkdownArticle',
  component: MarkdownArticle,
  args: { source: contextHandoutFixture.docs[0]!.body },
} satisfies Meta<typeof MarkdownArticle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FieldGuide: Story = {};

export const Checklist: Story = {
  args: { source: contextHandoutFixture.docs[1]!.body },
};
