import { useEffect, useRef, useState, useCallback } from 'react';
import { Music, Radio, Square, Volume2, VolumeX, ChevronDown, ChevronRight, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ── Station Registry ──────────────────────────────────────────────────────────
// Mix of 24/7 live streams and long-form recorded videos.
export interface RadioStation {
  id: string;
  label: string;
  videoId: string; // Used for both videoId and playlistId depending on the 'type'
  category: 'general' | 'islamic' | 'local' | 'podcast';
  emoji: string;
  isLive?: boolean;
  type?: 'video' | 'playlist' | 'search';
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
  // Local — Individual Indonesian Indie Artists using YouTube Radio Mix for skip/prev support
  { id: 'hindia',          label: 'Hindia',          videoId: 'RDwnAKxtEi78c',    category: 'local', emoji: '🌿', type: 'playlist' },
  { id: 'feast',           label: '.Feast',           videoId: 'RDeulYTPXOaio',    category: 'local', emoji: '🎸', type: 'playlist' },
  { id: 'sal-priadi',      label: 'Sal Priadi',       videoId: 'RDtCE9U4D995s',    category: 'local', emoji: '🎵', type: 'playlist' },
  { id: 'nadin-amizah',    label: 'Nadin Amizah',     videoId: 'PLZ_fgmvvpb2yZZOuaJMPDEdM0-UR7akh3', category: 'local', emoji: '🌸', type: 'playlist' },
  { id: 'tulus',           label: 'Tulus',            videoId: 'PLzgVPDDV8B8dWJbuhdUcxgW0yLYTJ9-IQ', category: 'local', emoji: '🎤', type: 'playlist' },
  { id: 'ardhito',         label: 'Ardhito Pramono',  videoId: 'RDXhALz1B2u1w',    category: 'local', emoji: '🎹', type: 'playlist' },
  { id: 'danilla',         label: 'Danilla',          videoId: 'RDyjw8lL9QSoM',    category: 'local', emoji: '🎻', type: 'playlist' },
  { id: 'sheila-on7',      label: 'Sheila On 7',      videoId: 'RDOdDwIwoiZwU',    category: 'local', emoji: '🎸', type: 'playlist' },
  { id: 'jason-ranti',     label: 'Jason Ranti',      videoId: 'RDKP2Ap8gH0f4',    category: 'local', emoji: '🎭', type: 'playlist' },
  { id: 'iksan-skuter',    label: 'Iksan Skuter',     videoId: 'RDW3fkCzdTfEQ',    category: 'local', emoji: '🛵', type: 'playlist' },
  { id: 'fourtwnty',       label: 'Fourtwnty',        videoId: 'RDBm5KVJsU09c',    category: 'local', emoji: '🌱', type: 'playlist' },
  { id: 'ari-lesmana',     label: 'Ari Lesmana',      videoId: 'RDNskf70DMR60',    category: 'local', emoji: '🎸', type: 'playlist' },
  { id: 'slank',           label: 'Slank',            videoId: 'RDWIDJB9_4XRM',    category: 'local', emoji: '✊', type: 'playlist' },
  { id: 'raim-laode',      label: 'Raim Laode',       videoId: 'RDvl_3mZx88zw',    category: 'local', emoji: '🎵', type: 'playlist' },
  { id: 'opick',           label: 'Opick',            videoId: 'RDul6ZiwZ7heQ',    category: 'local', emoji: '🕌', type: 'playlist' },
  { id: 'bilal-indrajaya', label: 'Bilal Indrajaya',  videoId: 'PLGDwMEKws2fan42kCftmWNc0OCAax4BGE', category: 'local', emoji: '🎵', type: 'playlist' },
  { id: 'hadad-alwi',      label: 'Haddad Alwi',      videoId: 'RDl50dEZ0qS-U',    category: 'local', emoji: '🌙', type: 'playlist' },

  // Podcasts
  { id: 'endgame',          label: 'Endgame (Gita Wirjawan)',  videoId: 'PL-hh_bKgnJ6FqDJwTs5YB3xMvQrFCDSoJ', category: 'podcast', emoji: '🎧', type: 'playlist' },
  { id: 'sepulang-sekolah', label: 'Sepulang Sekolah',         videoId: 'PLfN58YcV819YaV1FzBEqbvkoe6vIra-aH', category: 'podcast', emoji: '📚', type: 'playlist' },
  { id: 'learning-by-googling', label: 'Learning By Googling',   videoId: 'PLSJZ5LiRPqecWnEBeIVzlDpxBZyQK0aCr', category: 'podcast', emoji: '🔍', type: 'playlist' },
  { id: 'learning-by-fasting', label: 'Learning By Fasting',    videoId: 'PLSJZ5LiRPqedzkMq17NvsAzysHL9l6pk1', category: 'podcast', emoji: '🌙', type: 'playlist' },
  { id: 'login-podcast',    label: 'Login (Habib Jafar)',      videoId: 'PLe_K9e2LM-ilpMuQv7vyrKds0FdjBznFp', category: 'podcast', emoji: '☪️', type: 'playlist' },
  { id: 'escape-podcast',   label: 'Podcast Escape',           videoId: 'PLSNt1tjjz_ArTDv1jVMjhHlaHM51euDq0', category: 'podcast', emoji: '🚪', type: 'playlist' },
  { id: 'suara-berkelas',   label: 'Suara Berkelas',           videoId: 'suara berkelas podcast motivasi', category: 'podcast', emoji: '⭐', type: 'search' },
  { id: 'bagus-muljadi',    label: 'Podcast Bagus Muljadi',    videoId: 'bagus muljadi podcast', category: 'podcast', emoji: '💡', type: 'search' },
  { id: 'raditya-dika',     label: 'Raditya Dika Podcast',     videoId: 'raditya dika podcast seminggu', category: 'podcast', emoji: '😂', type: 'search' },
  { id: 'what-is-up-id',    label: 'What is Up Indonesia',     videoId: 'what is up indonesia wiui', category: 'podcast', emoji: '🗺️', type: 'search' },
  { id: 'bocor-alus',       label: 'Bocor Alus Politik',       videoId: 'bocor alus politik tempo', category: 'podcast', emoji: '📰', type: 'search' },
  { id: 'sport77',          label: 'Sportcast 77',             videoId: 'sport 77 sportcast podcast', category: 'podcast', emoji: '⚽', type: 'search' },
];


// ── YouTube IFrame API types ──────────────────────────────────────────────────
interface YTPlayer {
  setVolume: (v: number) => void;
  getVolume: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  getVideoData: () => { video_id: string; title: string; author: string };
  stopVideo: () => void;
  destroy: () => void;
}
declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onError?: (e: { data: number }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
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
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');

  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastFetchedVideoIdRef = useRef<string | null>(null);

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
    setIsPaused(false);
    setCurrentVideoTitle('');
    lastFetchedVideoIdRef.current = null;

    await loadYouTubeAPI();

    // Create a temporary mount div
    const div = document.createElement('div');
    div.id = `yt-player-${Date.now()}`;
    div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
    document.body.appendChild(div);
    containerRef.current = div;

    const isPlaylist = station.type === 'playlist';
    const isSearch = station.type === 'search';
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
        }),
        ...(isSearch && {
          listType: 'search',
          list: station.videoId,
        })
      },
      events: {
        onReady: (e: { target: YTPlayer }) => {
          e.target.setVolume(volume);
          e.target.playVideo();
          setIsPlaying(true);
          setIsPaused(false);
          setIsLoading(false);
        },
        onStateChange: (e: { data: number; target: YTPlayer }) => {
          // YT.PlayerState.PLAYING = 1
          if (e.data === 1) {
            try {
              const videoData = e.target.getVideoData();
              if (videoData?.video_id && videoData.video_id !== lastFetchedVideoIdRef.current) {
                lastFetchedVideoIdRef.current = videoData.video_id;
                // Fetch title via noembed (no API key needed)
                const url = `https://www.youtube.com/watch?v=${videoData.video_id}`;
                fetch(`https://noembed.com/embed?url=${url}`)
                  .then(r => r.json())
                  .then(d => { if (d.title) setCurrentVideoTitle(d.title); })
                  .catch(() => {});
              }
            } catch {
              // getVideoData may fail on some stations; silently ignore
            }
          }
        },
        onError: () => {
          setIsLoading(false);
          setIsPlaying(false);
          setIsPaused(false);
        },
      },
    };

    if (!isPlaylist && !isSearch) {
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
    setIsPaused(false);
    setCurrentVideoTitle('');
    lastFetchedVideoIdRef.current = null;
  }, [destroyPlayer]);

  // Playback Controls
  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    if (isPaused) {
      playerRef.current.playVideo();
      setIsPaused(false);
    } else {
      playerRef.current.pauseVideo();
      setIsPaused(true);
    }
  }, [isPaused]);

  const handleNext = useCallback(() => {
    if (playerRef.current && activeStation?.type === 'playlist') {
      playerRef.current.nextVideo();
      setIsPaused(false);
    }
  }, [activeStation]);

  const handlePrev = useCallback(() => {
    if (playerRef.current && activeStation?.type === 'playlist') {
      playerRef.current.previousVideo();
      setIsPaused(false);
    }
  }, [activeStation]);

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
  const podcastStations = RADIO_STATIONS.filter(s => s.category === 'podcast');

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true, islamic: true, local: true, podcast: false
  });

  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const renderStation = (station: RadioStation) => (
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
  );

  const renderCategory = (label: string, key: string, stations: RadioStation[]) => (
    <>
      <button
        onClick={() => toggleSection(key)}
        className="w-full flex items-center justify-between px-4 pt-3 pb-1 hover:bg-muted/30 transition-colors"
      >
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {openSections[key]
          ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground" />
        }
      </button>
      {openSections[key] && stations.map(renderStation)}
    </>
  );

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
          <div className={`px-4 py-3 flex flex-col gap-2 border-b ${isLoading ? 'bg-muted/20' : 'bg-primary/5'}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{activeStation.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm text-foreground">{activeStation.label}</p>
                {currentVideoTitle && !isLoading && (
                  <p className="text-xs font-medium text-primary mt-0.5 line-clamp-2 leading-tight pr-2">
                    {currentVideoTitle}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {isLoading ? 'Connecting...' : (activeStation.isLive ? 'Live' : (isPaused ? 'Paused' : 'Playing'))}
                  </p>
                  {isPlaying && !isPaused && <span className="flex gap-0.5 ml-1">
                    {[1,2,3].map(i => (
                      <span key={i} className="w-0.5 bg-primary rounded-full animate-bounce"
                        style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </span>}
                </div>
              </div>
            </div>
            
            {/* Playback Controls Row */}
            {isPlaying && !isLoading && (
              <div className="flex items-center justify-center gap-4 mt-1">
                {(activeStation.type === 'playlist' || activeStation.type === 'search') && (
                  <Button size="icon" variant="ghost" onClick={handlePrev} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <SkipBack className="h-4 w-4" fill="currentColor" />
                  </Button>
                )}
                
                <Button size="icon" variant="ghost" onClick={togglePlayPause} className="h-10 w-10 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                  {isPaused ? (
                    <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                  ) : (
                    <Pause className="h-5 w-5" fill="currentColor" />
                  )}
                </Button>

                {(activeStation.type === 'playlist' || activeStation.type === 'search') && (
                  <Button size="icon" variant="ghost" onClick={handleNext} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <SkipForward className="h-4 w-4" fill="currentColor" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stations */}
        <div className="max-h-80 overflow-y-auto py-2">
          {renderCategory('General', 'general', generalStations)}
          {renderCategory('Islamic', 'islamic', islamicStations)}
          {renderCategory('Local', 'local', localStations)}
          {renderCategory('Podcast 🎙️', 'podcast', podcastStations)}
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
