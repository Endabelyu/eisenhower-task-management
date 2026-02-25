import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuadrantPanel } from '@/components/QuadrantPanel';
import { TaskWithMetrics } from '@/types/task';

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  verticalListSortingStrategy: {},
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
vi.mock('@/monitoring/monitoring-store', () => ({
  monitoringStore: { addLog: vi.fn(), addError: vi.fn(), addMetric: vi.fn() },
}));
vi.mock('@/context/TaskContext', () => ({
  useTaskContext: () => ({
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    addSubTask: vi.fn(),
    toggleSubTask: vi.fn(),
    deleteSubTask: vi.fn(),
  }),
}));

const makeTask = (id: string, overrides: Partial<TaskWithMetrics> = {}): TaskWithMetrics => ({
  id,
  title: `Task ${id}`,
  urgent: true,
  important: true,
  quadrant: 'do',
  estimatedDuration: 30,
  status: 'pending',
  order: 0,
  tags: [],
  subtasks: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  daysUntilDue: null,
  urgencyScore: 40,
  isOverdue: false,
  ...overrides,
});

describe('QuadrantPanel', () => {
  it('renders the quadrant label and description for "do"', () => {
    render(<QuadrantPanel quadrant="do" tasks={[]} />);
    expect(screen.getByText('Do First')).toBeInTheDocument();
    expect(screen.getByText('Urgent & Important')).toBeInTheDocument();
  });

  it('renders the quadrant label for "schedule"', () => {
    render(<QuadrantPanel quadrant="schedule" tasks={[]} />);
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });

  it('shows zero task count when empty', () => {
    render(<QuadrantPanel quadrant="hold" tasks={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows empty state message when no tasks', () => {
    render(<QuadrantPanel quadrant="do" tasks={[]} />);
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
  });

  it('renders task titles when tasks are provided', () => {
    const tasks = [makeTask('a'), makeTask('b')];
    render(<QuadrantPanel quadrant="do" tasks={tasks} />);
    expect(screen.getByText('Task a')).toBeInTheDocument();
    expect(screen.getByText('Task b')).toBeInTheDocument();
  });

  it('shows correct task count badge', () => {
    const tasks = [makeTask('a'), makeTask('b'), makeTask('c')];
    render(<QuadrantPanel quadrant="do" tasks={tasks} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows overdue count badge when tasks are overdue', () => {
    const tasks = [
      makeTask('a', { isOverdue: true }),
      makeTask('b', { isOverdue: true }),
      makeTask('c'),
    ];
    render(<QuadrantPanel quadrant="do" tasks={tasks} />);
    expect(screen.getByText('2!')).toBeInTheDocument();
  });
});
