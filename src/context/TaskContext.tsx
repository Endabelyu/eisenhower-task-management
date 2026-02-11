import { createContext, useContext, ReactNode } from 'react';
import { useTasks } from '@/hooks/use-tasks';

type TaskContextType = ReturnType<typeof useTasks>;

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const tasks = useTasks();
  return <TaskContext.Provider value={tasks}>{children}</TaskContext.Provider>;
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider');
  return ctx;
}
