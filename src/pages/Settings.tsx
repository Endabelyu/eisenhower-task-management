import { useEffect, useState } from 'react';
import { Palette, Settings as SettingsIcon, Globe, Blocks } from 'lucide-react';
import { DataManagement } from '@/components/DataManagement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const { isSpotifyEnabled, setSpotifyEnabled } = useSpotify();
  const [palette, setPalette] = useState<ColorPalette>('ocean');

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

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">{t('settings.title' as any)}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('settings.appearance' as any)}</p>
      </div>

      <section className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t('settings.appearance' as any)}</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('settings.theme' as any)}
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

      <section className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t('settings.language' as any)}</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose your preferred language / Pilih bahasa pilihan Anda.
        </p>

        <div className="max-w-xs">
          <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">{t('settings.language.id' as any)}</SelectItem>
              <SelectItem value="en">{t('settings.language.en' as any)}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Blocks className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t('settings.integrations' as any)}</h2>
        </div>
        
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Label className="text-base">{t('settings.spotify.enable' as any)}</Label>
            <p className="text-sm text-muted-foreground">
              {t('settings.spotify.desc' as any)}
            </p>
            <p className="text-sm text-destructive font-medium flex gap-1">
              <span>*</span><span>{t('settings.spotify.req' as any)}</span>
            </p>
          </div>
          <Switch
            checked={isSpotifyEnabled}
            onCheckedChange={setSpotifyEnabled}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold mb-1">Data</h2>
        <p className="text-sm text-muted-foreground mb-4">Export/Import</p>
        <DataManagement />
      </section>
    </div>
  );
}
