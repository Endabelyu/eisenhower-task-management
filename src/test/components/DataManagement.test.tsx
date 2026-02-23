import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataManagement } from '@/components/DataManagement';
import * as TaskContext from '@/context/TaskContext';

vi.mock('@/monitoring/monitoring-store', () => ({
  monitoringStore: { addLog: vi.fn(), addError: vi.fn(), addMetric: vi.fn() },
}));

const mockExport = vi.fn();
const mockImport = vi.fn();
const mockClear = vi.fn();

vi.spyOn(TaskContext, 'useTaskContext').mockReturnValue({
  tasks: [],
  loading: false,
  addTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  moveToQuadrant: vi.fn(),
  reorderInQuadrant: vi.fn(),
  getQuadrantTasks: vi.fn(() => []),
  getDailyFocus: vi.fn(() => []),
  getStats: vi.fn(() => ({ total: 0, completed: 0, overdue: 0, completionRate: 0, byQuadrant: [] })),
  exportTasks: mockExport,
  importTasks: mockImport,
  clearAllTasks: mockClear,
});

describe('DataManagement', () => {
  beforeEach(() => {
    mockExport.mockClear();
    mockImport.mockClear();
    mockClear.mockClear();
  });

  it('renders Export, Import and Clear buttons', () => {
    render(<DataManagement />);
    expect(screen.getByText(/export json/i)).toBeInTheDocument();
    expect(screen.getByText(/import json/i)).toBeInTheDocument();
    expect(screen.getByText(/clear all data/i)).toBeInTheDocument();
  });

  it('calls exportTasks when Export JSON is clicked', () => {
    render(<DataManagement />);
    fireEvent.click(screen.getByText(/export json/i));
    expect(mockExport).toHaveBeenCalledTimes(1);
  });

  it('shows AlertDialog confirmation before clearing all data', () => {
    render(<DataManagement />);
    fireEvent.click(screen.getByText(/clear all data/i));
    expect(screen.getByText('Clear all data?')).toBeInTheDocument();
  });

  it('calls clearAllTasks when confirmation dialog is confirmed', () => {
    render(<DataManagement />);
    fireEvent.click(screen.getByText(/clear all data/i));
    fireEvent.click(screen.getByText('Clear All'));
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  it('does not call clearAllTasks when dialog is cancelled', () => {
    render(<DataManagement />);
    fireEvent.click(screen.getByText(/clear all data/i));
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockClear).not.toHaveBeenCalled();
  });

  it('reads a file and calls importTasks with file content', async () => {
    render(<DataManagement />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const content = JSON.stringify([{ id: '1', title: 'T', quadrant: 'do' }]);
    const file = new File([content], 'tasks.json', { type: 'application/json' });

    // Simulate FileReader.onload
    const readAsTextSpy = vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function () {
      Object.defineProperty(this, 'result', { value: content });
      this.onload?.({ target: this } as ProgressEvent<FileReader>);
    });

    fireEvent.change(input, { target: { files: [file] } });
    expect(mockImport).toHaveBeenCalledWith(content);
    readAsTextSpy.mockRestore();
  });
});
