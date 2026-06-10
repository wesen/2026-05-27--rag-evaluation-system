import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { contextHandoutFixture, contextWindowSnapshots } from '../../../context';
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

export const IllustratedHandout: Story = {
  args: {
    selectedDocumentId: 'illustrated',
    documents: [
      {
        id: 'illustrated',
        title: 'Illustrated Context Checklist',
        file: 'illustrated-context-checklist.md',
        format: 'Markdown',
        size: '5 KB',
        description: 'A handout with prose, an image, and an embedded context-window diagram.',
        body: '# Illustrated Context Checklist\n\n![Budget sketch](/course-assets/context-window-token-budget.svg)\n',
        blocks: [
          { kind: 'markdown', id: 'intro', source: '# Illustrated Context Checklist\n\nImages render as bounded figures.\n\n![Budget sketch](/course-assets/context-window-token-budget.svg)' },
          { kind: 'context-window', id: 'diagram', snapshot: contextWindowSnapshots[0]!, view: 'budget', caption: 'Token budget' },
          { kind: 'markdown', id: 'outro', source: '## Review prompt\n\nWhat should survive into the next model call?' },
        ],
      },
    ],
  },
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
