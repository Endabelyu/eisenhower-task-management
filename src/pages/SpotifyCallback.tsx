import { useEffect, useState } from 'react';
import { exchangeCode, saveTokens } from '@/lib/spotify-auth';

export default function SpotifyCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const authError = params.get('error');

    if (authError) {
      setError(`Spotify authorization was denied: ${authError}`);
      setTimeout(() => { window.location.href = '/daily'; }, 3000);
      return;
    }

    if (!code) {
      window.location.href = '/daily';
      return;
    }

    const handleExchange = async () => {
      try {
        const tokenData = await exchangeCode(code);
        saveTokens(tokenData);
        // Hard reload so SpotifyProvider picks up the new token
        window.location.href = '/daily';
      } catch (err) {
        console.error('Token exchange failed:', err);
        setError(err instanceof Error ? err.message : 'Token exchange failed');
        setTimeout(() => { window.location.href = '/daily'; }, 4000);
      }
    };

    handleExchange();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-6">
          <div className="mb-4 text-4xl">❌</div>
          <h2 className="text-xl font-semibold mb-2 text-destructive">Connection Failed</h2>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <p className="text-xs text-muted-foreground">Redirecting back...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="mb-4 text-4xl animate-spin-slow">🎵</div>
        <h2 className="text-xl font-semibold mb-2">Connecting to Spotify...</h2>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
}
