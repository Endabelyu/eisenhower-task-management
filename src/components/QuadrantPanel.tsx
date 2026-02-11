import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Quadrant, QUADRANT_CONFIG, TaskWithMetrics } from '@/types/task';
import { TaskCard } from '@/components/TaskCard';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface QuadrantPanelProps {
  quadrant: Quadrant;
  tasks: TaskWithMetrics[];
}

const quadrantGradient: Record<Quadrant, string> = {
  do: 'from-quadrant-do/10 to-transparent',
  schedule: 'from-quadrant-schedule/10 to-transparent',
  delegate: 'from-quadrant-delegate/10 to-transparent',
  hold: 'from-quadrant-hold/10 to-transparent',
};

const quadrantIconBg: Record<Quadrant, string> = {
  do: 'bg-quadrant-do/15 text-quadrant-do',
  schedule: 'bg-quadrant-schedule/15 text-quadrant-schedule',
  delegate: 'bg-quadrant-delegate/15 text-quadrant-delegate',
  hold: 'bg-quadrant-hold/15 text-quadrant-hold',
};

const quadrantCountBg: Record<Quadrant, string> = {
  do: 'bg-quadrant-do text-primary-foreground',
  schedule: 'bg-quadrant-schedule text-primary',
  delegate: 'bg-quadrant-delegate text-primary-foreground',
  hold: 'bg-muted text-muted-foreground',
};

export function QuadrantPanel({ quadrant, tasks }: QuadrantPanelProps) {
  const config = QUADRANT_CONFIG[quadrant];
  const { setNodeRef, isOver } = useDroppable({ id: quadrant });
  const overdueTasks = tasks.filter(t => t.isOverdue).length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl border-2 transition-all min-h-[260px] overflow-hidden',
        config.className,
        isOver && 'ring-2 ring-primary/20 scale-[1.01]',
      )}
    >
      {/* Gradient header */}
      <div className={cn('bg-gradient-to-b px-4 pt-4 pb-3', quadrantGradient[quadrant])}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-lg', quadrantIconBg[quadrant])}>
              {config.emoji}
            </span>
            <div>
              <h3 className={cn('font-display text-sm font-bold tracking-tight', config.accentClassName)}>
                {config.label}
              </h3>
              <p className="text-[10px] text-muted-foreground/70">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {overdueTasks > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-status-overdue/15 px-1.5 text-[10px] font-bold text-status-overdue">
                {overdueTasks}!
              </span>
            )}
            <span className={cn(
              'flex h-6 min-w-6 items-center justify-center rounded-full text-[11px] font-bold',
              tasks.length > 0 ? quadrantCountBg[quadrant] : 'bg-muted text-muted-foreground',
            )}>
              {tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="px-3 pb-3 flex-1">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 mt-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-current/5 p-8 mt-2">
                <Inbox className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs font-medium text-muted-foreground/40">No tasks yet</p>
                <p className="text-[10px] text-muted-foreground/30 mt-0.5">Drop tasks here</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
