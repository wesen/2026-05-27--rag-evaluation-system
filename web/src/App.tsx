import React, { useState } from 'react';
import { MacMenuBar } from './components/retro/MacMenuBar';
import { PipelineView } from './components/pipeline/PipelineView';
import { EmbeddingsView } from './components/embeddings/EmbeddingsView';
import { SearchView } from './components/search/SearchView';
import { EvaluationView } from './components/evaluation/EvaluationView';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState('pipeline');

  const renderView = () => {
    switch (activeView) {
      case 'pipeline':
        return <PipelineView />;
      case 'embeddings':
        return <EmbeddingsView />;
      case 'search':
        return <SearchView />;
      case 'evaluation':
        return <EvaluationView />;
      default:
        return <PipelineView />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--mac-platinum)' }}>
      <MacMenuBar activeView={activeView} onViewChange={setActiveView} />
      <div className="p-2">
        {renderView()}
      </div>
    </div>
  );
};
