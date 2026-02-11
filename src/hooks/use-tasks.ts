import { useState, useCallback, useEffect } from 'react';
import { Task, Quadrant, getQuadrant, getQuadrantFlags, TaskWithMetrics } from '@/types/task';

const STORAGE_KEY = 'eisenhower-tasks';

const generateId = () => crypto.randomUUID();

const loadTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

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

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const addTask = useCallback((data: {
    title: string;
    description?: string;
    urgent: boolean;
    important: boolean;
    dueDate?: string;
    estimatedDuration?: number;
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
      order: quadrantTasks.length,
      createdAt: now,
      updatedAt: now,
    };

    setTasks(prev => [...prev, task]);
    return task;
  }, [tasks]);

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
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const moveToQuadrant = useCallback((id: string, quadrant: Quadrant) => {
    const flags = getQuadrantFlags(quadrant);
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { ...t, ...flags, quadrant, updatedAt: new Date().toISOString() };
    }));
  }, []);

  const reorderInQuadrant = useCallback((quadrant: Quadrant, orderedIds: string[]) => {
    setTasks(prev => prev.map(t => {
      if (t.quadrant !== quadrant) return t;
      const newOrder = orderedIds.indexOf(t.id);
      if (newOrder === -1) return t;
      return { ...t, order: newOrder };
    }));
  }, []);

  const tasksWithMetrics = tasks.map(computeMetrics);

  const getQuadrantTasks = useCallback((quadrant: Quadrant) => {
    return tasksWithMetrics
      .filter(t => t.quadrant === quadrant && t.status !== 'completed')
      .sort((a, b) => a.order - b.order);
  }, [tasksWithMetrics]);

  const getDailyFocus = useCallback(() => {
    return tasksWithMetrics
      .filter(t => t.quadrant === 'do' && t.status !== 'completed')
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 5);
  }, [tasksWithMetrics]);

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

  return {
    tasks: tasksWithMetrics,
    addTask,
    updateTask,
    deleteTask,
    moveToQuadrant,
    reorderInQuadrant,
    getQuadrantTasks,
    getDailyFocus,
    getStats,
  };
}
