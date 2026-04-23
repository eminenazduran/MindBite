import { useEffect, useRef } from 'react';
import { useNotificationPrefs } from './useNotificationPrefs';

const LAST_FIRED_KEY = 'mindbite_last_reminder';

/**
 * Sayfa açıkken öğün hatırlatma saatlerini kontrol eder.
 * Eşleşen saatte bir kereye mahsus tarayıcı bildirimi gönderir.
 * Kullanıcı izni yoksa ilk kullanımda ister.
 */
export function useMealReminders() {
  const { prefs } = useNotificationPrefs();
  const checked = useRef(false);

  useEffect(() => {
    if (!prefs.mealReminders || prefs.mealReminderTimes.length === 0) return;
    if (typeof Notification === 'undefined') return;

    // İlk yüklemede tek bir kere izin iste (kullanıcı reddetmemişse)
    if (!checked.current && Notification.permission === 'default') {
      checked.current = true;
      Notification.requestPermission().catch(() => undefined);
    }

    const tick = () => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      const today = now.toISOString().slice(0, 10);
      const key = `${today}@${timeStr}`;

      if (!prefs.mealReminderTimes.includes(timeStr)) return;

      const fired = localStorage.getItem(LAST_FIRED_KEY);
      if (fired === key) return; // bugün bu saat için zaten atıldı

      localStorage.setItem(LAST_FIRED_KEY, key);

      try {
        new Notification('MindBite — Öğün Hatırlatması', {
          body: `Saat ${timeStr}. Öğününü uygulamaya ekleyip sağlık puanını güncelle.`,
          icon: '/favicon.svg',
          tag: 'mindbite-meal-reminder'
        });
      } catch {
        // Bildirim oluşturulamadı (çok nadir)
      }
    };

    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [prefs.mealReminders, prefs.mealReminderTimes]);
}
