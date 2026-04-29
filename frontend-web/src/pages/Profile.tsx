import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchUser, updateUser, changePassword, deleteAccount } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotificationPrefs } from '../hooks/useNotificationPrefs';

const AVATAR_PRESETS: { id: string; emoji: string; bg: string }[] = [
  { id: 'cat', emoji: '🐱', bg: '#C8B6FF' },
  { id: 'dog', emoji: '🐶', bg: '#FFD6A5' },
  { id: 'panda', emoji: '🐼', bg: '#D0F4DE' },
  { id: 'rabbit', emoji: '🐰', bg: '#FFADAD' },
  { id: 'fox', emoji: '🦊', bg: '#FFE5D9' },
  { id: 'bear', emoji: '🐻', bg: '#CAFFBF' },
  { id: 'penguin', emoji: '🐧', bg: '#BDE0FE' },
  { id: 'unicorn', emoji: '🦄', bg: '#FFC6FF' },
  { id: 'bird', emoji: '🐦', bg: '#FEF9EF' },
  { id: 'butterfly', emoji: '🦋', bg: '#A2D2FF' },
  { id: 'avocado', emoji: '🥑', bg: '#B5E48C' },
  { id: 'pizza', emoji: '🍕', bg: '#FDFFB6' },
  { id: 'sushi', emoji: '🍣', bg: '#FFADAD' },
  { id: 'watermelon', emoji: '🍉', bg: '#FF6B6B' },
  { id: 'icecream', emoji: '🍦', bg: '#FFE5EC' },
  { id: 'cupcake', emoji: '🧁', bg: '#F8C8DC' },
  { id: 'basketball', emoji: '🏀', bg: '#FFB347' },
  { id: 'bike', emoji: '🚴', bg: '#A0C4FF' },
  { id: 'guitar', emoji: '🎸', bg: '#FFD6A5' },
  { id: 'palette', emoji: '🎨', bg: '#FFC6FF' },
  { id: 'camera', emoji: '📷', bg: '#E2E2E2' },
  { id: 'rocket', emoji: '🚀', bg: '#BDB2FF' },
  { id: 'sunflower', emoji: '🌻', bg: '#FDFFB6' },
  { id: 'rainbow', emoji: '🌈', bg: '#D0F4DE' },
  { id: 'star', emoji: '⭐', bg: '#FFF3BF' },
  { id: 'moon', emoji: '🌙', bg: '#1B1464' },
  { id: 'leaf', emoji: '🍃', bg: '#95D5B2' },
  { id: 'diamond', emoji: '💎', bg: '#A2D2FF' },
];

const ALLERGEN_OPTIONS = [
  { key: 'Yer Fıstığı', icon: 'nutrition' },
  { key: 'Gluten', icon: 'grain' },
  { key: 'Süt Ürünleri', icon: 'egg_alt' },
  { key: 'Deniz Ürünleri', icon: 'waves' },
  { key: 'Soya', icon: 'spa' },
  { key: 'Yumurta', icon: 'egg' },
];

type Gender = 'female' | 'male' | 'other';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Goal = 'lose' | 'maintain' | 'gain' | 'healthy';

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string; icon: string }[] = [
  { value: 'sedentary', label: 'Hareketsiz', desc: 'Masa başı iş, egzersiz yok', icon: 'chair' },
  { value: 'light', label: 'Hafif Aktif', desc: 'Hafta 1-3 gün hafif egzersiz', icon: 'directions_walk' },
  { value: 'moderate', label: 'Orta Aktif', desc: 'Hafta 3-5 gün orta egzersiz', icon: 'directions_run' },
  { value: 'active', label: 'Aktif', desc: 'Hafta 6-7 gün yoğun egzersiz', icon: 'fitness_center' },
  { value: 'very_active', label: 'Çok Aktif', desc: 'Günde 2x antrenman / fiziksel iş', icon: 'local_fire_department' },
];

const GOAL_OPTIONS: { value: Goal; label: string; desc: string; icon: string }[] = [
  { value: 'lose', label: 'Kilo Vermek', desc: 'Günlük ~400 kcal eksik', icon: 'trending_down' },
  { value: 'maintain', label: 'Kilomu Korumak', desc: 'Günlük ihtiyacınla denk', icon: 'balance' },
  { value: 'gain', label: 'Kilo Almak', desc: 'Günlük ~400 kcal fazla', icon: 'trending_up' },
  { value: 'healthy', label: 'Sağlıklı Beslenmek', desc: 'Dengeli makro dağılımı', icon: 'eco' },
];

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
};

