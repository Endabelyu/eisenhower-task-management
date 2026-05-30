# Pomodoro Timer Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Pomodoro timer with timestamp-based countdown (no drift), task-based focus duration, inline editable minutes, named preset chips, auto-start break, and force-focus notification on break end.

**Architecture:** Rewrite `PomodoroContext` tick loop to use `targetEndRef` (a `useRef`) instead of decrement — interval reads `Date.now()` each tick to compute remaining seconds, eliminating background-tab drift. Auto-break and chime logic live in the same tick handler. Task selection and `selectedTaskId` are local state in `PomodoroTimer` (not context) because Tasks provider mounts after Pomodoro in the tree.

**Tech Stack:** React 18, TypeScript, shadcn/ui (`Select`, `Button`, `Input`), Web Audio API (chime), existing `notify()` from `lib/notifications.ts`, `useTasks()` from `hooks/use-tasks.ts`

---

## File Map

| File | Change |
|------|--------|
| `src/context/PomodoroContext.tsx` | Rewrite tick loop → timestamp-based; add auto-break + chime; add `targetEndRef` refs |
| `src/components/PomodoroTimer.tsx` | Add task selector, inline editing, preset chips |
| `src/i18n/dictionaries.ts` | Add new translation keys (task selector, presets, notifications) |
| `src/test/components/PomodoroTimer.test.tsx` | Update broken tests + add new tests |

---

## Task 1: Timestamp-based Timer Core

**Files:**
- Modify: `src/context/PomodoroContext.tsx`
- Modify: `src/test/components/PomodoroTimer.test.tsx`

### Why this approach
`setInterval` ticks are throttled in backgrounded tabs. Storing `targetEndRef.current = Date.now() + seconds * 1000` on start, then computing `remaining = ceil((targetEndRef.current - Date.now()) / 1000)` on each tick, means displayed time is always accurate regardless of throttle. Using a `useRef` (not state) for `targetEndTime` avoids stale closure without adding it to the effect dependency array — the interval always reads the current value.

- [ ] **Step 1: Update PomodoroContext.tsx — add refs, rewrite tick loop**

Replace the entire file content with:

