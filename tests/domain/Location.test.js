// Location birim testleri
// GLib/GObject bağımlılığı olmadan çalışır

// Location sınıfının kopyası (test için bağımsız)
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
console.log('\n=== Location Testleri ===\n');

// Test 1: City modu - Constructor ve getter'lar
console.log('1. City Modu - Constructor ve Getter Testleri:');
const loc = new Location({ mode: 'city', id: 123, cityName: 'Ankara', countryName: 'Turkey', regionName: 'Çankaya' });
assertEqual(loc.mode, 'city', 'mode getter doğru çalışır');
assertEqual(loc.id, 123, 'id getter doğru çalışır');
assertEqual(loc.cityName, 'Ankara', 'cityName getter doğru çalışır');
assertEqual(loc.countryName, 'Turkey', 'countryName getter doğru çalışır');
assertEqual(loc.regionName, 'Çankaya', 'regionName getter doğru çalışır');
assertEqual(loc.isCityMode, true, 'isCityMode doğru');
assertEqual(loc.isCoordinateMode, false, 'isCoordinateMode false');

// Test 2: Coordinates modu - Constructor ve getter'lar
console.log('\n2. Coordinates Modu - Constructor ve Getter Testleri:');
const coordLoc = new Location({ mode: 'coordinates', latitude: 41.0082, longitude: 28.9784 });
assertEqual(coordLoc.mode, 'coordinates', 'mode getter doğru');
assertEqual(coordLoc.latitude, 41.0082, 'latitude getter doğru');
assertEqual(coordLoc.longitude, 28.9784, 'longitude getter doğru');
assertEqual(coordLoc.isCityMode, false, 'isCityMode false');
assertEqual(coordLoc.isCoordinateMode, true, 'isCoordinateMode doğru');

// Test 3: getDefault statik metodu
console.log('\n3. getDefault Testi:');
const defaultLoc = Location.getDefault();
assertEqual(defaultLoc.id, 9185, 'Varsayılan konum ID\'si 9185');
assertEqual(defaultLoc.cityName, 'Ağrı', 'Varsayılan şehir Ağrı');
assertEqual(defaultLoc.countryName, 'Turkey', 'Varsayılan ülke Turkey');
assertEqual(defaultLoc.mode, 'city', 'Varsayılan mod city');

// Test 4: isValid - City modu
console.log('\n4. isValid - City Modu Testleri:');
const validCity = new Location({ mode: 'city', cityName: 'İstanbul', countryName: 'Turkey' });
assertEqual(validCity.isValid(), true, 'Geçerli city modu konumu');

const noCity = new Location({ mode: 'city', cityName: '', countryName: 'Turkey' });
assertEqual(noCity.isValid(), false, 'Boş cityName geçersiz');

const noCountry = new Location({ mode: 'city', cityName: 'Berlin', countryName: '' });
assertEqual(noCountry.isValid(), false, 'Boş countryName geçersiz');

const noBoth = new Location({ mode: 'city', cityName: '', countryName: '' });
assertEqual(noBoth.isValid(), false, 'Her ikisi boş geçersiz');

// Test 5: isValid - Coordinates modu
console.log('\n5. isValid - Coordinates Modu Testleri:');
const validCoord = new Location({ mode: 'coordinates', latitude: 51.5074, longitude: -0.1278 });
assertEqual(validCoord.isValid(), true, 'Geçerli koordinat (Londra)');

const borderCoord = new Location({ mode: 'coordinates', latitude: 90, longitude: 180 });
assertEqual(borderCoord.isValid(), true, 'Sınır değerler geçerli (90, 180)');

const negativeBorder = new Location({ mode: 'coordinates', latitude: -90, longitude: -180 });
assertEqual(negativeBorder.isValid(), true, 'Negatif sınır değerler geçerli (-90, -180)');

const outOfRangeLat = new Location({ mode: 'coordinates', latitude: 91, longitude: 28 });
assertEqual(outOfRangeLat.isValid(), false, 'Latitude 91 geçersiz');

const outOfRangeLng = new Location({ mode: 'coordinates', latitude: 41, longitude: 181 });
assertEqual(outOfRangeLng.isValid(), false, 'Longitude 181 geçersiz');

const nanCoord = new Location({ mode: 'coordinates', latitude: NaN, longitude: 28 });
assertEqual(nanCoord.isValid(), false, 'NaN latitude geçersiz');

const infiniteCoord = new Location({ mode: 'coordinates', latitude: Infinity, longitude: 28 });
assertEqual(infiniteCoord.isValid(), false, 'Infinity latitude geçersiz');

const stringCoord = new Location({ mode: 'coordinates', latitude: '41', longitude: 28 });
assertEqual(stringCoord.isValid(), false, 'String latitude geçersiz');

// Test 6: toString - City modu
console.log('\n6. toString - City Modu Testleri:');
const locDifferentRegion = new Location({ mode: 'city', cityName: 'İstanbul', regionName: 'Kadıköy' });
assertEqual(locDifferentRegion.toString(), 'İstanbul/Kadıköy', 'Farklı region: City/Region');

const locSameRegion = new Location({ mode: 'city', cityName: 'Ankara', regionName: 'Ankara' });
assertEqual(locSameRegion.toString(), 'Ankara', 'Aynı region: Sadece city');

const locNoRegion = new Location({ mode: 'city', cityName: 'İzmir' });
assertEqual(locNoRegion.toString(), 'İzmir', 'null region: Sadece city');

const locNoCity = new Location({ mode: 'city' });
assertEqual(locNoCity.toString(), 'Unknown Location', 'Boş konum: Varsayılan metin');

// Test 7: toString - Coordinates modu
console.log('\n7. toString - Coordinates Modu Testleri:');
const coordStr = new Location({ mode: 'coordinates', latitude: 41.0082, longitude: 28.9784 });
assertEqual(coordStr.toString(), '41.0082, 28.9784', 'Koordinat formatı doğru');

const negCoordStr = new Location({ mode: 'coordinates', latitude: -33.8688, longitude: 151.2093 });
assertEqual(negCoordStr.toString(), '-33.8688, 151.2093', 'Negatif koordinat formatı doğru');

// Test 8: Varsayılan değerler
console.log('\n8. Varsayılan Değerler Testi:');
const emptyLoc = new Location();
assertEqual(emptyLoc.mode, 'city', 'Varsayılan mod city');
assertEqual(emptyLoc.id, 0, 'Varsayılan id 0');
assertEqual(emptyLoc.cityName, '', 'Varsayılan cityName boş');
assertEqual(emptyLoc.countryName, 'Turkey', 'Varsayılan countryName Turkey');
assertEqual(emptyLoc.regionName, null, 'Varsayılan regionName null');
assertEqual(emptyLoc.latitude, 0, 'Varsayılan latitude 0');
assertEqual(emptyLoc.longitude, 0, 'Varsayılan longitude 0');

// Sonuç
console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
