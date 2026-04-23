import { Request, Response } from 'express';
import fs from 'fs';
import { User } from '../models/User';
import { Food } from '../models/Food';
import { ScanHistory } from '../models/ScanHistory';
import { analyzeRisk } from '../services/analyzerService';

import { fetchFromOpenFoodFacts, analyzeWithGemini } from '../services/geminiService';
import { parseMealDescription, resolveGrams } from '../services/unitParser';
import { getNutritionPer100g } from '../services/nutritionProvider';

export const scanProduct = async (req: Request, res: Response) => {
  try {
    // Auth middleware'den gelen userId'yi kullan, yoksa body'den bak (fallback)
    const userId = (req as any).userId || req.body.userId;
    const { barcode, ocrText, servingSize } = req.body;

    if (!userId || !barcode) {
      return res.status(400).json({ status: 'error', message: 'Kullanıcı ID ve Barkod gereklidir.' });
    }

    // 1. Kullanıcıyı getir
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Kullanıcı bulunamadı.' });
    }

    // 2. Kendi MongoDB veritabanımıza bak (Eğer önceden eklendiyse HIZLI yanıt)
    let food = await Food.findOne({ barcode });
    
    // Ürün veritabanımızda yoksa
    if (!food) {
      // Önce Open Food Facts API'sine sor
      let rawData = await fetchFromOpenFoodFacts(barcode);
      
      // Eğer Open Food Facts'te YOKSA ve Client henüz OCR metni göndermediyse:
      if (!rawData && !ocrText) {
         // Uygulamaya "Bunu kullanıcıdan iste" emrini veriyoruz
         return res.status(200).json({ 
            status: 'needs_ocr', 
            message: 'Ürün veritabanında bulunamadı. Lütfen paketin içindekiler kısmını okutun veya metin olarak girin.',
            barcode
         });
      }
      
      // Eğer Open Food Facts'te YOKSA ama kullanıcı bize OCR (Fotoğraftan okunan metin) gönderdiyse:
      if (!rawData && ocrText) {
         rawData = { 
           product_name: `Gönüllü Eklenen Ürün (${barcode})`, 
           ingredients_text: ocrText,
           nutriments: {}, // Kullanıcıdan kalori de istenebilir ama şimdilik boş
           allergens_tags: []
         };
      }
      
      // Gemini'den geçir
      const geminiAnalysis = await analyzeWithGemini(rawData);

      // Kendi veritabanımıza crowdsource veya API'den gelen veriyi KAYDET!
      food = new Food({
        barcode,
        productName: geminiAnalysis.name || `Ürün ${barcode}`,
        ingredients: geminiAnalysis.ingredients || [],
        eCodes: geminiAnalysis.eCodes || [],
        calories: geminiAnalysis.calories || 0,
        protein: geminiAnalysis.protein || 0,
        carbohydrates: geminiAnalysis.carbohydrates || 0,
        fat: geminiAnalysis.fat || 0,
        allergens: geminiAnalysis.allergens || []
      });
      await food.save();
    }

    // 3. Risk Analizi - Saf fonksiyon çağrısı
    const analysisResult = analyzeRisk(user, food);

    // 4. Tarama Geçmişini Kaydet - Immutability için yeni bir nesne oluşturuyoruz
    const scanRecord = new ScanHistory({
      userId: user._id,
      foodId: food._id,
      barcode: food.barcode,
      servingSize: servingSize || 100,
      analysisResult: Object.freeze({ ...analysisResult }) // Freeze ile immutable hale getirme simulasyonu
    });
    
    await scanRecord.save();

    // 5. Sonuç Dön
    res.status(200).json({
      status: 'success',
      message: 'Tarama analizi tamamlandı.',
      data: {
        food,
        analysisResult
      }
    });

  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const logNaturalMeal = async (req: Request, res: Response) => {
  try {
    console.log('Incoming Natural Meal Body:', req.body);
    const userId = (req as any).userId || req.body.userId;
    const mealDescription = req.body.mealDescription || req.body.description;

    if (!userId || !mealDescription) {
      console.error('Missing params detail:', { 
        hasUserId: !!userId, 
        hasMealDescription: !!mealDescription,
        body: req.body 
      });
      return res.status(400).json({ 
        status: 'error', 
        message: `Eksik bilgi: ${!userId ? 'Kullanıcı ID' : ''} ${!mealDescription ? 'Yemek açıklaması' : ''} bulunamadı.` 
      });
    }

    // 1. Metni ayrıştır: miktar + birim + ürün
    const parsedItems = parseMealDescription(mealDescription);
    if (parsedItems.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Yemek açıklaması anlaşılamadı. Örn: "3 yk yoğurt, 1 kase çorba" şeklinde yazın.'
      });
    }

    const round1 = (n: number) => Math.round(n * 10) / 10;
    const savedLogs = [];

    // 2. Her kalem için 100g başına besin değerini çek, grama göre ölçekle.
    for (const parsed of parsedItems) {
      const lookup = await getNutritionPer100g(parsed.query);

      // Gıdaya-özel porsiyon gramajı varsa (ör. "1 yk yoğurt" = 45g),
      // generic parser değerini (15g) ezip yeniden hesapla.
      const effectiveGrams = resolveGrams(parsed.unit, parsed.quantity, lookup.portions);
      const factor = effectiveGrams / 100;

      const totalCalories = Math.max(1, Math.round(lookup.per100g.kcal * factor));
      const totalProtein = round1(lookup.per100g.protein * factor);
      const totalCarbs = round1(lookup.per100g.carbohydrates * factor);
      const totalFat = round1(lookup.per100g.fat * factor);

      const virtualBarcode = `V-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const displayName = `${parsed.raw} (${lookup.matchedName})`;

      const food = new Food({
        barcode: virtualBarcode,
        productName: displayName,
        calories: totalCalories,
        protein: totalProtein,
        carbohydrates: totalCarbs,
        fat: totalFat,
        isGeneric: true,
        ingredients: [parsed.query],
        category: lookup.category,
        quality: lookup.quality,
        analysisResult: {
          isSafe: true,
          riskLevel: 'LOW',
          aiComment: `Doğal dille girilen öğün. Kaynak: ${lookup.source}. Miktar: ${effectiveGrams}g.`
        }
      });

      await food.save();

      const scanRecord = new ScanHistory({
        userId,
        foodId: food._id,
        barcode: virtualBarcode,
        servingSize: effectiveGrams,
        analysisResult: {
          riskLevel: 'LOW',
          warnings: [],
          safeToConsume: true
        }
      });

      await scanRecord.save();
      savedLogs.push({
        food,
        scanRecord,
        meta: {
          parsed,
          effectiveGrams,
          source: lookup.source,
          per100g: lookup.per100g
        }
      });
    }

    res.status(200).json({
      status: 'success',
      message: `${parsedItems.length} kalem başarıyla eklendi.`,
      data: savedLogs
    });

  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
