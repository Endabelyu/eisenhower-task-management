import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTaskContext } from '@/context/TaskContext';
import { TaskWithMetrics, getQuadrant, QUADRANT_CONFIG, TaskStatus } from '@/types/task';

interface EditTaskModalProps {
  task: TaskWithMetrics | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * EditTaskModal component - Modal dialog for editing an existing task.
 * Syncs with TaskContext.updateTask to persist changes.
 */
export function EditTaskModal({ task, open, onOpenChange }: EditTaskModalProps) {
  const { updateTask } = useTaskContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [duration, setDuration] = useState('30');
  const [status, setStatus] = useState<TaskStatus>('pending');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setUrgent(task.urgent);
      setImportant(task.important);
      setDueDate(task.dueDate || '');
      setDuration(String(task.estimatedDuration));
      setStatus(task.status);
    }
  }, [task]);

  const quadrant = getQuadrant(urgent, important);
  const config = QUADRANT_CONFIG[quadrant];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title.trim()) return;

    updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      urgent,
      important,
      dueDate: dueDate || undefined,
      estimatedDuration: parseInt(duration, 10) || 30,
      status,
    });

    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
            />
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <Switch id="edit-urgent" checked={urgent} onCheckedChange={setUrgent} />
              <Label htmlFor="edit-urgent" className="cursor-pointer">Urgent</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="edit-important" checked={important} onCheckedChange={setImportant} />
              <Label htmlFor="edit-important" className="cursor-pointer">Important</Label>
            </div>
          </div>

          <div className={`rounded-lg border p-3 text-sm ${config.className}`}>
            <span className="font-medium">{config.emoji} {config.label}</span>
            <span className="ml-2 text-muted-foreground">— {config.description}</span>
          </div>

          <div>
            <Label htmlFor="edit-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-duration">Est. Duration (min)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="5"
                step="5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
