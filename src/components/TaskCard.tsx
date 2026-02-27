import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Check, Trash2, AlertTriangle, Timer, CircleDot, ListChecks, Bell } from 'lucide-react';
import { TaskWithMetrics, QUADRANT_CONFIG, Quadrant, PRESET_TAGS } from '@/types/task';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithMetrics;
  compact?: boolean;
  onEdit?: (task: TaskWithMetrics) => void;
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

const tagColorMap = Object.fromEntries(PRESET_TAGS.map((tag) => [tag.name, tag.color])) as Record<string, string>;

/**
 * TaskCard component - Renders an individual task with its properties.
 * Supports drag-and-drop (sortable), editing, and status toggling.
 */
export function TaskCard({ task, compact, onEdit }: TaskCardProps) {
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
        aria-label="Drag to reorder task"
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab text-muted-foreground/30 hover:text-muted-foreground/60 active:cursor-grabbing transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Completion checkbox circle */}
      <button
        aria-label={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
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

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit?.(task)}>
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 pr-6">
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
          {!task.isOverdue && task.daysUntilDue === 0 && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400 animate-pulse">
              <Bell className="h-3 w-3" />
              Due today
            </span>
          )}
          {!task.isOverdue && task.daysUntilDue === 1 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              <Bell className="h-3 w-3" />
              Due tomorrow
            </span>
          )}
        </div>

        {/* Description */}
        {!compact && task.description && (
          <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2">{task.description}</p>
        )}

        {task.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                  tagColorMap[tag] ?? 'bg-muted text-muted-foreground',
                )}
              >
                {tag}
              </span>
            ))}
          </div>
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

        {/* Sub-task progress */}
        {task.subtasks.length > 0 && (() => {
          const done = task.subtasks.filter(st => st.completed).length;
          const total = task.subtasks.length;
          const pct = Math.round((done / total) * 100);
          return (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <ListChecks className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {done}/{total} ({pct}%)
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Delete on hover */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Delete task"
              className="h-6 w-6 text-muted-foreground/40 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this task?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{task.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteTask(task.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
