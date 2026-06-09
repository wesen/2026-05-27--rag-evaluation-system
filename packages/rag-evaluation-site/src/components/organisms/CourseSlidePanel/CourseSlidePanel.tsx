import type { HTMLAttributes } from 'react';
import type { ContextSlide, ContextStyleSet, ContextWindowSnapshot } from '../../../context';
import { contextDefaultStyleSet } from '../../../context';
import { Button } from '../../atoms';
import { Inline, SlideShell } from '../../layout';
import { ContextBudgetBar, ContextLegend, ContextStackDiagram, ContextStripDiagram, ContextTreemap, FigureBlock, KeyPointList } from '../../molecules';

export interface CourseSlidePanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  slide: ContextSlide;
  snapshot: ContextWindowSnapshot;
  styleSet?: ContextStyleSet;
  index?: number;
  total?: number;
  visualSide?: 'left' | 'right';
  onPrevious?: () => void;
  onNext?: () => void;
}

function renderSlideVisual(slide: ContextSlide, snapshot: ContextWindowSnapshot, styleSet: ContextStyleSet) {
  if (slide.view === 'strip') return <ContextStripDiagram snapshot={snapshot} styleSet={styleSet} />;
  if (slide.view === 'stack') return <ContextStackDiagram snapshot={snapshot} styleSet={styleSet} />;
  if (slide.view === 'budget') return <ContextBudgetBar snapshot={snapshot} styleSet={styleSet} />;
  return <ContextTreemap snapshot={snapshot} styleSet={styleSet} />;
}

export function CourseSlidePanel({ slide, snapshot, styleSet = contextDefaultStyleSet, index, total, visualSide = 'left', onPrevious, onNext, className, ...rest }: CourseSlidePanelProps) {
  const counter = index != null && total != null ? `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}` : undefined;
  const visual = (
    <FigureBlock caption={`${snapshot.title} — ${snapshot.limit.toLocaleString()} token window`} legend={<ContextLegend items={styleSet.legend} styles={styleSet.styles} size="sm" />}>
      {renderSlideVisual(slide, snapshot, styleSet)}
    </FigureBlock>
  );
  const notes = <KeyPointList items={slide.notes} />;
  const footer = (onPrevious || onNext) ? (
    <Inline justify="between">
      <Button size="compact" onClick={onPrevious} disabled={!onPrevious}>◂ Prev</Button>
      <Button size="compact" onClick={onNext} disabled={!onNext}>Next ▸</Button>
    </Inline>
  ) : undefined;

  return <SlideShell eyebrow={slide.kicker} counter={counter} title={slide.title} primary={visual} secondary={notes} primarySide={visualSide} ratio="primaryWide" footer={footer} className={className} data-rag-organism="CourseSlidePanel" {...rest} />;
}
