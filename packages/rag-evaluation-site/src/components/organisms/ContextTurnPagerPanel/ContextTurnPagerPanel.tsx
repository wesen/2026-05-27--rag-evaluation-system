import { useMemo, useState, type HTMLAttributes } from 'react';
import type { ContextStyleSet, ContextWindowSnapshot } from '../../../context';
import { Button } from '../../atoms';
import { Inline, Panel, Stack } from '../../layout';
import { ContextLegend, ContextStripDiagram, ContextGroupedStripDiagram, type ContextGroupedStripGroupBy } from '../../molecules';
import styles from './ContextTurnPagerPanel.module.css';

export interface ContextTurnPagerPanelProps extends HTMLAttributes<HTMLDivElement> {
  snapshots: ContextWindowSnapshot[];
  styleSet: ContextStyleSet;
  initialSnapshotId?: string;
  selectedPartId?: string;
  diagram?: 'grouped-strip' | 'strip';
  groupBy?: ContextGroupedStripGroupBy;
  showLegend?: boolean;
  title?: string;
}

function turnLabel(snapshot: ContextWindowSnapshot, index: number) {
  const turn = snapshot.metadata?.turnIndex;
  if (typeof turn === 'number' || typeof turn === 'string') return `T${turn}`;
  return `T${index + 1}`;
}

export function ContextTurnPagerPanel({
  snapshots,
  styleSet,
  initialSnapshotId,
  selectedPartId,
  diagram = 'grouped-strip',
  groupBy = 'turn',
  showLegend = true,
  title = 'Context turn pager',
  className,
  ...rest
}: ContextTurnPagerPanelProps) {
  const initialIndex = Math.max(0, snapshots.findIndex((snapshot) => snapshot.id === initialSnapshotId));
  const [index, setIndex] = useState(initialIndex === -1 ? 0 : initialIndex);
  const boundedIndex = Math.min(Math.max(index, 0), Math.max(0, snapshots.length - 1));
  const snapshot = snapshots[boundedIndex];
  const selected = selectedPartId ?? snapshot?.selectedPartId;
  const actions = useMemo(() => (
    <Inline gap="xs">
      <Button size="compact" disabled={boundedIndex <= 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>Prev</Button>
      <span className={styles.counter}>{snapshots.length ? `${boundedIndex + 1} / ${snapshots.length}` : '0 / 0'}</span>
      <Button size="compact" disabled={boundedIndex >= snapshots.length - 1} onClick={() => setIndex((value) => Math.min(snapshots.length - 1, value + 1))}>Next</Button>
    </Inline>
  ), [boundedIndex, snapshots.length]);

  if (!snapshot) {
    return <Panel title={title} className={className} data-rag-organism="ContextTurnPagerPanel" {...rest}>No context snapshots available.</Panel>;
  }

  return (
    <Panel title={title} actions={actions} className={className} data-rag-organism="ContextTurnPagerPanel" {...rest}>
      <Stack gap="sm">
        <Inline gap="xs" className={styles.turnRail} aria-label="Available turns">
          {snapshots.map((item, itemIndex) => (
            <Button key={item.id} size="compact" selected={itemIndex === boundedIndex} aria-pressed={itemIndex === boundedIndex} onClick={() => setIndex(itemIndex)}>
              {turnLabel(item, itemIndex)}
            </Button>
          ))}
        </Inline>
        <div className={styles.heading}>
          <strong>{snapshot.title}</strong>
          {snapshot.subtitle && <span>{snapshot.subtitle}</span>}
        </div>
        {diagram === 'strip'
          ? <ContextStripDiagram snapshot={snapshot} styleSet={styleSet} selectedPartId={selected} />
          : <ContextGroupedStripDiagram snapshot={snapshot} styleSet={styleSet} selectedPartId={selected} groupBy={groupBy} />}
        {showLegend && <ContextLegend items={styleSet.legend} styles={styleSet.styles} selectedId={selected} />}
      </Stack>
    </Panel>
  );
}
