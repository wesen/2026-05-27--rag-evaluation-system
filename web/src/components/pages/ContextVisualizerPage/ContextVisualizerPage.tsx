import { useState, useCallback } from 'react';
import { Button, Caption, Panel, Text } from '@go-go-golems/rag-evaluation-site';
import { DashboardGrid, Inline, ScrollRegion, Stack } from '@go-go-golems/rag-evaluation-site';
import {
  ContextDiagramPanel,
  ContextBudgetBar,
  ContextStripDiagram,
  ContextStackDiagram,
  ContextTreemap,
  type ContextDiagramView,
  contextWindowSnapshots,
} from '@go-go-golems/rag-evaluation-site';
import type { ContextDiagramView as DiagramView } from '@go-go-golems/rag-evaluation-site';
import styles from './ContextVisualizerPage.module.css';

const SNAPSHOTS = contextWindowSnapshots;
const VIEWS: { id: ContextDiagramView; label: string }[] = [
  { id: 'strip', label: 'Strip' },
  { id: 'stack', label: 'Stack' },
  { id: 'budget', label: 'Budget' },
  { id: 'treemap', label: 'Treemap' },
];

export function ContextVisualizerPage() {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(SNAPSHOTS[1]!.id);
  const [view, setView] = useState<ContextDiagramView>('stack');
  const [selectedPartId, setSelectedPartId] = useState<string | undefined>(undefined);

  const snapshot = SNAPSHOTS.find((s) => s.id === selectedSnapshotId) ?? SNAPSHOTS[1]!;

  const handleSelectPart = useCallback((id: string) => {
    setSelectedPartId((prev) => (prev === id ? undefined : id));
  }, []);

  const diagram = (
    <ContextDiagramPanel
      snapshot={snapshot}
      view={view}
      selectedPartId={selectedPartId}
      onChangeView={setView}
      onPartSelect={handleSelectPart}
    />
  );

  return (
    <DashboardGrid className={styles.root} data-rag-page="ContextVisualizerPage">
      {/* Left: snapshot selector */}
      <Stack gap="sm" className={styles.controls}>
        <Panel title="Snapshots" density="condensed">
          <ScrollRegion>
            <Stack gap="xs">
              {SNAPSHOTS.map((s) => (
                <Button
                  key={s.id}
                  size="compact"
                  tone={s.id === selectedSnapshotId ? 'accent' : 'secondary'}
                  onClick={() => { setSelectedSnapshotId(s.id); setSelectedPartId(undefined); }}
                  fullWidth
                >
                  <Inline direction="column" gap="xs">
                    <Text size="label" tone="primary">{s.title}</Text>
                    {s.subtitle && <Caption>{s.subtitle}</Caption>}
                  </Inline>
                </Button>
              ))}
            </Stack>
          </ScrollRegion>
        </Panel>
        <Panel title="Views" density="condensed">
          <Inline direction="column" gap="xs">
            {VIEWS.map((v) => (
              <Button key={v.id} size="compact" tone={v.id === view ? 'accent' : 'secondary'} onClick={() => setView(v.id)} fullWidth>
                {v.label}
              </Button>
            ))}
          </Inline>
        </Panel>
      </Stack>

      {/* Center: diagram */}
      <ScrollRegion className={styles.diagramArea}>
        {diagram}
      </ScrollRegion>
    </DashboardGrid>
  );
}

export default ContextVisualizerPage;
