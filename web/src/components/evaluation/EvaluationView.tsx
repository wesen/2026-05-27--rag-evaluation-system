import React from 'react';
import { MacWindow } from '../retro/MacWindow';

export const EvaluationView: React.FC = () => {
  return (
    <MacWindow title="Evaluation Dashboard">
      <p style={{ color: '#999' }}>
        Evaluation dashboard coming soon. This view will let you:
      </p>
      <ul style={{ fontSize: 12, paddingLeft: 16 }}>
        <li>Create and manage evaluation query sets</li>
        <li>Run evaluations across different search configurations</li>
        <li>Compare Recall@K, MRR, nDCG@K metrics</li>
        <li>See per-query pass/fail matrices</li>
      </ul>
    </MacWindow>
  );
};
