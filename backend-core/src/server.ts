import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import app from './app';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Veritabanı Bağlantısı ve Sunucuyu Başlatma Fonksiyonu
const startServer = async () => {
  try {
    if (!MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI .env dosyasında bulunamadı. Lütfen MONGODB_URI ekleyin.');
    } else {
      // MongoDB'ye Bağlan
      await mongoose.connect(MONGODB_URI);
      console.log('✅ MongoDB veritabanına başarıyla bağlanıldı.');
    }

    // Sunucuyu Dinlemeye Başla
    app.listen(PORT, () => {
      console.log(`🚀 Sunucu başlatıldı: http://localhost:${PORT}`);
      console.log(`Kullanılan Ortam (Env): ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Sunucu başlatma hatası:', error);
    process.exit(1);
  }
};

startServer();
