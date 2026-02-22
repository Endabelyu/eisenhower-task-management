import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeMetrics, useTasks } from '@/hooks/use-tasks';
import type { Task } from '@/types/task';

const toastMock = vi.hoisted(() => {
  const fn = vi.fn();
  return Object.assign(fn, { success: vi.fn(), error: vi.fn() });
});

vi.mock('sonner', () => ({ toast: toastMock }));

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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    localStorage.clear();
    toastMock.mockClear();
    toastMock.success.mockClear();
    toastMock.error.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no tasks when storage is empty', () => {
    const { result } = renderHook(() => useTasks());
    expect(result.current.tasks).toEqual([]);
  });

  it('loads legacy tasks without tags and defaults tags to an empty array', () => {
    localStorage.setItem('eisenhower-tasks', JSON.stringify([
      {
        ...makeTask({ id: 'legacy-task' }),
        tags: undefined,
      },
    ]));

    const { result } = renderHook(() => useTasks());
    expect(result.current.tasks[0].tags).toEqual([]);
  });

  it('adds a task with defaults for duration and tags', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({ title: 'Ship feature', urgent: true, important: true });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0]).toMatchObject({
      title: 'Ship feature',
      quadrant: 'do',
      estimatedDuration: 30,
      tags: [],
    });
  });

  it('adds a task with provided tags', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({
        title: 'Workout',
        urgent: false,
        important: true,
        tags: ['Health'],
      });
    });

    expect(result.current.tasks[0].tags).toEqual(['Health']);
  });

  it('updates quadrant when urgency and importance are changed', () => {
    const { result } = renderHook(() => useTasks());

    let taskId = '';
    act(() => {
      const task = result.current.addTask({ title: 'Email', urgent: true, important: true });
      taskId = task.id;
    });

    act(() => {
      result.current.updateTask(taskId, { urgent: false, important: false });
    });

    expect(result.current.tasks[0].quadrant).toBe('hold');
  });

  it('sets completedAt when task status becomes completed', () => {
    const { result } = renderHook(() => useTasks());

    let taskId = '';
    act(() => {
      taskId = result.current.addTask({ title: 'Review PR', urgent: true, important: true }).id;
    });

    act(() => {
      result.current.updateTask(taskId, { status: 'completed' });
    });

    expect(result.current.tasks[0].status).toBe('completed');
    expect(result.current.tasks[0].completedAt).toBeDefined();
  });

  it('deletes and restores a task via undo action', () => {
    const { result } = renderHook(() => useTasks());

    let taskId = '';
    act(() => {
      taskId = result.current.addTask({ title: 'Delete me', urgent: true, important: true }).id;
    });

    act(() => {
      result.current.deleteTask(taskId);
    });
    expect(result.current.tasks).toHaveLength(0);

    const toastCall = toastMock.mock.calls.find(([message]) => message === 'Task deleted');
    const undoAction = toastCall?.[1]?.action;

    expect(undoAction).toBeDefined();
    act(() => {
      undoAction.onClick();
    });

    expect(result.current.tasks).toHaveLength(1);
  });

  it('moves a task to a new quadrant and updates urgency flags', () => {
    const { result } = renderHook(() => useTasks());

    let taskId = '';
    act(() => {
      taskId = result.current.addTask({ title: 'Move me', urgent: false, important: false }).id;
    });

    act(() => {
      result.current.moveToQuadrant(taskId, 'delegate');
    });

    expect(result.current.tasks[0]).toMatchObject({
      quadrant: 'delegate',
      urgent: true,
      important: false,
    });
  });

  it('reorders tasks within a quadrant', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({ title: 'Task A', urgent: true, important: true });
      result.current.addTask({ title: 'Task B', urgent: true, important: true });
      result.current.addTask({ title: 'Task C', urgent: true, important: true });
    });

    const ids = result.current.getQuadrantTasks('do').map((task) => task.id);

    act(() => {
      result.current.reorderInQuadrant('do', [ids[2], ids[0], ids[1]]);
    });

    const orderedIds = result.current.getQuadrantTasks('do').map((task) => task.id);
    expect(orderedIds).toEqual([ids[2], ids[0], ids[1]]);
  });

  it('returns top five daily focus tasks and excludes completed tasks', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({ title: 'T1', urgent: true, important: true, dueDate: '2026-01-02' });
      result.current.addTask({ title: 'T2', urgent: true, important: true, dueDate: '2026-01-03' });
      result.current.addTask({ title: 'T3', urgent: true, important: true, dueDate: '2026-01-04' });
      result.current.addTask({ title: 'T4', urgent: true, important: true, dueDate: '2026-01-05' });
      result.current.addTask({ title: 'T5', urgent: true, important: true, dueDate: '2026-01-06' });
      result.current.addTask({ title: 'T6', urgent: true, important: true, dueDate: '2026-01-07' });
    });

    const topTaskId = result.current.getDailyFocus()[0].id;

    act(() => {
      result.current.updateTask(topTaskId, { status: 'completed' });
    });

    const focus = result.current.getDailyFocus();
    expect(focus).toHaveLength(5);
    expect(focus.every((task) => task.status !== 'completed')).toBe(true);
  });

  it('computes aggregate task stats', () => {
    const { result } = renderHook(() => useTasks());

    let doneTaskId = '';
    act(() => {
      doneTaskId = result.current.addTask({ title: 'Done', urgent: true, important: true }).id;
      result.current.addTask({ title: 'Pending', urgent: false, important: true });
    });

    act(() => {
      result.current.updateTask(doneTaskId, { status: 'completed' });
    });

    const stats = result.current.getStats();
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.completionRate).toBe(50);
  });

  it('imports valid task arrays', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.importTasks(JSON.stringify([
        makeTask({ id: 'import-1', title: 'Imported', tags: ['Work'] }),
      ]));
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Imported');
  });

  it('rejects invalid imports', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.importTasks('{"invalid":true}');
    });

    expect(result.current.tasks).toHaveLength(0);
    expect(toastMock.error).toHaveBeenCalledWith('Invalid file format');
  });

  it('clears all tasks', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({ title: 'Task 1', urgent: true, important: true });
      result.current.addTask({ title: 'Task 2', urgent: false, important: true });
    });
    expect(result.current.tasks).toHaveLength(2);

    act(() => {
      result.current.clearAllTasks();
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
