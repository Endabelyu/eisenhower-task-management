import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      console.error('Spotify auth error:', error);
      navigate('/daily');
      return;
    }

    const exchangeToken = async () => {
      const codeVerifier = localStorage.getItem('spotify_code_verifier');
      if (!code || !codeVerifier) {
        navigate('/daily');
        return;
      }

      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

      try {
        const body = new URLSearchParams({
          client_id: clientId,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        });

        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        });

        if (!response.ok) {
          throw new Error('HTTP status ' + response.status);
        }

        const data = await response.json();
        
        if (data.access_token) {
          localStorage.setItem('spotify_access_token', data.access_token);
          // Optional: handle refresh_token here if needed
        }
      } catch (err) {
        console.error('Token exchange failed:', err);
      } finally {
        // Clean up
        localStorage.removeItem('spotify_code_verifier');
        navigate('/daily');
      }
    };

    if (code) {
      exchangeToken();
    } else {
      navigate('/daily');
    }
    
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Connecting to Spotify...</h2>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
}
