import type { HTMLAttributes } from 'react';
import { useEffect, useState } from 'react';
import type { ContextDiagramView, ContextStyleSet, ContextWindowPart, ContextWindowSnapshot } from '../../../context';
import { legendItemsForStyleSet } from '../../../context';
import { Button } from '../../atoms';
import { Caption, Text } from '../../foundation';
import { Inline, Panel, Stack } from '../../layout';
import { ContextBudgetBar, ContextLegend, ContextStackDiagram, ContextStripDiagram, ContextTreemap } from '../../molecules';
import styles from './ContextDiagramPanel.module.css';

export interface ContextDiagramPanelProps extends HTMLAttributes<HTMLDivElement> {
  snapshot: ContextWindowSnapshot;
  styleSet: ContextStyleSet;
  initialView?: ContextDiagramView;
  selectedPartId?: string;
  views?: ContextDiagramView[];
  showLegend?: boolean;
  showPartDetails?: boolean;
}

const defaultViews: ContextDiagramView[] = ['strip', 'stack', 'budget', 'treemap'];

function formatTokens(tokens: number) { return `${Math.round(tokens || 0).toLocaleString()} tok`; }
function metadataEntries(part: ContextWindowPart) { return Object.entries(part.metadata ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== ''); }
function styleLabel(styleSet: ContextStyleSet, styleKey: string) { return styleSet.legend.find((item) => (item.styleKey ?? item.id) === styleKey)?.label ?? styleKey; }

function renderPartDetail(part: ContextWindowPart | undefined, styleSet: ContextStyleSet) {
  if (!part) return null;
  const preview = part.contentPreview || part.content || '';
  const entries = metadataEntries(part).slice(0, 8);
  return (
    <div className={styles.detail} data-rag-context-part-detail={part.id}>
      <div className={styles.detailHeader}>
        <Text as="div" size="body" weight="bold">{part.label}</Text>
        <Caption tone="muted">{styleLabel(styleSet, part.styleKey)} · {formatTokens(part.tokens)}</Caption>
      </div>
      {part.note && <Caption className={styles.detailNote}>{part.note}</Caption>}
      {preview && <pre className={styles.preview}>{preview}</pre>}
      {entries.length > 0 && (
        <dl className={styles.metadata}>
          {entries.map(([key, value]) => (
            <div key={key} className={styles.metadataItem}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function ContextDiagramPanel({
  snapshot,
  styleSet,
  initialView = 'strip',
  selectedPartId,
  views = defaultViews,
  showLegend = true,
  showPartDetails = false,
  className,
  ...rest
}: ContextDiagramPanelProps) {
  const availableViews = views.length > 0 ? views : defaultViews;
  const initialActiveView: ContextDiagramView = availableViews.includes(initialView) ? initialView : (availableViews[0] ?? 'strip');
  const initialSelectedPartId = selectedPartId ?? snapshot.selectedPartId ?? snapshot.parts.find((part) => part.styleKey !== 'empty')?.id;
  const [view, setView] = useState<ContextDiagramView>(initialActiveView);
  const [activePartId, setActivePartId] = useState<string | undefined>(initialSelectedPartId);
  useEffect(() => {
    setActivePartId(selectedPartId ?? snapshot.selectedPartId ?? snapshot.parts.find((part) => part.styleKey !== 'empty')?.id);
  }, [selectedPartId, snapshot]);
  const selected = activePartId;
  const selectedPart = selected ? snapshot.parts.find((part) => part.id === selected) : undefined;
  const legendItems = legendItemsForStyleSet(styleSet);

  return <Panel title={snapshot.title} actions={<Inline gap="xs">{availableViews.map(v => <Button key={v} size="compact" selected={view === v} aria-pressed={view === v} onClick={() => setView(v)}>{v}</Button>)}</Inline>} className={className} data-rag-organism="ContextDiagramPanel" {...rest}>
    <Stack gap="sm">
      {snapshot.subtitle && <Caption>{snapshot.subtitle}</Caption>}
      <div className={styles.viewport}>
        {view === 'strip' && <ContextStripDiagram snapshot={snapshot} styleSet={styleSet} selectedPartId={selected} onPartSelect={setActivePartId} />}
        {view === 'stack' && <ContextStackDiagram snapshot={snapshot} styleSet={styleSet} selectedPartId={selected} onPartSelect={setActivePartId} />}
        {view === 'budget' && <ContextBudgetBar snapshot={snapshot} styleSet={styleSet} selectedPartId={selected} onPartSelect={setActivePartId} />}
        {view === 'treemap' && <ContextTreemap snapshot={snapshot} styleSet={styleSet} selectedPartId={selected} onPartSelect={setActivePartId} />}
      </div>
      {showLegend && <ContextLegend items={legendItems} styles={styleSet.styles} size={styleSet.legendSize ?? 'sm'} selectedId={selectedPart?.styleKey} />}
      {showPartDetails && renderPartDetail(selectedPart, styleSet)}
    </Stack>
  </Panel>;
}
