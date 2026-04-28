// Zararlı / Şüpheli Gıda Katkı Maddeleri Veritabanı
// =====================================================================
// Kaynaklar:
//   - EFSA (European Food Safety Authority) — AB gıda güvenliği otoritesi
//   - IARC (International Agency for Research on Cancer / WHO) — kanser sınıflandırması
//   - AB Yönetmeliği 1333/2008 — Gıda katkı maddeleri ve uyarı zorunluluğu
//   - FDA "Substances Added to Food" listesi
//   - Türk Gıda Kodeksi Renklendiriciler ve Tatlandırıcılar Tebliği
//   - Southampton Çalışması 2007 — yapay renklendirici / hiperaktivite ilişkisi
//
// Risk seviyesi mantığı:
//   - HIGH:    AB tarafından yasaklanmış, IARC Grup 1/2A, ya da net belgelenmiş ciddi etki
//   - MEDIUM:  IARC Grup 2B (olası kanserojen), AB'de uyarı zorunlu, hassas gruplar için riskli
//   - LOW:     Tartışmalı / hassas bireylere özel uyarı (astım, migren, mikrobiyom)

export type AdditiveSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type AdditiveCategory =
  | 'colorant'        // Renklendirici / boya
  | 'preservative'    // Koruyucu
  | 'sweetener'       // Tatlandırıcı
  | 'flavor_enhancer' // Tat artırıcı
  | 'emulsifier'      // Emülgatör / kıvam
  | 'fat'             // Yağ türleri (trans, palm)
  | 'sugar'           // Şeker türleri (HFCS, glukoz şurubu)
  | 'other';

export interface RiskyAdditive {
  // Tanımlayıcılar
  code: string;                    // E-kodu veya internal ID (örn. "E250", "TRANS_FAT")
  displayName: string;             // Türkçe gösterim adı
  aliases: string[];               // Diğer isimler / alt türler
  // Aramada kullanılacak küçük harfli anahtar kelimeler
  // (E-kod ürün eCodes listesinde, keyword ingredients metninde aranır)
  keywords: string[];

  // Risk meta
  category: AdditiveCategory;
  severity: AdditiveSeverity;

  // Kullanıcıya gösterilecek bilgiler
  shortLabel: string;              // Kısa rozet metni (örn. "Olası kanserojen")
  warning: string;                 // Sade Türkçe açıklama
  source?: string;                 // Hangi kuruma dayalı (rozet veya tooltip)
  sensitiveGroups?: string[];      // Özellikle hangi gruplar için tehlikeli
}