```tsx
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { requestNotificationPermission, notify } from '@/lib/notifications';

export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;

export const formatTime = (seconds: number) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainingSeconds = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

export const AMBIENCE_SOUNDS = {
  none: { label: 'None', url: null },
  forest: { label: '🌲 Forest', url: '/sounds/mixkit-forest-treasure-138.mp3' },
  forestMist: { label: '🌫️ Forest Mist', url: '/sounds/mixkit-forest-mist-whispers-148.mp3' },
  cafe: { label: '☕ Cafe', url: '/sounds/mixkit-sicilian-cafe-600.mp3' },
  relaxation: { label: '🧘 Relaxation', url: '/sounds/mixkit-relaxation-05-749.mp3' },
  meditation: { label: '🕯️ Meditation', url: '/sounds/mixkit-smooth-meditation-324.mp3' },
  zanarkand: { label: '🌿 Zanarkand Forest', url: '/sounds/mixkit-zanarkand-forest-169.mp3' },
} as const;

export type AmbienceType = keyof typeof AMBIENCE_SOUNDS;

export function suggestBreak(focusMinutes: number): number {
  return Math.min(30, Math.max(1, Math.round(focusMinutes / 5)));
}

export const PRESETS = [
  { label: 'Classic', focus: 25, break: 5 },
  { label: 'DeskTime', focus: 52, break: 17 },
  { label: 'Ultradian', focus: 90, break: 20 },
] as const;

function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // AudioContext not available (e.g. JSDOM in tests) — silently skip
  }
}

interface PomodoroContextType {
  mode: 'focus' | 'break';
  secondsLeft: number;
  running: boolean;
  ambience: AmbienceType;
  volume: number;
  isPlaying: boolean;
  focusMinutes: number;
  breakMinutes: number;
  notificationsEnabled: boolean;
  setSessionMode: (mode: 'focus' | 'break') => void;
  resetTimer: () => void;
  toggleTimer: () => Promise<void>;
  setAmbience: (ambience: AmbienceType) => void;
  setVolume: (volume: number) => void;
  setFocusMinutes: (minutes: number) => void;
  setBreakMinutes: (minutes: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  totalSeconds: number;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

function loadNumber(key: string, defaultValue: number): number {
  const raw = localStorage.getItem(key);
  if (raw === null) return defaultValue;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [focusMinutes, setFocusMinutesState] = useState<number>(() =>
    loadNumber('pomodoro_focus_minutes', DEFAULT_FOCUS_MINUTES)
  );
  const [breakMinutes, setBreakMinutesState] = useState<number>(() =>
    loadNumber('pomodoro_break_minutes', DEFAULT_BREAK_MINUTES)
  );
  const [secondsLeft, setSecondsLeft] = useState(() =>
    loadNumber('pomodoro_focus_minutes', DEFAULT_FOCUS_MINUTES) * 60
  );
  const [running, setRunning] = useState(false);
  const [ambience, setAmbience] = useState<AmbienceType>('none');
  const [volume, setVolume] = useState(30);
  const [audio] = useState(() => new window.Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('pomodoro_notifications_enabled') !== 'false';
  });

  // Refs used inside interval to avoid stale closure
  const targetEndRef = useRef<number | null>(null);
  const modeRef = useRef<'focus' | 'break'>('focus');
  const focusSecondsRef = useRef<number>(focusMinutes * 60);
  const breakSecondsRef = useRef<number>(breakMinutes * 60);
  const notificationsEnabledRef = useRef<boolean>(notificationsEnabled);

  // Keep refs in sync with state
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => {
    focusSecondsRef.current = focusMinutes * 60;
  }, [focusMinutes]);
  useEffect(() => {
    breakSecondsRef.current = breakMinutes * 60;
  }, [breakMinutes]);
  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  const focusSeconds = focusMinutes * 60;
  const breakSeconds = breakMinutes * 60;

  // Timestamp-based tick loop — only depends on `running`
  useEffect(() => {
    if (!running) {
      document.title = 'Eisenhower Matrix';
      return;
    }

    const timerId = window.setInterval(() => {
      if (targetEndRef.current === null) return;

      const remaining = Math.ceil((targetEndRef.current - Date.now()) / 1000);

      if (remaining > 0) {
        setSecondsLeft(remaining);
        const currentMode = modeRef.current;
        const emoji = currentMode === 'focus' ? '⏱️' : '☕';
        const label = currentMode === 'focus' ? 'Focus' : 'Break';
        document.title = `${emoji} ${formatTime(remaining)} - ${label}`;
        return;
      }

      // Session complete
      targetEndRef.current = null;
      playChime();

      const currentMode = modeRef.current;

      if (currentMode === 'focus') {
        // Auto-start break
        const breakSecs = breakSecondsRef.current;
        targetEndRef.current = Date.now() + breakSecs * 1000;
        setMode('break');
        setSecondsLeft(breakSecs);
        // running stays true — interval keeps going

        if (notificationsEnabledRef.current) {
          notify('Focus complete! Break starting...', 'Take a short break.', {
            requireInteraction: false,
          });
        }
        document.title = `☕ ${formatTime(breakSecs)} - Break`;
      } else {
        // Break done — stop, wait for user
        const focusSecs = focusSecondsRef.current;
        setRunning(false);
        setMode('focus');
        setSecondsLeft(focusSecs);
        document.title = '✅ Break Done! Click Start to resume';

        if (notificationsEnabledRef.current) {
          notify('Break over! Ready to focus?', 'Click to return to the app.');
        }

        try { window.focus(); } catch { /* best-effort */ }
      }
    }, 1000);

    return () => {
      window.clearInterval(timerId);
      document.title = 'Eisenhower Matrix';
    };
  }, [running]);

  // Ambience audio
  useEffect(() => {
    const sound = AMBIENCE_SOUNDS[ambience];

    if (!sound.url) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (!audio.src.endsWith(sound.url)) {
      audio.src = sound.url;
      audio.load();
    }

    audio.loop = true;
    audio.volume = volume / 100;

    if (running) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }

    return () => {
      audio.pause();
      setIsPlaying(false);
    };
  }, [ambience, running, audio, volume]);

  useEffect(() => {
    audio.volume = volume / 100;
  }, [volume, audio]);

  const setFocusMinutes = (minutes: number) => {
    const clamped = Math.max(1, Math.min(90, minutes));
    setFocusMinutesState(clamped);
    localStorage.setItem('pomodoro_focus_minutes', String(clamped));
    if (mode === 'focus' && !running) {
      setSecondsLeft(clamped * 60);
    }
  };

  const setBreakMinutes = (minutes: number) => {
    const clamped = Math.max(1, Math.min(30, minutes));
    setBreakMinutesState(clamped);
    localStorage.setItem('pomodoro_break_minutes', String(clamped));
    if (mode === 'break' && !running) {
      setSecondsLeft(clamped * 60);
    }
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    localStorage.setItem('pomodoro_notifications_enabled', String(enabled));
  };

  const setSessionMode = (nextMode: 'focus' | 'break') => {
    targetEndRef.current = null;
    setRunning(false);
    setMode(nextMode);
    setSecondsLeft(nextMode === 'focus' ? focusSeconds : breakSeconds);
  };

  const resetTimer = () => {
    targetEndRef.current = null;
    setRunning(false);
    setSecondsLeft(mode === 'focus' ? focusSeconds : breakSeconds);
  };

  const toggleTimer = async () => {
    if (!running) {
      if (notificationsEnabled) await requestNotificationPermission();
      targetEndRef.current = Date.now() + secondsLeft * 1000;
      setRunning(true);
    } else {
      targetEndRef.current = null;
      setRunning(false);
    }
  };

  const totalSeconds = mode === 'focus' ? focusSeconds : breakSeconds;

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        secondsLeft,
        running,
        ambience,
        volume,
        isPlaying,
        focusMinutes,
        breakMinutes,
        notificationsEnabled,
        setSessionMode,
        resetTimer,
        toggleTimer,
        setAmbience,
        setVolume,
        setFocusMinutes,
        setBreakMinutes,
        setNotificationsEnabled,
        totalSeconds,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
```

