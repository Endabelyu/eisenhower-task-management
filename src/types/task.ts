export type Quadrant = 'do' | 'schedule' | 'delegate' | 'hold';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'hold';

export interface Task {
  id: string;
  title: string;
  description?: string;
  urgent: boolean;
  important: boolean;
  quadrant: Quadrant;
  dueDate?: string;
  estimatedDuration: number; // minutes
  status: TaskStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TaskWithMetrics extends Task {
  daysUntilDue: number | null;
  urgencyScore: number;
  isOverdue: boolean;
}

export const QUADRANT_CONFIG = {
  do: {
    label: 'Do First',
    emoji: '🔴',
    description: 'Urgent & Important',
    className: 'quadrant-do',
    accentClassName: 'quadrant-do-accent',
  },
  schedule: {
    label: 'Schedule',
    emoji: '🟡',
    description: 'Important, Not Urgent',
    className: 'quadrant-schedule',
    accentClassName: 'quadrant-schedule-accent',
  },
  delegate: {
    label: 'Delegate',
    emoji: '🟠',
    description: 'Urgent, Not Important',
    className: 'quadrant-delegate',
    accentClassName: 'quadrant-delegate-accent',
  },
  hold: {
    label: 'Hold',
    emoji: '⚪',
    description: 'Low Priority',
    className: 'quadrant-hold',
    accentClassName: 'quadrant-hold-accent',
  },
} as const;

export const getQuadrant = (urgent: boolean, important: boolean): Quadrant => {
  if (urgent && important) return 'do';
  if (!urgent && important) return 'schedule';
  if (urgent && !important) return 'delegate';
  return 'hold';
};

export const getQuadrantFlags = (quadrant: Quadrant): { urgent: boolean; important: boolean } => {
  switch (quadrant) {
    case 'do': return { urgent: true, important: true };
    case 'schedule': return { urgent: false, important: true };
    case 'delegate': return { urgent: true, important: false };
    case 'hold': return { urgent: false, important: false };
  }
};
