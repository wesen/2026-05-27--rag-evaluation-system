import type { ContextDiagramStyle, ContextPartKind } from './types';

export const CONTEXT_INK = '#000000';
export const CONTEXT_ACCENT = '#0000CC';
export const CONTEXT_RED = '#CC0000';

export interface ContextKindVisualSpec {
  fill: string;
  stroke: string;
  label: string;
  name: string;
  dashed?: boolean;
  dotted?: boolean;
  inner?: boolean;
  narrow?: boolean;
  thin?: boolean;
  strokeWidth?: number;
  pattern?: 'checker' | 'diagonal' | 'diagonalDense' | 'stipple' | 'cross' | 'overflow';
}

export const contextKindOrder: ContextPartKind[] = [
  'system',
  'instruction',
  'context',
  'conversation',
  'summary',
  'retrieval',
  'tool',
  'result',
  'generated',
  'annotation',
  'course',
  'evicted',
  'active',
  'empty',
  'other',
];

const patternSpecs: Record<ContextPartKind, ContextKindVisualSpec> = {
  empty: { fill: '#ffffff', stroke: CONTEXT_INK, dashed: true, label: '#666666', name: 'free space' },
  context: { fill: '#ffffff', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'context / history' },
  conversation: { fill: '#ffffff', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'conversation' },
  instruction: { fill: 'var(--rag-context-pattern-checker)', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'instruction' , pattern: 'checker' },
  system: { fill: 'var(--rag-context-pattern-checker)', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'system / instructions', pattern: 'checker' },
  summary: { fill: 'var(--rag-context-pattern-diagonal)', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'summary / memory', pattern: 'diagonal' },
  retrieval: { fill: 'var(--rag-context-pattern-stipple)', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'retrieval' , pattern: 'stipple' },
  tool: { fill: 'var(--rag-context-pattern-stipple)', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'tool call', pattern: 'stipple' },
  result: { fill: 'var(--rag-context-pattern-stipple)', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'tool result', pattern: 'stipple' },
  generated: { fill: 'var(--rag-context-pattern-diagonal-dense)', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'generated / scratchpad', pattern: 'diagonalDense' },
  annotation: { fill: 'var(--rag-context-pattern-diagonal)', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'annotation', pattern: 'diagonal' },
  course: { fill: '#ffffff', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'course material' },
  evicted: { fill: 'var(--rag-context-pattern-cross)', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'evicted / compressed', pattern: 'cross' },
  active: { fill: CONTEXT_ACCENT, stroke: CONTEXT_INK, label: '#ffffff', name: 'active (current)' },
  other: { fill: '#ffffff', stroke: CONTEXT_INK, label: CONTEXT_INK, name: 'other' },
};

const toneOverrides: Partial<Record<ContextPartKind, Partial<ContextKindVisualSpec>>> = {
  empty: { fill: '#ffffff', dashed: true, label: '#666666' },
  context: { fill: '#ffffff', label: '#000000' },
  conversation: { fill: '#ffffff', label: '#000000' },
  instruction: { fill: '#dddddd', label: '#000000', pattern: undefined },
  system: { fill: '#dddddd', label: '#000000', pattern: undefined },
  summary: { fill: '#eeeeee', label: '#000000', pattern: undefined },
  retrieval: { fill: '#d2d2d2', label: '#000000', pattern: undefined },
  tool: { fill: '#d2d2d2', label: '#000000', pattern: undefined },
  result: { fill: '#c4c4c4', label: '#000000', pattern: undefined },
  generated: { fill: '#a0a0a0', label: '#000000', pattern: undefined },
  annotation: { fill: '#eeeeee', label: '#000000', pattern: undefined },
  course: { fill: '#ffffff', label: '#000000' },
  evicted: { fill: '#6a6a6a', label: '#ffffff', pattern: undefined },
  active: { fill: CONTEXT_ACCENT, label: '#ffffff' },
  other: { fill: '#ffffff', label: '#000000' },
};

const outlineOverrides: Partial<Record<ContextPartKind, Partial<ContextKindVisualSpec>>> = {
  empty: { fill: '#ffffff', stroke: '#999999', dashed: true, label: '#666666' },
  context: { fill: '#ffffff', strokeWidth: 1.25, label: '#000000', pattern: undefined },
  conversation: { fill: '#ffffff', strokeWidth: 1.25, label: '#000000', pattern: undefined },
  instruction: { fill: '#ffffff', strokeWidth: 2.5, label: '#000000', pattern: undefined },
  system: { fill: '#ffffff', strokeWidth: 2.5, label: '#000000', pattern: undefined },
  summary: { fill: '#ffffff', dashed: true, label: '#000000', pattern: undefined },
  retrieval: { fill: '#ffffff', dotted: true, label: '#000000', pattern: undefined },
  tool: { fill: '#ffffff', dotted: true, label: '#000000', pattern: undefined },
  result: { fill: '#ffffff', dotted: true, label: '#000000', pattern: undefined },
  generated: { fill: '#ffffff', strokeWidth: 2.5, dashed: true, label: '#000000', pattern: undefined },
  annotation: { fill: '#ffffff', dashed: true, label: '#000000', pattern: undefined },
  course: { fill: '#ffffff', strokeWidth: 1.25, label: '#000000' },
  evicted: { fill: '#ffffff', inner: true, dashed: true, label: '#000000', pattern: undefined },
  active: { fill: CONTEXT_ACCENT, label: '#ffffff' },
  other: { fill: '#ffffff', label: '#000000' },
};

export function getContextKindSpec(kind: ContextPartKind | string, mode: ContextDiagramStyle = 'pattern'): ContextKindVisualSpec {
  const normalized = isContextPartKind(kind) ? kind : 'other';
  const base = patternSpecs[normalized];
  if (mode === 'tone') {
    return { ...base, ...toneOverrides[normalized], stroke: toneOverrides[normalized]?.stroke ?? CONTEXT_INK };
  }
  if (mode === 'outline') {
    return { ...base, ...outlineOverrides[normalized], stroke: outlineOverrides[normalized]?.stroke ?? CONTEXT_INK };
  }
  return base;
}

export function getContextKindLabel(kind: ContextPartKind | string) {
  return getContextKindSpec(kind).name;
}

export function isContextPartKind(kind: string): kind is ContextPartKind {
  return contextKindOrder.includes(kind as ContextPartKind);
}