// =====================================================================
// 1) RENKLENDİRİCİLER — Azo boyaları (Southampton Çalışması, AB uyarı zorunlu)
// =====================================================================
const COLORANTS: RiskyAdditive[] = [
  {
    code: 'E102',
    displayName: 'Tartrazin (E102)',
    aliases: ['Tartrazine', 'FD&C Yellow 5'],
    keywords: ['e102', 'tartrazin', 'tartrazine'],
    category: 'colorant',
    severity: 'MEDIUM',
    shortLabel: 'Hiperaktivite riski',
    warning: 'Azo boyası. Çocuklarda dikkat eksikliği ve hiperaktivite ile ilişkilendirildi (Southampton Çalışması, 2007). AB ürün etiketinde uyarı zorunlu.',
    source: 'EFSA / EU 1333/2008',
    sensitiveGroups: ['Çocuklar', 'Astım hastaları', 'Aspirin alerjisi olanlar']
  },
  {
    code: 'E104',
    displayName: 'Kinolin Sarısı (E104)',
    aliases: ['Quinoline Yellow'],
    keywords: ['e104', 'kinolin', 'quinoline'],
    category: 'colorant',
    severity: 'MEDIUM',
    shortLabel: 'Hiperaktivite riski',
    warning: 'Sarı boya. AB ürün etiketinde uyarı zorunlu. ABD ve Avustralya gıdalarda yasaklı.',
    source: 'EU 1333/2008',
    sensitiveGroups: ['Çocuklar']
  },
  {
    code: 'E110',
    displayName: 'Gün Batımı Sarısı (E110)',
    aliases: ['Sunset Yellow FCF', 'FD&C Yellow 6'],
    keywords: ['e110', 'sunset yellow', 'gün batımı sarısı', 'orange yellow s'],
    category: 'colorant',
    severity: 'MEDIUM',
    shortLabel: 'Hiperaktivite riski',
    warning: 'Azo boyası. Hiperaktivite ile ilişkili, alerjik reaksiyonlar bildirildi. AB uyarı zorunlu.',
    source: 'EFSA / EU 1333/2008',
    sensitiveGroups: ['Çocuklar', 'Astım hastaları']
  },
  {
    code: 'E122',
    displayName: 'Azorubin (E122)',
    aliases: ['Carmoisine'],
    keywords: ['e122', 'azorubin', 'carmoisine', 'karmoazin'],
    category: 'colorant',
    severity: 'MEDIUM',
    shortLabel: 'Hiperaktivite riski',
    warning: 'Azo boyası. ABD\'de yasaklı. AB uyarı zorunlu, hiperaktivite ve alerji riski.',
    source: 'EU 1333/2008',
    sensitiveGroups: ['Çocuklar']
  },
  {
    code: 'E124',
    displayName: 'Ponceau 4R (E124)',
    aliases: ['Cochineal Red A'],
    keywords: ['e124', 'ponceau', 'cochineal red'],
    category: 'colorant',
    severity: 'MEDIUM',
    shortLabel: 'Hiperaktivite riski',
    warning: 'Kırmızı azo boyası. ABD, Norveç ve Finlandiya\'da yasaklı. AB uyarı zorunlu.',
    source: 'EU 1333/2008',
    sensitiveGroups: ['Çocuklar', 'Astımlılar']
  },
  {
    code: 'E127',
    displayName: 'Eritrosin (E127)',
    aliases: ['Erythrosine', 'FD&C Red 3'],
    keywords: ['e127', 'eritrosin', 'erythrosine'],
    category: 'colorant',
    severity: 'MEDIUM',
    shortLabel: 'Tiroid etkisi',
    warning: 'Yüksek dozda hayvan deneylerinde tiroid tümörü ile ilişkilendirildi. ABD\'de 2024\'te kozmetiklerde yasaklandı.',
    source: 'FDA / EFSA'
  },
  {
    code: 'E129',
    displayName: 'Allura Kırmızısı AC (E129)',
    aliases: ['Allura Red AC', 'FD&C Red 40'],
    keywords: ['e129', 'allura red', 'allura kırmızı'],
    category: 'colorant',
    severity: 'MEDIUM',
    shortLabel: 'Hiperaktivite riski',
    warning: 'Azo boyası. Bazı AB ülkelerinde (Danimarka, Belçika, İsviçre) yasaklı. AB uyarı zorunlu.',
    source: 'EU 1333/2008',
    sensitiveGroups: ['Çocuklar']
  },
  {
    code: 'E150c',
    displayName: 'Amonyak Karamel (E150c)',
    aliases: ['Caramel III'],
    keywords: ['e150c', 'amonyak karamel', 'caramel iii'],
    category: 'colorant',
    severity: 'MEDIUM',
    shortLabel: '4-MEI içerebilir',
    warning: 'Üretim sürecinde 4-metilimidazol (4-MEI) oluşabilir; IARC tarafından "olası kanserojen" (Grup 2B).',
    source: 'IARC Grup 2B'
  },
  {
    code: 'E150d',
    displayName: 'Sülfit-Amonyak Karamel (E150d)',
    aliases: ['Caramel IV'],
    keywords: ['e150d', 'sülfit amonyak karamel', 'caramel iv'],
    category: 'colorant',
    severity: 'MEDIUM',
    shortLabel: '4-MEI içerebilir',
    warning: 'Kola tipi içeceklerde yaygın. 4-MEI oluşumu nedeniyle California Prop 65 listesinde uyarı zorunlu.',
    source: 'IARC Grup 2B / California Prop 65'
  },
  {
    code: 'E171',
    displayName: 'Titanyum Dioksit (E171)',
    aliases: ['Titanium Dioxide'],
    keywords: ['e171', 'titanyum dioksit', 'titanium dioxide'],
    category: 'colorant',
    severity: 'HIGH',
    shortLabel: 'AB tarafından yasaklı',
    warning: 'AB tarafından 2022\'de gıdalarda kullanımı yasaklandı (DNA hasarı endişesi, EFSA güvenli kabul etmedi).',
    source: 'EFSA 2021 / EU 2022/63'
  }
];

