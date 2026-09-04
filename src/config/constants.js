// Uygulama sabitleri - DRY prensibi için merkezi tanımlama

// Merkezi versiyon bilgisi
export const APP_VERSION = '0.9.2';
export const APP_VERSION_CODE = 24;
export const APP_NAME = 'praytime@erho.dev';
export const APP_USER_AGENT = `${APP_NAME}/${APP_VERSION}`;
export const APP_DEVELOPER = '@erhanurgun';
export const APP_WEBSITE = 'https://erho.me';

export const API_BASE_URL = 'https://api.aladhan.com';

// xgettext string işaretleme - modül yükleme zamanında güvenli
const N_ = (s) => s;

// Namaz vakitleri - id sabit tanımlayıcı, name çevrilecek display adı, apiKey API eşleme
export const PRAYER_NAMES = [
    { id: 'imsak',   name: N_('İmsak'),   nameEn: 'Imsak',   apiKey: 'Fajr' },
    { id: 'gunes',   name: N_('Güneş'),   nameEn: 'Sunrise',  apiKey: 'Sunrise' },
    { id: 'ogle',    name: N_('Öğle'),    nameEn: 'Dhuhr',    apiKey: 'Dhuhr' },
    { id: 'ikindi',  name: N_('İkindi'),  nameEn: 'Asr',      apiKey: 'Asr' },
    { id: 'aksam',   name: N_('Akşam'),   nameEn: 'Maghrib',  apiKey: 'Maghrib' },
    { id: 'yatsi',   name: N_('Yatsı'),   nameEn: 'Isha',     apiKey: 'Isha' },
];

// Panel konumları
export const PANEL_POSITIONS = {
    values: ['left', 'center', 'right'],
    labels: [N_('Sol'), N_('Orta'), N_('Sağ')],
};

// Konum modları
export const LOCATION_MODES = {
    values: ['city', 'coordinates'],
    labels: [N_('Şehir/Ülke'), N_('Enlem/Boylam')],
};

// Hesaplama metotları (Aladhan API)
export const CALCULATION_METHODS = [
    { id: 0,  name: 'Shia Ithna-Ashari, Leva Institute, Qum' },
    { id: 1,  name: 'University of Islamic Sciences, Karachi' },
    { id: 2,  name: 'Islamic Society of North America (ISNA)' },
    { id: 3,  name: 'Muslim World League (MWL)' },
    { id: 4,  name: 'Umm Al-Qura University, Makkah' },
    { id: 5,  name: 'Egyptian General Authority of Survey' },
    { id: 7,  name: 'Institute of Geophysics, University of Tehran' },
    { id: 8,  name: 'Gulf Region' },
    { id: 9,  name: 'Kuwait' },
    { id: 10, name: 'Qatar' },
    { id: 11, name: 'Majlis Ugama Islam Singapura' },
    { id: 12, name: 'Union Organization Islamic de France' },
    { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey' },
    { id: 14, name: 'Spiritual Administration of Muslims of Russia' },
    { id: 15, name: 'Moonsighting Committee Worldwide' },
    { id: 16, name: 'Dubai' },
    { id: 17, name: 'JAKIM, Malaysia' },
    { id: 18, name: 'Tunisia' },
    { id: 19, name: 'Algeria' },
    { id: 20, name: 'Indonesia (KEMENAG)' },
    { id: 21, name: 'Morocco' },
    { id: 22, name: 'Comunidade Islamica de Lisboa' },
    { id: 23, name: 'Ministry of Awqaf, Jordan' },
    { id: 99, name: 'Custom' },
];

// Hata kodları - dahili sabitler, çeviriye tabi tutulmaz
export const ERROR_CODES = {
    INVALID_LOCATION: 'INVALID_LOCATION',
};

// Konum validasyon durumları - GSettings üzerinden prefs.js ↔ extension.js iletişimi
export const LOCATION_STATUS = {
    UNKNOWN: 'unknown',
    VALID: 'valid',
    INVALID_COUNTRY: 'invalid_country',
    INVALID_CITY: 'invalid_city',
    EMPTY_COUNTRY: 'empty_country',
    EMPTY_CITY: 'empty_city',
    NETWORK_ERROR: 'network_error',
    API_ERROR: 'api_error',
};

// Yardımcı fonksiyonlar
export function getPrayerNamesList() {
    return PRAYER_NAMES.map(p => p.name);
}

export function getPrayerApiKeyMap() {
    const map = {};
    for (const p of PRAYER_NAMES) {
        map[p.id] = p.apiKey;
    }
    return map;
}

// id üzerinden namaz bilgisi bul
export function getPrayerById(id) {
    return PRAYER_NAMES.find(p => p.id === id) || null;
}

// Mapping index dönüşümü için yardımcı
export function getIndexFromValue(mapping, value) {
    const index = mapping.values.indexOf(value);
    return index >= 0 ? index : 0;
}

export function getValueFromIndex(mapping, index) {
    return mapping.values[index] || mapping.values[0];
}

// Hesaplama metodu yardımcıları
export function getCalculationMethodIndex(methodId) {
    return CALCULATION_METHODS.findIndex(m => m.id === methodId);
}

export function getCalculationMethodById(index) {
    return CALCULATION_METHODS[index] || CALCULATION_METHODS.find(m => m.id === 13);
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
