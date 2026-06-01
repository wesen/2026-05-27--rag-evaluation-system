import { Fragment, useState } from 'react';
import type { CorpusDocumentDetail, RetrievalResult } from '../../../services/api';

export interface ResultInspectorPanelProps {
  result: RetrievalResult;
  docDetail: CorpusDocumentDetail | null | undefined;
  onClose: () => void;
  onOpenInCorpus: () => void;
}

export function ResultInspectorPanel({ result, docDetail, onClose, onOpenInCorpus }: ResultInspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<'detail' | 'chunk' | 'document'>('detail');


  // Find the current chunk in document detail
  const currentChunk = docDetail?.chunks?.find(c => c.id === result.chunk_id);
  const chunkIndex = docDetail?.chunks?.findIndex(c => c.id === result.chunk_id) ?? -1;
  const prevChunk = chunkIndex > 0 ? docDetail!.chunks[chunkIndex - 1] : null;
  const nextChunk = chunkIndex >= 0 && chunkIndex < (docDetail?.chunks?.length ?? 0) - 1
    ? docDetail!.chunks[chunkIndex + 1]
    : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <span>Inspector — Rank #{result.rank}</span>
        <div className="panel-header-controls">
          <button className="btn" style={{ fontSize: 10 }} onClick={onOpenInCorpus}>
            Open in Corpus
          </button>
          <button className="btn" style={{ fontSize: 10 }} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {(['detail', 'chunk', 'document'] as const).map(tab => (
          <span
            key={tab}
            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </span>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {activeTab === 'detail' && (
          <>
            {/* Scores */}
            <div className="section-title">Scores</div>
            <div className="meta-grid" style={{ marginBottom: 8 }}>
              <span className="meta-key">Retriever</span>
              <span className={`stat-value ${result.retriever === 'bm25' ? 'accent-amber' : result.retriever === 'vector' ? 'accent' : ''}`}>
                {result.retriever.toUpperCase()}
              </span>
              <span className="meta-key">Score</span>
              <span className="stat-value">{result.score.toFixed(6)}</span>
              {result.components?.bm25 && (
                <>
                  <span className="meta-key">BM25</span>
                  <span className="stat-value accent-amber">rank #{result.components.bm25.rank}, score {result.components.bm25.score.toFixed(4)}</span>
                </>
              )}
              {result.components?.vector && (
                <>
                  <span className="meta-key">Vector</span>
                  <span className="stat-value accent">rank #{result.components.vector.rank}, score {result.components.vector.score.toFixed(4)}</span>
                </>
              )}
            </div>

            {/* IDs */}
            <div className="section-title">Identity</div>
            <div className="meta-grid" style={{ marginBottom: 8 }}>
              <span className="meta-key">Title</span>
              <span className="meta-value">{result.title}</span>
              <span className="meta-key">Chunk ID</span>
              <span className="meta-value">
                {result.chunk_id}
                <button className="copy-btn" onClick={() => copyToClipboard(result.chunk_id)}>⧉</button>
              </span>
              <span className="meta-key">Document ID</span>
              <span className="meta-value">
                {result.document_id}
                <button className="copy-btn" onClick={() => copyToClipboard(result.document_id)}>⧉</button>
              </span>
              <span className="meta-key">Source ID</span>
              <span className="meta-value">
                {result.source_id}
                <button className="copy-btn" onClick={() => copyToClipboard(result.source_id)}>⧉</button>
              </span>
              {result.url && (
                <>
                  <span className="meta-key">URL</span>
                  <span className="meta-value accent">{result.url}</span>
                </>
              )}
              <span className="meta-key">Chunk Index</span>
                  <span className="meta-value">{result.chunk_index}</span>
              <span className="meta-key">Strategy</span>
              <span className="meta-value">{result.strategy_id}</span>
            </div>

            {/* Preview */}
            <div className="section-title">Preview</div>
            <div className="text-content" style={{ maxHeight: 200 }}>{result.preview}</div>
          </>
        )}

        {activeTab === 'chunk' && (
          <>
            {/* Full chunk text */}
            <div className="section-title">Chunk Text</div>
            {currentChunk ? (
              <>
                <div className="meta-grid" style={{ marginBottom: 6 }}>
                  <span className="meta-key">Offsets</span>
                  <span className="meta-value">{currentChunk.start_offset}–{currentChunk.end_offset}</span>
                  <span className="meta-key">Tokens</span>
                  <span className="meta-value">{currentChunk.token_count}</span>
                  <span className="meta-key">Embedding</span>
                  <span className={`stat-value ${currentChunk.embedding?.present ? 'accent-green' : 'accent-red'}`}>
                    {currentChunk.embedding?.present ? '● Present' : '○ Missing'}
                  </span>
                </div>
                <div className="text-content">{currentChunk.text}</div>
              </>
            ) : (
              <div className="text-dim" style={{ padding: 8 }}>Loading chunk text…</div>
            )}

            {/* Neighbors */}
            {(prevChunk || nextChunk) && (
              <>
                <div className="section-title" style={{ marginTop: 8 }}>Neighbors</div>
                {prevChunk && (
                  <div style={{ marginBottom: 6 }}>
                    <div className="text-mono text-dim" style={{ marginBottom: 2 }}>
                      Previous chunk #{prevChunk.chunk_index}
                    </div>
                    <div className="text-content" style={{ maxHeight: 80, fontSize: 11 }}>
                      {prevChunk.text.slice(0, 300)}{prevChunk.text.length > 300 ? '…' : ''}
                    </div>
                  </div>
                )}
                {nextChunk && (
                  <div>
                    <div className="text-mono text-dim" style={{ marginBottom: 2 }}>
                      Next chunk #{nextChunk.chunk_index}
                    </div>
                    <div className="text-content" style={{ maxHeight: 80, fontSize: 11 }}>
                      {nextChunk.text.slice(0, 300)}{nextChunk.text.length > 300 ? '…' : ''}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'document' && (
          <>
            {docDetail ? (
              <>
                <div className="section-title">Document</div>
                <div className="meta-grid" style={{ marginBottom: 8 }}>
                  <span className="meta-key">ID</span>
                  <span className="meta-value">
                    {docDetail.document.id}
                    <button className="copy-btn" onClick={() => copyToClipboard(docDetail.document.id)}>⧉</button>
                  </span>
                  <span className="meta-key">Title</span>
                  <span className="meta-value">{docDetail.document.title}</span>
                  <span className="meta-key">Source</span>
                  <span className="meta-value">{docDetail.document.source_id}</span>
                  {docDetail.document.url && (
                    <>
                      <span className="meta-key">URL</span>
                      <span className="meta-value accent">{docDetail.document.url}</span>
                    </>
                  )}
                  <span className="meta-key">Words</span>
                  <span className="meta-value">{docDetail.document.word_count}</span>
                  <span className="meta-key">Chunks</span>
                  <span className="meta-value">{docDetail.chunks.length}</span>
                  <span className="meta-key">Status</span>
                  <span className="meta-value">{docDetail.document.status}</span>
                </div>

                {/* Chunk coverage strip */}
                {docDetail.chunks.length > 0 && (
                  <>
                    <div className="section-title">Chunk Coverage</div>
                    <div className="coverage-strip">
                      {docDetail.chunks.map((ch) => {
                        const isCurrentChunk = ch.id === result.chunk_id;
                        const hasEmbedding = ch.embedding?.present;
                        return (
                          <span
                            key={ch.id}
                            title={`Chunk ${ch.chunk_index}${isCurrentChunk ? ' (selected)' : ''}`}
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              background: isCurrentChunk ? 'var(--mac-accent)' : hasEmbedding ? 'var(--mac-bg-dark)' : 'var(--mac-surface)',
                              border: isCurrentChunk ? '1px solid var(--mac-accent)' : hasEmbedding ? 'none' : '1px solid var(--mac-border)',
                              outline: isCurrentChunk ? '2px solid var(--mac-accent)' : 'none',
                              outlineOffset: '1px',
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="text-mono text-dim" style={{ marginTop: 2, fontSize: 10 }}>
                      {docDetail.chunks.filter(c => c.embedding?.present).length}/{docDetail.chunks.length} embedded
                      {' · '}
                      <span className="accent">■</span> = current
                    </div>
                  </>
                )}

                {/* Metadata */}
                {docDetail.document.metadata && Object.keys(docDetail.document.metadata).length > 0 && (
                  <>
                    <div className="section-title" style={{ marginTop: 8 }}>Metadata</div>
                    <div className="meta-grid">
                      {Object.entries(docDetail.document.metadata).slice(0, 12).map(([k, v]) => (
                        <Fragment key={k}>
                          <span className="meta-key">{k}</span>
                          <span className="meta-value truncate">{String(v)}</span>
                        </Fragment>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-dim" style={{ padding: 8 }}>Loading document…</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
