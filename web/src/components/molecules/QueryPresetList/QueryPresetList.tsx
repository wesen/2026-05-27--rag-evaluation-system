export interface QueryPresetListProps {
  queries: string[];
  onSelect: (query: string) => void;
}

export function QueryPresetList({ queries, onSelect }: QueryPresetListProps) {
  return (
    <div className="panel" data-rag-component="QueryPresetList">
      <div className="panel-header"><span>Test Queries</span></div>
      <div className="panel-body-condensed" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {queries.map(q => (
          <span
            key={q}
            className="text-mono"
            style={{ cursor: 'pointer', padding: '2px 4px', fontSize: 10 }}
            onClick={() => onSelect(q)}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--mac-surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}
