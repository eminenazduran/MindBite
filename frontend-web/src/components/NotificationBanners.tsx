import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationPrefs } from '../hooks/useNotificationPrefs';

interface Props {
  history: any[];
  totalCalories: number;
  calorieGoal: number;
  todayScore: number | null;
  weeklyAvg: number | null;
}

const DISMISS_KEY = 'mindbite_dismissed_banners';
const readDismissed = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
  } catch {
    return {};
  }
};

export default function NotificationBanners({ history, totalCalories, calorieGoal, todayScore, weeklyAvg }: Props) {
  const { prefs } = useNotificationPrefs();
  const [dismissed, setDismissed] = useState<Record<string, string>>(readDismissed);

  const today = new Date().toISOString().slice(0, 10);

  const dismiss = (key: string) => {
    const next = { ...dismissed, [key]: today };
    localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    setDismissed(next);
  };

  const isDismissedToday = (key: string) => dismissed[key] === today;

  // Alerjen — son 24 saat içinde HIGH risk tarama
  const recentAllergen = useMemo(() => {
    if (!prefs.allergenAlerts) return null;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return history.find(
      (h: any) =>
        h.analysisResult?.riskLevel === 'HIGH' &&
        new Date(h.createdAt).getTime() >= dayAgo
    );
  }, [prefs.allergenAlerts, history]);

  // Kalori aşımı — bugünkü toplam hedefi geçti mi?
  const calorieOver = prefs.calorieOverAlert && calorieGoal > 0 && totalCalories > calorieGoal;
  const caloriePct = calorieGoal > 0 ? Math.round((totalCalories / calorieGoal) * 100) : 0;

  // Puan düşüşü — bugün 7g-ort'tan 10+ puan aşağıda
  const scoreDrop =
    prefs.healthScoreDrops &&
    todayScore !== null &&
    weeklyAvg !== null &&
    todayScore < weeklyAvg - 10;

  const banners: Array<{
    key: string;
    tone: 'error' | 'warning' | 'info';
    icon: string;
    title: string;
    body: React.ReactNode;
    action?: { label: string; to: string };
  }> = [];

  if (recentAllergen && !isDismissedToday('allergen')) {
    banners.push({
      key: 'allergen',
      tone: 'error',
      icon: 'warning',
      title: 'Alerjen Tespit Edildi',
      body: (
        <>
          Son 24 saatte <strong>{recentAllergen.foodId?.productName || 'bir ürün'}</strong> alerji
          profilinle çakıştı. Uyarıları profil tercihlerinden yönetebilirsin.
        </>
      )
    });
  }

  if (calorieOver && !isDismissedToday('calorie')) {
    banners.push({
      key: 'calorie',
      tone: 'warning',
      icon: 'local_fire_department',
      title: 'Günlük Kalori Hedefi Aşıldı',
      body: (
        <>
          Bugün <strong>{Math.round(totalCalories)} kcal</strong> aldın; hedefin {calorieGoal} kcal
          (%{caloriePct}). Kalan günü daha hafif öğünlerle dengeleyebilirsin.
        </>
      )
    });
  }

  if (scoreDrop && !isDismissedToday('score-drop')) {
    banners.push({
      key: 'score-drop',
      tone: 'info',
      icon: 'trending_down',
      title: 'Sağlık Puanı Düşüşte',
      body: (
        <>
          Bugünkü puanın <strong>{todayScore}</strong>, 7 günlük ortalamanın{' '}
          <strong>{weeklyAvg}</strong>'in altında. Çeşitlilik ve sebze/meyve miktarını artırmayı dene.
        </>
      ),
      action: { label: 'Öğün Ekle', to: '/dashboard' }
    });
  }

  if (banners.length === 0) return null;

  return (
    <div className="space-y-3">
      {banners.map((b) => {
        const toneCls =
          b.tone === 'error'
            ? 'bg-error/5 border-error/30'
            : b.tone === 'warning'
            ? 'bg-amber-50 border-amber-300/50'
            : 'bg-primary/5 border-primary/30';
        const iconCls =
          b.tone === 'error'
            ? 'bg-error/15 text-error'
            : b.tone === 'warning'
            ? 'bg-amber-500/15 text-amber-700'
            : 'bg-primary/15 text-primary';
        const titleCls =
          b.tone === 'error'
            ? 'text-error'
            : b.tone === 'warning'
            ? 'text-amber-800'
            : 'text-primary';

        return (
          <div key={b.key} className={`flex items-start gap-4 p-4 rounded-2xl border ${toneCls}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconCls}`}>
              <span className="material-symbols-outlined">{b.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold ${titleCls}`}>{b.title}</p>
              <p className="text-sm text-on-surface mt-0.5">{b.body}</p>
              {b.action && (
                <Link
                  to={b.action.to}
                  className="inline-flex items-center gap-1 text-sm font-bold text-primary mt-2 hover:underline"
                >
                  {b.action.label}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              )}
            </div>
            <button
              onClick={() => dismiss(b.key)}
              className="flex-shrink-0 w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center"
              aria-label="Kapat"
            >
              <span className="material-symbols-outlined text-base text-on-surface-variant">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