- [ ] **Step 2: Update test file — fix broken tests for timestamp-based timer**

Replace `src/test/components/PomodoroTimer.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { PomodoroProvider } from '@/context/PomodoroContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { TaskContext } from '@/context/TaskContext';
import type { TaskWithMetrics } from '@/types/task';

// Minimal TaskContext mock so PomodoroTimer's task selector can render
const mockTaskContextValue = {
  tasks: [] as TaskWithMetrics[],
  filteredTasks: [] as TaskWithMetrics[],
  loading: false,
  error: null,
  addTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  completeTask: vi.fn(),
  restoreTask: vi.fn(),
  copyTask: vi.fn(),
  reorderTasks: vi.fn(),
  activeFilter: 'all',
  setActiveFilter: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
};

const renderWithProvider = (tasks: TaskWithMetrics[] = []) => {
  return render(
    <LanguageProvider>
      <PomodoroProvider>
        <TaskContext.Provider value={{ ...mockTaskContextValue, tasks, filteredTasks: tasks }}>
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
    // Should now show break mode
    expect(screen.getByText('Break')).toBeInTheDocument();
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
```

- [ ] **Step 3: Run tests — expect failures on `mode-break`, `mode-focus`, `focus-minutes-input`, `break-minutes-input`, `preset-*` testIds (not yet in component)**

```bash
cd C:\Project\lovable\quadrant-calm && bunx vitest run src/test/components/PomodoroTimer.test.tsx
```

