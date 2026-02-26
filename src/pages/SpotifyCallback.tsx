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
    
    if (code) {
      // Exchange code for access token via backend
      fetch('/api/spotify/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            localStorage.setItem('spotify_access_token', data.access_token);
            navigate('/daily');
          }
        })
        .catch(err => {
          console.error('Token exchange failed:', err);
          navigate('/daily');
        });
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
