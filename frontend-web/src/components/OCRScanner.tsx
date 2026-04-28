import { useEffect, useRef, useState } from 'react';
import Tesseract, { createWorker } from 'tesseract.js';

interface Props {
  open: boolean;
  onClose: () => void;
  onText: (text: string) => void;
}

type Stage = 'idle' | 'loading_engine' | 'preview' | 'processing' | 'done' | 'error';

export default function OCRScanner({ open, onClose, onText }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState('');

  // Modal açıldığında worker'ı hazırla (lazy init)
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const setup = async () => {
      if (workerRef.current) return;
      setStage('loading_engine');
      setProgress(0);
      try {
        const worker = await createWorker(['tur', 'eng'], 1, {
          logger: (m: any) => {
            if (cancelled) return;
            if (m.status === 'recognizing text' && typeof m.progress === 'number') {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });
        if (cancelled) {
          await worker.terminate();
          return;
        }
        workerRef.current = worker;
        setStage('idle');
      } catch (e: any) {
        console.error('OCR worker init failed', e);
        setError('OCR motoru yüklenemedi: ' + (e.message || 'Bilinmeyen hata'));
        setStage('error');
      }
    };
    setup();

    return () => { cancelled = true; };
  }, [open]);

  // Kapanırken state'i sıfırla
  useEffect(() => {
    if (!open) {
      setImageUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
      setStage('idle');
      setProgress(0);
      setError(null);
      setResultText('');
    }
  }, [open]);

  // Bileşen unmount olurken worker'ı serbest bırak
  useEffect(() => {
    return () => {
      const w = workerRef.current;
      if (w) {
        w.terminate().catch(() => { /* yoksay */ });
        workerRef.current = null;
      }
    };
  }, []);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    setError(null);
    setResultText('');
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStage('preview');
  };

  const runOcr = async () => {
    if (!imageUrl) return;
    if (!workerRef.current) {
      setError('OCR motoru henüz hazır değil, lütfen birkaç saniye bekleyin.');
      return;
    }
    setStage('processing');
    setProgress(0);
    setError(null);

    try {
      const { data } = await workerRef.current.recognize(imageUrl);
      const cleaned = (data.text || '')
        .replace(/[\u00AD]/g, '')          // soft-hyphen
        .replace(/[ \t]+\n/g, '\n')         // satır sonu boşlukları
        .replace(/\n{3,}/g, '\n\n')         // çoklu boş satır
        .replace(/-\n(?=\w)/g, '')          // satır sonu tire kırılması
        .trim();

      if (!cleaned) {
        setError('Görselden okunabilir metin çıkarılamadı. Daha net bir fotoğraf deneyin.');
        setStage('preview');
        return;
      }

      setResultText(cleaned);
      setStage('done');
    } catch (e: any) {
      console.error('OCR failed', e);
      setError('OCR sırasında hata: ' + (e.message || 'Bilinmeyen hata'));
      setStage('preview');
    }
  };

  const accept = () => {
    if (!resultText.trim()) return;
    onText(resultText.trim());
  };

  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setStage('idle');
    setProgress(0);
    setResultText('');
    setError(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-surface rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/20">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">document_scanner</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Etiket Fotoğrafından OCR</h3>
              <p className="text-xs text-on-surface-variant">Paketin arkasını fotoğraflayın — metin otomatik çıkarılır</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center transition"
            aria-label="Kapat"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Boş durum: kaynak seçimi */}
          {stage === 'idle' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="group relative p-8 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 transition flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <span className="material-symbols-outlined text-primary text-3xl">photo_camera</span>
                </div>
                <p className="font-bold text-on-surface">Fotoğraf Çek</p>
                <p className="text-xs text-on-surface-variant mt-1">Mobilde arka kamerayı açar</p>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative p-8 rounded-2xl border-2 border-dashed border-secondary/30 hover:border-secondary bg-secondary/5 hover:bg-secondary/10 transition flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary/15 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <span className="material-symbols-outlined text-secondary text-3xl">upload_file</span>
                </div>
                <p className="font-bold text-on-surface">Galeriden Yükle</p>
                <p className="text-xs text-on-surface-variant mt-1">JPG / PNG / WEBP</p>
              </button>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}

          {/* Motor yükleniyor */}
          {stage === 'loading_engine' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mb-4"></span>
              <p className="font-bold text-on-surface">OCR motoru hazırlanıyor</p>
              <p className="text-sm text-on-surface-variant mt-1">İlk açılışta Türkçe dil paketi indiriliyor (~7 MB), sonraki açılışlar anında olacak.</p>
            </div>
          )}

          {/* Önizleme */}
          {(stage === 'preview' || stage === 'processing') && imageUrl && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black border border-outline-variant/20">
                <img src={imageUrl} alt="Önizleme" className="w-full max-h-[50vh] object-contain" />
                {stage === 'processing' && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <span className="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin mb-3"></span>
                    <p className="text-white font-bold">Metin çıkarılıyor...</p>
                    <div className="w-48 h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-white/80 text-xs mt-1.5 font-mono">%{progress}</p>
                  </div>
                )}
              </div>

              {stage === 'preview' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={runOcr}
                    className="flex-1 px-6 py-3.5 hero-gradient text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow"
                  >
                    <span className="material-symbols-outlined">auto_awesome</span>
                    Metni Çıkar
                  </button>
                  <button
                    onClick={reset}
                    className="px-6 py-3.5 rounded-xl text-on-surface-variant border-2 border-outline-variant/30 font-bold hover:bg-surface-container-high transition"
                  >
                    Başka Fotoğraf
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sonuç */}
          {stage === 'done' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <p className="font-bold text-on-surface">Metin çıkarıldı</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                    {resultText.length} karakter
                  </span>
                </div>
                <button
                  onClick={reset}
                  className="text-xs font-bold text-on-surface-variant hover:text-on-surface flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Yeniden çek
                </button>
              </div>

              <textarea
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                className="w-full p-4 rounded-xl border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none min-h-[180px] bg-surface-container-lowest text-on-surface font-medium text-sm leading-relaxed"
              />
              <p className="text-xs text-on-surface-variant">
                Metni kontrol edin — yanlış okunan kısımları düzeltebilirsiniz. Onayladığınızda AI etiketi analiz eder.
              </p>
            </div>
          )}

          {/* Hata */}
          {error && (
            <div className="bg-error/5 border border-error/30 rounded-2xl p-4 flex items-start gap-3">
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-outline-variant/20 bg-surface-container-low">
          <p className="text-xs text-on-surface-variant hidden sm:block">
            Türkçe + İngilizce destekli — tüm işlem cihazınızda yapılır
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:text-on-surface transition"
            >
              Vazgeç
            </button>
            {stage === 'done' && (
              <button
                onClick={accept}
                disabled={!resultText.trim()}
                className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check</span>
                Kullan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
