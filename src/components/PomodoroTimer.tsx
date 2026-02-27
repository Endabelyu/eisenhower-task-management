import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw, Timer, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

const formatTime = (seconds: number) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainingSeconds = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

const AMBIENCE_SOUNDS = {
  none: { label: 'None', url: null },
  rain: { label: '🌧️ Rain', url: '/sounds/rain.mp3' },
  cafe: { label: '☕ Cafe', url: '/sounds/cafe.mp3' },
  whitenoise: { label: '🌊 White Noise', url: '/sounds/whitenoise.mp3' },
  forest: { label: '🌲 Forest', url: '/sounds/forest.mp3' },
} as const;

type AmbienceType = keyof typeof AMBIENCE_SOUNDS;

/**
 * Lightweight Pomodoro timer with 25-minute focus and 5-minute break cycles.
 */
export function PomodoroTimer() {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [ambience, setAmbience] = useState<AmbienceType>('none');
  const [volume, setVolume] = useState(30);
  const [audio] = useState(() => new Audio());
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!running) {
      document.title = 'Daily Focus - Eisenhower Matrix';
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
      document.title = 'Daily Focus - Eisenhower Matrix';
    };
  }, [mode, running]);

  useEffect(() => {
    const sound = AMBIENCE_SOUNDS[ambience];
    
    if (!sound.url) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.src = sound.url;
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
    };
  }, [ambience, running, audio]);

  useEffect(() => {
    audio.volume = volume / 100;
  }, [volume, audio]);

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
      
      {/* Circular Progress Indicator */}
      <div className="relative my-6 flex items-center justify-center">
        <svg className="h-48 w-48 -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 88}`}
            strokeDashoffset={`${2 * Math.PI * 88 * (1 - ((totalSeconds - secondsLeft) / totalSeconds))}`}
            className={mode === 'focus' ? 'text-status-in-progress' : 'text-quadrant-schedule'}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        
        {/* Time display in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-5xl font-bold tabular-nums">{formatTime(secondsLeft)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100)}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={toggleTimer} className="gap-2">
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? 'Pause' : 'Start'}
        </Button>
        <Button type="button" variant="outline" onClick={resetTimer} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Ambience Player Section */}
      <div className="mt-4 border-t pt-4">
        <div className="mb-3 flex items-center gap-2">
          {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <span className="text-sm font-medium">Background Sound</span>
        </div>
        
        <div className="space-y-3">
          <Select 
            value={ambience} 
            onValueChange={(val) => setAmbience(val as AmbienceType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ambience" />
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
                max={100}
                step={5}
                className="flex-1"
              />
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <span className="w-10 text-sm tabular-nums text-muted-foreground">
                {volume}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