// =====================================================================
// 2) KORUYUCULAR
// =====================================================================
const PRESERVATIVES: RiskyAdditive[] = [
  {
    code: 'E210',
    displayName: 'Benzoik Asit (E210)',
    aliases: ['Benzoic Acid'],
    keywords: ['e210', 'benzoik asit', 'benzoic acid'],
    category: 'preservative',
    severity: 'MEDIUM',
    shortLabel: 'C vitamini ile benzen riski',
    warning: 'Askorbik asit (C vitamini) ile birlikte ısı etkisinde benzen (kanserojen) oluşturabilir. Astım tetikleyici.',
    source: 'EFSA',
    sensitiveGroups: ['Astım hastaları']
  },
  {
    code: 'E211',
    displayName: 'Sodyum Benzoat (E211)',
    aliases: ['Sodium Benzoate'],
    keywords: ['e211', 'sodyum benzoat', 'sodium benzoate'],
    category: 'preservative',
    severity: 'MEDIUM',
    shortLabel: 'C vitamini ile benzen riski',
    warning: 'Asitli içeceklerde C vitaminiyle reaksiyona girip benzen oluşturabilir. Hiperaktivite ile ilişkilendirildi.',
    source: 'EFSA',
    sensitiveGroups: ['Çocuklar', 'Astım hastaları']
  },
  {
    code: 'E220',
    displayName: 'Kükürt Dioksit (E220)',
    aliases: ['Sulfur Dioxide'],
    keywords: ['e220', 'kükürt dioksit', 'sulfur dioxide', 'sülfit'],
    category: 'preservative',
    severity: 'MEDIUM',
    shortLabel: 'Astım tetikleyici',
    warning: 'Sülfit grubu. Astımı olanlarda ciddi solunum reaksiyonlarına yol açabilir. AB 10mg/kg üstünde etiket zorunlu.',
    source: 'EFSA / EU 1333/2008',
    sensitiveGroups: ['Astım hastaları', 'Sülfit alerjisi olanlar']
  },
  {
    code: 'E222',
    displayName: 'Sodyum Bisülfit (E222)',
    aliases: ['Sodium Bisulfite'],
    keywords: ['e222', 'sodyum bisülfit'],
    category: 'preservative',
    severity: 'MEDIUM',
    shortLabel: 'Astım tetikleyici',
    warning: 'Sülfit. Astım tetikleyici, B1 vitaminini tahrip edebilir.',
    sensitiveGroups: ['Astım hastaları']
  },
  {
    code: 'E223',
    displayName: 'Sodyum Metabisülfit (E223)',
    aliases: ['Sodium Metabisulfite'],
    keywords: ['e223', 'sodyum metabisülfit'],
    category: 'preservative',
    severity: 'MEDIUM',
    shortLabel: 'Astım tetikleyici',
    warning: 'Kuruyemiş ve şarapta yaygın. Astım hastalarında alerjik reaksiyon riski.',
    sensitiveGroups: ['Astım hastaları']
  },
  {
    code: 'E249',
    displayName: 'Potasyum Nitrit (E249)',
    aliases: ['Potassium Nitrite'],
    keywords: ['e249', 'potasyum nitrit', 'potassium nitrite'],
    category: 'preservative',
    severity: 'HIGH',
    shortLabel: 'Kanserojen risk',
    warning: 'İşlenmiş ette nitrozamin oluşturabilir. IARC işlenmiş etleri Grup 1 kanserojen olarak sınıflandırdı.',
    source: 'IARC Grup 1 (işlenmiş et)'
  },
  {
    code: 'E250',
    displayName: 'Sodyum Nitrit (E250)',
    aliases: ['Sodium Nitrite'],
    keywords: ['e250', 'sodyum nitrit', 'sodium nitrite'],
    category: 'preservative',
    severity: 'HIGH',
    shortLabel: 'Kolorektal kanser riski',
    warning: 'Sucuk, salam, sosis gibi işlenmiş etlerde renklendirici. Pişirildiğinde nitrozamin (kanserojen) oluşturur.',
    source: 'IARC Grup 1 (işlenmiş et)'
  },
  {
    code: 'E251',
    displayName: 'Sodyum Nitrat (E251)',
    aliases: ['Sodium Nitrate'],
    keywords: ['e251', 'sodyum nitrat', 'sodium nitrate'],
    category: 'preservative',
    severity: 'HIGH',
    shortLabel: 'Kanserojen risk',
    warning: 'Vücutta nitrite dönüşür ve nitrozamin oluşturabilir. Bebek mamalarında AB yasağı vardır.',
    source: 'IARC',
    sensitiveGroups: ['Bebekler', 'Hamileler']
  },
  {
    code: 'E252',
    displayName: 'Potasyum Nitrat (E252)',
    aliases: ['Potassium Nitrate', 'Saltpeter'],
    keywords: ['e252', 'potasyum nitrat', 'potassium nitrate'],
    category: 'preservative',
    severity: 'HIGH',
    shortLabel: 'Kanserojen risk',
    warning: 'Kürlenmiş et ürünlerinde. Nitrozamin oluşumu nedeniyle bebek beslenmesinde yasaktır.',
    source: 'EFSA',
    sensitiveGroups: ['Bebekler']
  },
  {
    code: 'E320',
    displayName: 'BHA — Bütillenmiş Hidroksianisol (E320)',
    aliases: ['BHA', 'Butylated Hydroxyanisole'],
    keywords: ['e320', 'bha', 'bütillenmiş hidroksianisol', 'butylated hydroxyanisole'],
    category: 'preservative',
    severity: 'HIGH',
    shortLabel: 'Olası kanserojen (IARC 2B)',
    warning: 'IARC tarafından "insanda olası kanserojen" (Grup 2B). Japonya\'da 1982\'de yasaklandı; ABD California Prop 65 listesinde.',
    source: 'IARC Grup 2B'
  },
  {
    code: 'E321',
    displayName: 'BHT — Bütillenmiş Hidroksitoluen (E321)',
    aliases: ['BHT', 'Butylated Hydroxytoluene'],
    keywords: ['e321', 'bht', 'bütillenmiş hidroksitoluen', 'butylated hydroxytoluene'],
    category: 'preservative',
    severity: 'MEDIUM',
    shortLabel: 'Şüpheli endokrin bozucu',
    warning: 'BHA ile yakın benzer. Endokrin bozucu özellikleri tartışmalı. AB 100 mg/kg sınırı.',
    source: 'EFSA'
  }
];

