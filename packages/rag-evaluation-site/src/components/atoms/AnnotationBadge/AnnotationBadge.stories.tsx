import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inline } from '../../layout';
import { AnnotationBadge } from './AnnotationBadge';
const meta = { title: 'Design System/Atoms/AnnotationBadge', component: AnnotationBadge, args: { kind: 'context', label: 'Task framing' } } satisfies Meta<typeof AnnotationBadge>;
export default meta; type Story = StoryObj<typeof meta>;
export const Kinds: Story = { render: () => <Inline><AnnotationBadge kind="context" label="Task framing" /><AnnotationBadge kind="result" label="Tool result cost" /><AnnotationBadge kind="generated" label="Scratchpad" /><AnnotationBadge kind="active" label="Window rebuilt" selected /></Inline> };
