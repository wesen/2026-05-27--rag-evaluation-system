import { useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { contextVisualStyleToCssVars, resolveContextVisualStyle, type ContextStyleSet, type ContextWindowPart, type ContextWindowSnapshot } from '../../../context';
import { Text } from '../../foundation';
import styles from './ContextStripDiagram.module.css';

export interface ContextStripDiagramProps extends HTMLAttributes<HTMLDivElement> {
  snapshot: ContextWindowSnapshot;
  styleSet: ContextStyleSet;
  selectedPartId?: string;
  showLabels?: boolean;
  showSelection?: boolean;
  onPartSelect?: (partId: string) => void;
  renderPartTooltip?: (part: ContextWindowPart) => ReactNode;
}

function formatTokens(tokens: number) { return `${tokens.toLocaleString()} tok`; }
function styleName(styleSet: ContextStyleSet, styleKey: string) { return styleSet.legend.find((item) => (item.styleKey ?? item.id) === styleKey)?.label ?? styleKey; }
function patternClass(pattern: string | undefined) { return styles[`pattern_${pattern ?? 'none'}`] ?? styles.pattern_none; }
function handlePartKeyDown(event: KeyboardEvent<HTMLDivElement>, partId: string, onPartSelect?: (partId: string) => void) {
  if (!onPartSelect) return;
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPartSelect(partId); }
}

function defaultPartTooltip(part: ContextWindowPart, styleSet: ContextStyleSet) {
  return <div className={styles.tooltipContent}>
    <Text as="strong" size="compact">{part.label}</Text>
    <Text as="span" size="metadata" tone="muted">{formatTokens(part.tokens)} · {styleName(styleSet, part.styleKey)}</Text>
    {part.note && <Text as="span" size="metadata">{part.note}</Text>}
  </div>;
}

export function ContextStripDiagram({ snapshot, styleSet, selectedPartId, showLabels = true, showSelection, onPartSelect, renderPartTooltip, className, ...rest }: ContextStripDiagramProps) {
  const [tooltipPartId, setTooltipPartId] = useState<string | undefined>();
  const effectiveSelectedPartId = selectedPartId ?? snapshot.selectedPartId;
  const totalWidth = snapshot.limit || snapshot.parts.reduce((sum, part) => sum + part.tokens, 0);

  return (
    <div className={[styles.root, className ?? ''].filter(Boolean).join(' ')} data-rag-molecule="ContextStripDiagram" {...rest}>
      <div className={styles.strip} role="img" aria-label={`${snapshot.title} context strip`}>
        {snapshot.parts.map((part) => {
          const visualStyle = resolveContextVisualStyle(part.styleKey, styleSet);
          const width = Math.max(2, (part.tokens / totalWidth) * 100);
          const interactive = Boolean(onPartSelect);
          const selected = (showSelection ?? interactive) && effectiveSelectedPartId === part.id;
          const tooltipOpen = tooltipPartId === part.id;
          return (
            <div
              key={part.id}
              className={[styles.segment, patternClass(visualStyle.pattern), selected ? styles.selected : ''].filter(Boolean).join(' ')}
              style={{ width: `${width}%`, ...contextVisualStyleToCssVars(visualStyle) }}
              onMouseEnter={() => setTooltipPartId(part.id)}
              onMouseLeave={() => setTooltipPartId(undefined)}
              onFocus={() => setTooltipPartId(part.id)}
              onBlur={() => setTooltipPartId(undefined)}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-pressed={interactive ? selected : undefined}
              onClick={interactive ? () => onPartSelect?.(part.id) : undefined}
              onKeyDown={interactive ? (event) => handlePartKeyDown(event, part.id, onPartSelect) : undefined}
            >
              {showLabels && width >= 7 && <span className={styles.label}>{part.label}</span>}
              {tooltipOpen && <div className={styles.tooltip} role="tooltip">
                {renderPartTooltip ? renderPartTooltip(part) : defaultPartTooltip(part, styleSet)}
              </div>}
            </div>
          );
        })}
      </div>
      <div className={styles.caption}>{snapshot.title} · {snapshot.limit.toLocaleString()} token window</div>
    </div>
  );
}
