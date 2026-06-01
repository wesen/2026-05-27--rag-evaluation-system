import type { ReactNode } from 'react';
import { Caption } from '../../foundation';
import { Panel, ScrollRegion } from '../../layout';
import { DataTable, type DataTableColumn } from '../../molecules';
import type { RetrievalResult, SearchResult } from '../../../services/api';
import type { RetrieverType } from '../SearchControlsPanel';

export interface RetrievalResultsPanelProps {
  searchResult: SearchResult | null;
  items: RetrievalResult[];
  retriever: RetrieverType;
  selectedResult: RetrievalResult | null;
  searchError: string | null;
  isLoading: boolean;
  onSelectResult: (result: RetrievalResult | null) => void;
  emptyHint?: ReactNode;
}

export function RetrievalResultsPanel({
  searchResult,
  items,
  retriever,
  selectedResult,
  searchError,
  isLoading,
  onSelectResult,
  emptyHint,
}: RetrievalResultsPanelProps) {
  const columns: DataTableColumn<RetrievalResult>[] = [
    { id: 'rank', header: '#', align: 'end', cell: (item) => item.rank },
    { id: 'title', header: 'Title', maxWidth: 160, cell: (item) => item.title },
    { id: 'chunkIndex', header: 'Idx', align: 'end', cell: (item) => item.chunk_index },
    { id: 'score', header: 'Score', align: 'end', cell: (item) => item.score.toFixed(4) },
    ...(retriever === 'hybrid'
      ? [
          {
            id: 'bm25',
            header: 'BM25',
            align: 'end' as const,
            cell: (item: RetrievalResult) => item.components?.bm25
              ? <Caption tone="warning">#{item.components.bm25.rank} ({item.components.bm25.score.toFixed(3)})</Caption>
              : <Caption>—</Caption>,
          },
          {
            id: 'vector',
            header: 'Vec',
            align: 'end' as const,
            cell: (item: RetrievalResult) => item.components?.vector
              ? <Caption tone="accent">#{item.components.vector.rank} ({item.components.vector.score.toFixed(3)})</Caption>
              : <Caption>—</Caption>,
          },
        ]
      : []),
    { id: 'preview', header: 'Preview', maxWidth: 300, cell: (item) => item.preview },
  ];

  return (
    <Panel
      fill
      title={searchResult ? `${searchResult.retriever.toUpperCase()} — ${items.length} results` : 'Results'}
      actions={searchResult && <Caption>{searchResult.query}</Caption>}
      data-rag-component="RetrievalResultsPanel"
    >
      <ScrollRegion axis="y" style={{ height: '100%' }}>
        {searchError && <div className="error-box" style={{ margin: 6 }}>{searchError}</div>}
        {items.length === 0 && !searchError && !isLoading && (
          <div style={{ padding: 24, textAlign: 'center' }} className="text-dim">
            {emptyHint ?? (searchResult ? 'No results found.' : 'Enter a query and press Search.')}
          </div>
        )}
        {isLoading && (
          <div style={{ padding: 24, textAlign: 'center' }} className="text-dim">
            Searching…
          </div>
        )}
        {items.length > 0 && (
          <DataTable
            rows={items}
            columns={columns}
            getRowKey={(item) => item.chunk_id}
            selectedKey={selectedResult?.chunk_id ?? null}
            onRowSelect={(item) => onSelectResult(selectedResult?.chunk_id === item.chunk_id ? null : item)}
          />
        )}
      </ScrollRegion>
    </Panel>
  );
}
