import type { KeyboardEvent } from 'react';

export type ContextArrowOrientation = 'horizontal' | 'vertical' | 'both';

export function handleContextPartKeyDown(
  event: KeyboardEvent<HTMLElement>,
  partId: string,
  orderedPartIds: string[],
  onPartSelect: ((partId: string) => void) | undefined,
  orientation: ContextArrowOrientation,
) {
  if (!onPartSelect) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onPartSelect(partId);
    return;
  }

  const previousKeys = orientation === 'horizontal' ? ['ArrowLeft'] : orientation === 'vertical' ? ['ArrowUp'] : ['ArrowLeft', 'ArrowUp'];
  const nextKeys = orientation === 'horizontal' ? ['ArrowRight'] : orientation === 'vertical' ? ['ArrowDown'] : ['ArrowRight', 'ArrowDown'];
  const currentIndex = orderedPartIds.indexOf(partId);
  if (currentIndex < 0) return;

  if (previousKeys.includes(event.key)) {
    event.preventDefault();
    onPartSelect(orderedPartIds[Math.max(0, currentIndex - 1)] ?? partId);
    return;
  }
  if (nextKeys.includes(event.key)) {
    event.preventDefault();
    onPartSelect(orderedPartIds[Math.min(orderedPartIds.length - 1, currentIndex + 1)] ?? partId);
    return;
  }
  if (event.key === 'Home') {
    event.preventDefault();
    onPartSelect(orderedPartIds[0] ?? partId);
    return;
  }
  if (event.key === 'End') {
    event.preventDefault();
    onPartSelect(orderedPartIds[orderedPartIds.length - 1] ?? partId);
  }
}