Expected: most tests pass, new `data-testid` tests fail with "Unable to find an element by: [data-testid=...]"

- [ ] **Step 4: Commit context rewrite and updated test file**

```bash
cd C:\Project\lovable\quadrant-calm
git add src/context/PomodoroContext.tsx src/test/components/PomodoroTimer.test.tsx
git commit -m "refactor: rewrite pomodoro timer to timestamp-based countdown

- Replace setInterval decrement with Date.now() diff to eliminate background tab drift
- Add auto-break: focus end auto-starts break, break end stops and notifies
- Add playChime() via Web Audio API on session complete
- Add suggestBreak() and PRESETS exports
- Use refs for interval-read values to avoid stale closure"
```

---

## Task 2: Add i18n Keys

**Files:**
- Modify: `src/i18n/dictionaries.ts`

- [ ] **Step 1: Add new keys to both language dictionaries**

In `dictionaries.ts`, find the Indonesian pomodoro block and add after `'pomodoro.mode.break'`:

```ts
'pomodoro.task.label': 'Tugas Fokus',
'pomodoro.task.none': 'Tanpa tugas',
'pomodoro.preset.label': 'Preset',
'pomodoro.notify.focus_done': 'Fokus selesai! Istirahat dimulai...',
'pomodoro.notify.focus_done_body': 'Ambil istirahat sejenak.',
'pomodoro.notify.break_done': 'Istirahat selesai! Siap fokus?',
'pomodoro.notify.break_done_body': 'Klik untuk kembali ke aplikasi.',
```

Find the English pomodoro block and add after `'pomodoro.mode.break'`:

```ts
'pomodoro.task.label': 'Focus Task',
'pomodoro.task.none': 'No task selected',
'pomodoro.preset.label': 'Presets',
'pomodoro.notify.focus_done': 'Focus complete! Break starting...',
'pomodoro.notify.focus_done_body': 'Take a short break.',
'pomodoro.notify.break_done': 'Break over! Ready to focus?',
'pomodoro.notify.break_done_body': 'Click to return to the app.',
```

- [ ] **Step 2: Commit**

```bash
cd C:\Project\lovable\quadrant-calm
git add src/i18n/dictionaries.ts
git commit -m "feat: add pomodoro i18n keys for task selector, presets, notifications"
```

---

## Task 3: Update PomodoroTimer UI — Inline Editing, Presets, Task Selector

**Files:**
- Modify: `src/components/PomodoroTimer.tsx`

This task adds all three UI features in one component file since they share state (`selectedTaskId`) and are tightly coupled.

**New local state in PomodoroTimer:**
- `selectedTaskId: string | null` — which task is linked (session-only)
- `editingFocus: boolean` — whether focus input is active
- `editingBreak: boolean` — whether break input is active
- `focusDraft: string` — controlled input value while editing focus
- `breakDraft: string` — controlled input value while editing break

- [ ] **Step 1: Rewrite PomodoroTimer.tsx**

