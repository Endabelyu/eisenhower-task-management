import { useMemo } from 'react';
import { Bell, BellOff, Pause, Play, RotateCcw, Timer, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePomodoro, AMBIENCE_SOUNDS, formatTime } from '@/context/PomodoroContext';
import { useLanguage } from '@/context/LanguageContext';
import { getNotificationPermission } from '@/lib/notifications';

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
    totalSeconds
  } = usePomodoro();

  const { t } = useLanguage();

  const modeLabel = useMemo(
    () =>
      mode === 'focus'
        ? t('pomodoro.focus')
        : t('pomodoro.break'),
    [mode, t],
  );

  const notifPermission = getNotificationPermission();
  const notifActive = notificationsEnabled && notifPermission === 'granted';

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Timer className="h-5 w-5 text-status-in-progress" />
        <h2 className="font-display text-lg font-semibold">{t('pomodoro.title')}</h2>

        {/* Notification status indicator */}
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

      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === 'focus' ? 'default' : 'outline'}
          onClick={() => setSessionMode('focus')}
        >
          {t('pomodoro.mode.focus', { n: focusMinutes })}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'break' ? 'default' : 'outline'}
          onClick={() => setSessionMode('break')}
        >
          {t('pomodoro.mode.break', { n: breakMinutes })}
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
          {running ? t('pomodoro.pause') : t('pomodoro.start')}
        </Button>
        <Button type="button" variant="outline" onClick={resetTimer} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          {t('pomodoro.reset')}
        </Button>
      </div>

      {/* Ambience Player Section */}
      <div className="mt-4 border-t pt-4">
        <div className="mb-3 flex items-center gap-2">
          {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <span className="text-sm font-medium">{t('pomodoro.sound.label')}</span>
        </div>

        <div className="space-y-3">
          <Select
            value={ambience}
            onValueChange={(val: any) => setAmbience(val)}
          >
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
