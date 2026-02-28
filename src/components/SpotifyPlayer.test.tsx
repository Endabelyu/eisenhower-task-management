import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpotifyPlayer } from '@/components/SpotifyPlayer';
import { SpotifyProvider } from '@/context/SpotifyContext';

// Mock matchMedia (required by Radix UI Popover)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock the Spotify Web Playback SDK
const mockPlayer = {
  connect: vi.fn().mockResolvedValue(true),
  disconnect: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  getCurrentState: vi.fn().mockResolvedValue(null),
  togglePlay: vi.fn().mockResolvedValue(undefined),
  nextTrack: vi.fn().mockResolvedValue(undefined),
  previousTrack: vi.fn().mockResolvedValue(undefined),
  setVolume: vi.fn().mockResolvedValue(undefined),
  getVolume: vi.fn().mockResolvedValue(0.5),
  activateElement: vi.fn().mockResolvedValue(undefined),
  setName: vi.fn().mockResolvedValue(undefined),
  seek: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn().mockResolvedValue(undefined),
  resume: vi.fn().mockResolvedValue(undefined),
};

vi.stubGlobal('Spotify', { Player: vi.fn(() => mockPlayer) });

vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', 'test-client-id');
vi.stubEnv('VITE_SPOTIFY_REDIRECT_URI', 'http://localhost/callback');

const renderWithProvider = () =>
  render(
    <SpotifyProvider>
      <SpotifyPlayer />
    </SpotifyProvider>
  );

describe('SpotifyPlayer component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('spotify_integration_enabled', 'true');
    vi.clearAllMocks();
  });

  it('renders a floating music button', () => {
    renderWithProvider();
    const trigger = screen.getByRole('button', { name: /open spotify/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger.className).toContain('shrink-0 rounded-full');
  });

  it('shows Connect Spotify button when not authenticated', async () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole('button', { name: /open spotify/i }));
    expect(await screen.findByRole('button', { name: /connect spotify/i })).toBeInTheDocument();
  });

  it('shows Premium notice in the connect popover', async () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole('button', { name: /open spotify/i }));
    expect(await screen.findByText(/requires a spotify premium/i)).toBeInTheDocument();
  });

  it('redirects to Spotify auth when Connect is clicked', async () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    Object.defineProperty(window, 'crypto', {
      value: {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
          return arr;
        },
        subtle: { digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)) },
      },
      writable: true,
    });

    renderWithProvider();
    fireEvent.click(screen.getByRole('button', { name: /open spotify/i }));
    const connectBtn = await screen.findByRole('button', { name: /connect spotify/i });
    fireEvent.click(connectBtn);

    await vi.waitFor(() => {
      expect(window.location.href).toContain('https://accounts.spotify.com/authorize');
    });

    window.location = originalLocation as any;
  });
});