```tsx
import { useMemo, useState, useEffect } from 'react';
import { Bell, BellOff, Pause, Play, RotateCcw, Timer, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePomodoro, AMBIENCE_SOUNDS, formatTime, PRESETS, suggestBreak } from '@/context/PomodoroContext';
import { useLanguage } from '@/context/LanguageContext';
import { getNotificationPermission } from '@/lib/notifications';
import { useTasks } from '@/hooks/use-tasks';

export function PomodoroTimer() {
  const {
    mode,
    secondsLeft,
    running,
    ambience,
    volume,
    isPlaying,
    focusMinutes,
    breakMinutes,
    notificationsEnabled,
    setSessionMode,
    resetTimer,
    toggleTimer,
    setAmbience,
    setVolume,
    setFocusMinutes,
    setBreakMinutes,
    totalSeconds,
  } = usePomodoro();

  const { t } = useLanguage();
  const { tasks } = useTasks();

  // Task selector state (session-only)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Inline editing state
  const [editingFocus, setEditingFocus] = useState(false);
  const [focusDraft, setFocusDraft] = useState(String(focusMinutes));
  const [editingBreak, setEditingBreak] = useState(false);
  const [breakDraft, setBreakDraft] = useState(String(breakMinutes));

  // Keep drafts in sync when context values change externally (preset click, task select)
  useEffect(() => {
    if (!editingFocus) setFocusDraft(String(focusMinutes));
  }, [focusMinutes, editingFocus]);

  useEffect(() => {
    if (!editingBreak) setBreakDraft(String(breakMinutes));
  }, [breakMinutes, editingBreak]);

  // Clear selectedTaskId if the linked task gets deleted or completed
  const incompleteTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed'),
    [tasks]
  );

  useEffect(() => {
    if (selectedTaskId && !incompleteTasks.find((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [incompleteTasks, selectedTaskId]);

  const modeLabel = useMemo(
    () => (mode === 'focus' ? t('pomodoro.focus') : t('pomodoro.break')),
    [mode, t]
  );

  const notifPermission = getNotificationPermission();
  const notifActive = notificationsEnabled && notifPermission === 'granted';

  function commitFocus() {
    const parsed = parseInt(focusDraft, 10);
    if (!isNaN(parsed)) {
      setFocusMinutes(parsed);
      // Auto-suggest break when not a named preset
      const isPreset = PRESETS.some((p) => p.focus === parsed);
      if (!isPreset) {
        setBreakMinutes(suggestBreak(parsed));
      }
    } else {
      setFocusDraft(String(focusMinutes));
    }
    setEditingFocus(false);
    setSelectedTaskId(null);
  }

  function commitBreak() {
    const parsed = parseInt(breakDraft, 10);
    if (!isNaN(parsed)) {
      setBreakMinutes(parsed);
    } else {
      setBreakDraft(String(breakMinutes));
    }
    setEditingBreak(false);
  }

  function applyPreset(focus: number, breakMin: number) {
    if (running) return;
    setFocusMinutes(focus);
    setBreakMinutes(breakMin);
    setSelectedTaskId(null);
    if (mode === 'focus') setSessionMode('focus');
    else setSessionMode('break');
  }

  function handleTaskSelect(taskId: string) {
    if (taskId === 'none') {
      setSelectedTaskId(null);
      return;
    }
    const task = incompleteTasks.find((t) => t.id === taskId);
    if (!task) return;
    setSelectedTaskId(taskId);
    setFocusMinutes(task.estimatedDuration);
    const isPreset = PRESETS.some((p) => p.focus === task.estimatedDuration);
    if (!isPreset) {
      setBreakMinutes(suggestBreak(task.estimatedDuration));
    }
  }

  const selectedTask = incompleteTasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Timer className="h-5 w-5 text-status-in-progress" />
        <h2 className="font-display text-lg font-semibold">{t('pomodoro.title')}</h2>
        <span
          className="ml-auto text-muted-foreground"
          title={
            notifPermission === 'unsupported'
              ? 'Notifications not supported'
              : notifActive
              ? 'Desktop notifications enabled'
              : 'Desktop notifications disabled or not permitted'
          }
        >
          {notifActive ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </span>
      </div>

      {/* Task Selector */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{t('pomodoro.task.label')}</p>
        <Select
          value={selectedTaskId ?? 'none'}
          onValueChange={handleTaskSelect}
          disabled={running}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={t('pomodoro.task.none')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('pomodoro.task.none')}</SelectItem>
            {incompleteTasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                <span className="flex items-center gap-2">
                  {task.title}
                  <span className="text-xs text-muted-foreground">{task.estimatedDuration}m</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTask && (
          <p className="mt-1 text-xs text-muted-foreground truncate">
            Fokus: {selectedTask.title}
          </p>
        )}
      </div>

      {/* Mode Buttons with Inline Editing */}
      <div className="mb-2 flex flex-wrap gap-2">
        {/* Focus Button */}
        <Button
          type="button"
          size="sm"
          variant={mode === 'focus' ? 'default' : 'outline'}
          onClick={() => setSessionMode('focus')}
          data-testid="mode-focus"
          className="gap-1"
        >
          Focus{' '}
          {editingFocus ? (
            <input
              data-testid="focus-minutes-input"
              type="number"
              min={1}
              max={90}
              value={focusDraft}
              className="w-10 rounded border border-input bg-background px-1 text-center text-sm tabular-nums text-foreground focus:outline-none"
              onChange={(e) => setFocusDraft(e.target.value)}
              onBlur={commitFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitFocus();
                if (e.key === 'Escape') { setFocusDraft(String(focusMinutes)); setEditingFocus(false); }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span
              className="cursor-text underline decoration-dotted"
              onClick={(e) => {
                if (running) return;
                e.stopPropagation();
                setFocusDraft(String(focusMinutes));
                setEditingFocus(true);
              }}
              title="Click to edit"
            >
              {focusMinutes}
            </span>
          )}
          m
        </Button>

        {/* Break Button */}
        <Button
          type="button"
          size="sm"
          variant={mode === 'break' ? 'default' : 'outline'}
          onClick={() => setSessionMode('break')}
          data-testid="mode-break"
          className="gap-1"
        >
          Break{' '}
          {editingBreak ? (
            <input
              data-testid="break-minutes-input"
              type="number"
              min={1}
              max={30}
              value={breakDraft}
              className="w-10 rounded border border-input bg-background px-1 text-center text-sm tabular-nums text-foreground focus:outline-none"
              onChange={(e) => setBreakDraft(e.target.value)}
              onBlur={commitBreak}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitBreak();
                if (e.key === 'Escape') { setBreakDraft(String(breakMinutes)); setEditingBreak(false); }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span
              className="cursor-text underline decoration-dotted"
              onClick={(e) => {
                if (running) return;
                e.stopPropagation();
                setBreakDraft(String(breakMinutes));
                setEditingBreak(true);
              }}
              title="Click to edit"
            >
              {breakMinutes}
            </span>
          )}
          m
        </Button>
      </div>

      {/* Preset Chips */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            data-testid={`preset-${preset.label.toLowerCase()}`}
            disabled={running}
            onClick={() => applyPreset(preset.focus, preset.break)}
            className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {preset.label} {preset.focus}/{preset.break}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{modeLabel}</p>

      {/* Circular Progress */}
      <div className="relative my-6 flex items-center justify-center">
        <svg className="h-48 w-48 -rotate-90 transform">
          <circle
            cx="96" cy="96" r="88"
            stroke="currentColor" strokeWidth="8" fill="none"
            className="text-muted/20"
          />
          <circle
            cx="96" cy="96" r="88"
            stroke="currentColor" strokeWidth="8" fill="none"
            strokeDasharray={`${2 * Math.PI * 88}`}
            strokeDashoffset={`${2 * Math.PI * 88 * (1 - (totalSeconds - secondsLeft) / totalSeconds)}`}
            className={mode === 'focus' ? 'text-status-in-progress' : 'text-quadrant-schedule'}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-5xl font-bold tabular-nums">{formatTime(secondsLeft)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100)}%
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={toggleTimer} className="gap-2">
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? t('pomodoro.pause') : t('pomodoro.start')}
        </Button>
        <Button type="button" variant="outline" onClick={resetTimer} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          {t('pomodoro.reset')}
        </Button>
      </div>

      {/* Ambience */}
      <div className="mt-4 border-t pt-4">
        <div className="mb-3 flex items-center gap-2">
          {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <span className="text-sm font-medium">{t('pomodoro.sound.label')}</span>
        </div>
        <div className="space-y-3">
          <Select value={ambience} onValueChange={(val: AmbienceType) => setAmbience(val)}>
            <SelectTrigger>
              <SelectValue placeholder={t('pomodoro.sound.none')} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AMBIENCE_SOUNDS).map(([key, sound]) => (
                <SelectItem key={key} value={key}>
                  {sound.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {ambience !== 'none' && (
            <div className="flex items-center gap-3">
              <VolumeX className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={(vals) => setVolume(vals[0])}
                max={100} step={5} className="flex-1"
              />
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <span className="w-10 text-sm tabular-nums text-muted-foreground">{volume}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Check TaskContext export — verify it's exported as named export**

```bash
cd C:\Project\lovable\quadrant-calm && grep -n "export.*TaskContext" src/context/TaskContext.tsx
```

Expected output contains: `export const TaskContext` or `export { TaskContext }`. If `TaskContext` is not exported, add `export` to its declaration in `TaskContext.tsx`.

- [ ] **Step 3: Run tests**

```bash
cd C:\Project\lovable\quadrant-calm && bunx vitest run src/test/components/PomodoroTimer.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Type check**

