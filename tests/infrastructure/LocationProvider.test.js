// LocationProvider birim testleri
// GLib/GObject bağımlılığı olmadan çalışır

const { MockSettings } = require('../mocks/MockSettings.js');

// Location sınıfının kopyası (test için bağımsız) - options object constructor
class Location {
    constructor({ mode = 'city', id = 0, cityName = '', countryName = 'Turkey', regionName = null, latitude = 0, longitude = 0 } = {}) {
        this._mode = mode;
        this._id = id;
        this._cityName = cityName;
        this._countryName = countryName;
        this._regionName = regionName;
        this._latitude = latitude;
        this._longitude = longitude;
    }

    get mode() { return this._mode; }
    get id() { return this._id; }
    get cityName() { return this._cityName; }
    get countryName() { return this._countryName; }
    get regionName() { return this._regionName; }
    get latitude() { return this._latitude; }
    get longitude() { return this._longitude; }
    get isCityMode() { return this._mode === 'city'; }
    get isCoordinateMode() { return this._mode === 'coordinates'; }

    static getDefault() {
        return new Location({
            mode: 'city',
            id: 9185,
            cityName: 'Ağrı',
            countryName: 'Turkey',
            regionName: 'Ağrı',
        });
    }

    isValid() {
        if (this._mode === 'coordinates') {
            return (
                typeof this._latitude === 'number' &&
                typeof this._longitude === 'number' &&
                Number.isFinite(this._latitude) &&
                Number.isFinite(this._longitude) &&
                this._latitude >= -90 && this._latitude <= 90 &&
                this._longitude >= -180 && this._longitude <= 180
            );
        }
        return (
            typeof this._cityName === 'string' &&
            this._cityName.length > 0 &&
            typeof this._countryName === 'string' &&
            this._countryName.length > 0
        );
    }

    toString() {
        if (this._mode === 'coordinates') {
            return `${this._latitude.toFixed(4)}, ${this._longitude.toFixed(4)}`;
        }
        if (this._regionName && this._regionName !== this._cityName) {
            return `${this._cityName}/${this._regionName}`;
        }
        return this._cityName || 'Unknown Location';
    }
}

// LocationProvider sınıfının kopyası (test için bağımsız) - yeni mod desteği
class LocationProvider {
    constructor(settings) {
        this._settings = settings;
    }

    getLocation() {
        const mode = this._settings.get_string('location-mode');

        if (mode === 'coordinates') {
            return this._getCoordinateLocation();
        }

        return this._getCityLocation();
    }

    _getCityLocation() {
        const locationId = this._settings.get_int('location-id');
        const cityName = this._settings.get_string('city-name');
        const countryName = this._settings.get_string('country-name');
        const regionName = this._settings.get_string('region-name');

        if (!locationId || locationId <= 0) {
            return Location.getDefault();
        }

        return new Location({
            mode: 'city',
            id: locationId,
            cityName,
            countryName: countryName || 'Turkey',
            regionName,
        });
    }

