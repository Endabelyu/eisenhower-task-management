import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { SubTask } from '@/types/task';
import { useTaskContext } from '@/context/TaskContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SubTaskListProps {
  taskId: string;
  subtasks: SubTask[];
}

/**
 * SubTaskList — inline checklist rendered inside EditTaskModal.
 * Supports adding, toggling, and deleting sub-tasks.
 */
export function SubTaskList({ taskId, subtasks }: SubTaskListProps) {
  const { addSubTask, toggleSubTask, deleteSubTask } = useTaskContext();
  const [newTitle, setNewTitle] = useState('');

  const completed = subtasks.filter(st => st.completed).length;
  const total = subtasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addSubTask(taskId, newTitle.trim());
    setNewTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Sub-tasks</span>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {completed}/{total} ({pct}%)
          </span>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Existing sub-tasks */}
      <ul className="space-y-1">
        {subtasks
          .sort((a, b) => a.order - b.order)
          .map(st => (
            <li key={st.id} className="group flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-muted/50">
              {/* Toggle checkbox */}
              <button
                type="button"
                aria-label={st.completed ? 'Mark sub-task incomplete' : 'Mark sub-task complete'}
                onClick={() => toggleSubTask(st.id, !st.completed)}
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                  st.completed
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-muted-foreground/30 hover:border-muted-foreground/60',
                )}
              >
                {st.completed && <Check className="h-2.5 w-2.5" />}
              </button>

              {/* Title */}
              <span className={cn(
                'flex-1 text-sm',
                st.completed && 'line-through text-muted-foreground',
              )}>
                {st.title}
              </span>

              {/* Delete */}
              <button
                type="button"
                aria-label="Delete sub-task"
                onClick={() => deleteSubTask(st.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
      </ul>

      {/* Add new sub-task */}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a sub-task..."
          className="h-8 text-sm"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          className="h-8 w-8 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
