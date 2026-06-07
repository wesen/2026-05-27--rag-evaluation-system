import type { Meta, StoryObj } from '@storybook/react-vite';
import { WidgetRenderer } from './WidgetRenderer';
import { component, element, text, type JsonObject, type WidgetNode } from './ir';

const meta = { title: 'Widget IR/Renderer', component: WidgetRenderer } satisfies Meta<typeof WidgetRenderer>;
export default meta;
type Story = StoryObj<typeof meta>;

const sourceRows: JsonObject[] = [
  { id: 'src_tree_center', name: 'The Tree Center', type: 'wordpress', documents: 1284, chunks: 38492, embedded: 38121, coverage: 99, status: 'done', url: 'https://www.thetreecenter.com' },
  { id: 'src_arxiv', name: 'ArXiv RAG papers with a very long title-like source name', type: 'pdf', documents: 316, chunks: 11204, embedded: 4800, coverage: 43, status: 'partial', url: 'https://arxiv.org' },
  { id: 'src_failed', name: 'Broken import batch', type: 'filesystem', documents: 18, chunks: 901, embedded: 0, coverage: 0, status: 'failed', url: 'https://example.invalid' },
];

const retrievalRows: JsonObject[] = [
  { id: 'chunk_001', rank: 1, title: 'Fast Growing Trees', chunk_index: 12, score: 0.842134, retriever: 'hybrid', preview: 'Crape myrtle grows quickly in warm climates and benefits from full sun exposure.', bm25_rank: 3, vector_rank: 1, url: 'https://example.com/trees' },
  { id: 'chunk_002', rank: 2, title: 'Arborvitae Spacing', chunk_index: 8, score: 0.712991, retriever: 'hybrid', preview: 'Spacing depends on cultivar and desired hedge density.', bm25_rank: 1, vector_rank: 4, url: 'https://example.com/arborvitae' },
  { id: 'chunk_003', rank: 3, title: 'Hydrangea Care', chunk_index: 21, score: 0.6412, retriever: 'bm25', preview: 'Hydrangeas prefer moist soil and partial shade in hot climates.', bm25_rank: 2, vector_rank: 9, url: 'https://example.com/hydrangea' },
];

const workflowRows: JsonObject[] = [
  { id: 'wf_intake_001', status: 'running', strategy: 'fixed-500', ops: '14/41', age: '4m' },
  { id: 'wf_intake_002', status: 'succeeded', strategy: 'semantic-512', ops: '88/88', age: '2h' },
  { id: 'wf_intake_003', status: 'failed', strategy: 'fixed-800', ops: '9/17', age: '1d' },
];

function panel(title: string, children: WidgetNode[], actions?: WidgetNode): WidgetNode {
  return component('Panel', { title, actions, density: 'condensed' }, children);
}

function caption(value: string, tone: 'muted' | 'accent' | 'success' | 'warning' | 'danger' = 'muted'): WidgetNode {
  return component('Caption', { tone }, [text(value)]);
}

function status(value: string, icon = true): WidgetNode {
  return component('StatusText', { status: value, icon }, [text(value)]);
}

export const PrimitiveAtoms: Story = {
  args: {
    node: component('Stack', { gap: 'md' }, [
      panel('Buttons', [
        component('Inline', { gap: 'sm', wrap: true }, [
          component('Button', {}, [text('Default')]),
          component('Button', { variant: 'primary' }, [text('Primary')]),
          component('Button', { selected: true }, [text('Selected')]),
          component('Button', { size: 'compact' }, [text('Compact')]),
          component('Button', { disabled: true }, [text('Disabled')]),
        ]),
      ]),
      panel('Inputs', [
        component('Stack', { gap: 'sm' }, [
          component('TextInput', { placeholder: 'Enter query…', value: 'crape myrtle spacing' }),
          component('SelectInput', { value: 'hybrid', options: [
            { value: 'bm25', label: 'BM25' },
            { value: 'vector', label: 'Vector' },
            { value: 'hybrid', label: 'Hybrid' },
          ] }),
        ]),
      ]),
    ]),
  },
};

export const FoundationStatuses: Story = {
  args: {
    node: panel('Status and caption combinations', [
      component('Stack', { gap: 'sm' }, [
        component('Inline', { gap: 'md', wrap: true }, ['pending', 'ready', 'running', 'succeeded', 'done', 'partial', 'warning', 'failed', 'error', 'canceled'].map((s) => status(s))),
        component('Inline', { gap: 'md', wrap: true }, [
          caption('muted'),
          caption('accent', 'accent'),
          caption('success', 'success'),
          caption('warning', 'warning'),
          caption('danger', 'danger'),
          component('Caption', { transform: 'uppercase' }, [text('uppercase label')]),
        ]),
      ]),
    ]),
  },
};

export const LayoutRecipes: Story = {
  args: {
    node: component('Stack', { gap: 'lg' }, [
      component('DashboardGrid', { recipe: 'twoColumn' }, [
        panel('Left Panel', [caption('Two-column dashboard grid, left side.')]),
        panel('Right Panel', [caption('Two-column dashboard grid, right side.')]),
      ]),
      component('DashboardGrid', { recipe: 'searchWorkbench' }, [
        panel('Search Controls Width', [caption('Narrow control panel.')]),
        component('Panel', { title: 'Results Fill', fill: true }, [caption('Wide result panel.')]),
      ]),
    ]),
  },
};

