/**
 * Represents the four quadrants of the Eisenhower Matrix.
 * - do: Urgent and Important
 * - schedule: Important but Not Urgent
 * - delegate: Urgent but Not Important
 * - hold: Low Priority (Not Urgent and Not Important)
 */
export type Quadrant = 'do' | 'schedule' | 'delegate' | 'hold';

/**
 * Status of a task in the workflow.
 */
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'hold';

/**
 * Core Task interface representing a user task.
 */
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
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export const PRESET_TAGS = [
  { name: 'Work', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  { name: 'Personal', color: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  { name: 'Health', color: 'bg-pink-500/15 text-pink-700 dark:text-pink-400' },
  { name: 'Finance', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  { name: 'Learning', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' },
  { name: 'Home', color: 'bg-teal-500/15 text-teal-700 dark:text-teal-400' },
] as const;

/**
 * Task interface extended with calculated metrics for sorting and display.
 */
export interface TaskWithMetrics extends Task {
  daysUntilDue: number | null;
  urgencyScore: number;
  isOverdue: boolean;
}

/**
 * Configuration object defining visual properties for each matrix quadrant.
 */
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

/**
 * Determines the quadrant for a task based on its urgency and importance.
 * @param urgent - Whether the task is urgent.
 * @param important - Whether the task is important.
 * @returns The appropriate Quadrant.
 */
export const getQuadrant = (urgent: boolean, important: boolean): Quadrant => {
  if (urgent && important) return 'do';
  if (!urgent && important) return 'schedule';
  if (urgent && !important) return 'delegate';
  return 'hold';
};

/**
 * Retrieves the urgency and importance flags for a given quadrant.
 * @param quadrant - The quadrant to get flags for.
 * @returns An object containing urgent and important boolean flags.
 */
export const getQuadrantFlags = (quadrant: Quadrant): { urgent: boolean; important: boolean } => {
  switch (quadrant) {
    case 'do': return { urgent: true, important: true };
    case 'schedule': return { urgent: false, important: true };
    case 'delegate': return { urgent: true, important: false };
    case 'hold': return { urgent: false, important: false };
  }
};
