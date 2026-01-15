// Location birim testleri
// GLib/GObject bağımlılığı olmadan çalışır

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

    static fromApiResponse(data) {
        return new Location(data.id, data.city, data.region || data.city);
    }

    toString() {
        if (this._regionName && this._regionName !== this._cityName) {
            return `${this._cityName}/${this._regionName}`;
        }
        return this._cityName || 'Bilinmeyen Konum';
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

// Test 1: Constructor ve getter'lar
console.log('1. Constructor ve Getter Testleri:');
const loc = new Location(123, 'Ankara', 'Çankaya');
assertEqual(loc.id, 123, 'id getter doğru çalışır');
assertEqual(loc.cityName, 'Ankara', 'cityName getter doğru çalışır');
assertEqual(loc.regionName, 'Çankaya', 'regionName getter doğru çalışır');

// Test 2: getDefault statik metodu
console.log('\n2. getDefault Testi:');
const defaultLoc = Location.getDefault();
assertEqual(defaultLoc.id, 9185, 'Varsayılan konum ID\'si 9185');
assertEqual(defaultLoc.cityName, 'Ağrı', 'Varsayılan şehir Ağrı');

// Test 3: isValid kontrolü
console.log('\n3. isValid Kontrol Testleri:');
const validLoc = new Location(100, 'İstanbul', 'Kadıköy');
assertEqual(validLoc.isValid(), true, 'Geçerli ID (100) geçerli konum');

const invalidLoc1 = new Location(0, 'Test', 'Test');
assertEqual(invalidLoc1.isValid(), false, 'ID=0 geçersiz konum');

const invalidLoc2 = new Location(-5, 'Test', 'Test');
assertEqual(invalidLoc2.isValid(), false, 'Negatif ID geçersiz konum');

const invalidLoc3 = new Location('abc', 'Test', 'Test');
assertEqual(invalidLoc3.isValid(), false, 'String ID geçersiz konum');

const invalidLoc4 = new Location(null, 'Test', 'Test');
assertEqual(invalidLoc4.isValid(), false, 'null ID geçersiz konum');

// Test 4: fromApiResponse statik metodu
console.log('\n4. fromApiResponse Testleri:');
const apiData = {
    id: 456,
    city: 'İstanbul',
    region: 'Beşiktaş',
    country: 'TÜRKİYE'
};
const fromApi = Location.fromApiResponse(apiData);
assertEqual(fromApi.id, 456, 'API\'den ID doğru alınır');
assertEqual(fromApi.cityName, 'İstanbul', 'API\'den city doğru alınır');
assertEqual(fromApi.regionName, 'Beşiktaş', 'API\'den region doğru alınır');

// Region olmayan API yanıtı
const apiDataNoRegion = {
    id: 789,
    city: 'Ankara',
    country: 'TÜRKİYE'
};
const fromApiNoRegion = Location.fromApiResponse(apiDataNoRegion);
assertEqual(fromApiNoRegion.regionName, 'Ankara', 'Region yoksa city kullanılır');

// Test 5: toString metodu
console.log('\n5. toString Testleri:');
const locDifferentRegion = new Location(1, 'İstanbul', 'Kadıköy');
assertEqual(locDifferentRegion.toString(), 'İstanbul/Kadıköy', 'Farklı region: City/Region');

const locSameRegion = new Location(2, 'Ankara', 'Ankara');
assertEqual(locSameRegion.toString(), 'Ankara', 'Aynı region: Sadece city');

const locNoRegion = new Location(3, 'İzmir', null);
assertEqual(locNoRegion.toString(), 'İzmir', 'null region: Sadece city');

const locNoCity = new Location(4, null, null);
assertEqual(locNoCity.toString(), 'Bilinmeyen Konum', 'Boş konum: Varsayılan metin');

const locEmptyCity = new Location(5, '', '');
assertEqual(locEmptyCity.toString(), 'Bilinmeyen Konum', 'Boş string: Varsayılan metin');

// Sonuç
console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