    _getCoordinateLocation() {
        const latitude = this._settings.get_double('latitude');
        const longitude = this._settings.get_double('longitude');

        return new Location({
            mode: 'coordinates',
            latitude,
            longitude,
        });
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

// Test 2: City modu - Geçerli konum döndürme
console.log('\n2. City Modu - Geçerli Konum Döndürme:');
const mockSettings2 = new MockSettings({
    'location-mode': 'city',
    'location-id': 9206,
    'city-name': 'Ankara',
    'country-name': 'Turkey',
    'region-name': 'Çankaya'
});
const provider2 = new LocationProvider(mockSettings2);
const location2 = provider2.getLocation();
assertEqual(location2.mode, 'city', 'Mod city');
assertEqual(location2.id, 9206, 'Doğru ID döndü');
assertEqual(location2.cityName, 'Ankara', 'Doğru şehir adı döndü');
assertEqual(location2.countryName, 'Turkey', 'Doğru ülke adı döndü');
assertEqual(location2.regionName, 'Çankaya', 'Doğru bölge adı döndü');
assert(location2.isValid(), 'Konum geçerli');
assert(location2.isCityMode, 'isCityMode doğru');

// Test 3: Geçersiz ID için varsayılan konum
console.log('\n3. Geçersiz ID için Varsayılan Konum:');
const mockSettings3 = new MockSettings({
    'location-mode': 'city',
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
    'location-mode': 'city',
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
    'location-mode': 'city',
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
    'location-mode': 'city',
    'location-id': 9635,
    'city-name': 'İzmir',
    'country-name': 'Turkey',
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
    'location-mode': 'city',
    'location-id': 9206,
    'city-name': 'Ankara',
    'country-name': 'Turkey',
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
        'location-mode': 'city',
        'location-id': tc.id,
        'city-name': tc.city,
        'country-name': 'Turkey',
        'region-name': tc.region
    });
    const provider = new LocationProvider(settings);
    const location = provider.getLocation();
    assertEqual(location.cityName, tc.city, `${tc.city} Türkçe karakterlerle doğru`);
}

// Test 10: Coordinates modu
console.log('\n10. Coordinates Modu:');
const mockSettings10 = new MockSettings({
    'location-mode': 'coordinates',
    'latitude': 51.5074,
    'longitude': -0.1278,
});
const provider10 = new LocationProvider(mockSettings10);
const location10 = provider10.getLocation();
assertEqual(location10.mode, 'coordinates', 'Mod coordinates');
assertEqual(location10.latitude, 51.5074, 'Latitude doğru');
assertEqual(location10.longitude, -0.1278, 'Longitude doğru');
assert(location10.isCoordinateMode, 'isCoordinateMode doğru');
assert(location10.isValid(), 'Koordinat konumu geçerli');

// Test 11: Coordinates modu - farklı değerler
console.log('\n11. Coordinates Modu - Farklı Değerler:');
const mockSettings11 = new MockSettings({
    'location-mode': 'coordinates',
    'latitude': -33.8688,
    'longitude': 151.2093,
});
const provider11 = new LocationProvider(mockSettings11);
const location11 = provider11.getLocation();
assertEqual(location11.latitude, -33.8688, 'Negatif latitude doğru');
assertEqual(location11.longitude, 151.2093, 'Pozitif longitude doğru');

// Test 12: Mod değişikliği
console.log('\n12. Mod Değişikliği:');
const mockSettings12 = new MockSettings({
    'location-mode': 'city',
    'location-id': 9206,
    'city-name': 'Ankara',
    'country-name': 'Turkey',
    'region-name': 'Ankara',
    'latitude': 39.9334,
    'longitude': 32.8597,
});
const provider12 = new LocationProvider(mockSettings12);
const cityLoc = provider12.getLocation();
assertEqual(cityLoc.mode, 'city', 'Başlangıçta city modu');

mockSettings12.set_string('location-mode', 'coordinates');
const coordLoc = provider12.getLocation();
assertEqual(coordLoc.mode, 'coordinates', 'Mod değişikliği sonrası coordinates');
assertEqual(coordLoc.latitude, 39.9334, 'Koordinat modunda latitude doğru');

// Test 13: Farklı ülke
console.log('\n13. Farklı Ülke:');
const mockSettings13 = new MockSettings({
    'location-mode': 'city',
    'location-id': 1,
    'city-name': 'Berlin',
    'country-name': 'Germany',
    'region-name': '',
});
const provider13 = new LocationProvider(mockSettings13);
const location13 = provider13.getLocation();
assertEqual(location13.cityName, 'Berlin', 'Farklı ülke şehri doğru');
assertEqual(location13.countryName, 'Germany', 'Farklı ülke adı doğru');
assert(location13.isValid(), 'Farklı ülke konumu geçerli');

// Sonuç
console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
