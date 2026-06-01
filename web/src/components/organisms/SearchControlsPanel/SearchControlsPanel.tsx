import type { KeyboardEvent } from 'react';

export type RetrieverType = 'bm25' | 'vector' | 'hybrid';

export interface SearchControlsPanelProps {
  query: string;
  setQuery: (q: string) => void;
  retriever: RetrieverType;
  setRetriever: (r: RetrieverType) => void;
  indexId: string;
  setIndexId: (v: string) => void;
  strategyId: string;
  setStrategyId: (v: string) => void;
  profile: string;
  setProfile: (v: string) => void;
  limit: number;
  setLimit: (v: number) => void;
  candidateLimit: number;
  setCandidateLimit: (v: number) => void;
  previewRunes: number;
  setPreviewRunes: (v: number) => void;
  sources: { source_id: string; source_name: string }[];
  selectedSourceIds: string[];
  toggleSource: (id: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  onKeyDown: (e: KeyboardEvent) => void;
}

export function SearchControlsPanel({
  query,
  setQuery,
  retriever,
  setRetriever,
  indexId,
  setIndexId,
  strategyId,
  setStrategyId,
  profile,
  setProfile,
  limit,
  setLimit,
  candidateLimit,
  setCandidateLimit,
  previewRunes,
  setPreviewRunes,
  sources,
  selectedSourceIds,
  toggleSource,
  onSearch,
  isLoading,
  onKeyDown,
}: SearchControlsPanelProps) {
  return (
    <div className="panel" data-rag-component="SearchControlsPanel">
      <div className="panel-header"><span>Search</span></div>
      <div className="panel-body-condensed" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Enter query…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
          />
          <button className="btn btn-primary" onClick={onSearch} disabled={isLoading || !query.trim()}>
            {isLoading ? '…' : '▶'}
          </button>
        </div>

        <div className="section-title" style={{ marginTop: 4 }}>Retriever</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['bm25', 'vector', 'hybrid'] as RetrieverType[]).map(r => (
            <button
              key={r}
              className={`btn ${retriever === r ? 'btn-primary' : ''}`}
              style={{ flex: 1, textTransform: 'uppercase', fontSize: 10 }}
              onClick={() => setRetriever(r)}
            >
              {r}
            </button>
          ))}
        </div>

        {(retriever === 'bm25' || retriever === 'hybrid') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="section-title" style={{ marginTop: 2 }}>BM25 Index</div>
            <input
              className="input"
              style={{ width: '100%' }}
              value={indexId}
              onChange={e => setIndexId(e.target.value)}
              placeholder="Index ID"
            />
          </div>
        )}

        {(retriever === 'vector' || retriever === 'hybrid') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="section-title" style={{ marginTop: 2 }}>Vector</div>
            <div className="meta-grid">
              <span className="meta-key">Strategy</span>
              <input className="input" style={{ width: '100%' }} value={strategyId} onChange={e => setStrategyId(e.target.value)} />
              <span className="meta-key">Profile</span>
              <input className="input" style={{ width: '100%' }} value={profile} onChange={e => setProfile(e.target.value)} />
            </div>
          </div>
        )}

        <div className="section-title" style={{ marginTop: 2 }}>Source Filter</div>
        <div style={{ maxHeight: 100, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sources.map(s => (
            <label key={s.source_id} className="checkbox-row" style={{ fontSize: 10 }}>
              <input
                type="checkbox"
                checked={selectedSourceIds.includes(s.source_id)}
                onChange={() => toggleSource(s.source_id)}
              />
              <span className="truncate">{s.source_name}</span>
            </label>
          ))}
          {sources.length === 0 && <span className="text-dim text-small">Loading sources…</span>}
        </div>

        <div className="section-title" style={{ marginTop: 2 }}>Limits</div>
        <div className="meta-grid">
          <span className="meta-key">Limit</span>
          <input className="input" type="number" style={{ width: 60 }} value={limit} onChange={e => setLimit(Number(e.target.value))} min={1} max={100} />
          {(retriever === 'vector' || retriever === 'hybrid') && (
            <>
              <span className="meta-key">Candidates</span>
              <input className="input" type="number" style={{ width: 60 }} value={candidateLimit} onChange={e => setCandidateLimit(Number(e.target.value))} min={1} />
            </>
          )}
          <span className="meta-key">Preview</span>
          <input className="input" type="number" style={{ width: 60 }} value={previewRunes} onChange={e => setPreviewRunes(Number(e.target.value))} min={0} />
        </div>
      </div>
    </div>
  );
}
