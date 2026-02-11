import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Check, Trash2, AlertTriangle } from 'lucide-react';
import { TaskWithMetrics, QUADRANT_CONFIG } from '@/types/task';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithMetrics;
  compact?: boolean;
}

export function TaskCard({ task, compact }: TaskCardProps) {
  const { updateTask, deleteTask } = useTaskContext();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = QUADRANT_CONFIG[task.quadrant];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-start gap-2 rounded-lg border bg-card p-3 shadow-sm transition-all animate-fade-in',
        isDragging && 'opacity-50 shadow-lg rotate-1',
        task.isOverdue && 'border-status-overdue/50 ring-1 ring-status-overdue/20',
        task.status === 'completed' && 'opacity-60',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm font-medium leading-snug',
            task.status === 'completed' && 'line-through text-muted-foreground',
          )}>
            {task.title}
          </p>
          {task.isOverdue && (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-status-overdue" />
          )}
        </div>

        {!compact && task.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {task.dueDate && (
            <span className={cn('flex items-center gap-1', task.isOverdue && 'text-status-overdue font-medium')}>
              <Clock className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.estimatedDuration > 0 && (
            <span>{task.estimatedDuration}m</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {task.status !== 'completed' ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => updateTask(task.id, { status: 'completed' })}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        ) : null}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => deleteTask(task.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
