import { useEffect, useState } from 'react';
import { fetchWeeklyReport } from '../api';

interface WeeklyReportProps {
  /** Dashboard'dan açılırsa kapatma butonu göster */
  onClose?: () => void;
}

export default function WeeklyReport({ onClose }: WeeklyReportProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWeeklyReport();
        if (res.status === 'success') {
          setReport(res.data);
        } else {
          setError(res.message || 'Rapor alınamadı.');
        }
      } catch {
        setError('Bağlantı hatası. Lütfen tekrar dene.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-outline-variant/15 animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-on-surface/10 rounded w-1/3" />
            <div className="h-3 bg-on-surface/5 rounded w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-on-surface/5 rounded-2xl" />)}
        </div>
        <div className="h-24 bg-on-surface/5 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 rounded-3xl border border-error/20 bg-error/5 flex items-center gap-4">
        <span className="material-symbols-outlined text-error text-3xl">error</span>
        <p className="text-on-surface-variant text-sm">{error}</p>
      </div>
    );
  }

  if (!report?.hasData) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-outline-variant/15 text-center">
        <span className="material-symbols-outlined text-5xl text-primary/30 mb-3">bar_chart</span>
        <h3 className="font-headline font-bold text-on-surface mb-1">Henüz Yeterli Veri Yok</h3>
        <p className="text-on-surface-variant text-sm">{report?.message}</p>
      </div>
    );
  }

  const { totals, averages, calorieGoal, ai, dailySummary, riskCount, period } = report;
  const caloriePercent = Math.round((averages.calories / calorieGoal) * 100);
  const calorieColor = caloriePercent < 70 ? 'text-error' : caloriePercent > 115 ? 'text-tertiary' : 'text-primary';
  const scoreColor = ai.overallScore >= 8 ? '#10b981' : ai.overallScore >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-6">
      {/* ── Başlık ── */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border-2 border-primary/15 bg-gradient-to-br from-primary/5 via-surface to-secondary/5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl hero-gradient flex items-center justify-center shadow-md flex-shrink-0">
              <span className="material-symbols-outlined text-white text-2xl">insights</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-extrabold text-xl text-on-surface">Haftalık Beslenme Raporu</h2>
                {onClose && (
                  <button onClick={onClose} className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center ml-1">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Son {period.days} gün — {totals.scanCount} tüketim kaydı
              </p>
            </div>
          </div>

          {/* Skor */}
          <div className="flex items-center gap-3 bg-surface/80 backdrop-blur px-5 py-3 rounded-2xl border border-outline-variant/15 shadow-sm self-start md:self-auto">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-white text-2xl shadow-inner flex-shrink-0"
              style={{ background: scoreColor }}
            >
              {ai.overallScore}
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Haftalık Skor</p>
              <p className="font-bold text-on-surface text-sm">{ai.scoreLabel}</p>
            </div>
          </div>
        </div>

        {/* AI Başlık */}
        <div className="relative bg-surface-container-lowest/60 rounded-2xl px-5 py-3 border border-outline-variant/10">
          <p className="text-sm font-medium text-on-surface italic leading-relaxed">"{ai.headline}"</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-primary text-xs">auto_awesome</span>
            <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">Gemini AI Özeti</span>
          </div>
        </div>
      </div>

      {/* ── Özet Kartları ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: 'bolt', color: 'text-primary', label: 'Ort. Kalori', value: `${averages.calories}`, unit: 'kcal/gün', sub: `${caloriePercent}% hedef`, subColor: calorieColor },
          { icon: 'fitness_center', color: 'text-secondary', label: 'Ort. Protein', value: averages.protein, unit: 'g/gün', sub: `Toplam: ${parseFloat(totals.protein).toFixed(0)}g`, subColor: 'text-on-surface-variant' },
          { icon: 'bakery_dining', color: 'text-tertiary', label: 'Ort. Karbonhidrat', value: averages.carbs, unit: 'g/gün', sub: `Toplam: ${parseFloat(totals.carbs).toFixed(0)}g`, subColor: 'text-on-surface-variant' },
          { icon: 'opacity', color: 'text-error', label: 'Ort. Yağ', value: averages.fat, unit: 'g/gün', sub: riskCount > 0 ? `${riskCount} riskli ürün` : 'Risk yok ✓', subColor: riskCount > 0 ? 'text-error' : 'text-primary' }
        ].map(card => (
          <div key={card.label} className="glass-card p-4 rounded-2xl border border-outline-variant/15 text-center shadow-sm">
            <span className={`material-symbols-outlined text-2xl mb-1 ${card.color}`}>{card.icon}</span>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-tight">{card.label}</p>
            <p className={`text-xl font-extrabold mt-0.5 ${card.color}`}>
              {card.value}<span className="text-xs font-bold text-on-surface-variant ml-0.5">{card.unit}</span>
            </p>
            <p className={`text-[10px] font-semibold mt-0.5 ${card.subColor}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── AI Bulgular ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Olumlu / Uyarı */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/15 shadow-sm space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary">psychology</span>
            <h3 className="font-headline font-bold text-on-surface text-sm">AI Bulgular</h3>
          </div>
          {ai.highlights?.map((h: any, i: number) => (
            <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl ${
              h.type === 'positive' ? 'bg-primary/5 border border-primary/15' : 'bg-tertiary/5 border border-tertiary/15'
            }`}>
              <span className={`material-symbols-outlined text-base flex-shrink-0 mt-0.5 ${
                h.type === 'positive' ? 'text-primary' : 'text-tertiary'
              }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {h.type === 'positive' ? 'check_circle' : 'warning'}
              </span>
              <p className="text-xs font-medium text-on-surface leading-relaxed">{h.text}</p>
            </div>
          ))}
        </div>

        {/* Detaylı İçgörüler */}
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/15 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-secondary">analytics</span>
            <h3 className="font-headline font-bold text-on-surface text-sm">Detaylı İçgörüler</h3>
          </div>
          {[
            { icon: 'pie_chart', label: 'Kalori', text: ai.calorieInsight },
            { icon: 'nutrition', label: 'Makro', text: ai.macroInsight },
            ...(ai.riskInsight ? [{ icon: 'policy', label: 'Risk', text: ai.riskInsight }] : [])
          ].map(item => (
            <div key={item.label} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-secondary text-sm">{item.icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider">{item.label}</p>
                <p className="text-xs text-on-surface leading-relaxed mt-0.5">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gelecek Hafta İpuçları ── */}
      <div className="glass-card p-5 rounded-2xl border border-outline-variant/15 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">tips_and_updates</span>
          <h3 className="font-headline font-bold text-on-surface">Gelecek Hafta İçin Öneriler</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ai.nextWeekTips?.map((tip: string, i: number) => (
            <div key={i} className="flex items-start gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
              <div className="w-7 h-7 rounded-full hero-gradient flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-xs text-on-surface font-medium leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Günlük Kırılım ── */}
      {dailySummary?.length > 0 && (
        <div className="glass-card p-5 rounded-2xl border border-outline-variant/15 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-tertiary">calendar_month</span>
            <h3 className="font-headline font-bold text-on-surface">Günlük Kırılım</h3>
          </div>
          <div className="space-y-2.5">
            {dailySummary.map((day: any) => {
              const pct = Math.min(100, Math.round((day.calories / calorieGoal) * 100));
              const barColor = pct < 70 ? 'bg-error' : pct > 115 ? 'bg-tertiary' : 'bg-primary';
              return (
                <div key={day.day}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-on-surface">{day.day}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-extrabold text-primary">{day.calories} kcal</p>
                      <span className="text-[10px] text-on-surface-variant">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-on-surface-variant text-right mt-2">Hedef: {calorieGoal} kcal/gün</p>
        </div>
      )}

      {/* ── Motivasyon Mesajı ── */}
      <div className="flex items-center justify-center p-5 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/15">
        <p className="text-sm font-semibold text-on-surface text-center">{ai.motivationMessage}</p>
      </div>
    </div>
  );
}
