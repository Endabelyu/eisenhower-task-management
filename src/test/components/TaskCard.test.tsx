import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/TaskCard';
import { TaskWithMetrics } from '@/types/task';
import * as TaskContext from '@/context/TaskContext';

// Mock monitoring store to avoid side effects
vi.mock('@/monitoring/monitoring-store', () => ({
  monitoringStore: { addLog: vi.fn(), addError: vi.fn(), addMetric: vi.fn() },
}));

// Mock dnd-kit to avoid jsdom pointer event issues
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

const mockUpdateTask = vi.fn();
const mockDeleteTask = vi.fn();

vi.spyOn(TaskContext, 'useTaskContext').mockReturnValue({
  tasks: [],
  loading: false,
  addTask: vi.fn(),
  updateTask: mockUpdateTask,
  deleteTask: mockDeleteTask,
  moveToQuadrant: vi.fn(),
  reorderInQuadrant: vi.fn(),
  getQuadrantTasks: vi.fn(() => []),
  getDailyFocus: vi.fn(() => []),
  getStats: vi.fn(() => ({ total: 0, completed: 0, overdue: 0, completionRate: 0, byQuadrant: [] })),
  exportTasks: vi.fn(),
  importTasks: vi.fn(),
  clearAllTasks: vi.fn(),
  addSubTask: vi.fn(),
  toggleSubTask: vi.fn(),
  deleteSubTask: vi.fn(),
});

const makeTask = (overrides: Partial<TaskWithMetrics> = {}): TaskWithMetrics => ({
  id: 'task-1',
  title: 'Test Task',
  description: 'A test description',
  urgent: true,
  important: true,
  quadrant: 'do',
  dueDate: undefined,
  estimatedDuration: 30,
  status: 'pending',
  order: 0,
  tags: [],
  subtasks: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  completedAt: undefined,
  daysUntilDue: null,
  urgencyScore: 40,
  isOverdue: false,
  ...overrides,
});

describe('TaskCard', () => {
  beforeEach(() => {
    mockUpdateTask.mockClear();
    mockDeleteTask.mockClear();
  });

  it('renders task title and duration', () => {
    render(<TaskCard task={makeTask()} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('30m')).toBeInTheDocument();
  });

  it('renders status badge as Pending', () => {
    render(<TaskCard task={makeTask()} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders completed task with line-through style', () => {
    render(<TaskCard task={makeTask({ status: 'completed' })} />);
    const title = screen.getByText('Test Task');
    expect(title.className).toContain('line-through');
  });

  it('calls updateTask on completion toggle', () => {
    render(<TaskCard task={makeTask()} />);
    fireEvent.click(screen.getByLabelText('Mark as completed'));
    expect(mockUpdateTask).toHaveBeenCalledWith('task-1', { status: 'completed' });
  });

  it('shows overdue badge when task is overdue', () => {
    render(<TaskCard task={makeTask({ isOverdue: true })} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('renders tags as colored badges', () => {
    render(<TaskCard task={makeTask({ tags: ['Work', 'Health'] })} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  it('drag handle has correct aria-label', () => {
    render(<TaskCard task={makeTask()} />);
    expect(screen.getByLabelText('Drag to reorder task')).toBeInTheDocument();
  });

  it('shows delete dialog on trash button click and calls deleteTask on confirm', () => {
    render(<TaskCard task={makeTask()} />);
    // Hover-reveal button — force it visible
    const deleteBtn = screen.getByLabelText('Delete task');
    fireEvent.click(deleteBtn);
    // AlertDialog confirm button
    const confirmBtn = screen.getByText('Delete');
    fireEvent.click(confirmBtn);
    expect(mockDeleteTask).toHaveBeenCalledWith('task-1');
  });
});
