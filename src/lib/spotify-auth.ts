/**
 * Spotify Authorization — PKCE Flow
 *
 * Standalone module handling the complete Spotify auth lifecycle:
 *   1. Redirect to Spotify with PKCE challenge
 *   2. Exchange authorization code for tokens
 *   3. Persist & refresh tokens automatically
 *
 * Reference: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';

const STORAGE_KEYS = {
  accessToken: 'spotify_access_token',
  refreshToken: 'spotify_refresh_token',
  tokenExpiry: 'spotify_token_expiry',
  codeVerifier: 'spotify_code_verifier',
} as const;

const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

// ---------------------------------------------------------------------------
// PKCE Helpers
// ---------------------------------------------------------------------------

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// ---------------------------------------------------------------------------
// Token persistence
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
}

export function isTokenExpired(): boolean {
  const expiry = localStorage.getItem(STORAGE_KEYS.tokenExpiry);
  if (!expiry) return true;
  // Add 60-second buffer so we refresh slightly before real expiry
  return Date.now() >= parseInt(expiry, 10) - 60_000;
}

export interface SpotifyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export function saveTokens(data: SpotifyTokenResponse): void {
  localStorage.setItem(STORAGE_KEYS.accessToken, data.access_token);
  if (data.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, data.refresh_token);
  }
  localStorage.setItem(
    STORAGE_KEYS.tokenExpiry,
    String(Date.now() + data.expires_in * 1000),
  );
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.tokenExpiry);
  localStorage.removeItem(STORAGE_KEYS.codeVerifier);
}

// ---------------------------------------------------------------------------
// Authorization flow
// ---------------------------------------------------------------------------

/** Step 1 — Redirect to Spotify with PKCE challenge */
export async function authorize(): Promise<void> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error('Missing VITE_SPOTIFY_CLIENT_ID or VITE_SPOTIFY_REDIRECT_URI');
    return;
  }

  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  localStorage.setItem(STORAGE_KEYS.codeVerifier, codeVerifier);

  const authUrl = new URL(AUTH_ENDPOINT);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('code_challenge', codeChallenge);

  window.location.href = authUrl.toString();
}

/** Step 2 — Exchange the authorization code for tokens */
export async function exchangeCode(code: string): Promise<SpotifyTokenResponse> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const codeVerifier = localStorage.getItem(STORAGE_KEYS.codeVerifier);

  if (!codeVerifier) {
    throw new Error('Missing code_verifier — auth flow was not started correctly');
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Token exchange failed (${response.status}): ${err.error_description ?? err.error ?? 'unknown'}`,
    );
  }

  // Clean up the verifier immediately after successful exchange
  localStorage.removeItem(STORAGE_KEYS.codeVerifier);

  return response.json();
}

/** Step 3 — Silently refresh the access token */
export async function refreshAccessToken(): Promise<SpotifyTokenResponse> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available — user must re-authenticate');
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    // If refresh fails, tokens are stale — clear everything
    clearTokens();
    throw new Error('Refresh token expired — user must re-authenticate');
  }

  return response.json();
}

/**
 * Get a valid access token, refreshing if needed.
 * Returns null if the user is not authenticated at all.
 */
export async function ensureValidToken(): Promise<string | null> {
  const token = getToken();
  if (!token) return null;

  if (!isTokenExpired()) return token;

  try {
    const data = await refreshAccessToken();
    saveTokens(data);
    return data.access_token;
  } catch {
    return null;
  }
}
