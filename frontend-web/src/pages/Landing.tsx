import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUser, fetchHealthScore, getScanHistory, fetchDailyAdvice } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Landing() {
  const { user: authUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLoggedIn = Boolean(authUser);

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && authUser) {
      setLoading(true);
      Promise.all([
        fetchUser(authUser.id),
        fetchHealthScore(authUser.id, 1),
        getScanHistory(authUser.id, 10),
        fetchDailyAdvice()
      ]).then(([u, h, s, a]) => {
        setStats({
          user: u.data,
          score: h.data?.today?.score,
          history: s.data,
          advice: a.data
        });
      }).finally(() => setLoading(false));
    }
  }, [isLoggedIn, authUser]);

  return (
    <main className="pt-24 bg-background text-on-surface">
      {/* 📱 MOBİL ANA SAYFA (Sadece Mobil) */}
      <div className="md:hidden">
        {!isLoggedIn ? (
          /* 1. GİRİŞ YAPMAMIŞ MOBİL (ONBOARDING) */
          <section className="px-6 pb-20 space-y-10">
            <div className="flex flex-col items-center text-center pt-8 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <img
                  src="/mindbite-logo.png"
                  alt="MindBite"
                  className="relative w-24 h-24 rounded-[2rem] object-cover shadow-2xl ring-1 ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary leading-tight">
                  MindBite ile<br/>Sağlığını Keşfet
                </h1>
                <p className="text-on-surface-variant font-medium px-4">
                  Beslenmende yapay zeka devri. Gıdaları tara, analiz et ve hedeflerine ulaş.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <MobileFeatureCard
                icon="barcode_scanner"
                title="Hızlı Tarama"
                desc="Barkodları tara, saniyeler içinde analiz al."
                color="bg-primary/10 text-primary"
              />
              <MobileFeatureCard
                icon="auto_awesome"
                title="AI Analizi"
                desc="Katkı maddeleri ve alerjen uyarısı."
                color="bg-secondary/10 text-secondary"
              />
              <MobileFeatureCard
                icon="monitoring"
                title="Akıllı Takip"
                desc="Günlük sağlık puanını anlık izle."
                color="bg-tertiary/10 text-tertiary"
              />
            </div>

            <div className="space-y-3 pt-4">
              <Link
                to="/register"
                className="flex items-center justify-center w-full py-4 rounded-2xl hero-gradient text-white font-bold shadow-lg active:scale-95 transition-transform"
              >
                Hemen Başla
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center w-full py-4 rounded-2xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container-low active:scale-95 transition-transform"
              >
                Giriş Yap
              </Link>
            </div>
          </section>
        ) : (
          /* 2. GİRİŞ YAPMIŞ MOBİL (APP HOME HUB) */
          <section className="px-6 pb-20 space-y-8">
            {/* Header & Greeting */}
            <div className="flex items-center justify-between pt-4">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-on-surface-variant">Merhaba,</p>
                <h2 className="text-2xl font-extrabold font-headline text-primary">{stats?.user?.name || authUser?.name}</h2>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-md group-hover:bg-primary/20 transition-colors"></div>
                <div className="relative w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center bg-surface overflow-hidden">
                   {stats?.score !== undefined ? (
                     <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-primary leading-none">{stats.score}</span>
                        <span className="text-[7px] font-bold text-on-surface-variant uppercase tracking-tighter">Puan</span>
                     </div>
                   ) : (
                     <span className="material-symbols-outlined text-primary/40">favorite</span>
                   )}
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-primary text-white rounded-[2rem] p-6 shadow-xl shadow-primary/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
               <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Bugünkü Kalori</p>
                      <p className="text-3xl font-black font-headline">
                        {Math.round(stats?.history?.filter((h:any) => h.consumed && new Date(h.createdAt).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)).reduce((acc:number, h:any) => acc + ((h.foodId?.calories || 0) * (h.servingSize || 100) / 100), 0) || 0)}
                        <span className="text-sm font-bold text-white/60 ml-1">kcal</span>
                      </p>
                    </div>
                    <Link to="/dashboard" className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors">Detaylar</Link>
                  </div>
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(((stats?.history?.reduce((acc:number, h:any) => acc + (h.foodId?.calories || 0), 0) || 0) / (stats?.user?.calorieGoal || 2000)) * 100, 100)}%` }}
                    ></div>
                  </div>
               </div>
            </div>

            {/* Shortcut Grid */}
            <div className="grid grid-cols-3 gap-4">
              <ShortcutButton icon="barcode_scanner" label="Tara" to="/analysis" color="bg-primary/10 text-primary" />
              <ShortcutButton icon="restaurant" label="Panel" to="/dashboard" color="bg-secondary/10 text-secondary" />
              <ShortcutButton icon="insights" label="Rapor" to="/dashboard" color="bg-tertiary/10 text-tertiary" />
            </div>

            {/* AI Intelligence Hub (Mobile - Full Detail) */}
            <div className="space-y-4">
               <h3 className="font-bold text-on-surface px-1">AI Öngörüleri</h3>
               
               {/* 1. Analiz Özeti */}
               <div className="bg-surface-container-high/30 border border-primary/10 rounded-[2.5rem] p-6 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">Yapay Zeka Analizi</p>
                        <p className="text-[8px] text-on-surface-variant font-bold opacity-60">GERÇEK ZAMANLI VERİ</p>
                      </div>
                    </div>
                    <blockquote className="text-lg font-headline font-bold text-on-surface leading-tight relative">
                       <span className="text-primary/20 text-3xl font-serif absolute -left-1 -top-2">"</span>
                       {stats?.advice?.summary || 'Verilerin yapay zeka tarafından analiz ediliyor...'}
                       <span className="text-primary/20 text-3xl font-serif">"</span>
                    </blockquote>
                    {stats?.advice?.recommendations?.length > 0 && (
                      <div className="space-y-3 pt-1">
                        {stats.advice.recommendations.slice(0, 3).map((rec: string, i: number) => (
                          <div key={i} className="flex gap-3 items-start p-3 rounded-2xl bg-white/50 border border-primary/5 shadow-sm">
                            <span className="material-symbols-outlined text-primary text-base mt-0.5">verified</span>
                            <p className="text-[12px] text-on-surface-variant font-medium leading-relaxed">{rec}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
               </div>

               {/* 2. Günün Tavsiyesi */}
               <div className="bg-primary text-white rounded-[2.5rem] p-6 relative overflow-hidden shadow-xl shadow-primary/20">
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                  <div className="relative z-10 flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-xl">lightbulb</span>
                      </div>
                      <h3 className="text-base font-headline font-bold">Günün Tavsiyesi</h3>
                    </div>
                    <div className="space-y-4">
                      {(stats?.advice?.tips || ['Bugün sağlıklı tercihler yapmaya odaklan ve öğünlerini kaydetmeyi unutma!']).slice(0, 3).map((tip: string, i: number) => (
                        <div key={i} className="flex gap-4 items-start group/tip">
                          <div className="w-1.5 h-6 bg-white/30 rounded-full mt-0.5" />
                          <p className="text-[13px] font-medium leading-relaxed italic text-white/90">{tip}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-4 border-t border-white/10 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-white/60">
                      <span>Diyetisyen Modu</span>
                      <span>AKTİF</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Recent Activity Mini List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-on-surface">Son Taramaların</h3>
                <Link to="/analysis" className="text-xs font-bold text-primary">Tümü</Link>
              </div>
              <div className="space-y-3">
                {stats?.history?.slice(0, 3).map((item: any) => (
                  <div key={item._id} className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-2xl border border-primary/5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary/60">
                      <span className="material-symbols-outlined text-lg">inventory_2</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{item.foodId?.productName || 'Bilinmeyen Ürün'}</p>
                      <p className="text-[10px] text-on-surface-variant">{new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {item.consumed && (
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                    )}
                  </div>
                ))}
                {!stats?.history?.length && (
                  <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30">
                    <p className="text-xs text-on-surface-variant font-medium">Henüz bir ürün taramadın.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* 💻 MASAÜSTÜ GÖRÜNÜMÜ (Değiştirilmedi) */}
      <div className="hidden md:block">
        <section className="relative px-8 py-12 md:py-24 max-w-7xl mx-auto overflow-visible">
          {/* ... mevcut masaüstü içeriği ... */}
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 z-10">
              <div className="inline-flex items-center px-4 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-full text-sm font-semibold tracking-wide uppercase font-label">
                <span className="material-symbols-outlined text-base mr-2 leading-none" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>eco</span>
                Yeni Nesil Beslenme
              </div>
              <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-primary leading-tight tracking-tighter">
                MindBite ile <br/> <span className="text-secondary italic">Bilinçli Beslenin.</span>
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed font-body">
              Ne yediğinizi bilin, daha sağlıklı seçimler yapın. MindBite sayesinde gıdaların içeriğini anlayın, riskleri görün, sağlığınızı koruyun.
              </p>
              <div className="flex flex-wrap gap-4">
                {isLoggedIn ? (
                  <>
                    <Link to="/dashboard" className="px-8 py-4 hero-gradient text-on-primary rounded-full font-semibold shadow-lg hover:scale-105 transition-transform active:scale-95">
                      Panelime Git
                    </Link>
                    <Link to="/analysis" className="px-8 py-4 border border-outline-variant text-primary rounded-full font-semibold hover:bg-surface-container-low transition-colors active:scale-95">
                      Analiz Et
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="px-8 py-4 hero-gradient text-on-primary rounded-full font-semibold shadow-lg hover:scale-105 transition-transform active:scale-95">
                      Hemen Başlayın
                    </Link>
                    <Link to="/login" className="px-8 py-4 border border-outline-variant text-primary rounded-full font-semibold hover:bg-surface-container-low transition-colors active:scale-95">
                      Keşfet
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 relative w-full h-[500px]">
              <div className="absolute inset-0 rounded-xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.15)]">
                <img
                  alt="Taze sebze ve meyvelerle hazırlanmış sağlıklı tabak"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=85"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/30 via-transparent to-transparent"></div>
              </div>

              <div className="absolute -bottom-10 -left-10 glass-card p-5 rounded-xl border border-outline-variant/30 shadow-xl max-w-[290px] backdrop-blur-xl bg-surface-container-lowest/80">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <div>
                    <p className="font-headline font-bold text-sm">Sağlık Puanı</p>
                    <p className="text-xs text-on-surface-variant">Bugün <span className="font-semibold text-tertiary">85/100</span></p>
                  </div>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-tertiary to-emerald-500 w-[85%]"></div>
                </div>
              </div>

              <div className="absolute -top-6 -right-8 glass-card p-4 rounded-xl border border-outline-variant/30 shadow-xl flex items-center gap-3 backdrop-blur-xl bg-surface-container-lowest/80">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-xl">barcode_scanner</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-sm">Anlık Analiz</p>
                  <p className="text-[11px] text-on-surface-variant">Barkod & Doğal dil</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {!isLoggedIn && (
          <>
            {/* Features Section */}
            <section className="bg-surface-container-low py-24 px-8">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                  <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary tracking-tight">Neden MindBite?</h2>
                  <p className="text-on-surface-variant max-w-2xl mx-auto text-lg font-medium opacity-80">
                    Beslenmenizi bir üst seviyeye taşıyacak akıllı araçlar ve gerçek zamanlı yapay zeka desteği.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: 'barcode_scanner',
                      title: 'Barkod Tarama',
                      desc: 'Ürünlerin barkodunu saniyeler içinde tarayın, içeriği ve katkı maddelerini anında görün.',
                    },
                    {
                      icon: 'auto_awesome',
                      title: 'AI Analizi',
                      desc: 'Yapay zeka ile ürünlerin size özel uygunluğunu ve gizli risklerini analiz edin.',
                    },
                    {
                      icon: 'favorite',
                      title: 'Sağlık Puanı',
                      desc: 'Her öğün ve her ürün için kişiselleştirilmiş sağlık puanınızı takip edin.',
                    },
                  ].map((f) => (
                    <div key={f.title} className="bg-surface-container-lowest p-10 rounded-[3rem] border border-primary/5 hover:border-primary/20 transition-all group shadow-sm">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                        <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                      </div>
                      <h3 className="font-headline text-2xl font-extrabold text-on-surface mb-4">{f.title}</h3>
                      <p className="text-on-surface-variant leading-relaxed font-medium opacity-90">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* AI Highlight Section */}
            <section className="py-24 px-8">
               <div className="max-w-7xl mx-auto bg-primary rounded-[4.5rem] p-12 md:p-24 text-white flex flex-col md:flex-row items-center gap-16 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -mr-64 -mt-64"></div>
                  <div className="flex-1 space-y-8 z-10">
                    <h2 className="font-headline text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tighter">Yapay Zeka ile <br/> <span className="text-emerald-300 italic">Görünmeyeni Görün.</span></h2>
                    <p className="text-xl text-white/80 max-w-lg font-medium leading-relaxed">
                      Karmaşık içerik listelerini, koruyucuları ve gizli şekerleri sizin yerinize biz analiz ediyor, sağlığınızı koruyoruz.
                    </p>
                    <Link to="/register" className="inline-flex items-center gap-3 px-12 py-5 bg-white text-primary rounded-full font-extrabold shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform active:scale-95">
                       Ücretsiz Başlayın
                       <span className="material-symbols-outlined font-bold">arrow_forward</span>
                    </Link>
                  </div>
                  <div className="flex-1 flex justify-center z-10">
                     <div className="w-72 h-72 md:w-96 md:h-96 rounded-full border-[12px] border-white/5 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse"></div>
                        <span className="material-symbols-outlined text-8xl md:text-[120px] text-white/20" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                     </div>
                  </div>
               </div>
            </section>
          </>
        )}

        {isLoggedIn && (
          <section className="bg-surface-container-low py-16 px-8 mt-8 rounded-t-[5rem]">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold tracking-wider">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  SİSTEMİ NASIL KULLANIRIM?
                </div>
                <h2 className="font-headline text-4xl font-bold text-primary tracking-tight">
                  MindBite ile günlük rutininizi <span className="text-secondary italic">3 adımda</span> yönetin
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: 'barcode_scanner',
                    title: 'Öğün Ekle',
                    desc: 'Analiz ekranından barkod tarayın ya da doğal dille öğün girin.',
                    cta: 'Analize Git',
                    to: '/analysis',
                  },
                  {
                    icon: 'monitoring',
                    title: 'Paneli Takip Et',
                    desc: 'Günlük kalori, makro dağılımı ve sağlık puanınızı anlık izleyin.',
                    cta: 'Panelime Git',
                    to: '/dashboard',
                  },
                  {
                    icon: 'insights',
                    title: 'Raporları Yorumla',
                    desc: 'Haftalık trend ve AI önerileriyle alışkanlıklarınızı iyileştirin.',
                    cta: 'Profili Aç',
                    to: '/profile',
                  },
                ].map((item) => (
                  <div key={item.title} className="bg-surface-container-lowest rounded-2xl border border-primary/10 p-6 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <h3 className="font-headline text-lg font-bold text-on-surface mb-2">{item.title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{item.desc}</p>
                    <Link to={item.to} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                      {item.cta}
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Helper Components for Mobile View */}
      {false && <div className="hidden"><MobileFeatureCard icon="" title="" desc="" color="" /><ShortcutButton icon="" label="" to="" color="" /></div>}
    </main>
  );
}

function MobileFeatureCard({ icon, title, desc, color }: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl border border-primary/5 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div className="space-y-0.5">
        <h3 className="font-bold text-on-surface">{title}</h3>
        <p className="text-xs text-on-surface-variant font-medium leading-tight">{desc}</p>
      </div>
    </div>
  );
}

function ShortcutButton({ icon, label, to, color }: any) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 group">
      <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all group-active:scale-90 ${color}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <span className="text-xs font-bold text-on-surface-variant">{label}</span>
    </Link>
  );
}