// =====================================================================
// 3) TATLANDIRICILAR (Yapay)
// =====================================================================
const SWEETENERS: RiskyAdditive[] = [
  {
    code: 'E951',
    displayName: 'Aspartam (E951)',
    aliases: ['Aspartame', 'NutraSweet'],
    keywords: ['e951', 'aspartam', 'aspartame'],
    category: 'sweetener',
    severity: 'HIGH',
    shortLabel: 'Olası kanserojen (IARC 2B, 2023)',
    warning: 'IARC tarafından Temmuz 2023\'te "insanda olası kanserojen" (Grup 2B) sınıflandırıldı. Fenilketonüri (PKU) hastaları için tehlikelidir.',
    source: 'IARC Grup 2B (2023) / WHO',
    sensitiveGroups: ['PKU hastaları', 'Hamileler']
  },
  {
    code: 'E952',
    displayName: 'Siklamat (E952)',
    aliases: ['Cyclamate'],
    keywords: ['e952', 'siklamat', 'cyclamate'],
    category: 'sweetener',
    severity: 'HIGH',
    shortLabel: 'ABD\'de yasaklı',
    warning: 'ABD\'de 1969\'dan beri yasaklı (mesane kanseri şüphesi). AB ve Türkiye\'de izinli ama sınırlı.',
    source: 'FDA Ban / EFSA'
  },
  {
    code: 'E954',
    displayName: 'Sakarin (E954)',
    aliases: ['Saccharin'],
    keywords: ['e954', 'sakarin', 'saccharin'],
    category: 'sweetener',
    severity: 'MEDIUM',
    shortLabel: 'Mesane sorunu (eski araştırma)',
    warning: 'Eski hayvan deneylerinde mesane tümörü ile ilişkilendirildi (sonra geri çekildi). Hassas kullanım önerilir.',
    source: 'NTP (delisted 2000)'
  },
  {
    code: 'E955',
    displayName: 'Sukraloz (E955)',
    aliases: ['Sucralose', 'Splenda'],
    keywords: ['e955', 'sukraloz', 'sucralose'],
    category: 'sweetener',
    severity: 'MEDIUM',
    shortLabel: 'Yüksek sıcaklıkta zararlı',
    warning: '120°C üstünde kloropropanol türevleri (potansiyel kanserojen) oluşturabilir. Pişirilen ürünlerde dikkat.',
    source: 'EFSA 2023 değerlendirmesi'
  }
];

