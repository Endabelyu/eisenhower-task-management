import { useEffect, useRef, useState, useCallback } from 'react';
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, LogOut, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSpotify } from '@/context/SpotifyContext';

type PlayerStatus = 'disconnected' | 'loading' | 'ready' | 'error';

const SDK_SCRIPT_URL = 'https://sdk.scdn.co/spotify-player.js';
const PLAYER_NAME = 'Quadrant Calm';

/** Load the Spotify Web Playback SDK script once */
function loadSpotifySDK(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    if (document.querySelector(`script[src="${SDK_SCRIPT_URL}"]`)) {
      // Script is loading — wait for SDK ready callback
      const prev = window.onSpotifyWebPlaybackSDKReady;
      window.onSpotifyWebPlaybackSDKReady = () => {
        prev?.();
        resolve();
      };
      return;
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement('script');
    script.src = SDK_SCRIPT_URL;
    script.async = true;
    document.body.appendChild(script);
  });
}

/**
 * Spotify Web Playback SDK Integration
 *
 * This component creates a Spotify player device directly in the browser.
 * Requires Spotify Premium.
 */
export function SpotifyPlayer() {
  const { accessToken, isAuthenticated, login, logout, getValidToken, isSpotifyEnabled } = useSpotify();

  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  const [status, setStatus] = useState<PlayerStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<Spotify.WebPlaybackState | null>(null);
  const [volume, setVolumeState] = useState(0.5);

  // Initialize SDK and player when authenticated
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    let player: Spotify.Player;

    const init = async () => {
      setStatus('loading');
      try {
        await loadSpotifySDK();
      } catch {
        setStatus('error');
        setErrorMessage('Failed to load Spotify SDK');
        return;
      }

      player = new window.Spotify.Player({
        name: PLAYER_NAME,
        getOAuthToken: async (cb) => {
          const token = await getValidToken();
          if (token) cb(token);
        },
        volume: 0.5,
        enableMediaSession: true,
      });

      // Ready — get device_id and transfer playback
      player.addListener('ready', async ({ device_id }) => {
        deviceIdRef.current = device_id;
        setStatus('ready');

        // Transfer playback to this browser tab
        const token = await getValidToken();
        if (!token) return;
        await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ device_ids: [device_id], play: false }),
        });
      });

      player.addListener('not_ready', () => {
        deviceIdRef.current = null;
        setStatus('loading');
      });

      // Real-time track/pause state updates via event — no polling!
      player.addListener('player_state_changed', (state) => {
        setPlaybackState(state);
        if (state) {
          player.getVolume().then((v) => setVolumeState(v));
        }
      });

      player.addListener('autoplay_failed', () => {
        // User needs to interact — we handle this gracefully
      });

      // Error handlers
      player.addListener('initialization_error', ({ message }) => {
        setStatus('error');
        setErrorMessage(`Init error: ${message}`);
      });
      player.addListener('authentication_error', ({ message }) => {
        setStatus('error');
        setErrorMessage(`Auth error: ${message}`);
        logout();
      });
      player.addListener('account_error', ({ message }) => {
        setStatus('error');
        setErrorMessage(message.includes('premium')
          ? 'Spotify Premium is required for in-browser playback'
          : `Account error: ${message}`);
      });
      player.addListener('playback_error', ({ message }) => {
        console.warn('Playback error:', message);
      });

      await player.connect();
      playerRef.current = player;
    };

    init();

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [isAuthenticated, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Playback controls — use SDK directly, no API calls needed
  const togglePlay = useCallback(async () => {
    if (!playerRef.current) return;
    // activateElement required on some browsers for autoplay policy
    await playerRef.current.activateElement().catch(() => {});
    await playerRef.current.togglePlay();
  }, []);

  const skipNext = useCallback(() => playerRef.current?.nextTrack(), []);
  const skipPrev = useCallback(() => playerRef.current?.previousTrack(), []);

  const handleVolumeChange = useCallback((vals: number[]) => {
    const v = vals[0] / 100;
    setVolumeState(v);
    playerRef.current?.setVolume(v);
  }, []);

  // Handle logout — also disconnect the SDK player
  const handleLogout = useCallback(() => {
    playerRef.current?.disconnect();
    playerRef.current = null;
    logout();
  }, [logout]);

  // If disabled in settings, render nothing (but hooks have already fired)
  if (!isSpotifyEnabled) {
    return null;
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg bg-green-500 hover:bg-green-600 transition-all hover:scale-105 z-50 text-white"
            aria-label="Open Spotify"
          >
            <Music className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-5 mb-2 mr-6 shadow-lg rounded-xl" side="top" align="end">
          <div className="flex items-center gap-2 mb-3">
            <Music className="h-5 w-5 text-green-500" />
            <h3 className="font-display text-lg font-semibold">Spotify</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Connect Spotify to play music directly in your browser.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            ⚠️ Requires a Spotify Premium account.
          </p>
          <Button onClick={login} className="w-full gap-2 bg-green-500 hover:bg-green-600">
            <Music className="h-4 w-4" />
            Connect Spotify
          </Button>
        </PopoverContent>
      </Popover>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg bg-red-500 hover:bg-red-600 transition-all z-50 text-white"
            aria-label="Spotify error"
          >
            <AlertCircle className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-5 mb-2 mr-6 shadow-lg rounded-xl" side="top" align="end">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-display text-base font-semibold">Spotify Error</h3>
            </div>
            <Button size="icon" variant="ghost" onClick={handleLogout} className="h-7 w-7 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </PopoverContent>
      </Popover>
    );
  }

  // ── Loading / Connecting ───────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <Button
        size="icon"
        disabled
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg bg-green-500/70 z-50 text-white cursor-wait"
        aria-label="Connecting to Spotify..."
      >
        <Music className="h-6 w-6 animate-pulse" />
      </Button>
    );
  }

  // ── Ready — player connected ───────────────────────────────────────────────
  const track = playbackState?.track_window?.current_track ?? null;
  const isPaused = playbackState?.paused ?? true;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className={`fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105 z-50 overflow-hidden border-2 ${!isPaused ? 'border-green-500' : 'border-transparent bg-card'}`}
          aria-label={track ? `Now playing: ${track.name}` : 'Spotify Player'}
        >
          {track?.album?.images?.[0]?.url ? (
            <img
              src={track.album.images[0].url}
              alt="Album art"
              className="h-full w-full object-cover"
            />
          ) : (
            <Music className="h-6 w-6 text-green-500" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-5 mb-2 mr-6 shadow-lg rounded-xl" side="top" align="end">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-green-500" />
            <h3 className="font-display text-base font-semibold">
              {track ? (isPaused ? 'Paused' : 'Now Playing') : 'Spotify Ready'}
            </h3>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleLogout}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            aria-label="Disconnect Spotify"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* No track playing yet */}
        {!track && (
          <p className="text-sm text-muted-foreground mb-4">
            This browser tab is now a Spotify device. Hit play in Spotify or use the controls below.
          </p>
        )}

        {/* Track info */}
        {track && (
          <div className="flex gap-3 mb-4">
            {track.album.images[0] && (
              <img
                src={track.album.images[0].url}
                alt={track.album.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="font-medium text-sm truncate">{track.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {track.artists.map((a) => a.name).join(', ')}
              </p>
              <p className="text-xs text-muted-foreground truncate opacity-70">{track.album.name}</p>
            </div>
          </div>
        )}

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button size="sm" variant="outline" onClick={skipPrev} aria-label="Previous">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="default" onClick={togglePlay} className="gap-1 px-5" aria-label={isPaused ? 'Play' : 'Pause'}>
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
          <Button size="sm" variant="outline" onClick={skipNext} aria-label="Next">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Slider
            value={[Math.round(volume * 100)]}
            onValueChange={handleVolumeChange}
            max={100}
            step={5}
            className="flex-1"
            aria-label="Volume"
          />
          <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
