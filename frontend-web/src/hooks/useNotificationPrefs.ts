import { useEffect, useState } from 'react';

export interface NotificationPrefs {
  mealReminders: boolean;
  mealReminderTimes: string[]; // 'HH:mm'
  weeklyReport: boolean;            // Yakında
  allergenAlerts: boolean;
  calorieOverAlert: boolean;
  newProductSuggestions: boolean;   // Yakında
  healthScoreDrops: boolean;
}

export const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  mealReminders: true,
  mealReminderTimes: ['08:00', '13:00', '19:00'],
  weeklyReport: false,
  allergenAlerts: true,
  calorieOverAlert: true,
  newProductSuggestions: false,
  healthScoreDrops: true
};

export const NOTIF_STORAGE_KEY = 'mindbite_notification_prefs';
const NOTIF_CHANGE_EVENT = 'mindbite:notif-change';

const readFromStorage = (): NotificationPrefs => {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIF_PREFS;
    return { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIF_PREFS;
  }
};

/**
 * Bildirim tercihlerini localStorage ile senkron tutar.
 * Aynı sekmedeki diğer componentler `mindbite:notif-change` event'iyle haberdar olur.
 */
export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(readFromStorage);

  useEffect(() => {
    const sync = () => setPrefs(readFromStorage());
    window.addEventListener('storage', sync);
    window.addEventListener(NOTIF_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(NOTIF_CHANGE_EVENT, sync);
    };
  }, []);

  const update = (next: NotificationPrefs) => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
    setPrefs(next);
    window.dispatchEvent(new Event(NOTIF_CHANGE_EVENT));
  };

  const patch = (partial: Partial<NotificationPrefs>) => update({ ...prefs, ...partial });

  return { prefs, update, patch };
}
