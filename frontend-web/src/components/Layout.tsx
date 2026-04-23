import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMealReminders } from '../hooks/useMealReminders';

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-emerald-300 transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useMealReminders();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-xl shadow-[0_16px_48px_rgba(25,28,29,0.06)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/mindbite-logo.png"
              alt="MindBite"
              className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-primary/10 group-hover:ring-primary/30 group-hover:scale-105 transition-all"
            />
            <span className="text-xl font-bold tracking-tighter text-emerald-900 dark:text-emerald-50 font-headline">MindBite</span>
          </Link>
          <div className="hidden md:flex gap-8 items-center font-headline font-semibold tracking-tight">
            <Link className="text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-100 transition-all duration-300" to="/">Ana Sayfa</Link>
            {user && (
              <>
                <Link className="text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-100 transition-all duration-300" to="/dashboard">Panelim</Link>
                <Link className="text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-100 transition-all duration-300" to="/analysis">Ürünler</Link>
                <Link className="text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-100 transition-all duration-300" to="/profile">Profil</Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button 
                  onClick={handleLogout}
                  className="px-5 py-2 text-sm font-bold text-error border border-error/20 rounded-full hover:bg-error/5 transition-all"
                >
                  Çıkış
                </button>
                <button className="p-2 text-emerald-900 dark:text-emerald-50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/50 rounded-full transition-transform active:scale-90">
                  <span className="material-symbols-outlined">account_circle</span>
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link 
                  to="/login"
                  className="px-5 py-2 text-sm font-bold text-primary rounded-full hover:bg-primary/5 transition-all"
                >
                  Giriş Yap
                </Link>
                <Link 
                  to="/register"
                  className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-full hover:shadow-lg transition-all"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <Outlet />

      {/* Bottom NavBar for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-6 pb-6 pt-3 bg-white/85 dark:bg-emerald-950/85 backdrop-blur-2xl z-50 rounded-t-[3rem] shadow-[0_-16px_48px_rgba(25,28,29,0.06)]">
        <Link className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-5 py-2 hover:text-emerald-700 dark:hover:text-emerald-300" to="/">
          <span className="material-symbols-outlined">home</span>
          <span className="font-['Inter'] text-[10px] font-medium">Ana Sayfa</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-5 py-2 hover:text-emerald-700 dark:hover:text-emerald-300" to="/dashboard">
          <span className="material-symbols-outlined">monitoring</span>
          <span className="font-['Inter'] text-[10px] font-medium">Takip</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-5 py-2 hover:text-emerald-700 dark:hover:text-emerald-300" to="/analysis">
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-['Inter'] text-[10px] font-medium">Analiz</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-5 py-2 hover:text-emerald-700 dark:hover:text-emerald-300" to="/profile">
          <span className="material-symbols-outlined">person</span>
          <span className="font-['Inter'] text-[10px] font-medium">Profil</span>
        </Link>
      </nav>

      {/* Footer */}
      <footer className="w-full pt-16 pb-8 px-8 bg-slate-50 dark:bg-emerald-950/20 mt-20 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 pb-10 border-b border-outline-variant/10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <img src="/mindbite-logo.png" alt="MindBite" className="w-9 h-9 rounded-xl object-cover ring-1 ring-primary/10" />
                <span className="font-['Manrope'] font-bold text-lg text-emerald-900 dark:text-emerald-50">MindBite</span>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                Gıda etiketlerinin arkasındaki bilimi sadeleştiren, bilinçli beslenme platformu.
              </p>
              <div className="flex items-center gap-2 pt-2">
                {[
                  { icon: "mail", href: "mailto:destek@mindbite.app", label: "E-posta" },
                  { icon: "link", href: "https://github.com", label: "GitHub" },
                  { icon: "alternate_email", href: "https://twitter.com", label: "Twitter" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-9 h-9 rounded-full bg-white dark:bg-emerald-900/40 border border-outline-variant/20 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">{s.icon}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Ürün */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <h4 className="font-['Manrope'] font-bold text-sm text-emerald-900 dark:text-emerald-50 uppercase tracking-wider">Ürün</h4>
              <ul className="space-y-2 text-sm">
                <FooterLink to="/">Ana Sayfa</FooterLink>
                <FooterLink to="/dashboard">Panelim</FooterLink>
                <FooterLink to="/analysis">Analiz</FooterLink>
                <FooterLink to="/profile">Profil</FooterLink>
              </ul>
            </div>

            {/* Şirket */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <h4 className="font-['Manrope'] font-bold text-sm text-emerald-900 dark:text-emerald-50 uppercase tracking-wider">Şirket</h4>
              <ul className="space-y-2 text-sm">
                <FooterLink to="/about">Hakkımızda</FooterLink>
                <FooterLink to="/contact">İletişim</FooterLink>
                <li>
                  <span className="text-slate-400 dark:text-slate-500 inline-flex items-center gap-1.5">
                    Kariyer
                    <span className="px-1.5 py-0.5 bg-slate-200/60 dark:bg-slate-700/30 text-[9px] font-bold rounded tracking-wider">YAKINDA</span>
                  </span>
                </li>
                <li>
                  <span className="text-slate-400 dark:text-slate-500 inline-flex items-center gap-1.5">
                    Blog
                    <span className="px-1.5 py-0.5 bg-slate-200/60 dark:bg-slate-700/30 text-[9px] font-bold rounded tracking-wider">YAKINDA</span>
                  </span>
                </li>
              </ul>
            </div>

            {/* Yasal */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <h4 className="font-['Manrope'] font-bold text-sm text-emerald-900 dark:text-emerald-50 uppercase tracking-wider">Yasal</h4>
              <ul className="space-y-2 text-sm">
                <FooterLink to="/privacy">Gizlilik Politikası</FooterLink>
                <FooterLink to="/privacy">Kullanım Koşulları</FooterLink>
                <FooterLink to="/privacy">KVKK</FooterLink>
                <FooterLink to="/privacy">Çerezler</FooterLink>
              </ul>
            </div>

            {/* Destek kartı */}
            <div className="col-span-2 md:col-span-2 rounded-xl p-5 bg-primary/5 border border-primary/10 space-y-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
              </div>
              <p className="font-['Manrope'] font-bold text-sm text-emerald-900 dark:text-emerald-50">Yardıma mı ihtiyacınız var?</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                24 saat içinde e-posta ile size dönüyoruz.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                İletişime Geç
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Alt çizgi */}
          <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <p>© {new Date().getFullYear()} MindBite. Tüm Hakları Saklıdır.</p>
            <div className="flex items-center gap-2">
              <span>Türkiye'de</span>
              <span className="material-symbols-outlined text-sm text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span>ile tasarlandı</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
