import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Task, SubTask, Quadrant, getQuadrant, getQuadrantFlags, TaskWithMetrics, QUADRANT_CONFIG } from '@/types/task';
import { monitoringStore } from '@/monitoring/monitoring-store';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

/** Local storage key for persisting tasks (legacy) */
const STORAGE_KEY = 'eisenhower-tasks';

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

const mapToTask = (row: any, subtasks: SubTask[] = []): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  urgent: row.urgent,
  important: row.important,
  quadrant: row.quadrant,
  dueDate: row.due_date,
  estimatedDuration: row.estimated_duration,
  status: row.status,
  order: row.order,
  tags: row.tags || [],
  subtasks,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  completedAt: row.completed_at,
});

const mapToSubTask = (row: any): SubTask => ({
  id: row.id,
  taskId: row.task_id,
  title: row.title,
  completed: row.completed,
  order: row.order,
  createdAt: row.created_at,
});

/**
 * Custom hook to manage the state and operations of tasks against Supabase.
 */
export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount/auth change
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        const [tasksRes, subtasksRes] = await Promise.all([
          supabase.from('tasks').select('*').order('order', { ascending: true }),
          supabase.from('subtasks').select('*').order('order', { ascending: true }),
        ]);
          
        if (tasksRes.error) throw tasksRes.error;
        if (subtasksRes.error) throw subtasksRes.error;

        const subtasksByTask = new Map<string, SubTask[]>();
        for (const row of subtasksRes.data) {
          const st = mapToSubTask(row);
          const list = subtasksByTask.get(st.taskId) || [];
          list.push(st);
          subtasksByTask.set(st.taskId, list);
        }

        setTasks(tasksRes.data.map(row => mapToTask(row, subtasksByTask.get(row.id) || [])));
        
        // Check for legacy local storage migration
        const legacyData = localStorage.getItem(STORAGE_KEY);
        if (legacyData && tasksRes.data.length === 0 && !sessionStorage.getItem('migrated_prompted')) {
          sessionStorage.setItem('migrated_prompted', 'true');
          toast('Legacy tasks found!', {
            description: 'We found tasks saved to this browser. Would you like to migrate them to your cloud account?',
            duration: 10000,
            action: {
              label: 'Import',
              onClick: () => handleLegacyMigration(legacyData),
            },
          });
        }
      } catch (err: any) {
        toast.error('Failed to load tasks from server');
        monitoringStore.addError('tasks:fetch', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [user]);

  const handleLegacyMigration = async (jsonData: string) => {
    try {
      if (!user) return;
      const parsed = JSON.parse(jsonData) as Task[];
      
      const payload = parsed.map((t: any) => ({
        user_id: user.id,
        title: t.title,
        description: t.description || null,
        urgent: t.urgent || false,
        important: t.important || false,
        quadrant: t.quadrant,
        due_date: t.dueDate || null,
        estimated_duration: t.estimatedDuration || 30,
        status: t.status || 'pending',
        order: t.order || 0,
        tags: t.tags || [],
      }));

      const { data, error } = await supabase.from('tasks').insert(payload).select();
      if (error) throw error;
      
      setTasks(prev => [...prev, ...data.map(row => mapToTask(row))]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success('Successfully migrated legacy tasks to cloud');
      monitoringStore.addLog('tasks:migrated-legacy', { count: data.length });
    } catch (err: any) {
      toast.error('Migration failed');
      monitoringStore.addError('tasks:migration-error', err);
    }
  };

  const addTask = useCallback(async (data: {
    title: string;
    description?: string;
    urgent: boolean;
    important: boolean;
    dueDate?: string;
    estimatedDuration?: number;
    tags?: string[];
  }) => {
    if (!user) return null as unknown as Task; // Types enforce returning Task, but we assume authenticated
    
    const quadrant = getQuadrant(data.urgent, data.important);
    const quadrantTasks = tasks.filter(t => t.quadrant === quadrant);
    const order = quadrantTasks.length > 0 ? Math.max(...quadrantTasks.map(t => t.order)) + 1 : 0;

    const payload = {
      user_id: user.id,
      title: data.title,
      description: data.description,
      urgent: data.urgent,
      important: data.important,
      quadrant,
      due_date: data.dueDate,
      estimated_duration: data.estimatedDuration || 30,
      status: 'pending',
      order,
      tags: data.tags || [],
    };

    try {
      // Optimistic update
      const tempId = crypto.randomUUID();
      const optimisticTask: Task = {
        ...payload, id: tempId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dueDate: payload.due_date, estimatedDuration: payload.estimated_duration, subtasks: []
      } as any;
      setTasks(prev => [...prev, optimisticTask]);

      const { data: dbData, error } = await supabase.from('tasks').insert(payload).select().single();
      if (error) throw error;
      
      const newTask = mapToTask(dbData, []);
      setTasks(prev => prev.map(t => t.id === tempId ? newTask : t));
      
      toast.success(`Task added to ${QUADRANT_CONFIG[quadrant].label}`);
      monitoringStore.addLog('task:add', { id: newTask.id, title: newTask.title, quadrant });
      return newTask;
    } catch (err: any) {
      toast.error('Failed to add task');
      monitoringStore.addError('task:add-error', err);
      // Revert optimistic if needed (simplified here)
      return null as unknown as Task;
    }
  }, [tasks, user]);

  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    const originalTask = tasks.find(t => t.id === id);
    if (!originalTask) return;

    const updatedLocal = { ...originalTask, ...updates, updatedAt: new Date().toISOString() };
    if (updates.urgent !== undefined || updates.important !== undefined) {
      updatedLocal.quadrant = getQuadrant(updatedLocal.urgent, updatedLocal.important);
    }
    if (updates.status === 'completed') {
      updatedLocal.completedAt = new Date().toISOString();
    }

    setTasks(prev => prev.map(t => t.id === id ? updatedLocal : t));

    const payload: any = {};
    if ('title' in updates) payload.title = updates.title;
    if ('description' in updates) payload.description = updates.description;
    if ('urgent' in updates) payload.urgent = updates.urgent;
    if ('important' in updates) payload.important = updates.important;
    if ('quadrant' in updatedLocal) payload.quadrant = updatedLocal.quadrant;
    if ('dueDate' in updates) payload.due_date = updates.dueDate;
    if ('estimatedDuration' in updates) payload.estimated_duration = updates.estimatedDuration;
    if ('status' in updates) payload.status = updates.status;
    if ('order' in updates) payload.order = updates.order;
    if ('tags' in updates) payload.tags = updates.tags;
    if ('status' in updates && updates.status === 'completed') payload.completed_at = new Date().toISOString();
    payload.updated_at = new Date().toISOString();

    try {
      const { error } = await supabase.from('tasks').update(payload).eq('id', id);
      if (error) throw error;

      if (updates.status === 'completed') {
        toast.success('Task completed! 🎉');
        monitoringStore.addLog('task:complete', { id });
      } else {
        monitoringStore.addLog('task:update', { id, fields: Object.keys(updates) });
      }
    } catch (err: any) {
      setTasks(prev => prev.map(t => t.id === id ? originalTask : t)); // revert
      toast.error('Updates failed to save');
      monitoringStore.addError('task:update-error', err);
    }
  }, [tasks]);

  const deleteTask = useCallback(async (id: string) => {
    const deleted = tasks.find(t => t.id === id);
    if (!deleted) return;

    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      
      monitoringStore.addLog('task:delete', { id }, 'warn');
      toast('Task deleted');
    } catch (err: any) {
      setTasks(prev => [...prev, deleted]); // revert
      toast.error('Failed to delete task');
      monitoringStore.addError('task:delete-error', err);
    }
  }, [tasks]);

  const moveToQuadrant = useCallback(async (id: string, quadrant: Quadrant) => {
    const flags = getQuadrantFlags(quadrant);
    const originalTask = tasks.find(t => t.id === id);
    if (!originalTask) return;

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...flags, quadrant, updatedAt: new Date().toISOString() } : t));

    try {
      const { error } = await supabase.from('tasks').update({
        quadrant,
        urgent: flags.urgent,
        important: flags.important,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      
      if (error) throw error;
      
      monitoringStore.addLog('task:move', { id, quadrant });
      toast(`Moved to ${QUADRANT_CONFIG[quadrant].label}`);
    } catch (err: any) {
      setTasks(prev => prev.map(t => t.id === id ? originalTask : t)); // revert
      toast.error('Failed to move task');
    }
  }, [tasks]);

  const reorderInQuadrant = useCallback(async (quadrant: Quadrant, orderedIds: string[]) => {
    // Optimistic local update
    setTasks(prev => prev.map(t => {
      if (t.quadrant !== quadrant) return t;
      const newOrder = orderedIds.indexOf(t.id);
      if (newOrder === -1) return t;
      return { ...t, order: newOrder };
    }));

    try {
      // Create bulk update payload
      const updates = orderedIds.map((id, index) => ({ id, order: index }));
      
      // Supabase JS doesn't have bulk update syntax directly out of the box in v2 for partials,
      // so we either loop or use an rpc. For this MVP, mapping them in a Promise.all is acceptable
      // since the lists are typically <50 items.
      await Promise.all(
        updates.map(upd => supabase.from('tasks').update({ order: upd.order }).eq('id', upd.id))
      );
    } catch (err: any) {
      // In production you might refetch tasks to guarantee sync, but skipping revert for brevity in grid layout
      monitoringStore.addError('task:reorder-error', err);
    }
  }, []);

  // ── Sub-task operations ───────────────────────────────────────────────

  const addSubTask = useCallback(async (taskId: string, title: string) => {
    if (!user || !title.trim()) return;

    const parentTask = tasks.find(t => t.id === taskId);
    const order = parentTask ? parentTask.subtasks.length : 0;

    const tempId = crypto.randomUUID();
    const optimistic: SubTask = {
      id: tempId,
      taskId,
      title: title.trim(),
      completed: false,
      order,
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, subtasks: [...t.subtasks, optimistic] } : t
    ));

    try {
      const { data, error } = await supabase.from('subtasks').insert({
        task_id: taskId,
        user_id: user.id,
        title: title.trim(),
        order,
      }).select().single();

      if (error) throw error;

      const real = mapToSubTask(data);
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.map(st => st.id === tempId ? real : st) }
          : t
      ));
    } catch (err: any) {
      // Revert optimistic
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.filter(st => st.id !== tempId) }
          : t
      ));
      toast.error('Failed to add sub-task');
      monitoringStore.addError('subtask:add-error', err);
    }
  }, [tasks, user]);

  const toggleSubTask = useCallback(async (subtaskId: string, completed: boolean) => {
    // Optimistic
    setTasks(prev => prev.map(t => ({
      ...t,
      subtasks: t.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed } : st
      ),
    })));

    try {
      const { error } = await supabase.from('subtasks').update({ completed }).eq('id', subtaskId);
      if (error) throw error;
    } catch (err: any) {
      // Revert
      setTasks(prev => prev.map(t => ({
        ...t,
        subtasks: t.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !completed } : st
        ),
      })));
      toast.error('Failed to update sub-task');
      monitoringStore.addError('subtask:toggle-error', err);
    }
  }, []);

  const deleteSubTask = useCallback(async (subtaskId: string) => {
    let deletedFrom: { taskId: string; subtask: SubTask } | null = null;

    setTasks(prev => prev.map(t => {
      const found = t.subtasks.find(st => st.id === subtaskId);
      if (found) deletedFrom = { taskId: t.id, subtask: found };
      return {
        ...t,
        subtasks: t.subtasks.filter(st => st.id !== subtaskId),
      };
    }));

    try {
      const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);
      if (error) throw error;
    } catch (err: any) {
      // Revert
      if (deletedFrom) {
        const { taskId, subtask } = deletedFrom;
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, subtasks: [...t.subtasks, subtask] } : t
        ));
      }
      toast.error('Failed to delete sub-task');
      monitoringStore.addError('subtask:delete-error', err);
    }
  }, []);

  const tasksWithMetrics = useMemo(() => tasks.map(computeMetrics), [tasks]);

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

  const importTasks = useCallback(async (json: string) => {
    try {
      if (!user) return;
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) throw new Error('Invalid format');
      for (const t of parsed) {
        if (!t.title || !t.quadrant) throw new Error('Invalid task data');
      }
      
      const payload = parsed.map(t => ({
        user_id: user.id,
        title: t.title,
        description: t.description,
        urgent: t.urgent,
        important: t.important,
        quadrant: t.quadrant,
        due_date: t.dueDate,
        estimated_duration: t.estimatedDuration || 30,
        status: t.status || 'pending',
        order: t.order || 0,
        tags: t.tags || [],
      }));

      const { data, error } = await supabase.from('tasks').insert(payload).select();
      if (error) throw error;
      
      setTasks(prev => [...prev, ...data.map(row => mapToTask(row))]);
      monitoringStore.addLog('task:import', { count: parsed.length });
      toast.success(`Imported ${parsed.length} tasks synced to cloud`);
    } catch (err: any) {
      monitoringStore.addLog('task:import-failed', {}, 'error');
      toast.error('Invalid file format or network issue');
    }
  }, [user]);

  const clearAllTasks = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('user_id', user.id);
      if (error) throw error;
      
      monitoringStore.addLog('task:clear', { previous: tasks.length }, 'warn');
      setTasks([]);
      toast('All tasks cleared from cloud');
    } catch (err: any) {
      toast.error('Failed to clear database');
    }
  }, [tasks.length, user]);

  return useMemo(() => ({
    tasks: tasksWithMetrics,
    loading,
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
    addSubTask,
    toggleSubTask,
    deleteSubTask,
  }), [tasksWithMetrics, loading, addTask, updateTask, deleteTask, moveToQuadrant, reorderInQuadrant, getQuadrantTasks, getDailyFocus, getStats, exportTasks, importTasks, clearAllTasks, addSubTask, toggleSubTask, deleteSubTask]);
}
