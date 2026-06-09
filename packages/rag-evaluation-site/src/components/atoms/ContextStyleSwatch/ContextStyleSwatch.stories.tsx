import type { Meta, StoryObj } from '@storybook/react-vite';
import { contextDefaultStyleSet } from '../../../context';
import { Panel } from '../../layout';
import { ContextStyleSwatch } from './ContextStyleSwatch';

const meta = { title: 'Component Library/Atoms/ContextStyleSwatch', component: ContextStyleSwatch, args: { visualStyle: contextDefaultStyleSet.styles.result } } satisfies Meta<typeof ContextStyleSwatch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PatternGallery: Story = {
  render: () => (
    <Panel title="context style swatches">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Object.entries(contextDefaultStyleSet.styles).map(([key, visualStyle]) => <span key={key} title={key}><ContextStyleSwatch visualStyle={visualStyle} size="lg" /></span>)}
      </div>
    </Panel>
  ),
};
