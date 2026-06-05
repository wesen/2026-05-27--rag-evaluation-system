import type { ActionSpec, JsonObject } from './ir';

export interface WidgetActionContext {
  row?: JsonObject;
  rowKey?: string;
  value?: string | number | boolean | null;
  componentType?: string;
  [key: string]: unknown;
}

export type WidgetActionHandler = (action: ActionSpec, context: WidgetActionContext) => void;

export function dispatchWidgetAction(action: ActionSpec, context: WidgetActionContext = {}, onAction?: WidgetActionHandler): void {
  if (onAction) {
    onAction(action, context);
    return;
  }

  if (action.kind === 'copy') {
    const value = action.value ?? (action.field && context.row ? String(context.row[action.field] ?? '') : '');
    if (value) {
      navigator.clipboard?.writeText(value).catch(() => {});
    }
    return;
  }

  if (action.kind === 'event') {
    window.dispatchEvent(new CustomEvent(action.event, { detail: { ...(action.detail ?? {}), context } }));
    return;
  }

  if (action.kind === 'navigate') {
    const target = interpolate(action.to, context);
    window.history.pushState(action.params ?? {}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
    return;
  }

  if (action.kind === 'server') {
    void fetch(`/api/v1/dsl/actions/${encodeURIComponent(action.name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: action.payload ?? {}, context }),
    });
  }
}

export function bindAction(action: ActionSpec | undefined, context: WidgetActionContext, onAction?: WidgetActionHandler): (() => void) | undefined {
  if (!action) return undefined;
  return () => dispatchWidgetAction(action, context, onAction);
}

function interpolate(template: string, context: WidgetActionContext): string {
  return template.replace(/\$\{([^}]+)\}|\$([A-Za-z0-9_.-]+)/g, (_match, braced: string | undefined, bare: string | undefined) => {
    const path = braced ?? bare ?? '';
    const value = lookupContext(path, context);
    return encodeURIComponent(String(value ?? ''));
  });
}

function lookupContext(path: string, context: WidgetActionContext): unknown {
  const parts = path.split('.').filter(Boolean);
  let current: unknown = context;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
