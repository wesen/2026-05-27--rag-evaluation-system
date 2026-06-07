import type { HTMLAttributes } from 'react';
import type { TranscriptAnnotation } from '../../../context';
import { AnnotationBadge } from '../../atoms';
import { Caption } from '../../foundation';
import styles from './AnnotationNoteCard.module.css';
export interface AnnotationNoteCardProps extends HTMLAttributes<HTMLDivElement> { annotation: TranscriptAnnotation; selected?: boolean; }
export function AnnotationNoteCard({ annotation, selected=false, className, ...rest }: AnnotationNoteCardProps) {
  return <aside className={[styles.root, selected ? styles.selected : '', className ?? ''].filter(Boolean).join(' ')} data-rag-molecule="AnnotationNoteCard" {...rest}><AnnotationBadge kind={annotation.kind} label={annotation.label} selected={selected}/><p className={styles.text}>{annotation.text}</p>{annotation.confidence != null && <Caption>confidence {Math.round(annotation.confidence * 100)}%</Caption>}</aside>;
}
