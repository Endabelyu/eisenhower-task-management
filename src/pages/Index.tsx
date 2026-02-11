import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuadrantPanel } from '@/components/QuadrantPanel';
import { QuickAddModal } from '@/components/QuickAddModal';
import { useTaskContext } from '@/context/TaskContext';
import { Quadrant } from '@/types/task';

const QUADRANTS: Quadrant[] = ['do', 'schedule', 'delegate', 'hold'];

export default function Dashboard() {
  const { getQuadrantTasks, moveToQuadrant, reorderInQuadrant } = useTaskContext();
  const [showAdd, setShowAdd] = useState(false);

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

    // Dropped on a quadrant directly
    if (QUADRANTS.includes(overId as Quadrant)) {
      moveToQuadrant(taskId, overId as Quadrant);
      return;
    }

    // Dropped on another task — find its quadrant
    for (const q of QUADRANTS) {
      const ids = quadrantTasks[q].map(t => t.id);
      if (ids.includes(overId)) {
        moveToQuadrant(taskId, q);
        // Reorder
        const newOrder = ids.filter(id => id !== taskId);
        const overIndex = newOrder.indexOf(overId);
        newOrder.splice(overIndex, 0, taskId);
        reorderInQuadrant(q, newOrder);
        return;
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Eisenhower Matrix</h1>
          <p className="text-sm text-muted-foreground">Prioritize what matters most</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Axis labels */}
      <div className="mb-2 grid grid-cols-2 gap-4">
        <div className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Urgent
        </div>
        <div className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Not Urgent
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Row 1: Important */}
          <div className="relative">
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hidden lg:block">
              Important
            </div>
            <QuadrantPanel quadrant="do" tasks={quadrantTasks.do} />
          </div>
          <QuadrantPanel quadrant="schedule" tasks={quadrantTasks.schedule} />
          {/* Row 2: Not Important */}
          <div className="relative">
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hidden lg:block whitespace-nowrap">
              Not Important
            </div>
            <QuadrantPanel quadrant="delegate" tasks={quadrantTasks.delegate} />
          </div>
          <QuadrantPanel quadrant="hold" tasks={quadrantTasks.hold} />
        </div>
      </DndContext>

      <QuickAddModal open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
}
