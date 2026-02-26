import { useMemo, useState } from 'react';
import { Zap, Clock, AlertTriangle, ListTodo } from 'lucide-react';
import { useTaskContext } from '@/context/TaskContext';
import { QUADRANT_CONFIG, TaskWithMetrics } from '@/types/task';
import { EditTaskModal } from '@/components/EditTaskModal';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { SpotifyPlayer } from '@/components/SpotifyPlayer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const FOCUS_COUNT_OPTIONS = [3, 5, 8, 10];

/**
 * Daily Focus Page.
 * Displays top priority tasks across quadrants with a configurable focus count.
 * Includes a time budget summary and a Pomodoro timer for structured work sessions.
 */
export default function DailyFocus() {
  const { tasks, updateTask } = useTaskContext();
  const [focusCount, setFocusCount] = useState('5');
  const [editingTask, setEditingTask] = useState<TaskWithMetrics | null>(null);

  const focus = useMemo(() => {
    const limit = Number(focusCount);
    return tasks
      .filter((task) => task.status !== 'completed')
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, limit);
  }, [focusCount, tasks]);

  const totalMinutes = focus.reduce((sum, task) => sum + task.estimatedDuration, 0);

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-quadrant-do" />
          <h1 className="font-display text-2xl font-bold">Daily Focus</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Top priority tasks across all quadrants, sorted by urgency score
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Time Budget</p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums">{totalMinutes}m</p>
          <p className="mt-1 text-sm text-muted-foreground">Estimated time for current focus set</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Focus Task Count</p>
          <div className="mt-2">
            <Select value={focusCount} onValueChange={setFocusCount}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select count" />
              </SelectTrigger>
              <SelectContent>
                {FOCUS_COUNT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    Top {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Currently showing {focus.length} tasks</p>
        </div>
      </div>

      <div className="mb-6">
        <PomodoroTimer />
      </div>

      <div className="mb-6">
        <SpotifyPlayer />
      </div>

      {focus.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center">
          <Zap className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No active tasks right now</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Add or reopen tasks to build your next focus session
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {focus.map((task, i) => (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              className={cn(
                'flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all animate-fade-in cursor-pointer hover:shadow-md',
                task.isOverdue && 'border-status-overdue/40 ring-1 ring-status-overdue/10',
              )}
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => setEditingTask(task)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingTask(task); } }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-status-in-progress/10 font-display text-sm font-bold text-status-in-progress">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{task.title}</p>
                {task.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                    <ListTodo className="h-3 w-3" />
                    {QUADRANT_CONFIG[task.quadrant].label}
                  </span>
                  {task.dueDate && (
                    <span className={cn('flex items-center gap-1', task.isOverdue && 'text-status-overdue')}>
                      {task.isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <span>{task.estimatedDuration}m</span>
                  <span className="rounded-full bg-muted px-2 py-0.5">Score: {task.urgencyScore}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'completed' }); }}
              >
                Done
              </Button>
            </div>
          ))}
        </div>
      )}

      <EditTaskModal task={editingTask} open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)} />
    </div>
  );
}
