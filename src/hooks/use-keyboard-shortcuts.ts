import { useEffect } from 'react';

export const OPEN_QUICK_ADD_EVENT = 'app:open-quick-add';

const NAVIGATION_KEYS: Record<string, string> = {
  '1': '/',
  '2': '/tasks',
  '3': '/daily',
  '4': '/stats',
};

interface KeyboardShortcutHandlers {
  onQuickAdd: () => void;
  onHelp: () => void;
  onNavigate: (path: string) => void;
  onToggleFocus?: () => void;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName.toLowerCase();
  if (target.isContentEditable) return true;
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;

  return target.closest('[contenteditable="true"]') !== null;
};

/**
 * Registers global keyboard shortcuts while safely ignoring focused form fields.
 */
export function useKeyboardShortcuts({ onQuickAdd, onHelp, onNavigate, onToggleFocus }: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const hasCommandModifier = event.ctrlKey || event.metaKey;

      if (hasCommandModifier && key === 'n') {
        event.preventDefault();
        onQuickAdd();
        return;
      }

      if (hasCommandModifier && (key === '/' || key === '?')) {
        event.preventDefault();
        onHelp();
        return;
      }

      if (hasCommandModifier || event.altKey || event.shiftKey) return;

      if (key === 'f' && onToggleFocus) {
        event.preventDefault();
        onToggleFocus();
        return;
      }

      const destination = NAVIGATION_KEYS[key];
      if (destination) {
        event.preventDefault();
        onNavigate(destination);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onHelp, onNavigate, onQuickAdd, onToggleFocus]);
}
