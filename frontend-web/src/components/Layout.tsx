import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useMealReminders } from '../hooks/useMealReminders';

const PROFILE_MENU = [
  { tab: 'profile',       label: 'Profil & Tercihler', icon: 'settings_account_box', desc: 'Bilgilerin ve tercihlerin' },
  { tab: 'security',      label: 'Güvenlik',           icon: 'lock',                 desc: 'Şifre ve hesap ayarları' },
  { tab: 'notifications', label: 'Bildirimler',        icon: 'notifications',        desc: 'Uyarı tercihlerini yönet' },
];

function ProfileDropdown({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Dışarı tıklanınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ESC ile kapat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const initials = (user?.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const goToTab = (tab: string) => {
    navigate(`/profile?tab=${tab}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm transition-all ${
          open
            ? 'bg-primary text-on-primary ring-2 ring-primary/30 scale-105'
            : 'bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 active:scale-95'
        }`}
        aria-label="Profil menüsü"
        aria-expanded={open}
      >
        {initials}
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 top-[calc(100%+8px)] w-72 bg-surface rounded-2xl shadow-2xl ring-1 ring-outline-variant/20 overflow-hidden transition-all duration-200 origin-top-right ${
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* User card */}
        <div className="px-5 pt-5 pb-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center font-headline font-bold text-primary text-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-on-surface truncate">{user?.name || 'Kullanıcı'}</p>
              <p className="text-xs text-on-surface-variant truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="py-1.5">
          {PROFILE_MENU.map(item => (
            <button
              key={item.tab}
              onClick={() => goToTab(item.tab)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-surface-container transition-colors group"
            >
              <span className="material-symbols-outlined text-xl text-on-surface-variant group-hover:text-primary transition-colors">
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface">{item.label}</p>
                <p className="text-[11px] text-on-surface-variant">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="border-t border-outline-variant/15 p-2">
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-error hover:bg-error/5 transition-colors group"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="text-sm font-bold">Çıkış Yap</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-all overflow-hidden group"
      aria-label={isDark ? 'Aydınlık temaya geç' : 'Karanlık temaya geç'}
      title={isDark ? 'Aydınlık tema' : 'Karanlık tema'}
    >
      <span
        className={`material-symbols-outlined absolute transition-all duration-500 ${
          isDark ? 'opacity-0 -rotate-180 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        light_mode
      </span>
      <span
        className={`material-symbols-outlined absolute transition-all duration-500 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-180 scale-50'
        }`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        dark_mode
      </span>
    </button>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="text-on-surface-variant hover:text-primary transition-colors"
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
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.06)] border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/mindbite-logo.png"
              alt="MindBite"
              className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-primary/10 group-hover:ring-primary/30 group-hover:scale-105 transition-all"
            />
            <span className="text-xl font-bold tracking-tighter text-on-surface font-headline">MindBite</span>
          </Link>
          <div className="hidden md:flex gap-8 items-center font-headline font-semibold tracking-tight">
            <Link className="text-on-surface-variant hover:text-on-surface transition-all duration-300" to="/">Ana Sayfa</Link>
            {user && (
              <>
                <Link className="text-on-surface-variant hover:text-on-surface transition-all duration-300" to="/dashboard">Panelim</Link>
                <Link className="text-on-surface-variant hover:text-on-surface transition-all duration-300" to="/analysis">Ürünler</Link>
                <Link className="text-on-surface-variant hover:text-on-surface transition-all duration-300" to="/profile">Profil</Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            {user ? (
                <ProfileDropdown user={user} onLogout={handleLogout} />
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
                  className="px-5 py-2 text-sm font-bold bg-primary text-on-primary rounded-full hover:shadow-lg transition-all"
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
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-6 pb-6 pt-3 bg-surface/85 backdrop-blur-2xl z-50 rounded-t-[3rem] shadow-[0_-16px_48px_rgba(0,0,0,0.06)] border-t border-outline-variant/20">
        <Link className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:text-primary" to="/">
          <span className="material-symbols-outlined">home</span>
          <span className="font-['Inter'] text-[10px] font-medium">Ana Sayfa</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:text-primary" to="/dashboard">
          <span className="material-symbols-outlined">monitoring</span>
          <span className="font-['Inter'] text-[10px] font-medium">Takip</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:text-primary" to="/analysis">
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-['Inter'] text-[10px] font-medium">Analiz</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:text-primary" to="/profile">
          <span className="material-symbols-outlined">person</span>
          <span className="font-['Inter'] text-[10px] font-medium">Profil</span>
        </Link>
      </nav>

      {/* Footer */}
      <footer className="w-full pt-16 pb-8 px-8 bg-surface-container-low mt-20 border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 pb-10 border-b border-outline-variant/30">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <img src="/mindbite-logo.png" alt="MindBite" className="w-9 h-9 rounded-xl object-cover ring-1 ring-primary/10" />
                <span className="font-['Manrope'] font-bold text-lg text-on-surface">MindBite</span>
              </Link>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
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
                    className="w-9 h-9 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">{s.icon}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Ürün */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <h4 className="font-['Manrope'] font-bold text-sm text-on-surface uppercase tracking-wider">Ürün</h4>
              <ul className="space-y-2 text-sm">
                <FooterLink to="/">Ana Sayfa</FooterLink>
                <FooterLink to="/dashboard">Panelim</FooterLink>
                <FooterLink to="/analysis">Analiz</FooterLink>
                <FooterLink to="/profile">Profil</FooterLink>
              </ul>
            </div>

            {/* Şirket */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <h4 className="font-['Manrope'] font-bold text-sm text-on-surface uppercase tracking-wider">Şirket</h4>
              <ul className="space-y-2 text-sm">
                <FooterLink to="/about">Hakkımızda</FooterLink>
                <FooterLink to="/contact">İletişim</FooterLink>
                <li>
                  <span className="text-on-surface-variant/60 inline-flex items-center gap-1.5">
                    Kariyer
                    <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[9px] font-bold rounded tracking-wider">YAKINDA</span>
                  </span>
                </li>
                <li>
                  <span className="text-on-surface-variant/60 inline-flex items-center gap-1.5">
                    Blog
                    <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant text-[9px] font-bold rounded tracking-wider">YAKINDA</span>
                  </span>
                </li>
              </ul>
            </div>

            {/* Yasal */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <h4 className="font-['Manrope'] font-bold text-sm text-on-surface uppercase tracking-wider">Yasal</h4>
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
              <p className="font-['Manrope'] font-bold text-sm text-on-surface">Yardıma mı ihtiyacınız var?</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
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
          <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
            <p>© {new Date().getFullYear()} MindBite. Tüm Hakları Saklıdır.</p>
            <div className="flex items-center gap-2">
              <span>Türkiye'de</span>
              <span className="material-symbols-outlined text-sm text-error" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span>ile tasarlandı</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
