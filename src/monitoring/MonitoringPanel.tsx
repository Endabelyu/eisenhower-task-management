import { useEffect, useReducer, useState } from 'react';
import { monitoringStore, MonitoringError, MonitoringLog, MonitoringMetric } from './monitoring-store';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import { cn } from '@/lib/utils';

type Tab = 'errors' | 'logs' | 'metrics';

const LEVEL_CLASS: Record<string, string> = {
  info: 'text-blue-500',
  warn: 'text-amber-500',
  error: 'text-red-500',
};

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

/**
 * MonitoringPanel — floating developer panel for error, log, and perf inspection.
 * Only rendered in development mode. Toggle with Ctrl+Shift+M.
 */
export function MonitoringPanel() {
  usePerformanceMonitor();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('logs');
  // Force re-render on store updates
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const unsub = monitoringStore.subscribe(forceUpdate);
    return unsub;
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const snap = monitoringStore.getSnapshot();

  const errorCount = snap.errors.length;
  const warnCount = snap.logs.filter((l) => l.level === 'warn').length;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open Monitoring Panel (Ctrl+Shift+M)"
        className={cn(
          'fixed bottom-4 right-4 z-[9999] flex h-9 w-9 items-center justify-center rounded-full shadow-lg text-sm font-bold transition-all hover:scale-110',
          errorCount > 0 ? 'bg-red-500 text-white' : 'bg-foreground text-background'
        )}
      >
        {errorCount > 0 ? errorCount : '📡'}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex w-[420px] flex-col rounded-xl border bg-background shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2.5">
        <span className="font-display text-sm font-bold">📡 Monitoring</span>
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
              {errorCount} ERR
            </span>
          )}
          {warnCount > 0 && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
              {warnCount} WARN
            </span>
          )}
          <button
            onClick={() => monitoringStore.clear()}
            className="rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
          >
            Clear
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(['logs', 'errors', 'metrics'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-1.5 text-[11px] font-medium capitalize transition-colors',
              tab === t
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t}
            {t === 'errors' && errorCount > 0 && (
              <span className="ml-1 text-red-500">({errorCount})</span>
            )}
            {t === 'logs' && (
              <span className="ml-1 text-muted-foreground">({snap.logs.length})</span>
            )}
            {t === 'metrics' && (
              <span className="ml-1 text-muted-foreground">({snap.metrics.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-72 overflow-y-auto p-2 space-y-1 font-mono text-[11px]">
        {tab === 'errors' && (
          <>
            {snap.errors.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">✅ No errors</p>
            )}
            {snap.errors.map((e: MonitoringError) => (
              <div key={e.id} className="rounded-md border border-red-500/20 bg-red-500/5 p-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-red-500 font-semibold">{e.message}</span>
                  <span className="shrink-0 text-muted-foreground">{fmt(e.timestamp)}</span>
                </div>
                {e.stack && (
                  <pre className="mt-1 whitespace-pre-wrap text-muted-foreground/70 text-[10px] leading-tight line-clamp-4">
                    {e.stack}
                  </pre>
                )}
              </div>
            ))}
          </>
        )}

        {tab === 'logs' && (
          <>
            {snap.logs.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">No events yet</p>
            )}
            {snap.logs.map((l: MonitoringLog) => (
              <div key={l.id} className="flex items-start gap-2 rounded px-1 py-0.5 hover:bg-muted">
                <span className="shrink-0 text-muted-foreground">{fmt(l.timestamp)}</span>
                <span className={cn('shrink-0 w-10', LEVEL_CLASS[l.level])}>{l.level}</span>
                <span className="font-semibold">{l.event}</span>
                {l.payload && (
                  <span className="text-muted-foreground truncate">{l.payload}</span>
                )}
              </div>
            ))}
          </>
        )}

        {tab === 'metrics' && (
          <>
            {snap.metrics.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">No metrics yet</p>
            )}
            {snap.metrics.map((m: MonitoringMetric) => (
              <div key={m.id} className="flex items-center gap-3 rounded px-1 py-0.5 hover:bg-muted">
                <span className="shrink-0 text-muted-foreground">{fmt(m.timestamp)}</span>
                <span className="flex-1 font-semibold">{m.name}</span>
                <span className="tabular-nums text-foreground">
                  {m.value} <span className="text-muted-foreground">{m.unit}</span>
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
