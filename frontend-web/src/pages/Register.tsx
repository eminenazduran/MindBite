import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import { useAuth } from '../context/AuthContext';

type Gender = 'female' | 'male' | 'other';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Goal = 'lose' | 'maintain' | 'gain' | 'healthy';

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string; icon: string }[] = [
  { value: 'sedentary',   label: 'Hareketsiz',  desc: 'Masa başı, az hareket',                 icon: 'chair' },
  { value: 'light',       label: 'Hafif Aktif', desc: 'Haftada 1-3 gün egzersiz',              icon: 'directions_walk' },
  { value: 'moderate',    label: 'Orta Aktif',  desc: 'Haftada 3-5 gün orta tempo',            icon: 'directions_run' },
  { value: 'active',      label: 'Aktif',       desc: 'Haftada 6-7 gün egzersiz',              icon: 'fitness_center' },
  { value: 'very_active', label: 'Çok Aktif',   desc: 'Günlük ağır spor / fiziksel iş',        icon: 'sports_martial_arts' },
];

const GOAL_OPTIONS: { value: Goal; label: string; desc: string; icon: string; tone: string }[] = [
  { value: 'lose',     label: 'Kilo Vermek',         desc: 'Günlük ~400 kcal eksik',     icon: 'trending_down',     tone: 'bg-error/10 border-error/20 hover:border-error/40 data-[active=true]:border-error data-[active=true]:bg-error/20' },
  { value: 'maintain', label: 'Kilomu Korumak',      desc: 'Günlük ihtiyacınla denk',    icon: 'balance',           tone: 'bg-secondary/10 border-secondary/20 hover:border-secondary/40 data-[active=true]:border-secondary data-[active=true]:bg-secondary/20' },
  { value: 'gain',     label: 'Kilo Almak',          desc: 'Günlük ~400 kcal fazla',     icon: 'trending_up',       tone: 'bg-tertiary/10 border-tertiary/20 hover:border-tertiary/40 data-[active=true]:border-tertiary data-[active=true]:bg-tertiary/20' },
  { value: 'healthy',  label: 'Sağlıklı Beslenmek',  desc: 'Dengeli makro dağılımı',     icon: 'eco',               tone: 'bg-primary/10 border-primary/20 hover:border-primary/40 data-[active=true]:border-primary data-[active=true]:bg-primary/20' },
];

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
};

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adım 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Adım 2
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  // Adım 3
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');

  // Adım 4
  const [goal, setGoal] = useState<Goal | ''>('');

  // Canlı önizleme hesapları
  const preview = useMemo(() => {
    const a = Number(age), h = Number(height), w = Number(weight);
    if (!a || !h || !w || !gender) return null;
    const heightM = h / 100;
    const bmi = w / (heightM * heightM);
    const bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
    const tdee = bmr * ACTIVITY_FACTOR[activityLevel];
    let calorieGoal = tdee;
    if (goal === 'lose') calorieGoal = tdee - 400;
    if (goal === 'gain') calorieGoal = tdee + 400;
    const minCal = gender === 'male' ? 1500 : 1200;
    if (calorieGoal < minCal) calorieGoal = minCal;
    const cat = bmi < 18.5 ? 'Zayıf' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Kilolu' : 'Obez';
    const catColor = bmi < 18.5 ? 'text-blue-600' : bmi < 25 ? 'text-emerald-600' : bmi < 30 ? 'text-amber-600' : 'text-rose-600';
    return {
      bmi: bmi.toFixed(1),
      bmiCategory: cat,
      bmiColor: catColor,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calorieGoal: Math.round(calorieGoal)
    };
  }, [age, gender, height, weight, activityLevel, goal]);

  const canProceedStep1 = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email) && password.length >= 6;
  const canProceedStep2 = Number(age) >= 10 && Number(age) <= 100 && gender !== '' &&
    Number(height) >= 100 && Number(height) <= 250 &&
    Number(weight) >= 25 && Number(weight) <= 300;

  const handleSubmit = async () => {
    if (!goal) { setError('Lütfen bir hedef seçin.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await registerUser({
        name, email, password,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        activityLevel,
        goal
      });
      if (res.status === 'success') {
        login(res.data.user, res.data.token);
        navigate('/dashboard');
      } else {
        setError(res.message || 'Kayıt sırasında hata oluştu.');
      }
    } catch (err: any) {
      setError('Kayıt oluşturulurken bir hata oluştu.');
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
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Sana Özel Plan
          </div>
          <h2 className="text-5xl font-headline font-extrabold text-white mb-6 leading-tight">
            Hedefine uygun, <br />
            <span className="text-emerald-400 italic">kişisel kalori planı.</span>
          </h2>
          <p className="text-emerald-100/80 text-lg leading-relaxed">
            Yaşın, kilon, boyun ve hedefine göre günlük kalori ve makro hedeflerin <strong>otomatik</strong> hesaplanır. Tüm öneriler sana özeldir.
          </p>

          {preview && (
            <div className="mt-10 p-5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-100/70 text-xs font-bold uppercase tracking-wider">Canlı Önizleme</span>
                <span className="material-symbols-outlined text-emerald-400 text-base">auto_awesome</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-emerald-100/60 text-[10px] font-bold uppercase">BKİ</p>
                  <p className="text-2xl font-extrabold text-white">{preview.bmi}</p>
                  <p className={`text-xs font-bold ${preview.bmiColor}`}>{preview.bmiCategory}</p>
                </div>
                <div>
                  <p className="text-emerald-100/60 text-[10px] font-bold uppercase">BMR</p>
                  <p className="text-2xl font-extrabold text-white">{preview.bmr}</p>
                  <p className="text-emerald-100/60 text-[10px]">kcal/gün</p>
                </div>
                <div>
                  <p className="text-emerald-100/60 text-[10px] font-bold uppercase">Hedef</p>
                  <p className="text-2xl font-extrabold text-emerald-300">{preview.calorieGoal}</p>
                  <p className="text-emerald-100/60 text-[10px]">kcal/gün</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 bg-surface">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="text-2xl font-bold text-primary font-headline mb-6 block lg:hidden">MindBite</Link>
            <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface mb-2 tracking-tight">
              {step === 1 && 'Hesabını Oluştur'}
              {step === 2 && 'Seni Tanıyalım'}
              {step === 3 && 'Aktivite Seviyen'}
              {step === 4 && 'Hedefin Nedir?'}
            </h1>
            <p className="text-on-surface-variant font-medium text-sm">
              {step === 1 && 'Önce temel bilgilerini gir.'}
              {step === 2 && 'Doğru kalori hesabı için fiziksel bilgilerin.'}
              {step === 3 && 'Günlük yaşam temponuzu seçin.'}
              {step === 4 && 'Plan hedefine göre şekillenecek.'}
            </p>

            {/* Adım göstergesi */}
            <div className="flex items-center gap-2 mt-5">
              {[1, 2, 3, 4].map(n => (
                <div
                  key={n}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    n < step ? 'bg-primary' : n === step ? 'bg-primary' : 'bg-outline-variant/30'
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-on-surface-variant font-bold mt-2">Adım {step} / 4</p>
          </div>

          {/* ADIM 1: Temel bilgiler */}
          {step === 1 && (
            <div className="space-y-5">
              <FormField label="Ad Soyad" id="name">
                <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ahmet Yılmaz" />
              </FormField>
              <FormField label="E-posta Adresi" id="email">
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="ornek@mail.com" />
              </FormField>
              <FormField label="Şifre (en az 6 karakter)" id="password">
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputCls} pr-12`}
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
              </FormField>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className={primaryBtnCls}
              >
                Devam Et
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          )}

          {/* ADIM 2: Yaş, cinsiyet, kilo, boy */}
          {step === 2 && (
            <div className="space-y-5">
              <FormField label="Cinsiyet" id="gender">
                <div className="grid grid-cols-3 gap-2">
                  {(['female', 'male', 'other'] as Gender[]).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-3 rounded-xl border-2 font-bold text-sm transition ${
                        gender === g
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:border-primary/40'
                      }`}
                    >
                      {g === 'female' ? 'Kadın' : g === 'male' ? 'Erkek' : 'Diğer'}
                    </button>
                  ))}
                </div>
              </FormField>

              <div className="grid grid-cols-3 gap-3">
                <FormField label="Yaş" id="age">
                  <input id="age" type="number" min={10} max={100} value={age} onChange={e => setAge(e.target.value)} className={inputCls} placeholder="25" />
                </FormField>
                <FormField label="Boy (cm)" id="height">
                  <input id="height" type="number" min={100} max={250} value={height} onChange={e => setHeight(e.target.value)} className={inputCls} placeholder="170" />
                </FormField>
                <FormField label="Kilo (kg)" id="weight">
                  <input id="weight" type="number" min={25} max={300} step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className={inputCls} placeholder="65" />
                </FormField>
              </div>

              {preview && (
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">monitor_weight</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Vücut Kitle İndeksi</p>
                      <p className="text-2xl font-extrabold text-on-surface">
                        {preview.bmi} <span className={`text-sm ${preview.bmiColor}`}>· {preview.bmiCategory}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className={secondaryBtnCls}>
                  <span className="material-symbols-outlined">arrow_back</span> Geri
                </button>
                <button onClick={() => setStep(3)} disabled={!canProceedStep2} className={primaryBtnCls}>
                  Devam Et <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ADIM 3: Aktivite */}
          {step === 3 && (
            <div className="space-y-3">
              {ACTIVITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setActivityLevel(opt.value)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition flex items-center gap-3 ${
                    activityLevel === opt.value
                      ? 'border-primary bg-primary/10'
                      : 'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    activityLevel === opt.value ? 'bg-primary text-on-primary' : 'bg-primary/10 text-primary'
                  }`}>
                    <span className="material-symbols-outlined">{opt.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-on-surface text-sm">{opt.label}</p>
                    <p className="text-xs text-on-surface-variant">{opt.desc}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">
                    {activityLevel === opt.value ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </button>
              ))}

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(2)} className={secondaryBtnCls}>
                  <span className="material-symbols-outlined">arrow_back</span> Geri
                </button>
                <button onClick={() => setStep(4)} className={primaryBtnCls}>
                  Devam Et <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ADIM 4: Hedef */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    data-active={goal === opt.value}
                    onClick={() => setGoal(opt.value)}
                    className={`p-4 rounded-2xl border-2 text-left transition ${opt.tone}`}
                  >
                    <span className="material-symbols-outlined text-2xl mb-2 block">{opt.icon}</span>
                    <p className="font-bold text-on-surface text-sm leading-tight">{opt.label}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {preview && goal && (
                <div className="p-4 rounded-2xl bg-emerald-950 text-white">
                  <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-2">Sana Özel Planın</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-emerald-200/70 font-bold uppercase">BMR</p>
                      <p className="text-lg font-extrabold">{preview.bmr}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-200/70 font-bold uppercase">TDEE</p>
                      <p className="text-lg font-extrabold">{preview.tdee}</p>
                    </div>
                    <div className="border-l border-emerald-800 pl-3">
                      <p className="text-[10px] text-emerald-300 font-bold uppercase">Hedef</p>
                      <p className="text-lg font-extrabold text-emerald-300">{preview.calorieGoal}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-200/60 mt-2 text-center">kcal / gün</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-error-container/40 text-on-error-container rounded-xl text-sm font-semibold flex items-center gap-2 border border-error/10">
                  <span className="material-symbols-outlined text-error text-base">error</span>
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep(3)} className={secondaryBtnCls}>
                  <span className="material-symbols-outlined">arrow_back</span> Geri
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !goal}
                  className={primaryBtnCls}
                >
                  {loading ? 'Hesap Oluşturuluyor...' : (
                    <>
                      <span className="material-symbols-outlined">check</span>
                      Hesabı Oluştur
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center">
            <span className="text-on-surface-variant font-medium text-sm">Zaten bir hesabınız var mı?</span>{' '}
            <Link to="/login" className="text-primary font-extrabold hover:underline decoration-2 underline-offset-4 ml-1 text-sm">
              Giriş Yapın
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

// Helper components & class names
const inputCls = "w-full px-5 py-3.5 rounded-2xl border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none bg-surface-container-lowest text-on-surface transition-all shadow-sm";
const primaryBtnCls = "flex-1 inline-flex items-center justify-center gap-2 py-4 hero-gradient text-on-primary font-headline font-bold rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0";
const secondaryBtnCls = "inline-flex items-center justify-center gap-2 px-5 py-4 bg-surface-container text-on-surface font-bold rounded-2xl hover:bg-surface-container-high transition";

function FormField({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-on-surface-variant block ml-1" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
