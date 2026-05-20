import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUser, fetchHealthScore, getScanHistory, fetchDailyAdvice } from '../api';
import { useAuth } from '../context/AuthContext';
export default function Landing() {
  const { user: authUser } = useAuth();
  const isLoggedIn = Boolean(authUser);

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isLoggedIn && authUser) {

      const getCachedAdvice = async () => {
        const cacheKey = `ai_advice_${authUser.id}`;
        const cachedStr = localStorage.getItem(cacheKey);
        
        if (cachedStr) {
          try {
            const { data, timestamp } = JSON.parse(cachedStr);
            // 15 dakika = 15 * 60 * 1000 milisaniye
            if (Date.now() - timestamp < 15 * 60 * 1000) {
              return { data };
            }
          } catch (e) {
            console.error("Cache parse error", e);
          }
        }

        try {
          const res = await fetchDailyAdvice();
          if (res && res.data) {
            localStorage.setItem(cacheKey, JSON.stringify({ data: res.data, timestamp: Date.now() }));
          }
          return res;
        } catch (err) {
          if (cachedStr) {
             const { data } = JSON.parse(cachedStr);
             return { data };
          }
          return { data: null };
        }
      };

      Promise.all([
        fetchUser(authUser.id),
        fetchHealthScore(authUser.id, 1),
        getScanHistory(authUser.id, 10),
        getCachedAdvice()
      ]).then(([u, h, s, a]) => {
        setStats({
          user: u.data,
          score: h.data?.today?.score,
          history: s.data,
          advice: a?.data
        });
      });
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
                  MindBite ile<br />Sağlığını Keşfet
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
            <div className="bg-gradient-to-br from-primary-container to-tertiary-container text-white rounded-[2rem] p-6 shadow-xl shadow-tertiary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-tertiary/30 rounded-full blur-2xl"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Bugünkü Kalori</p>
                    <p className="text-3xl font-black font-headline">
                      {Math.round(stats?.history?.filter((h: any) => h.consumed && new Date(h.createdAt).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)).reduce((acc: number, h: any) => acc + ((h.foodId?.calories || 0) * (h.servingSize || 100) / 100), 0) || 0)}
                      <span className="text-sm font-bold text-white/60 ml-1">kcal</span>
                    </p>
                  </div>
                  <Link to="/dashboard" className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors">Detaylar</Link>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(((stats?.history?.reduce((acc: number, h: any) => acc + (h.foodId?.calories || 0), 0) || 0) / (stats?.user?.calorieGoal || 2000)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>



            {/* AI Intelligence Hub (Mobile - Full Detail) */}
            <div className="space-y-4">
              <h3 className="font-bold text-on-surface px-1">AI Analizi ve Önerileri</h3>

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
                      <p className="text-[8px] text-on-surface-variant font-bold opacity-60"></p>
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
                        <div key={i} className="flex gap-3 items-start p-3 rounded-2xl bg-white/50 dark:bg-surface-container border border-primary/5 dark:border-outline-variant/10 shadow-sm">
                          <span className="material-symbols-outlined text-primary text-base mt-0.5">verified</span>
                          <p className="text-[12px] text-on-surface-variant font-medium leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Günün Tavsiyesi */}
              <div className="bg-primary-container text-on-primary-container rounded-[2.5rem] p-6 relative overflow-hidden shadow-xl shadow-primary-container/20 dark:shadow-none">
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-on-primary-container/5 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-on-primary-container/10 backdrop-blur-md flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary-container text-xl">lightbulb</span>
                    </div>
                    <h3 className="text-base font-headline font-bold">Günün Tavsiyesi</h3>
                  </div>
                  <div className="space-y-4">
                    {(stats?.advice?.tips || ['Bugün sağlıklı tercihler yapmaya odaklan ve öğünlerini kaydetmeyi unutma!']).slice(0, 3).map((tip: string, i: number) => (
                      <div key={i} className="flex gap-4 items-start group/tip">
                        <div className="w-1.5 h-6 bg-on-primary-container/30 rounded-full mt-0.5" />
                        <p className="text-[13px] font-medium leading-relaxed italic text-on-primary-container/90">{tip}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-4 border-t border-on-primary-container/10 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-on-primary-container/60">
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>


          </section>
        )}
      </div>

      {/* 💻 MASAÜSTÜ GÖRÜNÜMÜ */}
      <div className="hidden md:block">
        {!isLoggedIn && (
          <section className="relative px-8 py-12 md:py-24 max-w-7xl mx-auto overflow-visible">
          {/* ... mevcut masaüstü içeriği ... */}
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 z-10">
              <div className="inline-flex items-center px-4 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-full text-sm font-semibold tracking-wide uppercase font-label">
                <span className="material-symbols-outlined text-base mr-2 leading-none" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>eco</span>
                Yeni Nesil Beslenme
              </div>
              <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-primary leading-tight tracking-tighter">
                MindBite ile <br /> <span className="text-secondary italic">Bilinçli Beslenin.</span>
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
        )}
        {!isLoggedIn && (
          <>
            <section className="bg-surface-container-low py-24 px-8 mt-12 rounded-t-[5rem]">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold tracking-wider">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    3 ADIMDA
                  </div>
                  <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary tracking-tight">
                    Nasıl <span className="text-secondary italic">Çalışır?</span>
                  </h2>
                  <p className="text-on-surface-variant max-w-xl mx-auto text-lg">
                    Tarayın, analiz edin ve bilinçli seçimler yapın.
                  </p>
                </div>

                <div className="relative">
                  {/* Connector line - desktop only */}
                  <div className="hidden md:block absolute top-[72px] left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-primary/30 via-secondary/30 to-tertiary/30" aria-hidden="true"></div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {[
                      {
                        step: "01",
                        tone: "primary",
                        icon: "barcode_scanner",
                        title: "Tarayın",
                        desc: "Ürün barkodunu tarayın veya öğününüzü kendiniz yazın. — ",
                        tag: "kişiselleştirilmiş",
                        border: "border-primary/20",
                        iconBg: "bg-primary",
                        iconText: "text-on-primary",
                        glow: "bg-primary-fixed/30",
                        stepText: "text-primary",
                        titleText: "text-primary",
                      },
                      {
                        step: "02",
                        tone: "secondary",
                        icon: "query_stats",
                        title: "Analiz Edin",
                        desc: "Kalori, makro dağılımı, alerjenler ve katkı maddeleri anında karşınızda — ",
                        tag: "sade ve bilimsel",
                        border: "border-secondary/20",
                        iconBg: "bg-secondary",
                        iconText: "text-on-secondary",
                        glow: "bg-secondary-fixed/30",
                        stepText: "text-secondary",
                        titleText: "text-secondary",
                      },
                      {
                        step: "03",
                        tone: "tertiary",
                        icon: "health_and_safety",
                        title: "Harekete Geçin",
                        desc: "Günlük sağlık puanınızı, 7 günlük trendinizi ve kişisel uyarılarınızı takip edin — ",
                        tag: "gerçek zamanlı",
                        border: "border-tertiary/20",
                        iconBg: "bg-tertiary",
                        iconText: "text-on-tertiary",
                        glow: "bg-tertiary-fixed/30",
                        stepText: "text-tertiary",
                        titleText: "text-tertiary",
                      },
                    ].map((s) => (
                      <div
                        key={s.step}
                        className={`group p-8 bg-surface-container-lowest rounded-2xl border ${s.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden`}
                      >
                        <div className={`absolute top-0 right-0 w-40 h-40 ${s.glow} rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`}></div>

                        <div className={`absolute top-6 right-6 font-headline text-4xl font-extrabold ${s.stepText} opacity-10 group-hover:opacity-20 transition-opacity`}>
                          {s.step}
                        </div>

                        <div className={`relative z-10 mb-6 w-16 h-16 rounded-2xl ${s.iconBg} ${s.iconText} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                        </div>

                        <p className={`text-[11px] font-bold tracking-wider uppercase ${s.stepText} mb-2`}>
                          Adım {s.step}
                        </p>

                        <h3 className={`font-headline text-2xl font-bold mb-3 ${s.titleText}`}>
                          {s.title}
                        </h3>

                        <p className="text-on-surface-variant leading-relaxed text-sm">
                          {s.desc}
                          <span className={`font-mono font-semibold ${s.titleText}`}>{s.tag}</span>.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="py-24 px-8 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[280px]">
                <div className="md:col-span-8 bg-surface-container-lowest glass-card rounded-xl p-10 flex flex-col relative overflow-hidden border border-outline-variant/10 group">
                  <img alt="Sağlıklı yemek tabağı" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80" />
                  <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/85 to-surface/60"></div>

                  <div className="relative z-10 flex-1 flex flex-col justify-center space-y-3 max-w-md">
                    <h4 className="font-headline text-2xl md:text-3xl font-bold text-primary leading-tight">
                      Beslenmenizi Tek <span className="text-secondary italic">Panoda</span> Takip Edin.
                    </h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed">
                      Kalori, makro dengesi ve sağlık puanınız — her öğün sonrası otomatik güncellenir.
                    </p>
                  </div>

                  <div className="relative z-10 grid grid-cols-3 gap-3 pt-6 max-w-lg">
                    <div className="bg-surface-container-lowest/85 backdrop-blur-sm rounded-lg p-3 border border-primary/15">
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Kalori</p>
                      <p className="font-headline text-lg font-bold text-primary leading-tight">1,840<span className="text-xs text-on-surface-variant font-normal"> / 2,100</span></p>
                      <div className="h-1 w-full bg-primary/10 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-primary w-[87%]"></div>
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest/85 backdrop-blur-sm rounded-lg p-3 border border-secondary/15">
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Makro</p>
                      <p className="font-headline text-lg font-bold text-secondary leading-tight">45<span className="text-xs text-on-surface-variant font-normal">K</span> · 25<span className="text-xs text-on-surface-variant font-normal">P</span> · 30<span className="text-xs text-on-surface-variant font-normal">Y</span></p>
                      <div className="flex gap-0.5 mt-1.5 h-1 rounded-full overflow-hidden">
                        <div className="bg-primary" style={{ width: '45%' }}></div>
                        <div className="bg-secondary" style={{ width: '25%' }}></div>
                        <div className="bg-tertiary" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest/85 backdrop-blur-sm rounded-lg p-3 border border-tertiary/15">
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Sağlık Puanı</p>
                      <p className="font-headline text-lg font-bold text-tertiary leading-tight">85<span className="text-xs text-on-surface-variant font-normal"> / 100</span></p>
                      <div className="h-1 w-full bg-tertiary/10 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-tertiary w-[85%]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 bg-primary text-on-primary rounded-xl p-10 flex flex-col justify-between relative overflow-hidden">
                  <span className="material-symbols-outlined text-7xl opacity-20 absolute -bottom-4 -right-4" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
                  <div className="flex items-center gap-2 relative z-10">
                    <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[10px] font-bold tracking-wider">0 – 100</span>
                  </div>
                  <div className="space-y-3 relative z-10">
                    <h4 className="font-headline text-2xl font-bold">Sağlık Puanı</h4>
                    <p className="text-on-primary/85 font-body text-sm leading-relaxed">
                      Kalori dengesi, makro dağılımı, gıda kalitesi, çeşitlilik ve güvenlik — hepsi tek bir günlük skorda. 7 günlük trendinizi takip edin.
                    </p>
                  </div>
                </div>

                <div className="md:col-span-4 bg-secondary-container text-on-secondary-container rounded-xl p-10 flex flex-col gap-4 overflow-hidden relative">
                  <span className="absolute top-4 right-4 px-2.5 py-1 bg-on-secondary-container/10 rounded-full text-[10px] font-bold tracking-wider">YAKINDA</span>
                  <span className="material-symbols-outlined text-5xl opacity-90">restaurant_menu</span>
                  <h4 className="font-headline text-xl font-bold">Kişiselleştirilmiş Menü</h4>
                  <p className="text-sm opacity-80 leading-relaxed">
                    Profiliniz, alerjenleriniz ve günlük sağlık puanınıza göre size özel tarif önerileri — yakında sizinle.
                  </p>
                </div>

                <div className="md:col-span-8 bg-surface-container-high rounded-xl p-10 flex items-center gap-8 relative overflow-hidden group">
                  <span className="absolute top-4 right-4 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold tracking-wider z-10">YAKINDA</span>
                  <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-fixed/40 text-on-tertiary-fixed rounded-full text-[11px] font-bold tracking-wider">
                      <span className="material-symbols-outlined text-sm">diversity_3</span>
                      TOPLULUK MODÜLÜ
                    </div>
                    <h4 className="font-headline text-2xl font-bold text-primary">Birlikte Daha Sağlıklı</h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed max-w-md">
                      Diğer MindBite kullanıcılarıyla sağlıklı tarifler paylaşmak, başarı hikayelerinden ilham almak ve haftalık puan sıralamalarını görmek yakında mümkün olacak.
                    </p>
                  </div>
                  <div className="hidden md:block w-1/3 h-full rounded-xl overflow-hidden shadow-lg relative">
                    <img alt="Topluluk ve sağlıklı yaşam" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85" src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80" />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {isLoggedIn && (
          <section className="max-w-7xl mx-auto px-8 py-10 space-y-8 animate-fade-in">
            {/* 1. Kompakt Header (Karşılama ve Skor Entegrasyonu) */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-outline-variant/30 pb-8 gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                  <span className="w-8 h-[2px] bg-primary rounded-full"></span>
                  Kişisel Panel
                </div>
                <h1 className="text-4xl font-black font-headline text-on-surface tracking-tight">
                  Merhaba, {stats?.user?.name || authUser?.name}
                </h1>
                <p className="text-on-surface-variant font-medium max-w-xl">
                  Hedeflerine ulaşman için bugün harika bir fırsat. Verilerini aşağıda özetledik.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-surface-container-low/60 p-4 pr-6 rounded-2xl border border-outline-variant/20">
                <div className="w-14 h-14 rounded-full border-2 border-primary/20 flex flex-col items-center justify-center bg-surface-container shadow-sm">
                  <span className="text-xl font-black text-primary">{stats?.score || 0}</span>
                  <span className="text-[7px] font-bold text-on-surface-variant uppercase tracking-tighter">Puan</span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-on-surface">Günlük Sağlık Puanı</p>
                  <p className="text-[11px] text-on-surface-variant font-medium">Harika gidiyorsun! 🌟</p>
                </div>
              </div>
            </div>

            {/* 2. Ana İçerik Grid (2 Sütunlu Profesyonel Düzen) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* SOL SÜTUN (7/12): Kalori ve AI Analizi */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Kalori & İlerleme Paneli */}
                <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Bugünkü Kalori</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black font-headline text-primary">
                           {Math.round(stats?.history?.filter((h: any) => h.consumed && new Date(h.createdAt).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)).reduce((acc: number, h: any) => acc + ((h.foodId?.calories || 0) * (h.servingSize || 100) / 100), 0) || 0)}
                        </span>
                        <span className="text-lg font-bold text-on-surface-variant">/ {stats?.user?.calorieGoal || 2000} kcal</span>
                      </div>
                    </div>
                    <Link to="/dashboard" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-md">
                      Detayları Gör
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                    </Link>
                  </div>
                  
                  <div className="mt-8 space-y-3 relative z-10">
                    <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                      <span>Günlük Hedef</span>
                      <span>%{Math.round(Math.min(((stats?.history?.reduce((acc: number, h: any) => acc + (h.foodId?.calories || 0), 0) || 0) / (stats?.user?.calorieGoal || 2000)) * 100, 100))}</span>
                    </div>
                    <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000 shadow-sm"
                        style={{ width: `${Math.min(((stats?.history?.reduce((acc: number, h: any) => acc + (h.foodId?.calories || 0), 0) || 0) / (stats?.user?.calorieGoal || 2000)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* AI Analiz & Öneriler Bloğu */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <h3 className="text-xl font-bold font-headline">AI Analizi ve Öneriler</h3>
                  </div>

                  <div className="bg-surface-container-high/20 border border-outline-variant/10 rounded-3xl p-8 space-y-8">
                    <blockquote className="text-xl font-medium text-on-surface italic leading-relaxed pl-6 border-l-4 border-primary/30">
                       "{stats?.advice?.summary || 'Beslenme verilerin analiz ediliyor, hedeflerine odaklanmaya devam et!'}"
                    </blockquote>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(stats?.advice?.recommendations || []).slice(0, 4).map((rec: string, i: number) => (
                        <div key={i} className="flex gap-4 items-center p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 group hover:border-primary/30 transition-colors">
                          <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                          <p className="text-sm text-on-surface-variant font-semibold leading-snug">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SAĞ SÜTUN (4/12): Tavsiyeler ve Bilgi Kartları */}
              <div className="lg:col-span-4 space-y-8">
                {/* Günün Tavsiyesi */}
                <div className="bg-primary-container text-on-primary-container rounded-3xl p-8 relative overflow-hidden shadow-sm">
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                      <h4 className="text-lg font-bold font-headline">Günün Tavsiyesi</h4>
                    </div>
                    <div className="space-y-5">
                      {(stats?.advice?.tips || ['Bugün su içmeyi ihmal etme.', 'Öğünlerini planlı tüket.']).slice(0, 3).map((tip: string, i: number) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="w-1 h-1 rounded-full bg-on-primary-container/40 mt-2 flex-shrink-0" />
                          <p className="text-sm font-medium leading-relaxed italic opacity-90">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hızlı İpucu / Bilgi Notu */}
                <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 space-y-4">
                  <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Biliyor musun?</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                    Düzenli uyku, vücudunun insülin duyarlılığını artırarak iştah kontrolüne yardımcı olur. Günde 7-8 saat uyumaya özen göster!
                  </p>
                  <div className="pt-4 flex justify-between items-center opacity-40">
                     <span className="material-symbols-outlined">psychology</span>
                     <span className="text-[10px] font-bold">MİNDBİTE ACADEMY</span>
                  </div>
                </div>
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
