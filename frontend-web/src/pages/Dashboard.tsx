import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUser, getScanHistory, fetchDailyAdvice, logNaturalMeal, fetchHealthScore, unmarkScanConsumed, deleteScan } from '../api';
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

    if (!trimmedFood || !targetUserId || !Number.isFinite(qtyNum) || qtyNum <= 0) return;

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

  // Sadece "Tükettim" onaylı kayıtlar günlük kalori/makro toplamına dahil edilir.
  // Diğerleri "geçmiş tarama" olarak listede görünür ama kalori sayacına yazmaz.
  const consumedToday = todayHistory.filter(h => h.consumed === true);
  const pendingToday = todayHistory.filter(h => h.consumed !== true && h.dismissed !== true);

  const totals = consumedToday.reduce((acc, h) => {
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

  const handleUnmarkConsumed = async (scanId: string) => {
    try {
      const res = await unmarkScanConsumed(scanId);
      if (res.status === 'success') await loadData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!confirm('Bu taramayı geçmişten silmek istediğinize emin misiniz?')) return;
    try {
      const res = await deleteScan(scanId);
      if (res.status === 'success') await loadData();
    } catch (e) { console.error(e); }
  };

  const calorieGoal = user?.calorieGoal || 2000;
  const goals = {
    calories: calorieGoal,
    protein: Math.round(calorieGoal * 0.15 / 4),
    carbs: Math.round(calorieGoal * 0.55 / 4),
    fat: Math.round(calorieGoal * 0.30 / 9),
  };

  const calPercentage = Math.min((totals.calories / goals.calories) * 100, 100);

  const todayScore = healthScore?.today?.score ?? null;
  const weeklyAvg = healthScore?.weekly?.average ?? null;

  return (
    <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-6">
      {/* Bildirim banner'ları */}
      <NotificationBanners
        history={history}
        totalCalories={totals.calories}
        calorieGoal={calorieGoal}
        todayScore={todayScore}
        weeklyAvg={weeklyAvg}
      />

      {/* ── 1. KARŞILAMA + HIZLI ÖZET PILL'LERİ ────────────── */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-primary">
            Merhaba, {user?.name || 'Misafir'}
          </h1>
          <p className="text-on-surface-variant font-medium">
            Bugün hedeflerine ulaşmak için harika bir gün.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SummaryPill
            icon="local_fire_department"
            label="Kalori"
            value={`${Math.round(totals.calories)} / ${goals.calories}`}
            tone="primary"
          />
          <SummaryPill
            icon="favorite"
            label="Sağlık Puanı"
            value={todayScore !== null ? `${todayScore}/100` : '—'}
            tone="tertiary"
          />
        </div>
      </section>

      {/* ── Onay bekleyen taramalar bilgi banner'ı (Analysis sayfasına yönlendirir) ─── */}
      {pendingToday.length > 0 && (
        <Link
          to="/analysis"
          className="block bg-tertiary/10 border border-tertiary/20 rounded-2xl px-4 py-3 hover:bg-tertiary/15 transition group"
        >
          <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
            <div className="w-10 h-10 rounded-xl bg-tertiary/15 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-tertiary">pending_actions</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-on-surface text-sm">
                {pendingToday.length} tarama tüketim onayı bekliyor
              </p>
              <p className="text-xs text-on-surface-variant">
                Tarama geçmişinizi <strong>Analiz sayfasında</strong> yönetin ve tükettiğinizi onaylayın.
              </p>
            </div>
            <span className="material-symbols-outlined text-tertiary group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
        </Link>
      )}

      {/* ── 2. HIZLI ÖĞÜN EKLE ──────────────────────────────── */}
      <section className="bg-surface-container-lowest/70 backdrop-blur-md rounded-3xl border border-primary/10 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="material-symbols-outlined text-primary text-lg">add_circle</span>
          <h2 className="font-headline font-bold text-base text-on-surface">Hızlı Öğün Ekle</h2>
          <span className="text-xs text-on-surface-variant ml-auto hidden sm:block">
            Yemek, miktar ve birim seçin — saniyeler içinde panonuza işlensin.
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <input
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNaturalLog()}
              placeholder="Yemek (örn. yoğurt, makarna, simit)"
              className="w-full pl-11 pr-4 py-3 rounded-2xl ring-1 ring-primary/10 focus:ring-2 focus:ring-primary bg-surface-container-lowest outline-none font-medium"
            />
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/40 text-xl">restaurant</span>
          </div>
          <div className="md:col-span-2">
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNaturalLog()}
              placeholder="Miktar"
              className="w-full px-4 py-3 rounded-2xl ring-1 ring-primary/10 focus:ring-2 focus:ring-primary bg-surface-container-lowest outline-none font-medium text-center"
            />
          </div>
          <div className="md:col-span-3 relative">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl ring-1 ring-primary/10 focus:ring-2 focus:ring-primary bg-surface-container-lowest outline-none font-medium appearance-none cursor-pointer pr-10"
            >
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 text-xl pointer-events-none">expand_more</span>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button
              onClick={handleNaturalLog}
              disabled={logging || !foodName.trim()}
              className="flex-1 px-4 py-3 hero-gradient text-white font-bold rounded-2xl shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {logging ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Ekle</span>
                </>
              )}
            </button>
            <Link
              to="/analysis"
              className="p-3 bg-surface-container-high rounded-2xl text-on-surface hover:bg-surface-container-highest transition-colors flex items-center justify-center"
              title="Barkod Tara"
            >
              <span className="material-symbols-outlined">barcode_scanner</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. BESİN DAĞILIMI (col-7) + SAĞLIK PUANI ÖZET (col-5) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Besin Dağılımı */}
        <div className="lg:col-span-7 glass-card p-7 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-headline font-bold">Besin Dağılımı</h2>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full text-primary font-bold text-[11px] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Bugün
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center relative">
              <svg className="w-44 h-44 transform -rotate-90">
                <circle className="text-surface-container-high" cx="88" cy="88" r="78" fill="transparent" stroke="currentColor" strokeWidth="12"></circle>
                <circle
                  className="text-primary transition-all duration-1000 ease-out"
                  cx="88" cy="88" r="78"
                  fill="transparent"
                  stroke="currentColor"
                  strokeDasharray="490"
                  strokeDashoffset={490 - (490 * calPercentage) / 100}
                  strokeLinecap="round"
                  strokeWidth="14"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold font-headline text-primary leading-none">{Math.round(totals.calories).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">KCAL</span>
                <div className="mt-1.5 h-px w-10 bg-outline-variant/30"></div>
                <span className="text-[11px] font-medium text-on-surface-variant mt-1.5">Hedef: {goals.calories}</span>
              </div>
            </div>

            <div className="space-y-5">
              {[
                { label: 'Protein', val: totals.protein, target: goals.protein, color: 'bg-primary' },
                { label: 'Karbonhidrat', val: totals.carbohydrates, target: goals.carbs, color: 'bg-secondary' },
                { label: 'Yağ', val: totals.fat, target: goals.fat, color: 'bg-tertiary' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-on-surface text-sm">{item.label}</span>
                    <span className="text-xs font-bold text-on-surface-variant">
                      <span className="text-on-surface font-extrabold">{Math.round(item.val)}g</span> / {item.target}g
                    </span>
                  </div>
                  <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-sm`}
                      style={{ width: `${Math.min((item.val / item.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağlık Puanı Özet (slim) */}
        <div className="lg:col-span-5">
          <HealthScoreSummary data={healthScore} />
        </div>
      </section>

      {/* ── 4. SAĞLIK PUANI BİLEŞENLERİ (5'li yatay) ─────── */}
      {healthScore?.today?.breakdown && (
        <HealthScoreBreakdownRow breakdown={healthScore.today.breakdown} />
      )}

      {/* ── 5. AI ANALİZ (col-8) + GÜNÜN TAVSİYESİ (col-4) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="bg-gradient-to-br from-primary to-primary-container p-7 rounded-3xl text-white shadow-lg relative overflow-hidden h-full">
            <div className="absolute -bottom-10 -right-10 opacity-10">
              <span className="material-symbols-outlined text-[150px]">psychology</span>
            </div>
            <div className="relative z-10 space-y-3 h-full flex flex-col">
              <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-widest text-xs">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                AI Beslenme Analizi
              </div>
              <p className="text-lg md:text-xl font-headline font-bold leading-relaxed italic">
                "{advice?.summary || 'Taramaların yapay zeka tarafından analiz ediliyor. Bugün neler yediğini merak ediyorum!'}"
              </p>
              {advice?.recommendations?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 mt-auto">
                  {advice.recommendations.slice(0, 4).map((tag: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-bold border border-white/10 text-white/90">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <section className="bg-emerald-950 text-emerald-50 p-6 rounded-3xl border border-emerald-800 shadow-xl space-y-4 h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-400">lightbulb</span>
              </div>
              <h3 className="text-base font-headline font-bold">Günün Tavsiyesi</h3>
            </div>
            <ul className="space-y-3">
              {(advice?.tips || ['Öğünlerini girmeye devam et, analiz yapalım!']).slice(0, 3).map((tip: string, i: number) => (
                <li key={i} className="text-xs leading-relaxed flex gap-2 opacity-90">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      {/* ── 6. BUGÜNKÜ TÜKETİMLER (sadece consumed) ───────────── */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-headline font-bold text-on-surface">Bugünkü Tüketimler</h2>
          <Link to="/analysis" className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-base">history</span>
            Tarama Geçmişi
          </Link>
        </div>
        {consumedToday.length === 0 ? (
          <div className="glass-card p-10 rounded-3xl text-center border-dashed border-2 border-outline-variant/30">
            <span className="material-symbols-outlined text-on-surface-variant/50 text-5xl">restaurant</span>
            <p className="text-on-surface-variant font-medium mt-2">Bugün henüz tüketim kaydı yok.</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Yukarıdan hızlı öğün ekleyebilir ya da <Link to="/analysis" className="text-primary font-bold underline">ürün tarayıp</Link> "Tükettim" diyebilirsin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {consumedToday.slice(0, 6).map((scan: any) => {
              const isHighRisk = scan.analysisResult?.safeToConsume === false;
              const factor = (scan.servingSize || 100) / 100;
              const totalKcal = Math.round((scan.foodId?.calories || 0) * factor);

              return (
                <div
                  key={scan._id}
                  className="p-4 rounded-2xl border bg-surface-container-lowest/70 border-primary/10 hover:border-primary/30 transition-all flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isHighRisk ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                    }`}>
                      <span className="material-symbols-outlined text-xl">
                        {scan.foodId?.isGeneric ? 'restaurant' : 'inventory_2'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-on-surface text-sm line-clamp-1">{scan.foodId?.productName}</h4>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-extrabold uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[11px]">check</span>
                          Tüketildi
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tight mt-0.5">
                        {new Date(scan.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{scan.servingSize || 100}g
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-primary">{totalKcal}</span>
                      <span className="text-[10px] font-bold text-on-surface-variant ml-0.5">KCAL</span>
                    </div>
                    <button
                      onClick={() => handleUnmarkConsumed(scan._id)}
                      className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant flex items-center justify-center transition"
                      title="Tüketim kaydını geri al"
                    >
                      <span className="material-symbols-outlined text-base">undo</span>
                    </button>
                    <button
                      onClick={() => handleDeleteScan(scan._id)}
                      className="w-8 h-8 rounded-lg bg-transparent hover:bg-error/10 text-on-surface-variant hover:text-error flex items-center justify-center transition"
                      title="Geçmişten sil"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

// ───────────────────────────────────────────────────────────────
// Helper Components
// ───────────────────────────────────────────────────────────────

function SummaryPill({
  icon, label, value, tone,
}: { icon: string; label: string; value: string; tone: 'primary' | 'secondary' | 'tertiary' }) {
  const toneClass =
    tone === 'primary' ? 'bg-primary/10 text-primary'
    : tone === 'secondary' ? 'bg-secondary/10 text-secondary'
    : 'bg-tertiary/10 text-tertiary';

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${toneClass} border border-current/10`}>
      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</span>
        <span className="text-sm font-extrabold">{value}</span>
      </div>
    </div>
  );
}

function HealthScoreSummary({ data }: { data: any }) {
  const todayScore = data?.today?.score ?? null;
  const weeklyAvg = data?.weekly?.average ?? null;
  const daily: Array<{ date: string; score: number | null }> = data?.weekly?.daily || [];

  const scoreColor = (s: number | null) =>
    s === null ? 'text-on-surface-variant'
    : s >= 80 ? 'text-primary'
    : s >= 60 ? 'text-primary'
    : s >= 40 ? 'text-tertiary'
    : 'text-error';

  const scoreLabel = (s: number | null) =>
    s === null ? 'Veri Yok'
    : s >= 80 ? 'Mükemmel'
    : s >= 60 ? 'İyi'
    : s >= 40 ? 'Orta'
    : s >= 20 ? 'Dikkat'
    : 'Düşük';

  const trendDiff = typeof todayScore === 'number' && typeof weeklyAvg === 'number'
    ? todayScore - weeklyAvg
    : null;

  const maxBar = Math.max(...daily.map(d => d.score ?? 0), 1);
  const dayShort = ['P', 'P', 'S', 'Ç', 'P', 'C', 'C']; // basit kısaltmalar

  return (
    <section className="glass-card p-7 rounded-3xl shadow-sm relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="text-xs font-bold text-secondary tracking-widest uppercase flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">favorite</span>
          Sağlık Puanı
        </h2>
        {weeklyAvg !== null && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            7 Gün Ort. <span className="text-on-surface text-sm font-extrabold ml-1">{weeklyAvg}</span>
          </span>
        )}
      </div>

      <div className="flex items-end gap-3 relative z-10">
        <div className="flex items-baseline gap-1">
          <span className={`text-6xl md:text-7xl font-headline font-extrabold leading-none ${scoreColor(todayScore)}`}>
            {todayScore ?? '—'}
          </span>
          <span className="text-lg font-bold text-on-surface-variant">/100</span>
        </div>
        <div className="pb-2 space-y-0.5">
          <p className={`text-xs font-bold ${scoreColor(todayScore)}`}>{scoreLabel(todayScore)}</p>
          {trendDiff !== null && trendDiff !== 0 && (
            <div className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${trendDiff > 0 ? 'text-primary' : 'text-error'}`}>
              <span className="material-symbols-outlined text-sm">
                {trendDiff > 0 ? 'trending_up' : 'trending_down'}
              </span>
              <span>{trendDiff > 0 ? '+' : ''}{trendDiff}</span>
            </div>
          )}
        </div>
      </div>

      {/* 7 günlük trend */}
      {daily.length > 0 && (
        <div className="mt-6 relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Son 7 Gün</p>
          <div className="flex items-end gap-1.5 h-16">
            {daily.map((d, i) => {
              const h = d.score !== null ? (d.score / maxBar) * 100 : 0;
              const isToday = i === daily.length - 1;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="flex-1 w-full flex items-end" title={`${d.date}: ${d.score ?? '—'}`}>
                    <div
                      className={`w-full rounded-md transition-all duration-700 ${
                        d.score === null ? 'bg-surface-container-high'
                        : isToday ? 'bg-primary'
                        : 'bg-primary/40'
                      }`}
                      style={{ height: `${Math.max(h, 8)}%` }}
                    />
                  </div>
                  <span className={`text-[9px] font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                    {dayShort[new Date(d.date).getDay()] || '?'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {todayScore === null && (
        <p className="text-xs font-medium text-on-surface-variant text-center mt-4 relative z-10">
          Bugün için öğün ekle, puanın oluşsun.
        </p>
      )}
    </section>
  );
}

function HealthScoreBreakdownRow({ breakdown }: { breakdown: any }) {
  const items = [
    {
      icon: 'local_fire_department',
      label: 'Kalori',
      value: breakdown.calories.value,
      max: breakdown.calories.weight,
      detail: `${breakdown.calories.actual} / ${breakdown.calories.target} kcal`
    },
    {
      icon: 'pie_chart',
      label: 'Makro Dengesi',
      value: breakdown.macros.value,
      max: breakdown.macros.weight,
      detail: `P%${breakdown.macros.protein_pct} · K%${breakdown.macros.carb_pct} · Y%${breakdown.macros.fat_pct}`
    },
    {
      icon: 'eco',
      label: 'Gıda Kalitesi',
      value: breakdown.quality.value,
      max: breakdown.quality.weight,
      detail: `Ort. ${(breakdown.quality.average * 100).toFixed(0)}/100`
    },
    {
      icon: 'restaurant_menu',
      label: 'Çeşitlilik',
      value: breakdown.variety.value,
      max: breakdown.variety.weight,
      detail: `${breakdown.variety.categoryCount} gıda grubu`
    },
    {
      icon: 'shield',
      label: 'Güvenlik',
      value: breakdown.safety.value,
      max: breakdown.safety.weight,
      detail: breakdown.safety.highRiskCount > 0 ? `${breakdown.safety.highRiskCount} risk` : 'Temiz'
    }
  ];

  return (
    <section className="glass-card p-6 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-xs font-bold text-secondary tracking-widest uppercase flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">analytics</span>
          Sağlık Puanı Bileşenleri
        </h2>
        <span className="text-[11px] text-on-surface-variant font-medium">5 metrik</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map((c) => {
          const pct = (c.value / c.max) * 100;
          return (
            <div
              key={c.label}
              className="bg-surface-container-lowest/60 rounded-2xl p-4 border border-primary/5 hover:border-primary/15 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">{c.icon}</span>
                </div>
                <span className="text-[11px] font-bold text-on-surface tracking-tight line-clamp-1">{c.label}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1.5">
                <span className="text-2xl font-headline font-extrabold text-primary">{c.value}</span>
                <span className="text-[10px] font-bold text-on-surface-variant">/{c.max}</span>
              </div>
              <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-on-surface-variant truncate">{c.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
