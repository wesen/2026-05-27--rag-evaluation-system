import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { contextHandoutFixture } from '../../../context';
import { HandoutDocumentShell } from './HandoutDocumentShell';

const meta = {
  title: 'Component Library/Organisms/HandoutDocumentShell',
  component: HandoutDocumentShell,
  args: {
    intro: contextHandoutFixture.intro,
    documents: contextHandoutFixture.docs,
    selectedDocumentId: contextHandoutFixture.docs[0]?.id,
    onDownload: () => {},
    onDownloadAll: () => {},
  },
} satisfies Meta<typeof HandoutDocumentShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FieldGuideSelected: Story = {};

export const ChecklistSelected: Story = {
  args: { selectedDocumentId: 'checklist' },
};

export const Interactive: Story = {
  render: () => {
    const [selectedDocumentId, setSelectedDocumentId] = useState(contextHandoutFixture.docs[0]?.id);
    return (
      <HandoutDocumentShell
        intro={contextHandoutFixture.intro}
        documents={contextHandoutFixture.docs}
        selectedDocumentId={selectedDocumentId}
        onDocumentSelect={setSelectedDocumentId}
        onDownload={() => {}}
        onDownloadAll={() => {}}
      />
    );
  },
};
