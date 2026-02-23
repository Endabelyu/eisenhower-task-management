/**
 * Monitoring store — lightweight singleton for in-app error tracking,
 * event logging, and performance metrics. No external dependencies.
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface MonitoringError {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
}

export interface MonitoringLog {
  id: string;
  event: string;
  payload?: string;
  timestamp: number;
  level: LogLevel;
}

export interface MonitoringMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

interface MonitoringSnapshot {
  errors: MonitoringError[];
  logs: MonitoringLog[];
  metrics: MonitoringMetric[];
}

type Listener = () => void;

const MAX_ENTRIES = 100;

function evict<T>(arr: T[]): T[] {
  return arr.length >= MAX_ENTRIES ? arr.slice(1) : arr;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

class MonitoringStore {
  private errors: MonitoringError[] = [];
  private logs: MonitoringLog[] = [];
  private metrics: MonitoringMetric[] = [];
  private listeners: Set<Listener> = new Set();

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  addError(message: string, stack?: string, componentStack?: string) {
    this.errors = evict(this.errors);
    this.errors.push({ id: uid(), message, stack, componentStack, timestamp: Date.now() });
    this.notify();
  }

  addLog(event: string, payload?: unknown, level: LogLevel = 'info') {
    this.logs = evict(this.logs);
    this.logs.push({
      id: uid(),
      event,
      payload: payload !== undefined ? JSON.stringify(payload) : undefined,
      timestamp: Date.now(),
      level,
    });
    this.notify();
  }

  addMetric(name: string, value: number, unit: string) {
    this.metrics = evict(this.metrics);
    this.metrics.push({ id: uid(), name, value, unit, timestamp: Date.now() });
    this.notify();
  }

  getSnapshot(): MonitoringSnapshot {
    return {
      errors: [...this.errors].reverse(),
      logs: [...this.logs].reverse(),
      metrics: [...this.metrics].reverse(),
    };
  }

  clear() {
    this.errors = [];
    this.logs = [];
    this.metrics = [];
    this.notify();
  }
}

/** Singleton instance shared across the app */
export const monitoringStore = new MonitoringStore();
