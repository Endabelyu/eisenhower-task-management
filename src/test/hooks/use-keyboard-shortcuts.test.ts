import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

const fireKey = (key: string, mods: Partial<KeyboardEventInit> = {}) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...mods }));
};

describe('useKeyboardShortcuts', () => {
  const onQuickAdd = vi.fn();
  const onHelp = vi.fn();
  const onNavigate = vi.fn();

  beforeEach(() => {
    onQuickAdd.mockClear();
    onHelp.mockClear();
    onNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setup = () =>
    renderHook(() => useKeyboardShortcuts({ onQuickAdd, onHelp, onNavigate }));

  it('fires onQuickAdd on Ctrl+N', () => {
    setup();
    fireKey('n', { ctrlKey: true });
    expect(onQuickAdd).toHaveBeenCalledTimes(1);
  });

  it('fires onHelp on Ctrl+/', () => {
    setup();
    fireKey('/', { ctrlKey: true });
    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it('fires onNavigate("/") on key "1"', () => {
    setup();
    fireKey('1');
    expect(onNavigate).toHaveBeenCalledWith('/');
  });

  it('fires onNavigate("/tasks") on key "2"', () => {
    setup();
    fireKey('2');
    expect(onNavigate).toHaveBeenCalledWith('/tasks');
  });

  it('fires onNavigate("/daily") on key "3"', () => {
    setup();
    fireKey('3');
    expect(onNavigate).toHaveBeenCalledWith('/daily');
  });

  it('fires onNavigate("/stats") on key "4"', () => {
    setup();
    fireKey('4');
    expect(onNavigate).toHaveBeenCalledWith('/stats');
  });

  it('does not fire when key is inside an input element', () => {
    setup();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    expect(onNavigate).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('does not fire when Alt modifier is held', () => {
    setup();
    fireKey('1', { altKey: true });
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('cleans up listener on unmount', () => {
    const { unmount } = setup();
    unmount();
    fireKey('1');
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
