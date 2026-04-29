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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'photo'>('camera');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

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
    if (scanMode !== 'camera') return;
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
  }, [open, scanMode]);

  // Aktif kamera değişince taramayı başlat
  useEffect(() => {
    if (!open || scanMode !== 'camera' || !activeDeviceId || !videoRef.current || !readerRef.current) return;
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
      if (photoPreviewUrl) {
        try { URL.revokeObjectURL(photoPreviewUrl); } catch { /* yoksay */ }
      }
      setPhotoPreviewUrl(null);
      setPhotoFileName(null);
      detectedRef.current = false;
      setStatus('idle');
      setError(null);
      setLastSeen(null);
    }
  }, [open]); // photoPreviewUrl intentionally read from closure; it's only used on close

  if (!open) return null;

  const switchCamera = () => {
    if (devices.length < 2 || !activeDeviceId) return;
    const idx = devices.findIndex(d => d.deviceId === activeDeviceId);
    const next = devices[(idx + 1) % devices.length];
    setActiveDeviceId(next.deviceId);
  };

  const pickPhoto = () => {
    try { controlsRef.current?.stop(); } catch { /* yoksay */ }
    setScanMode('photo');
    setError(null);
    setLastSeen(null);
    setStatus('idle');
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const scanFromPhotoFile = async (file: File | null) => {
    if (!file || !readerRef.current) return;

    detectedRef.current = false;
    setError(null);
    setLastSeen(null);
    setStatus('scanning');

    if (photoPreviewUrl) {
      try { URL.revokeObjectURL(photoPreviewUrl); } catch { /* yoksay */ }
    }

    const url = URL.createObjectURL(file);
    setPhotoPreviewUrl(url);
    setPhotoFileName(file.name || 'Fotoğraf');

    try {
      const img = new Image();
      img.src = url;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Görsel yüklenemedi.'));
      });

      // Görsel çok büyükse (modern telefonlar 10MP+ çekiyor), ZXing yavaşlayabilir veya hata verebilir.
      // 1280px genişliğe düşürerek performansı optimize edelim.
      const MAX_WIDTH = 1280;
      const MAX_HEIGHT = 1280;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width > height) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        } else {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context oluşturulamadı.');
      ctx.drawImage(img, 0, 0, width, height);

      // Canvas'tan tara
      const result = await readerRef.current.decodeFromCanvas(canvas);
      const text = result?.getText?.() ?? '';

      setLastSeen(text);

      if (/^\d{8,14}$/.test(text)) {
        detectedRef.current = true;
        setStatus('success');

        setTimeout(() => {
          onDetected(text);
        }, 350);
        return;
      }

      setStatus('error');
      setError('Fotoğrafta uygun bir barkod bulunamadı. Lütfen barkodun net göründüğünden ve ışığın yeterli olduğundan emin olun.');
    } catch (e: any) {
      console.error('Fotoğraf tarama hatası:', e);
      setStatus('error');
      // ZXing barkod bulamazsa genelde 'NotFoundException' fırlatır, bu bir hata değil "bulunamadı" durumudur.
      if (e.name === 'NotFoundException' || e.message?.includes('decode')) {
        setError('Görselde barkod tespit edilemedi. Lütfen farklı bir açıdan veya daha net bir fotoğraf deneyin.');
      } else {
        setError('Fotoğraftan barkod okunamadı: ' + (e?.message || 'Bilinmeyen hata'));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/20">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => scanFromPhotoFile(e.target.files?.[0] ?? null)}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Barkod Tara</h3>
              <p className="text-xs text-on-surface-variant">
                {scanMode === 'camera' ? 'Ürünün barkodunu çerçeveye hizala' : 'Barkod içeren fotoğrafı seç'}
              </p>
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
          {scanMode === 'camera' ? (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
          ) : (
            <div 
              className={`absolute inset-0 cursor-pointer transition-colors ${status === 'scanning' ? 'pointer-events-none' : 'hover:bg-primary/5'}`}
              onClick={pickPhoto}
            >
              {photoPreviewUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={photoPreviewUrl}
                    alt="Seçilen barkod fotoğrafı"
                    className={`absolute inset-0 w-full h-full object-contain bg-black transition-opacity ${status === 'scanning' ? 'opacity-50' : 'opacity-100'}`}
                  />
                  {status === 'scanning' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white text-xs font-bold">Fotoğraf Analiz Ediliyor...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                  <div className="max-w-xs animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-primary text-3xl">add_photo_alternate</span>
                    </div>
                    <p className="font-bold text-on-surface text-lg mb-1">Fotoğraf Seçin</p>
                    <p className="text-sm text-on-surface-variant">
                      Barkodun net ve parlama yapmadan göründüğü bir fotoğraf yükleyin.
                    </p>
                    <button className="mt-4 px-6 py-2 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition">
                      Dosyalara Göz At
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setScanMode('camera');
                setError(null);
                setLastSeen(null);
                setStatus('idle');
              }}
              disabled={scanMode === 'camera'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-40 transition text-sm font-bold text-on-surface"
            >
              <span className="material-symbols-outlined text-base">videocam</span>
              Kamera
            </button>

            <button
              onClick={pickPhoto}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition text-sm font-bold text-on-surface"
            >
              <span className="material-symbols-outlined text-base">image</span>
              Fotoğrafla Tara
            </button>

            <button
              onClick={switchCamera}
              disabled={scanMode !== 'camera' || devices.length < 2}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-40 transition text-sm font-bold text-on-surface"
            >
              <span className="material-symbols-outlined text-base">cameraswitch</span>
              Kamera Değiştir
            </button>
          </div>

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
