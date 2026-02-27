import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  authorize,
  getToken,
  clearTokens,
  isTokenExpired,
  refreshAccessToken,
  saveTokens,
  ensureValidToken,
} from '@/lib/spotify-auth';

interface SpotifyContextType {
  /** Current valid access token, or null if not authenticated */
  accessToken: string | null;
  /** Whether the user has an active Spotify session */
  isAuthenticated: boolean;
  /** Redirect to Spotify login */
  login: () => Promise<void>;
  /** Clear all tokens and reset state */
  logout: () => void;
  /** Get a guaranteed-valid token (may silently refresh) */
  getValidToken: () => Promise<string | null>;
  /** Whether the Spotify player floating button is enabled */
  isSpotifyEnabled: boolean;
  /** Toggle the Spotify player feature completely */
  setSpotifyEnabled: (enabled: boolean) => void;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => getToken());
  const [isSpotifyEnabled, setIsSpotifyEnabled] = useState<boolean>(() => {
    return localStorage.getItem('spotify_integration_enabled') === 'true';
  });

  // On mount, check if the stored token is still valid
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    if (isTokenExpired()) {
      // Attempt silent refresh
      refreshAccessToken()
        .then((data) => {
          saveTokens(data);
          setAccessToken(data.access_token);
        })
        .catch(() => {
          clearTokens();
          setAccessToken(null);
        });
    } else {
      setAccessToken(token);
    }
  }, []);

  // Auto-refresh: check every 5 minutes
  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(async () => {
      if (isTokenExpired()) {
        try {
          const data = await refreshAccessToken();
          saveTokens(data);
          setAccessToken(data.access_token);
        } catch {
          clearTokens();
          setAccessToken(null);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [accessToken]);

  const login = useCallback(async () => {
    await authorize();
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAccessToken(null);
  }, []);

  const getValidToken = useCallback(async () => {
    const token = await ensureValidToken();
    if (token !== accessToken) {
      setAccessToken(token);
    }
    return token;
  }, [accessToken]);

  const setSpotifyEnabled = useCallback((enabled: boolean) => {
    setIsSpotifyEnabled(enabled);
    localStorage.setItem('spotify_integration_enabled', String(enabled));
  }, []);

  return (
    <SpotifyContext.Provider
      value={{
        accessToken,
        isAuthenticated: !!accessToken,
        login,
        logout,
        getValidToken,
        isSpotifyEnabled,
        setSpotifyEnabled,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
}
