import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Task, Quadrant, getQuadrant, getQuadrantFlags, TaskWithMetrics, QUADRANT_CONFIG } from '@/types/task';
import { monitoringStore } from '@/monitoring/monitoring-store';

/** Local storage key for persisting tasks */
const STORAGE_KEY = 'eisenhower-tasks';

/**
 * Generates a unique identifier for a new task.
 */
const generateId = () => crypto.randomUUID();

/**
 * Loads tasks from local storage.
 * @returns Array of tasks or empty array if none found or on error.
 */
const loadTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as Task[];
    return parsed.map(t => ({ ...t, tags: t.tags || [] }));
  } catch {
    return [];
  }
};

/**
 * Persists tasks to local storage.
 * @param tasks - Array of tasks to save.
 */
const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

/**
 * Computes additional metrics for a task used in sorting and visualization.
 * @param task - The raw task object.
 * @returns Task object with calculated metrics.
 */
export const computeMetrics = (task: Task): TaskWithMetrics => {
  const now = new Date();
  let daysUntilDue: number | null = null;
  let isOverdue = false;

  if (task.dueDate) {
    const due = new Date(task.dueDate);
    daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    isOverdue = daysUntilDue < 0 && task.status !== 'completed';
  }

  const quadrantWeight = { do: 4, schedule: 3, delegate: 2, hold: 1 };
  const duePenalty = daysUntilDue !== null ? Math.max(0, 10 - daysUntilDue) : 0;
  const urgencyScore = quadrantWeight[task.quadrant] * 10 + duePenalty;

  return { ...task, daysUntilDue, urgencyScore, isOverdue };
};

