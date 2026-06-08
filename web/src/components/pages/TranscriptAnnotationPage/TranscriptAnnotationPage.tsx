import { useState, useCallback } from 'react';
import { Panel, ScrollRegion } from '@go-go-golems/rag-evaluation-site';
import { DashboardGrid } from '@go-go-golems/rag-evaluation-site';
import { TranscriptReaderPanel, AnnotationRailPanel, type TranscriptFixture, contextTranscriptFixture } from '@go-go-golems/rag-evaluation-site';
import styles from './TranscriptAnnotationPage.module.css';

const FIXTURE: TranscriptFixture = contextTranscriptFixture;

export function TranscriptAnnotationPage() {
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | undefined>(undefined);

  const handleSelectAnnotation = useCallback((id: string) => {
    setSelectedAnnotationId((prev) => (prev === id ? undefined : id));
  }, []);

  return (
    <DashboardGrid recipe="twoColumn" className={styles.root} data-rag-page="TranscriptAnnotationPage">
      <ScrollRegion>
        <TranscriptReaderPanel
          transcript={FIXTURE}
          selectedAnnotationId={selectedAnnotationId}
          onSelectAnnotation={handleSelectAnnotation}
        />
      </ScrollRegion>
      <Panel className={styles.rail} title="Annotations" density="condensed">
        <ScrollRegion>
          <AnnotationRailPanel
            annotations={FIXTURE.annotations}
            selectedAnnotationId={selectedAnnotationId}
            onSelectAnnotation={handleSelectAnnotation}
          />
        </ScrollRegion>
      </Panel>
    </DashboardGrid>
  );
}

export default TranscriptAnnotationPage;
