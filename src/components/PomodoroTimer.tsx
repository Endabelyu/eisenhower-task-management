import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

const formatTime = (seconds: number) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainingSeconds = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

/**
 * Lightweight Pomodoro timer with 25-minute focus and 5-minute break cycles.
 */
export function PomodoroTimer() {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1;

        const nextMode = mode === 'focus' ? 'break' : 'focus';
        setMode(nextMode);
        setRunning(false);
        return nextMode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [mode, running]);

  const modeLabel = useMemo(
    () => (mode === 'focus' ? 'Focus Session (25 min)' : 'Break Session (5 min)'),
    [mode],
  );

  const setSessionMode = (nextMode: 'focus' | 'break') => {
    setMode(nextMode);
    setRunning(false);
    setSecondsLeft(nextMode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft(mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Timer className="h-5 w-5 text-status-in-progress" />
        <h2 className="font-display text-lg font-semibold">Pomodoro Timer</h2>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === 'focus' ? 'default' : 'outline'}
          onClick={() => setSessionMode('focus')}
        >
          Focus 25m
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'break' ? 'default' : 'outline'}
          onClick={() => setSessionMode('break')}
        >
          Break 5m
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{modeLabel}</p>
      <p className="mt-2 font-display text-4xl font-bold tabular-nums">{formatTime(secondsLeft)}</p>

      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={() => setRunning((prev) => !prev)} className="gap-2">
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? 'Pause' : 'Start'}
        </Button>
        <Button type="button" variant="outline" onClick={resetTimer} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
