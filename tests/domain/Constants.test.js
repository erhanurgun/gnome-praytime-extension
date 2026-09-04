// Constants birim testleri
// TURKEY_CITIES, PRAYER_NAMES, CALCULATION_METHODS, LOCATION_MODES, ERROR_CODES ve yardımcı fonksiyonlar

// Constants'tan kopyalanan değerler (test için bağımsız)
const APP_VERSION = '0.9.2';
const APP_VERSION_CODE = 24;
const APP_NAME = 'praytime@erho.dev';
const APP_USER_AGENT = `${APP_NAME}/${APP_VERSION}`;
const APP_DEVELOPER = '@erhanurgun';
const APP_WEBSITE = 'https://erho.me';

const N_ = (s) => s;

const PRAYER_NAMES = [
    { id: 'imsak',   name: N_('İmsak'),   nameEn: 'Imsak',   apiKey: 'Fajr' },
    { id: 'gunes',   name: N_('Güneş'),   nameEn: 'Sunrise',  apiKey: 'Sunrise' },
    { id: 'ogle',    name: N_('Öğle'),    nameEn: 'Dhuhr',    apiKey: 'Dhuhr' },
    { id: 'ikindi',  name: N_('İkindi'),  nameEn: 'Asr',      apiKey: 'Asr' },
    { id: 'aksam',   name: N_('Akşam'),   nameEn: 'Maghrib',  apiKey: 'Maghrib' },
    { id: 'yatsi',   name: N_('Yatsı'),   nameEn: 'Isha',     apiKey: 'Isha' },
];

const PANEL_POSITIONS = {
    values: ['left', 'center', 'right'],
    labels: [N_('Sol'), N_('Orta'), N_('Sağ')],
};

const LOCATION_MODES = {
    values: ['city', 'coordinates'],
    labels: [N_('Şehir/Ülke'), N_('Enlem/Boylam')],
};

