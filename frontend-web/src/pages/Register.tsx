import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await registerUser({ name, email, password });
      if (res.status === 'success') {
        login(res.data.user, res.data.token);
        navigate('/dashboard');
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError('Kayıt oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-stretch bg-white overflow-hidden">
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
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Topluluğumuza Katıl
          </div>
          <h2 className="text-5xl font-headline font-extrabold text-white mb-6 leading-tight">
            Sağlıklı yaşam <br />
            <span className="text-emerald-400 italic">şimdi başlıyor.</span>
          </h2>
          <p className="text-emerald-100/80 text-lg leading-relaxed">
            Binlerce kullanıcıyla birlikte gıda etiketlerinin gizli dünyasını keşfet ve kendine en uygun beslenme düzenini kur.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6 text-left">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="material-symbols-outlined text-emerald-400 mb-2">person_add</span>
              <h4 className="text-white font-bold text-sm">Ücretsiz Hesap</h4>
              <p className="text-emerald-100/60 text-xs">Saniyeler içinde profilini oluştur.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="material-symbols-outlined text-emerald-400 mb-2">history</span>
              <h4 className="text-white font-bold text-sm">Takip Et</h4>
              <p className="text-emerald-100/60 text-xs">Geçmiş taramalarını tek yerden yönet.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 bg-surface">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <Link to="/" className="text-2xl font-bold text-emerald-900 font-headline mb-8 block lg:hidden">MindBite</Link>
            <h1 className="text-4xl font-headline font-extrabold text-emerald-950 mb-3 tracking-tight">Kayıt Ol</h1>
            <p className="text-on-surface-variant font-medium">Yeni bir başlangıç için bilgilerinizi girin.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-900/70 block ml-1" htmlFor="name">Ad Soyad</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant/50 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 outline-none bg-white transition-all shadow-sm"
                placeholder="Ahmet Yılmaz"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-900/70 block ml-1" htmlFor="email">E-posta Adresi</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant/50 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 outline-none bg-white transition-all shadow-sm"
                placeholder="ornek@mail.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-900/70 block ml-1" htmlFor="password">Şifre</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-outline-variant/50 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 outline-none bg-white transition-all shadow-sm"
                placeholder="••••••••"
              />
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
              className="w-full py-4 bg-emerald-900 text-white font-headline font-bold rounded-2xl shadow-xl shadow-emerald-950/20 hover:bg-emerald-800 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
            >
              {loading ? 'Hesap Oluşturuluyor...' : 'Hesabı Oluştur'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-outline-variant/30 text-center">
            <span className="text-on-surface-variant font-medium">Zaten bir hesabınız var mı?</span>{' '}
            <Link to="/login" className="text-emerald-700 font-extrabold hover:underline decoration-2 underline-offset-4 ml-1">
              Giriş Yapın
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

