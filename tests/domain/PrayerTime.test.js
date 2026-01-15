// PrayerTime birim testleri
// GLib/GObject bağımlılığı olmadan çalışır

// PrayerTime sınıfının kopyası (test için bağımsız)
class PrayerTime {
    constructor(name, nameEn, time) {
        this._name = name;
        this._nameEn = nameEn;
        this._time = time instanceof Date ? time : new Date(time);
    }

    get name() { return this._name; }
    get nameEn() { return this._nameEn; }
    get time() { return this._time; }

    get timeString() {
        const hours = this._time.getHours().toString().padStart(2, '0');
        const minutes = this._time.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    getSecondsUntil(fromDate = new Date()) {
        return Math.floor((this._time.getTime() - fromDate.getTime()) / 1000);
    }

    isPassed(fromDate = new Date()) {
        return fromDate >= this._time;
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
console.log('\n=== PrayerTime Testleri ===\n');

// Test 1: Constructor ve getter'lar
console.log('1. Constructor ve Getter Testleri:');
const testDate = new Date(2026, 0, 16, 5, 30, 0);
const prayer = new PrayerTime('İmsak', 'Fajr', testDate);

assertEqual(prayer.name, 'İmsak', 'name getter doğru çalışır');
assertEqual(prayer.nameEn, 'Fajr', 'nameEn getter doğru çalışır');
assert(prayer.time instanceof Date, 'time getter Date nesnesi döndürür');

// Test 2: timeString formatlama
console.log('\n2. timeString Formatlama Testleri:');
assertEqual(prayer.timeString, '05:30', 'timeString doğru formatlanır (05:30)');

const noonPrayer = new PrayerTime('Öğle', 'Dhuhr', new Date(2026, 0, 16, 12, 45, 0));
assertEqual(noonPrayer.timeString, '12:45', 'timeString doğru formatlanır (12:45)');

const midnightPrayer = new PrayerTime('Test', 'Test', new Date(2026, 0, 16, 0, 5, 0));
assertEqual(midnightPrayer.timeString, '00:05', 'timeString gece yarısı doğru (00:05)');

// Test 3: isPassed kontrolü
console.log('\n3. isPassed Kontrolü Testleri:');
const prayerAt10 = new PrayerTime('Test', 'Test', new Date(2026, 0, 16, 10, 0, 0));

const beforeTime = new Date(2026, 0, 16, 9, 0, 0);
assertEqual(prayerAt10.isPassed(beforeTime), false, 'Vakit öncesi geçmemiş olarak döndürülür');

const afterTime = new Date(2026, 0, 16, 11, 0, 0);
assertEqual(prayerAt10.isPassed(afterTime), true, 'Vakit sonrası geçmiş olarak döndürülür');

const exactTime = new Date(2026, 0, 16, 10, 0, 0);
assertEqual(prayerAt10.isPassed(exactTime), true, 'Tam vakitte geçmiş olarak döndürülür');

// Test 4: getSecondsUntil hesaplama
console.log('\n4. getSecondsUntil Hesaplama Testleri:');
const targetTime = new Date(2026, 0, 16, 10, 0, 0);
const targetPrayer = new PrayerTime('Test', 'Test', targetTime);

const from930 = new Date(2026, 0, 16, 9, 30, 0);
assertEqual(targetPrayer.getSecondsUntil(from930), 1800, '30 dakika = 1800 saniye');

const from945 = new Date(2026, 0, 16, 9, 45, 0);
assertEqual(targetPrayer.getSecondsUntil(from945), 900, '15 dakika = 900 saniye');

const from1030 = new Date(2026, 0, 16, 10, 30, 0);
assertEqual(targetPrayer.getSecondsUntil(from1030), -1800, 'Geçmiş vakit negatif değer');

// Test 5: String'den Date oluşturma
console.log('\n5. String Constructor Testi:');
const isoString = '2026-01-16T14:30:00';
const prayerFromString = new PrayerTime('İkindi', 'Asr', isoString);
assert(prayerFromString.time instanceof Date, 'ISO string Date\'e dönüştürülür');
assertEqual(prayerFromString.timeString, '14:30', 'String\'den oluşturulan vakit doğru');

// Sonuç
console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
