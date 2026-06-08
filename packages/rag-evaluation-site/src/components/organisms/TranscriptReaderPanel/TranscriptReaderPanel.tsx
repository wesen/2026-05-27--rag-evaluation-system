import type { HTMLAttributes } from 'react';
import type { TranscriptAnnotation, TranscriptMessage } from '../../../context';
import { TranscriptMessageCard, TranscriptSessionHeader } from '../../molecules';
import styles from './TranscriptReaderPanel.module.css';

export interface TranscriptReaderPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: string;
  subtitle?: string;
  messages: TranscriptMessage[];
  annotations?: TranscriptAnnotation[];
  selectedAnnotationId?: string;
  onAnnotationSelect?: (annotationId: string) => void;
  showAnnotationChips?: boolean;
}

function tokenTotal(messages: TranscriptMessage[]) {
  return messages.reduce((total, message) => total + (message.tokens ?? 0), 0);
}

export function TranscriptReaderPanel({
  title = 'Transcript',
  subtitle,
  messages,
  annotations = [],
  selectedAnnotationId,
  onAnnotationSelect,
  showAnnotationChips = true,
  className,
  ...rest
}: TranscriptReaderPanelProps) {
  return (
    <section className={[styles.root, className ?? ''].filter(Boolean).join(' ')} data-rag-organism="TranscriptReaderPanel" {...rest}>
      <TranscriptSessionHeader title={title} subtitle={subtitle} messageCount={messages.length} annotationCount={annotations.length} tokenTotal={tokenTotal(messages)} />
      <div className={styles.stream}>
        {messages.map((message) => (
          <TranscriptMessageCard
            key={message.id}
            message={message}
            annotations={annotations}
            selectedAnnotationId={selectedAnnotationId}
            onAnnotationSelect={onAnnotationSelect}
            showAnnotationChips={showAnnotationChips}
          />
        ))}
      </div>
    </section>
  );
}
