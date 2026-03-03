import { useEffect, useRef, useState, useCallback } from 'react';
import { Music, Radio, Square, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ── Station Registry ──────────────────────────────────────────────────────────
// Mix of 24/7 live streams and long-form recorded videos.
export interface RadioStation {
  id: string;
  label: string;
  videoId: string; // Used for both videoId and playlistId depending on the 'type'
  category: 'general' | 'islamic' | 'local';
  emoji: string;
  isLive?: boolean;
  type?: 'video' | 'playlist';
}

export const RADIO_STATIONS: RadioStation[] = [
  // General
  { id: 'lofi-girl-study',  label: 'Lofi Girl — Study',  videoId: 'jfKfPfyJRdk', category: 'general', emoji: '📚', isLive: true },
  { id: 'lofi-girl-sleep',  label: 'Lofi Girl — Sleep',  videoId: '28KRPhVzCus', category: 'general', emoji: '🌙', isLive: true },
  { id: 'chillhop',         label: 'Chillhop Radio',     videoId: 'Mq-3Sjg41n4', category: 'general', emoji: '🎷', isLive: true },
  { id: 'lofi-cafe',        label: 'Lofi Cafe',          videoId: '7NOSDKb0HlU', category: 'general', emoji: '🍵', isLive: true },
  { id: 'coffee-shop',      label: 'Coffee Shop Radio',  videoId: '2JvP0K529Pg', category: 'general', emoji: '☕' },
  // Islamic
  { id: 'lofi-quran',       label: 'Lofi Quran',         videoId: 'uZOx0O5TIZk', category: 'islamic', emoji: '📿' },
  { id: 'lofi-quran-anime', label: 'Lofi Quran — Anime', videoId: 'kJKR0igjeSQ', category: 'islamic', emoji: '🕌' },
  { id: 'quran-peaceful',   label: 'Quran Peaceful',     videoId: 'r4W3v8h04IM', category: 'islamic', emoji: '☮️' },
  { id: 'mufti-menk',       label: 'Mufti Menk',         videoId: 'PL9821CA747E7E0674', category: 'islamic', emoji: '🎙️', type: 'playlist' },
  { id: 'sirah-nabawiyah',  label: 'Sirah Nabawiyah',    videoId: 'PLUuYlj8dcEXahjDZko8Qh1JnWrfsmXAIR', category: 'islamic', emoji: '📖', type: 'playlist' },
  // Local
  { id: 'indie-id',         label: 'Indie Indonesia',    videoId: 'PLHTmKJXs4YndjNRWNgte15icqYQWNpD2r', category: 'local',   emoji: '🇮🇩', type: 'playlist' },
];

// ── YouTube IFrame API types ──────────────────────────────────────────────────
interface YTPlayer {
  setVolume: (v: number) => void;
  getVolume: () => number;
  playVideo: () => void;
  stopVideo: () => void;
  destroy: () => void;
}
declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onError?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: Record<string, number>;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT?.Player) { resolve(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function RadioPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Destroy existing player
  const destroyPlayer = useCallback(() => {
    try { playerRef.current?.destroy(); } catch { /* ignore */ }
    playerRef.current = null;
  }, []);

  // Create a new YouTube IFrame player for the given station
  const startStation = useCallback(async (station: RadioStation) => {
    setIsLoading(true);
    destroyPlayer();
    setActiveStation(station);
    setIsPlaying(false);

    await loadYouTubeAPI();

    // Create a temporary mount div
    const div = document.createElement('div');
    div.id = `yt-player-${Date.now()}`;
    div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
    document.body.appendChild(div);
    containerRef.current = div;

    const isPlaylist = station.type === 'playlist';
    const playerOpts: any = {
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        ...(isPlaylist && {
          listType: 'playlist',
          list: station.videoId,
        })
      },
      events: {
        onReady: (e: { target: YTPlayer & { playVideo: () => void, setVolume: (v: number) => void } }) => {
          e.target.setVolume(volume);
          e.target.playVideo();
          setIsPlaying(true);
          setIsLoading(false);
        },
        onError: () => {
          setIsLoading(false);
          setIsPlaying(false);
        },
      },
    };

    if (!isPlaylist) {
      playerOpts.videoId = station.videoId;
    }

    playerRef.current = new window.YT.Player(div, playerOpts);
  }, [destroyPlayer, volume]);

  // Stop station
  const stopStation = useCallback(() => {
    destroyPlayer();
    if (containerRef.current) {
      containerRef.current.remove();
      containerRef.current = null;
    }
    setActiveStation(null);
    setIsPlaying(false);
  }, [destroyPlayer]);

  // Volume change
  const handleVolumeChange = useCallback((vals: number[]) => {
    const v = vals[0];
    setVolume(v);
    setIsMuted(v === 0);
    playerRef.current?.setVolume(v);
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      const v = volume || 50;
      playerRef.current?.setVolume(v);
      setIsMuted(false);
    } else {
      playerRef.current?.setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyPlayer();
      containerRef.current?.remove();
    };
  }, [destroyPlayer]);

  const generalStations = RADIO_STATIONS.filter(s => s.category === 'general');
  const islamicStations = RADIO_STATIONS.filter(s => s.category === 'islamic');
  const localStations   = RADIO_STATIONS.filter(s => s.category === 'local');

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className={`h-14 w-14 shrink-0 rounded-full shadow-lg transition-all hover:scale-105 z-50 text-white
            ${isPlaying
              ? 'bg-primary hover:bg-primary/90 ring-2 ring-primary/50 ring-offset-2 animate-pulse-subtle'
              : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-600 dark:hover:bg-neutral-500'
            }
            ${isLoading ? 'opacity-70 cursor-wait' : ''}
          `}
          aria-label={isPlaying ? `Playing: ${activeStation?.label}` : 'Open Radio Player'}
        >
          {isLoading
            ? <Radio className="h-6 w-6 animate-pulse" />
            : <Radio className="h-6 w-6" />
          }
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 mb-2 mr-6 shadow-xl rounded-xl overflow-hidden" side="top" align="end">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Lo-fi Radio</span>
              <span className="text-xs text-muted-foreground">• Free, no login</span>
            </div>
            {isPlaying && (
              <Button size="sm" variant="ghost" onClick={stopStation}
                className="h-6 text-xs text-muted-foreground hover:text-destructive px-2">
                <Square className="h-3 w-3 mr-1" /> Stop
              </Button>
            )}
          </div>
        </div>

        {/* Now playing */}
        {activeStation && (
          <div className={`px-4 py-2 text-sm flex items-center gap-2 border-b ${isLoading ? 'bg-muted/20' : 'bg-primary/10'}`}>
            <span className="text-base">{activeStation.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-xs">{activeStation.label}</p>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Connecting...' : (activeStation.isLive ? 'Live' : 'Playing')}
              </p>
            </div>
            {isPlaying && <span className="flex gap-0.5">
              {[1,2,3].map(i => (
                <span key={i} className="w-0.5 bg-primary rounded-full animate-bounce"
                  style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </span>}
          </div>
        )}

        {/* Stations */}
        <div className="max-h-64 overflow-y-auto py-2">
          {/* General */}
          <p className="px-4 pt-1 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            General
          </p>
          {generalStations.map(station => (
            <button
              key={station.id}
              onClick={() => activeStation?.id === station.id && isPlaying ? stopStation() : startStation(station)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors
                ${activeStation?.id === station.id ? 'bg-primary/10 text-primary' : ''}`}
            >
              <span className="text-base">{station.emoji}</span>
              <span className="flex-1 text-left truncate">{station.label}</span>
              {activeStation?.id === station.id && isPlaying && (
                <ChevronDown className="h-3 w-3 text-primary" />
              )}
            </button>
          ))}

          {/* Islamic */}
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Islamic
          </p>
          {islamicStations.map(station => (
            <button
              key={station.id}
              onClick={() => activeStation?.id === station.id && isPlaying ? stopStation() : startStation(station)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors
                ${activeStation?.id === station.id ? 'bg-primary/10 text-primary' : ''}`}
            >
              <span className="text-base">{station.emoji}</span>
              <span className="flex-1 text-left truncate">{station.label}</span>
              {activeStation?.id === station.id && isPlaying && (
                <ChevronDown className="h-3 w-3 text-primary" />
              )}
            </button>
          ))}

          {/* Local */}
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Local
          </p>
          {localStations.map(station => (
            <button
              key={station.id}
              onClick={() => activeStation?.id === station.id && isPlaying ? stopStation() : startStation(station)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors
                ${activeStation?.id === station.id ? 'bg-primary/10 text-primary' : ''}`}
            >
              <span className="text-base">{station.emoji}</span>
              <span className="flex-1 text-left truncate">{station.label}</span>
              {activeStation?.id === station.id && isPlaying && (
                <ChevronDown className="h-3 w-3 text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Volume */}
        <div className="px-4 py-3 border-t flex items-center gap-3">
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={toggleMute}>
            {isMuted || volume === 0
              ? <VolumeX className="h-4 w-4 text-muted-foreground" />
              : <Volume2 className="h-4 w-4 text-muted-foreground" />
            }
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={5}
            className="flex-1"
            aria-label="Volume"
          />
          <span className="w-8 text-right text-xs text-muted-foreground tabular-nums">
            {isMuted ? 0 : volume}%
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
