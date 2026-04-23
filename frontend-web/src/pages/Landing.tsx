export default function Landing() {
  return (
    <main className="pt-24">
      <section className="relative px-8 py-12 md:py-24 max-w-7xl mx-auto overflow-visible">
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
              <button className="px-8 py-4 hero-gradient text-on-primary rounded-full font-semibold shadow-lg hover:scale-105 transition-transform active:scale-95">
                Hemen Başlayın
              </button>
              <button className="px-8 py-4 border border-outline-variant text-primary rounded-full font-semibold hover:bg-surface-container-low transition-colors active:scale-95">
                Keşfet
              </button>
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

            <div className="absolute -bottom-10 -left-6 md:-left-10 glass-card p-5 rounded-xl border border-white/40 shadow-xl hidden md:block max-w-[290px] backdrop-blur-xl bg-white/80">
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

            <div className="absolute -top-6 -right-4 md:-right-8 glass-card p-4 rounded-xl border border-white/40 shadow-xl hidden md:flex items-center gap-3 backdrop-blur-xl bg-white/80">
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
                  className={`group p-8 bg-white dark:bg-surface-container-lowest rounded-2xl border ${s.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden`}
                >
                  <div className={`absolute top-0 right-0 w-40 h-40 ${s.glow} rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`}></div>

                  {/* Step number - top right */}
                  <div className={`absolute top-6 right-6 font-headline text-4xl font-extrabold ${s.stepText} opacity-10 group-hover:opacity-20 transition-opacity`}>
                    {s.step}
                  </div>

                  {/* Icon */}
                  <div className={`relative z-10 mb-6 w-16 h-16 rounded-2xl ${s.iconBg} ${s.iconText} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  </div>

                  {/* Step label */}
                  <p className={`text-[11px] font-bold tracking-wider uppercase ${s.stepText} mb-2`}>
                    Adım {s.step}
                  </p>

                  {/* Title */}
                  <h3 className={`font-headline text-2xl font-bold mb-3 ${s.titleText}`}>
                    {s.title}
                  </h3>

                  {/* Description */}
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
            <img alt="Sağlıklı yemek tabağı" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80"/>
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/50"></div>

            <div className="relative z-10 flex-1 flex flex-col justify-center space-y-3 max-w-md">
              <h4 className="font-headline text-2xl md:text-3xl font-bold text-primary leading-tight">
                Beslenmenizi Tek <span className="text-secondary italic">Panoda</span> Takip Edin.
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Kalori, makro dengesi ve sağlık puanınız — her öğün sonrası otomatik güncellenir.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3 pt-6 max-w-lg">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-primary/10">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Kalori</p>
                <p className="font-headline text-lg font-bold text-primary leading-tight">1,840<span className="text-xs text-on-surface-variant font-normal"> / 2,100</span></p>
                <div className="h-1 w-full bg-primary/10 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-primary w-[87%]"></div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-secondary/10">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Makro</p>
                <p className="font-headline text-lg font-bold text-secondary leading-tight">45<span className="text-xs text-on-surface-variant font-normal">K</span> · 25<span className="text-xs text-on-surface-variant font-normal">P</span> · 30<span className="text-xs text-on-surface-variant font-normal">Y</span></p>
                <div className="flex gap-0.5 mt-1.5 h-1 rounded-full overflow-hidden">
                  <div className="bg-primary" style={{ width: '45%' }}></div>
                  <div className="bg-secondary" style={{ width: '25%' }}></div>
                  <div className="bg-tertiary" style={{ width: '30%' }}></div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-tertiary/10">
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
              <img alt="Topluluk ve sağlıklı yaşam" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85" src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80"/>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
