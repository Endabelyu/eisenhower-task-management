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
  useEffect(() => { focusSecondsRef.current = focusMinutes * 60; }, [focusMinutes]);
  useEffect(() => { breakSecondsRef.current = breakMinutes * 60; }, [breakMinutes]);
  useEffect(() => { notificationsEnabledRef.current = notificationsEnabled; }, [notificationsEnabled]);

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
