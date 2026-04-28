import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

interface DeviceInfo {
  deviceId: string;
  label: string;
}

export default function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const detectedRef = useRef(false);

  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'scanning' | 'success' | 'error'>('idle');
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  // Reader'ı bir kez oluştur (EAN-13, EAN-8, UPC-A/E, Code-128 — gıda paketleri için yeterli)
  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    readerRef.current = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 200 });
  }, []);

  // Modal açıldığında kameraları listele
  useEffect(() => {
    if (!open) return;
    detectedRef.current = false;
    setError(null);
    setLastSeen(null);
    setStatus('loading');

    const init = async () => {
      try {
        // İzin almak için önce bir akış aç
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        tempStream.getTracks().forEach(t => t.stop());

        const list = await BrowserMultiFormatReader.listVideoInputDevices();
        const mapped = list.map(d => ({ deviceId: d.deviceId, label: d.label || 'Kamera' }));
        setDevices(mapped);

        // Arka kamerayı tercih et
        const back = mapped.find(d => /back|rear|environment|arka/i.test(d.label));
        const chosen = back?.deviceId || mapped[0]?.deviceId || null;
        setActiveDeviceId(chosen);
      } catch (e: any) {
        console.error('Kamera erişim hatası', e);
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setError('Kamera izni reddedildi. Tarayıcı ayarlarından izin vermeniz gerekiyor.');
        } else if (e.name === 'NotFoundError') {
          setError('Cihazda kullanılabilir kamera bulunamadı.');
        } else {
          setError('Kamera başlatılamadı: ' + (e.message || 'Bilinmeyen hata'));
        }
        setStatus('error');
      }
    };
    init();
  }, [open]);

  // Aktif kamera değişince taramayı başlat
  useEffect(() => {
    if (!open || !activeDeviceId || !videoRef.current || !readerRef.current) return;
    detectedRef.current = false;
    setStatus('scanning');

    let cancelled = false;

    readerRef.current
      .decodeFromVideoDevice(activeDeviceId, videoRef.current, (result, err, controls) => {
        if (cancelled) return;
        controlsRef.current = controls;

        if (result) {
          const text = result.getText();
          setLastSeen(text);

          if (detectedRef.current) return;
          // Sadece sayısal ve makul uzunlukta barkodları kabul et
          if (/^\d{8,14}$/.test(text)) {
            detectedRef.current = true;
            setStatus('success');
            // Hafif titreşim (mobil destekliyorsa)
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try { (navigator as any).vibrate(80); } catch { /* yoksay */ }
            }
            controls.stop();
            setTimeout(() => {
              onDetected(text);
            }, 350);
          }
        }
        // err: NotFoundException her karede gelebilir, normaldir
      })
      .catch(e => {
        console.error(e);
        setError('Tarama başlatılamadı: ' + (e.message || 'Bilinmeyen hata'));
        setStatus('error');
      });

    return () => {
      cancelled = true;
      try { controlsRef.current?.stop(); } catch { /* yoksay */ }
    };
  }, [activeDeviceId, open, onDetected]);

  // Kapanırken temizle
  useEffect(() => {
    if (!open) {
      try { controlsRef.current?.stop(); } catch { /* yoksay */ }
      setStatus('idle');
    }
  }, [open]);

  if (!open) return null;

  const switchCamera = () => {
    if (devices.length < 2 || !activeDeviceId) return;
    const idx = devices.findIndex(d => d.deviceId === activeDeviceId);
    const next = devices[(idx + 1) % devices.length];
    setActiveDeviceId(next.deviceId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/20">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Barkod Tara</h3>
              <p className="text-xs text-on-surface-variant">Ürünün barkodunu çerçeveye hizala</p>
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

        {/* Video alanı */}
        <div className="relative aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Tarama çerçevesi */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-[78%] h-[42%] max-w-md">
              <div className="absolute inset-0 border-2 border-white/40 rounded-2xl"></div>
              {/* Köşe işaretleri */}
              {(['top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl',
                 'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl',
                 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl',
                 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl'] as const).map(cls => (
                <span key={cls} className={`absolute w-8 h-8 border-primary ${cls}`}></span>
              ))}
              {/* Tarayıcı çizgisi */}
              {status === 'scanning' && (
                <div className="absolute inset-x-3 top-1/2 h-0.5 bg-primary shadow-[0_0_12px_rgba(34,197,94,0.7)] animate-pulse"></div>
              )}
              {status === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-400 text-7xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Durum etiketi */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            {status === 'loading' && (
              <span className="px-4 py-1.5 rounded-full bg-black/60 text-white text-xs font-bold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                Kamera açılıyor...
              </span>
            )}
            {status === 'scanning' && (
              <span className="px-4 py-1.5 rounded-full bg-black/60 text-white text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Aranıyor...
                {lastSeen && <span className="font-mono text-[10px] opacity-70 ml-1">son: {lastSeen.slice(-6)}</span>}
              </span>
            )}
            {status === 'success' && (
              <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                Barkod bulundu — analiz ediliyor
              </span>
            )}
          </div>

          {/* Hata kaplaması */}
          {status === 'error' && error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
              <div className="text-center text-white max-w-sm">
                <span className="material-symbols-outlined text-error text-5xl mb-3 block">error</span>
                <p className="font-bold mb-2">Kamera açılamadı</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Alt aksiyonlar */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-surface-container-low">
          <button
            onClick={switchCamera}
            disabled={devices.length < 2}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-40 transition text-sm font-bold text-on-surface"
          >
            <span className="material-symbols-outlined text-base">cameraswitch</span>
            Kamera Değiştir
          </button>

          <p className="text-xs text-on-surface-variant hidden sm:block">
            EAN-13, EAN-8, UPC-A/E, Code-128 destekli
          </p>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:text-on-surface transition"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
