import { useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { contextVisualStyleToCssVars, resolveContextVisualStyle, type ContextStyleSet, type ContextWindowPart, type ContextWindowSnapshot } from '../../../context';
import { Text } from '../../foundation';
import styles from './ContextGroupedStripDiagram.module.css';

export type ContextGroupedStripGroupBy = 'turn' | 'styleKey' | 'sourceId';

export interface ContextGroupedStripDiagramProps extends HTMLAttributes<HTMLDivElement> {
  snapshot: ContextWindowSnapshot;
  styleSet: ContextStyleSet;
  selectedPartId?: string;
  groupBy?: ContextGroupedStripGroupBy;
  showGroupLabels?: boolean;
  showPartLabels?: boolean;
  showSelection?: boolean;
  onPartSelect?: (partId: string) => void;
  renderPartTooltip?: (part: ContextWindowPart) => ReactNode;
}

interface Group {
  id: string;
  label: string;
  tokens: number;
  parts: ContextWindowPart[];
}

function formatTokens(tokens: number) { return `${tokens.toLocaleString()} tok`; }
function patternClass(pattern: string | undefined) { return styles[`pattern_${pattern ?? 'none'}`] ?? styles.pattern_none; }
function styleName(styleSet: ContextStyleSet, styleKey: string) { return styleSet.legend.find((item) => (item.styleKey ?? item.id) === styleKey)?.label ?? styleKey; }
function metadataString(part: ContextWindowPart, key: string) {
  const value = part.metadata?.[key];
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}
function groupKey(part: ContextWindowPart, groupBy: ContextGroupedStripGroupBy) {
  if (groupBy === 'styleKey') return part.styleKey;
  if (groupBy === 'sourceId') return part.sourceId || part.id;
  return metadataString(part, 'turnIndex') || metadataString(part, 'turn') || part.sourceId?.match(/turn-(\d+)/)?.[1] || 'global';
}
function groupLabel(key: string, groupBy: ContextGroupedStripGroupBy, firstPart: ContextWindowPart, styleSet: ContextStyleSet) {
  if (groupBy === 'styleKey') return styleName(styleSet, key);
  if (groupBy === 'sourceId') return firstPart.sourceId || firstPart.label;
  return key === 'global' ? 'global' : `turn ${key}`;
}
function groupedParts(parts: ContextWindowPart[], groupBy: ContextGroupedStripGroupBy, styleSet: ContextStyleSet): Group[] {
  const groups: Group[] = [];
  let current: Group | undefined;
  for (const part of parts) {
    const key = groupKey(part, groupBy);
    if (!current || current.id !== key) {
      current = { id: key, label: groupLabel(key, groupBy, part, styleSet), tokens: 0, parts: [] };
      groups.push(current);
    }
    current.parts.push(part);
    current.tokens += part.tokens;
  }
  return groups;
}
function defaultPartTooltip(part: ContextWindowPart, styleSet: ContextStyleSet) {
  return <div className={styles.tooltipContent}>
    <Text as="strong" size="compact">{part.label}</Text>
    <Text as="span" size="metadata" tone="muted">{formatTokens(part.tokens)} · {styleName(styleSet, part.styleKey)}</Text>
    {part.note && <Text as="span" size="metadata">{part.note}</Text>}
  </div>;
}
function handlePartKeyDown(event: KeyboardEvent<HTMLDivElement>, partId: string, onPartSelect?: (partId: string) => void) {
  if (!onPartSelect) return;
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPartSelect(partId); }
}

export function ContextGroupedStripDiagram({
  snapshot,
  styleSet,
  selectedPartId,
  groupBy = 'turn',
  showGroupLabels = true,
  showPartLabels = false,
  showSelection,
  onPartSelect,
  renderPartTooltip,
  className,
  ...rest
}: ContextGroupedStripDiagramProps) {
  const [tooltipPartId, setTooltipPartId] = useState<string | undefined>();
  const effectiveSelectedPartId = selectedPartId ?? snapshot.selectedPartId;
  const totalWidth = snapshot.limit || snapshot.parts.reduce((sum, part) => sum + part.tokens, 0) || 1;
  const groups = groupedParts(snapshot.parts, groupBy, styleSet);

  return (
    <div className={[styles.root, className ?? ''].filter(Boolean).join(' ')} data-rag-molecule="ContextGroupedStripDiagram" {...rest}>
      <div className={styles.groups} role="img" aria-label={`${snapshot.title} grouped context strip`}>
        {groups.map((group) => {
          const groupWidth = Math.max(2, (group.tokens / totalWidth) * 100);
          const groupTotal = group.tokens || 1;
          return (
            <div key={group.id} className={styles.group} style={{ width: `${groupWidth}%` }}>
              {showGroupLabels && groupWidth >= 6 && <div className={styles.groupLabel}>{group.label}</div>}
              <div className={styles.groupParts}>
                {group.parts.map((part) => {
                  const visualStyle = resolveContextVisualStyle(part.styleKey, styleSet);
                  const width = Math.max(2, (part.tokens / groupTotal) * 100);
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
                      {showPartLabels && width >= 12 && <span className={styles.partLabel}>{part.label}</span>}
                      {tooltipOpen && <div className={styles.tooltip} role="tooltip">
                        {renderPartTooltip ? renderPartTooltip(part) : defaultPartTooltip(part, styleSet)}
                      </div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.caption}>{snapshot.title} · {snapshot.limit.toLocaleString()} token window · grouped by {groupBy}</div>
    </div>
  );
}
