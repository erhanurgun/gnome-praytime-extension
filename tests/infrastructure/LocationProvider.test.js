// LocationProvider birim testleri
// GLib/GObject bağımlılığı olmadan çalışır

const { MockSettings } = require('../mocks/MockSettings.js');

// Location sınıfının kopyası (test için bağımsız)
class Location {
    constructor(id, cityName, regionName = null) {
        this._id = id;
        this._cityName = cityName;
        this._regionName = regionName;
    }

    get id() { return this._id; }
    get cityName() { return this._cityName; }
    get regionName() { return this._regionName; }

    static getDefault() {
        return new Location(9185, 'Ağrı', 'Ağrı');
    }

    isValid() {
        return typeof this._id === 'number' && this._id > 0;
    }

    toString() {
        if (this._regionName && this._regionName !== this._cityName) {
            return `${this._cityName}/${this._regionName}`;
        }
        return this._cityName || 'Bilinmeyen Konum';
    }
}

// LocationProvider sınıfının kopyası (test için bağımsız)
class LocationProvider {
    constructor(settings) {
        this._settings = settings;
    }

    getLocation() {
        const locationId = this._settings.get_int('location-id');
        const cityName = this._settings.get_string('city-name');
        const regionName = this._settings.get_string('region-name');

        if (!locationId || locationId <= 0) {
            return Location.getDefault();
        }

        return new Location(locationId, cityName, regionName);
    }

    destroy() {
        this._settings = null;
    }
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
console.log('\n=== LocationProvider Testleri ===\n');

// Test 1: Constructor ve settings injection
console.log('1. Constructor ve Settings Injection:');
const mockSettings1 = new MockSettings();
const provider1 = new LocationProvider(mockSettings1);
assert(provider1._settings !== null, 'Settings inject edildi');
assert(provider1._settings === mockSettings1, 'Doğru settings referansı');

// Test 2: Geçerli konum döndürme
console.log('\n2. Geçerli Konum Döndürme:');
const mockSettings2 = new MockSettings({
    'location-id': 9206,
    'city-name': 'Ankara',
    'region-name': 'Çankaya'
});
const provider2 = new LocationProvider(mockSettings2);
const location2 = provider2.getLocation();
assertEqual(location2.id, 9206, 'Doğru ID döndü');
assertEqual(location2.cityName, 'Ankara', 'Doğru şehir adı döndü');
assertEqual(location2.regionName, 'Çankaya', 'Doğru bölge adı döndü');
assert(location2.isValid(), 'Konum geçerli');

// Test 3: Geçersiz ID için varsayılan konum
console.log('\n3. Geçersiz ID için Varsayılan Konum:');
const mockSettings3 = new MockSettings({
    'location-id': 0,
    'city-name': 'Test',
    'region-name': 'Test'
});
const provider3 = new LocationProvider(mockSettings3);
const location3 = provider3.getLocation();
assertEqual(location3.id, 9185, 'Varsayılan ID (Ağrı) döndü');
assertEqual(location3.cityName, 'Ağrı', 'Varsayılan şehir Ağrı');

// Test 4: Negatif ID için varsayılan konum
console.log('\n4. Negatif ID için Varsayılan Konum:');
const mockSettings4 = new MockSettings({
    'location-id': -5,
    'city-name': 'Geçersiz',
    'region-name': 'Geçersiz'
});
const provider4 = new LocationProvider(mockSettings4);
const location4 = provider4.getLocation();
assertEqual(location4.id, 9185, 'Negatif ID için varsayılan döndü');

// Test 5: Boş settings
console.log('\n5. Boş Settings:');
const mockSettings5 = new MockSettings();
const provider5 = new LocationProvider(mockSettings5);
const location5 = provider5.getLocation();
assertEqual(location5.id, 9185, 'Boş settings için varsayılan döndü');
assert(location5.isValid(), 'Varsayılan konum geçerli');

// Test 6: destroy metodu
console.log('\n6. destroy() Metodu:');
const mockSettings6 = new MockSettings({
    'location-id': 9594,
    'city-name': 'İstanbul',
    'region-name': 'Kadıköy'
});
const provider6 = new LocationProvider(mockSettings6);
assert(provider6._settings !== null, 'destroy() öncesi settings mevcut');
provider6.destroy();
assertEqual(provider6._settings, null, 'destroy() sonrası settings temizlendi');

// Test 7: Bölge adı olmadan konum
console.log('\n7. Bölge Adı Olmadan Konum:');
const mockSettings7 = new MockSettings({
    'location-id': 9635,
    'city-name': 'İzmir',
    'region-name': ''
});
const provider7 = new LocationProvider(mockSettings7);
const location7 = provider7.getLocation();
assertEqual(location7.id, 9635, 'ID doğru');
assertEqual(location7.cityName, 'İzmir', 'Şehir adı doğru');
assertEqual(location7.regionName, '', 'Bölge adı boş');

// Test 8: Settings değişikliği sonrası yeni konum
console.log('\n8. Settings Değişikliği Sonrası Yeni Konum:');
const mockSettings8 = new MockSettings({
    'location-id': 9206,
    'city-name': 'Ankara',
    'region-name': 'Ankara'
});
const provider8 = new LocationProvider(mockSettings8);
const firstLocation = provider8.getLocation();
assertEqual(firstLocation.cityName, 'Ankara', 'İlk konum Ankara');

// Settings'i güncelle
mockSettings8.set_int('location-id', 9594);
mockSettings8.set_string('city-name', 'İstanbul');
mockSettings8.set_string('region-name', 'Beşiktaş');

const secondLocation = provider8.getLocation();
assertEqual(secondLocation.cityName, 'İstanbul', 'Güncel konum İstanbul');
assertEqual(secondLocation.regionName, 'Beşiktaş', 'Güncel bölge Beşiktaş');

// Test 9: Türkçe karakterli şehir adları
console.log('\n9. Türkçe Karakterli Şehir Adları:');
const turkishCities = [
    { id: 9185, city: 'Ağrı', region: 'Ağrı' },
    { id: 9381, city: 'Çanakkale', region: 'Çanakkale' },
    { id: 9594, city: 'İstanbul', region: 'Üsküdar' },
    { id: 9989, city: 'Şanlıurfa', region: 'Şanlıurfa' },
    { id: 9880, city: 'Muğla', region: 'Muğla' }
];

for (const tc of turkishCities) {
    const settings = new MockSettings({
        'location-id': tc.id,
        'city-name': tc.city,
        'region-name': tc.region
    });
    const provider = new LocationProvider(settings);
    const location = provider.getLocation();
    assertEqual(location.cityName, tc.city, `${tc.city} Türkçe karakterlerle doğru`);
}

// Sonuç
console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
