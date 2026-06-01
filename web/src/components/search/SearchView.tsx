import React, { useState, useCallback, useEffect } from 'react';
import { CoveragePanel, QueryPresetList } from '../molecules';
import { RetrievalResultsPanel, SearchControlsPanel, type RetrieverType } from '../organisms';
import {
  useSearchBM25Mutation,
  useSearchVectorMutation,
  useSearchHybridMutation,
  useEmbeddingCoverageMutation,
  useListCorpusSourcesQuery,
  useGetCorpusDocumentQuery,
  SearchResult,
  RetrievalResult,
  EmbeddingCoverageResult,
  CorpusIdentityArgs,
} from '../../services/api';

// ─── Defaults ───

const DEFAULT_INDEX_ID = 'bm25-ttc-guides-articles-fixed-1200-150';
const DEFAULT_STRATEGY_ID = 'fixed-1200-150';
const DEFAULT_PROFILE = 'openai-embedding-small';
const DEFAULT_PROVIDER_TYPE = 'openai';
const DEFAULT_MODEL = 'text-embedding-3-small';
const DEFAULT_DIMENSIONS = 1536;

const TEST_QUERIES = [
  'crape myrtle varieties',
  'how to plant arborvitae',
  'hydrangea pruning',
  'emerald green arborvitae spacing',
  'fast growing trees for privacy screen',
  'which trees make a good privacy screen',
  'zone 5 flowering trees',
  'compact evergreen shrubs',
];

// ─── Main component ───

