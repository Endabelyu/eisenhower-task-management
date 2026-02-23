import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PomodoroTimer } from '@/components/PomodoroTimer';

describe('PomodoroTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders in focus mode initially with 25:00', () => {
    render(<PomodoroTimer />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('Focus Session (25 min)')).toBeInTheDocument();
  });

  it('starts countdown when Start is clicked', () => {
    render(<PomodoroTimer />);
    fireEvent.click(screen.getByText('Start'));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('24:57')).toBeInTheDocument();
  });

  it('shows Pause when running', () => {
    render(<PomodoroTimer />);
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('pauses countdown when Pause is clicked', () => {
    render(<PomodoroTimer />);
    fireEvent.click(screen.getByText('Start'));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    fireEvent.click(screen.getByText('Pause'));
    const timeBefore = screen.getByText(/^\d{2}:\d{2}$/).textContent;
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText(/^\d{2}:\d{2}$/).textContent).toBe(timeBefore);
  });

  it('resets to 25:00 when Reset is clicked', () => {
    render(<PomodoroTimer />);
    fireEvent.click(screen.getByText('Start'));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    fireEvent.click(screen.getByText('Reset'));
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('switches to break mode and shows 05:00', () => {
    render(<PomodoroTimer />);
    fireEvent.click(screen.getByText('Break 5m'));
    expect(screen.getByText('05:00')).toBeInTheDocument();
    expect(screen.getByText('Break Session (5 min)')).toBeInTheDocument();
  });

  it('switches back to focus mode and shows 25:00', () => {
    render(<PomodoroTimer />);
    fireEvent.click(screen.getByText('Break 5m'));
    fireEvent.click(screen.getByText('Focus 25m'));
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });
});
