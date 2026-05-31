import React, { useState, useMemo, useCallback } from 'react';
import {
  useListWorkflowsQuery,
  useGetWorkflowQuery,
  useGetWorkflowOpsQuery,
  useGetOpResultQuery,
  useSubmitIntakeWorkflowMutation,
  useRetryOpMutation,
  useCancelWorkflowMutation,
  useListQueuesQuery,
  useListSourcesQuery,
  WorkflowListItem,
  WorkflowOpGroup,
  QueueStatus,
  SubmitIntakeRequest,
} from '../../services/api';

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, string> = {
  pending: '◌', ready: '◌', running: '●', succeeded: '✔', failed: '✘', canceled: '⊘',
};
const STATUS_CLASS: Record<string, string> = {
  pending: 'status-pending', ready: 'status-pending', running: 'status-running',
  succeeded: 'status-done', failed: 'status-error', canceled: 'status-canceled',
};

function statusIcon(s: string) { return STATUS_ICON[s] ?? '?'; }
function statusClass(s: string) { return STATUS_CLASS[s] ?? ''; }

function friendlyOpName(op: string): string {
  return op.replace(/_/g, ' ');
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'now';
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h`;
  return `${Math.floor(ms / 86400000)}d`;
}

// ─── Queue Health Widget ─────────────────────────────────────────────────────

const QueueHealthWidget: React.FC = () => {
  const { data: queues = [], isLoading } = useListQueuesQuery(undefined, {
    pollingInterval: 5000,
  });

  const totalReady = queues.reduce((s: number, q: QueueStatus) => s + q.ready, 0);
  const totalRunning = queues.reduce((s: number, q: QueueStatus) => s + q.running, 0);
  const totalFailed = queues.reduce((s: number, q: QueueStatus) => s + q.failed, 0);

  return (
    <div className="panel" style={{ minWidth: 240 }}>
      <div className="panel-header">
        <span>Queue Health</span>
      </div>
      <div className="panel-body-condensed">
        {isLoading ? (
          <div className="text-dim text-mono">Loading...</div>
        ) : queues.length === 0 ? (
          <div className="text-dim text-mono">No queues active</div>
        ) : (
          <>
            <div className="stat-grid" style={{ marginBottom: 6 }}>
              <span className="stat-label">Ready</span><span className="stat-value">{totalReady}</span>
              <span className="stat-label">Running</span><span className="stat-value">{totalRunning}</span>
              <span className="stat-label">Failed</span>
              <span className="stat-value" style={{ color: totalFailed > 0 ? 'var(--mac-accent-2)' : undefined }}>
                {totalFailed}
              </span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Queue</th><th>R</th><th>Run</th><th>F</th></tr>
              </thead>
              <tbody>
                {queues.map((q: QueueStatus) => (
                  <tr key={q.queue}>
                    <td className="mono">{q.queue.replace('rag-eval:', '')}</td>
                    <td className="num">{q.ready}</td>
                    <td className="num">{q.running}</td>
                    <td className="num" style={{ color: q.failed > 0 ? 'var(--mac-accent-2)' : undefined }}>
                      {q.failed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Submit Intake Modal ──────────────────────────────────────────────────────

interface SubmitIntakeModalProps {
  onClose: () => void;
  onSubmitted: (workflowId: string) => void;
}

const SubmitIntakeModal: React.FC<SubmitIntakeModalProps> = ({ onClose, onSubmitted }) => {
  const { data: sourcesData } = useListSourcesQuery();
  const [submitIntake, { isLoading: submitting }] = useSubmitIntakeWorkflowMutation();
  const [error, setError] = useState<string | null>(null);

  const sourceNames = (sourcesData as unknown as { sources?: Array<{ source_id: string }> })?.sources
    ?.map(s => s.source_id) ?? [];

  const [form, setForm] = useState<SubmitIntakeRequest>({
    strategy: 'fixed',
    chunk_size: 1200,
    overlap: 150,
    embeddings_type: 'ollama',
    embeddings_engine: 'nomic-embed-text',
    embeddings_dimensions: 768,
    batch_size: 16,
    skip_embeddings: false,
    skip_bm25: false,
  });

  const [sourceInput, setSourceInput] = useState('');

  const strategyId = useMemo(() =>
    `${form.strategy}-${form.chunk_size}-${form.overlap}`, [form.strategy, form.chunk_size, form.overlap]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    try {
      const sourceIds = sourceInput.split(',').map(s => s.trim()).filter(Boolean);
      if (sourceIds.length === 0) {
        setError('At least one source ID is required');
        return;
      }
      const result = await submitIntake({ ...form, source_ids: sourceIds }).unwrap();
      onSubmitted(result.workflow_id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || 'Submission failed');
    }
  }, [form, sourceInput, submitIntake, onSubmitted]);

  const set = (key: keyof SubmitIntakeRequest, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel modal-panel">
        <div className="panel-header">
          <span>Submit Intake Workflow</span>
          <button className="copy-btn" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body-condensed" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10 }}>
          <fieldset className="form-section">
            <legend>Document Selection</legend>
            <div className="form-row">
              <label>Source IDs</label>
              <input className="input" style={{ flex: 1 }} value={sourceInput}
                onChange={e => setSourceInput(e.target.value)} placeholder="ttc-guides, ttc-articles" />
            </div>
            {sourceNames.length > 0 && (
              <div className="text-dim text-mono" style={{ fontSize: 10 }}>
                Available: {sourceNames.join(', ')}
              </div>
            )}
            <div className="form-row">
              <label>Strategy</label>
              <span className="mono" style={{ fontWeight: 'bold' }}>{strategyId}</span>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Chunking</legend>
            <div className="form-row">
              <label>Strategy</label>
              <select className="select" value={form.strategy} onChange={e => set('strategy', e.target.value)}>
                <option value="fixed">fixed</option>
                <option value="recursive">recursive</option>
              </select>
            </div>
            <div className="form-row">
              <label>Chunk Size</label>
              <input className="input" type="number" value={form.chunk_size}
                onChange={e => set('chunk_size', +e.target.value)} style={{ width: 80 }} />
            </div>
            <div className="form-row">
              <label>Overlap</label>
              <input className="input" type="number" value={form.overlap}
                onChange={e => set('overlap', +e.target.value)} style={{ width: 80 }} />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Embedding</legend>
            <div className="form-row">
              <label>Compute</label>
              <input type="checkbox" checked={!form.skip_embeddings}
                onChange={e => set('skip_embeddings', !e.target.checked)} />
            </div>
            {!form.skip_embeddings && (
              <>
                <div className="form-row">
                  <label>Provider</label>
                  <select className="select" value={form.embeddings_type}
                    onChange={e => set('embeddings_type', e.target.value)}>
                    <option value="ollama">ollama</option>
                    <option value="openai">openai</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Engine</label>
                  <input className="input" value={form.embeddings_engine}
                    onChange={e => set('embeddings_engine', e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Dimensions</label>
                  <input className="input" type="number" value={form.embeddings_dimensions}
                    onChange={e => set('embeddings_dimensions', +e.target.value)} style={{ width: 80 }} />
                </div>
                <div className="form-row">
                  <label>Batch Size</label>
                  <input className="input" type="number" value={form.batch_size}
                    onChange={e => set('batch_size', +e.target.value)} style={{ width: 80 }} />
                </div>
              </>
            )}
          </fieldset>

          <fieldset className="form-section">
            <legend>BM25 Index</legend>
            <div className="form-row">
              <label>Build</label>
              <input type="checkbox" checked={!form.skip_bm25}
                onChange={e => set('skip_bm25', !e.target.checked)} />
            </div>
          </fieldset>

          {error && (
            <div className="error-box">{error}</div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !sourceInput}>
              {submitting ? 'Submitting…' : 'Submit Workflow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Op Group Row ────────────────────────────────────────────────────────────

const OpGroupRow: React.FC<{
  group: WorkflowOpGroup;
  onInspect: (sample: WorkflowOpGroup['sample']) => void;
  isSelected: boolean;
}> = ({ group, onInspect, isSelected }) => {
  return (
    <tr className={isSelected ? 'selected' : 'selectable'}
      onClick={() => onInspect(group.sample)}>
      <td className={statusClass(group.status)}>{statusIcon(group.status)} {group.status}</td>
      <td>{friendlyOpName(group.operation)}</td>
      <td className="mono" style={{ fontSize: 11 }}>{group.queue.replace('rag-eval:', '')}</td>
      <td className="num">{group.count}</td>
    </tr>
  );
};

// ─── Progress Bar ────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ done: number; total: number; running?: number; failed?: number }> = ({
  done, total, running = 0, failed = 0,
}) => {
  const pct = total > 0 ? (done / total) * 100 : 0;
  const runPct = total > 0 ? (running / total) * 100 : 0;
  const failPct = total > 0 ? (failed / total) * 100 : 0;

  return (
    <div className="progress-bar">
      <div className="progress-fill status-done" style={{ width: `${pct}%` }} />
      {running > 0 && <div className="progress-fill status-running"
        style={{ width: `${runPct}%`, marginLeft: `${pct}%`, position: 'absolute', top: 0 }} />}
      {failed > 0 && <div className="progress-fill status-error"
        style={{ width: `${failPct}%`, marginLeft: `${pct + runPct}%`, position: 'absolute', top: 0 }} />}
      <div className="progress-label" style={{ color: pct > 50 ? 'var(--mac-text-inv)' : 'var(--mac-text)' }}>
        {done}/{total} ({Math.round(pct)}%)
      </div>
    </div>
  );
};

// ─── Op Graph ────────────────────────────────────────────────────────────────

const OpGraph: React.FC<{ groups: WorkflowOpGroup[]; total: number; done: number }> = ({ groups, total, done }) => {
  // Classify operations into phases
  const fanOutOps = groups.filter(g =>
    g.operation === 'chunk_document' || g.operation === 'preprocess_document');
  const fanInOps = groups.filter(g =>
    g.operation === 'compute_embeddings' || g.operation === 'build_bm25');
  const otherOps = groups.filter(g =>
    !fanOutOps.some(f => f.operation === g.operation && f.status === g.status) &&
    !fanInOps.some(f => f.operation === g.operation && f.status === g.status));

  return (
    <div className="op-graph">
      {/* Fan-out: per-document operations */}
      <div className="op-fan-out">
        {fanOutOps.map(g => (
          <span key={g.operation + '|' + g.status}
            className={`op-node ${statusClass(g.status)}`}>
            {statusIcon(g.status)} {friendlyOpName(g.operation)} × {g.count}
          </span>
        ))}
        {otherOps.map(g => (
          <span key={g.operation + '|' + g.status}
            className={`op-node ${statusClass(g.status)}`}>
            {statusIcon(g.status)} {friendlyOpName(g.operation)} × {g.count}
          </span>
        ))}
      </div>

      {/* Arrow */}
      <div className="op-arrow">↓ {done}/{total} completed</div>

      {/* Fan-in: aggregate operations */}
      {fanInOps.length > 0 && (
        <div className="op-fan-out">
          {fanInOps.map(g => (
            <span key={g.operation + '|' + g.status}
              className={`op-node ${statusClass(g.status)}`}>
              {statusIcon(g.status)} {friendlyOpName(g.operation)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Op Result Section ────────────────────────────────────────────────────────

const OpResultSection: React.FC<{ workflowId: string; opId: string; opStatus: string }> = ({
  workflowId, opId, opStatus,
}) => {
  // Only fetch result for completed (succeeded/failed) ops
  const { data: result, isLoading, error } = useGetOpResultQuery(
    { workflowId, opId },
    { skip: opStatus !== 'succeeded' && opStatus !== 'failed' },
  );

  if (opStatus !== 'succeeded' && opStatus !== 'failed') return null;
  if (isLoading) return <div className="text-dim text-mono" style={{ marginTop: 6 }}>Loading result…</div>;

  // 404 = no result yet (op completed but result not written, or op not actually completed)
  if (error) {
    if ('status' in error && (error as { status: number }).status === 404) {
      return (
        <fieldset className="form-section" style={{ marginTop: 6 }}>
          <legend>Result</legend>
          <div className="text-dim text-mono">No result data recorded for this op.</div>
        </fieldset>
      );
    }
    return (
      <div className="error-box" style={{ marginTop: 6 }}>
        Failed to load result: {String(error)}
      </div>
    );
  }

  if (!result) return null;

  return (
    <fieldset className="form-section" style={{ marginTop: 6 }}>
      <legend>Result</legend>
      <div className="meta-grid">
        <span className="meta-key">Completed</span>
        <span className="meta-value">{result.CompletedAt || '—'}</span>
      </div>

      {/* Data field */}
      {result.Data && Object.keys(result.Data).length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div className="text-bold" style={{ fontSize: 11 }}>Data</div>
          <pre className="text-mono" style={{ fontSize: 10, overflowX: 'auto', background: 'var(--mac-bg-dark)', color: 'var(--mac-text-inv)', padding: 4, maxHeight: 120 }}>
            {JSON.stringify(result.Data, null, 2)}
          </pre>
        </div>
      )}

      {/* Records written */}
      {result.Records && result.Records.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div className="text-bold" style={{ fontSize: 11 }}>Records Written ({result.Records.length})</div>
          <table className="data-table" style={{ fontSize: 10 }}>
            <thead><tr><th>Table</th><th>PK</th></tr></thead>
            <tbody>
              {result.Records.map((rec, i) => (
                <tr key={i}><td className="mono">{rec.Table}</td><td className="mono">{rec.PK}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Artifacts produced */}
      {result.Artifacts && result.Artifacts.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div className="text-bold" style={{ fontSize: 11 }}>Artifacts ({result.Artifacts.length})</div>
          {result.Artifacts.map((art, i) => (
            <div key={i} className="meta-grid">
              <span className="meta-key">{art.Name}</span>
              <span className="meta-value">{art.Kind} · {art.ContentType}</span>
            </div>
          ))}
        </div>
      )}

      {/* Emitted (child) ops */}
      {result.EmittedIDs && result.EmittedIDs.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div className="text-bold" style={{ fontSize: 11 }}>Emitted Ops ({result.EmittedIDs.length})</div>
          <div className="text-mono" style={{ fontSize: 10, maxHeight: 60, overflowY: 'auto' }}>
            {result.EmittedIDs.slice(0, 20).map(id => <div key={id}>{id}</div>)}
            {result.EmittedIDs.length > 20 && <div>… and {result.EmittedIDs.length - 20} more</div>}
          </div>
        </div>
      )}

      {/* Error from result */}
      {result.Error && (
        <div className="error-box" style={{ marginTop: 4 }}>
          [{result.Error.Code}] {result.Error.Message}
          {result.Error.Retryable && <div className="text-dim">(retryable)</div>}
        </div>
      )}
    </fieldset>
  );
};

// ─── Workflow Detail ──────────────────────────────────────────────────────────

interface WorkflowDetailProps {
  workflowId: string;
  onBack: () => void;
  onNavigateToCorpus: (sourceId: string, strategyId: string) => void;
}

const WorkflowDetail: React.FC<WorkflowDetailProps> = ({ workflowId, onBack, onNavigateToCorpus }) => {
  const { data: summary, isLoading: summaryLoading } = useGetWorkflowQuery(workflowId, {
    pollingInterval: 2000,
  });
  const { data: opsData, isLoading: opsLoading } = useGetWorkflowOpsQuery(workflowId, {
    pollingInterval: 2000,
  });
  const [retryOp, { isLoading: retrying }] = useRetryOpMutation();
  const [cancelWorkflow] = useCancelWorkflowMutation();
  const [inspectedGroup, setInspectedGroup] = useState<string | null>(null);

  if (summaryLoading || opsLoading) return <div className="text-dim text-mono">Loading workflow…</div>;

  const wf = summary?.workflow;
  const groups = opsData?.groups ?? [];
  const totalOps = opsData?.total ?? 0;

  if (!wf) return <div className="text-dim text-mono">Workflow not found.</div>;

  const isRunning = wf.Status === 'running' || wf.Status === 'pending';
  const input = wf.Input as Record<string, unknown>;
  const strategyId = (input?.strategy_id as string) ?? wf.Metadata?.strategy ?? '?';
  const sourceIds = (input?.source_ids as string[]) ?? [];
  const docIds = (input?.document_ids as string[]) ?? [];

  // Compute counts per status from groups
  const succeededCount = groups.filter(g => g.status === 'succeeded').reduce((s, g) => s + g.count, 0);
  const failedCount = groups.filter(g => g.status === 'failed').reduce((s, g) => s + g.count, 0);
  const runningCount = groups.filter(g => g.status === 'running').reduce((s, g) => s + g.count, 0);
  const pendingCount = groups.filter(g => g.status === 'pending' || g.status === 'ready').reduce((s, g) => s + g.count, 0);

  // Find selected group sample
  const selectedGroup = inspectedGroup ? groups.find(g => g.operation + '|' + g.status === inspectedGroup) : null;
  const inspectedSample = selectedGroup?.sample ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header */}
      <div className="panel">
        <div className="panel-header">
          <button className="copy-btn" onClick={onBack}>← Back</button>
          <span style={{ flex: 1, textAlign: 'center' }}>{wf.ID}</span>
          <span className={statusClass(wf.Status)}>{statusIcon(wf.Status)} {wf.Status}</span>
        </div>
        <div className="panel-body-condensed">
          {/* Progress bar */}
          <ProgressBar done={succeededCount} total={totalOps} running={runningCount} failed={failedCount} />

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, marginTop: 4 }}>
            <span>Strategy: <span className="mono">{strategyId}</span></span>
            <span>Docs: <span className="num">{docIds.length}</span></span>
            {runningCount > 0 && <span className="status-running">Running: {runningCount}</span>}
            {pendingCount > 0 && <span className="status-pending">Pending: {pendingCount}</span>}
            {failedCount > 0 && <span className="status-error">Failed: {failedCount}</span>}
            <span>Age: <span className="mono">{timeAgo(wf.CreatedAt)}</span></span>
            {isRunning && (
              <button className="btn" style={{ marginLeft: 'auto' }}
                onClick={() => cancelWorkflow(workflowId)}>Cancel</button>
            )}
            {wf.Status === 'succeeded' && sourceIds[0] && (
              <button className="btn" style={{ marginLeft: 'auto' }}
                onClick={() => onNavigateToCorpus(sourceIds[0]!, strategyId)}>View in Corpus →</button>
            )}
          </div>
        </div>
      </div>

      {/* Op Graph */}
      <div className="panel">
        <div className="panel-header"><span>Op Graph</span></div>
        <OpGraph groups={groups} total={totalOps} done={succeededCount} />
      </div>

      {/* Op Groups Table */}
      <div className="panel">
        <div className="panel-header"><span>Ops by Group ({totalOps} total)</span></div>
        <div className="panel-body-condensed">
          {groups.length === 0 ? (
            <div className="text-dim text-mono">No ops yet</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Status</th><th>Operation</th><th>Queue</th><th>Count</th></tr>
              </thead>
              <tbody>
                {groups.map(g => (
                  <OpGroupRow
                    key={g.operation + '|' + g.status}
                    group={g}
                    onInspect={(sample) => setInspectedGroup(sample ? g.operation + '|' + g.status : null)}
                    isSelected={inspectedGroup === g.operation + '|' + g.status}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Inspector for a sample op */}
      {inspectedSample && (
        <div className="panel" style={{ borderLeft: '3px solid var(--mac-accent)' }}>
          <div className="panel-header">
            <span>Sample Op: {friendlyOpName(inspectedSample.op.Kind)}</span>
            <button className="copy-btn" onClick={() => setInspectedGroup(null)}>✕</button>
          </div>
          <div className="panel-body-condensed" style={{ fontSize: 12 }}>
            <div className="meta-grid">
              <span className="meta-key">ID</span>
              <span className="meta-value">{inspectedSample.op.ID}</span>
              <span className="meta-key">Status</span>
              <span className={statusClass(inspectedSample.status)}>
                {statusIcon(inspectedSample.status)} {inspectedSample.status}
              </span>
              <span className="meta-key">Queue</span>
              <span className="meta-value">{inspectedSample.op.Queue}</span>
              <span className="meta-key">Dedup</span>
              <span className="meta-value">{inspectedSample.op.DedupKey}</span>
            </div>

            <fieldset className="form-section" style={{ marginTop: 6 }}>
              <legend>Input</legend>
              {Object.entries(inspectedSample.op.Input as Record<string, unknown>).map(([k, v]) => (
                <div className="meta-grid" key={k}>
                  <span className="meta-key">{k}</span>
                  <span className="meta-value">{typeof v === 'string' ? v : JSON.stringify(v)}</span>
                </div>
              ))}
            </fieldset>

            {/* Op Result — fetch for succeeded/failed ops */}
            {(inspectedSample.status === 'succeeded' || inspectedSample.status === 'failed') && (
              <OpResultSection workflowId={workflowId} opId={inspectedSample.op.ID} opStatus={inspectedSample.status} />
            )}

            {inspectedSample.status === 'failed' && inspectedSample.op.RetryState.LastError && (
              <div className="error-box" style={{ marginTop: 6 }}>
                {inspectedSample.op.RetryState.LastError}
                <div className="text-dim text-mono" style={{ marginTop: 4 }}>
                  Attempt {inspectedSample.op.RetryState.Attempt}/{inspectedSample.op.Retry.MaxAttempts}
                </div>
                <button className="btn" style={{ marginTop: 4 }} onClick={async () => {
                  // Look up the sample from current polled data using the stable key
                  const g = groups.find(gr => gr.operation + '|' + gr.status === inspectedGroup);
                  if (!g?.sample) return;
                  try { await retryOp({ workflowId, opId: g.sample.op.ID }).unwrap(); } catch (e) { console.error('retry failed', e); }
                }} disabled={retrying}>
                  {retrying ? 'Retrying…' : 'Retry Now'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Workflows List ──────────────────────────────────────────────────────────

const WorkflowsList: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: result, isLoading } = useListWorkflowsQuery(
    { status: statusFilter || undefined },
    { pollingInterval: 2000 },
  );
  const workflows = result?.workflows ?? [];

  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-header">
        <span>Workflows ({result?.total ?? 0})</span>
        <select className="select" value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 11 }}>
          <option value="">all</option>
          <option value="pending">pending</option>
          <option value="running">running</option>
          <option value="succeeded">succeeded</option>
          <option value="failed">failed</option>
          <option value="canceled">canceled</option>
        </select>
      </div>
      <div className="panel-body-condensed" style={{ overflowY: 'auto', maxHeight: 400 }}>
        {isLoading ? (
          <div className="text-dim text-mono">Loading...</div>
        ) : workflows.length === 0 ? (
          <div className="text-dim text-mono">
            No workflows{statusFilter ? ` with status "${statusFilter}"` : ' yet'}.
            {!statusFilter && ' Submit one!'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Status</th><th>Workflow ID</th><th>Strategy</th><th>Ops</th><th>Age</th></tr>
            </thead>
            <tbody>
              {workflows.map((w: WorkflowListItem) => (
                <tr key={w.workflow.ID} className="selectable"
                  onClick={() => onSelect(w.workflow.ID)}>
                  <td className={statusClass(w.workflow.Status)}>
                    {statusIcon(w.workflow.Status)} {w.workflow.Status}
                  </td>
                  <td className="mono truncate" style={{ fontSize: 11, maxWidth: 250 }}>
                    {w.workflow.ID}
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {w.workflow.Metadata?.strategy ?? '—'}
                  </td>
                  <td className="num">{w.opDone}/{w.opTotal}</td>
                  <td className="mono">{timeAgo(w.workflow.CreatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── Main View ───────────────────────────────────────────────────────────────

export const WorkflowsView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);

  const handleNavigateToCorpus = useCallback((sourceId: string, strategyId: string) => {
    const event = new CustomEvent('rag:navigate-to-chunk', {
      detail: { sourceId, strategyId },
    });
    window.dispatchEvent(event);
  }, []);

  if (selectedId) {
    return (
      <WorkflowDetail
        workflowId={selectedId}
        onBack={() => setSelectedId(null)}
        onNavigateToCorpus={handleNavigateToCorpus}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <WorkflowsList onSelect={setSelectedId} />
        <QueueHealthWidget />
      </div>
      <div>
        <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>
          + New Intake Workflow
        </button>
      </div>
      {showSubmit && (
        <SubmitIntakeModal
          onClose={() => setShowSubmit(false)}
          onSubmitted={(id) => { setShowSubmit(false); setSelectedId(id); }}
        />
      )}
    </div>
  );
};
