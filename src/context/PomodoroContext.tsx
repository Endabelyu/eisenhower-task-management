import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export const FOCUS_SECONDS = 25 * 60;
export const BREAK_SECONDS = 5 * 60;

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
  setSessionMode: (mode: 'focus' | 'break') => void;
  resetTimer: () => void;
  toggleTimer: () => Promise<void>;
  setAmbience: (ambience: AmbienceType) => void;
  setVolume: (volume: number) => void;
  totalSeconds: number;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [ambience, setAmbience] = useState<AmbienceType>('none');
  const [volume, setVolume] = useState(30);
  const [audio] = useState(() => new window.Audio());
  const [isPlaying, setIsPlaying] = useState(false);

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
        
        if ('Notification' in window && Notification.permission === 'granted') {
          const notificationTitle = mode === 'focus' ? 'Focus Session Complete!' : 'Break Complete!';
          const notificationBody = mode === 'focus' 
            ? "Time's up! Take a break." 
            : "Break is over! Ready to focus?";
            
          const notification = new Notification(notificationTitle, {
            body: notificationBody,
            requireInteraction: true,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }

        const nextMode = mode === 'focus' ? 'break' : 'focus';
        setMode(nextMode);
        setRunning(false);
        return nextMode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
      document.title = 'Eisenhower Matrix';
    };
  }, [mode, running]);

  useEffect(() => {
    const sound = AMBIENCE_SOUNDS[ambience];
    
    if (!sound.url) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    // Only update src if it changed to avoid reloading the same audio
    if (!audio.src.endsWith(sound.url)) {
      audio.src = sound.url;
      audio.load();
    }
    
    audio.loop = true;
    audio.volume = volume / 100;

    // Play only when the timer is running
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
  }, [ambience, running, audio]);

  useEffect(() => {
    audio.volume = volume / 100;
  }, [volume, audio]);

  const setSessionMode = (nextMode: 'focus' | 'break') => {
    setMode(nextMode);
    setRunning(false);
    setSecondsLeft(nextMode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft(mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const toggleTimer = async () => {
    if (!running) {
      await requestNotificationPermission();
    }
    setRunning((prev) => !prev);
  };

  const totalSeconds = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        secondsLeft,
        running,
        ambience,
        volume,
        isPlaying,
        setSessionMode,
        resetTimer,
        toggleTimer,
        setAmbience,
        setVolume,
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
