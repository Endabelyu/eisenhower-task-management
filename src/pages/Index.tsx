import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { TaskWithMetrics } from '@/types/task';
import { Plus, CheckCircle2, AlertTriangle, ListTodo, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditTaskModal } from '@/components/EditTaskModal';
import { useTaskContext } from '@/context/TaskContext';
import { cn } from '@/lib/utils';
import { OPEN_QUICK_ADD_EVENT } from '@/hooks/use-keyboard-shortcuts';

import { ViewSwitcher } from '@/components/ViewSwitcher';
import { MatrixView } from '@/components/views/MatrixView';
import { ListPanel } from '@/components/views/ListPanel';
import { TodayPanel } from '@/components/views/TodayPanel';

/**
 * Dashboard Page.
 * Can display multiple views (Matrix, List, Today) and supports a Focus Mode to hide unimportant tasks.
 */
export default function Dashboard() {
  const { getStats } = useTaskContext();
  const [editingTask, setEditingTask] = useState<TaskWithMetrics | null>(null);
  const [searchParams] = useSearchParams();
  
  const view = searchParams.get('view') || 'matrix';
  const focusMode = searchParams.get('focus') === '1';
  
  const stats = getStats();

  const openQuickAdd = () => {
    window.dispatchEvent(new Event(OPEN_QUICK_ADD_EVENT));
  };

  const summaryCards = [
    { label: 'Total', value: stats.total, icon: ListTodo, className: 'text-foreground' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, className: 'text-status-completed' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, className: 'text-status-overdue' },
    { label: 'Completion', value: `${stats.completionRate}%`, icon: Clock, className: 'text-status-in-progress' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Eisenhower Matrix</h1>
          <p className="text-sm text-muted-foreground">Prioritize what matters most</p>
        </div>
        <Button onClick={openQuickAdd} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      <ViewSwitcher />

      {/* Summary strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {summaryCards.map((card, i) => (
          <div
            key={card.label}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-muted', card.className)}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold leading-none">{card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {view === 'matrix' && <MatrixView focusMode={focusMode} onEditTask={setEditingTask} />}
      {view === 'list' && <ListPanel onEditTask={setEditingTask} />}
      {view === 'today' && <TodayPanel onEditTask={setEditingTask} />}

      <EditTaskModal task={editingTask} open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)} />
    </div>
  );
}

