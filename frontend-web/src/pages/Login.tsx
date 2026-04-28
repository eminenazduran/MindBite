import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginUser({ email, password });
      if (res.status === 'success') {
        login(res.data.user, res.data.token);
        navigate('/dashboard');
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError('Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-stretch bg-background overflow-hidden">
      {/* Left Side: Brand & Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-emerald-950 items-center justify-center p-12">
        <div 
          className="absolute inset-0 z-0 opacity-60 animate-fluid"
          style={{
            backgroundImage: 'url("/auth-side.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent z-[1]" />
        
        <div className="relative z-10 max-w-lg text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 text-white text-sm font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Akıllı Gıda Analizi
          </div>
          <h2 className="text-5xl font-headline font-extrabold text-white mb-6 leading-tight">
            Neyi yediğini bil, <br />
            <span className="text-emerald-400 italic">kontrollü yaşa.</span>
          </h2>
          <p className="text-emerald-100/80 text-lg leading-relaxed">
            Binlerce ürün verisi ve AI destekli analiz motorumuzla beslenme alışkanlıklarını baştan tanımlıyoruz.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6 text-left">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="material-symbols-outlined text-emerald-400 mb-2">qr_code_scanner</span>
              <h4 className="text-white font-bold text-sm">Hızlı Tarama</h4>
              <p className="text-emerald-100/60 text-xs">Barkodu okut, anında içeriği öğren.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="material-symbols-outlined text-emerald-400 mb-2">health_and_safety</span>
              <h4 className="text-white font-bold text-sm">Risk Analizi</h4>
              <p className="text-emerald-100/60 text-xs">Sana özel alerjen uyarıları al.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 bg-surface">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <Link to="/" className="text-2xl font-bold text-primary font-headline mb-8 block lg:hidden">MindBite</Link>
            <h1 className="text-4xl font-headline font-extrabold text-on-surface mb-3 tracking-tight">Giriş Yap</h1>
            <p className="text-on-surface-variant font-medium">Beslenme hedeflerine bir adım daha yaklaş.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant block ml-1" htmlFor="email">E-posta Adresi</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none bg-surface-container-lowest text-on-surface transition-all shadow-sm"
                placeholder="ornek@mail.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-on-surface-variant block" htmlFor="password">Şifre</label>
                <a href="#" className="text-xs font-bold text-primary hover:underline">Şifremi Unuttum</a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 pr-14 rounded-2xl border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none bg-surface-container-lowest text-on-surface transition-all shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-error-container/40 text-on-error-container rounded-2xl text-sm font-semibold flex items-center gap-3 border border-error/10">
                <span className="material-symbols-outlined text-error">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 hero-gradient text-on-primary font-headline font-bold rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-outline-variant/30 text-center">
            <span className="text-on-surface-variant font-medium">Hesabınız yok mu?</span>{' '}
            <Link to="/register" className="text-primary font-extrabold hover:underline decoration-2 underline-offset-4 ml-1">
              Hemen Kayıt Olun
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

