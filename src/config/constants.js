// Uygulama sabitleri - DRY prensibi için merkezi tanımlama

// Merkezi versiyon bilgisi
export const APP_VERSION = '0.5.3';
export const APP_VERSION_CODE = 12;
export const APP_NAME = 'praytime@erho.dev';
export const APP_USER_AGENT = `${APP_NAME}/${APP_VERSION}`;
export const APP_DEVELOPER = '@erhanurgun';
export const APP_WEBSITE = 'https://erho.me';

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

// Türkiye illeri listesi (81 il) - Alfabetik sıralı
// ID'ler Diyanet API'sinden alınmıştır
export const TURKEY_CITIES = [
    { id: 9146, name: 'Adana' },
    { id: 9158, name: 'Adıyaman' },
    { id: 9167, name: 'Afyonkarahisar' },
    { id: 9185, name: 'Ağrı' },
    { id: 9193, name: 'Aksaray' },
    { id: 9198, name: 'Amasya' },
    { id: 9206, name: 'Ankara' },
    { id: 9225, name: 'Antalya' },
    { id: 9246, name: 'Ardahan' },
    { id: 9252, name: 'Artvin' },
    { id: 9261, name: 'Aydın' },
    { id: 9278, name: 'Balıkesir' },
    { id: 9298, name: 'Bartın' },
    { id: 9303, name: 'Batman' },
    { id: 9311, name: 'Bayburt' },
    { id: 9315, name: 'Bilecik' },
    { id: 9327, name: 'Bingöl' },
    { id: 9335, name: 'Bitlis' },
    { id: 9343, name: 'Bolu' },
    { id: 9352, name: 'Burdur' },
    { id: 9363, name: 'Bursa' },
    { id: 9381, name: 'Çanakkale' },
    { id: 9392, name: 'Çankırı' },
    { id: 9402, name: 'Çorum' },
    { id: 9417, name: 'Denizli' },
    { id: 9432, name: 'Diyarbakır' },
    { id: 9450, name: 'Düzce' },
    { id: 9458, name: 'Edirne' },
    { id: 9466, name: 'Elazığ' },
    { id: 9479, name: 'Erzincan' },
    { id: 9488, name: 'Erzurum' },
    { id: 9508, name: 'Eskişehir' },
    { id: 9520, name: 'Gaziantep' },
    { id: 9531, name: 'Giresun' },
    { id: 9548, name: 'Gümüşhane' },
    { id: 9556, name: 'Hakkari' },
    { id: 9561, name: 'Hatay' },
    { id: 9577, name: 'Iğdır' },
    { id: 9581, name: 'Isparta' },
    { id: 9594, name: 'İstanbul' },
    { id: 9635, name: 'İzmir' },
    { id: 9667, name: 'Kahramanmaraş' },
    { id: 9679, name: 'Karabük' },
    { id: 9686, name: 'Karaman' },
    { id: 9693, name: 'Kars' },
    { id: 9702, name: 'Kastamonu' },
    { id: 9717, name: 'Kayseri' },
    { id: 9733, name: 'Kırıkkale' },
    { id: 9743, name: 'Kırklareli' },
    { id: 9752, name: 'Kırşehir' },
    { id: 9761, name: 'Kilis' },
    { id: 9765, name: 'Kocaeli' },
    { id: 9778, name: 'Konya' },
    { id: 9810, name: 'Kütahya' },
    { id: 9824, name: 'Malatya' },
    { id: 9838, name: 'Manisa' },
    { id: 9855, name: 'Mardin' },
    { id: 9866, name: 'Mersin' },
    { id: 9880, name: 'Muğla' },
    { id: 9894, name: 'Muş' },
    { id: 9901, name: 'Nevşehir' },
    { id: 9910, name: 'Niğde' },
    { id: 9918, name: 'Ordu' },
    { id: 9934, name: 'Osmaniye' },
    { id: 9941, name: 'Rize' },
    { id: 9954, name: 'Sakarya' },
    { id: 9971, name: 'Samsun' },
    { id: 9989, name: 'Şanlıurfa' },
    { id: 10003, name: 'Siirt' },
    { id: 10012, name: 'Sinop' },
    { id: 10021, name: 'Sivas' },
    { id: 10039, name: 'Şırnak' },
    { id: 10047, name: 'Tekirdağ' },
    { id: 10059, name: 'Tokat' },
    { id: 10073, name: 'Trabzon' },
    { id: 10091, name: 'Tunceli' },
    { id: 10100, name: 'Uşak' },
    { id: 10107, name: 'Van' },
    { id: 10121, name: 'Yalova' },
    { id: 10127, name: 'Yozgat' },
    { id: 10142, name: 'Zonguldak' },
];

// İl adından ID bul
export function getCityIdByName(name) {
    const city = TURKEY_CITIES.find(c => c.name === name);
    return city ? city.id : null;
}

// ID'den il adı bul
export function getCityNameById(id) {
    const city = TURKEY_CITIES.find(c => c.id === id);
    return city ? city.name : null;
}

// ID'den il index'i bul
export function getCityIndexById(id) {
    return TURKEY_CITIES.findIndex(c => c.id === id);
}
