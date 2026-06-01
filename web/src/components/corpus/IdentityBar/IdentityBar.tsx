import React from 'react';
import { Caption } from '../../foundation';
import { FormRow, Inline, Panel } from '../../layout';
import { CorpusIdentityArgs } from '../../../services/api';
import styles from './IdentityBar.module.css';

interface IdentityBarProps {
  identity: CorpusIdentityArgs;
  onChange: (identity: CorpusIdentityArgs) => void;
  strategies: { id: string }[];
  totalDocs: number;
  totalChunks: number;
  totalEmbedded: number;
}

export const IdentityBar: React.FC<IdentityBarProps> = ({
  identity, onChange, strategies, totalDocs, totalChunks, totalEmbedded,
}) => {
  return (
    <Panel title="Embedding Identity" density="condensed" data-rag-component="IdentityBar">
      <Inline gap="md" className={styles.content}>
        <FormRow
          className={styles.field}
          label="Strategy"
          control={(
            <select
              className="select"
              value={identity.strategy_id}
              onChange={(e) => onChange({ ...identity, strategy_id: e.target.value })}
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>{s.id}</option>
              ))}
            </select>
          )}
        />
        <FormRow
          className={styles.field}
          label="Provider"
          control={(
            <input
              className={`input ${styles.providerInput}`}
              value={identity.provider_type}
              onChange={(e) => onChange({ ...identity, provider_type: e.target.value })}
            />
          )}
        />
        <FormRow
          className={styles.field}
          label="Model"
          control={(
            <input
              className={`input ${styles.modelInput}`}
              value={identity.model}
              onChange={(e) => onChange({ ...identity, model: e.target.value })}
            />
          )}
        />
        <FormRow
          className={styles.field}
          label="Dims"
          control={(
            <input
              className={`input ${styles.dimensionsInput}`}
              type="number"
              value={identity.dimensions}
              onChange={(e) => onChange({ ...identity, dimensions: Number(e.target.value) })}
            />
          )}
        />
        <Caption className={styles.totals}>
          {totalDocs} docs · {totalChunks} chunks · {totalEmbedded} embedded
        </Caption>
      </Inline>
    </Panel>
  );
};
