import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AppNav as PackageAppNav,
  Button as PackageButton,
  Caption as PackageCaption,
  DataTable as PackageDataTable,
  MetadataGrid as PackageMetadataGrid,
  Panel as PackagePanel,
  Stack as PackageStack,
  type DataTableColumn,
} from '@go-go-golems/rag-evaluation-site';
import { Button as LocalButton } from './atoms/Button/Button';
import { Caption as LocalCaption } from './foundation/Caption/Caption';
import { Panel as LocalPanel } from './layout/Panel/Panel';
import { Stack as LocalStack } from './layout/Stack/Stack';
import { AppNav as LocalAppNav } from './molecules/AppNav/AppNav';
import { DataTable as LocalDataTable, type DataTableColumn as LocalDataTableColumn } from './molecules/DataTable/DataTable';
import { MetadataGrid as LocalMetadataGrid } from './molecules/MetadataGrid/MetadataGrid';

interface Row {
  id: string;
  label: string;
  status: string;
  score: number;
}

const rows: Row[] = [
  { id: 'ctx', label: 'Context history', status: 'running', score: 42 },
  { id: 'tool', label: 'Tool output', status: 'succeeded', score: 87 },
  { id: 'scratch', label: 'Scratchpad', status: 'pending', score: 12 },
];

const localColumns: LocalDataTableColumn<Row>[] = [
  { id: 'label', header: 'Segment', cell: (row) => row.label },
  { id: 'status', header: 'Status', cell: (row) => row.status },
  { id: 'score', header: 'Score', align: 'end', cell: (row) => row.score },
];

const packageColumns: DataTableColumn<Row>[] = localColumns;

const meta = {
  title: 'Design System/Package Parity',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SharedComponents: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 24, background: 'var(--mac-bg)' }}>
      <section data-cvd="local-shared-components">
        <LocalStack gap="md">
          <LocalCaption transform="uppercase">Shared components</LocalCaption>
          <LocalAppNav
            brand="RAG Evaluation"
            activeItemId="context"
            items={[
              { id: 'context', label: 'Context' },
              { id: 'transcript', label: 'Transcript' },
              { id: 'annotations', label: 'Annotations' },
            ]}
            onItemSelect={() => {}}
          />
          <LocalPanel
            title="Context Window"
            actions={<LocalButton size="compact" variant="primary">Run</LocalButton>}
          >
            <LocalStack gap="sm">
              <LocalCaption>Representative shared primitives, layout, and molecules.</LocalCaption>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <LocalButton>Default</LocalButton>
                <LocalButton variant="primary">Primary</LocalButton>
                <LocalButton selected>Selected</LocalButton>
                <LocalButton disabled>Disabled</LocalButton>
              </div>
              <LocalMetadataGrid
                density="compact"
                items={[
                  { key: 'Used', value: '98,600 tokens' },
                  { key: 'Free', value: '101,400 tokens' },
                  { key: 'Limit', value: '200,000 tokens' },
                ]}
              />
              <LocalDataTable
                rows={rows}
                columns={localColumns}
                getRowKey={(row) => row.id}
                selectedKey="tool"
              />
            </LocalStack>
          </LocalPanel>
        </LocalStack>
      </section>

      <section data-cvd="package-shared-components">
        <PackageStack gap="md">
          <PackageCaption transform="uppercase">Shared components</PackageCaption>
          <PackageAppNav
            brand="RAG Evaluation"
            activeItemId="context"
            items={[
              { id: 'context', label: 'Context' },
              { id: 'transcript', label: 'Transcript' },
              { id: 'annotations', label: 'Annotations' },
            ]}
            onItemSelect={() => {}}
          />
          <PackagePanel
            title="Context Window"
            actions={<PackageButton size="compact" variant="primary">Run</PackageButton>}
          >
            <PackageStack gap="sm">
              <PackageCaption>Representative shared primitives, layout, and molecules.</PackageCaption>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <PackageButton>Default</PackageButton>
                <PackageButton variant="primary">Primary</PackageButton>
                <PackageButton selected>Selected</PackageButton>
                <PackageButton disabled>Disabled</PackageButton>
              </div>
              <PackageMetadataGrid
                density="compact"
                items={[
                  { key: 'Used', value: '98,600 tokens' },
                  { key: 'Free', value: '101,400 tokens' },
                  { key: 'Limit', value: '200,000 tokens' },
                ]}
              />
              <PackageDataTable
                rows={rows}
                columns={packageColumns}
                getRowKey={(row) => row.id}
                selectedKey="tool"
              />
            </PackageStack>
          </PackagePanel>
        </PackageStack>
      </section>
    </div>
  ),
};