/**
 * Custom hook to manage the state and operations of tasks.
 * Provides functions to add, update, delete, and reorder tasks, 
 * as well as derived stats and filtered lists.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  /**
   * Adds a new task to the system.
   * @param data - The task data from the user.
   * @returns The newly created task object.
   */
  const addTask = useCallback((data: {
    title: string;
    description?: string;
    urgent: boolean;
    important: boolean;
    dueDate?: string;
    estimatedDuration?: number;
    tags?: string[];
  }) => {
    const quadrant = getQuadrant(data.urgent, data.important);
    const now = new Date().toISOString();
    const quadrantTasks = tasks.filter(t => t.quadrant === quadrant);

    const task: Task = {
      id: generateId(),
      title: data.title,
      description: data.description,
      urgent: data.urgent,
      important: data.important,
      quadrant,
      dueDate: data.dueDate,
      estimatedDuration: data.estimatedDuration || 30,
      status: 'pending',
      order: quadrantTasks.length > 0 ? Math.max(...quadrantTasks.map(t => t.order)) + 1 : 0,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    setTasks(prev => [...prev, task]);
    toast.success(`Task added to ${QUADRANT_CONFIG[quadrant].label}`);
    monitoringStore.addLog('task:add', { id: task.id, title: task.title, quadrant });
    return task;
  }, [tasks]);

  /**
   * Updates an existing task by ID.
   * Automatically updates the quadrant if urgency or importance changes.
   * @param id - Unique identifier of the task.
   * @param updates - Partial object containing fields to update.
   */
  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
      if (updates.urgent !== undefined || updates.important !== undefined) {
        updated.quadrant = getQuadrant(updated.urgent, updated.important);
      }
      if (updates.status === 'completed') {
        updated.completedAt = new Date().toISOString();
      }
      return updated;
    }));
    if (updates.status === 'completed') {
      toast.success('Task completed! 🎉');
      monitoringStore.addLog('task:complete', { id });
    } else {
      monitoringStore.addLog('task:update', { id, fields: Object.keys(updates) });
    }
  }, []);

  /**
   * Deletes a task by ID.
   * @param id - Unique identifier of the task.
   */
  const deleteTask = useCallback((id: string) => {
    let deleted: Task | undefined;
    setTasks(prev => {
      deleted = prev.find(t => t.id === id);
      return prev.filter(t => t.id !== id);
    });
    monitoringStore.addLog('task:delete', { id }, 'warn');
    toast('Task deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          if (deleted) {
            setTasks(prev => [...prev, deleted!]);
            monitoringStore.addLog('task:undo-delete', { id });
          }
        },
      },
    });
  }, []);

  /**
   * Moves a task to a different quadrant explicitly.
   * @param id - Unique identifier of the task.
   * @param quadrant - Destination quadrant.
   */
  const moveToQuadrant = useCallback((id: string, quadrant: Quadrant) => {
    const flags = getQuadrantFlags(quadrant);
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { ...t, ...flags, quadrant, updatedAt: new Date().toISOString() };
    }));
    monitoringStore.addLog('task:move', { id, quadrant });
    toast(`Moved to ${QUADRANT_CONFIG[quadrant].label}`);
  }, []);

  /**
   * Reorders tasks within a specific quadrant.
   * @param quadrant - The quadrant being reordered.
   * @param orderedIds - Array of task IDs in their new order.
   */
  const reorderInQuadrant = useCallback((quadrant: Quadrant, orderedIds: string[]) => {
    setTasks(prev => prev.map(t => {
      if (t.quadrant !== quadrant) return t;
      const newOrder = orderedIds.indexOf(t.id);
      if (newOrder === -1) return t;
      return { ...t, order: newOrder };
    }));
  }, []);

  const tasksWithMetrics = useMemo(() => tasks.map(computeMetrics), [tasks]);

  /**
   * Returns a filtered and sorted list of tasks for a given quadrant.
   * @param quadrant - The quadrant to retrieve tasks for.
   */
  const getQuadrantTasks = useCallback((quadrant: Quadrant) => {
    return tasksWithMetrics
      .filter(t => t.quadrant === quadrant && t.status !== 'completed')
      .sort((a, b) => a.order - b.order);
  }, [tasksWithMetrics]);

  /**
   * Returns the top tasks to focus on for the day (priority based).
   */
  const getDailyFocus = useCallback(() => {
    return tasksWithMetrics
      .filter(t => t.quadrant === 'do' && t.status !== 'completed')
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 5);
  }, [tasksWithMetrics]);

  /**
   * Calculates overall task statistics.
   */
  const getStats = useCallback(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasksWithMetrics.filter(t => t.isOverdue).length;
    const byQuadrant = (['do', 'schedule', 'delegate', 'hold'] as Quadrant[]).map(q => ({
      quadrant: q,
      total: tasks.filter(t => t.quadrant === q).length,
      completed: tasks.filter(t => t.quadrant === q && t.status === 'completed').length,
      pending: tasks.filter(t => t.quadrant === q && t.status !== 'completed').length,
    }));
    return { total, completed, overdue, completionRate: total ? Math.round((completed / total) * 100) : 0, byQuadrant };
  }, [tasks, tasksWithMetrics]);

  const exportTasks = useCallback(() => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eisenhower-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    monitoringStore.addLog('task:export', { count: tasks.length });
    toast.success('Tasks exported');
  }, [tasks]);

  const importTasks = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) throw new Error('Invalid format');
      for (const t of parsed) {
        if (!t.id || !t.title || !t.quadrant) throw new Error('Invalid task data');
      }
      setTasks(parsed as Task[]);
      monitoringStore.addLog('task:import', { count: parsed.length });
      toast.success(`Imported ${parsed.length} tasks`);
    } catch {
      monitoringStore.addLog('task:import-failed', {}, 'error');
      toast.error('Invalid file format');
    }
  }, []);

  const clearAllTasks = useCallback(() => {
    monitoringStore.addLog('task:clear', { previous: tasks.length }, 'warn');
    setTasks([]);
    toast('All tasks cleared');
  }, [tasks.length]);

  return useMemo(() => ({
    tasks: tasksWithMetrics,
    addTask,
    updateTask,
    deleteTask,
    moveToQuadrant,
    reorderInQuadrant,
    getQuadrantTasks,
    getDailyFocus,
    getStats,
    exportTasks,
    importTasks,
    clearAllTasks,
  }), [tasksWithMetrics, addTask, updateTask, deleteTask, moveToQuadrant, reorderInQuadrant, getQuadrantTasks, getDailyFocus, getStats, exportTasks, importTasks, clearAllTasks]);
}
