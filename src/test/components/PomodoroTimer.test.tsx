import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { PomodoroProvider } from '@/context/PomodoroContext';

const renderWithProvider = () => {
  return render(
    <PomodoroProvider>
      <PomodoroTimer />
    </PomodoroProvider>
  );
};

describe('PomodoroTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock Audio API for JSDOM
    window.HTMLMediaElement.prototype.pause = vi.fn();
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(true);
    // Mock Notification API
    global.Notification = {
      requestPermission: vi.fn().mockResolvedValue('granted'),
      permission: 'granted',
    } as unknown as typeof Notification;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders in focus mode initially with 25:00', () => {
    renderWithProvider();
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('Focus Session (25 min)')).toBeInTheDocument();
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
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Pause'));
    });
    const timeBefore = screen.getByText(/^\d{2}:\d{2}$/).textContent;
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText(/^\d{2}:\d{2}$/).textContent).toBe(timeBefore);
  });

  it('resets to 25:00 when Reset is clicked', async () => {
    renderWithProvider();
    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Reset'));
    });
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('switches to break mode and shows 05:00', () => {
    renderWithProvider();
    fireEvent.click(screen.getByText('Break 5m'));
    expect(screen.getByText('05:00')).toBeInTheDocument();
    expect(screen.getByText('Break Session (5 min)')).toBeInTheDocument();
  });

  it('switches back to focus mode and shows 25:00', () => {
    renderWithProvider();
    fireEvent.click(screen.getByText('Break 5m'));
    fireEvent.click(screen.getByText('Focus 25m'));
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });
});
