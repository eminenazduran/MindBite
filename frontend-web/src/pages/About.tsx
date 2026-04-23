import { Link } from "react-router-dom";

export default function About() {
  return (
    <main className="pt-24 pb-16 px-8 max-w-5xl mx-auto">
      <section className="py-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 text-secondary rounded-full text-xs font-bold tracking-wider">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          HAKKIMIZDA
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary leading-tight">
          Bilinçli beslenmeyi <br /> <span className="text-secondary italic">herkes için</span> erişilebilir kılıyoruz.
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl mx-auto leading-relaxed">
          MindBite; gıda etiketlerinin arkasındaki bilimi sadeleştiren, günlük beslenmenizi somut sayılarla takip etmenizi sağlayan bir yapay zeka destekli beslenme platformudur.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          { icon: "insights", title: "Misyonumuz", text: "Her bireyin ne yediğini anlayabilmesini, risklerini görebilmesini ve bilinçli seçimler yapabilmesini sağlamak." },
          { icon: "verified", title: "Yaklaşımımız", text: "Reklamsız, şeffaf ve bilimsel. Güvenilir veri kaynakları ve açık algoritmalarla çalışırız." },
          { icon: "favorite", title: "Değerlerimiz", text: "Gizlilik, bilimsellik ve kullanıcı odaklılık. Verileriniz yalnızca size aittir ve satılmaz." },
        ].map((c) => (
          <div key={c.title} className="glass-card rounded-xl p-8 border border-outline-variant/10 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
            </div>
            <h3 className="font-headline text-xl font-bold text-primary">{c.title}</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">{c.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 glass-card rounded-xl p-10 border border-outline-variant/10">
        <h2 className="font-headline text-2xl font-bold text-primary mb-4">Neden MindBite?</h2>
        <div className="space-y-3 text-on-surface-variant leading-relaxed">
          <p>
            Marketler binlerce ürünle dolu, ancak tüketicilerin çoğu paketin arkasındaki bilgileri hızlıca yorumlayabilecek zamana ya da bilgiye sahip değil. Alerjen, katkı maddesi, şeker içeriği, kalori ve makro dağılımı gibi kritik bilgiler çoğu zaman gözden kaçıyor.
          </p>
          <p>
            <strong className="text-primary">MindBite</strong>, bu karmaşayı sadeleştirmek için kuruldu. Barkod tarama, doğal dille öğün girişi ve günlük sağlık puanı gibi araçlarla her kullanıcıya kendi beslenmesinin röntgenini çıkarma imkânı veriyoruz.
        </p>
        </div>
      </section>

      <section className="mt-12 text-center space-y-4">
        <h2 className="font-headline text-2xl font-bold text-primary">Bize katılın</h2>
        <p className="text-on-surface-variant">Sağlıklı beslenme yolculuğunuzu bugün başlatın.</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/register" className="px-6 py-3 hero-gradient text-on-primary rounded-full font-semibold shadow-lg hover:scale-105 transition-transform">
            Ücretsiz Üye Ol
          </Link>
          <Link to="/contact" className="px-6 py-3 border border-outline-variant text-primary rounded-full font-semibold hover:bg-surface-container-low transition-colors">
            İletişime Geçin
          </Link>
        </div>
      </section>
    </main>
  );
}
