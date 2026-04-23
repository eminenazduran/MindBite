import type { UnitKey } from './unitParser';

/**
 * Türk mutfağına özgü gıdaların 100g başına besin değerleri ve
 * Türkçe konuşma dilindeki porsiyon gramajlarını içeren yerel seed tablosu.
 *
 * Kaynaklar: Diyetkolik, Fatsecret.com.tr ve Türkiye Beslenme Rehberi (TÜBER) değerleri
 * çapraz kontrol edilerek 100g başına normalize edilmiştir.
 *
 * portions: aynı UnitKey için gıdaya-özel gramaj (generic değeri ezer).
 *   Örn. yoğurt için `yemek_kasigi: 45` (generic 12g değil).
 */

export type FoodCategory =
    | 'sebze'
    | 'meyve'
    | 'tahil'
    | 'baklagil'
    | 'protein'
    | 'sut'
    | 'yag'
    | 'kuruyemis'
    | 'tatli'
    | 'icecek'
    | 'hamur_isi'
    | 'katki'
    | 'corba';

export interface TrFoodRef {
    name: string;
    keywords: string[];
    kcal: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    category: FoodCategory;
    quality: number; // 0.0 (işlenmiş/şekerli) - 1.0 (tam besin)
    portions?: Partial<Record<UnitKey, number>>;
}

