// PrayerSchedule birim testleri
// GLib/GObject bağımlılığı olmadan çalışır

// PrayerTime sınıfının kopyası
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

// PRAYER_NAMES sabiti (test için)
const PRAYER_NAMES = [
    { name: 'İmsak', nameEn: 'Fajr', apiKey: 'fajr' },
    { name: 'Güneş', nameEn: 'Sunrise', apiKey: 'sun' },
    { name: 'Öğle', nameEn: 'Dhuhr', apiKey: 'dhuhr' },
    { name: 'İkindi', nameEn: 'Asr', apiKey: 'asr' },
    { name: 'Akşam', nameEn: 'Maghrib', apiKey: 'maghrib' },
    { name: 'Yatsı', nameEn: 'Isha', apiKey: 'isha' },
];

// PrayerSchedule sınıfının kopyası
class PrayerSchedule {
    constructor(prayers = []) {
        this._prayers = prayers;
        this._date = new Date();
    }

    get prayers() { return this._prayers; }
    get date() { return this._date; }

    static fromApiResponse(data, date = new Date()) {
        const prayers = PRAYER_NAMES.map(p => {
            const timeStr = data[p.name];
            if (!timeStr) return null;

            const [hours, minutes] = timeStr.split(':').map(Number);
            const prayerDate = new Date(date);
            prayerDate.setHours(hours, minutes, 0, 0);

            return new PrayerTime(p.name, p.nameEn, prayerDate);
        }).filter(p => p !== null);

        const schedule = new PrayerSchedule(prayers);
        schedule._date = date;
        return schedule;
    }

    getNextPrayer(fromDate = new Date()) {
        for (const prayer of this._prayers) {
            if (!prayer.isPassed(fromDate)) {
                return prayer;
            }
        }
        return null;
    }

    getCurrentPrayer(fromDate = new Date()) {
        let current = null;
        for (const prayer of this._prayers) {
            if (prayer.isPassed(fromDate)) {
                current = prayer;
            } else {
                break;
            }
        }
        return current;
    }

    getPrayerByName(name) {
        return this._prayers.find(p => p.name === name || p.nameEn === name);
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

// Test verisi
const testApiData = {
    'İmsak': '05:30',
    'Güneş': '07:00',
    'Öğle': '12:30',
    'İkindi': '15:30',
    'Akşam': '18:00',
    'Yatsı': '19:30'
};

const testDate = new Date(2026, 0, 16, 0, 0, 0);

// Testler
console.log('\n=== PrayerSchedule Testleri ===\n');

// Test 1: fromApiResponse
console.log('1. fromApiResponse Testleri:');
const schedule = PrayerSchedule.fromApiResponse(testApiData, testDate);
assertEqual(schedule.prayers.length, 6, '6 vakit oluşturulur');
assertEqual(schedule.prayers[0].name, 'İmsak', 'İlk vakit İmsak');
assertEqual(schedule.prayers[0].timeString, '05:30', 'İmsak vakti 05:30');
assertEqual(schedule.prayers[5].name, 'Yatsı', 'Son vakit Yatsı');

// Test 2: getNextPrayer
console.log('\n2. getNextPrayer Testleri:');
const at0600 = new Date(2026, 0, 16, 6, 0, 0);
const nextAt0600 = schedule.getNextPrayer(at0600);
assertEqual(nextAt0600.name, 'Güneş', 'Saat 06:00\'da sonraki vakit Güneş');

const at1200 = new Date(2026, 0, 16, 12, 0, 0);
const nextAt1200 = schedule.getNextPrayer(at1200);
assertEqual(nextAt1200.name, 'Öğle', 'Saat 12:00\'da sonraki vakit Öğle');

const at2000 = new Date(2026, 0, 16, 20, 0, 0);
const nextAt2000 = schedule.getNextPrayer(at2000);
assertEqual(nextAt2000, null, 'Tüm vakitler geçtikten sonra null döner');

const at0400 = new Date(2026, 0, 16, 4, 0, 0);
const nextAt0400 = schedule.getNextPrayer(at0400);
assertEqual(nextAt0400.name, 'İmsak', 'Günün başında sonraki vakit İmsak');

// Test 3: getCurrentPrayer
console.log('\n3. getCurrentPrayer Testleri:');
const current0600 = schedule.getCurrentPrayer(at0600);
assertEqual(current0600.name, 'İmsak', 'Saat 06:00\'da aktif vakit İmsak');

const current1300 = schedule.getCurrentPrayer(new Date(2026, 0, 16, 13, 0, 0));
assertEqual(current1300.name, 'Öğle', 'Saat 13:00\'da aktif vakit Öğle');

const current0400 = schedule.getCurrentPrayer(at0400);
assertEqual(current0400, null, 'Gün başında hiç vakit geçmemiş, null döner');

const current2100 = schedule.getCurrentPrayer(new Date(2026, 0, 16, 21, 0, 0));
assertEqual(current2100.name, 'Yatsı', 'Gün sonunda aktif vakit Yatsı');

// Test 4: getPrayerByName
console.log('\n4. getPrayerByName Testleri:');
const ogle = schedule.getPrayerByName('Öğle');
assertEqual(ogle.name, 'Öğle', 'Türkçe isimle vakit bulunur');
assertEqual(ogle.timeString, '12:30', 'Bulunan vaktin saati doğru');

const dhuhr = schedule.getPrayerByName('Dhuhr');
assertEqual(dhuhr.name, 'Öğle', 'İngilizce isimle vakit bulunur');

const notFound = schedule.getPrayerByName('Teheccüd');
assertEqual(notFound, undefined, 'Olmayan vakit undefined döner');

// Test 5: Eksik veri ile fromApiResponse
console.log('\n5. Eksik Veri Testleri:');
const partialData = {
    'İmsak': '05:30',
    'Öğle': '12:30',
    'Akşam': '18:00'
};
const partialSchedule = PrayerSchedule.fromApiResponse(partialData, testDate);
assertEqual(partialSchedule.prayers.length, 3, 'Sadece mevcut vakitler oluşturulur');

// Sonuç
console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