// =====================================================================
// 4) TAT ARTIRICILAR
// =====================================================================
const FLAVOR_ENHANCERS: RiskyAdditive[] = [
  {
    code: 'E621',
    displayName: 'Monosodyum Glutamat — MSG (E621)',
    aliases: ['MSG', 'Monosodium Glutamate', 'Çin Tuzu'],
    keywords: ['e621', 'msg', 'monosodyum glutamat', 'monosodium glutamate', 'çin tuzu'],
    category: 'flavor_enhancer',
    severity: 'LOW',
    shortLabel: 'Hassas kişilerde baş ağrısı',
    warning: 'Hassas bireylerde "MSG semptom kompleksi" (baş ağrısı, terleme, çarpıntı). EFSA 30 mg/kg vücut ağırlığı limit önerdi (2017).',
    source: 'EFSA 2017',
    sensitiveGroups: ['Migren hastaları']
  },
  {
    code: 'E627',
    displayName: 'Disodyum Guanilat (E627)',
    aliases: ['Disodium Guanylate'],
    keywords: ['e627', 'disodyum guanilat', 'disodium guanylate'],
    category: 'flavor_enhancer',
    severity: 'LOW',
    shortLabel: 'Gut hastaları için riskli',
    warning: 'Pürin türevi. Gut ve böbrek taşı olanlarda dikkatle tüketilmeli. Genelde MSG ile birlikte kullanılır.',
    sensitiveGroups: ['Gut hastaları']
  },
  {
    code: 'E631',
    displayName: 'Disodyum İnozinat (E631)',
    aliases: ['Disodium Inosinate'],
    keywords: ['e631', 'disodyum inozinat', 'disodium inosinate'],
    category: 'flavor_enhancer',
    severity: 'LOW',
    shortLabel: 'Gut hastaları için riskli',
    warning: 'Pürin türevi. Gut hastaları kaçınmalı. Genelde et/balık kaynaklı (vegan/vejetaryen uyarı).',
    sensitiveGroups: ['Gut hastaları', 'Vegan / Vejetaryen']
  }
];

