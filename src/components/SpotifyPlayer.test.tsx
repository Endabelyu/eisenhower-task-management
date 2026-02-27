import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpotifyPlayer } from '@/components/SpotifyPlayer';
import { SpotifyProvider } from '@/context/SpotifyContext';

// Mock matchMedia to fix Radix UI Popover errors in testing
Object.defineProperty(window, "matchMedia", {
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
  }))
});

// Mock environment variables
vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', 'test-client-id');
vi.stubEnv('VITE_SPOTIFY_REDIRECT_URI', 'http://localhost/callback');

const renderWithProvider = () => {
  return render(
    <SpotifyProvider>
      <SpotifyPlayer />
    </SpotifyProvider>
  );
};

describe('SpotifyPlayer component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders a floating music button when not connected', () => {
    renderWithProvider();
    
    const trigger = screen.getByRole('button');
    expect(trigger).toBeInTheDocument();
    expect(trigger.className).toContain('fixed bottom-6 right-6');
  });

  it('opens popover showing connect message when not authenticated', async () => {
    renderWithProvider();
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    const popoverTitle = await screen.findByText('Spotify');
    expect(popoverTitle).toBeInTheDocument();
    
    const connectMsg = screen.getByText('Connect your Spotify account to control music playback while you work.');
    expect(connectMsg).toBeInTheDocument();

    const connectButton = screen.getByRole('button', { name: /connect spotify/i });
    expect(connectButton).toBeInTheDocument();
  });

  it('redirects to Spotify auth when Connect is clicked', async () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    // Mock crypto.subtle for PKCE
    Object.defineProperty(window, 'crypto', {
      value: {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
          return arr;
        },
        subtle: {
          digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        },
      },
      writable: true,
    });

    renderWithProvider();
    
    fireEvent.click(screen.getByRole('button'));
    
    const connectBtn = await screen.findByRole('button', { name: /connect spotify/i });
    fireEvent.click(connectBtn);

    // Allow async PKCE generation to complete
    await vi.waitFor(() => {
      expect(window.location.href).toContain('https://accounts.spotify.com/authorize');
    });
    expect(window.location.href).toContain('client_id=test-client-id');

    window.location = originalLocation as any;
  });

  it('shows no active device message when authenticated but no device', async () => {
    localStorage.setItem('spotify_access_token', 'mock-token-123');
    // Set a far-future expiry so token is considered valid
    localStorage.setItem('spotify_token_expiry', String(Date.now() + 3600000));

    global.fetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true
    });

    renderWithProvider();
        
    const trigger = await screen.findByRole('button');
    fireEvent.click(trigger);

    const title = await screen.findByText('Spotify Connected');
    expect(title).toBeInTheDocument();
    
    const noDeviceMsg = screen.getByText('No active playback device. Open Spotify on your device and start playing.');
    expect(noDeviceMsg).toBeInTheDocument();
  });
});
