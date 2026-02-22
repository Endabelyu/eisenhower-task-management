import { useState } from 'react';
import { TaskWithMetrics } from '@/types/task';
import {
  DndContext,
  DragEndEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Plus, CheckCircle2, AlertTriangle, ListTodo, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuadrantPanel } from '@/components/QuadrantPanel';
import { EditTaskModal } from '@/components/EditTaskModal';
import { useTaskContext } from '@/context/TaskContext';
import { Quadrant } from '@/types/task';
import { cn } from '@/lib/utils';
import { OPEN_QUICK_ADD_EVENT } from '@/hooks/use-keyboard-shortcuts';

const QUADRANTS: Quadrant[] = ['do', 'schedule', 'delegate', 'hold'];

/**
 * Dashboard Page - The Eisenhower Matrix view.
 * Displays tasks in a 2x2 grid representing urgency and importance.
 * Supports drag-and-drop to move tasks between quadrants.
 */
export default function Dashboard() {
  const { getQuadrantTasks, moveToQuadrant, reorderInQuadrant, getStats } = useTaskContext();
  const [editingTask, setEditingTask] = useState<TaskWithMetrics | null>(null);
  const stats = getStats();

  const openQuickAdd = () => {
    window.dispatchEvent(new Event(OPEN_QUICK_ADD_EVENT));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const quadrantTasks = Object.fromEntries(
    QUADRANTS.map(q => [q, getQuadrantTasks(q)])
  ) as Record<Quadrant, ReturnType<typeof getQuadrantTasks>>;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    if (QUADRANTS.includes(overId as Quadrant)) {
      moveToQuadrant(taskId, overId as Quadrant);
      return;
    }

    for (const q of QUADRANTS) {
      const ids = quadrantTasks[q].map(t => t.id);
      if (ids.includes(overId)) {
        moveToQuadrant(taskId, q);
        const newOrder = ids.filter(id => id !== taskId);
        const overIndex = newOrder.indexOf(overId);
        newOrder.splice(overIndex, 0, taskId);
        reorderInQuadrant(q, newOrder);
        return;
      }
    }
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

      {/* Axis labels */}
      <div className="mb-2 grid grid-cols-2 gap-4">
        <div className="text-center text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.2em]">
          ← Urgent →
        </div>
        <div className="text-center text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.2em]">
          ← Not Urgent →
        </div>
      </div>

      {/* Matrix grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <div className="absolute -left-7 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 hidden lg:block">
              Important
            </div>
            <QuadrantPanel quadrant="do" tasks={quadrantTasks.do} onEditTask={setEditingTask} />
          </div>
          <QuadrantPanel quadrant="schedule" tasks={quadrantTasks.schedule} onEditTask={setEditingTask} />
          <div className="relative">
            <div className="absolute -left-7 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 hidden lg:block whitespace-nowrap">
              Not Important
            </div>
            <QuadrantPanel quadrant="delegate" tasks={quadrantTasks.delegate} onEditTask={setEditingTask} />
          </div>
          <QuadrantPanel quadrant="hold" tasks={quadrantTasks.hold} onEditTask={setEditingTask} />
        </div>
      </DndContext>

      <EditTaskModal task={editingTask} open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)} />
    </div>
  );
}
