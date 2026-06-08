import type { HTMLAttributes } from 'react';
import type { ContextPartKind } from '../../../context';
import { ContextKindSwatch } from '../ContextKindSwatch';
import styles from './AnnotationBadge.module.css';
export interface AnnotationBadgeProps extends HTMLAttributes<HTMLSpanElement> { kind: ContextPartKind; label: string; selected?: boolean; }
export function AnnotationBadge({ kind, label, selected = false, className, ...rest }: AnnotationBadgeProps) {
  return <span className={[styles.root, selected ? styles.selected : '', className ?? ''].filter(Boolean).join(' ')} data-rag-atom="AnnotationBadge" data-kind={kind} {...rest}><ContextKindSwatch kind={kind} size="sm" selected={selected} /><span>{label}</span></span>;
}
