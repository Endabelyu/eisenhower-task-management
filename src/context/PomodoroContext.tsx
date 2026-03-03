import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  const [secondsLeft, setSecondsLeft] = useState(() => loadNumber('pomodoro_focus_minutes', DEFAULT_FOCUS_MINUTES) * 60);
  const [running, setRunning] = useState(false);
  const [ambience, setAmbience] = useState<AmbienceType>('none');
  const [volume, setVolume] = useState(30);
  const [audio] = useState(() => new window.Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('pomodoro_notifications_enabled') !== 'false';
  });

  const focusSeconds = focusMinutes * 60;
  const breakSeconds = breakMinutes * 60;

  useEffect(() => {
    if (!running) {
      document.title = 'Eisenhower Matrix';
      return;
    }

    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) {
          const timeStr = formatTime(current - 1);
          const emoji = mode === 'focus' ? '⏱️' : '☕';
          const modeText = mode === 'focus' ? 'Focus' : 'Break';
          document.title = `${emoji} ${timeStr} - ${modeText}`;
          return current - 1;
        }

        document.title = `✅ ${mode === 'focus' ? 'Focus' : 'Break'} Complete!`;

        if (notificationsEnabled) {
          const notificationTitle = mode === 'focus' ? 'Focus Session Complete!' : 'Break Complete!';
          const notificationBody =
            mode === 'focus' ? "Time's up! Take a break." : 'Break is over! Ready to focus?';
          notify(notificationTitle, notificationBody);
        }

        const nextMode = mode === 'focus' ? 'break' : 'focus';
        setMode(nextMode);
        setRunning(false);
        return nextMode === 'focus' ? focusSeconds : breakSeconds;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
      document.title = 'Eisenhower Matrix';
    };
  }, [mode, running, notificationsEnabled, focusSeconds, breakSeconds]);

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
        .catch((err) => {
          console.warn('Audio playback prevented:', err);
          setIsPlaying(false);
        });
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
    setMode(nextMode);
    setRunning(false);
    setSecondsLeft(nextMode === 'focus' ? focusSeconds : breakSeconds);
  };

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft(mode === 'focus' ? focusSeconds : breakSeconds);
  };

  const toggleTimer = async () => {
    if (!running && notificationsEnabled) {
      await requestNotificationPermission();
    }
    setRunning((prev) => !prev);
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