export const SearchView: React.FC = () => {
  // Search params
  const [query, setQuery] = useState('');
  const [retriever, setRetriever] = useState<RetrieverType>('bm25');
  const [indexId, setIndexId] = useState(DEFAULT_INDEX_ID);
  const [strategyId, setStrategyId] = useState(DEFAULT_STRATEGY_ID);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [providerType] = useState(DEFAULT_PROVIDER_TYPE);
  const [model] = useState(DEFAULT_MODEL);
  const [dimensions] = useState(DEFAULT_DIMENSIONS);
  const [limit, setLimit] = useState(10);
  const [candidateLimit, setCandidateLimit] = useState(200);
  const [previewRunes, setPreviewRunes] = useState(300);

  // Source filter
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

  // Results
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [selectedResult, setSelectedResult] = useState<RetrievalResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Coverage
  const [coverage, setCoverage] = useState<EmbeddingCoverageResult | null>(null);

  // Mutations
  const [searchBM25, { isLoading: loadingBM25 }] = useSearchBM25Mutation();
  const [searchVector, { isLoading: loadingVector }] = useSearchVectorMutation();
  const [searchHybrid, { isLoading: loadingHybrid }] = useSearchHybridMutation();
  const [fetchCoverage] = useEmbeddingCoverageMutation();

  // Sources for filter
  const identity: CorpusIdentityArgs = {
    strategy_id: strategyId,
    provider_type: providerType,
    model,
    dimensions,
  };
  const { data: sources } = useListCorpusSourcesQuery(identity);

  const isLoading = loadingBM25 || loadingVector || loadingHybrid;

  // Fetch coverage when retriever needs vector
  useEffect(() => {
    if (retriever === 'vector' || retriever === 'hybrid') {
      fetchCoverage({
        strategy_id: strategyId,
        provider_type: providerType,
        model,
        dimensions,
      }).unwrap().then(setCoverage).catch(() => setCoverage(null));
    } else {
      setCoverage(null);
    }
  }, [retriever, strategyId, providerType, model, dimensions, fetchCoverage]);

  const runSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearchError(null);
    setSelectedResult(null);

    try {
      let result: SearchResult;
      const preview = previewRunes > 0 ? previewRunes : undefined;

      if (retriever === 'bm25') {
        result = await searchBM25({
          index_id: indexId,
          query: query.trim(),
          limit,
          preview_runes: preview,
        }).unwrap();
      } else if (retriever === 'vector') {
        result = await searchVector({
          strategy_id: strategyId,
          source_ids: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
          query: query.trim(),
          profile,
          embeddings_type: providerType,
          embeddings_engine: model,
          embeddings_dimensions: dimensions,
          limit,
          candidate_limit: candidateLimit,
          preview_runes: preview,
        }).unwrap();
      } else {
        result = await searchHybrid({
          index_id: indexId,
          strategy_id: strategyId,
          source_ids: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
          query: query.trim(),
          profile,
          embeddings_type: providerType,
          embeddings_engine: model,
          embeddings_dimensions: dimensions,
          limit,
          candidate_limit: candidateLimit,
          preview_runes: preview,
          bm25_limit: 50,
          vector_limit: 50,
          rrf_k: 60,
        }).unwrap();
      }
      setSearchResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSearchError(msg);
      setSearchResult(null);
    }
  }, [query, retriever, indexId, strategyId, profile, providerType, model, dimensions, limit, candidateLimit, previewRunes, selectedSourceIds, searchBM25, searchVector, searchHybrid]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) runSearch();
  }, [runSearch, isLoading]);

  const toggleSource = useCallback((sourceId: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(sourceId) ? prev.filter(id => id !== sourceId) : [...prev, sourceId]
    );
  }, []);

  const items = searchResult?.items ?? [];
  const coveragePct = coverage ? (coverage.total_chunks > 0 ? Math.round(coverage.embedded_chunks / coverage.total_chunks * 100) : 0) : null;

  return (
    <div style={{ display: 'flex', gap: 8, height: 'calc(100vh - 60px)' }}>
      {/* Left: Controls */}
      <div style={{ width: 280, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
        <SearchControlsPanel
          query={query} setQuery={setQuery}
          retriever={retriever} setRetriever={setRetriever}
          indexId={indexId} setIndexId={setIndexId}
          strategyId={strategyId} setStrategyId={setStrategyId}
          profile={profile} setProfile={setProfile}
          limit={limit} setLimit={setLimit}
          candidateLimit={candidateLimit} setCandidateLimit={setCandidateLimit}
          previewRunes={previewRunes} setPreviewRunes={setPreviewRunes}
          sources={sources ?? []}
          selectedSourceIds={selectedSourceIds}
          toggleSource={toggleSource}
          onSearch={runSearch}
          isLoading={isLoading}
          onKeyDown={handleKeyDown}
        />
        {/* Coverage warning */}
        {coverage && (retriever === 'vector' || retriever === 'hybrid') && (
          <CoveragePanel coverage={coverage} coveragePct={coveragePct!} />
        )}
        {/* Quick queries */}
        <QueryPresetList queries={TEST_QUERIES} onSelect={setQuery} />
      </div>

      {/* Center: Results */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <RetrievalResultsPanel
          searchResult={searchResult}
          items={items}
          retriever={retriever}
          selectedResult={selectedResult}
          searchError={searchError}
          isLoading={isLoading}
          onSelectResult={setSelectedResult}
        />
      </div>

      {/* Right: Inspector */}
      <div style={{ width: 400, minWidth: 400 }}>
        {selectedResult ? (
          <ResultInspector
            result={selectedResult}
            retriever={retriever}
            strategyId={strategyId}
            providerType={providerType}
            model={model}
            dimensions={dimensions}
            onClose={() => setSelectedResult(null)}
          />
        ) : (
          <div className="panel" style={{ height: '100%' }}>
            <div className="panel-header"><span>Inspector</span></div>
            <div style={{ padding: 24, textAlign: 'center' }} className="text-dim">
              Click a result to inspect.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Result Inspector ───

interface ResultInspectorProps {
  result: RetrievalResult;
  retriever: RetrieverType;
  strategyId: string;
  providerType: string;
  model: string;
  dimensions: number;
  onClose: () => void;
}

const ResultInspector: React.FC<ResultInspectorProps> = ({
  result, retriever: _retriever, strategyId, providerType, model, dimensions, onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'chunk' | 'document'>('detail');

  // Fetch full document for this chunk's document
  const { data: docDetail } = useGetCorpusDocumentQuery({
    document_id: result.document_id,
    strategy_id: strategyId,
    provider_type: providerType,
    model,
    dimensions,
    include_text: true,
  }, { skip: !result.document_id });

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

  const handleOpenInCorpus = () => {
    // Dispatch a custom event that App.tsx or CorpusExplorerView can listen for
    window.dispatchEvent(new CustomEvent('rag:navigate-to-chunk', {
      detail: { documentId: result.document_id, chunkId: result.chunk_id, sourceId: result.source_id },
    }));
  };

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <span>Inspector — Rank #{result.rank}</span>
        <div className="panel-header-controls">
          <button className="btn" style={{ fontSize: 10 }} onClick={handleOpenInCorpus}>
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
                        <React.Fragment key={k}>
                          <span className="meta-key">{k}</span>
                          <span className="meta-value truncate">{String(v)}</span>
                        </React.Fragment>
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
};

export default SearchView;
