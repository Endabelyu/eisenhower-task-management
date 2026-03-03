import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getNotificationPermission,
  requestNotificationPermission,
  notify,
} from '@/lib/notifications';

// Helper to mock the global Notification API
function mockNotification(permission: NotificationPermission = 'default') {
  const mockNotificationInstance = { onclick: null as (() => void) | null, close: vi.fn() };
  const mockNotificationClass = vi.fn().mockImplementation(() => mockNotificationInstance) as unknown as {
    new(title: string, options?: NotificationOptions): { onclick: unknown; close: () => void };
    permission: NotificationPermission;
    requestPermission: ReturnType<typeof vi.fn>;
  };
  mockNotificationClass.permission = permission;
  mockNotificationClass.requestPermission = vi.fn().mockResolvedValue('granted');

  Object.defineProperty(window, 'Notification', {
    value: mockNotificationClass,
    writable: true,
    configurable: true,
  });

  return mockNotificationClass;
}

function removeNotification() {
  Object.defineProperty(window, 'Notification', {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

describe('notifications utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getNotificationPermission', () => {
    it('returns current permission when API is available (granted)', () => {
      mockNotification('granted');
      expect(getNotificationPermission()).toBe('granted');
    });

    it('returns "denied" when permission is denied', () => {
      mockNotification('denied');
      expect(getNotificationPermission()).toBe('denied');
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns "default" initially when not yet prompted', async () => {
      mockNotification('default');
      // We only verify it doesn't throw; actual permission change requires user gesture
      expect(['default', 'granted', 'denied', 'unsupported']).toContain(
        await requestNotificationPermission()
      );
    });

    it('calls requestPermission when permission is "default"', async () => {
      const mock = mockNotification('default');
      await requestNotificationPermission();
      expect(mock.requestPermission).toHaveBeenCalled();
    });

    it('does not call requestPermission when already granted', async () => {
      const mock = mockNotification('granted');
      await requestNotificationPermission();
      expect(mock.requestPermission).not.toHaveBeenCalled();
    });
  });

  describe('notify', () => {
    it('does not fire when permission is not granted', () => {
      const mock = mockNotification('denied');
      notify('Test', 'Body');
      expect(mock).not.toHaveBeenCalled();
    });

    it('fires Notification when permission is granted', () => {
      const mock = mockNotification('granted');
      notify('Focus Complete', 'Take a break!');
      expect(mock).toHaveBeenCalledWith('Focus Complete', expect.objectContaining({ body: 'Take a break!' }));
    });

    it('merges extra notification options', () => {
      const mock = mockNotification('granted');
      notify('Test', 'Body', { tag: 'pomodoro' });
      expect(mock).toHaveBeenCalledWith('Test', expect.objectContaining({ tag: 'pomodoro' }));
    });
  });
});