// =====================================================================
// 5) EMÜLGATÖR / KIVAMLAŞTIRICI (tartışmalı)
// =====================================================================
const EMULSIFIERS: RiskyAdditive[] = [
  {
    code: 'E407',
    displayName: 'Karagenan (E407)',
    aliases: ['Carrageenan'],
    keywords: ['e407', 'karagenan', 'carrageenan'],
    category: 'emulsifier',
    severity: 'MEDIUM',
    shortLabel: 'Bağırsak iltihabı tartışması',
    warning: 'Hayvan deneylerinde bağırsak iltihabı ile ilişkilendirildi. Bebek mamalarında AB tarafından yasaklı.',
    source: 'EFSA / EU',
    sensitiveGroups: ['Bebekler', 'IBS hastaları']
  },
  {
    code: 'E433',
    displayName: 'Polisorbat 80 (E433)',
    aliases: ['Polysorbate 80'],
    keywords: ['e433', 'polisorbat', 'polysorbate'],
    category: 'emulsifier',
    severity: 'LOW',
    shortLabel: 'Mikrobiyom etkisi',
    warning: 'Hayvan çalışmalarında bağırsak mikrobiyomunu olumsuz etkilediği gösterildi (Nature 2015).',
    sensitiveGroups: ['Bağırsak hastalığı olanlar']
  },
  {
    code: 'E466',
    displayName: 'Karboksimetil Selüloz — CMC (E466)',
    aliases: ['CMC', 'Carboxymethyl Cellulose'],
    keywords: ['e466', 'cmc', 'karboksimetil selüloz', 'carboxymethyl cellulose'],
    category: 'emulsifier',
    severity: 'LOW',
    shortLabel: 'Mikrobiyom etkisi',
    warning: 'İnsan çalışmalarında (2022) bağırsak mikrobiyomunda olumsuz değişikliklere yol açtığı bulundu.',
    sensitiveGroups: ['IBS hastaları']
  }
];

// =====================================================================
// 6) ZARARLI YAĞ TÜRLERİ (E-kodu olmayan)
// =====================================================================
const FATS: RiskyAdditive[] = [
  {
    code: 'TRANS_FAT',
    displayName: 'Trans Yağlar',
    aliases: ['Hidrojenize yağ', 'Kısmen hidrojenize yağ'],
    keywords: [
      'trans yağ', 'trans-yağ', 'trans fat',
      'hidrojenize', 'hydrogenated',
      'kısmen hidrojenize', 'partially hydrogenated',
      'margarin'
    ],
    category: 'fat',
    severity: 'HIGH',
    shortLabel: 'Kalp-damar riski',
    warning: 'Dünya Sağlık Örgütü\'nün 2023 itibarıyla küresel olarak gıdalardan kaldırılmasını önerdiği yağ türü. Kötü kolesterolü yükseltir, kalp krizi riskini artırır.',
    source: 'WHO REPLACE / FDA Ban (2018)'
  },
  {
    code: 'PALM_OIL',
    displayName: 'Palm Yağı',
    aliases: ['Palm Olein', 'Palmiye Yağı'],
    keywords: ['palm yağ', 'palmiye yağ', 'palm oil', 'palm olein', 'palmolein'],
    category: 'fat',
    severity: 'LOW',
    shortLabel: 'Doymuş yağ + kontaminantlar',
    warning: 'Yüksek doymuş yağ. Rafine edildiğinde glisidil esterleri (potansiyel kanserojen) içerebilir; EFSA 2018\'de bebek formülünde sınır getirdi.',
    source: 'EFSA 2018'
  }
];

