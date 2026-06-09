import type { Meta, StoryObj } from '@storybook/react-vite';
import { contextDefaultStyleSet } from '../../../context';
import { Inline } from '../../layout';
import { AnnotationBadge } from './AnnotationBadge';

const meta = { title: 'Design System/Atoms/AnnotationBadge', component: AnnotationBadge, args: { visualStyle: contextDefaultStyleSet.styles.context, label: 'Task framing' } } satisfies Meta<typeof AnnotationBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Styles: Story = {
  args: { visualStyle: contextDefaultStyleSet.styles.context, label: 'Task framing' },
  render: () => (
    <Inline>
      <AnnotationBadge visualStyle={contextDefaultStyleSet.styles.context!} label="Task framing" />
      <AnnotationBadge visualStyle={contextDefaultStyleSet.styles.result!} label="Tool result cost" />
      <AnnotationBadge visualStyle={contextDefaultStyleSet.styles.generated!} label="Scratchpad" />
      <AnnotationBadge visualStyle={contextDefaultStyleSet.styles.active!} label="Window rebuilt" selected />
    </Inline>
  ),
};
