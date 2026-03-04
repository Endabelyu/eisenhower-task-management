import { useEffect, useState } from 'react';
import { Bell, Blocks, Globe, Palette, Settings as SettingsIcon, Timer, User, LogOut, MessageSquare } from 'lucide-react';
import { DataManagement } from '@/components/DataManagement';
import { FeedbackForm } from '@/components/FeedbackForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  applyColorPalette,
  COLOR_PALETTES,
  COLOR_PALETTE_STORAGE_KEY,
  getStoredColorPalette,
  type ColorPalette,
} from '@/lib/color-palette';

import { useLanguage } from '@/context/LanguageContext';
import { type Language } from '@/i18n/dictionaries';
import { useSpotify } from '@/context/SpotifyContext';
import { useAuth } from '@/context/AuthContext';
import { usePomodoro } from '@/context/PomodoroContext';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const { isSpotifyEnabled, setSpotifyEnabled } = useSpotify();
  const { user } = useAuth();
  const {
    focusMinutes,
    breakMinutes,
    notificationsEnabled,
    setFocusMinutes,
    setBreakMinutes,
    setNotificationsEnabled,
  } = usePomodoro();

  const [palette, setPalette] = useState<ColorPalette>('ocean');
  const [focusInput, setFocusInput] = useState<string>(String(focusMinutes));
  const [breakInput, setBreakInput] = useState<string>(String(breakMinutes));

  // Keep local input state in sync with context (e.g. after reset)
  useEffect(() => setFocusInput(String(focusMinutes)), [focusMinutes]);
  useEffect(() => setBreakInput(String(breakMinutes)), [breakMinutes]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    setPalette(getStoredColorPalette());
  }, []);

  const handlePaletteChange = (value: string) => {
    const nextPalette = value as ColorPalette;
    setPalette(nextPalette);
    applyColorPalette(nextPalette);
    localStorage.setItem(COLOR_PALETTE_STORAGE_KEY, nextPalette);
  };

  const activePalette = COLOR_PALETTES.find((item) => item.value === palette);

  const handleFocusBlur = () => {
    const parsed = parseInt(focusInput, 10);
    if (!isNaN(parsed)) setFocusMinutes(parsed);
    else setFocusInput(String(focusMinutes));
  };

  const handleBreakBlur = () => {
    const parsed = parseInt(breakInput, 10);
    if (!isNaN(parsed)) setBreakMinutes(parsed);
    else setBreakInput(String(breakMinutes));
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">{t('settings.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('settings.appearance')}</p>
      </div>

      {/* Account Section */}
      <section className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t('settings.account')}</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('settings.account.desc')}
        </p>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Label className="text-base">{user?.user_metadata?.full_name || 'My Account'}</Label>
            <p className="text-sm text-muted-foreground">
              {user?.email || 'Unknown user'}
            </p>
          </div>
          <Button variant="destructive" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            {t('settings.account.logout')}
          </Button>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t('settings.appearance')}</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('settings.theme')}
        </p>

        <div className="max-w-xs">
          <Select value={palette} onValueChange={handlePaletteChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a comfort theme" />
            </SelectTrigger>
            <SelectContent>
              {COLOR_PALETTES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activePalette && (
          <p className="mt-3 text-sm text-muted-foreground">{activePalette.description}</p>
        )}
      </section>

      {/* Language Section */}
      <section className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t('settings.language')}</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('settings.language.desc')}
        </p>

        <div className="max-w-xs">
          <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">{t('settings.language.id')}</SelectItem>
              <SelectItem value="en">{t('settings.language.en')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Pomodoro Settings Section */}
      <section className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t('settings.pomodoro')}</h2>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          {t('settings.pomodoro.desc')}
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Focus Duration */}
          <div className="space-y-2">
            <Label htmlFor="focus-duration">{t('settings.pomodoro.focus')}</Label>
            <Input
              id="focus-duration"
              type="number"
              min={1}
              max={90}
              value={focusInput}
              onChange={(e) => setFocusInput(e.target.value)}
              onBlur={handleFocusBlur}
              className="max-w-[120px]"
            />
            <p className="text-xs text-muted-foreground">{t('settings.pomodoro.focus.hint')}</p>
          </div>

          {/* Break Duration */}
          <div className="space-y-2">
            <Label htmlFor="break-duration">{t('settings.pomodoro.break')}</Label>
            <Input
              id="break-duration"
              type="number"
              min={1}
              max={30}
              value={breakInput}
              onChange={(e) => setBreakInput(e.target.value)}
              onBlur={handleBreakBlur}
              className="max-w-[120px]"
            />
            <p className="text-xs text-muted-foreground">{t('settings.pomodoro.break.hint')}</p>
          </div>
        </div>

        {/* Notifications Toggle */}
        <div className="mt-6 flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              {t('settings.notifications.enable')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('settings.notifications.desc')}
            </p>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>
      </section>

      {/* Integrations Section */}
      <section className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Blocks className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t('settings.integrations')}</h2>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Label className="text-base">{t('settings.spotify.enable')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('settings.spotify.desc')}
            </p>
            <p className="text-sm text-destructive font-medium flex gap-1">
              <span>*</span><span>{t('settings.spotify.req')}</span>
            </p>
          </div>
          <Switch
            checked={isSpotifyEnabled}
            onCheckedChange={setSpotifyEnabled}
          />
        </div>
      </section>

      {/* Feedback Section */}
      <section className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t('settings.feedback.title')}</h2>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          {t('settings.feedback.desc')}
        </p>
        <FeedbackForm />
      </section>

      {/* Data Section */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold mb-1">{t('settings.data')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('settings.data.subtitle')}</p>
        <DataManagement />
      </section>
    </div>
  );
}