```bash
cd C:\Project\lovable\quadrant-calm && bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd C:\Project\lovable\quadrant-calm
git add src/components/PomodoroTimer.tsx
git commit -m "feat: add task selector, inline duration editing, and preset chips to pomodoro timer

- Task selector dropdown links focus duration to task's estimatedDuration
- Inline click-to-edit on focus (max 90m) and break (max 30m) minute labels
- Preset chips: Classic 25/5, DeskTime 52/17, Ultradian 90/20 (disabled while running)
- suggestBreak() auto-calculates break from custom focus duration
- selectedTaskId cleared on manual edit or preset click"
```

---

## Task 4: Verify notify() Supports requireInteraction Override

**Files:**
- Read: `src/lib/notifications.ts`

The existing `notify()` function defaults to `requireInteraction: true` but spreads `...options` after it, so `notify('title', 'body', { requireInteraction: false })` correctly overrides it. No code change needed — just confirm.

- [ ] **Step 1: Confirm the spread order in notifications.ts**

```bash
cd C:\Project\lovable\quadrant-calm && grep -A 8 "new Notification" src/lib/notifications.ts
```

Expected output:
```
  const notification = new Notification(title, {
    body,
    requireInteraction: true,
    ...options,
  });
```

The `...options` comes after `requireInteraction: true`, so options override the default. No change needed.

