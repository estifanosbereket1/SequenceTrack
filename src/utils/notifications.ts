import { Alert, Platform } from 'react-native';

type NotificationModule = typeof import('expo-notifications');

let modulePromise: Promise<NotificationModule | null> | null = null;

async function loadNotificationsModule(): Promise<NotificationModule | null> {
  if (modulePromise) return modulePromise;
  modulePromise = (async () => {
    try {
      const mod = await import('expo-notifications');
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      return mod;
    } catch {
      return null;
    }
  })();
  return modulePromise;
}

export async function scheduleNotificationAsync(
  title: string,
  body: string,
  scheduledAt: Date,
  data?: Record<string, any>,
): Promise<string | null> {
  const mod = await loadNotificationsModule();
  if (mod) {
    try {
      const id = await mod.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: {
          type: mod.SchedulableTriggerInputTypes.DATE,
          date: scheduledAt,
        },
      });
      return id;
    } catch {
      return fallbackSchedule(title, body, scheduledAt);
    }
  }
  return fallbackSchedule(title, body, scheduledAt);
}

export async function cancelScheduledNotificationAsync(identifier: string): Promise<void> {
  const mod = await loadNotificationsModule();
  if (mod) {
    try {
      await mod.cancelScheduledNotificationAsync(identifier);
    } catch {
      // no-op fallback
    }
  }
}

export async function requestPermissionsAsync(): Promise<boolean> {
  const mod = await loadNotificationsModule();
  if (mod) {
    try {
      const { status } = await mod.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return fallbackPermissions();
    }
  }
  return fallbackPermissions();
}

export async function getPermissionsAsync(): Promise<boolean> {
  const mod = await loadNotificationsModule();
  if (mod) {
    try {
      const { status } = await mod.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

function fallbackSchedule(
  title: string,
  body: string,
  scheduledAt: Date,
): string | null {
  const fallbackId = `fallback-${Date.now()}`;
  setTimeout(() => {
    Alert.alert(title, body);
  }, Math.max(0, scheduledAt.getTime() - Date.now()));
  return fallbackId;
}

function fallbackPermissions(): boolean {
  if (Platform.OS === 'android') {
    return true;
  }
  return false;
}

export function isExpoGoFallback(): boolean {
  return modulePromise === null;
}
