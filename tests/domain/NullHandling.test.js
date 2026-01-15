// Null Handling birim testleri
// Crash önleme için null/undefined durumları

// PrayerSchedule sınıfının kopyası
class PrayerSchedule {
    constructor(prayers = []) {
        this._prayers = prayers;
        this._date = new Date();
    }

    get prayers() { return this._prayers; }
    get date() { return this._date; }

    static fromApiResponse(data, date = new Date()) {
        if (!data || typeof data !== 'object') {
            return new PrayerSchedule([]);
        }

        const PRAYER_NAMES = [
            { name: 'İmsak', nameEn: 'Imsak', apiKey: 'fajr' },
            { name: 'Güneş', nameEn: 'Sunrise', apiKey: 'sun' },
            { name: 'Öğle', nameEn: 'Dhuhr', apiKey: 'dhuhr' },
            { name: 'İkindi', nameEn: 'Asr', apiKey: 'asr' },
            { name: 'Akşam', nameEn: 'Maghrib', apiKey: 'maghrib' },
            { name: 'Yatsı', nameEn: 'Isha', apiKey: 'isha' },
        ];

        const prayers = PRAYER_NAMES.map(p => {
            const timeStr = data[p.name];
            if (!timeStr) return null;

            const [hours, minutes] = timeStr.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) return null;

            const prayerDate = new Date(date);
            prayerDate.setHours(hours, minutes, 0, 0);

            return { name: p.name, time: prayerDate };
        }).filter(p => p !== null);

        const schedule = new PrayerSchedule(prayers);
        schedule._date = date;
        return schedule;
    }

    getNextPrayer(fromDate = new Date()) {
        if (!this._prayers || this._prayers.length === 0) return null;
        for (const prayer of this._prayers) {
            if (prayer.time > fromDate) {
                return prayer;
            }
        }
        return null;
    }

    getCurrentPrayer(fromDate = new Date()) {
        if (!this._prayers || this._prayers.length === 0) return null;
        let current = null;
        for (const prayer of this._prayers) {
            if (prayer.time <= fromDate) {
                current = prayer;
            } else {
                break;
            }
        }
        return current;
    }

    getPrayerByName(name) {
        if (!this._prayers || !name) return undefined;
        return this._prayers.find(p => p.name === name);
    }
}

// Location sınıfının kopyası
class Location {
    constructor(id, cityName, regionName = null) {
        this._id = id;
        this._cityName = cityName;
        this._regionName = regionName;
    }

    get id() { return this._id; }
    get cityName() { return this._cityName; }
    get regionName() { return this._regionName; }

    isValid() {
        return typeof this._id === 'number' && this._id > 0 && Number.isFinite(this._id);
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
console.log('\n=== Null Handling Testleri ===\n');

// Test 1: Boş API yanıtı
console.log('1. Boş API Yanıtı Testleri:');
const emptySchedule1 = PrayerSchedule.fromApiResponse(null, new Date());
assertEqual(emptySchedule1.prayers.length, 0, 'null ile boş schedule oluşur');

const emptySchedule2 = PrayerSchedule.fromApiResponse(undefined, new Date());
assertEqual(emptySchedule2.prayers.length, 0, 'undefined ile boş schedule oluşur');

const emptySchedule3 = PrayerSchedule.fromApiResponse({}, new Date());
assertEqual(emptySchedule3.prayers.length, 0, 'Boş object ile boş schedule oluşur');

// Test 2: Kısmi API yanıtı
console.log('\n2. Kısmi API Yanıtı Testleri:');
const partialData = {
    'İmsak': '05:30',
    'Öğle': '12:30',
    // Diğer vakitler eksik
};
const partialSchedule = PrayerSchedule.fromApiResponse(partialData, new Date(2026, 0, 16));
assertEqual(partialSchedule.prayers.length, 2, 'Kısmi veri ile sadece mevcut vakitler oluşur');

// Test 3: Geçersiz saat formatı
console.log('\n3. Geçersiz Saat Formatı Testleri:');
const invalidData = {
    'İmsak': 'invalid',
    'Güneş': '07:00',
    'Öğle': null,
    'İkindi': '',
    'Akşam': '18:00',
    'Yatsı': 'xx:yy',
};
const invalidSchedule = PrayerSchedule.fromApiResponse(invalidData, new Date(2026, 0, 16));
assertEqual(invalidSchedule.prayers.length, 2, 'Geçersiz saat formatları filtrelenir');

// Test 4: Boş schedule ile metodlar
console.log('\n4. Boş Schedule Metod Testleri:');
const emptySchedule = new PrayerSchedule([]);
assertEqual(emptySchedule.getNextPrayer(), null, 'Boş schedule için getNextPrayer null döner');
assertEqual(emptySchedule.getCurrentPrayer(), null, 'Boş schedule için getCurrentPrayer null döner');
assertEqual(emptySchedule.getPrayerByName('İmsak'), undefined, 'Boş schedule için getPrayerByName undefined döner');

// Test 5: Null/undefined parametreler
console.log('\n5. Null/Undefined Parametre Testleri:');
const validSchedule = PrayerSchedule.fromApiResponse({
    'İmsak': '05:30',
    'Güneş': '07:00',
}, new Date(2026, 0, 16));

assertEqual(validSchedule.getPrayerByName(null), undefined, 'getPrayerByName(null) undefined döner');
assertEqual(validSchedule.getPrayerByName(undefined), undefined, 'getPrayerByName(undefined) undefined döner');
assertEqual(validSchedule.getPrayerByName(''), undefined, 'getPrayerByName("") undefined döner');

// Test 6: Location null kontrolleri
console.log('\n6. Location Null Kontrolleri:');
const nullLocation = new Location(null, null, null);
assertEqual(nullLocation.isValid(), false, 'null id ile location geçersiz');
assertEqual(nullLocation.toString(), 'Bilinmeyen Konum', 'null city ile toString varsayılan döner');

const undefinedLocation = new Location(undefined, undefined, undefined);
assertEqual(undefinedLocation.isValid(), false, 'undefined id ile location geçersiz');

// Test 7: Edge case'ler
console.log('\n7. Edge Case Testleri:');
const nanLocation = new Location(NaN, 'Test', 'Test');
assertEqual(nanLocation.isValid(), false, 'NaN id ile location geçersiz');

const infinityLocation = new Location(Infinity, 'Test', 'Test');
assertEqual(infinityLocation.isValid(), false, 'Infinity id ile location geçersiz');

const negativeLocation = new Location(-1, 'Test', 'Test');
assertEqual(negativeLocation.isValid(), false, 'Negatif id ile location geçersiz');

const zeroLocation = new Location(0, 'Test', 'Test');
assertEqual(zeroLocation.isValid(), false, 'Sıfır id ile location geçersiz');

// Sonuç
console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
