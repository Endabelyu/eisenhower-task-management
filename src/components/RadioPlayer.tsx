import { useEffect, useRef, useState, useCallback } from 'react';
import { Music, Radio, Square, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ── Station Registry ──────────────────────────────────────────────────────────
// All IDs are 24/7 YouTube live streams. Views count for the creators.
export interface RadioStation {
  id: string;
  label: string;
  videoId: string;
  category: 'general' | 'islamic';
  emoji: string;
}

export const RADIO_STATIONS: RadioStation[] = [
  // General
  { id: 'lofi-girl-study',  label: 'Lofi Girl — Study',  videoId: 'jfKfPfyJRdk', category: 'general', emoji: '📚' },
  { id: 'lofi-girl-sleep',  label: 'Lofi Girl — Sleep',  videoId: '28KRPhVzCus', category: 'general', emoji: '🌙' },
  { id: 'chillhop',         label: 'Chillhop Radio',     videoId: 'Mq-3Sjg41n4', category: 'general', emoji: '🎷' },
  { id: 'lofi-cafe',        label: 'Lofi Cafe',          videoId: '7NOSDKb0HlU', category: 'general', emoji: '🍵' },
  { id: 'coffee-shop',      label: 'Coffee Shop Radio',  videoId: 'kx3pDfBNwbM', category: 'general', emoji: '☕' },
  // Islamic
  { id: 'lofi-quran',       label: 'Lofi Quran',         videoId: '6IseLQU-o8s', category: 'islamic', emoji: '📿' },
  { id: 'lofi-quran-anime', label: 'Lofi Quran — Anime', videoId: '_sS26f_HIUk', category: 'islamic', emoji: '🕌' },
  { id: 'quran-peaceful',   label: 'Quran Peaceful',     videoId: 'd3h9bAS71B0', category: 'islamic', emoji: '☮️' },
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

    playerRef.current = new window.YT.Player(div, {
      videoId: station.videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (e) => {
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
    });
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105 z-50 text-white
            ${isPlaying
              ? 'bg-green-500 hover:bg-green-600 ring-2 ring-green-400 ring-offset-2 animate-pulse-subtle'
              : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-600 dark:hover:bg-neutral-500'
            }
            ${isLoading ? 'opacity-70 cursor-wait' : ''}
          `}
          aria-label={isPlaying ? `Playing: ${activeStation?.label}` : 'Open Radio Player'}
        >
          {isLoading
            ? <Radio className="h-6 w-6 animate-pulse" />
            : isPlaying
              ? <Music className="h-6 w-6" />
              : <Radio className="h-6 w-6" />
          }
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 mb-2 mr-6 shadow-xl rounded-xl overflow-hidden" side="top" align="end">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-green-500" />
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
          <div className={`px-4 py-2 text-sm flex items-center gap-2 border-b ${isLoading ? 'bg-muted/20' : 'bg-green-500/10'}`}>
            <span className="text-base">{activeStation.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-xs">{activeStation.label}</p>
              <p className="text-xs text-muted-foreground">{isLoading ? 'Connecting...' : 'Live'}</p>
            </div>
            {isPlaying && <span className="flex gap-0.5">
              {[1,2,3].map(i => (
                <span key={i} className="w-0.5 bg-green-500 rounded-full animate-bounce"
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
                ${activeStation?.id === station.id ? 'bg-green-500/10 text-green-600 dark:text-green-400' : ''}`}
            >
              <span className="text-base">{station.emoji}</span>
              <span className="flex-1 text-left truncate">{station.label}</span>
              {activeStation?.id === station.id && isPlaying && (
                <ChevronDown className="h-3 w-3 text-green-500" />
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
                ${activeStation?.id === station.id ? 'bg-green-500/10 text-green-600 dark:text-green-400' : ''}`}
            >
              <span className="text-base">{station.emoji}</span>
              <span className="flex-1 text-left truncate">{station.label}</span>
              {activeStation?.id === station.id && isPlaying && (
                <ChevronDown className="h-3 w-3 text-green-500" />
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
