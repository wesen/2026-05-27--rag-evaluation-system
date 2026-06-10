import type { HTMLAttributes, KeyboardEvent } from 'react';
import { contextVisualStyleToCssVars, resolveContextVisualStyle, type ContextStyleSet, type ContextWindowPart, type ContextWindowSnapshot } from '../../../context';
import styles from './ContextGroupedStripDiagram.module.css';

export type ContextGroupedStripGroupBy = 'turn' | 'styleKey' | 'sourceId';

export interface ContextGroupedStripDiagramProps extends HTMLAttributes<HTMLDivElement> {
  snapshot: ContextWindowSnapshot;
  styleSet: ContextStyleSet;
  selectedPartId?: string;
  groupBy?: ContextGroupedStripGroupBy;
  showGroupLabels?: boolean;
  showPartLabels?: boolean;
  onPartSelect?: (partId: string) => void;
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
function tooltip(part: ContextWindowPart, styleSet: ContextStyleSet) {
  const note = part.note ? `\n${part.note}` : '';
  return `${part.label}: ${formatTokens(part.tokens)} (${styleName(styleSet, part.styleKey)})${note}`;
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
  onPartSelect,
  className,
  ...rest
}: ContextGroupedStripDiagramProps) {
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
                  const selected = effectiveSelectedPartId === part.id;
                  const interactive = Boolean(onPartSelect);
                  return (
                    <div
                      key={part.id}
                      className={[styles.segment, patternClass(visualStyle.pattern), selected ? styles.selected : ''].filter(Boolean).join(' ')}
                      style={{ width: `${width}%`, ...contextVisualStyleToCssVars(visualStyle) }}
                      data-tooltip={tooltip(part, styleSet)}
                      role={interactive ? 'button' : undefined}
                      tabIndex={interactive ? 0 : undefined}
                      aria-pressed={interactive ? selected : undefined}
                      onClick={interactive ? () => onPartSelect?.(part.id) : undefined}
                      onKeyDown={interactive ? (event) => handlePartKeyDown(event, part.id, onPartSelect) : undefined}
                    >
                      {showPartLabels && width >= 12 && <span className={styles.partLabel}>{part.label}</span>}
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
