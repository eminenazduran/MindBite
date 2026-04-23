require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');

// Model Tanımı (Hatasız çalışma için script içine gömüldü)
const foodSchema = new mongoose.Schema({
  barcode: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  ingredients: { type: [String], default: [] },
  calories: { type: Number, default: 0 },
  eCodes: { type: [String], default: [] },
  analysisResult: {
    isSafe: { type: Boolean, default: true },
    riskLevel: { type: String, default: 'Low' },
    aiComment: { type: String, default: '' }
  }
}, { timestamps: true });

const Food = mongoose.models.Food || mongoose.model('Food', foodSchema);

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Bağlantısı Başarılı. Seeding başlıyor...'))
  .catch(err => {
    console.error('❌ MongoDB Bağlantı Hatası:', err);
    process.exit(1);
  });

const results = [];

// CSV Dosyasını Oku ve Parse Et
fs.createReadStream('final_seeded_database_with_ingredients.csv')
  .pipe(csv())
  .on('data', (data) => {
    const ingredientsArray = data['Ingredients'] 
      ? data['Ingredients'].split(',').map(item => item.trim()) 
      : [];

    results.push({
      barcode: data['Barcode_ID'],
      productName: data['Product_Name'],
      calories: parseFloat(data['Kalori_100g (Kcal)']) || 0,
      ingredients: ingredientsArray,
      eCodes: [], 
      analysisResult: {
        isSafe: true,
        riskLevel: 'Low',
        aiComment: data['Ingredients'] === 'Bilinmiyor (Görüntü İşleme ile Taranacak)' 
            ? 'İçerik bilinmiyor. Lütfen etiketi okutunuz.' 
            : 'Kaggle yerel veritabanından doğrulandı.'
      }
    });
  })
  .on('end', async () => {
    try {
      console.log(`Veriler okundu. Toplam ${results.length} ürün veritabanına yazılıyor...`);
      
      // Toplu Ekleme
      await Food.insertMany(results, { ordered: false }); // Duplicate error durumunda durmaması için ordered: false
      console.log('🎉 BÜYÜK BAŞARI: Tüm veriler MongoDB\'ye kusursuz şekilde eklendi!');
      
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠️ Bazı mükerrer (duplicate) kayıtlar atlandı, diğerleri başarıyla eklendi.');
      } else {
        console.error('Yükleme sırasında hata oluştu:', error);
      }
    } finally {
      mongoose.connection.close();
      process.exit(0);
    }
  });
