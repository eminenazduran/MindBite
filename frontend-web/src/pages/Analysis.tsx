import { useEffect, useState } from 'react';
import { scanProduct, searchFood, markScanConsumed, unmarkScanConsumed, deleteScan, dismissScan, restoreScan, getScanHistory, analyzeLabelOnly, getAIRecommendation } from '../api';
import { useAuth } from '../context/AuthContext';
import BarcodeScanner from '../components/BarcodeScanner';
import OCRScanner from '../components/OCRScanner';

type InputMode = 'barcode' | 'search' | 'label';

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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [consumed, setConsumed] = useState(false);
  const [consuming, setConsuming] = useState(false);

  // Label (etiket) tarama modu
  const [labelText, setLabelText] = useState('');
  const [labelOcrOpen, setLabelOcrOpen] = useState(false);

  // AI öneri paneli
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [aiRecommendLoading, setAiRecommendLoading] = useState(false);

  // Tarama geçmişi (kullanıcıya özel)
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'consumed' | 'dismissed'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await getScanHistory(user.id, 30);
      if (res.status === 'success') setHistory(res.data || []);
    } catch (err) {
      console.error('Tarama geçmişi yükleme hatası:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
        setScanId(res.data?.scanId || null);
        setConsumed(res.data?.consumed === true);
        setNeedsOcr(false);
        setOcrText('');
        loadHistory();
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
    setLabelText('');
    setAnalysisResult(null);
    setError(null);
    setSearchResults([]);
    setSearchQuery('');
    setScanId(null);
    setConsumed(false);
    setAiRecommendation(null);
  };

  // Barkodsuz etiket/içerik analizi
  const handleLabelAnalyze = async () => {
    if (!labelText.trim() || !user) return;
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setAiRecommendation(null);
    try {
      const res = await analyzeLabelOnly(labelText, servingSize);
      if (res.status === 'success') {
        setAnalysisResult(res.data);
        setScanId(res.data?.scanId || null);
        setConsumed(false);
        loadHistory();
        // Hemen AI öneri de al
        if (res.data?.food?._id) {
          fetchAIRecommendation(res.data.food._id, servingSize);
        }
      } else {
        setError(res.message || 'Etiket analizi başarısız oldu.');
      }
    } catch (err: any) {
      setError(err.message || 'Analiz sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleOcrResult = async (text: string, isLabelOnly: boolean = false) => {
    if (isLabelOnly) {
      setLoading(true);
      setError(null);
      setAnalysisResult(null);
      setAiRecommendation(null);
      try {
        const res = await analyzeLabelOnly(text, servingSize);
        if (res.status === 'success') {
          setAnalysisResult(res.data);
          setScanId(res.data?.scanId || null);
          setConsumed(false);
          loadHistory();
          if (res.data?.food?._id) {
            fetchAIRecommendation(res.data.food._id, servingSize);
          }
        } else {
          setError(res.message || 'Etiket analizi başarısız oldu.');
        }
      } catch (err: any) {
        setError(err.message || 'Analiz sırasında hata oluştu.');
      } finally {
        setLoading(false);
      }
    } else {
      setOcrText(text);
    }
  };

  // AI öneri panelini doldur
  const fetchAIRecommendation = async (foodId: string, serving: number) => {
    setAiRecommendLoading(true);
    try {
      const res = await getAIRecommendation(foodId, serving);
      if (res.status === 'success') {
        setAiRecommendation(res.data);
      }
    } catch (e) {
      console.error('AI öneri hatası:', e);
    } finally {
      setAiRecommendLoading(false);
    }
  };

  const handleConsume = async () => {
    if (!scanId || consumed) return;
    setConsuming(true);
    try {
      const res = await markScanConsumed(scanId, servingSize);
      if (res.status === 'success') {
        setConsumed(true);
        loadHistory();
      } else {
        setError(res.message || 'Tüketim kaydı eklenemedi.');
      }
    } catch (err: any) {
      setError(err.message || 'Tüketim kaydı eklenemedi.');
    } finally {
      setConsuming(false);
    }
  };

  // Geçmişten ürünü "Tükettim" / "Geri Al" / "Sil" işlemleri
  const handleHistoryConsume = async (id: string, currentServing?: number) => {
    setBusyId(id);
    try {
      const res = await markScanConsumed(id, currentServing);
      if (res.status === 'success') await loadHistory();
    } catch (e) { console.error(e); }
    finally { setBusyId(null); }
  };

  const handleHistoryUnconsume = async (id: string) => {
    setBusyId(id);
    try {
      const res = await unmarkScanConsumed(id);
      if (res.status === 'success') await loadHistory();
    } catch (e) { console.error(e); }
    finally { setBusyId(null); }
  };

  const handleHistoryDelete = async (id: string, skipConfirm = false) => {
    if (!skipConfirm && !confirm('Bu taramayı geçmişten silmek istediğine emin misin?')) return;
    setBusyId(id);
    try {
      const res = await deleteScan(id);
      if (res.status === 'success') await loadHistory();
    } catch (e) { console.error(e); }
    finally { setBusyId(null); }
  };

  // "Tüketmedim" → kayıt geçmişte kalır, dismissedAt set edilir, 24 saat sonra TTL ile silinir
  const handleHistoryDismiss = async (id: string) => {
    setBusyId(id);
    try {
      const res = await dismissScan(id);
      if (res.status === 'success') await loadHistory();
    } catch (e) { console.error(e); }
    finally { setBusyId(null); }
  };

  // "Tüketmedim" işaretini geri al
  const handleHistoryRestore = async (id: string) => {
    setBusyId(id);
    try {
      const res = await restoreScan(id);
      if (res.status === 'success') await loadHistory();
    } catch (e) { console.error(e); }
    finally { setBusyId(null); }
  };

  // Sadece barkod ile taranan ürünleri göster (elle girilen "hızlı öğün" ve "etiket tarama" kayıtları hariç)
  const scannedOnly = history.filter(h =>
    h.foodId &&
    h.foodId.isGeneric !== true &&
    !h.barcode?.startsWith('L-') &&
    !h.foodId.barcode?.startsWith('L-')
  );

  const filteredHistory = scannedOnly.filter(h => {
    if (historyFilter === 'pending') return h.consumed !== true && h.dismissed !== true;
    if (historyFilter === 'consumed') return h.consumed === true;
    if (historyFilter === 'dismissed') return h.dismissed === true;
    return true;
  });

  const pendingCount = scannedOnly.filter(h => h.consumed !== true && h.dismissed !== true).length;
  const consumedCount = scannedOnly.filter(h => h.consumed === true).length;
  const dismissedCount = scannedOnly.filter(h => h.dismissed === true).length;

  // 24 saatlik geri sayım için kalan saat hesaplaması
  const getDismissExpiry = (dismissedAt: string | Date) => {
    const dismissed = new Date(dismissedAt).getTime();
    const expires = dismissed + 24 * 60 * 60 * 1000;
    const remaining = expires - Date.now();
    if (remaining <= 0) return 'Yakında siliniyor…';
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) return `${hours} saat ${minutes} dk sonra silinecek`;
    return `${minutes} dakika sonra silinecek`;
  };

  return (
    <main className="pt-24 px-6 md:px-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* ─── Hero Header ─────────────────────────────────────── */}
      {!analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* ─── Hero Header ─────────────────────────────────────── */}
          <section className="lg:col-span-5 relative overflow-hidden rounded-3xl glass-card p-8 md:p-10 border border-primary/10 flex flex-col justify-center bg-gradient-to-br from-surface-container-lowest to-surface-container/50">
            <div className="absolute -top-20 -right-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>

            <div className="relative flex flex-col gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                  <span className="text-[10px] font-extrabold text-primary tracking-widest uppercase">Yapay Zeka Destekli</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-headline font-extrabold text-on-surface leading-tight">
                  Gıda Etiketi <br/><span className="text-primary">Analizi</span>
                </h1>
                <p className="text-on-surface-variant mt-4 text-sm md:text-base leading-relaxed">
                  Barkod okut, ürün ara veya içindekiler listesini yapıştır. Alerji profilin ve makrolarına göre kişiselleştirilmiş risk raporunu saniyeler içinde al.
                </p>
              </div>

              {/* Mini özellik rozetleri */}
              <div className="flex flex-col gap-2.5 mt-2">
                {[
                  { icon: 'health_and_safety', label: 'Alerjen ve E-kod Taraması' },
                  { icon: 'nutrition', label: 'Porsiyona Göre Makro Hesabı' },
                  { icon: 'flash_on', label: 'Anında Risk Raporu' }
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface/50 backdrop-blur-md border border-outline-variant/20 shadow-sm transition-all hover:bg-surface hover:border-primary/30">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">{f.icon}</span>
                    </div>
                    <span className="text-sm font-bold text-on-surface">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── Input Kartı ─────────────────────────────────────── */}
          <section className="lg:col-span-7 glass-card p-6 md:p-10 rounded-3xl border border-outline-variant/20 shadow-lg bg-surface">
          {/* Mod seçici (segmented control) */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex bg-surface-container-high rounded-2xl p-1.5 shadow-inner">
              <button
                onClick={() => { setMode('barcode'); setError(null); setSearchResults([]); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'barcode'
                  ? 'bg-surface-container-lowest text-primary shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">barcode_scanner</span>
                Barkod
              </button>
              <button
                onClick={() => { setMode('search'); setError(null); setNeedsOcr(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'search'
                  ? 'bg-surface-container-lowest text-primary shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">search</span>
                Ürün Ara
              </button>
              <button
                onClick={() => { setMode('label'); setError(null); setNeedsOcr(false); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'label'
                  ? 'bg-surface-container-lowest text-primary shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">document_scanner</span>
                Etiket Tara
              </button>
            </div>
          </div>

          {/* Barkod girişi */}
          {mode === 'barcode' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-2xl pointer-events-none">
                    qr_code_2
                  </span>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => { setBarcode(e.target.value); setNeedsOcr(false); setError(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && !loading && barcode && handleScan()}
                    placeholder="Barkod numarasını yaz veya kamerayla tara"
                    disabled={needsOcr}
                    className="w-full pl-14 pr-12 py-4 rounded-2xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none bg-surface-container-lowest text-on-surface disabled:bg-surface-container disabled:text-on-surface-variant font-semibold text-lg shadow-inner"
                  />
                  {barcode && !needsOcr && (
                    <button
                      onClick={() => setBarcode('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center"
                      aria-label="Temizle"
                    >
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setScannerOpen(true)}
                  disabled={needsOcr}
                  className="group flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-primary text-white font-bold hover:opacity-90 transition disabled:opacity-50 shadow-md"
                  title="Kamera ile barkod tara"
                >
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                  <span className="sm:hidden md:inline">Kamera</span>
                </button>
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
                  className="w-full pl-14 pr-28 py-4 rounded-2xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none bg-surface-container-lowest text-on-surface font-semibold text-lg shadow-inner"
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
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 max-h-72 overflow-y-auto shadow-xl divide-y divide-outline-variant/10">
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

          {/* Barkodsuz Etiket Tarama - Sadeleştirilmiş Tasarım */}
          {mode === 'label' && (
            <div className="space-y-6 max-w-2xl mx-auto py-8">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 rounded-3xl bg-secondary/10 flex items-center justify-center mx-auto mb-4 shadow-inner ring-1 ring-secondary/20">
                  <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>document_scanner</span>
                </div>
                <h3 className="text-xl font-headline font-bold text-on-surface">İçindekiler Etiketini Tara</h3>
                <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                  Ürünün arkasındaki içerik listesini fotoğraflayın. Yapay zeka metni okuyacak ve saniyeler içinde analiz edecek.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => setLabelOcrOpen(true)}
                  disabled={loading}
                  className="w-full sm:w-auto px-10 py-5 bg-secondary text-white font-extrabold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-secondary/20"
                >
                  <span className="material-symbols-outlined text-2xl">photo_camera</span>
                  Fotoğraf Çek / Yükle
                </button>

                <div className="flex items-center gap-3 w-full opacity-30">
                  <div className="h-px bg-outline-variant flex-1"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">HIZLI ANALİZ</span>
                  <div className="h-px bg-outline-variant flex-1"></div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Porsiyon seçimi (Etiket taramasında gizli) ─── */}
          {!needsOcr && (mode === 'barcode' || mode === 'search') && (
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
                    className={`flex-1 min-w-[60px] px-3 py-2 rounded-xl text-sm font-bold transition-all ${servingSize === g
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

          {/* Analiz butonu (Sadece barkod modunda kaldı, etiket modu otomatikleşti) */}
          {mode === 'barcode' && !needsOcr && (
            <div className="mt-6 max-w-2xl mx-auto">
              <button
                onClick={mode === 'label' ? handleLabelAnalyze : handleScan}
                disabled={loading || (mode === 'barcode' ? !barcode : !labelText)}
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
              {/* Fotoğraftan oku */}
              <div className="mb-4 p-4 rounded-xl bg-surface-container-lowest border-2 border-dashed border-secondary/30 flex flex-col sm:flex-row items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary text-2xl">photo_camera</span>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-bold text-on-surface text-sm">Etiketi fotoğraflayın</p>
                  <p className="text-xs text-on-surface-variant">Yazmak yerine fotoğraf çekin — metin otomatik çıkarılır.</p>
                </div>
                <button
                  onClick={() => setOcrOpen(true)}
                  className="px-5 py-2.5 bg-secondary text-white text-sm font-bold rounded-xl hover:opacity-90 transition flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">document_scanner</span>
                  Fotoğraftan Oku
                </button>
              </div>

              <div className="relative mb-4">
                <textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  placeholder="...veya içindekiler listesini buraya yapıştırın. Örn: Buğday unu, Şeker, Bitkisel Yağ, Peyniraltı Suyu Tozu, E322 (Lesitin)..."
                  className="w-full p-4 rounded-xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-secondary outline-none min-h-[120px] bg-surface-container-lowest text-on-surface font-medium"
                />
                {ocrText && (
                  <span className="absolute bottom-2 right-3 text-[11px] font-mono text-on-surface-variant bg-surface-container/80 px-1.5 rounded">
                    {ocrText.length} karakter
                  </span>
                )}
              </div>
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
        </div>
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
          {/* ── Tüketim Onayı Banner'ı (Etiket Taramasında Gizli) ── */}
          {analysisResult.source !== 'label_ocr' && (
            <section className={`rounded-3xl p-5 md:p-6 border-2 shadow-sm ${consumed
              ? 'bg-primary/10 border-primary/30'
              : 'bg-gradient-to-br from-primary/5 via-secondary/5 to-tertiary/5 border-primary/20'
              }`}>
              {consumed ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline font-bold text-on-surface">Günlük Sayaca Eklendi</h3>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                      Bu ürün <strong>{servingSize}g</strong> porsiyonla bugünün kalori ve makro hesabına dahil edildi.
                    </p>
                  </div>
                  <button
                    onClick={resetAll}
                    className="px-5 py-2.5 rounded-xl bg-surface-container-lowest border border-primary/30 text-primary text-sm font-bold hover:bg-primary/10 transition flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    Yeni Tarama
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">restaurant_menu</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-headline font-bold text-on-surface">Bu ürünü tükettin mi?</h3>
                      <p className="text-sm text-on-surface-variant mt-0.5">
                        Sadece taradığın için kalori sayacına otomatik eklenmedi. Yediysen aşağıdan onayla, porsiyonu da düzenleyebilirsin.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2 border-t border-primary/10">
                    {/* Porsiyon ayarı */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Porsiyon</span>
                      <div className="inline-flex items-center bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-sm overflow-hidden">
                        <button
                          onClick={() => setServingSize(s => Math.max(10, s - 25))}
                          className="px-3 py-2 hover:bg-surface-container-high text-on-surface-variant"
                          disabled={consuming}
                        >
                          <span className="material-symbols-outlined text-base">remove</span>
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={servingSize}
                          onChange={(e) => setServingSize(Math.max(1, Number(e.target.value)))}
                          className="w-16 text-center font-extrabold text-primary outline-none bg-transparent py-2"
                        />
                        <span className="pr-3 text-xs font-bold text-on-surface-variant">g</span>
                        <button
                          onClick={() => setServingSize(s => s + 25)}
                          className="px-3 py-2 hover:bg-surface-container-high text-on-surface-variant"
                          disabled={consuming}
                        >
                          <span className="material-symbols-outlined text-base">add</span>
                        </button>
                      </div>
                      <span className="text-sm font-bold text-on-surface hidden sm:inline">
                        ≈ {Math.round(((analysisResult.food.calories || 0) * servingSize) / 100)} kcal
                      </span>
                    </div>

                    {/* Aksiyonlar */}
                    <div className="flex gap-2">
                      <button
                        onClick={resetAll}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container-high transition"
                      >
                        Yedimedim
                      </button>
                      <button
                        onClick={handleConsume}
                        disabled={consuming || !scanId}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-extrabold hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2 shadow-md"
                      >
                        {consuming ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Ekleniyor...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-base">check</span>
                            Tükettim — Sayaca Ekle
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="flex flex-col gap-6">
            {/* Ürün Bilgi Kartı */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
              {/* Arka plan süslemesi */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-wider uppercase">
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      Akıllı Analiz Sonucu
                    </span>
                    {analysisResult.source !== 'label_ocr' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-xs tracking-wider uppercase">
                        <span className="material-symbols-outlined text-[14px]">scale</span>
                        {servingSize} GR
                      </span>
                    )}
                    {analysisResult.food.barcode && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-outline-variant/30 text-on-surface-variant font-mono text-[10px] tracking-widest">
                        <span className="material-symbols-outlined text-[12px]">barcode</span>
                        {analysisResult.food.barcode}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-headline font-black text-on-surface tracking-tight leading-tight">
                    {analysisResult.food.productName}
                  </h1>
                </div>
                
                {/* Tüketim aksiyonu - Ekranda masaüstünde sağda görünmesi için buraya bir kopyasını/alternatifini koyabiliriz ama mevcut buton zaten var, sadece süsleme kalsın */}
                <div className="hidden md:flex items-center justify-center w-24 h-24 rounded-2xl bg-surface-container border border-outline-variant/20 shadow-inner">
                  <span className="material-symbols-outlined text-5xl text-primary/40">restaurant</span>
                </div>
              </div>
            </div>

            {/* Risk Özet Kartı */}
            {(() => {
              const ar = analysisResult.analysisResult || {};
              const matched: string[] = ar.matchedAllergens || [];
              const risky: any[] = ar.riskyAdditives || [];
              const hasAllergen = matched.length > 0;
              const hasHighRisky = risky.some((r) => r.severity === 'HIGH');
              const hasMediumRisky = risky.some((r) => r.severity === 'MEDIUM');
              const hasLowRisky = risky.some((r) => r.severity === 'LOW');

              let bg = 'bg-primary/5 border-primary/20';
              let iconBg = 'bg-primary text-white';
              let titleColor = 'text-primary';
              let icon = 'check_circle';
              let title = 'Senin İçin Güvenli';

              let allergenMsg = hasAllergen
                ? `Alerjen RİSKİ: Profilindeki ${matched.join(', ')} bulundu.`
                : `Alerjen riski bulunmuyor.`;

              let additiveMsg = "";

              if (hasHighRisky) {
                bg = 'bg-error/5 border-error/20';
                iconBg = 'bg-error text-white';
                titleColor = 'text-error';
                icon = 'gpp_maybe';
                title = hasAllergen ? 'Yüksek Risk & Alerjen' : 'Yüksek Riskli Ürün';
                const names = risky.filter((r) => r.severity === 'HIGH').map((r) => r.name).join(', ');
                additiveMsg = `${names} nedeniyle Yüksek Risk. Sağlık açısından tehlikeli olabilir.`;
              } else if (hasMediumRisky) {
                bg = 'bg-tertiary/5 border-tertiary/20';
                iconBg = 'bg-tertiary text-white';
                titleColor = 'text-tertiary';
                icon = 'warning';
                title = hasAllergen ? 'Orta Risk & Alerjen' : 'Dikkatli Tüketilmeli';
                const names = risky.filter((r) => r.severity === 'MEDIUM').map((r) => r.name).join(', ');
                additiveMsg = `${names} nedeniyle Orta Risk. Sınırlı tüketim önerilir.`;
              } else if (hasLowRisky) {
                bg = 'bg-secondary/5 border-secondary/20';
                iconBg = 'bg-secondary text-white';
                titleColor = 'text-secondary';
                icon = 'info';
                title = hasAllergen ? 'Düşük Risk & Alerjen' : 'Düşük Riskli Ürün';
                const names = risky.filter((r) => r.severity === 'LOW').map((r) => r.name).join(', ');
                additiveMsg = `${names} nedeniyle Düşük Risk. Aşırı tüketimde dikkatli olunmalı.`;
              } else {
                if (hasAllergen) {
                  bg = 'bg-error/5 border-error/20';
                  iconBg = 'bg-error text-white';
                  titleColor = 'text-error';
                  icon = 'warning';
                  title = 'Alerjen Tespit Edildi';
                  additiveMsg = `Bilinen zararlı katkı maddesi içermiyor.`;
                } else {
                  additiveMsg = `Zararlı veya şüpheli katkı maddesi tespit edilmedi.`;
                }
              }

              return (
                <div className={`p-6 md:p-8 rounded-3xl border-2 shadow-sm flex flex-col sm:flex-row items-center gap-6 ${bg}`}>
                  <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md ${iconBg}`}>
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h3 className={`text-xl md:text-2xl font-headline font-black mb-2 ${titleColor}`}>{title}</h3>
                    <p className="text-on-surface-variant font-medium text-sm md:text-base leading-relaxed">
                      <span className={hasAllergen ? 'font-bold text-error' : ''}>{allergenMsg}</span>{' '}
                      {additiveMsg}
                    </p>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* Besin Değerleri Kartları (Etiket Taramasında Gizli) */}
          {analysisResult.source !== 'label_ocr' && (
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
          )}

          {/* ── Sağlık Riski Taraması (Genel Zararlı/Şüpheli Maddeler) ─── */}
          {analysisResult.source !== 'label_ocr' && (
            <section>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">Sağlık Riski Taraması</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    EFSA, IARC ve AB yönetmeliklerine göre genel sağlık açısından dikkat çekilen maddeler
                  </p>
                </div>
                {analysisResult.analysisResult?.riskyAdditives?.length > 0 && (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary/15 text-tertiary text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">policy</span>
                    {analysisResult.analysisResult.riskyAdditives.length} bulgular
                  </span>
                )}
              </div>

              {analysisResult.analysisResult?.riskyAdditives?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.analysisResult.riskyAdditives.map((risk: any) => {
                    const sevConfig: Record<string, { ring: string; bg: string; text: string; iconBg: string; icon: string; label: string }> = {
                      HIGH: { ring: 'border-error/40', bg: 'bg-error/5', text: 'text-error', iconBg: 'bg-error/15 text-error', icon: 'gpp_maybe', label: 'Yüksek Risk' },
                      MEDIUM: { ring: 'border-tertiary/40', bg: 'bg-tertiary/10', text: 'text-tertiary', iconBg: 'bg-tertiary/15 text-tertiary', icon: 'warning', label: 'Orta Risk' },
                      LOW: { ring: 'border-secondary/40', bg: 'bg-secondary/10', text: 'text-secondary', iconBg: 'bg-secondary/15 text-secondary', icon: 'info', label: 'Hassas Gruplar' }
                    };
                    const c = sevConfig[risk.severity] || sevConfig.LOW;
                    const catLabel: Record<string, string> = {
                      colorant: 'Renklendirici',
                      preservative: 'Koruyucu',
                      sweetener: 'Tatlandırıcı',
                      flavor_enhancer: 'Tat Artırıcı',
                      emulsifier: 'Emülgatör',
                      fat: 'Yağ',
                      sugar: 'Şeker',
                      other: 'Diğer'
                    };

                    return (
                      <div key={risk.code} className={`relative rounded-2xl border-2 ${c.ring} ${c.bg} p-5 shadow-sm`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <span className="material-symbols-outlined text-xl">{c.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <h4 className="font-headline font-bold text-on-surface text-base leading-tight">{risk.name}</h4>
                              <span className={`text-[10px] font-extrabold ${c.text} uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container-lowest/70 border border-current/20 whitespace-nowrap`}>
                                {c.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 mb-2">
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{catLabel[risk.category] || risk.category}</span>
                              <span className="text-on-surface-variant/40">•</span>
                              <span className={`text-[11px] font-bold ${c.text}`}>{risk.shortLabel}</span>
                            </div>
                            <p className="text-sm text-on-surface-variant leading-relaxed">{risk.warning}</p>

                            {risk.sensitiveGroups?.length > 0 && (
                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Hassas:</span>
                                {risk.sensitiveGroups.map((g: string) => (
                                  <span key={g} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface">
                                    {g}
                                  </span>
                                ))}
                              </div>
                            )}

                            {risk.source && (
                              <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-xs text-on-surface-variant">verified</span>
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Kaynak:</span>
                                <span className="text-[11px] font-semibold text-on-surface">{risk.source}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card p-8 rounded-2xl border-2 border-primary/20 bg-primary/10 flex items-center gap-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-on-surface">Bilinen zararlı/şüpheli madde tespit edilmedi</h4>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                      Veritabanımızdaki riskli E-kodları ve içeriklerden hiçbiri bu üründe yer almıyor.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Alt detay kartları (E-kodu tüm liste + Alerjen etiketi) ─── */}
          {analysisResult.source !== 'label_ocr' && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest/70 p-5 rounded-2xl border border-outline-variant/20 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-secondary">science</span>
                  <h4 className="font-headline font-bold text-on-surface">Tüm E-Kodları</h4>
                </div>
                {analysisResult.food.eCodes?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.food.eCodes.map((c: string) => (
                      <span key={c} className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold">{c}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant italic">E-kod tespit edilmedi.</p>
                )}
              </div>

              <div className="bg-surface-container-lowest/70 p-5 rounded-2xl border border-outline-variant/20 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-error">coronavirus</span>
                  <h4 className="font-headline font-bold text-on-surface">Etiket Alerjenleri</h4>
                </div>
                {analysisResult.food.allergens?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.food.allergens.map((a: string) => (
                      <span key={a} className="px-2.5 py-1 rounded-full bg-error/10 text-error text-xs font-bold">{a}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant italic">Alerjen bilgisi yok.</p>
                )}
              </div>
            </section>
          )}

          {/* ── AI Öneri Paneli ── */}
          {analysisResult.source !== 'label_ocr' && aiRecommendation && (
            <section className="mt-8">
              <div className="glass-card p-6 md:p-8 rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-secondary/5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-9xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>

                <div className="relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                      </div>
                      <div>
                        <h3 className="font-headline font-extrabold text-xl md:text-2xl text-on-surface tracking-tight">Diyetisyen Yapay Zeka</h3>
                        <p className="text-sm font-medium text-primary tracking-wide">KİŞİSELLEŞTİRİLMİŞ ÖNERİ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-surface px-4 py-2 rounded-2xl shadow-sm border border-outline-variant/20">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Sağlık Skoru</span>
                        <span className="text-sm font-extrabold text-on-surface">{aiRecommendation.scoreLabel}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-lg shadow-inner" style={{
                        background: aiRecommendation.overallScore >= 8 ? '#10b981' : aiRecommendation.overallScore >= 5 ? '#f59e0b' : '#ef4444'
                      }}>
                        {aiRecommendation.overallScore}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-primary">
                        <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                        <h4 className="font-bold text-sm">Günlük Tüketim Limiti</h4>
                      </div>
                      <p className="text-on-surface text-sm font-medium leading-relaxed">{aiRecommendation.dailyLimit}</p>
                    </div>

                    <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-secondary">
                        <span className="material-symbols-outlined text-[20px]">track_changes</span>
                        <h4 className="font-bold text-sm">Hedefe Uygunluk</h4>
                      </div>
                      <p className="text-on-surface text-sm font-medium leading-relaxed">{aiRecommendation.goalFit}</p>
                    </div>

                    <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-tertiary">
                        <span className="material-symbols-outlined text-[20px]">pie_chart</span>
                        <h4 className="font-bold text-sm">Kalori Etkisi</h4>
                      </div>
                      <p className="text-on-surface text-sm font-medium leading-relaxed">{aiRecommendation.calorieContext}</p>
                    </div>

                    <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-primary">
                        <span className="material-symbols-outlined text-[20px]">schedule</span>
                        <h4 className="font-bold text-sm">Tüketim Zamanı</h4>
                      </div>
                      <p className="text-on-surface text-sm font-medium leading-relaxed">{aiRecommendation.bestTimeToEat}</p>
                    </div>

                    {aiRecommendation.healthySwap && (
                      <div className="md:col-span-2 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-green-500">
                          <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                          <h4 className="font-bold text-sm">Daha Sağlıklı Alternatif</h4>
                        </div>
                        <p className="text-on-surface text-sm font-medium leading-relaxed">{aiRecommendation.healthySwap}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-center p-4 bg-primary/10 rounded-2xl text-primary font-medium text-sm text-center">
                    {aiRecommendation.tipEmoji}
                  </div>
                </div>
              </div>
            </section>
          )}

          {aiRecommendLoading && (
            <section className="mt-8 glass-card p-8 rounded-3xl border border-outline-variant/15 animate-pulse">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-on-surface/10 rounded w-1/4"></div>
                  <div className="h-3 bg-on-surface/5 rounded w-1/3"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-on-surface/5 rounded-2xl"></div>
                ))}
              </div>
            </section>
          )}

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

      {/* ─── KULLANICIYA ÖZEL TARAMA GEÇMİŞİ ─── */}
      <section className="mt-16 space-y-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl">history</span>
              Tarama Geçmişim
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Taradığın ürünler burada saklanır. <strong>"Tükettim"</strong> dediğin kayıtlar günlük kalori sayacına eklenir.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-surface-container rounded-full p-1 text-xs font-bold flex-wrap">
            <button
              onClick={() => setHistoryFilter('all')}
              className={`px-3 py-1.5 rounded-full transition ${historyFilter === 'all' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Tümü ({scannedOnly.length})
            </button>
            <button
              onClick={() => setHistoryFilter('pending')}
              className={`px-3 py-1.5 rounded-full transition ${historyFilter === 'pending' ? 'bg-tertiary text-on-tertiary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Bekleyen ({pendingCount})
            </button>
            <button
              onClick={() => setHistoryFilter('consumed')}
              className={`px-3 py-1.5 rounded-full transition ${historyFilter === 'consumed' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Tüketildi ({consumedCount})
            </button>
            <button
              onClick={() => setHistoryFilter('dismissed')}
              className={`px-3 py-1.5 rounded-full transition ${historyFilter === 'dismissed' ? 'bg-on-surface-variant text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Tüketmedim ({dismissedCount})
            </button>
          </div>
        </div>

        {historyLoading ? (
          <div className="glass-card p-10 rounded-3xl text-center border-dashed border-2 border-outline-variant/30">
            <span className="material-symbols-outlined text-on-surface-variant/50 text-4xl animate-pulse">hourglass</span>
            <p className="text-on-surface-variant font-medium mt-2">Geçmiş yükleniyor…</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="glass-card p-10 rounded-3xl text-center border-dashed border-2 border-outline-variant/30">
            <span className="material-symbols-outlined text-on-surface-variant/50 text-5xl">inventory_2</span>
            <p className="text-on-surface-variant font-medium mt-2">
              {historyFilter === 'pending'
                ? 'Onay bekleyen tarama yok.'
                : historyFilter === 'consumed'
                  ? 'Henüz tüketim onayı verdiğin tarama yok.'
                  : historyFilter === 'dismissed'
                    ? '"Tüketmedim" olarak işaretlenmiş ürün yok.'
                    : 'Henüz bir ürün taramadın.'}
            </p>
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Yukarıdan barkod gir veya kamera ile tara — taradığın her ürün burada listelenir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredHistory.map((scan: any) => {
              const isConsumed = scan.consumed === true;
              const isDismissed = scan.dismissed === true;
              const hasAllergen = (scan.analysisResult?.matchedAllergens?.length || 0) > 0;
              const hasHighRisk = scan.riskyAdditives?.some((r: any) => r.severity === 'HIGH');
              const factor = (scan.servingSize || 100) / 100;
              const totalKcal = Math.round((scan.foodId?.calories || 0) * factor);
              const isBusy = busyId === scan._id;

              return (
                <div
                  key={scan._id}
                  className={`p-4 rounded-2xl border-2 transition-all shadow-sm ${isDismissed
                    ? 'bg-surface-container/40 border-outline-variant/30 opacity-75'
                    : hasAllergen
                      ? 'bg-error/5 border-error/30'
                      : hasHighRisk
                        ? 'bg-tertiary/10 border-tertiary/30'
                        : isConsumed
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-surface-container-lowest/70 border-outline-variant/30 hover:border-primary/40'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDismissed ? 'bg-on-surface-variant/15 text-on-surface-variant' :
                      hasAllergen ? 'bg-error/15 text-error' :
                        hasHighRisk ? 'bg-tertiary/15 text-tertiary' :
                          isConsumed ? 'bg-primary/15 text-primary' :
                            'bg-primary/10 text-primary'
                      }`}>
                      <span className="material-symbols-outlined">
                        {isDismissed ? 'do_not_disturb_on' : 'inventory_2'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h4 className={`font-bold text-sm line-clamp-2 leading-tight ${isDismissed ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                          {scan.foodId?.productName || 'Bilinmeyen ürün'}
                        </h4>
                        <span className={`text-sm font-extrabold whitespace-nowrap ${isDismissed ? 'text-on-surface-variant' : 'text-primary'}`}>
                          {totalKcal} <span className="text-[10px] font-bold opacity-70">KCAL</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {isDismissed ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-on-surface-variant/15 text-on-surface-variant text-[9px] font-extrabold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[11px]">do_not_disturb_on</span>
                            Tüketmedim
                          </span>
                        ) : isConsumed ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-extrabold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[11px]">check_circle</span>
                            Tüketildi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-tertiary/15 text-tertiary text-[9px] font-extrabold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[11px]">pending</span>
                            Onay Bekliyor
                          </span>
                        )}
                        {!isDismissed && hasAllergen && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-error/10 text-error text-[9px] font-extrabold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[11px]">warning</span>
                            Alerjen
                          </span>
                        )}
                        {!isDismissed && hasHighRisk && !hasAllergen && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-tertiary/15 text-tertiary text-[9px] font-extrabold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[11px]">gpp_maybe</span>
                            Yüksek Risk
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tight mt-1.5">
                        {new Date(scan.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{scan.servingSize || 100}g
                      </p>
                      {isDismissed && scan.dismissedAt && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-on-surface-variant/10 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          <span className="text-[10px] font-bold">{getDismissExpiry(scan.dismissedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Aksiyon Butonları */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant/15">
                    {isDismissed ? (
                      <>
                        <button
                          onClick={() => handleHistoryRestore(scan._id)}
                          disabled={isBusy}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition disabled:opacity-50"
                          title="Tüketmedim işaretini geri al, otomatik silmeyi iptal et"
                        >
                          <span className="material-symbols-outlined text-base">restore</span>
                          Geri Yükle
                        </button>
                        <button
                          onClick={() => handleHistoryDelete(scan._id)}
                          disabled={isBusy}
                          className="w-9 h-9 rounded-lg bg-transparent hover:bg-error/10 text-on-surface-variant hover:text-error flex items-center justify-center transition disabled:opacity-50"
                          title="Şimdi sil"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </>
                    ) : isConsumed ? (
                      <>
                        <button
                          onClick={() => handleHistoryUnconsume(scan._id)}
                          disabled={isBusy}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-base">undo</span>
                          Geri Al
                        </button>
                        <button
                          onClick={() => handleHistoryDelete(scan._id)}
                          disabled={isBusy}
                          className="w-9 h-9 rounded-lg bg-transparent hover:bg-error/10 text-on-surface-variant hover:text-error flex items-center justify-center transition disabled:opacity-50"
                          title="Geçmişten sil"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleHistoryConsume(scan._id, scan.servingSize)}
                          disabled={isBusy}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-extrabold hover:opacity-90 transition disabled:opacity-50 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-base">add_circle</span>
                          {isBusy ? 'Ekleniyor…' : 'Tükettim'}
                        </button>
                        <button
                          onClick={() => handleHistoryDismiss(scan._id)}
                          disabled={isBusy}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface text-xs font-bold transition disabled:opacity-50"
                          title="Bu ürünü tüketmedim — 24 saat sonra otomatik silinecek"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                          Tüketmedim
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Kamera Barkod Tarayıcı ─── */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => {
          setScannerOpen(false);
          setMode('barcode');
          setBarcode(code);
          setError(null);
          setNeedsOcr(false);
          handleScan(undefined, code);
        }}
      />

      {/* ─── Etiket Fotoğraf OCR ─── */}
      <OCRScanner
        open={ocrOpen}
        onClose={() => setOcrOpen(false)}
        onText={(text) => {
          setOcrText((prev) => prev ? prev + '\n' + text : text);
          setOcrOpen(false);
        }}
      />

      <OCRScanner
        open={labelOcrOpen}
        onClose={() => setLabelOcrOpen(false)}
        onText={(text) => handleOcrResult(text, true)}
      />
    </main>
  );
}
