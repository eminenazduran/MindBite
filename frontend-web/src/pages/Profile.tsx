import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUser, updateUser, changePassword, deleteAccount } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotificationPrefs } from '../hooks/useNotificationPrefs';

const ALLERGEN_OPTIONS = [
  { key: 'Yer Fıstığı', icon: 'nutrition' },
  { key: 'Gluten', icon: 'grain' },
  { key: 'Süt Ürünleri', icon: 'egg_alt' },
  { key: 'Deniz Ürünleri', icon: 'waves' },
  { key: 'Soya', icon: 'spa' },
  { key: 'Yumurta', icon: 'egg' },
];

type TabKey = 'profile' | 'security' | 'notifications';

export default function Profile() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const { prefs: notifPrefs, patch: patchNotifPrefs } = useNotificationPrefs();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [customAllergen, setCustomAllergen] = useState('');

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
          setUser(res.data);
          setAllergies(res.data.allergies || []);
          setCalorieGoal(res.data.calorieGoal || 2000);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authUser]);

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

  const handleSave = async () => {
    if (!authUser) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await updateUser(authUser.id, { name: user?.name, allergies, calorieGoal });
      if (res.status === 'success') {
        setUser(res.data);
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
          <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary overflow-hidden">
            <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">person</span>
            </div>
          </div>
        </div>
        <div className="text-center md:text-left">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">Selam, {user?.name || 'Misafir'}</h1>
          <p className="font-body text-on-surface-variant text-lg">Beslenme yolculuğunu kişiselleştir ve sağlıklı kal.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* ───────── Sidebar ───────── */}
        <aside className="lg:col-span-3 space-y-2">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-full font-semibold transition-all whitespace-nowrap ${
                  activeTab === t.id
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
              <section className="glass-card rounded-xl p-8 shadow-sm ring-1 ring-outline-variant/15">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">restaurant</span>
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-bold">Beslenme Tercihleri</h2>
                    <p className="text-on-surface-variant text-sm">Size en uygun gıdaları önermemize yardımcı olun.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-on-surface-variant mb-1 block">Günlük Kalori Hedefi</span>
                    <input
                      type="number"
                      value={calorieGoal}
                      onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 0)}
                      className="w-full max-w-xs px-4 py-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest text-on-surface"
                    />
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
                        className={`flex items-center justify-between p-5 rounded-lg group transition-all ${
                          allergies.includes(key) ? 'bg-secondary/10 ring-2 ring-secondary' : 'bg-surface-container-low hover:bg-surface-container-high'
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
                    <div className={`p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                      pwdMessage.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
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
                              className={`px-3 py-1.5 rounded-full text-sm font-bold transition ${
                                notifPrefs.mealReminderTimes.includes(time)
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
              <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${
                checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
              }`}></div>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
