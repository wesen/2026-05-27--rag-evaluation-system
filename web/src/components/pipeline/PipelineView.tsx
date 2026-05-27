import React from 'react';
import { MacWindow } from '../retro/MacWindow';
import { useListSourcesQuery, useListDocumentsQuery } from '../../services/api';

export const PipelineView: React.FC = () => {
  const { data: sources, isLoading: sourcesLoading } = useListSourcesQuery();
  const { data: documents, isLoading: docsLoading } = useListDocumentsQuery();

  return (
    <div className="flex gap-2">
      <MacWindow title="Sources" className="flex-1">
        {sourcesLoading ? (
          <p>Loading...</p>
        ) : sources && sources.length > 0 ? (
          <table className="mac-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s: { id: string; name: string; type: string; created_at: string }) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.type}</td>
                  <td>{s.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999' }}>No sources yet. Create one to start indexing.</p>
        )}
      </MacWindow>

      <MacWindow title="Documents" className="flex-1">
        {docsLoading ? (
          <p>Loading...</p>
        ) : documents && documents.length > 0 ? (
          <table className="mac-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Words</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d: { id: string; title: string; status: string; word_count: number }) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td className={`status-${d.status === 'indexed' ? 'done' : d.status}`}>{d.status}</td>
                  <td>{d.word_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999' }}>No documents indexed yet.</p>
        )}
      </MacWindow>
    </div>
  );
};
