import { useState } from 'react';
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
import { useTaskContext } from '@/context/TaskContext';
import { getQuadrant, QUADRANT_CONFIG, PRESET_TAGS } from '@/types/task';
import { cn } from '@/lib/utils';

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * QuickAddModal component - Modal dialog for quickly adding a new task.
 * Allows users to set title, description, urgency, importance, and due date.
 */
export function QuickAddModal({ open, onOpenChange }: QuickAddModalProps) {
  const { addTask } = useTaskContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [duration, setDuration] = useState('30');
  const [tags, setTags] = useState<string[]>([]);

  const quadrant = getQuadrant(urgent, important);
  const config = QUADRANT_CONFIG[quadrant];

  const toggleTag = (tagName: string) => {
    setTags((prev) => (
      prev.includes(tagName)
        ? prev.filter((tag) => tag !== tagName)
        : [...prev, tagName]
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      urgent,
      important,
      dueDate: dueDate || undefined,
      estimatedDuration: parseInt(duration, 10) || 30,
      tags,
    });

    setTitle('');
    setDescription('');
    setUrgent(false);
    setImportant(false);
    setDueDate('');
    setDuration('30');
    setTags([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Quick Add Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
            />
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <Switch id="urgent" checked={urgent} onCheckedChange={setUrgent} />
              <Label htmlFor="urgent" className="cursor-pointer">Urgent</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="important" checked={important} onCheckedChange={setImportant} />
              <Label htmlFor="important" className="cursor-pointer">Important</Label>
            </div>
          </div>

          <div className={`rounded-lg border p-3 text-sm ${config.className}`}>
            <span className="font-medium">{config.emoji} {config.label}</span>
            <span className="ml-2 text-muted-foreground">— {config.description}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="duration">Est. Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="5"
                step="5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map((tag) => {
                const selected = tags.includes(tag.name);
                return (
                  <Button
                    key={tag.name}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTag(tag.name)}
                    className={cn(
                      'h-7 rounded-full px-2 text-xs',
                      selected ? `${tag.color} border-transparent` : 'text-muted-foreground',
                    )}
                  >
                    {tag.name}
                  </Button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Add Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
