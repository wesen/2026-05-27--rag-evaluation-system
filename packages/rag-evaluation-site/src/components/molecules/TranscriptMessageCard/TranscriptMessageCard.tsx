import type { HTMLAttributes } from 'react';
import type { TranscriptAnnotation, TranscriptMessage } from '../../../context';
import { AnnotationBadge, TranscriptRoleBadge } from '../../atoms';
import { Caption, CodeText } from '../../foundation';
import styles from './TranscriptMessageCard.module.css';
export interface TranscriptMessageCardProps extends HTMLAttributes<HTMLDivElement> { message: TranscriptMessage; annotations?: TranscriptAnnotation[]; selectedAnnotationId?: string; onAnnotationSelect?: (annotationId: string) => void; }
export function TranscriptMessageCard({ message, annotations = [], selectedAnnotationId, onAnnotationSelect, className, ...rest }: TranscriptMessageCardProps) {
  const messageAnnotations = annotations.filter(a => a.targetMessageId === message.id || message.annotationIds?.includes(a.id));
  return <article className={[styles.root, styles[message.role] ?? styles.other, className ?? ''].filter(Boolean).join(' ')} data-rag-molecule="TranscriptMessageCard" data-role={message.role} {...rest}>
    <header className={styles.header}><TranscriptRoleBadge role={message.role} name={message.name} /><Caption>{message.tokens?.toLocaleString() ?? '—'} tok</Caption></header>
    <pre className={styles.body}>{message.text}</pre>
    {messageAnnotations.length > 0 && <div className={styles.annotations}>{messageAnnotations.map(annotation => <button key={annotation.id} type="button" className={styles.annotationButton} onClick={() => onAnnotationSelect?.(annotation.id)}><AnnotationBadge kind={annotation.kind} label={annotation.label} selected={selectedAnnotationId === annotation.id} /></button>)}</div>}
    {message.metadata && <CodeText>{JSON.stringify(message.metadata)}</CodeText>}
  </article>;
}
