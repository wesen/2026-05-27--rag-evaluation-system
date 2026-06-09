import type { HTMLAttributes } from 'react';
import { contextDefaultStyleSet, resolveContextVisualStyle, type ContextStyleSet, type TranscriptAnnotation } from '../../../context';
import { ContextStyleSwatch } from '../../atoms';
import { Caption } from '../../foundation';
import styles from './AnnotationNoteCard.module.css';

export interface AnnotationNoteCardProps extends HTMLAttributes<HTMLElement> {
  annotation: TranscriptAnnotation;
  styleSet?: ContextStyleSet;
  selected?: boolean;
  index?: number;
}

export function AnnotationNoteCard({ annotation, styleSet = contextDefaultStyleSet, selected = false, index, className, ...rest }: AnnotationNoteCardProps) {
  const visualStyle = resolveContextVisualStyle(annotation.styleKey, styleSet);
  return (
    <aside
      className={[styles.root, selected ? styles.selected : '', className ?? ''].filter(Boolean).join(' ')}
      data-rag-molecule="AnnotationNoteCard"
      data-rag-note-id={annotation.id}
      data-rag-target-message-id={annotation.targetMessageId}
      {...rest}
    >
      <header className={styles.titleBar}>
        <span className={styles.noteLabel}>NOTE {index ?? ''}</span>
        <ContextStyleSwatch visualStyle={visualStyle} size="sm" selected={selected} />
      </header>
      <div className={styles.body}>
        <div className={styles.title}>{annotation.label}</div>
        <p className={styles.text}>{annotation.text}</p>
        {annotation.confidence != null && <Caption>confidence {Math.round(annotation.confidence * 100)}%</Caption>}
      </div>
    </aside>
  );
}