export const TR_FOOD_SEED: TrFoodRef[] = [
    // === SÜT ÜRÜNLERİ ===
    {
        name: 'Yoğurt (tam yağlı)',
        keywords: ['yoğurt', 'yogurt'],
        kcal: 61, protein: 3.5, carbohydrates: 4.7, fat: 3.3,
        category: 'sut', quality: 0.85,
        portions: { yemek_kasigi: 45, tatli_kasigi: 20, kase: 200, su_bardagi: 245 }
    },
    {
        name: 'Yoğurt (yağsız)',
        keywords: ['yağsız yoğurt', 'light yoğurt', 'diyet yoğurt'],
        kcal: 56, protein: 5.7, carbohydrates: 7.7, fat: 0.2,
        category: 'sut', quality: 0.9,
        portions: { yemek_kasigi: 45, kase: 200 }
    },
    {
        name: 'Süt (tam yağlı)',
        keywords: ['süt', 'sut'],
        kcal: 61, protein: 3.2, carbohydrates: 4.8, fat: 3.3,
        category: 'sut', quality: 0.85,
        portions: { su_bardagi: 240, cay_bardagi: 120 }
    },
    {
        name: 'Ayran',
        keywords: ['ayran'],
        kcal: 34, protein: 1.8, carbohydrates: 2.6, fat: 1.9,
        category: 'sut', quality: 0.85,
        portions: { su_bardagi: 200, kase: 220 }
    },
    {
        name: 'Kefir',
        keywords: ['kefir'],
        kcal: 43, protein: 3.3, carbohydrates: 4, fat: 1.5,
        category: 'sut', quality: 0.9,
        portions: { su_bardagi: 240 }
    },
    {
        name: 'Beyaz peynir',
        keywords: ['beyaz peynir', 'peynir'],
        kcal: 264, protein: 17.5, carbohydrates: 3.5, fat: 21,
        category: 'sut', quality: 0.75,
        portions: { yemek_kasigi: 20, dilim: 25 }
    },
    {
        name: 'Kaşar peyniri',
        keywords: ['kaşar', 'kasar'],
        kcal: 345, protein: 24, carbohydrates: 2, fat: 27,
        category: 'sut', quality: 0.7,
        portions: { dilim: 20, yemek_kasigi: 20 }
    },
    {
        name: 'Labne',
        keywords: ['labne'],
        kcal: 174, protein: 6.5, carbohydrates: 4.2, fat: 15,
        category: 'sut', quality: 0.8,
        portions: { yemek_kasigi: 25 }
    },
    {
        name: 'Tereyağı',
        keywords: ['tereyağı', 'tereyagi', 'tereyag'],
        kcal: 717, protein: 0.9, carbohydrates: 0.1, fat: 81,
        category: 'yag', quality: 0.5,
        portions: { yemek_kasigi: 14, cay_kasigi: 5 }
    },

    // === YAĞLAR ===
    {
        name: 'Zeytinyağı',
        keywords: ['zeytinyağı', 'zeytinyagi'],
        kcal: 884, protein: 0, carbohydrates: 0, fat: 100,
        category: 'yag', quality: 0.8,
        portions: { yemek_kasigi: 10, cay_kasigi: 5 }
    },
    {
        name: 'Zeytin (siyah)',
        keywords: ['zeytin', 'siyah zeytin'],
        kcal: 115, protein: 0.8, carbohydrates: 6.3, fat: 10.7,
        category: 'yag', quality: 0.7,
        portions: { adet: 4, yemek_kasigi: 15 }
    },

    // === TAHILLAR ===
    {
        name: 'Ekmek (beyaz)',
        keywords: ['ekmek', 'beyaz ekmek'],
        kcal: 265, protein: 9, carbohydrates: 49, fat: 3.2,
        category: 'tahil', quality: 0.5,
        portions: { dilim: 30, adet: 50 }
    },
    {
        name: 'Ekmek (tam buğday)',
        keywords: ['tam buğday ekmek', 'kepekli ekmek', 'tam tahıl ekmek'],
        kcal: 247, protein: 13, carbohydrates: 41, fat: 3.4,
        category: 'tahil', quality: 0.85,
        portions: { dilim: 30 }
    },
    {
        name: 'Pirinç pilavı',
        keywords: ['pilav', 'pirinç pilavı', 'pirinc pilavi'],
        kcal: 130, protein: 2.7, carbohydrates: 28, fat: 0.3,
        category: 'tahil', quality: 0.55,
        portions: { yemek_kasigi: 25, kase: 200, porsiyon: 180, tabak: 250 }
    },
    {
        name: 'Bulgur pilavı',
        keywords: ['bulgur', 'bulgur pilavı'],
        kcal: 83, protein: 3.1, carbohydrates: 18.6, fat: 0.2,
        category: 'tahil', quality: 0.85,
        portions: { yemek_kasigi: 25, kase: 200, porsiyon: 180 }
    },
    {
        name: 'Makarna (pişmiş)',
        keywords: ['makarna', 'spagetti', 'penne'],
        kcal: 158, protein: 5.8, carbohydrates: 31, fat: 0.9,
        category: 'tahil', quality: 0.55,
        portions: { kase: 200, porsiyon: 180, tabak: 250 }
    },
    {
        name: 'Yulaf ezmesi',
        keywords: ['yulaf', 'yulaf ezmesi', 'oatmeal'],
        kcal: 389, protein: 16.9, carbohydrates: 66, fat: 6.9,
        category: 'tahil', quality: 0.95,
        portions: { yemek_kasigi: 10, kase: 40, su_bardagi: 80 }
    },
    {
        name: 'Mısır (haşlanmış)',
        keywords: ['mısır', 'misir', 'haşlanmış mısır'],
        kcal: 96, protein: 3.4, carbohydrates: 21, fat: 1.5,
        category: 'tahil', quality: 0.7,
        portions: { adet: 150, kase: 160 }
    },

    // === BAKLAGİLLER ===
    {
        name: 'Kuru fasulye',
        keywords: ['kuru fasulye', 'fasulye'],
        kcal: 127, protein: 8.7, carbohydrates: 22.8, fat: 0.5,
        category: 'baklagil', quality: 0.85,
        portions: { kase: 220, porsiyon: 200, yemek_kasigi: 20 }
    },
    {
        name: 'Nohut (pişmiş)',
        keywords: ['nohut'],
        kcal: 164, protein: 8.9, carbohydrates: 27.4, fat: 2.6,
        category: 'baklagil', quality: 0.85,
        portions: { kase: 220, yemek_kasigi: 20 }
    },
    {
        name: 'Kırmızı mercimek',
        keywords: ['mercimek', 'kırmızı mercimek'],
        kcal: 116, protein: 9, carbohydrates: 20.1, fat: 0.4,
        category: 'baklagil', quality: 0.9,
        portions: { kase: 220, yemek_kasigi: 20 }
    },
    {
        name: 'Yeşil mercimek',
        keywords: ['yeşil mercimek', 'yesil mercimek'],
        kcal: 116, protein: 9, carbohydrates: 20.1, fat: 0.4,
        category: 'baklagil', quality: 0.9,
        portions: { kase: 220, yemek_kasigi: 20 }
    },
    {
        name: 'Barbunya',
        keywords: ['barbunya'],
        kcal: 127, protein: 8.7, carbohydrates: 22.8, fat: 0.5,
        category: 'baklagil', quality: 0.85,
        portions: { kase: 220, porsiyon: 200 }
    },
    {
        name: 'Humus',
        keywords: ['humus', 'hummus'],
        kcal: 177, protein: 4.9, carbohydrates: 20, fat: 8.6,
        category: 'baklagil', quality: 0.8,
        portions: { yemek_kasigi: 20, kase: 120 }
    },

    // === PROTEİN / ET / BALIK / YUMURTA ===
    {
        name: 'Yumurta (haşlanmış)',
        keywords: ['yumurta', 'haşlanmış yumurta'],
        kcal: 155, protein: 13, carbohydrates: 1.1, fat: 11,
        category: 'protein', quality: 0.9,
        portions: { adet: 50 }
    },
    {
        name: 'Omlet',
        keywords: ['omlet'],
        kcal: 154, protein: 10.6, carbohydrates: 0.6, fat: 11.7,
        category: 'protein', quality: 0.75,
        portions: { adet: 100, porsiyon: 150 }
    },
    {
        name: 'Menemen',
        keywords: ['menemen'],
        kcal: 115, protein: 5.5, carbohydrates: 4.2, fat: 8.3,
        category: 'protein', quality: 0.8,
        portions: { porsiyon: 200, kase: 220 }
    },
    {
        name: 'Tavuk göğsü (ızgara)',
        keywords: ['tavuk', 'tavuk göğsü', 'ızgara tavuk'],
        kcal: 165, protein: 31, carbohydrates: 0, fat: 3.6,
        category: 'protein', quality: 0.95,
        portions: { porsiyon: 150, adet: 150 }
    },
    {
        name: 'Kıyma (dana, pişmiş)',
        keywords: ['kıyma', 'dana kıyma', 'kiyma'],
        kcal: 250, protein: 26, carbohydrates: 0, fat: 17,
        category: 'protein', quality: 0.7,
        portions: { porsiyon: 150, yemek_kasigi: 20 }
    },
    {
        name: 'Köfte',
        keywords: ['köfte', 'kofte'],
        kcal: 215, protein: 16, carbohydrates: 5, fat: 14,
        category: 'protein', quality: 0.7,
        portions: { adet: 40, porsiyon: 150 }
    },
    {
        name: 'Biftek (dana)',
        keywords: ['biftek', 'steak', 'dana eti'],
        kcal: 271, protein: 26, carbohydrates: 0, fat: 18,
        category: 'protein', quality: 0.75,
        portions: { porsiyon: 150 }
    },
    {
        name: 'Hindi göğsü',
        keywords: ['hindi', 'hindi göğsü'],
        kcal: 135, protein: 30, carbohydrates: 0, fat: 1,
        category: 'protein', quality: 0.95,
        portions: { dilim: 25, porsiyon: 150 }
    },
    {
        name: 'Balık (somon, ızgara)',
        keywords: ['somon', 'balık', 'balik'],
        kcal: 208, protein: 20, carbohydrates: 0, fat: 13,
        category: 'protein', quality: 0.95,
        portions: { porsiyon: 150 }
    },
    {
        name: 'Ton balığı (konserve)',
        keywords: ['ton', 'ton balığı', 'tuna'],
        kcal: 116, protein: 26, carbohydrates: 0, fat: 0.8,
        category: 'protein', quality: 0.85,
        portions: { yemek_kasigi: 15, porsiyon: 80 }
    },
    {
        name: 'Hamsi (ızgara)',
        keywords: ['hamsi'],
        kcal: 131, protein: 20, carbohydrates: 0, fat: 4.8,
        category: 'protein', quality: 0.9,
        portions: { porsiyon: 150 }
    },
    {
        name: 'Sucuk',
        keywords: ['sucuk'],
        kcal: 463, protein: 23, carbohydrates: 2, fat: 40,
        category: 'protein', quality: 0.35,
        portions: { dilim: 10, adet: 5 }
    },
    {
        name: 'Salam / Sosis',
        keywords: ['salam', 'sosis'],
        kcal: 301, protein: 13, carbohydrates: 2, fat: 27,
        category: 'protein', quality: 0.3,
        portions: { dilim: 15, adet: 50 }
    },

    // === SEBZELER ===
    {
        name: 'Domates',
        keywords: ['domates'],
        kcal: 18, protein: 0.9, carbohydrates: 3.9, fat: 0.2,
        category: 'sebze', quality: 0.95,
        portions: { adet: 120, dilim: 20 }
    },
    {
        name: 'Salatalık',
        keywords: ['salatalık', 'salatalik', 'hıyar'],
        kcal: 15, protein: 0.7, carbohydrates: 3.6, fat: 0.1,
        category: 'sebze', quality: 0.95,
        portions: { adet: 200, dilim: 10 }
    },
    {
        name: 'Marul / Yeşillik',
        keywords: ['marul', 'yeşillik', 'salata yaprağı'],
        kcal: 15, protein: 1.4, carbohydrates: 2.9, fat: 0.2,
        category: 'sebze', quality: 0.95,
        portions: { kase: 80, avuc: 20 }
    },
    {
        name: 'Ispanak (yemek)',
        keywords: ['ıspanak', 'ispanak'],
        kcal: 38, protein: 3.2, carbohydrates: 4.5, fat: 1.6,
        category: 'sebze', quality: 0.9,
        portions: { kase: 180, porsiyon: 200 }
    },
    {
        name: 'Brokoli',
        keywords: ['brokoli'],
        kcal: 34, protein: 2.8, carbohydrates: 7, fat: 0.4,
        category: 'sebze', quality: 0.95,
        portions: { kase: 150, porsiyon: 150 }
    },
    {
        name: 'Havuç',
        keywords: ['havuç', 'havuc'],
        kcal: 41, protein: 0.9, carbohydrates: 9.6, fat: 0.2,
        category: 'sebze', quality: 0.95,
        portions: { adet: 60, yemek_kasigi: 10 }
    },
    {
        name: 'Patates (haşlanmış)',
        keywords: ['patates', 'haşlanmış patates'],
        kcal: 87, protein: 1.9, carbohydrates: 20.1, fat: 0.1,
        category: 'sebze', quality: 0.7,
        portions: { adet: 150, porsiyon: 180 }
    },
    {
        name: 'Patates kızartması',
        keywords: ['patates kızartması', 'cips', 'kızarmış patates'],
        kcal: 312, protein: 3.4, carbohydrates: 41, fat: 15,
        category: 'sebze', quality: 0.3,
        portions: { porsiyon: 150, adet: 10 }
    },
    {
        name: 'Kabak (yemek)',
        keywords: ['kabak'],
        kcal: 17, protein: 1.2, carbohydrates: 3.1, fat: 0.3,
        category: 'sebze', quality: 0.9,
        portions: { porsiyon: 200, kase: 180 }
    },
    {
        name: 'Biber',
        keywords: ['biber'],
        kcal: 31, protein: 1, carbohydrates: 6, fat: 0.3,
        category: 'sebze', quality: 0.9,
        portions: { adet: 70 }
    },

    // === MEYVELER ===
    {
        name: 'Elma',
        keywords: ['elma'],
        kcal: 52, protein: 0.3, carbohydrates: 13.8, fat: 0.2,
        category: 'meyve', quality: 0.9,
        portions: { adet: 180, dilim: 20 }
    },
    {
        name: 'Muz',
        keywords: ['muz'],
        kcal: 89, protein: 1.1, carbohydrates: 22.8, fat: 0.3,
        category: 'meyve', quality: 0.85,
        portions: { adet: 120 }
    },
    {
        name: 'Portakal',
        keywords: ['portakal'],
        kcal: 47, protein: 0.9, carbohydrates: 11.8, fat: 0.1,
        category: 'meyve', quality: 0.9,
        portions: { adet: 150, dilim: 20 }
    },
    {
        name: 'Mandalina',
        keywords: ['mandalina'],
        kcal: 53, protein: 0.8, carbohydrates: 13.3, fat: 0.3,
        category: 'meyve', quality: 0.9,
        portions: { adet: 90 }
    },
    {
        name: 'Çilek',
        keywords: ['çilek', 'cilek'],
        kcal: 33, protein: 0.7, carbohydrates: 7.7, fat: 0.3,
        category: 'meyve', quality: 0.95,
        portions: { adet: 15, kase: 150 }
    },
    {
        name: 'Üzüm',
        keywords: ['üzüm', 'uzum'],
        kcal: 69, protein: 0.7, carbohydrates: 18, fat: 0.2,
        category: 'meyve', quality: 0.8,
        portions: { kase: 150, yemek_kasigi: 15 }
    },
    {
        name: 'Kivi',
        keywords: ['kivi'],
        kcal: 61, protein: 1.1, carbohydrates: 14.7, fat: 0.5,
        category: 'meyve', quality: 0.95,
        portions: { adet: 75 }
    },
    {
        name: 'Karpuz',
        keywords: ['karpuz'],
        kcal: 30, protein: 0.6, carbohydrates: 7.6, fat: 0.2,
        category: 'meyve', quality: 0.85,
        portions: { dilim: 300 }
    },
    {
        name: 'Armut',
        keywords: ['armut'],
        kcal: 57, protein: 0.4, carbohydrates: 15, fat: 0.1,
        category: 'meyve', quality: 0.9,
        portions: { adet: 170 }
    },
    {
        name: 'Şeftali',
        keywords: ['şeftali', 'seftali'],
        kcal: 39, protein: 0.9, carbohydrates: 9.5, fat: 0.3,
        category: 'meyve', quality: 0.9,
        portions: { adet: 150 }
    },

    // === KURUYEMIŞLER ===
    {
        name: 'Badem',
        keywords: ['badem'],
        kcal: 579, protein: 21, carbohydrates: 22, fat: 50,
        category: 'kuruyemis', quality: 0.9,
        portions: { avuc: 28, adet: 1.2, yemek_kasigi: 15 }
    },
    {
        name: 'Ceviz',
        keywords: ['ceviz'],
        kcal: 654, protein: 15, carbohydrates: 14, fat: 65,
        category: 'kuruyemis', quality: 0.9,
        portions: { avuc: 28, adet: 10, yemek_kasigi: 15 }
    },
    {
        name: 'Fındık',
        keywords: ['fındık', 'findik'],
        kcal: 628, protein: 15, carbohydrates: 17, fat: 61,
        category: 'kuruyemis', quality: 0.9,
        portions: { avuc: 28, adet: 1 }
    },
    {
        name: 'Kuru üzüm',
        keywords: ['kuru üzüm', 'kuru uzum'],
        kcal: 299, protein: 3.1, carbohydrates: 79, fat: 0.5,
        category: 'kuruyemis', quality: 0.7,
        portions: { avuc: 28, yemek_kasigi: 15 }
    },
    {
        name: 'Kuru kayısı',
        keywords: ['kuru kayısı', 'kuru kayisi'],
        kcal: 241, protein: 3.4, carbohydrates: 63, fat: 0.5,
        category: 'kuruyemis', quality: 0.8,
        portions: { adet: 10, avuc: 30 }
    },

    // === ÇORBALAR ===
    {
        name: 'Mercimek çorbası',
        keywords: ['mercimek çorbası', 'mercimek corbasi'],
        kcal: 70, protein: 4.2, carbohydrates: 10, fat: 1.6,
        category: 'corba', quality: 0.85,
        portions: { kase: 220, su_bardagi: 200 }
    },
    {
        name: 'Yayla çorbası',
        keywords: ['yayla çorbası', 'yayla corbasi'],
        kcal: 60, protein: 3, carbohydrates: 8, fat: 2,
        category: 'corba', quality: 0.8,
        portions: { kase: 220 }
    },
    {
        name: 'Ezogelin çorbası',
        keywords: ['ezogelin', 'ezogelin çorbası'],
        kcal: 65, protein: 3.5, carbohydrates: 10, fat: 1.5,
        category: 'corba', quality: 0.85,
        portions: { kase: 220 }
    },
    {
        name: 'Domates çorbası',
        keywords: ['domates çorbası', 'domates corbasi'],
        kcal: 50, protein: 1.5, carbohydrates: 7, fat: 2,
        category: 'corba', quality: 0.7,
        portions: { kase: 220 }
    },
    {
        name: 'Tarhana çorbası',
        keywords: ['tarhana'],
        kcal: 55, protein: 2.5, carbohydrates: 8.5, fat: 1.2,
        category: 'corba', quality: 0.85,
        portions: { kase: 220 }
    },

    // === HAMUR İŞLERİ ===
    {
        name: 'Simit',
        keywords: ['simit'],
        kcal: 313, protein: 9, carbohydrates: 56, fat: 5.5,
        category: 'hamur_isi', quality: 0.45,
        portions: { adet: 90 }
    },
    {
        name: 'Börek (kıymalı)',
        keywords: ['börek', 'borek', 'kıymalı börek'],
        kcal: 250, protein: 7, carbohydrates: 25, fat: 13,
        category: 'hamur_isi', quality: 0.4,
        portions: { dilim: 100, porsiyon: 150 }
    },
    {
        name: 'Poğaça',
        keywords: ['poğaça', 'pogaca'],
        kcal: 380, protein: 7, carbohydrates: 45, fat: 18,
        category: 'hamur_isi', quality: 0.35,
        portions: { adet: 80 }
    },
    {
        name: 'Açma',
        keywords: ['açma', 'acma'],
        kcal: 350, protein: 8, carbohydrates: 50, fat: 12,
        category: 'hamur_isi', quality: 0.4,
        portions: { adet: 75 }
    },
    {
        name: 'Lahmacun',
        keywords: ['lahmacun'],
        kcal: 252, protein: 10, carbohydrates: 34, fat: 8.5,
        category: 'hamur_isi', quality: 0.55,
        portions: { adet: 150 }
    },
    {
        name: 'Pide (kıymalı)',
        keywords: ['pide'],
        kcal: 265, protein: 11, carbohydrates: 35, fat: 9,
        category: 'hamur_isi', quality: 0.5,
        portions: { porsiyon: 250, dilim: 80 }
    },
    {
        name: 'Pizza',
        keywords: ['pizza'],
        kcal: 266, protein: 11, carbohydrates: 33, fat: 10,
        category: 'hamur_isi', quality: 0.35,
        portions: { dilim: 100, porsiyon: 200 }
    },

    // === TATLILAR ===
    {
        name: 'Baklava',
        keywords: ['baklava'],
        kcal: 430, protein: 6, carbohydrates: 45, fat: 25,
        category: 'tatli', quality: 0.2,
        portions: { dilim: 60, adet: 50 }
    },
    {
        name: 'Sütlaç',
        keywords: ['sütlaç', 'sutlac'],
        kcal: 125, protein: 3.5, carbohydrates: 21, fat: 2.5,
        category: 'tatli', quality: 0.5,
        portions: { kase: 200 }
    },
    {
        name: 'Muhallebi',
        keywords: ['muhallebi'],
        kcal: 120, protein: 3, carbohydrates: 20, fat: 3,
        category: 'tatli', quality: 0.5,
        portions: { kase: 150 }
    },
    {
        name: 'Künefe',
        keywords: ['künefe', 'kunefe'],
        kcal: 330, protein: 8, carbohydrates: 40, fat: 16,
        category: 'tatli', quality: 0.25,
        portions: { porsiyon: 150 }
    },
    {
        name: 'Kadayıf',
        keywords: ['kadayıf', 'kadayif'],
        kcal: 400, protein: 5, carbohydrates: 50, fat: 20,
        category: 'tatli', quality: 0.2,
        portions: { dilim: 70, porsiyon: 150 }
    },
    {
        name: 'Lokum',
        keywords: ['lokum'],
        kcal: 335, protein: 0.4, carbohydrates: 83, fat: 0.1,
        category: 'tatli', quality: 0.15,
        portions: { adet: 15 }
    },
    {
        name: 'Dondurma',
        keywords: ['dondurma'],
        kcal: 207, protein: 3.5, carbohydrates: 24, fat: 11,
        category: 'tatli', quality: 0.35,
        portions: { porsiyon: 60, kase: 150 }
    },
    {
        name: 'Çikolata (sütlü)',
        keywords: ['çikolata', 'cikolata', 'sütlü çikolata'],
        kcal: 535, protein: 7.6, carbohydrates: 59, fat: 30,
        category: 'tatli', quality: 0.2,
        portions: { adet: 15, dilim: 10 }
    },
    {
        name: 'Bisküvi',
        keywords: ['bisküvi', 'biskuvi'],
        kcal: 450, protein: 6, carbohydrates: 65, fat: 18,
        category: 'tatli', quality: 0.25,
        portions: { adet: 10 }
    },

    // === İÇECEKLER ===
    {
        name: 'Çay (sade)',
        keywords: ['çay', 'cay', 'siyah çay'],
        kcal: 1, protein: 0, carbohydrates: 0.3, fat: 0,
        category: 'icecek', quality: 0.8,
        portions: { cay_bardagi: 100, su_bardagi: 200 }
    },
    {
        name: 'Türk kahvesi',
        keywords: ['türk kahvesi', 'turk kahvesi', 'kahve'],
        kcal: 2, protein: 0.1, carbohydrates: 0, fat: 0,
        category: 'icecek', quality: 0.8,
        portions: { cay_bardagi: 60 }
    },
    {
        name: 'Kola',
        keywords: ['kola', 'cola'],
        kcal: 42, protein: 0, carbohydrates: 10.6, fat: 0,
        category: 'icecek', quality: 0.1,
        portions: { su_bardagi: 250, adet: 330 }
    },
    {
        name: 'Portakal suyu (taze)',
        keywords: ['portakal suyu', 'meyve suyu'],
        kcal: 45, protein: 0.7, carbohydrates: 10.4, fat: 0.2,
        category: 'icecek', quality: 0.55,
        portions: { su_bardagi: 240 }
    },
    {
        name: 'Limonata',
        keywords: ['limonata'],
        kcal: 40, protein: 0.1, carbohydrates: 10.4, fat: 0,
        category: 'icecek', quality: 0.4,
        portions: { su_bardagi: 240 }
    },

    // === GENEL ANA YEMEKLER ===
    {
        name: 'Dolma (yaprak)',
        keywords: ['dolma', 'yaprak sarma', 'sarma'],
        kcal: 170, protein: 3, carbohydrates: 20, fat: 9,
        category: 'tahil', quality: 0.7,
        portions: { adet: 25, porsiyon: 180 }
    },
    {
        name: 'Döner (et)',
        keywords: ['döner', 'doner', 'et döner'],
        kcal: 232, protein: 17, carbohydrates: 9, fat: 15,
        category: 'protein', quality: 0.6,
        portions: { porsiyon: 200, dilim: 20 }
    },
    {
        name: 'Tavuk döner',
        keywords: ['tavuk döner', 'tavuk doner'],
        kcal: 200, protein: 20, carbohydrates: 5, fat: 11,
        category: 'protein', quality: 0.7,
        portions: { porsiyon: 200 }
    },
    {
        name: 'Pilav üstü tavuk',
        keywords: ['pilav üstü tavuk', 'tavuklu pilav'],
        kcal: 155, protein: 10, carbohydrates: 22, fat: 3,
        category: 'tahil', quality: 0.7,
        portions: { porsiyon: 300 }
    },
    {
        name: 'Mantı',
        keywords: ['mantı', 'manti'],
        kcal: 210, protein: 9, carbohydrates: 28, fat: 7,
        category: 'hamur_isi', quality: 0.55,
        portions: { porsiyon: 200, kase: 220 }
    }
];
