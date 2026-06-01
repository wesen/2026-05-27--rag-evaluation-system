import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardGrid } from './DashboardGrid';

const meta = { title: 'Design System/Layout/DashboardGrid', component: DashboardGrid } satisfies Meta<typeof DashboardGrid>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SearchWorkbench: Story = {
  render: () => (
    <DashboardGrid recipe="searchWorkbench">
      <div className="panel"><div className="panel-header"><span>Controls</span></div><div className="panel-body-condensed">Query, retriever, filters</div></div>
      <div className="panel"><div className="panel-header"><span>Results</span></div><div className="panel-body-condensed">Ranked evidence table</div></div>
      <div className="panel"><div className="panel-header"><span>Inspector</span></div><div className="panel-body-condensed">Selected chunk and document context</div></div>
    </DashboardGrid>
  ),
};

export const CorpusExplorer: Story = {
  render: () => (
    <DashboardGrid recipe="corpusExplorer">
      <div className="panel"><div className="panel-header"><span>Sources</span></div><div className="panel-body-condensed">Corpus source list</div></div>
      <div className="panel"><div className="panel-header"><span>Documents</span></div><div className="panel-body-condensed">Document browser</div></div>
      <div className="panel"><div className="panel-header"><span>Document Inspector</span></div><div className="panel-body-condensed">Text, chunks, coverage, artifacts</div></div>
    </DashboardGrid>
  ),
};
