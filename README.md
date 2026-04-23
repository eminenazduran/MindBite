# MindBite 🥗 — Akıllı Gıda Analiz Platformu

> AI destekli besin değeri analizi, doğal dil ile öğün takibi ve kişiselleştirilmiş beslenme önerileri sunan full-stack uygulama.

## 📸 Proje Hakkında

MindBite, kullanıcıların günlük öğünlerini doğal dille kaydedebileceği, ürün barkodunu tarayarak veya fotoğraf çekerek besin değerlerini anında öğrenebileceği bir beslenme takip platformudur. Google Gemini AI ve Open Food Facts API entegrasyonuyla güçlendirilmiştir.

### Özellikler

- 🔍 **Doğal Dil Öğün Kaydı** — "2 dilim ekmek ve 1 bardak süt" gibi ifadeler ile öğün ekleme
- 📊 **Detaylı Besin Analizi** — Kalori, protein, karbonhidrat, yağ takibi
- 🤖 **Gemini AI Entegrasyonu** — Akıllı gıda tanıma ve analiz
- 🏪 **Yerel Veritabanı + Open Food Facts** — Hızlı ve kapsamlı ürün bilgisi
- 👤 **Kullanıcı Kimlik Doğrulama** — JWT tabanlı güvenli oturum yönetimi
- 📱 **Responsive Tasarım** — Mobil uyumlu modern arayüz

## 🏗️ Proje Yapısı

```
MindBite/
├── backend-core/         # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── controllers/  # Route handler'ları
│   │   ├── models/       # Mongoose modelleri (User, Food, MealLog)
│   │   ├── routes/       # API endpoint tanımlamaları
│   │   ├── services/     # İş mantığı (Gemini, OpenFoodFacts)
│   │   ├── middleware/   # Auth ve hata yönetimi
│   │   └── server.ts     # Uygulama giriş noktası
│   ├── .env.example      # Ortam değişkenleri şablonu
│   └── package.json
│
├── frontend-web/         # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/        # Sayfa bileşenleri (Dashboard, Analysis, Register...)
│   │   ├── components/   # Yeniden kullanılabilir UI bileşenleri
│   │   ├── services/     # API istemci katmanı
│   │   └── App.tsx
│   └── package.json
│
└── README.md
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (yerel veya Atlas)
- [Google Gemini API Key](https://aistudio.google.com/)

### 1. Repoyu Klonlayın

```bash
git clone https://github.com/eminenazduran/MindBite.git
cd MindBite
```

### 2. Backend Kurulumu

```bash
cd backend-core
npm install

# .env dosyasını oluşturun
cp .env.example .env
# .env dosyasını açarak MongoDB URI ve Gemini API key'inizi girin

npm run dev
```

### 3. Frontend Kurulumu

```bash
cd frontend-web
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:5000`

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Backend | Node.js, Express, TypeScript |
| Veritabanı | MongoDB (Mongoose) |
| AI | Google Gemini API |
| Gıda Verisi | Open Food Facts API |
| Auth | JWT (JSON Web Tokens) |

---

*MindBite — Sağlıklı yaşamın akıllı yardımcısı* 🌱
