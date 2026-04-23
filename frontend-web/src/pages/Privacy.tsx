export default function Privacy() {
  const lastUpdate = "23 Nisan 2026";

  const sections = [
    {
      title: "1. Topladığımız Veriler",
      body: (
        <>
          <p>MindBite hesabınızı oluşturduğunuzda ve platformu kullandığınızda yalnızca hizmetin çalışması için gereken verileri topluyoruz:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Hesap bilgileri: e-posta adresi ve şifrelenmiş parola.</li>
            <li>Profil tercihleri: günlük kalori hedefi, alerjen listesi, bildirim tercihleri.</li>
            <li>Kullanım verileri: taradığınız barkodlar, kaydettiğiniz öğünler, günlük sağlık puanı geçmişi.</li>
            <li>Teknik veriler: oturum açma sırasındaki IP ve tarayıcı bilgisi (güvenlik amaçlı).</li>
          </ul>
        </>
      ),
    },
    {
      title: "2. Verilerinizi Nasıl Kullanıyoruz?",
      body: (
        <ul className="list-disc pl-6 space-y-1">
          <li>Kişiselleştirilmiş sağlık puanı ve trend analizleri üretmek için.</li>
          <li>Alerjen uyarıları ve kalori hedefi aşım bildirimleri göndermek için.</li>
          <li>Öğün hatırlatıcılarını cihazınızda tetiklemek için (bildirim izni verdiyseniz).</li>
          <li>Platform performansını iyileştirmek ve güvenlik açıklarını tespit etmek için.</li>
        </ul>
      ),
    },
    {
      title: "3. Verilerinizi Paylaşmıyoruz",
      body: (
        <p>
          Kişisel verileriniz <strong className="text-primary">hiçbir üçüncü tarafla satılmaz, kiralanmaz veya paylaşılmaz</strong>. Yasal zorunluluk dışında hiçbir veri transferi yapılmaz. Açık kaynak Open Food Facts API'si yalnızca ürün bilgilerinin çekilmesi için kullanılır; bu çağrılara kişisel verileriniz dahil edilmez.
        </p>
      ),
    },
    {
      title: "4. Veri Güvenliği",
      body: (
        <ul className="list-disc pl-6 space-y-1">
          <li>Parolalar bcrypt ile tek yönlü şifrelenir; biz dahil kimse düz metin parolanızı göremez.</li>
          <li>Tüm API iletişimi HTTPS üzerinden şifreli olarak gerçekleştirilir.</li>
          <li>Oturumlarınız JWT token'larla yönetilir ve belirli bir süre sonra otomatik olarak sona erer.</li>
          <li>Veritabanı (MongoDB) erişimi yalnızca yetkili servislere kısıtlıdır.</li>
        </ul>
      ),
    },
    {
      title: "5. Haklarınız",
      body: (
        <>
          <p>KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Hesabınızdaki tüm verilere erişim.</li>
            <li>Dilediğiniz zaman şifrenizi değiştirme.</li>
            <li>
              <strong className="text-primary">Hesabınızı ve tüm geçmiş verilerinizi kalıcı olarak silme</strong> (Profil → Güvenlik → Hesabımı Sil).
            </li>
            <li>Bildirim tercihlerinizi istediğiniz zaman güncelleme veya kapatma.</li>
          </ul>
        </>
      ),
    },
    {
      title: "6. Çerezler ve Yerel Depolama",
      body: (
        <p>
          Sadece oturum bilgilerinizi ve bildirim tercihlerinizi saklamak amacıyla tarayıcınızın <span className="font-mono text-primary">localStorage</span> alanını kullanıyoruz. Reklam veya izleme çerezleri kullanmıyoruz.
        </p>
      ),
    },
    {
      title: "7. Değişiklikler",
      body: (
        <p>
          Bu politikayı güncellediğimizde sayfanın üst kısmındaki tarih değişir. Önemli değişikliklerde kayıtlı e-posta adresinize bildirim gönderilir.
        </p>
      ),
    },
  ];

  return (
    <main className="pt-24 pb-16 px-8 max-w-4xl mx-auto">
      <section className="py-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold tracking-wider">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          GİZLİLİK POLİTİKASI
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary leading-tight">
          Verileriniz <span className="text-secondary italic">size aittir.</span>
        </h1>
        <p className="text-on-surface-variant">Son güncelleme: {lastUpdate}</p>
      </section>

      <div className="space-y-8 text-on-surface-variant leading-relaxed">
        {sections.map((s) => (
          <section key={s.title} className="glass-card rounded-xl p-8 border border-outline-variant/10 space-y-2">
            <h2 className="font-headline text-xl font-bold text-primary">{s.title}</h2>
            <div className="text-sm">{s.body}</div>
          </section>
        ))}

        <section className="glass-card rounded-xl p-8 border border-outline-variant/10 bg-primary/5">
          <h2 className="font-headline text-xl font-bold text-primary mb-2">Sorularınız mı var?</h2>
          <p className="text-sm">
            Gizlilik veya veri kullanımı hakkında sorularınız için{" "}
            <a href="mailto:destek@mindbite.app" className="text-primary font-semibold hover:underline">
              destek@mindbite.app
            </a>{" "}
            adresinden bize ulaşabilirsiniz.
          </p>
        </section>
      </div>
    </main>
  );
}