export const MetadataGridVariants: Story = {
  args: {
    node: component('DashboardGrid', { recipe: 'twoColumn' }, [
      panel('Normal metadata', [
        component('MetadataGrid', { items: [
          { key: 'Document ID', value: 'doc_01HX7RAGDEMO', copyValue: 'doc_01HX7RAGDEMO' },
          { key: 'Source', value: 'The Tree Center' },
          { key: 'Status', value: status('done') },
          { key: 'Coverage', value: caption('99%', 'success') },
        ] }),
      ]),
      panel('Compact metadata', [
        component('MetadataGrid', { density: 'compact', items: [
          { key: 'Strategy', value: caption('fixed-500') },
          { key: 'Provider', value: 'ollama/nomic-embed-text' },
          { key: 'Dimensions', value: 768 },
          { key: 'Missing', value: caption('371', 'warning') },
        ] }),
      ]),
    ]),
  },
};

export const DataTableCellKinds: Story = {
  args: {
    node: panel('Source coverage table', [
      component('DataTable', {
        rows: sourceRows,
        getRowKey: { field: 'id' },
        selectedKey: 'src_arxiv',
        columns: [
          { id: 'name', header: 'Source', maxWidth: 220, cell: { kind: 'field', field: 'name' } },
          { id: 'type', header: 'Type', cell: { kind: 'caption', field: 'type', tone: 'accent' } },
          { id: 'docs', header: 'Docs', align: 'end', cell: { kind: 'number', field: 'documents' } },
          { id: 'chunks', header: 'Chunks', align: 'end', cell: { kind: 'number', field: 'chunks' } },
          { id: 'coverage', header: 'Cov', align: 'end', cell: { kind: 'template', template: '$coverage%' } },
          { id: 'status', header: 'Status', cell: { kind: 'status', field: 'status', icon: true } },
          { id: 'link', header: 'Link', cell: { kind: 'link', hrefField: 'url', labelField: 'type', target: '_blank' } },
        ],
      }),
    ]),
  },
};

export const DataTableEmptyAndMalformed: Story = {
  args: {
    node: component('DashboardGrid', { recipe: 'twoColumn' }, [
      panel('Empty table', [
        component('DataTable', {
          rows: [],
          getRowKey: { field: 'id' },
          emptyMessage: 'No workflows with status "running".',
          columns: [
            { id: 'status', header: 'Status', cell: { kind: 'status', field: 'status' } },
            { id: 'id', header: 'Workflow ID', cell: { kind: 'field', field: 'id' } },
          ],
        }),
      ]),
      panel('Unknown widget boundary', [
        component('DefinitelyNotAWidget', {}, [text('This should render an error callout.')]),
      ]),
    ]),
  },
};

export const SearchWorkbenchComposition: Story = {
  args: {
    node: component('AppShell', {
      header: component('AppNav', {
        brand: '◉ RAG Eval',
        activeItemId: 'search',
        items: [
          { id: 'search', label: 'Search' },
          { id: 'corpus', label: 'Corpus' },
          { id: 'workflows', label: 'Workflows' },
          { id: 'dsl', label: 'DSL' },
        ],
      }),
    }, [
      component('DashboardGrid', { recipe: 'searchWorkbench' }, [
        panel('Search', [
          component('Stack', { gap: 'sm' }, [
            component('FormRow', { label: 'Query', control: component('TextInput', { placeholder: 'Enter query…', value: 'how fast do crape myrtles grow?' }) }),
            component('Inline', { gap: 'sm' }, [
              component('Button', { variant: 'primary' }, [text('▶ Search')]),
              component('Button', { selected: true }, [text('hybrid')]),
              component('Button', {}, [text('bm25')]),
              component('Button', {}, [text('vector')]),
            ]),
            component('FormRow', { label: 'BM25 Index', control: component('TextInput', { value: 'trees-default' }) }),
            component('FormRow', { label: 'Strategy', control: component('TextInput', { value: 'fixed-500' }) }),
            component('ScrollRegion', { axis: 'y', style: { maxHeight: '160px' } }, sourceRows.map((row) => component('Caption', { tone: row.status === 'failed' ? 'danger' : 'muted', truncate: true }, [text(String(row.name))]))),
          ]),
        ]),
        component('Panel', { title: 'HYBRID — 3 results', fill: true, actions: caption('how fast do crape myrtles grow?') }, [
          component('ScrollRegion', { axis: 'y', style: { height: '100%' } }, [
            component('DataTable', {
              rows: retrievalRows,
              getRowKey: { field: 'id' },
              selectedKey: 'chunk_001',
              columns: [
                { id: 'rank', header: '#', align: 'end', cell: { kind: 'number', field: 'rank' } },
                { id: 'title', header: 'Title', maxWidth: 180, cell: { kind: 'field', field: 'title' } },
                { id: 'score', header: 'Score', align: 'end', cell: { kind: 'number', field: 'score', format: 'fixed', digits: 4 } },
                { id: 'bm25', header: 'BM25', align: 'end', cell: { kind: 'template', template: '#$bm25_rank' } },
                { id: 'vector', header: 'Vec', align: 'end', cell: { kind: 'template', template: '#$vector_rank' } },
                { id: 'preview', header: 'Preview', maxWidth: 320, cell: { kind: 'field', field: 'preview' } },
              ],
            }),
          ]),
        ]),
      ]),
    ]),
  },
};

