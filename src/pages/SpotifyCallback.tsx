import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Spotify implicit grant flow returns the token in the URL hash (e.g., #access_token=xyz&token_type=Bearer&expires_in=3600)
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
      console.error('Spotify auth error:', error);
      navigate('/daily');
      return;
    }

    if (hash) {
      // Remove the leading '#' so URLSearchParams can parse the key=value pairs easily
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        localStorage.setItem('spotify_access_token', accessToken);
      }
    }
    
    // Always navigate back to the main app layout afterwards
    navigate('/daily');
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
