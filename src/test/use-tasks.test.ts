import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeMetrics, useTasks } from '@/hooks/use-tasks';
import type { Task } from '@/types/task';

// Mock Sonner
const toastMock = vi.hoisted(() => {
  const fn = vi.fn();
  return Object.assign(fn, { success: vi.fn(), error: vi.fn() });
});
vi.mock('sonner', () => ({ toast: toastMock }));

// Mock Auth Context
const mockUser = { id: 'test-user-id' };
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock Supabase
const mockSupabaseQuery = vi.hoisted(() => {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
  };
});

// Setup builder pattern for Supabase mocking
mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.insert.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.update.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.delete.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.order.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.single.mockReturnValue(mockSupabaseQuery);

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => mockSupabaseQuery,
  },
}));

vi.mock('@/monitoring/monitoring-store', () => ({
  monitoringStore: { addLog: vi.fn(), addError: vi.fn(), addMetric: vi.fn() },
}));

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: overrides.id ?? 'task-1',
  title: overrides.title ?? 'Task',
  description: overrides.description,
  urgent: overrides.urgent ?? true,
  important: overrides.important ?? true,
  quadrant: overrides.quadrant ?? 'do',
  dueDate: overrides.dueDate,
  estimatedDuration: overrides.estimatedDuration ?? 30,
  status: overrides.status ?? 'pending',
  order: overrides.order ?? 0,
  tags: overrides.tags ?? [],
  createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
  completedAt: overrides.completedAt,
});

describe('useTasks hook', () => {
  beforeEach(() => {
    localStorage.clear();
    toastMock.mockClear();
    toastMock.success.mockClear();
    toastMock.error.mockClear();
    
    // Default mock response for SELECT
    mockSupabaseQuery.order.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts with loading and loads tasks from supabase', async () => {
    mockSupabaseQuery.order.mockResolvedValue({
      data: [{
        id: 'db-task-1',
        title: 'DB Task',
        urgent: true,
        important: true,
        quadrant: 'do',
        estimated_duration: 30,
        status: 'pending',
        order: 0,
      }],
      error: null
    });

    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('DB Task');
  });

  it('adds a task with optimistic update and syncs to DB', async () => {
    mockSupabaseQuery.order.mockResolvedValue({ data: [], error: null });
    
    // Explicitly mock the chain for insert().select().single()
    const mockSingleInsert = vi.fn().mockResolvedValue({
      data: {
        id: 'real-db-id',
        title: 'Ship feature',
        urgent: true,
        important: true,
        quadrant: 'do',
        estimated_duration: 30,
        status: 'pending',
        order: 0,
      },
      error: null
    });
    
    mockSupabaseQuery.insert.mockReturnValueOnce({
      select: () => ({
        single: mockSingleInsert
      })
    });

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addTask({ title: 'Ship feature', urgent: true, important: true });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Ship feature');
  });

  it('computes aggregate task stats', async () => {
    mockSupabaseQuery.order.mockResolvedValue({ data: [], error: null });
    
    // Setup for add tasks
    const mockSingleInsert = vi.fn()
      .mockResolvedValueOnce({ data: { id: 'done-id', title: 'Done', status: 'pending', quadrant: 'do' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'pend-id', title: 'Pending', status: 'pending', quadrant: 'delegate' }, error: null });
      
    mockSupabaseQuery.insert.mockReturnValue({
      select: () => ({
        single: mockSingleInsert
      })
    });
    
    // We need to handle the .eq() mapping internally for the updateTask operation to not throw error
    mockSupabaseQuery.eq.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    let doneTaskId = '';
    await act(async () => {
      const t1 = await result.current.addTask({ title: 'Done', urgent: true, important: true });
      doneTaskId = t1.id;
      await result.current.addTask({ title: 'Pending', urgent: false, important: true });
    });

    await act(async () => {
      await result.current.updateTask(doneTaskId, { status: 'completed' });
    });

    const stats = result.current.getStats();
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.completionRate).toBe(50);
  });
  
  it('clears all tasks', async () => {
    mockSupabaseQuery.order.mockResolvedValue({ data: [{
      id: 'db-task-1', title: 'Task 1', quadrant: 'do', status: 'pending'
    }], error: null });
    
    mockSupabaseQuery.eq.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useTasks());
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toHaveLength(1);

    await act(async () => {
      await result.current.clearAllTasks();
    });
    
    expect(result.current.tasks).toEqual([]);
  });
});

describe('computeMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks overdue pending tasks as overdue', () => {
    const metrics = computeMetrics(makeTask({ dueDate: '2025-12-30', status: 'pending' }));
    expect(metrics.isOverdue).toBe(true);
    expect(metrics.daysUntilDue).toBeLessThan(0);
  });

  it('does not mark completed tasks as overdue', () => {
    const metrics = computeMetrics(makeTask({ dueDate: '2025-12-30', status: 'completed' }));
    expect(metrics.isOverdue).toBe(false);
  });
});
