// Türk mutfağında yaygın gıdalar için 100g başına besin değerleri + porsiyon gramajları.
//
// Referanslar (popüler TR beslenme takip uygulamaları ve klinik rehberler):
//   - Diyetkolik.com (TR'nin en çok kullanılan kalori takip sitesi)
//   - Fatsecret.com.tr
//   - Acıbadem Hayat (beslenme rehberleri)
//   - Rafinera "Besin Değişim Listesi" (diyetisyen standardı)
//   - Türkiye Beslenme Rehberi (TÜBER 2015)
//   - Mutfağımdan Tarifler mutfak ölçüleri
//
// Porsiyon gramajları "pratik tüketim" (dolu/tepeleme) miktarlarıdır;
// kuru silme ölçüm değil.

import type { UnitKey } from './unitParser';

// Gıda ana grubu — çeşitlilik puanı ve kalite sınıflaması için kullanılır.
export type FoodCategory =
    | 'sebze'
    | 'meyve'
    | 'tahil'       // ekmek, pilav, makarna, bulgur, yulaf
    | 'baklagil'    // fasulye, nohut, mercimek
    | 'protein'     // et, tavuk, balık, yumurta
    | 'sut'         // yoğurt, süt, peynir
    | 'yag'         // tereyağı, zeytinyağı
    | 'kuruyemis'   // ceviz, badem, fındık
    | 'tatli'       // baklava, sütlaç, künefe
    | 'icecek'      // çay, kahve, meyve suyu
    | 'hamur_isi'   // simit, poğaça, börek
    | 'katki'       // salça, bal, reçel
    | 'corba';      // çorbalar (karışık)

export interface TrFoodRef {
    name: string;
    keywords: string[];
    kcal: number; // 100g başına
    protein: number; // g / 100g
    carbohydrates: number; // g / 100g
    fat: number; // g / 100g
    category: FoodCategory;
    // 0.0 (boş kalori / yüksek işlenmiş) — 1.0 (tam besleyici).
    // Sağlık puanı kalite bileşeninde ağırlıklandırılır.
    quality: number;
    // Gıdaya özgü porsiyon gramajları (varsa generic değerleri ezer).
    portions?: Partial<Record<UnitKey, number>>;
}

