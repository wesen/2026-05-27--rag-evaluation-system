import type { EmbeddingCoverageResult } from '../../../services/api';

export interface CoveragePanelProps {
  coverage: EmbeddingCoverageResult;
  coveragePct: number;
}

export function CoveragePanel({ coverage, coveragePct }: CoveragePanelProps) {
  const isSparse = coveragePct < 50;
  return (
    <div className="panel" data-rag-component="CoveragePanel">
      <div className="panel-header">
        <span>Coverage</span>
        <span className={isSparse ? 'status-partial' : 'status-done'}>{coveragePct}%</span>
      </div>
      <div className="panel-body-condensed">
        <div className="meta-grid" style={{ marginBottom: 4 }}>
          <span className="meta-key">Embedded</span>
          <span className="stat-value accent-green">{coverage.embedded_chunks}</span>
          <span className="meta-key">Total</span>
          <span className="stat-value">{coverage.total_chunks}</span>
          <span className="meta-key">Missing</span>
          <span className="stat-value accent-red">{coverage.total_chunks - coverage.embedded_chunks}</span>
        </div>
        {coverage.sources && coverage.sources.length > 0 && (
          <table className="data-table" style={{ fontSize: 10 }}>
            <thead>
              <tr><th>Source</th><th>Cov</th><th>Emb</th><th>Tot</th></tr>
            </thead>
            <tbody>
              {coverage.sources.map(s => (
                <tr key={s.source_id}>
                  <td className="truncate" style={{ maxWidth: 120 }}>{s.source_name}</td>
                  <td className="num" style={{ color: s.coverage_pct >= 50 ? 'var(--mac-green)' : 'var(--mac-amber)' }}>
                    {Math.round(s.coverage_pct)}%
                  </td>
                  <td className="num">{s.embedded_chunks}</td>
                  <td className="num">{s.total_chunks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {isSparse && (
          <div style={{ marginTop: 4, padding: 4, border: '1px solid var(--mac-amber)', fontSize: 10, color: 'var(--mac-amber)', fontFamily: 'var(--font-mono)' }}>
            ⚠ Vector search only compares embedded chunks. Coverage is sparse — results validate behavior but not full-corpus quality.
          </div>
        )}
      </div>
    </div>
  );
}
