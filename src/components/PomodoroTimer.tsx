import { useMemo, useState, useEffect } from 'react';
import { Bell, BellOff, Pause, Play, RotateCcw, Timer, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePomodoro, AMBIENCE_SOUNDS, AmbienceType, formatTime, PRESETS, suggestBreak } from '@/context/PomodoroContext';
import { useLanguage } from '@/context/LanguageContext';
import { getNotificationPermission } from '@/lib/notifications';
import { useTaskContext } from '@/context/TaskContext';

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
  const { tasks } = useTaskContext();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const incompleteTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed'),
    [tasks]
  );

  // Clear selectedTaskId if the linked task gets deleted or completed
  useEffect(() => {
    if (selectedTaskId && !incompleteTasks.find((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [incompleteTasks, selectedTaskId]);

  const modeLabel = useMemo(
    () => (mode === 'focus' ? t('pomodoro.focus') : t('pomodoro.break')),
    [mode, t]
  );

  const notifPermission = getNotificationPermission();
  const notifActive = notificationsEnabled && notifPermission === 'granted';

  function handleFocusChange(value: string) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 90) {
      setFocusMinutes(parsed);
      const isPreset = PRESETS.some((p) => p.focus === parsed);
      if (!isPreset) {
        setBreakMinutes(suggestBreak(parsed));
      }
      setSelectedTaskId(null);
    }
  }

  function handleBreakChange(value: string) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
      setBreakMinutes(parsed);
    }
  }

  function applyPreset(focus: number, breakMin: number) {
    if (running) return;
    setFocusMinutes(focus);
    setBreakMinutes(breakMin);
    setSelectedTaskId(null);
  }

  function handleTaskSelect(taskId: string) {
    if (taskId === 'none') {
      setSelectedTaskId(null);
      return;
    }
    const task = incompleteTasks.find((task) => task.id === taskId);
    if (!task) return;
    setSelectedTaskId(taskId);
    setFocusMinutes(task.estimatedDuration);
    const isPreset = PRESETS.some((p) => p.focus === task.estimatedDuration);
    if (!isPreset) {
      setBreakMinutes(suggestBreak(task.estimatedDuration));
    }
  }

  const selectedTask = incompleteTasks.find((task) => task.id === selectedTaskId);

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
          <p className="mt-1 truncate text-xs text-muted-foreground">
            Fokus: {selectedTask.title}
          </p>
        )}
      </div>

      {/* Mode Buttons with always-visible inline inputs */}
      <div className="mb-2 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === 'focus' ? 'default' : 'outline'}
          onClick={() => setSessionMode('focus')}
          data-testid="mode-focus"
          className="gap-1"
        >
          Focus
          <input
            data-testid="focus-minutes-input"
            type="number"
            min={1}
            max={90}
            value={focusMinutes}
            disabled={running}
            className="w-10 rounded border-0 bg-transparent px-0.5 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFocusChange(e.target.value)}
            onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.stopPropagation()}
          />
          m
        </Button>

        <Button
          type="button"
          size="sm"
          variant={mode === 'break' ? 'default' : 'outline'}
          onClick={() => setSessionMode('break')}
          data-testid="mode-break"
          className="gap-1"
        >
          Break
          <input
            data-testid="break-minutes-input"
            type="number"
            min={1}
            max={30}
            value={breakMinutes}
            disabled={running}
            className="w-10 rounded border-0 bg-transparent px-0.5 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBreakChange(e.target.value)}
            onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.stopPropagation()}
          />
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