export const CorpusExplorerSkeleton: Story = {
  args: {
    node: component('AppShell', {
      header: component('AppNav', {
        brand: '◉ RAG Eval',
        activeItemId: 'corpus',
        items: [
          { id: 'search', label: 'Search' },
          { id: 'corpus', label: 'Corpus' },
          { id: 'workflows', label: 'Workflows' },
        ],
      }),
    }, [
      component('Stack', { gap: 'md' }, [
        panel('Embedding Identity', [
          component('Inline', { gap: 'md' }, [
            component('FormRow', { label: 'Strategy', control: component('SelectInput', { value: 'fixed-500', options: [{ value: 'fixed-500', label: 'fixed-500' }, { value: 'semantic-512', label: 'semantic-512' }] }) }),
            component('FormRow', { label: 'Provider', control: component('TextInput', { value: 'ollama' }) }),
            component('FormRow', { label: 'Model', control: component('TextInput', { value: 'nomic-embed-text' }) }),
            component('FormRow', { label: 'Dims', control: component('TextInput', { type: 'number', value: 768 }) }),
            caption('1618 docs · 50597 chunks · 42921 embedded'),
          ]),
        ]),
        component('DashboardGrid', { recipe: 'corpusExplorer' }, [
          panel('Sources', [component('DataTable', {
            rows: sourceRows,
            getRowKey: { field: 'id' },
            selectedKey: 'src_tree_center',
            columns: [
              { id: 'name', header: 'Source', cell: { kind: 'field', field: 'name' } },
              { id: 'docs', header: 'Docs', align: 'end', cell: { kind: 'number', field: 'documents' } },
            ],
          })]),
          panel('The Tree Center — Documents', [component('ScrollRegion', { axis: 'y', style: { maxHeight: '570px' } }, [component('DataTable', {
            rows: retrievalRows,
            getRowKey: { field: 'id' },
            selectedKey: 'chunk_002',
            columns: [
              { id: 'title', header: 'Title', maxWidth: 300, cell: { kind: 'field', field: 'title' } },
              { id: 'chunk', header: 'Chunk', align: 'end', cell: { kind: 'number', field: 'chunk_index' } },
              { id: 'status', header: 'Status', cell: { kind: 'constant', value: status('done') } },
            ],
          })])]),
          panel('Inspector', [
            component('TabList', { activeId: 'overview', items: [{ id: 'overview', label: 'overview' }, { id: 'text', label: 'text' }, { id: 'chunks', label: 'chunks' }, { id: 'coverage', label: 'coverage' }] }),
            component('MetadataGrid', { items: [
              { key: 'ID', value: 'doc_01HX7RAGDEMO', copyValue: 'doc_01HX7RAGDEMO' },
              { key: 'URL', value: element('a', { href: 'https://example.com/tree', target: '_blank' }, [text('source')]) },
              { key: 'Words', value: '2,841' },
              { key: 'Embedded', value: caption('37/42', 'warning') },
            ] }),
          ]),
        ]),
      ]),
    ]),
  },
};

export const WorkflowDashboardSkeleton: Story = {
  args: {
    node: component('DashboardGrid', { recipe: 'twoColumn' }, [
      panel('Workflows (3)', [
        component('DataTable', {
          rows: workflowRows,
          getRowKey: { field: 'id' },
          selectedKey: 'wf_intake_001',
          columns: [
            { id: 'status', header: 'Status', cell: { kind: 'status', field: 'status', icon: true } },
            { id: 'id', header: 'Workflow ID', maxWidth: 260, cell: { kind: 'field', field: 'id' } },
            { id: 'strategy', header: 'Strategy', cell: { kind: 'caption', field: 'strategy' } },
            { id: 'ops', header: 'Ops', align: 'end', cell: { kind: 'field', field: 'ops' } },
            { id: 'age', header: 'Age', cell: { kind: 'caption', field: 'age' } },
          ],
        }),
      ], component('SelectInput', { value: '', options: [{ value: '', label: 'all' }, { value: 'running', label: 'running' }, { value: 'failed', label: 'failed' }] })),
      panel('Workflow Summary', [
        component('MetadataGrid', { density: 'compact', items: [
          { key: 'Strategy', value: caption('fixed-500') },
          { key: 'Docs', value: 1284 },
          { key: 'Running', value: status('running') },
          { key: 'Failed', value: status('failed') },
        ] }),
        component('Inline', { justify: 'end' }, [
          component('Button', {}, [text('Cancel')]),
          component('Button', { variant: 'primary' }, [text('View in Corpus →')]),
        ]),
      ], status('running')),
    ]),
  },
};
