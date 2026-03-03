/**
 * Notification utility abstraction wrapping the Web Notifications API.
 * Handles browser support detection and permission management.
 */

export type NotificationSupport = 'supported' | 'unsupported';

/** Returns current permission status, or 'unsupported' if the API is unavailable. */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests notification permission from the user if not already decided.
 * Returns the resulting permission status.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

/**
 * Fires a browser notification if the API is supported and permission is granted.
 */
export function notify(
  title: string,
  body: string,
  options: NotificationOptions = {}
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    requireInteraction: true,
    ...options,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
