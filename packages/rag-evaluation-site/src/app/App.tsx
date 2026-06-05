import { ErrorCallout } from '../components/atoms';
import { Caption } from '../components/foundation';
import { Panel } from '../components/layout';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import type { ActionSpec } from '../widgets/ir';
import type { WidgetActionContext } from '../widgets/actions';
import { useWidgetPage } from '../hooks/useWidgetPage';
import './app.css';

export interface RagEvaluationSiteAppProps {
  apiBase?: string;
  defaultPageId?: string;
}

export function RagEvaluationSiteApp({ apiBase = '/api/widget', defaultPageId = 'index' }: RagEvaluationSiteAppProps) {
  const pageId = readPageIdFromLocation(defaultPageId);
  const cleanApiBase = apiBase.replace(/\/$/, '');
  const { page, loading, error, refresh } = useWidgetPage(`${cleanApiBase}/pages/${encodeURIComponent(pageId)}`);

  async function handleAction(action: ActionSpec, context: WidgetActionContext): Promise<void> {
    if (action.kind !== 'server') return;
    const response = await fetch(`${cleanApiBase}/actions/${encodeURIComponent(action.name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: action.payload ?? {}, context }),
    });
    if (!response.ok) {
      throw new Error(`Widget action failed: ${response.status} ${response.statusText}`);
    }
    const result = await response.json() as { refresh?: boolean; toast?: string };
    if (result.toast && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('widget:toast', { detail: result }));
    }
    if (result.refresh) refresh();
  }

  if (loading) {
    return <Panel className="rag-evaluation-site-state" title="RAG Evaluation Site" density="condensed"><Caption>Loading Widget IR…</Caption></Panel>;
  }

  if (error) {
    return <ErrorCallout className="rag-evaluation-site-state">Failed to load Widget IR page: {error.message}</ErrorCallout>;
  }

  if (!page) {
    return <Panel className="rag-evaluation-site-state" title="RAG Evaluation Site" density="condensed"><Caption>No Widget IR returned.</Caption></Panel>;
  }

  return (
    <div className="rag-evaluation-site-root" data-rag-page="RagEvaluationSiteApp" data-page-id={page.id}>
      <WidgetRenderer node={page.root} onAction={(action, context) => { void handleAction(action, context); }} />
    </div>
  );
}

function readPageIdFromLocation(defaultPageId: string): string {
  if (typeof window === 'undefined') return defaultPageId;
  const url = new URL(window.location.href);
  const queryPage = url.searchParams.get('page');
  if (queryPage) return queryPage;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'pages' && parts[1]) return parts[1];
  return defaultPageId;
}
