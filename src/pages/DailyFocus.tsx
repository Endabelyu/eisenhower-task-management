import { Zap, Clock, AlertTriangle } from 'lucide-react';
import { useTaskContext } from '@/context/TaskContext';
import { QUADRANT_CONFIG } from '@/types/task';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DailyFocus() {
  const { getDailyFocus, updateTask } = useTaskContext();
  const focus = getDailyFocus();

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-quadrant-do" />
          <h1 className="font-display text-2xl font-bold">Daily Focus</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your top {focus.length} priority tasks from the Do quadrant
        </p>
      </div>

      {focus.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center">
          <Zap className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No urgent tasks!</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Add tasks to the Do quadrant to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {focus.map((task, i) => (
            <div
              key={task.id}
              className={cn(
                'flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all animate-fade-in',
                task.isOverdue && 'border-status-overdue/40 ring-1 ring-status-overdue/10',
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-quadrant-do/10 font-display text-sm font-bold text-quadrant-do">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{task.title}</p>
                {task.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
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
                onClick={() => updateTask(task.id, { status: 'completed' })}
              >
                Done
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