export const TR_FOOD_SEED: TrFoodRef[] = [
    // ── SÜT VE SÜT ÜRÜNLERİ ────────────────────────────────────────
    {
        name: 'Yoğurt (tam yağlı)',
        keywords: ['yoğurt', 'yogurt'],
        kcal: 61, protein: 3.5, carbohydrates: 4.7, fat: 3.3,
        category: 'sut', quality: 0.85,
        portions: { yemek_kasigi: 45, tatli_kasigi: 18, kase: 180, su_bardagi: 240 }
    },
    {
        name: 'Süzme yoğurt',
        keywords: ['süzme yoğurt', 'suzme yogurt'],
        kcal: 95, protein: 9, carbohydrates: 3.6, fat: 5,
        category: 'sut', quality: 0.9,
        portions: { yemek_kasigi: 25, kase: 150 }
    },
    {
        name: 'Ayran',
        keywords: ['ayran'],
        kcal: 38, protein: 1.7, carbohydrates: 2.6, fat: 2,
        category: 'sut', quality: 0.85,
        portions: { su_bardagi: 200, cay_bardagi: 100, kase: 200 }
    },
    {
        name: 'Süt (tam yağlı)',
        keywords: ['süt', 'sut'],
        kcal: 61, protein: 3.2, carbohydrates: 4.8, fat: 3.3,
        category: 'sut', quality: 0.8,
        portions: { su_bardagi: 240, cay_bardagi: 100, kase: 240 }
    },
    {
        name: 'Beyaz peynir',
        keywords: ['beyaz peynir', 'peynir'],
        kcal: 264, protein: 17, carbohydrates: 1.5, fat: 21,
        category: 'sut', quality: 0.55,
        portions: { dilim: 30, yemek_kasigi: 25, adet: 30 }
    },
    {
        name: 'Kaşar peyniri',
        keywords: ['kaşar', 'kasar', 'kaşar peyniri'],
        kcal: 335, protein: 25, carbohydrates: 2.1, fat: 26,
        category: 'sut', quality: 0.45,
        portions: { dilim: 20, yemek_kasigi: 15 }
    },
    {
        name: 'Lor peyniri',
        keywords: ['lor'],
        kcal: 98, protein: 11, carbohydrates: 3.4, fat: 4.3,
        category: 'sut', quality: 0.9,
        portions: { yemek_kasigi: 20, kase: 100 }
    },
    {
        name: 'Tereyağı',
        keywords: ['tereyağı', 'tereyagi'],
        kcal: 717, protein: 0.9, carbohydrates: 0.1, fat: 81,
        category: 'yag', quality: 0.25,
        portions: { yemek_kasigi: 15, tatli_kasigi: 5, cay_kasigi: 3 }
    },

    // ── EKMEK / MAKARNA / PİLAV / TAHILLAR ─────────────────────────
    {
        name: 'Ekmek (beyaz)',
        keywords: ['ekmek', 'beyaz ekmek'],
        kcal: 265, protein: 9, carbohydrates: 49, fat: 3.2,
        category: 'tahil', quality: 0.4,
        portions: { dilim: 25, adet: 50 }
    },
    {
        name: 'Tam buğday ekmeği',
        keywords: ['tam buğday', 'tam bugday', 'esmer ekmek', 'tam tahıllı ekmek'],
        kcal: 247, protein: 13, carbohydrates: 41, fat: 3.4,
        category: 'tahil', quality: 0.85,
        portions: { dilim: 25, adet: 50 }
    },
    {
        name: 'Pilav (pişmiş)',
        keywords: ['pilav', 'pirinç pilavı', 'pirinc pilavi', 'pirinç', 'pirinc'],
        kcal: 150, protein: 2.7, carbohydrates: 28, fat: 3.5,
        category: 'tahil', quality: 0.4,
        portions: { yemek_kasigi: 20, porsiyon: 150, kase: 200, tabak: 250 }
    },
    {
        name: 'Bulgur pilavı',
        keywords: ['bulgur', 'bulgur pilavı', 'bulgur pilavi'],
        kcal: 140, protein: 4.5, carbohydrates: 26, fat: 2.5,
        category: 'tahil', quality: 0.85,
        portions: { yemek_kasigi: 20, porsiyon: 150, kase: 200 }
    },
    {
        name: 'Makarna (haşlanmış)',
        keywords: ['makarna', 'spagetti', 'spaghetti'],
        kcal: 158, protein: 5.8, carbohydrates: 30.9, fat: 0.9,
        category: 'tahil', quality: 0.45,
        portions: { porsiyon: 150, kase: 200, tabak: 250 }
    },
    {
        name: 'Yulaf ezmesi (kuru)',
        keywords: ['yulaf', 'yulaf ezmesi'],
        kcal: 389, protein: 16.9, carbohydrates: 66, fat: 6.9,
        category: 'tahil', quality: 0.95,
        portions: { yemek_kasigi: 10, su_bardagi: 90, kase: 50 }
    },
    {
        name: 'Simit',
        keywords: ['simit'],
        kcal: 305, protein: 10, carbohydrates: 57, fat: 4.5,
        category: 'hamur_isi', quality: 0.35,
        portions: { adet: 90 }
    },
    {
        name: 'Poğaça',
        keywords: ['poğaça', 'pogaca'],
        kcal: 330, protein: 7, carbohydrates: 40, fat: 15,
        category: 'hamur_isi', quality: 0.25,
        portions: { adet: 70 }
    },
    {
        name: 'Börek (kıymalı/peynirli)',
        keywords: ['börek', 'borek'],
        kcal: 250, protein: 9.2, carbohydrates: 28.8, fat: 10.4,
        category: 'hamur_isi', quality: 0.35,
        portions: { dilim: 100, porsiyon: 150 }
    },

    // ── ÇORBALAR ──────────────────────────────────────────────────
    {
        name: 'Mercimek çorbası',
        keywords: ['mercimek çorbası', 'mercimek corbasi', 'mercimek', 'kırmızı mercimek çorbası'],
        kcal: 64, protein: 3.9, carbohydrates: 8.9, fat: 1.7,
        category: 'corba', quality: 0.9,
        portions: { kase: 240, tabak: 300, porsiyon: 240 }
    },
    {
        name: 'Domates çorbası',
        keywords: ['domates çorbası', 'domates corbasi'],
        kcal: 55, protein: 1.6, carbohydrates: 8.5, fat: 1.8,
        category: 'corba', quality: 0.75,
        portions: { kase: 240, tabak: 300 }
    },
    {
        name: 'Tarhana çorbası',
        keywords: ['tarhana', 'tarhana çorbası'],
        kcal: 55, protein: 2.2, carbohydrates: 9, fat: 1,
        category: 'corba', quality: 0.85,
        portions: { kase: 240, tabak: 300 }
    },
    {
        name: 'Yayla çorbası',
        keywords: ['yayla çorbası', 'yayla corbasi', 'yayla'],
        kcal: 60, protein: 2.8, carbohydrates: 7.5, fat: 1.8,
        category: 'corba', quality: 0.8,
        portions: { kase: 240, tabak: 300 }
    },
    {
        name: 'Ezogelin çorbası',
        keywords: ['ezogelin'],
        kcal: 65, protein: 3, carbohydrates: 10, fat: 1.3,
        category: 'corba', quality: 0.9,
        portions: { kase: 240, tabak: 300 }
    },
    {
        name: 'Çorba (genel)',
        keywords: ['çorba', 'corba'],
        kcal: 60, protein: 2.5, carbohydrates: 8, fat: 1.6,
        category: 'corba', quality: 0.75,
        portions: { kase: 240, tabak: 300 }
    },

    // ── ET / TAVUK / BALIK / YUMURTA ──────────────────────────────
    {
        name: 'Tavuk göğsü (ızgara)',
        keywords: ['tavuk', 'tavuk göğsü', 'tavuk gogsu', 'tavuk eti'],
        kcal: 165, protein: 31, carbohydrates: 0, fat: 3.6,
        category: 'protein', quality: 0.95,
        portions: { porsiyon: 120, adet: 120, dilim: 30 }
    },
    {
        name: 'Dana eti (yağsız, pişmiş)',
        keywords: ['dana', 'dana eti', 'et', 'biftek'],
        kcal: 190, protein: 26, carbohydrates: 0, fat: 9,
        category: 'protein', quality: 0.8,
        portions: { porsiyon: 120, yemek_kasigi: 30 }
    },
    {
        name: 'Kıyma (pişmiş)',
        keywords: ['kıyma', 'kiyma'],
        kcal: 220, protein: 24, carbohydrates: 0, fat: 13,
        category: 'protein', quality: 0.65,
        portions: { yemek_kasigi: 30, porsiyon: 120 }
    },
    {
        name: 'Köfte (ızgara/tava)',
        keywords: ['köfte', 'kofte'],
        kcal: 200, protein: 14, carbohydrates: 5, fat: 14,
        category: 'protein', quality: 0.55,
        portions: { adet: 30, porsiyon: 140 }
    },
    {
        name: 'Somon (pişmiş)',
        keywords: ['somon'],
        kcal: 208, protein: 20, carbohydrates: 0, fat: 13,
        category: 'protein', quality: 0.95,
        portions: { porsiyon: 120, dilim: 100 }
    },
    {
        name: 'Levrek / Balık (pişmiş)',
        keywords: ['levrek', 'balık', 'balik', 'çipura', 'cipura'],
        kcal: 124, protein: 23, carbohydrates: 0, fat: 2.5,
        category: 'protein', quality: 0.95,
        portions: { porsiyon: 150, adet: 200, dilim: 100 }
    },
    {
        name: 'Yumurta',
        keywords: ['yumurta'],
        kcal: 143, protein: 12.6, carbohydrates: 0.7, fat: 9.5,
        category: 'protein', quality: 0.9,
        portions: { adet: 50 }
    },

    // ── BAKLAGİLLER ───────────────────────────────────────────────
    {
        name: 'Kuru fasulye (pişmiş)',
        keywords: ['kuru fasulye', 'fasulye', 'etli kuru fasulye'],
        kcal: 130, protein: 8.7, carbohydrates: 22.8, fat: 1.5,
        category: 'baklagil', quality: 0.9,
        portions: { yemek_kasigi: 25, porsiyon: 150, kase: 200, tabak: 250 }
    },
    {
        name: 'Nohut (pişmiş / yemeği)',
        keywords: ['nohut'],
        kcal: 164, protein: 8.9, carbohydrates: 27.4, fat: 2.6,
        category: 'baklagil', quality: 0.9,
        portions: { yemek_kasigi: 25, porsiyon: 150, kase: 200 }
    },

    // ── SEBZELER ──────────────────────────────────────────────────
    {
        name: 'Salata (yeşil)',
        keywords: ['salata', 'yeşil salata', 'yesil salata', 'mevsim salatası'],
        kcal: 20, protein: 1.2, carbohydrates: 3, fat: 0.5,
        category: 'sebze', quality: 1.0,
        portions: { kase: 150, tabak: 200, porsiyon: 150 }
    },
    {
        name: 'Domates',
        keywords: ['domates'],
        kcal: 18, protein: 0.9, carbohydrates: 3.9, fat: 0.2,
        category: 'sebze', quality: 1.0,
        portions: { adet: 120, dilim: 20 }
    },
    {
        name: 'Salatalık',
        keywords: ['salatalık', 'salatalik'],
        kcal: 15, protein: 0.7, carbohydrates: 3.6, fat: 0.1,
        category: 'sebze', quality: 1.0,
        portions: { adet: 150, dilim: 15 }
    },
    {
        name: 'Patates (haşlanmış)',
        keywords: ['patates', 'haşlanmış patates'],
        kcal: 87, protein: 1.9, carbohydrates: 20, fat: 0.1,
        category: 'sebze', quality: 0.65,
        portions: { adet: 150, yemek_kasigi: 30, porsiyon: 150 }
    },
    {
        name: 'Havuç',
        keywords: ['havuç', 'havuc'],
        kcal: 41, protein: 0.9, carbohydrates: 9.6, fat: 0.2,
        category: 'sebze', quality: 1.0,
        portions: { adet: 80, yemek_kasigi: 15 }
    },
    {
        name: 'Ispanak (pişmiş)',
        keywords: ['ıspanak', 'ispanak'],
        kcal: 23, protein: 3, carbohydrates: 3.8, fat: 0.3,
        category: 'sebze', quality: 1.0,
        portions: { yemek_kasigi: 25, porsiyon: 200, kase: 200 }
    },

    // ── MEYVELER ──────────────────────────────────────────────────
    {
        name: 'Elma',
        keywords: ['elma'],
        kcal: 52, protein: 0.3, carbohydrates: 14, fat: 0.2,
        category: 'meyve', quality: 1.0,
        portions: { adet: 150, dilim: 20 }
    },
    {
        name: 'Muz',
        keywords: ['muz'],
        kcal: 89, protein: 1.1, carbohydrates: 23, fat: 0.3,
        category: 'meyve', quality: 0.9,
        portions: { adet: 120 }
    },
    {
        name: 'Portakal',
        keywords: ['portakal'],
        kcal: 47, protein: 0.9, carbohydrates: 12, fat: 0.1,
        category: 'meyve', quality: 1.0,
        portions: { adet: 180, dilim: 30 }
    },
    {
        name: 'Çilek',
        keywords: ['çilek', 'cilek'],
        kcal: 32, protein: 0.7, carbohydrates: 7.7, fat: 0.3,
        category: 'meyve', quality: 1.0,
        portions: { adet: 12, kase: 150, avuc: 80 }
    },
    {
        name: 'Üzüm',
        keywords: ['üzüm', 'uzum'],
        kcal: 69, protein: 0.7, carbohydrates: 18, fat: 0.2,
        category: 'meyve', quality: 0.85,
        portions: { avuc: 80, kase: 150, adet: 5 }
    },
    {
        name: 'Karpuz',
        keywords: ['karpuz'],
        kcal: 30, protein: 0.6, carbohydrates: 7.6, fat: 0.2,
        category: 'meyve', quality: 0.9,
        portions: { dilim: 200, adet: 200 }
    },

    // ── KURUYEMİŞ / YAĞLAR ────────────────────────────────────────
    {
        name: 'Ceviz (iç)',
        keywords: ['ceviz'],
        kcal: 654, protein: 15, carbohydrates: 14, fat: 65,
        category: 'kuruyemis', quality: 0.95,
        portions: { adet: 6, yemek_kasigi: 8, avuc: 25 }
    },
    {
        name: 'Fındık (iç)',
        keywords: ['fındık', 'findik'],
        kcal: 628, protein: 15, carbohydrates: 17, fat: 61,
        category: 'kuruyemis', quality: 0.95,
        portions: { adet: 1, yemek_kasigi: 8, avuc: 20 }
    },
    {
        name: 'Badem',
        keywords: ['badem'],
        kcal: 579, protein: 21, carbohydrates: 22, fat: 50,
        category: 'kuruyemis', quality: 0.95,
        portions: { adet: 1.2, yemek_kasigi: 8, avuc: 20 }
    },
    {
        name: 'Zeytin (siyah)',
        keywords: ['zeytin', 'siyah zeytin'],
        kcal: 115, protein: 0.8, carbohydrates: 6, fat: 11,
        category: 'yag', quality: 0.75,
        portions: { adet: 4, yemek_kasigi: 15, tatli_kasigi: 7 }
    },
    {
        name: 'Zeytinyağı',
        keywords: ['zeytinyağı', 'zeytinyagi'],
        kcal: 884, protein: 0, carbohydrates: 0, fat: 100,
        category: 'yag', quality: 0.85,
        portions: { yemek_kasigi: 14, tatli_kasigi: 5, cay_kasigi: 3 }
    },

    // ── TATLILAR ──────────────────────────────────────────────────
    {
        name: 'Baklava',
        keywords: ['baklava'],
        kcal: 428, protein: 5.2, carbohydrates: 29.3, fat: 22.6,
        category: 'tatli', quality: 0.1,
        portions: { dilim: 60, adet: 60, porsiyon: 100 }
    },
    {
        name: 'Sütlaç',
        keywords: ['sütlaç', 'sutlac'],
        kcal: 125, protein: 3, carbohydrates: 22, fat: 2.6,
        category: 'tatli', quality: 0.35,
        portions: { kase: 200, porsiyon: 215 }
    },
    {
        name: 'Künefe',
        keywords: ['künefe', 'kunefe'],
        kcal: 390, protein: 7, carbohydrates: 50, fat: 18,
        category: 'tatli', quality: 0.1,
        portions: { porsiyon: 150, dilim: 100 }
    },

    // ── İÇECEKLER ─────────────────────────────────────────────────
    {
        name: 'Çay (şekersiz)',
        keywords: ['çay', 'cay'],
        kcal: 1, protein: 0, carbohydrates: 0.2, fat: 0,
        category: 'icecek', quality: 0.9,
        portions: { cay_bardagi: 100, su_bardagi: 200 }
    },
    {
        name: 'Türk kahvesi (sade)',
        keywords: ['kahve', 'türk kahvesi', 'turk kahvesi'],
        kcal: 2, protein: 0.1, carbohydrates: 0, fat: 0,
        category: 'icecek', quality: 0.9,
        portions: { adet: 60, cay_bardagi: 60 }
    },
    {
        name: 'Portakal suyu',
        keywords: ['portakal suyu', 'meyve suyu'],
        kcal: 45, protein: 0.7, carbohydrates: 10.4, fat: 0.2,
        category: 'icecek', quality: 0.5,
        portions: { su_bardagi: 240, cay_bardagi: 100 }
    },

    // ── KATKILAR / SOSLAR ─────────────────────────────────────────
    {
        name: 'Domates salçası',
        keywords: ['salça', 'salca', 'domates salçası'],
        kcal: 82, protein: 4.3, carbohydrates: 19, fat: 0.5,
        category: 'katki', quality: 0.7,
        portions: { yemek_kasigi: 28, tatli_kasigi: 12 }
    },
    {
        name: 'Bal',
        keywords: ['bal'],
        kcal: 304, protein: 0.3, carbohydrates: 82, fat: 0,
        category: 'katki', quality: 0.35,
        portions: { yemek_kasigi: 20, tatli_kasigi: 13, cay_kasigi: 7 }
    },
    {
        name: 'Reçel',
        keywords: ['reçel', 'recel'],
        kcal: 250, protein: 0.4, carbohydrates: 64, fat: 0.1,
        category: 'katki', quality: 0.2,
        portions: { yemek_kasigi: 20, tatli_kasigi: 10 }
    }
];
