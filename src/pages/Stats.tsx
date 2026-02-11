import { BarChart3 } from 'lucide-react';
import { useTaskContext } from '@/context/TaskContext';
import { QUADRANT_CONFIG, Quadrant } from '@/types/task';
import { cn } from '@/lib/utils';

export default function Stats() {
  const { getStats } = useTaskContext();
  const stats = getStats();

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">Statistics</h1>
        </div>
        <p className="text-sm text-muted-foreground">Track your productivity trends</p>
      </div>

      {/* Overview cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Tasks" value={stats.total} />
        <StatCard label="Completed" value={stats.completed} accent="text-status-completed" />
        <StatCard label="Completion" value={`${stats.completionRate}%`} />
        <StatCard label="Overdue" value={stats.overdue} accent="text-status-overdue" />
      </div>

      {/* Per-quadrant breakdown */}
      <h2 className="font-display text-lg font-semibold mb-4">By Quadrant</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {stats.byQuadrant.map(({ quadrant, total, completed, pending }) => {
          const config = QUADRANT_CONFIG[quadrant as Quadrant];
          const pct = total ? Math.round((completed / total) * 100) : 0;
          return (
            <div key={quadrant} className={cn('rounded-xl border-2 p-5', config.className)}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{config.emoji}</span>
                <h3 className={cn('font-display text-sm font-semibold', config.accentClassName)}>
                  {config.label}
                </h3>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-3xl font-display font-bold">{total}</p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-status-completed">{completed}</p>
                  <p className="text-xs text-muted-foreground">done</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{pending}</p>
                  <p className="text-xs text-muted-foreground">pending</p>
                </div>
                <div className="ml-auto">
                  <div className="h-2 w-24 rounded-full bg-background/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-status-completed transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-muted-foreground mt-1">{pct}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-3xl font-display font-bold', accent)}>{value}</p>
    </div>
  );
}
