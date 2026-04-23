import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      const subject = encodeURIComponent(`[MindBite İletişim] ${form.subject || "Mesajınız"}`);
      const body = encodeURIComponent(
        `Ad: ${form.name}\nE-posta: ${form.email}\n\n${form.message}`
      );
      window.location.href = `mailto:destek@mindbite.app?subject=${subject}&body=${body}`;
      setSending(false);
      setSent(true);
    }, 400);
  };

  return (
    <main className="pt-24 pb-16 px-8 max-w-6xl mx-auto">
      <section className="py-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-tertiary-fixed/50 text-on-tertiary-fixed rounded-full text-xs font-bold tracking-wider">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
          İLETİŞİM
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary leading-tight">
          Size nasıl <span className="text-secondary italic">yardımcı olabiliriz?</span>
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
          Geri bildirimleriniz, önerileriniz veya teknik destek talepleriniz için bizimle iletişime geçin.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <InfoCard icon="mail" title="E-posta" lines={["destek@mindbite.app"]} href="mailto:destek@mindbite.app" />
        <InfoCard icon="support_agent" title="Destek Saatleri" lines={["Hafta içi 09:00 – 18:00", "24 saat içinde yanıt"]} />
        <InfoCard icon="location_on" title="Adres" lines={["Elazığ, Türkiye"]} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-8 mt-12">
        <div className="md:col-span-3 glass-card rounded-xl p-8 border border-outline-variant/10">
          <h2 className="font-headline text-2xl font-bold text-primary mb-1">Mesaj gönderin</h2>
          <p className="text-sm text-on-surface-variant mb-6">Formu doldurun, varsayılan e-posta istemciniz açılsın.</p>

          {sent ? (
            <div className="rounded-xl border border-green-500/20 bg-green-50 dark:bg-green-950/20 p-6 text-center space-y-2">
              <span className="material-symbols-outlined text-green-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                task_alt
              </span>
              <p className="font-semibold text-green-700 dark:text-green-300">E-posta istemciniz açıldı</p>
              <p className="text-sm text-green-700/80 dark:text-green-300/80">
                Mesajınızı oradan göndermeyi tamamlayabilirsiniz.
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                className="mt-3 px-5 py-2 rounded-full border border-green-500/30 text-green-700 dark:text-green-300 text-sm font-semibold hover:bg-green-500/10"
              >
                Yeni mesaj yaz
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Adınız" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="E-posta" type="email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              </div>
              <Field label="Konu" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Mesajınız</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 resize-none"
                  placeholder="Bize nasıl yardımcı olabiliriz?"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-6 py-3 hero-gradient text-on-primary rounded-full font-semibold shadow-lg hover:scale-105 transition-transform active:scale-95 disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">send</span>
                    Gönder
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-6 border border-outline-variant/10">
            <h3 className="font-headline text-lg font-bold text-primary mb-2">Sık Sorulan Sorular</h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <Faq q="Hesabımı nasıl silerim?" a="Profil → Güvenlik → Tehlikeli Alan bölümünden hesabınızı kalıcı olarak silebilirsiniz." />
              <Faq q="Verilerim güvende mi?" a="Parolalar bcrypt ile şifrelenir, veriler HTTPS üzerinden taşınır ve hiçbir 3. tarafla paylaşılmaz." />
              <Faq q="Kalori hesaplamaları ne kadar doğru?" a="Türkçe gıda veritabanımız + Open Food Facts verileriyle 100g bazlı hassas hesaplama yapıyoruz." />
            </ul>
          </div>

          <div className="glass-card rounded-xl p-6 border border-outline-variant/10 bg-primary/5">
            <h3 className="font-headline text-lg font-bold text-primary mb-1">Hata mı buldunuz?</h3>
            <p className="text-sm text-on-surface-variant">
              Karşılaştığınız hataların ekran görüntüsünü e-posta ile iletirseniz daha hızlı çözüm sunabiliriz.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ icon, title, lines, href }: { icon: string; title: string; lines: string[]; href?: string }) {
  const inner = (
    <div className="glass-card rounded-xl p-6 border border-outline-variant/10 flex gap-4 items-start h-full hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div className="space-y-0.5">
        <p className="font-headline font-bold text-primary">{title}</p>
        {lines.map((l, i) => (
          <p key={i} className="text-sm text-on-surface-variant">{l}</p>
        ))}
      </div>
    </div>
  );
  return href ? <a href={href} className="block">{inner}</a> : inner;
}

function Field({
  label, value, onChange, type = "text", required = false,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
      />
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <li className="border-l-2 border-primary/20 pl-3">
      <p className="font-semibold text-primary text-sm">{q}</p>
      <p className="text-xs mt-0.5 leading-relaxed">{a}</p>
    </li>
  );
}
