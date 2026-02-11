import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Check, Trash2, AlertTriangle, Timer, CircleDot } from 'lucide-react';
import { TaskWithMetrics, QUADRANT_CONFIG, Quadrant } from '@/types/task';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithMetrics;
  compact?: boolean;
}

const quadrantAccentBorder: Record<Quadrant, string> = {
  do: 'border-l-quadrant-do',
  schedule: 'border-l-quadrant-schedule',
  delegate: 'border-l-quadrant-delegate',
  hold: 'border-l-quadrant-hold',
};

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  'in-progress': { label: 'In Progress', className: 'bg-status-in-progress/15 text-status-in-progress' },
  completed: { label: 'Done', className: 'bg-status-completed/15 text-status-completed' },
  hold: { label: 'On Hold', className: 'bg-muted text-muted-foreground' },
};

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
  const statusCfg = statusConfig[task.status];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-start gap-2.5 rounded-lg border-l-[3px] border border-y border-r bg-card p-3.5 shadow-sm transition-all animate-fade-in hover:shadow-md',
        quadrantAccentBorder[task.quadrant],
        isDragging && 'opacity-50 shadow-xl scale-[1.02] rotate-1 z-50',
        task.isOverdue && 'ring-1 ring-status-overdue/20',
        task.status === 'completed' && 'opacity-50',
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab text-muted-foreground/30 hover:text-muted-foreground/60 active:cursor-grabbing transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Completion checkbox circle */}
      <button
        onClick={() => updateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' })}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          task.status === 'completed'
            ? 'border-status-completed bg-status-completed text-primary-foreground'
            : 'border-muted-foreground/30 hover:border-muted-foreground/60',
        )}
      >
        {task.status === 'completed' && <Check className="h-3 w-3" />}
      </button>

      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm font-medium leading-snug',
            task.status === 'completed' && 'line-through text-muted-foreground',
          )}>
            {task.title}
          </p>
          {task.isOverdue && (
            <span className="flex items-center gap-1 rounded-full bg-status-overdue/10 px-1.5 py-0.5 text-[10px] font-semibold text-status-overdue">
              <AlertTriangle className="h-3 w-3" />
              Overdue
            </span>
          )}
        </div>

        {/* Description */}
        {!compact && task.description && (
          <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2">{task.description}</p>
        )}

        {/* Meta row */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          {/* Status badge */}
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', statusCfg.className)}>
            <CircleDot className="h-2.5 w-2.5" />
            {statusCfg.label}
          </span>

          {/* Due date */}
          {task.dueDate && (
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium',
              task.isOverdue ? 'bg-status-overdue/10 text-status-overdue' : 'text-muted-foreground',
            )}>
              <Clock className="h-2.5 w-2.5" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {task.daysUntilDue !== null && !task.isOverdue && task.daysUntilDue <= 3 && (
                <span className="ml-0.5">({task.daysUntilDue}d)</span>
              )}
            </span>
          )}

          {/* Duration */}
          {task.estimatedDuration > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Timer className="h-2.5 w-2.5" />
              {task.estimatedDuration}m
            </span>
          )}

          {/* Urgency score */}
          <span className="ml-auto text-[10px] text-muted-foreground/40 font-mono">
            #{task.urgencyScore}
          </span>
        </div>
      </div>

      {/* Delete on hover */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground/40 hover:text-destructive"
          onClick={() => deleteTask(task.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
