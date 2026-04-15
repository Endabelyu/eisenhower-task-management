import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Check, Pencil } from 'lucide-react';
import { SubTask } from '@/types/task';
import { useTaskContext } from '@/context/TaskContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SubTaskListProps {
  taskId: string;
  subtasks: SubTask[];
}

export function SubTaskList({ taskId, subtasks: initialSubtasks }: SubTaskListProps) {
  const { tasks, addSubTask, toggleSubTask, deleteSubTask, updateSubTask } = useTaskContext();
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const liveTask = tasks.find(t => t.id === taskId);
  const subtasks = liveTask ? liveTask.subtasks : initialSubtasks;

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

  const startEditing = (st: SubTask) => {
    setEditingId(st.id);
    setEditingTitle(st.title);
  };

  const saveEdit = () => {
    if (editingId && editingTitle.trim()) {
      updateSubTask(editingId, { title: editingTitle.trim() });
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Auto-focus the edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

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

              {/* Title – click to edit */}
              {editingId === st.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={saveEdit}
                  className="flex-1 text-sm bg-muted/50 rounded px-1.5 py-0.5 outline-none ring-1 ring-ring"
                />
              ) : (
                <span
                  className={cn(
                    'flex-1 text-sm cursor-pointer hover:text-foreground transition-colors',
                    st.completed && 'line-through text-muted-foreground',
                  )}
                  onDoubleClick={() => startEditing(st)}
                  title="Double-click to edit"
                >
                  {st.title}
                </span>
              )}

              {/* Edit */}
              <button
                type="button"
                aria-label="Edit sub-task"
                onClick={() => startEditing(st)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-blue-500"
              >
                <Pencil className="h-3 w-3" />
              </button>

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
