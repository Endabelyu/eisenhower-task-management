import { useEffect, useState } from 'react';
import { Palette, Settings as SettingsIcon } from 'lucide-react';
import { DataManagement } from '@/components/DataManagement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  applyColorPalette,
  COLOR_PALETTES,
  COLOR_PALETTE_STORAGE_KEY,
  getStoredColorPalette,
  type ColorPalette,
} from '@/lib/color-palette';

export default function Settings() {
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
          <h1 className="font-display text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage your data and preferences</p>
      </div>

      <section className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Visual Comfort Theme</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose the palette that feels most comfortable for long planning sessions.
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

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold mb-1">Data Management</h2>
        <p className="text-sm text-muted-foreground mb-4">Export, import, or clear your task data</p>
        <DataManagement />
      </section>
    </div>
  );
}