- [ ] **Step 2: Run full test suite to confirm no regressions**

```bash
cd C:\Project\lovable\quadrant-calm && bunx vitest run
```

Expected: all tests pass.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered in |
|-----------------|------------|
| Task selector → auto-fill focus duration | Task 3, `handleTaskSelect()` |
| Inline editable focus & break | Task 3, `editingFocus`/`editingBreak` state |
| Named presets Classic/DeskTime/Ultradian | Task 1 `PRESETS` export, Task 3 preset chips |
| Auto break formula `suggestBreak()` | Task 1 export, Task 3 `commitFocus()` and `handleTaskSelect()` |
| Auto-start break on focus end | Task 1, interval completion handler |
| Break ends → stop + notify | Task 1, interval completion handler |
| Timestamp-based countdown | Task 1, `targetEndRef` + `Date.now()` diff |
| Completion chime | Task 1, `playChime()` |
| Force-focus notification `requireInteraction: true` | Task 1 (break end), Task 4 (notify default confirmed) |
| Focus-end notification `requireInteraction: false` | Task 1, `notify(..., { requireInteraction: false })` |
| Task deleted mid-session fallback | Task 3, `useEffect` watching `incompleteTasks` |
| Preset disabled while running | Task 3, `disabled={running}` on chips |
| `estimated_duration > 90m` clamp | Existing clamp in `setFocusMinutes()` (unchanged) |

All requirements covered. No placeholders found.

**Type consistency check:**
- `suggestBreak` exported from context, imported in component ✓
- `PRESETS` typed as `const` array with `label`, `focus`, `break` fields ✓
- `data-testid` attributes match test queries exactly ✓
- `TaskContext` used as named import in test — confirmed exported in Step 2 of Task 3 ✓
