import type { HTMLAttributes } from 'react';
import type { TranscriptAnnotation, TranscriptMessage, TranscriptRole } from '../../../context';
import { Caption } from '../../foundation';
import styles from './TranscriptMessageCard.module.css';

export interface TranscriptMessageCardProps extends HTMLAttributes<HTMLElement> {
  message: TranscriptMessage;
  annotations?: TranscriptAnnotation[];
  selectedAnnotationId?: string;
  onAnnotationSelect?: (annotationId: string) => void;
  showAnnotationChips?: boolean;
}

const ROLE_LABEL: Record<TranscriptRole, string> = {
  system: 'SYSTEM',
  developer: 'DEVELOPER',
  user: 'USER',
  assistant: 'ASSISTANT',
  tool: 'TOOL',
  other: 'MESSAGE',
};

const ROLE_GLYPH: Record<TranscriptRole, string> = {
  system: '◆',
  developer: '◇',
  user: '▸',
  assistant: '✦',
  tool: '⚙',
  other: '•',
};

function annotationIndex(annotations: TranscriptAnnotation[], annotationId: string) {
  return annotations.findIndex((annotation) => annotation.id === annotationId) + 1;
}

export function TranscriptMessageCard({
  message,
  annotations = [],
  selectedAnnotationId,
  onAnnotationSelect,
  showAnnotationChips = true,
  className,
  ...rest
}: TranscriptMessageCardProps) {
  const messageAnnotations = annotations.filter((annotation) => annotation.targetMessageId === message.id || message.annotationIds?.includes(annotation.id));
  const hasSelectedAnnotation = messageAnnotations.some((annotation) => annotation.id === selectedAnnotationId);
  const title = message.name ? `${ROLE_LABEL[message.role]} · ${message.name}` : ROLE_LABEL[message.role];
  const bodyClassName = [styles.body, message.role === 'tool' ? styles.toolBody : ''].filter(Boolean).join(' ');

  return (
    <article
      className={[styles.root, styles[message.role] ?? styles.other, hasSelectedAnnotation ? styles.selected : '', className ?? ''].filter(Boolean).join(' ')}
      data-rag-molecule="TranscriptMessageCard"
      data-rag-message-id={message.id}
      data-rag-role={message.role}
      data-rag-has-notes={messageAnnotations.length > 0 ? 'true' : undefined}
      {...rest}
    >
      <header className={styles.titleBar}>
        <div className={styles.titleCluster}>
          <span className={styles.roleGlyph} aria-hidden="true">{ROLE_GLYPH[message.role]}</span>
          <span className={styles.roleLabel}>{title}</span>
        </div>
        <div className={styles.metaCluster}>
          {showAnnotationChips && messageAnnotations.map((annotation) => {
            const index = annotationIndex(annotations, annotation.id);
            const selected = selectedAnnotationId === annotation.id;
            return (
              <button
                key={annotation.id}
                type="button"
                className={styles.noteChip}
                data-selected={selected ? 'true' : undefined}
                onClick={() => onAnnotationSelect?.(annotation.id)}
              >
                note {index > 0 ? index : ''}
              </button>
            );
          })}
          <Caption>{message.tokens?.toLocaleString() ?? '—'} tok</Caption>
        </div>
      </header>
      <div className={bodyClassName}>{message.text}</div>
    </article>
  );
}