type TabKey = 'profile' | 'security' | 'notifications';

export default function Profile() {
  const { user: authUser, logout, updateUser: updateAuthUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const t = searchParams.get('tab');
    if (t === 'profile' || t === 'security' || t === 'notifications') return t;
    return 'profile';
  });
  const { prefs: notifPrefs, patch: patchNotifPrefs } = useNotificationPrefs();

  // URL tab parametresi değiştiğinde sekmeyi güncelle
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'profile' || t === 'security' || t === 'notifications') {
      setActiveTab(t);
    }
  }, [searchParams]);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [customAllergen, setCustomAllergen] = useState('');

  // Avatar
  const [avatar, setAvatar] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarUpdateSeqRef = useRef(0);

  // Fiziksel bilgiler
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');
  const [goal, setGoal] = useState<Goal>('healthy');
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  // Security
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePwd, setDeletePwd] = useState('');
  const [showDeletePwd, setShowDeletePwd] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Notifications
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    if (!authUser) return;
    fetchUser(authUser.id)
      .then(res => {
        if (res.status === 'success') {
          const d = res.data;
          // Backend bazı durumlarda `avatar: ''` döndürebilir (UI optimistik güncellenmiş olsa bile).
          // Bu durumda, kullanıcı seçeceğini kaybetmesin diye AuthContext'teki mevcut avatari koruyoruz.
          const backendAvatar = d.avatar ?? '';
          const avatarToUse = backendAvatar || authUser.avatar || '';
          setUser(d);
          setAllergies(d.allergies || []);
          setCalorieGoal(d.calorieGoal || 2000);
          if (d.age) setAge(String(d.age));
          if (d.gender) setGender(d.gender);
          if (d.height) setHeight(String(d.height));
          if (d.weight) setWeight(String(d.weight));
          if (d.activityLevel) setActivityLevel(d.activityLevel);
          if (d.goal) setGoal(d.goal);
          setAvatar(avatarToUse);
          // AuthContext'i güncelle (navbar avatar için)
          updateAuthUser({ avatar: avatarToUse, name: d.name, calorieGoal: d.calorieGoal });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authUser?.id]);

  // Avatar seçildiğinde anında backend'e kaydet
  const saveAvatar = async (newAvatar: string) => {
    const previousAvatar = avatar;
    const seq = ++avatarUpdateSeqRef.current;
    setAvatar(newAvatar);
    updateAuthUser({ avatar: newAvatar });
    if (!authUser) return;
    try {
      const res = await updateUser(authUser.id, { avatar: newAvatar });
      // Daha yeni bir avatar seçildi ise eski isteğin sonucunu uygulama
      if (seq !== avatarUpdateSeqRef.current) return;
      if (res.status !== 'success') {
        setAvatar(previousAvatar);
        updateAuthUser({ avatar: previousAvatar });
        setSaveMessage('❌ Avatar kaydedilemedi: ' + (res.message || 'Sunucu hatası'));
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch {
      if (seq !== avatarUpdateSeqRef.current) return;
      setAvatar(previousAvatar);
      updateAuthUser({ avatar: previousAvatar });
      setSaveMessage('❌ Avatar kaydedilemedi: Bağlantı hatası');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const toggleAllergy = (allergen: string) => {
    setAllergies(prev => prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]);
  };

  const addCustomAllergen = () => {
    const trimmed = customAllergen.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies(prev => [...prev, trimmed]);
      setCustomAllergen('');
    }
  };

  // Canlı BMI / BMR / TDEE / Hedef hesaplama
  const livePreview = useMemo(() => {
    const a = Number(age), h = Number(height), w = Number(weight);
    if (!a || !h || !w || !gender) return null;
    const heightM = h / 100;
    const bmi = w / (heightM * heightM);
    const bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
    const tdee = bmr * ACTIVITY_FACTOR[activityLevel];
    let cal = tdee;
    if (goal === 'lose') cal = tdee - 400;
    if (goal === 'gain') cal = tdee + 400;
    const minCal = gender === 'male' ? 1500 : 1200;
    if (cal < minCal) cal = minCal;
    const cat = bmi < 18.5 ? 'Zayıf' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Kilolu' : 'Obez';
    return {
      bmi: bmi.toFixed(1),
      bmiCategory: cat,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calorieGoal: Math.round(cal)
    };
  }, [age, gender, height, weight, activityLevel, goal]);

  // livePreview değiştiğinde kalori hedefini otomatik güncelle
  useEffect(() => {
    if (livePreview) {
      setCalorieGoal(livePreview.calorieGoal);
    }
  }, [livePreview]);

  const handleSave = async () => {
    if (!authUser) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const payload: any = { name: user?.name, allergies, avatar };
      // Fiziksel bilgiler doluysa backend otomatik hesaplar
      const a = Number(age), h = Number(height), w = Number(weight);
      if (a && h && w && gender) {
        payload.age = a;
        payload.gender = gender;
        payload.height = h;
        payload.weight = w;
        payload.activityLevel = activityLevel;
        payload.goal = goal;
      } else {
        payload.calorieGoal = calorieGoal;
        payload.autoCalculate = false;
      }
      const res = await updateUser(authUser.id, payload);
      if (res.status === 'success') {
        setUser(res.data);
        setCalorieGoal(res.data.calorieGoal || 2000);
        const backendAvatar = res.data.avatar ?? '';
        const avatarToUse = backendAvatar || avatar || authUser.avatar || '';
        setAvatar(avatarToUse);
        // AuthContext'i de güncelle (navbar avatar için)
        updateAuthUser({ avatar: avatarToUse, name: res.data.name, calorieGoal: res.data.calorieGoal });
        setSaveMessage('✅ Profiliniz başarıyla güncellendi!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('❌ Bir hata oluştu: ' + res.message);
      }
    } catch {
      setSaveMessage('❌ Bağlantı hatası.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdMessage(null);
    if (newPwd !== confirmPwd) {
      setPwdMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }
    setPwdSaving(true);
    try {
      const res = await changePassword(currentPwd, newPwd);
      if (res.status === 'success') {
        setPwdMessage({ type: 'success', text: 'Şifreniz başarıyla güncellendi.' });
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      } else {
        setPwdMessage({ type: 'error', text: res.message || 'Bir hata oluştu.' });
      }
    } catch {
      setPwdMessage({ type: 'error', text: 'Bağlantı hatası.' });
    } finally {
      setPwdSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePwd) return;
    setDeleting(true);
    try {
      const res = await deleteAccount(deletePwd);
      if (res.status === 'success') {
        logout();
        navigate('/login');
      } else {
        setPwdMessage({ type: 'error', text: res.message || 'Hesap silinemedi.' });
        setDeleting(false);
      }
    } catch {
      setPwdMessage({ type: 'error', text: 'Bağlantı hatası.' });
      setDeleting(false);
    }
  };

  const updateNotif = (key: string, value: any) => {
    patchNotifPrefs({ [key]: value });
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  const toggleMealTime = (time: string) => {
    const current = notifPrefs.mealReminderTimes;
    const next = current.includes(time) ? current.filter(t => t !== time) : [...current, time].sort();
    updateNotif('mealReminderTimes', next);
  };

  const requestNotifPermission = async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') return;
    try {
      await Notification.requestPermission();
    } catch {
      /* ignore */
    }
  };

  const canPush = typeof Notification !== 'undefined';
  const pushGranted = canPush && Notification.permission === 'granted';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="pt-32 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-primary font-headline font-semibold">Yükleniyor...</p>
      </div>
    );
  }

  const tabs: Array<{ id: TabKey; label: string; icon: string }> = [
    { id: 'profile', label: 'Profil & Tercihler', icon: 'settings_account_box' },
    { id: 'security', label: 'Güvenlik', icon: 'lock' },
    { id: 'notifications', label: 'Bildirimler', icon: 'notifications_active' }
  ];

  return (
    <main className="pt-24 pb-32 max-w-7xl mx-auto px-6">
      <header className="mb-12 flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary overflow-hidden cursor-pointer hover:scale-105 transition-transform"
          >
            {avatar && avatar.startsWith('data:') ? (
              <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : avatar && AVATAR_PRESETS.find(p => p.id === avatar) ? (
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{ backgroundColor: AVATAR_PRESETS.find(p => p.id === avatar)!.bg }}
              >
                <span className="text-5xl">{AVATAR_PRESETS.find(p => p.id === avatar)!.emoji}</span>
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">person</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
              <span className="material-symbols-outlined text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">photo_camera</span>
            </div>
          </button>
        </div>
        <div className="text-center md:text-left">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">Selam, {user?.name || 'Misafir'}</h1>
          <p className="font-body text-on-surface-variant text-lg">Beslenme yolculuğunu kişiselleştir ve sağlıklı kal.</p>
        </div>
      </header>

      {/* ═══ Avatar Seçici Modal ═══ */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAvatarPicker(false)}>
          <div
            className="bg-surface rounded-3xl shadow-2xl ring-1 ring-outline-variant/20 max-w-lg w-[95%] max-h-[85vh] overflow-y-auto animate-[fadeIn_0.2s_ease]"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-surface z-10 px-6 pt-6 pb-4 border-b border-outline-variant/15">
              <div className="flex items-center justify-between">
                <h2 className="font-headline text-xl font-bold text-on-surface">Avatar Seçin</h2>
                <button onClick={() => setShowAvatarPicker(false)} className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Dosyadan Yükle */}
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Kendi Fotoğrafını Yükle</p>
                <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-outline-variant/40 hover:border-primary/40 bg-surface-container-lowest cursor-pointer transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">Dosya Seç</p>
                    <p className="text-xs text-on-surface-variant">JPG, PNG veya WEBP • Maks 2 MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        alert('Dosya boyutu 2 MB\'dan küçük olmalıdır.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = reader.result as string;
                        saveAvatar(result);
                        setShowAvatarPicker(false);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>

              {/* Presetler */}
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Hazır Avatarlar</p>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
                  {AVATAR_PRESETS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { saveAvatar(p.id); setShowAvatarPicker(false); }}
                      className={`relative w-full aspect-square rounded-full flex items-center justify-center text-2xl sm:text-3xl transition-all hover:scale-110 active:scale-95 ${avatar === p.id ? 'ring-3 ring-primary ring-offset-2 ring-offset-surface scale-110' : ''
                        }`}
                      style={{ backgroundColor: p.bg }}
                    >
                      {p.emoji}
                      {avatar === p.id && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-primary text-xs">check</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatarı Kaldır */}
              {avatar && (
                <button
                  onClick={() => { saveAvatar(''); setShowAvatarPicker(false); }}
                  className="w-full py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant text-sm font-bold hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Avatarı Kaldır
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* ───────── Sidebar ───────── */}
        <aside className="lg:col-span-3 space-y-2">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-full font-semibold transition-all whitespace-nowrap ${activeTab === t.id
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
              >
                <span className="material-symbols-outlined">{t.icon}</span>
                {t.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-4 rounded-full text-error hover:bg-error-container/20 transition-all mt-4 font-semibold whitespace-nowrap"
            >
              <span className="material-symbols-outlined">logout</span>
              Çıkış Yap
            </button>
          </nav>
        </aside>

        {/* ───────── Tab Content ───────── */}
        <div className="lg:col-span-9 space-y-10">

          {/* ============ Profil & Tercihler ============ */}
          {activeTab === 'profile' && (
            <>
              {/* ── Fiziksel Bilgiler ── */}
              <section className="glass-card rounded-xl shadow-sm ring-1 ring-outline-variant/15 overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                  className="w-full flex items-center justify-between p-8 hover:bg-surface-container-low transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined">monitoring</span>
                    </div>
                    <div>
                      <h2 className="font-headline text-2xl font-bold">Fiziksel Bilgiler</h2>
                      <p className="text-on-surface-variant text-sm">Boy, kilo ve aktivite detayları</p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined transition-transform duration-300 ${isStatsExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                <div className={`transition-all duration-300 overflow-hidden ${isStatsExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-8 pt-0 space-y-8 border-t border-outline-variant/10">
                    <p className="text-on-surface-variant text-sm bg-surface-container-low/50 p-3 rounded-lg border border-outline-variant/10">
                      Kilo, boy veya aktivite değişikliklerini buradan güncelleyin — kalori hedefiniz otomatik yeniden hesaplanır.
                    </p>

                    <div className="space-y-6">
                      {/* Yaş + Cinsiyet */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Yaş</span>
                          <input
                            type="number" min={10} max={100}
                            value={age} onChange={(e) => setAge(e.target.value)}
                            placeholder="25"
                            className={profileInputCls}
                          />
                        </label>
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Cinsiyet</span>
                          <div className="grid grid-cols-3 gap-2">
                            {(['female', 'male', 'other'] as Gender[]).map(g => (
                              <button
                                key={g} type="button" onClick={() => setGender(g)}
                                className={`py-3 rounded-xl border-2 font-bold text-sm transition ${gender === g
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:border-primary/40'
                                  }`}
                              >
                                {g === 'female' ? 'Kadın' : g === 'male' ? 'Erkek' : 'Diğer'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Boy + Kilo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Boy (cm)</span>
                          <input
                            type="number" min={100} max={250}
                            value={height} onChange={(e) => setHeight(e.target.value)}
                            placeholder="170"
                            className={profileInputCls}
                          />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kilo (kg)</span>
                          <input
                            type="number" min={25} max={300}
                            value={weight} onChange={(e) => setWeight(e.target.value)}
                            placeholder="70"
                            className={profileInputCls}
                          />
                        </label>
                      </div>

                      {/* Canlı Önizleme */}
                      {livePreview && (
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">bolt</span>
                            Canlı Hesaplama
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center">
                              <p className="text-[10px] font-bold text-on-surface-variant uppercase">BKİ</p>
                              <p className="text-xl font-extrabold text-on-surface">{livePreview.bmi}</p>
                              <p className="text-[10px] font-bold text-primary">{livePreview.bmiCategory}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Bazal Metabolizma</p>
                              <p className="text-xl font-extrabold text-on-surface">{livePreview.bmr}</p>
                              <p className="text-[10px] text-on-surface-variant">Dinlenirken yakılan</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Günlük Harcama</p>
                              <p className="text-xl font-extrabold text-on-surface">{livePreview.tdee}</p>
                              <p className="text-[10px] text-on-surface-variant">Aktiviteyle birlikte</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-bold text-primary uppercase">Hedef</p>
                              <p className="text-xl font-extrabold text-primary">{livePreview.calorieGoal}</p>
                              <p className="text-[10px] text-on-surface-variant">kcal/gün</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Aktivite Seviyesi */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Aktivite Seviyesi</span>
                        <div className="space-y-2">
                          {ACTIVITY_OPTIONS.map(opt => (
                            <button
                              key={opt.value} type="button"
                              onClick={() => setActivityLevel(opt.value)}
                              className={`w-full text-left p-4 rounded-2xl border-2 transition flex items-center gap-3 ${activityLevel === opt.value
                                ? 'border-primary bg-primary/10'
                                : 'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40'
                                }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activityLevel === opt.value ? 'bg-primary text-on-primary' : 'bg-primary/10 text-primary'
                                }`}>
                                <span className="material-symbols-outlined text-xl">{opt.icon}</span>
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
                        </div>
                      </div>

                      {/* Beslenme Hedefi */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Beslenme Hedefi</span>
                        <div className="grid grid-cols-2 gap-3">
                          {GOAL_OPTIONS.map(opt => (
                            <button
                              key={opt.value} type="button"
                              onClick={() => setGoal(opt.value)}
                              className={`p-4 rounded-2xl border-2 transition text-left ${goal === opt.value
                                ? 'border-primary bg-primary/10'
                                : 'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40'
                                }`}
                            >
                              <span className={`material-symbols-outlined text-xl mb-1 ${goal === opt.value ? 'text-primary' : 'text-on-surface-variant'
                                }`}>{opt.icon}</span>
                              <p className="font-bold text-on-surface text-sm">{opt.label}</p>
                              <p className="text-[11px] text-on-surface-variant">{opt.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Beslenme Tercihleri (kalori override) ── */}
              <section className="glass-card rounded-xl p-8 shadow-sm ring-1 ring-outline-variant/15">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">restaurant</span>
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-bold">Beslenme Tercihleri</h2>
                    <p className="text-on-surface-variant text-sm">Fiziksel bilgiler doluysa hedef otomatik hesaplanır, isterseniz elle de girebilirsiniz.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-on-surface-variant mb-1 block">Günlük Kalori Hedefi</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={livePreview ? livePreview.calorieGoal : calorieGoal}
                        onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 0)}
                        disabled={!!livePreview}
                        className={`w-full max-w-xs px-4 py-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest text-on-surface disabled:opacity-60 disabled:cursor-not-allowed`}
                      />
                      {livePreview && (
                        <span className="text-xs text-primary font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">auto_awesome</span>
                          Otomatik
                        </span>
                      )}
                    </div>
                  </label>
                </div>
              </section>

              <section className="glass-card rounded-xl p-8 shadow-sm ring-1 ring-outline-variant/15">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">warning</span>
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-bold">Alerjiler ve Hassasiyetler</h2>
                    <p className="text-on-surface-variant text-sm">Taramalarımızda sizi risklere karşı uyaracağız.</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ALLERGEN_OPTIONS.map(({ key, icon }) => (
                      <button
                        key={key}
                        onClick={() => toggleAllergy(key)}
                        className={`flex items-center justify-between p-5 rounded-lg group transition-all ${allergies.includes(key) ? 'bg-secondary/10 ring-2 ring-secondary' : 'bg-surface-container-low hover:bg-surface-container-high'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`material-symbols-outlined ${allergies.includes(key) ? 'text-secondary' : 'text-on-surface-variant'}`}>{icon}</span>
                          <span className="font-semibold">{key}</span>
                        </div>
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${allergies.includes(key) ? 'bg-secondary' : 'bg-surface-variant'}`}>
                          <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${allergies.includes(key) ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}></div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {allergies.filter(a => !ALLERGEN_OPTIONS.find(o => o.key === a)).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {allergies.filter(a => !ALLERGEN_OPTIONS.find(o => o.key === a)).map(a => (
                        <span key={a} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
                          {a}
                          <button onClick={() => toggleAllergy(a)} className="hover:text-error transition-colors">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 p-4 bg-surface-container rounded-lg border-2 border-dashed border-outline-variant/50">
                    <span className="material-symbols-outlined text-outline">add_circle</span>
                    <input
                      className="bg-transparent border-none focus:ring-0 w-full font-body italic text-on-surface-variant outline-none"
                      placeholder="Başka bir alerjen ekleyin..."
                      type="text"
                      value={customAllergen}
                      onChange={(e) => setCustomAllergen(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomAllergen()}
                    />
                    {customAllergen.trim() && (
                      <button onClick={addCustomAllergen} className="text-secondary font-bold text-sm whitespace-nowrap">
                        Ekle
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <div className="flex flex-col items-end gap-3 pt-6">
                {saveMessage && (
                  <p className={`text-sm font-semibold ${saveMessage.startsWith('✅') ? 'text-primary' : 'text-error'}`}>{saveMessage}</p>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-10 py-4 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </>
          )}

          {/* ============ Güvenlik ============ */}
          {activeTab === 'security' && (
            <>
              {/* Hesap Bilgileri */}
              <section className="glass-card rounded-xl p-8 shadow-sm ring-1 ring-outline-variant/15">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-bold">Hesap Bilgileri</h2>
                    <p className="text-on-surface-variant text-sm">Hesabınıza bağlı temel bilgiler.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon="alternate_email" label="E-posta" value={user?.email || '—'} />
                  <InfoRow icon="fingerprint" label="Kullanıcı ID" value={user?._id?.slice(-8) || '—'} mono />
                  <InfoRow icon="calendar_month" label="Üyelik Tarihi" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                  <InfoRow icon="update" label="Son Güncelleme" value={user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                </div>
              </section>

              {/* Şifre Değiştir */}
              <section className="glass-card rounded-xl p-8 shadow-sm ring-1 ring-outline-variant/15">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">key</span>
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-bold">Şifre Değiştir</h2>
                    <p className="text-on-surface-variant text-sm">Güçlü bir şifre seçmeniz tavsiye edilir (6+ karakter).</p>
                  </div>
                </div>

                <div className="space-y-4 max-w-md">
                  <PwdInput label="Mevcut Şifre" value={currentPwd} onChange={setCurrentPwd} show={showPwd} />
                  <PwdInput label="Yeni Şifre" value={newPwd} onChange={setNewPwd} show={showPwd} hint />
                  <PwdInput label="Yeni Şifre (Tekrar)" value={confirmPwd} onChange={setConfirmPwd} show={showPwd} />

                  <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer select-none">
                    <input type="checkbox" checked={showPwd} onChange={(e) => setShowPwd(e.target.checked)} className="rounded accent-primary" />
                    Şifreyi göster
                  </label>

                  {pwdMessage && (
                    <div className={`p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${pwdMessage.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                      }`}>
                      <span className="material-symbols-outlined text-base">
                        {pwdMessage.type === 'success' ? 'check_circle' : 'error'}
                      </span>
                      {pwdMessage.text}
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd}
                    className="w-full px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl shadow hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {pwdSaving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Güncelleniyor...
                      </>
                    ) : 'Şifreyi Güncelle'}
                  </button>
                </div>
              </section>

              {/* Tehlikeli Bölge */}
              <section className="rounded-xl p-8 bg-error/5 border border-error/30 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined">dangerous</span>
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-bold text-error">Tehlikeli Bölge</h2>
                    <p className="text-on-surface-variant text-sm">Bu işlemler geri alınamaz.</p>
                  </div>
                </div>

                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="px-6 py-3 border-2 border-error text-error font-bold rounded-xl hover:bg-error hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">delete_forever</span>
                    Hesabımı Sil
                  </button>
                ) : (
                  <div className="bg-surface-container-lowest/70 rounded-xl p-5 space-y-4">
                    <p className="text-sm text-on-surface">
                      <strong>Hesabınızı silmek üzeresiniz.</strong> Tüm tarama geçmişi, tercihler ve kullanıcı verileri
                      kalıcı olarak silinecek. Devam etmek için şifrenizi girin.
                    </p>
                    <div className="relative max-w-sm">
                      <input
                        type={showDeletePwd ? 'text' : 'password'}
                        value={deletePwd}
                        onChange={(e) => setDeletePwd(e.target.value)}
                        placeholder="Şifreniz"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-error/30 focus:border-error focus:ring-1 focus:ring-error outline-none bg-surface-container-lowest text-on-surface"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePwd(v => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/5 transition"
                        aria-label={showDeletePwd ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        title={showDeletePwd ? 'Şifreyi gizle' : 'Şifreyi göster'}
                      >
                        <span className="material-symbols-outlined text-lg">{showDeletePwd ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting || !deletePwd}
                        className="px-5 py-2.5 bg-error text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                      >
                        {deleting ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
                      </button>
                      <button
                        onClick={() => { setDeleteConfirm(false); setDeletePwd(''); }}
                        className="px-5 py-2.5 border border-outline-variant/40 text-on-surface font-bold rounded-xl hover:bg-surface-container-high"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {/* ============ Bildirimler ============ */}
          {activeTab === 'notifications' && (
            <>
              {/* Tarayıcı izin kartı — öğün hatırlatıcısı için gerekli */}
              {canPush && notifPrefs.mealReminders && !pushGranted && (
                <section className="glass-card rounded-xl p-5 shadow-sm ring-1 ring-tertiary/30 bg-tertiary/10 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined">notifications_off</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">Bildirim izni gerekiyor</p>
                      <p className="text-sm text-on-surface mt-0.5">
                        Öğün hatırlatıcılarını alabilmek için tarayıcı bildirim iznini etkinleştirmelisin.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={requestNotifPermission}
                    className="px-5 py-2.5 bg-tertiary text-on-tertiary font-bold rounded-xl hover:opacity-90 transition whitespace-nowrap"
                  >
                    İzin Ver
                  </button>
                </section>
              )}

              <section className="glass-card rounded-xl p-8 shadow-sm ring-1 ring-outline-variant/15">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">notifications_active</span>
                    </div>
                    <div>
                      <h2 className="font-headline text-2xl font-bold">Bildirim Tercihleri</h2>
                      <p className="text-on-surface-variant text-sm">Neleri, ne zaman görmek istediğinize karar verin.</p>
                    </div>
                  </div>
                  {notifSaved && (
                    <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">check</span>
                      Kaydedildi
                    </span>
                  )}
                </div>

                {/* Aktif bildirimler */}
                <div className="space-y-3 mb-6">
                  <p className="text-[10px] font-extrabold text-primary tracking-widest uppercase">Aktif Bildirimler</p>

                  <NotifToggle
                    icon="restaurant_menu"
                    title="Öğün Hatırlatıcıları"
                    desc="Seçili saatlerde tarayıcı bildirimi ile öğün eklemen için hatırlatır."
                    checked={notifPrefs.mealReminders}
                    onChange={(v) => updateNotif('mealReminders', v)}
                  >
                    {notifPrefs.mealReminders && (
                      <div className="mt-4 pl-1">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Hatırlatma Saatleri</p>
                        <div className="flex flex-wrap gap-2">
                          {['07:00', '08:00', '10:00', '13:00', '16:00', '19:00', '21:00'].map(time => (
                            <button
                              key={time}
                              onClick={() => toggleMealTime(time)}
                              className={`px-3 py-1.5 rounded-full text-sm font-bold transition ${notifPrefs.mealReminderTimes.includes(time)
                                ? 'bg-primary text-white shadow'
                                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                                }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </NotifToggle>

                  <NotifToggle
                    icon="warning"
                    title="Alerjen Uyarıları"
                    desc="Son taramalarında alerji profilinle çakışan ürün olduğunda panelde banner gösterir."
                    checked={notifPrefs.allergenAlerts}
                    onChange={(v) => updateNotif('allergenAlerts', v)}
                    accent="secondary"
                  />

                  <NotifToggle
                    icon="local_fire_department"
                    title="Kalori Hedefi Aşımı"
                    desc="Bugünkü toplam kalori hedefini aştığında panelde uyarı gösterir."
                    checked={notifPrefs.calorieOverAlert}
                    onChange={(v) => updateNotif('calorieOverAlert', v)}
                  />

                  <NotifToggle
                    icon="monitoring"
                    title="Sağlık Puanı Düşüşleri"
                    desc="Bugünkü puanın 7 günlük ortalamanın 10+ altına düşünce panelde uyarır."
                    checked={notifPrefs.healthScoreDrops}
                    onChange={(v) => updateNotif('healthScoreDrops', v)}
                  />
                </div>

                {/* Yakında */}
                <div className="space-y-3 pt-6 border-t border-outline-variant/20">
                  <p className="text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase">Yakında</p>

                  <ComingSoonToggle
                    icon="insights"
                    title="Haftalık Özet Raporu"
                    desc="Her pazartesi haftanın özeti e-postana düşecek. E-posta servisi hazırlık aşamasında."
                  />

                  <ComingSoonToggle
                    icon="recommend"
                    title="Yeni Ürün Önerileri"
                    desc="Profiline uygun yeni ürünler. Öneri motoru yakında eklenecek."
                  />
                </div>
              </section>

              <section className="glass-card rounded-xl p-6 shadow-sm ring-1 ring-outline-variant/15 flex items-start gap-4 bg-surface-container-low/50">
                <span className="material-symbols-outlined text-primary text-2xl mt-0.5">info</span>
                <div className="text-sm text-on-surface-variant">
                  <strong className="text-on-surface">Nasıl çalışır?</strong> Panel bildirimleri (alerjen, kalori, puan
                  düşüşü) Panelim sayfasında banner olarak görünür. Öğün hatırlatıcıları ise tarayıcı bildirimidir;
                  sayfa açık olmasa bile tarayıcı açıkken sana ulaşır. Tercihler bu cihaza özeldir.
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

// ───────────── Ortak Stiller ─────────────
const profileInputCls = "w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest text-on-surface transition-all";

// ───────────── Yardımcı Bileşenler ─────────────

function InfoRow({ icon, label, value, mono }: { icon: string; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
      <span className="material-symbols-outlined text-primary/60">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</p>
        <p className={`font-bold text-on-surface truncate ${mono ? 'font-mono text-sm' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

function PwdInput({ label, value, onChange, show, hint }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; hint?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-on-surface-variant mb-1 block">{label}</span>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest text-on-surface"
      />
      {hint && (
        <p className="text-xs text-on-surface-variant mt-1">En az 6 karakter kullan.</p>
      )}
    </label>
  );
}

function ComingSoonToggle({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-5 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 opacity-80">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-on-surface">{title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary text-[10px] font-extrabold tracking-wider uppercase">
                  Yakında
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mt-0.5">{desc}</p>
            </div>
            <div className="w-11 h-6 rounded-full bg-surface-variant relative flex-shrink-0 opacity-60">
              <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotifToggle({ icon, title, desc, checked, onChange, accent, children }: {
  icon: string; title: string; desc: string; checked: boolean;
  onChange: (v: boolean) => void; accent?: 'primary' | 'secondary';
  children?: React.ReactNode;
}) {
  const isSecondary = accent === 'secondary';
  const containerCls = checked
    ? (isSecondary ? 'bg-secondary/5 border-secondary/30' : 'bg-primary/5 border-primary/30')
    : 'bg-surface-container-low border-outline-variant/20';
  const iconCls = checked
    ? (isSecondary ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary')
    : 'bg-surface-container-high text-on-surface-variant';
  const toggleCls = checked
    ? (isSecondary ? 'bg-secondary' : 'bg-primary')
    : 'bg-surface-variant';

  return (
    <div className={`p-5 rounded-xl border transition-all ${containerCls}`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconCls}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-on-surface">{title}</h3>
              <p className="text-sm text-on-surface-variant mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => onChange(!checked)}
              className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${toggleCls}`}
              aria-pressed={checked}
            >
              <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`}></div>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
