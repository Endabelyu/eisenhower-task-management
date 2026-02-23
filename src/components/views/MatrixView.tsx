import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { QuadrantPanel } from '@/components/QuadrantPanel';
import { useTaskContext } from '@/context/TaskContext';
import { Quadrant, TaskWithMetrics } from '@/types/task';

const QUADRANTS: Quadrant[] = ['do', 'schedule', 'delegate', 'hold'];

interface MatrixViewProps {
  focusMode: boolean;
  onEditTask: (task: TaskWithMetrics) => void;
}

export function MatrixView({ focusMode, onEditTask }: MatrixViewProps) {
  const { getQuadrantTasks, moveToQuadrant, reorderInQuadrant } = useTaskContext();

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

  return (
    <>
      <div className="mb-2 grid grid-cols-2 gap-4">
        <div className="text-center text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.2em]">
          ← Urgent →
        </div>
        <div className="text-center text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.2em]">
          ← Not Urgent →
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Do First */}
          <div className="relative animate-fade-in">
            <div className="absolute -left-7 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 hidden lg:block">
              Important
            </div>
            <QuadrantPanel quadrant="do" tasks={quadrantTasks.do} onEditTask={onEditTask} />
          </div>

          {/* Schedule */}
          <div className="animate-fade-in">
            <QuadrantPanel quadrant="schedule" tasks={quadrantTasks.schedule} onEditTask={onEditTask} />
          </div>

          {/* Delegate & Hold (hidden in focus mode) */}
          {!focusMode && (
            <>
              <div className="relative animate-fade-in">
                <div className="absolute -left-7 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 hidden lg:block whitespace-nowrap">
                  Not Important
                </div>
                <QuadrantPanel quadrant="delegate" tasks={quadrantTasks.delegate} onEditTask={onEditTask} />
              </div>
              <div className="animate-fade-in">
                <QuadrantPanel quadrant="hold" tasks={quadrantTasks.hold} onEditTask={onEditTask} />
              </div>
            </>
          )}
        </div>
      </DndContext>
    </>
  );
}
