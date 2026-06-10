import type { HTMLAttributes, KeyboardEvent } from 'react';
import { contextVisualStyleToCssVars, resolveContextVisualStyle, type ContextStyleSet, type ContextWindowSnapshot } from '../../../context';
import styles from './ContextStackDiagram.module.css';

export interface ContextStackDiagramProps extends HTMLAttributes<HTMLDivElement> {
  snapshot: ContextWindowSnapshot;
  styleSet: ContextStyleSet;
  selectedPartId?: string;
  onPartSelect?: (partId: string) => void;
}

function formatTokens(tokens: number) { return `${tokens.toLocaleString()} tok`; }
function styleName(styleSet: ContextStyleSet, styleKey: string) { return styleSet.legend.find((item) => (item.styleKey ?? item.id) === styleKey)?.label ?? styleKey; }
function patternClass(pattern: string | undefined) { return styles[`pattern_${pattern ?? 'none'}`] ?? styles.pattern_none; }
function handlePartKeyDown(event: KeyboardEvent<HTMLDivElement>, partId: string, onPartSelect?: (partId: string) => void) {
  if (!onPartSelect) return;
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPartSelect(partId); }
}

export function ContextStackDiagram({ snapshot, styleSet, selectedPartId, onPartSelect, className, ...rest }: ContextStackDiagramProps) {
  const effectiveSelectedPartId = selectedPartId ?? snapshot.selectedPartId;
  const visible = snapshot.parts.filter((part) => part.tokens > 0);
  const maxTokens = Math.max(...visible.map((part) => part.tokens), 1);
  return (
    <div className={[styles.root, className ?? ''].filter(Boolean).join(' ')} data-rag-molecule="ContextStackDiagram" {...rest}>
      <div className={styles.layers} role="img" aria-label={`${snapshot.title} context stack`}>
        {visible.map((part) => {
          const visualStyle = resolveContextVisualStyle(part.styleKey, styleSet);
          const selected = effectiveSelectedPartId === part.id;
          const height = Math.max(26, Math.min(74, 22 + (part.tokens / maxTokens) * 52));
          const interactive = Boolean(onPartSelect);
          return (
            <div
              key={part.id}
              className={[styles.layer, patternClass(visualStyle.pattern), selected ? styles.selected : ''].filter(Boolean).join(' ')}
              style={{ minHeight: height, ...contextVisualStyleToCssVars(visualStyle) }}
              title={`${part.label}: ${formatTokens(part.tokens)} (${styleName(styleSet, part.styleKey)})`}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-pressed={interactive ? selected : undefined}
              onClick={interactive ? () => onPartSelect?.(part.id) : undefined}
              onKeyDown={interactive ? (event) => handlePartKeyDown(event, part.id, onPartSelect) : undefined}
            >
              <span className={styles.label}>{part.label}</span>
              <span className={styles.tokens}>{formatTokens(part.tokens)}</span>
            </div>
          );
        })}
      </div>
      <div className={styles.caption}>{snapshot.title}</div>
    </div>
  );
}
