import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { PomodoroProvider } from '@/context/PomodoroContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { TaskContext } from '@/context/TaskContext';
import { useTasks } from '@/hooks/use-tasks';
import type { TaskWithMetrics } from '@/types/task';

// Minimal TaskContext mock matching ReturnType<typeof useTasks>
const mockTaskContextValue: ReturnType<typeof useTasks> = {
  tasks: [] as TaskWithMetrics[],
  loading: false,
  addTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  restoreTask: vi.fn(),
  moveToQuadrant: vi.fn(),
  reorderInQuadrant: vi.fn(),
  getQuadrantTasks: vi.fn().mockReturnValue([]),
  getDailyFocus: vi.fn().mockReturnValue([]),
  getStats: vi.fn().mockReturnValue({
    total: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0,
    byQuadrant: [],
  }),
  exportTasks: vi.fn(),
  importTasks: vi.fn(),
  clearAllTasks: vi.fn(),
  copyTask: vi.fn(),
  addSubTask: vi.fn(),
  toggleSubTask: vi.fn(),
  deleteSubTask: vi.fn(),
  updateSubTask: vi.fn(),
};

const renderWithProvider = (tasks: TaskWithMetrics[] = []) => {
  return render(
    <LanguageProvider>
      <PomodoroProvider>
        <TaskContext.Provider value={{ ...mockTaskContextValue, tasks }}>
          <PomodoroTimer />
        </TaskContext.Provider>
      </PomodoroProvider>
    </LanguageProvider>
  );
};

describe('PomodoroTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.HTMLMediaElement.prototype.pause = vi.fn();
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    global.Notification = {
      requestPermission: vi.fn().mockResolvedValue('granted'),
      permission: 'granted',
    } as unknown as typeof Notification;
    global.AudioContext = vi.fn().mockImplementation(() => ({
      createOscillator: vi.fn().mockReturnValue({
        connect: vi.fn(),
        frequency: { value: 0 },
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createGain: vi.fn().mockReturnValue({
        connect: vi.fn(),
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      }),
      destination: {},
      currentTime: 0,
    })) as unknown as typeof AudioContext;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders in focus mode initially with 25:00', () => {
    renderWithProvider();
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('Focus Session')).toBeInTheDocument();
  });

  it('starts countdown when Start is clicked', async () => {
    renderWithProvider();
    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('24:57')).toBeInTheDocument();
  });

  it('shows Pause when running', async () => {
    renderWithProvider();
    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('pauses countdown when Pause is clicked', async () => {
    renderWithProvider();
    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });
    act(() => { vi.advanceTimersByTime(5000); });
    await act(async () => {
      fireEvent.click(screen.getByText('Pause'));
    });
    const timeBefore = screen.getByText(/^\d{2}:\d{2}$/).textContent;
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText(/^\d{2}:\d{2}$/).textContent).toBe(timeBefore);
  });

  it('resets to 25:00 when Reset is clicked', async () => {
    renderWithProvider();
    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });
    act(() => { vi.advanceTimersByTime(10000); });
    await act(async () => {
      fireEvent.click(screen.getByText('Reset'));
    });
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('switches to break mode and shows 05:00', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('mode-break'));
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('switches back to focus mode and shows 25:00', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('mode-break'));
    fireEvent.click(screen.getByTestId('mode-focus'));
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  // --- Auto-break flow ---

  it('auto-starts break when focus session ends', async () => {
    renderWithProvider();
    // Set focus to 1 min for fast test
    const focusInput = screen.getByTestId('focus-minutes-input');
    fireEvent.change(focusInput, { target: { value: '1' } });
    fireEvent.blur(focusInput);

    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });
    act(() => { vi.advanceTimersByTime(61000); }); // 1 min + 1s
    expect(screen.getAllByText('Break').length).toBeGreaterThan(0);
  });

  it('stops after break ends and shows Start button', async () => {
    renderWithProvider();
    const focusInput = screen.getByTestId('focus-minutes-input');
    fireEvent.change(focusInput, { target: { value: '1' } });
    fireEvent.blur(focusInput);
    const breakInput = screen.getByTestId('break-minutes-input');
    fireEvent.change(breakInput, { target: { value: '1' } });
    fireEvent.blur(breakInput);

    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });
    act(() => { vi.advanceTimersByTime(125000); }); // 1m focus + 1m break + buffer
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  // --- Preset chips ---

  it('applies Classic preset (25/5)', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('preset-classic'));
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('applies DeskTime preset (52/17)', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('preset-desktime'));
    expect(screen.getByText('52:00')).toBeInTheDocument();
  });

  it('disables preset chips while timer is running', async () => {
    renderWithProvider();
    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });
    expect(screen.getByTestId('preset-classic')).toBeDisabled();
  });

  // --- Inline duration editing ---

  it('focus input updates timer when changed while stopped', () => {
    renderWithProvider();
    const input = screen.getByTestId('focus-minutes-input');
    fireEvent.change(input, { target: { value: '45' } });
    fireEvent.blur(input);
    expect(screen.getByText('45:00')).toBeInTheDocument();
  });

  it('break input updates break display when in break mode', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('mode-break'));
    const input = screen.getByTestId('break-minutes-input');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.blur(input);
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  // --- Ambient sound ---

  it('pauses audio when timer is paused', async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause');
    renderWithProvider();
    await act(async () => { fireEvent.click(screen.getByText('Start')); });
    await act(async () => { fireEvent.click(screen.getByText('Pause')); });
    expect(pauseSpy).toHaveBeenCalled();
  });

  it('pauses audio when timer is reset', async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause');
    renderWithProvider();
    await act(async () => { fireEvent.click(screen.getByText('Start')); });
    await act(async () => { fireEvent.click(screen.getByText('Reset')); });
    expect(pauseSpy).toHaveBeenCalled();
  });
});
