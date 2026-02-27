export type ColorPalette = 'ocean' | 'forest' | 'warm';

export const COLOR_PALETTE_STORAGE_KEY = 'eisenhower-color-palette';
export const DEFAULT_COLOR_PALETTE: ColorPalette = 'ocean';

export const COLOR_PALETTES: Array<{
  value: ColorPalette;
  label: string;
  description: string;
}> = [
  {
    value: 'ocean',
    label: 'Ocean Calm',
    description: 'Cool blue-green tones for low visual fatigue over long sessions.',
  },
  {
    value: 'forest',
    label: 'Soft Forest',
    description: 'Natural green and slate colors for a grounded, focused workspace.',
  },
  {
    value: 'warm',
    label: 'Warm Paper',
    description: 'Gentle sand and sage tones inspired by notebook-style planning.',
  },
];

const isColorPalette = (value: string): value is ColorPalette => {
  return COLOR_PALETTES.some((palette) => palette.value === value);
};

export const getStoredColorPalette = (): ColorPalette => {
  const stored = localStorage.getItem(COLOR_PALETTE_STORAGE_KEY);
  if (!stored) return DEFAULT_COLOR_PALETTE;
  return isColorPalette(stored) ? stored : DEFAULT_COLOR_PALETTE;
};

export const applyColorPalette = (palette: ColorPalette) => {
  document.documentElement.setAttribute('data-palette', palette);
};
