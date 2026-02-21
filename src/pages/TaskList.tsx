import { useState } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { QUADRANT_CONFIG, Quadrant, TaskWithMetrics } from '@/types/task';
import { EditTaskModal } from '@/components/EditTaskModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Trash2, Clock, AlertTriangle, Search, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'do', label: '🔴 Do' },
  { value: 'schedule', label: '🟡 Schedule' },
  { value: 'delegate', label: '🟠 Delegate' },
  { value: 'hold', label: '⚪ Hold' },
  { value: 'completed', label: '✅ Completed' },
] as const;

type FilterValue = typeof FILTERS[number]['value'];

/**
 * TaskList Page.
 * Displays a searchable and filterable list of all tasks.
 * Includes status overview and quick actions.
 */
export default function TaskList() {
  const { tasks, updateTask, deleteTask } = useTaskContext();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');
  const [editingTask, setEditingTask] = useState<TaskWithMetrics | null>(null);

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'all') return true;
    if (filter === 'completed') return t.status === 'completed';
    return t.quadrant === filter && t.status !== 'completed';
  }).sort((a, b) => b.urgencyScore - a.urgencyScore);

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ListTodo className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">All Tasks</h1>
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} tasks</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? 'default' : 'outline'}
              onClick={() => setFilter(f.value)}
              className="text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(task => {
          const config = QUADRANT_CONFIG[task.quadrant];
          return (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              className={cn(
                'group flex items-center gap-3 rounded-lg border bg-card p-4 transition-all cursor-pointer hover:shadow-sm',
                task.isOverdue && 'border-status-overdue/40',
                task.status === 'completed' && 'opacity-60',
              )}
              onClick={() => setEditingTask(task)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingTask(task); } }}
            >
              <span className="text-base">{config.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium',
                  task.status === 'completed' && 'line-through text-muted-foreground',
                )}>
                  {task.title}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className={config.accentClassName}>{config.label}</span>
                  {task.dueDate && (
                    <span className={cn('flex items-center gap-1', task.isOverdue && 'text-status-overdue')}>
                      {task.isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <span>{task.estimatedDuration}m</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                {task.status !== 'completed' && (
                  <Button size="icon" variant="ghost" aria-label="Complete task" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'completed' }); }}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" aria-label="Delete task" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center">
            <p className="text-muted-foreground">No tasks found</p>
          </div>
        )}
      </div>

      <EditTaskModal task={editingTask} open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)} />
    </div>
  );
}
