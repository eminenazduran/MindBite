import { useState } from 'react';
import { scanProduct, searchFood } from '../api';
import { useAuth } from '../context/AuthContext';

type InputMode = 'barcode' | 'search';

const QUICK_PORTIONS = [50, 100, 150, 200, 250];

const SAMPLE_BARCODES = [
  { code: '8690504033010', label: 'Ülker Çikolata' },
  { code: '8690637001291', label: 'Torku Süt' },
  { code: '8690504100096', label: 'Eti Bisküvi' }
];

export default function Analysis() {
  const { user } = useAuth();
  const [mode, setMode] = useState<InputMode>('barcode');
  const [barcode, setBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsOcr, setNeedsOcr] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [servingSize, setServingSize] = useState(100);
  const [searching, setSearching] = useState(false);

  const handleScan = async (ocrPayload?: string, targetBarcode?: string) => {
    const finalBarcode = targetBarcode || barcode;
    if (!finalBarcode || !user) return;
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const res = await scanProduct(user.id, finalBarcode, ocrPayload, servingSize);

      if (res.status === 'success') {
        setAnalysisResult(res.data);
        setNeedsOcr(false);
        setOcrText('');
      } else if (res.status === 'needs_ocr') {
        setNeedsOcr(true);
      } else {
        setError(res.message || 'Bilinmeyen bir hata oluştu');
      }
    } catch (err: any) {
      setError(err.message || 'Analiz sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOcrSubmit = async () => {
    if (!ocrText.trim()) return;
    await handleScan(ocrText);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await searchFood(searchQuery);
      if (res.status === 'success') {
        setSearchResults(res.data);
      }
    } catch (err) {
      console.error('Arama hatası:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectFromSearch = (food: any) => {
    setBarcode(food.barcode);
    setSearchResults([]);
    setSearchQuery('');
    handleScan(undefined, food.barcode);
  };

  const resetAll = () => {
    setBarcode('');
    setServingSize(100);
    setNeedsOcr(false);
    setOcrText('');
    setAnalysisResult(null);
    setError(null);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <main className="pt-24 px-6 md:px-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* ─── Hero Header ─────────────────────────────────────── */}
      {!analysisResult && (
        <section className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-12 border border-primary/10">
          <div className="absolute -top-20 -right-16 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-16 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>

          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <span className="material-symbols-outlined text-primary text-base">auto_awesome</span>
                <span className="text-[11px] font-bold text-primary tracking-widest uppercase">Yapay Zeka Destekli</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-headline font-extrabold text-on-surface leading-tight">
                Gıda Etiketi <span className="text-primary">Analizi</span>
              </h1>
              <p className="text-on-surface-variant mt-3 md:text-lg max-w-xl">
                Barkod okut, ürün ara veya içindekiler listesini yapıştır. Alerji profilin ve makrolarına göre risk raporu al.
              </p>
            </div>

            {/* Mini özellik rozetleri */}
            <div className="flex flex-col gap-2 md:min-w-[240px]">
              {[
                { icon: 'health_and_safety', label: 'Alerjen ve E-kod taraması' },
                { icon: 'nutrition', label: 'Porsiyona göre makro' },
                { icon: 'flash_on', label: 'Saniyeler içinde rapor' }
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/60 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-xl">{f.icon}</span>
                  <span className="text-sm font-semibold text-on-surface">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Input Kartı ─────────────────────────────────────── */}
      {!analysisResult && (
        <section className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
          {/* Mod seçici (segmented control) */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex bg-surface-container-high rounded-2xl p-1.5 shadow-inner">
              <button
                onClick={() => { setMode('barcode'); setError(null); setSearchResults([]); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  mode === 'barcode'
                    ? 'bg-white text-primary shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg">barcode_scanner</span>
                Barkod
              </button>
              <button
                onClick={() => { setMode('search'); setError(null); setNeedsOcr(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  mode === 'search'
                    ? 'bg-white text-primary shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg">search</span>
                Ürün Ara
              </button>
            </div>
          </div>

          {/* Barkod girişi */}
          {mode === 'barcode' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-2xl pointer-events-none">
                  qr_code_2
                </span>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => { setBarcode(e.target.value); setNeedsOcr(false); setError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && barcode && handleScan()}
                  placeholder="Barkod numarasını yaz (Örn: 8690504033010)"
                  disabled={needsOcr}
                  className="w-full pl-14 pr-4 py-4 rounded-2xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400 font-semibold text-lg shadow-inner"
                />
                {barcode && !needsOcr && (
                  <button
                    onClick={() => setBarcode('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
                  </button>
                )}
              </div>

              {/* Örnek barkodlar */}
              {!barcode && !needsOcr && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Örnek:</span>
                  {SAMPLE_BARCODES.map((b) => (
                    <button
                      key={b.code}
                      onClick={() => setBarcode(b.code)}
                      className="px-3 py-1 rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/20 text-xs font-semibold text-primary transition"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ürün arama */}
          {mode === 'search' && (
            <div className="space-y-3 max-w-2xl mx-auto">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-2xl pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Ürün adıyla ara... (Örn: Torku, Ülker, Eti)"
                  className="w-full pl-14 pr-28 py-4 rounded-2xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none bg-white font-semibold text-lg shadow-inner"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 hero-gradient text-white font-bold rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50 shadow"
                >
                  {searching ? (
                    <span className="w-4 h-4 inline-block border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Ara'
                  )}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="bg-white rounded-2xl border border-outline-variant/20 max-h-72 overflow-y-auto shadow-xl divide-y divide-outline-variant/10">
                  {searchResults.map((food: any) => (
                    <button
                      key={food._id}
                      onClick={() => selectFromSearch(food)}
                      className="w-full text-left px-5 py-3.5 hover:bg-primary/5 transition flex justify-between items-center group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-xl">fastfood</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-on-surface truncate">{food.productName}</p>
                          <p className="text-xs text-on-surface-variant font-mono">{food.barcode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-primary font-extrabold">{food.calories}<span className="text-[10px] text-on-surface-variant ml-0.5">kcal</span></span>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && !searching && searchResults.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center italic pt-2">
                  Arama yap veya ürün bulunamadıysa <button onClick={() => setMode('barcode')} className="text-primary font-bold underline">barkod ile dene</button>.
                </p>
              )}
            </div>
          )}

          {/* ─── Porsiyon seçimi ─── */}
          {!needsOcr && (
            <div className="mt-6 pt-6 border-t border-outline-variant/20 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">scale</span>
                  <span className="text-sm font-bold text-on-surface">Porsiyon Miktarı</span>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-high px-3 py-1 rounded-full">
                  <input
                    type="number"
                    value={servingSize}
                    onChange={(e) => setServingSize(Math.max(1, Number(e.target.value)))}
                    className="w-16 bg-transparent outline-none text-center font-extrabold text-primary"
                  />
                  <span className="text-xs font-bold text-on-surface-variant">GR</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {QUICK_PORTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setServingSize(g)}
                    className={`flex-1 min-w-[60px] px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                      servingSize === g
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Analiz butonu (barkod modunda) */}
          {mode === 'barcode' && !needsOcr && (
            <div className="mt-6 max-w-2xl mx-auto">
              <button
                onClick={() => handleScan()}
                disabled={loading || !barcode}
                className="w-full px-8 py-4 hero-gradient text-white font-extrabold text-lg rounded-2xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analiz Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">science</span>
                    <span>Analiz Et</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ─── OCR Bölümü ─── */}
          {needsOcr && (
            <div className="mt-6 max-w-2xl mx-auto bg-secondary-container/20 p-6 rounded-2xl border border-secondary/30">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/15 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary text-2xl">document_scanner</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">İçerik Bilgisi Gerekli</h3>
                  <p className="text-on-surface-variant text-sm mt-1">
                    Bu ürün veritabanımızda yok. Paketin arkasındaki içindekiler kısmını yapıştır; AI analiz edip kaydedecek.
                  </p>
                </div>
              </div>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="Örn: Buğday unu, Şeker, Bitkisel Yağ, Peyniraltı Suyu Tozu, E322 (Lesitin)..."
                className="w-full p-4 rounded-xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-secondary outline-none min-h-[120px] mb-4 bg-white font-medium"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleOcrSubmit}
                  disabled={loading || !ocrText.trim()}
                  className="flex-1 px-6 py-3.5 bg-secondary text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI Analiz Ediyor...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                      AI ile Kaydet
                    </>
                  )}
                </button>
                <button
                  onClick={resetAll}
                  className="px-6 py-3.5 bg-transparent text-secondary border-2 border-secondary/40 font-bold rounded-xl hover:bg-secondary/10 transition"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {/* Hata kutusu */}
          {error && (
            <div className="mt-6 max-w-2xl mx-auto bg-error/5 border border-error/30 rounded-2xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-error flex-shrink-0">error</span>
              <div className="flex-1">
                <p className="font-bold text-error">Hata</p>
                <p className="text-sm text-on-surface-variant">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* ─── Nasıl Çalışır (boş state) ─────────────── */}
      {!analysisResult && !loading && !needsOcr && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              icon: 'barcode_scanner',
              title: 'Ürünü Tanımla',
              desc: 'Barkod yaz ya da ürün adıyla ara. Her iki yöntem de Open Food Facts + yerel veritabanına bağlanır.'
            },
            {
              step: '02',
              icon: 'psychology',
              title: 'AI Analiz Eder',
              desc: 'Alerjen profiline göre risk seviyesi, E-kod, ve porsiyona göre kalori/makro hesaplanır.'
            },
            {
              step: '03',
              icon: 'insights',
              title: 'Raporu Al',
              desc: 'Güvenlik durumu, besin değerleri ve içindekiler listesi tek ekranda — kaydın geçmişine işler.'
            }
          ].map((s) => (
            <div key={s.step} className="relative glass-card p-6 rounded-2xl border border-outline-variant/15 hover:border-primary/30 transition group overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-all"></div>
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl hero-gradient flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-white">{s.icon}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-primary/60 tracking-widest">{s.step}</span>
                  <h3 className="font-bold text-on-surface mt-1">{s.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ─── Yükleme skeleton ─── */}
      {loading && !analysisResult && (
        <section className="glass-card p-8 rounded-3xl border border-outline-variant/15 animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-on-surface/10 rounded w-1/3"></div>
              <div className="h-3 bg-on-surface/5 rounded w-1/2"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-on-surface/5 rounded-2xl"></div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Sonuç Gösterimi (mevcut layout korundu) ─── */}
      {analysisResult && (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 relative group">
              <div className="absolute -inset-4 bg-primary/5 rounded-xl blur-2xl group-hover:bg-primary/10 transition-all"></div>
              <div className="relative w-full aspect-square bg-surface-container-low rounded-xl shadow-2xl flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-8xl text-primary/30">fastfood</span>
                  <p className="text-on-surface-variant text-sm mt-2 font-medium">{analysisResult.food.barcode}</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-8">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-headline font-bold text-sm tracking-wide">
                    AKILLI ANALİZ SONUCU
                  </span>
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed font-headline font-bold text-sm tracking-wide">
                    {servingSize} GR İÇİN
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-extrabold text-primary tracking-tight leading-tight">
                  {analysisResult.food.productName}
                </h1>
              </div>
              <div className={`p-8 rounded-2xl flex items-center gap-6 shadow-sm border-2 ${analysisResult.analysisResult.safeToConsume ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <div className={`w-16 h-16 rounded-full flex flex-shrink-0 items-center justify-center text-white ${analysisResult.analysisResult.safeToConsume ? 'bg-primary shadow-lg' : 'bg-error shadow-lg'}`}>
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {analysisResult.analysisResult.safeToConsume ? 'check_circle' : 'warning'}
                  </span>
                </div>
                <div>
                  <h3 className={`text-xl font-headline font-bold ${analysisResult.analysisResult.safeToConsume ? 'text-primary' : 'text-error'}`}>
                    {analysisResult.analysisResult.safeToConsume ? 'Senin İçin Güvenli' : 'Riskli Ürün!'}
                  </h3>
                  <p className="text-on-surface-variant font-medium">
                    {analysisResult.analysisResult.warnings?.length > 0 ? analysisResult.analysisResult.warnings.join(', ') : 'Profilinize özel herhangi bir risk bulunamadı.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Besin Değerleri Kartları */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="glass-card p-6 rounded-2xl border border-outline-variant/15 text-center shadow-sm">
              <span className="material-symbols-outlined text-primary text-3xl mb-2">bolt</span>
              <h4 className="font-bold text-xs text-on-surface-variant uppercase tracking-widest mb-1">Toplam Kalori</h4>
              <p className="text-2xl font-extrabold text-primary">
                {Math.round((analysisResult.food.calories * servingSize) / 100)}
                <span className="text-xs font-bold text-on-surface-variant ml-1">KCAL</span>
              </p>
            </div>
            <div className="glass-card p-6 rounded-2xl border border-outline-variant/15 text-center shadow-sm">
              <span className="material-symbols-outlined text-secondary text-3xl mb-2">fitness_center</span>
              <h4 className="font-bold text-xs text-on-surface-variant uppercase tracking-widest mb-1">Protein</h4>
              <p className="text-2xl font-extrabold text-secondary">
                {((analysisResult.food.protein * servingSize) / 100).toFixed(1)}
                <span className="text-xs font-bold text-on-surface-variant ml-1">G</span>
              </p>
            </div>
            <div className="glass-card p-6 rounded-2xl border border-outline-variant/15 text-center shadow-sm">
              <span className="material-symbols-outlined text-tertiary text-3xl mb-2">bakery_dining</span>
              <h4 className="font-bold text-xs text-on-surface-variant uppercase tracking-widest mb-1">Karbonhidrat</h4>
              <p className="text-2xl font-extrabold text-tertiary">
                {((analysisResult.food.carbohydrates * servingSize) / 100).toFixed(1)}
                <span className="text-xs font-bold text-on-surface-variant ml-1">G</span>
              </p>
            </div>
            <div className="glass-card p-6 rounded-2xl border border-outline-variant/15 text-center shadow-sm">
              <span className="material-symbols-outlined text-error text-3xl mb-2">opacity</span>
              <h4 className="font-bold text-xs text-on-surface-variant uppercase tracking-widest mb-1">Yağ</h4>
              <p className="text-2xl font-extrabold text-error">
                {((analysisResult.food.fat * servingSize) / 100).toFixed(1)}
                <span className="text-xs font-bold text-on-surface-variant ml-1">G</span>
              </p>
            </div>
          </section>

          {/* Diğer Bilgiler */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-xl border border-outline-variant/15 text-center shadow-sm">
              <span className="material-symbols-outlined text-secondary text-4xl mb-4">science</span>
              <h4 className="font-bold text-lg mb-2">Katkı Maddeleri (E-Kodlar)</h4>
              <p className="text-xl font-semibold text-secondary">
                {analysisResult.food.eCodes?.length > 0 ? analysisResult.food.eCodes.join(', ') : 'E-Kod Tespit Edilmedi'}
              </p>
            </div>
            <div className="glass-card p-8 rounded-xl border border-outline-variant/15 text-center shadow-sm">
              <span className="material-symbols-outlined text-error text-4xl mb-4">coronavirus</span>
              <h4 className="font-bold text-lg mb-2">Alerjenler</h4>
              <p className="text-xl font-semibold text-error">
                {analysisResult.food.allergens?.length > 0 ? analysisResult.food.allergens.join(', ') : 'Alerjen Yok'}
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-headline font-extrabold text-primary mb-10 text-center md:text-left">İçindekiler Listesi</h2>
            <div className="glass-card p-8 rounded-xl border border-outline-variant/15 shadow">
              <ul className="flex flex-wrap gap-3">
                {analysisResult.food.ingredients?.map((ing: string, i: number) => (
                  <li key={i} className="px-4 py-2 bg-surface-container rounded-full text-on-surface-variant font-medium text-sm">
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Yeni Tarama Butonu */}
          <div className="text-center">
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 px-8 py-4 hero-gradient text-white rounded-full font-bold hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined">restart_alt</span>
              Yeni Tarama Yap
            </button>
          </div>
        </>
      )}
    </main>
  );
}
