import React, { useState } from 'react';
import { CorpusDocumentRow } from '../../services/api';

interface DocumentBrowserProps {
  documents: CorpusDocumentRow[];
  isLoading: boolean;
  sourceName: string | null;
  totalDocs: number;
  selectedDocId: string;
  onSelectDocument: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

export const DocumentBrowser: React.FC<DocumentBrowserProps> = ({
  documents, isLoading, sourceName, totalDocs, selectedDocId, onSelectDocument, onLoadMore, hasMore,
}) => {
  const [search, setSearch] = useState('');

  const filtered = search
    ? documents.filter((d) =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase())
      )
    : documents;

  return (
    <div className="panel" style={{ flex: 1, minWidth: 0 }}>
      <div className="panel-header">
        <span>{sourceName ? `${sourceName} — Documents` : 'Documents'}</span>
        {sourceName && (
          <span className="text-mono" style={{ fontSize: 10 }}>
            {totalDocs} docs
          </span>
        )}
      </div>
      {sourceName && (
        <div style={{ padding: '3px 6px', borderBottom: '1px solid var(--mac-border)' }}>
          <input
            className="input"
            placeholder="Search title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', fontSize: 11 }}
          />
        </div>
      )}
      <div className="panel-body-condensed" style={{ overflowY: 'auto', maxHeight: 570 }}>
        {!sourceName ? (
          <span className="text-dim text-mono">Select a source to browse documents.</span>
        ) : isLoading ? (
          <span className="text-dim text-mono">Loading...</span>
        ) : filtered.length === 0 ? (
          <span className="text-dim text-mono">{search ? 'No matching documents.' : 'No documents found.'}</span>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Words</th>
                  <th>Chunks</th>
                  <th>Embed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`selectable ${doc.id === selectedDocId ? 'selected' : ''}`}
                    onClick={() => onSelectDocument(doc.id)}
                  >
                    <td className="truncate" style={{ maxWidth: 300 }}>{doc.title}</td>
                    <td className="num">{doc.word_count.toLocaleString()}</td>
                    <td className="num">{doc.chunk_count}</td>
                    <td className="num">
                      {doc.chunk_count > 0 ? (
                        <span className={doc.embedded_count === doc.chunk_count ? 'accent-green' : doc.embedded_count > 0 ? 'accent-amber' : 'accent-dim'}>
                          {doc.embedded_count}/{doc.chunk_count}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`status-${doc.status === 'chunked' ? 'done' : doc.status}`}>{doc.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div style={{ padding: '4px 0', textAlign: 'center' }}>
                <button className="btn" onClick={onLoadMore} style={{ fontSize: 11 }}>
                  Load more ({totalDocs - documents.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
