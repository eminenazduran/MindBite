import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUser, getScanHistory, fetchDailyAdvice, logNaturalMeal, fetchHealthScore } from '../api';
import { useAuth } from '../context/AuthContext';
import NotificationBanners from '../components/NotificationBanners';

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [advice, setAdvice] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<string>('porsiyon');
  const [logging, setLogging] = useState(false);

  const UNIT_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'porsiyon', label: 'Porsiyon' },
    { value: 'adet', label: 'Adet' },
    { value: 'dilim', label: 'Dilim' },
    { value: 'kase', label: 'Kase' },
    { value: 'tabak', label: 'Tabak' },
    { value: 'yemek kaşığı', label: 'Yemek kaşığı' },
    { value: 'tatlı kaşığı', label: 'Tatlı kaşığı' },
    { value: 'çay kaşığı', label: 'Çay kaşığı' },
    { value: 'su bardağı', label: 'Su bardağı' },
    { value: 'çay bardağı', label: 'Çay bardağı' },
    { value: 'avuç', label: 'Avuç' },
    { value: 'gram', label: 'Gram' },
    { value: 'mililitre', label: 'Mililitre' }
  ];

  const loadData = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const [userRes, historyRes, adviceRes, healthRes] = await Promise.all([
        fetchUser(authUser.id),
        getScanHistory(authUser.id, 20),
        fetchDailyAdvice(),
        fetchHealthScore(authUser.id, 7)
      ]);

      if (userRes.status === 'success') setUser(userRes.data);
      if (historyRes.status === 'success') setHistory(historyRes.data);
      if (adviceRes.status === 'success') setAdvice(adviceRes.data);
      if (healthRes.status === 'success') setHealthScore(healthRes.data);
    } catch (err) {
      console.error('Dashboard yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNaturalLog = async () => {
    const targetUserId = user?.id || user?._id || authUser?.id;
    const trimmedFood = foodName.trim();
    const qtyNum = Number(quantity.replace(',', '.'));

    if (!trimmedFood || !targetUserId || !Number.isFinite(qtyNum) || qtyNum <= 0) {
      console.warn('Cannot log meal: missing data', { trimmedFood, qtyNum, targetUserId });
      return;
    }

    const description = `${qtyNum} ${unit} ${trimmedFood}`;

    setLogging(true);
    try {
      const res = await logNaturalMeal(targetUserId, description);
      if (res.status === 'success') {
        setFoodName('');
        setQuantity('1');
        setUnit('porsiyon');
        await loadData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error('Meal logging error:', err);
    } finally {
      setLogging(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="pt-32 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-primary font-headline font-semibold">Yükleniyor...</p>
      </div>
    );
  }

  // Bugünün verilerini filtrele ve hesapla
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayHistory = history.filter(h => new Date(h.createdAt).getTime() >= todayStart);

  const totals = todayHistory.reduce((acc, h) => {
    const food = h.foodId;
    const factor = (h.servingSize || 100) / 100;
    if (food) {
      acc.calories += (food.calories || 0) * factor;
      acc.protein += (food.protein || 0) * factor;
      acc.carbohydrates += (food.carbohydrates || 0) * factor;
      acc.fat += (food.fat || 0) * factor;
    }
    return acc;
  }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0 });

  const calorieGoal = user?.calorieGoal || 2000;
  const goals = {
    calories: calorieGoal,
    protein: Math.round(calorieGoal * 0.15 / 4),
    carbs: Math.round(calorieGoal * 0.55 / 4),
    fat: Math.round(calorieGoal * 0.30 / 9),
  };

  const calPercentage = Math.min((totals.calories / goals.calories) * 100, 100);
  const strokeDashoffset = 364 - (364 * calPercentage) / 100;

  return (
    <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8">
      {/* Bildirim Banner'ları */}
      <NotificationBanners
        history={history}
        totalCalories={totals.calories}
        calorieGoal={calorieGoal}
        todayScore={healthScore?.today?.score ?? null}
        weeklyAvg={healthScore?.weekly?.average ?? null}
      />

      {/* Üst Bilgi ve Hızlı Giriş */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        <div className="lg:col-span-5 space-y-2">
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-primary">
            Merhaba, {user?.name || 'Misafir'}
          </h1>
          <p className="text-on-surface-variant font-medium text-lg">
            Bugün hedeflerine ulaşmak için harika bir gün.
          </p>
        </div>
        <div className="lg:col-span-7">
          <div className="bg-white/40 backdrop-blur-md p-4 rounded-3xl border border-primary/10 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Yemek adı */}
              <div className="md:col-span-5 relative">
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNaturalLog()}
                  placeholder="Yemek (örn. yoğurt)"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-none ring-1 ring-primary/10 focus:ring-2 focus:ring-primary shadow-inner bg-surface-container-lowest outline-none font-medium"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/40 text-xl">restaurant</span>
              </div>

              {/* Miktar */}
              <div className="md:col-span-2 relative">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNaturalLog()}
                  placeholder="Miktar"
                  className="w-full px-4 py-3 rounded-2xl border-none ring-1 ring-primary/10 focus:ring-2 focus:ring-primary shadow-inner bg-surface-container-lowest outline-none font-medium text-center"
                />
              </div>

              {/* Birim */}
              <div className="md:col-span-3 relative">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-none ring-1 ring-primary/10 focus:ring-2 focus:ring-primary shadow-inner bg-surface-container-lowest outline-none font-medium appearance-none cursor-pointer pr-10"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 text-xl pointer-events-none">expand_more</span>
              </div>

              {/* Butonlar */}
              <div className="md:col-span-2 flex gap-2 items-center">
                <button
                  onClick={handleNaturalLog}
                  disabled={logging || !foodName.trim()}
                  className="flex-1 px-4 py-3.5 hero-gradient text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {logging ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">add</span>
                      <span className="hidden sm:inline">Ekle</span>
                    </>
                  )}
                </button>
                <Link
                  to="/analysis"
                  className="p-3.5 bg-surface-container-high rounded-2xl text-on-surface hover:bg-surface-container-highest transition-colors flex items-center justify-center"
                  title="Barkod Tara"
                >
                  <span className="material-symbols-outlined">barcode_scanner</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sol Kolon: Sağlık Puanı ve AI Koçu */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Sağlık Puanı */}
          <HealthScoreCard data={healthScore} />

          {/* Günün Tavsiyesi Kartı */}
          <section className="bg-emerald-950 text-emerald-50 p-8 rounded-3xl border border-emerald-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-400">lightbulb</span>
              </div>
              <h3 className="text-lg font-headline font-bold">Günün Tavsiyesi</h3>
            </div>
            <ul className="space-y-4">
              {(advice?.tips || ['Öğünlerini girmeye devam et, analiz yapalım!']).slice(0, 3).map((tip: string, i: number) => (
                <li key={i} className="text-sm leading-relaxed flex gap-3 opacity-90">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </aside>

        {/* Sağ Kolon: Besin Grafikleri ve Geçmiş */}
        <div className="lg:col-span-8 space-y-8">
          {/* Besin Dağılımı Kartı */}
          <section className="glass-card p-8 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-headline font-bold">Besin Dağılımı</h2>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-full text-primary font-bold text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Bugün
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="flex justify-center relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle className="text-surface-container-high" cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12"></circle>
                  <circle 
                    className="text-primary transition-all duration-1000 ease-out" 
                    cx="96" cy="96" r="88" 
                    fill="transparent" 
                    stroke="currentColor" 
                    strokeDasharray="552.92" 
                    strokeDashoffset={552.92 - (552.92 * calPercentage) / 100} 
                    strokeLinecap="round" 
                    strokeWidth="14"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center transform rotate-90">
                  <span className="text-4xl font-extrabold font-headline text-primary">{Math.round(totals.calories).toLocaleString()}</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">KCAL</span>
                  <div className="mt-1 h-px w-12 bg-outline-variant/30"></div>
                  <span className="text-xs font-medium text-on-surface-variant mt-1">Hedef: {goals.calories}</span>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { label: 'Protein', val: totals.protein, target: goals.protein, color: 'bg-primary' },
                  { label: 'Karbonhidrat', val: totals.carbohydrates, target: goals.carbs, color: 'bg-secondary' },
                  { label: 'Yağ', val: totals.fat, target: goals.fat, color: 'bg-tertiary' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-on-surface">{item.label}</span>
                      <span className="text-xs font-bold text-on-surface-variant">
                        <span className="text-sm text-on-surface font-extrabold">{Math.round(item.val)}g</span> / {item.target}g
                      </span>
                    </div>
                    <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-sm`}
                        style={{ width: `${Math.min((item.val / item.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* AI Analiz Özet Paneli */}
          <section className="bg-gradient-to-br from-primary to-primary-container p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 opacity-10">
              <span className="material-symbols-outlined text-[150px]">psychology</span>
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-widest text-xs">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                AI Beslenme Analizi
              </div>
              <p className="text-xl font-headline font-bold leading-relaxed italic">
                "{advice?.summary || 'Taramaların yapay zeka tarafından analiz ediliyor. Bugün neler yediğini merak ediyorum!'}"
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {advice?.recommendations?.map((tag: string, i: number) => (
                  <span key={i} className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold border border-white/10 text-white/90">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Son Aktiviteler */}
          <section className="space-y-4">
             <div className="flex justify-between items-center px-2">
               <h2 className="text-2xl font-headline font-bold text-on-surface">Son Taramalar</h2>
               <button className="text-primary font-bold text-sm hover:underline">Tümünü Gör</button>
             </div>
             {history.length === 0 ? (
               <div className="glass-card p-12 rounded-3xl text-center border-dashed border-2 border-outline-variant/30">
                 <p className="text-on-surface-variant font-medium">Henüz bir veri girişi yapmadın.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {history.slice(0, 4).map((scan: any) => (
                   <div key={scan._id} className="bg-white/60 p-5 rounded-2xl border border-primary/5 hover:border-primary/20 transition-all flex items-center justify-between group shadow-sm">
                     <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scan.analysisResult?.safeToConsume ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                         <span className="material-symbols-outlined text-2xl">
                           {scan.foodId?.isGeneric ? 'restaurant' : 'barcode'}
                         </span>
                       </div>
                       <div>
                         <h4 className="font-bold text-on-surface text-sm line-clamp-1">{scan.foodId?.productName}</h4>
                         <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tight">
                           {new Date(scan.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                         </p>
                       </div>
                     </div>
                     <div className="text-right">
                       <span className="text-sm font-extrabold text-primary">{Math.round(scan.foodId?.calories)}</span>
                       <span className="text-[10px] font-bold text-on-surface-variant ml-1">KCAL</span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </section>
        </div>
      </div>
    </main>
  );
}

// ───────────────────────────────────────────────────────────────
// Sağlık Puanı Kartı — kompozit skor + bileşenler + 7 günlük trend
// ───────────────────────────────────────────────────────────────

interface HealthScoreCardProps {
  data: any;
}

function HealthScoreCard({ data }: HealthScoreCardProps) {
  const todayScore = data?.today?.score ?? null;
  const weeklyAvg = data?.weekly?.average ?? null;
  const breakdown = data?.today?.breakdown;
  const daily: Array<{ date: string; score: number | null; calories: number }> = data?.weekly?.daily || [];

  const scoreColor = (score: number | null): string => {
    if (score === null) return 'text-on-surface-variant';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-amber-500';
    return 'text-error';
  };

  const scoreLabel = (score: number | null): string => {
    if (score === null) return 'Veri Yok';
    if (score >= 80) return 'Mükemmel';
    if (score >= 60) return 'İyi';
    if (score >= 40) return 'Orta';
    if (score >= 20) return 'Dikkat';
    return 'Düşük';
  };

  const trendDiff =
    typeof todayScore === 'number' && typeof weeklyAvg === 'number' ? todayScore - weeklyAvg : null;

  const components = breakdown
    ? [
        {
          key: 'calories',
          icon: 'local_fire_department',
          label: 'Kalori',
          value: breakdown.calories.value,
          max: breakdown.calories.weight,
          detail: `${breakdown.calories.actual} / ${breakdown.calories.target} kcal`
        },
        {
          key: 'macros',
          icon: 'pie_chart',
          label: 'Makro Dengesi',
          value: breakdown.macros.value,
          max: breakdown.macros.weight,
          detail: `P%${breakdown.macros.protein_pct} · K%${breakdown.macros.carb_pct} · Y%${breakdown.macros.fat_pct}`
        },
        {
          key: 'quality',
          icon: 'eco',
          label: 'Gıda Kalitesi',
          value: breakdown.quality.value,
          max: breakdown.quality.weight,
          detail: `Ort. ${(breakdown.quality.average * 100).toFixed(0)}/100`
        },
        {
          key: 'variety',
          icon: 'restaurant_menu',
          label: 'Çeşitlilik',
          value: breakdown.variety.value,
          max: breakdown.variety.weight,
          detail: `${breakdown.variety.categoryCount} gıda grubu`
        },
        {
          key: 'safety',
          icon: 'shield',
          label: 'Güvenlik',
          value: breakdown.safety.value,
          max: breakdown.safety.weight,
          detail:
            breakdown.safety.highRiskCount > 0
              ? `${breakdown.safety.highRiskCount} yüksek risk`
              : 'Temiz'
        }
      ]
    : [];

  const maxMiniBar = Math.max(...daily.map((d) => d.score ?? 0), 1);

  return (
    <section className="glass-card p-7 rounded-3xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-primary/10 transition-all"></div>

      <h2 className="text-label-md font-bold text-secondary tracking-widest uppercase mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">analytics</span>
        Sağlık Puanı
      </h2>

      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className={`text-7xl font-headline font-extrabold ${scoreColor(todayScore)}`}>
              {todayScore ?? '—'}
            </span>
            <span className="text-xl font-bold text-on-surface-variant">/100</span>
          </div>
          <p className={`text-sm font-bold mt-1 ${scoreColor(todayScore)}`}>
            {scoreLabel(todayScore)} · Bugün
          </p>
        </div>

        {weeklyAvg !== null && (
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">7 Gün Ort.</p>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-2xl font-headline font-extrabold text-on-surface">{weeklyAvg}</span>
              {trendDiff !== null && trendDiff !== 0 && (
                <span
                  className={`material-symbols-outlined text-base ${
                    trendDiff > 0 ? 'text-emerald-600' : 'text-error'
                  }`}
                  title={`${trendDiff > 0 ? '+' : ''}${trendDiff}`}
                >
                  {trendDiff > 0 ? 'trending_up' : 'trending_down'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trend mini chart (7 gün) */}
      {daily.length > 0 && (
        <div className="mt-4 flex items-end gap-1 h-12">
          {daily.map((d, i) => {
            const h = d.score !== null ? (d.score / maxMiniBar) * 100 : 0;
            const isToday = i === daily.length - 1;
            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${d.date}: ${d.score ?? 'veri yok'}`}
              >
                <div className="flex-1 w-full flex items-end">
                  <div
                    className={`w-full rounded-t-md transition-all duration-700 ${
                      d.score === null
                        ? 'bg-surface-container-high'
                        : isToday
                        ? 'bg-primary'
                        : 'bg-primary/40'
                    }`}
                    style={{ height: `${Math.max(h, 8)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bileşen kırılımı */}
      {components.length > 0 && (
        <div className="mt-6 space-y-2.5 pt-4 border-t border-outline-variant/20">
          {components.map((c) => (
            <div key={c.key} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base text-primary/60">{c.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-xs font-bold text-on-surface">{c.label}</span>
                  <span className="text-[11px] font-bold text-on-surface-variant">
                    <span className="text-on-surface">{c.value}</span>/{c.max}
                  </span>
                </div>
                <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000"
                    style={{ width: `${(c.value / c.max) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-0.5">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {todayScore === null && (
        <p className="text-sm font-medium text-on-surface-variant text-center mt-4">
          Bugün henüz öğün eklenmedi. Hedefin için giriş yap!
        </p>
      )}
    </section>
  );
}