const CALCULATION_METHODS = [
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

const ERROR_CODES = {
    INVALID_LOCATION: 'INVALID_LOCATION',
};

const LOCATION_STATUS = {
    UNKNOWN: 'unknown',
    VALID: 'valid',
    INVALID_COUNTRY: 'invalid_country',
    INVALID_CITY: 'invalid_city',
    EMPTY_COUNTRY: 'empty_country',
    EMPTY_CITY: 'empty_city',
    NETWORK_ERROR: 'network_error',
    API_ERROR: 'api_error',
};

const TURKEY_CITIES = [
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

// Yardımcı fonksiyonlar
function getCityIdByName(name) {
    const city = TURKEY_CITIES.find(c => c.name === name);
    return city ? city.id : null;
}

function getCityNameById(id) {
    const city = TURKEY_CITIES.find(c => c.id === id);
    return city ? city.name : null;
}

function getCityIndexById(id) {
    return TURKEY_CITIES.findIndex(c => c.id === id);
}

function getPrayerById(id) {
    return PRAYER_NAMES.find(p => p.id === id) || null;
}

function getPrayerApiKeyMap() {
    const map = {};
    for (const p of PRAYER_NAMES) {
        map[p.id] = p.apiKey;
    }
    return map;
}

function getIndexFromValue(mapping, value) {
    const index = mapping.values.indexOf(value);
    return index >= 0 ? index : 0;
}

function getValueFromIndex(mapping, index) {
    return mapping.values[index] || mapping.values[0];
}

function getCalculationMethodIndex(methodId) {
    return CALCULATION_METHODS.findIndex(m => m.id === methodId);
}

function getCalculationMethodById(index) {
    return CALCULATION_METHODS[index] || CALCULATION_METHODS.find(m => m.id === 13);
}

// Test yardımcısı
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  [BAŞARILI] ${message}`);
        passedTests++;
    } else {
        console.log(`  [HATALI] ${message}`);
        failedTests++;
    }
}

function assertEqual(actual, expected, message) {
    const passed = actual === expected;
    if (passed) {
        console.log(`  [BAŞARILI] ${message}`);
        passedTests++;
    } else {
        console.log(`  [HATALI] ${message}`);
        console.log(`    Beklenen: ${expected}`);
        console.log(`    Gerçek: ${actual}`);
        failedTests++;
    }
}

// Testler
console.log('\n=== Constants Testleri ===\n');

// Test 1: Versiyon sabitleri
console.log('1. Versiyon Sabitleri:');
assertEqual(APP_VERSION, '0.9.2', 'APP_VERSION doğru');
assertEqual(APP_VERSION_CODE, 24, 'APP_VERSION_CODE doğru');
assertEqual(APP_NAME, 'praytime@erho.dev', 'APP_NAME doğru');
assertEqual(APP_USER_AGENT, 'praytime@erho.dev/0.9.2', 'APP_USER_AGENT doğru format');
assertEqual(APP_DEVELOPER, '@erhanurgun', 'APP_DEVELOPER doğru');
assertEqual(APP_WEBSITE, 'https://erho.me', 'APP_WEBSITE doğru');

// Test 2: Türkiye illeri listesi
console.log('\n2. Türkiye İlleri Listesi:');
assertEqual(TURKEY_CITIES.length, 81, '81 il mevcut');
assertEqual(TURKEY_CITIES[0].name, 'Adana', 'İlk il Adana');
assertEqual(TURKEY_CITIES[80].name, 'Zonguldak', 'Son il Zonguldak');

// Test 3: getCityIdByName fonksiyonu
console.log('\n3. getCityIdByName Testleri:');
assertEqual(getCityIdByName('Ankara'), 9206, 'Ankara ID doğru');
assertEqual(getCityIdByName('İstanbul'), 9594, 'İstanbul ID doğru');
assertEqual(getCityIdByName('İzmir'), 9635, 'İzmir ID doğru');
assertEqual(getCityIdByName('Ağrı'), 9185, 'Ağrı ID doğru (varsayılan konum)');
assertEqual(getCityIdByName('BilinmeyenŞehir'), null, 'Bilinmeyen şehir null döner');
assertEqual(getCityIdByName(null), null, 'null parametre null döner');
assertEqual(getCityIdByName(''), null, 'Boş string null döner');

// Test 4: getCityNameById fonksiyonu
console.log('\n4. getCityNameById Testleri:');
assertEqual(getCityNameById(9206), 'Ankara', 'ID 9206 Ankara');
assertEqual(getCityNameById(9594), 'İstanbul', 'ID 9594 İstanbul');
assertEqual(getCityNameById(9185), 'Ağrı', 'ID 9185 Ağrı');
assertEqual(getCityNameById(99999), null, 'Bilinmeyen ID null döner');
assertEqual(getCityNameById(null), null, 'null parametre null döner');
assertEqual(getCityNameById(0), null, 'Sıfır ID null döner');

// Test 5: getCityIndexById fonksiyonu
console.log('\n5. getCityIndexById Testleri:');
assertEqual(getCityIndexById(9146), 0, 'Adana (ilk il) index 0');
assertEqual(getCityIndexById(10142), 80, 'Zonguldak (son il) index 80');
assertEqual(getCityIndexById(9206), 6, 'Ankara index 6');
assertEqual(getCityIndexById(99999), -1, 'Bilinmeyen ID -1 döner');
assertEqual(getCityIndexById(null), -1, 'null parametre -1 döner');

// Test 6: Türkçe karakterler
console.log('\n6. Türkçe Karakter Testleri:');
assert(TURKEY_CITIES.some(c => c.name === 'Ağrı'), 'Ağrı Türkçe karakterle mevcut');
assert(TURKEY_CITIES.some(c => c.name === 'Çanakkale'), 'Çanakkale Türkçe karakterle mevcut');
assert(TURKEY_CITIES.some(c => c.name === 'İstanbul'), 'İstanbul Türkçe karakterle mevcut');
assert(TURKEY_CITIES.some(c => c.name === 'Şanlıurfa'), 'Şanlıurfa Türkçe karakterle mevcut');
assert(TURKEY_CITIES.some(c => c.name === 'Muğla'), 'Muğla Türkçe karakterle mevcut');
assert(TURKEY_CITIES.some(c => c.name === 'Kütahya'), 'Kütahya Türkçe karakterle mevcut');

// Test 7: ID'lerin benzersizliği
console.log('\n7. ID Benzersizlik Testi:');
const ids = TURKEY_CITIES.map(c => c.id);
const uniqueIds = new Set(ids);
assertEqual(ids.length, uniqueIds.size, 'Tüm ID\'ler benzersiz');

// Test 8: İsimlerin benzersizliği
console.log('\n8. İsim Benzersizlik Testi:');
const names = TURKEY_CITIES.map(c => c.name);
const uniqueNames = new Set(names);
assertEqual(names.length, uniqueNames.size, 'Tüm il isimleri benzersiz');

// Test 9: PRAYER_NAMES - id alanı
console.log('\n9. PRAYER_NAMES - ID Alanı Testleri:');
assertEqual(PRAYER_NAMES.length, 6, '6 namaz vakti tanımlı');
assertEqual(PRAYER_NAMES[0].id, 'imsak', 'İlk vakit id\'si imsak');
assertEqual(PRAYER_NAMES[0].name, 'İmsak', 'İlk vakit adı İmsak');
assertEqual(PRAYER_NAMES[0].apiKey, 'Fajr', 'İlk vakit apiKey\'i Fajr');
assertEqual(PRAYER_NAMES[5].id, 'yatsi', 'Son vakit id\'si yatsi');

// id'lerin benzersizliği
const prayerIds = PRAYER_NAMES.map(p => p.id);
const uniquePrayerIds = new Set(prayerIds);
assertEqual(prayerIds.length, uniquePrayerIds.size, 'Tüm namaz vakti id\'leri benzersiz');

// Test 10: getPrayerById fonksiyonu
console.log('\n10. getPrayerById Testleri:');
const imsak = getPrayerById('imsak');
assertEqual(imsak.name, 'İmsak', 'getPrayerById imsak doğru');
assertEqual(imsak.apiKey, 'Fajr', 'getPrayerById apiKey doğru');

const ogle = getPrayerById('ogle');
assertEqual(ogle.name, 'Öğle', 'getPrayerById ogle doğru');

const notFound = getPrayerById('nonexistent');
assertEqual(notFound, null, 'Bilinmeyen id null döner');

// Test 11: getPrayerApiKeyMap fonksiyonu
console.log('\n11. getPrayerApiKeyMap Testleri:');
const apiKeyMap = getPrayerApiKeyMap();
assertEqual(apiKeyMap['imsak'], 'Fajr', 'API key map imsak -> Fajr');
assertEqual(apiKeyMap['gunes'], 'Sunrise', 'API key map gunes -> Sunrise');
assertEqual(apiKeyMap['ogle'], 'Dhuhr', 'API key map ogle -> Dhuhr');
assertEqual(apiKeyMap['ikindi'], 'Asr', 'API key map ikindi -> Asr');
assertEqual(apiKeyMap['aksam'], 'Maghrib', 'API key map aksam -> Maghrib');
assertEqual(apiKeyMap['yatsi'], 'Isha', 'API key map yatsi -> Isha');
assertEqual(Object.keys(apiKeyMap).length, 6, 'API key map 6 giriş içerir');

// Test 12: CALCULATION_METHODS
console.log('\n12. CALCULATION_METHODS Testleri:');
assertEqual(CALCULATION_METHODS.length, 24, '24 hesaplama metodu tanımlı');
assertEqual(CALCULATION_METHODS[0].id, 0, 'İlk metot id\'si 0');
const diyanet = CALCULATION_METHODS.find(m => m.id === 13);
assert(diyanet !== undefined, 'Diyanet metodu (id=13) mevcut');
assert(diyanet.name.includes('Diyanet'), 'Diyanet metodu adı doğru');
const custom = CALCULATION_METHODS.find(m => m.id === 99);
assert(custom !== undefined, 'Custom metot (id=99) mevcut');

// id benzersizliği
const methodIds = CALCULATION_METHODS.map(m => m.id);
const uniqueMethodIds = new Set(methodIds);
assertEqual(methodIds.length, uniqueMethodIds.size, 'Tüm metot id\'leri benzersiz');

// Test 13: LOCATION_MODES
console.log('\n13. LOCATION_MODES Testleri:');
assertEqual(LOCATION_MODES.values.length, 2, '2 konum modu');
assertEqual(LOCATION_MODES.values[0], 'city', 'İlk mod city');
assertEqual(LOCATION_MODES.values[1], 'coordinates', 'İkinci mod coordinates');
assertEqual(LOCATION_MODES.labels.length, 2, '2 etiket');

// Test 14: ERROR_CODES
console.log('\n14. ERROR_CODES Testleri:');
assertEqual(ERROR_CODES.INVALID_LOCATION, 'INVALID_LOCATION', 'INVALID_LOCATION sabiti doğru');

// Test 14b: LOCATION_STATUS
console.log('\n14b. LOCATION_STATUS Testleri:');
assertEqual(LOCATION_STATUS.UNKNOWN, 'unknown', 'UNKNOWN sabiti doğru');
assertEqual(LOCATION_STATUS.VALID, 'valid', 'VALID sabiti doğru');
assertEqual(LOCATION_STATUS.INVALID_COUNTRY, 'invalid_country', 'INVALID_COUNTRY sabiti doğru');
assertEqual(LOCATION_STATUS.INVALID_CITY, 'invalid_city', 'INVALID_CITY sabiti doğru');
assertEqual(LOCATION_STATUS.EMPTY_COUNTRY, 'empty_country', 'EMPTY_COUNTRY sabiti doğru');
assertEqual(LOCATION_STATUS.EMPTY_CITY, 'empty_city', 'EMPTY_CITY sabiti doğru');
assertEqual(LOCATION_STATUS.NETWORK_ERROR, 'network_error', 'NETWORK_ERROR sabiti doğru');
assertEqual(LOCATION_STATUS.API_ERROR, 'api_error', 'API_ERROR sabiti doğru');
assertEqual(Object.keys(LOCATION_STATUS).length, 8, 'LOCATION_STATUS 8 durum içerir');

// Test 15: getIndexFromValue ve getValueFromIndex
console.log('\n15. Index/Value Dönüşüm Testleri:');
assertEqual(getIndexFromValue(PANEL_POSITIONS, 'left'), 0, 'left index 0');
assertEqual(getIndexFromValue(PANEL_POSITIONS, 'center'), 1, 'center index 1');
assertEqual(getIndexFromValue(PANEL_POSITIONS, 'right'), 2, 'right index 2');
assertEqual(getIndexFromValue(PANEL_POSITIONS, 'unknown'), 0, 'bilinmeyen değer varsayılan 0');

assertEqual(getValueFromIndex(PANEL_POSITIONS, 0), 'left', 'index 0 = left');
assertEqual(getValueFromIndex(PANEL_POSITIONS, 1), 'center', 'index 1 = center');
assertEqual(getValueFromIndex(PANEL_POSITIONS, 2), 'right', 'index 2 = right');
assertEqual(getValueFromIndex(PANEL_POSITIONS, 99), 'left', 'geçersiz index varsayılan left');

assertEqual(getIndexFromValue(LOCATION_MODES, 'city'), 0, 'city index 0');
assertEqual(getIndexFromValue(LOCATION_MODES, 'coordinates'), 1, 'coordinates index 1');
assertEqual(getValueFromIndex(LOCATION_MODES, 0), 'city', 'index 0 = city');
assertEqual(getValueFromIndex(LOCATION_MODES, 1), 'coordinates', 'index 1 = coordinates');

// Test 16: getCalculationMethodIndex ve getCalculationMethodById
console.log('\n16. Hesaplama Metodu Yardımcı Testleri:');
const diyanetIndex = getCalculationMethodIndex(13);
assert(diyanetIndex >= 0, 'Diyanet metodu index\'i bulunur');
assertEqual(CALCULATION_METHODS[diyanetIndex].id, 13, 'Index ile Diyanet metodu erişilir');

const isnaIndex = getCalculationMethodIndex(2);
assert(isnaIndex >= 0, 'ISNA metodu index\'i bulunur');

assertEqual(getCalculationMethodIndex(999), -1, 'Bilinmeyen metot -1 döner');

const methodByIdx = getCalculationMethodById(diyanetIndex);
assertEqual(methodByIdx.id, 13, 'getCalculationMethodById doğru metot döner');

const fallbackMethod = getCalculationMethodById(999);
assertEqual(fallbackMethod.id, 13, 'Geçersiz index Diyanet\'e geri düşer');

// Sonuç
console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
