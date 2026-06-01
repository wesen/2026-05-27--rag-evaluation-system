import type { ReactNode } from 'react';
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
  return (
    <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} data-rag-component="RetrievalResultsPanel">
      <div className="panel-header">
        <span>
          {searchResult
            ? `${searchResult.retriever.toUpperCase()} — ${items.length} results`
            : 'Results'}
        </span>
        {searchResult && <span className="text-mono" style={{ fontSize: 10 }}>{searchResult.query}</span>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
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
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Idx</th>
              <th>Score</th>
              {retriever === 'hybrid' && <th>BM25</th>}
              {retriever === 'hybrid' && <th>Vec</th>}
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.chunk_id}
                className={`selectable ${selectedResult?.chunk_id === item.chunk_id ? 'selected' : ''}`}
                onClick={() => onSelectResult(selectedResult?.chunk_id === item.chunk_id ? null : item)}
              >
                <td className="num">{item.rank}</td>
                <td className="truncate" style={{ maxWidth: 160 }}>
                  {item.title}
                </td>
                <td className="num">{item.chunk_index}</td>
                <td className="num">{item.score.toFixed(4)}</td>
                {retriever === 'hybrid' && (
                  <td className="num">
                    {item.components?.bm25
                      ? <span className="accent-amber">#{item.components.bm25.rank} ({item.components.bm25.score.toFixed(3)})</span>
                      : <span className="text-dim">—</span>}
                  </td>
                )}
                {retriever === 'hybrid' && (
                  <td className="num">
                    {item.components?.vector
                      ? <span className="accent">#{item.components.vector.rank} ({item.components.vector.score.toFixed(3)})</span>
                      : <span className="text-dim">—</span>}
                  </td>
                )}
                <td className="truncate" style={{ maxWidth: 300 }}>{item.preview}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
