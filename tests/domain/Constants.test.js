// Constants birim testleri
// TURKEY_CITIES ve versiyon sabitleri

// Constants'tan kopyalanan değerler (test için bağımsız)
const APP_VERSION = '0.6.2';
const APP_VERSION_CODE = 17;
const APP_NAME = 'praytime@erho.dev';
const APP_USER_AGENT = `${APP_NAME}/${APP_VERSION}`;
const APP_DEVELOPER = '@erhanurgun';
const APP_WEBSITE = 'https://erho.me';

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
assertEqual(APP_VERSION, '0.6.2', 'APP_VERSION doğru');
assertEqual(APP_VERSION_CODE, 17, 'APP_VERSION_CODE doğru');
assertEqual(APP_NAME, 'praytime@erho.dev', 'APP_NAME doğru');
assertEqual(APP_USER_AGENT, 'praytime@erho.dev/0.6.2', 'APP_USER_AGENT doğru format');
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

// Sonuç
console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
