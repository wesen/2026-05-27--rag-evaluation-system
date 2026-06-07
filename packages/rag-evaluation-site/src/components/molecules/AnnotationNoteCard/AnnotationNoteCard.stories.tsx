import type { Meta, StoryObj } from '@storybook/react-vite';
import { transcriptFixture } from '../../../context';
import { Stack } from '../../layout';
import { AnnotationNoteCard } from './AnnotationNoteCard';
const meta = { title: 'Component Library/Molecules/AnnotationNoteCard', component: AnnotationNoteCard, args: { annotation: transcriptFixture.annotations[0]! } } satisfies Meta<typeof AnnotationNoteCard>;
export default meta; type Story = StoryObj<typeof meta>;
export const Notes: Story = { render: () => <Stack gap="sm">{transcriptFixture.annotations.map(annotation => <AnnotationNoteCard key={annotation.id} annotation={annotation} selected={annotation.id === transcriptFixture.selectedAnnotationId} />)}</Stack> };