// =====================================================================
// 7) ŞEKER TÜRLERİ
// =====================================================================
const SUGARS: RiskyAdditive[] = [
  {
    code: 'HFCS',
    displayName: 'Yüksek Fruktozlu Mısır Şurubu',
    aliases: ['HFCS', 'Glukoz-Fruktoz Şurubu', 'Mısır Şurubu'],
    keywords: [
      'yüksek fruktozlu mısır şurubu', 'hfcs',
      'glukoz-fruktoz şurubu', 'glukoz fruktoz şurup',
      'glucose-fructose syrup', 'high fructose corn syrup',
      'mısır şurubu', 'corn syrup'
    ],
    category: 'sugar',
    severity: 'MEDIUM',
    shortLabel: 'Obezite ve diyabet riski',
    warning: 'Tip 2 diyabet, karaciğer yağlanması ve obezite ile en güçlü ilişkilendirilen tatlandırıcı. AB\'de "izoglukoz" olarak da geçer.',
    source: 'WHO / Lancet meta-analizleri'
  }
];

// =====================================================================
// Genel liste (tek dizide birleştirilmiş)
// =====================================================================
export const RISKY_ADDITIVES: RiskyAdditive[] = [
  ...COLORANTS,
  ...PRESERVATIVES,
  ...SWEETENERS,
  ...FLAVOR_ENHANCERS,
  ...EMULSIFIERS,
  ...FATS,
  ...SUGARS
];

// =====================================================================
// Tarama fonksiyonu — bir gıda nesnesinde risk maddelerini bul
// =====================================================================
export interface DetectedRisk {
  code: string;
  name: string;
  category: AdditiveCategory;
  severity: AdditiveSeverity;
  shortLabel: string;
  warning: string;
  source?: string;
  sensitiveGroups?: string[];
}

/**
 * Bir gıdanın eCodes ve ingredients alanlarında zararlı/şüpheli maddeleri arar.
 * Aynı maddeyi (E-kod + isim) iki kez döndürmez.
 */
export const detectRiskyAdditives = (
  eCodes: string[] = [],
  ingredients: string[] = []
): DetectedRisk[] => {
  const detected = new Map<string, DetectedRisk>();

  // Normalize: E-kodları küçük harf
  const eCodesLower = (eCodes || []).map(c => (c || '').trim().toLowerCase());

  // Normalize: ingredients tek metin
  const ingredientsText = (ingredients || [])
    .map(i => (i || '').toLowerCase())
    .join(' | ');

  for (const additive of RISKY_ADDITIVES) {
    let match = false;

    // 1) E-kod direkt eşleşmesi
    const codeLower = additive.code.toLowerCase();
    if (codeLower.startsWith('e') && eCodesLower.includes(codeLower)) {
      match = true;
    }

    // 2) Anahtar kelime bazlı içindekiler taraması (sınır: kelime/ifade içerme)
    if (!match) {
      for (const kw of additive.keywords) {
        if (!kw) continue;
        const k = kw.toLowerCase();
        if (ingredientsText.includes(k)) {
          match = true;
          break;
        }
      }
    }

    if (match && !detected.has(additive.code)) {
      detected.set(additive.code, {
        code: additive.code,
        name: additive.displayName,
        category: additive.category,
        severity: additive.severity,
        shortLabel: additive.shortLabel,
        warning: additive.warning,
        source: additive.source,
        sensitiveGroups: additive.sensitiveGroups
      });
    }
  }

  // Severity'ye göre sırala: HIGH > MEDIUM > LOW
  const order: Record<AdditiveSeverity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return Array.from(detected.values()).sort((a, b) => order[a.severity] - order[b.severity]);
};

// Risk seviyesini uygulamanın genel RiskLevel'ine yükselten yardımcı
export const escalateRiskLevel = (
  current: 'LOW' | 'MEDIUM' | 'HIGH',
  risks: DetectedRisk[]
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (current === 'HIGH') return 'HIGH';
  const hasHigh = risks.some(r => r.severity === 'HIGH');
  if (hasHigh) return 'HIGH';
  const hasMedium = risks.some(r => r.severity === 'MEDIUM');
  if (hasMedium && current === 'LOW') return 'MEDIUM';
  return current;
};
