import React from 'react';
import { MacWindow } from '../retro/MacWindow';

export const SearchView: React.FC = () => {
  return (
    <MacWindow title="Search Sandbox">
      <p style={{ color: '#999' }}>
        Search sandbox coming soon. This view will let you:
      </p>
      <ul style={{ fontSize: 12, paddingLeft: 16 }}>
        <li>Run queries against BM25, vector, and hybrid indexes</li>
        <li>Inspect score breakdowns (BM25 rank, vector rank, RRF score)</li>
        <li>Compare results before and after reranking</li>
        <li>Visualize score distributions</li>
      </ul>
    </MacWindow>
  );
};
