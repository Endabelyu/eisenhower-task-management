import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the pure detection logic in isolation
function detectBrowserLanguage(navigatorLanguage: string): 'id' | 'en' {
  const primary = navigatorLanguage.split('-')[0].toLowerCase();
  if (primary === 'id') return 'id';
  return 'en';
}

describe('browser language detection', () => {
  it('detects Indonesian from "id" locale', () => {
    expect(detectBrowserLanguage('id')).toBe('id');
  });

  it('detects Indonesian from "id-ID" locale', () => {
    expect(detectBrowserLanguage('id-ID')).toBe('id');
  });

  it('detects English from "en" locale', () => {
    expect(detectBrowserLanguage('en')).toBe('en');
  });

  it('detects English from "en-US" locale', () => {
    expect(detectBrowserLanguage('en-US')).toBe('en');
  });

  it('falls back to English for unsupported locales', () => {
    expect(detectBrowserLanguage('fr')).toBe('en');
    expect(detectBrowserLanguage('ja')).toBe('en');
    expect(detectBrowserLanguage('zh-CN')).toBe('en');
    expect(detectBrowserLanguage('')).toBe('en');
  });

  describe('localStorage preference priority', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('prefers saved locale over browser language', () => {
      localStorage.setItem('app_language', 'en');
      const saved = localStorage.getItem('app_language');
      // Simulate context init: saved pref wins over browser (browser = id)
      const detected = (saved === 'en' || saved === 'id') ? saved : detectBrowserLanguage('id-ID');
      expect(detected).toBe('en');
    });

    it('falls back to browser language when no saved preference', () => {
      // No localStorage key — simulate context init falling back to browser detection
      const saved = localStorage.getItem('app_language');
      const detected = (saved === 'en' || saved === 'id') ? saved : detectBrowserLanguage('id-ID');
      expect(detected).toBe('id');
    });
  });
});
