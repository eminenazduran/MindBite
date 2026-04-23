// Türkçe doğal dil öğün açıklamalarını parçalayıp miktar/birim/ürüne çeviren yardımcı.
// Örn: "3 yk yoğurt, 1 kase çorba ve 2 dilim ekmek"
// →
// [
//   { raw: "3 yk yoğurt", quantity: 3, unit: "yemek_kasigi", grams: 36, query: "yoğurt" },
//   { raw: "1 kase çorba", quantity: 1, unit: "kase", grams: 220, query: "çorba" },
//   { raw: "2 dilim ekmek", quantity: 2, unit: "dilim", grams: 60, query: "ekmek" }
// ]

export type UnitKey =
    | 'yemek_kasigi'
    | 'tatli_kasigi'
    | 'cay_kasigi'
    | 'kase'
    | 'tabak'
    | 'su_bardagi'
    | 'cay_bardagi'
    | 'dilim'
    | 'adet'
    | 'avuc'
    | 'porsiyon'
    | 'gram'
    | 'mililitre';

export interface ParsedMealItem {
    raw: string;
    quantity: number;
    unit: UnitKey;
    grams: number;
    query: string;
}

const UNIT_ALIASES: Array<{ aliases: string[]; unit: UnitKey }> = [
    { aliases: ['yemek kaşığı', 'yemek kasigi', 'yk'], unit: 'yemek_kasigi' },
    { aliases: ['tatlı kaşığı', 'tatli kasigi', 'tk'], unit: 'tatli_kasigi' },
    { aliases: ['çay kaşığı', 'cay kasigi', 'çk', 'ck'], unit: 'cay_kasigi' },
    { aliases: ['kase'], unit: 'kase' },
    { aliases: ['tabak'], unit: 'tabak' },
    { aliases: ['su bardağı', 'su bardagi'], unit: 'su_bardagi' },
    { aliases: ['çay bardağı', 'cay bardagi'], unit: 'cay_bardagi' },
    { aliases: ['bardak'], unit: 'su_bardagi' },
    { aliases: ['dilim'], unit: 'dilim' },
    { aliases: ['adet', 'tane'], unit: 'adet' },
    { aliases: ['avuç', 'avuc'], unit: 'avuc' },
    { aliases: ['porsiyon'], unit: 'porsiyon' },
    { aliases: ['gram', 'gr', 'g'], unit: 'gram' },
    { aliases: ['mililitre', 'ml'], unit: 'mililitre' }
];

const UNIT_GRAMS: Record<UnitKey, number> = {
    yemek_kasigi: 12,
    tatli_kasigi: 6,
    cay_kasigi: 3,
    kase: 220,
    tabak: 250,
    su_bardagi: 200,
    cay_bardagi: 100,
    dilim: 30,
    adet: 60,
    avuc: 28,
    porsiyon: 180,
    gram: 1,
    mililitre: 1
};

// Türkçe karakter duyarsız normalize etme (arama için)
const toAscii = (text: string): string =>
    text
        .toLocaleLowerCase('tr-TR')
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u');

// Cümleyi virgül / "ve" / "+" üzerinden ayırıp her öğeyi tek bir yemek kalemi olarak al.
const splitIntoSegments = (description: string): string[] =>
    description
        .split(/,|\bve\b|\+|\n/gi)
        .map((s) => s.trim())
        .filter(Boolean);

const MULTIWORD_ALIASES = UNIT_ALIASES
    .flatMap(({ aliases, unit }) => aliases.map((alias) => ({ alias, aliasAscii: toAscii(alias), unit })))
    .sort((a, b) => b.aliasAscii.length - a.aliasAscii.length); // uzun olanlar önce eşleşsin

const extractQuantity = (segment: string): { quantity: number; rest: string } => {
    const match = segment.match(/^\s*(\d+(?:[.,]\d+)?)\s*(.*)$/);
    if (!match) return { quantity: 1, rest: segment.trim() };

    const qty = Number(match[1].replace(',', '.'));
    return {
        quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
        rest: (match[2] || '').trim()
    };
};

const extractUnit = (rest: string): { unit: UnitKey; query: string } => {
    const restAscii = ' ' + toAscii(rest) + ' ';

    for (const { aliasAscii, unit } of MULTIWORD_ALIASES) {
        const needle = ' ' + aliasAscii + ' ';
        const idx = restAscii.indexOf(needle);
        if (idx !== -1) {
            // Orijinal metinden kelime bazlı temizle
            const words = rest.split(/\s+/);
            const aliasWordCount = aliasAscii.split(' ').length;

            for (let i = 0; i <= words.length - aliasWordCount; i++) {
                const slice = words.slice(i, i + aliasWordCount).join(' ');
                if (toAscii(slice) === aliasAscii) {
                    const query = [...words.slice(0, i), ...words.slice(i + aliasWordCount)]
                        .join(' ')
                        .trim();
                    return { unit, query: query || rest };
                }
            }
        }
    }

    return { unit: 'porsiyon', query: rest };
};

export const parseMealDescription = (description: string): ParsedMealItem[] => {
    const segments = splitIntoSegments(description);
    const items: ParsedMealItem[] = [];

    for (const segment of segments) {
        const { quantity, rest } = extractQuantity(segment);
        const { unit, query } = extractUnit(rest);

        const normalizedQuery = query.replace(/\s+/g, ' ').trim();
        if (!normalizedQuery) continue;

        const grams = Math.max(1, Math.round(UNIT_GRAMS[unit] * quantity));

        items.push({
            raw: segment,
            quantity,
            unit,
            grams,
            query: normalizedQuery
        });
    }

    return items;
};

export const gramsFor = (unit: UnitKey, quantity: number): number =>
    Math.max(1, Math.round(UNIT_GRAMS[unit] * quantity));

// Gıdaya-özel porsiyon gramajı verildiyse onu kullan, yoksa generic değere düş.
export const resolveGrams = (
    unit: UnitKey,
    quantity: number,
    foodPortions?: Partial<Record<UnitKey, number>>
): number => {
    const perUnit = foodPortions?.[unit] ?? UNIT_GRAMS[unit];
    return Math.max(1, Math.round(perUnit * quantity));
};
