import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadioPlayer, RADIO_STATIONS } from '@/components/RadioPlayer';

// ── Browser API stubs ─────────────────────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ── Station Registry Tests ────────────────────────────────────────────────────
describe('RADIO_STATIONS registry', () => {
  it('contains at least 30 stations total', () => {
    expect(RADIO_STATIONS.length).toBeGreaterThanOrEqual(30);
  });

  it('has no duplicate station IDs', () => {
    const ids = RADIO_STATIONS.map(s => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all stations have required fields: id, label, videoId, category, emoji', () => {
    for (const station of RADIO_STATIONS) {
      expect(station.id, `${station.id} missing id`).toBeTruthy();
      expect(station.label, `${station.id} missing label`).toBeTruthy();
      expect(station.videoId, `${station.id} missing videoId`).toBeTruthy();
      expect(station.category, `${station.id} missing category`).toBeTruthy();
      expect(station.emoji, `${station.id} missing emoji`).toBeTruthy();
    }
  });

  it('all categories are valid', () => {
    const valid = ['general', 'islamic', 'local', 'podcast'];
    for (const station of RADIO_STATIONS) {
      expect(valid).toContain(station.category);
    }
  });

  it('playlist-type stations have a valid PL or RD or UU or OL prefix videoId', () => {
    const playlistStations = RADIO_STATIONS.filter(s => s.type === 'playlist');
    for (const station of playlistStations) {
      const hasValidPrefix =
        station.videoId.startsWith('PL') ||
        station.videoId.startsWith('RD') ||
        station.videoId.startsWith('UU') ||
        station.videoId.startsWith('OL');
      expect(hasValidPrefix, `${station.label} (${station.videoId}) must start with PL/RD/UU/OL`).toBe(true);
    }
  });

  // ── General category ────────────────────────────────────────────────────────
  describe('General category', () => {
    const general = RADIO_STATIONS.filter(s => s.category === 'general');
    it('has at least 5 general stations', () => expect(general.length).toBeGreaterThanOrEqual(5));
    it('includes Lofi Girl Study', () => expect(general.some(s => s.id === 'lofi-girl-study')).toBe(true));
    it('includes Lofi Girl Sleep', () => expect(general.some(s => s.id === 'lofi-girl-sleep')).toBe(true));
    it('includes Chillhop', () => expect(general.some(s => s.id === 'chillhop')).toBe(true));
  });

  // ── Islamic category ────────────────────────────────────────────────────────
  describe('Islamic category', () => {
    const islamic = RADIO_STATIONS.filter(s => s.category === 'islamic');
    it('has at least 5 islamic stations', () => expect(islamic.length).toBeGreaterThanOrEqual(5));
    it('includes Mufti Menk playlist', () => expect(islamic.some(s => s.id === 'mufti-menk')).toBe(true));
    it('includes Sirah Nabawiyah playlist', () => expect(islamic.some(s => s.id === 'sirah-nabawiyah')).toBe(true));
    it('Mufti Menk and Sirah Nabawiyah are playlist type', () => {
      const mufti = islamic.find(s => s.id === 'mufti-menk');
      const sirah = islamic.find(s => s.id === 'sirah-nabawiyah');
      expect(mufti?.type).toBe('playlist');
      expect(sirah?.type).toBe('playlist');
    });
  });

  // ── Local category ──────────────────────────────────────────────────────────
  describe('Local (Indie Indonesia) category', () => {
    const local = RADIO_STATIONS.filter(s => s.category === 'local');
    const EXPECTED_ARTISTS = [
      'hindia', 'feast', 'sal-priadi', 'nadin-amizah', 'tulus',
      'ardhito', 'danilla', 'sheila-on7', 'jason-ranti', 'iksan-skuter',
      'fourtwnty', 'ari-lesmana', 'slank', 'raim-laode', 'opick',
      'bilal-indrajaya', 'hadad-alwi',
    ];

    it('has all 17 expected indie artist stations', () => {
      expect(local.length).toBeGreaterThanOrEqual(17);
    });

    for (const artistId of EXPECTED_ARTISTS) {
      it(`includes ${artistId} station`, () => {
        expect(local.some(s => s.id === artistId)).toBe(true);
      });
    }

    it('all local stations are playlist type (for skip/prev support)', () => {
      for (const station of local) {
        expect(station.type, `${station.label} should be playlist type`).toBe('playlist');
      }
    });

    it('Nadin Amizah uses a PL playlist', () => {
      const nadin = local.find(s => s.id === 'nadin-amizah');
      expect(nadin?.videoId.startsWith('PL')).toBe(true);
    });

    it('Tulus uses official PL playlist (not a broken RD id)', () => {
      const tulus = local.find(s => s.id === 'tulus');
      expect(tulus?.videoId.startsWith('PL')).toBe(true);
    });

    it('Bilal Indrajaya uses official PL playlist', () => {
      const bilal = local.find(s => s.id === 'bilal-indrajaya');
      expect(bilal?.videoId.startsWith('PL')).toBe(true);
    });
  });

  // ── Podcast category ────────────────────────────────────────────────────────
  describe('Podcast category', () => {
    const podcasts = RADIO_STATIONS.filter(s => s.category === 'podcast');
    const EXPECTED_PODCASTS = [
      'endgame', 'sepulang-sekolah', 'login-podcast', 'escape-podcast',
      'suara-berkelas', 'bagus-muljadi', 'raditya-dika', 'what-is-up-id',
      'bocor-alus', 'sport77',
    ];

    it('has at least 10 podcast stations', () => expect(podcasts.length).toBeGreaterThanOrEqual(10));

    for (const podcastId of EXPECTED_PODCASTS) {
      it(`includes ${podcastId} podcast`, () => {
        expect(podcasts.some(s => s.id === podcastId)).toBe(true);
      });
    }

    it('Endgame has real PL playlist ID', () => {
      const endgame = podcasts.find(s => s.id === 'endgame');
      expect(endgame?.videoId.startsWith('PL')).toBe(true);
    });

    it('Podcast Escape has real PL playlist ID', () => {
      const escape = podcasts.find(s => s.id === 'escape-podcast');
      expect(escape?.videoId.startsWith('PL')).toBe(true);
    });

    it('does NOT contain old "Podcast Main Bola" (renamed to Podcast Escape)', () => {
      expect(podcasts.some(s => s.label === 'Podcast Main Bola')).toBe(false);
    });
  });
});

// ── RadioPlayer Component Tests ───────────────────────────────────────────────
describe('RadioPlayer component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub YouTube API to prevent errors
    (window as any).YT = { Player: vi.fn() };
  });

  it('renders the radio trigger button', () => {
    render(<RadioPlayer />);
    const btn = screen.getByRole('button', { name: /open radio player/i });
    expect(btn).toBeInTheDocument();
  });

  it('opens the radio popover on click', async () => {
    render(<RadioPlayer />);
    fireEvent.click(screen.getByRole('button', { name: /open radio player/i }));
    expect(await screen.findByText(/lo-fi radio/i)).toBeInTheDocument();
  });

  it('shows all 4 category headers', async () => {
    render(<RadioPlayer />);
    fireEvent.click(screen.getByRole('button', { name: /open radio player/i }));
    expect(await screen.findByText(/general/i)).toBeInTheDocument();
    expect(await screen.findByText(/islamic/i)).toBeInTheDocument();
    expect(await screen.findByText(/local/i)).toBeInTheDocument();
    expect(await screen.findByText(/podcast/i)).toBeInTheDocument();
  });

  it('General section is expanded by default', async () => {
    render(<RadioPlayer />);
    fireEvent.click(screen.getByRole('button', { name: /open radio player/i }));
    expect(await screen.findByText('Lofi Girl — Study')).toBeInTheDocument();
  });

  it('Local section is expanded by default', async () => {
    render(<RadioPlayer />);
    fireEvent.click(screen.getByRole('button', { name: /open radio player/i }));
    expect(await screen.findByText('Hindia')).toBeInTheDocument();
    expect(await screen.findByText('Tulus')).toBeInTheDocument();
  });

  it('Podcast section is collapsed by default (not visible)', async () => {
    render(<RadioPlayer />);
    fireEvent.click(screen.getByRole('button', { name: /open radio player/i }));
    // Podcast header should be visible but stations should be hidden
    expect(await screen.findByText(/podcast/i)).toBeInTheDocument();
    const endgame = screen.queryByText('Endgame (Gita Wirjawan)');
    expect(endgame).toBeNull(); // collapsed by default
  });

  it('clicking Podcast header expands podcast stations', async () => {
    render(<RadioPlayer />);
    fireEvent.click(screen.getByRole('button', { name: /open radio player/i }));
    // Click the Podcast category header to expand it
    const podcastHeader = await screen.findByText(/podcast 🎙️/i);
    fireEvent.click(podcastHeader.closest('button')!);
    expect(await screen.findByText('Endgame (Gita Wirjawan)')).toBeInTheDocument();
  });
});

