import { useEffect, useState } from 'react';
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Spotify API configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:5173/callback';
const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

interface SpotifyPlaybackState {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number;
  device: {
    volume_percent: number;
  } | null;
}

/**
 * Spotify Integration Component
 * 
 * SETUP REQUIRED:
 * 1. Create Spotify Developer App at https://developer.spotify.com/dashboard
 * 2. Add redirect URI to your Spotify app settings
 * 3. Add environment variables:
 *    VITE_SPOTIFY_CLIENT_ID=your_client_id
 *    VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
 * 4. Implement callback route to handle auth code
 */
export function SpotifyPlayer() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for access token in localStorage
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      setAccessToken(token);
    }
  }, []);

  // Poll playback state every 5 seconds when connected
  useEffect(() => {
    if (!accessToken) return;

    const fetchPlaybackState = async () => {
      try {
        const response = await fetch('https://api.spotify.com/v1/me/player', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 204) {
          // No active device
          setPlaybackState(null);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setPlaybackState(data);
        } else if (response.status === 401) {
          // Token expired
          localStorage.removeItem('spotify_access_token');
          setAccessToken(null);
        }
      } catch (error) {
        console.error('Failed to fetch playback state:', error);
      }
    };

    fetchPlaybackState();
    const interval = setInterval(fetchPlaybackState, 5000);

    return () => clearInterval(interval);
  }, [accessToken]);

  // Generate Spotify authorization URL
  const handleLogin = () => {
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
    authUrl.searchParams.append('scope', SPOTIFY_SCOPES);
    
    window.location.href = authUrl.toString();
  };

  // Spotify API helper
  const spotifyRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok && response.status === 401) {
        localStorage.removeItem('spotify_access_token');
        setAccessToken(null);
      }

      return response;
    } catch (error) {
      console.error('Spotify API error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Playback controls
  const togglePlayPause = () => {
    if (!playbackState) return;
    const endpoint = playbackState.is_playing ? '/me/player/pause' : '/me/player/play';
    spotifyRequest(endpoint, 'PUT');
  };

  const skipNext = () => spotifyRequest('/me/player/next', 'POST');
  const skipPrevious = () => spotifyRequest('/me/player/previous', 'POST');

  const setVolume = (value: number) => {
    spotifyRequest(`/me/player/volume?volume_percent=${value}`, 'PUT');
  };

  // Not connected state
  if (!accessToken) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-green-500 hover:bg-green-600 transition-all hover:scale-105 z-50 text-white"
          >
            <Music className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-5 mb-2 mr-6 border shadow-lg rounded-xl" side="top" align="end">
          <div className="flex items-center gap-2 mb-3">
            <Music className="h-5 w-5 text-green-500" />
            <h3 className="font-display text-lg font-semibold">Spotify</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your Spotify account to control music playback while you work.
          </p>
          <Button onClick={handleLogin} className="w-full gap-2 bg-green-500 hover:bg-green-600">
            <Music className="h-4 w-4" />
            Connect Spotify
          </Button>
        </PopoverContent>
      </Popover>
    );
  }

  // No active device state
  if (!playbackState) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-green-500 hover:bg-green-600 transition-all hover:scale-105 z-50 text-white"
          >
            <Music className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-5 mb-2 mr-6 border shadow-lg rounded-xl" side="top" align="end">
          <div className="flex items-center gap-2 mb-3">
            <Music className="h-5 w-5 text-green-500" />
            <h3 className="font-display text-lg font-semibold">Spotify Connected</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            No active playback device. Open Spotify on your device and start playing.
          </p>
        </PopoverContent>
      </Popover>
    );
  // No active device state
  if (!playbackState) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-green-500 hover:bg-green-600 transition-all hover:scale-105 z-50 text-white"
          >
            <Music className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-5 mb-2 mr-6 border shadow-lg rounded-xl" side="top" align="end">
          <div className="flex items-center gap-2 mb-3">
            <Music className="h-5 w-5 text-green-500" />
            <h3 className="font-display text-lg font-semibold">Spotify Connected</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            No active playback device. Open Spotify on your device and start playing.
          </p>
        </PopoverContent>
        </PopoverContent>
      </Popover>
    );

  const { item: track, is_playing, device } = playbackState;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          size="icon" 
          className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105 z-50 overflow-hidden border-2 ${is_playing ? 'border-green-500 animate-pulse-subtle' : 'border-transparent bg-card text-foreground'}`}
        >
          {track?.album?.images?.[0]?.url ? (
            <img 
              src={track.album.images[0].url} 
              alt="Album art" 
              className={`h-full w-full object-cover ${is_playing ? 'animate-spin-slow' : ''}`}
            />
          ) : (
            <Music className="h-6 w-6 text-green-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-5 mb-2 mr-6 border shadow-lg rounded-xl" side="top" align="end">
        <div className="flex items-center gap-2 mb-4">
          <Music className="h-5 w-5 text-green-500" />
          <h3 className="font-display text-lg font-semibold truncate">
            {is_playing ? 'Now Playing' : 'Paused'}
          </h3>
        </div>

      {track && (
        <div className="flex gap-4 mb-4">
          {track.album.images[0] && (
            <img
              src={track.album.images[0].url}
              alt={track.album.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{track.name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {track.artists.map(a => a.name).join(', ')}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{track.album.name}</p>
          </div>
        </div>
      )}

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={skipPrevious}
          disabled={loading}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          size="lg"
          onClick={togglePlayPause}
          disabled={loading}
          className="gap-2"
        >
          {is_playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={skipNext}
          disabled={loading}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Volume control */}
      {device && (
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[device.volume_percent]}
            onValueChange={(vals) => setVolume(vals[0])}
            max={100}
            step={5}
            className="flex-1"
          />
          <span className="w-10 text-sm text-muted-foreground tabular-nums">
            {device.volume_percent}%
          </span>
        </div>
      )}
      </PopoverContent>
    </Popover>
  );
}
