import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpotifyPlayer } from '@/components/SpotifyPlayer';
import * as React from 'react';

// Mock matchMedia to fix Radix UI Popover errors in testing
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
});

// Mock environment variables
vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', 'test-client-id');
vi.stubEnv('VITE_SPOTIFY_REDIRECT_URI', 'http://localhost/callback');

describe('SpotifyPlayer component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders a floating music button when not connected', () => {
    render(<SpotifyPlayer />);
    
    // Find the trigger button (which has a Music icon)
    const trigger = screen.getByRole('button');
    expect(trigger).toBeInTheDocument();
    expect(trigger.className).toContain('fixed bottom-6 right-6'); // Floating position
  });

  it('opens popover showing connect message when not authenticated', async () => {
    render(<SpotifyPlayer />);
    
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    
    // Wait for popover content to appear
    const popoverTitle = await screen.findByText('Spotify');
    expect(popoverTitle).toBeInTheDocument();
    
    const connectMsg = screen.getByText('Connect your Spotify account to control music playback while you work.');
    expect(connectMsg).toBeInTheDocument();

    const connectButton = screen.getByRole('button', { name: /connect spotify/i });
    expect(connectButton).toBeInTheDocument();
  });

  it('redirects to Spotify auth when Connect is clicked', async () => {
    // Mock window.location
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    render(<SpotifyPlayer />);
    
    // Open popover
    fireEvent.click(screen.getByRole('button'));
    
    // Click connect
    const connectBtn = await screen.findByRole('button', { name: /connect spotify/i });
    fireEvent.click(connectBtn);

    // Verify redirect
    expect(window.location.href).toContain('https://accounts.spotify.com/authorize');
    expect(window.location.href).toContain('client_id=test-client-id');

    // Restore window.location
    window.location = originalLocation as any;
  });

  it('shows no active device message when authenticated but no device', async () => {
    // Mock local storage token
    localStorage.setItem('spotify_access_token', 'mock-token-123');

    // Mock fetch for player state (returning 204 No Content for no device)
    global.fetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true
    });

    render(<SpotifyPlayer />);
        
    // In useEffect it fetches player state, wait for it
    // Then click the popover trigger
    const trigger = await screen.findByRole('button');
    fireEvent.click(trigger);

    const title = await screen.findByText('Spotify Connected');
    expect(title).toBeInTheDocument();
    
    const noDeviceMsg = screen.getByText('No active playback device. Open Spotify on your device and start playing.');
    expect(noDeviceMsg).toBeInTheDocument();
  });
});
