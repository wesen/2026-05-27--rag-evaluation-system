import React from 'react';
import { MacWindow } from '../retro/MacWindow';

export const EmbeddingsView: React.FC = () => {
  return (
    <MacWindow title="Embedding Inspector">
      <p style={{ color: '#999' }}>
        Embedding playground coming soon. This view will let you:
      </p>
      <ul style={{ fontSize: 12, paddingLeft: 16 }}>
        <li>Compute embeddings for arbitrary text</li>
        <li>Compare pairwise cosine similarities</li>
        <li>Find nearest neighbors by vector</li>
        <li>Compare embedding models side-by-side</li>
      </ul>
    </MacWindow>
  );
};
