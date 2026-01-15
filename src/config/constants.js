// Uygulama sabitleri - DRY prensibi için merkezi tanımlama

export const API_BASE_URL = 'https://prayertimes.api.abdus.dev';

// Namaz vakitleri - Türkçe isim, İngilizce isim ve API key eşleşmesi
export const PRAYER_NAMES = [
    { name: 'İmsak', nameEn: 'Imsak', apiKey: 'fajr' },
    { name: 'Güneş', nameEn: 'Sunrise', apiKey: 'sun' },
    { name: 'Öğle', nameEn: 'Dhuhr', apiKey: 'dhuhr' },
    { name: 'İkindi', nameEn: 'Asr', apiKey: 'asr' },
    { name: 'Akşam', nameEn: 'Maghrib', apiKey: 'maghrib' },
    { name: 'Yatsı', nameEn: 'Isha', apiKey: 'isha' },
];

// Görünüm modları
export const DISPLAY_MODES = {
    values: ['text', 'icon', 'compact'],
    labels: ['Tam Metin', 'Sadece İkon', 'Kompakt'],
};

// Panel konumları
export const PANEL_POSITIONS = {
    values: ['left', 'center', 'right'],
    labels: ['Sol', 'Orta', 'Sağ'],
};

// Yardımcı fonksiyonlar
export function getPrayerNamesList() {
    return PRAYER_NAMES.map(p => p.name);
}

export function getPrayerApiKeyMap() {
    const map = {};
    for (const p of PRAYER_NAMES) {
        map[p.name] = p.apiKey;
    }
    return map;
}

// Mapping index dönüşümü için yardımcı
export function getIndexFromValue(mapping, value) {
    const index = mapping.values.indexOf(value);
    return index >= 0 ? index : 0;
}

export function getValueFromIndex(mapping, index) {
    return mapping.values[index] || mapping.values[0];
}
