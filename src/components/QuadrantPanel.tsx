import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Quadrant, QUADRANT_CONFIG, TaskWithMetrics } from '@/types/task';
import { TaskCard } from '@/components/TaskCard';
import { cn } from '@/lib/utils';

interface QuadrantPanelProps {
  quadrant: Quadrant;
  tasks: TaskWithMetrics[];
}

export function QuadrantPanel({ quadrant, tasks }: QuadrantPanelProps) {
  const config = QUADRANT_CONFIG[quadrant];
  const { setNodeRef, isOver } = useDroppable({ id: quadrant });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl border-2 p-4 transition-colors min-h-[240px]',
        config.className,
        isOver && 'ring-2 ring-primary/20',
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.emoji}</span>
          <h3 className={cn('font-display text-sm font-semibold', config.accentClassName)}>
            {config.label}
          </h3>
        </div>
        <span className="rounded-full bg-background/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <p className="mb-3 text-[11px] text-muted-foreground">{config.description}</p>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-current/10 p-6">
              <p className="text-xs text-muted-foreground/60">Drop tasks here</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
