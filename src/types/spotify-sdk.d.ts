/**
 * TypeScript declarations for the Spotify Web Playback SDK
 * https://developer.spotify.com/documentation/web-playback-sdk/reference
 */

interface Window {
  Spotify: typeof Spotify;
  onSpotifyWebPlaybackSDKReady: () => void;
}

declare namespace Spotify {
  interface PlayerInit {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
    enableMediaSession?: boolean;
  }

  interface WebPlaybackPlayer {
    device_id: string;
  }

  interface WebPlaybackTrack {
    uri: string;
    id: string | null;
    type: 'track' | 'episode' | 'ad';
    media_type: 'audio' | 'video';
    name: string;
    is_playable: boolean;
    album: {
      uri: string;
      name: string;
      images: Array<{ url: string }>;
    };
    artists: Array<{ uri: string; name: string }>;
  }

  interface WebPlaybackState {
    context: {
      uri: string | null;
      metadata: Record<string, unknown> | null;
    };
    disallows: {
      pausing?: boolean;
      peeking_next?: boolean;
      peeking_prev?: boolean;
      resuming?: boolean;
      seeking?: boolean;
      skipping_next?: boolean;
      skipping_prev?: boolean;
    };
    paused: boolean;
    position: number;
    duration: number;
    repeat_mode: 0 | 1 | 2;
    shuffle: boolean;
    track_window: {
      current_track: WebPlaybackTrack;
      previous_tracks: WebPlaybackTrack[];
      next_tracks: WebPlaybackTrack[];
    };
  }

  interface WebPlaybackError {
    message: string;
  }

  class Player {
    constructor(options: PlayerInit);
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: 'ready', callback: (player: WebPlaybackPlayer) => void): boolean;
    addListener(event: 'not_ready', callback: (player: WebPlaybackPlayer) => void): boolean;
    addListener(event: 'player_state_changed', callback: (state: WebPlaybackState | null) => void): boolean;
    addListener(event: 'autoplay_failed', callback: () => void): boolean;
    addListener(event: 'initialization_error', callback: (error: WebPlaybackError) => void): boolean;
    addListener(event: 'authentication_error', callback: (error: WebPlaybackError) => void): boolean;
    addListener(event: 'account_error', callback: (error: WebPlaybackError) => void): boolean;
    addListener(event: 'playback_error', callback: (error: WebPlaybackError) => void): boolean;
    removeListener(event: string, callback?: () => void): boolean;
    getCurrentState(): Promise<WebPlaybackState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    activateElement(): Promise<void>;
  }
}
