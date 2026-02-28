import { useState } from 'react';
import { Headphones, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpotify } from '@/context/SpotifyContext';
import { RadioPlayer } from './RadioPlayer';
import { SpotifyPlayer } from './SpotifyPlayer';

export function FloatingMediaMenu() {
  const { isSpotifyEnabled } = useSpotify();
  const [isOpen, setIsOpen] = useState(false);

  // If Spotify is not enabled, return just the radio player wrapped in the fixed container it used to have.
  if (!isSpotifyEnabled) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <RadioPlayer />
      </div>
    );
  }

  // If enabled, return the combined speed dial.
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* Main Toggle Button */}
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 shrink-0 rounded-full shadow-xl transition-all duration-300 hover:scale-105 ${
          isOpen ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
        }`}
        aria-label="Media controls"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Headphones className="h-6 w-6" />}
      </Button>

      {/* Options Menu */}
      <div
        className={`flex flex-col items-center gap-3 transition-all duration-300 origin-bottom ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none cursor-default'
        }`}
      >
        <SpotifyPlayer />
        <RadioPlayer />
      </div>
    </div>
  );
}
